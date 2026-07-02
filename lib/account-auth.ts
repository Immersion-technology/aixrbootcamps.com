import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { JWT_SECRET as SECRET } from "@/lib/jwt-secret";
import { AUTH_BYPASS, DEV_PARENT } from "@/lib/dev-auth";

/**
 * Parent-side auth: separate cookie + JWT from the admin auth so a parent
 * never gets accidental admin scope and vice versa. Uses the same JWT_SECRET
 * but a different audience claim + cookie name.
 */

const COOKIE_NAME = "immersia_parent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const AUDIENCE = "parent";

export interface ParentPayload {
  sub: string;       // ParentAccount _id
  email: string;
  name: string;
}

export async function signParentToken(payload: ParentPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifyParentToken(token: string): Promise<ParentPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { audience: AUDIENCE });
    return payload as unknown as ParentPayload;
  } catch {
    return null;
  }
}

export function setParentCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearParentCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getParentFromCookie(): Promise<ParentPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifyParentToken(token) : null;
  if (payload) return payload;
  if (AUTH_BYPASS) return resolveDevParent(); // dev-only preview, see lib/dev-auth.ts
  return null;
}

/**
 * Dev-only: impersonate a REAL parent so the portal shows real campers/attendance
 * (a synthetic email would render an empty dashboard). Targets DEV_PARENT_EMAIL
 * if set, otherwise the most recent paid registration's parent. Lazy DB imports
 * keep this off the hot path unless the bypass is actually used.
 */
async function resolveDevParent(): Promise<ParentPayload> {
  try {
    const { connectDB } = await import("@/lib/db");
    const { Registration } = await import("@/models/Registration");
    await connectDB();
    const target = process.env.DEV_PARENT_EMAIL?.toLowerCase().trim();
    const reg = (await Registration.findOne(target ? { "parent.email": target } : { paymentStatus: "paid" })
      .sort({ createdAt: -1 })
      .select("parent")
      .lean()) as { parent?: { email?: string; fullName?: string } } | null;
    if (reg?.parent?.email) {
      return { sub: "dev-parent", email: reg.parent.email, name: reg.parent.fullName ?? DEV_PARENT.name };
    }
  } catch {
    // fall through to the synthetic identity below
  }
  return DEV_PARENT;
}

export const PARENT_COOKIE_NAME = COOKIE_NAME;
export const PARENT_JWT_AUDIENCE = AUDIENCE;
