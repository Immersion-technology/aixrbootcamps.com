import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { JWT_SECRET as SECRET } from "@/lib/jwt-secret";

const COOKIE_NAME = "immersia_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours
// Audience-scope the admin token so a parent/teacher JWT (signed with the same
// JWT_SECRET) can NOT be replayed in the admin cookie to escalate privilege.
const AUDIENCE = "admin";

export interface AdminPayload {
  sub: string;
  email: string;
  name: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { audience: AUDIENCE });
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearAdminCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
