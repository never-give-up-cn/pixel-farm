/* 星露谷资源图鉴：11 件工具 + 17 种矿石/锭 + 24 种材料 + 24 种采集物 + 24 件古物。
 * 全部画在 32×32 格子里，程序化绘制。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const RES_W = 32;
export const RES_H = 32;

export const RES_CATS = [
  { id: 'all', name: '全部' },
  { id: 'tool', name: '工具' },
  { id: 'ore', name: '矿石' },
  { id: 'material', name: '材料' },
  { id: 'forage', name: '采集' },
  { id: 'artifact', name: '古物' }
];

const C = {
  wood:      ['#b07a3a', '#6a4a2a', '#e0b070'],
  darkwood:  ['#6a4a2a', '#3a2418', '#9a6a3a'],
  iron:      ['#c8d0d8', '#7a8490', '#f0f4f8'],
  steel:     ['#b8c8d8', '#6a7a8a', '#e8f0f8'],
  silver:    ['#d0d8e0', '#8a95a0', '#ffffff'],
  copper:    ['#c07a3a', '#8a4a1a', '#f0b070'],
  gold:      ['#e0c060', '#a08020', '#fff0a0'],
  iridium:   ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  coal:      ['#3a3a42', '#1a1a22', '#6a6a78'],
  quartz:    ['#d0e8f0', '#8ab0c0', '#ffffff'],
  fire:      ['#e05a2a', '#a02a0a', '#f0c060'],
  frozen:    ['#8ad0e0', '#3a8aa0', '#d0f8ff'],
  earth:     ['#b08a50', '#7a5a2a', '#e0c090'],
  cinder:    ['#d06a2a', '#8a3a0a', '#f0b060'],
  radioactive:['#6ac04a', '#3a7a2a', '#b0f080'],
  stone:     ['#8a8a7a', '#5a5a4a', '#c0c0a0'],
  clay:      ['#c08a6a', '#8a5a3a', '#e0b090'],
  fiber:     ['#8ac04a', '#5a8a2a', '#c0f080'],
  sap:       ['#d0a040', '#8a6a20', '#f0d080'],
  syrup:     ['#c08030', '#7a4a10', '#e0c080'],
  resin:     ['#e0b050', '#a07020', '#ffe0a0'],
  tar:       ['#3a3a32', '#1a1a14', '#6a6a5a'],
  battery:   ['#d0c040', '#8a7a20', '#fff0a0'],
  solar:     ['#f0c040', '#a08020', '#fff8c0'],
  void:      ['#6a3a8a', '#3a1a5a', '#b07ad0'],
  slime:     ['#5aa04a', '#3a6a2a', '#a0d060'],
  bug:       ['#8a5a3a', '#5a3418', '#c09060'],
  bone:      ['#e8e0c8', '#b0a888', '#fff8e0'],
  cloth:     ['#e0d8c0', '#b0a080', '#fff8e0'],
  hay:       ['#d8b050', '#9a7020', '#f0d890'],
  moss:      ['#5a8a3a', '#3a5a1a', '#a0d060'],
  algae:     ['#4a8a5a', '#2a5a3a', '#a0e0b0'],
  coral:     ['#e08a70', '#a04a3a', '#f0c0a0'],
  flower:    ['#e8d050', '#b09020', '#fff8b0'],
  daffodil:  ['#f0e060', '#b0a020', '#fff8b0'],
  pink:      ['#e08ab0', '#a04a70', '#ffc0d8'],
  purple:    ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  red:       ['#d04a3a', '#8a2a1a', '#f08a70'],
  blue:      ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  green:     ['#5aa04a', '#3a6a2a', '#a0d080'],
  orange:    ['#e08a3a', '#a05a1a', '#f0c080'],
  white:     ['#f0f0e8', '#b0b0a8', '#ffffff'],
  brown:     ['#8a5a3a', '#5a3418', '#c09060'],
  tan:       ['#c8a878', '#8a6a40', '#f0d8a8'],
  teal:      ['#4ac0b0', '#2a8070', '#a0f0e0'],
  rainbow:   ['#d04a6a', '#4a8ac0', '#f0e060']
};

const TRIMS = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0', '#e08a3a', '#4ac0c0'];

/* [id, 中文名, 英文名, 分组, 造型, 配色] */
const RAW = [
  ['hoe','锄头','Hoe','tool','hoe','wood'],
  ['pickaxe','镐','Pickaxe','tool','pickaxe','steel'],
  ['axe','斧头','Axe','tool','axe','steel'],
  ['watering_can','洒水壶','Watering Can','tool','can','iron'],
  ['fishing_rod','鱼竿','Fishing Rod','tool','rod','wood'],
  ['scythe','镰刀','Scythe','tool','scythe','steel'],
  ['milk_pail','挤奶桶','Milk Pail','tool','pail','iron'],
  ['shears','剪刀','Shears','tool','shears','silver'],
  ['copper_pan','铜锅','Copper Pan','tool','pan','copper'],
  ['return_scepter','回城魔杖','Return Scepter','tool','scepter','gold'],
  ['training_rod','训练鱼竿','Training Rod','tool','rod','tan'],

  ['copper_ore','铜矿石','Copper Ore','ore','ore','copper'],
  ['iron_ore','铁矿石','Iron Ore','ore','ore','iron'],
  ['gold_ore','金矿石','Gold Ore','ore','ore','gold'],
  ['iridium_ore','铱矿石','Iridium Ore','ore','ore','iridium'],
  ['coal','煤炭','Coal','ore','coal','coal'],
  ['quartz','石英','Quartz','ore','crystal','quartz'],
  ['refined_quartz','精炼石英','Refined Quartz','ore','crystal','white'],
  ['fire_quartz','火石英','Fire Quartz','ore','crystal','fire'],
  ['frozen_tear','冰冻泪','Frozen Tear','ore','crystal','frozen'],
  ['earth_crystal','大地水晶','Earth Crystal','ore','crystal','earth'],
  ['copper_bar','铜锭','Copper Bar','ore','bar','copper'],
  ['iron_bar','铁锭','Iron Bar','ore','bar','iron'],
  ['gold_bar','金锭','Gold Bar','ore','bar','gold'],
  ['iridium_bar','铱锭','Iridium Bar','ore','bar','iridium'],
  ['radioactive_ore','放射性矿石','Radioactive Ore','ore','ore','radioactive'],
  ['radioactive_bar','放射性锭','Radioactive Bar','ore','bar','radioactive'],
  ['cinder_shard','煤渣碎片','Cinder Shard','ore','crystal','cinder'],

  ['wood','木材','Wood','material','log','wood'],
  ['hardwood','硬木','Hardwood','material','log','darkwood'],
  ['stone','石头','Stone','material','stone','stone'],
  ['fiber','纤维','Fiber','material','fiber','fiber'],
  ['clay','黏土','Clay','material','clay','clay'],
  ['sap','树液','Sap','material','sap','sap'],
  ['maple_syrup','枫糖浆','Maple Syrup','material','bottle','syrup'],
  ['oak_resin','橡树树脂','Oak Resin','material','bottle','resin'],
  ['pine_tar','松焦油','Pine Tar','material','bottle','tar'],
  ['battery_pack','电池组','Battery Pack','material','battery','battery'],
  ['solar_essence','太阳精华','Solar Essence','material','essence','solar'],
  ['void_essence','虚空精华','Void Essence','material','essence','void'],
  ['slime','史莱姆','Slime','material','slime','slime'],
  ['bug_meat','虫肉','Bug Meat','material','meat','bug'],
  ['bat_wing','蝙蝠翅膀','Bat Wing','material','wing','purple'],
  ['bone_fragment','骨头碎片','Bone Fragment','material','bone','bone'],
  ['cloth','布料','Cloth','material','cloth','cloth'],
  ['hay','干草','Hay','material','hay','hay'],
  ['moss','苔藓','Moss','material','moss','moss'],
  ['seaweed','海草','Seaweed','material','algae','algae'],
  ['green_algae','绿藻','Green Algae','material','algae','green'],
  ['white_algae','白藻','White Algae','material','algae','white'],
  ['coral','珊瑚','Coral','material','coral','coral'],
  ['driftwood','浮木','Driftwood','material','log','tan'],

  ['wild_horseradish','野山葵','Wild Horseradish','forage','root','brown'],
  ['daffodil','黄水仙','Daffodil','forage','flower','daffodil'],
  ['leek','韭葱','Leek','forage','root','green'],
  ['dandelion','蒲公英','Dandelion','forage','flower','flower'],
  ['spring_onion','春葱','Spring Onion','forage','onion','green'],
  ['salmonberry','鲑莓','Salmonberry','forage','berry','red'],
  ['morel','羊肚菌','Morel','forage','mushroom','brown'],
  ['fiddlehead_fern','蕨菜','Fiddlehead Fern','forage','fern','green'],
  ['spice_berry','香辛料莓','Spice Berry','forage','berry','orange'],
  ['grape','葡萄','Grape','forage','berry','purple'],
  ['sweet_pea','香豌豆','Sweet Pea','forage','flower','pink'],
  ['common_mushroom','普通蘑菇','Common Mushroom','forage','mushroom','tan'],
  ['red_mushroom','红蘑菇','Red Mushroom','forage','mushroom','red'],
  ['purple_mushroom','紫蘑菇','Purple Mushroom','forage','mushroom','purple'],
  ['hazelnut','榛子','Hazelnut','forage','nut','brown'],
  ['blackberry','黑莓','Blackberry','forage','berry','night'],
  ['chanterelle','鸡油菌','Chanterelle','forage','mushroom','orange'],
  ['winter_root','冬根','Winter Root','forage','root','tan'],
  ['crystal_fruit','水晶果','Crystal Fruit','forage','berry','frozen'],
  ['snow_yam','雪山药','Snow Yam','forage','root','white'],
  ['crocus','番红花','Crocus','forage','flower','purple'],
  ['coconut','椰子','Coconut','forage','coconut','brown'],
  ['cactus_fruit','仙人掌果','Cactus Fruit','forage','cactus','pink'],
  ['cave_carrot','山洞萝卜','Cave Carrot','forage','root','orange'],

  ['ancient_doll','古代玩偶','Ancient Doll','artifact','doll','tan'],
  ['ancient_sword','古代剑','Ancient Sword','artifact','sword','bone'],
  ['arrowhead','箭头','Arrowhead','artifact','arrowhead','stone'],
  ['bone_flute','骨笛','Bone Flute','artifact','flute','bone'],
  ['chicken_statue','鸡雕像','Chicken Statue','artifact','statue','stone'],
  ['dinosaur_egg','恐龙蛋','Dinosaur Egg','artifact','egg','tan'],
  ['dwarf_gadget','矮人小工具','Dwarf Gadget','artifact','gadget','copper'],
  ['dwarf_scroll_1','矮人卷轴 I','Dwarf Scroll I','artifact','scroll','tan'],
  ['dwarf_scroll_2','矮人卷轴 II','Dwarf Scroll II','artifact','scroll','green'],
  ['dwarf_scroll_3','矮人卷轴 III','Dwarf Scroll III','artifact','scroll','blue'],
  ['dwarf_scroll_4','矮人卷轴 IV','Dwarf Scroll IV','artifact','scroll','red'],
  ['elvish_jewelry','精灵珠宝','Elvish Jewelry','artifact','jewelry','gold'],
  ['fossilized_skull','化石头骨','Fossilized Skull','artifact','skull','bone'],
  ['golden_mask','黄金面具','Golden Mask','artifact','mask','gold'],
  ['golden_relic','黄金遗物','Golden Relic','artifact','relic','gold'],
  ['prehistoric_handaxe','史前手斧','Prehistoric Handaxe','artifact','handaxe','stone'],
  ['prehistoric_rib','史前肋骨','Prehistoric Rib','artifact','rib','bone'],
  ['prehistoric_skull','史前头骨','Prehistoric Skull','artifact','skull','stone'],
  ['prehistoric_tool','史前工具','Prehistoric Tool','artifact','tool','stone'],
  ['rare_disc','稀有圆盘','Rare Disc','artifact','disc','gold'],
  ['rusty_cog','生锈齿轮','Rusty Cog','artifact','cog','iron'],
  ['rusty_spoon','生锈汤匙','Rusty Spoon','artifact','spoon','iron'],
  ['snake_skull','蛇头骨','Snake Skull','artifact','snake_skull','bone'],
  ['strange_doll','奇怪玩偶','Strange Doll','artifact','doll','purple']
];

