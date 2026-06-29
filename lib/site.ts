/**
 * Single source of truth for site-wide SEO + branding values. Imported by the
 * root layout metadata, sitemap, robots, manifest, OG image, per-page metadata
 * and JSON-LD structured data so nothing is duplicated.
 */

// Canonical production URL. Override per-environment with NEXT_PUBLIC_SITE_URL
// (no trailing slash). Falls back to the live domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aixrbootcamp.com").replace(/\/+$/, "");

export const SITE_NAME = "IMMERSIA";

export const SITE_TITLE = "AI & XR Summer Tech Bootcamp 2026";

export const SITE_DESC =
  "Nigeria's only summer tech camp where kids 10–17 ship a deployed AI app, build a VR world, " +
  "produce an AI-assisted track and pitch a startup to a jury. 27 July – 4 September 2026. " +
  "Join in-person in Lagos or live online.";

export const SITE_KEYWORDS = [
  "summer tech camp Nigeria",
  "kids coding camp Lagos",
  "AI camp for kids",
  "VR bootcamp teens",
  "robotics camp Nigeria",
  "tech holiday camp Lagos",
  "coding for kids Nigeria",
  "STEM summer camp",
  "AI and XR bootcamp",
  "kids entrepreneurship camp",
  "online coding camp for kids",
  "virtual tech camp Nigeria",
];

// Bootcamp run dates (ISO). Used by JSON-LD Event schema + copy.
export const CAMP_START = "2026-07-27";
export const CAMP_END = "2026-09-04";

// Contact + locale, used by structured data.
export const SITE_LOCALE = "en_NG";
export const CONTACT_PHONE = "+2348137013560";
export const CONTACT_CITY = "Lagos";
export const CONTACT_COUNTRY = "NG";

// Pricing in naira (for Offer structured data; pricing source of truth for
// charging lives in the registration route).
export const PRICE_EARLY_BIRD = 150000;
export const PRICE_REGULAR = 200000;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
