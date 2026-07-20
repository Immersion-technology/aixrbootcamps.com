import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { PRICING } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    // Prices come from lib/pricing.ts (env). Capacity and dates stay admin-editable.
    const [capacity, paid, campStart, campEnd] = await Promise.all([
      getSetting<number>(SETTING_KEYS.CAPACITY, 50),
      Registration.countDocuments({ paymentStatus: "paid" }),
      getSetting<string>(SETTING_KEYS.CAMP_START_DATE, "2026-07-27"),
      getSetting<string>(SETTING_KEYS.CAMP_END_DATE, "2026-09-04"),
    ]);

    return NextResponse.json({
      slotsTotal: capacity,
      slotsPaid: paid,
      slotsLeft: Math.max(0, capacity - paid),
      isClosed: paid >= capacity,
      regularPrice: PRICING.regular,
      onlinePrice: PRICING.online,
      onlineEmbeddedPrice: PRICING.onlineEmbedded,
      laptopPrice: PRICING.laptop,
      roboticsPrice: PRICING.robotics,
      campStart,
      campEnd,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
