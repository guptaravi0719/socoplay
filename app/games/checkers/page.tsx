import type { Metadata } from "next";
import { ClassicGamePage } from "../../components/classic-game-page";

export const metadata: Metadata = { title: "Play Checkers Online", description: "Play American checkers against an AI opponent on SocoPlay." };
export default function CheckersPage() { return <ClassicGamePage game={{ slug: "checkers", name: "Checkers", eyebrow: "STRATEGY BOARD GAME", description: "Plan captures, crown kings, and take on the computer." }} />; }
