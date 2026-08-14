import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailMessage } from "@/models/EmailMessage";
import { campaignUpdateSchema } from "@/lib/validations";
import { describeSegment, getSegment } from "@/lib/email/segments";
import {
  requireAdmin,
  unauthorized,
  notFound,
  badRequest,
  conflict,
  zodMessage,
  parseBlocksOrError,
  assertEditable,
  isValidObjectId,
} from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  await connectDB();
  const c = await Campaign.findById(params.id).lean<any>();
  if (!c) return notFound();

  return NextResponse.json({
    campaign: {
      id: String(c._id),
      name: c.name,
      subject: c.subject,
      preheader: c.preheader ?? "",
      blocks: c.blocks ?? [],
      replyTo: c.replyTo ?? "",
      segment: c.segment ?? { source: "paid_registrations", filters: {} },
      segmentLabel: describeSegment(c.segment?.source ?? "", c.segment?.filters ?? {}),
      status: c.status,
      scheduledFor: c.scheduledFor ?? null,
      startedAt: c.startedAt ?? null,
      completedAt: c.completedAt ?? null,
      stats: c.stats ?? { total: 0, sent: 0, failed: 0, suppressed: 0, opened: 0 },
      trackOpens: !!c.trackOpens,
      createdBy: c.createdBy,
      sentBy: c.sentBy ?? null,
      lastError: c.lastError ?? null,
      createdAt: c.createdAt,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  const body = await req.json().catch(() => ({}));
  const parsed = campaignUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  await connectDB();
  const campaign = await Campaign.findById(params.id);
  if (!campaign) return notFound();

  const locked = assertEditable(campaign.status);
  if (locked) return locked;

  const { name, subject, preheader, blocks, replyTo, trackOpens, segment } = parsed.data;

  if (segment) {
    if (!getSegment(segment.source)) return badRequest(`Unknown audience "${segment.source}"`);
    campaign.segment = { source: segment.source, filters: segment.filters ?? {} };
  }
  if (blocks !== undefined) {
    const resolved = parseBlocksOrError(blocks);
    if (!resolved.ok) return badRequest(resolved.error, { issues: resolved.issues });
    // `blocks` is a Mixed path — assign a fresh array so mongoose sees the change.
    campaign.blocks = resolved.blocks;
    campaign.markModified("blocks");
  }
  if (name !== undefined) campaign.name = name;
  if (subject !== undefined) campaign.subject = subject;
  if (preheader !== undefined) campaign.preheader = preheader;
  if (replyTo !== undefined) campaign.replyTo = replyTo || undefined;
  if (trackOpens !== undefined) campaign.trackOpens = trackOpens;

  await campaign.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  await connectDB();
  const campaign = await Campaign.findById(params.id).lean<any>();
  if (!campaign) return notFound();

  // A campaign mid-flight has messages in the queue; stop it before deleting so
  // a drain already in progress can't resurrect rows for a deleted campaign.
  if (campaign.status === "sending") {
    return conflict("Pause or cancel this campaign before deleting it.");
  }

  await EmailMessage.deleteMany({ campaignId: campaign._id });
  await Campaign.deleteOne({ _id: campaign._id });

  return NextResponse.json({ ok: true });
}
