/* 装备图鉴面板：110 件装备（62 武器 / 30 戒指 / 18 靴子）。
 * 类别筛选、冒险家公会展示台、属性面板与图鉴。 */

import {
  EQUIPMENT, EQUIP_MAP, EQUIP_CATS, equipCatName,
  drawEquipment, EQUIP_W, EQUIP_H
} from './anim/equipment.js';
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

function statsText(it) {
  if (it.cat === 'ring') return `效果：${it.effect}`;
  if (it.cat === 'boots') return `防御 +${it.def} · 免疫 +${it.imm}`;
  return `等级 ${it.level} · 伤害 ${it.dmg} · 暴击 ${it.crit}`;
}

export function initEquipmentPanel() {
  const canvas = document.getElementById('equipment-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'steel_smallsword',
    filter: 'all',
    zoom: 9,
    time: 0
  };

  const listHost = document.getElementById('equipment-list');
  const filterHost = document.getElementById('equipment-filters');
  const statusEl = document.getElementById('equipment-status');
  const noteEl = document.getElementById('equipment-note');
  const countEl = document.getElementById('equipment-count');
  const zoomInput = document.getElementById('equipment-zoom');
  const zoomOut = document.getElementById('equipment-zoom-out');

  /* ---------- 背景：冒险家公会 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(7676);

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
    g.fillRect(48, 14, 12, 302);
    g.fillRect(420, 14, 12, 302);

    /* 旗帜 */
    const banner = (x, c1, c2) => {
      g.fillStyle = c1;
      g.fillRect(x, 30, 46, 110);
      g.fillStyle = c2;
      g.fillRect(x, 30, 46, 8);
      g.fillRect(x, 132, 46, 8);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? c1 : c2;
        g.fillRect(x + i * 8, 140, 8, 6 + (i % 3) * 4);
      }
      g.fillStyle = '#e8d080';
      g.fillRect(x + 21, 58, 4, 4);
      g.fillRect(x + 19, 62, 8, 4);
      g.fillRect(x + 17, 66, 12, 4);
      g.fillRect(x + 19, 70, 8, 4);
      g.fillRect(x + 21, 74, 4, 4);
    };
    banner(82, '#3a5a7a', '#2a4058');
    banner(352, '#5a3a6a', '#40284a');

    /* 武器架 */
    const rack = (x, y, w) => {
      g.fillStyle = '#5a3a22';
      g.fillRect(x, y, w, 6);
      g.fillRect(x, y + 70, w, 6);
      g.fillStyle = '#3a2414';
      g.fillRect(x, y, 6, 76);
      g.fillRect(x + w - 6, y, 6, 76);
      for (let i = 0; i < 5; i++) {
        const sx = x + 18 + i * 18;
        g.fillStyle = '#8a9aa8';
        g.fillRect(sx, y + 10, 3, 48);
        g.fillStyle = '#d0d8e0';
        g.fillRect(sx, y + 10, 1, 44);
        g.fillStyle = '#c8a050';
        g.fillRect(sx - 3, y + 56, 9, 3);
        g.fillStyle = '#5a3a22';
        g.fillRect(sx, y + 59, 3, 8);
      }
    };
    rack(70, 190, 120);
    rack(290, 190, 120);

    /* 盾牌 */
    g.fillStyle = '#5a5a6a';
    g.fillRect(224, 60, 34, 40);
    g.fillStyle = '#8a8a9a';
    g.fillRect(226, 62, 30, 34);
    g.fillStyle = '#c8a050';
    g.fillRect(240, 68, 6, 6);
    g.fillRect(236, 74, 14, 6);
    g.fillRect(240, 80, 6, 6);

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
    g.fillRect(110, 410, 260, 16);
    g.fillStyle = '#6b4a2a';
    g.fillRect(118, 396, 244, 16);
    g.fillStyle = '#8a6238';
    g.fillRect(118, 396, 244, 4);
    g.fillStyle = '#3a2418';
    g.fillRect(140, 426, 24, 60);
    g.fillRect(316, 426, 24, 60);

    /* 火把 */
    for (const x of [40, 434]) {
      g.fillStyle = '#5a3a22';
      g.fillRect(x, 236, 6, 44);
      g.fillStyle = '#e07a2a';
      g.fillRect(x - 3, 226, 12, 12);
      g.fillStyle = '#f0c050';
      g.fillRect(x, 218, 6, 12);
      g.fillStyle = '#fff0a0';
      g.fillRect(x + 2, 220, 2, 6);
    }

    /* 悬挂锁链与尘埃 */
    for (let i = 0; i < 3; i++) {
      const x = 190 + i * 44;
      g.fillStyle = '#4a4a52';
      g.fillRect(x, 14, 2, 24);
      g.fillRect(x + 4, 38, 2, 18);
    }
    for (let i = 0; i < 70; i++) {
      g.fillStyle = i % 2 ? '#3a3940' : '#17161b';
      g.fillRect(Math.floor(rnd() * W), 330 + Math.floor(rnd() * 180), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 250, 120, W / 2, 250, 390);
    vg.addColorStop(0, 'rgba(255, 210, 140, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of EQUIP_CATS) {
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

  for (const it of EQUIPMENT) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.dataset.item = it.id;
    b.title = `${it.en} · ${equipCatName(it.cat)}`;
    b.addEventListener('click', () => selectItem(it.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = EQUIP_MAP[b.dataset.item];
      const show = state.filter === 'all' || it.cat === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectItem(id) {
    if (!EQUIP_MAP[id]) return;
    state.item = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const it = EQUIP_MAP[state.item];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.item === state.item);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;

    if (it.cat === 'ring') {
      noteEl.textContent = `戒指 · ${it.effect}`;
      statusEl.innerHTML =
        `<dt>装备</dt><dd>${it.name} (${it.en})</dd>` +
        `<dt>类型</dt><dd>戒指</dd>` +
        `<dt>效果</dt><dd>${it.effect}</dd>` +
        `<dt>编号</dt><dd>${EQUIPMENT.indexOf(it) + 1} / ${EQUIPMENT.length}</dd>`;
    } else if (it.cat === 'boots') {
      noteEl.textContent = `靴子 · 防御 +${it.def} · 免疫 +${it.imm}`;
      statusEl.innerHTML =
        `<dt>装备</dt><dd>${it.name} (${it.en})</dd>` +
        `<dt>类型</dt><dd>靴子</dd>` +
        `<dt>防御</dt><dd>+${it.def}</dd>` +
        `<dt>免疫</dt><dd>+${it.imm}</dd>` +
        `<dt>编号</dt><dd>${EQUIPMENT.indexOf(it) + 1} / ${EQUIPMENT.length}</dd>`;
    } else {
      noteEl.textContent = `${equipCatName(it.cat)} · 等级 ${it.level} · 伤害 ${it.dmg}`;
      statusEl.innerHTML =
        `<dt>装备</dt><dd>${it.name} (${it.en})</dd>` +
        `<dt>类型</dt><dd>${equipCatName(it.cat)}</dd>` +
        `<dt>等级</dt><dd>${it.level}</dd>` +
        `<dt>伤害</dt><dd>${it.dmg}</dd>` +
        `<dt>暴击</dt><dd>${it.crit}</dd>` +
        `<dt>词条</dt><dd>${it.stat}</dd>` +
        `<dt>编号</dt><dd>${EQUIPMENT.indexOf(it) + 1} / ${EQUIPMENT.length}</dd>`;
    }
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = EQUIP_MAP[state.item];
    const z = state.zoom;
    const sw = EQUIP_W * z;
    const sh = EQUIP_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = 240 - sh / 2 + Math.round(Math.sin(state.time * 1.8) * 3);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 展示台光晕 */
    const glow = ctx.createRadialGradient(W / 2, sy + sh * 0.45, 12, W / 2, sy + sh * 0.45, sw * 0.8);
    const tint = it.cat === 'ring'
      ? 'rgba(255, 220, 120, 0.20)'
      : (it.cat === 'boots' ? 'rgba(160, 220, 255, 0.12)' : 'rgba(255, 240, 200, 0.13)');
    glow.addColorStop(0, tint);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* 武器挥动残影 */
    if (it.cat !== 'ring' && it.cat !== 'boots') {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = '#e9c96f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + sw * 0.54, sy + sh * 0.5, sw * 0.48, Math.PI * 1.08, Math.PI * 1.55);
      ctx.stroke();
      ctx.globalAlpha = 0.14;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(sx + sw * 0.54, sy + sh * 0.5, sw * 0.52, Math.PI * 1.04, Math.PI * 1.58);
      ctx.stroke();
      ctx.restore();
    }

    ellipse(ctx, W / 2, 408, Math.round(sw * 0.32), Math.round(z * 1.2), 'rgba(0,0,0,0.4)');

    /* 装备本体 */
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawEquipment(ctx, it, state.time * 0.7);
    ctx.restore();

    /* 漂浮粒子 */
    const rnd = mulberry32(EQUIPMENT.indexOf(it) + 77);
    for (let i = 0; i < 8; i++) {
      const a = state.time * 0.8 + rnd() * Math.PI * 2;
      const r = sw * (0.42 + rnd() * 0.22);
      const px = W / 2 + Math.cos(a) * r;
      const py = sy + sh * 0.45 + Math.sin(a) * r * 0.55;
      const al = 0.12 + (Math.sin(state.time * 2 + i) * 0.5 + 0.5) * 0.5;
      ctx.globalAlpha = al;
      ctx.fillStyle = it.cat === 'ring' ? '#ffe08a' : (it.cat === 'boots' ? '#a0d8ff' : '#f0e0b0');
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
    ctx.globalAlpha = 1;

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 10, 8, 0.82)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${it.name} · ${equipCatName(it.cat)}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   ${statsText(it)}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = EQUIP_MAP[state.item];
    const cell = makeCanvas(EQUIP_W, EQUIP_H);
    drawEquipment(cell.ctx, it, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = EQUIP_W * scale;
    out.height = EQUIP_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-equipment-${it.id}.png`);
  }

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(12, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  document.getElementById('equipment-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('equipment-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'eqgrid';

    for (const it of EQUIPMENT) {
      const cell = document.createElement('div');
      cell.className = 'eqcell';
      cell.title = `${it.en} · ${equipCatName(it.cat)} · ${statsText(it)}`;
      const cv = document.createElement('canvas');
      cv.width = EQUIP_W;
      cv.height = EQUIP_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawEquipment(g, it, 0.25);
      const name = document.createElement('b');
      name.textContent = it.name;
      const meta = document.createElement('span');
      meta.textContent = it.cat === 'ring'
        ? '戒指'
        : (it.cat === 'boots' ? `防 ${it.def} / 免 ${it.imm}` : `${equipCatName(it.cat)} ${it.level}`);
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
