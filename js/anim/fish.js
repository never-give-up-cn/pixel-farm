/* 星露谷鱼类图鉴：72 种水生生物（71 种鱼 + 海胆，含齐先生家族）。
 * 图标画在 40×32 格子里，按鱼/鳗/比目/河豚/章鱼/蟹/贝/海参/传说等形态程序化绘制。
 * 售价与季节/地点参考 Stardew Valley 1.6 鱼类表。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const FISH_W = 40;
export const FISH_H = 32;

export const FISH_TYPES = [
  { id: 'all', name: '全部' },
  { id: 'ocean', name: '海洋' },
  { id: 'river', name: '江河' },
  { id: 'lake', name: '湖泊' },
  { id: 'mines', name: '矿井' },
  { id: 'legend', name: '传说' },
  { id: 'crab', name: '蟹笼' },
  { id: 'special', name: '特殊' }
];

/* [id, 中文名, 英文名, 售价, 季节, 地点, 类型, 形态, 主色, 暗色, 腹部/鳍色, 体型, 花纹] */
const RAW = [
  ['albacore','长鳍金枪鱼','Albacore',75,'秋冬','海滩','ocean','fish','#3a5a8a','#1e3a5a','#d8e8f0',1.1,'stripe'],
  ['anchovy','鳀鱼','Anchovy',30,'春秋','海滩','ocean','fish','#8aa0b0','#5a7080','#e0e8f0',0.7,'none'],
  ['angler','鮟鱇鱼','Angler',900,'秋','小镇桥边','legend','angler','#4a3a5a','#2a1a3a','#f0d060',1.2,'none'],
  ['blobfish','水滴鱼','Blobfish',500,'冬','夜市潜艇','special','blob','#e0a0a0','#c07a7a','#f0d0d0',1.0,'none'],
  ['blue_discus','蓝盘鱼','Blue Discus',120,'全年','姜岛','ocean','fish','#3a8ac0','#1e5a8a','#a0d0f0',1.0,'stripe'],
  ['bream','鲷鱼','Bream',45,'全年','河流','river','fish','#8a9a6a','#5a6a4a','#e0e8c0',0.9,'none'],
  ['bullhead','牛头鲶','Bullhead',75,'全年','山湖','lake','catfish','#6a5a3a','#3a2a1a','#d0c0a0',1.0,'none'],
  ['carp','鲤鱼','Carp',30,'全年','山湖/秘密森林','lake','fish','#b08a4a','#7a5a2a','#e8d0a0',0.9,'none'],
  ['catfish','鲶鱼','Catfish',200,'春秋','河流','river','catfish','#5a4a3a','#2a1a1a','#d0c0a0',1.1,'none'],
  ['chub','圆腹雅罗鱼','Chub',50,'全年','河流','river','fish','#7a8a6a','#4a5a3a','#d0e0b0',0.8,'none'],
  ['clam','蛤蜊','Clam',50,'全年','蟹笼','crab','shell','#e0d8c0','#a09880','#f0e8d0',0.8,'none'],
  ['cockle','鸟蛤','Cockle',50,'全年','蟹笼','crab','shell','#d0b090','#907050','#f0e0c0',0.7,'none'],
  ['crab','螃蟹','Crab',100,'全年','蟹笼','crab','crab','#d04a3a','#8a2a1a','#f08060',0.9,'none'],
  ['crayfish','小龙虾','Crayfish',75,'全年','蟹笼','crab','crayfish','#a05a2a','#6a2a1a','#e08050',0.8,'none'],
  ['crimsonfish','绯红鱼','Crimsonfish',1500,'夏','海滩','legend','legend','#d02a3a','#8a1a2a','#f07a8a',1.4,'none'],
  ['dorado','鲯鳅','Dorado',100,'夏','森林河流','river','fish','#e0c040','#a08020','#fff0a0',1.2,'none'],
  ['eel','鳗鱼','Eel',85,'春秋','海滩','ocean','eel','#4a5a3a','#2a3a1a','#a0b080',1.1,'none'],
  ['flounder','比目鱼','Flounder',100,'春夏','海滩','ocean','flat','#b09a6a','#7a6a4a','#e0d0a0',1.0,'none'],
  ['ghostfish','幽灵鱼','Ghostfish',45,'全年','矿井','mines','spook','#c0d0d0','#8090a0','#f0f8f8',0.9,'none'],
  ['glacierfish','冰川鱼','Glacierfish',1000,'冬','森林','legend','legend','#8ac0e0','#4a80a0','#e0f8ff',1.4,'none'],
  ['glacierfish_jr','小冰川鱼','Glacierfish Jr.',1000,'全年','森林','legend','legend','#8ac0e0','#4a80a0','#e0f8ff',1.1,'none'],
  ['goby','虾虎鱼','Goby',150,'全年','森林瀑布','river','fish','#b0a060','#7a6a30','#e0d0a0',0.7,'none'],
  ['halibut','大比目鱼','Halibut',80,'春/夏/冬','海滩','ocean','flat','#8a7a5a','#5a4a2a','#d0c0a0',1.2,'none'],
  ['herring','鲱鱼','Herring',30,'春/冬','海滩','ocean','fish','#8aa0b0','#5a7080','#e0e8f0',0.8,'none'],
  ['ice_pip','冰柱鱼','Ice Pip',500,'全年','矿井60层','mines','round','#a0d0e0','#5a90a0','#e0f8ff',0.8,'spikes'],
  ['largemouth_bass','大口黑鲈','Largemouth Bass',100,'全年','山湖','lake','fish','#6a8a4a','#3a5a2a','#d0e0a0',1.1,'stripe'],
  ['lava_eel','岩浆鳗','Lava Eel',700,'全年','矿井100层','mines','eel','#e04a2a','#a02a1a','#f0a060',1.2,'none'],
  ['legend','传说之鱼','Legend',5000,'春','山湖','legend','legend','#4ac06a','#1e7a3a','#a0f0b0',1.5,'none'],
  ['legend_ii','传说之鱼二代','Legend II',5000,'全年','山湖','legend','legend','#4ac06a','#1e7a3a','#a0f0b0',1.3,'none'],
  ['lingcod','长蛇齿鱼','Lingcod',120,'冬','山湖','lake','fish','#6a6a5a','#3a3a2a','#c0c0a0',1.2,'spots'],
  ['lionfish','狮子鱼','Lionfish',100,'全年','姜岛','special','lion','#d06a3a','#8a3a1a','#f0d0a0',1.1,'none'],
  ['lobster','龙虾','Lobster',120,'全年','蟹笼','crab','lobster','#c03a2a','#7a1a1a','#f08060',1.0,'none'],
  ['midnight_carp','午夜鲤鱼','Midnight Carp',150,'秋/冬','山湖/森林','river','fish','#3a3a6a','#1a1a3a','#8a8ac0',1.0,'spots'],
  ['midnight_squid','午夜鱿鱼','Midnight Squid',100,'冬','夜市潜艇','special','squid','#3a2a5a','#1a1a3a','#8a7ac0',1.0,'none'],
  ['ms_angler','鮟鱇鱼女士','Ms. Angler',900,'全年','小镇桥边','legend','angler','#5a4a6a','#2a1a3a','#f0d060',1.2,'none'],
  ['mussel','贻贝','Mussel',30,'全年','蟹笼','crab','shell','#4a4a5a','#2a2a3a','#8a8aa0',0.8,'none'],
  ['mutant_carp','变异鲤鱼','Mutant Carp',1000,'全年','下水道','legend','legend','#6a8a4a','#3a5a2a','#c0e080',1.2,'none'],
  ['octopus','章鱼','Octopus',150,'夏/冬','海滩','special','octopus','#b04a6a','#7a2a3a','#f0a0b0',1.1,'none'],
  ['oyster','牡蛎','Oyster',40,'全年','蟹笼','crab','shell','#c0b8a0','#8a8068','#e8e0c8',0.9,'none'],
  ['perch','河鲈','Perch',55,'冬','河流','river','fish','#8a9a4a','#5a6a2a','#e0e8a0',0.9,'stripe'],
  ['periwinkle','滨螺','Periwinkle',20,'全年','蟹笼','crab','shell','#8a7a6a','#5a4a3a','#c0b0a0',0.6,'none'],
  ['pike','狗鱼','Pike',100,'夏/冬','河流','river','fish','#5a7a4a','#2a4a2a','#c0d0a0',1.2,'spots'],
  ['pufferfish','河豚','Pufferfish',200,'夏','海滩','ocean','round','#d0b040','#8a7020','#f0e090',1.0,'spikes'],
  ['radioactive_carp','放射性鲤鱼','Radioactive Carp',1000,'全年','下水道','legend','legend','#8ae04a','#4a8a1a','#e0ffa0',1.2,'none'],
  ['rainbow_trout','虹鳟鱼','Rainbow Trout',65,'夏','河流','river','fish','#7aa0c0','#4a7090','#e0f0ff',1.0,'stripe'],
  ['red_mullet','红鲻鱼','Red Mullet',75,'夏/冬','海滩','ocean','fish','#c05a4a','#8a2a1a','#f0a090',0.9,'none'],
  ['red_snapper','红鲷鱼','Red Snapper',50,'夏/秋/冬','海滩','ocean','fish','#d06a4a','#8a2a1a','#f0b090',1.1,'stripe'],
  ['salmon','鲑鱼','Salmon',75,'秋','河流','river','fish','#d07a5a','#8a3a2a','#f0c0a0',1.2,'none'],
  ['sandfish','沙鱼','Sandfish',75,'全年','沙漠','mines','fish','#d0b070','#a08040','#f0e0b0',0.9,'spots'],
  ['sardine','沙丁鱼','Sardine',40,'春/秋/冬','海滩','ocean','fish','#8aa0b0','#5a7080','#e0e8f0',0.7,'none'],
  ['scorpion_carp','蝎子鲤鱼','Scorpion Carp',150,'全年','沙漠','mines','fish','#8a6a3a','#5a3a1a','#d0b080',1.0,'spots'],
  ['sea_cucumber','海参','Sea Cucumber',75,'秋/冬','海滩','ocean','cucumber','#5a6a3a','#2a3a1a','#a0b080',0.9,'bumps'],
  ['sea_urchin','海胆','Sea Urchin',160,'全年','海滩','special','urchin','#4a2a4a','#2a1a2a','#c080a0',0.8,'spikes'],
  ['shad','美洲西鲱','Shad',60,'春/夏/秋','河流','river','fish','#8a9aa0','#5a6a70','#e0f0f0',1.0,'stripe'],
  ['shrimp','虾','Shrimp',60,'全年','蟹笼','crab','shrimp','#e0a080','#a06040','#f0d0b0',0.6,'none'],
  ['slimejack','史莱姆鱼','Slimejack',100,'全年','变种虫巢','mines','blob','#6aa04a','#3a6a2a','#c0e080',1.0,'none'],
  ['smallmouth_bass','小口黑鲈','Smallmouth Bass',50,'春/秋','河流','river','fish','#7a8a5a','#4a5a2a','#d0e0a0',0.9,'stripe'],
  ['snail','蜗牛','Snail',65,'全年','蟹笼','crab','snail','#b09a6a','#7a6a4a','#e0d0a0',0.7,'none'],
  ['son_of_crimsonfish','绯红鱼之子','Son of Crimsonfish',1500,'全年','海滩','legend','legend','#d02a3a','#8a1a2a','#f07a8a',1.4,'none'],
  ['spook_fish','幽灵鱼','Spook Fish',220,'冬','夜市潜艇','special','spook','#a0b0c0','#607080','#e0f0f8',1.0,'none'],
  ['squid','鱿鱼','Squid',80,'冬','海滩','ocean','squid','#c0a0a0','#806060','#f0d0d0',1.0,'none'],
  ['stingray','黄貂鱼','Stingray',180,'全年','海盗湾','special','flat','#8a7a6a','#5a4a3a','#d0c0b0',1.3,'none'],
  ['stonefish','石头鱼','Stonefish',300,'全年','矿井20层','mines','round','#8a7a6a','#5a4a3a','#c0b0a0',1.0,'none'],
  ['sturgeon','鲟鱼','Sturgeon',200,'夏/冬','山湖','lake','fish','#6a7a8a','#3a4a5a','#c0d0e0',1.3,'spots'],
  ['sunfish','太阳鱼','Sunfish',30,'春/夏','河流','river','round','#e0c040','#a08020','#fff0a0',0.8,'none'],
  ['super_cucumber','超级海参','Super Cucumber',250,'夏/秋','海滩','ocean','cucumber','#8a6ac0','#5a3a8a','#d0b0f0',1.2,'bumps'],
  ['tiger_trout','虎鳟','Tiger Trout',150,'秋/冬','河流','river','fish','#d0a040','#8a6010','#f0e0a0',1.0,'stripe'],
  ['tilapia','罗非鱼','Tilapia',75,'夏/秋','姜岛/海洋','ocean','fish','#8a9a8a','#5a6a5a','#d0e0d0',0.9,'stripe'],
  ['tuna','金枪鱼','Tuna',100,'夏/冬','海滩','ocean','fish','#3a5a8a','#1e3a5a','#d8e8f0',1.3,'none'],
  ['void_salmon','虚空鲑鱼','Void Salmon',150,'全年','女巫沼泽','mines','fish','#6a3a7a','#3a1a4a','#b080c0',1.2,'none'],
  ['walleye','大眼狮鲈','Walleye',105,'秋/冬','河流','river','fish','#b09a5a','#7a6a2a','#e0d0a0',1.1,'stripe'],
  ['woodskip','木跃鱼','Woodskip',75,'全年','秘密森林','river','fish','#8a6a3a','#5a3a1a','#d0b080',1.0,'spots']
];

