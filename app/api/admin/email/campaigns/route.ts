import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailTemplate } from "@/models/EmailTemplate";
import { campaignCreateSchema } from "@/lib/validations";
import { starterBlocks } from "@/lib/email/blocks";
import { describeSegment, getSegment, SEGMENTS } from "@/lib/email/segments";
import {
  requireAdmin,
  unauthorized,
  badRequest,
  zodMessage,
  parseBlocksOrError,
  isValidObjectId,
} from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  await connectDB();
  const campaigns = await Campaign.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .select("name subject status segment stats scheduledFor startedAt completedAt createdBy createdAt")
    .lean();

  return NextResponse.json({
    campaigns: campaigns.map((c: any) => ({
      id: String(c._id),
      name: c.name,
      subject: c.subject,
      status: c.status,
      segmentLabel: describeSegment(c.segment?.source ?? "", c.segment?.filters ?? {}),
      stats: c.stats ?? { total: 0, sent: 0, failed: 0, suppressed: 0, opened: 0 },
      scheduledFor: c.scheduledFor ?? null,
      startedAt: c.startedAt ?? null,
      completedAt: c.completedAt ?? null,
      createdBy: c.createdBy,
      createdAt: c.createdAt,
    })),
    segments: SEGMENTS.map((s) => ({
      key: s.key,
      label: s.label,
      description: s.description,
      supportsFilters: s.supportsFilters,
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  const { name, subject, preheader, blocks, templateId, segment } = parsed.data;

  if (segment && !getSegment(segment.source)) {
    return badRequest(`Unknown audience "${segment.source}"`);
  }

  try {
    await connectDB();

    // Starting from a template COPIES its content — later edits to the template
    // must never rewrite a campaign that has already gone out.
    let sourceBlocks: unknown = blocks;
    let sourceSubject = subject;
    let sourcePreheader = preheader;

    if (templateId) {
      if (!isValidObjectId(templateId)) return badRequest("Invalid template id");
      const template = await EmailTemplate.findById(templateId).lean<any>();
      if (!template) return badRequest("That template no longer exists");
      sourceBlocks = sourceBlocks ?? template.blocks;
      sourceSubject = subject || template.subject;
      sourcePreheader = preheader || template.preheader;
    }

    const resolved = parseBlocksOrError(sourceBlocks ?? starterBlocks());
    if (!resolved.ok) return badRequest(resolved.error, { issues: resolved.issues });

    const campaign = await Campaign.create({
      name,
      subject: sourceSubject,
      preheader: sourcePreheader ?? "",
      blocks: resolved.blocks,
      segment: segment ?? { source: "paid_registrations", filters: {} },
      status: "draft",
      trackOpens: false,
      stats: { total: 0, sent: 0, failed: 0, suppressed: 0, opened: 0 },
      createdBy: admin.email,
      templateId: templateId && isValidObjectId(templateId) ? templateId : undefined,
    });

    return NextResponse.json({ ok: true, id: String(campaign._id) });
  } catch (e) {
    console.error("[campaign-create]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
