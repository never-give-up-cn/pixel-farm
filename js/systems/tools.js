/* js/systems/tools.js —— 工具使用 + 工具等级 / 蓄力范围。 */

'use strict';

/* 工具等级：0 基础 / 1 铜 / 2 钢 / 3 金（铁匠铺铁砧升级） */
const toolLevels = { hoe:0, can:0, axe:0, pick:0, rod:0 };
window.toolLevels = toolLevels;
const TOOL_LEVEL_MAX = 3;
const TOOL_LEVEL_NAMES = ['基础', '铜', '钢', '金'];

/* 升级费用：金币 + 矿石（矿井产出） */
const TOOL_UPGRADE_COST = [
  null,
  { gold: 2000,  mats: { copper_ore: 10 }, label: '铜' },
  { gold: 5000,  mats: { iron_ore: 10 },   label: '钢' },
  { gold: 10000, mats: { gold_ore: 10 },   label: '金' }
];

function toolLevel(id){ return Math.max(0, Math.min(TOOL_LEVEL_MAX, toolLevels[id] | 0)); }
function toolLevelName(id){ return TOOL_LEVEL_NAMES[toolLevel(id)] || '基础'; }
function toolUpgradeInfo(id){
  const lv = toolLevel(id);
  if (lv >= TOOL_LEVEL_MAX) return null;
  const c = TOOL_UPGRADE_COST[lv + 1];
  return c ? { level: lv + 1, gold: c.gold, mats: c.mats, label: c.label } : null;
}

/* 在铁匠铺铁砧升级手里拿着的工具 */
function upgradeToolAtAnvil(){
  const slot = selectedSlot();
  const item = slot && itemDef(slot.id);
  const tid = item && item.tool;
  if (!tid || !(tid in toolLevels) || tid === 'rod') {
    toast('手里拿着要升级的工具（锄头 / 水壶 / 斧头 / 镐）再来找铁砧');
    return false;
  }
  const info = toolUpgradeInfo(tid);
  if (!info) {
    toast(item.name + '已经是最高等级（' + TOOL_LEVEL_NAMES[TOOL_LEVEL_MAX] + '）了');
    return false;
  }
  if (gold < info.gold) {
    toast('金币不够（还差 ' + (info.gold - gold) + '）');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  for (const id in info.mats) {
    if (countItem(id) < info.mats[id]) {
      toast('材料不够：' + itemDef(id).name + ' ' + countItem(id) + '/' + info.mats[id]);
      playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
      return false;
    }
  }
  changeGold(-info.gold);
  for (const id in info.mats) removeItem(id, info.mats[id]);
  toolLevels[tid] = info.level;
  toast('⚒ ' + item.name + '升级为' + info.label + '级！' + (tid === 'can' ? '水壶容量 +10' : '蓄力范围扩大'));
  if (tid === 'can') canWater = canCapacity();
  playSfx(1174, 'triangle', 0.18, CONFIG.AUDIO.VOLUME);
  return true;
}

/* 蓄力范围：1 级 1×3，2 级 3×3，3 级 5×5 */
function toolAreaSize(level){
  if (level <= 0) return 1;
  if (level === 1) return 3;
  if (level === 2) return 3;
  return 5;
}
function toolAreaOffsets(level){
  const out = [];
  if (level <= 0) { out.push([0, 0]); return out; }
  if (level === 1) {
    for (let dx = -1; dx <= 1; dx++) out.push([dx, 0]);
    return out;
  }
  const r = level === 2 ? 1 : 2;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) out.push([dx, dy]);
  return out;
}
function toolAreaLabel(level){
  if (level <= 0) return '单格';
  if (level === 1) return '1×3';
  if (level === 2) return '3×3';
  return '5×5';
}

