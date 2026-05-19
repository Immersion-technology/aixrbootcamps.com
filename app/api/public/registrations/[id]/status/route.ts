import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

export const dynamic = "force-dynamic";

// The :id param is the Paystack reference (returned by the redirect),
// not the registrationId. We look up both for convenience.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const ref = decodeURIComponent(params.id);

  const reg = await Registration.findOne({
    $or: [{ paystackReference: ref }, { registrationId: ref }],
  })
    .select("registrationId paymentStatus admissionStatus")
    .lean();

  if (!reg) return NextResponse.json({ paymentStatus: "unknown" }, { status: 404 });

  return NextResponse.json({
    registrationId: reg.registrationId,
    paymentStatus: reg.paymentStatus,
    admissionStatus: reg.admissionStatus,
  });
}
