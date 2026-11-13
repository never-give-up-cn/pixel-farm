/* js/world/multimap.js — 多地图：农场/小镇、煤渣森林、山地、鹈鹕海滩。
 *
 * 所有地图共用 128×104 的网格。切换地图时只替换 map / crops / roads /
 * buildings / buildIndex / baseMap 这些全局数组，原有玩法代码不用改。
 * 新地图是探索地图：可以走路、钓鱼、看地标，不开放开垦 / 建造。
 */

'use strict';

const MAP_DEFS = {
  valley:   { name: '农场与小镇' },
  forest:   { name: '煤渣森林' },
  mountain: { name: '山地' },
  beach:    { name: '鹈鹕海滩' },
  secret:   { name: '秘密森林' },
  quarry:   { name: '采石场' }
};

/* 新地图里可进入的住宅室内：复用同一套房间模板，家具和住户不同 */
const INTERIORS = {
  in_robin: {
    name:'罗宾家', owner:'robin', outMap:'mountain', outX:39, outY:82, room:{x:52,y:40,w:18,h:12},
    furn:[
      {type:'bed',x:54,y:48}, {type:'table',x:64,y:46}, {type:'stove',x:66,y:42},
      {type:'chest',x:58,y:42}, {type:'shelf',x:55,y:42}, {type:'bench',x:56,y:45},
      {type:'rug',x:61,y:44}
    ]
  },
  in_marnie: {
    name:'玛妮牧场', owner:'marnie', outMap:'forest', outX:109, outY:43, room:{x:52,y:40,w:18,h:12},
    furn:[
      {type:'bed',x:54,y:48}, {type:'bed',x:67,y:48}, {type:'table',x:64,y:46},
      {type:'stove',x:66,y:42}, {type:'chest',x:58,y:42}, {type:'shelf',x:55,y:42},
      {type:'barrel',x:68,y:44}, {type:'rug',x:61,y:45}
    ]
  },
  in_leah: {
    name:'莉亚小屋', owner:'leah', outMap:'forest', outX:103, outY:54, room:{x:52,y:40,w:18,h:12},
    furn:[
      {type:'bed',x:54,y:48}, {type:'desk',x:64,y:46}, {type:'table',x:66,y:49},
      {type:'chest',x:58,y:42}, {type:'shelf',x:55,y:42}, {type:'flowerstand',x:67,y:42},
      {type:'rug',x:61,y:44}
    ]
  },
  in_wizard: {
    name:'法师塔', owner:'wizard', outMap:'forest', outX:70, outY:49, room:{x:52,y:40,w:18,h:12},
    furn:[
      {type:'bed',x:54,y:48}, {type:'shelf',x:55,y:42}, {type:'shelf',x:58,y:42},
      {type:'desk',x:64,y:45}, {type:'table',x:66,y:48}, {type:'stove',x:67,y:42},
      {type:'chest',x:61,y:42}, {type:'rug',x:61,y:45}
    ]
  },
  in_willy: {
    name:'威利鱼店', owner:'willy', outMap:'beach', outX:76, outY:18, room:{x:52,y:40,w:18,h:12},
    furn:[
      {type:'bed',x:54,y:48}, {type:'counter',x:64,y:46}, {type:'barrel',x:67,y:42},
      {type:'barrel',x:68,y:44}, {type:'table',x:66,y:49}, {type:'chest',x:58,y:42},
      {type:'shelf',x:55,y:42}, {type:'rug',x:61,y:45}
    ]
  },
  in_elliott: {
    name:'艾利欧特小屋', owner:'elliott', outMap:'beach', outX:49, outY:18, room:{x:52,y:40,w:18,h:12},
    furn:[
      {type:'bed',x:54,y:48}, {type:'desk',x:64,y:46}, {type:'shelf',x:55,y:42},
      {type:'shelf',x:67,y:42}, {type:'table',x:66,y:49}, {type:'chest',x:58,y:42},
      {type:'rug',x:61,y:45}
    ]
  },
  in_guild: {
    name:'冒险家公会', owner:'marlon', outMap:'mountain', outX:82, outY:95, room:{x:52,y:40,w:18,h:12},
    furn:[
      {type:'bed',x:54,y:48}, {type:'bed',x:67,y:48}, {type:'table',x:64,y:46},
      {type:'bench',x:56,y:44}, {type:'bench',x:66,y:44}, {type:'chest',x:58,y:42},
      {type:'shelf',x:55,y:42}, {type:'rug',x:61,y:45}
    ]
  }
};
for(const id in INTERIORS) MAP_DEFS[id] = { name: INTERIORS[id].name };

window.MAP_WORLD = {};
window.currentMap = 'valley';
window.mapDisplayName = MAP_DEFS.valley.name;

function blankWorldState(name, townList){
  const n = MAP_W * MAP_H;
  return {
    name: name,
    map: new Uint8Array(n),
    crops: new Array(n).fill(null),
    roads: new Uint8Array(n),
    buildings: [],
    buildIndex: new Int32Array(n).fill(-1),
    baseMap: new Uint8Array(n),
    townList: townList || [],
    landmarks: [],
    exits: []
  };
}

/* 只替换地图数组，不改玩家 / 镜头 / 时间 */
function useWorldArrays(st){
  window.map = st.map;
  window.crops = st.crops;
  window.roads = st.roads;
  window.buildings = st.buildings;
  window.buildIndex = st.buildIndex;
  window.baseMap = st.baseMap;
  CONFIG.TOWN.LIST = st.townList || [];
  window._townProps = null;
  if(typeof invalidateGround === 'function') invalidateGround();
}