/* --- 工具使用：当前选中物品 → 工具行为 → 适用性判定 → 改地块 + 产出 + 音效 + 提示 --- */
function useTool(tx,ty,opts){
  const quiet = !!(opts && opts.quiet);
  const say = quiet ? function(){} : toast;
  const sfx = quiet ? function(){} : playSfx;

  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  if(typeof currentMap !== 'undefined' && currentMap !== 'valley'){
    say('这里只能探索、钓鱼和看地标；开垦和建造请回农场');
    return false;
  }
  if(tileCenterDist(tx,ty) > CONFIG.INTERACT.RANGE_TILES){
    say('太远了，走近一点再试试');
    sfx(110, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  const i = ty*MAP_W + tx, t = map[i];
  const crop = crops[i];
  const slot = selectedSlot();
  const item = slot ? itemDef(slot.id) : null;
  const tool = item ? CONFIG.TOOLS.find(x => x.id === item.id) : null;

  /* 0. 肥料：对着作物使用，提高品质 */
  if(item && item.kind === 'fertilizer') return useFertilizer(tx, ty, item);

  /* 1. 地里有作物：成熟的点一下就收（跟手上拿什么无关）；枯萎的要用镰刀 */
  if(crop){
    if(crop.dead){
      if(tool && tool.id === 'sickle') return clearDeadCrop(tx,ty);
      say('作物已经枯萎了，用镰刀清理');
      sfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
      return false;
    }
    if(crop.mature) return harvestCrop(tx,ty);
    if(!tool){ say('这块地里还有没熟的作物'); sfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
    if(tool.id === 'can') return waterTile(tx,ty);             /* 没熟：照常浇水 */
    if(item.kind === 'seed'){ say('这里已经种了东西'); sfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
    if(tool.id === 'sickle'){ say('还没长好，再等几天'); sfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
    say('这块地里还有没熟的作物');
    sfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }

  /* 2. 空地：必须有能用的物品 */
  if(!item){ say('这个格子是空的，先选个东西'); sfx(110,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  if(item.kind === 'currency'){ say('金币不能拿去用'); return false; }
  if(!tool){ say(item.name + '用不了'); sfx(110,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }

  /* 3. 种子：只能种在耕地上（扣背包里的种子） */
  if(item.kind === 'seed') return sowCrop(tx,ty,tool.crop,item.id);

  /* 4. 水壶 */
  if(tool.id === 'can') return waterTile(tx,ty);

  /* 4.5 斧头砍树：多段受击 → 摇晃 → 倒下 → 掉木材（第 31 轮） */
  if(tool.id === 'axe' && t === T.TREE) return chopTree(i, tx, ty);

  /* 4.6 镐敲岩石：两段受击 → 碎裂 → 掉石材 */
  if(tool.id === 'pick' && t === T.ROCK) return mineRock(i, tx, ty);

  /* 4.7 镰刀割野花 / 草地：倒伏淡出后再变空地 */
  if(tool.id === 'sickle' && (t === T.FLOWER || t === T.GRASS)) return cutObject(i, tx, ty);

  /* 5. 普通工具：按地块类型处理 */
  if(tool.accepts.indexOf(t) < 0){
    if(!quiet){ toast(item.name + '不能用在' + TILE_NAMES[t] + '上'); playSfx(110, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6); }
    return false;
  }
  /* 背包放不下产出物 → 不动地块，物品不产生（树不会被白砍）
   * 第 15 轮：镰刀割「草地」额外得到 1 份饲料（野花照旧只清理地面） */
  const toolOut = (tool.id === 'sickle' && t === T.GRASS)
    ? { item: CONFIG.ANIMALS.FEED_ITEM, n: 1 }
    : tool.out;
  if(toolOut && !canFit(toolOut.item, toolOut.n)){
    if(!quiet){ toast('背包满了，装不下' + itemDef(toolOut.item).name); playSfx(110, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6); }
    return false;
  }
  /* 体力不够就别动这块地（不消耗体力、不改地块） */
  if(!payStamina(staminaCost(tool.id))) return false;
  setTile(i, tool.to);
  if(typeof spawnTileFx === 'function' && tool.id === 'hoe') spawnTileFx('hoe', tx, ty);
  if(toolOut){
    addItem(toolOut.item, toolOut.n);
    questEmit('material', {id:toolOut.item, n:toolOut.n});   /* 第 16 轮：委托总线（木材 / 石材） */
    if(!quiet) toast((tool.id === 'sickle' && t === T.GRASS ? '割下一把草，得到 ' : '获得 ') +
          itemDef(toolOut.item).name + ' ×' + toolOut.n);
  }else{
    if(!quiet) toast(tool.msg);
  }
  if(!quiet) playSfx(tool.sfx, CONFIG.AUDIO.TYPE, CONFIG.AUDIO.DUR, CONFIG.AUDIO.VOLUME);
  if(tool.to === T.TILLED) tutTilled();      /* 新手引导：完成"锄地"这一步 */
  return true;
}

/* 蓄力使用：按工具等级覆盖周围地块；逐格扣体力，体力不够就停 */
function useToolArea(tx,ty){
  const slot = selectedSlot();
  const item = slot ? itemDef(slot.id) : null;
  const toolId = item && item.tool;
  if (!toolId || !(toolId in toolLevels)) return useTool(tx,ty);
  const lv = toolLevel(toolId);
  if (lv <= 0 || toolId === 'rod') return useTool(tx,ty);

  const offs = toolAreaOffsets(lv);
  let used = 0;
  for (const [dx,dy] of offs) {
    const x = tx + dx, y = ty + dy;
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
    if (crops[y*MAP_W + x]) continue;                 /* 有作物时逐个收，不范围收割 */
    if (used > 0 && typeof stamina !== 'undefined' && stamina < staminaCost(toolId)) break;
    if (typeof tileCenterDist === 'function' && tileCenterDist(x,y) > CONFIG.INTERACT.RANGE_TILES) continue;
    const ok = useTool(x, y, { quiet: used > 0 });
    if (ok) used++;
  }
  return used > 0;
}

/* --- 存档 --- */
function toolLevelSerialize(){
  const out = {};
  for (const id in toolLevels) out[id] = toolLevel(id);
  return out;
}
function toolLevelDeserialize(v){
  toolLevelReset();
  if (!v || typeof v !== 'object') return;
  for (const id in toolLevels) {
    const n = Number(v[id]);
    if (isFinite(n) && n > 0) toolLevels[id] = Math.min(TOOL_LEVEL_MAX, n | 0);
  }
  if (typeof canCapacity === 'function') canWater = Math.min(canWater, canCapacity());
}
function toolLevelReset(){
  for (const id in toolLevels) toolLevels[id] = 0;
}

/* --- 过渡期模块桥 --- */
Object.assign(window, {
  useTool, useToolArea, toolLevels, toolLevel, toolLevelName, toolUpgradeInfo,
  upgradeToolAtAnvil, toolAreaSize, toolAreaOffsets, toolAreaLabel,
  toolLevelSerialize, toolLevelDeserialize, toolLevelReset
});
export {
  useTool, useToolArea, toolLevels, toolLevel, toolLevelName, toolUpgradeInfo,
  upgradeToolAtAnvil, toolAreaSize, toolAreaOffsets, toolAreaLabel,
  toolLevelSerialize, toolLevelDeserialize, toolLevelReset
};
