import type { Metadata } from "next";
import { BannerAd } from "../../components/banner-ad";
import { GameGuide } from "../../components/game-guide";
import { JsonLd } from "../../components/json-ld";
import { gameMetadata, gameSchema, type GameSlug } from "../../lib/seo";

const slug: GameSlug = "solitaire";
export const metadata: Metadata = gameMetadata(slug);

export default function SolitaireLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><JsonLd data={gameSchema(slug)} />{children}<BannerAd placement="game" /><GameGuide game={slug} /></>;
}
