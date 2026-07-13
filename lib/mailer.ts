import nodemailer from "nodemailer";
import { cohortLabel, cohortById } from "./cohorts";

function extractEmailAddress(value?: string): string {
  if (!value) return "";
  const angleMatch = value.match(/<([^>]+)>/);
  if (angleMatch?.[1]) return angleMatch[1].trim();
  const plainMatch = value.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/);
  return plainMatch?.[0]?.trim() ?? "";
}

function normalizeSmtpSecret(value?: string): string {
  return (value ?? "").replace(/\s+/g, "");
}

const SMTP_FROM = process.env.SMTP_FROM ?? "Immersia <noreply@immersia.ng>";
const SMTP_USER = process.env.SMTP_USER?.trim() || extractEmailAddress(SMTP_FROM);
const SMTP_PASS = normalizeSmtpSecret(process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

const APP_URL = process.env.APP_URL ?? "https://immersia.ng";
const LOGO_URL = `${APP_URL}/logo.png`;

interface SendOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

function assertMailConfig() {
  const missing: string[] = [];
  if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!SMTP_USER) missing.push("SMTP_USER or a valid email in SMTP_FROM");
  if (!SMTP_PASS) missing.push("SMTP_PASS");
  if (missing.length) {
    throw new Error(`SMTP is not configured. Missing: ${missing.join(", ")}.`);
  }
}

export async function verifyMailTransport() {
  assertMailConfig();
  return transporter.verify();
}

export async function sendMail(opts: SendOpts) {
  assertMailConfig();
  return transporter.sendMail({
    from: SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
    attachments: opts.attachments,
  });
}

export function fmtNaira(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString("en-NG");
}

/**
 * Escape user-supplied values before interpolating them into email HTML.
 * Names, notes, etc. come from registrations / admin input and must not be
 * able to inject markup into the email body.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Email shell: wraps content in IMMERSIA-branded layout.
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
              <img src="${LOGO_URL}" alt="IMMERSIA" width="72" style="display:block;height:auto;">
            </td>
          </tr>
          <tr>
            <td>${content}</td>
          </tr>
          <tr>
            <td style="padding:32px 0 8px;text-align:center;font-size:11px;color:#777;letter-spacing:0.18em;text-transform:uppercase;">
              <strong style="color:#2563eb;">99 Adesanya Ogunsanya, Leisure Mall</strong> · 27 July – 4 September 2026 · Mon–Fri 9am–1:30pm · In-person in Lagos or online
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0 0;text-align:center;font-size:11px;color:#999;">
              <a href="${APP_URL}" style="color:#2563eb;text-decoration:none;font-weight:600;">immersia.ng</a>
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
  roboticsElective: boolean;
  attendanceMode: "in_person" | "online";
  cohort?: number;
  deliveryFeeKobo?: number;
  discountKobo?: number;
  promoCode?: string;
  totalKobo: number;
  campStart: string;
}): string {
  const courseList = args.courses
    .map((c) => `<li style="padding:4px 0;color:#0f0f0f;">${esc(c)}</li>`)
    .join("");

  const isOnline = args.attendanceMode === "online";
  const attendanceLabel = isOnline ? "Online" : "In-person (Lagos)";
  const whatsNext = isOnline
    ? `Your welcome kit (t-shirt + materials) ships to the delivery address you gave. A WhatsApp invite to the parent group lands two weeks before camp with your live join link and the Day 1 schedule. Questions? Just reply to this email.`
    : `A WhatsApp invite to the parent group lands two weeks before camp with the venue address, drop-off details and Day 1 schedule. Questions? Just reply to this email.`;

  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
        Payment confirmed · You're in
      </div>
      <h1 style="font-size:32px;line-height:1.05;margin:0 0 16px;letter-spacing:-0.02em;font-weight:800;text-transform:uppercase;">
        Welcome, ${esc(args.parentName)}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 24px;">
        ${esc(args.participantName)}'s slot at the IMMERSIA Summer Tech Boot Camp is locked in. Your PDF receipt is attached.
      </p>

      <!-- ticket card -->
      <div style="background:#0f0f0f;color:#fff;border-radius:16px;padding:20px 24px;margin:24px 0;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.22em;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:6px;">
          Registration ID
        </div>
        <div style="font-family:'Orbitron','Space Grotesk',sans-serif;font-weight:800;font-size:22px;letter-spacing:0.04em;">
          ${esc(args.registrationId)}
        </div>
        <p style="font-size:11.5px;color:rgba(255,255,255,0.65);margin:8px 0 0;">
          Save this, you'll need it for any enquiry.
        </p>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#777;">Your cohort starts</td><td style="text-align:right;font-weight:600;">${esc(cohortById(args.cohort)?.start ?? args.campStart)}</td></tr>
        ${args.cohort ? `<tr><td style="padding:6px 0;color:#777;">Cohort</td><td style="text-align:right;font-weight:600;">${esc(cohortLabel(args.cohort))}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#777;">Attendance</td><td style="text-align:right;font-weight:600;">${attendanceLabel}</td></tr>
        ${
          isOnline
            ? `<tr><td style="padding:6px 0;color:#777;">Welcome-kit delivery</td><td style="text-align:right;font-weight:600;">${fmtNaira(args.deliveryFeeKobo ?? 0)}</td></tr>`
            : `<tr><td style="padding:6px 0;color:#777;">Robotics elective</td><td style="text-align:right;font-weight:600;">${args.roboticsElective ? "Yes" : "No"}</td></tr>
        <tr><td style="padding:6px 0;color:#777;">Laptop rental</td><td style="text-align:right;font-weight:600;">${args.laptopRental ? "Yes" : "No"}</td></tr>`
        }
        ${
          args.discountKobo && args.discountKobo > 0
            ? `<tr><td style="padding:6px 0;color:#777;">Promo${args.promoCode ? ` (${esc(args.promoCode)})` : ""}</td><td style="text-align:right;font-weight:600;color:#059669;">−${fmtNaira(args.discountKobo)}</td></tr>`
            : ""
        }
        <tr><td style="padding:6px 0;color:#777;">Amount paid</td><td style="text-align:right;font-weight:700;font-family:'Orbitron','Space Grotesk',sans-serif;">${fmtNaira(args.totalKobo)}</td></tr>
      </table>

      <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:16px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
          Courses selected
        </div>
        <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.5;">${courseList}</ul>
      </div>
    </div>

    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:18px 22px;margin-top:14px;font-size:13px;line-height:1.6;color:#3a3a3a;">
      <strong style="color:#0f0f0f;">What's next.</strong> ${whatsNext}
    </div>

    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:20px 22px;margin-top:14px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#2563eb;text-transform:uppercase;margin-bottom:6px;">
        Your parent portal
      </div>
      <p style="font-size:13px;line-height:1.6;color:#3a3a3a;margin:0 0 14px;">
        Track ${esc(args.participantName)}'s attendance and details any time. No password needed, we email you a one-time login link.
      </p>
      <a href="${APP_URL}/account/login" style="display:inline-block;background:#0f0f0f;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 24px;border-radius:999px;letter-spacing:0.04em;">
        Log in to your portal →
      </a>
    </div>
  `;
  return shell(content);
}

/**
 * One-time login link for the parent OR teacher portal (passwordless).
 * `role` only affects the copy; the URL already points to the right verify route.
 */
