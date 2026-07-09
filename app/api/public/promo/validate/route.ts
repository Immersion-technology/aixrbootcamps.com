import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { validatePromo } from "@/lib/promo";
import { PRICING, bootCampFeeKobo, EARLY_BIRD_CUTOFF_DEFAULT, isEarlyBird } from "@/lib/pricing";
import { rateLimit, getClientIp } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(1),
  laptopRental: z.boolean().optional().default(false),
  roboticsElective: z.boolean().optional().default(false),
});

/**
 * Live promo-code preview for the registration form. Computes the order subtotal
 * server-side (from the env-configured prices + the current tier) so the client can't
 * inflate the discount base, then returns the discount + new total. This is a *preview*
 * only — the registration charge route re-validates authoritatively before charging.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`promo:${ip}`, 20, 60_000)) {
    return NextResponse.json({ valid: false, message: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Enter a promo code." }, { status: 400 });
  }

  try {
    await connectDB();
    const cutoff = await getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, EARLY_BIRD_CUTOFF_DEFAULT);
    const tier = isEarlyBird(cutoff) ? "early_bird" : "regular";
    const bootCampFee = bootCampFeeKobo(tier);
    const subtotal =
      bootCampFee +
      (parsed.data.laptopRental ? PRICING.laptop : 0) +
      (parsed.data.roboticsElective ? PRICING.robotics : 0);

    // Discount applies to the boot camp fee only; add-ons are never discounted.
    const result = await validatePromo(parsed.data.code, {
      bootCampFeeKobo: bootCampFee,
      orderSubtotalKobo: subtotal,
    });
    if (!result.ok) {
      // 200 with valid:false — an invalid code is an expected outcome, not an error.
      return NextResponse.json({ valid: false, message: result.message });
    }

    const label =
      result.promo!.discountType === "percent"
        ? `${result.promo!.discountValue}% off applied.`
        : "Discount applied.";

    return NextResponse.json({
      valid: true,
      code: result.promo!.code,
      subtotalKobo: subtotal,
      discountKobo: result.discount!.discountKobo,
      newTotalKobo: result.discount!.totalKobo,
      message: label,
    });
  } catch (e) {
    console.error("[POST /api/public/promo/validate]", e);
    return NextResponse.json({ valid: false, message: "Couldn't check that code. Try again." }, { status: 500 });
  }
}
