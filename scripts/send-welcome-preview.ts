/**
 * Send the AiXR welcome email preview — `npm run email:preview-welcome`.
 *
 * Renders the welcome template through the REAL campaign renderer (same code
 * path as a live send) and emails one copy to the reviewer. Also writes the
 * HTML to .preview-welcome.html so you can open it in a browser.
 *
 * Recipient defaults to the address below; override with MAIL_TEST_TO.
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { renderCampaignHtml, renderCampaignText, parseBlocks, validateBlocks } from "@/lib/email/blocks";
import { sampleMergeData, withAliases } from "@/lib/email/merge";
import { unsubscribeUrl, unsubscribeHeaders } from "@/lib/email/unsubscribe";
import { sendableBaseUrl } from "@/lib/email/base-url";
import { applyMergePlain } from "@/lib/email/merge";
import { sendMail } from "@/lib/mailer";
import {
  aixrWelcomeBlocks,
  AIXR_WELCOME_HEADER,
  AIXR_WELCOME_SUBJECT,
  AIXR_WELCOME_PREHEADER,
} from "@/lib/email/welcome-template";

const TO = process.env.MAIL_TEST_TO?.trim() || "sulaimontobilobaabayomi@gmail.com";
// Never APP_URL — in dev that's localhost, which would put dead links (and a
// broken unsubscribe) into a real inbox. See lib/email/base-url.ts.
const BASE = sendableBaseUrl("https://www.aixrbootcamp.com");

async function main() {
  const blocks = parseBlocks(aixrWelcomeBlocks());

  const issues = validateBlocks(blocks);
  if (issues.length) {
    console.error("Template has validation problems:");
    issues.forEach((i) => console.error(`  block ${i.index}: ${i.message}`));
    process.exit(1);
  }

  // Realistic sample values so the preview reads like a real send.
  const data = withAliases({
    ...sampleMergeData(),
    parentName: "Tobiloba Sulaimon",
    firstName: "Tobiloba",
    participantName: "Zara Sulaimon",
    childNames: "Zara Sulaimon",
    registrationId: "AIXR-2026-0042",
    cohortName: "Cohort 2",
    cohortDates: "10 – 21 Aug",
    cohortLabel: "Cohort 2 · 10 – 21 Aug 2026",
    cohortStart: "10 August 2026",
    attendanceMode: "Lagos Camp (Onsite)",
    campName: "AiXR Summer Tech Boot Camp",
    campDates: "27 July – 4 September 2026",
    campHours: "Monday – Friday · 9:00 AM – 1:30 PM",
    email: TO,
    portalUrl: BASE,
    siteUrl: BASE,
  });

  const unsub = unsubscribeUrl(TO, BASE);
  const input = {
    subject: AIXR_WELCOME_SUBJECT,
    preheader: AIXR_WELCOME_PREHEADER,
    blocks,
    theme: "aixr",
    header: AIXR_WELCOME_HEADER,
  };
  const opts = { unsubscribeUrl: unsub };

  const html = renderCampaignHtml(input, data, opts);
  const text = renderCampaignText(input, data, opts);
  const subject = applyMergePlain(AIXR_WELCOME_SUBJECT, data);

  const out = join(process.cwd(), ".preview-welcome.html");
  writeFileSync(out, html);
  console.log(`Rendered  → ${out}`);
  console.log(`Subject   → ${subject}`);

  const leftover = html.match(/\{\{\s*\w+\s*\}\}/);
  if (leftover) {
    console.error(`\nUnresolved merge token in output: ${leftover[0]}`);
    process.exit(1);
  }
  console.log("Tokens    → all resolved");

  await sendMail({
    to: TO,
    subject: `[PREVIEW] ${subject}`,
    html,
    text,
    headers: unsubscribeHeaders(TO, BASE),
  });

  console.log(`\nPreview sent to ${TO}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
