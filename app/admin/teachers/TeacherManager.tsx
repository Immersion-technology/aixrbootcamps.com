"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TeacherPortrait from "@/components/TeacherPortrait";

interface TeacherRow {
  id: string;
  name: string;
  email: string;
  bio: string;
  photoUrl: string;
  assignedCourses: string[];
  isActive: boolean;
  lastLoginAt: string | null;
}

interface ClassOption {
  slug: string;
  name: string;
}

export default function TeacherManager({
  initial,
  classOptions,
}: {
  initial: TeacherRow[];
  classOptions: ClassOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function toggleCourse(slug: string) {
    setCourses((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]));
  }

  async function addTeacher(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bio, photoUrl, assignedCourses: courses }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed");
      setNotice(`Added ${name}. A login link was emailed to ${email}.`);
      setName("");
      setEmail("");
      setBio("");
      setPhotoUrl("");
      setCourses([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(teacher: TeacherRow) {
    setBusy(true);
    try {
      await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teacher.id, isActive: !teacher.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const classNames = new Map(classOptions.map((option) => [option.slug, option.name]));

  return (
    <div className="space-y-8">
      <form onSubmit={addTeacher} className="frosted-glass rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-violet-brand">Add a facilitator</div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input min-h-[110px] resize-y"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short public profile copy for the teachers page."
            />
          </div>
          <div>
            <label className="label">Profile picture URL</label>
            <input
              className="input"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="/teachers/tunde.jpg or https://..."
            />
            <p className="mt-2 text-[11.5px] text-neutral-500">
              Leave blank to use the generated portrait fallback.
            </p>
          </div>
        </div>

        <div>
          <label className="label">Assigned classes (optional)</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {classOptions.map((option) => {
              const active = courses.includes(option.slug);
              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => toggleCourse(option.slug)}
                  className={`text-[11.5px] font-semibold rounded-full px-3 py-1.5 border transition ${
                    active
                      ? "bg-violet-brand text-white border-violet-brand"
                      : "bg-white text-neutral-700 border-black/10 hover:border-violet-brand"
                  }`}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="field-error">⚠ {error}</p>}
        {notice && <p className="text-[12.5px] text-emerald-700 font-medium">✓ {notice}</p>}

        <button type="submit" className="btn-dark" disabled={busy}>
          {busy ? "Adding..." : <>Add & email login link <span aria-hidden>{"->"}</span></>}
        </button>
      </form>

      <div className="bg-white border border-black/[.06] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-neutral-50 text-[10.5px] font-bold tracking-[.18em] uppercase text-neutral-500">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3 hidden sm:table-cell">Classes</th>
              <th className="text-left p-3 hidden md:table-cell">Last login</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3" />
            </tr>
          </thead>
          <tbody>
            {initial.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500 text-[13px]">
                  No facilitators yet.
                </td>
              </tr>
            ) : (
              initial.map((teacher) => (
                <tr key={teacher.id} className="border-t border-black/[.05]">
                  <td className="p-3">
                    <div className="flex items-start gap-3">
                      <TeacherPortrait
                        name={teacher.name}
                        photoUrl={teacher.photoUrl}
                        className="h-14 w-14 shrink-0 rounded-2xl"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold">{teacher.name}</div>
                        <div className="text-[11.5px] text-neutral-500">{teacher.email}</div>
                        <div className="text-[11.5px] text-neutral-600 mt-1">
                          {teacher.bio ? excerptText(teacher.bio, 88) : teacherHeadline(teacher, classNames)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-[12px] text-neutral-600">
                    {teacher.assignedCourses.length === 0
                      ? "—"
                      : teacher.assignedCourses.map((slug) => classNames.get(slug) ?? slug).join(", ")}
                  </td>
                  <td className="p-3 hidden md:table-cell text-[12px] text-neutral-500">
                    {teacher.lastLoginAt ? new Date(teacher.lastLoginAt).toLocaleDateString("en-NG") : "Never"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-[.14em] uppercase ${
                        teacher.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {teacher.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleActive(teacher)}
                      disabled={busy}
                      className="text-[11.5px] font-semibold text-neutral-500 hover:text-violet-brand transition disabled:opacity-50"
                    >
                      {teacher.isActive ? "Disable" : "Re-enable"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function teacherHeadline(teacher: TeacherRow, classNames: Map<string, string>) {
  const courses = teacher.assignedCourses.map((slug) => classNames.get(slug) ?? slug);
  if (courses.length === 0) return "Supports the full camp";
  if (courses.length === 1) return `Leads ${courses[0]}`;
  if (courses.length === 2) return `Leads ${courses[0]} and ${courses[1]}`;
  return `Leads ${courses[0]}, ${courses[1]} and ${courses.length - 2} more`;
}

function excerptText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${shortened.trimEnd()}...`;
}
