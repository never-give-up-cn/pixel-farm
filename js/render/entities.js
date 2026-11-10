/* js/render/entities.js —— 由 index.html 拆分，原行 3366–3440 */
'use strict';

/* --- 按 Y 排序的实体层：小屋 / 商店 / 作物 / 地图物件 / 建造物 / 玩家 ---
 * 排序键 = 脚底的 Y：站在后面的东西先画，站在前面的东西压在上面
 * 第 12 轮：作物和建造物一起进这张表（原来作物是单独一层，永远被树压着） */
function drawEntities(g, x0, y0, x1, y1){
  const list = [];
  if(typeof currentMap === 'undefined' || currentMap === 'valley'){
    list.push({y:(HOUSE_POS.y + HOUSE_POS.h)*TILE, f:()=>drawHouse(g, HOUSE_POS.x*TILE-cam.x, HOUSE_POS.y*TILE-cam.y)});
    /* 第 24 轮：商店不再是「摊位」，而是镇上能走进去的杂货店（屋顶是地砖，画在地面层） */
    /* 委托板（第 16 轮）：同样按脚点 Y 混进排序表 */
    list.push({y:(QUEST_BOARD.y + QUEST_BOARD.h)*TILE,
               f:()=>drawQuestBoard(g, QUEST_BOARD.x*TILE-cam.x, QUEST_BOARD.y*TILE-cam.y)});
    /* 农场 / 城镇入口方向牌 */
    if(typeof drawDirectionSign === 'function' && typeof FARM !== 'undefined'){
      const cx = (CONFIG.TOWN.CONNECTOR_X + 2)*TILE - cam.x;
      const fy = (FARM.y + FARM.h - 1)*TILE - cam.y;
      const ty = (CONFIG.TOWN.ROW + 1)*TILE - cam.y;
      if(cx > -TILE && cx < VIEW_W + TILE){
        if(fy > -TILE && fy < VIEW_H + TILE)
          list.push({y:(FARM.y + FARM.h)*TILE, f:()=>drawDirectionSign(g, cx, fy, '南边 · 城镇 ↓')});
        if(ty > -TILE && ty < VIEW_H + TILE)
          list.push({y:(CONFIG.TOWN.ROW + 2)*TILE, f:()=>drawDirectionSign(g, cx, ty, '北边 · 农场 ↑')});
      }
    }
  }
  /* 第 25 轮：镇上的家具已经进了 buildings（preset），跟着建造物一起排 Y */
  /* 门牌（第 24 轮）：说明主人在不在、去哪了 */
  for(const b of CONFIG.TOWN.LIST){
    const row = b.row || CONFIG.TOWN.ROOM_ROW;
    const sx = (b.x + CONFIG.TOWN.SIGN_DX)*TILE - cam.x;
    const sy = (row - 2)*TILE - cam.y;
    if(sx < -TILE || sx > VIEW_W || sy < -TILE || sy > VIEW_H) continue;
    list.push({y:(row - 2)*TILE + TILE, f:()=>drawTownSign(g, b, sx, sy)});
  }
  for(const b of buildings){
    const bx = b.tx*TILE - cam.x, by = b.ty*TILE - cam.y;
    if(bx < -TILE || bx > VIEW_W || by < -TILE || by > VIEW_H) continue;
    if(b.preset && b.flat) continue;      /* 地毯已经画在地面层了 */
    /* 柜台比别的家具矮一点（老板娘站在后面） */
    const sy = (b.preset && b.type === 'counter') ? b.ty*TILE + 4 : b.ty*TILE + TILE;
    list.push({y:sy, f:()=>drawBuilding(g,b,bx,by)});
  }
  /* 第 25 轮：门口挂牌三态（画在大门正上方一格） */
  for(const b of CONFIG.TOWN.LIST){
    const row = b.row || CONFIG.TOWN.ROOM_ROW;
    const sx = (b.x + CONFIG.TOWN.DOOR_DX)*TILE - cam.x;
    const sy = (row - 1)*TILE - cam.y;
    if(sx < -TILE || sx > VIEW_W || sy < -TILE || sy > VIEW_H) continue;
    list.push({y:(row - 1)*TILE, f:()=>drawTownDoorState(g, b, sx, sy)});
  }
  /* 新地图地标（房屋 / 塔 / 帐篷 / 矿井 / 栈桥…） */
  if(typeof worldLandmarks === 'function' && typeof drawWorldLandmark === 'function'){
    for(const l of worldLandmarks()){
      const lx = l.x*TILE - cam.x, ly = l.y*TILE - cam.y;
      if(lx > VIEW_W || lx + l.w*TILE < 0 || ly > VIEW_H || ly + l.h*TILE < 0) continue;
      list.push({y:(l.y + l.h)*TILE, f:()=>drawWorldLandmark(g, l)});
    }
  }
  /* NPC（居民）：按脚点 Y 混进同一张排序表（和玩家同一套约定：+12） */
  for(const d of CONFIG.NPC.LIST){
    const p = npcPos(d);
    if(!p) continue;
    if(npcHidden(d)) continue;        /* 第 24 轮：屋里的 NPC 只有进屋才看得见 */
    if(p.x - cam.x < -TILE || p.x - cam.x > VIEW_W || p.y - cam.y < -TILE || p.y - cam.y > VIEW_H) continue;
    /* 第 27 轮：睡着的 NPC 画在床上面（不然被子会把她盖住 → 晚上就看不见人了） */
    const sy = (p.type === 'sleep') ? p.y + 20 : p.y + 12;
    list.push({y:sy, f:()=>drawNpc(g, d, p.x, p.y)});
  }
  /* 动物（第 15 轮）：按脚点 y 混进同一张排序表；不参与玩家碰撞
   * 第 22 轮：animalNear() 每帧只算一次（原来每只动物都重算一遍 → O(n²)） */
  const nearAnimal = animalNear();
  if(typeof currentMap === 'undefined' || currentMap === 'valley'){
    for(const a of animals){
      if(a.x - cam.x < -TILE || a.x - cam.x > VIEW_W + TILE ||
         a.y - cam.y < -TILE || a.y - cam.y > VIEW_H + TILE) continue;
      list.push({y:a.y, f:()=>drawAnimal(g, a, nearAnimal)});
    }
  }
  /* 宠物（第 32 轮）：和玩家 / 动物同一套 Y 排序 */
  if((typeof currentMap === 'undefined' || currentMap === 'valley') &&
     typeof ensurePet === 'function' && typeof drawPetEntity === 'function'){
    const p = ensurePet();
    if(!(p.x - cam.x < -TILE || p.x - cam.x > VIEW_W + TILE ||
         p.y - cam.y < -TILE || p.y - cam.y > VIEW_H + TILE)){
      list.push({y:p.y, f:()=>drawPetEntity(g)});
    }
  }
  /* 作物 + 地图物件（树 / 岩石 / 野花）按格子的 Y 混进同一张表 */
  if(CONFIG.PERF.Y_SORT && x0 !== undefined){
    for(let ty=y0;ty<=y1;ty++){
      for(let tx=x0;tx<=x1;tx++){
        const i = ty*MAP_W+tx;
        const px = tx*TILE - cam.x, py = ty*TILE - cam.y;
        const c = crops[i];
        if(c) list.push({y:ty*TILE + TILE, f:()=>drawCrop(g, px, py, c)});
        const t = map[i];
        if(t === T.TREE)      list.push({y:ty*TILE + TILE, f:()=>drawTreeWithState(g, px, py, i)});
        else if(t === T.ROCK) list.push({y:ty*TILE + TILE, f:()=>drawRockWithState(g, px, py, i)});
        else if(t === T.FLOWER) list.push({y:ty*TILE + TILE, f:()=>drawFlowerWithState(g, px, py, i, (hash2(tx,ty)*3)|0)});
        /* 第 17 轮：节日装饰（走同一张 Y 排序表） */
        else if(t === T.FEST_BANNER)  list.push({y:ty*TILE + TILE, f:()=>drawFestBanner(g, px, py)});
        else if(t === T.FEST_STALL)   list.push({y:ty*TILE + TILE, f:()=>drawFestStall(g, px, py)});
        else if(t === T.FEST_LANTERN) list.push({y:ty*TILE + TILE, f:()=>drawFestLantern(g, px, py)});
      }
    }
  }
  list.push({y:player.y + BOX_OFF_Y + CONFIG.PLAYER.BOX_H/2, f:()=>(typeof drawPlayerAnim === 'function' ? drawPlayerAnim : drawPlayer)(g)});
  /* 地面掉落物 / 拾取飘字：按 Y 混进同一张排序表（第 31 轮） */
  if(typeof groundDrops !== 'undefined'){
    for(const d of groundDrops) list.push({y:d.y + 0.5, f:()=>drawGroundDrop(g, d)});
    for(const t of floatTexts) list.push({y:t.y + 0.6, f:()=>drawFloatText(g, t)});
  }
  list.sort((a,b)=>a.y - b.y);
  for(const e of list) e.f();
  if(typeof drawTreeChips === 'function') drawTreeChips(g);
  if(typeof drawHarvestFx === 'function') drawHarvestFx(g);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { drawEntities });
export { drawEntities };
