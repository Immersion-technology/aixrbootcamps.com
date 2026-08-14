/**
 * Who a campaign goes to.
 *
 * A segment is a named query over the app's existing collections — there is no
 * separate "mailing list" to keep in sync, because a stale list is how people
 * get emailed about a camp they cancelled.
 *
 * Every resolver returns recipients DEDUPED BY EMAIL. That matters: a parent
 * with two campers has two Registration rows, and sending them the same notice
 * twice is the fastest way to earn a spam complaint. Duplicates are merged, and
 * `{{childNames}}` becomes "Zara and Tobi" so the copy still reads correctly.
 */
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Waitlist } from "@/models/Waitlist";
import { ParentAccount } from "@/models/ParentAccount";
import { Teacher } from "@/models/Teacher";
import { cohortById, cohortLabel, COHORT_IDS, CAMP_SCHEDULE } from "@/lib/cohorts";
import { CAMP_START, CAMP_END } from "@/lib/site";
import { publicBaseUrl, LIVE_SITE_URL } from "./base-url";
import { firstNameOf, joinNames, type MergeData } from "./merge";

/**
 * Links in emails ALWAYS point at the live site.
 *
 * Never `process.env.APP_URL` — that is the running server's own address, which
 * is http://localhost:3000 in development. A campaign carrying localhost links
 * gives the recipient a dead dashboard button and a dead unsubscribe, and gets
 * filed as spam. `publicBaseUrl()` resolves EMAIL_BASE_URL / NEXT_PUBLIC_SITE_URL
 * and falls back to the production domain — localhost can never win.
 */
const APP_URL = publicBaseUrl(LIVE_SITE_URL);

export interface Recipient {
  email: string;
  name: string;
  mergeData: MergeData;
}

export interface SegmentFilters {
  /** Registration segments: restrict to one cohort (1 | 2 | 3). */
  cohort?: number;
  /** Registration segments: "in_person" | "online". */
  attendanceMode?: string;
  /** Registration segments: a course name that must appear in `courses`. */
  course?: string;
  /** Custom segment: newline/comma separated addresses. */
  emails?: string;
}

export interface SegmentDef {
  key: string;
  label: string;
  description: string;
  /** Whether the cohort / mode / course filters apply to this source. */
  supportsFilters: boolean;
  resolve: (filters: SegmentFilters) => Promise<Recipient[]>;
}

const DATE_FMT = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" });

function longDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : DATE_FMT.format(d);
}

/** Values every recipient gets, regardless of which collection they came from. */
function baseMergeData(email: string, name: string): MergeData {
  return {
    email,
    parentName: name,
    firstName: firstNameOf(name),
    participantName: "",
    childNames: "",
    registrationId: "",
    cohortLabel: "",
    cohortName: "",
    cohortDates: "",
    cohortStart: "",
    attendanceMode: "",
    courses: "",
    campName: "AiXR Summer Tech Boot Camp",
    campDates: `${longDate(CAMP_START)} – ${longDate(CAMP_END)}`,
    campHours: CAMP_SCHEDULE,
    portalUrl: `${APP_URL}/account/login`,
    siteUrl: APP_URL,
    // Filled in per-message at send time — it's unique to each address.
    unsubscribeUrl: "",
  };
}

/**
 * Collapse multiple rows for the same address into one recipient.
 * The FIRST row wins for scalar fields (registration id, cohort); child names
 * accumulate across all of them.
 */
function dedupe(rows: Array<{ email: string; name: string; child?: string; merge: MergeData }>): Recipient[] {
  const byEmail = new Map<string, { email: string; name: string; children: string[]; merge: MergeData }>();

  for (const row of rows) {
    const email = row.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) continue;

    const existing = byEmail.get(email);
    if (existing) {
      if (row.child && !existing.children.includes(row.child)) existing.children.push(row.child);
      continue;
    }
    byEmail.set(email, {
      email,
      name: row.name,
      children: row.child ? [row.child] : [],
      merge: row.merge,
    });
  }

  return [...byEmail.values()].map((r) => ({
    email: r.email,
    name: r.name,
    mergeData: {
      ...r.merge,
      childNames: joinNames(r.children),
      // participantName stays the first child; childNames covers the rest.
      participantName: r.merge.participantName || r.children[0] || "",
    },
  }));
}

/** Shared Mongo filter for the registration-backed segments. */
function registrationQuery(filters: SegmentFilters, base: Record<string, unknown>) {
  const q: Record<string, unknown> = { ...base };
  if (filters.cohort && COHORT_IDS.includes(filters.cohort as 1 | 2 | 3)) q.cohort = filters.cohort;
  if (filters.attendanceMode === "in_person" || filters.attendanceMode === "online") {
    q.attendanceMode = filters.attendanceMode;
  }
  if (filters.course) q.courses = filters.course;
  return q;
}

