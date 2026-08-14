/**
 * Drain the campaign queue from the command line — `npm run email:drain`.
 *
 * Useful when you want to push a send along without the admin UI open, or to
 * finish a campaign the daily cap paused. Loops until the queue is empty, the
 * cap is hit, or nothing is left to do.
 *
 * Set `MAIL_TRANSPORT=console` in .env.local first if you want a dry run.
 */
import mongoose from "mongoose";
import { drainCampaign, findDrainableCampaigns, startDueCampaigns, countSentToday, queueConfig } from "@/lib/email/queue";

async function main() {
  const baseUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const cfg = queueConfig();

  console.log(`transport : ${process.env.MAIL_TRANSPORT ?? "smtp"}`);
  console.log(`base url  : ${baseUrl}`);
  console.log(`daily cap : ${await countSentToday()} / ${cfg.dailyCap} sent today\n`);

  const started = await startDueCampaigns();
  if (started.length) console.log(`Started ${started.length} scheduled campaign(s).`);

  const targets = await findDrainableCampaigns(10);
  if (targets.length === 0) {
    console.log("Nothing to send.");
    return;
  }

  for (const id of targets) {
    console.log(`\nCampaign ${id}`);
    let guard = 0;
    for (;;) {
      const result = await drainCampaign(id, { baseUrl });
      console.log(
        `  sent=${result.sent} failed=${result.failed} skipped=${result.suppressed} remaining=${result.remaining}`
      );

      if (result.cappedByDailyLimit) {
        console.log("  Daily cap reached — the rest goes out tomorrow.");
        break;
      }
      if (!result.shouldContinue) {
        console.log(`  Finished: ${result.status}`);
        break;
      }
      // Backstop against an unexpected non-terminating loop.
      if (++guard > 200) {
        console.warn("  Stopping after 200 passes — check the queue for stuck messages.");
        break;
      }
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
