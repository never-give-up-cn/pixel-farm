/* js/systems/forest.js — 砍树：多段受击、摇晃、倒下、掉落。
 *
 * 斧头砍树不再一刀消失：
 *   1. 每砍一次播放摇晃 + 木屑，并累计砍击次数；
 *   2. 第 3 次砍击后整棵树绕根部倒下（约 0.7 秒）；
 *   3. 倒完把地块变成草地，木材从树根向随机方向抛散。
 */

'use strict';

import { spawnDrop } from './drops.js';

const TREE_HITS = 3;
const FALL_TIME = 0.7;
const SHAKE_TIME = 0.24;

/* index -> { hits, shake, fall, dir } */
const treeDamage = new Map();
const treeChips = [];

function treeCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function spawnChips(tx, ty) {
  const c = treeCenter(tx, ty);
  for (let i = 0; i < 5; i++) {
    treeChips.push({
      x: c.x + (Math.random() - 0.5) * 10,
      y: c.y + 8,
      vx: (Math.random() - 0.5) * 70,
      vy: -30 - Math.random() * 60,
      life: 0.35 + Math.random() * 0.2,
      c: i % 2 ? '#8a5a2a' : '#6a4420'
    });
  }
}

/**
 * 砍一次树。返回 true 表示这次点击被树吸收（无论是否砍倒）。
 * 每次砍击单独扣体力；体力不足时返回 false，不产生伤害。
 */
function chopTree(i, tx, ty) {
  if (map[i] !== T.TREE) return false;
  const dmg = treeDamage.get(i);
  if (dmg && dmg.fall >= 0) return true;      /* 正在倒下 */

  if (typeof payStamina === 'function' && !payStamina(staminaCost('axe'))) return false;

  const state = dmg || { hits: 0, shake: 0, fall: -1, dir: 1 };
  state.hits++;
  state.shake = SHAKE_TIME;
  state.dir = player.x < tx * TILE + TILE / 2 ? -1 : 1;
  treeDamage.set(i, state);

  spawnChips(tx, ty);
  if (typeof playSfx === 'function') playSfx(294, 'square', 0.06, CONFIG.AUDIO.VOLUME * 0.7);

  if (state.hits >= TREE_HITS) {
    state.fall = 0;
    if (typeof playSfx === 'function') playSfx(196, 'sawtooth', 0.18, CONFIG.AUDIO.VOLUME * 0.7);
  }
  return true;
}

function updateForest(dt) {
  for (const [i, d] of treeDamage) {
    if (d.shake > 0) d.shake = Math.max(0, d.shake - dt);

    if (d.fall >= 0) {
      d.fall += dt / FALL_TIME;
      if (d.fall >= 1) {
        const tx = i % MAP_W;
        const ty = (i / MAP_W) | 0;
        treeDamage.delete(i);
        setTile(i, T.GRASS);
        if (typeof forgetTree === 'function') forgetTree(tx, ty);
        spawnDrop('wood', 2, tx * TILE + TILE / 2, ty * TILE + TILE - 6, 150);
        if (typeof questEmit === 'function') questEmit('material', { id: 'wood', n: 2 });
        if (typeof playSfx === 'function') playSfx(120, 'triangle', 0.14, CONFIG.AUDIO.VOLUME * 0.6);
      }
    }
  }

  for (let k = treeChips.length - 1; k >= 0; k--) {
    const c = treeChips[k];
    c.life -= dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vy += 260 * dt;
    if (c.life <= 0) treeChips.splice(k, 1);
  }
}

/** 替换原来的 drawTree：带摇晃 / 倒下。 */
function drawTreeWithState(g, px, py, i) {
  const tx = i % MAP_W;
  const ty = (i / MAP_W) | 0;
  const d = treeDamage.get(i);

  if (d && d.fall >= 0) {
    const t = Math.min(1, d.fall);
    const ease = 1 - Math.pow(1 - t, 2.4);          /* 先慢后快 */
    const angle = ease * (Math.PI / 2 - 0.06) * d.dir;
    const bx = px + TILE / 2;
    const by = py + TILE - 4;
    g.save();
    g.translate(bx, by);
    g.rotate(angle);
    g.translate(-bx, -by);
    drawGameTree(g, px, py, tx, ty);
    g.restore();
    return;
  }

  if (d && d.shake > 0) {
    const k = d.shake / SHAKE_TIME;
    g.save();
    g.translate(Math.round(Math.sin((SHAKE_TIME - d.shake) * 70) * 2 * k), 0);
    drawGameTree(g, px, py, tx, ty);
    g.restore();
    return;
  }

  drawGameTree(g, px, py, tx, ty);
}

function drawTreeChips(g) {
  for (const c of treeChips) {
    g.fillStyle = c.c;
    g.fillRect(Math.round(c.x - cam.x), Math.round(c.y - cam.y), 2, 2);
  }
}

export function treeDamageOf(i) {
  return treeDamage.get(i) || null;
}

Object.assign(window, {
  chopTree,
  updateForest,
  drawTreeWithState,
  drawTreeChips,
  treeDamageOf,
  treeDamage
});
export { chopTree, updateForest, drawTreeWithState, drawTreeChips, treeDamage };
