"use client";

import { startTransition, type CSSProperties, useEffect, useRef, useState } from "react";
import { legacyStorageKeys, readStored, storageKeys, writeStored } from "../../lib/storage";

type Direction = "left" | "right" | "up" | "down";
type Save = { board: number[]; score: number; best: number; moves?: number; won?: boolean };
type Effects = { direction: Direction | null; merged: number[]; spawned: number | null; turn: number };

const startingBoard = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function mergeLine(line: number[]) {
  const compact = line.filter(Boolean);
  const result: number[] = [];
  const merged: number[] = [];
  let gained = 0;
  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) {
      const mergedTile = compact[index] * 2;
      result.push(mergedTile);
      gained += mergedTile;
      merged.push(result.length - 1);
      index += 1;
    } else result.push(compact[index]);
  }
  return { line: [...result, ...Array(4 - result.length).fill(0)], gained, merged };
}

function moveBoard(board: number[], direction: Direction) {
  const next = [...board];
  let gained = 0;
  const mergedIndexes: number[] = [];
  for (let row = 0; row < 4; row += 1) {
    const indexes = direction === "left" || direction === "right"
      ? Array.from({ length: 4 }, (_, column) => row * 4 + column)
      : Array.from({ length: 4 }, (_, column) => column * 4 + row);
    if (direction === "right" || direction === "down") indexes.reverse();
    const merged = mergeLine(indexes.map((index) => board[index]));
    gained += merged.gained;
    indexes.forEach((index, position) => { next[index] = merged.line[position]; });
    merged.merged.forEach((position) => mergedIndexes.push(indexes[position]));
  }
  return { board: next, gained, mergedIndexes, moved: next.some((tile, index) => tile !== board[index]) };
}

function addTile(board: number[]) {
  const empty = board.map((tile, index) => tile === 0 ? index : -1).filter((index) => index >= 0);
  if (!empty.length) return { board, index: null };
  const next = [...board];
  const position = empty[Math.floor(Math.random() * empty.length)];
  next[position] = Math.random() < 0.9 ? 2 : 4;
  return { board: next, index: position };
}

function hasMoves(board: number[]) {
  if (board.includes(0)) return true;
  return (["left", "up"] as Direction[]).some((direction) => moveBoard(board, direction).moved);
}

export default function Game2048() {
  const [board, setBoard] = useState(startingBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(0);
  const [previous, setPrevious] = useState<Save | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [won, setWon] = useState(false);
  const [effects, setEffects] = useState<Effects>({ direction: null, merged: [], spawned: null, turn: 0 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const save = readStored<Save>(storageKeys.game2048, legacyStorageKeys.game2048);
    if (Array.isArray(save?.board) && save.board.length === 16) {
      startTransition(() => {
        setBoard(save.board);
        setScore(save.score || 0);
        setBest(Math.max(save.best || 0, save.score || 0));
        setMoves(save.moves || 0);
        setWon(Boolean(save.won));
      });
    }
    startTransition(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStored(storageKeys.game2048, { board, score, best, moves, won });
  }, [best, board, loaded, moves, score, won]);

  const playMove = (direction: Direction) => {
    const moved = moveBoard(board, direction);
    if (!moved.moved) return;
    setPrevious({ board, score, best, moves, won });
    const spawned = addTile(moved.board);
    const nextBoard = spawned.board;
    const nextScore = score + moved.gained;
    setBoard(nextBoard);
    setScore(nextScore);
    setMoves((value) => value + 1);
    setBest((value) => Math.max(value, nextScore));
    setEffects((effect) => ({ direction, merged: moved.mergedIndexes, spawned: spawned.index, turn: effect.turn + 1 }));
    if (!won && nextBoard.includes(2048)) setWon(true);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const directions: Record<string, Direction> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      playMove(direction);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const newGame = () => {
    const firstTile = addTile(Array(16).fill(0));
    const fresh = addTile(firstTile.board);
    setBoard(fresh.board);
    setScore(0);
    setMoves(0);
    setPrevious(null);
    setWon(false);
    setEffects((effect) => ({ direction: null, merged: [], spawned: fresh.index, turn: effect.turn + 1 }));
  };
  const undo = () => {
    if (!previous) return;
    setBoard(previous.board);
    setScore(previous.score);
    setBest(previous.best);
    setMoves(previous.moves || 0);
    setWon(Boolean(previous.won));
    setPrevious(null);
  };
  const gameOver = loaded && !hasMoves(board);

  return <main className="mini-game game-2048">
    <header className="game-exit-bar"><a className="game-exit" href="/"><span aria-hidden="true">🚪</span> Exit game</a></header>
    <section className="mini-game-stage">
      <h1 className="sr-only">2048</h1>
      <div className="mini-layout">
        <section className="puzzle-card game-2048-card">
          <div className="game-2048-stats"><div><span>MOVES</span><b>{moves}</b></div><div><span>SCORE</span><b>{score}</b></div><div><span>BEST</span><b>{best}</b></div></div>
          <div className="mini-actions game-2048-controls"><button type="button" onClick={newGame}>↻ New game</button><button type="button" onClick={undo} disabled={!previous}>↶ Undo</button><b>{gameOver ? "Game over" : `${board.filter((tile) => tile === 0).length} open spaces`}</b></div>
          <div className={`game-2048-board move-${effects.direction || "idle"} turn-${effects.turn % 2}`} role="application" aria-label="2048 board. Use arrow keys or swipe to move tiles." onPointerDown={(event) => { touchStart.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={(event) => { const start = touchStart.current; touchStart.current = null; if (!start) return; const dx = event.clientX - start.x; const dy = event.clientY - start.y; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; playMove(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up"); }}>
            {board.map((tile, index) => <div className={`game-2048-tile tile-${tile || "empty"} ${effects.merged.includes(index) ? "is-merged" : ""} ${effects.spawned === index ? "is-spawned" : ""}`} key={index}>{tile ? <><span>{tile}</span>{effects.merged.includes(index) && <i aria-hidden="true">+{tile}</i>}</> : ""}</div>)}
            {won && <div className="game-2048-sparkles" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} style={{ "--spark": index } as CSSProperties} />)}</div>}
          </div>
        </section>
        <aside className="mini-side"><div className="save-badge">● Puzzle mode</div><h2>Make the next merge count.</h2><p>Every move slides the whole board. Same numbers merge together, so give your largest tiles a corner to grow into.</p></aside>
      </div>
    </section>
  </main>;
}