async function resolveRegistrations(filters: SegmentFilters, base: Record<string, unknown>): Promise<Recipient[]> {
  await connectDB();
  const rows = await Registration.find(registrationQuery(filters, base))
    .select("registrationId participant parent cohort attendanceMode courses")
    .sort({ createdAt: 1 })
    .lean();

  return dedupe(
    rows.map((r: any) => {
      const name = r.parent?.fullName ?? "";
      const child = r.participant?.fullName ?? "";
      return {
        email: r.parent?.email ?? "",
        name,
        child,
        merge: {
          ...baseMergeData(r.parent?.email ?? "", name),
          participantName: child,
          registrationId: r.registrationId ?? "",
          cohortLabel: r.cohort ? cohortLabel(r.cohort) : "",
          // Pre-cohort legacy registrations have no cohort. Fall back to the
          // full camp window rather than rendering "Cohort · " with a gap in it.
          cohortName: cohortById(r.cohort)?.label ?? "To be confirmed",
          cohortDates: cohortById(r.cohort)?.range ?? "27 Jul – 4 Sep",
          cohortStart: longDate(cohortById(r.cohort)?.start),
          attendanceMode: r.attendanceMode === "online" ? "Online" : "Lagos Camp (Onsite)",
          courses: Array.isArray(r.courses) ? r.courses.join(", ") : "",
        },
      };
    })
  );
}

export const SEGMENTS: SegmentDef[] = [
  {
    key: "paid_registrations",
    label: "Paid campers",
    description: "Parents of every camper with a confirmed payment. The default for camp logistics.",
    supportsFilters: true,
    resolve: (f) => resolveRegistrations(f, { paymentStatus: "paid", admissionStatus: { $ne: "rejected" } }),
  },
  {
    key: "pending_registrations",
    label: "Started but not paid",
    description: "Parents who began a registration but never completed payment. Useful for a nudge.",
    supportsFilters: true,
    resolve: (f) => resolveRegistrations(f, { paymentStatus: { $in: ["pending", "failed", "abandoned"] } }),
  },
  {
    key: "all_registrations",
    label: "Everyone who registered",
    description: "Paid and unpaid, excluding rejected registrations.",
    supportsFilters: true,
    resolve: (f) => resolveRegistrations(f, { admissionStatus: { $ne: "rejected" } }),
  },
  {
    key: "waitlist",
    label: "Waitlist",
    description: "Everyone waiting for a slot. Use this the moment a place opens up.",
    supportsFilters: false,
    resolve: async () => {
      await connectDB();
      const rows = await Waitlist.find().sort({ createdAt: 1 }).lean();
      return dedupe(
        rows.map((r: any) => ({
          email: r.email ?? "",
          name: r.parentName ?? "",
          child: r.participantName ?? "",
          merge: {
            ...baseMergeData(r.email ?? "", r.parentName ?? ""),
            participantName: r.participantName ?? "",
          },
        }))
      );
    },
  },
  {
    key: "parent_accounts",
    label: "Parent portal accounts",
    description: "Every provisioned parent account. Near-identical to paid campers, keyed by account.",
    supportsFilters: false,
    resolve: async () => {
      await connectDB();
      const rows = await ParentAccount.find().sort({ createdAt: 1 }).lean();
      return dedupe(
        rows.map((r: any) => ({
          email: r.email ?? "",
          name: r.name ?? "",
          merge: baseMergeData(r.email ?? "", r.name ?? ""),
        }))
      );
    },
  },
  {
    key: "teachers",
    label: "Facilitators",
    description: "Active facilitators only. For briefings and rota changes.",
    supportsFilters: false,
    resolve: async () => {
      await connectDB();
      const rows = await Teacher.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
      return dedupe(
        rows.map((r: any) => ({
          email: r.email ?? "",
          name: r.name ?? "",
          merge: baseMergeData(r.email ?? "", r.name ?? ""),
        }))
      );
    },
  },
  {
    key: "custom",
    label: "Custom list",
    description: "Paste specific addresses, one per line. Merge fields beyond the name stay blank.",
    supportsFilters: false,
    resolve: async (filters) => {
      const raw = String(filters.emails ?? "");
      const parts = raw
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      return dedupe(
        parts.map((email) => ({
          email,
          name: "",
          merge: baseMergeData(email, ""),
        }))
      );
    },
  },
];

export const SEGMENT_KEYS = SEGMENTS.map((s) => s.key);

export function getSegment(key: string): SegmentDef | undefined {
  return SEGMENTS.find((s) => s.key === key);
}

/** Resolve a segment to its deduped recipient list. Throws on an unknown key. */
export async function resolveSegment(key: string, filters: SegmentFilters = {}): Promise<Recipient[]> {
  const segment = getSegment(key);
  if (!segment) throw new Error(`Unknown segment "${key}"`);
  return segment.resolve(filters);
}

/** Human summary for the confirm-before-send dialog and the campaign list. */
export function describeSegment(key: string, filters: SegmentFilters = {}): string {
  const segment = getSegment(key);
  if (!segment) return key;
  const bits: string[] = [];
  if (segment.supportsFilters) {
    if (filters.cohort) bits.push(cohortLabel(filters.cohort));
    if (filters.attendanceMode === "online") bits.push("online only");
    if (filters.attendanceMode === "in_person") bits.push("in-person only");
    if (filters.course) bits.push(filters.course);
  }
  return bits.length ? `${segment.label} · ${bits.join(" · ")}` : segment.label;
}
