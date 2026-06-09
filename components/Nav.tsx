"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/",           label: "Home" },
  { href: "/#courses",   label: "Courses" },
  { href: "/#timetable", label: "Schedule" },
  { href: "/faq",        label: "FAQ" },
  { href: "/contact",    label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  // Close drawer whenever the route changes (covers /#anchor navigations too).
  useEffect(() => { setOpen(false); }, [pathname]);

  // Esc closes; body scroll locks while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* ============= TOP NAV =============
          Mobile: logo flush-left (small), hamburger flush-right. Two-child flex.
          Desktop: logo left, centered nav cluster (with Reserve pill), empty right. */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-black/[.04]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7">

          {/* ── Mobile nav ── */}
          <nav className="md:hidden flex items-center justify-between h-[68px]">
            <Link href="/" aria-label="IMMERSIA, home">
              <Image
                src="/logo.png"
                alt="IMMERSIA, Virtual Reality, feel. everything"
                width={1254}
                height={1254}
                priority
                sizes="180px"
                className="h-8 w-auto"
              />
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-ink hover:bg-ink/5 active:bg-ink/10 transition"
            >
              <HamburgerIcon />
            </button>
          </nav>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center h-[74px] gap-6">
            <Link href="/" aria-label="IMMERSIA, home" className="justify-self-start">
              <Image
                src="/logo.png"
                alt="IMMERSIA, Virtual Reality, feel. everything"
                width={1254}
                height={1254}
                priority
                sizes="180px"
                className="h-10 w-auto"
              />
            </Link>

            <ul className="justify-self-center flex items-center gap-6 lg:gap-8 text-[14px] text-neutral-700 font-medium">
              <li><Link href="/#courses"   className="hover:text-ink transition">Courses</Link></li>
              <li><Link href="/#timetable" className="hover:text-ink transition">Schedule</Link></li>
              <li><Link href="/faq"        className="hover:text-ink transition">FAQ</Link></li>
              <li><Link href="/contact"    className="hover:text-ink transition">Contact</Link></li>
            </ul>

            <div className="justify-self-end flex items-center gap-4 lg:gap-5">
              <Link href="/login" className="text-[14px] text-neutral-700 font-medium hover:text-ink transition">
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 bg-grass-brand text-ink rounded-full px-5 py-2 text-[12.5px] font-bold tracking-wide hover:bg-grass-deep hover:text-white transition shadow-[0_8px_20px_-8px_rgba(251,86,7,.5)]"
              >
                Reserve <span aria-hidden>→</span>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ============= MOBILE DRAWER (FULL-SCREEN OVERLAY) =============
          Wrapper alone owns pointer-events: when closed, the whole subtree is
          unclickable and invisible. NO inner pointer-events overrides allowed,
          or invisible children intercept taps across the whole viewport. */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        className={[
          "md:hidden fixed inset-0 z-[60] transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Backdrop, clickable to close */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-ink/95 backdrop-blur-xl cursor-default"
          tabIndex={-1}
        />

        {/* Foreground content */}
        <div className="relative flex flex-col h-full text-white">

          {/* Drawer top row, logo centered + close button */}
          <div className="px-5">
            <div className="grid grid-cols-3 items-center h-[68px]">
              <div className="w-11" aria-hidden />
              <Link
                href="/"
                onClick={() => setOpen(false)}
                aria-label="IMMERSIA, home"
                className="justify-self-center"
              >
                <Image
                  src="/logo.png"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="220px"
                  className="h-12 w-auto rounded-xl bg-white px-2.5 py-1.5"
                />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="justify-self-end w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-white hover:bg-white/10 active:bg-white/15 transition"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Centered links */}
          <ul className="flex-1 flex flex-col items-center justify-center gap-7 px-8 text-center">
            {LINKS.map((l, i) => {
              const active =
                l.href === "/"
                  ? pathname === "/"
                  : l.href.startsWith("/#")
                  ? false
                  : pathname.startsWith(l.href);
              return (
                <li
                  key={l.href}
                  className={[
                    "w-full transition-all duration-500 ease-out",
                    open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
                  ].join(" ")}
                  style={{ transitionDelay: open ? `${120 + i * 55}ms` : "0ms" }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block font-bubble text-[36px] sm:text-[44px] leading-[1] tracking-tight transition",
                      active
                        ? "text-aqua-brand"
                        : "text-white hover:text-aqua-brand",
                    ].join(" ")}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Bottom CTA */}
          <div
            className="px-6 pb-7 pt-3"
            style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
          >
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={[
                "flex items-center justify-center gap-2 bg-grass-brand text-ink rounded-full py-4 min-h-[56px] font-bubble text-[18px] tracking-tight",
                "hover:bg-grass-deep hover:text-white active:scale-[.98] transition",
                "shadow-[0_14px_30px_-10px_rgba(251,86,7,.6)]",
                "transition-all duration-500 ease-out",
                open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
              ].join(" ")}
              style={{ transitionDelay: open ? `${120 + LINKS.length * 55}ms` : "0ms" }}
            >
              RESERVE A SLOT
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block text-center text-[14px] font-semibold text-white/80 hover:text-white underline underline-offset-4 decoration-2 mt-4"
            >
              Log in
            </Link>
            <p className="text-center text-[11px] text-white/55 tracking-[.18em] uppercase font-bold mt-4">
              27 July – 4 September 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============= ICONS (inline SVG, no icon-lib dependency) ============= */

function HamburgerIcon() {
  return (
    <svg
      width="26" height="26" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      <line x1="4" y1="7"  x2="20" y2="7"  />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="26" height="26" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      <line x1="6" y1="6"  x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6"  />
    </svg>
  );
}
