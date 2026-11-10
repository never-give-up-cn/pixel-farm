/* js/render/town-fixtures.js —— 由 index.html 拆分，原行 2730–2888 */
'use strict';

/* --- 第 24 轮：镇上的家具 + 门牌 --- */
function drawTownProp(g, p, px, py){
  const K = CONFIG.TOWN.COLORS;
  switch(p.type){
    case 'counter':                     /* 柜台：老板娘站在后面 */
      g.fillStyle = K.counterDark; g.fillRect(px+1, py+13, 30, 15);
      g.fillStyle = K.counter;     g.fillRect(px+1, py+11, 30, 13);
      g.fillStyle = K.counterGoods;
      g.fillRect(px+4,  py+5, 6, 6);
      g.fillRect(px+13, py+6, 5, 5);
      g.fillRect(px+21, py+4, 7, 7);
      break;
    case 'shelf':
      g.fillStyle = K.shelf; g.fillRect(px+3, py+6, 26, 22);
      g.fillStyle = K.shelfGoods;
      g.fillRect(px+5,  py+9, 5, 5); g.fillRect(px+12, py+8, 5, 6);
      g.fillRect(px+19, py+10, 5, 4); g.fillRect(px+6, py+17, 4, 5);
      g.fillRect(px+14, py+18, 5, 4);
      break;
    case 'bed':                         /* 床：主人在旁边睡 */
      g.fillStyle = K.bedFrame; g.fillRect(px+2, py+3, 28, 25);
      g.fillStyle = K.blanket;   g.fillRect(px+4, py+10, 24, 16);
      g.fillStyle = K.bed;       g.fillRect(px+5, py+6, 22, 7);
      break;
    case 'table':
      g.fillStyle = K.tableDark; g.fillRect(px+6, py+19, 20, 9);
      g.fillStyle = K.table;     g.fillRect(px+4, py+9, 24, 12);
      break;
    case 'plant':
      g.fillStyle = K.pot;   g.fillRect(px+11, py+19, 12, 11);
      g.fillStyle = K.plant; g.fillRect(px+8, py+7, 18, 14);
      g.fillRect(px+11, py+2, 12, 8);
      break;
    case 'barrel':
      g.fillStyle = K.tableDark; g.fillRect(px+7, py+7, 19, 21);
      g.fillStyle = K.table;     g.fillRect(px+9, py+6, 15, 21);
      break;
    case 'rug':
      g.fillStyle = K.rug;     g.fillRect(px+2, py+2, 28, 28);
      g.fillStyle = K.rugLine; g.fillRect(px+6, py+6, 20, 20);
      break;
    /* 第 25 轮：原来没画的几件家具（灶台 / 工作台 / 书桌 / 花摊 / 箱子） */
    case 'stove':
      g.fillStyle = K.stoveDark; g.fillRect(px+4, py+10, 24, 18);
      g.fillStyle = K.stove;     g.fillRect(px+6, py+6, 20, 18);
      g.fillStyle = K.stoveFire; g.fillRect(px+10, py+8, 12, 4);
      g.fillStyle = K.stoveDark; g.fillRect(px+8, py+1, 16, 5);    /* 锅 */
      break;
    case 'bench':
      g.fillStyle = K.benchDark; g.fillRect(px+3, py+14, 26, 12);
      g.fillStyle = K.bench;     g.fillRect(px+5, py+10, 22, 8);
      g.fillStyle = K.benchTool; g.fillRect(px+8, py+4, 14, 5);    /* 刨子 */
      g.fillStyle = K.benchDark; g.fillRect(px+9, py+9, 3, 3);
      break;
    case 'desk':
      g.fillStyle = K.deskDark; g.fillRect(px+5, py+19, 22, 9);
      g.fillStyle = K.desk;     g.fillRect(px+3, py+9, 26, 12);
      g.fillStyle = K.signText; g.fillRect(px+8, py+5, 14, 9);     /* 摊开的书 */
      break;
    case 'flowerstand':
      g.fillStyle = K.flowerStandWood; g.fillRect(px+4, py+18, 24, 10);
      g.fillStyle = K.flowerstand;      g.fillRect(px+6, py+6, 20, 13);
      g.fillStyle = K.shelfGoods; g.fillRect(px+8, py+3, 4, 4);
      g.fillRect(px+15, py+1, 4, 5); g.fillRect(px+21, py+4, 4, 4);
      break;
    case 'chest':
      g.fillStyle = K.chestBoxDark; g.fillRect(px+3, py+8, 26, 19);
      g.fillStyle = K.chestBox;     g.fillRect(px+5, py+5, 22, 16);
      g.fillStyle = K.chestBoxDark; g.fillRect(px+5, py+12, 22, 2);
      g.fillStyle = K.chestLock;    g.fillRect(px+14, py+11, 5, 6);
      break;
  }
}
/* 门（第 26 轮：单独拎出来 —— 屋顶层也要再画一次门，
 * 不然玩家站在街上只能看见一块屋顶，看不见门在哪） */
function drawDoorTile(g,x,y){
  const K = CONFIG.TOWN.COLORS;
  g.fillStyle = K.doorDark;  g.fillRect(x, y, TILE, TILE);
  g.fillStyle = K.door;      g.fillRect(x+4, y+3, TILE-8, TILE-3);
  g.fillStyle = K.doorFrame; g.fillRect(x+2, y+1, TILE-4, 2);
  g.fillRect(x+2, y+TILE-3, TILE-4, 2);
  g.fillStyle = K.doorDark;  g.fillRect(x + TILE/2 - 1, y+5, 2, TILE-6);
}
/* 第 26 轮：屋顶 —— 纯渲染层
 * 地图上不再有「屋顶格」：房子就是一堵 1 格厚的墙 + 一屋地板。
 * 屋顶只在渲染时盖一层：玩家在屋外 → 盖住，屋里看不见；
 * 玩家进了这栋房子 → 屋顶掀开（CONFIG.TOWN.ROOF.ALPHA_INSIDE），屋里一览无余。 */
