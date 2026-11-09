/* 动画测试 Demo：动作 / 朝向切换、逐帧控制、速度与缩放、网格、PNG 导出、全动作画廊。
 * 只依赖 js/anim/ 内的动画模块，不改动游戏主循环。 */

import {
  ACTIONS, ACTION_MAP, DIRECTIONS, Animator, getFrame, preloadAll,
  CELL_W, CELL_H, DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP
} from './anim/animator.js';
import { mulberry32, ellipse } from './anim/pixel.js';
import { initPlantPanel } from './anim-demo-plants.js';
import { initAnimalPanel } from './anim-demo-animals.js';
import { initTreePanel } from './anim-demo-trees.js';
import { initMineralPanel } from './anim-demo-minerals.js';
import { initFishPanel } from './anim-demo-fish.js';
import { initBuildingPanel } from './anim-demo-buildings.js';
import { initArtisanPanel } from './anim-demo-artisan.js';
import { initDishPanel } from './anim-demo-dishes.js';
import { initNpcPanel } from './anim-demo-npcs.js';
import { initMonsterPanel } from './anim-demo-monsters.js';
import { initEquipmentPanel } from './anim-demo-equipment.js';

const STAGE_W = 480;
const STAGE_H = 520;
const EXPORT_SCALE = 8;

const stage = document.getElementById('stage');
const ctx = stage.getContext('2d');
ctx.imageSmoothingEnabled = false;

const state = {
  zoom: 9,
  grid: true,
  bg: true,
  speed: 1,
  tab: 'farmer'
};

const animator = new Animator({ action: 'idle', dir: DIR_DOWN, playing: true });

/* ---------- 静态背景缓存 ---------- */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

const checker = (() => {
  const { canvas, ctx: g } = makeCanvas(STAGE_W, STAGE_H);
  const size = 20;
  for (let y = 0; y < STAGE_H; y += size) {
    for (let x = 0; x < STAGE_W; x += size) {
      g.fillStyle = ((x / size + y / size) | 0) % 2 ? '#151d17' : '#111713';
      g.fillRect(x, y, size, size);
    }
  }
  return canvas;
})();

const field = (() => {
  const { canvas, ctx: g } = makeCanvas(STAGE_W, STAGE_H);
  const rnd = mulberry32(20261109);

  /* 三层草地色带 */
  const bands = [
    { y: 0, h: 180, c: '#22331f' },
    { y: 180, h: 180, c: '#283c23' },
    { y: 360, h: 160, c: '#2f4527' }
  ];
  for (const b of bands) {
    g.fillStyle = b.c;
    g.fillRect(0, b.y, STAGE_W, b.h);
  }

  /* 远处树影 */
  g.fillStyle = 'rgba(16, 28, 16, 0.55)';
  for (let i = 0; i < 9; i++) {
    const x = 10 + i * 56 + rnd() * 18;
    const h = 40 + rnd() * 40;
    g.fillRect(Math.round(x), 150 - h, 26, h);
    g.fillRect(Math.round(x - 5), 150 - h + 8, 36, 10);
  }

  /* 草叶 */
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rnd() * STAGE_W);
    const y = 170 + Math.floor(rnd() * (STAGE_H - 180));
    const h = 2 + Math.floor(rnd() * 3);
    g.fillStyle = rnd() > 0.6 ? '#3f6031' : '#365528';
    g.fillRect(x, y, 1, h);
    if (rnd() > 0.7) g.fillRect(x + 2, y + 1, 1, h - 1);
  }

  /* 碎石子 */
  for (let i = 0; i < 36; i++) {
    const x = Math.floor(rnd() * STAGE_W);
    const y = 190 + Math.floor(rnd() * (STAGE_H - 210));
    g.fillStyle = rnd() > 0.5 ? '#5a6152' : '#474f42';
    g.fillRect(x, y, 2 + Math.floor(rnd() * 2), 1 + Math.floor(rnd() * 2));
  }

  /* 小花 */
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rnd() * STAGE_W);
    const y = 200 + Math.floor(rnd() * (STAGE_H - 230));
    const c = ['#f2d06b', '#e88aa0', '#e8f0f4'][Math.floor(rnd() * 3)];
    g.fillStyle = c;
    g.fillRect(x, y, 1, 1);
    g.fillRect(x + 2, y, 1, 1);
    g.fillRect(x + 1, y - 1, 1, 1);
    g.fillStyle = '#6a8a4a';
    g.fillRect(x + 1, y + 1, 1, 2);
  }

  /* 暗角 */
  const vg = g.createRadialGradient(STAGE_W / 2, STAGE_H * 0.45, STAGE_H * 0.25,
                                    STAGE_W / 2, STAGE_H * 0.45, STAGE_H * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  g.fillStyle = vg;
  g.fillRect(0, 0, STAGE_W, STAGE_H);

  return canvas;
})();

