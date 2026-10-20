/**
 * Neon Dash — endless runner engine.
 *
 * Pure game logic: the React page owns input, rendering, and storage.
 * Everything here is deterministic apart from obstacle variety, which is fine
 * because a run only ever exists in one browser tab.
 */

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 480;
export const GROUND_Y = 402;
export const PLAYER_X = 172;
export const PLAYER_WIDTH = 34;
export const PLAYER_HEIGHT = 58;
export const SLIDE_HEIGHT = 30;
export const GRAVITY = 2500;
export const JUMP_VELOCITY = -900;
export const AIR_JUMP_VELOCITY = -780;
export const SLIDE_DURATION = 0.62;
export const BASE_SPEED = 340;
export const MAX_SPEED = 900;
export const SPEED_GAIN = 7.5;
export const PIXELS_PER_METER = 10;
const COMBO_WINDOW = 3.4;
const NEAR_MISS_CLEARANCE = 26;
const GATE_HEIGHT = 76;
const GATE_BOTTOM = GROUND_Y - 42;
export const LEVEL_DISTANCE = 350;
export const LEVEL_NAMES = [
  "Neon Dawn",
  "Grid Runner",
  "Pulse City",
  "Laser Canyon",
  "Synth Storm",
  "Ultraviolet",
  "Overdrive",
  "Singularity",
] as const;

export function levelName(level: number) {
  return LEVEL_NAMES[(Math.max(1, level) - 1) % LEVEL_NAMES.length];
}

export type GameStatus = "ready" | "playing" | "paused" | "over";
export type ObstacleKind = "block" | "tall" | "gate";
export type MissionMetric = "distance" | "score" | "jumps" | "orbs" | "nearMisses" | "slides" | "level";
export type MissionKind = "run" | "lifetime";

export type Mission = {
  id: string;
  label: string;
  hint: string;
  metric: MissionMetric;
  target: number;
  kind: MissionKind;
};

export const MISSIONS: Mission[] = [
  { id: "distance-250", label: "Reach 250 m in a single run", hint: "Settle into a rhythm and let the distance build.", metric: "distance", target: 250, kind: "run" },
  { id: "jumps-10", label: "Jump 10 times", hint: "Jump with Space, ↑, or a tap on the track.", metric: "jumps", target: 10, kind: "lifetime" },
  { id: "orbs-6", label: "Collect 6 energy orbs", hint: "Orbs float above the track. Jump to grab them.", metric: "orbs", target: 6, kind: "lifetime" },
  { id: "near-5", label: "Earn 5 near misses", hint: "Clear a hazard by the slimmest margin for a bonus.", metric: "nearMisses", target: 5, kind: "lifetime" },
  { id: "slides-4", label: "Slide under 4 gates", hint: "Press ↓ or swipe down to slide beneath a gate.", metric: "slides", target: 4, kind: "lifetime" },
  { id: "score-1200", label: "Score 1,200 in a single run", hint: "Distance, orbs, and near-miss combos all add up.", metric: "score", target: 1200, kind: "run" },
  { id: "distance-600", label: "Reach 600 m in a single run", hint: "The track keeps speeding up — hold your line.", metric: "distance", target: 600, kind: "run" },
  { id: "level-3", label: "Reach level 3 in a single run", hint: "Every 350 m pushes the neon into a new stage.", metric: "level", target: 3, kind: "run" },
  { id: "near-15", label: "Earn 15 near misses", hint: "Chain near misses inside the combo window.", metric: "nearMisses", target: 15, kind: "lifetime" },
  { id: "orbs-20", label: "Collect 20 energy orbs", hint: "Watch for arcs of orbs over the busiest stretches.", metric: "orbs", target: 20, kind: "lifetime" },
  { id: "level-5", label: "Reach level 5 in a single run", hint: "Late-run speed separates the runners.", metric: "level", target: 5, kind: "run" },
  { id: "score-3500", label: "Score 3,500 in a single run", hint: "A long run with a live combo gets you there.", metric: "score", target: 3500, kind: "run" },
];

export type NeonProfile = {
  bestDistance: number;
  bestScore: number;
  bestLevel: number;
  runs: number;
  missionIndex: number;
  missionProgress: number;
  missionsCompleted: number;
};

