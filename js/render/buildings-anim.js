/* js/render/buildings-anim.js — 用 anim 图鉴的 72×64 建筑美术绘制游戏建筑。
 * 游戏里每座建筑仍只占 1 格；建筑本体在 72×64 格内居中，按原尺寸绘制，
 * 底边对齐地块底部，和原来的 32×30 鸡舍 / 牛棚大小接近。
 */

'use strict';

import {
  BUILDING_MAP, BUILDING_W, BUILDING_BASE,
  drawBuilding as drawAnimBuilding
} from '../anim/buildings.js';

/* 游戏 type → anim 建筑 id（同名直接对应） */
const TYPE_ALIAS = {
  house: 'farmhouse',
  community_center: 'junimo_hut'
};

const SCALE = 1;

function animBuildingOf(type) {
  return BUILDING_MAP[TYPE_ALIAS[type] || type] || null;
}

/* 建造面板 / 配方列表用的小图标：把 72×64 美术裁中间一块缩到 14×14 */
const iconCache = new Map();

function animBuildingIcon(def) {
  let c = iconCache.get(def.id);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = BUILDING_W;
  c.height = 64;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  drawAnimBuilding(g, def, 0.25);
  iconCache.set(def.id, c);
  return c;
}

function drawAnimStructureIcon(g, type, x, y, size = 14) {
  const def = animBuildingOf(type);
  if (!def) return false;
  const src = animBuildingIcon(def);
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 16, 8, 40, 40, x, y, size, size);
  return true;
}

/** 返回 true 表示这个 type 有 anim 美术。 */
function hasAnimBuilding(type) {
  return !!animBuildingOf(type);
}

/** 以地块底边中点为锚点绘制。x/y 是屏幕坐标。 */
function drawAnimStructure(g, type, x, y) {
  const def = animBuildingOf(type);
  if (!def) return false;

  const w = BUILDING_W * SCALE;
  const base = BUILDING_BASE * SCALE;
  const tx = Math.round(x + TILE / 2 - w / 2);
  const ty = Math.round(y + TILE - base);

  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(tx, ty);
  g.scale(SCALE, SCALE);
  drawAnimBuilding(g, def, typeof animTime !== 'undefined' ? animTime * 0.4 : 0.25);
  g.restore();
  return true;
}

Object.assign(window, { hasAnimBuilding, drawAnimStructure, drawAnimStructureIcon, animBuildingOf });
export { hasAnimBuilding, drawAnimStructure, drawAnimStructureIcon, animBuildingOf };
