/**
 * Merge fields available to campaign content — `{{parentName}}` and friends.
 *
 * Safety model (the ordering here matters, don't reshuffle it):
 *   1. The author's literal text is escaped + inline-parsed FIRST.
 *   2. Merge tokens are substituted into that already-safe HTML, with each value
 *      escaped on the way in.
 * So a camper named `<script>` or `[click](javascript:…)` can never inject markup
 * or a link — the value is escaped and never re-parsed as markup.
 *
 * URLs are the one exception: a token in URL position is substituted BEFORE the
 * URL is validated, so only `urlSafe` (system-generated) fields are permitted
 * there. A user-supplied value can never become an href.
 */
import { esc } from "./shell";

export interface MergeField {
  key: string;
  label: string;
  description: string;
  /** Shown in previews and test sends. */
  sample: string;
  /** May be used inside a link/button URL. System-generated values only. */
  urlSafe?: boolean;
}

export const MERGE_FIELDS: MergeField[] = [
  { key: "parentName", label: "Parent name", description: "Full name of the parent or guardian", sample: "Adebayo Okonkwo" },
  { key: "firstName", label: "First name", description: "Just the parent's first name", sample: "Adebayo" },
  { key: "participantName", label: "Camper name", description: "The camper's full name (first child if several)", sample: "Zara Okonkwo" },
  { key: "childNames", label: "All camper names", description: "Every camper on this email, e.g. \"Zara and Tobi\"", sample: "Zara and Tobi Okonkwo" },
  { key: "registrationId", label: "Registration ID", description: "The camper's registration reference", sample: "IMM-2026-0042" },
  { key: "cohortLabel", label: "Cohort (full)", description: "e.g. \"Cohort 2 · 10 – 21 Aug 2026\"", sample: "Cohort 2 · 10 – 21 Aug 2026" },
  { key: "cohortName", label: "Cohort name", description: "Just the name, e.g. \"Cohort 2\"", sample: "Cohort 2" },
  { key: "cohortDates", label: "Cohort dates", description: "Just the dates, e.g. \"10 – 21 Aug\"", sample: "10 – 21 Aug" },
  { key: "cohortStart", label: "Cohort start date", description: "The camper's first day", sample: "10 August 2026" },
  { key: "attendanceMode", label: "Attendance", description: "\"In-person (Lagos)\" or \"Online\"", sample: "In-person (Lagos)" },
  { key: "courses", label: "Courses", description: "The camper's courses, comma separated", sample: "Vibe Coding & AI, 3D Design & VR" },
  { key: "campHours", label: "Daily hours", description: "Monday – Friday · 9:00 AM – 1:30 PM", sample: "Monday – Friday · 9:00 AM – 1:30 PM" },
  { key: "email", label: "Email address", description: "The recipient's own email address", sample: "parent@example.com" },
  { key: "campName", label: "Camp name", description: "The boot camp's name", sample: "AiXR Summer Tech Boot Camp" },
  { key: "campDates", label: "Camp dates", description: "The full run of the camp", sample: "27 July – 4 September 2026" },
  { key: "portalUrl", label: "Parent portal link", description: "One-click link to the parent portal login", sample: "https://immersia.ng/account/login", urlSafe: true },
  { key: "siteUrl", label: "Website link", description: "The boot camp homepage", sample: "https://immersia.ng", urlSafe: true },
  { key: "unsubscribeUrl", label: "Unsubscribe link", description: "This recipient's one-click unsubscribe URL", sample: "https://immersia.ng/api/e/u/abc123", urlSafe: true },
];

/**
 * snake_case aliases so designs written with `{{first_name}}` work verbatim
 * alongside the camelCase names. Both spellings resolve to the same value —
 * the alias is expanded into the merge data, not handled at render time, so
 * validation, preview and send all treat them identically.
 */
