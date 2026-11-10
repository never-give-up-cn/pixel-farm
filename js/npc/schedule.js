/* js/npc/schedule.js —— 由 index.html 拆分，原行 8351–8563 */
'use strict';

/* ================= 第 25 轮：NPC 日程引擎 =================
 * 5 种 slot 类型：work（上班）/ home（在家）/ sleep（睡觉）/ wander（瞎逛）/ away（不在镇上）
 * 位置 = f(天数, 小时, 天气, NPC id) —— 纯函数，不写进存档（原则 B） */
/* 字符串哈希 → [0,1)：同一天同一时段的结果永远一样（读档不会变来变去） */
function hash01(str){
  let h = 2166136261 >>> 0;
  const s = String(str);
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0; h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
/* 小时是否落在 [from, to)：跨午夜（from > to）也算
 * to > 24 写成「22 → 30」这种（= 22:00 ~ 次日 6:00） */
function inHours(h, from, to){
  if(typeof from !== 'number' || typeof to !== 'number') return false;
  let f = from, t = to;
  if(t > 24) t -= 24;
  if(f >= 24) f -= 24;
  if(f === t) return true;
  return (f <= t) ? (h >= f && h < t) : (h >= f || h < t);
}
/* 这个 NPC 的日程表（CONFIG.NPC_SCHED.LIST） */
function npcSched(d){ return (d && CONFIG.NPC_SCHED.LIST[d.id]) || null; }
/* 当前时段是哪一个 slot（找不到就是 away） */
function npcSlotOf(d, h){
  const S = npcSched(d);
  if(!S) return null;
  for(const s of S.sched) if(inHours(h, s.from, s.to)) return s;
  return null;
}
/* 下一个 slot 的开始时间（用来写「大概几点回来」） */
function npcNextSlotFrom(d, h){
  const S = npcSched(d);
  if(!S || !S.sched.length) return null;
  for(const s of S.sched) if(inHours(h, s.from, s.to)){        /* 找到当前 slot */
    const i = S.sched.indexOf(s);
    if(i + 1 < S.sched.length) return S.sched[i+1].from;
    return S.sched[0].from;                                    /* 跨到明天 */
  }
  for(const s of S.sched) if(s.from > h) return s.from;
  return S.sched[0].from;
}
/* 家具坐标：先找自己家，再找上班的地方 */
function npcFixtureSpot(d, type){
  if(!type) return null;
  const S = npcSched(d);
  const order = [];
  if(S && S.house) order.push(S.house);
  if(S && S.work && S.work !== S.house) order.push(S.work);
  for(const id of order){
    const def = buildingDef(id);
    if(!def) continue;
    const matches = def.fixtures.filter(f => f.type === type);
    if(!matches.length) continue;
    if(matches.length === 1) return matches[0];
    /* 同一个工作点有多件同类家具（柜台 / 书桌）→ 按同工种列表分配，避免叠在一起 */
    const workers = CONFIG.NPC.LIST.filter(x => {
      const sx = npcSched(x);
      return sx && sx.work === id && sx.sched.some(sl => sl.type === 'work' && sl.at === type);
    });
    let idx = workers.findIndex(x => x.id === d.id);
    if(idx < 0) idx = 0;
    return matches[idx % matches.length];
  }
  for(const def of BUILDING_DEFS)                              /* 兜底：全镇找一件 */
    for(const f of def.fixtures) if(f.type === type) return f;
  return null;
}
/* 就近找一个能站的空位（瞎逛落点可能是实心格） */
function nearestFreeTile(tx,ty){
  if(tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H && !isSolid(tx,ty)) return {x:tx, y:ty};
  for(let r=1;r<=6;r++)
    for(let dy=-r;dy<=r;dy++)
      for(let dx=-r;dx<=r;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy)) !== r) continue;
        const x = tx+dx, y = ty+dy;
        if(x<0 || y<0 || x>=MAP_W || y>=MAP_H) continue;
        if(!isSolid(x,y)) return {x:x, y:y};
      }
  return null;
}
/* 今天的天气是不是「坏天气」（雨雪天不出门瞎逛） */
function weatherBadNow(day){
  if(day !== undefined && day !== null && day !== clock.day) return false;  /* 未来的天气不知道 → 当好天气 */
  if(!weather) return false;
  return weather.id === 'rain' || weather.id === 'snow';
}
/* 营业时间摸鱼吗？（确定性哈希：同一天同一人同一时段固定） */
function npcWandersOnWork(d, day, slot){
  const C = CONFIG.NPC_SCHED;
  if(!C.WANDER_ON_WORK) return false;
  if(C.BAD_WEATHER_OUT && weatherBadNow(day)) return false;
  return hash01(d.id + '#' + day + '#' + slot.from) < C.WANDER_ON_WORK;
}
/* 瞎逛的落点：每 TICK_MIN 分钟换一次目标（哈希推导），可能是实心格 → 就近找空位 */
function npcWanderPos(d, day, h, area){
  const C = CONFIG.NPC_SCHED;
  const tick = Math.floor((h * 60) / Math.max(1, C.TICK_MIN));
  const key = d.id + '#' + day + '#' + tick;
  let tx = 0, ty = 0, label = '';
  const S = npcSched(d);
  const def = (S && S.work) ? buildingDef(S.work) : null;
  const spots = (def && def.wander && def.wander.spots) || [];
  if(area){
    const w = Math.max(1, area.w|0), hh = Math.max(1, area.h|0);
    tx = area.x + Math.min(w-1,  Math.floor(hash01(key + '#x') * w));
    ty = area.y + Math.min(hh-1, Math.floor(hash01(key + '#y') * hh));
    label = area.label || '外面';
  } else if(spots.length){
    const i = Math.min(spots.length-1, Math.floor(hash01(key + '#s') * spots.length));
    tx = spots[i].x; ty = spots[i].y; label = spots[i].label || '外面';
  } else {
    return {x:tx, y:ty, label:'外面'};
  }
  const free = nearestFreeTile(tx,ty);
  if(free){ tx = free.x; ty = free.y; }
  return {x:tx, y:ty, label:label};
}
/* 原则 B：NPC 现在的状态 = f(天数, 小时, 天气, NPC id) */
function npcCurrentState(d, day, hour){
  const S = npcSched(d);
  if(!S) return null;
  const h = (hour === undefined || hour === null) ? skyHour() : hour;
  const dy = (day === undefined || day === null) ? clock.day : day;
  const slot = npcSlotOf(d, h);
  if(!slot) return {id:d.id, type:'away', at:'away', label:'不在镇上', x:null, y:null,
                     from:0, to:24, slot:null, day:dy, hour:h};
  const st = {id:d.id, type:slot.type, at:'home', label:'', x:null, y:null,
              from:slot.from, to:slot.to, slot:slot, day:dy, hour:h};
  if(slot.type === 'away'){ st.at = 'away'; st.label = slot.label || '不在镇上'; return st; }
  /* 兼容直接写坐标的日程条目 {from,to,x,y,at?,label?}：
   * 有 x/y 就直接用，不再去家具 / 瞎逛范围里推导。
   * 不写 at 时：wander → street，其余 → home。 */
  if(typeof slot.x === 'number' && typeof slot.y === 'number'){
    st.x = slot.x | 0;
    st.y = slot.y | 0;
    st.at = slot.at || (slot.type === 'wander' ? 'street' : 'home');
    st.label = slot.label || (slot.type === 'sleep' ? '床上' :
               (st.at === 'street' ? '街上' : (st.at === 'away' ? '不在镇上' : '家')));
    return st;
  }
  /* 上班时间也可能跑出去摸鱼（确定性哈希，同一天同一时段固定） */
  if(slot.type === 'work' && npcWandersOnWork(d, dy, slot)){
    const w = npcWanderPos(d, dy, h, null);
    st.type = 'wander'; st.at = 'wander';
    st.x = w.x; st.y = w.y; st.label = w.label;
    return st;
  }
  if(slot.type === 'wander'){
    const w = npcWanderPos(d, dy, h, slot.area);
    st.at = 'street';
    st.x = w.x; st.y = w.y; st.label = w.label || slot.label || '外面';
    return st;
  }
  if(slot.type === 'away'){ st.at = 'away'; st.label = slot.label || '不在镇上'; return st; }
  /* home / sleep / work：站在某件家具上 */
  const f = npcFixtureSpot(d, slot.at);
  if(f){ st.x = f.tx; st.y = f.ty; }
  const isWork = slot.type === 'work';
  st.at = isWork ? (slot.at === 'counter' ? 'shop' : 'work') : 'home';
  st.label = (slot.type === 'sleep') ? '床上' : (isWork ? '工作' : (st.at === 'shop' ? '店里' : '家'));
  return st;
}
/* 这个 NPC 是不是就在玩家面前睡着了（叫不醒） */
function npcAsleepHere(d){
  const st = npcCurrentState(d);
  if(!st || st.type !== 'sleep') return false;
  if(st.x === null || st.x === undefined) return false;
  const room = playerRoomWide();
  if(!room) return false;                       /* 玩家在室外 → 不算（来访居民不受影响） */
  return npcRoomIdAt((st.x + 0.5)*TILE, (st.y + 0.5)*TILE) === room;
}
/* 作息表：当前这个人在哪个时段（第 24 轮的旧接口，现在由新引擎推导） */
function npcRoutineSlot(d, h){
  const st = npcCurrentState(d, clock.day, h);
  if(!st) return {at:'street', spot:0, label:''};
  return {at:st.at, spot:0, label:st.label, from:st.from, to:st.to, type:st.type};
}
/* 出门瞎逛吗？（第 24 轮的旧接口，现在由新引擎推导） */
function townWanderSpot(d, slot){
  const st = npcCurrentState(d, clock.day, skyHour());
  if(!st || st.type !== 'wander') return null;
  return {x:st.x, y:st.y, label:st.label};
}
/* 原则 B：NPC 的位置 = f(天数, 小时, 天气, NPC id) */
function npcWhere(d){
  const h = skyHour();
  const fs = festivalNpcSpot(d);         /* 第 17 轮：秋·丰收节村民都去广场赶集 */
  if(fs) return {x:fs.x, y:fs.y, at:'festival', label:'广场', from:fs.from, to:fs.to, type:'festival'};
  const vs = visitSpot(d);               /* 第 23 轮：今天来访的居民下午站到农场里 */
  if(vs) return {x:vs.x, y:vs.y, at:'visit', label:'农场', from:vs.from, to:vs.to, type:'visit'};
  const st = npcCurrentState(d, clock.day, h);
  if(!st || st.x === null || st.x === undefined) return null;
  return {x:st.x, y:st.y, at:st.at, label:st.label, from:st.from, to:st.to, type:st.type};
}
/* 时刻表：当前这个点在哪儿（null = 今天不出现） */
function npcSpot(d){
  const w = npcWhere(d);
  if(!w) return null;
  return {x:w.x, y:w.y, from:(w.from === undefined ? 0 : w.from), to:(w.to === undefined ? 24 : w.to),
          at:w.at, label:w.label, type:w.type};
}
/* 第 27 轮：NPC 的位置 = 运行时物理坐标（连续移动中的那一格）
 * 逻辑位置（npcSpot / npcWhere）还是「目的地」，这里给的是「现在站在哪」。 */
