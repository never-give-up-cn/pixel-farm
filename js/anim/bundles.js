/* 星露谷社区中心收集包：6 个房间、30 个收集包。
 * 32×32 卷轴图标；面板显示所需物品与奖励。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const BUNDLE_W = 32;
export const BUNDLE_H = 32;

export const BUNDLE_ROOMS = [
  { id: 'all', name: '全部', c1: '#c8a050' },
  { id: 'pantry', name: '储藏室', c1: '#6aa04a' },
  { id: 'crafts', name: '工艺室', c1: '#d08a3a' },
  { id: 'fish', name: '鱼缸', c1: '#4a8ac0' },
  { id: 'boiler', name: '锅炉房', c1: '#c04a3a' },
  { id: 'bulletin', name: '布告栏', c1: '#8a5ac0' },
  { id: 'vault', name: '金库', c1: '#e0c060' }
];

const P = {
  green:  ['#6aa04a', '#3a6a2a', '#a0d080'],
  orange: ['#d08a3a', '#8a5a1a', '#f0c080'],
  blue:   ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  red:    ['#c04a3a', '#8a2a1a', '#f08a70'],
  purple: ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  gold:   ['#e0c060', '#a08020', '#fff0a0'],
  parchment: ['#e8d8b0', '#b8a078', '#fff8e0'],
  dark:   ['#3a3a4a', '#1a1a2a', '#8a8aa0']
};

/* [id, 中文名, 英文名, 房间, 符号, 所需物品, 奖励] */
const RAW = [
  ['spring_crops','春季作物','Spring Crops','pantry','crop',['防风草','青豆','花椰菜','土豆'],'春季种子 ×30'],
  ['summer_crops','夏季作物','Summer Crops','pantry','crop',['西红柿','辣椒','蓝莓','甜瓜'],'夏季种子 ×30'],
  ['fall_crops','秋季作物','Fall Crops','pantry','crop',['玉米','茄子','南瓜','山药'],'秋季种子 ×30'],
  ['quality_crops','高品质作物','Quality Crops','pantry','goldcrop',['金星防风草','金星甜瓜','金星南瓜','金星玉米','金星山药'],'罐头瓶'],
  ['animal_bundle','动物','Animal Bundle','pantry','animal',['大牛奶','大鸡蛋','大羊奶','大棕色鸡蛋','大鸭蛋'],'压酪机'],
  ['artisan_bundle','工匠','Artisan Bundle','pantry','artisan',['松露油','布料','山羊奶酪','蜂蜜','果酱','奶酪'],'小桶'],

  ['spring_foraging','春季采集','Spring Foraging','crafts','forage',['野山葵','黄水仙','韭葱','蒲公英'],'春季种子 ×30'],
  ['summer_foraging','夏季采集','Summer Foraging','crafts','forage',['葡萄','香豌豆','香辛料莓'],'夏季种子 ×30'],
  ['fall_foraging','秋季采集','Fall Foraging','crafts','forage',['普通蘑菇','野梅','榛子','黑莓'],'秋季种子 ×30'],
  ['winter_foraging','冬季采集','Winter Foraging','crafts','forage',['冬根','水晶果','雪山药','番红花'],'冬季种子 ×30'],
  ['construction','建筑','Construction','crafts','build',['木材 ×99','木材 ×99','石头 ×99','硬木 ×10'],'煤炭窑'],
  ['exotic_foraging','异国采集','Exotic Foraging','crafts','exotic',['椰子','仙人掌果','洞穴萝卜','红蘑菇','紫蘑菇'],'自动采集器'],

  ['river_fish','河鱼','River Fish','fish','fish',['太阳鱼','鲶鱼','西鲱','虎鳟'],'鱼饵 ×30'],
  ['lake_fish','湖鱼','Lake Fish','fish','fish',['大口黑鲈','鲤鱼','大头鱼','鲟鱼'],'鱼饵 ×30'],
  ['ocean_fish','海鱼','Ocean Fish','fish','fish',['沙丁鱼','金枪鱼','红鲷鱼','罗非鱼'],'鱼饵 ×30'],
  ['night_fishing','夜间鱼','Night Fishing','fish','night',['鲑鱼','大眼鱼','鳗鱼'],'小型光辉戒指'],
  ['crab_pot','蟹笼','Crab Pot','fish','crab',['龙虾','螃蟹','贝壳','虾','蛤蜊','牡蛎','贻贝'],'蟹笼 ×3'],
  ['specialty_fish','特殊鱼','Specialty Fish','fish','special',['河豚','鬼鱼','沙鱼','木跃鱼'],'海之菜肴 ×5'],

  ['blacksmith','铁匠','Blacksmith\'s','boiler','ore',['铜锭','铁锭','金锭'],'熔炉'],
  ['geologist','地质学家','Geologist\'s','boiler','gem',['石英','大地水晶','冰冻泪','火石英','紫水晶','黄玉','绿宝石','翡翠','红宝石','钻石'],'晶球 ×5'],
  ['adventurer','冒险家','Adventurer\'s','boiler','slime',['史莱姆 ×99','蝙蝠翅膀 ×10','太阳精华','虚空精华'],'生命药水 ×5'],

  ['chef','厨师','Chef\'s','bulletin','chef',['枫糖浆','蕨菜','松露','罂粟籽','生鱼片'],'香辣鳗鱼 ×5'],
  ['dye','染料','Dye','bulletin','dye',['红蘑菇','海葵','向日葵','鸭毛','红甘蓝','紫色海参'],'种子生产器'],
  ['field_research','实地研究','Field Research','bulletin','research',['紫蘑菇','鹦鹉螺','鲢鱼','冰淇淋'],'回收机'],
  ['fodder','饲料','Fodder','bulletin','fodder',['小麦','干草','苹果'],'加热器'],
  ['enchanter','附魔','Enchanter\'s','bulletin','magic',['橡树树脂','酒','兔子的脚','石榴'],'金锭 ×5'],

  ['vault_2500','2,500g','2,500g','vault','money',['2,500g'],'宝石复制机'],
  ['vault_5000','5,000g','5,000g','vault','money',['5,000g'],'宝石复制机'],
  ['vault_10000','10,000g','10,000g','vault','money',['10,000g'],'宝石复制机'],
  ['vault_25000','25,000g','25,000g','vault','money',['25,000g'],'宝石复制机']
];

