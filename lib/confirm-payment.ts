import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Payment } from "@/models/Payment";
import { ParentAccount } from "@/models/ParentAccount";
import { PromoCode } from "@/models/PromoCode";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { verifyTransaction } from "@/lib/paystack";
import { sendMail, parentConfirmationHtml, adminAlertHtml } from "@/lib/mailer";
import { buildReceiptPdf } from "@/lib/pdf";

export type ReconcileResult =
  | { status: "paid"; registrationId: string; alreadyPaid: boolean }
  | { status: "ignored"; reason: string }
  | { status: "no_match" };

/**
 * The single, idempotent "this payment is real → admit the camper" path.
 *
 * Verifies the reference against Paystack's source-of-truth verify endpoint
 * (defense-in-depth: the webhook body is signed, but only verify authoritatively
 * reports amount/currency/status), then marks the registration paid, provisions
 * the parent's portal account, records a Payment row, and fires the confirmation
 * + admin emails. Safe to call from both the webhook and the success-page redirect
 * — concurrent/duplicate calls collapse to a single confirmation.
 *
 * `rawPayload` is stored on the Payment record for audit (the webhook event, or a
 * marker object for the redirect path). `by` labels the status-log entry.
 */
export async function reconcileAndConfirm(
  reference: string,
  opts: { rawPayload?: unknown; by?: string } = {}
): Promise<ReconcileResult> {
  const by = opts.by ?? "paystack";
  await connectDB();

  // Idempotency: if we've already recorded a success for this reference, no-op.
  const existing = await Payment.findOne({ paymentReference: reference, status: "success" }).lean();
  if (existing) {
    const reg = await Registration.findOne({ paymentReference: reference }).lean();
    return { status: "paid", registrationId: reg?.registrationId ?? "", alreadyPaid: true };
  }

  const reg = await Registration.findOne({ paymentReference: reference });
  if (!reg) return { status: "no_match" };

  // --- Reconcile against Paystack's verify endpoint (source of truth) -------
  const verified = await verifyTransaction(reference);

  if (verified.status !== "success") return { status: "ignored", reason: "not_paid" };
  if (verified.currency !== "NGN") return { status: "ignored", reason: "currency_mismatch" };
  // Paystack reports amount in kobo, exactly how we store pricing — compare directly.
  if (verified.amount !== reg.pricing.total) {
    console.warn(
      `[confirm-payment] amount mismatch ref=${reference} ` +
        `expected=${reg.pricing.total}kobo got=${verified.amount}kobo`
    );
    return { status: "ignored", reason: "amount_mismatch" };
  }

  // Capacity check: if oversold, mark as overflow for manual review.
  const capacity = await getSetting<number>(SETTING_KEYS.CAPACITY, 50);
  const paidCount = await Registration.countDocuments({ paymentStatus: "paid" });
  const overflow = paidCount >= capacity;

  reg.paymentStatus = "paid";
  reg.paidAt = new Date();
  // Paid = admitted (admin can reject/refund as an override).
  reg.admissionStatus = "admitted";
  reg.statusLog.push({ action: overflow ? "paid_overflow" : "paid", by, at: new Date() });
  reg.statusLog.push({ action: "admission_admitted", by: "system", at: new Date() });
  await reg.save();

  // Auto-provision the parent's portal account (passwordless login).
  // Idempotent: one account per email, reused across multiple children.
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
    paymentReference: reference,
    transactionReference: verified.reference,
    amount: reg.pricing.total,
    currency: "NGN",
    status: "success",
    channel: verified.channel || undefined,
    rawWebhookPayload: opts.rawPayload as Record<string, unknown> | undefined,
  });

  // Count a confirmed use of the promo code. This runs only on the once-only success path
  // (reconcile no-ops when a Payment already exists), so a code is incremented exactly once
  // per paid registration. Best-effort: a promo-count failure must not block confirmation.
  if (reg.pricing.promoCode) {
    try {
      await PromoCode.updateOne({ code: reg.pricing.promoCode }, { $inc: { usedCount: 1 } });
    } catch (promoErr) {
      console.error("[confirm-payment promo-count]", promoErr);
    }
  }

  // Fire confirmation emails (best-effort; failure shouldn't block confirmation).
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
      roboticsElective: reg.roboticsElective,
      bootCampFeeKobo: reg.pricing.bootCampFee,
      laptopRentalKobo: reg.pricing.laptopRentalFee,
      roboticsFeeKobo: reg.pricing.roboticsFee,
      deliveryFeeKobo: reg.pricing.deliveryFee ?? 0,
      attendanceMode: reg.attendanceMode,
      discountKobo: reg.pricing.discountKobo ?? 0,
      promoCode: reg.pricing.promoCode,
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
        roboticsElective: reg.roboticsElective,
        attendanceMode: reg.attendanceMode,
        deliveryFeeKobo: reg.pricing.deliveryFee ?? 0,
        discountKobo: reg.pricing.discountKobo ?? 0,
        promoCode: reg.pricing.promoCode,
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
        parentEmail: reg.parent.email,
        parentPhone: reg.parent.phonePrimary,
        totalKobo: reg.pricing.total,
        appUrl,
      }),
    });
  } catch (mailErr) {
    console.error("[confirm-payment mailer]", mailErr);
  }

  return { status: "paid", registrationId: reg.registrationId, alreadyPaid: false };
}
