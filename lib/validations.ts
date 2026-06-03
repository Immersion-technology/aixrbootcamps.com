import { z } from "zod";

const naijaPhone = z
  .string()
  .trim()
  .regex(/^(\+?234|0)[789]\d{9}$/, "Enter a valid Nigerian mobile number");

export const participantSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  dateOfBirth: z.string().refine((d) => {
    const dob = new Date(d);
    if (isNaN(dob.getTime())) return false;
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 10 && age <= 17;
  }, "Participant must be between 10 and 17 years old"),
  gender: z.enum(["Male", "Female", "Prefer not to say"]),
  school: z.string().trim().min(2, "School name is required"),
  classGrade: z.string().trim().optional().default(""),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL"]),
});

export const parentSchema = z.object({
  fullName: z.string().trim().min(2),
  relationship: z.enum(["Mother", "Father", "Guardian", "Other"]),
  phonePrimary: naijaPhone,
  phoneSecondary: z.string().trim().optional().default(""),
  email: z.string().trim().email(),
  address: z.string().trim().min(5),
});

export const emergencySchema = z.object({
  fullName: z.string().trim().min(2),
  phone: naijaPhone,
  relationship: z.string().trim().min(2),
});

export const registrationCreateSchema = z.object({
  participant: participantSchema,
  parent: parentSchema,
  emergencyContact: emergencySchema,
  medicalNotes: z.string().trim().optional().default(""),
  laptopRental: z.boolean(),
  roboticsElective: z.boolean().optional().default(false),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the rules of conduct" }),
  }),
});

export type RegistrationCreateInput = z.infer<typeof registrationCreateSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["pending", "admitted", "rejected"]),
  note: z.string().trim().optional().default(""),
});

export const waitlistSchema = z.object({
  email: z.string().trim().email(),
  parentName: z.string().trim().min(2),
  participantName: z.string().trim().min(2),
  phone: naijaPhone,
});

export const courseSchema = z.object({
  code: z.string().trim().min(2),
  name: z.string().trim().min(2),
  category: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  isCompulsory: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
