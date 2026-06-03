import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Teacher } from "@/models/Teacher";
import { consumeLoginToken } from "@/lib/magic-link";
import { signTeacherToken, setTeacherCookie } from "@/lib/teacher-auth";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(10) });

// Consume a one-time login token and establish the teacher session. POST-only
// (the verify page auto-submits) so email link-scanners can't burn the token.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
  }

  try {
    await connectDB();
    const result = await consumeLoginToken(parsed.data.token, "teacher");
    if (!result) {
      return NextResponse.json({ error: "This link is invalid, used, or expired." }, { status: 401 });
    }

    const teacher = await Teacher.findById(result.accountId);
    if (!teacher || !teacher.isActive) {
      return NextResponse.json({ error: "Account not found or inactive." }, { status: 404 });
    }

    const token = await signTeacherToken({ sub: String(teacher._id), email: teacher.email, name: teacher.name });
    setTeacherCookie(token);
    teacher.lastLoginAt = new Date();
    await teacher.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[teacher-login verify]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
