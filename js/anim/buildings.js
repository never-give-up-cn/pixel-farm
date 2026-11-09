/* 星露谷农场建筑图鉴：25 种建筑（住宅 / 生产 / 动物 / 功能 / 魔法）。
 * 每个建筑画在 72×64 的格子里，地表基线 y=56；
 * 风车叶片、鱼塘水波、图腾柱光晕、金钟摆会随 phase 动。 */

import { R, line, ellipse, TAU, clamp } from './pixel.js';

export const BUILDING_W = 72;
export const BUILDING_H = 64;
export const BUILDING_BASE = 56;

export const BUILDING_TYPES = [
  { id: 'all', name: '全部' },
  { id: 'home', name: '住宅' },
  { id: 'production', name: '生产' },
  { id: 'animal', name: '动物' },
  { id: 'utility', name: '功能' },
  { id: 'magic', name: '魔法' }
];

export const BUILDINGS = [
  { id:'farmhouse', name:'农舍', en:'Farmhouse', type:'home', shape:'farmhouse', w:9, h:5, cost:0, desc:'农场的家，可升级厨房、地窖和家庭空间。', body:'#e0d0a0', shade:'#b09a6a', roof:'#b04a3a', trim:'#7a4a2a' },
  { id:'greenhouse', name:'温室', en:'Greenhouse', type:'production', shape:'greenhouse', w:7, h:6, cost:0, desc:'任何季节都能种植作物。', body:'#8ac0c0', shade:'#5a9090', roof:'#a8e0e0', trim:'#4a7a5a' },
  { id:'silo', name:'筒仓', en:'Silo', type:'production', shape:'silo', w:3, h:3, cost:100, desc:'储存割草得到的干草，自动喂食。', body:'#c0b090', shade:'#8a7a5a', roof:'#8a5a3a', trim:'#6b4226' },
  { id:'cabin', name:'小屋', en:'Cabin', type:'home', shape:'cabin', w:5, h:3, cost:100, desc:'联机模式下的农舍。', body:'#d0b080', shade:'#a08050', roof:'#8a5a3a', trim:'#6b4226' },
  { id:'shipping_bin', name:'出货箱', en:'Shipping Bin', type:'utility', shape:'bin', w:2, h:1, cost:250, desc:'把要卖的东西放进去，第二天结算。', body:'#b07a4a', shade:'#7a4a2a', roof:'#8a5a2b', trim:'#e0c070' },
  { id:'well', name:'水井', en:'Well', type:'utility', shape:'well', w:3, h:3, cost:1000, desc:'给水壶补水。', body:'#a0a0a0', shade:'#6a6a6a', roof:'#8a5a3a', trim:'#6b4226' },
  { id:'mill', name:'磨坊', en:'Mill', type:'production', shape:'mill', w:4, h:2, cost:2500, desc:'把小麦磨成面粉，把米磨成大米。', body:'#b0a090', shade:'#807060', roof:'#8a5a3a', trim:'#6b4226' },
  { id:'coop', name:'鸡舍', en:'Coop', type:'animal', shape:'coop', w:6, h:3, cost:4000, desc:'住 4 只鸡，带围栏和小门。', body:'#d0b080', shade:'#a08050', roof:'#a05a3a', trim:'#e0c070' },
  { id:'fish_pond', name:'鱼塘', en:'Fish Pond', type:'production', shape:'pond', w:5, h:5, cost:5000, desc:'养鱼并收获鱼籽。', body:'#4a9ac0', shade:'#2a6a90', roof:'#8a5a3a', trim:'#b07a4a' },
  { id:'pet_bowl', name:'宠物碗', en:'Pet Bowl', type:'animal', shape:'bowl', w:2, h:2, cost:5000, desc:'给宠物一个固定的食盆。', body:'#c07a4a', shade:'#8a4a2a', roof:'#e0d0b0', trim:'#8a5a2b' },
  { id:'barn', name:'畜棚', en:'Barn', type:'animal', shape:'barn', w:7, h:4, cost:6000, desc:'住 4 只牲畜。', body:'#b04a3a', shade:'#7a2a1a', roof:'#5a2a22', trim:'#e0c070' },
  { id:'stable', name:'马厩', en:'Stable', type:'animal', shape:'stable', w:4, h:2, cost:10000, desc:'养马并可以骑乘。', body:'#b07a4a', shade:'#7a4a2a', roof:'#8a5a3a', trim:'#6b4226' },
  { id:'slime_hutch', name:'史莱姆屋', en:'Slime Hutch', type:'animal', shape:'hutch', w:7, h:4, cost:10000, desc:'养史莱姆，收集史莱姆球。', body:'#8a8a7a', shade:'#5a5a4a', roof:'#5a5a5a', trim:'#5aa04a' },
  { id:'big_coop', name:'大鸡舍', en:'Big Coop', type:'animal', shape:'coop', w:6, h:3, cost:10000, desc:'住 8 只家禽，解锁鸭子。', body:'#d0b080', shade:'#a08050', roof:'#a05a3a', trim:'#e0c070', tier:2 },
  { id:'big_barn', name:'大畜棚', en:'Big Barn', type:'animal', shape:'barn', w:7, h:4, cost:12000, desc:'住 8 只牲畜，解锁山羊。', body:'#b04a3a', shade:'#7a2a1a', roof:'#5a2a22', trim:'#e0c070', tier:2 },
  { id:'shed', name:'小屋', en:'Shed', type:'production', shape:'shed', w:7, h:3, cost:15000, desc:'放机器和储物箱的室内空间。', body:'#b07a4a', shade:'#7a4a2a', roof:'#8a5a3a', trim:'#6b4226' },
  { id:'junimo_hut', name:'祝尼魔屋', en:'Junimo Hut', type:'magic', shape:'junimo', w:3, h:2, cost:20000, desc:'祝尼魔会自动收获周围的作物。', body:'#c8a060', shade:'#8a6a3a', roof:'#5aa04a', trim:'#e0d060' },
  { id:'deluxe_coop', name:'豪华鸡舍', en:'Deluxe Coop', type:'animal', shape:'coop', w:6, h:3, cost:20000, desc:'住 12 只家禽，解锁兔子。', body:'#d0b080', shade:'#a08050', roof:'#a05a3a', trim:'#f0d070', tier:3 },
  { id:'big_shed', name:'大屋子', en:'Big Shed', type:'production', shape:'shed', w:7, h:3, cost:20000, desc:'大型机器与储物空间。', body:'#b07a4a', shade:'#7a4a2a', roof:'#8a5a3a', trim:'#6b4226', tier:2 },
  { id:'deluxe_barn', name:'豪华畜棚', en:'Deluxe Barn', type:'animal', shape:'barn', w:7, h:4, cost:25000, desc:'住 12 只牲畜，解锁猪。', body:'#b04a3a', shade:'#7a2a1a', roof:'#5a2a22', trim:'#f0d070', tier:3 },
  { id:'earth_obelisk', name:'大地图腾柱', en:'Earth Obelisk', type:'magic', shape:'obelisk', w:3, h:2, cost:500000, desc:'传送到山岭。', body:'#5aa05a', shade:'#2f6a2f', roof:'#8a8a7a', trim:'#a0f090' },
  { id:'water_obelisk', name:'水之图腾柱', en:'Water Obelisk', type:'magic', shape:'obelisk', w:3, h:2, cost:500000, desc:'传送到海滩。', body:'#4a8ac0', shade:'#2a5a8a', roof:'#8a8a7a', trim:'#a0d0ff' },
  { id:'desert_obelisk', name:'沙漠图腾柱', en:'Desert Obelisk', type:'magic', shape:'obelisk', w:3, h:2, cost:1000000, desc:'传送到沙漠。', body:'#d09a3a', shade:'#8a6010', roof:'#8a8a7a', trim:'#ffe0a0' },
  { id:'island_obelisk', name:'姜岛图腾柱', en:'Island Obelisk', type:'magic', shape:'obelisk', w:3, h:2, cost:1000000, desc:'传送到姜岛。', body:'#4ac0a0', shade:'#2a8060', roof:'#8a8a7a', trim:'#a0ffe0' },
  { id:'gold_clock', name:'黄金时钟', en:'Gold Clock', type:'magic', shape:'clock', w:3, h:2, cost:10000000, desc:'阻止杂草生长和围栏腐烂。', body:'#e0c040', shade:'#a08020', roof:'#f0d870', trim:'#fff0a0' }
];

