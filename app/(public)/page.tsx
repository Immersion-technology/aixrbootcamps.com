import Link from "next/link";
import Image from "next/image";
import {
  RoboticIcon,
  CodeIcon,
  VrGlassesIcon,
  Rocket01Icon,
  GameController01Icon,
  MusicNote01Icon,
  CameraVideoIcon,
  TableTennisBatIcon,
  RacingFlagIcon,
} from "hugeicons-react";
import ScrollReveal from "@/components/ScrollReveal";
import FaqAccordion from "@/components/FaqAccordion";
import JsonLd from "@/components/JsonLd";
import { TESTIMONIALS, type Testimonial } from "@/lib/testimonials";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { PRICING, EARLY_BIRD_CUTOFF_DEFAULT, isEarlyBird as isEarlyBirdNow } from "@/lib/pricing";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESC,
  CAMP_START,
  CAMP_END,
  CONTACT_CITY,
  CONTACT_COUNTRY,
  PRICE_EARLY_BIRD,
  PRICE_REGULAR,
  absoluteUrl,
} from "@/lib/site";

export const metadata = {
  title: "AI & XR Summer Tech Bootcamp 2026 for Kids 10–17",
  description: SITE_DESC,
  alternates: { canonical: "/" },
};

// Organization + Event structured data for rich results. Values come from
// lib/site.ts so nothing is duplicated.
const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/logo.png"),
  description: SITE_DESC,
  address: { "@type": "PostalAddress", addressLocality: CONTACT_CITY, addressCountry: CONTACT_COUNTRY },
};

const EVENT_JSONLD = {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: "IMMERSIA AI & XR Summer Tech Bootcamp 2026",
  description: SITE_DESC,
  startDate: CAMP_START,
  endDate: CAMP_END,
  eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  url: SITE_URL,
  image: absoluteUrl("/opengraph-image"),
  location: [
    {
      "@type": "Place",
      name: "IMMERSIA",
      address: { "@type": "PostalAddress", addressLocality: CONTACT_CITY, addressCountry: CONTACT_COUNTRY },
    },
    {
      "@type": "VirtualLocation",
      url: absoluteUrl("/register"),
    },
  ],
  organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  offers: {
    "@type": "Offer",
    price: PRICE_EARLY_BIRD,
    priceCurrency: "NGN",
    availability: "https://schema.org/InStock",
    url: absoluteUrl("/register"),
    validFrom: "2026-01-01",
  },
};

type IconCmp = typeof RoboticIcon;

// ISR: regenerate the static HTML at most once a minute. Capacity / paid-count and the
// early-bird cutoff rarely change between renders, so the DB roundtrip can sit behind an
// edge cache rather than hitting MongoDB on every visit.
export const revalidate = 60;

async function getPublicConfig() {
  // Prices are env-configured in lib/pricing.ts; only capacity + cutoff come from the DB.
  try {
    await connectDB();
    const [capacity, paid, earlyBirdCutoff] = await Promise.all([
      getSetting<number>(SETTING_KEYS.CAPACITY, 50),
      Registration.countDocuments({ paymentStatus: "paid" }),
      getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, EARLY_BIRD_CUTOFF_DEFAULT),
    ]);
    return {
      slotsTotal: capacity,
      slotsPaid: paid,
      slotsLeft: Math.max(0, capacity - paid),
      earlyBirdCutoff,
      isClosed: paid >= capacity,
    };
  } catch {
    return {
      slotsTotal: 50,
      slotsPaid: 0,
      slotsLeft: 50,
      earlyBirdCutoff: EARLY_BIRD_CUTOFF_DEFAULT,
      isClosed: false,
    };
  }
}

export default async function Landing() {
  const cfg = await getPublicConfig();
  const earlyBird = isEarlyBirdNow(cfg.earlyBirdCutoff);
  const earlyBirdPrice = PRICING.earlyBird;
  const regularPrice = PRICING.regular;
  const naira = (k: number) => `₦${(k / 100).toLocaleString("en-NG")}`;
  // Human date derived from the cutoff so the promo copy can never go stale (e.g. "27 Jul").
  const cutoffLabel = new Date(cfg.earlyBirdCutoff).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
  // SEO Offer price reflects the price a visitor actually pays right now (env-driven).
  const eventJsonLd = {
    ...EVENT_JSONLD,
    offers: { ...EVENT_JSONLD.offers, price: earlyBird ? PRICE_EARLY_BIRD : PRICE_REGULAR },
  };

  return (
    <>
      <JsonLd data={ORG_JSONLD} />
      <JsonLd data={eventJsonLd} />
      <ScrollReveal />
      {/* ============ HERO ============ */}
      <section className="relative pt-6 sm:pt-10 pb-20 sm:pb-24 overflow-hidden dot-grid">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7 grid lg:grid-cols-[0.82fr_1.18fr] gap-10 lg:gap-10 items-start">

          {/* LEFT: camper photo + glass props orbiting */}
          <div className="relative min-h-[440px] sm:min-h-[600px] lg:min-h-[820px] flex items-center justify-center order-2 lg:order-1">
            <Image
              src="/hero.png"
              alt="An IMMERSIA camper holding a robot and a VR headset"
              width={1024}
              height={1536}
              priority
              sizes="(max-width: 1024px) 90vw, 900px"
              className="relative z-[3] w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[900px] lg:w-[130%] h-auto object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.18)]"
            />

            {/* Glass props, kept around the photo. The two that crowd hero copy on phones get hidden < 480px */}
            <GlassSlot src="/img/glass-arrow.png"       pos="top-[1%] left-[-4%] sm:left-[-2%]"      size="w-20 h-20 sm:w-24 sm:h-24"  anim="anim-drift delay-1"        z="z-[5]" mobileHide />
            <GlassSlot src="/img/glass-star.png"        pos="top-[40%] left-[-2%] sm:left-[2%]"      size="w-14 h-14 sm:w-18 sm:h-18"  anim="anim-spin-slow"            z="z-[5]" />
            <GlassSlot src="/img/glass-orb.png"         pos="top-[8%] right-[-2%] sm:right-[2%]"     size="w-16 h-16 sm:w-20 sm:h-20"  anim="anim-float delay-2"        z="z-[5]" />
            <GlassSlot src="/img/glass-paper-plane.png" pos="top-[36%] right-[-6%] sm:right-[-3%]"   size="w-20 h-20 sm:w-24 sm:h-24"  anim="anim-drift delay-2"        z="z-[5]" />
            <GlassSlot src="/img/glass-cube.png"        pos="bottom-[20%] left-[-4%] sm:left-[-1%]"  size="w-20 h-20 sm:w-24 sm:h-24"  anim="anim-wobble"               z="z-[5]" mobileHide />
            <GlassSlot src="/img/glass-laptop.png"      pos="bottom-[6%] right-[-6%] sm:right-[-3%]" size="w-24 h-24 sm:w-32 sm:h-32"  anim="anim-float-deep delay-3"   z="z-[5]" />

          </div>

          {/* RIGHT: stickers + wordmark + ticket CTA */}
          <div className="relative z-[5] order-1 lg:order-2 flex flex-col">
            {/* tiny welcome paragraph, desktop only (hidden on phones) */}
            <p className="hidden lg:block text-[13px] text-neutral-700 leading-relaxed max-w-[320px] mb-5 lg:ml-auto lg:text-right anim-fade-up">
              Welcome to the AI &amp; XR Summer Tech Bootcamp. Nigeria&apos;s only summer programme where kids 10–17 ship a deployed AI app, build a VR world, produce an AI-assisted track and deliver a live startup pitch to a jury. <strong>27 July – 4 September 2026.</strong> Join us <strong>in-person in Lagos or live online.</strong>
            </p>

            {/* Sign-up banner, full-width lead-in to the AI & XR wordmark below */}
            <div className="relative mb-3 sm:mb-4 flex justify-center lg:justify-end">
              <div className="card-sticker card-sticker--green card-sticker--tilt-r anim-fade-up delay-1 inline-block px-5 sm:px-6 py-2.5 sm:py-3 max-w-full" style={{ borderRadius: 18 }}>
                <div className="font-bubble whitespace-nowrap text-[clamp(14px,2.4vw,22px)] leading-none tracking-tight text-white">SIGN UP YOUR KIDS TODAY FOR…</div>
              </div>
            </div>

            {/* The wordmark, three stacked lines, bubble + outline */}
            <h1 className="flex flex-col items-center lg:items-end leading-[.92] tracking-tight mb-5 sm:mb-7 text-center lg:text-right">
              <span className="font-bubble text-violet-brand anim-fade-up delay-1 text-[clamp(72px,18vw,108px)]">AI &amp; XR</span>
              <span className="wordmark anim-fade-up delay-2 text-[clamp(82px,22vw,140px)]">SUMMER</span>
              <span className="wordmark wordmark--green anim-fade-up delay-3 text-[clamp(82px,22vw,140px)]">BOOTCAMP</span>
            </h1>

            {/* AGES + JUL 27 + Ticket coupon: AGES and JUL 27 stay inline as one group
                on mobile (wrapped in an inner flex). On desktop all three sit inline. */}
            <div className="flex items-stretch gap-5 sm:gap-7 lg:gap-8 lg:gap-y-6 self-center lg:self-end anim-fade-up delay-3 flex-wrap justify-center lg:justify-end">
              {/* Inline AGES + JUL 27 group, never wraps internally.
                  On desktop the group is given a fixed width so it lands slightly
                  wider than the BOOTCAMP wordmark above it (visual cascade). */}
              <div className="flex items-stretch gap-2.5 sm:gap-4 lg:gap-5 flex-nowrap lg:w-[580px]">
                {/* AGES 10-17 frosted glass card. lg:flex-1 lets it fill the
                    remaining width inside the fixed-width inner group. */}
                <div className="bg-petrol-brand text-white rounded-2xl px-4 py-3 sm:px-7 sm:py-4 lg:px-5 lg:py-4 rotate-[-2deg] flex flex-col justify-center min-w-[150px] sm:min-w-[210px] lg:flex-1 shadow-[0_12px_30px_-12px_rgba(45,46,131,.55)] ring-1 ring-white/10">
                  <div className="font-bubble text-[14px] sm:text-[18px] leading-none mb-1.5 text-white">AGES 10–17</div>
                  <ul className="text-[10px] sm:text-[11px] text-white/85 space-y-0.5 leading-snug whitespace-nowrap">
                    <li className="flex items-start gap-1.5"><span className="text-white">•</span> 6 courses</li>
                    <li className="flex items-start gap-1.5"><span className="text-white">•</span> Daily Mon – Fri</li>
                    <li className="flex items-start gap-1.5"><span className="text-white">•</span> 9 AM – 1:30 PM</li>
                  </ul>
                </div>

                {/* JUL 27 date sticker */}
                <div className="card-sticker card-sticker--pink card-sticker--tilt-l-lg px-3.5 py-3 sm:px-5 sm:py-4 lg:px-4 lg:py-4 shrink-0 flex flex-col justify-center" style={{ borderRadius: 18 }}>
                  <div className="text-[8.5px] sm:text-[10px] font-bold tracking-[.22em] text-white/85 uppercase">Boot camp starts</div>
                  <div className="font-bubble text-[18px] sm:text-[24px] leading-none mt-1 text-white">JUL 27</div>
                  <div className="text-[8.5px] sm:text-[10px] font-bold tracking-[.18em] text-white/85 uppercase mt-0.5">3 cohorts · 2 wks each</div>
                </div>
              </div>

              {/* Ticket coupon CTA. The eyebrow + price adapt to whether early-bird is still
                  live (derived from the cutoff), so it never advertises an expired promo.
                  block + lg:w-full so on desktop it stretches across the full right column. */}
              <Link
                href="/register"
                className="group block lg:w-full"
                aria-label={
                  earlyBird
                    ? `Reserve a slot. Early bird ${naira(earlyBirdPrice)}, ends ${cutoffLabel}`
                    : `Reserve a slot. Boot camp fee ${naira(regularPrice)}`
                }
              >
                <div className="card-ticket card-ticket--amber flex items-stretch gap-4 sm:gap-5 group-hover:-translate-y-1 transition-transform h-full">
                  <div className="flex-1 pr-2 flex flex-col justify-center">
                    <div className="text-[10px] sm:text-[10.5px] font-bold tracking-[.22em] uppercase text-ink/80">
                      {earlyBird ? `Early bird · ends ${cutoffLabel}` : "Boot camp fee"}
                    </div>
                  <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bubble text-[28px] sm:text-[34px] leading-none text-ink">{naira(earlyBird ? earlyBirdPrice : regularPrice)}</span>
                      {earlyBird && <span className="text-[14px] sm:text-[18px] line-through text-ink/45">{naira(regularPrice)}</span>}
                    </div>
                    <div className="text-[10.5px] font-bold tracking-[.16em] uppercase text-ink/60 mt-1">{cfg.slotsTotal} slots only</div>
                  </div>
                  <div className="card-ticket__seam" aria-hidden />
                  <div className="flex flex-col items-center justify-center gap-2 pl-2">
                    <span className="card-ticket__barcode" aria-hidden />
                    <span className="text-[9px] font-bold tracking-[.2em] uppercase text-ink/70">Reserve →</span>
                  </div>
                </div>
              </Link>
            </div>

            <Link
              href="/contact"
              className="anim-fade-up delay-5 text-[12.5px] mt-4 text-neutral-600 hover:text-ink underline underline-offset-4 decoration-2 self-center lg:self-end"
            >
              or talk to a human →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ COURSES GRID ============ */}
      <section id="courses" className="relative overflow-hidden pt-6 pb-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
          <div className="mb-10 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left gap-4">
            <h2 className="font-bubble text-[clamp(30px,4vw,52px)] leading-[1.02] tracking-tight max-w-[680px] text-ink">
              Six immersive courses<br />plus three side attractions.
            </h2>
            <p className="text-[13px] text-neutral-600 max-w-[300px]">Tap any card for the full curriculum, tools and sample project.</p>
          </div>

          <div className="stagger-group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <CourseCard i={0} num="01" slug="vibe-coding"      Icon={CodeIcon}        sticker="cyan"    title={<>VIBE CODING &amp; AI PROMPT ENGINEERING</>}  sub="Pair-program with AI to ship a deployed web app. No prior code needed." />
            <CourseCard i={1} num="02" slug="entrepreneurship" Icon={Rocket01Icon}    sticker="orange"  title={<>ENTREPRENEURSHIP &amp; PITCHING</>}          sub="Idea → product → live Demo Day pitch in two weeks."                        tag="★ COMPULSORY" />
            <CourseCard i={2} num="03" slug="content-creation" Icon={CameraVideoIcon} sticker="pink"    title={<>CONTENT CREATION</>}                          sub="Script, shoot and edit short-form videos worth posting." />
            <CourseCard i={3} num="04" slug="robotics"         Icon={RoboticIcon}     sticker="violet"  title={<>ROBOTICS &amp; EMBEDDED SYSTEMS</>}          sub="Blink an LED on day one; build your own gadget and keep the kit by week's end." tag={`✦ ELECTIVE · +${naira(PRICING.robotics)}`} />
            <CourseCard i={4} num="05" slug="3d-vr"            Icon={VrGlassesIcon}   sticker="emerald" title={<>3D CHARACTER &amp; VR WORLD CREATION</>}    sub="Sculpt characters in Blender. Step inside the world you made." />
            <CourseCard i={5} num="06" slug="ai-music"         Icon={MusicNote01Icon} sticker="amber"   title={<>AI MUSIC PRODUCTION</>}                     sub="Produce a finished, mixed track with AI-assisted tools." />
          </div>

          {/* SIDE ATTRACTIONS, renamed from Active Breaks. Until the cutout photos
              of paddle/kart/PS5 arrive, we render icon-only sticker cards as a
              graceful fallback. The strip uses horizontal-scroll-snap on mobile so
              one card sits fully visible with the next peeking. */}
          <div className="mt-16">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-baseline sm:text-left flex-wrap gap-3 mb-5">
              <span className="font-bubble text-[28px] sm:text-[36px] leading-none text-ink">SIDE ATTRACTIONS</span>
              <span className="text-[12.5px] text-neutral-600">30 min daily · each camper picks one with a token</span>
            </div>
            <div className="stagger-group grid grid-cols-1 sm:grid-cols-3 gap-5 -mx-5 sm:mx-0 px-5 sm:px-0 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none flex sm:grid">
              <SideAttraction i={0} slug="table-tennis"     Icon={TableTennisBatIcon} sticker="cobalt"  title="TABLE TENNIS" desc="A fast reset during the afternoon break." />
              <SideAttraction i={1} slug="go-karting"       Icon={RacingFlagIcon}     sticker="emerald" title="GO KARTING"   desc="Supervised circuits with full safety gear." />
              <SideAttraction i={2} slug="pro-gaming"       Icon={GameController01Icon} sticker="pink"  title="PRO GAMING"          desc="Coached competitive gaming on real rigs." />
            </div>
          </div>
        </div>
      </section>

      {/* ============ TIMETABLE ============ */}
      <section id="timetable" className="relative overflow-hidden py-20 sm:py-28 bg-white border-y border-black/[.05]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-center md:text-left">
            <div>
              <span className="text-[11px] font-bold tracking-[.22em] text-aqua-deep">MON – FRI · 9:00 AM – 1:30 PM · AGES 10–17</span>
              <h2 className="font-bubble text-[clamp(30px,4.2vw,52px)] leading-[1.02] tracking-tight mt-3 max-w-[640px] text-ink">
                The actual week<br />your kid will live.
              </h2>
            </div>
            <p className="text-[13px] text-neutral-600 max-w-[340px] mx-auto md:mx-0">
              Two 2-hour deep-work blocks back-to-back, then a 30-minute side attraction each camper picks with a daily token.
            </p>
          </div>

          {/* DESKTOP grid (md+) */}
          <div className="hidden md:block">
            <div className="overflow-x-auto -mx-5 sm:-mx-7 px-5 sm:px-7 pb-3">
              <div className="stagger-group min-w-[920px] grid grid-cols-[130px_repeat(5,1fr)] gap-2">
                <div />
                <DayHeader>MON</DayHeader>
                <DayHeader>TUE</DayHeader>
                <DayHeader>WED</DayHeader>
                <DayHeader>THU</DayHeader>
                <DayHeader>FRI</DayHeader>

                <TimeLabel main="9:00 – 11:00" hint="2 hrs" />
                <Cell i={0} tone="cyan"      Icon={CodeIcon}        title="Vibe Coding & AI"   sub="" />
                <Cell i={1} tone="pink"      Icon={VrGlassesIcon}   title="3D & VR World"      sub="" />
                <Cell i={2} tone="violet"    Icon={CameraVideoIcon} title="Content Creation"   sub="External" />
                <Cell i={3} tone="green"     Icon={Rocket01Icon}    title="Entrepreneurship ★" sub="" />
                <Cell i={4} tone="orange"    Icon={RoboticIcon}     title="Robotics / Music"   sub="Paired elective" />

                <TimeLabel main="11:00 – 13:00" hint="2 hrs" />
                <Cell i={5}  tone="green"    Icon={Rocket01Icon}    title="Entrepreneurship ★" sub="" />
                <Cell i={6}  tone="orange"   Icon={RoboticIcon}     title="Robotics / Music"   sub="Paired elective" />
                <Cell i={7}  tone="cyan"     Icon={CodeIcon}        title="Vibe Coding & AI"   sub="" />
                <Cell i={8}  tone="pink"     Icon={VrGlassesIcon}   title="3D & VR World"      sub="" />
                <Cell i={9}  tone="violet"   Icon={CameraVideoIcon} title="Content Creation"   sub="External" />

                <TimeLabel main="13:00 – 13:30" hint="30 min break" />
                <BreakRow i={10} />
              </div>
            </div>
          </div>

          {/* MOBILE rows-as-cards (< md): each day is one stacked card with its
              own list of time blocks. Each line gets a 6px left border in its
              class tone for vertical scannability. */}
          <div className="md:hidden stagger-group space-y-4">
            <DayCard i={0} day="MON" rows={[
              { time: "9:00 – 11:00",   title: "Vibe Coding & AI",          sub: "",                  tone: "cyan"  },
              { time: "11:00 – 13:00",  title: "Entrepreneurship ★",        sub: "",                  tone: "green" },
              { time: "13:00 – 13:30",  title: "Break Activity",            sub: "Table Tennis · Go Karting · Pro Gaming", tone: "gray", isBreak: true },
            ]} />
            <DayCard i={1} day="TUE" rows={[
              { time: "9:00 – 11:00",   title: "3D & VR World",             sub: "",                  tone: "pink"  },
              { time: "11:00 – 13:00",  title: "Robotics / Music",          sub: "Paired elective",   tone: "orange" },
              { time: "13:00 – 13:30",  title: "Break Activity",            sub: "Table Tennis · Go Karting · Pro Gaming", tone: "gray", isBreak: true },
            ]} />
            <DayCard i={2} day="WED" rows={[
              { time: "9:00 – 11:00",   title: "Content Creation",          sub: "",                  tone: "violet" },
              { time: "11:00 – 13:00",  title: "Vibe Coding & AI",          sub: "",                  tone: "cyan"  },
              { time: "13:00 – 13:30",  title: "Break Activity",            sub: "Table Tennis · Go Karting · Pro Gaming", tone: "gray", isBreak: true },
            ]} />
            <DayCard i={3} day="THU" rows={[
              { time: "9:00 – 11:00",   title: "Entrepreneurship ★",        sub: "",                  tone: "green" },
              { time: "11:00 – 13:00",  title: "3D & VR World",             sub: "",                  tone: "pink"  },
              { time: "13:00 – 13:30",  title: "Break Activity",            sub: "Table Tennis · Go Karting · Pro Gaming", tone: "gray", isBreak: true },
            ]} />
            <DayCard i={4} day="FRI" rows={[
              { time: "9:00 – 11:00",   title: "Robotics / Music",          sub: "Paired elective",   tone: "orange" },
              { time: "11:00 – 13:00",  title: "Content Creation",          sub: "",                  tone: "violet" },
              { time: "13:00 – 13:30",  title: "Break Activity",            sub: "Table Tennis · Go Karting · Pro Gaming", tone: "gray", isBreak: true },
            ]} />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            <LegendItem tone="cyan"   label="Vibe Coding & AI Prompt Engineering" />
            <LegendItem tone="green"  label="Entrepreneurship ★ COMPULSORY" />
            <LegendItem tone="violet" label="Content Creation" />
            <LegendItem tone="orange" label="Robotics / Singing & AI Music · Paired Elective" />
            <LegendItem tone="pink"   label="3D Character & VR World" />
            <LegendItem tone="gray"   label="Break Activity · Table Tennis · Go Karting · Pro Gaming · token-based" />
          </div>
          <p className="mt-6 text-[12px] text-neutral-500 leading-relaxed max-w-[820px]">
            ① All 5 classes run 2 sessions × 2 hrs = 4 hrs / week = 8 hrs per cohort. ② Entrepreneurship is COMPULSORY for every camper (Mon late-morning + Thu early-morning). ③ Robotics & Embedded and Singing & AI Music are a paired elective. Pick one track. ④ All three break activities (Table Tennis, Go Karting, Pro Gaming) are available daily 1:00 – 1:30 PM via the in-app token system.
          </p>
        </div>
      </section>

      {/* ============ PITCH DAY ============ */}
      <section className="relative overflow-hidden py-24 sm:py-28">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
          <div
            className="relative overflow-hidden rounded-[32px] ring-1 ring-white/15 shadow-[0_30px_60px_-30px_rgba(0,0,0,.55)]"
            style={{
              backgroundImage:
                "linear-gradient(110deg,#ffbe0b 0 14.3%,#fb5607 14.3% 28.6%,#ff006e 28.6% 42.9%,#8338ec 42.9% 57.1%,#3a86ff 57.1% 71.4%,#06d6a0 71.4% 85.7%,#2d2e83 85.7% 100%)",
            }}
          >
            {/* darkening scrim — keeps the white copy legible over the colour rush
                while the saturated slices stay vivid toward the corners */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,15,15,.62),rgba(15,15,15,.24))]"
            />
            <div className="stagger-group relative z-[1] px-6 sm:px-12 pt-16 pb-16 text-center text-white [text-shadow:0_2px_12px_rgba(0,0,0,.45)]">
              {/* corner sparkles */}
              <span aria-hidden className="absolute top-10 left-10 text-[36px] leading-none text-gold-brand/70 anim-spin-slow inline-block">✦</span>
              <span aria-hidden className="absolute top-12 right-12 text-[28px] leading-none text-white/50 anim-pulse inline-block">✦</span>
              <span aria-hidden className="absolute bottom-10 left-[28%] text-[24px] leading-none text-white/40 anim-pulse delay-1 inline-block">✦</span>
              <span aria-hidden className="absolute bottom-12 right-[18%] text-[30px] leading-none text-gold-brand/60 anim-pulse delay-2 inline-block">✦</span>

              <span className="stagger-rise inline-block text-[11px] font-bold tracking-[.22em] uppercase text-white/85 mb-4 relative z-[2]" style={{ "--i": 0 } as React.CSSProperties}>
                Demo Day · the Saturday after each cohort · 8 Aug · 22 Aug · 5 Sep 2026
              </span>

              <h2 className="stagger-rise font-bubble text-[clamp(34px,5vw,68px)] leading-[1.02] mb-6 relative z-[2] text-white" style={{ "--i": 1 } as React.CSSProperties}>
                BUILD A STARTUP.<br />
                PITCH IT <span className="text-gold-brand">LIVE</span>.<br />
                WIN.
              </h2>

              <p className="stagger-rise text-[14.5px] text-white/85 leading-relaxed max-w-[560px] mx-auto mb-10 relative z-[2]" style={{ "--i": 2 } as React.CSSProperties}>
                Every camper presents the startup idea they&apos;ve been building since week one to a live jury of working founders. Top three teams take home a prize pack and a feature on IMMERSIA&apos;s channels.
              </p>

              <Link href="/register" className="stagger-rise btn-grass inline-flex relative z-[2]" style={{ "--i": 3 } as React.CSSProperties}>
                Reserve your slot <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="relative py-20 sm:py-24 bg-white border-y border-black/[.05]">
        <div className="stagger-group max-w-[1180px] mx-auto px-5 sm:px-7">
          <div className="text-center mb-10 sm:mb-14">
            <span
              className="stagger-rise inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5"
              style={{ "--i": 0 } as React.CSSProperties}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-grass-brand inline-block anim-pulse" />
              LOVED BY FAMILIES
            </span>
            <h2
              className="stagger-rise font-bubble leading-[1] tracking-tight text-[clamp(34px,5vw,60px)] text-ink"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              WHAT PARENTS &amp;<br />
              <span className="wordmark wordmark--green">CAMPERS SAY.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} i={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ PARENT FAQ ============ */}
      <section className="relative py-20 sm:py-24">
        <div className="stagger-group max-w-[860px] mx-auto px-5 sm:px-7">
          <div className="text-center mb-10 sm:mb-12">
            <span
              className="stagger-rise inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5"
              style={{ "--i": 0 } as React.CSSProperties}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-aqua-brand inline-block anim-pulse" />
              PARENT FAQ
            </span>
            <h2
              className="stagger-rise font-bubble leading-[1] tracking-tight text-[clamp(34px,5vw,60px)] mb-3 text-ink"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              PARENTS ASK.<br />
              <span className="wordmark wordmark--green">WE ANSWER.</span>
            </h2>
            <p
              className="stagger-rise text-[14.5px] text-neutral-700 leading-relaxed max-w-[520px] mx-auto"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              The questions parents actually ask us before sending their kid. Tap one to expand.
            </p>
          </div>

          <FaqAccordion reveal="stagger" staggerOffset={3} />

          <div className="mt-10 sm:mt-12 text-center">
            <Link
              href="/contact"
              className="inline-block text-[13.5px] font-semibold text-ink/80 underline underline-offset-4 decoration-2 hover:text-grass-deep transition"
            >
              Still have questions? Talk to a human →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-24 sm:py-28 relative overflow-hidden">
        <div className="stagger-group max-w-[1180px] mx-auto px-5 sm:px-7 grid md:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <Image
            src="/glass-blob.png"
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            sizes="(max-width: 768px) 90vw, 420px"
            className="stagger-rise w-full max-w-[420px] justify-self-center object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.15)]"
            style={{ "--i": 0 } as React.CSSProperties}
          />
          <div className="stagger-rise relative text-center md:text-left" style={{ "--i": 1 } as React.CSSProperties}>
            <h2 className="font-bubble text-[clamp(36px,5.6vw,76px)] leading-[1.02] text-ink">
              WHEN THESE<br />
              <span className="inline-block card-sticker card-sticker--green card-sticker--tilt-r px-6 pb-1 my-1.5 align-baseline" style={{ borderRadius: 999 }}>{cfg.slotsLeft} SLOTS</span><br />
              ARE GONE,<br />
              THEY&apos;RE GONE.
            </h2>
            <p className="max-w-[480px] my-6 text-neutral-700 text-[14.5px] leading-relaxed mx-auto md:mx-0">
              The 2026 cohorts run <strong>27 July – 4 September</strong> as three back-to-back 2-week sessions. Once we hit {cfg.slotsTotal} paid registrations the camp closes. Next AI &amp; XR isn&apos;t until summer 2027.{" "}
              {earlyBird ? (
                <><strong>Early-bird {naira(earlyBirdPrice)} ends {cutoffLabel}</strong> — after that it&apos;s {naira(regularPrice)}.</>
              ) : (
                <>The boot camp fee is <strong>{naira(regularPrice)}</strong>.</>
              )}{" "}
              It covers the 5 core courses, daily side attractions, materials and Demo Day — Robotics is an optional +{naira(PRICING.robotics)} elective. Daily attractions are subject to token usage.
            </p>
            <div className="mb-6 rounded-2xl border-2 border-aqua-brand/30 bg-aqua-brand/[.06] px-4 py-3 text-left max-w-[480px] mx-auto md:mx-0">
              <div className="text-[10.5px] font-bold tracking-[.2em] text-aqua-deep uppercase mb-1">New · Online track</div>
              <p className="text-[13px] text-neutral-700 leading-relaxed">
                Can&apos;t make Lagos? Join <strong>live online for {naira(PRICING.online)}</strong> — three courses (Vibe Coding, Content Creation, 3D &amp; VR) with a welcome kit delivered nationwide (+{naira(PRICING.delivery)}). The Demo Day pitch, prize and Robotics are in-person only.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
              <Link href="/register" className="btn-grass">
                Reserve a Slot <span aria-hidden>→</span>
              </Link>
              <Link href="/register?mode=online" className="btn-light">
                Join Online · {naira(PRICING.online)}
              </Link>
              <Link href="/contact" className="text-[13px] font-semibold text-neutral-600 hover:text-ink underline underline-offset-4">
                Talk to a Human
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================== components ============================== */

