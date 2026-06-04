import Link from "next/link";
import Image from "next/image";
import Ferrofluid from "@/components/Ferrofluid";

const SOCIALS: Array<{ label: string; href: string; path: string }> = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/immersia.ng",
    // simplified Instagram glyph
    path: "M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm11 1.5a.75.75 0 100 1.5.75.75 0 000-1.5zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/immersia_ng",
    // X / Twitter glyph
    path: "M18.244 2H21l-6.52 7.453L22 22h-6.789l-5.32-6.957L3.8 22H1.043l6.974-7.97L1 2h6.957l4.812 6.36L18.244 2zm-1.19 18.2h1.523L7.024 3.706H5.39L17.054 20.2z",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/2348137013560",
    // simplified WhatsApp glyph
    path: "M20.52 3.48A11.79 11.79 0 0012.05 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.67a11.84 11.84 0 005.64 1.44h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.14-3.38-8.44zM12.05 21.6h-.01a9.74 9.74 0 01-4.97-1.36l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.75 9.75 0 01-1.51-5.2c0-5.39 4.39-9.78 9.79-9.78a9.74 9.74 0 016.92 2.87 9.71 9.71 0 012.87 6.91c0 5.4-4.39 9.85-9.72 9.85zm5.36-7.34c-.29-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5l-.56-.01a1.08 1.08 0 00-.78.37c-.27.29-1.03 1.01-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.85.12.56-.08 1.74-.71 1.98-1.4.25-.69.25-1.27.17-1.4-.07-.12-.27-.2-.56-.34z",
  },
];

const EXPLORE = [
  { href: "/#courses",   label: "Courses" },
  { href: "/#timetable", label: "Schedule" },
  { href: "/register",   label: "Register" },
  { href: "/faq",        label: "FAQ" },
  { href: "/contact",    label: "Contact" },
];

const VISIT = [
  { label: "27 July – 21 August 2026", muted: false },
  { label: "Mon – Fri · 10am – 2:30pm", muted: true },
  { label: "99 Adesanya Ogunsanya", muted: true },
  { label: "Leisure Mall, Surulere · Lagos", muted: true },
];

