/**
 * IMMERSIA: single source of truth for the 2026 curriculum.
 *
 * Both the landing page (course grid + active breaks + timetable),
 * the registration form (read-only enrollment + paired-elective radio),
 * the per-course detail pages, and the email templates all read from this.
 *
 * Update once, ripples everywhere.
 */

import { PRICING } from "@/lib/pricing";

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export type Tone =
  | "violet"
  | "petrol"
  | "aqua"
  | "orange"
  | "pink"
  | "yellow"
  | "mint"
  | "blue"
  | "coral";

/**
 * Card accent color — the single source of truth for a course's brand hue.
 * MUST mirror the landing course-grid sticker colors (app/(public)/page.tsx):
 * the detail page themes itself entirely from this.
 */
export type CardColor =
  | "azure"
  | "orange"
  | "pink"
  | "violet"
  | "emerald"
  | "amber"
  | "cobalt";

/** hugeicons-react export name (resolved at use site to avoid pulling all icons here). */
export type IconName =
  | "CodeIcon"
  | "Rocket01Icon"
  | "CameraVideoIcon"
  | "RoboticIcon"
  | "MusicNote01Icon"
  | "VrGlassesIcon"
  | "GameController01Icon"
  | "TableTennisBatIcon"
  | "RacingFlagIcon";

export type ScheduleSlot = { day: Day; start: string; end: string };

export type CurriculumItem = {
  slug: string;
  name: string;
  type: "class" | "active-break";
  isCompulsory?: boolean;
  /** Opt-in paid elective: not part of the base fee; adds `electiveFeeKobo` at checkout. */
  isElective?: boolean;
  /** Additional fee (in kobo) charged when a camper opts into this elective. */
  electiveFeeKobo?: number;
  facilitators: string[];
  hoursPerWeek: number;
  sessionsPerWeek: number;
  scheduleSlots: ScheduleSlot[];
  icon: IconName;
  tone: Tone;
  /** Brand hue for the card + its detail page. Mirrors the landing grid sticker. */
  cardColor: CardColor;
  /** 1-line description for landing cards. */
  shortDesc: string;
  /** Punchy headline for the detail-page hero. */
  tagline: string;
  /** 5–7 things they'll concretely learn. */
  whatYoullLearn: string[];
  /** What they walk out with at the end of camp. */
  outcomes: string[];
  /** Tools / equipment chips. */
  tools: string[];
  /** 2–3 sentence narrative of a sample project. */
  sampleProject: string;
};

