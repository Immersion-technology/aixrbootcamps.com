import Link from "next/link";
import Image from "next/image";
import { featuredPhotos, aspectRatioOf } from "@/lib/gallery";

/**
 * Landing-page teaser: a scrollable strip of the best photos linking through to
 * /gallery. Sits right after the Demo Day section — parents have just read what
 * the pitch is, so this is where proof it actually happens does the most work.
 *
 * Renders NOTHING when there are no photos yet, rather than an empty box.
 */
export default function GalleryStrip() {
  const photos = featuredPhotos(8);
  if (photos.length === 0) return null;

  return (
    <section id="gallery" className="relative overflow-hidden py-16 sm:py-20 bg-white border-y border-black/[.05]">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <div className="flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left gap-4 mb-8">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-2">
              From the camp floor
            </div>
            <h2 className="font-bubble text-[clamp(30px,4.6vw,54px)] leading-[1.02] text-ink">
              THIS IS WHAT IT LOOKS LIKE
            </h2>
          </div>
          <Link
            href="/gallery"
            className="text-[13px] font-semibold text-aqua-deep hover:text-ink underline underline-offset-4 decoration-2 shrink-0"
          >
            See all photos →
          </Link>
        </div>
      </div>

      {/* Full-bleed horizontal scroll — the strip runs past the container edge on
          purpose so it reads as "there's more this way". */}
      <div className="overflow-x-auto pb-2 -mx-0">
        <ul className="flex gap-4 px-5 sm:px-7 list-none m-0 p-0 w-max mx-auto max-w-full">
          {photos.map((photo, i) => (
            <li key={photo.src} className="shrink-0">
              <Link
                href="/gallery"
                className="group relative block w-[260px] sm:w-[320px] overflow-hidden rounded-2xl border-2 border-black/[.06] bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-aqua-brand/50"
                style={{ aspectRatio: aspectRatioOf(photo) }}
                aria-label={`${photo.alt} — see all photos`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 260px, 320px"
                  loading={i < 3 ? "eager" : "lazy"}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none"
                />
                {photo.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3.5 pt-8 pb-3 text-[12.5px] font-semibold text-white">
                    {photo.caption}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
