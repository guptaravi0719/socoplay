import Link from "next/link";
import type { GameSlug } from "../lib/seo";

type Guide = {
  eyebrow: string;
  heading: string;
  description: string;
  steps: string[];
  tip: string;
};

const guides: Record<GameSlug, Guide> = {
  solitaire: {
    eyebrow: "CLASSIC CARD GAME",
    heading: "Classic Klondike Solitaire, ready when you are",
    description: "Play a free game of Klondike Solitaire with smooth touch controls, helpful hints, and classic Turn 1 or Turn 3 play.",
    steps: [
      "Build each foundation pile from Ace through King in the matching suit.",
      "Build tableau piles downward in alternating red and black colors.",
      "Use Kings to fill empty tableau columns, then uncover more cards.",
    ],
    tip: "On a phone, tap a card and then its destination. On desktop, you can drag cards too. Choose Turn 1 or Turn 3 before drawing from the stock.",
  },
  "2048": {
    eyebrow: "NUMBER PUZZLE",
    heading: "Build your biggest tile, one smart slide at a time",
    description: "2048 is a free online number puzzle. Combine matching tiles, make room for your next move, and aim for the 2048 tile.",
    steps: [
      "Swipe the board, or use your arrow keys, to move every tile in one direction.",
      "When two tiles with the same number collide, they merge into one larger tile.",
      "Keep combining tiles and try to create the 2048 tile without filling the board.",
    ],
    tip: "Keep your highest tile tucked into a corner and build the neighboring values toward it. Use Undo when you want to rethink the previous move.",
  },
};

const relatedGames: Record<GameSlug, { href: string; name: string }[]> = {
  solitaire: [{ href: "/games/2048", name: "2048" }],
  "2048": [{ href: "/games/solitaire", name: "Solitaire" }],
};

export function GameGuide({ game }: { game: GameSlug }) {
  const guide = guides[game];

  return (
    <section className={`game-guide game-guide--${game}`} aria-labelledby={`${game}-guide-title`}>
      <div className="game-guide-intro">
        <p>{guide.eyebrow}</p>
        <h2 id={`${game}-guide-title`}>{guide.heading}</h2>
        <span>{guide.description}</span>
      </div>
      <div className="game-guide-grid">
        <section>
          <h3>How to play</h3>
          <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>
        <section>
          <h3>Good to know</h3>
          <p>{guide.tip}</p>
        </section>
      </div>
      <nav className="game-guide-links" aria-label="More SocoPlay games">
        <span>Try another quick game</span>
        {relatedGames[game].map((item) => <Link href={item.href} key={item.href}>{item.name} <b>→</b></Link>)}
        <Link href="/">All games <b>→</b></Link>
      </nav>
    </section>
  );
}
