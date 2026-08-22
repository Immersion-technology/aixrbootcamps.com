/**
 * Date ranges for the admin panel — the one place day boundaries are decided.
 *
 * Two things this fixes.
 *
 * Timezone: nothing else in the codebase is timezone-aware. The analytics page
 * computed "today" with `.setHours(0,0,0,0)`, which uses the SERVER's timezone —
 * UTC on Vercel — while the business runs in Lagos. That skew was invisible
 * until a date filter existed; now "Today" between 00:00 and 01:00 WAT would
 * quietly show yesterday. Nigeria is UTC+1 with no daylight saving, ever, so a
 * fixed offset is exactly right and avoids a timezone library.
 *
 * Duplication: `todayISO()` was copy-pasted verbatim into the admin attendance
 * page and the teacher roster, along with the same validation regex. Both now
 * import from here.
 */

/** Africa/Lagos. No DST, so this is safe as a constant rather than a lookup. */
export const LAGOS_OFFSET = "+01:00";

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in Lagos, as YYYY-MM-DD. */
export function todayISO(): string {
  return new Date(Date.now() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * First instant of a Lagos calendar day, as a UTC Date for Mongo.
 * Letting Date parse the offset beats hand-rolled arithmetic — fewer places to
 * be off by an hour.
 */
export const startOfDay = (d: string): Date => new Date(`${d}T00:00:00.000${LAGOS_OFFSET}`);

/** Last instant of that day. Inclusive, so `to` means "through the end of". */
export const endOfDay = (d: string): Date => new Date(`${d}T23:59:59.999${LAGOS_OFFSET}`);

/** Shift a YYYY-MM-DD by whole days, staying in Lagos terms. */
export function addDays(d: string, days: number): string {
  return new Date(startOfDay(d).getTime() + days * DAY_MS + LAGOS_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export const isValidISODate = (v: string | undefined): v is string =>
  typeof v === "string" && ISO_DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

export type RangePreset = "today" | "7d" | "30d" | "90d" | "all";

/** The earliest date worth offering as "all" — the site did not exist before this. */
const EPOCH = "2026-01-01";

export const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

export interface DateRange {
  /** Inclusive bounds as YYYY-MM-DD in Lagos terms. */
  from: string;
  to: string;
  /** The same bounds as UTC instants, ready for a Mongo range query. */
  fromDate: Date;
  toDate: Date;
  /** Which preset is active, or null when the range is custom. */
  preset: RangePreset | null;
  /** Human label for headings, e.g. "Last 30 days". */
  label: string;
  /** Whole days covered, inclusive. Drives chart granularity. */
  spanDays: number;
}

function fromPreset(preset: RangePreset): { from: string; to: string; label: string } {
  const to = todayISO();
  switch (preset) {
    case "today":
      return { from: to, to, label: "Today" };
    case "7d":
      return { from: addDays(to, -6), to, label: "Last 7 days" };
    case "30d":
      return { from: addDays(to, -29), to, label: "Last 30 days" };
    case "90d":
      return { from: addDays(to, -89), to, label: "Last 90 days" };
    case "all":
      return { from: EPOCH, to, label: "All time" };
  }
}

/**
 * Read a range off the query string.
 *
 * An explicit from/to beats `range`, so a bookmarked custom range survives.
 * Everything is coerced rather than rejected: bad input on an admin dashboard
 * should show a sensible default, not an error page.
 */
export function parseDateRange(
  searchParams: { range?: string; from?: string; to?: string },
  defaultPreset: RangePreset = "30d",
): DateRange {
  const today = todayISO();
  let from: string;
  let to: string;
  let preset: RangePreset | null = null;
  let label: string;

  if (isValidISODate(searchParams.from) || isValidISODate(searchParams.to)) {
    // Custom. A half-filled form is normal — treat the missing side as open,
    // bounded by the epoch or today rather than left undefined.
    from = isValidISODate(searchParams.from) ? searchParams.from : EPOCH;
    to = isValidISODate(searchParams.to) ? searchParams.to : today;

    // Clamp both ends before ordering them. Doing it the other way round lets a
    // wholly-future range slip through: the swap sees from <= to and does nothing,
    // then the clamp drags only `to` back to today and leaves from > to — which
    // rangeFilter turns into an unsatisfiable {$gte > $lte} and every panel on the
    // page silently reads zero.
    if (from > today) from = today;
    if (to > today) to = today;

    // Reversed bounds mean the user picked the two dates in the order that made
    // sense to them. They wanted a range; give them one.
    if (from > to) [from, to] = [to, from];

    label = from === to ? from : `${from} → ${to}`;
  } else {
    const requested = PRESETS.find((p) => p.key === searchParams.range)?.key;
    preset = requested ?? defaultPreset;
    ({ from, to, label } = fromPreset(preset));
  }

  const fromDate = startOfDay(from);
  const toDate = endOfDay(to);
  const spanDays = Math.round((endOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

  return { from, to, fromDate, toDate, preset, label, spanDays: Math.max(1, spanDays) };
}

/** Mongo range clause for a date field, e.g. `{ ts: rangeFilter(range) }`. */
export const rangeFilter = (range: DateRange) => ({ $gte: range.fromDate, $lte: range.toDate });

export type Grain = "day" | "week" | "month";

/**
 * Chart granularity for a span.
 *
 * Without this, "All time" renders one bar per day forever — hundreds of
 * unreadable columns. Widening the bucket keeps the chart at roughly 60 columns
 * or fewer at any range.
 */
export function grainFor(spanDays: number): Grain {
  if (spanDays <= 62) return "day";
  if (spanDays <= 420) return "week";
  return "month";
}

/**
 * Mongo $dateToString format per grain.
 *
 * Always pair with `timezone: LAGOS_OFFSET` at the call site — without it Mongo
 * buckets by UTC day and the chart disagrees with the totals by an hour at every
 * boundary, which is painful to notice and worse to explain.
 */
export const GRAIN_FORMAT: Record<Grain, string> = {
  day: "%Y-%m-%d",
  week: "%G-W%V",
  month: "%Y-%m",
};

/**
 * Every bucket key across the range, in order, so the chart can zero-fill gaps.
 * A day with no traffic must render as an empty column, not vanish and silently
 * compress the timeline.
 */
export function bucketKeys(range: DateRange, grain: Grain): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (let d = range.from; d <= range.to; d = addDays(d, 1)) {
    const key = bucketKeyFor(d, grain);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

/** Bucket key for a single Lagos date, matching GRAIN_FORMAT exactly. */
export function bucketKeyFor(date: string, grain: Grain): string {
  if (grain === "day") return date;
  if (grain === "month") return date.slice(0, 7);
  return isoWeekKey(date);
}

/**
 * ISO-8601 week key (`%G-W%V`), matching Mongo's own definition: weeks start
 * Monday, and week 1 is the one containing the first Thursday of the year.
 * Rolling our own is unavoidable here because JS has no ISO week accessor, and
 * a mismatch with Mongo would silently drop buckets off the chart.
 */
function isoWeekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay() || 7; // Sunday is 7, not 0
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to the week's Thursday
  const year = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / DAY_MS + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Date clause for a CSV export route, read straight off the request's params.
 *
 * Unlike the admin pages, an export with no date params means "everything" —
 * silently defaulting to 30 days would hand someone a truncated spreadsheet they
 * had no reason to distrust. Accepts either a preset (`?range=7d`) or explicit
 * bounds, so a link built from a filtered page carries its filter through.
 */
export function exportDateClause(
  sp: URLSearchParams,
): { $gte?: Date; $lte?: Date } | undefined {
  // Explicit bounds win over a preset, matching parseDateRange. The two must
  // agree, or the same URL resolves differently depending on which built it.
  const validFrom = isValidISODate(sp.get("from") ?? undefined) ? sp.get("from")! : undefined;
  const validTo = isValidISODate(sp.get("to") ?? undefined) ? sp.get("to")! : undefined;
  if (validFrom || validTo) {
    const resolved = parseDateRange({ from: validFrom, to: validTo });
    return { $gte: resolved.fromDate, $lte: resolved.toDate };
  }

  const preset = sp.get("range");
  if (preset && PRESETS.some((p) => p.key === preset)) {
    if (preset === "all") return undefined;
    const resolved = parseDateRange({ range: preset });
    return { $gte: resolved.fromDate, $lte: resolved.toDate };
  }

  return undefined;
}

/**
 * Did the caller ask for a date window at all?
 *
 * exportDateClause returns undefined both for "no params" and for an explicit
 * `range=all`, which are the same query but must not share a default: a route
 * with a legacy fallback window has to apply it in the first case and skip it
 * in the second, or "All time" silently exports a truncated file.
 */
export function hasDateParams(sp: URLSearchParams): boolean {
  return Boolean(sp.get("range") || sp.get("from") || sp.get("to"));
}
