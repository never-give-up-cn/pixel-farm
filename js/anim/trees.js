/* 星露谷树木像素图鉴：10 种野生树 + 8 种果树。
 * 每棵树画在 48×56 的格子里，地表基线 y=50；
 * 支持 5 个生长阶段、四季外观、果树结果季与冬季落叶。 */

import { R, line, ellipse, TAU, clamp } from './pixel.js';

export const TREE_W = 48;
export const TREE_H = 56;
export const TREE_BASE = 50;
export const TREE_STAGES = ['幼苗', '小树', '中树', '大树', '成熟'];
export const TREE_SEASONS = ['春', '夏', '秋', '冬'];

/* kind: oak / maple / pine / mahogany / palm / mushroom / mystic / mossy / greenrain / fruit */
export const WILD_TREES = [
  { id:'oak',        name:'橡树',     en:'Oak Tree',       kind:'oak',       bare:true,  leaf:'#5fae4a', leafDark:'#3f7f32', fallLeaf:'#d08a3a', fallLeafDark:'#a05a2a', trunk:'#8a5a2b', trunkDark:'#5c3a1c' },
  { id:'maple',      name:'枫树',     en:'Maple Tree',     kind:'maple',     bare:true,  leaf:'#6ab04a', leafDark:'#4a8a32', fallLeaf:'#d0503a', fallLeafDark:'#a02a2a', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'pine',       name:'松树',     en:'Pine Tree',      kind:'pine',      bare:false, leaf:'#2f7a3a', leafDark:'#1e5a28', trunk:'#6b4226', trunkDark:'#432a18' },
  { id:'mahogany',   name:'桃花心木', en:'Mahogany Tree',  kind:'mahogany',  bare:false, leaf:'#4a8a3a', leafDark:'#2f6a2a', trunk:'#6b3a22', trunkDark:'#452415' },
  { id:'palm',       name:'棕榈树',   en:'Palm Tree',      kind:'palm',      bare:false, leaf:'#4aa05a', leafDark:'#2f7a3a', trunk:'#8a6a42', trunkDark:'#5a4428' },
  { id:'mushroom',   name:'蘑菇树',   en:'Mushroom Tree',  kind:'mushroom',  bare:false, leaf:'#a05a8a', leafDark:'#7a3a6a', trunk:'#d8c0a0', trunkDark:'#a89070', spot:'#f0d8e8' },
  { id:'mystic',     name:'神秘树',   en:'Mystic Tree',    kind:'mystic',    bare:false, leaf:'#4aa0a0', leafDark:'#2f7a7a', trunk:'#4a4a6a', trunkDark:'#2f2f4a', spark:'#a0f0e0' },
  { id:'mossy_oak',  name:'苔藓橡树', en:'Mossy Oak',      kind:'mossy',     bare:false, leaf:'#4a8a4a', leafDark:'#2f6a2f', moss:'#7ab05a', trunk:'#6b4a2a', trunkDark:'#432c18' },
  { id:'mossy_pine', name:'苔藓松树', en:'Mossy Pine',     kind:'pine',      bare:false, leaf:'#2f7a3a', leafDark:'#1e5a28', moss:'#5aa04a', trunk:'#5a3a22', trunkDark:'#382418' },
  { id:'greenrain',  name:'绿雨树',   en:'Green Rain Tree',kind:'greenrain', bare:false, leaf:'#6ab04a', leafDark:'#3f7f2a', moss:'#8ac05a', trunk:'#5a4a2a', trunkDark:'#3a2f1c' }
];

export const FRUIT_TREES = [
  { id:'apple',       name:'苹果树', en:'Apple Tree',       kind:'fruit', fruitSeason:'秋', fruit:'#d03a3a', leaf:'#3f9440', leafDark:'#2f6f2e', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'apricot',     name:'杏树',   en:'Apricot Tree',     kind:'fruit', fruitSeason:'春', fruit:'#f0a050', leaf:'#4a9a3a', leafDark:'#2f7028', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'cherry',      name:'樱桃树', en:'Cherry Tree',      kind:'fruit', fruitSeason:'春', fruit:'#d03a4a', leaf:'#3f9440', leafDark:'#2f6f2e', trunk:'#6b3a2a', trunkDark:'#452418' },
  { id:'orange',      name:'橙树',   en:'Orange Tree',      kind:'fruit', fruitSeason:'夏', fruit:'#f0a02a', leaf:'#3f8f34', leafDark:'#2a6b28', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'peach',       name:'桃树',   en:'Peach Tree',       kind:'fruit', fruitSeason:'夏', fruit:'#f0a0a0', leaf:'#4a9a3a', leafDark:'#2f7028', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'banana',      name:'香蕉树', en:'Banana Tree',      kind:'fruit', fruitSeason:'夏', fruit:'#f0d04a', leaf:'#4aa05a', leafDark:'#2f7a3a', trunk:'#8a6a42', trunkDark:'#5a4428' },
  { id:'mango',       name:'芒果树', en:'Mango Tree',       kind:'fruit', fruitSeason:'夏', fruit:'#f08a3a', leaf:'#3f9440', leafDark:'#2f6f2e', trunk:'#7a4a2a', trunkDark:'#4f2f1a' },
  { id:'pomegranate', name:'石榴树', en:'Pomegranate Tree', kind:'fruit', fruitSeason:'秋', fruit:'#b02a4a', leaf:'#2f7a3a', leafDark:'#1e5a28', trunk:'#6b3a2a', trunkDark:'#452418' }
];

