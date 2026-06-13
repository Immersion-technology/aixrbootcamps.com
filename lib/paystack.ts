import crypto from "crypto";

// ---------------------------------------------------------------------------
// Paystack payment gateway client.
//
// Simpler than an OAuth gateway: every request is authenticated with a single
// `Authorization: Bearer <secret key>` header, so there's no token to mint or
// cache. Amounts are in KOBO (the smallest unit), which is exactly how this app
// stores its pricing, so there's no naira<->kobo conversion at the boundary.
//
// Webhooks are signed as HMAC-SHA512(secretKey, rawBody) and the lowercase hex
// digest is sent in the `x-paystack-signature` header — verify against the raw
// body, never the parsed JSON.
// ---------------------------------------------------------------------------

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? "";
const PAYSTACK_BASE = "https://api.paystack.co";

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystackRequest<T>(method: string, path: string, body?: unknown): Promise<PaystackEnvelope<T>> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack is not configured (missing PAYSTACK_SECRET_KEY)");
  }

  const r = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let data: PaystackEnvelope<T>;
  try {
    data = (await r.json()) as PaystackEnvelope<T>;
  } catch {
    throw new Error("Failed to parse Paystack response");
  }
  return data;
}

// --- Initialize transaction ------------------------------------------------
interface InitResponseBody {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface InitOpts {
  email: string;
  amountKobo: number;
  reference: string;
  customerName: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Initialize a one-time payment. We pass our own globally-unique `reference`
 * (the registration's paymentReference) so the existing
 * registration → webhook → status-poll correlation keeps working.
 * `amountKobo` is in kobo (e.g. 15000000 for ₦150,000).
 */
export async function initTransaction(opts: InitOpts): Promise<PaystackInitResponse> {
  const result = await paystackRequest<InitResponseBody>("POST", "/transaction/initialize", {
    email: opts.email,
    amount: opts.amountKobo,
    currency: "NGN",
    reference: opts.reference,
    callback_url: opts.callbackUrl,
    metadata: {
      ...opts.metadata,
      custom_fields: [
        {
          display_name: "Customer name",
          variable_name: "customer_name",
          value: opts.customerName || opts.email,
        },
      ],
    },
  });

  if (!result.status || !result.data?.authorization_url) {
    throw new Error(result.message || "Failed to initialize Paystack transaction");
  }

  return {
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
    reference: result.data.reference,
  };
}

// --- Verify / get transaction status --------------------------------------
export type PaystackPaymentStatus = "success" | "failed" | "abandoned" | "pending" | "reversed" | "ongoing";

interface TransactionStatusBody {
  reference: string;
  amount: number; // kobo
  currency?: string;
  status: PaystackPaymentStatus;
  channel?: string;
  paid_at?: string | null;
  customer?: { email?: string };
}

export interface NormalizedTransaction {
  reference: string;
  amount: number; // kobo
  status: PaystackPaymentStatus;
  currency: string;
  channel: string;
  customerEmail: string;
  paidAt: string | null;
}

/**
 * Source-of-truth status query. Always call this before acting on a redirect
 * or webhook — the webhook body is signed but the verify endpoint is the only
 * place that authoritatively reports amount, currency and final status.
 */
export async function verifyTransaction(reference: string): Promise<NormalizedTransaction> {
  const result = await paystackRequest<TransactionStatusBody>(
    "GET",
    `/transaction/verify/${encodeURIComponent(reference)}`
  );

  if (!result.status || !result.data) {
    throw new Error(result.message || "Failed to verify Paystack transaction");
  }

  const b = result.data;
  return {
    reference: b.reference,
    amount: Number(b.amount) || 0,
    status: b.status,
    currency: b.currency || "NGN",
    channel: b.channel || "",
    customerEmail: b.customer?.email || "",
    paidAt: b.paid_at ?? null,
  };
}

// --- Webhook signature -----------------------------------------------------
/**
 * Paystack signs the raw request body as HMAC-SHA512(secretKey, rawBody) and
 * sends the lowercase hex digest in the `x-paystack-signature` header. Constant
 * time comparison, length-checked first.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!PAYSTACK_SECRET_KEY) return false;
  if (typeof signature !== "string" || !/^[0-9a-f]+$/i.test(signature)) return false;

  const expected = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest();

  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
