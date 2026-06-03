import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Payment } from "@/models/Payment";
import { getAdminFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const reg = await Registration.findOne({ registrationId: params.id });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (reg.paymentStatus === "paid") {
    return NextResponse.json({ error: "Already marked as paid" }, { status: 409 });
  }

  reg.paymentStatus = "paid";
  reg.paidAt = new Date();
  reg.statusLog.push({
    action: "manual_payment",
    by: admin.email,
    at: new Date(),
    note: "Manually marked as paid (bank transfer)",
  });
  await reg.save();

  await Payment.create({
    registrationId: reg._id,
    paymentReference: reg.paymentReference,
    amount: reg.pricing.total,
    currency: "NGN",
    status: "manual",
    channel: "bank_transfer",
    rawWebhookPayload: { manualBy: admin.email, manualAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