export const FISH = RAW.map(([id, name, en, price, seasons, place, type, shape, c1, c2, c3, size, pattern]) =>
  ({ id, name, en, price, seasons, place, type, shape, c1, c2, c3, size, pattern }));

export const FISH_MAP = Object.fromEntries(FISH.map(f => [f.id, f]));

export function fishTypeName(type) {
  const t = FISH_TYPES.find(x => x.id === type);
  return t ? t.name : type;
}

/* ---------------- 绘制 ---------------- */

function eye(g, x, y, dark) {
  R(g, x, y, 2, 2, '#ffffff');
  R(g, x + 1, y, 1, 1, dark || '#1a1a1a');
}

function tail(g, m, x, y, len, h) {
  const tx = x - len;
  for (let i = -h - 1; i <= h + 1; i++) {
    const w = Math.round((1 - Math.abs(i) / (h + 2)) * 5);
    if (w > 0) R(g, tx - w, y + i, w + 1, 1, m.c2);
  }
  R(g, tx - 1, y - h, 2, h * 2 + 1, m.c2);
}

function drawFish(g, m, x, y, len, h) {
  tail(g, m, x, y, len, h);
  ellipse(g, x, y, len, h, m.c1);
  /* 背脊阴影 */
  ellipse(g, x, y - Math.round(h * 0.35), len - 1, Math.max(1, h * 0.45), m.c2);
  /* 腹部只占下半部分 */
  ellipse(g, x + 1, y + Math.round(h * 0.55), len - 2, Math.max(1, h * 0.4), m.c3);
  /* 鳃线 */
  line(g, x + Math.round(len * 0.35), y - h + 1, x + Math.round(len * 0.35), y + h - 1, m.c2, 1);
  /* 背鳍 / 胸鳍 */
  line(g, x - 2, y - h, x + 3, y - h - 4, m.c2, 2);
  line(g, x - 1, y + 1, x - 5, y + 5, m.c2, 1);
  /* 眼睛靠头部 */
  eye(g, x + Math.round(len * 0.6), y - 2);
  R(g, x + len, y + 1, 2, 1, m.c2);

  if (m.pattern === 'stripe') {
    for (let i = 0; i < 3; i++) R(g, x - 3 + i * 4, y - h + 2, 1, Math.max(2, h * 1.2), m.c2);
  } else if (m.pattern === 'spots') {
    R(g, x - 2, y - 1, 1, 1, m.c2);
    R(g, x + 3, y - 3, 1, 1, m.c2);
    R(g, x + 1, y + 2, 1, 1, m.c2);
  }
}