export const defaultProfile: NeonProfile = {
  bestDistance: 0,
  bestScore: 0,
  bestLevel: 1,
  runs: 0,
  missionIndex: 0,
  missionProgress: 0,
  missionsCompleted: 0,
};

export type Player = {
  y: number;
  vy: number;
  grounded: boolean;
  sliding: boolean;
  slideTimer: number;
  jumpsUsed: number;
};

export type Obstacle = {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  clearance: number;
  passed: boolean;
  slid: boolean;
};

export type Orb = {
  id: number;
  x: number;
  y: number;
  r: number;
  taken: boolean;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
};

export type FloatText = {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
};

export type GameState = {
  status: GameStatus;
  time: number;
  speed: number;
  distancePx: number;
  score: number;
  player: Player;
  obstacles: Obstacle[];
  orbs: Orb[];
  particles: Particle[];
  floats: FloatText[];
  spawnTimer: number;
  orbTimer: number;
  combo: number;
  comboTimer: number;
  bestCombo: number;
  nearMisses: number;
  orbsCollected: number;
  jumps: number;
  slides: number;
  nextId: number;
  shake: number;
  newRecord: boolean;
  level: number;
  levelFlash: number;
  missionBase: number;
  profile: NeonProfile;
};

export type GameEvent =
  | { type: "jump" }
  | { type: "double-jump" }
  | { type: "slide" }
  | { type: "orb"; bonus: number }
  | { type: "near"; bonus: number }
  | { type: "slide-under" }
  | { type: "level"; level: number }
  | { type: "mission"; label: string }
  | { type: "dead" };

type Box = { x: number; y: number; w: number; h: number };

const whole = (value: unknown, fallback = 0) => {
  const number = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(0, number);
};

/** Keeps hand-edited or old localStorage saves from breaking a run. */
export function normalizeProfile(value: unknown): NeonProfile {
  const source = (value && typeof value === "object" ? value : {}) as Partial<NeonProfile>;
  return {
    bestDistance: whole(source.bestDistance),
    bestScore: whole(source.bestScore),
    bestLevel: Math.max(1, whole(source.bestLevel, 1)),
    runs: whole(source.runs),
    missionIndex: Math.min(MISSIONS.length - 1, whole(source.missionIndex)),
    missionProgress: whole(source.missionProgress),
    missionsCompleted: whole(source.missionsCompleted),
  };
}

export function currentMission(state: GameState): Mission {
  return MISSIONS[state.profile.missionIndex] ?? MISSIONS[0];
}

export function playerBox(state: GameState): Box {
  const sliding = state.player.sliding && state.player.grounded;
  const height = sliding ? SLIDE_HEIGHT : PLAYER_HEIGHT;
  return { x: PLAYER_X, y: state.player.y - height, w: PLAYER_WIDTH, h: height };
}

export function distanceMeters(state: GameState) {
  return Math.floor(state.distancePx / PIXELS_PER_METER);
}

/** Progress toward the active mission, including the current run. */
export function missionProgress(state: GameState): number {
  const mission = currentMission(state);
  const runValue =
    mission.metric === "distance"
      ? distanceMeters(state)
      : mission.metric === "score"
        ? Math.floor(state.score)
        : mission.metric === "jumps"
          ? state.jumps
          : mission.metric === "orbs"
            ? state.orbsCollected
            : mission.metric === "nearMisses"
              ? state.nearMisses
              : mission.metric === "level"
                ? state.level
                : state.slides;
  return mission.kind === "run" ? Math.max(state.missionBase, runValue) : state.missionBase + runValue;
}

export function createGame(saved?: unknown): GameState {
  const profile = normalizeProfile(saved);
  return {
    status: "ready",
    time: 0,
    speed: BASE_SPEED,
    distancePx: 0,
    score: 0,
    player: { y: GROUND_Y, vy: 0, grounded: true, sliding: false, slideTimer: 0, jumpsUsed: 0 },
    obstacles: [],
    orbs: [],
    particles: [],
    floats: [],
    spawnTimer: 1.2,
    orbTimer: 1.7,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    nearMisses: 0,
    orbsCollected: 0,
    jumps: 0,
    slides: 0,
    nextId: 1,
    shake: 0,
    newRecord: false,
    level: 1,
    levelFlash: 0,
    missionBase: profile.missionProgress,
    profile,
  };
}

