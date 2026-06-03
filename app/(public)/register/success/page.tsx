import SuccessPoller from "./SuccessPoller";

export const dynamic = "force-dynamic";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { paymentReference?: string; transactionReference?: string; reference?: string };
}) {
  // Monnify appends ?paymentReference=…&transactionReference=… to the redirect.
  // We key our records off our own paymentReference; `reference` is a legacy
  // fallback. The poller below decides what to show (paid / failed / pending) —
  // we never optimistically claim success here, since Monnify redirects to this
  // same URL on success, failure AND cancel.
  const ref = searchParams.paymentReference ?? searchParams.reference ?? "";

  return <SuccessPoller reference={ref} />;
}
