/**
 * Campaign content blocks — the source of truth for what an admin composes.
 *
 * Why blocks and not raw HTML / WYSIWYG:
 *  - Output is deterministic, table-based and Outlook-safe. An operator can't
 *    paste markup that renders fine in Gmail and collapses in Outlook.
 *  - It is XSS-proof *by construction*. Author text is escaped and only a tiny
 *    inline grammar (**bold**, *italic*, [label](url)) is re-introduced as HTML,
 *    so there is no sanitizer allowlist to get wrong.
 *
 * The same renderer serves the live preview, the test send and the real send —
 * there is deliberately no second code path.
 */
import { z } from "zod";
import { APP_URL, esc, shell, type ShellOpts } from "./shell";
import { getTheme, type EmailTheme } from "./themes";
import {
  applyMergeHtml,
  applyMergeUrl,
  tokensIn,
  withAliases,
  MERGE_KEYS,
  URL_SAFE_MERGE_KEYS,
  type MergeData,
} from "./merge";

// ---------------------------------------------------------------- schemas ---

const align = z.enum(["left", "center"]).default("left");
const blockId = z.string().trim().min(1).max(64).optional();

export const headingBlockSchema = z.object({
  id: blockId,
  type: z.literal("heading"),
  /** Small uppercase kicker above the headline, e.g. "Camp starts Monday". */
  eyebrow: z.string().trim().max(80).optional().default(""),
  text: z.string().trim().min(1, "Heading can't be empty").max(200),
  level: z.union([z.literal(1), z.literal(2)]).default(1),
  align,
});

export const textBlockSchema = z.object({
  id: blockId,
  type: z.literal("text"),
  text: z.string().trim().min(1, "Paragraph can't be empty").max(5000),
  align,
});

export const buttonBlockSchema = z.object({
  id: blockId,
  type: z.literal("button"),
  label: z.string().trim().min(1, "Button needs a label").max(60),
  url: z.string().trim().min(1, "Button needs a link"),
  style: z.enum(["dark", "light"]).default("dark"),
  align: z.enum(["left", "center"]).default("center"),
});

export const imageBlockSchema = z.object({
  id: blockId,
  type: z.literal("image"),
  url: z.string().trim().min(1, "Image needs a URL"),
  alt: z.string().trim().max(200).default(""),
  /** Optional click-through. */
  href: z.string().trim().max(500).optional().default(""),
  width: z.number().int().min(80).max(580).default(520),
});

export const listBlockSchema = z.object({
  id: blockId,
  type: z.literal("list"),
  items: z.array(z.string().trim().min(1).max(500)).min(1, "Add at least one item").max(30),
  ordered: z.boolean().default(false),
});

export const calloutBlockSchema = z.object({
  id: blockId,
  type: z.literal("callout"),
  title: z.string().trim().max(120).optional().default(""),
  text: z.string().trim().min(1, "Callout can't be empty").max(2000),
  tone: z.enum(["subtle", "dark", "violet", "success", "warning"]).default("subtle"),
});

export const dividerBlockSchema = z.object({
  id: blockId,
  type: z.literal("divider"),
});

/** Label/value rows in a bordered panel — "Your registration details". */
export const detailsBlockSchema = z.object({
  id: blockId,
  type: z.literal("details"),
  title: z.string().trim().max(120).optional().default(""),
  rows: z
    .array(
      z.object({
        icon: z.string().trim().max(8).optional().default(""),
        label: z.string().trim().min(1).max(60),
        value: z.string().trim().min(1).max(300),
      })
    )
    .min(1, "Add at least one row")
    .max(20),
});

/** Pill/tag row — course lists, feature badges. */
export const chipsBlockSchema = z.object({
  id: blockId,
  type: z.literal("chips"),
  title: z.string().trim().max(120).optional().default(""),
  items: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(80),
        tone: z.enum(["accent", "gold", "green", "neutral"]).optional().default("neutral"),
      })
    )
    .min(1, "Add at least one chip")
    .max(24),
  note: z.string().trim().max(200).optional().default(""),
});

export const blockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  textBlockSchema,
  buttonBlockSchema,
  imageBlockSchema,
  listBlockSchema,
  calloutBlockSchema,
  dividerBlockSchema,
  detailsBlockSchema,
  chipsBlockSchema,
]);

