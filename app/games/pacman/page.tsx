import type { Metadata } from "next";
import { ClassicGamePage } from "../../components/classic-game-page";

export const metadata: Metadata = { title: "Play Pac-Man Online", description: "Guide Pac-Man through the maze and chase a high score on SocoPlay." };
export default function PacmanPage() { return <ClassicGamePage game={{ slug: "pacman", name: "Pac-Man", eyebrow: "NEON MAZE", description: "Collect pellets, dodge ghosts, and enjoy a bright arcade soundtrack." }} />; }
