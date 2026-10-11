import Link from "next/link";
import { BannerAd } from "./banner-ad";

type ClassicGame = {
  name: string;
  eyebrow: string;
  description: string;
  slug: string;
};

export function ClassicGamePage({ game }: { game: ClassicGame }) {
  return (
    <main className="classic-game-page">
      <header className="classic-game-nav">
        <Link className="classic-game-brand" href="/"><span>◆</span> SocoPlay</Link>
        <Link className="classic-game-back" href="/">← All games</Link>
      </header>
      <section className="classic-game-stage">
        <h1 className="sr-only">Play {game.name} online</h1>
        <div className="classic-game-frame-wrap">
          <iframe className="classic-game-frame" src={`/arcade-classics/${game.slug}/index.html`} title={`${game.name} game`} allow="autoplay" />
        </div>
        <BannerAd placement="game" />
      </section>
    </main>
  );
}
