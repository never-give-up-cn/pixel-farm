/* 星露谷物语全作物像素图鉴（50 种）。
 * 数据来源：Stardew Valley 1.6 作物表（stardewpedia / 官方 Wiki 对照），
 * 一项 = 作物，days = 成熟需要的天数；一帧 = 一天，day 从 1 到 days。
 * 绘制在 32×40 格子里，地表基线 y=34，只依赖 ./pixel.js。 */

import { R, line, ellipse, TAU, clamp } from './pixel.js';

export const CROP_W = 32;
export const CROP_H = 40;
export const CROP_BASE = 34;

/* 50 种作物。season 可包含多个季节；special = 不属于单一季节的特殊作物。
 * produce.shape 决定果实形态，size 是成熟时的半径（像素）。 */
export const CROPS = [
  // ---------- 春 ----------
  { id:'blue_jazz',      name:'蓝调爵士', en:'Blue Jazz',      season:'春',   days:7,  regrow:0, kind:'flower', leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'flower', c1:'#4a7ad0', c2:'#8ab0f0', size:4, petals:6 } },
  { id:'carrot',         name:'胡萝卜',   en:'Carrot',         season:'春',   days:3,  regrow:0, kind:'root',   leaf:'#4a9a3a', leafDark:'#2f7028', produce:{ shape:'long',   c1:'#e8893c', c2:'#f4b060', size:3 } },
  { id:'cauliflower',    name:'花椰菜',   en:'Cauliflower',    season:'春',   days:12, regrow:0, kind:'leafy',  leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'head',   c1:'#f0ead0', c2:'#fff6e0', size:5 } },
  { id:'coffee_bean',    name:'咖啡豆',   en:'Coffee Bean',    season:'春夏', days:10, regrow:2, kind:'bush',   leaf:'#2f6f3a', leafDark:'#1e4f28', produce:{ shape:'berry',  c1:'#b03a2a', c2:'#e05a3a', size:2 } },
  { id:'garlic',         name:'大蒜',     en:'Garlic',         season:'春',   days:4,  regrow:0, kind:'root',   leaf:'#6aa84f', leafDark:'#3f7a2a', produce:{ shape:'bulb',   c1:'#f0ead8', c2:'#d8cfb8', size:3 } },
  { id:'green_bean',     name:'青豆',     en:'Green Bean',     season:'春',   days:10, regrow:3, kind:'pod',    leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'pod',    c1:'#5fae4a', c2:'#8ad06a', size:3 }, trellis:true },
  { id:'kale',           name:'羽衣甘蓝', en:'Kale',           season:'春',   days:6,  regrow:0, kind:'leafy',  leaf:'#2f7a3a', leafDark:'#1e5a28', produce:{ shape:'frilly', c1:'#3f9440', c2:'#5fae4a', size:5 } },
  { id:'parsnip',        name:'防风草',   en:'Parsnip',        season:'春',   days:4,  regrow:0, kind:'root',   leaf:'#6aa84f', leafDark:'#3f7a2a', produce:{ shape:'long',   c1:'#e8d8a0', c2:'#f4e8c0', size:3 } },
  { id:'potato',         name:'土豆',     en:'Potato',         season:'春',   days:6,  regrow:0, kind:'tuber',  leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'tuber',  c1:'#b98a4b', c2:'#d8b07a', size:2 } },
  { id:'rhubarb',        name:'大黄',     en:'Rhubarb',        season:'春',   days:13, regrow:0, kind:'leafy',  leaf:'#4aa03c', leafDark:'#2f7a2a', produce:{ shape:'stalk',  c1:'#c04a3a', c2:'#e07a5a', size:3 } },
  { id:'strawberry',     name:'草莓',     en:'Strawberry',     season:'春',   days:8,  regrow:4, kind:'bush',   leaf:'#3f9440', leafDark:'#2a702c', produce:{ shape:'berry',  c1:'#e0403a', c2:'#f07060', size:2 } },
  { id:'tulip',          name:'郁金香',   en:'Tulip',          season:'春',   days:6,  regrow:0, kind:'flower', leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'tulip',  c1:'#d94a5a', c2:'#f2d06b', size:4, petals:4 } },
  { id:'unmilled_rice',  name:'未碾米',   en:'Unmilled Rice',  season:'春',   days:8,  regrow:0, kind:'grain',  leaf:'#6a9a3a', leafDark:'#4a7a2a', produce:{ shape:'grain',  c1:'#e0c46a', c2:'#f0e0a0', size:2 } },
  { id:'wild_horseradish',name:'野山葵',  en:'Wild Horseradish',season:'春',  days:7,  regrow:0, kind:'root',   leaf:'#4a9a3a', leafDark:'#2f7028', produce:{ shape:'long',   c1:'#e8dcc0', c2:'#fff0e0', size:2 } },

  // ---------- 夏 ----------
  { id:'blueberry',      name:'蓝莓',     en:'Blueberry',      season:'夏',   days:13, regrow:4, kind:'bush',   leaf:'#2f6f3a', leafDark:'#1e4f28', produce:{ shape:'berry',  c1:'#3a5ab0', c2:'#6a8ae0', size:2 } },
  { id:'hops',           name:'啤酒花',   en:'Hops',           season:'夏',   days:11, regrow:1, kind:'vine',   leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'cone',   c1:'#8ab04a', c2:'#c8d870', size:3 }, trellis:true },
  { id:'hot_pepper',     name:'辣椒',     en:'Hot Pepper',     season:'夏',   days:5,  regrow:3, kind:'vine',   leaf:'#2f8f34', leafDark:'#226b28', produce:{ shape:'long',   c1:'#d93a2a', c2:'#f06a4a', size:3 } },
  { id:'melon',          name:'甜瓜',     en:'Melon',          season:'夏',   days:12, regrow:0, kind:'gourd',  leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'melon',  c1:'#6ab04a', c2:'#a8d878', size:6 } },
  { id:'pineapple',      name:'菠萝',     en:'Pineapple',      season:'夏',   days:14, regrow:7, kind:'tree',   leaf:'#3f8f4a', leafDark:'#2a6f32', produce:{ shape:'pine',   c1:'#e0a83a', c2:'#f2d06a', size:6 } },
  { id:'poppy',          name:'虞美人',   en:'Poppy',          season:'夏',   days:7,  regrow:0, kind:'flower', leaf:'#4a9a3a', leafDark:'#2f7028', produce:{ shape:'flower', c1:'#e04a3a', c2:'#f2d06b', size:4, petals:4 } },
  { id:'radish',         name:'萝卜',     en:'Radish',         season:'夏',   days:6,  regrow:0, kind:'root',   leaf:'#4aa03c', leafDark:'#2f7a2a', produce:{ shape:'long',   c1:'#e0556b', c2:'#f08a9a', size:3 } },
  { id:'red_cabbage',    name:'红甘蓝',   en:'Red Cabbage',    season:'夏',   days:9,  regrow:0, kind:'leafy',  leaf:'#6a3a7a', leafDark:'#4a2858', produce:{ shape:'head',   c1:'#8a4a9a', c2:'#c07ac0', size:5 } },
  { id:'spice_berry',    name:'香料浆果', en:'Spice Berry',    season:'夏',   days:7,  regrow:0, kind:'bush',   leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'berry',  c1:'#e07a3a', c2:'#f0a060', size:2 } },
  { id:'starfruit',      name:'杨桃',     en:'Starfruit',      season:'夏',   days:13, regrow:0, kind:'tree',   leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'star',   c1:'#f2c84a', c2:'#fff0a0', size:5 } },
  { id:'summer_spangle', name:'夏日亮片', en:'Summer Spangle', season:'夏',   days:8,  regrow:0, kind:'flower', leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'flower', c1:'#e8a03a', c2:'#f2d06b', size:4, petals:8 } },
  { id:'summer_squash',  name:'夏南瓜',   en:'Summer Squash',  season:'夏',   days:6,  regrow:3, kind:'gourd',  leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'squash', c1:'#e8d04a', c2:'#f4e88a', size:5 } },
  { id:'taro_root',      name:'芋头',     en:'Taro Root',      season:'夏',   days:10, regrow:0, kind:'tuber',  leaf:'#2f7a3a', leafDark:'#1e5a28', produce:{ shape:'tuber',  c1:'#8a6a4a', c2:'#b08a6a', size:3 } },
  { id:'tomato',         name:'番茄',     en:'Tomato',         season:'夏',   days:11, regrow:4, kind:'vine',   leaf:'#2f8f34', leafDark:'#226b28', produce:{ shape:'round',  c1:'#e03a24', c2:'#f06a4a', size:3 } },
  { id:'corn',           name:'玉米',     en:'Corn',           season:'夏秋', days:14, regrow:4, kind:'tall',   leaf:'#4a9a3a', leafDark:'#327a2a', produce:{ shape:'cob',    c1:'#f0c040', c2:'#fff0a0', size:3 } },
  { id:'sunflower',      name:'向日葵',   en:'Sunflower',      season:'夏秋', days:8,  regrow:0, kind:'tall',   leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'bloom',  c1:'#f2c84a', c2:'#6b4226', size:6, petals:8 } },
  { id:'wheat',          name:'小麦',     en:'Wheat',          season:'夏秋', days:4,  regrow:0, kind:'grain',  leaf:'#7aa03c', leafDark:'#5a7a2a', produce:{ shape:'grain',  c1:'#e0b84a', c2:'#f2d880', size:2 } },

  // ---------- 秋 ----------
  { id:'amaranth',       name:'苋菜',     en:'Amaranth',       season:'秋',   days:7,  regrow:0, kind:'grain',  leaf:'#8a3a6a', leafDark:'#5a2848', produce:{ shape:'plume',  c1:'#a03a6a', c2:'#d05a8a', size:4 } },
  { id:'artichoke',      name:'洋蓟',     en:'Artichoke',      season:'秋',   days:8,  regrow:0, kind:'leafy',  leaf:'#4a8a4a', leafDark:'#2f6a2f', produce:{ shape:'head',   c1:'#5a9a5a', c2:'#8ac08a', size:5 } },
  { id:'beet',           name:'甜菜',     en:'Beet',           season:'秋',   days:6,  regrow:0, kind:'root',   leaf:'#4a9a3a', leafDark:'#2f7028', produce:{ shape:'round',  c1:'#a02a3a', c2:'#d04a5a', size:3 } },
  { id:'bok_choy',       name:'小白菜',   en:'Bok Choy',       season:'秋',   days:4,  regrow:0, kind:'leafy',  leaf:'#3f9440', leafDark:'#2c6f2e', produce:{ shape:'head',   c1:'#e8f0d0', c2:'#5fae4a', size:5 } },
  { id:'broccoli',       name:'西兰花',   en:'Broccoli',       season:'秋',   days:8,  regrow:4, kind:'leafy',  leaf:'#2f7a3a', leafDark:'#1e5a28', produce:{ shape:'bumpy',  c1:'#3f8a3a', c2:'#5fae4a', size:5 } },
  { id:'common_mushroom',name:'普通蘑菇', en:'Common Mushroom',season:'秋',   days:7,  regrow:0, kind:'mushroom', leaf:'#8a6a4a', leafDark:'#5a4028', produce:{ shape:'cap',    c1:'#a87a4a', c2:'#d0a06a', size:4 } },
  { id:'cranberries',    name:'蔓越莓',   en:'Cranberries',    season:'秋',   days:7,  regrow:5, kind:'bush',   leaf:'#2f6f3a', leafDark:'#1e4f28', produce:{ shape:'berry',  c1:'#c02a3a', c2:'#e05a4a', size:2 } },
  { id:'eggplant',       name:'茄子',     en:'Eggplant',       season:'秋',   days:5,  regrow:5, kind:'bush',   leaf:'#3f7a3a', leafDark:'#2a5a28', produce:{ shape:'long',   c1:'#6a3a8a', c2:'#9a6ab0', size:4 } },
  { id:'fairy_rose',     name:'仙女玫瑰', en:'Fairy Rose',     season:'秋',   days:12, regrow:0, kind:'flower', leaf:'#4a9a3a', leafDark:'#2f7028', produce:{ shape:'flower', c1:'#e07aa0', c2:'#f2c06a', size:4, petals:8 } },
  { id:'grape',          name:'葡萄',     en:'Grape',          season:'秋',   days:10, regrow:3, kind:'vine',   leaf:'#3f8a3a', leafDark:'#2a6a28', produce:{ shape:'cluster',c1:'#6a3a9a', c2:'#9a6ac0', size:3 }, trellis:true },
  { id:'pumpkin',        name:'南瓜',     en:'Pumpkin',        season:'秋',   days:13, regrow:0, kind:'gourd',  leaf:'#3a8c32', leafDark:'#286b24', produce:{ shape:'pumpkin',c1:'#e07a1f', c2:'#f0a84a', size:6 } },
  { id:'sweet_gem_berry',name:'甜宝石浆果',en:'Sweet Gem Berry',season:'秋',  days:24, regrow:0, kind:'tree',   leaf:'#3f8a3a', leafDark:'#2a6a28', produce:{ shape:'gem',    c1:'#c02a3a', c2:'#f05a6a', size:5 } },
  { id:'yam',            name:'山药',     en:'Yam',            season:'秋',   days:10, regrow:0, kind:'tuber',  leaf:'#4a8a3a', leafDark:'#2f6a2a', produce:{ shape:'tuber',  c1:'#b07a4a', c2:'#d0a06a', size:3 } },

  // ---------- 冬 ----------
  { id:'powdermelon',    name:'霜瓜',     en:'Powdermelon',    season:'冬',   days:7,  regrow:0, kind:'gourd',  leaf:'#4a7a8a', leafDark:'#2f5a6a', produce:{ shape:'melon',  c1:'#a8d0e0', c2:'#e0f4ff', size:6 } },
  { id:'winter_root',    name:'冬根',     en:'Winter Root',    season:'冬',   days:7,  regrow:0, kind:'root',   leaf:'#5a8a5a', leafDark:'#3a6a3a', produce:{ shape:'round',  c1:'#e8f0f0', c2:'#ffffff', size:3 } },

  // ---------- 特殊 / 全季节 ----------
  { id:'ancient_fruit',  name:'上古水果', en:'Ancient Fruit',  season:'春夏秋',days:28,regrow:7, kind:'tree',   leaf:'#3f7a4a', leafDark:'#2a5a32', produce:{ shape:'round',  c1:'#6a3a9a', c2:'#a06ac0', size:5 }, special:true },
  { id:'cactus_fruit',   name:'仙人掌果', en:'Cactus Fruit',   season:'全年', days:12, regrow:3, kind:'tree',   leaf:'#4a8a3a', leafDark:'#2f6a28', produce:{ shape:'cactus', c1:'#d04a7a', c2:'#f08aa0', size:4 }, special:true, indoorOnly:true },
  { id:'fiber',          name:'纤维',     en:'Fiber',          season:'全年', days:7,  regrow:0, kind:'fiber',  leaf:'#5fae4a', leafDark:'#3f7f32', produce:{ shape:'grass',  c1:'#5fae4a', c2:'#8ad06a', size:0 }, special:true },
  { id:'qi_fruit',       name:'齐瓜',     en:'Qi Fruit',       season:'全年', days:4,  regrow:0, kind:'bush',   leaf:'#2f6f3a', leafDark:'#1e4f28', produce:{ shape:'round',  c1:'#3a8ad0', c2:'#7ac0f0', size:4 }, special:true }
];

