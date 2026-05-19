import Link from "next/link";
import SuccessPoller from "./SuccessPoller";

export default function SuccessPage({ searchParams }: { searchParams: { reference?: string } }) {
  const ref = searchParams.reference ?? "";

  return (
    <section className="relative min-h-[80vh] dot-grid pt-12 pb-24 flex items-center">
      <div className="max-w-[640px] mx-auto px-5 sm:px-7 w-full">
        {/* HERO CARD — green sticker celebrates the moment */}
        <div className="relative card-sticker card-sticker--green card-sticker--no-tilt px-8 sm:px-12 py-12 sm:py-14 text-center anim-fade-up overflow-hidden">
          <span aria-hidden className="absolute left-1/2 top-[68px] -translate-x-1/2 w-40 h-40 rounded-full bg-white/30 blur-2xl anim-pulse" />
          <div className="relative font-bubble text-[88px] leading-none mb-3 text-ink">✓</div>
          <div className="text-[10.5px] font-bold tracking-[.22em] text-ink/70 mb-2">PAYMENT CONFIRMED</div>
          <h1 className="font-bubble text-[clamp(34px,5vw,52px)] leading-[1] tracking-tight mb-3 text-ink">
            You&apos;re in.
          </h1>
          <p className="text-[14px] text-ink/85 max-w-[420px] mx-auto leading-relaxed">
            We&apos;re finalising your registration with Paystack. A confirmation email + PDF receipt is on its way.
          </p>
        </div>

        {/* POLLER — registration ID lands here */}
        <div className="mt-5 anim-fade-up delay-1">
          <SuccessPoller reference={ref} />
        </div>

        {/* WHAT'S NEXT */}
        <div className="mt-7 frosted-glass rounded-3xl p-7 anim-fade-up delay-2">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep mb-4">WHAT HAPPENS NEXT</div>
          <ol className="space-y-4">
            {[
              { n: "1", t: "Check your email", d: "Confirmation + PDF receipt within 60 seconds. If it doesn't arrive, check spam and ping us." },
              { n: "2", t: "Save the date", d: "27 July – 21 August 2026, Mon–Fri, 10am–2:30pm. We'll WhatsApp the venue + drop-off details two weeks before." },
              { n: "3", t: "Bring your kid + curiosity", d: "Lunch, t-shirt and all materials are included. Optional laptop rental if you ticked that box." },
            ].map((step) => (
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

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center anim-fade-up delay-3">
          <Link href="/" className="btn-dark">Back home <span>→</span></Link>
          <Link href="/contact" className="btn-light">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
