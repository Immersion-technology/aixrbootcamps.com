"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "aixr-early-bird-banner";

interface Props {
  /** Early-bird cutoff (ISO). The banner hides itself once this has passed. */
  earlyBirdCutoff: string;
  earlyBirdKobo: number;
  regularKobo: number;
}

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

/**
 * Slim, dismissible site-wide early-bird notice. The deadline + prices are passed in from
 * the server (single source of truth) and the copy is derived, so it can never advertise an
 * expired promo — once the cutoff passes the banner renders nothing. Dismissal is remembered
 * in localStorage. Renders nothing until mounted to avoid a hydration flash.
 */
export default function AnnouncementBanner({ earlyBirdCutoff, earlyBirdKobo, regularKobo }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only surface while early-bird pricing is still live.
    const earlyBirdLive = new Date() < new Date(earlyBirdCutoff);
    if (!earlyBirdLive) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "dismissed") setShow(true);
    } catch {
      setShow(true);
    }
  }, [earlyBirdCutoff]);

  if (!show) return null;

  const cutoffLabel = new Date(earlyBirdCutoff).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
  });

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* ignore: private mode / blocked storage */
    }
  }

  return (
    <div
      className="relative text-white text-center"
      style={{ background: "linear-gradient(90deg,#fb5607,#ff006e,#8338ec)" }}
    >
      <div className="mx-auto max-w-[1180px] px-10 py-2 text-[12px] sm:text-[12.5px] font-semibold leading-snug">
        <span aria-hidden>🔥</span>{" "}
        <strong>Early-bird pricing ends {cutoffLabel}</strong> — lock in {naira(earlyBirdKobo)} before it jumps to {naira(regularKobo)}.{" "}
        <Link href="/register" className="underline underline-offset-2 decoration-2 hover:opacity-90 whitespace-nowrap">
          Reserve now →
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-white/90 hover:bg-white/15 transition text-[15px] leading-none"
      >
        ✕
      </button>
    </div>
  );
}
