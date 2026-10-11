import type { Metadata } from "next";
import { BannerAd } from "../../components/banner-ad";
import { GameGuide } from "../../components/game-guide";
import { JsonLd } from "../../components/json-ld";
import { gameMetadata, gameSchema } from "../../lib/seo";
import "./tower.css";

export const metadata: Metadata = gameMetadata("tower");

export default function TowerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={gameSchema("tower")} />{children}<BannerAd placement="game" /><GameGuide game="tower" /></>;
}
