/* 星露谷村民图鉴：34 位可送礼村民（12 位可结婚 + 22 位村民）。
 * 每位村民有 64×64 头像与 24×32 四方向行走小人；
 * 外观按发色、发型、服装、眼镜/胡子/帽子/围裙/轮椅等特征区分。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const NPC_W = 24;
export const NPC_H = 32;
export const PORTRAIT_W = 64;
export const PORTRAIT_H = 64;

export const NPC_DIRS = [
  { id: 0, name: '下' },
  { id: 1, name: '左' },
  { id: 2, name: '右' },
  { id: 3, name: '上' }
];

export const NPCS = [
  { id:'abigail', name:'阿比盖尔', en:'Abigail', marry:true, birthday:'秋 13', job:'冒险者', loved:'紫水晶', skin:'#f2c48d', skinShade:'#d99a63', hair:'#7a3a9a', hairDark:'#4a1a6a', shirt:'#3a3a5a', shirtDark:'#262640', pants:'#2a2a3a', style:'long' },
  { id:'alex', name:'亚历克斯', en:'Alex', marry:true, birthday:'夏 13', job:'运动员', loved:'完美早餐', skin:'#e0a878', skinShade:'#c08658', hair:'#8a5a2a', hairDark:'#5a3414', shirt:'#4a8a4a', shirtDark:'#2f6a2f', pants:'#3a5a8a', style:'spiky' },
  { id:'elliott', name:'艾利欧特', en:'Elliott', marry:true, birthday:'秋 5', job:'作家', loved:'蟹黄糕', skin:'#f2cfa8', skinShade:'#d9a878', hair:'#a05a3a', hairDark:'#6a3420', shirt:'#8a4a3a', shirtDark:'#5a2a20', pants:'#4a3a2a', style:'long' },
  { id:'emily', name:'艾米丽', en:'Emily', marry:true, birthday:'春 27', job:'裁缝', loved:'紫水晶', skin:'#f2c48d', skinShade:'#d99a63', hair:'#3a8ac0', hairDark:'#1e5a8a', shirt:'#d04a5a', shirtDark:'#8a2a3a', pants:'#3a5a8a', style:'bob' },
  { id:'haley', name:'海莉', en:'Haley', marry:true, birthday:'春 14', job:'摄影师', loved:'椰子', skin:'#f8d8b0', skinShade:'#d9b080', hair:'#e0c060', hairDark:'#a08020', shirt:'#e08aa0', shirtDark:'#a04a6a', pants:'#4a6a9a', style:'long' },
  { id:'harvey', name:'哈维', en:'Harvey', marry:true, birthday:'冬 14', job:'医生', loved:'咖啡', skin:'#f2cfa8', skinShade:'#d9a878', hair:'#6a4a2a', hairDark:'#402a14', shirt:'#4a8a5a', shirtDark:'#2f6a3a', pants:'#4a3a2a', style:'curly', glasses:true, mustache:true },
  { id:'leah', name:'莉亚', en:'Leah', marry:true, birthday:'冬 23', job:'艺术家', loved:'山羊奶酪', skin:'#f2c48d', skinShade:'#d99a63', hair:'#c06a3a', hairDark:'#8a3a1a', shirt:'#5a8a4a', shirtDark:'#3a6a2a', pants:'#6a4a2a', style:'ponytail' },
  { id:'maru', name:'玛鲁', en:'Maru', marry:true, birthday:'夏 10', job:'发明家', loved:'电池组', skin:'#a86a42', skinShade:'#7a4a2a', hair:'#2a2a2a', hairDark:'#101010', shirt:'#d04a4a', shirtDark:'#8a2a2a', pants:'#3a5a8a', style:'buns', glasses:true },
  { id:'penny', name:'潘妮', en:'Penny', marry:true, birthday:'秋 2', job:'教师', loved:'钻石', skin:'#f2c48d', skinShade:'#d99a63', hair:'#c05a3a', hairDark:'#8a2a1a', shirt:'#e0d080', shirtDark:'#a09040', pants:'#8a6a4a', style:'bob' },
  { id:'sam', name:'山姆', en:'Sam', marry:true, birthday:'夏 17', job:'音乐人', loved:'枫糖棒', skin:'#f2c48d', skinShade:'#d99a63', hair:'#e0c060', hairDark:'#a08020', shirt:'#4a8ac0', shirtDark:'#2a5a8a', pants:'#3a3a5a', style:'spiky' },
  { id:'sebastian', name:'塞巴斯蒂安', en:'Sebastian', marry:true, birthday:'冬 10', job:'程序员', loved:'黑曜石', skin:'#e8c8a8', skinShade:'#c8a080', hair:'#2a2a3a', hairDark:'#10101a', shirt:'#3a3a4a', shirtDark:'#242434', pants:'#2a2a3a', style:'bob' },
  { id:'shane', name:'谢恩', en:'Shane', marry:true, birthday:'春 20', job:'牧场工', loved:'辣椒', skin:'#f2c48d', skinShade:'#d99a63', hair:'#4a3a2a', hairDark:'#2a1a10', shirt:'#3a5a8a', shirtDark:'#243a5a', pants:'#4a4a4a', style:'short', stubble:true },

  { id:'caroline', name:'卡洛琳', en:'Caroline', marry:false, birthday:'冬 7', job:'主妇', loved:'鱼肉卷', skin:'#f2c48d', skinShade:'#d99a63', hair:'#5a9a4a', hairDark:'#3a6a2a', shirt:'#4a8ac0', shirtDark:'#2a5a8a', pants:'#6a4a2a', style:'bob' },
  { id:'clint', name:'克林特', en:'Clint', marry:false, birthday:'冬 26', job:'铁匠', loved:'紫水晶', skin:'#d9a878', skinShade:'#b08050', hair:'#3a2a1a', hairDark:'#201008', shirt:'#6a6a7a', shirtDark:'#4a4a5a', pants:'#4a3a2a', style:'short', apron:true, beard:true },
  { id:'demetrius', name:'德米特里厄斯', en:'Demetrius', marry:false, birthday:'夏 19', job:'科学家', loved:'豆类火锅', skin:'#a86a42', skinShade:'#7a4a2a', hair:'#2a2a2a', hairDark:'#101010', shirt:'#4a7a9a', shirtDark:'#2a5a7a', pants:'#3a4a5a', style:'short', glasses:true },
  { id:'dwarf', name:'矮人', en:'Dwarf', marry:false, birthday:'夏 22', job:'商人', loved:'紫水晶', skin:'#b0a090', skinShade:'#8a7a6a', hair:'#d8d0c0', hairDark:'#a8a090', shirt:'#6a6a7a', shirtDark:'#4a4a5a', pants:'#4a3a2a', style:'short', beard:true, helmet:true, short:true },
  { id:'evelyn', name:'艾芙琳', en:'Evelyn', marry:false, birthday:'冬 20', job:'祖母', loved:'甜菜', skin:'#f2c48d', skinShade:'#d99a63', hair:'#e8e8f0', hairDark:'#b0b0c0', shirt:'#e0a0c0', shirtDark:'#a06a8a', pants:'#8a6a4a', style:'bun' },
  { id:'george', name:'乔治', en:'George', marry:false, birthday:'秋 24', job:'退休', loved:'炸蘑菇', skin:'#f2c48d', skinShade:'#d99a63', hair:'#e8e8f0', hairDark:'#b0b0c0', shirt:'#5a8a4a', shirtDark:'#3a6a2a', pants:'#4a4a4a', style:'short', glasses:true, wheelchair:true },
  { id:'gus', name:'格斯', en:'Gus', marry:false, birthday:'夏 8', job:'酒馆老板', loved:'橙子', skin:'#d9a878', skinShade:'#b08050', hair:'#6a4a2a', hairDark:'#402a14', shirt:'#6a4a2a', shirtDark:'#402a14', pants:'#4a3a2a', style:'short', mustache:true, apron:true },
  { id:'jas', name:'贾斯', en:'Jas', marry:false, birthday:'夏 4', job:'小孩', loved:'玫瑰仙子', skin:'#f2c48d', skinShade:'#d99a63', hair:'#4a2a5a', hairDark:'#2a103a', shirt:'#8a5aa0', shirtDark:'#5a3a6a', pants:'#4a3a5a', style:'pigtails', child:true },
  { id:'jodi', name:'乔迪', en:'Jodi', marry:false, birthday:'秋 11', job:'主妇', loved:'巧克力蛋糕', skin:'#f2c48d', skinShade:'#d99a63', hair:'#8a5a2a', hairDark:'#5a3414', shirt:'#d06a9a', shirtDark:'#8a3a6a', pants:'#3a5a8a', style:'ponytail' },
  { id:'kent', name:'肯特', en:'Kent', marry:false, birthday:'春 4', job:'士兵', loved:'烤榛子', skin:'#d9a878', skinShade:'#b08050', hair:'#6a4a2a', hairDark:'#402a14', shirt:'#5a7a4a', shirtDark:'#3a5a2a', pants:'#3a3a3a', style:'short' },
  { id:'krobus', name:'科罗布斯', en:'Krobus', marry:false, birthday:'冬 1', job:'影子商人', loved:'钻石', skin:'#20202a', skinShade:'#101018', hair:'#20202a', hairDark:'#101018', shirt:'#20202a', shirtDark:'#101018', pants:'#101018', style:'shadow' },
  { id:'leo', name:'雷欧', en:'Leo', marry:false, birthday:'夏 26', job:'小孩', loved:'芒果', skin:'#a86a42', skinShade:'#7a4a2a', hair:'#c07a3a', hairDark:'#8a4a1a', shirt:'#5aa04a', shirtDark:'#3a7a2a', pants:'#8a6a3a', style:'short', child:true },
  { id:'lewis', name:'刘易斯', en:'Lewis', marry:false, birthday:'春 7', job:'镇长', loved:'辣椒', skin:'#f2cfa8', skinShade:'#d9a878', hair:'#c8c8c8', hairDark:'#909090', shirt:'#5a8a4a', shirtDark:'#3a6a2a', pants:'#4a3a2a', style:'short', hat:'cap' },
  { id:'linus', name:'莱纳斯', en:'Linus', marry:false, birthday:'冬 3', job:'流浪者', loved:'蓝莓', skin:'#d9a878', skinShade:'#b08050', hair:'#c8c8c8', hairDark:'#909090', shirt:'#5a6a4a', shirtDark:'#3a4a2a', pants:'#4a3a2a', style:'long', beard:true, robe:true },
  { id:'marnie', name:'玛妮', en:'Marnie', marry:false, birthday:'秋 18', job:'牧场主', loved:'南瓜派', skin:'#f2c48d', skinShade:'#d99a63', hair:'#8a5a2a', hairDark:'#5a3414', shirt:'#d04a4a', shirtDark:'#8a2a2a', pants:'#8a6a4a', style:'bob' },
  { id:'pam', name:'潘姆', en:'Pam', marry:false, birthday:'春 18', job:'司机', loved:'啤酒', skin:'#d9a878', skinShade:'#b08050', hair:'#e0c060', hairDark:'#a08020', shirt:'#4a6a9a', shirtDark:'#2a4a7a', pants:'#3a3a4a', style:'curly' },
  { id:'pierre', name:'皮埃尔', en:'Pierre', marry:false, birthday:'春 26', job:'店主', loved:'炸鱿鱼', skin:'#f2c48d', skinShade:'#d99a63', hair:'#6a4a2a', hairDark:'#402a14', shirt:'#4a8a5a', shirtDark:'#2f6a3a', pants:'#4a3a2a', style:'short', glasses:true, apron:true },
  { id:'robin', name:'罗宾', en:'Robin', marry:false, birthday:'秋 21', job:'木匠', loved:'意大利面', skin:'#f2c48d', skinShade:'#d99a63', hair:'#c05a3a', hairDark:'#8a2a1a', shirt:'#5a8a4a', shirtDark:'#3a6a2a', pants:'#6a4a2a', style:'short' },
  { id:'sandy', name:'桑迪', en:'Sandy', marry:false, birthday:'秋 15', job:'绿洲老板', loved:'番红花', skin:'#d9a878', skinShade:'#b08050', hair:'#d04a8a', hairDark:'#8a2a5a', shirt:'#4a8ac0', shirtDark:'#2a5a8a', pants:'#d06a8a', style:'long' },
  { id:'vincent', name:'文森特', en:'Vincent', marry:false, birthday:'春 10', job:'小孩', loved:'葡萄', skin:'#f2c48d', skinShade:'#d99a63', hair:'#e0c060', hairDark:'#a08020', shirt:'#4a8ac0', shirtDark:'#2a5a8a', pants:'#4a6a3a', style:'short', child:true },
  { id:'willy', name:'威利', en:'Willy', marry:false, birthday:'夏 24', job:'渔夫', loved:'鲶鱼', skin:'#d9a878', skinShade:'#b08050', hair:'#c8c8c8', hairDark:'#909090', shirt:'#3a5a8a', shirtDark:'#243a5a', pants:'#4a3a2a', style:'short', beard:true },
  { id:'wizard', name:'法师', en:'Wizard', marry:false, birthday:'冬 17', job:'法师', loved:'紫蘑菇', skin:'#e8d0c0', skinShade:'#c0a090', hair:'#6a3a8a', hairDark:'#3a1a5a', shirt:'#6a3a8a', shirtDark:'#3a1a5a', pants:'#3a1a5a', style:'long', beard:true, hat:'wizard', robe:true }
];

export const NPC_MAP = Object.fromEntries(NPCS.map(n => [n.id, n]));

/* ---------------- 头像 64×64 ---------------- */

