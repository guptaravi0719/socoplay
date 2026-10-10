import type { MetadataRoute } from "next";
import { gameSeo, siteUrl } from "./lib/seo";

const lastUpdated = new Date("2026-10-10T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...Object.values(gameSeo).map((game) => ({
      url: `${siteUrl}/games/${game.slug}`,
      lastModified: lastUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
