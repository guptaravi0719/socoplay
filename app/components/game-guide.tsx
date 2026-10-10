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
    heading: "Classic Klondike Solitaire, ready whenever you are",
    description:
      "Play a free game of Klondike Solitaire in your browser. There is no account or download, and SocoPlay keeps your current table on this device.",
    steps: [
      "Build each foundation pile from Ace through King in the matching suit.",
      "Build tableau piles downward in alternating red and black colors.",
      "Use Kings to fill empty tableau columns, then uncover more cards.",
    ],
    tip: "On a phone, tap a card and then its destination. On desktop, you can drag cards too. Choose Turn 1 or Turn 3 before drawing from the stock.",
  },
  "tile-shift": {
    eyebrow: "SLIDING PUZZLE",
    heading: "A quick sliding-number puzzle you can come back to",
    description:
      "Tile Shift is a free online number puzzle. Move one tile at a time into the open square and leave the board whenever you need; it stays on this device.",
    steps: [
      "Tap a numbered tile beside the empty square to move it.",
      "Arrange the numbers in order from 1 to 15, reading left to right.",
      "Finish with the empty square in the lower-right corner.",
    ],
    tip: "Work in small sections instead of chasing one tile across the board. A solved row gives you more room to plan the next move.",
  },
  "flip-pairs": {
    eyebrow: "MEMORY GAME",
    heading: "Test your memory in a quick matching game",
    description:
      "Flip Pairs is a free online memory game with six pairs to find. Take a break at any time and return to the same round on this device.",
    steps: [
      "Turn over two cards to reveal their symbols.",
      "Matching symbols stay face up; non-matches turn back over.",
      "Find all six pairs in as few tries as you can.",
    ],
    tip: "Make a mental note of each symbol and its position. Looking for the match on your next turn is usually faster than opening two new cards.",
  },
  "word-bloom": {
    eyebrow: "WORD PUZZLE",
    heading: "Unscramble a bright little word at your own pace",
    description:
      "Word Bloom is a free online word scramble game. Rearrange the letters, check your answer, and pick up your current word on the same device later.",
    steps: [
      "Look at the mixed-up letters and think of possible word shapes.",
      "Type your answer, then choose Check word.",
      "Solve the word and choose New word whenever you are ready.",
    ],
    tip: "Start with familiar letter pairs or endings. If a word feels stuck, say the letters quietly and try a fresh arrangement.",
  },
};

const relatedGames: Record<GameSlug, { href: string; name: string }[]> = {
  solitaire: [
    { href: "/games/tile-shift", name: "Tile Shift" },
    { href: "/games/flip-pairs", name: "Flip Pairs" },
  ],
  "tile-shift": [
    { href: "/games/solitaire", name: "Solitaire" },
    { href: "/games/word-bloom", name: "Word Bloom" },
  ],
  "flip-pairs": [
    { href: "/games/solitaire", name: "Solitaire" },
    { href: "/games/word-bloom", name: "Word Bloom" },
  ],
  "word-bloom": [
    { href: "/games/tile-shift", name: "Tile Shift" },
    { href: "/games/flip-pairs", name: "Flip Pairs" },
  ],
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
          <p className="game-guide-save">Your progress is saved only in this browser on this device.</p>
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
