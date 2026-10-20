"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { readStored, storageKeys, writeStored } from "../../lib/storage";
import {
  BALL_COLORS,
  MAX_POWER_DRAG,
  RAIL,
  TABLE_HEIGHT,
  TABLE_WIDTH,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  aiChooseShot,
  createGame,
  groupNumbers,
  isAiTurn,
  isMoving,
  isPoolGame,
  placeCueBall,
  playerOnEight,
  resolveShot,
  shoot,
  stepPhysics,
  type GameState,
  type Group,
  type Mode,
} from "./pool-engine";
import { renderGame } from "./pool-render";

type Hud = {
  mode: Mode;
  names: [string, string];
  groups: [Group, Group];
  turn: 0 | 1;
  turnName: string;
  openTable: boolean;
  ballInHand: boolean;
  gameOver: boolean;
  winner: "p1" | "p2" | null;
  message: string;
  pocketed: number[];
  shots: number;
  onEight: [boolean, boolean];
  isAiTurn: boolean;
};

type Aim = { angle: number; power: number };
type Point = { x: number; y: number };

const storageKey = storageKeys.pool;
const freshSeed = () => Date.now();

function hudFromGame(game: GameState): Hud {
  const names: [string, string] =
    game.mode === "ai"
      ? ["You", game.players[1].name]
      : [game.players[0].name, game.players[1].name];
  return {
    mode: game.mode,
    names,
    groups: [game.players[0].group, game.players[1].group],
    turn: game.turn,
    turnName: names[game.turn],
    openTable: game.openTable,
    ballInHand: game.ballInHand,
    gameOver: game.gameOver,
    winner: game.winner,
    message: game.message,
    pocketed: game.balls.filter((ball) => ball.pocketed && ball.number !== 0).map((ball) => ball.number),
    shots: game.shotCount,
    onEight: [playerOnEight(game, 0), playerOnEight(game, 1)],
    isAiTurn: isAiTurn(game),
  };
}

function groupLabel(group: Group, onEight: boolean, openTable: boolean) {
  if (openTable || !group) return "Open table";
  if (onEight) return "On the 8";
  return group === "solids" ? "Solids" : "Stripes";
}

function asTablePoint(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH - RAIL,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT - RAIL,
  };
}

