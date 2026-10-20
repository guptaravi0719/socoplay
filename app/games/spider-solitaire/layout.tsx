import type { Metadata } from "next";
import { BannerAd } from "../../components/banner-ad";
import { GameGuide } from "../../components/game-guide";
import { JsonLd } from "../../components/json-ld";
import { gameMetadata, gameSchema } from "../../lib/seo";
import "./spider.css";

export const metadata: Metadata = gameMetadata("spider-solitaire");

export default function SpiderSolitaireLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={gameSchema("spider-solitaire")} />
      {children}
      <BannerAd placement="game" />
      <GameGuide game="spider-solitaire" />
    </>
  );
}
