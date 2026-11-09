/* 星露谷树木像素图鉴：10 种野生树 + 8 种果树。
 * 每棵树画在 48×56 的格子里，地表基线 y=50。
 * 每种树用独立轮廓区分：橡树宽冠、枫树高冠红叶、松树塔形、桃花心木窄高、
 * 棕榈羽状、蘑菇树伞盖、神秘树发光、苔藓树垂苔、绿雨树细高垂藤。
 * 果树按品种区分冠形、花和果实位置。 */

import { R, line, ellipse, TAU, clamp } from './pixel.js';

export const TREE_W = 48;
export const TREE_H = 56;
export const TREE_BASE = 50;
export const TREE_STAGES = ['幼苗', '小树', '中树', '大树', '成熟'];
export const TREE_SEASONS = ['春', '夏', '秋', '冬'];

export const WILD_TREES = [
  { id:'oak',        name:'橡树',     en:'Oak Tree',       shape:'oak',       height:34, trunkW:5, bare:true,  leaf:'#5fae4a', leafDark:'#3f7f32', fallLeaf:'#d08a3a', fallLeafDark:'#a05a2a', trunk:'#8a5a2b', trunkDark:'#5c3a1c' },
  { id:'maple',      name:'枫树',     en:'Maple Tree',     shape:'maple',     height:35, trunkW:4, bare:true,  leaf:'#7ab84a', leafDark:'#4a8a32', fallLeaf:'#d0503a', fallLeafDark:'#a02a2a', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'pine',       name:'松树',     en:'Pine Tree',      shape:'pine',      height:36, trunkW:4, bare:false, leaf:'#2f7a3a', leafDark:'#1e5a28', trunk:'#6b4226', trunkDark:'#432a18' },
  { id:'mahogany',   name:'桃花心木', en:'Mahogany Tree',  shape:'mahogany',  height:36, trunkW:4, bare:false, leaf:'#4a8a3a', leafDark:'#2f6a2a', trunk:'#7a3a22', trunkDark:'#4a2214' },
  { id:'palm',       name:'棕榈树',   en:'Palm Tree',      shape:'palm',      height:36, trunkW:4, bare:false, leaf:'#4aa05a', leafDark:'#2f7a3a', trunk:'#8a6a42', trunkDark:'#5a4428' },
  { id:'mushroom',   name:'蘑菇树',   en:'Mushroom Tree',  shape:'mushroom',  height:32, trunkW:6, bare:false, leaf:'#a05a8a', leafDark:'#7a3a6a', trunk:'#d8c0a0', trunkDark:'#a89070', spot:'#f0d8e8' },
  { id:'mystic',     name:'神秘树',   en:'Mystic Tree',    shape:'mystic',    height:34, trunkW:4, bare:false, leaf:'#4aa0a0', leafDark:'#2f7a7a', trunk:'#3f3f5f', trunkDark:'#2a2a44', spark:'#a0f0e0' },
  { id:'mossy_oak',  name:'苔藓橡树', en:'Mossy Oak',      shape:'mossy',     height:33, trunkW:5, bare:false, leaf:'#4a8a4a', leafDark:'#2f6a2f', moss:'#7ab05a', trunk:'#6b4a2a', trunkDark:'#432c18' },
  { id:'mossy_pine', name:'苔藓松树', en:'Mossy Pine',     shape:'pine',      height:34, trunkW:4, bare:false, leaf:'#3f8a4a', leafDark:'#2a6a38', moss:'#6ab05a', trunk:'#5a3a22', trunkDark:'#382418' },
  { id:'greenrain',  name:'绿雨树',   en:'Green Rain Tree',shape:'greenrain', height:36, trunkW:3, bare:false, leaf:'#6ab04a', leafDark:'#3f7f2a', moss:'#8ac05a', trunk:'#5a4a2a', trunkDark:'#3a2f1c' }
];

