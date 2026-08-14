/**
 * Queue integration check — `npm run email:queue-check`.
 *
 * Verifies the behaviours that are easy to get subtly wrong and impossible to
 * eyeball: no double-sends under concurrency, idempotent enqueue, suppression
 * enforcement, the daily cap, and retry/bounce handling.
 *
 * Runs against the real database but FORCES the console transport, so it can
 * never send a real email regardless of what .env.local says. It creates
 * throwaway campaigns prefixed `__qacheck__` and deletes everything on the way
 * out.
 *
 * Requires MONGODB_URI (read from .env.local by the npm script).
 */

// Set before anything reads it. `getTransport()` resolves this at call time, so
// forcing it here guarantees no real delivery even on a misconfigured machine.
process.env.MAIL_TRANSPORT = "console";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailMessage } from "@/models/EmailMessage";
import { EmailSuppression } from "@/models/EmailSuppression";
import { enqueueCampaign, drainCampaign, syncStats } from "@/lib/email/queue";
import { parseBlocks } from "@/lib/email/blocks";
import { mintUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import type { Recipient } from "@/lib/email/segments";

const TAG = "__qacheck__";
const BASE = "http://localhost:3000";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ok    ${name}`);
  else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` → ${detail}` : ""}`);
  }
}
function section(t: string) {
  console.log(`\n${t}`);
}

function recipients(n: number, prefix = "qa"): Recipient[] {
  return Array.from({ length: n }, (_, i) => ({
    email: `${TAG}-${prefix}-${i}@example.invalid`,
    name: `QA Parent ${i}`,
    mergeData: { parentName: `QA Parent ${i}`, firstName: "QA", email: `${TAG}-${prefix}-${i}@example.invalid` },
  }));
}

async function makeCampaign(name: string) {
  return Campaign.create({
    name: `${TAG} ${name}`,
    subject: "QA check — {{firstName}}",
    preheader: "queue check",
    blocks: parseBlocks([
      { type: "heading", text: "Hi {{firstName}}" },
      { type: "text", text: "This is a queue integration check." },
    ]),
    segment: { source: "custom", filters: {} },
    status: "sending",
    startedAt: new Date(),
    stats: { total: 0, sent: 0, failed: 0, suppressed: 0, opened: 0 },
    createdBy: "qa@immersia.ng",
  });
}

async function cleanup() {
  const campaigns = await Campaign.find({ name: new RegExp(`^${TAG}`) }).select("_id").lean<any[]>();
  const ids = campaigns.map((c) => c._id);
  if (ids.length) await EmailMessage.deleteMany({ campaignId: { $in: ids } });
  await Campaign.deleteMany({ name: new RegExp(`^${TAG}`) });
  await EmailSuppression.deleteMany({ email: new RegExp(`^${TAG}`) });
}

