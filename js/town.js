/* js/town.js —— 由 index.html 拆分，原行 7989–8139 */
'use strict';

/* ================= 第 24 轮：城镇 =================
 * 原则 A：建筑是地图的容器，不是场景（没有「当前场景」这个变量）
 * 原则 B：NPC 的位置是时间的纯函数（天数, 小时, 天气, NPC id）→ 他在哪、在干嘛
 * 原则 C：玩家的「扑空」必须可解释 → 门口的牌子写清楚他去哪了
 */
/* 镇上的建筑（按 id / 种类 / 主人找） */
function townBuilding(id){ return CONFIG.TOWN.LIST.find(b => b.id === id) || null; }
function townShopBuilding(){ return CONFIG.TOWN.LIST.find(b => b.kind === 'shop') || null; }
function townHomeBuilding(npcId){ return CONFIG.TOWN.LIST.find(b => b.kind === 'house' && (b.npc === npcId || (b.residents || []).indexOf(npcId) >= 0)) || null; }
/* 第 25 轮：静态建筑定义（不存档） */
function buildingDef(id){ return BUILDING_DEFS.find(b => b.id === id) || null; }
/* 盖一栋房子：外墙（前墙 / 后墙）+ 屋里的门 + 地板 + 家具
 * withFixtures = false 时只改地图（genTown 用；家具另外在 newGame / 读档后补） */
function stampBuilding(def, withFixtures){
  if(!def) return false;
  const C = CONFIG.TOWN;
  const row = def.row || C.ROOM_ROW;
  for(let y=row;y<row+C.ROOM_H;y++)
    for(let x=def.x;x<def.x+def.w;x++)
      map[y*MAP_W+x] = (y === row + C.ROOM_H - 1) ? T.WALL_FRONT : T.WALL_BACK;
  for(let y=row+1;y<row+C.ROOM_H-1;y++)
    for(let x=def.x+1;x<def.x+def.w-1;x++) map[y*MAP_W+x] = T.FLOOR;
  map[row*MAP_W + def.x + C.DOOR_DX] = T.DOOR;             /* 屋里的门：踩上去回街上 */
  if(withFixtures !== false) stampFixtures(def);
  return true;
}
/* 家具推进 buildings / buildIndex —— 结构和玩家盖的房子一模一样（只是 preset:true） */
function stampFixtures(def){
  if(!def || !def.fixtures) return 0;
  let n = 0;
  for(const f of def.fixtures){
    if(f.tx < 0 || f.ty < 0 || f.tx >= MAP_W || f.ty >= MAP_H) continue;
    if(buildIndex[f.ty*MAP_W+f.tx] >= 0) continue;         /* 这一格已经有东西了 */
    const b = {type:f.type, tx:f.tx, ty:f.ty, preset:true, npc:f.npc, bid:f.bid,
               solid:f.solid, flat:f.flat, interact:f.interact};
    buildings.push(b);
    buildIndex[f.ty*MAP_W+f.tx] = buildings.length - 1;
    n++;
  }
  return n;
}
/* 全镇家具重新盖一遍（新游戏 / 读档后调用） */
function stampTownFixtures(){
  let n = 0;
  for(const def of BUILDING_DEFS) n += stampFixtures(def);
  return n;
}
/* 玩家在「哪一栋房子的范围内」（含墙和门格 —— 剖切判定用这个，宽一圈） */
function playerRoomWide(){
  const tx = Math.floor(player.x/TILE), ty = Math.floor(player.y/TILE);
  const C = CONFIG.TOWN;
  for(const b of CONFIG.TOWN.LIST){
    const row = b.row || C.ROOM_ROW;
    if(tx >= b.x && tx < b.x + b.w && ty >= row && ty < row + C.ROOM_H) return b.id;
  }
  return null;
}
/* 某一格是不是某栋房子的「前墙」（南边那排墙） */
function townFrontWallBuilding(tx,ty){
  const C = CONFIG.TOWN;
  for(const b of CONFIG.TOWN.LIST){
    const row = b.row || C.ROOM_ROW;
    if(ty !== row + C.ROOM_H - 1) continue;
    if(tx >= b.x && tx < b.x + b.w) return b;
  }
  return null;
}
/* 玩家是不是在屋里（进门 = 在屋子的范围里，含墙和门格） */
function insideHouse(){ return playerRoomWide() !== null; }
/* 某个格子是不是某栋房子的外框（第 26 轮：房子的范围 = 后墙那一行到前墙那一行） */
function townBuildingAt(tx,ty){
  const C = CONFIG.TOWN;
  for(const b of CONFIG.TOWN.LIST){
    const row = b.row || C.ROOM_ROW;
    if(tx >= b.x && tx < b.x + b.w && ty >= row && ty < row + C.ROOM_H) return b;
  }
  return null;
}
/* 室内区域：站在哪一间屋子里（null = 在室外） */
function townRoomAt(tx,ty){
  const C = CONFIG.TOWN;
  for(const b of CONFIG.TOWN.LIST){
    const row = b.row || C.ROOM_ROW;
    if(tx > b.x && tx < b.x + b.w - 1 && ty > row && ty < row + C.ROOM_H - 1) return b.id;
  }
  return null;
}
function playerRoom(){ return townRoomAt(Math.floor(player.x/TILE), Math.floor(player.y/TILE)); }
/* 门 → 目的地（第 26 轮：墙只有 1 格厚 → 门就在后墙那一行）
 * 进 / 出 靠「上一格在哪」分：人在街上（门的北边）踩上去 = 进屋；
 * 人在屋里（门的南边）踩上去 = 出门。位移只有 1 格 → 不用黑屏闪一下。 */
