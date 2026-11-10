/* 星露谷 UI 图标：状态、天气、时间、技能、菜单、增益，共 60 个。
 * 32×32 图标，程序化绘制。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const UI_W = 32;
export const UI_H = 32;

export const UI_GROUPS = [
  { id: 'all', name: '全部' },
  { id: 'status', name: '状态' },
  { id: 'weather', name: '天气' },
  { id: 'time', name: '时间' },
  { id: 'skill', name: '技能' },
  { id: 'menu', name: '菜单' },
  { id: 'buff', name: '增益' }
];

const C = {
  red:     ['#d04a3a', '#8a2a1a', '#f08a70'],
  green:   ['#5aa04a', '#3a6a2a', '#a0d080'],
  blue:    ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  gold:    ['#e0c060', '#a08020', '#fff0a0'],
  yellow:  ['#e8d050', '#b09020', '#fff8b0'],
  orange:  ['#e08a3a', '#a05a1a', '#f0c080'],
  purple:  ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  teal:    ['#4ac0b0', '#2a8070', '#a0f0e0'],
  pink:    ['#e08ab0', '#a04a70', '#ffc0d8'],
  silver:  ['#c8d0d8', '#7a8490', '#f0f4f8'],
  iridium: ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  dark:    ['#3a3a4a', '#1a1a2a', '#8a8aa0'],
  white:   ['#f0f0e8', '#b0b0a8', '#ffffff'],
  brown:   ['#8a5a3a', '#5a3418', '#c09060'],
  cyan:    ['#4ac0c0', '#2a7a7a', '#a0f0f0'],
  rainbow: ['#d04a6a', '#4a8ac0', '#f0e060']
};

const TRIMS = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0', '#e08a3a', '#4ac0c0'];

/* [id, 中文名, 英文名, 分组, 符号, 配色, 说明] */
const RAW = [
  ['health','生命','Health','status','heart','red','生命值'],
  ['energy','能量','Energy','status','bolt','green','体力值'],
  ['gold','金币','Gold','status','coin','gold','货币'],
  ['luck','幸运','Luck','status','clover','green','幸运值'],
  ['friendship','友谊','Friendship','status','friends','pink','好感度'],
  ['level','等级','Level','status','up','blue','等级提升'],
  ['star','星之果实','Stardrop','status','star','purple','最大能量'],
  ['silver_quality','银星','Silver Quality','status','quality','silver','银星品质'],
  ['gold_quality','金星','Gold Quality','status','quality','gold','金星品质'],
  ['iridium_quality','铱星','Iridium Quality','status','quality','iridium','铱星品质'],

  ['sun','晴天','Sunny','weather','sun','yellow','晴天'],
  ['rain','雨天','Rain','weather','rain','blue','雨天'],
  ['storm','雷雨','Storm','weather','storm','purple','雷雨'],
  ['snow','雪天','Snow','weather','snow','white','雪天'],
  ['wind','大风','Wind','weather','wind','teal','大风'],
  ['green_rain','绿雨','Green Rain','weather','greenrain','green','绿雨'],
  ['fog','雾','Fog','weather','fog','silver','雾天'],
  ['festival','节日','Festival','weather','festival','red','节日'],

  ['clock','时钟','Clock','time','clock','brown','时间'],
  ['day','白天','Day','time','sun','orange','白天'],
  ['night','夜晚','Night','time','moon','dark','夜晚'],
  ['spring','春','Spring','time','flower','green','春季'],
  ['summer','夏','Summer','time','sun','gold','夏季'],
  ['fall','秋','Fall','time','leaf','orange','秋季'],
  ['winter','冬','Winter','time','snow','cyan','冬季'],
  ['moon_phase','月相','Moon Phase','time','moon','silver','月相'],

  ['farming','耕种','Farming','skill','crop','green','耕种技能'],
  ['foraging','采集','Foraging','skill','leaf','teal','采集技能'],
  ['fishing','钓鱼','Fishing','skill','fish','blue','钓鱼技能'],
  ['mining','采矿','Mining','skill','pick','silver','采矿技能'],
  ['combat','战斗','Combat','skill','sword','red','战斗技能'],
  ['luck_skill','幸运','Luck Skill','skill','clover','gold','幸运技能'],

  ['backpack','背包','Backpack','menu','bag','brown','背包'],
  ['map','地图','Map','menu','map','green','地图'],
  ['quest','任务','Quests','menu','scroll','gold','任务'],
  ['journal','日志','Journal','menu','book','blue','日志'],
  ['settings','设置','Settings','menu','gear','silver','设置'],
  ['save','保存','Save','menu','disk','blue','保存'],
  ['exit','退出','Exit','menu','door','brown','退出'],
  ['shop','商店','Shop','menu','shop','gold','商店'],
  ['craft','制作','Crafting','menu','hammer','orange','制作'],
  ['bundle','收集包','Bundles','menu','bundle','green','收集包'],
  ['collections','收藏','Collections','menu','grid','purple','收藏'],
  ['skills','技能','Skills','menu','star','gold','技能'],
  ['social','社交','Social','menu','friends','pink','社交'],
  ['options','选项','Options','menu','sliders','silver','选项'],
  ['controller','手柄','Controller','menu','pad','dark','手柄'],
  ['pause','暂停','Pause','menu','pause','blue','暂停'],

  ['speed_buff','速度','Speed','buff','boot','orange','移动速度提升'],
  ['fishing_buff','钓鱼','Fishing','buff','fish','blue','钓鱼增益'],
  ['mining_buff','采矿','Mining','buff','pick','silver','采矿增益'],
  ['luck_buff','幸运','Luck','buff','clover','green','幸运增益'],
  ['defense_buff','防御','Defense','buff','shield','blue','防御提升'],
  ['attack_buff','攻击','Attack','buff','sword','red','攻击提升'],
  ['magnetism','磁力','Magnetism','buff','magnet','red','物品吸附范围'],
  ['glow','发光','Glow','buff','glow','yellow','照亮周围'],
  ['garlic','大蒜油','Oil of Garlic','buff','garlic','white','驱赶怪物'],
  ['monster_musk','怪物香水','Monster Musk','buff','musk','purple','吸引怪物'],
  ['life_elixir','生命药水','Life Elixir','buff','potion','red','恢复生命'],
  ['ginger_ale','姜汁汽水','Ginger Ale','buff','ginger','gold','临时增益']
];

