import mongoose, { Schema, Model, Types } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "abandoned";
export type AdmissionStatus = "pending" | "admitted" | "rejected";
export type PricingTier = "early_bird" | "regular" | "online";

export interface IStatusLog {
  action: string;
  by: string;
  at: Date;
  note?: string;
}

export interface IRegistration {
  registrationId: string;
  participant: {
    fullName: string;
    dateOfBirth: Date;
    gender: "Male" | "Female" | "Prefer not to say";
    school: string;
    classGrade?: string;
    tshirtSize: "XS" | "S" | "M" | "L" | "XL";
  };
  parent: {
    fullName: string;
    relationship: "Mother" | "Father" | "Guardian" | "Other";
    phonePrimary: string;
    phoneSecondary?: string;
    email: string;
    address: string;
  };
  emergencyContact: {
    fullName: string;
    phone: string;
    relationship: string;
  };
  medicalNotes?: string;
  attendanceMode: "in_person" | "online";
  /** The 2-week cohort the camper attends (1, 2 or 3). See lib/cohorts.ts. */
  cohort?: 1 | 2 | 3;
  courses: string[];
  laptopRental: boolean;
  roboticsElective: boolean;
  pricing: {
    tier: PricingTier;
    bootCampFee: number;
    laptopRentalFee: number;
    roboticsFee: number;
    /** Order total before any promo discount (bootcamp + add-ons). */
    subtotal?: number;
    /** Promo discount applied, in kobo (0 when no code). */
    discountKobo?: number;
    /**
     * Mandatory nationwide delivery fee for the online welcome kit, in kobo. 0 for
     * in-person registrations. Added to `total` on top of the (discounted) subtotal.
     */
    deliveryFee?: number;
    /** The promo code used, if any (stored UPPERCASE). */
    promoCode?: string;
    /** Final charged amount, in kobo. Must equal what Paystack charges. */
    total: number;
  };
  paymentStatus: PaymentStatus;
  admissionStatus: AdmissionStatus;
  paymentReference: string;
  paidAt?: Date;
  statusLog: IStatusLog[];
  internalNotes?: string;
  agreedToTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StatusLogSchema = new Schema<IStatusLog>(
  {
    action: { type: String, required: true },
    by: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const RegistrationSchema = new Schema<IRegistration>(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    participant: {
      fullName: { type: String, required: true, trim: true },
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, enum: ["Male", "Female", "Prefer not to say"], required: true },
      school: { type: String, required: true, trim: true },
      classGrade: { type: String, trim: true },
      tshirtSize: { type: String, enum: ["XS", "S", "M", "L", "XL"], required: true },
    },
    parent: {
      fullName: { type: String, required: true, trim: true },
      relationship: { type: String, enum: ["Mother", "Father", "Guardian", "Other"], required: true },
      phonePrimary: { type: String, required: true, trim: true },
      phoneSecondary: { type: String, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      address: { type: String, required: true, trim: true },
    },
    emergencyContact: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      relationship: { type: String, required: true, trim: true },
    },
    medicalNotes: { type: String, trim: true },
    attendanceMode: { type: String, enum: ["in_person", "online"], default: "in_person", index: true },
    // Optional at the schema level so pre-cohort legacy registrations can still be re-saved by
    // reconcileAndConfirm; always set on new registrations (the create API requires it).
    cohort: { type: Number, enum: [1, 2, 3], index: true },
    courses: { type: [String], required: true },
    laptopRental: { type: Boolean, default: false },
    roboticsElective: { type: Boolean, default: false },
    pricing: {
      tier: { type: String, enum: ["early_bird", "regular", "online"], required: true },
      bootCampFee: { type: Number, required: true },
      laptopRentalFee: { type: Number, required: true, default: 0 },
      roboticsFee: { type: Number, required: true, default: 0 },
      // Optional (not required) so pre-promo legacy registrations can still be re-saved
      // by reconcileAndConfirm without failing validation; always set on new registrations.
      subtotal: { type: Number },
      discountKobo: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      promoCode: { type: String, trim: true, uppercase: true },
      total: { type: Number, required: true },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "abandoned"],
      default: "pending",
      index: true,
    },
    admissionStatus: {
      type: String,
      enum: ["pending", "admitted", "rejected"],
      default: "pending",
      index: true,
    },
    paymentReference: { type: String, required: true, unique: true, index: true },
    paidAt: { type: Date },
    statusLog: { type: [StatusLogSchema], default: [] },
    internalNotes: { type: String },
    agreedToTerms: { type: Boolean, required: true },
  },
  { timestamps: true, strict: true }
);

export const Registration: Model<IRegistration> =
  (mongoose.models.Registration as Model<IRegistration>) ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);
