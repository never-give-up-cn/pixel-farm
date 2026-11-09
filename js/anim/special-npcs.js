/* 星露谷特殊 NPC：博物馆、冒险家公会、Joja、姜岛与神秘访客。
 * 复用 npcs.js 的 64×64 头像与 24×32 四方向行走绘制。 */

import {
  drawNpcPortrait, drawNpcWalk,
  NPC_W, NPC_H, PORTRAIT_W, PORTRAIT_H
} from './npcs.js';

export const SPECIAL_GROUPS = [
  { id: 'all', name: '全部' },
  { id: 'town', name: '城镇' },
  { id: 'guild', name: '公会' },
  { id: 'joja', name: 'Joja' },
  { id: 'island', name: '岛屿' },
  { id: 'mystery', name: '神秘' }
];

export const SPECIAL_NPCS = [
  { id:'gunther', name:'冈瑟', en:'Gunther', group:'town', job:'博物馆馆长', skin:'#d9a878', skinShade:'#b08050', hair:'#6a4a2a', hairDark:'#402a14', shirt:'#8a6a4a', shirtDark:'#5a4028', pants:'#4a3a2a', style:'short', glasses:true },
  { id:'governor', name:'州长', en:'Governor', group:'town', job:'州长', skin:'#f2c48d', skinShade:'#d99a63', hair:'#8a5a2a', hairDark:'#5a3414', shirt:'#8a2a3a', shirtDark:'#5a1a2a', pants:'#3a3a4a', style:'short', mustache:true },
  { id:'welwick', name:'威尔维克', en:'Welwick', group:'town', job:'算命师', skin:'#e8d0c0', skinShade:'#c0a090', hair:'#8a5ac0', hairDark:'#5a2a8a', shirt:'#6a3a8a', shirtDark:'#3a1a5a', pants:'#3a1a5a', style:'long', robe:true },

  { id:'marlon', name:'马龙', en:'Marlon', group:'guild', job:'冒险家', skin:'#d9a878', skinShade:'#b08050', hair:'#c8c8c8', hairDark:'#909090', shirt:'#3a3a4a', shirtDark:'#1a1a2a', pants:'#2a2a3a', style:'short', beard:true, eyepatch:true },
  { id:'gil', name:'吉尔', en:'Gil', group:'guild', job:'冒险家', skin:'#e0c0a0', skinShade:'#b09070', hair:'#c8c8c8', hairDark:'#909090', shirt:'#5a7a4a', shirtDark:'#3a5a2a', pants:'#4a3a2a', style:'short', beard:true, hat:'cap' },

  { id:'morris', name:'莫里斯', en:'Morris', group:'joja', job:'Joja 经理', skin:'#f2cfa8', skinShade:'#d9a878', hair:'#2a2a2a', hairDark:'#101010', shirt:'#2a4a8a', shirtDark:'#1a2a5a', pants:'#1a1a2a', style:'short' },
  { id:'bouncer', name:'保镖', en:'Bouncer', group:'joja', job:'保镖', skin:'#d9a878', skinShade:'#b08050', hair:'#2a2a2a', hairDark:'#101010', shirt:'#3a2a2a', shirtDark:'#1a1010', pants:'#2a1a1a', style:'short', glasses:true, mustache:true },
  { id:'henchman', name:'手下', en:'Henchman', group:'joja', job:'手下', skin:'#d9a878', skinShade:'#b08050', hair:'#2a2a2a', hairDark:'#101010', shirt:'#1a1a22', shirtDark:'#101018', pants:'#100e18', style:'short', glasses:true },

  { id:'birdie', name:'鸟婆婆', en:'Birdie', group:'island', job:'姜岛居民', skin:'#e0c0a0', skinShade:'#b09070', hair:'#c8c8c8', hairDark:'#909090', shirt:'#5a8a4a', shirtDark:'#3a6a2a', pants:'#6a4a2a', style:'bun', robe:true },
  { id:'professor_snail', name:'蜗牛教授', en:'Professor Snail', group:'island', job:'教授', skin:'#e8d0c0', skinShade:'#c0a090', hair:'#e8e8f0', hairDark:'#b0b0c0', shirt:'#8a7a4a', shirtDark:'#5a4a2a', pants:'#4a3a2a', style:'short', beard:true, glasses:true, hat:'cap' },
  { id:'old_mariner', name:'老水手', en:'Old Mariner', group:'island', job:'幽灵水手', skin:'#b0c0c0', skinShade:'#8a9a9a', hair:'#c8c8c8', hairDark:'#909090', shirt:'#4a6a7a', shirtDark:'#2a4a5a', pants:'#3a5a6a', style:'long', beard:true, robe:true },

  { id:'mr_qi', name:'齐先生', en:'Mr. Qi', group:'mystery', job:'神秘商人', skin:'#b0c0d8', skinShade:'#8090a8', hair:'#4a8ac0', hairDark:'#2a5a8a', shirt:'#2a3a6a', shirtDark:'#1a2a4a', pants:'#1a1a2a', style:'short', glasses:true }
];

export const SPECIAL_MAP = Object.fromEntries(SPECIAL_NPCS.map(n => [n.id, n]));

export function specialGroupName(g) {
  const x = SPECIAL_GROUPS.find(v => v.id === g);
  return x ? x.name : g;
}

export function drawSpecialPortrait(g, npc) {
  drawNpcPortrait(g, typeof npc === 'string' ? SPECIAL_MAP[npc] : npc);
}

export function drawSpecialWalk(g, npc, dir, frame) {
  drawNpcWalk(g, typeof npc === 'string' ? SPECIAL_MAP[npc] : npc, dir, frame);
}

export { NPC_W, NPC_H, PORTRAIT_W, PORTRAIT_H };
