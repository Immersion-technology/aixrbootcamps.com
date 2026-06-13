import { ImageResponse } from "next/og";

// Square Apple touch icon (180×180), branded monogram on the IMMERSIA palette.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b0f1f 0%, #14123a 45%, #1b0f2e 100%)",
          color: "#22d3ee",
          fontSize: 104,
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
