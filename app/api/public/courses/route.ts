import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const courses = await Course.find({ isActive: true })
    .sort({ order: 1 })
    .select("code name description category isCompulsory order")
    .lean();
  return NextResponse.json({ courses });
}
