import { connectDB } from "@/lib/db";
import { PageView } from "@/models/PageView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics · Traffic",
};

interface DayBucket {
  date: string;
  count: number;
}

interface TopPage {
  path: string;
  count: number;
}

async function getAnalytics() {
  try {
    await connectDB();

    const now = new Date();
    const startOf7d = new Date(now);
    startOf7d.setDate(startOf7d.getDate() - 7);
    startOf7d.setHours(0, 0, 0, 0);

    const startOf14d = new Date(now);
    startOf14d.setDate(startOf14d.getDate() - 13);
    startOf14d.setHours(0, 0, 0, 0);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [totalAll, total7d, totalToday, topPages, dailyBuckets] = await Promise.all([
      PageView.countDocuments(),
      PageView.countDocuments({ ts: { $gte: startOf7d } }),
      PageView.countDocuments({ ts: { $gte: startOfToday } }),

      PageView.aggregate<TopPage>([
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, path: "$_id", count: 1 } },
      ]),

      PageView.aggregate<DayBucket>([
        { $match: { ts: { $gte: startOf14d } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$ts" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
    ]);

    // Fill in missing days with 0 so the chart has a consistent 14-bar shape
    const filledDays: DayBucket[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const existing = dailyBuckets.find((b) => b.date === dateStr);
      filledDays.push({ date: dateStr, count: existing?.count ?? 0 });
    }

    return { totalAll, total7d, totalToday, topPages, filledDays };
  } catch {
    return {
      totalAll: 0,
      total7d: 0,
      totalToday: 0,
      topPages: [] as TopPage[],
      filledDays: [] as DayBucket[],
    };
  }
}

function fmt(n: number) {
  return n.toLocaleString("en-NG");
}

function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(month) - 1]} ${Number(day)}`;
}

export default async function AnalyticsPage() {
  const { totalAll, total7d, totalToday, topPages, filledDays } = await getAnalytics();

  const maxDay = Math.max(...filledDays.map((d) => d.count), 1);
  const totalForShare = topPages.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <div className="p-6 sm:p-10 max-w-[1100px]">
      {/* header */}
      <div className="mb-8">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-2">
          Site traffic
        </div>
        <h1 className="font-display font-extrabold text-[28px] sm:text-[34px] leading-tight text-ink uppercase">
          Analytics
        </h1>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="frosted-glass rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-neutral-500 uppercase mb-2">All time</div>
          <div className="font-accent font-extrabold text-[30px] leading-none text-ink">{fmt(totalAll)}</div>
          <div className="text-[11.5px] text-neutral-500 mt-1">page views</div>
        </div>
        <div className="frosted-glass-violet rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-white/70 uppercase mb-2">Last 7 days</div>
          <div className="font-accent font-extrabold text-[30px] leading-none text-white">{fmt(total7d)}</div>
          <div className="text-[11.5px] text-white/70 mt-1">page views</div>
        </div>
        <div className="frosted-glass-dark rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-white/60 uppercase mb-2">Today</div>
          <div className="font-accent font-extrabold text-[30px] leading-none text-white">{fmt(totalToday)}</div>
          <div className="text-[11.5px] text-white/60 mt-1">page views</div>
        </div>
      </div>

      {/* 14-day trend */}
      <div className="bg-white border border-black/[.06] rounded-2xl p-6 mb-6">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-neutral-500 uppercase mb-5">
          14-day trend
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {filledDays.map((d) => {
            const pct = Math.round((d.count / maxDay) * 100);
            const isToday = d.date === new Date().toISOString().slice(0, 10);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                {/* tooltip */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-ink text-white text-[10px] font-bold rounded-lg px-2 py-1 whitespace-nowrap z-10">
                  {fmt(d.count)} views
                </div>
                <div
                  className={`w-full rounded-t-md transition-all ${isToday ? "bg-violet-brand" : "bg-violet-brand/40 group-hover:bg-violet-brand/70"}`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
                <span className="text-[8.5px] text-neutral-400 whitespace-nowrap hidden sm:block">
                  {shortDate(d.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* top pages table */}
      <div className="bg-white border border-black/[.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[.05]">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-neutral-500 uppercase">
            Top pages
          </div>
        </div>
        {topPages.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-neutral-400">
            No page views recorded yet. Visit the public site to start tracking.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-cream text-[10.5px] uppercase tracking-[.18em] text-neutral-500">
              <tr>
                <th className="text-left px-6 py-3 font-bold">Page</th>
                <th className="text-right px-6 py-3 font-bold">Views</th>
                <th className="text-right px-6 py-3 font-bold">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {topPages.map((p) => (
                <tr key={p.path} className="hover:bg-cream/50 transition">
                  <td className="px-6 py-3 font-mono text-[12px] text-ink truncate max-w-[420px]">
                    {p.path}
                  </td>
                  <td className="px-6 py-3 text-right font-accent font-extrabold text-[15px] text-ink">
                    {fmt(p.count)}
                  </td>
                  <td className="px-6 py-3 text-right text-neutral-500">
                    {Math.round((p.count / totalForShare) * 100)}%
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
