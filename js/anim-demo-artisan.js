/* 工匠品图鉴面板：28 种加工品，类别筛选、工坊大图与图鉴。 */

import {
  ARTISANS, ARTISAN_MAP, ARTISAN_CATS, artisanCatName,
  drawArtisan, ARTISAN_W, ARTISAN_H
} from './anim/artisan.js';
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

export function initArtisanPanel() {
  const canvas = document.getElementById('artisan-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'wine',
    filter: 'all',
    zoom: 10,
    time: 0
  };

  const listHost = document.getElementById('artisan-list');
  const filterHost = document.getElementById('artisan-filters');
  const statusEl = document.getElementById('artisan-status');
  const noteEl = document.getElementById('artisan-note');
  const countEl = document.getElementById('artisan-count');
  const zoomInput = document.getElementById('artisan-zoom');
  const zoomOut = document.getElementById('artisan-zoom-out');

  /* ---------- 背景：工坊 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(2727);

    g.fillStyle = '#241c18';
    g.fillRect(0, 0, W, H);
    /* 木板墙 */
    for (let y = 0; y < 330; y += 32) {
      g.fillStyle = y % 64 ? '#2f2520' : '#362a24';
      g.fillRect(0, y, W, 30);
      g.fillStyle = '#1a1410';
      g.fillRect(0, y + 30, W, 2);
      for (let x = 0; x < W; x += 110) {
        g.fillStyle = '#1f1813';
        g.fillRect(x, y, 1, 30);
      }
    }
    /* 架子 */
    g.fillStyle = '#5a4030';
    g.fillRect(40, 120, W - 80, 6);
    g.fillRect(40, 210, W - 80, 6);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = ['#8a2a4a', '#e0a03a', '#6a9a3a', '#4a8ac0'][i % 4];
      g.fillRect(58 + i * 52, 96, 8, 22);
      g.fillStyle = '#d8c0a0';
      g.fillRect(62 + i * 52, 92, 2, 4);
    }
    /* 地面 */
    g.fillStyle = '#3a2a20';
    g.fillRect(0, 330, W, H - 330);
    g.fillStyle = '#4a3628';
    for (let y = 340; y < H; y += 24) {
      g.fillRect(0, y, W, 2);
    }
    /* 工作台 */
    g.fillStyle = '#6b4a2a';
    g.fillRect(80, 430, W - 160, 20);
    g.fillStyle = '#8a6238';
    g.fillRect(80, 430, W - 160, 4);
    g.fillStyle = '#4a3018';
    g.fillRect(100, 450, 12, 70);
    g.fillRect(W - 112, 450, 12, 70);

    const vg = g.createRadialGradient(W / 2, 260, 120, W / 2, 260, 400);
    vg.addColorStop(0, 'rgba(240, 210, 160, 0.10)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of ARTISAN_CATS) {
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

  for (const a of ARTISANS) {
    const b = document.createElement('button');
    b.textContent = a.name;
    b.dataset.item = a.id;
    b.title = `${a.en} · ${artisanCatName(a.cat)} · ${a.machine}`;
    b.addEventListener('click', () => selectItem(a.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const a = ARTISAN_MAP[b.dataset.item];
      const show = state.filter === 'all' || a.cat === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectItem(id) {
    if (!ARTISAN_MAP[id]) return;
    state.item = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const a = ARTISAN_MAP[state.item];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.item === state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${artisanCatName(a.cat)} · 加工设备：${a.machine} · ${a.desc}`;
    statusEl.innerHTML =
      `<dt>工匠品</dt><dd>${a.name} (${a.en})</dd>` +
      `<dt>类别</dt><dd>${artisanCatName(a.cat)}</dd>` +
      `<dt>设备</dt><dd>${a.machine}</dd>` +
      `<dt>编号</dt><dd>${ARTISANS.indexOf(a) + 1} / ${ARTISANS.length}</dd>` +
      `<dt>说明</dt><dd>${a.desc}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const a = ARTISAN_MAP[state.item];
    const z = state.zoom;
    const sw = ARTISAN_W * z;
    const sh = ARTISAN_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 250 - sh / 2 + Math.round(Math.sin(state.time * 1.6) * 2);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 台面阴影 */
    ellipse(ctx, W / 2, 436, 100, 10, 'rgba(0,0,0,0.35)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawArtisan(ctx, a, state.time * 0.6);
    ctx.restore();

    ctx.fillStyle = 'rgba(12, 9, 7, 0.8)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${a.name} · ${artisanCatName(a.cat)} · ${a.machine}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${a.en}   artisan ${ARTISANS.indexOf(a) + 1}/${ARTISANS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const a = ARTISAN_MAP[state.item];
    const cell = makeCanvas(ARTISAN_W, ARTISAN_H);
    drawArtisan(cell.ctx, a, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = ARTISAN_W * scale;
    out.height = ARTISAN_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-artisan-${a.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(11, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('artisan-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('artisan-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'agrid2';

    for (const a of ARTISANS) {
      const cell = document.createElement('div');
      cell.className = 'acell2';
      cell.title = `${a.en} · ${a.machine}`;
      const cv = document.createElement('canvas');
      cv.width = ARTISAN_W;
      cv.height = ARTISAN_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawArtisan(g, a, 0.25);
      const name = document.createElement('b');
      name.textContent = a.name;
      const cat = document.createElement('span');
      cat.textContent = artisanCatName(a.cat);
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(cat);
      cell.addEventListener('click', () => {
        state.item = a.id;
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
