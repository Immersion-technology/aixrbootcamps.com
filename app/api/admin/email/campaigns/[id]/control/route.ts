import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailMessage } from "@/models/EmailMessage";
import { syncStats } from "@/lib/email/queue";
import {
  requireAdmin,
  unauthorized,
  notFound,
  badRequest,
  conflict,
  zodMessage,
  isValidObjectId,
} from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["pause", "resume", "cancel"]) });

/**
 * The operator kill-switch for a campaign mid-flight.
 *
 * Every drain re-reads the campaign status before doing any work, so flipping
 * to `paused`/`cancelled` here stops the send at the next message boundary —
 * without ever interrupting a message that's already in the air.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  await connectDB();
  const campaign = await Campaign.findById(params.id);
  if (!campaign) return notFound();

  const { action } = parsed.data;

  if (action === "pause") {
    if (campaign.status !== "sending") return conflict(`Can't pause a ${campaign.status} campaign.`);
    await Campaign.updateOne({ _id: campaign._id, status: "sending" }, { $set: { status: "paused" } });
  }

  if (action === "resume") {
    if (campaign.status !== "paused") return conflict(`Can't resume a ${campaign.status} campaign.`);
    // Clear any leases so paused-mid-send messages are immediately claimable.
    await EmailMessage.updateMany(
      { campaignId: campaign._id, status: "sending" },
      { $set: { status: "queued", lockedUntil: new Date(0) } }
    );
    await Campaign.updateOne({ _id: campaign._id, status: "paused" }, { $set: { status: "sending" } });
  }

  if (action === "cancel") {
    if (!["sending", "paused", "scheduled"].includes(campaign.status)) {
      return conflict(`Can't cancel a ${campaign.status} campaign.`);
    }
    // Drop everything not yet sent. Already-delivered messages stay as the
    // permanent record of who did receive it.
    await EmailMessage.deleteMany({
      campaignId: campaign._id,
      status: { $in: ["queued", "sending"] },
    });
    await Campaign.updateOne(
      { _id: campaign._id },
      { $set: { status: "cancelled", completedAt: new Date() } }
    );
  }

  const stats = await syncStats(campaign._id);
  const updated = await Campaign.findById(campaign._id).select("status").lean<any>();

  return NextResponse.json({ ok: true, status: updated?.status, stats });
}
