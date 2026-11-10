/* js/systems/player-anim.js — 把 anim 层的农夫动画接进游戏本体。
 *
 * 只负责三件事：
 *   1. 根据移动 / 奔跑 / 钓鱼 / 使用工具，决定当前动作；
 *   2. 驱动一次性动作（锄地、挥斧、吃东西…）的进度；
 *   3. 在世界里按脚底对齐绘制 drawFarmer。
 *
 * 第 34 轮：世界操作改为「先播动画、命中帧结算」。
 * 工具 / 播种 / 收获 / 吃东西 / 补水 / 采集 / 抛竿都通过 playerPerformAction 排队，
 * 动画播完前锁步，操作不会在点击瞬间生效。
 *
 * 不改变 player 的位置、碰撞和存档；旧 drawPlayer 保留作回退。
 */

'use strict';

import { drawFarmer } from '../anim/farmer.js';
import { ACTION_MAP } from '../anim/animator.js';
import { HAT_MAP, drawHatOnFarmer } from '../anim/hats.js';
import { DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP } from '../anim/pixel.js';

/* 精灵格 32×40，脚底在 y≈36；世界里的脚点约定是 player.y + BODY_H/2 */
const CELL_W = 32;
const CELL_H = 40;
const FEET_Y = 36;

const TOOL_ACTIONS = {
  hoe: 'hoe',
  can: 'water',
  axe: 'axe',
  pick: 'pick',
  sickle: 'sickle',
  rod: 'fish'
};

const anim = {
  action: 'idle',
  phase: 0,
  timer: 0,        /* 一次性动作剩余时间 */
  duration: 0,
  oneShot: false,
  lastDir: DIR_DOWN,
  hitAt: 0.5,      /* 动作进行到多少比例时结算（0~1） */
  hitDone: false,
  onHit: null,     /* 结算回调：动画到命中帧才真正执行操作 */
  onEnd: null      /* 收尾回调：动画完整播完后执行 */
};

function metaOf(action) {
  return ACTION_MAP[action] || ACTION_MAP.idle;
}

function scaleOf() {
  const n = Number(CONFIG.PLAYER.ANIM_SCALE);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** 播放一次性动作（工具 / 收获 / 吃东西）。 */
export function playerPlayAction(id, opts = {}) {
  const meta = ACTION_MAP[id];
  if (!meta) return false;
  const duration = opts.duration || (meta.frames / meta.fps);
  anim.action = id;
  anim.phase = 0;
  anim.oneShot = (opts.oneShot !== undefined) ? !!opts.oneShot : !meta.loop;
  anim.duration = Math.max(0.05, duration);
  anim.timer = anim.duration;
  anim.hitAt = Math.max(0, Math.min(1, opts.hitAt === undefined ? 0.5 : opts.hitAt));
  anim.hitDone = false;
  anim.onHit = typeof opts.onHit === 'function' ? opts.onHit : null;
  anim.onEnd = typeof opts.onEnd === 'function' ? opts.onEnd : null;
  return true;
}

/** 播放动作，并在命中帧执行 onHit；动画播完前操作不算完成。 */
export function playerPerformAction(id, onHit, opts = {}) {
  if (playerAnimBusy()) return false;
  return playerPlayAction(id, {
    ...opts,
    oneShot: opts.oneShot === undefined ? true : opts.oneShot,
    onHit
  });
}

/** 根据目标地块和手持物品决定该播哪个动作（收获优先于工具）。 */
export function playerActionForTile(tx, ty) {
  const c = (typeof cropAt === 'function') ? cropAt(tx, ty) : null;
  if (c && c.mature) return 'harvest';
  const slot = typeof selectedSlot === 'function' ? selectedSlot() : null;
  const item = slot && typeof itemDef === 'function' ? itemDef(slot.id) : null;
  if (item) {
    if (item.kind === 'seed') return 'harvest';
    if (item.tool && TOOL_ACTIONS[item.tool]) return TOOL_ACTIONS[item.tool];
  }
  return 'harvest';
}

/** 根据当前手持物品决定动作；种子 / 收获 / 食物走收获姿势。 */
export function playerActionFromItem() {
  const slot = typeof selectedSlot === 'function' ? selectedSlot() : null;
  const item = slot && typeof itemDef === 'function' ? itemDef(slot.id) : null;
  if (!item) return playerPlayAction('harvest');
  if (item.kind === 'seed') return playerPlayAction('harvest');
  if (item.kind === 'food') return playerPlayAction('eat');
  if (item.tool && TOOL_ACTIONS[item.tool]) return playerPlayAction(TOOL_ACTIONS[item.tool]);
  return playerPlayAction('harvest');
}

/** 让玩家面向点击的地块（只改朝向，不改位置）。 */
export function playerFaceTile(tx, ty) {
  if (typeof player === 'undefined' || typeof TILE === 'undefined') return;
  const cx = tx * TILE + TILE / 2;
  const cy = ty * TILE + TILE / 2;
  const dx = cx - player.x;
  const dy = cy - player.y;
  if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? DIR_LEFT : DIR_RIGHT;
  else player.dir = dy < 0 ? DIR_UP : DIR_DOWN;
  anim.lastDir = player.dir;
}

/** 每帧推进动作。 */
export function updatePlayerAnim(dt) {
  if (anim.oneShot) {
    anim.timer -= dt;
    const total = anim.duration || 0.0001;
    anim.phase = clamp01(1 - Math.max(0, anim.timer) / total);

    /* 命中帧：动画挥到该到的地方，操作才真正生效 */
    if (!anim.hitDone && anim.onHit && anim.phase >= anim.hitAt - 1e-6) {
      anim.hitDone = true;
      try { anim.onHit(); } catch (err) { console.error('[player-action]', err); }
    }

    if (anim.timer <= 0) {
      const onEnd = anim.onEnd;
      anim.oneShot = false;
      anim.action = 'idle';
      anim.phase = 0;
      anim.timer = 0;
      anim.hitDone = false;
      anim.onHit = null;
      anim.onEnd = null;
      if (onEnd) {
        try { onEnd(); } catch (err) { console.error('[player-action]', err); }
      }
    }
    return;
  }

  /* 钓鱼时保持抛竿姿势 */
  if (typeof fishingActive === 'function' && fishingActive()) {
    anim.action = 'fish';
    anim.phase = loopPhase('fish');
    return;
  }

  if (typeof player !== 'undefined' && player.moving) {
    anim.action = player.running ? 'run' : 'walk';
    anim.phase = loopPhase(anim.action);
  } else {
    anim.action = 'idle';
    anim.phase = loopPhase('idle');
  }
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function loopPhase(action) {
  const meta = metaOf(action);
  const frames = Math.max(1, meta.frames);
  return ((animTime || 0) * meta.fps / frames) % 1;
}

/** 世界坐标绘制：脚底对齐到 player.y + BODY_H/2。 */
export function drawPlayerAnim(g) {
  if (typeof player === 'undefined' || typeof cam === 'undefined') return;
  const scale = scaleOf();
  const feet = player.y - cam.y + CONFIG.PLAYER.BODY_H / 2;
  const ox = Math.round(player.x - cam.x - (CELL_W * scale) / 2);
  const oy = Math.round(feet - FEET_Y * scale);

  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(ox, oy);
  if (scale !== 1) g.scale(scale, scale);
  const fit = (typeof playerOutfitOpts === 'function') ? playerOutfitOpts() : null;
  drawFarmer(g, anim.action, player.dir, anim.phase, fit
    ? { noHat: fit.noHat, outfit: fit.outfit }
    : undefined);
  if (fit && fit.hat && HAT_MAP[fit.hat]) {
    drawHatOnFarmer(g, HAT_MAP[fit.hat], player.dir, anim.phase);
  }
  g.restore();
}

export function playerAnimState() {
  return { ...anim };
}

/** 是否有一次性动作正在播放（长按连续使用时用来对齐节奏）。 */
export function playerAnimBusy() {
  return anim.oneShot;
}

Object.assign(window, {
  playerPlayAction,
  playerPerformAction,
  playerActionForTile,
  playerActionFromItem,
  playerFaceTile,
  updatePlayerAnim,
  drawPlayerAnim,
  playerAnimState,
  playerAnimBusy
});