function hairFront(g, n, cx, top) {
  const H = n.hair, D = n.hairDark, st = n.style;
  if (st === 'shadow') return;
  if (st === 'short') {
    R(g, cx - 12, top, 24, 8, H);
    R(g, cx - 12, top + 8, 3, 9, H);
    R(g, cx + 9, top + 8, 3, 9, H);
    R(g, cx - 9, top + 1, 8, 2, D);
  } else if (st === 'bob') {
    R(g, cx - 13, top, 26, 9, H);
    R(g, cx - 13, top + 9, 4, 18, H);
    R(g, cx + 9, top + 9, 4, 18, H);
    R(g, cx - 9, top + 1, 9, 2, D);
  } else if (st === 'long') {
    R(g, cx - 12, top, 24, 9, H);
    R(g, cx - 13, top + 9, 4, 28, H);
    R(g, cx + 9, top + 9, 4, 28, H);
    R(g, cx - 9, top + 1, 8, 2, D);
    R(g, cx - 13, top + 30, 4, 7, D);
    R(g, cx + 9, top + 30, 4, 7, D);
  } else if (st === 'spiky') {
    R(g, cx - 12, top, 24, 8, H);
    for (let i = 0; i < 5; i++) {
      R(g, cx - 11 + i * 5, top - 3 - (i % 2), 3, 4, H);
    }
    R(g, cx - 12, top + 8, 3, 9, H);
    R(g, cx + 9, top + 8, 3, 9, H);
  } else if (st === 'ponytail') {
    R(g, cx - 12, top, 24, 9, H);
    R(g, cx - 12, top + 8, 3, 13, H);
    R(g, cx + 11, top + 6, 5, 14, H);
    R(g, cx + 14, top + 16, 3, 10, D);
    R(g, cx - 9, top + 1, 8, 2, D);
  } else if (st === 'curly') {
    R(g, cx - 12, top, 24, 8, H);
    for (let i = 0; i < 5; i++) ellipse(g, cx - 10 + i * 5, top + (i % 2), 4, 4, H);
    R(g, cx - 12, top + 8, 3, 11, H);
    R(g, cx + 9, top + 8, 3, 11, H);
    R(g, cx - 8, top + 1, 6, 2, D);
  } else if (st === 'bun') {
    R(g, cx - 12, top, 24, 8, H);
    R(g, cx - 12, top + 8, 3, 10, H);
    R(g, cx + 9, top + 8, 3, 10, H);
    ellipse(g, cx, top - 5, 6, 5, H);
    ellipse(g, cx, top - 5, 4, 3, D);
  } else if (st === 'buns') {
    R(g, cx - 12, top, 24, 8, H);
    R(g, cx - 12, top + 8, 3, 10, H);
    R(g, cx + 9, top + 8, 3, 10, H);
    ellipse(g, cx - 9, top - 4, 5, 5, H);
    ellipse(g, cx + 9, top - 4, 5, 5, H);
    R(g, cx - 11, top - 5, 3, 1, D);
    R(g, cx + 7, top - 5, 3, 1, D);
  } else if (st === 'pigtails') {
    R(g, cx - 12, top, 24, 8, H);
    R(g, cx - 12, top + 8, 3, 9, H);
    R(g, cx + 9, top + 8, 3, 9, H);
    R(g, cx - 16, top + 8, 4, 14, H);
    R(g, cx + 12, top + 8, 4, 14, H);
    R(g, cx - 16, top + 18, 4, 4, D);
    R(g, cx + 12, top + 18, 4, 4, D);
  }
}

