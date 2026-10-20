import type { Metadata } from "next";
import { BannerAd } from "../../components/banner-ad";
import { GameGuide } from "../../components/game-guide";
import { JsonLd } from "../../components/json-ld";
import { gameMetadata, gameSchema } from "../../lib/seo";
import "./pool.css";

export const metadata: Metadata = gameMetadata("8-ball-pool");

export default function EightBallPoolLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={gameSchema("8-ball-pool")} />
      {children}
      <BannerAd placement="game" />
      <GameGuide game="8-ball-pool" />
    </>
  );
}
