/* js/world/map.js —— 由 index.html 拆分，原行 2333–2650 */
'use strict';

/* --- 第 12 轮性能：静态地面预渲染到离屏 Canvas，只重绘变化格 ---
 * 64×64 格 × 32px = 2048×2048，正好一块离屏画布。
 * 烘焙是「懒」的：只有摄像机看得到的格子才会被画进离屏画布；
 * 地块变了（锄地 / 浇水 / 收获 / 翻地）只把那一格标脏，下一帧只重画那一格。 */
const groundCv  = document.createElement('canvas');
groundCv.width  = MAP_W * TILE;
groundCv.height = MAP_H * TILE;
const groundCtx = groundCv.getContext('2d');
const groundBaked = new Uint8Array(MAP_W * MAP_H);   /* 1 = 这一格已经画进离屏画布 */
const groundDirty = new Set();                      /* 需要重新烘焙的格子下标 */
window.groundBakedCount = 0;                           /* 已烘焙的格子数（调试用） */
function markGroundDirty(i){ groundDirty.add(i); }
function invalidateGround(){ groundBaked.fill(0); groundDirty.clear(); groundBakedCount = 0; }
/* 改地块的统一入口：写 map 并把这一格标脏（下一帧只重画它） */
function setTile(i, t){
  const wasTilled = (map[i] === T.TILLED || map[i] === T.WATERED);
  const nowTilled = (t === T.TILLED || t === T.WATERED);
  if(wasTilled !== nowTilled) tilledCount += nowTilled ? 1 : -1;   /* 第 22 轮：耕地数增量维护 */
  map[i] = t;
  ratingInvalidate();                     /* 第 21 轮：耕地格数可能变了 → 评级缓存失效 */
  if(CONFIG.PERF.BAKE_GROUND) markGroundDirty(i);
}

/* --- 第 23 轮：小地图（离屏 canvas，每 0.5 秒重绘一次；画在右上角评级 HUD 下方） --- */
const miniCv = document.createElement('canvas');
miniCv.width  = CONFIG.MINIMAP.SIZE;
miniCv.height = CONFIG.MINIMAP.SIZE;
const miniCtx = miniCv.getContext('2d');
window.miniTimer = 0;          /* 距下次重绘的秒数 */
window.miniReady = false;      /* 离屏画布是否已经画过东西 */
function minimapTileColor(t){
  const C = CONFIG.TILE_COLORS;
  if(t === T.TILLED)  return C.tilled;
  if(t === T.WATERED) return C.watered;
  if(t === T.DIRT)    return C.dirt;
  if(t === T.WATER)   return C.water;
  if(t === T.BARE)    return C.bare;
  if(t === T.TREE)    return C.treeLeaf;
  if(t === T.ROCK)    return C.rock;
  if(t === T.FLOWER)  return C.flowers[0];
  /* 城镇地块：让全屏地图能看出街道、房子和门 */
  if(t === T.PATH) return '#b9b3a6';
  if(t === T.DOOR) return '#e2c14a';
  if(t === T.FLOOR) return '#b5844f';
  if(t === T.WALL_BACK || t === T.WALL_FRONT || t === T.HOUSE) return '#7a5a3a';
  if(t === T.SHOP) return '#5b86ad';
  return C.grass;
}
/* 第 25 轮：小地图上的 NPC 点按「他现在的状态」着色
 *   营业中 = 黄点 / 瞎逛 = 橙点 / 在家 = 蓝点 / 睡觉·外出·赶集 = 不显示
 * （单独拎成一个函数 → 规则一眼能看懂，也能直接测） */