export const TREES = [
  ...WILD_TREES.map(t => ({ ...t, type: 'wild' })),
  ...FRUIT_TREES.map(t => ({ ...t, type: 'fruit', bare: true }))
];

export const TREE_MAP = Object.fromEntries(TREES.map(t => [t.id, t]));

/* 当前季节的叶色；冬季落叶树返回 null */
export function foliageOf(tree, season) {
  if (season === '冬' && tree.bare) return null;
  if (season === '秋' && tree.fallLeaf) return { leaf: tree.fallLeaf, dark: tree.fallLeafDark };
  return { leaf: tree.leaf, dark: tree.leafDark };
}

export function hasFruit(tree, season, stage) {
  return tree.type === 'fruit' && stage >= 4 && tree.fruitSeason === season;
}

function drawSprout(g, tree, t, sway) {
  const h = 2 + t * 5;
  line(g, 24, TREE_BASE, 24 + sway, TREE_BASE - h, tree.trunkDark, 2);
  R(g, 22 + sway, TREE_BASE - h - 1, 5, 2, tree.leaf);
  R(g, 21 + sway, TREE_BASE - h + 1, 2, 2, tree.leafDark);
  R(g, 26 + sway, TREE_BASE - h + 1, 2, 2, tree.leafDark);
}

function drawBranches(g, tree, top, t, cycle) {
  const c = tree.trunk;
  const d = tree.trunkDark;
  line(g, 24, top + 12, 24 - 9 * t, top + 1, c, 2);
  line(g, 24, top + 12, 24 + 9 * t, top + 2, c, 2);
  line(g, 24 - 9 * t, top + 1, 24 - 13 * t, top - 4, d, 1);
  line(g, 24 + 9 * t, top + 2, 24 + 12 * t, top - 3, d, 1);
  if (cycle) {
    R(g, 24 - 13 * t, top - 4, 1, 2, d);
    R(g, 24 + 12 * t, top - 3, 1, 2, d);
  }
}

function drawCanopy(g, tree, top, t, season, sway) {
  const f = foliageOf(tree, season);
  if (!f) {
    drawBranches(g, tree, top, t, true);
    /* 冬季树挂一点残雪 */
    R(g, 24 - 7, top + 1, 3, 1, '#e8f0f4');
    R(g, 24 + 5, top + 4, 2, 1, '#e8f0f4');
    return;
  }

  const r = 4 + t * 10;
  const cx = 24 + sway;
  const cy = top + 2;

  ellipse(g, cx, cy, r, r * 0.85, f.dark);
  ellipse(g, cx - r * 0.42, cy - 2, r * 0.72, r * 0.6, f.leaf);
  ellipse(g, cx + r * 0.42, cy - 1, r * 0.62, r * 0.55, f.leaf);
  ellipse(g, cx, cy - r * 0.32, r * 0.58, r * 0.48, f.dark);
  R(g, Math.round(cx - r * 0.5), Math.round(cy - r * 0.45), 2, 2, f.leaf);

  if (tree.kind === 'mossy' || tree.kind === 'greenrain') {
    for (let i = 0; i < 4; i++) {
      const x = Math.round(cx - r * 0.7 + i * r * 0.45);
      line(g, x, cy + 2, x + 1, cy + 6 + (i % 2), tree.moss, 1);
    }
  }
  if (tree.kind === 'mystic') {
    R(g, Math.round(cx - r * 0.5), Math.round(cy - r * 0.2), 1, 1, tree.spark);
    R(g, Math.round(cx + r * 0.2), Math.round(cy - r * 0.6), 2, 1, tree.spark);
    R(g, Math.round(cx + r * 0.4), Math.round(cy + r * 0.2), 1, 1, tree.spark);
  }
}

function drawPine(g, tree, top, t, season, sway) {
  const cx = 24 + sway;
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const y = Math.round(top + 2 + i * (6 + t * 2));
    const half = Math.round(4 + i * (2 + t * 1.5));
    const color = i % 2 ? tree.leaf : tree.leafDark;
    for (let x = -half; x <= half; x++) {
      const hh = Math.max(1, Math.round((1 - Math.abs(x) / (half + 1)) * 4));
      R(g, cx + x, y, 1, hh, color);
    }
    if (season === '冬') R(g, cx - Math.round(half * 0.5), y, Math.round(half), 1, '#e8f0f4');
    if (tree.moss) R(g, cx + Math.round(half * 0.3), y + 2, 2, 2, tree.moss);
  }
}

