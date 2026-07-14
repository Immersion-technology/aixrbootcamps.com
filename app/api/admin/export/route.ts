import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getAdminFromCookie } from "@/lib/auth";
import { calcAge, formatNaira } from "@/lib/utils";
import { cohortLabel } from "@/lib/cohorts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const filter: any = {};
  if (sp.get("payment")) filter.paymentStatus = sp.get("payment");
  if (sp.get("admission")) filter.admissionStatus = sp.get("admission");
  if (sp.get("laptop") === "yes") filter.laptopRental = true;
  if (sp.get("laptop") === "no") filter.laptopRental = false;
  if (sp.get("course")) filter.courses = sp.get("course");

  await connectDB();
  const rows = await Registration.find(filter).sort({ createdAt: -1 }).lean();

  const csvRows = rows.map((r: any) => ({
    "Registration ID": r.registrationId,
    "Participant": r.participant.fullName,
    "DOB": new Date(r.participant.dateOfBirth).toISOString().slice(0, 10),
    "Age": calcAge(r.participant.dateOfBirth),
    "Gender": r.participant.gender,
    "School": r.participant.school,
    "Class": r.participant.classGrade ?? "",
    "T-shirt": r.participant.tshirtSize,
    "Parent": r.parent.fullName,
    "Relationship": r.parent.relationship,
    "Parent phone": r.parent.phonePrimary,
    "Parent phone 2": r.parent.phoneSecondary ?? "",
    "Parent email": r.parent.email,
    "Address": r.parent.address,
    "Emergency name": r.emergencyContact.fullName,
    "Emergency phone": r.emergencyContact.phone,
    "Emergency relationship": r.emergencyContact.relationship,
    "Medical notes": r.medicalNotes ?? "",
    "Courses": (r.courses ?? []).join("; "),
    "Attendance mode": r.attendanceMode === "online" ? "Online" : "In-person",
    "Cohort": r.cohort ? cohortLabel(r.cohort) : "",
    "Robotics elective": r.roboticsElective ? "Yes" : "No",
    "Laptop rental": r.laptopRental ? "Yes" : "No",
    "Pricing tier": r.pricing.tier,
    "Promo code": r.pricing.promoCode ?? "",
    "Discount (NGN)": r.pricing.discountKobo ? formatNaira(r.pricing.discountKobo) : "",
    "Total (NGN)": formatNaira(r.pricing.total),
    "Total (kobo)": r.pricing.total,
    "Payment status": r.paymentStatus,
    "Admission status": r.admissionStatus,
    "Payment ref": r.paymentReference,
    "Paid at": r.paidAt ? new Date(r.paidAt).toISOString() : "",
    "Registered at": new Date(r.createdAt).toISOString(),
  }));

  const csv = Papa.unparse(csvRows);
  const filename = `immersia-registrations-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
