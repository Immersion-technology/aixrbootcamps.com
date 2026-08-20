"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CATEGORY_LABELS,
  aspectRatioOf,
  type GalleryCategory,
  type GalleryItem,
} from "@/lib/gallery";
import type { CohortId } from "@/lib/cohorts";
import Lightbox from "@/components/Lightbox";

interface Props {
  photos: GalleryItem[];
  categories: GalleryCategory[];
  cohorts: CohortId[];
  cohortLabels: Record<number, string>;
}

type CategoryFilter = GalleryCategory | "all";
type CohortFilter = CohortId | "all";

export default function GalleryGrid({ photos, categories, cohorts, cohortLabels }: Props) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [cohort, setCohort] = useState<CohortFilter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Filtering happens client-side: the whole manifest is already in the payload,
  // so a round-trip would be slower than the filter itself.
  const visible = photos.filter(
    (p) => (category === "all" || p.category === category) && (cohort === "all" || p.cohort === cohort)
  );

  // Remember which tile opened the lightbox so focus can return there on close.
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastFocused = useRef<HTMLElement | null>(null);

  const open = (index: number) => {
    lastFocused.current = document.activeElement as HTMLElement;
    setOpenIndex(index);
  };

  const close = useCallback(() => {
    setOpenIndex(null);
    // Return focus to the tile that opened it — without this, keyboard users
    // are dumped at the top of the document.
    requestAnimationFrame(() => lastFocused.current?.focus());
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((i) => (i === null ? null : (i + delta + visible.length) % visible.length));
    },
    [visible.length]
  );

  // Reset the open photo if the filters change underneath it.
  useEffect(() => {
    setOpenIndex(null);
  }, [category, cohort]);

  if (photos.length === 0) return null;

  const showCategoryChips = categories.length > 1;
  const showCohortChips = cohorts.length > 1;

  return (
    <>
      {(showCategoryChips || showCohortChips) && (
        <div className="space-y-3 mb-8">
          {showCategoryChips && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter photos by subject">
              <Chip active={category === "all"} onClick={() => setCategory("all")}>
                All photos
              </Chip>
              {categories.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {CATEGORY_LABELS[c]}
                </Chip>
              ))}
            </div>
          )}

          {showCohortChips && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter photos by cohort">
              <Chip active={cohort === "all"} onClick={() => setCohort("all")} subtle>
                Every cohort
              </Chip>
              {cohorts.map((c) => (
                <Chip key={c} active={cohort === c} onClick={() => setCohort(c)} subtle>
                  {cohortLabels[c] ?? `Cohort ${c}`}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announce result count for screen readers as filters change. */}
      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "photo" : "photos"} shown
      </p>

      {visible.length === 0 ? (
        <p className="text-[14px] text-neutral-600 py-12 text-center">
          No photos match that filter yet.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 list-none p-0 m-0">
          {visible.map((photo, i) => (
            <li key={photo.src}>
              <button
                type="button"
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                onClick={() => open(i)}
                className="group relative block w-full overflow-hidden rounded-2xl border-2 border-black/[.06] bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-aqua-brand/50 transition"
                style={{ aspectRatio: aspectRatioOf(photo) }}
                aria-label={`Open photo: ${photo.alt}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  // Matches the 1/2/3-column grid so the optimizer doesn't ship
                  // a full-width file to a third-width tile.
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={i < 4}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none"
                />
                {photo.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3.5 pt-8 pb-3 text-left text-[12.5px] font-semibold text-white">
                    {photo.caption}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {openIndex !== null && visible[openIndex] && (
        <Lightbox
          label={visible[openIndex].alt}
          index={openIndex}
          total={visible.length}
          onClose={close}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          prevLabel="Previous photo"
          nextLabel="Next photo"
        >
          <figure className="relative flex-1 h-full flex flex-col items-center justify-center min-w-0 m-0">
            <div className="relative w-full h-full">
              <Image
                src={visible[openIndex].src}
                alt={visible[openIndex].alt}
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </div>
            {visible[openIndex].caption && (
              <figcaption className="text-center text-white/85 text-[13px] mt-3 shrink-0">
                {visible[openIndex].caption}
              </figcaption>
            )}
          </figure>
        </Lightbox>
      )}
    </>
  );
}

function Chip({
  children,
  active,
  onClick,
  subtle,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-[12.5px] font-semibold px-4 py-2 rounded-full border-2 transition ${
        active
          ? subtle
            ? "bg-neutral-900 text-white border-neutral-900"
            : "bg-aqua-brand text-white border-aqua-brand"
          : "bg-white text-neutral-600 border-black/[.08] hover:border-aqua-brand hover:text-aqua-deep"
      }`}
    >
      {children}
    </button>
  );
}