function roomColor(room) {
  const r = BUNDLE_ROOMS.find(x => x.id === room) || BUNDLE_ROOMS[0];
  return r.c1;
}

export const BUNDLES = RAW.map(([id, name, en, room, symbol, items, reward]) => ({
  id, name, en, room, symbol, items, reward, color: roomColor(room)
}));
export const BUNDLE_MAP = Object.fromEntries(BUNDLES.map(b => [b.id, b]));

export function bundleRoomName(room) {
  const r = BUNDLE_ROOMS.find(x => x.id === room);
  return r ? r.name : room;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SLOT_COLORS = ['#6aa04a', '#e0c060', '#4a8ac0', '#d08a3a', '#8a5ac0', '#c04a3a', '#4ac0b0'];

function symbol(g, it, x, y) {
  const col = it.color;
  const s = it.symbol;
  if (s === 'crop' || s === 'goldcrop' || s === 'forage' || s === 'exotic') {
    R(g, x - 1, y - 5, 2, 8, '#5a3a1a');
    ellipse(g, x - 3, y - 3, 4, 3, s === 'goldcrop' ? '#e0c060' : col);
    ellipse(g, x + 3, y - 1, 4, 3, col);
    return;
  }
  if (s === 'animal') {
    ellipse(g, x, y, 5, 4, '#e0d0b0');
    R(g, x - 2, y - 4, 2, 3, '#a07040');
    R(g, x + 1, y - 4, 2, 3, '#a07040');
    R(g, x - 2, y + 1, 1, 1, '#2a1a14');
    R(g, x + 2, y + 1, 1, 1, '#2a1a14');
    return;
  }
  if (s === 'artisan') {
    R(g, x - 4, y - 3, 8, 7, '#8a5a3a');
    R(g, x - 3, y - 2, 6, 4, '#c08a50');
    R(g, x - 1, y - 1, 2, 3, '#e0c060');
    return;
  }
  if (s === 'build') {
    R(g, x - 5, y - 4, 10, 3, '#8a5a3a');
    R(g, x - 4, y - 1, 8, 6, '#b07a3a');
    R(g, x - 1, y + 1, 2, 3, '#5a3418');
    return;
  }
  if (s === 'fish' || s === 'special') {
    ellipse(g, x - 1, y, 5, 3, col);
    R(g, x + 4, y - 1, 3, 2, col);
    R(g, x + 3, y - 2, 2, 1, '#d0f0ff');
    return;
  }
  if (s === 'night') {
    ellipse(g, x, y, 4, 4, '#3a4a8a');
    ellipse(g, x - 2, y, 4, 3, '#6a8ac0');
    R(g, x + 3, y - 4, 2, 2, '#fff0a0');
    return;
  }
  if (s === 'crab') {
    ellipse(g, x, y, 5, 4, '#c04a3a');
    line(g, x - 3, y - 3, x - 5, y - 5, '#c04a3a', 2);
    line(g, x + 3, y - 3, x + 5, y - 5, '#c04a3a', 2);
    R(g, x - 2, y - 1, 1, 1, '#1a1a1a');
    R(g, x + 2, y - 1, 1, 1, '#1a1a1a');
    return;
  }
  if (s === 'ore') {
    ellipse(g, x, y + 1, 5, 4, '#8a8a7a');
    R(g, x - 2, y - 1, 2, 2, col);
    R(g, x + 1, y + 1, 2, 2, '#e0c060');
    return;
  }
  if (s === 'gem') {
    R(g, x - 3, y - 2, 7, 6, '#8a5ac0');
    R(g, x - 2, y - 1, 5, 4, '#c0a0f0');
    R(g, x - 1, y - 1, 2, 2, '#ffffff');
    return;
  }
  if (s === 'slime') {
    ellipse(g, x, y + 1, 5, 4, '#5aa04a');
    ellipse(g, x, y, 4, 3, '#8ac05a');
    R(g, x - 2, y, 1, 1, '#1a1a1a');
    R(g, x + 2, y, 1, 1, '#1a1a1a');
    return;
  }
  if (s === 'chef') {
    ellipse(g, x, y + 2, 5, 4, '#e0d0b0');
    R(g, x - 3, y - 2, 7, 3, '#f0f0e8');
    R(g, x - 2, y - 4, 2, 2, '#ffffff');
    R(g, x + 1, y - 4, 2, 2, '#ffffff');
    return;
  }
  if (s === 'dye') {
    ellipse(g, x, y, 5, 4, col);
    R(g, x - 2, y - 2, 1, 1, '#ffffff');
    R(g, x + 2, y + 1, 1, 1, '#ffffff');
    return;
  }
  if (s === 'research') {
    R(g, x - 3, y - 5, 7, 10, '#e0d8c0');
    R(g, x - 2, y - 4, 5, 8, '#ffffff');
    for (let i = 0; i < 3; i++) R(g, x - 1, y - 2 + i * 2, 3, 1, col);
    return;
  }
  if (s === 'fodder') {
    for (let i = 0; i < 5; i++) line(g, x - 4 + i * 2, y + 4, x - 3 + i * 3, y - 4, '#c8a050', 1);
    R(g, x - 5, y + 1, 11, 2, '#8a5a2a');
    return;
  }
  if (s === 'magic') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU - Math.PI / 2;
      line(g, x, y, x + Math.cos(a) * 6, y + Math.sin(a) * 6, col, 1);
    }
    R(g, x - 1, y - 1, 3, 3, '#ffffff');
    return;
  }
  if (s === 'money') {
    ellipse(g, x, y, 5, 5, '#e0c060');
    ellipse(g, x, y, 4, 4, '#f0d070');
    R(g, x - 1, y - 2, 2, 5, '#a08020');
    return;
  }
}

