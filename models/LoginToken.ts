import mongoose, { Schema, Model, Types } from "mongoose";

/**
 * One-time passwordless login token for the parent + teacher portals.
 *
 * Security: we store only the SHA-256 HASH of the raw token (never the raw
 * value), the token is single-use (`usedAt`), and short-lived. A TTL index on
 * `expiresAt` lets MongoDB sweep expired rows automatically.
 */
export type LoginTokenRole = "parent" | "teacher";

export interface ILoginToken {
  tokenHash: string;
  role: LoginTokenRole;
  accountId: Types.ObjectId; // ParentAccount._id or Teacher._id
  email: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const LoginTokenSchema = new Schema<ILoginToken>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["parent", "teacher"], required: true },
    accountId: { type: Schema.Types.ObjectId, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, strict: true }
);

// TTL: MongoDB removes the doc once expiresAt passes.
LoginTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LoginToken: Model<ILoginToken> =
  (mongoose.models.LoginToken as Model<ILoginToken>) ||
  mongoose.model<ILoginToken>("LoginToken", LoginTokenSchema);
