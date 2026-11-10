/* 社区中心收集包面板：6 个房间、30 个收集包。 */

import {
  BUNDLES, BUNDLE_MAP, BUNDLE_ROOMS, bundleRoomName,
  drawBundleIcon, BUNDLE_W, BUNDLE_H
} from './anim/bundles.js';
import { R, mulberry32, ellipse, line, TAU } from './anim/pixel.js';

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

export function initBundlePanel() {
  const canvas = document.getElementById('bundle-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'spring_crops',
    filter: 'all',
    zoom: 7,
    time: 0
  };

  const listHost = document.getElementById('bundle-list');
  const filterHost = document.getElementById('bundle-filters');
  const statusEl = document.getElementById('bundle-status');
  const noteEl = document.getElementById('bundle-note');
  const countEl = document.getElementById('bundle-count');
  const zoomInput = document.getElementById('bundle-zoom');
  const zoomOut = document.getElementById('bundle-zoom-out');

  /* ---------- 背景：社区中心 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(2626);

    g.fillStyle = '#1e2018';
    g.fillRect(0, 0, W, H);

    /* 石墙 */
    for (let y = 0; y < 330; y += 26) {
      for (let x = (y % 52 ? 26 : 0) - 26; x < W; x += 52) {
        g.fillStyle = (x + y) % 3 ? '#2b2f28' : '#32362e';
        g.fillRect(x, y, 50, 24);
        g.fillStyle = '#181a15';
        g.fillRect(x, y + 24, 50, 2);
        g.fillRect(x + 50, y, 2, 24);
      }
    }

    /* 木梁 */
    g.fillStyle = '#4a3020';
    g.fillRect(0, 0, W, 14);
    g.fillRect(0, 326, W, 12);
    g.fillRect(0, 0, 14, 338);
    g.fillRect(466, 0, 14, 338);

    /* 藤蔓 */
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 90;
      line(g, x, 14, x + 8, 70, '#3a6a2a', 1);
      line(g, x + 8, 70, x + 2, 130, '#3a6a2a', 1);
      for (let j = 0; j < 4; j++) R(g, x + 4 + (j % 2) * 4, 40 + j * 22, 3, 2, '#5aa04a');
    }

    /* 壁炉 */
    g.fillStyle = '#5a3a2a';
    g.fillRect(370, 220, 84, 100);
    g.fillStyle = '#7a5a3a';
    g.fillRect(376, 226, 72, 88);
    g.fillStyle = '#2a1a14';
    g.fillRect(390, 260, 44, 54);
    g.fillStyle = '#e08a3a';
    g.fillRect(398, 280, 8, 30);
    g.fillStyle = '#f0c050';
    g.fillRect(410, 272, 8, 38);
    g.fillStyle = '#d04a3a';
    g.fillRect(422, 286, 6, 24);

    /* 桌子 */
    g.fillStyle = '#4a3020';
    g.fillRect(90, 410, 300, 14);
    g.fillStyle = '#6b4a2a';
    g.fillRect(98, 396, 284, 14);
    g.fillStyle = '#8a6238';
    g.fillRect(98, 396, 284, 4);
    g.fillStyle = '#3a2418';
    g.fillRect(120, 424, 22, 58);
    g.fillRect(338, 424, 22, 58);

    /* 地面 */
    g.fillStyle = '#33281e';
    g.fillRect(0, 338, W, H - 338);
    for (let y = 346; y < H; y += 26) {
      g.fillStyle = '#3e3024';
      g.fillRect(0, y, W, 2);
    }

    /* 货架上的 Junimo 玩偶 */
    g.fillStyle = '#5a3a22';
    g.fillRect(40, 160, 100, 6);
    g.fillRect(40, 220, 100, 6);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = ['#6aa04a', '#d08a3a', '#4a8ac0'][i];
      g.fillRect(56 + i * 28, 136, 14, 24);
      g.fillStyle = '#e0d0b0';
      g.fillRect(60 + i * 28, 132, 6, 5);
    }

    for (let i = 0; i < 45; i++) {
      g.fillStyle = i % 2 ? '#3a4032' : '#171a14';
      g.fillRect(Math.floor(rnd() * W), 342 + Math.floor(rnd() * 160), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 390);
    vg.addColorStop(0, 'rgba(255, 210, 140, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.52)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const room of BUNDLE_ROOMS) {
    const b = document.createElement('button');
    b.textContent = room.name;
    b.dataset.filter = room.id;
    b.addEventListener('click', () => {
      state.filter = room.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const it of BUNDLES) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.dataset.item = it.id;
    b.title = `${it.en} · ${bundleRoomName(it.room)}`;
    b.addEventListener('click', () => selectItem(it.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = BUNDLE_MAP[b.dataset.item];
      const show = state.filter === 'all' || it.room === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectItem(id) {
    if (!BUNDLE_MAP[id]) return;
    state.item = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const it = BUNDLE_MAP[state.item];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.item === state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${bundleRoomName(it.room)} · ${it.reward}`;
    statusEl.innerHTML =
      `<dt>收集包</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>房间</dt><dd>${bundleRoomName(it.room)}</dd>` +
      `<dt>物品</dt><dd>${it.items.join('、')}</dd>` +
      `<dt>奖励</dt><dd>${it.reward}</dd>` +
      `<dt>编号</dt><dd>${BUNDLES.indexOf(it) + 1} / ${BUNDLES.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = BUNDLE_MAP[state.item];
    const phase = state.time * 0.5;
    const z = state.zoom;
    const sw = BUNDLE_W * z;
    const sh = BUNDLE_H * z;
    const sx = Math.round((W - sw) / 2 - 40);
    const sy = 350 - sh;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    const glow = ctx.createRadialGradient(sx + sw / 2, sy + sh / 2, 10, sx + sw / 2, sy + sh / 2, sw * 0.7);
    glow.addColorStop(0, 'rgba(255, 226, 150, 0.18)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ellipse(ctx, sx + sw / 2, 356, Math.round(sw * 0.24), Math.round(z * 0.8), 'rgba(0,0,0,0.4)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawBundleIcon(ctx, it, phase);
    ctx.restore();

    /* Junimo */
    const jx = 386, jy = 190;
    ellipse(ctx, jx, jy + 22, 18, 6, 'rgba(0,0,0,0.25)');
    ellipse(ctx, jx, jy, 16, 20, '#4a8a3a');
    ellipse(ctx, jx, jy - 2, 14, 18, '#6ab04a');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(jx - 6, jy - 4, 3, 5);
    ctx.fillRect(jx + 3, jy - 4, 3, 5);
    ctx.fillStyle = '#8ac05a';
    ctx.fillRect(jx - 9, jy - 22, 4, 8);
    ctx.fillRect(jx + 6, jy - 22, 4, 8);
    ctx.fillStyle = '#a0d060';
    ctx.fillRect(jx - 5, jy - 28, 10, 7);

    /* 物品列表 */
    const items = it.items;
    const cols = items.length > 6 ? 2 : 1;
    const perCol = Math.ceil(items.length / cols);
    ctx.fillStyle = '#e8e0c8';
    ctx.font = '9px "Microsoft YaHei", monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i < items.length; i++) {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const tx = 96 + col * 150;
      const ty = 362 + row * 13;
      ctx.fillStyle = '#c8a050';
      ctx.fillRect(tx, ty + 3, 2, 2);
      ctx.fillStyle = '#e8e0c8';
      ctx.fillText(items[i], tx + 7, ty + 7);
    }

    ctx.fillStyle = '#f0d070';
    ctx.font = '11px "Microsoft YaHei", monospace';
    ctx.fillText(`奖励：${it.reward}`, 96, 448);

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 10, 8, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${it.name} · ${bundleRoomName(it.room)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   bundle ${BUNDLES.indexOf(it) + 1}/${BUNDLES.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = BUNDLE_MAP[state.item];
    const cell = makeCanvas(BUNDLE_W, BUNDLE_H);
    drawBundleIcon(cell.ctx, it, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = BUNDLE_W * scale;
    out.height = BUNDLE_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-bundle-${it.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(9, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('bundle-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('bundle-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'bgrid';

    for (const it of BUNDLES) {
      const cell = document.createElement('div');
      cell.className = 'bcell';
      cell.title = `${it.en} · ${bundleRoomName(it.room)}`;
      const cv = document.createElement('canvas');
      cv.width = BUNDLE_W;
      cv.height = BUNDLE_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawBundleIcon(g, it, 0.25);
      const name = document.createElement('b');
      name.textContent = it.name;
      const meta = document.createElement('span');
      meta.textContent = bundleRoomName(it.room);
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
