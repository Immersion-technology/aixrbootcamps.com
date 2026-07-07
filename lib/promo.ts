import { PromoCode, type IPromoCode } from "@/models/PromoCode";
import { applyPromo, type AppliedDiscount } from "@/lib/pricing";

export type PromoRejection =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "max_uses"
  | "min_subtotal";

export interface PromoResult {
  ok: boolean;
  promo?: IPromoCode;
  discount?: AppliedDiscount;
  reason?: PromoRejection;
  message?: string;
}

const MESSAGES: Record<PromoRejection, string> = {
  not_found: "That promo code isn't valid.",
  inactive: "That promo code is no longer active.",
  not_started: "That promo code isn't active yet.",
  expired: "That promo code has expired.",
  max_uses: "That promo code has reached its usage limit.",
  min_subtotal: "Your order doesn't meet the minimum for this code.",
};

/** Normalize a raw code to the canonical stored form (trimmed, uppercased). */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Authoritative promo validation. Looks up the normalized code and checks it is active,
 * within its start/expiry window, under its usage cap and above any minimum subtotal, then
 * computes the discount for the given order subtotal (kobo).
 *
 * Used by BOTH the public preview endpoint and the registration charge route — the client is
 * never trusted to compute or send a price. `now` is injectable for testing.
 */
export async function validatePromo(
  rawCode: string,
  subtotalKobo: number,
  now: Date = new Date()
): Promise<PromoResult> {
  const code = normalizeCode(rawCode);
  if (!code) return reject("not_found");

  const promo = await PromoCode.findOne({ code });
  if (!promo) return reject("not_found");
  if (!promo.active) return reject("inactive");
  if (promo.startsAt && now < promo.startsAt) return reject("not_started");
  if (promo.expiresAt && now > promo.expiresAt) return reject("expired");
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return reject("max_uses");
  if (promo.minSubtotalKobo && subtotalKobo < promo.minSubtotalKobo) return reject("min_subtotal");

  const discount = applyPromo(subtotalKobo, promo);
  return { ok: true, promo, discount };
}

function reject(reason: PromoRejection): PromoResult {
  return { ok: false, reason, message: MESSAGES[reason] };
}