export const BUILDING_MAP = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));

export function buildingTypeName(type) {
  const t = BUILDING_TYPES.find(x => x.id === type);
  return t ? t.name : type;
}

function dims(m) {
  const bw = Math.min(58, 20 + m.w * 4);
  const bh = Math.min(40, 12 + m.h * 5);
  return { bw, bh };
}

function shadow(g, bw) {
  ellipse(g, 36, BUILDING_BASE + 1, Math.round(bw * 0.48), 2, 'rgba(20, 26, 18, 0.28)');
}

function door(g, x, base, w, h, color) {
  R(g, x - w / 2, base - h, w, h, color);
  R(g, x, base - h, 1, h, '#3a2a1a');
}

function window(g, x, y, w, h) {
  R(g, x, y, w, h, '#6ac0e0');
  R(g, x, y, w, 1, '#e8f8ff');
  R(g, x + Math.floor(w / 2), y, 1, h, '#3a6a8a');
}

/* ---------------- 住宅 / 普通房屋 ---------------- */

function drawHouse(g, m, phase) {
  const { bw, bh } = dims(m);
  const x = 36, base = BUILDING_BASE;
  const bodyH = Math.round(bh * 0.62);
  const top = base - bodyH;
  const roofH = Math.max(8, Math.round(bh * 0.42));
  shadow(g, bw);

  /* 屋顶 */
  for (let i = 0; i < roofH; i++) {
    const w = Math.round((bw / 2 + 3) * (i + 1) / roofH);
    R(g, x - w, top - roofH + i, w * 2, 1, i < roofH - 3 ? m.roof : m.shade);
  }
  R(g, x - bw / 2 - 4, top, bw + 8, 2, m.shade);

  /* 烟囱放在屋顶右侧 */
  const chx = x + Math.round(bw * 0.2);
  R(g, chx, top - 11, 6, 12, m.shade);
  R(g, chx - 1, top - 12, 8, 2, m.trim);

  /* 墙体 */
  R(g, x - bw / 2, top, bw, bodyH, m.body);
  R(g, x - bw / 2, top, 2, bodyH, m.shade);
  R(g, x + bw / 2 - 2, top, 2, bodyH, m.shade);
  R(g, x - bw / 2, base - 2, bw, 2, m.shade);
  /* 石砌地基 */
  R(g, x - bw / 2, base - 5, bw, 3, '#8a8070');
  for (let i = 0; i < Math.floor(bw / 8); i++) R(g, x - bw / 2 + i * 8 + 2, base - 4, 4, 1, '#6a6050');

  /* 门 / 窗 */
  const doorW = m.shape === 'farmhouse' ? 9 : 7;
  door(g, x, base, doorW, Math.round(bodyH * 0.6), m.trim);
  window(g, x - bw / 2 + 5, top + 5, 6, 5);
  window(g, x + bw / 2 - 11, top + 5, 6, 5);
  if (m.shape === 'farmhouse') {
    R(g, x - bw / 2 + 3, base + 1, bw - 6, 2, '#8a6a4a');
    R(g, x - bw / 2 + 3, base + 3, 2, 4, '#6b4226');
    R(g, x + bw / 2 - 5, base + 3, 2, 4, '#6b4226');
  }
  /* 门灯 */
  R(g, x + doorW / 2 + 2, base - Math.round(bodyH * 0.7), 2, 2, '#f0d060');
}

