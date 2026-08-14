import { NextResponse } from "next/server";
import { drainCampaign, findDrainableCampaigns, startDueCampaigns } from "@/lib/email/queue";
import { baseUrlFrom } from "@/lib/email/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily safety net (see `vercel.json`).
 *
 * Three jobs, none of which depend on anyone having a browser open:
 *  1. start campaigns whose scheduled time has passed
 *  2. resume anything the daily cap paused yesterday
 *  3. pick up messages orphaned by a worker that died mid-send (their leases
 *     have long expired, so the normal claim query reclaims them)
 *
 * Vercel Hobby only permits one cron run per day, so this is a backstop, not the
 * primary driver — the composer drives the drain interactively. On Pro you can
 * raise `vercel.json` to hourly and scheduled sends become punctual.
 *
 * Auth: Vercel sends `Authorization: Bearer $CRON_SECRET` to cron routes. We
 * also accept `x-cron-secret` so the job can be triggered manually.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Unset secret: only allow Vercel's own cron header, never the open internet.
  if (!secret) return req.headers.get("x-vercel-cron") !== null;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return req.headers.get("x-cron-secret") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = baseUrlFrom(req);

  try {
    const started = await startDueCampaigns();
    const targets = await findDrainableCampaigns(5);

    const results = [];
    for (const id of targets) {
      results.push(await drainCampaign(id, { baseUrl }));
    }

    console.log(
      `[cron:email-drain] started=${started.length} drained=${results.length} ` +
        `sent=${results.reduce((n, r) => n + r.sent, 0)} failed=${results.reduce((n, r) => n + r.failed, 0)}`
    );

    return NextResponse.json({ ok: true, started, results });
  } catch (e) {
    console.error("[cron:email-drain]", e);
    return NextResponse.json({ error: "Drain failed" }, { status: 500 });
  }
}