export const CROP_MAP = Object.fromEntries(CROPS.map(c => [c.id, c]));

export const CROP_SEASONS = ['全部', '春', '夏', '秋', '冬', '特殊'];

/* 星露谷换季规则：
 * - 每个季节第 1 天，新季节不在作物的生长季节表里的植株会枯萎（包括成熟可收的）。
 * - 多季作物只有在新季节仍属于其生长季节时才会继续生长，官方列出的多季作物：
 *   上古水果、咖啡豆、玉米、向日葵、小麦。
 * - 仙人掌果虽然数据上是全季节，但 1.6 只能在温室 / 姜岛 / 室内花盆种植，不参与农场换季。
 * - 纤维、齐瓜属于特殊全年作物，这里按“换季存活”处理并单独标注。 */
export const SEASONS = ['春', '夏', '秋', '冬'];
export const MULTI_SEASON_IDS = ['ancient_fruit', 'coffee_bean', 'corn', 'sunflower', 'wheat'];

export function nextSeason(season) {
  const i = SEASONS.indexOf(season);
  return SEASONS[(i + 1) % SEASONS.length];
}

export function firstSeason(crop) {
  for (const s of SEASONS) if (crop.season.includes(s)) return s;
  return '春';
}

export function cropSurvivesSeason(crop, season) {
  if (crop.season.includes('全年')) return true;
  return crop.season.includes(season);
}

