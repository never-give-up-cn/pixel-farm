/* 鱼类图鉴面板：72 种鱼/水生生物，类型筛选、水族箱大图与图鉴。 */

import {
  FISH, FISH_MAP, FISH_TYPES, fishTypeName,
  drawFishIcon, FISH_W, FISH_H
} from './anim/fish.js';
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

export function initFishPanel() {
  const canvas = document.getElementById('fish-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    fish: 'legend',
    filter: 'all',
    zoom: 8,
    time: 0
  };

  const listHost = document.getElementById('fish-list');
  const filterHost = document.getElementById('fish-filters');
  const statusEl = document.getElementById('fish-status');
  const noteEl = document.getElementById('fish-note');
  const countEl = document.getElementById('fish-count');
  const zoomInput = document.getElementById('fish-zoom');
  const zoomOut = document.getElementById('fish-zoom-out');

  /* ---------- 背景：水族箱 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(9090);

    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#123a5a');
    grad.addColorStop(0.55, '#0e2a44');
    grad.addColorStop(1, '#081826');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    /* 水草 */
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 40 + Math.floor(rnd() * 12);
      const h = 40 + Math.floor(rnd() * 100);
      for (let j = 0; j < h; j += 4) {
        g.fillStyle = j % 8 ? '#1e5a3a' : '#2a7a4a';
        g.fillRect(x + Math.round(Math.sin(j * 0.12 + i) * 2), H - 50 - j, 2, 4);
      }
    }
    /* 沙地 */
    g.fillStyle = '#2a3a3a';
    g.fillRect(0, H - 50, W, 50);
    g.fillStyle = '#3a4a44';
    g.fillRect(0, H - 50, W, 8);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 2 ? '#4a5a50' : '#2f403a';
      g.fillRect(Math.floor(rnd() * W), H - 40 + Math.floor(rnd() * 30), 4, 2);
    }

    /* 气泡 */
    for (let i = 0; i < 24; i++) {
      const x = Math.floor(rnd() * W);
      const y = 80 + Math.floor(rnd() * 360);
      g.strokeStyle = 'rgba(160, 210, 240, 0.35)';
      g.beginPath();
      g.arc(x, y, 2 + Math.floor(rnd() * 3), 0, Math.PI * 2);
      g.stroke();
    }

    const vg = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 360);
    vg.addColorStop(0, 'rgba(120, 180, 220, 0.10)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const ft of FISH_TYPES) {
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

  for (const f of FISH) {
    const b = document.createElement('button');
    b.textContent = f.name;
    b.dataset.fish = f.id;
    b.title = `${f.en} · ${fishTypeName(f.type)} · ${f.price}g`;
    b.addEventListener('click', () => selectFish(f.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const f = FISH_MAP[b.dataset.fish];
      const show = state.filter === 'all' || f.type === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectFish(id) {
    if (!FISH_MAP[id]) return;
    state.fish = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const f = FISH_MAP[state.fish];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.fish === state.fish);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${fishTypeName(f.type)} · ${f.seasons}季 · ${f.place} · 基础售价 ${f.price}g`;
    statusEl.innerHTML =
      `<dt>鱼类</dt><dd>${f.name} (${f.en})</dd>` +
      `<dt>类型</dt><dd>${fishTypeName(f.type)}</dd>` +
      `<dt>售价</dt><dd>${f.price}g</dd>` +
      `<dt>季节</dt><dd>${f.seasons}</dd>` +
      `<dt>地点</dt><dd>${f.place}</dd>` +
      `<dt>编号</dt><dd>${FISH.indexOf(f) + 1} / ${FISH.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const f = FISH_MAP[state.fish];
    const z = state.zoom;
    const sw = FISH_W * z;
    const sh = FISH_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = Math.round(230 - sh / 2 + Math.sin(state.time * 1.4) * 6);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 光柱 */
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#bfe0ff';
    ctx.beginPath();
    ctx.moveTo(140, 0); ctx.lineTo(220, 0); ctx.lineTo(300, H); ctx.lineTo(220, H);
    ctx.fill();
    ctx.globalAlpha = 1;

    /* 气泡动画 */
    for (let i = 0; i < 6; i++) {
      const bx = 60 + i * 70;
      const by = 420 - ((state.time * 30 + i * 60) % 360);
      ctx.strokeStyle = 'rgba(180, 220, 250, 0.3)';
      ctx.beginPath();
      ctx.arc(bx, by, 3 + (i % 3), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawFishIcon(ctx, f, state.time * 0.4);
    ctx.restore();

    ctx.fillStyle = 'rgba(6, 16, 24, 0.78)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#7fd4ff';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${f.name} · ${fishTypeName(f.type)}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${f.en}   ${f.price}g   ${f.seasons}   fish ${FISH.indexOf(f) + 1}/${FISH.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const f = FISH_MAP[state.fish];
    const cell = makeCanvas(FISH_W, FISH_H);
    drawFishIcon(cell.ctx, f, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = FISH_W * scale;
    out.height = FISH_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-fish-${f.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(10, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('fish-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('fish-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'fgrid';

    for (const f of FISH) {
      const cell = document.createElement('div');
      cell.className = 'fcell';
      cell.title = `${f.en} · ${fishTypeName(f.type)} · ${f.price}g`;
      const cv = document.createElement('canvas');
      cv.width = FISH_W;
      cv.height = FISH_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawFishIcon(g, f, 0.25);
      const name = document.createElement('b');
      name.textContent = f.name;
      const price = document.createElement('span');
      price.textContent = `${f.price}g`;
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(price);
      cell.addEventListener('click', () => {
        state.fish = f.id;
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
