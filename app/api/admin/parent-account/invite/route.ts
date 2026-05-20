import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { ParentAccount } from "@/models/ParentAccount";
import { getAdminFromCookie } from "@/lib/auth";

const schema = z.object({
  registrationId: z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid registration id"),
});

const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(req: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    await connectDB();
    const reg = await Registration.findById(parsed.data.registrationId).lean();
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

    const email = reg.parent.email.toLowerCase();

    // Find or create — keep one ParentAccount per email regardless of how many
    // kids that email registers.
    let acct = await ParentAccount.findOne({ email });
    if (!acct) {
      acct = new ParentAccount({
        email,
        name: reg.parent.fullName,
        phone: reg.parent.phonePrimary,
      });
    }

    const token = randomUUID().replace(/-/g, "");
    acct.passwordSetupToken = token;
    acct.passwordSetupExpiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_MS);
    await acct.save();

    const base = process.env.APP_URL ?? "http://localhost:3000";
    const setupUrl = `${base}/account/setup?token=${token}`;

    return NextResponse.json({
      ok: true,
      email,
      name: acct.name,
      setupUrl,
      expiresAt: acct.passwordSetupExpiresAt,
      // Whether the parent already has a usable password (i.e. a previous
      // invite has already been completed). UI uses this to warn before
      // overriding.
      hadPasswordBefore: Boolean(acct.passwordHash),
    });
  } catch (e) {
    console.error("[parent-invite]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