/* 通用枯萎帧：所有作物共用，换季时新季节不在生长季节表里就画这一帧。 */
export function drawWithered(g) {
  g.save();
  g.imageSmoothingEnabled = false;

  /* 土堆 */
  ellipse(g, 16, CROP_BASE + 1, 6, 2, 'rgba(74, 52, 30, 0.4)');
  R(g, 11, CROP_BASE, 10, 1, '#6b4a2b');
  R(g, 13, CROP_BASE - 1, 2, 1, '#8a6238');

  /* 弯折的枯茎 */
  line(g, 16, CROP_BASE, 12, CROP_BASE - 5, '#7a6234', 2);
  line(g, 12, CROP_BASE - 5, 16, CROP_BASE - 11, '#8a7240', 2);
  R(g, 15, CROP_BASE - 12, 2, 2, '#6b5730');

  /* 下垂的枯叶 */
  line(g, 12, CROP_BASE - 5, 8, CROP_BASE - 2, '#9c8340', 2);
  line(g, 12, CROP_BASE - 6, 7, CROP_BASE - 7, '#a8913f', 1);
  line(g, 14, CROP_BASE - 8, 18, CROP_BASE - 4, '#9c8340', 2);
  line(g, 15, CROP_BASE - 10, 20, CROP_BASE - 11, '#a8913f', 1);
  R(g, 7, CROP_BASE - 3, 2, 1, '#8a7240');
  R(g, 19, CROP_BASE - 3, 2, 1, '#8a7240');

  /* 干枯顶芽 */
  R(g, 15, CROP_BASE - 14, 3, 2, '#7a6234');
  R(g, 14, CROP_BASE - 15, 1, 1, '#9c8340');

  g.restore();
}

