import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { setSetting } from "@/models/Setting";
import { getAdminFromCookie } from "@/lib/auth";
import { settingValueSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { key: string } }) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingValueSchema.safeParse(body?.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  await connectDB();
  await setSetting(params.key, parsed.data, new Types.ObjectId(admin.sub));
  return NextResponse.json({ ok: true });
}
