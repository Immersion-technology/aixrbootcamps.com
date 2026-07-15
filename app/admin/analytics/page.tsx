import { connectDB } from "@/lib/db";
import { PageView } from "@/models/PageView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics · Traffic",
};

interface DayBucket {
  date: string;
  count: number;
  visitors: number;
}

interface TopPage {
  path: string;
  count: number;
}

interface BreakdownRow {
  label: string;
  count: number;
}

interface RecentVisitor {
  visitorId: string;
  ip: string;
  country: string;
  city: string;
  device: string;
  os: string;
  browser: string;
  utmSource: string;
  entryPath: string;
  pageCount: number;
  firstSeen: Date;
  lastSeen: Date;
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

    const [
      totalAll,
      total7d,
      totalToday,
      uniqueAll,
      unique7d,
      uniqueToday,
      topPages,
      dailyBuckets,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      utmBreakdown,
      recentVisitorsAgg,
    ] = await Promise.all([
      PageView.countDocuments(),
      PageView.countDocuments({ ts: { $gte: startOf7d } }),
      PageView.countDocuments({ ts: { $gte: startOfToday } }),

      PageView.distinct("visitorId", { visitorId: { $nin: [null, ""] } }).then((v) => v.length),
      PageView.distinct("visitorId", { visitorId: { $nin: [null, ""] }, ts: { $gte: startOf7d } }).then((v) => v.length),
      PageView.distinct("visitorId", { visitorId: { $nin: [null, ""] }, ts: { $gte: startOfToday } }).then((v) => v.length),

      PageView.aggregate<TopPage>([
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, path: "$_id", count: 1 } },
      ]),

