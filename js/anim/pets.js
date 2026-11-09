/* 星露谷宠物：5 种猫 + 5 种狗 + 2 种乌龟 + 马 + 铱星变体。
 * 40×32 精灵格，支持站立 / 走路与四方向。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const PET_W = 40;
export const PET_H = 32;

export const PET_CATS = [
  { id: 'all', name: '全部' },
  { id: 'cat', name: '猫' },
  { id: 'dog', name: '狗' },
  { id: 'turtle', name: '乌龟' },
  { id: 'horse', name: '马' }
];

const C = {
  orange:   ['#e08a3a', '#a05a1a', '#f0c080'],
  grey:     ['#9a9aa8', '#5a5a6a', '#d0d0e0'],
  cream:    ['#f0e0b0', '#c0a870', '#fff8d0'],
  white:    ['#f0f0e8', '#b0b0a8', '#ffffff'],
  black:    ['#3a3a44', '#1a1a22', '#7a7a88'],
  brown:    ['#b07a4a', '#6a4a2a', '#e0b080'],
  tan:      ['#d8b070', '#9a7030', '#f0d8a0'],
  light:    ['#e0c090', '#a08050', '#f8e8c0'],
  dark:     ['#6a4a2a', '#3a2414', '#a07040'],
  blackwhite:['#3a3a44', '#1a1a22', '#f0f0e8'],
  iridium:  ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  green:    ['#6ab04a', '#3a7a2a', '#b0e080'],
  shellgreen:['#4a8a3a', '#2a5a1a', '#a0d060'],
  shellpurple:['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  turtle2:  ['#d8c090', '#9a8050', '#f0e0b0']
};

/* [id, 中文名, 英文名, 类型, 造型, 配色] */
const RAW = [
  ['orange_tabby','橘色虎斑猫','Orange Tabby Cat','cat','tabby','orange'],
  ['grey_tabby','灰色虎斑猫','Grey Tabby Cat','cat','tabby','grey'],
  ['cream_cat','奶油猫','Cream Cat','cat','plain','cream'],
  ['white_cat','白猫','White Cat','cat','plain','white'],
  ['black_cat','黑猫','Black Cat','cat','plain','black'],
  ['iridium_cat','铱星猫','Iridium Cat','cat','iridium','iridium'],

  ['floppy_dog','垂耳狗','Floppy-Eared Dog','dog','floppy','brown'],
  ['pointy_dog','尖耳狗','Pointy-Eared Dog','dog','pointy','tan'],
  ['light_brown_dog','浅棕狗','Light Brown Dog','dog','pointy','light'],
  ['black_white_dog','黑白狗','Black and White Dog','dog','floppy','blackwhite'],
  ['dark_brown_dog','深棕狗','Dark Brown Dog','dog','pointy','dark'],
  ['iridium_dog','铱星狗','Iridium Dog','dog','iridium','iridium'],

  ['green_turtle','绿壳乌龟','Green Turtle','turtle','green','green'],
  ['purple_turtle','紫壳乌龟','Purple Turtle','turtle','purple','turtle2'],

  ['horse','马','Horse','horse','horse','brown']
];

