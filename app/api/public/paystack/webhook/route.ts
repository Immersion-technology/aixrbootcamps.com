import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Payment } from "@/models/Payment";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { verifyWebhookSignature } from "@/lib/paystack";
import { sendMail, parentConfirmationHtml, adminAlertHtml } from "@/lib/mailer";
import { buildReceiptPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

// Paystack sends webhook events with X-Paystack-Signature.
// We must verify against the RAW request body, not the parsed JSON.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event?.event as string | undefined;
  const data = event?.data ?? {};
  const reference: string | undefined = data?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  try {
    await connectDB();

    // Idempotency — if we've already recorded a success for this reference, no-op.
    const existing = await Payment.findOne({ paystackReference: reference, status: "success" }).lean();
    if (existing && eventType === "charge.success") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const reg = await Registration.findOne({ paystackReference: reference });
    if (!reg) return NextResponse.json({ ok: true, noMatch: true });

    if (eventType === "charge.success") {
      // capacity check — if oversold, mark as overflow for manual review
      const capacity = await getSetting<number>(SETTING_KEYS.CAPACITY, 50);
      const paidCount = await Registration.countDocuments({ paymentStatus: "paid" });
      const overflow = paidCount >= capacity;

      reg.paymentStatus = "paid";
      reg.paidAt = new Date();
      reg.statusLog.push({
        action: overflow ? "paid_overflow" : "paid",
        by: "paystack",
        at: new Date(),
      });
      await reg.save();

      await Payment.create({
        registrationId: reg._id,
        paystackReference: reference,
        amount: data.amount ?? reg.pricing.total,
        currency: data.currency ?? "NGN",
        status: "success",
        channel: data.channel,
        rawWebhookPayload: event,
      });

      // Fire confirmation emails (best-effort — failure shouldn't block the webhook)
      try {
        const campStart = await getSetting<string>(SETTING_KEYS.CAMP_START_DATE, "2026-07-27");
        const adminEmail = await getSetting<string>(
          SETTING_KEYS.ADMIN_ALERT_EMAIL,
          process.env.ADMIN_ALERT_EMAIL ?? "registrations@immersia.ng"
        );

        const pdf = await buildReceiptPdf({
          registrationId: reg.registrationId,
          parentName: reg.parent.fullName,
          participantName: reg.participant.fullName,
          courses: reg.courses,
          laptopRental: reg.laptopRental,
          bootCampFeeKobo: reg.pricing.bootCampFee,
          laptopRentalKobo: reg.pricing.laptopRentalFee,
          totalKobo: reg.pricing.total,
          paidAt: reg.paidAt!,
        });

        await sendMail({
          to: reg.parent.email,
          subject: "You're in! IMMERSIA Summer Tech Boot Camp registration confirmed",
          html: parentConfirmationHtml({
            parentName: reg.parent.fullName,
            participantName: reg.participant.fullName,
            registrationId: reg.registrationId,
            courses: reg.courses,
            laptopRental: reg.laptopRental,
            totalKobo: reg.pricing.total,
            campStart,
          }),
          attachments: [{ filename: `${reg.registrationId}.pdf`, content: pdf, contentType: "application/pdf" }],
        });

        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        await sendMail({
          to: adminEmail,
          subject: `New registration: ${reg.participant.fullName} — ${reg.registrationId}${overflow ? " (OVERFLOW)" : ""}`,
          html: adminAlertHtml({
            participantName: reg.participant.fullName,
            registrationId: reg.registrationId,
            parentName: reg.parent.fullName,
            parentPhone: reg.parent.phonePrimary,
            totalKobo: reg.pricing.total,
            appUrl,
          }),
        });
      } catch (mailErr) {
        console.error("[webhook mailer]", mailErr);
      }
    } else if (eventType === "charge.failed") {
      reg.paymentStatus = "failed";
      reg.statusLog.push({ action: "payment_failed", by: "paystack", at: new Date() });
      await reg.save();
      await Payment.create({
        registrationId: reg._id,
        paystackReference: reference,
        amount: data.amount ?? 0,
        status: "failed",
        rawWebhookPayload: event,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[paystack webhook]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
