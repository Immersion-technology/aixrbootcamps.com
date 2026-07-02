/**
 * DEMO seed — populates realistic content for presentations/screenshots so every
 * portal (admin, teacher, parent) renders with real data instead of empty states.
 *
 * Run:  npm run seed:demo
 *
 * Idempotent: clears prior demo rows (marked DEMO-*) before re-inserting. It only
 * touches demo-tagged data, so it won't wipe anything you create by hand.
 *
 * Pairs with the AUTH_BYPASS preview shortcut (lib/dev-auth.ts): the parent portal
 * impersonates DEV_PARENT_EMAIL — set to the showcase family below.
 */
import mongoose from "mongoose";
import { Registration } from "../models/Registration";
import { Attendance } from "../models/Attendance";
import { Teacher } from "../models/Teacher";

const DEMO_TAG = "DEMO-"; // paymentReference / recordedBy prefix used to find+clear demo rows

// Showcase parent — the parent portal impersonates this email under AUTH_BYPASS.
const SHOWCASE_PARENT_EMAIL = "adaeze.okafor@gmail.com";

const COURSES = ["vibe-coding", "ai-music", "3d-vr", "content-creation", "entrepreneurship"];

type Seed = {
  child: string;
  gender: "Male" | "Female";
  age: number;
  school: string;
  tshirt: "XS" | "S" | "M" | "L" | "XL";
  parentName: string;
  relationship: "Mother" | "Father" | "Guardian";
  email: string;
  phone: string;
  courses: string[];
  robotics?: boolean;
  laptop?: boolean;
  payment: "paid" | "pending" | "failed" | "abandoned";
  admission: "admitted" | "pending" | "rejected";
};

const SEEDS: Seed[] = [
  // ── Showcase family: two kids under one parent (parent-portal demo) ──
  { child: "Chidera Okafor", gender: "Female", age: 13, school: "Greensprings School, Lekki", tshirt: "M", parentName: "Adaeze Okafor", relationship: "Mother", email: SHOWCASE_PARENT_EMAIL, phone: "08031234567", courses: ["vibe-coding", "ai-music", "3d-vr"], laptop: true, payment: "paid", admission: "admitted" },
  { child: "Emeka Okafor", gender: "Male", age: 15, school: "Greensprings School, Lekki", tshirt: "L", parentName: "Adaeze Okafor", relationship: "Mother", email: SHOWCASE_PARENT_EMAIL, phone: "08031234567", courses: ["vibe-coding", "content-creation", "3d-vr"], robotics: true, payment: "paid", admission: "admitted" },

  // ── Varied roster: mostly paid+admitted (show on teacher roster), some not ──
  { child: "Zainab Bello", gender: "Female", age: 12, school: "Corona Secondary School, Agbara", tshirt: "S", parentName: "Hauwa Bello", relationship: "Mother", email: "hauwa.bello@yahoo.com", phone: "08020001122", courses: ["vibe-coding", "ai-music"], payment: "paid", admission: "admitted" },
  { child: "Tobiloba Adeyemi", gender: "Male", age: 14, school: "Chrisland High School, Lekki", tshirt: "M", parentName: "Segun Adeyemi", relationship: "Father", email: "segun.adeyemi@gmail.com", phone: "08055667788", courses: ["vibe-coding", "3d-vr"], robotics: true, laptop: true, payment: "paid", admission: "admitted" },
  { child: "Fatima Sani", gender: "Female", age: 16, school: "Loyola Jesuit College, Abuja", tshirt: "M", parentName: "Ibrahim Sani", relationship: "Father", email: "ibrahim.sani@outlook.com", phone: "08099887766", courses: ["entrepreneurship", "content-creation"], payment: "paid", admission: "admitted" },
  { child: "David Eze", gender: "Male", age: 11, school: "British International School, VI", tshirt: "S", parentName: "Ngozi Eze", relationship: "Mother", email: "ngozi.eze@gmail.com", phone: "08134455667", courses: ["vibe-coding", "ai-music", "3d-vr"], laptop: true, payment: "paid", admission: "admitted" },
  { child: "Aisha Mohammed", gender: "Female", age: 13, school: "Lekki British School", tshirt: "M", parentName: "Yusuf Mohammed", relationship: "Father", email: "yusuf.mohammed@gmail.com", phone: "07033221100", courses: ["content-creation", "ai-music"], payment: "paid", admission: "admitted" },
  { child: "Daniel Okoro", gender: "Male", age: 15, school: "Whitesands School, Lekki", tshirt: "L", parentName: "Chioma Okoro", relationship: "Mother", email: "chioma.okoro@yahoo.com", phone: "08166778899", courses: ["vibe-coding", "entrepreneurship"], robotics: true, payment: "paid", admission: "admitted" },
  { child: "Hauwa Abubakar", gender: "Female", age: 12, school: "Day Waterman College, Abeokuta", tshirt: "S", parentName: "Sani Abubakar", relationship: "Father", email: "sani.abubakar@gmail.com", phone: "08044556677", courses: ["vibe-coding", "3d-vr"], payment: "paid", admission: "admitted" },
  { child: "Michael Adebayo", gender: "Male", age: 14, school: "Grange School, Ikeja", tshirt: "M", parentName: "Funke Adebayo", relationship: "Mother", email: "funke.adebayo@gmail.com", phone: "08123456789", courses: ["ai-music", "content-creation"], laptop: true, payment: "paid", admission: "admitted" },

  // Non-paid / pending — variety for the admin list + stats (not on teacher roster)
  { child: "Blessing Nwosu", gender: "Female", age: 13, school: "Vivian Fowler Memorial College", tshirt: "M", parentName: "Uche Nwosu", relationship: "Father", email: "uche.nwosu@gmail.com", phone: "08077665544", courses: ["vibe-coding", "ai-music"], payment: "pending", admission: "pending" },
  { child: "Ahmed Lawal", gender: "Male", age: 16, school: "Nigerian Tulip International College", tshirt: "L", parentName: "Bilkisu Lawal", relationship: "Mother", email: "bilkisu.lawal@yahoo.com", phone: "08033445566", courses: ["entrepreneurship", "3d-vr"], payment: "pending", admission: "pending" },
  { child: "Grace Okonkwo", gender: "Female", age: 11, school: "Meadow Hall School, Lekki", tshirt: "XS", parentName: "Peter Okonkwo", relationship: "Father", email: "peter.okonkwo@gmail.com", phone: "08099001122", courses: ["ai-music"], payment: "failed", admission: "pending" },
];

