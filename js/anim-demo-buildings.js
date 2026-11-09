/* 农场建筑图鉴面板：25 种建筑，类别筛选、农场大图与图鉴。 */

import {
  BUILDINGS, BUILDING_MAP, BUILDING_TYPES, buildingTypeName,
  drawBuilding, BUILDING_W, BUILDING_H
} from './anim/buildings.js';
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

export function initBuildingPanel() {
  const canvas = document.getElementById('building-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    building: 'farmhouse',
    filter: 'all',
    zoom: 6,
    time: 0
  };

  const listHost = document.getElementById('building-list');
  const filterHost = document.getElementById('building-filters');
  const statusEl = document.getElementById('building-status');
  const noteEl = document.getElementById('building-note');
  const countEl = document.getElementById('building-count');
  const zoomInput = document.getElementById('building-zoom');
  const zoomOut = document.getElementById('building-zoom-out');

  /* ---------- 背景：农场 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(6060);

    const sky = g.createLinearGradient(0, 0, 0, 220);
    sky.addColorStop(0, '#8fc8e8');
    sky.addColorStop(1, '#cfe8f0');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, 220);

    /* 远山 */
    g.fillStyle = '#6a9a6a';
    for (let i = 0; i < 6; i++) {
      const x = i * 90 - 20;
      g.beginPath();
      g.moveTo(x, 220);
      g.lineTo(x + 60, 130 + (i % 2) * 20);
      g.lineTo(x + 140, 220);
      g.fill();
    }

    /* 草地 */
    g.fillStyle = '#4a8a3a';
    g.fillRect(0, 210, W, H - 210);
    g.fillStyle = '#559a42';
    g.fillRect(0, 250, W, H - 250);
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(rnd() * W);
      const y = 220 + Math.floor(rnd() * (H - 240));
      g.fillStyle = rnd() > 0.5 ? '#3f7a32' : '#62a84a';
      g.fillRect(x, y, 1, 2 + Math.floor(rnd() * 2));
    }

    /* 栅栏 */
    g.fillStyle = '#8a5a34';
    for (let x = 20; x < W; x += 54) {
      g.fillRect(x, 250, 4, 34);
      g.fillStyle = '#6b4226';
      g.fillRect(x + 3, 250, 1, 34);
      g.fillStyle = '#8a5a34';
    }
    g.fillRect(0, 260, W, 4);
    g.fillRect(0, 274, W, 4);

    /* 小路 */
    g.fillStyle = '#b09a70';
    g.fillRect(190, 400, 100, 120);
    g.fillStyle = '#c0aa80';
    for (let i = 0; i < 12; i++) g.fillRect(196 + (i % 4) * 24, 408 + Math.floor(i / 4) * 24, 16, 10);

    const vg = g.createRadialGradient(W / 2, 330, 120, W / 2, 330, 400);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const bt of BUILDING_TYPES) {
    const b = document.createElement('button');
    b.textContent = bt.name;
    b.dataset.filter = bt.id;
    b.addEventListener('click', () => {
      state.filter = bt.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const b of BUILDINGS) {
    const btn = document.createElement('button');
    btn.textContent = b.name;
    btn.dataset.building = b.id;
    btn.title = `${b.en} · ${b.w}×${b.h} · ${b.cost}g`;
    btn.addEventListener('click', () => selectBuilding(b.id));
    listHost.appendChild(btn);
  }

  function applyFilter() {
    let n = 0;
    for (const btn of listHost.children) {
      const b = BUILDING_MAP[btn.dataset.building];
      const show = state.filter === 'all' || b.type === state.filter;
      btn.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const btn of filterHost.children) {
      btn.classList.toggle('active', btn.dataset.filter === state.filter);
    }
  }

  function selectBuilding(id) {
    if (!BUILDING_MAP[id]) return;
    state.building = id;
    sync();
    const btn = listHost.querySelector('button.active');
    if (btn) btn.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const b = BUILDING_MAP[state.building];
    for (const btn of listHost.children) btn.classList.toggle('active', btn.dataset.building === state.building);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${buildingTypeName(b.type)} · ${b.w}×${b.h} 格 · ${b.cost.toLocaleString()}g`;
    statusEl.innerHTML =
      `<dt>建筑</dt><dd>${b.name} (${b.en})</dd>` +
      `<dt>类别</dt><dd>${buildingTypeName(b.type)}</dd>` +
      `<dt>占地</dt><dd>${b.w} × ${b.h}</dd>` +
      `<dt>价格</dt><dd>${b.cost ? b.cost.toLocaleString() + 'g' : '初始拥有'}</dd>` +
      `<dt>编号</dt><dd>${BUILDINGS.indexOf(b) + 1} / ${BUILDINGS.length}</dd>` +
      `<dt>说明</dt><dd>${b.desc}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const b = BUILDING_MAP[state.building];
    const z = state.zoom;
    const sw = BUILDING_W * z;
    const sh = BUILDING_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = H - sh - 64;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 地面阴影 */
    ellipse(ctx, W / 2, sy + 57 * z, Math.round(sw * 0.32), Math.round(z * 1.6), 'rgba(30, 24, 16, 0.25)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawBuilding(ctx, b, state.time * 0.35);
    ctx.restore();

    ctx.fillStyle = 'rgba(14, 20, 14, 0.75)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${b.name} · ${buildingTypeName(b.type)} · ${b.w}×${b.h}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${b.en}   ${b.cost ? b.cost.toLocaleString() + 'g' : 'starter'}   building ${BUILDINGS.indexOf(b) + 1}/${BUILDINGS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const b = BUILDING_MAP[state.building];
    const cell = makeCanvas(BUILDING_W, BUILDING_H);
    drawBuilding(cell.ctx, b, 0.5);
    const scale = 4;
    const out = document.createElement('canvas');
    out.width = BUILDING_W * scale;
    out.height = BUILDING_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-building-${b.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(4, Math.min(6, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('building-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('building-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'bgrid';

    for (const b of BUILDINGS) {
      const cell = document.createElement('div');
      cell.className = 'bcell';
      cell.title = `${b.en} · ${b.w}×${b.h} · ${b.cost}g`;
      const cv = document.createElement('canvas');
      cv.width = BUILDING_W;
      cv.height = BUILDING_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawBuilding(g, b, 0.25);
      const name = document.createElement('b');
      name.textContent = b.name;
      const cost = document.createElement('span');
      cost.textContent = `${b.w}×${b.h} · ${b.cost ? b.cost.toLocaleString() + 'g' : '初始'}`;
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(cost);
      cell.addEventListener('click', () => {
        state.building = b.id;
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
