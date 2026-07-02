import type { Metadata } from "next";
import Link from "next/link";
import { CURRICULUM } from "@/lib/curriculum";
import { AUTH_BYPASS } from "@/lib/dev-auth";

/**
 * DEV-ONLY "test passageway" — a hidden index of every page on the site, so you
 * can click through and visually inspect them all in one place.
 *
 * Reachable only by typing /test (not linked from any nav, never indexed).
 * Safe to delete this single file before production launch.
 */

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Test passageway — every page",
  robots: { index: false, follow: false },
};

type RouteLink = { href: string; label: string; note?: string; template?: boolean };
type Section = { title: string; caption?: string; links: RouteLink[] };

const SECTIONS: Section[] = [
  {
    title: "Public",
    links: [
      { href: "/", label: "Home" },
      { href: "/register", label: "Registration form" },
      { href: "/register/success", label: "Payment result poller" },
      { href: "/register/closed", label: "Capacity full / waitlist" },
      { href: "/register/failed", label: "Payment error" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/login", label: "Portal chooser" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Rules of conduct" },
    ],
  },
  {
    title: "Courses",
    caption: "Generated from lib/curriculum.ts — always in sync.",
    links: CURRICULUM.map((c) => ({
      href: `/courses/${c.slug}`,
      label: c.name,
    })),
  },
  {
    title: "Parent portal",
    caption: "Set AUTH_BYPASS=1 to view without signing in.",
    links: [
      { href: "/account", label: "Dashboard" },
      { href: "/account/login", label: "Login" },
      { href: "/account/login/verify", label: "Email verification" },
      {
        href: "/account/campers/[id]",
        label: "Camper detail",
        template: true,
        note: "Needs a real camper ID.",
      },
    ],
  },
  {
    title: "Teacher portal",
    caption: "Set AUTH_BYPASS=1 to view without signing in.",
    links: [
      { href: "/teacher", label: "Dashboard" },
      { href: "/teacher/login", label: "Login" },
      { href: "/teacher/login/verify", label: "Email verification" },
      {
        href: "/teacher/campers/[id]",
        label: "Camper attendance",
        template: true,
        note: "Needs a real camper ID.",
      },
    ],
  },
  {
    title: "Admin",
    caption: "Set AUTH_BYPASS=1 to view without signing in.",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/registrations", label: "Registrations list" },
      {
        href: "/admin/registrations/[id]",
        label: "Registration detail",
        template: true,
        note: "Needs a real registration ID.",
      },
      { href: "/admin/attendance", label: "Attendance manager" },
      { href: "/admin/teachers", label: "Teacher management" },
      { href: "/admin/waitlist", label: "Waitlist manager" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/export", label: "Data export" },
      { href: "/admin/login", label: "Admin login" },
    ],
  },
  {
    title: "Other",
    links: [
      { href: "/mock/dashboard", label: "Dev screenshot utility" },
      {
        href: "(any unknown URL)",
        label: "404 — Lost in the Metaverse",
        template: true,
        note: "Visit any bad URL to see the not-found page.",
      },
    ],
  },
];

const totalLinks = SECTIONS.reduce((n, s) => n + s.links.length, 0);

export default function TestPassagewayPage() {
  return (
    <main className="min-h-screen bg-paper text-ink px-5 sm:px-7 py-12">
      <div className="max-w-[1180px] mx-auto">
        <header className="mb-10">
          <p className="text-[11px] tracking-[.2em] uppercase font-bold text-neutral-500">
            Dev tool · not linked anywhere · delete before launch
          </p>
          <h1 className="font-bubble text-[40px] sm:text-[52px] leading-[1.05] tracking-tight mt-2">
            Test passageway
          </h1>
          <p className="text-neutral-600 mt-2 max-w-[60ch]">
            Every page on the site, in one place — {totalLinks} routes across{" "}
            {SECTIONS.length} sections. Links open in the same tab. Greyed rows are
            dynamic routes that need a real ID.
          </p>

          {/* Auth-bypass status: tells you whether the portal links will skip login. */}
          <div
            className={[
              "mt-5 rounded-xl px-4 py-3 text-[13px] border",
              AUTH_BYPASS
                ? "bg-grass-soft/40 border-grass-brand/40 text-ink"
                : "bg-yellow-soft/40 border-yellow-soft text-ink",
            ].join(" ")}
          >
            {AUTH_BYPASS ? (
              <>
                <strong>Auth bypass is ON.</strong> Admin, teacher, and parent pages open
                without signing in, showing <strong>real data</strong> (admin/teacher list
                everyone; parent impersonates a real family — set{" "}
                <code className="font-mono">DEV_PARENT_EMAIL</code> to pick one). Unset{" "}
                <code className="font-mono">AUTH_BYPASS</code> before deploying.
              </>
            ) : (
              <>
                <strong>Auth bypass is OFF.</strong> Portal links will redirect to login.
                To preview them without signing in, add{" "}
                <code className="font-mono">AUTH_BYPASS=1</code> to{" "}
                <code className="font-mono">.env.local</code> and restart{" "}
                <code className="font-mono">npm run dev</code>.
              </>
            )}
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-black/[.06] bg-white/60 p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-bubble text-[22px] tracking-tight">
                  {section.title}
                </h2>
                <span className="text-[11px] font-bold text-neutral-400">
                  {section.links.length}
                </span>
              </div>
              {section.caption && (
                <p className="text-[12px] text-neutral-500 mt-1">{section.caption}</p>
              )}

              <ul className="mt-4 flex flex-col gap-1">
                {section.links.map((l) =>
                  l.template ? (
                    <li
                      key={l.href}
                      className="rounded-lg px-3 py-2 opacity-55 cursor-not-allowed"
                      title={l.note}
                    >
                      <span className="text-[14px] font-medium">{l.label}</span>
                      <span className="block font-mono text-[11px] text-neutral-500">
                        {l.href}
                      </span>
                      {l.note && (
                        <span className="block text-[11px] text-neutral-400 italic">
                          {l.note}
                        </span>
                      )}
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="block rounded-lg px-3 py-2 hover:bg-grass-brand/15 active:bg-grass-brand/25 transition"
                      >
                        <span className="text-[14px] font-medium">{l.label}</span>
                        <span className="block font-mono text-[11px] text-neutral-500">
                          {l.href}
                        </span>
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