export function drawBundleIcon(g, bundle, phase = 0.25) {
  const it = typeof bundle === 'string' ? BUNDLE_MAP[bundle] : bundle;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;

  /* 卷轴 */
  R(g, 5, 5, 22, 22, '#b8a078');
  R(g, 6, 6, 20, 20, '#e8d8b0');
  R(g, 7, 7, 18, 2, '#fff8e0');
  R(g, 5, 4, 22, 3, '#d8c090');
  R(g, 5, 24, 22, 3, '#c8b080');
  R(g, 4, 5, 2, 22, '#c8b078');
  R(g, 26, 5, 2, 22, '#c8b078');
  R(g, 5, 8, 22, 2, it.color);

  /* 物品槽 */
  const n = Math.min(6, it.items.length);
  for (let i = 0; i < n; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 8 + col * 6;
    const y = 13 + row * 6;
    R(g, x, y, 4, 4, '#8a7a5a');
    R(g, x + 1, y + 1, 2, 2, SLOT_COLORS[(i + hashOf(it.id)) % SLOT_COLORS.length]);
  }

  /* 中央小徽章 */
  ellipse(g, 21, 20, 5, 5, it.color);
  ellipse(g, 21, 20, 4, 4, '#fff8e0');
  symbol(g, it, 21, 20);

  const hh = hashOf(it.id);
  R(g, 7 + hh % 18, 7 + Math.floor(hh / 18) % 18, 1, 1, SLOT_COLORS[hh % SLOT_COLORS.length]);
  R(g, 7 + Math.floor(hh / 3) % 18, 7 + Math.floor(hh / 54) % 18, 1, 1, it.color);

  R(g, 9, 8, 3, 1, '#fff8e0');
  g.restore();
}
