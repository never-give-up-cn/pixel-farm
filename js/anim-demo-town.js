/* 小镇日程演示：鹈鹕镇广场，12 位村民按时间表走动。
 * 时间滑块 / 自动时间，点击 NPC 查看头像与职业。 */

import { NPCS, NPC_MAP, drawNpcWalk, drawNpcPortrait, PORTRAIT_W, PORTRAIT_H } from './anim/npcs.js';
import { SPECIAL_MAP } from './anim/special-npcs.js';
import { DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP, mulberry32, ellipse, line, R } from './anim/pixel.js';

const W = 480;
const H = 520;

/* [小时, x, y, 地点] */
const TOWN_NPCS = [
  { id: 'abigail', sched: [[6, 140, 190, '家'], [10, 210, 250, '广场'], [16, 350, 230, '商店'], [20, 140, 180, '家']] },
  { id: 'pierre', sched: [[6, 370, 220, '杂货店'], [10, 370, 270, '柜台'], [16, 360, 270, '广场'], [20, 370, 210, '杂货店']] },
  { id: 'marnie', sched: [[6, 100, 380, '牧场'], [10, 180, 320, '广场'], [16, 110, 360, '广场'], [20, 90, 370, '牧场']] },
  { id: 'robin', sched: [[6, 320, 150, '木工坊'], [10, 270, 250, '广场'], [16, 300, 220, '广场'], [20, 330, 150, '木工坊']] },
  { id: 'lewis', sched: [[6, 240, 150, '镇公所'], [10, 220, 270, '广场'], [16, 240, 260, '广场'], [20, 240, 140, '镇公所']] },
  { id: 'clint', sched: [[6, 120, 220, '铁匠铺'], [10, 180, 270, '广场'], [16, 140, 280, '广场'], [20, 110, 220, '铁匠铺']] },
  { id: 'willy', sched: [[6, 410, 380, '码头'], [10, 320, 330, '广场'], [16, 390, 360, '广场'], [20, 400, 370, '码头']] },
  { id: 'caroline', sched: [[6, 170, 170, '家'], [10, 230, 250, '广场'], [16, 180, 240, '广场'], [20, 160, 170, '家']] },
  { id: 'jodi', sched: [[6, 200, 170, '家'], [10, 250, 260, '广场'], [16, 200, 300, '广场'], [20, 200, 160, '家']] },
  { id: 'demetrius', sched: [[6, 300, 170, '家'], [10, 270, 250, '广场'], [16, 280, 300, '广场'], [20, 310, 160, '家']] },
  { id: 'gunther', sched: [[6, 350, 250, '博物馆'], [10, 300, 280, '广场'], [16, 330, 310, '广场'], [20, 350, 240, '博物馆']] },
  { id: 'marlon', sched: [[6, 80, 260, '冒险家公会'], [10, 160, 290, '广场'], [16, 100, 300, '广场'], [20, 80, 250, '冒险家公会']] }
];

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