/* 新游戏 / 读档后，把当前（农场+小镇）地图登记成 valley */
function worldRegisterValley(){
  const C = CONFIG.TOWN;
  const st = blankWorldState(MAP_DEFS.valley.name, CONFIG.TOWN.LIST);
  st.map = map;
  st.crops = crops;
  st.roads = roads;
  st.buildings = buildings;
  st.buildIndex = buildIndex;
  st.baseMap = baseMap;
  st.townList = CONFIG.TOWN.LIST;
  st.landmarks = [];
  st.exits = [
    { x: 64, y: 1,   w: 2, h: 1, to: 'mountain', tx: 64,  ty: 92, label: '北边 · 山地' },
    { x: 1,  y: 42,  w: 1, h: 1, to: 'forest',   tx: 112, ty: 42, label: '西边 · 森林' },
    { x: 64, y: 102, w: 2, h: 1, to: 'beach',    tx: 64,  ty: 8,  label: '南边 · 海滩' }
  ];
  MAP_WORLD.valley = st;
  currentMap = 'valley';
  mapDisplayName = st.name;
  if(typeof player !== 'undefined') player.warpCd = 0;

  /* 把出口接到路网（同时写进 baseMap，避免变成存档 diff） */
  const carve = (tx, ty) => {
    if(tx < 1 || ty < 1 || tx >= MAP_W-1 || ty >= MAP_H-1) return;
    const i = ty * MAP_W + tx;
    map[i] = T.PATH;
    baseMap[i] = T.PATH;
  };
  for(let y = 1; y <= FARM.y; y++){ carve(64, y); carve(65, y); }
  for(let x = 1; x <= 4; x++) carve(x, 42);
  for(let y = C.END_ROW + 1; y < MAP_H - 2; y++){ carve(64, y); carve(65, y); }
}

/* ---------- 生成辅助 ---------- */
function fillMap(tile){ map.fill(tile); crops.fill(null); }
function borderWater(){
  for(let x = 0; x < MAP_W; x++){ map[x] = T.WATER; map[(MAP_H-1)*MAP_W+x] = T.WATER; }
  for(let y = 0; y < MAP_H; y++){ map[y*MAP_W] = T.WATER; map[y*MAP_W+MAP_W-1] = T.WATER; }
}
function setRect(x, y, w, h, tile){
  for(let ty = y; ty < y+h; ty++)
    for(let tx = x; tx < x+w; tx++){
      if(tx < 1 || ty < 1 || tx >= MAP_W-1 || ty >= MAP_H-1) continue;
      map[ty*MAP_W+tx] = tile;
    }
}
function setPathRect(x, y, w, h){ setRect(x, y, w, h, T.PATH); }
function aroundLandmark(l, tx, ty, pad){
  pad = pad || 2;
  return tx >= l.x-pad && tx < l.x+l.w+pad && ty >= l.y-pad && ty < l.y+l.h+pad;
}
function scatterWild(rng, count, landmarks, opts){
  opts = opts || {};
  for(let n = 0; n < count; n++){
    const tx = 2 + Math.floor(rng() * (MAP_W-4));
    const ty = 2 + Math.floor(rng() * (MAP_H-4));
    const i = ty * MAP_W + tx;
    if(map[i] !== T.GRASS) continue;
    if(landmarks.some(l => aroundLandmark(l, tx, ty, 2))) continue;
    const r = rng();
    if(r < (opts.tree == null ? 0.72 : opts.tree)) map[i] = T.TREE;
    else if(r < 0.90) map[i] = T.ROCK;
    else map[i] = T.FLOWER;
  }
}
function pond(cx, cy, rx, ry){
  for(let y = cy-ry; y <= cy+ry; y++)
    for(let x = cx-rx; x <= cx+rx; x++){
      if(x < 1 || y < 1 || x >= MAP_W-1 || y >= MAP_H-1) continue;
      const dx = (x-cx)/rx, dy = (y-cy)/ry;
      if(dx*dx + dy*dy <= 1) map[y*MAP_W+x] = T.WATER;
    }
}

/* ---------- 煤渣森林 ---------- */
function genForest(){
  fillMap(T.GRASS);
  borderWater();
  /* 南北向的河 */
  for(let y = 1; y < MAP_H-1; y++)
    for(let x = 54; x <= 62; x++) map[y*MAP_W+x] = T.WATER;
  /* 两座桥 */
  setPathRect(52, 42, 13, 2);
  setPathRect(52, 70, 13, 2);
  /* 西北池塘 */
  pond(28, 18, 9, 7);
  /* 主路：东入口 → 牧场 / 莉亚 / 法师塔 */
  setPathRect(120, 42, 7, 2);
  setPathRect(78, 42, 43, 2);
  setPathRect(104, 38, 3, 5);
  setPathRect(100, 42, 3, 6);
  setPathRect(76, 42, 3, 9);
  setPathRect(60, 30, 17, 2);

  const L = [
    { type:'ranch',   x:104, y:34, w:15, h:8,  label:'玛妮牧场', home:'in_marnie' },
    { type:'cottage', x:98,  y:46, w:11, h:7,  label:'莉亚小屋', home:'in_leah' },
    { type:'tower',   x:66,  y:34, w:10, h:15, label:'法师塔', home:'in_wizard' },
    { type:'log',     x:8,   y:8,  w:7,  h:4,  label:'秘密森林', action:'secret' },
    { type:'cart',    x:64,  y:24, w:7,  h:5,  label:'旅行货车', action:'cart' },
    { type:'sign',    x:119, y:40, w:3,  h:3,  label:'东边 · 小镇', solid:false }
  ];
  scatterWild(mulberry32(9101), 1800, L, { tree:0.80 });
  return {
    landmarks: L,
    exits: [{ x:127, y:42, w:1, h:1, to:'valley', tx:4, ty:42, label:'东边 · 小镇' }],
    spawn: { x:112, y:42 }
  };
}

