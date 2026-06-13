import mongoose, { Schema, Model, Types } from "mongoose";

export interface IPayment {
  registrationId: Types.ObjectId;
  paymentReference: string;
  // Paystack's transaction reference. We pass our own paymentReference to
  // Paystack as the reference, so the two coincide. Kept for refunds and audit.
  transactionReference?: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "abandoned" | "refunded" | "manual";
  channel?: string;
  rawWebhookPayload?: Record<string, unknown>;
  receivedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    registrationId: { type: Schema.Types.ObjectId, ref: "Registration", required: true, index: true },
    paymentReference: { type: String, required: true, index: true },
    transactionReference: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: { type: String, enum: ["success", "failed", "abandoned", "refunded", "manual"], required: true },
    channel: { type: String },
    rawWebhookPayload: { type: Schema.Types.Mixed },
    receivedAt: { type: Date, default: Date.now },
  },
  { strict: true }
);

PaymentSchema.index({ paymentReference: 1, status: 1 });

export const Payment: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment>) || mongoose.model<IPayment>("Payment", PaymentSchema);
