import mongoose, { Schema, Model, Types } from "mongoose";

export interface ISetting {
  key: string;
  value: unknown;
  updatedAt: Date;
  updatedBy?: Types.ObjectId;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" }, strict: true }
);

export const Setting: Model<ISetting> =
  (mongoose.models.Setting as Model<ISetting>) || mongoose.model<ISetting>("Setting", SettingSchema);

// Helper to read a setting with a default fallback.
export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const doc = await Setting.findOne({ key }).lean<ISetting | null>();
  return (doc?.value as T) ?? fallback;
}

// Helper to upsert a setting.
export async function setSetting(key: string, value: unknown, updatedBy?: Types.ObjectId) {
  await Setting.updateOne(
    { key },
    { $set: { value, updatedBy } },
    { upsert: true }
  );
}

// Canonical setting keys used across the app.
export const SETTING_KEYS = {
  EARLY_BIRD_CUTOFF: "earlyBirdCutoff",
  CAPACITY: "capacity",
  EARLY_BIRD_PRICE: "earlyBirdPrice",
  REGULAR_PRICE: "regularPrice",
  LAPTOP_RENTAL_PRICE: "laptopRentalPrice",
  CAMP_START_DATE: "campStartDate",
  CAMP_END_DATE: "campEndDate",
  ADMIN_ALERT_EMAIL: "adminAlertEmail",
} as const;