export const FRUIT_TREES = [
  { id:'apple',       name:'苹果树', en:'Apple Tree',       shape:'apple',       height:33, trunkW:4, fruitSeason:'秋', fruit:'#d03a3a', leaf:'#3f9440', leafDark:'#2f6f2e', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'apricot',     name:'杏树',   en:'Apricot Tree',     shape:'apricot',     height:31, trunkW:3, fruitSeason:'春', fruit:'#f0a050', leaf:'#4a9a3a', leafDark:'#2f7028', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'cherry',      name:'樱桃树', en:'Cherry Tree',      shape:'cherry',      height:33, trunkW:4, fruitSeason:'春', fruit:'#d03a4a', leaf:'#3f9440', leafDark:'#2f6f2e', trunk:'#6b3a2a', trunkDark:'#452418' },
  { id:'orange',      name:'橙树',   en:'Orange Tree',      shape:'orange',      height:34, trunkW:4, fruitSeason:'夏', fruit:'#f0a02a', leaf:'#3f8f34', leafDark:'#2a6b28', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'peach',       name:'桃树',   en:'Peach Tree',       shape:'peach',       height:32, trunkW:4, fruitSeason:'夏', fruit:'#f0a0a0', leaf:'#4a9a3a', leafDark:'#2f7028', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'banana',      name:'香蕉树', en:'Banana Tree',      shape:'banana',      height:36, trunkW:4, fruitSeason:'夏', fruit:'#f0d04a', leaf:'#4aa05a', leafDark:'#2f7a3a', trunk:'#8a6a42', trunkDark:'#5a4428' },
  { id:'mango',       name:'芒果树', en:'Mango Tree',       shape:'mango',       height:34, trunkW:4, fruitSeason:'夏', fruit:'#f08a3a', leaf:'#3f9440', leafDark:'#2f6f2e', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'pomegranate', name:'石榴树', en:'Pomegranate Tree', shape:'pomegranate', height:33, trunkW:4, fruitSeason:'秋', fruit:'#b02a4a', leaf:'#2f7a3a', leafDark:'#1e5a28', trunk:'#6b3a2a', trunkDark:'#452418' }
];

export const TREES = [
  ...WILD_TREES.map(t => ({ ...t, type: 'wild' })),
  ...FRUIT_TREES.map(t => ({ ...t, type: 'fruit', bare: true }))
];

export const TREE_MAP = Object.fromEntries(TREES.map(t => [t.id, t]));

export function foliageOf(tree, season) {
  if (season === '冬' && tree.bare) return null;
  if (season === '秋' && tree.fallLeaf) return { leaf: tree.fallLeaf, dark: tree.fallLeafDark };
  return { leaf: tree.leaf, dark: tree.leafDark };
}

export function hasFruit(tree, season, stage) {
  return tree.type === 'fruit' && stage >= 4 && tree.fruitSeason === season;
}

/* ---------------- 树干 ---------------- */

function drawTrunk(g, t, top, k) {
  const tw = Math.max(2, Math.round((t.trunkW || 4) * (0.55 + k * 0.45)));
  const x = 24 - Math.floor(tw / 2);
  R(g, x, top, tw, TREE_BASE - top, t.trunk);
  R(g, x, top, 1, TREE_BASE - top, t.trunkDark);
  /* 根部外扩 */
  const flare = t.shape === 'oak' || t.shape === 'mahogany' ? 2 : 1;
  R(g, x - flare, TREE_BASE - 3, tw + flare * 2, 3, t.trunk);
  R(g, x - flare, TREE_BASE - 3, 1, 3, t.trunkDark);
  /* 分枝：枫树/果树在树冠里分叉，橡树主要靠宽冠区分 */
  if (t.shape === 'maple' || t.type === 'fruit') {
    line(g, 24, top + 9, 24 - Math.round(4 + k * 2), top + 3, t.trunk, 1);
    line(g, 24, top + 11, 24 + Math.round(4 + k * 2), top + 5, t.trunk, 1);
  } else {
    line(g, 24, top + 9, 24 - Math.round(4 + k * 3), top + 3, t.trunk, 1);
    line(g, 24, top + 13, 24 + Math.round(4 + k * 3), top + 7, t.trunk, 1);
  }
  /* 苔藓树干 */
  if (t.moss) {
    R(g, x + 1, TREE_BASE - 12, 2, 6, t.moss);
    R(g, x, TREE_BASE - 8, 1, 2, t.moss);
  }
}

/* ---------------- 野生树冠 ---------------- */

