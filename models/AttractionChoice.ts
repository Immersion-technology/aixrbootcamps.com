import mongoose, { Schema, Model, Types } from "mongoose";

export type Attraction = "table-tennis" | "go-karting" | "pro-gaming";

export const ATTRACTIONS: Attraction[] = ["table-tennis", "go-karting", "pro-gaming"];

/**
 * One row per camper per day: which side attraction they spent their daily
 * token on during the 1:00–1:30 PM break. Facilitators record this from the
 * teacher roster page; parents see the resulting log on each camper's profile.
 *
 * `date` is stored as midnight UTC of the camp day for clean grouping,
 * mirroring the Attendance model.
 */
export interface IAttractionChoice {
  registrationId: Types.ObjectId;
  date: Date;
  attraction: Attraction;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttractionChoiceSchema = new Schema<IAttractionChoice>(
  {
    registrationId: { type: Schema.Types.ObjectId, ref: "Registration", required: true, index: true },
    date: { type: Date, required: true, index: true },
    attraction: {
      type: String,
      enum: ATTRACTIONS,
      required: true,
    },
    recordedBy: { type: String, required: true, trim: true },
  },
  { timestamps: true, strict: true }
);

// One pick per camper per day; upserts overwrite the previous choice.
AttractionChoiceSchema.index({ registrationId: 1, date: 1 }, { unique: true });

export const AttractionChoice: Model<IAttractionChoice> =
  (mongoose.models.AttractionChoice as Model<IAttractionChoice>) ||
  mongoose.model<IAttractionChoice>("AttractionChoice", AttractionChoiceSchema);