function pal(key) {
  const c = C[key] || C.gold;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const UI_ICONS = RAW.map(([id, name, en, group, symbol, p, desc]) => ({
  id, name, en, group, symbol, desc, ...pal(p)
}));
export const UI_MAP = Object.fromEntries(UI_ICONS.map(i => [i.id, i]));

export function uiGroupName(g) {
  const x = UI_GROUPS.find(v => v.id === g);
  return x ? x.name : g;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------------- 基础形状 ---------------- */

function frame(g, it) {
  R(g, 3, 3, 26, 26, it.c2);
  R(g, 4, 4, 24, 24, '#1a1e26');
  R(g, 5, 5, 22, 2, it.c1);
  R(g, 5, 27, 22, 1, it.c2);
  R(g, 4, 4, 1, 24, it.c1);
  R(g, 27, 4, 1, 24, it.c2);
}

function heart(g, x, y, color, hi) {
  R(g, x - 4, y - 3, 3, 2, color);
  R(g, x + 2, y - 3, 3, 2, color);
  R(g, x - 4, y - 1, 9, 3, color);
  R(g, x - 3, y + 2, 7, 2, color);
  R(g, x - 1, y + 4, 3, 2, color);
  R(g, x - 3, y - 2, 2, 1, hi);
}

function symbol(g, it, x, y) {
  const s = it.symbol;
  if (s === 'heart') { heart(g, x, y, it.c1, it.c3); return; }
  if (s === 'bolt') {
    for (let i = 0; i < 5; i++) R(g, x + 1 - i, y - 5 + i * 2, 3, 2, it.c1);
    R(g, x - 2, y - 1, 5, 2, it.c3);
    return;
  }
  if (s === 'coin') {
    ellipse(g, x, y, 6, 6, it.c2);
    ellipse(g, x, y, 5, 5, it.c1);
    R(g, x - 1, y - 3, 2, 6, it.c3);
    return;
  }
  if (s === 'clover') {
    for (let i = 0; i < 4; i++) {
      const dx = i % 2 ? 3 : -3, dy = i < 2 ? -3 : 3;
      ellipse(g, x + dx, y + dy, 3, 3, it.c1);
    }
    R(g, x - 1, y - 1, 3, 3, it.c3);
    return;
  }
  if (s === 'friends') {
    heart(g, x - 2, y - 1, it.c1, it.c3);
    heart(g, x + 3, y + 2, it.c2, it.c3);
    return;
  }
  if (s === 'up') {
    for (let i = 0; i < 5; i++) R(g, x - 5 + i, y + 3 - i * 2, 11 - i * 2, 2, it.c1);
    R(g, x - 1, y - 5, 2, 11, it.c3);
    return;
  }
  if (s === 'star') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i / 5 * TAU;
      line(g, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, it.c1, 2);
    }
    R(g, x - 1, y - 1, 3, 3, it.c3);
    return;
  }
  if (s === 'quality') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i / 5 * TAU;
      line(g, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, it.c1, 2);
    }
    R(g, x - 2, y - 2, 5, 5, it.c2);
    R(g, x - 1, y - 1, 3, 3, it.c3);
    return;
  }
  if (s === 'sun') {
    ellipse(g, x, y, 6, 6, it.c1);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      line(g, x + Math.cos(a) * 8, y + Math.sin(a) * 8, x + Math.cos(a) * 11, y + Math.sin(a) * 11, it.c3, 2);
    }
    return;
  }
  if (s === 'rain' || s === 'storm' || s === 'fog' || s === 'greenrain') {
    ellipse(g, x - 2, y - 3, 7, 4, s === 'greenrain' ? it.c3 : it.c1);
    ellipse(g, x + 4, y - 1, 5, 4, s === 'greenrain' ? it.c2 : it.c1);
    for (let i = 0; i < 4; i++) line(g, x - 6 + i * 4, y + 3, x - 8 + i * 4, y + 9, s === 'greenrain' ? it.c3 : '#6ac0f0', 2);
    if (s === 'storm') line(g, x + 1, y - 1, x - 2, y + 6, '#f0e060', 2);
    if (s === 'fog') {
      for (let i = 0; i < 3; i++) R(g, x - 9, y - 6 + i * 5, 18, 2, it.c3);
    }
    return;
  }
  if (s === 'snow') {
    for (let i = 0; i < 3; i++) {
      line(g, x - 7, y, x + 7, y, it.c1, 1);
      line(g, x - 4, y - 5, x + 4, y + 5, it.c1, 1);
      line(g, x - 4, y + 5, x + 4, y - 5, it.c1, 1);
      break;
    }
    R(g, x - 1, y - 1, 3, 3, it.c3);
    return;
  }
  if (s === 'wind') {
    for (let i = 0; i < 3; i++) {
      line(g, x - 9, y - 4 + i * 5, x + 8, y - 4 + i * 5, it.c1, 1);
      line(g, x + 8, y - 4 + i * 5, x + 11, y - 6 + i * 5, it.c1, 1);
    }
    return;
  }
  if (s === 'festival') {
    R(g, x - 8, y - 6, 16, 3, it.c1);
    R(g, x - 8, y - 6, 16, 1, it.c3);
    for (let i = 0; i < 3; i++) R(g, x - 6 + i * 6, y - 3, 4, 8, i % 2 ? it.c1 : it.c3);
    return;
  }
  if (s === 'clock') {
    ellipse(g, x, y, 8, 8, it.c2);
    ellipse(g, x, y, 7, 7, '#f0e8d0');
    R(g, x - 1, y - 5, 2, 5, it.c1);
    R(g, x, y, 4, 2, it.c1);
    R(g, x - 1, y - 1, 2, 2, it.c2);
    return;
  }
  if (s === 'moon') {
    ellipse(g, x, y, 7, 7, it.c1);
    ellipse(g, x + 3, y - 1, 6, 6, '#1a1e26');
    R(g, x - 4, y - 4, 2, 2, it.c3);
    return;
  }
  if (s === 'flower') {
    R(g, x - 1, y + 1, 2, 7, '#3a6a2a');
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU - Math.PI / 2;
      ellipse(g, x + Math.cos(a) * 4, y - 2 + Math.sin(a) * 4, 3, 3, it.c1);
    }
    R(g, x - 1, y - 3, 2, 2, it.c3);
    return;
  }
  if (s === 'leaf') {
    ellipse(g, x, y, 7, 4, it.c1);
    R(g, x - 5, y - 3, 10, 2, it.c2);
    R(g, x - 1, y - 3, 1, 8, it.c3);
    R(g, x - 4, y + 1, 2, 2, it.c3);
    return;
  }
  if (s === 'fish') {
    ellipse(g, x - 1, y, 7, 4, it.c1);
    R(g, x + 5, y - 1, 4, 2, it.c2);
    R(g, x + 6, y - 2, 2, 2, it.c3);
    R(g, x - 2, y - 1, 2, 2, '#ffffff');
    return;
  }
  if (s === 'pick' || s === 'sword') {
    if (s === 'sword') {
      line(g, x - 6, y + 7, x + 5, y - 6, it.c1, 2);
      line(g, x - 5, y + 6, x + 5, y - 6, it.c3, 1);
      line(g, x - 7, y + 3, x - 2, y + 7, it.c2, 2);
      return;
    }
    line(g, x - 5, y + 7, x + 4, y - 3, '#8a5a2a', 2);
    line(g, x - 6, y - 5, x + 7, y - 1, it.c1, 3);
    R(g, x + 6, y - 2, 3, 4, it.c3);
    return;
  }
  if (s === 'bag') {
    R(g, x - 7, y - 5, 14, 12, it.c2);
    R(g, x - 6, y - 4, 12, 10, it.c1);
    R(g, x - 4, y - 7, 8, 3, it.c2);
    R(g, x - 4, y - 7, 8, 1, it.c3);
    R(g, x - 1, y - 1, 3, 2, it.c3);
    return;
  }
  if (s === 'map') {
    R(g, x - 8, y - 6, 16, 12, it.c2);
    R(g, x - 7, y - 5, 14, 10, it.c1);
    for (let i = 0; i < 4; i++) line(g, x - 6 + i * 4, y - 5, x - 2 + i * 4, y + 5, it.c2, 1);
    R(g, x + 1, y - 2, 3, 3, it.c3);
    return;
  }
  if (s === 'scroll' || s === 'book' || s === 'bundle') {
    if (s === 'book') {
      R(g, x - 7, y - 7, 14, 14, it.c2);
      R(g, x - 6, y - 6, 12, 12, it.c1);
      R(g, x - 5, y - 6, 2, 12, it.c3);
      for (let i = 0; i < 4; i++) R(g, x - 2, y - 3 + i * 2, 7, 1, it.c2);
      return;
    }
    R(g, x - 6, y - 7, 12, 14, it.c2);
    R(g, x - 5, y - 6, 10, 12, it.c1);
    for (let i = 0; i < 4; i++) R(g, x - 3, y - 3 + i * 2, 6, 1, it.c2);
    if (s === 'bundle') {
      R(g, x - 6, y - 1, 12, 2, '#8a5a3a');
      R(g, x - 1, y - 2, 2, 4, it.c3);
    }
    return;
  }
  if (s === 'gear') {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      R(g, x + Math.cos(a) * 8 - 1, y + Math.sin(a) * 8 - 1, 3, 3, it.c1);
    }
    ellipse(g, x, y, 7, 7, it.c1);
    ellipse(g, x, y, 3, 3, '#1a1e26');
    return;
  }
  if (s === 'disk') {
    R(g, x - 7, y - 7, 14, 14, it.c2);
    R(g, x - 6, y - 6, 12, 12, it.c1);
    R(g, x - 4, y - 4, 8, 5, it.c3);
    R(g, x - 4, y + 2, 8, 4, it.c2);
    return;
  }
  if (s === 'door' || s === 'pause') {
    if (s === 'pause') {
      R(g, x - 6, y - 7, 4, 14, it.c1);
      R(g, x + 2, y - 7, 4, 14, it.c1);
      return;
    }
    R(g, x - 6, y - 8, 12, 16, it.c1);
    R(g, x - 5, y - 7, 10, 14, it.c2);
    R(g, x + 2, y - 1, 2, 2, it.c3);
    return;
  }
  if (s === 'shop') {
    R(g, x - 8, y - 4, 16, 9, it.c2);
    R(g, x - 7, y - 3, 14, 7, it.c1);
    for (let i = 0; i < 5; i++) R(g, x - 7 + i * 3, y - 7, 2, 3, i % 2 ? it.c3 : it.c1);
    R(g, x - 2, y + 1, 4, 4, it.c3);
    return;
  }
  if (s === 'hammer') {
    line(g, x - 5, y + 7, x + 4, y - 4, '#8a5a2a', 3);
    R(g, x + 1, y - 7, 8, 4, it.c1);
    R(g, x + 2, y - 6, 6, 2, it.c3);
    return;
  }
  if (s === 'grid') {
    for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) R(g, x - 7 + xx * 5, y - 7 + yy * 5, 4, 4, (xx + yy) % 2 ? it.c1 : it.c2);
    return;
  }
  if (s === 'sliders') {
    for (let i = 0; i < 3; i++) {
      R(g, x - 8, y - 6 + i * 6, 16, 2, it.c2);
      R(g, x - 4 + i * 3, y - 7 + i * 6, 3, 4, it.c1);
    }
    return;
  }
  if (s === 'pad') {
    ellipse(g, x - 5, y, 6, 5, it.c1);
    ellipse(g, x + 5, y, 6, 5, it.c1);
    R(g, x - 8, y - 2, 4, 2, it.c2);
    R(g, x + 4, y - 2, 4, 2, it.c2);
    R(g, x - 6, y - 1, 2, 2, it.c3);
    R(g, x + 4, y - 1, 2, 2, it.c3);
    return;
  }
  if (s === 'shield') {
    R(g, x - 6, y - 6, 13, 9, it.c2);
    R(g, x - 5, y - 5, 11, 7, it.c1);
    R(g, x - 3, y - 3, 7, 2, it.c3);
    R(g, x - 2, y + 3, 4, 5, it.c2);
    return;
  }
  if (s === 'magnet') {
    R(g, x - 7, y - 5, 4, 9, it.c1);
    R(g, x + 3, y - 5, 4, 9, it.c1);
    R(g, x - 7, y + 4, 14, 3, it.c2);
    R(g, x - 7, y - 6, 4, 2, '#f0f0e8');
    R(g, x + 3, y - 6, 4, 2, '#f0f0e8');
    return;
  }
  if (s === 'glow') {
    ellipse(g, x, y, 8, 8, it.c2);
    ellipse(g, x, y, 6, 6, it.c1);
    ellipse(g, x, y, 3, 3, it.c3);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      R(g, x + Math.cos(a) * 10, y + Math.sin(a) * 10, 1, 1, it.c3);
    }
    return;
  }
  if (s === 'garlic') {
    ellipse(g, x, y + 1, 6, 7, it.c1);
    ellipse(g, x, y + 1, 5, 6, it.c3);
    R(g, x - 1, y - 8, 2, 5, '#5aa04a');
    R(g, x - 5, y + 2, 2, 3, it.c2);
    R(g, x + 3, y + 2, 2, 3, it.c2);
    return;
  }
  if (s === 'musk') {
    R(g, x - 6, y - 5, 13, 11, it.c2);
    R(g, x - 5, y - 4, 11, 9, it.c1);
    R(g, x - 2, y - 4, 5, 2, it.c3);
    R(g, x - 1, y + 1, 3, 3, '#1a1a1a');
    R(g, x - 8, y - 2, 2, 4, it.c2);
    return;
  }
  if (s === 'potion') {
    R(g, x - 4, y - 8, 8, 3, it.c2);
    R(g, x - 1, y - 5, 2, 4, it.c2);
    ellipse(g, x, y + 2, 7, 6, it.c2);
    ellipse(g, x, y + 2, 6, 5, it.c1);
    R(g, x - 2, y, 3, 2, it.c3);
    return;
  }
  if (s === 'ginger') {
    ellipse(g, x, y, 7, 5, it.c1);
    ellipse(g, x - 4, y - 3, 4, 3, it.c1);
    ellipse(g, x + 4, y - 2, 4, 3, it.c1);
    R(g, x - 1, y - 1, 3, 3, it.c3);
    return;
  }
}

export function drawUiIcon(g, icon, phase = 0.25) {
  const it = typeof icon === 'string' ? UI_MAP[icon] : icon;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  frame(g, it);
  symbol(g, it, 16, 16);
  const gc = {
    status: '#d04a3a',
    weather: '#4a8ac0',
    time: '#e0c060',
    skill: '#5aa04a',
    menu: '#8a5ac0',
    buff: '#4ac0b0'
  }[it.group] || '#e0c060';
  R(g, 6, 6, 4, 1, gc);
  R(g, 6, 6, 1, 4, gc);
  g.restore();
}
