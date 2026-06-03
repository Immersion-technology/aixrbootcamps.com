import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CodeIcon,
  Rocket01Icon,
  CameraVideoIcon,
  RoboticIcon,
  MusicNote01Icon,
  VrGlassesIcon,
  GameController01Icon,
  TableTennisBatIcon,
  RacingFlagIcon,
} from "hugeicons-react";
import {
  CURRICULUM,
  getBySlug,
  scheduleDays,
  allSlugs,
  type CurriculumItem,
  type IconName,
  type Tone,
} from "@/lib/curriculum";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<IconName, typeof CodeIcon> = {
  CodeIcon,
  Rocket01Icon,
  CameraVideoIcon,
  RoboticIcon,
  MusicNote01Icon,
  VrGlassesIcon,
  GameController01Icon,
  TableTennisBatIcon,
  RacingFlagIcon,
};

const TONE_BG: Record<Tone, string> = {
  violet: "bg-violet-brand/15",
  petrol: "bg-petrol-brand/15",
  aqua: "bg-aqua-brand/15",
  orange: "bg-orange-300/30",
  pink: "bg-pink-soft",
  yellow: "bg-yellow-soft",
  mint: "bg-mint-soft",
  blue: "bg-sky-200/40",
  coral: "bg-pink-deep/20",
};

const TONE_TEXT: Record<Tone, string> = {
  violet: "text-violet-brand",
  petrol: "text-petrol-brand",
  aqua: "text-aqua-deep",
  orange: "text-orange-700",
  pink: "text-pink-deep",
  yellow: "text-yellow-deep",
  mint: "text-mint-deep",
  blue: "text-sky-700",
  coral: "text-pink-deep",
};

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getBySlug(params.slug);
  if (!c) return { title: "Not found · IMMERSIA" };
  return {
    title: `${c.name} · IMMERSIA`,
    description: c.shortDesc,
  };
}