export function cropMatchesSeason(crop, filter) {
  if (filter === '全部') return true;
  if (filter === '特殊') return !!crop.special;
  if (crop.season.includes('全年')) return true;
  return crop.season.includes(filter);
}

/* ---------------- 绘制工具 ---------------- */

function swayOf(phase, grow) {
  return Math.round(Math.sin(phase * TAU) * (0.5 + grow * 1.2));
}

function leaf(g, x, y, dir, len, color, dark) {
  for (let i = 0; i < len; i++) {
    R(g, x + dir * i, y + (i > len - 2 ? -1 : 0), 1, 2, color);
  }
  R(g, x + dir * (len - 1), y - 1, 1, 1, dark);
}

function bloom(g, x, y, r, c1, c2, petals) {
  const n = Math.max(4, petals || 6);
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;
    const px = Math.round(x + Math.cos(a) * r);
    const py = Math.round(y + Math.sin(a) * r * 0.8);
    R(g, px - 1, py - 1, 2, 2, c1);
  }
  ellipse(g, x, y, Math.max(1, r - 2), Math.max(1, r - 2), c2);
  R(g, Math.round(x) - 1, Math.round(y) - 1, 1, 1, '#3a2414');
}

/* 通用果实 / 果实形态，r 为当前半径 */
function fruit(g, shape, x, y, r, c1, c2) {
  r = Math.max(1, r);
  x = Math.round(x);
  y = Math.round(y);
  switch (shape) {
    case 'round':
      ellipse(g, x, y, r, Math.max(1, r * 0.9), c1);
      R(g, x - Math.round(r * 0.5), y - Math.round(r * 0.6), 2, 2, c2);
      break;
    case 'long':
      ellipse(g, x, y, Math.max(1, r * 0.65), r * 1.15, c1);
      R(g, x - 1, y - Math.round(r * 0.8), 1, 2, c2);
      break;
    case 'berry':
      ellipse(g, x, y, r, r, c1);
      R(g, x - 1, y - 1, 1, 1, c2);
      R(g, x, y - r - 1, 2, 1, '#3f7f32');
      break;
    case 'cluster':
      ellipse(g, x - 2, y + 1, r * 0.75, r * 0.7, c1);
      ellipse(g, x + 2, y + 1, r * 0.75, r * 0.7, c1);
      ellipse(g, x, y - 2, r * 0.75, r * 0.7, c1);
      R(g, x - 1, y - 4, 1, 1, c2);
      break;
    case 'cone':
      for (let i = 0; i < 3; i++) {
        ellipse(g, x, y - i * 2, r - i, Math.max(1, r - i - 1), i % 2 ? c2 : c1);
      }
      break;
    case 'pod':
      ellipse(g, x, y, Math.max(1, r * 0.5), r * 1.2, c1);
      R(g, x - 1, y - 1, 1, 2, c2);
      R(g, x, y + 1, 1, 1, c2);
      break;
    case 'star': {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 ? r * 0.45 : r;
        pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
      }
      for (let i = 0; i < 10; i++) {
        const p = pts[i], q = pts[(i + 1) % 10];
        line(g, p.x, p.y, q.x, q.y, c1, 2);
      }
      ellipse(g, x, y, Math.max(1, r * 0.4), Math.max(1, r * 0.4), c2);
      break;
    }
    case 'gem':
      R(g, x - 1, y - r, 3, 2, c2);
      for (let i = 0; i < r * 2; i++) {
        const w = Math.max(1, Math.round((1 - Math.abs(i - r) / r) * r));
        R(g, x - w, y - r + 2 + i, w * 2 + 1, 1, i < r ? c1 : c2);
      }
      R(g, x - 1, y - r + 2, 1, r, '#ffffff');
      break;
    case 'melon':
      ellipse(g, x, y, r, Math.max(1, r * 0.85), c1);
      R(g, x - 2, y - r + 2, 1, r * 2 - 3, c2);
      R(g, x + 2, y - r + 2, 1, r * 2 - 3, c2);
      R(g, x - 3, y - r + 3, 2, 2, '#ffffff');
      break;
    case 'pumpkin':
      ellipse(g, x, y, r, Math.max(1, r * 0.8), c1);
      R(g, x - 1, y - r + 1, 1, r * 2 - 2, 'rgba(0,0,0,0.18)');
      R(g, x + 2, y - r + 2, 1, r * 2 - 3, 'rgba(0,0,0,0.14)');
      R(g, x - 3, y - r + 2, 2, 2, c2);
      R(g, x, y - r - 1, 1, 2, '#3f7f32');
      break;
    case 'squash':
      ellipse(g, x, y, Math.max(1, r * 0.8), r * 1.1, c1);
      R(g, x - 1, y - r, 1, 3, c2);
      break;
    case 'head':
      ellipse(g, x, y, r, Math.max(1, r * 0.85), c1);
      ellipse(g, x, y - 1, Math.max(1, r - 2), Math.max(1, r - 3), c2);
      break;
    case 'bumpy':
      ellipse(g, x, y, r, Math.max(1, r * 0.8), c1);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * TAU;
        ellipse(g, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.4, 1, 1, c2);
      }
      break;
    case 'frilly':
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ellipse(g, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.5, 2, 1, i % 2 ? c1 : c2);
      }
      break;
    case 'stalk':
      R(g, x - 1, y - r, 2, r * 2, c1);
      R(g, x - 1, y - r, 1, 2, c2);
      break;
    case 'cob':
      ellipse(g, x, y, Math.max(1, r * 0.8), r * 1.25, c1);
      for (let i = -1; i <= 1; i++) R(g, x + i * 2, y - r + 1, 1, r * 2 - 2, c2);
      break;
    case 'cap':
      ellipse(g, x, y, r, Math.max(1, r * 0.7), c1);
      R(g, x - 1, y - Math.round(r * 0.6), 2, 1, c2);
      R(g, x - 1, y + 1, 3, Math.max(2, r), '#e8dcc0');
      break;
    case 'plume':
      for (let i = 0; i < 4; i++) {
        R(g, x - 2 + (i % 2), y - r + i * 2, 4, 2, i % 2 ? c2 : c1);
      }
      R(g, x, y - r - 1, 1, 2, c2);
      break;
    case 'grain':
      R(g, x - 1, y - r, 2, r * 2, c1);
      for (let i = 0; i < Math.max(2, r); i++) {
        R(g, x - 2, y - r + i * 2, 1, 1, c2);
        R(g, x + 1, y - r + i * 2 + 1, 1, 1, c2);
      }
      break;
    case 'bulb':
      ellipse(g, x, y, r, Math.max(1, r * 0.8), c1);
      R(g, x - 1, y - r, 1, r * 2, c2);
      R(g, x + 1, y - r + 1, 1, r * 2 - 2, c2);
      R(g, x, y - r - 1, 1, 2, '#5fae4a');
      break;
    case 'tuber':
      for (let i = 0; i < 3; i++) {
        ellipse(g, x - 4 + i * 4, y + (i % 2), 2, 1, i % 2 ? c2 : c1);
      }
      break;
    case 'pine':
      ellipse(g, x, y, Math.max(1, r * 0.75), r * 1.05, c1);
      for (let i = -1; i <= 1; i++) R(g, x + i * 2, y - r + 2, 1, r * 2 - 4, c2);
      for (let i = 0; i < 5; i++) {
        const dx = i - 2;
        R(g, x + dx, y - r - 3 + Math.abs(dx), 1, 4, '#3f8f4a');
      }
      break;
    default:
      ellipse(g, x, y, r, r, c1);
  }
}

