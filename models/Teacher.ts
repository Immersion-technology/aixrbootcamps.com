import mongoose, { Schema, Model } from "mongoose";

/**
 * A facilitator who logs in to mark attendance and view their roster.
 * Created by an admin (no public signup). Login is passwordless via a
 * one-time magic link (see lib/magic-link.ts + lib/teacher-auth.ts) — there is
 * no password on this model by design.
 */
export interface ITeacher {
  email: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  /** Optional external profile link (portfolio, GitHub, LinkedIn). */
  link?: string;
  /** Curriculum class slugs this teacher is assigned to (informational; every camper attends every class). */
  assignedCourses: string[];
  isActive: boolean;
  /** Manual display order on the public roster (lower = earlier). Defaults high so unset rows fall to the back. */
  order: number;
  createdAt: Date;
  lastLoginAt?: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    bio: { type: String, trim: true, default: "" },
    photoUrl: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" },
    assignedCourses: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 1000 },
    lastLoginAt: { type: Date },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, strict: true }
);

export const Teacher: Model<ITeacher> =
  (mongoose.models.Teacher as Model<ITeacher>) || mongoose.model<ITeacher>("Teacher", TeacherSchema);
