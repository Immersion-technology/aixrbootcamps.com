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
        pink: { soft: "#f6c6cf", deep: "#ef9aaa" },
        mint: { soft: "#bfe8d3", deep: "#7fcfa6" },
        lavender: { soft: "#d4bce8", deep: "#a78ec4" },
        peach: "#f3e3d5",
        yellow: { soft: "#f6e58a", deep: "#f4d35e" },
        beige: "#d4a883",
        // bright cyan: primary accent (poster's "LEARN THE FUTURE" / JUL 27 sticker / bubble fill)
        aqua: { soft: "#a8e6ed", brand: "#19b8c8", deep: "#0e92a0" },
        // vivid green: primary CTA color (poster's "SIGN UP TODAY" sticker)
        grass: { soft: "#86efac", brand: "#22C55E", deep: "#16a34a" },
        // deep teal: secondary accent
        petrol: { brand: "#1f6f87", deep: "#15536a" },
        // legacy alias: kept so existing `violet-brand` / `frosted-glass-violet` refs keep working
        violet: { brand: "#19b8c8" },
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