export default function EightBallPoolPage() {
  const [initialGame] = useState<GameState>(() => createGame("ai", 62026));
  const gameRef = useRef<GameState>(initialGame);
  const [hud, setHud] = useState<Hud>(() => hudFromGame(initialGame));
  const [soundOn, setSoundOn] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [aim, setAim] = useState<Aim | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const aimRef = useRef<Aim | null>(null);
  const pointerRef = useRef<Point | null>(null);
  const aimingRef = useRef(false);
  const soundRef = useRef(true);
  const aiTimerRef = useRef<number | null>(null);
  const scheduleAiRef = useRef<((game: GameState) => void) | null>(null);

  const syncHud = useCallback(() => {
    const game = gameRef.current;
    if (game) setHud(hudFromGame(game));
  }, []);

  const saveGame = useCallback((game: GameState, sound: boolean) => {
    writeStored(storageKey, { version: 1, game, soundOn: sound });
  }, []);

  const playSound = useCallback((kind: "strike" | "pocket" | "foul" | "win" | "tap") => {
    if (!soundRef.current || typeof window === "undefined") return;
    try {
      const Audio =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      const context = new Audio();
      if (context.state === "suspended") void context.resume();
      const notes =
        kind === "win"
          ? [523, 659, 784, 1047]
          : kind === "pocket"
            ? [660, 880]
            : kind === "foul"
              ? [180, 140]
              : kind === "strike"
                ? [220]
                : [330];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = kind === "foul" ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.07, context.currentTime + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.07 + 0.18);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + index * 0.07);
        oscillator.stop(context.currentTime + index * 0.07 + 0.2);
      });
      window.setTimeout(() => context.close(), 900);
    } catch {
      /* Audio may be blocked by the device. */
    }
  }, []);

  const scheduleAi = useCallback(
    (game: GameState) => {
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      if (!isAiTurn(game)) return;
      aiTimerRef.current = window.setTimeout(() => {
        const current = gameRef.current;
        if (!current || !isAiTurn(current) || current.shotInProgress) return;

        if (current.ballInHand) {
          const placement = aiChooseShot(current);
          if (placement && placement.type === "place" && placeCueBall(current, placement.x, placement.y)) {
            syncHud();
            saveGame(current, soundRef.current);
            window.setTimeout(() => scheduleAiRef.current?.(current), 350);
            return;
          }
          const fallbacks = [
            { x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2 },
            { x: TABLE_WIDTH * 0.5, y: TABLE_HEIGHT / 2 },
            { x: TABLE_WIDTH * 0.75, y: TABLE_HEIGHT * 0.3 },
            { x: TABLE_WIDTH * 0.5, y: TABLE_HEIGHT * 0.7 },
          ];
          const placed = fallbacks.some((spot) => placeCueBall(current, spot.x, spot.y));
          if (!placed) {
            current.ballInHand = false;
            current.turn = 0;
            current.message = "The AI could not place the cue ball. Your turn.";
            syncHud();
            return;
          }
          syncHud();
          saveGame(current, soundRef.current);
          window.setTimeout(() => scheduleAiRef.current?.(current), 350);
          return;
        }

        const action = aiChooseShot(current);
        if (!action || action.type !== "shoot" || !shoot(current, action.angle, action.power)) {
          current.turn = 0;
          current.ballInHand = false;
          current.message = "The AI passes. Your turn.";
          syncHud();
          return;
        }
        const nextAim = { angle: action.angle, power: action.power };
        aimRef.current = nextAim;
        setAim(nextAim);
        syncHud();
        playSound("strike");
      }, 750);
    },
    [playSound, saveGame, syncHud],
  );

  useEffect(() => {
    scheduleAiRef.current = scheduleAi;
  }, [scheduleAi]);

  useEffect(() => {
    const saved = readStored<{ game?: unknown; soundOn?: boolean }>(storageKey);
    if (saved && isPoolGame(saved.game)) {
      const loaded = saved.game;
      if (loaded.shotInProgress) {
        loaded.shotInProgress = false;
        loaded.shot = null;
        loaded.balls.forEach((ball) => {
          ball.vx = 0;
          ball.vy = 0;
        });
      }
      gameRef.current = loaded;
      const nextSound = saved.soundOn !== false;
      soundRef.current = nextSound;
      setSoundOn(nextSound);
      setHud(hudFromGame(loaded));
      window.setTimeout(() => scheduleAiRef.current?.(loaded), 450);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let last = performance.now();

    const drawFrame = (now: number) => {
      const game = gameRef.current;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (game) {
        if (game.shotInProgress) {
          stepPhysics(game, delta);
          if (!isMoving(game)) {
            const result = resolveShot(game);
            aimRef.current = null;
            pointerRef.current = null;
            setAim(null);
            syncHud();
            saveGame(game, soundRef.current);
            if (result) {
              if (result.gameOver) playSound("win");
              else if (result.foul) playSound("foul");
              else if (result.pocketed.length) playSound("pocket");
              else playSound("tap");
            }
            scheduleAiRef.current?.(game);
          }
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        context.setTransform(width / VIEW_WIDTH, 0, 0, height / VIEW_HEIGHT, 0, 0);
        renderGame(context, game, {
          aim: aimRef.current,
          pointer: isAiTurn(game) ? null : pointerRef.current,
          aiming: aimingRef.current,
        });
      }

      frame = window.requestAnimationFrame(drawFrame);
    };

    frame = window.requestAnimationFrame(drawFrame);
    return () => {
      window.cancelAnimationFrame(frame);
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    };
  }, [playSound, saveGame, scheduleAi, syncHud]);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  const newGame = (mode: Mode) => {
    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    const game = createGame(mode, freshSeed());
    gameRef.current = game;
    aimRef.current = null;
    pointerRef.current = null;
    aimingRef.current = false;
    setAim(null);
    setHud(hudFromGame(game));
    saveGame(game, soundRef.current);
    playSound("tap");
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundRef.current = next;
    const game = gameRef.current;
    if (game && !game.shotInProgress) saveGame(game, next);
    if (next) playSound("tap");
  };

  const updateAim = (point: Point) => {
    const game = gameRef.current;
    if (!game) return;
    const cue = game.balls[0];
    const dx = point.x - cue.x;
    const dy = point.y - cue.y;
    const distance = Math.hypot(dx, dy);
    const next =
      distance < 4
        ? { angle: aimRef.current?.angle ?? 0, power: 0 }
        : {
            angle: Math.atan2(dy, dx),
            power: Math.max(0, Math.min(1, distance / MAX_POWER_DRAG)),
          };
    aimRef.current = next;
    setAim(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const game = gameRef.current;
    if (!game || game.gameOver || isAiTurn(game)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = asTablePoint(event.currentTarget, event);
    pointerRef.current = point;
    if (game.ballInHand) return;
    if (game.shotInProgress) return;
    aimingRef.current = true;
    updateAim(point);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const game = gameRef.current;
    if (!game) return;
    const point = asTablePoint(event.currentTarget, event);
    pointerRef.current = point;
    if (aimingRef.current && !isAiTurn(game)) updateAim(point);
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const game = gameRef.current;
    if (!game) return;
    const point = asTablePoint(event.currentTarget, event);
    pointerRef.current = point;

    if (aimingRef.current) {
      aimingRef.current = false;
      const shotAim = aimRef.current;
      aimRef.current = null;
      setAim(null);
      if (shotAim && shotAim.power > 0.06 && !isAiTurn(game) && !game.shotInProgress) {
        if (shoot(game, shotAim.angle, shotAim.power)) {
          syncHud();
          playSound("strike");
        }
      }
      return;
    }

    if (game.ballInHand && !isAiTurn(game)) {
      if (placeCueBall(game, point.x, point.y)) {
        syncHud();
        saveGame(game, soundRef.current);
        playSound("tap");
      } else {
        game.message = "That spot is blocked. Choose a clear place for the cue ball.";
        syncHud();
        playSound("foul");
      }
      pointerRef.current = null;
    }
  };

  const onPointerCancel = () => {
    aimingRef.current = false;
    aimRef.current = null;
    pointerRef.current = null;
    setAim(null);
  };

  const winnerName =
    hud.winner === "p1" ? hud.names[0] : hud.winner === "p2" ? hud.names[1] : "";
  const winTitle =
    hud.winner === "p1" && hud.mode === "ai"
      ? "You win!"
      : hud.winner === "p2" && hud.mode === "ai"
        ? "AI wins"
        : winnerName
          ? `${winnerName} wins!`
          : "Game over";

  return (
    <main className="cove-app game-page pool-app">
      {hud.gameOver && (
        <div className="game-dialog-backdrop win-backdrop">
          <section className="game-dialog win-dialog" role="dialog" aria-modal="true" aria-labelledby="pool-win-title">
            <span className="win-suit">8</span>
            <p>TABLE COMPLETE</p>
            <h2 id="pool-win-title">{winTitle}</h2>
            <span className="pool-win-message">{hud.message}</span>
            <div className="win-stats">
              <span>
                <b>{hud.shots}</b>Shots
              </span>
              <span>
                <b>{hud.pocketed.length}</b>Pocketed
              </span>
              <span>
                <b>{hud.mode === "ai" ? "AI" : "2P"}</b>Mode
              </span>
            </div>
            <button className="dialog-primary" onClick={() => newGame(hud.mode)} type="button">
              Play again
            </button>
            <Link href="/">Back to all games</Link>
          </section>
        </div>
      )}
      {rulesOpen && <RulesDialog onClose={() => setRulesOpen(false)} />}
      <header className="site-bar">
        <Link className="cove-brand" href="/">
          <span className="brand-cards">8</span> SocoPlay
        </Link>
        <nav>
          <Link href="/">Discover</Link>
          <Link className="active" href="/games/8-ball-pool">
            8-Ball Pool
          </Link>
          <Link href="/#play-now">Play now</Link>
        </nav>
        <button className="sound-toggle" onClick={toggleSound} aria-pressed={soundOn} type="button">
          {soundOn ? "♪" : "◌"}
          <span>Sound</span>
        </button>
      </header>

      <section className="game-top">
        <div className="title-block">
          <span className="game-dot" />
          <h1>8-Ball Pool</h1>
          <small>Classic rules</small>
        </div>
        <div className="controls">
          <button
            className={`pill ${hud.mode === "ai" ? "selected" : ""}`}
            type="button"
            onClick={() => hud.mode !== "ai" && newGame("ai")}
          >
            Vs AI
          </button>
          <button
            className={`pill ${hud.mode === "2p" ? "selected" : ""}`}
            type="button"
            onClick={() => hud.mode !== "2p" && newGame("2p")}
          >
            2 Players
          </button>
          <button className="pill action" type="button" onClick={() => newGame(hud.mode)}>
            ↻ New game
          </button>
          <button className="pill" type="button" onClick={() => setRulesOpen(true)}>
            ? Rules
          </button>
        </div>
      </section>

      <div className="message-strip" aria-live="polite">
        <span className="message-dot" />
        {hud.message}
      </div>

      <div className="play-area">
        <section className={`table-panel pool-table-panel ${hud.gameOver ? "board-won" : ""}`}>
          <div className="pool-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="pool-canvas"
              aria-label="8-ball pool table. Drag from the cue ball to aim and release to shoot."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            />
          </div>
          <div className="pool-power-row">
            <span>POWER</span>
            <div className="pool-power" aria-hidden="true">
              <i style={{ width: `${(aim?.power ?? 0) * 100}%` }} />
            </div>
            <small>
              {hud.gameOver
                ? "Table complete"
                : hud.isAiTurn
                  ? "AI is lining up…"
                  : hud.ballInHand
                    ? "Tap the table to place the cue ball"
                    : aim
                      ? `Power ${Math.round(aim.power * 100)}%`
                      : "Drag from the cue ball to aim and set power"}
            </small>
          </div>
        </section>

        <aside className="game-rail pool-rail">
          <section className="score-card">
            <div className="score-title">
              <span>{hud.gameOver ? "Final result" : "Table status"}</span>
              <b>{hud.gameOver ? "Game over" : `${hud.turnName} to shoot`}</b>
            </div>
            <div className="metrics">
              <div>
                <b>{hud.shots}</b>
                <small>Shots</small>
              </div>
              <div>
                <b>{hud.pocketed.length}</b>
                <small>Pocketed</small>
              </div>
              <div>
                <b>{15 - hud.pocketed.length}</b>
                <small>On table</small>
              </div>
            </div>
            <p>
              <span className="spark">✦</span>
              {hud.openTable ? "Open table — first legal pot assigns groups" : "Groups are set"}
            </p>
          </section>

          <section className="pool-players" aria-label="Players and groups">
            {([0, 1] as const).map((index) => {
              const group = hud.groups[index];
              const numbers = groupNumbers(group);
              return (
                <div className={`pool-player ${hud.turn === index && !hud.gameOver ? "is-active" : ""}`} key={index}>
                  <div className="pool-player-head">
                    <b>{hud.names[index]}</b>
                    <span>{groupLabel(group, hud.onEight[index], hud.openTable)}</span>
                  </div>
                  <div className="pool-balls">
                    {numbers.length ? (
                      numbers.map((number) => (
                        <span
                          className={`pool-chip ${number > 8 ? "is-stripe" : ""} ${
                            hud.pocketed.includes(number) ? "is-pocketed" : ""
                          }`}
                          style={{ "--ball": BALL_COLORS[number] } as CSSProperties}
                          key={number}
                        >
                          {number}
                        </span>
                      ))
                    ) : (
                      <small>First legal pot sets your group.</small>
                    )}
                    {hud.onEight[index] && (
                      <span className="pool-chip pool-eight-chip is-active" style={{ "--ball": "#1b1b1b" } as CSSProperties}>
                        8
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="tip-card">
            <span>HOW TO PLAY</span>
            <p>
              Break the rack, then pot your group before the 8. Drag from the cue ball to aim;
              the farther you drag, the harder the shot.
            </p>
            <button onClick={() => setRulesOpen(true)} type="button">
              View full rules →
            </button>
          </section>
        </aside>
      </div>

      <footer className="game-footer">
        <div>
          <b>{hud.shots}</b>
          <span>Shots</span>
        </div>
        <div>
          <b>{hud.pocketed.length}</b>
          <span>Pocketed</span>
        </div>
        <div>
          <b>{hud.mode === "ai" ? "AI" : "2P"}</b>
          <span>Mode</span>
        </div>
        <div>
          <b>{hud.turn === 0 ? "P1" : "P2"}</b>
          <span>Turn</span>
        </div>
        <button type="button" onClick={() => newGame(hud.mode)}>
          ↻ New game
        </button>
        <button type="button" onClick={() => setRulesOpen(true)}>
          ? Rules
        </button>
        <Link href="/">← Back to all games</Link>
      </footer>
    </main>
  );
}

function RulesDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="game-dialog-backdrop" role="presentation">
      <section className="game-dialog rules-dialog" role="dialog" aria-modal="true" aria-labelledby="pool-rules-title">
        <button className="dialog-close" onClick={onClose} aria-label="Close rules" type="button">
          ×
        </button>
        <p>8-BALL POOL</p>
        <h2 id="pool-rules-title">How to play</h2>
        <ol>
          <li>Break the rack. The table stays open until the first legal pot after the break.</li>
          <li>The first ball pocketed legally assigns solids or stripes to the shooter.</li>
          <li>Pot every ball in your group, then pocket the 8-ball to win.</li>
          <li>Hit your own group first and either pot a ball or drive a ball to a rail.</li>
          <li>Scratches and fouls give the other player ball-in-hand.</li>
          <li>Pocketing the 8-ball early, or with a foul, loses the game.</li>
          <li>Drag from the cue ball to aim; drag farther for more power. Tap the table to place a ball-in-hand cue ball.</li>
        </ol>
        <button className="dialog-primary" onClick={onClose} type="button">
          Let’s play
        </button>
      </section>
    </div>
  );
}
