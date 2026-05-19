import mongoose, { Schema, Model } from "mongoose";

export interface IAdmin {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, strict: true }
);

export const Admin: Model<IAdmin> =
  (mongoose.models.Admin as Model<IAdmin>) || mongoose.model<IAdmin>("Admin", AdminSchema);
