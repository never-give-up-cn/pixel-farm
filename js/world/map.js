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
  miniCtx.clearRect(0, 0, S, S);
  miniCtx.fillStyle = CONFIG.COLORS.hudBg;
  miniCtx.fillRect(0, 0, S, S);
  for(let y = 0; y < FARM.h; y++){
    for(let x = 0; x < FARM.w; x++){
      const tx = FARM.x + x, ty = FARM.y + y;
      if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      const i = ty*MAP_W + tx;
      miniCtx.fillStyle = minimapTileColor(map[i]);
      miniCtx.fillRect(x*K, y*K, K, K);
      if(roads[i]){ miniCtx.fillStyle = CONFIG.TILE_COLORS.roadStone; miniCtx.fillRect(x*K, y*K, K, K); }
    }
  }
  /* 房屋 / 商店图标 */
  miniCtx.fillStyle = M.HOUSE;
  miniCtx.fillRect((HOUSE_POS.x-FARM.x)*K, (HOUSE_POS.y-FARM.y)*K, HOUSE_POS.w*K, HOUSE_POS.h*K);
  miniCtx.fillStyle = M.SHOP;
  miniCtx.fillRect((SHOP_POS.x-FARM.x)*K, (SHOP_POS.y-FARM.y)*K, SHOP_POS.w*K, SHOP_POS.h*K);
  /* NPC（第 25 轮：按当前状态着色 —— 营业中=黄 / 瞎逛=橙 / 在家=蓝；睡觉·外出不显示） */
  for(const d of CONFIG.NPC.LIST){
    const p = npcPos(d);
    if(!p) continue;
    if(p.tx < FARM.x || p.tx >= FARM.x + FARM.w || p.ty < FARM.y || p.ty >= FARM.y + FARM.h) continue;
    const st = npcWhere(d);
    const col = minimapNpcColor(st);
    if(!col) continue;
    miniCtx.fillStyle = col;
    miniCtx.fillRect((p.tx-FARM.x)*K + ((K>>1) - 1), (p.ty-FARM.y)*K + ((K>>1) - 1), 3, 3);
  }
  /* 玩家（白点；跑出农场区就贴边显示） */
  const px = Math.floor(player.x/TILE), py = Math.floor(player.y/TILE);
  const cx = clamp(px - FARM.x + 0.5, 0, FARM.w) * K - 2;
  const cy = clamp(py - FARM.y + 0.5, 0, FARM.h) * K - 2;
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
  const K = CONFIG.MINIMAP.SCALE, PAD = 8;
  g.fillStyle = '#0c1018';
  g.fillRect(0, 0, cv.width, cv.height);
  /* 地块 + 石板路 */
  for(let y = 0; y < MAP_H; y++){
    for(let x = 0; x < MAP_W; x++){
      const i = y * MAP_W + x;
      g.fillStyle = minimapTileColor(map[i]);
      g.fillRect(PAD + x * K, PAD + y * K, K, K);
      if(roads[i]){
        g.fillStyle = CONFIG.TILE_COLORS.roadStone;
        g.fillRect(PAD + x * K, PAD + y * K, K, K);
      }
    }
  }
  /* 城镇建筑（整栋画成色块：杂货店青色，其余民居棕色） */
  const C = CONFIG.TOWN;
  for(const b of (C.LIST || [])){
    g.fillStyle = (b.kind === 'shop') ? CONFIG.MINIMAP.SHOP : '#b08968';
    g.fillRect(PAD + b.x * K, PAD + C.ROW * K, b.w * K, (C.END_ROW - C.ROW + 1) * K);
  }
  /* 农舍 / 农场里的杂货店摊位（沿用小地图配色） */
  g.fillStyle = CONFIG.MINIMAP.HOUSE;
  g.fillRect(PAD + HOUSE_POS.x * K, PAD + HOUSE_POS.y * K, HOUSE_POS.w * K, HOUSE_POS.h * K);
  /* 居民（按当前状态着色：营业黄 / 瞎逛橙 / 在家蓝；睡觉外出不画） */
  for(const d of CONFIG.NPC.LIST){
    const p = npcPos(d);
    if(!p) continue;
    const col = minimapNpcColor(npcWhere(d));
    if(!col) continue;
    g.fillStyle = col;
    g.fillRect(PAD + p.tx * K + (K >> 1) - 2, PAD + p.ty * K + (K >> 1) - 2, 4, 4);
  }
  /* 玩家（白点） */
  const px = Math.floor(player.x / TILE), py = Math.floor(player.y / TILE);
  g.fillStyle = CONFIG.MINIMAP.PLAYER;
  g.fillRect(PAD + px * K + (K >> 1) - 2, PAD + py * K + (K >> 1) - 2, 5, 5);
  if(bigmapSubEl) bigmapSubEl.textContent = '第 ' + clock.day + ' 天 · ' + weather.icon + ' ' + weather.name;
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
  const cx = C.CONNECTOR_X == null ? FARM.x + 10 : C.CONNECTOR_X;
  for(let x=cx;x<=cx+1;x++){
    for(let y=FARM.y+FARM.h;y<C.ROW;y++) map[y*MAP_W+x] = T.PATH;   /* 农场 → 镇上 */
    for(let y=C.ROW;y<=C.END_ROW;y++) map[y*MAP_W+x] = T.PATH;
  }

  /* 2) 住宅 / 商店：每栋按自己的 row 盖墙、地板、门 */
  for(const b of C.LIST){
    stampBuilding(buildingDef(b.id), false);                       /* 墙 / 地板 / 门 */
  }
}

