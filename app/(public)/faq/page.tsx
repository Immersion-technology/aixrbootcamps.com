import Link from "next/link";
import FaqAccordion from "@/components/FaqAccordion";

export const metadata = {
  title: "FAQ · Everything parents ask",
  description:
    "Answers to the questions parents ask most about the IMMERSIA AI & XR Summer Tech Bootcamp 2026 — ages, dates, pricing, safety, laptops and what campers build.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <section className="relative pt-12 pb-24 dot-grid min-h-[80vh]">
      <div className="max-w-[840px] mx-auto px-5 sm:px-7">
        {/* eyebrow */}
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] mb-5 anim-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-brand inline-block anim-pulse" />
          THE 10 QUESTIONS PARENTS ASK MOST
        </div>

        {/* heading */}
        <h1 className="font-bubble leading-[1] tracking-tight text-[clamp(40px,6vw,76px)] mb-4 anim-fade-up delay-1 text-ink">
          QUESTIONS.<br /><span className="wordmark wordmark--green">ANSWERED.</span>
        </h1>

        <p className="text-[14.5px] text-neutral-700 leading-relaxed max-w-[560px] mb-10 anim-fade-up delay-2">
          Everything parents have asked us about safety, payment, schedule and what their kids actually do. Can&apos;t find your answer? <a href="/contact" className="text-grass-deep font-semibold hover:underline">Talk to a human →</a>
        </p>

        {/* accordion */}
        <FaqAccordion reveal="fade" />

        {/* still-have-questions CTA */}
        <div className="mt-12 card-sticker card-sticker--ink card-sticker--no-tilt p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between anim-fade-up delay-3">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.2em] text-white/70 mb-1.5">STILL HAVE QUESTIONS?</div>
            <div className="font-bubble text-[22px] sm:text-[28px] leading-tight text-white">WhatsApp or call us, we reply same day.</div>
          </div>
          <Link href="/contact" className="btn-grass shrink-0">
            Contact us <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
