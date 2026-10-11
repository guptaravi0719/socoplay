import type { Metadata } from "next";
import { ClassicGamePage } from "../../components/classic-game-page";

export const metadata: Metadata = { title: "Play Chess Online", description: "Play a large, touch-friendly game of chess online on SocoPlay." };
export default function ChessPage() { return <ClassicGamePage game={{ slug: "chess", name: "Chess", eyebrow: "CLASSIC BOARD GAME", description: "Choose a mode, plan your moves, and play on a full-size board." }} />; }
