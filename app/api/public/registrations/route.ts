import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { nextSeq } from "@/models/Counter";
import { registrationCreateSchema } from "@/lib/validations";
import { initTransaction } from "@/lib/paystack";
import { normalizePhone, shortRegistrationId, rateLimit, getClientIp } from "@/lib/utils";
import { getClasses, onlineSlugs } from "@/lib/curriculum";
import { PRICING, bootCampFeeKobo, resolveTier } from "@/lib/pricing";
import { validatePromo } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`reg:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registrationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  try {
    await connectDB();

    // --- capacity check ---
    // Prices come from lib/pricing.ts (env-configurable, single source of truth).
    const [capacity, paidCount] = await Promise.all([
      getSetting<number>(SETTING_KEYS.CAPACITY, 50),
      Registration.countDocuments({ paymentStatus: "paid" }),
    ]);

    if (paidCount >= capacity) {
      return NextResponse.json({ error: "Camp is full. Please join the waitlist." }, { status: 409 });
    }

    // --- course set + pricing are chosen by attendance mode (server-authoritative) ---
    // Online is a flat-priced, fully-remote track: a fixed set of core classes, plus an OPTIONAL
    // Embedded Systems elective (the kit is shipped, so it costs more online than in-person and
    // there is no separate delivery fee). In-person keeps the full programme where every camper
    // attends every core class and the Robotics/Embedded elective is an opt-in paid add-on.
    const isOnline = data.attendanceMode === "online";
    const wantsElective = !!data.roboticsElective;

    // The Embedded/Robotics elective adds the robotics class to the enrolment on either track.
    const finalCourses = isOnline
      ? [...onlineSlugs(), ...(wantsElective ? ["robotics"] : [])]
      : getClasses()
          .filter((c) => !c.isElective || wantsElective)
          .map((c) => c.slug);

    // --- pricing (server-authoritative; the client never dictates the amount) ---
    const tier = resolveTier(data.attendanceMode);
    const bootCampFee = bootCampFeeKobo(tier);
    // Laptop rental is in-person only (zod also rejects it online). The elective is priced by
    // track: online is higher because its price is all-in (hardware kit + nationwide delivery).
    const laptopRentalFee = !isOnline && data.laptopRental ? PRICING.laptop : 0;
    const roboticsFee = wantsElective ? (isOnline ? PRICING.onlineEmbedded : PRICING.robotics) : 0;
    const subtotal = bootCampFee + laptopRentalFee + roboticsFee;

    // --- promo code (optional) — validated + applied here, never trusted from the client.
    // The discount applies to the boot camp fee only; add-ons are always charged in full.
    let discountKobo = 0;
    let appliedPromoCode: string | undefined;
    if (data.promoCode) {
      const promo = await validatePromo(data.promoCode, {
        bootCampFeeKobo: bootCampFee,
        orderSubtotalKobo: subtotal,
      });
      if (!promo.ok) {
        return NextResponse.json({ error: promo.message ?? "Invalid promo code" }, { status: 400 });
      }
      discountKobo = promo.discount!.discountKobo;
      appliedPromoCode = promo.promo!.code;
    }
    const total = subtotal - discountKobo;

    // --- sequential registration ID + payment reference ---
    const seq = await nextSeq("registration");
    const registrationId = shortRegistrationId(seq);
    const paymentReference = `${registrationId}-${Date.now()}`;

    const reg = await Registration.create({
      registrationId,
      participant: {
        ...data.participant,
        dateOfBirth: new Date(data.participant.dateOfBirth),
      },
      parent: {
        ...data.parent,
        phonePrimary: normalizePhone(data.parent.phonePrimary),
        phoneSecondary: data.parent.phoneSecondary ? normalizePhone(data.parent.phoneSecondary) : undefined,
      },
      emergencyContact: {
        ...data.emergencyContact,
        phone: normalizePhone(data.emergencyContact.phone),
      },
      medicalNotes: data.medicalNotes,
      attendanceMode: data.attendanceMode,
      cohort: data.cohort,
      courses: finalCourses,
      laptopRental: data.laptopRental,
      roboticsElective: data.roboticsElective,
      pricing: { tier, bootCampFee, laptopRentalFee, roboticsFee, subtotal, discountKobo, promoCode: appliedPromoCode, total },
      paymentStatus: "pending",
      admissionStatus: "pending",
      paymentReference,
      agreedToTerms: data.agreedToTerms,
      statusLog: [{ action: "created", by: "system", at: new Date() }],
    });

    // --- init Paystack ---
    const appUrl = process.env.APP_URL ?? `${req.nextUrl.origin}`;
    const initRes = await initTransaction({
      email: data.parent.email,
      amountKobo: total, // pricing is stored in kobo; Paystack also expects kobo
      reference: paymentReference,
      customerName: data.parent.fullName,
      callbackUrl: `${appUrl}/register/success`,
      metadata: { registrationId, participantName: data.participant.fullName },
    });

    return NextResponse.json({
      registrationId: reg.registrationId,
      authorizationUrl: initRes.authorizationUrl,
      reference: paymentReference,
    });
  } catch (e) {
    console.error("[POST /api/public/registrations]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Server error" }, { status: 500 });
  }
}
