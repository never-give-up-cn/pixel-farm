/* js/render/crops.js —— 由 index.html 拆分，原行 3279–3365
 * 第 32 轮：作物改用 js/anim/sdv-crops.js 的程序化作物美术，
 * 按「已生长天数 / 成熟天数」映射到 anim 层的 day 帧。 */
'use strict';

import {
  CROP_MAP as ANIM_CROP_MAP,
  CROP_BASE as ANIM_CROP_BASE,
  drawCrop as drawAnimCrop,
  drawWithered as drawAnimWithered
} from '../anim/sdv-crops.js';

/* 游戏里的杂交作物在 anim 图鉴里没有独立形象，借用亲本作物 */
const ANIM_CROP_FALLBACK = {
  tomato_radish: 'radish',
  potato_pumpkin: 'pumpkin',
  tomato_pumpkin: 'pumpkin'
};

function animCropOf(type) {
  return ANIM_CROP_MAP[type]
    || ANIM_CROP_MAP[ANIM_CROP_FALLBACK[type]]
    || ANIM_CROP_MAP.radish;
}

/* --- 作物层：anim 作物美术 + 浇水提示 + 成熟闪光 --- */
function mixHex(a,b,t){
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = [0,1,2].map(i => Math.round(A[i] + (B[i]-A[i]) * t));
  return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
}
function drawCrop(g,x,y,crop){
  const def = cropDef(crop.type);
  const ac = animCropOf(crop.type);
  const baseY = y + TILE - 7;                       /* 地表基线 */
  const cx = x + TILE/2;
  const ratio = crop.mature
    ? 1
    : Math.min(1, Math.max(0, (crop.grown || 0) / Math.max(1, def.days)));
  const plantH = 6 + Math.round(ratio * 20);

  /* anim 作物格 32×40，基线在 y=34；把基线对齐到地块底部 */
  g.save();
  g.translate(x, baseY - ANIM_CROP_BASE);
  if(crop.dead){
    drawAnimWithered(g);
  }else{
    const day = Math.max(1, Math.min(ac.days, Math.round(ratio * ac.days)));
    drawAnimCrop(g, ac, day, animTime * 0.5 + (x + y) * 0.013);
  }
  g.restore();

  if(crop.watered && !crop.dead){            /* 今天浇过水 → 右上角挂一滴水 */
    g.fillStyle = '#6fc7ff';
    g.fillRect(cx + 8, baseY - plantH - 3, 2, 3);
    g.fillRect(cx + 7, baseY - plantH - 2, 4, 1);
  }
  if(crop.mature){                                 /* 成熟：果实旁闪一下金光 */
    const bob = ((animTime*10)|0) % 6;
    g.fillStyle = 'rgba(255,215,106,' + (0.9 - bob*0.12).toFixed(2) + ')';
    g.fillRect(cx + 8, baseY - plantH - 6 + bob, 2, 2);
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
