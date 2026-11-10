/* 星露谷种子与农产品：50 种作物的种子包 + 收获物图标。
 * 直接复用 sdv-crops.js 的 CROPS 与 produce 造型数据。 */

import { CROPS } from './sdv-crops.js';
import { R, line, ellipse, TAU } from './pixel.js';

export const ITEM_W = 32;
export const ITEM_H = 32;

export const ITEM_CATS = [
  { id: 'all', name: '全部' },
  { id: 'seed', name: '种子' },
  { id: 'produce', name: '农产品' }
];

export const CROP_ITEMS = CROPS.flatMap(c => [
  {
    id: `seed_${c.id}`, crop: c.id, group: 'seed',
    name: `${c.name}种子`, en: `${c.en} Seeds`, cropName: c.name,
    season: c.season, days: c.days, regrow: c.regrow
  },
  {
    id: `produce_${c.id}`, crop: c.id, group: 'produce',
    name: c.name, en: c.en, cropName: c.name,
    season: c.season, days: c.days, regrow: c.regrow
  }
]);
export const CROP_ITEM_MAP = Object.fromEntries(CROP_ITEMS.map(i => [i.id, i]));
export const CROP_MAP = Object.fromEntries(CROPS.map(c => [c.id, c]));
export { CROPS };

export function itemCatName(cat) {
  const x = ITEM_CATS.find(v => v.id === cat);
  return x ? x.name : cat;
}

export function seasonName(s) {
  if (!s) return '';
  return s.replace('春', '春 ').replace('夏', '夏 ').replace('秋', '秋 ').replace('冬', '冬 ').trim();
}

/* ---------------- 农产品 ---------------- */

function leaves(g, c, x, y) {
  R(g, x, y, 2, 6, c.leafDark || '#3a6a2a');
  ellipse(g, x - 4, y - 2, 5, 3, c.leaf || '#5aa04a');
  ellipse(g, x + 4, y - 3, 5, 3, c.leaf || '#5aa04a');
}

