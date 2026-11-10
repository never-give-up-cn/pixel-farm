/* 工具与特效：锄头 / 斧头 / 镐 / 镰刀 / 水壶 / 鱼竿，以及土屑、水滴、鱼漂。
 * 工具都从 hand 指向 tip，用像素直线绘制，任意角度都不会糊。 */

import { PALETTE, R, line, ellipse, TAU } from './pixel.js';

function drawHandle(g, hand, tip) {
  line(g, hand.x + 1, hand.y + 1, tip.x + 1, tip.y + 1, PALETTE.woodShade, 2);
  line(g, hand.x, hand.y, tip.x, tip.y, PALETTE.wood, 2);
}

function drawHoe(g, tip, px, py, ux, uy) {
  line(g, tip.x, tip.y, tip.x + px * 4, tip.y + py * 4, PALETTE.metalShade, 2);
  line(g, tip.x + px * 4, tip.y + py * 4,
          tip.x + px * 4 + ux * 2, tip.y + py * 4 + uy * 2, PALETTE.metal, 2);
}

function drawAxe(g, tip, px, py) {
  const bx = tip.x + px * 4;
  const by = tip.y + py * 4;
  line(g, tip.x, tip.y, bx, by, PALETTE.metal, 3);
  R(g, bx - 1, by - 1, 3, 3, PALETTE.metal);
  R(g, bx + Math.sign(px) - 1, by + Math.sign(py) - 1, 2, 2, PALETTE.metalShade);
}

function drawPick(g, tip, px, py, ux, uy) {
  line(g, tip.x - px * 4, tip.y - py * 4,
          tip.x + px * 4, tip.y + py * 4, PALETTE.metal, 2);
  line(g, tip.x - px * 4, tip.y - py * 4,
          tip.x - px * 4 - ux * 2, tip.y - py * 4 - uy * 2, PALETTE.metalShade, 2);
  line(g, tip.x + px * 4, tip.y + py * 4,
          tip.x + px * 4 - ux * 2, tip.y + py * 4 - uy * 2, PALETTE.metalShade, 2);
}

function drawSickle(g, tip, px, py, ux, uy) {
  const b1 = { x: tip.x + px * 3, y: tip.y + py * 3 };
  const b2 = { x: b1.x + ux * 4 - px * 2, y: b1.y + uy * 4 - py * 2 };
  const b3 = { x: b2.x + ux * 3 - px * 2, y: b2.y + uy * 3 - py * 2 };
  line(g, tip.x, tip.y, b1.x, b1.y, PALETTE.metal, 2);
  line(g, b1.x, b1.y, b2.x, b2.y, PALETTE.metal, 2);
  line(g, b2.x, b2.y, b3.x, b3.y, PALETTE.metalShade, 1);
}

function drawWaterCan(g, hand, tip, ux, uy) {
  const bx = Math.round(tip.x);
  const by = Math.round(tip.y);

  /* 壶身 */
  R(g, bx - 3, by - 2, 7, 6, PALETTE.metalShade);
  R(g, bx - 2, by - 3, 5, 2, PALETTE.metal);
  R(g, bx - 3, by + 4, 7, 1, PALETTE.metal);
  R(g, bx - 2, by - 1, 2, 2, PALETTE.waterLight);

  /* 壶嘴朝外 */
  line(g, bx + ux * 4, by + uy * 4, bx + ux * 7, by + uy * 7, PALETTE.metal, 2);
  R(g, bx + ux * 7 - 1, by + uy * 7 - 1, 2, 2, PALETTE.metalShade);

  /* 提手连到手上 */
  line(g, bx - 3, by - 3, hand.x, hand.y - 1, PALETTE.metalShade, 2);
  line(g, hand.x, hand.y - 1, bx - 4, by + 1, PALETTE.metalShade, 2);
}

function drawFishingRod(g, hand, tip, phase) {
  line(g, hand.x, hand.y, tip.x, tip.y, PALETTE.wood, 1);

  const bobX = Math.round(tip.x + 1);
  const bobY = 34;
  line(g, tip.x, tip.y, bobX, bobY - 2, 'rgba(255, 246, 224, 0.55)', 1);

  R(g, bobX - 1, bobY - 3, 3, 2, PALETTE.red);
  R(g, bobX - 1, bobY - 2, 3, 1, PALETTE.white);

  const r = 2 + Math.round(Math.abs(Math.sin(phase * TAU)) * 3);
  ellipse(g, bobX, bobY + 1, r, 1, 'rgba(108, 196, 242, 0.45)');
  ellipse(g, bobX, bobY + 1, r + 2, 1, 'rgba(108, 196, 242, 0.22)');
}

function drawSword(g, hand, tip, px, py, ux, uy) {
  /* 剑身 */
  line(g, hand.x, hand.y, tip.x, tip.y, PALETTE.metalShade, 3);
  line(g, hand.x, hand.y, tip.x, tip.y, PALETTE.metal, 1);
  R(g, tip.x - 1, tip.y - 1, 3, 2, '#f0f4f8');

  /* 护手 */
  line(g, hand.x - px * 4, hand.y - py * 4, hand.x + px * 4, hand.y + py * 4, '#c8a050', 2);
  R(g, hand.x - 1, hand.y - 1, 3, 3, '#e0c060');

  /* 剑柄 */
  line(g, hand.x - ux * 4, hand.y - uy * 4, hand.x - ux * 7, hand.y - uy * 7, '#5a3a22', 2);
}

export function drawTool(g, tool) {
  const { hand, tip, kind, phase } = tool;
  const dx = tip.x - hand.x;
  const dy = tip.y - hand.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  if (kind === 'water') {
    drawWaterCan(g, hand, tip, ux, uy);
    return;
  }
  if (kind === 'fish') {
    drawFishingRod(g, hand, tip, phase);
    return;
  }

  drawHandle(g, hand, tip);
  if (kind === 'sword') drawSword(g, hand, tip, px, py, ux, uy);
  else if (kind === 'hoe') drawHoe(g, tip, px, py, ux, uy);
  else if (kind === 'axe') drawAxe(g, tip, px, py);
  else if (kind === 'pick') drawPick(g, tip, px, py, ux, uy);
  else if (kind === 'sickle') drawSickle(g, tip, px, py, ux, uy);
}

export function drawEffect(g, e) {
  R(g, e.x, e.y, e.size || 1, e.size || 1, e.c);
}

/* 挥动工具时溅起的土屑（确定性，不随机） */
export function impactDust(x, y, phase) {
  if (phase < 0.48 || phase > 0.92) return [];
  const q = (phase - 0.48) / 0.44;
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.85 + i * 0.34;
    const d = 2 + q * (6 + (i % 3) * 2);
    out.push({
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d * 0.7,
      c: i % 2 ? PALETTE.dirt : PALETTE.dirtLight,
      size: i % 3 === 0 ? 2 : 1
    });
  }
  return out;
}

/* 浇水时从壶嘴落下的水滴 */
export function waterDrops(tip, phase) {
  const out = [];
  const sx = tip.x + 5;
  const sy = tip.y + 2;
  for (let i = 0; i < 5; i++) {
    const t = (phase * 1.6 + i * 0.19) % 1;
    out.push({
      x: sx + Math.round(Math.sin(t * Math.PI) * 2) - 1,
      y: sy + t * 8,
      c: i % 2 ? PALETTE.water : PALETTE.waterLight
    });
  }
  return out;
}
