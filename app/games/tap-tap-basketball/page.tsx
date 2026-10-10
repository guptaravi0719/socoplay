"use client";

import Link from "next/link";
import { startTransition, type CSSProperties, useEffect, useRef, useState } from "react";
import { legacyStorageKeys, readStored, storageKeys, writeStored } from "../../lib/storage";

type Phase = "ready" | "playing" | "finished";
type Ball = { x: number; y: number; vx: number; vy: number; rotation: number };
type Hoop = { x: number; y: number };
type Save = { best?: number; lastScore?: number; lastStreak?: number };

let courtAudio: AudioContext | null = null;
function playCourtSound(kind: "tap" | "score" | "whistle" | "over") {
  if (typeof window === "undefined") return;
  try {
    const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    const context = courtAudio && courtAudio.state !== "closed" ? courtAudio : new Audio();
    courtAudio = context;
    if (context.state === "suspended") void context.resume();
    const notes = kind === "whistle" ? [880, 1175] : kind === "score" ? [523, 659, 784] : kind === "over" ? [220, 174] : [180];
    notes.forEach((note, index) => {
      const oscillator = context.createOscillator(); const gain = context.createGain(); const at = context.currentTime + index * (kind === "tap" ? 0 : .07);
      oscillator.type = kind === "tap" ? "triangle" : kind === "whistle" ? "sine" : "square";
      oscillator.frequency.setValueAtTime(note, at); oscillator.frequency.exponentialRampToValueAtTime(kind === "tap" ? 118 : note * 1.08, at + .09);
      gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(kind === "whistle" ? .1 : .075, at + .012); gain.gain.exponentialRampToValueAtTime(.0001, at + (kind === "score" ? .22 : .13));
      oscillator.connect(gain).connect(context.destination); oscillator.start(at); oscillator.stop(at + (kind === "score" ? .24 : .15));
    });
  } catch { /* Browsers can decline audio; the game still plays. */ }
}

const initialBall = (): Ball => ({ x: 17, y: 73, vx: 19, vy: -8, rotation: 0 });
const firstHoop: Hoop = { x: 74, y: 46 };
function nextHoop(score: number): Hoop { return { x: 42 + ((score * 23 + 19) % 47), y: 28 + ((score * 17 + 13) % 33) }; }
function remember(score: number, best: number, streak: number) {
  const item = { id: "tap-tap-basketball", name: "Tap Tap Basketball", icon: "🏀", href: "/games/tap-tap-basketball", progress: score ? `${score} baskets · ${streak} streak` : "Ready to play", tone: "coral" };
  const saved = readStored<typeof item[]>(storageKeys.recent, legacyStorageKeys.recent); const old = Array.isArray(saved) ? saved : [];
  writeStored(storageKeys.recent, [item, ...old.filter((entry) => entry.id !== item.id)].slice(0, 6));
}

