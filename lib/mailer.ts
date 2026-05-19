import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "Immersia <noreply@immersia.ng>";
const APP_URL = process.env.APP_URL ?? "https://immersia.ng";
const LOGO_URL = `${APP_URL}/imm.png`;

interface SendOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

export async function sendMail(opts: SendOpts) {
  return transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments: opts.attachments,
  });
}

export function fmtNaira(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString("en-NG");
}

/**
 * Email shell — wraps content in IMMERSIA-branded layout.
 * Email clients don't support backdrop-filter, so we use solid styles
 * that approximate the frosted-glass look.
 */
function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>IMMERSIA</title>
</head>
<body style="margin:0;padding:0;background:#f1f1f1;font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f0f0f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f1f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#f1f1f1;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${LOGO_URL}" alt="IMMERSIA" width="140" style="display:block;height:auto;">
            </td>
          </tr>
          <tr>
            <td>${content}</td>
          </tr>
          <tr>
            <td style="padding:32px 0 8px;text-align:center;font-size:11px;color:#777;letter-spacing:0.18em;text-transform:uppercase;">
              <strong style="color:#0e92a0;">Lagos</strong> · 27 July – 21 August 2026 · Mon–Fri 10am–2:30pm
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0 0;text-align:center;font-size:11px;color:#999;">
              <a href="${APP_URL}" style="color:#0e92a0;text-decoration:none;font-weight:600;">immersia.ng</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}/contact" style="color:#999;text-decoration:none;">Contact</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}/faq" style="color:#999;text-decoration:none;">FAQ</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0;text-align:center;font-size:10.5px;color:#bbb;">
              © 2026 IMMERSIA. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function parentConfirmationHtml(args: {
  parentName: string;
  participantName: string;
  registrationId: string;
  courses: string[];
  laptopRental: boolean;
  totalKobo: number;
  campStart: string;
}): string {
  const courseList = args.courses
    .map((c) => `<li style="padding:4px 0;color:#0f0f0f;">${c}</li>`)
    .join("");

  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#0e92a0;text-transform:uppercase;margin-bottom:8px;">
        Payment confirmed · You're in
      </div>
      <h1 style="font-size:32px;line-height:1.05;margin:0 0 16px;letter-spacing:-0.02em;font-weight:800;text-transform:uppercase;">
        Welcome, ${args.parentName}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 24px;">
        ${args.participantName}'s slot at the IMMERSIA Summer Tech Boot Camp is locked in. Your PDF receipt is attached.
      </p>

      <!-- ticket card -->
      <div style="background:#0f0f0f;color:#fff;border-radius:16px;padding:20px 24px;margin:24px 0;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.22em;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:6px;">
          Registration ID
        </div>
        <div style="font-family:'Orbitron','Space Grotesk',sans-serif;font-weight:800;font-size:22px;letter-spacing:0.04em;">
          ${args.registrationId}
        </div>
        <p style="font-size:11.5px;color:rgba(255,255,255,0.65);margin:8px 0 0;">
          Save this — you'll need it for any enquiry.
        </p>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#777;">Camp starts</td><td style="text-align:right;font-weight:600;">${args.campStart}</td></tr>
        <tr><td style="padding:6px 0;color:#777;">Laptop rental</td><td style="text-align:right;font-weight:600;">${args.laptopRental ? "Yes" : "No"}</td></tr>
        <tr><td style="padding:6px 0;color:#777;">Amount paid</td><td style="text-align:right;font-weight:700;font-family:'Orbitron','Space Grotesk',sans-serif;">${fmtNaira(args.totalKobo)}</td></tr>
      </table>

      <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:16px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#0e92a0;text-transform:uppercase;margin-bottom:8px;">
          Courses selected
        </div>
        <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.5;">${courseList}</ul>
      </div>
    </div>

    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:18px 22px;margin-top:14px;font-size:13px;line-height:1.6;color:#3a3a3a;">
      <strong style="color:#0f0f0f;">What's next.</strong> A WhatsApp invite to the parent group lands two weeks before camp with the venue address, drop-off details and Day 1 schedule. Questions? Just reply to this email.
    </div>
  `;
  return shell(content);
}

export function adminAlertHtml(args: {
  participantName: string;
  registrationId: string;
  parentName: string;
  parentPhone: string;
  totalKobo: number;
  appUrl: string;
}): string {
  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:32px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#0e92a0;text-transform:uppercase;margin-bottom:8px;">
        New paid registration
      </div>
      <h2 style="font-size:24px;line-height:1.1;margin:0 0 12px;font-weight:800;text-transform:uppercase;letter-spacing:-0.01em;">
        ${args.participantName}
      </h2>
      <div style="font-family:'Orbitron','Space Grotesk',sans-serif;font-weight:700;font-size:14px;color:#0e92a0;margin-bottom:18px;">
        ${args.registrationId}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
        <tr><td style="padding:5px 0;color:#777;">Parent</td><td style="text-align:right;font-weight:600;">${args.parentName}</td></tr>
        <tr><td style="padding:5px 0;color:#777;">Phone</td><td style="text-align:right;font-weight:600;"><a href="tel:${args.parentPhone}" style="color:#0f0f0f;text-decoration:none;">${args.parentPhone}</a></td></tr>
        <tr><td style="padding:5px 0;color:#777;">Amount</td><td style="text-align:right;font-weight:700;font-family:'Orbitron','Space Grotesk',sans-serif;">${fmtNaira(args.totalKobo)}</td></tr>
      </table>
      <div style="margin-top:24px;">
        <a href="${args.appUrl}/admin/registrations/${args.registrationId}" style="display:inline-block;background:#0f0f0f;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 22px;border-radius:999px;letter-spacing:0.04em;">
          View in admin →
        </a>
      </div>
    </div>
  `;
  return shell(content);
}

export function waitlistHtml(args: { parentName: string; participantName: string }): string {
  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#0e92a0;text-transform:uppercase;margin-bottom:8px;">
        You're on the waitlist
      </div>
      <h1 style="font-size:28px;line-height:1.05;margin:0 0 14px;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em;">
        Hi ${args.parentName}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 18px;">
        ${args.participantName} is officially on the IMMERSIA waitlist. The 2026 cohort is currently full at 50 paid slots, but we open spots when paid registrations cancel within 7 days of camp start.
      </p>
      <div style="background:#1f6f87;color:#fff;border-radius:16px;padding:18px 22px;margin:18px 0;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.22em;color:rgba(255,255,255,0.8);text-transform:uppercase;margin-bottom:4px;">
          What happens if a slot opens
        </div>
        <p style="font-size:14px;line-height:1.55;margin:0;">
          We email everyone on the waitlist at the same moment. <strong>First paid registration wins the slot.</strong> Camp begins 27 July 2026.
        </p>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#777;margin:0;">
        No payment is needed yet — we just wanted you on the list. If you have questions, reply to this email.
      </p>
    </div>
  `;
  return shell(content);
}
