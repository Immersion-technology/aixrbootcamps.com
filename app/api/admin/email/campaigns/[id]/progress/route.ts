import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailMessage } from "@/models/EmailMessage";
import { queueConfig, countSentToday } from "@/lib/email/queue";
import { requireAdmin, unauthorized, notFound, isValidObjectId } from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

/**
 * Live counters for the sending view. Deliberately read-only and cheap — it's
 * polled every couple of seconds, and a poll must never cause a send.
 * Counts come from the outbox, not the cached campaign stats, so the number on
 * screen is always the truth.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  await connectDB();
  const campaign = await Campaign.findById(params.id).select("status stats completedAt").lean<any>();
  if (!campaign) return notFound();

  const rows = await EmailMessage.aggregate<{ _id: string; n: number }>([
    { $match: { campaignId: campaign._id } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r.n]));

  const sent = by.sent ?? 0;
  const failed = by.failed ?? 0;
  const suppressed = by.suppressed ?? 0;
  const remaining = (by.queued ?? 0) + (by.sending ?? 0);
  const total = sent + failed + suppressed + remaining;

  const cfg = queueConfig();
  const sentToday = await countSentToday();

  return NextResponse.json({
    status: campaign.status,
    total,
    sent,
    failed,
    suppressed,
    remaining,
    completedAt: campaign.completedAt ?? null,
    dailyCap: cfg.dailyCap,
    sentToday,
    /** True when the cap — not a fault — is why this campaign has stalled. */
    atDailyCap: remaining > 0 && sentToday >= cfg.dailyCap,
  });
}