function drawEel(g, m, x, y, len, h) {
  for (let i = 0; i <= 10; i++) {
    const px = x - len + i * (len * 2 / 10);
    const py = y + Math.round(Math.sin(i * 0.9) * 4);
    R(g, px, py, 3, 4, i % 2 ? m.c1 : m.c2);
    if (i % 3 === 0) R(g, px + 1, py - 1, 1, 1, m.c3);
  }
  const hx = x + len;
  ellipse(g, hx, y + 2, 4, 3, m.c1);
  eye(g, hx + 1, y);
  R(g, hx + 3, y + 2, 2, 1, m.c2);
}

function drawFlat(g, m, x, y, len, h) {
  tail(g, m, x - 3, y, len - 2, h);
  ellipse(g, x, y, len, Math.max(2, h - 2), m.c1);
  ellipse(g, x, y + 1, len - 2, Math.max(1, h - 3), m.c3);
  R(g, x + 2, y - 3, 1, 1, '#ffffff'); R(g, x + 2, y - 3, 1, 1, '#1a1a1a');
  R(g, x + 5, y - 3, 1, 1, '#ffffff'); R(g, x + 5, y - 3, 1, 1, '#1a1a1a');
  line(g, x + len - 2, y + 1, x + len, y + 2, m.c2, 1);
}

