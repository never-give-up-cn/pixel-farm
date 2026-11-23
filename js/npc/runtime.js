/* js/npc/runtime.js —— 由 index.html 拆分，原行 7846–7953 */
'use strict';

/* --- 第 27 轮：NPC 连续移动 + 简易寻路（门是唯一的出入口） ---
 * 以前 NPC 的位置是「到点瞬间刷新」的坐标；现在多一份纯运行时的物理坐标：
 *   npcRuntime[id] = {x, y, dir, moving, animT, path, key, away, ready}
 * 逻辑位置（日程推出来的落脚点）还是唯一的「目的地」，物理位置负责走过去。
 * 跨房子必须先到门（门内侧 → 门外的街 → 另一扇门），不然会穿墙。
 * 运行时状态不进存档（读档 / 开新局都清空 → 下一次 tick 直接落在落脚点上）。 */
const npcRuntime = {};            /* id → 物理状态 */
let npcMapGraphCache = null;
let npcRouteCache = {};
function npcRuntimeClear(){
  for(const id in npcRuntime) delete npcRuntime[id];
  npcMapGraphCache = null;
  npcRouteCache = {};
}
/* 某个像素坐标属于哪栋房子（含墙 / 门格 —— 宽判定，和 playerRoomWide 同一套） */
function townListForMap(mapId){
  const st = window.MAP_WORLD && MAP_WORLD[mapId];
  if(st) return st.townList || [];
  return mapId === 'valley' ? CONFIG.TOWN.LIST : [];
}
function npcRoomIdAt(x, y, mapId){
  mapId = mapId || 'valley';
  if(mapId !== 'valley') return null;
  const tx = Math.floor(x/TILE), ty = Math.floor(y/TILE);
  const C = CONFIG.TOWN;
  for(const b of townListForMap(mapId)){
    const row = b.row || C.ROOM_ROW;
    if(tx >= b.x && tx < b.x + b.w && ty >= row && ty < row + C.ROOM_H) return b.id;
  }
  return null;
}
/* 门的三个落脚点：门外侧（街上）+ 门内侧（门格）+ 再往屋里一格 */
function npcDoorPoints(bid, mapId){
  mapId = mapId || 'valley';
  const b = townListForMap(mapId).find(x => x.id === bid);
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
  const map = w.map || 'valley';
  return {x:(w.x + 0.5)*TILE, y:(w.y + 0.5)*TILE, tx:w.x, ty:w.y, map:map,
          at:w.at, label:w.label, type:w.type, key:map + ',' + w.x + ',' + w.y};
}
/* ================= 第 41 轮：NPC 跨地图旅行 =================
 * 日程只给「目标地图 + 目标点」。NPC 先走到当前地图的出口，
 * 切到下一张地图，再继续走；这样地图总览里能看到他们真的在移动。 */
