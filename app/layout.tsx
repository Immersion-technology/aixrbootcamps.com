import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

// Space Grotesk: the body + display workhorse (font-body / font-display).
// Self-hosted via next/font so there's no render-blocking request to Google.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// Orbitron: futuristic display used for outlined-pill / sci-fi headings (font-accent).
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-accent",
  display: "swap",
});

// Spicy Sale: friendly bubble face used everywhere `font-bubble` shows up
// (stickers, info cards, course titles, section headlines). 100% free for
// personal + commercial use per app/fonts/SpicySale-LICENSE.txt.
const spicySale = localFont({
  src: "./fonts/SpicySale.otf",
  variable: "--font-bubble",
  display: "swap",
});

// Super Beatpop: bigger, poster-punch display reserved for the hero wordmark.
// 100% free for personal + commercial use per app/fonts/SuperBeatpop-LICENSE.txt.
const superBeatpop = localFont({
  src: "./fonts/SuperBeatpop.ttf",
  variable: "--font-wordmark",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI & XR Summer Tech Bootcamp 2026",
  description:
    "A 4-week tech adventure for kids aged 10–17. Robotics, AI, VR, e-sports, music & more. Starts 27 July 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${orbitron.variable} ${spicySale.variable} ${superBeatpop.variable}`}
    >
      <body className="bg-paper text-ink font-body antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
