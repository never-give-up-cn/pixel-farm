/* 星露谷帽子图鉴：90 顶帽子 / 面具 / 头饰 / 头盔。
 * 帽子画在 32×32 格子里；同一套绘制也能叠到农夫头上做试戴预览。
 * 全部程序化绘制，不使用游戏原图。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const HAT_W = 32;
export const HAT_H = 32;

export const HAT_GROUPS = [
  { id: 'all', name: '全部' },
  { id: 'hat', name: '帽子' },
  { id: 'mask', name: '面具' },
  { id: 'head', name: '头饰' },
  { id: 'helmet', name: '头盔' },
  { id: 'special', name: '特殊' }
];

const C = {
  leather: ['#b07a3a', '#6a4a2a', '#e0b070'],
  straw:   ['#e0c060', '#a08020', '#fff0a0'],
  white:   ['#f0f0e8', '#b0b0a8', '#ffffff'],
  gray:    ['#8a8a9a', '#5a5a6a', '#c8c8d8'],
  dark:    ['#3a3a4a', '#1a1a2a', '#8a8aa0'],
  black:   ['#2a2a32', '#121218', '#5a5a68'],
  blue:    ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  green:   ['#5aa04a', '#3a6a2a', '#a0d080'],
  red:     ['#d04a3a', '#8a2a1a', '#f08a70'],
  pink:    ['#e08ab0', '#a04a70', '#ffc0d8'],
  purple:  ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  gold:    ['#e0c060', '#a08020', '#fff0a0'],
  silver:  ['#c8d0d8', '#7a8490', '#f0f4f8'],
  orange:  ['#e08a3a', '#a05a1a', '#f0c080'],
  yellow:  ['#e8d050', '#b09020', '#fff8b0'],
  brown:   ['#8a5a3a', '#5a3418', '#c09060'],
  tan:     ['#c8a878', '#8a6a40', '#f0d8a8'],
  copper:  ['#c07a3a', '#8a4a1a', '#f0b070'],
  iridium: ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  rainbow: ['#d04a6a', '#4a8ac0', '#f0e060'],
  teal:    ['#4ac0b0', '#2a8070', '#a0f0e0'],
  bone:    ['#e8e0c8', '#b0a888', '#fff8e0']
};

/* [id, 中文名, 英文名, 分组, 造型, 配色] */
const HAT_RAW = [
  ['cowboy_hat','牛仔帽','Cowboy Hat','hat','cowboy','leather'],
  ['bowler_hat','圆顶礼帽','Bowler Hat','hat','bowler','dark'],
  ['top_hat','高顶礼帽','Top Hat','hat','top','dark'],
  ['sombrero','墨西哥草帽','Sombrero','hat','sombrero','straw'],
  ['straw_hat','草帽','Straw Hat','hat','straw','straw'],
  ['official_cap','制服帽','Official Cap','hat','cap','blue'],
  ['blue_bonnet','蓝色软帽','Blue Bonnet','hat','bonnet','blue'],
  ['plum_chapeau','梅子帽','Plum Chapeau','hat','beret','purple'],
  ['earmuffs','耳罩','Earmuffs','hat','earmuffs','white'],
  ['hunters_cap','猎人帽',"Hunter's Cap",'hat','cap','brown'],
  ['trucker_hat','卡车帽','Trucker Hat','hat','cap','red'],
  ['sailors_cap','水手帽',"Sailor's Cap",'hat','cap','white'],
  ['good_ol_cap','旧棒球帽',"Good Ol' Cap",'hat','cap','tan'],
  ['fedora','软呢帽','Fedora','hat','fedora','gray'],
  ['cool_cap','酷帽','Cool Cap','hat','cap','blue'],
  ['gnomes_cap','地精帽',"Gnome's Cap",'hat','cone','red'],
  ['santa_hat','圣诞帽','Santa Hat','hat','santa','red'],
  ['hard_hat','安全帽','Hard Hat','hat','helmet','yellow'],
  ['souwester','防水帽',"Sou'wester",'hat','brim','yellow'],
  ['cowgal_hat','女牛仔帽','Cowgal Hat','hat','cowboy','pink'],
  ['cowpoke_hat','牧牛帽','Cowpoke Hat','hat','cowboy','brown'],
  ['archers_cap','弓箭手帽',"Archer's Cap",'hat','cap','green'],
  ['blue_cowboy_hat','蓝色牛仔帽','Blue Cowboy Hat','hat','cowboy','blue'],
  ['red_cowboy_hat','红色牛仔帽','Red Cowboy Hat','hat','cowboy','red'],
  ['cone_hat','锥帽','Cone Hat','hat','cone','orange'],
  ['living_hat','活草帽','Living Hat','hat','living','green'],
  ['emily_magic_hat','艾米丽的魔法帽',"Emily's Magic Hat",'hat','magic','pink'],
  ['mushroom_cap','蘑菇帽','Mushroom Cap','hat','mushroom','red'],
  ['dinosaur_hat','恐龙帽','Dinosaur Hat','hat','dino','green'],
  ['logo_cap','标志帽','Logo Cap','hat','cap','pink'],
  ['fashion_hat','时尚帽','Fashion Hat','hat','fedora','purple'],
  ['beanie','毛线帽','Beanie','hat','beanie','blue'],
  ['floppy_beanie','松垮毛线帽','Floppy Beanie','hat','beanie','gray'],
  ['fishing_hat','钓鱼帽','Fishing Hat','hat','brim','tan'],
  ['arcane_hat','奥术帽','Arcane Hat','hat','cowboy','purple'],
  ['chef_hat','厨师帽','Chef Hat','hat','chef','white'],
  ['pirate_hat','海盗帽','Pirate Hat','hat','pirate','black'],
  ['flat_topped_hat','平顶帽','Flat Topped Hat','hat','fedora','dark'],
  ['witch_hat','女巫帽','Witch Hat','hat','witch','purple'],
  ['dark_cowboy_hat','黑暗牛仔帽','Dark Cowboy Hat','hat','cowboy','black'],
  ['magic_cowboy_hat','魔法牛仔帽','Magic Cowboy Hat','hat','cowboy','rainbow'],
  ['deluxe_cowboy_hat','豪华牛仔帽','Deluxe Cowboy Hat','hat','cowboy','gold'],
  ['small_cap','小帽子','Small Cap','hat','cap','green'],
  ['bucket_hat','渔夫帽','Bucket Hat','hat','brim','blue'],
  ['sports_cap','运动帽','Sports Cap','hat','cap','blue'],
  ['red_fez','红色土耳其毡帽','Red Fez','hat','fez','red'],
  ['raccoon_hat','浣熊帽','Raccoon Hat','hat','raccoon','gray'],
  ['leprechaun_hat','矮妖精帽','Leprechaun Hat','hat','top','green'],
  ['governor_hat','州长帽',"Governor's Hat",'hat','top','white'],
  ['pageboy_cap','报童帽','Pageboy Cap','hat','cap','brown'],
  ['mr_qi_hat','齐先生帽',"Mr. Qi's Hat",'hat','fedora','dark'],
  ['tricorn_hat','三角帽','Tricorn Hat','hat','tricorn','dark'],
  ['deluxe_pirate_hat','豪华海盗帽','Deluxe Pirate Hat','hat','pirate','purple'],
  ['joja_cap','Joja 帽','Joja Cap','hat','cap','blue'],
  ['foragers_hat','采集者帽',"Forager's Hat",'hat','brim','green'],

  ['skeleton_mask','骷髅面具','Skeleton Mask','mask','mask','bone'],
  ['goblin_mask','哥布林面具','Goblin Mask','mask','mask','green'],
  ['chicken_mask','小鸡面具','Chicken Mask','mask','mask','white'],
  ['totem_mask','图腾面具','Totem Mask','mask','mask','brown'],
  ['pumpkin_mask','南瓜面具','Pumpkin Mask','mask','mask','orange'],
  ['blobfish_mask','水滴鱼面具','Blobfish Mask','mask','mask','pink'],
  ['mummy_mask','木乃伊面具','Mummy Mask','mask','mask','bone'],
  ['golden_mask','黄金面具','Golden Mask','mask','mask','gold'],
  ['bluebird_mask','蓝鸟面具','Bluebird Mask','mask','mask','blue'],
  ['qi_mask','齐先生面具','Qi Mask','mask','mask','blue'],
  ['panda_hat','熊猫帽','Panda Hat','mask','panda','white'],

  ['delicate_bow','精致蝴蝶结','Delicate Bow','head','bow','pink'],
  ['butterfly_bow','蝴蝶结','Butterfly Bow','head','bow','purple'],
  ['lucky_bow','幸运蝴蝶结','Lucky Bow','head','bow','gold'],
  ['pink_bow','粉色大蝴蝶结','Pink Bow','head','bow','pink'],
  ['daisy','雏菊','Daisy','head','flower','white'],
  ['watermelon_band','西瓜发带','Watermelon Band','head','band','green'],
  ['spotted_headscarf','波点头巾','Spotted Headscarf','head','scarf','red'],
  ['hair_bone','骨头发饰','Hair Bone','head','bonebow','bone'],
  ['tiara','皇冠','Tiara','head','crown','gold'],
  ['laurel_crown','月桂花冠','Laurel Wreath Crown','head','laurel','green'],

  ['knights_helmet','骑士头盔',"Knight's Helmet",'helmet','helmet','silver'],
  ['golden_helmet','黄金头盔','Golden Helmet','helmet','helmet','gold'],
  ['star_helmet','星星头盔','Star Helmet','helmet','helmet','red'],
  ['space_helmet','太空头盔','Space Helmet','helmet','helmet','white'],
  ['warrior_helmet','战士头盔','Warrior Helmet','helmet','helmet','bone'],

  ['sunglasses','墨镜','Sunglasses','special','glasses','dark'],
  ['propeller_hat','螺旋桨帽','Propeller Hat','special','propeller','red'],
  ['bridal_veil','新娘头纱','Bridal Veil','special','veil','white'],
  ['garbage_hat','垃圾桶盖帽','Garbage Hat','special','garbage','gray'],
  ['copper_pan','铜锅帽','Copper Pan','special','pan','copper'],
  ['jester_hat','小丑帽','Jester Hat','special','jester','purple'],
  ['junimo_hat','祝尼魔帽','Junimo Hat','special','junimo','green'],
  ['party_hat_red','派对帽（红）','Party Hat','special','party','red'],
  ['infinity_crown','无限皇冠','Infinity Crown','helmet','crown','iridium']
];

