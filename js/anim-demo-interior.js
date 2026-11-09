/* 室内图鉴面板：96 件家具 + 32 种墙纸 + 24 种地板。
 * 家具是可替换摆件，墙纸/地板用平铺贴图实时铺到房间预览里。 */

import {
  INTERIOR, INTERIOR_MAP, INTERIOR_CATS, interiorCatName,
  drawFurnitureIcon, drawWallpaperTile, drawFloorTile,
  FURN_W, FURN_H, TILE_W, TILE_H
} from './anim/interior.js';
import { mulberry32, ellipse, TAU } from './anim/pixel.js';

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

export function initInteriorPanel() {
  const canvas = document.getElementById('interior-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    furniture: 'oak_chair',
    wallpaper: 'forest_wallpaper',
    flooring: 'oak_floor',
    filter: 'all',
    zoom: 4,
    time: 0,
    last: 'furniture'
  };

  const listHost = document.getElementById('interior-list');
  const filterHost = document.getElementById('interior-filters');
  const statusEl = document.getElementById('interior-status');
  const noteEl = document.getElementById('interior-note');
  const countEl = document.getElementById('interior-count');
  const zoomInput = document.getElementById('interior-zoom');
  const zoomOut = document.getElementById('interior-zoom-out');

  /* ---------- 房间贴图缓存 ---------- */
  const tileCanvas = {
    wallpaper: makeCanvas(TILE_W, TILE_H),
    floor: makeCanvas(TILE_W, TILE_H)
  };
  let wallCacheId = '';
  let wallPattern = null;
  let floorCacheId = '';
  let floorPattern = null;

  function getWallPattern(id) {
    if (id === wallCacheId && wallPattern) return wallPattern;
    const it = INTERIOR_MAP[id];
    const { canvas: c, ctx: g } = tileCanvas.wallpaper;
    g.clearRect(0, 0, TILE_W, TILE_H);
    drawWallpaperTile(g, it);
    wallPattern = ctx.createPattern(c, 'repeat');
    wallCacheId = id;
    return wallPattern;
  }

  function getFloorPattern(id) {
    if (id === floorCacheId && floorPattern) return floorPattern;
    const it = INTERIOR_MAP[id];
    const { canvas: c, ctx: g } = tileCanvas.floor;
    g.clearRect(0, 0, TILE_W, TILE_H);
    drawFloorTile(g, it);
    floorPattern = ctx.createPattern(c, 'repeat');
    floorCacheId = id;
    return floorPattern;
  }

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of INTERIOR_CATS) {
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

  for (const it of INTERIOR) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.dataset.item = it.id;
    b.title = `${it.en} · ${interiorCatName(it.group)}`;
    b.addEventListener('click', () => selectItem(it.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = INTERIOR_MAP[b.dataset.item];
      const show = state.filter === 'all' || it.group === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectItem(id) {
    const it = INTERIOR_MAP[id];
    if (!it) return;
    if (it.group === 'furniture') state.furniture = id;
    else if (it.group === 'wallpaper') state.wallpaper = id;
    else state.flooring = id;
    state.last = it.group;
    sync();
    const b = listHost.querySelector(`[data-item="${id}"]`);
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const f = INTERIOR_MAP[state.furniture];
    const w = INTERIOR_MAP[state.wallpaper];
    const fl = INTERIOR_MAP[state.flooring];
    for (const b of listHost.children) {
      const id = b.dataset.item;
      b.classList.toggle('active', id === state.furniture || id === state.wallpaper || id === state.flooring);
    }
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${f.name} · ${w.name} · ${fl.name}`;
    statusEl.innerHTML =
      `<dt>家具</dt><dd>${f.name} (${f.en})</dd>` +
      `<dt>墙纸</dt><dd>${w.name}</dd>` +
      `<dt>地板</dt><dd>${fl.name}</dd>` +
      `<dt>编号</dt><dd>${INTERIOR.indexOf(f) + 1} / ${INTERIOR.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const f = INTERIOR_MAP[state.furniture];
    const w = INTERIOR_MAP[state.wallpaper];
    const fl = INTERIOR_MAP[state.flooring];
    const phase = state.time * 0.5;
    const z = state.zoom;

    ctx.clearRect(0, 0, W, H);

    /* 墙纸 */
    ctx.save();
    ctx.fillStyle = getWallPattern(state.wallpaper);
    ctx.fillRect(0, 0, W, 330);
    const wg = ctx.createLinearGradient(0, 0, 0, 330);
    wg.addColorStop(0, 'rgba(255,255,255,0.06)');
    wg.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, W, 330);
    ctx.restore();

    /* 地板 */
    ctx.save();
    ctx.fillStyle = getFloorPattern(state.flooring);
    ctx.fillRect(0, 330, W, H - 330);
    const fg = ctx.createLinearGradient(0, 330, 0, H);
    fg.addColorStop(0, 'rgba(0,0,0,0.08)');
    fg.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 330, W, H - 330);
    ctx.restore();

    /* 踢脚线 */
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(0, 326, W, 8);
    ctx.fillStyle = '#7a5430';
    ctx.fillRect(0, 326, W, 2);

    /* 窗户 */
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(42, 32, 112, 82);
    ctx.fillStyle = '#6a8aa0';
    ctx.fillRect(48, 38, 100, 70);
    ctx.fillStyle = '#b8d8e8';
    ctx.fillRect(52, 42, 92, 30);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(94, 38, 4, 70);
    ctx.fillRect(48, 72, 100, 4);
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(38, 114, 120, 5);

    /* 右侧墙纸 / 地板小样 */
    const swatch = (item, x, y, label, group) => {
      ctx.fillStyle = 'rgba(20, 14, 10, 0.5)';
      ctx.fillRect(x - 4, y - 4, 72, 72);
      ctx.strokeStyle = '#6a4a2a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 4, y - 4, 72, 72);
      const t = makeCanvas(TILE_W, TILE_H);
      if (group === 'wallpaper') drawWallpaperTile(t.ctx, item);
      else drawFloorTile(t.ctx, item);
      ctx.drawImage(t.canvas, x, y, 64, 64);
      ctx.fillStyle = '#b8a888';
      ctx.font = '10px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + 32, y + 80);
      ctx.textAlign = 'left';
    };
    swatch(w, 336, 44, '墙纸', 'wallpaper');
    swatch(fl, 336, 152, '地板', 'floor');

    /* 家具 */
    const fw = FURN_W * z;
    const fh = FURN_H * z;
    const fx = Math.round((W - fw) / 2);
    const fy = 420 - fh;
    ellipse(ctx, W / 2, 418, Math.round(fw * 0.32), 9, 'rgba(0,0,0,0.38)');
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(z, z);
    drawFurnitureIcon(ctx, f, phase);
    ctx.restore();

    /* 漂浮粒子 */
    const rnd = mulberry32(INTERIOR.indexOf(f) + 41);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.8 + rnd() * TAU) * (fw * 0.35 + rnd() * 40);
      const py = fy + fh * 0.45 + Math.sin(state.time * 1.1 + i) * (fh * 0.28);
      ctx.globalAlpha = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.38;
      ctx.fillStyle = i % 2 ? '#ffe08a' : '#e0f0ff';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 9, 7, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${f.name} · ${interiorCatName(f.group)}`, 14, H - 30);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '10px "Microsoft YaHei", monospace';
    ctx.fillText(`${w.name} / ${fl.name}   ${f.en}`, 14, H - 12);

    sync();
  }

  function exportPng() {
    if (state.last === 'furniture') {
      const it = INTERIOR_MAP[state.furniture];
      const cell = makeCanvas(FURN_W, FURN_H);
      drawFurnitureIcon(cell.ctx, it, 0.5);
      const scale = 6;
      const out = document.createElement('canvas');
      out.width = FURN_W * scale;
      out.height = FURN_H * scale;
      const g = out.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(cell.canvas, 0, 0, out.width, out.height);
      download(out, `sdv-furniture-${it.id}.png`);
      return;
    }
    const wall = state.last === 'wallpaper';
    const it = INTERIOR_MAP[wall ? state.wallpaper : state.flooring];
    const cell = makeCanvas(TILE_W, TILE_H);
    if (wall) drawWallpaperTile(cell.ctx, it);
    else drawFloorTile(cell.ctx, it);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = TILE_W * scale;
    out.height = TILE_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-${wall ? 'wallpaper' : 'floor'}-${it.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(3, Math.min(5, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('interior-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('interior-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'igrid';

    for (const it of INTERIOR) {
      const cell = document.createElement('div');
      cell.className = 'icell';
      cell.title = `${it.en} · ${interiorCatName(it.group)}`;
      const cv = document.createElement('canvas');
      cv.width = 48;
      cv.height = 48;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      if (it.group === 'furniture') {
        g.drawImage((() => {
          const c = makeCanvas(FURN_W, FURN_H);
          drawFurnitureIcon(c.ctx, it, 0.25);
          return c.canvas;
        })(), 4, 4);
      } else {
        const c = makeCanvas(TILE_W, TILE_H);
        if (it.group === 'wallpaper') drawWallpaperTile(c.ctx, it);
        else drawFloorTile(c.ctx, it);
        g.drawImage(c.canvas, 8, 8);
      }
      const name = document.createElement('b');
      name.textContent = it.name;
      const meta = document.createElement('span');
      meta.textContent = interiorCatName(it.group);
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        state.filter = 'all';
        applyFilter();
        selectItem(it.id);
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