/* ---------------- 鸡舍 / 畜棚 ---------------- */

function drawBarn(g, m, phase) {
  const { bw, bh } = dims(m);
  const x = 36, base = BUILDING_BASE;
  const bodyH = Math.round(bh * 0.62);
  const top = base - bodyH;
  const roofH = m.shape === 'barn' ? 14 : 11;
  const tier = m.tier || 1;
  shadow(g, bw);

  /* 双坡屋顶 */
  for (let i = 0; i < roofH; i++) {
    const w = Math.round((bw / 2 + 4) * (i + 1) / roofH);
    R(g, x - w, top - roofH + i, w * 2, 1, i % 5 === 0 ? m.shade : m.roof);
  }
  R(g, x - bw / 2 - 5, top, bw + 10, 2, m.shade);
  if (tier >= 2) {
    /* 屋顶小塔 / 通风亭 */
    R(g, x - 4, top - roofH - 3, 8, 4, m.trim);
    R(g, x - 5, top - roofH - 4, 10, 1, m.trim);
    if (tier >= 3) R(g, x - 2, top - roofH - 6, 4, 1, '#fff0a0');
  }

  /* 墙体 */
  R(g, x - bw / 2, top, bw, bodyH, m.body);
  R(g, x - bw / 2, top, 2, bodyH, m.shade);
  R(g, x + bw / 2 - 2, top, 2, bodyH, m.shade);
  R(g, x - bw / 2, base - 2, bw, 2, m.shade);

  /* 大门 + X 支撑 */
  const dw = Math.round(bw * 0.3);
  const dh = Math.round(bodyH * 0.62);
  R(g, x - dw / 2, base - dh, dw, dh, m.shade);
  line(g, x - dw / 2, base - dh, x + dw / 2, base, m.trim, 1);
  line(g, x + dw / 2, base - dh, x - dw / 2, base, m.trim, 1);
  R(g, x - dw / 2, base - dh, dw, 1, m.trim);

  /* 干草阁楼窗 */
  R(g, x - 3, top + 3, 6, 5, '#d8b070');
  R(g, x - 2, top + 4, 4, 3, '#f0d090');
  /* 窗 */
  window(g, x - bw / 2 + 5, top + 5, 5, 4);
  window(g, x + bw / 2 - 10, top + 5, 5, 4);

  /* 鸡舍坡道 + 小门 */
  if (m.shape === 'coop') {
    R(g, x - 4, base - 6, 8, 6, m.trim);
    R(g, x - 5, base + 1, 10, 2, '#8a6a4a');
    R(g, x - 5, base + 3, 10, 1, '#6b4a2a');
    R(g, x + bw / 2 - 10, top - 2, 5, 4, '#e8dcc0');
    R(g, x + bw / 2 - 9, top - 1, 3, 2, '#d94a3a');
    if (tier >= 2) {
      /* 风向标 */
      line(g, x + 8, top - roofH - 1, x + 8, top - roofH - 7, m.trim, 1);
      R(g, x + 5, top - roofH - 8, 7, 1, m.trim);
      R(g, x + 11, top - roofH - 9, 2, 3, m.trim);
    }
  }
  /* 围栏柱 */
  R(g, x - bw / 2 - 8, base - 8, 2, 10, m.trim);
  R(g, x - bw / 2 - 8, base - 6, 8, 1, m.trim);
  if (tier >= 2) R(g, x + bw / 2 + 6, base - 8, 2, 10, m.trim);
}