function drawRound(g, m, x, y, r, spikes) {
  if (spikes) {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      line(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85,
              x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3) * 0.85, m.c2, 1);
    }
  }
  ellipse(g, x, y, r, Math.max(2, r * 0.85), m.c1);
  ellipse(g, x + 1, y + 2, r - 2, Math.max(1, r * 0.55), m.c3);
  eye(g, x + Math.round(r * 0.45), y - 1);
  R(g, x + r, y + 1, 2, 1, m.c2);
}

function drawBlob(g, m, x, y, s) {
  ellipse(g, x, y, 10 * s, 8 * s, m.c1);
  ellipse(g, x + 1, y + 2, 8 * s, 5 * s, m.c3);
  R(g, x + 2, y - 2, 2, 2, '#ffffff');
  R(g, x + 3, y - 2, 1, 1, '#1a1a1a');
  R(g, x - 2, y - 2, 2, 2, '#ffffff');
  R(g, x - 1, y - 2, 1, 1, '#1a1a1a');
  R(g, x + 2, y + 3, 3, 1, '#8a5a5a');
  R(g, x - 3, y + 4, 2, 2, m.c2);
}

function drawSpook(g, m, x, y, s) {
  g.globalAlpha = 0.85;
  ellipse(g, x, y - 1, 9 * s, 7 * s, m.c1);
  for (let i = 0; i < 4; i++) {
    R(g, x - 8 + i * 5, y + 5, 3, 3 + (i % 2) * 2, m.c1);
  }
  eye(g, x + 2, y - 2, '#3a3a5a');
  R(g, x + 6, y + 1, 2, 1, m.c2);
  g.globalAlpha = 1;
}

