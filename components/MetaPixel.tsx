"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackMeta } from "@/lib/meta-pixel";

/**
 * Meta (Facebook) Pixel.
 *
 * Mounted from app/(public)/layout.tsx so it only ever fires on the marketing
 * side of the site. Admin, teacher and parent-portal sessions are deliberately
 * excluded: staff traffic in the dataset skews ad optimisation and poisons any
 * lookalike audience built off it.
 *
 * Loaded with `afterInteractive` rather than pasted into <head>. `beforeInteractive`
 * is only honoured in the ROOT layout, and putting it there would mean tracking
 * every logged-in page too — the wrong trade for a few hundred milliseconds on a
 * tracking tag.
 */

// Override per-environment with NEXT_PUBLIC_META_PIXEL_ID; falls back to the live
// Immersia pixel. Pixel IDs are public by design (they ship in the page source),
// so keeping the real one as the default just means the tag survives a deploy
// where the env var was never set.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1678499276571961";

export default function MetaPixel() {
  const pathname = usePathname();
  // The base snippet already fires one PageView on load. Skipping the first run
  // of this effect stops the landing page being counted twice.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // App Router navigations never reload the document, so each client-side route
    // change needs its own PageView. trackMeta no-ops when fbq is missing, which
    // ad blockers make common enough to matter.
    trackMeta("PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" />`,
        }}
      />
    </>
  );
}
