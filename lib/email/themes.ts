/**
 * Email themes.
 *
 * Two visual identities share one renderer:
 *  - `immersia` — the original light/cream shell used by transactional mail
 *    (receipts, login links) and by campaigns that should match the website.
 *  - `aixr` — the dark navy/gold AiXR Boot Camp identity.
 *
 * Everything here is a design token consumed by the block renderer, so adding a
 * theme never means forking the renderer. Colours are plain hex on purpose:
 * gradients, CSS variables and colour functions are unreliable across Outlook,
 * Gmail's web client and older Apple Mail.
 */

export type ThemeKey = "immersia" | "aixr";

export interface EmailTheme {
  key: ThemeKey;
  label: string;
  /** Outer page background. */
  pageBg: string;
  /** The main content card. */
  cardBg: string;
  cardBorder: string;
  cardRadius: string;
  /** Inset panels (callouts, detail boxes) sitting on the card. */
  panelBg: string;
  panelBorder: string;
  /** Text. */
  heading: string;
  body: string;
  strong: string;
  muted: string;
  /** Brand accents. */
  accent: string;
  accentSoft: string;
  /** Buttons. */
  buttonBg: string;
  buttonFg: string;
  buttonBorder: string;
  /** Header band behind the logo/title. */
  headerBg: string;
  headerFg: string;
  headerSubFg: string;
  /** Thin rule under the header. */
  ruleColor: string;
  /** Footer. */
  footerBg: string;
  footerFg: string;
  footerBorder: string;
  /** Divider lines inside the card. */
  divider: string;
  /** Link colour inside body copy. */
  link: string;
  fontStack: string;
}

const SANS =
  "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";

export const THEMES: Record<ThemeKey, EmailTheme> = {
  immersia: {
    key: "immersia",
    label: "IMMERSIA (light)",
    pageBg: "#f1f1f1",
    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,0,0.06)",
    cardRadius: "24px",
    panelBg: "#ffffff",
    panelBorder: "rgba(0,0,0,0.06)",
    heading: "#0f0f0f",
    body: "#3a3a3a",
    strong: "#0f0f0f",
    muted: "#777777",
    accent: "#2563eb",
    accentSoft: "#2d2e83",
    buttonBg: "#0f0f0f",
    buttonFg: "#ffffff",
    buttonBorder: "rgba(0,0,0,0.12)",
    headerBg: "#f1f1f1",
    headerFg: "#0f0f0f",
    headerSubFg: "#777777",
    ruleColor: "#2563eb",
    footerBg: "#f1f1f1",
    footerFg: "#999999",
    footerBorder: "rgba(0,0,0,0.06)",
    divider: "rgba(0,0,0,0.08)",
    link: "#2563eb",
    fontStack: `'Space Grotesk',${SANS}`,
  },

  aixr: {
    key: "aixr",
    label: "AiXR Boot Camp (dark)",
    pageBg: "#0D1117",
    cardBg: "#111827",
    cardBorder: "#1E2D42",
    cardRadius: "0px",
    panelBg: "#1A2332",
    panelBorder: "#2E3F55",
    heading: "#FFFFFF",
    body: "#B0BEC5",
    strong: "#E8EDF2",
    muted: "#6E8EA6",
    accent: "#2E75B6",
    accentSoft: "#C9A84C",
    buttonBg: "#1F4E79",
    buttonFg: "#FFFFFF",
    buttonBorder: "#1A3F63",
    headerBg: "#1F4E79",
    headerFg: "#FFFFFF",
    headerSubFg: "rgba(255,255,255,0.65)",
    ruleColor: "#C9A84C",
    footerBg: "#0D1117",
    footerFg: "#4A6070",
    footerBorder: "#1E2D42",
    divider: "#1E2D42",
    link: "#90CAF9",
    fontStack: SANS,
  },
};

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export function getTheme(key?: string | null): EmailTheme {
  return THEMES[(key ?? "immersia") as ThemeKey] ?? THEMES.immersia;
}
