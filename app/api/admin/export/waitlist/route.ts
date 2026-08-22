import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Waitlist } from "@/models/Waitlist";
import { getAdminFromCookie } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { exportDateClause } from "@/lib/date-range";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const joinedBetween = exportDateClause(req.nextUrl.searchParams);
  const rows = await Waitlist.find(joinedBetween ? { createdAt: joinedBetween } : {})
    .sort({ createdAt: -1 })
    .lean();

  const csvRows = rows.map((r: any) => ({
    "Parent": r.parentName,
    "Camper": r.participantName,
    "Email": r.email,
    "Phone": r.phone,
    "Added": new Date(r.createdAt).toISOString(),
  }));

  return csvResponse(csvRows, "immersia-waitlist");
}
