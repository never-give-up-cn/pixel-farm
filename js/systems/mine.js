/* js/systems/mine.js — 矿井模式：把 anim 层的农夫 / 怪物 / 矿石接进游戏本体。
 * 按 J 进入，WASD / 方向键移动，空格攻击，走到梯子下一层，Esc 返回农场。
 * 只会接管更新与渲染，不改动农场地图、存档和主循环的其它系统。 */

'use strict';

import { drawFarmer } from '../anim/farmer.js';
import { MONSTERS, MONSTER_MAP, drawMonster } from '../anim/monsters.js';
import { RES_MAP, drawResourceIcon } from '../anim/resources.js';
import { DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP, mulberry32, ellipse, R } from '../anim/pixel.js';

const TILE = 40;
const COLS = 20;
const ROWS = 10;
const OX = 80;
const OY = 64;
const BAR = 46;

const DIRS = [
  { dx: 0, dy: 1, dir: DIR_DOWN },
  { dx: -1, dy: 0, dir: DIR_LEFT },
  { dx: 1, dy: 0, dir: DIR_RIGHT },
  { dx: 0, dy: -1, dir: DIR_UP }
];

/* 矿井分层主题：B1–B39 岩石层、B40–B79 冰霜层、B80+ 熔岩层。
 * 每层有独立的背景 / 岩壁 / 地面配色与矿石池，深层更容易出稀有矿。 */
const MINE_THEMES = [
  {
    id: 'stone', name: '岩石层', from: 1, accent: '#e9c96f',
    bg0: '#151920', bg1: '#0d1015', ceil1: '#1d222a', ceil2: '#232830',
    wall: '#2a2d35', wallIn: '#343842', wallHi: '#40444e', wallLo: '#22252c',
    floorA: '#3a3830', floorB: '#413e34', speck: '#4a463a', speck2: '#2e2c26',
    rockShadow: '#5a5a50', rockBody: '#7a7a6a', rockHi: '#9a9a88', oreRock: '#6a6a5a',
    ores: ['copper_ore', 'iron_ore', 'gold_ore', 'coal', 'quartz', 'earth_crystal']
  },
  {
    id: 'ice', name: '冰霜层', from: 40, accent: '#9ad8f0',
    bg0: '#101a24', bg1: '#0a1119', ceil1: '#182430', ceil2: '#1d2c3a',
    wall: '#22303e', wallIn: '#2c3e50', wallHi: '#3a5064', wallLo: '#1a2530',
    floorA: '#2c3a44', floorB: '#33434e', speck: '#3e5260', speck2: '#22303a',
    rockShadow: '#46606e', rockBody: '#6a8a9a', rockHi: '#a8ccd8', oreRock: '#5a7a8a',
    ores: ['frozen_tear', 'iron_ore', 'gold_ore', 'coal', 'quartz']
  },
  {
    id: 'lava', name: '熔岩层', from: 80, accent: '#ff9a5a',
    bg0: '#241110', bg1: '#150808', ceil1: '#2a1512', ceil2: '#331a16',
    wall: '#3a1c18', wallIn: '#4a2620', wallHi: '#5e332a', wallLo: '#2a120f',
    floorA: '#3a2420', floorB: '#432a24', speck: '#5a3028', speck2: '#301a16',
    rockShadow: '#5a2e24', rockBody: '#7a4434', rockHi: '#b06a4a', oreRock: '#6a3a2c',
    ores: ['fire_quartz', 'gold_ore', 'earth_crystal', 'coal', 'copper_ore']
  }
];

export function mineTheme(depth) {
  const d = Math.max(1, depth | 0);
  let theme = MINE_THEMES[0];
  for (const t of MINE_THEMES) if (d >= t.from) theme = t;
  return theme;
}

const MINE_MONSTERS = MONSTERS.filter(m => m.loc === 'mine' || m.loc === 'skull');
const SKULL_MONSTERS = MONSTERS.filter(m => m.loc === 'skull');

/* 怪物走路速度（像素 / 秒）：和 NPC 一样按格目标平滑插值，而不是瞬间跳格 */
const MONSTER_SPEED = {
  slime: 30, bigslime: 24, bat: 62, bug: 34, fly: 64, grub: 24, crab: 30,
  ghost: 46, skeleton: 42, shadow: 54, mummy: 26, serpent: 74, rex: 46,
  skull: 68, squid: 42, golem: 38, sentry: 34, duggy: 32, sprite: 58,
  spiker: 0, spider: 58, stick: 46, metalhead: 26
};

/* 远程怪：保持距离、有视线就放弹幕。
 * range 射程、keep 想维持的距离、cd 冷却、speed 弹速、kind 弹种外观 */
const RANGED = {
  squid_kid:     { range: 240, keep: 120, cd: 2.3, speed: 130, cast: 0.55, color: '#f0b0ff', kind: 'orb' },
  blue_squid:    { range: 280, keep: 140, cd: 2.0, speed: 150, cast: 0.5,  color: '#a0d0f0', kind: 'orb' },
  shadow_shaman: { range: 300, keep: 140, cd: 2.6, speed: 145, cast: 0.6,  color: '#c080e0', kind: 'orb' },
  shadow_sniper: { range: 360, keep: 170, cd: 2.4, speed: 245, cast: 0.45, color: '#e0a040', kind: 'arrow' },
  haunted_skull: { range: 260, keep: 110, cd: 2.8, speed: 120, cast: 0.65, color: '#d04a3a', kind: 'skull' },
  skeleton_mage: { range: 300, keep: 140, cd: 2.4, speed: 135, cast: 0.6,  color: '#b0a0f0', kind: 'orb' }
};

/* 飞行怪物：蝙蝠 / 苍蝇 / 幽灵 / 蛇 / 闹鬼骷髅 等。
 * 出现时可以直接飞过岩石和矿石，不再被地面障碍挡住。
 * FLYING_CHANCE 是“这一层是否出现飞行怪”的概率，出现时会有 1–2 只。 */
const FLYING_SHAPES = new Set(['bat', 'fly', 'ghost', 'serpent', 'skull', 'sprite']);
const FLYING_CHANCE = 0.5;

window.mineActive = false;

const mine = {
  active: false,
  mode: 'normal',
  depth: 1,
  best: 1,
  hp: 100,
  maxHp: 100,
  ore: 0,
  keys: new Set(),
  time: 0,
  player: {
    tx: 1, ty: 5, px: 0, py: 0,
    dir: DIR_RIGHT, moving: false,
    targetX: 0, targetY: 0,
    attack: 0, attackDone: false, hurt: 0
  },
  monsters: [],
  dying: [],
  projectiles: [],
  floats: [],
  shake: 0,
  map: [],
  rocks: new Map(),
  ores: new Map(),
  ladder: { x: COLS - 2, y: 5 },
  chest: null,
  claimed: new Set(),
  sparkles: [],
  down: 0,
  floorMsg: 0
};

function gameCtx() {
  const c = document.getElementById('game');
  return c ? c.getContext('2d') : null;
}

function keyOf(x, y) { return `${x},${y}`; }

/* ---------- 生成房间 ---------- */

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return 'wall';
  return mine.map[y][x];
}