const ICON_COLOR_LEGEND: Record<string, string> = {
  cyan:   "bg-aqua-brand",
  green:  "bg-grass-brand",
  ink:    "bg-ink",
  violet: "bg-violet-brand",
  orange: "bg-orange-400",
  mint:   "bg-emerald-400",
  pink:   "bg-pink-400",
  gray:   "bg-neutral-400",
};

// sticker variants whose background is dark/saturated enough to need white text
// (azure, violet, pink, cobalt, ink) — everything else (orange, amber, emerald,
// and the -soft pastels) reads better with near-black ink text.
const WHITE_TEXT_STICKERS = new Set(["cyan", "orange", "violet", "pink", "cobalt", "ink", "emerald"]);

type StickerTone =
  | "cyan" | "cyan-soft" | "green" | "green-soft" | "ink"
  | "pink" | "violet" | "emerald" | "amber" | "cobalt" | "orange";

function CourseCard({
  i, num, slug, Icon, sticker, title, sub, tag,
}: {
  i: number;
  num: string;
  slug: string;
  Icon: IconCmp;
  sticker: StickerTone;
  title: React.ReactNode;
  sub?: string;
  tag?: string;
}) {
  const isDark = WHITE_TEXT_STICKERS.has(sticker);
  return (
    <Link
      href={`/courses/${slug}`}
      className={`stagger-rise card-sticker card-sticker--${sticker} group flex flex-col gap-2 min-h-[240px]`}
      style={{ "--i": i, "--tilt": `${i % 2 === 0 ? -1.5 : 1.5}deg` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className={`font-bubble text-[26px] leading-none ${isDark ? "text-white/60" : "text-ink/55"}`}>{num}</div>
        <Icon size={36} strokeWidth={1.8} className={isDark ? "text-white" : "text-ink"} />
      </div>
      {tag && (
        <span className={`sticker-pill ${isDark ? "sticker-pill--cyan" : ""} self-start`}>
          {tag}
        </span>
      )}
      <h3 className="font-display font-bold text-[20px] sm:text-[22px] leading-[1.1] tracking-tight mt-2">{title}</h3>
      {sub && (
        <p className={`text-[12px] sm:text-[12.5px] leading-snug ${isDark ? "text-white/80" : "text-ink/75"}`}>{sub}</p>
      )}
      <span className={`mt-auto self-end text-[20px] font-bold transition-transform group-hover:translate-x-1 ${isDark ? "text-white" : "text-ink"}`} aria-hidden>→</span>
    </Link>
  );
}

function SideAttraction({
  i, slug, Icon, sticker, title, desc,
}: { i: number; slug: string; Icon: IconCmp; sticker: StickerTone; title: string; desc: string }) {
  const isDark = WHITE_TEXT_STICKERS.has(sticker);
  return (
    <Link
      href={`/courses/${slug}`}
      className={`stagger-rise card-sticker card-sticker--${sticker} group flex flex-col gap-3 min-w-[260px] sm:min-w-0 snap-start`}
      style={{ "--i": i, "--tilt": `${i % 2 === 0 ? -2 : 2}deg` } as React.CSSProperties}
    >
      <Icon size={48} strokeWidth={1.8} className={isDark ? "text-white" : "text-ink"} />
      <h3 className="font-display font-bold text-[20px] leading-tight tracking-tight mt-2">{title}</h3>
      <p className={`text-[12.5px] leading-snug ${isDark ? "text-white/85" : "text-ink/85"}`}>{desc}</p>
      <span className={`mt-2 text-[10px] font-bold tracking-[.22em] uppercase ${isDark ? "text-white/70" : "text-ink/70"}`}>Daily · free choice</span>
    </Link>
  );
}

function DayHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center font-bubble text-[18px] tracking-tight text-ink py-2">
      {children}
    </div>
  );
}

