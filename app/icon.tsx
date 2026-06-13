import { ImageResponse } from "next/og";

// Square brand favicon (the source logo is a wide wordmark, so we generate a
// crisp square monogram instead of letterboxing it).
export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #14123a 0%, #1b0f2e 100%)",
          color: "#22d3ee",
          fontSize: 38,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        IM
      </div>
    ),
    size
  );
}