function setTile(x, y, t) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  mine.map[y][x] = t;
}

function tileCenter(x, y) {
  return { x: OX + x * TILE + TILE / 2, y: OY + y * TILE + TILE / 2 };
}

function generate(depth) {
  const rnd = mulberry32(7200 + depth * 197);
  const theme = (mine.mode === 'skull') ? MINE_THEMES[2] : mineTheme(depth);
  mine.depth = depth;
  mine.best = Math.max(mine.best, depth);
  mine.themeId = theme.id;
  mine.rocks.clear();
  mine.ores.clear();
  mine.monsters = [];
  mine.dying = [];
  mine.map = [];
  mine.sparkles = [];
  mine.projectiles = [];
  mine.floats = [];
  mine.shake = 0;
  mine.floorMsg = 1.4;

  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      row.push(x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 ? 'wall' : 'floor');
    }
    mine.map.push(row);
  }

  let placed = 0;
  let guard = 0;
  while (placed < 46 && guard++ < 600) {
    const x = 1 + Math.floor(rnd() * (COLS - 2));
    const y = 1 + Math.floor(rnd() * (ROWS - 2));
    if (x === 1 && y === 5) continue;
    if (x === COLS - 2 && y === 5) continue;
    if (tileAt(x, y) !== 'floor') continue;
    if (rnd() < 0.3) {
      setTile(x, y, 'ore');
      mine.ores.set(keyOf(x, y), theme.ores[Math.floor(rnd() * theme.ores.length)]);
    } else {
      setTile(x, y, 'rock');
      mine.rocks.set(keyOf(x, y), 1);
    }
    placed++;
  }

  mine.ladder = { x: COLS - 2, y: 5 };
  setTile(mine.ladder.x, mine.ladder.y, 'ladder');

  /* 每 5 层：首次到达时放一个矿工宝箱 */
  mine.chest = null;
  const chestStep = Math.max(1, CONFIG.MINE.CHEST_STEP | 0);
  if (depth % chestStep === 0 && !mine.claimed.has(depth)) {
    const cx = COLS - 4;
    const cy = ROWS - 3;
    setTile(cx, cy, 'chest');
    mine.rocks.delete(keyOf(cx, cy));
    mine.ores.delete(keyOf(cx, cy));
    /* 清掉宝箱四邻的矿石 / 岩石，避免随机生成把宝箱围死 */
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      const t = tileAt(nx, ny);
      if (t === 'rock' || t === 'ore') {
        setTile(nx, ny, 'floor');
        mine.rocks.delete(keyOf(nx, ny));
        mine.ores.delete(keyOf(nx, ny));
      }
    }
    mine.chest = { x: cx, y: cy };
  }

  /* 挖通所有被随机岩石封死的区域，保证出生点 ↔ 梯子 ↔ 怪物都连通 */
  ensureMineConnected(1, 5);

  const p = tileCenter(1, 5);
  mine.player.tx = 1;
  mine.player.ty = 5;
  mine.player.px = p.x;
  mine.player.py = p.y;
  mine.player.targetX = p.x;
  mine.player.targetY = p.y;
  mine.player.moving = false;
  mine.player.attack = 0;
  mine.player.attackDone = false;
  mine.player.hurt = 0;
  mine.player.dir = DIR_RIGHT;

  let count = 0;
  guard = 0;
  const pool = (mine.mode === 'skull' && SKULL_MONSTERS.length) ? SKULL_MONSTERS : MINE_MONSTERS;
  const flyPool = pool.filter(d => FLYING_SHAPES.has((MONSTER_MAP[d.id] || {}).shape));
  const groundPool = pool.filter(d => !FLYING_SHAPES.has((MONSTER_MAP[d.id] || {}).shape));
  /* 一层里要么没有飞行怪，要么来 1–2 只，不会整层都是蝙蝠 */
  const flyersThisFloor = (flyPool.length && groundPool.length && rnd() < FLYING_CHANCE)
    ? (1 + (rnd() < 0.5 ? 1 : 0)) : 0;
  while (count < 5 && guard++ < 300) {
    const x = 4 + Math.floor(rnd() * (COLS - 6));
    const y = 1 + Math.floor(rnd() * (ROWS - 2));
    if (tileAt(x, y) !== 'floor') continue;
    if (Math.abs(x - 1) + Math.abs(y - 5) < 4) continue;
    const usePool = (count < flyersThisFloor)
      ? flyPool
      : (groundPool.length ? groundPool : pool);
    const def = usePool[Math.floor(rnd() * usePool.length)];
    const meta = MONSTER_MAP[def.id] || {};
    const shape = meta.shape || 'slime';
    const fly = FLYING_SHAPES.has(shape);
    const ranged = RANGED[def.id] || null;
    const scale = mine.mode === 'skull' ? 1.45 : 1;
    const hp = Math.max(6, Math.round((def.hp / 7 + depth * 1.4) * scale));
    const c = tileCenter(x, y);
    mine.monsters.push({
      type: def.id, shape, fly, ranged,
      speed: ranged ? (ranged.speed * 0.26 + 12) : (MONSTER_SPEED[shape] || 34),
      tx: x, ty: y, px: c.x, py: c.y,
      dir: DIR_DOWN, moving: false, animT: rnd() * 6.28,
      hp, maxHp: hp, dmg: Math.max(1, Math.round((def.dmg / 3 + depth * 0.2) * scale)),
      cooldown: 0.8 + rnd() * 1.4, shotCd: 1.2 + rnd() * 1.6, think: rnd() * 0.5,
      attack: 0, attackDur: ranged ? ranged.cast : 0.42, attackHit: false,
      lungeX: 0, lungeY: 0,
      phase: rnd() * 6.28, hurt: 0
    });
    count++;
  }
}

/* ---------- 输入 ---------- */

const dirKeys = {
  ArrowDown: DIR_DOWN, KeyS: DIR_DOWN,
  ArrowLeft: DIR_LEFT, KeyA: DIR_LEFT,
  ArrowRight: DIR_RIGHT, KeyD: DIR_RIGHT,
  ArrowUp: DIR_UP, KeyW: DIR_UP
};

window.addEventListener('keydown', e => {
  if (!window.mineActive) return;
  if (e.code in dirKeys) mine.keys.add(e.code);
});
window.addEventListener('keyup', e => {
  mine.keys.delete(e.code);
});

function tryMove(dir) {
  const p = mine.player;
  p.dir = dir;
  if (p.moving || p.attack > 0 || mine.down > 0) return;
  const d = DIRS.find(v => v.dir === dir);
  if (!d) return;
  const nx = p.tx + d.dx;
  const ny = p.ty + d.dy;
  const t = tileAt(nx, ny);
  if (t === 'wall' || t === 'rock' || t === 'ore') return;
  /* 怪物所在的格 / 正在走向的格都不能踩进去 */
  if (mine.monsters.some(m => {
    if (m.tx === nx && m.ty === ny) return true;
    return Math.floor((m.px - OX) / TILE) === nx && Math.floor((m.py - OY) / TILE) === ny;
  })) return;
  p.tx = nx;
  p.ty = ny;
  const c = tileCenter(nx, ny);
  p.targetX = c.x;
  p.targetY = c.y;
  p.moving = true;
}

