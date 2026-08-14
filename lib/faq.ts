/**
 * Top 10 parent FAQs: single source of truth.
 *
 * Rendered by:
 *   - `/faq` (dedicated route with full accordion)
 *   - `/` landing page (compact FAQ section)
 *
 * Update once, both surfaces stay in sync.
 */

import { PRICING, nairaFromKobo } from "@/lib/pricing";

export type FaqTopic = "Logistics" | "Money" | "Curriculum" | "Safety";

export type FaqItem = {
  topic: FaqTopic;
  q: string;
  a: string;
};

export const FAQS: FaqItem[] = [
  {
    topic: "Logistics",
    q: "Can my child attend online?",
    a: "Not for the remaining 2026 cohort — camp is in-person only at our Lagos venue. Being on-site is what makes the Demo Day pitch, the robotics build and the daily side attractions work. If an online option returns for 2027, we'll announce it by email first.",
  },
  {
    topic: "Logistics",
    q: "Two sessions? What's the difference?",
    a: "They're identical in curriculum, instructors, and price. Pick whichever fits your family's August calendar.",
  },
  {
    topic: "Curriculum",
    q: "Can my child attend both?",
    a: "Yes, but the curriculum is the same in each. We'd recommend our term-time programme as a better next step.",
  },
  {
    topic: "Safety",
    q: "Is my child safe?",
    a: "Yes. Supervised at all times, ID-checked pickup, on-site first aider, CCTV throughout.",
  },
  {
    topic: "Curriculum",
    q: "No prior tech experience?",
    a: "No problem. Curriculum is designed for total beginners; advanced students get stretch projects.",
  },
  {
    topic: "Money",
    q: "Can I pay in instalments?",
    a: `Yes. ${nairaFromKobo(PRICING.deposit)} deposit on registration, balance two weeks before cohort start.`,
  },
  {
    topic: "Logistics",
    q: "Do you provide transport?",
    a: "No.",
  },
  {
    topic: "Logistics",
    q: "What about lunch?",
    a: "No lunch or drinks are provided, but campers can eat their own lunch during the break.",
  },
  {
    topic: "Curriculum",
    q: "What does my child take home?",
    a: "A digital portfolio (AI app, VR world, content pieces), a certificate, camp photos, and their Demo Day pitch video. With the Robotics elective they also take home a gadget and the kit they built it with.",
  },
  {
    topic: "Money",
    q: "What if my child wants to drop out?",
    a: "No refunds. All payments are final.",
  },
];

export const FAQ_TOPIC_STYLE: Record<FaqTopic, string> = {
  Money:      "sticker-pill--green",
  Logistics:  "sticker-pill--cyan",
  Curriculum: "sticker-pill--cyan",
  Safety:     "sticker-pill--paper",
};
