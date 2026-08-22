import mongoose, { Schema, Model } from "mongoose";

export interface IWaitlist {
  email: string;
  parentName: string;
  participantName: string;
  phone: string;
  createdAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    parentName: { type: String, required: true, trim: true },
    participantName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, strict: true }
);

// Listed newest-first and now filterable by date. Same reasoning as Registration:
// createdAt is a `timestamps` field, so it needs an explicit index.
WaitlistSchema.index({ createdAt: -1 });

export const Waitlist: Model<IWaitlist> =
  (mongoose.models.Waitlist as Model<IWaitlist>) ||
  mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);
