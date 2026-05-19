import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const all = await Setting.find({}).lean();
  const map: Record<string, unknown> = {};
  for (const s of all) map[s.key] = s.value;
  return NextResponse.json(map);
}