function facingTile() {
  const p = mine.player;
  const d = DIRS.find(v => v.dir === p.dir) || DIRS[0];
  return { x: p.tx + d.dx, y: p.ty + d.dy };
}

function dropItem(id, n) {
  if (typeof addItem === 'function') addItem(id, n);
}

function burst(tx, ty, color, n) {
  const c = tileCenter(tx, ty);
  burstAt(c.x, c.y, color, n);
}
/* 像素坐标版本：弹幕命中 / 飘字用 */
function burstAt(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 24 + Math.random() * 70;
    mine.sparkles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 18,
      life: 0.38, color
    });
  }
}

/* 矿工宝箱：首次到达 5 的倍数层生成，走上去领取 */
function mineChestLoot(depth) {
  const gold = 100 + depth * 30;
  let item = 'quartz', n = 2;
  if (depth >= 30) { item = 'diamond'; n = 1; }
  else if (depth >= 20) { item = 'ruby'; n = 1; }
  else if (depth >= 15) { item = 'topaz'; n = 2; }
  else if (depth >= 10) { item = 'amethyst'; n = 2; }
  return { gold, item, n };
}

function openMineChest() {
  const c = mine.chest;
  if (!c) return false;
  const depth = mine.depth;
  const loot = mineChestLoot(depth);
  mine.claimed.add(depth);
  setTile(c.x, c.y, 'floor');
  mine.chest = null;
  if (typeof changeGold === 'function') changeGold(loot.gold);
  dropItem(loot.item, loot.n);
  const d = (typeof itemDef === 'function') ? itemDef(loot.item) : null;
  burst(c.x, c.y, '#ffd76a', 18);
  if (typeof toast === 'function') {
    toast('矿工宝箱：+' + loot.gold + ' 金币、' + (d ? d.name : loot.item) + ' ×' + loot.n);
  }
  if (typeof playSfx === 'function') playSfx(880, 'triangle', 0.12, 0.55);
  return true;
}

/* ---------- 对外：进出 / 攻击 ---------- */

export function enterMine(startDepth, mode) {
  if (window.mineActive) return;
  const isSkull = mode === 'skull';
  let depth = 1;
  if (!isSkull && typeof startDepth === 'number' && startDepth > 1) {
    /* 电梯只能去到已经解锁的楼层 */
    depth = Math.min(startDepth | 0, Math.max(1, mine.best | 0));
  }
  window.mineActive = true;
  mine.active = true;
  mine.mode = isSkull ? 'skull' : 'normal';
  mine.hp = 100 + (typeof skillMineHpBonus === 'function' ? skillMineHpBonus() : 0);
  mine.maxHp = mine.hp;
  mine.ore = 0;
  mine.down = 0;
  mine.keys.clear();
  mine.time = 0;
  generate(depth);
  const theme = mineTheme(depth);
  if (typeof toast === 'function') toast(isSkull
    ? `进入骷髅洞穴 B${depth} · 更强的怪物 / 更好的掉落 · Esc 返回`
    : `进入矿井 B${depth} · ${theme.name} · WASD 移动 / 空格攻击 / Esc 返回地面`);
  if (typeof playSfx === 'function') playSfx(300, 'square', 0.09, 0.5);
  if (typeof dlog === 'function') dlog(`[mine] 进入矿井 B${depth}`);
}

/* 电梯已解锁的楼层：B5、B10、B15……（按最深层向下取整） */
export function mineElevatorFloors() {
  const step = Math.max(1, CONFIG.MINE.ELEVATOR_STEP | 0);
  const out = [];
  for (let f = step; f <= mine.best; f += step) out.push(f);
  return out;
}

/* 矿井最深纪录：存档用 */
export function mineSave() {
  return Math.max(1, mine.best | 0);
}
export function mineLoad(v) {
  mine.best = Math.max(1, (typeof v === 'number' ? v : 1) | 0);
}
export function mineClaimedSerialize() {
  return Array.from(mine.claimed).filter(n => n > 0).sort((a, b) => a - b);
}
export function mineClaimedDeserialize(a) {
  mine.claimed = new Set(
    (Array.isArray(a) ? a : [])
      .map(n => n | 0)
      .filter(n => n > 0)
  );
}
export function mineReset() {
  mine.best = 1;
  mine.depth = 1;
  mine.mode = 'normal';
  mine.chest = null;
  mine.claimed.clear();
  if (window.mineActive) exitMine();
}

export function exitMine() {
  if (!window.mineActive) return;
  window.mineActive = false;
  mine.active = false;
  mine.keys.clear();
  if (typeof toast === 'function') toast(`回到地面 · 最深 B${mine.best} · 矿石 ${mine.ore}`);
  if (typeof playSfx === 'function') playSfx(420, 'sine', 0.08, 0.45);
}

export function toggleMine() {
  if (window.mineActive) exitMine();
  else enterMine();
}

export function mineAttack() {
  if (!window.mineActive) return;
  const p = mine.player;
  if (p.moving || p.attack > 0 || mine.down > 0) return;
  p.attack = 0.001;
  p.attackDone = false;
}

/* 炸弹：清理周围岩石 / 矿石并伤害怪物（按 Q） */
export function mineUseBomb() {
  if (!window.mineActive || mine.down > 0) return false;
  if (typeof countItem !== 'function' || countItem('bomb') <= 0) {
    if (typeof toast === 'function') toast('背包里没有炸弹（杂货店有卖）');
    return false;
  }
  if (typeof removeItem === 'function') removeItem('bomb', 1);
  const p = mine.player;
  let cleared = 0, hurtMon = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.hypot(dx, dy) > 2.5) continue;
      const x = p.tx + dx, y = p.ty + dy;
      const t = tileAt(x, y);
      if (t === 'rock') {
        setTile(x, y, 'floor');
        mine.rocks.delete(keyOf(x, y));
        if (typeof dropItem === 'function') dropItem('stone', 1);
        cleared++;
      } else if (t === 'ore') {
        const id = mine.ores.get(keyOf(x, y));
        setTile(x, y, 'floor');
        mine.ores.delete(keyOf(x, y));
        mine.ore++;
        if (typeof addItem === 'function' && id) addItem(id, 1);
        cleared++;
      }
    }
  }
  for (const m of mine.monsters) {
    if (Math.hypot(m.tx - p.tx, m.ty - p.ty) > 2.5) continue;
    m.hp -= 45;
    m.hurt = 0.22;
    m.attack = 0;
    m.attackHit = false;
    hurtMon++;
  }
  const dead = mine.monsters.filter(m => m.hp <= 0);
  for (const mon of dead) {
    mine.monsters = mine.monsters.filter(m => m !== mon);
    mine.dying.push({ ...mon, timer: 0.5 });
    mine.ore += 2;
    if (typeof skillAdd === 'function') skillAdd('combat', 12);
    if (typeof dropItem === 'function') dropItem('stone', 1);
  }
  burst(p.tx, p.ty, '#ff9040', 26);
  if (typeof playSfx === 'function') playSfx(90, 'sawtooth', 0.22, 0.7);
  if (typeof toast === 'function') toast('💣 炸弹！清理 ' + cleared + ' 处矿岩，炸伤 ' + hurtMon + ' 只怪物');
  return true;
}

