/**
 * Export parent phone numbers — `npm run export:phones`.
 *
 * Paid registrations only (confirmed campers, excluding rejected), which is who
 * you'd actually WhatsApp about camp. Writes a CSV and prints a WhatsApp-ready
 * list of numbers in international format.
 *
 * Pass `--all` to include unpaid registrations too.
 */
import { writeFileSync } from "fs";
import { join } from "path";
import mongoose from "mongoose";
import Papa from "papaparse";
import { connectDB } from "@/lib/db";
import { Registration } from "@/models/Registration";
import { cohortLabel } from "@/lib/cohorts";

const includeAll = process.argv.includes("--all");

/** 08137013560 / +2348137013560 / 2348137013560 → +2348137013560 */
function normalizeNaijaPhone(raw: string): string {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return `+${digits}`;
}

async function main() {
  await connectDB();

  const filter: Record<string, unknown> = { admissionStatus: { $ne: "rejected" } };
  if (!includeAll) filter.paymentStatus = "paid";

  const rows = await Registration.find(filter)
    .sort({ "parent.fullName": 1 })
    .select("registrationId participant parent cohort attendanceMode paymentStatus")
    .lean();

  if (rows.length === 0) {
    console.log(
      includeAll
        ? "No registrations found."
        : "No PAID registrations found. Re-run with --all to include unpaid ones."
    );
    return;
  }

  const csvRows = rows.map((r: any) => ({
    "Parent name": r.parent?.fullName ?? "",
    "Phone (primary)": normalizeNaijaPhone(r.parent?.phonePrimary ?? ""),
    "Phone (secondary)": r.parent?.phoneSecondary ? normalizeNaijaPhone(r.parent.phoneSecondary) : "",
    "Parent email": r.parent?.email ?? "",
    Camper: r.participant?.fullName ?? "",
    Cohort: r.cohort ? cohortLabel(r.cohort) : "",
    Mode: r.attendanceMode === "online" ? "Online" : "In-person (Lagos)",
    "Registration ID": r.registrationId ?? "",
    "Payment status": r.paymentStatus ?? "",
  }));

  const file = join(process.cwd(), `parent-phones-${new Date().toISOString().slice(0, 10)}.csv`);
  writeFileSync(file, Papa.unparse(csvRows), "utf8");

  // Unique numbers — a parent with two campers appears once.
  const unique = [
    ...new Set(
      csvRows.flatMap((r) => [r["Phone (primary)"], r["Phone (secondary)"]]).filter((p) => p.length > 6)
    ),
  ];

  console.log(`\n${rows.length} ${includeAll ? "" : "paid "}registration(s)`);
  console.log(`${unique.length} unique phone number(s)`);
  console.log(`CSV → ${file}\n`);

  console.log("--- Parent name · phone · camper ---");
  csvRows.forEach((r) => {
    const extra = r["Phone (secondary)"] ? ` / ${r["Phone (secondary)"]}` : "";
    console.log(`${r["Parent name"]} · ${r["Phone (primary)"]}${extra} · ${r.Camper} · ${r.Cohort}`);
  });

  console.log("\n--- Numbers only (comma separated, WhatsApp-ready) ---");
  console.log(unique.join(", "));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
