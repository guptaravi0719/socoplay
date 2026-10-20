export type Mode = "ai" | "2p";
export type PlayerId = "p1" | "p2";
export type Group = "solids" | "stripes" | null;
export type BallType = "cue" | "solid" | "stripe" | "eight";

export type Ball = {
  number: number;
  type: BallType;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pocketed: boolean;
};

export type Player = { id: PlayerId; name: string; group: Group };

export type Shot = {
  firstContact: number | null;
  firstContactLegal: boolean;
  cuePocketed: boolean;
  pocketed: number[];
  railAfterContact: boolean;
};

export type GameState = {
  balls: Ball[];
  players: [Player, Player];
  turn: 0 | 1;
  openTable: boolean;
  breakDone: boolean;
  ballInHand: boolean;
  gameOver: boolean;
  winner: PlayerId | null;
  message: string;
  mode: Mode;
  shot: Shot | null;
  shotInProgress: boolean;
  shotCount: number;
};

export type ShotResolution = {
  foul: boolean;
  reason: string;
  pocketed: number[];
  gameOver: boolean;
  winner: PlayerId | null;
};

export type AimPrediction = {
  cue: { x: number; y: number };
  end: { x: number; y: number };
  ghost: { x: number; y: number } | null;
  target: number | null;
  objectDir: { x: number; y: number } | null;
  legal: boolean;
};

export type AiAction =
  | { type: "shoot"; angle: number; power: number }
  | { type: "place"; x: number; y: number }
  | null;

export const TABLE_WIDTH = 900;
export const TABLE_HEIGHT = 450;
export const BALL_RADIUS = 11;
export const RAIL = 32;
export const VIEW_WIDTH = TABLE_WIDTH + RAIL * 2;
export const VIEW_HEIGHT = TABLE_HEIGHT + RAIL * 2;
export const MAX_POWER_DRAG = 280;
export const MIN_SHOT_SPEED = 280;
export const MAX_SHOT_SPEED = 1500;

export const BALL_COLORS: Record<number, string> = {
  0: "#f8f4e8",
  1: "#f2c84b",
  2: "#2b6fd4",
  3: "#d53a33",
  4: "#7b4bb7",
  5: "#e4832f",
  6: "#2f8c58",
  7: "#8c2f3a",
  8: "#1b1b1b",
  9: "#f2c84b",
  10: "#2b6fd4",
  11: "#d53a33",
  12: "#7b4bb7",
  13: "#e4832f",
  14: "#2f8c58",
  15: "#8c2f3a",
};

export const POCKETS = [
  { x: 0, y: 0, radius: 23 },
  { x: TABLE_WIDTH / 2, y: 0, radius: 21 },
  { x: TABLE_WIDTH, y: 0, radius: 23 },
  { x: 0, y: TABLE_HEIGHT, radius: 23 },
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT, radius: 21 },
  { x: TABLE_WIDTH, y: TABLE_HEIGHT, radius: 23 },
];

const STOP_SPEED = 3;
const FRICTION = 0.988;
const CUSHION_RESTITUTION = 0.82;
const BALL_RESTITUTION = 0.96;

export function ballTypeForNumber(number: number): BallType {
  if (number === 0) return "cue";
  if (number === 8) return "eight";
  return number < 8 ? "solid" : "stripe";
}

export function groupForNumber(number: number): Group {
  if (number === 0 || number === 8) return null;
  return number < 8 ? "solids" : "stripes";
}

