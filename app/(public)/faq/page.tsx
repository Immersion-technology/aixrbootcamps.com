import Link from "next/link";
import { FAQS, FAQ_TOPIC_STYLE } from "@/lib/faq";

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
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <details
              key={item.q}
              className={`group frosted-glass rounded-2xl overflow-hidden anim-fade-up delay-${(i % 5) + 1}`}
            >
              <summary className="flex items-center justify-between gap-4 px-5 sm:px-6 py-5 cursor-pointer list-none">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`sticker-pill ${FAQ_TOPIC_STYLE[item.topic]} mt-0.5 shrink-0`} aria-hidden>
                    {item.topic}
                  </span>
                  <span className="font-bubble text-[15.5px] sm:text-[17px] leading-snug text-ink">
                    {item.q}
                  </span>
                </div>
                <span
                  aria-hidden
                  className="shrink-0 w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bubble text-[20px] leading-none transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="px-5 sm:px-6 pb-5 -mt-1">
                <p className="text-[13.5px] text-neutral-700 leading-relaxed max-w-[640px]">
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>

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
