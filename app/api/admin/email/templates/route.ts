import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmailTemplate } from "@/models/EmailTemplate";
import { templateCreateSchema } from "@/lib/validations";
import {
  requireAdmin,
  unauthorized,
  badRequest,
  zodMessage,
  parseBlocksOrError,
} from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  await connectDB();
  const templates = await EmailTemplate.find({ archivedAt: { $exists: false } })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({
    templates: templates.map((t: any) => ({
      id: String(t._id),
      name: t.name,
      description: t.description ?? "",
      subject: t.subject,
      preheader: t.preheader ?? "",
      blocks: t.blocks ?? [],
      blockCount: Array.isArray(t.blocks) ? t.blocks.length : 0,
      createdBy: t.createdBy,
      updatedAt: t.updatedAt,
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = templateCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  const resolved = parseBlocksOrError(parsed.data.blocks);
  if (!resolved.ok) return badRequest(resolved.error, { issues: resolved.issues });

  try {
    await connectDB();
    const template = await EmailTemplate.create({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      subject: parsed.data.subject,
      preheader: parsed.data.preheader ?? "",
      blocks: resolved.blocks,
      createdBy: admin.email,
    });
    return NextResponse.json({ ok: true, id: String(template._id) });
  } catch (e) {
    console.error("[template-create]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
