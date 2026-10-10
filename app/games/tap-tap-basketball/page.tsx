"use client";

import Link from "next/link";
import { startTransition, type CSSProperties, useEffect, useRef, useState } from "react";
import { legacyStorageKeys, readStored, storageKeys, writeStored } from "../../lib/storage";

type Phase = "ready" | "playing" | "paused" | "finished";
type Ball = { x: number; y: number; vx: number; vy: number; rotation: number };
type Hoop = { x: number; y: number };
type Save = { best?: number; lastScore?: number; lastStreak?: number };

let courtAudio: AudioContext | null = null;
function playCourtSound(kind: "tap" | "score" | "whistle" | "over", enabled = true) {
  if (!enabled) return;
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

const firstHoop: Hoop = { x: 76, y: 54 };
function serveBall(hoop: Hoop): Ball {
  const x = hoop.x > 50 ? 9 : 91;
  const vx = hoop.x > 50 ? 28 : -28;
  const y = 78;
  const travelSeconds = Math.abs((hoop.x - x) / vx);
  // Set a natural arc which arrives at the hoop even on a player's first launch.
  const vy = (hoop.y - y - 12 * travelSeconds * travelSeconds) / travelSeconds;
  return { x, y, vx, vy, rotation: 0 };
}
const initialBall = (): Ball => serveBall(firstHoop);
function nextHoop(score: number): Hoop { return { x: score % 2 ? 24 : 76, y: 43 + ((score * 13 + 7) % 17) }; }
function remember(score: number, best: number, streak: number) {
  const item = { id: "tap-tap-basketball", name: "Tap Tap Basketball", icon: "🏀", href: "/games/tap-tap-basketball", progress: score ? `${score} baskets · ${streak} streak` : "Ready to play", tone: "coral" };
  const saved = readStored<typeof item[]>(storageKeys.recent, legacyStorageKeys.recent); const old = Array.isArray(saved) ? saved : [];
  writeStored(storageKeys.recent, [item, ...old.filter((entry) => entry.id !== item.id)].slice(0, 6));
}

export default function TapTapBasketball() {
  const [phase, setPhase] = useState<Phase>("ready"); const [score, setScore] = useState(0); const [best, setBest] = useState(0); const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); const [ball, setBall] = useState<Ball>(initialBall); const [hoop, setHoop] = useState<Hoop>(firstHoop); const [callout, setCallout] = useState(""); const [loaded, setLoaded] = useState(false); const [soundOn, setSoundOn] = useState(true); const [isScoring, setIsScoring] = useState(false);
  const ballRef = useRef<Ball>(initialBall()); const hoopRef = useRef<Hoop>(firstHoop); const timeRef = useRef(10); const streakRef = useRef(0); const scoreRef = useRef(0); const soundRef = useRef(true); const scoringRef = useRef(false); const boostCountRef = useRef(0); const serveTimerRef = useRef<number | null>(null);

  useEffect(() => { const save = readStored<Save>(storageKeys.tapTapBasketball, legacyStorageKeys.tapTapBasketball); startTransition(() => { setBest(save?.best || 0); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) { writeStored(storageKeys.tapTapBasketball, { best, lastScore: score, lastStreak: streak }); remember(score, best, streak); } }, [best, loaded, score, streak]);

  useEffect(() => () => { if (serveTimerRef.current) window.clearTimeout(serveTimerRef.current); }, []);
  const resetRun = () => { if (serveTimerRef.current) window.clearTimeout(serveTimerRef.current); const freshBall = initialBall(); scoringRef.current = false; boostCountRef.current = 0; ballRef.current = freshBall; hoopRef.current = firstHoop; timeRef.current = 10; scoreRef.current = 0; streakRef.current = 0; setBall(freshBall); setHoop(firstHoop); setTimeLeft(10); setScore(0); setStreak(0); setIsScoring(false); setCallout("GO!"); setPhase("playing"); playCourtSound("whistle", soundRef.current); };
  const scoreBasket = () => {
    const nextScore = scoreRef.current + 1; const nextStreak = streakRef.current + 1; const scoredBall = { ...ballRef.current, x: hoopRef.current.x, y: hoopRef.current.y + 5, vy: 0 };
    scoreRef.current = nextScore; streakRef.current = nextStreak; scoringRef.current = true; timeRef.current = Math.min(10, timeRef.current + 3.5);
    ballRef.current = scoredBall; setScore(nextScore); setStreak(nextStreak); setBest((value) => Math.max(value, nextScore)); setBall(scoredBall); setIsScoring(true); setTimeLeft(Math.ceil(timeRef.current)); setCallout(nextStreak >= 3 ? "ON FIRE!" : "SWISH!"); playCourtSound("score", soundRef.current);
    serveTimerRef.current = window.setTimeout(() => { const freshHoop = nextHoop(nextScore); const freshBall = serveBall(freshHoop); boostCountRef.current = 0; hoopRef.current = freshHoop; ballRef.current = freshBall; scoringRef.current = false; setHoop(freshHoop); setBall(freshBall); setIsScoring(false); }, 460);
  };

  useEffect(() => {
    if (phase !== "playing") return;
    let frame = 0; let previous = performance.now();
    const step = (now: number) => {
      const dt = Math.min(.035, (now - previous) / 1000); previous = now;
      if (scoringRef.current) { frame = requestAnimationFrame(step); return; }
      const next = { ...ballRef.current }; const oldY = next.y;
      next.vy += 24 * dt; next.x += next.vx * dt; next.y += next.vy * dt; next.rotation += next.vx * dt * 5;
      if (next.x > 105) next.x = -5; if (next.x < -5) next.x = 105; if (next.y < -6) { next.y = -6; next.vy = Math.abs(next.vy) * .72; } if (next.y > 87) { next.y = 87; next.vy = -Math.max(18, Math.abs(next.vy) * .64); }
      const target = hoopRef.current;
      const inHoopLane = Math.abs(next.x - target.x) < 9 && next.y > target.y - 17 && next.y < target.y + 14;
      if (boostCountRef.current > 0 && ((next.vy > 0 && oldY < target.y && next.y >= target.y && Math.abs(next.x - target.x) < 9) || inHoopLane)) scoreBasket(); else { ballRef.current = next; setBall(next); }
      timeRef.current -= dt; setTimeLeft(Math.max(0, Math.ceil(timeRef.current)));
      if (timeRef.current <= 0) { setPhase("finished"); setCallout("BUZZER!"); playCourtSound("over", soundRef.current); return; }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame);
  }, [phase]);

  const tapCourt = () => {
    if (isScoring) return;
    if (phase === "paused") { setPhase("playing"); return; }
    if (phase !== "playing") { resetRun(); return; }
    boostCountRef.current += 1;
    const target = hoopRef.current;
    const secondsToHoop = Math.max(.18, Math.abs((target.x - ballRef.current.x) / ballRef.current.vx));
    const guidedVy = (target.y - ballRef.current.y - 12 * secondsToHoop * secondsToHoop) / secondsToHoop;
    // The tap is a real upward boost, but it also gently corrects toward the hoop.
    ballRef.current = { ...ballRef.current, vy: Math.max(-52, ballRef.current.vy + (guidedVy - ballRef.current.vy) * .65 - 2) };
    setBall(ballRef.current); setCallout(""); playCourtSound("tap", soundRef.current);
  };
  const toggleSound = () => { const next = !soundRef.current; soundRef.current = next; setSoundOn(next); if (next) playCourtSound("tap", true); };
  const message = phase === "ready" ? "Tap anywhere to begin. Each tap gives the ball another lift." : phase === "paused" ? "Paused — tap the court or press play to continue." : phase === "finished" ? `Final score: ${score}. Tap for another run.` : "Keep the ball in the air and guide it through the next hoop.";

  return <main className="mini-game basketball-game"><header className="hub-nav"><Link className="hub-brand" href="/"><span>◆</span> SocoPlay</Link><nav><Link href="/">Discover</Link><Link href="/#top-picks">Play now</Link></nav><Link className="back-link" href="/">← All games</Link></header><section className="mini-game-stage basketball-stage"><div className="game-intro"><p>ARCADE · LOCAL SAVE</p><h1>Tap Tap Basketball</h1><span>{message}</span></div><div className="mini-layout"><section className="puzzle-card basketball-card"><div className="basketball-stats"><div><span>SCORE</span><b>{score}</b></div><div><span>BEST</span><b>{best}</b></div><div><span>TIME</span><b>{timeLeft}s</b></div><div><span>STREAK</span><b>{streak || "—"}</b></div></div><div className={`basketball-court ${phase}`} role="button" tabIndex={0} onClick={tapCourt} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); tapCourt(); } }} data-sound-owned aria-label={phase === "playing" ? "Tap to boost the basketball" : "Start a Tap Tap Basketball game"}><span className="court-timer" style={{ "--time": `${timeLeft * 10}%` } as CSSProperties} /><div className="court-controls"><button type="button" onClick={(event) => { event.stopPropagation(); toggleSound(); }} aria-label={soundOn ? "Mute game sounds" : "Enable game sounds"}>{soundOn ? "◖))" : "◖×"}</button><button type="button" onClick={(event) => { event.stopPropagation(); if (phase === "playing") setPhase("paused"); else if (phase === "paused") setPhase("playing"); }} aria-label={phase === "paused" ? "Resume game" : "Pause game"}>{phase === "paused" ? "▶" : "Ⅱ"}</button></div><span className="court-lights" aria-hidden="true">✦ ✦ ✦</span><span className="court-crowd" aria-hidden="true">▴ ▴ ▴ ▴ ▴ ▴ ▴ ▴</span><span className="basketball-hoop" aria-hidden="true" style={{ "--hoop-x": `${hoop.x}%`, "--hoop-y": `${hoop.y}%` } as CSSProperties}><i /><b /></span><span className={`basketball-ball ${isScoring ? "is-scoring" : ""} ${streak >= 3 ? "on-fire" : ""}`} aria-hidden="true" style={{ "--ball-x": `${ball.x}%`, "--ball-y": `${ball.y}%`, "--ball-rotation": `${ball.rotation}deg` } as CSSProperties}><i /><b /></span>{callout && <span className="basketball-callout" key={`${callout}-${score}`}>{callout}</span>}<span className="court-prompt">{phase === "playing" ? "TAP TO BOOST" : phase === "paused" ? "TAP TO CONTINUE" : phase === "finished" ? "TAP TO RESTART" : "TAP TO START"}</span></div><div className="mini-actions"><button type="button" onClick={resetRun} data-sound-owned>↻ New round</button><b>{streak >= 3 ? "Hot streak bonus active" : "Score before the timer empties"}</b></div></section><aside className="mini-side"><div className="save-badge">● Best score saved locally</div><h2>One tap. One boost. One more basket.</h2><p>Keep the ball in the air, time each boost, and chase the hoop before the shot clock fades out.</p></aside></div></section></main>;
}