export default function CourseDetail({ params }: { params: { slug: string } }) {
  const course = getBySlug(params.slug);
  if (!course) notFound();

  const Icon = ICON_MAP[course.icon];
  const isClass = course.type === "class";
  const eyebrowType = isClass ? "CLASS" : "ACTIVE BREAK";

  return (
    <section className="relative dot-grid pt-12 pb-24">
      <div className="max-w-[960px] mx-auto px-5 sm:px-7">
        {/* breadcrumb */}
        <Link
          href="/#courses"
          className="inline-block text-[12px] text-neutral-500 hover:text-aqua-deep transition mb-7 anim-fade-up"
        >
          ← All courses
        </Link>

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-10 mb-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] mb-5 anim-fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
              {eyebrowType} · {course.hoursPerWeek} HRS / WK · {scheduleDays(course)}
            </div>

            <h1 className="font-bubble leading-[1] tracking-tight text-[clamp(36px,5.8vw,68px)] mb-4 anim-fade-up delay-1 text-ink">
              {course.name}
            </h1>

            <p className="text-[15px] sm:text-[16px] text-neutral-700 leading-relaxed max-w-[560px] mb-7 anim-fade-up delay-2">
              {course.tagline}
            </p>

            <div className="flex flex-wrap gap-2 anim-fade-up delay-3">
              {course.isCompulsory && (
                <span className="frosted-glass-petrol rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[.18em]">
                  ★ COMPULSORY
                </span>
              )}
              {!isClass && (
                <span className="frosted-glass rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[.18em]">
                  ☕ DAILY · FREE CHOICE
                </span>
              )}
            </div>
          </div>

          {/* big icon block, sticker-style, lifts on hover */}
          <div className={cn("card-sticker card-sticker--cyan card-sticker--tilt-r-lg shrink-0 mt-8 lg:mt-0 w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center anim-float-deep", TONE_BG[course.tone])} style={{ borderRadius: 32 }}>
            <Icon size={72} className={TONE_TEXT[course.tone]} />
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          <Stat label="Hours / week" value={`${course.hoursPerWeek}h`} />
          <Stat label="Sessions / week" value={String(course.sessionsPerWeek)} />
          <Stat label="Total over camp" value={`${course.hoursPerWeek * 4}h`} highlight />
        </div>

        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-5 mb-5">
          {/* WHAT YOU'LL LEARN */}
          <Card title="What you'll learn" eyebrow="Curriculum">
            <ul className="space-y-2.5">
              {course.whatYoullLearn.map((item) => (
                <li key={item} className="flex gap-3 text-[14px] leading-relaxed">
                  <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-aqua-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* OUTCOMES */}
          <Card title="What you'll walk out with" eyebrow="Outcomes" tone="violet">
            <ul className="space-y-3">
              {course.outcomes.map((item) => (
                <li key={item} className="flex gap-3 text-[14px] leading-relaxed">
                  <span className="shrink-0 font-accent font-bold text-aqua-brand">✓</span>
                  <span className="text-ink/90">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* TOOLS */}
        <div className="frosted-glass rounded-3xl p-6 sm:p-7 mb-5">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-3">Tools you&apos;ll use</div>
          <div className="flex flex-wrap gap-2">
            {course.tools.map((t) => (
              <span key={t} className="frosted-glass-dark rounded-full px-3.5 py-1.5 text-[12px] font-semibold">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* SAMPLE PROJECT */}
        <div className="frosted-glass-petrol rounded-3xl p-6 sm:p-8 mb-5">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 uppercase mb-3">Sample project</div>
          <p className="text-[15px] sm:text-[16px] leading-relaxed">{course.sampleProject}</p>
        </div>

        <div className="mb-10">
          {/* SCHEDULE */}
          <Card title="Schedule" eyebrow="When it runs">
            <ul className="space-y-2 text-[13.5px]">
              {course.scheduleSlots.map((slot, i) => (
                <li key={i} className="flex justify-between border-b border-black/5 pb-2 last:border-0 last:pb-0">
                  <span className="font-semibold">{slot.day}</span>
                  <span className="text-neutral-700 font-mono text-[12px]">
                    {slot.start} – {slot.end}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* CTA STRIP, green grass primary, matches the rest of the site's CTA color */}
        <div className="card-sticker card-sticker--ink card-sticker--no-tilt p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 mb-1.5">READY?</div>
            <div className="font-bubble text-[22px] sm:text-[28px] leading-tight text-white">
              Lock in your slot. Only 50 spots in the cohort.
            </div>
          </div>
          <Link href="/register" className="btn-grass shrink-0">
            Reserve a Slot <span aria-hidden>→</span>
          </Link>
        </div>

        {/* OTHER COURSES */}
        <div className="mt-16">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-4">More on the programme</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CURRICULUM.filter((c) => c.slug !== course.slug && c.type === "class")
              .slice(0, 4)
              .map((c) => {
                const I = ICON_MAP[c.icon];
                return (
                  <Link
                    key={c.slug}
                    href={`/courses/${c.slug}`}
                    className="frosted-glass rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,.06)] transition group"
                  >
                    <I size={28} className={cn("mb-3", TONE_TEXT[c.tone])} />
                    <div className="font-bubble text-[15px] leading-snug text-ink">{c.name}</div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl px-4 py-3 text-center", highlight ? "frosted-glass-aqua" : "frosted-glass")}>
      <div className="text-[10px] font-bold tracking-[.18em] uppercase opacity-65">{label}</div>
      <div className="font-accent font-extrabold text-[22px] mt-1 leading-none tracking-tight">{value}</div>
    </div>
  );
}

function Card({
  title, eyebrow, tone, children,
}: { title: string; eyebrow: string; tone?: "violet"; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-3xl p-6 sm:p-7", tone === "violet" ? "frosted-glass-aqua" : "frosted-glass")}>
      <div className={cn(
        "text-[10.5px] font-bold tracking-[.22em] uppercase mb-3",
        tone === "violet" ? "text-petrol-brand" : "text-aqua-deep"
      )}>
        {eyebrow}
      </div>
      <h2 className="font-bubble text-[20px] sm:text-[24px] leading-tight mb-4 text-ink">{title}</h2>
      {children}
    </div>
  );
}
