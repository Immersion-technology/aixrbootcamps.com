/**
 * Single source of truth for site-wide SEO + branding values. Imported by the
 * root layout metadata, sitemap, robots, manifest, OG image, per-page metadata
 * and JSON-LD structured data so nothing is duplicated.
 */
import { PRICING } from "@/lib/pricing";

// Canonical production URL. Override per-environment with NEXT_PUBLIC_SITE_URL
// (no trailing slash). Falls back to the live domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aixrbootcamp.com").replace(/\/+$/, "");

export const SITE_NAME = "IMMERSIA";

export const SITE_TITLE = "AI & XR Summer Tech Bootcamp 2026";

export const SITE_DESC =
  "Nigeria's only summer tech camp where kids 10–17 ship a deployed AI app and build a VR world. " +
  "Join in-person in Lagos — with a live Demo Day pitch to a jury. " +
  "Final cohort of 2026: 24 August – 4 September.";

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
];

// Bootcamp run dates (ISO). Used by JSON-LD Event schema + copy.
export const CAMP_START = "2026-07-27";
export const CAMP_END = "2026-09-04";

export const SITE_LOCALE = "en_NG";
export const CONTACT_CITY = "Lagos";
export const CONTACT_COUNTRY = "NG";

// Contact details live in lib/contact.ts (no pricing dependency, so client
// components can import them). Re-exported here because structured data and
// SEO metadata reach for them alongside the rest of the site constants.
export {
  CONTACT_PHONE_E164,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_INTL_DISPLAY,
  CONTACT_WHATSAPP_NUMBER,
  CONTACT_WHATSAPP_URL,
  CONTACT_TEL_URL,
  CONTACT_EMAIL,
  whatsappUrl,
} from "@/lib/contact";

/** schema.org / legacy alias. */
export { CONTACT_PHONE_E164 as CONTACT_PHONE } from "@/lib/contact";

// Pricing in naira, for Offer structured data only. Derived from the kobo source of
// truth in lib/pricing.ts (env-configurable) so SEO and checkout never disagree.
export const PRICE_REGULAR = PRICING.regular / 100;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