function drawSquid(g, m, x, y, s) {
  ellipse(g, x, y - 3, 6 * s, 6 * s, m.c1);
  R(g, x - 4, y + 1, 8, 2, m.c2);
  for (let i = 0; i < 5; i++) {
    line(g, x - 4 + i * 2, y + 2, x - 5 + i * 2, y + 8 + (i % 2) * 2, m.c1, 1);
  }
  eye(g, x + 1, y - 4, '#1a1a1a');
}

function drawOctopus(g, m, x, y, s) {
  ellipse(g, x, y - 4, 7 * s, 6 * s, m.c1);
  ellipse(g, x, y + 1, 5 * s, 3 * s, m.c3);
  for (let i = 0; i < 6; i++) {
    const dx = -6 + i * 2.4;
    line(g, x + dx * s, y + 1, x + dx * s + (i % 2 ? 2 : -2), y + 8, m.c1, 1);
  }
  eye(g, x - 2, y - 5);
  eye(g, x + 2, y - 5);
}

function drawCrab(g, m, x, y, s) {
  ellipse(g, x, y + 2, 7 * s, 4 * s, m.c1);
  R(g, x - 5, y - 1, 2, 2, m.c2);
  R(g, x + 4, y - 1, 2, 2, m.c2);
  line(g, x - 7, y, x - 10, y - 3, m.c2, 2);
  line(g, x + 7, y, x + 10, y - 3, m.c2, 2);
  for (let i = 0; i < 3; i++) {
    R(g, x - 5 + i * 5, y + 5, 1, 3, m.c2);
    R(g, x - 4 + i * 5, y + 7, 2, 1, m.c2);
  }
  eye(g, x - 3, y - 2);
  eye(g, x + 2, y - 2);
}

