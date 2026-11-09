/* 星露谷怪物图鉴：49 种常见怪物（含危险变体与史莱姆颜色）。
 * 每个怪物画在 40×32 格子里，带小幅待机动画。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const MONSTER_W = 40;
export const MONSTER_H = 32;

export const MONSTER_LOCS = [
  { id: 'all', name: '全部' },
  { id: 'mine', name: '矿井' },
  { id: 'skull', name: '骷髅洞穴' },
  { id: 'volcano', name: '火山' },
  { id: 'quarry', name: '采石场' },
  { id: 'lair', name: '虫巢' },
  { id: 'farm', name: '农场' }
];

export const MONSTERS = [
  { id:'green_slime', name:'绿色史莱姆', en:'Green Slime', loc:'mine', hp:24, dmg:5, shape:'slime', c1:'#5aa04a', c2:'#3a6a2a', c3:'#a0d060' },
  { id:'blue_slime', name:'蓝色史莱姆', en:'Blue Slime', loc:'mine', hp:106, dmg:7, shape:'slime', c1:'#4a7ac0', c2:'#2a4a8a', c3:'#a0c0f0' },
  { id:'red_slime', name:'红色史莱姆', en:'Red Slime', loc:'mine', hp:205, dmg:16, shape:'slime', c1:'#c04a3a', c2:'#8a2a1a', c3:'#f08a70' },
  { id:'purple_slime', name:'紫色史莱姆', en:'Purple Slime', loc:'skull', hp:410, dmg:16, shape:'slime', c1:'#8a5ac0', c2:'#5a2a8a', c3:'#c0a0f0' },
  { id:'copper_slime', name:'铜史莱姆', en:'Copper Slime', loc:'quarry', hp:102, dmg:16, shape:'slime', c1:'#c07a3a', c2:'#8a4a1a', c3:'#f0b070' },
  { id:'iron_slime', name:'铁史莱姆', en:'Iron Slime', loc:'quarry', hp:205, dmg:16, shape:'slime', c1:'#8a8a9a', c2:'#5a5a6a', c3:'#c0c0d0' },
  { id:'tiger_slime', name:'老虎史莱姆', en:'Tiger Slime', loc:'volcano', hp:415, dmg:23, shape:'slime', c1:'#e0a03a', c2:'#a06010', c3:'#f0d080' },
  { id:'big_slime', name:'大史莱姆', en:'Big Slime', loc:'skull', hp:60, dmg:5, shape:'bigslime', c1:'#6ab04a', c2:'#3a7a2a', c3:'#b0e080' },
  { id:'metal_head', name:'金属头', en:'Metal Head', loc:'mine', hp:40, dmg:15, shape:'metalhead', c1:'#8a8a9a', c2:'#4a4a5a', c3:'#f0c040' },

  { id:'bat', name:'蝙蝠', en:'Bat', loc:'mine', hp:24, dmg:6, shape:'bat', c1:'#5a4a6a', c2:'#2a1a3a', c3:'#a080c0' },
  { id:'frost_bat', name:'冰霜蝙蝠', en:'Frost Bat', loc:'mine', hp:36, dmg:7, shape:'bat', c1:'#6a9ac0', c2:'#2a5a8a', c3:'#b0e0ff' },
  { id:'lava_bat', name:'岩浆蝙蝠', en:'Lava Bat', loc:'mine', hp:80, dmg:15, shape:'bat', c1:'#d04a2a', c2:'#8a1a0a', c3:'#f0a060' },
  { id:'iridium_bat', name:'铱蝙蝠', en:'Iridium Bat', loc:'skull', hp:300, dmg:30, shape:'bat', c1:'#8a6ac0', c2:'#4a2a8a', c3:'#d0b0ff' },

  { id:'bug', name:'甲虫', en:'Bug', loc:'mine', hp:1, dmg:8, shape:'bug', c1:'#8a6a3a', c2:'#5a3a1a', c3:'#d0b080' },
  { id:'cave_fly', name:'洞穴苍蝇', en:'Cave Fly', loc:'mine', hp:22, dmg:6, shape:'fly', c1:'#6a6a7a', c2:'#3a3a4a', c3:'#c0c0d0' },
  { id:'grub', name:'蛆虫', en:'Grub', loc:'mine', hp:20, dmg:4, shape:'grub', c1:'#d0c090', c2:'#a09060', c3:'#f0e8c0' },
  { id:'mutant_fly', name:'变异苍蝇', en:'Mutant Fly', loc:'lair', hp:66, dmg:12, shape:'fly', c1:'#5a9a3a', c2:'#3a6a2a', c3:'#a0d060' },
  { id:'mutant_grub', name:'变异蛆虫', en:'Mutant Grub', loc:'lair', hp:100, dmg:12, shape:'grub', c1:'#8ac05a', c2:'#5a8a2a', c3:'#c0f080' },
  { id:'armored_bug', name:'装甲甲虫', en:'Armored Bug', loc:'skull', hp:1, dmg:8, shape:'bug', c1:'#8a8a9a', c2:'#4a4a5a', c3:'#c0c0d0' },

  { id:'duggy', name:'地鼠', en:'Duggy', loc:'mine', hp:40, dmg:6, shape:'duggy', c1:'#b08a50', c2:'#7a5a2a', c3:'#e0c090' },
  { id:'magma_duggy', name:'岩浆地鼠', en:'Magma Duggy', loc:'volcano', hp:380, dmg:16, shape:'duggy', c1:'#d06a2a', c2:'#8a3a0a', c3:'#f0b060' },
  { id:'dust_sprite', name:'尘埃精灵', en:'Dust Sprite', loc:'mine', hp:40, dmg:6, shape:'sprite', c1:'#6a5a4a', c2:'#3a2a1a', c3:'#c0a080' },
  { id:'magma_sprite', name:'岩浆精灵', en:'Magma Sprite', loc:'volcano', hp:220, dmg:15, shape:'sprite', c1:'#e05a2a', c2:'#a02a0a', c3:'#f0c060' },
  { id:'magma_sparker', name:'岩浆火花', en:'Magma Sparker', loc:'volcano', hp:310, dmg:15, shape:'sprite', c1:'#f0a03a', c2:'#a06010', c3:'#ffe080' },

  { id:'rock_crab', name:'岩石蟹', en:'Rock Crab', loc:'mine', hp:30, dmg:5, shape:'crab', c1:'#8a8a7a', c2:'#5a5a4a', c3:'#c0c0a0' },
  { id:'lava_crab', name:'岩浆蟹', en:'Lava Crab', loc:'mine', hp:120, dmg:15, shape:'crab', c1:'#d05a2a', c2:'#8a2a0a', c3:'#f0a060' },
  { id:'iridium_crab', name:'铱蟹', en:'Iridium Crab', loc:'skull', hp:240, dmg:15, shape:'crab', c1:'#8a6ac0', c2:'#4a2a8a', c3:'#d0b0ff' },
  { id:'truffle_crab', name:'松露蟹', en:'Truffle Crab', loc:'farm', hp:30, dmg:5, shape:'crab', c1:'#8a5a3a', c2:'#5a3418', c3:'#c09060' },

  { id:'ghost', name:'幽灵', en:'Ghost', loc:'mine', hp:96, dmg:10, shape:'ghost', c1:'#d0e0e8', c2:'#8aa0b0', c3:'#ffffff' },
  { id:'carbon_ghost', name:'碳幽灵', en:'Carbon Ghost', loc:'skull', hp:190, dmg:25, shape:'ghost', c1:'#5a5a6a', c2:'#2a2a3a', c3:'#a0a0b0' },
  { id:'putrid_ghost', name:'腐臭幽灵', en:'Putrid Ghost', loc:'mine', hp:500, dmg:25, shape:'ghost', c1:'#7a9a4a', c2:'#4a6a2a', c3:'#c0e080' },

  { id:'skeleton', name:'骷髅', en:'Skeleton', loc:'mine', hp:140, dmg:10, shape:'skeleton', c1:'#e0e0d0', c2:'#a0a090', c3:'#ffffff' },
  { id:'skeleton_mage', name:'骷髅法师', en:'Skeleton Mage', loc:'quarry', hp:60, dmg:5, shape:'skeleton', c1:'#d0d0e0', c2:'#8a8aa0', c3:'#b0a0f0', staff:true },
  { id:'skeleton_warrior', name:'骷髅战士', en:'Skeleton Warrior', loc:'quarry', hp:300, dmg:12, shape:'skeleton', c1:'#c0c0b0', c2:'#7a7a6a', c3:'#e0d060', helmet:true },

  { id:'shadow_brute', name:'暗影狂徒', en:'Shadow Brute', loc:'mine', hp:160, dmg:18, shape:'shadow', c1:'#3a2a4a', c2:'#1a0a2a', c3:'#a05ac0', weapon:'club' },
  { id:'shadow_shaman', name:'暗影萨满', en:'Shadow Shaman', loc:'mine', hp:80, dmg:17, shape:'shadow', c1:'#4a3a5a', c2:'#2a1a3a', c3:'#c080e0', weapon:'staff' },
  { id:'shadow_sniper', name:'暗影狙击手', en:'Shadow Sniper', loc:'skull', hp:300, dmg:18, shape:'shadow', c1:'#3a2a4a', c2:'#1a0a2a', c3:'#e0a040', weapon:'bow' },
  { id:'shadow_guy', name:'暗影人', en:'Shadow Guy', loc:'mine', hp:125, dmg:20, shape:'shadow', c1:'#4a3a5a', c2:'#2a1a3a', c3:'#a0a0d0' },

  { id:'mummy', name:'木乃伊', en:'Mummy', loc:'skull', hp:260, dmg:30, shape:'mummy', c1:'#d0c0a0', c2:'#a09070', c3:'#f0e8d0' },
  { id:'serpent', name:'蛇', en:'Serpent', loc:'skull', hp:150, dmg:23, shape:'serpent', c1:'#5a7a4a', c2:'#3a5a2a', c3:'#a0d080' },
  { id:'royal_serpent', name:'皇家蛇', en:'Royal Serpent', loc:'skull', hp:150, dmg:23, shape:'serpent', c1:'#8a5ac0', c2:'#5a2a8a', c3:'#d0a0f0' },
  { id:'pepper_rex', name:'霸王龙', en:'Pepper Rex', loc:'skull', hp:300, dmg:15, shape:'rex', c1:'#b05a3a', c2:'#7a2a1a', c3:'#e0a060' },

  { id:'haunted_skull', name:'闹鬼骷髅', en:'Haunted Skull', loc:'skull', hp:40, dmg:10, shape:'skull', c1:'#e0e0d0', c2:'#a0a090', c3:'#d04a3a' },
  { id:'squid_kid', name:'鱿鱼娃', en:'Squid Kid', loc:'mine', hp:1, dmg:18, shape:'squid', c1:'#c0b0c0', c2:'#8a7a8a', c3:'#f0e0f0' },
  { id:'blue_squid', name:'蓝鱿鱼', en:'Blue Squid', loc:'mine', hp:80, dmg:18, shape:'squid', c1:'#4a8ac0', c2:'#2a5a8a', c3:'#a0d0f0' },

  { id:'stone_golem', name:'石头傀儡', en:'Stone Golem', loc:'mine', hp:45, dmg:5, shape:'golem', c1:'#8a8a7a', c2:'#5a5a4a', c3:'#c0c0a0' },
  { id:'wilderness_golem', name:'荒野傀儡', en:'Wilderness Golem', loc:'farm', hp:30, dmg:5, shape:'golem', c1:'#6a7a5a', c2:'#3a4a2a', c3:'#a0b080' },
  { id:'iridium_golem', name:'铱傀儡', en:'Iridium Golem', loc:'farm', hp:30, dmg:5, shape:'golem', c1:'#8a6ac0', c2:'#4a2a8a', c3:'#d0b0ff' },

  { id:'dwarvish_sentry', name:'矮人哨兵', en:'Dwarvish Sentry', loc:'volcano', hp:300, dmg:18, shape:'sentry', c1:'#8a7a5a', c2:'#5a4a2a', c3:'#d0b060' }
];

export const MONSTER_MAP = Object.fromEntries(MONSTERS.map(m => [m.id, m]));

export function monsterLocName(loc) {
  const l = MONSTER_LOCS.find(x => x.id === loc);
  return l ? l.name : loc;
}

/* ---------------- 绘制 ---------------- */

