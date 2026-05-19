"use client";

import { useEffect } from "react";

/**
 * Marks every .stagger-rise on the page as data-revealed=true when it
 * scrolls into the viewport, so the CSS transition fires. Cross-browser
 * (Firefox can't use animation-timeline: view() unflagged yet).
 *
 * Respects prefers-reduced-motion: instantly reveals everything.
 */
export default function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll<HTMLElement>(".stagger-rise");

    if (reduceMotion) {
      els.forEach((el) => { el.dataset.revealed = "true"; });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = "true";
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