/* ---------------- 其他生产建筑 ---------------- */

function drawSilo(g, m) {
  const x = 36, base = BUILDING_BASE, bw = 30, bh = 40;
  shadow(g, bw);
  R(g, x - bw / 2, base - bh, bw, bh - 6, m.body);
  R(g, x - bw / 2, base - bh, 3, bh - 6, m.shade);
  R(g, x + bw / 2 - 3, base - bh, 3, bh - 6, m.shade);
  for (let i = 0; i < 4; i++) R(g, x - bw / 2, base - bh + 8 + i * 8, bw, 1, m.shade);
  /* 圆锥顶 */
  for (let i = 0; i < 10; i++) {
    const w = Math.round(bw / 2 * (i + 1) / 10);
    R(g, x - w, base - bh - 10 + i, w * 2, 1, m.roof);
  }
  R(g, x - 4, base - 12, 8, 12, m.trim);
  R(g, x - 3, base - 10, 6, 1, '#3a2a1a');
}

function drawMill(g, m, phase) {
  const x = 36, base = BUILDING_BASE, bw = 28, bh = 36;
  shadow(g, bw);
  R(g, x - bw / 2, base - bh, bw, bh - 4, m.body);
  R(g, x - bw / 2, base - bh, 3, bh - 4, m.shade);
  for (let i = 0; i < 4; i++) R(g, x - bw / 2, base - bh + 7 + i * 7, bw, 1, m.shade);
  for (let i = 0; i < 8; i++) {
    const w = Math.round(bw / 2 * (i + 1) / 8);
    R(g, x - w, base - bh - 8 + i, w * 2, 1, m.roof);
  }
  door(g, x, base, 8, 14, m.trim);
  window(g, x - 3, base - bh + 6, 6, 5);

  /* 旋转风车 */
  const cx = x, cy = base - bh - 4;
  R(g, cx - 2, cy - 2, 4, 4, m.trim);
  const a0 = phase * TAU;
  for (let i = 0; i < 4; i++) {
    const a = a0 + i * Math.PI / 2;
    const ex = cx + Math.cos(a) * 14;
    const ey = cy + Math.sin(a) * 14;
    line(g, cx, cy, ex, ey, m.trim, 2);
    const px = cx + Math.cos(a + Math.PI / 2) * 4;
    const py = cy + Math.sin(a + Math.PI / 2) * 4;
    line(g, ex, ey, px, py, m.trim, 1);
  }
}

