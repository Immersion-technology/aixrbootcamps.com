import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmailSuppression, suppress } from "@/models/EmailSuppression";
import { suppressionCreateSchema } from "@/lib/validations";
import { csvResponse } from "@/lib/csv";
import { requireAdmin, unauthorized, badRequest, zodMessage } from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

/**
 * The do-not-email list: unsubscribes, hard bounces and manual blocks.
 *
 * Removing someone here is a real decision, not a cleanup task — it re-enables
 * marketing email to a person who asked us to stop, so the UI warns and the
 * action is logged by the admin's own identity in the response.
 */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  await connectDB();
  const rows = await EmailSuppression.find().sort({ createdAt: -1 }).limit(2000).lean();

  if (new URL(req.url).searchParams.get("format") === "csv") {
    return csvResponse(
      rows.map((r: any) => ({
        Email: r.email,
        Reason: r.reason,
        Source: r.source ?? "",
        Note: r.note ?? "",
        "Added at": new Date(r.createdAt).toISOString(),
      })),
      "immersia-suppressions"
    );
  }

  return NextResponse.json({
    suppressions: rows.map((r: any) => ({
      id: String(r._id),
      email: r.email,
      reason: r.reason,
      source: r.source ?? "",
      note: r.note ?? "",
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = suppressionCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  await connectDB();
  await suppress({
    email: parsed.data.email,
    reason: parsed.data.reason,
    source: `admin:${admin.email}`,
    note: parsed.data.note,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return badRequest("Which email should be removed?");

  await connectDB();
  const res = await EmailSuppression.deleteOne({ email });
  if (res.deletedCount === 0) return badRequest("That address isn't on the list.");

  console.warn(`[suppression-removed] ${email} re-subscribed by ${admin.email}`);
  return NextResponse.json({ ok: true });
}
