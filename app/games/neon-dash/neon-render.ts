import {
  GROUND_Y,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_X,
  SLIDE_HEIGHT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  levelName,
  type GameState,
} from "./neon-engine";

type Theme = {
  sky: [string, string, string];
  sun: [string, string, string];
  glow: string;
  grid: string;
  accent: string;
  window: string;
};

const THEMES: Theme[] = [
  { sky: ["#050114", "#12042e", "#300c4a"], sun: ["#ffe36e", "#ff8a4c", "#ff2f76"], glow: "255, 96, 190", grid: "255, 79, 216", accent: "125, 249, 255", window: "255, 79, 216" },
  { sky: ["#020d1c", "#04263d", "#07454f"], sun: ["#d6fff5", "#4ce0d0", "#1786c9"], glow: "72, 224, 208", grid: "72, 224, 208", accent: "150, 255, 107", window: "150, 255, 107" },
  { sky: ["#16021f", "#3b062f", "#5e0a29"], sun: ["#ffe38a", "#ff8a4c", "#e3125c"], glow: "255, 86, 120", grid: "255, 138, 76", accent: "255, 214, 102", window: "255, 138, 76" },
  { sky: ["#12030a", "#2c0612", "#4d0d13"], sun: ["#ffe9a8", "#ffb347", "#c81f2f"], glow: "255, 179, 71", grid: "255, 107, 74", accent: "255, 233, 168", window: "255, 179, 71" },
  { sky: ["#03041a", "#0c1240", "#142a63"], sun: ["#b9f5ff", "#5bc0ff", "#7a5cff"], glow: "91, 192, 255", grid: "122, 92, 255", accent: "125, 249, 255", window: "91, 192, 255" },
  { sky: ["#0d031c", "#250744", "#3d0a63"], sun: ["#eaffa8", "#b6ff5c", "#6a4cff"], glow: "182, 255, 92", grid: "182, 255, 92", accent: "234, 255, 168", window: "182, 255, 92" },
];

const themeFor = (level: number) => THEMES[(Math.max(1, level) - 1) % THEMES.length];

const STARS = Array.from({ length: 74 }, (_, index) => ({
  x: (index * 137.5) % VIEW_WIDTH,
  y: 14 + ((index * 71) % 214),
  radius: index % 7 === 0 ? 1.7 : index % 3 === 0 ? 1.2 : 0.8,
  alpha: 0.24 + (index % 5) * 0.13,
}));

const SKYLINE = Array.from({ length: 17 }, (_, index) => ({
  x: index * 76,
  width: 52 + ((index * 29) % 34),
  height: 34 + ((index * 61) % 104),
  windows: 2 + (index % 4),
}));

