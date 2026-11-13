/* js/render/buildings.js —— 由 index.html 拆分，原行 2889–3278 */
'use strict';

import { INTERIOR_MAP, drawFurnitureIcon } from '../anim/interior.js';

/* --- 建造物：木栅栏 / 木箱 / 洒水器 --- */
function drawFence(g,x,y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.fencePost;     g.fillRect(x+4,  y+9, 5, 23);
  g.fillRect(x+23, y+9, 5, 23);
  g.fillStyle = C.fencePostDark; g.fillRect(x+4,  y+9, 2, 23);
  g.fillRect(x+23, y+9, 2, 23);
  g.fillStyle = C.fenceRail;     g.fillRect(x+2, y+12, 28, 4);
  g.fillRect(x+2, y+22, 28, 4);
  g.fillStyle = C.fenceRailDark; g.fillRect(x+2, y+15, 28, 1);
  g.fillRect(x+2, y+25, 28, 1);
}
function drawChest(g,x,y,open){
  const C = CONFIG.TILE_COLORS;
  const lidY = open ? y+3 : y+8;
  g.fillStyle = C.chestBodyDark; g.fillRect(x+4, y+16, 24, 15);
  g.fillStyle = C.chestBody;     g.fillRect(x+5, y+17, 22, 13);
  g.fillStyle = C.chestLidDark;  g.fillRect(x+2, lidY, 28, 8);
  g.fillStyle = C.chestLid;      g.fillRect(x+3, lidY+1, 26, 6);
  g.fillStyle = C.chestLock;     g.fillRect(x+14, y+15, 4, 5);
  g.fillStyle = C.chestBodyDark; g.fillRect(x+5, y+28, 22, 2);
}
function drawSprinkler(g,x,y,t){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.sprinkBase; g.fillRect(x+7, y+27, 18, 4);
  g.fillStyle = C.sprinkPost; g.fillRect(x+14, y+15, 4, 13);
  const a = t * 1.8;
  const dx = Math.cos(a) * 9, dy = Math.sin(a) * 4;
  g.fillStyle = C.sprinkHeadDark; g.fillRect(x+12+dx, y+12+dy, 8, 5);
  g.fillStyle = C.sprinkHead;     g.fillRect(x+13+dx, y+11+dy, 6, 3);
  g.fillStyle = C.dropWater;      g.fillRect(x+4+dx, y+17+dy, 2, 2);
  g.fillRect(x+22+dx, y+17+dy, 2, 2);
}
function drawCoop(g,x,y){
  const C = CONFIG.TILE_COLORS;
  /* 影子 */
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x+3, y+28, 26, 3);
  /* 木墙 */
  g.fillStyle = C.coopWallDark; g.fillRect(x+4, y+13, 24, 15);
  g.fillStyle = C.coopWall;     g.fillRect(x+5, y+14, 22, 13);
  g.fillStyle = C.coopWallDark; g.fillRect(x+5, y+14, 22, 2);
  /* 红屋顶（两级台阶） */
  g.fillStyle = C.coopRoof;      g.fillRect(x+2, y+8, 28, 5);
  g.fillStyle = C.coopRoofLight; g.fillRect(x+5, y+5, 22, 4);
  g.fillStyle = C.coopRoof;      g.fillRect(x+9, y+3, 14, 3);
  /* 门洞 + 栖木 */
  g.fillStyle = '#4a3222'; g.fillRect(x+13, y+19, 6, 9);
  g.fillStyle = '#8a5a2b'; g.fillRect(x+11, y+28, 10, 2);
}
function drawBarn(g,x,y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x+2, y+28, 28, 3);
  /* 红墙 */
  g.fillStyle = C.barnWallDark; g.fillRect(x+3, y+12, 26, 16);
  g.fillStyle = C.barnWall;     g.fillRect(x+4, y+13, 24, 14);
  /* 灰屋顶 */
  g.fillStyle = C.barnRoof;      g.fillRect(x+1, y+7, 30, 6);
  g.fillStyle = C.barnRoofLight; g.fillRect(x+4, y+4, 24, 4);
  g.fillStyle = C.barnRoof;      g.fillRect(x+8, y+2, 16, 3);
  /* 白色门框 + 交叉木条 */
  g.fillStyle = C.barnTrim; g.fillRect(x+11, y+17, 10, 11);
  g.fillStyle = C.barnWallDark; g.fillRect(x+12, y+18, 8, 9);
  g.fillStyle = C.barnTrim;
  g.fillRect(x+12, y+18, 8, 1); g.fillRect(x+12, y+26, 8, 1);
  g.fillRect(x+15, y+18, 1, 9);
}
/* 第 19 轮：加工台 —— 木桌 + 台钳 + 冒烟的炉口；加工中显示进度条，有产出时头顶冒 ✓ */
function drawMaker(g,x,y,b){
  const C = CONFIG.TILE_COLORS;
  const job = b && b.job, ready = b && b.out && b.out.length > 0;
  /* 影子 */
  g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x+2, y+28, 28, 3);
  /* 四条桌腿 + 桌面 */
  g.fillStyle = '#5b3a1d';
  g.fillRect(x+5, y+20, 3, 9); g.fillRect(x+24, y+20, 3, 9);
  g.fillStyle = C.fenceRailDark || '#6a4520'; g.fillRect(x+2, y+15, 28, 6);
  g.fillStyle = C.fenceRail || '#8a5a2b';     g.fillRect(x+2, y+15, 28, 3);
  /* 台面工具：砧板 + 齿轮 */
  g.fillStyle = '#c9b58c'; g.fillRect(x+7, y+11, 9, 4);
  g.fillStyle = '#9aa1a9'; g.fillRect(x+18, y+9, 7, 7);
  g.fillStyle = '#63696f'; g.fillRect(x+20, y+11, 3, 3);
  /* 炉口：加工中冒火星 */
  g.fillStyle = '#3a2a1a'; g.fillRect(x+9, y+21, 14, 7);
  g.fillStyle = job ? '#ff9a3a' : '#6b4a2a';
  g.fillRect(x+12, y+23, 8, 4);
  if(job){
    const p = 1 - Math.max(0, job.left) / Math.max(1, job.total);
    g.fillStyle = '#2a1a10'; g.fillRect(x+2, y+1, 28, 4);
    g.fillStyle = '#ffd76a'; g.fillRect(x+3, y+2, Math.max(1, Math.round(26 * p)), 2);
  }
  if(ready){
    g.font = '12px ' + FONT_EMOJI; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText('✅', x + TILE/2, y - 4);
    g.textAlign = 'left'; g.textBaseline = 'top';
  }
}
/* 第 20 轮：铱质洒水器（覆盖 5×5，金属底座 + 四向喷头 + 微光） */
function drawIrrigator(g,x,y,t){
  g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x+5, y+28, 22, 3);
  /* 铱色底座 */
  g.fillStyle = '#3a4a5a'; g.fillRect(x+5, y+24, 22, 5);
  g.fillStyle = '#7b8fa6'; g.fillRect(x+6, y+25, 20, 2);
  /* 立柱 */
  g.fillStyle = '#55677d'; g.fillRect(x+14, y+12, 4, 13);
  g.fillStyle = '#9fb4c9'; g.fillRect(x+15, y+13, 1, 11);
  /* 十字喷臂（缓慢旋转） */
  const a = t * 1.2;
  const hx = x + 16, hy = y + 12;
  const dx = Math.cos(a) * 9, dy = Math.sin(a) * 4.5;
  g.fillStyle = '#6f8499';
  g.fillRect(hx - dx - 2, hy - dy - 1, 4, 3);
  g.fillRect(hx + dx - 2, hy + dy - 1, 4, 3);
  g.fillStyle = '#cfe3ff';
  g.fillRect(hx - dx - 1, hy - dy, 2, 1);
  g.fillRect(hx + dx - 1, hy + dy, 2, 1);
  /* 中心宝石 */
  g.fillStyle = '#7ee0d0'; g.fillRect(x+14, y+10, 4, 4);
  g.fillStyle = '#d6fff8'; g.fillRect(x+15, y+11, 1, 1);
  /* 微光：偶尔闪一下 */
  if(((t * 2) | 0) % 3 === 0){
    g.fillStyle = 'rgba(200,255,246,.75)';
    g.fillRect(x+23, y+7, 2, 2);
  }
}
/* 第 20 轮：稻草人（木桩 + 草帽 + 展开的手臂） */
function drawScarecrow(g,x,y){
  g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x+11, y+29, 10, 2);
  /* 木桩 */
  g.fillStyle = '#6b4a2a'; g.fillRect(x+15, y+13, 3, 16);
  /* 横臂 */
  g.fillStyle = '#8a5a2b'; g.fillRect(x+6, y+17, 21, 3);
  g.fillStyle = '#5b3a1d'; g.fillRect(x+6, y+19, 21, 1);
  /* 麻布衣服 */
  g.fillStyle = '#b99a5e'; g.fillRect(x+11, y+18, 11, 9);
  g.fillStyle = '#9b7c44'; g.fillRect(x+11, y+23, 11, 2);
  /* 草帽 */
  g.fillStyle = '#c8a24a'; g.fillRect(x+8, y+9, 17, 3);
  g.fillStyle = '#e0c070'; g.fillRect(x+11, y+5, 11, 5);
  g.fillStyle = '#c8a24a'; g.fillRect(x+11, y+8, 11, 2);
  /* 脸 */
  g.fillStyle = '#d8c08a'; g.fillRect(x+12, y+11, 9, 6);
  g.fillStyle = '#4a3222'; g.fillRect(x+13, y+12, 2, 2); g.fillRect(x+18, y+12, 2, 2);
  g.fillRect(x+15, y+15, 3, 1);
}
/* 第 20 轮：自动采集箱（金属箱 + 绿色指示灯 + 滑槽） */
function drawAutobox(g,x,y,t){
  g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x+5, y+29, 22, 2);
  g.fillStyle = '#2f3b4a'; g.fillRect(x+4, y+12, 24, 17);
  g.fillStyle = '#4d6076'; g.fillRect(x+5, y+13, 22, 15);
  /* 顶盖滑槽 */
  g.fillStyle = '#6d8299'; g.fillRect(x+7, y+9, 18, 4);
  g.fillStyle = '#26303c'; g.fillRect(x+10, y+10, 12, 2);
  /* 门缝 */
  g.fillStyle = '#26303c'; g.fillRect(x+13, y+17, 6, 10);
  g.fillStyle = '#9fb4c9'; g.fillRect(x+15, y+20, 2, 3);
  /* 绿色指示灯：呼吸闪烁 */
  const on = (Math.sin(t * 3) > -0.2);
  g.fillStyle = on ? '#6ef0a0' : '#2a6a44';
  g.fillRect(x+6, y+15, 3, 3);
  if(on){ g.fillStyle = 'rgba(110,240,160,.35)'; g.fillRect(x+5, y+14, 5, 5); }
}
/* 灶台：石砌底座 + 铁锅 + 火光 */
function drawStove(g,x,y){
  const t = typeof animTime !== 'undefined' ? animTime : 0;
  g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x+3, y+28, 26, 3);
  g.fillStyle = '#6e6e66'; g.fillRect(x+4, y+16, 24, 13);
  g.fillStyle = '#8e8e86'; g.fillRect(x+5, y+17, 22, 5);
  g.fillStyle = '#4e4e48'; g.fillRect(x+4, y+26, 24, 3);
  g.fillStyle = '#4a4a4a'; g.fillRect(x+6, y+12, 20, 4);
  g.fillStyle = '#3a3a42'; g.fillRect(x+10, y+8, 12, 5);
  g.fillStyle = '#6a6a72'; g.fillRect(x+11, y+9, 10, 2);
  const f = Math.sin(t * 9) > 0 ? 1 : 0;
  g.fillStyle = '#e07a2a'; g.fillRect(x+14, y+24+f, 4, 3);
  g.fillStyle = '#f0c050'; g.fillRect(x+15, y+25+f, 2, 2);
}

