/**
 * Single source of truth for the photo gallery.
 *
 * Photos are static files committed to `public/gallery/`; this manifest gives
 * each one its alt text, caption and filters. Both the landing strip and the
 * /gallery page read from here, so they can never disagree about what exists.
 *
 * To add photos see `public/gallery/README.md`.
 */
import type { CohortId } from "@/lib/cohorts";
import { cohortById } from "@/lib/cohorts";

export type GalleryCategory = "classes" | "demo-day" | "robotics" | "attractions" | "venue";

export interface GalleryItem {
  /** Path under /public, e.g. "/gallery/demo-day-01.jpg". */
  src: string;
  /**
   * Alt text. REQUIRED, not optional — an optional alt is an alt nobody writes,
   * and a gallery is exactly where screen-reader users lose the most.
   * Describe what's happening, not "photo of camp".
   */
  alt: string;
  /** Shown under the photo in the lightbox. */
  caption?: string;
  cohort?: CohortId;
  category: GalleryCategory;
  /** Tile shape in the grid. Defaults to landscape. */
  aspect?: "square" | "portrait" | "landscape";
  /** Include in the landing-page strip. Keep this to your best 6–8. */
  featured?: boolean;
}

/**
 * Display order = array order. Newest/best first.
 *
 * Empty until real camp photos are added — see public/gallery/README.md.
 * While empty the landing strip renders nothing and /gallery shows a holding
 * message, so the site never displays an empty grid.
 */
export const GALLERY: GalleryItem[] = [
  // {
  //   src: "/gallery/demo-day-pitch-01.jpg",
  //   alt: "A camper presenting her AI app to the Demo Day jury",
  //   caption: "Demo Day — Cohort 1",
  //   cohort: 1,
  //   category: "demo-day",
  //   aspect: "landscape",
  //   featured: true,
  // },
];

export const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  classes: "In class",
  "demo-day": "Demo Day",
  robotics: "Robotics",
  attractions: "Side attractions",
  venue: "The venue",
};

/** Aspect-ratio CSS value per tile shape. */
export const ASPECT_RATIO: Record<NonNullable<GalleryItem["aspect"]>, string> = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
};

export function aspectRatioOf(item: GalleryItem): string {
  return ASPECT_RATIO[item.aspect ?? "landscape"];
}

export const hasPhotos = (): boolean => GALLERY.length > 0;

/** Best-of subset for the landing strip. Falls back to the first N when nothing is flagged. */
export function featuredPhotos(limit = 8): GalleryItem[] {
  const flagged = GALLERY.filter((p) => p.featured);
  return (flagged.length > 0 ? flagged : GALLERY).slice(0, limit);
}

export interface GalleryFilter {
  category?: GalleryCategory | "all";
  cohort?: CohortId | "all";
}

export function photosBy(filter: GalleryFilter = {}): GalleryItem[] {
  return GALLERY.filter((p) => {
    if (filter.category && filter.category !== "all" && p.category !== filter.category) return false;
    if (filter.cohort && filter.cohort !== "all" && p.cohort !== filter.cohort) return false;
    return true;
  });
}

/**
 * Only categories that actually have photos, in the canonical order above.
 * Driving the filter chips from this makes an empty filter result impossible.
 */
export function categoriesInUse(): GalleryCategory[] {
  const present = new Set(GALLERY.map((p) => p.category));
  return (Object.keys(CATEGORY_LABELS) as GalleryCategory[]).filter((c) => present.has(c));
}

/** Cohorts that actually have photos, ascending. */
export function cohortsInUse(): CohortId[] {
  const present = new Set(
    GALLERY.map((p) => p.cohort).filter((c): c is CohortId => c !== undefined)
  );
  return [...present].sort((a, b) => a - b);
}

/** "Cohort 2" — for the filter chips. */
export function cohortChipLabel(id: CohortId): string {
  return cohortById(id)?.label ?? `Cohort ${id}`;
}
