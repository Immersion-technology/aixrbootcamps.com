/**
 * Send the AiXR welcome email to paid parents — `npm run email:send-welcome`.
 *
 * Runs through the REAL campaign system, not a one-off loop: it creates a
 * Campaign row, materialises the outbox, and drains it. So every recipient gets
 * an audit record, a working one-click unsubscribe, suppression checks, retries
 * on transient failure, and the send shows up in /admin/email like any other.
 *
 * Safety:
 *   --dry   render every message and print it, send nothing (default)
 *   --send  actually deliver
 * Dry run is the default on purpose — this mails real customers.
 */
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailMessage } from "@/models/EmailMessage";
import { parseBlocks, validateBlocks, renderCampaignHtml } from "@/lib/email/blocks";
import { resolveSegment } from "@/lib/email/segments";
import { enqueueCampaign, drainCampaign } from "@/lib/email/queue";
import { sendableBaseUrl } from "@/lib/email/base-url";
import { withAliases } from "@/lib/email/merge";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import {
  aixrWelcomeBlocks,
  AIXR_WELCOME_HEADER,
  AIXR_WELCOME_SUBJECT,
  AIXR_WELCOME_PREHEADER,
} from "@/lib/email/welcome-template";

const LIVE = process.argv.includes("--send");
const SEGMENT = "paid_registrations";
const CAMPAIGN_NAME = "AiXR Welcome — paid campers";

async function main() {
  const baseUrl = sendableBaseUrl();
  await connectDB();

  const blocks = parseBlocks(aixrWelcomeBlocks());
  const issues = validateBlocks(blocks);
  if (issues.length) {
    issues.forEach((i) => console.error(`  block ${i.index}: ${i.message}`));
    throw new Error("Template failed validation");
  }

  const recipients = await resolveSegment(SEGMENT, {});
  console.log(`\nBase URL   : ${baseUrl}`);
  console.log(`Audience   : ${recipients.length} recipient(s) — paid registrations, deduped by email`);
  console.log(`Mode       : ${LIVE ? "LIVE SEND" : "DRY RUN (nothing will be sent)"}\n`);

  // Prove every recipient renders correctly BEFORE anything is delivered.
  console.log("--- per-recipient check ---");
  let bad = 0;
  for (const r of recipients) {
    const data = withAliases({ ...r.mergeData, unsubscribeUrl: unsubscribeUrl(r.email, baseUrl) });
    const html = renderCampaignHtml(
      {
        subject: AIXR_WELCOME_SUBJECT,
        preheader: AIXR_WELCOME_PREHEADER,
        blocks,
        theme: "aixr",
        header: AIXR_WELCOME_HEADER,
      },
      data,
      { unsubscribeUrl: data.unsubscribeUrl }
    );

    const problems: string[] = [];
    const token = html.match(/\{\{\s*\w+\s*\}\}/);
    if (token) problems.push(`unresolved ${token[0]}`);
    if (html.includes("localhost")) problems.push("localhost link");
    if (!html.includes("/api/e/u/")) problems.push("no unsubscribe link");
    if (!data.firstName) problems.push("no first name");

    if (problems.length) bad++;
    console.log(
      `  ${problems.length ? "!!" : "ok"}  ${r.email.padEnd(34)} ${data.firstName || "?"} · ${
        data.cohortName || "?"
      } · ${data.attendanceMode || "?"}${problems.length ? `  <-- ${problems.join(", ")}` : ""}`
    );
  }

  if (bad > 0) throw new Error(`${bad} recipient(s) would render incorrectly — aborting.`);
  console.log(`\nAll ${recipients.length} render clean.`);

  if (!LIVE) {
    console.log("\nDry run complete. Re-run with --send to deliver.\n");
    return;
  }

  // Reuse an existing campaign row if this was run before, so a re-run tops up
  // rather than mailing everyone a second time (the outbox unique index also
  // guarantees this).
  let campaign = await Campaign.findOne({ name: CAMPAIGN_NAME });
  if (!campaign) {
    campaign = await Campaign.create({
      name: CAMPAIGN_NAME,
      subject: AIXR_WELCOME_SUBJECT,
      preheader: AIXR_WELCOME_PREHEADER,
      blocks,
      theme: "aixr",
      segment: { source: SEGMENT, filters: {} },
      status: "sending",
      startedAt: new Date(),
      stats: { total: 0, sent: 0, failed: 0, suppressed: 0, opened: 0 },
      createdBy: "script",
      sentBy: "script",
    });
  } else {
    await Campaign.updateOne({ _id: campaign._id }, { $set: { status: "sending" } });
  }

  const enqueued = await enqueueCampaign(campaign._id, recipients);
  console.log(`\nQueued ${enqueued.queued}, skipped ${enqueued.suppressed} (unsubscribed).`);

  for (let pass = 1; pass <= 100; pass++) {
    const result = await drainCampaign(campaign._id, { baseUrl });
    console.log(
      `  pass ${pass}: sent=${result.sent} failed=${result.failed} remaining=${result.remaining}`
    );
    if (result.cappedByDailyLimit) {
      console.log("  Daily cap reached — the rest sends tomorrow.");
      break;
    }
    if (!result.shouldContinue) break;
  }

  const finalRows = await EmailMessage.find({ campaignId: campaign._id })
    .select("email status error")
    .lean<any[]>();

  console.log("\n--- results ---");
  finalRows.forEach((m) => console.log(`  ${m.status.padEnd(10)} ${m.email}${m.error ? ` — ${m.error}` : ""}`));
  console.log(
    `\nDelivered ${finalRows.filter((m) => m.status === "sent").length}/${finalRows.length}. ` +
      `Tracked in /admin/email as "${CAMPAIGN_NAME}".\n`
  );
}

main()
  .catch((err) => {
    console.error(`\n${err instanceof Error ? err.message : err}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
