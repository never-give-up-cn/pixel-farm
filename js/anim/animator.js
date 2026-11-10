/* 动画元数据、帧缓存与播放器。
 * 帧缓存：每个 (动作, 朝向, 帧号) 先画进 32×40 的离屏 canvas，
 * 播放时只做整数倍 drawImage，避免每帧重复跑绘制逻辑。
 * 本文件不依赖游戏全局，可直接被游戏或 Demo 复用。 */

import { CELL_W, CELL_H, DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP } from './pixel.js';
import { drawFarmer } from './farmer.js';

export const ACTIONS = [
  { id: 'idle',    name: '站立',  frames: 4, fps: 4,  loop: true  },
  { id: 'walk',    name: '走路',  frames: 6, fps: 10, loop: true  },
  { id: 'run',     name: '奔跑',  frames: 6, fps: 14, loop: true  },
  { id: 'attack',  name: '挥剑',  frames: 8, fps: 14, loop: false },
  { id: 'hoe',     name: '锄地',  frames: 8, fps: 12, loop: false },
  { id: 'water',   name: '浇水',  frames: 6, fps: 8,  loop: true  },
  { id: 'axe',     name: '砍树',  frames: 8, fps: 12, loop: false },
  { id: 'pick',    name: '挖矿',  frames: 8, fps: 12, loop: false },
  { id: 'sickle',  name: '割草',  frames: 8, fps: 12, loop: false },
  { id: 'harvest', name: '收获',  frames: 8, fps: 10, loop: false },
  { id: 'fish',    name: '钓鱼',  frames: 4, fps: 4,  loop: true  },
  { id: 'eat',     name: '吃东西', frames: 8, fps: 8,  loop: true  },
  { id: 'sleep',   name: '睡觉',  frames: 4, fps: 3,  loop: true  },
  { id: 'hurt',    name: '受击',  frames: 4, fps: 10, loop: false },
  { id: 'faint',   name: '倒地',  frames: 6, fps: 6,  loop: false }
];

export const ACTION_MAP = Object.fromEntries(ACTIONS.map(a => [a.id, a]));

export const DIRECTIONS = [
  { id: DIR_DOWN,  name: '下', key: 'down'  },
  { id: DIR_LEFT,  name: '左', key: 'left'  },
  { id: DIR_RIGHT, name: '右', key: 'right' },
  { id: DIR_UP,    name: '上', key: 'up'    }
];

/* 帧缓存：key = `${action}|${dir}|${frame}` */
const frameCache = new Map();

function createCell() {
  const c = document.createElement('canvas');
  c.width = CELL_W;
  c.height = CELL_H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

/**
 * 取某一帧的离屏 canvas（命中缓存则直接返回）。
 * 循环动作最后一帧用 frame/frames，单次动作用 frame/(frames-1)，
 * 保证首尾不重复、单次动作能停在完整收尾姿势。
 */
export function getFrame(action, dir, frame) {
  const meta = ACTION_MAP[action] || ACTION_MAP.idle;
  const f = Math.max(0, Math.min(meta.frames - 1, frame | 0));
  const key = `${meta.id}|${dir}|${f}`;
  const hit = frameCache.get(key);
  if (hit) return hit;

  const cell = createCell();
  const denom = meta.loop ? meta.frames : Math.max(1, meta.frames - 1);
  drawFarmer(cell.ctx, meta.id, dir, f / denom);
  frameCache.set(key, cell);
  return cell;
}

/* 预热全部动作 × 全部朝向，避免切换时第一帧卡顿 */
export function preloadAll() {
  for (const a of ACTIONS) {
    for (const d of DIRECTIONS) {
      for (let f = 0; f < a.frames; f++) getFrame(a.id, d.id, f);
    }
  }
}

export function clearFrameCache() {
  frameCache.clear();
}

export class Animator {
  constructor(opts = {}) {
    this.action = opts.action || 'idle';
    this.dir = opts.dir === undefined ? DIR_DOWN : opts.dir;
    this.actionSpeed = opts.actionSpeed || 1;   // 动作速度倍率
    this.frame = 0;
    this.time = 0;          // 当前帧内已累计时间
    this.playing = opts.playing !== false;
    this.finished = false;  // 单次动作播完
  }

  get meta() { return ACTION_MAP[this.action] || ACTION_MAP.idle; }
  get frames() { return this.meta.frames; }
  get loop() { return this.meta.loop; }
  get fps() { return this.meta.fps * this.actionSpeed; }

  setAction(action, dir) {
    if (ACTION_MAP[action] && action !== this.action) {
      this.action = action;
      this.frame = 0;
      this.time = 0;
      this.finished = false;
    }
    if (dir !== undefined) this.dir = dir;
  }

  setDir(dir) {
    if (dir !== this.dir) this.dir = dir;
  }

  setSpeed(mult) {
    this.actionSpeed = Math.max(0.05, mult || 1);
  }

  replay() {
    this.frame = 0;
    this.time = 0;
    this.finished = false;
    this.playing = true;
  }

  step(delta = 1) {
    if (!this.finished) {
      this.frame += delta;
      const max = this.frames - 1;
      if (this.frame > max) {
        if (this.loop) {
          this.frame = ((this.frame % this.frames) + this.frames) % this.frames;
        } else {
          this.frame = max;
          this.finished = true;
          this.playing = false;
        }
      } else if (this.frame < 0) {
        this.frame = this.loop ? this.frames - 1 : 0;
      }
    }
  }

  update(dt) {
    if (!this.playing || this.finished) return;
    this.time += dt * this.actionSpeed;
    const dur = 1 / this.meta.fps;
    while (this.time >= dur) {
      this.time -= dur;
      this.frame++;
      if (this.frame >= this.frames) {
        if (this.loop) {
          this.frame = 0;
        } else {
          this.frame = this.frames - 1;
          this.finished = true;
          this.playing = false;
          this.time = 0;
          break;
        }
      }
    }
  }

  /** 当前帧对应的阶段（传给需要精确相位的绘制逻辑） */
  get phase() {
    const meta = this.meta;
    const denom = meta.loop ? meta.frames : Math.max(1, meta.frames - 1);
    return this.frame / denom;
  }

  /** 在目标画布上绘制（x/y 为左上角，scale 为整数倍） */
  draw(ctx, x, y, scale = 1) {
    const s = Math.max(1, Math.round(scale));
    const cell = getFrame(this.action, this.dir, Math.round(this.frame));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cell.canvas, Math.round(x), Math.round(y), CELL_W * s, CELL_H * s);
  }
}

export { CELL_W, CELL_H, DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP };
