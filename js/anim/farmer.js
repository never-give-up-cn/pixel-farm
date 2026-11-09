/* 动作姿势表：把 (动作, 朝向, 0~1 进度) 变成一套关节姿势，再画到精灵格。
 * 对外只暴露 drawFarmer，后续游戏里可以直接复用它生成帧或实时绘制。 */

import {
  CELL_W, CELL_H, DIR_LEFT, DIR_RIGHT, DIR_UP, PALETTE, TAU, lerp, sampleKeys
} from './pixel.js';
import { basePose, drawStanding, drawSleeping } from './farmer-body.js';
import { drawTool, drawEffect, impactDust, waterDrops } from './farmer-tools.js';

const TOOL_CFG = {
  hoe:    { wind: { x: -2, y: 7 },  hit: { x: 10, y: 33 } },
  axe:    { wind: { x: 0, y: 6 },   hit: { x: 11, y: 33 } },
  pick:   { wind: { x: 2, y: 7 },   hit: { x: 11, y: 32 } },
  sickle: { wind: { x: 6, y: 20 },  hit: { x: 13, y: 31 } }
};

function viewOf(dir) {
  if (dir === DIR_UP) return 'back';
  if (dir === DIR_LEFT || dir === DIR_RIGHT) return 'side';
  return 'front';
}

function poseIdle(view, side, t) {
  const bob = Math.sin(t * TAU) > 0.55 ? -1 : 0;
  const p = basePose(view, bob, 0);
  p.eyesClosed = t >= 0.6;
  return p;
}

function poseWalk(view, side, t, run) {
  const amp = run ? 6 : 4;
  const lift = run ? 4 : 3;
  const s = Math.sin(t * TAU);
  const bob = Math.abs(s) > 0.72 ? (run ? -2 : -1) : 0;
  const p = basePose(view, bob, side ? (run ? 2 : 1) : 0);
  const cx = p.cx;

  if (side) {
    p.footR = { x: cx + 1 + amp * s, y: 35 - Math.max(0, s) * lift };
    p.footL = { x: cx - 1 - amp * s, y: 35 - Math.max(0, -s) * lift };
    p.handR = { x: cx + 3 - amp * s * 0.9, y: (run ? 21 : 23) + bob };
    p.handL = { x: cx - 3 + amp * s * 0.9, y: (run ? 21 : 23) + bob };
  } else {
    p.footL = { x: cx - 3 + Math.round(s), y: 35 - Math.max(0, s) * lift };
    p.footR = { x: cx + 3 - Math.round(s), y: 35 - Math.max(0, -s) * lift };
    p.handL = { x: cx - 6, y: (run ? 21 : 23) + bob + 2 * s };
    p.handR = { x: cx + 6, y: (run ? 21 : 23) + bob - 2 * s };
  }
  return p;
}

function poseWater(view, side, t) {
  const p = basePose(view, 1, side ? 1 : 0);
  const cx = p.cx;
  const sway = Math.round(Math.sin(t * TAU));
  p.handR = { x: cx + 4, y: 21 };
  p.handL = { x: cx + 1, y: 22 };
  const tip = { x: cx + 7, y: 23 + sway };
  p.tool = { kind: 'water', hand: p.handR, tip, phase: t };
  p.effects.push(...waterDrops(tip, t));
  return p;
}

function poseFish(view, side, t) {
  const p = basePose(view, 0, side ? 1 : 0);
  const cx = p.cx;
  const sway = Math.round(Math.sin(t * TAU));
  p.handR = { x: cx + 4, y: 21 };
  p.handL = { x: cx + 1, y: 22 };
  const tip = { x: cx + 9, y: 8 + sway };
  p.tool = { kind: 'fish', hand: p.handR, tip, phase: t };
  return p;
}