function minimapNpcColor(st){
  if(!st) return null;
  const M = CONFIG.MINIMAP;
  if(st.type === 'work')   return M.NPC_OPEN;      /* 营业中（黄点） */
  if(st.type === 'wander') return M.NPC_WANDER;    /* 瞎逛（橙点） */
  if(st.type === 'home')   return M.NPC_HOME;      /* 在家（蓝点） */
  if(st.type === 'visit')  return M.NPC_OPEN;      /* 来访农场（黄点） */
  return null;                                     /* sleep / away / festival：不显示 */
}
function rebuildMinimap(){
  const M = CONFIG.MINIMAP, S = M.SIZE, K = M.SCALE;
  const TW = Math.floor(S / K), TH = Math.floor(S / K);
  const local = (typeof currentMap !== 'undefined' && currentMap !== 'valley');
  const ptx = Math.floor(player.x / TILE), pty = Math.floor(player.y / TILE);
  const ox = local ? clamp(ptx - Math.floor(TW/2), 0, MAP_W - TW) : FARM.x;
  const oy = local ? clamp(pty - Math.floor(TH/2), 0, MAP_H - TH) : FARM.y;
  miniCtx.clearRect(0, 0, S, S);
  miniCtx.fillStyle = CONFIG.COLORS.hudBg;
  miniCtx.fillRect(0, 0, S, S);
  for(let y = 0; y < TH; y++){
    for(let x = 0; x < TW; x++){
      const tx = ox + x, ty = oy + y;
      if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      const i = ty*MAP_W + tx;
      miniCtx.fillStyle = minimapTileColor(map[i]);
      miniCtx.fillRect(x*K, y*K, K, K);
      if(roads[i]){ miniCtx.fillStyle = CONFIG.TILE_COLORS.roadStone; miniCtx.fillRect(x*K, y*K, K, K); }
    }
  }
  if(local && typeof worldLandmarks === 'function'){
    for(const l of worldLandmarks()){
      const lx = Math.max(0, l.x - ox), ly = Math.max(0, l.y - oy);
      const rx = Math.min(TW, l.x + l.w - ox), ry = Math.min(TH, l.y + l.h - oy);
      if(rx <= lx || ry <= ly) continue;
      miniCtx.fillStyle = (typeof worldLandmarkColor === 'function') ? worldLandmarkColor(l.type) : '#b08968';
      miniCtx.fillRect(lx*K, ly*K, (rx-lx)*K, (ry-ly)*K);
    }
  } else {
    miniCtx.fillStyle = M.HOUSE;
    miniCtx.fillRect((HOUSE_POS.x-ox)*K, (HOUSE_POS.y-oy)*K, HOUSE_POS.w*K, HOUSE_POS.h*K);
    miniCtx.fillStyle = M.SHOP;
    miniCtx.fillRect((SHOP_POS.x-ox)*K, (SHOP_POS.y-oy)*K, SHOP_POS.w*K, SHOP_POS.h*K);
  }
  if(true){
    for(const d of CONFIG.NPC.LIST){
      const p = npcPos(d);
      if(!p) continue;
      if(p.map !== currentMap) continue;
      if(p.tx < ox || p.tx >= ox + TW || p.ty < oy || p.ty >= oy + TH) continue;
      const st = npcWhere(d);
      const col = minimapNpcColor(st);
      if(!col) continue;
      miniCtx.fillStyle = col;
      miniCtx.fillRect((p.tx-ox)*K + ((K>>1) - 1), (p.ty-oy)*K + ((K>>1) - 1), 3, 3);
    }
  }
  const px = Math.floor(player.x/TILE), py = Math.floor(player.y/TILE);
  const cx = clamp(px - ox + 0.5, 0, TW) * K - 2;
  const cy = clamp(py - oy + 0.5, 0, TH) * K - 2;
  miniCtx.fillStyle = M.PLAYER;
  miniCtx.fillRect(cx, cy, 4, 4);
  miniReady = true;
}
window.hudMiniRect = {x:0, y:0, w:0, h:0};   /* 第 28 轮：小地图可点击区域（点开全屏地图） */
function drawMinimap(g){
  if(!miniReady) return;
  const M = CONFIG.MINIMAP;
  const x = VIEW_W - M.SIZE - M.MARGIN, y = M.TOP;
  hudMiniRect = {x:x - 2, y:y - 2, w:M.SIZE + 4, h:M.SIZE + 4};   /* 第 28 轮：可点击区域 */
  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(x-2, y-2, M.SIZE+4, M.SIZE+4);
  g.strokeStyle = CONFIG.COLORS.hudBorder; g.strokeRect(x-2, y-2, M.SIZE+4, M.SIZE+4);
  g.drawImage(miniCv, x, y);
}
/* 第 28 轮：点小地图 → 打开全屏地图 */
function hitHudMini(p){
  if(!hudMiniRect || hudMiniRect.w <= 0) return false;
  return p.x >= hudMiniRect.x - 2 && p.x <= hudMiniRect.x + hudMiniRect.w + 2 &&
         p.y >= hudMiniRect.y - 2 && p.y <= hudMiniRect.y + hudMiniRect.h + 2;
}
/* --- 第 28 轮：全屏地图（整个 64×64 世界 + 居民状态色点 + 玩家） --- */
window.bigmapOpen = false;
const bigmapEl = document.getElementById('bigmap');
const bigmapMaskEl = document.getElementById('bigmapMask');
const bigmapCvEl = document.getElementById('bigmapCv');
const bigmapSubEl = document.getElementById('bigmapSub');
function renderBigmap(){
  const cv = bigmapCvEl;
  if(!cv || !cv.getContext) return;
  const g = cv.getContext('2d');
  const PAD = 8;
  const K = Math.max(1, Math.floor(Math.min((cv.width - PAD*2) / MAP_W, (cv.height - PAD*2) / MAP_H)));
  const PX = Math.floor((cv.width - MAP_W * K) / 2);
  const PY = Math.floor((cv.height - MAP_H * K) / 2);
  g.fillStyle = '#0c1018';
  g.fillRect(0, 0, cv.width, cv.height);
  /* 地块 + 石板路 */
  for(let y = 0; y < MAP_H; y++){
    for(let x = 0; x < MAP_W; x++){
      const i = y * MAP_W + x;
      g.fillStyle = minimapTileColor(map[i]);
      g.fillRect(PX + x * K, PY + y * K, K, K);
      if(roads[i]){
        g.fillStyle = CONFIG.TILE_COLORS.roadStone;
        g.fillRect(PX + x * K, PY + y * K, K, K);
      }
    }
  }
  /* 城镇建筑：按每栋自己的 row 画矩形（只有小镇地图） */
  const C = CONFIG.TOWN;
  if(typeof currentMap !== 'undefined' && currentMap === 'valley'){
    for(const b of (C.LIST || [])){
      const row = b.row || C.ROOM_ROW;
      g.fillStyle = (b.kind === 'shop') ? CONFIG.MINIMAP.SHOP : '#b08968';
      g.fillRect(PX + b.x * K, PY + row * K, b.w * K, C.ROOM_H * K);
      g.fillStyle = '#f4d35e';
      g.fillRect(PX + (b.x + C.DOOR_DX) * K, PY + row * K, Math.max(1, K), Math.max(1, K));
    }
  }
  /* 农舍（农场地图） */
  if(typeof currentMap === 'undefined' || currentMap === 'farm'){
    g.fillStyle = CONFIG.MINIMAP.HOUSE;
    g.fillRect(PX + HOUSE_POS.x * K, PY + HOUSE_POS.y * K, HOUSE_POS.w * K, HOUSE_POS.h * K);
  }
  /* 新地图地标 */
  if(typeof worldLandmarks === 'function'){
    for(const l of worldLandmarks()){
      g.fillStyle = (typeof worldLandmarkColor === 'function') ? worldLandmarkColor(l.type) : '#b08968';
      g.fillRect(PX + l.x * K, PY + l.y * K, l.w * K, l.h * K);
    }
  }
  /* 居民（按当前状态着色：营业黄 / 瞎逛橙 / 在家蓝；睡觉外出不画） */
  for(const d of CONFIG.NPC.LIST){
    const p = npcPos(d);
    if(!p || p.map !== currentMap) continue;
    const col = minimapNpcColor(npcWhere(d));
    if(!col) continue;
    g.fillStyle = col;
    g.fillRect(PX + p.tx * K + (K >> 1) - 2, PY + p.ty * K + (K >> 1) - 2, 4, 4);
  }
  /* 玩家（白点） */
  const px = Math.floor(player.x / TILE), py = Math.floor(player.y / TILE);
  g.fillStyle = CONFIG.MINIMAP.PLAYER;
  g.fillRect(PX + px * K + (K >> 1) - 2, PY + py * K + (K >> 1) - 2, 5, 5);
  if(bigmapSubEl) bigmapSubEl.textContent = (typeof mapDisplayName !== 'undefined' ? mapDisplayName + ' · ' : '') +
    ((typeof currentMap !== 'undefined' && currentMap === 'farm') ? (farmTypeDef(farmType).name + ' · ') : '') +
    '第 ' + clock.day + ' 天 · ' + weather.icon + ' ' + weather.name;
}
function bigmapOpenPanel(){
  if(bigmapOpen) return false;
  bigmapOpen = true;
  renderBigmap();
  setPanelOpen(bigmapEl, true);
  playSfx(700, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  return true;
}
function bigmapClosePanel(){
  if(!bigmapOpen) return false;
  bigmapOpen = false;
  setPanelOpen(bigmapEl, false);
  return true;
}
function toggleBigmap(v){
  if(v === undefined) v = !bigmapOpen;
  return v ? bigmapOpenPanel() : bigmapClosePanel();
}
if(bigmapMaskEl) bigmapMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); toggleBigmap(false); });

