import { buildReceiptPdf } from "@/lib/pdf";
import {
  adminAlertHtml,
  admissionRejectedHtml,
  magicLinkHtml,
  parentConfirmationHtml,
  parentFeedbackHtml,
  teacherWelcomeHtml,
  waitlistHtml,
  sendMail,
  verifyMailTransport,
} from "@/lib/mailer";

const testRecipient = process.env.MAIL_TEST_TO?.trim() || process.env.SMTP_USER?.trim();

type MailJob = {
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
};

function requireRecipient(): string {
  if (!testRecipient) {
    throw new Error("Set MAIL_TEST_TO or SMTP_USER before running the mail smoke test.");
  }
  return testRecipient;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const to = requireRecipient();
  await verifyMailTransport();

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const receiptPdf = await buildReceiptPdf({
    registrationId: "IMM-TEST-001",
    parentName: "Test Parent",
    participantName: "Test Camper",
    courses: ["Vibe Coding", "3D & VR"],
    laptopRental: true,
    roboticsElective: false,
    bootCampFeeKobo: 20000000,
    laptopRentalKobo: 2000000,
    roboticsFeeKobo: 0,
    totalKobo: 22000000,
    paidAt: new Date(),
  });

  const jobs: MailJob[] = [
    {
      subject: "[MAIL SMOKE] Parent login link",
      html: magicLinkHtml({ name: "Test Parent", url: `${baseUrl}/account/login/verify?token=test`, role: "parent" }),
    },
    {
      subject: "[MAIL SMOKE] Teacher login link",
      html: magicLinkHtml({ name: "Test Teacher", url: `${baseUrl}/teacher/login/verify?token=test`, role: "teacher" }),
    },
    {
      subject: "[MAIL SMOKE] Teacher welcome",
      html: teacherWelcomeHtml({ name: "Test Teacher", loginUrl: `${baseUrl}/teacher/login/verify?token=test` }),
    },
    {
      subject: "[MAIL SMOKE] Admission rejected",
      html: admissionRejectedHtml({ parentName: "Test Parent", participantName: "Test Camper", note: "Smoke test" }),
    },
    {
      subject: "[MAIL SMOKE] Waitlist",
      html: waitlistHtml({ parentName: "Test Parent", participantName: "Test Camper" }),
    },
    {
      subject: "[MAIL SMOKE] Parent confirmation",
      html: parentConfirmationHtml({
        parentName: "Test Parent",
        participantName: "Test Camper",
        registrationId: "IMM-TEST-001",
        courses: ["Vibe Coding", "3D & VR"],
        laptopRental: true,
        roboticsElective: false,
        attendanceMode: "online",
        totalKobo: 22000000,
        campStart: "27 July 2026",
      }),
      attachments: [{ filename: "IMM-TEST-001.pdf", content: receiptPdf, contentType: "application/pdf" }],
    },
    {
      subject: "[MAIL SMOKE] Admin alert",
      html: adminAlertHtml({
        participantName: "Test Camper",
        registrationId: "IMM-TEST-001",
        parentName: "Test Parent",
        parentEmail: to,
        parentPhone: "+2348000000000",
        totalKobo: 22000000,
        appUrl: baseUrl,
      }),
      replyTo: to,
    },
    {
      subject: "[MAIL SMOKE] Parent feedback",
      html: parentFeedbackHtml({
        parentName: "Test Parent",
        parentEmail: to,
        message: "This is a smoke test for the parent dashboard feedback flow.",
        submittedAt: new Date().toISOString(),
      }),
      replyTo: to,
    },
  ];

  const failures: Array<{ subject: string; error: unknown }> = [];
  for (const [index, job] of jobs.entries()) {
    try {
      await sendMail({
        to,
        subject: job.subject,
        html: job.html,
        replyTo: job.replyTo,
        attachments: job.attachments,
      });
      console.log(`Sent: ${job.subject}`);
    } catch (error) {
      failures.push({ subject: job.subject, error });
      console.error(`Failed: ${job.subject}`, error);
    }

    if (index < jobs.length - 1) {
      await sleep(2000);
    }
  }

  if (failures.length) {
    throw new Error(`${failures.length} mail smoke checks failed. See logs above.`);
  }

  console.log(`Mail smoke test complete for ${to}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