/* --- 地图生成 --- */
function genMap(seed){
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

  /* 5) 树 / 岩石 / 野花（只在草地上，且避开空地） */
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    if(inFarm(x,y)) continue;
    const i = y*MAP_W+x;
    if(map[i] !== T.GRASS) continue;
    const r = rnd();
    if(r < CONFIG.GEN.TREE_CHANCE) map[i] = T.TREE;
    else if(r < CONFIG.GEN.TREE_CHANCE + CONFIG.GEN.ROCK_CHANCE) map[i] = T.ROCK;
    else if(r < CONFIG.GEN.TREE_CHANCE + CONFIG.GEN.ROCK_CHANCE + CONFIG.GEN.FLOWER_CHANCE) map[i] = T.FLOWER;
  }

  /* 6) 建筑（小屋 1 间，在空地内上缘） */
  for(let y=HOUSE_POS.y;y<HOUSE_POS.y+HOUSE_POS.h;y++)
    for(let x=HOUSE_POS.x;x<HOUSE_POS.x+HOUSE_POS.w;x++) map[y*MAP_W+x] = T.HOUSE;

  /* 7) 第 24 轮：盖镇子（商店 + 三户人家的房子 + 各自的卧室） */
  genTown();

  /* 整张地图重画了 → 离屏画布里的烘焙结果全部作废 */
  invalidateGround();
  tilledCount = 0;                         /* 第 22 轮：新地图没有耕地，增量计数归零 */

  const cnt = [0,0,0,0,0,0,0,0];
  for(let i=0;i<map.length;i++) cnt[map[i]]++;  let farmWild = 0;
  for(let y=FARM.y;y<FARM.y+FARM.h;y++) for(let x=FARM.x;x<FARM.x+FARM.w;x++){
    const t = map[y*MAP_W+x];
    if(t===T.TREE||t===T.ROCK||t===T.FLOWER) farmWild++;
  }
  dlog('[map] seed=' + seed + ' | grass=' + cnt[T.GRASS] + ' dirt=' + cnt[T.DIRT] +
    ' water=' + cnt[T.WATER] + ' tree=' + cnt[T.TREE] + ' rock=' + cnt[T.ROCK] +
    ' flower=' + cnt[T.FLOWER] + ' house=' + cnt[T.HOUSE] + ' shop=' + cnt[T.SHOP] +
    ' | farm ' + FARM.w + 'x' + FARM.h + ' wild-in-farm=' + farmWild);
  return cnt;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { groundCv, groundCtx, groundBaked, groundDirty, miniCv, miniCtx, bigmapEl, bigmapMaskEl, bigmapCvEl, bigmapSubEl, FARM, HOUSE_POS, TOWN_SHOP, SHOP_POS, QUEST_BOARD, SPAWN, inFarm, clamp, lerp, markGroundDirty, invalidateGround, setTile, minimapTileColor, minimapNpcColor, rebuildMinimap, drawMinimap, hitHudMini, renderBigmap, bigmapOpenPanel, bigmapClosePanel, toggleBigmap, mulberry32, hashSeed, hash2, valueNoise, fbm, genTown, genMap });
export { groundCv, groundCtx, groundBaked, groundDirty, miniCv, miniCtx, bigmapEl, bigmapMaskEl, bigmapCvEl, bigmapSubEl, FARM, HOUSE_POS, TOWN_SHOP, SHOP_POS, QUEST_BOARD, SPAWN, inFarm, clamp, lerp, markGroundDirty, invalidateGround, setTile, minimapTileColor, minimapNpcColor, rebuildMinimap, drawMinimap, hitHudMini, renderBigmap, bigmapOpenPanel, bigmapClosePanel, toggleBigmap, mulberry32, hashSeed, hash2, valueNoise, fbm, genTown, genMap };
