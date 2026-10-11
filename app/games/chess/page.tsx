import { ClassicGamePage } from "../../components/classic-game-page";
import { gameMetadata } from "../../lib/seo";

export const metadata = gameMetadata("chess");
export default function ChessPage() { return <ClassicGamePage game={{ slug: "chess", name: "Chess", eyebrow: "CLASSIC BOARD GAME", description: "Choose a mode, plan your moves, and play on a full-size board." }} />; }
