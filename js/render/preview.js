/* js/render/preview.js —— 由 index.html 拆分，原行 3441–3564 */
'use strict';

/* --- 建造预览：能放 = 绿色，放不了 = 红色 --- */
function drawBuildPreview(g){
  if(!buildMode) return;
  if(hover.tx < 0 || hover.ty < 0) return;
  const r = curRecipe();
  if(!r) return;
  const tx = hover.tx, ty = hover.ty;
  const x = tx*TILE - cam.x, y = ty*TILE - cam.y;
  const p = buildPreview(tx,ty,r);
  g.globalAlpha = 0.40;
  g.fillStyle = p.ok ? 'rgba(90,230,120,0.75)' : 'rgba(240,90,80,0.75)';
  g.fillRect(x+1, y+1, TILE-2, TILE-2);
  g.globalAlpha = 0.62;
  if(r.overlay) drawRoadTile(g,x,y);
  else if(r.id === 'fence')     drawFence(g,x,y);
  else if(r.id === 'chest')     drawChest(g,x,y,false);
  else if(r.id === 'sprinkler') drawSprinkler(g,x,y, animTime);
  else if(r.id === 'coop' || r.id === 'barn'){ if(!drawAnimStructure(g, r.id, x, y)) { r.id === 'coop' ? drawCoop(g,x,y) : drawBarn(g,x,y); } }
  else if(r.id === 'maker')     drawMaker(g,x,y,null);
  else if(r.id === 'irrigator') drawIrrigator(g,x,y, animTime);   /* 第 20 轮 */
  else if(r.id === 'scarecrow') drawScarecrow(g,x,y);             /* 第 20 轮 */
  else if(r.id === 'autobox')   drawAutobox(g,x,y, animTime);     /* 第 20 轮 */
  else if(typeof hasAnimBuilding === 'function' && hasAnimBuilding(r.id)) drawAnimStructure(g, r.id, x, y);
  g.globalAlpha = 1;
  g.strokeStyle = p.ok ? 'rgba(120,255,150,0.95)' : 'rgba(255,110,100,0.95)';
  g.lineWidth = 2;
  g.strokeRect(x+1, y+1, TILE-2, TILE-2);
}
/* 建造面板里的 14×14 小图标 */
function drawBuildIcon(g,id,x,y){
  const C = CONFIG.TILE_COLORS;
  if(id === 'fence'){
    g.fillStyle = C.fencePost; g.fillRect(x+1, y+2, 3, 11); g.fillRect(x+10, y+2, 3, 11);
    g.fillStyle = C.fenceRail; g.fillRect(x, y+4, 14, 2); g.fillRect(x, y+8, 14, 2);
  }else if(id === 'chest'){
    g.fillStyle = C.chestLid;  g.fillRect(x, y+2, 14, 4);
    g.fillStyle = C.chestBody; g.fillRect(x+1, y+6, 12, 7);
    g.fillStyle = C.chestLock; g.fillRect(x+6, y+6, 2, 3);
  }else if(id === 'path'){
    g.fillStyle = C.roadStone;     g.fillRect(x, y+2, 6, 5); g.fillRect(x+8, y+2, 6, 5);
    g.fillRect(x, y+9, 6, 5); g.fillRect(x+8, y+9, 6, 5);
    g.fillStyle = C.roadStoneDark; g.fillRect(x+6, y+2, 2, 5); g.fillRect(x, y+7, 6, 2);
  }else if(id === 'sprinkler'){
    g.fillStyle = C.sprinkPost; g.fillRect(x+6, y+6, 2, 7);
    g.fillStyle = C.sprinkHead; g.fillRect(x+2, y+3, 10, 3);
    g.fillStyle = C.dropWater;  g.fillRect(x+1, y+9, 2, 2); g.fillRect(x+11, y+9, 2, 2);
  }else if(id === 'coop'){
    if(!(typeof drawAnimStructureIcon === 'function' && drawAnimStructureIcon(g, id, x+1, y+1, 13))){
      g.fillStyle = C.coopRoof;  g.fillRect(x+1, y+2, 12, 3);
      g.fillStyle = C.coopWall;  g.fillRect(x+2, y+5, 10, 8);
      g.fillStyle = '#4a3222';   g.fillRect(x+5, y+8, 4, 5);
    }
  }else if(id === 'barn'){
    if(!(typeof drawAnimStructureIcon === 'function' && drawAnimStructureIcon(g, id, x+1, y+1, 13))){
      g.fillStyle = C.barnRoof;  g.fillRect(x+1, y+1, 12, 3);
      g.fillStyle = C.barnWall;  g.fillRect(x+2, y+4, 10, 9);
      g.fillStyle = C.barnTrim;  g.fillRect(x+5, y+6, 4, 7);
      g.fillStyle = C.barnWallDark; g.fillRect(x+6, y+7, 2, 5);
    }
  }else if(id === 'maker'){
    g.fillStyle = '#8a5a2b'; g.fillRect(x+2, y+5, 10, 3);      /* 桌面 */
    g.fillStyle = '#5b3a1d'; g.fillRect(x+3, y+8, 2, 5); g.fillRect(x+9, y+8, 2, 5);
    g.fillStyle = '#9aa1a9'; g.fillRect(x+8, y+2, 4, 3);       /* 小齿轮 */
    g.fillStyle = '#ff9a3a'; g.fillRect(x+5, y+10, 4, 2);      /* 炉口 */
  }else if(id === 'irrigator'){                                /* 第 20 轮：铱质洒水器 */
    g.fillStyle = '#4d6076'; g.fillRect(x+3, y+9, 8, 3);
    g.fillStyle = '#9fb4c9'; g.fillRect(x+6, y+3, 2, 7);
    g.fillStyle = '#7ee0d0'; g.fillRect(x+5, y+1, 4, 3);
    g.fillStyle = '#cfe3ff'; g.fillRect(x+1, y+6, 2, 1); g.fillRect(x+11, y+6, 2, 1);
  }else if(id === 'scarecrow'){                                /* 第 20 轮：稻草人 */
    g.fillStyle = '#8a5a2b'; g.fillRect(x+6, y+5, 2, 9);
    g.fillStyle = '#8a5a2b'; g.fillRect(x+2, y+7, 10, 2);
    g.fillStyle = '#b99a5e'; g.fillRect(x+5, y+7, 4, 4);
    g.fillStyle = '#e0c070'; g.fillRect(x+3, y+2, 8, 2);
    g.fillStyle = '#e0c070'; g.fillRect(x+5, y+1, 4, 2);
  }else if(id === 'autobox'){                                  /* 第 20 轮：自动采集箱 */
    g.fillStyle = '#4d6076'; g.fillRect(x+1, y+4, 12, 9);
    g.fillStyle = '#6d8299'; g.fillRect(x+2, y+2, 10, 2);
    g.fillStyle = '#26303c'; g.fillRect(x+5, y+7, 4, 6);
    g.fillStyle = '#6ef0a0'; g.fillRect(x+3, y+6, 2, 2);
  }else if(typeof hasAnimBuilding === 'function' && hasAnimBuilding(id)){
    drawAnimStructureIcon(g, id, x+1, y+1, 13);
  }
}
/* 建造面板（左侧）：配方 + 材料够不够 */
function drawBuildPanel(g, y0){
  const R = CONFIG.BUILD.RECIPES;
  const rowH = 24, w = 214, headH = 22, footH = 20;
  const MAX_ROWS = 12;
  const total = R.length;
  const rows = Math.min(MAX_ROWS, total);
  /* 配方多了以后只显示当前选中附近的一页 */
  const start = Math.max(0, Math.min(total - rows, buildSel - Math.floor(MAX_ROWS / 2)));
  const h = headH + rows*rowH + footH;
  const x = 8;
  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(x, y0, w, h);
  g.fillStyle = CONFIG.COLORS.hudBorder;
  g.fillRect(x, y0, w, 1); g.fillRect(x, y0+h-1, w, 1);
  g.fillRect(x, y0, 1, h); g.fillRect(x+w-1, y0, 1, h);
  g.textBaseline = 'top'; g.textAlign = 'left';
  g.font = '13px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudAccent;
  g.fillText('建造模式', x+8, y0+5);
  g.font = '11px ' + FONT_CJK; g.fillStyle = '#8fa3bd';
  g.fillText('B 退出', x+w-44, y0+6);
  for(let vi=0; vi<rows; vi++){
    const i = start + vi;
    const r = R[i], ry = y0 + headH + vi*rowH;
    if(i === buildSel){
      g.fillStyle = 'rgba(255,215,106,0.14)'; g.fillRect(x+4, ry, w-8, rowH-2);
    }
    drawBuildIcon(g, r.id, x+9, ry+4);
    g.font = '13px ' + FONT_CJK;
    g.fillStyle = (i === buildSel) ? CONFIG.COLORS.hudAccent : CONFIG.COLORS.hudText;
    g.fillText(r.name, x+29, ry+5);
    let cx = x+92;
    g.font = '12px ' + FONT_CJK;
    const bc = buildCost(r);                    /* 老木匠打折后的显示价 */
    for(const id in bc){
      const have = countItem(id), need = bc[id];
      g.fillStyle = have >= need ? '#7ee08a' : '#ff9a8a';
      const txt = itemDef(id).name + ' ' + have + '/' + need;
      g.fillText(txt, cx, ry+6);
      cx += Math.max(50, g.measureText(txt).width + 8);
    }
    if(r.gold){                                 /* 第 20 轮：金币造价（右对齐在行尾） */
      g.font = '11px ' + FONT_EMOJI;
      g.fillStyle = gold >= r.gold ? '#7ee08a' : '#ff9a8a';
      g.textAlign = 'right';
      g.fillText('💰' + gold + '/' + r.gold, x+w-5, ry+7);
      g.textAlign = 'left';
    }
  }
  g.font = '11px ' + FONT_CJK; g.fillStyle = '#8fa3bd';
  g.fillText('Q/E 或滚轮换配方 · ' + (buildSel+1) + '/' + total, x+8, y0 + headH + rows*rowH + 4);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { drawBuildPreview, drawBuildIcon, drawBuildPanel });
export { drawBuildPreview, drawBuildIcon, drawBuildPanel };