export function drawProduceIcon(g, crop, phase = 0.25) {
  const c = typeof crop === 'string' ? CROP_MAP[crop] : crop;
  if (!c) return;
  const p = c.produce;
  const x = 16, y = 19;
  const s = p.size || 3;
  const c1 = p.c1, c2 = p.c2;
  const shape = p.shape;

  if (shape === 'flower' || shape === 'bloom' || shape === 'tulip') {
    line(g, x, 28, x, 16, c.leafDark || '#3a6a2a', 2);
    ellipse(g, x - 5, 25, 4, 2, c.leaf || '#5aa04a');
    if (shape === 'tulip') {
      ellipse(g, x, 12, 4, 6, c1);
      ellipse(g, x, 11, 3, 5, c2);
      R(g, x - 4, 8, 3, 3, c1);
      R(g, x + 2, 8, 3, 3, c1);
    } else {
      for (let i = 0; i < (p.petals || 5); i++) {
        const a = i / (p.petals || 5) * TAU - Math.PI / 2;
        ellipse(g, x + Math.cos(a) * 5, 12 + Math.sin(a) * 5, 3, 3, i % 2 ? c1 : c2);
      }
      ellipse(g, x, 12, 2, 2, '#f0e060');
    }
    return;
  }
  if (shape === 'long' || shape === 'cone') {
    ellipse(g, x, y, s + 2, s + 5, c2);
    ellipse(g, x, y - 1, s + 1, s + 4, c1);
    R(g, x - 1, y - s - 3, 2, 4, c.leafDark || '#3a6a2a');
    ellipse(g, x - 4, y - s - 2, 4, 2, c.leaf || '#5aa04a');
    ellipse(g, x + 4, y - s - 3, 4, 2, c.leaf || '#5aa04a');
    return;
  }
  if (shape === 'pod') {
    for (let i = 0; i < 5; i++) ellipse(g, x - 8 + i * 4, y, 3, 5, i % 2 ? c1 : c2);
    line(g, x - 10, y - 3, x + 9, y - 3, c.leafDark || '#3a6a2a', 1);
    return;
  }
  if (shape === 'cob') {
    ellipse(g, x, y, s + 1, s + 4, c2);
    for (let i = 0; i < 5; i++) R(g, x - s + 1 + (i % 2) * 2, y - s + i * 2, 2, 3, c1);
    R(g, x - s - 2, y - s - 2, 4, 9, c.leaf || '#5aa04a');
    R(g, x + s - 1, y - s - 1, 4, 8, c.leafDark || '#3a6a2a');
    return;
  }
  if (shape === 'grain' || shape === 'stalk' || shape === 'grass' || shape === 'plume') {
    line(g, x, 28, x, 8, c.leafDark || '#3a6a2a', 2);
    if (shape === 'plume') {
      ellipse(g, x, 9, 4, 7, c1);
      ellipse(g, x, 8, 2, 5, c2);
    } else {
      for (let i = 0; i < 6; i++) {
        R(g, x - 4, 9 + i * 3, 3, 2, c1);
        R(g, x + 1, 10 + i * 3, 3, 2, c2);
      }
    }
    return;
  }
  if (shape === 'frilly') {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      ellipse(g, x + Math.cos(a) * 6, y + Math.sin(a) * 5, 4, 4, i % 2 ? c1 : c2);
    }
    ellipse(g, x, y, 4, 4, c2);
    R(g, x - 1, y - 1, 3, 3, c1);
    return;
  }
  if (shape === 'cap') {
    ellipse(g, x, y - 2, s + 4, s + 2, c2);
    ellipse(g, x, y - 3, s + 3, s + 1, c1);
    R(g, x - 7, y - 2, 2, 2, '#fff0e0');
    R(g, x + 3, y - 5, 2, 2, '#fff0e0');
    R(g, x - 2, y + 2, 4, 6, '#f0e8d0');
    return;
  }
  if (shape === 'cluster') {
    for (let i = 0; i < 7; i++) ellipse(g, x - 5 + (i % 3) * 5, y - 4 + Math.floor(i / 3) * 5, 3, 3, i % 2 ? c1 : c2);
    line(g, x, y - 9, x, 7, c.leafDark || '#3a6a2a', 1);
    return;
  }
  if (shape === 'berry') {
    for (let i = 0; i < 4; i++) ellipse(g, x - 4 + (i % 2) * 7, y - 3 + Math.floor(i / 2) * 6, 4, 4, i % 2 ? c1 : c2);
    R(g, x - 1, y - 8, 2, 3, c.leafDark || '#3a6a2a');
    return;
  }
  if (shape === 'pine') {
    ellipse(g, x, y, s + 3, s + 4, c2);
    ellipse(g, x, y - 2, s + 2, s + 3, c1);
    for (let i = 0; i < 5; i++) line(g, x - 7 + i * 3, 9, x - 4 + i * 3, 5, c.leaf, 1);
    R(g, x - 1, 4, 3, 5, c.leafDark || '#3a6a2a');
    return;
  }
  if (shape === 'star') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i / 5 * TAU;
      line(g, x, y, x + Math.cos(a) * 9, y + Math.sin(a) * 9, c1, 3);
    }
    ellipse(g, x, y, 5, 5, c2);
    R(g, x - 1, y - 1, 3, 3, c1);
    return;
  }
  if (shape === 'gem') {
    for (let i = 0; i < 5; i++) R(g, x - 7 + i, y - 8 + i, 15 - i * 2, 1, i < 2 ? c2 : c1);
    for (let i = 0; i < 5; i++) R(g, x - 6 + i, y + 4 - i, 13 - i * 2, 1, c1);
    R(g, x - 1, y - 4, 3, 5, c2);
    return;
  }
  if (shape === 'cactus') {
    ellipse(g, x, y, s + 3, s + 5, c2);
    ellipse(g, x, y - 1, s + 2, s + 4, c1);
    R(g, x - 1, y - s - 5, 2, 5, c.leafDark || '#3a6a2a');
    R(g, x - 3, y - 1, 1, 1, '#fff0c0');
    R(g, x + 3, y + 2, 1, 1, '#fff0c0');
    return;
  }
  /* 圆形 / 块状 / 南瓜 / 瓜类 / 鳞茎 / 头状 / 块茎 */
  const rx = s + 4 + (shape === 'melon' || shape === 'pumpkin' || shape === 'squash' ? 2 : 0);
  const ry = s + 3 + (shape === 'pumpkin' ? 1 : 0);
  ellipse(g, x, y, rx, ry, c2);
  ellipse(g, x, y - 1, rx - 1, ry - 1, c1);
  if (shape === 'pumpkin' || shape === 'squash') {
    for (let i = -1; i <= 1; i++) R(g, x + i * 5, y - ry + 2, 1, ry * 2 - 4, c2);
    R(g, x - 1, y - ry - 2, 2, 4, c.leafDark || '#3a6a2a');
  } else if (shape === 'melon') {
    for (let i = -1; i <= 1; i++) line(g, x - rx + 2, y + i * 3, x + rx - 2, y + i * 3, c2, 1);
  } else if (shape === 'bulb') {
    R(g, x - 2, y - ry - 3, 4, 4, c.leafDark || '#3a6a2a');
    R(g, x - 1, y - 1, 2, 3, c2);
  } else if (shape === 'head') {
    for (let i = 0; i < 5; i++) ellipse(g, x - 5 + (i % 3) * 5, y - 3 + Math.floor(i / 3) * 4, 4, 3, c2);
    ellipse(g, x, y - 2, 5, 4, p.c3 || '#fff6e0');
  } else if (shape === 'bumpy') {
    for (let i = 0; i < 6; i++) R(g, x - 5 + (i * 3) % 11, y - 4 + (i * 2) % 8, 2, 2, c2);
  } else if (shape === 'tuber') {
    R(g, x - 2, y - ry - 3, 4, 3, c.leafDark || '#3a6a2a');
    R(g, x - 1, y - 1, 1, 1, c2);
  }
  leaves(g, c, x - rx - 2, y - ry);
}

