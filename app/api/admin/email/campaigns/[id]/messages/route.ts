import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { EmailMessage } from "@/models/EmailMessage";
import { csvResponse } from "@/lib/csv";
import { requireAdmin, unauthorized, notFound, isValidObjectId } from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

/**
 * Per-recipient outcomes for one campaign — who got it, who didn't, and the
 * exact SMTP reason why. This is the answer to "did the Adeyemis get the
 * reminder?", which is the question an admin actually asks.
 *
 * `?status=failed` narrows it; `?format=csv` downloads it.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  await connectDB();
  const campaign = await Campaign.findById(params.id).select("name").lean<any>();
  if (!campaign) return notFound();

  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  const filter: Record<string, unknown> = { campaignId: campaign._id };
  if (status && ["queued", "sending", "sent", "failed", "suppressed"].includes(status)) {
    filter.status = status;
  }

  const rows = await EmailMessage.find(filter)
    .sort({ status: 1, sentAt: -1, email: 1 })
    .limit(sp.get("format") === "csv" ? 5000 : 500)
    .select("email name status attempts sentAt error errorCode openedAt openCount")
    .lean();

  if (sp.get("format") === "csv") {
    return csvResponse(
      rows.map((r: any) => ({
        Email: r.email,
        Name: r.name ?? "",
        Status: r.status,
        Attempts: r.attempts ?? 0,
        "Sent at": r.sentAt ? new Date(r.sentAt).toISOString() : "",
        "Opened at": r.openedAt ? new Date(r.openedAt).toISOString() : "",
        Opens: r.openCount ?? 0,
        "Error code": r.errorCode ?? "",
        Error: r.error ?? "",
      })),
      `immersia-campaign-${String(campaign._id).slice(-6)}`
    );
  }

  return NextResponse.json({
    messages: rows.map((r: any) => ({
      id: String(r._id),
      email: r.email,
      name: r.name ?? "",
      status: r.status,
      attempts: r.attempts ?? 0,
      sentAt: r.sentAt ?? null,
      openedAt: r.openedAt ?? null,
      openCount: r.openCount ?? 0,
      error: r.error ?? null,
      errorCode: r.errorCode ?? null,
    })),
  });
}