function drawLobster(g, m, x, y, s) {
  ellipse(g, x, y, 6 * s, 3 * s, m.c1);
  for (let i = 0; i < 4; i++) R(g, x - 2 + i * 2, y + 2, 1, 2, m.c2);
  R(g, x + 4, y + 1, 5, 2, m.c3);
  R(g, x + 7, y + 3, 3, 2, m.c2);
  line(g, x - 6, y - 1, x - 11, y - 4, m.c2, 2);
  line(g, x - 6, y + 1, x - 11, y + 4, m.c2, 2);
  R(g, x + 2, y - 2, 1, 1, '#1a1a1a');
  line(g, x + 8, y - 2, x + 12, y - 4, m.c2, 1);
  line(g, x + 8, y - 1, x + 12, y - 2, m.c2, 1);
}

function drawCrayfish(g, m, x, y, s) {
  ellipse(g, x, y + 1, 4 * s, 2 * s, m.c1);
  R(g, x + 3, y, 3, 3, m.c2);
  line(g, x - 4, y, x - 8, y - 3, m.c2, 1);
  line(g, x - 4, y + 1, x - 8, y + 3, m.c2, 1);
  R(g, x + 2, y - 1, 1, 1, '#1a1a1a');
  R(g, x + 5, y - 1, 2, 1, m.c3);
}

function drawShrimp(g, m, x, y, s) {
  for (let i = 0; i < 5; i++) {
    const px = x - 4 + i * 2.2;
    const py = y + Math.round(Math.sin(i * 0.8) * 2);
    R(g, px, py, 2, 3, i % 2 ? m.c1 : m.c2);
  }
  eye(g, x + 5, y - 1);
  line(g, x + 7, y - 1, x + 10, y - 3, m.c2, 1);
  line(g, x + 7, y, x + 10, y + 2, m.c2, 1);
}

function drawShell(g, m, x, y, s) {
  ellipse(g, x, y + 2, 8 * s, 5 * s, m.c1);
  for (let i = -2; i <= 2; i++) {
    line(g, x + i * 3, y + 2, x + i * 5, y - 3, m.c2, 1);
  }
  R(g, x - 2, y - 4, 5, 2, m.c3);
  R(g, x - 1, y + 6, 3, 1, m.c2);
}

function drawSnail(g, m, x, y, s) {
  ellipse(g, x + 1, y, 6 * s, 5 * s, m.c1);
  ellipse(g, x + 1, y, 4 * s, 3 * s, m.c2);
  ellipse(g, x + 1, y, 2 * s, 1 * s, m.c3);
  R(g, x - 5, y + 3, 7, 2, m.c1);
  R(g, x - 7, y + 1, 2, 2, m.c2);
  R(g, x - 8, y - 1, 1, 1, m.c3);
  R(g, x - 5, y + 2, 1, 1, '#1a1a1a');
}

