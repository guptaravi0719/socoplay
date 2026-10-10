"use client";

import { startTransition, useEffect, useState } from "react";

type LegacyAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
let sharedAudioContext: AudioContext | null = null;

const help = {
  "/games/solitaire": { title: "Solitaire help", rules: ["Build downward in alternating red and black cards.", "Move Aces through Kings to their matching foundation piles.", "On mobile, tap a card and then tap where you want to place it."], tip: "Use Hint whenever you are stuck; it highlights a useful move." },
  "/games/2048": { title: "2048 help", rules: ["Swipe or use arrow keys to slide every tile.", "Matching numbers combine into a larger tile.", "Keep open spaces available and build toward 2048."], tip: "Keep your largest number in a corner and use Undo to rethink a move." },
  "/games/tile-shift": { title: "Tile Shift help", rules: ["Tap a tile beside the empty space to move it.", "Put the tiles in order from 1 to 15.", "Finish with the blank space in the lower-right corner."], tip: "Solve one row at a time to leave yourself room." },
  "/games/flip-pairs": { title: "Flip Pairs help", rules: ["Tap two cards to reveal their symbols.", "Matching pairs remain face up.", "Clear all six pairs with as few tries as you can."], tip: "Remember where each symbol appears before opening a new card." },
  "/games/word-bloom": { title: "Word Bloom help", rules: ["Read the shuffled letters.", "Type the word you think they form.", "Check your answer, then choose a new word when ready."], tip: "Look for common beginnings and endings first." },
  "/games/tap-tap-basketball": { title: "Tap Tap Basketball help", rules: ["Tap the court to start a 30-second round.", "Tap again when the moving hoop crosses the center marker.", "Make three baskets in a row for a bonus point."], tip: "The closer the hoop is to the middle, the cleaner your shot." },
} as const;

const tones = {
  "/games/solitaire": [262, 392, "triangle"],
  "/games/2048": [196, 294, "square"],
  "/games/tile-shift": [330, 495, "sine"],
  "/games/flip-pairs": [523, 784, "triangle"],
  "/games/word-bloom": [440, 659, "sine"],
  "/games/tap-tap-basketball": [150, 225, "sine"],
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
