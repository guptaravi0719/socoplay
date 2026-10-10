"use client";

import { useEffect, useMemo, useState } from "react";
import { legacyStorageKeys, readStored, removeStored, storageKeys, writeStored } from "./lib/storage";

type GameCard = {
  id: string;
  name: string;
  genre: string;
  time: string;
  icon: string;
  art: string;
  href?: string;
  live?: boolean;
  description: string;
  badge?: string;
};
type Recent = { id: string; name: string; icon: string; href: string; progress: string; tone?: string };

const games: GameCard[] = [
  { id: "solitaire", name: "Solitaire", genre: "Cards", time: "5–20 min", icon: "♠", art: "solitaire", href: "/games/solitaire", live: true, badge: "Classic", description: "A polished Klondike table with touch-friendly moves and a saved deal." },
  { id: "tile-shift", name: "Tile Shift", genre: "Puzzle", time: "2–8 min", icon: "15", art: "tiles", href: "/games/tile-shift", live: true, badge: "Brainy", description: "Slide every number home in a satisfyingly compact puzzle." },
  { id: "flip-pairs", name: "Flip Pairs", genre: "Memory", time: "2–5 min", icon: "✦", art: "pairs", href: "/games/flip-pairs", live: true, badge: "Quick", description: "Find all six pairs before your memory plays tricks on you." },
  { id: "word-bloom", name: "Word Bloom", genre: "Word", time: "3–8 min", icon: "Aa", art: "word", href: "/games/word-bloom", live: true, badge: "Cozy", description: "Unscramble one bright little word at a time." },
  { id: "number-nest", name: "Number Nest", genre: "Puzzle", time: "5–15 min", icon: "2×", art: "numbers", description: "Merge, plan, and build a beautiful number chain." },
  { id: "orbit-dash", name: "Orbit Dash", genre: "Arcade", time: "1–4 min", icon: "◉", art: "orbit", description: "Thread starlight in a fast, looping reflex run." },
  { id: "pyramid-peaks", name: "Pyramid Peaks", genre: "Cards", time: "5–12 min", icon: "△", art: "pyramid", description: "Pair cards and clear a sunlit mountain." },
  { id: "bubble-bloom", name: "Bubble Bloom", genre: "Relax", time: "3–10 min", icon: "●", art: "bubble", description: "Connect colors, grow a garden, exhale." },
  { id: "signal-sweep", name: "Signal Sweep", genre: "Puzzle", time: "5–15 min", icon: "⌁", art: "signal", description: "Follow a tiny grid of clues all the way through." },
  { id: "tiny-checkers", name: "Tiny Checkers", genre: "Strategy", time: "6–20 min", icon: "◐", art: "checkers", description: "Pocket-sized tactics with a classic rhythm." },
  { id: "letter-lantern", name: "Letter Lantern", genre: "Word", time: "2–6 min", icon: "L", art: "lantern", description: "Find a glowing path through a letter maze." },
  { id: "meadow-run", name: "Meadow Run", genre: "Arcade", time: "1–3 min", icon: "↗", art: "meadow", description: "A soft, speedy dash through shifting trails." },
];

const genres = ["All", "Cards", "Puzzle", "Word", "Memory", "Arcade", "Relax", "Strategy"];
const liveGames = games.filter((game) => game.live);

