import Link from "next/link";

type Topic = "Logistics" | "Money" | "Curriculum" | "Safety";

const FAQ: Array<{ q: string; a: string; topic: Topic }> = [
  {
    topic: "Logistics",
    q: "What ages is the camp for?",
    a: "Ages 10 to 17 inclusive. We split campers into age-appropriate cohorts so younger and older kids get the right level of challenge.",
  },
  {
    topic: "Money",
    q: "What does the ₦100,000 fee include?",
    a: "All five classes plus three daily side attractions, daily lunch, an IMMERSIA t-shirt, every workshop's materials, and entry to Demo Day on 21 August. The optional ₦20,000 laptop rental is the only add-on.",
  },
  {
    topic: "Logistics",
    q: "Where and when is camp held?",
    a: "Lagos, Nigeria. Monday to Friday for four weeks, 27 July – 21 August 2026. Drop-off at 10am, pick-up at 2:30pm.",
  },
  {
    topic: "Money",
    q: "How does payment work?",
    a: "Securely via Paystack — card, bank transfer or USSD. Once payment is confirmed (usually under a minute) you'll get an email with your registration ID and a PDF receipt.",
  },
  {
    topic: "Logistics",
    q: "What if all 50 slots fill up before I register?",
    a: "The form switches to a waitlist. Drop your details and we'll email the moment a slot opens. We open slots when paid registrations cancel within seven days of camp start.",
  },
  {
    topic: "Curriculum",
    q: "Is Entrepreneurship really compulsory?",
    a: "Yes — every camper takes it. It's the spine of the camp: ideation, building, and pitching on Demo Day. We've seen kids walk in shy and walk out pitching to a live audience.",
  },
  {
    topic: "Logistics",
    q: "What should my child bring on Day 1?",
    a: "Just themselves and a refillable water bottle. Lunch, t-shirt, all materials and (if rented) the laptop are provided. Day 1 starts at 9:30am for orientation — please arrive 30 minutes early.",
  },
  {
    topic: "Curriculum",
    q: "What if my child misses a day?",
    a: "Each course has a make-up Saturday session in the final week (15 August). We also share recordings of the morning tech blocks so kids can catch up at home.",
  },
  {
    topic: "Money",
    q: "What's your refund policy?",
    a: "Full refund up to 14 days before camp start (13 July). 50% refund up to 7 days before. After 20 July, slots are non-refundable but transferable to another camper.",
  },
  {
    topic: "Safety",
    q: "Are mentors vetted?",
    a: "Every mentor is a working tech professional with a clean background check, child-safety training, and at least three years of teaching or mentoring experience.",
  },
];

const TOPIC_STYLE: Record<Topic, string> = {
  Money:      "sticker-pill--green",
  Logistics:  "sticker-pill--cyan",
  Curriculum: "sticker-pill--cyan",
  Safety:     "sticker-pill--paper",
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
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              className={`group frosted-glass rounded-2xl overflow-hidden anim-fade-up delay-${(i % 5) + 1}`}
            >
              <summary className="flex items-center justify-between gap-4 px-5 sm:px-6 py-5 cursor-pointer list-none">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`sticker-pill ${TOPIC_STYLE[item.topic]} mt-0.5 shrink-0`} aria-hidden>
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
            <div className="font-bubble text-[22px] sm:text-[28px] leading-tight text-white">WhatsApp or call us — we reply same day.</div>
          </div>
          <Link href="/contact" className="btn-grass shrink-0">
            Contact us <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