function drawPortrait(g, n) {
  const cx = 32;
  const top = 14;
  const skin = n.skin, shade = n.skinShade;

  if (n.style === 'shadow') {
    /* 科罗布斯 */
    ellipse(g, 32, 34, 18, 22, '#101018');
    ellipse(g, 32, 32, 16, 20, '#20202a');
    R(g, 24, 26, 5, 6, '#f0f0f0');
    R(g, 35, 26, 5, 6, '#f0f0f0');
    R(g, 27, 29, 2, 2, '#101018');
    R(g, 38, 29, 2, 2, '#101018');
    R(g, 28, 40, 8, 2, '#c0c0c0');
    return;
  }

  /* 肩膀 / 衣服 */
  R(g, 8, 46, 48, 18, '#241a12');
  ellipse(g, 32, 58, 22, 10, '#241a12');
  ellipse(g, 32, 58, 21, 9, n.shirtDark);
  R(g, 12, 47, 40, 17, n.shirt);
  R(g, 12, 47, 40, 2, n.shirtDark);
  R(g, 30, 47, 4, 17, n.shirtDark);
  /* 领口 */
  R(g, 27, 47, 10, 4, skin);
  R(g, 26, 50, 12, 1, n.shirtDark);

  /* 脖子 */
  R(g, 27, 39, 10, 8, '#241a12');
  R(g, 28, 40, 8, 7, shade);

  /* 头（带 1px 深色外轮廓） */
  ellipse(g, cx, 28, 13, 14, '#241a12');
  ellipse(g, cx, 28, 12, 13, skin);
  R(g, 19, 27, 2, 5, shade);
  R(g, 43, 27, 2, 5, shade);
  R(g, 24, 16, 16, 2, shade);
  /* 脸颊阴影 */
  R(g, 23, 31, 2, 3, shade);
  R(g, 39, 31, 2, 3, shade);

  /* 头发 */
  hairFront(g, n, cx, top);

  /* 眼睛 */
  R(g, 26, 27, 4, 3, '#ffffff');
  R(g, 34, 27, 4, 3, '#ffffff');
  R(g, 27, 28, 2, 2, '#2a1e16');
  R(g, 35, 28, 2, 2, '#2a1e16');
  /* 眉毛 */
  R(g, 26, 24, 4, 1, n.hairDark);
  R(g, 34, 24, 4, 1, n.hairDark);
  /* 鼻子 / 嘴 */
  R(g, 31, 32, 2, 2, shade);
  R(g, 29, 36, 6, 1, '#8a4a4a');

  /* 眼镜 */
  if (n.glasses) {
    R(g, 24, 26, 7, 1, '#2a2a2a');
    R(g, 24, 26, 1, 5, '#2a2a2a');
    R(g, 30, 26, 1, 5, '#2a2a2a');
    R(g, 24, 30, 7, 1, '#2a2a2a');
    R(g, 33, 26, 7, 1, '#2a2a2a');
    R(g, 33, 26, 1, 5, '#2a2a2a');
    R(g, 39, 26, 1, 5, '#2a2a2a');
    R(g, 33, 30, 7, 1, '#2a2a2a');
    R(g, 31, 28, 2, 1, '#2a2a2a');
  }
  /* 眼罩 */
  if (n.eyepatch) {
    R(g, 32, 26, 9, 6, '#1a1a1a');
    R(g, 32, 26, 9, 1, '#3a3a3a');
    line(g, 24, 27, 44, 25, '#2a2a2a', 1);
  }

  /* 胡子 / 八字胡 / 胡茬 */
  if (n.beard) {
    R(g, 22, 35, 20, 8, n.hair);
    R(g, 24, 41, 16, 4, n.hair);
    R(g, 28, 34, 8, 2, n.hairDark);
    R(g, 29, 36, 6, 2, '#8a4a4a');
  } else if (n.stubble) {
    R(g, 23, 37, 18, 3, n.hair);
    R(g, 27, 35, 10, 1, n.hairDark);
    R(g, 29, 36, 6, 2, '#8a4a4a');
  } else if (n.mustache) {
    R(g, 26, 34, 12, 2, n.hairDark);
  }

  /* 围裙 */
  if (n.apron) {
    R(g, 22, 48, 20, 16, '#e8e0d0');
    R(g, 30, 48, 4, 16, '#cfc3a0');
    R(g, 24, 50, 2, 2, '#cfc3a0');
  }

  /* 帽子 / 头盔 */
  if (n.hat === 'wizard') {
    for (let i = 0; i < 12; i++) {
      const w = 3 + i;
      R(g, cx - w, 14 - i, w * 2, 1, n.shirtDark);
    }
    R(g, 18, 14, 28, 2, n.shirt);
    R(g, 24, 15, 16, 1, n.hair);
  } else if (n.hat === 'cap') {
    R(g, 16, 15, 32, 3, '#8a5a2a');
    R(g, 20, 9, 24, 7, '#a06a3a');
    R(g, 20, 9, 24, 1, '#c08a4a');
    R(g, 18, 18, 36, 2, '#6b4226');
  }
  if (n.helmet) {
    ellipse(g, cx, 18, 13, 8, '#9a9aa8');
    R(g, 18, 20, 28, 2, '#6a6a7a');
    R(g, 28, 12, 8, 2, '#c0c0d0');
  }

  /* 轮椅提示 */
  if (n.wheelchair) {
    R(g, 6, 48, 4, 12, '#4a4a4a');
    R(g, 54, 48, 4, 12, '#4a4a4a');
  }
}

