import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { PageView } from "@/models/PageView";
import { parseUA } from "@/lib/ua-parse";

const BOT_UA_RE = /bot|crawler|spider|scraper|headless|prerender|lighthouse|pagespeed/i;
const VISITOR_COOKIE = "immersia_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, pseudonymous only

export async function POST(req: NextRequest) {
  let visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
  const isNewVisitor = !visitorId;
  if (isNewVisitor) visitorId = randomUUID();

  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (BOT_UA_RE.test(ua)) return new NextResponse(null, { status: 204 });

    const { path, referrer, utmSource, utmMedium, utmCampaign } = await req.json();
    if (!path || typeof path !== "string") return new NextResponse(null, { status: 204 });
    if (path.startsWith("/admin")) return new NextResponse(null, { status: 204 });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const country = req.headers.get("x-vercel-ip-country") ?? "";
    const city = req.headers.get("x-vercel-ip-city") ?? "";
    const { device, os, browser } = parseUA(ua);

    await connectDB();
    await PageView.create({
      path,
      referrer: referrer ?? "",
      ua,
      ts: new Date(),
      visitorId,
      ip,
      country,
      city,
      device,
      os,
      browser,
      utmSource: typeof utmSource === "string" ? utmSource : "",
      utmMedium: typeof utmMedium === "string" ? utmMedium : "",
      utmCampaign: typeof utmCampaign === "string" ? utmCampaign : "",
    });
  } catch {
    // fire-and-forget — never surface tracking errors to the client
  }

  const res = new NextResponse(null, { status: 204 });
  if (isNewVisitor) {
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: VISITOR_COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return res;
}