/* 中央空地 + 建筑位置（全部由 CONFIG 推导） */
const FARM = {
  x: Math.floor((MAP_W - CONFIG.GEN.FARM_W) / 2),
  y: (CONFIG.GEN.FARM_Y || Math.floor((MAP_H - CONFIG.GEN.FARM_H) / 2)),
  w: CONFIG.GEN.FARM_W, h: CONFIG.GEN.FARM_H
};
const HOUSE_POS = {x:FARM.x + 1, y:FARM.y, w:CONFIG.GEN.HOUSE_W, h:CONFIG.GEN.HOUSE_H};
/* 第 24 轮：商店从「农场里的摊位」搬到了镇上的杂货店（能走进去）
 * SHOP_POS 现在指的是镇上杂货店的外框；真正交易的地方在店内柜台（townCounterSpot） */
const TOWN_SHOP = CONFIG.TOWN.LIST.find(b => b.kind === 'shop');
const SHOP_POS  = {x:TOWN_SHOP.x, y:(TOWN_SHOP.row || CONFIG.TOWN.ROOM_ROW), w:TOWN_SHOP.w, h:CONFIG.TOWN.ROOM_H};
/* 委托板（第 16 轮）：放在商店西侧 3 格，离商店的交互半径不重叠 */
const QUEST_BOARD = {x:SHOP_POS.x - 3, y:SHOP_POS.y, w:1, h:1};
const SPAWN = {x:FARM.x + Math.floor(FARM.w/2), y:FARM.y + Math.floor(FARM.h/2) + 2};