export default function Home() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [recent, setRecent] = useState<Recent[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedRecent = readStored<Recent[]>(storageKeys.recent, legacyStorageKeys.recent);
    const savedFavourites = readStored<string[]>(storageKeys.favourites, legacyStorageKeys.favourites);
    setRecent(Array.isArray(savedRecent) ? savedRecent : []);
    setFavourites(Array.isArray(savedFavourites) ? savedFavourites : []);
    setLoaded(true);
  }, []);

  const visibleGames = useMemo(() => {
    const phrase = query.trim().toLowerCase();
    return games.filter((game) => (genre === "All" || game.genre === genre) && (!phrase || `${game.name} ${game.genre} ${game.description}`.toLowerCase().includes(phrase)));
  }, [genre, query]);
  const favouriteGames = useMemo(() => games.filter((game) => favourites.includes(game.id)), [favourites]);

  const toggleFavourite = (id: string) => {
    const next = favourites.includes(id) ? favourites.filter((item) => item !== id) : [...favourites, id];
    setFavourites(next);
    writeStored(storageKeys.favourites, next);
  };
  const clearHomeShelf = () => {
    removeStored(storageKeys.recent, storageKeys.favourites, legacyStorageKeys.recent, legacyStorageKeys.favourites);
    setRecent([]);
    setFavourites([]);
    setNotice("Your SocoPlay shelf is clear. Game saves stay safely on this device.");
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const surpriseMe = () => {
    const pick = liveGames[Math.floor(Math.random() * liveGames.length)];
    setNotice(`Opening ${pick.name}…`);
    window.setTimeout(() => { window.location.assign(pick.href!); }, 260);
  };

  return <main className="soco-page">
    <header className="soco-header">
      <a className="soco-brand" href="/" aria-label="SocoPlay home"><span className="soco-brand-mark"><i>●</i><i>◆</i></span>SocoPlay</a>
      <nav aria-label="Primary navigation"><a className="is-current" href="/">Home</a><a href="#play-now">Play now</a><a href="#discover">Discover</a><a href="#library">My games</a></nav>
      <label className="soco-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") scrollTo("discover"); }} placeholder="Search games" aria-label="Search games" /></label>
      <button className="soco-library-button" onClick={() => scrollTo("library")} aria-label="Open my games">☻ <span>My games</span></button>
    </header>

    <div className="soco-genre-strip" aria-label="Browse game genres">
      <span className="genre-label">Browse</span>
      {genres.map((item) => <button className={genre === item ? "active" : ""} onClick={() => { setGenre(item); if (item !== "All") scrollTo("discover"); }} key={item}>{item}</button>)}
    </div>

    <section className="soco-hero">
      <div className="soco-hero-copy">
        <p className="soco-kicker"><span>✦</span> MADE FOR LITTLE BREAKS</p>
        <h1>Pick a game.<br /><em>Keep the good part.</em></h1>
        <p>Quick, original browser games with no account, no download, and progress that waits on your device.</p>
        <div className="soco-hero-actions"><button className="soco-primary" onClick={() => scrollTo("play-now")}>Play a game <b>→</b></button><button className="soco-secondary" onClick={surpriseMe}>✦ Surprise me</button></div>
        <div className="soco-trust"><span>4 games live</span><i /> <span>Play in your browser</span><i /> <span>Saves on this device</span></div>
      </div>
      <div className="soco-hero-art" aria-hidden="true">
        <div className="soco-spark spark-one">✦</div><div className="soco-spark spark-two">✦</div><div className="soco-spark spark-three">✦</div>
        <div className="soco-orb orb-purple" /><div className="soco-orb orb-peach" />
        <div className="soco-float-card float-tile"><small>15</small><b>Tile<br />Shift</b></div>
        <div className="soco-float-card float-pairs"><small>✦ ✦</small><b>Flip<br />Pairs</b></div>
        <div className="soco-float-card float-word"><small>Aa</small><b>Word<br />Bloom</b></div>
        <div className="soco-float-card float-card"><small>♠</small><b>Solitaire</b></div>
      </div>
    </section>

    <div className="soco-shell">
      <section className="soco-section" id="play-now">
        <div className="soco-section-head"><div><p>START HERE</p><h2>Play now</h2></div><span>Four complete games, ready when you are.</span></div>
        <div className="soco-live-grid">{liveGames.map((game) => <GameTile game={game} favourite={favourites.includes(game.id)} onFavourite={() => toggleFavourite(game.id)} onSoon={() => undefined} featured key={game.id} />)}</div>
      </section>

      <aside className="soco-ad-reserve" aria-label="Advertisement reserve"><span>ADVERTISEMENT</span><div><b>A quiet place for a future partner.</b><small>Ads stay away from game controls.</small></div></aside>

      <section className="soco-section soco-library" id="library">
        <div className="soco-section-head"><div><p>YOUR DEVICE</p><h2>My games</h2></div>{(recent.length > 0 || favourites.length > 0) && <button className="soco-text-button" onClick={clearHomeShelf}>Clear shelf</button>}</div>
        <div className="soco-library-grid">
          <div className="soco-library-panel"><div className="soco-panel-title"><span>↻</span><div><b>Continue playing</b><small>Your last games, kept here on this device.</small></div></div>{!loaded ? <div className="soco-empty">Loading your saved shelf…</div> : recent.length ? <div className="soco-resume-list">{recent.slice(0, 3).map((item) => <a className={`soco-resume ${item.tone || ""}`} href={item.href} key={item.id}><b>{item.icon}</b><span><strong>{item.name}</strong><small>{item.progress}</small></span><em>Resume →</em></a>)}</div> : <div className="soco-empty">Open any game and it will wait for you here.</div>}</div>
          <div className="soco-library-panel"><div className="soco-panel-title"><span>♥</span><div><b>Favourite shelf</b><small>Save games you want to come back to.</small></div></div>{!loaded ? <div className="soco-empty">Loading favourites…</div> : favouriteGames.length ? <div className="soco-favourite-list">{favouriteGames.slice(0, 4).map((game) => <GameMiniLink game={game} key={game.id} />)}</div> : <div className="soco-empty">Tap the heart on a game to build your own shelf.</div>}</div>
        </div>
      </section>

      <section className="soco-section soco-moods" aria-labelledby="moods-title"><div className="soco-section-head"><div><p>PICK A MOOD</p><h2 id="moods-title">What feels good right now?</h2></div><span>Every path leads to a short, satisfying game.</span></div><div className="soco-mood-grid"><button className="mood-card mood-brain" onClick={() => { setGenre("Puzzle"); scrollTo("discover"); }}><span>⌘</span><b>Work the brain</b><small>Puzzles and clever little wins</small><i>Explore →</i></button><button className="mood-card mood-chill" onClick={() => { setGenre("Cards"); scrollTo("discover"); }}><span>♠</span><b>Settle in</b><small>Cards and familiar classics</small><i>Explore →</i></button><button className="mood-card mood-fast" onClick={() => { setGenre("Memory"); scrollTo("discover"); }}><span>✦</span><b>Go fast</b><small>Quick focus, instant replay</small><i>Explore →</i></button><button className="mood-card mood-word" onClick={() => { setGenre("Word"); scrollTo("discover"); }}><span>Aa</span><b>Find words</b><small>A softer kind of challenge</small><i>Explore →</i></button></div></section>

      <section className="soco-section" id="discover">
        <div className="soco-section-head"><div><p>GAME LIBRARY</p><h2>{query || genre !== "All" ? "Search results" : "Find your next mini game"}</h2></div><span>{visibleGames.filter((game) => game.live).length} playable now · {visibleGames.filter((game) => !game.live).length} in SocoLabs</span></div>
        <div className="soco-filter-row"><span>{query ? `Showing matches for “${query}”` : genre === "All" ? "All games" : `${genre} games`}</span>{(query || genre !== "All") && <button onClick={() => { setQuery(""); setGenre("All"); }}>Reset filters</button>}</div>
        {visibleGames.length ? <div className="soco-game-grid">{visibleGames.map((game) => <GameTile game={game} favourite={favourites.includes(game.id)} onFavourite={() => toggleFavourite(game.id)} onSoon={() => setNotice(`${game.name} is being made in SocoLabs. Favourite it and we’ll keep it on your shelf.`)} key={game.id} />)}</div> : <div className="soco-no-results"><span>⌕</span><b>No games found yet.</b><small>Try a shorter search or clear the filters.</small></div>}
      </section>

      <section className="soco-labs"><div><p>SOCOLABS</p><h2>More tiny adventures are on the way.</h2><span>We only mark a game “Play now” when it is fully ready to enjoy. Until then, tap the heart to keep an idea in your shelf.</span></div><div className="labs-bubbles" aria-hidden="true"><i>△</i><i>◉</i><i>2×</i><i>●</i></div></section>
    </div>

    {notice && <div className="soco-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Close message">×</button></div>}
    <footer className="soco-footer"><div><a className="soco-brand" href="/"><span className="soco-brand-mark"><i>●</i><i>◆</i></span>SocoPlay</a><p>Original browser mini games for little pockets of time.</p></div><div><b>Play your way</b><span>No sign-up. Device-local progress. Mobile-friendly controls.</span></div><div className="soco-footer-links"><a href="#play-now">Play now</a><a href="#discover">Browse games</a><a href="#library">My games</a><button onClick={clearHomeShelf}>Clear home shelf</button></div></footer>
  </main>;
}

