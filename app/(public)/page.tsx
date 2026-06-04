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
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";

type IconCmp = typeof RoboticIcon;

// ISR: regenerate the static HTML at most once a minute. Capacity / paid-count
// rarely change between renders, so the DB roundtrip can sit behind an edge cache.
// (The cfg override below forces price + slots anyway, we mainly need this to
// avoid hitting MongoDB on every visit.)
export const revalidate = 60;

async function getPublicConfig() {
  try {
    await connectDB();
    const [capacity, paid, earlyBirdCutoff, earlyBirdPrice, regularPrice, laptopPrice] = await Promise.all([
      getSetting<number>(SETTING_KEYS.CAPACITY, 50),
      Registration.countDocuments({ paymentStatus: "paid" }),
      getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, "2026-06-30T23:59:59.000Z"),
      getSetting<number>(SETTING_KEYS.EARLY_BIRD_PRICE, 8000000),
      getSetting<number>(SETTING_KEYS.REGULAR_PRICE, 10000000),
      getSetting<number>(SETTING_KEYS.LAPTOP_RENTAL_PRICE, 2000000),
    ]);
    const isEarlyBird = new Date() < new Date(earlyBirdCutoff);
    return {
      slotsTotal: capacity,
      slotsPaid: paid,
      slotsLeft: Math.max(0, capacity - paid),
      isEarlyBird,
      earlyBirdPrice,
      regularPrice,
      laptopPrice,
      isClosed: paid >= capacity,
    };
  } catch {
    return {
      slotsTotal: 50,
      slotsPaid: 10,
      slotsLeft: 40,
      isEarlyBird: true,
      earlyBirdPrice: 15000000,
      regularPrice: 20000000,
      laptopPrice: 2000000,
    };
  }
}

