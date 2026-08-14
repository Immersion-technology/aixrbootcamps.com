import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { renderCampaignHtml, renderCampaignText, type Blocks } from "@/lib/email/blocks";
import { sampleMergeData, applyMergePlain } from "@/lib/email/merge";
import { unsubscribeUrl, unsubscribeHeaders } from "@/lib/email/unsubscribe";
import { getTransport, classifyError } from "@/lib/email/transport";
import {
  requireAdmin,
  unauthorized,
  notFound,
  badRequest,
  baseUrlFrom,
  parseBlocksOrError,
  isValidObjectId,
} from "@/lib/email/api-helpers";
import { assertSendableBaseUrl } from "@/lib/email/base-url";

export const dynamic = "force-dynamic";

/**
 * Send one copy of the campaign to the logged-in admin.
 *
 * Fixed to the admin's own address on purpose — a "send test to…" free-text
 * field is an easy way to accidentally mail a real parent a draft.
 *
 * Uses sample merge values, and does NOT touch the outbox or the campaign's
 * counters, so a test never pollutes the send record. It does go through the
 * real transport, so it's also a live check that SMTP is actually working.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!isValidObjectId(params.id)) return notFound();

  await connectDB();
  const campaign = await Campaign.findById(params.id).lean<any>();
  if (!campaign) return notFound();

  const resolved = parseBlocksOrError(campaign.blocks);
  if (!resolved.ok) return badRequest(resolved.error, { issues: resolved.issues });

  // A test send is a real send — hold it to the same public-URL standard, so a
  // test can never look fine while the real thing ships dead links.
  let baseUrl: string;
  try {
    baseUrl = assertSendableBaseUrl(baseUrlFrom(req));
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Email links are not configured for sending.");
  }
  const unsub = unsubscribeUrl(admin.email, baseUrl);
  const data = { ...sampleMergeData(), email: admin.email, unsubscribeUrl: unsub };
  const input = {
    subject: campaign.subject,
    preheader: campaign.preheader ?? "",
    blocks: resolved.blocks as Blocks,
  };
  const opts = { unsubscribeUrl: unsub };

  try {
    await getTransport().send({
      to: admin.email,
      subject: `[TEST] ${applyMergePlain(campaign.subject, data)}`,
      html: renderCampaignHtml(input, data, opts),
      text: renderCampaignText(input, data, opts),
      replyTo: campaign.replyTo,
      headers: unsubscribeHeaders(admin.email, baseUrl),
    });
    return NextResponse.json({ ok: true, sentTo: admin.email });
  } catch (err) {
    const classified = classifyError(err);
    console.error("[campaign-test]", classified);
    return NextResponse.json(
      { error: `Test send failed (${classified.code}): ${classified.message}` },
      { status: 502 }
    );
  }
}
