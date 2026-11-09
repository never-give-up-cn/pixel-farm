/* 成就图鉴面板：49 个成就徽章与成就墙。 */

import {
  ACHIEVEMENTS, ACH_MAP, ACH_GROUPS, achGroupName,
  drawAchievementIcon, ACH_W, ACH_H
} from './anim/achievements.js';
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

export function initAchievementPanel() {
  const canvas = document.getElementById('ach-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'greenhorn',
    filter: 'all',
    zoom: 8,
    time: 0
  };

  const listHost = document.getElementById('ach-list');
  const filterHost = document.getElementById('ach-filters');
  const statusEl = document.getElementById('ach-status');
  const noteEl = document.getElementById('ach-note');
  const countEl = document.getElementById('ach-count');
  const zoomInput = document.getElementById('ach-zoom');
  const zoomOut = document.getElementById('ach-zoom-out');

  /* ---------- 背景：成就墙 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(8585);

    g.fillStyle = '#221a16';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < 340; y += 34) {
      g.fillStyle = y % 68 ? '#2f231c' : '#362a22';
      g.fillRect(0, y, W, 32);
      g.fillStyle = '#19110d';
      g.fillRect(0, y + 32, W, 2);
      for (let x = 0; x < W; x += 120) g.fillRect(x, y, 1, 32);
    }

    /* 木梁 */
    g.fillStyle = '#4a3020';
    g.fillRect(0, 0, W, 14);
    g.fillRect(0, 330, W, 12);
    g.fillRect(0, 0, 14, 342);
    g.fillRect(466, 0, 14, 342);

    /* 小徽章墙 */
    for (let y = 42; y < 300; y += 58) {
      for (let x = 36; x < 444; x += 54) {
        g.fillStyle = '#3a2a20';
        g.fillRect(x, y, 42, 42);
        g.fillStyle = (x + y) % 3 ? '#4a3830' : '#54402f';
        g.fillRect(x + 3, y + 3, 36, 36);
        g.fillStyle = '#e0c060';
        g.fillRect(x + 18, y + 12, 6, 6);
        g.fillRect(x + 12, y + 24, 18, 3);
      }
    }

    /* 地面 */
    g.fillStyle = '#33251e';
    g.fillRect(0, 342, W, H - 342);
    for (let y = 350; y < H; y += 26) {
      g.fillStyle = '#3e2e24';
      g.fillRect(0, y, W, 2);
    }

    /* 展示台 */
    g.fillStyle = '#4a3020';
    g.fillRect(120, 410, 240, 14);
    g.fillStyle = '#6b4a2a';
    g.fillRect(128, 396, 224, 14);
    g.fillStyle = '#8a6238';
    g.fillRect(128, 396, 224, 4);
    g.fillStyle = '#3a2418';
    g.fillRect(150, 424, 22, 58);
    g.fillRect(308, 424, 22, 58);

    /* 火把 */
    for (const x of [42, 438]) {
      g.fillStyle = '#5a3a22';
      g.fillRect(x, 226, 5, 40);
      g.fillStyle = '#e07a2a';
      g.fillRect(x - 4, 216, 13, 12);
      g.fillStyle = '#f0c050';
      g.fillRect(x - 1, 210, 7, 10);
    }

    for (let i = 0; i < 50; i++) {
      g.fillStyle = i % 2 ? '#3a3028' : '#17110d';
      g.fillRect(Math.floor(rnd() * W), 350 + Math.floor(rnd() * 160), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 390);
    vg.addColorStop(0, 'rgba(255, 210, 130, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.52)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const group of ACH_GROUPS) {
    const b = document.createElement('button');
    b.textContent = group.name;
    b.dataset.filter = group.id;
    b.addEventListener('click', () => {
      state.filter = group.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const it of ACHIEVEMENTS) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.dataset.item = it.id;
    b.title = `${it.en} · ${achGroupName(it.group)}`;
    b.addEventListener('click', () => selectItem(it.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = ACH_MAP[b.dataset.item];
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
    if (!ACH_MAP[id]) return;
    state.item = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const it = ACH_MAP[state.item];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.item === state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${achGroupName(it.group)} · ${it.desc}`;
    statusEl.innerHTML =
      `<dt>成就</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>分组</dt><dd>${achGroupName(it.group)}</dd>` +
      `<dt>条件</dt><dd>${it.desc}</dd>` +
      `<dt>编号</dt><dd>${ACHIEVEMENTS.indexOf(it) + 1} / ${ACHIEVEMENTS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = ACH_MAP[state.item];
    const phase = state.time * 0.45;
    const z = state.zoom;
    const sw = ACH_W * z;
    const sh = ACH_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 380 - sh;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 展示框 */
    ctx.fillStyle = 'rgba(12, 9, 7, 0.65)';
    ctx.fillRect(sx - 22, sy - 22, sw + 44, sh + 70);
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx - 20, sy - 20, sw + 40, sh + 66);
    ctx.strokeStyle = '#6a4a20';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 16, sy - 16, sw + 32, sh + 58);

    const glow = ctx.createRadialGradient(W / 2, sy + sh * 0.45, 10, W / 2, sy + sh * 0.45, sw * 0.7);
    glow.addColorStop(0, 'rgba(255, 226, 150, 0.22)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ellipse(ctx, W / 2, 400, Math.round(sw * 0.22), Math.round(z * 0.8), 'rgba(0,0,0,0.42)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawAchievementIcon(ctx, it, phase);
    ctx.restore();

    /* 名称与条件 */
    ctx.fillStyle = '#f4e6c6';
    ctx.font = '15px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.name, W / 2, 382);
    ctx.fillStyle = '#c8b890';
    ctx.font = '11px "Microsoft YaHei", monospace';
    ctx.fillText(it.desc, W / 2, 402);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   ${achGroupName(it.group)}`, W / 2, 421);
    ctx.textAlign = 'left';

    /* 粒子 */
    const rnd = mulberry32(ACHIEVEMENTS.indexOf(it) + 91);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.8 + rnd() * TAU) * (sw * 0.4 + rnd() * 28);
      const py = sy + sh * 0.45 + Math.sin(state.time * 1.1 + i) * sh * 0.28;
      ctx.globalAlpha = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.42;
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
    ctx.fillText(`${it.name} · ${achGroupName(it.group)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   achievement ${ACHIEVEMENTS.indexOf(it) + 1}/${ACHIEVEMENTS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = ACH_MAP[state.item];
    const cell = makeCanvas(ACH_W, ACH_H);
    drawAchievementIcon(cell.ctx, it, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = ACH_W * scale;
    out.height = ACH_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-achievement-${it.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(10, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('ach-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('ach-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'achgrid';

    for (const it of ACHIEVEMENTS) {
      const cell = document.createElement('div');
      cell.className = 'achcell';
      cell.title = `${it.en} · ${achGroupName(it.group)} · ${it.desc}`;
      const cv = document.createElement('canvas');
      cv.width = ACH_W;
      cv.height = ACH_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawAchievementIcon(g, it, 0.25);
      const name = document.createElement('b');
      name.textContent = it.name;
      const meta = document.createElement('span');
      meta.textContent = achGroupName(it.group);
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        state.item = it.id;
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
