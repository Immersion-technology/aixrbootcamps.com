import PDFDocument from "pdfkit";
import { formatNaira } from "./utils";
import { cohortLabel } from "./cohorts";

interface ReceiptArgs {
  registrationId: string;
  parentName: string;
  participantName: string;
  courses: string[];
  laptopRental: boolean;
  roboticsElective: boolean;
  attendanceMode?: "in_person" | "online";
  cohort?: number;
  bootCampFeeKobo: number;
  laptopRentalKobo: number;
  roboticsFeeKobo: number;
  deliveryFeeKobo?: number;
  discountKobo?: number;
  promoCode?: string;
  totalKobo: number;
  paidAt: Date;
}

export function buildReceiptPdf(args: ReceiptArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(28).fillColor("#3a86ff").text("IMMERSIA", { continued: false });
    doc.fontSize(11).fillColor("#555").text("Summer Tech Boot Camp 2026 · Payment Receipt");
    doc.moveDown(1.2);

    doc.fillColor("#141414").fontSize(14).text(`Registration ID: ${args.registrationId}`);
    doc.fontSize(11).fillColor("#555").text(`Paid on ${args.paidAt.toLocaleString("en-NG")}`);
    doc.moveDown(1);

    doc.fillColor("#141414").fontSize(12).text(`Parent / Guardian: ${args.parentName}`);
    doc.text(`Participant: ${args.participantName}`);
    doc.moveDown(0.5);

    const isOnline = args.attendanceMode === "online";

    doc.text("Courses:", { underline: true });
    args.courses.forEach((c) => doc.text("  - " + c));
    doc.moveDown(0.5);

    doc.text(`Attendance: ${isOnline ? "Online" : "In-person (Lagos)"}`);
    if (args.cohort) doc.text(`Cohort: ${cohortLabel(args.cohort)}`);
    if (isOnline) {
      doc.text(`Embedded Systems elective: ${args.roboticsElective ? "Yes (kit shipped)" : "No"}`);
    } else {
      doc.text(`Robotics elective: ${args.roboticsElective ? "Yes" : "No"}`);
      doc.text(`Laptop rental: ${args.laptopRental ? "Yes" : "No"}`);
    }
    doc.moveDown(1);

    doc.text(`${isOnline ? "Online programme:" : "Boot camp fee:   "} ${formatNaira(args.bootCampFeeKobo)}`);
    if (args.roboticsElective) {
      const label = isOnline ? "Embedded Systems (kit + delivery):" : "Robotics elective:";
      doc.text(`${label} ${formatNaira(args.roboticsFeeKobo)}`);
    }
    if (!isOnline && args.laptopRental) doc.text(`Laptop rental:    ${formatNaira(args.laptopRentalKobo)}`);
    if (args.discountKobo && args.discountKobo > 0) {
      const label = args.promoCode ? `Promo (${args.promoCode}):` : "Discount:";
      doc.text(`${label.padEnd(18)}-${formatNaira(args.discountKobo)}`);
    }
    doc.moveDown(0.3);
    doc.fontSize(14).text(`TOTAL PAID:       ${formatNaira(args.totalKobo)}`, { underline: true });

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#777").text("Keep this receipt as proof of payment. Camp begins 27 July 2026.");

    doc.end();
  });
}
