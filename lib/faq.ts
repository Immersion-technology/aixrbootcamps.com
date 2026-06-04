/**
 * Top 10 parent FAQs: single source of truth.
 *
 * Rendered by:
 *   - `/faq` (dedicated route with full accordion)
 *   - `/` landing page (compact FAQ section)
 *
 * Update once, both surfaces stay in sync.
 */

export type FaqTopic = "Logistics" | "Money" | "Curriculum" | "Safety";

export type FaqItem = {
  topic: FaqTopic;
  q: string;
  a: string;
};

export const FAQS: FaqItem[] = [
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
    a: "Yes. ₦75,000 deposit on registration, balance two weeks before cohort start.",
  },
  {
    topic: "Logistics",
    q: "Do you provide transport?",
    a: "No.",
  },
  {
    topic: "Logistics",
    q: "What about lunch?",
    a: "Lunch, snacks and drinks are not provided. Campers bring their own food and water bottle.",
  },
  {
    topic: "Curriculum",
    q: "What does my child take home?",
    a: "A digital portfolio (AI project, VR world, robot demo, pitch video), a certificate, and photos from throughout camp.",
  },
  {
    topic: "Money",
    q: "What if my child wants to drop out?",
    a: "Full refund within the first 3 days. After that, no refunds.",
  },
  {
    topic: "Money",
    q: "Sibling discounts?",
    a: "Yes. 10% off each additional camper.",
  },
];

export const FAQ_TOPIC_STYLE: Record<FaqTopic, string> = {
  Money:      "sticker-pill--green",
  Logistics:  "sticker-pill--cyan",
  Curriculum: "sticker-pill--cyan",
  Safety:     "sticker-pill--paper",
};