function eyes(g, x, y, c, big) {
  R(g, x - 4, y, 2, big ? 3 : 2, '#ffffff');
  R(g, x + 2, y, 2, big ? 3 : 2, '#ffffff');
  R(g, x - 3, y, 1, 1, c);
  R(g, x + 3, y, 1, 1, c);
}

function slime(g, m, phase, big) {
  const squish = Math.round(Math.sin(phase * TAU) * 1);
  const w = big ? 10 : 8;
  const h = big ? 5 : 4 + squish;
  ellipse(g, 20, 24, w, h, m.c2);
  ellipse(g, 20, 22, w - 1, h, m.c1);
  ellipse(g, 18, 20, w * 0.4, h * 0.45, m.c3);
  eyes(g, 20, 19, '#1a1a1a', big);
  R(g, 18, 23, 5, 1, m.c2);
  if (big) {
    R(g, 14, 16, 3, 2, '#ffffff');
    R(g, 24, 15, 2, 2, '#ffffff');
  }
}

function bat(g, m, phase) {
  const flap = Math.round(Math.sin(phase * TAU * 2) * 2);
  ellipse(g, 20, 18, 4, 4, m.c1);
  R(g, 18, 14, 2, 2, m.c1);
  R(g, 22, 14, 2, 2, m.c1);
  line(g, 16, 18, 7, 12 + flap, m.c2, 2);
  line(g, 24, 18, 33, 12 + flap, m.c2, 2);
  line(g, 7, 12 + flap, 4, 17 + flap, m.c2, 1);
  line(g, 33, 12 + flap, 36, 17 + flap, m.c2, 1);
  R(g, 18, 17, 1, 1, '#f0e060');
  R(g, 21, 17, 1, 1, '#f0e060');
  R(g, 19, 21, 2, 1, '#ffffff');
}

