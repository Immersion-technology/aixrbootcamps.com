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
  type IconName,
  type CardColor,
} from "@/lib/curriculum";
import { cn } from "@/lib/utils";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

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

/**
 * Per-course theme, keyed by the card's brand hue. Each detail page wears the
 * colour of its landing card. Text colours are chosen for WCAG-AA contrast:
 *  - `solidBg` blocks pair with `onSolid` (white on dark hues, ink on light hues)
 *  - `accentText` is a paper-safe text shade (darkened for the light hues so it
 *    stays readable on the cream background)
 */
const THEME: Record<
  CardColor,
  { solidBg: string; onSolid: string; onSolidDim: string; accentText: string; accentDot: string }
> = {
  azure:   { solidBg: "bg-aqua-brand",   onSolid: "text-white", onSolidDim: "text-white/85", accentText: "text-aqua-deep",     accentDot: "bg-aqua-brand" },
  orange:  { solidBg: "bg-grass-brand",  onSolid: "text-ink",   onSolidDim: "text-ink/80",   accentText: "text-grass-deep",    accentDot: "bg-grass-brand" },
  pink:    { solidBg: "bg-pink-brand",   onSolid: "text-white", onSolidDim: "text-white/85", accentText: "text-pink-deep",     accentDot: "bg-pink-brand" },
  violet:  { solidBg: "bg-violet-brand", onSolid: "text-white", onSolidDim: "text-white/85", accentText: "text-violet-deep",   accentDot: "bg-violet-brand" },
  emerald: { solidBg: "bg-jade-brand",   onSolid: "text-ink",   onSolidDim: "text-ink/80",   accentText: "text-[#047857]",     accentDot: "bg-jade-brand" },
  amber:   { solidBg: "bg-gold-brand",   onSolid: "text-ink",   onSolidDim: "text-ink/80",   accentText: "text-[#9a6b00]",     accentDot: "bg-gold-brand" },
  cobalt:  { solidBg: "bg-petrol-brand", onSolid: "text-white", onSolidDim: "text-white/85", accentText: "text-petrol-brand",  accentDot: "bg-petrol-brand" },
};

type Theme = (typeof THEME)[CardColor];