/* ---------- 舞台绘制 ---------- */

function spriteBox() {
  const s = state.zoom;
  const sw = CELL_W * s;
  const sh = CELL_H * s;
  return {
    s, sw, sh,
    x: Math.round((STAGE_W - sw) / 2),
    y: Math.round(STAGE_H - sh - 66)
  };
}

function drawGrid(box) {
  const { s, sw, sh, x, y } = box;
  ctx.save();
  ctx.strokeStyle = 'rgba(240, 235, 210, 0.20)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  /* 精灵格外框 */
  ctx.strokeRect(x + 0.5, y + 0.5, sw - 1, sh - 1);

  /* 脚底线 */
  const footY = Math.round(y + 35 * s) + 0.5;
  ctx.strokeStyle = 'rgba(233, 201, 111, 0.45)';
  ctx.beginPath();
  ctx.moveTo(0, footY);
  ctx.lineTo(STAGE_W, footY);
  ctx.stroke();

  /* 中轴与中线 */
  ctx.strokeStyle = 'rgba(240, 235, 210, 0.14)';
  const cx = Math.round(x + sw / 2) + 0.5;
  const cy = Math.round(y + sh / 2) + 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx, y + sh);
  ctx.moveTo(x, cy);
  ctx.lineTo(x + sw, cy);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

let lastStatusKey = '';

function updateStatus(box) {
  const dir = DIRECTIONS.find(d => d.id === animator.dir);
  const key = `${animator.action}|${animator.dir}|${animator.frame}|${state.speed}|${animator.playing}`;
  if (key === lastStatusKey) return;
  lastStatusKey = key;

  const meta = animator.meta;
  document.getElementById('status').innerHTML =
    `<dt>动作</dt><dd>${meta.name} (${meta.id})</dd>` +
    `<dt>朝向</dt><dd>${dir ? dir.name : '-'}</dd>` +
    `<dt>帧</dt><dd>${Math.round(animator.frame) + 1} / ${meta.frames}</dd>` +
    `<dt>FPS</dt><dd>${(meta.fps * state.speed).toFixed(1)}</dd>` +
    `<dt>循环</dt><dd>${meta.loop ? '是' : '否'}</dd>` +
    `<dt>状态</dt><dd>${animator.finished ? '已结束' : (animator.playing ? '播放中' : '已暂停')}</dd>`;
}

function render() {
  const box = spriteBox();

  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(state.bg ? field : checker, 0, 0);

  /* 脚下土地 */
  const footY = box.y + 37 * box.s;
  ellipse(ctx, box.x + box.sw / 2, footY, Math.round(box.sw * 0.34), Math.max(2, Math.round(box.s * 1.4)),
          'rgba(60, 44, 26, 0.55)');
  ellipse(ctx, box.x + box.sw / 2, footY, Math.round(box.sw * 0.26), Math.max(1, Math.round(box.s * 0.8)),
          'rgba(88, 64, 36, 0.55)');

  if (state.grid) drawGrid(box);

  animator.draw(ctx, box.x, box.y, box.s);

  /* 底部信息条 */
  const dir = DIRECTIONS.find(d => d.id === animator.dir);
  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 12, 0.72)';
  ctx.fillRect(0, STAGE_H - 46, STAGE_W, 46);
  ctx.fillStyle = '#e9c96f';
  ctx.font = '13px "Microsoft YaHei", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${animator.meta.name} · ${dir ? dir.name : '-'} · 第 ${Math.round(animator.frame) + 1} 帧`, 14, STAGE_H - 27);
  ctx.fillStyle = '#8b9aab';
  ctx.font = '11px monospace';
  ctx.fillText(`frame ${Math.round(animator.frame)} / ${animator.meta.frames - 1}   phase ${animator.phase.toFixed(2)}`, 14, STAGE_H - 10);
  ctx.restore();

  updateStatus(box);
}

/* ---------- 画廊 ---------- */

const galleryItems = [];

function buildGallery() {
  const host = document.getElementById('gallery');
  host.innerHTML = '';

  for (const dir of DIRECTIONS) {
    const row = document.createElement('div');
    row.className = 'grow';

    const label = document.createElement('div');
    label.className = 'dlabel';
    label.textContent = dir.name;
    row.appendChild(label);

    for (const meta of ACTIONS) {
      const cell = document.createElement('div');
      cell.className = 'gcell';

      const cv = document.createElement('canvas');
      cv.width = CELL_W;
      cv.height = CELL_H;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;

      const cap = document.createElement('span');
      cap.textContent = meta.name;

      cell.appendChild(cv);
      cell.appendChild(cap);
      row.appendChild(cell);

      const anim = new Animator({ action: meta.id, dir: dir.id, playing: true });
      galleryItems.push({ anim, ctx: g, wait: 0 });
    }

    host.appendChild(row);
  }
}