export function magicLinkHtml(args: { name: string; url: string; role: "parent" | "teacher" }): string {
  const portal = args.role === "teacher" ? "facilitator" : "parent";
  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
        Your login link
      </div>
      <h1 style="font-size:26px;line-height:1.1;margin:0 0 14px;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em;">
        Hi ${esc(args.name)}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 22px;">
        Tap the button below to sign in to your ${portal} portal. This link works once and expires in 30 minutes.
      </p>
      <div style="text-align:center;margin:8px 0 18px;">
        <a href="${args.url}" style="display:inline-block;background:#0f0f0f;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:999px;letter-spacing:0.04em;">
          Sign in →
        </a>
      </div>
      <p style="font-size:12px;line-height:1.55;color:#999;margin:0;">
        If you didn't request this, you can safely ignore it, no one can sign in without this link. Trouble with the button? Paste this URL into your browser:<br>
        <span style="word-break:break-all;color:#2563eb;">${args.url}</span>
      </p>
    </div>
  `;
  return shell(content);
}

/** Sent when an admin rejects a registration (admission override). */
export function admissionRejectedHtml(args: {
  parentName: string;
  participantName: string;
  note?: string;
}): string {
  const reason = args.note
    ? `<div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:16px 20px;margin:18px 0;font-size:13.5px;line-height:1.6;color:#3a3a3a;"><strong style="color:#0f0f0f;">Note from the team:</strong> ${esc(args.note)}</div>`
    : "";
  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#b3261e;text-transform:uppercase;margin-bottom:8px;">
        Registration update
      </div>
      <h1 style="font-size:26px;line-height:1.1;margin:0 0 14px;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em;">
        Hi ${esc(args.parentName)}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 6px;">
        We're sorry, but we're unable to confirm ${esc(args.participantName)}'s place at the IMMERSIA Summer Tech Boot Camp. If a payment was made, our team will be in touch about a refund.
      </p>
      ${reason}
      <p style="font-size:13.5px;line-height:1.6;color:#777;margin:14px 0 0;">
        If you think this is a mistake, just reply to this email and we'll take another look.
      </p>
    </div>
  `;
  return shell(content);
}

/** Sent when an admin adds a teacher, with their first login link. */
export function teacherWelcomeHtml(args: { name: string; loginUrl: string }): string {
  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
        You're on the IMMERSIA team
      </div>
      <h1 style="font-size:26px;line-height:1.1;margin:0 0 14px;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em;">
        Welcome, ${esc(args.name)}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 22px;">
        You've been added as a facilitator. From your portal you can see your roster, mark daily attendance, and view each camper's safety details. Sign in with the link below, it works once and expires in 30 minutes.
      </p>
      <div style="text-align:center;margin:8px 0 18px;">
        <a href="${args.loginUrl}" style="display:inline-block;background:#0f0f0f;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:999px;letter-spacing:0.04em;">
          Open my portal →
        </a>
      </div>
      <p style="font-size:12px;line-height:1.55;color:#999;margin:0;">
        Next time, just go to <a href="${APP_URL}/teacher/login" style="color:#2563eb;text-decoration:none;">${APP_URL}/teacher/login</a> and request a fresh link.
      </p>
    </div>
  `;
  return shell(content);
}

