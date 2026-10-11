import type { Metadata } from "next";
import { GameGuide } from "../../components/game-guide";
import { HilltopAdsGate } from "../../components/hilltop-ads-gate";
import { JsonLd } from "../../components/json-ld";
import { gameSchema, gameSeo } from "../../lib/seo";

const game = gameSeo["2048"];

export const metadata: Metadata = {
  title: game.title,
  description: game.description,
  alternates: { canonical: "/games/2048" },
  openGraph: {
    type: "website",
    url: "/games/2048",
    siteName: "SocoPlay",
    title: `${game.title} | SocoPlay`,
    description: game.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SocoPlay — Tiny games. Big breaks." }],
  },
  twitter: { card: "summary_large_image", title: `${game.title} | SocoPlay`, description: game.description, images: ["/og.png"] },
};

export default function Game2048Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={gameSchema("2048")} />{children}<GameGuide game="2048" /><HilltopAdsGate /></>;
}
