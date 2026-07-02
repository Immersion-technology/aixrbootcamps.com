import mongoose, { Schema, Model } from "mongoose";

export interface IPageView {
  path: string;
  referrer: string;
  ua: string;
  ts: Date;
}

const PageViewSchema = new Schema<IPageView>(
  {
    path:     { type: String, required: true, index: true },
    referrer: { type: String, default: "" },
    ua:       { type: String, default: "" },
    ts:       { type: Date,   required: true, index: true },
  },
  { strict: true }
);

export const PageView: Model<IPageView> =
  (mongoose.models.PageView as Model<IPageView>) ||
  mongoose.model<IPageView>("PageView", PageViewSchema);