/* 第 37 轮：农场类型（开局选择；旧存档默认标准农场）
 * 类型只影响农场空地内部的地形和野外植被密度，不改变农舍 / 出生点 / 去镇上的主路。 */
let farmType = CONFIG.GEN.FARM_DEFAULT || 'standard';
window.farmType = farmType;              /* 兼容其它模块用全局名读取（Object.assign 会固化 getter，这里直接维护） */
function farmTypeDef(id){
  const L = CONFIG.GEN.FARM_TYPES.LIST;
  return L[id] || L[CONFIG.GEN.FARM_DEFAULT] || L.standard;
}
function setFarmType(id){
  const L = CONFIG.GEN.FARM_TYPES.LIST;
  farmType = (typeof id === 'string' && L[id]) ? id : CONFIG.GEN.FARM_DEFAULT;
  window.farmType = farmType;
  return farmType;
}
/* 第 40 轮：地图归属 */
function isFarmMap(id){ id = id || (typeof currentMap !== 'undefined' ? currentMap : 'farm'); return id === 'farm'; }
function isTownMap(id){ id = id || (typeof currentMap !== 'undefined' ? currentMap : 'valley'); return id === 'valley'; }
function isHomesteadMap(id){ return isFarmMap(id) || isTownMap(id); }

const inFarm = (x,y)=> x>=FARM.x && x<FARM.x+FARM.w && y>=FARM.y && y<FARM.y+FARM.h;
const clamp = (v,a,b)=> v<a?a:(v>b?b:v);
const lerp  = (a,b,t)=> a+(b-a)*t;

