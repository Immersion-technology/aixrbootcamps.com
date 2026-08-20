"use client";

import { useCallback, useRef, useState } from "react";
import Lightbox from "@/components/Lightbox";
import VideoCard from "@/components/VideoCard";
import {
  CHANNEL_URL,
  VIDEOS,
  aspectRatioOf,
  embedUrl,
  featuredVideo,
  gridVideos,
  hasVideos,
  isPortrait,
} from "@/lib/videos";

/**
 * "See it for yourself" — the video shelf directly under the hero.
 *
 * Sits on a near-black band on purpose. The section immediately below it
 * (#programmes) is already white-on-white; a second white band stacked above it
 * reads as a mistake, and thumbnails need a dark surround to carry any weight.
 *
 * Every tile opens the same lightbox rather than playing inline. That keeps
 * exactly one <iframe> alive at a time, and it is the right frame for vertical
 * Shorts, which look cramped played inline in a page-width box.
 */
export default function VideoGallery() {
  // Rendering nothing beats rendering an empty shelf — same contract as
  // GalleryStrip, so the page degrades cleanly before any videos are added.
  const hero = featuredVideo();
  const rest = gridVideos();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Remember which tile opened the lightbox so focus can return there on close;
  // without it keyboard users are dumped at the top of the document.
  const lastFocused = useRef<HTMLElement | null>(null);

  const open = useCallback((index: number) => {
    lastFocused.current = document.activeElement as HTMLElement;
    setOpenIndex(index);
  }, []);

  const close = useCallback(() => {
    setOpenIndex(null);
    requestAnimationFrame(() => lastFocused.current?.focus());
  }, []);

  const step = useCallback((delta: number) => {
    setOpenIndex((i) => (i === null ? null : (i + delta + VIDEOS.length) % VIDEOS.length));
  }, []);

  if (!hasVideos() || !hero) return null;

  const active = openIndex === null ? null : VIDEOS[openIndex];

  return (
    <section id="videos" className="relative overflow-hidden bg-ink py-16 sm:py-20">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <div className="stagger-group text-center mb-9 sm:mb-11">
          <div
            className="stagger-rise text-[10.5px] font-bold tracking-[.22em] text-jade-brand uppercase mb-2"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            Straight from camp
          </div>
          <h2
            className="stagger-rise font-bubble text-[clamp(30px,4.6vw,54px)] leading-[1.02] text-white"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            SEE IT FOR YOURSELF
          </h2>
          <p
            className="stagger-rise text-[14px] text-white/70 mt-3 max-w-[560px] mx-auto"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            Real footage from the camp floor — the builds, the robots, the Demo Day nerves.
            No stock photos, no staging.
          </p>
        </div>

        <div
          className="stagger-rise"
          style={{ "--i": 3, "--tilt": "0deg" } as React.CSSProperties}
        >
          <VideoCard video={hero} featured priority onOpen={() => open(VIDEOS.indexOf(hero))} />
        </div>

        {rest.length > 0 && (
          /*
           * Centred flex-wrap rather than a grid. With a fixed 4-column grid an
           * incomplete last row (3 videos, say) leaves a dead cell on the right
           * that reads as unfinished. This keeps the tile widths identical to a
           * 2/3/4-column grid but centres whatever the final row contains, so it
           * looks deliberate at any video count.
           */
          <ul className="mt-4 sm:mt-5 flex flex-wrap justify-center gap-3 sm:gap-4">
            {rest.map((video, i) => (
              <li
                key={video.id}
                className="stagger-rise w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
                style={{ "--i": 4 + i, "--tilt": "0deg" } as React.CSSProperties}
              >
                <VideoCard video={video} onOpen={() => open(VIDEOS.indexOf(video))} />
              </li>
            ))}
          </ul>
        )}

        <div className="text-center mt-8">
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] font-semibold text-white/70 hover:text-white underline underline-offset-4 decoration-2 decoration-white/25 hover:decoration-jade-brand transition"
          >
            More on our YouTube channel →
          </a>
        </div>
      </div>

      {active && openIndex !== null && (
        <Lightbox
          label={active.title}
          index={openIndex}
          total={VIDEOS.length}
          onClose={close}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          prevLabel="Previous video"
          nextLabel="Next video"
        >
          <figure className="relative flex-1 h-full flex flex-col items-center justify-center min-w-0 m-0">
            <div
              className="relative w-full max-h-full mx-auto overflow-hidden rounded-2xl bg-black"
              style={{
                aspectRatio: aspectRatioOf(active),
                // A 9:16 player must be height-bound, or it overflows the
                // viewport on desktop and the controls end up off-screen.
                width: isPortrait(active) ? "min(100%, calc(min(78vh, 900px) * 9 / 16))" : "100%",
                maxWidth: isPortrait(active) ? undefined : "min(100%, 1100px)",
              }}
            >
              <iframe
                /*
                 * key on the video id so navigating prev/next REMOUNTS the
                 * player. Without it the previous video keeps playing its audio
                 * behind the new one, and closing the dialog leaves a detached
                 * iframe still running.
                 */
                key={active.id}
                src={embedUrl(active.id)}
                title={active.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <figcaption className="text-center text-white/85 text-[13px] mt-3 shrink-0 max-w-[700px]">
              {active.title}
            </figcaption>
          </figure>
        </Lightbox>
      )}
    </section>
  );
}
