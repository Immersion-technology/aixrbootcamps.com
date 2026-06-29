"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "aixr-early-bird-jul3";

/**
 * Slim, dismissible site-wide notice that the bootcamp now runs hybrid
 * (in-person in Lagos OR live online). Dismissal is remembered in localStorage
 * so it doesn't nag on every visit. Renders nothing until mounted to avoid a
 * hydration flash.
 */
export default function AnnouncementBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "dismissed") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

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
        <strong>Early-bird pricing ends 3 July</strong> — lock in ₦150,000 before it jumps to ₦200,000.{" "}
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
