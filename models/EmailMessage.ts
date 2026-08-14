import mongoose, { Schema, Model, Types } from "mongoose";

/**
 * The outbox: one row per recipient per campaign. This is the queue, the audit
 * log and the per-parent delivery history all at once.
 *
 * Concurrency model — a worker claims work with a single atomic
 * `findOneAndUpdate` that flips `queued → sending` and stamps `lockedUntil`
 * (a lease). Two overlapping drains therefore can never claim the same row, and
 * a worker that dies mid-send leaves a lease that simply expires and is retried.
 * The unique (campaignId, email) index makes enqueue idempotent, so a
 * double-clicked Send button can't create a second copy of the list.
 */
export type EmailMessageStatus = "queued" | "sending" | "sent" | "failed" | "suppressed";

export interface IEmailMessage {
  campaignId: Types.ObjectId;
  email: string;
  name: string;
  /** Per-recipient merge values, resolved at enqueue time. */
  mergeData: Record<string, string>;
  status: EmailMessageStatus;
  attempts: number;
  /** Earliest time this may be claimed — drives retry backoff. */
  nextAttemptAt: Date;
  /** Lease expiry. A row is claimable only when this is in the past. */
  lockedUntil: Date;
  sentAt?: Date;
  /** Provider/SMTP message id, for tracing a specific delivery. */
  providerMessageId?: string;
  error?: string;
  /** SMTP/provider code, e.g. "EENVELOPE" or "550". */
  errorCode?: string;
  openedAt?: Date;
  openCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmailMessageSchema = new Schema<IEmailMessage>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: "", trim: true },
    mergeData: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "failed", "suppressed"],
      default: "queued",
    },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: () => new Date() },
    // Epoch default = immediately claimable.
    lockedUntil: { type: Date, default: () => new Date(0) },
    sentAt: { type: Date },
    providerMessageId: { type: String },
    error: { type: String },
    errorCode: { type: String },
    openedAt: { type: Date },
    openCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
);

// Idempotent enqueue: one row per recipient per campaign, always.
EmailMessageSchema.index({ campaignId: 1, email: 1 }, { unique: true });
// The claim query — status + readiness + lease, in that order.
EmailMessageSchema.index({ status: 1, nextAttemptAt: 1, lockedUntil: 1 });
// Campaign progress counts.
EmailMessageSchema.index({ campaignId: 1, status: 1 });
// "What have we sent this parent?" on the registration detail page.
EmailMessageSchema.index({ email: 1, sentAt: -1 });

export const EmailMessage: Model<IEmailMessage> =
  (mongoose.models.EmailMessage as Model<IEmailMessage>) ||
  mongoose.model<IEmailMessage>("EmailMessage", EmailMessageSchema);