/* 衣柜：木柜 + 双开门 + 铜把手 */
function drawWardrobe(g,x,y){
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x+4, y+28, 24, 3);
  g.fillStyle = '#6a4426'; g.fillRect(x+5, y+4, 22, 26);
  g.fillStyle = '#8a5a32'; g.fillRect(x+6, y+5, 20, 24);
  g.fillStyle = '#5a3a20'; g.fillRect(x+15, y+6, 2, 22);
  g.fillStyle = '#b08040';
  g.fillRect(x+12, y+15, 2, 3);
  g.fillRect(x+18, y+15, 2, 3);
  g.fillStyle = '#9a7040'; g.fillRect(x+6, y+2, 20, 3);
}

/* 摆放的家具：40×40 图标，底边对齐地块 */
function drawPlacedFurniture(g, id, x, y) {
  const def = INTERIOR_MAP[id];
  if (!def) return;
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(Math.round(x - 4), Math.round(y - 8));
  drawFurnitureIcon(g, def, (typeof animTime !== 'undefined' ? animTime : 0) * 0.2);
  g.restore();
}

/* 装修样板：木桌 + 墙纸卷 + 地板样块 */
function drawRoomPlanner(g,x,y){
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x+3, y+28, 26, 3);
  g.fillStyle = '#6a4a2a'; g.fillRect(x+4, y+18, 24, 10);
  g.fillStyle = '#8a6238'; g.fillRect(x+5, y+16, 22, 4);
  g.fillStyle = '#4a3018'; g.fillRect(x+6, y+24, 3, 6); g.fillRect(x+23, y+24, 3, 6);
  /* 卷起来的墙纸 */
  g.fillStyle = '#c88aa0'; g.fillRect(x+7, y+9, 5, 8);
  g.fillStyle = '#8ac0a0'; g.fillRect(x+13, y+8, 5, 9);
  g.fillStyle = '#e0d0a0'; g.fillRect(x+19, y+10, 5, 7);
  /* 地板样块 */
  g.fillStyle = '#b08a60'; g.fillRect(x+10, y+30, 12, 2);
}

