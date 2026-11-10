/* js/ui/item-icons.js — 背包 / 快捷栏 / 箱子统一使用 anim 像素物品图标。
 * 作物、种子、鱼、矿物、工匠品、料理、畜产、材料、工具分别走对应图鉴的绘制函数；
 * 没有像素图标的物品仍回退到 emoji。
 */

'use strict';

import { CROP_MAP as CROP_DEF_MAP, drawProduceIcon, drawSeedPacket } from '../anim/crop-items.js';
import { FISH_MAP, drawFishIcon, FISH_W, FISH_H } from '../anim/fish.js';
import { MINERAL_MAP, drawMineral } from '../anim/minerals.js';
import { ARTISAN_MAP, drawArtisan } from '../anim/artisan.js';
import { DISH_MAP, drawDish } from '../anim/dishes.js';
import { PROD_MAP, drawProductIcon } from '../anim/products.js';
import { RES_MAP, drawResourceIcon } from '../anim/resources.js';

const TOOL_ALIAS = {
  hoe: 'hoe', can: 'watering_can', axe: 'axe',
  pick: 'pickaxe', sickle: 'scythe', rod: 'fishing_rod'
};

const cache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

function baseIdOf(id) {
  return id.slice(-3) === '_hq' ? id.slice(0, -3) : id;
}

function drawStar(g, x, y) {
  g.fillStyle = '#ffd76a';
  g.fillRect(x + 1, y, 1, 5);
  g.fillRect(x, y + 1, 3, 3);
  g.fillStyle = '#fff6c0';
  g.fillRect(x + 1, y + 2, 1, 1);
}

/** 32×32 源图标；没有对应美术时返回 null。 */
function buildIcon(id) {
  const d = typeof itemDef === 'function' ? itemDef(id) : null;
  if (!d) return null;

  const hq = id.slice(-3) === '_hq';
  const base = baseIdOf(id);
  const bd = hq && typeof itemDef === 'function' ? (itemDef(base) || d) : d;
  const { canvas, ctx: g } = makeCanvas(32, 32);
  let drew = false;

  if (d.kind === 'seed') {
    const crop = CROP_DEF_MAP[d.crop];
    if (crop) { drawSeedPacket(g, crop, 0.25); drew = true; }
  } else if (d.kind === 'crop') {
    const crop = CROP_DEF_MAP[bd.crop || d.crop];
    if (crop) { drawProduceIcon(g, crop, 0.25); drew = true; }
  } else if (d.kind === 'fish') {
    const key = base.indexOf('fish_') === 0 ? base.slice(5) : base;
    const f = FISH_MAP[key];
    if (f) {
      const tmp = makeCanvas(FISH_W, FISH_H);
      drawFishIcon(tmp.ctx, f, 0.25);
      g.drawImage(tmp.canvas, 4, 0, 32, 32, 0, 0, 32, 32);
      drew = true;
    }
  } else if (d.kind === 'mineral') {
    const m = MINERAL_MAP[base];
    if (m) { drawMineral(g, m, 0.25); drew = true; }
  } else if (d.kind === 'food') {
    if (DISH_MAP[base]) { drawDish(g, DISH_MAP[base], 0.25); drew = true; }
    else if (ARTISAN_MAP[base]) { drawArtisan(g, ARTISAN_MAP[base], 0.25); drew = true; }
  } else if (d.kind === 'animal') {
    if (PROD_MAP[base]) { drawProductIcon(g, PROD_MAP[base], 0.25); drew = true; }
  } else if (d.kind === 'material' || d.kind === 'gather') {
    if (RES_MAP[base]) { drawResourceIcon(g, RES_MAP[base], 0.25); drew = true; }
  } else if (d.kind === 'tool') {
    const key = TOOL_ALIAS[base];
    if (key && RES_MAP[key]) { drawResourceIcon(g, RES_MAP[key], 0.25); drew = true; }
  }

  if (!drew) return null;
  if (hq) drawStar(g, 24, 4);
  return canvas;
}

function itemIconCanvas(id) {
  if (cache.has(id)) return cache.get(id);
  let c = null;
  try { c = buildIcon(id); } catch (e) { c = null; }
  cache.set(id, c);
  return c;
}

/** 往 DOM 图标容器里放像素图标；没有则返回 false。 */
function paintItemIcon(el, id, size = 32) {
  if (!el) return false;
  const src = itemIconCanvas(id);
  if (!src) return false;
  el.textContent = '';
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 32;
  cv.style.width = size + 'px';
  cv.style.height = size + 'px';
  cv.style.imageRendering = 'pixelated';
  cv.style.display = 'block';
  cv.getContext('2d').drawImage(src, 0, 0);
  el.appendChild(cv);
  return true;
}

/** 画到游戏 HUD / 商店 canvas 上；返回是否绘制成功。 */
function drawItemIconTo(g, id, x, y, size = 32) {
  const src = itemIconCanvas(id);
  if (!src) return false;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, Math.round(x), Math.round(y), size, size);
  return true;
}

Object.assign(window, { itemIconCanvas, paintItemIcon, drawItemIconTo });
export { itemIconCanvas, paintItemIcon, drawItemIconTo };
