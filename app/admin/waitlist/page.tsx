import { connectDB } from "@/lib/db";
import { Waitlist } from "@/models/Waitlist";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  await connectDB();
  const rows = await Waitlist.find({}).sort({ createdAt: -1 }).lean();

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
            {rows.length} on the list
          </span>
          <a href="/api/admin/export/waitlist" className="btn-dark !text-[12px] !px-5 !py-2">
            Export CSV <span>→</span>
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/[.06] overflow-hidden">
        {rows.length === 0 && (
          <p className="p-8 text-[13px] text-neutral-500 text-center">
            No waitlist entries yet. People only land here once the cohort is full.
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
