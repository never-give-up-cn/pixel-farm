/* js/render/tiles.js —— 由 index.html 拆分，原行 2651–2729 */
'use strict';

/* === 3.渲染 === */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', {alpha:false});
canvas.width  = VIEW_W;
canvas.height = VIEW_H;
ctx.imageSmoothingEnabled = false;

/* 等比缩放并居中：整数倍优先（像素锐利），窗口再小也不会变形/溢出 */
function fitCanvas(){
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const s = CONFIG.INTEGER_SCALE && scale >= 1 ? Math.floor(scale) : scale;
  const finalScale = Math.max(CONFIG.MIN_SCALE, s);
  canvas.style.width  = Math.round(VIEW_W * finalScale) + 'px';
  canvas.style.height = Math.round(VIEW_H * finalScale) + 'px';
}
window.addEventListener('resize', ()=>{ fitCanvas(); layoutToasts(); layoutSysTip(); });
fitCanvas();

/* --- 单个瓦片绘制 --- */
function drawTree(g,x,y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.treeTrunk;     g.fillRect(x+13, y+18, 6, 14);
  g.fillStyle = C.treeTrunkDark; g.fillRect(x+14, y+19, 2, 13);
  g.fillStyle = C.treeLeaf;      g.fillRect(x+6,  y+8,  20, 14);
  g.fillStyle = C.treeLeaf;      g.fillRect(x+9,  y+4,  14, 18);
  g.fillStyle = C.treeLeafLight; g.fillRect(x+8,  y+7,  16, 12);
  g.fillStyle = C.treeLeafTop;   g.fillRect(x+11, y+5,  9,  7);
}
function drawRock(g,x,y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.rockDark;  g.fillRect(x+6,  y+16, 20, 13);
  g.fillStyle = C.rock;      g.fillRect(x+9,  y+11, 14, 11);
  g.fillStyle = C.rockLight; g.fillRect(x+11, y+9,   9,  6);
  g.fillStyle = C.rockDark;  g.fillRect(x+19, y+18,  7,  9);
}
function drawFlower(g,x,y,v){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.flowerStem; g.fillRect(x+15, y+19, 2, 9);
  g.fillStyle = C.flowers[v % C.flowers.length];
  g.fillRect(x+12, y+16, 7, 5); g.fillRect(x+14, y+13, 3, 8);
  g.fillStyle = C.flowerCenter; g.fillRect(x+15, y+16, 2, 3);
}
function drawHouse(g,px,py){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.houseWall;     g.fillRect(px+6,  py+22, 84, 40);
  g.fillStyle = C.houseWallLine; g.fillRect(px+6,  py+36, 84, 1);
  g.fillRect(px+6, py+48, 84, 1);
  g.fillStyle = C.houseWallDark; g.fillRect(px+6,  py+58, 84, 4);
  g.fillStyle = C.houseDoor;     g.fillRect(px+38, py+34, 20, 28);
  g.fillStyle = C.houseDoorDark; g.fillRect(px+38, py+34, 3, 28);
  g.fillStyle = C.houseKnob;     g.fillRect(px+53, py+46, 3, 3);
  g.fillStyle = C.houseWindowFrame; g.fillRect(px+14, py+30, 18, 16);
  g.fillStyle = C.houseWindow;      g.fillRect(px+16, py+32, 14, 12);
  g.fillStyle = C.houseWindowFrame; g.fillRect(px+22, py+32, 2, 12);
  g.fillRect(px+16, py+37, 14, 2);
  g.fillStyle = C.houseRoof;     g.fillRect(px+2,  py+2,  92, 22);
  g.fillStyle = C.houseRoofLight;g.fillRect(px+10, py+4,  76, 9);
  g.fillStyle = C.houseRoofDark; g.fillRect(px+2,  py+20, 92, 4);
  g.fillStyle = C.houseChimney;  g.fillRect(px+66, py-6,  10, 12);
}
function drawShop(g,px,py){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.shopPost;        g.fillRect(px+3,  py+18, 6, 42);
  g.fillRect(px+55, py+18, 6, 42);
  g.fillStyle = C.shopCounter;     g.fillRect(px+1,  py+34, 62, 26);
  g.fillStyle = C.shopCounterDark; g.fillRect(px+1,  py+34, 62, 4);
  g.fillRect(px+1, py+52, 62, 8);
  g.fillStyle = C.shopGoods1; g.fillRect(px+8,  py+27, 9, 7);
  g.fillStyle = C.shopGoods2; g.fillRect(px+19, py+27, 9, 7);
  g.fillStyle = C.shopGoods3; g.fillRect(px+30, py+27, 9, 7);
  g.fillStyle = C.shopGoods4; g.fillRect(px+41, py+27, 9, 7);
  for(let k=0;k<5;k++){
    g.fillStyle = k%2 ? C.shopCanopyA : C.shopCanopyB;
    g.fillRect(px+1+k*12, py+4, 12, 14);
  }
  g.fillStyle = C.shopCanopyDark; g.fillRect(px+1, py+16, 62, 4);
  g.fillStyle = C.shopSign;      g.fillRect(px+16, py+19, 32, 10);
  g.fillStyle = C.shopSignText;  g.fillRect(px+20, py+22, 24, 3);
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { canvas, ctx, fitCanvas, drawTree, drawRock, drawFlower, drawHouse, drawShop });
export { canvas, ctx, fitCanvas, drawTree, drawRock, drawFlower, drawHouse, drawShop };
