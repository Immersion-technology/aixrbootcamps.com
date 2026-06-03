import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ParentAccount } from "@/models/ParentAccount";
import { consumeLoginToken } from "@/lib/magic-link";
import { signParentToken, setParentCookie } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(10) });

// Consume a one-time login token and establish the parent session.
// POST-only (the verify page auto-submits) so email link-scanners that GET
// the link can't burn the single-use token before the parent clicks.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
  }

  try {
    await connectDB();
    const result = await consumeLoginToken(parsed.data.token, "parent");
    if (!result) {
      return NextResponse.json({ error: "This link is invalid, used, or expired." }, { status: 401 });
    }

    const acct = await ParentAccount.findById(result.accountId);
    if (!acct) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const token = await signParentToken({ sub: String(acct._id), email: acct.email, name: acct.name });
    setParentCookie(token);
    acct.lastLoginAt = new Date();
    await acct.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[parent-login verify]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
