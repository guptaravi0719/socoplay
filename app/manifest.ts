import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SocoPlay — Free Online Mini Games",
    short_name: "SocoPlay",
    description: "Original free online mini games including Solitaire, Spider Solitaire, 2048, and Tower Stack.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#5541c3",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