const TEACHERS = [
  {
    name: "Mr. Tunde Bakare",
    email: "tunde.bakare@immersia.ng",
    assignedCourses: ["vibe-coding", "3d-vr"],
    bio: "Tunde blends software engineering, product thinking and VR storytelling. He loves helping campers move from a blank screen to a live demo they can explain with confidence.",
    photoUrl: "https://api.dicebear.com/8.x/thumbs/svg?seed=Tunde%20Bakare",
  },
  {
    name: "Ms. Amaka Eze",
    email: "amaka.eze@immersia.ng",
    assignedCourses: ["ai-music", "content-creation"],
    bio: "Amaka teaches campers how to turn ideas into polished stories, songs and short-form content. Her sessions are high-energy, collaborative and always project-first.",
    photoUrl: "https://api.dicebear.com/8.x/thumbs/svg?seed=Amaka%20Eze",
  },
  {
    name: "Mr. Kola Williams",
    email: "kola.williams@immersia.ng",
    assignedCourses: ["entrepreneurship", "robotics"],
    bio: "Kola brings a builder's mindset to both startup pitching and electronics. He helps campers think clearly, prototype quickly and present ideas like real founders.",
    photoUrl: "https://api.dicebear.com/8.x/thumbs/svg?seed=Kola%20Williams",
  },
];

// Pricing in kobo (mirrors scripts/seed.ts settings).
const REGULAR = 20_000_000;
const LAPTOP = 2_000_000;
const ROBOTICS = 2_500_000;

function dobFromAge(age: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - age, 5, 15)); // mid-June birthday
}