/* ---------- 秘密森林 ---------- */
function genSecret(){
  fillMap(T.GRASS);
  borderWater();
  /* 中央池塘 */
  pond(64, 52, 13, 9);
  /* 南入口 → 林间空地（林间土路） */
  setRect(64, 90, 3, 13, T.DIRT);
  setRect(34, 70, 33, 3, T.DIRT);
  setRect(34, 38, 3, 35, T.DIRT);
  setRect(46, 38, 20, 3, T.DIRT);
  /* 六棵硬木树桩 */
  const L = [];
  const stumps = [[40,40],[48,40],[56,40],[40,64],[48,64],[56,64]];
  for(const p of stumps){
    L.push({ type:'stump', x:p[0], y:p[1], w:2, h:2, label:'硬木树桩', action:'stump', solid:true });
  }
  L.push({ type:'sign', x:61, y:94, w:3, h:3, label:'南边 · 煤渣森林', solid:false });
  L.push({ type:'statue', x:76, y:86, w:3, h:3, label:'古老雕像', action:'statue', solid:true });
  scatterWild(mulberry32(9104), 2400, L, { tree:0.88 });
  return {
    landmarks: L,
    exits: [{ x:64, y:102, w:2, h:1, to:'forest', tx:16, ty:13, label:'南边 · 煤渣森林' }],
    spawn: { x:64, y:98 }
  };
}

/* ---------- 山地 ---------- */
function genMountain(){
  fillMap(T.GRASS);
  borderWater();
  /* 大湖 */
  pond(66, 32, 28, 18);
  pond(50, 24, 14, 10);
  /* 主路：南入口 → 矿洞 / 公会 / 木匠 / 莱纳斯 */
  setPathRect(64, 84, 3, 19);
  setPathRect(52, 86, 15, 3);
  setPathRect(74, 84, 12, 3);
  setPathRect(40, 74, 26, 3);
  setPathRect(40, 70, 3, 8);
  setPathRect(58, 52, 3, 24);
  setPathRect(52, 52, 8, 3);

  const L = [
    { type:'mine',      x:46, y:80, w:12, h:9,  label:'矿井', action:'mine' },
    { type:'guild',     x:76, y:84, w:14, h:11, label:'冒险家公会', home:'in_guild' },
    { type:'carpenter', x:30, y:70, w:18, h:11, label:'罗宾木匠店', home:'in_robin' },
    { type:'tent',      x:55, y:40, w:7,  h:5,  label:'莱纳斯的帐篷' },
    { type:'bridge',    x:104,y:28, w:13, h:3,  label:'采石场', action:'quarry' },
    { type:'sign',      x:61, y:94, w:3,  h:3,  label:'南边 · 小镇', solid:false }
  ];
  scatterWild(mulberry32(9102), 1300, L, { tree:0.62 });
  return {
    landmarks: L,
    exits: [{ x:64, y:102, w:2, h:1, to:'valley', tx:64, ty:3, label:'南边 · 小镇' }],
    spawn: { x:64, y:92 }
  };
}

/* ---------- 采石场 ---------- */
function genQuarry(){
  fillMap(T.BARE);
  borderWater();
  /* 零散的裸岩地，让采石场看起来坑坑洼洼 */
  const rng = mulberry32(9203);
  for(let n = 0; n < 600; n++){
    const tx = 3 + Math.floor(rng() * (MAP_W-6));
    const ty = 3 + Math.floor(rng() * (MAP_H-6));
    const i = ty * MAP_W + tx;
    if(map[i] === T.BARE && rng() < 0.45) map[i] = T.ROCK;
  }
  /* 小水潭（可以钓鱼） */
  pond(86, 52, 8, 6);
  /* 主路：南入口 → 采石区 */
  setRect(64, 82, 3, 21, T.PATH);
  setRect(40, 82, 27, 3, T.PATH);
  setRect(40, 60, 3, 25, T.PATH);
  setRect(40, 60, 27, 3, T.PATH);
  setRect(84, 60, 12, 3, T.PATH);
  setRect(84, 60, 3, 25, T.PATH);

  const kinds = [
    ['stone', '岩石'], ['stone', '岩石'], ['copper_ore', '铜矿脉'], ['copper_ore', '铜矿脉'],
    ['iron_ore', '铁矿脉'], ['iron_ore', '铁矿脉'], ['gold_ore', '金矿脉'], ['coal', '煤矿脉']
  ];
  const spots = [[46,76],[56,76],[70,76],[80,76],[46,88],[56,88],[70,88],[80,88]];
  const L = [];
  spots.forEach((p, i) => {
    const k = kinds[i];
    L.push({ type:'quarryrock', x:p[0], y:p[1], w:3, h:3,
             label:k[1], action:'quarryrock', ore:k[0], solid:true });
  });
  L.push({ type:'sign', x:61, y:94, w:3, h:3, label:'南边 · 山地', solid:false });

  return {
    landmarks: L,
    exits: [{ x:64, y:102, w:2, h:1, to:'mountain', tx:110, ty:33, label:'南边 · 山地' }],
    spawn: { x:64, y:98 }
  };
}

