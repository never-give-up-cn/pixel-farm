/* 植物（作物）像素绘制：12 种作物 × 5 个生长阶段。
 * 每株都画在 32×40 的格子里，地表基线 y=34，可直接作为图鉴或游戏内作物贴图。
 * 只依赖 ./pixel.js，不读游戏数据，后续游戏可自行映射 CONFIG.CROPS。 */

import { PALETTE, R, line, ellipse, TAU } from './pixel.js';

export const PLANT_W = 32;
export const PLANT_H = 40;
export const PLANT_BASE = 34;
export const PLANT_STAGES = ['种子', '幼苗', '生长', '结果', '成熟'];

const SOIL = '#6b4a2b';
const SOIL_LIGHT = '#8a6238';

/* kind：root 根菜 / tuber 块茎 / vine 藤果 / gourd 瓜 / grain 禾本 / corn 高秆 / flower 花 / bush 矮丛 */
export const PLANTS = [
  { id:'radish',        name:'萝卜',     kind:'root',   days:3, season:'春', leaf:'#4aa03c', leafDark:'#2f7a2a', ripe:'#e0556b', unripe:'#d8b0a8' },
  { id:'carrot',        name:'胡萝卜',   kind:'root',   days:4, season:'春', leaf:'#4a9a3a', leafDark:'#2f7028', ripe:'#e8893c', unripe:'#e8c48a' },
  { id:'potato',        name:'土豆',     kind:'tuber',  days:5, season:'春', leaf:'#3f9440', leafDark:'#2c6f2e', ripe:'#b98a4b', unripe:'#c9b58c' },
  { id:'tomato',        name:'番茄',     kind:'vine',   days:6, season:'夏', leaf:'#2f8f34', leafDark:'#226b28', ripe:'#e03a24', unripe:'#c9d17a' },
  { id:'pumpkin',       name:'南瓜',     kind:'gourd',  days:7, season:'秋', leaf:'#3a8c32', leafDark:'#286b24', ripe:'#e07a1f', unripe:'#b8bf72' },
  { id:'wheat',         name:'小麦',     kind:'grain',  days:4, season:'春', leaf:'#7aa03c', leafDark:'#5a7a2a', ripe:'#e0b84a', unripe:'#a8c060' },
  { id:'corn',          name:'玉米',     kind:'corn',   days:6, season:'夏', leaf:'#4a9a3a', leafDark:'#327a2a', ripe:'#f0c040', unripe:'#b8d070' },
  { id:'sunflower',     name:'向日葵',   kind:'flower', days:5, season:'夏', leaf:'#3f9440', leafDark:'#2c6f2e', ripe:'#f2c84a', unripe:'#c8d060' },
  { id:'strawberry',    name:'草莓',     kind:'bush',   days:4, season:'春', leaf:'#3f9440', leafDark:'#2a702c', ripe:'#e0403a', unripe:'#f0e0a0' },
  { id:'tomato_radish', name:'樱桃萝卜', kind:'root',   days:4, season:'春', leaf:'#4aa03c', leafDark:'#2f7a2a', ripe:'#e0556b', unripe:'#d8b0a8', hybrid:true },
  { id:'potato_pumpkin',name:'黄金薯',   kind:'tuber',  days:6, season:'春', leaf:'#3f9440', leafDark:'#2c6f2e', ripe:'#d8a24b', unripe:'#c9b58c', hybrid:true },
  { id:'tomato_pumpkin',name:'小南瓜',   kind:'gourd',  days:5, season:'夏', leaf:'#2f8f34', leafDark:'#226b28', ripe:'#e07a1f', unripe:'#b8bf72', hybrid:true }
];

export const PLANT_MAP = Object.fromEntries(PLANTS.map(p => [p.id, p]));

function swayOf(phase, stage) {
  return Math.round(Math.sin(phase * TAU) * (0.4 + stage * 0.18));
}

/* 细茎 + 顶端叶片 */
function drawSprout(g, cx, stage, leaf, dark) {
  const h = 3 + stage * 2;
  line(g, cx, PLANT_BASE, cx, PLANT_BASE - h, dark, 1);
  R(g, cx - 2, PLANT_BASE - h - 1, 2, 2, leaf);
  R(g, cx + 1, PLANT_BASE - h, 2, 2, leaf);
  if (stage >= 1) {
    R(g, cx - 3, PLANT_BASE - h + 1, 1, 1, dark);
    R(g, cx + 3, PLANT_BASE - h + 2, 1, 1, dark);
  }
}