function drawPalm(g, tree, top, t, season, sway) {
  const cx = 24;
  line(g, cx, TREE_BASE, cx + sway, top + 4, tree.trunk, 3);
  for (let i = 0; i < 4; i++) {
    R(g, cx - 1 + (i % 2), top + 8 + i * 6, 3, 1, tree.trunkDark);
  }
  const fx = cx + sway;
  const fy = top + 2;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55;
    const len = 8 + t * 2;
    const ex = Math.round(fx + Math.cos(a) * len);
    const ey = Math.round(fy + Math.sin(a) * len + 2);
    line(g, fx, fy, ex, ey, i % 2 ? tree.leaf : tree.leafDark, 2);
    line(g, ex, ey, ex + Math.round(Math.cos(a) * 3), ey + 2, tree.leafDark, 1);
  }
  R(g, fx - 2, fy - 1, 4, 3, tree.leafDark);
  if (season === '冬') R(g, fx - 2, fy, 4, 1, '#e8f0f4');
}

function drawMushroomTree(g, tree, top, t, season, sway) {
  const cx = 24 + sway;
  const cy = top + 2;
  const r = 5 + t * 9;
  ellipse(g, cx, cy, r, r * 0.7, tree.leaf);
  ellipse(g, cx - r * 0.3, cy - 1, r * 0.55, r * 0.45, tree.leafDark);
  R(g, cx - 1, cy + 1, 2, Math.max(2, r * 0.6), tree.trunkDark);
  R(g, cx - r * 0.6, cy - r * 0.35, 2, 2, tree.spot);
  R(g, cx + r * 0.35, cy - r * 0.15, 2, 2, tree.spot);
  R(g, cx - 1, cy - r * 0.55, 2, 2, tree.spot);
}

function drawTreeFruit(g, tree, top, t, season, sway) {
  if (!hasFruit(tree, season, t * 4)) return;
  if (season === '冬') return;
  const cx = 24 + sway;
  const cy = top + 2;
  const r = 4 + t * 10;
  const spots = [-7, -3, 1, 5, -5, 2];
  for (let i = 0; i < spots.length; i++) {
    const x = Math.round(cx + spots[i] * (r / 12));
    const y = Math.round(cy - r * 0.35 + (i % 3) * r * 0.28);
    ellipse(g, x, y, 2, 2, tree.fruit);
    R(g, x - 1, y - 2, 1, 1, '#ffffff');
    R(g, x, y - 3, 1, 1, tree.leafDark);
  }
}

export function drawTree(g, tree, stage, season = '春', phase = 0.25) {
  const t = typeof tree === 'string' ? TREE_MAP[tree] : tree;
  if (!t) return;
  const st = clamp(Math.round(stage), 0, 4);
  const k = st / 4;
  const sway = Math.round(Math.sin(phase * TAU) * (0.5 + k * 1.5));
  const h = 6 + k * 30;
  const top = TREE_BASE - h;

  g.save();
  g.imageSmoothingEnabled = false;

  /* 草影 */
  ellipse(g, 24, TREE_BASE + 1, Math.round(7 + k * 6), 2, 'rgba(20, 26, 18, 0.3)');

  if (st === 0) {
    drawSprout(g, t, k, sway);
    g.restore();
    return;
  }

  /* 树干 */
  const tw = 2 + Math.round(k * 2);
  R(g, 24 - Math.floor(tw / 2), top, tw, h, t.trunk);
  R(g, 24 - Math.floor(tw / 2), top, 1, h, t.trunkDark);
  line(g, 24, top + h * 0.45, 24 - 5 * k, top + h * 0.18, t.trunk, 1);
  line(g, 24, top + h * 0.55, 24 + 5 * k, top + h * 0.3, t.trunk, 1);

  if (t.kind === 'pine') drawPine(g, t, top, k, season, sway);
  else if (t.kind === 'palm') drawPalm(g, t, top, k, season, sway);
  else if (t.kind === 'mushroom') drawMushroomTree(g, t, top, k, season, sway);
  else drawCanopy(g, t, top, k, season, sway);

  if (t.type === 'fruit') drawTreeFruit(g, t, top, k, season, sway);

  /* 冬季地面残雪 */
  if (season === '冬') {
    R(g, 16, TREE_BASE - 1, 5, 1, 'rgba(232, 240, 244, 0.7)');
    R(g, 27, TREE_BASE, 6, 1, 'rgba(232, 240, 244, 0.6)');
  }

  g.restore();
}

export { TAU };