/* ---------- 鹈鹕海滩 ---------- */
function genBeach(){
  fillMap(T.GRASS);
  borderWater();
  /* 沙滩带 */
  setRect(1, 8, MAP_W-2, 44, T.BARE);
  /* 海 */
  setRect(1, 52, MAP_W-2, MAP_H-53, T.WATER);
  /* 木栈桥 */
  setPathRect(58, 50, 5, 52);
  /* 从北入口下来的路 */
  setPathRect(64, 1, 3, 50);
  /* 潮池 */
  setRect(92, 36, 10, 5, T.WATER);
  setRect(22, 38, 9, 4, T.WATER);

  const L = [
    { type:'fishshop', x:70, y:10, w:13, h:8, label:'威利的鱼店', home:'in_willy' },
    { type:'cabin',    x:44, y:10, w:11, h:8, label:'艾利欧特小屋', home:'in_elliott' },
    { type:'pier',     x:58, y:50, w:5,  h:52, label:'栈桥', solid:false },
    { type:'sign',     x:61, y:4,  w:3,  h:3,  label:'北边 · 小镇', solid:false }
  ];
  scatterWild(mulberry32(9103), 240, L, { tree:0.25 });
  return {
    landmarks: L,
    exits: [{ x:64, y:1, w:2, h:1, to:'valley', tx:64, ty:99, label:'北边 · 小镇' }],
    spawn: { x:64, y:8 }
  };
}

/* ---------- 新地图住宅室内 ---------- */
function genInterior(id){
  const I = INTERIORS[id];
  if(!I) return null;
  const r = I.room;
  fillMap(T.WALL);
  setRect(r.x, r.y, r.w, r.h, T.FLOOR);
  const doorX = r.x + Math.floor(r.w / 2);
  const doorY = r.y + r.h - 1;
  map[doorY * MAP_W + doorX] = T.DOOR;

  const add = (type, tx, ty, solid, flat, interact) => {
    const b = { type:type, tx:tx, ty:ty, preset:true, solid:!!solid, flat:!!flat,
                interact:interact || '', npc:I.owner, bid:id };
    buildings.push(b);
    if(solid) buildIndex[ty*MAP_W+tx] = buildings.length - 1;
    return b;
  };
  let stoveRef = null, chestRef = null;
  if(Array.isArray(I.furn) && I.furn.length){
    const solidOf = { bed:1, table:1, stove:1, chest:1, bench:1, counter:1, barrel:1, desk:1, flowerstand:1, shelf:0, rug:0, plant:1 };
    const interactOf = { bed:'bed', table:'home', stove:'cook', chest:'chest', counter:'work', bench:'work', desk:'work', flowerstand:'work' };
    for(const f of I.furn){
      if(f.type === 'stove'){
        stoveRef = add('stove', f.x, f.y, 1, false, 'cook');
        stoveRef.job = null; stoveRef.out = [];
      } else if(f.type === 'chest'){
        chestRef = add('chest', f.x, f.y, 1, false, 'chest');
        chestRef.slots = new Array(CONFIG.BUILD.CHEST_SLOTS).fill(null);
      } else {
        add(f.type, f.x, f.y, solidOf[f.type] || 0, f.type === 'rug', interactOf[f.type] || '');
      }
    }
  } else {
    add('bed',   r.x + 3,         r.y + r.h - 4, 1, false, 'bed');
    add('table', r.x + r.w - 6,   r.y + r.h - 5, 1, false, 'home');
    stoveRef = add('stove', r.x + r.w - 4, r.y + 3, 1, false, 'cook'); stoveRef.job = null; stoveRef.out = [];
    chestRef = add('chest', r.x + 6, r.y + 3, 1, false, 'chest'); chestRef.slots = new Array(CONFIG.BUILD.CHEST_SLOTS).fill(null);
    add('shelf', r.x + 3,         r.y + 3,       0, false, '');
    add('rug',   r.x + Math.floor(r.w/2), r.y + Math.floor(r.h/2), 0, true, '');
  }
  return {
    landmarks: [],
    exits: [{ x:doorX, y:doorY, w:1, h:1, to:I.outMap, tx:I.outX, ty:I.outY, label:'出门' }],
    spawn: { x:doorX, y:doorY - 2 },
    stove: stoveRef,
    chest: chestRef
  };
}


function ensureWorld(id){
  if(MAP_WORLD[id]) return MAP_WORLD[id];
  const old = MAP_WORLD[currentMap] || {
    map: window.map, crops: window.crops, roads: window.roads,
    buildings: window.buildings, buildIndex: window.buildIndex,
    baseMap: window.baseMap, townList: CONFIG.TOWN.LIST
  };
  const st = blankWorldState(MAP_DEFS[id] ? MAP_DEFS[id].name : id, []);
  useWorldArrays(st);
  let result = null;
  if(id === 'forest') result = genForest();
  else if(id === 'mountain') result = genMountain();
  else if(id === 'beach') result = genBeach();
  else if(id === 'secret') result = genSecret();
  else if(id === 'quarry') result = genQuarry();
  else if(INTERIORS[id]) result = genInterior(id);
  if(result){
    st.landmarks = result.landmarks || [];
    st.exits = result.exits || [];
    st.name = MAP_DEFS[id] ? MAP_DEFS[id].name : id;
    st.spawn = result.spawn || { x: 64, y: 52 };
    st.stove = result.stove || null;
    st.chest = result.chest || null;
    st.baseMap.set(map);
  }
  useWorldArrays(old);
  MAP_WORLD[id] = st;
  return st;
}

/* 只切数组，不改玩家坐标；保存 / 读档时也用它 */
function worldUseArrays(id){
  const st = MAP_WORLD[id] || ensureWorld(id);
  useWorldArrays(st);
  currentMap = id;
  mapDisplayName = st.name;
  return st;
}

