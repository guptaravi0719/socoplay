import {
  BALL_RADIUS,
  POCKETS,
  RAIL,
  TABLE_HEIGHT,
  TABLE_WIDTH,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  isAiTurn,
  isValidCuePlacement,
  predictAim,
  type Ball,
  type GameState,
} from "./pool-engine";

export type RenderOptions = {
  aim: { angle: number; power: number } | null;
  pointer: { x: number; y: number } | null;
  aiming: boolean;
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "rgba(247, 222, 150, 0.62)";
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawTable(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  const frame = ctx.createLinearGradient(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  frame.addColorStop(0, "#6f4926");
  frame.addColorStop(0.45, "#4a2c14");
  frame.addColorStop(1, "#2b170a");
  roundedRect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT, 22);
  ctx.fillStyle = frame;
  ctx.fill();
  ctx.strokeStyle = "rgba(247, 210, 126, 0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const felt = ctx.createRadialGradient(
    RAIL + TABLE_WIDTH * 0.5,
    RAIL + TABLE_HEIGHT * 0.45,
    40,
    RAIL + TABLE_WIDTH * 0.5,
    RAIL + TABLE_HEIGHT * 0.5,
    TABLE_WIDTH * 0.62,
  );
  felt.addColorStop(0, "#1a745c");
  felt.addColorStop(0.55, "#0f5a48");
  felt.addColorStop(1, "#093a2f");
  roundedRect(ctx, RAIL, RAIL, TABLE_WIDTH, TABLE_HEIGHT, 9);
  ctx.fillStyle = felt;
  ctx.fill();

  ctx.save();
  roundedRect(ctx, RAIL, RAIL, TABLE_WIDTH, TABLE_HEIGHT, 9);
  ctx.clip();
  const vignette = ctx.createRadialGradient(
    RAIL + TABLE_WIDTH / 2,
    RAIL + TABLE_HEIGHT / 2,
    TABLE_WIDTH * 0.2,
    RAIL + TABLE_WIDTH / 2,
    RAIL + TABLE_HEIGHT / 2,
    TABLE_WIDTH * 0.72,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = vignette;
  ctx.fillRect(RAIL, RAIL, TABLE_WIDTH, TABLE_HEIGHT);

  ctx.strokeStyle = "rgba(232, 255, 246, 0.14)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(RAIL + TABLE_WIDTH * 0.25, RAIL + 4);
  ctx.lineTo(RAIL + TABLE_WIDTH * 0.25, RAIL + TABLE_HEIGHT - 4);
  ctx.stroke();

  ctx.fillStyle = "rgba(236, 255, 247, 0.32)";
  for (const spot of [
    { x: RAIL + TABLE_WIDTH * 0.25, y: RAIL + TABLE_HEIGHT / 2 },
    { x: RAIL + TABLE_WIDTH * 0.75, y: RAIL + TABLE_HEIGHT / 2 },
  ]) {
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '700 46px Georgia, "Times New Roman", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(236, 255, 247, 0.045)";
  ctx.fillText("SOCO POOL", RAIL + TABLE_WIDTH / 2, RAIL + TABLE_HEIGHT / 2 + 18);
  ctx.restore();

  for (const pocket of POCKETS) {
    const x = RAIL + pocket.x;
    const y = RAIL + pocket.y;
    ctx.beginPath();
    ctx.arc(x, y, pocket.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#1c0f07";
    ctx.fill();
    const hole = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, pocket.radius);
    hole.addColorStop(0, "#020202");
    hole.addColorStop(0.7, "#0a0a0a");
    hole.addColorStop(1, "#24170d");
    ctx.beginPath();
    ctx.arc(x, y, pocket.radius, 0, Math.PI * 2);
    ctx.fillStyle = hole;
    ctx.fill();
    ctx.strokeStyle = "rgba(247, 210, 126, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const railX = [0.125, 0.25, 0.375, 0.625, 0.75, 0.875];
  for (const fraction of railX) {
    drawDiamond(ctx, RAIL + TABLE_WIDTH * fraction, RAIL * 0.5, 7);
    drawDiamond(ctx, RAIL + TABLE_WIDTH * fraction, VIEW_HEIGHT - RAIL * 0.5, 7);
  }
  for (const fraction of [0.25, 0.5, 0.75]) {
    drawDiamond(ctx, RAIL * 0.5, RAIL + TABLE_HEIGHT * fraction, 7);
    drawDiamond(ctx, VIEW_WIDTH - RAIL * 0.5, RAIL + TABLE_HEIGHT * fraction, 7);
  }
}

function drawShadow(ctx: CanvasRenderingContext2D, ball: Ball) {
  if (ball.pocketed) return;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(RAIL + ball.x + 2.5, RAIL + ball.y + 4, BALL_RADIUS * 1.02, BALL_RADIUS * 0.86, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  if (ball.pocketed) return;
  const x = RAIL + ball.x;
  const y = RAIL + ball.y;
  const radius = BALL_RADIUS;

  ctx.save();
  const gradient = ctx.createRadialGradient(
    x - radius * 0.38,
    y - radius * 0.42,
    radius * 0.08,
    x,
    y,
    radius * 1.04,
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.92)");
  gradient.addColorStop(0.18, ball.color);
  gradient.addColorStop(0.78, ball.color);
  gradient.addColorStop(1, "rgba(0,0,0,0.52)");

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  if (ball.type === "stripe") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#f8f3e7";
    ctx.fillRect(x - radius, y - radius * 0.47, radius * 2, radius * 0.94);
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(0, 0, 0, 0.38)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (ball.number !== 0) {
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.43, 0, Math.PI * 2);
    ctx.fillStyle = "#faf5e9";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = "#171717";
    ctx.font = `700 ${ball.number >= 10 ? radius * 0.5 : radius * 0.62}px "Times New Roman", Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(ball.number), x, y + 0.6);
  }

  ctx.beginPath();
  ctx.ellipse(x - radius * 0.32, y - radius * 0.38, radius * 0.22, radius * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fill();
  ctx.restore();
}

function drawCue(
  ctx: CanvasRenderingContext2D,
  cue: Ball,
  angle: number,
  power: number,
) {
  if (cue.pocketed) return;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const tipDistance = BALL_RADIUS + 7 + power * 30;
  const tipX = RAIL + cue.x - dirX * tipDistance;
  const tipY = RAIL + cue.y - dirY * tipDistance;
  const buttX = tipX - dirX * 185;
  const buttY = tipY - dirY * 185;

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.32)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(buttX + 3, buttY + 5);
  ctx.lineTo(tipX + 3, tipY + 5);
  ctx.stroke();

  const wood = ctx.createLinearGradient(buttX, buttY, tipX, tipY);
  wood.addColorStop(0, "#67411f");
  wood.addColorStop(0.45, "#b47a3f");
  wood.addColorStop(0.82, "#e0bc82");
  wood.addColorStop(1, "#f7ead1");
  ctx.strokeStyle = wood;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(buttX, buttY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(44, 24, 10, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(buttX, buttY);
  ctx.lineTo(buttX + dirX * 54, buttY + dirY * 54);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(tipX, tipY, 3.6, 0, Math.PI * 2);
  ctx.fillStyle = "#e8e2d2";
  ctx.fill();
  ctx.restore();
}

function drawGuide(ctx: CanvasRenderingContext2D, state: GameState, angle: number) {
  const prediction = predictAim(state, angle);
  const legalColor = prediction.legal
    ? "rgba(248, 202, 91, 0.95)"
    : "rgba(255, 119, 105, 0.9)";
  ctx.save();
  ctx.setLineDash([9, 8]);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "rgba(248, 202, 91, 0.72)";
  ctx.beginPath();
  ctx.moveTo(RAIL + prediction.cue.x, RAIL + prediction.cue.y);
  ctx.lineTo(RAIL + prediction.end.x, RAIL + prediction.end.y);
  ctx.stroke();

  if (prediction.ghost) {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(RAIL + prediction.ghost.x, RAIL + prediction.ghost.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = legalColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    const target = state.balls.find((ball) => ball.number === prediction.target && !ball.pocketed);
    if (target && prediction.objectDir) {
      ctx.beginPath();
      ctx.moveTo(RAIL + target.x, RAIL + target.y);
      ctx.lineTo(
        RAIL + target.x + prediction.objectDir.x * 92,
        RAIL + target.y + prediction.objectDir.y * 92,
      );
      ctx.strokeStyle = "rgba(236, 255, 247, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 7]);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBallInHand(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pointer: { x: number; y: number } | null,
) {
  if (!state.ballInHand || !pointer) return;
  const valid = isValidCuePlacement(state, pointer.x, pointer.y);
  ctx.save();
  ctx.beginPath();
  ctx.arc(RAIL + pointer.x, RAIL + pointer.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = valid ? "rgba(248, 244, 232, 0.32)" : "rgba(255, 119, 105, 0.22)";
  ctx.fill();
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = valid ? "rgba(248, 202, 91, 0.9)" : "rgba(255, 119, 105, 0.9)";
  ctx.stroke();
  ctx.restore();
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  options: RenderOptions,
) {
  drawTable(ctx);

  const cue = state.balls[0];
  const canAim =
    !state.gameOver &&
    !state.ballInHand &&
    !state.shotInProgress &&
    !cue.pocketed &&
    !isAiTurn(state);

  if (canAim && options.aim) {
    drawGuide(ctx, state, options.aim.angle);
  }

  const balls = state.balls.filter(
    (ball) => !ball.pocketed && !(state.ballInHand && ball.number === 0),
  );
  for (const ball of balls) drawShadow(ctx, ball);
  for (const ball of balls) drawBall(ctx, ball);

  if (canAim) {
    drawCue(ctx, cue, options.aim?.angle ?? 0, options.aim?.power ?? 0);
  }

  drawBallInHand(ctx, state, options.pointer);
}
