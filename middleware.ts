import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-do-not-use-in-prod"
);
const COOKIE = "immersia_admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // protected admin routes (except the login page + login API)
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi =
    pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth/login");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return redirectOrUnauthorized(req, isAdminApi);

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return redirectOrUnauthorized(req, isAdminApi);
  }
}

function redirectOrUnauthorized(req: NextRequest, isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
