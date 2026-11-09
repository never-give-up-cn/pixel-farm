/* 星露谷工匠品图鉴：28 种加工品（酿造 / 腌渍 / 乳制品 / 纺织 / 油 / 谷物 / 脱水 / 鱼）。
 * 图标画在 32×32 格子里，按瓶、罐、杯、奶酪、布、袋、干果、鱼籽、熏鱼等形态绘制。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const ARTISAN_W = 32;
export const ARTISAN_H = 32;

export const ARTISAN_CATS = [
  { id: 'all', name: '全部' },
  { id: 'brew', name: '酿造' },
  { id: 'preserve', name: '腌渍' },
  { id: 'dairy', name: '乳制品' },
  { id: 'textile', name: '纺织' },
  { id: 'oil', name: '油' },
  { id: 'grain', name: '谷物' },
  { id: 'dried', name: '脱水' },
  { id: 'fish', name: '鱼' }
];

export const ARTISANS = [
  { id:'wine', name:'葡萄酒', en:'Wine', cat:'brew', machine:'小桶', shape:'bottle', c1:'#8a2a4a', c2:'#5a1a2a', c3:'#d06a8a', desc:'水果放进小桶酿成，越陈越值钱。' },
  { id:'juice', name:'果汁', en:'Juice', cat:'brew', machine:'小桶', shape:'bottle', c1:'#e0a03a', c2:'#a06010', c3:'#f0d080', desc:'蔬菜放进小桶压出的汁。' },
  { id:'beer', name:'啤酒', en:'Beer', cat:'brew', machine:'小桶', shape:'bottle', c1:'#c08030', c2:'#7a4a10', c3:'#e0c080', desc:'小麦酿造的啤酒。' },
  { id:'pale_ale', name:'淡啤酒', en:'Pale Ale', cat:'brew', machine:'小桶', shape:'bottle', c1:'#e0b050', c2:'#a07020', c3:'#ffe0a0', desc:'啤酒花酿造的淡色啤酒。' },
  { id:'mead', name:'蜂蜜酒', en:'Mead', cat:'brew', machine:'小桶', shape:'bottle', c1:'#e0c060', c2:'#a08020', c3:'#fff0b0', desc:'蜂蜜发酵成的甜酒。' },
  { id:'coffee', name:'咖啡', en:'Coffee', cat:'brew', machine:'小桶', shape:'cup', c1:'#6a3a1a', c2:'#402010', c3:'#c08050', desc:'咖啡豆煮成的热饮，能加速。' },
  { id:'green_tea', name:'绿茶', en:'Green Tea', cat:'brew', machine:'小桶', shape:'cup', c1:'#5a9a3a', c2:'#3a6a2a', c3:'#a0d080', desc:'茶叶泡出的绿茶。' },

  { id:'jelly', name:'果酱', en:'Jelly', cat:'preserve', machine:'罐头瓶', shape:'jar', c1:'#d04a6a', c2:'#8a2a4a', c3:'#f090a0', desc:'水果放进罐头瓶做成。' },
  { id:'pickles', name:'腌菜', en:'Pickles', cat:'preserve', machine:'罐头瓶', shape:'jar', c1:'#6a9a3a', c2:'#3a6a2a', c3:'#a0d060', desc:'蔬菜放进罐头瓶腌制。' },
  { id:'honey', name:'蜂蜜', en:'Honey', cat:'preserve', machine:'蜂房', shape:'jar', c1:'#e0a020', c2:'#a06010', c3:'#ffe080', desc:'蜂房产出，可做蜂蜜酒。' },
  { id:'vinegar', name:'醋', en:'Vinegar', cat:'preserve', machine:'小桶', shape:'bottle', c1:'#c0c0a0', c2:'#8a8a60', c3:'#f0f0d0', desc:'大米酿成的调味品。' },

  { id:'cheese', name:'奶酪', en:'Cheese', cat:'dairy', machine:'压酪机', shape:'cheese', c1:'#e0c040', c2:'#a08020', c3:'#fff0a0', desc:'牛奶压成的奶酪。' },
  { id:'goat_cheese', name:'山羊奶酪', en:'Goat Cheese', cat:'dairy', machine:'压酪机', shape:'cheese', c1:'#e8d080', c2:'#a89040', c3:'#fff8c0', desc:'羊奶压成的奶酪。' },
  { id:'mayonnaise', name:'蛋黄酱', en:'Mayonnaise', cat:'dairy', machine:'蛋黄酱机', shape:'jar', c1:'#f0e8c0', c2:'#c0b080', c3:'#fffbe8', desc:'鸡蛋加工成的蛋黄酱。' },
  { id:'duck_mayonnaise', name:'鸭蛋黄酱', en:'Duck Mayonnaise', cat:'dairy', machine:'蛋黄酱机', shape:'jar', c1:'#e8d8a0', c2:'#b0a060', c3:'#fff4c0', desc:'鸭蛋加工成的蛋黄酱。' },

  { id:'cloth', name:'布', en:'Cloth', cat:'textile', machine:'织布机', shape:'cloth', c1:'#e0e0e0', c2:'#b0b0b0', c3:'#ffffff', desc:'羊毛织成的布。' },
  { id:'oil', name:'油', en:'Oil', cat:'oil', machine:'榨油机', shape:'bottle', c1:'#e0c040', c2:'#a08020', c3:'#fff0a0', desc:'玉米/向日葵等榨出的食用油。' },
  { id:'truffle_oil', name:'松露油', en:'Truffle Oil', cat:'oil', machine:'榨油机', shape:'bottle', c1:'#a08040', c2:'#6a4a20', c3:'#d0b060', desc:'松露榨出的高级油。' },

  { id:'rice', name:'大米', en:'Rice', cat:'grain', machine:'磨坊', shape:'bag', c1:'#f0e8d0', c2:'#c0b090', c3:'#ffffff', desc:'未碾米磨成的大米。' },
  { id:'sugar', name:'糖', en:'Sugar', cat:'grain', machine:'磨坊', shape:'bag', c1:'#f0f0f0', c2:'#c0c0c0', c3:'#ffffff', desc:'甜菜磨成的糖。' },
  { id:'flour', name:'面粉', en:'Flour', cat:'grain', machine:'磨坊', shape:'bag', c1:'#e8e0c8', c2:'#b0a080', c3:'#fff8e0', desc:'小麦磨成的面粉。' },

  { id:'dried_fruit', name:'水果干', en:'Dried Fruit', cat:'dried', machine:'脱水机', shape:'dried', c1:'#d06a3a', c2:'#8a3a1a', c3:'#f0a060', desc:'水果脱水后的零食。' },
  { id:'dried_mushrooms', name:'蘑菇干', en:'Dried Mushrooms', cat:'dried', machine:'脱水机', shape:'dried', c1:'#a08060', c2:'#6a4a30', c3:'#d0b090', desc:'蘑菇脱水后的干片。' },
  { id:'raisins', name:'葡萄干', en:'Raisins', cat:'dried', machine:'脱水机', shape:'dried', c1:'#6a3a4a', c2:'#3a1a2a', c3:'#a06a80', desc:'葡萄脱水后的干果。' },

  { id:'roe', name:'鱼籽', en:'Roe', cat:'fish', machine:'鱼塘', shape:'roe', c1:'#e0a040', c2:'#a06010', c3:'#ffd080', desc:'鱼塘收获的鱼籽。' },
  { id:'aged_roe', name:'陈年鱼籽', en:'Aged Roe', cat:'fish', machine:'鱼塘/木桶', shape:'roe', c1:'#c08020', c2:'#7a4a10', c3:'#e0b060', desc:'陈放过、价值更高的鱼籽。' },
  { id:'caviar', name:'鱼子酱', en:'Caviar', cat:'fish', machine:'鱼塘', shape:'roe', c1:'#2a2a2a', c2:'#101010', c3:'#6a6a6a', desc:'鲟鱼籽制成的鱼子酱。' },
  { id:'smoked_fish', name:'熏鱼', en:'Smoked Fish', cat:'fish', machine:'熏鱼机', shape:'fish', c1:'#c08a4a', c2:'#7a4a20', c3:'#e0b070', desc:'熏制过的鱼，售价翻倍。' }
];

export const ARTISAN_MAP = Object.fromEntries(ARTISANS.map(a => [a.id, a]));

export function artisanCatName(cat) {
  const c = ARTISAN_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

/* ---------------- 绘制 ---------------- */