function npcMapState(mapId){
  if(typeof ensureWorld === 'function') return ensureWorld(mapId);
  return (window.MAP_WORLD && MAP_WORLD[mapId]) || null;
}
function npcSolidOnMap(mapId, tx, ty){
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  const st = npcMapState(mapId);
  if(!st || !st.map) return true;
  const i = ty * MAP_W + tx;
  const t = st.map[i];
  if(t === T.TREE || t === T.ROCK || t === T.WATER || t === T.HOUSE || t === T.SHOP ||
     t === T.BLD || t === T.WALL || t === T.WALL_FRONT || t === T.WALL_BACK) return true;
  const bi = st.buildIndex ? st.buildIndex[i] : -1;
  if(bi >= 0){
    const b = st.buildings && st.buildings[bi];
    if(b){
      if(b.preset){ if(b.solid) return true; }
      else {
        const r = (typeof buildRecipe === 'function') ? buildRecipe(b.type) : null;
        if(r && r.solid) return true;
      }
    }
  }
  if(Array.isArray(st.landmarks)){
    for(const l of st.landmarks){
      if(l.solid === false) continue;
      if(tx >= l.x && tx < l.x + l.w && ty >= l.y && ty < l.y + l.h) return true;
    }
  }
  return false;
}
function npcNearestFreeOnMap(mapId, tx, ty, maxR){
  if(!npcSolidOnMap(mapId, tx, ty)) return {x:tx, y:ty};
  for(let r=1; r<=(maxR||4); r++)
    for(let dy=-r; dy<=r; dy++)
      for(let dx=-r; dx<=r; dx++){
        if(Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = tx + dx, y = ty + dy;
        if(x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        if(!npcSolidOnMap(mapId, x, y)) return {x:x, y:y};
      }
  return null;
}
/* 地图内 BFS 路径：返回像素坐标路点（不含起点，含终点）。 */
function npcPathOnMap(mapId, sxPx, syPx, targetPx, targetPy){
  let sx = Math.floor(sxPx / TILE), sy = Math.floor(syPx / TILE);
  let tx = Math.floor(targetPx / TILE), ty = Math.floor(targetPy / TILE);
  const start = npcNearestFreeOnMap(mapId, sx, sy, 3);
  if(start){ sx = start.x; sy = start.y; }
  const end = npcNearestFreeOnMap(mapId, tx, ty, 5);
  const endFree = end || {x:tx, y:ty};
  const N = MAP_W * MAP_H;
  const prev = new Int32Array(N).fill(-2);
  const q = new Int32Array(N);
  let head = 0, tail = 0;
  const sIdx = sy * MAP_W + sx, gIdx = endFree.y * MAP_W + endFree.x;
  prev[sIdx] = -1; q[tail++] = sIdx;
  const dxs = [1, -1, 0, 0], dys = [0, 0, 1, -1];
  while(head < tail){
    const cur = q[head++];
    if(cur === gIdx) break;
    const cx = cur % MAP_W, cy = (cur / MAP_W) | 0;
    for(let k=0;k<4;k++){
      const nx = cx + dxs[k], ny = cy + dys[k];
      if(nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      const ni = ny * MAP_W + nx;
      if(prev[ni] !== -2) continue;
      if(npcSolidOnMap(mapId, nx, ny)) continue;
      prev[ni] = cur;
      q[tail++] = ni;
    }
  }
  if(prev[gIdx] === -2 && gIdx !== sIdx) return [{x:targetPx, y:targetPy}];
  const rev = [];
  let n = gIdx;
  while(n !== -1){
    rev.push({x: (n % MAP_W + 0.5) * TILE, y: (((n / MAP_W) | 0) + 0.5) * TILE});
    n = prev[n];
  }
  rev.reverse();
  if(start) rev.unshift({x:(start.x + 0.5)*TILE, y:(start.y + 0.5)*TILE});
  /* 目标如果是家具 / 床这类实心格，最后再补一次真实目标点 */
  if(endFree.x !== tx || endFree.y !== ty) rev.push({x:targetPx, y:targetPy});
  return rev;
}
function npcBuildMapEdges(){
  if(npcMapGraphCache) return npcMapGraphCache;
  const edges = [];
  const ids = Object.keys(MAP_DEFS || {});
  for(const id of ids){
    const st = npcMapState(id);
    if(!st || !Array.isArray(st.exits)) continue;
    for(const e of st.exits){
      if(!MAP_DEFS[e.to]) continue;
      edges.push({
        from:id, to:e.to,
        fx:e.x + Math.floor((e.w || 1) / 2), fy:e.y,
        tx:e.tx, ty:e.ty
      });
    }
  }
  /* 可进入住宅的门口 ↔ 室内门 */
  for(const iid in (typeof INTERIORS !== 'undefined' ? INTERIORS : {})){
    const I = INTERIORS[iid];
    if(!I || !I.room || !I.outMap) continue;
    const doorX = I.room.x + Math.floor(I.room.w / 2);
    const doorY = I.room.y + I.room.h - 1;
    edges.push({from:I.outMap, to:iid, fx:I.outX, fy:I.outY, tx:doorX, ty:doorY - 2});
    edges.push({from:iid, to:I.outMap, fx:doorX, fy:doorY, tx:I.outX, ty:I.outY});
  }
  npcMapGraphCache = edges;
  return edges;
}
function npcFindRoute(from, to){
  if(from === to) return [];
  const key = from + '>' + to;
  if(npcRouteCache[key]) return npcRouteCache[key];
  const edges = npcBuildMapEdges();
  const adj = {};
  for(const e of edges) (adj[e.from] || (adj[e.from] = [])).push(e);
  const prev = {}, seen = {};
  const q = [from];
  seen[from] = true;
  while(q.length){
    const cur = q.shift();
    if(cur === to){
      const route = [];
      let n = to;
      while(n !== from){
        const e = prev[n];
        if(!e) return null;
        route.unshift(e);
        n = e.from;
      }
      npcRouteCache[key] = route;
      return route;
    }
    for(const e of (adj[cur] || [])){
      if(seen[e.to]) continue;
      seen[e.to] = true;
      prev[e.to] = e;
      q.push(e.to);
    }
  }
  npcRouteCache[key] = null;
  return null;
}
/* 沿 rt.path 走一步；返回是否移动。 */
function npcStepPath(rt, speed, dt){
  if(!rt.path || !rt.path.length){ rt.moving = false; return false; }
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
    return true;
  }
  rt.x = wp.x; rt.y = wp.y;
  rt.path.shift();
  rt.moving = rt.path.length > 0;
  return true;
}

function buildNpcPath(sx, sy, tx, ty, mapId){
  mapId = mapId || 'valley';
  if(mapId !== 'valley') return npcPathOnMap(mapId, sx, sy, tx, ty);
  const C = CONFIG.TOWN;
  const sBid = npcRoomIdAt(sx, sy, mapId), eBid = npcRoomIdAt(tx, ty, mapId);
  const path = [];
  if(sBid && sBid !== eBid){
    const dp = npcDoorPoints(sBid, mapId);
    if(dp){ path.push(dp.inner); path.push(dp.inside); path.push(dp.outside); }
  }
  const sRow = sBid ? ((townListForMap(mapId).find(b => b.id === sBid) || {}).row || C.ROOM_ROW) - 1 : Math.floor(sy/TILE);
  const eRow = eBid ? ((townListForMap(mapId).find(b => b.id === eBid) || {}).row || C.ROOM_ROW) - 1 : Math.floor(ty/TILE);
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
    const dp = npcDoorPoints(eBid, mapId);
    if(dp){ path.push(dp.outside); path.push(dp.inside); path.push(dp.inner); }
  }
  path.push({x:tx, y:ty});
  return path;
}
/* 取（必要时建好）某个 NPC 的运行时状态；第一次建好时直接落在逻辑落脚点上 */
function npcRuntimeOf(d){
  let rt = npcRuntime[d.id];
  if(!rt){
    rt = {x:0, y:0, dir:0, moving:false, animT:0, path:[], key:null, away:true, ready:false, map:'valley',
          route:null, routeKey:null, routeIdx:0, routeSrc:null};
    npcRuntime[d.id] = rt;
  }
  if(!rt.ready){
    rt.ready = true;
    const t = npcLogicalTarget(d);
    if(t){ rt.x = t.x; rt.y = t.y; rt.key = t.key; rt.map = t.map; rt.away = false; }
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
    /* 跨地图：先走到出口，切地图，再继续走向目标地图 */
    if(rt.away){
      rt.away = false;
      rt.map = t.map; rt.x = t.x; rt.y = t.y; rt.key = t.key;
      rt.path.length = 0; rt.moving = false;
      continue;
    }
    if(rt.map !== t.map){
      const routeKey = t.map;
      if(!rt.route || rt.routeKey !== routeKey){
        rt.route = npcFindRoute(rt.map, t.map);
        rt.routeKey = routeKey;
        rt.routeIdx = 0;
        rt.routeSrc = null;
        rt.path.length = 0;
      }
      if(!rt.route || !rt.route.length){
        /* 找不到步行路线 → 保持旧行为直接落到目标点（兜底） */
        rt.map = t.map; rt.x = t.x; rt.y = t.y; rt.key = t.key;
        rt.path.length = 0; rt.moving = false;
        rt.route = null; rt.routeKey = null; rt.away = false;
        continue;
      }
      const edge = rt.route[rt.routeIdx];
      if(!edge){
        rt.map = t.map; rt.x = t.x; rt.y = t.y; rt.key = t.key;
        rt.path.length = 0; rt.moving = false;
        rt.route = null; rt.routeKey = null;
        continue;
      }
      const srcPx = (edge.fx + 0.5) * TILE, srcPy = (edge.fy + 0.5) * TILE;
      if(Math.hypot(rt.x - srcPx, rt.y - srcPy) < 4){
        rt.map = edge.to;
        rt.x = (edge.tx + 0.5) * TILE;
        rt.y = (edge.ty + 0.5) * TILE;
        rt.key = null;
        rt.path.length = 0;
        rt.moving = false;
        rt.routeIdx++;
        rt.routeSrc = null;
        if(rt.routeIdx >= rt.route.length){ rt.route = null; rt.routeKey = null; }
        continue;
      }
      const srcKey = edge.from + '@' + edge.fx + ',' + edge.fy;
      if(rt.routeSrc !== srcKey || !rt.path.length){
        rt.routeSrc = srcKey;
        rt.path = npcPathOnMap(rt.map, rt.x, rt.y, srcPx, srcPy);
        if(!rt.path.length) rt.path = [{x:srcPx, y:srcPy}];
      }
      npcStepPath(rt, speed, dt);
      continue;
    }
    rt.away = false;
    rt.route = null; rt.routeKey = null; rt.routeSrc = null;
    const far = Math.hypot(t.x - rt.x, t.y - rt.y);
    if(rt.key !== t.key || (!rt.path.length && far > 4)){
      rt.key = t.key;
      rt.path = buildNpcPath(rt.x, rt.y, t.x, t.y, rt.map);
    }
    if(!rt.path.length){ rt.moving = false; continue; }
    npcStepPath(rt, speed, dt);
  }
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcRuntime, npcRuntimeClear, npcRoomIdAt, npcDoorPoints, npcLogicalTarget, buildNpcPath, npcRuntimeOf, updateNpcs });
export { npcRuntime, npcRuntimeClear, npcRoomIdAt, npcDoorPoints, npcLogicalTarget, buildNpcPath, npcRuntimeOf, updateNpcs };
