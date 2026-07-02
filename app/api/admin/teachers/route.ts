import { NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Teacher } from "@/models/Teacher";
import { getAdminFromCookie } from "@/lib/auth";
import { issueLoginLink } from "@/lib/magic-link";
import { sendMail, teacherWelcomeHtml } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  assignedCourses: z.array(z.string()).optional().default([]),
  bio: z
    .preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().max(1200).optional())
    .transform((value) => (value ? value : undefined)),
  photoUrl: z
    .preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().max(500).optional())
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || /^(https?:\/\/|\/)/i.test(value), {
      message: "Photo URL must start with / or http(s)://",
    }),
});

const patchSchema = z.object({
  id: z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid id"),
  isActive: z.boolean(),
});

export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const teachers = await Teacher.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ teachers });
}

export async function POST(req: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    await connectDB();
    const existing = await Teacher.findOne({ email: parsed.data.email }).lean();
    if (existing) {
      return NextResponse.json({ error: "A teacher with that email already exists." }, { status: 409 });
    }

    const teacher = await Teacher.create({
      name: parsed.data.name,
      email: parsed.data.email,
      assignedCourses: parsed.data.assignedCourses,
      bio: parsed.data.bio,
      photoUrl: parsed.data.photoUrl,
      isActive: true,
    });

    // Email a first login link (best-effort — don't fail creation on mail error).
    try {
      const base = process.env.APP_URL ?? new URL(req.url).origin;
      const url = await issueLoginLink({
        role: "teacher",
        accountId: String(teacher._id),
        email: teacher.email,
        baseUrl: base,
      });
      await sendMail({
        to: teacher.email,
        subject: "Welcome to the IMMERSIA team — your login link",
        html: teacherWelcomeHtml({ name: teacher.name, loginUrl: url }),
      });
    } catch (mailErr) {
      console.error("[teacher-create mail]", mailErr);
    }

    return NextResponse.json({ ok: true, id: String(teacher._id) });
  } catch (e) {
    console.error("[teacher-create]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  await connectDB();
  await Teacher.updateOne({ _id: parsed.data.id }, { $set: { isActive: parsed.data.isActive } });
  return NextResponse.json({ ok: true });
}
