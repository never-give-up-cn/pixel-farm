/* 星露谷衣物图鉴：64 件衬衫 + 16 件裤子 / 裙子。
 * 32×32 图标；同时提供 makeOutfit()，把上衣和裤子组合成农夫纸娃娃参数。 */

import { R, line, TAU } from './pixel.js';

export const CLOTH_W = 32;
export const CLOTH_H = 32;

export const CLOTH_CATS = [
  { id: 'all', name: '全部' },
  { id: 'shirt', name: '衬衫' },
  { id: 'pants', name: '裤子' }
];

const C = {
  blue:    ['#4a7ac0', '#2a5a8a', '#a0c0f0'],
  green:   ['#5aa04a', '#3a6a2a', '#a0d080'],
  mint:    ['#8ad0b0', '#5a9a7a', '#c0f0d8'],
  dark:    ['#3a3a4a', '#1a1a2a', '#8a8aa0'],
  tan:     ['#c8a878', '#8a6a40', '#f0d8a8'],
  purple:  ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  aqua:    ['#4ac0c0', '#2a7a7a', '#a0f0f0'],
  lime:    ['#a0d040', '#6a9a20', '#d0f080'],
  red:     ['#d04a3a', '#8a2a1a', '#f08a70'],
  orange:  ['#e08a3a', '#a05a1a', '#f0c080'],
  night:   ['#2a3a6a', '#1a2a4a', '#6a8ac0'],
  gray:    ['#8a8a9a', '#5a5a6a', '#c8c8d8'],
  brown:   ['#8a5a3a', '#5a3418', '#c09060'],
  white:   ['#f0f0e8', '#b0b0a8', '#ffffff'],
  pink:    ['#e08ab0', '#a04a70', '#ffc0d8'],
  black:   ['#2a2a32', '#121218', '#5a5a68'],
  silver:  ['#c8d0d8', '#7a8490', '#f0f4f8'],
  copper:  ['#c07a3a', '#8a4a1a', '#f0b070'],
  gold:    ['#e0c060', '#a08020', '#fff0a0'],
  iridium: ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  yellow:  ['#e8d050', '#b09020', '#fff8b0'],
  teal:    ['#4ac0b0', '#2a8070', '#a0f0e0'],
  rainbow: ['#d04a6a', '#4a8ac0', '#f0e060']
};

const TRIMS = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0', '#e08a3a', '#4ac0c0'];