export function adminAlertHtml(args: {
  participantName: string;
  registrationId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  totalKobo: number;
  appUrl: string;
}): string {
  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:32px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
        New paid registration
      </div>
      <h2 style="font-size:24px;line-height:1.1;margin:0 0 12px;font-weight:800;text-transform:uppercase;letter-spacing:-0.01em;">
        ${esc(args.participantName)}
      </h2>
      <div style="font-family:'Orbitron','Space Grotesk',sans-serif;font-weight:700;font-size:14px;color:#2563eb;margin-bottom:18px;">
        ${esc(args.registrationId)}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
        <tr><td style="padding:5px 0;color:#777;">Parent</td><td style="text-align:right;font-weight:600;">${esc(args.parentName)}</td></tr>
        <tr><td style="padding:5px 0;color:#777;">Email</td><td style="text-align:right;font-weight:600;">${esc(args.parentEmail)}</td></tr>
        <tr><td style="padding:5px 0;color:#777;">Phone</td><td style="text-align:right;font-weight:600;"><a href="tel:${esc(args.parentPhone)}" style="color:#0f0f0f;text-decoration:none;">${esc(args.parentPhone)}</a></td></tr>
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
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
        You're on the waitlist
      </div>
      <h1 style="font-size:28px;line-height:1.05;margin:0 0 14px;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em;">
        Hi ${esc(args.parentName)}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 18px;">
        ${esc(args.participantName)} is officially on the IMMERSIA waitlist. The 2026 cohort is currently full at 50 paid slots, but we open spots when paid registrations cancel within 7 days of camp start.
      </p>
      <div style="background:#2d2e83;color:#fff;border-radius:16px;padding:18px 22px;margin:18px 0;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.22em;color:rgba(255,255,255,0.8);text-transform:uppercase;margin-bottom:4px;">
          What happens if a slot opens
        </div>
        <p style="font-size:14px;line-height:1.55;margin:0;">
          We email everyone on the waitlist at the same moment. <strong>First paid registration wins the slot.</strong> Camp begins 27 July 2026.
        </p>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#777;margin:0;">
        No payment is needed yet, we just wanted you on the list. If you have questions, reply to this email.
      </p>
    </div>
  `;
  return shell(content);
}

export function parentFeedbackHtml(args: {
  parentName: string;
  parentEmail: string;
  message: string;
  submittedAt: string;
}): string {
  const content = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:24px;padding:36px 28px;box-shadow:0 12px 40px rgba(15,15,15,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
        Parent dashboard feedback
      </div>
      <h1 style="font-size:26px;line-height:1.1;margin:0 0 14px;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em;">
        ${esc(args.parentName)}
      </h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;font-size:14px;">
        <tr><td style="padding:5px 0;color:#777;">Email</td><td style="text-align:right;font-weight:600;">${esc(args.parentEmail)}</td></tr>
        <tr><td style="padding:5px 0;color:#777;">Submitted</td><td style="text-align:right;font-weight:600;">${esc(args.submittedAt)}</td></tr>
      </table>
      <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:16px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
          Message
        </div>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#3a3a3a;">${esc(args.message)}</div>
      </div>
    </div>
  `;
  return shell(content);
}
