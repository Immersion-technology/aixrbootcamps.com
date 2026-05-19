import Link from "next/link";

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
    href: "https://wa.me/2348000000000",
    // simplified WhatsApp glyph
    path: "M20.52 3.48A11.79 11.79 0 0012.05 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.67a11.84 11.84 0 005.64 1.44h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.14-3.38-8.44zM12.05 21.6h-.01a9.74 9.74 0 01-4.97-1.36l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.75 9.75 0 01-1.51-5.2c0-5.39 4.39-9.78 9.79-9.78a9.74 9.74 0 016.92 2.87 9.71 9.71 0 012.87 6.91c0 5.4-4.39 9.85-9.72 9.85zm5.36-7.34c-.29-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5l-.56-.01a1.08 1.08 0 00-.78.37c-.27.29-1.03 1.01-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.85.12.56-.08 1.74-.71 1.98-1.4.25-.69.25-1.27.17-1.4-.07-.12-.27-.2-.56-.34z",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/10 mt-12 pt-16 pb-10 sm:pb-12 px-5 sm:px-7">
      <div className="max-w-[1180px] mx-auto">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 sm:gap-12 mb-14">
          <div>
            <img
              src="/imm.png"
              alt="IMMERSIA — Virtual Reality, feel. everything"
              className="h-12 sm:h-14 w-auto mb-4"
              loading="lazy"
              decoding="async"
            />
            <p className="text-[13.5px] text-neutral-700 leading-relaxed max-w-[360px]">
              Lagos-based summer tech bootcamp for ages 10–17. Building the next generation of African makers, coders and founders.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[.22em] text-neutral-500 mb-4">EXPLORE</p>
            <ul className="space-y-2.5 text-[13.5px]">
              <li><Link href="/#courses" className="hover:text-grass-deep transition">Courses</Link></li>
              <li><Link href="/#timetable" className="hover:text-grass-deep transition">Schedule</Link></li>
              <li><Link href="/register" className="hover:text-grass-deep transition">Register</Link></li>
              <li><Link href="/faq" className="hover:text-grass-deep transition">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-grass-deep transition">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[.22em] text-neutral-500 mb-4">CAMP DATES</p>
            <p className="text-[13.5px] mb-1.5"><strong>27 July – 21 August 2026</strong></p>
            <p className="text-[13.5px] text-neutral-700">Mon – Fri · 10am – 2:30pm · Lagos</p>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[.22em] text-neutral-500 mb-4">QUESTIONS?</p>
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bubble text-[18px] text-grass-deep hover:text-grass-brand transition leading-none"
              aria-label="Chat with us on WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d={SOCIALS[2].path} />
              </svg>
              0800 000 0000
            </a>
            <p className="text-[12px] text-neutral-600 mt-2 leading-snug">WhatsApp · fastest reply</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 pt-8 border-t border-black/10">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-neutral-500">
            <span>© 2026 IMMERSIA. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-ink transition">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition">Rules of conduct</Link>
          </div>

          <div className="flex gap-2.5">
            {SOCIALS.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-11 h-11 rounded-full bg-ink text-white inline-flex items-center justify-center transition hover:-translate-y-0.5 hover:bg-grass-brand hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
