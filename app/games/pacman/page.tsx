import { ClassicGamePage } from "../../components/classic-game-page";
import { gameMetadata } from "../../lib/seo";

export const metadata = gameMetadata("pacman");
export default function PacmanPage() { return <ClassicGamePage game={{ slug: "pacman", name: "Pac-Man", eyebrow: "NEON MAZE", description: "Collect pellets, dodge ghosts, and enjoy a bright arcade soundtrack." }} />; }
