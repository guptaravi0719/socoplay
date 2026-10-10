"use client";

import Link from "next/link";
import { startTransition, type CSSProperties, useEffect, useMemo, useState } from "react";
import { legacyStorageKeys, readStored, storageKeys, writeStored } from "../../lib/storage";

type Phase = "ready" | "playing" | "finished";
type Shot = { result: "swish" | "miss"; key: number; x: number } | null;
type Save = { score?: number; best?: number; made?: number; shots?: number; streak?: number; timeLeft?: number; phase?: Phase };

function remember(score: number, best: number, made: number, shots: number) {
  const item = { id: "tap-tap-basketball", name: "Tap Tap Basketball", icon: "🏀", href: "/games/tap-tap-basketball", progress: shots ? `${score} points · ${made}/${shots} shots` : "Ready to shoot", tone: "coral" };
  const saved = readStored<typeof item[]>(storageKeys.recent, legacyStorageKeys.recent);
  const old = Array.isArray(saved) ? saved : [];
  writeStored(storageKeys.recent, [item, ...old.filter((entry) => entry.id !== item.id)].slice(0, 6));
}

export default function TapTapBasketball() {
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [made, setMade] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState<Phase>("ready");
  const [beat, setBeat] = useState(0);
  const [shot, setShot] = useState<Shot>(null);
  const [loaded, setLoaded] = useState(false);

  const hoopX = useMemo(() => 50 + Math.sin(beat / 8) * 28, [beat]);
  const accuracy = Math.abs(hoopX - 50);
  const copy = phase === "finished" ? `Time! You scored ${score} points.` : phase === "ready" ? "Tap the court to start, then shoot when the hoop crosses the middle." : shot?.result === "swish" ? `${streak} in a row — keep it rolling!` : shot?.result === "miss" ? "Just off — wait for the center line." : "Tap when the hoop reaches the center line.";

  useEffect(() => {
    const save = readStored<Save>(storageKeys.tapTapBasketball, legacyStorageKeys.tapTapBasketball);
    startTransition(() => {
      if (save) {
        setScore(save.score || 0); setBest(save.best || 0); setMade(save.made || 0); setShots(save.shots || 0); setStreak(save.streak || 0); setTimeLeft(Math.max(0, Math.min(30, save.timeLeft ?? 30))); setPhase(save.phase === "finished" ? "finished" : "ready");
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => { if (loaded) { writeStored(storageKeys.tapTapBasketball, { score, best, made, shots, streak, timeLeft, phase }); remember(score, best, made, shots); } }, [best, loaded, made, phase, score, shots, streak, timeLeft]);

  useEffect(() => {
    if (phase !== "playing") return;
    const motion = window.setInterval(() => setBeat((value) => value + 1), 55);
    const clock = window.setInterval(() => setTimeLeft((value) => { if (value <= 1) { window.clearInterval(clock); setPhase("finished"); return 0; } return value - 1; }), 1000);
    return () => { window.clearInterval(motion); window.clearInterval(clock); };
  }, [phase]);

  const freshRound = () => { setScore(0); setMade(0); setShots(0); setStreak(0); setTimeLeft(30); setBeat(0); setShot(null); setPhase("playing"); };
  const shoot = () => {
    if (phase === "ready" || phase === "finished") { freshRound(); return; }
    const swish = accuracy < 12;
    const nextStreak = swish ? streak + 1 : 0;
    const points = swish ? 2 + (nextStreak >= 3 ? 1 : 0) : 0;
    setShots((value) => value + 1);
    setShot({ result: swish ? "swish" : "miss", key: Date.now(), x: hoopX });
    if (swish) { setMade((value) => value + 1); setStreak(nextStreak); setScore((value) => { const next = value + points; setBest((current) => Math.max(current, next)); return next; }); } else setStreak(0);
  };

  return <main className="mini-game basketball-game">
    <header className="hub-nav"><Link className="hub-brand" href="/"><span>◆</span> SocoPlay</Link><nav><Link href="/">Discover</Link><Link href="/#top-picks">Play now</Link></nav><Link className="back-link" href="/">← All games</Link></header>
    <section className="mini-game-stage basketball-stage"><div className="game-intro"><p>ARCADE · LOCAL SAVE</p><h1>Tap Tap Basketball</h1><span>{copy}</span></div>
      <div className="mini-layout"><section className="puzzle-card basketball-card">
        <div className="basketball-stats"><div><span>SCORE</span><b>{score}</b></div><div><span>BEST</span><b>{best}</b></div><div><span>TIME</span><b>{timeLeft}s</b></div><div><span>STREAK</span><b>{streak || "—"}</b></div></div>
        <button className={`basketball-court ${phase} ${shot?.result || ""}`} type="button" onClick={shoot} aria-label={phase === "playing" ? "Shoot the basketball" : "Start a basketball round"}>
          <span className="court-lights" aria-hidden="true">✦ ✦ ✦</span><span className="court-crowd" aria-hidden="true">▴ ▴ ▴ ▴ ▴ ▴ ▴ ▴</span>
          <span className="center-target" aria-hidden="true" />
          <span className="basketball-hoop" aria-hidden="true" style={{ "--hoop-x": `${hoopX}%` } as CSSProperties}><i /><b /></span>
          <span className="basketball-ball" aria-hidden="true" key={shot?.key} style={{ "--shot-x": `${shot?.x ?? 50}%` } as CSSProperties}>🏀</span>
          {shot && <span className="basketball-callout" key={`${shot.key}-callout`}>{shot.result === "swish" ? streak >= 3 ? "ON FIRE! +3" : "SWISH! +2" : "RIM OUT"}</span>}
          <span className="court-prompt">{phase === "playing" ? "TAP TO SHOOT" : phase === "finished" ? "TAP FOR A NEW ROUND" : "TAP TO START"}</span>
        </button>
        <div className="mini-actions"><button type="button" onClick={freshRound}>↻ New round</button><b>{shots ? `${made}/${shots} shots made` : "30 second round"}</b></div>
      </section><aside className="mini-side"><div className="save-badge">● Saved locally</div><h2>Find the sweet spot.</h2><p>Tap as the moving hoop reaches the center marker. Make three in a row for bonus points, then try to beat your best score.</p></aside></div>
    </section>
  </main>;
}