function drawShed(g, m) {
  const { bw, bh } = dims(m);
  const x = 36, base = BUILDING_BASE;
  const bodyH = Math.round(bh * 0.62);
  const top = base - bodyH;
  const tier = m.tier || 1;
  shadow(g, bw);

  /* 单坡屋顶 */
  R(g, x - bw / 2 - 3, top - 8, bw + 6, 8, m.roof);
  for (let i = 0; i < 4; i++) R(g, x - bw / 2 - 3, top - 8 + i * 2, bw + 6, 1, i % 3 === 2 ? m.shade : m.roof);
  R(g, x - bw / 2, top, bw, bodyH, m.body);
  R(g, x - bw / 2, top, 2, bodyH, m.shade);
  R(g, x - bw / 2, base - 2, bw, 2, m.shade);

  const dw = tier >= 2 ? 12 : 9;
  R(g, x - dw / 2, base - Math.round(bodyH * 0.7), dw, Math.round(bodyH * 0.7), m.shade);
  R(g, x, base - Math.round(bodyH * 0.7), 1, Math.round(bodyH * 0.7), m.trim);
  window(g, x - bw / 2 + 5, top + 6, 5, 4);
  window(g, x + bw / 2 - 10, top + 6, 5, 4);
}

function drawGreenhouse(g, m) {
  const x = 36, base = BUILDING_BASE, bw = 48, bh = 34;
  shadow(g, bw);
  /* 玻璃屋身 */
  R(g, x - bw / 2, base - bh, bw, bh - 4, m.body);
  for (let i = 0; i < 5; i++) R(g, x - bw / 2 + i * 11, base - bh, 1, bh - 4, m.shade);
  for (let i = 0; i < 3; i++) R(g, x - bw / 2, base - bh + 8 + i * 8, bw, 1, m.shade);
  /* 玻璃屋顶 */
  for (let i = 0; i < 8; i++) {
    const w = Math.round(bw / 2 * (i + 1) / 8);
    R(g, x - w, base - bh - 7 + i, w * 2, 1, m.roof);
  }
  /* 植物 */
  for (let i = 0; i < 5; i++) {
    R(g, x - 18 + i * 8, base - 12, 2, 8, m.trim);
    R(g, x - 20 + i * 8, base - 16, 6, 4, '#3f9440');
  }
  door(g, x, base, 8, 13, '#d8f0f0');
  R(g, x - 2, base - 14, 4, 2, m.trim);
}