function bottle(g, m) {
  const x = 16, y = 17;
  /* 瓶身 */
  R(g, x - 6, y - 5, 12, 13, m.c1);
  R(g, x - 6, y - 5, 2, 13, m.c3);
  R(g, x + 4, y - 5, 2, 13, m.c2);
  /* 瓶颈 + 软木塞 */
  R(g, x - 2, y - 10, 4, 5, m.c1);
  R(g, x - 2, y - 10, 1, 5, m.c3);
  R(g, x - 3, y - 12, 6, 2, '#a06a3a');
  /* 标签 */
  R(g, x - 4, y - 2, 8, 4, '#e8dcc0');
  R(g, x - 2, y - 1, 4, 1, m.c2);
  /* 高光 */
  R(g, x - 5, y - 4, 1, 3, '#ffffff');
}

function jar(g, m) {
  const x = 16, y = 18;
  R(g, x - 7, y - 6, 14, 12, m.c2);
  R(g, x - 7, y - 6, 14, 2, m.c1);
  R(g, x - 6, y - 4, 12, 9, m.c3);
  R(g, x - 6, y - 4, 2, 9, m.c1);
  R(g, x + 4, y - 4, 2, 9, m.c2);
  /* 盖子 */
  R(g, x - 8, y - 9, 16, 3, '#8a5a2a');
  R(g, x - 6, y - 10, 12, 1, '#c08a4a');
  R(g, x - 2, y - 12, 4, 2, '#6b4226');
  R(g, x - 4, y - 2, 3, 3, '#ffffff');
}