function drawMachine(g,type,x,y,b){
  const busy = b && b.job;
  const t = (typeof animTime !== 'undefined' ? animTime : 0);
  if(type === 'keg'){
    g.fillStyle = '#6a3f1e'; g.fillRect(x+7,y+9,26,25);
    g.fillStyle = '#8a5a2a'; g.fillRect(x+9,y+11,22,21);
    g.fillStyle = '#4a2a14'; g.fillRect(x+7,y+15,26,3); g.fillRect(x+7,y+28,26,3);
    g.fillStyle = '#b08040'; g.fillRect(x+19,y+18,2,8);
    g.fillStyle = '#d0b070'; g.fillRect(x+7,y+8,26,3);
  }else if(type === 'preserves_jar'){
    g.fillStyle = '#cfe3e8'; g.fillRect(x+9,y+11,22,22);
    g.fillStyle = '#8ac0c8'; g.fillRect(x+11,y+19,18,12);
    g.fillStyle = '#e05a5a'; g.fillRect(x+12,y+21,16,8);
    g.fillStyle = '#6a8a90'; g.fillRect(x+8,y+7,24,5);
    g.fillStyle = '#f0f4f4'; g.fillRect(x+11,y+13,4,3);
  }else if(type === 'cheese_press'){
    g.fillStyle = '#7a4a24'; g.fillRect(x+6,y+24,28,7);
    g.fillStyle = '#9a6232'; g.fillRect(x+9,y+18,22,7);
    g.fillStyle = '#e0c040'; g.fillRect(x+12,y+12,16,7);
    g.fillStyle = '#f0d870'; g.fillRect(x+13,y+13,6,3);
    g.fillStyle = '#5a3418'; g.fillRect(x+18,y+6,4,7);
  }else if(type === 'mayo_machine'){
    g.fillStyle = '#8a8a9a'; g.fillRect(x+8,y+12,24,20);
    g.fillStyle = '#a8a8b8'; g.fillRect(x+10,y+14,20,7);
    g.fillStyle = '#e8e8d8'; g.fillRect(x+14,y+24,12,6);
    g.fillStyle = '#f0d060'; g.fillRect(x+17,y+25,6,4);
    g.fillStyle = '#5a5a6a'; g.fillRect(x+8,y+10,24,3);
  }else if(type === 'loom'){
    g.fillStyle = '#7a4a24'; g.fillRect(x+7,y+7,4,27); g.fillRect(x+29,y+7,4,27);
    g.fillStyle = '#9a6232'; g.fillRect(x+7,y+7,26,4);
    g.fillStyle = '#e8e0d0'; g.fillRect(x+11,y+13,18,16);
    g.fillStyle = '#c0b8a8'; g.fillRect(x+11,y+17,18,2); g.fillRect(x+11,y+23,18,2);
  }else if(type === 'oil_maker'){
    g.fillStyle = '#4a4a3a'; g.fillRect(x+8,y+12,24,22);
    g.fillStyle = '#6a6a52'; g.fillRect(x+10,y+14,20,18);
    g.fillStyle = '#3a3a2a'; g.fillRect(x+15,y+5,10,7);
    g.fillStyle = '#8a7a3a'; g.fillRect(x+17,y+22,6,5);
  }else{
    g.fillStyle = '#8a5a2b'; g.fillRect(x+8,y+12,24,18);
  }
  if(busy){
    const pulse = 0.5 + Math.sin(t * 4) * 0.5;
    g.fillStyle = 'rgba(255,215,106,' + (0.35 + pulse * 0.45).toFixed(2) + ')';
    g.fillRect(x+18,y+2,4,4);
  }
}

