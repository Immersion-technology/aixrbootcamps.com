import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmailMessage } from "@/models/EmailMessage";
import { Campaign } from "@/models/Campaign";
import { verifyOpenToken } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";

/** 1×1 transparent GIF. */
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * Open-tracking pixel. Only embedded when a campaign explicitly opts in — off by
 * default, and disclosed in the privacy policy.
 *
 * The token signs the MESSAGE id, not the email address, so the URL can't be
 * reversed into a mailing list if it leaks from a forwarded email.
 *
 * Always returns the GIF, even on a bad token: a broken image in a parent's
 * email would be a worse outcome than a missed statistic.
 */
function pixel() {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      // Never cache, or the proxy serves the second open from cache and we
      // under-count — and never store, so it isn't retained downstream.
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    // Strip the `.gif` some clients append when they rewrite image URLs.
    const raw = params.token.replace(/\.gif$/i, "");
    const messageId = verifyOpenToken(raw);
    if (!messageId) return pixel();

    // Gmail's image proxy prefetches on delivery, not on read. Filtering the
    // obvious bots keeps the number honest rather than inflated.
    const ua = req.headers.get("user-agent") ?? "";
    if (/GoogleImageProxy|YahooMailProxy|bot|crawler|spider|preview/i.test(ua)) return pixel();

    await connectDB();
    // First open stamps the time; later opens only bump the counter.
    const result = await EmailMessage.findOneAndUpdate(
      { _id: messageId, status: "sent" },
      { $inc: { openCount: 1 }, $setOnInsert: {} },
      { new: false }
    );

    if (result && !result.openedAt) {
      await EmailMessage.updateOne({ _id: messageId }, { $set: { openedAt: new Date() } });
      await Campaign.updateOne({ _id: result.campaignId }, { $inc: { "stats.opened": 1 } });
    }
  } catch (e) {
    // Fire-and-forget: tracking must never break the email itself.
    console.error("[open-pixel]", e);
  }

  return pixel();
}
