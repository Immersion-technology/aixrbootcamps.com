import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Waitlist } from "@/models/Waitlist";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { getAdminFromCookie } from "@/lib/auth";
import { formatNaira } from "@/lib/utils";
import { csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const [total, paid, pending, admitted, rejected, capacity, revenueAgg, waitlisted] = await Promise.all([
    Registration.countDocuments({}),
    Registration.countDocuments({ paymentStatus: "paid" }),
    Registration.countDocuments({ paymentStatus: "pending" }),
    Registration.countDocuments({ admissionStatus: "admitted" }),
    Registration.countDocuments({ admissionStatus: "rejected" }),
    getSetting<number>(SETTING_KEYS.CAPACITY, 50),
    Registration.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, sum: { $sum: "$pricing.total" } } },
    ]),
    Waitlist.countDocuments({}),
  ]);

  const revenueKobo = revenueAgg[0]?.sum ?? 0;

  const csvRows = [
    {
      "Snapshot taken": new Date().toISOString(),
      "Total registrations": total,
      "Paid": paid,
      "Pending payment": pending,
      "Admitted": admitted,
      "Rejected": rejected,
      "Capacity": capacity,
      "Slots remaining": Math.max(0, capacity - paid),
      "Revenue collected (NGN)": formatNaira(revenueKobo),
      "Revenue collected (kobo)": revenueKobo,
      "Waitlist size": waitlisted,
    },
  ];

  return csvResponse(csvRows, "immersia-stats-snapshot");
}