/* ---------------- 行走小人 24×32 ---------------- */

function drawWalk(g, n, dir, frame) {
  const cx = 12, base = 30;
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const side = dir === 1 || dir === 2;
  const back = dir === 3;
  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;

  if (n.style === 'shadow') {
    ellipse(g, cx, 25, 7, 6, '#20202a');
    ellipse(g, cx, 28, 6, 3, '#101018');
    R(g, cx - 4, 22, 3, 3, '#f0f0f0');
    R(g, cx + 2, 22, 3, 3, '#f0f0f0');
    R(g, cx - 3, 23, 1, 1, '#101018');
    R(g, cx + 3, 23, 1, 1, '#101018');
    return;
  }

  const { skin, skinShade, hair, hairDark, shirt, shirtDark, pants } = n;
  const child = n.child || n.short;
  const legTop = child ? 24 : 23;
  const headY = (child ? 10 : 9) + bob;

  /* 影子 */
  ellipse(g, cx, base + 1, 5, 1, 'rgba(20, 26, 18, 0.25)');

  /* 腿 */
  if (!n.wheelchair && !n.robe) {
    const l1 = side ? stride * 2 : stride;
    const l2 = side ? -stride * 2 : -stride;
    R(g, cx - 3 + l1, legTop, 2, base - legTop, pants);
    R(g, cx + 1 + l2, legTop, 2, base - legTop, pants);
    R(g, cx - 4 + l1, base - 1, 3, 2, '#3a2a1a');
    R(g, cx + l2, base - 1, 3, 2, '#3a2a1a');
  }

  /* 身体 */
  R(g, cx - 5, headY + 6, 10, 10, '#241a12');
  R(g, cx - 4, headY + 7, 8, 9, shirt);
  R(g, cx - 4, headY + 7, 1, 9, shirtDark);
  R(g, cx + 3, headY + 7, 1, 9, shirtDark);
  R(g, cx - 3, headY + 15, 6, 2, pants);

  /* 手臂 */
  if (side) {
    R(g, cx - 1, headY + 9, 2, 6, skin);
    R(g, cx + 2, headY + 8, 2, 6, skinShade);
  } else {
    R(g, cx - 6, headY + 8, 2, 6, skin);
    R(g, cx + 4, headY + 8, 2, 6, skin);
  }

  /* 头 */
  ellipse(g, cx, headY + 3, 6, 6, '#241a12');
  ellipse(g, cx, headY + 3, 5, 5, skin);
  R(g, cx - 3, headY + 6, 6, 1, skinShade);
  /* 头发 */
  if (back) {
    R(g, cx - 5, headY - 2, 10, 7, hair);
    R(g, cx - 4, headY + 1, 8, 3, hairDark);
  } else {
    R(g, cx - 5, headY - 2, 10, 4, hair);
    if (side) {
      R(g, cx - side * 5, headY - 1, 2, 5, hair);
    } else {
      R(g, cx - 5, headY + 2, 2, 4, hair);
      R(g, cx + 3, headY + 2, 2, 4, hair);
    }
    if (n.style === 'buns') {
      R(g, cx - 7, headY - 3, 3, 3, hair);
      R(g, cx + 4, headY - 3, 3, 3, hair);
    } else if (n.style === 'bun') {
      R(g, cx - 2, headY - 5, 5, 3, hair);
    } else if (n.style === 'pigtails') {
      R(g, cx - 8, headY + 2, 2, 6, hair);
      R(g, cx + 6, headY + 2, 2, 6, hair);
    } else if (n.style === 'curly') {
      R(g, cx - 6, headY - 3, 2, 2, hair);
      R(g, cx + 4, headY - 3, 2, 2, hair);
    }
    /* 眼睛 */
    if (!back) {
      if (side) R(g, cx + 2, headY + 3, 1, 1, '#2a1e16');
      else {
        R(g, cx - 3, headY + 3, 1, 1, '#2a1e16');
        R(g, cx + 2, headY + 3, 1, 1, '#2a1e16');
      }
    }
  }

  /* 胡子 */
  if (n.beard && !back) R(g, cx - 3, headY + 6, 6, 2, hair);
  if (n.stubble && !back) R(g, cx - 3, headY + 6, 6, 1, hair);
  /* 眼镜 */
  if (n.glasses && !back) {
    R(g, cx - 4, headY + 2, 4, 1, '#2a2a2a');
    R(g, cx, headY + 2, 4, 1, '#2a2a2a');
  }
  if (n.eyepatch && !back) {
    R(g, cx + 1, headY + 2, 4, 3, '#1a1a1a');
    line(g, cx - 4, headY + 3, cx + 5, headY + 2, '#2a2a2a', 1);
  }
  /* 帽子 / 头盔 */
  if (n.hat === 'wizard') {
    R(g, cx - 6, headY - 2, 12, 1, shirtDark);
    R(g, cx - 3, headY - 6, 6, 4, shirtDark);
  } else if (n.hat === 'cap') {
    R(g, cx - 6, headY - 2, 12, 2, '#a06a3a');
    R(g, cx - 8, headY, 16, 1, '#6b4226');
  }
  if (n.helmet) {
    R(g, cx - 5, headY - 2, 10, 4, '#9a9aa8');
    R(g, cx - 6, headY + 2, 12, 1, '#6a6a7a');
  }
  /* 围裙 */
  if (n.apron) R(g, cx - 2, headY + 8, 4, 7, '#e8e0d0');
  /* 长袍 */
  if (n.robe) {
    R(g, cx - 4, headY + 16, 8, 6, shirt);
    R(g, cx - 5, base - 2, 10, 2, shirtDark);
  }
  /* 轮椅 */
  if (n.wheelchair) {
    R(g, cx - 7, headY + 16, 2, 2, '#4a4a4a');
    R(g, cx + 5, headY + 16, 2, 2, '#4a4a4a');
    ellipse(g, cx - 6, base - 4, 2, 3, '#5a5a5a');
    ellipse(g, cx + 6, base - 4, 2, 3, '#5a5a5a');
    R(g, cx - 5, headY + 7, 10, 2, '#6a6a6a');
  }
}

export function drawNpcWalk(g, npc, dir, frame) {
  const n = typeof npc === 'string' ? NPC_MAP[npc] : npc;
  if (!n) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (dir === 1) {
    g.translate(NPC_W, 0);
    g.scale(-1, 1);
    drawWalk(g, n, 2, frame);
  } else {
    drawWalk(g, n, dir, frame);
  }
  g.restore();
}

export function drawNpcPortrait(g, npc) {
  const n = typeof npc === 'string' ? NPC_MAP[npc] : npc;
  if (!n) return;
  g.save();
  g.imageSmoothingEnabled = false;
  drawPortrait(g, n);
  g.restore();
}
