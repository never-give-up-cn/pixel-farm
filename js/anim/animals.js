/* 动物像素绘制：鸡 / 鸭 / 牛 / 羊 / 猪 / 兔，4 个动作，左右朝向由镜像实现。
 * 每个动物画在 40×32 的格子里，地面基线 y=28；含帧缓存与播放器。 */

import { PALETTE, R, line, ellipse, TAU } from './pixel.js';

export const ANIMAL_W = 40;
export const ANIMAL_H = 32;
export const ANIMAL_BASE = 28;

const SHADOW = 'rgba(20, 26, 18, 0.26)';

export const ANIMAL_ACTIONS = [
  { id: 'idle',  name: '站立', frames: 4, fps: 3 },
  { id: 'walk',  name: '走路', frames: 6, fps: 8 },
  { id: 'eat',   name: '进食', frames: 4, fps: 4 },
  { id: 'sleep', name: '睡觉', frames: 4, fps: 2 }
];

export const ANIMAL_ACTION_MAP = Object.fromEntries(ANIMAL_ACTIONS.map(a => [a.id, a]));

export const ANIMALS = [
  { id: 'chicken', name: '鸡',  body: '#f7f1dd', shade: '#d9cfb4', accent: '#d94a3a' },
  { id: 'duck',    name: '鸭',  body: '#f2e2a0', shade: '#d8c47a', accent: '#e8893c' },
  { id: 'cow',     name: '牛',  body: '#f4eee2', shade: '#d8cfc0', accent: '#8a5a3c' },
  { id: 'sheep',   name: '羊',  body: '#f4f0e6', shade: '#d8d2c2', accent: '#3a3230' },
  { id: 'pig',     name: '猪',  body: '#eaa2a2', shade: '#cf8585', accent: '#c96f7a' },
  { id: 'rabbit',  name: '兔',  body: '#c9b8a8', shade: '#a89a8c', accent: '#e0a8a8' }
];

export const ANIMAL_MAP = Object.fromEntries(ANIMALS.map(a => [a.id, a]));

function zzz(g, x, y, a) {
  g.globalAlpha = a;
  R(g, x, y, 3, 1, PALETTE.white);
  R(g, x + 1, y + 1, 1, 1, PALETTE.white);
  R(g, x, y + 2, 3, 1, PALETTE.white);
  g.globalAlpha = 1;
}

function sleepEye(g, x, y) {
  R(g, x, y, 2, 1, '#3a3026');
}

/* ---------------- 鸡 ---------------- */
function drawChicken(g, action, ph) {
  const s = Math.sin(ph * TAU);
  const walking = action === 'walk';
  const eating = action === 'eat';
  const sleeping = action === 'sleep';
  const peck = eating ? 0.5 + 0.5 * Math.sin(ph * TAU * 2) : 0;

  ellipse(g, 19, 29, 7, 2, SHADOW);

  const by = (sleeping ? 23 : 19) + (walking && Math.abs(s) > 0.7 ? -1 : 0);
  const hx = sleeping ? 24 : 27;
  const hy = (sleeping ? 21 : 12) + (walking ? 0 : Math.round(s * 0.6)) + peck * 8;

  if (!sleeping) {
    const l1 = walking ? Math.round(2 * s) : 0;
    const l2 = walking ? -l1 : 0;
    const lift1 = walking ? Math.max(0, s) * 2 : 0;
    const lift2 = walking ? Math.max(0, -s) * 2 : 0;
    R(g, 17 + l1, 22, 1, 6 - lift1, '#e8a33c');
    R(g, 21 + l2, 22, 1, 6 - lift2, '#e8a33c');
    R(g, 16 + l1, 27 - lift1, 3, 1, '#c9862c');
    R(g, 20 + l2, 27 - lift2, 3, 1, '#c9862c');
  }

  /* 尾巴 */
  R(g, 12, by - 5, 3, 4, '#e2dac6');
  R(g, 11, by - 3, 2, 3, '#cfc6ad');

  /* 身体 */
  ellipse(g, 19, by, 7, 5, '#f7f1dd');
  ellipse(g, 18, by + 1, 4, 3, '#e2dac6');
  /* 头颈 */
  line(g, 24, by - 4, hx, hy + 2, '#f7f1dd', 2);
  ellipse(g, hx, hy, 3, 3, '#f7f1dd');

  if (sleeping) sleepEye(g, hx + 1, hy);
  else R(g, hx + 1, hy - 1, 1, 1, '#2a1e16');

  /* 喙 / 鸡冠 / 肉垂 */
  R(g, hx + 3, hy + 1, 2, 1, '#e8a33c');
  R(g, hx - 1, hy - 4, 2, 2, '#d94a3a');
  R(g, hx + 1, hy - 3, 1, 1, '#d94a3a');
  R(g, hx + 2, hy + 2, 1, 1, '#d94a3a');

  if (sleeping) zzz(g, 30, 6, 0.75);
}

