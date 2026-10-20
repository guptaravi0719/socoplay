"use client";

import { startTransition, useEffect, useState } from "react";

type LegacyAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
let sharedAudioContext: AudioContext | null = null;

const help = {
  "/games/solitaire": { title: "Solitaire help", rules: ["Build downward in alternating red and black cards.", "Move Aces through Kings to their matching foundation piles.", "On mobile, tap a card and then tap where you want to place it."], tip: "Use Hint whenever you are stuck; it highlights a useful move." },
  "/games/spider-solitaire": { title: "Spider Solitaire help", rules: ["Move same-suit descending runs onto a card one rank higher.", "Any card or run can fill an empty column.", "Complete King-to-Ace runs in one suit to clear them; deal only when every column has a card."], tip: "Start with 1 suit, then try 2 or 4. Use Hint when stuck and Undo to test a different plan." },
  "/games/2048": { title: "2048 help", rules: ["Swipe or use arrow keys to slide every tile.", "Matching numbers combine into a larger tile.", "Keep open spaces available and build toward 2048."], tip: "Keep your largest number in a corner and use Undo to rethink a move." },
  "/games/tower": { title: "Tower Stack help", rules: ["Tap Start stacking to begin a round.", "Tap the game area to release the swinging block.", "Build carefully and keep your three hearts."], tip: "Aim for the center of the tower; clean drops make it easier to keep building." },
} as const;

const tones = {
  "/games/solitaire": [262, 392, "triangle"],
  "/games/spider-solitaire": [262, 392, "triangle"],
  "/games/tower": [294, 440, "triangle"],
} as const;

export function GameEnhancements() {
  const [path, setPath] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => { startTransition(() => setPath(window.location.pathname)); }, []);

  useEffect(() => {
    const sound = tones[path as keyof typeof tones];
    if (!sound) return;
    let lastPlayed = 0;
    const play = (event: PointerEvent | KeyboardEvent) => {
      if ("key" in event && !["Enter", " ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      if (!("key" in event) && event.target instanceof Element && (!event.target.closest("button, input, [role=application]") || event.target.closest("[data-sound-owned]"))) return;
      if (Date.now() - lastPlayed < 80) return;
      lastPlayed = Date.now();
      const Audio = window.AudioContext || (window as LegacyAudioWindow).webkitAudioContext;
      if (!Audio) return;
      try {
        const context = sharedAudioContext && sharedAudioContext.state !== "closed" ? sharedAudioContext : new Audio();
        sharedAudioContext = context;
        // iOS Safari often leaves a freshly-created context suspended until this exact tap/key event.
        if (context.state === "suspended") void context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = sound[2];
        oscillator.frequency.setValueAtTime(sound[0], context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(sound[1], context.currentTime + 0.12);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.21);
      } catch { /* The browser or device can decline Web Audio; gameplay still works. */ }
    };
    window.addEventListener("pointerdown", play, { capture: true });
    window.addEventListener("keydown", play, { capture: true });
    return () => { window.removeEventListener("pointerdown", play, { capture: true }); window.removeEventListener("keydown", play, { capture: true }); };
  }, [path]);

  const details = help[path as keyof typeof help];
  if (!details) return null;
  return <><button className="game-help-button" type="button" onClick={() => setOpen(true)} aria-label="Show game help">i</button>{open && <div className="game-help-backdrop" role="presentation"><section className="game-help-dialog" role="dialog" aria-modal="true" aria-labelledby="game-help-title"><button className="game-help-close" type="button" onClick={() => setOpen(false)} aria-label="Close help">×</button><p>HOW TO PLAY</p><h2 id="game-help-title">{details.title}</h2><ol>{details.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol><strong>Tip</strong><span>{details.tip}</span></section></div>}</>;
}
