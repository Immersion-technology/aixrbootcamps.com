import Link from "next/link";

export default function FailedPage() {
  return (
    <section className="relative min-h-[80vh] dot-grid pt-12 pb-24 flex items-center">
      <div className="max-w-[640px] mx-auto px-5 sm:px-7 w-full">
        <div className="relative card-sticker card-sticker--ink card-sticker--no-tilt px-8 sm:px-12 py-12 sm:py-14 text-center anim-fade-up overflow-hidden">
          <span aria-hidden className="absolute left-1/2 top-[60px] -translate-x-1/2 w-40 h-40 rounded-full bg-aqua-brand/20 blur-2xl anim-pulse" />
          <div className="relative font-bubble text-[80px] leading-none mb-3 text-white/80">✕</div>
          <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 mb-2">PAYMENT NOT COMPLETED</div>
          <h1 className="font-bubble text-[clamp(32px,5vw,48px)] leading-[1] tracking-tight mb-3 text-white">
            That didn&apos;t go through.
          </h1>
          <p className="text-[14px] text-white/85 max-w-[440px] mx-auto leading-relaxed">
            <strong>No money was deducted.</strong> Your slot isn&apos;t held until payment lands — try again to lock it in before someone else does.
          </p>
        </div>

        <div className="mt-7 frosted-glass rounded-3xl p-7 anim-fade-up delay-1">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep mb-3">WHAT TO DO</div>
          <ul className="space-y-3 text-[13.5px] text-neutral-700">
            <li className="flex gap-3"><span className="text-aqua-deep font-bold">→</span> <span>Check that your card has funds and that international payments are enabled.</span></li>
            <li className="flex gap-3"><span className="text-aqua-deep font-bold">→</span> <span>Try again — your details are still in the form, just resubmit.</span></li>
            <li className="flex gap-3"><span className="text-aqua-deep font-bold">→</span> <span>Or pay by bank transfer / USSD — both options on Paystack&apos;s checkout page.</span></li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center anim-fade-up delay-2">
          <Link href="/register" className="btn-grass">Try again <span aria-hidden>→</span></Link>
          <Link href="/contact" className="btn-light">Talk to a human</Link>
        </div>
      </div>
    </section>
  );
}
