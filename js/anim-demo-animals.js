/* 动物图鉴面板：动物 / 动作 / 朝向切换 + 全部动物 × 动作画廊。
 * 由 anim-demo.js 在切到「动物」标签时驱动。 */

import {
  ANIMALS, ANIMAL_MAP, ANIMAL_ACTIONS, ANIMAL_ACTION_MAP,
  AnimalAnimator, getAnimalFrame, ANIMAL_W, ANIMAL_H
} from './anim/animals.js';
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

export function initAnimalPanel() {
  const canvas = document.getElementById('animal-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    animal: 'cow',
    action: 'idle',
    facing: 1,
    playing: true,
    speed: 1,
    zoom: 10,
    grid: true,
    time: 0
  };

  const animator = new AnimalAnimator({
    type: state.animal, action: state.action, facing: state.facing, playing: true
  });

  const animalHost = document.getElementById('animal-list');
  const actionHost = document.getElementById('animal-actions');
  const dirHost = document.getElementById('animal-dirs');
  const playBtn = document.getElementById('animal-play');
  const speedInput = document.getElementById('animal-speed');
  const speedOut = document.getElementById('animal-speed-out');
  const zoomInput = document.getElementById('animal-zoom');
  const zoomOut = document.getElementById('animal-zoom-out');
  const gridBtn = document.getElementById('animal-grid');
  const statusEl = document.getElementById('animal-status');

  /* ---------- 背景：农场围栏 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);

    g.fillStyle = '#22331f';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a3f25';
    g.fillRect(0, 250, W, H - 250);
    g.fillStyle = '#33492a';
    g.fillRect(0, 360, W, H - 360);

    /* 围栏 */
    const fy = 190;
    g.fillStyle = '#7a5a34';
    for (let x = 20; x < W; x += 46) {
      g.fillRect(x, fy - 44, 5, 62);
      g.fillStyle = '#5c4028';
      g.fillRect(x + 3, fy - 44, 2, 62);
      g.fillStyle = '#7a5a34';
    }
    g.fillStyle = '#8a6840';
    g.fillRect(0, fy - 30, W, 6);
    g.fillRect(0, fy - 8, W, 6);
    g.fillStyle = '#5c4028';
    g.fillRect(0, fy - 24, W, 2);
    g.fillRect(0, fy - 2, W, 2);

    /* 草叶与野花 */
    const rnd = mulberry32(20261110);
    for (let i = 0; i < 220; i++) {
      const x = Math.floor(rnd() * W);
      const y = 260 + Math.floor(rnd() * (H - 270));
      g.fillStyle = rnd() > 0.6 ? '#3f6031' : '#365528';
      g.fillRect(x, y, 1, 2 + Math.floor(rnd() * 2));
    }
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(rnd() * W);
      const y = 280 + Math.floor(rnd() * 150);
      g.fillStyle = ['#f2d06b', '#e88aa0', '#e8f0f4'][Math.floor(rnd() * 3)];
      g.fillRect(x, y, 1, 1);
      g.fillRect(x + 2, y, 1, 1);
      g.fillRect(x + 1, y - 1, 1, 1);
    }

    const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    return c;
  })();

  /* ---------- 控件 ---------- */
  for (const a of ANIMALS) {
    const b = document.createElement('button');
    b.textContent = a.name;
    b.dataset.animal = a.id;
    b.addEventListener('click', () => {
      state.animal = a.id;
      animator.setType(a.id);
      animator.replay();
      animator.playing = state.playing;
      sync();
      render();
    });
    animalHost.appendChild(b);
  }

  for (const a of ANIMAL_ACTIONS) {
    const b = document.createElement('button');
    b.textContent = a.name;
    b.dataset.act = a.id;
    b.title = `${a.frames} 帧 · ${a.fps} FPS`;
    b.addEventListener('click', () => {
      state.action = a.id;
      animator.setAction(a.id);
      animator.playing = state.playing;
      sync();
      render();
    });
    actionHost.appendChild(b);
  }

  for (const f of [{ id: -1, name: '左' }, { id: 1, name: '右' }]) {
    const b = document.createElement('button');
    b.textContent = f.name;
    b.dataset.face = String(f.id);
    b.addEventListener('click', () => {
      state.facing = f.id;
      animator.setFacing(f.id);
      sync();
      render();
    });
    dirHost.appendChild(b);
  }

  playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    animator.playing = state.playing;
    sync();
    render();
  });

  speedInput.addEventListener('input', () => {
    state.speed = Number(speedInput.value);
    animator.setSpeed(state.speed);
    speedOut.textContent = `${state.speed.toFixed(1)}×`;
    render();
  });

  zoomInput.addEventListener('input', () => {
    state.zoom = Math.max(6, Math.min(11, Number(zoomInput.value) | 0));
    zoomOut.textContent = `${state.zoom}×`;
    render();
  });

  gridBtn.addEventListener('click', () => {
    state.grid = !state.grid;
    sync();
    render();
  });

  document.getElementById('animal-png').addEventListener('click', exportPng);

  function sync() {
    for (const b of animalHost.children) b.classList.toggle('active', b.dataset.animal === state.animal);
    for (const b of actionHost.children) b.classList.toggle('active', b.dataset.act === state.action);
    for (const b of dirHost.children) b.classList.toggle('active', Number(b.dataset.face) === state.facing);
    playBtn.textContent = state.playing ? '暂停' : '播放';
    gridBtn.classList.toggle('on', state.grid);
    speedInput.value = String(state.speed);
    speedOut.textContent = `${state.speed.toFixed(1)}×`;
    zoomInput.value = String(state.zoom);
    zoomOut.textContent = `${state.zoom}×`;
  }

  function status() {
    const a = ANIMAL_MAP[state.animal];
    const act = ANIMAL_ACTION_MAP[state.action];
    statusEl.innerHTML =
      `<dt>动物</dt><dd>${a.name} (${a.id})</dd>` +
      `<dt>动作</dt><dd>${act.name}</dd>` +
      `<dt>帧</dt><dd>${animator.frame + 1} / ${act.frames}</dd>` +
      `<dt>FPS</dt><dd>${(act.fps * state.speed).toFixed(1)}</dd>` +
      `<dt>朝向</dt><dd>${state.facing < 0 ? '左' : '右'}</dd>`;
  }

  /* ---------- 主画面 ---------- */
  function render() {
    const z = state.zoom;
    const sw = ANIMAL_W * z;
    const sh = ANIMAL_H * z;
    const sx = Math.round((W - sw) / 2);
    const sy = H - sh - 66;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    if (state.grid) {
      ctx.strokeStyle = 'rgba(240, 235, 210, 0.18)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      ctx.strokeStyle = 'rgba(233, 201, 111, 0.4)';
      ctx.beginPath();
      const by = Math.round(sy + 28 * z) + 0.5;
      ctx.moveTo(0, by);
      ctx.lineTo(W, by);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    animator.draw(ctx, sx, sy, z);

    const a = ANIMAL_MAP[state.animal];
    const act = ANIMAL_ACTION_MAP[state.action];
    ctx.fillStyle = 'rgba(10, 14, 12, 0.72)';
    ctx.fillRect(0, H - BAR, W, BAR);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${a.name} · ${act.name} · 第 ${animator.frame + 1} 帧`, 14, H - 27);
    ctx.fillStyle = '#8b9aab';
    ctx.font = '11px monospace';
    ctx.fillText(`frame ${animator.frame} / ${act.frames - 1}   ${act.fps * state.speed} fps   facing ${state.facing < 0 ? 'left' : 'right'}`, 14, H - 10);

    status();
  }

  function exportPng() {
    const cell = getAnimalFrame(state.animal, state.action, state.facing, animator.frame);
    const scale = 8;
    const out = document.createElement('canvas');
    out.width = ANIMAL_W * scale;
    out.height = ANIMAL_H * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(cell.canvas, 0, 0, out.width, out.height);
    download(out, `animal-${state.animal}-${state.action}-${state.facing < 0 ? 'left' : 'right'}.png`);
  }

  /* ---------- 画廊 ---------- */
  const gallery = [];

  function buildGallery() {
    const host = document.getElementById('animal-gallery');
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'agrid';

    grid.appendChild(document.createElement('div'));
    for (const a of ANIMAL_ACTIONS) {
      const h = document.createElement('div');
      h.className = 'ahead';
      h.textContent = a.name;
      grid.appendChild(h);
    }

    for (const an of ANIMALS) {
      const label = document.createElement('div');
      label.className = 'alabel';
      label.textContent = an.name;
      grid.appendChild(label);

      for (const act of ANIMAL_ACTIONS) {
        const cell = document.createElement('div');
        cell.className = 'acell';
        const cv = document.createElement('canvas');
        cv.width = ANIMAL_W;
        cv.height = ANIMAL_H;
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        const anim = new AnimalAnimator({ type: an.id, action: act.id, facing: 1, playing: true });
        gallery.push({ anim, ctx: g });
        cell.appendChild(cv);
        grid.appendChild(cell);
      }
    }

    host.appendChild(grid);
  }

  function tick(dt) {
    state.time += dt;
    animator.update(dt);
    for (const item of gallery) {
      item.anim.update(dt);
      item.anim.draw(item.ctx, 0, 0, 1);
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