function npcPos(d){
  const rt = npcRuntimeOf(d);
  const t = npcLogicalTarget(d);
  if(!t) return null;                          /* 真的不在镇上 → 不显示 */
  return {x:rt.x, y:rt.y, tx:Math.floor(rt.x/TILE), ty:Math.floor(rt.y/TILE),
          at:t.at, label:t.label, type:t.type};
}
/* 玩家与 NPC 的距离（格）：不在同一片区域就看不见（隔着墙不算） */
function npcDist(d){
  if(typeof currentMap !== 'undefined' && currentMap !== 'valley') return Infinity;
  const p = npcPos(d);
  if(!p) return Infinity;
  if(npcRoomIdAt(p.x, p.y) !== playerRoomWide()) return Infinity;
  return Math.hypot(p.x - player.x, p.y - player.y) / TILE;
}
/* 现在站在旁边的那个 NPC（没有就 null） */
function npcNear(){
  let best = null, bd = CONFIG.NPC.RANGE;
  for(const d of CONFIG.NPC.LIST){
    const dist = npcDist(d);
    if(dist <= bd){ bd = dist; best = d; }
  }
  return best;
}
/* 这个 NPC 现在看不见（不在玩家所在的那片区域：屋里 / 街上各算一片） */
function npcHidden(d){
  if(typeof currentMap !== 'undefined' && currentMap !== 'valley') return true;
  const p = npcPos(d);
  if(!p) return true;
  return npcRoomIdAt(p.x, p.y) !== playerRoomWide();
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { hash01, inHours, npcSched, npcSlotOf, npcNextSlotFrom, npcFixtureSpot, nearestFreeTile, weatherBadNow, npcWandersOnWork, npcWanderPos, npcCurrentState, npcAsleepHere, npcRoutineSlot, townWanderSpot, npcWhere, npcSpot, npcPos, npcDist, npcNear, npcHidden });
export { hash01, inHours, npcSched, npcSlotOf, npcNextSlotFrom, npcFixtureSpot, nearestFreeTile, weatherBadNow, npcWandersOnWork, npcWanderPos, npcCurrentState, npcAsleepHere, npcRoutineSlot, townWanderSpot, npcWhere, npcSpot, npcPos, npcDist, npcNear, npcHidden };