export const blocksSchema = z
  .array(blockSchema)
  .min(1, "Add at least one block")
  .max(60, "That's a lot of blocks — split this into two emails");

/** Fully-resolved block (defaults applied) — what the renderer consumes. */
export type Block = z.output<typeof blockSchema>;
export type Blocks = Block[];

/** What a client may send: defaulted fields are optional. */
export type BlockInput = z.input<typeof blockSchema>;
export type BlocksInput = BlockInput[];

/**
 * Parse untrusted input into renderable blocks, applying every default.
 * Every entry point — API save, preview, test send, seed data — goes through
 * here, so the renderer only ever sees a fully-resolved document.
 */
export function parseBlocks(input: unknown): Blocks {
  return blocksSchema.parse(input);
}

export const BLOCK_TYPES = [
  "heading",
  "text",
  "button",
  "image",
  "list",
  "callout",
  "divider",
  "details",
  "chips",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

// ------------------------------------------------------------------ urls ---

/** Whitespace, quotes, angle brackets, backslash. */
const UNSAFE_URL_CHARS = /[\s"'<>\\]/;
/** ASCII control characters (C0 range + DEL) — invisible, and able to break out of an href. */
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

/**
 * Only http(s), mailto, tel and site-relative links survive. Everything else —
 * `javascript:`, `data:`, protocol-relative `//evil.com` — is rejected.
 * Relative links are made absolute because email clients have no page origin.
 */
export function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  // Either class would let an href attribute break out of its quotes.
  if (UNSAFE_URL_CHARS.test(url) || hasControlChars(url)) return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  if (/^\/(?!\/)/.test(url)) return `${APP_URL}${url}`;
  return null;
}

// ---------------------------------------------------------------- inline ---

/** `**bold**` · `*italic*` · `[label](url)` — in that precedence order. */
const INLINE_RE = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/**
 * Turn one author-written string into safe inline HTML.
 * Everything outside the tiny grammar above is escaped, then newlines become
 * `<br>`. Merge tokens are left as literal `{{key}}` text here — they're
 * substituted later by `applyMergeHtml`, after escaping, so a camper's name can
 * never be re-parsed as markup.
 */
export function renderInline(
  raw: string,
  data: MergeData,
  theme: EmailTheme = getTheme("immersia")
): string {
  let out = "";
  let last = 0;

  for (const m of raw.matchAll(INLINE_RE)) {
    const at = m.index ?? 0;
    out += esc(raw.slice(last, at));

    if (m[1] !== undefined) {
      out += `<strong style="color:${theme.strong};">${esc(m[1])}</strong>`;
    } else if (m[2] !== undefined) {
      out += `<em>${esc(m[2])}</em>`;
    } else {
      const href = safeUrl(applyMergeUrl(m[4], data));
      // A bad link degrades to plain text rather than shipping a broken anchor.
      out += href
        ? `<a href="${esc(href)}" style="color:${theme.link};text-decoration:underline;">${esc(m[3])}</a>`
        : esc(m[3]);
    }
    last = at + m[0].length;
  }

  out += esc(raw.slice(last));
  return out.replace(/\r?\n/g, "<br>");
}

/** Plain-text counterpart — strips the inline grammar for the text/plain part. */
export function stripInline(raw: string): string {
  return raw
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(LINK_RE, "$1 ($2)");
}

// ---------------------------------------------------------------- render ---

interface Tone {
  bg: string;
  fg: string;
  sub: string;
  title: string;
  border: string;
}

/**
 * Callout palettes per theme. The dark theme can't reuse the light theme's
 * white-on-white "subtle" box, so each theme declares its own set.
 */
function calloutTones(t: EmailTheme): Record<string, Tone> {
  if (t.key === "aixr") {
    return {
      subtle: { bg: t.panelBg, fg: t.strong, sub: t.body, title: t.accent, border: `1px solid ${t.panelBorder}` },
      dark: { bg: "#0B1220", fg: "#ffffff", sub: "rgba(255,255,255,0.75)", title: t.accentSoft, border: `1px solid ${t.panelBorder}` },
      violet: { bg: "#16233A", fg: "#ffffff", sub: "#B0BEC5", title: t.accentSoft, border: `1px solid ${t.accent}` },
      success: { bg: "#16261F", fg: "#A5D6A7", sub: "#A5D6A7", title: "#4CAF50", border: "1px solid rgba(46,125,50,0.5)" },
      warning: { bg: "#26200F", fg: "#F0D080", sub: "#E0C070", title: "#CA6F1E", border: "1px solid rgba(202,111,30,0.5)" },
    };
  }
  return {
    subtle: { bg: "#ffffff", fg: "#0f0f0f", sub: "#3a3a3a", title: "#2563eb", border: "1px solid rgba(0,0,0,0.06)" },
    dark: { bg: "#0f0f0f", fg: "#ffffff", sub: "rgba(255,255,255,0.75)", title: "rgba(255,255,255,0.7)", border: "none" },
    violet: { bg: "#2d2e83", fg: "#ffffff", sub: "rgba(255,255,255,0.82)", title: "rgba(255,255,255,0.8)", border: "none" },
    success: { bg: "#ecfdf5", fg: "#065f46", sub: "#047857", title: "#059669", border: "1px solid rgba(5,150,105,0.18)" },
    warning: { bg: "#fff7ed", fg: "#9a3412", sub: "#b45309", title: "#c2410c", border: "1px solid rgba(180,83,9,0.18)" },
  };
}

function chipColors(t: EmailTheme, tone: string): { bg: string; border: string; fg: string } {
  const dark = t.key === "aixr";
  switch (tone) {
    case "gold":
      return dark
        ? { bg: t.panelBg, border: "rgba(201,168,76,0.4)", fg: "#C9A84C" }
        : { bg: "#fffbeb", border: "rgba(180,83,9,0.25)", fg: "#b45309" };
    case "green":
      return dark
        ? { bg: t.panelBg, border: "rgba(46,125,50,0.4)", fg: "#A5D6A7" }
        : { bg: "#ecfdf5", border: "rgba(5,150,105,0.25)", fg: "#047857" };
    case "accent":
      return dark
        ? { bg: t.panelBg, border: "rgba(46,117,182,0.5)", fg: "#90CAF9" }
        : { bg: "#eff6ff", border: "rgba(37,99,235,0.25)", fg: "#2563eb" };
    default:
      return dark
        ? { bg: t.panelBg, border: t.panelBorder, fg: t.body }
        : { bg: "#f5f5f5", border: "rgba(0,0,0,0.08)", fg: "#3a3a3a" };
  }
}

function renderBlock(block: Block, data: MergeData, t: EmailTheme): string {
  const inline = (s: string) => renderInline(s, data, t);

  switch (block.type) {
    case "heading": {
      const eyebrow = block.eyebrow?.trim()
        ? `<div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:${t.accent};text-transform:uppercase;margin:0 0 8px;text-align:${block.align};">${inline(
            block.eyebrow
          )}</div>`
        : "";
      const size = block.level === 1 ? "30px" : "20px";
      const leading = block.level === 1 ? "1.1" : "1.3";
      // The dark AiXR identity is sentence-case; the light IMMERSIA one is uppercase.
      const transform = t.key === "aixr" ? "none" : "uppercase";
      return `${eyebrow}<h${block.level} style="font-size:${size};line-height:${leading};margin:0 0 16px;letter-spacing:-0.02em;font-weight:800;text-transform:${transform};text-align:${block.align};color:${t.heading};">${inline(
        block.text
      )}</h${block.level}>`;
    }

    case "text":
      return `<p style="font-size:15px;line-height:1.75;color:${t.body};margin:0 0 16px;text-align:${block.align};">${inline(
        block.text
      )}</p>`;

    case "button": {
      const href = safeUrl(applyMergeUrl(block.url, data));
      if (!href) return "";
      const solid = block.style === "dark";
      const bg = solid ? t.buttonBg : t.cardBg;
      const fg = solid ? t.buttonFg : t.heading;
      const radius = t.key === "aixr" ? "8px" : "999px";
      // Table-wrapped so Outlook renders the padding and background reliably.
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:10px 0 22px;"><tr><td align="${block.align}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td bgcolor="${bg}" style="background-color:${bg};border-radius:${radius};${
            solid ? `border-bottom:3px solid ${t.buttonBorder};` : `border:1.5px solid ${t.buttonBorder};`
          }">
            <a href="${esc(href)}" style="display:inline-block;color:${fg};text-decoration:none;font-weight:800;font-size:15px;padding:15px 36px;letter-spacing:0.3px;">${inline(
              block.label
            )}</a>
          </td>
        </tr></table>
      </td></tr></table>`;
    }

    case "image": {
      const src = safeUrl(applyMergeUrl(block.url, data));
      if (!src) return "";
      const img = `<img src="${esc(src)}" alt="${esc(block.alt)}" width="${block.width}" style="display:block;width:100%;max-width:${
        block.width
      }px;height:auto;border-radius:10px;margin:0 auto;border:0;">`;
      const href = block.href ? safeUrl(applyMergeUrl(block.href, data)) : null;
      return `<div style="margin:0 0 20px;text-align:center;">${
        href ? `<a href="${esc(href)}" style="text-decoration:none;">${img}</a>` : img
      }</div>`;
    }

    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map((i) => `<li style="padding:4px 0;color:${t.body};">${inline(i)}</li>`)
        .join("");
      return `<${tag} style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.6;color:${t.body};">${items}</${tag}>`;
    }

    case "callout": {
      const tones = calloutTones(t);
      const tone = tones[block.tone] ?? tones.subtle;
      const title = block.title?.trim()
        ? `<div style="font-size:10.5px;font-weight:700;letter-spacing:0.22em;color:${tone.title};text-transform:uppercase;margin:0 0 6px;">${inline(
            block.title
          )}</div>`
        : "";
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px;"><tr>
        <td bgcolor="${tone.bg}" style="background-color:${tone.bg};border:${tone.border};border-radius:10px;padding:18px 22px;color:${tone.fg};">
          ${title}<div style="font-size:14px;line-height:1.6;color:${tone.sub};">${inline(block.text)}</div>
        </td>
      </tr></table>`;
    }

    case "divider":
      return `<div style="border-top:1px solid ${t.divider};margin:10px 0 24px;font-size:0;line-height:0;">&nbsp;</div>`;

    case "details": {
      const title = block.title?.trim()
        ? `<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${t.accent};text-transform:uppercase;margin:0 0 14px;">${inline(
            block.title
          )}</div>`
        : "";
      const rows = block.rows
        .map(
          (r, i) => `<tr>
            ${
              r.icon
                ? `<td valign="top" style="padding:0 10px ${i === block.rows.length - 1 ? "0" : "10px"} 0;font-size:15px;width:22px;">${esc(
                    r.icon
                  )}</td>`
                : ""
            }
            <td valign="top" style="padding:0 12px ${
              i === block.rows.length - 1 ? "0" : "10px"
            } 0;font-size:14px;font-weight:700;color:${t.strong};white-space:nowrap;">${inline(r.label)}</td>
            <td valign="top" style="padding:0 0 ${
              i === block.rows.length - 1 ? "0" : "10px"
            } 0;font-size:14px;color:${t.key === "aixr" ? "#90A4B4" : t.body};line-height:1.5;">${inline(r.value)}</td>
          </tr>`
        )
        .join("");
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;"><tr>
        <td bgcolor="${t.panelBg}" style="background-color:${t.panelBg};border:1px solid ${t.panelBorder};border-left:4px solid ${t.accent};border-radius:8px;padding:20px 24px;">
          ${title}
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>
        </td>
      </tr></table>`;
    }

    case "chips": {
      const title = block.title?.trim()
        ? `<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${t.accentSoft};text-transform:uppercase;margin:0 0 12px;">${inline(
            block.title
          )}</div>`
        : "";
      // Chips are inline-block inside a plain div: a table row would force them
      // onto one line and overflow on mobile.
      const chips = block.items
        .map((c) => {
          const col = chipColors(t, c.tone);
          return `<span style="display:inline-block;background-color:${col.bg};border:1px solid ${col.border};border-radius:20px;padding:6px 14px;font-size:12px;color:${col.fg};font-weight:600;margin:0 6px 8px 0;">${inline(
            c.text
          )}</span>`;
        })
        .join("");
      const note = block.note?.trim()
        ? `<div style="font-size:12px;margin:6px 0 0;color:${t.muted};">${inline(block.note)}</div>`
        : "";
      return `<div style="margin:0 0 22px;">${title}<div>${chips}</div>${note}</div>`;
    }
  }
}

