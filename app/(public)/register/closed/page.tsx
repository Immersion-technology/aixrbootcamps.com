import WaitlistForm from "./WaitlistForm";

export const metadata = {
  title: "Join the waitlist",
  description: "The current IMMERSIA cohort is full. Join the waitlist and we'll reach out the moment a slot opens up.",
  alternates: { canonical: "/register" },
};

export default function ClosedPage() {
  return (
    <section className="relative min-h-[80vh] dot-grid pt-12 pb-24">
      <div className="max-w-[680px] mx-auto px-5 sm:px-7 text-center">
        <div className="inline-flex items-center gap-2 card-sticker card-sticker--cyan card-sticker--no-tilt rounded-full px-4 py-2 text-[10.5px] font-bold tracking-[.18em] mb-6 anim-fade-up text-ink">
          <span className="w-1.5 h-1.5 rounded-full bg-ink inline-block anim-pulse" />
          ALL 50 SLOTS FILLED
        </div>

        <h1 className="font-bubble leading-[1] tracking-tight text-[clamp(40px,6vw,76px)] mb-5 anim-fade-up delay-1 text-ink">
          WE&apos;RE <span className="wordmark wordmark--green">FULL</span>.<br />
          JOIN THE LIST.
        </h1>

        <p className="text-[14.5px] text-neutral-700 max-w-[480px] mx-auto leading-relaxed mb-10 anim-fade-up delay-2">
          We open waitlist slots when paid registrations cancel within seven days of camp start. <strong>First-come, first-served.</strong> Drop your details below and we&apos;ll email the moment a slot opens.
        </p>

        <div className="anim-fade-up delay-3">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
