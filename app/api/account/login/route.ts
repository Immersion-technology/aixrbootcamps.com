import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ParentAccount } from "@/models/ParentAccount";
import { verifyPassword } from "@/lib/auth";
import { signParentToken, setParentCookie } from "@/lib/account-auth";
import { getClientIp, rateLimit } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`parent-login:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    await connectDB();
    const acct = await ParentAccount.findOne({ email: parsed.data.email });
    // Constant-ish failure message — don't leak whether the email exists.
    if (!acct || !acct.passwordHash) {
      return NextResponse.json({ error: "Email or password is wrong." }, { status: 401 });
    }
    const ok = await verifyPassword(parsed.data.password, acct.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Email or password is wrong." }, { status: 401 });
    }

    const token = await signParentToken({
      sub: String(acct._id),
      email: acct.email,
      name: acct.name,
    });
    setParentCookie(token);

    acct.lastLoginAt = new Date();
    await acct.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[parent-login]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
