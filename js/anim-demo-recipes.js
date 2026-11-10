/* 食谱卡面板：81 道料理的配方卡、配料与增益。 */

import {
  RECIPES, RECIPE_MAP, RECIPE_CATS, recipeCatName,
  DISH_MAP, drawDish
} from './anim/recipes.js';
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

const CAT_COLORS = {
  soup: '#d08a3a',
  salad: '#5aa04a',
  fish: '#4a8ac0',
  breakfast: '#e0c060',
  dessert: '#e08ab0',
  main: '#c04a3a',
  drink: '#8a5ac0'
};

export function initRecipePanel() {
  const canvas = document.getElementById('recipe-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    item: 'pumpkin_pie',
    filter: 'all',
    time: 0
  };

  const listHost = document.getElementById('recipe-list');
  const filterHost = document.getElementById('recipe-filters');
  const statusEl = document.getElementById('recipe-status');
  const noteEl = document.getElementById('recipe-note');
  const countEl = document.getElementById('recipe-count');

  /* ---------- 背景：厨房餐桌 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(5151);

    g.fillStyle = '#241b16';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < 330; y += 32) {
      g.fillStyle = y % 64 ? '#30231c' : '#372a22';
      g.fillRect(0, y, W, 30);
      g.fillStyle = '#19110d';
      g.fillRect(0, y + 30, W, 2);
      for (let x = 0; x < W; x += 108) g.fillRect(x, y, 1, 30);
    }

    /* 货架 */
    g.fillStyle = '#5a3a22';
    g.fillRect(36, 76, 150, 6);
    g.fillRect(36, 146, 150, 6);
    g.fillRect(294, 76, 150, 6);
    g.fillRect(294, 146, 150, 6);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = ['#c08030', '#8a4a3a', '#5a7a3a', '#4a6a8a', '#8a6a3a'][i % 5];
      g.fillRect(48 + i * 22, 48, 12, 26);
      g.fillStyle = '#e0d0b0';
      g.fillRect(51 + i * 22, 44, 6, 5);
      g.fillStyle = ['#c08030', '#8a4a3a', '#5a7a3a', '#4a6a8a', '#8a6a3a'][i % 5];
      g.fillRect(48 + i * 22, 118, 12, 26);
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

    /* 灶台 */
    g.fillStyle = '#2a2a2a';
    g.fillRect(40, 250, 110, 80);
    g.fillStyle = '#3a3a3a';
    g.fillRect(44, 254, 102, 32);
    ellipse(g, 72, 270, 14, 10, '#1a1a1a');
    ellipse(g, 116, 270, 14, 10, '#1a1a1a');
    ellipse(g, 72, 270, 9, 6, '#4a4a4a');
    ellipse(g, 116, 270, 9, 6, '#4a4a4a');
    g.fillStyle = '#d0d0d0';
    g.fillRect(48, 292, 94, 3);

    /* 地面/桌面 */
    g.fillStyle = '#3a2a20';
    g.fillRect(0, 330, W, H - 330);
    for (let y = 338; y < H; y += 26) {
      g.fillStyle = '#46342a';
      g.fillRect(0, y, W, 2);
    }
    g.fillStyle = '#6a4a2a';
    g.fillRect(0, 382, W, 18);
    g.fillStyle = '#8a6238';
    g.fillRect(0, 382, W, 4);

    /* 厨具 */
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#6a6a6a';
      g.fillRect(200 + i * 24, 356, 14, 3);
      g.fillRect(205 + i * 24, 359, 3, 16);
    }

    for (let i = 0; i < 45; i++) {
      g.fillStyle = i % 2 ? '#4a4038' : '#17110d';
      g.fillRect(Math.floor(rnd() * W), 390 + Math.floor(rnd() * 110), 3, 2);
    }

    const vg = g.createRadialGradient(W / 2, 250, 100, W / 2, 250, 380);
    vg.addColorStop(0, 'rgba(255, 210, 140, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const cat of RECIPE_CATS) {
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

  for (const it of RECIPES) {
    const b = document.createElement('button');
    b.textContent = it.name;
    b.dataset.item = it.id;
    b.title = `${it.en} · ${recipeCatName(it.cat)}`;
    b.addEventListener('click', () => selectItem(it.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = RECIPE_MAP[b.dataset.item];
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
    if (!RECIPE_MAP[id]) return;
    state.item = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const it = RECIPE_MAP[state.item];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.item === state.item);
    noteEl.textContent = `${recipeCatName(it.cat)} · ${it.buff}`;
    statusEl.innerHTML =
      `<dt>料理</dt><dd>${it.name} (${it.en})</dd>` +
      `<dt>分类</dt><dd>${recipeCatName(it.cat)}</dd>` +
      `<dt>配料</dt><dd>${it.ingredients.join('、')}</dd>` +
      `<dt>增益</dt><dd>${it.buff}</dd>` +
      `<dt>编号</dt><dd>${RECIPES.indexOf(it) + 1} / ${RECIPES.length}</dd>`;
  }

  /* ---------- 大配方卡 ---------- */
  function drawCard(g, it, x, y, w, h, scale) {
    const col = CAT_COLORS[it.cat] || '#c8a050';
    g.save();

    /* 阴影与纸张 */
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x + 6, y + 6, w, h);
    g.fillStyle = '#b8a078';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#e8d8b0';
    g.fillRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle = '#fff8e0';
    g.fillRect(x + 7, y + 7, w - 14, 3);
    g.strokeStyle = '#8a6a40';
    g.lineWidth = 2;
    g.strokeRect(x + 3, y + 3, w - 6, h - 6);

    /* 标题条 */
    g.fillStyle = col;
    g.fillRect(x + 8, y + 12, w - 16, 34);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.fillRect(x + 8, y + 12, w - 16, 3);
    g.fillStyle = '#fff8e0';
    g.font = 'bold 16px "Microsoft YaHei", monospace';
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillText(it.name, x + 16, y + 30);

    /* 料理图标 */
    const iconX = x + 16;
    const iconY = y + 60;
    const iconScale = 4 * scale;
    g.save();
    g.translate(iconX, iconY);
    g.scale(iconScale, iconScale);
    drawDish(g, it.dish, 0.35);
    g.restore();

    /* 配料标题 */
    const tx = x + 160;
    let ty = y + 64;
    g.fillStyle = '#6a4a2a';
    g.font = 'bold 12px "Microsoft YaHei", monospace';
    g.fillText('配料', tx, ty);
    ty += 20;
    g.font = '13px "Microsoft YaHei", monospace';
    for (const line of it.ingredients) {
      g.fillStyle = col;
      g.fillRect(tx - 10, ty - 5, 3, 3);
      g.fillStyle = '#3a2a1a';
      g.fillText(line, tx, ty);
      ty += 18;
    }

    /* 增益 */
    g.fillStyle = '#6a4a2a';
    g.font = 'bold 12px "Microsoft YaHei", monospace';
    g.fillText('增益', x + 16, y + 252);
    g.fillStyle = '#3a2a1a';
    g.font = '13px "Microsoft YaHei", monospace';
    g.fillText(it.buff, x + 16, y + 272);
    g.fillStyle = '#8a6a40';
    g.font = '11px monospace';
    g.fillText(it.en, x + 16, y + 302);

    /* 装饰印章 */
    ellipse(g, x + w - 42, y + h - 46, 22, 22, col);
    ellipse(g, x + w - 42, y + h - 46, 18, 18, '#e8d8b0');
    g.fillStyle = col;
    g.font = '11px "Microsoft YaHei", monospace';
    g.textAlign = 'center';
    g.fillText('食谱', x + w - 42, y + h - 46);
    g.textAlign = 'left';

    g.restore();
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const it = RECIPE_MAP[state.item];

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    drawCard(ctx, it, 48, 34, 384, 344, 1);

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 9, 7, 0.84)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${it.name} · ${recipeCatName(it.cat)} · ${it.buff}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${it.en}   recipe ${RECIPES.indexOf(it) + 1}/${RECIPES.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const it = RECIPE_MAP[state.item];
    const card = makeCanvas(400, 360);
    drawCard(card.ctx, it, 8, 8, 384, 344, 1);
    const scale = 2;
    const out = document.createElement('canvas');
    out.width = 400 * scale;
    out.height = 360 * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(card.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-recipe-${it.id}.png`);
  }

  document.getElementById('recipe-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('recipe-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'recgrid';

    for (const it of RECIPES) {
      const cell = document.createElement('div');
      cell.className = 'reccell';
      cell.title = `${it.en} · ${recipeCatName(it.cat)}`;
      const cv = document.createElement('canvas');
      cv.width = 64;
      cv.height = 80;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;

      /* 迷你配方卡 */
      const col = CAT_COLORS[it.cat] || '#c8a050';
      g.fillStyle = '#b8a078';
      g.fillRect(2, 2, 60, 76);
      g.fillStyle = '#e8d8b0';
      g.fillRect(4, 4, 56, 72);
      g.fillStyle = col;
      g.fillRect(4, 4, 56, 10);
      g.save();
      g.translate(16, 18);
      g.scale(1, 1);
      drawDish(g, it.dish, 0.25);
      g.restore();
      const n = Math.min(4, it.ingredients.length);
      for (let i = 0; i < n; i++) {
        g.fillStyle = i % 2 ? col : '#8a6a40';
        g.fillRect(8 + i * 13, 58, 9, 5);
      }
      g.fillStyle = '#8a6a40';
      g.fillRect(8, 68, 48, 2);

      const name = document.createElement('b');
      name.textContent = it.name;
      const meta = document.createElement('span');
      meta.textContent = recipeCatName(it.cat);
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

  function tick() {
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
