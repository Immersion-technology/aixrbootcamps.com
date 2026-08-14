import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { suppress } from "@/models/EmailSuppression";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe (RFC 8058) — public and session-less by design.
 *
 * Gmail and Yahoo POST here directly when someone taps their native
 * "Unsubscribe" button, with no cookies and no user interaction. Requiring a
 * login or a confirmation step would break that contract and, for a bulk
 * sender, count against us.
 *
 * `POST` = the machine path (must act immediately, must return 2xx).
 * `GET`  = the human path, from the footer link — same effect, plus a page.
 *
 * The token is an HMAC of the address, so no lookup is needed and there's
 * nothing to enumerate: an attacker can only unsubscribe an address they
 * already hold a signed token for, and the worst outcome is "stop emailing me".
 */
async function unsubscribe(token: string, source: string): Promise<string | null> {
  const email = verifyUnsubscribeToken(token);
  if (!email) return null;

  await connectDB();
  await suppress({ email, reason: "unsubscribe", source });
  console.log(`[unsubscribe] ${email} via ${source}`);
  return email;
}

export async function POST(_req: Request, { params }: { params: { token: string } }) {
  const email = await unsubscribe(params.token, "one-click");
  // Always 200 for the machine path — a 4xx makes mailbox providers retry and
  // can be read as a broken unsubscribe, which is worse than a no-op.
  return NextResponse.json({ ok: !!email });
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const email = await unsubscribe(params.token, "footer link");

  const body = email
    ? {
        title: "You're unsubscribed",
        message: `We won't send <strong>${escapeHtml(
          email
        )}</strong> any more camp updates. You'll still get essential emails about a registration you've paid for — receipts, login links and safety notices.`,
        tone: "#059669",
      }
    : {
        title: "That link didn't work",
        message:
          "This unsubscribe link is invalid or incomplete. Reply to any email from us, or contact <a href=\"mailto:privacy@immersia.ng\" style=\"color:#2563eb;\">privacy@immersia.ng</a> and we'll remove you by hand.",
        tone: "#b3261e",
      };

  return new NextResponse(page(body), {
    status: email ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Standalone HTML rather than a React page: this route lives outside the app's
 * layouts on purpose so it can never depend on session state or client JS.
 */
function page(opts: { title: string; message: string; tone: string }): string {
  const appUrl = (process.env.APP_URL ?? "https://immersia.ng").replace(/\/+$/, "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${opts.title} · IMMERSIA</title>
</head>
<body style="margin:0;background:#f1f1f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f0f0f;">
  <div style="max-width:520px;margin:0 auto;padding:64px 20px;">
    <div style="text-align:center;margin-bottom:28px;">
      <img src="${appUrl}/logo.png" alt="IMMERSIA" width="64" style="height:auto;">
    </div>
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 30px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:${opts.tone};text-transform:uppercase;margin-bottom:10px;">
        Email preferences
      </div>
      <h1 style="font-size:26px;line-height:1.15;margin:0 0 14px;font-weight:800;letter-spacing:-0.02em;">
        ${opts.title}
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0;">${opts.message}</p>
      <div style="margin-top:26px;">
        <a href="${appUrl}" style="display:inline-block;background:#0f0f0f;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 26px;border-radius:999px;">
          Back to immersia.ng
        </a>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#999;margin-top:22px;">
      Changed your mind? Reply to any email from us and we'll add you back.
    </p>
  </div>
</body>
</html>`;
}
