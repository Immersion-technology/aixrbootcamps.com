import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { calcAge, formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  payment?: string;
  admission?: string;
  course?: string;
  laptop?: string;
  page?: string;
}

export default async function RegistrationsList({ searchParams }: { searchParams: SearchParams }) {
  await connectDB();

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 25;
  const filter: any = {};

  if (searchParams.payment) filter.paymentStatus = searchParams.payment;
  if (searchParams.admission) filter.admissionStatus = searchParams.admission;
  if (searchParams.laptop === "yes") filter.laptopRental = true;
  if (searchParams.laptop === "no") filter.laptopRental = false;
  if (searchParams.course) filter.courses = searchParams.course;
  if (searchParams.q) {
    const q = searchParams.q.trim();
    filter.$or = [
      { registrationId: new RegExp(q, "i") },
      { "participant.fullName": new RegExp(q, "i") },
      { "parent.fullName": new RegExp(q, "i") },
      { "parent.email": new RegExp(q, "i") },
      { "parent.phonePrimary": new RegExp(q, "i") },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    Registration.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Registration.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="p-6 sm:p-10 lg:p-12">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Registry</div>
          <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
            Registrations
          </h1>
        </div>
        <span className="frosted-glass rounded-full px-3.5 py-1.5 text-[10.5px] font-bold tracking-[.18em] uppercase">
          {totalCount} total
        </span>
      </div>

      {/* Filters */}
      <form className="frosted-glass rounded-2xl p-4 mb-6">
        <div className="grid md:grid-cols-5 gap-3">
          <input name="q" placeholder="Search name, ID, email, phone…" defaultValue={searchParams.q ?? ""} className="input md:col-span-2 !text-[13px]" />
          <select name="payment" defaultValue={searchParams.payment ?? ""} className="input !text-[13px]">
            <option value="">All payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="abandoned">Abandoned</option>
          </select>
          <select name="admission" defaultValue={searchParams.admission ?? ""} className="input !text-[13px]">
            <option value="">All admission</option>
            <option value="pending">Pending</option>
            <option value="admitted">Admitted</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-dark justify-center !text-[12px] !py-2.5">Filter</button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-black/[.06] overflow-hidden overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-cream text-[10.5px] uppercase tracking-[.18em] text-neutral-600">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Age</th>
              <th className="text-left p-3">Parent</th>
              <th className="text-left p-3">Laptop</th>
              <th className="text-left p-3">Paid</th>
              <th className="text-left p-3">Payment</th>
              <th className="text-left p-3">Admission</th>
              <th className="text-left p-3">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-[13px] text-neutral-500 text-center">No registrations match your filters.</td></tr>
            )}
            {rows.map((r: any) => (
              <tr key={r.registrationId} className="hover:bg-cream/50 transition">
                <td className="p-3 font-mono text-[11.5px]">
                  <Link href={`/admin/registrations/${r.registrationId}`} className="hover:text-violet-brand transition">
                    {r.registrationId}
                  </Link>
                </td>
                <td className="p-3 font-medium">{r.participant.fullName}</td>
                <td className="p-3">{calcAge(r.participant.dateOfBirth)}</td>
                <td className="p-3">
                  <div className="font-medium">{r.parent.fullName}</div>
                  <div className="text-[11px] text-neutral-500">{r.parent.phonePrimary}</div>
                </td>
                <td className="p-3">{r.laptopRental ? "Yes" : "—"}</td>
                <td className="p-3 font-mono text-[12px]">{r.paymentStatus === "paid" ? formatNaira(r.pricing.total) : "—"}</td>
                <td className="p-3"><Pill v={r.paymentStatus} /></td>
                <td className="p-3"><Pill v={r.admissionStatus} /></td>
                <td className="p-3 text-[11px] text-neutral-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-7 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(searchParams as Record<string, string>);
            params.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/admin/registrations?${params.toString()}`}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition ${
                  p === page
                    ? "bg-ink text-white"
                    : "frosted-glass hover:bg-violet-brand/10 hover:text-violet-brand"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
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
    <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-[.16em] uppercase ${map[v] ?? "bg-neutral-100 text-neutral-700"}`}>
      {v}
    </span>
  );
}