/* [id, 中文名, 英文名, 版型, 图案, 配色] */
const SHIRT_RAW = [
  ['classic_overalls','经典背带裤','Classic Overalls','overalls','none','blue'],
  ['shirt','衬衫','Shirt','tshirt','none','white'],
  ['mint_blouse','薄荷衬衫','Mint Blouse','tshirt','none','mint'],
  ['dark_shirt','深色衬衫','Dark Shirt','tshirt','none','dark'],
  ['skull_shirt','骷髅衬衫','Skull Shirt','tshirt','skull','dark'],
  ['light_blue_shirt','浅蓝衬衫','Light Blue Shirt','tshirt','none','blue'],
  ['tan_striped_shirt','棕条纹衬衫','Tan Striped Shirt','tshirt','stripes','tan'],
  ['green_overalls','绿色背带裤','Green Overalls','overalls','none','green'],
  ['good_grief_shirt','“天哪”衬衫','"Good Grief" Shirt','tshirt','none','purple'],
  ['aquamarine_shirt','海蓝衬衫','Aquamarine Shirt','tshirt','none','aqua'],
  ['suit_top','西装上衣','Suit Top','suit','tie','dark'],
  ['green_belted_shirt','绿色束腰衬衫','Green Belted Shirt','tunic','none','green'],
  ['lime_striped_shirt','青柠条纹衬衫','Lime Green Striped Shirt','tshirt','stripes','lime'],
  ['red_striped_shirt','红色条纹衬衫','Red Striped Shirt','tshirt','stripes','red'],
  ['skeleton_shirt','骨架衬衫','Skeleton Shirt','tshirt','skeleton','dark'],
  ['orange_shirt','橙色衬衫','Orange Shirt','tshirt','none','orange'],
  ['night_sky_shirt','夜空衬衫','Night Sky Shirt','tshirt','star','night'],
  ['mayoral_suspenders','镇长背带','Mayoral Suspenders','overalls','none','gray'],
  ['brown_jacket','棕色夹克','Brown Jacket','jacket','none','brown'],
  ['sailor_shirt','水手衬衫','Sailor Shirt','sailor','none','white'],
  ['green_vest','绿色背心','Green Vest','vest','none','green'],
  ['yellow_green_shirt','黄绿衬衫','Yellow and Green Shirt','tshirt','none','lime'],
  ['work_shirt','工作衬衫','Work Shirt','tshirt','none','tan'],
  ['store_owner_jacket','店主夹克',"Store Owner's Jacket",'jacket','none','brown'],
  ['green_tunic','绿色束腰外衣','Green Tunic','tunic','none','green'],
  ['fancy_red_blouse','华丽红衬衫','Fancy Red Blouse','tshirt','none','red'],
  ['retro_rainbow_shirt','复古彩虹衫','Retro Rainbow Shirt','tshirt','rainbow','white'],
  ['lime_green_tunic','青柠束腰外衣','Lime Green Tunic','tunic','none','lime'],
  ['white_overalls_shirt','白色背带裤衬衫','White Overalls Shirt','overalls','none','white'],
  ['neat_bow_shirt','领结衬衫','Neat Bow Shirt','suit','bow','white'],
  ['shirt_and_tie','衬衫与领带','Shirt And Tie','suit','tie','white'],
  ['striped_shirt','条纹衬衫','Striped Shirt','tshirt','stripes','white'],
  ['tank_top','背心','Tank Top','tank','none','red'],
  ['cowboy_poncho','牛仔披风','Cowboy Poncho','poncho','none','brown'],
  ['crop_tank_top','短款背心','Crop Tank Top','tank','none','pink'],
  ['bikini_top','比基尼上衣','Bikini Top','tank','none','pink'],
  ['wumbus_shirt','Wumbus 衬衫','Wumbus Shirt','tshirt','slime','green'],
  ['80s_shirt','80 年代衬衫','80\'s Shirt','tshirt','rainbow','purple'],
  ['letterman_jacket','校队夹克','Letterman Jacket','jacket','none','red'],
  ['black_leather_jacket','黑色皮夹克','Black Leather Jacket','jacket','none','black'],
  ['strapped_top','吊带上衣','Strapped Top','tank','none','blue'],
  ['button_down_shirt','纽扣衬衫','Button Down Shirt','suit','none','white'],
  ['crop_top_shirt','短款衬衫','Crop Top Shirt','tshirt','none','pink'],
  ['tube_top','抹胸','Tube Top','tank','none','purple'],
  ['tie_dye_shirt','扎染衬衫','Tie Dye Shirt','tshirt','rainbow','aqua'],
  ['steel_breastplate','钢胸甲','Steel Breastplate','armor','none','silver'],
  ['copper_breastplate','铜胸甲','Copper Breastplate','armor','none','copper'],
  ['gold_breastplate','金胸甲','Gold Breastplate','armor','none','gold'],
  ['iridium_breastplate','铱胸甲','Iridium Breastplate','armor','none','iridium'],
  ['fake_muscles_shirt','假肌肉衫','Fake Muscles Shirt','tshirt','muscle','tan'],
  ['flannel_shirt','法兰绒衬衫','Flannel Shirt','flannel','none','red'],
  ['bomber_jacket','飞行夹克','Bomber Jacket','jacket','none','green'],
  ['caveman_shirt','穴居人衬衫','Caveman Shirt','tunic','none','brown'],
  ['fishing_vest','钓鱼背心','Fishing Vest','vest','none','tan'],
  ['fish_shirt','鱼衬衫','Fish Shirt','tshirt','fish','blue'],
  ['shirt_and_belt','衬衫与腰带','Shirt And Belt','tshirt','belt','white'],
  ['gray_hoodie','灰色连帽衫','Gray Hoodie','hoodie','none','gray'],
  ['blue_hoodie','蓝色连帽衫','Blue Hoodie','hoodie','none','blue'],
  ['red_hoodie','红色连帽衫','Red Hoodie','hoodie','none','red'],
  ['denim_jacket','牛仔夹克','Denim Jacket','jacket','none','blue'],
  ['track_jacket','运动夹克','Track Jacket','jacket','none','blue'],
  ['white_gi','白色道服','White Gi','tunic','none','white'],
  ['orange_gi','橙色道服','Orange Gi','tunic','none','orange'],
  ['kelp_shirt','海带衬衫','Kelp Shirt','tshirt','leaf','green']
];

