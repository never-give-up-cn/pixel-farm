/* NPC 图鉴面板：34 位村民的头像与四方向行走动画。 */

import {
  NPCS, NPC_MAP, NPC_DIRS, drawNpcWalk, drawNpcPortrait,
  NPC_W, NPC_H, PORTRAIT_W, PORTRAIT_H
} from './anim/npcs.js';
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

export function initNpcPanel() {
  const canvas = document.getElementById('npc-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    npc: 'abigail',
    filter: 'all',
    playing: true,
    time: 0
  };

  const listHost = document.getElementById('npc-list');
  const filterHost = document.getElementById('npc-filters');
  const statusEl = document.getElementById('npc-status');
  const noteEl = document.getElementById('npc-note');
  const countEl = document.getElementById('npc-count');
  const playBtn = document.getElementById('npc-play');

  /* ---------- 背景：小镇傍晚 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(3434);

    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2a3a52');
    grad.addColorStop(0.5, '#243244');
    grad.addColorStop(1, '#182028');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    /* 远处房屋剪影 */
    for (let i = 0; i < 7; i++) {
      const x = i * 74 - 10;
      const h = 50 + (i % 3) * 16;
      g.fillStyle = i % 2 ? '#1e2a38' : '#22303e';
      g.fillRect(x, 230 - h, 64, h + 80);
      g.fillStyle = '#2a3a4a';
      for (let j = 0; j < 3; j++) g.fillRect(x + 10 + j * 18, 230 - h + 16, 6, 8);
    }

    /* 石板地 */
    g.fillStyle = '#2a3038';
    g.fillRect(0, 300, W, H - 300);
    for (let y = 310; y < H; y += 22) {
      for (let x = (y % 44 ? 10 : 30); x < W; x += 40) {
        g.fillStyle = (x + y) % 3 ? '#343b44' : '#2f363e';
        g.fillRect(x, y, 32, 17);
        g.fillStyle = '#3c444e';
        g.fillRect(x, y, 32, 2);
      }
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 2 ? '#4a5a3a' : '#3a4a2a';
      g.fillRect(Math.floor(rnd() * W), 306 + Math.floor(rnd() * 20), 2, 3);
    }

    const vg = g.createRadialGradient(W / 2, 220, 80, W / 2, 220, 360);
    vg.addColorStop(0, 'rgba(240, 220, 160, 0.14)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  const filters = [
    { id: 'all', name: '全部' },
    { id: 'marry', name: '可结婚' },
    { id: 'villager', name: '村民' }
  ];
  for (const f of filters) {
    const b = document.createElement('button');
    b.textContent = f.name;
    b.dataset.filter = f.id;
    b.addEventListener('click', () => {
      state.filter = f.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const n of NPCS) {
    const b = document.createElement('button');
    b.textContent = n.name;
    b.dataset.npc = n.id;
    b.title = `${n.en} · ${n.marry ? '可结婚' : '村民'} · ${n.birthday}`;
    b.addEventListener('click', () => selectNpc(n.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let count = 0;
    for (const b of listHost.children) {
      const n = NPC_MAP[b.dataset.npc];
      const show = state.filter === 'all' ||
        (state.filter === 'marry' && n.marry) ||
        (state.filter === 'villager' && !n.marry);
      b.style.display = show ? '' : 'none';
      if (show) count++;
    }
    countEl.textContent = `（${count}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectNpc(id) {
    if (!NPC_MAP[id]) return;
    state.npc = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const n = NPC_MAP[state.npc];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.npc === state.npc);
    playBtn.textContent = state.playing ? '暂停行走' : '播放行走';
    noteEl.textContent = `${n.marry ? '可结婚' : '村民'} · 生日 ${n.birthday} · ${n.job} · 喜欢 ${n.loved}`;
    statusEl.innerHTML =
      `<dt>村民</dt><dd>${n.name} (${n.en})</dd>` +
      `<dt>类型</dt><dd>${n.marry ? '可结婚' : '村民'}</dd>` +
      `<dt>生日</dt><dd>${n.birthday}</dd>` +
      `<dt>职业</dt><dd>${n.job}</dd>` +
      `<dt>喜欢</dt><dd>${n.loved}</dd>` +
      `<dt>编号</dt><dd>${NPCS.indexOf(n) + 1} / ${NPCS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const n = NPC_MAP[state.npc];
    const frame = state.playing ? Math.floor(state.time * 6) % 4 : 0;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 头像框 */
    const px = 112, py = 20, ps = 256;
    ctx.fillStyle = '#101820';
    ctx.fillRect(px - 6, py - 6, ps + 12, ps + 12);
    ctx.strokeStyle = '#e9c96f';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 5, py - 5, ps + 10, ps + 10);
    ctx.fillStyle = '#1d2a33';
    ctx.fillRect(px, py, ps, ps);

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(4, 4);
    drawNpcPortrait(ctx, n);
    ctx.restore();

    /* 名字 */
    ctx.fillStyle = '#f4e6c6';
    ctx.font = '16px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.name, W / 2, 296);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${n.en}   ${n.birthday}   ${n.job}`, W / 2, 313);
    ctx.textAlign = 'left';

    /* 四方向行走 */
    const dirs = [0, 1, 2, 3];
    const startX = 60;
    const gap = 108;
    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      const dx = startX + i * gap;
      ctx.fillStyle = 'rgba(10, 16, 20, 0.55)';
      ctx.fillRect(dx, 338, 72, 96);
      ctx.save();
      ctx.translate(dx, 338);
      ctx.scale(3, 3);
      drawNpcWalk(ctx, n, dir, frame);
      ctx.restore();
      ctx.fillStyle = '#8b9aab';
      ctx.font = '11px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(NPC_DIRS[i].name, dx + 36, 448);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = 'rgba(10, 14, 18, 0.8)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${n.name} · ${n.marry ? '可结婚' : '村民'} · ${n.job}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${n.en}   birthday ${n.birthday}   npc ${NPCS.indexOf(n) + 1}/${NPCS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const n = NPC_MAP[state.npc];
    const cell = makeCanvas(PORTRAIT_W, PORTRAIT_H);
    drawNpcPortrait(cell.ctx, n);
    const scale = 4;
    const out = document.createElement('canvas');
    out.width = PORTRAIT_W * scale;
    out.height = PORTRAIT_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-npc-${n.id}-portrait.png`);
  }

  playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    sync();
    render();
  });
  document.getElementById('npc-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('npc-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'npcgrid';

    for (const n of NPCS) {
      const cell = document.createElement('div');
      cell.className = 'npccell';
      cell.title = `${n.en} · ${n.birthday} · ${n.job}`;
      const cv = document.createElement('canvas');
      cv.width = PORTRAIT_W;
      cv.height = PORTRAIT_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawNpcPortrait(g, n);
      const name = document.createElement('b');
      name.textContent = n.name;
      const meta = document.createElement('span');
      meta.textContent = n.marry ? '可结婚' : '村民';
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(meta);
      cell.addEventListener('click', () => {
        state.npc = n.id;
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
