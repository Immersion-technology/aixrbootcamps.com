import mongoose, { Schema, Model } from "mongoose";

/**
 * A logged-in parent / guardian. One ParentAccount can be linked to one
 * or more Registration documents (multiple kids), matched by email. Created
 * automatically after Monnify confirms payment. Login is passwordless via a
 * one-time magic link (see lib/magic-link.ts) — there is no password by design.
 */
export interface IParentAccount {
  email: string;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const ParentAccountSchema = new Schema<IParentAccount>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, strict: true }
);

export const ParentAccount: Model<IParentAccount> =
  (mongoose.models.ParentAccount as Model<IParentAccount>) ||
  mongoose.model<IParentAccount>("ParentAccount", ParentAccountSchema);
