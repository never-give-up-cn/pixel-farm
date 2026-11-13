/* js/systems/mine.js — 矿井模式：把 anim 层的农夫 / 怪物 / 矿石接进游戏本体。
 * 按 J 进入，WASD / 方向键移动，空格攻击，走到梯子下一层，Esc 返回农场。
 * 只会接管更新与渲染，不改动农场地图、存档和主循环的其它系统。 */

'use strict';

import { drawFarmer } from '../anim/farmer.js';
import { MONSTERS, drawMonster } from '../anim/monsters.js';
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

window.mineActive = false;

const mine = {
  active: false,
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
  const theme = mineTheme(depth);
  mine.depth = depth;
  mine.best = Math.max(mine.best, depth);
  mine.themeId = theme.id;
  mine.rocks.clear();
  mine.ores.clear();
  mine.monsters = [];
  mine.dying = [];
  mine.map = [];
  mine.sparkles = [];
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
  while (count < 5 && guard++ < 300) {
    const x = 4 + Math.floor(rnd() * (COLS - 6));
    const y = 1 + Math.floor(rnd() * (ROWS - 2));
    if (tileAt(x, y) !== 'floor') continue;
    if (Math.abs(x - 1) + Math.abs(y - 5) < 4) continue;
    const def = MINE_MONSTERS[Math.floor(rnd() * MINE_MONSTERS.length)];
    const hp = Math.max(6, Math.round(def.hp / 7 + depth * 1.4));
    const c = tileCenter(x, y);
    mine.monsters.push({
      type: def.id, tx: x, ty: y, px: c.x, py: c.y,
      hp, maxHp: hp, dmg: Math.max(1, Math.round(def.dmg / 3 + depth * 0.2)),
      cooldown: 0.6 + rnd() * 1.4, moveTimer: 0.4 + rnd() * 0.8,
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
  if (mine.monsters.some(m => m.tx === nx && m.ty === ny)) return;
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
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 24 + Math.random() * 70;
    mine.sparkles.push({
      x: c.x, y: c.y,
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

export function enterMine(startDepth) {
  if (window.mineActive) return;
  let depth = 1;
  if (typeof startDepth === 'number' && startDepth > 1) {
    /* 电梯只能去到已经解锁的楼层 */
    depth = Math.min(startDepth | 0, Math.max(1, mine.best | 0));
  }
  window.mineActive = true;
  mine.active = true;
  mine.hp = 100 + (typeof skillMineHpBonus === 'function' ? skillMineHpBonus() : 0);
  mine.maxHp = mine.hp;
  mine.ore = 0;
  mine.down = 0;
  mine.keys.clear();
  mine.time = 0;
  generate(depth);
  const theme = mineTheme(depth);
  if (typeof toast === 'function') toast(`进入矿井 B${depth} · ${theme.name} · WASD 移动 / 空格攻击 / Esc 返回地面`);
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

  const mon = mine.monsters.find(m => m.tx === t.x && m.ty === t.y);
  if (mon) {
    const dmg = weaponDamage();
    mon.hp -= dmg;
    mon.hurt = 0.22;
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

  burst(t.x, t.y, '#d8e0e8', 4);
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

  for (const m of mine.monsters) {
    m.phase += dt;
    m.cooldown -= dt;
    m.moveTimer -= dt;
    m.hurt = Math.max(0, m.hurt - dt);

    const dx = p.px - m.px;
    const dy = p.py - m.py;
    const dist = Math.hypot(dx, dy);

    if (m.moveTimer <= 0) {
      m.moveTimer = 0.7 + Math.random() * 0.8;
      const dirs = DIRS.filter(d => {
        const nx = m.tx + d.dx;
        const ny = m.ty + d.dy;
        const t = tileAt(nx, ny);
        if (t !== 'floor' && t !== 'ladder') return false;
        if (nx === p.tx && ny === p.ty) return false;
        return !mine.monsters.some(o => o !== m && o.tx === nx && o.ty === ny);
      });
      if (dirs.length) {
        let best = dirs[0];
        let bd = Infinity;
        for (const d of dirs) {
          const c = tileCenter(m.tx + d.dx, m.ty + d.dy);
          const dd = Math.hypot(c.x - p.px, c.y - p.py);
          if (dd < bd) { bd = dd; best = d; }
        }
        m.tx += best.dx;
        m.ty += best.dy;
        const c = tileCenter(m.tx, m.ty);
        m.px = c.x;
        m.py = c.y;
      }
    }

    if (dist < 40 && m.cooldown <= 0) {
      m.cooldown = 1.3 + Math.random() * 0.6;
      const taken = Math.max(1, Math.round(m.dmg *
        (typeof skillDamageTakenMult === 'function' ? skillDamageTakenMult() : 1) *
        (typeof foodBuffDamageTakenMult === 'function' ? foodBuffDamageTakenMult() : 1)) -
        (typeof equipDefenseBonus === 'function' ? equipDefenseBonus() : 0) -
        (typeof equipImmunityBonus === 'function' ? equipImmunityBonus() : 0));
      mine.hp -= taken;
      p.hurt = 0.2;
      burst(m.tx, m.ty, '#ff6070', 6);
      if (typeof playSfx === 'function') playSfx(160, 'sawtooth', 0.08, 0.4);
      if (mine.hp <= 0) {
        mine.hp = 0;
        mine.down = 1.6;
        if (typeof toast === 'function') toast('你倒下了…被送回农场');
      }
    } else {
      const c = tileCenter(m.tx, m.ty);
      m.px = c.x;
      m.py = c.y;
    }
  }

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
  const theme = mineTheme(mine.depth);

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
    const near = Math.hypot(mine.player.px - m.px, mine.player.py - m.py) < 52;
    const winding = near && m.cooldown < 0.3;
    const state = m.hurt > 0 ? 'hurt' : (winding ? 'attack' : 'idle');
    const t = m.hurt > 0 ? 1 - m.hurt / 0.22 : (winding ? 1 - m.cooldown / 0.3 : 0);
    ctx.save();
    ctx.translate(m.px - 20, m.py - 32);
    drawMonster(ctx, m.type, mine.time * 0.5 + m.phase, { state, t });
    ctx.restore();

    const bw = 30;
    R(ctx, m.px - bw / 2, m.py - 40, bw, 3, '#1a1a20');
    R(ctx, m.px - bw / 2, m.py - 40, Math.max(0, bw * (m.hp / m.maxHp)), 3, '#d04a3a');
  }

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

  for (const s of mine.sparkles) {
    ctx.globalAlpha = Math.max(0, s.life / 0.38);
    ctx.fillStyle = s.color;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
  }
  ctx.globalAlpha = 1;

  /* HUD */
  ctx.fillStyle = 'rgba(10, 12, 16, 0.86)';
  ctx.fillRect(0, 0, W, 52);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e9c96f';
  ctx.font = '15px "Microsoft YaHei", monospace';
  ctx.fillText(`矿井 B${mine.depth}`, 18, 26);

  ctx.fillStyle = '#2a2a32';
  ctx.fillRect(130, 18, 180, 9);
  ctx.fillStyle = mine.hp / mine.maxHp > 0.3 ? '#5aa04a' : '#d04a3a';
  ctx.fillRect(130, 18, 180 * Math.max(0, mine.hp / mine.maxHp), 9);
  ctx.fillStyle = '#c8d0d8';
  ctx.font = '11px monospace';
  ctx.fillText(`HP ${Math.max(0, Math.round(mine.hp))}/${mine.maxHp}`, 130, 38);

  ctx.fillStyle = '#e0c060';
  ctx.fillText(`矿石 ${mine.ore}`, 340, 26);
  ctx.fillStyle = '#c8a0a0';
  ctx.fillText(`怪物 ${mine.monsters.length}`, 450, 26);
  ctx.fillStyle = '#8b9aab';
  ctx.fillText(`最深 B${mine.best}`, 560, 26);
  ctx.fillStyle = theme.accent;
  ctx.font = '12px "Microsoft YaHei", monospace';
  ctx.fillText(theme.name, 664, 26);

  if (mine.floorMsg > 0) {
    ctx.globalAlpha = Math.min(1, mine.floorMsg / 0.4);
    ctx.fillStyle = '#f4e6c6';
    ctx.font = 'bold 22px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`B${mine.depth}`, W / 2, OY + 50);
    ctx.fillStyle = theme.accent;
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.fillText(theme.name, W / 2, OY + 74);
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
