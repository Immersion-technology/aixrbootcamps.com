"use client";

import { useState } from "react";
import { FAQS, FAQ_TOPIC_STYLE } from "@/lib/faq";

/**
 * Smooth FAQ accordion. Replaces the native <details> (which snaps open with no
 * transition) with a grid-rows 0fr→1fr height animation that eases both open and
 * close. One panel open at a time.
 *
 * `reveal="stagger"` opts each row into the scroll-driven .stagger-rise cascade
 * (used on the landing page, inside a .stagger-group). `reveal="fade"` uses the
 * simpler anim-fade-up entrance (used on the standalone /faq page).
 */
export default function FaqAccordion({
  reveal = "fade",
  staggerOffset = 0,
}: {
  reveal?: "stagger" | "fade";
  staggerOffset?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        const revealClass =
          reveal === "stagger" ? "stagger-rise" : `anim-fade-up delay-${(i % 5) + 1}`;

        return (
          <div
            key={item.q}
            className={`group frosted-glass rounded-2xl overflow-hidden ${revealClass}`}
            style={
              reveal === "stagger"
                ? ({ "--i": staggerOffset + i } as React.CSSProperties)
                : undefined
            }
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 cursor-pointer text-left"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className={`sticker-pill ${FAQ_TOPIC_STYLE[item.topic]} mt-0.5 shrink-0`} aria-hidden>
                  {item.topic}
                </span>
                <span className="font-bubble text-[15.5px] sm:text-[17px] leading-snug text-ink">
                  {item.q}
                </span>
              </div>
              <span
                aria-hidden
                className={`shrink-0 w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bubble text-[20px] leading-none transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>

            {/* grid-rows trick: animates height smoothly in both directions */}
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 sm:px-6 pb-5 text-[13.5px] text-neutral-700 leading-relaxed max-w-[640px]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