/* [id, 中文名, 英文名, 版型, 配色] */
const PANT_RAW = [
  ['farmer_pants','农夫裤','Farmer Pants','pants','brown'],
  ['shorts','短裤','Shorts','shorts','blue'],
  ['long_dress','长裙','Long Dress','dress','purple'],
  ['skirt','裙子','Skirt','skirt','pink'],
  ['pleated_skirt','百褶裙','Pleated Skirt','skirt','blue'],
  ['dinosaur_pants','恐龙裤','Dinosaur Pants','pants','green'],
  ['grass_skirt','草裙','Grass Skirt','skirt','green'],
  ['genie_pants','精灵裤','Genie Pants','genie','purple'],
  ['baggy_pants','宽松裤','Baggy Pants','baggy','brown'],
  ['simple_dress','简约长裙','Simple Dress','dress','white'],
  ['relaxed_fit_pants','休闲裤','Relaxed Fit Pants','pants','tan'],
  ['relaxed_fit_shorts','休闲短裤','Relaxed Fit Shorts','shorts','tan'],
  ['prismatic_pants','彩虹裤','Prismatic Pants','pants','rainbow'],
  ['prismatic_genie_pants','彩虹精灵裤','Prismatic Genie Pants','genie','rainbow'],
  ['brown_overalls','棕色背带裤','Brown Overalls','pants','brown'],
  ['white_overalls','白色背带裤','White Overalls','pants','white']
];

