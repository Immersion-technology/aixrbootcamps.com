import { NextResponse } from "next/server";
import { previewSchema } from "@/lib/validations";
import { renderCampaignHtml, renderCampaignText, blocksSchema, validateBlocks } from "@/lib/email/blocks";
import { sampleMergeData } from "@/lib/email/merge";
import { requireAdmin, unauthorized, badRequest, zodMessage, baseUrlFrom } from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";

/**
 * Render unsaved editor content to HTML for the live preview.
 *
 * Deliberately the SAME renderer the sender uses — the preview is not an
 * approximation. What an admin signs off here is byte-for-byte what goes out,
 * modulo the real merge values.
 *
 * Note it renders even when `validateBlocks` finds problems: the editor wants to
 * show a live preview *and* the warnings side by side. Sending is what enforces
 * validity (see the send route).
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  const blocks = blocksSchema.safeParse(parsed.data.blocks);
  if (!blocks.success) return badRequest(zodMessage(blocks.error));

  const baseUrl = baseUrlFrom(req);
  const data = sampleMergeData();
  const input = {
    subject: parsed.data.subject,
    preheader: parsed.data.preheader,
    blocks: blocks.data,
  };
  const opts = { unsubscribeUrl: `${baseUrl}/api/e/u/preview-token` };

  return NextResponse.json({
    html: renderCampaignHtml(input, data, opts),
    text: renderCampaignText(input, data, opts),
    issues: validateBlocks(blocks.data),
  });
}
