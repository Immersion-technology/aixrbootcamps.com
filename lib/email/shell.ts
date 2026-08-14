/**
 * The IMMERSIA / AiXR email shells, shared by transactional mail
 * (lib/mailer.ts) and admin campaigns (lib/email/*). Extracted so both paths
 * can never drift apart.
 *
 * Everything is table-based with inline styles. Email clients don't support
 * backdrop-filter, flexbox, CSS grid or `<style>` reliably (Outlook uses Word's
 * rendering engine), so the frosted-glass look is approximated with solid fills
 * and nested tables.
 */
import { getTheme, type EmailTheme, type ThemeKey } from "./themes";
import { publicBaseUrl } from "./base-url";

/**
 * Origin for every link and image in an email.
 *
 * Resolved from the PUBLIC site URL, never the server's own `APP_URL` — in
 * development that is localhost, and a footer link to localhost is both dead for
 * the recipient and a strong spam signal. See lib/email/base-url.ts.
 */
export const APP_URL = publicBaseUrl("https://www.aixrbootcamp.com");
export const LOGO_URL = `${APP_URL}/logo.png`;

/**
 * Escape user-supplied values before interpolating them into email HTML.
 * Names, notes, merge values etc. come from registrations / admin input and must
 * not be able to inject markup into the email body.
 */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ShellOpts {
  /**
   * Hidden preview text shown by Gmail/Apple Mail next to the subject line.
   * Padded so the client doesn't spill body copy into the preview.
   */
  preheader?: string;
  /**
   * Campaign-only footer line, e.g. the unsubscribe link. Transactional mail
   * omits this — receipts and login links are not marketing and must not carry
   * an unsubscribe affordance.
   */
  footerExtra?: string;
  /** Visual identity. Defaults to the light IMMERSIA shell. */
  theme?: ThemeKey | string;
  /** Optional eyebrow/title band shown above the content (AiXR header). */
  header?: {
    eyebrow?: string;
    title?: string;
    titleAccent?: string;
    subtitle?: string;
    badges?: string[];
  };
}

function preheaderBlock(text: string | undefined): string {
  if (!text?.trim()) return "";
  // The padding characters stop the client pulling body copy into the preview.
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(
    text
  )}${"&#8199;&#65279;&#847; ".repeat(60)}</div>`;
}

/** Light IMMERSIA header: just the logo. */
function immersiaHeader(t: EmailTheme): string {
  return `<tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${LOGO_URL}" alt="IMMERSIA" width="72" style="display:block;height:auto;border:0;">
            </td>
          </tr>`;
}

/**
 * AiXR header band: navy fill, gold eyebrow, big title, pill badges.
 * `bgcolor` is set alongside the inline style because Outlook ignores CSS
 * backgrounds on table cells.
 */
function aixrHeader(t: EmailTheme, header: NonNullable<ShellOpts["header"]>): string {
  const badges = (header.badges ?? [])
    .map(
      (b, i) =>
        `<td style="padding:0 4px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${
          i === 0 ? "#2F4A63" : "#2A4159"
        }" style="background-color:${
          i === 0 ? "#2F4A63" : "#2A4159"
        };border:1px solid ${
          i === 0 ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.2)"
        };border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;color:${
          i === 0 ? "#C9A84C" : "#FFFFFF"
        };white-space:nowrap;">${esc(b)}</td></tr></table></td>`
    )
    .join("");

  return `<tr>
            <td bgcolor="${t.headerBg}" style="background-color:${t.headerBg};padding:44px 32px 36px;text-align:center;">
              ${
                header.eyebrow
                  ? `<div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${t.accentSoft};margin-bottom:16px;">${esc(
                      header.eyebrow
                    )}</div>`
                  : ""
              }
              ${
                header.title
                  ? `<div style="font-size:34px;font-weight:900;color:${t.headerFg};line-height:1.12;letter-spacing:-0.5px;margin-bottom:8px;">${esc(
                      header.title
                    )}${
                      header.titleAccent
                        ? ` <span style="color:${t.accentSoft};">${esc(header.titleAccent)}</span>`
                        : ""
                    }</div>`
                  : ""
              }
              ${
                header.subtitle
                  ? `<div style="font-size:13px;color:${t.headerSubFg};letter-spacing:1px;text-transform:uppercase;margin-bottom:${
                      badges ? "24px" : "0"
                    };">${esc(header.subtitle)}</div>`
                  : ""
              }
              ${
                badges
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>${badges}</tr></table>`
                  : ""
              }
            </td>
          </tr>
          <tr><td style="height:4px;line-height:4px;font-size:0;" bgcolor="${t.ruleColor}">&nbsp;</td></tr>`;
}

