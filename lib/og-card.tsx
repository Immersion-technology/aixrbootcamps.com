import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TITLE } from "@/lib/site";

// Shared definition of the branded 1200×630 social-share card, reused by both
// app/opengraph-image.tsx and app/twitter-image.tsx. The route files must each
// declare their own `runtime`/`size`/`contentType` as string literals (Next
// can't follow re-exported config), so only the render lives here.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = `${SITE_TITLE} · ${SITE_NAME}`;
export const OG_CONTENT_TYPE = "image/png";

export function renderOgCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0b0f1f 0%, #14123a 45%, #1b0f2e 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* top row: wordmark + eyebrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "0.18em", color: "#22d3ee" }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(255,255,255,0.6)" }}>
            LAGOS · 2026
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em", maxWidth: 980 }}>
            AI &amp; XR Summer Tech Bootcamp
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>
            Kids 10–17 ship an AI app &amp; build a VR world. In-person in Lagos or live online.
          </div>
        </div>

        {/* bottom row: dates pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 28px",
              borderRadius: 999,
              background: "#22d3ee",
              color: "#0b0f1f",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            27 July – 4 September 2026
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            Three 2-week cohorts
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
