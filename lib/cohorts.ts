/**
 * Single source of truth for the three back-to-back 2-week cohorts.
 *
 * A camper attends ONE cohort (not the whole run). The dates + hours here drive the
 * landing "pick your cohort" section, the registration cohort picker, and the receipt /
 * admin displays, so the flyer and the site can never disagree. Update once, ripples out.
 */

export type CohortId = 1 | 2 | 3;

export interface Cohort {
  id: CohortId;
  label: string;
  /** ISO start / end (inclusive) of the 2-week window. */
  start: string;
  end: string;
  /** Human date range for display, e.g. "27 Jul – 7 Aug". */
  range: string;
}

export const COHORTS: Cohort[] = [
  { id: 1, label: "Cohort 1", start: "2026-07-27", end: "2026-08-07", range: "27 Jul – 7 Aug" },
  { id: 2, label: "Cohort 2", start: "2026-08-10", end: "2026-08-21", range: "10 – 21 Aug" },
  { id: 3, label: "Cohort 3", start: "2026-08-24", end: "2026-09-04", range: "24 Aug – 4 Sep" },
];

/** Daily schedule shared by every cohort. */
export const CAMP_DAYS = "Monday – Friday";
export const CAMP_HOURS = "9:00 AM – 1:30 PM";
export const CAMP_SCHEDULE = `${CAMP_DAYS} · ${CAMP_HOURS}`;

/** The valid cohort ids, handy for enums / validation. */
export const COHORT_IDS: CohortId[] = COHORTS.map((c) => c.id);

/**
 * Which cohorts you can still register for.
 *
 * Derived from the date rather than hand-maintained, so the site closes each
 * cohort by itself as camp progresses — nobody has to remember to edit a flag,
 * and the public page, the registration form and the server validation can
 * never disagree about what's on sale.
 *
 * A cohort stays open until the day it starts; once underway you can't join it.
 */
export function isCohortOpen(id: number | undefined | null, now: Date = new Date()): boolean {
  const c = cohortById(id);
  if (!c) return false;
  // Compare date-only so a cohort remains bookable throughout its start day.
  const start = new Date(`${c.start}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today <= start;
}

/** Cohorts still accepting registrations, earliest first. */
export function openCohorts(now: Date = new Date()): Cohort[] {
  return COHORTS.filter((c) => isCohortOpen(c.id, now));
}

/** True once a cohort has finished. */
export function isCohortFinished(id: number | undefined | null, now: Date = new Date()): boolean {
  const c = cohortById(id);
  if (!c) return false;
  return new Date(`${c.end}T23:59:59`) < now;
}

/** "open" (bookable) · "running" (started, can't join) · "finished". */
export function cohortState(
  id: number | undefined | null,
  now: Date = new Date()
): "open" | "running" | "finished" {
  if (isCohortFinished(id, now)) return "finished";
  return isCohortOpen(id, now) ? "open" : "running";
}

/** The next cohort someone can actually book, or undefined once camp is over. */
export function nextOpenCohort(now: Date = new Date()): Cohort | undefined {
  return openCohorts(now)[0];
}

/** True when this is the only cohort left on sale — drives "final intake" copy. */
export function isFinalIntake(now: Date = new Date()): boolean {
  return openCohorts(now).length === 1;
}

/** No cohorts left to sell. */
export function registrationClosed(now: Date = new Date()): boolean {
  return openCohorts(now).length === 0;
}

/**
 * The date line shown in the nav, footer and contact page.
 *
 * Narrows as cohorts run so the site never advertises a window that has already
 * passed: the full season while everything is open, then just the cohort still
 * on sale, then a closing message.
 */
export function campDateBand(now: Date = new Date()): string {
  const open = openCohorts(now);
  if (open.length === 0) return "2026 season complete · back summer 2027";
  if (open.length === COHORTS.length) return "27 July – 4 September 2026";
  if (open.length === 1) return `Final cohort · ${open[0].range} 2026`;
  return `${open[0].range.split(" – ")[0]} – ${open[open.length - 1].range.split("– ")[1] ?? ""} 2026`;
}

export function cohortById(id: number | undefined | null): Cohort | undefined {
  return COHORTS.find((c) => c.id === id);
}

/** Display string like "Cohort 2 · 10 – 21 Aug 2026" (year appended once). */
export function cohortLabel(id: number | undefined | null): string {
  const c = cohortById(id);
  return c ? `${c.label} · ${c.range} 2026` : "—";
}
