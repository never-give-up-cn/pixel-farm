/* 植物图鉴面板：单株放大 + 生长阶段 + 全部植物 × 5 阶段画廊。
 * 由 anim-demo.js 在切到「植物」标签时驱动。 */

import {
  PLANTS, PLANT_MAP, PLANT_STAGES, drawPlant, PLANT_W, PLANT_H
} from './anim/plants.js';
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

const KIND_NAMES = {
  root: '根菜', tuber: '块茎', vine: '藤果', gourd: '瓜果',
  grain: '禾本', corn: '高秆', flower: '花卉', bush: '矮丛'
};

export function initPlantPanel() {
  const canvas = document.getElementById('plant-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    plant: 'tomato',
    stage: 0,
    growing: true,
    timer: 0,
    zoom: 10,
    grid: true,
    time: 0
  };

  const plantHost = document.getElementById('plant-list');
  const stageHost = document.getElementById('plant-stages');
  const statusEl = document.getElementById('plant-status');
  const growBtn = document.getElementById('plant-grow');
  const gridBtn = document.getElementById('plant-grid');
  const zoomInput = document.getElementById('plant-zoom');
  const zoomOut = document.getElementById('plant-zoom-out');

  /* ---------- 背景 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(424242);

    g.fillStyle = '#22331f';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#283c23';
    g.fillRect(0, 200, W, H - 200);

    /* 远处草丛 */
    for (let i = 0; i < 140; i++) {
      const x = Math.floor(rnd() * W);
      const y = 40 + Math.floor(rnd() * 170);
      g.fillStyle = rnd() > 0.5 ? '#365528' : '#3f6031';
      g.fillRect(x, y, 1, 2 + Math.floor(rnd() * 2));
    }

    /* 耕地 */
    const px = 74, py = 250, pw = W - 148, ph = 200;
    g.fillStyle = '#4a3320';
    g.fillRect(px, py, pw, ph);
    g.fillStyle = '#5c4028';
    for (let y = py + 6; y < py + ph; y += 18) {
      g.fillRect(px + 6, y, pw - 12, 7);
      g.fillStyle = '#6b4a2b';
      for (let x = px + 8; x < px + pw - 8; x += 13) {
        g.fillRect(x, y + 1, 2, 2);
      }
      g.fillStyle = '#5c4028';
    }
    g.fillStyle = 'rgba(30, 20, 12, 0.28)';
    g.fillRect(px, py + ph - 8, pw, 8);

    /* 边缘木桩 */
    for (let i = 0; i < 4; i++) {
      const x = px + 10 + i * 8;
      g.fillStyle = '#7a5a34';
      g.fillRect(x, py - 6, 3, 8);
    }

    const vg = g.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.4)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 控件 ---------- */
  for (const p of PLANTS) {
    const b = document.createElement('button');
    b.textContent = p.name;
    b.dataset.plant = p.id;
    b.title = `${p.id} · ${KIND_NAMES[p.kind] || p.kind} · ${p.days} 天成熟`;
    b.addEventListener('click', () => {
      state.plant = p.id;
      sync();
      render();
    });
    plantHost.appendChild(b);
  }

  for (let i = 0; i < PLANT_STAGES.length; i++) {
    const b = document.createElement('button');
    b.textContent = `${i} ${PLANT_STAGES[i]}`;
    b.dataset.stage = String(i);
    b.addEventListener('click', () => {
      state.stage = i;
      state.growing = false;
      state.timer = 0;
      sync();
      render();
    });
    stageHost.appendChild(b);
  }

  growBtn.addEventListener('click', () => {
    state.growing = !state.growing;
    sync();
  });
  gridBtn.addEventListener('click', () => {
    state.grid = !state.grid;
    sync();
    render();
  });
  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(6, Math.min(11, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });
  document.getElementById('plant-png').addEventListener('click', exportPng);

  function sync() {
    for (const b of plantHost.children) b.classList.toggle('active', b.dataset.plant === state.plant);
    for (const b of stageHost.children) b.classList.toggle('active', Number(b.dataset.stage) === state.stage);
    growBtn.textContent = state.growing ? '暂停生长' : '播放生长';
    growBtn.classList.toggle('on', state.growing);
    gridBtn.classList.toggle('on', state.grid);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
  }

  function status() {
    const p = PLANT_MAP[state.plant];
    statusEl.innerHTML =
      `<dt>植物</dt><dd>${p.name}${p.hybrid ? '（杂交）' : ''}</dd>` +
      `<dt>类别</dt><dd>${KIND_NAMES[p.kind] || p.kind}</dd>` +
      `<dt>季节</dt><dd>${p.season}</dd>` +
      `<dt>成熟</dt><dd>${p.days} 天</dd>` +
      `<dt>阶段</dt><dd>${state.stage} / 4 · ${PLANT_STAGES[state.stage]}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const z = state.zoom;
    const sw = PLANT_W * z;
    const sh = PLANT_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = H - sh - 56;
    const phase = state.time * 0.6;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    ellipse(ctx, W / 2, sy + 34.5 * z, Math.round(sw * 0.3), Math.round(z * 1.2), 'rgba(40, 26, 14, 0.45)');

    if (state.grid) {
      ctx.strokeStyle = 'rgba(240, 235, 210, 0.18)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      ctx.strokeStyle = 'rgba(233, 201, 111, 0.4)';
      ctx.beginPath();
      const by = Math.round(sy + 34 * z) + 0.5;
      ctx.moveTo(0, by);
      ctx.lineTo(W, by);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(z, z);
    drawPlant(ctx, state.plant, state.stage, phase);
    ctx.restore();

    /* 底部信息条 */
    const p = PLANT_MAP[state.plant];
    ctx.fillStyle = 'rgba(10, 14, 12, 0.72)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.name} · ${PLANT_STAGES[state.stage]}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`stage ${state.stage} / 4   growth ${p.days}d   ${p.season}`, 14, H - 10);

    status();
  }

  function exportPng() {
    const cell = makeCanvas(PLANT_W, PLANT_H);
    drawPlant(cell.ctx, state.plant, state.stage, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = PLANT_W * scale;
    out.height = PLANT_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    const p = PLANT_MAP[state.plant];
    download(out, `plant-${p.id}-stage${state.stage}.png`);
  }

  /* ---------- 画廊 ---------- */
  function buildGallery() {
    const host = document.getElementById('plant-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'pgrid';

    grid.appendChild(document.createElement('div'));
    for (const p of PLANTS) {
      const h = document.createElement('div');
      h.className = 'phead';
      h.textContent = p.name;
      h.title = `${p.id} · ${p.days} 天`;
      grid.appendChild(h);
    }

    for (let st = 0; st < PLANT_STAGES.length; st++) {
      const label = document.createElement('div');
      label.className = 'plabel';
      label.textContent = `${st} ${PLANT_STAGES[st]}`;
      grid.appendChild(label);

      for (const p of PLANTS) {
        const cell = document.createElement('div');
        cell.className = 'pcell';
        const cv = document.createElement('canvas');
        cv.width = PLANT_W;
        cv.height = PLANT_H;
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        drawPlant(g, p.id, st, 0.25 + st * 0.1);
        cell.appendChild(cv);
        grid.appendChild(cell);
      }
    }

    host.appendChild(grid);
  }

  function tick(dt) {
    state.time += dt;
    if (state.growing) {
      state.timer += dt;
      if (state.timer >= 0.9) {
        state.timer -= 0.9;
        state.stage = (state.stage + 1) % PLANT_STAGES.length;
        sync();
      }
    }
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
