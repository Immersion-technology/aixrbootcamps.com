import mongoose, { Schema, Model } from "mongoose";

export interface ICourse {
  code: string;
  name: string;
  category?: string;
  description?: string;
  isCompulsory: boolean;
  /** True for active-break activities (Pro Gaming, Table Tennis, Go Karting). */
  isAttraction: boolean;
  isActive: boolean;
  order: number;
}

const CourseSchema = new Schema<ICourse>(
  {
    code: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    isCompulsory: { type: Boolean, default: false },
    isAttraction: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
);

export const Course: Model<ICourse> =
  (mongoose.models.Course as Model<ICourse>) || mongoose.model<ICourse>("Course", CourseSchema);
