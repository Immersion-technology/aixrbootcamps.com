import { NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { Registration } from "@/models/Registration";
import { getTeacherFromCookie } from "@/lib/teacher-auth";

const schema = z.object({
  registrationId: z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid registration id"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  status: z.enum(["present", "absent", "late", "excused"]),
  note: z.string().trim().max(280).optional(),
});

// Teachers write into the SAME Attendance store admins use (one row per camper
// per day). Re-verify the session here — middleware is optimistic only.
export async function POST(req: Request) {
  const teacher = await getTeacherFromCookie();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    await connectDB();
    const dayUTC = new Date(`${parsed.data.date}T00:00:00.000Z`);

    // Only admitted, paid campers are on the roster.
    const reg = await Registration.findOne({
      _id: parsed.data.registrationId,
      paymentStatus: "paid",
      admissionStatus: "admitted",
    }).lean();
    if (!reg) return NextResponse.json({ error: "Camper not on the roster" }, { status: 404 });

    const updated = await Attendance.findOneAndUpdate(
      { registrationId: reg._id, date: dayUTC },
      {
        $set: {
          status: parsed.data.status,
          note: parsed.data.note ?? null,
          recordedBy: teacher.name,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ ok: true, attendance: updated });
  } catch (e) {
    console.error("[teacher-attendance]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
