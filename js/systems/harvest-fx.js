/* js/systems/harvest-fx.js — 工具作用在物件上的交互动画。
 *
 *   镐：岩石先摇晃，第二下碎裂，碎石 + 石材掉落
 *   镰刀：野花 / 草地先倒伏淡出，再变成空地
 *   锄头：翻起泥土
 *   水壶：水滴 + 水面涟漪
 *   播种：种子落下
 *   收获：作物颜色的碎叶
 */

'use strict';

import { spawnDrop } from './drops.js';
import { MINERALS } from '../anim/minerals.js';

const ROCK_HITS = 2;
const ROCK_SHAKE = 0.2;
const CUT_TIME = 0.3;

const rockHit = new Map();      /* index -> { hits, shake } */
const cutState = new Map();     /* index -> { t, type, dir } */
const particles = [];
const ripples = [];

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function addParticle(x, y, opts) {
  particles.push({
    x, y,
    z: opts.z ?? 4,
    vx: opts.vx ?? 0,
    vy: opts.vy ?? 0,
    vz: opts.vz ?? 40,
    g: opts.g ?? 260,
    life: opts.life ?? 0.45,
    maxLife: opts.life ?? 0.45,
    color: opts.color ?? '#b08a55',
    size: opts.size ?? 2
  });
}

function burst(tx, ty, kind, color) {
  const c = tileCenter(tx, ty);
  const n = kind === 'rockbreak' ? 12 : 6;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
    const sp = 24 + Math.random() * 46;
    const col = color || (kind === 'water' ? '#7cc8f0'
      : kind === 'sickle' ? (i % 2 ? '#5fae4a' : '#3f7f32')
      : kind === 'rockbreak' ? (i % 3 ? '#8a8a7a' : '#5a5a4e')
      : kind === 'harvest' ? (i % 2 ? '#e0a040' : '#6aa04a')
      : kind === 'sow' ? '#7a5a34'
      : (i % 2 ? '#8a6a42' : '#b08a55'));
    addParticle(c.x + (Math.random() - 0.5) * 10, c.y + 4, {
      vx: Math.cos(a) * sp * (0.4 + Math.random()),
      vy: Math.sin(a) * sp * 0.5,
      vz: 60 + Math.random() * 90,
      life: 0.35 + Math.random() * 0.3,
      color: col,
      size: kind === 'rockbreak' && i % 2 ? 3 : 2
    });
  }

  if (kind === 'water') {
    ripples.push({ x: c.x, y: c.y + 8, r: 3, maxR: 15, life: 0.5, maxLife: 0.5 });
  }
}

/** 通用地块反馈：锄地 / 浇水 / 播种 / 收获 / 割草 / 敲石头 */
function spawnTileFx(kind, tx, ty, color) {
  burst(tx, ty, kind, color);
}

/* ---------- 岩石 ---------- */

/** 按稀有度抽一枚矿物：越贵越难出。 */
function rollMineral() {
  let total = 0;
  for (const m of MINERALS) total += 1 / Math.sqrt(Math.max(1, m.price));
  let r = Math.random() * total;
  for (const m of MINERALS) {
    r -= 1 / Math.sqrt(Math.max(1, m.price));
    if (r <= 0) return m;
  }
  return MINERALS[0];
}

function mineRock(i, tx, ty) {
  if (map[i] !== T.ROCK) return false;
  if (typeof payStamina === 'function' && !payStamina(staminaCost('pick'))) return false;

  const st = rockHit.get(i) || { hits: 0, shake: 0 };
  st.hits++;
  st.shake = ROCK_SHAKE;
  rockHit.set(i, st);

  burst(tx, ty, 'pick');
  if (typeof playSfx === 'function') playSfx(147, 'square', 0.05, CONFIG.AUDIO.VOLUME * 0.7);

  if (st.hits >= ROCK_HITS) {
    rockHit.delete(i);
    setTile(i, T.DIRT);
    burst(tx, ty, 'rockbreak');
    spawnDrop('stone', 2, tx * TILE + TILE / 2, ty * TILE + TILE - 6, 90);
    /* 35% 概率额外掉一枚矿物，按价格加权 */
    if (Math.random() < 0.35) {
      const mineral = rollMineral();
      spawnDrop(mineral.id, 1, tx * TILE + TILE / 2, ty * TILE + TILE - 6, 78);
    }
    if (typeof questEmit === 'function') questEmit('material', { id: 'stone', n: 2 });
    if (typeof playSfx === 'function') playSfx(110, 'triangle', 0.1, CONFIG.AUDIO.VOLUME * 0.6);
  }
  return true;
}

