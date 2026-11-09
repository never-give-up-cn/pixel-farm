/* 特殊 NPC 图鉴：博物馆、冒险家公会、Joja、姜岛与神秘访客。 */

import {
  SPECIAL_NPCS, SPECIAL_MAP, SPECIAL_GROUPS, specialGroupName,
  drawSpecialPortrait, drawSpecialWalk,
  NPC_W, NPC_H, PORTRAIT_W, PORTRAIT_H
} from './anim/special-npcs.js';
import { NPC_DIRS } from './anim/npcs.js';
import { mulberry32 } from './anim/pixel.js';

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

export function initSpecialNpcPanel() {
  const canvas = document.getElementById('special-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    npc: 'gunther',
    filter: 'all',
    playing: true,
    time: 0
  };

  const listHost = document.getElementById('special-list');
  const filterHost = document.getElementById('special-filters');
  const statusEl = document.getElementById('special-status');
  const noteEl = document.getElementById('special-note');
  const countEl = document.getElementById('special-count');
  const playBtn = document.getElementById('special-play');

  /* ---------- 背景：特殊访客大厅 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(7878);

    g.fillStyle = '#181a20';
    g.fillRect(0, 0, W, H);

    /* 石墙 */
    for (let y = 0; y < 300; y += 24) {
      for (let x = (y % 48 ? 24 : 0) - 24; x < W; x += 48) {
        g.fillStyle = (x + y) % 3 ? '#24262e' : '#2a2c34';
        g.fillRect(x, y, 46, 22);
        g.fillStyle = '#14161b';
        g.fillRect(x, y + 22, 46, 2);
        g.fillRect(x + 46, y, 2, 22);
      }
    }

    /* 木梁与拱门 */
    g.fillStyle = '#3a2a1a';
    g.fillRect(0, 0, W, 14);
    g.fillRect(0, 292, W, 8);
    g.fillRect(30, 14, 10, 278);
    g.fillRect(440, 14, 10, 278);
    g.fillStyle = '#4a3624';
    g.fillRect(30, 14, 420, 8);

    /* 旗帜 */
    const banner = (x, col, mark) => {
      g.fillStyle = col;
      g.fillRect(x, 30, 42, 94);
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.fillRect(x, 30, 42, 6);
      for (let i = 0; i < 5; i++) {
        g.fillStyle = i % 2 ? col : '#14161b';
        g.fillRect(x + i * 8.4, 124, 8, 7 + (i % 3) * 3);
      }
      g.fillStyle = mark;
      g.fillRect(x + 18, 58, 6, 18);
      g.fillRect(x + 13, 63, 16, 6);
    };
    banner(44, '#3a5a4a', '#d8c060');
    banner(394, '#3a4a6a', '#d8c060');

    /* 火把 */
    for (const x of [84, 396]) {
      g.fillStyle = '#5a3a22';
      g.fillRect(x, 192, 5, 46);
      g.fillStyle = '#e07a2a';
      g.fillRect(x - 4, 182, 13, 12);
      g.fillStyle = '#f0c050';
      g.fillRect(x - 1, 176, 7, 11);
      g.fillStyle = '#fff0a0';
      g.fillRect(x + 1, 178, 2, 5);
    }

    /* 地面与红毯 */
    g.fillStyle = '#2a2622';
    g.fillRect(0, 300, W, H - 300);
    for (let y = 310; y < H; y += 24) {
      g.fillStyle = '#332e28';
      g.fillRect(0, y, W, 2);
    }
    g.fillStyle = '#5a2a32';
    g.fillRect(108, 300, 264, H - 300);
    g.fillStyle = '#7a3a42';
    g.fillRect(118, 300, 244, H - 300);
    g.fillStyle = '#c8a050';
    g.fillRect(108, 300, 8, H - 300);
    g.fillRect(364, 300, 8, H - 300);
    for (let y = 340; y < H; y += 40) {
      g.fillStyle = 'rgba(255,220,140,0.10)';
      g.fillRect(120, y, 240, 2);
    }

    /* 桌子 */
    g.fillStyle = '#4a3020';
    g.fillRect(154, 470, 172, 10);
    g.fillStyle = '#6a4a2a';
    g.fillRect(160, 462, 160, 10);

    const vg = g.createRadialGradient(W / 2, 200, 100, W / 2, 200, 360);
    vg.addColorStop(0, 'rgba(240, 210, 150, 0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    for (let i = 0; i < 45; i++) {
      g.fillStyle = i % 2 ? '#3a3f46' : '#14161b';
      g.fillRect(Math.floor(rnd() * W), 306 + Math.floor(rnd() * 180), 3, 2);
    }

    return c;
  })();

  /* ---------- 筛选 / 列表 ---------- */
  for (const group of SPECIAL_GROUPS) {
    const b = document.createElement('button');
    b.textContent = group.name;
    b.dataset.filter = group.id;
    b.addEventListener('click', () => {
      state.filter = group.id;
      applyFilter();
      sync();
    });
    filterHost.appendChild(b);
  }

  for (const n of SPECIAL_NPCS) {
    const b = document.createElement('button');
    b.textContent = n.name;
    b.dataset.npc = n.id;
    b.title = `${n.en} · ${specialGroupName(n.group)} · ${n.job}`;
    b.addEventListener('click', () => selectNpc(n.id));
    listHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of listHost.children) {
      const it = SPECIAL_MAP[b.dataset.npc];
      const show = state.filter === 'all' || it.group === state.filter;
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of filterHost.children) {
      b.classList.toggle('active', b.dataset.filter === state.filter);
    }
  }

  function selectNpc(id) {
    if (!SPECIAL_MAP[id]) return;
    state.npc = id;
    sync();
    const b = listHost.querySelector('button.active');
    if (b) b.scrollIntoView({ block: 'nearest' });
    render();
  }

  function sync() {
    const n = SPECIAL_MAP[state.npc];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.npc === state.npc);
    playBtn.textContent = state.playing ? '暂停行走' : '播放行走';
    noteEl.textContent = `${specialGroupName(n.group)} · ${n.job}`;
    statusEl.innerHTML =
      `<dt>NPC</dt><dd>${n.name} (${n.en})</dd>` +
      `<dt>分组</dt><dd>${specialGroupName(n.group)}</dd>` +
      `<dt>职业</dt><dd>${n.job}</dd>` +
      `<dt>编号</dt><dd>${SPECIAL_NPCS.indexOf(n) + 1} / ${SPECIAL_NPCS.length}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const n = SPECIAL_MAP[state.npc];
    const frame = state.playing ? Math.floor(state.time * 6) % 4 : 0;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 头像框 */
    const px = 112, py = 20, ps = 256;
    ctx.fillStyle = '#10161c';
    ctx.fillRect(px - 6, py - 6, ps + 12, ps + 12);
    ctx.strokeStyle = '#e9c96f';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 5, py - 5, ps + 10, ps + 10);
    ctx.fillStyle = '#1d2a33';
    ctx.fillRect(px, py, ps, ps);
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(4, 4);
    drawSpecialPortrait(ctx, n);
    ctx.restore();

    ctx.fillStyle = '#f4e6c6';
    ctx.font = '16px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.name, W / 2, 296);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${n.en}   ${specialGroupName(n.group)}   ${n.job}`, W / 2, 313);
    ctx.textAlign = 'left';

    /* 四方向行走 */
    const startX = 60, gap = 108;
    for (let i = 0; i < 4; i++) {
      const dx = startX + i * gap;
      ctx.fillStyle = 'rgba(10, 14, 18, 0.55)';
      ctx.fillRect(dx, 338, 72, 96);
      ctx.save();
      ctx.translate(dx, 338);
      ctx.scale(3, 3);
      drawSpecialWalk(ctx, n, i, frame);
      ctx.restore();
      ctx.fillStyle = '#8b9aab';
      ctx.font = '11px "Microsoft YaHei", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(NPC_DIRS[i].name, dx + 36, 448);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = 'rgba(10, 14, 18, 0.82)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${n.name} · ${specialGroupName(n.group)} · ${n.job}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${n.en}   special npc ${SPECIAL_NPCS.indexOf(n) + 1}/${SPECIAL_NPCS.length}`, 14, H - 10);

    sync();
  }

  function exportPng() {
    const n = SPECIAL_MAP[state.npc];
    const cell = makeCanvas(PORTRAIT_W, PORTRAIT_H);
    drawSpecialPortrait(cell.ctx, n);
    const scale = 4;
    const out = document.createElement('canvas');
    out.width = PORTRAIT_W * scale;
    out.height = PORTRAIT_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `sdv-special-${n.id}-portrait.png`);
  }

  playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    sync();
    render();
  });
  document.getElementById('special-png').addEventListener('click', exportPng);

  /* ---------- 图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('special-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'sngrid';

    for (const n of SPECIAL_NPCS) {
      const cell = document.createElement('div');
      cell.className = 'sncell';
      cell.title = `${n.en} · ${specialGroupName(n.group)} · ${n.job}`;
      const cv = document.createElement('canvas');
      cv.width = PORTRAIT_W;
      cv.height = PORTRAIT_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawSpecialPortrait(g, n);
      const name = document.createElement('b');
      name.textContent = n.name;
      const meta = document.createElement('span');
      meta.textContent = specialGroupName(n.group);
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