function TimeLabel({ main, hint }: { main: string; hint: string }) {
  return (
    <div className="text-right pr-3 self-stretch flex flex-col justify-center">
      <div className="font-accent text-[12px] font-extrabold leading-tight text-ink">{main}</div>
      <div className="text-[9.5px] opacity-50 tracking-wide uppercase mt-0.5">{hint}</div>
    </div>
  );
}

function Cell({ i, tone, Icon, title, sub }: { i: number; tone: string; Icon: IconCmp; title: string; sub: string }) {
  const toneClass: Record<string, string> = {
    cyan:   "bg-aqua-soft/60 border-aqua-brand/40 text-ink",
    green:  "bg-grass-soft/40 border-grass-brand/40 text-ink",
    ink:    "bg-ink text-white border-ink",
    violet: "bg-violet-soft/60 border-violet-brand/40 text-ink",
    pink:   "bg-pink-soft/60 border-pink-deep/40 text-ink",
    orange: "bg-orange-100 border-orange-300/60 text-ink",
    mint:   "bg-mint-soft/60 border-mint-deep/40 text-ink",
  };
  const iconColor: Record<string, string> = {
    cyan: "text-aqua-deep", green: "text-grass-deep", ink: "text-white",
    violet: "text-violet-brand",
    pink: "text-pink-deep", orange: "text-orange-600", mint: "text-mint-deep",
  };
  return (
    <div
      className={`stagger-rise rounded-2xl border-2 p-3 flex flex-col gap-1 min-h-[100px] transition-shadow duration-300 hover:shadow-[0_10px_24px_rgba(0,0,0,.08)] ${toneClass[tone] || "bg-white border-neutral-200"}`}
      style={{ "--i": i } as React.CSSProperties}
    >
      <Icon size={22} strokeWidth={1.8} className={iconColor[tone] || "text-ink"} />
      <div className="font-semibold leading-tight text-[12px] mt-1">{title}</div>
      <div className="text-[9.5px] opacity-70 mt-auto tracking-wide uppercase">{sub}</div>
    </div>
  );
}

