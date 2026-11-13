/* js/systems/crops.js —— 由 index.html 拆分，原行 4596–4706 */
'use strict';

/* --- 工具使用：距离判定 → 适用性判定 → 改地块 + 产出 + 音效 + 提示 --- */
function tileCenterDist(tx,ty){
  const dx = (tx+0.5)*TILE - player.x, dy = (ty+0.5)*TILE - player.y;
  return Math.hypot(dx, dy) / TILE;               /* 单位：格 */
}

/* --- 作物系统：播种 → 浇水 → 生长 → 收获 --- */
window.canWater = CONFIG.WATER_CAN.CAPACITY;          /* 水壶剩余容量 */
function cropDef(type){ return CONFIG.CROPS.find(c => c.id === type) || CONFIG.HYBRID.CROPS.find(c => c.id === type); }
/* 第 23 轮：全部作物定义（普通作物 + 杂交作物）；杂交作物不进 CONFIG.CROPS，
 * 所以不会挤掉成就里那 31 位的「作物种类」掩码 */
function allCropDefs(){ return CONFIG.CROPS.concat(CONFIG.HYBRID.CROPS); }
/* 第 23 轮：作物能种的季节（杂交作物有主季 + 次季，普通作物只有自己那一季） */
function cropSeasons(def){ return (def && def.seasons) ? def.seasons : [def ? def.season : '']; }

