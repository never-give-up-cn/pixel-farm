/* js/systems/drops.js — 地面掉落物与自动拾取。
 *
 * 树 / 岩石被破坏时把产物抛到地上：
 *   - 每件物品以随机方向和距离散开（默认最远约 3 格）；
 *   - 落地后轻轻上下浮动；
 *   - 玩家靠近到吸附半径内会被吸过去，进入拾取半径后自动进背包；
 *   - 背包满时留在原地，不会消失。
 */

'use strict';

import { RES_MAP, drawResourceIcon } from '../anim/resources.js';
import { MINERALS, MINERAL_MAP, drawMineral } from '../anim/minerals.js';

const groundDrops = [];
const floatTexts = [];

const GRAVITY = 900;
const MAGNET_RADIUS = 56;     /* 约 1.75 格：走到旁边就开始吸附 */
const PICKUP_RADIUS = 12;
const SETTLE_DAMP = 2.4;

function dropIcon(id) {
  const d = typeof itemDef === 'function' ? itemDef(id) : null;
  return d ? d.icon : '❔';
}

/** 在 (cx, cy) 周围随机散落 n 件物品。spread 为最大水平距离（像素）。 */
function spawnDrop(id, n, cx, cy, spread = 48) {
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2;
    const r = spread * (0.25 + Math.random() * 0.75);
    groundDrops.push({
      id,
      n: 1,
      x: cx + Math.cos(a) * r * 0.6,
      y: cy + Math.sin(a) * r * 0.4,
      vx: Math.cos(a) * (30 + Math.random() * 50),
      vy: Math.sin(a) * (20 + Math.random() * 34),
      z: 8 + Math.random() * 10,
      vz: 110 + Math.random() * 90,
      bob: Math.random() * Math.PI * 2,
      icon: dropIcon(id),
      settled: false
    });
  }
}

function addFloatText(text, x, y) {
  floatTexts.push({ text, x, y, life: 0.9, maxLife: 0.9 });
}

function pickUpDrop(d) {
  if (typeof addItem !== 'function') return false;
  const got = addItem(d.id, d.n);
  if (got <= 0) return false;
  d.n -= got;
  const def = typeof itemDef === 'function' ? itemDef(d.id) : null;
  addFloatText(`+${got} ${d.icon}${def ? ' ' + def.name : ''}`, d.x, d.y - d.z - 6);
  if (def && def.kind === 'mineral' && typeof dexUnlock === 'function') {
    /* 矿物第一次捡到就记进图鉴 */
    const idx = MINERALS.findIndex(m => m.id === d.id);
    if (idx >= 0) dexUnlock('mineral', idx);
  }
  if (typeof playSfx === 'function') playSfx(920, 'triangle', 0.045, CONFIG.AUDIO.VOLUME * 0.35);
  return d.n <= 0;
}

function updateDrops(dt) {
  if (!groundDrops.length && !floatTexts.length) return;
  const px = typeof player !== 'undefined' ? player.x : 0;
  const py = typeof player !== 'undefined' ? player.y + 4 : 0;

  for (let i = groundDrops.length - 1; i >= 0; i--) {
    const d = groundDrops[i];
    d.bob += dt * 4;

    /* 空中：受重力，落地时小幅弹跳 */
    if (d.z > 0 || Math.abs(d.vz) > 1) {
      d.vz -= GRAVITY * dt;
      d.z += d.vz * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.z <= 0) {
        d.z = 0;
        if (d.vz < -55) {
          d.vz = -d.vz * 0.32;
          d.vx *= 0.5;
          d.vy *= 0.5;
        } else {
          d.vz = 0;
          d.vx = 0;
          d.vy = 0;
          d.settled = true;
        }
      }
      d.vx *= Math.max(0, 1 - SETTLE_DAMP * dt);
      d.vy *= Math.max(0, 1 - SETTLE_DAMP * dt);
      continue;
    }

    /* 地面：靠近玩家时吸附 */
    const dx = px - d.x;
    const dy = py - d.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < MAGNET_RADIUS) {
      const pull = 520 * dt * (1 - dist / MAGNET_RADIUS) + 90 * dt;
      d.x += (dx / dist) * pull;
      d.y += (dy / dist) * pull;
      d.z = Math.max(0, d.z - 30 * dt);
    }
    if (dist < PICKUP_RADIUS) {
      if (pickUpDrop(d)) groundDrops.splice(i, 1);
    }
  }

  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const t = floatTexts[i];
    t.life -= dt;
    t.y -= 26 * dt;
    if (t.life <= 0) floatTexts.splice(i, 1);
  }
}

/** 世界坐标绘制（由实体 Y 排序层调用）。 */
function drawGroundDrop(g, d) {
  const sx = Math.round(d.x - cam.x);
  const sy = Math.round(d.y - cam.y);
  const bob = d.settled ? Math.sin(d.bob) * 1.5 : 0;

  g.fillStyle = 'rgba(0,0,0,.24)';
  const sw = Math.max(4, 8 - Math.round(d.z * 0.2));
  g.fillRect(sx - sw / 2, sy - 1, sw, 2);

  /* 优先用 anim 层的 32×32 物品图标（木材 / 石材 / 木炭…），没有就退回 emoji */
  const icon = typeof RES_MAP !== 'undefined' ? RES_MAP[d.id] : null;
  if (icon && typeof drawResourceIcon === 'function') {
    g.save();
    g.translate(sx - 16, Math.round(sy - 31 - d.z + bob));
    drawResourceIcon(g, icon, typeof animTime !== 'undefined' ? animTime : 0.25);
    g.restore();
    return;
  }
  /* 矿物：使用 anim 矿物图鉴的 32×32 图标 */
  const mineral = typeof MINERAL_MAP !== 'undefined' ? MINERAL_MAP[d.id] : null;
  if (mineral) {
    g.save();
    g.translate(sx - 16, Math.round(sy - 31 - d.z + bob));
    drawMineral(g, mineral, typeof animTime !== 'undefined' ? animTime : 0.25);
    g.restore();
    return;
  }

  const oldFont = g.font, oldAlign = g.textAlign, oldBase = g.textBaseline;
  g.font = '14px ' + (typeof FONT_EMOJI !== 'undefined' ? FONT_EMOJI : 'sans-serif');
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillText(d.icon, sx, Math.round(sy - d.z - 2 + bob));
  g.font = oldFont;
  g.textAlign = oldAlign;
  g.textBaseline = oldBase;
}

function drawFloatText(g, t) {
  const oldFont = g.font, oldAlign = g.textAlign;
  g.globalAlpha = Math.max(0, t.life / t.maxLife);
  g.font = '11px ' + (typeof FONT_CJK !== 'undefined' ? FONT_CJK : 'sans-serif');
  g.textAlign = 'center';
  g.fillStyle = '#fff6d8';
  g.strokeStyle = 'rgba(20,16,10,.75)';
  g.lineWidth = 3;
  const sx = Math.round(t.x - cam.x);
  const sy = Math.round(t.y - cam.y);
  g.strokeText(t.text, sx, sy);
  g.fillText(t.text, sx, sy);
  g.globalAlpha = 1;
  g.font = oldFont;
  g.textAlign = oldAlign;
}

Object.assign(window, {
  groundDrops,
  floatTexts,
  spawnDrop,
  updateDrops,
  drawGroundDrop,
  drawFloatText
});
export { groundDrops, floatTexts, spawnDrop, updateDrops, drawGroundDrop, drawFloatText };
