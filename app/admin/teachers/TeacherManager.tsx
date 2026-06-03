"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TeacherRow {
  id: string;
  name: string;
  email: string;
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
  const [courses, setCourses] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function toggleCourse(slug: string) {
    setCourses((c) => (c.includes(slug) ? c.filter((s) => s !== slug) : [...c, slug]));
  }

  async function addTeacher(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, assignedCourses: courses }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setNotice(`Added ${name}. A login link was emailed to ${email}.`);
      setName("");
      setEmail("");
      setCourses([]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(t: TeacherRow) {
    setBusy(true);
    try {
      await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const classNames = new Map(classOptions.map((c) => [c.slug, c.name]));

  return (
    <div className="space-y-8">
      {/* ADD FORM */}
      <form onSubmit={addTeacher} className="frosted-glass rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-violet-brand">Add a facilitator</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="label">Assigned classes (optional)</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {classOptions.map((c) => {
              const on = courses.includes(c.slug);
              return (
                <button
                  type="button"
                  key={c.slug}
                  onClick={() => toggleCourse(c.slug)}
                  className={`text-[11.5px] font-semibold rounded-full px-3 py-1.5 border transition ${
                    on ? "bg-violet-brand text-white border-violet-brand" : "bg-white text-neutral-700 border-black/10 hover:border-violet-brand"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="field-error">⚠ {error}</p>}
        {notice && <p className="text-[12.5px] text-emerald-700 font-medium">✓ {notice}</p>}

        <button type="submit" className="btn-dark" disabled={busy}>
          {busy ? "Adding…" : <>Add & email login link <span aria-hidden>→</span></>}
        </button>
      </form>

      {/* LIST */}
      <div className="bg-white border border-black/[.06] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-neutral-50 text-[10.5px] font-bold tracking-[.18em] uppercase text-neutral-500">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3 hidden sm:table-cell">Classes</th>
              <th className="text-left p-3 hidden md:table-cell">Last login</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {initial.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-neutral-500 text-[13px]">No facilitators yet.</td></tr>
            ) : (
              initial.map((t) => (
                <tr key={t.id} className="border-t border-black/[.05]">
                  <td className="p-3">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-[11.5px] text-neutral-500">{t.email}</div>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-[12px] text-neutral-600">
                    {t.assignedCourses.length === 0
                      ? "—"
                      : t.assignedCourses.map((s) => classNames.get(s) ?? s).join(", ")}
                  </td>
                  <td className="p-3 hidden md:table-cell text-[12px] text-neutral-500">
                    {t.lastLoginAt ? new Date(t.lastLoginAt).toLocaleDateString("en-NG") : "Never"}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-[.14em] uppercase ${t.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"}`}>
                      {t.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleActive(t)}
                      disabled={busy}
                      className="text-[11.5px] font-semibold text-neutral-500 hover:text-violet-brand transition disabled:opacity-50"
                    >
                      {t.isActive ? "Disable" : "Re-enable"}
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
