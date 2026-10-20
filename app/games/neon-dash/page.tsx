"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { readStored, storageKeys, writeStored } from "../../lib/storage";
import { playNeonSound, setNeonMuted, unlockNeonAudio } from "./neon-audio";
import {
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createGame,
  currentMission,
  distanceMeters,
  jump,
  levelName,
  missionProgress,
  slide,
  startRun,
  togglePause,
  update,
  type GameEvent,
  type GameState,
  type GameStatus,
  type MissionKind,
} from "./neon-engine";
import { renderGame } from "./neon-render";

type Hud = {
  status: GameStatus;
  distance: number;
  score: number;
  bestDistance: number;
  bestScore: number;
  bestLevel: number;
  level: number;
  levelName: string;
  combo: number;
  bestCombo: number;
  nearMisses: number;
  orbs: number;
  newRecord: boolean;
  runs: number;
  missionNumber: number;
  missionsCompleted: number;
  soundOn: boolean;
  mission: {
    label: string;
    hint: string;
    progress: number;
    target: number;
    kind: MissionKind;
  };
};

function hudFromGame(game: GameState): Hud {
  const mission = currentMission(game);
  return {
    status: game.status,
    distance: distanceMeters(game),
    score: Math.floor(game.score),
    bestDistance: game.profile.bestDistance,
    bestScore: game.profile.bestScore,
    bestLevel: game.profile.bestLevel,
    level: game.level,
    levelName: levelName(game.level),
    combo: game.combo,
    bestCombo: game.bestCombo,
    nearMisses: game.nearMisses,
    orbs: game.orbsCollected,
    newRecord: game.newRecord,
    runs: game.profile.runs,
    missionNumber: game.profile.missionIndex + 1,
    missionsCompleted: game.profile.missionsCompleted,
    soundOn: true,
    mission: {
      label: mission.label,
      hint: mission.hint,
      progress: Math.min(mission.target, missionProgress(game)),
      target: mission.target,
      kind: mission.kind,
    },
  };
}

type Action = "jump" | "slide" | "pause";

function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Haptics are a bonus, never a requirement. */
  }
}