/* ---------------- 各生长形态 ---------------- */

function drawRoot(g, p, grow, ps, sway) {
  const h = 3 + grow * 9;
  const top = CROP_BASE - h;
  line(g, 16, CROP_BASE, 16 + sway, top, p.leafDark, 2);
  const n = 3 + Math.floor(grow * 3);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55;
    const len = 3 + grow * 4;
    const ex = Math.round(16 + sway + Math.cos(a) * len);
    const ey = Math.round(top + 2 + Math.sin(a) * len);
    line(g, 16 + sway, top + 2, ex, ey, i % 2 ? p.leaf : p.leafDark, 2);
    R(g, ex - 1, ey - 1, 2, 2, p.leaf);
  }
  R(g, 15 + sway, top, 4, 2, p.leaf);

  if (ps > 0) {
    const r = p.produce.size * ps;
    fruit(g, p.produce.shape, 16, CROP_BASE - 1, Math.max(1, r), p.produce.c1, p.produce.c2);
  }
}

function drawLeafy(g, p, grow, ps, sway) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    const len = 3 + grow * 5;
    const x = Math.round(16 + Math.cos(a) * (2 + grow * 2));
    const y = CROP_BASE - 2 + Math.round(Math.sin(a) * 1);
    leaf(g, x, y, Math.cos(a) < 0 ? -1 : 1, len, i % 2 ? p.leaf : p.leafDark, p.leafDark);
  }
  if (p.produce.shape === 'stalk') {
    R(g, 13, CROP_BASE - 6 - grow * 4, 2, 6 + grow * 4, p.produce.c1);
    R(g, 17, CROP_BASE - 5 - grow * 4, 2, 5 + grow * 4, p.produce.c2);
  }
  const r = (p.produce.size - 1) * ps + 1;
  if (ps > 0) {
    fruit(g, p.produce.shape, 16, CROP_BASE - 5, r, p.produce.c1, p.produce.c2);
  } else {
    R(g, 15, CROP_BASE - 6 - grow * 2, 2, 2, p.leaf);
  }
}