export function startRun(state: GameState) {
  state.status = "playing";
  state.time = 0;
  state.speed = BASE_SPEED;
  state.distancePx = 0;
  state.score = 0;
  state.player = { y: GROUND_Y, vy: 0, grounded: true, sliding: false, slideTimer: 0, jumpsUsed: 0 };
  state.obstacles = [];
  state.orbs = [];
  state.particles = [];
  state.floats = [];
  state.spawnTimer = 1.25;
  state.orbTimer = 1.6;
  state.combo = 0;
  state.comboTimer = 0;
  state.bestCombo = 0;
  state.nearMisses = 0;
  state.orbsCollected = 0;
  state.jumps = 0;
  state.slides = 0;
  state.shake = 0;
  state.newRecord = false;
  state.level = 1;
  state.levelFlash = 0;
  state.missionBase = state.profile.missionProgress;
}

export function togglePause(state: GameState) {
  if (state.status === "playing") state.status = "paused";
  else if (state.status === "paused") state.status = "playing";
}

export function jump(state: GameState): GameEvent[] {
  if (state.status !== "playing") return [];
  const player = state.player;
  if (player.grounded) {
    player.vy = JUMP_VELOCITY;
    player.grounded = false;
    player.sliding = false;
    player.slideTimer = 0;
    player.jumpsUsed = 1;
    state.jumps += 1;
    burst(state, PLAYER_X + PLAYER_WIDTH / 2, player.y, 7, "#66f6ff", 90);
    return [{ type: "jump" }];
  }
  if (player.jumpsUsed < 2) {
    player.vy = AIR_JUMP_VELOCITY;
    player.jumpsUsed = 2;
    state.jumps += 1;
    burst(state, PLAYER_X + PLAYER_WIDTH / 2, player.y - 12, 9, "#a275ff", 130);
    return [{ type: "double-jump" }];
  }
  return [];
}

export function slide(state: GameState): GameEvent[] {
  if (state.status !== "playing") return [];
  const player = state.player;
  if (player.grounded) {
    player.sliding = true;
    player.slideTimer = SLIDE_DURATION;
    burst(state, PLAYER_X + PLAYER_WIDTH / 2, player.y, 8, "#ffd166", 130);
    return [{ type: "slide" }];
  }
  player.vy = Math.max(player.vy, 700);
  return [];
}

