"use client";

import { useState } from "react";
import {
  aspectRatioOf,
  isPortrait,
  thumbnailCandidates,
  type VideoItem,
} from "@/lib/videos";

/**
 * A click-to-play video tile — thumbnail and play button only.
 *
 * No <iframe> is mounted here, ever. A YouTube embed pulls well over a megabyte
 * of script; a dozen of them directly under the hero would wreck LCP on exactly
 * the mobile connections this page's paid traffic arrives on. The real player is
 * mounted by VideoGallery once, inside the lightbox, after a deliberate click.
 *
 * Plain <img> rather than next/image on purpose: YouTube already serves these
 * pre-sized and compressed, so the optimizer has no resizing work to do and
 * would only add a hop. What actually prevents layout shift is the fixed
 * aspect-ratio box below, not next/image.
 */
export default function VideoCard({
  video,
  featured = false,
  priority = false,
  onOpen,
}: {
  video: VideoItem;
  featured?: boolean;
  priority?: boolean;
  onOpen: () => void;
}) {
  const candidates = thumbnailCandidates(video);
  const [attempt, setAttempt] = useState(0);
  const src = candidates[Math.min(attempt, candidates.length - 1)];
  const portrait = isPortrait(video);

  // A portrait Short stretched to hero width would be a wall of video. Instead
  // the featured slot keeps a wide frame and fills the sides with a blurred
  // copy of the same frame — the cinema treatment — so nothing is cropped and
  // there are no black bars.
  const letterboxed = featured && portrait;

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerEnter={warmYouTubeConnection}
      onFocus={warmYouTubeConnection}
      aria-label={`Play video: ${video.title}`}
      className={[
        "group relative block w-full overflow-hidden bg-black",
        featured ? "rounded-[28px]" : "rounded-2xl",
        "border-2 border-white/10 hover:border-white/25 transition-colors",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-jade-brand/60",
      ].join(" ")}
      style={
        letterboxed
          ? { aspectRatio: "16 / 9", maxHeight: "min(70vh, 560px)" }
          : { aspectRatio: aspectRatioOf(video) }
      }
    >
      {letterboxed && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        // Decorative: the button already carries the accessible name, and a
        // screen reader announcing the title twice is worse than once.
        alt=""
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setAttempt((n) => n + 1)}
        className={[
          "absolute inset-0 w-full h-full",
          letterboxed ? "object-contain" : "object-cover",
          "transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none",
        ].join(" ")}
      />

      {/* Title legibility scrim, matching the photo gallery's treatment. */}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pt-10 pb-3.5 text-left">
        <span
          className={[
            "block font-semibold text-white leading-snug",
            featured ? "text-[14px] sm:text-[16px]" : "text-[12.5px]",
          ].join(" ")}
        >
          {video.title}
        </span>
      </span>

      <span aria-hidden className="absolute inset-0 flex items-center justify-center">
        <span
          className={[
            "rounded-full bg-grass-brand text-ink flex items-center justify-center",
            "shadow-[0_12px_34px_-8px_rgba(251,86,7,.75)]",
            "transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none",
            featured ? "w-[70px] h-[70px]" : "w-12 h-12",
          ].join(" ")}
        >
          <svg
            width={featured ? 26 : 18}
            height={featured ? 26 : 18}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
            focusable="false"
            /* nudged right so the triangle reads as centred inside the circle */
            className="translate-x-[1.5px]"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

/**
 * Open the TCP/TLS connection to YouTube on hover, so the click that follows
 * isn't also paying for the handshake. Runs at most once per page.
 */
let warmed = false;
function warmYouTubeConnection() {
  if (warmed || typeof document === "undefined") return;
  warmed = true;
  for (const href of ["https://www.youtube-nocookie.com", "https://i.ytimg.com"]) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    document.head.appendChild(link);
  }
}
