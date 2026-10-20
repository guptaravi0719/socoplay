import type { Metadata } from "next";
import { BannerAd } from "../../components/banner-ad";
import { GameGuide } from "../../components/game-guide";
import { JsonLd } from "../../components/json-ld";
import { gameMetadata, gameSchema } from "../../lib/seo";
import "./neon-dash.css";

export const metadata: Metadata = gameMetadata("neon-dash");

export default function NeonDashLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={gameSchema("neon-dash")} />
      {children}
      <BannerAd placement="game" />
      <GameGuide game="neon-dash" />
    </>
  );
}
