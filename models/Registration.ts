import mongoose, { Schema, Model, Types } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "abandoned";
export type AdmissionStatus = "pending" | "admitted" | "rejected";
export type PricingTier = "early_bird" | "regular";

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
  courses: string[];
  laptopRental: boolean;
  roboticsElective: boolean;
  pricing: {
    tier: PricingTier;
    bootCampFee: number;
    laptopRentalFee: number;
    roboticsFee: number;
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
    courses: { type: [String], required: true },
    laptopRental: { type: Boolean, default: false },
    roboticsElective: { type: Boolean, default: false },
    pricing: {
      tier: { type: String, enum: ["early_bird", "regular"], required: true },
      bootCampFee: { type: Number, required: true },
      laptopRentalFee: { type: Number, required: true, default: 0 },
      roboticsFee: { type: Number, required: true, default: 0 },
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