function drawBuilding(g,b,x,y){
  if(b.preset) drawTownProp(g, b, x, y);        /* 第 25 轮：镇上的家具复用同一套绘制 */
  else if(b.type.indexOf('furn_') === 0) drawPlacedFurniture(g, b.type.slice(5), x, y);
  else if(b.type === 'fence')     drawFence(g,x,y);
  else if(b.type === 'chest') drawChest(g,x,y, chestOpen && openChest === b);
  else if(b.type === 'sprinkler') drawSprinkler(g,x,y, animTime);
  else if(b.type === 'stove') drawStove(g,x,y);
  else if(b.type === 'wardrobe') drawWardrobe(g,x,y);
  else if(b.type === 'room_planner') drawRoomPlanner(g,x,y);
  else if(b.type === 'coop') { if(!drawAnimStructure(g,b.type,x,y)) drawCoop(g,x,y); }
  else if(b.type === 'barn') { if(!drawAnimStructure(g,b.type,x,y)) drawBarn(g,x,y); }
  else if(b.type === 'maker') drawMaker(g,x,y,b);
  else if(typeof isMachineType === 'function' && isMachineType(b.type)) drawMachine(g,b.type,x,y,b);
  else if(b.type === 'irrigator') drawIrrigator(g,x,y, animTime);   /* 第 20 轮 */
  else if(b.type === 'scarecrow') drawScarecrow(g,x,y);             /* 第 20 轮 */
  else if(b.type === 'autobox')   drawAutobox(g,x,y, animTime);     /* 第 20 轮 */
  else if(typeof hasAnimBuilding === 'function' && hasAnimBuilding(b.type))
    drawAnimStructure(g, b.type, x, y);
}
/* 石板路：半透明地铺在地面上（底下是耕地也照样能看见犁沟） */
function drawRoadTile(g,x,y){
  const C = CONFIG.TILE_COLORS;
  const sl = [[1,1],[17,1],[1,17],[17,17]];
  for(const s of sl){
    g.globalAlpha = 0.60; g.fillStyle = C.roadStone;
    g.fillRect(x+s[0], y+s[1], 14, 14);
    g.globalAlpha = 0.80; g.fillStyle = C.roadStoneLight;
    g.fillRect(x+s[0], y+s[1], 14, 2);
    g.globalAlpha = 0.55; g.fillStyle = C.roadStoneDark;
    g.fillRect(x+s[0], y+s[1]+12, 14, 2);
  }
  g.globalAlpha = 1;
}
function drawRoads(g,x0,y0,x1,y1){
  for(let ty=y0;ty<=y1;ty++)
    for(let tx=x0;tx<=x1;tx++){
      if(!roads[ty*MAP_W+tx]) continue;
      drawRoadTile(g, tx*TILE - cam.x, ty*TILE - cam.y);
    }
}

