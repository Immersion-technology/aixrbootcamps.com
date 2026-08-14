/**
 * Renderer regression check — `npm run email:check`.
 *
 * The campaign renderer is the one place where admin-authored text and
 * parent-supplied names become HTML that lands in someone's inbox. These
 * assertions pin its security properties (no script injection, no
 * `javascript:` hrefs, no header-splitting URLs) and its output contract
 * (every merge token resolved, unsubscribe footer always present).
 *
 * Runs offline — no DB, no SMTP. It also writes a `.preview.html` you can open
 * in a browser to eyeball every block type.
 */
import { writeFileSync } from "fs";
import { join } from "path";
import {
  renderCampaignHtml,
  renderCampaignText,
  validateBlocks,
  parseBlocks,
  safeUrl,
  renderInline,
  starterBlocks,
  type Blocks,
} from "@/lib/email/blocks";
import { sampleMergeData, applyMergePlain } from "@/lib/email/merge";

let failures = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ok    ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` → ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

// --------------------------------------------------------------- safeUrl ---
section("URL safety");
check("https passes through", safeUrl("https://immersia.ng/x") === "https://immersia.ng/x");
check("mailto passes through", safeUrl("mailto:hi@immersia.ng") === "mailto:hi@immersia.ng");
check("tel passes through", safeUrl("tel:+2348137013560") === "tel:+2348137013560");
check("hyphenated paths survive", safeUrl("https://a.ng/my-page-1") === "https://a.ng/my-page-1");
check("query strings survive", safeUrl("https://a.ng/x?y=1&z=2") === "https://a.ng/x?y=1&z=2");
check("relative link is made absolute", (safeUrl("/account/login") ?? "").endsWith("/account/login"));
check("javascript: rejected", safeUrl("javascript:alert(1)") === null);
check("data: rejected", safeUrl("data:text/html,<script>") === null);
check("protocol-relative rejected", safeUrl("//evil.com") === null);
check("attribute break-out rejected", safeUrl('https://a.ng" onload="x') === null);
check("newline (header split) rejected", safeUrl("https://a.ng\nX-Injected: 1") === null);
check("tab rejected", safeUrl("https://a.ng\tx") === null);

// ---------------------------------------------------------------- inline ---
section("Inline grammar + escaping");
const escaped = renderInline('Hello <script>alert(1)</script> & "quotes"', {});
check("script tag escaped", !escaped.includes("<script>"), escaped);
check("ampersand escaped", escaped.includes("&amp;"));
check("bold renders", /<strong[^>]*>b<\/strong>/.test(renderInline("a **b** c", {})));
check("italic renders", renderInline("a *b* c", {}).includes("<em>b</em>"));
check("link renders", renderInline("[x](https://a.ng)", {}).includes('href="https://a.ng"'));
check("javascript link degrades to text", !renderInline("[x](javascript:alert(1))", {}).includes("<a "));
check("newline becomes <br>", renderInline("a\nb", {}).includes("<br>"));

// ------------------------------------------------------- merge injection ---
section("Hostile merge values (a camper's name is public input)");
const hostile = {
  parentName: '<img src=x onerror="alert(1)">',
  participantName: "[click me](javascript:alert(1))",
  childNames: "**not bold**",
  portalUrl: "https://immersia.ng/account/login",
  siteUrl: "https://immersia.ng",
  unsubscribeUrl: "https://immersia.ng/api/e/u/tok",
};
const injected = renderCampaignHtml(
  {
    subject: "s",
    blocks: parseBlocks([{ type: "text", text: "{{parentName}} {{participantName}} {{childNames}}" }]),
  },
  hostile
);
check("injected <img> is escaped", !injected.includes("<img src=x"));
check("injected onerror is escaped", !injected.includes('onerror="alert'));
check("injected bold is NOT parsed", !injected.includes("<strong>not bold</strong>"));
// The value may still APPEAR as literal text — that's correct, we don't rewrite
// someone's name. What must never happen is it becoming a live link.
check("no javascript: href anywhere", !/href\s*=\s*["']?\s*javascript/i.test(injected));
check(
  "injected markdown link stays inert text",
  injected.includes("[click me](javascript:alert(1))") && !injected.includes('href="javascript:alert(1)"')
);

// ----------------------------------------------------------- full render ---
section("Full render, every block type");
// Parsed through the real schema, so this exercises the same path the API uses
// and proves the defaults land correctly.
const all: Blocks = parseBlocks([
  { type: "heading", eyebrow: "Camp update", text: "Hi {{firstName}}", level: 1 },
  { type: "text", text: "Camp starts **Monday**. See you at [the venue](https://immersia.ng/contact)." },
  { type: "heading", text: "What to bring", level: 2 },
  { type: "list", items: ["A water bottle", "A packed lunch", "Your {{attendanceMode}} kit"] },
  { type: "list", items: ["Arrive by 8:45am", "Sign in at the desk"], ordered: true },
  { type: "callout", title: "Important", text: "Doors open 8:45am sharp.", tone: "violet" },
  { type: "callout", title: "Heads up", text: "Bring photo ID for pickup.", tone: "warning" },
  { type: "callout", title: "You're all set", text: "{{cohortLabel}}", tone: "success" },
  { type: "callout", title: "Your reference", text: "{{registrationId}}", tone: "dark" },
  { type: "divider" },
  { type: "image", url: "https://immersia.ng/logo.png", alt: "IMMERSIA", href: "{{siteUrl}}", width: 320 },
  { type: "button", label: "Open my portal", url: "{{portalUrl}}" },
  { type: "button", label: "Read the FAQ", url: "/faq", style: "light" },
]);

const data = sampleMergeData();
const html = renderCampaignHtml(
  { subject: "Camp starts Monday", preheader: "Everything you need for day one", blocks: all },
  data,
  { unsubscribeUrl: "https://immersia.ng/api/e/u/tok123", openPixelUrl: "https://immersia.ng/api/e/o/tok123" }
);

check("has a doctype", /^<!DOCTYPE html/i.test(html));
check("merge fields resolved", html.includes("Adebayo"));
check("portalUrl resolved inside button", html.includes('href="https://immersia.ng/account/login"'));
check("relative button link made absolute", html.includes("/faq"));
check("unsubscribe footer present", html.includes("Unsubscribe"));
check("unsubscribe href present", html.includes("/api/e/u/tok123"));
check("open pixel present", html.includes("/api/e/o/tok123"));
check("preheader present", html.includes("Everything you need for day one"));
check("every block type rendered", html.includes("<ol") && html.includes("<ul") && html.includes("logo.png"));
check(
  "no unresolved tokens leak to the inbox",
  !/\{\{\s*\w+\s*\}\}/.test(html),
  (html.match(/\{\{\s*\w+\s*\}\}/) ?? [""])[0]
);

section("Plain-text alternative");
const text = renderCampaignText({ subject: "s", blocks: all }, data, {
  unsubscribeUrl: "https://immersia.ng/api/e/u/tok123",
});
check("contains no markup", !text.includes("<"), text.slice(0, 120));
check("contains unsubscribe URL", text.includes("Unsubscribe:"));
check("tokens resolved", !/\{\{/.test(text));

// ------------------------------------------------------------ validation ---
section("Editor validation");
check("clean blocks pass", validateBlocks(all).length === 0, JSON.stringify(validateBlocks(all)));
check("starter blocks pass", validateBlocks(starterBlocks()).length === 0);
check(
  "unknown merge field is flagged",
  validateBlocks(parseBlocks([{ type: "text", text: "Hi {{nope}}" }])).length === 1
);
check(
  "user-supplied field in a URL is flagged",
  validateBlocks(parseBlocks([{ type: "button", label: "x", url: "{{parentName}}" }])).length === 1
);
check(
  "javascript: button link is flagged",
  validateBlocks(parseBlocks([{ type: "button", label: "x", url: "javascript:alert(1)" }])).length === 1
);
check(
  "javascript: inline link is flagged",
  validateBlocks(parseBlocks([{ type: "text", text: "go [here](javascript:alert(1))" }])).length === 1
);

section("Schema rejects malformed input");
const rejects = (input: unknown, why: string) => {
  try {
    parseBlocks(input);
    check(why, false, "was accepted");
  } catch {
    check(why, true);
  }
};
rejects([], "empty block list rejected");
rejects([{ type: "nope", text: "x" }], "unknown block type rejected");
rejects([{ type: "heading" }], "heading without text rejected");
rejects([{ type: "text", text: "" }], "empty paragraph rejected");
rejects([{ type: "list", items: [] }], "empty list rejected");
rejects([{ type: "button", label: "x" }], "button without a URL rejected");

// ------------------------------------------------- themes, aliases, blocks ---
section("snake_case merge aliases");
const aliasBlocks = parseBlocks([
  { type: "text", text: "{{first_name}} / {{participant_id}} / {{cohort_name}} / {{attendance_mode}}" },
]);
const aliasHtml = renderCampaignHtml({ subject: "s", blocks: aliasBlocks }, sampleMergeData());
check("{{first_name}} resolves", aliasHtml.includes("Adebayo"));
check("{{participant_id}} resolves", aliasHtml.includes("IMM-2026-0042"));
check("{{cohort_name}} resolves", aliasHtml.includes("Cohort 2"));
check("no alias token left unresolved", !/\{\{/.test(aliasHtml));

// The exact bug that shipped the wrong name: overriding a canonical field must
// win over the sample value, with no stale alias surviving underneath it.
const overridden = renderCampaignHtml(
  { subject: "s", blocks: parseBlocks([{ type: "text", text: "{{first_name}}" }]) },
  { ...sampleMergeData(), firstName: "Tobiloba" }
);
check("overriding firstName updates {{first_name}}", overridden.includes("Tobiloba"), "stale alias won");
check("stale sample name is gone", !overridden.includes("Adebayo"));

// Subject lines go through applyMergePlain, which must expand aliases too.
check(
  "subject line resolves aliases",
  applyMergePlain("Hi {{first_name}}!", { ...sampleMergeData(), firstName: "Tobiloba" }) === "Hi Tobiloba!"
);
check(
  "subject line strips CRLF (header injection)",
  !applyMergePlain("Hi {{firstName}}", { firstName: "A\r\nBcc: x@y.z" }).includes("\n")
);

section("AiXR dark theme + new blocks");
const aixrBlocks = parseBlocks([
  { type: "heading", eyebrow: "Welcome", text: "Hi {{first_name}}", level: 2 },
  {
    type: "details",
    title: "Your Registration Details",
    rows: [
      { icon: "👤", label: "Participant", value: "{{participant_name}}" },
      { icon: "🎟", label: "Participant ID", value: "{{participant_id}}" },
    ],
  },
  {
    type: "chips",
    title: "Your Courses",
    items: [
      { text: "Vibe Coding & AI", tone: "gold" },
      { text: "Robotics", tone: "green" },
    ],
    note: "Gold = Online & Lagos",
  },
  { type: "button", label: "Go to My Dashboard", url: "{{portalUrl}}" },
]);
const aixrHtml = renderCampaignHtml(
  {
    subject: "Welcome {{first_name}}",
    preheader: "Your registration is confirmed",
    blocks: aixrBlocks,
    theme: "aixr",
    header: {
      eyebrow: "Immersia Virtual Reality",
      title: "AiXR",
      titleAccent: "Summer Boot Camp",
      subtitle: "2026 Edition",
      badges: ["27 July – 4 September 2026", "Ages 10–17"],
    },
  },
  sampleMergeData(),
  { unsubscribeUrl: "https://immersia.ng/api/e/u/tok" }
);
check("dark page background applied", aixrHtml.includes("#0D1117"));
check("gold accent applied", aixrHtml.includes("#C9A84C"));
check("header title rendered", aixrHtml.includes("AiXR"));
check("header badges rendered", aixrHtml.includes("Ages 10"));
check("details block rendered", aixrHtml.includes("Your Registration Details"));
check("details value merged", aixrHtml.includes("IMM-2026-0042"));
check("chips block rendered", aixrHtml.includes("Vibe Coding"));
check("button uses table wrapper (Outlook)", aixrHtml.includes("bgcolor=\"#1F4E79\""));
check("unsubscribe still enforced on dark theme", aixrHtml.includes("Unsubscribe"));
check("no unresolved tokens in dark render", !/\{\{\s*\w+\s*\}\}/.test(aixrHtml));
check("no flexbox (breaks Outlook)", !aixrHtml.includes("display:flex"));
check("light theme is unchanged by default", renderCampaignHtml({ subject: "s", blocks: all }, data).includes("#f1f1f1"));

const aixrText = renderCampaignText({ subject: "s", blocks: aixrBlocks }, sampleMergeData(), {
  unsubscribeUrl: "https://immersia.ng/api/e/u/tok",
});
check("details block in plain text", aixrText.includes("Participant ID: IMM-2026-0042"));
check("chips block in plain text", aixrText.includes("Vibe Coding"));
check("plain text has no markup", !aixrText.includes("<"));

// ------------------------------------------------------------------ done ---
const out = join(process.cwd(), ".preview.html");
writeFileSync(out, html);
console.log(`\nPreview written to ${out}`);

if (failures) {
  console.error(`\n${failures} check(s) FAILED\n`);
  process.exit(1);
}
console.log("\nAll renderer checks passed.\n");