function BreakRow({ i }: { i: number }) {
  return (
    <div
      className="stagger-rise col-span-5 rounded-2xl border-2 border-neutral-200 p-3 flex items-center gap-3 min-h-[58px] bg-neutral-100/80"
      style={{ "--i": i } as React.CSSProperties}
    >
      <span className="text-[10px] font-bold tracking-[.22em] text-neutral-500 uppercase shrink-0 hidden md:block">
        Daily · free choice
      </span>
      <span className="hidden md:inline-block w-px h-5 bg-neutral-300" />
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold"><TableTennisBatIcon size={16} className="text-orange-500" /> Table Tennis</span>
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold"><RacingFlagIcon size={16} className="text-neutral-700" /> Go Karting</span>
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold"><GameController01Icon size={16} className="text-aqua-deep" /> Pro Gaming</span>
      </div>
    </div>
  );
}

function DayCard({
  i, day, rows,
}: {
  i: number;
  day: string;
  rows: Array<{ time: string; title: string; sub: string; tone: string; isBreak?: boolean }>;
}) {
  const toneBar: Record<string, string> = {
    cyan: "bg-aqua-brand",
    green: "bg-grass-brand",
    ink: "bg-ink",
    violet: "bg-violet-brand",
    pink: "bg-pink-deep",
    orange: "bg-orange-400",
    gray: "bg-neutral-300",
  };
  const dayTints = ["bg-aqua-soft", "bg-gold-soft", "bg-jade-soft", "bg-violet-soft", "bg-grass-soft"];
  return (
    <div
      className={`stagger-rise ${dayTints[i % dayTints.length]} border border-black/[.06] rounded-3xl p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]`}
      style={{ "--i": i } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-bubble text-[28px] leading-none text-ink">{day}</div>
        <div className="text-[10.5px] font-bold tracking-[.18em] uppercase text-neutral-500">Schedule</div>
      </div>
      <ul className="space-y-2.5">
        {rows.map((r, idx) => (
          <li key={idx} className="flex gap-3">
            <div className={`w-[6px] rounded-full shrink-0 ${toneBar[r.tone] || "bg-neutral-300"}`} />
            <div className="flex-1 min-w-0">
              <div className="font-accent text-[11px] font-extrabold tracking-[.14em] uppercase text-neutral-500">{r.time}</div>
              <div className={`font-semibold text-[14px] leading-snug ${r.isBreak ? "text-neutral-700" : "text-ink"}`}>{r.title}</div>
              <div className="text-[12px] text-neutral-600 leading-snug mt-0.5">{r.sub}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestimonialCard({ i, t }: { i: number; t: Testimonial }) {
  const avatarTone: Record<Testimonial["tone"], string> = {
    cyan: "bg-aqua-brand text-ink",
    green: "bg-grass-brand text-ink",
    violet: "bg-violet-brand text-white",
    pink: "bg-pink-deep text-white",
    amber: "bg-gold-brand text-ink",
  };
  return (
    <figure
      className="stagger-rise bg-cream border border-black/[.06] rounded-3xl p-6 sm:p-8 flex flex-col shadow-[0_8px_24px_-14px_rgba(0,0,0,0.14)]"
      style={{ "--i": i } as React.CSSProperties}
    >
      <div className="font-bubble text-[40px] leading-none text-grass-brand mb-2" aria-hidden>
        &ldquo;
      </div>
      <blockquote className="text-[15px] sm:text-[16px] leading-relaxed text-ink/85 flex-1">
        {t.quote}
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span
          className={`w-11 h-11 rounded-full grid place-items-center font-bubble text-[15px] shrink-0 ${avatarTone[t.tone]}`}
          aria-hidden
        >
          {t.initials}
        </span>
        <span>
          <span className="block font-display font-bold text-[14px] text-ink leading-tight">{t.name}</span>
          <span className="block text-[12px] text-neutral-500">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function LegendItem({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[11.5px] text-neutral-700">
      <span className={`w-2.5 h-2.5 rounded-full ${ICON_COLOR_LEGEND[tone] || "bg-neutral-300"}`} />
      {label}
    </span>
  );
}

function GlassSlot({
  src, pos, size, anim, z = "z-[2]", mobileHide,
}: { src: string; pos: string; size: string; anim: string; z?: string; mobileHide?: boolean }) {
  return (
    <div className={`absolute ${z} ${pos} ${size} ${anim} ${mobileHide ? "glass-prop-mobile-hide" : ""}`} aria-hidden>
      <div className="relative w-full h-full glass-prop">
        <Image
          src={src}
          alt=""
          fill
          sizes="128px"
          className="object-contain drop-shadow-[0_10px_20px_rgba(15,15,15,0.18)]"
        />
      </div>
    </div>
  );
}