function pal(key) {
  const c = C[key] || C.tan;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const RESOURCES = RAW.map(([id, name, en, group, style, p]) => ({
  id, name, en, group, style, ...pal(p)
}));
export const RES_MAP = Object.fromEntries(RESOURCES.map(r => [r.id, r]));

export function resCatName(cat) {
  const c = RES_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------------- 工具 ---------------- */

function drawTool(g, it) {
  const trim = TRIMS[hashOf(it.id) % TRIMS.length];
  if (it.style === 'hoe' || it.style === 'pickaxe' || it.style === 'axe') {
    line(g, 9, 26, 23, 8, '#8a5a2a', 2);
    line(g, 10, 25, 23, 8, '#b07a3a', 1);
    if (it.style === 'hoe') {
      line(g, 20, 6, 27, 10, it.c2, 5);
      line(g, 21, 7, 26, 10, it.c1, 3);
      R(g, 26, 9, 3, 2, it.c3);
    } else if (it.style === 'pickaxe') {
      line(g, 15, 4, 28, 12, it.c2, 4);
      line(g, 16, 5, 27, 12, it.c1, 2);
      line(g, 14, 5, 25, 14, it.c2, 2);
      R(g, 27, 11, 3, 3, it.c3);
    } else {
      line(g, 18, 5, 27, 13, it.c2, 7);
      line(g, 19, 6, 26, 12, it.c1, 5);
      R(g, 26, 11, 3, 4, it.c3);
    }
    R(g, 7, 27, 4, 3, trim);
    return;
  }
  if (it.style === 'can') {
    R(g, 9, 13, 15, 12, it.c2);
    R(g, 10, 14, 13, 10, it.c1);
    R(g, 11, 15, 2, 8, it.c3);
    line(g, 24, 16, 29, 9, it.c2, 4);
    line(g, 25, 15, 29, 10, it.c1, 2);
    R(g, 27, 6, 4, 4, it.c3);
    line(g, 12, 12, 20, 12, it.c2, 2);
    R(g, 12, 10, 8, 2, it.c2);
    R(g, 8, 24, 4, 3, trim);
    return;
  }
  if (it.style === 'rod') {
    line(g, 7, 27, 25, 5, '#8a5a2a', 2);
    line(g, 8, 26, 25, 5, it.c1, 1);
    line(g, 25, 5, 27, 20, '#d8d0c0', 1);
    R(g, 26, 20, 2, 3, it.c3);
    ellipse(g, 9, 24, 2, 2, it.c2);
    R(g, 8, 23, 3, 3, it.c1);
    return;
  }
  if (it.style === 'scythe') {
    line(g, 8, 27, 21, 7, '#8a5a2a', 2);
    line(g, 9, 26, 21, 7, it.c1, 1);
    for (let i = 0; i < 9; i++) R(g, 20 - i, 6 + i, 2, 2, i < 3 ? it.c3 : it.c2);
    R(g, 6, 27, 5, 3, trim);
    return;
  }
  if (it.style === 'pail') {
    R(g, 8, 12, 16, 15, it.c2);
    R(g, 9, 13, 14, 13, it.c1);
    R(g, 10, 14, 2, 10, it.c3);
    line(g, 8, 12, 16, 5, it.c2, 2);
    line(g, 16, 5, 24, 12, it.c2, 2);
    R(g, 15, 4, 3, 2, trim);
    R(g, 8, 26, 16, 2, it.c2);
    return;
  }
  if (it.style === 'shears') {
    line(g, 8, 26, 21, 7, it.c2, 2);
    line(g, 10, 26, 23, 9, it.c1, 2);
    ellipse(g, 7, 26, 3, 3, it.c2);
    ellipse(g, 10, 28, 3, 3, it.c2);
    R(g, 20, 5, 3, 4, it.c3);
    R(g, 22, 8, 3, 3, it.c3);
    return;
  }
  if (it.style === 'pan') {
    ellipse(g, 14, 18, 8, 7, it.c2);
    ellipse(g, 14, 17, 7, 6, it.c1);
    ellipse(g, 14, 17, 5, 4, it.c3);
    line(g, 21, 21, 28, 27, it.c2, 3);
    R(g, 27, 26, 3, 3, it.c1);
    return;
  }
  if (it.style === 'scepter') {
    line(g, 10, 28, 22, 7, it.c2, 3);
    line(g, 11, 27, 22, 7, it.c1, 1);
    ellipse(g, 23, 6, 4, 4, it.c3);
    ellipse(g, 23, 6, 2, 2, '#ffffff');
    R(g, 21, 3, 1, 2, it.c1);
    R(g, 25, 8, 2, 1, it.c1);
    return;
  }
}

/* ---------------- 矿石 / 材料 ---------------- */

function drawOre(g, it) {
  if (it.style === 'bar') {
    R(g, 6, 18, 20, 4, it.c2);
    R(g, 7, 19, 18, 2, it.c1);
    R(g, 8, 14, 16, 5, it.c2);
    R(g, 9, 15, 14, 3, it.c1);
    R(g, 10, 15, 8, 1, it.c3);
    R(g, 7, 22, 18, 2, it.c2);
    R(g, 9, 24, 14, 2, it.c2);
    return;
  }
  if (it.style === 'coal') {
    ellipse(g, 16, 19, 9, 7, it.c2);
    ellipse(g, 15, 18, 7, 5, it.c1);
    R(g, 11, 14, 3, 3, it.c2);
    R(g, 20, 15, 3, 3, it.c2);
    R(g, 13, 18, 2, 2, it.c3);
    R(g, 18, 21, 2, 2, it.c3);
    return;
  }
  if (it.style === 'crystal') {
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 5;
      const h = 8 + (i % 3) * 4;
      for (let j = 0; j < h; j++) R(g, x + Math.floor(j / 4), 25 - j, 3 - Math.floor(j / 5), 1, j < 3 ? it.c3 : it.c1);
    }
    R(g, 7, 24, 18, 2, it.c2);
    R(g, 11, 13, 2, 1, '#ffffff');
    return;
  }
  ellipse(g, 16, 20, 10, 7, it.c2);
  ellipse(g, 15, 19, 8, 6, it.c1);
  R(g, 11, 15, 4, 2, it.c2);
  for (let i = 0; i < 5; i++) R(g, 10 + (i * 3) % 12, 16 + (i * 2) % 8, 2, 2, it.c3);
  R(g, 9, 23, 14, 2, it.c2);
}

function drawMaterial(g, it) {
  if (it.style === 'log') {
    R(g, 7, 12, 18, 14, it.c2);
    R(g, 8, 13, 16, 12, it.c1);
    R(g, 9, 14, 2, 10, it.c3);
    ellipse(g, 24, 19, 3, 6, it.c2);
    ellipse(g, 24, 19, 2, 5, it.c3);
    R(g, 24, 16, 1, 6, it.c2);
    R(g, 8, 26, 16, 2, it.c2);
    return;
  }
  if (it.style === 'stone') {
    ellipse(g, 16, 20, 9, 7, it.c2);
    ellipse(g, 15, 19, 7, 5, it.c1);
    R(g, 11, 14, 3, 2, it.c2);
    R(g, 12, 18, 3, 2, it.c3);
    R(g, 19, 20, 2, 2, it.c3);
    R(g, 9, 24, 14, 2, it.c2);
    return;
  }
  if (it.style === 'fiber') {
    for (let i = 0; i < 6; i++) {
      line(g, 16, 26, 8 + i * 3, 8 + (i % 3) * 3, i % 2 ? it.c1 : it.c2, 1);
    }
    R(g, 10, 25, 13, 3, it.c2);
    R(g, 9, 23, 15, 2, it.c1);
    R(g, 12, 23, 9, 1, it.c3);
    return;
  }
  if (it.style === 'clay') {
    ellipse(g, 16, 20, 9, 7, it.c2);
    ellipse(g, 15, 19, 7, 5, it.c1);
    R(g, 12, 15, 3, 2, it.c3);
    R(g, 20, 21, 2, 2, it.c3);
    return;
  }
  if (it.style === 'sap') {
    for (let i = 0; i < 8; i++) ellipse(g, 16, 8 + i * 2, 2 + (i % 3), 2, i < 2 ? it.c3 : it.c1);
    ellipse(g, 16, 24, 6, 4, it.c2);
    R(g, 13, 23, 3, 2, it.c3);
    return;
  }
  if (it.style === 'bottle') {
    R(g, 12, 10, 8, 16, it.c2);
    R(g, 13, 11, 6, 14, it.c1);
    R(g, 14, 12, 4, 2, it.c3);
    R(g, 14, 16, 4, 8, it.c1);
    R(g, 13, 16, 1, 8, it.c3);
    R(g, 14, 7, 4, 4, it.c2);
    R(g, 15, 5, 2, 3, it.c2);
    R(g, 15, 4, 2, 2, it.c1);
    return;
  }
  if (it.style === 'battery') {
    R(g, 10, 9, 12, 18, it.c2);
    R(g, 11, 10, 10, 16, it.c1);
    R(g, 13, 6, 2, 4, it.c2);
    R(g, 17, 6, 2, 4, it.c2);
    R(g, 13, 12, 6, 2, it.c3);
    R(g, 15, 11, 2, 4, it.c3);
    R(g, 11, 26, 10, 2, it.c2);
    return;
  }
  if (it.style === 'essence') {
    ellipse(g, 16, 17, 8, 8, it.c2);
    ellipse(g, 16, 16, 6, 6, it.c1);
    ellipse(g, 14, 14, 3, 3, it.c3);
    R(g, 15, 26, 2, 4, it.c2);
    R(g, 11, 10, 2, 2, it.c3);
    R(g, 21, 20, 2, 2, it.c3);
    return;
  }
  if (it.style === 'slime') {
    ellipse(g, 16, 21, 9, 6, it.c2);
    ellipse(g, 16, 19, 8, 6, it.c1);
    ellipse(g, 14, 17, 4, 3, it.c3);
    R(g, 12, 18, 2, 2, '#1a1a1a');
    R(g, 19, 18, 2, 2, '#1a1a1a');
    R(g, 10, 24, 12, 2, it.c2);
    return;
  }
  if (it.style === 'meat') {
    ellipse(g, 16, 19, 8, 6, it.c2);
    ellipse(g, 15, 18, 6, 4, it.c1);
    R(g, 12, 16, 2, 2, it.c3);
    R(g, 19, 21, 2, 2, it.c2);
    R(g, 14, 24, 5, 2, it.c2);
    return;
  }
  if (it.style === 'wing') {
    line(g, 9, 21, 23, 8, it.c2, 5);
    line(g, 10, 21, 22, 9, it.c1, 3);
    for (let i = 0; i < 3; i++) line(g, 12 + i * 4, 18 - i * 4, 9 + i * 4, 13 - i * 3, it.c3, 1);
    R(g, 7, 20, 3, 3, it.c2);
    return;
  }
  if (it.style === 'bone') {
    line(g, 8, 24, 22, 8, it.c2, 4);
    line(g, 9, 23, 22, 8, it.c1, 2);
    ellipse(g, 7, 25, 3, 3, it.c1);
    ellipse(g, 23, 7, 3, 3, it.c1);
    R(g, 14, 17, 2, 2, it.c2);
    return;
  }
  if (it.style === 'cloth') {
    R(g, 6, 12, 20, 12, it.c2);
    R(g, 7, 13, 18, 10, it.c1);
    for (let i = 0; i < 4; i++) R(g, 8, 15 + i * 2, 16, 1, it.c3);
    R(g, 8, 24, 16, 2, it.c2);
    R(g, 24, 14, 3, 8, it.c2);
    return;
  }
  if (it.style === 'hay') {
    for (let i = 0; i < 6; i++) line(g, 8 + i * 3, 27, 10 + i * 2, 8, i % 2 ? it.c1 : it.c3, 1);
    R(g, 6, 21, 20, 4, it.c2);
    R(g, 7, 22, 18, 2, it.c1);
    R(g, 9, 23, 14, 1, it.c3);
    return;
  }
  if (it.style === 'moss') {
    for (let i = 0; i < 8; i++) ellipse(g, 7 + (i * 5) % 18, 14 + (i * 7) % 12, 3, 2, i % 2 ? it.c1 : it.c2);
    R(g, 8, 25, 16, 2, it.c2);
    return;
  }
  if (it.style === 'algae') {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 6; j++) R(g, 10 + i * 4 + Math.sin(j * 0.8) * 2, 9 + j * 3, 3, 2, j % 2 ? it.c1 : it.c2);
    }
    return;
  }
  if (it.style === 'coral') {
    line(g, 16, 27, 16, 15, it.c2, 3);
    line(g, 16, 20, 10, 13, it.c2, 3);
    line(g, 16, 20, 22, 11, it.c2, 3);
    line(g, 10, 13, 8, 8, it.c1, 2);
    line(g, 22, 11, 25, 6, it.c1, 2);
    R(g, 14, 9, 3, 3, it.c3);
    R(g, 8, 7, 2, 2, it.c3);
    R(g, 24, 5, 2, 2, it.c3);
    return;
  }
}

