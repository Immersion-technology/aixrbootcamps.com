import Link from "next/link";
import Image from "next/image";

type Sticker = "cyan" | "green" | "ink";

const CHANNELS: Array<{
  label: string;
  value: string;
  href: string;
  note: string;
  glass: string;
  sticker: Sticker;
}> = [
  {
    label: "WhatsApp",
    value: "+234 813 701 3560",
    href: "https://wa.me/2348137013560",
    note: "Fastest. We reply within 30 minutes during office hours.",
    glass: "/img/glass-orb.png",
    sticker: "green",
  },
  {
    label: "Phone",
    value: "+234 813 701 3560",
    href: "tel:+2348137013560",
    note: "Office hours: Mon – Sat, 9am – 6pm WAT.",
    glass: "/img/glass-paper-plane.png",
    sticker: "ink",
  },
  {
    label: "Email",
    value: "hello@immersia.ng",
    href: "mailto:hello@immersia.ng",
    note: "For longer questions or to share documents. We reply within 24h.",
    glass: "/img/glass-star.png",
    sticker: "cyan",
  },
];

export default function ContactPage() {
  return (
    <section className="relative pt-12 pb-24 dot-grid min-h-[80vh]">
      <div className="max-w-[840px] mx-auto px-5 sm:px-7">
        {/* eyebrow */}
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] mb-5 anim-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
          MON – SAT · 9AM – 6PM WAT
        </div>

        {/* heading */}
        <h1 className="font-bubble leading-[1] tracking-tight text-[clamp(40px,6vw,76px)] mb-4 anim-fade-up delay-1 text-ink">
          GET IN <span className="wordmark">TOUCH.</span>
        </h1>

        <p className="text-[14.5px] text-neutral-700 leading-relaxed max-w-[520px] mb-10 anim-fade-up delay-2">
          Three ways to reach us. WhatsApp is the fastest, we reply same day, often within the hour.
        </p>

        {/* channel cards, sticker variants, slight rotation */}
        <div className="stagger-group grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-14">
          {CHANNELS.map((c, i) => (
            <ChannelCard key={c.label} channel={c} index={i} />
          ))}
        </div>

        {/* address / venue card */}
        <div className="frosted-glass rounded-3xl p-7 sm:p-8 anim-fade-up delay-4 grid sm:grid-cols-2 gap-6">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep mb-2">VENUE</div>
            <h3 className="font-bubble text-[24px] sm:text-[28px] leading-tight mb-2 text-ink">99 Adesanya Ogunsanya</h3>
            <p className="text-[13.5px] text-neutral-700 leading-relaxed">
              Leisure Mall, Lagos. Secure supervised facility with parking, a generator, and CCTV throughout. Drop-off + pick-up are ID-checked daily.
            </p>
          </div>
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep mb-2">CAMP DATES</div>
            <h3 className="font-bubble text-[24px] sm:text-[28px] leading-tight mb-2 text-ink">27 July – 21 August 2026</h3>
            <p className="text-[13.5px] text-neutral-700 leading-relaxed">
              Mon – Fri · 10am – 2:30pm · Demo Day Friday 21 August.
            </p>
            <Link href="/register" className="btn-grass mt-5 !text-[12px]">
              Reserve a Slot <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChannelCard({
  channel, index,
}: {
  channel: { label: string; value: string; href: string; note: string; glass: string; sticker: Sticker };
  index: number;
}) {
  const isDark = channel.sticker === "ink";
  return (
    <a
      href={channel.href}
      target={channel.href.startsWith("http") ? "_blank" : undefined}
      rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`stagger-rise card-sticker card-sticker--${channel.sticker} group relative block overflow-hidden`}
      style={{ "--i": index, "--tilt": `${index % 2 === 0 ? -2 : 2}deg` } as React.CSSProperties}
      aria-label={`${channel.label}: ${channel.value}`}
    >
      <Image
        src={channel.glass}
        alt=""
        aria-hidden
        width={64}
        height={64}
        sizes="64px"
        className="absolute top-2 right-2 w-16 h-16 object-contain opacity-90 group-hover:scale-110 transition"
      />
      <div className={`text-[10.5px] font-bold tracking-[.22em] uppercase mb-3 ${isDark ? "text-white/70" : "text-ink/70"}`}>
        {channel.label}
      </div>
      <div className={`font-bubble text-[20px] sm:text-[22px] leading-tight mb-2 break-words pr-14 ${isDark ? "text-white" : "text-ink"}`}>
        {channel.value}
      </div>
      <p className={`text-[12.5px] leading-relaxed pr-14 ${isDark ? "text-white/85" : "text-ink/85"}`}>
        {channel.note}
      </p>
    </a>
  );
}
