"use client";

import Link from "next/link";
import { startTransition, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
  { id: "2048", name: "2048", genre: "Puzzle", time: "3–12 min", icon: "2K", art: "2048", href: "/games/2048", live: true, badge: "New", description: "Slide, merge, and chase the 2048 tile in this satisfying number puzzle." },
  { id: "tile-shift", name: "Tile Shift", genre: "Puzzle", time: "2–8 min", icon: "15", art: "tiles", href: "/games/tile-shift", live: true, badge: "Brainy", description: "Slide every number home in a satisfyingly compact puzzle." },
  { id: "flip-pairs", name: "Flip Pairs", genre: "Memory", time: "2–5 min", icon: "✦", art: "pairs", href: "/games/flip-pairs", live: true, badge: "Quick", description: "Find all six pairs before your memory plays tricks on you." },
  { id: "word-bloom", name: "Word Bloom", genre: "Word", time: "3–8 min", icon: "Aa", art: "word", href: "/games/word-bloom", live: true, badge: "Cozy", description: "Unscramble one bright little word at a time." },
  { id: "tap-tap-basketball", name: "Tap Tap Basketball", genre: "Sports", time: "1–3 min", icon: "🏀", art: "basketball", href: "/games/tap-tap-basketball", live: true, badge: "New", description: "Time your taps, sink baskets, build a streak, and beat your best score." },
  { id: "slice-sprint", name: "Slice Sprint", genre: "Arcade", time: "1–3 min", icon: "🍉", art: "slice", href: "/games/slice-sprint", live: true, badge: "Fresh", description: "Swipe through flying fruit, stack combos, and avoid the bombs." },
];

const liveGames = games.filter((game) => game.live);
const railItems = [
  { label: "For you", icon: "✦", genre: "All" },
  { label: "Recently played", icon: "◷", genre: "All", target: "library" },
  { label: "Quick games", icon: "⚡", genre: "All", target: "top-picks" },
  { label: "Card games", icon: "♠", genre: "Cards" },
  { label: "Puzzles", icon: "◆", genre: "Puzzle" },
  { label: "Arcade games", icon: "✂", genre: "Arcade" },
  { label: "Word games", icon: "Aa", genre: "Word" },
  { label: "Memory games", icon: "◌", genre: "Memory" },
];

