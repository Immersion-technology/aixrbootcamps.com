import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { formatNaira } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await connectDB();
  const [total, paid, capacity, revenueAgg, recent] = await Promise.all([
    Registration.countDocuments({}),
    Registration.countDocuments({ paymentStatus: "paid" }),
    getSetting<number>(SETTING_KEYS.CAPACITY, 50),
    Registration.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    Registration.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select("registrationId participant.fullName paymentStatus admissionStatus createdAt")
      .lean(),
  ]);
  const revenueKobo = revenueAgg[0]?.total ?? 0;
  const slotsLeft = Math.max(0, capacity - paid);

  return (
    <div className="p-6 sm:p-10 lg:p-12">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
        <div>
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Live</div>
          <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
            Dashboard
          </h1>
        </div>
        <Link href="/admin/registrations" className="btn-dark !text-[12px] !px-5 !py-2">
          View all registrations <span>→</span>
        </Link>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatCard label="Total registrations" value={total.toString()} tone="light" />
        <StatCard label="Paid / capacity" value={`${paid} / ${capacity}`} tone="light" />
        <StatCard label="Slots remaining" value={slotsLeft.toString()} tone="violet" />
        <StatCard label="Revenue collected" value={formatNaira(revenueKobo)} tone="dark" />
      </div>

      {/* recent activity */}
      <div className="bg-white border border-black/[.06] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-black/5 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.2em] text-violet-brand uppercase">Recent activity</div>
            <h2 className="font-display font-bold text-[16px] mt-0.5">Last 20 registrations</h2>
          </div>
          <Link href="/admin/registrations" className="text-[12px] text-neutral-600 hover:text-violet-brand transition">
            See all →
          </Link>
        </div>
        <ul className="divide-y divide-black/5">
          {recent.length === 0 && (
            <li className="p-6 text-[13px] text-neutral-500 text-center">No registrations yet.</li>
          )}
          {recent.map((r: any) => (
            <li key={r.registrationId} className="p-4 sm:p-5 flex items-center justify-between gap-4 text-[13px] hover:bg-cream/40 transition">
              <div className="min-w-0">
                <Link href={`/admin/registrations/${r.registrationId}`} className="font-semibold hover:text-violet-brand transition truncate block">
                  {r.participant.fullName}
                </Link>
                <span className="text-[11px] text-neutral-500 font-mono">{r.registrationId}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill value={r.paymentStatus} />
                <StatusPill value={r.admissionStatus} />
                <span className="hidden sm:inline text-[11px] text-neutral-500 ml-2">
                  {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "light" | "violet" | "dark" }) {
  const cls =
    tone === "violet"
      ? "frosted-glass-violet"
      : tone === "dark"
      ? "frosted-glass-dark"
      : "frosted-glass";
  const labelClr =
    tone === "light" ? "text-neutral-600" : "text-white/70";
  return (
    <div className={`${cls} rounded-2xl p-5`}>
      <div className={`text-[10.5px] font-bold tracking-[.2em] uppercase ${labelClr}`}>{label}</div>
      <div className="font-accent font-extrabold text-[28px] sm:text-[30px] mt-2 leading-none tracking-tight">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    paid: "bg-mint-soft text-ink",
    pending: "bg-yellow-soft text-ink",
    failed: "bg-pink-soft text-ink",
    abandoned: "bg-neutral-200 text-neutral-700",
    refunded: "bg-neutral-200 text-neutral-700",
    admitted: "bg-mint-soft text-ink",
    rejected: "bg-pink-soft text-ink",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-[.16em] uppercase ${map[value] ?? "bg-neutral-100 text-neutral-700"}`}>
      {value}
    </span>
  );
}