/* --- 带种子的伪随机 --- */
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(x,y,s){
  let n = Math.imul(x|0, 374761393) + Math.imul(y|0, 668265263) + Math.imul(s|0, 1442695041);
  n = Math.imul(n ^ (n>>>13), 1274126177);
  return ((n ^ (n>>>16)) >>>0) / 4294967296;
}
function hash2(x,y){ return hashSeed(x,y,0); }

/* --- 平滑值噪声（用于成片的水塘） --- */
function valueNoise(x,y,freq,seed){
  const fx = x*freq, fy = y*freq;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx-x0, ty = fy-y0;
  const sx = tx*tx*(3-2*tx), sy = ty*ty*(3-2*ty);
  const a = lerp(hashSeed(x0,y0,seed),   hashSeed(x0+1,y0,seed),   sx);
  const b = lerp(hashSeed(x0,y0+1,seed), hashSeed(x0+1,y0+1,seed), sx);
  return lerp(a,b,sy);
}
function fbm(x,y,seed){
  return valueNoise(x,y,CONFIG.GEN.NOISE_FREQ,  seed)  * 0.65 +
         valueNoise(x,y,CONFIG.GEN.NOISE_FREQ2, seed+1) * 0.35;
}

/* --- 第 24 轮：盖镇子 ---
 * 原则 A：建筑是地图的容器，不是场景。
 * 一栋房子 = 外墙（实心）+ 大门（踩上去就进去）+ 室内墙 + 木地板 + 家具，
 * 全部是 map 上的格子；进屋 = 走过门格，代码里没有任何「当前场景」变量。
 * 镇子在地图南边（38~62 行），从农场的南边直接走下去就是街。 */
function genTown(){
  const C = CONFIG.TOWN;
  /* 1) 整条城镇带清空，铺四排横向街道 + 一条南北主路 */
  for(let y=C.ROW;y<=C.END_ROW;y++)
    for(let x=1;x<MAP_W-1;x++) map[y*MAP_W+x] = T.GRASS;
  for(const street of (C.STREET_ROWS || [C.STREET_ROW]))
    for(let x=1;x<MAP_W-1;x++) map[street*MAP_W+x] = T.PATH;
  const cx = C.CONNECTOR_X == null ? 64 : C.CONNECTOR_X;
  for(let x=cx;x<=cx+1;x++){
    for(let y=1;y<=C.END_ROW;y++) map[y*MAP_W+x] = T.PATH;   /* 北入口 → 四排住宅 */
  }

  /* 2) 住宅 / 商店：每栋按自己的 row 盖墙、地板、门 */
  for(const b of C.LIST){
    stampBuilding(buildingDef(b.id), false);                       /* 墙 / 地板 / 门 */
  }
}

/* --- 第 37 轮：农场类型的地形装饰 ---
 * 在「中央空地已清成草地」之后、盖农舍之前调用。
 * 只改农场空地内部；后续 openFarmCorridors() 会把主路重新打通。 */
