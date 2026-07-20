import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PageView } from "@/models/PageView";
import { getAdminFromCookie } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

// Raw pageview events can grow unbounded; cap the export to the most recent window/count
// so a single download can't try to stream millions of rows.
const MAX_ROWS = 20_000;

export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const daysParam = Number(req.nextUrl.searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  await connectDB();
  const rows = await PageView.find({ ts: { $gte: since } })
    .sort({ ts: -1 })
    .limit(MAX_ROWS)
    .lean();

  const csvRows = rows.map((r: any) => ({
    "Timestamp": new Date(r.ts).toISOString(),
    "Path": r.path,
    "Visitor ID": r.visitorId ?? "",
    "Referrer": r.referrer ?? "",
    "IP": r.ip ?? "",
    "Country": r.country ?? "",
    "City": r.city ?? "",
    "Device": r.device ?? "",
    "OS": r.os ?? "",
    "Browser": r.browser ?? "",
    "UTM source": r.utmSource ?? "",
    "UTM medium": r.utmMedium ?? "",
    "UTM campaign": r.utmCampaign ?? "",
    "User agent": r.ua ?? "",
  }));

  return csvResponse(csvRows, "immersia-pageviews");
}
