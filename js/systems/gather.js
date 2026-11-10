/* js/systems/gather.js —— 由 index.html 拆分，原行 9363–9470 */
'use strict';

/* === 12.野外采集（第 14 轮） === */
/* 采集物是地图上的新地块类型（11/12/13）：长在草地上、不挡路，按 E 采走。
 * 刷新写进 map diff，存档后仍然存在；每 3 天（季内 1/4/7/…/28 天）清掉旧的、重新刷 6 株。 */
const GATHER_ITEM_BY_TILE = {};
for(const t of CONFIG.GATHER.TYPES) GATHER_ITEM_BY_TILE[t.tile] = t.item;
function isGatherTile(t){ return !!GATHER_ITEM_BY_TILE[t]; }
/* 近处可采集的那一株（取最近） */
function gatherNear(){
  const px = Math.floor(player.x/TILE), py = Math.floor(player.y/TILE);
  const R = Math.ceil(CONFIG.GATHER.RANGE);
  let best = null, bd = CONFIG.GATHER.RANGE;
  for(let ty=py-R; ty<=py+R; ty++) for(let tx=px-R; tx<=px+R; tx++){
    if(tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) continue;
    const item = GATHER_ITEM_BY_TILE[map[ty*MAP_W+tx]];
    if(!item) continue;
    const d = tileCenterDist(tx,ty);
    if(d <= bd){ bd = d; best = {tx:tx, ty:ty, item:item, def:itemDef(item)}; }
  }
  return best;
}
/* 采一株：进背包 + 点图鉴 + 地块恢复成草地 */
function pickGather(tx, ty){
  if(tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) return false;
  const i = ty*MAP_W + tx;
  const item = GATHER_ITEM_BY_TILE[map[i]];
  if(!item) return false;
  if(tileCenterDist(tx,ty) > CONFIG.GATHER.RANGE){ toast('走近一点再采'); return false; }
  const d = itemDef(item);
  if(!canFit(item, 1)){ toast('背包满了，装不下' + (d ? d.name : '采集物')); return false; }
  addItem(item, 1);
  setTile(i, T.GRASS);
  const idx = CONFIG.GATHER.TYPES.findIndex(t => t.item === item);
  dexUnlock('gather', idx);
  toast('采到了 ' + (d ? d.name : item) + ' ×1');
  playSfx(659, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  return true;
}
/* 清掉地图上旧的采集物（恢复成草地；如果原本就是草地，diff 会自动消失） */
function clearGatherTiles(){
  let n = 0;
  for(let i=0;i<map.length;i++){
    if(isGatherTile(map[i])){ setTile(i, T.GRASS); n++; }
  }
  return n;
}
/* 在农田周围半径内找干净草地刷采集物；避开作物 / 建造物 / 石板路 / 玩家 / 建筑与 NPC */
function spawnGather(quiet){
  if(!CONFIG.GATHER.ENABLED) return 0;
  if(typeof currentMap !== 'undefined' && currentMap !== 'valley') return 0;
  const season = seasonName();
  const types = CONFIG.GATHER.TYPES.filter(t => t.seasons.indexOf(season) >= 0);
  if(!types.length){ clearGatherTiles(); return 0; }
  clearGatherTiles();
  const G = CONFIG.GATHER;
  const cx = FARM.x + FARM.w / 2, cy = FARM.y + FARM.h / 2;
  let placed = 0;
  for(let attempt=0; attempt<900 && placed<G.COUNT; attempt++){
    const tx = Math.round(cx + (Math.random()*2 - 1) * G.RADIUS);
    const ty = Math.round(cy + (Math.random()*2 - 1) * G.RADIUS);
    if(tx < 1 || ty < 1 || tx >= MAP_W-1 || ty >= MAP_H-1) continue;
    const i = ty*MAP_W + tx;
    if(map[i] !== T.GRASS) continue;                 /* 只长在草地上 */
    if(crops[i]) continue;                           /* 不和作物冲突 */
    if(buildIndex[i] >= 0 || roads[i]) continue;     /* 不和建造物 / 石板路冲突 */
    if(tileCenterDist(tx,ty) < 3) continue;          /* 不要刷在玩家脚下 */
    /* 避开小屋 / 商店 / 各个 NPC 的定点，免得 E 键互相打架 */
    const inRect = (r, x, y) => x >= r.x-1 && x <= r.x+r.w && y >= r.y-1 && y <= r.y+r.h;
    let blocked = inRect(HOUSE_POS, tx, ty) || inRect(SHOP_POS, tx, ty);
    if(!blocked){
      for(const d of CONFIG.NPC.LIST){
        for(const s of d.sched){
          if(Math.abs(s.x - tx) <= 2 && Math.abs(s.y - ty) <= 2){ blocked = true; break; }
        }
        if(blocked) break;
      }
    }
    if(blocked) continue;
    const tp = types[(Math.random() * types.length) | 0];
    setTile(i, tp.tile);
    placed++;
  }
  if(placed && sessionActive && !quiet) toast('草地上长出了新的采集物');
  return placed;
}
/* 新的一天：按 CONFIG.GATHER.EVERY_DAYS 在季内周期性刷新 */
function gatherDayStart(){
  const seasonDay = ((clock.day - 1) % CONFIG.DAYS_PER_SEASON) + 1;
  if(seasonDay % Math.max(1, CONFIG.GATHER.EVERY_DAYS) === 1) return spawnGather();
  return 0;
}
/* 采集物绘制（不参与 Y 排序，画在实体之前） */
function drawGathers(g, x0, y0, x1, y1){
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  for(let ty=y0; ty<=y1; ty++){
    for(let tx=x0; tx<=x1; tx++){
      const item = GATHER_ITEM_BY_TILE[map[ty*MAP_W+tx]];
      if(!item) continue;
      const d = itemDef(item);
      const x = tx*TILE - cam.x, y = ty*TILE - cam.y;
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect(x + 10, y + 24, 12, 3);
      g.font = '17px ' + FONT_EMOJI;
      g.fillStyle = '#fff';
      g.fillText(d ? d.icon : '？', x + TILE/2, y + 24);
    }
  }
  g.textAlign = 'left'; g.textBaseline = 'top';
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { GATHER_ITEM_BY_TILE, isGatherTile, gatherNear, pickGather, clearGatherTiles, spawnGather, gatherDayStart, drawGathers });
export { GATHER_ITEM_BY_TILE, isGatherTile, gatherNear, pickGather, clearGatherTiles, spawnGather, gatherDayStart, drawGathers };
