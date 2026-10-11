import type { Metadata } from "next";
import { GameGuide } from "../../components/game-guide";
import { HilltopBanner } from "../../components/hilltop-banner";
import { JsonLd } from "../../components/json-ld";
import { gameSchema, gameSeo } from "../../lib/seo";
import "./tower.css";

const game = gameSeo.tower;

export const metadata: Metadata = {
  title: game.title,
  description: game.description,
  alternates: { canonical: "/games/tower" },
  openGraph: { type: "website", url: "/games/tower", siteName: "SocoPlay", title: `${game.title} | SocoPlay`, description: game.description, images: [{ url: "/og.png", width: 1200, height: 630, alt: "SocoPlay — Tiny games. Big breaks." }] },
  twitter: { card: "summary_large_image", title: `${game.title} | SocoPlay`, description: game.description, images: ["/og.png"] },
};

export default function TowerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={gameSchema("tower")} />{children}<HilltopBanner placement="game" /><GameGuide game="tower" /></>;
}