function pal(key) {
  const c = C[key] || C.leather;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const HATS = HAT_RAW.map(([id, name, en, group, style, p]) => ({
  id, name, en, group, style, ...pal(p)
}));

export const HAT_MAP = Object.fromEntries(HATS.map(h => [h.id, h]));

export function hatGroupName(g) {
  const x = HAT_GROUPS.find(v => v.id === g);
  return x ? x.name : g;
}

const FACE_STYLES = new Set(['mask', 'panda', 'glasses']);
export function isFaceHat(hat) {
  return FACE_STYLES.has(hat.style);
}

const TRIMS = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0', '#e08a3a', '#4ac0c0'];
function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------------- 通用形状 ---------------- */

function brim(g, cx, y, w, c1, c2, c3) {
  R(g, cx - w, y, w * 2, 2, c2);
  R(g, cx - w + 1, y, w * 2 - 2, 1, c1);
  R(g, cx - w + 1, y + 2, w * 2 - 2, 1, c3);
}

function band(g, cx, y, w, color) {
  R(g, cx - w, y, w * 2, 1, color);
}

function dot(g, x, y, color, phase) {
  const a = Math.sin(phase * TAU) * 0.5 + 0.5;
  if (a < 0.4) return;
  R(g, x, y, 1, 1, color);
  if (a > 0.75) {
    R(g, x - 1, y, 1, 1, color);
    R(g, x + 1, y, 1, 1, color);
  }
}

/* ---------------- 普通帽子 ---------------- */

function drawCowboy(g, h, cx, y, side, back) {
  brim(g, cx, y, 14, h.c1, h.c2, h.c3);
  R(g, cx - 5, y - 7, 10, 7, h.c2);
  R(g, cx - 4, y - 6, 8, 5, h.c1);
  R(g, cx - 4, y - 7, 8, 1, h.c3);
  R(g, cx - 1, y - 7, 2, 1, h.c2);
  band(g, cx, y - 3, 4, h.c3);
}

function drawBowler(g, h, cx, y) {
  brim(g, cx, y, 13, h.c1, h.c2, h.c3);
  R(g, cx - 5, y - 4, 10, 4, h.c2);
  R(g, cx - 4, y - 5, 8, 4, h.c1);
  R(g, cx - 3, y - 5, 5, 1, h.c3);
  band(g, cx, y - 2, 4, h.c3);
}

function drawTop(g, h, cx, y) {
  brim(g, cx, y, 11, h.c1, h.c2, h.c3);
  R(g, cx - 4, y - 12, 8, 12, h.c2);
  R(g, cx - 3, y - 11, 6, 10, h.c1);
  R(g, cx - 2, y - 11, 2, 5, h.c3);
  band(g, cx, y - 3, 3, h.c3);
}

function drawSombrero(g, h, cx, y) {
  brim(g, cx, y, 19, h.c1, h.c2, h.c3);
  R(g, cx - 4, y - 6, 8, 6, h.c2);
  R(g, cx - 3, y - 5, 6, 5, h.c1);
  R(g, cx - 3, y - 5, 6, 1, h.c3);
  for (let i = 0; i < 5; i++) R(g, cx - 8 + i * 4, y, 2, 1, h.c3);
}

function drawStraw(g, h, cx, y) {
  brim(g, cx, y, 16, h.c1, h.c2, h.c3);
  R(g, cx - 5, y - 6, 10, 6, h.c1);
  R(g, cx - 4, y - 5, 8, 3, h.c3);
  band(g, cx, y - 3, 4, h.c2);
  for (let i = 0; i < 5; i++) R(g, cx - 8 + i * 4, y + 1, 1, 1, '#c09030');
}

function drawCap(g, h, cx, y, side, back) {
  R(g, cx - 5, y - 5, 10, 5, h.c2);
  R(g, cx - 4, y - 4, 8, 3, h.c1);
  R(g, cx - 3, y - 5, 5, 1, h.c3);
  if (!back) {
    if (side) {
      R(g, cx + 5, y - 3, 5, 2, h.c2);
      R(g, cx + 5, y - 3, 5, 1, h.c1);
    } else {
      R(g, cx - 6, y + 1, 12, 2, h.c2);
      R(g, cx - 5, y + 1, 10, 1, h.c1);
    }
  }
  band(g, cx, y - 1, 4, h.c3);
  if (!back) {
    const hh = hashOf(h.id);
    const bx = cx - 4 + (hh % 5);
    const by = y - 4 + (Math.floor(hh / 5) % 2);
    R(g, bx, by, 2, 2, TRIMS[hh % TRIMS.length]);
    R(g, bx, by, 1, 1, '#fff8e0');
  }
}

function drawBonnet(g, h, cx, y) {
  brim(g, cx, y, 14, h.c1, h.c2, h.c3);
  R(g, cx - 5, y - 6, 10, 6, h.c1);
  R(g, cx - 4, y - 5, 8, 3, h.c3);
  R(g, cx - 9, y - 1, 3, 5, h.c1);
  R(g, cx + 7, y - 1, 3, 5, h.c1);
  band(g, cx, y - 3, 4, h.c3);
}

function drawBeret(g, h, cx, y) {
  R(g, cx - 7, y - 3, 14, 3, h.c2);
  R(g, cx - 6, y - 4, 12, 3, h.c1);
  R(g, cx - 3, y - 5, 6, 1, h.c3);
  R(g, cx + 4, y - 5, 1, 2, h.c2);
}

function drawEarmuffs(g, h, cx, y) {
  R(g, cx - 7, y - 1, 14, 2, h.c2);
  R(g, cx - 6, y - 2, 12, 1, h.c1);
  ellipse(g, cx - 7, y - 3, 4, 4, h.c2);
  ellipse(g, cx + 7, y - 3, 4, 4, h.c2);
  ellipse(g, cx - 7, y - 3, 3, 3, h.c1);
  ellipse(g, cx + 7, y - 3, 3, 3, h.c1);
  R(g, cx - 8, y - 4, 2, 2, h.c3);
}

function drawSanta(g, h, cx, y) {
  brim(g, cx, y, 12, h.c1, h.c2, h.c3);
  R(g, cx - 4, y - 9, 8, 9, h.c2);
  R(g, cx - 3, y - 8, 6, 7, h.c1);
  R(g, cx + 1, y - 10, 4, 4, h.c1);
  R(g, cx + 2, y - 9, 2, 2, h.c3);
  R(g, cx - 4, y - 3, 8, 2, h.c3);
}

function drawHelmet(g, h, cx, y, style) {
  R(g, cx - 6, y - 8, 12, 8, h.c2);
  R(g, cx - 5, y - 7, 10, 7, h.c1);
  R(g, cx - 4, y - 7, 3, 5, h.c3);
  R(g, cx - 7, y, 14, 2, h.c2);
  R(g, cx - 6, y, 12, 1, h.c1);
  if (h.id === 'star_helmet') {
    R(g, cx - 1, y - 11, 3, 4, h.c3);
    R(g, cx - 3, y - 10, 7, 2, h.c3);
  }
  if (h.id === 'knights_helmet' || h.id === 'golden_helmet') {
    R(g, cx - 2, y - 12, 1, 5, h.c3);
    R(g, cx + 1, y - 12, 1, 5, h.c3);
    R(g, cx - 1, y - 13, 2, 4, h.c2);
  }
  if (h.id === 'space_helmet') {
    R(g, cx - 4, y - 5, 8, 4, '#bfe8ff');
    R(g, cx - 3, y - 4, 3, 2, '#ffffff');
    R(g, cx - 9, y - 4, 3, 5, h.c2);
    R(g, cx + 6, y - 4, 3, 5, h.c2);
  }
  if (h.id === 'warrior_helmet') {
    R(g, cx - 7, y - 4, 3, 5, h.c2);
    R(g, cx + 4, y - 4, 3, 5, h.c2);
    R(g, cx - 1, y - 9, 2, 2, h.c2);
  }
}

function drawBrim(g, h, cx, y) {
  brim(g, cx, y, 14, h.c1, h.c2, h.c3);
  R(g, cx - 4, y - 4, 8, 4, h.c2);
  R(g, cx - 3, y - 3, 6, 3, h.c1);
  band(g, cx, y - 2, 3, h.c3);
}

function drawLiving(g, h, cx, y) {
  drawStraw(g, h, cx, y);
  R(g, cx - 6, y - 8, 1, 4, h.c2);
  R(g, cx - 7, y - 9, 2, 2, h.c1);
  R(g, cx + 5, y - 9, 1, 5, h.c2);
  R(g, cx + 4, y - 10, 3, 2, h.c1);
  R(g, cx - 1, y - 9, 2, 4, h.c2);
}

function drawMagic(g, h, cx, y, phase) {
  drawTop(g, h, cx, y);
  dot(g, cx - 7, y - 8, '#fff0a0', phase);
  dot(g, cx + 7, y - 4, h.c3, phase + 0.3);
  R(g, cx + 4, y - 10, 2, 2, h.c3);
}

function drawMushroom(g, h, cx, y) {
  ellipse(g, cx, y - 4, 10, 7, h.c2);
  ellipse(g, cx, y - 5, 9, 6, h.c1);
  R(g, cx - 6, y - 8, 3, 2, '#fff0e0');
  R(g, cx + 2, y - 7, 3, 2, '#fff0e0');
  R(g, cx - 2, y - 3, 2, 1, '#fff0e0');
  R(g, cx - 3, y - 1, 6, 3, h.c3);
  R(g, cx - 2, y + 1, 4, 1, h.c2);
}

function drawDino(g, h, cx, y) {
  R(g, cx - 6, y - 5, 12, 5, h.c2);
  R(g, cx - 5, y - 4, 10, 3, h.c1);
  for (let i = 0; i < 3; i++) {
    R(g, cx - 4 + i * 4, y - 8, 2, 3, h.c3);
    R(g, cx - 3 + i * 4, y - 9, 1, 2, h.c1);
  }
  R(g, cx - 7, y - 1, 3, 2, h.c2);
  R(g, cx + 5, y - 1, 3, 2, h.c2);
  R(g, cx + 2, y - 3, 2, 1, '#1a1a1a');
}

function drawBeanie(g, h, cx, y) {
  R(g, cx - 6, y - 7, 12, 7, h.c2);
  R(g, cx - 5, y - 6, 10, 5, h.c1);
  R(g, cx - 4, y - 8, 7, 2, h.c1);
  R(g, cx - 5, y - 2, 10, 2, h.c3);
  R(g, cx - 4, y - 2, 8, 1, h.c2);
  if (h.id === 'floppy_beanie') {
    R(g, cx + 4, y - 9, 4, 3, h.c1);
    R(g, cx + 7, y - 8, 2, 3, h.c2);
  }
}

function drawFedora(g, h, cx, y) {
  brim(g, cx, y, 13, h.c1, h.c2, h.c3);
  R(g, cx - 5, y - 7, 10, 7, h.c2);
  R(g, cx - 4, y - 6, 8, 5, h.c1);
  R(g, cx - 4, y - 7, 8, 1, h.c3);
  R(g, cx - 1, y - 7, 2, 1, h.c2);
  band(g, cx, y - 3, 4, h.c3);
  if (h.id === 'fashion_hat') {
    R(g, cx + 6, y - 6, 5, 1, h.c3);
    R(g, cx + 9, y - 8, 2, 3, h.c1);
  }
  const hh = hashOf(h.id);
  R(g, cx + 3, y - 4, 2, 2, TRIMS[hh % TRIMS.length]);
  R(g, cx + 4, y - 4, 1, 1, '#fff8e0');
}

function drawChef(g, h, cx, y) {
  R(g, cx - 4, y - 5, 8, 5, h.c2);
  R(g, cx - 3, y - 4, 6, 4, h.c1);
  ellipse(g, cx - 4, y - 8, 4, 4, h.c1);
  ellipse(g, cx + 4, y - 8, 4, 4, h.c1);
  ellipse(g, cx, y - 10, 4, 3, h.c3);
  R(g, cx - 4, y - 5, 8, 1, h.c3);
}

function drawPirate(g, h, cx, y) {
  brim(g, cx, y, 14, h.c1, h.c2, h.c3);
  R(g, cx - 6, y - 6, 12, 6, h.c2);
  R(g, cx - 5, y - 5, 10, 4, h.c1);
  R(g, cx - 4, y - 2, 8, 1, h.c3);
  R(g, cx - 2, y - 5, 4, 3, '#f0f0e0');
  R(g, cx - 1, y - 4, 1, 1, '#1a1a1a');
  R(g, cx + 1, y - 4, 1, 1, '#1a1a1a');
  if (h.id === 'deluxe_pirate_hat') {
    line(g, cx + 5, y - 7, cx + 9, y - 13, h.c3, 1);
    R(g, cx + 8, y - 14, 3, 2, '#f0e0a0');
  }
}

function drawWitch(g, h, cx, y, phase) {
  brim(g, cx, y, 15, h.c1, h.c2, h.c3);
  line(g, cx - 4, y - 1, cx - 2, y - 9, h.c2, 4);
  line(g, cx - 2, y - 9, cx + 2, y - 12, h.c2, 3);
  line(g, cx + 2, y - 12, cx + 5, y - 10, h.c2, 2);
  line(g, cx - 3, y - 2, cx - 1, y - 8, h.c1, 2);
  R(g, cx - 4, y - 3, 8, 2, h.c3);
  R(g, cx + 4, y - 12, 2, 2, h.c3);
  dot(g, cx + 6, y - 9, h.c3, phase);
}

function drawFez(g, h, cx, y) {
  R(g, cx - 4, y - 7, 8, 7, h.c2);
  R(g, cx - 3, y - 6, 6, 5, h.c1);
  R(g, cx - 5, y - 2, 10, 2, h.c3);
  R(g, cx - 3, y - 7, 6, 1, h.c3);
  line(g, cx + 4, y - 7, cx + 6, y - 2, h.c3, 1);
  R(g, cx + 5, y, 2, 2, h.c3);
}

function drawRaccoon(g, h, cx, y) {
  brim(g, cx, y, 12, h.c1, h.c2, h.c3);
  R(g, cx - 5, y - 5, 10, 5, h.c2);
  R(g, cx - 4, y - 4, 8, 3, h.c1);
  ellipse(g, cx - 7, y - 5, 3, 3, h.c1);
  ellipse(g, cx + 7, y - 5, 3, 3, h.c1);
  R(g, cx - 7, y - 5, 2, 2, h.c3);
  R(g, cx + 5, y - 5, 2, 2, h.c3);
  R(g, cx + 8, y + 1, 5, 2, h.c2);
  R(g, cx + 10, y - 2, 3, 3, h.c1);
  R(g, cx - 1, y - 2, 2, 1, h.c3);
}

function drawTricorn(g, h, cx, y) {
  R(g, cx - 15, y - 3, 8, 4, h.c2);
  R(g, cx + 7, y - 3, 8, 4, h.c2);
  R(g, cx - 12, y - 5, 24, 5, h.c2);
  R(g, cx - 11, y - 4, 22, 3, h.c1);
  R(g, cx - 5, y - 7, 10, 4, h.c2);
  R(g, cx - 4, y - 6, 8, 3, h.c1);
  R(g, cx - 1, y - 4, 2, 2, h.c3);
}

/* ---------------- 面具 / 头饰 ---------------- */

function drawMask(g, h, cx, y, back, side) {
  if (back) {
    R(g, cx - 5, y - 2, 10, 2, h.c2);
    R(g, cx - 4, y - 2, 8, 1, h.c1);
    R(g, cx + 4, y - 1, 2, 2, h.c3);
    return;
  }

  if (h.id === 'pumpkin_mask') {
    ellipse(g, cx, y, 7, 7, h.c2);
    ellipse(g, cx, y - 1, 6, 6, h.c1);
    for (let i = 0; i < 3; i++) line(g, cx - 4 + i * 4, y - 6, cx - 4 + i * 4, y + 5, h.c2, 1);
    R(g, cx - 4, y - 2, 3, 2, '#1a1a1a');
    R(g, cx + 2, y - 2, 3, 2, '#1a1a1a');
    R(g, cx - 2, y + 2, 5, 1, '#1a1a1a');
    R(g, cx - 1, y - 9, 2, 3, '#5a7a2a');
    return;
  }
  if (h.id === 'panda_hat') {
    ellipse(g, cx - 7, y - 7, 3, 3, '#1a1a1a');
    ellipse(g, cx + 7, y - 7, 3, 3, '#1a1a1a');
    ellipse(g, cx, y, 7, 7, h.c1);
    R(g, cx - 4, y - 3, 3, 3, '#1a1a1a');
    R(g, cx + 2, y - 3, 3, 3, '#1a1a1a');
    R(g, cx - 1, y + 2, 2, 1, '#1a1a1a');
    return;
  }
  if (h.id === 'blobfish_mask') {
    ellipse(g, cx, y, 8, 7, h.c2);
    ellipse(g, cx, y - 1, 7, 6, h.c1);
    R(g, cx - 4, y - 2, 2, 2, '#1a1a1a');
    R(g, cx + 2, y - 2, 2, 2, '#1a1a1a');
    R(g, cx - 2, y + 3, 5, 1, '#8a3a5a');
    R(g, cx - 6, y + 4, 3, 2, h.c3);
    R(g, cx + 3, y + 4, 3, 2, h.c3);
    return;
  }
  if (h.id === 'chicken_mask') {
    ellipse(g, cx, y, 7, 7, h.c1);
    R(g, cx - 4, y - 3, 2, 2, '#1a1a1a');
    R(g, cx + 2, y - 3, 2, 2, '#1a1a1a');
    R(g, cx - 2, y + 1, 5, 3, '#e0a030');
    R(g, cx - 1, y + 2, 3, 1, '#a06010');
    R(g, cx - 1, y - 8, 3, 3, '#d04a3a');
    return;
  }
  if (h.id === 'goblin_mask') {
    ellipse(g, cx, y, 7, 7, h.c1);
    R(g, cx - 6, y - 2, 4, 3, h.c2);
    R(g, cx + 3, y - 2, 4, 3, h.c2);
    R(g, cx - 4, y - 2, 2, 2, '#f0e060');
    R(g, cx + 2, y - 2, 2, 2, '#f0e060');
    R(g, cx - 3, y + 3, 6, 1, '#1a1a1a');
    R(g, cx - 2, y + 4, 1, 2, '#f0f0e0');
    R(g, cx + 2, y + 4, 1, 2, '#f0f0e0');
    return;
  }
  if (h.id === 'bluebird_mask') {
    ellipse(g, cx, y, 7, 7, h.c1);
    R(g, cx - 4, y - 2, 2, 2, '#ffffff');
    R(g, cx + 2, y - 2, 2, 2, '#ffffff');
    R(g, cx - 3, y - 1, 1, 1, '#1a1a1a');
    R(g, cx + 3, y - 1, 1, 1, '#1a1a1a');
    R(g, cx - 1, y + 2, 4, 2, '#e0a030');
    R(g, cx - 3, y - 8, 2, 3, h.c2);
    R(g, cx + 2, y - 8, 2, 3, h.c2);
    return;
  }
  if (h.id === 'qi_mask') {
    ellipse(g, cx, y, 7, 7, h.c1);
    R(g, cx - 4, y - 3, 4, 2, '#1a1a1a');
    R(g, cx + 1, y - 3, 4, 2, '#1a1a1a');
    R(g, cx - 1, y - 3, 2, 1, '#1a1a1a');
    R(g, cx - 2, y + 2, 5, 1, '#1a1a1a');
    R(g, cx - 4, y + 4, 8, 1, h.c3);
    return;
  }
  if (h.id === 'mummy_mask') {
    ellipse(g, cx, y, 7, 7, h.c1);
    for (let i = 0; i < 5; i++) R(g, cx - 5, y - 4 + i * 2, 10, 1, h.c2);
    R(g, cx - 3, y - 2, 2, 2, '#1a1a1a');
    R(g, cx + 1, y - 2, 2, 2, '#1a1a1a');
    return;
  }
  if (h.id === 'golden_mask') {
    ellipse(g, cx, y, 7, 7, h.c1);
    R(g, cx - 4, y - 2, 3, 3, '#1a1a1a');
    R(g, cx + 2, y - 2, 3, 3, '#1a1a1a');
    R(g, cx - 1, y + 3, 3, 1, '#1a1a1a');
    R(g, cx - 5, y - 6, 2, 2, h.c3);
    return;
  }
  if (h.id === 'totem_mask') {
    R(g, cx - 6, y - 7, 12, 15, h.c2);
    R(g, cx - 5, y - 6, 10, 13, h.c1);
    R(g, cx - 4, y - 3, 3, 3, '#f0e060');
    R(g, cx + 1, y - 3, 3, 3, '#f0e060');
    R(g, cx - 3, y + 3, 7, 2, h.c2);
    R(g, cx - 4, y - 7, 2, 4, h.c3);
    R(g, cx + 2, y - 7, 2, 4, h.c3);
    return;
  }
  /* 骷髅面具 */
  ellipse(g, cx, y, 7, 7, h.c1);
  R(g, cx - 4, y - 3, 3, 3, '#1a1a1a');
  R(g, cx + 2, y - 3, 3, 3, '#1a1a1a');
  R(g, cx - 1, y, 2, 2, '#1a1a1a');
  R(g, cx - 3, y + 4, 7, 1, '#1a1a1a');
  for (let i = 0; i < 3; i++) R(g, cx - 2 + i * 2, y + 5, 1, 2, '#1a1a1a');
}

function drawBow(g, h, cx, y) {
  const big = h.id === 'pink_bow';
  const w = big ? 6 : 5;
  const hy = big ? 4 : 3;
  ellipse(g, cx - w, y - 2, w, hy, h.c2);
  ellipse(g, cx + w, y - 2, w, hy, h.c2);
  ellipse(g, cx - w, y - 2, w - 1, hy - 1, h.c1);
  ellipse(g, cx + w, y - 2, w - 1, hy - 1, h.c1);
  R(g, cx - 2, y - 3, 4, 4, h.c3);
  R(g, cx - 1, y - 2, 2, 2, h.c2);
  line(g, cx - 1, y + 1, cx - 4, y + 6, h.c1, 2);
  line(g, cx + 1, y + 1, cx + 4, y + 6, h.c1, 2);
}

function drawBoneBow(g, h, cx, y) {
  line(g, cx - 6, y - 1, cx - 1, y - 1, h.c1, 2);
  line(g, cx + 1, y - 1, cx + 6, y - 1, h.c1, 2);
  ellipse(g, cx - 6, y - 4, 3, 3, h.c2);
  ellipse(g, cx + 6, y - 4, 3, 3, h.c2);
  ellipse(g, cx - 6, y - 4, 2, 2, h.c1);
  ellipse(g, cx + 6, y - 4, 2, 2, h.c1);
  R(g, cx - 1, y - 3, 3, 3, h.c1);
  R(g, cx - 5, y + 1, 2, 2, h.c2);
  R(g, cx + 4, y + 1, 2, 2, h.c2);
}

function drawFlower(g, h, cx, y) {
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU - Math.PI / 2;
    ellipse(g, cx + Math.cos(a) * 4, y - 4 + Math.sin(a) * 4, 2, 2, h.c1);
  }
  ellipse(g, cx, y - 4, 2, 2, h.c3);
  R(g, cx - 3, y - 6, 2, 1, h.c3);
}