function updateGallery(dt) {
  for (const item of galleryItems) {
    const { anim } = item;
    if (anim.finished) {
      item.wait += dt;
      if (item.wait >= 0.8) {
        item.wait = 0;
        anim.replay();
      }
    } else {
      anim.update(dt);
    }
    anim.draw(item.ctx, 0, 0, 1);
  }
}

/* ---------- 交互 ---------- */

const actionHost = document.getElementById('actions');
const dirHost = document.getElementById('dirs');
const playBtn = document.getElementById('btn-play');
const speedInput = document.getElementById('speed');
const speedOut = document.getElementById('speed-out');
const zoomInput = document.getElementById('zoom');
const zoomOut = document.getElementById('zoom-out');
const gridBtn = document.getElementById('btn-grid');
const bgBtn = document.getElementById('btn-bg');

for (const meta of ACTIONS) {
  const b = document.createElement('button');
  b.textContent = meta.name;
  b.dataset.action = meta.id;
  b.title = `${meta.id} · ${meta.frames} 帧 · ${meta.fps} FPS · ${meta.loop ? '循环' : '单次'}`;
  b.addEventListener('click', () => selectAction(meta.id, true));
  actionHost.appendChild(b);
}

for (const dir of DIRECTIONS) {
  const b = document.createElement('button');
  b.textContent = dir.name;
  b.dataset.dir = dir.id;
  b.addEventListener('click', () => selectDir(dir.id));
  dirHost.appendChild(b);
}

function syncButtons() {
  for (const b of actionHost.children) b.classList.toggle('active', b.dataset.action === animator.action);
  for (const b of dirHost.children) b.classList.toggle('active', Number(b.dataset.dir) === animator.dir);
  playBtn.textContent = animator.playing ? '暂停' : '播放';
  gridBtn.classList.toggle('on', state.grid);
  bgBtn.classList.toggle('on', state.bg);
}

function selectAction(action, restart) {
  const wasPlaying = animator.playing;
  if (restart || action !== animator.action) {
    if (wasPlaying) {
      animator.setAction(action);
      animator.replay();
    } else {
      animator.setAction(action);
      animator.frame = 0;
      animator.time = 0;
      animator.finished = false;
    }
  }
  syncButtons();
  render();
}

function selectDir(dir) {
  animator.setDir(dir);
  syncButtons();
  render();
}

function togglePlay() {
  if (animator.finished) {
    animator.replay();
  } else {
    animator.playing = !animator.playing;
  }
  syncButtons();
  render();
}

function stepFrame(delta) {
  animator.playing = false;
  animator.time = 0;
  let f = Math.round(animator.frame) + delta;
  if (animator.loop) {
    f = ((f % animator.frames) + animator.frames) % animator.frames;
    animator.finished = false;
  } else {
    f = Math.max(0, Math.min(animator.frames - 1, f));
    animator.finished = f === animator.frames - 1;
  }
  animator.frame = f;
  syncButtons();
  render();
}

playBtn.addEventListener('click', togglePlay);
document.getElementById('btn-replay').addEventListener('click', () => {
  animator.replay();
  syncButtons();
  render();
});
document.getElementById('btn-prev').addEventListener('click', () => stepFrame(-1));
document.getElementById('btn-next').addEventListener('click', () => stepFrame(1));

speedInput.addEventListener('input', () => {
  state.speed = Number(speedInput.value);
  animator.setSpeed(state.speed);
  speedOut.textContent = `${state.speed.toFixed(1)}×`;
  render();
});

zoomInput.addEventListener('input', () => {
  state.zoom = Math.max(2, Math.min(11, Number(zoomInput.value) | 0));
  zoomOut.textContent = `${state.zoom}×`;
  render();
});

gridBtn.addEventListener('click', () => {
  state.grid = !state.grid;
  syncButtons();
  render();
});

bgBtn.addEventListener('click', () => {
  state.bg = !state.bg;
  syncButtons();
  render();
});

document.getElementById('btn-png').addEventListener('click', exportPng);

