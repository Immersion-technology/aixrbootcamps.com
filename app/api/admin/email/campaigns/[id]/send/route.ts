import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { campaignSendSchema } from "@/lib/validations";
import { resolveSegment, getSegment, describeSegment } from "@/lib/email/segments";
import { enqueueCampaign, queueConfig, countSentToday } from "@/lib/email/queue";
import {
  requireAdmin,
  unauthorized,
  notFound,
  badRequest,
  conflict,
  zodMessage,
  parseBlocksOrError,
  isValidObjectId,
} from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";
// Resolving a segment + enqueueing can outrun the 10s default on a big list.
export const maxDuration = 60;

/**
 * Commit a campaign: resolve the audience, materialise the outbox, and either
 * start sending now or park it until `scheduledFor`.
 *
 * This is the one irreversible action in the feature, so it is the most guarded:
 *  - the campaign must still be editable (no double-sends)
 *  - the content must re-validate (someone may have edited a link since)
 *  - the recipient count must match what the UI showed the admin, or we stop —
 *    a stale browser tab must never blast a bigger list than was approved
 *  - the status flip is a conditional update, so two simultaneous clicks
 *    produce exactly one send
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  const body = await req.json().catch(() => ({}));
  const parsed = campaignSendSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  await connectDB();
  const campaign = await Campaign.findById(params.id);
  if (!campaign) return notFound();

  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    return conflict(`This campaign is already ${campaign.status}.`);
  }

  const segment = getSegment(campaign.segment?.source ?? "");
  if (!segment) return badRequest("Pick an audience before sending.");

  // Re-validate content at the last possible moment.
  const resolved = parseBlocksOrError(campaign.blocks);
  if (!resolved.ok) return badRequest(resolved.error, { issues: resolved.issues });

  const scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null;
  if (scheduledFor && scheduledFor.getTime() < Date.now() - 60_000) {
    return badRequest("That send time is in the past.");
  }

  let recipients;
  try {
    recipients = await resolveSegment(campaign.segment.source, campaign.segment.filters ?? {});
  } catch (e) {
    console.error("[campaign-send segment]", e);
    return badRequest("Couldn't work out who this should go to. Check the audience filters.");
  }

  if (recipients.length === 0) {
    return badRequest("That audience is empty — nobody would receive this.");
  }

  // The UI showed the admin a number; if reality has moved, make them look again.
  if (parsed.data.expectedRecipients !== recipients.length) {
    return conflict(
      `The audience changed — it's now ${recipients.length} ${
        recipients.length === 1 ? "recipient" : "recipients"
      }, not ${parsed.data.expectedRecipients}. Review and send again.`
    );
  }

  try {
    const enqueued = await enqueueCampaign(campaign._id, recipients);

    if (enqueued.queued === 0) {
      return badRequest("Everyone in that audience has unsubscribed — nothing to send.");
    }

    // Conditional flip: only a still-unsent campaign transitions, so two
    // concurrent requests can't both start it.
    const nextStatus = scheduledFor ? "scheduled" : "sending";
    const update = await Campaign.updateOne(
      { _id: campaign._id, status: { $in: ["draft", "scheduled"] } },
      {
        $set: {
          status: nextStatus,
          scheduledFor: scheduledFor ?? undefined,
          startedAt: scheduledFor ? undefined : new Date(),
          sentBy: admin.email,
          lastError: undefined,
        },
      }
    );
    if (update.modifiedCount !== 1) {
      return conflict("This campaign was already started somewhere else.");
    }

    const cfg = queueConfig();
    const sentToday = await countSentToday();
    const headroom = Math.max(0, cfg.dailyCap - sentToday);

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      queued: enqueued.queued,
      suppressed: enqueued.suppressed,
      segmentLabel: describeSegment(campaign.segment.source, campaign.segment.filters ?? {}),
      scheduledFor: scheduledFor?.toISOString() ?? null,
      // Surfaced so the UI can warn up front rather than looking stalled later.
      dailyCap: cfg.dailyCap,
      sentToday,
      willPauseAtCap: enqueued.queued > headroom,
    });
  } catch (e) {
    console.error("[campaign-send]", e);
    await Campaign.updateOne(
      { _id: campaign._id },
      { $set: { lastError: e instanceof Error ? e.message : "Failed to queue" } }
    );
    return NextResponse.json({ error: "Couldn't queue this campaign." }, { status: 500 });
  }
}