/* ---------------- 鸭 ---------------- */
function drawDuck(g, action, ph) {
  const s = Math.sin(ph * TAU);
  const walking = action === 'walk';
  const eating = action === 'eat';
  const sleeping = action === 'sleep';
  const peck = eating ? Math.max(0, Math.sin(ph * TAU * 2)) : 0;

  ellipse(g, 19, 29, 8, 2, SHADOW);

  const by = (sleeping ? 23 : 21) + (walking ? (Math.abs(s) > 0.7 ? -1 : 0) : Math.round(s * 0.4));
  const hx = sleeping ? 23 : 28;
  const hy = (sleeping ? 21 : 13) + peck * 9;

  if (!sleeping) {
    const l1 = walking ? Math.round(2 * s) : 0;
    const l2 = walking ? -l1 : 0;
    R(g, 17 + l1, 23, 1, 4, '#e8893c');
    R(g, 21 + l2, 23, 1, 4, '#e8893c');
    R(g, 16 + l1, 27, 3, 1, '#c96f2c');
    R(g, 20 + l2, 27, 3, 1, '#c96f2c');
  }

  /* 尾巴 */
  R(g, 10, by - 3, 3, 3, '#d8c47a');
  R(g, 9, by - 1, 2, 2, '#c9b264');

  /* 身体 */
  ellipse(g, 18, by, 8, 4, '#f2e2a0');
  ellipse(g, 18, by + 1, 5, 2, '#e6d18a');
  /* 翅膀 */
  ellipse(g, 18, by, 4, 2, '#d8c47a');

  /* 脖子 / 头 */
  line(g, 24, by - 1, hx, hy + 2, '#f2e2a0', 2);
  ellipse(g, hx, hy, 3, 3, '#f2e2a0');
  if (sleeping) sleepEye(g, hx + 1, hy);
  else R(g, hx + 1, hy - 1, 1, 1, '#2a1e16');

  /* 扁嘴 */
  R(g, hx + 3, hy + 1, 3, 1, '#e8893c');
  R(g, hx + 3, hy + 2, 2, 1, '#c96f2c');

  if (sleeping) zzz(g, 31, 6, 0.7);
}

