import Link from "next/link";
import { redirect } from "next/navigation";
import { getParentFromCookie } from "@/lib/account-auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Attendance } from "@/models/Attendance";
import { calcAge } from "@/lib/utils";
import FeedbackPanel from "./FeedbackPanel";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const parent = await getParentFromCookie();
  if (!parent) redirect("/account/login");

  await connectDB();
  const regs = await Registration.find({
    "parent.email": parent.email,
  })
    .sort({ createdAt: 1 })
    .lean();

  // Pull attendance counts in one pass for the dashboard summary.
  const attendanceCounts = await Attendance.aggregate([
    { $match: { registrationId: { $in: regs.map((r) => r._id) } } },
    { $group: { _id: { reg: "$registrationId", status: "$status" }, n: { $sum: 1 } } },
  ]);
  const countsByReg = new Map<string, { present: number; absent: number; late: number; excused: number }>();
  for (const r of regs) {
    countsByReg.set(String(r._id), { present: 0, absent: 0, late: 0, excused: 0 });
  }
  for (const a of attendanceCounts) {
    const bucket = countsByReg.get(String(a._id.reg));
    if (!bucket) continue;
    const status = a._id.status as "present" | "absent" | "late" | "excused";
    bucket[status] = a.n;
  }

  return (
    <section className="px-5 sm:px-7 py-12">
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-10">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-2">
            Parent dashboard
          </div>
          <h1 className="font-bubble text-[clamp(32px,4.4vw,52px)] leading-[1.02] tracking-tight text-ink">
            Welcome, {parent.name.split(" ")[0]}.
          </h1>
          <p className="text-[14px] text-neutral-700 leading-relaxed mt-3 max-w-[560px]">
            Tap a camper to see their daily attendance and what they&apos;re building.
          </p>
        </div>

        {regs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {regs.map((r) => {
              const counts = countsByReg.get(String(r._id))!;
              const age = calcAge(r.participant.dateOfBirth);
              return (
                <Link
                  key={String(r._id)}
                  href={`/account/campers/${String(r._id)}`}
                  className="group block frosted-glass rounded-3xl p-5 transition hover:-translate-y-1"
                >
                  <div className="text-[10px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-1.5">
                    {r.registrationId}
                  </div>
                  <h2 className="font-bubble text-[24px] leading-tight tracking-tight text-ink mb-2">
                    {r.participant.fullName}
                  </h2>
                  <ul className="text-[12.5px] text-neutral-700 space-y-1 mb-4">
                    <li>Age {age} · {r.participant.tshirtSize} tee</li>
                    <li>{r.participant.school}</li>
                    <li className="capitalize">
                      Payment: <strong>{r.paymentStatus}</strong>
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-2 text-[10.5px] font-bold tracking-[.16em] uppercase">
                    <Badge tone="grass">Present {counts.present}</Badge>
                    <Badge tone="amber">Late {counts.late}</Badge>
                    <Badge tone="rose">Absent {counts.absent}</Badge>
                  </div>
                  <div className="mt-4 text-[12.5px] font-semibold text-aqua-deep group-hover:translate-x-1 transition">
                    See full profile →
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <FeedbackPanel />
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="frosted-glass rounded-3xl p-8 text-center">
      <h2 className="font-bubble text-[22px] text-ink mb-2">No campers yet</h2>
      <p className="text-[13.5px] text-neutral-700 leading-relaxed max-w-[420px] mx-auto mb-5">
        We can&apos;t find any registrations under your email. If you registered already, give the payment a minute to clear, then refresh.
      </p>
      <Link href="/register" className="btn-grass">Register a camper <span aria-hidden>→</span></Link>
    </div>
  );
}

function Badge({ tone, children }: { tone: "grass" | "amber" | "rose"; children: React.ReactNode }) {
  const cls = {
    grass: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    rose: "bg-rose-100 text-rose-800",
  }[tone];
  return <span className={`rounded-full px-2.5 py-1 ${cls}`}>{children}</span>;
}