/* 楼梯：消耗一个，直接下一层（按 R） */
export function mineUseStair() {
  if (!window.mineActive || mine.down > 0) return false;
  if (typeof countItem !== 'function' || countItem('stair') <= 0) {
    if (typeof toast === 'function') toast('背包里没有楼梯（杂货店有卖）');
    return false;
  }
  if (typeof removeItem === 'function') removeItem('stair', 1);
  mine.hp = Math.min(mine.maxHp, mine.hp + 12);
  generate(mine.depth + 1);
  if (typeof toast === 'function') toast('🪜 使用楼梯，下到 B' + mine.depth);
  if (typeof playSfx === 'function') playSfx(520, 'triangle', 0.10, 0.5);
  return true;
}

function weaponDamage() {
  if (typeof selectedSlot === 'function' && typeof itemDef === 'function') {
    const s = selectedSlot();
    const d = s ? itemDef(s.id) : null;
    if (d && d.kind === 'weapon') {
      const m = String(d.dmg || '').match(/(\d+)\s*-\s*(\d+)/);
      let lo = 4, hi = 8;
      if (m) { lo = parseInt(m[1], 10); hi = parseInt(m[2], 10); }
      let dmg = lo + Math.floor(Math.random() * (hi - lo + 1));
      const crit = parseFloat(d.crit) || 0;
      if (Math.random() < crit) dmg = Math.round(dmg * 1.8);
      if (typeof skillCombatDamageMult === 'function') dmg = Math.max(1, Math.round(dmg * skillCombatDamageMult()));
      if (typeof foodBuffAttackMult === 'function') dmg = Math.max(1, Math.round(dmg * foodBuffAttackMult()));
      if (typeof equipAttackPct === 'function') dmg = Math.max(1, Math.round(dmg * (1 + equipAttackPct() / 100)));
      dmg += (typeof equipAttackBonus === 'function' ? equipAttackBonus() : 0);
      return dmg;
    }
  }
  let base = 8 + Math.floor(Math.random() * 6);
  if (typeof skillCombatDamageMult === 'function') base = Math.max(1, Math.round(base * skillCombatDamageMult()));
  if (typeof foodBuffAttackMult === 'function') base = Math.max(1, Math.round(base * foodBuffAttackMult()));
  if (typeof equipAttackPct === 'function') base = Math.max(1, Math.round(base * (1 + equipAttackPct() / 100)));
  base += (typeof equipAttackBonus === 'function' ? equipAttackBonus() : 0);
  return base;
}

function dropEquipment(mon) {
  if (typeof spawnDrop !== 'function' || Math.random() >= 0.12) return;
  const pool = Object.keys(CONFIG.ITEMS).filter(id => {
    const k = CONFIG.ITEMS[id].kind;
    return k === 'weapon' || k === 'ring' || k === 'boots';
  });
  if (!pool.length) return;
  spawnDrop(pool[Math.floor(Math.random() * pool.length)], 1, mon.px, mon.py, 60);
}

function resolveAttack() {
  const p = mine.player;
  const t = facingTile();
  const k = keyOf(t.x, t.y);
  const tile = tileAt(t.x, t.y);

  /* 飞行怪可能悬在岩石上方，先判怪物再判矿岩 */
  const mon = mine.monsters.find(m => m.tx === t.x && m.ty === t.y);
  if (mon) {
    const dmg = weaponDamage();
    mon.hp -= dmg;
    mon.hurt = 0.22;
    mon.attack = 0;                 /* 被打断抬手 */
    mon.attackHit = false;
    mine.floats.push({ x: mon.px, y: mon.py - 44, text: '-' + dmg, color: '#ffe08a', life: 0.8 });
    mine.shake = Math.max(mine.shake, 0.07);
    burst(t.x, t.y, '#ff8060', 10);
    playSfx(220, 'square', 0.05, 0.5);
    if (mon.hp <= 0) {
      mine.monsters = mine.monsters.filter(m => m !== mon);
      mine.dying.push({ ...mon, timer: 0.5 });
      const mi = MONSTERS.findIndex(m => m.id === mon.type);
      if (mi >= 0 && typeof dexUnlock === 'function') dexUnlock('monster', mi);
      mine.ore += 2;
      if (typeof skillAdd === 'function') skillAdd('combat', 12);
      burst(t.x, t.y, '#ffe060', 16);
      dropItem('stone', 1);
      if (Math.random() < 0.4) dropItem('charcoal', 1);
      if (typeof addGold === 'function') addGold(3 + Math.floor(Math.random() * 6));
      dropEquipment(mon);
      playSfx(880, 'triangle', 0.09, 0.5);
    }
    return;
  }

  if (tile === 'rock') {
    setTile(t.x, t.y, 'floor');
    mine.rocks.delete(k);
    burst(t.x, t.y, '#b8b0a0', 8);
    if (typeof skillAdd === 'function') skillAdd('mining', 4);
    playSfx(150, 'square', 0.05, 0.4);
    return;
  }

  if (tile === 'ore') {
    const id = mine.ores.get(k);
    setTile(t.x, t.y, 'floor');
    mine.ores.delete(k);
    mine.ore += 1 + (typeof skillOreBonus === 'function' ? skillOreBonus() : 0) +
      (typeof foodBuffMiningChance === 'function' && Math.random() < foodBuffMiningChance() ? 1 : 0) +
      (typeof equipMiningChance === 'function' && Math.random() < equipMiningChance() ? 1 : 0);
    burst(t.x, t.y, '#e0c060', 10);
    if (typeof skillAdd === 'function') skillAdd('mining', 8);
    dropItem('stone', 2 + (typeof skillExtraStone === 'function' ? skillExtraStone() : 0));
    if (id === 'coal' || Math.random() < 0.35) dropItem('charcoal', 1);
    playSfx(700, 'square', 0.06, 0.5);
    return;
  }

  burst(t.x, t.y, '#d8e0e8', 4);
}

/* ---------- 怪物移动 / 攻击辅助 ---------- */

/* 怪物能站的格子：地面 / 梯子，不能压住玩家或另一只怪的目标格 */
function monsterCanStand(m, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  const t = tileAt(x, y);
  if (m.fly) {
    if (t === 'wall') return false;          /* 飞行怪能过岩石 / 矿石，但不能穿出房间外墙 */
  } else if (t !== 'floor' && t !== 'ladder') return false;
  const p = mine.player;
  if (x === p.tx && y === p.ty) return false;
  return !mine.monsters.some(o => o !== m && o.tx === x && o.ty === y);
}

/* 以玩家格为起点做一次 BFS，得到每格到玩家的步数。
 * 怪物按这个距离场选下一格，就会像 NPC 的 A* 一样绕开岩石 / 墙，而不是一头撞在障碍上。
 * air=true 用于飞行怪：除了外墙，岩石 / 矿石 / 宝箱都当作可通过。 */
