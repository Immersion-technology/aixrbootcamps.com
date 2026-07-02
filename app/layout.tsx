import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { Analytics } from "@vercel/analytics/next";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESC,
  SITE_KEYWORDS,
  SITE_LOCALE,
} from "@/lib/site";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_TITLE} · ${SITE_NAME}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_TITLE} · ${SITE_NAME}`,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_TITLE} · ${SITE_NAME}`,
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
        <Analytics />
      </body>
    </html>
  );
}
