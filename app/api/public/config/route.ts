import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const [capacity, paid, earlyBirdCutoff, earlyBirdPrice, regularPrice, laptopPrice, roboticsPrice, campStart, campEnd] =
      await Promise.all([
        getSetting<number>(SETTING_KEYS.CAPACITY, 50),
        Registration.countDocuments({ paymentStatus: "paid" }),
        getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, "2026-06-30T23:59:59.000Z"),
        getSetting<number>(SETTING_KEYS.EARLY_BIRD_PRICE, 15000000),
        getSetting<number>(SETTING_KEYS.REGULAR_PRICE, 20000000),
        getSetting<number>(SETTING_KEYS.LAPTOP_RENTAL_PRICE, 2000000),
        getSetting<number>(SETTING_KEYS.ROBOTICS_ELECTIVE_PRICE, 2500000),
        getSetting<string>(SETTING_KEYS.CAMP_START_DATE, "2026-07-27"),
        getSetting<string>(SETTING_KEYS.CAMP_END_DATE, "2026-09-04"),
      ]);

    return NextResponse.json({
      slotsTotal: capacity,
      slotsPaid: paid,
      slotsLeft: Math.max(0, capacity - paid),
      isClosed: paid >= capacity,
      isEarlyBird: new Date() < new Date(earlyBirdCutoff),
      earlyBirdCutoff,
      earlyBirdPrice,
      regularPrice,
      laptopPrice,
      roboticsPrice,
      campStart,
      campEnd,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
