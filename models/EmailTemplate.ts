import mongoose, { Schema, Model } from "mongoose";
import type { Blocks } from "@/lib/email/blocks";

/**
 * The content library — reusable block bodies an admin can start a campaign
 * from ("Day-one logistics", "Slot opened", "Demo Day invite").
 *
 * Templates are a starting point only: creating a campaign COPIES the blocks,
 * so editing a template never changes a campaign that already went out.
 *
 * NOTE: this is not where the 7 automated transactional emails live — those stay
 * in code (lib/mailer.ts) on purpose, so a bad edit can never break a receipt.
 */
export interface IEmailTemplate {
  name: string;
  description: string;
  subject: string;
  preheader: string;
  blocks: Blocks;
  createdBy: string;
  updatedBy?: string;
  /** Soft delete — keeps provenance for campaigns created from it. */
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true, default: "" },
    subject: { type: String, required: true, trim: true },
    preheader: { type: String, trim: true, default: "" },
    // Validated by `blocksSchema` (zod) at the API boundary. Mixed doesn't track
    // deep mutation — always assign a fresh array rather than mutating in place.
    blocks: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: String, required: true, trim: true },
    updatedBy: { type: String, trim: true },
    archivedAt: { type: Date },
  },
  { timestamps: true, strict: true }
);

export const EmailTemplate: Model<IEmailTemplate> =
  (mongoose.models.EmailTemplate as Model<IEmailTemplate>) ||
  mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