function drawSky(ctx: CanvasRenderingContext2D, state: GameState, now: number, theme: Theme) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(0.5, theme.sky[1]);
  sky.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  for (const star of STARS) {
    const twinkle = 0.65 + Math.sin(now * 0.002 + star.x) * 0.35;
    ctx.fillStyle = `rgba(198, 226, 255, ${(star.alpha * twinkle).toFixed(3)})`;
    ctx.fillRect(star.x, star.y, star.radius, star.radius);
  }

  // Retro sun on the horizon.
  const sunX = 726;
  const sunY = 152;
  const sunRadius = 92;
  const glow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 1.9);
  glow.addColorStop(0, `rgba(${theme.glow}, 0.5)`);
  glow.addColorStop(0.45, `rgba(${theme.glow}, 0.16)`);
  glow.addColorStop(1, `rgba(${theme.glow}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunRadius * 2, sunY - sunRadius * 2, sunRadius * 4, sunRadius * 4);

  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.clip();
  const sunFill = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
  sunFill.addColorStop(0, theme.sun[0]);
  sunFill.addColorStop(0.52, theme.sun[1]);
  sunFill.addColorStop(1, theme.sun[2]);
  ctx.fillStyle = sunFill;
  ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);
  ctx.fillStyle = theme.sky[0];
  for (let index = 0; index < 7; index += 1) {
    const barY = sunY + 10 + index * 14;
    const barHeight = 2 + index * 2.1;
    ctx.fillRect(sunX - sunRadius, barY, sunRadius * 2, barHeight);
  }
  ctx.restore();

  // Parallax skyline with lit windows.
  const offset = (state.distancePx * 0.14) % (VIEW_WIDTH + 260);
  ctx.save();
  for (const building of SKYLINE) {
    let x = building.x - offset;
    if (x < -180) x += VIEW_WIDTH + 260;
    if (x > VIEW_WIDTH + 100) continue;
    const top = GROUND_Y - 34 - building.height;
    ctx.fillStyle = "#0a0524";
    ctx.fillRect(x, top, building.width, building.height + 34);
    ctx.fillStyle = `rgba(${theme.window}, 0.45)`;
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < building.windows; col += 1) {
        if ((row + col + building.windows) % 3 === 0) continue;
        ctx.fillRect(x + 8 + col * 13, top + 12 + row * 18, 5, 7);
      }
    }
    ctx.fillStyle = `rgba(${theme.window}, 0.5)`;
    ctx.fillRect(x + building.width * 0.4, top - 6, 2, 6);
  }
  ctx.restore();

  // Speed lines across the sky.
  const speedAlpha = Math.min(0.32, 0.06 + state.speed / 3400);
  ctx.strokeStyle = `rgba(${theme.accent}, ${speedAlpha.toFixed(3)})`;
  ctx.lineWidth = 1;
  for (let index = 0; index < 8; index += 1) {
    const y = 150 + ((index * 37 + now * 0.05) % 210);
    const length = 34 + ((index * 23) % 70);
    const x = VIEW_WIDTH - ((state.distancePx * (0.5 + index * 0.04) + index * 190) % (VIEW_WIDTH + 240));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();
  }
}

function drawTrack(ctx: CanvasRenderingContext2D, state: GameState, theme: Theme) {
  const ground = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_HEIGHT);
  ground.addColorStop(0, "#1b0638");
  ground.addColorStop(1, "#05010f");
  ctx.fillStyle = ground;
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
  ctx.clip();

  ctx.strokeStyle = `rgba(${theme.grid}, 0.35)`;
  ctx.lineWidth = 1;
  const depth = VIEW_HEIGHT - GROUND_Y;
  const scroll = (state.distancePx / 46) % 1;
  for (let index = 0; index < 9; index += 1) {
    const t = (index + scroll) / 9;
    const y = GROUND_Y + Math.pow(t, 2.2) * depth;
    ctx.globalAlpha = 0.12 + t * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_WIDTH, y);
    ctx.stroke();
  }
  for (let index = -6; index <= 6; index += 1) {
    ctx.globalAlpha = 0.34;
    ctx.beginPath();
    ctx.moveTo(VIEW_WIDTH / 2, GROUND_Y);
    ctx.lineTo(VIEW_WIDTH / 2 + index * 155, VIEW_HEIGHT);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const horizon = ctx.createLinearGradient(0, GROUND_Y - 2, 0, GROUND_Y + 3);
  horizon.addColorStop(0, `rgba(${theme.accent}, 0)`);
  horizon.addColorStop(0.5, theme.sun[0]);
  horizon.addColorStop(1, `rgba(${theme.accent}, 0)`);
  ctx.fillStyle = horizon;
  ctx.fillRect(0, GROUND_Y - 2, VIEW_WIDTH, 4);

  ctx.fillStyle = `rgba(${theme.accent}, 0.55)`;
  for (let x = -40; x < VIEW_WIDTH + 40; x += 64) {
    const sx = x - (state.distancePx % 64);
    ctx.fillRect(sx, GROUND_Y + 2, 24, 2);
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: GameState["obstacles"][number], now: number) {
  const radius = 6;
  ctx.save();
  if (obstacle.kind === "gate") {
    const pulse = 0.72 + Math.sin(now * 0.012 + obstacle.x * 0.02) * 0.28;
    ctx.shadowColor = "#ffb347";
    ctx.shadowBlur = 18 * pulse;
    const fill = ctx.createLinearGradient(0, obstacle.y, 0, obstacle.y + obstacle.h);
    fill.addColorStop(0, "rgba(255, 196, 92, 0.92)");
    fill.addColorStop(0.6, "rgba(255, 122, 64, 0.82)");
    fill.addColorStop(1, "rgba(255, 47, 118, 0.85)");
    ctx.fillStyle = fill;
    roundedRect(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, radius);
    ctx.fill();
    ctx.strokeStyle = "#ffe6a8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(18, 2, 32, 0.8)";
    ctx.lineWidth = 4;
    const stripes = 4;
    for (let index = 0; index < stripes; index += 1) {
      const offset = ((now * 0.06 + index * 24) % (obstacle.w + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(obstacle.x + offset, obstacle.y + obstacle.h);
      ctx.lineTo(obstacle.x + offset + 18, obstacle.y);
      ctx.stroke();
    }
  } else {
    const color = obstacle.kind === "tall" ? "#b46bff" : "#ff3ea5";
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    const fill = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.h);
    fill.addColorStop(0, obstacle.kind === "tall" ? "rgba(180, 107, 255, 0.9)" : "rgba(255, 62, 165, 0.92)");
    fill.addColorStop(1, "rgba(54, 6, 74, 0.95)");
    ctx.fillStyle = fill;
    roundedRect(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, radius);
    ctx.fill();
    ctx.strokeStyle = obstacle.kind === "tall" ? "#e4c7ff" : "#ffd2ea";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obstacle.x + 5, obstacle.y + 8);
    ctx.lineTo(obstacle.x + obstacle.w - 5, obstacle.y + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOrb(ctx: CanvasRenderingContext2D, orb: GameState["orbs"][number], now: number) {
  if (orb.taken) return;
  const pulse = 1 + Math.sin(now * 0.006 + orb.id) * 0.12;
  ctx.save();
  ctx.shadowColor = "#7df9ff";
  ctx.shadowBlur = 22;
  const fill = ctx.createRadialGradient(orb.x - 3, orb.y - 4, 1, orb.x, orb.y, orb.r * pulse);
  fill.addColorStop(0, "#ffffff");
  fill.addColorStop(0.45, "#9ffcff");
  fill.addColorStop(1, "rgba(56, 195, 255, 0.15)");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(125, 249, 255, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, (orb.r + 5) * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  if (state.status === "over") return;
  const sliding = state.player.sliding && state.player.grounded;
  const height = sliding ? SLIDE_HEIGHT : PLAYER_HEIGHT;
  const width = sliding ? PLAYER_WIDTH + 12 : PLAYER_WIDTH;
  const x = PLAYER_X;
  const y = state.player.y - height;
  const stride = Math.sin(now * 0.022) * 9;

  ctx.save();
  ctx.shadowColor = "#3ef2ff";
  ctx.shadowBlur = 26;

  // Motion trail.
  for (let index = 3; index >= 1; index -= 1) {
    ctx.globalAlpha = 0.12 * (4 - index);
    ctx.fillStyle = "#38e6ff";
    roundedRect(ctx, x - index * 13, y + 2, width, height - 4, 10);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const body = ctx.createLinearGradient(x, y, x, y + height);
  body.addColorStop(0, "#f4ffff");
  body.addColorStop(0.28, "#7df9ff");
  body.addColorStop(1, "#1a7dff");
  ctx.fillStyle = body;
  roundedRect(ctx, x, y, width, height, 11);
  ctx.fill();

  // Visor.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#08142e";
  roundedRect(ctx, x + width - 15, y + (sliding ? 8 : 12), 9, 5, 2.5);
  ctx.fill();

  // Legs / slide streak.
  ctx.strokeStyle = "#9ffcff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  if (sliding) {
    ctx.beginPath();
    ctx.moveTo(x - 12, y + height - 6);
    ctx.lineTo(x + 4, y + height - 6);
    ctx.stroke();
  } else if (state.player.grounded) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + height - 4);
    ctx.lineTo(x + 8 + stride, y + height + 13);
    ctx.moveTo(x + width - 10, y + height - 4);
    ctx.lineTo(x + width - 10 - stride, y + height + 13);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + 9, y + height - 4);
    ctx.lineTo(x + 2, y + height + 9);
    ctx.moveTo(x + width - 9, y + height - 4);
    ctx.lineTo(x + width - 2, y + height + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEffects(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  for (const float of state.floats) {
    const alpha = Math.max(0, float.life / float.maxLife);
    ctx.globalAlpha = alpha;
    ctx.font = "800 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = float.color;
    ctx.shadowColor = float.color;
    ctx.shadowBlur = 12;
    ctx.fillText(float.text, float.x, float.y);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.textAlign = "start";
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawLevelFlash(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.levelFlash <= 0) return;
  const alpha = Math.min(1, state.levelFlash / 0.7);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.font = "900 46px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#ffe66d";
  ctx.shadowColor = "#ff3ea5";
  ctx.shadowBlur = 26;
  ctx.fillText(`LEVEL ${state.level}`, VIEW_WIDTH / 2, 206);
  ctx.font = "800 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#7df9ff";
  ctx.shadowBlur = 14;
  ctx.fillText(levelName(state.level).toUpperCase(), VIEW_WIDTH / 2, 232);
  ctx.restore();
}

/** Draws one frame of the run onto a 960 × 480 logical canvas. */
export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const theme = themeFor(state.level);
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.save();

  if (state.shake > 0) {
    const amount = state.shake * 9;
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  drawSky(ctx, state, now, theme);
  drawTrack(ctx, state, theme);
  for (const orb of state.orbs) drawOrb(ctx, orb, now);
  for (const obstacle of state.obstacles) drawObstacle(ctx, obstacle, now);
  drawPlayer(ctx, state, now);
  drawEffects(ctx, state);
  drawLevelFlash(ctx, state);

  // Soft vignette keeps the HUD readable.
  const vignette = ctx.createRadialGradient(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 220, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 640);
  vignette.addColorStop(0, "rgba(3, 0, 12, 0)");
  vignette.addColorStop(1, "rgba(3, 0, 12, 0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  ctx.restore();
}
