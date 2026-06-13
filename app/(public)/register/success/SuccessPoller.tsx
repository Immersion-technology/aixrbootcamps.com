"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PollState = "checking" | "paid" | "pending" | "failed";

const NEXT_STEPS = [
  { n: "1", t: "Check your email", d: "Confirmation + PDF receipt within 60 seconds. If it doesn't arrive, check spam and ping us." },
  { n: "2", t: "Save the date", d: "27 July – 4 September 2026, Mon–Fri, 9am–1:30pm. We'll WhatsApp the venue + drop-off details two weeks before." },
  { n: "3", t: "Bring your kid + curiosity + lunch", d: "T-shirt and all materials are included. Pack lunch, snacks and a water bottle. Optional laptop rental if you ticked that box." },
];

export default function SuccessPoller({ reference }: { reference: string }) {
  const [status, setStatus] = useState<PollState>(reference ? "checking" : "failed");
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;
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

  return (
    <section className="relative min-h-[80vh] dot-grid pt-12 pb-24 flex items-center">
      <div className="max-w-[640px] mx-auto px-5 sm:px-7 w-full">
        {status === "checking" && <CheckingHero />}
        {status === "paid" && <PaidView registrationId={registrationId} />}
        {status === "failed" && <FailedView />}
        {status === "pending" && <PendingView />}
      </div>
    </section>
  );
}

/* ----- CHECKING: neutral, never claims success ----- */
function CheckingHero() {
  return (
    <div className="frosted-glass rounded-3xl px-8 sm:px-12 py-14 text-center anim-fade-up">
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-violet-brand inline-block anim-pulse" />
        <span className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand">CONFIRMING PAYMENT</span>
      </div>
      <h1 className="font-bubble text-[clamp(30px,4.6vw,46px)] leading-[1.05] tracking-tight text-ink mb-3">
        Hang tight…
      </h1>
      <p className="text-[14px] text-neutral-700 max-w-[420px] mx-auto leading-relaxed">
        We&apos;re confirming your payment with Paystack. This usually takes a few seconds, don&apos;t close this page.
      </p>
    </div>
  );
}

/* ----- PAID: the celebration ----- */
function PaidView({ registrationId }: { registrationId: string | null }) {
  return (
    <>
      <div className="relative card-sticker card-sticker--green card-sticker--no-tilt px-8 sm:px-12 py-12 sm:py-14 text-center anim-fade-up overflow-hidden">
        <span aria-hidden className="absolute left-1/2 top-[68px] -translate-x-1/2 w-40 h-40 rounded-full bg-white/30 blur-2xl anim-pulse" />
        <div className="relative font-bubble text-[88px] leading-none mb-3 text-ink">✓</div>
        <div className="text-[10.5px] font-bold tracking-[.22em] text-ink/70 mb-2">PAYMENT CONFIRMED</div>
        <h1 className="font-bubble text-[clamp(34px,5vw,52px)] leading-[1] tracking-tight mb-3 text-ink">
          You&apos;re in.
        </h1>
        {registrationId && (
          <div className="inline-block mt-1 frosted-glass-dark rounded-2xl px-6 py-3">
            <div className="text-[10px] font-bold tracking-[.22em] text-white/70 mb-1">REGISTRATION ID</div>
            <div className="font-accent font-extrabold text-[22px] sm:text-[26px] tracking-wide">{registrationId}</div>
          </div>
        )}
      </div>

      <div className="mt-7 frosted-glass rounded-3xl p-7 anim-fade-up delay-2">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep mb-4">WHAT HAPPENS NEXT</div>
        <ol className="space-y-4">
          {NEXT_STEPS.map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="shrink-0 w-9 h-9 rounded-full frosted-glass-dark flex items-center justify-center font-accent font-extrabold text-[15px]">
                {step.n}
              </span>
              <div>
                <div className="font-semibold text-[14px]">{step.t}</div>
                <p className="text-[13px] text-neutral-700 leading-relaxed mt-0.5">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center anim-fade-up delay-3">
        <Link href="/account/login" className="btn-dark">Open parent portal <span aria-hidden>→</span></Link>
        <Link href="/" className="btn-light">Back home</Link>
      </div>
    </>
  );
}

/* ----- FAILED / CANCELLED ----- */
function FailedView() {
  return (
    <>
      <div className="relative card-sticker card-sticker--ink card-sticker--no-tilt px-8 sm:px-12 py-12 sm:py-14 text-center anim-fade-up overflow-hidden">
        <span aria-hidden className="absolute left-1/2 top-[60px] -translate-x-1/2 w-40 h-40 rounded-full bg-aqua-brand/20 blur-2xl anim-pulse" />
        <div className="relative font-bubble text-[80px] leading-none mb-3 text-white/80">✕</div>
        <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 mb-2">PAYMENT NOT COMPLETED</div>
        <h1 className="font-bubble text-[clamp(32px,5vw,48px)] leading-[1] tracking-tight mb-3 text-white">
          That didn&apos;t go through.
        </h1>
        <p className="text-[14px] text-white/85 max-w-[440px] mx-auto leading-relaxed">
          <strong>No money was deducted.</strong> Your slot isn&apos;t held until payment lands, try again to lock it in.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center anim-fade-up delay-1">
        <Link href="/register" className="btn-grass">Try again <span aria-hidden>→</span></Link>
        <Link href="/contact" className="btn-light">Talk to a human</Link>
      </div>
    </>
  );
}

/* ----- PENDING: webhook slow / no callback yet ----- */
function PendingView() {
  return (
    <>
      <div className="frosted-glass rounded-3xl px-8 sm:px-12 py-12 text-center anim-fade-up">
        <div className="text-[10.5px] font-bold tracking-[.2em] text-violet-brand mb-2">⌛ STILL CONFIRMING</div>
        <h1 className="font-bubble text-[clamp(28px,4.4vw,44px)] leading-[1.05] tracking-tight text-ink mb-3">
          Hang on a moment.
        </h1>
        <p className="text-[14px] text-neutral-700 max-w-[440px] mx-auto leading-relaxed">
          Paystack is taking longer than usual to confirm. If you completed payment, watch for your confirmation email in the next few minutes, no need to pay again. If you didn&apos;t finish, you can retry.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center anim-fade-up delay-1">
        <Link href="/account/login" className="btn-dark">Check parent portal <span aria-hidden>→</span></Link>
        <Link href="/register" className="btn-light">Pay again</Link>
        <Link href="/contact" className="btn-light">Contact us</Link>
      </div>
    </>
  );
}
