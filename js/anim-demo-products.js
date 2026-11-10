/* 动物产品图鉴面板：蛋、奶、羊毛、松露、蜂蜜、鱼籽等 24 种。 */

import {
  PRODUCTS, PROD_MAP, PROD_CATS, prodCatName,
  drawProductIcon, PROD_W, PROD_H
} from './anim/products.js';
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

export function initProductPanel() {
  const canvas = document.getElementById('product-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'egg',
    filter: 'all',
    zoom: 8,
    time: 0
  };

  const listHost = document.getElementById('product-list');
  const filterHost = document.getElementById('product-filters');
  const statusEl = document.getElementById('product-status');
  const noteEl = document.getElementById('product-note');
  const countEl = document.getElementById('product-count');
  const zoomInput = document.getElementById('product-zoom');
  const zoomOut = document.getElementById('product-zoom-out');

  /* ---------- 背景：农舍储藏室 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(6161);

    g.fillStyle = '#241c18';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < 330; y += 32) {
      g.fillStyle = y % 64 ? '#2f2520' : '#362a24';
      g.fillRect(0, y, W, 30);
      g.fillStyle = '#1a1410';
      g.fillRect(0, y + 30, W, 2);
      for (let x = 0; x < W; x += 110) g.fillRect(x, y, 1, 30);
    }

    /* 货架和罐子 */
    g.fillStyle = '#5a4030';
    g.fillRect(36, 96, W - 72, 6);
    g.fillRect(36, 180, W - 72, 6);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = ['#c08030', '#8a4a3a', '#5a7a3a', '#4a6a8a', '#8a6a3a'][i % 5];
      g.fillRect(54 + i * 50, 70, 14, 26);
      g.fillStyle = '#e0d0b0';
      g.fillRect(57 + i * 50, 66, 8, 5);
      g.fillStyle = ['#c08030', '#8a4a3a', '#5a7a3a', '#4a6a8a', '#8a6a3a'][i % 5];
      g.fillRect(54 + i * 50, 154, 14, 26);
    }

    /* 鸡舍巢箱 */
    g.fillStyle = '#6a4a2a';
    g.fillRect(44, 218, 120, 66);
    g.fillStyle = '#8a6238';
    g.fillRect(50, 224, 108, 54);
    for (let i = 0; i < 2; i++) {
      g.fillStyle = '#4a3018';
      g.fillRect(56 + i * 54, 232, 44, 40);
      g.fillStyle = '#d8b070';
      g.fillRect(60 + i * 54, 258, 36, 10);
      g.fillStyle = '#f0e0b0';
      g.fillRect(66 + i * 54, 252, 8, 6);
      g.fillRect(80 + i * 54, 254, 8, 6);
    }

    /* 牛奶罐 */
    g.fillStyle = '#8a8a9a';
    g.fillRect(330, 230, 26, 44);
    g.fillStyle = '#b8c0c8';
    g.fillRect(334, 234, 18, 36);
    g.fillStyle = '#6a6a7a';
    g.fillRect(338, 222, 10, 10);
    g.fillRect(340, 216, 6, 8);
    g.fillStyle = '#d0d8e0';
    g.fillRect(336, 238, 3, 28);

    /* 干草 */
    for (let i = 0; i < 2; i++) {
      g.fillStyle = '#c8a050';
      g.fillRect(210 + i * 46, 240, 38, 18);
      g.fillStyle = '#e0c070';
      for (let j = 0; j < 5; j++) g.fillRect(212 + i * 46 + j * 7, 238, 2, 22);
      g.fillStyle = '#8a6a2a';
      g.fillRect(210 + i * 46, 254, 38, 3);
    }

    /* 窗户 */
    g.fillStyle = '#4a3020';
    g.fillRect(320, 26, 112, 78);
    g.fillStyle = '#6a8aa0';
    g.fillRect(326, 32, 100, 66);
    g.fillStyle = '#c8e0f0';
    g.fillRect(330, 36, 92, 28);
    g.fillStyle = '#4a3020';
    g.fillRect(376, 32, 4, 66);
    g.fillRect(326, 68, 100, 4);

    /* 地面与桌子 */
    g.fillStyle = '#3a2a20';
    g.fillRect(0, 330, W, H - 330);
    for (let y = 338; y < H; y += 26) {
      g.fillStyle = '#46342a';
      g.fillRect(0, y, W, 2);
    }
    g.fillStyle = '#5a3a22';
    g.fillRect(110, 410, 260, 14);
    g.fillStyle = '#7a5430';
    g.fillRect(118, 396, 244, 14);
    g.fillStyle = '#8a6238';
    g.fillRect(118, 396, 244, 4);
    g.fillStyle = '#4a3018';
    g.fillRect(140, 424, 22, 58);
    g.fillRect(318, 424, 22, 58);

    /* 灯 */
    g.fillStyle = '#5a3a22';
    g.fillRect(438, 190, 5, 120);
    g.fillStyle = '#e07a2a';
    g.fillRect(433, 180, 13, 11);
    g.fillStyle = '#f0c050';
    g.fillRect(436, 174, 7, 10);

    for (let i = 0; i < 60; i++) {
      g.fillStyle = i % 2 ? '#4a4038' : '#1a1412';
      g.fillRect(Math.floor(rnd() * W), 340 + Math.floor(rnd() * 160), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 390);
    vg.addColorStop(0, 'rgba(255, 220, 160, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.52)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  const catalog = createCatalog({
    prefix: 'product',
    items: PRODUCTS,
    map: PROD_MAP,
    key: 'item',
    filterGroups: PROD_CATS,
    groupOf: it => it.cat,
    nameOf: it => it.name,
    titleOf: it => `${it.en} · ${prodCatName(it.cat)}`,
    gallery: {
      w: PROD_W,
      h: PROD_H,
      gridClass: 'prgrid',
      cellClass: 'prcell',
      draw: (g, it) => drawProductIcon(g, it, 0.25),
      labelOf: it => it.name,
      metaOf: it => prodCatName(it.cat)
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
    const it = PROD_MAP[state.item];
    catalog.sync(state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${prodCatName(it.cat)} · ${it.en}`;
    statusEl.innerHTML =
      `<dt>产品</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>分类</dt><dd>${prodCatName(it.cat)}</dd>` +
      `<dt>编号</dt><dd>${PRODUCTS.indexOf(it) + 1} / ${PRODUCTS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = PROD_MAP[state.item];
    const phase = state.time * 0.4;
    const z = state.zoom;
    const sw = PROD_W * z;
    const sh = PROD_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 398 - sh;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    const glow = ctx.createRadialGradient(W / 2, sy + sh * 0.45, 10, W / 2, sy + sh * 0.45, sw * 0.7);
    glow.addColorStop(0, 'rgba(255, 226, 150, 0.18)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ellipse(ctx, W / 2, 400, Math.round(sw * 0.22), Math.round(z * 0.9), 'rgba(0,0,0,0.42)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawProductIcon(ctx, it, phase);
    ctx.restore();

    const rnd = mulberry32(PRODUCTS.indexOf(it) + 71);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.8 + rnd() * TAU) * (sw * 0.4 + rnd() * 28);
      const py = sy + sh * 0.45 + Math.sin(state.time * 1.1 + i) * sh * 0.28;
      ctx.globalAlpha = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.42;
      ctx.fillStyle = i % 2 ? '#ffe08a' : '#e0f0ff';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(12, 10, 8, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${it.name} · ${prodCatName(it.cat)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   product ${PRODUCTS.indexOf(it) + 1}/${PRODUCTS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = PROD_MAP[state.item];
    exportItemPng(it, PROD_W, PROD_H, (g, item) => drawProductIcon(g, item, 0.5),
      `sdv-product-${it.id}.png`, 8);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(10, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('product-png').addEventListener('click', exportPng);

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