/* 一片像素叶子：从 (x,y) 朝 dir 方向伸出的 3~5 像素叶片 */
function leafAt(g, x, y, dir, color, dark, len) {
  const n = len || 3;
  for (let i = 0; i < n; i++) {
    R(g, x + dir * i, y + (i > n - 2 ? -1 : 0), 1, 2, color);
  }
  R(g, x + dir * (n - 1), y - 1, 1, 1, dark);
}

function drawRoot(g, p, stage, phase, cx) {
  const s = swayOf(phase, stage);
  if (stage <= 1) { drawSprout(g, cx, stage, p.leaf, p.leafDark); return; }

  const h = [0, 0, 7, 12, 15][stage];
  const top = PLANT_BASE - h;
  /* 根茎 */
  line(g, cx, PLANT_BASE, cx + s, top + 4, p.leafDark, 2);
  /* 放射状叶子 */
  const n = stage + 1;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55;
    const len = 4 + stage * 2;
    const ex = Math.round(cx + Math.cos(a) * len + s);
    const ey = Math.round(top + 4 + Math.sin(a) * len);
    line(g, cx + s, top + 4, ex, ey, i % 2 ? p.leaf : p.leafDark, 2);
    R(g, ex - 1, ey - 1, 2, 2, p.leaf);
  }
  R(g, cx - 2, top + 2, 4, 2, p.leaf);

  /* 露出土面的根 */
  if (stage >= 3) {
    const ripe = stage >= 4;
    const col = ripe ? p.ripe : p.unripe;
    const r = ripe ? 4 : 3;
    ellipse(g, cx, PLANT_BASE - 1, r, ripe ? 3 : 2, col);
    R(g, cx - r + 2, PLANT_BASE - (ripe ? 4 : 3), 2, 1, '#ffffff');
  }
}

function drawTuber(g, p, stage, phase, cx) {
  const s = swayOf(phase, stage);
  if (stage <= 1) { drawSprout(g, cx, stage, p.leaf, p.leafDark); return; }

  const h = [0, 0, 6, 9, 11][stage];
  const top = PLANT_BASE - h;
  line(g, cx, PLANT_BASE, cx + s, top + 3, p.leafDark, 2);
  for (let i = 0; i < stage + 1; i++) {
    const dir = i % 2 ? 1 : -1;
    leafAt(g, cx + s + dir * 1, top + 3 + i * 2, dir, p.leaf, p.leafDark, 3 + stage);
  }
  R(g, cx + s - 1, top + 1, 3, 2, p.leaf);

  if (stage >= 3) {
    const n = stage;                       /* 结 3~4 个块茎 */
    for (let i = 0; i < n; i++) {
      const x = cx - 5 + i * 3;
      const col = stage >= 4 ? p.ripe : p.unripe;
      ellipse(g, x, PLANT_BASE - 1, 2, 1, col);
      if (stage >= 4) R(g, x - 1, PLANT_BASE - 2, 1, 1, '#ffffff');
    }
  }
}

function drawVine(g, p, stage, phase, cx) {
  const s = swayOf(phase, stage);
  if (stage <= 1) { drawSprout(g, cx, stage, p.leaf, p.leafDark); return; }

  const h = [0, 0, 12, 18, 21][stage];
  const top = PLANT_BASE - h;
  /* 支架 */
  line(g, cx + 6, PLANT_BASE, cx + 6, top, PALETTE.woodShade, 1);
  line(g, cx + 5, top + 2, cx + 7, top + 2, PALETTE.wood, 1);

  /* 主藤 */
  line(g, cx - 1, PLANT_BASE, cx + s, top + 2, p.leafDark, 2);
  for (let i = 0; i < stage + 1; i++) {
    const y = top + 4 + i * 3;
    const dir = i % 2 ? -1 : 1;
    leafAt(g, cx + s + dir * 1, y, dir, p.leaf, p.leafDark, 3 + (i % 2));
  }

  if (stage >= 3) {
    const col = stage >= 4 ? p.ripe : p.unripe;
    const spots = stage >= 4 ? [0, -5, 5] : [-4, 4];
    for (const dx of spots) {
      const fx = cx + dx;
      const fy = top + 9 + Math.abs(dx) / 2;
      line(g, cx + s, fy - 3, fx, fy - 1, p.leafDark, 1);
      ellipse(g, fx, fy, stage >= 4 ? 3 : 2, stage >= 4 ? 3 : 2, col);
      R(g, fx - 1, fy - 2, 1, 1, '#ffffff');
      R(g, fx - 2, fy - 4, 3, 1, p.leafDark);
    }
  }
}

