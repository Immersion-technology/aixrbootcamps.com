import Link from "next/link";
import TeacherLoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function TeacherLoginPage() {
  return (
    <section className="px-5 sm:px-7 py-16">
      <div className="max-w-[440px] mx-auto">
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
          FACILITATOR PORTAL
        </div>
        <h1 className="font-bubble text-[clamp(36px,5vw,56px)] leading-[1] tracking-tight mb-3 text-ink">
          Sign in
        </h1>
        <p className="text-[14px] text-neutral-700 leading-relaxed mb-8">
          Enter your IMMERSIA team email. We&apos;ll send you a one-time login link, no password needed.
        </p>

        <TeacherLoginForm />

        <p className="text-[12.5px] text-neutral-600 mt-6">
          Not set up yet? Ask an admin to add you, or{" "}
          <Link href="/contact" className="font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep">
            talk to a human
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
