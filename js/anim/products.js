/* 星露谷动物产品图鉴：蛋、奶、羊毛、松露、蜂蜜、鱼籽等 23 种。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const PROD_W = 32;
export const PROD_H = 32;

export const PROD_CATS = [
  { id: 'all', name: '全部' },
  { id: 'egg', name: '蛋' },
  { id: 'milk', name: '奶' },
  { id: 'other', name: '其他' }
];

const C = {
  white:  ['#f0f0e8', '#b0b0a8', '#ffffff'],
  cream:  ['#f0e0b0', '#c0a870', '#fff8d0'],
  brown:  ['#b07a4a', '#6a4a2a', '#e0b080'],
  tan:    ['#d8b070', '#9a7030', '#f0d8a0'],
  blue:   ['#8ac0d8', '#4a8090', '#d0f0ff'],
  green:  ['#8ac05a', '#5a8a2a', '#c0f080'],
  gold:   ['#e0c060', '#a08020', '#fff0a0'],
  purple: ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  dark:   ['#3a3a4a', '#1a1a2a', '#8a8aa0'],
  orange: ['#e08a3a', '#a05a1a', '#f0c080'],
  red:    ['#d04a3a', '#8a2a1a', '#f08a70'],
  pink:   ['#e08ab0', '#a04a70', '#ffc0d8'],
  teal:   ['#4ac0b0', '#2a8070', '#a0f0e0'],
  honey:  ['#e0a030', '#a06010', '#f0d070'],
  black:  ['#2a2a32', '#121218', '#5a5a68']
};

/* [id, 中文名, 英文名, 分类, 造型, 配色] */
const RAW = [
  ['egg','鸡蛋','Egg','egg','egg','white'],
  ['large_egg','大鸡蛋','Large Egg','egg','egg_large','white'],
  ['brown_egg','棕色鸡蛋','Brown Egg','egg','egg','brown'],
  ['large_brown_egg','大棕色鸡蛋','Large Brown Egg','egg','egg_large','brown'],
  ['duck_egg','鸭蛋','Duck Egg','egg','egg','blue'],
  ['large_duck_egg','大鸭蛋','Large Duck Egg','egg','egg_large','blue'],
  ['void_egg','虚空蛋','Void Egg','egg','void_egg','purple'],
  ['golden_egg','金蛋','Golden Egg','egg','golden_egg','gold'],
  ['ostrich_egg','鸵鸟蛋','Ostrich Egg','egg','ostrich','cream'],
  ['large_ostrich_egg','大鸵鸟蛋','Large Ostrich Egg','egg','ostrich_large','cream'],

  ['milk','牛奶','Milk','milk','milk','white'],
  ['large_milk','大牛奶','Large Milk','milk','milk_large','white'],
  ['goat_milk','羊奶','Goat Milk','milk','milk','cream'],
  ['large_goat_milk','大羊奶','Large Goat Milk','milk','milk_large','cream'],

  ['wool','羊毛','Wool','other','wool','white'],
  ['rabbit_foot','兔子的脚',"Rabbit's Foot",'other','foot','brown'],
  ['duck_feather','鸭毛','Duck Feather','other','feather','teal'],
  ['truffle','松露','Truffle','other','truffle','brown'],
  ['honey','蜂蜜','Honey','other','honey','honey'],
  ['roe','鱼籽','Roe','other','roe','orange'],
  ['caviar','鱼子酱','Caviar','other','caviar','black'],
  ['aged_roe','陈年鱼籽','Aged Roe','other','aged_roe','dark'],
  ['squid_ink','鱿鱼墨汁','Squid Ink','other','ink','black'],
  ['golden_cracker','金动物饼干','Golden Animal Cracker','other','cracker','gold']
];

