/**
 * Stateless one-click unsubscribe tokens (RFC 8058).
 *
 * Gmail/Yahoo bulk-sender rules require a List-Unsubscribe-Post endpoint that
 * works with **no login and no session** — so the token has to be self-verifying
 * from the URL alone. We HMAC the email with JWT_SECRET rather than storing a
 * row per recipient: nothing to expire, nothing to clean up, and the link keeps
 * working after the campaign is long gone (recipients unsubscribe from old mail).
 *
 * Deliberately NOT time-limited: an expired unsubscribe link is a compliance
 * failure, not a security win. The token only ever grants "stop emailing this
 * address", which is safe for anyone to trigger.
 */
import crypto from "crypto";
import { JWT_SECRET } from "@/lib/jwt-secret";

/** Domain separator so an unsubscribe token can't be replayed as another kind. */
const PURPOSE = "unsub:v1";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded + "=".repeat((4 - (padded.length % 4)) % 4), "base64");
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** JWT_SECRET is a Uint8Array (jose format) — hand it to crypto as a Buffer. */
function key(): Buffer {
  return Buffer.from(JWT_SECRET);
}

function sign(payload: string): string {
  return base64url(crypto.createHmac("sha256", key()).update(`${PURPOSE}:${payload}`).digest());
}

/**
 * Mint `<base64url(email)>.<hmac>`. The email is recoverable from the token so
 * the endpoint can suppress the right address without a campaign lookup.
 */
export function mintUnsubscribeToken(email: string): string {
  const payload = base64url(Buffer.from(normalize(email), "utf8"));
  return `${payload}.${sign(payload)}`;
}

/** Returns the email the token authorises, or null if it doesn't verify. */
export function verifyUnsubscribeToken(token: string): string | null {
  if (typeof token !== "string" || token.length > 512) return null;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const payload = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(payload);

  // Length check first: timingSafeEqual throws on a length mismatch.
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;

  const email = fromBase64url(payload).toString("utf8");
  // Cheap sanity check — a verified token should always hold a real address.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** The public one-click URL Gmail POSTs to, and the footer link points at. */
export function unsubscribeUrl(email: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/api/e/u/${mintUnsubscribeToken(email)}`;
}

/**
 * Open-tracking pixel URL. Signed with the message id (not the email) so the
 * pixel URL can't be reversed into a mailing list.
 */
export function openPixelUrl(messageId: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const payload = base64url(Buffer.from(String(messageId), "utf8"));
  return `${base}/api/e/o/${payload}.${sign(payload)}`;
}

/** Returns the message id the pixel token refers to, or null. */
export function verifyOpenToken(token: string): string | null {
  if (typeof token !== "string" || token.length > 512) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const payload = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(payload);

  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;

  const id = fromBase64url(payload).toString("utf8");
  return /^[a-f0-9]{24}$/i.test(id) ? id : null;
}

/**
 * RFC 8058 headers. Both are required for Gmail's native "Unsubscribe" button:
 * the URL alone is not enough — `List-Unsubscribe-Post` is what makes it
 * one-click instead of a landing page.
 */
export function unsubscribeHeaders(email: string, baseUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(email, baseUrl)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