export function update(state: GameState, dt: number): GameEvent[] {
  const events: GameEvent[] = [];
  const step = Math.min(0.05, Math.max(0, dt));

  if (state.status !== "playing") {
    if (state.status === "over") {
      updateEffects(state, step);
      state.shake = Math.max(0, state.shake - step * 3.2);
    }
    return events;
  }

  state.time += step;
  const nextLevel = 1 + Math.floor(distanceMeters(state) / LEVEL_DISTANCE);
  if (nextLevel > state.level) {
    state.level = nextLevel;
    state.levelFlash = 2.2;
    state.score += 120 * (nextLevel - 1);
    burst(state, VIEW_WIDTH / 2, 250, 20, "#ffe66d", 220);
    events.push({ type: "level", level: nextLevel });
  }
  state.levelFlash = Math.max(0, state.levelFlash - step);
  state.speed = Math.min(MAX_SPEED, BASE_SPEED + state.time * SPEED_GAIN + (state.level - 1) * 14);
  const travel = state.speed * step;
  state.distancePx += travel;
  state.score += travel * 0.22;
  state.shake = Math.max(0, state.shake - step * 3.2);

  if (state.combo > 0) {
    state.comboTimer -= step;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  const player = state.player;
  if (!player.grounded) {
    player.vy += GRAVITY * step;
    player.y += player.vy * step;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.grounded = true;
      player.jumpsUsed = 0;
      if (!player.sliding) burst(state, PLAYER_X + PLAYER_WIDTH / 2, GROUND_Y, 5, "#4be0ff", 70);
    }
  }
  if (player.sliding) {
    player.slideTimer -= step;
    if (player.slideTimer <= 0) player.sliding = false;
  }

  state.spawnTimer -= step;
  if (state.spawnTimer <= 0) {
    spawnPattern(state);
    state.spawnTimer = spawnInterval(state.time, state.level);
  }

  state.orbTimer -= step;
  if (state.orbTimer <= 0) {
    spawnOrb(state);
    state.orbTimer = 2.1 + Math.random() * 1.4;
  }

  const box = playerBox(state);

  for (const obstacle of state.obstacles) {
    obstacle.x -= travel;
    const overlapsX = obstacle.x < box.x + box.w && obstacle.x + obstacle.w > box.x;
    if (overlapsX) {
      const clearance = clearanceBetween(box, obstacle);
      if (clearance < obstacle.clearance) obstacle.clearance = clearance;
      if (obstacle.kind === "gate" && player.sliding && player.grounded) obstacle.slid = true;
      if (clearance < 0 && intersects(box, obstacle)) {
        endRun(state, events);
        return events;
      }
    }
    if (!obstacle.passed && obstacle.x + obstacle.w < PLAYER_X) {
      obstacle.passed = true;
      if (obstacle.clearance >= 0 && obstacle.clearance <= NEAR_MISS_CLEARANCE) {
        awardNearMiss(state, events);
      }
      if (obstacle.kind === "gate" && obstacle.slid) {
        state.slides += 1;
        events.push({ type: "slide-under" });
      }
    }
  }
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -90);

  for (const orb of state.orbs) {
    orb.x -= travel;
    if (!orb.taken && circleHitsBox(orb, box)) {
      orb.taken = true;
      state.orbsCollected += 1;
      state.score += 40;
      burst(state, orb.x, orb.y, 12, "#7df9ff", 170);
      addFloat(state, orb.x - 16, orb.y - 12, "+40", "#7df9ff");
      events.push({ type: "orb", bonus: 40 });
    }
  }
  state.orbs = state.orbs.filter((orb) => !orb.taken && orb.x > -60);

  updateEffects(state, step);
  checkMission(state, events);
  return events;
}

function spawnInterval(time: number, level: number) {
  return Math.max(0.72, 1.55 - time * 0.012 - (level - 1) * 0.035);
}

function spawnBlock(state: GameState, x: number, height: number, tall = false) {
  state.obstacles.push({
    id: state.nextId++,
    kind: tall ? "tall" : "block",
    x,
    y: GROUND_Y - height,
    w: tall ? 36 : 40,
    h: height,
    clearance: Number.POSITIVE_INFINITY,
    passed: false,
    slid: false,
  });
}

function spawnGate(state: GameState, x: number) {
  state.obstacles.push({
    id: state.nextId++,
    kind: "gate",
    x,
    y: GATE_BOTTOM - GATE_HEIGHT,
    w: 68,
    h: GATE_HEIGHT,
    clearance: Number.POSITIVE_INFINITY,
    passed: false,
    slid: false,
  });
}

function spawnPattern(state: GameState) {
  const x = VIEW_WIDTH + 60;
  const level = state.level;
  const gateAllowed = level >= 2 || state.time > 5;
  const roll = Math.random();
  if (gateAllowed && roll < 0.18 + Math.min(0.08, level * 0.01)) return spawnGate(state, x);
  if (roll < 0.4) return spawnBlock(state, x, 44 + Math.random() * 12);
  if (roll < 0.58) return spawnBlock(state, x, 68 + Math.random() * 10, true);
  if (roll < 0.82) {
    spawnBlock(state, x, 38);
    spawnBlock(state, x + 116, 38);
    return;
  }
  if (level >= 4 && roll > 0.93) {
    spawnGate(state, x);
    spawnBlock(state, x + state.speed * 1.2, 44);
    return;
  }
  if (gateAllowed) {
    spawnBlock(state, x, 46);
    spawnGate(state, x + state.speed * 1.15);
    return;
  }
  spawnBlock(state, x, 50);
}

