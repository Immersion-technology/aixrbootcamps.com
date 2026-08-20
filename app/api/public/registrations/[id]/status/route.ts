import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

export const dynamic = "force-dynamic";

// The :id param is the payment reference (returned by the redirect),
// not the registrationId. We look up both for convenience.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const ref = decodeURIComponent(params.id);

  const reg = await Registration.findOne({
    $or: [{ paymentReference: ref }, { registrationId: ref }],
  })
    .select("registrationId paymentStatus admissionStatus pricing.total")
    .lean();

  if (!reg) return NextResponse.json({ paymentStatus: "unknown" }, { status: 404 });

  return NextResponse.json({
    registrationId: reg.registrationId,
    paymentStatus: reg.paymentStatus,
    admissionStatus: reg.admissionStatus,
    // The confirmed amount rides along with the confirmed status so the
    // client can report a Purchase conversion with a real value. Both come
    // from the same read, so they can never describe different moments.
    //
    // Only ever sent once paid: a pending or failed reference must not be
    // usable to probe what someone was quoted.
    ...(reg.paymentStatus === "paid"
      ? { amountKobo: reg.pricing?.total, currency: "NGN" }
      : {}),
  });
}