const coverLabels: Record<string, string> = {
  solitaire: "DEAL / BUILD / WIN",
  "2048": "MERGE / GROW / WIN",
  tiles: "SLIDE INTO PLACE",
  pairs: "FIND THE MATCH",
  word: "LETTERS IN BLOOM",
  basketball: "TIME THE SWISH",
  slice: "SWIPE / SLICE / SCORE",
  numbers: "COUNT THE COMBOS",
  orbit: "KEEP THE ORBIT",
  pyramid: "CLEAR THE PEAK",
  bubble: "MAKE A LITTLE CALM",
  signal: "FOLLOW THE SIGNAL",
  checkers: "THINK AHEAD",
  lantern: "FIND THE PATH",
  meadow: "RUN AHEAD",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [recent, setRecent] = useState<Recent[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRecent = readStored<Recent[]>(storageKeys.recent, legacyStorageKeys.recent);
    const savedFavourites = readStored<string[]>(storageKeys.favourites, legacyStorageKeys.favourites);
    startTransition(() => {
      setRecent(Array.isArray(savedRecent) ? savedRecent : []);
      setFavourites(Array.isArray(savedFavourites) ? savedFavourites : []);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const closeRail = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRailOpen(false);
    };
    window.addEventListener("keydown", closeRail);
    return () => window.removeEventListener("keydown", closeRail);
  }, []);

  useEffect(() => {
    if (!railOpen) return;
    const closeOnOutsideTap = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest("#game-rail, .arcade-rail-toggle")) setRailOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideTap);
    return () => document.removeEventListener("pointerdown", closeOnOutsideTap);
  }, [railOpen]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const visibleGames = useMemo(() => {
    const phrase = query.trim().toLowerCase();
    return games.filter((game) => (genre === "All" || game.genre === genre) && (!phrase || `${game.name} ${game.genre} ${game.description}`.toLowerCase().includes(phrase)));
  }, [genre, query]);

  const recentGames = useMemo(() => recent.map((item) => ({ item, game: games.find((game) => game.id === item.id) })), [recent]);
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
  const chooseGenre = (nextGenre: string, target = "top-picks") => {
    setGenre(nextGenre);
    setRailOpen(false);
    scrollTo(target);
  };
  const surpriseMe = () => {
    const pick = liveGames[Math.floor(Math.random() * liveGames.length)];
    setNotice(`Opening ${pick.name}…`);
    window.setTimeout(() => window.location.assign(pick.href!), 260);
  };

  return (
    <main className="arcade-page">
      <header className="arcade-topbar">
        <div className="arcade-brand-group">
          <button className="arcade-rail-toggle" type="button" onClick={() => setRailOpen((value) => !value)} aria-expanded={railOpen} aria-controls="game-rail" aria-label="Open game categories"><i /><i /><i /></button>
          <Link className="arcade-brand" href="/" onClick={() => setRailOpen(false)} aria-label="SocoPlay home"><span className="arcade-brand-mark"><i>◆</i><b>✦</b></span><span>Soco<span>Play</span></span></Link>
        </div>
        <label className="arcade-search"><span aria-hidden="true">⌕</span><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => { setRailOpen(false); if (query) scrollTo("top-picks"); }} onKeyDown={(event) => { if (event.key === "Enter") scrollTo("top-picks"); }} placeholder="Search SocoPlay games" aria-label="Search games" /><kbd>⌘ K</kbd></label>
        <div className="arcade-top-actions">
          <button type="button" onClick={() => { setRailOpen(false); scrollTo("library"); }} aria-label="Open my saved games"><span>▣</span><b>My games</b></button>
          <button type="button" onClick={() => { setRailOpen(false); surpriseMe(); }} aria-label="Surprise me with a game"><span>⚡</span><b>Surprise</b></button>
        </div>
      </header>

      <div className={`arcade-layout ${railOpen ? "rail-open" : ""}`}>
        {railOpen && <div className="arcade-rail-backdrop" aria-hidden="true" />}
        <aside className="arcade-rail" id="game-rail" aria-label="Game categories">
          <div className="arcade-rail-label">BROWSE</div>
          {railItems.map((item) => <button className={genre === item.genre && !item.target ? "is-active" : ""} type="button" onClick={() => chooseGenre(item.genre, item.target)} key={item.label} data-label={item.label}><span aria-hidden="true">{item.icon}</span><b>{item.label}</b></button>)}
          <div className="arcade-rail-rule" />
          <button type="button" onClick={() => { setQuery(""); setGenre("All"); setRailOpen(false); scrollTo("top-picks"); }} data-label="All games"><span aria-hidden="true">◈</span><b>All games</b></button>
        </aside>

        <div className="arcade-content">
          <section className="arcade-welcome" aria-labelledby="mini-games-title">
            <div><p><span>SOCO</span> / QUICK ARCADE</p><h1 id="mini-games-title">Small games. <em>Big little wins.</em></h1></div>
          </section>

          <section className="arcade-section arcade-continue" id="library" aria-labelledby="continue-title">
            <SectionHeading eyebrow="YOUR DEVICE" title="Continue playing" titleId="continue-title" action={loaded && (recent.length || favouriteGames.length) ? <button type="button" onClick={clearHomeShelf}>Clear shelf</button> : undefined} />
            {!loaded ? <div className="arcade-continue-row" aria-label="Loading your saved games"><div className="arcade-shelf-skeleton" /><div className="arcade-shelf-skeleton" /></div> : recentGames.length ? <div className="arcade-continue-row">{recentGames.slice(0, 4).map(({ item, game }) => <ContinueCard key={item.id} item={item} game={game} />)}</div> : <div className="arcade-first-run"><span className="arcade-first-run-orbit" aria-hidden="true">✦</span><div><b>Your next game will wait here.</b><p>Open a game, take a break, then pick up that exact session from this shelf.</p></div><button type="button" onClick={() => scrollTo("top-picks")}>Choose a game <span>→</span></button></div>}
          </section>

          {loaded && favouriteGames.length > 0 && <section className="arcade-saved-picks" aria-labelledby="saved-picks-title"><div><p>YOUR FAVOURITES</p><h2 id="saved-picks-title">Saved for later</h2></div><div>{favouriteGames.slice(0, 5).map((game) => <SavedPick game={game} onSoon={() => undefined} key={game.id} />)}</div></section>}

          <section className="arcade-section" id="top-picks" aria-labelledby="top-picks-title">
            <SectionHeading eyebrow={query || genre !== "All" ? "FILTERED GAMES" : "PLAY NOW"} title={query || genre !== "All" ? "Games for you" : "Top picks for your break"} titleId="top-picks-title" copy={query ? `Showing matches for “${query}”.` : genre !== "All" ? `${genre} games, ready when you are.` : "A growing set of complete games, each made for a satisfying few minutes."} action={query || genre !== "All" ? <button type="button" onClick={() => { setQuery(""); setGenre("All"); }}>Reset filters</button> : <button type="button" onClick={surpriseMe}>Surprise me <span>✦</span></button>} />
            {visibleGames.length ? <div className="arcade-mosaic">{visibleGames.map((game, index) => <ArcadeGameCard game={game} favourite={favourites.includes(game.id)} onFavourite={() => toggleFavourite(game.id)} onSoon={() => undefined} variant={index === 0 ? "lead" : index === 3 ? "wide" : "small"} key={game.id} />)}</div> : <div className="arcade-empty"><span>⌕</span><b>No games match that search yet.</b><p>Try another word or reset the filters.</p></div>}
          </section>

          <section className="arcade-seo-card" aria-labelledby="free-mini-games-title"><div><p>FREE ONLINE MINI GAMES</p><h2 id="free-mini-games-title">A tiny arcade for your in-between moments.</h2></div><div><p>SocoPlay is a growing collection of original browser games. Play cards, puzzles, memory, and word games without a download or account, then come back to the same device to continue where you stopped.</p><div className="arcade-seo-points"><span>Made for mobile</span><span>Saved locally</span><span>Always free to play</span></div></div></section>

        </div>
      </div>

      {notice && <div className="arcade-toast" role="status"><span>✦</span>{notice}<button type="button" onClick={() => setNotice("")} aria-label="Close message">×</button></div>}
      <footer className="arcade-footer"><Link className="arcade-brand" href="/"><span className="arcade-brand-mark"><i>◆</i><b>✦</b></span><span>Soco<span>Play</span></span></Link><p>Original browser mini games for little pockets of time.</p><div><button type="button" onClick={() => scrollTo("top-picks")}>Play now</button><button type="button" onClick={() => scrollTo("top-picks")}>Browse games</button><button type="button" onClick={() => scrollTo("library")}>My games</button></div></footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, titleId, copy, action }: { eyebrow: string; title: string; titleId?: string; copy?: string; action?: ReactNode }) {
  return <div className="arcade-section-head"><div><p>{eyebrow}</p><h2 id={titleId}>{title}</h2>{copy && <span>{copy}</span>}</div>{action && <div className="arcade-section-action">{action}</div>}</div>;
}

