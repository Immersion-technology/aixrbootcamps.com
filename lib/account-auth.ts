import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Parent-side auth — separate cookie + JWT from the admin auth so a parent
 * never gets accidental admin scope and vice versa. Uses the same JWT_SECRET
 * but a different audience claim + cookie name.
 *
 * Password hashing uses bcrypt via the existing helpers in lib/auth.ts —
 * import those there if you need to hash/verify a password.
 */

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-do-not-use-in-prod-please-change"
);
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
  if (!token) return null;
  return verifyParentToken(token);
}

export const PARENT_COOKIE_NAME = COOKIE_NAME;
export const PARENT_JWT_AUDIENCE = AUDIENCE;