      PageView.aggregate([
        { $match: { ts: { $gte: startOf14d } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$ts" } },
            count: { $sum: 1 },
            visitors: {
              $addToSet: { $cond: [{ $in: ["$visitorId", [null, ""]] }, "$$REMOVE", "$visitorId"] },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1, visitors: { $size: "$visitors" } } },
      ]),

      PageView.aggregate<BreakdownRow>([
        { $match: { ts: { $gte: startOf7d }, device: { $ne: "" } } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      PageView.aggregate<BreakdownRow>([
        { $match: { ts: { $gte: startOf7d }, browser: { $ne: "" } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      PageView.aggregate<BreakdownRow>([
        { $match: { ts: { $gte: startOf7d }, country: { $ne: "" } } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      PageView.aggregate<BreakdownRow>([
        { $match: { ts: { $gte: startOf7d }, utmSource: { $ne: "" } } },
        { $group: { _id: "$utmSource", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      // One row per visitor: first/last seen, entry page, page count, latest known device/geo/ip.
      // Legacy rows recorded before visitor tracking shipped have no visitorId — exclude them
      // so they don't collapse into one phantom "visitor" with hundreds of page views.
      PageView.aggregate([
        { $match: { visitorId: { $nin: [null, ""] } } },
        { $sort: { ts: 1 } },
        {
          $group: {
            _id: "$visitorId",
            entryPath: { $first: "$path" },
            firstSeen: { $first: "$ts" },
            lastSeen: { $last: "$ts" },
            pageCount: { $sum: 1 },
            ip: { $last: "$ip" },
            country: { $last: "$country" },
            city: { $last: "$city" },
            device: { $last: "$device" },
            os: { $last: "$os" },
            browser: { $last: "$browser" },
            utmSource: { $first: "$utmSource" },
          },
        },
        { $sort: { lastSeen: -1 } },
        { $limit: 25 },
        {
          $project: {
            _id: 0,
            visitorId: "$_id",
            ip: 1,
            country: 1,
            city: 1,
            device: 1,
            os: 1,
            browser: 1,
            utmSource: 1,
            entryPath: 1,
            pageCount: 1,
            firstSeen: 1,
            lastSeen: 1,
          },
        },
      ]),
    ]);

    const filledDays: DayBucket[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const existing = (dailyBuckets as DayBucket[]).find((b) => b.date === dateStr);
      filledDays.push({ date: dateStr, count: existing?.count ?? 0, visitors: existing?.visitors ?? 0 });
    }

    return {
      totalAll,
      total7d,
      totalToday,
      uniqueAll,
      unique7d,
      uniqueToday,
      topPages,
      filledDays,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      utmBreakdown,
      recentVisitors: recentVisitorsAgg as RecentVisitor[],
    };
  } catch {
    return {
      totalAll: 0,
      total7d: 0,
      totalToday: 0,
      uniqueAll: 0,
      unique7d: 0,
      uniqueToday: 0,
      topPages: [] as TopPage[],
      filledDays: [] as DayBucket[],
      deviceBreakdown: [] as BreakdownRow[],
      browserBreakdown: [] as BreakdownRow[],
      countryBreakdown: [] as BreakdownRow[],
      utmBreakdown: [] as BreakdownRow[],
      recentVisitors: [] as RecentVisitor[],
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

function relativeTime(d: Date) {
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function maskIp(ip: string) {
  if (!ip) return "—";
  // IPv4: mask last octet. IPv6: mask trailing groups. Keeps enough to spot abuse patterns
  // without storing/displaying a fully identifying address in the UI.
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}::xxxx`;
  }
  return ip;
}

export default async function AnalyticsPage() {
  const {
    totalAll, total7d, totalToday,
    uniqueAll, unique7d, uniqueToday,
    topPages, filledDays,
    deviceBreakdown, browserBreakdown, countryBreakdown, utmBreakdown,
    recentVisitors,
  } = await getAnalytics();

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
        <p className="text-[12.5px] text-neutral-500 mt-1.5">
          Visitors are identified by an anonymous device cookie, not by personal identity. IP addresses shown are masked.
        </p>
      </div>

      {/* stat tiles: page views */}
      <div className="grid grid-cols-3 gap-4 mb-4">
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

      {/* stat tiles: unique visitors */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-black/[.06] rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-neutral-500 uppercase mb-2">All time</div>
          <div className="font-accent font-extrabold text-[24px] leading-none text-ink">{fmt(uniqueAll)}</div>
          <div className="text-[11.5px] text-neutral-500 mt-1">unique visitors</div>
        </div>
        <div className="bg-white border border-black/[.06] rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-neutral-500 uppercase mb-2">Last 7 days</div>
          <div className="font-accent font-extrabold text-[24px] leading-none text-ink">{fmt(unique7d)}</div>
          <div className="text-[11.5px] text-neutral-500 mt-1">unique visitors</div>
        </div>
        <div className="bg-white border border-black/[.06] rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-neutral-500 uppercase mb-2">Today</div>
          <div className="font-accent font-extrabold text-[24px] leading-none text-ink">{fmt(uniqueToday)}</div>
          <div className="text-[11.5px] text-neutral-500 mt-1">unique visitors</div>
        </div>
      </div>

      {/* 14-day trend */}
      <div className="bg-white border border-black/[.06] rounded-2xl p-6 mb-6">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-neutral-500 uppercase mb-5">
          14-day trend &middot; views vs unique visitors
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {filledDays.map((d) => {
            const pct = Math.round((d.count / maxDay) * 100);
            const visitorPct = Math.round((d.visitors / maxDay) * 100);
            const isToday = d.date === new Date().toISOString().slice(0, 10);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-ink text-white text-[10px] font-bold rounded-lg px-2 py-1 whitespace-nowrap z-10">
                  {fmt(d.count)} views &middot; {fmt(d.visitors)} visitors
                </div>
                <div className="relative w-full" style={{ height: "100%" }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md transition-all ${isToday ? "bg-violet-brand" : "bg-violet-brand/40 group-hover:bg-violet-brand/70"}`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-aqua-brand"
                    style={{ height: `${Math.max(visitorPct, 2)}%` }}
                  />
                </div>
                <span className="text-[8.5px] text-neutral-400 whitespace-nowrap hidden sm:block">
                  {shortDate(d.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* breakdown grid: device, browser, country, utm source */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <BreakdownCard title="Device (7d)" rows={deviceBreakdown} />
        <BreakdownCard title="Browser (7d)" rows={browserBreakdown} />
        <BreakdownCard title="Country (7d)" rows={countryBreakdown} emptyLabel="No geo data yet" />
        <BreakdownCard title="Traffic source (7d)" rows={utmBreakdown} emptyLabel="No campaign traffic yet" />
      </div>

      {/* top pages table */}
      <div className="bg-white border border-black/[.06] rounded-2xl overflow-hidden mb-6">
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

      {/* recent visitors table */}
      <div className="bg-white border border-black/[.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[.05]">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-neutral-500 uppercase">
            Recent visitors
          </div>
        </div>
        {recentVisitors.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-neutral-400">
            No visitors recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-cream text-[10.5px] uppercase tracking-[.18em] text-neutral-500">
                <tr>
                  <th className="text-left px-6 py-3 font-bold">Visitor</th>
                  <th className="text-left px-4 py-3 font-bold">Entry page</th>
                  <th className="text-left px-4 py-3 font-bold">Location</th>
                  <th className="text-left px-4 py-3 font-bold">Device</th>
                  <th className="text-left px-4 py-3 font-bold">IP</th>
                  <th className="text-right px-4 py-3 font-bold">Pages</th>
                  <th className="text-right px-6 py-3 font-bold">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {recentVisitors.map((v) => (
                  <tr key={v.visitorId} className="hover:bg-cream/50 transition">
                    <td className="px-6 py-3 font-mono text-[11px] text-neutral-500">
                      {v.visitorId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-ink truncate max-w-[200px]">
                      {v.entryPath}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {[v.device, v.os, v.browser].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-neutral-500">
                      {maskIp(v.ip)}
                    </td>
                    <td className="px-4 py-3 text-right font-accent font-bold text-ink">
                      {fmt(v.pageCount)}
                    </td>
                    <td className="px-6 py-3 text-right text-neutral-500 whitespace-nowrap">
                      {relativeTime(v.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownCard({ title, rows, emptyLabel }: { title: string; rows: BreakdownRow[]; emptyLabel?: string }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <div className="bg-white border border-black/[.06] rounded-2xl p-5">
      <div className="text-[10.5px] font-bold tracking-[.22em] text-neutral-500 uppercase mb-4">
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="text-[12.5px] text-neutral-400 py-3">{emptyLabel ?? "No data yet"}</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <div className="w-20 text-[12px] text-ink font-semibold truncate shrink-0">{r.label}</div>
              <div className="flex-1 h-1.5 rounded-full bg-black/[.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-brand/70"
                  style={{ width: `${Math.round((r.count / total) * 100)}%` }}
                />
              </div>
              <div className="text-[11.5px] text-neutral-500 w-10 text-right shrink-0">{fmt(r.count)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