/** Render the block body (no shell). Used by the preview and the sender alike. */
export function renderBlocks(blocks: Blocks, data: MergeData, theme?: string): string {
  const t = getTheme(theme);
  const resolved = withAliases(data);
  const inner = blocks.map((b) => renderBlock(b, resolved, t)).join("\n");
  return applyMergeHtml(inner, resolved);
}

/** text/plain alternative — improves spam scoring and serves plain-text clients. */
export function renderBlocksText(blocks: Blocks, data: MergeData): string {
  const lines: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        if (block.eyebrow?.trim()) lines.push(stripInline(block.eyebrow).toUpperCase());
        lines.push(stripInline(block.text), "");
        break;
      case "text":
        lines.push(stripInline(block.text), "");
        break;
      case "button": {
        const href = safeUrl(applyMergeUrl(block.url, data));
        lines.push(`${stripInline(block.label)}: ${href ?? ""}`.trim(), "");
        break;
      }
      case "image": {
        const href = block.href ? safeUrl(applyMergeUrl(block.href, data)) : null;
        if (block.alt) lines.push(`[${block.alt}]${href ? ` ${href}` : ""}`, "");
        break;
      }
      case "list":
        block.items.forEach((i, idx) => lines.push(`${block.ordered ? `${idx + 1}.` : "-"} ${stripInline(i)}`));
        lines.push("");
        break;
      case "callout":
        if (block.title?.trim()) lines.push(stripInline(block.title).toUpperCase());
        lines.push(stripInline(block.text), "");
        break;
      case "divider":
        lines.push("--", "");
        break;
      case "details":
        if (block.title?.trim()) lines.push(stripInline(block.title).toUpperCase());
        block.rows.forEach((r) => lines.push(`${stripInline(r.label)}: ${stripInline(r.value)}`));
        lines.push("");
        break;
      case "chips":
        if (block.title?.trim()) lines.push(stripInline(block.title).toUpperCase());
        lines.push(block.items.map((c) => stripInline(c.text)).join(" · "));
        if (block.note?.trim()) lines.push(stripInline(block.note));
        lines.push("");
        break;
    }
  }
  // Substituted without HTML-escaping — this part is never parsed as markup.
  const resolved = withAliases(data);
  return lines
    .join("\n")
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => resolved[key] ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ------------------------------------------------------------ full email ---