function genFarmFeatures(rnd, ft){
  const x0 = FARM.x, y0 = FARM.y;
  /* 河流农场：一条 2 格宽的河从北向南穿过农场东半边 */
  if(ft.river){
    for(let y=y0; y<y0+FARM.h; y++){
      const off = Math.round(Math.sin((y - y0) * 0.7) * 1.1);
      const cx = x0 + Math.floor(FARM.w * 0.64) + off;
      for(let k=0; k<2; k++){
        const x = cx + k;
        if(x <= x0 || x >= x0 + FARM.w) continue;
        map[y*MAP_W + x] = T.WATER;
      }
    }
  }
  /* 水塘：标准 / 森林农场西南角，山顶农场东北角 */
  if(ft.pond){
    const px = x0 + FARM.w - 7, py = y0 + 3;
    for(let y=py; y<=py+2; y++)
      for(let x=px; x<=px+3; x++) map[y*MAP_W + x] = T.WATER;
  }else if(!ft.river){
    const px = x0 + 2, py = y0 + FARM.h - 5;
    for(let y=py; y<=py+2; y++)
      for(let x=px; x<=px+3; x++) map[y*MAP_W + x] = T.WATER;
  }
  /* 农场里也保留一些可砍的树 / 可敲的石头（森林 / 山顶更多） */
  const tree = (typeof ft.farmTree === 'number') ? ft.farmTree : 0.035;
  const rock = (typeof ft.farmRock === 'number') ? ft.farmRock : 0.02;
  if(tree > 0 || rock > 0){
    for(let y=y0; y<y0+FARM.h; y++)
      for(let x=x0; x<x0+FARM.w; x++){
        /* 中央 24×14 留作可耕地 / 出生点，树石只长在农场边缘 */
        if(x >= x0+3 && x < x0+FARM.w-3 && y >= y0+3 && y < y0+FARM.h-5) continue;
        const i = y*MAP_W + x;
        if(map[i] !== T.GRASS) continue;
        const r = rnd();
        if(r < tree) map[i] = T.TREE;
        else if(r < tree + rock) map[i] = T.ROCK;
      }
  }
}
/* 无论选哪种农场，农舍门口、出生点和去镇上的路必须连成一片 */
function openFarmCorridors(ft){
  const ex = (CONFIG.TOWN.CONNECTOR_X == null) ? 64 : CONFIG.TOWN.CONNECTOR_X;
  /* 南北主路：北边山地出口 → 农场 → 南边小镇出口 */
  for(let y=1; y<MAP_H-1; y++){
    map[y*MAP_W + ex] = T.PATH;
    map[y*MAP_W + ex + 1] = T.PATH;
  }
  /* 河流农场：在出生点高度横铺一条桥，别让河把农场切成两半 */
  if(ft && ft.river){
    for(let x=FARM.x; x<FARM.x+FARM.w; x++) map[SPAWN.y*MAP_W + x] = T.PATH;
  }
  const fx = HOUSE_POS.x + 1;                            /* 农舍大门正下方 */
  const hy = FARM.y + FARM.h + 1;
  for(let y=HOUSE_POS.y+HOUSE_POS.h; y<=hy; y++) map[y*MAP_W + fx] = T.PATH;   /* 农舍 → 横向小路 */
  for(let x=fx; x<=ex+1; x++) map[hy*MAP_W + x] = T.PATH;                     /* 横向小路 → 主路 */
  for(let y=SPAWN.y-1; y<=SPAWN.y+1; y++)                 /* 出生点 3×3 */
    for(let x=SPAWN.x-1; x<=SPAWN.x+1; x++) map[y*MAP_W + x] = T.GRASS;
}

