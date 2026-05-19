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

export const Waitlist: Model<IWaitlist> =
  (mongoose.models.Waitlist as Model<IWaitlist>) ||
  mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);
