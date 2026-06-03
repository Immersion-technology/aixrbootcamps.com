import { NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { ParentAccount } from "@/models/ParentAccount";
import { getAdminFromCookie } from "@/lib/auth";
import { issueLoginLink } from "@/lib/magic-link";
import { sendMail, magicLinkHtml } from "@/lib/mailer";

const schema = z.object({
  registrationId: z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid registration id"),
});

// Admin helper: email the parent a one-time login link (passwordless).
// Creates the ParentAccount on the fly if it doesn't exist yet.
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

    // One ParentAccount per email, regardless of how many kids it registers.
    let acct = await ParentAccount.findOne({ email });
    if (!acct) {
      acct = await ParentAccount.create({
        email,
        name: reg.parent.fullName,
        phone: reg.parent.phonePrimary,
      });
    }

    const base = process.env.APP_URL ?? new URL(req.url).origin;
    const url = await issueLoginLink({ role: "parent", accountId: String(acct._id), email, baseUrl: base });
    await sendMail({
      to: email,
      subject: "Your IMMERSIA parent portal login link",
      html: magicLinkHtml({ name: acct.name, url, role: "parent" }),
    });

    return NextResponse.json({ ok: true, email, name: acct.name });
  } catch (e) {
    console.error("[parent-invite]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
