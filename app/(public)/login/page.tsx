import Link from "next/link";
import { getParentFromCookie } from "@/lib/account-auth";
import { getTeacherFromCookie } from "@/lib/teacher-auth";
import { getAdminFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginChooserPage() {
  // Read-only session check across the three portals. Each verifier enforces its
  // own audience, so a session for one portal can't be mistaken for another.
  const [parent, teacher, admin] = await Promise.all([
    getParentFromCookie(),
    getTeacherFromCookie(),
    getAdminFromCookie(),
  ]);

  const active =
    (parent && { name: parent.name, href: "/account", label: "parent portal" }) ||
    (teacher && { name: teacher.name, href: "/teacher", label: "facilitator portal" }) ||
    (admin && { name: admin.name, href: "/admin", label: "admin dashboard" }) ||
    null;

  return (
    <section className="px-5 sm:px-7 py-16">
      <div className="max-w-[560px] mx-auto">
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
          LOG IN
        </div>
        <h1 className="font-bubble text-[clamp(36px,5vw,56px)] leading-[1] tracking-tight mb-3 text-ink">
          Welcome back
        </h1>
        <p className="text-[14px] text-neutral-700 leading-relaxed mb-8">
          Choose how you&apos;d like to sign in. Parents and facilitators get a one-time
          link by email, no password to remember.
        </p>

        {active && (
          <div className="frosted-glass-dark rounded-2xl px-5 py-4 mb-7 flex items-center justify-between gap-4 anim-fade-up">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[.2em] text-white/60 uppercase mb-0.5">Already signed in</div>
              <div className="text-[13.5px] text-white truncate">
                You&apos;re signed in as <strong>{active.name}</strong>
              </div>
            </div>
            <Link href={active.href} className="shrink-0 bg-white text-ink rounded-full px-4 py-2 text-[12px] font-bold hover:bg-aqua-brand hover:text-white transition">
              Go to your {active.label} →
            </Link>
          </div>
        )}

        <div className="space-y-4">
          <RoleCard
            href="/account/login"
            eyebrow="Parents & guardians"
            title="Parent portal"
            desc="Track your camper's attendance and details. We email you a one-time login link."
            tone="grass"
          />
          <RoleCard
            href="/teacher/login"
            eyebrow="Facilitators"
            title="Teacher portal"
            desc="Mark daily attendance and view your roster. We email you a one-time login link."
            tone="aqua"
          />
          <RoleCard
            href="/admin/login"
            eyebrow="Staff only"
            title="Admin"
            desc="Manage registrations, payments, teachers and settings. Password sign-in."
            tone="subtle"
          />
        </div>

        <p className="text-[12.5px] text-neutral-600 mt-8">
          Not registered yet?{" "}
          <Link href="/register" className="font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep">
            Reserve a slot
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function RoleCard({
  href,
  eyebrow,
  title,
  desc,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  desc: string;
  tone: "grass" | "aqua" | "subtle";
}) {
  const accent = {
    grass: "text-grass-deep",
    aqua: "text-aqua-deep",
    subtle: "text-neutral-500",
  }[tone];

  return (
    <Link
      href={href}
      className="group block frosted-glass rounded-3xl p-5 sm:p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(15,15,15,.25)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className={`text-[10px] font-bold tracking-[.22em] uppercase mb-1.5 ${accent}`}>{eyebrow}</div>
          <h2 className="font-bubble text-[24px] sm:text-[28px] leading-none tracking-tight text-ink mb-1.5">{title}</h2>
          <p className="text-[13px] text-neutral-700 leading-relaxed">{desc}</p>
        </div>
        <span aria-hidden className="shrink-0 text-[22px] text-ink/40 group-hover:text-ink group-hover:translate-x-1 transition">
          →
        </span>
      </div>
    </Link>
  );
}