function buildMineDistField(sx, sy, air) {
  const field = new Int16Array(COLS * ROWS).fill(-1);
  if (sx < 0 || sy < 0 || sx >= COLS || sy >= ROWS) return field;
  const q = [sy * COLS + sx];
  field[sy * COLS + sx] = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    const cx = cur % COLS, cy = (cur / COLS) | 0;
    const nd = field[cur] + 1;
    for (const d of DIRS) {
      const nx = cx + d.dx, ny = cy + d.dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const t = tileAt(nx, ny);
      if (air) { if (t === 'wall') continue; }
      else if (t !== 'floor' && t !== 'ladder' && t !== 'chest') continue;
      const ni = ny * COLS + nx;
      if (field[ni] !== -1) continue;
      field[ni] = nd;
      q.push(ni);
    }
  }
  return field;
}

/* 随机岩石可能把出生点周围的区域封死（玩家出不去，怪物也过不来）。
 * 这里从出生点作 BFS，遇到不可达的地板就朝出生点挖一条直线，清掉挡路的岩石 / 矿石。 */
function ensureMineConnected(sx, sy) {
  for (let pass = 0; pass < 40; pass++) {
    const field = buildMineDistField(sx, sy);
    let target = null;
    for (let y = 1; y < ROWS - 1 && !target; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const t = tileAt(x, y);
        if (t !== 'floor' && t !== 'ladder') continue;
        if (field[y * COLS + x] < 0) { target = { x, y }; break; }
      }
    }
    if (!target) return;
    let x = target.x, y = target.y;
    const clear = (cx, cy) => {
      const t = tileAt(cx, cy);
      if (t === 'rock' || t === 'ore') {
        setTile(cx, cy, 'floor');
        mine.rocks.delete(keyOf(cx, cy));
        mine.ores.delete(keyOf(cx, cy));
      }
    };
    while (x !== sx) { x += Math.sign(sx - x); clear(x, y); }
    while (y !== sy) { y += Math.sign(sy - y); clear(x, y); }
  }
}

/* 选下一格；远程怪会保持距离（太近后撤、太远靠近、刚好就站定放弹） */
function monsterStartStep(m, distNow, field) {
  const p = mine.player;
  const opts = [];
  for (const d of DIRS) {
    const nx = m.tx + d.dx, ny = m.ty + d.dy;
    if (!monsterCanStand(m, nx, ny)) continue;
    const c = tileCenter(nx, ny);
    opts.push({
      nx, ny,
      path: field ? field[ny * COLS + nx] : -1,
      dist: Math.hypot(c.x - p.px, c.y - p.py)
    });
  }
  if (!opts.length) return false;
  const reach = opts.filter(o => o.path >= 0);
  const use = reach.length ? reach : opts;
  const nearest = use.reduce((a, b) => {
    if (b.path < 0) return a;
    if (a.path < 0 || b.path < a.path) return b;
    return a;
  });
  const farthest = use.reduce((a, b) => (b.path > a.path ? b : a));
  const here = field ? field[m.ty * COLS + m.tx] : -1;
  let pick = nearest;
  if (!m.ranged) {
    /* 已经在离玩家最近的格子上就别再走开（否则会贴脸又后退来回抖） */
    if (here >= 0 && nearest.path >= here) return false;
  } else {
    if (distNow < m.ranged.keep * 0.8) pick = farthest;
    else if (distNow > m.ranged.range * 0.9) pick = nearest;
    else if (Math.random() < 0.3) {
      const mid = use.filter(o => Math.abs(o.dist - distNow) < TILE * 1.1);
      pick = (mid.length ? mid : use)[Math.floor(Math.random() * (mid.length || use.length))];
    } else return false;
  }
  m.tx = pick.nx;
  m.ty = pick.ny;
  m.moving = true;
  return true;
}

/* 视线：中间不能隔墙 / 岩石 / 矿石 / 宝箱 */
function monsterHasLOS(m) {
  const p = mine.player;
  const dx = p.px - m.px, dy = p.py - m.py;
  const d = Math.hypot(dx, dy);
  if (d < 1) return true;
  const steps = Math.max(1, Math.ceil(d / (TILE * 0.4)));
  for (let i = 1; i < steps; i++) {
    const x = m.px + dx * i / steps;
    const y = m.py + dy * i / steps;
    const t = tileAt(Math.floor((x - OX) / TILE), Math.floor((y - OY) / TILE));
    if (t === 'wall' || t === 'rock' || t === 'ore' || t === 'chest') return false;
  }
  return true;
}

/* 远程弹幕 */
function fireProjectile(m) {
  const p = mine.player;
  const ox = m.px, oy = m.py - 8;
  let dx = p.px - ox, dy = (p.py - 8) - oy;
  const d = Math.hypot(dx, dy) || 1;
  dx /= d; dy /= d;
  const spread = (Math.random() - 0.5) * 0.10;
  const cs = Math.cos(spread), sn = Math.sin(spread);
  const vx = dx * cs - dy * sn, vy = dx * sn + dy * cs;
  const rd = m.ranged || RANGED.shadow_shaman;
  mine.projectiles.push({
    x: ox, y: oy,
    vx: vx * rd.speed, vy: vy * rd.speed,
    dmg: m.dmg, color: rd.color, kind: rd.kind,
    life: 2.6, spin: 0, trail: []
  });
  burstAt(ox, oy, rd.color, 5);
  if (typeof playSfx === 'function') playSfx(520, 'triangle', 0.06, 0.35);
}

/* 玩家受伤（近战 / 弹幕共用） */
function hurtPlayer(raw, fromMon) {
  if (mine.down > 0) return;
  const p = mine.player;
  const taken = Math.max(1, Math.max(1, Math.round(raw *
    (typeof skillDamageTakenMult === 'function' ? skillDamageTakenMult() : 1) *
    (typeof foodBuffDamageTakenMult === 'function' ? foodBuffDamageTakenMult() : 1))) -
    (typeof equipDefenseBonus === 'function' ? equipDefenseBonus() : 0) -
    (typeof equipImmunityBonus === 'function' ? equipImmunityBonus() : 0));
  mine.hp -= taken;
  p.hurt = 0.2;
  mine.shake = 0.2;
  mine.floats.push({ x: p.px, y: p.py - 46, text: '-' + taken, color: '#ff7070', life: 0.9 });
  burstAt(p.px, p.py - 10, '#ff6070', 6);
  if (typeof playSfx === 'function') playSfx(160, 'sawtooth', 0.08, 0.4);
  if (mine.hp <= 0) {
    mine.hp = 0;
    mine.down = 1.6;
    mine.projectiles = [];
    if (typeof toast === 'function') toast('你倒下了…被送回农场');
  }
}

/* ---------- 更新 ---------- */