function drawRoofs(g){
  const C = CONFIG.TOWN, R = C.ROOF, K = C.COLORS;
  const room = playerRoomWide();            /* 玩家在哪栋房子里（含墙格和门格） */
  for(const b of C.LIST){
    const alpha = (room === b.id) ? R.ALPHA_INSIDE : 1;
    if(alpha <= 0.02) continue;             /* 玩家在屋里 → 屋顶完全掀开 */
    const row = b.row || C.ROOM_ROW;
    const sx = b.x*TILE - cam.x, sy = row*TILE - cam.y;
    const sw = b.w*TILE, sh = C.ROOM_H*TILE;
    if(sx > VIEW_W || sx + sw < 0 || sy > VIEW_H || sy + sh < 0) continue;   /* 视锥裁剪 */
    const shop = b.kind === 'shop';
    g.globalAlpha = alpha;
    g.fillStyle = shop ? K.roofShop : K.roofHouse;
    g.fillRect(sx, sy, sw, sh);
    /* 瓦片横纹 */
    g.fillStyle = shop ? K.roofShopLine : K.roofHouseLine;
    for(let yy = sy + 8; yy < sy + sh - 8; yy += R.TILE_H) g.fillRect(sx + 3, yy, sw - 6, 2);
    /* 屋脊（北边那条）*/
    g.fillStyle = K.roofRidge; g.fillRect(sx, sy, sw, 5);
    /* 屋檐（南边那条）*/
    g.fillStyle = K.roofEave;  g.fillRect(sx, sy + sh - 6, sw, 6);
    /* 烟囱（商店屋顶）*/
    if(R.CHIMNEY && shop){
      const cx = sx + sw - 46;
      g.fillStyle = K.roofEave;   g.fillRect(cx, sy + 16, 14, 20);
      g.fillStyle = K.roofRidge;  g.fillRect(cx - 2, sy + 12, 18, 5);
    }
    /* 门口：屋顶上再画一次门（不然街上只看得见一块屋顶）*/
    drawDoorTile(g, (b.x + C.DOOR_DX)*TILE - cam.x, sy);
    g.globalAlpha = 1;
  }
}
/* 门牌：写清楚「在不在 / 为什么不在 / 去哪了」（原则 C） */
function drawTownSign(g, b, px, py){
  const K = CONFIG.TOWN.COLORS;
  g.fillStyle = K.signPost; g.fillRect(px+14, py+12, 4, 20);
  g.fillStyle = K.sign;      g.fillRect(px+2, py+2, 28, 12);
  g.fillStyle = K.signText;  g.fillRect(px+5, py+6, 22, 4);
  /* 走近了才把牌子上的字画出来（免得满屏都是字）
   * 注意：px / py 是屏幕坐标，player 是世界坐标 → 要把 cam 加回来再比 */
  const dx = px + 16 + cam.x - player.x, dy = py + 6 + cam.y - player.y;
  if(dx*dx + dy*dy > 260*260) return;
  const txt = townSignText(b);
  g.font = '12px ' + FONT_CJK;
  const w = g.measureText(txt).width;
  const bx = px + 16 - w/2 - 5, by = py - 15;
  g.fillStyle = 'rgba(8,10,16,0.86)'; g.fillRect(bx, by, w + 10, 18);
  g.strokeStyle = CONFIG.COLORS.hudBorder; g.strokeRect(bx, by, w + 10, 18);
  g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
  g.fillText(txt, bx + 5, by + 13);
}

/* 第 25 轮：门口挂牌三态 —— 营业中（绿）/ 休息中（灰）/ 外出中（黄） */
function drawTownDoorState(g, b, px, py){
  const K = CONFIG.TOWN.COLORS;
  const st = townDoorState(b);
  /* 小木牌 + 状态灯（远远地就能看出开没开） */
  g.fillStyle = K.signPost; g.fillRect(px+13, py+10, 6, 18);
  g.fillStyle = K.sign;    g.fillRect(px+4, py+2, 24, 11);
  g.fillStyle = st.color;  g.fillRect(px+6, py+4, 20, 7);
  /* 走近了才把状态写出来 */
  const dx = px + 16 + cam.x - player.x, dy = py + 6 + cam.y - player.y;
  if(dx*dx + dy*dy > 260*260) return;
  const txt = st.text;
  g.font = '12px ' + FONT_CJK;
  const w = g.measureText(txt).width;
  const bx = px + 16 - w/2 - 5, by = py - 15;
  g.fillStyle = 'rgba(8,10,16,0.86)'; g.fillRect(bx, by, w + 10, 18);
  g.strokeStyle = CONFIG.COLORS.hudBorder; g.strokeRect(bx, by, w + 10, 18);
  g.fillStyle = st.color; g.textAlign = 'left';
  g.fillText(txt, bx + 5, by + 13);
  g.textAlign = 'left';
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { drawTownProp, drawDoorTile, drawRoofs, drawTownSign, drawTownDoorState });
export { drawTownProp, drawDoorTile, drawRoofs, drawTownSign, drawTownDoorState };