function drawStable(g, m) {
  const x = 36, base = BUILDING_BASE, bw = 44, bh = 24;
  shadow(g, bw);
  R(g, x - bw / 2, base - bh, bw, bh, m.body);
  R(g, x - bw / 2, base - bh, 3, bh, m.shade);
  /* 斜坡屋顶 */
  for (let i = 0; i < 8; i++) {
    const w = Math.round(bw / 2 * (i + 1) / 8);
    R(g, x - w, base - bh - 8 + i, w * 2, 1, m.roof);
  }
  /* 开放门洞 */
  R(g, x - 12, base - 17, 24, 17, '#2a2018');
  /* 马 */
  R(g, x - 8, base - 13, 16, 7, '#8a5a2a');
  R(g, x + 4, base - 16, 6, 7, '#8a5a2a');
  R(g, x + 8, base - 15, 3, 3, '#6b421f');
  R(g, x + 9, base - 14, 1, 1, '#1a1a1a');
  R(g, x - 8, base - 6, 3, 6, '#6b421f');
  R(g, x + 3, base - 6, 3, 6, '#6b421f');
  /* 木栏 */
  R(g, x - bw / 2 - 6, base - 10, 2, 12, m.trim);
  R(g, x - bw / 2 - 6, base - 7, 6, 1, m.trim);
}

function drawWell(g, m) {
  const x = 36, base = BUILDING_BASE, bw = 26;
  shadow(g, bw);
  ellipse(g, x, base - 8, 13, 6, m.body);
  ellipse(g, x, base - 10, 10, 4, '#2a4a6a');
  R(g, x - 13, base - 12, 26, 5, m.shade);
  for (let i = 0; i < 5; i++) R(g, x - 12 + i * 5, base - 14, 4, 3, m.body);
  /* 支架 + 屋顶 */
  R(g, x - 11, base - 26, 2, 14, m.trim);
  R(g, x + 9, base - 26, 2, 14, m.trim);
  for (let i = 0; i < 6; i++) {
    const w = 12 - i;
    R(g, x - w, base - 32 + i, w * 2, 1, m.roof);
  }
  line(g, x, base - 25, x, base - 18, '#d8c080', 1);
  R(g, x - 2, base - 18, 5, 4, '#8a5a2a');
}

function drawPond(g, m, phase) {
  const x = 36, base = BUILDING_BASE;
  shadow(g, 46);
  ellipse(g, x, base - 10, 22, 12, m.shade);
  ellipse(g, x, base - 11, 20, 10, m.body);
  /* 水波 */
  for (let i = 0; i < 3; i++) {
    const r = 6 + i * 5 + Math.round(Math.sin(phase * TAU + i) * 1.5);
    ellipse(g, x, base - 12, r, Math.round(r * 0.45), 'rgba(180, 230, 255, 0.4)');
  }
  /* 木边 */
  for (let i = 0; i < 8; i++) {
    R(g, x - 22 + i * 6, base - 22, 5, 2, m.trim);
  }
  /* 小牌子 */
  R(g, x + 14, base - 24, 2, 10, m.trim);
  R(g, x + 10, base - 27, 10, 5, '#d8c090');
  R(g, x + 12, base - 25, 6, 1, '#4a6a3a');
}