function ContinueCard({ item, game }: { item: Recent; game?: GameCard }) {
  return <button className="arcade-continue-card" type="button" onClick={() => window.location.assign(item.href)} aria-label={`Resume ${item.name}`}><div className={`arcade-continue-art cover-${game?.art || "orbit"}`} aria-hidden="true"><span>{game?.icon || item.icon}</span><i>{game ? coverLabels[game.art] : "BACK TO PLAY"}</i></div><div><b>{item.name}</b><span>{item.progress}</span></div><em>Resume <i>→</i></em></button>;
}

function SavedPick({ game, onSoon }: { game: GameCard; onSoon: () => void }) {
  const content = <><span className={`arcade-saved-pick-art cover-${game.art}`} aria-hidden="true">{game.icon}</span><b>{game.name}</b><i>{game.live ? "Play →" : "SocoLabs"}</i></>;
  return game.live ? <Link className="arcade-saved-pick" href={game.href!} onClick={(event) => { event.preventDefault(); window.location.assign(game.href!); }}>{content}</Link> : <button className="arcade-saved-pick" type="button" onClick={onSoon}>{content}</button>;
}

function ArcadeGameCard({ game, favourite, onFavourite, onSoon, variant = "grid" }: { game: GameCard; favourite: boolean; onFavourite: () => void; onSoon: () => void; variant?: "lead" | "small" | "wide" | "grid" }) {
  const cardContent = <><div className={`arcade-cover cover-${game.art}`} aria-hidden="true"><div className="arcade-cover-noise" /><span className="arcade-cover-icon">{game.icon}</span><i>{coverLabels[game.art]}</i><b>{game.live ? game.badge || "Play now" : "SocoLabs"}</b></div><div className="arcade-card-copy"><div><h3>{game.name}</h3><p>{game.genre} <span>·</span> {game.time}</p></div><em aria-hidden="true">→</em></div></>;
  return <article className={`arcade-game-card arcade-game-card--${variant} ${game.live ? "is-live" : "is-lab"}`}>{game.live ? <Link className="arcade-game-link" href={game.href!} onClick={(event) => { event.preventDefault(); window.location.assign(game.href!); }} aria-label={`Play ${game.name}`}>{cardContent}</Link> : <button className="arcade-game-link" type="button" onClick={onSoon} aria-label={`Learn about upcoming game ${game.name}`}>{cardContent}</button>}<button className={favourite ? "arcade-favourite is-saved" : "arcade-favourite"} type="button" onClick={(event) => { event.stopPropagation(); onFavourite(); }} aria-label={`${favourite ? "Remove" : "Add"} ${game.name} ${favourite ? "from" : "to"} favourites`}>{favourite ? "♥" : "♡"}</button></article>;
}