export interface CampaignRenderInput {
  subject: string;
  preheader?: string;
  blocks: Blocks;
  /** Visual identity — "immersia" (light, default) or "aixr" (dark). */
  theme?: string;
  /** Header band, dark theme only. */
  header?: ShellOpts["header"];
}

export interface CampaignRenderOpts {
  /** Required for real sends; omitted only for the in-admin preview. */
  unsubscribeUrl?: string;
  /** 1×1 pixel URL, only when the campaign opts into open tracking. */
  openPixelUrl?: string;
}

/**
 * Full campaign HTML: blocks inside the brand card, inside the brand shell.
 * The unsubscribe footer is appended HERE, not authored as a block, so an
 * operator can't delete it — Gmail/Yahoo bulk rules require it on every send.
 */
export function renderCampaignHtml(
  input: CampaignRenderInput,
  data: MergeData,
  opts: CampaignRenderOpts = {}
): string {
  const t = getTheme(input.theme);
  const body = renderBlocks(input.blocks, data, input.theme);

  // The dark theme's shell already provides the full-width content cell, so the
  // blocks go in bare; the light theme floats them on a white card.
  const content =
    t.key === "aixr"
      ? body
      : `<div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      ${body}
    </div>`;

  const pixel = opts.openPixelUrl
    ? `<img src="${esc(opts.openPixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">`
    : "";

  const footerExtra = opts.unsubscribeUrl
    ? `You're getting this because you registered with IMMERSIA.
       <a href="${esc(
         opts.unsubscribeUrl
       )}" style="color:${t.footerFg};text-decoration:underline;">Unsubscribe</a> from camp updates at any time.`
    : "";

  return shell(content + pixel, {
    preheader: input.preheader,
    footerExtra,
    theme: input.theme,
    header: input.header,
  });
}

