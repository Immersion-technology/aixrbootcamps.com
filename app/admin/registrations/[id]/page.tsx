import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { Payment } from "@/models/Payment";
import { calcAge, formatNaira } from "@/lib/utils";
import DetailActions from "./DetailActions";

export const dynamic = "force-dynamic";

export default async function RegistrationDetail({ params }: { params: { id: string } }) {
  await connectDB();
  const reg = await Registration.findOne({ registrationId: params.id }).lean<any>();
  if (!reg) notFound();

  const payments = await Payment.find({ registrationId: reg._id }).sort({ receivedAt: -1 }).lean();

  return (
    <div className="p-6 sm:p-10 lg:p-12 max-w-6xl">
      <Link href="/admin/registrations" className="text-[12px] text-neutral-500 hover:text-violet-brand transition">
        ← All registrations
      </Link>

      <div className="flex items-end justify-between mt-3 mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Camper</div>
          <h1 className="font-display font-extrabold uppercase text-[clamp(26px,3vw,36px)] leading-[.95] tracking-tight">
            {reg.participant.fullName}
          </h1>
          <p className="text-[12px] text-neutral-500 font-mono mt-2">{reg.registrationId}</p>
        </div>
        <div className="flex gap-2">
          <Pill v={reg.paymentStatus} />
          <Pill v={reg.admissionStatus} />
        </div>
      </div>

      <DetailActions
        registrationId={reg.registrationId}
        currentStatus={reg.admissionStatus}
        paymentStatus={reg.paymentStatus}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Camper">
          <Row k="Full name" v={reg.participant.fullName} />
          <Row k="DOB" v={`${new Date(reg.participant.dateOfBirth).toLocaleDateString("en-NG")} (age ${calcAge(reg.participant.dateOfBirth)})`} />
          <Row k="Gender" v={reg.participant.gender} />
          <Row k="School" v={reg.participant.school} />
          <Row k="Class" v={reg.participant.classGrade || "—"} />
          <Row k="T-shirt" v={reg.participant.tshirtSize} />
        </Card>

        <Card title="Parent / Guardian">
          <Row k="Name" v={reg.parent.fullName} />
          <Row k="Relationship" v={reg.parent.relationship} />
          <Row k="Phone" v={reg.parent.phonePrimary} />
          {reg.parent.phoneSecondary && <Row k="Secondary phone" v={reg.parent.phoneSecondary} />}
          <Row k="Email" v={reg.parent.email} />
          <Row k="Address" v={reg.parent.address} />
        </Card>

        <Card title="Emergency contact">
          <Row k="Name" v={reg.emergencyContact.fullName} />
          <Row k="Phone" v={reg.emergencyContact.phone} />
          <Row k="Relationship" v={reg.emergencyContact.relationship} />
        </Card>

        <Card title="Medical / notes">
          <p className="text-[13px] text-neutral-700 leading-relaxed">{reg.medicalNotes || "—"}</p>
        </Card>

        <Card title="Courses" wide>
          <ul className="grid grid-cols-2 gap-1.5 text-[13px]">
            {reg.courses.map((c: string) => (
              <li key={c} className="flex items-center gap-2">
                <span className="text-violet-brand">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-black/5 text-[13px]">
            Laptop rental: <strong>{reg.laptopRental ? "Yes" : "No"}</strong>
          </div>
        </Card>

        <Card title="Pricing" tone="violet">
          <Row k="Tier" v={reg.pricing.tier} />
          <Row k="Boot camp fee" v={formatNaira(reg.pricing.bootCampFee)} />
          <Row k="Laptop rental" v={formatNaira(reg.pricing.laptopRentalFee)} />
          <Row k="Total" v={<strong>{formatNaira(reg.pricing.total)}</strong>} />
          <Row k="Paystack ref" v={<span className="font-mono text-[11px] break-all">{reg.paystackReference}</span>} />
          {reg.paidAt && <Row k="Paid at" v={new Date(reg.paidAt).toLocaleString("en-NG")} />}
        </Card>

        <Card title="Payment history" wide>
          {payments.length === 0 ? (
            <p className="text-[13px] text-neutral-500">No payment events recorded.</p>
          ) : (
            <ul className="text-[13px] divide-y divide-black/5">
              {payments.map((p: any) => (
                <li key={String(p._id)} className="py-2.5 flex justify-between items-center">
                  <span className="font-medium">
                    <span className="font-accent uppercase text-[10.5px] tracking-wider mr-2 text-violet-brand">{p.status}</span>
                    {p.channel ?? "—"}
                  </span>
                  <span className="text-[11.5px] text-neutral-500">{new Date(p.receivedAt).toLocaleString("en-NG")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status log" wide>
          <ul className="text-[13px] divide-y divide-black/5">
            {reg.statusLog.map((l: any, i: number) => (
              <li key={i} className="py-2.5 flex justify-between gap-3 items-start">
                <span className="min-w-0">
                  <strong>{l.action}</strong>
                  <span className="text-neutral-500"> by {l.by}</span>
                  {l.note && <span className="block text-[12px] text-neutral-600 mt-0.5">{l.note}</span>}
                </span>
                <span className="text-[11.5px] text-neutral-500 whitespace-nowrap shrink-0">
                  {new Date(l.at).toLocaleString("en-NG")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title, children, wide, tone,
}: { title: string; children: React.ReactNode; wide?: boolean; tone?: "violet" }) {
  const isViolet = tone === "violet";
  return (
    <div className={`${isViolet ? "frosted-glass-violet" : "bg-white border border-black/[.06]"} rounded-2xl p-5 sm:p-6 ${wide ? "md:col-span-2" : ""}`}>
      <div className={`text-[10.5px] font-bold tracking-[.2em] uppercase mb-3 ${isViolet ? "text-white/75" : "text-violet-brand"}`}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-[13px] border-b border-current/5 last:border-0">
      <span className="opacity-70 shrink-0">{k}</span>
      <span className="text-right break-words min-w-0">{v}</span>
    </div>
  );
}

function Pill({ v }: { v: string }) {
  const map: Record<string, string> = {
    paid: "bg-mint-soft text-ink",
    pending: "bg-yellow-soft text-ink",
    failed: "bg-pink-soft text-ink",
    abandoned: "bg-neutral-200 text-neutral-700",
    refunded: "bg-neutral-200 text-neutral-700",
    admitted: "bg-mint-soft text-ink",
    rejected: "bg-pink-soft text-ink",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-[.18em] uppercase ${map[v] ?? "bg-neutral-100 text-neutral-700"}`}>
      {v}
    </span>
  );
}
