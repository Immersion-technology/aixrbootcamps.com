import { NextResponse } from "next/server";
import { clearParentCookie } from "@/lib/account-auth";

export async function POST() {
  clearParentCookie();
  return NextResponse.redirect(new URL("/account/login", process.env.APP_URL ?? "http://localhost:3000"));
}