function drawBand(g, h, cx, y) {
  R(g, cx - 9, y - 1, 18, 4, h.c2);
  R(g, cx - 8, y - 1, 16, 2, h.c1);
  R(g, cx - 7, y, 14, 1, h.c2);
  if (h.id === 'watermelon_band') {
    for (let i = 0; i < 4; i++) R(g, cx - 6 + i * 4, y, 1, 2, '#1a1a1a');
  }
}

function drawScarf(g, h, cx, y, phase) {
  R(g, cx - 8, y - 2, 16, 5, h.c2);
  R(g, cx - 7, y - 2, 14, 3, h.c1);
  R(g, cx - 7, y - 2, 14, 1, h.c3);
  for (let i = 0; i < 4; i++) R(g, cx - 5 + i * 4, y - 1, 1, 2, '#f0f0e8');
  R(g, cx + 6, y + 1, 3, 3, h.c1);
  R(g, cx + 8, y + 3, 2, 3 + Math.round(Math.sin(phase * TAU)), h.c2);
}

function drawCrown(g, h, cx, y) {
  if (h.id === 'laurel_crown') {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + i / 6 * Math.PI;
      const lx = cx + Math.cos(a) * 7;
      const ly = y - 1 + Math.sin(a) * 4;
      R(g, lx - 1, ly - 1, 3, 2, h.c1);
      R(g, lx, ly - 2, 2, 1, h.c3);
    }
    R(g, cx - 1, y - 6, 3, 3, h.c3);
    return;
  }
  R(g, cx - 7, y - 3, 14, 4, h.c2);
  R(g, cx - 6, y - 2, 12, 2, h.c1);
  for (let i = 0; i < 5; i++) {
    const px = cx - 6 + i * 3;
    R(g, px, y - 7 - (i % 2) * 2, 2, 5 + (i % 2) * 2, h.c1);
    R(g, px, y - 7 - (i % 2) * 2, 1, 2, h.c3);
  }
  R(g, cx - 2, y - 2, 2, 2, h.c3);
  R(g, cx + 1, y - 2, 2, 2, h.c3);
  if (h.id === 'infinity_crown') {
    dot(g, cx - 9, y - 6, '#ffffff', 0.2);
    dot(g, cx + 9, y - 4, '#e0d0ff', 0.6);
  }
}

