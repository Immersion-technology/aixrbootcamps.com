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

export function cohortById(id: number | undefined | null): Cohort | undefined {
  return COHORTS.find((c) => c.id === id);
}

/** Display string like "Cohort 2 · 10 – 21 Aug 2026" (year appended once). */
export function cohortLabel(id: number | undefined | null): string {
  const c = cohortById(id);
  return c ? `${c.label} · ${c.range} 2026` : "—";
}