function poseHarvest(view, side, t) {
  const crouch = (t > 0.12 && t < 0.72) ? 2 : 0;
  const p = basePose(view, crouch, side ? 1 : 0);
  const cx = p.cx;
  const reach = sampleKeys([
    [0.00, { x: cx + 5, y: 24 }],
    [0.35, { x: cx + 5, y: 33 }],
    [0.55, { x: cx + 5, y: 33 }],
    [0.78, { x: cx + 4, y: 24 }],
    [1.00, { x: cx + 5, y: 24 }]
  ], t);
  p.handR = reach;
  p.handL = { x: cx - 4, y: 24 };

  if (t > 0.35) {
    const q = Math.min(1, (t - 0.35) / 0.45);
    p.hold = t > 0.55 ? 'crop' : null;
    p.effects.push({ x: cx + 5, y: 34 - q * 14, c: PALETTE.leaf, size: 2 });
    p.effects.push({ x: cx + 3, y: 34 - q * 11, c: PALETTE.leafShade, size: 1 });
    p.effects.push({ x: cx + 7, y: 34 - q * 8, c: PALETTE.crop, size: 1 });
  }
  return p;
}

function poseTool(action, view, side, t) {
  const cfg = TOOL_CFG[action];
  const impactBob = (t > 0.45 && t < 0.62) ? 1 : 0;
  const p = basePose(view, impactBob, side ? 1 : 0);
  const cx = p.cx;

  const keys = [
    [0.00, { x: cx + 8, y: 22 }],
    [0.32, { x: cx + cfg.wind.x, y: cfg.wind.y }],
    [0.52, { x: cx + cfg.hit.x, y: cfg.hit.y }],
    [0.70, { x: cx + cfg.hit.x, y: cfg.hit.y }],
    [1.00, { x: cx + 8, y: 22 }]
  ];
  const tip = sampleKeys(keys, t);
  const hand = {
    x: lerp(p.shR.x, tip.x, 0.38),
    y: lerp(p.shR.y, tip.y, 0.38)
  };
  p.handR = hand;
  p.handL = {
    x: lerp(p.shL.x, tip.x, 0.28),
    y: lerp(p.shL.y, tip.y, 0.28)
  };
  p.tool = { kind: action, hand, tip, phase: t };

  const dust = impactDust(cx + cfg.hit.x, cfg.hit.y, t);
  if (action === 'sickle') {
    for (const d of dust) d.c = d.c === PALETTE.dirt ? PALETTE.leaf : PALETTE.leafShade;
  }
  p.effects.push(...dust);
  return p;
}

function poseHurt(view, side, t) {
  const p = basePose(view, 0, side ? 1 : 0);
  p.hurt = true;
  p.shake = Math.round(Math.sin(t * TAU * 4));
  p.handL = { x: p.cx - 8, y: 16 };
  p.handR = { x: p.cx + 8, y: 16 };
  p.footL = { x: p.cx - 5, y: 35 };
  p.footR = { x: p.cx + 5, y: 35 };
  if (t < 0.45) p.tint = 'rgba(224, 90, 74, 0.45)';
  return p;
}

function actionPose(action, dir, phase) {
  const view = viewOf(dir);
  const side = view === 'side';
  const t = phase;

  if (action === 'sleep') {
    const p = basePose(view, 0, 0);
    p.asleep = true;
    return p;
  }
  if (action === 'hurt') return poseHurt(view, side, t);
  if (action === 'idle') return poseIdle(view, side, t);
  if (action === 'walk') return poseWalk(view, side, t, false);
  if (action === 'run') return poseWalk(view, side, t, true);
  if (action === 'water') return poseWater(view, side, t);
  if (action === 'fish') return poseFish(view, side, t);
  if (action === 'harvest') return poseHarvest(view, side, t);
  if (TOOL_CFG[action]) return poseTool(action, view, side, t);
  return basePose(view, 0, 0);
}

export function drawFarmer(g, action, dir, phase) {
  g.save();
  g.imageSmoothingEnabled = false;

  let d = dir;
  if (dir === DIR_LEFT) {
    g.translate(CELL_W, 0);
    g.scale(-1, 1);
    d = DIR_RIGHT;
  }

  const p = actionPose(action, d, phase);
  if (p.shake) g.translate(p.shake, 0);

  if (p.asleep) {
    drawSleeping(g, phase);
  } else {
    drawStanding(g, p);
    if (p.tool) drawTool(g, p.tool);
    for (const e of p.effects) drawEffect(g, e);
  }

  if (p.tint) {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = p.tint;
    g.fillRect(0, 0, CELL_W, CELL_H);
    g.globalCompositeOperation = 'source-over';
  }

  g.restore();
}

export { CELL_W, CELL_H };