function drawGlasses(g, h, cx, y) {
  R(g, cx - 8, y - 2, 6, 4, h.c2);
  R(g, cx + 2, y - 2, 6, 4, h.c2);
  R(g, cx - 7, y - 1, 4, 2, h.c1);
  R(g, cx + 3, y - 1, 4, 2, h.c1);
  R(g, cx - 2, y - 1, 4, 1, h.c2);
  R(g, cx - 9, y - 3, 2, 1, h.c2);
  R(g, cx + 7, y - 3, 2, 1, h.c2);
}

function drawPropeller(g, h, cx, y, phase) {
  R(g, cx - 5, y - 4, 10, 4, h.c2);
  R(g, cx - 4, y - 3, 8, 3, h.c1);
  R(g, cx - 6, y, 12, 2, h.c2);
  R(g, cx - 1, y - 8, 2, 4, h.c3);
  const a = phase * TAU;
  line(g, cx, y - 9, cx + Math.cos(a) * 8, y - 9 + Math.sin(a) * 3, h.c1, 2);
  line(g, cx, y - 9, cx - Math.cos(a) * 8, y - 9 - Math.sin(a) * 3, h.c2, 2);
  R(g, cx - 1, y - 10, 3, 2, h.c3);
}

function drawVeil(g, h, cx, y) {
  R(g, cx - 8, y - 1, 16, 2, h.c2);
  R(g, cx - 7, y - 2, 14, 1, h.c1);
  ellipse(g, cx, y - 4, 5, 3, h.c1);
  g.globalAlpha = 0.55;
  R(g, cx - 9, y + 1, 18, 9, h.c1);
  R(g, cx - 7, y + 1, 14, 11, h.c3);
  g.globalAlpha = 1;
  for (let i = 0; i < 4; i++) R(g, cx - 7 + i * 5, y + 2, 1, 8, h.c2);
}

function drawGarbage(g, h, cx, y) {
  ellipse(g, cx, y - 2, 10, 5, h.c2);
  ellipse(g, cx, y - 3, 9, 4, h.c1);
  R(g, cx - 6, y - 2, 12, 2, h.c1);
  R(g, cx - 4, y - 6, 8, 2, h.c2);
  R(g, cx - 1, y - 7, 3, 2, h.c3);
  R(g, cx - 9, y + 1, 18, 2, h.c2);
  R(g, cx - 9, y + 1, 18, 1, h.c3);
}

function drawPan(g, h, cx, y) {
  ellipse(g, cx - 1, y - 3, 8, 5, h.c2);
  ellipse(g, cx - 1, y - 4, 7, 4, h.c1);
  ellipse(g, cx - 1, y - 4, 5, 2, h.c3);
  line(g, cx + 6, y - 1, cx + 11, y + 4, h.c2, 2);
  R(g, cx + 10, y + 3, 3, 2, h.c3);
  R(g, cx - 5, y - 6, 3, 1, h.c3);
}

function drawJester(g, h, cx, y) {
  line(g, cx - 5, y - 1, cx - 8, y - 9, h.c2, 3);
  line(g, cx, y - 1, cx, y - 12, h.c1, 3);
  line(g, cx + 5, y - 1, cx + 8, y - 9, h.c2, 3);
  ellipse(g, cx - 8, y - 10, 2, 2, h.c3);
  ellipse(g, cx, y - 13, 2, 2, h.c3);
  ellipse(g, cx + 8, y - 10, 2, 2, h.c3);
  R(g, cx - 7, y - 2, 14, 3, h.c1);
  R(g, cx - 6, y - 1, 12, 1, h.c3);
}