function bug(g, m, phase) {
  const leg = Math.round(Math.sin(phase * TAU * 2));
  ellipse(g, 20, 19, 7, 5, m.c1);
  ellipse(g, 20, 18, 5, 3, m.c2);
  R(g, 17, 13, 2, 2, m.c1);
  R(g, 21, 13, 2, 2, m.c1);
  for (let i = 0; i < 3; i++) {
    line(g, 14 + i * 2, 21, 10 + i * 3, 27 + leg, m.c2, 1);
    line(g, 26 - i * 2, 21, 30 - i * 3, 27 - leg, m.c2, 1);
  }
  R(g, 20, 11, 1, 3, m.c2);
  R(g, 18, 17, 1, 1, '#e0d060');
  R(g, 22, 17, 1, 1, '#e0d060');
}

function fly(g, m, phase) {
  const flap = Math.round(Math.sin(phase * TAU * 3) * 2);
  ellipse(g, 20, 18, 4, 3, m.c1);
  R(g, 19, 15, 2, 2, m.c1);
  R(g, 18, 21, 5, 1, m.c2);
  R(g, 14, 14 + flap, 5, 2, '#d0e0f0');
  R(g, 21, 14 + flap, 5, 2, '#d0e0f0');
  R(g, 18, 17, 1, 1, '#e04040');
  R(g, 21, 17, 1, 1, '#e04040');
}

