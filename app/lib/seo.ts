export const siteUrl = "https://socoplay.com";

export type GameSlug = "solitaire" | "2048";

type GameSeo = {
  slug: GameSlug;
  name: string;
  title: string;
  description: string;
  category: string;
  genre: string;
};

export const gameSeo: Record<GameSlug, GameSeo> = {
  solitaire: {
    slug: "solitaire",
    name: "Solitaire",
    title: "Play Solitaire Online",
    description: "Play free classic Klondike Solitaire online with touch-friendly cards, Turn 1 or Turn 3 play, hints, and undo.",
    category: "Card game",
    genre: "Card",
  },
  "2048": {
    slug: "2048",
    name: "2048",
    title: "Play 2048 Online",
    description: "Play 2048 online for free. Slide and merge number tiles, chase 2048, and build your highest score.",
    category: "Puzzle game",
    genre: "Puzzle",
  },
};

export const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "SocoPlay",
      url: siteUrl,
      description: "Original free online mini games for quick breaks.",
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "SocoPlay",
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
    },
  ],
};

export function gameUrl(slug: GameSlug) {
  return `${siteUrl}/games/${slug}`;
}

export function gameSchema(slug: GameSlug) {
  const game = gameSeo[slug];
  const url = gameUrl(slug);

  return [
    {
      "@context": "https://schema.org",
      "@type": ["VideoGame", "WebApplication"],
      name: game.name,
      description: game.description,
      url,
      applicationCategory: "GameApplication",
      applicationSubCategory: game.category,
      genre: game.genre,
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "SocoPlay",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: game.name,
          item: url,
        },
      ],
    },
  ];
}