/* 地面层：草地 / 泥土 / 水
 * 注意：树/岩石/野花/建筑所在格也铺草地底色（物件画在其上），避免出现黑块 */
function drawGroundTileBase(g, tx, ty, x, y){
  const C = CONFIG.TILE_COLORS;
  const t = map[ty*MAP_W+tx];
  if(t === T.DIRT){
    g.fillStyle = C.dirt; g.fillRect(x,y,TILE,TILE);
    g.fillStyle = C.dirtLine;
    g.fillRect(x+1, y+5,  TILE-2, 4);
    g.fillRect(x+1, y+15, TILE-2, 4);
    g.fillRect(x+1, y+25, TILE-2, 4);
    g.fillStyle = C.dirtLine2; g.fillRect(x+1, y+2, TILE-2, 2);
  } else if(t === T.TILLED){                       /* 耕地：横向犁沟 */
    g.fillStyle = C.tilled; g.fillRect(x,y,TILE,TILE);
    g.fillStyle = C.tilledRidge;
    g.fillRect(x+1, y+4,  TILE-2, 3);
    g.fillRect(x+1, y+13, TILE-2, 3);
    g.fillRect(x+1, y+22, TILE-2, 3);
    g.fillStyle = C.tilledLine;
    g.fillRect(x+1, y+8,  TILE-2, 2);
    g.fillRect(x+1, y+17, TILE-2, 2);
    g.fillRect(x+1, y+26, TILE-2, 2);
  } else if(t === T.WATERED){                     /* 已浇水：湿土 + 反光 */
    g.fillStyle = C.watered; g.fillRect(x,y,TILE,TILE);
    g.fillStyle = C.tilledRidge;
    g.fillRect(x+1, y+4,  TILE-2, 3);
    g.fillRect(x+1, y+13, TILE-2, 3);
    g.fillRect(x+1, y+22, TILE-2, 3);
    g.fillStyle = C.wateredSheen;
    g.fillRect(x + 4 + ((hash2(tx,ty)*8)|0), y+9,  7, 2);
    g.fillRect(x + 18 - ((hash2(ty,tx)*7)|0), y+24, 6, 2);
  } else if(t === T.BARE){                         /* 空地：浅色裸土 */
    g.fillStyle = C.bare; g.fillRect(x,y,TILE,TILE);
    g.fillStyle = C.bareDot;
    g.fillRect(x + ((hash2(tx,ty)*26)|0), y + ((hash2(ty,tx)*26)|0), 3, 2);
    g.fillRect(x + ((hash2(tx*3+1,ty)*24)|0), y + ((hash2(tx,ty*5+2)*24)|0), 2, 2);
    g.fillStyle = C.bareStone;
    g.fillRect(x + 6 + ((hash2(tx*7,ty*3)*18)|0), y + 20, 3, 3);
  } else if(t === T.WATER){
    g.fillStyle = C.water; g.fillRect(x,y,TILE,TILE);
  } else if(t === T.BLD){                         /* 第 26 轮：地图上已经没有屋顶格了
                                                  *（这里留着给老存档里的残留格） */
    const K = CONFIG.TOWN.COLORS;
    const b = townBuildingAt(tx,ty);
    const shop = b && b.kind === 'shop';
    g.fillStyle = shop ? K.roofShop : K.roofHouse;
    g.fillRect(x,y,TILE,TILE);
    g.fillStyle = shop ? K.roofShopLine : K.roofHouseLine;
    g.fillRect(x + 1, y + 5,  TILE-8, 2);         /* 瓦片错缝（同一行对齐 → 连成整片屋顶） */
    g.fillRect(x + 5, y + 14, TILE-8, 2);
    g.fillRect(x + 1, y + 23, TILE-8, 2);
  } else if(t === T.DOOR){                         /* 门：木门框 + 门槛 */
    drawDoorTile(g,x,y);
  } else if(t === T.WALL || t === T.WALL_BACK){  /* 室内墙（后墙 / 侧墙）：永远不透明 */
    const K = CONFIG.TOWN.COLORS;
    g.fillStyle = K.wall; g.fillRect(x,y,TILE,TILE);
    g.fillStyle = K.wallLine;
    g.fillRect(x, y+15, TILE, 2);
    g.fillRect(x+15, y, 2, 15);
  } else if(t === T.WALL_FRONT){                /* 第 25 轮：前墙 —— 底子画成室外地面，
                                                  * 墙本身每帧单独画（玩家在屋里时半透明） */
    drawGrassTile(g,tx,ty,x,y);
  } else if(t === T.FLOOR){                        /* 室内木地板 */
    const K = CONFIG.TOWN.COLORS;
    g.fillStyle = K.floor; g.fillRect(x,y,TILE,TILE);
    g.fillStyle = K.floorLine;
    g.fillRect(x, y+7,  TILE, 1);
    g.fillRect(x, y+15, TILE, 1);
    g.fillRect(x, y+23, TILE, 1);
  } else if(t === T.PATH){                         /* 石板路（街） */
    const K = CONFIG.TOWN.COLORS;
    g.fillStyle = K.path; g.fillRect(x,y,TILE,TILE);
    g.fillStyle = K.pathLine;
    g.fillRect(x, y+10, TILE, 1);
    g.fillRect(x+10, y, 1, 10);
    g.fillRect(x+22, y+11, 1, 10);
    g.fillRect(x, y+21, TILE, 1);
  } else {
    /* 草地（含树/石/花/建筑所在格的地基） */
    drawGrassTile(g,tx,ty,x,y);
  }
}
/* 草地底色（树 / 石 / 花 / 前墙底下都铺这个） */
function drawGrassTile(g,tx,ty,x,y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.grass; g.fillRect(x,y,TILE,TILE);
  const h1 = hash2(tx,ty), h2 = hash2(ty*7+3, tx*11+5), h3 = hash2(tx*13+1, ty*17+2);
  g.fillStyle = C.grassDot;  g.fillRect(x + ((h1*28)|0), y + ((h2*28)|0), 2, 2);
  g.fillStyle = C.grassDot2; g.fillRect(x + ((h2*26)|0), y + ((h3*27)|0), 2, 2);
  g.fillStyle = C.grassDot;  g.fillRect(x + ((h3*25)|0), y + ((h1*29)|0), 3, 1);
}
/* 水面反光：会动 → 不烘焙，每帧单独画 */
function drawWaterAnim(g, tx, ty, x, y){
  const C = CONFIG.TILE_COLORS;
  const ph = ((animTime*3)|0) + tx*3 + ty*5;
  g.fillStyle = C.waterLight;
  g.fillRect(x + 3 + (ph % 7),      y + 8,  9, 2);
  g.fillRect(x + 14 - ((ph*2) % 7), y + 21, 8, 2);
  g.fillStyle = C.waterDark;
  g.fillRect(x + 2 + ((ph*3) % 9),   y + 28, 6, 1);
}
/* 把一格静态地面画进离屏画布 */
function bakeGroundTile(tx, ty){
  drawGroundTileBase(groundCtx, tx, ty, tx*TILE, ty*TILE);
  const i = ty*MAP_W+tx;
  if(!groundBaked[i]){ groundBaked[i] = 1; groundBakedCount++; }
}
/* 补齐：先重画变脏的格子，再补上还没烘焙过的可见格子 */
function ensureGroundBaked(x0,y0,x1,y1){
  if(groundDirty.size){
    for(const i of groundDirty){
      const tx = i % MAP_W, ty = (i / MAP_W) | 0;
      bakeGroundTile(tx, ty);
    }
    groundDirty.clear();
  }
  for(let ty=y0;ty<=y1;ty++)
    for(let tx=x0;tx<=x1;tx++){
      const i = ty*MAP_W+tx;
      if(groundBaked[i]) continue;
      bakeGroundTile(tx, ty);
    }
}
function drawGround(g,x0,y0,x1,y1){
  /* 快路径：静态地面已经在离屏画布里 → 一次 drawImage 贴上去 */
  if(CONFIG.PERF.BAKE_GROUND && groundCtx){
    ensureGroundBaked(x0,y0,x1,y1);
    const sx = x0*TILE, sy = y0*TILE, sw = (x1-x0+1)*TILE, sh = (y1-y0+1)*TILE;
    g.drawImage(groundCv, sx, sy, sw, sh, sx - cam.x, sy - cam.y, sw, sh);
    /* 水面反光是动的，不在离屏画布里 */
    for(let ty=y0;ty<=y1;ty++)
      for(let tx=x0;tx<=x1;tx++)
        if(map[ty*MAP_W+tx] === T.WATER) drawWaterAnim(g, tx, ty, tx*TILE-cam.x, ty*TILE-cam.y);
    /* 第 25 轮：前墙也是「每帧」的（玩家在屋里时半透明），不能烘焙 */
    drawFrontWalls(g,x0,y0,x1,y1);
    return;
  }
  /* 慢路径（关掉 CONFIG.PERF.BAKE_GROUND 时）：逐格现画 */
  for(let ty=y0;ty<=y1;ty++){
    for(let tx=x0;tx<=x1;tx++){
      const x = tx*TILE - cam.x, y = ty*TILE - cam.y;
      drawGroundTileBase(g, tx, ty, x, y);
      if(map[ty*MAP_W+tx] === T.WATER) drawWaterAnim(g, tx, ty, x, y);
    }
  }
  drawFrontWalls(g,x0,y0,x1,y1);
}
/* 第 25 轮：前墙（玩家在屋里时 alpha 0.25，免得挡住视线；不在屋里就实心） */
function drawFrontWalls(g,x0,y0,x1,y1){
  const room = playerRoomWide();
  for(let ty=y0;ty<=y1;ty++)
    for(let tx=x0;tx<=x1;tx++){
      if(map[ty*MAP_W+tx] !== T.WALL_FRONT) continue;
      const b = townFrontWallBuilding(tx,ty);
      drawFrontWall(g, tx, ty, tx*TILE-cam.x, ty*TILE-cam.y, !!(b && room === b.id));
    }
}
function drawFrontWall(g,tx,ty,x,y,inside){
  const K = CONFIG.TOWN.COLORS;
  g.globalAlpha = inside ? 0.25 : 1;
  g.fillStyle = K.wall; g.fillRect(x,y,TILE,TILE);
  g.fillStyle = K.wallLine;
  g.fillRect(x, y+15, TILE, 2);
  g.fillRect(x+15, y, 2, 15);
  g.globalAlpha = 1;
}

