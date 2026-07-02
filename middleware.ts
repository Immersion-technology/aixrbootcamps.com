import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET as SECRET } from "@/lib/jwt-secret";
import { AUTH_BYPASS } from "@/lib/dev-auth";
const ADMIN_COOKIE = "immersia_admin";
const PARENT_COOKIE = "immersia_parent";
const TEACHER_COOKIE = "immersia_teacher";

// Public exemptions inside each auth-gated tree.
// NOTE: middleware is an OPTIMISTIC redirect layer only (CVE-2025-29927) —
// every protected page/route re-verifies the session server-side.
const ADMIN_PUBLIC = new Set(["/admin/login"]);
const PARENT_PUBLIC_PREFIXES = ["/account/login"];
const TEACHER_PUBLIC_PREFIXES = ["/teacher/login"];
const ADMIN_API_PUBLIC = ["/api/admin/auth/login"];
const PARENT_API_PUBLIC = ["/api/account/login"];
const TEACHER_API_PUBLIC = ["/api/teacher/login"];

export async function middleware(req: NextRequest) {
  // Dev-only: skip all portal redirects so gated pages can be previewed without
  // logging in. Only active when AUTH_BYPASS=1 — see lib/dev-auth.ts.
  if (AUTH_BYPASS) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // ---------- admin tree ----------
  const isAdminPage = pathname.startsWith("/admin") && !ADMIN_PUBLIC.has(pathname);
  const isAdminApi =
    pathname.startsWith("/api/admin") && !ADMIN_API_PUBLIC.some((p) => pathname.startsWith(p));

  if (isAdminPage || isAdminApi) {
    return checkAuth(req, ADMIN_COOKIE, "/admin/login", isAdminApi);
  }

  // ---------- parent tree ----------
  const isParentPage =
    pathname.startsWith("/account") && !PARENT_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isParentApi =
    pathname.startsWith("/api/account") && !PARENT_API_PUBLIC.some((p) => pathname.startsWith(p));

  if (isParentPage || isParentApi) {
    return checkAuth(req, PARENT_COOKIE, "/account/login", isParentApi);
  }

  // ---------- teacher tree ----------
  const isTeacherPage =
    pathname.startsWith("/teacher") && !TEACHER_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isTeacherApi =
    pathname.startsWith("/api/teacher") && !TEACHER_API_PUBLIC.some((p) => pathname.startsWith(p));

  if (isTeacherPage || isTeacherApi) {
    return checkAuth(req, TEACHER_COOKIE, "/teacher/login", isTeacherApi);
  }

  return NextResponse.next();
}

async function checkAuth(req: NextRequest, cookieName: string, loginPath: string, isApi: boolean) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return redirectOrUnauthorized(req, loginPath, isApi);
  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return redirectOrUnauthorized(req, loginPath, isApi);
  }
}

function redirectOrUnauthorized(req: NextRequest, loginPath: string, isApi: boolean) {
  if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/account/:path*",
    "/api/account/:path*",
    "/teacher/:path*",
    "/api/teacher/:path*",
  ],
};