function pal(key) {
  const c = C[key] || C.brown;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const PETS = RAW.map(([id, name, en, kind, style, p]) => ({
  id, name, en, kind, style, ...pal(p)
}));
export const PET_MAP = Object.fromEntries(PETS.map(p => [p.id, p]));

export function petKindName(kind) {
  const c = PET_CATS.find(x => x.id === kind);
  return c ? c.name : kind;
}

/* ---------------- 猫 / 狗 ---------------- */

function drawQuadruped(g, it, dir, phase, action, dog) {
  const side = dir === 1 || dir === 2;
  const back = dir === 3;
  const moving = action === 'walk';
  const s = Math.sin(phase * TAU);
  const step = moving ? Math.round(s * 2) : 0;
  const bob = moving ? Math.round(Math.abs(s) * 1) : (Math.sin(phase * TAU) > 0.7 ? -1 : 0);
  const bodyY = 21 + bob;
  const bodyRX = dog ? 9 : 8;
  const bodyRY = dog ? 5 : 5;

  ellipse(g, 20, bodyY, bodyRX, bodyRY, it.c2);
  ellipse(g, 20, bodyY - 1, bodyRX - 1, bodyRY, it.c1);
  if (it.kind === 'cat') {
    ellipse(g, 18, bodyY - 2, 3, 2, it.c3);
  } else {
    R(g, 13, bodyY - 2, 10, 2, it.c3);
  }

  if (it.style === 'tabby') {
    for (let i = 0; i < 3; i++) {
      R(g, 16 + i * 4, bodyY - 4, 2, 3, it.c2);
    }
    R(g, 14, bodyY - 3, 10, 1, it.c2);
  }
  if (it.style === 'iridium') {
    R(g, 15, bodyY - 5, 2, 2, '#ffffff');
    R(g, 22, bodyY - 3, 2, 2, '#e0d0ff');
  }

  /* 腿 */
  const lx = [14, 18, 23, 27];
  for (let i = 0; i < 4; i++) {
    const off = i < 2 ? step : -step;
    const h = dog ? 6 : 5;
    R(g, lx[i] + off, bodyY + 3, 2, h, it.c2);
    R(g, lx[i] + off, bodyY + 3 + h - 1, 3, 2, it.c2);
  }

  /* 头 */
  let hx = 20, hy = 14 + bob;
  if (side) { hx = 29; hy = 14 + bob; }
  if (back) { hx = 20; hy = 14 + bob; }
  R(g, hx - 2, hy + 3, 4, 3, it.c2);
  ellipse(g, hx, hy, dog ? 6 : 5, dog ? 5 : 5, it.c2);
  ellipse(g, hx, hy - 1, dog ? 5 : 4, dog ? 4 : 4, it.c1);

  /* 耳朵 */
  if (it.style === 'floppy' || it.kind === 'dog') {
    if (side) {
      R(g, hx - 5, hy - 5, 4, 5, it.c2);
      R(g, hx - 4, hy - 4, 2, 3, it.c1);
      if (it.style !== 'floppy') {
        R(g, hx + 2, hy - 6, 4, 3, it.c2);
        R(g, hx + 3, hy - 5, 2, 2, it.c1);
      }
    } else {
      R(g, hx - 6, hy - 5, 4, 5, it.c2);
      R(g, hx + 2, hy - 5, 4, 5, it.c2);
      R(g, hx - 5, hy - 4, 2, 3, it.c1);
      R(g, hx + 3, hy - 4, 2, 3, it.c1);
    }
  } else if (it.kind === 'cat') {
    if (side) {
      line(g, hx - 4, hy - 3, hx - 2, hy - 8, it.c1, 2);
      line(g, hx + 2, hy - 5, hx + 3, hy - 9, it.c1, 2);
    } else {
      line(g, hx - 4, hy - 3, hx - 2, hy - 9, it.c1, 2);
      line(g, hx + 2, hy - 3, hx + 4, hy - 9, it.c1, 2);
      R(g, hx - 3, hy - 6, 2, 2, it.c3);
      R(g, hx + 1, hy - 6, 2, 2, it.c3);
    }
  }

  if (!back) {
    const ex = side ? [hx + 2, hx + 4] : [hx - 2, hx + 2];
    R(g, ex[0], hy - 1, 1, 1, '#1a1a1a');
    R(g, ex[1], hy - 1, 1, 1, '#1a1a1a');
    if (dog) {
      R(g, side ? hx + 4 : hx - 1, hy + 2, 3, 2, it.c2);
      R(g, side ? hx + 5 : hx, hy + 2, 1, 1, '#1a1a1a');
      if (it.style === 'pointy' || it.style === 'iridium') R(g, hx + 4, hy + 4, 2, 2, '#e05a6a');
    } else {
      R(g, side ? hx + 3 : hx, hy + 2, 1, 1, '#d06a7a');
    }
  }

  /* 尾巴 */
  if (it.kind === 'cat') {
    const wag = Math.round(Math.sin(phase * TAU + 0.6) * 2);
    line(g, 11, bodyY - 1, 7 + wag, bodyY - 8, it.c2, 2);
    line(g, 7 + wag, bodyY - 8, 9 + wag, bodyY - 12, it.c1, 1);
    R(g, 8 + wag, bodyY - 13, 2, 2, it.c3);
  } else {
    const wag = Math.round(Math.sin(phase * TAU + 0.6) * 2);
    line(g, 11, bodyY - 1, 7, bodyY - 6 + wag, it.c2, 2);
    R(g, 6, bodyY - 8 + wag, 2, 2, it.c2);
  }
}

/* ---------------- 乌龟 ---------------- */

function drawTurtle(g, it, dir, phase) {
  const side = dir === 1 || dir === 2;
  const back = dir === 3;
  const s = Math.sin(phase * TAU);
  const bob = Math.round(s * 0.5);
  const shell = it.id === 'purple_turtle' ? C.shellpurple : C.shellgreen;
  const body = it.c1;

  ellipse(g, 20, 22 + bob, 10, 6, shell[1]);
  ellipse(g, 20, 21 + bob, 9, 5, shell[0]);
  ellipse(g, 20, 20 + bob, 7, 4, shell[2]);
  for (let i = 0; i < 5; i++) R(g, 13 + i * 3, 18 + bob + (i % 2), 2, 2, shell[1]);
  R(g, 8, 24 + bob, 4, 3, body);
  R(g, 12, 25 + bob, 3, 3, body);
  R(g, 25, 25 + bob, 3, 3, body);
  R(g, 29, 24 + bob, 4, 3, body);
  R(g, 17, 26 + bob, 6, 2, body);

  if (side) {
    R(g, 30, 18 + bob, 5, 5, body);
    ellipse(g, 33, 19 + bob, 3, 3, body);
    if (!back) R(g, 34, 18 + bob, 1, 1, '#1a1a1a');
    R(g, 35, 21 + bob, 2, 1, body);
  } else if (!back) {
    ellipse(g, 20, 12 + bob, 5, 4, body);
    R(g, 18, 11 + bob, 1, 1, '#1a1a1a');
    R(g, 21, 11 + bob, 1, 1, '#1a1a1a');
    R(g, 20, 13 + bob, 1, 1, it.c2);
  } else {
    ellipse(g, 20, 12 + bob, 4, 3, body);
  }
}

/* ---------------- 马 ---------------- */

function drawHorse(g, it, dir, phase, action) {
  const side = dir === 1 || dir === 2;
  const back = dir === 3;
  const moving = action === 'walk';
  const s = Math.sin(phase * TAU);
  const step = moving ? Math.round(s * 2) : 0;
  const bob = moving ? Math.round(Math.abs(s)) : (Math.sin(phase * TAU) > 0.7 ? -1 : 0);

  ellipse(g, 18, 18 + bob, 11, 6, it.c2);
  ellipse(g, 18, 17 + bob, 10, 5, it.c1);
  R(g, 9, 14 + bob, 17, 2, it.c2);
  if (it.style === 'horse') {
    R(g, 12, 13 + bob, 6, 2, it.c3);
    R(g, 16, 12 + bob, 5, 2, it.c3);
  }

  const lx = [9, 14, 22, 27];
  for (let i = 0; i < 4; i++) {
    const off = i < 2 ? step : -step;
    R(g, lx[i] + off, 22 + bob, 3, 7, it.c2);
    R(g, lx[i] + off, 28 + bob, 3, 2, it.c2);
  }

  /* 脖子和头 */
  line(g, 26, 16 + bob, 31, 8 + bob, it.c2, 7);
  line(g, 27, 15 + bob, 31, 9 + bob, it.c1, 5);
  ellipse(g, 31, 8 + bob, 5, 4, it.c2);
  ellipse(g, 31, 7 + bob, 4, 3, it.c1);
  R(g, 34, 8 + bob, 2, 3, it.c2);
  if (!back) {
    R(g, 32, 6 + bob, 1, 1, '#1a1a1a');
    R(g, 35, 9 + bob, 1, 1, it.c2);
  }
  /* 鬃毛 */
  for (let i = 0; i < 5; i++) R(g, 27 + i, 13 + bob - i, 2, 2, it.c2);
  /* 尾巴 */
  const wag = Math.round(Math.sin(phase * TAU) * 2);
  line(g, 7, 17 + bob, 4, 23 + wag + bob, it.c2, 2);
  R(g, 3, 22 + wag + bob, 2, 4, it.c2);
  if (it.style === 'horse') R(g, 10, 15 + bob, 2, 2, it.c3);
}

export function drawPet(g, pet, action, dir, phase) {
  const it = typeof pet === 'string' ? PET_MAP[pet] : pet;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  let d = dir;
  if (dir === 1) {
    g.translate(PET_W, 0);
    g.scale(-1, 1);
    d = 2;
  }
  if (it.kind === 'turtle') drawTurtle(g, it, d, phase);
  else if (it.kind === 'horse') drawHorse(g, it, d, phase, action);
  else drawQuadruped(g, it, d, phase, action, it.kind === 'dog');
  g.restore();
}

export function drawPetIcon(g, pet, phase = 0.25) {
  drawPet(g, pet, 'idle', 2, phase);
}