function drawOak(g, t, top, k, season, sway) {
  if (season === '冬' && t.bare) {
    drawBranches(g, t, top, k);
    R(g, 18, top + 3, 3, 1, '#e8f0f4');
    R(g, 27, top + 8, 2, 1, '#e8f0f4');
    return;
  }
  const r = 4 + k * 9;
  const cx = 24 + sway;
  const cy = top + 3;
  ellipse(g, cx, cy, r * 1.2, r * 0.8, t.leafDark);
  ellipse(g, cx - r * 0.55, cy - 2, r * 0.7, r * 0.55, t.leaf);
  ellipse(g, cx + r * 0.55, cy - 1, r * 0.65, r * 0.5, t.leaf);
  ellipse(g, cx, cy - r * 0.5, r * 0.65, r * 0.5, t.leafDark);
  R(g, Math.round(cx - r * 0.5), Math.round(cy - r * 0.55), 2, 2, t.leaf);

  /* 橡子：秋季挂在树冠下沿 */
  if (season === '秋' && k > 0.55) {
    for (let i = -1; i <= 1; i++) {
      const ax = Math.round(cx + i * 5);
      const ay = Math.round(cy + r * 0.65);
      R(g, ax, ay, 1, 2, '#8a5a2b');
      R(g, ax - 1, ay - 1, 3, 1, '#5c3a1c');
    }
  }
}

function drawMaple(g, t, top, k, season, sway) {
  if (season === '冬' && t.bare) {
    drawBranches(g, t, top, k);
    R(g, 17, top + 4, 3, 1, '#e8f0f4');
    R(g, 29, top + 9, 2, 1, '#e8f0f4');
    return;
  }
  const r = 4 + k * 9;
  const cx = 24 + sway;
  const cy = top + 1;
  const rx = r * 0.85;
  const ry = r * 1.05;

  /* 中心填充，叶团只负责做出五裂边缘 */
  ellipse(g, cx, cy, rx * 0.72, ry * 0.78, t.leafDark);
  ellipse(g, cx - 1, cy - 2, rx * 0.45, ry * 0.45, t.leaf);

  /* 五裂叶冠：五个独立叶团，中间留出缺口，和橡树的团状冠区分 */
  const lobes = [
    [0, -ry * 0.62, r * 0.55],
    [-rx * 0.78, -ry * 0.05, r * 0.44],
    [rx * 0.78, -ry * 0.05, r * 0.44],
    [-rx * 0.45, ry * 0.55, r * 0.4],
    [rx * 0.45, ry * 0.55, r * 0.4]
  ];
  for (const [dx, dy, lr] of lobes) {
    ellipse(g, cx + dx, cy + dy, lr, lr * 0.85, t.leafDark);
    ellipse(g, cx + dx - lr * 0.2, cy + dy - 2, lr * 0.65, lr * 0.55, t.leaf);
  }
  /* 叶尖 */
  for (const [dx, dy] of [[0, -ry], [-rx, -ry * 0.2], [rx, -ry * 0.2], [-rx * 0.6, ry * 0.85], [rx * 0.6, ry * 0.85]]) {
    R(g, Math.round(cx + dx), Math.round(cy + dy), 1, 2, t.leafDark);
  }
  R(g, Math.round(cx - 3), Math.round(cy - ry * 0.5), 2, 2, t.leaf);

  /* 夏季也保留几片偏红的叶子，远看就能和橡树区分 */
  if (season !== '秋') {
    const accent = '#c05a3a';
    R(g, Math.round(cx + rx * 0.55), Math.round(cy - ry * 0.45), 1, 1, accent);
    R(g, Math.round(cx - rx * 0.5), Math.round(cy + ry * 0.15), 1, 1, accent);
    R(g, Math.round(cx + rx * 0.25), Math.round(cy - ry * 0.7), 1, 1, accent);
  }

  if (season === '春') {
    /* 枫树种子（翅果） */
    R(g, Math.round(cx - 5), Math.round(cy + ry), 2, 1, '#d8c070');
    R(g, Math.round(cx + 3), Math.round(cy + ry + 1), 2, 1, '#d8c070');
  }
  if (season === '秋') {
    /* 飘落的红叶 */
    R(g, Math.round(cx - 10), Math.round(cy + ry + 3), 1, 1, t.leaf);
    R(g, Math.round(cx + 7), Math.round(cy + ry + 5), 2, 1, t.leafDark);
    R(g, Math.round(cx - 2), Math.round(cy + ry + 7), 1, 1, t.leaf);
  }
}

