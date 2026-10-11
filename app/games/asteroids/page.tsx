import { ClassicGamePage } from "../../components/classic-game-page";
import { gameMetadata } from "../../lib/seo";

export const metadata = gameMetadata("asteroids");
export default function AsteroidsPage() { return <ClassicGamePage game={{ slug: "asteroids", name: "Asteroids", eyebrow: "ARCADE FLIGHT", description: "Rotate, thrust, and clear every wave in a large arcade playfield." }} />; }