function pal(key) {
  const c = C[key] || C.white;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const PRODUCTS = RAW.map(([id, name, en, cat, style, p]) => ({
  id, name, en, cat, style, ...pal(p)
}));
export const PROD_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

export function prodCatName(cat) {
  const c = PROD_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------------- 蛋 ---------------- */

function drawEgg(g, it, large, gold, voidEgg) {
  const rx = large ? 9 : 7;
  const ry = large ? 11 : 9;
  const cy = large ? 17 : 18;
  ellipse(g, 16, cy, rx, ry, it.c2);
  ellipse(g, 15, cy - 1, rx - 1, ry - 1, it.c1);
  R(g, 12, cy - 6, 4, 3, it.c3);
  R(g, 11, cy - 3, 2, 3, it.c3);
  if (gold) {
    R(g, 14, cy + 5, 4, 2, it.c2);
    R(g, 15, cy + 4, 2, 1, '#ffffff');
    R(g, 21, cy - 4, 2, 2, it.c3);
  }
  if (voidEgg) {
    R(g, 13, cy - 2, 2, 2, '#e0d0ff');
    R(g, 18, cy + 2, 2, 2, '#e0d0ff');
    R(g, 16, cy - 7, 2, 2, '#ffffff');
  }
  if (large) {
    R(g, 24, cy + 2, 2, 2, it.c3);
    R(g, 8, cy + 4, 2, 2, it.c2);
  }
}

function drawOstrich(g, it, large) {
  const rx = large ? 10 : 9;
  const ry = large ? 12 : 11;
  const cy = large ? 16 : 17;
  ellipse(g, 16, cy, rx, ry, it.c2);
  ellipse(g, 15, cy - 1, rx - 1, ry - 1, it.c1);
  for (let i = 0; i < 9; i++) {
    const x = 8 + (i * 7) % 18, y = cy - 8 + (i * 5) % 16;
    R(g, x, y, 2, 2, i % 2 ? it.c2 : it.c3);
  }
  R(g, 12, cy - 7, 3, 2, it.c3);
}

/* ---------------- 奶 ---------------- */

function drawMilk(g, it, large, goat) {
  const w = large ? 14 : 12;
  const h = large ? 20 : 17;
  const x = 16 - w / 2;
  const y = 28 - h;
  R(g, x + 2, y - 4, w - 4, 5, it.c2);
  R(g, x + 3, y - 3, w - 6, 3, it.c3);
  R(g, x, y, w, h, it.c2);
  R(g, x + 1, y + 1, w - 2, h - 2, it.c1);
  R(g, x + 2, y + 1, 2, h - 3, it.c3);
  R(g, x + w - 4, y + 5, 2, 5, it.c2);
  R(g, x + 2, y + h - 5, w - 4, 3, it.c2);
  R(g, x + 3, y + h - 4, w - 6, 1, it.c3);
  if (goat) {
    R(g, x + 2, y + 2, 2, 2, it.c1);
    R(g, x + 2, y + 6, 2, 2, it.c1);
  } else {
    R(g, x + 4, y + 3, 3, 1, it.c3);
  }
}

/* ---------------- 其他 ---------------- */

function drawOther(g, it) {
  if (it.style === 'wool') {
    for (let i = 0; i < 8; i++) {
      ellipse(g, 9 + (i * 5) % 16, 13 + (i * 7) % 10, 5, 4, i % 2 ? it.c1 : it.c2);
    }
    ellipse(g, 16, 19, 9, 6, it.c2);
    ellipse(g, 16, 18, 8, 5, it.c1);
    R(g, 11, 15, 3, 2, it.c3);
    R(g, 20, 21, 3, 2, it.c2);
    return;
  }
  if (it.style === 'foot') {
    ellipse(g, 16, 20, 7, 9, it.c2);
    ellipse(g, 16, 19, 6, 8, it.c1);
    ellipse(g, 13, 11, 3, 3, it.c2);
    ellipse(g, 19, 11, 3, 3, it.c2);
    R(g, 14, 22, 2, 3, it.c2);
    R(g, 17, 22, 2, 3, it.c2);
    R(g, 16, 15, 2, 4, it.c3);
    return;
  }
  if (it.style === 'feather') {
    line(g, 10, 26, 24, 7, it.c2, 1);
    for (let i = 0; i < 8; i++) {
      line(g, 12 + i * 2, 24 - i * 2, 8 + i * 2, 20 - i * 2, it.c1, 1);
      line(g, 12 + i * 2, 24 - i * 2, 18 + i * 2, 20 - i * 2, it.c1, 1);
    }
    R(g, 23, 5, 2, 3, it.c3);
    R(g, 9, 25, 3, 3, it.c2);
    return;
  }
  if (it.style === 'truffle') {
    ellipse(g, 16, 19, 9, 7, it.c2);
    ellipse(g, 15, 18, 7, 5, it.c1);
    R(g, 11, 15, 3, 3, it.c2);
    R(g, 20, 20, 3, 2, it.c2);
    R(g, 13, 18, 2, 2, it.c3);
    R(g, 18, 16, 2, 2, it.c3);
    return;
  }
  if (it.style === 'honey') {
    R(g, 9, 13, 14, 14, it.c2);
    R(g, 10, 14, 12, 12, it.c1);
    R(g, 10, 14, 3, 12, it.c3);
    R(g, 8, 10, 16, 4, it.c2);
    R(g, 9, 11, 14, 2, it.c3);
    for (let i = 0; i < 6; i++) {
      R(g, 12 + (i % 3) * 4, 17 + Math.floor(i / 3) * 4, 3, 3, it.c3);
    }
    R(g, 11, 27, 10, 2, it.c2);
    return;
  }
  if (it.style === 'roe' || it.style === 'caviar' || it.style === 'aged_roe') {
    const dark = it.style !== 'roe';
    R(g, 9, 11, 14, 17, it.c2);
    R(g, 10, 12, 12, 15, it.c1);
    R(g, 10, 12, 3, 15, it.c3);
    for (let i = 0; i < 9; i++) {
      R(g, 12 + (i % 3) * 3, 15 + Math.floor(i / 3) * 3, 2, 2, dark ? '#2a2a32' : it.c3);
    }
    R(g, 8, 8, 16, 4, it.c2);
    R(g, 9, 9, 14, 2, it.c3);
    R(g, 11, 28, 10, 2, it.c2);
    return;
  }
  if (it.style === 'ink') {
    R(g, 11, 10, 10, 18, it.c2);
    R(g, 12, 11, 8, 16, it.c1);
    R(g, 12, 11, 2, 16, '#5a5a68');
    R(g, 13, 7, 6, 4, it.c2);
    R(g, 14, 5, 4, 3, it.c2);
    R(g, 15, 4, 2, 2, it.c1);
    R(g, 10, 8, 12, 3, it.c3);
    R(g, 13, 28, 6, 2, it.c2);
    return;
  }
  if (it.style === 'cracker') {
    ellipse(g, 16, 17, 11, 8, it.c2);
    ellipse(g, 16, 16, 10, 7, it.c1);
    for (let i = 0; i < 8; i++) R(g, 8 + (i * 3) % 16, 12 + (i * 5) % 12, 2, 2, it.c3);
    R(g, 14, 14, 2, 6, '#ffffff');
    R(g, 12, 16, 6, 2, '#ffffff');
    return;
  }
}

export function drawProductIcon(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? PROD_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (it.style === 'egg') drawEgg(g, it, false, false, false);
  else if (it.style === 'egg_large') drawEgg(g, it, true, false, false);
  else if (it.style === 'void_egg') drawEgg(g, it, true, false, true);
  else if (it.style === 'golden_egg') drawEgg(g, it, true, true, false);
  else if (it.style === 'ostrich') drawOstrich(g, it, false);
  else if (it.style === 'ostrich_large') drawOstrich(g, it, true);
  else if (it.style === 'milk') drawMilk(g, it, false, it.id.includes('goat'));
  else if (it.style === 'milk_large') drawMilk(g, it, true, it.id.includes('goat'));
  else drawOther(g, it);

  const hh = hashOf(it.id);
  R(g, 4 + hh % 24, 4 + Math.floor(hh / 24) % 24, 1, 1, it.c3);
  g.restore();
}