export default async function Landing() {
  const cfgRaw = await getPublicConfig();
  // Force two-tier pricing (₦150k early-bird / ₦200k regular) until the DB seed catches up.
  const cfg = { ...cfgRaw, slotsLeft: 50, earlyBirdPrice: 15000000, regularPrice: 20000000 };
  const naira = (k: number) => `₦${(k / 100).toLocaleString("en-NG")}`;

  return (
    <>
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
              Welcome to the AI &amp; XR Summer Tech Bootcamp. Nigeria&apos;s only summer programme where kids 10–17 ship a deployed AI app, build a VR world, produce an AI-assisted track and deliver a live startup pitch to a jury. <strong>27 July – 4 September 2026.</strong>
            </p>

            {/* Sign-up banner, full-width lead-in to the AI & XR wordmark below */}
            <div className="relative mb-3 sm:mb-4 flex justify-center lg:justify-end">
              <div className="card-sticker card-sticker--green card-sticker--tilt-r anim-fade-up delay-1 inline-block px-5 sm:px-6 py-2.5 sm:py-3 max-w-full" style={{ borderRadius: 18 }}>
                <div className="font-bubble whitespace-nowrap text-[clamp(14px,2.4vw,22px)] leading-none tracking-tight">SIGN UP YOUR KIDS TODAY FOR…</div>
              </div>
            </div>

            {/* The wordmark, three stacked lines, bubble + outline */}
            <h1 className="flex flex-col items-center lg:items-end leading-[.92] tracking-tight mb-5 sm:mb-7 text-center lg:text-right">
              <span className="font-bubble text-ink anim-fade-up delay-1 text-[clamp(72px,18vw,108px)]">AI &amp; XR</span>
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
                <div className="frosted-glass rounded-2xl px-4 py-3 sm:px-7 sm:py-4 lg:px-5 lg:py-4 rotate-[-2deg] flex flex-col justify-center min-w-[150px] sm:min-w-[210px] lg:flex-1">
                  <div className="font-bubble text-[14px] sm:text-[18px] leading-none mb-1.5 text-ink">AGES 10–17</div>
                  <ul className="text-[10px] sm:text-[11px] text-neutral-800 space-y-0.5 leading-snug whitespace-nowrap">
                    <li className="flex items-start gap-1.5"><span className="text-aqua-deep">•</span> 6 courses</li>
                    <li className="flex items-start gap-1.5"><span className="text-aqua-deep">•</span> Daily Mon – Fri</li>
                    <li className="flex items-start gap-1.5"><span className="text-aqua-deep">•</span> 9 AM – 1:30 PM</li>
                  </ul>
                </div>

                {/* JUL 27 date sticker */}
                <div className="card-sticker card-sticker--cyan-soft card-sticker--tilt-l-lg px-3.5 py-3 sm:px-5 sm:py-4 lg:px-4 lg:py-4 shrink-0 flex flex-col justify-center" style={{ borderRadius: 18 }}>
                  <div className="text-[8.5px] sm:text-[10px] font-bold tracking-[.22em] text-ink/70 uppercase">Boot camp starts</div>
                  <div className="font-bubble text-[18px] sm:text-[24px] leading-none mt-1 text-ink">JUL 27</div>
                  <div className="text-[8.5px] sm:text-[10px] font-bold tracking-[.18em] text-ink/70 uppercase mt-0.5">3 cohorts · 2 wks each</div>
                </div>
              </div>

              {/* Ticket coupon CTA: EARLY BIRD · FIRST 10 · ₦100,000 (was ₦150,000).
                  block + lg:w-full so on desktop it stretches across the full right
                  column, sitting as the widest element of the cascade. */}
              <Link
                href="/register"
                className="group block lg:w-full"
                aria-label={`Reserve a slot. Early bird ${naira(cfg.earlyBirdPrice)}, first 10`}
              >
                <div className="card-ticket flex items-stretch gap-4 sm:gap-5 group-hover:-translate-y-1 transition-transform h-full">
                  <div className="flex-1 pr-2 flex flex-col justify-center">
                    <div className="text-[10px] sm:text-[10.5px] font-bold tracking-[.22em] uppercase text-grass-deep">Early bird · first 10</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bubble text-[24px] sm:text-[28px] leading-none text-ink">{naira(cfg.earlyBirdPrice)}</span>
                      <span className="text-[12px] line-through text-neutral-500">{naira(cfg.regularPrice)}</span>
                    </div>
                    <div className="text-[10.5px] font-bold tracking-[.16em] uppercase text-neutral-500 mt-1">50 slots only</div>
                  </div>
                  <div className="card-ticket__seam" aria-hidden />
                  <div className="flex flex-col items-center justify-center gap-2 pl-2">
                    <span className="card-ticket__barcode" aria-hidden />
                    <span className="text-[9px] font-bold tracking-[.2em] uppercase text-neutral-500">Reserve →</span>
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
            <CourseCard i={0} num="01" slug="vibe-coding"      Icon={CodeIcon}        sticker="cyan"      title={<>VIBE CODING &amp; AI PROMPT ENGINEERING</>}  sub="Pair-program with AI to ship a deployed web app. No prior code needed." />
            <CourseCard i={1} num="02" slug="entrepreneurship" Icon={Rocket01Icon}    sticker="green"     title={<>ENTREPRENEURSHIP &amp; PITCHING</>}          sub="Idea → product → live Demo Day pitch in two weeks."                        tag="★ COMPULSORY" />
            <CourseCard i={2} num="03" slug="content-creation" Icon={CameraVideoIcon} sticker="ink"       title={<>CONTENT CREATION</>}                          sub="Script, shoot and edit short-form videos worth posting." />
            <CourseCard i={3} num="04" slug="robotics"         Icon={RoboticIcon}     sticker="cyan-soft" title={<>ROBOTICS &amp; EMBEDDED SYSTEMS</>}          sub="Blink an LED on day one; build your own gadget and keep the kit by week's end." tag="✦ ELECTIVE · +₦25,000" />
            <CourseCard i={4} num="05" slug="3d-vr"            Icon={VrGlassesIcon}   sticker="ink"       title={<>3D CHARACTER &amp; VR WORLD CREATION</>}    sub="Sculpt characters in Blender. Step inside the world you made." />
            <CourseCard i={5} num="06" slug="ai-music"         Icon={MusicNote01Icon} sticker="green-soft" title={<>AI MUSIC PRODUCTION</>}                     sub="Produce a finished, mixed track with AI-assisted tools." />
          </div>

          {/* SIDE ATTRACTIONS, renamed from Active Breaks. Until the cutout photos
              of paddle/kart/PS5 arrive, we render icon-only sticker cards as a
              graceful fallback. The strip uses horizontal-scroll-snap on mobile so
              one card sits fully visible with the next peeking. */}
          <div className="mt-16">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-baseline sm:text-left flex-wrap gap-3 mb-5">
              <span className="font-bubble text-[28px] sm:text-[36px] leading-none text-ink">SIDE ATTRACTIONS</span>
              <span className="text-[12.5px] text-neutral-600">30 min daily, free choice between morning &amp; afternoon courses</span>
            </div>
            <div className="stagger-group grid grid-cols-1 sm:grid-cols-3 gap-5 -mx-5 sm:mx-0 px-5 sm:px-0 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none flex sm:grid">
              <SideAttraction i={0} slug="table-tennis"     Icon={TableTennisBatIcon} sticker="cyan"  title="TABLE TENNIS" desc="Sharpens reflexes before the afternoon block." />
              <SideAttraction i={1} slug="go-karting"       Icon={RacingFlagIcon}     sticker="green" title="GO KARTING"   desc="Supervised circuits with full safety gear." />
              <SideAttraction i={2} slug="pro-gaming"       Icon={GameController01Icon} sticker="ink"   title="PRO GAMING"          desc="Coached competitive gaming on real rigs." />
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
              Two 2-hour deep-work blocks back-to-back, then a 30-minute break activity students choose with tokens.
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
                <Cell i={2} tone="ink"       Icon={CameraVideoIcon} title="Content Creation"   sub="External" />
                <Cell i={3} tone="green"     Icon={Rocket01Icon}    title="Entrepreneurship ★" sub="" />
                <Cell i={4} tone="orange"    Icon={RoboticIcon}     title="Robotics / Music"   sub="Paired elective" />

                <TimeLabel main="11:00 – 13:00" hint="2 hrs" />
                <Cell i={5}  tone="green"    Icon={Rocket01Icon}    title="Entrepreneurship ★" sub="" />
                <Cell i={6}  tone="orange"   Icon={RoboticIcon}     title="Robotics / Music"   sub="Paired elective" />
                <Cell i={7}  tone="cyan"     Icon={CodeIcon}        title="Vibe Coding & AI"   sub="" />
                <Cell i={8}  tone="pink"     Icon={VrGlassesIcon}   title="3D & VR World"      sub="" />
                <Cell i={9}  tone="ink"      Icon={CameraVideoIcon} title="Content Creation"   sub="External" />

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
              { time: "9:00 – 11:00",   title: "Content Creation",          sub: "",                  tone: "ink"   },
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
              { time: "11:00 – 13:00",  title: "Content Creation",          sub: "",                  tone: "ink"   },
              { time: "13:00 – 13:30",  title: "Break Activity",            sub: "Table Tennis · Go Karting · Pro Gaming", tone: "gray", isBreak: true },
            ]} />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            <LegendItem tone="cyan"   label="Vibe Coding & AI Prompt Engineering" />
            <LegendItem tone="green"  label="Entrepreneurship ★ COMPULSORY" />
            <LegendItem tone="ink"    label="Content Creation" />
            <LegendItem tone="orange" label="Robotics / Singing & AI Music · Paired Elective" />
            <LegendItem tone="pink"   label="3D Character & VR World" />
            <LegendItem tone="gray"   label="Break Activity · Table Tennis · Go Karting · Pro Gaming · token-based" />
          </div>
          <p className="mt-6 text-[12px] text-neutral-500 leading-relaxed max-w-[820px]">
            ① All 5 classes run 2 sessions × 2 hrs = 4 hrs / week = 8 hrs per cohort. ② Entrepreneurship is COMPULSORY for every camper (Mon late-morning + Thu early-morning). ③ Robotics & Embedded and Singing & AI Music are a paired elective. Pick one track. ④ All three break activities (Table Tennis, Go Karting, Pro Gaming) are available daily 1:00 – 1:30 PM via the in-app token system. ⑤ Tentative and subject to change.
          </p>
        </div>
      </section>

      {/* ============ PITCH DAY ============ */}
      <section className="relative overflow-hidden py-24 sm:py-28">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
          <div className="bg-white border border-black/[.05] rounded-[32px]">
            <div className="stagger-group relative px-6 sm:px-12 pt-16 pb-16 overflow-hidden rounded-[32px] text-center">
              {/* corner sparkles */}
              <span aria-hidden className="absolute top-10 left-10 text-[36px] leading-none text-aqua-brand/50 anim-spin-slow inline-block">✦</span>
              <span aria-hidden className="absolute top-12 right-12 text-[28px] leading-none text-grass-brand/60 anim-pulse inline-block">✦</span>
              <span aria-hidden className="absolute bottom-10 left-[28%] text-[24px] leading-none text-aqua-brand/40 anim-pulse delay-1 inline-block">✦</span>
              <span aria-hidden className="absolute bottom-12 right-[18%] text-[30px] leading-none text-grass-brand/50 anim-pulse delay-2 inline-block">✦</span>

              <span className="stagger-rise inline-block text-[11px] font-bold tracking-[.22em] uppercase text-grass-deep mb-4 relative z-[2]" style={{ "--i": 0 } as React.CSSProperties}>
                Week 4 · 21 August 2026
              </span>

              <h2 className="stagger-rise font-bubble text-[clamp(34px,5vw,68px)] leading-[1.02] mb-6 relative z-[2] text-ink" style={{ "--i": 1 } as React.CSSProperties}>
                BUILD A STARTUP.<br />
                PITCH IT <span className="text-aqua-deep">LIVE</span>.<br />
                WIN.
              </h2>

              <p className="stagger-rise text-[14.5px] text-neutral-700 leading-relaxed max-w-[560px] mx-auto mb-10 relative z-[2]" style={{ "--i": 2 } as React.CSSProperties}>
                Every camper presents the startup idea they&apos;ve been building since week one to a live jury of working founders. Top three teams take home a prize pack and a feature on IMMERSIA&apos;s channels.
              </p>

              <Link href="/register" className="stagger-rise btn-grass inline-flex relative z-[2]" style={{ "--i": 3 } as React.CSSProperties}>
                Reserve your slot <span aria-hidden>→</span>
              </Link>
            </div>
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
              PARENT FAQ · TOP 10
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
              The ten questions parents actually ask us before sending their kid. Tap one to expand.
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
              The 2026 cohorts run <strong>27 July – 4 September</strong> as three back-to-back 2-week sessions. Once we hit 50 paid registrations the camp closes. Next AI &amp; XR isn&apos;t until summer 2027. <strong>First 10 lock in {naira(cfg.earlyBirdPrice)}</strong> early-bird; regular price {naira(cfg.regularPrice)}. Both cover the 5 core courses, daily side attractions, materials and Demo Day. Robotics is an optional +₦25,000 elective. Lunch and drinks are not provided. Campers bring their own.
            </p>
            <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
              <Link href="/register" className="btn-grass">
                Reserve a Slot <span aria-hidden>→</span>
              </Link>
              <Link href="/contact" className="btn-light">
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
  orange: "bg-orange-400",
  mint:   "bg-emerald-400",
  pink:   "bg-pink-400",
  gray:   "bg-neutral-400",
};