async function main() {
  // Belt and braces: the assignment at the top of this file should make this
  // impossible, but a real send here would email actual parents.
  if (process.env.MAIL_TRANSPORT !== "console") {
    console.error("\nRefusing to run: the console transport is not active.\n");
    process.exit(1);
  }

  await connectDB();
  await cleanup();

  // ------------------------------------------------------------- enqueue ---
  section("Enqueue is idempotent");
  const c1 = await makeCampaign("enqueue");
  const list = recipients(10);

  const first = await enqueueCampaign(c1._id, list);
  check("first enqueue creates every row", first.queued === 10, `got ${first.queued}`);

  const second = await enqueueCampaign(c1._id, list);
  check("re-enqueueing the same list adds nothing", second.queued === 10, `got ${second.queued}`);

  const rowCount = await EmailMessage.countDocuments({ campaignId: c1._id });
  check("exactly one row per recipient", rowCount === 10, `got ${rowCount}`);

  // --------------------------------------------------------- suppression ---
  section("Suppression is enforced at enqueue");
  await EmailSuppression.create({
    email: `${TAG}-sup-0@example.invalid`,
    reason: "unsubscribe",
    source: "qa",
  });
  const c2 = await makeCampaign("suppression");
  const supRes = await enqueueCampaign(c2._id, recipients(5, "sup"));
  check("unsubscribed recipient is never queued", supRes.queued === 4, `queued ${supRes.queued}`);
  check("suppressed count is reported", supRes.suppressed === 1, `got ${supRes.suppressed}`);
  const supRow = await EmailMessage.findOne({ campaignId: c2._id, email: `${TAG}-sup-0@example.invalid` });
  check("no outbox row exists for them", supRow === null);

  // --------------------------------------------------------- concurrency ---
  section("Concurrent drains never double-send");
  // Four workers racing the same 10-message queue. If the atomic claim were
  // wrong, sent would exceed 10 or a recipient would appear twice.
  await Promise.all([
    drainCampaign(c1._id, { baseUrl: BASE, ratePerMin: 600, batchSize: 10 }),
    drainCampaign(c1._id, { baseUrl: BASE, ratePerMin: 600, batchSize: 10 }),
    drainCampaign(c1._id, { baseUrl: BASE, ratePerMin: 600, batchSize: 10 }),
    drainCampaign(c1._id, { baseUrl: BASE, ratePerMin: 600, batchSize: 10 }),
  ]);

  const sent = await EmailMessage.countDocuments({ campaignId: c1._id, status: "sent" });
  const anyLeft = await EmailMessage.countDocuments({
    campaignId: c1._id,
    status: { $in: ["queued", "sending"] },
  });
  check("exactly 10 sent, no duplicates", sent === 10, `sent=${sent}`);
  check("queue fully drained", anyLeft === 0, `remaining=${anyLeft}`);

  const attempts = await EmailMessage.find({ campaignId: c1._id }).select("attempts").lean<any[]>();
  check(
    "each message attempted exactly once",
    attempts.every((a) => a.attempts === 1),
    `attempts: ${[...new Set(attempts.map((a) => a.attempts))].join(",")}`
  );

  const c1After = await Campaign.findById(c1._id).lean<any>();
  check("campaign finalised as sent", c1After?.status === "sent", `status=${c1After?.status}`);
  check("stats match the outbox", c1After?.stats?.sent === 10, `stats.sent=${c1After?.stats?.sent}`);

  // -------------------------------------------------------- mid-send stop ---
  section("Suppression mid-send stops the rest");
  const c3 = await makeCampaign("midsend");
  await enqueueCampaign(c3._id, recipients(6, "mid"));
  // Unsubscribe someone AFTER they were queued — the send-time re-check must catch it.
  await EmailSuppression.create({
    email: `${TAG}-mid-3@example.invalid`,
    reason: "unsubscribe",
    source: "qa mid-send",
  });
  await drainCampaign(c3._id, { baseUrl: BASE, ratePerMin: 600, batchSize: 10 });

  const midRow = await EmailMessage.findOne({ campaignId: c3._id, email: `${TAG}-mid-3@example.invalid` }).lean<any>();
  check("late unsubscribe is skipped, not sent", midRow?.status === "suppressed", `status=${midRow?.status}`);
  const midSent = await EmailMessage.countDocuments({ campaignId: c3._id, status: "sent" });
  check("everyone else still received it", midSent === 5, `sent=${midSent}`);

  // ------------------------------------------------------------ daily cap ---
  section("Daily cap halts a send");
  const c4 = await makeCampaign("cap");
  await enqueueCampaign(c4._id, recipients(8, "cap"));
  const capped = await drainCampaign(c4._id, {
    baseUrl: BASE,
    ratePerMin: 600,
    batchSize: 20,
    dailyCap: 1, // already exceeded by the sends above
  });
  check("drain reports the cap", capped.cappedByDailyLimit === true);
  check("work is left for tomorrow", capped.remaining > 0, `remaining=${capped.remaining}`);
  const capStatus = await Campaign.findById(c4._id).select("status").lean<any>();
  check("campaign stays in sending, not failed", capStatus?.status === "sending", `status=${capStatus?.status}`);

  // ---------------------------------------------------------- lease reclaim ---
  section("Expired leases are reclaimed");
  const c5 = await makeCampaign("lease");
  await enqueueCampaign(c5._id, recipients(3, "lease"));
  // Simulate a worker that claimed rows then died: status `sending`, lease past.
  await EmailMessage.updateMany(
    { campaignId: c5._id },
    { $set: { status: "sending", lockedUntil: new Date(Date.now() - 60_000) } }
  );
  await drainCampaign(c5._id, { baseUrl: BASE, ratePerMin: 600, batchSize: 10 });
  const reclaimed = await EmailMessage.countDocuments({ campaignId: c5._id, status: "sent" });
  check("orphaned messages are picked back up", reclaimed === 3, `sent=${reclaimed}`);

  // -------------------------------------------------------------- paused ---
  section("A paused campaign does not send");
  const c6 = await makeCampaign("paused");
  await enqueueCampaign(c6._id, recipients(4, "paused"));
  await Campaign.updateOne({ _id: c6._id }, { $set: { status: "paused" } });
  const pausedRes = await drainCampaign(c6._id, { baseUrl: BASE, ratePerMin: 600 });
  check("drain is a no-op while paused", pausedRes.sent === 0, `sent=${pausedRes.sent}`);
  const stillQueued = await EmailMessage.countDocuments({ campaignId: c6._id, status: "queued" });
  check("messages stay queued", stillQueued === 4, `queued=${stillQueued}`);

  // --------------------------------------------------------- unsub tokens ---
  section("Unsubscribe tokens");
  const token = mintUnsubscribeToken("Parent@Example.NG");
  check("round-trips and normalises case", verifyUnsubscribeToken(token) === "parent@example.ng");
  check("tampered payload rejected", verifyUnsubscribeToken(`x${token}`) === null);
  check("tampered signature rejected", verifyUnsubscribeToken(`${token.split(".")[0]}.deadbeef`) === null);
  check("garbage rejected", verifyUnsubscribeToken("nonsense") === null);
  check("empty rejected", verifyUnsubscribeToken("") === null);

  await syncStats(c1._id);
  await cleanup();

  console.log(failures === 0 ? "\nAll queue checks passed.\n" : `\n${failures} check(s) FAILED\n`);
  if (failures) process.exitCode = 1;
}

main()
  .catch(async (err) => {
    console.error(err);
    await cleanup().catch(() => {});
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
