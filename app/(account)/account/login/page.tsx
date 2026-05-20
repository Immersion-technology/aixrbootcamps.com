import Link from "next/link";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function ParentLoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <section className="px-5 sm:px-7 py-16">
      <div className="max-w-[440px] mx-auto">
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
          PARENT ACCOUNT
        </div>
        <h1 className="font-bubble text-[clamp(36px,5vw,56px)] leading-[1] tracking-tight mb-3 text-ink">
          Sign in
        </h1>
        <p className="text-[14px] text-neutral-700 leading-relaxed mb-8">
          Use the email you registered your camper with. If you haven&apos;t set a
          password yet, check your inbox for the setup link we sent after payment.
        </p>

        <LoginForm from={searchParams.from} />

        <p className="text-[12.5px] text-neutral-600 mt-6">
          Lost your setup link?{" "}
          <Link href="/contact" className="font-semibold underline underline-offset-4 decoration-2 hover:text-aqua-deep">
            Talk to a human
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
