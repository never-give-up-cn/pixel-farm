/* 宠物图鉴面板：猫、狗、乌龟、马与铱星变体。
 * 农场院子场景，支持站立 / 走路和四方向预览。 */

import {
  PETS, PET_MAP, PET_CATS, petKindName, drawPet, drawPetIcon, PET_W, PET_H
} from './anim/pets.js';
import { DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP, R, mulberry32, ellipse, line, TAU } from './anim/pixel.js';

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

export function initPetPanel() {
  const canvas = document.getElementById('pet-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    pet: 'orange_tabby',
    filter: 'all',
    action: 'idle',
    zoom: 6,
    time: 0
  };

  const listHost = document.getElementById('pet-list');
  const filterHost = document.getElementById('pet-filters');
  const statusEl = document.getElementById('pet-status');
  const noteEl = document.getElementById('pet-note');
  const countEl = document.getElementById('pet-count');
  const zoomInput = document.getElementById('pet-zoom');
  const zoomOut = document.getElementById('pet-zoom-out');
  const idleBtn = document.getElementById('pet-idle');
  const walkBtn = document.getElementById('pet-walk');

  /* ---------- 背景：农场院子 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(3131);

    /* 天空 */
    const sky = g.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#6aa8d8');
    sky.addColorStop(1, '#b8d8e8');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, 260);
    /* 云 */
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 120, y = 40 + (i % 2) * 24;
      g.fillStyle = '#e8f4ff';
      g.fillRect(x, y, 40, 10);
      g.fillRect(x + 8, y - 6, 26, 8);
    }
    /* 远山 */
    g.fillStyle = '#8ab08a';
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo(i * 70 - 40, 250);
      g.lineTo(i * 70 + 10, 180);
      g.lineTo(i * 70 + 60, 250);
      g.closePath();
      g.fill();
    }

    /* 草地 */
    g.fillStyle = '#5a9a4a';
    g.fillRect(0, 250, W, H - 250);
    g.fillStyle = '#68a854';
    g.fillRect(0, 250, W, 4);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = i % 3 ? '#4a8a3a' : '#78b860';
      g.fillRect(Math.floor(rnd() * W), 260 + Math.floor(rnd() * 240), 2, 4);
    }

    /* 栅栏 */
    g.fillStyle = '#8a6238';
    for (let i = 0; i < 10; i++) g.fillRect(i * 54, 300, 7, 70);
    g.fillRect(0, 316, W, 6);
    g.fillRect(0, 346, W, 6);

    /* 谷仓 */
    g.fillStyle = '#8a3a2a';
    g.fillRect(300, 120, 140, 110);
    g.fillStyle = '#a04a32';
    g.fillRect(306, 126, 128, 98);
    g.fillStyle = '#5a2a1a';
    g.fillRect(354, 170, 32, 54);
    g.fillStyle = '#d8c0a0';
    g.fillRect(360, 176, 20, 20);
    g.fillStyle = '#8a3a2a';
    line(g, 360, 176, 380, 196, '#8a3a2a', 2);
    line(g, 380, 176, 360, 196, '#8a3a2a', 2);
    g.fillStyle = '#5a2a1a';
    g.fillRect(300, 120, 140, 6);

    /* 树 */
    g.fillStyle = '#6a4a2a';
    g.fillRect(58, 190, 12, 90);
    g.fillStyle = '#3a6a2a';
    ellipse(g, 64, 170, 38, 30, '#3a6a2a');
    ellipse(g, 64, 160, 30, 24, '#4a8a32');
    ellipse(g, 48, 178, 20, 16, '#5aa04a');
    ellipse(g, 82, 176, 18, 14, '#5aa04a');

    /* 宠物碗 */
    ellipse(g, 392, 382, 16, 5, '#3a7a2a');
    R(g, 378, 376, 28, 7, '#5a8a4a');
    R(g, 380, 377, 24, 3, '#8ac07a');
    R(g, 384, 377, 16, 2, '#4ac0e0');

    /* 狗屋 */
    g.fillStyle = '#8a5a3a';
    g.fillRect(28, 300, 58, 48);
    g.fillStyle = '#a07048';
    g.fillRect(32, 304, 50, 40);
    g.fillStyle = '#5a3a22';
    for (let i = 0; i < 7; i++) g.fillRect(24 + i * 8, 300 - i * 4, 10, 5);
    g.fillStyle = '#2a1a14';
    g.fillRect(46, 324, 22, 24);

    /* 花 */
    for (let i = 0; i < 16; i++) {
      const x = 20 + (i * 29) % 440, y = 370 + (i * 13) % 100;
      g.fillStyle = ['#e8d050', '#e08ab0', '#f0f0e8'][i % 3];
      g.fillRect(x, y, 3, 3);
      g.fillStyle = '#3a6a2a';
      g.fillRect(x + 1, y + 3, 1, 4);
    }

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of PET_CATS) {
    const b = document.createElement('button');
    b.textContent = cat.name;
    b.dataset.filter = cat.id;
    b.addEventListener('click', () => {
      state.filter = cat.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const p of PETS) {
    const b = document.createElement('button');
    b.textContent = p.name;
    b.dataset.pet = p.id;
    b.title = `${p.en} · ${petKindName(p.kind)}`;
    b.addEventListener('click', () => selectPet(p.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const p = PET_MAP[b.dataset.pet];
      const show = state.filter === 'all' || p.kind === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectPet(id) {
    if (!PET_MAP[id]) return;
    state.pet = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const p = PET_MAP[state.pet];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.pet === state.pet);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${petKindName(p.kind)} · ${state.action === 'walk' ? '走路' : '站立'}`;
    statusEl.innerHTML =
      `<dt>宠物</dt><dd>${p.name} (${p.en})</dd>` +
      `<dt>类型</dt><dd>${petKindName(p.kind)}</dd>` +
      `<dt>动作</dt><dd>${state.action === 'walk' ? '走路' : '站立'}</dd>` +
      `<dt>编号</dt><dd>${PETS.indexOf(p) + 1} / ${PETS.length}</dd>`;
    idleBtn.classList.toggle('active', state.action === 'idle');
    walkBtn.classList.toggle('active', state.action === 'walk');
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const p = PET_MAP[state.pet];
    const z = state.zoom;
    const phase = state.time * 0.5;
    const sw = PET_W * z;
    const sh = PET_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 350 - sh;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    ellipse(ctx, W / 2, 356, Math.round(sw * 0.26), Math.round(z * 0.9), 'rgba(0,0,0,0.28)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawPet(ctx, p, state.action, DIR_RIGHT, phase);
    ctx.restore();

    /* 四方向 */
    const dirs = [
      { d: DIR_DOWN, label: '下' },
      { d: DIR_LEFT, label: '左' },
      { d: DIR_RIGHT, label: '右' },
      { d: DIR_UP, label: '上' }
    ];
    dirs.forEach((m, i) => {
      const x = 44 + i * 100;
      const y = 370;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(2, 2);
      drawPet(ctx, p, 'idle', m.d, phase + i * 0.1);
      ctx.restore();
      ctx.fillStyle = '#d8e8c0';
      ctx.font = '10px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, x + 40, 442);
      ctx.textAlign = 'left';
    });

    /* 漂浮粒子 */
    const rnd = mulberry32(PETS.indexOf(p) + 19);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.7 + rnd() * TAU) * (sw * 0.3 + rnd() * 30);
      const py = sy + sh * 0.35 + Math.sin(state.time * 1.1 + i) * 40;
      ctx.globalAlpha = 0.15 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.4;
      ctx.fillStyle = i % 2 ? '#fff0a0' : '#e0f0ff';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(12, 10, 8, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.name} · ${petKindName(p.kind)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${p.en}   pet ${PETS.indexOf(p) + 1}/${PETS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const p = PET_MAP[state.pet];
    const cell = makeCanvas(PET_W, PET_H);
    drawPetIcon(cell.ctx, p, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = PET_W * scale;
    out.height = PET_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-pet-${p.id}.png`);
  }

  idleBtn.addEventListener('click', () => { state.action = 'idle'; sync(); render(); });
  walkBtn.addEventListener('click', () => { state.action = 'walk'; sync(); render(); });

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(4, Math.min(8, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('pet-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('pet-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'pgrid';

    for (const p of PETS) {
      const cell = document.createElement('div');
      cell.className = 'pcell';
      cell.title = `${p.en} · ${petKindName(p.kind)}`;
      const cv = document.createElement('canvas');
      cv.width = PET_W;
      cv.height = PET_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawPetIcon(g, p, 0.25);
      const name = document.createElement('b');
      name.textContent = p.name;
      const meta = document.createElement('span');
      meta.textContent = petKindName(p.kind);
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        state.pet = p.id;
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