function drawMahogany(g, t, top, k, season, sway) {
  const r = 4 + k * 9;
  const cx = 24 + sway;
  const cy = top + 3;
  const rx = r * 0.65;
  const ry = r * 1.2;
  ellipse(g, cx, cy, rx, ry, t.leafDark);
  ellipse(g, cx - rx * 0.35, cy - 3, rx * 0.65, ry * 0.55, t.leaf);
  ellipse(g, cx + rx * 0.35, cy + 1, rx * 0.55, ry * 0.5, t.leaf);
  R(g, Math.round(cx - rx * 0.5), Math.round(cy - ry * 0.6), 2, 2, t.leaf);
  /* 竖向叶纹 */
  for (let i = -1; i <= 1; i++) {
    R(g, Math.round(cx + i * 3), Math.round(cy - ry * 0.5), 1, Math.round(ry * 0.9), t.leafDark);
  }
  /* 桃花心木荚果 */
  if (k > 0.6) {
    R(g, Math.round(cx - rx), Math.round(cy + ry - 4), 2, 4, '#7a3a22');
    R(g, Math.round(cx + rx - 1), Math.round(cy + ry - 2), 2, 3, '#5c2a18');
  }
}

function drawMossy(g, t, top, k, season, sway) {
  const r = 4 + k * 9;
  const cx = 24 + sway;
  const cy = top + 2;
  const rx = r * 1.3;
  const ry = r * 0.7;
  ellipse(g, cx, cy, rx, ry, t.leafDark);
  for (let i = -2; i <= 2; i++) {
    ellipse(g, cx + i * r * 0.45, cy - Math.abs(i) * 1.5, r * 0.45, r * 0.42, i % 2 ? t.leaf : t.leafDark);
  }
  R(g, Math.round(cx - rx * 0.45), Math.round(cy - ry * 0.5), 2, 1, t.leaf);
  /* 垂下的苔藓 */
  for (let i = 0; i < 5; i++) {
    const x = Math.round(cx - rx * 0.7 + i * rx * 0.35);
    const len = 4 + (i % 3) * 2;
    line(g, x, Math.round(cy + ry - 1), x + 1, Math.round(cy + ry + len), t.moss, 1);
    R(g, x + 1, Math.round(cy + ry + len), 1, 1, t.moss);
  }
  /* 树干苔藓 */
  R(g, 22, TREE_BASE - 10, 2, 4, t.moss);
}

function drawGreenRain(g, t, top, k, season, sway) {
  const r = 4 + k * 9;
  const cx = 24 + sway;
  const cy = top + 2;
  const rx = r * 0.62;
  const ry = r * 1.15;
  ellipse(g, cx, cy, rx, ry, t.leafDark);
  ellipse(g, cx - rx * 0.25, cy - 3, rx * 0.55, ry * 0.55, t.leaf);
  ellipse(g, cx + rx * 0.25, cy + 1, rx * 0.45, ry * 0.45, t.leaf);
  R(g, Math.round(cx - rx * 0.4), Math.round(cy - ry * 0.55), 2, 2, t.leaf);
  /* 下垂长藤 */
  for (let i = 0; i < 6; i++) {
    const x = Math.round(cx - rx * 0.9 + i * rx * 0.36);
    const len = 6 + (i % 4) * 2;
    line(g, x, Math.round(cy + ry - 2), x + 1, Math.round(cy + ry + len), t.moss, 1);
    R(g, x + 1, Math.round(cy + ry + len), 1, 1, '#c8f08a');
  }
  /* 飘落的绿雨 */
  R(g, Math.round(cx - rx - 4), Math.round(cy + 2), 1, 2, t.moss);
  R(g, Math.round(cx + rx + 3), Math.round(cy + 5), 1, 2, t.moss);
}