/** Format a kobo amount as a clean naira string, e.g. 2500000 → "₦25,000". */
function nairaK(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getBySlug(params.slug);
  if (!c) return { title: "Not found" };
  const canonical = `/courses/${c.slug}`;
  return {
    title: c.name,
    description: c.shortDesc,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: absoluteUrl(canonical),
      title: `${c.name} · ${SITE_NAME}`,
      description: c.shortDesc,
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.name} · ${SITE_NAME}`,
      description: c.shortDesc,
    },
  };
}

export default function CourseDetail({ params }: { params: { slug: string } }) {
  const course = getBySlug(params.slug);
  if (!course) notFound();

  const Icon = ICON_MAP[course.icon];
  const isClass = course.type === "class";
  const eyebrowType = isClass ? "CLASS" : "ACTIVE BREAK";
  const t = THEME[course.cardColor];

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.shortDesc,
    url: absoluteUrl(`/courses/${course.slug}`),
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <section className="relative dot-grid pt-12 pb-24">
      <JsonLd data={courseJsonLd} />
      <div className="max-w-[960px] mx-auto px-5 sm:px-7">
        {/* breadcrumb */}
        <Link
          href="/#courses"
          className="inline-block text-[12px] text-neutral-500 hover:text-ink transition mb-7 anim-fade-up"
        >
          ← All courses
        </Link>

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-10 mb-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] mb-5 anim-fade-up">
              <span className={cn("w-1.5 h-1.5 rounded-full inline-block anim-pulse", t.accentDot)} />
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
                <span className={cn("rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[.18em]", t.solidBg, t.onSolid)}>
                  ★ COMPULSORY
                </span>
              )}
              {course.isElective && (
                <span className={cn("rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[.18em]", t.solidBg, t.onSolid)}>
                  ✦ ELECTIVE · +{nairaK(course.electiveFeeKobo ?? 0)}
                </span>
              )}
              {course.inPersonOnly && (
                <span className="frosted-glass rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[.18em]">
                  🏫 IN-PERSON ONLY
                </span>
              )}
              {!isClass && (
                <span className="frosted-glass rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[.18em]">
                  ☕ DAILY · FREE CHOICE
                </span>
              )}
            </div>

            {course.isElective && (
              <p className="mt-4 text-[13px] text-neutral-600 leading-relaxed max-w-[520px] anim-fade-up delay-3">
                This is an optional elective. The base camp fee covers the core programme; add it at registration for an extra{" "}
                <strong className="text-ink">{nairaK(course.electiveFeeKobo ?? 0)}</strong>, which covers the components your camper builds with and takes home.
              </p>
            )}

            {course.inPersonOnly && (
              <p className="mt-4 text-[13px] text-neutral-600 leading-relaxed max-w-[520px] anim-fade-up delay-3">
                This course runs on the <strong className="text-ink">in-person Lagos programme</strong> only — it isn&apos;t part of the online track.{" "}
                <Link href="/#programmes" className="underline underline-offset-2 hover:text-ink">Compare programmes →</Link>
              </p>
            )}
          </div>

          {/* big icon block, sticker-style in the course colour, lifts on hover */}
          <div className={cn("card-sticker card-sticker--tilt-r-lg shrink-0 mt-8 lg:mt-0 w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center anim-float-deep", t.solidBg)} style={{ borderRadius: 32 }}>
            <Icon size={72} className={t.onSolid} />
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          <Stat label="Hours / week" value={`${course.hoursPerWeek}h`} theme={t} />
          <Stat label="Sessions / week" value={String(course.sessionsPerWeek)} theme={t} />
          <Stat label="Total over cohort" value={`${course.hoursPerWeek * 2}h`} theme={t} highlight />
        </div>

        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-5 mb-5">
          {/* WHAT YOU'LL LEARN */}
          <Card title="What you'll learn" eyebrow="Curriculum" theme={t}>
            <ul className="space-y-2.5">
              {course.whatYoullLearn.map((item) => (
                <li key={item} className="flex gap-3 text-[14px] leading-relaxed">
                  <span className={cn("shrink-0 mt-2 w-1.5 h-1.5 rounded-full", t.accentDot)} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* OUTCOMES — solid course-coloured feature card */}
          <Card title="What you'll walk out with" eyebrow="Outcomes" theme={t} solid>
            <ul className="space-y-3">
              {course.outcomes.map((item) => (
                <li key={item} className="flex gap-3 text-[14px] leading-relaxed">
                  <span className={cn("shrink-0 font-accent font-bold", t.onSolid)}>✓</span>
                  <span className={t.onSolidDim}>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* TOOLS */}
        <div className="frosted-glass rounded-3xl p-6 sm:p-7 mb-5">
          <div className={cn("text-[10.5px] font-bold tracking-[.22em] uppercase mb-3", t.accentText)}>Tools you&apos;ll use</div>
          <div className="flex flex-wrap gap-2">
            {course.tools.map((tool) => (
              <span key={tool} className="frosted-glass-dark rounded-full px-3.5 py-1.5 text-[12px] font-semibold">
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* SAMPLE PROJECT — solid course-coloured block */}
        <div className={cn("rounded-3xl p-6 sm:p-8 mb-5", t.solidBg, t.onSolid)}>
          <div className={cn("text-[10.5px] font-bold tracking-[.22em] uppercase mb-3", t.onSolidDim)}>Sample project</div>
          <p className="text-[15px] sm:text-[16px] leading-relaxed">{course.sampleProject}</p>
        </div>

        <div className="mb-10">
          {/* SCHEDULE */}
          <Card title="Schedule" eyebrow="When it runs" theme={t}>
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

        {/* CTA STRIP, dark card + grass (orange) primary, matches the site CTA */}
        <div className="card-sticker card-sticker--ink card-sticker--no-tilt p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] text-white/70 mb-1.5">READY?</div>
            <div className="font-display font-bold text-[20px] sm:text-[26px] leading-tight text-white">
              Lock in your slot. Only 50 spots in the cohort.
            </div>
          </div>
          <Link href="/register" className="btn-grass shrink-0">
            Reserve a Slot <span aria-hidden>→</span>
          </Link>
        </div>

        {/* OTHER COURSES */}
        <div className="mt-16">
          <div className={cn("text-[10.5px] font-bold tracking-[.22em] uppercase mb-4", t.accentText)}>More on the programme</div>
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
                    <I size={28} className={cn("mb-3", THEME[c.cardColor].accentText)} />
                    <div className="font-display font-semibold text-[15px] leading-snug text-ink">{c.name}</div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight, theme }: { label: string; value: string; highlight?: boolean; theme: Theme }) {
  return (
    <div className={cn("rounded-2xl px-4 py-3 text-center", highlight ? cn(theme.solidBg, theme.onSolid) : "frosted-glass")}>
      <div className={cn("text-[10px] font-bold tracking-[.18em] uppercase", highlight ? "opacity-80" : "opacity-65")}>{label}</div>
      <div className="font-accent font-extrabold text-[22px] mt-1 leading-none tracking-tight">{value}</div>
    </div>
  );
}

function Card({
  title, eyebrow, theme, solid, children,
}: { title: string; eyebrow: string; theme: Theme; solid?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-3xl p-6 sm:p-7", solid ? cn(theme.solidBg, theme.onSolid) : "frosted-glass")}>
      <div className={cn(
        "text-[10.5px] font-bold tracking-[.22em] uppercase mb-3",
        solid ? theme.onSolidDim : theme.accentText
      )}>
        {eyebrow}
      </div>
      <h2 className={cn("font-display font-bold text-[19px] sm:text-[22px] leading-tight mb-4", solid ? theme.onSolid : "text-ink")}>{title}</h2>
      {children}
    </div>
  );
}
