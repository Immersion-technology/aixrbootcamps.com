import { connectDB } from "@/lib/db";
import { EmailTemplate } from "@/models/EmailTemplate";
import { EmailSuppression } from "@/models/EmailSuppression";
import { MERGE_FIELDS } from "@/lib/email/merge";
import EmailNav from "../EmailNav";
import TemplateManager, { type TemplateRow } from "./TemplateManager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await connectDB();

  const [templates, suppressionCount] = await Promise.all([
    EmailTemplate.find({ archivedAt: { $exists: false } }).sort({ updatedAt: -1 }).lean(),
    EmailSuppression.countDocuments(),
  ]);

  const rows: TemplateRow[] = templates.map((t: any) => ({
    id: String(t._id),
    name: t.name,
    description: t.description ?? "",
    subject: t.subject,
    preheader: t.preheader ?? "",
    blocks: (t.blocks ?? []) as TemplateRow["blocks"],
    blockCount: Array.isArray(t.blocks) ? t.blocks.length : 0,
    updatedAt: new Date(t.updatedAt).toISOString(),
  }));

  return (
    <div className="p-6 sm:p-10 lg:p-12">
      <div className="mb-7">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">Campaigns</div>
        <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
          Templates
        </h1>
        <p className="text-[13.5px] text-neutral-600 mt-3 max-w-[560px] leading-relaxed">
          Reusable starting points for campaigns. Creating a campaign copies the template, so editing one here
          never changes an email that has already gone out.
        </p>
      </div>

      <EmailNav active="templates" suppressionCount={suppressionCount} />

      <TemplateManager
        initial={rows}
        mergeFields={MERGE_FIELDS.map((f) => ({ key: f.key, label: f.label, description: f.description }))}
      />
    </div>
  );
}
