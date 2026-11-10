/* 杂项收集品面板：邮件、书籍、饰品、电影海报。 */

import {
  MISC, MISC_MAP, MISC_GROUPS, miscGroupName,
  drawMiscIcon, MISC_W, MISC_H
} from './anim/misc.js';
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

export function initMiscPanel() {
  const canvas = document.getElementById('misc-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'welcome_letter',
    filter: 'all',
    zoom: 8,
    time: 0
  };

  const listHost = document.getElementById('misc-list');
  const filterHost = document.getElementById('misc-filters');
  const statusEl = document.getElementById('misc-status');
  const noteEl = document.getElementById('misc-note');
  const countEl = document.getElementById('misc-count');
  const zoomInput = document.getElementById('misc-zoom');
  const zoomOut = document.getElementById('misc-zoom-out');

  /* ---------- 背景：书房 / 邮局 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(7373);

    g.fillStyle = '#241c16';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < 330; y += 32) {
      g.fillStyle = y % 64 ? '#30231c' : '#372a22';
      g.fillRect(0, y, W, 30);
      g.fillStyle = '#19110d';
      g.fillRect(0, y + 30, W, 2);
      for (let x = 0; x < W; x += 108) g.fillRect(x, y, 1, 30);
    }

    /* 书架 */
    g.fillStyle = '#4a3020';
    g.fillRect(28, 62, 150, 7);
    g.fillRect(28, 150, 150, 7);
    g.fillRect(28, 238, 150, 7);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = ['#8a3a3a', '#3a5a8a', '#3a6a3a', '#8a6a3a', '#6a3a6a', '#3a6a6a'][i];
      g.fillRect(38 + i * 22, 34, 13, 27);
      g.fillStyle = '#e0d0b0';
      g.fillRect(42 + i * 22, 30, 5, 5);
      g.fillStyle = ['#8a3a3a', '#3a5a8a', '#3a6a3a', '#8a6a3a', '#6a3a6a', '#3a6a6a'][i];
      g.fillRect(38 + i * 22, 120, 13, 29);
      g.fillRect(38 + i * 22, 208, 13, 29);
    }

    /* 窗户 */
    g.fillStyle = '#4a3020';
    g.fillRect(320, 26, 112, 84);
    g.fillStyle = '#6a8aa0';
    g.fillRect(326, 32, 100, 72);
    g.fillStyle = '#c8e0f0';
    g.fillRect(330, 36, 92, 30);
    g.fillStyle = '#4a3020';
    g.fillRect(376, 32, 4, 72);
    g.fillRect(326, 68, 100, 4);

    /* 桌子 */
    g.fillStyle = '#3a2a20';
    g.fillRect(0, 330, W, H - 330);
    for (let y = 338; y < H; y += 26) {
      g.fillStyle = '#46342a';
      g.fillRect(0, y, W, 2);
    }
    g.fillStyle = '#5a3a22';
    g.fillRect(90, 410, 300, 14);
    g.fillStyle = '#7a5430';
    g.fillRect(98, 396, 284, 14);
    g.fillStyle = '#8a6238';
    g.fillRect(98, 396, 284, 4);
    g.fillStyle = '#3a2418';
    g.fillRect(118, 424, 22, 58);
    g.fillRect(342, 424, 22, 58);

    /* 台灯 */
    g.fillStyle = '#5a3a22';
    g.fillRect(400, 300, 6, 96);
    g.fillStyle = '#c8a050';
    g.fillRect(386, 284, 34, 8);
    g.fillStyle = '#e0c060';
    g.fillRect(392, 288, 22, 8);
    g.fillStyle = '#fff0a0';
    g.fillRect(396, 280, 14, 5);

    /* 邮箱 */
    g.fillStyle = '#4a6a8a';
    g.fillRect(60, 294, 34, 18);
    g.fillStyle = '#6a8ac0';
    g.fillRect(64, 298, 26, 10);
    g.fillStyle = '#8a6a3a';
    g.fillRect(74, 312, 6, 70);
    g.fillStyle = '#d04a3a';
    g.fillRect(92, 292, 4, 22);

    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 2 ? '#3a3028' : '#17110d';
      g.fillRect(Math.floor(rnd() * W), 390 + Math.floor(rnd() * 110), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 240, 100, W / 2, 240, 380);
    vg.addColorStop(0, 'rgba(255, 210, 140, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  const catalog = createCatalog({
    prefix: 'misc',
    items: MISC,
    map: MISC_MAP,
    key: 'item',
    filterGroups: MISC_GROUPS,
    groupOf: it => it.group,
    nameOf: it => it.name,
    titleOf: it => `${it.en} · ${miscGroupName(it.group)} · ${it.desc}`,
    gallery: {
      w: MISC_W,
      h: MISC_H,
      gridClass: 'mgrid',
      cellClass: 'mcell',
      draw: (g, it) => drawMiscIcon(g, it, 0.25),
      labelOf: it => it.name,
      metaOf: it => miscGroupName(it.group)
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
    const it = MISC_MAP[state.item];
    catalog.sync(state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${miscGroupName(it.group)} · ${it.desc}`;
    statusEl.innerHTML =
      `<dt>物品</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>分类</dt><dd>${miscGroupName(it.group)}</dd>` +
      `<dt>说明</dt><dd>${it.desc}</dd>` +
      `<dt>编号</dt><dd>${MISC.indexOf(it) + 1} / ${MISC.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = MISC_MAP[state.item];
    const phase = state.time * 0.4;
    const z = state.zoom;
    const sw = MISC_W * z;
    const sh = MISC_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 320 - sh / 2 + Math.round(Math.sin(state.time * 1.5) * 2);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    const glow = ctx.createRadialGradient(W / 2, sy + sh / 2, 10, W / 2, sy + sh / 2, sw * 0.7);
    glow.addColorStop(0, 'rgba(255, 226, 170, 0.20)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ellipse(ctx, W / 2, 404, Math.round(sw * 0.22), Math.round(z * 0.8), 'rgba(0,0,0,0.4)');

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawMiscIcon(ctx, it, phase);
    ctx.restore();

    const rnd = mulberry32(MISC.indexOf(it) + 61);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.8 + rnd() * TAU) * (sw * 0.4 + rnd() * 24);
      const py = sy + sh / 2 + Math.sin(state.time * 1.1 + i) * sh * 0.3;
      ctx.globalAlpha = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.4;
      ctx.fillStyle = i % 2 ? '#ffe08a' : '#e0f0ff';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(12, 9, 7, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${it.name} · ${miscGroupName(it.group)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   misc ${MISC.indexOf(it) + 1}/${MISC.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = MISC_MAP[state.item];
    exportItemPng(it, MISC_W, MISC_H, (g, item) => drawMiscIcon(g, item, 0.5),
      `sdv-misc-${it.id}.png`, 8);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(10, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('misc-png').addEventListener('click', exportPng);

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