export function groupNumbers(group: Group): number[] {
  if (group === "solids") return [1, 2, 3, 4, 5, 6, 7];
  if (group === "stripes") return [9, 10, 11, 12, 13, 14, 15];
  return [];
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function makeBall(number: number, x: number, y: number): Ball {
  return {
    number,
    type: ballTypeForNumber(number),
    color: BALL_COLORS[number],
    x,
    y,
    vx: 0,
    vy: 0,
    pocketed: false,
  };
}

function rackBalls(seed: number): Ball[] {
  const random = seededRandom(seed);
  const slots: { x: number; y: number }[] = [];
  const footX = TABLE_WIDTH * 0.75;
  const footY = TABLE_HEIGHT / 2;
  const rowGap = (BALL_RADIUS * 2 + 0.6) * Math.cos(Math.PI / 6);
  const columnGap = BALL_RADIUS * 2 + 0.6;
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      slots.push({
        x: footX + row * rowGap,
        y: footY + (column - row / 2) * columnGap,
      });
    }
  }

  const solids = shuffle([1, 2, 3, 4, 5, 6, 7], random);
  const stripes = shuffle([9, 10, 11, 12, 13, 14, 15], random);
  const backLeft = random() < 0.5 ? solids.pop()! : stripes.pop()!;
  const backRight = groupForNumber(backLeft) === "solids" ? stripes.pop()! : solids.pop()!;
  const remaining = shuffle([...solids, ...stripes], random);

  const numbers: number[] = [];
  for (let slot = 0; slot < slots.length; slot += 1) {
    if (slot === 4) numbers[slot] = 8;
    else if (slot === 10) numbers[slot] = backLeft;
    else if (slot === 14) numbers[slot] = backRight;
    else numbers[slot] = remaining.shift()!;
  }

  const balls: Ball[] = [makeBall(0, TABLE_WIDTH * 0.25, TABLE_HEIGHT / 2)];
  slots.forEach((slot, index) => balls.push(makeBall(numbers[index], slot.x, slot.y)));
  return balls;
}

export function createGame(mode: Mode, seed = Date.now()): GameState {
  const players: [Player, Player] =
    mode === "ai"
      ? [
          { id: "p1", name: "Player 1", group: null },
          { id: "p2", name: "AI", group: null },
        ]
      : [
          { id: "p1", name: "Player 1", group: null },
          { id: "p2", name: "Player 2", group: null },
        ];
  return {
    balls: rackBalls(seed),
    players,
    turn: 0,
    openTable: true,
    breakDone: false,
    ballInHand: false,
    gameOver: false,
    winner: null,
    message: "Break the rack to start.",
    mode,
    shot: null,
    shotInProgress: false,
    shotCount: 0,
  };
}

export function isAiTurn(state: GameState) {
  return state.mode === "ai" && state.turn === 1 && !state.gameOver;
}

export function currentPlayer(state: GameState) {
  return state.players[state.turn];
}

export function playerOnEight(state: GameState, playerIndex: 0 | 1) {
  const player = state.players[playerIndex];
  if (!player.group) return false;
  return state.balls.every(
    (ball) =>
      ball.pocketed ||
      ball.number === 0 ||
      ball.number === 8 ||
      groupForNumber(ball.number) !== player.group,
  );
}

export function legalTargets(state: GameState, playerIndex: 0 | 1) {
  const player = state.players[playerIndex];
  if (state.openTable) {
    return state.balls
      .filter((ball) => !ball.pocketed && ball.number !== 0 && ball.number !== 8)
      .map((ball) => ball.number);
  }
  if (playerOnEight(state, playerIndex)) {
    return state.balls.filter((ball) => !ball.pocketed && ball.number === 8).map((ball) => ball.number);
  }
  return state.balls
    .filter(
      (ball) =>
        !ball.pocketed &&
        ball.number !== 0 &&
        ball.number !== 8 &&
        groupForNumber(ball.number) === player.group,
    )
    .map((ball) => ball.number);
}

export function isLegalTarget(state: GameState, playerIndex: 0 | 1, number: number) {
  return legalTargets(state, playerIndex).includes(number);
}

export function isBallForPlayer(state: GameState, playerIndex: 0 | 1, number: number) {
  const player = state.players[playerIndex];
  if (state.openTable || !player.group) return number !== 8;
  return groupForNumber(number) === player.group;
}

