/**
 * Single source of the HMAC key for ALL session JWTs (admin / parent / teacher).
 *
 * Fail-fast: in production we refuse to boot on a missing/weak JWT_SECRET,
 * because the dev fallback would make every session token forgeable across all
 * three portals. Edge-safe (no heavy imports) so middleware can use it too.
 */
const raw = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && (!raw || raw.length < 32)) {
  throw new Error(
    "JWT_SECRET must be set to a strong value (at least 32 characters) in production."
  );
}

export const JWT_SECRET = new TextEncoder().encode(
  raw ?? "fallback-do-not-use-in-prod-please-change"
);
