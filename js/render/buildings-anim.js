/* js/render/buildings-anim.js — 用 anim 图鉴的 72×64 建筑美术绘制游戏建筑。
 * 1 格小建筑沿用原尺寸居中绘制；第 38 轮起，温室 / 牛棚等按建筑占地
 * (w×h 格) 等比缩放并铺满占地矩形，底边对齐占地下沿。
 */

'use strict';

import {
  BUILDING_MAP, BUILDING_W, BUILDING_H, BUILDING_BASE,
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

/** 以占地矩形左上角 (x,y) 为锚点绘制（屏幕坐标）。bw/bh 为占地格数，默认 1×1。
 *  1×1 保持原来的尺寸（72px 宽、底边对齐地块底部）；多格建筑等比缩放到整块占地。 */
function drawAnimStructure(g, type, x, y, bw, bh) {
  const def = animBuildingOf(type);
  if (!def) return false;

  const W = Math.max(1, bw | 0 || 1);
  const H = Math.max(1, bh | 0 || 1);
  let scale = SCALE, tx, ty;
  if (W === 1 && H === 1) {
    const w = BUILDING_W * SCALE;
    scale = SCALE;
    tx = Math.round(x + TILE / 2 - w / 2);
    ty = Math.round(y + TILE - BUILDING_BASE * SCALE);
  } else {
    scale = Math.min((W * TILE) / BUILDING_W, (H * TILE) / BUILDING_H);
    const w = BUILDING_W * scale, h = BUILDING_H * scale;
    tx = Math.round(x + (W * TILE - w) / 2);
    ty = Math.round(y + H * TILE - h);
  }

  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(tx, ty);
  g.scale(scale, scale);
  drawAnimBuilding(g, def, typeof animTime !== 'undefined' ? animTime * 0.4 : 0.25);
  g.restore();
  return true;
}

Object.assign(window, { hasAnimBuilding, drawAnimStructure, drawAnimStructureIcon, animBuildingOf });
export { hasAnimBuilding, drawAnimStructure, drawAnimStructureIcon, animBuildingOf };