/* ---------------- 牛 ---------------- */
function drawCow(g, action, ph) {
  const s = Math.sin(ph * TAU);
  const walking = action === 'walk';
  const eating = action === 'eat';
  const sleeping = action === 'sleep';
  const peck = eating ? 0.5 + 0.5 * Math.sin(ph * TAU) : 0;

  ellipse(g, 19, 29, 11, 2, SHADOW);

  const by = (sleeping ? 21 : 17) + (walking && Math.abs(s) > 0.7 ? -1 : 0);
  const hx = eating ? 32 : 30;
  const hy = eating ? 22 + peck * 3 : (sleeping ? 22 : 13) + Math.round(s * 0.5);

  /* 腿 */
  if (!sleeping) {
    const l1 = walking ? Math.round(2 * s) : 0;
    const l2 = walking ? -l1 : 0;
    const up1 = walking ? Math.max(0, s) * 2 : 0;
    const up2 = walking ? Math.max(0, -s) * 2 : 0;
    R(g, 11, by + 5, 2, 6 - up1, '#d8cfc0');
    R(g, 25, by + 5, 2, 6 - up2, '#d8cfc0');
    R(g, 15 + l1, by + 5, 2, 6 - up2, '#f4eee2');
    R(g, 21 + l2, by + 5, 2, 6 - up1, '#f4eee2');
    R(g, 11, 27 - up1, 2, 1, '#4a3a2f');
    R(g, 25, 27 - up2, 2, 1, '#4a3a2f');
    R(g, 15 + l1, 27 - up2, 2, 1, '#4a3a2f');
    R(g, 21 + l2, 27 - up1, 2, 1, '#4a3a2f');
  } else {
    R(g, 10, 24, 3, 2, '#d8cfc0');
    R(g, 17, 24, 3, 2, '#f4eee2');
    R(g, 24, 24, 3, 2, '#f4eee2');
  }

  /* 尾巴 */
  line(g, 9, by - 3, 7, by + 6, '#d8cfc0', 1);
  R(g, 6, by + 6, 2, 2, '#8a5a3c');

  /* 身体 */
  ellipse(g, 18, by, 9, 6, '#f4eee2');
  ellipse(g, 14, by - 2, 4, 3, '#8a5a3c');
  ellipse(g, 23, by + 2, 3, 2, '#8a5a3c');
  R(g, 12, by + 1, 5, 1, '#e8e0d2');

  /* 脖子：把身体和头连起来，吃东西时也会跟着压低 */
  line(g, 24, by - 4, hx - 2, hy + 2, '#f4eee2', 4);

  /* 头 */
  ellipse(g, hx, hy, 5, 4, '#f4eee2');
  ellipse(g, hx + 3, hy + 2, 3, 2, '#e2b8a8');
  R(g, hx + 3, hy + 2, 1, 1, '#b98a7a');
  if (sleeping) sleepEye(g, hx + 2, hy - 1);
  else R(g, hx + 2, hy - 2, 1, 1, '#2a1e16');

  /* 耳朵 / 角 */
  R(g, hx - 4, hy - 3, 2, 2, '#e2b8a8');
  R(g, hx - 4, hy - 4, 1, 3, '#e8dccb');
  R(g, hx + 2, hy - 5, 1, 3, '#e8dccb');

  if (sleeping) zzz(g, 32, 6, 0.75);
}

/* ---------------- 羊 ---------------- */
function drawSheep(g, action, ph) {
  const s = Math.sin(ph * TAU);
  const walking = action === 'walk';
  const eating = action === 'eat';
  const sleeping = action === 'sleep';
  const peck = eating ? 0.5 + 0.5 * Math.sin(ph * TAU * 2) : 0;

  ellipse(g, 19, 29, 10, 2, SHADOW);

  const by = (sleeping ? 22 : 17) + (walking && Math.abs(s) > 0.7 ? -1 : 0);
  const hx = 28;
  const hy = eating ? 22 + peck * 2 : (sleeping ? 22 : 15) + Math.round(s * 0.4);

  /* 腿 */
  if (!sleeping) {
    const l1 = walking ? Math.round(2 * s) : 0;
    const l2 = walking ? -l1 : 0;
    R(g, 14 + l1, by + 5, 2, 6 - Math.max(0, s) * 2, '#3a3230');
    R(g, 22 + l2, by + 5, 2, 6 - Math.max(0, -s) * 2, '#3a3230');
    R(g, 13 + l1, 27, 3, 1, '#2a2422');
    R(g, 21 + l2, 27, 3, 1, '#2a2422');
  } else {
    R(g, 13, 24, 3, 2, '#3a3230');
    R(g, 22, 24, 3, 2, '#3a3230');
  }

  /* 羊毛身体 */
  ellipse(g, 17, by, 8, 5, '#f4f0e6');
  ellipse(g, 13, by - 2, 4, 3, '#f4f0e6');
  ellipse(g, 21, by - 2, 4, 3, '#f4f0e6');
  ellipse(g, 17, by - 4, 5, 3, '#f4f0e6');
  ellipse(g, 15, by + 2, 4, 2, '#d8d2c2');
  R(g, 12, by - 5, 2, 1, '#ffffff');

  /* 头 */
  ellipse(g, hx, hy, 4, 3, '#3a3230');
  R(g, hx - 3, hy - 2, 2, 2, '#3a3230');
  if (sleeping) sleepEye(g, hx + 1, hy);
  else R(g, hx + 1, hy - 1, 1, 1, '#f4f0e6');
  R(g, hx + 1, hy + 1, 1, 1, '#2a2422');

  if (sleeping) zzz(g, 32, 6, 0.7);
}

