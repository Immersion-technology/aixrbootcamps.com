import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getSetting, SETTING_KEYS } from "@/models/Setting";
import { nextSeq } from "@/models/Counter";
import { registrationCreateSchema } from "@/lib/validations";
import { initTransaction } from "@/lib/paystack";
import { normalizePhone, shortRegistrationId, rateLimit, getClientIp } from "@/lib/utils";
import { getClasses } from "@/lib/curriculum";

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

    // Pricing is forced here (₦100k early-bird / ₦150k regular / +₦20k laptop) so
    // we charge the right amount even if the DB Settings collection holds stale
    // values left over from earlier seeds. Update both here AND on the register
    // page if pricing ever changes again.
    const earlyBirdPrice = 15000000;
    const regularPrice = 20000000;
    const laptopPrice = 2000000;
    const roboticsPrice = 2500000; // +₦25,000 elective — Arduino board, servos/motors and consumables the camper keeps

    // --- capacity check ---
    const [capacity, paidCount, earlyBirdCutoff] = await Promise.all([
      getSetting<number>(SETTING_KEYS.CAPACITY, 50),
      Registration.countDocuments({ paymentStatus: "paid" }),
      getSetting<string>(SETTING_KEYS.EARLY_BIRD_CUTOFF, "2026-06-30T23:59:59.000Z"),
    ]);

    if (paidCount >= capacity) {
      return NextResponse.json({ error: "Camp is full. Please join the waitlist." }, { status: 409 });
    }

    // Every camper attends every core class. Robotics is an opt-in paid elective,
    // so it's only added to the enrollment when the parent ticked it.
    const finalCourses = getClasses()
      .filter((c) => !c.isElective || data.roboticsElective)
      .map((c) => c.slug);

    // --- pricing ---
    const tier = new Date() < new Date(earlyBirdCutoff) ? "early_bird" : "regular";
    const bootCampFee = tier === "early_bird" ? earlyBirdPrice : regularPrice;
    const laptopRentalFee = data.laptopRental ? laptopPrice : 0;
    const roboticsFee = data.roboticsElective ? roboticsPrice : 0;
    const total = bootCampFee + laptopRentalFee + roboticsFee;

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
      courses: finalCourses,
      laptopRental: data.laptopRental,
      roboticsElective: data.roboticsElective,
      pricing: { tier, bootCampFee, laptopRentalFee, roboticsFee, total },
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