function grub(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU * 2));
  for (let i = 0; i < 6; i++) {
    ellipse(g, 10 + i * 4, 22 - (i % 2) * 2 + (i === 5 ? s : 0), 3, 3, i % 2 ? m.c1 : m.c2);
  }
  ellipse(g, 31, 18 + s, 4, 3, m.c1);
  R(g, 32, 16, 1, 1, '#1a1a1a');
  R(g, 33, 19, 2, 1, m.c3);
}

function crab(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  ellipse(g, 20, 20, 7, 5, m.c1);
  ellipse(g, 20, 18, 5, 3, m.c2);
  line(g, 13, 18 - s, 8, 14 - s, m.c2, 2);
  line(g, 27, 18 - s, 32, 14 - s, m.c2, 2);
  R(g, 6, 12 - s, 3, 3, m.c1);
  R(g, 31, 12 - s, 3, 3, m.c1);
  for (let i = 0; i < 3; i++) {
    line(g, 15 + i * 2, 22, 12 + i * 3, 28, m.c2, 1);
    line(g, 25 - i * 2, 22, 28 - i * 3, 28, m.c2, 1);
  }
  R(g, 18, 18, 1, 1, '#f0e060');
  R(g, 21, 18, 1, 1, '#f0e060');
}

function ghost(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  g.globalAlpha = 0.9;
  ellipse(g, 20, 17 + s, 7, 7, m.c1);
  R(g, 13, 18 + s, 14, 7, m.c1);
  for (let i = 0; i < 4; i++) R(g, 13 + i * 4, 25 + s + (i % 2) * 2, 3, 3, m.c1);
  eyes(g, 20, 15 + s, m.c2, false);
  R(g, 18, 21 + s, 4, 1, m.c2);
  R(g, 15, 12 + s, 3, 2, m.c3);
  g.globalAlpha = 1;
}