function CourseCard({
  i, num, slug, Icon, sticker, title, sub, tag,
}: {
  i: number;
  num: string;
  slug: string;
  Icon: IconCmp;
  sticker: "cyan" | "cyan-soft" | "green" | "green-soft" | "ink";
  title: React.ReactNode;
  sub?: string;
  tag?: string;
}) {
  const isDark = sticker === "ink";
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
      <h3 className="font-bubble text-[22px] sm:text-[24px] leading-[1.05] tracking-tight mt-2">{title}</h3>
      {sub && (
        <p className={`text-[12px] sm:text-[12.5px] leading-snug ${isDark ? "text-white/80" : "text-ink/75"}`}>{sub}</p>
      )}
      <span className={`mt-auto self-end text-[20px] font-bold transition-transform group-hover:translate-x-1 ${isDark ? "text-white" : "text-ink"}`} aria-hidden>→</span>
    </Link>
  );
}

function SideAttraction({
  i, slug, Icon, sticker, title, desc,
}: { i: number; slug: string; Icon: IconCmp; sticker: "cyan" | "green" | "ink"; title: string; desc: string }) {
  const isDark = sticker === "ink";
  return (
    <Link
      href={`/courses/${slug}`}
      className={`stagger-rise card-sticker card-sticker--${sticker} group flex flex-col gap-3 min-w-[260px] sm:min-w-0 snap-start`}
      style={{ "--i": i, "--tilt": `${i % 2 === 0 ? -2 : 2}deg` } as React.CSSProperties}
    >
      <Icon size={48} strokeWidth={1.8} className={isDark ? "text-white" : "text-ink"} />
      <h3 className="font-bubble text-[22px] leading-tight tracking-tight mt-2">{title}</h3>
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
    pink:   "bg-pink-soft/60 border-pink-deep/40 text-ink",
    orange: "bg-orange-100 border-orange-300/60 text-ink",
    mint:   "bg-mint-soft/60 border-mint-deep/40 text-ink",
  };
  const iconColor: Record<string, string> = {
    cyan: "text-aqua-deep", green: "text-grass-deep", ink: "text-white",
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
    pink: "bg-pink-deep",
    orange: "bg-orange-400",
    gray: "bg-neutral-300",
  };
  return (
    <div
      className="stagger-rise bg-white border border-black/[.06] rounded-3xl p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
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