function drawCucumber(g, m, x, y, s) {
  ellipse(g, x, y, 9 * s, 5 * s, m.c1);
  ellipse(g, x + 1, y + 1, 7 * s, 3 * s, m.c3);
  for (let i = 0; i < 5; i++) {
    const px = x - 6 + i * 3;
    R(g, px, y - 5, 1, 2, m.c2);
    R(g, px + 1, y + 4, 1, 2, m.c2);
  }
  R(g, x + 7, y - 1, 1, 1, '#1a1a1a');
}

function drawAngler(g, m, x, y, s) {
  drawFish(g, m, x, y, 9 * s, 5 * s);
  line(g, x + 2, y - 5, x + 5, y - 10, m.c2, 1);
  ellipse(g, x + 6, y - 11, 2, 2, '#fff0a0');
  R(g, x + 6, y - 13, 1, 1, '#ffffff');
  /* 大嘴 */
  R(g, x + 5, y + 2, 3, 1, '#3a1a2a');
}

function drawCatfish(g, m, x, y, s) {
  drawFish(g, m, x, y, 10 * s, 4 * s);
  line(g, x + 8, y + 2, x + 13, y + 5, m.c2, 1);
  line(g, x + 8, y + 3, x + 12, y + 7, m.c2, 1);
  line(g, x - 2, y + 2, x - 6, y + 6, m.c2, 1);
}

function drawLion(g, m, x, y, s) {
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.35;
    line(g, x, y, x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, m.c3, 1);
  }
  drawFish(g, m, x, y, 8 * s, 4 * s);
  for (let i = 0; i < 4; i++) {
    line(g, x - 4 + i * 3, y + 4, x - 6 + i * 3, y + 8, m.c2, 1);
  }
}

function drawLegend(g, m, x, y, s) {
  g.globalAlpha = 0.12;
  ellipse(g, x, y, 13 * s, 8 * s, m.c3);
  g.globalAlpha = 1;
  drawFish(g, m, x, y, 10 * s, 5 * s);
  R(g, x - 2, y - 7 * s, 2, 2, '#fff0a0');
  R(g, x + 2, y - 8 * s, 2, 2, '#fff0a0');
}

export function drawFishIcon(g, fish, phase = 0.25) {
  const m = typeof fish === 'string' ? FISH_MAP[fish] : fish;
  if (!m) return;
  const x = 20, y = 16;
  const s = m.size || 1;
  const bob = Math.round(Math.sin(phase * TAU + m.id.length) * 1);

  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(0, bob);

  if (m.shape === 'fish') drawFish(g, m, x, y, 10 * s, 4.5 * s);
  else if (m.shape === 'eel') drawEel(g, m, x, y, 10 * s, 4 * s);
  else if (m.shape === 'flat') drawFlat(g, m, x, y, 11 * s, 5 * s);
  else if (m.shape === 'round') drawRound(g, m, x, y, 5 * s, m.pattern === 'spikes');
  else if (m.shape === 'blob') drawBlob(g, m, x, y, s);
  else if (m.shape === 'spook') drawSpook(g, m, x, y, s);
  else if (m.shape === 'squid') drawSquid(g, m, x, y, s);
  else if (m.shape === 'octopus') drawOctopus(g, m, x, y, s);
  else if (m.shape === 'crab') drawCrab(g, m, x, y, s);
  else if (m.shape === 'lobster') drawLobster(g, m, x, y, s);
  else if (m.shape === 'crayfish') drawCrayfish(g, m, x, y, s);
  else if (m.shape === 'shrimp') drawShrimp(g, m, x, y, s);
  else if (m.shape === 'shell') drawShell(g, m, x, y, s);
  else if (m.shape === 'snail') drawSnail(g, m, x, y, s);
  else if (m.shape === 'cucumber') drawCucumber(g, m, x, y, s);
  else if (m.shape === 'angler') drawAngler(g, m, x, y, s);
  else if (m.shape === 'catfish') drawCatfish(g, m, x, y, s);
  else if (m.shape === 'lion') drawLion(g, m, x, y, s);
  else if (m.shape === 'legend') drawLegend(g, m, x, y, s);
  else if (m.shape === 'urchin') drawRound(g, m, x, y, 5 * s, true);
  else drawFish(g, m, x, y, 9 * s, 4 * s);

  g.restore();
}
