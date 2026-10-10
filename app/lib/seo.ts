export const siteUrl = "https://socoplay.com";

export type GameSlug = "solitaire" | "2048" | "tile-shift" | "flip-pairs" | "word-bloom";

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
    description: "Play free classic Klondike Solitaire online with touch-friendly cards, Turn 1 or Turn 3 play, hints, undo, and device-local saves.",
    category: "Card game",
    genre: "Card",
  },
  "2048": {
    slug: "2048",
    name: "2048",
    title: "Play 2048 Online",
    description: "Play 2048 online for free. Slide and merge number tiles, chase 2048, and continue your saved game on the same device.",
    category: "Puzzle game",
    genre: "Puzzle",
  },
  "tile-shift": {
    slug: "tile-shift",
    name: "Tile Shift",
    title: "Play Tile Shift Online",
    description: "Play Tile Shift, a free online number sliding puzzle. Move tiles into order and pick up your saved board on the same device.",
    category: "Puzzle game",
    genre: "Puzzle",
  },
  "flip-pairs": {
    slug: "flip-pairs",
    name: "Flip Pairs",
    title: "Play Flip Pairs Online",
    description: "Play Flip Pairs, a free online memory matching game. Find every pair, track your tries, and continue later on the same device.",
    category: "Memory game",
    genre: "Memory",
  },
  "word-bloom": {
    slug: "word-bloom",
    name: "Word Bloom",
    title: "Play Word Bloom Online",
    description: "Play Word Bloom, a free online word unscramble game. Rearrange the letters, solve the word, and save your progress locally.",
    category: "Word game",
    genre: "Word",
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
      description: "Original free online mini games for quick browser breaks.",
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
      browserRequirements: "Requires a modern web browser.",
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