function pal(key) {
  const c = C[key] || C.blue;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const SHIRTS = SHIRT_RAW.map(([id, name, en, style, pattern, p]) => ({
  id, name, en, group: 'shirt', style, pattern, ...pal(p)
}));

export const PANTS = PANT_RAW.map(([id, name, en, style, p]) => ({
  id, name, en, group: 'pants', style, ...pal(p)
}));

export const CLOTHES = [...SHIRTS, ...PANTS];
export const CLOTH_MAP = Object.fromEntries(CLOTHES.map(c => [c.id, c]));

export function clothCatName(cat) {
  const c = CLOTH_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* 生成 drawFarmer 使用的纸娃娃参数 */
export function makeOutfit(shirt, pants) {
  const sh = typeof shirt === 'string' ? CLOTH_MAP[shirt] : shirt;
  const pt = typeof pants === 'string' ? CLOTH_MAP[pants] : pants;
  const shirtStyle = sh ? sh.style : 'tshirt';
  const legStyle = shirtStyle === 'dress' ? 'dress' : (pt ? pt.style : 'pants');
  return {
    shirt: sh ? sh.c1 : '#f2ead2',
    shirtShade: sh ? sh.c2 : '#cfc3a0',
    shirtLight: sh ? sh.c3 : '#fff6e0',
    torso: shirtStyle,
    pattern: sh ? sh.pattern : 'none',
    sleeveless: shirtStyle === 'tank',
    pants: pt ? pt.c1 : '#3f6fb5',
    pantsShade: pt ? pt.c2 : '#2f5590',
    pantsLight: pt ? pt.c3 : '#6a9ad0',
    legStyle,
    skirt: shirtStyle === 'dress' ? (sh ? sh.c1 : '#8a5ac0') : (pt ? pt.c1 : (sh ? sh.c1 : '#8a5ac0'))
  };
}

/* ---------------- 图标绘制 ---------------- */

function shirtPattern(g, it, x, y, w, h) {
  const p = it.pattern;
  if (!p || p === 'none') return;
  if (p === 'stripes') {
    for (let i = 1; i < h; i += 3) R(g, x, y + i, w, 1, it.c2);
  } else if (p === 'dots') {
    for (let i = 0; i < 5; i++) R(g, x + 1 + (i * 3) % (w - 1), y + 1 + (i * 2) % (h - 1), 1, 1, it.c3);
  } else if (p === 'skull') {
    R(g, x + 3, y + 2, 5, 5, it.c3);
    R(g, x + 3, y + 3, 1, 1, it.c2);
    R(g, x + 6, y + 3, 1, 1, it.c2);
    R(g, x + 4, y + 5, 3, 1, it.c2);
  } else if (p === 'skeleton') {
    R(g, x + 1, y + 3, w - 1, 1, it.c3);
    R(g, x + 1, y + 6, w - 1, 1, it.c3);
    R(g, x + 4, y + 2, 1, 6, it.c3);
  } else if (p === 'star') {
    R(g, x + 4, y + 1, 1, 6, it.c3);
    R(g, x + 2, y + 3, 5, 1, it.c3);
    R(g, x + 3, y + 2, 3, 3, it.c3);
  } else if (p === 'rainbow') {
    const cols = [it.c1, it.c2, it.c3, '#e0c060', '#d04a3a'];
    for (let i = 0; i < w; i++) R(g, x + i, y, 1, h, cols[i % cols.length]);
  } else if (p === 'tie') {
    R(g, x + 4, y + 1, 2, 6, it.c3);
    R(g, x + 3, y + 7, 4, 1, it.c3);
  } else if (p === 'bow') {
    R(g, x + 2, y + 1, 2, 2, it.c3);
    R(g, x + 6, y + 1, 2, 2, it.c3);
    R(g, x + 4, y + 2, 2, 1, it.c2);
  } else if (p === 'slime') {
    R(g, x + 3, y + 3, 5, 4, it.c3);
    R(g, x + 2, y + 5, 7, 2, it.c3);
    R(g, x + 3, y + 4, 1, 1, it.c2);
    R(g, x + 7, y + 4, 1, 1, it.c2);
  } else if (p === 'muscle') {
    R(g, x + 2, y + 3, 2, 4, it.c3);
    R(g, x + 7, y + 3, 2, 4, it.c3);
    R(g, x + 5, y + 6, 1, 3, it.c2);
  } else if (p === 'fish') {
    R(g, x + 3, y + 4, 5, 2, it.c3);
    R(g, x + 2, y + 3, 1, 3, it.c3);
    R(g, x + 8, y + 3, 2, 2, it.c3);
    R(g, x + 4, y + 4, 1, 1, it.c2);
  } else if (p === 'leaf') {
    R(g, x + 4, y + 2, 1, 5, it.c3);
    R(g, x + 5, y + 2, 2, 1, it.c3);
    R(g, x + 3, y + 5, 2, 1, it.c3);
  } else if (p === 'belt') {
    R(g, x, y + 7, w, 2, it.c2);
    R(g, x + 4, y + 7, 2, 2, it.c3);
  }
}

function drawShirtIcon(g, it, phase) {
  const trim = TRIMS[hashOf(it.id) % TRIMS.length];
  const style = it.style;

  if (style === 'dress') {
    R(g, 10, 7, 12, 3, it.c2);
    R(g, 11, 8, 10, 8, it.c1);
    for (let i = 0; i < 5; i++) R(g, 9 - i, 16 + i * 2, 14 + i * 2, 2, i % 2 ? it.c2 : it.c1);
    R(g, 13, 8, 2, 2, it.c3);
    R(g, 17, 8, 2, 2, it.c3);
    return;
  }

  if (style === 'armor') {
    R(g, 7, 9, 18, 12, it.c2);
    R(g, 8, 10, 16, 10, it.c1);
    R(g, 10, 11, 12, 5, it.c2);
    R(g, 12, 12, 8, 3, it.c3);
    R(g, 14, 16, 4, 3, it.c2);
    R(g, 6, 7, 5, 3, it.c2);
    R(g, 21, 7, 5, 3, it.c2);
    return;
  }

  if (style === 'poncho') {
    R(g, 6, 8, 20, 10, it.c2);
    R(g, 7, 9, 18, 8, it.c1);
    R(g, 10, 17, 12, 5, it.c2);
    R(g, 11, 17, 10, 4, it.c1);
    for (let i = 0; i < 5; i++) line(g, 8 + i * 4, 18, 10 + i * 4, 22, it.c3, 1);
    return;
  }

  if (style === 'tank') {
    if (it.id === 'bikini_top') {
      R(g, 11, 9, 4, 3, it.c1);
      R(g, 17, 9, 4, 3, it.c1);
      R(g, 12, 8, 2, 2, it.c2);
      R(g, 18, 8, 2, 2, it.c2);
      R(g, 15, 10, 2, 2, it.c3);
      return;
    }
    if (it.id === 'crop_tank_top') {
      R(g, 10, 8, 12, 5, it.c2);
      R(g, 11, 9, 10, 3, it.c1);
      R(g, 14, 8, 4, 1, it.c3);
      R(g, 12, 13, 8, 1, it.c2);
      return;
    }
    R(g, 10, 8, 12, 13, it.c2);
    R(g, 11, 9, 10, 11, it.c1);
    R(g, 10, 7, 3, 3, it.c2);
    R(g, 19, 7, 3, 3, it.c2);
    R(g, 14, 8, 4, 2, it.c3);
    shirtPattern(g, it, 11, 10, 10, 9);
    return;
  }

  /* T 恤 / 夹克 / 背心 / 衬衫共用躯干 */
  R(g, 7, 9, 4, 6, it.c2);
  R(g, 21, 9, 4, 6, it.c2);
  R(g, 8, 9, 3, 5, it.c1);
  R(g, 21, 9, 3, 5, it.c1);
  R(g, 10, 8, 12, 13, it.c2);
  R(g, 11, 9, 10, 11, it.c1);
  R(g, 13, 8, 6, 2, it.c3);
  shirtPattern(g, it, 11, 10, 10, 9);

  if (style === 'overalls') {
    R(g, 11, 12, 10, 8, it.c1);
    R(g, 11, 9, 2, 4, it.c1);
    R(g, 19, 9, 2, 4, it.c1);
    R(g, 14, 12, 4, 4, it.c3);
    R(g, 14, 16, 4, 1, it.c2);
  } else if (style === 'jacket') {
    R(g, 9, 10, 3, 9, it.c2);
    R(g, 20, 10, 3, 9, it.c2);
    R(g, 14, 10, 4, 8, it.c1);
    R(g, 15, 10, 2, 1, it.c3);
  } else if (style === 'vest') {
    R(g, 11, 11, 3, 7, it.c2);
    R(g, 18, 11, 3, 7, it.c2);
    R(g, 15, 12, 2, 5, it.c3);
  } else if (style === 'suit') {
    R(g, 12, 10, 2, 8, it.c2);
    R(g, 18, 10, 2, 8, it.c2);
    R(g, 15, 10, 2, 6, it.c3);
  } else if (style === 'tunic') {
    if (it.id === 'green_belted_shirt') {
      R(g, 11, 15, 10, 2, it.c2);
      R(g, 15, 15, 2, 2, it.c3);
    } else if (it.id === 'green_tunic') {
      line(g, 13, 10, 16, 14, it.c3, 1);
      line(g, 19, 10, 16, 14, it.c3, 1);
      R(g, 15, 14, 2, 1, it.c2);
    } else {
      R(g, 11, 16, 10, 2, it.c2);
      R(g, 15, 16, 2, 2, it.c3);
    }
  } else if (style === 'hoodie') {
    R(g, 12, 7, 8, 3, it.c2);
    R(g, 13, 8, 6, 2, it.c1);
    R(g, 12, 15, 8, 2, it.c2);
  } else if (style === 'flannel') {
    for (let i = 0; i < 10; i += 3) R(g, 11 + i, 9, 1, 11, it.c2);
    for (let i = 0; i < 10; i += 3) R(g, 11, 11 + i, 10, 1, it.c3);
  } else if (style === 'sailor') {
    R(g, 13, 8, 6, 2, '#3a5a8a');
    R(g, 15, 10, 2, 3, '#d04a3a');
    R(g, 12, 16, 8, 1, '#3a5a8a');
  } else if (style === 'apron') {
    R(g, 12, 11, 8, 8, it.c2);
    R(g, 13, 12, 6, 6, it.c1);
    R(g, 14, 9, 2, 2, it.c3);
  } else if (style === 'sweater') {
    R(g, 11, 17, 10, 2, it.c2);
    for (let i = 0; i < 5; i++) R(g, 11 + i * 2, 18, 1, 1, it.c3);
  } else if (style === 'jersey') {
    R(g, 13, 11, 6, 5, it.c2);
    R(g, 14, 12, 4, 3, it.c3);
  } else if (style === 'raincoat') {
    R(g, 15, 10, 1, 8, it.c2);
    for (let i = 0; i < 3; i++) R(g, 17, 11 + i * 2, 1, 1, it.c3);
  } else if (style === 'toga') {
    line(g, 11, 9, 20, 16, it.c3, 1);
    R(g, 11, 15, 10, 2, it.c2);
  } else if (style === 'jester') {
    for (let i = 0; i < 5; i++) R(g, 11 + i * 2, 11 + (i % 3) * 2, 2, 2, i % 2 ? it.c2 : it.c3);
  }

  /* 领口与下摆 */
  R(g, 12, 8, 8, 1, it.c3);
  R(g, 12, 20, 8, 1, it.c2);
  /* 随机小徽章，避免同版型同配色完全一样 */
  const hh = hashOf(it.id);
  R(g, 11 + hh % 7, 12 + Math.floor(hh / 7) % 4, 1, 1, trim);
  sparkle(g, 23, 10, trim, phase);
}

function drawPantsIcon(g, it, phase) {
  const trim = TRIMS[hashOf(it.id) % TRIMS.length];
  const style = it.style;

  if (style === 'skirt' || style === 'dress') {
    R(g, 9, 8, 14, 3, it.c2);
    R(g, 10, 8, 12, 2, it.c1);
    for (let i = 0; i < 6; i++) R(g, 8 - i, 11 + i * 2, 16 + i * 2, 2, i % 2 ? it.c2 : it.c1);
    R(g, 13, 9, 6, 1, it.c3);
    R(g, 10, 22, 2, 5, it.c2);
    R(g, 15, 22, 2, 5, it.c2);
    R(g, 20, 22, 2, 5, it.c2);
    return;
  }

  if (style === 'shorts') {
    R(g, 8, 8, 16, 3, it.c2);
    R(g, 9, 8, 14, 2, it.c1);
    R(g, 9, 11, 6, 7, it.c1);
    R(g, 17, 11, 6, 7, it.c1);
    R(g, 9, 11, 2, 7, it.c3);
    R(g, 17, 11, 2, 7, it.c3);
    R(g, 9, 18, 6, 2, it.c2);
    R(g, 17, 18, 6, 2, it.c2);
    R(g, 15, 11, 2, 5, it.c2);
    R(g, 15, 8, 2, 2, trim);
    return;
  }

  if (style === 'genie') {
    R(g, 8, 8, 16, 4, it.c2);
    R(g, 9, 8, 14, 3, it.c1);
    R(g, 9, 12, 6, 8, it.c1);
    R(g, 17, 12, 6, 8, it.c1);
    R(g, 9, 20, 6, 2, it.c2);
    R(g, 17, 20, 6, 2, it.c2);
    R(g, 8, 22, 8, 2, it.c3);
    R(g, 16, 22, 8, 2, it.c3);
    R(g, 15, 9, 2, 4, trim);
    sparkle(g, 24, 13, trim, phase);
    return;
  }

  if (style === 'baggy') {
    R(g, 7, 8, 18, 4, it.c2);
    R(g, 8, 8, 16, 3, it.c1);
    R(g, 8, 12, 8, 12, it.c1);
    R(g, 16, 12, 8, 12, it.c1);
    R(g, 8, 12, 2, 12, it.c3);
    R(g, 16, 12, 2, 12, it.c3);
    R(g, 8, 24, 8, 2, it.c2);
    R(g, 16, 24, 8, 2, it.c2);
    R(g, 15, 8, 2, 2, trim);
    return;
  }

  /* 普通长裤 */
  R(g, 8, 8, 16, 3, it.c2);
  R(g, 9, 8, 14, 2, it.c1);
  R(g, 9, 11, 6, 14, it.c1);
  R(g, 17, 11, 6, 14, it.c1);
  R(g, 9, 11, 2, 14, it.c3);
  R(g, 17, 11, 2, 14, it.c3);
  R(g, 9, 24, 6, 2, it.c2);
  R(g, 17, 24, 6, 2, it.c2);
  R(g, 15, 11, 2, 5, it.c2);
  R(g, 15, 8, 2, 2, trim);
  if (it.id === 'prismatic_pants') {
    sparkle(g, 24, 14, '#ffffff', phase);
    sparkle(g, 7, 20, '#f0e060', phase + 0.3);
  }
}

function sparkle(g, x, y, color, phase) {
  const a = Math.sin(phase * TAU) * 0.5 + 0.5;
  if (a < 0.45) return;
  R(g, x, y, 1, 1, color);
  if (a > 0.8) {
    R(g, x - 1, y, 1, 1, color);
    R(g, x + 1, y, 1, 1, color);
  }
}

export function drawClothingIcon(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? CLOTH_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (it.group === 'pants') drawPantsIcon(g, it, phase);
  else drawShirtIcon(g, it, phase);
  g.restore();
}