function drawGourd(g, p, stage, phase, cx) {
  const s = swayOf(phase, stage);
  if (stage <= 1) { drawSprout(g, cx, stage, p.leaf, p.leafDark); return; }

  /* 匍匐叶 */
  const h = [0, 0, 5, 7, 8][stage];
  for (let i = 0; i < stage + 2; i++) {
    const dir = i % 2 ? 1 : -1;
    const x = cx + dir * (3 + i * 2);
    const y = PLANT_BASE - 2 - (i % 3);
    ellipse(g, x, y, 3 + (stage > 3 ? 1 : 0), 2, i % 2 ? p.leaf : p.leafDark);
  }
  line(g, cx, PLANT_BASE, cx + s, PLANT_BASE - h, p.leafDark, 2);

  if (stage >= 3) {
    const r = stage >= 4 ? 6 : 4;
    const col = stage >= 4 ? p.ripe : p.unripe;
    ellipse(g, cx + 1, PLANT_BASE - r + 2, r, r - 1, col);
    /* 瓜棱 */
    R(g, cx + 1, PLANT_BASE - r + 2 - (r - 1), 1, (r - 1) * 2, 'rgba(0,0,0,0.18)');
    R(g, cx - r + 2, PLANT_BASE - r, 2, 2, '#ffffff');
    R(g, cx + 1, PLANT_BASE - r - 1, 1, 2, p.leafDark);
  } else if (stage >= 2) {
    ellipse(g, cx + 3, PLANT_BASE - 2, 2, 1, p.unripe);
  }
}

function drawGrain(g, p, stage, phase, cx) {
  if (stage <= 0) { drawSprout(g, cx, 0, p.leaf, p.leafDark); return; }

  const h = [0, 6, 13, 19, 23][stage];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2);
    const tipX = Math.round(cx + off * 1.4 + swayOf(phase + i * 0.05, stage) * 0.7);
    const baseX = Math.round(cx + off);
    line(g, baseX, PLANT_BASE, tipX, PLANT_BASE - h, i % 2 ? p.leaf : p.leafDark, 1);
    if (stage >= 2) {
      const col = stage >= 4 ? p.ripe : p.unripe;
      const headY = PLANT_BASE - h - 2;
      R(g, tipX - 1, headY, 2, 4, col);
      R(g, tipX - 2, headY + 1, 1, 2, col);
      R(g, tipX + 1, headY + 2, 1, 2, col);
      if (stage >= 4) R(g, tipX - 1, headY, 1, 1, '#fff2b0');
    }
  }
}

function drawCorn(g, p, stage, phase, cx) {
  if (stage <= 0) { drawSprout(g, cx, 0, p.leaf, p.leafDark); return; }

  const h = [0, 9, 17, 24, 28][stage];
  const top = PLANT_BASE - h;
  const s = swayOf(phase, stage);
  line(g, cx, PLANT_BASE, cx + s, top, p.leafDark, 3);
  for (let i = 0; i < stage + 1; i++) {
    const dir = i % 2 ? 1 : -1;
    const y = top + 5 + i * 4;
    line(g, cx + s, y, cx + s + dir * (4 + stage), y + (dir > 0 ? 2 : -1), i % 2 ? p.leaf : p.leafDark, 2);
  }
  R(g, cx + s - 1, top - 1, 3, 3, p.leaf);

  if (stage >= 3) {
    const n = stage >= 4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const dir = i ? -1 : 1;
      const x = cx + s + dir * 3;
      const y = top + 10 + i * 6;
      ellipse(g, x, y, 2, 4, stage >= 4 ? p.ripe : p.unripe);
      R(g, x - 1, y - 3, 1, 2, '#fff0a0');
      R(g, x - 2, y - 5, 1, 3, p.leafDark);
    }
  }
}

