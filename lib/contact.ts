/**
 * Contact details — the ONE place the phone number is written down.
 *
 * This deliberately lives apart from lib/site.ts. Client components (the
 * floating WhatsApp button, the parent portal panel) need these values, and
 * lib/site.ts imports lib/pricing, which reads non-public PRICE_*_KOBO env
 * vars. Pulling that into a browser bundle gets you pricing constants that
 * silently fall back to defaults because the env vars are server-only. This
 * module has no dependencies, so it is safe to import from anywhere.
 *
 * The formats are not interchangeable and each has exactly one correct use:
 *   E164     → tel: links and schema.org, the only machine-readable form
 *   DISPLAY  → what a Nigerian parent expects to read on screen
 *   WHATSAPP → wa.me rejects "+", spaces and leading zeros; digits only
 */

export const CONTACT_PHONE_E164 = "+2347071544557";
export const CONTACT_PHONE_DISPLAY = "0707 154 4557";
export const CONTACT_PHONE_INTL_DISPLAY = "+234 707 154 4557";
export const CONTACT_WHATSAPP_NUMBER = "2347071544557";
export const CONTACT_TEL_URL = `tel:${CONTACT_PHONE_E164}`;
export const CONTACT_EMAIL = "hello@immersia.ng";
export const CONTACT_EMAIL_URL = `mailto:${CONTACT_EMAIL}`;

/** Plain deep link, no pre-filled text. */
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}`;

/** Opening line pre-filled into WhatsApp so a parent never faces a blank compose box. */
export const WHATSAPP_GREETING = "Hi! I'd like to ask about the AIXR summer bootcamp.";

/**
 * Build a wa.me deep link with a pre-filled opener.
 *
 * Passing a page-specific message is the cheapest possible lead attribution:
 * the first line of the chat says where the parent came from, with no tracking
 * involved at all.
 */
export function whatsappUrl(message: string = WHATSAPP_GREETING): string {
  return `${CONTACT_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