function cup(g, m) {
  const x = 16, y = 18;
  ellipse(g, x, y + 6, 8, 2, '#d8d0c0');
  R(g, x - 6, y - 4, 12, 8, m.c1);
  R(g, x - 6, y - 4, 12, 2, m.c3);
  R(g, x + 6, y - 2, 3, 5, m.c2);
  R(g, x + 6, y - 1, 1, 3, '#e8dcc0');
  R(g, x - 4, y - 6, 8, 2, m.c1);
  /* 热气 */
  R(g, x - 2, y - 10, 1, 3, '#f0f0e0');
  R(g, x + 1, y - 12, 1, 4, '#f0f0e0');
  R(g, x + 4, y - 9, 1, 2, '#f0f0e0');
}

function cheese(g, m) {
  const x = 16, y = 18;
  line(g, x - 9, y + 6, x - 9, y - 2, m.c2, 2);
  line(g, x - 9, y - 2, x + 9, y - 6, m.c1, 2);
  line(g, x + 9, y - 6, x + 9, y + 2, m.c1, 2);
  line(g, x - 9, y + 6, x + 9, y + 2, m.c2, 2);
  for (let i = 0; i < 8; i++) {
    R(g, x - 8 + i * 2, y + 1 - Math.round(i * 0.5), 2, 6, m.c1);
  }
  R(g, x - 6, y - 1, 2, 2, m.c3);
  R(g, x + 1, y - 2, 2, 2, '#fff8c0');
  R(g, x - 3, y + 2, 2, 1, m.c2);
}

function cloth(g, m) {
  const x = 16, y = 18;
  R(g, x - 9, y - 6, 18, 12, m.c2);
  R(g, x - 8, y - 5, 16, 10, m.c1);
  for (let i = 0; i < 3; i++) {
    R(g, x - 8, y - 4 + i * 4, 16, 1, m.c2);
  }
  R(g, x - 6, y - 4, 3, 8, m.c3);
  R(g, x + 4, y - 4, 2, 8, m.c3);
  R(g, x - 1, y - 6, 2, 12, m.c3);
}

function bag(g, m) {
  const x = 16, y = 17;
  R(g, x - 5, y - 9, 10, 5, m.c2);
  ellipse(g, x, y + 2, 9, 8, m.c2);
  ellipse(g, x - 1, y + 1, 8, 7, m.c1);
  R(g, x - 4, y - 9, 8, 2, m.c3);
  R(g, x - 2, y - 11, 4, 3, m.c3);
  R(g, x - 3, y - 1, 3, 2, '#ffffff');
  R(g, x + 1, y + 2, 2, 1, m.c3);
}

function dried(g, m) {
  const x = 16, y = 18;
  R(g, x - 10, y - 2, 20, 2, '#c8b090');
  for (let i = 0; i < 6; i++) {
    const px = x - 9 + i * 3;
    const py = y - 6 + (i % 3) * 2;
    R(g, px, py, 2, 2, i % 2 ? m.c1 : m.c2);
    R(g, px, py - 1, 1, 1, m.c3);
  }
  R(g, x - 5, y - 1, 2, 1, '#8a6a4a');
  R(g, x + 3, y, 2, 1, '#8a6a4a');
}

function roe(g, m) {
  const x = 16, y = 18;
  ellipse(g, x, y + 4, 9, 3, '#c8b090');
  for (let i = 0; i < 10; i++) {
    const px = x - 6 + (i % 5) * 3 + (i > 4 ? 1 : 0);
    const py = y - 1 + Math.floor(i / 5) * 3;
    ellipse(g, px, py, 1, 1, i % 3 ? m.c1 : m.c2);
    if (i % 4 === 0) R(g, px, py - 1, 1, 1, m.c3);
  }
  R(g, x - 8, y + 2, 4, 1, '#ffffff');
}

function smokedFish(g, m) {
  const x = 16, y = 18;
  ellipse(g, x, y, 9, 5, m.c1);
  ellipse(g, x, y + 2, 8, 3, m.c3);
  line(g, x - 9, y, x - 13, y - 4, m.c2, 2);
  line(g, x - 9, y, x - 13, y + 4, m.c2, 2);
  R(g, x + 5, y - 2, 2, 2, '#ffffff');
  R(g, x + 6, y - 2, 1, 1, '#1a1a1a');
  /* 烟 */
  R(g, x - 3, y - 8, 1, 3, '#e0e0d0');
  R(g, x + 2, y - 10, 1, 4, '#e0e0d0');
  R(g, x + 6, y - 8, 1, 2, '#e0e0d0');
}

export function drawArtisan(g, item, phase = 0.25) {
  const m = typeof item === 'string' ? ARTISAN_MAP[item] : item;
  if (!m) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (m.shape === 'bottle') bottle(g, m);
  else if (m.shape === 'jar') jar(g, m);
  else if (m.shape === 'cup') cup(g, m);
  else if (m.shape === 'cheese') cheese(g, m);
  else if (m.shape === 'cloth') cloth(g, m);
  else if (m.shape === 'bag') bag(g, m);
  else if (m.shape === 'dried') dried(g, m);
  else if (m.shape === 'roe') roe(g, m);
  else if (m.shape === 'fish') smokedFish(g, m);
  else ellipse(g, 16, 18, 8, 6, m.c1);
  g.restore();
}
