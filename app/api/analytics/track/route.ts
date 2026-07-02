import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PageView } from "@/models/PageView";

const BOT_UA_RE = /bot|crawler|spider|scraper|headless|prerender|lighthouse|pagespeed/i;

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (BOT_UA_RE.test(ua)) return new NextResponse(null, { status: 204 });

    const { path, referrer } = await req.json();
    if (!path || typeof path !== "string") return new NextResponse(null, { status: 204 });
    if (path.startsWith("/admin")) return new NextResponse(null, { status: 204 });

    await connectDB();
    await PageView.create({ path, referrer: referrer ?? "", ua, ts: new Date() });
  } catch {
    // fire-and-forget — never surface tracking errors to the client
  }
  return new NextResponse(null, { status: 204 });
}