/** Wraps content in the branded layout for the chosen theme. */
export function shell(content: string, opts: ShellOpts = {}): string {
  const t = getTheme(opts.theme);
  const isDark = t.key === "aixr";

  const header =
    isDark && opts.header ? aixrHeader(t, opts.header) : isDark ? "" : immersiaHeader(t);

  const footerExtra = opts.footerExtra
    ? `<tr>
            <td style="padding:14px 0 0;text-align:center;font-size:11px;color:${t.footerFg};line-height:1.6;">
              ${opts.footerExtra}
            </td>
          </tr>`
    : "";

  // Light theme keeps its original venue/contact footer; the dark theme uses a
  // more compact AiXR footer.
  const footer = isDark
    ? `<tr>
            <td bgcolor="${t.footerBg}" style="background-color:${t.footerBg};border-top:1px solid ${t.footerBorder};padding:26px 32px;text-align:center;">
              <div style="font-size:13px;font-weight:800;color:${t.accent};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
                Immersia Virtual Reality
              </div>
              <div style="margin-bottom:12px;font-size:12px;">
                <a href="${APP_URL}" style="color:${t.footerFg};text-decoration:none;margin:0 8px;">Boot Camp Portal</a>
                <span style="color:${t.panelBorder};">|</span>
                <a href="${APP_URL}/register" style="color:${t.footerFg};text-decoration:none;margin:0 8px;">Register</a>
                <span style="color:${t.panelBorder};">|</span>
                <a href="mailto:hello@aixrbootcamp.com" style="color:${t.footerFg};text-decoration:none;margin:0 8px;">hello@aixrbootcamp.com</a>
              </div>
              <div style="font-size:11px;color:${t.panelBorder};line-height:1.6;">
                You received this email because you registered for the AiXR Summer Tech Boot Camp 2026.<br>
                © 2026 Immersia Virtual Reality. Lagos, Nigeria. All rights reserved.
              </div>
            </td>
          </tr>
          ${footerExtra}`
    : `<tr>
            <td style="padding:32px 0 8px;text-align:center;font-size:11px;color:${t.muted};letter-spacing:0.18em;text-transform:uppercase;">
              <strong style="color:${t.accent};">99 Adesanya Ogunsanya, Leisure Mall</strong> · 27 July – 4 September 2026 · Mon–Fri 9am–1:30pm · In-person in Lagos or online
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0 0;text-align:center;font-size:11px;color:${t.footerFg};">
              <a href="${APP_URL}" style="color:${t.accent};text-decoration:none;font-weight:600;">immersia.ng</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}/contact" style="color:${t.footerFg};text-decoration:none;">Contact</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}/faq" style="color:${t.footerFg};text-decoration:none;">FAQ</a>
            </td>
          </tr>
${footerExtra}
          <tr>
            <td style="padding:24px 0 0;text-align:center;font-size:10.5px;color:#bbb;">
              © 2026 IMMERSIA. All rights reserved.
            </td>
          </tr>`;

  // The dark theme runs edge-to-edge (header band + body + footer with no gap);
  // the light theme floats a card on a padded background.
  const outerPadding = isDark ? "0" : "32px 16px";
  const contentCell = isDark
    ? `<tr><td bgcolor="${t.cardBg}" style="background-color:${t.cardBg};padding:36px 32px 30px;">${content}</td></tr>`
    : `<tr><td>${content}</td></tr>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="format-detection" content="telephone=no" />
  <title>IMMERSIA</title>
  <!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${t.pageBg};font-family:${t.fontStack};color:${t.body};-webkit-font-smoothing:antialiased;">
  ${preheaderBlock(opts.preheader)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.pageBg}" style="background-color:${t.pageBg};padding:${outerPadding};">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;">
${header}
${contentCell}
${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
