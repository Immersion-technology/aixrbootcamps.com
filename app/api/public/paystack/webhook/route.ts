import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { reconcileAndConfirm } from "@/lib/confirm-payment";

export const dynamic = "force-dynamic";

// Paystack signs the RAW request body as HMAC-SHA512(secretKey, rawBody) and
// sends the lowercase hex digest in the `x-paystack-signature` header. We must
// verify against the raw body, not the parsed JSON.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Paystack reliably emits `charge.success` for completed payments. Acknowledge
  // anything else with 200 so Paystack doesn't retry. Failed/abandoned attempts
  // are handled by the success-page redirect verify, not by webhook.
  if (event?.event !== "charge.success") {
    return NextResponse.json({ ok: true, ignored: event?.event });
  }

  const reference: string | undefined = event?.data?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  try {
    const result = await reconcileAndConfirm(reference, { rawPayload: event, by: "paystack" });

    if (result.status === "no_match") return NextResponse.json({ ok: true, noMatch: true });
    if (result.status === "ignored") return NextResponse.json({ ok: true, ignored: result.reason });
    return NextResponse.json({ ok: true, duplicate: result.alreadyPaid });
  } catch (e) {
    // 500 so Paystack retries; don't drop a legitimate payment on a transient
    // failure (e.g. the verify call or DB write threw).
    console.error("[paystack webhook]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
