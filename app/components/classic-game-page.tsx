import { BannerAd } from "./banner-ad";
import { JsonLd } from "./json-ld";
import { gameSchema, type GameSlug } from "../lib/seo";

type ClassicGame = {
  name: string;
  eyebrow: string;
  description: string;
  slug: Exclude<GameSlug, "solitaire" | "2048" | "tower">;
};

export function ClassicGamePage({ game }: { game: ClassicGame }) {
  return (
    <main className="classic-game-page">
      <JsonLd data={gameSchema(game.slug)} />
      <header className="classic-game-nav">
        <a className="game-exit" href="/"><span aria-hidden="true">🚪</span> Exit game</a>
      </header>
      <section className="classic-game-stage">
        <h1 className="sr-only">Play {game.name} online</h1>
        <div className="classic-game-frame-wrap">
          <iframe className="classic-game-frame" src={`/arcade-classics/${game.slug}/index.html`} title={`${game.name} game`} allow="autoplay; fullscreen" allowFullScreen />
        </div>
        <BannerAd placement="game" />
      </section>
    </main>
  );
}
