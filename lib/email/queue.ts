/**
 * The campaign send queue.
 *
 * Design constraints this exists to satisfy:
 *  - Vercel functions are short-lived (10s default, ~60s ceiling on Hobby), so a
 *    campaign can NOT be one long loop. Work is claimed in small batches and the
 *    caller re-invokes until the queue is empty.
 *  - Gmail SMTP caps at ~500 recipients/day and defers when pushed, so sends are
 *    throttled and a hard daily cap stops us before the provider does.
 *  - Any request can be retried or run twice (webhooks, double-clicks, an
 *    overlapping cron), so every step is idempotent.
 *
 * Two invariants carry the correctness of the whole feature:
 *   1. A message is claimed by exactly one worker — an atomic findOneAndUpdate
 *      flips it to `sending` and stamps a lease. Expired leases are reclaimed by
 *      the same query, so a worker dying mid-send is self-healing.
 *   2. Suppression is checked TWICE: at enqueue, and again immediately before
 *      the send. Someone who unsubscribes while a campaign is draining must not
 *      receive the rest of it.
 */
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Campaign, type ICampaign } from "@/models/Campaign";
import { EmailMessage } from "@/models/EmailMessage";
import { EmailSuppression, suppress, suppressedSet } from "@/models/EmailSuppression";
import { renderCampaignHtml, renderCampaignText, type Blocks } from "./blocks";
import { applyMergePlain, type MergeData } from "./merge";
import { unsubscribeUrl, unsubscribeHeaders, openPixelUrl } from "./unsubscribe";
import { getTransport, classifyError } from "./transport";
import { assertSendableBaseUrl } from "./base-url";
import type { Recipient } from "./segments";

// ----------------------------------------------------------------- config ---

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(raw)));
}

