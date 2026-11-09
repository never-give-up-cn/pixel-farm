/* 料理图鉴面板：81 道菜，分类筛选、厨房大图与图鉴。 */

import {
  DISHES, DISH_MAP, DISH_CATS, dishCatName,
  drawDish, DISH_W, DISH_H
} from './anim/dishes.js';
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

export function initDishPanel() {
  const canvas = document.getElementById('dish-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    dish: 'pumpkin_pie',
    filter: 'all',
    zoom: 10,
    time: 0
  };

  const listHost = document.getElementById('dish-list');
  const filterHost = document.getElementById('dish-filters');
  const statusEl = document.getElementById('dish-status');
  const noteEl = document.getElementById('dish-note');
  const countEl = document.getElementById('dish-count');
  const zoomInput = document.getElementById('dish-zoom');
  const zoomOut = document.getElementById('dish-zoom-out');

  /* ---------- 背景：厨房 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(8181);

    /* 墙砖 */
    g.fillStyle = '#3a3028';
    g.fillRect(0, 0, W, 300);
    for (let y = 0; y < 300; y += 24) {
      for (let x = (y % 48 ? 12 : 0); x < W; x += 24) {
        g.fillStyle = (x + y) % 3 ? '#443a30' : '#4a4034';
        g.fillRect(x, y, 22, 22);
        g.fillStyle = '#2e261e';
        g.fillRect(x, y, 22, 1);
      }
    }
    /* 窗户 */
    g.fillStyle = '#8ac0e0';
    g.fillRect(60, 50, 100, 80);
    g.fillStyle = '#cfe8f4';
    g.fillRect(62, 52, 96, 38);
    g.fillStyle = '#6a4a2a';
    g.fillRect(108, 50, 4, 80);
    g.fillRect(60, 88, 100, 4);

    /* 灶台 */
    g.fillStyle = '#2a2a2a';
    g.fillRect(300, 120, 130, 150);
    g.fillStyle = '#3a3a3a';
    g.fillRect(304, 124, 122, 60);
    g.fillStyle = '#5a5a5a';
    for (let i = 0; i < 2; i++) {
      ellipse(g, 330 + i * 60, 140, 16, 12, '#1a1a1a');
      ellipse(g, 330 + i * 60, 140, 12, 8, '#4a4a4a');
    }
    g.fillStyle = '#d0d0d0';
    g.fillRect(310, 200, 110, 4);
    g.fillRect(310, 230, 110, 4);
    /* 挂锅 */
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#6a6a6a';
      g.fillRect(70 + i * 42, 320, 26, 4);
      g.fillRect(80 + i * 42, 324, 6, 18);
      g.fillStyle = '#4a4a4a';
      g.fillRect(78 + i * 42, 342, 10, 8);
    }
    /* 台面 */
    g.fillStyle = '#8a6238';
    g.fillRect(0, 360, W, 30);
    g.fillStyle = '#a07a4a';
    g.fillRect(0, 360, W, 5);
    g.fillStyle = '#5a3a1a';
    g.fillRect(0, 390, W, H - 390);
    for (let y = 400; y < H; y += 30) g.fillRect(0, y, W, 2);

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 400);
    vg.addColorStop(0, 'rgba(255, 220, 150, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of DISH_CATS) {
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

  for (const d of DISHES) {
    const b = document.createElement('button');
    b.textContent = d.name;
    b.dataset.dish = d.id;
    b.title = `${d.en} · ${dishCatName(d.cat)}`;
    b.addEventListener('click', () => selectDish(d.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const d = DISH_MAP[b.dataset.dish];
      const show = state.filter === 'all' || d.cat === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectDish(id) {
    if (!DISH_MAP[id]) return;
    state.dish = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const d = DISH_MAP[state.dish];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.dish === state.dish);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${dishCatName(d.cat)} · 厨房烹饪 · 第 ${DISHES.indexOf(d) + 1} / ${DISHES.length} 道`;
    statusEl.innerHTML =
      `<dt>料理</dt><dd>${d.name} (${d.en})</dd>` +
      `<dt>分类</dt><dd>${dishCatName(d.cat)}</dd>` +
      `<dt>来源</dt><dd>厨房 / 野炊工具</dd>` +
      `<dt>编号</dt><dd>${DISHES.indexOf(d) + 1} / ${DISHES.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const d = DISH_MAP[state.dish];
    const z = state.zoom;
    const sw = DISH_W * z;
    const sh = DISH_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 240 - sh / 2 + Math.round(Math.sin(state.time * 1.8) * 2);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    ellipse(ctx, W / 2, 430, 100, 10, 'rgba(0,0,0,0.35)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawDish(ctx, d, state.time * 0.6);
    ctx.restore();

    ctx.fillStyle = 'rgba(12, 9, 7, 0.8)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${d.name} · ${dishCatName(d.cat)}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${d.en}   dish ${DISHES.indexOf(d) + 1}/${DISHES.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const d = DISH_MAP[state.dish];
    const cell = makeCanvas(DISH_W, DISH_H);
    drawDish(cell.ctx, d, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = DISH_W * scale;
    out.height = DISH_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-dish-${d.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(11, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('dish-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('dish-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'dgrid';

    for (const d of DISHES) {
      const cell = document.createElement('div');
      cell.className = 'dcell';
      cell.title = `${d.en} · ${dishCatName(d.cat)}`;
      const cv = document.createElement('canvas');
      cv.width = DISH_W;
      cv.height = DISH_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawDish(g, d, 0.25);
      const name = document.createElement('b');
      name.textContent = d.name;
      const cat = document.createElement('span');
      cat.textContent = dishCatName(d.cat);
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(cat);
      cell.addEventListener('click', () => {
        state.dish = d.id;
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
