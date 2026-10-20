"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlayingCard, type Card } from "../../components/playing-card";
import { readStored, removeStored, storageKeys, writeStored } from "../../lib/storage";
import {
  SPIDER_COLUMNS,
  SPIDER_COMPLETE_COUNT,
  applyMove,
  canMove,
  dealStock,
  findHint,
  isSpiderGame,
  newSpiderGame,
  remainingDeals,
  validRun,
  type SpiderDifficulty,
  type SpiderGame,
  type SpiderHint,
  type SpiderPick,
} from "./spider-game";

type Snapshot = { game: SpiderGame; seconds: number };
type Selection = SpiderPick | null;

const storageKey = storageKeys.spiderSolitaire;
const difficulties: { value: SpiderDifficulty; label: string }[] = [
  { value: 1, label: "1 Suit" },
  { value: 2, label: "2 Suits" },
  { value: 4, label: "4 Suits" },
];
const STOCK_CARD: Card = { id: "spider-stock", suit: "♠", value: 1, faceUp: false };
const freshSeed = () => Date.now();

export default function SpiderSolitairePage() {
  const [game, setGame] = useState(() => newSpiderGame(1, 62026));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<Selection>(null);
  const [hint, setHint] = useState<SpiderHint>(null);
  const [seconds, setSeconds] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("Tap a card or run, then choose where to place it.");
  const dragRef = useRef<Selection>(null);
  const won = game.completed.length === SPIDER_COMPLETE_COUNT;

  const chirp = (kind: "tap" | "good" | "bad" | "win") => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const Audio =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      const ctx = new Audio();
      if (ctx.state === "suspended") void ctx.resume();
      const notes =
        kind === "win"
          ? [523, 659, 784, 1047]
          : kind === "good"
            ? [440, 590]
            : kind === "bad"
              ? [170, 145]
              : [290];
      notes.forEach((hz, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.frequency.value = hz;
        oscillator.type = kind === "bad" ? "triangle" : "sine";
        gain.gain.setValueAtTime(0.075, ctx.currentTime + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.07 + 0.16);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(ctx.currentTime + index * 0.07);
        oscillator.stop(ctx.currentTime + index * 0.07 + 0.18);
      });
      window.setTimeout(() => ctx.close(), 700);
    } catch {
      /* Audio may be blocked by the device. */
    }
  };

  useEffect(() => {
    const saved = readStored<{ game?: SpiderGame; seconds?: number; soundOn?: boolean }>(storageKey);
    if (saved && isSpiderGame(saved.game)) {
      setGame(saved.game);
      setSeconds(
        typeof saved.seconds === "number" && Number.isFinite(saved.seconds) ? saved.seconds : 0,
      );
      setSoundOn(saved.soundOn !== false);
      setMessage("Welcome back — your Spider table is exactly where you left it.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStored(storageKey, { version: 1, game, seconds, soundOn });
  }, [game, seconds, soundOn, loaded]);

  useEffect(() => {
    if (!loaded || won) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loaded, won]);

  const commit = (
    next: SpiderGame,
    text: string,
    sound: "good" | "bad" | "tap" | "win" = "good",
  ) => {
    setHistory((previous) => [...previous, { game: structuredClone(game), seconds }].slice(-150));
    setGame(next);
    setSelected(null);
    setHint(null);
    setMessage(text);
    chirp(sound);
  };

  const move = (from: Selection, target: number) => {
    if (!from || won) return;
    const next = applyMove(game, from.column, from.index, target);
    if (!next) {
      setSelected(null);
      setHint(null);
      setMessage("That run cannot go there.");
      chirp("bad");
      return;
    }
    const isWin = next.completed.length === SPIDER_COMPLETE_COUNT;
    commit(
      next,
      isWin
        ? "All eight runs complete — you cleared the table!"
        : next.completed.length > game.completed.length
          ? "Run complete! It cleared to the foundation."
          : "Nice move.",
      isWin ? "win" : "good",
    );
  };

  const choose = (column: number, index: number) => {
    if (won) return;
    const pile = game.tableau[column];
    const card = pile[index];
    if (selected) {
      if (selected.column === column && selected.index === index) {
        setSelected(null);
        setHint(null);
        setMessage("Selection cleared.");
        return;
      }
      if (selected.column !== column && canMove(game, selected.column, selected.index, column)) {
        move(selected, column);
        return;
      }
      if (selected.column === column && card?.faceUp && validRun(pile, index)) {
        setSelected({ column, index });
        setHint(null);
        setMessage("Now choose a column to place this run.");
        chirp("tap");
        return;
      }
      setSelected(null);
      setHint(null);
      setMessage("That run cannot go there.");
      chirp("bad");
      return;
    }
    if (card?.faceUp && validRun(pile, index)) {
      setSelected({ column, index });
      setHint(null);
      setMessage("Now choose a column to place this run.");
      chirp("tap");
      return;
    }
    setMessage("Select a face-up same-suit descending run.");
    chirp("bad");
  };

  const autoMove = (column: number, index: number) => {
    if (won || !validRun(game.tableau[column], index)) return;
    for (let target = 0; target < SPIDER_COLUMNS; target += 1) {
      if (target !== column && canMove(game, column, index, target)) {
        move({ column, index }, target);
        return;
      }
    }
    setMessage("No legal destination for that run.");
    chirp("bad");
  };

  const dragStart = (column: number, index: number) => {
    if (won || !validRun(game.tableau[column], index)) return;
    const pick = { column, index };
    dragRef.current = pick;
    setSelected(pick);
  };

  const drop = (column: number) => {
    const pick = dragRef.current;
    dragRef.current = null;
    if (pick) move(pick, column);
  };

  const deal = () => {
    if (won) return;
    const result = dealStock(game);
    if (result.error) {
      setMessage(result.error);
      chirp("bad");
      return;
    }
    const isWin = result.game.completed.length === SPIDER_COMPLETE_COUNT;
    commit(
      result.game,
      isWin ? "All eight runs complete — you cleared the table!" : "Dealt ten new cards.",
      isWin ? "win" : "good",
    );
  };

  const undo = () => {
    const snapshot = history.at(-1);
    if (!snapshot || won) return;
    setHistory((previous) => previous.slice(0, -1));
    setGame(snapshot.game);
    setSeconds(snapshot.seconds);
    setSelected(null);
    setHint(null);
    setMessage("Move undone.");
    chirp("tap");
  };

  const showHint = () => {
    if (won) return;
    const found = findHint(game);
    if (!found) {
      setSelected(null);
      setHint(null);
      setMessage("No safe move found — undo or start a new deal.");
      chirp("bad");
      return;
    }
    setHint(found);
    setSelected(found.kind === "move" ? found.from : null);
    setMessage(found.text);
    chirp("tap");
  };

  const reset = (difficulty: SpiderDifficulty = game.difficulty) => {
    setGame(newSpiderGame(difficulty, freshSeed()));
    setHistory([]);
    setSelected(null);
    setHint(null);
    setSeconds(0);
    setMessage(
      difficulty === 1
        ? "Fresh 1-suit deal. Build same-suit runs from King to Ace."
        : `Fresh ${difficulty}-suit deal. Good luck!`,
    );
    chirp("tap");
  };

  const changeDifficulty = (difficulty: SpiderDifficulty) => {
    if (difficulty === game.difficulty) return;
    reset(difficulty);
  };

  const clearTable = () => {
    removeStored(storageKey);
    reset();
    setSettingsOpen(false);
    setMessage("Fresh table dealt.");
  };

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <main className={`cove-app game-page spider-app${won ? " is-won" : ""}`}>
      {won && (
        <>
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 50 }, (_, index) => (
              <i
                key={index}
                style={{ left: `${(index * 31) % 100}%`, animationDelay: `${(index % 10) * 0.1}s` }}
              />
            ))}
          </div>
          <WinDialog moves={game.moves} score={game.score} time={time} onNew={() => reset()} />
        </>
      )}
      {rulesOpen && <RulesDialog onClose={() => setRulesOpen(false)} />}
      {settingsOpen && (
        <SettingsDialog
          soundOn={soundOn}
          onSound={() => setSoundOn((value) => !value)}
          onClear={clearTable}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <header className="site-bar">
        <Link className="cove-brand" href="/">
          <span className="brand-cards">♠♥</span> SocoPlay
        </Link>
        <nav>
          <Link href="/">Discover</Link>
          <Link className="active" href="/games/spider-solitaire">
            Spider Solitaire
          </Link>
          <Link href="/#play-now">Play now</Link>
        </nav>
        <button
          className="sound-toggle"
          onClick={() => setSoundOn((value) => !value)}
          aria-pressed={soundOn}
        >
          {soundOn ? "♪" : "◌"}
          <span>Sound</span>
        </button>
      </header>
      <section className="game-top">
        <div className="title-block">
          <span className="game-dot" />
          <h1>Spider Solitaire</h1>
          <small>10-column card game</small>
        </div>
        <div className="controls">
          {difficulties.map((difficulty) => (
            <button
              className={`pill ${game.difficulty === difficulty.value ? "selected" : ""}`}
              type="button"
              onClick={() => changeDifficulty(difficulty.value)}
              key={difficulty.value}
            >
              {difficulty.label}
            </button>
          ))}
          <button className="pill action" type="button" onClick={() => reset()}>
            ↻ New game
          </button>
          <button className="pill" type="button" onClick={undo} disabled={!history.length || won}>
            ↶ Undo
          </button>
          <button className="pill amber" type="button" onClick={showHint} disabled={won}>
            ✦ Hint
          </button>
          <button
            className="pill"
            type="button"
            onClick={deal}
            disabled={won || !game.stock.length}
          >
            Deal 10
          </button>
          <button className="pill" type="button" onClick={() => setSettingsOpen(true)}>
            ⚙
          </button>
          <button className="pill" type="button" onClick={() => setRulesOpen(true)}>
            ?
          </button>
        </div>
      </section>
      <div className="message-strip" aria-live="polite">
        <span className="message-dot" />
        {message}
      </div>
      <div className="play-area">
        <section className={`table-panel ${won ? "board-won" : ""}`}>
          <div className="spider-top">
            <div className="pile spider-stock">
              <PlayingCard
                card={STOCK_CARD}
                onClick={deal}
                hinted={hint?.kind === "deal"}
                disabled={won || !game.stock.length}
              />
              <span>{game.stock.length ? `Stock · ${remainingDeals(game)} deals` : "Stock empty"}</span>
            </div>
            <div
              className="spider-completed"
              aria-label={`${game.completed.length} of ${SPIDER_COMPLETE_COUNT} runs complete`}
            >
              {Array.from({ length: SPIDER_COMPLETE_COUNT }, (_, index) => {
                const run = game.completed[index];
                return (
                  <div className={`spider-complete ${run ? "is-filled" : ""}`} key={index}>
                    {run ? (
                      <>
                        <b>K</b>
                        <small>{run[0].suit}</small>
                      </>
                    ) : (
                      <span>✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="spider-tableau-wrap">
            <div className="tableau spider-tableau">
              {game.tableau.map((pile, column) => (
                <div
                  className={`tableau-column spider-column ${
                    hint?.kind === "move" && hint.to === column ? "hint-target" : ""
                  }`}
                  key={column}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => drop(column)}
                >
                  {pile.map((card, index) => {
                    const isSelected = selected?.column === column && selected.index === index;
                    const isHinted =
                      hint?.kind === "move" &&
                      hint.from.column === column &&
                      hint.from.index === index;
                    const step = Math.max(
                      9,
                      Math.min(24, Math.floor(300 / Math.max(1, pile.length - 1))),
                    );
                    return (
                      <div
                        className="stack-card"
                        key={card.id}
                        style={{ top: `${index * step}px` }}
                      >
                        <PlayingCard
                          card={card}
                          selected={isSelected}
                          hinted={isHinted}
                          disabled={won || !card.faceUp}
                          draggable={card.faceUp && validRun(pile, index) && !won}
                          onDragStart={() => dragStart(column, index)}
                          onClick={() => choose(column, index)}
                          onDoubleClick={() => card.faceUp && autoMove(column, index)}
                        />
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className="tableau-target spider-column-target"
                    disabled={!selected || won}
                    onClick={() => selected && move(selected, column)}
                    aria-label={`Move selected run to column ${column + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className="game-rail">
          <section className="ad-card">
            <span>ADVERTISEMENT</span>
            <strong>
              Space for a future
              <br />
              great partner.
            </strong>
            <p>Reserved for AdSense — never placed over game controls.</p>
            <small>Ad slot</small>
          </section>
          <section className="score-card">
            <div className="score-title">
              <span>Table score</span>
              <b>● {game.completed.length}/8 runs</b>
            </div>
            <div className="metrics">
              <div>
                <b>{game.moves}</b>
                <small>Moves</small>
              </div>
              <div>
                <b>{game.score}</b>
                <small>Score</small>
              </div>
              <div>
                <b>{time}</b>
                <small>Time</small>
              </div>
            </div>
            <p>
              <span className="spark">✦</span>
              {game.difficulty === 1 ? "1-suit mode" : `${game.difficulty}-suit mode`} ·{" "}
              {remainingDeals(game)} deals left
            </p>
          </section>
          <section className="tip-card">
            <span>HOW TO PLAY</span>
            <p>
              Move same-suit descending runs. Complete King-to-Ace runs in one suit to clear them.
              Deal only when every column has a card.
            </p>
            <button onClick={() => setRulesOpen(true)}>View full rules →</button>
          </section>
        </aside>
      </div>
      <footer className="game-footer">
        <div>
          <b>{time}</b>
          <span>Current game</span>
        </div>
        <div>
          <b>{game.moves}</b>
          <span>Moves</span>
        </div>
        <div>
          <b>{remainingDeals(game)}</b>
          <span>Deals left</span>
        </div>
        <div>
          <b>{history.length}</b>
          <span>Undo steps</span>
        </div>
        <button type="button" onClick={undo} disabled={!history.length || won}>
          ↶ Undo
        </button>
        <button type="button" onClick={showHint} disabled={won}>
          ✦ Hint
        </button>
        <Link href="/">← Back to all games</Link>
      </footer>
    </main>
  );
}

function SettingsDialog({
  soundOn,
  onSound,
  onClear,
  onClose,
}: {
  soundOn: boolean;
  onSound: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="game-dialog-backdrop" role="presentation">
      <section className="game-dialog" role="dialog" aria-modal="true" aria-labelledby="spider-settings-title">
        <button className="dialog-close" onClick={onClose} aria-label="Close settings">
          ×
        </button>
        <p>TABLE SETTINGS</p>
        <h2 id="spider-settings-title">Make it yours.</h2>
        <button className="dialog-row" onClick={onSound}>
          <span>Table sounds</span>
          <b>{soundOn ? "On" : "Off"}</b>
        </button>
        <button className="dialog-row danger" onClick={onClear}>
          <span>Start a new table</span>
          <b>New deal</b>
        </button>
      </section>
    </div>
  );
}

function RulesDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="game-dialog-backdrop" role="presentation">
      <section className="game-dialog rules-dialog" role="dialog" aria-modal="true" aria-labelledby="spider-rules-title">
        <button className="dialog-close" onClick={onClose} aria-label="Close rules">
          ×
        </button>
        <p>SPIDER SOLITAIRE</p>
        <h2 id="spider-rules-title">How to play</h2>
        <ol>
          <li>Build eight complete King-to-Ace runs in the same suit.</li>
          <li>
            Move a same-suit descending run onto a card one rank higher, regardless of suit.
          </li>
          <li>Any card or run can fill an empty column.</li>
          <li>Deal ten new cards only when every column has at least one card.</li>
          <li>Completed runs clear automatically. Use Undo or Hint when stuck.</li>
        </ol>
        <button className="dialog-primary" onClick={onClose}>
          Let’s play
        </button>
      </section>
    </div>
  );
}

function WinDialog({
  moves,
  score,
  time,
  onNew,
}: {
  moves: number;
  score: number;
  time: string;
  onNew: () => void;
}) {
  return (
    <div className="game-dialog-backdrop win-backdrop">
      <section className="game-dialog win-dialog" role="dialog" aria-modal="true" aria-labelledby="spider-win-title">
        <span className="win-suit">♠ ♥ ♣ ♦</span>
        <p>EIGHT RUNS COMPLETE</p>
        <h2 id="spider-win-title">You cleared the table!</h2>
        <div className="win-stats">
          <span>
            <b>{time}</b>Time
          </span>
          <span>
            <b>{moves}</b>Moves
          </span>
          <span>
            <b>{score}</b>Score
          </span>
        </div>
        <button className="dialog-primary" onClick={onNew}>
          Play again
        </button>
        <Link href="/">Back to all games</Link>
      </section>
    </div>
  );
}
