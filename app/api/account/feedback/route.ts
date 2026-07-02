import { NextResponse } from "next/server";
import { z } from "zod";
import { getParentFromCookie } from "@/lib/account-auth";
import { connectDB } from "@/lib/db";
import { sendMail, parentFeedbackHtml } from "@/lib/mailer";
import { getClientIp, rateLimit } from "@/lib/utils";
import { getSetting, SETTING_KEYS } from "@/models/Setting";

export const dynamic = "force-dynamic";

const schema = z.object({
  message: z.string().trim().min(5, "Write a little more before sending.").max(2000, "Keep it under 2000 characters."),
});

export async function POST(req: Request) {
  const parent = await getParentFromCookie();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req.headers);
  if (!rateLimit(`parent-feedback:ip:${ip}`, 6, 60_000) || !rateLimit(`parent-feedback:email:${parent.email.toLowerCase()}`, 6, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    await connectDB();
    const adminEmail = await getSetting<string>(
      SETTING_KEYS.ADMIN_ALERT_EMAIL,
      process.env.ADMIN_ALERT_EMAIL ?? "registrations@immersia.ng"
    );

    await sendMail({
      to: adminEmail,
      subject: `Parent dashboard feedback from ${parent.name}`,
      replyTo: parent.email,
      html: parentFeedbackHtml({
        parentName: parent.name,
        parentEmail: parent.email,
        message: parsed.data.message,
        submittedAt: new Date().toISOString(),
      }),
      text: [
        `Parent: ${parent.name}`,
        `Email: ${parent.email}`,
        `Submitted: ${new Date().toISOString()}`,
        "",
        parsed.data.message,
      ].join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[parent-feedback]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
