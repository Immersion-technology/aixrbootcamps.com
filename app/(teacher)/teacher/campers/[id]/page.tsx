import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Types } from "mongoose";
import { getTeacherFromCookie } from "@/lib/teacher-auth";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { calcAge } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Read-only safety card for facilitators: who the camper is, allergies/medical
// notes, and who to call in an emergency. No edit controls, no payment data.
export default async function TeacherCamperPage({ params }: { params: { id: string } }) {
  const teacher = await getTeacherFromCookie();
  if (!teacher) redirect("/teacher/login");

  if (!Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const reg = await Registration.findOne({
    _id: params.id,
    paymentStatus: "paid",
    admissionStatus: "admitted",
  }).lean();
  if (!reg) notFound();

  const age = calcAge(reg.participant.dateOfBirth);

  return (
    <section className="px-5 sm:px-7 py-12">
      <div className="max-w-[760px] mx-auto">
        <Link href="/teacher" className="text-[12.5px] font-semibold text-neutral-600 hover:text-ink transition inline-flex items-center gap-1.5 mb-6">
          <span aria-hidden>←</span> Back to roster
        </Link>

        <div className="frosted-glass rounded-3xl p-6 sm:p-8 mb-6">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-aqua-deep uppercase mb-2">
            {reg.registrationId}
          </div>
          <h1 className="font-bubble text-[clamp(30px,4.2vw,46px)] leading-[1.02] tracking-tight text-ink mb-2">
            {reg.participant.fullName}
          </h1>
          <p className="text-[13.5px] text-neutral-700">
            Age {age} · {reg.participant.gender} · {reg.participant.tshirtSize} t-shirt · {reg.participant.school}
          </p>
        </div>

        {/* MEDICAL — most safety-critical, lead with it */}
        <div className={`rounded-3xl p-5 sm:p-6 mb-6 border ${reg.medicalNotes?.trim() ? "bg-rose-50 border-rose-200" : "bg-white border-black/[.05]"}`}>
          <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-rose-700 mb-2">
            🩺 Medical notes & allergies
          </div>
          {reg.medicalNotes?.trim() ? (
            <p className="text-[14px] text-ink leading-relaxed font-medium">{reg.medicalNotes}</p>
          ) : (
            <p className="text-[13px] text-neutral-500 italic">None disclosed by the guardian.</p>
          )}
        </div>

        {/* EMERGENCY CONTACT */}
        <div className="bg-white border border-black/[.05] rounded-3xl p-5 sm:p-6">
          <div className="text-[10.5px] font-bold tracking-[.22em] uppercase text-neutral-500 mb-3">
            Emergency contact
          </div>
          <div className="space-y-1.5">
            <Row k="Name" v={reg.emergencyContact.fullName} />
            <Row k="Relationship" v={reg.emergencyContact.relationship} />
            <Row k="Phone" v={reg.emergencyContact.phone} href={`tel:${reg.emergencyContact.phone}`} />
          </div>
          <div className="mt-4 pt-4 border-t border-black/[.06] space-y-1.5">
            <div className="text-[10.5px] font-bold tracking-[.18em] uppercase text-neutral-500 mb-1">Guardian</div>
            <Row k="Name" v={reg.parent.fullName} />
            <Row k="Phone" v={reg.parent.phonePrimary} href={`tel:${reg.parent.phonePrimary}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-neutral-500">{k}</span>
      {href ? (
        <a href={href} className="font-semibold text-aqua-deep text-right hover:underline">{v}</a>
      ) : (
        <span className="font-semibold text-ink text-right">{v}</span>
      )}
    </div>
  );
}