function nearPocket(ball: Ball) {
  return POCKETS.some(
    (pocket) =>
      Math.hypot(ball.x - pocket.x, ball.y - pocket.y) < pocket.radius + BALL_RADIUS * 1.15,
  );
}

function capturePocket(ball: Ball) {
  for (const pocket of POCKETS) {
    if (Math.hypot(ball.x - pocket.x, ball.y - pocket.y) < pocket.radius - BALL_RADIUS * 0.25) {
      return true;
    }
  }
  return false;
}

function pocketBall(state: GameState, ball: Ball) {
  if (ball.pocketed) return;
  ball.pocketed = true;
  ball.vx = 0;
  ball.vy = 0;
  if (!state.shot) return;
  if (ball.number === 0) state.shot.cuePocketed = true;
  else if (!state.shot.pocketed.includes(ball.number)) state.shot.pocketed.push(ball.number);
}

function resolveBallCollision(state: GameState, a: Ball, b: Ball) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 0.0001;
  if (distance >= BALL_RADIUS * 2) return;

  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = BALL_RADIUS * 2 - distance;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  const relativeX = b.vx - a.vx;
  const relativeY = b.vy - a.vy;
  const normalSpeed = relativeX * nx + relativeY * ny;
  if (normalSpeed < 0) {
    const impulse = (-(1 + BALL_RESTITUTION) * normalSpeed) / 2;
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;
  }

  if (state.shot && state.shot.firstContact === null) {
    const object = a.number === 0 ? b : b.number === 0 ? a : null;
    if (object && object.number !== 0) {
      state.shot.firstContact = object.number;
      state.shot.firstContactLegal = isLegalTarget(state, state.turn, object.number);
    }
  }
}

function resolveRailCollision(state: GameState, ball: Ball) {
  if (nearPocket(ball)) return;
  let hit = false;
  if (ball.x - BALL_RADIUS < 0) {
    ball.x = BALL_RADIUS;
    ball.vx = Math.abs(ball.vx) * CUSHION_RESTITUTION;
    hit = true;
  } else if (ball.x + BALL_RADIUS > TABLE_WIDTH) {
    ball.x = TABLE_WIDTH - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx) * CUSHION_RESTITUTION;
    hit = true;
  }
  if (ball.y - BALL_RADIUS < 0) {
    ball.y = BALL_RADIUS;
    ball.vy = Math.abs(ball.vy) * CUSHION_RESTITUTION;
    hit = true;
  } else if (ball.y + BALL_RADIUS > TABLE_HEIGHT) {
    ball.y = TABLE_HEIGHT - BALL_RADIUS;
    ball.vy = -Math.abs(ball.vy) * CUSHION_RESTITUTION;
    hit = true;
  }
  if (hit && state.shot && state.shot.firstContact !== null) {
    state.shot.railAfterContact = true;
  }
}

export function stepPhysics(state: GameState, dt: number) {
  if (!state.shotInProgress || !state.shot) return;
  const total = Math.min(Math.max(dt, 0), 0.05);
  const steps = Math.max(1, Math.min(8, Math.ceil(total / (1 / 120))));
  const step = total / steps;

  for (let iteration = 0; iteration < steps; iteration += 1) {
    for (const ball of state.balls) {
      if (ball.pocketed) continue;
      ball.x += ball.vx * step;
      ball.y += ball.vy * step;
    }

    for (const ball of state.balls) {
      if (ball.pocketed) continue;
      if (capturePocket(ball)) {
        pocketBall(state, ball);
        continue;
      }
      if (
        ball.x < -BALL_RADIUS ||
        ball.x > TABLE_WIDTH + BALL_RADIUS ||
        ball.y < -BALL_RADIUS ||
        ball.y > TABLE_HEIGHT + BALL_RADIUS
      ) {
        pocketBall(state, ball);
      }
    }

    for (let first = 0; first < state.balls.length; first += 1) {
      const a = state.balls[first];
      if (a.pocketed) continue;
      for (let second = first + 1; second < state.balls.length; second += 1) {
        const b = state.balls[second];
        if (b.pocketed) continue;
        resolveBallCollision(state, a, b);
      }
    }

    for (const ball of state.balls) {
      if (ball.pocketed) continue;
      resolveRailCollision(state, ball);
    }

    const damping = Math.pow(FRICTION, step * 120);
    for (const ball of state.balls) {
      if (ball.pocketed) continue;
      ball.vx *= damping;
      ball.vy *= damping;
      if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
      }
    }
  }
}