/* ---------------- 猪 ---------------- */
function drawPig(g, action, ph) {
  const s = Math.sin(ph * TAU);
  const walking = action === 'walk';
  const eating = action === 'eat';
  const sleeping = action === 'sleep';
  const peck = eating ? 0.5 + 0.5 * Math.sin(ph * TAU * 2) : 0;

  ellipse(g, 19, 29, 9, 2, SHADOW);

  const by = (sleeping ? 22 : 19) + (walking && Math.abs(s) > 0.7 ? -1 : 0);
  const hx = 27;
  const hy = eating ? 23 + peck * 3 : (sleeping ? 22 : 18) + Math.round(s * 0.5);

  if (!sleeping) {
    const l1 = walking ? Math.round(2 * s) : 0;
    const l2 = walking ? -l1 : 0;
    R(g, 14 + l1, by + 4, 2, 5 - Math.max(0, s) * 2, '#cf8585');
    R(g, 22 + l2, by + 4, 2, 5 - Math.max(0, -s) * 2, '#cf8585');
  } else {
    R(g, 13, 24, 3, 2, '#cf8585');
    R(g, 22, 24, 3, 2, '#cf8585');
  }

  /* 卷尾巴 */
  line(g, 9, by - 2, 7, by - 4, '#cf8585', 1);
  R(g, 6, by - 5, 2, 1, '#cf8585');
  R(g, 6, by - 4, 1, 1, '#cf8585');

  /* 身体 */
  ellipse(g, 18, by, 8, 5, '#eaa2a2');
  ellipse(g, 17, by + 2, 5, 2, '#cf8585');
  R(g, 12, by - 3, 3, 1, '#f4c0c0');

  /* 头 */
  ellipse(g, hx, hy, 4, 4, '#eaa2a2');
  R(g, hx - 2, hy - 5, 2, 2, '#d88a8a');
  R(g, hx + 2, hy - 4, 2, 2, '#d88a8a');
  if (sleeping) sleepEye(g, hx + 1, hy - 1);
  else R(g, hx + 1, hy - 2, 1, 1, '#2a1e16');

  /* 猪鼻 */
  ellipse(g, hx + 3, hy + 1, 2, 2, '#d97f88');
  R(g, hx + 3, hy + 1, 1, 1, '#b05f6a');
  R(g, hx + 5, hy + 1, 1, 1, '#b05f6a');

  if (sleeping) zzz(g, 31, 6, 0.7);
}

/* ---------------- 兔 ---------------- */
function drawRabbit(g, action, ph) {
  const s = Math.sin(ph * TAU);
  const walking = action === 'walk';
  const eating = action === 'eat';
  const sleeping = action === 'sleep';
  const peck = eating ? 0.5 + 0.5 * Math.sin(ph * TAU * 2) : 0;
  const hop = walking ? Math.max(0, Math.sin(ph * TAU * 2)) * 3 : 0;

  ellipse(g, 19, 29, 7, 2, SHADOW);

  const by = (sleeping ? 23 : 22) - hop;
  const hx = 26;
  const hy = (sleeping ? 23 : 17) - hop + peck * 5;

  if (!sleeping) {
    const l1 = walking ? Math.round(2 * s) : 0;
    const l2 = -l1;
    R(g, 16 + l1, by + 2, 2, 3, '#a89a8c');
    R(g, 21 + l2, by + 2, 2, 3, '#a89a8c');
    R(g, 15 + l1, by + 5, 3, 1, '#8c7f73');
    R(g, 20 + l2, by + 5, 3, 1, '#8c7f73');
  }

  /* 尾巴 */
  ellipse(g, 12, by - 1, 2, 2, '#f0e6da');

  /* 身体 */
  ellipse(g, 19, by, 6, 4, '#c9b8a8');
  ellipse(g, 19, by + 2, 4, 2, '#f0e6da');

  /* 头 */
  ellipse(g, hx, hy, 4, 3, '#c9b8a8');
  /* 耳朵 */
  const earBack = sleeping ? 4 : 0;
  R(g, hx - 3, hy - 7 + earBack, 2, 5, '#c9b8a8');
  R(g, hx + 1, hy - 8 + earBack, 2, 6, '#c9b8a8');
  R(g, hx - 3, hy - 6 + earBack, 1, 3, '#e0a8a8');
  R(g, hx + 1, hy - 7 + earBack, 1, 4, '#e0a8a8');
  if (sleeping) sleepEye(g, hx + 1, hy);
  else R(g, hx + 1, hy - 1, 1, 1, '#2a1e16');
  R(g, hx + 3, hy + 1, 1, 1, '#e0a8a8');

  if (sleeping) zzz(g, 30, 5, 0.7);
}

