/**
 * Campaign delivery transport.
 *
 * Today this rides the same Gmail SMTP connection as transactional mail. That
 * is a real constraint, not a detail: a free Gmail account caps at ~500
 * recipients/day, rewrites the From header to the authenticated gmail.com
 * address (so campaigns can't DMARC-align to immersia.ng), and reports nothing
 * back about bounces or complaints.
 *
 * Everything the sender needs therefore goes through this one seam, so moving
 * to Resend / Brevo / ZeptoMail on the real domain is an env var plus one
 * adapter — not a rewrite of the queue. See `MAIL_TRANSPORT`.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { sendMail } from "@/lib/mailer";

export interface OutgoingMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface SendResult {
  messageId: string;
}

export interface EmailTransport {
  readonly name: string;
  send(message: OutgoingMessage): Promise<SendResult>;
}

/**
 * How the queue should react to a failure.
 * - `transient` → leave it queued, back off, try again (network blip, rate limit).
 * - `permanent` → stop trying. A bad mailbox will still be bad in an hour, and
 *   retrying it burns the daily quota that good addresses need.
 */
export type FailureKind = "transient" | "permanent";

export interface ClassifiedError {
  kind: FailureKind;
  code: string;
  message: string;
  /** True for "no such mailbox" — the address should join the suppression list. */
  isHardBounce: boolean;
}

/** Nodemailer/SMTP error shapes we care about. */
interface SmtpishError {
  responseCode?: number;
  code?: string;
  command?: string;
  message?: string;
  rejected?: string[];
}

const TRANSIENT_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNECTION",
  "ESOCKET",
  "EDNS",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

/**
 * SMTP enhanced codes that mean "this mailbox does not exist". Worth suppressing
 * permanently — continuing to mail a dead address is what wrecks sender reputation.
 */
const HARD_BOUNCE_RE = /5\.1\.[01]|550[\s-]*5\.1\.1|user unknown|no such user|mailbox (unavailable|not found)|recipient (address )?rejected|does not exist/i;

/** Gmail's "you've hit your limit" responses — transient, but the daily cap should also kick in. */
const RATE_LIMIT_RE = /4\.7\.0|too many|rate limit|try again later|temporarily (deferred|rejected)|quota exceeded/i;

export function classifyError(err: unknown): ClassifiedError {
  const e = (err ?? {}) as SmtpishError;
  const message = String(e.message ?? err ?? "Unknown error").slice(0, 500);
  const code = String(e.code ?? e.responseCode ?? "UNKNOWN");

  if (typeof e.responseCode === "number") {
    // 4xx = try later. 5xx = don't.
    if (e.responseCode >= 400 && e.responseCode < 500) {
      return { kind: "transient", code, message, isHardBounce: false };
    }
    if (e.responseCode >= 500) {
      return { kind: "permanent", code, message, isHardBounce: HARD_BOUNCE_RE.test(message) };
    }
  }

  if (e.code && TRANSIENT_CODES.has(e.code)) {
    return { kind: "transient", code, message, isHardBounce: false };
  }

  if (RATE_LIMIT_RE.test(message)) {
    return { kind: "transient", code, message, isHardBounce: false };
  }

  if (HARD_BOUNCE_RE.test(message)) {
    return { kind: "permanent", code, message, isHardBounce: true };
  }

  // EENVELOPE means the address itself was rejected before any send happened.
  if (e.code === "EENVELOPE") {
    return { kind: "permanent", code, message, isHardBounce: true };
  }

  // Unknown shape: treat as transient so a surprise never silently drops mail —
  // the attempt cap stops it looping forever.
  return { kind: "transient", code, message, isHardBounce: false };
}

// ------------------------------------------------------------------- smtp ---

const smtpTransport: EmailTransport = {
  name: "smtp",
  async send(message) {
    const info = await sendMail({
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      headers: message.headers,
    });

    // Nodemailer can accept the envelope but still reject individual recipients.
    const rejected = (info as { rejected?: string[] } | undefined)?.rejected ?? [];
    if (rejected.length > 0) {
      const err: SmtpishError = {
        message: `Recipient rejected by the mail server: ${rejected.join(", ")}`,
        code: "EENVELOPE",
        rejected,
      };
      throw err;
    }

    return { messageId: String((info as { messageId?: string } | undefined)?.messageId ?? "") };
  },
};

// ---------------------------------------------------------------- console ---

/**
 * Dry-run transport: writes each rendered email to `.mail-outbox/` and sends
 * nothing. This is how you rehearse a full campaign — segments, merge fields,
 * throttling, the lot — against real data without touching a real inbox.
 * Enable with `MAIL_TRANSPORT=console`.
 */
const OUTBOX_DIR = join(process.cwd(), ".mail-outbox");
let outboxReady = false;
let outboxSeq = 0;

const consoleTransport: EmailTransport = {
  name: "console",
  async send(message) {
    if (!outboxReady) {
      mkdirSync(OUTBOX_DIR, { recursive: true });
      outboxReady = true;
    }
    outboxSeq += 1;
    const safe = message.to.replace(/[^a-z0-9]+/gi, "_").slice(0, 60);
    const file = join(OUTBOX_DIR, `${String(outboxSeq).padStart(4, "0")}-${safe}.html`);
    const meta = `<!--\n  to: ${message.to}\n  subject: ${message.subject}\n  headers: ${JSON.stringify(
      message.headers ?? {}
    )}\n-->\n`;
    writeFileSync(file, meta + message.html);
    console.log(`[mail:console] ${message.to} — "${message.subject}" → ${file}`);
    return { messageId: `console-${outboxSeq}` };
  },
};

// ----------------------------------------------------------------- select ---

/**
 * Adding an ESP: implement `EmailTransport` against its HTTP API, register it
 * here, and set `MAIL_TRANSPORT`. The queue, retries, suppression and
 * unsubscribe handling all keep working unchanged. The one extra thing an ESP
 * gives you is a bounce/complaint webhook — wire it to `suppress()` in
 * models/EmailSuppression.ts.
 */
const TRANSPORTS: Record<string, EmailTransport> = {
  smtp: smtpTransport,
  console: consoleTransport,
};

export function getTransport(): EmailTransport {
  const key = (process.env.MAIL_TRANSPORT ?? "smtp").trim().toLowerCase();
  const transport = TRANSPORTS[key];
  if (!transport) {
    throw new Error(
      `Unknown MAIL_TRANSPORT "${key}". Valid values: ${Object.keys(TRANSPORTS).join(", ")}.`
    );
  }
  return transport;
}
