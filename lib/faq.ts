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
    a: `Yes — we run a dedicated online track for ${nairaFromKobo(PRICING.online)}. It covers three live courses taught remotely (Vibe Coding, Content Creation, and 3D & VR), plus a welcome kit — t-shirt and materials — delivered anywhere in Nigeria for a flat ${nairaFromKobo(PRICING.delivery)}. The online track does not include the Demo Day pitch, the prize, or the Robotics elective — those are in-person only. Pick your track when you register.`,
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
    a: "A digital portfolio (AI app, VR world, content pieces), a certificate, and camp photos. In-person campers also take home their Demo Day pitch video and — with the Robotics elective — a gadget and kit they keep; online campers get a welcome kit delivered to them.",
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
