import { NextResponse } from "next/server";
import { clearTeacherCookie } from "@/lib/teacher-auth";

export async function POST() {
  clearTeacherCookie();
  return NextResponse.redirect(new URL("/teacher/login", process.env.APP_URL ?? "http://localhost:3000"));
}