function worldActivate(id, x, y, silent){
  const st = worldUseArrays(id);
  player.x = x * TILE + TILE/2;
  player.y = y * TILE + TILE/2;
  player.vx = 0; player.vy = 0; player.moving = false;
  cam.x = clamp(player.x - VIEW_W/2, 0, MAP_W*TILE - VIEW_W);
  cam.y = clamp(player.y - VIEW_H/2, 0, MAP_H*TILE - VIEW_H);
  if(typeof cancelFishing === 'function') cancelFishing(true);
  if(!silent) toast('进入 · ' + st.name);
  return st;
}

function worldSwitch(id, tx, ty){
  if(id === currentMap) return false;
  return !!worldActivate(id, tx, ty, false);
}

/* 走近可进入的地标房屋（新地图） */
function worldLandmarkNear(){
  if(currentMap === 'valley') return null;
  const px = player.x / TILE, py = player.y / TILE;
  let best = null, bd = 2.2;
  for(const l of worldLandmarks()){
    if(!l.home && !l.action) continue;
    const cx = clamp(px, l.x, l.x + l.w);
    const cy = clamp(py, l.y, l.y + l.h);
    const d = Math.hypot(px - cx, py - cy);
    if(d < bd){ bd = d; best = l; }
  }
  return best;
}
function worldEnterLandmark(l){
  if(!l || !l.home) return false;
  const st = ensureWorld(l.home);
  return !!worldActivate(l.home, st.spawn.x, st.spawn.y, false);
}

/* 秘密森林的古老雕像：用宝石甜莓换永久体力上限 */
const secretState = { statue: false };

function worldStatueInteract(l){
  if(!l || l.action !== 'statue') return false;
  if(secretState.statue){
    toast('古老雕像静静立在林间，已经不再回应你');
    return false;
  }
  if(typeof countItem !== 'function' || countItem('sweet_gem_berry') <= 0){
    toast('古老雕像摊开手掌，像在等待一颗宝石般的果实（宝石甜莓）');
    return false;
  }
  if(typeof removeItem !== 'function' || !removeItem('sweet_gem_berry', 1)){
    toast('宝石甜莓拿不出来');
    return false;
  }
  secretState.statue = true;
  staminaBonus += 10;
  staminaMax = CONFIG.STAMINA.MAX + staminaBonus;
  stamina = staminaMax;
  if(typeof updateStats === 'function') updateStats();
  toast('古老雕像收下甜宝石浆果，体力上限 +10（' + staminaMax + '）');
  if(typeof playSfx === 'function') playSfx(1046, 'triangle', 0.2, CONFIG.AUDIO.VOLUME);
  return true;
}
function worldSecretSerialize(){
  return { s: secretState.statue ? 1 : 0 };
}
function worldSecretDeserialize(a){
  secretState.statue = !!(a && a.s);
}
function worldSecretReset(){ secretState.statue = false; }

