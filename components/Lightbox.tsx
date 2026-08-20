"use client";

import { useEffect, useRef } from "react";

/**
 * Shared modal shell for the photo and video galleries.
 *
 * Extracted from GalleryGrid, where it started life photo-only. The valuable
 * part is the chrome — focus trap, Esc/arrow keys, body-scroll lock, swipe,
 * focus restoration — none of which differs between a photo and a video. That
 * is also the code most likely to harbour a subtle accessibility bug and least
 * likely to get audited twice, so it exists once.
 *
 * Callers own the body: pass whatever should sit between the nav buttons as
 * `children`, and handle focus restoration on close yourself (the caller knows
 * which tile was clicked).
 */

/**
 * Everything that can hold focus inside the dialog.
 *
 * `iframe` matters: a loaded YouTube embed is a real tab stop, and leaving it
 * out makes the trap miscalculate first/last so Tab escapes the modal.
 */
const FOCUSABLE = 'button, [href], iframe, [tabindex]:not([tabindex="-1"])';

/** Minimum horizontal travel before a touch counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 50;

export default function Lightbox({
  label,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  prevLabel = "Previous",
  nextLabel = "Next",
  children,
}: {
  /** Accessible name for the dialog — describe the item being shown. */
  label: string;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  prevLabel?: string;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Keyboard: Esc closes, arrows navigate, Tab is trapped inside the dialog.
  //
  // Known limitation: once focus is inside a cross-origin iframe (a viewer
  // clicking YouTube's own controls), key events fire in that document and
  // never reach this listener. Nothing in the parent page can observe them.
  // Close and navigation stay available via the buttons and by swiping.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  // Lock background scroll while open, restoring whatever was there before.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Move focus into the dialog on open.
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[100] bg-black/92 flex flex-col"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined) return;
        const dx = end - start;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        dx > 0 ? onPrev() : onNext();
      }}
    >
      <div className="flex items-center justify-between gap-4 p-4 text-white/80 text-[12.5px] font-semibold shrink-0">
        <span className="tabular-nums">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition"
        >
          Close ✕
        </button>
      </div>

      {/* stopPropagation so clicking the content itself doesn't close the dialog */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4 gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {total > 1 && (
          <NavButton label={prevLabel} onClick={onPrev}>
            ‹
          </NavButton>
        )}

        {children}

        {total > 1 && (
          <NavButton label={nextLabel} onClick={onNext}>
            ›
          </NavButton>
        )}
      </div>
    </div>
  );
}

function NavButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="shrink-0 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-[26px] leading-none flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition"
    >
      {children}
    </button>
  );
}
