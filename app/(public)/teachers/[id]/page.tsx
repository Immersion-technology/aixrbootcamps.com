import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Teacher } from "@/models/Teacher";
import TeacherPortrait from "@/components/TeacherPortrait";
import { teacherBio, teacherCourseNames, teacherHeadline, excerpt } from "@/lib/teacher-display";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  await connectDB();
  const teacher = await Teacher.findById(params.id).lean();
  if (!teacher) {
    return {
      title: "Teacher profile",
      description: "Teacher profile not found.",
    };
  }

  const bio = teacherBio(teacher);
  return {
    title: teacher.name,
    description: excerpt(bio, 155),
    alternates: { canonical: `/teachers/${params.id}` },
  };
}

export default async function TeacherProfilePage({
  params,
}: {
  params: { id: string };
}) {
  if (!/^[a-f\d]{24}$/i.test(params.id)) notFound();

  await connectDB();
  const teacher = await Teacher.findById(params.id).lean();
  if (!teacher) notFound();

  const courses = teacherCourseNames(teacher.assignedCourses ?? []);
  const bio = teacherBio(teacher);
  const headline = teacherHeadline(teacher);

  return (
    <section className="relative overflow-hidden">
      <div className="relative max-w-[1180px] mx-auto px-5 sm:px-7 py-10 sm:py-14">
        <Link href="/teachers" className="inline-block text-[12.5px] text-neutral-500 hover:text-ink transition mb-7 anim-fade-up">
          {"<-"} Back to teachers
        </Link>

        <div className="grid lg:grid-cols-[1fr_.92fr] gap-8 lg:gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] mb-5 anim-fade-up uppercase">
              <span className={`w-1.5 h-1.5 rounded-full ${teacher.isActive ? "bg-emerald-500" : "bg-neutral-400"} inline-block`} />
              Facilitator profile
            </div>

            <h1 className="font-bubble text-[clamp(38px,6vw,84px)] leading-[.95] tracking-tight mb-4 anim-fade-up delay-1 text-ink">
              {teacher.name}
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-neutral-700 max-w-[720px] anim-fade-up delay-2">
              {headline}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[.18em] uppercase ${teacher.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-600"}`}>
                {teacher.isActive ? "Active this season" : "Not active right now"}
              </span>
              <span className="rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[.18em] uppercase bg-white border border-black/10 text-ink">
                {courses.length} assigned {courses.length === 1 ? "class" : "classes"}
              </span>
              {teacher.lastLoginAt ? (
                <span className="rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[.18em] uppercase bg-white border border-black/10 text-ink">
                  Last login {new Date(teacher.lastLoginAt).toLocaleDateString("en-NG")}
                </span>
              ) : null}
            </div>

            <div className="mt-8 frosted-glass rounded-[28px] p-6 sm:p-7">
              <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-neutral-500 mb-4">
                About
              </div>
              <p className="text-[14.5px] sm:text-[15px] leading-relaxed text-neutral-700">
                {bio}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <TeacherPortrait
              name={teacher.name}
              photoUrl={teacher.photoUrl}
              className="h-[420px] sm:h-[520px] rounded-[34px] shadow-[0_24px_60px_-30px_rgba(15,15,15,.35)]"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard label="Assigned classes" value={courses.length ? courses.join(" / ") : "Full camp support"} />
              <InfoCard label="Teaching style" value="Hands-on, project-first, supportive." />
            </div>

            {teacher.link ? (
              <a
                href={teacher.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 frosted-glass rounded-[24px] px-5 py-4 transition hover:-translate-y-0.5"
              >
                <span>
                  <span className="block text-[10px] font-bold tracking-[.22em] uppercase text-neutral-500 mb-1">
                    Portfolio / profile
                  </span>
                  <span className="text-[13.5px] font-semibold text-ink break-all">
                    {teacher.link.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                <span aria-hidden className="text-[18px] font-bold text-ink">
                  {"->"}
                </span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 grid lg:grid-cols-[1fr_.85fr] gap-5 sm:gap-6">
          <div className="frosted-glass rounded-[28px] p-6 sm:p-7">
            <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-neutral-500 mb-4">
              Classes taught
            </div>
            <div className="flex flex-wrap gap-2">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <span key={course} className="rounded-full bg-neutral-100 text-ink px-3 py-1.5 text-[11px] font-semibold">
                    {course}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1.5 text-[11px] font-semibold">
                  Supports the whole camp
                </span>
              )}
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-neutral-600 max-w-[680px]">
              Course names come from the shared curriculum source, so this profile always stays in sync with the rest of the site.
            </p>
          </div>

          <div className="card-sticker card-sticker--ink card-sticker--no-tilt p-6 sm:p-7">
            <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-white/70 mb-3">
              Need to reach us?
            </div>
            <h2 className="font-bubble text-[24px] sm:text-[30px] leading-[1.02] text-white mb-4">
              Ask about this facilitator or the camp team.
            </h2>
            <p className="text-[14px] leading-relaxed text-white/75">
              We can answer questions about the teacher roster, class structure, schedules and how campers are grouped during the bootcamp.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-grass">
                Contact us <span aria-hidden>{"->"}</span>
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full px-6 py-3 min-h-[48px] border border-white/15 text-[13.5px] font-semibold text-white/90 hover:bg-white/5 transition">
                Reserve a slot
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <Link href="/teachers" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-neutral-600 hover:text-ink underline underline-offset-4 decoration-2 transition">
            View all teachers {"->"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="frosted-glass rounded-[24px] p-5">
      <div className="text-[10px] font-bold tracking-[.22em] uppercase text-neutral-500 mb-2">{label}</div>
      <div className="text-[13.5px] leading-relaxed text-ink font-semibold">{value}</div>
    </div>
  );
}
