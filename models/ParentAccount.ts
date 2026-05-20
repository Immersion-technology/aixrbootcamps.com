import mongoose, { Schema, Model } from "mongoose";

/**
 * A logged-in parent / guardian. One ParentAccount can be linked to one
 * or more Registration documents (multiple kids). Created automatically
 * after Paystack confirms payment — but a parent has to set their own
 * password via a one-time `passwordSetupToken` before they can log in.
 */
export interface IParentAccount {
  email: string;
  passwordHash?: string;
  name: string;
  phone: string;
  /** One-time token emailed to the parent to set their initial password. */
  passwordSetupToken?: string;
  passwordSetupExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const ParentAccountSchema = new Schema<IParentAccount>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordSetupToken: { type: String, index: true, sparse: true },
    passwordSetupExpiresAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, strict: true }
);

export const ParentAccount: Model<IParentAccount> =
  (mongoose.models.ParentAccount as Model<IParentAccount>) ||
  mongoose.model<IParentAccount>("ParentAccount", ParentAccountSchema);
