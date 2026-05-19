/**
 * Legacy course catalog — kept in sync with `lib/curriculum.ts` so any DB-driven
 * code (admin reports, registration records, exports) resolves the same names.
 *
 * The landing page, course detail pages, and registration form all read from
 * `lib/curriculum.ts` directly. This file exists only for the seed script and
 * any backwards-compatible reads against the DB Course collection.
 */

export type Course = {
  code: string;
  name: string;
  category: string;
  description: string;
  isCompulsory?: boolean;
  isAttraction?: boolean;
  pairedWith?: string;
  isActive: boolean;
  order: number;
};

export const SEED_COURSES: Course[] = [
  // ===== CLASSES =====
  { code: "vibe-coding", name: "Vibe Coding & AI Prompt Engineering", category: "Tech", description: "Pair-program with AI to ship a real, deployed web app. Zero prior code required.", isActive: true, order: 1 },
  { code: "entrepreneurship", name: "Entrepreneurship & Pitching", category: "Business", description: "Idea → built product → live Demo Day pitch. Compulsory for every camper.", isCompulsory: true, isActive: true, order: 2 },
  { code: "content-creation", name: "Content Creation", category: "Creative", description: "Script, shoot, edit. Walk out with a portfolio of short-form videos.", isActive: true, order: 3 },
  { code: "robotics", name: "Robotics & Embedded Systems", category: "STEM", description: "Wire microcontrollers, write firmware, drive a real moving robot.", isActive: true, order: 4 },
  { code: "3d-vr", name: "3D Character Design & VR World Creation", category: "Creative Tech", description: "Sculpt characters in Blender. Step inside the world you made.", isActive: true, order: 5 },
  { code: "ai-music", name: "AI Music Production", category: "Creative", description: "Produce a finished, mixed track with AI-assisted tools.", isActive: true, order: 6 },

  // ===== ACTIVE BREAKS =====
  { code: "pro-gaming", name: "Pro Gaming / E-Sports", category: "Active Break", description: "Coached competitive gaming on real rigs. Daily, free choice.", isAttraction: true, isActive: true, order: 7 },
  { code: "table-tennis", name: "Table Tennis", category: "Active Break", description: "Sharpens reflexes between morning and afternoon classes. Daily, free choice.", isAttraction: true, isActive: true, order: 8 },
  { code: "go-karting", name: "Go Karting", category: "Active Break", description: "Short, supervised circuits with full safety gear. Daily, free choice.", isAttraction: true, isActive: true, order: 9 },
];