function drawJunimo(g, h, cx, y) {
  ellipse(g, cx, y - 4, 6, 6, h.c2);
  ellipse(g, cx, y - 5, 5, 5, h.c1);
  R(g, cx - 2, y - 6, 1, 1, '#1a1a1a');
  R(g, cx + 1, y - 6, 1, 1, '#1a1a1a');
  R(g, cx - 1, y + 3, 3, 1, h.c2);
  line(g, cx, y - 10, cx + 3, y - 14, h.c2, 1);
  R(g, cx + 2, y - 15, 3, 2, h.c3);
  R(g, cx + 3, y - 14, 1, 1, h.c1);
}

function drawParty(g, h, cx, y) {
  R(g, cx - 4, y - 8, 3, 8, h.c2);
  R(g, cx - 1, y - 10, 3, 10, h.c1);
  R(g, cx + 2, y - 8, 3, 8, h.c2);
  R(g, cx - 3, y - 9, 2, 2, h.c3);
  R(g, cx + 1, y - 11, 2, 2, h.c3);
  R(g, cx + 3, y - 7, 2, 2, h.c3);
  ellipse(g, cx, y - 11, 2, 2, h.c3);
  R(g, cx - 6, y, 12, 2, h.c2);
}

function drawCone(g, h, cx, y) {
  line(g, cx - 6, y, cx, y - 11, h.c2, 4);
  line(g, cx + 6, y, cx, y - 11, h.c2, 4);
  line(g, cx - 5, y - 1, cx, y - 9, h.c1, 2);
  line(g, cx + 4, y - 1, cx, y - 9, h.c1, 2);
  R(g, cx - 7, y, 14, 2, h.c2);
  R(g, cx - 6, y, 12, 1, h.c1);
  R(g, cx - 1, y - 11, 2, 2, h.c3);
  R(g, cx - 4, y - 3, 8, 1, h.c3);
}