function drawPine(g, t, top, k, season, sway) {
  const cx = 24 + sway;
  const layers = 5;
  const span = Math.max(10, TREE_BASE - top);
  const step = Math.max(3.2, span * 0.23);
  for (let i = 0; i < layers; i++) {
    const y = Math.round(top - 1 + i * step);
    const half = Math.round(2 + i * (1.6 + k * 2.4));
    const color = i % 2 ? t.leaf : t.leafDark;
    for (let x = -half; x <= half; x++) {
      const hh = Math.max(1, Math.round((1 - Math.abs(x) / (half + 1)) * 5));
      R(g, cx + x, y, 1, hh, color);
    }
    if (season === '冬') R(g, cx - Math.round(half * 0.5), y, Math.round(half), 1, '#e8f0f4');
    if (t.moss) {
      R(g, cx + Math.round(half * 0.35), y + 2, 2, 2, t.moss);
      if (i >= 2) {
        const mx = cx - Math.round(half * 0.5);
        line(g, mx, y + 4, mx + 1, y + 7, t.moss, 1);
        R(g, mx + 1, y + 7, 1, 1, t.moss);
      }
    }
    if (i >= 2 && k > 0.55) {
      R(g, cx - half + 1, y + 2, 2, 2, '#6b4226');
      R(g, cx + half - 2, y + 3, 2, 2, '#5c3a1c');
    }
  }
}

function drawPalm(g, t, top, k, season, sway) {
  const cx = 24;
  const crownX = cx + sway;
  const crownY = top + 2;
  /* 弯曲树干 */
  line(g, cx, TREE_BASE, cx + sway * 0.4, (TREE_BASE + crownY) / 2, t.trunk, 3);
  line(g, cx + sway * 0.4, (TREE_BASE + crownY) / 2, crownX, crownY, t.trunk, 3);
  for (let i = 0; i < 5; i++) {
    R(g, cx + Math.round(sway * 0.2) - 1, TREE_BASE - 6 - i * 5, 3, 1, t.trunkDark);
  }
  /* 羽状叶 */
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.42;
    const len = 8 + k * 4;
    const ex = Math.round(crownX + Math.cos(a) * len);
    const ey = Math.round(crownY + Math.sin(a) * len + 2);
    line(g, crownX, crownY, ex, ey, i % 2 ? t.leaf : t.leafDark, 2);
    line(g, ex, ey, ex + Math.round(Math.cos(a) * 3), ey + 2, t.leafDark, 1);
  }
  /* 椰子 */
  R(g, crownX - 2, crownY + 2, 2, 2, '#7a4a2a');
  R(g, crownX + 1, crownY + 3, 2, 2, '#5c3a1c');
  if (season === '冬') R(g, crownX - 1, crownY - 1, 3, 1, '#e8f0f4');
}

function drawMushroom(g, t, top, k, season, sway) {
  const cx = 24 + sway;
  const cy = top + 2;
  const r = 5 + k * 9;
  /* 伞盖 */
  ellipse(g, cx, cy, r, r * 0.7, t.leaf);
  ellipse(g, cx - r * 0.3, cy - 2, r * 0.6, r * 0.45, t.leafDark);
  R(g, Math.round(cx - r * 0.6), Math.round(cy - r * 0.3), 2, 2, t.spot);
  R(g, Math.round(cx + r * 0.35), Math.round(cy - r * 0.1), 2, 2, t.spot);
  R(g, Math.round(cx - 1), Math.round(cy - r * 0.55), 2, 2, t.spot);
  /* 伞柄 */
  R(g, cx - 1, cy + 2, 3, Math.max(2, r * 0.55), t.trunkDark);
  /* 地上的小蘑菇 */
  if (k > 0.5) {
    ellipse(g, 12, TREE_BASE - 2, 3, 2, t.leaf);
    R(g, 11, TREE_BASE - 1, 1, 2, t.trunk);
    ellipse(g, 12, TREE_BASE - 3, 1, 1, t.spot);
  }
}

function drawMystic(g, t, top, k, season, sway) {
  const r = 4 + k * 9;
  const cx = 24 + sway;
  const cy = top + 2;
  const rx = r * 0.85;
  const ry = r * 1.0;
  /* 柔光 */
  g.globalAlpha = 0.16;
  ellipse(g, cx, cy, rx + 4, ry + 4, t.spark);
  g.globalAlpha = 1;
  ellipse(g, cx, cy, rx, ry, t.leafDark);
  ellipse(g, cx - rx * 0.3, cy - 2, rx * 0.65, ry * 0.55, t.leaf);
  ellipse(g, cx + rx * 0.35, cy + 1, rx * 0.5, ry * 0.45, t.leaf);
  R(g, Math.round(cx - rx * 0.4), Math.round(cy - ry * 0.5), 2, 2, t.spark);
  R(g, Math.round(cx + rx * 0.25), Math.round(cy - ry * 0.2), 1, 1, t.spark);
  R(g, Math.round(cx + rx * 0.1), Math.round(cy + ry * 0.55), 1, 1, t.spark);
  /* 树干发光纹 */
  R(g, 23, TREE_BASE - 8, 2, 2, t.spark);
}

