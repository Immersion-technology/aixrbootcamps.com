import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
    <html lang="en" className={`${spicySale.variable} ${superBeatpop.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-body antialiased">{children}</body>
    </html>
  );
}