function townDoorAt(tx, ty, prevTy){
  const C = CONFIG.TOWN;
  for(const b of CONFIG.TOWN.LIST){
    const row = b.row || C.ROOM_ROW;
    const dx = b.x + C.DOOR_DX;
    if(tx !== dx || ty !== row) continue;
    let dir;
    if(typeof prevTy === 'number') dir = (prevTy < ty) ? 'in' : 'out';
    else dir = (player.y <= (ty + 0.5)*TILE) ? 'in' : 'out';   /* 兜底：站在门的上半格 = 从街上来 */
    return {b:b, dir:dir,
            to: dir === 'in' ? {x:dx, y:row + C.ARRIVE_DY} : {x:dx, y:row - 1}};
  }
  return null;
}
/* 踩到门就进去：没有「当前场景」，只是把人挪到门另一头（只挪 1 格） */
function townDoorCheck(prevTy){
  const tx = Math.floor(player.x/TILE), ty = Math.floor(player.y/TILE);
  const d = townDoorAt(tx, ty, prevTy);
  if(!d) return false;
  player.x = (d.to.x + 0.5)*TILE;
  player.y = (d.to.y + 0.5)*TILE;
  player.vx = 0; player.vy = 0;
  cam.x = clamp(player.x - VIEW_W/2, 0, MAP_W*TILE - VIEW_W);
  cam.y = clamp(player.y - VIEW_H/2, 0, MAP_H*TILE - VIEW_H);
  /* 第 26 轮：只挪 1 格（32px）→ 不再需要黑屏闪一下 */
  townEnter(d);
  return true;
}
/* 某栋房子现在有谁在屋里（含正在睡觉的人） */
function townResidents(b){
  const ids = (b.residents && b.residents.length) ? b.residents : [b.npc];
  return ids.map(id => npcDef(id)).filter(Boolean);
}
function townResidentsHere(b){
  const out = [];
  for(const d of townResidents(b)){
    const st = npcCurrentState(d);
    if(!st || st.x === null || st.x === undefined) continue;
    if((st.map || 'valley') !== 'valley') continue;
    if(npcRoomIdAt((st.x + 0.5)*TILE, (st.y + 0.5)*TILE, 'valley') === b.id) out.push(d);
  }
  return out;
}
/* 进屋时给一句话：扑空也必须有解释（原则 C） */
function townEnter(d){
  const b = d.b;
  const npc = npcDef(b.npc);
  const w = npc ? npcWhere(npc) : null;
  if(d.dir !== 'in'){                         /* 出门不用提示 */
    if(b.kind === 'shop' && npc && w && w.at === 'shop') toast('离开杂货店 · ' + npc.name + '还在柜台后面');
    return;
  }
  if(!npc){ toast(b.name + '空荡荡的'); return; }
  if(b.kind === 'shop'){
    if(w && w.at === 'shop') toast('杂货店 · 营业中（' + hourText(b.hours.from) + '~' + hourText(b.hours.to) + '）');
    else if(townOpenNow(b)) toast('店里没人 —— ' + npc.name + '不在柜台（营业时间 ' + hourText(b.hours.from) + '~' + hourText(b.hours.to) + '）');
    else toast('店里没人 —— 已经打烊了（营业时间 ' + hourText(b.hours.from) + '~' + hourText(b.hours.to) + '）');
    return;
  }
  const here = townResidentsHere(b);
  if(here.length){
    const names = here.map(x => x.name).join('、');
    const asleep = here.some(x => {
      const st = npcCurrentState(x);
      return st && st.type === 'sleep';
    });
    const working = here.some(x => {
      const st = npcCurrentState(x);
      return st && st.type === 'work';
    });
    toast(b.name + ' · ' + names + (asleep ? '在家（有人睡着了）' : (working ? '在工作' : '在家')));
    return;
  }
  const someone = townResidents(b)[0] || npc;
  if(w && w.at === 'wander'){ toast(b.name + '里没人 —— ' + someone.name + '去' + (w.label || '外面') + '逛了'); return; }
  if(w && w.type === 'sleep'){ toast(b.name + '里没人'); return; }
  toast(b.name + '里没人 —— ' + someone.name + '在' + ((w && w.label) || '外面'));
}
/* 小时数 → "7:00" */
function hourText(h){ h = ((h % 24) + 24) % 24; const hh = Math.floor(h); return (hh < 10 ? '0' : '') + hh + ':00'; }
/* 门口的牌子（原则 C：扑空必须可解释） */
function townSignText(b){
  const npc = npcDef(b.npc);
  const w = npc ? npcWhere(npc) : null;
  if(!npc) return b.sign;
  /* 商店打烊 → 先说打烊，再补一句她在哪儿（原则 C：扑空必须可解释） */
  if(b.kind === 'shop' && !townOpenNow(b)){
    let s = b.sign + ' · 打烊了（营业时间 ' + hourText(b.hours.from) + '~' + hourText(b.hours.to) + '）';
    if(w && w.at === 'wander') s += ' · ' + npc.name + '在' + (w.label || '外面') + '那边逛着';
    return s;
  }
  if(b.kind === 'shop'){
    if(w && w.at === 'shop') return b.sign + ' · 营业中 ' + hourText(b.hours.from) + '~' + hourText(b.hours.to);
    return b.sign + ' · 店主不在柜台（营业时间 ' + hourText(b.hours.from) + '~' + hourText(b.hours.to) + '）';
  }
  const here = townResidentsHere(b);
  if(here.length){
    const working = here.filter(x => { const st = npcCurrentState(x); return st && st.type === 'work'; });
    const resting = here.filter(x => working.indexOf(x) < 0);
    const short = (arr) => {
      const names = arr.map(x => x.name);
      return names.length > 2 ? names.slice(0, 2).join('、') + '等' : names.join('、');
    };
    const parts = [];
    if(resting.length) parts.push(short(resting) + '在家');
    if(working.length) parts.push(short(working) + '在工作');
    return b.sign + ' · ' + parts.join('，');
  }
  const res = townResidents(b);
  const outNpc = res.find(x => {
    const st = npcCurrentState(x);
    return st && st.type !== 'sleep' && st.x !== null;
  }) || npc;
  if(w && w.at === 'wander') return outNpc.name + '不在，' + (w.label || '外面') + '那边逛着呢';
  if(w && w.type === 'sleep') return b.sign + ' · ' + npc.name + '睡着了';
  return b.sign + ' · ' + outNpc.name + '不在（' + ((w && w.label) || '出门了') + '）';
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { townBuilding, townShopBuilding, townHomeBuilding, townResidents, townResidentsHere, buildingDef, stampBuilding, stampFixtures, stampTownFixtures, playerRoomWide, townFrontWallBuilding, insideHouse, townBuildingAt, townRoomAt, playerRoom, townDoorAt, townDoorCheck, townEnter, hourText, townSignText });
export { townBuilding, townShopBuilding, townHomeBuilding, townResidents, townResidentsHere, buildingDef, stampBuilding, stampFixtures, stampTownFixtures, playerRoomWide, townFrontWallBuilding, insideHouse, townBuildingAt, townRoomAt, playerRoom, townDoorAt, townDoorCheck, townEnter, hourText, townSignText };