function skeleton(g, m, phase, staff, helmet) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  ellipse(g, 20, 13 + s, 5, 5, m.c1);
  R(g, 17, 15 + s, 2, 2, '#1a1a1a');
  R(g, 22, 15 + s, 2, 2, '#1a1a1a');
  R(g, 19, 18 + s, 3, 1, m.c2);
  R(g, 16, 20 + s, 8, 6, m.c1);
  for (let i = 0; i < 3; i++) R(g, 17, 21 + i * 2 + s, 6, 1, m.c2);
  line(g, 15, 20 + s, 10, 25 + s, m.c1, 2);
  line(g, 25, 20 + s, 30, 25 + s, m.c1, 2);
  R(g, 15, 27 + s, 4, 2, m.c1);
  R(g, 22, 27 + s, 4, 2, m.c1);
  if (helmet) {
    ellipse(g, 20, 11 + s, 7, 4, m.c3);
    R(g, 13, 12 + s, 14, 1, m.c2);
    R(g, 20, 7 + s, 2, 4, m.c3);
  }
  if (staff) {
    line(g, 31, 12, 31, 28, '#8a5a2a', 1);
    ellipse(g, 31, 10, 2, 2, m.c3);
  }
}

function shadow(g, m, phase, weapon) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  ellipse(g, 20, 15 + s, 6, 6, m.c1);
  R(g, 16, 20 + s, 8, 8, m.c1);
  R(g, 13, 21 + s, 3, 6, m.c1);
  R(g, 24, 21 + s, 3, 6, m.c1);
  R(g, 17, 14 + s, 2, 2, m.c3);
  R(g, 21, 14 + s, 2, 2, m.c3);
  R(g, 18, 18 + s, 4, 1, m.c2);
  if (weapon === 'staff') {
    line(g, 30, 8, 30, 28, '#8a5a2a', 1);
    ellipse(g, 30, 6, 2, 2, m.c3);
  } else if (weapon === 'bow') {
    line(g, 29, 12, 29, 24, '#8a5a2a', 1);
    line(g, 29, 12, 33, 18, m.c3, 1);
    line(g, 33, 18, 29, 24, m.c3, 1);
  } else {
    R(g, 28, 18 + s, 3, 8, '#6a4a2a');
    R(g, 26, 16 + s, 7, 3, '#8a6a3a');
  }
}

function mummy(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  ellipse(g, 20, 14 + s, 5, 5, m.c1);
  R(g, 16, 20 + s, 8, 8, m.c1);
  R(g, 14, 21 + s, 3, 5, m.c1);
  R(g, 23, 21 + s, 3, 5, m.c1);
  for (let i = 0; i < 4; i++) R(g, 15, 19 + i * 2 + s, 10, 1, m.c2);
  R(g, 17, 13 + s, 2, 1, '#1a1a1a');
  R(g, 22, 13 + s, 2, 1, '#1a1a1a');
  R(g, 18, 16 + s, 4, 1, m.c2);
}

function serpent(g, m, phase) {
  const s = Math.sin(phase * TAU * 1.5);
  for (let i = 0; i < 7; i++) {
    const x = 10 + i * 4;
    const y = 22 - Math.round(Math.sin(i * 0.8 + phase * TAU) * 5);
    ellipse(g, x, y, 3, 3, i % 2 ? m.c1 : m.c2);
  }
  ellipse(g, 8, 20, 4, 3, m.c1);
  R(g, 6, 18, 1, 1, '#f0e060');
  R(g, 6, 21, 2, 1, '#f0e060');
  line(g, 10, 24, 13, 28, m.c2, 1);
}