export function queueConfig() {
  return {
    /** Messages per minute. Conservative by default — Gmail defers if pushed. */
    ratePerMin: intFromEnv("MAIL_RATE_PER_MIN", 20, 1, 600),
    /**
     * Campaign sends allowed per calendar day. Default 300 deliberately leaves
     * ~200 of Gmail's 500/day for transactional mail (receipts, login links),
     * which must never be starved by a broadcast.
     */
    dailyCap: intFromEnv("MAIL_DAILY_CAMPAIGN_CAP", 300, 1, 100_000),
    /** Max messages one drain call will attempt. */
    batchSize: intFromEnv("MAIL_DRAIN_BATCH", 25, 1, 500),
    /** Wall-clock budget for one drain, kept under the function timeout. */
    timeBudgetMs: intFromEnv("MAIL_DRAIN_BUDGET_MS", 45_000, 1_000, 280_000),
    /** Attempts before a transient failure is given up on. */
    maxAttempts: intFromEnv("MAIL_MAX_ATTEMPTS", 3, 1, 10),
    /** How long a claimed message stays leased to one worker. */
    leaseMs: intFromEnv("MAIL_LEASE_MS", 120_000, 10_000, 900_000),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Campaign sends completed since midnight, across all campaigns. */
export async function countSentToday(): Promise<number> {
  await connectDB();
  return EmailMessage.countDocuments({ status: "sent", sentAt: { $gte: startOfToday() } });
}

// --------------------------------------------------------------- enqueue ----

export interface EnqueueResult {
  queued: number;
  suppressed: number;
  duplicates: number;
}

/**
 * Materialise a campaign's recipient list into the outbox.
 *
 * Idempotent by construction: the unique (campaignId, email) index rejects
 * repeats, and `ordered: false` lets the rest of the batch land regardless. So
 * calling this twice for the same campaign enqueues nothing the second time.
 */
export async function enqueueCampaign(
  campaignId: Types.ObjectId | string,
  recipients: Recipient[]
): Promise<EnqueueResult> {
  await connectDB();
  const id = new Types.ObjectId(String(campaignId));

  const blocked = await suppressedSet(recipients.map((r) => r.email));
  const allowed = recipients.filter((r) => !blocked.has(r.email.toLowerCase().trim()));

  let duplicates = 0;
  if (allowed.length > 0) {
    const docs = allowed.map((r) => ({
      campaignId: id,
      email: r.email.toLowerCase().trim(),
      name: r.name,
      mergeData: r.mergeData,
      status: "queued" as const,
      attempts: 0,
      nextAttemptAt: new Date(),
      lockedUntil: new Date(0),
      openCount: 0,
    }));

    try {
      await EmailMessage.insertMany(docs, { ordered: false });
    } catch (err) {
      // E11000 on a subset is expected on a re-run — every non-duplicate still
      // inserted. Anything else is a real failure and must surface.
      const e = err as { code?: number; writeErrors?: unknown[] };
      const writeErrors = (e?.writeErrors ?? []) as Array<{ err?: { code?: number }; code?: number }>;
      const allDuplicates =
        e?.code === 11000 || (writeErrors.length > 0 && writeErrors.every((w) => (w.err?.code ?? w.code) === 11000));
      if (!allDuplicates) throw err;
      duplicates = writeErrors.length || 1;
    }
  }

  // Recount from the outbox rather than trusting the arithmetic above.
  const queued = await EmailMessage.countDocuments({ campaignId: id });

  await Campaign.updateOne(
    { _id: id },
    { $set: { "stats.total": queued, "stats.suppressed": blocked.size } }
  );

  return { queued, suppressed: blocked.size, duplicates };
}

// ----------------------------------------------------------------- claim ----

/**
 * Atomically take ownership of one ready message.
 *
 * The query also matches `sending` rows whose lease has expired, so a message
 * orphaned by a crashed or timed-out worker is picked back up automatically —
 * no separate reaper needed.
 */
async function claimNext(campaignId: Types.ObjectId, leaseMs: number) {
  const now = new Date();
  return EmailMessage.findOneAndUpdate(
    {
      campaignId,
      status: { $in: ["queued", "sending"] },
      nextAttemptAt: { $lte: now },
      lockedUntil: { $lt: now },
    },
    {
      $set: { status: "sending", lockedUntil: new Date(now.getTime() + leaseMs) },
      $inc: { attempts: 1 },
    },
    { new: true, sort: { nextAttemptAt: 1, _id: 1 } }
  );
}

/** Exponential backoff, capped at 30 minutes. */
function backoffMs(attempts: number): number {
  return Math.min(30 * 60_000, 60_000 * Math.pow(2, Math.max(0, attempts - 1)));
}

// ----------------------------------------------------------------- drain ----

export interface DrainResult {
  campaignId: string;
  sent: number;
  failed: number;
  suppressed: number;
  /** Messages still awaiting a send after this pass. */
  remaining: number;
  /** True when the daily cap stopped this drain early. */
  cappedByDailyLimit: boolean;
  /** True when the caller should invoke drain again. */
  shouldContinue: boolean;
  status: ICampaign["status"];
}

/**
 * Send as much of one campaign as fits in the time budget, then return.
 * The caller (the drain route, or the cron sweep) re-invokes while
 * `shouldContinue` is true.
 */
export async function drainCampaign(
  campaignId: Types.ObjectId | string,
  opts: { baseUrl: string } & Partial<ReturnType<typeof queueConfig>>
): Promise<DrainResult> {
  await connectDB();
  const cfg = { ...queueConfig(), ...opts };
  const id = new Types.ObjectId(String(campaignId));
  const startedAt = Date.now();

  const campaign = await Campaign.findById(id).lean<ICampaign & { _id: Types.ObjectId }>();
  if (!campaign) throw new Error("Campaign not found");

  const base = {
    campaignId: String(id),
    sent: 0,
    failed: 0,
    suppressed: 0,
    remaining: 0,
    cappedByDailyLimit: false,
    shouldContinue: false,
    status: campaign.status,
  };

  // Only an actively sending campaign drains. Paused / cancelled / already sent
  // campaigns are a no-op, which is what makes a stray cron tick harmless.
  if (campaign.status !== "sending") {
    base.remaining = await countRemaining(id);
    return base;
  }

  const transport = getTransport();
  // Fail loudly before a single message goes out rather than shipping a batch
  // whose links (including the one-click unsubscribe) point somewhere the
  // recipient can't reach. Dry runs are exempt — nothing leaves the machine.
  const linkBase =
    transport.name === "console" ? cfg.baseUrl : assertSendableBaseUrl(cfg.baseUrl);
  const gapMs = Math.ceil(60_000 / cfg.ratePerMin);
  let sentToday = await countSentToday();
  let processed = 0;
  let isFirst = true;

  while (processed < cfg.batchSize && Date.now() - startedAt < cfg.timeBudgetMs) {
    if (sentToday >= cfg.dailyCap) {
      base.cappedByDailyLimit = true;
      break;
    }

    // Throttle between sends, never before the first (that's dead time).
    if (!isFirst) {
      const remainingBudget = cfg.timeBudgetMs - (Date.now() - startedAt);
      if (remainingBudget <= gapMs) break;
      await sleep(gapMs);
    }

    const message = await claimNext(id, cfg.leaseMs);
    if (!message) break;
    isFirst = false;
    processed += 1;

    // Invariant 2: re-check suppression at send time. Someone may have
    // unsubscribed from an earlier message in this very campaign.
    const isSuppressed = await EmailSuppression.exists({ email: message.email });
    if (isSuppressed) {
      await EmailMessage.updateOne(
        { _id: message._id },
        { $set: { status: "suppressed", lockedUntil: new Date(0), error: "Recipient is unsubscribed" } }
      );
      base.suppressed += 1;
      continue;
    }

    const unsubUrl = unsubscribeUrl(message.email, linkBase);
    const mergeData: MergeData = { ...(message.mergeData as MergeData), unsubscribeUrl: unsubUrl };
    const renderInput = {
      subject: campaign.subject,
      preheader: campaign.preheader,
      blocks: campaign.blocks as Blocks,
    };
    const renderOpts = {
      unsubscribeUrl: unsubUrl,
      openPixelUrl: campaign.trackOpens ? openPixelUrl(String(message._id), linkBase) : undefined,
    };

    try {
      const result = await transport.send({
        to: message.email,
        subject: applyMergePlain(campaign.subject, mergeData),
        html: renderCampaignHtml(renderInput, mergeData, renderOpts),
        text: renderCampaignText(renderInput, mergeData, renderOpts),
        replyTo: campaign.replyTo,
        headers: unsubscribeHeaders(message.email, linkBase),
      });

      await EmailMessage.updateOne(
        { _id: message._id },
        {
          $set: {
            status: "sent",
            sentAt: new Date(),
            providerMessageId: result.messageId,
            lockedUntil: new Date(0),
            error: undefined,
            errorCode: undefined,
          },
        }
      );
      base.sent += 1;
      sentToday += 1;
    } catch (err) {
      const classified = classifyError(err);
      const giveUp = classified.kind === "permanent" || message.attempts >= cfg.maxAttempts;

      await EmailMessage.updateOne(
        { _id: message._id },
        {
          $set: {
            status: giveUp ? "failed" : "queued",
            error: classified.message,
            errorCode: classified.code,
            lockedUntil: new Date(0),
            nextAttemptAt: giveUp ? new Date() : new Date(Date.now() + backoffMs(message.attempts)),
          },
        }
      );

      if (giveUp) base.failed += 1;

      // A dead mailbox stays dead. Suppress it so it stops burning daily quota
      // and dragging down the sender reputation of every other recipient.
      if (classified.isHardBounce) {
        await suppress({
          email: message.email,
          reason: "bounce",
          source: `smtp ${classified.code}`,
          campaignId: id,
          note: classified.message,
        });
      }

      console.error(`[email:drain] ${message.email} ${classified.kind} ${classified.code}: ${classified.message}`);
    }
  }

  // Roll up from the outbox — it, not the counters, is the source of truth.
  const remaining = await countRemaining(id);
  base.remaining = remaining;

  if (remaining === 0) {
    const finalStatus = await finalizeCampaign(id);
    base.status = finalStatus;
    base.shouldContinue = false;
  } else if (base.cappedByDailyLimit) {
    // Stay in `sending`: tomorrow's cron picks the rest up. The UI reads
    // `cappedByDailyLimit` and explains the wait rather than looking stalled.
    base.shouldContinue = false;
    base.status = "sending";
  } else {
    await syncStats(id);
    base.shouldContinue = true;
    base.status = "sending";
  }

  return base;
}

/** Messages that still need a send attempt. */
async function countRemaining(campaignId: Types.ObjectId): Promise<number> {
  return EmailMessage.countDocuments({ campaignId, status: { $in: ["queued", "sending"] } });
}

/** Recompute a campaign's counters from the outbox. */
export async function syncStats(campaignId: Types.ObjectId | string) {
  await connectDB();
  const id = new Types.ObjectId(String(campaignId));

  const rows = await EmailMessage.aggregate<{ _id: string; n: number }>([
    { $match: { campaignId: id } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const opened = await EmailMessage.countDocuments({ campaignId: id, openedAt: { $ne: null } });

  const by = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  const stats = {
    total: rows.reduce((sum, r) => sum + r.n, 0),
    sent: by.sent ?? 0,
    failed: by.failed ?? 0,
    suppressed: by.suppressed ?? 0,
    opened,
  };

  await Campaign.updateOne({ _id: id }, { $set: { stats } });
  return stats;
}

/**
 * Close out a campaign with no work left. `failed` only when EVERY recipient
 * failed — a handful of dead mailboxes shouldn't label a successful send as a
 * failure.
 */
export async function finalizeCampaign(campaignId: Types.ObjectId | string): Promise<ICampaign["status"]> {
  await connectDB();
  const id = new Types.ObjectId(String(campaignId));
  const stats = await syncStats(id);
  const status: ICampaign["status"] = stats.sent === 0 && stats.failed > 0 ? "failed" : "sent";

  await Campaign.updateOne(
    { _id: id, status: { $in: ["sending", "paused"] } },
    { $set: { status, completedAt: new Date() } }
  );
  return status;
}

// ------------------------------------------------------------- scheduling ---

/**
 * Flip due scheduled campaigns into `sending`. The status guard in the update
 * makes this safe to run from overlapping cron ticks — only one wins.
 * Returns the ids that were started.
 */
export async function startDueCampaigns(): Promise<string[]> {
  await connectDB();
  const due = await Campaign.find({ status: "scheduled", scheduledFor: { $lte: new Date() } })
    .select("_id")
    .lean<Array<{ _id: Types.ObjectId }>>();

  const started: string[] = [];
  for (const row of due) {
    const res = await Campaign.updateOne(
      { _id: row._id, status: "scheduled" },
      { $set: { status: "sending", startedAt: new Date() } }
    );
    if (res.modifiedCount === 1) started.push(String(row._id));
  }
  return started;
}

/** Campaigns with work left to do, oldest first. */
export async function findDrainableCampaigns(limit = 5): Promise<string[]> {
  await connectDB();
  const rows = await Campaign.find({ status: "sending" })
    .sort({ startedAt: 1 })
    .limit(limit)
    .select("_id")
    .lean<Array<{ _id: Types.ObjectId }>>();
  return rows.map((r) => String(r._id));
}
