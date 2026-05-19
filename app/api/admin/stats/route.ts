import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();

  const [total, paid, admitted, rejected, capacity, revenueAgg] = await Promise.all([
    Registration.countDocuments({}),
    Registration.countDocuments({ paymentStatus: "paid" }),
    Registration.countDocuments({ admissionStatus: "admitted" }),
    Registration.countDocuments({ admissionStatus: "rejected" }),
    getSetting<number>(SETTING_KEYS.CAPACITY, 50),
    Registration.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, sum: { $sum: "$pricing.total" } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.sum ?? 0;
  const recent = await Registration.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .select("registrationId participant.fullName paymentStatus admissionStatus createdAt pricing.total")
    .lean();

  return NextResponse.json({
    total,
    paid,
    admitted,
    rejected,
    capacity,
    slotsLeft: Math.max(0, capacity - paid),
    revenueKobo: revenue,
    recent,
  });
}