/* 物件层：树 / 岩石 / 野花（建筑单独绘制，可跨格） */
function drawObjects(g,x0,y0,x1,y1){
  for(let ty=y0;ty<=y1;ty++){
    for(let tx=x0;tx<=x1;tx++){
      const t = map[ty*MAP_W+tx];
      if(t===T.TREE || t===T.ROCK || t===T.FLOWER){
        const x = tx*TILE - cam.x, y = ty*TILE - cam.y;
        if(t===T.TREE) drawTreeWithState(g,x,y,ty*MAP_W+tx);
        else if(t===T.ROCK) drawRockWithState(g,x,y,ty*MAP_W+tx);
        else drawFlowerWithState(g,x,y,ty*MAP_W+tx,(hash2(tx,ty)*3)|0);
      } else if(t === T.FLOOR){                 /* 第 24 轮：地毯（平的，不参与 Y 排序） */
        const pr = townPropAt(tx,ty);
        if(pr && pr.flat) drawTownProp(g, pr, tx*TILE - cam.x, ty*TILE - cam.y);
      }
    }
  }
}

/* 季节层：给地面叠一层季节色调（冬偏冷白），只影响地面，不影响物件 */
function drawSeasonOverlay(g,x0,y0,x1,y1){
  const st = CONFIG.SEASON_TINT[seasonName()];
  if(!st || st.a <= 0) return;
  g.globalAlpha = st.a;
  g.fillStyle = st.c;
  g.fillRect(x0*TILE - cam.x, y0*TILE - cam.y, (x1-x0+1)*TILE, (y1-y0+1)*TILE);
  g.globalAlpha = 1;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { drawFence, drawChest, drawSprinkler, drawCoop, drawBarn, drawMaker, drawMachine, drawIrrigator, drawScarecrow, drawAutobox, drawStove, drawWardrobe, drawRoomPlanner, drawBuilding, drawRoadTile, drawRoads, drawGroundTileBase, drawGrassTile, drawWaterAnim, bakeGroundTile, ensureGroundBaked, drawGround, drawFrontWalls, drawFrontWall, drawObjects, drawSeasonOverlay });
export { drawFence, drawChest, drawSprinkler, drawCoop, drawBarn, drawMaker, drawMachine, drawIrrigator, drawScarecrow, drawAutobox, drawStove, drawWardrobe, drawRoomPlanner, drawBuilding, drawRoadTile, drawRoads, drawGroundTileBase, drawGrassTile, drawWaterAnim, bakeGroundTile, ensureGroundBaked, drawGround, drawFrontWalls, drawFrontWall, drawObjects, drawSeasonOverlay };
