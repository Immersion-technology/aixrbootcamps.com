import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { LoginToken, type LoginTokenRole } from "@/models/LoginToken";
import { Types } from "mongoose";

/**
 * Passwordless magic-link tokens shared by the parent + teacher portals.
 *
 * - The raw token is a 256-bit random value; we persist only its SHA-256 hash.
 * - Tokens are single-use and expire after TOKEN_TTL_MS.
 * - The verify route lives under each portal: /account/login/verify (parent)
 *   and /teacher/login/verify (teacher).
 */

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function verifyPath(role: LoginTokenRole): string {
  return role === "parent" ? "/account/login/verify" : "/teacher/login/verify";
}

/**
 * Mint a one-time login token for an account and return the full clickable URL.
 * Caller is responsible for emailing the URL.
 */
export async function issueLoginLink(opts: {
  role: LoginTokenRole;
  accountId: Types.ObjectId | string;
  email: string;
  baseUrl: string;
}): Promise<string> {
  await connectDB();
  const raw = crypto.randomBytes(32).toString("hex");
  await LoginToken.create({
    tokenHash: hashToken(raw),
    role: opts.role,
    accountId: new Types.ObjectId(opts.accountId),
    email: opts.email.toLowerCase().trim(),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });
  const base = opts.baseUrl.replace(/\/+$/, "");
  return `${base}${verifyPath(opts.role)}?token=${raw}`;
}

/**
 * Validate + consume a token. Returns the account it belongs to, or null if the
 * token is unknown, already used, expired, or for a different role. Marks the
 * token used atomically so a second click fails.
 */
export async function consumeLoginToken(
  rawToken: string,
  role: LoginTokenRole
): Promise<{ accountId: string; email: string } | null> {
  if (!rawToken || typeof rawToken !== "string") return null;
  await connectDB();

  const doc = await LoginToken.findOneAndUpdate(
    {
      tokenHash: hashToken(rawToken),
      role,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: true }
  ).lean();

  if (!doc) return null;
  return { accountId: String(doc.accountId), email: doc.email };
}
