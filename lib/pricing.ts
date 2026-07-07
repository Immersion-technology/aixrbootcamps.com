/**
 * Single source of truth for bootcamp pricing. All amounts are in KOBO (₦1 = 100 kobo),
 * matching how Paystack and the Registration.pricing sub-document store money.
 *
 * Prices are configured via environment variables (see `.env.example`) so they can change
 * per-deploy without touching code. Each falls back to the launch value when its env var is
 * unset or invalid, so behaviour is unchanged until an override is provided.
 *
 * IMPORTANT: this module is the authoritative price source consumed by the charge route,
 * the register page, the homepage, the public config API and the course pages. Never hardcode
 * a price anywhere else — import from here.
 */

/** Parse a positive-integer kobo env var, falling back to `fallback` on empty / NaN / ≤ 0. */
function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : fallback;
}

export const PRICING = {
  /** Boot camp fee charged before the early-bird cutoff. */
  earlyBird: intEnv("PRICE_EARLY_BIRD_KOBO", 15_000_000), // ₦150,000
  /** Boot camp fee charged after the early-bird cutoff. */
  regular: intEnv("PRICE_REGULAR_KOBO", 20_000_000), // ₦200,000
  /** Optional laptop-rental add-on. */
  laptop: intEnv("PRICE_LAPTOP_RENTAL_KOBO", 2_000_000), // +₦20,000
  /** Optional robotics elective add-on. */
  robotics: intEnv("PRICE_ROBOTICS_ELECTIVE_KOBO", 2_500_000), // +₦25,000
  /** Instalment deposit quoted in the terms / FAQ (display only — checkout charges in full). */
  deposit: intEnv("PRICE_DEPOSIT_KOBO", 7_500_000), // ₦75,000
} as const;

export type PricingTier = "early_bird" | "regular";

/** The boot camp fee (kobo) for a given pricing tier. */
export function bootCampFeeKobo(tier: PricingTier): number {
  return tier === "early_bird" ? PRICING.earlyBird : PRICING.regular;
}

/**
 * Early-bird cutoff (ISO 8601). The early-bird window has CLOSED, so the default sits in
 * the past — every visitor sees regular pricing and the early-bird banner stays hidden.
 * To re-open early-bird, set EARLY_BIRD_CUTOFF (or the admin "Cohort dates" setting, which
 * overrides this at runtime) to a FUTURE date. Single fallback used everywhere the DB value
 * is missing (previously duplicated with inconsistent dates).
 */
export const EARLY_BIRD_CUTOFF_DEFAULT =
  process.env.EARLY_BIRD_CUTOFF ?? "2026-07-03T23:59:59.000Z";

/** Whether early-bird pricing is still live at `now` for the given cutoff. */
export function isEarlyBird(cutoff: string, now: Date = new Date()): boolean {
  return now < new Date(cutoff);
}

/**
 * Floor for any charged amount, in kobo. A promo discount is clamped so the order total
 * never drops below this — a registration is never made free (full comps go through the
 * admin manual-payment tool). Also keeps us safely above Paystack's minimum charge.
 */
export const MIN_PAYABLE_KOBO = 10_000; // ₦100

export type DiscountType = "percent" | "fixed";

/** Minimal shape `applyPromo` needs — satisfied by a PromoCode document. */
export interface PromoLike {
  discountType: DiscountType;
  discountValue: number;
}

export interface AppliedDiscount {
  discountKobo: number;
  totalKobo: number;
}

/**
 * Compute the discount for a promo against an order subtotal (kobo). Pure and shared by
 * BOTH the live-preview endpoint and the authoritative charge route, so the preview a
 * camper sees can never diverge from what they're actually charged.
 *
 * - percent: floor(subtotal × value / 100)
 * - fixed:   min(value, subtotal)
 *
 * The discount is clamped so the remaining total is always ≥ MIN_PAYABLE_KOBO.
 */
export function applyPromo(subtotalKobo: number, promo: PromoLike): AppliedDiscount {
  const raw =
    promo.discountType === "percent"
      ? Math.floor((subtotalKobo * promo.discountValue) / 100)
      : Math.min(promo.discountValue, subtotalKobo);

  const maxDiscount = Math.max(0, subtotalKobo - MIN_PAYABLE_KOBO);
  const discountKobo = Math.max(0, Math.min(raw, maxDiscount));
  return { discountKobo, totalKobo: subtotalKobo - discountKobo };
}

/** Format a kobo amount as a Naira display string (e.g. 15000000 → "₦150,000"). */
export function nairaFromKobo(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}