function drawTuber(g, p, grow, ps, sway) {
  const h = 3 + grow * 7;
  const top = CROP_BASE - h;
  line(g, 16, CROP_BASE, 16 + sway, top, p.leafDark, 2);
  for (let i = 0; i < 2 + Math.floor(grow * 3); i++) {
    const dir = i % 2 ? 1 : -1;
    const y = top + 2 + i * 2;
    if (y > CROP_BASE - 2) continue;
    leaf(g, 16 + sway + dir, y, dir, 3 + grow * 2, i % 2 ? p.leaf : p.leafDark, p.leafDark);
  }
  R(g, 15 + sway, top, 4, 2, p.leaf);
  if (ps > 0) {
    fruit(g, p.produce.shape, 16, CROP_BASE - 1, p.produce.size * ps + 1, p.produce.c1, p.produce.c2);
  }
}

function drawBush(g, p, grow, ps, sway) {
  const r = 3 + grow * 4;
  ellipse(g, 16, CROP_BASE - 5, r, Math.max(2, r - 2), p.leafDark);
  ellipse(g, 14, CROP_BASE - 7, r - 1, Math.max(2, r - 3), p.leaf);
  ellipse(g, 19, CROP_BASE - 6, r - 2, Math.max(2, r - 3), p.leafDark);
  R(g, 15, CROP_BASE - 10 + sway, 2, 1, p.leaf);

  if (p.produce.shape === 'long') {
    if (ps > 0) fruit(g, 'long', 21, CROP_BASE - 7, p.produce.size * ps, p.produce.c1, p.produce.c2);
    return;
  }
  if (ps > 0) {
    const n = 3 + Math.floor(ps * 3);
    for (let i = 0; i < n; i++) {
      const dx = -5 + (i % 3) * 5;
      const dy = -5 - Math.floor(i / 3) * 5 + (i % 2);
      fruit(g, p.produce.shape, 16 + dx, CROP_BASE + dy, p.produce.size * (0.6 + ps * 0.4), p.produce.c1, p.produce.c2);
    }
  }
}

function drawVine(g, p, grow, ps, sway) {
  const h = 8 + grow * 16;
  const top = CROP_BASE - h;
  if (p.trellis) {
    line(g, 22, CROP_BASE, 22, top - 2, '#8a5a2b', 1);
    line(g, 21, top, 23, top, '#6b421f', 1);
  }
  line(g, 16, CROP_BASE, 16 + sway, top + 2, p.leafDark, 2);
  for (let i = 0; i < 3 + Math.floor(grow * 3); i++) {
    const dir = i % 2 ? 1 : -1;
    const y = top + 4 + i * 2;
    if (y > CROP_BASE - 3) continue;
    leaf(g, 16 + sway + dir, y, dir, 3 + grow * 2, i % 2 ? p.leaf : p.leafDark, p.leafDark);
  }
  R(g, 15 + sway, top, 4, 2, p.leaf);

  if (ps > 0) {
    const r = Math.max(1, p.produce.size * ps);
    const spots = [-4, 4, 0];
    const n = p.produce.shape === 'cluster' ? 1 : 2 + (ps > 0.8 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const fx = 16 + (p.produce.shape === 'cluster' ? 0 : spots[i % 3]);
      const fy = top + 6 + i * 5;
      line(g, 16 + sway, fy - 3, fx, fy - 1, p.leafDark, 1);
      fruit(g, p.produce.shape, fx, fy, r, p.produce.c1, p.produce.c2);
    }
  }
}

