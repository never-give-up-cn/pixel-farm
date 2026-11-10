/* js/systems/trees.js — 把 anim 层的 10 种野生树 + 8 种果树接进游戏地图。
 *
 *   - 每棵 T.TREE 按坐标哈希决定树种（同一张地图始终一致）；
 *   - 野生树用当前季节绘制，橡树 / 枫树冬季落叶；
 *   - 果树在对应季节结果，按 E 采集，隔 3 天再结果；
 *   - 树苗 / 生长阶段目前只用于图鉴，地图上的树按成熟期绘制。
 */

'use strict';

import {
  TREE_MAP, WILD_TREES, FRUIT_TREES, TREE_W, TREE_BASE,
  drawTree as drawAnimTree
} from '../anim/trees.js';

const FRUIT_READY_DAYS = 3;
const FRUIT_RATE = 5;          /* 约 5% 的树是果树 */

/* 原始表里没有 type 字段，这里补上，避免每帧重复拷贝 */
const WILD_DEFS = WILD_TREES.map(t => ({ ...t, type: 'wild' }));
const FRUIT_DEFS = FRUIT_TREES.map(t => ({ ...t, type: 'fruit' }));

/* index -> 下次可采果实的日期 */
const fruitReadyDay = new Map();

function hashAt(tx, ty) {
  const seed = (CONFIG.SEED | 0);
  let h = (Math.imul(tx, 374761393) + Math.imul(ty, 668265263) + seed) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** 坐标 → 树种（野生或果树）。 */
function treeTypeAt(tx, ty) {
  const h = hashAt(tx, ty);
  if (h % 100 < FRUIT_RATE) return FRUIT_DEFS[(h >>> 7) % FRUIT_DEFS.length];
  return WILD_DEFS[(h >>> 3) % WILD_DEFS.length];
}

function isFruitTree(tx, ty) {
  return treeTypeAt(tx, ty).type === 'fruit';
}

/** 果实是否成熟：季节匹配 + 已过再结果日期。 */
function fruitReady(tx, ty, day) {
  const t = treeTypeAt(tx, ty);
  if (t.type !== 'fruit') return false;
  if (typeof seasonName === 'function' && seasonName() !== t.fruitSeason) return false;
  const i = ty * MAP_W + tx;
  return (day === undefined ? clock.day : day) >= (fruitReadyDay.get(i) || 0);
}

/** 画一棵地图上的树（由 forest / entities 调用）。 */
function drawGameTree(g, px, py, tx, ty) {
  const base = treeTypeAt(tx, ty);
  const ready = base.type === 'fruit' && fruitReady(tx, ty);
  /* 采过的果树：保留树冠，只去掉果实 */
  const def = (base.type === 'fruit' && !ready) ? { ...base, fruitSeason: null } : base;
  const h = hashAt(tx, ty);
  const phase = (typeof animTime !== 'undefined' ? animTime * 0.35 : 0) + (h % 97) * 0.013;

  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(Math.round(px + TILE / 2 - TREE_W / 2), Math.round(py + TILE - 4 - TREE_BASE));
  drawAnimTree(g, def, 4, typeof seasonName === 'function' ? seasonName() : '春', phase);
  g.restore();
}

/** 脚边最近的、有成熟果实的果树（2 格内）。 */
function fruitTreeNear() {
  if (typeof player === 'undefined') return null;
  const ptx = Math.floor(player.x / TILE);
  const pty = Math.floor(player.y / TILE);
  let best = null;
  let bd = Infinity;
  for (let ty = pty - 2; ty <= pty + 2; ty++) {
    for (let tx = ptx - 2; tx <= ptx + 2; tx++) {
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      if (map[ty * MAP_W + tx] !== T.TREE) continue;
      if (!fruitReady(tx, ty)) continue;
      const d = Math.hypot(tx - ptx, ty - pty);
      if (d < bd) { bd = d; best = { tx, ty }; }
    }
  }
  return best;
}

/** 采集果实：进背包并重置再结果日期。 */
function harvestFruit(tx, ty) {
  const t = treeTypeAt(tx, ty);
  const id = t.id;
  if (typeof canFit === 'function' && !canFit(id, 1)) {
    if (typeof toast === 'function') toast('背包满了，装不下' + (itemDef(id) ? itemDef(id).name : '果实'));
    return false;
  }
  if (typeof addItem === 'function') addItem(id, 1);
  if (typeof questEmit === 'function') questEmit('crop', { id, n: 1 });
  if (typeof spawnTileFx === 'function') spawnTileFx('harvest', tx, ty, t.fruit);
  fruitReadyDay.set(ty * MAP_W + tx, clock.day + FRUIT_READY_DAYS);
  if (typeof toast === 'function') {
    toast('摘下 ' + (itemDef(id) ? itemDef(id).name : t.name) + ' ×1（' + FRUIT_READY_DAYS + ' 天后再结果）');
  }
  if (typeof playSfx === 'function') playSfx(1046, 'triangle', 0.12, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

/** 砍倒后清掉果树状态。 */
function forgetTree(tx, ty) {
  fruitReadyDay.delete(ty * MAP_W + tx);
}

Object.assign(window, {
  treeTypeAt,
  isFruitTree,
  fruitReady,
  fruitTreeNear,
  harvestFruit,
  drawGameTree,
  forgetTree
});
export {
  treeTypeAt, isFruitTree, fruitReady,
  fruitTreeNear, harvestFruit, drawGameTree, forgetTree
};