function GameTile({ game, favourite, onFavourite, onSoon, featured = false }: { game: GameCard; favourite: boolean; onFavourite: () => void; onSoon: () => void; featured?: boolean }) {
  const inner = <><div className={`soco-game-art ${game.art}`}><span>{game.icon}</span><i>{game.art === "solitaire" ? "♠ ♥" : game.art === "tiles" ? "2 4 8" : game.art === "pairs" ? "✦ ✦" : game.art === "word" ? "A Z" : ""}</i>{game.live && <b>{game.badge || "Play now"}</b>}</div><div className="soco-game-meta"><div><h3>{game.name}</h3><p>{game.genre} · {game.time}</p></div><span className={game.live ? "soco-status live" : "soco-status"}>{game.live ? "Play now" : "Coming soon"}</span></div>{featured && <p className="soco-game-description">{game.description}</p>}</>;
  return <article className={`soco-game-card ${game.live ? "is-live" : "is-lab"} ${featured ? "is-featured" : ""}`}>{game.live ? <a className="soco-game-link" href={game.href}>{inner}</a> : <button className="soco-game-link" type="button" onClick={onSoon}>{inner}</button>}<button className={favourite ? "soco-favourite selected" : "soco-favourite"} type="button" onClick={onFavourite} aria-label={`${favourite ? "Remove" : "Add"} ${game.name} ${favourite ? "from" : "to"} favourites`}>{favourite ? "♥" : "♡"}</button></article>;
}

function GameMiniLink({ game }: { game: GameCard }) {
  if (!game.live) return <div className="soco-mini-game"><b>{game.icon}</b><span><strong>{game.name}</strong><small>Coming soon</small></span></div>;
  return <a className="soco-mini-game" href={game.href}><b>{game.icon}</b><span><strong>{game.name}</strong><small>{game.genre} · {game.time}</small></span><em>→</em></a>;
}
