/**
 * Testimonials shown on the landing page.
 *
 * ⚠️ PLACEHOLDER CONTENT — the entries below are illustrative samples so the section renders
 * with realistic layout. Replace them with REAL, consented quotes from parents / past campers
 * before launch. Do not ship fabricated attributions publicly. Update once, ripples everywhere.
 */

export type TestimonialTone = "cyan" | "green" | "violet" | "pink" | "amber";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  tone: TestimonialTone;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "My son walked in barely able to open a code editor and walked out having deployed his own web app. The confidence shift was worth every naira.",
    name: "Placeholder Parent",
    role: "Parent of a camper",
    initials: "PP",
    tone: "cyan",
  },
  {
    quote:
      "The Demo Day pitch was the moment for us — watching her stand up and present a real product to a jury of founders. She hasn't stopped building since.",
    name: "Placeholder Parent",
    role: "Parent of a camper",
    initials: "PP",
    tone: "violet",
  },
  {
    quote:
      "I built a motion-sensing alarm in robotics and kept the whole kit. I'm already planning my next project at home.",
    name: "Placeholder Camper",
    role: "Camper, age 14",
    initials: "PC",
    tone: "green",
  },
  {
    quote:
      "Hybrid meant my daughter joined every live session from home without missing a beat. Same classes, same energy, zero commute.",
    name: "Placeholder Parent",
    role: "Online cohort parent",
    initials: "PP",
    tone: "pink",
  },
];
