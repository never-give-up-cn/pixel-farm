/* 星露谷矿物图鉴：53 种可捐赠矿物（8 宝石 + 4 采集矿物 + 41 晶洞矿物）。
 * 每个图标画在 32×32 格子里，按宝石/水晶/矿石/碎片/球状/史莱姆等形态程序化绘制。
 * 类型与售价参考 Stardew Valley 1.6 矿物表。 */

import { R, line, ellipse } from './pixel.js';

export const MINERAL_W = 32;
export const MINERAL_H = 32;

export const MINERAL_TYPES = [
  { id: 'all', name: '全部' },
  { id: 'gem', name: '宝石' },
  { id: 'foraged', name: '采集' },
  { id: 'geode', name: '晶洞' }
];

/* shape: gem / crystal / rock / shard / orb / blob */
export const MINERALS = [
  // ---------- 宝石 ----------
  { id:'prismatic_shard', name:'五彩碎片', en:'Prismatic Shard', type:'gem', shape:'prismatic', price:2000, c1:'#e0a0f0', c2:'#a0e0f0', c3:'#fff0a0' },
  { id:'diamond',         name:'钻石',     en:'Diamond',         type:'gem', shape:'gem',       price:750,  c1:'#d8ecf8', c2:'#a0c8e0', c3:'#ffffff' },
  { id:'emerald',         name:'绿宝石',   en:'Emerald',         type:'gem', shape:'gem',       price:250,  c1:'#3ac06a', c2:'#1e7a3a', c3:'#a0f0b0' },
  { id:'ruby',            name:'红宝石',   en:'Ruby',            type:'gem', shape:'gem',       price:250,  c1:'#d02a3a', c2:'#8a1a2a', c3:'#f07a8a' },
  { id:'jade',            name:'翡翠',     en:'Jade',            type:'gem', shape:'gem',       price:200,  c1:'#4aa06a', c2:'#2a6a3a', c3:'#a0e0b0' },
  { id:'aquamarine',      name:'海蓝宝石', en:'Aquamarine',      type:'gem', shape:'gem',       price:180,  c1:'#4ac0d0', c2:'#2a7a8a', c3:'#a0e0f0' },
  { id:'amethyst',        name:'紫水晶',   en:'Amethyst',        type:'gem', shape:'gem',       price:100,  c1:'#a05ac0', c2:'#6a2a8a', c3:'#d0a0f0' },
  { id:'topaz',           name:'黄玉',     en:'Topaz',           type:'gem', shape:'gem',       price:80,   c1:'#e0a03a', c2:'#a06010', c3:'#f0d060' },

  // ---------- 采集矿物 ----------
  { id:'quartz',        name:'石英',   en:'Quartz',        type:'foraged', shape:'crystal', price:25,  c1:'#e8e8f4', c2:'#a8a8c8', c3:'#ffffff' },
  { id:'earth_crystal', name:'地晶',   en:'Earth Crystal', type:'foraged', shape:'crystal', price:50,  c1:'#d0b070', c2:'#8a6a30', c3:'#f0e0b0' },
  { id:'frozen_tear',   name:'冰泪',   en:'Frozen Tear',   type:'foraged', shape:'crystal', price:75,  c1:'#a8d8f4', c2:'#5a9ac0', c3:'#e8f8ff' },
  { id:'fire_quartz',   name:'火石英', en:'Fire Quartz',   type:'foraged', shape:'crystal', price:100, c1:'#e05a3a', c2:'#a02a1a', c3:'#f0a060' },

  // ---------- 晶洞矿物 ----------
  { id:'star_shards',   name:'星之碎片', en:'Star Shards',   type:'geode', shape:'shard', price:500, c1:'#f0e8a0', c2:'#c0a850', c3:'#fff8d8' },
  { id:'helvite',       name:'日光榴石', en:'Helvite',       type:'geode', shape:'gem',   price:450, c1:'#c8d04a', c2:'#8a9a2a', c3:'#f0f090' },
  { id:'neptunite',     name:'柱星叶石', en:'Neptunite',     type:'geode', shape:'shard', price:400, c1:'#3a4a8a', c2:'#1e2a5a', c3:'#8a9ae0' },
  { id:'fire_opal',     name:'火蛋白石', en:'Fire Opal',     type:'geode', shape:'orb',   price:350, c1:'#e05a2a', c2:'#a02a10', c3:'#ffd080' },
  { id:'dolomite',      name:'白云石',   en:'Dolomite',      type:'geode', shape:'rock',  price:300, c1:'#d8b0b0', c2:'#a88080', c3:'#f0d8d8' },
  { id:'bixite',        name:'铋晶石',   en:'Bixite',        type:'geode', shape:'rock',  price:300, c1:'#7a7a8a', c2:'#3a3a4a', c3:'#b0b0c0' },
  { id:'tigerseye',     name:'虎眼石',   en:'Tigerseye',     type:'geode', shape:'orb',   price:275, c1:'#c8903a', c2:'#8a5a20', c3:'#f0c060' },
  { id:'kyanite',       name:'蓝晶石',   en:'Kyanite',       type:'geode', shape:'shard', price:250, c1:'#4a7ad0', c2:'#2a4a90', c3:'#a0c0f0' },
  { id:'fairy_stone',   name:'仙石',     en:'Fairy Stone',   type:'geode', shape:'orb',   price:250, c1:'#e0a0c0', c2:'#a06080', c3:'#f0d0e0' },
  { id:'ocean_stone',  name:'海洋石',   en:'Ocean Stone',   type:'geode', shape:'orb',   price:220, c1:'#3a8a9a', c2:'#1e5a6a', c3:'#8ad0e0' },
  { id:'lemon_stone',  name:'柠檬石',   en:'Lemon Stone',   type:'geode', shape:'gem',   price:200, c1:'#e8d04a', c2:'#a89020', c3:'#fff090' },
  { id:'ghost_crystal',name:'幽灵水晶', en:'Ghost Crystal', type:'geode', shape:'crystal', price:200, c1:'#a0e0e0', c2:'#60a0a0', c3:'#e0ffff' },
  { id:'fluorapatite', name:'氟磷灰石', en:'Fluorapatite',  type:'geode', shape:'crystal', price:200, c1:'#4ac0a0', c2:'#2a8060', c3:'#a0f0d0' },
  { id:'obsidian',     name:'黑曜石',   en:'Obsidian',      type:'geode', shape:'shard', price:200, c1:'#2a2a3a', c2:'#151520', c3:'#8a7aa0' },
  { id:'lunarite',     name:'月石',     en:'Lunarite',      type:'geode', shape:'crystal', price:200, c1:'#a0b0e0', c2:'#6070a0', c3:'#e8ecff' },
  { id:'basalt',       name:'玄武岩',   en:'Basalt',        type:'geode', shape:'rock',  price:175, c1:'#5a5a5a', c2:'#2a2a2a', c3:'#8a8a8a' },
  { id:'opal',         name:'蛋白石',   en:'Opal',          type:'geode', shape:'orb',   price:150, c1:'#e0e0f0', c2:'#a0a0c0', c3:'#ffd0e0' },
  { id:'jamborite',    name:'水镍矿',   en:'Jamborite',     type:'geode', shape:'rock',  price:150, c1:'#6a9a4a', c2:'#3f6a2a', c3:'#b0d080' },
  { id:'jasper',       name:'碧玉',     en:'Jasper',        type:'geode', shape:'rock',  price:150, c1:'#b04a3a', c2:'#7a2a1a', c3:'#e08060' },
  { id:'geminite',     name:'双生石',   en:'Geminite',      type:'geode', shape:'gem',   price:150, c1:'#a06ac0', c2:'#6a3a8a', c3:'#d0a0e0' },
  { id:'hematite',     name:'赤铁矿',   en:'Hematite',      type:'geode', shape:'rock',  price:150, c1:'#5a2a2a', c2:'#3a1a1a', c3:'#a05a5a' },
  { id:'alamite',      name:'阿拉米石', en:'Alamite',       type:'geode', shape:'gem',   price:150, c1:'#d05a3a', c2:'#8a2a1a', c3:'#f09a70' },
  { id:'aerinite',     name:'青铝石',   en:'Aerinite',      type:'geode', shape:'rock',  price:125, c1:'#4a8ac0', c2:'#2a5a8a', c3:'#a0c8f0' },
  { id:'celestine',    name:'天青石',   en:'Celestine',     type:'geode', shape:'crystal', price:125, c1:'#8ac0e0', c2:'#4a80a0', c3:'#d0f0ff' },
  { id:'pyrite',       name:'黄铁矿',   en:'Pyrite',        type:'geode', shape:'rock',  price:120, c1:'#d0b040', c2:'#8a7020', c3:'#f0e080' },
  { id:'petrified_slime',name:'石化史莱姆',en:'Petrified Slime',type:'geode',shape:'blob',price:120, c1:'#6a9a3a', c2:'#3f6a20', c3:'#a0d060' },
  { id:'soapstone',    name:'滑石',     en:'Soapstone',     type:'geode', shape:'rock',  price:120, c1:'#8a9a8a', c2:'#5a6a5a', c3:'#c0d0c0' },
  { id:'jagoite',      name:'贾戈石',   en:'Jagoite',       type:'geode', shape:'rock',  price:115, c1:'#8ac06a', c2:'#4a7a2a', c3:'#c0e0a0' },
  { id:'marble',       name:'大理石',   en:'Marble',        type:'geode', shape:'rock',  price:110, c1:'#e0e0e0', c2:'#a0a0a0', c3:'#ffffff' },
  { id:'thunder_egg',  name:'雷蛋',     en:'Thunder Egg',   type:'geode', shape:'orb',   price:100, c1:'#8a5a9a', c2:'#5a2a6a', c3:'#c090d0' },
  { id:'esperite',     name:'埃斯佩石', en:'Esperite',      type:'geode', shape:'crystal', price:100, c1:'#d0e04a', c2:'#8a9a20', c3:'#f0ffa0' },
  { id:'malachite',    name:'孔雀石',   en:'Malachite',     type:'geode', shape:'orb',   price:100, c1:'#3a8a5a', c2:'#1e5a3a', c3:'#8ad0a0' },
  { id:'slate',        name:'板岩',     en:'Slate',         type:'geode', shape:'rock',  price:85,  c1:'#6a6a7a', c2:'#3a3a4a', c3:'#a0a0b0' },
  { id:'orpiment',     name:'雌黄',     en:'Orpiment',      type:'geode', shape:'crystal', price:80,  c1:'#e0a02a', c2:'#a06010', c3:'#f0d060' },
  { id:'nekoite',      name:'猫石',     en:'Nekoite',       type:'geode', shape:'gem',   price:80,  c1:'#e0a0b0', c2:'#a06070', c3:'#f0d0e0' },
  { id:'granite',      name:'花岗岩',   en:'Granite',       type:'geode', shape:'rock',  price:75,  c1:'#9a8a7a', c2:'#6a5a4a', c3:'#d0c0a0' },
  { id:'calcite',      name:'方解石',   en:'Calcite',       type:'geode', shape:'crystal', price:75,  c1:'#f0e0a0', c2:'#c0a060', c3:'#fff8d0' },
  { id:'sandstone',    name:'砂岩',     en:'Sandstone',     type:'geode', shape:'rock',  price:60,  c1:'#d0b080', c2:'#a08050', c3:'#f0e0b0' },
  { id:'baryte',       name:'重晶石',   en:'Baryte',        type:'geode', shape:'crystal', price:50,  c1:'#c0d0e0', c2:'#8090a0', c3:'#f0f8ff' },
  { id:'mudstone',     name:'泥岩',     en:'Mudstone',      type:'geode', shape:'rock',  price:25,  c1:'#8a6a4a', c2:'#5a4028', c3:'#b09070' },
  { id:'limestone',    name:'石灰岩',   en:'Limestone',     type:'geode', shape:'rock',  price:15,  c1:'#d0c8b0', c2:'#a09880', c3:'#f0e8d0' }
];