function drawBowl(g, m) {
  const x = 36, base = BUILDING_BASE;
  shadow(g, 22);
  ellipse(g, x, base - 5, 12, 5, m.body);
  ellipse(g, x, base - 7, 10, 4, m.shade);
  ellipse(g, x, base - 7, 8, 3, '#6ac0e0');
  /* 骨头 */
  R(g, x - 6, base - 11, 8, 2, '#f0e8d0');
  R(g, x - 7, base - 12, 2, 1, '#f0e8d0');
  R(g, x - 7, base - 10, 2, 1, '#f0e8d0');
  R(g, x + 1, base - 12, 2, 1, '#f0e8d0');
  R(g, x + 1, base - 10, 2, 1, '#f0e8d0');
  /* 名牌 */
  R(g, x + 10, base - 14, 2, 10, m.trim);
  R(g, x + 7, base - 17, 9, 4, '#e0c070');
}

function drawHutch(g, m) {
  const { bw, bh } = dims(m);
  const x = 36, base = BUILDING_BASE;
  const bodyH = Math.round(bh * 0.6);
  const top = base - bodyH;
  shadow(g, bw);
  R(g, x - bw / 2, top, bw, bodyH, m.body);
  R(g, x - bw / 2, top, 3, bodyH, m.shade);
  for (let i = 0; i < 5; i++) R(g, x - bw / 2 + 4 + i * 9, top + 4, 6, 6, '#3a3a3a');
  for (let i = 0; i < 8; i++) {
    const w = Math.round(bw / 2 * (i + 1) / 8);
    R(g, x - w, top - 7 + i, w * 2, 1, m.roof);
  }
  door(g, x, base, 9, 13, m.shade);
  /* 大桶 + 史莱姆 */
  for (let i = 0; i < 2; i++) {
    ellipse(g, x - 18 + i * 36, base - 6, 6, 4, '#6a6a5a');
    ellipse(g, x - 18 + i * 36, base - 8, 5, 3, '#4a4a3a');
  }
  ellipse(g, x, base - 3, 5, 3, m.trim);
  R(g, x - 2, base - 6, 2, 2, m.trim);
  R(g, x - 2, base - 5, 1, 1, '#1a1a1a');
  R(g, x + 1, base - 5, 1, 1, '#1a1a1a');
}

function drawJunimo(g, m) {
  const x = 36, base = BUILDING_BASE;
  shadow(g, 26);
  /* 圆顶小屋 */
  ellipse(g, x, base - 11, 16, 13, m.body);
  ellipse(g, x, base - 9, 14, 10, m.shade);
  R(g, x - 12, base - 6, 24, 6, m.body);
  /* 叶顶 */
  for (let i = 0; i < 4; i++) {
    ellipse(g, x - 6 + i * 4, base - 24 + (i % 2), 5, 3, m.roof);
  }
  R(g, x - 1, base - 27, 2, 5, '#3a7a2a');
  /* 门 */
  R(g, x - 4, base - 12, 8, 12, m.shade);
  R(g, x, base - 12, 1, 12, m.trim);
  /* 祝尼魔 */
  ellipse(g, x + 10, base - 4, 3, 3, '#5ac05a');
  R(g, x + 9, base - 5, 1, 1, '#1a1a1a');
  R(g, x + 11, base - 5, 1, 1, '#1a1a1a');
  /* 发光 */
  R(g, x - 15, base - 20, 2, 2, '#e0f090');
  R(g, x + 14, base - 15, 1, 1, '#e0f090');
}

