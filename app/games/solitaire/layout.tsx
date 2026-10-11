import type { Metadata } from "next";
import { BannerAd } from "../../components/banner-ad";
import { GameGuide } from "../../components/game-guide";
import { JsonLd } from "../../components/json-ld";
import { gameSchema, gameSeo, type GameSlug } from "../../lib/seo";

const slug: GameSlug = "solitaire";
const game = gameSeo[slug];

export const metadata: Metadata = {
  title: game.title,
  description: game.description,
  alternates: { canonical: `/games/${slug}` },
  openGraph: {
    type: "website",
    url: `/games/${slug}`,
    siteName: "SocoPlay",
    title: `${game.title} | SocoPlay`,
    description: game.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SocoPlay — Tiny games. Big breaks." }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${game.title} | SocoPlay`,
    description: game.description,
    images: ["/og.png"],
  },
};

export default function SolitaireLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={gameSchema(slug)} />{children}<BannerAd placement="game" /><GameGuide game={slug} /></>;
}