function exportPng() {
  const cell = getFrame(animator.action, animator.dir, Math.round(animator.frame));
  const out = document.createElement('canvas');
  out.width = CELL_W * EXPORT_SCALE;
  out.height = CELL_H * EXPORT_SCALE;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(cell.canvas, 0, 0, out.width, out.height);

  const dirKey = (DIRECTIONS.find(d => d.id === animator.dir) || DIRECTIONS[0]).key;
  out.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farmer-${animator.action}-${dirKey}-f${Math.round(animator.frame)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ---------- 键盘 ---------- */

const DIR_ORDER = [DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP];

window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement) return;
  if (state.tab !== 'farmer') return;
  const k = e.key.toLowerCase();

  if (k === ' ') {
    e.preventDefault();
    togglePlay();
    return;
  }
  if (k === 'arrowleft' || k === 'a') {
    e.preventDefault();
    const i = DIR_ORDER.indexOf(animator.dir);
    selectDir(DIR_ORDER[(i + DIR_ORDER.length - 1) % DIR_ORDER.length]);
    return;
  }
  if (k === 'arrowright' || k === 'd') {
    e.preventDefault();
    const i = DIR_ORDER.indexOf(animator.dir);
    selectDir(DIR_ORDER[(i + 1) % DIR_ORDER.length]);
    return;
  }
  if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') {
    e.preventDefault();
    const i = ACTIONS.findIndex(a => a.id === animator.action);
    const step = (k === 'arrowup' || k === 'w') ? -1 : 1;
    const next = (i + step + ACTIONS.length) % ACTIONS.length;
    selectAction(ACTIONS[next].id, true);
    return;
  }
  if (k === 'r') {
    animator.replay();
    syncButtons();
    render();
    return;
  }
  if (k >= '1' && k <= '9') {
    const idx = Number(k) - 1;
    if (ACTIONS[idx]) selectAction(ACTIONS[idx].id, true);
  }
});

/* ---------- 主循环 ---------- */

let last = performance.now();

function tick(dt) {
  if (state.tab === 'farmer') {
    if (animator.playing) animator.update(dt);
    updateGallery(dt);
    render();
  } else if (state.tab === 'plants') {
    plantPanel.tick(dt);
  } else if (state.tab === 'trees') {
    treePanel.tick(dt);
  } else if (state.tab === 'minerals') {
    mineralPanel.tick(dt);
  } else if (state.tab === 'fish') {
    fishPanel.tick(dt);
  } else if (state.tab === 'buildings') {
    buildingPanel.tick(dt);
  } else if (state.tab === 'artisan') {
    artisanPanel.tick(dt);
  } else if (state.tab === 'dishes') {
    dishPanel.tick(dt);
  } else if (state.tab === 'npcs') {
    npcPanel.tick(dt);
  } else if (state.tab === 'monsters') {
    monsterPanel.tick(dt);
  } else if (state.tab === 'equipment') {
    equipmentPanel.tick(dt);
  } else {
    animalPanel.tick(dt);
  }
}

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  tick(dt);
  requestAnimationFrame(loop);
}

/* 初始化 */
const plantPanel = initPlantPanel();
const animalPanel = initAnimalPanel();
const treePanel = initTreePanel();
const mineralPanel = initMineralPanel();
const fishPanel = initFishPanel();
const buildingPanel = initBuildingPanel();
const artisanPanel = initArtisanPanel();
const dishPanel = initDishPanel();
const npcPanel = initNpcPanel();
const monsterPanel = initMonsterPanel();
const equipmentPanel = initEquipmentPanel();

const tabButtons = [...document.querySelectorAll('.tabs button')];
function setTab(name) {
  if (!['farmer', 'plants', 'trees', 'minerals', 'fish', 'buildings', 'artisan', 'dishes', 'npcs', 'animals', 'monsters', 'equipment'].includes(name)) return;
  state.tab = name;
  for (const b of tabButtons) b.classList.toggle('active', b.dataset.tab === name);
  for (const p of document.querySelectorAll('.tab-panel')) {
    p.classList.toggle('active', p.id === `tab-${name}`);
  }
  if (name === 'farmer') render();
  else if (name === 'plants') plantPanel.activate();
  else if (name === 'trees') treePanel.activate();
  else if (name === 'minerals') mineralPanel.activate();
  else if (name === 'fish') fishPanel.activate();
  else if (name === 'buildings') buildingPanel.activate();
  else if (name === 'artisan') artisanPanel.activate();
  else if (name === 'dishes') dishPanel.activate();
  else if (name === 'npcs') npcPanel.activate();
  else if (name === 'monsters') monsterPanel.activate();
  else if (name === 'equipment') equipmentPanel.activate();
  else animalPanel.activate();
}
for (const b of tabButtons) b.addEventListener('click', () => setTab(b.dataset.tab));

preloadAll();
buildGallery();
syncButtons();
speedOut.textContent = '1.0×';
zoomOut.textContent = `${state.zoom}×`;
render();
requestAnimationFrame(loop);

/* 调试 / 无焦点环境下手动驱动：window.__animDemo.tick(1/60) */
window.__animDemo = {
  state,
  animator,
  tick,
  render,
  selectAction,
  selectDir,
  stepFrame,
  togglePlay,
  getFrame,
  ACTION_MAP,
  plantPanel,
  animalPanel,
  treePanel,
  mineralPanel,
  fishPanel,
  buildingPanel,
  artisanPanel,
  dishPanel,
  npcPanel,
  monsterPanel,
  equipmentPanel,
  setTab
};
