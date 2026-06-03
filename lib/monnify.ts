import crypto from "crypto";

// ---------------------------------------------------------------------------
// Monnify (Moniepoint) payment gateway client.
//
// Differs from a typical secret-key gateway (e.g. Paystack) in two ways:
//   1. Auth is OAuth: POST Basic base64(apiKey:secretKey) to /auth/login to
//      mint a short-lived bearer token, then send it on every other call. The
//      token is cached in module scope and refreshed just before expiry.
//   2. Amounts are in naira (decimal), NOT kobo. This app stores kobo, so we
//      convert at the call boundary (pass amountNaira = kobo / 100).
//
// Webhooks are signed as HMAC-SHA512(secretKey, rawBody) in the
// `monnify-signature` header. Same algorithm Paystack used, different header.
// ---------------------------------------------------------------------------

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY ?? "";
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY ?? "";
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE ?? "";
const MONNIFY_BASE = (process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com").replace(/\/+$/, "");

interface MonnifyEnvelope<T> {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: T;
}

async function monnifyRequest<T>(
  method: string,
  path: string,
  body: unknown,
  authHeader: string
): Promise<MonnifyEnvelope<T>> {
  const r = await fetch(`${MONNIFY_BASE}${path}`, {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let data: MonnifyEnvelope<T>;
  try {
    data = (await r.json()) as MonnifyEnvelope<T>;
  } catch {
    throw new Error("Failed to parse Monnify response");
  }
  return data;
}

// --- Access token (cached) -------------------------------------------------
interface LoginResponseBody {
  accessToken: string;
  expiresIn: number; // seconds
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Returns a valid Monnify bearer token, minting a fresh one when none is
 * cached or the cached one is within 60s of expiry.
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.value;
  }

  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    throw new Error("Monnify is not configured (missing API key or secret key)");
  }

  const basic = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString("base64");

  const result = await monnifyRequest<LoginResponseBody>(
    "POST",
    "/api/v1/auth/login",
    undefined,
    `Basic ${basic}`
  );

  if (!result.requestSuccessful || !result.responseBody?.accessToken) {
    throw new Error(result.responseMessage || "Failed to authenticate with Monnify");
  }

  const { accessToken, expiresIn } = result.responseBody;
  cachedToken = {
    value: accessToken,
    expiresAt: now + (Number(expiresIn) || 3600) * 1000,
  };
  return accessToken;
}

async function authedRequest<T>(method: string, path: string, body?: unknown): Promise<MonnifyEnvelope<T>> {
  const token = await getAccessToken();
  return monnifyRequest<T>(method, path, body, `Bearer ${token}`);
}

// --- Initialize transaction ------------------------------------------------
interface InitResponseBody {
  transactionReference: string;
  paymentReference: string;
  checkoutUrl: string;
}

interface InitOpts {
  email: string;
  amountNaira: number;
  reference: string;
  customerName: string;
  redirectUrl: string;
  metadata?: Record<string, unknown>;
}

export interface MonnifyInitResponse {
  checkoutUrl: string;
  paymentReference: string;
  transactionReference: string;
}

/**
 * Initialize a one-time payment. We pass our own `reference` as the
 * paymentReference (must be globally unique) so the existing
 * registration → webhook → status-poll correlation keeps working.
 * `amountNaira` is in naira (e.g. 150000), NOT kobo.
 */
export async function initTransaction(opts: InitOpts): Promise<MonnifyInitResponse> {
  if (!MONNIFY_CONTRACT_CODE) {
    throw new Error("Monnify is not configured (missing contract code)");
  }

  const result = await authedRequest<InitResponseBody>(
    "POST",
    "/api/v1/merchant/transactions/init-transaction",
    {
      amount: opts.amountNaira,
      currencyCode: "NGN",
      customerEmail: opts.email,
      customerName: opts.customerName || opts.email,
      paymentReference: opts.reference,
      paymentDescription: "IMMERSIA Summer Tech Boot Camp",
      contractCode: MONNIFY_CONTRACT_CODE,
      redirectUrl: opts.redirectUrl,
      metaData: opts.metadata,
    }
  );

  if (!result.requestSuccessful || !result.responseBody?.checkoutUrl) {
    throw new Error(result.responseMessage || "Failed to initialize Monnify transaction");
  }

  return {
    checkoutUrl: result.responseBody.checkoutUrl,
    paymentReference: result.responseBody.paymentReference,
    transactionReference: result.responseBody.transactionReference,
  };
}

// --- Verify / get transaction status --------------------------------------
export type MonnifyPaymentStatus =
  | "PAID"
  | "OVERPAID"
  | "PARTIALLY_PAID"
  | "PENDING"
  | "ABANDONED"
  | "CANCELLED"
  | "FAILED"
  | "REVERSED"
  | "EXPIRED";

interface TransactionStatusBody {
  transactionReference: string;
  paymentReference: string;
  amountPaid: number | string;
  totalPayable?: number | string;
  paymentStatus: MonnifyPaymentStatus;
  currencyCode?: string;
  currency?: string;
  metaData?: Record<string, unknown>;
  customer?: { email?: string; name?: string };
}

export interface NormalizedTransaction {
  transactionReference: string;
  paymentReference: string;
  amountPaid: number;
  paymentStatus: MonnifyPaymentStatus;
  currency: string;
  metaData: Record<string, unknown>;
  customerEmail: string;
}

/**
 * Source-of-truth status query. Always call this before acting on a redirect
 * or webhook.
 *
 * Monnify's `/api/v2/merchant/transactions/query` endpoint accepts EITHER a
 * Monnify transactionReference (`MNFY|...`) or our own paymentReference. The
 * checkout redirect sometimes hands back only the paymentReference (notably for
 * bank-transfer), so we detect which we were given and query on the matching
 * param. The response always carries both references back.
 */
export async function getTransactionStatus(reference: string): Promise<NormalizedTransaction> {
  const param = /^MNFY/i.test(reference) ? "transactionReference" : "paymentReference";
  const result = await authedRequest<TransactionStatusBody>(
    "GET",
    `/api/v2/merchant/transactions/query?${param}=${encodeURIComponent(reference)}`
  );

  if (!result.requestSuccessful || !result.responseBody) {
    throw new Error(result.responseMessage || "Failed to fetch Monnify transaction status");
  }

  const b = result.responseBody;
  return {
    transactionReference: b.transactionReference,
    paymentReference: b.paymentReference,
    amountPaid: Number(b.amountPaid) || 0,
    paymentStatus: b.paymentStatus,
    currency: b.currencyCode || b.currency || "NGN",
    metaData: b.metaData || {},
    customerEmail: b.customer?.email || "",
  };
}

// --- Webhook signature -----------------------------------------------------
/**
 * Monnify signs the raw request body as HMAC-SHA512(secretKey, rawBody) and
 * sends the lowercase hex digest in the `monnify-signature` header. Constant
 * time comparison, length-checked first.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!MONNIFY_SECRET_KEY) return false;
  if (typeof signature !== "string" || !/^[0-9a-f]+$/i.test(signature)) return false;

  const expected = crypto.createHmac("sha512", MONNIFY_SECRET_KEY).update(rawBody).digest();

  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