/* --- 地图生成 --- */
function genMap(seed, typeId){
  if(typeId !== undefined) setFarmType(typeId);
  const ft = farmTypeDef(farmType);
  const rnd = mulberry32(seed);
  map.fill(T.GRASS);
  crops.fill(null);

  /* 1) 外围一圈水：天然边界 */
  for(let x=0;x<MAP_W;x++){ map[x] = T.WATER; map[(MAP_H-1)*MAP_W+x] = T.WATER; }
  for(let y=0;y<MAP_H;y++){ map[y*MAP_W] = T.WATER; map[y*MAP_W+MAP_W-1] = T.WATER; }

  /* 2) 噪声水塘（成片分布），中央空地除外 */
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    if(inFarm(x,y)) continue;
    if(fbm(x,y,seed) > CONFIG.GEN.WATER_LEVEL) map[y*MAP_W+x] = T.WATER;
  }

  /* 3) 泥土斑块 */
  for(let k=0;k<CONFIG.GEN.DIRT_PATCHES;k++){
    const w = 2 + ((rnd()*3)|0), h = 2 + ((rnd()*2)|0);
    const px = 2 + ((rnd()*(MAP_W-w-4))|0), py = 2 + ((rnd()*(MAP_H-h-4))|0);
    for(let y=py;y<py+h;y++) for(let x=px;x<px+w;x++){
      if(inFarm(x,y)) continue;
      if(map[y*MAP_W+x] === T.GRASS) map[y*MAP_W+x] = T.DIRT;
    }
  }

  /* 4) 中央 12×12 强制空地（纯草地，无任何随机物件） */
  for(let y=FARM.y;y<FARM.y+FARM.h;y++)
    for(let x=FARM.x;x<FARM.x+FARM.w;x++) map[y*MAP_W+x] = T.GRASS;

  /* 5) 树 / 岩石 / 野花（只在草地上，且避开空地；密度按农场类型微调） */
  const treeChance = (typeof ft.tree === 'number') ? ft.tree : CONFIG.GEN.TREE_CHANCE;
  const rockChance = (typeof ft.rock === 'number') ? ft.rock : CONFIG.GEN.ROCK_CHANCE;
  const flowerChance = (typeof ft.flower === 'number') ? ft.flower : CONFIG.GEN.FLOWER_CHANCE;
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    if(inFarm(x,y)) continue;
    const i = y*MAP_W+x;
    if(map[i] !== T.GRASS) continue;
    const r = rnd();
    if(r < treeChance) map[i] = T.TREE;
    else if(r < treeChance + rockChance) map[i] = T.ROCK;
    else if(r < treeChance + rockChance + flowerChance) map[i] = T.FLOWER;
  }

  /* 5b) 第 37 轮：农场类型地形（河流 / 树林 / 矿脉 / 水塘） */
  genFarmFeatures(rnd, ft);
  /* 5c) 农舍门口 → 出生点 → 镇上的主路永远保通 */
  openFarmCorridors(ft);

  /* 6) 建筑（小屋 1 间，在空地内上缘） */
  for(let y=HOUSE_POS.y;y<HOUSE_POS.y+HOUSE_POS.h;y++)
    for(let x=HOUSE_POS.x;x<HOUSE_POS.x+HOUSE_POS.w;x++) map[y*MAP_W+x] = T.HOUSE;

  /* 第 40 轮：农场和小镇拆成两张独立地图；genMap 只生成农场。
   * 小镇由 genTownMap() 单独生成。 */

  /* 整张地图重画了 → 离屏画布里的烘焙结果全部作废 */
  invalidateGround();
  tilledCount = 0;                         /* 第 22 轮：新地图没有耕地，增量计数归零 */

  const cnt = [0,0,0,0,0,0,0,0];
  for(let i=0;i<map.length;i++) cnt[map[i]]++;  let farmWild = 0;
  for(let y=FARM.y;y<FARM.y+FARM.h;y++) for(let x=FARM.x;x<FARM.x+FARM.w;x++){
    const t = map[y*MAP_W+x];
    if(t===T.TREE||t===T.ROCK||t===T.FLOWER) farmWild++;
  }
  dlog('[map] farm type=' + farmType + ' seed=' + seed + ' | grass=' + cnt[T.GRASS] + ' dirt=' + cnt[T.DIRT] +
    ' water=' + cnt[T.WATER] + ' tree=' + cnt[T.TREE] + ' rock=' + cnt[T.ROCK] +
    ' flower=' + cnt[T.FLOWER] + ' house=' + cnt[T.HOUSE] +
    ' | farm ' + FARM.w + 'x' + FARM.h + ' wild-in-farm=' + farmWild);
  return cnt;
}

