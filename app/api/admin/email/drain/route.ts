import { NextResponse } from "next/server";
import { z } from "zod";
import { drainCampaign, findDrainableCampaigns, startDueCampaigns } from "@/lib/email/queue";
import { requireAdmin, badRequest, zodMessage, baseUrlFrom, isValidObjectId } from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";
// Hobby allows up to 60s; the queue's own time budget keeps us inside it.
export const maxDuration = 60;

const schema = z.object({ campaignId: z.string().optional() });

/**
 * The worker. Sends as much as fits in one invocation, then reports whether
 * there's more to do.
 *
 * Callable two ways:
 *  - an admin cookie (the composer drives this in a loop while you watch)
 *  - `x-cron-secret` (the daily sweep, which has no session)
 *
 * Safe to call concurrently: the queue claims each message atomically, so
 * overlapping drains simply share the work rather than double-sending.
 */
async function authorize(req: Request): Promise<boolean> {
  const admin = await requireAdmin();
  if (admin) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = req.headers.get("x-cron-secret");
  return typeof provided === "string" && provided.length === secret.length && provided === secret;
}

export async function POST(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  const baseUrl = baseUrlFrom(req);

  try {
    // Anything scheduled and now due joins the queue before we drain.
    const started = await startDueCampaigns();

    const targets = parsed.data.campaignId
      ? isValidObjectId(parsed.data.campaignId)
        ? [parsed.data.campaignId]
        : []
      : await findDrainableCampaigns(3);

    if (targets.length === 0) {
      return NextResponse.json({ ok: true, started, results: [], idle: true });
    }

    // Sequential on purpose: parallel drains would race the shared daily cap
    // and blow through Gmail's rate limit.
    const results = [];
    for (const id of targets) {
      results.push(await drainCampaign(id, { baseUrl }));
    }

    return NextResponse.json({
      ok: true,
      started,
      results,
      idle: false,
      shouldContinue: results.some((r) => r.shouldContinue),
    });
  } catch (e) {
    console.error("[email-drain]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Drain failed" },
      { status: 500 }
    );
  }
}