/* 秘密森林：树桩每天可以砍一次，掉硬木 */
function worldCutStump(l){
  if(!l || l.action !== 'stump') return false;
  if(l.cutDay === clock.day){ toast('这个树桩今天已经砍过了'); return false; }
  if(typeof countItem === 'function' && countItem('hardwood') >= 99){ toast('硬木已经拿不下了'); return false; }
  l.cutDay = clock.day;
  if(typeof addItem === 'function') addItem('hardwood', 2);
  toast('砍下树桩，获得硬木 ×2');
  if(typeof playSfx === 'function') playSfx(420, 'triangle', 0.12, CONFIG.AUDIO.VOLUME * 0.7);
  return true;
}
/* 采石场矿脉：每天可以采一次 */
const QUARRY_YIELD = {
  stone:      [['stone', 3]],
  copper_ore: [['copper_ore', 2], ['stone', 2]],
  iron_ore:   [['iron_ore', 2], ['stone', 2]],
  gold_ore:   [['gold_ore', 1], ['stone', 3]],
  coal:       [['coal', 2], ['stone', 2]]
};
function worldMineRock(l){
  if(!l || l.action !== 'quarryrock') return false;
  if(l.cutDay === clock.day){ toast('这块矿脉今天已经采过了'); return false; }
  const drops = QUARRY_YIELD[l.ore] || [['stone', 2]];
  l.cutDay = clock.day;
  const names = [];
  for(const [id, n] of drops){
    if(typeof addItem === 'function') addItem(id, n);
    const d = (typeof itemDef === 'function') ? itemDef(id) : null;
    names.push((d ? d.name : id) + ' ×' + n);
  }
  toast('采下' + l.label + '：' + names.join('、'));
  if(typeof playSfx === 'function') playSfx(200, 'square', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
  return true;
}
/* 每日采集记录：[[地图, x, y, day], ...]（旧存档是 [x, y, day]，默认秘密森林树桩） */
function worldDailySerialize(){
  const out = [];
  for(const id in MAP_WORLD){
    const st = MAP_WORLD[id];
    if(!st || !st.landmarks) continue;
    for(const l of st.landmarks){
      if(l.cutDay) out.push([id, l.x, l.y, l.cutDay | 0]);
    }
  }
  return out;
}
function worldDailyDeserialize(a){
  if(!Array.isArray(a) || !a.length) return;
  for(const rec of a){
    if(!Array.isArray(rec)) continue;
    let id = 'secret', x, y, day;
    if(rec.length >= 4){ id = rec[0]; x = rec[1] | 0; y = rec[2] | 0; day = rec[3] | 0; }
    else { x = rec[0] | 0; y = rec[1] | 0; day = rec[2] | 0; }
    if(day <= 0 || typeof id !== 'string' || !MAP_DEFS[id]) continue;
    const st = ensureWorld(id);
    if(!st || !st.landmarks) continue;
    for(const l of st.landmarks){
      if((l.action === 'stump' || l.action === 'quarryrock') && l.x === x && l.y === y) l.cutDay = day;
    }
  }
}

/* 出口判定：踩到地图边缘的出口格就切换 */
function worldExitCheck(){
  const st = MAP_WORLD[currentMap];
  if(!st || !st.exits || !st.exits.length) return false;
  if(player.warpCd > 0) return false;
  const tx = Math.floor(player.x/TILE), ty = Math.floor(player.y/TILE);
  for(const e of st.exits){
    if(tx >= e.x && tx < e.x + e.w && ty >= e.y && ty < e.y + e.h){
      player.warpCd = 0.8;
      worldSwitch(e.to, e.tx, e.ty);
      return true;
    }
  }
  return false;
}

/* ---------- 地标绘制 ---------- */
function landmarkColor(type){
  if(type === 'tower') return '#7a5aa8';
  if(type === 'mine') return '#3a3a44';
  if(type === 'tent') return '#c9a24a';
  if(type === 'fishshop') return '#4f8fbf';
  if(type === 'ranch') return '#b3443c';
  if(type === 'guild') return '#8a8a96';
  if(type === 'bridge' || type === 'pier') return '#9a6b3c';
  if(type === 'quarryrock') return '#6f675c';
  if(type === 'statue') return '#8a9280';
  return '#b07a4a';
}

function drawLandmarkLabel(g, l, x, y, w, h){
  const dx = x + w/2 + cam.x - player.x, dy = y + h/2 + cam.y - player.y;
  if(dx*dx + dy*dy >= 700*700) return;
  g.font = '12px ' + FONT_CJK;
  const tw = g.measureText(l.label).width;
  const lx = x+w/2 - tw/2, ly = Math.max(4, y - 24);
  g.fillStyle = 'rgba(8,10,16,.86)';
  g.fillRect(lx - 5, ly, tw + 10, 18);
  g.strokeStyle = CONFIG.COLORS.hudBorder; g.strokeRect(lx - 5, ly, tw + 10, 18);
  g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
  g.fillText(l.label, lx, ly + 13);
  g.textAlign = 'left';
}

function drawWorldLandmark(g, l){
  const x = l.x*TILE - cam.x, y = l.y*TILE - cam.y;
  const w = l.w*TILE, h = l.h*TILE;
  if(x > VIEW_W || x + w < 0 || y > VIEW_H || y + h < 0) return;
  const type = l.type;

  if(type === 'pier' || type === 'bridge'){
    g.fillStyle = '#8a5a2b';
    for(let yy = y; yy < y+h; yy += 10) g.fillRect(x, yy, w, 4);
    g.fillStyle = '#5b3a1d';
    g.fillRect(x, y, 3, h); g.fillRect(x+w-3, y, 3, h);
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'statue'){
    const done = window.secretState && secretState.statue;
    const cx = x + w/2;
    /* 底座 */
    g.fillStyle = '#6f6a5a';
    g.fillRect(x+w*0.18, y+h*0.68, w*0.64, h*0.24);
    g.fillStyle = '#8a8574';
    g.fillRect(x+w*0.18, y+h*0.68, w*0.64, 4);
    /* 身体 + 头 */
    g.fillStyle = done ? '#8f9a86' : '#8a9280';
    g.fillRect(cx-w*0.16, y+h*0.34, w*0.32, h*0.38);
    g.beginPath(); g.arc(cx, y+h*0.28, w*0.13, 0, Math.PI*2); g.fill();
    /* 手臂 */
    g.fillRect(cx-w*0.28, y+h*0.40, w*0.13, h*0.06);
    g.fillRect(cx+w*0.15, y+h*0.40, w*0.13, h*0.06);
    /* 青苔 */
    g.fillStyle = 'rgba(95,138,58,.55)';
    g.fillRect(cx-w*0.15, y+h*0.52, w*0.10, h*0.06);
    g.fillRect(x+w*0.22, y+h*0.78, w*0.12, h*0.05);
    if(done){
      g.fillStyle = '#ffd76a';
      g.fillRect(cx-1, y+h*0.24, 3, 3);
    }
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'quarryrock'){
    const cut = l.cutDay === clock.day;
    const ORE_COLOR = { stone:'#d8d4c8', copper_ore:'#c07a3a', iron_ore:'#b8c4d0',
                        gold_ore:'#e8c24a', coal:'#3a3a42' };
    const speck = ORE_COLOR[l.ore] || '#d8d4c8';
    if(cut){
      /* 采过：只剩碎石子 */
      g.fillStyle = '#5f584e';
      g.beginPath(); g.ellipse(x+w*0.32, y+h*0.82, w*0.14, h*0.06, 0, 0, Math.PI*2); g.fill();
      g.beginPath(); g.ellipse(x+w*0.62, y+h*0.86, w*0.12, h*0.05, 0, 0, Math.PI*2); g.fill();
      g.fillStyle = '#7a7366';
      g.fillRect(x+w*0.28, y+h*0.76, w*0.10, 3);
      g.fillRect(x+w*0.60, y+h*0.80, w*0.08, 3);
    }else{
      /* 未采：灰岩块 + 矿脉斑点 */
      g.fillStyle = '#6f675c';
      g.beginPath();
      g.moveTo(x+w*0.12, y+h*0.82);
      g.lineTo(x+w*0.20, y+h*0.46);
      g.lineTo(x+w*0.42, y+h*0.26);
      g.lineTo(x+w*0.72, y+h*0.32);
      g.lineTo(x+w*0.88, y+h*0.60);
      g.lineTo(x+w*0.86, y+h*0.82);
      g.closePath(); g.fill();
      g.fillStyle = '#8f877a';
      g.beginPath();
      g.moveTo(x+w*0.24, y+h*0.48);
      g.lineTo(x+w*0.42, y+h*0.30);
      g.lineTo(x+w*0.56, y+h*0.42);
      g.lineTo(x+w*0.34, y+h*0.60);
      g.closePath(); g.fill();
      g.fillStyle = speck;
      const spots = [[0.34,0.52],[0.50,0.40],[0.60,0.52],[0.46,0.62],[0.70,0.48],[0.66,0.66]];
      for(const [sx, sy] of spots) g.fillRect(x+w*sx, y+h*sy, 3, 3);
    }
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(x+w*0.10, y+h*0.92, w*0.80, 3);
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'cart'){
    const cx = x + w/2;
    /* 影子 */
    g.fillStyle = 'rgba(0,0,0,.22)';
    g.beginPath(); g.ellipse(cx, y+h*0.90, w*0.40, h*0.08, 0, 0, Math.PI*2); g.fill();
    /* 车斗：木板 + 铁箍 */
    g.fillStyle = '#7a4f24';
    g.fillRect(x+w*0.14, y+h*0.42, w*0.72, h*0.40);
    g.fillStyle = '#8f6230';
    g.fillRect(x+w*0.14, y+h*0.42, w*0.72, 4);
    g.fillStyle = '#5c3a18';
    for(let i = 1; i < 4; i++) g.fillRect(x+w*0.14, y+h*0.42 + i*h*0.10, w*0.72, 3);
    g.fillRect(x+w*0.20, y+h*0.42, 4, h*0.40);
    g.fillRect(x+w*0.80, y+h*0.42, 4, h*0.40);
    /* 顶棚：条纹帆布 */
    g.fillStyle = '#e8dcc0';
    g.beginPath();
    g.moveTo(x+w*0.12, y+h*0.44);
    g.quadraticCurveTo(cx, y+h*0.02, x+w*0.88, y+h*0.44);
    g.closePath(); g.fill();
    g.save();
    g.clip();
    g.fillStyle = '#b8564a';
    for(let i = 0; i < 6; i += 2)
      g.fillRect(x+w*(0.12 + i*0.13), y, w*0.09, h*0.5);
    g.restore();
    g.strokeStyle = '#6b4a2a'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x+w*0.12, y+h*0.44);
    g.quadraticCurveTo(cx, y+h*0.02, x+w*0.88, y+h*0.44);
    g.stroke();
    /* 车轮 */
    for(const wx of [0.28, 0.72]){
      g.fillStyle = '#3a2a18';
      g.beginPath(); g.arc(x+w*wx, y+h*0.84, w*0.10, 0, Math.PI*2); g.fill();
      g.fillStyle = '#8a6a3a';
      g.beginPath(); g.arc(x+w*wx, y+h*0.84, w*0.05, 0, Math.PI*2); g.fill();
      g.strokeStyle = '#c8a25a'; g.lineWidth = 2;
      g.beginPath(); g.arc(x+w*wx, y+h*0.84, w*0.07, 0, Math.PI*2); g.stroke();
    }
    /* 拉车木杆 */
    g.fillStyle = '#6b4520';
    g.fillRect(x+w*0.86, y+h*0.66, w*0.10, 4);
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'sign'){
    g.fillStyle = '#5b3a1d'; g.fillRect(x+w/2-2, y+h/2, 4, h/2);
    g.fillStyle = '#7d5426'; g.fillRect(x, y, w, h/2);
    g.fillStyle = '#f4e6bc'; g.fillRect(x+4, y+4, w-8, 3);
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'mine' || type === 'log'){
    const mx = x + w*0.12, my = y + h*0.28, mw = w*0.76, mh = h*0.68;
    g.fillStyle = type === 'mine' ? '#5a5a64' : '#5b3a1d';
    g.fillRect(mx, my, mw, mh);
    g.fillStyle = type === 'mine' ? '#7a7a86' : '#7d5426';
    g.fillRect(mx, my, mw, 5);
    g.fillStyle = '#16161c';
    g.beginPath();
    g.moveTo(mx+mw*0.32, my+mh); g.lineTo(mx+mw*0.32, my+mh*0.45);
    g.quadraticCurveTo(mx+mw/2, my, mx+mw*0.68, my+mh*0.45);
    g.lineTo(mx+mw*0.68, my+mh); g.closePath(); g.fill();
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'stump'){
    const cut = l.cutDay === clock.day;
    const cx = x + w/2;
    /* 影子 + 树根 */
    g.fillStyle = 'rgba(0,0,0,.20)';
    g.beginPath(); g.ellipse(cx, y+h*0.90, w*0.40, h*0.10, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#4a2f16';
    g.beginPath(); g.ellipse(cx, y+h*0.84, w*0.36, h*0.13, 0, 0, Math.PI*2); g.fill();
    g.fillRect(cx-w*0.34, y+h*0.62, w*0.68, h*0.20);
    /* 树桩侧面 + 树皮 */
    g.fillStyle = '#6b4520';
    g.fillRect(cx-w*0.24, y+h*0.32, w*0.48, h*0.52);
    g.fillStyle = '#5a381b';
    g.fillRect(cx+w*0.06, y+h*0.32, w*0.18, h*0.52);
    g.fillStyle = '#7d5426';
    g.fillRect(cx-w*0.24, y+h*0.32, 2, h*0.52);
    /* 断面 */
    g.fillStyle = cut ? '#c9a163' : '#8a6a3a';
    g.beginPath(); g.ellipse(cx, y+h*0.32, w*0.27, h*0.15, 0, 0, Math.PI*2); g.fill();
    if(cut){
      /* 今天已经砍过：露出新鲜年轮 */
      g.strokeStyle = '#a17b42'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(cx, y+h*0.32, w*0.16, h*0.09, 0, 0, Math.PI*2); g.stroke();
      g.beginPath(); g.ellipse(cx, y+h*0.32, w*0.07, h*0.04, 0, 0, Math.PI*2); g.stroke();
    }else{
      /* 还没砍：断面覆着青苔 */
      g.fillStyle = '#5f8a3a';
      g.fillRect(cx-w*0.14, y+h*0.25, w*0.12, h*0.07);
      g.fillRect(cx+w*0.04, y+h*0.30, w*0.09, h*0.05);
    }
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'tent'){
    g.fillStyle = '#c9a24a';
    g.beginPath(); g.moveTo(x+w/2, y); g.lineTo(x+w, y+h); g.lineTo(x, y+h); g.closePath(); g.fill();
    g.fillStyle = '#8a6a2a'; g.fillRect(x+w/2-3, y+h*0.55, 6, h*0.45);
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }
  if(type === 'tower'){
    g.fillStyle = landmarkColor(type); g.fillRect(x+w*0.2, y+h*0.28, w*0.6, h*0.72);
    g.fillStyle = '#4a3068';
    g.beginPath(); g.moveTo(x+w/2, y-8); g.lineTo(x+w*0.9, y+h*0.28); g.lineTo(x+w*0.1, y+h*0.28); g.closePath(); g.fill();
    g.fillStyle = '#ffe08a'; g.fillRect(x+w*0.38, y+h*0.48, w*0.24, h*0.14);
    drawLandmarkLabel(g, l, x, y, w, h);
    return;
  }

  /* 房屋类：临街墙面 + 屋顶 + 门 + 窗 */
  const wall = type === 'guild' ? '#8a8a96' : (type === 'fishshop' ? '#7a9ab0' : '#b07a4a');
  const roof = type === 'ranch' ? '#b3443c' : (type === 'fishshop' ? '#4f8fbf' : '#7a4a2a');
  const fx = x + w*0.18, fw = w*0.64;
  const fy = y + h*0.30, fh = Math.max(14, h*0.22);
  const ry = fy + fh, rh = Math.max(18, h*0.40);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x+w*0.16, y+h*0.94, w*0.68, 5);
  g.fillStyle = wall; g.fillRect(fx, fy, fw, fh);
  g.fillStyle = 'rgba(60,36,20,.22)'; g.fillRect(fx, fy+fh-3, fw, 3);
  g.fillStyle = '#5b3a1d'; g.fillRect(x+w/2-5, fy+fh*0.35, 10, fh*0.65);
  g.fillStyle = '#9ec4d8';
  g.fillRect(fx+8, fy+5, 10, 8);
  g.fillRect(fx+fw-18, fy+5, 10, 8);
  g.fillStyle = roof; g.fillRect(fx-3, ry, fw+6, rh);
  g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(fx-3, ry, fw+6, 4);
  g.fillStyle = 'rgba(40,20,10,.25)';
  for(let yy = ry+10; yy < ry+rh-4; yy += 9) g.fillRect(fx, yy, fw, 1);
  g.fillStyle = '#5a3218'; g.fillRect(fx-3, ry, fw+6, 3);
  g.strokeStyle = '#4a2a14'; g.lineWidth = 1; g.strokeRect(fx-3.5, ry+0.5, fw+7, rh-1);
  if(type === 'ranch' || type === 'fishshop'){
    g.fillStyle = '#e8dcc0'; g.fillRect(fx-2, ry+4, fw+4, 2);
  }
  drawLandmarkLabel(g, l, x, y, w, h);
}

