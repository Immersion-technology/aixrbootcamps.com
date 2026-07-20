import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Registration } from "@/models/Registration";
import { getAdminFromCookie } from "@/lib/auth";
import { formatNaira } from "@/lib/utils";
import { csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const filter: any = {};
  if (status) filter.status = status;

  await connectDB();
  const rows = await Payment.find(filter).sort({ receivedAt: -1 }).lean();

  const registrations = await Registration.find({
    _id: { $in: rows.map((r) => r.registrationId) },
  })
    .select("registrationId participant.fullName")
    .lean();
  const byId = new Map(registrations.map((r) => [String(r._id), r]));

  const csvRows = rows.map((r: any) => {
    const reg = byId.get(String(r.registrationId));
    return {
      "Registration ID": reg?.registrationId ?? "",
      "Participant": reg?.participant?.fullName ?? "",
      "Payment reference": r.paymentReference,
      "Transaction reference": r.transactionReference ?? "",
      "Amount (NGN)": formatNaira(r.amount),
      "Amount (kobo)": r.amount,
      "Currency": r.currency,
      "Status": r.status,
      "Channel": r.channel ?? "",
      "Received at": new Date(r.receivedAt).toISOString(),
    };
  });

  return csvResponse(csvRows, "immersia-payments");
}
