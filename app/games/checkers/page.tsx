import { ClassicGamePage } from "../../components/classic-game-page";
import { gameMetadata } from "../../lib/seo";

export const metadata = gameMetadata("checkers");
export default function CheckersPage() { return <ClassicGamePage game={{ slug: "checkers", name: "Checkers", eyebrow: "STRATEGY BOARD GAME", description: "Plan captures, crown kings, and take on the computer." }} />; }