function worldLandmarks(){
  const st = MAP_WORLD[currentMap];
  return (st && st.landmarks) ? st.landmarks : [];
}
function worldLandmarkSolid(tx, ty){
  const st = MAP_WORLD[currentMap];
  if(!st || currentMap === 'valley') return false;
  for(const l of (st.landmarks || [])){
    if(l.solid === false) continue;
    if(tx >= l.x && tx < l.x + l.w && ty >= l.y && ty < l.y + l.h) return true;
  }
  return false;
}
function worldLandmarkColor(type){ return landmarkColor(type); }

Object.assign(window, {
  MAP_DEFS, INTERIORS, worldRegisterValley, worldUseArrays, worldActivate, worldSwitch, worldExitCheck,
  worldLandmarks, worldLandmarkSolid, worldLandmarkNear, worldEnterLandmark, worldCutStump, worldMineRock,
  worldDailySerialize, worldDailyDeserialize, secretState, worldStatueInteract,
  worldSecretSerialize, worldSecretDeserialize, worldSecretReset,
  drawWorldLandmark, worldLandmarkColor, ensureWorld
});
export {
  MAP_DEFS, INTERIORS, worldRegisterValley, worldUseArrays, worldActivate, worldSwitch, worldExitCheck,
  worldLandmarks, worldLandmarkSolid, worldLandmarkNear, worldEnterLandmark, worldCutStump, worldMineRock,
  worldDailySerialize, worldDailyDeserialize, secretState, worldStatueInteract,
  worldSecretSerialize, worldSecretDeserialize, worldSecretReset,
  drawWorldLandmark, worldLandmarkColor, ensureWorld
};