export default function TapTapBasketball() {
  const [phase, setPhase] = useState<Phase>("ready"); const [score, setScore] = useState(0); const [best, setBest] = useState(0); const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); const [ball, setBall] = useState<Ball>(initialBall); const [hoop, setHoop] = useState<Hoop>(firstHoop); const [callout, setCallout] = useState(""); const [loaded, setLoaded] = useState(false);
  const ballRef = useRef<Ball>(initialBall()); const hoopRef = useRef<Hoop>(firstHoop); const timeRef = useRef(10); const streakRef = useRef(0); const scoreRef = useRef(0);

  useEffect(() => { const save = readStored<Save>(storageKeys.tapTapBasketball, legacyStorageKeys.tapTapBasketball); startTransition(() => { setBest(save?.best || 0); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) { writeStored(storageKeys.tapTapBasketball, { best, lastScore: score, lastStreak: streak }); remember(score, best, streak); } }, [best, loaded, score, streak]);

  const resetRun = () => { const freshBall = initialBall(); ballRef.current = freshBall; hoopRef.current = firstHoop; timeRef.current = 10; scoreRef.current = 0; streakRef.current = 0; setBall(freshBall); setHoop(firstHoop); setTimeLeft(10); setScore(0); setStreak(0); setCallout("GO!"); setPhase("playing"); playCourtSound("whistle"); };
  const scoreBasket = () => {
    const nextScore = scoreRef.current + 1; const nextStreak = streakRef.current + 1; const freshBall = { ...initialBall(), x: 13, vx: 21 + Math.min(nextScore, 9) * .45 }; const freshHoop = nextHoop(nextScore);
    scoreRef.current = nextScore; streakRef.current = nextStreak; ballRef.current = freshBall; hoopRef.current = freshHoop; timeRef.current = Math.min(10, timeRef.current + 3.5);
    setScore(nextScore); setStreak(nextStreak); setBest((value) => Math.max(value, nextScore)); setBall(freshBall); setHoop(freshHoop); setTimeLeft(Math.ceil(timeRef.current)); setCallout(nextStreak >= 3 ? "ON FIRE!" : "SWISH!"); playCourtSound("score");
  };

  useEffect(() => {
    if (phase !== "playing") return;
    let frame = 0; let previous = performance.now();
    const step = (now: number) => {
      const dt = Math.min(.035, (now - previous) / 1000); previous = now; const next = { ...ballRef.current }; const oldY = next.y;
      next.vy += 58 * dt; next.x += next.vx * dt; next.y += next.vy * dt; next.rotation += next.vx * dt * 5;
      if (next.x > 105) next.x = -5; if (next.x < -5) next.x = 105; if (next.y < -6) { next.y = -6; next.vy = Math.abs(next.vy) * .72; } if (next.y > 84) { next.y = 84; next.vy = -Math.max(20, Math.abs(next.vy) * .64); }
      const target = hoopRef.current;
      if (next.vy > 0 && oldY < target.y && next.y >= target.y && Math.abs(next.x - target.x) < 4.4) scoreBasket(); else { ballRef.current = next; setBall(next); }
      timeRef.current -= dt; setTimeLeft(Math.max(0, Math.ceil(timeRef.current)));
      if (timeRef.current <= 0) { setPhase("finished"); setCallout("BUZZER!"); playCourtSound("over"); return; }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame);
  }, [phase]);

  const tapCourt = () => { if (phase !== "playing") { resetRun(); return; } ballRef.current = { ...ballRef.current, vy: Math.max(-43, ballRef.current.vy - 23) }; setBall(ballRef.current); setCallout(""); playCourtSound("tap"); };
  const message = phase === "ready" ? "Tap anywhere to begin. Each tap gives the ball another lift." : phase === "finished" ? `Final score: ${score}. Tap for another run.` : "Keep the ball in the air and guide it through the next hoop.";

  return <main className="mini-game basketball-game"><header className="hub-nav"><Link className="hub-brand" href="/"><span>◆</span> SocoPlay</Link><nav><Link href="/">Discover</Link><Link href="/#top-picks">Play now</Link></nav><Link className="back-link" href="/">← All games</Link></header><section className="mini-game-stage basketball-stage"><div className="game-intro"><p>ARCADE · LOCAL SAVE</p><h1>Tap Tap Basketball</h1><span>{message}</span></div><div className="mini-layout"><section className="puzzle-card basketball-card"><div className="basketball-stats"><div><span>SCORE</span><b>{score}</b></div><div><span>BEST</span><b>{best}</b></div><div><span>TIME</span><b>{timeLeft}s</b></div><div><span>STREAK</span><b>{streak || "—"}</b></div></div><button className={`basketball-court ${phase}`} type="button" onClick={tapCourt} data-sound-owned aria-label={phase === "playing" ? "Tap to boost the basketball" : "Start a Tap Tap Basketball game"}><span className="court-timer" style={{ "--time": `${timeLeft * 10}%` } as CSSProperties} /><span className="court-lights" aria-hidden="true">✦ ✦ ✦</span><span className="court-crowd" aria-hidden="true">▴ ▴ ▴ ▴ ▴ ▴ ▴ ▴</span><span className="basketball-hoop" aria-hidden="true" style={{ "--hoop-x": `${hoop.x}%`, "--hoop-y": `${hoop.y}%` } as CSSProperties}><i /><b /></span><span className={`basketball-ball ${streak >= 3 ? "on-fire" : ""}`} aria-hidden="true" style={{ "--ball-x": `${ball.x}%`, "--ball-y": `${ball.y}%`, "--ball-rotation": `${ball.rotation}deg` } as CSSProperties}>🏀</span>{callout && <span className="basketball-callout" key={`${callout}-${score}`}>{callout}</span>}<span className="court-prompt">{phase === "playing" ? "TAP TO BOOST" : phase === "finished" ? "TAP TO RESTART" : "TAP TO START"}</span></button><div className="mini-actions"><button type="button" onClick={resetRun} data-sound-owned>↻ New round</button><b>{streak >= 3 ? "Hot streak bonus active" : "Score before the timer empties"}</b></div></section><aside className="mini-side"><div className="save-badge">● Best score saved locally</div><h2>One tap. One boost. One more basket.</h2><p>Keep the ball in the air, time each boost, and chase the hoop before the shot clock fades out.</p></aside></div></section></main>;
}
