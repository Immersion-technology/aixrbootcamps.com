import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Waitlist } from "@/models/Waitlist";
import { waitlistSchema } from "@/lib/validations";
import { sendMail, waitlistHtml } from "@/lib/mailer";
import { normalizePhone, rateLimit, getClientIp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`waitlist:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const entry = await Waitlist.create({
    email: parsed.data.email,
    parentName: parsed.data.parentName,
    participantName: parsed.data.participantName,
    phone: normalizePhone(parsed.data.phone),
  });

  try {
    await sendMail({
      to: entry.email,
      subject: "You're on the IMMERSIA waitlist",
      html: waitlistHtml({ parentName: entry.parentName, participantName: entry.participantName }),
    });
  } catch (e) {
    console.error("[waitlist mailer]", e);
  }

  return NextResponse.json({ ok: true });
}
