/* js/systems/soil.js —— 由 index.html 拆分，原行 4707–4909 */
'use strict';

/* --- 第 23 轮：土壤肥力（收获消耗 / 轮作恢复 / 每天自然恢复） --- */
window.soilFert = CONFIG.QUALITY.SOIL.START;
function soilAdd(v){
  soilFert = clamp(soilFert + v, CONFIG.QUALITY.SOIL.MIN, CONFIG.QUALITY.SOIL.MAX);
  return soilFert;
}
/* 轮作：和邻居种的是不同作物 → 土壤恢复 */
function soilRotate(tx, ty, type){
  const N = [[1,0],[-1,0],[0,1],[0,-1]];
  for(let k=0;k<4;k++){
    const nx = tx+N[k][0], ny = ty+N[k][1];
    if(nx<0 || ny<0 || nx>=MAP_W || ny>=MAP_H) continue;
    const c = crops[ny*MAP_W+nx];
    if(c && !c.dead && c.type !== type){ soilAdd(CONFIG.QUALITY.SOIL.ROTATE); return true; }
  }
  return false;
}
function soilHarvest(){ return soilAdd(CONFIG.QUALITY.SOIL.HARVEST); }
function soilDayStart(){ return soilAdd(CONFIG.QUALITY.SOIL.DAILY); }
/* --- 第 23 轮：作物品质评分（浇水完整度 + 当季 + 节日 + 土壤肥力） --- */
function cropQuality(c){
  const def = cropDef(c.type);
  const Q = CONFIG.QUALITY;
  if(!def) return {score:0, water:0, season:0, fest:0, soil:0, hq:false};
  const need = c.rc ? Math.max(1, def.regrow) : def.days;   /* 本轮需要长多少天 */
  const elapsed = (c.a | 0);
  const water = elapsed > 0 ? clamp(need / elapsed, 0, 1) : 1;   /* 浇水完整度 */
  const seasons = cropSeasons(def);
  const cur = seasonName();
  const season = (cur === def.season) ? 1 : (seasons.indexOf(cur) >= 0 ? Q.SEASON_SECONDARY : 0.5);
  const fest = festivalToday() ? 1 : Q.FEST_NORMAL;
  const soil = clamp(soilFert / 100, 0, 1);
  const fert = Math.max(0, Math.min(0.30, (c.fert | 0) * 0.10));
  const luck = (typeof equipLuckBonus === 'function') ? equipLuckBonus() : 0;
  const score = clamp(Q.WEIGHT.water*water + Q.WEIGHT.season*season +
                      Q.WEIGHT.soil*soil + Q.WEIGHT.fest*fest + fert + luck, 0, 1);
  return {score:score, water:water, season:season, fest:fest, soil:soil, fert:fert, hq:score >= Q.HQ_SCORE};
}
/* --- 第 23 轮：种子杂交（相邻种两种不同作物 → 有概率结出杂交种子） --- */
function hybridRecipe(a, b){
  for(const r of CONFIG.HYBRID.RECIPES){
    if((r.parents[0] === a && r.parents[1] === b) || (r.parents[0] === b && r.parents[1] === a)) return r;
  }
  return null;
}
function hybridCheck(tx, ty, type){
  const N = [[1,0],[-1,0],[0,1],[0,-1]];
  for(let k=0;k<4;k++){
    const nx = tx+N[k][0], ny = ty+N[k][1];
    if(nx<0 || ny<0 || nx>=MAP_W || ny>=MAP_H) continue;
    const c = crops[ny*MAP_W+nx];
    if(!c || c.dead || c.type === type) continue;
    const r = hybridRecipe(type, c.type);
    if(!r) continue;
    if(Math.random() >= CONFIG.HYBRID.CHANCE) continue;
    const sid = 'seed_' + r.id;
    if(!canFit(sid, 1)){ toast('背包满了，杂交种子没地方放'); return false; }
    addItem(sid, 1);
    const hd = cropDef(r.id);
    toast('🌱 杂交出了' + (hd ? hd.name : r.id) + '种子！');
    playSfx(880, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
    return true;
  }
  return false;
}
/* 附近有没有水（站在水边右键补水） */
function findWaterNear(){
  const px = Math.floor(player.x/TILE), py = Math.floor(player.y/TILE);
  const R = Math.ceil(CONFIG.WATER_CAN.REFILL_RANGE);
  for(let ty=py-R; ty<=py+R; ty++) for(let tx=px-R; tx<=px+R; tx++){
    if(tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) continue;
    if(map[ty*MAP_W+tx] !== T.WATER) continue;
    if(tileCenterDist(tx,ty) <= CONFIG.WATER_CAN.REFILL_RANGE) return {tx:tx, ty:ty};
  }
  return null;
}
function refillCan(){
  if(countItem('can') <= 0){ toast('你没有水壶'); playSfx(140,'sawtooth',0.09,CONFIG.AUDIO.VOLUME*0.6); return false; }
  if(canWater >= canCapacity()){ toast('水壶是满的'); return false; }
  if(!findWaterNear()){ toast('附近没有水源'); playSfx(140,'sawtooth',0.09,CONFIG.AUDIO.VOLUME*0.6); return false; }
  canWater = canCapacity();
  toast('水壶补满了（' + canWater + '）');
  playSfx(880, 'sine', 0.12, CONFIG.AUDIO.VOLUME);
  return true;
}
/* 每天 6:00 结算：浇过水才生长；换季时非当季作物枯萎；浇水状态重置 */
function settleDay(){
  const newSeason = seasonName();          /* 此刻 clock.day 已经是新的一天 */
  let grew = 0, matured = 0, withered = 0, wateredTiles = 0, irrGrew = 0;
  /* 第 22 轮：雨天自动浇水（今天下过雨 → 今晚照常生长），要在生长判定之前 */
  const rained = applyRain();
  for(let i=0;i<crops.length;i++){
    const c = crops[i];
    if(!c || c.dead) continue;
    const def = cropDef(c.type);
    const tx = i % MAP_W, ty = (i / MAP_W) | 0;
    const gh = (typeof cropInGreenhouse === 'function') && cropInGreenhouse(tx, ty);
    if(!gh && cropSeasons(def).indexOf(newSeason) < 0){   /* 换季 → 非当季作物枯萎；温室范围内全年生长 */
      c.dead = true; c.stage = 0; withered++;
      continue;
    }
    c.a = (c.a | 0) + 1;                 /* 第 23 轮：经过天数（用来算浇水完整度） */
    if(map[i] === T.WATERED || gh){      /* 当天浇过水 / 温室自动浇水 → 生长一天 */
      let inc = festivalGrowInc(c);        /* 第 17 轮：春·播种祭当天播种的生长 ×2 */
      /* 第 20 轮：被铱质洒水器浇过 → 有概率当天多长一阶段（默认 30%） */
      if(c.irr && Math.random() < CONFIG.ENDGAME.IRRIGATION.CHANCE){ inc += 1; irrGrew++; }
      c.grown += inc;
      if(c.grown >= def.days) c.mature = true;
      grew++;
    }
    if(c.irr) c.irr = 0;                   /* 加速标记只作用于当晚，次日清掉 */
    if(c.fastDay) c.fastDay = 0;           /* 加速只作用于播种当晚 */
    c.stage = cropStage(c);
    if(c.mature) matured++;
  }
  for(let i=0;i<map.length;i++){           /* 浇水状态每天重置 */
    if(map[i] === T.WATERED){ setTile(i, T.TILLED); wateredTiles++; }
  }
  for(let i=0;i<crops.length;i++){ if(crops[i]) crops[i].watered = false; }
  /* 洒水器：重置之后自动浇周围 3×3（今天浇 → 明天长） */
  const sprinkled = applySprinklers();
  if(withered) toast('换季了，' + withered + ' 株作物枯萎了');
  if(matured)  toast('有 ' + matured + ' 株作物成熟了');
  if(irrGrew)  toast('铱质洒水器让 ' + irrGrew + ' 株作物多长了一阶段');
  dlog('[settle] 第 ' + clock.day + ' 天结算：生长 ' + grew + ' 株，成熟 ' + matured +
              ' 株，枯萎 ' + withered + ' 株，重置浇水 ' + wateredTiles + ' 格' +
              (rained ? '，雨天自动浇水 ' + rained + ' 格' : '') +
              (irrGrew ? '，铱质加速 ' + irrGrew + ' 株' : '') +
              (sprinkled ? '，洒水器浇了 ' + sprinkled + ' 格' : ''));
  return {grew:grew, matured:matured, withered:withered, sprinkled:sprinkled, irrGrew:irrGrew, rained:rained};
}

/* --- 第 22 轮：雨天自动浇水（把当天雨当成一次浇水，作物当晚照常生长） --- */
function applyRain(){
  if(!CONFIG.WEATHER_FX.RAIN_AUTO_WATER) return 0;
  if(!weather || weather.id !== 'rain') return 0;
  let n = 0;
  for(let i=0;i<map.length;i++){
    if(map[i] !== T.TILLED && map[i] !== T.WATERED) continue;
    const c = crops[i];
    if(c && c.dead) continue;            /* 枯萎的不算 */
    setTile(i, T.WATERED);
    if(c) c.watered = true;
    n++;
  }
  if(n) toast('🌧 下雨了，' + n + ' 格地自动浇好了');
  return n;
}

/* --- 洒水器 / 铱质洒水器：每天早上自动浇地 --- */
function applySprinklers(){
  let n = 0, irr = 0;
  const IR = CONFIG.ENDGAME.IRRIGATION;
  for(const b of buildings){
    if(b.type !== 'sprinkler' && b.type !== 'irrigator') continue;
    const R = (b.type === 'irrigator') ? IR.RANGE : CONFIG.BUILD.SPRINKLER_RANGE;   /* 第 20 轮：5×5 */
    for(let dy=-R; dy<=R; dy++){
      for(let dx=-R; dx<=R; dx++){
        const tx = b.tx+dx, ty = b.ty+dy;
        if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
        const i = ty*MAP_W+tx;
        if(map[i] !== T.TILLED && map[i] !== T.WATERED) continue;
        setTile(i, T.WATERED);
        if(crops[i]){
          crops[i].watered = true;
          if(b.type === 'irrigator') crops[i].irr = 1;   /* 第 20 轮：明早可能多长一阶段 */
        }
        spawnDrops(tx,ty);
        n++; if(b.type === 'irrigator') irr++;
      }
    }
  }
  if(n) toast('洒水器浇了 ' + n + ' 格地' + (irr ? '（铱质 ' + irr + ' 格）' : ''));
  return n;
}
/* 洒水器的小水滴（世界坐标，往下掉） */
function spawnDrops(tx,ty){
  for(let k=0; k<3; k++){
    dropFx.push({
      x:(tx + 0.5)*TILE + (Math.random() - 0.5)*18,
      y:(ty + 0.25)*TILE + Math.random()*10,
      vy: 16 + Math.random()*26,
      life: 0.9, max: 0.9
    });
  }
}
function updateDropFx(dt){
  for(let i=dropFx.length-1; i>=0; i--){
    const p = dropFx[i];
    p.y += p.vy * dt;
    p.life -= dt;
    if(p.life <= 0) dropFx.splice(i,1);
  }
}
function drawDropFx(g){
  const C = CONFIG.TILE_COLORS;
  for(const p of dropFx){
    const a = clamp(p.life / p.max, 0, 1);
    g.fillStyle = C.dropWater;
    g.globalAlpha = a;
    g.fillRect((p.x - cam.x) | 0, (p.y - cam.y) | 0, 2, 3);
    g.fillStyle = C.dropWaterLight;
    g.fillRect((p.x - cam.x) | 0, (p.y - cam.y) | 0, 1, 1);
    g.globalAlpha = 1;
  }
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { soilAdd, soilRotate, soilHarvest, soilDayStart, cropQuality, hybridRecipe, hybridCheck, findWaterNear, refillCan, settleDay, applyRain, applySprinklers, spawnDrops, updateDropFx, drawDropFx });
export { soilAdd, soilRotate, soilHarvest, soilDayStart, cropQuality, hybridRecipe, hybridCheck, findWaterNear, refillCan, settleDay, applyRain, applySprinklers, spawnDrops, updateDropFx, drawDropFx };
