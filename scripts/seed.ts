import mongoose from "mongoose";
import { Admin } from "../models/Admin";
import { Course } from "../models/Course";
import { Setting, SETTING_KEYS } from "../models/Setting";
import { hashPassword } from "../lib/auth";
import { SEED_COURSES } from "../lib/courses";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);

  // --- Admin ---
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@immersia.ng";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "change-on-first-login";
  const name = process.env.ADMIN_SEED_NAME ?? "Admin";

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`✓ Admin ${email} already exists`);
  } else {
    await Admin.create({ email, passwordHash: await hashPassword(password), name });
    console.log(`✓ Created admin ${email}`);
  }

  // --- Courses ---
  // Drop legacy entries that don't exist in the new curriculum so the DB
  // stays clean (public-speaking, esports, music: renamed/reclassified).
  await Course.deleteMany({ code: { $in: ["esports", "music", "public-speaking"] } });
  for (const c of SEED_COURSES) {
    await Course.updateOne(
      { code: c.code },
      {
        $set: {
          ...c,
          isCompulsory: c.isCompulsory ?? false,
          isAttraction: c.isAttraction ?? false,
        },
      },
      { upsert: true }
    );
  }
  console.log(`✓ Seeded ${SEED_COURSES.length} courses (incl. ${SEED_COURSES.filter((c) => c.isAttraction).length} active breaks)`);

  // --- Settings ---
  const defaults: Array<[string, unknown]> = [
    [SETTING_KEYS.EARLY_BIRD_CUTOFF, "2026-06-30T23:59:59.000Z"],
    [SETTING_KEYS.CAPACITY, 50],
    [SETTING_KEYS.EARLY_BIRD_PRICE, 15000000],  // ₦150,000 (kobo), first 10
    [SETTING_KEYS.REGULAR_PRICE, 20000000],     // ₦200,000
    [SETTING_KEYS.LAPTOP_RENTAL_PRICE, 2000000], // +₦20,000
    [SETTING_KEYS.CAMP_START_DATE, "2026-07-27"],
    [SETTING_KEYS.CAMP_END_DATE, "2026-08-21"],
    [SETTING_KEYS.ADMIN_ALERT_EMAIL, process.env.ADMIN_ALERT_EMAIL ?? "registrations@immersia.ng"],
  ];

  for (const [key, value] of defaults) {
    await Setting.updateOne({ key }, { $setOnInsert: { value } }, { upsert: true });
  }
  console.log(`✓ Seeded ${defaults.length} settings`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
