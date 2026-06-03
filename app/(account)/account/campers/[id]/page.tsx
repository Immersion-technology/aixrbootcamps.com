import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Types } from "mongoose";
import { getParentFromCookie } from "@/lib/account-auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Attendance } from "@/models/Attendance";
import { calcAge } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CamperProfilePage({ params }: { params: { id: string } }) {
  const parent = await getParentFromCookie();
  if (!parent) redirect("/account/login");

  if (!Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const reg = await Registration.findById(params.id).lean();
  if (!reg || reg.parent.email.toLowerCase() !== parent.email.toLowerCase()) notFound();

  const attendance = await Attendance.find({ registrationId: reg._id })
    .sort({ date: -1 })
    .lean();

  const summary = attendance.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const age = calcAge(reg.participant.dateOfBirth);

  return (
    <section className="px-5 sm:px-7 py-12">
      <div className="max-w-[920px] mx-auto">
        <Link href="/account" className="text-[12.5px] font-semibold text-neutral-600 hover:text-ink transition inline-flex items-center gap-1.5 mb-6">
          <span aria-hidden>←</span> Back to dashboard
        </Link>

        {/* HEADER */}
        <div className="frosted-glass rounded-3xl p-6 sm:p-8 mb-6">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-2">
            {reg.registrationId} · {reg.paymentStatus}
          </div>
          <h1 className="font-bubble text-[clamp(32px,4.4vw,52px)] leading-[1.02] tracking-tight text-ink mb-2">
            {reg.participant.fullName}
          </h1>
          <p className="text-[13.5px] text-neutral-700">
            Age {age} · {reg.participant.tshirtSize} t-shirt · {reg.participant.school}
          </p>
        </div>

        {/* INFO GRID */}
        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          <Card title="Camper">
            <Row k="Full name" v={reg.participant.fullName} />
            <Row k="DOB" v={new Date(reg.participant.dateOfBirth).toLocaleDateString("en-NG")} />
            <Row k="Gender" v={reg.participant.gender} />
            <Row k="School" v={reg.participant.school} />
            {reg.participant.classGrade && <Row k="Class / grade" v={reg.participant.classGrade} />}
            <Row k="T-shirt size" v={reg.participant.tshirtSize} />
          </Card>

          <Card title="Emergency contact">
            <Row k="Name" v={reg.emergencyContact.fullName} />
            <Row k="Phone" v={reg.emergencyContact.phone} />
            <Row k="Relationship" v={reg.emergencyContact.relationship} />
            {reg.medicalNotes && (
              <div className="mt-3 pt-3 border-t border-black/[.06]">
                <div className="text-[10.5px] font-bold tracking-[.18em] uppercase text-neutral-500 mb-1">Medical notes</div>
                <p className="text-[12.5px] text-neutral-800 leading-snug">{reg.medicalNotes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* ATTENDANCE SUMMARY */}
        <Card title="Attendance">
          <div className="flex flex-wrap gap-2.5 mb-5">
            <Pill tone="grass" label="PRESENT" value={summary.present ?? 0} />
            <Pill tone="amber" label="LATE" value={summary.late ?? 0} />
            <Pill tone="rose" label="ABSENT" value={summary.absent ?? 0} />
            <Pill tone="neutral" label="EXCUSED" value={summary.excused ?? 0} />
          </div>

          {attendance.length === 0 ? (
            <p className="text-[13px] text-neutral-600 italic">
              No attendance recorded yet. Records start appearing once camp begins (27 July).
            </p>
          ) : (
            <ul className="divide-y divide-black/[.06]">
              {attendance.map((a) => (
                <li key={String(a._id)} className="py-2.5 flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[12.5px] text-neutral-700">
                    {new Date(a.date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="flex-1 min-w-0 text-[12.5px] text-neutral-700 truncate">
                    {a.note ?? <span className="opacity-50">–</span>}
                  </span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-black/[.05] rounded-3xl p-5 sm:p-6">
      <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-neutral-500 mb-3">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-neutral-500">{k}</span>
      <span className="font-semibold text-ink text-right">{v}</span>
    </div>
  );
}

function Pill({ tone, label, value }: { tone: "grass" | "amber" | "rose" | "neutral"; label: string; value: number }) {
  const cls = {
    grass: "bg-emerald-50 border-emerald-200 text-emerald-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    rose: "bg-rose-50 border-rose-200 text-rose-900",
    neutral: "bg-neutral-100 border-neutral-200 text-neutral-700",
  }[tone];
  return (
    <div className={`rounded-2xl border px-4 py-2.5 ${cls}`}>
      <div className="text-[9.5px] font-bold tracking-[.22em]">{label}</div>
      <div className="font-bubble text-[22px] leading-none mt-0.5">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    present: "bg-emerald-100 text-emerald-800",
    late: "bg-amber-100 text-amber-800",
    absent: "bg-rose-100 text-rose-800",
    excused: "bg-neutral-100 text-neutral-700",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-[.16em] uppercase ${map[status] ?? "bg-neutral-100 text-neutral-700"}`}>
      {status}
    </span>
  );
}