export function isMoving(state: GameState) {
  return state.balls.some(
    (ball) => !ball.pocketed && Math.hypot(ball.vx, ball.vy) > STOP_SPEED,
  );
}

export function shoot(state: GameState, angle: number, power: number) {
  if (state.gameOver || state.shotInProgress || state.ballInHand) return false;
  const cue = state.balls[0];
  if (!cue || cue.pocketed || !Number.isFinite(angle)) return false;
  const clamped = Math.max(0.04, Math.min(1, power));
  const speed = MIN_SHOT_SPEED + clamped * (MAX_SHOT_SPEED - MIN_SHOT_SPEED);
  cue.vx = Math.cos(angle) * speed;
  cue.vy = Math.sin(angle) * speed;
  state.shot = {
    firstContact: null,
    firstContactLegal: false,
    cuePocketed: false,
    pocketed: [],
    railAfterContact: false,
  };
  state.shotInProgress = true;
  state.shotCount += 1;
  state.message = "Balls rolling…";
  return true;
}

function findFreeSpot(state: GameState, x: number, y: number, ignoreNumber: number) {
  const isFree = (px: number, py: number) =>
    px >= BALL_RADIUS &&
    px <= TABLE_WIDTH - BALL_RADIUS &&
    py >= BALL_RADIUS &&
    py <= TABLE_HEIGHT - BALL_RADIUS &&
    state.balls.every(
      (ball) =>
        ball.pocketed ||
        ball.number === ignoreNumber ||
        Math.hypot(ball.x - px, ball.y - py) >= BALL_RADIUS * 2 + 1,
    );
  if (isFree(x, y)) return { x, y };
  for (let offset = 1; offset <= 20; offset += 1) {
    const step = offset * BALL_RADIUS * 2;
    const candidates = [
      { x: x + step, y },
      { x: x - step, y },
      { x, y: y + step },
      { x, y: y - step },
    ];
    for (const candidate of candidates) {
      const px = Math.min(TABLE_WIDTH - BALL_RADIUS, Math.max(BALL_RADIUS, candidate.x));
      const py = Math.min(TABLE_HEIGHT - BALL_RADIUS, Math.max(BALL_RADIUS, candidate.y));
      if (isFree(px, py)) return { x: px, y: py };
    }
  }
  return { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2 };
}

function respotEight(state: GameState) {
  const eight = state.balls.find((ball) => ball.number === 8);
  if (!eight) return;
  eight.pocketed = false;
  eight.vx = 0;
  eight.vy = 0;
  const spot = findFreeSpot(state, TABLE_WIDTH * 0.75, TABLE_HEIGHT / 2, 8);
  eight.x = spot.x;
  eight.y = spot.y;
}