export function updateMine(dt) {
  if (!window.mineActive) return;
  mine.time += dt;
  const p = mine.player;

  if (mine.down > 0) {
    mine.down -= dt;
    if (mine.down <= 0) {
      mine.hp = Math.max(30, Math.round(mine.maxHp * 0.5));
      exitMine();
    }
    return;
  }

  if (!p.moving && p.attack <= 0) {
    let dir = null;
    if (mine.keys.has('ArrowUp') || mine.keys.has('KeyW')) dir = DIR_UP;
    else if (mine.keys.has('ArrowDown') || mine.keys.has('KeyS')) dir = DIR_DOWN;
    else if (mine.keys.has('ArrowLeft') || mine.keys.has('KeyA')) dir = DIR_LEFT;
    else if (mine.keys.has('ArrowRight') || mine.keys.has('KeyD')) dir = DIR_RIGHT;
    if (dir !== null) tryMove(dir);
  }

  if (p.moving) {
    const dx = p.targetX - p.px;
    const dy = p.targetY - p.py;
    const d = Math.hypot(dx, dy);
    const step = 300 * dt;
    if (d <= step) {
      p.px = p.targetX;
      p.py = p.targetY;
      p.moving = false;
      if (mine.chest && p.tx === mine.chest.x && p.ty === mine.chest.y) openMineChest();
      if (p.tx === mine.ladder.x && p.ty === mine.ladder.y) {
        mine.hp = Math.min(mine.maxHp, mine.hp + 12);
        const prevTheme = mineTheme(mine.depth);
        generate(mine.depth + 1);
        const nextTheme = mineTheme(mine.depth);
        if (typeof toast === 'function') {
          toast(prevTheme.id !== nextTheme.id
            ? `矿井 B${mine.depth} · 进入${nextTheme.name}`
            : `矿井 B${mine.depth} · ${nextTheme.name}`);
        }
        if (typeof playSfx === 'function') playSfx(520, 'triangle', 0.08, 0.45);
      }
    } else {
      p.px += dx / d * step;
      p.py += dy / d * step;
    }
  }

  if (p.attack > 0) {
    p.attack += dt;
    if (!p.attackDone && p.attack >= 0.12) {
      p.attackDone = true;
      resolveAttack();
    }
    if (p.attack >= 0.28) p.attack = 0;
  }
  p.hurt = Math.max(0, p.hurt - dt);
  mine.floorMsg = Math.max(0, mine.floorMsg - dt);
  const field = buildMineDistField(p.tx, p.ty, false);
  const fieldAir = buildMineDistField(p.tx, p.ty, true);

  for (const m of mine.monsters) {
    m.animT += dt;
    m.cooldown -= dt;
    m.shotCd -= dt;
    m.think -= dt;
    m.hurt = Math.max(0, m.hurt - dt);

    const dx = p.px - m.px;
    const dy = p.py - m.py;
    const dist = Math.hypot(dx, dy);

    /* 攻击动作：前摇 → 命中帧 → 收招 */
    if (m.attack > 0) {
      m.attack += dt;
      m.moving = false;
      if (!m.attackHit && m.attack >= m.attackDur * 0.52) {
        m.attackHit = true;
        if (m.ranged) fireProjectile(m);
        else if (Math.hypot(p.px - m.px, p.py - m.py) < TILE * 1.35) hurtPlayer(m.dmg, m);
      }
      if (m.attack >= m.attackDur) {
        m.attack = 0;
        m.attackHit = false;
        if (m.ranged) m.shotCd = m.ranged.cd + Math.random() * 0.7;
        else m.cooldown = 1.2 + Math.random() * 0.6;
      }
      continue;
    }

    /* 被玩家打中：不打断正在走的这一格，只暂停抬手 */
    const stunned = m.hurt > 0;

    /* 平滑走格子：先选目标格，再按 speed 插值过去（和 NPC 走法一致） */
    if (m.moving) {
      const c = tileCenter(m.tx, m.ty);
      const mx = c.x - m.px, my = c.y - m.py;
      const md = Math.hypot(mx, my);
      const step = m.speed * dt;
      if (md <= step || md < 0.5) {
        m.px = c.x;
        m.py = c.y;
        m.moving = false;
      } else {
        m.px += mx / md * step;
        m.py += my / md * step;
        m.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? DIR_RIGHT : DIR_LEFT)
                                           : (my > 0 ? DIR_DOWN : DIR_UP);
        m.animT += dt * 1.6;
      }
    } else if (m.think <= 0 && m.speed > 0) {
      m.think = (m.ranged ? 0.35 : 0.16) + Math.random() * 0.22;
      monsterStartStep(m, dist, m.fly ? fieldAir : field);
    }

    if (!stunned && !m.ranged) {
      /* 近战：走完这一格、贴到相邻格再抬手（避免在半路上冻结） */
      if (!m.moving && dist < TILE * 1.25 && m.cooldown <= 0) {
        if (dist > 0.001) { m.lungeX = dx / dist; m.lungeY = dy / dist; }
        m.attack = 0.001;
        m.attackHit = false;
        m.attackDur = 0.42;
      }
    } else if (!stunned && m.ranged && m.shotCd <= 0 && dist < m.ranged.range &&
               dist > TILE * 1.1 && monsterHasLOS(m)) {
      /* 远程：有视线、在射程内就吟唱 */
      if (dist > 0.001) { m.lungeX = dx / dist; m.lungeY = dy / dist; }
      m.attack = 0.001;
      m.attackHit = false;
      m.attackDur = m.ranged.cast;
    }
  }

  /* 弹幕：直线飞行，撞墙消失，命中玩家结算伤害 */
  for (const pr of mine.projectiles) {
    pr.life -= dt;
    pr.spin += dt * 8;
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.trail.unshift({ x: pr.x, y: pr.y });
    if (pr.trail.length > 6) pr.trail.pop();

    const tx = Math.floor((pr.x - OX) / TILE);
    const ty = Math.floor((pr.y - OY) / TILE);
    const tt = tileAt(tx, ty);
    if (tt === 'wall' || tt === 'rock' || tt === 'ore' || tt === 'chest') {
      burstAt(pr.x, pr.y, pr.color, 5);
      pr.life = 0;
      continue;
    }
    if (mine.down <= 0 && Math.hypot(pr.x - mine.player.px, pr.y - (mine.player.py - 8)) < 13) {
      hurtPlayer(pr.dmg, null);
      pr.life = 0;
    }
  }
  mine.projectiles = mine.projectiles.filter(pr => pr.life > 0);

  /* 飘字 + 镜头震动 */
  for (const f of mine.floats) {
    f.life -= dt;
    f.y -= 28 * dt;
  }
  mine.floats = mine.floats.filter(f => f.life > 0);
  mine.shake = Math.max(0, mine.shake - dt);

  for (const s of mine.sparkles) {
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 100 * dt;
  }
  mine.sparkles = mine.sparkles.filter(s => s.life > 0);

  for (const m of mine.dying) m.timer -= dt;
  mine.dying = mine.dying.filter(m => m.timer > 0);
}

/* ---------- 渲染 ---------- */

