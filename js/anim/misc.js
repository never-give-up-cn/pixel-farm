/* 星露谷杂项收集品：邮件、书籍、饰品、电影海报，共 44 项。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const MISC_W = 32;
export const MISC_H = 32;

export const MISC_GROUPS = [
  { id: 'all', name: '全部' },
  { id: 'mail', name: '邮件' },
  { id: 'book', name: '书籍' },
  { id: 'trinket', name: '饰品' },
  { id: 'movie', name: '电影' }
];

const C = {
  paper:   ['#f0e8d0', '#c8b890', '#fff8e8'],
  white:   ['#f0f0e8', '#b0b0a8', '#ffffff'],
  red:     ['#d04a3a', '#8a2a1a', '#f08a70'],
  blue:    ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  green:   ['#5aa04a', '#3a6a2a', '#a0d080'],
  gold:    ['#e0c060', '#a08020', '#fff0a0'],
  purple:  ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  pink:    ['#e08ab0', '#a04a70', '#ffc0d8'],
  brown:   ['#8a5a3a', '#5a3418', '#c09060'],
  dark:    ['#3a3a4a', '#1a1a2a', '#8a8aa0'],
  teal:    ['#4ac0b0', '#2a8070', '#a0f0e0'],
  orange:  ['#e08a3a', '#a05a1a', '#f0c080'],
  iridium: ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  silver:  ['#c8d0d8', '#7a8490', '#f0f4f8']
};

/* [id, 中文名, 英文名, 分组, 造型, 配色, 说明] */
const RAW = [
  ['welcome_letter','欢迎信','Welcome Letter','mail','letter','paper','镇长寄来的欢迎信'],
  ['mom_letter','妈妈的信','Letter from Mom','mail','letter','pink','妈妈寄来的家常信'],
  ['dad_letter','爸爸的信','Letter from Dad','mail','letter','blue','爸爸寄来的信'],
  ['lewis_letter','刘易斯的信','Letter from Lewis','mail','letter','green','镇长寄来的通知'],
  ['museum_letter','博物馆的信','Museum Letter','mail','letter','purple','冈瑟寄来的博物馆邀请'],
  ['joja_letter','Joja 的信','Joja Letter','mail','letter','blue','Joja 公司的广告'],
  ['wizard_letter','法师的信','Wizard Letter','mail','letter','purple','法师寄来的神秘信件'],
  ['secret_note','秘密纸条','Secret Note','mail','note','paper','写着神秘线索的纸条'],
  ['birthday_card','生日卡','Birthday Card','mail','card','pink','一张生日贺卡'],
  ['festival_invite','节日邀请','Festival Invite','mail','letter','orange','节日活动邀请函'],
  ['tax_notice','税务通知','Tax Notice','mail','letter','red','农场税务通知'],
  ['bundle_note','收集包笔记','Bundle Note','mail','note','green','记录社区中心收集包'],

  ['almanac','星露谷年鉴','Stardew Valley Almanac','book','book','green','农业与季节指南'],
  ['woodcutters_weekly','伐木周刊',"Woodcutter's Weekly",'book','book','brown','伐木与林业知识'],
  ['combat_quarterly','战斗季刊','Combat Quarterly','book','book','red','战斗技巧与怪物弱点'],
  ['book_of_yoba','约巴之书','The Book of Yoba','book','book','blue','约巴教的经典'],
  ['serpent_tongue','蛇之舌',"The Serpent's Tongue",'book','book','green','关于蛇与矿洞的传说'],
  ['study_of_fishes','鱼类研究','A Study of Fishes','book','book','teal','鱼类图鉴与钓鱼技巧'],
  ['dwarvish_safety','矮人安全手册','Dwarvish Safety Manual','book','book','orange','矮人矿工的安全指南'],
  ['monster_compendium','怪物图鉴','Monster Compendium','book','book','dark','怪物弱点与掉落'],
  ['mysteries_of_dwarves','矮人之谜','Mysteries of the Dwarves','book','book','iridium','矮人文明研究'],
  ['sailors_life',"水手生活","A Sailor's Life",'book','book','blue','威利推荐的海上故事'],
  ['alleyway_buffet','小巷自助餐','The Alleyway Buffet','book','book','gold','关于街头美食的书'],
  ['diamond_hunter','钻石猎人','The Diamond Hunter','book','book','purple','宝石与矿脉勘探'],
  ['art_of_crabbing','捕蟹艺术',"The Art O' Crabbing",'book','book','teal','蟹笼与甲壳类'],
  ['fisherman_act1','渔夫 第一幕','The Fisherman, Act I','book','book','blue','关于渔夫的戏剧'],
  ['fisherman_act2','渔夫 第二幕','The Fisherman, Act II','book','book','blue','渔夫戏剧的续篇'],
  ['jack_be_nimble','杰克敏捷','Jack Be Nimble','book','book','gold','一本儿童故事书'],

  ['basilisk_paw','蛇怪爪','Basilisk Paw','trinket','paw','green','免疫负面状态'],
  ['fairy_box','仙灵盒','Fairy Box','trinket','box','pink','召唤仙灵恢复生命'],
  ['frog_egg','青蛙蛋','Frog Egg','trinket','egg','green','召唤青蛙同伴'],
  ['golden_spur','金马刺','Golden Spur','trinket','spur','gold','提高暴击几率'],
  ['ice_rod','冰杖','Ice Rod','trinket','rod','blue','发射冰霜弹'],
  ['magic_hair_gel','魔法发胶','Magic Hair Gel','trinket','gel','pink','让头发变色'],
  ['magic_quiver','魔法箭袋','Magic Quiver','trinket','quiver','brown','自动发射魔法箭'],
  ['parrot_egg','鹦鹉蛋','Parrot Egg','trinket','egg','teal','召唤鹦鹉同伴'],

  ['brave_sapling','勇敢的小树苗','The Brave Little Sapling','movie','poster','green','动画电影海报'],
  ['prairie_king_movie','草原大王之旅','Journey of the Prairie King','movie','poster','orange','西部冒险电影'],
  ['mysterium','神秘馆','Mysterium','movie','poster','purple','神秘悬疑电影'],
  ['natural_wonders','自然奇观','Natural Wonders','movie','poster','teal','自然纪录片'],
  ['zuzu_express','祖祖城特快','The Zuzu City Express','movie','poster','blue','都市喜剧电影'],
  ['wumbus','温布斯','Wumbus','movie','poster','pink','怪兽电影'],
  ['from_the_sea','来自海洋','It Came From The Sea','movie','poster','blue','海洋恐怖电影'],
  ['coldstar_ranch','冷星牧场','The Miracle at Coldstar Ranch','movie','poster','gold','温情牧场电影']
];

