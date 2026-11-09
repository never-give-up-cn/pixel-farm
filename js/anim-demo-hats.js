/* 帽子图鉴面板：90 顶帽子，含农夫四方向试戴。
 * 大图在裁缝店镜子中显示正面，右下显示帽子图标，底部显示左右后三个朝向。 */

import {
  HATS, HAT_MAP, HAT_GROUPS, hatGroupName,
  drawHatIcon, drawHatOnFarmer, HAT_W, HAT_H
} from './anim/hats.js';
import { drawFarmer } from './anim/farmer.js';
import { DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP, mulberry32, TAU } from './anim/pixel.js';

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

/* 32×56 的试戴格：上方留出高帽子的空间 */
function dollCanvas() {
  return makeCanvas(32, 56);
}

export function initHatPanel() {
  const canvas = document.getElementById('hat-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    hat: 'cowboy_hat',
    filter: 'all',
    zoom: 5,
    time: 0
  };

  const listHost = document.getElementById('hat-list');
  const filterHost = document.getElementById('hat-filters');
  const statusEl = document.getElementById('hat-status');
  const noteEl = document.getElementById('hat-note');
  const countEl = document.getElementById('hat-count');
  const zoomInput = document.getElementById('hat-zoom');
  const zoomOut = document.getElementById('hat-zoom-out');

  /* ---------- 背景：裁缝店 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(9090);

    g.fillStyle = '#211b1a';
    g.fillRect(0, 0, W, H);

    /* 墙纸 */
    for (let y = 0; y < 340; y += 20) {
      for (let x = 0; x < W; x += 20) {
        g.fillStyle = (x / 20 + y / 20) % 2 ? '#2c2422' : '#332a27';
        g.fillRect(x, y, 20, 20);
        g.fillStyle = '#3a302c';
        g.fillRect(x + 8, y + 6, 4, 8);
      }
    }

    /* 木梁 */
    g.fillStyle = '#4a3020';
    g.fillRect(0, 0, W, 14);
    g.fillRect(0, 326, W, 10);
    g.fillRect(0, 0, 14, 340);
    g.fillRect(466, 0, 14, 340);

    /* 窗户 */
    g.fillStyle = '#6a8aa0';
    g.fillRect(330, 34, 118, 82);
    g.fillStyle = '#b8d8e8';
    g.fillRect(334, 38, 110, 34);
    g.fillStyle = '#4a3020';
    g.fillRect(386, 34, 5, 82);
    g.fillRect(330, 72, 118, 5);
    g.fillStyle = '#8a6a4a';
    g.fillRect(326, 116, 126, 5);

    /* 大镜子 */
    g.fillStyle = '#3a2820';
    g.fillRect(42, 36, 208, 304);
    g.fillStyle = '#7a5a34';
    g.fillRect(48, 42, 196, 292);
    g.fillStyle = '#5a4028';
    g.fillRect(52, 46, 188, 284);
    g.fillStyle = '#36505c';
    g.fillRect(56, 50, 180, 276);
    g.fillStyle = '#42626e';
    g.fillRect(60, 54, 172, 100);
    g.fillStyle = '#2c444e';
    g.fillRect(60, 220, 172, 102);

    /* 布卷架 */
    g.fillStyle = '#5a3a22';
    g.fillRect(292, 146, 140, 6);
    g.fillRect(292, 218, 140, 6);
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 26;
      g.fillStyle = ['#a04a4a', '#4a7aa0', '#6a9a4a', '#a08040', '#8a5a9a'][i];
      g.fillRect(x, 152, 18, 62);
      g.fillStyle = '#e0d0b0';
      g.fillRect(x + 2, 154, 14, 4);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(x, 188, 18, 2);
    }

    /* 衣架 */
    g.fillStyle = '#6a4a2a';
    g.fillRect(300, 248, 132, 5);
    g.fillRect(300, 248, 5, 72);
    g.fillRect(427, 248, 5, 72);
    for (let i = 0; i < 3; i++) {
      const x = 320 + i * 38;
      g.fillStyle = '#8a8a9a';
      g.fillRect(x, 258, 2, 10);
      g.fillStyle = ['#5a7a4a', '#7a4a6a', '#4a6a8a'][i];
      g.fillRect(x - 8, 268, 18, 42);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(x - 6, 270, 4, 34);
    }

    /* 地面 */
    g.fillStyle = '#362820';
    g.fillRect(0, 336, W, H - 336);
    for (let y = 344; y < H; y += 26) {
      g.fillStyle = '#423126';
      g.fillRect(0, y, W, 2);
    }
    for (let x = 0; x < W; x += 64) {
      g.fillStyle = '#2a1e18';
      g.fillRect(x, 336, 2, H - 336);
    }

    /* 裁缝台 */
    g.fillStyle = '#5a3a22';
    g.fillRect(320, 380, 150, 12);
    g.fillStyle = '#7a5430';
    g.fillRect(326, 370, 138, 12);
    g.fillStyle = '#4a3018';
    g.fillRect(332, 392, 10, 60);
    g.fillRect(452, 392, 10, 60);
    /* 桌上的线轴 */
    for (let i = 0; i < 4; i++) {
      g.fillStyle = ['#d04a3a', '#4a8ac0', '#e0c040', '#6ac09a'][i];
      g.fillRect(344 + i * 18, 358, 8, 12);
      g.fillStyle = '#e0d0b0';
      g.fillRect(342 + i * 18, 356, 12, 3);
    }

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 390);
    vg.addColorStop(0, 'rgba(255, 220, 170, 0.10)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    /* 尘埃 */
    for (let i = 0; i < 55; i++) {
      g.fillStyle = i % 2 ? '#4a4038' : '#1a1412';
      g.fillRect(Math.floor(rnd() * W), 340 + Math.floor(rnd() * 160), 3, 2);
    }

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const group of HAT_GROUPS) {
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

  for (const h of HATS) {
    const b = document.createElement('button');
    b.textContent = h.name;
    b.dataset.hat = h.id;
    b.title = `${h.en} · ${hatGroupName(h.group)}`;
    b.addEventListener('click', () => selectHat(h.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const h = HAT_MAP[b.dataset.hat];
      const show = state.filter === 'all' || h.group === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectHat(id) {
    if (!HAT_MAP[id]) return;
    state.hat = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const h = HAT_MAP[state.hat];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.hat === state.hat);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${hatGroupName(h.group)} · ${h.en}`;
    statusEl.innerHTML =
      `<dt>帽子</dt><dd>${h.name} (${h.en})</dd>` +
      `<dt>分组</dt><dd>${hatGroupName(h.group)}</dd>` +
      `<dt>编号</dt><dd>${HATS.indexOf(h) + 1} / ${HATS.length}</dd>`;
  }

  /* ---------- 试戴绘制 ---------- */
  function drawDoll(target, hat, dir, x, y, scale, phase) {
    const { canvas: c, ctx: g } = dollCanvas();
    g.imageSmoothingEnabled = false;
    g.translate(0, 16);
    drawFarmer(g, 'idle', dir, phase, { noHat: true });
    drawHatOnFarmer(g, hat, dir, phase);

    target.save();
    target.imageSmoothingEnabled = false;
    target.drawImage(c, x, y, 32 * scale, 56 * scale);
    target.restore();
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const h = HAT_MAP[state.hat];
    const phase = state.time * 0.5;
    const z = state.zoom;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 镜子里的正面试戴 */
    ctx.save();
    ctx.beginPath();
    ctx.rect(57, 51, 178, 274);
    ctx.clip();
    ctx.fillStyle = '#3f5c66';
    ctx.fillRect(57, 51, 178, 274);
    const mg = ctx.createLinearGradient(0, 50, 0, 330);
    mg.addColorStop(0, 'rgba(210, 240, 255, 0.20)');
    mg.addColorStop(1, 'rgba(30, 50, 60, 0.25)');
    ctx.fillStyle = mg;
    ctx.fillRect(57, 51, 178, 274);

    const largeX = Math.round(146 - 16 * z);
    const largeY = Math.round(185 - 28 * z);
    drawDoll(ctx, h, DIR_DOWN, largeX, largeY, z, phase);
    ctx.restore();

    /* 镜面反光 */
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(68, 56, 8, 190);
    ctx.fillRect(82, 56, 2, 130);
    ctx.restore();

    /* 右侧帽子大图 + 展台 */
    ctx.save();
    ctx.translate(348, 154);
    ctx.scale(4, 4);
    drawHatIcon(ctx, h, phase);
    ctx.restore();
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(334, 282, 84, 8);
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(342, 290, 68, 10);
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(368, 300, 16, 54);
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(348, 352, 56, 8);

    /* 底部三方向试戴 */
    const mini = [
      { dir: DIR_LEFT, label: '左' },
      { dir: DIR_RIGHT, label: '右' },
      { dir: DIR_UP, label: '后' }
    ];
    mini.forEach((m, i) => {
      const x = 60 + i * 92;
      const y = 340;
      drawDoll(ctx, h, m.dir, x, y, 2, phase + i * 0.12);
      ctx.fillStyle = '#b8a888';
      ctx.font = '10px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, x + 32, 460);
      ctx.textAlign = 'left';
    });

    /* 漂浮粒子 */
    const rnd = mulberry32(HATS.indexOf(h) + 31);
    for (let i = 0; i < 8; i++) {
      const px = 348 + Math.cos(state.time * 0.8 + rnd() * TAU) * (60 + rnd() * 50);
      const py = 200 + Math.sin(state.time * 1.1 + i) * (60 + rnd() * 40);
      ctx.globalAlpha = 0.2 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.5;
      ctx.fillStyle = i % 2 ? '#ffe08a' : '#e0f0ff';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 9, 7, 0.82)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${h.name} · ${hatGroupName(h.group)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${h.en}   hat ${HATS.indexOf(h) + 1}/${HATS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const h = HAT_MAP[state.hat];
    const cell = makeCanvas(HAT_W, HAT_H);
    drawHatIcon(cell.ctx, h, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = HAT_W * scale;
    out.height = HAT_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-hat-${h.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(3, Math.min(5, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('hat-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('hat-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'hgrid';

    for (const h of HATS) {
      const cell = document.createElement('div');
      cell.className = 'hcell';
      cell.title = `${h.en} · ${hatGroupName(h.group)}`;
      const cv = document.createElement('canvas');
      cv.width = HAT_W;
      cv.height = HAT_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawHatIcon(g, h, 0.25);
      const name = document.createElement('b');
      name.textContent = h.name;
      const meta = document.createElement('span');
      meta.textContent = hatGroupName(h.group);
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        state.hat = h.id;
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
