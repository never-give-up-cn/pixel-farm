/* 树木图鉴面板：10 种野生树 + 8 种果树，支持生长阶段与四季切换。 */

import {
  TREES, TREE_MAP, TREE_STAGES, TREE_SEASONS, drawTree,
  TREE_W, TREE_H, hasFruit
} from './anim/trees.js';
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

export function initTreePanel() {
  const canvas = document.getElementById('tree-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    tree: 'apple',
    stage: 4,
    season: '秋',
    zoom: 8,
    grid: true,
    time: 0
  };

  const treeHost = document.getElementById('tree-list');
  const stageHost = document.getElementById('tree-stages');
  const seasonHost = document.getElementById('tree-seasons');
  const stageOut = document.getElementById('tree-stage-out');
  const statusEl = document.getElementById('tree-status');
  const noteEl = document.getElementById('tree-note');
  const zoomInput = document.getElementById('tree-zoom');
  const zoomOut = document.getElementById('tree-zoom-out');
  const gridBtn = document.getElementById('tree-grid');

  /* ---------- 背景：果园草地 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(515151);

    g.fillStyle = '#22331f';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a3f25';
    g.fillRect(0, 180, W, H - 180);
    g.fillStyle = '#33492a';
    g.fillRect(0, 380, W, H - 380);

    for (let i = 0; i < 180; i++) {
      const x = Math.floor(rnd() * W);
      const y = 40 + Math.floor(rnd() * (H - 60));
      g.fillStyle = rnd() > 0.5 ? '#365528' : '#3f6031';
      g.fillRect(x, y, 1, 2 + Math.floor(rnd() * 2));
    }
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(rnd() * W);
      const y = 220 + Math.floor(rnd() * 200);
      g.fillStyle = ['#f2d06b', '#e88aa0', '#e8f0f4'][i % 3];
      g.fillRect(x, y, 1, 1);
      g.fillRect(x + 2, y, 1, 1);
      g.fillRect(x + 1, y - 1, 1, 1);
    }

    /* 树坑 */
    const px = 148, py = 382, pw = 184, ph = 60;
    g.fillStyle = '#4a3320';
    g.fillRect(px, py, pw, ph);
    g.fillStyle = '#5c4028';
    for (let y = py + 5; y < py + ph; y += 12) g.fillRect(px + 6, y, pw - 12, 5);
    g.fillStyle = 'rgba(30, 20, 12, 0.25)';
    g.fillRect(px, py + ph - 6, pw, 6);

    const vg = g.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 列表 / 阶段 / 季节 ---------- */
  for (const t of TREES) {
    const b = document.createElement('button');
    b.textContent = t.name;
    b.dataset.tree = t.id;
    b.title = `${t.en} · ${t.type === 'fruit' ? '果树' : '野生树'}${t.fruitSeason ? ` · ${t.fruitSeason}季结果` : ''}`;
    b.addEventListener('click', () => selectTree(t.id));
    treeHost.appendChild(b);
  }

  for (let i = 0; i < TREE_STAGES.length; i++) {
    const b = document.createElement('button');
    b.textContent = `${i} ${TREE_STAGES[i]}`;
    b.dataset.stage = String(i);
    b.addEventListener('click', () => {
      state.stage = i;
      sync();
      render();
    });
    stageHost.appendChild(b);
  }

  for (const s of TREE_SEASONS) {
    const b = document.createElement('button');
    b.textContent = s;
    b.dataset.season = s;
    b.addEventListener('click', () => {
      state.season = s;
      sync();
      render();
    });
    seasonHost.appendChild(b);
  }

  document.getElementById('tree-next-season').addEventListener('click', () => {
    const i = TREE_SEASONS.indexOf(state.season);
    state.season = TREE_SEASONS[(i + 1) % TREE_SEASONS.length];
    sync();
    render();
  });

  document.getElementById('tree-next-stage').addEventListener('click', () => {
    state.stage = (state.stage + 1) % TREE_STAGES.length;
    sync();
    render();
  });

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(5, Math.min(8, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  gridBtn.addEventListener('click', () => {
    state.grid = !state.grid;
    sync();
    render();
  });

  document.getElementById('tree-png').addEventListener('click', exportPng);

  function selectTree(id) {
    const t = TREE_MAP[id];
    if (!t) return;
    state.tree = id;
    state.stage = 4;
    state.season = t.fruitSeason || '春';
    sync();
    const b = treeHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const t = TREE_MAP[state.tree];
    for (const b of treeHost.children) b.classList.toggle('active', b.dataset.tree === state.tree);
    for (const b of stageHost.children) b.classList.toggle('active', Number(b.dataset.stage) === state.stage);
    for (const b of seasonHost.children) b.classList.toggle('active', b.dataset.season === state.season);
    stageOut.textContent = `${state.stage} · ${TREE_STAGES[state.stage]}`;
    gridBtn.classList.toggle('on', state.grid);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;

    const fruit = hasFruit(t, state.season, state.stage);
    if (t.type === 'fruit') {
      noteEl.textContent = `果树：${t.fruitSeason}季结果${fruit ? '（当前结果中）' : '（当前无果）'}；冬季落叶。`;
    } else {
      noteEl.textContent = '野生树：四季外观不同，松树/棕榈等常绿；橡树/枫树冬季落叶。';
    }

    statusEl.innerHTML =
      `<dt>树木</dt><dd>${t.name} (${t.en})</dd>` +
      `<dt>类型</dt><dd>${t.type === 'fruit' ? '果树' : '野生树'}</dd>` +
      `<dt>阶段</dt><dd>${state.stage} / 4 · ${TREE_STAGES[state.stage]}</dd>` +
      `<dt>季节</dt><dd>${state.season}</dd>` +
      `<dt>结果季</dt><dd>${t.fruitSeason || '—'}</dd>` +
      `<dt>结果</dt><dd>${fruit ? '是' : '否'}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const t = TREE_MAP[state.tree];
    const z = state.zoom;
    const sw = TREE_W * z;
    const sh = TREE_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = H - sh - 56;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    if (state.grid) {
      ctx.strokeStyle = 'rgba(240, 235, 210, 0.16)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      ctx.strokeStyle = 'rgba(233, 201, 111, 0.35)';
      ctx.beginPath();
      const by = Math.round(sy + 50 * z) + 0.5;
      ctx.moveTo(0, by);
      ctx.lineTo(W, by);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawTree(ctx, t, state.stage, state.season, state.time * 0.5);
    ctx.restore();

    const fruit = hasFruit(t, state.season, state.stage);
    ctx.fillStyle = 'rgba(10, 14, 12, 0.72)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${t.name} · ${TREE_STAGES[state.stage]} · ${state.season}季${fruit ? ' · 结果中' : ''}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${t.en}   ${t.type === 'fruit' ? `fruit in ${t.fruitSeason}` : 'wild tree'}   stage ${state.stage}/4`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const t = TREE_MAP[state.tree];
    const cell = makeCanvas(TREE_W, TREE_H);
    drawTree(cell.ctx, t, state.stage, state.season, 0.5);
    const scale = 6;
    const out = document.createElement('canvas');
    out.width = TREE_W * scale;
    out.height = TREE_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-tree-${t.id}-${state.season}-stage${state.stage}.png`);
  }

  /* ---------- 四季 × 全部树木 ---------- */
  function buildGallery() {
    const host = document.getElementById('tree-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'tgrid';

    grid.appendChild(document.createElement('div'));
    for (const t of TREES) {
      const h = document.createElement('div');
      h.className = 'thead';
      h.textContent = t.name;
      h.title = t.en;
      grid.appendChild(h);
    }

    for (const season of TREE_SEASONS) {
      const label = document.createElement('div');
      label.className = 'tlabel';
      label.textContent = season;
      grid.appendChild(label);

      for (const t of TREES) {
        const cell = document.createElement('div');
        cell.className = 'tcell';
        cell.title = `${t.name} · ${season}季`;
        const cv = document.createElement('canvas');
        cv.width = TREE_W;
        cv.height = TREE_H;
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        drawTree(g, t, 4, season, 0.25);
        cell.appendChild(cv);
        cell.addEventListener('click', () => {
          state.tree = t.id;
          state.stage = 4;
          state.season = season;
          sync();
          render();
          canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        grid.appendChild(cell);
      }
    }

    host.appendChild(grid);
  }

  function tick(dt) {
    state.time += dt;
    render();
  }

  buildGallery();
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
