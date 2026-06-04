import { redirect } from "next/navigation";
import { getTeacherFromCookie } from "@/lib/teacher-auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Attendance } from "@/models/Attendance";
import { AttractionChoice, type Attraction } from "@/models/AttractionChoice";
import TeacherRosterRow from "./TeacherRosterRow";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function TeacherDashboard({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  // Re-verify the session in the page itself (middleware is optimistic only).
  const teacher = await getTeacherFromCookie();
  if (!teacher) redirect("/teacher/login");

  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "") ? searchParams.date! : todayISO();
  const dayUTC = new Date(`${date}T00:00:00.000Z`);

  await connectDB();
  // Roster = paid + admitted campers (every camper attends every class).
  const regs = await Registration.find({ paymentStatus: "paid", admissionStatus: "admitted" })
    .select("registrationId participant.fullName medicalNotes")
    .sort({ "participant.fullName": 1 })
    .lean();

  const regIds = regs.map((r) => r._id);
  const rows = await Attendance.find({
    date: dayUTC,
    registrationId: { $in: regIds },
  }).lean();
  const byReg = new Map<string, (typeof rows)[number]>();
  for (const a of rows) byReg.set(String(a.registrationId), a);

  const totals = rows.reduce(
    (acc, a) => ((acc[a.status] = (acc[a.status] ?? 0) + 1), acc),
    {} as Record<string, number>
  );

  // Side-attraction token picks for the same day (one row per camper per day).
  const choices = await AttractionChoice.find({
    date: dayUTC,
    registrationId: { $in: regIds },
  }).lean();
  const attractionByReg = new Map<string, Attraction>();
  for (const c of choices) attractionByReg.set(String(c.registrationId), c.attraction);

  const attractionTotals = choices.reduce(
    (acc, c) => ((acc[c.attraction] = (acc[c.attraction] ?? 0) + 1), acc),
    {} as Record<string, number>
  );

  return (
    <section className="px-5 sm:px-7 py-10">
      <div className="max-w-[1180px] mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-1.5">
              Facilitator · daily attendance
            </div>
            <h1 className="font-bubble text-[clamp(28px,3.4vw,40px)] leading-[1.05] text-ink">
              Roster for{" "}
              {new Date(`${date}T00:00:00`).toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h1>
          </div>

          <form className="flex items-center gap-2" method="GET">
            <label htmlFor="date" className="text-[11.5px] font-bold tracking-[.18em] uppercase text-neutral-500">
              Date
            </label>
            <input id="date" name="date" type="date" defaultValue={date} className="input !py-2 !w-auto" />
            <button type="submit" className="btn-light !py-2 !px-4 !text-[12px]">Load</button>
          </form>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 text-[11px] font-bold tracking-[.18em] uppercase">
          <span className="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1.5">Present {totals.present ?? 0}</span>
          <span className="bg-amber-100 text-amber-800 rounded-full px-3 py-1.5">Late {totals.late ?? 0}</span>
          <span className="bg-rose-100 text-rose-800 rounded-full px-3 py-1.5">Absent {totals.absent ?? 0}</span>
          <span className="bg-neutral-100 text-neutral-700 rounded-full px-3 py-1.5">Excused {totals.excused ?? 0}</span>
          <span className="bg-white border border-black/10 rounded-full px-3 py-1.5">Unrecorded {regs.length - rows.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6 text-[11px] font-bold tracking-[.18em] uppercase">
          <span className="text-neutral-400">Tokens</span>
          <span className="bg-cyan-100 text-cyan-800 rounded-full px-3 py-1.5">Table Tennis {attractionTotals["table-tennis"] ?? 0}</span>
          <span className="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1.5">Go Karting {attractionTotals["go-karting"] ?? 0}</span>
          <span className="bg-violet-100 text-violet-800 rounded-full px-3 py-1.5">Pro Gaming {attractionTotals["pro-gaming"] ?? 0}</span>
          <span className="bg-white border border-black/10 rounded-full px-3 py-1.5">Unpicked {regs.length - choices.length}</span>
        </div>

        {regs.length === 0 ? (
          <div className="bg-white border border-black/[.06] rounded-2xl p-8 text-center">
            <p className="text-[13.5px] text-neutral-700">
              No campers on the roster yet. They appear here once their payment clears.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-black/[.06] rounded-2xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-neutral-50 text-[10.5px] font-bold tracking-[.18em] uppercase text-neutral-500">
                <tr>
                  <th className="text-left p-3">Camper</th>
                  <th className="text-left p-3 hidden md:table-cell">Reg ID</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Side attraction</th>
                  <th className="text-left p-3 hidden lg:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <TeacherRosterRow
                    key={String(r._id)}
                    registrationId={String(r._id)}
                    name={r.participant.fullName}
                    regCode={r.registrationId}
                    date={date}
                    hasMedical={Boolean(r.medicalNotes && r.medicalNotes.trim())}
                    initialStatus={byReg.get(String(r._id))?.status}
                    initialNote={byReg.get(String(r._id))?.note ?? ""}
                    initialAttraction={attractionByReg.get(String(r._id))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
