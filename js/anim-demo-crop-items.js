/* 种子与农产品面板：50 种作物的种子包和收获物。 */

import {
  CROP_ITEMS, CROP_ITEM_MAP, CROP_MAP, ITEM_CATS, itemCatName,
  drawSeedPacket, drawProduceIcon, ITEM_W, ITEM_H
} from './anim/crop-items.js';
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

export function initCropItemPanel() {
  const canvas = document.getElementById('cropitem-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    crop: 'blue_jazz',
    view: 'produce',
    filter: 'all',
    zoom: 5,
    time: 0
  };

  const listHost = document.getElementById('cropitem-list');
  const filterHost = document.getElementById('cropitem-filters');
  const statusEl = document.getElementById('cropitem-status');
  const noteEl = document.getElementById('cropitem-note');
  const countEl = document.getElementById('cropitem-count');
  const zoomInput = document.getElementById('cropitem-zoom');
  const zoomOut = document.getElementById('cropitem-zoom-out');

  /* ---------- 背景：农舍温室 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(6464);

    g.fillStyle = '#241c16';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < 330; y += 32) {
      g.fillStyle = y % 64 ? '#30231c' : '#372a22';
      g.fillRect(0, y, W, 30);
      g.fillStyle = '#19110d';
      g.fillRect(0, y + 30, W, 2);
      for (let x = 0; x < W; x += 108) g.fillRect(x, y, 1, 30);
    }

    /* 窗户 */
    g.fillStyle = '#4a3020';
    g.fillRect(40, 26, 150, 98);
    g.fillStyle = '#8ac0e0';
    g.fillRect(46, 32, 138, 86);
    g.fillStyle = '#cfe8f4';
    g.fillRect(50, 36, 130, 34);
    g.fillStyle = '#4a3020';
    g.fillRect(112, 32, 5, 86);
    g.fillRect(46, 72, 138, 5);

    /* 货架与种子袋 */
    g.fillStyle = '#5a3a22';
    g.fillRect(292, 72, 152, 6);
    g.fillRect(292, 152, 152, 6);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = ['#8a5a3a', '#4a6a8a', '#5a7a4a', '#8a6a3a', '#6a4a6a'][i];
      g.fillRect(306 + i * 26, 46, 16, 26);
      g.fillStyle = '#e8d8b0';
      g.fillRect(310 + i * 26, 42, 8, 5);
      g.fillStyle = ['#8a5a3a', '#4a6a8a', '#5a7a4a', '#8a6a3a', '#6a4a6a'][i];
      g.fillRect(306 + i * 26, 126, 16, 26);
    }

    /* 土台 / 桌子 */
    g.fillStyle = '#3a2a20';
    g.fillRect(0, 330, W, H - 330);
    for (let y = 338; y < H; y += 26) {
      g.fillStyle = '#46342a';
      g.fillRect(0, y, W, 2);
    }
    g.fillStyle = '#5a3a22';
    g.fillRect(70, 410, 340, 14);
    g.fillStyle = '#7a5430';
    g.fillRect(78, 396, 324, 14);
    g.fillStyle = '#8a6238';
    g.fillRect(78, 396, 324, 4);
    g.fillStyle = '#3a2418';
    g.fillRect(100, 424, 22, 58);
    g.fillRect(358, 424, 22, 58);

    /* 土壤和幼苗 */
    g.fillStyle = '#4a3020';
    g.fillRect(30, 350, 380, 20);
    g.fillStyle = '#5a3a22';
    g.fillRect(36, 354, 368, 12);
    for (let i = 0; i < 12; i++) {
      g.fillStyle = '#3f9440';
      g.fillRect(48 + i * 30, 342, 3, 12);
      g.fillStyle = '#6ab04a';
      g.fillRect(44 + i * 30, 340, 5, 4);
    }

    for (let i = 0; i < 45; i++) {
      g.fillStyle = i % 2 ? '#4a4038' : '#17110d';
      g.fillRect(Math.floor(rnd() * W), 390 + Math.floor(rnd() * 110), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 250, 100, W / 2, 250, 380);
    vg.addColorStop(0, 'rgba(255, 220, 150, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of ITEM_CATS) {
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

  for (const it of CROP_ITEMS) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.dataset.item = it.id;
    b.title = `${it.en} · ${it.season} · ${it.days} 天`;
    b.addEventListener('click', () => selectItem(it.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = CROP_ITEM_MAP[b.dataset.item];
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
    const it = CROP_ITEM_MAP[id];
    if (!it) return;
    state.crop = it.crop;
    state.view = it.group;
    sync();
    const b = listHost.querySelector(`[data-item="${id}"]`);
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const it = CROP_ITEM_MAP[`${state.view === 'seed' ? 'seed' : 'produce'}_${state.crop}`];
    const c = CROP_MAP[state.crop];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.item === it.id);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${c.season} · ${c.days} 天成熟${c.regrow ? ` · 每 ${c.regrow} 天复收` : ''}`;
    statusEl.innerHTML =
      `<dt>物品</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>类型</dt><dd>${itemCatName(it.group)}</dd>` +
      `<dt>季节</dt><dd>${c.season}</dd>` +
      `<dt>生长</dt><dd>${c.days} 天${c.regrow ? ` · 复收 ${c.regrow} 天` : ''}</dd>` +
      `<dt>编号</dt><dd>${CROP_ITEMS.indexOf(it) + 1} / ${CROP_ITEMS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const c = CROP_MAP[state.crop];
    const phase = state.time * 0.5;
    const z = state.zoom;
    const sw = ITEM_W * z;
    const sh = ITEM_H * z;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 两个展示位 */
    const slots = [
      { id: `seed_${c.id}`, group: 'seed', label: '种子', x: 46, y: 160 },
      { id: `produce_${c.id}`, group: 'produce', label: '收获', x: 274, y: 160 }
    ];
    for (const slot of slots) {
      const active = state.view === slot.group;
      if (active) {
        ctx.strokeStyle = '#e9c96f';
        ctx.lineWidth = 3;
        ctx.strokeRect(slot.x - 10, slot.y - 10, sw + 20, sh + 54);
      }
      ctx.fillStyle = 'rgba(12, 16, 10, 0.45)';
      ctx.fillRect(slot.x - 6, slot.y - 6, sw + 12, sh + 12);
      ellipse(ctx, slot.x + sw / 2, slot.y + sh + 3, Math.round(sw * 0.25), 7, 'rgba(0,0,0,0.35)');
      ctx.save();
      ctx.translate(slot.x, slot.y);
      ctx.scale(z, z);
      if (slot.group === 'seed') drawSeedPacket(ctx, c, phase);
      else drawProduceIcon(ctx, c, phase);
      ctx.restore();

      ctx.fillStyle = active ? '#e9c96f' : '#b8a888';
      ctx.font = '12px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(slot.label, slot.x + sw / 2, slot.y + sh + 28);
      ctx.textAlign = 'left';
    }

    /* 作物信息 */
    ctx.fillStyle = '#f4e6c6';
    ctx.font = '16px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.name, W / 2, 72);
    ctx.fillStyle = '#9ac0a0';
    ctx.font = '11px monospace';
    ctx.fillText(`${c.en}   ${c.season}   ${c.days} days${c.regrow ? `   regrow ${c.regrow}` : ''}`, W / 2, 92);
    ctx.textAlign = 'left';

    /* 粒子 */
    const rnd = mulberry32(state.crop.length * 31 + 11);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.8 + rnd() * 6.28) * (120 + rnd() * 40);
      const py = 190 + Math.sin(state.time * 1.1 + i) * 80;
      ctx.globalAlpha = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.4;
      ctx.fillStyle = i % 2 ? '#ffe08a' : '#a0f0b0';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 9, 7, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${c.name} · ${state.view === 'seed' ? '种子' : '农产品'}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${c.en}   ${c.season}   ${c.days} days`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const c = CROP_MAP[state.crop];
    const cell = makeCanvas(ITEM_W, ITEM_H);
    if (state.view === 'seed') drawSeedPacket(cell.ctx, c, 0.5);
    else drawProduceIcon(cell.ctx, c, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = ITEM_W * scale;
    out.height = ITEM_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-${state.view}-${state.crop}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(4, Math.min(6, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('cropitem-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('cropitem-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'cigrid';

    for (const it of CROP_ITEMS) {
      const c = CROP_MAP[it.crop];
      const cell = document.createElement('div');
      cell.className = 'cicell';
      cell.title = `${it.en} · ${it.season} · ${it.days} 天`;
      const cv = document.createElement('canvas');
      cv.width = ITEM_W;
      cv.height = ITEM_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      if (it.group === 'seed') drawSeedPacket(g, c, 0.25);
      else drawProduceIcon(g, c, 0.25);
      const name = document.createElement('b');
      name.textContent = it.name;
      const meta = document.createElement('span');
      meta.textContent = it.group === 'seed' ? '种子' : c.season;
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        state.crop = it.crop;
        state.view = it.group;
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
