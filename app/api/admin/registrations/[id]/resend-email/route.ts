import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getAdminFromCookie } from "@/lib/auth";
import { sendMail, parentConfirmationHtml } from "@/lib/mailer";
import { buildReceiptPdf } from "@/lib/pdf";
import { getSetting, SETTING_KEYS } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const reg = await Registration.findOne({ registrationId: params.id });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reg.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Cannot resend, not paid." }, { status: 409 });
  }

  const campStart = await getSetting<string>(SETTING_KEYS.CAMP_START_DATE, "2026-07-27");
  const pdf = await buildReceiptPdf({
    registrationId: reg.registrationId,
    parentName: reg.parent.fullName,
    participantName: reg.participant.fullName,
    courses: reg.courses,
    laptopRental: reg.laptopRental,
    roboticsElective: reg.roboticsElective,
    bootCampFeeKobo: reg.pricing.bootCampFee,
    laptopRentalKobo: reg.pricing.laptopRentalFee,
    roboticsFeeKobo: reg.pricing.roboticsFee,
    totalKobo: reg.pricing.total,
    paidAt: reg.paidAt ?? new Date(),
  });

  await sendMail({
    to: reg.parent.email,
    subject: "Your IMMERSIA registration confirmation (resent)",
    html: parentConfirmationHtml({
      parentName: reg.parent.fullName,
      participantName: reg.participant.fullName,
      registrationId: reg.registrationId,
      courses: reg.courses,
      laptopRental: reg.laptopRental,
      roboticsElective: reg.roboticsElective,
      totalKobo: reg.pricing.total,
      campStart,
    }),
    attachments: [{ filename: `${reg.registrationId}.pdf`, content: pdf, contentType: "application/pdf" }],
  });

  reg.statusLog.push({ action: "email_resent", by: admin.email, at: new Date() });
  await reg.save();

  return NextResponse.json({ ok: true });
}
