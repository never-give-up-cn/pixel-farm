/* 资源图鉴面板：工具、矿石/锭、材料、采集物、古物。 */

import {
  RESOURCES, RES_MAP, RES_CATS, resCatName,
  drawResourceIcon, RES_W, RES_H
} from './anim/resources.js';
import { mulberry32, ellipse, TAU } from './anim/pixel.js';
import { createCatalog, exportItemPng } from './anim-demo-catalog.js';

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

export function initResourcePanel() {
  const canvas = document.getElementById('resource-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'copper_ore',
    filter: 'all',
    zoom: 7,
    time: 0
  };

  const listHost = document.getElementById('resource-list');
  const filterHost = document.getElementById('resource-filters');
  const statusEl = document.getElementById('resource-status');
  const noteEl = document.getElementById('resource-note');
  const countEl = document.getElementById('resource-count');
  const zoomInput = document.getElementById('resource-zoom');
  const zoomOut = document.getElementById('resource-zoom-out');

  /* ---------- 背景：探险家工坊 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(4343);

    g.fillStyle = '#1b1a20';
    g.fillRect(0, 0, W, H);

    /* 石墙 */
    for (let y = 0; y < 330; y += 26) {
      for (let x = (y % 52 ? 26 : 0) - 26; x < W; x += 52) {
        g.fillStyle = (x + y) % 3 ? '#26252c' : '#2c2b33';
        g.fillRect(x, y, 50, 24);
        g.fillStyle = '#17161b';
        g.fillRect(x, y + 24, 50, 2);
        g.fillRect(x + 50, y, 2, 24);
      }
    }

    /* 木梁 */
    g.fillStyle = '#4a3020';
    g.fillRect(0, 0, W, 14);
    g.fillRect(0, 316, W, 14);

    /* 货架 */
    g.fillStyle = '#5a3a22';
    g.fillRect(52, 72, 130, 6);
    g.fillRect(52, 152, 130, 6);
    g.fillRect(298, 72, 130, 6);
    g.fillRect(298, 152, 130, 6);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = ['#8a5a3a', '#4a6a8a', '#5a7a4a', '#8a6a3a', '#6a4a6a'][i];
      g.fillRect(64 + i * 22, 48, 12, 24);
      g.fillStyle = '#d8c0a0';
      g.fillRect(67 + i * 22, 44, 6, 5);
      g.fillStyle = ['#8a5a3a', '#4a6a8a', '#5a7a4a', '#8a6a3a', '#6a4a6a'][i];
      g.fillRect(64 + i * 22, 128, 12, 24);
    }
    for (let i = 0; i < 4; i++) {
      g.fillStyle = ['#c0a060', '#8a8a9a', '#a05a3a', '#5a7a4a'][i];
      g.fillRect(310 + i * 26, 52, 16, 20);
      g.fillStyle = '#e0d0b0';
      g.fillRect(313 + i * 26, 48, 10, 5);
      g.fillStyle = ['#c0a060', '#8a8a9a', '#a05a3a', '#5a7a4a'][i];
      g.fillRect(310 + i * 26, 132, 16, 20);
    }

    /* 矿车 */
    g.fillStyle = '#5a5a6a';
    g.fillRect(80, 196, 66, 30);
    g.fillStyle = '#3a3a48';
    g.fillRect(84, 200, 58, 22);
    g.fillStyle = '#8a8a9a';
    g.fillRect(78, 192, 70, 6);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i % 2 ? '#c07a3a' : '#6a6a7a';
      g.fillRect(90 + i * 16, 204, 10, 8);
    }
    ellipse(g, 94, 230, 8, 8, '#2a2a32');
    ellipse(g, 134, 230, 8, 8, '#2a2a32');
    ellipse(g, 94, 230, 4, 4, '#6a6a7a');
    ellipse(g, 134, 230, 4, 4, '#6a6a7a');

    /* 铁砧 */
    g.fillStyle = '#4a4a52';
    g.fillRect(300, 210, 58, 10);
    g.fillStyle = '#6a6a7a';
    g.fillRect(310, 200, 38, 10);
    g.fillRect(318, 220, 20, 34);
    g.fillStyle = '#8a8a9a';
    g.fillRect(312, 202, 34, 3);

    /* 地面 */
    g.fillStyle = '#2e241c';
    g.fillRect(0, 330, W, H - 330);
    for (let y = 338; y < H; y += 26) {
      g.fillStyle = '#392c22';
      g.fillRect(0, y, W, 2);
    }
    for (let x = 0; x < W; x += 68) {
      g.fillStyle = '#241a14';
      g.fillRect(x, 330, 2, H - 330);
    }

    /* 展示台 */
    g.fillStyle = '#4a3020';
    g.fillRect(120, 410, 240, 16);
    g.fillStyle = '#6b4a2a';
    g.fillRect(128, 396, 224, 16);
    g.fillStyle = '#8a6238';
    g.fillRect(128, 396, 224, 4);
    g.fillStyle = '#3a2418';
    g.fillRect(150, 426, 22, 58);
    g.fillRect(308, 426, 22, 58);

    /* 灯 */
    for (const x of [48, 432]) {
      g.fillStyle = '#5a3a22';
      g.fillRect(x, 240, 5, 42);
      g.fillStyle = '#e07a2a';
      g.fillRect(x - 4, 230, 13, 11);
      g.fillStyle = '#f0c050';
      g.fillRect(x - 1, 224, 7, 10);
      g.fillStyle = '#fff0a0';
      g.fillRect(x + 1, 226, 2, 5);
    }

    for (let i = 0; i < 70; i++) {
      g.fillStyle = i % 2 ? '#3a3940' : '#17161b';
      g.fillRect(Math.floor(rnd() * W), 330 + Math.floor(rnd() * 180), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 390);
    vg.addColorStop(0, 'rgba(255, 200, 120, 0.10)');
    vg.addColorStop(1, 'rgba(0,0,0,0.52)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  const catalog = createCatalog({
    prefix: 'resource',
    items: RESOURCES,
    map: RES_MAP,
    key: 'item',
    filterGroups: RES_CATS,
    groupOf: it => it.group,
    nameOf: it => it.name,
    titleOf: it => `${it.en} · ${resCatName(it.group)}`,
    gallery: {
      w: RES_W,
      h: RES_H,
      gridClass: 'rgrid',
      cellClass: 'rcell',
      draw: (g, it) => drawResourceIcon(g, it, 0.25),
      labelOf: it => it.name,
      metaOf: it => resCatName(it.group)
    },
    onSelect: id => {
      state.item = id;
      sync();
      render();
    }
  });

  function selectItem(id) { catalog.select(id); }
  function applyFilter() { catalog.applyFilter(); }

  function sync() {
    const it = RES_MAP[state.item];
    catalog.sync(state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${resCatName(it.group)} · ${it.en}`;
    statusEl.innerHTML =
      `<dt>物品</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>分类</dt><dd>${resCatName(it.group)}</dd>` +
      `<dt>编号</dt><dd>${RESOURCES.indexOf(it) + 1} / ${RESOURCES.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = RES_MAP[state.item];
    const phase = state.time * 0.35;
    const z = state.zoom;
    const sw = RES_W * z;
    const sh = RES_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 398 - sh;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    const glow = ctx.createRadialGradient(W / 2, sy + sh * 0.45, 10, W / 2, sy + sh * 0.45, sw * 0.7);
    glow.addColorStop(0, 'rgba(255, 226, 150, 0.18)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ellipse(ctx, W / 2, 400, Math.round(sw * 0.22), Math.round(z * 0.9), 'rgba(0,0,0,0.4)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawResourceIcon(ctx, it, phase);
    ctx.restore();

    const rnd = mulberry32(RESOURCES.indexOf(it) + 59);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.8 + rnd() * TAU) * (sw * 0.4 + rnd() * 28);
      const py = sy + sh * 0.45 + Math.sin(state.time * 1.1 + i) * sh * 0.28;
      ctx.globalAlpha = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.45;
      ctx.fillStyle = i % 2 ? '#ffe08a' : '#e0f0ff';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(12, 10, 8, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${it.name} · ${resCatName(it.group)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   item ${RESOURCES.indexOf(it) + 1}/${RESOURCES.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = RES_MAP[state.item];
    exportItemPng(it, RES_W, RES_H, (g, item) => drawResourceIcon(g, item, 0.5),
      `sdv-resource-${it.id}.png`, 8);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(4, Math.min(10, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('resource-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() { catalog.buildGallery(); }

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