export const CURRICULUM: CurriculumItem[] = [
  // ============================ CLASSES ============================
  {
    slug: "vibe-coding",
    name: "Vibe Coding & AI Prompt Engineering",
    type: "class",
    facilitators: [],
    hoursPerWeek: 4,
    sessionsPerWeek: 2,
    scheduleSlots: [
      { day: "Mon", start: "09:00", end: "11:00" },
      { day: "Wed", start: "11:00", end: "13:00" },
    ],
    icon: "CodeIcon",
    tone: "violet",
    cardColor: "azure",
    shortDesc: "Pair-program with AI to ship a real, deployed web app. Zero prior code required.",
    tagline: "Code the way pros build in 2026, alongside AI, not despite it.",
    whatYoullLearn: [
      "Prompt-engineering fundamentals: how to talk to AI like a senior engineer",
      "Reading and reviewing AI-generated code before you ship it",
      "Breaking a real product idea into clear, build-ready specs",
      "Version control basics with Git + GitHub",
      "Deploying a working app to the public internet",
      "Debugging when the AI gets it wrong",
      "When to use AI vs when to write the code yourself",
    ],
    outcomes: [
      "A personal portfolio site you built end-to-end and deployed live",
      "Working fluency with Cursor, ChatGPT and Claude as build tools",
      "The confidence to start any project from a blank screen",
    ],
    tools: ["Cursor", "ChatGPT", "Claude", "GitHub", "Vercel", "HTML / CSS / JS"],
    sampleProject:
      "Pick a real problem at your school. Spec it. Build a working web app for it with AI as your pair. Deploy it. Demo it on closing Saturday.",
  },
  {
    slug: "entrepreneurship",
    name: "Entrepreneurship & Pitching",
    type: "class",
    isCompulsory: true,
    facilitators: [],
    hoursPerWeek: 4,
    sessionsPerWeek: 2,
    scheduleSlots: [
      { day: "Mon", start: "11:00", end: "13:00" },
      { day: "Thu", start: "09:00", end: "11:00" },
    ],
    icon: "Rocket01Icon",
    tone: "yellow",
    cardColor: "orange",
    shortDesc: "Idea → built product → live Demo Day pitch. Compulsory for every camper.",
    tagline: "From the spark of an idea to a pitch in front of a real audience, in two weeks.",
    whatYoullLearn: [
      "How to spot a real problem worth solving",
      "Talking to potential customers without being weird",
      "Lean canvas + lightweight business model",
      "Financial projections you can defend (lite version)",
      "Brand, naming, and positioning fundamentals",
      "Pitch deck structure that actually closes",
      "Speaking under pressure, and surviving the Q&A",
    ],
    outcomes: [
      "A one-page business plan you'd hand to any investor",
      "A polished pitch deck and a 3-minute pitch you can deliver cold",
      "Live Demo Day experience pitching to a real panel",
    ],
    tools: ["Notion", "Figma", "Pitch.com", "Spreadsheets"],
    sampleProject:
      "Pitch your real business idea on Demo Day — the Saturday after your cohort ends — to a panel of founders, parents and friends. The strongest pitch wins post-camp mentorship.",
  },
  {
    slug: "content-creation",
    name: "Content Creation",
    type: "class",
    facilitators: [],
    hoursPerWeek: 4,
    sessionsPerWeek: 2,
    scheduleSlots: [
      { day: "Wed", start: "09:00", end: "11:00" },
      { day: "Fri", start: "11:00", end: "13:00" },
    ],
    icon: "CameraVideoIcon",
    tone: "coral",
    cardColor: "pink",
    shortDesc: "Script, shoot, edit. Walk out with a portfolio of short-form videos by week four.",
    tagline: "Become the storyteller every founder, athlete and brand wishes they had.",
    whatYoullLearn: [
      "Storytelling fundamentals: what makes people stop scrolling",
      "Scripting for short-form (under 60 seconds)",
      "Shooting on a phone like it cost a fortune",
      "Free lighting + audio tricks that change everything",
      "Editing in CapCut: cuts, transitions, captions, music",
      "Hook structure + retention math",
      "Posting strategy across TikTok, IG and YouTube",
    ],
    outcomes: [
      "A body of 5+ short-form videos you produced from scratch",
      "Your own creator channel set up and posting",
      "An editing workflow you can repeat at home",
    ],
    tools: ["Phone camera", "CapCut", "Canva", "Notion (script templates)"],
    sampleProject:
      "Produce a 3-part short-form series about IMMERSIA itself: script, shoot, edit, post. Highest-performing post wins a creator-kit prize.",
  },
  {
    slug: "robotics",
    name: "Robotics & Embedded Systems",
    type: "class",
    isElective: true,
    electiveFeeKobo: PRICING.robotics, // env-configurable; covers the Arduino board, servos/motors and consumables the camper keeps
    facilitators: [],
    hoursPerWeek: 4,
    sessionsPerWeek: 2,
    scheduleSlots: [
      { day: "Tue", start: "11:00", end: "13:00" },
      { day: "Fri", start: "09:00", end: "11:00" },
    ],
    icon: "RoboticIcon",
    tone: "orange",
    cardColor: "violet",
    shortDesc: "Blink your first LED on day one, then build sensors, sound, motors and a full alarm system — and design your own gadget. Keep the kit.",
    tagline: "Turn code into the real world: a blinking light on day one, your own working electronic gadget by the end.",
    whatYoullLearn: [
      "Set up an Arduino from scratch — IDE, board, libraries and your first upload",
      "Read a circuit diagram and wire it on a breadboard with confidence",
      "Digital vs analog: buttons, a light dimmer, light sensors and the map() function",
      "Make things move and make sound: piezo buzzers, servo motors and a joystick",
      "Drive an LCD display and build a complete motion-sensing security system",
      "Write firmware in C++ — variables, loops, conditionals and libraries (just enough)",
      "Debug with the serial monitor and a multimeter when the hardware lies to you",
    ],
    outcomes: [
      "A capstone gadget you designed and built yourself — a smart doorbell, weather station, plant-waterer alert or your own idea",
      "A portfolio of 6–8 working electronics projects you can demo and explain",
      "Your own Arduino kit — board, sensors, servos and components — to keep and keep building with at home",
      "The confidence to read a circuit diagram and take electronics apart and back together",
    ],
    tools: ["Arduino Uno R3", "Arduino IDE", "Breadboards + jumper wires", "Servos, sensors & I²C LCD", "Multimeter", "Soldering iron (supervised)"],
    sampleProject:
      "Pitch your own gadget — a smart doorbell, a weather station, a plant-waterer alert — then build it, debug it with the serial monitor, and demo it live to parents on showcase day.",
  },
  {
    slug: "ai-music",
    name: "AI Music Production",
    type: "class",
    facilitators: [],
    hoursPerWeek: 2,
    sessionsPerWeek: 1,
    scheduleSlots: [
      { day: "Fri", start: "11:00", end: "13:00" },
    ],
    icon: "MusicNote01Icon",
    tone: "mint",
    cardColor: "amber",
    shortDesc: "Produce a finished, mixed track with AI-assisted tools.",
    tagline: "From an empty timeline to a finished track the algorithm wants to push.",
    whatYoullLearn: [
      "Songwriting fundamentals: verse, chorus, hook",
      "Working with AI music tools (Suno, Udio, Splice)",
      "Arranging a track in a basic DAW",
      "Mixing essentials: levels, EQ, compression (the basics)",
      "Mastering for streaming platforms",
      "Copyright basics for AI-assisted music",
    ],
    outcomes: [
      "A finished, mixed track you produced from scratch",
      "A SoundCloud / Spotify-ready master",
      "The full workflow to keep producing at home",
    ],
    tools: ["BandLab / Soundtrap (free DAW)", "Suno / Udio (AI generation)", "Splice (samples)"],
    sampleProject:
      "Produce and mix one original track from scratch. Premiere it on Demo Day to the whole cohort.",
  },
  {
    slug: "3d-vr",
    name: "3D Character Design & VR World Creation",
    type: "class",
    facilitators: [],
    hoursPerWeek: 4,
    sessionsPerWeek: 2,
    scheduleSlots: [
      { day: "Tue", start: "09:00", end: "11:00" },
      { day: "Thu", start: "11:00", end: "13:00" },
    ],
    icon: "VrGlassesIcon",
    tone: "pink",
    cardColor: "emerald",
    shortDesc: "Sculpt an original character in Blender, build the world it lives in, then step inside that world in VR — and walk your guests through it.",
    tagline: "Build a world nobody has ever been to, wear a character you made, and walk your friends through it in VR.",
    whatYoullLearn: [
      "Blender from zero: navigate the viewport and model in object + edit mode",
      "Sculpt and detail an original character from simple shapes",
      "Materials, lighting and camera framing that render a scene with real mood",
      "Use AI tools to spark concept art, textures and ideas for your character and world",
      "Rig your character so it can walk, wave and animate",
      "Build the world: terrain, sky, props and atmosphere, with a cinematic fly-through",
      "Assemble it all into a walkable VR space in Frame VR and add interactivity",
    ],
    outcomes: [
      "An original 3D character you sculpted, coloured and rigged from scratch",
      "A complete VR world you designed and built — that guests can walk through in a headset",
      "A portfolio: rendered scenes, a fly-through film and a published VR experience",
      "All your project files to keep creating at home",
    ],
    tools: ["Blender 4.x", "Mixamo", "Frame VR", "AI concept + texture tools", "Free asset libraries (Quaternius · Kenney · Poly Pizza)", "Meta Quest (provided)"],
    sampleProject:
      "Design and sculpt a character, rig it, then build the world it lives in. On showcase day, guests put on a headset and walk through your world while you give them the tour.",
  },

  // ============================ ACTIVE BREAKS ============================
  {
    slug: "pro-gaming",
    name: "Pro Gaming / E-Sports",
    type: "active-break",
    facilitators: [],
    hoursPerWeek: 2.5,
    sessionsPerWeek: 5,
    scheduleSlots: [
      { day: "Mon", start: "13:00", end: "13:30" },
      { day: "Tue", start: "13:00", end: "13:30" },
      { day: "Wed", start: "13:00", end: "13:30" },
      { day: "Thu", start: "13:00", end: "13:30" },
      { day: "Fri", start: "13:00", end: "13:30" },
    ],
    icon: "GameController01Icon",
    tone: "blue",
    cardColor: "pink",
    shortDesc: "Coached competitive gaming on real rigs. Daily, one token.",
    tagline: "Train like an e-sports pro: strategy, reaction time, and the business behind the screen.",
    whatYoullLearn: [
      "Pro warm-up routines used by competitive players",
      "Team communication and shot-calling basics",
      "Strategy fundamentals across popular titles",
      "Healthy posture, breaks and screen habits",
      "How the e-sports industry actually works",
    ],
    outcomes: [
      "Sharper game sense and reaction time",
      "Healthier competitive gaming habits",
      "Friends who play your favourite titles",
    ],
    tools: ["Gaming PCs", "Pro controllers", "Headsets"],
    sampleProject:
      "End-of-camp e-sports tournament. Bring your A-game and your favourite title.",
  },
  {
    slug: "table-tennis",
    name: "Table Tennis",
    type: "active-break",
    facilitators: [],
    hoursPerWeek: 2.5,
    sessionsPerWeek: 5,
    scheduleSlots: [
      { day: "Mon", start: "13:00", end: "13:30" },
      { day: "Tue", start: "13:00", end: "13:30" },
      { day: "Wed", start: "13:00", end: "13:30" },
      { day: "Thu", start: "13:00", end: "13:30" },
      { day: "Fri", start: "13:00", end: "13:30" },
    ],
    icon: "TableTennisBatIcon",
    tone: "orange",
    cardColor: "cobalt",
    shortDesc: "A 30-minute reset in the afternoon break. Daily, one token.",
    tagline: "The fastest racket sport in the world. A perfect 30-minute reset in the afternoon break.",
    whatYoullLearn: [
      "Forehand, backhand and the push shot",
      "Spin and serve fundamentals",
      "Footwork drills you'll actually use",
      "Doubles play and rally tactics",
    ],
    outcomes: [
      "Visibly sharper reaction time",
      "Fitness on a fun scale",
      "A sport you'll keep playing long after camp",
    ],
    tools: ["Pro tables", "Quality paddles", "Match-grade balls"],
    sampleProject:
      "Friday round-robin tournament. Every level welcome, every player gets matches.",
  },
  {
    slug: "go-karting",
    name: "Go Karting",
    type: "active-break",
    facilitators: [],
    hoursPerWeek: 2.5,
    sessionsPerWeek: 5,
    scheduleSlots: [
      { day: "Mon", start: "13:00", end: "13:30" },
      { day: "Tue", start: "13:00", end: "13:30" },
      { day: "Wed", start: "13:00", end: "13:30" },
      { day: "Thu", start: "13:00", end: "13:30" },
      { day: "Fri", start: "13:00", end: "13:30" },
    ],
    icon: "RacingFlagIcon",
    tone: "petrol",
    cardColor: "emerald",
    shortDesc: "Short, fully-supervised circuits. Daily, one token, helmets included.",
    tagline: "30 minutes of pure adrenaline that resets the brain in the afternoon break.",
    whatYoullLearn: [
      "Steering, braking and the racing line",
      "Safety procedures (every single time)",
      "Sportsmanship under pressure",
    ],
    outcomes: [
      "Confident behind the wheel of a junior kart",
      "Sharper hand-eye-foot coordination",
      "Stories you'll tell forever",
    ],
    tools: ["Junior karts", "Helmets", "Full safety gear"],
    sampleProject:
      "End-of-camp kart championship: timed laps, podium, certificates.",
  },
];

// ====================== HELPERS ======================

export function getBySlug(slug: string): CurriculumItem | undefined {
  return CURRICULUM.find((c) => c.slug === slug);
}

export function getClasses(): CurriculumItem[] {
  return CURRICULUM.filter((c) => c.type === "class");
}

export function getBreaks(): CurriculumItem[] {
  return CURRICULUM.filter((c) => c.type === "active-break");
}

/** All slugs for `generateStaticParams()` on the [slug] route. */
export function allSlugs(): string[] {
  return CURRICULUM.map((c) => c.slug);
}

/** A summary string like "MON · WED" built from scheduleSlots (handy for cards). */
export function scheduleDays(item: CurriculumItem): string {
  return Array.from(new Set(item.scheduleSlots.map((s) => s.day.toUpperCase()))).join(" · ");
}
