/* js/npc/save.js —— 由 index.html 拆分，原行 8927–9049 */
'use strict';

/* --- 存档（紧凑结构） --- */
function npcSerialize(){
  const aff = {}, gift = {}, unl = {}, loot = {};
  for(const d of CONFIG.NPC.LIST){
    aff[d.id]  = npcAff(d.id);
    gift[d.id] = (npcState.gift[d.id] | 0);
    unl[d.id]  = npcState.unlock[d.id] ? 1 : 0;
    const lw = npcState.lootDay[d.id] | 0;             /* 第 25 轮：开过箱子的周数 */
    if(lw > 0) loot[d.id] = lw;
  }
  return {aff:aff, gift:gift, unl:unl, loot:loot, bd:npcState.bonusDay, bu:npcState.bonusUsed};
}
function npcDeserialize(o){
  npcResetState();
  if(!o || typeof o !== 'object') return false;
  for(const d of CONFIG.NPC.LIST){
    const a = o.aff ? o.aff[d.id] : undefined;
    if(typeof a === 'number') npcState.aff[d.id] = clamp(a | 0, 0, CONFIG.NPC.AFF_MAX);
    const g = o.gift ? o.gift[d.id] : undefined;
    if(typeof g === 'number') npcState.gift[d.id] = Math.max(0, g | 0);
    const u = o.unl ? o.unl[d.id] : undefined;
    if(u) npcState.unlock[d.id] = 1;
    const l = (o.loot && typeof o.loot === 'object') ? o.loot[d.id] : undefined;   /* 第 25 轮 */
    if(typeof l === 'number') npcState.lootDay[d.id] = Math.max(0, l | 0);
  }
  if(typeof o.bd === 'number') npcState.bonusDay = o.bd | 0;
  if(typeof o.bu === 'number') npcState.bonusUsed = Math.max(0, o.bu | 0);
  npcSyncUnlocks();
  return true;
}

