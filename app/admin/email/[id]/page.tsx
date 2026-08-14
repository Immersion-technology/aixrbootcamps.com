import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { SEGMENTS } from "@/lib/email/segments";
import { MERGE_FIELDS } from "@/lib/email/merge";
import { COHORTS } from "@/lib/cohorts";
import { CURRICULUM } from "@/lib/curriculum";
import CampaignComposer, { type CampaignData } from "./CampaignComposer";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: { id: string } }) {
  if (!Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const c = await Campaign.findById(params.id).lean<any>();
  if (!c) notFound();

  const initial: CampaignData = {
    id: String(c._id),
    name: c.name,
    subject: c.subject,
    preheader: c.preheader ?? "",
    blocks: (c.blocks ?? []) as CampaignData["blocks"],
    replyTo: c.replyTo ?? "",
    segment: {
      source: c.segment?.source ?? "paid_registrations",
      filters: c.segment?.filters ?? {},
    },
    status: c.status,
    scheduledFor: c.scheduledFor ? new Date(c.scheduledFor).toISOString() : null,
    trackOpens: !!c.trackOpens,
    stats: c.stats ?? { total: 0, sent: 0, failed: 0, suppressed: 0, opened: 0 },
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <Link
        href="/admin/email"
        className="text-[12px] font-semibold text-neutral-500 hover:text-violet-brand transition inline-block mb-5"
      >
        ← All campaigns
      </Link>

      <CampaignComposer
        initial={initial}
        segments={SEGMENTS.map((s) => ({
          key: s.key,
          label: s.label,
          description: s.description,
          supportsFilters: s.supportsFilters,
        }))}
        cohorts={COHORTS.map((x) => ({ id: x.id, label: `${x.label} · ${x.range}` }))}
        courses={CURRICULUM.map((x) => x.name)}
        mergeFields={MERGE_FIELDS.map((f) => ({ key: f.key, label: f.label, description: f.description }))}
      />
    </div>
  );
}