/* ---------------- 果树冠 ---------------- */

function drawFruitCanopy(g, t, top, k, season, sway) {
  if (season === '冬') {
    drawBranches(g, t, top, k);
    R(g, 24 - 6, top + 2, 3, 1, '#e8f0f4');
    R(g, 24 + 4, top + 7, 2, 1, '#e8f0f4');
    return;
  }

  const r = 4 + k * 9;
  const cx = 24 + sway;
  const cy = top + 3;
  const shape = t.shape;

  if (shape === 'cherry') {
    /* 宽伞形 */
    ellipse(g, cx, cy, r * 1.3, r * 0.65, t.leafDark);
    ellipse(g, cx - r * 0.65, cy - 1, r * 0.75, r * 0.55, t.leaf);
    ellipse(g, cx + r * 0.6, cy - 1, r * 0.7, r * 0.5, t.leaf);
    ellipse(g, cx, cy - r * 0.3, r * 0.65, r * 0.45, t.leafDark);
  } else if (shape === 'peach') {
    /* 双瓣心形 */
    ellipse(g, cx - r * 0.45, cy, r * 0.75, r * 0.8, t.leafDark);
    ellipse(g, cx + r * 0.45, cy, r * 0.75, r * 0.8, t.leafDark);
    ellipse(g, cx - r * 0.35, cy - 2, r * 0.55, r * 0.55, t.leaf);
    ellipse(g, cx + r * 0.35, cy - 2, r * 0.55, r * 0.55, t.leaf);
    ellipse(g, cx, cy - r * 0.3, r * 0.55, r * 0.45, t.leafDark);
  } else if (shape === 'pomegranate') {
    /* 窄冠 */
    ellipse(g, cx, cy, r * 0.8, r * 1.05, t.leafDark);
    ellipse(g, cx - r * 0.3, cy - 2, r * 0.55, r * 0.6, t.leaf);
    ellipse(g, cx + r * 0.3, cy + 1, r * 0.45, r * 0.5, t.leaf);
    R(g, Math.round(cx - r * 0.35), Math.round(cy - r * 0.55), 2, 2, t.leaf);
  } else if (shape === 'apricot') {
    ellipse(g, cx, cy, r * 0.9, r * 0.8, t.leafDark);
    ellipse(g, cx - r * 0.3, cy - 2, r * 0.6, r * 0.5, t.leaf);
    ellipse(g, cx + r * 0.3, cy - 1, r * 0.5, r * 0.45, t.leaf);
  } else if (shape === 'orange') {
    ellipse(g, cx, cy, r * 1.1, r * 0.95, t.leafDark);
    ellipse(g, cx - r * 0.45, cy - 2, r * 0.65, r * 0.55, t.leaf);
    ellipse(g, cx + r * 0.45, cy - 1, r * 0.6, r * 0.5, t.leaf);
    ellipse(g, cx, cy - r * 0.4, r * 0.55, r * 0.45, t.leafDark);
  } else if (shape === 'mango') {
    /* 宽冠、平底 */
    ellipse(g, cx, cy + 1, r * 1.2, r * 0.72, t.leafDark);
    ellipse(g, cx - r * 0.6, cy - 2, r * 0.6, r * 0.5, t.leaf);
    ellipse(g, cx + r * 0.6, cy - 2, r * 0.6, r * 0.5, t.leaf);
    ellipse(g, cx, cy - r * 0.42, r * 0.5, r * 0.42, t.leafDark);
  } else if (shape === 'apple') {
    /* 圆冠 + 顶部双叶团，和芒果的宽平冠区分 */
    ellipse(g, cx - 3, cy - 2, r * 0.72, r * 0.78, t.leafDark);
    ellipse(g, cx + 3, cy - 2, r * 0.72, r * 0.78, t.leafDark);
    ellipse(g, cx, cy + 2, r * 1.05, r * 0.65, t.leafDark);
    ellipse(g, cx - 4, cy - 2, r * 0.45, r * 0.4, t.leaf);
    ellipse(g, cx + 4, cy - 2, r * 0.42, r * 0.38, t.leaf);
    ellipse(g, cx, cy + 1, r * 0.5, r * 0.4, t.leafDark);
  } else {
    /* 兜底：普通圆冠 */
    ellipse(g, cx, cy, r * 1.05, r * 0.88, t.leafDark);
    ellipse(g, cx - r * 0.45, cy - 2, r * 0.65, r * 0.55, t.leaf);
    ellipse(g, cx + r * 0.45, cy - 1, r * 0.6, r * 0.5, t.leaf);
    ellipse(g, cx, cy - r * 0.42, r * 0.55, r * 0.45, t.leafDark);
  }

  /* 春花 */
  if (season === '春' && k > 0.6) {
    const blossoms = shape === 'cherry' || shape === 'peach' ? 6 : 3;
    const bc = shape === 'pomegranate' ? '#e04a4a'
      : (shape === 'cherry' || shape === 'peach') ? '#f0c0d0' : '#f0e8d0';
    for (let i = 0; i < blossoms; i++) {
      const x = Math.round(cx - r * 0.8 + i * (r * 1.6 / Math.max(1, blossoms - 1)));
      const y = Math.round(cy - r * 0.2 + (i % 2) * 3);
      R(g, x, y, 1, 1, bc);
      R(g, x + 1, y, 1, 1, '#ffe0ec');
    }
  }

  if (hasFruit(t, season, Math.round(k * 4))) {
    drawFruit(g, t, cx, cy, r, sway);
    /* 落果 */
    ellipse(g, 14, TREE_BASE - 1, 1, 1, t.fruit);
    ellipse(g, 32, TREE_BASE - 1, 1, 1, t.fruit);
  }
}

