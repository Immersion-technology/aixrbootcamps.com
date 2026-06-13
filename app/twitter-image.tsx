import { renderOgCard, OG_SIZE, OG_ALT, OG_CONTENT_TYPE } from "@/lib/og-card";

// Twitter shares reuse the same branded card as OpenGraph. Config must be
// declared here as string literals — Next can't follow re-exported config.
export const runtime = "edge";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return renderOgCard();
}