/* ---------------- 采集 ---------------- */

function drawForage(g, it) {
  if (it.style === 'flower' || it.style === 'onion') {
    if (it.style === 'onion') {
      line(g, 16, 27, 16, 13, it.c2, 2);
      line(g, 16, 18, 10, 10, it.c1, 2);
      line(g, 16, 18, 22, 9, it.c1, 2);
      R(g, 15, 24, 3, 4, it.c3);
      return;
    }
    line(g, 16, 27, 16, 14, it.c2, 2);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU - Math.PI / 2;
      ellipse(g, 16 + Math.cos(a) * 5, 12 + Math.sin(a) * 5, 3, 3, it.c1);
    }
    ellipse(g, 16, 12, 2, 2, it.c3);
    R(g, 9, 22, 5, 2, it.c2);
    R(g, 19, 24, 5, 2, it.c2);
    return;
  }
  if (it.style === 'root') {
    ellipse(g, 16, 21, 6, 8, it.c2);
    ellipse(g, 15, 20, 4, 6, it.c1);
    line(g, 16, 13, 16, 7, it.c2, 2);
    line(g, 16, 9, 11, 5, it.c1, 2);
    line(g, 16, 9, 21, 4, it.c1, 2);
    R(g, 14, 24, 4, 2, it.c3);
    return;
  }
  if (it.style === 'berry') {
    for (let i = 0; i < 6; i++) ellipse(g, 11 + (i % 3) * 5, 14 + Math.floor(i / 3) * 6, 3, 3, i % 2 ? it.c1 : it.c2);
    R(g, 12, 12, 3, 2, it.c3);
    R(g, 19, 18, 2, 2, it.c3);
    line(g, 16, 10, 16, 6, it.c2, 1);
    R(g, 17, 6, 4, 2, '#5aa04a');
    return;
  }
  if (it.style === 'mushroom') {
    ellipse(g, 16, 14, 9, 6, it.c2);
    ellipse(g, 16, 13, 8, 5, it.c1);
    R(g, 11, 12, 3, 2, it.c3);
    R(g, 18, 10, 3, 2, it.c3);
    R(g, 14, 17, 4, 9, it.c3);
    R(g, 15, 18, 2, 7, '#f0e8d0');
    R(g, 12, 24, 8, 2, it.c2);
    return;
  }
  if (it.style === 'fern') {
    line(g, 16, 28, 16, 12, it.c2, 1);
    for (let i = 0; i < 6; i++) {
      line(g, 16, 24 - i * 3, 10 + i, 18 - i * 2, it.c1, 1);
      line(g, 16, 24 - i * 3, 22 - i, 18 - i * 2, it.c1, 1);
    }
    ellipse(g, 16, 9, 3, 3, it.c3);
    R(g, 14, 26, 4, 2, it.c2);
    return;
  }
  if (it.style === 'nut') {
    ellipse(g, 16, 20, 6, 7, it.c2);
    ellipse(g, 16, 19, 5, 6, it.c1);
    R(g, 14, 14, 4, 3, it.c2);
    R(g, 15, 13, 2, 2, it.c3);
    R(g, 13, 22, 2, 2, it.c3);
    R(g, 14, 27, 4, 1, it.c2);
    return;
  }
  if (it.style === 'coconut') {
    ellipse(g, 16, 19, 8, 8, it.c2);
    ellipse(g, 15, 18, 6, 6, it.c1);
    R(g, 12, 15, 2, 2, '#5a3418');
    R(g, 18, 18, 2, 2, '#5a3418');
    R(g, 14, 22, 4, 1, it.c3);
    R(g, 9, 12, 3, 2, it.c2);
    return;
  }
  if (it.style === 'cactus') {
    ellipse(g, 16, 19, 7, 8, it.c2);
    ellipse(g, 16, 18, 6, 7, it.c1);
    R(g, 14, 14, 2, 2, it.c3);
    R(g, 18, 20, 2, 2, it.c3);
    R(g, 14, 23, 2, 2, it.c2);
    R(g, 17, 13, 1, 2, '#5aa04a');
    return;
  }
}