export default function NeonDashPage() {
  const [hud, setHud] = useState<Hud>(() => ({ ...hudFromGame(createGame()), soundOn: true }));
  const gameRef = useRef<GameState | null>(null);
  const soundRef = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerStartRef = useRef<{ y: number } | null>(null);

  const syncHud = useCallback(() => {
    const game = gameRef.current;
    if (game) setHud({ ...hudFromGame(game), soundOn: soundRef.current });
  }, []);

  useEffect(() => {
    const saved = readStored<unknown>(storageKeys.neonDash);
    const savedSound = readStored<boolean>(storageKeys.neonDashSound);
    const sound = savedSound !== false;
    gameRef.current = createGame(saved);
    soundRef.current = sound;
    setNeonMuted(!sound);
    syncHud();
  }, [syncHud]);

  const handleEvents = useCallback(
    (game: GameState, events: GameEvent[]) => {
      if (!events.length) return;
      for (const event of events) {
        switch (event.type) {
          case "jump":
            playNeonSound("jump");
            break;
          case "double-jump":
            playNeonSound("double");
            break;
          case "slide":
            playNeonSound("slide");
            break;
          case "orb":
            playNeonSound("orb");
            if (soundRef.current) haptic(6);
            break;
          case "near":
            playNeonSound("near");
            if (soundRef.current) haptic(8);
            break;
          case "slide-under":
            playNeonSound("slide-under");
            break;
          case "level":
            playNeonSound("level");
            if (soundRef.current) haptic([12, 24, 12]);
            break;
          case "mission":
            playNeonSound("mission");
            if (soundRef.current) haptic([16, 30, 16]);
            break;
          case "dead":
            playNeonSound("dead");
            if (soundRef.current) haptic(40);
            break;
        }
        if (event.type === "dead" || event.type === "mission") {
          writeStored(storageKeys.neonDash, game.profile);
        }
      }
      syncHud();
    },
    [syncHud],
  );

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setNeonMuted(!next);
    writeStored(storageKeys.neonDashSound, next);
    if (next) {
      unlockNeonAudio();
      playNeonSound("ui");
    }
    syncHud();
  }, [syncHud]);

  useEffect(() => {
    let frame = 0;
    let last = 0;
    let lastHud = 0;

    const tick = (now: number) => {
      const game = gameRef.current;
      const canvas = canvasRef.current;
      const delta = last ? (now - last) / 1000 : 0;
      last = now;

      if (game && canvas) {
        if (game.status === "playing" || game.status === "over") {
          const events = update(game, delta);
          handleEvents(game, events);
        }

        const context = canvas.getContext("2d");
        if (context) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const width = Math.round(VIEW_WIDTH * dpr);
          const height = Math.round(VIEW_HEIGHT * dpr);
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderGame(context, game, now);
        }

        if (now - lastHud > 80) {
          lastHud = now;
          syncHud();
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [handleEvents, syncHud]);

  const act = useCallback(
    (action: Action) => {
      const game = gameRef.current;
      if (!game) return;

      if (action === "pause") {
        togglePause(game);
        playNeonSound("ui");
        syncHud();
        return;
      }

      if (game.status === "ready" || game.status === "over") {
        unlockNeonAudio();
        startRun(game);
        playNeonSound("start");
        syncHud();
        return;
      }

      if (game.status === "paused") {
        game.status = "playing";
        playNeonSound("ui");
        syncHud();
        return;
      }

      const events = action === "jump" ? jump(game) : slide(game);
      handleEvents(game, events);
      syncHud();
    },
    [handleEvents, syncHud],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === " " || key === "arrowup" || key === "w") {
        event.preventDefault();
        if (!event.repeat) act("jump");
      } else if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        if (!event.repeat) act("slide");
      } else if (key === "p" || key === "escape") {
        event.preventDefault();
        if (!event.repeat) act("pause");
      } else if (key === "m") {
        event.preventDefault();
        if (!event.repeat) toggleSound();
      } else if (key === "enter" && !event.repeat) {
        const game = gameRef.current;
        if (game && (game.status === "ready" || game.status === "over")) {
          event.preventDefault();
          act("jump");
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [act, toggleSound]);

  useEffect(() => {
    const pauseIfPlaying = () => {
      const game = gameRef.current;
      if (game?.status === "playing") {
        game.status = "paused";
        syncHud();
      }
    };
    const onVisibility = () => {
      if (document.hidden) pauseIfPlaying();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", pauseIfPlaying);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", pauseIfPlaying);
    };
  }, [syncHud]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    pointerStartRef.current = { y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    const game = gameRef.current;
    if (!game) return;
    if (game.status !== "playing") {
      act("jump");
      return;
    }
    const swipe = start ? event.clientY - start.y : 0;
    act(swipe > 32 ? "slide" : "jump");
  };

  const progressPercent = Math.min(100, Math.round((hud.mission.progress / hud.mission.target) * 100));
  const comboLit = hud.combo > 0;
  const playing = hud.status === "playing";

  return (
    <main className="neon-page">
      <header className="neon-nav">
        <Link className="game-exit" href="/">
          <span aria-hidden="true">🚪</span> Exit game
        </Link>
        <div className="neon-nav-actions">
          <button
            className="neon-pause neon-sound"
            type="button"
            onClick={toggleSound}
            aria-pressed={hud.soundOn}
            aria-label={hud.soundOn ? "Mute sound effects" : "Enable sound effects"}
            title={hud.soundOn ? "Mute sound effects (M)" : "Enable sound effects (M)"}
          >
            <span aria-hidden="true">{hud.soundOn ? "🔊" : "🔇"}</span>
            <span className="neon-nav-label">Sound</span>
          </button>
          <button
            className="neon-pause"
            type="button"
            onClick={() => act("pause")}
            disabled={hud.status !== "playing" && hud.status !== "paused"}
          >
            {hud.status === "paused" ? "▶ Resume" : "❚❚ Pause"}
          </button>
        </div>
      </header>

      <section className="neon-stage" aria-labelledby="neon-dash-title">
        <h1 className="sr-only" id="neon-dash-title">
          Neon Dash
        </h1>

        <div className="neon-hud" aria-hidden="true">
          <div className="neon-stat">
            <span>DISTANCE</span>
            <b>
              {hud.distance}
              <i>m</i>
            </b>
          </div>
          <div className="neon-stat">
            <span>SCORE</span>
            <b>{hud.score.toLocaleString()}</b>
          </div>
          <div className="neon-stat neon-stat--level">
            <span>LEVEL</span>
            <b>{hud.level}</b>
            <small>{hud.levelName}</small>
          </div>
          <div className={`neon-stat neon-stat--combo${comboLit ? " is-live" : ""}`}>
            <span>COMBO</span>
            <b>×{Math.max(1, hud.combo)}</b>
          </div>
          <div className="neon-stat neon-stat--best">
            <span>BEST</span>
            <b>
              {hud.bestDistance}
              <i>m</i>
            </b>
            <small>
              LV {hud.bestLevel} · {hud.bestScore.toLocaleString()} pts
            </small>
          </div>
        </div>

        <div className="neon-mission">
          <div className="neon-mission-copy">
            <span>MISSION {hud.missionNumber}</span>
            <b>{hud.mission.label}</b>
            <small>{hud.mission.hint}</small>
          </div>
          <div className="neon-mission-meter">
            <strong>
              {hud.mission.progress.toLocaleString()} / {hud.mission.target.toLocaleString()}
            </strong>
            <div
              className="neon-bar"
              role="progressbar"
              aria-label="Mission progress"
              aria-valuemin={0}
              aria-valuemax={hud.mission.target}
              aria-valuenow={hud.mission.progress}
            >
              <i style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="neon-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="neon-canvas"
            width={VIEW_WIDTH}
            height={VIEW_HEIGHT}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            aria-label="Neon Dash playfield. Tap to jump, swipe down to slide, or use the keyboard."
          >
            Your browser needs canvas support to play Neon Dash.
          </canvas>

          {hud.status === "ready" && (
            <div className="neon-overlay">
              <div className="neon-overlay-card">
                <p className="neon-kicker">ENDLESS NEON RUNNER</p>
                <h2>Neon Dash</h2>
                <p className="neon-lede">Jump, slide, and thread the gaps. Every 350 metres pushes you into a new neon stage.</p>
                <ul className="neon-howto">
                  <li>
                    <b>Jump</b> Space / ↑ / tap — double jump in the air.
                  </li>
                  <li>
                    <b>Slide</b> ↓ / S / swipe down — duck under energy gates.
                  </li>
                  <li>
                    <b>Chase</b> distance records, near-miss combos, and level milestones.
                  </li>
                </ul>
                <button className="neon-start" type="button" onClick={() => act("jump")}>
                  Start run <span aria-hidden="true">→</span>
                </button>
                <small className="neon-overlay-note">
                  {hud.runs > 0 ? `${hud.runs} runs logged · ${hud.missionsCompleted} missions cleared` : "No account needed. Records save in this browser."}
                </small>
              </div>
            </div>
          )}

          {hud.status === "paused" && (
            <div className="neon-overlay neon-overlay--paused">
              <div className="neon-overlay-card">
                <p className="neon-kicker">RUN PAUSED</p>
                <h2>Take a breath</h2>
                <p className="neon-lede">The neon will wait.</p>
                <button className="neon-start" type="button" onClick={() => act("pause")}>
                  Resume run <span aria-hidden="true">→</span>
                </button>
                <small className="neon-overlay-note">Press P or Esc to pause at any time.</small>
              </div>
            </div>
          )}

          {hud.status === "over" && (
            <div className="neon-overlay neon-overlay--over">
              <div className="neon-overlay-card">
                <p className="neon-kicker">RUN OVER</p>
                <h2>{hud.distance} m</h2>
                <p className="neon-run-level">
                  Reached level {hud.level} · {hud.levelName}
                </p>
                <div className="neon-summary">
                  <div>
                    <span>Score</span>
                    <b>{hud.score.toLocaleString()}</b>
                  </div>
                  <div>
                    <span>Near misses</span>
                    <b>{hud.nearMisses}</b>
                  </div>
                  <div>
                    <span>Orbs</span>
                    <b>{hud.orbs}</b>
                  </div>
                  <div>
                    <span>Best combo</span>
                    <b>×{Math.max(1, hud.bestCombo)}</b>
                  </div>
                </div>
                <p className={`neon-record${hud.newRecord ? " is-new" : ""}`}>
                  {hud.newRecord ? "New personal best!" : `Personal best · ${hud.bestDistance} m · ${hud.bestScore.toLocaleString()} pts`}
                </p>
                <div className="neon-overlay-actions">
                  <button className="neon-start" type="button" onClick={() => act("jump")}>
                    Run again <span aria-hidden="true">→</span>
                  </button>
                  <Link className="neon-secondary" href="/">
                    All games
                  </Link>
                </div>
                <small className="neon-overlay-note">{hud.mission.progress.toLocaleString()} / {hud.mission.target.toLocaleString()} toward “{hud.mission.label}”</small>
              </div>
            </div>
          )}

          <div className="neon-scanlines" aria-hidden="true" />
        </div>

        <div className="neon-controls">
          <button type="button" className="neon-touch neon-touch--jump" onClick={() => act("jump")} disabled={hud.status === "paused"}>
            Jump
          </button>
          <button type="button" className="neon-touch neon-touch--slide" onClick={() => act("slide")} disabled={hud.status === "paused"}>
            Slide
          </button>
          <p>{playing ? "Space / ↑ jump · ↓ slide · P pause · M sound" : hud.status === "paused" ? "Paused — press P or tap Resume" : "Tap the track or press Space to start"}</p>
        </div>

        <p className="sr-only" role="status">
          {playing
            ? `Level ${hud.level}, ${hud.levelName}. Running. ${hud.distance} metres, score ${hud.score}. Mission: ${hud.mission.label}, ${hud.mission.progress} of ${hud.mission.target}.`
            : hud.status === "over"
              ? `Run over at level ${hud.level}, ${hud.distance} metres, score ${hud.score}.`
              : hud.status === "paused"
                ? "Run paused."
                : "Neon Dash ready. Press Space to start."}
        </p>
      </section>
    </main>
  );
}
