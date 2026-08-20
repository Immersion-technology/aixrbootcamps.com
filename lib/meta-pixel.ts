/**
 * Typed wrapper around the Meta Pixel's `fbq`.
 *
 * Raw fbq() calls scattered through components is how tracking rots: a typo in
 * an event name produces no error, no warning and no event — you just find out
 * weeks later that Events Manager has been empty the whole time. Going through
 * this module means a wrong name is a compile error instead.
 *
 * The base pixel snippet itself lives in components/MetaPixel.tsx.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Meta's standard events. Deliberately not a bare string: these names are an
 * API, and only the ones we actually send are listed.
 */
export type MetaEvent =
  | "PageView"
  | "ViewContent"
  | "Contact"
  | "Lead"
  | "InitiateCheckout"
  | "Purchase";

export interface MetaEventOptions {
  /**
   * Deduplication key. Meta collapses repeat events sharing an eventID for 48h,
   * which is what makes a Purchase safe against page refreshes — and what lets
   * a future server-side Conversions API event dedupe against the browser one.
   */
  eventID?: string;
}

/**
 * Fire a standard event.
 *
 * No-ops when `fbq` is missing rather than throwing. That is not defensive
 * padding: ad blockers strip fbevents.js for a real share of visitors, and an
 * uncaught ReferenceError inside a click handler would break the button the
 * user actually came to press.
 */
export function trackMeta(
  event: MetaEvent,
  params?: Record<string, unknown>,
  options?: MetaEventOptions,
): void {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params, options);
}

/**
 * Kobo → naira. Everything internal is kobo; Meta expects major units, so a
 * ₦100,000 sale must report 100000 and not 10000000. Getting this wrong
 * silently teaches the ad algorithm that every sale is worth 100× reality.
 */
export function toMetaValue(kobo: number): number {
  return Math.round(kobo) / 100;
}

/** Currency for every monetary event on this site. */
export const META_CURRENCY = "NGN";

/**
 * Fire a Purchase exactly once for a given payment reference.
 *
 * The success page polls every 1.5s, the parent may refresh it, and Paystack
 * can redirect more than once — all of which would otherwise report the same
 * sale repeatedly and teach the ad algorithm that revenue is several times what
 * it really is.
 *
 * Two layers, and both are needed:
 *   eventID        the authoritative one. Meta collapses events sharing an
 *                  eventID for 48h, which also dedupes this against the
 *                  server-side Conversions API event when that lands.
 *   sessionStorage a cheap local guard so a refresh does not even bother
 *                  sending the duplicate.
 */
export function firePurchaseOnce(params: {
  reference: string;
  registrationId: string;
  amountKobo: number;
}): void {
  if (typeof window === "undefined") return;

  const key = `meta_purchase_fired:${params.reference}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode or a full quota. Fall through and send anyway: eventID
    // dedup on Meta's side is the real guarantee, this was only the shortcut.
  }

  trackMeta(
    "Purchase",
    {
      value: toMetaValue(params.amountKobo),
      currency: META_CURRENCY,
      content_ids: [params.registrationId],
      content_type: "product",
    },
    { eventID: params.reference },
  );
}
