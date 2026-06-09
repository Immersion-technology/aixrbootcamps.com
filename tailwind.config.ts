import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f1f1f1",
        paper: "#FAF7F2",
        ink: "#0f0f0f",
        // neon pink: vivid pop accent
        pink: { soft: "#ff77ab", brand: "#ff006e", deep: "#cc0058" },
        mint: { soft: "#bfe8d3", deep: "#7fcfa6" },
        lavender: { soft: "#d4bce8", deep: "#a78ec4" },
        peach: "#f3e3d5",
        yellow: { soft: "#f6e58a", deep: "#f4d35e" },
        beige: "#d4a883",
        // azure blue: primary accent (poster's "LEARN THE FUTURE" / JUL 27 sticker / bubble fill)
        aqua: { soft: "#bcd6ff", brand: "#3a86ff", deep: "#2563eb" },
        // blaze orange: primary CTA color (poster's "SIGN UP TODAY" sticker)
        grass: { soft: "#ffb185", brand: "#fb5607", deep: "#d24400" },
        // true cobalt: secondary accent
        petrol: { brand: "#2d2e83", deep: "#1f2061" },
        // blue violet: pop accent (also serves legacy `violet-brand` / `frosted-glass-violet` refs)
        violet: { soft: "#c9a9f5", brand: "#8338ec", deep: "#6a23c9" },
        // amber gold: warm pop accent (named `gold` to avoid clobbering Tailwind's `amber-*` scale used by admin status badges)
        gold: { soft: "#ffe08a", brand: "#ffbe0b", deep: "#e0a500" },
        // emerald: fresh pop accent (named `jade` to avoid clobbering Tailwind's `emerald-*` scale used by admin status badges)
        jade: { soft: "#7defc9", brand: "#06d6a0", deep: "#05a87e" },
      },
      fontFamily: {
        display: ["var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        accent: ["var(--font-accent)", "var(--font-body)", "sans-serif"],
        bubble: ["var(--font-bubble)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