/** Plain-text campaign body, including the unsubscribe line. */
export function renderCampaignText(
  input: CampaignRenderInput,
  data: MergeData,
  opts: CampaignRenderOpts = {}
): string {
  const body = renderBlocksText(input.blocks, data);
  const footer = opts.unsubscribeUrl
    ? `\n\n---\nYou're getting this because you registered with IMMERSIA.\nUnsubscribe: ${opts.unsubscribeUrl}`
    : "";
  return `${body}${footer}`;
}

// ------------------------------------------------------------ validation ---

export interface BlockIssue {
  index: number;
  message: string;
}

/**
 * Editor-time checks that zod can't express: unknown merge tokens, user-supplied
 * tokens used inside a URL, and links that would be dropped at render time.
 * Called on save AND again before send, so a bad campaign can't reach an inbox.
 */
export function validateBlocks(blocks: Blocks): BlockIssue[] {
  const issues: BlockIssue[] = [];

  const checkTokens = (index: number, text: string, where: string) => {
    for (const token of tokensIn(text)) {
      if (!MERGE_KEYS.has(token)) {
        issues.push({ index, message: `${where} uses an unknown field {{${token}}}` });
      }
    }
  };

  const checkUrl = (index: number, url: string, where: string) => {
    for (const token of tokensIn(url)) {
      if (!URL_SAFE_MERGE_KEYS.has(token)) {
        issues.push({
          index,
          message: `${where} can't use {{${token}}} inside a link — only portal, website and unsubscribe links are allowed there`,
        });
        return;
      }
    }
    // Substitute a sample so `{{portalUrl}}` validates as the URL it becomes.
    const resolved = applyMergeUrl(url, { portalUrl: APP_URL, siteUrl: APP_URL, unsubscribeUrl: APP_URL });
    if (!safeUrl(resolved)) {
      issues.push({ index, message: `${where} isn't a valid link — use https://…, mailto:…, or /a-page` });
    }
  };

  blocks.forEach((block, index) => {
    switch (block.type) {
      case "heading":
        checkTokens(index, block.text, "Heading");
        if (block.eyebrow) checkTokens(index, block.eyebrow, "Eyebrow");
        break;
      case "text":
        checkTokens(index, block.text, "Paragraph");
        break;
      case "button":
        checkTokens(index, block.label, "Button label");
        checkUrl(index, block.url, "Button link");
        break;
      case "image":
        checkUrl(index, block.url, "Image URL");
        if (block.href) checkUrl(index, block.href, "Image link");
        break;
      case "list":
        block.items.forEach((i) => checkTokens(index, i, "List item"));
        break;
      case "callout":
        checkTokens(index, block.text, "Callout");
        if (block.title) checkTokens(index, block.title, "Callout title");
        break;
      case "divider":
        break;
      case "details":
        if (block.title) checkTokens(index, block.title, "Details title");
        block.rows.forEach((r) => {
          checkTokens(index, r.label, "Details label");
          checkTokens(index, r.value, "Details value");
        });
        break;
      case "chips":
        if (block.title) checkTokens(index, block.title, "Chips title");
        block.items.forEach((c) => checkTokens(index, c.text, "Chip"));
        if (block.note) checkTokens(index, block.note, "Chips note");
        break;
    }

    // Inline links inside body copy get the same URL treatment as buttons.
    const inlineSources =
      block.type === "text" || block.type === "callout"
        ? [block.text]
        : block.type === "list"
          ? block.items
          : [];
    for (const src of inlineSources) {
      for (const m of src.matchAll(LINK_RE)) {
        checkUrl(index, m[2], `Link "${m[1]}"`);
      }
    }
  });

  return issues;
}

/** A sensible starting document for a new campaign. */
export function starterBlocks(): Blocks {
  return [
    { id: "b1", type: "heading", eyebrow: "Camp update", text: "Hi {{firstName}}", level: 1, align: "left" },
    {
      id: "b2",
      type: "text",
      text: "Write your update here. Use **bold**, *italic* and [links](https://immersia.ng), and drop in fields like {{participantName}} or {{cohortLabel}}.",
      align: "left",
    },
    { id: "b3", type: "button", label: "Open my portal", url: "{{portalUrl}}", style: "dark", align: "center" },
  ];
}
