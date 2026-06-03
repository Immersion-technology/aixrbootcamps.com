import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Teacher } from "@/models/Teacher";
import { issueLoginLink } from "@/lib/magic-link";
import { sendMail, magicLinkHtml } from "@/lib/mailer";
import { getClientIp, rateLimit } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

// Passwordless: request a one-time login link. Generic response (no enumeration).
export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const email = parsed.data.email;

  if (!rateLimit(`teacher-login:ip:${ip}`, 8, 60_000) || !rateLimit(`teacher-login:email:${email}`, 4, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  try {
    await connectDB();
    const teacher = await Teacher.findOne({ email, isActive: true }).lean();
    if (teacher) {
      const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
      const url = await issueLoginLink({
        role: "teacher",
        accountId: String(teacher._id),
        email,
        baseUrl: appUrl,
      });
      // Fire-and-forget so response time doesn't reveal whether the email exists.
      void sendMail({
        to: email,
        subject: "Your IMMERSIA facilitator portal login link",
        html: magicLinkHtml({ name: teacher.name, url, role: "teacher" }),
      }).catch((e) => console.error("[teacher-login mail]", e));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[teacher-login]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
