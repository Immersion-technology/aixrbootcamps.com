import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ParentAccount } from "@/models/ParentAccount";
import { issueLoginLink } from "@/lib/magic-link";
import { sendMail, magicLinkHtml } from "@/lib/mailer";
import { getClientIp, rateLimit } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

// Passwordless: request a one-time login link. Always responds the same way
// whether or not the email exists (no account enumeration).
export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const email = parsed.data.email;

  // Rate-limit per-IP AND per-email to blunt abuse / inbox flooding.
  if (!rateLimit(`parent-login:ip:${ip}`, 8, 60_000) || !rateLimit(`parent-login:email:${email}`, 4, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  try {
    await connectDB();
    const acct = await ParentAccount.findOne({ email }).lean();
    if (acct) {
      const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
      const url = await issueLoginLink({
        role: "parent",
        accountId: String(acct._id),
        email,
        baseUrl: appUrl,
      });
      // Fire-and-forget so response time doesn't reveal whether the email exists.
      void sendMail({
        to: email,
        subject: "Your IMMERSIA parent portal login link",
        html: magicLinkHtml({ name: acct.name, url, role: "parent" }),
      }).catch((e) => console.error("[parent-login mail]", e));
    }
    // Generic response regardless of whether the account exists.
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[parent-login]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
