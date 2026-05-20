/**
 * IMMERSIA — single source of truth for the 2026 curriculum.
 *
 * Both the landing page (course grid + active breaks + timetable),
 * the registration form (read-only enrollment + paired-elective radio),
 * the per-course detail pages, and the email templates all read from this.
 *
 * Update once, ripples everywhere.
 */

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
  facilitators: string[];
  hoursPerWeek: number;
  sessionsPerWeek: number;
  scheduleSlots: ScheduleSlot[];
  icon: IconName;
  tone: Tone;
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
      { day: "Mon", start: "10:00", end: "12:00" },
      { day: "Wed", start: "12:30", end: "14:30" },
    ],
    icon: "CodeIcon",
    tone: "violet",
    shortDesc: "Pair-program with AI to ship a real, deployed web app — zero prior code required.",
    tagline: "Code the way pros build in 2026 — alongside AI, not despite it.",
    whatYoullLearn: [
      "Prompt-engineering fundamentals — how to talk to AI like a senior engineer",
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
      "Pick a real problem at your school. Spec it. Build a working web app for it with AI as your pair. Deploy it. Demo it on closing Friday.",
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
      { day: "Mon", start: "12:30", end: "14:30" },
      { day: "Thu", start: "10:00", end: "12:00" },
    ],
    icon: "Rocket01Icon",
    tone: "yellow",
    shortDesc: "Idea → built product → live Demo Day pitch. Compulsory for every camper.",
    tagline: "From the spark of an idea to a pitch in front of a real audience — in two weeks.",
    whatYoullLearn: [
      "How to spot a real problem worth solving",
      "Talking to potential customers without being weird",
      "Lean canvas + lightweight business model",
      "Financial projections you can defend (lite version)",
      "Brand, naming, and positioning fundamentals",
      "Pitch deck structure that actually closes",
      "Speaking under pressure — and surviving the Q&A",
    ],
    outcomes: [
      "A one-page business plan you'd hand to any investor",
      "A polished pitch deck and a 3-minute pitch you can deliver cold",
      "Live Demo Day experience pitching to a real panel",
    ],
    tools: ["Notion", "Figma", "Pitch.com", "Spreadsheets"],
    sampleProject:
      "Pitch your real business idea on Demo Day (21 August) to a panel of founders, parents and friends. The strongest pitch wins post-camp mentorship.",
  },
  {
    slug: "content-creation",
    name: "Content Creation",
    type: "class",
    facilitators: [],
    hoursPerWeek: 4,
    sessionsPerWeek: 2,
    scheduleSlots: [
      { day: "Wed", start: "10:00", end: "12:00" },
      { day: "Fri", start: "12:30", end: "14:30" },
    ],
    icon: "CameraVideoIcon",
    tone: "coral",
    shortDesc: "Script, shoot, edit — walk out with a portfolio of short-form videos by week four.",
    tagline: "Become the storyteller every founder, athlete and brand wishes they had.",
    whatYoullLearn: [
      "Storytelling fundamentals — what makes people stop scrolling",
      "Scripting for short-form (under 60 seconds)",
      "Shooting on a phone like it cost a fortune",
      "Free lighting + audio tricks that change everything",
      "Editing in CapCut — cuts, transitions, captions, music",
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
      "Produce a 3-part short-form series about IMMERSIA itself — script, shoot, edit, post. Highest-performing post wins a creator-kit prize.",
  },
  {
    slug: "robotics",
    name: "Robotics & Embedded Systems",
    type: "class",
    facilitators: [],
    hoursPerWeek: 4,
    sessionsPerWeek: 2,
    scheduleSlots: [
      { day: "Tue", start: "12:30", end: "14:30" },
      { day: "Fri", start: "10:00", end: "12:00" },
    ],
    icon: "RoboticIcon",
    tone: "orange",
    shortDesc: "Wire microcontrollers. Write firmware. Take home a moving robot you actually built.",
    tagline: "Make atoms dance — turn code into motors, sensors and a robot that moves.",
    whatYoullLearn: [
      "How electricity actually works (the lite version)",
      "Soldering basics under supervision",
      "Arduino + ESP32 fundamentals from scratch",
      "Working with sensors — ultrasonic, IR, accelerometer",
      "Driving motors and servos cleanly",
      "Writing firmware in C++ (just enough)",
      "Debugging when hardware lies to you",
    ],
    outcomes: [
      "A working robot you built end-to-end and take home",
      "The ability to read circuit diagrams without panicking",
      "Confidence to take electronics apart and put them back together",
    ],
    tools: ["Arduino IDE", "Soldering iron (supervised)", "ESP32 dev kits", "Breadboards", "Multimeters", "Servos + sensors"],
    sampleProject:
      "Build a line-following or obstacle-avoiding robot from a bare microcontroller up. Race it against your cohort on Demo Day.",
  },
  {
    slug: "ai-music",
    name: "AI Music Production",
    type: "class",
    facilitators: [],
    hoursPerWeek: 2,
    sessionsPerWeek: 1,
    scheduleSlots: [
      { day: "Fri", start: "12:30", end: "14:30" },
    ],
    icon: "MusicNote01Icon",
    tone: "mint",
    shortDesc: "Produce a finished, mixed track with AI-assisted tools.",
    tagline: "From an empty timeline to a finished track the algorithm wants to push.",
    whatYoullLearn: [
      "Songwriting fundamentals — verse, chorus, hook",
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
      { day: "Tue", start: "10:00", end: "12:00" },
      { day: "Thu", start: "12:30", end: "14:30" },
    ],
    icon: "VrGlassesIcon",
    tone: "pink",
    shortDesc: "Sculpt characters in Blender. Step inside your own VR world by week three.",
    tagline: "Build worlds nobody else has been to — then step inside them.",
    whatYoullLearn: [
      "Blender basics: modeling, sculpting, texturing",
      "Character rigging the lite way (Mixamo + custom)",
      "Importing your assets into a Unity scene",
      "Composing scenes for VR — scale, lighting, atmosphere",
      "Hand-tracking interactions in your scene",
      "Exporting a build that runs on the Meta Quest 3",
      "Sharing your scene with friends + family",
    ],
    outcomes: [
      "An original 3D character you sculpted from scratch",
      "A small VR scene you designed and built",
      "The project files to keep iterating at home",
    ],
    tools: ["Blender", "Unity", "Meta Quest 3 (provided)", "Mixamo", "Substance Painter (lite)"],
    sampleProject:
      "Design a character. Place them inside your own VR scene. Walk into that scene on Demo Day with the headset on — your guests step in too.",
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
      { day: "Mon", start: "12:00", end: "12:30" },
      { day: "Tue", start: "12:00", end: "12:30" },
      { day: "Wed", start: "12:00", end: "12:30" },
      { day: "Thu", start: "12:00", end: "12:30" },
      { day: "Fri", start: "12:00", end: "12:30" },
    ],
    icon: "GameController01Icon",
    tone: "blue",
    shortDesc: "Coached competitive gaming on real rigs. Free to join during every active break.",
    tagline: "Train like an e-sports pro — strategy, reaction time, and the business behind the screen.",
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
      "End-of-camp e-sports tournament — bring your A-game and your favourite title.",
  },
  {
    slug: "table-tennis",
    name: "Table Tennis",
    type: "active-break",
    facilitators: [],
    hoursPerWeek: 2.5,
    sessionsPerWeek: 5,
    scheduleSlots: [
      { day: "Mon", start: "12:00", end: "12:30" },
      { day: "Tue", start: "12:00", end: "12:30" },
      { day: "Wed", start: "12:00", end: "12:30" },
      { day: "Thu", start: "12:00", end: "12:30" },
      { day: "Fri", start: "12:00", end: "12:30" },
    ],
    icon: "TableTennisBatIcon",
    tone: "orange",
    shortDesc: "Sharpen reflexes between morning and afternoon courses — daily, free choice.",
    tagline: "The fastest racket sport in the world — perfect 30-minute reset between deep-tech blocks.",
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
      "Friday round-robin tournament — every level welcome, every player gets matches.",
  },
  {
    slug: "go-karting",
    name: "Go Karting",
    type: "active-break",
    facilitators: [],
    hoursPerWeek: 2.5,
    sessionsPerWeek: 5,
    scheduleSlots: [
      { day: "Mon", start: "12:00", end: "12:30" },
      { day: "Tue", start: "12:00", end: "12:30" },
      { day: "Wed", start: "12:00", end: "12:30" },
      { day: "Thu", start: "12:00", end: "12:30" },
      { day: "Fri", start: "12:00", end: "12:30" },
    ],
    icon: "RacingFlagIcon",
    tone: "petrol",
    shortDesc: "Short, fully-supervised circuits. Daily, free choice, helmets included.",
    tagline: "30 minutes of pure adrenaline that resets the brain for the afternoon block.",
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
      "End-of-camp kart championship — timed laps, podium, certificates.",
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
