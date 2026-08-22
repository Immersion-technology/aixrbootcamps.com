import { connectDB } from "@/lib/db";
import { Waitlist } from "@/models/Waitlist";
import { isValidISODate, startOfDay, endOfDay, todayISO } from "@/lib/date-range";

export const dynamic = "force-dynamic";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  await connectDB();

  // Joined-between, on Lagos day boundaries. Either side may be omitted.
  const from = isValidISODate(searchParams.from) ? searchParams.from : undefined;
  const to = isValidISODate(searchParams.to) ? searchParams.to : undefined;
  const filter: Record<string, unknown> = {};
  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: startOfDay(from) } : {}),
      ...(to ? { $lte: endOfDay(to) } : {}),
    };
  }

  const rows = await Waitlist.find(filter).sort({ createdAt: -1 }).lean();
  const filtered = Boolean(from || to);

  return (
    <div className="p-6 sm:p-10 lg:p-12">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Overflow</div>
          <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
            Waitlist
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="frosted-glass-violet rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] uppercase">
            {rows.length} {filtered ? "in range" : "on the list"}
          </span>
          <a href={`/api/admin/export/waitlist?from=${from ?? ""}&to=${to ?? ""}`} className="btn-dark !text-[12px] !px-5 !py-2">
            Export CSV <span>→</span>
          </a>
        </div>
      </div>

      <form className="frosted-glass rounded-2xl p-4 mb-6">
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="date"
            name="from"
            defaultValue={searchParams.from ?? ""}
            max={todayISO()}
            aria-label="Joined from"
            className="input !text-[13px]"
          />
          <input
            type="date"
            name="to"
            defaultValue={searchParams.to ?? ""}
            max={todayISO()}
            aria-label="Joined up to"
            className="input !text-[13px]"
          />
          <button className="btn-dark justify-center !text-[12px] !py-2.5">Filter</button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-black/[.06] overflow-hidden">
        {rows.length === 0 && (
          <p className="p-8 text-[13px] text-neutral-500 text-center">
            {filtered
              ? "No waitlist entries in this date range."
              : "No waitlist entries yet. People only land here once the cohort is full."}
          </p>
        )}
        {rows.length > 0 && (
          <table className="w-full text-[13px]">
            <thead className="bg-cream text-[10.5px] uppercase tracking-[.18em] text-neutral-600">
              <tr>
                <th className="text-left p-3">Parent</th>
                <th className="text-left p-3">Camper</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((r: any) => (
                <tr key={String(r._id)} className="hover:bg-cream/50 transition">
                  <td className="p-3 font-medium">{r.parentName}</td>
                  <td className="p-3">{r.participantName}</td>
                  <td className="p-3"><a href={`mailto:${r.email}`} className="hover:text-violet-brand transition">{r.email}</a></td>
                  <td className="p-3"><a href={`tel:${r.phone}`} className="hover:text-violet-brand transition">{r.phone}</a></td>
                  <td className="p-3 text-[11.5px] text-neutral-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
