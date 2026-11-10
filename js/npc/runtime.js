/* js/npc/runtime.js —— 由 index.html 拆分，原行 7846–7953 */
'use strict';

/* --- 第 27 轮：NPC 连续移动 + 简易寻路（门是唯一的出入口） ---
 * 以前 NPC 的位置是「到点瞬间刷新」的坐标；现在多一份纯运行时的物理坐标：
 *   npcRuntime[id] = {x, y, dir, moving, animT, path, key, away, ready}
 * 逻辑位置（日程推出来的落脚点）还是唯一的「目的地」，物理位置负责走过去。
 * 跨房子必须先到门（门内侧 → 门外的街 → 另一扇门），不然会穿墙。
 * 运行时状态不进存档（读档 / 开新局都清空 → 下一次 tick 直接落在落脚点上）。 */
const npcRuntime = {};            /* id → 物理状态 */
function npcRuntimeClear(){
  for(const id in npcRuntime) delete npcRuntime[id];
}
/* 某个像素坐标属于哪栋房子（含墙 / 门格 —— 宽判定，和 playerRoomWide 同一套） */
function npcRoomIdAt(x, y){
  const tx = Math.floor(x/TILE), ty = Math.floor(y/TILE);
  const C = CONFIG.TOWN;
  for(const b of C.LIST){
    const row = b.row || C.ROOM_ROW;
    if(tx >= b.x && tx < b.x + b.w && ty >= row && ty < row + C.ROOM_H) return b.id;
  }
  return null;
}
/* 门的三个落脚点：门外侧（街上）+ 门内侧（门格）+ 再往屋里一格
 * 多加「屋里那一格」是为了不让斜线贴着墙角拐过去（否则会蹭到后墙） */
function npcDoorPoints(bid){
  const b = CONFIG.TOWN.LIST.find(x => x.id === bid);
  if(!b) return null;
  const C = CONFIG.TOWN;
  const row = b.row || C.ROOM_ROW;
  const dx = b.x + C.DOOR_DX;
  let iy = row + 1;
  for(let k=0;k<3;k++){
    const y = row + 1 + k;
    iy = y;
    if(!isSolid(dx, y)) break;
  }
  return {inside:{x:(dx + 0.5)*TILE, y:(row + 0.5)*TILE},
          inner:{x:(dx + 0.5)*TILE, y:(iy + 0.5)*TILE},
          outside:{x:(dx + 0.5)*TILE, y:(row - 0.5)*TILE}};
}
/* 逻辑落脚点（像素坐标）：日程 / 节日赶集 / 来访农场都算进来 */
function npcLogicalTarget(d){
  const w = npcWhere(d);
  if(!w || w.x === null || w.x === undefined) return null;
  return {x:(w.x + 0.5)*TILE, y:(w.y + 0.5)*TILE, tx:w.x, ty:w.y,
          at:w.at, label:w.label, type:w.type, key:w.x + ',' + w.y};
}
/* 寻路：起点 / 终点在不同房子里 → 必须走门（门 → 街 → 门）
 * 四排住宅之间还要沿南北主路走，不能斜穿房子。 */
function buildNpcPath(sx, sy, tx, ty){
  const C = CONFIG.TOWN;
  const sBid = npcRoomIdAt(sx, sy), eBid = npcRoomIdAt(tx, ty);
  const path = [];
  if(sBid && sBid !== eBid){
    const dp = npcDoorPoints(sBid);
    if(dp){ path.push(dp.inner); path.push(dp.inside); path.push(dp.outside); }
  }
  const sRow = sBid ? ((CONFIG.TOWN.LIST.find(b => b.id === sBid) || {}).row || C.ROOM_ROW) - 1 : Math.floor(sy/TILE);
  const eRow = eBid ? ((CONFIG.TOWN.LIST.find(b => b.id === eBid) || {}).row || C.ROOM_ROW) - 1 : Math.floor(ty/TILE);
  const streets = C.STREET_ROWS || [C.STREET_ROW];
  const isStreet = (y) => streets.indexOf(y) >= 0;
  let via1 = isStreet(sRow) ? sRow : null;
  let via2 = isStreet(eRow) ? eRow : null;
  if(via1 && !via2 && Math.floor(ty/TILE) < C.ROW) via2 = streets[0];
  if(!via1 && via2 && Math.floor(sy/TILE) < C.ROW) via1 = streets[0];
  if(via1 !== null && via2 !== null && via1 !== via2){
    const cx = (C.CONNECTOR_X + 0.5) * TILE;
    path.push({x:cx, y:(via1 + 0.5)*TILE});
    path.push({x:cx, y:(via2 + 0.5)*TILE});
  }
  if(eBid && eBid !== sBid){
    const dp = npcDoorPoints(eBid);
    if(dp){ path.push(dp.outside); path.push(dp.inside); path.push(dp.inner); }
  }
  path.push({x:tx, y:ty});
  return path;
}
/* 取（必要时建好）某个 NPC 的运行时状态；第一次建好时直接落在逻辑落脚点上 */
function npcRuntimeOf(d){
  let rt = npcRuntime[d.id];
  if(!rt){
    rt = {x:0, y:0, dir:0, moving:false, animT:0, path:[], key:null, away:true, ready:false};
    npcRuntime[d.id] = rt;
  }
  if(!rt.ready){
    rt.ready = true;
    const t = npcLogicalTarget(d);
    if(t){ rt.x = t.x; rt.y = t.y; rt.key = t.key; rt.away = false; }
  }
  return rt;
}
/* 每帧推进 NPC：朝逻辑落脚点走（跨屋先走到门） */
function updateNpcs(dt){
  const speed = CONFIG.NPC.SPEED || 50;
  for(const d of CONFIG.NPC.LIST){
    const rt = npcRuntimeOf(d);
    const t = npcLogicalTarget(d);
    if(!t){ rt.moving = false; rt.away = true; rt.path.length = 0; continue; }
    /* 从「不在镇上」回来 → 直接出现在落脚点（不用横穿全镇） */
    if(rt.away){
      rt.away = false;
      rt.x = t.x; rt.y = t.y; rt.key = t.key;
      rt.path.length = 0; rt.moving = false;
      continue;
    }
    const far = Math.hypot(t.x - rt.x, t.y - rt.y);
    if(rt.key !== t.key || (!rt.path.length && far > 4)){
      rt.key = t.key;
      rt.path = buildNpcPath(rt.x, rt.y, t.x, t.y);
    }
    if(!rt.path.length){ rt.moving = false; continue; }
    const wp = rt.path[0];
    const dx = wp.x - rt.x, dy = wp.y - rt.y;
    const dist = Math.hypot(dx, dy);
    if(dist > 1.5){
      rt.moving = true;
      const step = Math.min(dist, speed * dt);
      rt.x += dx / dist * step;
      rt.y += dy / dist * step;
      rt.dir = (Math.abs(dx) > Math.abs(dy)) ? (dx > 0 ? 2 : 1) : (dy > 0 ? 0 : 3);
      rt.animT += dt;
    }else{
      rt.x = wp.x; rt.y = wp.y;
      rt.path.shift();
      rt.moving = rt.path.length > 0;
    }
  }
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcRuntime, npcRuntimeClear, npcRoomIdAt, npcDoorPoints, npcLogicalTarget, buildNpcPath, npcRuntimeOf, updateNpcs });
export { npcRuntime, npcRuntimeClear, npcRoomIdAt, npcDoorPoints, npcLogicalTarget, buildNpcPath, npcRuntimeOf, updateNpcs };
