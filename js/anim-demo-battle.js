/* 战斗演示：农夫挥剑 vs 选定怪物。
 * 实时攻击、怪物反击、血条、伤害数字、击杀与连击。 */

import { drawFarmer } from './anim/farmer.js';
import { MONSTERS, MONSTER_MAP, MONSTER_LOCS, monsterLocName, drawMonster } from './anim/monsters.js';
import { WEAPONS, EQUIP_MAP, equipCatName, drawEquipment } from './anim/equipment.js';
import { DIR_RIGHT, mulberry32, ellipse, TAU } from './anim/pixel.js';

const W = 480;
const H = 520;
const BAR = 46;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

function dmgRange(w) {
  const m = String(w.dmg || '').match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  return [3, 6];
}

function critOf(w) {
  const n = parseFloat(w.crit);
  return Number.isFinite(n) ? n : 0;
}

export function initBattlePanel() {
  const canvas = document.getElementById('battle-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    monster: 'green_slime',
    weapon: 'steel_smallsword',
    loc: 'all',
    playing: true,
    speed: 1,
    time: 0,
    farmerHp: 100,
    farmerMax: 100,
    monsterHp: MONSTER_MAP.green_slime.hp,
    monsterMax: MONSTER_MAP.green_slime.hp,
    attackTimer: 0,
    attackPhase: -1,
    hitDone: false,
    counterTimer: 0,
    hitFlash: 0,
    shake: 0,
    respawn: 0,
    farmerDown: 0,
    monsterAtk: -1,
    monsterHurt: 0,
    monsterDie: 0,
    combo: 0,
    kills: 0,
    pops: [],
    sparks: []
  };

  const listHost = document.getElementById('battle-list');
  const weaponSelect = document.getElementById('battle-weapon');
  const statusEl = document.getElementById('battle-status');
  const noteEl = document.getElementById('battle-note');
  const playBtn = document.getElementById('battle-play');
  const resetBtn = document.getElementById('battle-reset');
  const speedInput = document.getElementById('battle-speed');
  const speedOut = document.getElementById('battle-speed-out');
  const locFilter = document.getElementById('battle-loc');

  /* ---------- 背景：矿井战斗场 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(1919);

    g.fillStyle = '#181a20';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(rnd() * W);
      const y = Math.floor(rnd() * 320);
      const w = 16 + Math.floor(rnd() * 34);
      const h = 8 + Math.floor(rnd() * 18);
      g.fillStyle = i % 3 ? '#23262e' : '#1c1f26';
      g.fillRect(x, y, w, h);
      g.fillStyle = '#2e323c';
      g.fillRect(x, y, w, 1);
    }

    /* 钟乳石 */
    for (let i = 0; i < 10; i++) {
      const x = 20 + i * 46;
      const h = 12 + Math.floor(rnd() * 26);
      for (let j = 0; j < h; j++) {
        const w = Math.max(1, Math.floor((h - j) / 5));
        g.fillStyle = '#2a2e38';
        g.fillRect(x - w, j, w * 2, 1);
      }
    }

    /* 地面 */
    g.fillStyle = '#2e2b24';
    g.fillRect(0, 380, W, H - 380);
    g.fillStyle = '#3a362c';
    g.fillRect(0, 380, W, 5);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = i % 2 ? '#3f3b30' : '#24211b';
      g.fillRect(Math.floor(rnd() * W), 390 + Math.floor(rnd() * 100), 4, 2);
    }

    /* 矿脉 */
    for (const [x, y, col] of [[40, 120, '#4a8ac0'], [420, 100, '#c07a3a'], [390, 300, '#8a8a9a']]) {
      g.fillStyle = col;
      g.fillRect(x, y, 8, 7);
      g.fillStyle = '#d8d0b0';
      g.fillRect(x + 2, y + 2, 3, 3);
    }

    /* 火把 */
    for (const x of [70, 410]) {
      g.fillStyle = '#5a3a22';
      g.fillRect(x, 218, 5, 110);
      g.fillStyle = '#e07a2a';
      g.fillRect(x - 5, 208, 15, 12);
      g.fillStyle = '#f0c050';
      g.fillRect(x - 1, 200, 7, 12);
      g.fillStyle = '#fff0a0';
      g.fillRect(x + 1, 202, 2, 5);
    }

    /* 梯子 */
    g.fillStyle = '#6a4a2a';
    g.fillRect(34, 300, 4, 80);
    g.fillRect(52, 300, 4, 80);
    for (let i = 0; i < 5; i++) g.fillRect(34, 310 + i * 15, 22, 3);

    const vg = g.createRadialGradient(W / 2, 250, 100, W / 2, 250, 380);
    vg.addColorStop(0, 'rgba(240, 160, 80, 0.10)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 列表 / 选择 ---------- */
  const locs = [{ id: 'all', name: '全部' }, ...MONSTER_LOCS.filter(l => l.id !== 'all')];
  for (const loc of locs) {
    const b = document.createElement('button');
    b.textContent = loc.name;
    b.dataset.loc = loc.id;
    b.addEventListener('click', () => {
      state.loc = loc.id;
      applyFilter();
    });
    locFilter.appendChild(b);
  }

  for (const m of MONSTERS) {
    const b = document.createElement('button');
    b.textContent = m.name;
    b.dataset.monster = m.id;
    b.title = `${m.en} · ${monsterLocName(m.loc)} · HP ${m.hp}`;
    b.addEventListener('click', () => selectMonster(m.id));
    listHost.appendChild(b);
  }

  const groups = [
    { id: 'sword', name: '剑' },
    { id: 'dagger', name: '匕首' },
    { id: 'club', name: '棍锤' },
    { id: 'slingshot', name: '弹弓' }
  ];
  for (const group of groups) {
    const og = document.createElement('optgroup');
    og.label = group.name;
    for (const w of WEAPONS.filter(w => w.cat === group.id)) {
      const o = document.createElement('option');
      o.value = w.id;
      o.textContent = w.name;
      og.appendChild(o);
    }
    weaponSelect.appendChild(og);
  }
  weaponSelect.value = state.weapon;

  function applyFilter() {
    for (const b of listHost.children) {
      const m = MONSTER_MAP[b.dataset.monster];
      b.style.display = state.loc === 'all' || m.loc === state.loc ? '' : 'none';
    }
    for (const b of locFilter.children) {
      b.classList.toggle('active', b.dataset.loc === state.loc);
    }
  }

  function selectMonster(id) {
    if (!MONSTER_MAP[id]) return;
    state.monster = id;
    reset();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
  }

  function reset() {
    const m = MONSTER_MAP[state.monster];
    state.monsterHp = m.hp;
    state.monsterMax = m.hp;
    state.farmerHp = state.farmerMax;
    state.attackTimer = 0;
    state.attackPhase = -1;
    state.hitDone = false;
    state.counterTimer = 0;
    state.hitFlash = 0;
    state.shake = 0;
    state.respawn = 0;
    state.farmerDown = 0;
    state.monsterAtk = -1;
    state.monsterHurt = 0;
    state.monsterDie = 0;
    state.combo = 0;
    state.kills = 0;
    state.pops = [];
    state.sparks = [];
    sync();
    render();
  }

  function sync() {
    const m = MONSTER_MAP[state.monster];
    const w = EQUIP_MAP[state.weapon];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.monster === state.monster);
    playBtn.textContent = state.playing ? '暂停' : '继续';
    noteEl.textContent = `${w.name} · ${equipCatName(w.cat)} · 伤害 ${w.dmg}`;
    statusEl.innerHTML =
      `<dt>农夫</dt><dd>${Math.max(0, Math.round(state.farmerHp))} / ${state.farmerMax}</dd>` +
      `<dt>怪物</dt><dd>${m.name} · ${Math.max(0, Math.round(state.monsterHp))} / ${state.monsterMax}</dd>` +
      `<dt>武器</dt><dd>${w.name}</dd>` +
      `<dt>击杀</dt><dd>${state.kills}</dd>` +
      `<dt>连击</dt><dd>${state.combo}</dd>`;
  }

  /* ---------- 战斗逻辑 ---------- */
  function addPop(x, y, text, color) {
    state.pops.push({ x, y, text, color, life: 0.8, vy: -36 });
  }

  function addSparks(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = 30 + Math.random() * 70;
      state.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.45, color });
    }
  }

  function hitMonster() {
    const w = EQUIP_MAP[state.weapon];
    const [lo, hi] = dmgRange(w);
    let dmg = Math.round(lo + Math.random() * (hi - lo + 1));
    let crit = Math.random() < critOf(w);
    if (crit) dmg = Math.round(dmg * 2);
    state.monsterHp -= dmg;
    state.hitFlash = 0.18;
    state.monsterHurt = 0.22;
    state.shake = 0.2;
    addPop(332 + Math.random() * 20, 240, `${dmg}${crit ? '!' : ''}`, crit ? '#ffe060' : '#ff8060');
    addSparks(330, 260, crit ? '#ffe060' : '#ffffff', crit ? 14 : 8);
    state.combo++;
    if (state.monsterHp <= 0) {
      state.monsterHp = 0;
      state.monsterDie = 0.8;
      state.kills++;
      state.respawn = 1.1;
      addPop(330, 220, 'K.O.', '#ffe060');
      addSparks(330, 270, '#e0c060', 18);
    }
  }

  function update(dt) {
    if (!state.playing) return;
    state.time += dt;
    if (state.respawn > 0) {
      state.respawn -= dt;
      if (state.respawn <= 0) {
        const m = MONSTER_MAP[state.monster];
        state.monsterHp = m.hp;
        state.monsterMax = m.hp;
        state.combo = 0;
      }
    }
    if (state.farmerDown > 0) {
      state.farmerDown -= dt;
      if (state.farmerDown <= 0) {
        state.farmerHp = state.farmerMax;
        state.combo = 0;
        state.counterTimer = 0;
      }
    }

    if (state.monsterHp > 0 && state.farmerDown <= 0) {
      if (state.attackPhase < 0) {
        state.attackTimer += dt;
        if (state.attackTimer >= 0.55) {
          state.attackTimer = 0;
          state.attackPhase = 0;
          state.hitDone = false;
        }
      } else {
        state.attackPhase += dt * 2.0;
        if (!state.hitDone && state.attackPhase >= 0.52) {
          state.hitDone = true;
          hitMonster();
        }
        if (state.attackPhase >= 1) state.attackPhase = -1;
      }

      state.counterTimer += dt;
      const m = MONSTER_MAP[state.monster];
      /* 攻击前摇 0.5s，让怪物先蓄力再造成伤害 */
      state.monsterAtk = state.counterTimer >= 1.2
        ? Math.min(1, (state.counterTimer - 1.2) / 0.5)
        : -1;
      if (state.counterTimer >= 1.7) {
        state.counterTimer = 0;
        state.monsterAtk = -1;
        state.farmerHp -= m.dmg;
        addPop(140, 250, `-${m.dmg}`, '#ff6070');
        addSparks(150, 280, '#ff6070', 6);
        state.shake = 0.25;
        if (state.farmerHp <= 0) {
          state.farmerHp = 0;
          state.farmerDown = 1.5;
          addPop(140, 220, '倒地', '#ff6070');
        }
      }
    }

    for (const p of state.pops) {
      p.life -= dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
    }
    state.pops = state.pops.filter(p => p.life > 0);
    for (const s of state.sparks) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 120 * dt;
    }
    state.sparks = state.sparks.filter(s => s.life > 0);
    state.hitFlash = Math.max(0, state.hitFlash - dt);
    state.monsterHurt = Math.max(0, state.monsterHurt - dt);
    state.monsterDie = Math.max(0, state.monsterDie - dt);
    state.shake = Math.max(0, state.shake - dt);
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const m = MONSTER_MAP[state.monster];
    const w = EQUIP_MAP[state.weapon];
    const attacking = state.attackPhase >= 0;
    const shakeX = state.shake > 0 ? Math.round(Math.sin(state.time * 80) * 3 * (state.shake / 0.25)) : 0;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    ctx.save();
    ctx.translate(shakeX, 0);

    /* 农夫影子 */
    ellipse(ctx, 150, 392, 48, 11, 'rgba(0,0,0,0.38)');
    /* 怪物影子 */
    ellipse(ctx, 352, 382, 52, 12, 'rgba(0,0,0,0.35)');

    /* 农夫 */
    ctx.save();
    ctx.translate(70, 192);
    ctx.scale(5, 5);
    const farmerAction = state.farmerDown > 0 ? 'faint' : (attacking ? 'attack' : 'idle');
    const farmerPhase = state.farmerDown > 0
      ? 1 - state.farmerDown / 1.5
      : (attacking ? state.attackPhase : state.time * 0.5);
    drawFarmer(ctx, farmerAction, DIR_RIGHT, farmerPhase);
    ctx.restore();

    /* 剑光 */
    if (attacking && state.attackPhase > 0.35 && state.attackPhase < 0.9) {
      const q = (state.attackPhase - 0.35) / 0.55;
      ctx.save();
      ctx.globalAlpha = 0.55 * (1 - q);
      ctx.strokeStyle = '#ffe6a0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(230, 290, 70 + q * 18, -1.2, 0.2);
      ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(230, 290, 78 + q * 20, -1.1, 0.15);
      ctx.stroke();
      ctx.restore();
    }

    /* 怪物 */
    const alpha = state.respawn > 0 ? Math.max(0.15, state.respawn / 1.1) : 1;
    let mState = 'idle';
    let mT = 0;
    if (state.monsterDie > 0) {
      mState = 'die';
      mT = 1 - state.monsterDie / 0.8;
    } else if (state.monsterHurt > 0) {
      mState = 'hurt';
      mT = 1 - state.monsterHurt / 0.22;
    } else if (state.monsterAtk >= 0) {
      mState = 'attack';
      mT = state.monsterAtk;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (state.hitFlash > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;
    }
    ctx.translate(308, 242);
    ctx.scale(4, 4);
    drawMonster(ctx, m, state.time * 0.5, { state: mState, t: mT });
    ctx.restore();

    /* 火花 */
    for (const s of state.sparks) {
      ctx.globalAlpha = Math.max(0, s.life / 0.45);
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    }
    ctx.globalAlpha = 1;

    /* 伤害数字 */
    ctx.textAlign = 'center';
    for (const p of state.pops) {
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillStyle = p.color;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    ctx.restore();

    /* 血条 */
    const hpBar = (x, y, w, label, hp, max, color) => {
      ctx.fillStyle = 'rgba(10, 12, 16, 0.75)';
      ctx.fillRect(x - 2, y - 2, w + 4, 18);
      ctx.fillStyle = '#2a2a32';
      ctx.fillRect(x, y, w, 6);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.max(0, w * (hp / max)), 6);
      ctx.fillStyle = '#d8e0e8';
      ctx.font = '10px "Microsoft YaHei", monospace';
      ctx.fillText(`${label} ${Math.max(0, Math.round(hp))}/${max}`, x, y + 16);
    };
    hpBar(52, 120, 190, '农夫', state.farmerHp, state.farmerMax, '#5aa04a');
    hpBar(286, 86, 150, m.name, state.monsterHp, state.monsterMax, '#d04a3a');

    /* 武器与连击 */
    ctx.fillStyle = 'rgba(10, 12, 16, 0.7)';
    ctx.fillRect(14, 430, 180, 30);
    ctx.save();
    ctx.translate(20, 438);
    ctx.scale(1.5, 1.5);
    drawEquipment(ctx, w, state.time * 0.4);
    ctx.restore();
    ctx.fillStyle = '#e9c96f';
    ctx.font = '11px "Microsoft YaHei", monospace';
    ctx.fillText(w.name, 72, 450);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '9px monospace';
    ctx.fillText(`DMG ${w.dmg} · CRIT ${w.crit}`, 72, 462);

    if (state.combo > 1) {
      ctx.fillStyle = '#e9c96f';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${state.combo} COMBO`, W - 20, 70);
      ctx.textAlign = 'left';
    }

    if (state.farmerDown > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff7070';
      ctx.font = 'bold 24px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('农夫倒下了…', W / 2, 280);
      ctx.textAlign = 'left';
    }

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 10, 8, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${w.name} vs ${m.name}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`HP ${Math.max(0, Math.round(state.farmerHp))} · kills ${state.kills} · combo ${state.combo}`, 14, H - 10);

    sync();
  }

  function tick(dt) {
    update(dt * state.speed);
    render();
  }

  playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    sync();
  });
  resetBtn.addEventListener('click', reset);
  weaponSelect.addEventListener('change', () => {
    state.weapon = weaponSelect.value;
    state.attackPhase = -1;
    state.attackTimer = 0;
    sync();
    render();
  });
  speedInput.addEventListener('input', () => {
    state.speed = Number(speedInput.value);
    speedOut.textContent = `${state.speed.toFixed(1)}×`;
  });

  applyFilter();
  sync();
  render();

  return {
    activate() { render(); },
    tick,
    getState() {
      return {
        monster: state.monster,
        farmerHp: state.farmerHp,
        monsterHp: state.monsterHp,
        combo: state.combo,
        kills: state.kills,
        monsterAtk: state.monsterAtk,
        monsterHurt: state.monsterHurt,
        monsterDie: state.monsterDie
      };
    }
  };
}