/* ---------------- 种子包 ---------------- */

export function drawSeedPacket(g, crop, phase = 0.25) {
  const c = typeof crop === 'string' ? CROP_MAP[crop] : crop;
  if (!c) return;
  const p = c.produce;
  const c1 = p.c1, c2 = p.c2;

  R(g, 5, 3, 22, 27, '#8a7a5a');
  R(g, 6, 4, 20, 25, '#e8d8b0');
  R(g, 6, 4, 20, 7, c2);
  R(g, 7, 5, 18, 5, c1);
  R(g, 8, 10, 16, 2, '#f8f0d8');

  /* 小种子图案 */
  ellipse(g, 16, 18, 6, 6, c2);
  ellipse(g, 16, 17, 5, 5, c1);
  R(g, 13, 15, 2, 2, '#fff8e0');
  R(g, 18, 19, 2, 2, '#fff8e0');
  R(g, 10, 25, 12, 2, '#b8a078');
  R(g, 10, 28, 8, 1, '#b8a078');

  /* 不同种子包加一点纹样 */
  let h = 0;
  for (let i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) | 0;
  const hh = Math.abs(h) % 4;
  for (let i = 0; i < hh + 1; i++) R(g, 8 + i * 4, 23, 2, 2, c2);
  const accents = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0'];
  R(g, 8 + Math.abs(h) % 12, 24 + (Math.floor(Math.abs(h) / 12) % 2), 2, 1, accents[Math.abs(h) % accents.length]);
  R(g, 24, 4, 2, 25, '#c8b080');
}