function clockText(h) {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function scheduleAt(npc, hour) {
  let cur = npc.sched[0];
  for (const s of npc.sched) if (hour >= s[0]) cur = s;
  return cur;
}

export function initTownPanel() {
  const canvas = document.getElementById('town-stage');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const state = {
    clock: 8,
    playing: true,
    selected: 'abigail',
    time: 0,
    npcs: []
  };

  const listHost = document.getElementById('town-list');
  const statusEl = document.getElementById('town-status');
  const noteEl = document.getElementById('town-note');
  const timeInput = document.getElementById('town-time');
  const timeOut = document.getElementById('town-time-out');
  const playBtn = document.getElementById('town-play');

  /* ---------- 背景：鹈鹕镇广场 ---------- */
  const bg = (() => {
    const { canvas: c, ctx: g } = makeCanvas(W, H);
    const rnd = mulberry32(2828);

    /* 天空 */
    const sky = g.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#7ab0d8');
    sky.addColorStop(1, '#c8e0e8');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, 260);
    for (let i = 0; i < 5; i++) {
      const x = 26 + i * 100, y = 30 + (i % 2) * 26;
      g.fillStyle = '#e8f4ff';
      g.fillRect(x, y, 44, 10);
      g.fillRect(x + 8, y - 6, 28, 8);
    }
    /* 远山 */
    g.fillStyle = '#8ab08a';
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo(i * 70 - 40, 250);
      g.lineTo(i * 70 + 10, 178);
      g.lineTo(i * 70 + 60, 250);
      g.closePath();
      g.fill();
    }

    /* 草地 */
    g.fillStyle = '#5a9a4a';
    g.fillRect(0, 246, W, H - 246);
    g.fillStyle = '#68a854';
    g.fillRect(0, 246, W, 4);

    /* 道路 / 广场 */
    g.fillStyle = '#9a8a6a';
    g.fillRect(0, 330, W, 100);
    g.fillStyle = '#b0a080';
    g.fillRect(0, 330, W, 4);
    for (let y = 342; y < 430; y += 18) {
      for (let x = (y % 36 ? 18 : 0); x < W; x += 36) {
        g.fillStyle = (x + y) % 3 ? '#a89878' : '#b8a888';
        g.fillRect(x, y, 32, 14);
        g.fillStyle = '#8a7a5a';
        g.fillRect(x, y + 14, 32, 1);
      }
    }

    /* 房屋 */
    const house = (x, y, w, h, wall, roof, windows) => {
      g.fillStyle = wall;
      g.fillRect(x, y, w, h);
      g.fillStyle = roof;
      for (let i = 0; i < w / 2; i++) g.fillRect(x + i, y - i, w - i * 2, 2);
      g.fillStyle = '#5a3a22';
      g.fillRect(x + w / 2 - 8, y + h - 26, 16, 26);
      g.fillStyle = '#e8c060';
      for (const wx of windows) {
        g.fillRect(x + wx, y + 18, 16, 14);
        g.fillStyle = '#6a8aa0';
        g.fillRect(x + wx + 2, y + 20, 12, 10);
        g.fillStyle = '#e8c060';
      }
    };
    house(32, 104, 100, 92, '#d8b890', '#8a4a3a', [16, 60]);
    house(350, 104, 100, 92, '#c8b8a0', '#5a4a7a', [16, 60]);
    house(180, 88, 120, 108, '#d8c8a8', '#8a3a3a', [22, 82]);
    house(42, 286, 90, 76, '#b8a888', '#6a4a3a', [16, 56]);
    house(380, 286, 76, 76, '#c8b090', '#4a5a7a', [14, 48]);

    /* 店牌 */
    g.fillStyle = '#5a3a22';
    g.fillRect(360, 150, 6, 40);
    g.fillStyle = '#e0c060';
    g.fillRect(350, 140, 32, 12);
    g.fillStyle = '#3a2a1a';
    g.fillRect(356, 144, 18, 3);

    /* 喷泉 */
    ellipse(g, 240, 300, 42, 18, '#8a8a7a');
    ellipse(g, 240, 296, 36, 14, '#5a9ac0');
    ellipse(g, 240, 294, 28, 10, '#7ac0e0');
    R(g, 236, 270, 8, 28, '#a0a0a8');
    ellipse(g, 240, 268, 8, 4, '#c8d0d8');
    line(g, 240, 268, 224, 286, '#a0e0f0', 1);
    line(g, 240, 268, 256, 286, '#a0e0f0', 1);

    /* 树 */
    for (const [x, y] of [[12, 300], [460, 300], [140, 270], [330, 270]]) {
      g.fillStyle = '#6a4a2a';
      g.fillRect(x, y, 10, 58);
      g.fillStyle = '#3a6a2a';
      ellipse(g, x + 5, y - 8, 28, 22, '#3a6a2a');
      ellipse(g, x + 5, y - 14, 22, 18, '#4a8a32');
      ellipse(g, x - 4, y - 2, 16, 12, '#5aa04a');
    }

    /* 路灯 */
    for (const x of [100, 380]) {
      g.fillStyle = '#4a4a52';
      g.fillRect(x, 220, 4, 100);
      g.fillStyle = '#e8d080';
      g.fillRect(x - 5, 212, 14, 10);
      g.fillStyle = '#fff0a0';
      g.fillRect(x - 2, 214, 8, 5);
    }

    /* 花 */
    for (let i = 0; i < 26; i++) {
      const x = 20 + (i * 37) % 440, y = 360 + (i * 13) % 70;
      g.fillStyle = ['#e8d050', '#e08ab0', '#f0f0e8'][i % 3];
      g.fillRect(x, y, 3, 3);
      g.fillStyle = '#3a6a2a';
      g.fillRect(x + 1, y + 3, 1, 4);
    }

    for (let i = 0; i < 45; i++) {
      g.fillStyle = i % 2 ? '#4a8a3a' : '#3a6a2a';
      g.fillRect(Math.floor(rnd() * W), 250 + Math.floor(rnd() * 180), 2, 4);
    }

    return c;
  })();

  /* ---------- NPC 初始化 ---------- */
  for (const entry of TOWN_NPCS) {
    const data = NPC_MAP[entry.id] || SPECIAL_MAP[entry.id];
    if (!data) continue;
    const s = scheduleAt(entry, state.clock);
    state.npcs.push({
      id: entry.id,
      data,
      sched: entry.sched,
      x: s[1],
      y: s[2],
      dir: DIR_DOWN,
      moving: false,
      phase: 0,
      location: s[3]
    });
  }

  for (const n of state.npcs) {
    const b = document.createElement('button');
    b.textContent = n.data.name;
    b.dataset.npc = n.id;
    b.addEventListener('click', () => selectNpc(n.id));
    listHost.appendChild(b);
  }

  function selectNpc(id) {
    state.selected = id;
    sync();
    render();
  }

  function sync() {
    const sel = state.npcs.find(n => n.id === state.selected) || state.npcs[0];
    for (const b of listHost.children) b.classList.toggle('active', b.dataset.npc === sel.id);
    timeInput.value = String(state.clock);
    timeOut.textContent = clockText(state.clock);
    playBtn.textContent = state.playing ? '暂停时间' : '继续时间';
    noteEl.textContent = `${clockText(state.clock)} · ${sel.data.name} 在${sel.location}`;
    statusEl.innerHTML =
      `<dt>村民</dt><dd>${sel.data.name} (${sel.data.en})</dd>` +
      `<dt>职业</dt><dd>${sel.data.job}</dd>` +
      `<dt>时间</dt><dd>${clockText(state.clock)}</dd>` +
      `<dt>位置</dt><dd>${sel.location}</dd>`;
  }

  /* ---------- 更新 ---------- */
  function update(dt) {
    state.time += dt;
    if (state.playing) {
      state.clock += dt * 0.12;
      if (state.clock >= 24) state.clock = 6;
    }
    for (const n of state.npcs) {
      const s = scheduleAt(n, state.clock);
      n.location = s[3];
      const tx = s[1], ty = s[2];
      const dx = tx - n.x, dy = ty - n.y;
      const d = Math.hypot(dx, dy);
      if (d > 1.5) {
        n.moving = true;
        const sp = 56 * dt;
        if (d <= sp) {
          n.x = tx; n.y = ty; n.moving = false;
        } else {
          n.x += dx / d * sp;
          n.y += dy / d * sp;
        }
        if (Math.abs(dx) > Math.abs(dy)) n.dir = dx < 0 ? DIR_LEFT : DIR_RIGHT;
        else n.dir = dy < 0 ? DIR_UP : DIR_DOWN;
      } else {
        n.moving = false;
      }
    }
  }

  /* ---------- 渲染 ---------- */
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);

    /* 时间色调 */
    const h = state.clock;
    let tint = null;
    if (h < 7) tint = 'rgba(20,30,70,0.38)';
    else if (h < 8.5) tint = 'rgba(255,160,80,0.12)';
    else if (h > 19) tint = 'rgba(30,30,80,0.32)';
    else if (h > 17) tint = 'rgba(255,140,60,0.10)';
    if (tint) {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, W, H);
    }

    /* 路灯 / 窗户夜间发光 */
    if (h < 7 || h > 18.5) {
      for (const x of [100, 380]) {
        const g = ctx.createRadialGradient(x + 2, 216, 2, x + 2, 216, 54);
        g.addColorStop(0, 'rgba(255,230,120,0.35)');
        g.addColorStop(1, 'rgba(255,230,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 52, 164, 108, 108);
      }
      for (const [x, y] of [[48, 122], [366, 122], [202, 106]]) {
        ctx.fillStyle = 'rgba(255,220,120,0.45)';
        ctx.fillRect(x, y, 16, 14);
      }
    }

    /* NPC 按 y 排序 */
    const sorted = [...state.npcs].sort((a, b) => a.y - b.y);
    for (const n of sorted) {
      const frame = n.moving ? Math.floor(state.time * 6 + n.x * 0.05) % 4 : 0;
      const selected = n.id === state.selected;
      ctx.save();
      ctx.translate(n.x - 24, n.y - 64);
      if (selected) {
        ctx.strokeStyle = '#e9c96f';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 46, 62);
      }
      ctx.scale(2, 2);
      drawNpcWalk(ctx, n.data, n.dir, frame);
      ctx.restore();

      /* 名字（只显示选中的，避免 12 个名字重叠） */
      if (selected) {
        ctx.fillStyle = 'rgba(10, 12, 16, 0.72)';
        ctx.fillRect(n.x - 30, n.y + 6, 60, 12);
        ctx.fillStyle = '#e9c96f';
        ctx.font = '9px "Microsoft YaHei", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.data.name, n.x, n.y + 15);
        ctx.textAlign = 'left';
      }
    }

    /* 选中头像 */
    const sel = state.npcs.find(n => n.id === state.selected) || state.npcs[0];
    if (sel) {
      const px = 340, py = 24, ps = 120;
      ctx.fillStyle = 'rgba(10, 14, 18, 0.85)';
      ctx.fillRect(px - 5, py - 5, ps + 10, ps + 10);
      ctx.strokeStyle = '#e9c96f';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 4, py - 4, ps + 8, ps + 8);
      ctx.drawImage((() => {
        const c = makeCanvas(PORTRAIT_W, PORTRAIT_H);
        drawNpcPortrait(c.ctx, sel.data);
        return c.canvas;
      })(), px, py, ps, ps);
    }

    /* 顶部时间 */
    ctx.fillStyle = 'rgba(10, 12, 16, 0.76)';
    ctx.fillRect(12, 20, 176, 36);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '15px "Microsoft YaHei", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`鹈鹕镇  ${clockText(state.clock)}`, 24, 38);

    /* 底栏 */
    ctx.fillStyle = 'rgba(12, 10, 8, 0.84)';
    ctx.fillRect(0, H - 46, W, 46);
    ctx.fillStyle = '#e9c96f';
    ctx.font = '13px "Microsoft YaHei", monospace';
    ctx.fillText(`${sel.data.name} · ${sel.data.job}`, 14, H - 27);
    ctx.fillStyle = '#9aa8b8';
    ctx.font = '11px monospace';
    ctx.fillText(`${clockText(state.clock)}   ${sel.location}`, 14, H - 10);

    sync();
  }

  function tick(dt) {
    update(dt);
    render();
  }

  playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    sync();
  });
  timeInput.addEventListener('input', () => {
    state.clock = Number(timeInput.value);
    sync();
    render();
  });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * W / rect.width;
    const y = (e.clientY - rect.top) * H / rect.height;
    let best = null, bd = Infinity;
    for (const n of state.npcs) {
      const d = Math.hypot(x - n.x, y - (n.y - 32));
      if (d < 34 && d < bd) { bd = d; best = n; }
    }
    if (best) selectNpc(best.id);
  });

  sync();
  render();

  return {
    activate() { render(); },
    tick
  };
}
