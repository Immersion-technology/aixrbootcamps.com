/**
 * The AiXR Summer Boot Camp welcome email.
 *
 * Authored as normal campaign blocks on the `aixr` (dark navy/gold) theme, so
 * it's fully editable in the admin composer rather than locked in code — and it
 * goes through the exact same renderer, validation, unsubscribe and queue path
 * as every other campaign.
 *
 * Merge tokens use the snake_case spellings from the original design
 * (`{{first_name}}`, `{{participant_id}}`, …); those are registered aliases in
 * merge.ts, so both spellings resolve identically.
 */
import type { BlocksInput } from "./blocks";
import type { ShellOpts } from "./shell";

export const AIXR_WELCOME_SUBJECT =
  "Welcome to AiXR Summer Boot Camp 2026, {{first_name}} — you're in!";

export const AIXR_WELCOME_PREHEADER =
  "Your registration is confirmed. Everything you need before Day 1 is inside.";

/** The navy header band with the gold rule under it. */
export const AIXR_WELCOME_HEADER: ShellOpts["header"] = {
  eyebrow: "Immersia Virtual Reality",
  title: "AiXR",
  titleAccent: "Summer Boot Camp",
  subtitle: "2026 Edition · Code · Create · Innovate",
  badges: ["27 July – 4 September 2026", "Ages 10–17", "Onsite & Online"],
};

export function aixrWelcomeBlocks(): BlocksInput {
  return [
    {
      type: "heading",
      eyebrow: "Welcome to the family",
      text: "Hi {{first_name}}, you're in!",
      level: 2,
    },
    {
      type: "text",
      text: "Your registration for the **AiXR Summer Tech Boot Camp 2026** is confirmed. We are genuinely excited to have you — this is going to be two weeks your child will talk about for a long time.",
    },
    {
      type: "text",
      text: "Everything you need to get ready before Day 1 is below. Please read through your schedule, courses, rules, the token system for break activities, and what to bring or set up.",
    },
    {
      type: "details",
      title: "Your Registration Details",
      rows: [
        { icon: "👤", label: "Participant", value: "{{participant_name}}" },
        { icon: "📅", label: "Cohort", value: "{{cohort_name}} · {{cohort_dates}}" },
        { icon: "📍", label: "Mode", value: "{{attendance_mode}}" },
        { icon: "⏰", label: "Hours", value: "Monday – Friday · 9:00 AM – 1:30 PM" },
        { icon: "🎟", label: "Participant ID", value: "{{participant_id}}" },
      ],
    },
    {
      type: "chips",
      title: "Your Courses This Cohort",
      items: [
        { text: "💻 Vibe Coding & AI", tone: "gold" },
        { text: "🎨 3D Design & VR", tone: "gold" },
        { text: "📲 Content Creation", tone: "gold" },
        { text: "🔧 Robotics & Embedded Systems", tone: "green" },
        { text: "🎵 AI Music Production", tone: "green" },
        { text: "🚀 Entrepreneurship & Pitching", tone: "green" },
      ],
      note: "Gold = Online & Lagos    Green = Lagos Camp only",
    },
    { type: "divider" },
    {
      type: "text",
      text: "A few things to take care of **before Day 1:**",
    },
    {
      type: "callout",
      title: "Lagos Camp students",
      text: "Please arrive by **8:50 AM** on your first day. Bring a laptop if you have one (rental available for ₦20,000), your participant ID, and comfortable clothes.",
      tone: "violet",
    },
    {
      type: "callout",
      title: "Online students",
      text: "Make sure Zoom or Google Meet is installed and tested on your device. You'll need a stable internet connection and a quiet space from **9:00 AM** each day. Your session link will be sent 24 hours before your cohort begins.",
      tone: "subtle",
    },
    {
      type: "text",
      text: "Log into your dashboard to check your timetable, view assignments, and track your token balance for break activities.",
    },
    {
      type: "button",
      label: "Go to My Dashboard →",
      url: "{{portalUrl}}",
      style: "dark",
      align: "center",
    },
    { type: "divider" },
    {
      type: "text",
      text: "We cannot wait to see what you build. If you have any questions before your cohort starts, reply to this email or message us on WhatsApp and we'll get back to you within a few hours.\n\nSee you on Day 1.",
    },
    {
      type: "text",
      text: "**The AiXR Boot Camp Team**\nAiXR Summer Tech Boot Camp 2026\nImmersia Virtual Reality · Lagos, Nigeria",
    },
  ];
}
