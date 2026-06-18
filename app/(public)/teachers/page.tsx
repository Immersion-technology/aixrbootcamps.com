import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Teacher } from "@/models/Teacher";
import ChromaGrid, { type ChromaItem } from "@/components/ChromaGrid";
import { teacherBio, teacherCourseNames, excerpt } from "@/lib/teacher-display";

/** Brand-aligned border + dark gradient pairs for the chroma cards. */
const CHROMA_TONES = [
  { borderColor: "#3a86ff", gradient: "linear-gradient(165deg,#3a86ff,#0b1020)" },
  { borderColor: "#fb5607", gradient: "linear-gradient(165deg,#fb5607,#190a04)" },
  { borderColor: "#ff006e", gradient: "linear-gradient(165deg,#ff006e,#190410)" },
  { borderColor: "#06b6d4", gradient: "linear-gradient(165deg,#06b6d4,#04161a)" },
  { borderColor: "#8338ec", gradient: "linear-gradient(165deg,#8338ec,#0d0420)" },
  { borderColor: "#ffbe0b", gradient: "linear-gradient(165deg,#ffbe0b,#191404)" },
];

function chromaTone(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return CHROMA_TONES[hash % CHROMA_TONES.length];
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Teachers",
  description: "Meet the facilitators teaching the IMMERSIA summer bootcamp.",
  alternates: { canonical: "/teachers" },
};

export default async function TeachersPage() {
  await connectDB();
  const teachers = await Teacher.find().sort({ isActive: -1, order: 1, name: 1 }).lean();
  const activeCount = teachers.filter((teacher) => teacher.isActive).length;
  const inactiveCount = teachers.length - activeCount;

  const chromaItems: ChromaItem[] = teachers.map((teacher) => {
    const courses = teacherCourseNames(teacher.assignedCourses ?? []);
    const tone = chromaTone(String(teacher._id));
    return {
      image: teacher.photoUrl || null,
      initials: initialsOf(teacher.name),
      title: teacher.name,
      subtitle: excerpt(teacherBio(teacher), 130),
      meta:
        courses.length > 0
          ? `${courses.length} ${courses.length === 1 ? "class" : "classes"}`
          : "Full camp support",
      actionLabel: courses.length > 0 ? "What they teach" : "View profile",
      borderColor: tone.borderColor,
      gradient: tone.gradient,
      url: `/teachers/${String(teacher._id)}`,
    };
  });

  return (
    <section className="relative overflow-hidden">
      <div className="relative max-w-[1180px] mx-auto px-5 sm:px-7 py-10 sm:py-14">
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8 lg:gap-10 items-start">
          <div className="max-w-[760px]">
            <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.22em] mb-5 anim-fade-up uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-brand inline-block" />
              Meet the team
            </div>

            <h1 className="font-bubble leading-[.96] tracking-tight text-[clamp(40px,6vw,78px)] mb-4 anim-fade-up delay-1 text-ink">
              TEACHERS.<br />
              <span className="wordmark wordmark--green">PROFILES.</span>
            </h1>

            <p className="max-w-[620px] text-[15px] sm:text-[16px] leading-relaxed text-neutral-700 anim-fade-up delay-2">
              Every facilitator on the summer team in one place. See who is teaching, read a short bio, and open each person&apos;s full profile page.
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <SummaryCard label="Teachers" value={teachers.length} accent="frosted-glass-aqua" />
              <SummaryCard label="Active" value={activeCount} accent="frosted-glass-violet" />
              <SummaryCard label="Paused" value={inactiveCount} accent="frosted-glass-petrol" />
            </div>
          </div>

          <div className="frosted-glass rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 anim-fade-up delay-2">
            <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-neutral-500 mb-4">
              What this page shows
            </div>
            <div className="space-y-4 text-[13.5px] leading-relaxed text-neutral-700">
              <p>Profiles are ordered with active teachers first, then any paused profiles below.</p>
              <p>Each card uses the live curriculum names, so the teacher roster stays aligned with the course pages.</p>
              <p>If a photo or custom bio is missing, the page falls back to a styled portrait and an automatic bio.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/register" className="btn-grass !py-3 !px-5 !text-[12.5px]">
                Reserve a slot <span aria-hidden>{"->"}</span>
              </Link>
              <Link href="/contact" className="btn-light !py-3 !px-5 !text-[12.5px]">
                Contact us
              </Link>
            </div>
          </div>
        </div>

        {teachers.length === 0 ? (
          <div className="mt-10 frosted-glass rounded-[28px] p-8 sm:p-10 text-center">
            <h2 className="font-bubble text-[28px] sm:text-[34px] leading-tight text-ink mb-3">NO TEACHERS YET</h2>
            <p className="text-[14px] text-neutral-700 max-w-[520px] mx-auto leading-relaxed">
              The facilitator roster has not been added yet. Once the admin team creates teacher profiles, they will appear here automatically.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className="btn-grass">
                Talk to us <span aria-hidden>{"->"}</span>
              </Link>
              <Link href="/admin/teachers" className="btn-light">
                Admin teachers
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-10 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">
                  Facilitator roster
                </div>
                <h2 className="font-bubble text-[clamp(28px,4vw,48px)] leading-[1.02] tracking-tight text-ink">
                  Who&apos;s teaching what
                </h2>
              </div>
              <p className="text-[13px] text-neutral-600 max-w-[330px]">
                Tap any profile to open the full page for that teacher.
              </p>
            </div>

            <div className="mt-6 rounded-[32px] bg-[#FAF7F2] p-2 sm:p-4">
              <ChromaGrid items={chromaItems} radius={340} damping={0.45} fadeOut={0.6} />
            </div>
          </>
        )}

        <div className="mt-10 sm:mt-12 card-sticker card-sticker--ink card-sticker--no-tilt p-6 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-white/70 mb-2">
              Want to meet the team in person?
            </div>
            <h2 className="font-bubble text-[24px] sm:text-[30px] leading-[1.02] text-white max-w-[16ch]">
              Bring your questions to the contact page.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn-grass">
              Talk to a human <span aria-hidden>{"->"}</span>
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full px-6 py-3 min-h-[48px] border border-white/15 text-[13.5px] font-semibold text-white/90 hover:bg-white/5 transition">
              Reserve a slot
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`frosted-glass rounded-3xl p-4 sm:p-5 ${accent}`}>
      <div className="text-[10px] font-bold tracking-[.22em] uppercase text-white/80 mb-2">{label}</div>
      <div className="font-bubble text-[28px] sm:text-[34px] leading-none text-white">{value}</div>
    </div>
  );
}