function drawHat(g, hat, view, cx, y, phase) {
  const back = view === 'back';
  const side = view === 'side';
  switch (hat.style) {
    case 'cowboy': drawCowboy(g, hat, cx, y, side, back); break;
    case 'bowler': drawBowler(g, hat, cx, y); break;
    case 'top': drawTop(g, hat, cx, y); break;
    case 'sombrero': drawSombrero(g, hat, cx, y); break;
    case 'straw': drawStraw(g, hat, cx, y); break;
    case 'cap': drawCap(g, hat, cx, y, side, back); break;
    case 'bonnet': drawBonnet(g, hat, cx, y); break;
    case 'beret': drawBeret(g, hat, cx, y); break;
    case 'earmuffs': drawEarmuffs(g, hat, cx, y); break;
    case 'santa': drawSanta(g, hat, cx, y); break;
    case 'helmet': drawHelmet(g, hat, cx, y, hat.style); break;
    case 'brim': drawBrim(g, hat, cx, y); break;
    case 'living': drawLiving(g, hat, cx, y); break;
    case 'magic': drawMagic(g, hat, cx, y, phase); break;
    case 'mushroom': drawMushroom(g, hat, cx, y); break;
    case 'dino': drawDino(g, hat, cx, y); break;
    case 'beanie': drawBeanie(g, hat, cx, y); break;
    case 'fedora': drawFedora(g, hat, cx, y); break;
    case 'chef': drawChef(g, hat, cx, y); break;
    case 'pirate': drawPirate(g, hat, cx, y); break;
    case 'witch': drawWitch(g, hat, cx, y, phase); break;
    case 'fez': drawFez(g, hat, cx, y); break;
    case 'raccoon': drawRaccoon(g, hat, cx, y); break;
    case 'tricorn': drawTricorn(g, hat, cx, y); break;
    case 'cone': drawCone(g, hat, cx, y); break;
    case 'mask':
    case 'panda': drawMask(g, hat, cx, y, back, side); break;
    case 'bow': drawBow(g, hat, cx, y); break;
    case 'bonebow': drawBoneBow(g, hat, cx, y); break;
    case 'flower': drawFlower(g, hat, cx, y); break;
    case 'band': drawBand(g, hat, cx, y); break;
    case 'scarf': drawScarf(g, hat, cx, y, phase); break;
    case 'crown': drawCrown(g, hat, cx, y); break;
    case 'laurel': drawCrown(g, hat, cx, y); break;
    case 'glasses': drawGlasses(g, hat, cx, y); break;
    case 'propeller': drawPropeller(g, hat, cx, y, phase); break;
    case 'veil': drawVeil(g, hat, cx, y); break;
    case 'garbage': drawGarbage(g, hat, cx, y); break;
    case 'pan': drawPan(g, hat, cx, y); break;
    case 'jester': drawJester(g, hat, cx, y); break;
    case 'junimo': drawJunimo(g, hat, cx, y); break;
    case 'party': drawParty(g, hat, cx, y); break;
    default: drawCap(g, hat, cx, y, side, back); break;
  }
}

export function drawHatIcon(g, hat, phase = 0.25) {
  const h = typeof hat === 'string' ? HAT_MAP[hat] : hat;
  if (!h) return;
  g.save();
  g.imageSmoothingEnabled = false;
  drawHat(g, h, 'front', 16, isFaceHat(h) ? 17 : 23, phase);
  g.restore();
}

/* 在 32×40 农夫格内叠加帽子；y 用帽子底边（面具用脸部中心）。 */
export function drawHatOnFarmer(g, hat, dir, phase, opts = {}) {
  const h = typeof hat === 'string' ? HAT_MAP[hat] : hat;
  if (!h) return;
  const view = dir === 3 ? 'back' : (dir === 1 || dir === 2 ? 'side' : 'front');
  const bob = Math.sin(phase * TAU) > 0.55 ? -1 : 0;
  const face = isFaceHat(h);
  let x = 16;
  if (view === 'side') x = dir === 1 ? 15 : 17;
  if (opts.x != null) x = opts.x;
  const y = opts.y != null ? opts.y : (face ? 15 : 7 + bob);
  g.save();
  g.imageSmoothingEnabled = false;
  drawHat(g, h, view, x, y, phase);
  g.restore();
}

export { drawHat };
