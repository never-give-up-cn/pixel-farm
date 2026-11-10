/* UI 图标面板：状态、天气、时间、技能、菜单、增益 60 个图标。 */

import {
  UI_ICONS, UI_MAP, UI_GROUPS, uiGroupName,
  drawUiIcon, UI_W, UI_H
} from './anim/ui-icons.js';
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

export function initUiPanel() {
  const canvas = document.getElementById('ui-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'health',
    filter: 'all',
    zoom: 8,
    time: 0
  };

  const listHost = document.getElementById('ui-list');
  const filterHost = document.getElementById('ui-filters');
  const statusEl = document.getElementById('ui-status');
  const noteEl = document.getElementById('ui-note');
  const countEl = document.getElementById('ui-count');
  const zoomInput = document.getElementById('ui-zoom');
  const zoomOut = document.getElementById('ui-zoom-out');

  /* ---------- 背景：UI 设计稿 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(9797);

    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1b2634');
    grad.addColorStop(1, '#10161e');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    /* 网格 */
    g.strokeStyle = 'rgba(120, 160, 200, 0.08)';
    g.lineWidth = 1;
    for (let x = 0; x < W; x += 24) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    }
    for (let y = 0; y < H; y += 24) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }

    /* 顶部 HUD */
    g.fillStyle = 'rgba(10, 16, 24, 0.8)';
    g.fillRect(0, 0, W, 44);
    g.fillStyle = '#e9c96f';
    g.font = '12px monospace';
    g.fillText('PIXEL FARM / UI KIT', 14, 26);
    g.fillStyle = '#4a6a8a';
    g.fillRect(170, 14, 120, 4);
    g.fillStyle = '#5aa04a';
    g.fillRect(170, 14, 72, 4);
    g.fillStyle = '#e0c060';
    g.fillRect(310, 12, 10, 10);
    g.fillStyle = '#2a3a4a';
    g.fillRect(330, 12, 80, 10);
    g.fillStyle = '#4a8ac0';
    g.fillRect(332, 14, 48, 6);

    /* 底部按钮栏 */
    g.fillStyle = 'rgba(10, 16, 24, 0.7)';
    g.fillRect(0, 330, W, 24);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = i === 0 ? '#3a5a7a' : '#1e2a38';
      g.fillRect(20 + i * 64, 334, 52, 16);
      g.fillStyle = i === 0 ? '#a0d0f0' : '#4a6a8a';
      g.fillRect(28 + i * 64, 339, 30, 2);
    }

    /* 侧边面板 */
    g.fillStyle = 'rgba(20, 28, 38, 0.6)';
    g.fillRect(20, 70, 120, 230);
    g.fillRect(340, 70, 120, 230);
    g.strokeStyle = '#2a4054';
    g.strokeRect(20, 70, 120, 230);
    g.strokeRect(340, 70, 120, 230);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = '#243444';
      g.fillRect(32, 90 + i * 40, 96, 26);
      g.fillStyle = i % 2 ? '#3a5a7a' : '#4a7a5a';
      g.fillRect(38, 96 + i * 40, 16, 14);
      g.fillStyle = '#2a3a4a';
      g.fillRect(60, 98 + i * 40, 50, 3);
      g.fillRect(60, 104 + i * 40, 34, 3);
    }

    /* 扫描线 */
    for (let y = 0; y < H; y += 4) {
      g.fillStyle = 'rgba(255,255,255,0.012)';
      g.fillRect(0, y, W, 1);
    }

    const vg = g.createRadialGradient(W / 2, 240, 80, W / 2, 240, 380);
    vg.addColorStop(0, 'rgba(120, 190, 255, 0.10)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 2 ? '#2a4054' : '#14202a';
      g.fillRect(Math.floor(rnd() * W), 70 + Math.floor(rnd() * 250), 2, 2);
    }

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  const catalog = createCatalog({
    prefix: 'ui',
    items: UI_ICONS,
    map: UI_MAP,
    key: 'item',
    filterGroups: UI_GROUPS,
    groupOf: it => it.group,
    nameOf: it => it.name,
    titleOf: it => `${it.en} · ${uiGroupName(it.group)} · ${it.desc}`,
    gallery: {
      w: UI_W,
      h: UI_H,
      gridClass: 'uigrid',
      cellClass: 'uicell',
      draw: (g, it) => drawUiIcon(g, it, 0.25),
      labelOf: it => it.name,
      metaOf: it => uiGroupName(it.group)
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
    const it = UI_MAP[state.item];
    catalog.sync(state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    noteEl.textContent = `${uiGroupName(it.group)} · ${it.desc}`;
    statusEl.innerHTML =
      `<dt>图标</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>分组</dt><dd>${uiGroupName(it.group)}</dd>` +
      `<dt>用途</dt><dd>${it.desc}</dd>` +
      `<dt>编号</dt><dd>${UI_ICONS.indexOf(it) + 1} / ${UI_ICONS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = UI_MAP[state.item];
    const phase = state.time * 0.5;
    const z = state.zoom;
    const sw = UI_W * z;
    const sh = UI_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 260 - sh / 2 + Math.round(Math.sin(state.time * 1.5) * 2);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 展示卡 */
    ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
    ctx.fillRect(sx - 24, sy - 24, sw + 48, sh + 104);
    ctx.strokeStyle = '#5a8ab0';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 22, sy - 22, sw + 44, sh + 100);
    ctx.strokeStyle = '#2a4054';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 18, sy - 18, sw + 36, sh + 92);

    const glow = ctx.createRadialGradient(W / 2, sy + sh / 2, 10, W / 2, sy + sh / 2, sw * 0.7);
    glow.addColorStop(0, 'rgba(120, 200, 255, 0.18)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawUiIcon(ctx, it, phase);
    ctx.restore();

    /* 名称 */
    ctx.fillStyle = '#f4e6c6';
    ctx.font = '15px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.name, W / 2, 352);
    ctx.fillStyle = '#9ac0e0';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   ${uiGroupName(it.group)}`, W / 2, 372);
    ctx.fillStyle = '#b8c8d8';
    ctx.font = '11px "Microsoft YaHei", monospace';
    ctx.fillText(it.desc, W / 2, 392);
    ctx.textAlign = 'left';

    /* 粒子 */
    const rnd = mulberry32(UI_ICONS.indexOf(it) + 37);
    for (let i = 0; i < 8; i++) {
      const px = W / 2 + Math.cos(state.time * 0.8 + rnd() * TAU) * (sw * 0.4 + rnd() * 24);
      const py = sy + sh / 2 + Math.sin(state.time * 1.1 + i) * sh * 0.3;
      ctx.globalAlpha = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.4;
      ctx.fillStyle = i % 2 ? '#a0e0ff' : '#e0f0ff';
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(10, 14, 20, 0.86)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#9ad0f0';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${it.name} · ${uiGroupName(it.group)}`, 14, H - 27);
    ctx.fillStyle = '#7a96b0';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   ui ${UI_ICONS.indexOf(it) + 1}/${UI_ICONS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = UI_MAP[state.item];
    exportItemPng(it, UI_W, UI_H, (g, item) => drawUiIcon(g, item, 0.5),
      `sdv-ui-${it.id}.png`, 8);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(10, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('ui-png').addEventListener('click', exportPng);

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


