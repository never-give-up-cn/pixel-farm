/* 星露谷全作物面板：50 种作物，一帧 = 一天。
 * 左侧选作物 / 季节 / 天数，中间单株放大，底部逐日帧，下方全部作物成熟图鉴。 */

import {
  CROPS, CROP_MAP, CROP_SEASONS, cropMatchesSeason,
  nextSeason, firstSeason, cropSurvivesSeason, drawWithered, MULTI_SEASON_IDS,
  drawCrop, CROP_W, CROP_H
} from './anim/sdv-crops.js';
import { mulberry32, ellipse } from './anim/pixel.js';

const W = 480;
const H = 520;
const BAR = 46;
const DAY_STEP = 0.45;   // 自动生长：每个阶段停留 0.45 秒
const HOLD = 1.2;        // 成熟后停留 1.2 秒再重播

const KIND_NAMES = {
  root: '根菜', leafy: '叶菜', tuber: '块茎', bush: '矮丛',
  vine: '藤蔓', pod: '豆荚', tall: '高秆', gourd: '瓜果',
  flower: '花卉', grain: '禾本', tree: '果树', mushroom: '菌类',
  fiber: '纤维'
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

export function initPlantPanel() {
  const canvas = document.getElementById('plant-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    crop: 'tomato',
    day: 1,
    playing: true,
    timer: 0,
    hold: 0,
    zoom: 10,
    grid: true,
    season: '夏',
    withered: false,
    witherPreview: false,
    filter: '全部',
    time: 0
  };

  const plantHost = document.getElementById('plant-list');
  const seasonHost = document.getElementById('crop-seasons');
  const countEl = document.getElementById('crop-count');
  const statusEl = document.getElementById('plant-status');
  const growBtn = document.getElementById('plant-grow');
  const gridBtn = document.getElementById('plant-grid');
  const zoomInput = document.getElementById('plant-zoom');
  const zoomOut = document.getElementById('plant-zoom-out');
  const dayInput = document.getElementById('crop-day');
  const dayOut = document.getElementById('crop-day-out');
  const daysOut = document.getElementById('crop-days-out');
  const stripHost = document.getElementById('crop-filmstrip');
  const seasonBtn = document.getElementById('plant-next-season');
  const witherBtn = document.getElementById('plant-wither');
  const seasonNote = document.getElementById('plant-season-note');

  /* ---------- 背景 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(424242);

    g.fillStyle = '#22331f';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#283c23';
    g.fillRect(0, 200, W, H - 200);

    for (let i = 0; i < 140; i++) {
      const x = Math.floor(rnd() * W);
      const y = 40 + Math.floor(rnd() * 170);
      g.fillStyle = rnd() > 0.5 ? '#365528' : '#3f6031';
      g.fillRect(x, y, 1, 2 + Math.floor(rnd() * 2));
    }

    const px = 74, py = 250, pw = W - 148, ph = 200;
    g.fillStyle = '#4a3320';
    g.fillRect(px, py, pw, ph);
    g.fillStyle = '#5c4028';
    for (let y = py + 6; y < py + ph; y += 18) {
      g.fillRect(px + 6, y, pw - 12, 7);
      g.fillStyle = '#6b4a2b';
      for (let x = px + 8; x < px + pw - 8; x += 13) g.fillRect(x, y + 1, 2, 2);
      g.fillStyle = '#5c4028';
    }
    g.fillStyle = 'rgba(30, 20, 12, 0.28)';
    g.fillRect(px, py + ph - 8, pw, 8);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#7a5a34';
      g.fillRect(px + 10 + i * 8, py - 6, 3, 8);
    }

    const vg = g.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.4)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    return c;
  })();

  /* ---------- 作物列表 / 季节筛选 ---------- */
  for (const s of CROP_SEASONS) {
    const b = document.createElement('button');
    b.textContent = s;
    b.dataset.season = s;
    b.addEventListener('click', () => {
      state.filter = s;
      applyFilter();
      sync();
    });
    seasonHost.appendChild(b);
  }

  for (const c of CROPS) {
    const b = document.createElement('button');
    b.textContent = c.name;
    b.dataset.crop = c.id;
    b.title = `${c.en} · ${c.season} · ${c.days} 天成熟${c.regrow ? ` · 每 ${c.regrow} 天再收` : ''}`;
    b.addEventListener('click', () => selectCrop(c.id, true));
    plantHost.appendChild(b);
  }

  function applyFilter() {
    let n = 0;
    for (const b of plantHost.children) {
      const c = CROP_MAP[b.dataset.crop];
      const show = cropMatchesSeason(c, state.filter);
      b.style.display = show ? '' : 'none';
      if (show) n++;
    }
    countEl.textContent = `（${n}）`;
    for (const b of seasonHost.children) {
      b.classList.toggle('active', b.dataset.season === state.filter);
    }
  }

  /* ---------- 逐日帧 ---------- */
  function buildFilmstrip() {
    const c = CROP_MAP[state.crop];
    stripHost.innerHTML = '';
    for (let d = 1; d <= c.days; d++) {
      const cell = document.createElement('div');
      cell.className = 'fstrip';
      cell.dataset.day = String(d);
      cell.title = `${c.name} · 第 ${d} 天`;
      const cv = document.createElement('canvas');
      cv.width = CROP_W;
      cv.height = CROP_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawCrop(g, c, d, 0.25);
      const label = document.createElement('span');
      label.textContent = String(d);
      cell.appendChild(cv);
      cell.appendChild(label);
      cell.addEventListener('click', () => setDay(d, false));
      stripHost.appendChild(cell);
    }

    /* 通用枯萎帧：所有作物共用，放在逐日帧末尾 */
    const dead = document.createElement('div');
    dead.className = 'fstrip dead';
    dead.dataset.day = 'dead';
    dead.title = '通用枯萎帧（换季时使用）';
    const dcv = document.createElement('canvas');
    dcv.width = CROP_W;
    dcv.height = CROP_H;
    const dg = dcv.getContext('2d');
    dg.imageSmoothingEnabled = false;
    drawWithered(dg);
    const dlabel = document.createElement('span');
    dlabel.textContent = '枯';
    dead.appendChild(dcv);
    dead.appendChild(dlabel);
    dead.addEventListener('click', () => {
      state.witherPreview = true;
      state.playing = false;
      sync();
      render();
    });
    stripHost.appendChild(dead);

    markStrip();
  }

  function markStrip() {
    for (const cell of stripHost.children) {
      const isDead = cell.dataset.day === 'dead';
      const active = isDead
        ? (state.withered || state.witherPreview)
        : (!state.withered && !state.witherPreview && Number(cell.dataset.day) === state.day);
      cell.classList.toggle('active', active);
    }
  }

  /* ---------- 状态同步 ---------- */
  function sync() {
    const c = CROP_MAP[state.crop];
    for (const b of plantHost.children) b.classList.toggle('active', b.dataset.crop === state.crop);
    dayInput.max = String(c.days);
    dayInput.value = String(state.day);
    dayOut.textContent = String(state.day);
    daysOut.textContent = String(c.days);
    growBtn.textContent = state.playing ? '暂停生长' : '播放生长';
    growBtn.classList.toggle('on', state.playing);
    gridBtn.classList.toggle('on', state.grid);
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
    witherBtn.classList.toggle('on', state.witherPreview);

    const next = nextSeason(state.season);
    const willLive = cropSurvivesSeason(c, next);
    const multi = MULTI_SEASON_IDS.includes(c.id);
    if (state.withered) {
      seasonNote.textContent = `换季失败：${state.season} 季不在 ${c.name} 的生长季（${c.season}）内，显示通用枯萎帧。`;
    } else if (state.witherPreview) {
      seasonNote.textContent = '通用枯萎帧预览：所有作物共用这一帧；换季时新季节不在生长季内就会变成它。';
    } else if (c.indoorOnly) {
      seasonNote.textContent = '仙人掌果只能种在温室 / 姜岛 / 室内花盆，不参与农场换季。';
    } else if (multi && cropSurvivesSeason(c, state.season)) {
      seasonNote.textContent = `多季作物，在 ${state.season} 季存活；下一季 ${next} ${willLive ? '继续存活' : '会枯萎'}。`;
    } else {
      seasonNote.textContent = `下一季 ${next}：${willLive ? '存活' : '会枯萎'} · 生长季：${c.season}`;
    }

    markStrip();
  }

  function status() {
    const c = CROP_MAP[state.crop];
    const next = nextSeason(state.season);
    const willLive = cropSurvivesSeason(c, next);
    const seasonState = state.withered ? '已枯萎'
      : state.witherPreview ? '枯萎帧预览'
      : `${next} 季${willLive ? '存活' : '枯萎'}`;
    statusEl.innerHTML =
      `<dt>作物</dt><dd>${c.name} (${c.en})</dd>` +
      `<dt>生长季</dt><dd>${c.season}</dd>` +
      `<dt>成熟</dt><dd>${c.days} 天</dd>` +
      `<dt>再收</dt><dd>${c.regrow ? `每 ${c.regrow} 天` : '—'}</dd>` +
      `<dt>当前</dt><dd>第 ${state.day} / ${c.days} 天 · ${state.season} 季</dd>` +
      `<dt>换季</dt><dd>${seasonState}</dd>` +
      `<dt>形态</dt><dd>${KIND_NAMES[c.kind] || c.kind}</dd>`;
  }

  /* ---------- 交互 ---------- */
  function selectCrop(id, autoplay) {
    if (!CROP_MAP[id]) return;
    const c = CROP_MAP[id];
    state.crop = id;
    state.day = 1;
    state.timer = 0;
    state.hold = 0;
    state.season = firstSeason(c);
    state.withered = false;
    state.witherPreview = false;
    state.playing = !!autoplay;
    buildFilmstrip();
    sync();
    const activeBtn = plantHost.querySelector('button.active');
    if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest' });
    render();
  }

  function setDay(d, play) {
    const c = CROP_MAP[state.crop];
    state.day = Math.max(1, Math.min(c.days, d | 0));
    state.playing = !!play;
    state.timer = 0;
    state.hold = 0;
    state.withered = false;
    state.witherPreview = false;
    if (!cropSurvivesSeason(c, state.season)) state.season = firstSeason(c);
    sync();
    render();
  }

  growBtn.addEventListener('click', () => {
    const c = CROP_MAP[state.crop];
    if (state.withered || state.witherPreview) {
      state.withered = false;
      state.witherPreview = false;
      state.season = firstSeason(c);
      state.day = 1;
      state.timer = 0;
      state.hold = 0;
    } else if (!state.playing && state.day >= c.days) {
      state.day = 1;
      state.timer = 0;
      state.hold = 0;
    }
    state.playing = !state.playing;
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

  dayInput.addEventListener('input', () => {
    const c = CROP_MAP[state.crop];
    state.day = Number(dayInput.value) | 0;
    state.playing = false;
    state.timer = 0;
    state.hold = 0;
    state.withered = false;
    state.witherPreview = false;
    if (!cropSurvivesSeason(c, state.season)) state.season = firstSeason(c);
    sync();
    render();
  });

  seasonBtn.addEventListener('click', () => {
    const c = CROP_MAP[state.crop];
    const next = nextSeason(state.season);
    state.season = next;
    if (!state.withered) state.withered = !cropSurvivesSeason(c, next);
    state.witherPreview = false;
    state.playing = false;
    state.timer = 0;
    state.hold = 0;
    sync();
    render();
  });

  witherBtn.addEventListener('click', () => {
    state.witherPreview = !state.witherPreview;
    state.playing = false;
    sync();
    render();
  });

  document.getElementById('plant-png').addEventListener('click', exportPng);

  /* ---------- 主画面 ---------- */
  function render() {
    const c = CROP_MAP[state.crop];
    const z = state.zoom;
    const sw = CROP_W * z;
    const sh = CROP_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = H - sh - 56;
    const phase = state.time * 0.6;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);
    ellipse(ctx, W / 2, sy + 34.5 * z, Math.round(sw * 0.3), Math.round(z * 1.2), 'rgba(40, 26, 14, 0.4)');

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
    if (state.withered || state.witherPreview) drawWithered(ctx);
    else drawCrop(ctx, c, state.day, phase);
    ctx.restore();

    ctx.fillStyle = 'rgba(10, 14, 12, 0.72)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    const deadTag = state.withered ? ' · 已枯萎' : state.witherPreview ? ' · 枯萎帧' : '';
    ctx.fillText(`${c.name} · 第 ${state.day} / ${c.days} 天 · ${state.season} 季${deadTag}`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`${c.en}   ${c.season}   ${c.days}d${c.regrow ? ` +${c.regrow}d regrow` : ''}`, 14, H - 10);

    status();
  }

  function exportPng() {
    const c = CROP_MAP[state.crop];
    const cell = makeCanvas(CROP_W, CROP_H);
    if (state.withered || state.witherPreview) drawWithered(cell.ctx);
    else drawCrop(cell.ctx, c, state.day, 0.5);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = CROP_W * scale;
    out.height = CROP_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    const tag = (state.withered || state.witherPreview) ? 'withered' : `day${state.day}`;
    download(out, `sdv-${c.id}-${tag}.png`);
  }

  /* ---------- 全部作物成熟图鉴 ---------- */
  function buildGallery() {
    const host = document.getElementById('plant-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'cgrid';

    for (const c of CROPS) {
      const cell = document.createElement('div');
      cell.className = 'ccell';
      cell.title = `${c.en} · ${c.season} · ${c.days} 天成熟`;
      const cv = document.createElement('canvas');
      cv.width = CROP_W;
      cv.height = CROP_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawCrop(g, c, c.days, 0.25);
      const name = document.createElement('b');
      name.textContent = c.name;
      const days = document.createElement('span');
      days.textContent = `${c.days} 天`;
      cell.appendChild(cv);
      cell.appendChild(name);
      cell.appendChild(days);
      cell.addEventListener('click', () => {
        selectCrop(c.id, true);
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      grid.appendChild(cell);
    }

    host.appendChild(grid);
  }

  function tick(dt) {
    state.time += dt;
    const c = CROP_MAP[state.crop];

    if (state.playing) {
      if (state.day < c.days) {
        const step = Math.max(0.18, Math.min(DAY_STEP, 4.5 / c.days));
        state.timer += dt;
        if (state.timer >= step) {
          state.timer -= step;
          state.day++;
          sync();
        }
      } else {
        state.hold += dt;
        if (state.hold >= HOLD) {
          state.hold = 0;
          state.timer = 0;
          state.day = 1;
          sync();
        }
      }
    }
    render();
  }

  applyFilter();
  buildFilmstrip();
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
