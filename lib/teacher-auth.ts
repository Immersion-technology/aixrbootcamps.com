import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { JWT_SECRET as SECRET } from "@/lib/jwt-secret";
import { AUTH_BYPASS, DEV_TEACHER } from "@/lib/dev-auth";

/**
 * Teacher-side auth: separate cookie + JWT audience from admin/parent so a
 * teacher never gets accidental scope into another portal. Same JWT_SECRET,
 * different audience claim + cookie name. Login is passwordless (magic link);
 * this module only handles the resulting session.
 */

const COOKIE_NAME = "immersia_teacher";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const AUDIENCE = "teacher";

export interface TeacherPayload {
  sub: string; // Teacher _id
  email: string;
  name: string;
}

export async function signTeacherToken(payload: TeacherPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifyTeacherToken(token: string): Promise<TeacherPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { audience: AUDIENCE });
    return payload as unknown as TeacherPayload;
  } catch {
    return null;
  }
}

export function setTeacherCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearTeacherCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getTeacherFromCookie(): Promise<TeacherPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifyTeacherToken(token) : null;
  if (payload) return payload;
  if (AUTH_BYPASS) return DEV_TEACHER; // dev-only preview, see lib/dev-auth.ts
  return null;
}

export const TEACHER_COOKIE_NAME = COOKIE_NAME;
export const TEACHER_JWT_AUDIENCE = AUDIENCE;