/** Last `n` calendar days (incl. today), each at midnight UTC — matches Attendance.date storage. */
function recentDays(n: number): Date[] {
  const out: Date[] = [];
  const t = new Date();
  const base = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  for (let i = n - 1; i >= 0; i--) out.push(new Date(base - i * 86_400_000));
  return out;
}

const STATUSES: Array<"present" | "absent" | "late" | "excused"> = [
  "present", "present", "present", "present", "late", "present", "absent", "present", "excused", "present",
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("Connected. Seeding demo data…\n");

  // ── Clear prior demo rows only (tagged), leave hand-made data intact ──
  const oldRegs = await Registration.find({ paymentReference: { $regex: `^${DEMO_TAG}` } }).select("_id").lean();
  const oldIds = oldRegs.map((r) => r._id);
  await Attendance.deleteMany({ registrationId: { $in: oldIds } });
  await Registration.deleteMany({ paymentReference: { $regex: `^${DEMO_TAG}` } });
  await Teacher.deleteMany({ email: { $in: TEACHERS.map((t) => t.email) } });
  console.log(`✓ Cleared ${oldIds.length} prior demo registrations + their attendance`);

  // ── Teachers ──
  for (const t of TEACHERS) {
    await Teacher.create({ ...t, isActive: true });
  }
  console.log(`✓ Created ${TEACHERS.length} facilitators`);

  // ── Registrations ──
  const days = recentDays(7);
  let n = 0;
  let attCount = 0;
  for (const s of SEEDS) {
    n++;
    const id = `IMM26-${String(n).padStart(4, "0")}`;
    const laptopFee = s.laptop ? LAPTOP : 0;
    const roboticsFee = s.robotics ? ROBOTICS : 0;
    const total = REGULAR + laptopFee + roboticsFee;
    const paid = s.payment === "paid";

    const reg = await Registration.create({
      registrationId: id,
      participant: {
        fullName: s.child,
        dateOfBirth: dobFromAge(s.age),
        gender: s.gender,
        school: s.school,
        classGrade: `JSS/SSS`,
        tshirtSize: s.tshirt,
      },
      parent: {
        fullName: s.parentName,
        relationship: s.relationship,
        phonePrimary: s.phone,
        email: s.email,
        address: "12 Admiralty Way, Lekki Phase 1, Lagos",
      },
      emergencyContact: { fullName: s.parentName, phone: s.phone, relationship: s.relationship },
      medicalNotes: n % 4 === 0 ? "Mild asthma — has inhaler." : undefined,
      courses: s.courses,
      laptopRental: !!s.laptop,
      roboticsElective: !!s.robotics,
      pricing: {
        tier: "regular",
        bootCampFee: REGULAR,
        laptopRentalFee: laptopFee,
        roboticsFee,
        total,
      },
      paymentStatus: s.payment,
      admissionStatus: s.admission,
      paymentReference: `${DEMO_TAG}${id}`,
      paidAt: paid ? new Date() : undefined,
      agreedToTerms: true,
      statusLog: [
        { action: "registered", by: "demo-seed", at: new Date() },
        ...(paid ? [{ action: "payment_confirmed", by: "demo-seed", at: new Date() }] : []),
        ...(s.admission === "admitted" ? [{ action: "admitted", by: "demo-seed", at: new Date() }] : []),
      ],
    });

    // Attendance only for campers actually attending (paid + admitted).
    if (paid && s.admission === "admitted") {
      for (let d = 0; d < days.length; d++) {
        const status = STATUSES[(n + d) % STATUSES.length];
        await Attendance.create({
          registrationId: reg._id,
          date: days[d],
          status,
          recordedBy: `${DEMO_TAG}${TEACHERS[n % TEACHERS.length].name}`,
        });
        attCount++;
      }
    }
  }
  console.log(`✓ Created ${SEEDS.length} registrations (${SEEDS.filter((s) => s.payment === "paid").length} paid)`);
  console.log(`✓ Created ${attCount} attendance records across ${days.length} days`);

  await mongoose.disconnect();
  console.log(`\nDone. Parent-portal showcase: ${SHOWCASE_PARENT_EMAIL}`);
  console.log("Tip: set DEV_PARENT_EMAIL to that address in .env.local, then restart the dev server.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
