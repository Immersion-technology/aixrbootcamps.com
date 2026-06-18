import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TITLE, SITE_DESC } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_TITLE} · ${SITE_NAME}`,
    short_name: SITE_NAME,
    description: SITE_DESC,
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7ef",
    theme_color: "#0b0f1f",
    icons: [
      { src: "/logo.png", sizes: "668x668", type: "image/png" },
      { src: "/imm.png", sizes: "any", type: "image/png" },
    ],
  };
}