function pal(key) {
  const c = C[key] || C.paper;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const MISC = RAW.map(([id, name, en, group, style, p, desc]) => ({
  id, name, en, group, style, desc, ...pal(p)
}));
export const MISC_MAP = Object.fromEntries(MISC.map(m => [m.id, m]));

export function miscGroupName(g) {
  const x = MISC_GROUPS.find(v => v.id === g);
  return x ? x.name : g;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------------- 邮件 / 书籍 ---------------- */

function drawLetter(g, it, note) {
  if (note) {
    R(g, 7, 4, 18, 24, '#d8c8a0');
    R(g, 8, 5, 16, 22, it.c1);
    for (let i = 0; i < 5; i++) R(g, 10, 9 + i * 3, 12 - (i % 2) * 4, 1, it.c2);
    R(g, 20, 20, 3, 3, it.c3);
    return;
  }
  R(g, 4, 8, 24, 16, it.c2);
  R(g, 5, 9, 22, 14, it.c1);
  line(g, 5, 9, 16, 18, it.c2, 1);
  line(g, 27, 9, 16, 18, it.c2, 1);
  R(g, 14, 16, 4, 4, it.c3);
  R(g, 15, 17, 2, 2, it.c2);
  R(g, 8, 21, 10, 1, it.c2);
  R(g, 8, 23, 7, 1, it.c2);
}

function drawBook(g, it) {
  R(g, 7, 4, 19, 24, it.c2);
  R(g, 8, 5, 17, 22, it.c1);
  R(g, 9, 6, 3, 20, it.c3);
  R(g, 8, 5, 17, 4, it.c2);
  R(g, 9, 6, 15, 2, it.c3);
  R(g, 13, 13, 8, 7, it.c2);
  R(g, 14, 14, 6, 5, it.c3);
  R(g, 15, 18, 4, 1, it.c2);
  R(g, 24, 5, 2, 22, it.c2);
}

/* ---------------- 饰品 ---------------- */

function drawTrinket(g, it) {
  const s = it.style;
  if (s === 'paw') {
    ellipse(g, 16, 20, 7, 6, it.c2);
    ellipse(g, 16, 19, 6, 5, it.c1);
    ellipse(g, 11, 12, 3, 3, it.c1);
    ellipse(g, 16, 10, 3, 3, it.c1);
    ellipse(g, 21, 12, 3, 3, it.c1);
    R(g, 15, 18, 2, 2, it.c3);
    return;
  }
  if (s === 'box') {
    R(g, 7, 10, 18, 14, it.c2);
    R(g, 8, 11, 16, 12, it.c1);
    R(g, 7, 7, 18, 4, it.c2);
    R(g, 8, 8, 16, 2, it.c3);
    R(g, 15, 7, 2, 17, it.c2);
    ellipse(g, 16, 17, 3, 3, it.c3);
    return;
  }
  if (s === 'egg') {
    ellipse(g, 16, 18, 7, 9, it.c2);
    ellipse(g, 15, 17, 5, 7, it.c1);
    R(g, 12, 14, 2, 2, it.c3);
    R(g, 18, 20, 2, 2, it.c2);
    return;
  }
  if (s === 'spur') {
    for (let i = 0; i < 5; i++) R(g, 10 + i * 3, 19 - i, 2, 2, it.c1);
    ellipse(g, 9, 20, 4, 4, it.c2);
    ellipse(g, 9, 20, 3, 3, it.c3);
    R(g, 22, 9, 2, 2, it.c3);
    R(g, 24, 7, 2, 2, it.c3);
    return;
  }
  if (s === 'rod') {
    line(g, 8, 25, 23, 7, it.c2, 2);
    line(g, 9, 24, 22, 7, it.c1, 1);
    ellipse(g, 23, 6, 3, 3, it.c3);
    R(g, 7, 23, 3, 3, it.c2);
    return;
  }
  if (s === 'gel') {
    R(g, 12, 6, 8, 7, it.c2);
    R(g, 13, 7, 6, 5, it.c1);
    R(g, 14, 8, 2, 2, it.c3);
    R(g, 12, 12, 8, 8, it.c2);
    R(g, 13, 13, 6, 6, it.c1);
    R(g, 15, 14, 2, 2, '#ffffff');
    return;
  }
  if (s === 'quiver') {
    R(g, 10, 10, 12, 17, it.c2);
    R(g, 11, 11, 10, 15, it.c1);
    R(g, 10, 8, 12, 4, it.c2);
    for (let i = 0; i < 3; i++) {
      line(g, 12 + i * 3, 7, 12 + i * 3, 1, it.c3, 1);
      R(g, 11 + i * 3, 1, 3, 2, '#f0f0e0');
    }
    R(g, 10, 15, 12, 2, it.c2);
    return;
  }
}

/* ---------------- 电影海报 ---------------- */

function drawPoster(g, it) {
  R(g, 5, 3, 22, 26, it.c2);
  R(g, 6, 4, 20, 24, it.c1);
  R(g, 6, 4, 20, 5, it.c2);
  R(g, 7, 5, 18, 3, it.c3);
  ellipse(g, 16, 16, 6, 6, it.c2);
  ellipse(g, 16, 15, 5, 5, it.c3);
  R(g, 12, 23, 8, 1, it.c2);
  R(g, 14, 25, 4, 1, it.c2);
  const hh = hashOf(it.id);
  R(g, 15 + hh % 3, 13 + hh % 3, 2, 2, '#ffffff');
}

export function drawMiscIcon(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? MISC_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (it.group === 'mail') drawLetter(g, it, it.style === 'note' || it.style === 'card');
  else if (it.group === 'book') drawBook(g, it);
  else if (it.group === 'trinket') drawTrinket(g, it);
  else drawPoster(g, it);

  const hh = hashOf(it.id);
  R(g, 5 + hh % 22, 5 + Math.floor(hh / 22) % 22, 1, 1, it.c3);
  g.restore();
}
