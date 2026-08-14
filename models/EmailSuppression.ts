import mongoose, { Schema, Model, Types } from "mongoose";

/**
 * Addresses that must not receive campaign email.
 *
 * THE RULE: campaigns always check this list; transactional mail never does.
 * A parent who unsubscribes from camp updates must still get their payment
 * receipt and their portal login link — those are contractual, not marketing,
 * and withholding them would break the product. `lib/mailer.ts` therefore has
 * no knowledge of this collection, by design.
 */
export type SuppressionReason = "unsubscribe" | "bounce" | "complaint" | "admin";

export interface IEmailSuppression {
  email: string;
  reason: SuppressionReason;
  /** Where it came from, e.g. "one-click", "footer link", "smtp 550". */
  source: string;
  /** The campaign that triggered it, when there was one. */
  campaignId?: Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const EmailSuppressionSchema = new Schema<IEmailSuppression>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    reason: {
      type: String,
      enum: ["unsubscribe", "bounce", "complaint", "admin"],
      required: true,
    },
    source: { type: String, default: "", trim: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    note: { type: String, trim: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, strict: true }
);

export const EmailSuppression: Model<IEmailSuppression> =
  (mongoose.models.EmailSuppression as Model<IEmailSuppression>) ||
  mongoose.model<IEmailSuppression>("EmailSuppression", EmailSuppressionSchema);

/**
 * Add an address to the suppression list. Idempotent — re-unsubscribing keeps
 * the ORIGINAL reason and timestamp, so a later bounce can't overwrite the
 * record of a deliberate opt-out.
 */
export async function suppress(opts: {
  email: string;
  reason: SuppressionReason;
  source?: string;
  campaignId?: Types.ObjectId;
  note?: string;
}): Promise<void> {
  await EmailSuppression.updateOne(
    { email: opts.email.toLowerCase().trim() },
    {
      $setOnInsert: {
        email: opts.email.toLowerCase().trim(),
        reason: opts.reason,
        source: opts.source ?? "",
        campaignId: opts.campaignId,
        note: opts.note,
      },
    },
    { upsert: true }
  );
}

/** The subset of `emails` that are suppressed, as a lowercase Set. */
export async function suppressedSet(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const rows = await EmailSuppression.find({
    email: { $in: emails.map((e) => e.toLowerCase().trim()) },
  })
    .select("email")
    .lean();
  return new Set(rows.map((r) => r.email));
}
