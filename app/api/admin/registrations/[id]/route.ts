import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Payment } from "@/models/Payment";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const reg = await Registration.findOne({ registrationId: params.id }).lean<any>();
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const payments = await Payment.find({ registrationId: reg._id }).sort({ receivedAt: -1 }).lean();
  return NextResponse.json({ registration: reg, payments });
}
