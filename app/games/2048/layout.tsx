import type { Metadata } from "next";
import { BannerAd } from "../../components/banner-ad";
import { GameGuide } from "../../components/game-guide";
import { JsonLd } from "../../components/json-ld";
import { gameMetadata, gameSchema } from "../../lib/seo";

export const metadata: Metadata = gameMetadata("2048");

export default function Game2048Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={gameSchema("2048")} />{children}<BannerAd placement="game" /><GameGuide game="2048" /></>;
}
