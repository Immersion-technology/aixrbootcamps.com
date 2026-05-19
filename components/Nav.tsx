"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home09Icon,
  RoboticIcon,
  Calendar03Icon,
  HelpCircleIcon,
  Rocket01Icon,
} from "hugeicons-react";

type IconCmp = typeof Home09Icon;

const TABS: Array<{ href: string; label: string; Icon: IconCmp; match: (p: string) => boolean; primary?: boolean }> = [
  { href: "/",          label: "Home",     Icon: Home09Icon,       match: (p) => p === "/" },
  { href: "/#courses",  label: "Courses",  Icon: RoboticIcon,      match: (p) => p.startsWith("/courses") },
  { href: "/#timetable", label: "Schedule", Icon: Calendar03Icon,   match: () => false /* anchor link */ },
  { href: "/faq",       label: "FAQ",      Icon: HelpCircleIcon,   match: (p) => p.startsWith("/faq") },
  { href: "/register",  label: "Register", Icon: Rocket01Icon,     match: (p) => p.startsWith("/register"), primary: true },
];

export default function Nav() {
  const pathname = usePathname() || "/";
  // Hide bottom tab bar on the register flow so the form's own sticky bar has the screen.
  const hideMobileBar = pathname.startsWith("/register");

  return (
    <>
      {/* ============= MAIN NAV ============= */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-black/[.04]">
        <nav className="max-w-[1180px] mx-auto px-5 sm:px-7 h-[68px] sm:h-[74px] flex items-center justify-between gap-4">
          <Link href="/" aria-label="IMMERSIA — home" className="block shrink-0">
            <img
              src="/imm.png"
              alt="IMMERSIA — Virtual Reality, feel. everything"
              className="h-9 sm:h-10 w-auto"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </Link>

          <ul className="hidden md:flex gap-7 text-[14px] text-neutral-700 font-medium">
            <li><Link href="/#courses" className="hover:text-ink transition">Courses</Link></li>
            <li><Link href="/#timetable" className="hover:text-ink transition">Schedule</Link></li>
            <li><Link href="/faq" className="hover:text-ink transition">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-ink transition">Contact</Link></li>
          </ul>

          <Link
            href="/register"
            className="btn-grass !py-2.5 !px-5 !text-[12.5px] !min-h-0 sm:!py-3 sm:!px-6"
          >
            Reserve a Slot
            <span aria-hidden>→</span>
          </Link>
        </nav>
      </header>

      {/* ============= MOBILE BOTTOM TAB BAR =============
          Five-tab nav fixed to the bottom of the viewport on screens < md.
          Active tab gets a 3px cyan top accent and bold weight. Register tab
          is rendered in grass-green to mirror the primary CTA color.
          Hidden on /register so the form's own sticky controls have the space.
          Uses iOS safe-area inset so it clears the home indicator. */}
      {!hideMobileBar && (
        <nav
          aria-label="Primary mobile"
          className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-paper/95 backdrop-blur-md border-t border-black/[.08]"
          style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
        >
          <ul className="grid grid-cols-5">
            {TABS.map(({ href, label, Icon, match, primary }) => {
              const active = match(pathname);
              return (
                <li key={label} className="contents">
                  <Link
                    href={href}
                    className={[
                      "flex flex-col items-center justify-center gap-0.5 min-h-[60px] text-[10.5px] font-bold tracking-wide relative transition",
                      active ? "text-ink" : "text-neutral-500 hover:text-ink",
                      primary ? "text-grass-deep" : "",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-aqua-brand"
                      />
                    )}
                    <Icon
                      size={primary ? 24 : 22}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={primary ? "text-grass-brand" : ""}
                    />
                    <span className={active ? "font-extrabold" : ""}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
