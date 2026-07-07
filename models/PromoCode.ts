import mongoose, { Schema, Model } from "mongoose";
import type { DiscountType } from "@/lib/pricing";

export interface IPromoCode {
  /** The code a camper types at checkout. Stored UPPERCASE, matched case-insensitively. */
  code: string;
  description?: string;
  discountType: DiscountType; // "percent" | "fixed"
  /** Percent (1–100) when type is "percent", or a kobo amount when type is "fixed". */
  discountValue: number;
  /** Max confirmed uses; null = unlimited. */
  maxUses: number | null;
  /** Incremented once per *paid* registration that used this code. */
  usedCount: number;
  /** Optional minimum order subtotal (kobo) required for the code to apply. */
  minSubtotalKobo?: number;
  active: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  /** Email of the admin who created the code (audit). */
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    maxUses: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    minSubtotalKobo: { type: Number, min: 0 },
    active: { type: Boolean, default: true, index: true },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, strict: true }
);

export const PromoCode: Model<IPromoCode> =
  (mongoose.models.PromoCode as Model<IPromoCode>) ||
  mongoose.model<IPromoCode>("PromoCode", PromoCodeSchema);
