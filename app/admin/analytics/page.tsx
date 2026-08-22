import { connectDB } from "@/lib/db";
import { PageView } from "@/models/PageView";
import {
  GRAIN_FORMAT,
  LAGOS_OFFSET,
  bucketKeyFor,
  bucketKeys,
  startOfDay,
  grainFor,
  type Grain,
  parseDateRange,
  PRESETS,
  rangeFilter,
  todayISO,
  type DateRange,
} from "@/lib/date-range";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics · Traffic",
};

interface DayBucket {
  /** Bucket key: a date, ISO week or month depending on the range span. */
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

async function getAnalytics(range: DateRange) {
  try {
    await connectDB();

    // Every window below is Lagos-correct. The previous code used
    // .setHours(0,0,0,0), which snaps to the SERVER's midnight — UTC on Vercel —
    // so between 00:00 and 01:00 WAT "today" silently meant yesterday.
    const inRange = rangeFilter(range);
    const today = todayISO();
    const startOfToday = startOfDay(today);

    // Bucket width follows the span, so "all time" cannot render 900 columns.
    const grain = grainFor(range.spanDays);

    const [
      totalAll,
      totalRange,
      totalToday,
      uniqueAll,
      uniqueRange,
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
      PageView.countDocuments({ ts: inRange }),
      PageView.countDocuments({ ts: { $gte: startOfToday } }),

      PageView.distinct("visitorId", { visitorId: { $nin: [null, ""] } }).then((v) => v.length),
      PageView.distinct("visitorId", { visitorId: { $nin: [null, ""] }, ts: inRange }).then((v) => v.length),
      PageView.distinct("visitorId", { visitorId: { $nin: [null, ""] }, ts: { $gte: startOfToday } }).then((v) => v.length),

      PageView.aggregate<TopPage>([
        { $match: { ts: inRange } },
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, path: "$_id", count: 1 } },
      ]),

      PageView.aggregate([
        { $match: { ts: inRange } },
        {
          $group: {
            // timezone is load-bearing: without it Mongo buckets by UTC day and the
            // chart disagrees with the totals by an hour at every boundary.
            _id: {
              $dateToString: {
                format: GRAIN_FORMAT[grain],
                date: "$ts",
                timezone: LAGOS_OFFSET,
              },
            },
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
        { $match: { ts: inRange, device: { $ne: "" } } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      PageView.aggregate<BreakdownRow>([
        { $match: { ts: inRange, browser: { $ne: "" } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      PageView.aggregate<BreakdownRow>([
        { $match: { ts: inRange, country: { $ne: "" } } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      PageView.aggregate<BreakdownRow>([
        { $match: { ts: inRange, utmSource: { $ne: "" } } },
        { $group: { _id: "$utmSource", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]),

      // One row per visitor: first/last seen, entry page, page count, latest known device/geo/ip.
      // Legacy rows recorded before visitor tracking shipped have no visitorId — exclude them
      // so they don't collapse into one phantom "visitor" with hundreds of page views.
      PageView.aggregate([
        { $match: { visitorId: { $nin: [null, ""] }, ts: inRange } },
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

    const found = new Map(
      (dailyBuckets as DayBucket[]).map((b) => [b.date, b] as const),
    );
    const filledDays: DayBucket[] = bucketKeys(range, grain).map((key) => ({
      date: key,
      count: found.get(key)?.count ?? 0,
      visitors: found.get(key)?.visitors ?? 0,
    }));

    return {
      grain,
      totalAll,
      totalRange,
      totalToday,
      uniqueAll,
      uniqueRange,
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
      grain: "day" as const,
      totalAll: 0,
      totalRange: 0,
      totalToday: 0,
      uniqueAll: 0,
      uniqueRange: 0,
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Axis label for a bucket key. The key shape follows the grain, so this has to
 * branch: "2026-08-20" (day), "2026-W34" (week), "2026-08" (month).
 */
function bucketLabel(key: string, grain: Grain): string {
  if (grain === "week") return `W${key.split("-W")[1]}`;
  if (grain === "month") {
    const [year, month] = key.split("-");
    return `${MONTHS[Number(month) - 1]} ${year.slice(2)}`;
  }
  const [, month, day] = key.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

/**
 * Date range picker.
 *
 * Preset chips are plain links and the custom range is a GET form, so the whole
 * control works with no JavaScript — which matters, because this page is a
 * server component and there is no client bundle to fall back on.
 */
function RangeControl({ range }: { range: DateRange }) {
  return (
    <div className="frosted-glass rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = range.preset === preset.key;
          return (
            <a
              key={preset.key}
              href={`/admin/analytics?range=${preset.key}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold tracking-[.1em] uppercase transition ${
                active
                  ? "bg-violet-brand text-white"
                  : "bg-white border border-black/10 text-neutral-600 hover:border-violet-brand/40 hover:text-violet-deep"
              }`}
            >
              {preset.label}
            </a>
          );
        })}
      </div>

      <form method="GET" className="flex items-center gap-2 sm:ml-auto">
        <input
          type="date"
          name="from"
          defaultValue={range.from}
          max={todayISO()}
          aria-label="From date"
          className="input !py-2 !w-auto !text-[12px]"
        />
        <span className="text-neutral-400 text-[12px]" aria-hidden>&ndash;</span>
        <input
          type="date"
          name="to"
          defaultValue={range.to}
          max={todayISO()}
          aria-label="To date"
          className="input !py-2 !w-auto !text-[12px]"
        />
        <button type="submit" className="btn-light !py-2 !px-4 !text-[12px]">Apply</button>
      </form>
    </div>
  );
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

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  // Parsed outside the data fetch so a database hiccup blanks the numbers but
  // still leaves a working filter control to retry with.
  const range = parseDateRange(searchParams);
  const {
    grain,
    totalAll, totalRange, totalToday,
    uniqueAll, uniqueRange, uniqueToday,
    topPages, filledDays,
    deviceBreakdown, browserBreakdown, countryBreakdown, utmBreakdown,
    recentVisitors,
  } = await getAnalytics(range);

  const currentBucket = bucketKeyFor(todayISO(), grain);
  const rangeQuery = range.preset
    ? `range=${range.preset}`
    : `from=${range.from}&to=${range.to}`;

  const maxDay = Math.max(...filledDays.map((d) => d.count), 1);
  const totalForShare = topPages.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <div className="p-6 sm:p-10 max-w-[1100px]">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
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
        <a href={`/api/admin/export/analytics?${rangeQuery}`} className="btn-dark !text-[12px] !px-5 !py-2 shrink-0">
          Export CSV <span>→</span>
        </a>
      </div>

      <RangeControl range={range} />

      {/* stat tiles: page views */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="frosted-glass rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-neutral-500 uppercase mb-2">All time</div>
          <div className="font-accent font-extrabold text-[30px] leading-none text-ink">{fmt(totalAll)}</div>
          <div className="text-[11.5px] text-neutral-500 mt-1">page views</div>
        </div>
        <div className="frosted-glass-violet rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-white/70 uppercase mb-2">{range.label}</div>
          <div className="font-accent font-extrabold text-[30px] leading-none text-white">{fmt(totalRange)}</div>
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
          <div className="text-[10px] font-bold tracking-[.2em] text-neutral-500 uppercase mb-2">{range.label}</div>
          <div className="font-accent font-extrabold text-[24px] leading-none text-ink">{fmt(uniqueRange)}</div>
          <div className="text-[11.5px] text-neutral-500 mt-1">unique visitors</div>
        </div>
        <div className="bg-white border border-black/[.06] rounded-2xl p-5">
          <div className="text-[10px] font-bold tracking-[.2em] text-neutral-500 uppercase mb-2">Today</div>
          <div className="font-accent font-extrabold text-[24px] leading-none text-ink">{fmt(uniqueToday)}</div>
          <div className="text-[11.5px] text-neutral-500 mt-1">unique visitors</div>
        </div>
      </div>

      {/* traffic trend over the selected range */}
      <div className="bg-white border border-black/[.06] rounded-2xl p-6 mb-6">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-neutral-500 uppercase mb-5">
          {range.label} &middot; views vs unique visitors &middot; by {grain}
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {filledDays.map((d) => {
            const pct = Math.round((d.count / maxDay) * 100);
            const visitorPct = Math.round((d.visitors / maxDay) * 100);
            const isToday = d.date === currentBucket;
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
                  {bucketLabel(d.date, grain)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* breakdown grid: device, browser, country, utm source */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <BreakdownCard title={`Device · ${range.label}`} rows={deviceBreakdown} />
        <BreakdownCard title={`Browser · ${range.label}`} rows={browserBreakdown} />
        <BreakdownCard title={`Country · ${range.label}`} rows={countryBreakdown} emptyLabel="No geo data yet" />
        <BreakdownCard title={`Traffic source · ${range.label}`} rows={utmBreakdown} emptyLabel="No campaign traffic yet" />
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
            {totalAll === 0
              ? "No page views recorded yet. Visit the public site to start tracking."
              : `No page views in ${range.label.toLowerCase()}. Try a wider range.`}
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
            {uniqueAll === 0
              ? "No visitors recorded yet."
              : `No visitors in ${range.label.toLowerCase()}.`}
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