function cropAt(tx,ty){ return crops[ty*MAP_W+tx]; }
/* 视觉阶段 = 已生长的天数（封顶 3），每次浇水+1 */
function cropStage(c){ return Math.min(3, c.grown); }
/* 成熟度 0~1：长周期作物在结果期逐渐变红 */
function ripeness(c){
  const def = cropDef(c.type);
  if(c.mature) return 1;
  const start = Math.max(0, def.days - 3);
  return clamp((c.grown - start) / Math.max(1, def.days - start), 0, 1);
}
function sowCrop(tx,ty,type,seedId){
  const def = cropDef(type);
  const sid = seedId || ('seed_' + type);
  const season = seasonName();
  const seasons = cropSeasons(def);            /* 第 23 轮：杂交作物有两个季可种 */
  const inGh = (typeof cropInGreenhouse === 'function') && cropInGreenhouse(tx, ty);
  if(seasons.indexOf(season) < 0 && !inGh){
    toast(season === '冬' ? '土地休眠了（温室范围内可以种）' : (def.name + '只能在' + seasons.join('、') + '季种（温室范围内除外）'));
    playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6);
    return false;
  }
  const i = ty*MAP_W+tx;
  if(map[i] !== T.TILLED){ toast('先用锄头把这块地开垦了'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  /* 种子来自背包：播下要扣 1 颗，没种子就不能播 */
  const slot = selectedSlot();
  const have = (slot && slot.id === sid && slot.n > 0) ? true : (countItem(sid) > 0);
  if(!have){ toast('没有' + def.name + '种子了'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  crops[i] = {type:type, stage:0, grown:0, watered:false, mature:false, dead:false, a:0, rc:0};
  festivalOnSow(crops[i]);               /* 第 17 轮：春·播种祭当天播种 → 当晚 ×2 生长 */
  if(slot && slot.id === sid && slot.n > 0){        /* 优先扣当前选中的那一格 */
    slot.n--;
    if(slot.n <= 0) inv[hotSel] = null;
  }else{
    removeItem(sid, 1);
  }
  toast('播下了' + def.name);
  const seedTool = CONFIG.TOOLS.find(t => t.crop === type);
  playSfx(seedTool ? seedTool.sfx : 523, CONFIG.AUDIO.TYPE, CONFIG.AUDIO.DUR, CONFIG.AUDIO.VOLUME);
  tutSown();                                /* 新手引导：完成"播种"这一步 */
  /* 第 23 轮：轮作（土壤肥力）+ 种子杂交（相邻种不同作物） */
  soilRotate(tx, ty, type);
  hybridCheck(tx, ty, type);
  if(typeof spawnTileFx === 'function') spawnTileFx('sow', tx, ty);
  return true;
}
function waterTile(tx,ty){
  const i = ty*MAP_W+tx;
  if(canWater <= 0){ toast('水壶空了，去水边右键补水'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  if(map[i] === T.WATERED){ toast('今天已经浇过水了'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  if(map[i] !== T.TILLED){ toast('这里不能浇水'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  if(!payStamina(staminaCost('can'))) return false;   /* 浇水消耗 1 点体力 */
  canWater--;
  setTile(i, T.WATERED);                    /* 视觉变深色（并把这一格标脏重烘焙） */
  if(typeof spawnTileFx === 'function') spawnTileFx('water', tx, ty);
  const c = crops[i];
  if(c) c.watered = true;
  toast('浇好了水（壶里还剩 ' + canWater + '）');
  playSfx(784, CONFIG.AUDIO.TYPE, CONFIG.AUDIO.DUR, CONFIG.AUDIO.VOLUME);
  return true;
}
function harvestCrop(tx,ty){
  const i = ty*MAP_W+tx;
  const c = crops[i];
  const def = cropDef(c.type);
  const q = cropQuality(c);                       /* 第 23 轮：品质评分 → 决定普通还是优质 */
  const itemId = q.hq ? (c.type + '_hq') : c.type;
  const item = itemDef(itemId);
  /* 背包放不下就不收：宁可留在地里，也不能让作物凭空消失 */
  if(!canFit(itemId, 1)){
    toast('背包满了，装不下' + (item ? item.name : def.name));
    playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6);
    return false;
  }
  if(!payStamina(staminaCost('harvest'))) return false;   /* 收获消耗 1 点体力 */
  addItem(itemId, 1);
  if(typeof skillAdd === 'function') skillAdd('farming', def.regrow > 0 ? 6 : 8);
  questEmit('crop', {id:c.type, n:1});    /* 第 16 轮：委托总线（作物产出，用基础作物 id） */
  statsHarvest(c.type);                   /* 第 18 轮：收获统计 + 作物种类 + 成就 */
  soilHarvest();                          /* 第 23 轮：收获消耗土壤肥力 */
  const itemName = item ? item.name : def.name;
  if(def.regrow > 0){                      /* 番茄：收获后回到阶段 3，继续结果 */
    c.grown = def.days - def.regrow;
    c.stage = 3; c.mature = false; c.watered = false;
    c.a = 0; c.rc = 1;                     /* 第 23 轮：进入下一轮结果，重新计完整度 */
    toast('收获 ' + itemName + ' ×1（还能再结）');
  }else{
    crops[i] = null;
    if(map[i] === T.WATERED) setTile(i, T.TILLED);   /* 收获后地块变回耕地 */
    toast('收获 ' + itemName + ' ×1');
  }
  playSfx(1046, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  if(typeof spawnTileFx === 'function') spawnTileFx('harvest', tx, ty, def.ripe);
  return true;
}
function clearDeadCrop(tx,ty){
  const i = ty*MAP_W+tx;
  const def = cropDef(crops[i].type);
  if(!payStamina(staminaCost('sickle'))) return false;
  crops[i] = null;
  if(map[i] === T.WATERED) setTile(i, T.TILLED);
  if(typeof spawnTileFx === 'function') spawnTileFx('sickle', tx, ty);
  toast('清理了枯萎的' + def.name);
  playSfx(988, CONFIG.AUDIO.TYPE, CONFIG.AUDIO.DUR, CONFIG.AUDIO.VOLUME);
  return true;
}


function useFertilizer(tx, ty, item){
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  if(typeof currentMap !== 'undefined' && currentMap !== 'valley'){
    toast('这里只能探索，回农场再施肥');
    return false;
  }
  if(typeof tileCenterDist === 'function' && tileCenterDist(tx, ty) > CONFIG.INTERACT.RANGE_TILES){
    toast('太远了，走近一点再施肥');
    return false;
  }
  const i = ty * MAP_W + tx;
  const c = crops[i];
  if(!c){ toast('对着作物使用肥料'); return false; }
  if(c.dead){ toast('这株已经枯萎了，先清理掉'); return false; }
  const lvl = item.id === 'fert_deluxe' ? 3 : item.id === 'fert_quality' ? 2 : 1;
  if((c.fert | 0) >= lvl){ toast('这块地已经施过同样或更好的肥料了'); return false; }
  if(!removeItem(item.id, 1)){ toast('背包里没有' + item.name); return false; }
  c.fert = lvl;
  toast('施了' + item.name + '，品质评分 +' + Math.round((item.fertBonus || 0.1) * 100) + '%');
  if(typeof playSfx === 'function') playSfx(660, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  return true;
}

/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { tileCenterDist, cropDef, allCropDefs, cropSeasons, cropAt, cropStage, ripeness, sowCrop, waterTile, harvestCrop, clearDeadCrop, useFertilizer });
export { tileCenterDist, cropDef, allCropDefs, cropSeasons, cropAt, cropStage, ripeness, sowCrop, waterTile, harvestCrop, clearDeadCrop, useFertilizer };
