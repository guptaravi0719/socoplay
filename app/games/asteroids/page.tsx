import type { Metadata } from "next";
import { ClassicGamePage } from "../../components/classic-game-page";

export const metadata: Metadata = { title: "Play Asteroids Online", description: "Pilot through waves of asteroids in this free online arcade game." };
export default function AsteroidsPage() { return <ClassicGamePage game={{ slug: "asteroids", name: "Asteroids", eyebrow: "ARCADE FLIGHT", description: "Rotate, thrust, and clear every wave in a large arcade playfield." }} />; }