/* --- 存档迁移：v1 → v2（第 13 轮新增 npc 字段） --- */
function migrate(oldSave){
  if(!oldSave || typeof oldSave !== 'object') return null;
  try{
    const d = JSON.parse(JSON.stringify(oldSave));   /* 复制一份，不动原对象 */
    const v = (typeof d.v === 'number') ? d.v : 1;
    if(v < 2){
      /* v1 → v2：补上 npc 字段（没有就当作"刚认识"，其余进度全部保留） */
      if(!d.npc || typeof d.npc !== 'object') d.npc = {aff:{}, gift:{}, unl:{}, bd:-1, bu:0};
    }
    if(v < 3){
      /* v2 → v3：补上图鉴字段（没有就当作"还没钓到过 / 采到过"） */
      if(!d.dex || typeof d.dex !== 'object') d.dex = {f:0, g:0};
    }
    if(v < 4){
      /* v3 → v4：补上动物字段（没有就当作"还没养过动物"） */
      if(!Array.isArray(d.animals)) d.animals = [];
    }
    if(v < 5){
      /* v4 → v5：补上委托板字段（没有就当作"今天还没接过委托"，信誉从 0 开始） */
      if(!d.quest || typeof d.quest !== 'object') d.quest = {r:0, d:0, i:0, o:[], a:[]};
    }
    if(v < 6){
      /* v5 → v6：补上节日字段（没有就当作"没在过节日 / 没领过奖 / 积分 0"） */
      if(!d.fest || typeof d.fest !== 'object') d.fest = {p:0, d:0, c:0, b:0};
    }
    if(v < 7){
      /* v6 → v7：补上统计 / 成就。统计从 0 开始（不追溯旧档历史行为，避免旧进度被误算成成就），
       * 成就全部未解锁；之后的行为从现在起正常累计。 */
      if(!Array.isArray(d.st) || d.st.length < 16) d.st = statsZeroArray();
      if(!d.ach || typeof d.ach !== 'object') d.ach = {u:0};
    }
    if(v < 8){
      /* v7 → v8：加工台状态随 buildings 的 job/out 可选字段一起存（老档没有加工台，无需补字段）；
       * 补上成品食用次数，避免旧档读入后 undefined。 */
      if(!d.eat || typeof d.eat !== 'object') d.eat = {d:-1, n:0};
    }
    if(v < 9){
      /* v8 → v9：补上终局自动化字段（老档没有雇工 / 采集箱 / 乌鸦记录 / 结算标记）；
       * 采集箱的格子随 buildings.slots 存档，迁移时无需额外补。 */
      if(!d.end || typeof d.end !== 'object') d.end = {w:0, s:0, p:0, m:0, n:0, e:0, c:[]};
    }
    if(v < 10){
      /* v9 → v10：补上「一次性教学提示」位掩码。老档没看过任何系统提示 → 0（全部可触发）；
       * 不影响任何已有进度。 */
      if(typeof d.tp !== 'number') d.tp = 0;
    }
    if(v < 11){
      /* v10 → v11：补上「交互按键提示」开关。老档默认开启（ih = 1），行为与升级前一致。 */
      if(typeof d.ih !== 'number') d.ih = 1;
    }
    if(v < 12){
      /* v11 → v12：补上「土壤肥力」和「NPC 来访」字段。
       * 老档的作物没有经过天数（a）→ 品质评分按"没缺过水"算，不惩罚旧存档；
       * 老档也没有来访记录 → 当天重新挑一位来访居民。 */
      if(typeof d.soil !== 'number') d.soil = CONFIG.QUALITY.SOIL.START;
      if(!d.vs || typeof d.vs !== 'object') d.vs = {d:-1, i:'', g:0, a:0};
      if(Array.isArray(d.crops))
        for(const c of d.crops){ if(c && typeof c.a !== 'number') c.a = 0; }
    }
    if(v < 13){
      /* v12 → v13：补上「开过 NPC 箱子的周数」。
       * 老档没开过箱子 → 记 0（还能开一次）；其余进度全部保留。 */
      if(!d.npc || typeof d.npc !== 'object') d.npc = {aff:{}, gift:{}, unl:{}, bd:-1, bu:0};
      if(!d.npc.loot || typeof d.npc.loot !== 'object') d.npc.loot = {};
    }
    if(v < 14){
      /* v13 → v14：补上「天气预报队列」和「音量档位」。
       * 老档没有预报 → 读档时按当前权重补一队（今天的真实天气不受影响）；
       * 音量默认 100（和升级前完全一致）。其余进度全部保留。 */
      if(typeof d.fc !== 'string') d.fc = '';
      if(typeof d.vol !== 'number') d.vol = 100;
    }
    if(v < 15){
      /* v14 → v15：补上设置项（界面缩放 / 减少动画 / FPS / 网格 / 调试日志）。
       * 老档一律按默认值：100% / 关 / 隐藏 / 隐藏 / 关，和升级前观感一致。 */
      if(!d.opt || typeof d.opt !== 'object') d.opt = {s:100, m:0, f:0, g:0, l:0};
    }
    if(v < 16){
      /* v15 → v16：地图从 64×64 扩到 128×104，城镇改成四排住宅。
       * 农场从 (26,26) 移到 (58,24)：旧农场的玩家 / 作物 / 建筑 / 地图 diff / 石板路
       * 统一平移 32 格、上移 2 格；旧城镇改动丢弃（城镇本身重新生成）。 */
      const T = CONFIG.TILE;
      const oldFarmX = 26, oldFarmY = 26;
      const newFarmX = Math.floor((CONFIG.MAP_W - CONFIG.GEN.FARM_W) / 2);
      const newFarmY = CONFIG.GEN.FARM_Y;
      const dx = newFarmX - oldFarmX, dy = newFarmY - oldFarmY;
      const nearFarm = (x, y) => x >= 18 && x < 46 && y >= 18 && y < 40;
      if(d.player && Number.isFinite(d.player.x) && Number.isFinite(d.player.y)){
        const px = d.player.x / T, py = d.player.y / T;
        if(nearFarm(px, py)){ d.player.x += dx * T; d.player.y += dy * T; }
        else { d.player.x = (newFarmX + 6.5) * T; d.player.y = (newFarmY + 6.5) * T; }
      }
      if(Array.isArray(d.crops)){
        d.crops = d.crops.filter(c => {
          if(!c || !nearFarm(c.x, c.y)) return false;
          c.x += dx; c.y += dy; return true;
        });
      }
      if(Array.isArray(d.buildings)){
        d.buildings = d.buildings.filter(b => {
          if(!b || !nearFarm(b.x, b.y)) return false;
          b.x += dx; b.y += dy; return true;
        });
      }
      if(d.map && typeof d.map === 'object'){
        const m = {};
        for(const k in d.map){
          const p = k.split(','), x = +p[0], y = +p[1];
          if(nearFarm(x, y)) m[(x + dx) + ',' + (y + dy)] = d.map[k];
        }
        d.map = m;
      }
      if(Array.isArray(d.roads)){
        d.roads = d.roads.map(s => {
          const p = String(s).split(','), x = +p[0], y = +p[1];
          return nearFarm(x, y) ? ((x + dx) + ',' + (y + dy)) : null;
        }).filter(Boolean);
      }
    }
    if(v < 17){
      /* v16 → v17：博物馆捐赠列表。老档默认空。 */
      if(!Array.isArray(d.museum)) d.museum = [];
    }
    d.v = CONFIG.SAVE.VERSION;
    return d;
  }catch(e){
    console.warn('[save] 存档迁移失败：', e);
    return null;
  }
}
/* 迁移 + 兜底：迁移失败不退化成"新游戏"，只降级成"仅保留核心数据" */
function migrateSave(raw){
  const d = migrate(raw);
  if(d) return {save:d, degraded:false};
  return {save:raw, degraded:true};
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcSerialize, npcDeserialize, migrate, migrateSave });
export { npcSerialize, npcDeserialize, migrate, migrateSave };
