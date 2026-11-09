/* 衣物图鉴面板：64 件衬衫 + 16 件裤子 / 裙子。
 * 左侧镜子显示完整纸娃娃，底部为左 / 右 / 后三方向，右侧展示上衣与下装图标。 */

import {
  CLOTHES, CLOTH_MAP, CLOTH_CATS, clothCatName, makeOutfit,
  drawClothingIcon, CLOTH_W, CLOTH_H
} from './anim/clothes.js';
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

export function initClothesPanel() {
  const canvas = document.getElementById('clothes-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    shirt: 'classic_overalls',
    pants: 'farmer_pants',
    filter: 'all',
    zoom: 5,
    time: 0
  };

  const listHost = document.getElementById('clothes-list');
  const filterHost = document.getElementById('clothes-filters');
  const statusEl = document.getElementById('clothes-status');
  const noteEl = document.getElementById('clothes-note');
  const countEl = document.getElementById('clothes-count');
  const zoomInput = document.getElementById('clothes-zoom');
  const zoomOut = document.getElementById('clothes-zoom-out');

  /* ---------- 背景：更衣室 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(5252);

    g.fillStyle = '#211a18';
    g.fillRect(0, 0, W, H);

    /* 墙纸 */
    for (let y = 0; y < 340; y += 24) {
      for (let x = 0; x < W; x += 24) {
        g.fillStyle = (x / 24 + y / 24) % 2 ? '#2b2220' : '#322825';
        g.fillRect(x, y, 24, 24);
        g.fillStyle = '#3a2e29';
        g.fillRect(x + 9, y + 6, 6, 10);
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
    g.fillRect(78, 30, 104, 70);
    g.fillStyle = '#b8d8e8';
    g.fillRect(82, 34, 96, 30);
    g.fillStyle = '#4a3020';
    g.fillRect(128, 30, 4, 70);
    g.fillRect(78, 64, 104, 4);
    g.fillStyle = '#8a6a4a';
    g.fillRect(74, 100, 112, 4);

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

    /* 衣柜 */
    g.fillStyle = '#4a3018';
    g.fillRect(298, 32, 160, 122);
    g.fillStyle = '#6b4a2a';
    g.fillRect(304, 38, 148, 110);
    g.fillStyle = '#5a3a22';
    g.fillRect(376, 38, 4, 110);
    g.fillStyle = '#c8a050';
    g.fillRect(368, 84, 4, 12);
    g.fillRect(384, 84, 4, 12);
    g.fillStyle = '#3a2418';
    g.fillRect(310, 52, 56, 2);
    g.fillRect(390, 52, 56, 2);

    /* 挂衣杆 */
    g.fillStyle = '#5a3a22';
    g.fillRect(298, 176, 160, 5);
    g.fillRect(298, 176, 5, 80);
    g.fillRect(453, 176, 5, 80);
    for (let i = 0; i < 4; i++) {
      const x = 316 + i * 32;
      g.fillStyle = '#8a8a9a';
      g.fillRect(x, 186, 2, 9);
      g.fillStyle = ['#5a7a4a', '#7a4a6a', '#4a6a8a', '#9a7a3a'][i];
      g.fillRect(x - 7, 195, 16, 34);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(x - 5, 197, 3, 28);
    }

    /* 右侧展示架 */
    g.fillStyle = '#4a3020';
    g.fillRect(310, 214, 136, 6);
    g.fillRect(310, 334, 136, 6);
    g.fillStyle = '#6a4a2a';
    g.fillRect(316, 220, 124, 4);
    g.fillRect(316, 340, 124, 4);

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

    /* 盆栽 */
    g.fillStyle = '#6a4a2a';
    g.fillRect(28, 400, 26, 28);
    g.fillStyle = '#8a5a3a';
    g.fillRect(24, 394, 34, 8);
    g.fillStyle = '#3a6a2a';
    g.fillRect(38, 362, 4, 34);
    g.fillStyle = '#5aa04a';
    g.fillRect(30, 368, 12, 5);
    g.fillRect(40, 378, 14, 5);
    g.fillRect(28, 384, 12, 5);

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 390);
    vg.addColorStop(0, 'rgba(255, 220, 170, 0.10)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    for (let i = 0; i < 55; i++) {
      g.fillStyle = i % 2 ? '#4a4038' : '#1a1412';
      g.fillRect(Math.floor(rnd() * W), 340 + Math.floor(rnd() * 160), 3, 2);
    }

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of CLOTH_CATS) {
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

  for (const it of CLOTHES) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.dataset.cloth = it.id;
    b.title = `${it.en} · ${clothCatName(it.group)}`;
    b.addEventListener('click', () => selectCloth(it.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = CLOTH_MAP[b.dataset.cloth];
      const show = state.filter === 'all' || it.group === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function sync() {
    const sh = CLOTH_MAP[state.shirt];
    const pt = CLOTH_MAP[state.pants];
    for (const b of listHost.children) {
      const id = b.dataset.cloth;
      b.classList.toggle('active', id === state.shirt || id === state.pants);
    }
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `上衣：${sh.name} · 下装：${pt.name}`;
    statusEl.innerHTML =
      `<dt>上衣</dt><dd>${sh.name} (${sh.en})</dd>` +
      `<dt>下装</dt><dd>${pt.name} (${pt.en})</dd>` +
      `<dt>版型</dt><dd>${clothCatName(sh.group)} + ${clothCatName(pt.group)}</dd>` +
      `<dt>编号</dt><dd>${CLOTHES.indexOf(sh) + 1} / ${CLOTHES.length} · ${CLOTHES.indexOf(pt) + 1} / ${CLOTHES.length}</dd>`;
  }

  function selectCloth(id) {
    const it = CLOTH_MAP[id];
    if (!it) return;
    if (it.group === 'shirt') state.shirt = id;
    else state.pants = id;
    sync();
    const b = listHost.querySelector(`[data-cloth="${id}"]`);
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  /* ---------- 试衣绘制 ---------- */
  function drawDoll(target, outfit, dir, x, y, scale, phase) {
    const { canvas: c, ctx: g } = makeCanvas(32, 56);
    g.imageSmoothingEnabled = false;
    g.translate(0, 16);
    drawFarmer(g, 'idle', dir, phase, { noHat: true, outfit });
    target.save();
    target.imageSmoothingEnabled = false;
    target.drawImage(c, x, y, 32 * scale, 56 * scale);
    target.restore();
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const sh = CLOTH_MAP[state.shirt];
    const pt = CLOTH_MAP[state.pants];
    const outfit = makeOutfit(sh, pt);
    const phase = state.time * 0.5;
    const z = state.zoom;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 镜子里的正面纸娃娃 */
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
    drawDoll(ctx, outfit, DIR_DOWN, largeX, largeY, z, phase);
    ctx.restore();

    /* 镜面反光 */
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(68, 56, 8, 190);
    ctx.fillRect(82, 56, 2, 130);
    ctx.restore();

    /* 右侧上衣 / 下装图标 */
    const iconCard = (item, y, label) => {
      ctx.fillStyle = 'rgba(20, 16, 14, 0.55)';
      ctx.fillRect(328, y - 8, 112, 108);
      ctx.strokeStyle = '#6a4a2a';
      ctx.lineWidth = 2;
      ctx.strokeRect(328, y - 8, 112, 108);
      ctx.save();
      ctx.translate(340, y);
      ctx.scale(3, 3);
      drawClothingIcon(ctx, item, phase);
      ctx.restore();
      ctx.fillStyle = '#b8a888';
      ctx.font = '11px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, 384, y + 108);
      ctx.textAlign = 'left';
    };
    iconCard(sh, 232, '上衣');
    iconCard(pt, 356, '下装');

    /* 底部三方向 */
    const mini = [
      { dir: DIR_LEFT, label: '左' },
      { dir: DIR_RIGHT, label: '右' },
      { dir: DIR_UP, label: '后' }
    ];
    mini.forEach((m, i) => {
      const x = 60 + i * 92;
      const y = 340;
      drawDoll(ctx, outfit, m.dir, x, y, 2, phase + i * 0.12);
      ctx.fillStyle = '#b8a888';
      ctx.font = '10px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, x + 32, 460);
      ctx.textAlign = 'left';
    });

    /* 漂浮粒子 */
    const rnd = mulberry32(CLOTHES.indexOf(sh) * 31 + CLOTHES.indexOf(pt) + 17);
    for (let i = 0; i < 8; i++) {
      const px = 360 + Math.cos(state.time * 0.8 + rnd() * TAU) * (40 + rnd() * 35);
      const py = 220 + Math.sin(state.time * 1.1 + i) * (100 + rnd() * 40);
      ctx.globalAlpha = 0.15 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.4;
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
    ctx.fillText(`${sh.name} + ${pt.name}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${sh.en} / ${pt.en}   outfit ${CLOTHES.indexOf(sh) + 1}+${CLOTHES.indexOf(pt) + 1}/${CLOTHES.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const outfit = makeOutfit(CLOTH_MAP[state.shirt], CLOTH_MAP[state.pants]);
    const cell = makeCanvas(32, 56);
    cell.ctx.translate(0, 16);
    drawFarmer(cell.ctx, 'idle', DIR_DOWN, 0.5, { noHat: true, outfit });
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = 32 * scale;
    out.height = 56 * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-outfit-${state.shirt}-${state.pants}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(3, Math.min(5, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('clothes-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('clothes-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'clgrid';

    for (const it of CLOTHES) {
      const cell = document.createElement('div');
      cell.className = 'clcell';
      cell.title = `${it.en} · ${clothCatName(it.group)}`;
      const cv = document.createElement('canvas');
      cv.width = CLOTH_W;
      cv.height = CLOTH_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawClothingIcon(g, it, 0.25);
      const name = document.createElement('b');
      name.textContent = it.name;
      const meta = document.createElement('span');
      meta.textContent = clothCatName(it.group);
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        if (it.group === 'shirt') state.shirt = it.id;
        else state.pants = it.id;
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
