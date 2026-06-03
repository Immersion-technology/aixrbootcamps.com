import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { getAdminFromCookie } from "@/lib/auth";
import { statusUpdateSchema } from "@/lib/validations";
import { sendMail, admissionRejectedHtml } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectDB();
  const reg = await Registration.findOne({ registrationId: params.id });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wasRejected = reg.admissionStatus !== "rejected" && parsed.data.status === "rejected";

  reg.admissionStatus = parsed.data.status;
  reg.statusLog.push({
    action: `admission_${parsed.data.status}`,
    by: admin.email,
    at: new Date(),
    note: parsed.data.note,
  });
  await reg.save();

  // Notify the parent on a (new) rejection. Best-effort — don't block the response.
  if (wasRejected) {
    try {
      await sendMail({
        to: reg.parent.email,
        subject: "Update on your IMMERSIA Summer Tech Boot Camp registration",
        html: admissionRejectedHtml({
          parentName: reg.parent.fullName,
          participantName: reg.participant.fullName,
          note: parsed.data.note || undefined,
        }),
      });
    } catch (mailErr) {
      console.error("[admission reject mail]", mailErr);
    }
  }

  return NextResponse.json({ ok: true, admissionStatus: reg.admissionStatus });
}
