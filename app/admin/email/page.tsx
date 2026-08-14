import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailTemplate } from "@/models/EmailTemplate";
import { EmailSuppression } from "@/models/EmailSuppression";
import { describeSegment } from "@/lib/email/segments";
import { queueConfig, countSentToday } from "@/lib/email/queue";
import CampaignList, { type CampaignRow, type TemplateRow } from "./CampaignList";
import EmailNav from "./EmailNav";

export const dynamic = "force-dynamic";

export default async function EmailPage() {
  await connectDB();

  const [campaigns, templates, suppressionCount, sentToday] = await Promise.all([
    Campaign.find().sort({ createdAt: -1 }).limit(200).lean(),
    EmailTemplate.find({ archivedAt: { $exists: false } }).sort({ updatedAt: -1 }).lean(),
    EmailSuppression.countDocuments(),
    countSentToday(),
  ]);

  const cfg = queueConfig();

  const rows: CampaignRow[] = campaigns.map((c: any) => ({
    id: String(c._id),
    name: c.name,
    subject: c.subject,
    status: c.status,
    segmentLabel: describeSegment(c.segment?.source ?? "", c.segment?.filters ?? {}),
    stats: c.stats ?? { total: 0, sent: 0, failed: 0, suppressed: 0, opened: 0 },
    scheduledFor: c.scheduledFor ? new Date(c.scheduledFor).toISOString() : null,
    completedAt: c.completedAt ? new Date(c.completedAt).toISOString() : null,
    createdBy: c.createdBy,
    createdAt: new Date(c.createdAt).toISOString(),
  }));

  const templateRows: TemplateRow[] = templates.map((t: any) => ({
    id: String(t._id),
    name: t.name,
    description: t.description ?? "",
    subject: t.subject,
    blockCount: Array.isArray(t.blocks) ? t.blocks.length : 0,
  }));

  const remaining = Math.max(0, cfg.dailyCap - sentToday);

  return (
    <div className="p-6 sm:p-10 lg:p-12">
      <div className="mb-7">
        <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-1.5">
          Campaigns
        </div>
        <h1 className="font-display font-extrabold uppercase text-[clamp(28px,3.4vw,40px)] leading-[.95] tracking-tight">
          Emails
        </h1>
        <p className="text-[13.5px] text-neutral-600 mt-3 max-w-[560px] leading-relaxed">
          Write an email once, send it to the right group. Everyone can unsubscribe with one tap, and anyone
          who does is skipped automatically — receipts and login links always still go through.
        </p>
      </div>

      <EmailNav active="campaigns" suppressionCount={suppressionCount} />

      <div className="frosted-glass rounded-2xl px-5 py-3.5 mb-5 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[12.5px]">
        <span className="text-neutral-600">
          <strong className="font-semibold text-neutral-900 tabular-nums">{sentToday}</strong> of {cfg.dailyCap}{" "}
          campaign emails sent today
        </span>
        <span className="text-neutral-500">
          {remaining} left before sending pauses until tomorrow
        </span>
      </div>

      <CampaignList initial={rows} templates={templateRows} />
    </div>
  );
}