export const MERGE_ALIASES: Record<string, string> = {
  parent_name: "parentName",
  first_name: "firstName",
  participant_name: "participantName",
  child_names: "childNames",
  participant_id: "registrationId",
  registration_id: "registrationId",
  cohort_label: "cohortLabel",
  cohort_name: "cohortName",
  cohort_dates: "cohortDates",
  cohort_start: "cohortStart",
  attendance_mode: "attendanceMode",
  camp_name: "campName",
  camp_dates: "campDates",
  camp_hours: "campHours",
  portal_url: "portalUrl",
  site_url: "siteUrl",
  unsubscribe_url: "unsubscribeUrl",
};

/** Expand aliases so `{{first_name}}` and `{{firstName}}` both resolve. */
export function withAliases(data: MergeData): MergeData {
  const out: MergeData = { ...data };
  for (const [alias, canonical] of Object.entries(MERGE_ALIASES)) {
    if (out[alias] === undefined && data[canonical] !== undefined) {
      out[alias] = data[canonical];
    }
  }
  return out;
}

export const MERGE_KEYS = new Set([...MERGE_FIELDS.map((f) => f.key), ...Object.keys(MERGE_ALIASES)]);

export const URL_SAFE_MERGE_KEYS = new Set([
  ...MERGE_FIELDS.filter((f) => f.urlSafe).map((f) => f.key),
  // A snake_case alias of a URL-safe field is equally safe in a link.
  ...Object.entries(MERGE_ALIASES)
    .filter(([, canonical]) => MERGE_FIELDS.find((f) => f.key === canonical)?.urlSafe)
    .map(([alias]) => alias),
]);

export type MergeData = Record<string, string>;

/**
 * Sample values for previews and test sends, so nothing renders as a raw token.
 *
 * Returns CANONICAL keys only — aliases are expanded at render time by
 * `withAliases`. Baking them in here would let a caller override `firstName`
 * while a stale `first_name` alias survived and won, which is exactly the kind
 * of silent mismatch that ships the wrong name to a real parent.
 */
export function sampleMergeData(): MergeData {
  return Object.fromEntries(MERGE_FIELDS.map((f) => [f.key, f.sample]));
}

/** `{{ key }}` — whitespace tolerant, single token per match. */
const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Substitute tokens into already-escaped HTML. Values are escaped on the way in,
 * so they land as inert text. An unknown token renders as an empty string rather
 * than leaking `{{typo}}` into a parent's inbox.
 */
export function applyMergeHtml(safeHtml: string, data: MergeData): string {
  return safeHtml.replace(TOKEN_RE, (_m, key: string) => esc(data[key] ?? ""));
}

/**
 * Substitute tokens inside a URL, before validation. Only `urlSafe` fields are
 * honoured; anything else collapses to empty so it fails URL validation loudly
 * instead of silently pointing somewhere unexpected.
 */
export function applyMergeUrl(url: string, data: MergeData): string {
  return url.replace(TOKEN_RE, (_m, key: string) =>
    URL_SAFE_MERGE_KEYS.has(key) ? encodeURI(data[key] ?? "") : ""
  );
}

/**
 * Substitute tokens into a plain-text context (subject lines, the text/plain
 * body). Values are NOT HTML-escaped — nothing here is parsed as markup — but
 * CR/LF is stripped, because a newline in a merged value landing in a Subject
 * header is header injection.
 */
export function applyMergePlain(text: string, data: MergeData): string {
  // Alias-expanded so `{{first_name}}` works in a subject line, exactly as it
  // does in the body.
  const resolved = withAliases(data);
  return text
    .replace(TOKEN_RE, (_m, key: string) => (resolved[key] ?? "").replace(/[\r\n]+/g, " "))
    .replace(/[\r\n]+/g, " ")
    .trim();
}

/** Every token used in a string, in order of appearance. */
export function tokensIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(TOKEN_RE)) out.push(m[1]);
  return out;
}

/** Extract the first name from a full name, falling back to the whole string. */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

/** "Zara", "Zara and Tobi", "Zara, Tobi and Ada" */
export function joinNames(names: string[]): string {
  const list = names.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