export function resolveShot(state: GameState): ShotResolution | null {
  if (!state.shot || !state.shotInProgress) return null;
  state.shotInProgress = false;
  const shot = state.shot;
  state.shot = null;

  const player = state.players[state.turn];
  const opponentIndex = (1 - state.turn) as 0 | 1;
  const opponent = state.players[opponentIndex];
  const wasBreak = !state.breakDone;
  let note = "";
  let pocketed = [...shot.pocketed];
  let eightPocketed = pocketed.includes(8);

  if (wasBreak && eightPocketed) {
    respotEight(state);
    pocketed = pocketed.filter((number) => number !== 8);
    eightPocketed = false;
    note = "8-ball pocketed on the break and re-spotted. ";
  }

  let foul = false;
  let reason = "";
  if (shot.cuePocketed) {
    foul = true;
    reason = "cue ball pocketed";
  } else if (shot.firstContact === null) {
    foul = true;
    reason = "no ball contacted";
  } else if (!shot.firstContactLegal) {
    foul = true;
    reason = `wrong ball first (${shot.firstContact})`;
  } else if (shot.pocketed.length === 0 && !shot.railAfterContact) {
    foul = true;
    reason = "no rail after contact";
  }

  if (eightPocketed) {
    const cleared = playerOnEight(state, state.turn);
    const win = cleared && !foul;
    state.gameOver = true;
    state.winner = win ? player.id : opponent.id;
    state.message = win
      ? `${player.name} sinks the 8-ball and wins!`
      : `${player.name} loses — the 8-ball was pocketed illegally.`;
    state.breakDone = true;
    return { foul, reason, pocketed, gameOver: true, winner: state.winner };
  }

  if (!wasBreak && state.openTable && !foul) {
    const first = pocketed.find((number) => number !== 8);
    if (first !== undefined) {
      const group = groupForNumber(first);
      if (group) {
        state.players[state.turn].group = group;
        state.players[opponentIndex].group = group === "solids" ? "stripes" : "solids";
        state.openTable = false;
      }
    }
  }

  const ownPocketed = pocketed.some(
    (number) => number !== 8 && isBallForPlayer(state, state.turn, number),
  );
  const anyPocketed = pocketed.some((number) => number !== 8);

  if (foul) {
    state.ballInHand = true;
    state.turn = opponentIndex;
    state.message = `${note}${player.name} foul: ${reason}. ${opponent.name} has ball in hand.`;
  } else if (ownPocketed || (wasBreak && anyPocketed) || (state.openTable && anyPocketed)) {
    state.message = `${note}${player.name} continues.`;
  } else if (anyPocketed) {
    state.turn = opponentIndex;
    state.message = `${note}${player.name} pocketed the wrong group. ${opponent.name} to shoot.`;
  } else {
    state.turn = opponentIndex;
    state.message = `${note}${opponent.name} to shoot.`;
  }

  state.breakDone = true;
  return { foul, reason, pocketed, gameOver: false, winner: null };
}

export function isValidCuePlacement(state: GameState, x: number, y: number) {
  if (x < BALL_RADIUS || x > TABLE_WIDTH - BALL_RADIUS) return false;
  if (y < BALL_RADIUS || y > TABLE_HEIGHT - BALL_RADIUS) return false;
  if (POCKETS.some((pocket) => Math.hypot(x - pocket.x, y - pocket.y) < pocket.radius + BALL_RADIUS)) {
    return false;
  }
  return state.balls.every(
    (ball) =>
      ball.number === 0 ||
      ball.pocketed ||
      Math.hypot(ball.x - x, ball.y - y) >= BALL_RADIUS * 2 + 1,
  );
}

export function placeCueBall(state: GameState, x: number, y: number) {
  if (!isValidCuePlacement(state, x, y)) return false;
  const cue = state.balls[0];
  cue.x = x;
  cue.y = y;
  cue.vx = 0;
  cue.vy = 0;
  cue.pocketed = false;
  state.ballInHand = false;
  state.message = "Cue ball placed. Take your shot.";
  return true;
}

function rayBoundaryDistance(cue: { x: number; y: number }, dir: { x: number; y: number }) {
  let distance = Infinity;
  if (dir.x > 0) distance = Math.min(distance, (TABLE_WIDTH - cue.x) / dir.x);
  else if (dir.x < 0) distance = Math.min(distance, (0 - cue.x) / dir.x);
  if (dir.y > 0) distance = Math.min(distance, (TABLE_HEIGHT - cue.y) / dir.y);
  else if (dir.y < 0) distance = Math.min(distance, (0 - cue.y) / dir.y);
  return Number.isFinite(distance) ? Math.max(0, distance) : 0;
}

