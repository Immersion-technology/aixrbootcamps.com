"use client";

import { useEffect } from "react";
import { trackMeta } from "@/lib/meta-pixel";

/**
 * Fires a Meta `ViewContent` event for a course page.
 *
 * Exists as its own client component so the course page can stay a server
 * component — the alternative is marking the whole page "use client" and
 * shipping all of its copy to the browser for the sake of one analytics call.
 *
 * ViewContent is what lets an ad campaign build an audience of people who
 * looked at a specific course but never registered, which is the single most
 * retargetable group on the site.
 */
export default function TrackViewContent({
  slug,
  name,
  category,
}: {
  slug: string;
  name: string;
  category?: string;
}) {
  useEffect(() => {
    trackMeta("ViewContent", {
      content_ids: [slug],
      content_name: name,
      content_type: "product",
      content_category: category,
    });
  }, [slug, name, category]);

  return null;
}
