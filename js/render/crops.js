/* js/render/crops.js —— 由 index.html 拆分，原行 3279–3365 */
'use strict';

/* --- 作物层：4 个视觉阶段（株高/叶片递增）+ 结果期果实 + 枯萎形态 --- */
function mixHex(a,b,t){
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = [0,1,2].map(i => Math.round(A[i] + (B[i]-A[i]) * t));
  return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
}
function drawCrop(g,x,y,crop){
  const A = CONFIG.CROP_ART, def = cropDef(crop.type);
  const baseY = y + TILE - 7;                       /* 地表基线 */
  const cx = x + TILE/2;
  if(crop.dead){                                   /* 枯萎：褐茎 + 下垂黄叶 */
    g.fillStyle = A.DEAD_STEM; g.fillRect(cx-1, baseY-6, 3, 6);
    g.fillStyle = A.DEAD_LEAF;
    g.fillRect(cx-6, baseY-5, 6, 3);
    g.fillRect(cx+1, baseY-2, 5, 3);
    g.fillStyle = '#6b5730'; g.fillRect(cx-3, baseY-1, 6, 2);
    return;
  }
  const stage = crop.stage;
  const h = A.STAGE_H[stage], lw = A.LEAF_W[stage];
  g.fillStyle = def.leaf;                          /* 茎 */
  g.fillRect(cx-1, baseY-h, 3, h);
  g.fillStyle = def.leaf;                          /* 叶 */
  g.fillRect(cx-lw, baseY-h+1, lw, 3);
  g.fillRect(cx+1, baseY-h+Math.max(2, h>>1), lw, 3);
  if(stage >= 2){                                  /* 嫩叶高光 */
    g.fillStyle = mixHex(def.leaf, '#d8e86a', 0.35);
    g.fillRect(cx-lw+1, baseY-h+2, Math.max(1, lw-2), 2);
  }
  if(stage >= 3){                                  /* 结果期：果实 */
    const ripe = ripeness(crop);
    const col = mixHex(def.unripe, def.ripe, ripe);
    if(crop.type === 'radish'){                    /* 根菜：露出土面的红萝卜 */
      const r = 3 + Math.round(3*ripe);
      g.fillStyle = col; g.fillRect(cx-r, baseY-r+1, r*2, r+2);
      g.fillStyle = mixHex(col, '#ffffff', 0.35);
      g.fillRect(cx-r+1, baseY-r+2, 2, 2);
    }else if(crop.type === 'potato'){              /* 土豆：土里的褐色块 */
      const r = 4 + Math.round(2*ripe);
      g.fillStyle = col; g.fillRect(cx-r, baseY-r, r*2, r+1);
      g.fillStyle = mixHex(col, '#000000', 0.25);
      g.fillRect(cx-r+2, baseY-1, 3, 2);
    }else if(crop.type === 'tomato'){              /* 番茄：挂在茎上的红果 */
      const r = 3 + Math.round(3*ripe);
      const fx = cx + (ripe > 0.5 ? 5 : -5), fy = baseY - h + 6;
      g.fillStyle = col;
      g.beginPath(); g.arc(fx, fy, r, 0, Math.PI*2); g.fill();
      g.fillStyle = mixHex(col, '#ffffff', 0.4);
      g.fillRect(fx-1, fy-r+1, 2, 2);
    }else{                                          /* 南瓜：地上的大果子 */
      const r = 5 + Math.round(4*ripe);
      g.fillStyle = col;
      g.beginPath(); g.arc(cx, baseY-r+2, r, 0, Math.PI*2); g.fill();
      g.fillStyle = mixHex(col, '#000000', 0.22);
      g.fillRect(cx-1, baseY-r, 3, 4);
      g.fillStyle = mixHex(col, '#ffffff', 0.3);
      g.fillRect(cx-r+2, baseY-r+1, 3, 2);
    }
  }
  if(crop.watered && !crop.dead){            /* 第 22 轮：今天浇过水 → 右上角挂一滴水 */
    g.fillStyle = '#6fc7ff';
    g.fillRect(cx + 8, baseY - h - 3, 2, 3);
    g.fillRect(cx + 7, baseY - h - 2, 4, 1);
  }
  if(crop.mature){                                 /* 成熟：果实旁闪一下金光 */
    const bob = ((animTime*10)|0) % 6;
    g.fillStyle = 'rgba(255,215,106,' + (0.9 - bob*0.12).toFixed(2) + ')';
    g.fillRect(cx + 7, baseY - h - 5 + bob, 2, 2);
  }
}
function drawCrops(g,x0,y0,x1,y1){
  for(let ty=y0;ty<=y1;ty++){
    for(let tx=x0;tx<=x1;tx++){
      const c = crops[ty*MAP_W+tx];
      if(!c) continue;
      drawCrop(g, tx*TILE - cam.x, ty*TILE - cam.y, c);
    }
  }
}

/* 建筑层：整栋绘制（跨 3×2 / 2×2 格） */
function drawBuildings(g){
  const hx = HOUSE_POS.x*TILE - cam.x, hy = HOUSE_POS.y*TILE - cam.y;
  if(hx < VIEW_W && hx + HOUSE_POS.w*TILE > 0 && hy < VIEW_H && hy + HOUSE_POS.h*TILE > 0) drawHouse(g,hx,hy);
  /* 第 24 轮：杂货店搬进镇上了（屋顶是地砖，画在地面层），不再画摊位 */
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { mixHex, drawCrop, drawCrops, drawBuildings });
export { mixHex, drawCrop, drawCrops, drawBuildings };