export function drawMine(ctx) {
  if (!ctx) return;
  const W = CONFIG.VIEW_W;
  const H = CONFIG.VIEW_H;
  const theme = (mine.mode === 'skull') ? MINE_THEMES[2] : mineTheme(mine.depth);

  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.bg0);
  grad.addColorStop(1, theme.bg1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < OY; y += 24) {
    for (let x = 0; x < W; x += 48) {
      ctx.fillStyle = (x + y) % 3 ? theme.ceil1 : theme.ceil2;
      ctx.fillRect(x, y, 46, 22);
    }
  }

  /* 受击时镜头轻震：只抖世界，不抖 HUD */
  ctx.save();
  if (mine.shake > 0) {
    const sk = mine.shake / 0.2;
    ctx.translate(Math.round((Math.random() - 0.5) * 4 * sk), Math.round((Math.random() - 0.5) * 3 * sk));
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = mine.map[y][x];
      const px = OX + x * TILE;
      const py = OY + y * TILE;
      if (t === 'wall') {
        R(ctx, px, py, TILE, TILE, theme.wall);
        R(ctx, px + 2, py + 2, TILE - 4, TILE - 4, theme.wallIn);
        R(ctx, px + 3, py + 3, TILE - 6, 2, theme.wallHi);
        R(ctx, px + 3, py + TILE - 5, TILE - 6, 2, theme.wallLo);
      } else {
        R(ctx, px, py, TILE, TILE, (x + y) % 2 ? theme.floorA : theme.floorB);
        R(ctx, px + 2, py + 2, 3, 2, theme.speck);
        R(ctx, px + TILE - 9, py + TILE - 8, 4, 2, theme.speck2);
      }

      if (t === 'rock') {
        ellipse(ctx, px + TILE / 2, py + TILE / 2 + 4, 14, 11, theme.rockShadow);
        ellipse(ctx, px + TILE / 2, py + TILE / 2 + 1, 13, 10, theme.rockBody);
        R(ctx, px + 11, py + 11, 5, 4, theme.rockHi);
      } else if (t === 'ore') {
        ellipse(ctx, px + TILE / 2, py + TILE / 2 + 4, 14, 11, theme.rockShadow);
        ellipse(ctx, px + TILE / 2, py + TILE / 2 + 1, 13, 10, theme.oreRock);
        const item = RES_MAP[mine.ores.get(keyOf(x, y))];
        if (item) {
          /* 稀有层的矿石带一点主题辉光，方便在深色背景里辨认 */
          if (theme.id !== 'stone') {
            const pulse = 0.5 + Math.sin(mine.time * 2 + x + y) * 0.5;
            ctx.globalAlpha = 0.12 + pulse * 0.12;
            ctx.fillStyle = theme.accent;
            ctx.beginPath();
            ctx.arc(px + TILE / 2, py + TILE / 2, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          ctx.save();
          ctx.translate(px + 4, py + 4);
          drawResourceIcon(ctx, item, mine.time * 0.5);
          ctx.restore();
        }
      } else if (t === 'ladder') {
        R(ctx, px + 11, py + 2, 4, TILE - 4, '#8a6238');
        R(ctx, px + 24, py + 2, 4, TILE - 4, '#8a6238');
        for (let i = 0; i < 4; i++) R(ctx, px + 11, py + 9 + i * 8, 17, 3, '#c8a050');
        R(ctx, px + 13, py + 4, 2, TILE - 8, '#5a3a22');
      } else if (t === 'chest') {
        const bob = Math.sin(mine.time * 4) * 1.5;
        ellipse(ctx, px + TILE / 2, py + TILE - 8, 14, 5, 'rgba(0,0,0,.35)');
        R(ctx, px + 8, py + 15 + bob, 24, 15, '#7a4a22');
        R(ctx, px + 8, py + 10 + bob, 24, 8, '#a86a32');
        R(ctx, px + 8, py + 10 + bob, 24, 2, '#d89a4a');
        R(ctx, px + 8, py + 22 + bob, 24, 3, '#d8b050');
        R(ctx, px + 17, py + 17 + bob, 6, 8, '#ffd76a');
        R(ctx, px + 19, py + 19 + bob, 2, 3, '#7a4a22');
        ellipse(ctx, px + TILE / 2, py + 8 + bob, 10, 4, 'rgba(255,215,106,.18)');
      }
    }
  }

  for (const x of [OX + 3 * TILE, OX + 16 * TILE]) {
    R(ctx, x, OY - 26, 5, 26, '#5a3a22');
    ellipse(ctx, x + 2, OY - 32, 8, 9, '#e07a2a');
    ellipse(ctx, x + 2, OY - 34, 5, 6, '#f0c050');
    R(ctx, x + 1, OY - 39, 2, 5, '#fff0a0');
  }

  for (const m of mine.dying) {
    ctx.save();
    ctx.translate(m.px - 20, m.py - 32);
    drawMonster(ctx, m.type, mine.time * 0.5 + m.phase, { state: 'die', t: 1 - m.timer / 0.5 });
    ctx.restore();
  }

  for (const m of mine.monsters) {
    const attacking = m.attack > 0;
    const at = attacking ? Math.min(1, m.attack / Math.max(0.01, m.attackDur)) : 0;
    const state = m.hurt > 0 ? 'hurt' : (attacking ? 'attack' : 'idle');
    const t = m.hurt > 0 ? 1 - m.hurt / 0.22 : at;
    /* 抬手时朝玩家前冲一点，命中帧最明显 */
    let ox = 0, oy = 0;
    if (attacking) {
      const thrust = Math.sin(at * Math.PI) * (m.ranged ? 2 : 6);
      ox = m.lungeX * thrust;
      oy = m.lungeY * thrust;
    }
    /* 飞行怪：脚下留一圈淡影，本体上下浮动 */
    const hover = m.fly ? -4 + Math.sin(m.animT * 3 + m.phase) * 2 : 0;
    if (m.fly) {
      ctx.globalAlpha = 0.22;
      ellipse(ctx, m.px + ox * 0.3, m.py - 1, 10, 3.5, '#000000');
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(m.px - 20 + ox, m.py - 32 + oy + hover);
    drawMonster(ctx, m.type, m.animT, { state, t });
    ctx.restore();

    /* 近战抬手预警：脚下红圈由小变大，缩圈满时命中 */
    if (attacking && !m.ranged) {
      const k = Math.min(1, at / 0.52);
      ctx.globalAlpha = 0.22 + 0.38 * k;
      ctx.strokeStyle = '#ff5a4a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.px, m.py - 6, 9 + 17 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    /* 远程吟唱：手里聚一个法球 */
    if (attacking && m.ranged) {
      const k = Math.min(1, at / 0.52);
      const rd = m.ranged;
      ctx.globalAlpha = 0.35 + 0.5 * k;
      ctx.fillStyle = rd.color;
      ctx.beginPath();
      ctx.arc(m.px + m.lungeX * 14, m.py - 12 + m.lungeY * 10, 3 + 5 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    /* 远程怪头顶小光点，和近战区分 */
    if (m.ranged) {
      ctx.globalAlpha = 0.35 + Math.sin(m.animT * 3) * 0.25;
      ctx.fillStyle = m.ranged.color;
      ctx.fillRect(m.px - 1, m.py - 44, 3, 3);
      ctx.globalAlpha = 1;
    }

    const bw = 30;
    R(ctx, m.px - bw / 2, m.py - 40, bw, 3, '#1a1a20');
    R(ctx, m.px - bw / 2, m.py - 40, Math.max(0, bw * (m.hp / m.maxHp)), 3, '#d04a3a');
  }

  /* 远程弹幕 */
  for (const pr of mine.projectiles) {
    for (let i = pr.trail.length - 1; i >= 0; i--) {
      const tp = pr.trail[i];
      ctx.globalAlpha = 0.26 * (1 - i / pr.trail.length);
      ctx.fillStyle = pr.color;
      ctx.fillRect(tp.x - 2, tp.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    if (pr.kind === 'arrow') {
      const a = Math.atan2(pr.vy, pr.vx);
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(a);
      R(ctx, -6, -1, 12, 2, '#e8d0a0');
      R(ctx, 5, -2, 3, 4, pr.color);
      ctx.restore();
    } else if (pr.kind === 'skull') {
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pr.color;
      ctx.fillRect(pr.x - 2, pr.y - 1, 1, 2);
      ctx.fillRect(pr.x + 1, pr.y - 1, 1, 2);
    } else {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  const p = mine.player;
  ctx.save();
  if (p.hurt > 0) ctx.globalAlpha = 0.72;
  ctx.translate(p.px - 16, p.py - 36);
  let action = 'idle';
  let phase = mine.time * 1.8;
  if (mine.down > 0) {
    action = 'faint';
    phase = 1 - mine.down / 1.6;
  } else if (p.hurt > 0) {
    action = 'hurt';
    phase = 1 - p.hurt / 0.2;
  } else if (p.attack > 0) {
    action = 'attack';
    phase = p.attack / 0.28;
  } else if (p.moving) {
    action = 'walk';
  }
  drawFarmer(ctx, action, p.dir, phase);
  ctx.restore();

  /* 挥剑弧光：朝面朝方向扫出一道白色剑光 */
  if (p.attack > 0 && mine.down <= 0) {
    const prog = Math.min(1, p.attack / 0.28);
    const base = p.dir === DIR_RIGHT ? 0 : p.dir === DIR_LEFT ? Math.PI
               : p.dir === DIR_DOWN ? Math.PI / 2 : -Math.PI / 2;
    const sweep = 1.9;
    const a0 = base - sweep / 2;
    const a1 = a0 + sweep * Math.min(1, prog * 1.7);
    ctx.save();
    ctx.globalAlpha = 0.85 * (1 - prog * 0.75);
    ctx.strokeStyle = '#eaf4ff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(p.px, p.py - 18, 25, a0, a1);
    ctx.stroke();
    ctx.globalAlpha = 0.5 * (1 - prog * 0.75);
    ctx.strokeStyle = '#8cc4ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.px, p.py - 18, 31, a0 + 0.12, a1);
    ctx.stroke();
    ctx.restore();
  }

  for (const s of mine.sparkles) {
    ctx.globalAlpha = Math.max(0, s.life / 0.38);
    ctx.fillStyle = s.color;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
  }
  ctx.globalAlpha = 1;

  /* 伤害飘字 */
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px "Microsoft YaHei", monospace';
  for (const f of mine.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 0.45));
    ctx.fillStyle = '#000000';
    ctx.fillText(f.text, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  ctx.restore();          /* 结束镜头震动 */

  /* 被怪物打到时整屏泛红，让攻击有明确反馈 */
  if (p.hurt > 0) {
    ctx.fillStyle = 'rgba(190, 30, 40, ' + (0.10 + 0.22 * (p.hurt / 0.2)) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  /* HUD：生命条只在矿井 / 骷髅洞穴里画，地面场景没有血条 */
  ctx.fillStyle = 'rgba(10, 12, 16, 0.86)';
  ctx.fillRect(0, 0, W, 52);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e9c96f';
  ctx.font = '15px "Microsoft YaHei", monospace';
  ctx.fillText((mine.mode === 'skull' ? '骷髅洞穴 B' : '矿井 B') + mine.depth, 18, 26);

  const hpRatio = Math.max(0, Math.min(1, mine.hp / mine.maxHp));
  /* 像素心图标 */
  const hx = 108, hy = 15;
  R(ctx, hx + 2, hy, 4, 2, '#e05050');
  R(ctx, hx + 8, hy, 4, 2, '#e05050');
  R(ctx, hx, hy + 2, 14, 4, '#e05050');
  R(ctx, hx + 2, hy + 6, 10, 3, '#e05050');
  R(ctx, hx + 4, hy + 9, 6, 2, '#e05050');
  R(ctx, hx + 6, hy + 11, 2, 2, '#e05050');
  /* 生命条：12px 高 + 边框，掉到 50% / 25% 以下换黄 / 红 */
  const barX = 130, barY = 16, barW = 196, barH = 12;
  R(ctx, barX - 2, barY - 2, barW + 4, barH + 4, '#0b0e13');
  R(ctx, barX, barY, barW, barH, '#2a2a32');
  const hpColor = hpRatio > 0.5 ? '#63b04a' : hpRatio > 0.25 ? '#d8a83a' : '#d04a3a';
  if (hpRatio > 0) {
    R(ctx, barX, barY, Math.max(1, Math.round(barW * hpRatio)), barH, hpColor);
    R(ctx, barX, barY, Math.max(1, Math.round(barW * hpRatio)), 3, 'rgba(255,255,255,0.28)');
  }
  ctx.fillStyle = '#dbe4ee';
  ctx.font = '11px monospace';
  ctx.fillText(`HP ${Math.max(0, Math.round(mine.hp))} / ${mine.maxHp}`, barX, barY + barH + 9);

  ctx.fillStyle = '#e0c060';
  ctx.fillText(`矿石 ${mine.ore}`, 340, 26);
  ctx.fillStyle = '#c8a0a0';
  ctx.fillText(`怪物 ${mine.monsters.length}`, 450, 26);
  ctx.fillStyle = '#8b9aab';
  ctx.fillText(`最深 B${mine.best}`, 560, 26);
  ctx.fillStyle = theme.accent;
  ctx.font = '12px "Microsoft YaHei", monospace';
  ctx.fillText(mine.mode === 'skull' ? '骷髅' : theme.name, 664, 26);

  if (mine.floorMsg > 0) {
    ctx.globalAlpha = Math.min(1, mine.floorMsg / 0.4);
    ctx.fillStyle = '#f4e6c6';
    ctx.font = 'bold 22px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`B${mine.depth}`, W / 2, OY + 50);
    ctx.fillStyle = theme.accent;
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.fillText(mine.mode === 'skull' ? '骷髅洞穴' : theme.name, W / 2, OY + 74);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
  ctx.fillRect(0, H - BAR, W, BAR);
  ctx.fillStyle = '#9aa8b8';
  ctx.font = '12px "Microsoft YaHei", monospace';
  ctx.fillText('WASD / 方向键移动 · 空格攻击 · Q 炸弹 · R 楼梯 · 走到梯子下一层 · Esc 返回农场', 18, H - 26);
  ctx.fillStyle = '#6a7a8a';
  ctx.font = '11px monospace';
  ctx.fillText('矿石 +1 并掉落石材 · 击杀怪物 +2 矿石 / 石材 / 金币 · 每 5 层首次到达有矿工宝箱', 18, H - 9);

  if (mine.down > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff7070';
    ctx.font = 'bold 26px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('倒下了…', W / 2, H / 2);
    ctx.textAlign = 'left';
  }
}

Object.assign(window, {
  enterMine,
  exitMine,
  toggleMine,
  mineAttack,
  mineUseBomb,
  mineUseStair,
  updateMine,
  drawMine,
  mineState: mine,
  mineTheme,
  mineElevatorFloors,
  mineSave,
  mineLoad,
  mineClaimedSerialize,
  mineClaimedDeserialize,
  mineReset
});