function rex(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  R(g, 12, 16 + s, 12, 8, m.c1);
  R(g, 10, 18 + s, 3, 6, m.c1);
  R(g, 23, 12 + s, 6, 6, m.c1);
  R(g, 28, 14 + s, 3, 2, m.c2);
  R(g, 25, 13 + s, 1, 1, '#f0e060');
  R(g, 28, 16 + s, 3, 1, '#ffffff');
  line(g, 12, 22 + s, 7, 27 + s, m.c2, 2);
  line(g, 16, 22 + s, 16, 28, m.c2, 2);
  line(g, 22, 22 + s, 27, 28, m.c2, 2);
  R(g, 8, 16 + s, 2, 2, m.c3);
  R(g, 10, 21 + s, 2, 1, m.c3);
}

function skull(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 2);
  ellipse(g, 20, 16 + s, 6, 6, m.c1);
  R(g, 15, 15 + s, 3, 3, '#1a1a1a');
  R(g, 22, 15 + s, 3, 3, '#1a1a1a');
  R(g, 18, 20 + s, 4, 1, m.c2);
  R(g, 17, 22 + s, 1, 1, m.c1);
  R(g, 20, 22 + s, 1, 1, m.c1);
  R(g, 23, 22 + s, 1, 1, m.c1);
  R(g, 16, 10 + s, 2, 2, m.c3);
  R(g, 23, 9 + s, 2, 2, m.c3);
}

function squid(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  ellipse(g, 20, 14 + s, 5, 5, m.c1);
  R(g, 16, 18 + s, 8, 2, m.c2);
  for (let i = 0; i < 5; i++) {
    line(g, 16 + i * 2, 19 + s, 15 + i * 2, 27, m.c1, 1);
  }
  R(g, 18, 13 + s, 1, 1, '#f0e060');
  R(g, 21, 13 + s, 1, 1, '#f0e060');
}

function golem(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  R(g, 14, 14 + s, 12, 12, m.c1);
  R(g, 11, 16 + s, 4, 7, m.c2);
  R(g, 25, 16 + s, 4, 7, m.c2);
  R(g, 16, 20 + s, 2, 2, '#f0e060');
  R(g, 21, 20 + s, 2, 2, '#f0e060');
  for (let i = 0; i < 4; i++) R(g, 15 + i * 3, 18 + s, 2, 1, m.c2);
  R(g, 15, 25 + s, 4, 3, m.c2);
  R(g, 21, 25 + s, 4, 3, m.c2);
}

function sentry(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  R(g, 15, 8 + s, 10, 14, m.c1);
  R(g, 13, 10 + s, 2, 10, m.c2);
  R(g, 25, 10 + s, 2, 10, m.c2);
  ellipse(g, 20, 8 + s, 5, 3, m.c3);
  R(g, 17, 14 + s, 2, 2, '#f0c040');
  R(g, 21, 14 + s, 2, 2, '#f0c040');
  R(g, 16, 18 + s, 8, 1, m.c2);
  R(g, 15, 22 + s, 10, 4, m.c2);
}

function duggy(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  ellipse(g, 20, 26, 12, 3, '#5a4028');
  ellipse(g, 20, 22, 9, 5, m.c1);
  ellipse(g, 20, 19, 7, 4, m.c2);
  R(g, 16, 18 + s, 2, 2, '#f0e060');
  R(g, 22, 18 + s, 2, 2, '#f0e060');
  R(g, 18, 22, 4, 1, '#5a3a1a');
  R(g, 9, 24, 3, 3, m.c3);
  R(g, 28, 24, 3, 3, m.c3);
}

function sprite(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU * 2) * 2);
  ellipse(g, 20, 18 + s, 5, 4, m.c1);
  ellipse(g, 20, 16 + s, 3, 2, m.c3);
  R(g, 18, 17 + s, 1, 1, '#1a1a1a');
  R(g, 21, 17 + s, 1, 1, '#1a1a1a');
  R(g, 14, 22 + s, 2, 2, m.c3);
  R(g, 24, 24 + s, 2, 2, m.c3);
  R(g, 16, 26 + s, 2, 1, m.c2);
}

