"use client";

import Link from "next/link";
import { startTransition, type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { legacyStorageKeys, readStored, storageKeys, writeStored } from "../../lib/storage";

type Phase = "ready" | "playing" | "finished";
type FruitKind = "apple" | "citrus" | "melon" | "berry" | "plum" | "bomb";
type Fruit = { id: number; kind: FruitKind; x: number; y: number; vx: number; vy: number; size: number; cut?: boolean; cutAt?: number };
type Slash = { id: number; x: number; y: number; length: number; angle: number };
type Save = { best?: number };

const kinds: FruitKind[] = ["apple", "citrus", "melon", "berry", "plum"];
let fruitId = 0;
let slashId = 0;
let audioContext: AudioContext | null = null;

function playSliceSound(kind: "slice" | "combo" | "bomb" | "start" | "over") {
  if (typeof window === "undefined") return;
  try {
    const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    const context = audioContext && audioContext.state !== "closed" ? audioContext : new Audio();
    audioContext = context;
    if (context.state === "suspended") void context.resume();
    const notes = kind === "start" ? [660, 880] : kind === "combo" ? [523, 659, 784] : kind === "bomb" ? [130, 90] : kind === "over" ? [245, 196] : [392];
    notes.forEach((note, index) => {
      const oscillator = context.createOscillator(); const gain = context.createGain(); const at = context.currentTime + index * .055;
      oscillator.type = kind === "bomb" ? "sawtooth" : kind === "slice" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(note, at); oscillator.frequency.exponentialRampToValueAtTime(Math.max(55, note * .72), at + .14);
      gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(kind === "bomb" ? .11 : .075, at + .01); gain.gain.exponentialRampToValueAtTime(.0001, at + .18);
      oscillator.connect(gain).connect(context.destination); oscillator.start(at); oscillator.stop(at + .2);
    });
  } catch { /* Audio support is optional. */ }
}

function distanceToLine(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax; const dy = by - ay;
  if (!dx && !dy) return Math.hypot(px - ax, py - ay);
  const progress = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + progress * dx), py - (ay + progress * dy));
}

function spawnFruit(score: number): Fruit {
  const isBomb = score > 7 && Math.random() < .11;
  return { id: ++fruitId, kind: isBomb ? "bomb" : kinds[Math.floor(Math.random() * kinds.length)], x: 14 + Math.random() * 72, y: 110, vx: -18 + Math.random() * 36, vy: -(128 + Math.random() * 25), size: 9.5 + Math.random() * 3 };
}

function remember(score: number, phase: Phase) {
  const item = { id: "slice-sprint", name: "Slice Sprint", icon: "🍉", href: "/games/slice-sprint", progress: score ? `${score} fruit sliced` : phase === "playing" ? "Slicing now" : "Ready to slice", tone: "lime" };
  const saved = readStored<typeof item[]>(storageKeys.recent, legacyStorageKeys.recent); const old = Array.isArray(saved) ? saved : [];
  writeStored(storageKeys.recent, [item, ...old.filter((entry) => entry.id !== item.id)].slice(0, 6));
}