function drawBranches(g, t, top, k) {
  const c = t.trunk;
  const d = t.trunkDark;
  line(g, 24, top + 12, 24 - 9 * k, top + 1, c, 2);
  line(g, 24, top + 12, 24 + 9 * k, top + 2, c, 2);
  line(g, 24 - 9 * k, top + 1, 24 - 13 * k, top - 4, d, 1);
  line(g, 24 + 9 * k, top + 2, 24 + 12 * k, top - 3, d, 1);
}

function drawFruit(g, t, cx, cy, r, sway) {
  const style = t.shape;
  const spots = style === 'cherry'
    ? [[-6, 1], [0, -2], [6, 0], [-3, 4]]
    : style === 'peach'
      ? [[-5, -1], [5, -1], [0, 3]]
      : style === 'pomegranate'
        ? [[-3, -2], [3, 1], [0, 4]]
        : [[-6, -1], [0, -3], [6, 0], [-3, 3], [3, 4]];

  for (const [dx, dy] of spots) {
    const x = Math.round(cx + dx * (r / 10));
    const y = Math.round(cy + dy * (r / 10));
    if (style === 'cherry') {
      /* 樱桃成对 */
      R(g, x, y, 1, 1, t.fruit);
      R(g, x + 1, y + 1, 1, 1, t.fruit);
      R(g, x, y - 1, 1, 1, t.leafDark);
    } else if (style === 'mango') {
      R(g, x - 1, y - 1, 3, 3, t.fruit);
      R(g, x - 1, y - 1, 1, 1, '#fff0a0');
    } else if (style === 'pomegranate') {
      R(g, x - 1, y - 1, 3, 3, t.fruit);
      R(g, x, y - 2, 1, 1, '#8a2a3a');
      R(g, x - 1, y - 1, 1, 1, '#f08090');
    } else {
      ellipse(g, x, y, 2, 2, t.fruit);
      R(g, x - 1, y - 2, 1, 1, '#ffffff');
    }
  }
}

