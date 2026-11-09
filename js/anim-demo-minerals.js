/* 矿物图鉴面板：53 种矿物/宝石，支持类型筛选、放大、闪光与图标导出。 */

import {
  MINERALS, MINERAL_MAP, MINERAL_TYPES, mineralTypeName,
  drawMineral, MINERAL_W, MINERAL_H
} from './anim/minerals.js';
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

export function initMineralPanel() {
  const canvas = document.getElementById('mineral-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    mineral: 'prismatic_shard',
    filter: 'all',
    zoom: 10,
    time: 0
  };

  const listHost = document.getElementById('mineral-list');
  const filterHost = document.getElementById('mineral-filters');
  const statusEl = document.getElementById('mineral-status');
  const noteEl = document.getElementById('mineral-note');
  const countEl = document.getElementById('mineral-count');
  const zoomInput = document.getElementById('mineral-zoom');
  const zoomOut = document.getElementById('mineral-zoom-out');

  /* ---------- 背景：矿洞石壁 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(8080);

    g.fillStyle = '#171a20';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1f232b';
    g.fillRect(0, 160, W, H - 160);
    g.fillStyle = '#262b35';
    g.fillRect(0, 360, W, H - 360);

    for (let i = 0; i < 90; i++) {
      const x = Math.floor(rnd() * W);
      const y = 30 + Math.floor(rnd() * (H - 80));
      const w = 8 + Math.floor(rnd() * 24);
      const h = 4 + Math.floor(rnd() * 12);
      g.fillStyle = i % 3 ? '#2a303a' : '#20252d';
      g.fillRect(x, y, w, h);
      g.fillStyle = '#343b47';
      g.fillRect(x, y, w, 1);
    }

    /* 远处水晶 */
    for (let i = 0; i < 16; i++) {
      const x = Math.floor(rnd() * W);
      const y = 80 + Math.floor(rnd() * 180);
      const h = 6 + Math.floor(rnd() * 10);
      g.fillStyle = ['#3a5a7a', '#4a3a6a', '#2a5a4a'][i % 3];
      g.fillRect(x, y, 2, h);
      g.fillStyle = '#7aa0c0';
      g.fillRect(x, y, 1, 2);
    }

    /* 石台 */
    const px = 120, py = 410, pw = 240, ph = 54;
    g.fillStyle = '#3a332c';
    g.fillRect(px, py, pw, ph);
    g.fillStyle = '#4a4238';
    g.fillRect(px, py, pw, 8);
    g.fillStyle = '#2a251f';
    g.fillRect(px, py + ph - 8, pw, 8);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = i % 2 ? '#5a5044' : '#322c25';
      g.fillRect(px + 12 + i * 30, py + 16, 22, 8);
    }

    const vg = g.createRadialGradient(W / 2, 250, 60, W / 2, 250, 420);
    vg.addColorStop(0, 'rgba(140, 160, 200, 0.12)');
    vg.addColorStop(0.4, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const ft of MINERAL_TYPES) {
    const b = document.createElement('button');
    b.textContent = ft.name;
    b.dataset.filter = ft.id;
    b.addEventListener('click', () => {
      state.filter = ft.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const m of MINERALS) {
    const b = document.createElement('button');
    b.textContent = m.name;
    b.dataset.mineral = m.id;
    b.title = `${m.en} · ${mineralTypeName(m.type)} · ${m.price}g`;
    b.addEventListener('click', () => selectMineral(m.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const m = MINERAL_MAP[b.dataset.mineral];
      const show = state.filter === 'all' || m.type === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectMineral(id) {
    if (!MINERAL_MAP[id]) return;
    state.mineral = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const m = MINERAL_MAP[state.mineral];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.mineral === state.mineral);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;

    const source = m.type === 'gem' ? '矿洞 / 晶洞 / 淘金'
      : m.type === 'foraged' ? '矿井地面 / 淘金'
        : '敲开晶洞';
    noteEl.textContent = `${mineralTypeName(m.type)} · ${source} · 基础售价 ${m.price}g`;
    statusEl.innerHTML =
      `<dt>矿物</dt><dd>${m.name} (${m.en})</dd>` +
      `<dt>类型</dt><dd>${mineralTypeName(m.type)}</dd>` +
      `<dt>售价</dt><dd>${m.price}g</dd>` +
      `<dt>来源</dt><dd>${source}</dd>` +
      `<dt>收藏</dt><dd>${MINERALS.indexOf(m) + 1} / ${MINERALS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const m = MINERAL_MAP[state.mineral];
    const z = state.zoom;
    const sw = MINERAL_W * z;
    const sh = MINERAL_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 130 + Math.round(Math.sin(state.time * 2) * 2);
    const phase = state.time * 0.8;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 光晕 */
    const glow = ctx.createRadialGradient(W / 2, 260, 10, W / 2, 260, 130);
    glow.addColorStop(0, 'rgba(160, 190, 255, 0.16)');
    glow.addColorStop(1, 'rgba(160, 190, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 120, W, 300);

    ellipse(ctx, W / 2, 402, 82, 12, 'rgba(0, 0, 0, 0.4)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawMineral(ctx, m, phase);
    ctx.restore();

    ctx.fillStyle = 'rgba(10, 14, 18, 0.78)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${m.name} · ${mineralTypeName(m.type)}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${m.en}   ${m.price}g   mineral ${MINERALS.indexOf(m) + 1}/${MINERALS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const m = MINERAL_MAP[state.mineral];
    const cell = makeCanvas(MINERAL_W, MINERAL_H);
    drawMineral(cell.ctx, m, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = MINERAL_W * scale;
    out.height = MINERAL_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-mineral-${m.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(11, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('mineral-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('mineral-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'mgrid';

    for (const m of MINERALS) {
      const cell = document.createElement('div');
      cell.className = 'mcell';
      cell.title = `${m.en} · ${mineralTypeName(m.type)} · ${m.price}g`;
      const cv = document.createElement('canvas');
      cv.width = MINERAL_W;
      cv.height = MINERAL_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawMineral(g, m, 0.25);
      const name = document.createElement('b');
      name.textContent = m.name;
      const price = document.createElement('span');
      price.textContent = `${m.price}g`;
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(price);
      cell.addEventListener('click', () => {
        state.mineral = m.id;
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
