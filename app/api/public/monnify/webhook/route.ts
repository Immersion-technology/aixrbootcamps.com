import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Payment } from "@/models/Payment";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { verifyWebhookSignature, getTransactionStatus } from "@/lib/monnify";
import { sendMail, parentConfirmationHtml, adminAlertHtml } from "@/lib/mailer";
import { buildReceiptPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

// Monnify signs the RAW request body as HMAC-SHA512(secretKey, rawBody) and
// sends the lowercase hex digest in the `monnify-signature` header. We must
// verify against the raw body, not the parsed JSON.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("monnify-signature");

  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event?.eventType as string | undefined;
  const eventData = event?.eventData ?? {};
  const paymentReference: string | undefined = eventData?.paymentReference;
  const transactionReference: string | undefined = eventData?.transactionReference;

  // Only SUCCESSFUL_TRANSACTION and FAILED_TRANSACTION carry a payment we act
  // on. Acknowledge anything else with 200 so Monnify doesn't retry.
  if (eventType !== "SUCCESSFUL_TRANSACTION" && eventType !== "FAILED_TRANSACTION") {
    return NextResponse.json({ ok: true, ignored: eventType });
  }
  if (!paymentReference) return NextResponse.json({ ok: true });

  try {
    await connectDB();

    // Idempotency: if we've already recorded a success for this reference, no-op.
    const existing = await Payment.findOne({ paymentReference, status: "success" }).lean();
    if (existing && eventType === "SUCCESSFUL_TRANSACTION") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const reg = await Registration.findOne({ paymentReference });
    if (!reg) return NextResponse.json({ ok: true, noMatch: true });

    if (eventType === "SUCCESSFUL_TRANSACTION") {
      // --- Reconcile against Monnify's status API (defense-in-depth) -------
      // The webhook body is signed, but the status query is the only place
      // that definitively reports amount, currency and final status.
      let verified;
      try {
        verified = await getTransactionStatus(transactionReference || paymentReference);
      } catch (err) {
        console.error("[monnify webhook] reconcile failed", err);
        // 500 so Monnify retries; don't drop a legit payment.
        return NextResponse.json({ error: "Could not reconcile with Monnify" }, { status: 500 });
      }

      if (verified.paymentStatus !== "PAID") {
        return NextResponse.json({ ok: true, ignored: "not_paid" });
      }
      if (verified.currency !== "NGN") {
        return NextResponse.json({ ok: true, ignored: "currency_mismatch" });
      }
      // Monnify reports amountPaid in naira; our pricing is stored in kobo.
      if (Math.round(verified.amountPaid * 100) !== reg.pricing.total) {
        console.warn(
          `[monnify webhook] amount mismatch ref=${paymentReference} ` +
            `expected=${reg.pricing.total}kobo got=${verified.amountPaid}naira`
        );
        return NextResponse.json({ ok: true, ignored: "amount_mismatch" });
      }

      // capacity check: if oversold, mark as overflow for manual review
      const capacity = await getSetting<number>(SETTING_KEYS.CAPACITY, 50);
      const paidCount = await Registration.countDocuments({ paymentStatus: "paid" });
      const overflow = paidCount >= capacity;

      reg.paymentStatus = "paid";
      reg.paidAt = new Date();
      reg.statusLog.push({
        action: overflow ? "paid_overflow" : "paid",
        by: "monnify",
        at: new Date(),
      });
      await reg.save();

      await Payment.create({
        registrationId: reg._id,
        paymentReference,
        transactionReference: verified.transactionReference || transactionReference,
        amount: reg.pricing.total,
        currency: "NGN",
        status: "success",
        channel: (eventData?.paymentMethod as string) ?? undefined,
        rawWebhookPayload: event,
      });

      // Fire confirmation emails (best-effort; failure shouldn't block the webhook)
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
          subject: `New registration: ${reg.participant.fullName} · ${reg.registrationId}${overflow ? " (OVERFLOW)" : ""}`,
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
        console.error("[monnify webhook mailer]", mailErr);
      }
    } else if (eventType === "FAILED_TRANSACTION") {
      reg.paymentStatus = "failed";
      reg.statusLog.push({ action: "payment_failed", by: "monnify", at: new Date() });
      await reg.save();
      await Payment.create({
        registrationId: reg._id,
        paymentReference,
        transactionReference,
        amount: reg.pricing.total,
        status: "failed",
        rawWebhookPayload: event,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[monnify webhook]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
