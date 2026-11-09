/* js/save.js —— 由 index.html 拆分，原行 7161–7670 */
'use strict';

/* === 7.存档 === */
/* 浏览器本地存档：localStorage 单档位，键名 CONFIG.SAVE.KEY（farm_save_v1）
 *
 * 存档结构（版本 CONFIG.SAVE.VERSION）：
 * {
 *   v    : 1,                        // 存档版本号（对不上会提示并可选择重置）
 *   at   : 1730000000000,            // 保存时刻（时间戳）
 *   seed : 20240613,                 // 地图种子（读档时按它重新生成底图）
 *   player : {x, y},                 // 位置
 *   gold, stamina, staminaMax, canWater, canLevel, hotSel,
 *   time  : {day, min, hold},        // 第几天 / 从 6:00 起过的分钟 / 2:00 停留计时
 *   weather : 'sun',                 // 天气 id
 *   map   : {"x,y": 地块类型},          // 只存与初始生成不同的格子（diff）
 *   crops : [{x,y,type,stage,grown,watered,mature,dead}],   // 只存有作物的格
 *   buildings : [{type,x,y,slots:[{id,n}]}],                 // 建造物（木箱带储物）
 *   roads : ["x,y"],                 // 石板路（叠加层）
 *   inv   : [{slot,id,n}]            // 背包（只存有物品的格）
 * }
 *
 * 读档流程：按 seed 重新生成底图 → 叠加 map 的 diff → 还原其余状态。
 * 底图 diff 是省体积的关键：整张 64×64 地图要 ~8KB，改 20 格只要几百字节。 */
window.baseMap = new Uint8Array(MAP_W*MAP_H);   /* 初始生成的底图（用来算 diff） */
window.lastSaveBytes = 0;                      /* 最近一次存档的字节数 */
window.sessionActive = false;                  /* 本次会话是否已开始（标题界面没选之前不覆盖旧档） */

/* 把当前地图记成"底图" */
function snapshotBaseMap(){ baseMap.set(map); }

