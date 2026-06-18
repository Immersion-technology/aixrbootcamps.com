/**
 * Adds/updates the real IMMERSIA facilitators on the public Teachers page.
 *
 * Run:  npm run add:teachers
 *
 * Idempotent: upserts by email, so re-running just updates the existing rows.
 * Unlike seed-demo, these are real (non-demo) records and are never auto-cleared.
 *
 * Photos are served from /public/teachers (drop the matching files there):
 *   public/teachers/faith-odiase.jpg
 *   public/teachers/ayotunde-adeboyeje.jpg
 */
import mongoose from "mongoose";
import { Teacher } from "../models/Teacher";

type RealTeacher = {
  name: string;
  email: string;
  order: number;
  assignedCourses: string[];
  photoUrl: string;
  bio: string;
  link?: string;
};

const TEACHERS: RealTeacher[] = [
  {
    name: "Faith Odiase, ACA",
    email: "faith.odiase@immersiavr.com",
    order: 1,
    assignedCourses: [], // Chief Growth Officer: supports the whole camp, not a single class
    photoUrl: "/teachers/faith-odiase.jpg",
    bio: "Faith Odiase, ACA is the Chief Growth Officer at Immersia VR, a leading force in Africa's immersive technology ecosystem. She leads growth strategy, product expansion, and strategic partnerships, driving the adoption of virtual reality solutions across enterprise, education, entertainment, culture, and social impact sectors.\n\nShe has spearheaded the delivery of high-impact immersive experiences for a diverse portfolio of organizations, working with leading brands across telecommunications, fintech, FMCG, finance, oil and gas, construction, fashion, and the public sector. Collaborations include companies such as Lafarge, UBA, MTN, Hennessy, Northwest Petroleum, the Bank of Industry, Orange Liberia, Red Bull, Kuda, Monster Energy, Ashluxe and Corona Schools, among others.\n\nFaith is passionate about bridging innovation with real-world usability. Through her work, she leverages immersive media to unlock new economic and creative opportunities across Africa. A strong advocate for expanding Africa's presence in the global XR landscape, she is committed to inspiring more women and young people to pursue careers in emerging technologies.",
  },
  {
    name: "Ayotunde Adeboyeje",
    email: "ayotunde.adeboyeje@immersiavr.com",
    order: 2,
    assignedCourses: ["robotics", "vibe-coding"],
    photoUrl: "/teachers/ayotunde-adeboyeje.jpg",
    bio: "Ayotunde Adeboyeje is a technology professional with a unique blend of software engineering, network administration, systems integration and business operations experience. At IMMERSIA he leads Robotics & Embedded Systems and Vibe Coding & AI Prompt Engineering, helping campers turn code into real-world, working projects.",
  },
  {
    name: "Nnabuife Emmanuel Ekene",
    email: "emmanuel.ekene@immersiavr.com",
    order: 3,
    assignedCourses: ["go-karting", "robotics"], // Go Karting + Embedded Systems
    photoUrl: "/teachers/emmanuel-ekene.jpg",
    bio: "Nnabuife Emmanuel Ekene, \"Emmyfixxit\" CEO, is a hands-on hardware specialist: a phone and gadgets technician, go-kart analyst and developer, scooter and hoverboard expert, and CCTV and networking installer. At IMMERSIA he instructs Go Karting and Embedded Systems, getting campers building, wiring and fixing real hardware with confidence.",
  },
  {
    name: "Chukwuka Temple",
    email: "chukwuka.temple@immersiavr.com",
    order: 4,
    assignedCourses: ["robotics", "3d-vr"], // Robotics & Embedded Systems + 3D/VR World Creation
    photoUrl: "/teachers/chukwuka-temple.jpg",
    bio: "Chukwuka Temple is a VR developer and electronics enthusiast with experience building immersive virtual reality applications and working on electronic systems and hardware projects. He is skilled at combining software and electronics to create interactive, innovative solutions that bridge the physical and digital worlds. At IMMERSIA he teaches Robotics & Embedded Systems and 3D World Creation.",
  },
  {
    name: "Tobiloba Sulaimon",
    email: "tobiloba.sulaimon@immersiavr.com",
    order: 5,
    assignedCourses: ["vibe-coding"], // Fullstack Web Dev + Building with AI -> Vibe Coding & AI Prompt Engineering
    photoUrl: "/teachers/tobiloba-sulaimon.png",
    link: "https://github.com/tobilobacodes00",
    bio: "Tobiloba is a fullstack software engineer who builds web, mobile, and AI products. He works with tools like React, Next.js, TypeScript, Node, Python, and Rust, and enjoys turning tricky ideas into simple, practical steps. He is always learning something new alongside the people he teaches.",
  },
];

// Demo placeholders (from scripts/seed-demo.ts) to purge from the public roster.
const REMOVE_EMAILS = [
  "tunde.bakare@immersia.ng",
  "amaka.eze@immersia.ng",
  "kola.williams@immersia.ng",
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("Connected. Adding facilitators…\n");

  // Drop the seeded demo teachers so only the real roster shows.
  const removed = await Teacher.deleteMany({ email: { $in: REMOVE_EMAILS } });
  if (removed.deletedCount) console.log(`✓ Removed ${removed.deletedCount} demo placeholder(s)`);

  // Make sure any pre-existing teachers without an explicit order fall behind these.
  await Teacher.updateMany({ order: { $exists: false } }, { $set: { order: 1000 } });

  for (const t of TEACHERS) {
    await Teacher.findOneAndUpdate(
      { email: t.email },
      { ...t, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✓ ${t.name}`);
  }

  await mongoose.disconnect();
  console.log(`\nDone. ${TEACHERS.length} facilitators added/updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
