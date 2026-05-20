import Link from "next/link";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default function ParentSetupPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  if (!token) {
    return (
      <section className="px-5 sm:px-7 py-16">
        <div className="max-w-[440px] mx-auto text-center">
          <h1 className="font-bubble text-[clamp(28px,4vw,40px)] leading-[1] tracking-tight mb-3 text-ink">
            Setup link missing
          </h1>
          <p className="text-[14px] text-neutral-700 leading-relaxed mb-6">
            This page needs a setup token in the URL. Use the link we emailed after registration, or talk to us.
          </p>
          <Link href="/contact" className="btn-grass">Talk to a human <span aria-hidden>→</span></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 sm:px-7 py-16">
      <div className="max-w-[440px] mx-auto">
        <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-grass-brand inline-block anim-pulse" />
          ONE-TIME · SET PASSWORD
        </div>
        <h1 className="font-bubble text-[clamp(36px,5vw,56px)] leading-[1] tracking-tight mb-3 text-ink">
          Pick your password
        </h1>
        <p className="text-[14px] text-neutral-700 leading-relaxed mb-8">
          This is the password you&apos;ll use whenever you sign in to check on your camper&apos;s programme.
        </p>
        <SetupForm token={token} />
      </div>
    </section>
  );
}