/* ---------------- 古物 ---------------- */

function drawArtifact(g, it) {
  if (it.style === 'doll') {
    R(g, 13, 8, 6, 6, it.c2);
    R(g, 14, 9, 4, 4, it.c1);
    R(g, 14, 10, 1, 1, '#1a1a1a');
    R(g, 17, 10, 1, 1, '#1a1a1a');
    R(g, 12, 14, 8, 9, it.c2);
    R(g, 13, 15, 6, 7, it.c1);
    R(g, 14, 16, 4, 1, it.c3);
    R(g, 10, 16, 2, 6, it.c2);
    R(g, 20, 16, 2, 6, it.c2);
    R(g, 13, 23, 2, 5, it.c2);
    R(g, 17, 23, 2, 5, it.c2);
    return;
  }
  if (it.style === 'sword') {
    line(g, 8, 26, 23, 7, it.c2, 4);
    line(g, 9, 25, 22, 7, it.c1, 2);
    line(g, 8, 22, 14, 28, it.c3, 2);
    line(g, 8, 27, 5, 29, it.c2, 2);
    R(g, 21, 5, 3, 3, it.c3);
    return;
  }
  if (it.style === 'arrowhead') {
    for (let i = 0; i < 6; i++) R(g, 13 + i, 9 + i, 5 - i, 2, i < 2 ? it.c3 : it.c1);
    R(g, 12, 15, 8, 3, it.c2);
    R(g, 14, 18, 4, 6, it.c2);
    R(g, 13, 23, 6, 2, it.c3);
    return;
  }
  if (it.style === 'flute') {
    line(g, 8, 22, 24, 10, it.c2, 4);
    line(g, 9, 21, 23, 10, it.c1, 2);
    R(g, 12, 17, 2, 2, '#2a1a14');
    R(g, 17, 14, 2, 2, '#2a1a14');
    R(g, 21, 11, 2, 2, '#2a1a14');
    R(g, 6, 23, 4, 3, it.c1);
    return;
  }
  if (it.style === 'statue') {
    R(g, 10, 25, 12, 4, it.c2);
    R(g, 10, 15, 12, 10, it.c2);
    R(g, 11, 16, 10, 8, it.c1);
    ellipse(g, 16, 11, 4, 4, it.c1);
    R(g, 14, 10, 1, 1, '#1a1a1a');
    R(g, 17, 10, 1, 1, '#1a1a1a');
    R(g, 15, 13, 3, 1, it.c3);
    R(g, 14, 20, 4, 1, it.c3);
    return;
  }
  if (it.style === 'egg') {
    ellipse(g, 16, 18, 7, 9, it.c2);
    ellipse(g, 15, 17, 5, 7, it.c1);
    R(g, 12, 15, 2, 2, it.c3);
    R(g, 18, 20, 2, 2, it.c2);
    R(g, 15, 24, 3, 1, it.c3);
    return;
  }
  if (it.style === 'gadget') {
    R(g, 9, 12, 14, 12, it.c2);
    R(g, 10, 13, 12, 10, it.c1);
    R(g, 12, 15, 8, 6, '#3a3a42');
    R(g, 13, 16, 2, 2, it.c3);
    R(g, 17, 18, 2, 2, it.c3);
    R(g, 12, 9, 2, 3, it.c2);
    R(g, 18, 9, 2, 3, it.c2);
    return;
  }
  if (it.style === 'scroll') {
    R(g, 9, 8, 14, 17, it.c2);
    R(g, 10, 9, 12, 15, it.c1);
    for (let i = 0; i < 5; i++) R(g, 12, 12 + i * 2, 8, 1, it.c2);
    R(g, 8, 7, 16, 3, it.c2);
    R(g, 8, 24, 16, 3, it.c2);
    R(g, 9, 8, 14, 1, it.c3);
    return;
  }
  if (it.style === 'jewelry') {
    line(g, 8, 11, 16, 20, it.c2, 2);
    line(g, 24, 11, 16, 20, it.c2, 2);
    ellipse(g, 16, 21, 5, 4, it.c2);
    ellipse(g, 16, 21, 3, 2, it.c1);
    R(g, 15, 20, 2, 2, it.c3);
    R(g, 14, 9, 2, 2, it.c3);
    return;
  }
  if (it.style === 'mask') {
    ellipse(g, 16, 16, 8, 9, it.c2);
    ellipse(g, 16, 16, 7, 8, it.c1);
    R(g, 12, 13, 3, 3, '#1a1a1a');
    R(g, 18, 13, 3, 3, '#1a1a1a');
    R(g, 15, 18, 3, 2, it.c2);
    R(g, 13, 22, 7, 1, it.c2);
    R(g, 9, 10, 2, 2, it.c3);
    return;
  }
  if (it.style === 'relic') {
    for (let i = 0; i < 5; i++) R(g, 10 + i, 12 + i, 13 - i * 2, 1, i < 2 ? it.c3 : it.c1);
    R(g, 9, 20, 15, 4, it.c2);
    R(g, 12, 24, 9, 3, it.c2);
    R(g, 14, 17, 5, 3, it.c3);
    return;
  }
  if (it.style === 'handaxe') {
    line(g, 12, 27, 22, 8, it.c2, 3);
    line(g, 13, 26, 22, 8, it.c1, 1);
    R(g, 18, 5, 8, 8, it.c2);
    R(g, 19, 6, 6, 6, it.c1);
    R(g, 21, 8, 3, 3, it.c3);
    return;
  }
  if (it.style === 'rib') {
    line(g, 8, 26, 16, 7, it.c2, 3);
    line(g, 9, 25, 16, 7, it.c1, 1);
    for (let i = 0; i < 5; i++) line(g, 12 + i, 22 - i * 3, 22 + i, 17 - i * 3, it.c1, 2);
    R(g, 6, 25, 4, 3, it.c2);
    return;
  }
  if (it.style === 'skull') {
    ellipse(g, 16, 15, 8, 8, it.c2);
    ellipse(g, 16, 14, 7, 7, it.c1);
    R(g, 11, 12, 3, 3, '#1a1a1a');
    R(g, 18, 12, 3, 3, '#1a1a1a');
    R(g, 15, 16, 2, 2, '#1a1a1a');
    R(g, 12, 21, 9, 2, it.c2);
    R(g, 10, 19, 3, 2, it.c2);
    R(g, 20, 19, 3, 2, it.c2);
    return;
  }
  if (it.style === 'tool') {
    line(g, 10, 27, 22, 12, it.c2, 3);
    line(g, 11, 26, 21, 12, it.c1, 1);
    R(g, 18, 7, 8, 7, it.c2);
    R(g, 19, 8, 6, 5, it.c1);
    R(g, 22, 8, 2, 2, it.c3);
    return;
  }
  if (it.style === 'disc') {
    ellipse(g, 16, 16, 9, 9, it.c2);
    ellipse(g, 16, 16, 7, 7, it.c1);
    for (let i = 0; i < 3; i++) R(g, 12 + i * 3, 12 + i * 2, 6, 1, it.c3);
    R(g, 15, 21, 2, 3, it.c2);
    return;
  }
  if (it.style === 'cog') {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      R(g, 16 + Math.cos(a) * 8, 16 + Math.sin(a) * 8, 3, 3, it.c2);
    }
    ellipse(g, 16, 16, 7, 7, it.c2);
    ellipse(g, 16, 16, 5, 5, it.c1);
    ellipse(g, 16, 16, 2, 2, '#3a3a42');
    return;
  }
  if (it.style === 'spoon') {
    ellipse(g, 15, 11, 4, 5, it.c2);
    ellipse(g, 15, 11, 3, 4, it.c1);
    line(g, 16, 16, 21, 27, it.c2, 2);
    line(g, 17, 16, 21, 27, it.c1, 1);
    R(g, 13, 9, 3, 1, it.c3);
    return;
  }
  if (it.style === 'snake_skull') {
    ellipse(g, 16, 13, 7, 6, it.c2);
    ellipse(g, 16, 12, 6, 5, it.c1);
    R(g, 12, 11, 2, 2, '#1a1a1a');
    R(g, 18, 11, 2, 2, '#1a1a1a');
    R(g, 14, 16, 4, 3, it.c2);
    for (let i = 0; i < 4; i++) R(g, 15 + (i % 2), 20 + i * 2, 2, 2, it.c1);
    return;
  }
}

export function drawResourceIcon(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? RES_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (it.group === 'tool') drawTool(g, it);
  else if (it.group === 'ore') drawOre(g, it);
  else if (it.group === 'material') drawMaterial(g, it);
  else if (it.group === 'forage') drawForage(g, it);
  else drawArtifact(g, it);
  g.restore();
}
