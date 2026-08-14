import mongoose, { Schema, Model, Types } from "mongoose";
import type { Blocks } from "@/lib/email/blocks";

/**
 * One admin-composed broadcast. The block body is snapshotted here at send time
 * and the document becomes immutable once `status` leaves draft/scheduled — a
 * campaign already in someone's inbox must never disagree with what we stored.
 *
 * Re-sending is done by duplicating into a fresh draft, never by editing.
 */
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "paused"
  | "sent"
  | "cancelled"
  | "failed";

/** Statuses whose content may still be edited. */
export const EDITABLE_STATUSES: CampaignStatus[] = ["draft", "scheduled"];

/** Statuses the drain worker should pick up. */
export const DRAINABLE_STATUSES: CampaignStatus[] = ["sending"];

export interface ICampaignStats {
  /** Recipients enqueued (after suppression filtering). */
  total: number;
  sent: number;
  failed: number;
  /** Recipients skipped because they had unsubscribed or hard-bounced. */
  suppressed: number;
  opened: number;
}

export interface ICampaign {
  name: string;
  subject: string;
  preheader: string;
  blocks: Blocks;
  /** Overrides the default reply-to (SMTP_FROM) for this campaign only. */
  replyTo?: string;
  segment: {
    source: string;
    filters: Record<string, unknown>;
  };
  status: CampaignStatus;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  stats: ICampaignStats;
  trackOpens: boolean;
  /** Admin emails, matching the `by` convention in Registration.statusLog. */
  createdBy: string;
  sentBy?: string;
  /** Set when the whole campaign fails to start (not per-recipient errors). */
  lastError?: string;
  /** Template this was created from, for provenance only. */
  templateId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    preheader: { type: String, trim: true, default: "" },
    // Validated by `blocksSchema` (zod) at the API boundary — mongoose can't
    // express a discriminated union. NOTE: Mixed doesn't track deep mutation,
    // so always assign a fresh array rather than mutating in place.
    blocks: { type: Schema.Types.Mixed, required: true },
    replyTo: { type: String, trim: true, lowercase: true },
    segment: {
      source: { type: String, required: true },
      filters: { type: Schema.Types.Mixed, default: {} },
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "paused", "sent", "cancelled", "failed"],
      default: "draft",
      index: true,
    },
    scheduledFor: { type: Date, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      suppressed: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
    },
    trackOpens: { type: Boolean, default: false },
    createdBy: { type: String, required: true, trim: true },
    sentBy: { type: String, trim: true },
    lastError: { type: String },
    templateId: { type: Schema.Types.ObjectId, ref: "EmailTemplate" },
  },
  { timestamps: true, strict: true }
);

export const Campaign: Model<ICampaign> =
  (mongoose.models.Campaign as Model<ICampaign>) ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);