export function predictAim(state: GameState, angle: number): AimPrediction {
  const cue = state.balls[0];
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  let bestDistance = Infinity;
  let bestBall: Ball | null = null;
  for (const ball of state.balls) {
    if (ball.number === 0 || ball.pocketed) continue;
    const ox = ball.x - cue.x;
    const oy = ball.y - cue.y;
    const projection = ox * dir.x + oy * dir.y;
    if (projection <= 0) continue;
    const perpendicularSq = ox * ox + oy * oy - projection * projection;
    const radius = BALL_RADIUS * 2;
    if (perpendicularSq > radius * radius) continue;
    const distance = projection - Math.sqrt(radius * radius - perpendicularSq);
    if (distance > 0 && distance < bestDistance) {
      bestDistance = distance;
      bestBall = ball;
    }
  }

  if (bestBall && Number.isFinite(bestDistance)) {
    const ghost = {
      x: cue.x + dir.x * bestDistance,
      y: cue.y + dir.y * bestDistance,
    };
    const odx = bestBall.x - ghost.x;
    const ody = bestBall.y - ghost.y;
    const length = Math.hypot(odx, ody) || 1;
    return {
      cue: { x: cue.x, y: cue.y },
      end: ghost,
      ghost,
      target: bestBall.number,
      objectDir: { x: odx / length, y: ody / length },
      legal: isLegalTarget(state, state.turn, bestBall.number),
    };
  }

  const distance = rayBoundaryDistance(cue, dir);
  return {
    cue: { x: cue.x, y: cue.y },
    end: { x: cue.x + dir.x * distance, y: cue.y + dir.y * distance },
    ghost: null,
    target: null,
    objectDir: null,
    legal: false,
  };
}

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pathBlocked(
  state: GameState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ignoreNumber: number,
) {
  return state.balls.some((ball) => {
    if (ball.pocketed || ball.number === 0 || ball.number === ignoreNumber) return false;
    return distanceToSegment(ball.x, ball.y, x1, y1, x2, y2) < BALL_RADIUS * 2 - 1;
  });
}

type DirectShot = { angle: number; power: number; score: number; target: number };

function bestDirectShot(state: GameState, cueX: number, cueY: number): DirectShot | null {
  let best: DirectShot | null = null;
  for (const number of legalTargets(state, state.turn)) {
    const target = state.balls.find((ball) => ball.number === number && !ball.pocketed);
    if (!target) continue;
    for (const pocket of POCKETS) {
      const pdx = pocket.x - target.x;
      const pdy = pocket.y - target.y;
      const pocketDistance = Math.hypot(pdx, pdy) || 1;
      const dirX = pdx / pocketDistance;
      const dirY = pdy / pocketDistance;
      const ghostX = target.x - dirX * BALL_RADIUS * 2;
      const ghostY = target.y - dirY * BALL_RADIUS * 2;
      if (
        ghostX < BALL_RADIUS ||
        ghostX > TABLE_WIDTH - BALL_RADIUS ||
        ghostY < BALL_RADIUS ||
        ghostY > TABLE_HEIGHT - BALL_RADIUS
      ) {
        continue;
      }
      const cueXDelta = ghostX - cueX;
      const cueYDelta = ghostY - cueY;
      const cueDistance = Math.hypot(cueXDelta, cueYDelta);
      if (cueDistance < BALL_RADIUS) continue;
      const aimX = cueXDelta / cueDistance;
      const aimY = cueYDelta / cueDistance;
      const cut = aimX * dirX + aimY * dirY;
      if (cut < 0.35) continue;
      if (pathBlocked(state, cueX, cueY, ghostX, ghostY, number)) continue;
      if (pathBlocked(state, target.x, target.y, pocket.x, pocket.y, number)) continue;
      const score = (cut * 1000) / (1 + cueDistance * 0.01) + 500 / (1 + pocketDistance * 0.02);
      if (!best || score > best.score) {
        best = {
          angle: Math.atan2(aimY, aimX),
          power: Math.min(0.92, 0.35 + (cueDistance + pocketDistance) / 2200),
          score,
          target: number,
        };
      }
    }
  }
  return best;
}