/* 地图 diff：只记录与底图不同的格子 */
function mapDiff(){
  const d = {};
  const C = CONFIG.TOWN;
  for(let i=0;i<map.length;i++){
    if(map[i] === baseMap[i]) continue;
    const y = (i / MAP_W) | 0;
    /* 第 24 轮：镇子是固定结构（外墙 / 门 / 地板），不进存档 → 老档也不会把墙凿穿 */
    if(y >= C.ROW && y <= C.END_ROW) continue;
    d[(i % MAP_W) + ',' + y] = map[i];
  }
  return d;
}
/* 把 diff 叠回地图（读档时用） */
function applyMapDiff(diff){
  if(!diff || typeof diff !== 'object') return 0;
  const C = CONFIG.TOWN;
  let n = 0;
  for(const k in diff){
    const p = k.split(',');
    const x = +p[0], y = +p[1];
    if(!(x >= 0 && y >= 0 && x < MAP_W && y < MAP_H)) continue;
    if(y >= C.ROW && y <= C.END_ROW) continue;    /* 城镇带：只认新地图的结构 */
    setTile(y*MAP_W+x, diff[k] | 0);
    n++;
  }
  return n;
}
/* 背包面板里"拎在手上"的物品先放回背包，免得存档时丢东西 */
function stowHeld(){
  if(!held) return;
  const h = held; held = null;
  if(typeof h.from === 'number' && h.from >= 0 && h.from < inv.length && !inv[h.from])
    inv[h.from] = {id:h.id, n:h.n};
  else addItem(h.id, h.n);
}
/* 生成一份存档数据（纯 JSON 对象） */
function serializeState(){
  stowHeld();
  const cs = [];
  for(let i=0;i<crops.length;i++){
    const c = crops[i];
    if(!c) continue;
    const c0 = {x:(i % MAP_W), y:((i / MAP_W) | 0), type:c.type, stage:c.stage|0,
             grown:c.grown|0, watered:!!c.watered, mature:!!c.mature, dead:!!c.dead};
    if(c.fastDay) c0.fast = c.fastDay | 0;      /* 第 17 轮：播种祭的加速标记（只有非 0 才写） */
    if(c.irr) c0.irr = 1;                       /* 第 20 轮：铱质洒水器加速标记（只有 true 才写） */
    if(c.a) c0.a = c.a | 0;                     /* 第 23 轮：经过天数（用来算浇水完整度） */
    if(c.rc) c0.rc = 1;                         /* 第 23 轮：第几轮结果（番茄可再收） */
    cs.push(c0);
  }
  const rs = [];
  for(let i=0;i<roads.length;i++) if(roads[i]) rs.push((i % MAP_W) + ',' + ((i / MAP_W) | 0));
  return {
    v: CONFIG.SAVE.VERSION,
    at: Date.now(),
    seed: CONFIG.SEED,
    player: {x: player.x, y: player.y},
    gold: gold,
    stamina: stamina,
    staminaMax: staminaMax,
    canWater: canWater,
    canLevel: canLevel,
    hotSel: hotSel,
    time: {day: clock.day, min: clock.min, hold: clock.hold},
    weather: weather.id,
    map: mapDiff(),
    crops: cs,
    buildings: buildings.filter(b => !b.preset).map(b => {     /* 第 25 轮：镇上的家具是静态配置，不存档 */
      const o = {type:b.type, x:b.tx, y:b.ty,
        slots: b.slots ? b.slots.map(s => s ? {id:s.id, n:s.n} : null) : null};
      if(b.type === 'maker'){                 /* 第 19 轮：加工台剩余时间 + 产出槽 */
        if(b.job) o.j = {r:b.job.rid, t:Math.max(0, Math.round(b.job.left))};
        if(b.out && b.out.length) o.o = b.out.map(s => ({id:s.id, n:s.n}));
      }
      return o;
    }),
    roads: rs,
    inv: inv.map((s,i)=> s ? {slot:i, id:s.id, n:s.n} : null).filter(Boolean),
    /* 第 12 轮新增（可选字段，老存档没有也能读）：新手引导进度 + 静音状态 */
    tut: {step:tut.step|0, moved:Math.round(tut.moved), tilled:tut.tilled|0,
          sown:tut.sown|0, slept:!!tut.slept},
    snd: audioMuted ? 1 : 0,
    ih: interactHintsOn ? 1 : 0,   /* 第 22 轮：交互按键提示开关 */
    vol: volLevel | 0,             /* 第 28 轮：音量档位 0~100（默认 100） */
    fc: fcQueue.join(','),         /* 第 28 轮：未来天气预报队列（紧凑字符串，~40 字节） */
    opt: optionsToSave(),          /* 第 29 轮：界面缩放 / 减少动画 / FPS / 网格 / 调试日志 */
    /* 第 13 轮新增：居民好感度 / 当日已送礼标记 / 解锁状态（紧凑结构） */
    npc: npcSerialize(),
    /* 第 14 轮新增：图鉴（两个位掩码，8 位鱼 + 3 位采集物，固定 30 字节左右） */
    dex: {f: dexState.f >>> 0, g: dexState.g >>> 0},
    /* 第 15 轮新增：动物（类型 / 棚舍归属 / 好感 / 喂食 / 产出 / 成长 / 位置） */
    animals: animalSerialize(),
    /* 第 16 轮新增：委托板（信誉 / 当日委托 / 进行中）+ 紧凑数组 */
    quest: questSerialize(),
    /* 第 17 轮新增：节日（渔获赛积分 / 当天日期 / 已领奖标记 / 横幅已弹标记） */
    fest: festivalSerialize(),
    /* 第 18 轮新增：统计（16 个数字的紧凑数组）+ 成就（一个 32 位掩码） */
    st: statsSerialize(),
    ach: achSerialize(),
    /* 第 19 轮新增：成品食用次数（每天限 3 次） */
    eat: makerEatSerialize(),
    /* 第 20 轮新增：雇工 / 采集箱累计 / 乌鸦事件记录 / 结算标记（紧凑结构） */
    end: endgameSerialize(),
    /* 第 21 轮新增：一次性教学提示的已读位掩码（最多 5 位） */
    tp: tipsSerialize(),
    /* 第 23 轮新增：土壤肥力 + NPC 来访状态（来访人 / 已评分 / 已提示） */
    soil: Math.round(soilFert),
    vs: visitSerialize()
  };
}
/* 读入一份存档数据（覆盖当前状态） */
function deserializeState(d){
  if(!d || typeof d !== 'object') return false;
  try{
    /* 地图：按存档里的种子重新生成底图，再叠加 diff */
    const seed = (typeof d.seed === 'number') ? d.seed : CONFIG.SEED;
    genMap(seed);
    snapshotBaseMap();
    applyMapDiff(d.map);
    /* 作物 */
    crops.fill(null);
    if(Array.isArray(d.crops))
      for(const c of d.crops){
        if(!c) continue;
        const x = c.x|0, y = c.y|0;
        if(x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        if(!cropDef(c.type)) continue;
        const nc = {type:c.type, stage:c.stage|0, grown:c.grown|0,
                            watered:!!c.watered, mature:!!c.mature, dead:!!c.dead};
        if(c.fast) nc.fastDay = Math.max(0, c.fast | 0);   /* 第 17 轮：播种祭加速标记 */
        if(c.irr) nc.irr = 1;                              /* 第 20 轮：铱质洒水器加速标记 */
        if(c.a) nc.a = c.a | 0;                            /* 第 23 轮：经过天数 */
        if(c.rc) nc.rc = 1;                                /* 第 23 轮：第几轮结果 */
        crops[y*MAP_W+x] = nc;
      }
    /* 建造物 + 石板路 */
    buildings = [];
    buildIndex.fill(-1);
    roads = new Uint8Array(MAP_W*MAP_H);
    if(Array.isArray(d.buildings))
      for(const b of d.buildings){
        if(!b || !buildRecipe(b.type)) continue;
        const x = b.x|0, y = b.y|0;
        if(x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        const nb = {type:b.type, tx:x, ty:y};
        if(b.type === 'chest' || b.type === 'autobox'){   /* 第 20 轮：自动采集箱复用同一套格子 */
          const cap = (b.type === 'autobox') ? CONFIG.ENDGAME.AUTOBOX.SLOTS : CONFIG.BUILD.CHEST_SLOTS;
          nb.slots = new Array(cap).fill(null);
          if(Array.isArray(b.slots))
            for(let k=0;k<nb.slots.length && k<b.slots.length;k++){
              const s = b.slots[k];
              if(s && CONFIG.ITEMS[s.id]) nb.slots[k] = {id:s.id, n:s.n|0};
            }
        }
        if(b.type === 'maker'){                 /* 第 19 轮：恢复剩余时间与产出槽 */
          nb.job = null; nb.out = [];
          if(b.j && typeof b.j === 'object'){
            const rd = recipeDef(b.j.r);
            if(rd){
              const total = rd.hours * 60;
              nb.job = {rid:rd.id, left:clamp(Number(b.j.t) || 0, 0, total), total:total};
            }
          }
          if(Array.isArray(b.o))
            for(const s of b.o){
              if(!s || !CONFIG.ITEMS[s.id]) continue;
              if(nb.out.length >= CONFIG.RECIPE.OUT_SLOTS) break;
              const n = s.n | 0;
              if(n > 0) nb.out.push({id:s.id, n:n});
            }
          if(nb.job && nb.job.left <= 0) makerFinish(nb, true);   /* 存档时刚好做完 → 读档即完成 */
        }
        buildings.push(nb);
        buildIndex[y*MAP_W+x] = buildings.length - 1;
      }
    /* 第 25 轮：镇上的家具（preset）不存档 —— 读档后按 BUILDING_DEFS 重新盖一遍 */
    stampTownFixtures();
    if(Array.isArray(d.roads))
      for(const k of d.roads){
        const p = String(k).split(',');
        const x = +p[0], y = +p[1];
        if(x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) roads[y*MAP_W+x] = 1;
      }
    /* 玩家 / 背包 / 时间 / 天气 */
    if(d.player){ player.x = d.player.x; player.y = d.player.y; }
    /* 第 25 轮：存档正好停在门格上 → 挪到门另一头（不然会卡在门里） */
    {
      const dtx = Math.floor(player.x/TILE), dty = Math.floor(player.y/TILE);
      const dr = townDoorAt(dtx, dty);
      if(dr){ player.x = (dr.to.x + 0.5)*TILE; player.y = (dr.to.y + 0.5)*TILE; }
    }
    /* 第 26 轮：城镇的墙变薄了 → 老存档里玩家可能正好停在新墙里 → 挪到街上 */
    {
      const ptx = Math.floor(player.x/TILE), pty = Math.floor(player.y/TILE);
      const mt = map[pty*MAP_W+ptx];
      if(mt === T.WALL_FRONT || mt === T.WALL_BACK){
        const bb = townBuildingAt(ptx, pty);
        const dx = bb ? bb.x + CONFIG.TOWN.DOOR_DX : CONFIG.TOWN.LIST[0].x + CONFIG.TOWN.DOOR_DX;
        player.x = (dx + 0.5)*TILE;
        player.y = (CONFIG.TOWN.STREET_ROW + 0.5)*TILE;
      }
    }
    if(typeof d.gold === 'number') gold = d.gold;
    if(typeof d.staminaMax === 'number') staminaMax = clamp(d.staminaMax, 1, CONFIG.STAMINA.MAX);
    if(typeof d.stamina === 'number') stamina = clamp(d.stamina, 0, staminaMax);
    if(typeof d.canLevel === 'number') canLevel = clamp(d.canLevel|0, 0, CONFIG.SHOP.CAN_MAX_LEVEL);
    if(typeof d.canWater === 'number') canWater = clamp(d.canWater, 0, canCapacity());
    if(typeof d.hotSel === 'number') hotSel = clamp(d.hotSel, 0, CONFIG.INVENTORY.HOTBAR - 1);
    if(Array.isArray(d.inv)){
      inv = new Array(CONFIG.INVENTORY.SLOTS).fill(null);
      for(const e of d.inv){
        if(!e || !CONFIG.ITEMS[e.id]) continue;
        const i = (typeof e.slot === 'number') ? e.slot : inv.findIndex(s=>!s);
        if(i < 0 || i >= inv.length) continue;
        inv[i] = {id:e.id, n:e.n|0};
      }
    }
    if(d.time){
      clock.day = Math.max(1, d.time.day|0);
      clock.min = Math.max(0, d.time.min|0);
      clock.hold = Math.max(0, d.time.hold|0);
    }
    if(d.weather) weather = CONFIG.WEATHER.find(w=>w.id===d.weather) || weather;
    /* 新手引导进度（老存档没这个字段 → 回到第 1 步重来） */
    if(d.tut && typeof d.tut === 'object'){
      tut.step   = clamp(d.tut.step|0, 0, TUT_STEPS.length);
      tut.moved  = Math.max(0, d.tut.moved|0);
      tut.tilled = Math.max(0, d.tut.tilled|0);
      tut.sown   = Math.max(0, d.tut.sown|0);
      tut.slept  = !!d.tut.slept;
    }else{
      tut.step = 0; tut.moved = 0; tut.tilled = 0; tut.sown = 0; tut.slept = false;
    }
    /* 静音状态（老存档没这个字段 → 保持当前设置） */
    if(typeof d.snd === 'number') setMuted(d.snd ? true : false, true);
    /* 第 28 轮：音量档位（老档没有 → 保持当前设置，通常 100） */
    if(typeof d.vol === 'number') setVolLevel(clamp(Math.round(d.vol), 0, 100), true);
    /* 第 29 轮：设置项（老档没有 → 保持当前设置 / 默认值） */
    if(d.opt && typeof d.opt === 'object') optionsFromSave(d.opt);
    else applyOptions();
    /* 第 28 轮：天气预报队列（老档没有 → 按当前权重补一队；今天的真实天气来自 d.weather，不受影响） */
    fcQueue = [];
    if(typeof d.fc === 'string' && d.fc){
      for(const id of d.fc.split(','))
        if(CONFIG.WEATHER.some(w => w.id === id)) fcQueue.push(id);
    }
    fillForecast();
    /* 交互按键提示开关（迁移后的旧档会补齐；直接读当前档时按字段恢复） */
    setInteractHints(d.ih === undefined ? true : !!d.ih, true);
    /* 居民状态（老存档没这个字段 → 当作"刚认识"，其余进度不受影响） */
    npcDeserialize(d.npc);
    /* 图鉴（老存档没这个字段 → 图鉴为空；超出的位按 0 截断） */
    dexResetState();
    if(d.dex && typeof d.dex === 'object'){
      const fMax = (1 << CONFIG.FISHING.LIST.length) - 1;
      const gMax = (1 << CONFIG.GATHER.TYPES.length) - 1;
      dexState.f = ((d.dex.f | 0) & fMax) >>> 0;
      dexState.g = ((d.dex.g | 0) & gMax) >>> 0;
    }
    /* 动物（老存档没这个字段 → 没有动物；棚舍没了的动物会被丢弃） */
    animalDeserialize(d.animals);
    /* 委托板（老存档没这个字段 → 按当天重新生成，信誉归零） */
    questDeserialize(d.quest);
    /* 节日（老存档没这个字段 → 节日状态归零；若今天正是节日，效果 / 装饰立即续上） */
    festivalDeserialize(d.fest);
    /* 统计 / 成就（老存档没这两个字段 → 统计从 0 开始、成就未解锁；不报错） */
    statsDeserialize(d.st);
    achDeserialize(d.ach);
    makerEatDeserialize(d.eat);        /* 第 19 轮：成品食用次数 */
    endgameDeserialize(d.end);         /* 第 20 轮：雇工 / 采集箱统计 / 乌鸦记录 / 结算标记 */
    tipsDeserialize(d.tp);             /* 第 21 轮：一次性教学提示（老档 → 全部未读） */
    /* 第 23 轮：土壤肥力 + NPC 来访状态（老存档没这两个字段 → 默认值） */
    soilFert = (typeof d.soil === 'number') ? clamp(d.soil, CONFIG.QUALITY.SOIL.MIN, CONFIG.QUALITY.SOIL.MAX)
                                            : CONFIG.QUALITY.SOIL.START;
    visitDeserialize(d.vs);
    held = null;
    cancelFishing(true);                       /* 读档时先收竿，不从旧状态接着钓 */
    /* 第 21 轮：图鉴只在背包打开且正停在图鉴页时重建（懒渲染）；
     * 打开背包时 togglePack / applyPackTabView 会自己刷新。 */
    refreshDexIfVisible();
    /* 老存档（v2 及以前）地图上没有采集物：如果今天是刷新日，补一批（不弹提示） */
    if(!map.some(isGatherTile)){
      const sd = ((clock.day - 1) % CONFIG.DAYS_PER_SEASON) + 1;
      if(sd % Math.max(1, CONFIG.GATHER.EVERY_DAYS) === 1) spawnGather(true);
    }
    /* 收尾：摄像机贴人、天色跟着时间、天气粒子重来一遍 */
    cam.x = clamp(player.x - VIEW_W/2, 0, MAP_W*TILE - VIEW_W);
    cam.y = clamp(player.y - VIEW_H/2, 0, MAP_H*TILE - VIEW_H);
    const sky0 = skyAt(skyHour());
    sky.cur = {r:sky0.r, g:sky0.g, b:sky0.b, a:sky0.a, v:sky0.v};
    spawnParticles();
    refreshPackGrid();
    updateStats();
    updateTut();
    npcRuntimeClear();                     /* 第 27 轮：清空物理坐标缓存（强制 NPC 在下一次 tick 时
                                             直接出现在床上或街上 —— 防止从地图左上角跑过来） */
    ratingCheck();                             /* 第 20 轮：读档后重新评估星级 */
    return true;
  }catch(e){
    console.warn('[save] 读档失败：', e);
    return false;
  }
}

/* --- localStorage 读写（隐私模式 / 禁用存储时会抛错，全部包 try） ---
 * 第 28 轮：多存档槽位。槽 1 仍用 CONFIG.SAVE.KEY（farm_save_v1，不能改名），
 * 槽 2/3 用 KEY + '_s2' / '_s3'。默认操作槽 curSlot（0 起）。 */
window.curSlot = 0;
window.lastWriteError = '';                 /* '' / 'size' / 'storage' */
window.lastWriteConflict = false;           /* 本次写入前发现另一个标签页的较新存档 */
const lastSeenAt = {};                   /* 槽位 → 本页最后见到的存档时间戳（多标签页冲突检测） */
function slotKey(i){
  i = i | 0;
  if(i <= 0) return CONFIG.SAVE.KEY;
  return CONFIG.SAVE.KEY + '_s' + (i + 1);
}
function readSave(slot){
  const i = slot === undefined ? curSlot : slot;
  try{
    const raw = window.localStorage.getItem(slotKey(i));
    if(!raw) return null;
    const d = JSON.parse(raw);
    if(d && typeof d === 'object'){
      if(typeof d.at === 'number') lastSeenAt[i] = d.at;
      return d;
    }
    return null;
  }catch(e){
    console.warn('[save] 存档读取失败：', e);
    return null;
  }
}
/* UTF-8 字节数（用于 MAX_BYTES 上限；vm 沙箱没有 TextEncoder 时退回字符数） */
function utf8Bytes(s){
  try{ if(typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length; }catch(e){}
  return String(s).length;
}
function writeSave(d, slot, force){
  const i = slot === undefined ? curSlot : slot;
  lastWriteError = '';
  lastWriteConflict = false;
  try{
    const raw = JSON.stringify(d);
    if(utf8Bytes(raw) > CONFIG.SAVE.MAX_BYTES){
      lastWriteError = 'size';
      console.warn('[save] 存档超过体积上限，已拒绝写入');
      return false;
    }
    /* 多标签页防覆盖：磁盘上的存档比本页见过的新 → 先把对方备份到 _bak 再写，双方都不丢 */
    try{
      const oldRaw = window.localStorage.getItem(slotKey(i));
      if(oldRaw && !force){
        const old = JSON.parse(oldRaw);
        if(old && typeof old.at === 'number' && old.at > (lastSeenAt[i] || 0) && old.at !== d.at){
          window.localStorage.setItem(slotKey(i) + '_bak', oldRaw);
          lastWriteConflict = true;
        }
      }
    }catch(e){}
    window.localStorage.setItem(slotKey(i), raw);
    lastSeenAt[i] = (d && typeof d.at === 'number') ? d.at : Date.now();
    return true;
  }catch(e){
    lastWriteError = 'storage';
    console.warn('[save] 存档写入失败：', e);
    return false;
  }
}
function deleteSave(slot){
  try{ window.localStorage.removeItem(slotKey(slot === undefined ? curSlot : slot)); }catch(e){}
}
/* 有没有存档 */
function hasSave(slot){ return !!readSave(slot); }
/* 第 28 轮：系统菜单里的槽位切换行（保存 / 读档 / 删档都作用于当前槽） */
function renderSysSlots(){
  const box = document.getElementById('sysSlots');
  if(!box) return;
  box.innerHTML = '';
  for(let i = 0; i < CONFIG.SAVE.SLOTS; i++){
    const b = document.createElement('button');
    b.className = 'mbtn slot' + (i === curSlot ? ' on' : '');
    const d = readSave(i);
    b.textContent = '槽' + (i + 1) + (d ? (' · ' + saveDay(d) + '天') : ' · 空');
    b.addEventListener('click', ()=>{
      curSlot = i;
      renderSysSlots();
      if(sysInfo){
        let raw = '';
        try{ raw = window.localStorage.getItem(slotKey(curSlot)) || ''; }catch(e){ raw = ''; }
        const dd = readSave();
        sysInfo.textContent = dd
          ? ('槽' + (curSlot + 1) + ' · 上次保存 ' + (raw.length/1024).toFixed(1) + ' KB · 第 ' + saveDay(dd) + ' 天')
          : ('槽' + (curSlot + 1) + '：本地还没有存档');
      }
      playClick();
    });
    box.appendChild(b);
  }
}
/* 存档版本对不对得上：旧版本会先 migrate() 升级，所以 ≤ 当前版本都算 OK；只有"更新版本"才不兼容 */
function saveVersionOK(d){ return !!d && (d.v|0) <= CONFIG.SAVE.VERSION; }
/* 存档里存的是第几天 */
function saveDay(d){ return (d && d.time) ? (d.time.day|0) : 1; }

/* 存档（手动 / 自动都走这里） */
function saveGame(reason, silent){
  const data = serializeState();
  const raw = JSON.stringify(data);
  lastSaveBytes = raw.length;
  if(writeSave(data)){
    dlog('[save] 已保存：第 ' + data.time.day + ' 天 · ' + (lastSaveBytes/1024).toFixed(1) + ' KB');
    if(reason && !silent) toast('已保存（槽' + (curSlot + 1) + ' · ' + reason + '）');
    if(lastWriteConflict && !silent)
      toast('另一个标签页的存档较新，已备份为槽' + (curSlot + 1) + ' 备份后写入');
    return true;
  }
  if(!silent) toast(lastWriteError === 'size'
    ? ('保存失败：存档超过 ' + Math.round(CONFIG.SAVE.MAX_BYTES / 1024) + ' KB 上限')
    : '保存失败：浏览器可能禁用了本地存储');
  return false;
}
/* 读档 */
function loadGame(){
  const raw = readSave();
  if(!raw){ toast('槽' + (curSlot + 1) + ' 没有存档'); return false; }
  const r = migrateSave(raw);           /* 旧版本先迁移；迁移失败只降级，不清空进度 */
  const ok = deserializeState(r.save);
  if(r.degraded) toast('存档升级失败，已按旧版本读取（居民数据可能缺失）');
  else toast(ok ? '已读取存档（第 ' + clock.day + ' 天）' : '存档读取失败');
  return ok;
}
/* 删档 */
function wipeSave(){
  deleteSave();
  toast('槽' + (curSlot + 1) + ' 存档已删除');
}
/* 全新一局：删掉旧档、从头开始 */
function newGame(){
  deleteSave();
  genMap(CONFIG.SEED);
  snapshotBaseMap();
  initInventory();
  buildings = []; buildIndex.fill(-1); roads = new Uint8Array(MAP_W*MAP_H);
  stampTownFixtures();                        /* 第 25 轮：镇上的家具重新盖一遍（静态配置，不存档） */
  dropFx = [];
  clock.day = 1; clock.min = 0; clock.hold = 0;
  staminaMax = CONFIG.STAMINA.MAX; stamina = CONFIG.STAMINA.MAX;
  canLevel = 0; canWater = CONFIG.WATER_CAN.CAPACITY;
  gold = CONFIG.INIT_GOLD; hotSel = 0;
  sleepFx.phase = 'none'; sleepFx.t = 0; sleepFx.faint = false; dayRolled = false;
  paused = false;
  tut.step = 0; tut.moved = 0; tut.tilled = 0; tut.sown = 0; tut.slept = false;   /* 新游戏重置引导 */
  npcResetState();                              /* 新游戏：三位居民都当"刚认识" */
  npcRuntimeClear();                            /* 第 27 轮：清空 NPC 物理坐标（下次 tick 直接落在落脚点上） */
  dexResetState();                              /* 新游戏：图鉴清空 */
  animalResetState();                           /* 新游戏：清空动物 */
  questResetState();                            /* 新游戏：清空委托 / 信誉 */
  festivalResetState();                         /* 新游戏：清空节日状态 / 横幅 / 环境音 */
  statsResetState();                            /* 第 18 轮：统计从 0 开始（第 1 天算 1 天） */
  achResetState();                              /* 第 18 轮：成就全部重新解锁 */
  makerResetState();                            /* 第 19 轮：关闭加工台面板 / 清空食用次数 */
  endgameResetState();                          /* 第 20 轮：重置雇工 / 乌鸦记录 / 评级面板 / 结算标记 */
  tipsResetState();                             /* 第 21 轮：教学提示重新变成"未读" */
  setInteractHints(CONFIG.INTERACT_HINT.ENABLED, true);   /* 第 22 轮：交互提示恢复默认 */
  soilFert = CONFIG.QUALITY.SOIL.START;           /* 第 23 轮：土壤肥力归位 */
  visitState = {day:-1, id:'', done:0, ann:0};    /* 第 23 轮：来访居民重新抽 */
  cancelFishing(true);
  player.x = SPAWN.x*TILE + TILE/2;
  player.y = SPAWN.y*TILE + TILE/2;
  spawnGather(true);                            /* 新地图：先刷一季的采集物（不弹提示） */
  cam.x = clamp(player.x - VIEW_W/2, 0, MAP_W*TILE - VIEW_W);
  cam.y = clamp(player.y - VIEW_H/2, 0, MAP_H*TILE - VIEW_H);
  fcQueue = [];                    /* 第 28 轮：新游戏的预报队列清空，rollWeather 重抽 */
  rollWeather();
  const sky0 = skyAt(skyHour());
  sky.cur = {r:sky0.r, g:sky0.g, b:sky0.b, a:sky0.a, v:sky0.v};
  refreshPackGrid();
  updateStats();
  updateTut();
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { lastSeenAt, snapshotBaseMap, mapDiff, applyMapDiff, stowHeld, serializeState, deserializeState, slotKey, readSave, utf8Bytes, writeSave, deleteSave, hasSave, renderSysSlots, saveVersionOK, saveDay, saveGame, loadGame, wipeSave, newGame });
export { lastSeenAt, snapshotBaseMap, mapDiff, applyMapDiff, stowHeld, serializeState, deserializeState, slotKey, readSave, utf8Bytes, writeSave, deleteSave, hasSave, renderSysSlots, saveVersionOK, saveDay, saveGame, loadGame, wipeSave, newGame };