function drawPod(g, p, grow, ps, sway) {
  const h = 7 + grow * 11;
  const top = CROP_BASE - h;
  line(g, 22, CROP_BASE, 22, top, '#8a5a2b', 1);
  line(g, 16, CROP_BASE, 16 + sway, top + 2, p.leafDark, 2);
  for (let i = 0; i < 5; i++) {
    const dir = i % 2 ? 1 : -1;
    const y = top + 2 + i * 3;
    if (y > CROP_BASE - 3) continue;
    leaf(g, 16 + sway + dir, y, dir, 4, i % 2 ? p.leaf : p.leafDark, p.leafDark);
  }
  if (ps > 0) {
    for (let i = 0; i < 3; i++) {
      const x = 11 + i * 5;
      const y = top + 7 + (i % 2) * 3;
      line(g, 16 + sway, y - 2, x, y - 1, p.leafDark, 1);
      fruit(g, 'pod', x, y, p.produce.size * ps, p.produce.c1, p.produce.c2);
    }
  }
}

function drawTall(g, p, grow, ps, sway) {
  const h = 7 + grow * 23;
  const top = CROP_BASE - h;
  line(g, 16, CROP_BASE, 16 + sway, top, p.leafDark, 3);
  for (let i = 0; i < 4; i++) {
    const dir = i % 2 ? 1 : -1;
    const y = top + 6 + i * 5;
    if (y > CROP_BASE - 4) continue;
    line(g, 16 + sway, y, 16 + sway + dir * (4 + grow * 3), y + (dir > 0 ? 2 : -1), i % 2 ? p.leaf : p.leafDark, 2);
  }

  if (p.produce.shape === 'cob') {
    if (ps > 0) {
      const r = Math.max(1, p.produce.size * ps);
      for (let i = 0; i < 2; i++) {
        const x = 16 + sway + (i ? 3 : -3);
        const y = top + 12 + i * 6;
        fruit(g, 'cob', x, y, r, p.produce.c1, p.produce.c2);
      }
    }
    return;
  }

  /* 向日葵 */
  if (ps > 0) {
    const r = 1 + p.produce.size * ps * 0.55;
    const cy = top + 2;
    bloom(g, 16 + sway, cy, r, p.produce.c1, p.produce.c2, p.produce.petals);
    ellipse(g, 16 + sway, cy, Math.max(1, r - 3), Math.max(1, r - 3), p.produce.c2);
    R(g, 15 + sway, cy - 1, 1, 1, '#3a2414');
  } else {
    ellipse(g, 16 + sway, top, 2, 2, p.leaf);
  }
}

function drawGourd(g, p, grow, ps, sway) {
  for (let i = 0; i < 4; i++) {
    const dir = i % 2 ? 1 : -1;
    const x = 16 + dir * (2 + i * 2);
    const y = CROP_BASE - 3 - (i % 2);
    ellipse(g, x, y, 3 + grow * 2, 1 + Math.round(grow), i % 2 ? p.leaf : p.leafDark);
  }
  line(g, 16, CROP_BASE, 16 + sway, CROP_BASE - 4 - grow * 4, p.leafDark, 2);
  if (ps > 0) {
    const r = 1 + p.produce.size * ps * 0.85;
    fruit(g, p.produce.shape, 16, CROP_BASE - r + 1, r, p.produce.c1, p.produce.c2);
  }
}

function drawFlower(g, p, grow, ps, sway) {
  const h = 4 + grow * 19;
  const top = CROP_BASE - h;
  line(g, 16, CROP_BASE, 16 + sway, top, p.leafDark, 2);
  for (let i = 0; i < 2 + Math.floor(grow * 2); i++) {
    const dir = i % 2 ? 1 : -1;
    const y = top + 5 + i * 3;
    if (y > CROP_BASE - 3) continue;
    leaf(g, 16 + sway + dir, y, dir, 4, i % 2 ? p.leaf : p.leafDark, p.leafDark);
  }
  if (ps > 0) {
    const r = 1 + p.produce.size * ps * 0.8;
    if (p.produce.shape === 'tulip') {
      for (let i = -1; i <= 1; i++) {
        R(g, 16 + sway + i * 2 - 1, top - 2, 2, 4, i === 0 ? p.produce.c2 : p.produce.c1);
      }
      R(g, 15 + sway, top + 1, 3, 1, p.leafDark);
    } else {
      bloom(g, 16 + sway, top, r, p.produce.c1, p.produce.c2, p.produce.petals);
    }
  } else {
    ellipse(g, 16 + sway, top, 1, 2, p.produce.c1);
  }
}