function drawObelisk(g, m, phase) {
  const x = 36, base = BUILDING_BASE;
  shadow(g, 20);
  /* 石座 */
  R(g, x - 12, base - 8, 24, 8, m.roof);
  R(g, x - 14, base - 3, 28, 3, '#5a5a5a');
  /* 柱体 */
  for (let i = 0; i < 8; i++) {
    const w = 7 - Math.round(i * 0.4);
    R(g, x - w, base - 8 - i * 4, w * 2, 5, m.body);
    R(g, x - w, base - 8 - i * 4, 1, 5, m.shade);
  }
  /* 顶部光 */
  const glow = 0.35 + 0.35 * Math.abs(Math.sin(phase * TAU * 1.5));
  g.globalAlpha = glow;
  ellipse(g, x, base - 40, 8, 8, m.trim);
  g.globalAlpha = 1;
  R(g, x - 2, base - 42, 4, 4, m.trim);
  /* 符文 */
  R(g, x - 2, base - 30, 4, 1, m.trim);
  R(g, x - 3, base - 26, 2, 1, m.trim);
  R(g, x + 1, base - 22, 2, 1, m.trim);
}

function drawClock(g, m, phase) {
  const x = 36, base = BUILDING_BASE;
  shadow(g, 22);
  R(g, x - 12, base - 12, 24, 12, m.shade);
  R(g, x - 10, base - 34, 20, 22, m.body);
  R(g, x - 10, base - 34, 2, 22, m.shade);
  for (let i = 0; i < 6; i++) {
    const w = 10 + i;
    R(g, x - w, base - 40 + i, w * 2, 1, m.roof);
  }
  /* 钟面 */
  ellipse(g, x, base - 25, 6, 6, '#f8f0d0');
  ellipse(g, x, base - 25, 5, 5, '#fffbe8');
  R(g, x - 1, base - 29, 2, 4, m.shade);
  R(g, x, base - 25, 3, 1, m.shade);
  /* 摆锤 */
  const sw = Math.round(Math.sin(phase * TAU) * 4);
  line(g, x, base - 19, x + sw, base - 12, m.trim, 1);
  ellipse(g, x + sw, base - 11, 2, 2, m.trim);
  R(g, x - 1, base - 42, 2, 3, m.trim);
}

function drawBin(g, m) {
  const x = 36, base = BUILDING_BASE;
  shadow(g, 24);
  R(g, x - 12, base - 12, 24, 12, m.body);
  for (let i = 0; i < 4; i++) R(g, x - 12 + i * 6, base - 12, 1, 12, m.shade);
  R(g, x - 13, base - 14, 26, 3, m.roof);
  R(g, x - 13, base - 18, 26, 3, m.roof);
  R(g, x - 12, base - 16, 24, 2, '#2a2018');
  R(g, x - 10, base - 20, 20, 3, m.trim);
  R(g, x - 2, base - 22, 2, 2, m.trim);
}

/* ---------------- 主入口 ---------------- */

export function drawBuilding(g, building, phase = 0.25) {
  const m = typeof building === 'string' ? BUILDING_MAP[building] : building;
  if (!m) return;
  g.save();
  g.imageSmoothingEnabled = false;

  if (m.shape === 'farmhouse' || m.shape === 'cabin') drawHouse(g, m, phase);
  else if (m.shape === 'coop' || m.shape === 'barn') drawBarn(g, m, phase);
  else if (m.shape === 'silo') drawSilo(g, m);
  else if (m.shape === 'mill') drawMill(g, m, phase);
  else if (m.shape === 'shed') drawShed(g, m);
  else if (m.shape === 'greenhouse') drawGreenhouse(g, m);
  else if (m.shape === 'stable') drawStable(g, m);
  else if (m.shape === 'well') drawWell(g, m);
  else if (m.shape === 'pond') drawPond(g, m, phase);
  else if (m.shape === 'bowl') drawBowl(g, m);
  else if (m.shape === 'hutch') drawHutch(g, m);
  else if (m.shape === 'junimo') drawJunimo(g, m);
  else if (m.shape === 'obelisk') drawObelisk(g, m, phase);
  else if (m.shape === 'clock') drawClock(g, m, phase);
  else if (m.shape === 'bin') drawBin(g, m);

  g.restore();
}