function spiker(g, m, phase) {
  const r = 6;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    line(g, 20 + Math.cos(a) * r, 20 + Math.sin(a) * r, 20 + Math.cos(a) * (r + 3), 20 + Math.sin(a) * (r + 3), m.c2, 1);
  }
  ellipse(g, 20, 20, r, r, m.c1);
  R(g, 18, 19, 1, 1, '#f0e060');
  R(g, 21, 19, 1, 1, '#f0e060');
  R(g, 18, 22, 4, 1, m.c2);
}

function spider(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU * 2));
  ellipse(g, 20, 19, 5, 4, m.c1);
  R(g, 18, 17, 1, 1, '#e04040');
  R(g, 21, 17, 1, 1, '#e04040');
  for (let i = 0; i < 4; i++) {
    line(g, 17, 19 + i, 10, 14 + i * 3 + s, m.c2, 1);
    line(g, 23, 19 + i, 30, 14 + i * 3 - s, m.c2, 1);
  }
  R(g, 19, 23, 3, 2, m.c2);
}

function stick(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  line(g, 12, 18 + s, 28, 16 - s, m.c1, 2);
  line(g, 15, 18 + s, 12, 12 + s, m.c2, 1);
  line(g, 18, 18 + s, 22, 12 + s, m.c2, 1);
  line(g, 24, 17 - s, 28, 22 - s, m.c2, 1);
  R(g, 27, 14 + s, 2, 2, m.c1);
  R(g, 28, 14 + s, 1, 1, '#1a1a1a');
}

function metalhead(g, m, phase) {
  const s = Math.round(Math.sin(phase * TAU) * 1);
  ellipse(g, 20, 15 + s, 7, 6, m.c1);
  R(g, 13, 16 + s, 14, 2, m.c2);
  R(g, 16, 13 + s, 2, 2, '#f0c040');
  R(g, 22, 13 + s, 2, 2, '#f0c040');
  R(g, 17, 19 + s, 6, 1, m.c2);
  R(g, 15, 21 + s, 3, 5, m.c1);
  R(g, 22, 21 + s, 3, 5, m.c1);
}

/* ---------------- 主入口 ---------------- */

export function drawMonster(g, monster, phase = 0.25) {
  const m = typeof monster === 'string' ? MONSTER_MAP[monster] : monster;
  if (!m) return;
  g.save();
  g.imageSmoothingEnabled = false;
  const p = phase;
  if (m.shape === 'slime') slime(g, m, p, false);
  else if (m.shape === 'bigslime') slime(g, m, p, true);
  else if (m.shape === 'bat') bat(g, m, p);
  else if (m.shape === 'bug') bug(g, m, p);
  else if (m.shape === 'fly') fly(g, m, p);
  else if (m.shape === 'grub') grub(g, m, p);
  else if (m.shape === 'crab') crab(g, m, p);
  else if (m.shape === 'ghost') ghost(g, m, p);
  else if (m.shape === 'skeleton') skeleton(g, m, p, m.staff, m.helmet);
  else if (m.shape === 'shadow') shadow(g, m, p, m.weapon);
  else if (m.shape === 'mummy') mummy(g, m, p);
  else if (m.shape === 'serpent') serpent(g, m, p);
  else if (m.shape === 'rex') rex(g, m, p);
  else if (m.shape === 'skull') skull(g, m, p);
  else if (m.shape === 'squid') squid(g, m, p);
  else if (m.shape === 'golem') golem(g, m, p);
  else if (m.shape === 'sentry') sentry(g, m, p);
  else if (m.shape === 'duggy') duggy(g, m, p);
  else if (m.shape === 'sprite') sprite(g, m, p);
  else if (m.shape === 'spiker') spiker(g, m, p);
  else if (m.shape === 'spider') spider(g, m, p);
  else if (m.shape === 'stick') stick(g, m, p);
  else if (m.shape === 'metalhead') metalhead(g, m, p);
  g.restore();
}