export default function Footer() {
  return (
    <footer className="px-5 sm:px-7 pb-8 sm:pb-12 pt-4">
      <div className="max-w-[1180px] mx-auto">

        {/* ============= CTA CARD =============
            Dark sticker-style card with a soft top fade, the closing pitch,
            and the single primary (grass) CTA. Tucks down into the white
            footer card below via a negative margin so the two overlap. */}
        <section
          className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-ink text-white
                     px-5 sm:px-10 pt-10 sm:pt-20 pb-16 sm:pb-28 text-center"
        >
          {/* Ferrofluid base layer, brand-tinted glowing rims drifting upward */}
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
            <Ferrofluid
              colors={["#19b8c8", "#22C55E", "#1f6f87"]}
              speed={0.4}
              scale={1.4}
              turbulence={1.1}
              fluidity={0.12}
              rimWidth={0.22}
              sharpness={2.5}
              shimmer={1.3}
              glow={2.2}
              flowDirection="up"
              opacity={0.75}
              mouseInteraction={false}
            />
          </div>

          {/* soft glow that fades from the top edge inward, echoing the reference */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 h-56 z-[1]
                       bg-[radial-gradient(60%_100%_at_50%_0%,rgba(34,197,94,.28),transparent_70%)]"
          />
          {/* faint aqua bloom bottom-left for depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full z-[1]
                       bg-aqua-brand/15 blur-3xl"
          />

          <div className="relative z-10">
            <p className="text-[10px] sm:text-[11px] font-bold tracking-[.24em] uppercase text-grass-brand mb-2.5 sm:mb-5">
              Slots are limited
            </p>
            <h2 className="font-bubble text-[24px] sm:text-[48px] leading-[1.05] sm:leading-[1.02] tracking-tight max-w-[16ch] mx-auto">
              Ready to build the future?
            </h2>
            <p className="mt-3 sm:mt-5 text-[13px] sm:text-[15.5px] text-white/65 leading-relaxed max-w-[46ch] mx-auto">
              Give your 10–17 year-old a summer of coding, robotics and VR.
              Reserve a seat before the cohort fills up.
            </p>

            <div className="mt-6 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-grass-brand text-ink rounded-full
                           px-6 sm:px-7 py-3 sm:py-3.5 min-h-[46px] sm:min-h-[52px] font-bubble text-[15px] sm:text-[16px] tracking-tight
                           hover:bg-grass-deep hover:text-white active:scale-[.98] transition
                           shadow-[0_14px_30px_-10px_rgba(34,197,94,.6)]"
              >
                Reserve a slot <span aria-hidden>→</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full px-6 sm:px-7 py-3 sm:py-3.5 min-h-[46px] sm:min-h-[52px]
                           text-[13.5px] sm:text-[14px] font-semibold text-white/85 ring-1 ring-white/15
                           hover:bg-white/5 hover:text-white transition"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </section>

        {/* ============= FOOTER CARD =============
            White card pulled up under the CTA card. A giant ghost wordmark
            bleeds across the bottom, clipped by the card's overflow. */}
        <section
          className="relative -mt-9 sm:-mt-12 overflow-hidden rounded-[24px] sm:rounded-[32px] bg-white
                     px-5 sm:px-10 pt-9 sm:pt-14 pb-7 sm:pb-10
                     shadow-[0_18px_50px_-22px_rgba(15,15,15,.18)] ring-1 ring-black/[.04]"
        >
          {/* ghost wordmark watermark */}
          <span
            aria-hidden
            className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-12 left-1/2 -translate-x-1/2
                       font-bubble text-[26vw] sm:text-[19vw] leading-none tracking-tight
                       text-ink/[.035] whitespace-nowrap"
          >
            IMMERSIA
          </span>

          <div className="relative">
            {/* top grid — brand block + link columns.
                Mobile: brand full-width, then Explore | Visit side-by-side. */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-12 md:grid-cols-[1.5fr_1fr_1.1fr]">

              {/* brand */}
              <div className="col-span-2 md:col-span-1 text-center md:text-left">
                <Image
                  src="/imm.png"
                  alt="IMMERSIA — Virtual Reality, feel. everything"
                  width={3151}
                  height={1036}
                  sizes="240px"
                  className="h-10 sm:h-14 w-auto mb-4 sm:mb-5 mx-auto md:mx-0"
                />
                <p className="text-[13px] sm:text-[13.5px] text-neutral-600 leading-relaxed max-w-[330px] mx-auto md:mx-0">
                  Lagos-based summer tech bootcamp for ages 10–17 — building the next
                  generation of African makers, coders and founders.
                </p>

                <div className="flex justify-center md:justify-start gap-2.5 mt-5 sm:mt-6">
                  {SOCIALS.map(({ label, href, path }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-ink text-white inline-flex items-center justify-center
                                 transition hover:-translate-y-0.5 hover:bg-grass-brand hover:text-ink"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d={path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* explore links */}
              <nav aria-label="Footer">
                <p className="text-[10px] font-bold tracking-[.22em] text-neutral-400 mb-3 sm:mb-4 text-center md:text-left">EXPLORE</p>
                <ul className="space-y-2.5 sm:space-y-3 text-[13.5px] sm:text-[14px] text-neutral-700">
                  {EXPLORE.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="hover:text-grass-deep transition">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* visit + contact */}
              <div>
                <p className="text-[10px] font-bold tracking-[.22em] text-neutral-400 mb-3 sm:mb-4 text-center md:text-left">VISIT &amp; DATES</p>
                <ul className="space-y-1.5 sm:space-y-2 text-[13px] sm:text-[13.5px] mb-5 sm:mb-6">
                  {VISIT.map(({ label, muted }) => (
                    <li key={label} className={muted ? "text-neutral-600" : "font-semibold text-ink"}>
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="text-center md:text-left">
                  <a
                    href="https://wa.me/2348137013560"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-bubble text-[17px] text-grass-deep
                               hover:text-grass-brand transition leading-none"
                    aria-label="Chat with us on WhatsApp"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d={SOCIALS[2].path} />
                    </svg>
                    0813 701 3560
                  </a>
                  <p className="text-[12px] text-neutral-500 mt-2">WhatsApp · fastest reply</p>
                </div>
              </div>
            </div>

            {/* bottom bar — copyright + legal */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-3 sm:gap-4
                            mt-8 sm:mt-12 pt-5 sm:pt-6 border-t border-black/[.06] text-center sm:text-left">
              <p className="text-[12px] text-neutral-500">© 2026 IMMERSIA. All rights reserved.</p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-6 gap-y-2 text-[12px] text-neutral-500">
                <Link href="/privacy" className="hover:text-ink transition">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-ink transition">Rules of conduct</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
}
