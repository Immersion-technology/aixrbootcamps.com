"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer,
        utmSource: searchParams.get("utm_source") ?? "",
        utmMedium: searchParams.get("utm_medium") ?? "",
        utmCampaign: searchParams.get("utm_campaign") ?? "",
      }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
