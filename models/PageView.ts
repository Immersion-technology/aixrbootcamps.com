import mongoose, { Schema, Model } from "mongoose";

export interface IPageView {
  path: string;
  referrer: string;
  ua: string;
  ts: Date;
  visitorId: string;
  ip: string;
  country: string;
  city: string;
  device: string;
  os: string;
  browser: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

const PageViewSchema = new Schema<IPageView>(
  {
    path:        { type: String, required: true, index: true },
    referrer:    { type: String, default: "" },
    ua:          { type: String, default: "" },
    ts:          { type: Date,   required: true, index: true },
    visitorId:   { type: String, default: "", index: true },
    ip:          { type: String, default: "" },
    country:     { type: String, default: "" },
    city:        { type: String, default: "" },
    device:      { type: String, default: "" },
    os:          { type: String, default: "" },
    browser:     { type: String, default: "" },
    utmSource:   { type: String, default: "" },
    utmMedium:   { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
  },
  { strict: true }
);

export const PageView: Model<IPageView> =
  (mongoose.models.PageView as Model<IPageView>) ||
  mongoose.model<IPageView>("PageView", PageViewSchema);