function spawnOrb(state: GameState) {
  state.orbs.push({
    id: state.nextId++,
    x: VIEW_WIDTH + 50 + Math.random() * 90,
    y: GROUND_Y - (56 + Math.random() * 116),
    r: 12,
    taken: false,
  });
}

function clearanceBetween(box: Box, obstacle: Obstacle) {
  if (obstacle.kind === "gate") {
    if (box.y + box.h <= obstacle.y) return obstacle.y - (box.y + box.h);
    return box.y - (obstacle.y + obstacle.h);
  }
  return obstacle.y - (box.y + box.h);
}

function intersects(box: Box, obstacle: Obstacle) {
  const padX = 5;
  const padY = 3;
  const ax = box.x + padX;
  const aw = box.w - padX * 2;
  const ay = box.y + padY;
  const ah = box.h - padY * 2;
  const bx = obstacle.x + 3;
  const bw = obstacle.w - 6;
  const by = obstacle.y + 3;
  const bh = obstacle.h - 6;
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function circleHitsBox(orb: Orb, box: Box) {
  return orb.x + orb.r > box.x && orb.x - orb.r < box.x + box.w && orb.y + orb.r > box.y && orb.y - orb.r < box.y + box.h;
}

function awardNearMiss(state: GameState, events: GameEvent[]) {
  state.combo = Math.min(9, state.combo + 1);
  state.comboTimer = COMBO_WINDOW;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.nearMisses += 1;
  const bonus = 25 + state.combo * 10;
  state.score += bonus;
  addFloat(state, PLAYER_X + 26, GROUND_Y - 142, `+${bonus} NEAR MISS`, "#7df9ff");
  burst(state, PLAYER_X, GROUND_Y - 40, 8, "#ff7dd8", 150);
  events.push({ type: "near", bonus });
}

function checkMission(state: GameState, events: GameEvent[]) {
  const mission = currentMission(state);
  if (missionProgress(state) < mission.target) return;
  state.profile.missionsCompleted += 1;
  state.profile.missionIndex = (state.profile.missionIndex + 1) % MISSIONS.length;
  state.profile.missionProgress = 0;
  state.missionBase = 0;
  addFloat(state, VIEW_WIDTH / 2 - 96, 150, "MISSION COMPLETE", "#ffe66d");
  burst(state, VIEW_WIDTH / 2, 176, 26, "#ffe66d", 260);
  events.push({ type: "mission", label: mission.label });
}

function endRun(state: GameState, events: GameEvent[]) {
  state.status = "over";
  state.shake = 1;
  const mission = currentMission(state);
  const meters = distanceMeters(state);
  state.newRecord = meters > 0 && meters >= state.profile.bestDistance;
  state.profile.missionProgress = Math.min(mission.target, missionProgress(state));
  state.profile.bestDistance = Math.max(state.profile.bestDistance, meters);
  state.profile.bestScore = Math.max(state.profile.bestScore, Math.floor(state.score));
  state.profile.bestLevel = Math.max(state.profile.bestLevel, state.level);
  state.profile.runs += 1;
  burst(state, PLAYER_X + PLAYER_WIDTH / 2, state.player.y - PLAYER_HEIGHT / 2, 34, "#ff4fa3", 300);
  burst(state, PLAYER_X + PLAYER_WIDTH / 2, state.player.y - PLAYER_HEIGHT / 2, 16, "#7df9ff", 220);
  events.push({ type: "dead" });
}

function burst(state: GameState, x: number, y: number, count: number, color: string, speed: number) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const force = speed * (0.35 + Math.random() * 0.75);
    const life = 0.35 + Math.random() * 0.55;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force - 40,
      size: 1.6 + Math.random() * 3.4,
      life,
      maxLife: life,
      color,
    });
  }
  if (state.particles.length > 220) state.particles.splice(0, state.particles.length - 220);
}

function addFloat(state: GameState, x: number, y: number, text: string, color: string) {
  state.floats.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
  if (state.floats.length > 12) state.floats.shift();
}

function updateEffects(state: GameState, dt: number) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 420 * dt;
    particle.vx *= 0.98;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);

  for (const float of state.floats) {
    float.life -= dt;
    float.y -= 30 * dt;
  }
  state.floats = state.floats.filter((float) => float.life > 0);
}