/* --- 第 40 轮：鹈鹕镇独立地图 ---
 * 沿用原来的四排住宅坐标（row 42~96），北边留出草地 / 树林和通往农场的路。 */
function genTownMap(seed){
  const C = CONFIG.TOWN;
  const rnd = mulberry32(seed ^ 0x5bd1e995);
  map.fill(T.GRASS);
  crops.fill(null);
  roads.fill(0);
  buildings.length = 0; buildIndex.fill(-1);
  /* 外围水边界 */
  for(let x=0;x<MAP_W;x++){ map[x] = T.WATER; map[(MAP_H-1)*MAP_W+x] = T.WATER; }
  for(let y=0;y<MAP_H;y++){ map[y*MAP_W] = T.WATER; map[y*MAP_W+MAP_W-1] = T.WATER; }
  /* 北边草地：少量水塘 / 泥土 / 树，避开主路 */
  for(let y=2;y<C.ROW-2;y++) for(let x=2;x<MAP_W-2;x++){
    if(Math.abs(x - C.CONNECTOR_X) <= 3) continue;
    const i = y*MAP_W+x;
    if(fbm(x,y,seed+7) > 0.78) map[i] = T.WATER;
    else if(rnd() < 0.16) map[i] = T.TREE;
    else if(rnd() < 0.05) map[i] = T.FLOWER;
  }
  /* 南边海岸前的草地 */
  for(let y=C.END_ROW+1;y<MAP_H-1;y++) for(let x=2;x<MAP_W-2;x++){
    if(Math.abs(x - C.CONNECTOR_X) <= 3) continue;
    const r = rnd();
    if(r < 0.10) map[y*MAP_W+x] = T.TREE;
    else if(r < 0.14) map[y*MAP_W+x] = T.FLOWER;
  }
  genTown();                    /* 街道 / 住宅 / 商店 / 主路 */
  /* 南边出口：从最后一排街道一直铺到地图下边缘 */
  for(let y=C.END_ROW;y<MAP_H-1;y++){
    map[y*MAP_W+C.CONNECTOR_X] = T.PATH;
    map[y*MAP_W+C.CONNECTOR_X+1] = T.PATH;
  }
  invalidateGround();
  return true;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { groundCv, groundCtx, groundBaked, groundDirty, miniCv, miniCtx, bigmapEl, bigmapMaskEl, bigmapCvEl, bigmapSubEl, FARM, HOUSE_POS, TOWN_SHOP, SHOP_POS, QUEST_BOARD, SPAWN, inFarm, clamp, lerp, markGroundDirty, invalidateGround, setTile, minimapTileColor, minimapNpcColor, rebuildMinimap, drawMinimap, hitHudMini, renderBigmap, bigmapOpenPanel, bigmapClosePanel, toggleBigmap, mulberry32, hashSeed, hash2, valueNoise, fbm, genTown, genTownMap, genMap, farmTypeDef, setFarmType, isFarmMap, isTownMap, isHomesteadMap, genFarmFeatures, openFarmCorridors });
export { groundCv, groundCtx, groundBaked, groundDirty, miniCv, miniCtx, bigmapEl, bigmapMaskEl, bigmapCvEl, bigmapSubEl, FARM, HOUSE_POS, TOWN_SHOP, SHOP_POS, QUEST_BOARD, SPAWN, inFarm, clamp, lerp, markGroundDirty, invalidateGround, setTile, minimapTileColor, minimapNpcColor, rebuildMinimap, drawMinimap, hitHudMini, renderBigmap, bigmapOpenPanel, bigmapClosePanel, toggleBigmap, mulberry32, hashSeed, hash2, valueNoise, fbm, genTown, genTownMap, genMap, farmType, farmTypeDef, setFarmType, isFarmMap, isTownMap, isHomesteadMap, genFarmFeatures, openFarmCorridors };
