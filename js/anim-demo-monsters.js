/* 怪物图鉴面板：49 种怪物，地点筛选、洞穴大图与图鉴。 */

import {
  MONSTERS, MONSTER_MAP, MONSTER_LOCS, monsterLocName,
  drawMonster, MONSTER_W, MONSTER_H
} from './anim/monsters.js';
import { mulberry32, ellipse } from './anim/pixel.js';

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

export function initMonsterPanel() {
  const canvas = document.getElementById('monster-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    monster: 'green_slime',
    filter: 'all',
    zoom: 8,
    time: 0
  };

  const listHost = document.getElementById('monster-list');
  const filterHost = document.getElementById('monster-filters');
  const statusEl = document.getElementById('monster-status');
  const noteEl = document.getElementById('monster-note');
  const countEl = document.getElementById('monster-count');
  const zoomInput = document.getElementById('monster-zoom');
  const zoomOut = document.getElementById('monster-zoom-out');

  /* ---------- 背景：洞穴 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(4949);

    g.fillStyle = '#171a20';
    g.fillRect(0, 0, W, H);
    /* 岩壁 */
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(rnd() * W);
      const y = Math.floor(rnd() * 330);
      const w = 14 + Math.floor(rnd() * 28);
      const h = 8 + Math.floor(rnd() * 18);
      g.fillStyle = i % 3 ? '#22262e' : '#1c2028';
      g.fillRect(x, y, w, h);
      g.fillStyle = '#2e333c';
      g.fillRect(x, y, w, 1);
    }
    /* 钟乳石 */
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 40;
      const h = 12 + Math.floor(rnd() * 30);
      for (let j = 0; j < h; j++) {
        const w = Math.max(1, Math.floor((h - j) / 5));
        g.fillStyle = '#2a2f38';
        g.fillRect(x - w, j, w * 2, 1);
      }
    }
    /* 地面 */
    g.fillStyle = '#2a2a24';
    g.fillRect(0, 340, W, H - 340);
    g.fillStyle = '#36362e';
    g.fillRect(0, 340, W, 4);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = i % 2 ? '#3f4038' : '#23231e';
      g.fillRect(Math.floor(rnd() * W), 350 + Math.floor(rnd() * 120), 4, 2);
    }
    /* 火把 */
    for (let i = 0; i < 2; i++) {
      const x = i ? 400 : 70;
      g.fillStyle = '#5a3a1a';
      g.fillRect(x, 220, 4, 50);
      const f = 6 + Math.floor(rnd() * 4);
      g.fillStyle = '#e07a2a';
      g.fillRect(x - f / 2, 210, f, 12);
      g.fillStyle = '#f0c050';
      g.fillRect(x - 2, 202, 4, 10);
    }
    const vg = g.createRadialGradient(W / 2, 260, 100, W / 2, 260, 380);
    vg.addColorStop(0, 'rgba(240, 160, 80, 0.10)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const loc of MONSTER_LOCS) {
    const b = document.createElement('button');
    b.textContent = loc.name;
    b.dataset.filter = loc.id;
    b.addEventListener('click', () => {
      state.filter = loc.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const m of MONSTERS) {
    const b = document.createElement('button');
    b.textContent = m.name;
    b.dataset.monster = m.id;
    b.title = `${m.en} · ${monsterLocName(m.loc)} · HP ${m.hp}`;
    b.addEventListener('click', () => selectMonster(m.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const m = MONSTER_MAP[b.dataset.monster];
      const show = state.filter === 'all' || m.loc === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectMonster(id) {
    if (!MONSTER_MAP[id]) return;
    state.monster = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const m = MONSTER_MAP[state.monster];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.monster === state.monster);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${monsterLocName(m.loc)} · HP ${m.hp} · 伤害 ${m.dmg}`;
    statusEl.innerHTML =
      `<dt>怪物</dt><dd>${m.name} (${m.en})</dd>` +
      `<dt>地点</dt><dd>${monsterLocName(m.loc)}</dd>` +
      `<dt>生命</dt><dd>${m.hp}</dd>` +
      `<dt>伤害</dt><dd>${m.dmg}</dd>` +
      `<dt>编号</dt><dd>${MONSTERS.indexOf(m) + 1} / ${MONSTERS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const m = MONSTER_MAP[state.monster];
    const z = state.zoom;
    const sw = MONSTER_W * z;
    const sh = MONSTER_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 250 - sh / 2 + Math.round(Math.sin(state.time * 2) * 3);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);
    ellipse(ctx, W / 2, sy + 27 * z, Math.round(sw * 0.28), Math.round(z * 1.4), 'rgba(0,0,0,0.45)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawMonster(ctx, m, state.time * 0.6);
    ctx.restore();

    ctx.fillStyle = 'rgba(10, 10, 12, 0.8)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${m.name} · ${monsterLocName(m.loc)} · HP ${m.hp}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${m.en}   damage ${m.dmg}   monster ${MONSTERS.indexOf(m) + 1}/${MONSTERS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const m = MONSTER_MAP[state.monster];
    const cell = makeCanvas(MONSTER_W, MONSTER_H);
    drawMonster(cell.ctx, m, 0.5);
    const scale = 6;
    const out = document.createElement('canvas');
    out.width = MONSTER_W * scale;
    out.height = MONSTER_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-monster-${m.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(11, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('monster-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('monster-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'mogrid';

    for (const m of MONSTERS) {
      const cell = document.createElement('div');
      cell.className = 'mocell';
      cell.title = `${m.en} · ${monsterLocName(m.loc)} · HP ${m.hp}`;
      const cv = document.createElement('canvas');
      cv.width = MONSTER_W;
      cv.height = MONSTER_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawMonster(g, m, 0.25);
      const name = document.createElement('b');
      name.textContent = m.name;
      const meta = document.createElement('span');
      meta.textContent = `${monsterLocName(m.loc)} · HP ${m.hp}`;
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        state.monster = m.id;
        sync();
        render();
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      grid.appendChild(cell);
    }

    host.appendChild(grid);
  }

  function tick(dt) {
    state.time += dt;
    render();
  }

  buildGallery();
  applyFilter();
  sync();
  render();

  return {
    activate() { render(); },
    tick
  };
}

function download(canvas, name) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  });
}