const DRAWERS = {
  chicken: drawChicken,
  duck: drawDuck,
  cow: drawCow,
  sheep: drawSheep,
  pig: drawPig,
  rabbit: drawRabbit
};

/* 在 40×32 格子里画动物；facing = 1 朝右，-1 朝左 */
export function drawAnimal(g, type, action, phase = 0, facing = 1) {
  const draw = DRAWERS[type];
  if (!draw) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (facing < 0) {
    g.translate(ANIMAL_W, 0);
    g.scale(-1, 1);
  }
  draw(g, action, phase);
  g.restore();
}

/* ---------------- 帧缓存与播放器 ---------------- */

const cache = new Map();

export function getAnimalFrame(type, action, facing, frame) {
  const meta = ANIMAL_ACTION_MAP[action] || ANIMAL_ACTION_MAP.idle;
  const f = Math.max(0, Math.min(meta.frames - 1, frame | 0));
  const face = facing < 0 ? -1 : 1;
  const key = `${type}|${meta.id}|${face}|${f}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const c = document.createElement('canvas');
  c.width = ANIMAL_W;
  c.height = ANIMAL_H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  drawAnimal(g, type, meta.id, f / meta.frames, face);
  const cell = { canvas: c, ctx: g };
  cache.set(key, cell);
  return cell;
}

export function preloadAnimals() {
  for (const a of ANIMALS) {
    for (const act of ANIMAL_ACTIONS) {
      for (const face of [1, -1]) {
        for (let f = 0; f < act.frames; f++) getAnimalFrame(a.id, act.id, face, f);
      }
    }
  }
}

export class AnimalAnimator {
  constructor(opts = {}) {
    this.type = opts.type || 'chicken';
    this.action = opts.action || 'idle';
    this.facing = opts.facing === -1 ? -1 : 1;
    this.speed = opts.speed || 1;
    this.frame = 0;
    this.time = 0;
    this.playing = opts.playing !== false;
  }

  get meta() { return ANIMAL_ACTION_MAP[this.action] || ANIMAL_ACTION_MAP.idle; }
  get frames() { return this.meta.frames; }

  setType(type) {
    if (ANIMAL_MAP[type]) this.type = type;
    this.frame = 0;
    this.time = 0;
  }

  setAction(action) {
    if (ANIMAL_ACTION_MAP[action]) {
      this.action = action;
      this.frame = 0;
      this.time = 0;
    }
  }

  setFacing(facing) {
    this.facing = facing === -1 ? -1 : 1;
  }

  setSpeed(speed) {
    this.speed = Math.max(0.05, speed || 1);
  }

  replay() {
    this.frame = 0;
    this.time = 0;
    this.playing = true;
  }

  update(dt) {
    if (!this.playing) return;
    this.time += dt * this.speed;
    const dur = 1 / this.meta.fps;
    while (this.time >= dur) {
      this.time -= dur;
      this.frame = (this.frame + 1) % this.frames;
    }
  }

  draw(ctx, x, y, scale = 1) {
    const s = Math.max(1, Math.round(scale));
    const cell = getAnimalFrame(this.type, this.action, this.facing, this.frame);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cell.canvas, Math.round(x), Math.round(y), ANIMAL_W * s, ANIMAL_H * s);
  }
}
