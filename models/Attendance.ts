import mongoose, { Schema, Model, Types } from "mongoose";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

/**
 * One row per camper per day. Facilitators record this from the admin
 * roster page; parents see the resulting log on each camper's profile.
 *
 * `date` is stored as midnight UTC of the camp day for clean grouping.
 */
export interface IAttendance {
  registrationId: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  note?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    registrationId: { type: Schema.Types.ObjectId, ref: "Registration", required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    note: { type: String, trim: true },
    recordedBy: { type: String, required: true, trim: true },
  },
  { timestamps: true, strict: true }
);

// One row per camper per day; upserts overwrite the previous record.
AttendanceSchema.index({ registrationId: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> =
  (mongoose.models.Attendance as Model<IAttendance>) ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);