function drawBanana(g, t, top, k, season, sway) {
  const cx = 24;
  const crownX = cx + sway;
  const crownY = top + 3;
  line(g, cx, TREE_BASE, cx + sway * 0.5, crownY, t.trunk, 3);
  for (let i = 0; i < 4; i++) R(g, cx + Math.round(sway * 0.2) - 1, TREE_BASE - 8 - i * 6, 3, 1, t.trunkDark);
  if (season === '冬') {
    for (let i = 0; i < 4; i++) {
      const ex = crownX + (i - 1.5) * 7;
      line(g, crownX, crownY, Math.round(ex), crownY + 8, '#8a7240', 1);
    }
    R(g, crownX - 3, crownY, 6, 1, '#e8f0f4');
    return;
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.4;
    const len = 9 + k * 4;
    const ex = Math.round(crownX + Math.cos(a) * len);
    const ey = Math.round(crownY + Math.sin(a) * len + 3);
    line(g, crownX, crownY, ex, ey, i % 2 ? t.leaf : t.leafDark, 3);
    line(g, crownX, crownY, ex, ey, '#8ac06a', 1);
  }
  /* 香蕉花苞：四季都有，和棕榈树区分 */
  R(g, crownX - 1, crownY + 4, 2, 3, '#7a3a6a');
  R(g, crownX, crownY + 7, 1, 1, '#a05a8a');
  /* 干枯叶裙 */
  for (let i = 0; i < 3; i++) {
    line(g, cx - 3 + i * 2, TREE_BASE - 9 - i * 3, cx - 6 + i * 2, TREE_BASE - 5 - i * 3, '#8a7240', 1);
  }
  if (hasFruit(t, season, Math.round(k * 4))) {
    /* 香蕉串 */
    R(g, crownX - 1, crownY + 4, 2, 4, t.fruit);
    R(g, crownX - 3, crownY + 6, 2, 3, t.fruit);
    R(g, crownX + 1, crownY + 6, 2, 3, t.fruit);
    R(g, crownX - 2, crownY + 4, 1, 1, '#fff0a0');
  }
}

/* ---------------- 主入口 ---------------- */

function drawSprout(g, t, k, sway) {
  const h = 2 + k * 5;
  line(g, 24, TREE_BASE, 24 + sway, TREE_BASE - h, t.trunkDark, 2);
  R(g, 22 + sway, TREE_BASE - h - 1, 5, 2, t.leaf);
  R(g, 21 + sway, TREE_BASE - h + 1, 2, 2, t.leafDark);
  R(g, 26 + sway, TREE_BASE - h + 1, 2, 2, t.leafDark);
}

export function drawTree(g, tree, stage, season = '春', phase = 0.25) {
  const t = typeof tree === 'string' ? TREE_MAP[tree] : tree;
  if (!t) return;
  const st = clamp(Math.round(stage), 0, 4);
  const k = st / 4;
  const sway = Math.round(Math.sin(phase * TAU) * (0.5 + k * 1.5));
  const h = 6 + k * ((t.height || 34) - 6);
  const top = TREE_BASE - h;

  g.save();
  g.imageSmoothingEnabled = false;
  ellipse(g, 24, TREE_BASE + 1, Math.round(7 + k * 6), 2, 'rgba(20, 26, 18, 0.3)');

  if (st === 0) {
    drawSprout(g, t, k, sway);
    g.restore();
    return;
  }

  const shape = t.shape;

  if (shape === 'palm') {
    drawPalm(g, t, top, k, season, sway);
  } else if (shape === 'banana') {
    drawBanana(g, t, top, k, season, sway);
  } else {
    drawTrunk(g, t, top, k);
    if (shape === 'pine') drawPine(g, t, top, k, season, sway);
    else if (shape === 'mushroom') drawMushroom(g, t, top, k, season, sway);
    else if (shape === 'mystic') drawMystic(g, t, top, k, season, sway);
    else if (shape === 'mossy') drawMossy(g, t, top, k, season, sway);
    else if (shape === 'greenrain') drawGreenRain(g, t, top, k, season, sway);
    else if (shape === 'mahogany') drawMahogany(g, t, top, k, season, sway);
    else if (shape === 'maple') drawMaple(g, t, top, k, season, sway);
    else if (shape === 'oak') drawOak(g, t, top, k, season, sway);
    else drawFruitCanopy(g, t, top, k, season, sway);
  }

  /* 冬季地面残雪 */
  if (season === '冬') {
    R(g, 15, TREE_BASE - 1, 5, 1, 'rgba(232, 240, 244, 0.7)');
    R(g, 27, TREE_BASE, 6, 1, 'rgba(232, 240, 244, 0.6)');
  }

  g.restore();
}