export const MINERAL_MAP = Object.fromEntries(MINERALS.map(m => [m.id, m]));

export function mineralTypeName(type) {
  const t = MINERAL_TYPES.find(x => x.id === type);
  return t ? t.name : type;
}

/* ---------------- 各形态 ---------------- */

function variantOf(m, n) {
  let h = 0;
  for (let i = 0; i < m.id.length; i++) h = (h * 31 + m.id.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

function drawGem(g, m, x, y) {
  const c1 = m.c1, c2 = m.c2, c3 = m.c3;
  const v = variantOf(m, 4);

  if (v === 1) {
    /* 阶梯切工 */
    R(g, x - 6, y - 6, 12, 2, c2);
    R(g, x - 5, y - 4, 10, 8, c1);
    R(g, x - 4, y + 4, 8, 3, c2);
    R(g, x - 2, y + 7, 4, 2, c2);
    R(g, x - 4, y - 4, 2, 2, c3);
    R(g, x + 1, y - 4, 1, 6, c2);
    return;
  }
  if (v === 2) {
    /* 椭圆弧面 */
    ellipse(g, x, y, 7, 8, c2);
    ellipse(g, x - 1, y - 1, 5, 6, c1);
    R(g, x - 4, y - 4, 2, 2, c3);
    R(g, x + 1, y, 1, 4, c2);
    R(g, x - 6, y + 6, 12, 1, c2);
    return;
  }
  if (v === 3) {
    /* 长柱宝石 */
    R(g, x - 4, y - 8, 8, 4, c1);
    R(g, x - 5, y - 4, 10, 10, c1);
    R(g, x - 3, y + 6, 6, 3, c2);
    R(g, x - 3, y - 7, 2, 13, c3);
    R(g, x + 2, y - 6, 1, 11, c2);
    return;
  }

  /* 经典明亮式 */
  R(g, x - 5, y - 5, 10, 2, c1);
  R(g, x - 3, y - 7, 6, 2, c3);
  for (let i = 0; i <= 10; i++) {
    const w = Math.max(1, Math.round(6 * (1 - i / 10)));
    R(g, x - w, y - 3 + i, w * 2 + 1, 1, i < 4 ? c1 : c2);
  }
  line(g, x - 4, y - 4, x, y + 6, c3, 1);
  R(g, x - 2, y - 4, 1, 2, '#ffffff');
}

function drawCrystal(g, m, x, y) {
  const v = variantOf(m, 3);
  const spec = v === 0
    ? [[-6, 8, 3, m.c2], [0, 12, 4, m.c1], [6, 7, 3, m.c2]]
    : v === 1
      ? [[-4, 13, 4, m.c1], [5, 7, 3, m.c2]]
      : [[-8, 6, 2, m.c2], [-4, 10, 3, m.c1], [2, 12, 3, m.c2], [7, 6, 2, m.c1]];

  for (const [dx, h, w, c] of spec) {
    const top = y + 8 - h;
    R(g, x + dx - w, top + 2, w * 2, h - 2, c);
    R(g, x + dx - w + 1, top, w * 2 - 2, 2, m.c3);
    R(g, x + dx - 1, top, 2, 1, m.c3);
    line(g, x + dx, top + 1, x + dx, y + 8, m.c3, 1);
  }
  R(g, x - 9, y + 6, 18, 2, m.c2);
}

function drawRock(g, m, x, y) {
  const v = variantOf(m, 3);
  if (v === 1) {
    /* 棱角石块 */
    R(g, x - 8, y - 2, 16, 3, m.c2);
    R(g, x - 7, y - 5, 13, 3, m.c1);
    R(g, x - 9, y + 1, 18, 3, m.c1);
    R(g, x - 6, y + 4, 13, 2, m.c2);
    R(g, x - 4, y - 6, 3, 2, m.c3);
    R(g, x + 3, y, 2, 1, m.c3);
    R(g, x - 2, y + 3, 3, 1, m.c3);
    return;
  }
  if (v === 2) {
    /* 层状矿石 */
    ellipse(g, x, y + 2, 9, 6, m.c2);
    ellipse(g, x - 1, y, 8, 5, m.c1);
    for (let i = 0; i < 3; i++) R(g, x - 6 + i, y - 2 + i * 3, 12 - i * 2, 1, i % 2 ? m.c3 : m.c2);
    R(g, x - 5, y - 4, 2, 2, m.c3);
    R(g, x + 4, y + 4, 3, 1, m.c2);
    return;
  }

  ellipse(g, x, y + 2, 9, 6, m.c2);
  ellipse(g, x - 1, y, 8, 5, m.c1);
  const spots = [[-4, -1], [2, -2], [4, 2], [-2, 3], [0, 0], [6, -1]];
  for (let i = 0; i < spots.length; i++) {
    R(g, x + spots[i][0], y + spots[i][1], 1, 1, i % 2 ? m.c3 : m.c2);
  }
  R(g, x - 5, y - 5, 2, 2, m.c3);
  R(g, x + 5, y + 4, 3, 1, m.c2);
}

function drawShard(g, m, x, y) {
  const v = variantOf(m, 3);
  line(g, x, y + 8, x - 1, y - 7, m.c1, 3);
  line(g, x - 2, y + 8, x - 7, y - 1, m.c2, 2);
  if (v !== 1) line(g, x + 2, y + 8, x + 6, y - 4, m.c2, 2);
  line(g, x - 1, y - 7, x - 2, y - 2, m.c3, 1);
  R(g, x - 1, y - 8, 1, 2, m.c3);
  R(g, x + 5, y - 5, 1, 2, m.c1);
  R(g, x - 8, y - 2, 1, 2, m.c1);
  if (v === 1) {
    line(g, x + 5, y + 8, x + 4, y - 5, m.c1, 2);
    R(g, x + 3, y - 6, 2, 2, m.c3);
  }
  if (v === 2) {
    R(g, x - 9, y + 4, 4, 2, m.c2);
    R(g, x + 6, y + 3, 3, 2, m.c2);
  }
  R(g, x - 7, y + 6, 13, 2, m.c2);
}

function drawOrb(g, m, x, y) {
  const v = variantOf(m, 3);
  ellipse(g, x, y, 9, 7, m.c2);
  ellipse(g, x - 1, y - 1, 8, 6, m.c1);
  if (v === 1) {
    /* 同心环 */
    ellipse(g, x, y, 5, 4, m.c2);
    ellipse(g, x, y, 3, 2, m.c3);
    R(g, x - 4, y - 4, 2, 2, m.c3);
    return;
  }
  if (v === 2) {
    /* 斑点/结晶 */
    R(g, x - 4, y - 3, 2, 2, m.c3);
    R(g, x + 2, y - 1, 1, 2, m.c3);
    R(g, x - 1, y + 3, 2, 1, m.c3);
    R(g, x + 4, y + 3, 2, 1, m.c2);
    return;
  }
  for (let i = 0; i < 3; i++) {
    R(g, x - 7 + i, y - 4 + i * 3, 13 - i * 2, 1, i % 2 ? m.c3 : m.c2);
  }
  R(g, x - 5, y - 5, 2, 2, m.c3);
  R(g, x + 4, y + 3, 2, 1, m.c2);
}

function drawPrismatic(g, m, x, y) {
  const colors = ['#f07a8a', '#f0c060', '#8ae07a', '#6ac0f0', '#b08af0'];
  /* 中央锯齿彩虹晶体 */
  const rows = [2, 3, 4, 4, 5, 6, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];
  for (let i = 0; i < rows.length; i++) {
    const w = rows[i];
    const c = colors[Math.floor(i / 4) % colors.length];
    R(g, x - w, y - 9 + i, w * 2 + 1, 1, c);
  }
  R(g, x - 1, y - 10, 2, 2, '#fff8e0');
  R(g, x - 5, y - 6, 1, 5, '#ffffff');
  /* 两侧小碎片 */
  R(g, x - 7, y + 2, 2, 5, colors[1]);
  R(g, x - 6, y + 1, 1, 1, colors[3]);
  R(g, x + 5, y + 4, 2, 4, colors[4]);
  R(g, x + 5, y + 3, 1, 1, colors[2]);
  R(g, x - 6, y + 9, 12, 2, '#8a8aa0');
}

function drawBlob(g, m, x, y) {
  ellipse(g, x, y + 2, 8, 5, m.c2);
  ellipse(g, x - 1, y, 7, 4, m.c1);
  R(g, x - 4, y - 7, 2, 4, m.c1);
  R(g, x + 1, y - 8, 2, 3, m.c1);
  R(g, x - 3, y - 2, 2, 1, m.c3);
  R(g, x + 2, y + 1, 1, 1, m.c3);
  R(g, x - 6, y + 5, 12, 1, m.c2);
}

/* 在 32×32 格子里画矿物图标 */
export function drawMineral(g, mineral, phase = 0.25) {
  const m = typeof mineral === 'string' ? MINERAL_MAP[mineral] : mineral;
  if (!m) return;
  const x = 16, y = 17;

  g.save();
  g.imageSmoothingEnabled = false;

  if (m.shape === 'gem') drawGem(g, m, x, y);
  else if (m.shape === 'crystal') drawCrystal(g, m, x, y);
  else if (m.shape === 'rock') drawRock(g, m, x, y);
  else if (m.shape === 'shard') drawShard(g, m, x, y);
  else if (m.shape === 'orb') drawOrb(g, m, x, y);
  else if (m.shape === 'prismatic') drawPrismatic(g, m, x, y);
  else if (m.shape === 'blob') drawBlob(g, m, x, y);
  else ellipse(g, x, y, 8, 6, m.c1);

  g.restore();
}
