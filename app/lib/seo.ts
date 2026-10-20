import type { Metadata } from "next";

export const siteUrl = "https://socoplay.com";

export type GameSlug = "solitaire" | "spider-solitaire" | "8-ball-pool" | "2048" | "tower" | "chess" | "asteroids" | "pacman" | "sudoku" | "checkers";

export type GameSeo = {
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
  "spider-solitaire": {
    slug: "spider-solitaire",
    name: "Spider Solitaire",
    title: "Play Spider Solitaire Online",
    description: "Play free Spider Solitaire online with 1, 2, or 4 suits, ten columns, hints, undo, and autosave.",
    category: "Card game",
    genre: "Card",
  },
  "8-ball-pool": {
    slug: "8-ball-pool",
    name: "8-Ball Pool",
    title: "Play 8-Ball Pool Online",
    description: "Play free 8-ball pool online with realistic table physics, full rules, ball-in-hand, and an AI opponent.",
    category: "Sports game",
    genre: "Pool",
  },
  "2048": {
    slug: "2048",
    name: "2048",
    title: "Play 2048 Online",
    description: "Play 2048 online for free. Slide and merge number tiles, chase 2048, and build your highest score.",
    category: "Puzzle game",
    genre: "Puzzle",
  },
  tower: {
    slug: "tower",
    name: "Tower Stack",
    title: "Play Tower Stack Online",
    description: "Play Tower Stack online for free. Time each drop, stack the blocks neatly, and build your tallest tower.",
    category: "Arcade stacking game",
    genre: "Arcade",
  },
  chess: {
    slug: "chess",
    name: "Chess",
    title: "Play Chess Online",
    description: "Play free chess online on a large, touch-friendly board. Choose a mode, plan your moves, and checkmate your opponent.",
    category: "Board game",
    genre: "Strategy",
  },
  asteroids: {
    slug: "asteroids",
    name: "Asteroids",
    title: "Play Asteroids Online",
    description: "Play Asteroids online for free. Pilot your ship through asteroid waves and clear the arcade playfield.",
    category: "Arcade game",
    genre: "Arcade",
  },
  pacman: {
    slug: "pacman",
    name: "Pac-Man",
    title: "Play Pac-Man Online",
    description: "Play Pac-Man online for free. Guide Pac-Man through the maze, collect pellets, and dodge the ghosts.",
    category: "Maze game",
    genre: "Arcade",
  },
  sudoku: {
    slug: "sudoku",
    name: "Sudoku",
    title: "Play Sudoku Online",
    description: "Solve free online Sudoku puzzles on a clean, touch-friendly grid. Choose a difficulty and test your logic.",
    category: "Puzzle game",
    genre: "Puzzle",
  },
  checkers: {
    slug: "checkers",
    name: "Checkers",
    title: "Play Checkers Online",
    description: "Play American checkers online against the computer. Plan captures, crown kings, and win the board.",
    category: "Board game",
    genre: "Strategy",
  },
};

export const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "SocoPlay",
      alternateName: "SocoPlay Games",
      url: siteUrl,
      description: "Original free online mini games, including Solitaire, Spider Solitaire, 8-Ball Pool, 2048, and Tower Stack.",
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

export function gameMetadata(slug: GameSlug): Metadata {
  const game = gameSeo[slug];
  const url = `/games/${slug}`;
  const socialTitle = `${game.title} | SocoPlay`;

  return {
    title: game.title,
    description: game.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: "SocoPlay",
      title: socialTitle,
      description: game.description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${game.name} at SocoPlay` }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: game.description,
      images: ["/og.png"],
    },
  };
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
      image: `${siteUrl}/og.png`,
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
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
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
