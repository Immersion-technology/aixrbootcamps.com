import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";
import { adminLoginSchema } from "@/lib/validations";
import { verifyPassword, signAdminToken, setAdminCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`login:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  await connectDB();
  const admin = await Admin.findOne({ email: parsed.data.email.toLowerCase() });
  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = await signAdminToken({
    sub: String(admin._id),
    email: admin.email,
    name: admin.name,
  });
  await setAdminCookie(token);

  return NextResponse.json({ ok: true, admin: { email: admin.email, name: admin.name } });
}