function drawRockWithState(g, px, py, i) {
  const st = rockHit.get(i);
  if (!st) return drawRock(g, px, py);
  const k = Math.max(0, st.shake) / ROCK_SHAKE;
  g.save();
  g.translate(Math.round(Math.sin((ROCK_SHAKE - st.shake) * 80) * 2 * k), 0);
  drawRock(g, px, py);
  g.restore();
}

/* ---------- 野花 / 草地 ---------- */

function cutObject(i, tx, ty) {
  if (cutState.has(i)) return true;
  const t = map[i];
  if (t !== T.FLOWER && t !== T.GRASS) return false;

  /* 割草地会得到 1 份饲料：先确认背包放得下，再动手 */
  const feedId = CONFIG.ANIMALS.FEED_ITEM;
  if (t === T.GRASS && typeof canFit === 'function' && !canFit(feedId, 1)) {
    if (typeof toast === 'function') toast('背包满了，装不下' + itemDef(feedId).name);
    return false;
  }
  if (typeof payStamina === 'function' && !payStamina(staminaCost('sickle'))) return false;

  cutState.set(i, {
    t: 0,
    type: t,
    dir: (typeof player !== 'undefined' && player.x < tx * TILE + TILE / 2) ? -1 : 1
  });

  burst(tx, ty, 'sickle');
  if (t === T.GRASS) {
    if (typeof addItem === 'function') addItem(feedId, 1);
    if (typeof questEmit === 'function') questEmit('material', { id: feedId, n: 1 });
    if (typeof toast === 'function') toast('割下一把草，得到 ' + itemDef(feedId).name + ' ×1');
  } else if (typeof toast === 'function') {
    toast('清理了地面');
  }
  if (typeof playSfx === 'function') playSfx(988, CONFIG.AUDIO.TYPE, CONFIG.AUDIO.DUR, CONFIG.AUDIO.VOLUME);
  return true;
}

function drawFlowerWithState(g, px, py, i, v) {
  const st = cutState.get(i);
  if (!st) return drawFlower(g, px, py, v);
  const k = Math.min(1, st.t / CUT_TIME);
  const cx = px + TILE / 2;
  const cy = py + TILE - 6;
  g.save();
  g.globalAlpha = 1 - k * 0.9;
  g.translate(cx, cy);
  g.rotate(st.dir * k * 0.9);
  g.translate(-cx, -cy);
  drawFlower(g, px, py, v);
  g.restore();
}

/* ---------- 更新 / 绘制 ---------- */

function updateHarvestFx(dt) {
  for (const [i, st] of cutState) {
    st.t += dt;
    if (st.t >= CUT_TIME) {
      if (map[i] === st.type) setTile(i, T.BARE);
      cutState.delete(i);
    }
  }
  for (const [i, st] of rockHit) {
    st.shake = Math.max(0, st.shake - dt);
    if (map[i] !== T.ROCK) rockHit.delete(i);
  }

  for (let k = particles.length - 1; k >= 0; k--) {
    const p = particles[k];
    p.life -= dt;
    p.vz -= p.g * dt;
    p.z += p.vz * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.z < 0) { p.z = 0; p.vz *= -0.25; p.vx *= 0.5; p.vy *= 0.5; }
    if (p.life <= 0) particles.splice(k, 1);
  }

  for (let k = ripples.length - 1; k >= 0; k--) {
    const r = ripples[k];
    r.life -= dt;
    r.r += (r.maxR - r.r) * dt * 6;
    if (r.life <= 0) ripples.splice(k, 1);
  }
}

function drawHarvestFx(g) {
  for (const r of ripples) {
    g.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.7;
    g.strokeStyle = '#a8e0ff';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(r.x - cam.x, r.y - cam.y, r.r, r.r * 0.42, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.globalAlpha = 1;

  for (const p of particles) {
    g.globalAlpha = Math.max(0, p.life / p.maxLife);
    g.fillStyle = p.color;
    g.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y - p.z), p.size, p.size);
  }
  g.globalAlpha = 1;
}

Object.assign(window, {
  spawnTileFx,
  mineRock,
  cutObject,
  updateHarvestFx,
  drawHarvestFx,
  drawRockWithState,
  drawFlowerWithState
});
export {
  spawnTileFx, mineRock, cutObject,
  updateHarvestFx, drawHarvestFx, drawRockWithState, drawFlowerWithState
};
