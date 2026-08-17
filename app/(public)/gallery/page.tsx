import type { Metadata } from "next";
import Link from "next/link";
import GalleryGrid from "@/components/GalleryGrid";
import JsonLd from "@/components/JsonLd";
import { GALLERY, categoriesInUse, cohortsInUse, cohortChipLabel } from "@/lib/gallery";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { nextOpenCohort } from "@/lib/cohorts";

export const metadata: Metadata = {
  title: "Gallery · Inside the AI & XR Boot Camp",
  description:
    "Photos from the IMMERSIA AI & XR Summer Tech Boot Camp in Lagos — campers building robots, pitching on Demo Day, and working in VR.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Gallery · Inside the AI & XR Boot Camp",
    description: "Photos from the IMMERSIA AI & XR Summer Tech Boot Camp in Lagos.",
    url: absoluteUrl("/gallery"),
  },
};

export default function GalleryPage() {
  const photos = GALLERY;
  const categories = categoriesInUse();
  const cohorts = cohortsInUse();
  const nextCohort = nextOpenCohort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: `${SITE_NAME} Boot Camp Gallery`,
    url: absoluteUrl("/gallery"),
    image: photos.map((p) => absoluteUrl(p.src)),
  };

  return (
    <section className="relative pt-12 pb-24 dot-grid min-h-[70vh]">
      {photos.length > 0 && <JsonLd data={jsonLd} />}

      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <div className="mb-10">
          <div className="text-[10.5px] font-bold tracking-[.22em] text-violet-brand uppercase mb-2">
            From the camp floor
          </div>
          <h1 className="font-bubble text-[clamp(38px,5.6vw,64px)] leading-[1.02] tracking-tight text-ink mb-4">
            GALLERY
          </h1>
          <p className="text-[14px] sm:text-[15px] text-neutral-700 leading-relaxed max-w-[560px]">
            Campers building robots, shipping AI apps, working in VR and pitching live on Demo Day —
            at our Lagos venue.
          </p>
        </div>

        {photos.length === 0 ? (
          <EmptyState hasOpenCohort={!!nextCohort} />
        ) : (
          <GalleryGrid
            photos={photos}
            categories={categories}
            cohorts={cohorts}
            cohortLabels={Object.fromEntries(cohorts.map((c) => [c, cohortChipLabel(c)]))}
          />
        )}
      </div>
    </section>
  );
}

/**
 * Shown until the first photos land. The nav links here from day one, so this
 * has to be a real destination rather than an empty grid.
 */
function EmptyState({ hasOpenCohort }: { hasOpenCohort: boolean }) {
  return (
    <div className="frosted-glass rounded-3xl p-10 sm:p-14 text-center max-w-[620px] mx-auto">
      <div className="font-bubble text-[28px] leading-tight text-ink mb-3">
        Photos are on the way
      </div>
      <p className="text-[14px] text-neutral-700 leading-relaxed mb-7">
        We&apos;re sorting through the shots from camp. Check back shortly to see the robots, the
        VR builds and Demo Day.
      </p>
      <Link href={hasOpenCohort ? "/register" : "/contact"} className="btn-grass">
        {hasOpenCohort ? "Reserve a slot →" : "Talk to us →"}
      </Link>
    </div>
  );
}
