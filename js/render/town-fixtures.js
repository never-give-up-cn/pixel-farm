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
    case 'display':                     /* 博物馆展柜 */
      g.fillStyle = '#5b3a1d'; g.fillRect(px+5, py+24, 22, 4);
      g.fillStyle = 'rgba(150,200,230,.30)'; g.fillRect(px+4, py+5, 24, 21);
      g.fillStyle = '#9ec4d8'; g.fillRect(px+6, py+7, 20, 15);
      g.fillStyle = '#e2c14a'; g.fillRect(px+13, py+13, 6, 6);
      g.fillStyle = '#5b3a1d'; g.fillRect(px+4, py+5, 24, 2); g.fillRect(px+4, py+24, 24, 2);
      break;
    case 'crate':                       /* Joja 货箱 */
      g.fillStyle = '#4f6d8a'; g.fillRect(px+5, py+7, 22, 21);
      g.fillStyle = '#7a9ab0'; g.fillRect(px+7, py+5, 18, 21);
      g.fillStyle = '#e8dcc0'; g.fillRect(px+10, py+11, 12, 5);
      g.fillStyle = '#4f6d8a'; g.fillRect(px+7, py+15, 18, 2);
      break;
    case 'jukebox':                     /* 酒馆点唱机 */
      g.fillStyle = '#5b3a1d'; g.fillRect(px+6, py+4, 20, 25);
      g.fillStyle = '#b3443c'; g.fillRect(px+8, py+6, 16, 17);
      g.fillStyle = '#e2c14a'; g.fillRect(px+10, py+9, 12, 5);
      g.fillStyle = '#9ec4d8'; g.fillRect(px+10, py+16, 12, 5);
      break;
    case 'clinic_bed':                  /* 诊所病床 */
      g.fillStyle = '#c8d0d8'; g.fillRect(px+4, py+9, 24, 18);
      g.fillStyle = '#f4f7fa'; g.fillRect(px+6, py+6, 20, 10);
      g.fillStyle = '#c05a72'; g.fillRect(px+7, py+16, 18, 6);
      g.fillStyle = '#9aa1a9'; g.fillRect(px+5, py+25, 22, 3);
      break;
    case 'medcab':                      /* 药柜 */
      g.fillStyle = '#d8e0e8'; g.fillRect(px+6, py+5, 20, 24);
      g.fillStyle = '#9aa1a9'; g.fillRect(px+6, py+5, 20, 2); g.fillRect(px+6, py+17, 20, 2);
      g.fillStyle = '#c05a3a'; g.fillRect(px+14, py+9, 4, 12); g.fillRect(px+10, py+13, 12, 4);
      break;
    case 'anvil':                       /* 铁砧 */
      g.fillStyle = '#4a4a55'; g.fillRect(px+7, py+6, 18, 9);
      g.fillStyle = '#6a6a75'; g.fillRect(px+9, py+8, 14, 5);
      g.fillStyle = '#3a3a44'; g.fillRect(px+12, py+15, 8, 13);
      break;
    case 'fish_tank':                   /* 鱼缸 */
      g.fillStyle = '#4f8fbf'; g.fillRect(px+4, py+6, 24, 22);
      g.fillStyle = 'rgba(150,220,240,.55)'; g.fillRect(px+6, py+8, 20, 17);
      g.fillStyle = '#e08a2a'; g.fillRect(px+10, py+14, 6, 3);
      g.fillStyle = '#9aa1a9'; g.fillRect(px+4, py+27, 24, 3);
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
    const facadeH = 32;                     /* 临街那一格画成可见的墙面 + 门窗 */
    const roofY = sy + facadeH;
    const roofH = sh - facadeH;
    g.globalAlpha = alpha;

    /* 1) 临街墙面：让房子从“一块橙色屋顶”变成能认出来的房子 */
    g.fillStyle = shop ? '#6f7f92' : K.wall;
    g.fillRect(sx, sy, sw, facadeH);
    g.fillStyle = shop ? '#5c6a7a' : K.wallLine;
    g.fillRect(sx, sy + facadeH - 4, sw, 4);
    g.fillRect(sx, sy, 4, facadeH);
    g.fillRect(sx + sw - 4, sy, 4, facadeH);
    /* 墙面横纹 */
    for(let yy = sy + 8; yy < sy + facadeH - 5; yy += 9){
      g.fillStyle = shop ? 'rgba(30,42,56,.22)' : 'rgba(60,36,20,.16)';
      g.fillRect(sx + 5, yy, sw - 10, 1);
    }
    /* 窗户：门两侧各一扇 */
    const winY = sy + 8, winW = 18, winH = 13;
    for(const wx of [sx + 28, sx + sw - 46]){
      g.fillStyle = '#4a5a6a'; g.fillRect(wx - 2, winY - 2, winW + 4, winH + 4);
      g.fillStyle = shop ? '#9ec8e8' : '#9ec4d8'; g.fillRect(wx, winY, winW, winH);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(wx + 2, winY + 2, 5, 4);
      g.fillStyle = '#4a5a6a'; g.fillRect(wx + winW/2 - 1, winY, 2, winH);
      g.fillRect(wx, winY + winH/2 - 1, winW, 2);
    }
    /* 门口：墙面中间 */
    drawDoorTile(g, (b.x + C.DOOR_DX)*TILE - cam.x, sy);

    /* 2) 屋顶：从临街墙面后面一直盖到南墙 */
    g.fillStyle = shop ? K.roofShop : K.roofHouse;
    g.fillRect(sx, roofY, sw, roofH);
    /* 瓦片横纹 */
    g.fillStyle = shop ? K.roofShopLine : K.roofHouseLine;
    for(let yy = roofY + 10; yy < sy + sh - 8; yy += R.TILE_H) g.fillRect(sx + 4, yy, sw - 8, 2);
    /* 竖缝：把一排长屋顶切成独立屋 */
    g.fillStyle = 'rgba(80,40,20,.20)';
    for(let xx = sx + 24; xx < sx + sw - 8; xx += 32) g.fillRect(xx, roofY + 4, 1, roofH - 10);
    /* 屋脊 / 屋檐 */
    g.fillStyle = K.roofRidge; g.fillRect(sx, roofY, sw, 6);
    g.fillStyle = K.roofEave;  g.fillRect(sx, sy + sh - 6, sw, 6);
    g.strokeStyle = K.roofEave; g.lineWidth = 1;
    g.strokeRect(sx + 0.5, roofY + 0.5, sw - 1, roofH - 1);

    /* 3) 烟囱：商店和每隔几栋房子 */
    if(R.CHIMNEY && (shop || (b.x % 4 === 0))){
      const cx = sx + sw - 46;
      g.fillStyle = K.roofEave;   g.fillRect(cx, roofY + 16, 14, 20);
      g.fillStyle = K.roofRidge;  g.fillRect(cx - 2, roofY + 12, 18, 5);
    }
    g.globalAlpha = 1;
  }
}
/* 路牌：给农场 / 城镇入口做方向提示 */
function drawDirectionSign(g, px, py, text){
  const K = CONFIG.TOWN.COLORS;
  g.fillStyle = K.signPost; g.fillRect(px + 14, py + 12, 4, 20);
  g.fillStyle = K.sign;     g.fillRect(px + 2, py + 2, 28, 12);
  g.fillStyle = K.signText; g.fillRect(px + 5, py + 6, 22, 4);
  const dx = px + 16 + cam.x - player.x, dy = py + 6 + cam.y - player.y;
  if(dx*dx + dy*dy > 240*240) return;
  g.font = '12px ' + FONT_CJK;
  const w = g.measureText(text).width;
  const bx = px + 16 - w/2 - 5, by = py - 15;
  g.fillStyle = 'rgba(8,10,16,0.86)'; g.fillRect(bx, by, w + 10, 18);
  g.strokeStyle = CONFIG.COLORS.hudBorder; g.strokeRect(bx, by, w + 10, 18);
  g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
  g.fillText(text, bx + 5, by + 13);
  g.textAlign = 'left';
}


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
Object.assign(window, { drawTownProp, drawDoorTile, drawRoofs, drawTownSign, drawTownDoorState, drawDirectionSign });
export { drawTownProp, drawDoorTile, drawRoofs, drawTownSign, drawTownDoorState, drawDirectionSign };
