import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ParentAccount } from "@/models/ParentAccount";
import { hashPassword } from "@/lib/auth";
import { signParentToken, setParentCookie } from "@/lib/account-auth";
import { getClientIp, rateLimit } from "@/lib/utils";

const schema = z.object({
  token: z.string().min(8, "Setup token missing"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "That password is too long"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`parent-setup:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    await connectDB();
    const acct = await ParentAccount.findOne({
      passwordSetupToken: parsed.data.token,
    });
    if (!acct) {
      return NextResponse.json({ error: "That setup link is invalid or already used." }, { status: 400 });
    }
    if (acct.passwordSetupExpiresAt && acct.passwordSetupExpiresAt < new Date()) {
      return NextResponse.json({ error: "That setup link has expired. Ask the team for a fresh one." }, { status: 400 });
    }

    acct.passwordHash = await hashPassword(parsed.data.password);
    acct.passwordSetupToken = undefined;
    acct.passwordSetupExpiresAt = undefined;
    acct.lastLoginAt = new Date();
    await acct.save();

    const token = await signParentToken({
      sub: String(acct._id),
      email: acct.email,
      name: acct.name,
    });
    setParentCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[parent-setup]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
