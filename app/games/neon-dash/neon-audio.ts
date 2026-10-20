/**
 * Tiny WebAudio sound kit for Neon Dash.
 *
 * Everything is synthesised on the fly — no audio files to load, and the
 * AudioContext is only created after a user gesture so mobile browsers allow it.
 */

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

export type NeonSound =
  | "jump"
  | "double"
  | "slide"
  | "orb"
  | "near"
  | "slide-under"
  | "level"
  | "mission"
  | "dead"
  | "start"
  | "ui";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

const VOLUME = 0.6;

function ensureContext(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined") return null;
  const Audio = window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!Audio) return null;
  try {
    if (!context || context.state === "closed") {
      context = new Audio();
      master = context.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(context.destination);
    }
    if (context.state === "suspended") void context.resume();
    if (!master) return null;
    return { ctx: context, out: master };
  } catch {
    return null;
  }
}

/** Called from the first tap/click so iOS and Android unlock audio. */
export function unlockNeonAudio() {
  ensureContext();
}

export function setNeonMuted(value: boolean) {
  muted = value;
  if (context && master) {
    try {
      master.gain.setTargetAtTime(value ? 0 : VOLUME, context.currentTime, 0.015);
    } catch {
      master.gain.value = value ? 0 : VOLUME;
    }
  }
}

export function isNeonMuted() {
  return muted;
}

type ToneOptions = {
  from: number;
  to?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
};

function tone(ctx: AudioContext, out: GainNode, options: ToneOptions) {
  const start = ctx.currentTime + (options.delay ?? 0);
  const end = start + options.duration;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.from, start);
  if (options.to && options.to !== options.from) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, options.to), end);
  }
  const peak = options.gain ?? 0.08;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(envelope);
  envelope.connect(out);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function whoosh(ctx: AudioContext, out: GainNode, duration: number, level: number, frequency: number) {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frames; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / frames);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 0.9;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(level, ctx.currentTime);
  envelope.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(out);
  source.start();
}

/** Plays one sound effect. Safe to call when audio is unavailable. */
export function playNeonSound(name: NeonSound) {
  if (muted) return;
  const audio = ensureContext();
  if (!audio) return;
  const { ctx, out } = audio;

  try {
    switch (name) {
      case "jump":
        tone(ctx, out, { from: 300, to: 620, duration: 0.16, gain: 0.075 });
        break;
      case "double":
        tone(ctx, out, { from: 480, to: 980, duration: 0.14, type: "triangle", gain: 0.07 });
        tone(ctx, out, { from: 720, to: 1240, duration: 0.12, delay: 0.03, gain: 0.045 });
        break;
      case "slide":
        whoosh(ctx, out, 0.22, 0.06, 850);
        tone(ctx, out, { from: 210, to: 88, duration: 0.18, type: "sawtooth", gain: 0.04 });
        break;
      case "orb":
        tone(ctx, out, { from: 880, to: 1320, duration: 0.1, gain: 0.065 });
        tone(ctx, out, { from: 1320, to: 1760, duration: 0.09, delay: 0.06, gain: 0.045 });
        break;
      case "near":
        tone(ctx, out, { from: 1450, to: 2100, duration: 0.09, type: "triangle", gain: 0.05 });
        tone(ctx, out, { from: 1800, to: 2500, duration: 0.07, delay: 0.045, gain: 0.04 });
        break;
      case "slide-under":
        whoosh(ctx, out, 0.16, 0.05, 620);
        tone(ctx, out, { from: 160, to: 92, duration: 0.14, gain: 0.04 });
        break;
      case "level":
        [392, 523, 659, 784].forEach((frequency, index) => {
          tone(ctx, out, { from: frequency, duration: 0.16, delay: index * 0.085, type: "triangle", gain: 0.075 });
        });
        break;
      case "mission":
        [523, 659, 784, 1047].forEach((frequency, index) => {
          tone(ctx, out, { from: frequency, duration: 0.14, delay: index * 0.09, gain: 0.07 });
        });
        break;
      case "dead":
        tone(ctx, out, { from: 240, to: 58, duration: 0.48, type: "sawtooth", gain: 0.09 });
        whoosh(ctx, out, 0.32, 0.08, 300);
        break;
      case "start":
        tone(ctx, out, { from: 440, to: 660, duration: 0.18, type: "triangle", gain: 0.07 });
        tone(ctx, out, { from: 660, to: 880, duration: 0.16, delay: 0.1, gain: 0.05 });
        break;
      case "ui":
        tone(ctx, out, { from: 560, to: 620, duration: 0.06, gain: 0.035 });
        break;
    }
  } catch {
    /* Mobile browsers may still refuse audio in silent mode. */
  }
}
