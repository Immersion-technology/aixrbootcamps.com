import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Payment } from "@/models/Payment";
import { ParentAccount } from "@/models/ParentAccount";
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
  // Paid = admitted (admin can reject/refund as an override).
  reg.admissionStatus = "admitted";
  reg.statusLog.push({
    action: "manual_payment",
    by: admin.email,
    at: new Date(),
    note: "Manually marked as paid (bank transfer)",
  });
  reg.statusLog.push({ action: "admission_admitted", by: "system", at: new Date() });
  await reg.save();

  // Auto-provision the parent's portal account (passwordless login). Idempotent.
  await ParentAccount.updateOne(
    { email: reg.parent.email },
    {
      $setOnInsert: {
        email: reg.parent.email,
        name: reg.parent.fullName,
        phone: reg.parent.phonePrimary,
      },
    },
    { upsert: true }
  );

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