export default function SliceSprint() {
  const [phase, setPhase] = useState<Phase>("ready"); const [fruits, setFruits] = useState<Fruit[]>([]); const [slashes, setSlashes] = useState<Slash[]>([]);
  const [score, setScore] = useState(0); const [best, setBest] = useState(0); const [lives, setLives] = useState(3); const [seconds, setSeconds] = useState(45); const [combo, setCombo] = useState(0); const [notice, setNotice] = useState("Swipe through fruit. Avoid the bombs."); const [loaded, setLoaded] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null); const fruitsRef = useRef<Fruit[]>([]); const previousPoint = useRef<{ x: number; y: number } | null>(null); const scoreRef = useRef(0); const livesRef = useRef(3); const secondsRef = useRef(45); const comboRef = useRef(0); const spawnRef = useRef(0); const phaseRef = useRef<Phase>("ready");

  useEffect(() => { const save = readStored<Save>(storageKeys.sliceSprint, legacyStorageKeys.sliceSprint); startTransition(() => { setBest(save?.best || 0); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) { writeStored(storageKeys.sliceSprint, { best }); remember(score, phase); } }, [best, loaded, phase, score]);

  const endRound = (message: string) => { if (phaseRef.current !== "playing") return; phaseRef.current = "finished"; setPhase("finished"); setNotice(message); playSliceSound("over"); };
  const startRound = () => { fruitsRef.current = []; previousPoint.current = null; scoreRef.current = 0; livesRef.current = 3; secondsRef.current = 45; comboRef.current = 0; spawnRef.current = 0; phaseRef.current = "playing"; setFruits([]); setSlashes([]); setScore(0); setLives(3); setSeconds(45); setCombo(0); setNotice("Slice a fruit with one clean swipe."); setPhase("playing"); playSliceSound("start"); };

  useEffect(() => {
    if (phase !== "playing") return;
    let frame = 0; let previous = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(.035, (now - previous) / 1000); previous = now; spawnRef.current += dt; secondsRef.current -= dt;
      if (spawnRef.current > Math.max(.45, .78 - scoreRef.current * .008)) { spawnRef.current = 0; const next = [...fruitsRef.current, spawnFruit(scoreRef.current)]; if (Math.random() < .18 && scoreRef.current > 2) next.push(spawnFruit(scoreRef.current)); fruitsRef.current = next; }
      let lost = 0;
      const next = fruitsRef.current.flatMap((fruit) => {
        const moving = { ...fruit, x: fruit.x + fruit.vx * dt, y: fruit.y + fruit.vy * dt, vy: fruit.vy + 78 * dt };
        if (moving.cut && now - (moving.cutAt || now) > 540) return [];
        if (!moving.cut && moving.y > 117) { if (moving.kind !== "bomb") lost += 1; return []; }
        return [moving];
      });
      fruitsRef.current = next; setFruits(next);
      if (lost) { const nextLives = Math.max(0, livesRef.current - lost); livesRef.current = nextLives; comboRef.current = 0; setLives(nextLives); setCombo(0); setNotice(nextLives > 0 ? "Missed fruit! Keep slicing." : "Out of slices — fresh fruit is waiting."); if (nextLives <= 0) { endRound(`Score ${scoreRef.current}. Tap for a fresh run.`); return; } }
      const wholeSeconds = Math.max(0, Math.ceil(secondsRef.current)); setSeconds(wholeSeconds);
      if (secondsRef.current <= 0) { endRound(`Time! Final score: ${scoreRef.current}.`); return; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [phase]);

  const pointFor = (event: ReactPointerEvent<HTMLDivElement>) => { const bounds = boardRef.current?.getBoundingClientRect(); return bounds ? { x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 } : null; };
  const slice = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y); if (length < 1) return;
    setSlashes((value) => [...value, { id: ++slashId, x: from.x, y: from.y, length, angle: Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI }].slice(-9));
    const hit = fruitsRef.current.filter((fruit) => !fruit.cut && distanceToLine(fruit.x, fruit.y, from.x, from.y, to.x, to.y) < fruit.size * .74);
    if (!hit.length) return;
    const bomb = hit.find((fruit) => fruit.kind === "bomb");
    if (bomb) { fruitsRef.current = fruitsRef.current.filter((fruit) => fruit.id !== bomb.id); setFruits(fruitsRef.current); const nextLives = Math.max(0, livesRef.current - 1); livesRef.current = nextLives; comboRef.current = 0; setLives(nextLives); setCombo(0); setNotice(nextLives ? "Bomb! One slice lost." : "Bomb blast — game over."); playSliceSound("bomb"); if (!nextLives) endRound(`Bombed! Final score: ${scoreRef.current}.`); return; }
    const cutAt = performance.now(); const cutIds = new Set(hit.map((fruit) => fruit.id)); fruitsRef.current = fruitsRef.current.map((fruit) => cutIds.has(fruit.id) ? { ...fruit, cut: true, cutAt } : fruit);
    const nextCombo = comboRef.current + hit.length; const points = hit.length + (nextCombo >= 3 ? 1 : 0); scoreRef.current += points; comboRef.current = nextCombo;
    setFruits(fruitsRef.current); setScore(scoreRef.current); setCombo(nextCombo); setBest((value) => Math.max(value, scoreRef.current)); setNotice(nextCombo >= 3 ? `Combo ×${nextCombo}!` : hit.length > 1 ? "Double slice!" : "Clean slice!"); playSliceSound(nextCombo >= 3 ? "combo" : "slice");
  };
  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => { if (phaseRef.current !== "playing") startRound(); const point = pointFor(event); if (!point) return; event.currentTarget.setPointerCapture(event.pointerId); previousPoint.current = point; };
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => { if (phaseRef.current !== "playing" || !previousPoint.current) return; const point = pointFor(event); if (!point) return; slice(previousPoint.current, point); previousPoint.current = point; };
  const onUp = () => { previousPoint.current = null; };

  return <main className="mini-game slice-game"><header className="hub-nav"><Link className="hub-brand" href="/"><span>◆</span> SocoPlay</Link><nav><Link href="/">Discover</Link><Link href="/#top-picks">Play now</Link></nav><Link className="back-link" href="/">← All games</Link></header><section className="mini-game-stage slice-stage"><div className="game-intro"><p>ARCADE · LOCAL SAVE</p><h1>Slice Sprint</h1><span>{notice}</span></div><div className="mini-layout"><section className="puzzle-card slice-card"><div className="slice-stats"><div><span>SCORE</span><b>{score}</b></div><div><span>BEST</span><b>{best}</b></div><div><span>TIME</span><b>{seconds}s</b></div><div><span>SLICES</span><b>{"♥".repeat(lives)}{"♡".repeat(3 - lives)}</b></div></div><div ref={boardRef} className={`slice-board ${phase}`} role="application" aria-label="Slice Sprint game board. Drag across fruit to slice it and avoid bombs." data-sound-owned onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>{fruits.map((fruit) => <span className={`slice-fruit ${fruit.kind} ${fruit.cut ? "is-cut" : ""}`} key={fruit.id} style={{ "--fruit-x": `${fruit.x}%`, "--fruit-y": `${fruit.y}%`, "--fruit-size": `${fruit.size}%` } as CSSProperties}><i /><b /></span>)}{slashes.map((slash) => <i className="slice-trail" aria-hidden="true" key={slash.id} style={{ "--slash-x": `${slash.x}%`, "--slash-y": `${slash.y}%`, "--slash-length": `${slash.length}%`, "--slash-angle": `${slash.angle}deg` } as CSSProperties} />)}<span className="slice-board-copy">{phase === "playing" ? "SWIPE TO SLICE" : phase === "finished" ? "TAP FOR A NEW RUN" : "TAP TO START"}</span></div><div className="mini-actions"><button type="button" onClick={startRound} data-sound-owned>↻ New run</button><b>{combo >= 3 ? `Combo ×${combo}` : "Avoid bombs"}</b></div></section><aside className="mini-side"><div className="save-badge">● Best score saved locally</div><h2>One clean swipe at a time.</h2><p>Slice fruit in the air, chain several pieces for a combo, and keep clear of the black bombs.</p></aside></div></section></main>;
}
