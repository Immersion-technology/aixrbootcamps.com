import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const sp = req.nextUrl.searchParams;

  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Number(sp.get("pageSize") ?? 25));

  const filter: Record<string, unknown> = {};
  if (sp.get("payment")) filter.paymentStatus = sp.get("payment");
  if (sp.get("admission")) filter.admissionStatus = sp.get("admission");
  if (sp.get("laptop") === "yes") filter.laptopRental = true;
  if (sp.get("laptop") === "no") filter.laptopRental = false;
  if (sp.get("course")) filter.courses = sp.get("course");
  const q = sp.get("q")?.trim();
  if (q) {
    Object.assign(filter, {
      $or: [
        { registrationId: new RegExp(q, "i") },
        { "participant.fullName": new RegExp(q, "i") },
        { "parent.fullName": new RegExp(q, "i") },
        { "parent.email": new RegExp(q, "i") },
        { "parent.phonePrimary": new RegExp(q, "i") },
      ],
    });
  }

  const [rows, total] = await Promise.all([
    Registration.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Registration.countDocuments(filter),
  ]);

  return NextResponse.json({
    rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
