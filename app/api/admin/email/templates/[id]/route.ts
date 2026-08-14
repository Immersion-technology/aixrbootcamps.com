import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmailTemplate } from "@/models/EmailTemplate";
import { templateUpdateSchema } from "@/lib/validations";
import {
  requireAdmin,
  unauthorized,
  notFound,
  badRequest,
  zodMessage,
  parseBlocksOrError,
  isValidObjectId,
} from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  const body = await req.json().catch(() => ({}));
  const parsed = templateUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  await connectDB();
  const template = await EmailTemplate.findById(params.id);
  if (!template) return notFound();

  const { name, description, subject, preheader, blocks } = parsed.data;

  if (blocks !== undefined) {
    const resolved = parseBlocksOrError(blocks);
    if (!resolved.ok) return badRequest(resolved.error, { issues: resolved.issues });
    // Mixed path — assign fresh and mark dirty so mongoose persists it.
    template.blocks = resolved.blocks;
    template.markModified("blocks");
  }
  if (name !== undefined) template.name = name;
  if (description !== undefined) template.description = description;
  if (subject !== undefined) template.subject = subject;
  if (preheader !== undefined) template.preheader = preheader;
  template.updatedBy = admin.email;

  await template.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  await connectDB();
  // Soft delete: campaigns reference their source template for provenance, and
  // a hard delete would orphan that link.
  const res = await EmailTemplate.updateOne(
    { _id: params.id, archivedAt: { $exists: false } },
    { $set: { archivedAt: new Date(), updatedBy: admin.email } }
  );
  if (res.matchedCount === 0) return notFound();

  return NextResponse.json({ ok: true });
}
