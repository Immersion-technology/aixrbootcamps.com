"use client";

import { useEffect, useState } from "react";

export default function SuccessPoller({ reference }: { reference: string }) {
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "failed">("checking");
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }
    let attempts = 0;
    let cancelled = false;

    const tick = async () => {
      attempts += 1;
      try {
        const r = await fetch(`/api/public/registrations/${encodeURIComponent(reference)}/status`, { cache: "no-store" });
        const json = await r.json();
        if (cancelled) return;
        if (json.paymentStatus === "paid") {
          setRegistrationId(json.registrationId);
          setStatus("paid");
          return;
        }
        if (json.paymentStatus === "failed") {
          setStatus("failed");
          return;
        }
        if (attempts < 20) setTimeout(tick, 1500);
        else setStatus("pending");
      } catch {
        if (attempts < 20) setTimeout(tick, 1500);
        else setStatus("pending");
      }
    };

    tick();
    return () => { cancelled = true; };
  }, [reference]);

  if (status === "checking") {
    return (
      <div className="frosted-glass rounded-2xl px-5 py-4 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-violet-brand inline-block anim-pulse" />
        <span className="text-[13px] text-neutral-700 font-medium">Confirming payment with Monnify…</span>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="ticket-card frosted-glass-dark rounded-2xl px-6 py-5 text-center anim-glow">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 mb-2">REGISTRATION ID</div>
        <div className="font-accent font-extrabold text-[26px] sm:text-[30px] tracking-wide">{registrationId}</div>
        <p className="text-[12px] text-white/70 mt-2.5">Save this, you&apos;ll need it for any future enquiry.</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="frosted-glass rounded-2xl px-5 py-4">
        <div className="text-[10.5px] font-bold tracking-[.18em] text-violet-brand mb-1.5">⌛ STILL CONFIRMING</div>
        <p className="text-[13px] text-neutral-700">
          Monnify is taking longer than usual. If you don&apos;t see a confirmation email in 10 minutes, email us with your transaction reference.
        </p>
      </div>
    );
  }

  return (
    <div className="frosted-glass rounded-2xl px-5 py-4 border border-pink-deep/30">
      <div className="text-[10.5px] font-bold tracking-[.18em] text-pink-deep mb-1.5">⚠ COULDN&apos;T CONFIRM</div>
      <p className="text-[13px] text-neutral-700">
        Something went wrong confirming this payment. Please contact us with your transaction reference.
      </p>
    </div>
  );
}