function drawGrain(g, p, grow, ps, sway) {
  const h = 4 + grow * 21;
  const n = 5;
  for (let i = 0; i < n; i++) {
    const off = i - (n - 1) / 2;
    const baseX = 16 + Math.round(off);
    const tipX = 16 + Math.round(off * 1.3 + Math.sin(i * 1.7) * 0.5);
    line(g, baseX, CROP_BASE, tipX, CROP_BASE - h, i % 2 ? p.leaf : p.leafDark, 1);
    if (ps > 0) {
      const r = Math.max(1, p.produce.size * ps);
      fruit(g, p.produce.shape, tipX, CROP_BASE - h - r + 1, r, p.produce.c1, p.produce.c2);
    }
  }
}

function drawTree(g, p, grow, ps, sway) {
  const shape = p.produce.shape;

  if (shape === 'pine') {
    /* 菠萝：从中心长出的放射叶 + 果体 */
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.35;
      const len = 5 + grow * 6;
      line(g, 16, CROP_BASE - 2, 16 + Math.cos(a) * len, CROP_BASE - 2 + Math.sin(a) * len, i % 2 ? p.leaf : p.leafDark, 2);
    }
    if (ps > 0) {
      fruit(g, 'pine', 16, CROP_BASE - 4, 2 + p.produce.size * ps * 0.8, p.produce.c1, p.produce.c2);
    }
    return;
  }

  if (shape === 'cactus') {
    R(g, 13, CROP_BASE - 8 - grow * 8, 6, 8 + grow * 8, p.leafDark);
    R(g, 14, CROP_BASE - 8 - grow * 8, 2, 8 + grow * 8, p.leaf);
    R(g, 11, CROP_BASE - 6 - grow * 4, 3, 5, p.leaf);
    if (ps > 0) {
      fruit(g, 'round', 17, CROP_BASE - 8 - grow * 6, 1 + p.produce.size * ps * 0.7, p.produce.c1, p.produce.c2);
      R(g, 17, CROP_BASE - 9 - grow * 6, 1, 1, p.produce.c2);
    }
    return;
  }

  const h = 6 + grow * 8;
  line(g, 16, CROP_BASE, 16 + sway, CROP_BASE - h, '#8a5a2b', 2);
  const r = 4 + grow * 3;
  ellipse(g, 16 + sway, CROP_BASE - h - 2, r, Math.max(2, r - 1), p.leafDark);
  ellipse(g, 14 + sway, CROP_BASE - h - 4, r - 1, Math.max(2, r - 2), p.leaf);
  ellipse(g, 19 + sway, CROP_BASE - h - 3, r - 2, Math.max(2, r - 2), p.leafDark);

  if (ps > 0) {
    fruit(g, shape, 16 + sway, CROP_BASE - h - 4, 1 + p.produce.size * ps * 0.8, p.produce.c1, p.produce.c2);
  }
}

function drawMushroom(g, p, grow, ps, sway) {
  const h = 3 + grow * 5;
  const top = CROP_BASE - h;
  line(g, 16, CROP_BASE, 16 + sway, top, '#e8dcc0', 3);
  if (ps > 0) {
    fruit(g, 'cap', 16 + sway, top, 2 + p.produce.size * ps * 0.7, p.produce.c1, p.produce.c2);
    fruit(g, 'cap', 10, CROP_BASE - 1, 1 + p.produce.size * ps * 0.45, p.produce.c1, p.produce.c2);
  } else {
    ellipse(g, 16, top, 2, 1, p.leaf);
  }
}

function drawFiber(g, p, grow, ps, sway) {
  const h = 3 + grow * 14;
  for (let i = 0; i < 7; i++) {
    const off = i - 3;
    const tipX = 16 + off * 2 + Math.round(Math.sin(i * 1.3) * 2);
    line(g, 16 + off, CROP_BASE, tipX, CROP_BASE - h + Math.abs(off), i % 2 ? p.leaf : p.leafDark, 1);
  }
}

const DRAWERS = {
  root: drawRoot,
  leafy: drawLeafy,
  tuber: drawTuber,
  bush: drawBush,
  vine: drawVine,
  pod: drawPod,
  tall: drawTall,
  gourd: drawGourd,
  flower: drawFlower,
  grain: drawGrain,
  tree: drawTree,
  mushroom: drawMushroom,
  fiber: drawFiber
};

/* 绘制一株作物：day = 第几天（1..crop.days），phase = 摆动相位 0~1 */
export function drawCrop(g, crop, day, phase = 0.25) {
  const c = typeof crop === 'string' ? CROP_MAP[crop] : crop;
  if (!c) return;

  const d = clamp(Math.round(day), 1, c.days);
  const t = d / c.days;
  const grow = Math.pow(t, 0.8);
  const ps = clamp((t - 0.45) / 0.55, 0, 1);
  const sway = swayOf(phase, grow);

  g.save();
  g.imageSmoothingEnabled = false;

  /* 土堆 */
  ellipse(g, 16, CROP_BASE + 1, 5 + Math.round(grow * 4), 2, 'rgba(74, 52, 30, 0.4)');
  R(g, 11, CROP_BASE, 10, 1, '#6b4a2b');
  R(g, 13, CROP_BASE - 1, 2, 1, '#8a6238');

  const draw = DRAWERS[c.kind];
  if (draw) draw(g, c, grow, ps, sway);

  g.restore();
}
