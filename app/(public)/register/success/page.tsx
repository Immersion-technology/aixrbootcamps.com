import SuccessPoller from "./SuccessPoller";
import { reconcileAndConfirm } from "@/lib/confirm-payment";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Registration confirmed",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { reference?: string; trxref?: string; paymentReference?: string };
}) {
  // Paystack appends ?trxref=…&reference=… to the callback URL. We key our
  // records off our own paymentReference, which we passed to Paystack as the
  // `reference`. (`paymentReference` is kept as a legacy fallback.)
  const ref = searchParams.reference ?? searchParams.trxref ?? searchParams.paymentReference ?? "";

  // Verify server-side the instant the camper lands back here — this confirms
  // the payment independent of webhook latency. Idempotent and source-of-truth
  // (it re-queries Paystack's verify endpoint). Best-effort: if it throws, the
  // poller below still picks up the webhook-driven status.
  if (ref) {
    try {
      await reconcileAndConfirm(ref, { by: "system", rawPayload: { source: "success_redirect" } });
    } catch (err) {
      console.error("[success verify]", err);
    }
  }

  return <SuccessPoller reference={ref} />;
}
