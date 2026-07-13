import { z } from "zod";

const naijaPhone = z
  .string()
  .trim()
  .regex(/^(\+?234|0)[789]\d{9}$/, "Enter a valid Nigerian mobile number");

export const participantSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  // Age restriction lifted — any age is accepted. We still require a real, parseable
  // date so the DB stores a valid dateOfBirth. (Applies to both the form and the API,
  // since this schema is shared.)
  dateOfBirth: z.string().refine((d) => !isNaN(new Date(d).getTime()), "Enter a valid date of birth"),
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
  attendanceMode: z.enum(["in_person", "online"]).default("in_person"),
  // Which 2-week cohort the camper attends (see lib/cohorts.ts). Coerced because the form
  // sends the radio value as a string; required so every new registration picks a cohort.
  cohort: z.coerce
    .number({ invalid_type_error: "Choose your 2-week cohort" })
    .refine((n) => n === 1 || n === 2 || n === 3, "Choose your 2-week cohort"),
  laptopRental: z.boolean(),
  roboticsElective: z.boolean().optional().default(false),
  // Optional promo code — the discount is validated + applied server-side; the client
  // only sends the string. Empty is treated as "no code" by the charge route.
  promoCode: z.string().trim().toUpperCase().max(40).optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the rules of conduct" }),
  }),
}).superRefine((data, ctx) => {
  // The online track is a trimmed programme: no laptop rental and no robotics elective
  // (both are in-person only). Guard here so a tampered payload can't buy them online —
  // the client form already hides these when online is selected.
  if (data.attendanceMode === "online") {
    if (data.laptopRental) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["laptopRental"],
        message: "Laptop rental is only available for in-person campers.",
      });
    }
    if (data.roboticsElective) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["roboticsElective"],
        message: "The Robotics elective is only available for in-person campers.",
      });
    }
  }
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

// --- Promo codes (admin) ---
// discountValue is a percent (1–100) when type is "percent", or a kobo amount when
// type is "fixed". maxUses null = unlimited. Dates are ISO strings (mongoose casts to Date).
export const promoCreateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Code must be at least 2 characters")
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, - and _"),
    description: z.string().trim().max(200).optional(),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number().int("Enter a whole number").positive("Must be greater than 0"),
    maxUses: z.number().int().positive().nullable().optional().default(null),
    minSubtotalKobo: z.number().int().nonnegative().optional(),
    active: z.boolean().optional().default(true),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .refine((d) => d.discountType !== "percent" || d.discountValue <= 100, {
    message: "A percentage discount can't exceed 100",
    path: ["discountValue"],
  });

export const promoUpdateSchema = z
  .object({
    active: z.boolean().optional(),
    description: z.string().trim().max(200).optional(),
    discountValue: z.number().int().positive().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    minSubtotalKobo: z.number().int().nonnegative().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });
