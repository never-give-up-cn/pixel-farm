/* js/systems/farmhouse.js — 可进入的农舍室内。
 * 按 E 从屋外进入；室内按 E 睡觉 / 看灶台，走到门口按 E 或 Esc 离开。
 * 室内使用 roomState 的墙纸 / 地板，玩家换装也会显示。
 */

'use strict';

import {
  INTERIOR_MAP, drawWallpaperTile, drawFloorTile, drawFurnitureIcon
} from '../anim/interior.js';
import { drawFarmer } from '../anim/farmer.js';
import { HAT_MAP, drawHatOnFarmer } from '../anim/hats.js';

const ROOM_W = 16;
const ROOM_H = 11;
const ROOM_OX = Math.round((CONFIG.VIEW_W - ROOM_W * 32) / 2);
const ROOM_OY = Math.round((CONFIG.VIEW_H - ROOM_H * 32) / 2);
const SPEED = 90;

window.farmhouseActive = false;
window.indoorDecor = false;

let outside = null;

const BED = { x: 2, y: 3, w: 2, h: 2 };
const STOVE = { x: 12, y: 3, w: 2, h: 1 };
const TABLE = { x: 7, y: 3, w: 2, h: 1 };
const DOOR = { x: 8, y: 10 };

function inside(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function solidAt(tx, ty) {
  if (tx < 1 || tx >= ROOM_W - 1 || ty < 3 || ty >= ROOM_H - 1) return true;
  if (inside(tx, ty, BED) || inside(tx, ty, STOVE) || inside(tx, ty, TABLE)) return true;
  if (typeof roomFurnitureAt === 'function' && roomFurnitureAt(tx, ty)) return true;
  return false;
}

function boxBlocked(x, y) {
  const hw = 6, hh = 8;
  for (const [dx, dy] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) {
    if (solidAt(Math.floor((x + dx) / 32), Math.floor((y + dy) / 32))) return true;
  }
  return false;
}

function enterFarmhouse() {
  if (window.farmhouseActive) return false;
  outside = { x: player.x, y: player.y, dir: player.dir };
  window.farmhouseActive = true;
  player.x = 8.5 * 32;
  player.y = 8.5 * 32;
  player.dir = 3;
  player.moving = false;
  player.vx = player.vy = 0;
  toast('进入农舍 · 走到床边按 E 睡觉 · 门口按 E 出去');
  playSfx(420, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.6);
  return true;
}

function exitFarmhouse() {
  if (!window.farmhouseActive) return false;
  window.farmhouseActive = false;
  if (outside) {
    player.x = outside.x;
    player.y = outside.y;
    player.dir = outside.dir;
  }
  outside = null;
  player.moving = false;
  player.vx = player.vy = 0;
  toast('回到农场');
  return true;
}

function farmhouseForceExit() {
  window.farmhouseActive = false;
  outside = null;
}

function farmhouseSavePos() {
  if (!window.farmhouseActive || !outside) return null;
  return { x: outside.x, y: outside.y };
}

function nearRect(r, pad) {
  const cx = (r.x + r.w / 2) * 32;
  const cy = (r.y + r.h / 2) * 32;
  return Math.hypot(player.x - cx, player.y - cy) <= (pad || 46);
}

function farmhouseInteract() {
  if (!window.farmhouseActive) return false;
  if (nearRect(BED, 56)) {
    startSleep(false);
    return true;
  }
  if (nearRect(STOVE, 52)) {
    if (typeof makerOpenPanel === 'function' && window.roomStove) {
      if (typeof packOpen !== 'undefined' && packOpen && typeof togglePack === 'function') togglePack(false);
      makerOpenPanel(window.roomStove);
    } else {
      toast('灶台还没接上，先用外面的灶台烹饪');
    }
    return true;
  }
  if (Math.hypot(player.x - (DOOR.x + 0.5) * 32, player.y - (DOOR.y + 0.2) * 32) <= 54) {
    exitFarmhouse();
    return true;
  }
  if (nearRect(TABLE, 48)) {
    toast('桌上摊着一本没看完的书');
    return true;
  }
  return false;
}

function farmhouseTileAt(px, py) {
  return { tx: Math.floor((px - ROOM_OX) / 32), ty: Math.floor((py - ROOM_OY) / 32) };
}

function indoorTileFree(tx, ty) {
  if (tx < 1 || tx >= ROOM_W - 1 || ty < 3 || ty >= ROOM_H - 1) return false;
  if (inside(tx, ty, BED) || inside(tx, ty, STOVE) || inside(tx, ty, TABLE)) return false;
  if (typeof roomFurnitureAt === 'function' && roomFurnitureAt(tx, ty)) return false;
  return true;
}

function toggleIndoorDecor(v) {
  const want = (v === undefined) ? !window.indoorDecor : !!v;
  if (want) {
    const d = typeof decorItem === 'function' ? decorItem() : null;
    if (!d) { toast('先在快捷栏选中一件家具'); return false; }
    toast('室内装修：左键摆放 · 右键拆回 · H / Esc 退出');
  } else {
    toast('退出室内装修');
  }
  window.indoorDecor = want;
  return want;
}

function farmhouseIndoorPlace(tx, ty) {
  if (!window.indoorDecor) return false;
  const d = typeof decorItem === 'function' ? decorItem() : null;
  if (!d) { toast('先在快捷栏选中一件家具'); return false; }
  if (!indoorTileFree(tx, ty)) { toast('这里放不下家具'); return false; }
  if (countItem(d.id) <= 0) { toast('背包里没有这件家具'); return false; }
  if (!removeItem(d.id, 1)) return false;
  if (typeof roomPlaceFurniture === 'function') roomPlaceFurniture(d.id, tx, ty);
  playSfx(520, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

function farmhouseIndoorRemove(tx, ty) {
  if (!window.indoorDecor) return false;
  if (typeof roomRemoveFurniture !== 'function') return false;
  const id = roomRemoveFurniture(tx, ty);
  if (!id) return false;
  addItem(id, 1);
  toast('收起了家具');
  playSfx(320, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.7);
  return true;
}

function updateFarmhouse(dt) {
  const locked = (typeof playerAnimBusy === 'function' && playerAnimBusy());
  const k = (typeof keys !== 'undefined') ? keys : {};
  let ix = 0, iy = 0;
  if (!locked) {
    if (k['a'] || k['arrowleft']) ix -= 1;
    if (k['d'] || k['arrowright']) ix += 1;
    if (k['w'] || k['arrowup']) iy -= 1;
    if (k['s'] || k['arrowdown']) iy += 1;
  }

  if (ix || iy) {
    const len = Math.hypot(ix, iy) || 1;
    const step = SPEED * dt;
    const nx = player.x + ix / len * step;
    const ny = player.y + iy / len * step;
    if (!boxBlocked(nx, player.y)) player.x = nx;
    if (!boxBlocked(player.x, ny)) player.y = ny;
    player.moving = true;
    if (ix < 0) player.dir = 1;
    else if (ix > 0) player.dir = 2;
    else player.dir = iy < 0 ? 3 : 0;
  } else {
    player.moving = false;
  }
  if (typeof updatePlayerAnim === 'function') updatePlayerAnim(dt);
}

/* ---------- 绘制 ---------- */

function drawRoomTile(g, item, drawFn, x, y) {
  if (!item) return false;
  g.save();
  g.translate(x, y);
  drawFn(g, item, 0.25);
  g.restore();
  return true;
}

function drawFarmhouse(g) {
  g.fillStyle = '#0b0d12';
  g.fillRect(0, 0, CONFIG.VIEW_W, CONFIG.VIEW_H);

  const wall = roomState.wall ? INTERIOR_MAP[roomState.wall] : null;
  const floor = roomState.floor ? INTERIOR_MAP[roomState.floor] : null;

  for (let ty = 0; ty < ROOM_H; ty++) {
    for (let tx = 0; tx < ROOM_W; tx++) {
      const x = ROOM_OX + tx * 32, y = ROOM_OY + ty * 32;
      if (ty < 3) {
        if (!drawRoomTile(g, wall, drawWallpaperTile, x, y)) {
          g.fillStyle = '#34343e'; g.fillRect(x, y, 32, 32);
          g.fillStyle = '#3e3e48'; g.fillRect(x + 4, y + 4, 24, 24);
        }
        g.fillStyle = 'rgba(0,0,0,.12)';
        g.fillRect(x, y, 32, 32);
      } else {
        if (!drawRoomTile(g, floor, drawFloorTile, x, y)) {
          g.fillStyle = ((tx + ty) % 2) ? '#3a3026' : '#443a2e';
          g.fillRect(x, y, 32, 32);
        }
      }
    }
  }

  /* 墙脚线 */
  g.fillStyle = 'rgba(20,16,12,.55)';
  g.fillRect(ROOM_OX, ROOM_OY + 95, ROOM_W * 32, 4);

  /* 床 */
  const bx = ROOM_OX + BED.x * 32, by = ROOM_OY + BED.y * 32;
  g.fillStyle = '#6a4a2a'; g.fillRect(bx + 2, by + 2, 58, 58);
  g.fillStyle = '#e0d8c0'; g.fillRect(bx + 6, by + 6, 50, 20);
  g.fillStyle = '#5a7ab0'; g.fillRect(bx + 6, by + 26, 50, 30);
  g.fillStyle = '#48628f'; g.fillRect(bx + 6, by + 48, 50, 8);
  g.fillStyle = '#f0e8d0'; g.fillRect(bx + 10, by + 10, 18, 12);

  /* 灶台 */
  const sx = ROOM_OX + STOVE.x * 32, sy = ROOM_OY + STOVE.y * 32;
  g.fillStyle = '#6e6e66'; g.fillRect(sx + 4, sy + 8, 56, 22);
  g.fillStyle = '#4a4a4a'; g.fillRect(sx + 8, sy + 4, 48, 6);
  g.fillStyle = '#3a3a42'; g.fillRect(sx + 20, sy + 0, 24, 6);
  g.fillStyle = '#e07a2a'; g.fillRect(sx + 28, sy + 14, 8, 5);

  /* 桌子 */
  const tx2 = ROOM_OX + TABLE.x * 32, ty2 = ROOM_OY + TABLE.y * 32;
  g.fillStyle = '#6a4a2a'; g.fillRect(tx2 + 2, ty2 + 10, 60, 18);
  g.fillStyle = '#8a6238'; g.fillRect(tx2 + 4, ty2 + 8, 56, 4);

  /* 门 */
  const dx = ROOM_OX + DOOR.x * 32, dy = ROOM_OY + DOOR.y * 32;
  g.fillStyle = '#3a2a1a'; g.fillRect(dx + 4, dy - 4, 24, 32);
  g.fillStyle = '#6a4a2a'; g.fillRect(dx + 7, dy - 1, 18, 26);
  g.fillStyle = '#c8a050'; g.fillRect(dx + 21, dy + 12, 3, 3);

  /* 室内家具 */
  if (typeof roomState !== 'undefined' && roomState.furn) {
    for (const f of roomState.furn) {
      const def = INTERIOR_MAP[f.id];
      if (!def) continue;
      const fx = ROOM_OX + f.tx * 32, fy = ROOM_OY + f.ty * 32;
      g.save();
      g.imageSmoothingEnabled = false;
      g.translate(fx - 4, fy - 8);
      drawFurnitureIcon(g, def, (typeof animTime !== 'undefined' ? animTime : 0) * 0.2);
      g.restore();
    }
  }

  /* 室内装修预览 */
  if (window.indoorDecor && typeof mouse !== 'undefined' && mouse.inside && typeof decorItem === 'function') {
    const d = decorItem();
    const src = d && typeof itemIconCanvas === 'function' ? itemIconCanvas(d.id) : null;
    if (d && src) {
      const t = farmhouseTileAt(mouse.x, mouse.y);
      if (t.tx >= 0 && t.ty >= 0 && t.tx < ROOM_W && t.ty < ROOM_H) {
        const fx = ROOM_OX + t.tx * 32, fy = ROOM_OY + t.ty * 32;
        g.save();
        g.globalAlpha = 0.65;
        g.drawImage(src, Math.round(fx - 4), Math.round(fy - 8), 40, 40);
        g.globalAlpha = 1;
        g.strokeStyle = indoorTileFree(t.tx, t.ty) ? 'rgba(120,255,150,0.95)' : 'rgba(255,110,100,0.95)';
        g.lineWidth = 2;
        g.strokeRect(fx + 1, fy + 1, 30, 30);
        g.restore();
      }
    }
  }

  /* 玩家 */
  const fit = (typeof playerOutfitOpts === 'function') ? playerOutfitOpts() : null;
  const action = player.moving ? 'walk' : 'idle';
  const phase = (typeof animTime !== 'undefined' ? animTime : 0) * 2;
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(Math.round(ROOM_OX + player.x - 16), Math.round(ROOM_OY + player.y - 36));
  drawFarmer(g, action, player.dir, phase, fit ? { noHat: fit.noHat, outfit: fit.outfit } : undefined);
  if (fit && fit.hat && HAT_MAP[fit.hat]) drawHatOnFarmer(g, HAT_MAP[fit.hat], player.dir, phase);
  g.restore();

  /* 提示 */
  g.fillStyle = 'rgba(10,12,16,.86)';
  g.fillRect(0, CONFIG.VIEW_H - 46, CONFIG.VIEW_W, 46);
  g.fillStyle = '#e9c96f';
  g.font = '13px "Microsoft YaHei", monospace';
  g.textBaseline = 'middle';
  g.fillText('农舍 · WASD 移动 · E 睡觉 / 看家具 · 门口 E 或 Esc 出去', 16, CONFIG.VIEW_H - 23);
}

Object.assign(window, {
  farmhouseActive, enterFarmhouse, exitFarmhouse, updateFarmhouse,
  drawFarmhouse, farmhouseInteract, farmhouseSavePos, farmhouseForceExit,
  farmhouseTileAt, indoorTileFree, toggleIndoorDecor,
  farmhouseIndoorPlace, farmhouseIndoorRemove
});
export {
  enterFarmhouse, exitFarmhouse, updateFarmhouse,
  drawFarmhouse, farmhouseInteract, farmhouseSavePos, farmhouseForceExit,
  farmhouseTileAt, indoorTileFree, toggleIndoorDecor,
  farmhouseIndoorPlace, farmhouseIndoorRemove
};
