/* 矿井探索演示：可操作的小型矿井房间。
 * WASD / 方向键移动，空格攻击，打碎矿石或怪物，走到梯子进入下一层。 */

import { drawFarmer } from './anim/farmer.js';
import { MONSTERS, drawMonster } from './anim/monsters.js';
import { RES_MAP, drawResourceIcon } from './anim/resources.js';
import { DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP, mulberry32, ellipse, R } from './anim/pixel.js';

const W = 480;
const H = 520;
const TILE = 36;
const COLS = 13;
const ROWS = 9;
const OX = 6;
const OY = 100;
const BAR = 46;

const DIRS = [
  { dx: 0, dy: 1, dir: DIR_DOWN },
  { dx: -1, dy: 0, dir: DIR_LEFT },
  { dx: 1, dy: 0, dir: DIR_RIGHT },
  { dx: 0, dy: -1, dir: DIR_UP }
];

const ORES = ['copper_ore', 'iron_ore', 'gold_ore', 'coal', 'quartz', 'fire_quartz', 'frozen_tear', 'earth_crystal'];
const MINE_MONSTERS = MONSTERS.filter(m => m.loc === 'mine' || m.loc === 'skull');

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

function keyOf(x, y) { return `${x},${y}`; }

export function initMinePanel() {
  const canvas = document.getElementById('mine-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const statusEl = document.getElementById('mine-status');
  const noteEl = document.getElementById('mine-note');
  const resetBtn = document.getElementById('mine-reset');

  const state = {
    depth: 1,
    hp: 100,
    maxHp: 100,
    ore: 0,
    keys: new Set(),
    time: 0,
    player: {
      tx: 1, ty: 4, px: 0, py: 0,
      dir: DIR_RIGHT,
      moving: false,
      targetX: 0, targetY: 0,
      attack: 0,
      attackDone: false,
      hurt: 0
    },
    monsters: [],
    dying: [],
    map: [],
    rocks: new Map(),
    ores: new Map(),
    ladder: { x: COLS - 2, y: 4 },
    sparkles: [],
    down: 0
  };

  /* ---------- 生成房间 ---------- */
  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return 'wall';
    return state.map[y][x];
  }

  function setTile(x, y, t) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    state.map[y][x] = t;
  }

  function tileCenter(x, y) {
    return { x: OX + x * TILE + TILE / 2, y: OY + y * TILE + TILE / 2 };
  }

  function generate(depth) {
    const rnd = mulberry32(4200 + depth * 131);
    state.depth = depth;
    state.rocks.clear();
    state.ores.clear();
    state.monsters = [];
    state.dying = [];
    state.map = [];
    state.sparkles = [];

    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) {
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) row.push('wall');
        else row.push('floor');
      }
      state.map.push(row);
    }

    /* 岩石与矿石 */
    let placed = 0;
    while (placed < 22) {
      const x = 1 + Math.floor(rnd() * (COLS - 2));
      const y = 1 + Math.floor(rnd() * (ROWS - 2));
      if (x === 1 && y === 4) continue;
      if (x === COLS - 2 && y === 4) continue;
      if (tileAt(x, y) !== 'floor') continue;
      if (rnd() < 0.28) {
        const id = ORES[Math.floor(rnd() * ORES.length)];
        setTile(x, y, 'ore');
        state.ores.set(keyOf(x, y), id);
      } else {
        setTile(x, y, 'rock');
        state.rocks.set(keyOf(x, y), 1);
      }
      placed++;
    }

    state.ladder = { x: COLS - 2, y: 4 };
    setTile(state.ladder.x, state.ladder.y, 'ladder');

    /* 玩家 */
    const p = tileCenter(1, 4);
    state.player.tx = 1;
    state.player.ty = 4;
    state.player.px = p.x;
    state.player.py = p.y;
    state.player.targetX = p.x;
    state.player.targetY = p.y;
    state.player.moving = false;
    state.player.attack = 0;
    state.player.attackDone = false;
    state.player.hurt = 0;
    state.player.dir = DIR_RIGHT;

    /* 怪物 */
    let mCount = 0;
    let guard = 0;
    while (mCount < 4 && guard++ < 200) {
      const x = 3 + Math.floor(rnd() * (COLS - 5));
      const y = 1 + Math.floor(rnd() * (ROWS - 2));
      if (tileAt(x, y) !== 'floor') continue;
      if (Math.abs(x - 1) + Math.abs(y - 4) < 3) continue;
      const m = MINE_MONSTERS[Math.floor(rnd() * MINE_MONSTERS.length)];
      const hp = Math.max(4, Math.round(m.hp / 8));
      state.monsters.push({
        type: m.id, tx: x, ty: y, px: 0, py: 0,
        hp, maxHp: hp, dmg: Math.max(1, Math.round(m.dmg / 3)),
        cooldown: 0.5 + rnd() * 1.5, moveTimer: 0.4 + rnd() * 0.8,
        phase: rnd() * 6.28, hurt: 0
      });
      const c = tileCenter(x, y);
      const mon = state.monsters[state.monsters.length - 1];
      mon.px = c.x; mon.py = c.y;
      mCount++;
    }
  }

  /* ---------- 输入 ---------- */
  const dirKeys = {
    ArrowDown: DIR_DOWN, KeyS: DIR_DOWN,
    ArrowLeft: DIR_LEFT, KeyA: DIR_LEFT,
    ArrowRight: DIR_RIGHT, KeyD: DIR_RIGHT,
    ArrowUp: DIR_UP, KeyW: DIR_UP
  };

  function active() {
    return document.getElementById('tab-mine')?.classList.contains('active');
  }

  function onKeyDown(e) {
    if (!active()) return;
    if (e.code in dirKeys) {
      e.preventDefault();
      state.keys.add(e.code);
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) attack();
    }
  }

  function onKeyUp(e) {
    if (e.code in dirKeys) state.keys.delete(e.code);
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  /* ---------- 移动 / 攻击 ---------- */
  function tryMove(dir) {
    const p = state.player;
    p.dir = dir;
    if (p.moving || p.attack > 0 || state.down > 0) return;
    const d = DIRS.find(v => v.dir === dir);
    if (!d) return;
    const nx = p.tx + d.dx;
    const ny = p.ty + d.dy;
    const t = tileAt(nx, ny);
    if (t === 'wall' || t === 'rock' || t === 'ore') return;
    if (state.monsters.some(m => m.tx === nx && m.ty === ny)) return;
    p.tx = nx; p.ty = ny;
    const c = tileCenter(nx, ny);
    p.targetX = c.x;
    p.targetY = c.y;
    p.moving = true;
  }

  function facingTile() {
    const p = state.player;
    const d = DIRS.find(v => v.dir === p.dir) || DIRS[0];
    return { x: p.tx + d.dx, y: p.ty + d.dy };
  }

  function attack() {
    const p = state.player;
    if (p.moving || p.attack > 0 || state.down > 0) return;
    p.attack = 0.001;
    p.attackDone = false;
  }

  function resolveAttack() {
    const p = state.player;
    const t = facingTile();
    const k = keyOf(t.x, t.y);
    if (tileAt(t.x, t.y) === 'rock') {
      setTile(t.x, t.y, 'floor');
      state.rocks.delete(k);
      burst(t.x, t.y, '#b8b0a0', 8);
      return;
    }
    if (tileAt(t.x, t.y) === 'ore') {
      setTile(t.x, t.y, 'floor');
      state.ores.delete(k);
      state.ore++;
      burst(t.x, t.y, '#e0c060', 10);
      return;
    }
    const mon = state.monsters.find(m => m.tx === t.x && m.ty === t.y);
    if (mon) {
      mon.hp -= 9;
      mon.hurt = 0.22;
      burst(t.x, t.y, '#ff8060', 10);
      if (mon.hp <= 0) {
        state.monsters = state.monsters.filter(m => m !== mon);
        state.dying.push({ ...mon, timer: 0.5, hurt: 0 });
        state.ore += 2;
        burst(t.x, t.y, '#ffe060', 16);
      }
      return;
    }
    burst(t.x, t.y, '#d8e0e8', 4);
  }

  function burst(tx, ty, color, n) {
    const c = tileCenter(tx, ty);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 20 + Math.random() * 55;
      state.sparkles.push({
        x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 15,
        life: 0.35, color
      });
    }
  }

  function update(dt) {
    state.time += dt;
    const p = state.player;

    if (state.down > 0) {
      state.down -= dt;
      if (state.down <= 0) {
        state.hp = state.maxHp;
        generate(1);
      }
      return;
    }

    /* 移动输入 */
    if (!p.moving && p.attack <= 0) {
      let dir = null;
      if (state.keys.has('ArrowUp') || state.keys.has('KeyW')) dir = DIR_UP;
      else if (state.keys.has('ArrowDown') || state.keys.has('KeyS')) dir = DIR_DOWN;
      else if (state.keys.has('ArrowLeft') || state.keys.has('KeyA')) dir = DIR_LEFT;
      else if (state.keys.has('ArrowRight') || state.keys.has('KeyD')) dir = DIR_RIGHT;
      if (dir !== null) tryMove(dir);
    }

    /* 平滑移动 */
    if (p.moving) {
      const dx = p.targetX - p.px;
      const dy = p.targetY - p.py;
      const d = Math.hypot(dx, dy);
      const speed = 210 * dt;
      if (d <= speed) {
        p.px = p.targetX;
        p.py = p.targetY;
        p.moving = false;
        /* 到达梯子 */
        if (p.tx === state.ladder.x && p.ty === state.ladder.y) {
          state.hp = Math.min(state.maxHp, state.hp + 10);
          generate(state.depth + 1);
        }
      } else {
        p.px += dx / d * speed;
        p.py += dy / d * speed;
      }
    }

    /* 攻击动画 */
    if (p.attack > 0) {
      p.attack += dt;
      if (!p.attackDone && p.attack >= 0.12) {
        p.attackDone = true;
        resolveAttack();
      }
      if (p.attack >= 0.28) p.attack = 0;
    }
    p.hurt = Math.max(0, p.hurt - dt);

    /* 怪物 */
    for (const m of state.monsters) {
      m.phase += dt;
      m.cooldown -= dt;
      m.moveTimer -= dt;
      m.hurt = Math.max(0, m.hurt - dt);
      const dx = p.px - m.px;
      const dy = p.py - m.py;
      const dist = Math.hypot(dx, dy);
      /* 靠近玩家 */
      if (m.moveTimer <= 0) {
        m.moveTimer = 0.7 + Math.random() * 0.8;
        const dirs = DIRS.filter(d => {
          const nx = m.tx + d.dx, ny = m.ty + d.dy;
          const t = tileAt(nx, ny);
          if (t !== 'floor' && t !== 'ladder') return false;
          if (nx === p.tx && ny === p.ty) return false;
          return !state.monsters.some(o => o !== m && o.tx === nx && o.ty === ny);
        });
        if (dirs.length) {
          let best = dirs[0], bd = Infinity;
          for (const d of dirs) {
            const nx = m.tx + d.dx, ny = m.ty + d.dy;
            const c = tileCenter(nx, ny);
            const dd = Math.hypot(c.x - p.px, c.y - p.py);
            if (dd < bd) { bd = dd; best = d; }
          }
          m.tx += best.dx; m.ty += best.dy;
          const c = tileCenter(m.tx, m.ty);
          m.px = c.x; m.py = c.y;
        }
      }
      if (dist < 34 && m.cooldown <= 0) {
        m.cooldown = 1.2 + Math.random() * 0.5;
        state.hp -= m.dmg;
        p.hurt = 0.2;
        burst(m.tx, m.ty, '#ff6070', 6);
        if (state.hp <= 0) {
          state.hp = 0;
          state.down = 1.5;
        }
      } else {
        const c = tileCenter(m.tx, m.ty);
        m.px = c.x; m.py = c.y;
      }
    }

    /* 粒子 */
    for (const s of state.sparkles) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 100 * dt;
    }
    state.sparkles = state.sparkles.filter(s => s.life > 0);

    /* 死亡消散 */
    for (const m of state.dying) m.timer -= dt;
    state.dying = state.dying.filter(m => m.timer > 0);
  }

  /* ---------- 渲染 ---------- */
  function render() {
    ctx.clearRect(0, 0, W, H);

    /* 背景 */
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#161a20');
    grad.addColorStop(1, '#0e1116');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < 100; y += 20) {
      for (let x = 0; x < W; x += 40) {
        ctx.fillStyle = (x + y) % 3 ? '#20242c' : '#262a32';
        ctx.fillRect(x, y, 38, 18);
      }
    }

    /* 地块 */
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = state.map[y][x];
        const px = OX + x * TILE;
        const py = OY + y * TILE;
        if (t === 'wall') {
          R(ctx, px, py, TILE, TILE, '#2a2d35');
          R(ctx, px + 2, py + 2, TILE - 4, TILE - 4, '#343842');
          R(ctx, px + 3, py + 3, TILE - 6, 2, '#40444e');
          R(ctx, px + 3, py + TILE - 5, TILE - 6, 2, '#22252c');
        } else {
          R(ctx, px, py, TILE, TILE, (x + y) % 2 ? '#3a3830' : '#413e34');
          R(ctx, px + 2, py + 2, 3, 2, '#4a463a');
          R(ctx, px + TILE - 8, py + TILE - 7, 4, 2, '#2e2c26');
        }

        if (t === 'rock') {
          ellipse(ctx, px + TILE / 2, py + TILE / 2 + 4, 13, 10, '#5a5a50');
          ellipse(ctx, px + TILE / 2, py + TILE / 2 + 1, 12, 9, '#7a7a6a');
          R(ctx, px + 10, py + 10, 5, 4, '#9a9a88');
        } else if (t === 'ore') {
          ellipse(ctx, px + TILE / 2, py + TILE / 2 + 4, 13, 10, '#4a4a42');
          ellipse(ctx, px + TILE / 2, py + TILE / 2 + 1, 12, 9, '#6a6a5a');
          const id = state.ores.get(keyOf(x, y));
          const item = RES_MAP[id];
          if (item) {
            ctx.save();
            ctx.translate(px + 2, py + 2);
            drawResourceIcon(ctx, item, state.time * 0.5);
            ctx.restore();
          }
        } else if (t === 'ladder') {
          R(ctx, px + 10, py + 2, 4, TILE - 4, '#8a6238');
          R(ctx, px + 22, py + 2, 4, TILE - 4, '#8a6238');
          for (let i = 0; i < 4; i++) R(ctx, px + 10, py + 8 + i * 7, 16, 3, '#c8a050');
          R(ctx, px + 12, py + 4, 2, TILE - 8, '#5a3a22');
        }
      }
    }

    /* 火把 */
    for (const x of [OX + 2 * TILE, OX + 10 * TILE]) {
      R(ctx, x, OY - 28, 4, 26, '#5a3a22');
      ellipse(ctx, x + 2, OY - 34, 7, 8, '#e07a2a');
      ellipse(ctx, x + 2, OY - 36, 4, 5, '#f0c050');
      R(ctx, x + 1, OY - 40, 2, 5, '#fff0a0');
    }

    /* 怪物 */
    for (const m of state.monsters) {
      ctx.save();
      /* 靠近玩家且即将出手时播放攻击前摇 */
      const near = Math.hypot(state.player.px - m.px, state.player.py - m.py) < 44;
      const winding = near && m.cooldown < 0.3;
      const mState = m.hurt > 0 ? 'hurt' : (winding ? 'attack' : 'idle');
      const mT = m.hurt > 0 ? 1 - m.hurt / 0.22 : (winding ? 1 - m.cooldown / 0.3 : 0);
      ctx.translate(m.px - 20, m.py - 34);
      drawMonster(ctx, m.type, state.time * 0.5 + m.phase, { state: mState, t: mT });
      ctx.restore();
      /* 怪物血条 */
      const w = 28;
      R(ctx, m.px - w / 2, m.py - 40, w, 3, '#1a1a20');
      R(ctx, m.px - w / 2, m.py - 40, Math.max(0, w * (m.hp / m.maxHp)), 3, '#d04a3a');
    }

    /* 死亡消散 */
    for (const m of state.dying) {
      ctx.save();
      ctx.translate(m.px - 20, m.py - 34);
      drawMonster(ctx, m.type, state.time * 0.5 + m.phase, { state: 'die', t: 1 - m.timer / 0.5 });
      ctx.restore();
    }

    /* 玩家 */
    const p = state.player;
    ctx.save();
    if (p.hurt > 0) ctx.globalAlpha = 0.7;
    ctx.translate(p.px - 16, p.py - 36);
    let action = 'idle';
    let phase = state.time * 1.8;
    if (state.down > 0) {
      action = 'faint';
      phase = 1 - state.down / 1.5;
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

    /* 粒子 */
    for (const s of state.sparkles) {
      ctx.globalAlpha = Math.max(0, s.life / 0.35);
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    }
    ctx.globalAlpha = 1;

    /* 顶部 HUD */
    ctx.fillStyle = 'rgba(10, 12, 16, 0.82)';
    ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`矿井 B${state.depth}`, 14, 22);
    ctx.fillStyle = '#d04a3a';
    ctx.fillRect(120, 14, 130, 7);
    ctx.fillStyle = '#5aa04a';
    ctx.fillRect(120, 14, 130 * (state.hp / state.maxHp), 7);
    ctx.fillStyle = '#d8e0e8';
    ctx.font = '10px monospace';
    ctx.fillText(`HP ${Math.max(0, Math.round(state.hp))}/${state.maxHp}`, 120, 31);
    ctx.fillStyle = '#e0c060';
    ctx.fillText(`矿石 ${state.ore}`, 280, 22);
    ctx.fillStyle = '#c8a0a0';
    ctx.fillText(`怪物 ${state.monsters.length}`, 380, 22);

    /* 底部提示 */
    ctx.fillStyle = 'rgba(10, 12, 16, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px "Microsoft YaHei", monospace';
    ctx.fillText('WASD / 方向键移动 · 空格攻击 · 走到梯子下一层', 14, H - 27);
    ctx.fillStyle = '#6a7a8a';
    ctx.font = '10px monospace';
    ctx.fillText('打碎矿石 +1 · 击杀怪物 +2 · 下一层恢复 10 HP', 14, H - 10);

    if (state.down > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff7070';
      ctx.font = 'bold 24px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('倒下了…', W / 2, 260);
      ctx.textAlign = 'left';
    }

    sync();
  }

  function sync() {
    statusEl.innerHTML =
      `<dt>深度</dt><dd>B${state.depth}</dd>` +
      `<dt>生命</dt><dd>${Math.max(0, Math.round(state.hp))} / ${state.maxHp}</dd>` +
      `<dt>矿石</dt><dd>${state.ore}</dd>` +
      `<dt>怪物</dt><dd>${state.monsters.length}</dd>`;
    noteEl.textContent = state.down > 0 ? '倒下了，正在回到地面…' : '走到梯子进入下一层';
  }

  function reset() {
    state.hp = state.maxHp;
    state.down = 0;
    state.ore = 0;
    generate(1);
    render();
  }

  resetBtn.addEventListener('click', reset);

  generate(1);
  sync();
  render();

  return {
    activate() { render(); },
    tick(dt) {
      update(dt);
      render();
    },
    getState() {
      return {
        depth: state.depth,
        hp: state.hp,
        ore: state.ore,
        monsters: state.monsters.length,
        player: { tx: state.player.tx, ty: state.player.ty, dir: state.player.dir },
        ladder: { ...state.ladder }
      };
    }
  };
}