function drawFlower(g, p, stage, phase, cx) {
  if (stage <= 1) { drawSprout(g, cx, stage, p.leaf, p.leafDark); return; }

  const h = [0, 0, 10, 18, 24][stage];
  const top = PLANT_BASE - h;
  const s = swayOf(phase, stage);
  line(g, cx, PLANT_BASE, cx + s, top + 3, p.leafDark, 2);
  for (let i = 0; i < 2 + stage; i++) {
    const dir = i % 2 ? 1 : -1;
    const y = top + 6 + i * 4;
    if (y > PLANT_BASE - 4) continue;
    leafAt(g, cx + s + dir, y, dir, p.leaf, p.leafDark, 4);
  }

  if (stage >= 2) {
    const r = stage >= 4 ? 7 : stage >= 3 ? 5 : 3;
    const col = stage >= 4 ? p.ripe : p.unripe;
    const fx = cx + s;
    const fy = top + 1;
    /* 花瓣 */
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const px = Math.round(fx + Math.cos(a) * r);
      const py = Math.round(fy + Math.sin(a) * (r * 0.75));
      R(g, px - 1, py - 1, 2, 2, col);
    }
    ellipse(g, fx, fy, Math.max(2, r - 3), Math.max(2, r - 4), stage >= 4 ? '#6b4226' : p.unripe);
    R(g, fx - 1, fy - 1, 1, 1, '#3a2414');
  }
}

function drawBush(g, p, stage, phase, cx) {
  const s = swayOf(phase, stage);
  if (stage <= 0) { drawSprout(g, cx, 0, p.leaf, p.leafDark); return; }

  const r = [0, 4, 6, 8, 9][stage];
  /* 叶丛 */
  ellipse(g, cx - 3, PLANT_BASE - 5, r, Math.max(2, r - 4), p.leafDark);
  ellipse(g, cx + 3, PLANT_BASE - 6, r - 1, Math.max(2, r - 5), p.leaf);
  ellipse(g, cx, PLANT_BASE - 8 + s, r - 2, Math.max(2, r - 6), p.leafDark);
  R(g, cx - 2, PLANT_BASE - 11 + s, 2, 1, p.leaf);

  if (stage >= 2) {
    const n = stage >= 4 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = cx - 5 + i * 5;
      const y = PLANT_BASE - 3 - (i % 2) + s;
      if (stage >= 3) {
        ellipse(g, x, y, 2, 2, stage >= 4 ? p.ripe : p.unripe);
        if (stage >= 4) {
          R(g, x - 1, y - 2, 1, 1, '#ffffff');
          R(g, x - 1, y - 3, 2, 1, p.leafDark);
        }
      } else {
        R(g, x - 1, y - 2, 2, 1, '#f0f0e0');
      }
    }
  }
}

const DRAWERS = {
  root: drawRoot,
  tuber: drawTuber,
  vine: drawVine,
  gourd: drawGourd,
  grain: drawGrain,
  corn: drawCorn,
  flower: drawFlower,
  bush: drawBush
};

/* 成熟闪光的位置：贴着植株顶部 / 果实，避免短株上方空飘 */
const SPARK_AT = {
  root: { x: 25, y: 21 },
  tuber: { x: 25, y: 23 },
  vine: { x: 26, y: 9 },
  gourd: { x: 26, y: 20 },
  grain: { x: 27, y: 5 },
  corn: { x: 26, y: 4 },
  flower: { x: 27, y: 4 },
  bush: { x: 25, y: 19 }
};

/* 在 32×40 格子里画一株作物；phase 只影响摆动与成熟闪光 */
export function drawPlant(g, type, stage, phase = 0) {
  const p = typeof type === 'string' ? PLANT_MAP[type] : type;
  if (!p) return;
  const st = Math.max(0, Math.min(4, Math.round(stage)));
  const cx = 16;

  g.save();
  g.imageSmoothingEnabled = false;

  /* 土堆 */
  if (st > 0) {
    ellipse(g, cx, PLANT_BASE + 1, 6 + st, 2, 'rgba(74, 52, 30, 0.45)');
    R(g, cx - 5, PLANT_BASE, 10, 1, SOIL);
    R(g, cx - 3, PLANT_BASE - 1, 2, 1, SOIL_LIGHT);
  }

  const draw = DRAWERS[p.kind];
  if (draw) draw(g, p, st, phase, cx);

  /* 成熟闪光 */
  if (st >= 4) {
    const blink = 0.5 + 0.5 * Math.sin(phase * TAU * 2);
    g.globalAlpha = 0.35 + blink * 0.55;
    const at = SPARK_AT[p.kind] || { x: 25, y: 8 };
    const sy = at.y + Math.round(Math.sin(phase * TAU) * 1);
    R(g, at.x - 1, sy, 3, 1, '#fff2b0');
    R(g, at.x, sy - 1, 1, 3, '#fff2b0');
    g.globalAlpha = 1;
  }

  g.restore();
}
