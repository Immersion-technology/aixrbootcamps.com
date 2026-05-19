export default function ExportPage() {
  return (
    <div className="p-6 sm:p-10 lg:p-12 max-w-3xl">
      <div className="mb-9">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">CSV download</div>
        <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
          Export
        </h1>
        <p className="text-[13.5px] text-neutral-600 mt-3 max-w-[520px]">
          Download every registration as a CSV. Apply filters by appending query params (e.g. <code className="frosted-glass rounded px-1.5 py-0.5 text-[11.5px] font-mono">?payment=paid</code>).
        </p>
      </div>

      <div className="frosted-glass rounded-3xl p-5 sm:p-7 space-y-6">
        {/* Primary download */}
        <div>
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-3">Everything</div>
          <a href="/api/admin/export?format=csv" className="btn-dark inline-flex">
            Download all as CSV <span>→</span>
          </a>
          <p className="text-[11.5px] text-neutral-500 mt-2.5">Opens cleanly in Excel, Google Sheets, Numbers.</p>
        </div>

        <div className="border-t border-black/5 pt-6">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-3">Filtered exports</div>
          <div className="flex flex-wrap gap-2.5">
            <Chip href="/api/admin/export?format=csv&payment=paid">Paid only</Chip>
            <Chip href="/api/admin/export?format=csv&payment=pending">Pending payment</Chip>
            <Chip href="/api/admin/export?format=csv&admission=admitted">Admitted only</Chip>
            <Chip href="/api/admin/export?format=csv&admission=rejected">Rejected only</Chip>
            <Chip href="/api/admin/export?format=csv&laptop=yes">Laptop renters</Chip>
          </div>
        </div>

        <div className="border-t border-black/5 pt-6">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-2">What&apos;s included</div>
          <p className="text-[12.5px] text-neutral-700 leading-relaxed">
            Camper full name, DOB, age, gender, school, t-shirt size · parent name, email, both phone numbers, address, relationship · emergency contact · medical notes · selected courses · laptop rental flag · pricing tier + amount · payment + admission status · paid timestamp · Paystack reference · created timestamp.
          </p>
        </div>
      </div>
    </div>
  );
}

function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="frosted-glass-dark rounded-full px-4 py-2 text-[11.5px] font-bold tracking-wider uppercase hover:bg-violet-brand transition"
    >
      {children}
    </a>
  );
}
