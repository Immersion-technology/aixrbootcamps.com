import { connectDB } from "@/lib/db";
import { EmailSuppression } from "@/models/EmailSuppression";
import EmailNav from "../EmailNav";
import SuppressionManager, { type SuppressionRow } from "./SuppressionManager";

export const dynamic = "force-dynamic";

export default async function SuppressionsPage() {
  await connectDB();
  const docs = await EmailSuppression.find().sort({ createdAt: -1 }).limit(2000).lean();

  const rows: SuppressionRow[] = docs.map((r: any) => ({
    id: String(r._id),
    email: r.email,
    reason: r.reason,
    source: r.source ?? "",
    note: r.note ?? "",
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  return (
    <div className="p-6 sm:p-10 lg:p-12">
      <div className="mb-7">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Campaigns</div>
        <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
          Unsubscribed
        </h1>
        <p className="text-[13.5px] text-neutral-600 mt-3 max-w-[600px] leading-relaxed">
          Everyone here is skipped by every campaign, automatically. Addresses land here when someone taps
          unsubscribe, when a mailbox bounces as non-existent, or when you add one by hand. They still receive
          payment receipts, portal login links and safety notices — those aren&apos;t marketing.
        </p>
      </div>

      <EmailNav active="suppressions" suppressionCount={rows.length} />

      <SuppressionManager initial={rows} />
    </div>
  );
}
