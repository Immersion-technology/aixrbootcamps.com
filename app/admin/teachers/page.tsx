import { connectDB } from "@/lib/db";
import { Teacher } from "@/models/Teacher";
import { getClasses } from "@/lib/curriculum";
import TeacherManager from "./TeacherManager";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  await connectDB();
  const teachers = await Teacher.find().sort({ createdAt: -1 }).lean();
  const classOptions = getClasses().map((c) => ({ slug: c.slug, name: c.name }));

  const initial = teachers.map((t) => ({
    id: String(t._id),
    name: t.name,
    email: t.email,
    bio: t.bio ?? "",
    photoUrl: t.photoUrl ?? "",
    assignedCourses: t.assignedCourses ?? [],
    isActive: t.isActive,
    lastLoginAt: t.lastLoginAt ? new Date(t.lastLoginAt).toISOString() : null,
  }));

  return (
    <section className="px-5 sm:px-7 py-10">
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-8">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">
            Admin · facilitators
          </div>
          <h1 className="font-bubble text-[clamp(28px,3.4vw,40px)] leading-[1.05] text-ink">Teachers</h1>
          <p className="text-[13.5px] text-neutral-600 mt-2 max-w-[560px]">
            Add a facilitator and we&apos;ll email them a one-time login link. They can mark attendance and view camper safety info, nothing else.
          </p>
        </div>

        <TeacherManager initial={initial} classOptions={classOptions} />
      </div>
    </section>
  );
}
