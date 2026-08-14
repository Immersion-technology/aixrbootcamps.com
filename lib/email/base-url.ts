/**
 * The public base URL used for links INSIDE emails.
 *
 * This is deliberately separate from `APP_URL`. `APP_URL` is the running
 * server's own address — in development that's `http://localhost:3000`, which is
 * correct for the app and catastrophic for email:
 *
 *   - every link in the message 404s for the recipient
 *   - the one-click unsubscribe points at a host only you can reach, which
 *     breaks the RFC 8058 contract Gmail and Yahoo require of bulk senders
 *   - "http://localhost" in the body is a strong spam signal on its own
 *
 * A real send therefore resolves a PUBLIC https origin and refuses to proceed
 * without one, rather than silently shipping dead links.
 */

/**
 * The live public site. Hardcoded as the final fallback so email links can
 * never degrade to localhost, whatever the environment looks like.
 */
export const LIVE_SITE_URL = "https://www.aixrbootcamp.com";

const PRIVATE_HOST = /^(localhost|127\.|0\.0\.0\.0|::1|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i;

/** True when a URL can't be opened by someone outside this machine/network. */
export function isPrivateUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return PRIVATE_HOST.test(host) || !host.includes(".");
  } catch {
    return true;
  }
}

function clean(url: string | undefined | null): string {
  return (url ?? "").trim().replace(/\/+$/, "");
}

/**
 * Resolve the origin to use for links in outgoing email.
 *
 * Order: an explicit override, then the canonical public site URL, then
 * APP_URL as a last resort (fine in production, rejected in dev by the guard).
 */
export function publicBaseUrl(fallback?: string): string {
  const candidates = [
    process.env.EMAIL_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    fallback,
    // Hardcoded last resort — an email link must never be localhost.
    LIVE_SITE_URL,
  ].map(clean);

  // Prefer the first public https origin.
  const publicHttps = candidates.find((u) => u && u.startsWith("https://") && !isPrivateUrl(u));
  if (publicHttps) return publicHttps;

  // Otherwise any public origin at all.
  const anyPublic = candidates.find((u) => u && !isPrivateUrl(u));
  if (anyPublic) return anyPublic;

  return candidates.find(Boolean) ?? "";
}

/**
 * Throw rather than send email containing unreachable links.
 *
 * Called on every real send path (campaign drain, test send, preview send). The
 * in-admin HTML preview is exempt — nothing leaves the browser there.
 */
export function assertSendableBaseUrl(url: string): string {
  const base = clean(url);

  if (!base) {
    throw new Error(
      "No public URL configured for email links. Set EMAIL_BASE_URL (or NEXT_PUBLIC_SITE_URL) " +
        "to your live site, e.g. https://www.aixrbootcamp.com"
    );
  }

  if (isPrivateUrl(base)) {
    throw new Error(
      `Refusing to send: email links would point at "${base}", which recipients cannot open. ` +
        "Every link — including the one-click unsubscribe — would be dead, and the message would " +
        "almost certainly be filed as spam.\n\n" +
        "Set EMAIL_BASE_URL to your live site before sending, e.g.\n" +
        "  EMAIL_BASE_URL=https://www.aixrbootcamp.com"
    );
  }

  return base;
}

/** Convenience: resolve and validate in one step. */
export function sendableBaseUrl(fallback?: string): string {
  return assertSendableBaseUrl(publicBaseUrl(fallback));
}
