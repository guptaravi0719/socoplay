import type { MetadataRoute } from "next";
import { gameSeo, siteUrl } from "./lib/seo";

const lastUpdated = new Date("2026-10-11T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 1,
    },
    ...Object.values(gameSeo).map((game) => ({
      url: `${siteUrl}/games/${game.slug}`,
      lastModified: lastUpdated,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