function chooseSafetyShot(state: GameState, cueX: number, cueY: number) {
  const targets = legalTargets(state, state.turn)
    .map((number) => state.balls.find((ball) => ball.number === number && !ball.pocketed))
    .filter((ball): ball is Ball => Boolean(ball))
    .sort(
      (a, b) =>
        Math.hypot(a.x - cueX, a.y - cueY) - Math.hypot(b.x - cueX, b.y - cueY),
    );
  const clear = targets.find(
    (target) => !pathBlocked(state, cueX, cueY, target.x, target.y, target.number),
  );
  const target = clear ?? targets[0];
  if (!target) return null;
  return { angle: Math.atan2(target.y - cueY, target.x - cueX) };
}

function chooseAiPlacement(state: GameState) {
  const candidates: { x: number; y: number }[] = [{ x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2 }];
  for (let x = TABLE_WIDTH * 0.15; x <= TABLE_WIDTH * 0.85; x += TABLE_WIDTH * 0.1) {
    for (let y = TABLE_HEIGHT * 0.15; y <= TABLE_HEIGHT * 0.85; y += TABLE_HEIGHT * 0.1) {
      candidates.push({ x, y });
    }
  }
  let best: { x: number; y: number; score: number } | null = null;
  for (const candidate of candidates) {
    if (!isValidCuePlacement(state, candidate.x, candidate.y)) continue;
    const shot = bestDirectShot(state, candidate.x, candidate.y);
    if (shot && (!best || shot.score > best.score)) {
      best = { x: candidate.x, y: candidate.y, score: shot.score };
    }
  }
  if (best) return { x: best.x, y: best.y };
  return candidates.find((candidate) => isValidCuePlacement(state, candidate.x, candidate.y)) ?? null;
}

export function aiChooseShot(state: GameState): AiAction {
  if (!isAiTurn(state)) return null;
  if (state.ballInHand) {
    const placement = chooseAiPlacement(state);
    if (placement) return { type: "place", x: placement.x, y: placement.y };
  }

  if (!state.breakDone) {
    const cue = state.balls[0];
    const rack = state.balls
      .filter((ball) => ball.number !== 0 && !ball.pocketed)
      .sort((a, b) => a.x - b.x);
    const apex = rack[0];
    if (!apex) return null;
    return {
      type: "shoot",
      angle: Math.atan2(apex.y - cue.y, apex.x - cue.x) + 0.002,
      power: 0.92,
    };
  }

  const cue = state.balls[0];
  const direct = bestDirectShot(state, cue.x, cue.y);
  if (direct) {
    return {
      type: "shoot",
      angle: direct.angle + (Math.random() - 0.5) * 0.006,
      power: direct.power,
    };
  }

  const safety = chooseSafetyShot(state, cue.x, cue.y);
  if (safety) {
    return {
      type: "shoot",
      angle: safety.angle + (Math.random() - 0.5) * 0.01,
      power: 0.5,
    };
  }
  return null;
}

export function isPoolGame(value: unknown): value is GameState {
  const game = value as GameState | null;
  return Boolean(
    game &&
      Array.isArray(game.balls) &&
      game.balls.length === 16 &&
      Array.isArray(game.players) &&
      game.players.length === 2 &&
      (game.turn === 0 || game.turn === 1) &&
      typeof game.openTable === "boolean" &&
      typeof game.breakDone === "boolean" &&
      typeof game.ballInHand === "boolean" &&
      typeof game.gameOver === "boolean" &&
      typeof game.shotInProgress === "boolean" &&
      typeof game.shotCount === "number" &&
      (game.mode === "ai" || game.mode === "2p"),
  );
}
