import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminCookie();
  return NextResponse.redirect(new URL("/admin/login", process.env.APP_URL ?? "http://localhost:3000"));
}
