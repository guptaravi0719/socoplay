"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

type GameCard = {
  id: string;
  name: string;
  genre: string;
  time: string;
  icon: string;
  art: string;
  href: string;
  badge: string;
  description: string;
};

const games: GameCard[] = [
  { id: "solitaire", name: "Solitaire", genre: "Cards", time: "5–20 min", icon: "♠", art: "solitaire", href: "/games/solitaire", badge: "Classic", description: "A polished Klondike table with touch-friendly moves and helpful controls." },
  { id: "2048", name: "2048", genre: "Puzzle", time: "3–12 min", icon: "2K", art: "2048", href: "/games/2048", badge: "Puzzle", description: "Slide, merge, and chase the 2048 tile in this satisfying number puzzle." },
  { id: "tower", name: "Tower Stack", genre: "Arcade", time: "2–6 min", icon: "▥", art: "tower", href: "/games/tower", badge: "Stack", description: "Time each drop, line up the blocks, and build your tallest tower." },
];

const railItems = [
  { label: "For you", icon: "✦", genre: "All" },
  { label: "Quick games", icon: "⚡", genre: "All", target: "top-picks" },
  { label: "Card games", icon: "♠", genre: "Cards" },
  { label: "Puzzles", icon: "◆", genre: "Puzzle" },
  { label: "Arcade games", icon: "▥", genre: "Arcade" },
];

const coverLabels: Record<string, string> = {
  solitaire: "DEAL / BUILD / WIN",
  "2048": "MERGE / GROW / WIN",
  tower: "DROP / STACK / RISE",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [notice, setNotice] = useState("");
  const [railOpen, setRailOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const chooseGenre = (nextGenre: string, target = "top-picks") => {
    setGenre(nextGenre);
    setRailOpen(false);
    scrollTo(target);
  };
  const surpriseMe = () => {
    const pick = games[Math.floor(Math.random() * games.length)];
    setNotice(`Opening ${pick.name}…`);
    window.setTimeout(() => window.location.assign(pick.href), 260);
  };

  return (
    <main className="arcade-page">
      <header className="arcade-topbar">
        <div className="arcade-brand-group">
          <button className="arcade-rail-toggle" type="button" onClick={() => setRailOpen((value) => !value)} aria-expanded={railOpen} aria-controls="game-rail" aria-label="Open game categories"><i /><i /><i /></button>
          <Link className="arcade-brand" href="/" onClick={() => setRailOpen(false)} aria-label="SocoPlay home"><span className="arcade-brand-mark"><i>◆</i><b>✦</b></span><span>Soco<span>Play</span></span></Link>
        </div>
        <label className="arcade-search"><span aria-hidden="true">⌕</span><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => { setRailOpen(false); if (query) scrollTo("top-picks"); }} onKeyDown={(event) => { if (event.key === "Enter") scrollTo("top-picks"); }} placeholder="Search SocoPlay games" aria-label="Search games" /><kbd>⌘ K</kbd></label>
        <div className="arcade-top-actions"><button type="button" onClick={() => { setRailOpen(false); surpriseMe(); }} aria-label="Surprise me with a game"><span>⚡</span><b>Surprise</b></button></div>
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
          <section className="arcade-welcome" aria-labelledby="mini-games-title"><div><p><span>SOCO</span> / QUICK ARCADE</p><h1 id="mini-games-title">Small games. <em>Big little wins.</em></h1></div></section>
          <section className="arcade-section" id="top-picks" aria-labelledby="top-picks-title">
            <SectionHeading eyebrow={query || genre !== "All" ? "FILTERED GAMES" : "PLAY NOW"} title={query || genre !== "All" ? "Games for you" : "Pick a game and play"} titleId="top-picks-title" copy={query ? `Showing matches for “${query}”.` : genre !== "All" ? `${genre} games, ready when you are.` : "Three polished games for a satisfying few minutes."} action={query || genre !== "All" ? <button type="button" onClick={() => { setQuery(""); setGenre("All"); }}>Reset filters</button> : <button type="button" onClick={surpriseMe}>Surprise me <span>✦</span></button>} />
            {visibleGames.length ? <div className="arcade-mosaic">{visibleGames.map((game, index) => <ArcadeGameCard game={game} variant={index === 0 ? "lead" : "wide"} key={game.id} />)}</div> : <div className="arcade-empty"><span>⌕</span><b>No games match that search yet.</b><p>Try another word or reset the filters.</p></div>}
          </section>
          <section className="arcade-seo-card" aria-labelledby="free-mini-games-title"><div><p>FREE ONLINE MINI GAMES</p><h2 id="free-mini-games-title">A tiny arcade for your in-between moments.</h2></div><div><p>SocoPlay is a focused collection of classic cards, number puzzles, and arcade stacking games without a download or account.</p><div className="arcade-seo-points"><span>Made for mobile</span><span>Quick to play</span><span>Always free to play</span></div></div></section>
        </div>
      </div>

      {notice && <div className="arcade-toast" role="status"><span>✦</span>{notice}<button type="button" onClick={() => setNotice("")} aria-label="Close message">×</button></div>}
      <footer className="arcade-footer"><Link className="arcade-brand" href="/"><span className="arcade-brand-mark"><i>◆</i><b>✦</b></span><span>Soco<span>Play</span></span></Link><p>Original mini games for little pockets of time.</p><div><button type="button" onClick={() => scrollTo("top-picks")}>Play now</button><button type="button" onClick={() => scrollTo("top-picks")}>Browse games</button></div></footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, titleId, copy, action }: { eyebrow: string; title: string; titleId?: string; copy?: string; action?: ReactNode }) {
  return <div className="arcade-section-head"><div><p>{eyebrow}</p><h2 id={titleId}>{title}</h2>{copy && <span>{copy}</span>}</div>{action && <div className="arcade-section-action">{action}</div>}</div>;
}

function ArcadeGameCard({ game, variant = "grid" }: { game: GameCard; variant?: "lead" | "small" | "wide" | "grid" }) {
  const cardContent = <><div className={`arcade-cover cover-${game.art}`} aria-hidden="true"><div className="arcade-cover-noise" /><span className="arcade-cover-icon">{game.icon}</span><i>{coverLabels[game.art]}</i><b>{game.badge}</b></div><div className="arcade-card-copy"><div><h3>{game.name}</h3><p>{game.genre} <span>·</span> {game.time}</p></div><em aria-hidden="true">→</em></div></>;
  return <article className={`arcade-game-card arcade-game-card--${variant} is-live`}><Link className="arcade-game-link" href={game.href} onClick={(event) => { event.preventDefault(); window.location.assign(game.href); }} aria-label={`Play ${game.name}`}>{cardContent}</Link></article>;
}
