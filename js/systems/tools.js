/* js/systems/tools.js —— 由 index.html 拆分，原行 4910–4984 */
'use strict';

/* --- 工具使用：当前选中物品 → 工具行为 → 适用性判定 → 改地块 + 产出 + 音效 + 提示 --- */
function useTool(tx,ty){
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  if(typeof currentMap !== 'undefined' && currentMap !== 'valley'){
    toast('这里只能探索、钓鱼和看地标；开垦和建造请回农场');
    return false;
  }
  if(tileCenterDist(tx,ty) > CONFIG.INTERACT.RANGE_TILES){
    toast('太远了，走近一点再试试');
    playSfx(110, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  const i = ty*MAP_W + tx, t = map[i];
  const crop = crops[i];
  const slot = selectedSlot();
  const item = slot ? itemDef(slot.id) : null;
  const tool = item ? CONFIG.TOOLS.find(x => x.id === item.id) : null;

  /* 1. 地里有作物：成熟的点一下就收（跟手上拿什么无关）；枯萎的要用镰刀 */
  if(crop){
    if(crop.dead){
      if(tool && tool.id === 'sickle') return clearDeadCrop(tx,ty);
      toast('作物已经枯萎了，用镰刀清理');
      playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
      return false;
    }
    if(crop.mature) return harvestCrop(tx,ty);
    if(!tool){ toast('这块地里还有没熟的作物'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
    if(tool.id === 'can') return waterTile(tx,ty);             /* 没熟：照常浇水 */
    if(item.kind === 'seed'){ toast('这里已经种了东西'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
    if(tool.id === 'sickle'){ toast('还没长好，再等几天'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
    toast('这块地里还有没熟的作物');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }

  /* 2. 空地：必须有能用的物品 */
  if(!item){ toast('这个格子是空的，先选个东西'); playSfx(110,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  if(item.kind === 'currency'){ toast('金币不能拿去用'); return false; }
  if(!tool){ toast(item.name + '用不了'); playSfx(110,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }

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
    toast(item.name + '不能用在' + TILE_NAMES[t] + '上');
    playSfx(110, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  /* 背包放不下产出物 → 不动地块，物品不产生（树不会被白砍）
   * 第 15 轮：镰刀割「草地」额外得到 1 份饲料（野花照旧只清理地面） */
  const toolOut = (tool.id === 'sickle' && t === T.GRASS)
    ? { item: CONFIG.ANIMALS.FEED_ITEM, n: 1 }
    : tool.out;
  if(toolOut && !canFit(toolOut.item, toolOut.n)){
    toast('背包满了，装不下' + itemDef(toolOut.item).name);
    playSfx(110, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  /* 体力不够就别动这块地（不消耗体力、不改地块） */
  if(!payStamina(staminaCost(tool.id))) return false;
  setTile(i, tool.to);
  if(typeof spawnTileFx === 'function' && tool.id === 'hoe') spawnTileFx('hoe', tx, ty);
  if(toolOut){
    addItem(toolOut.item, toolOut.n);
    questEmit('material', {id:toolOut.item, n:toolOut.n});   /* 第 16 轮：委托总线（木材 / 石材） */
    toast((tool.id === 'sickle' && t === T.GRASS ? '割下一把草，得到 ' : '获得 ') +
          itemDef(toolOut.item).name + ' ×' + toolOut.n);
  }else{
    toast(tool.msg);
  }
  playSfx(tool.sfx, CONFIG.AUDIO.TYPE, CONFIG.AUDIO.DUR, CONFIG.AUDIO.VOLUME);
  if(tool.to === T.TILLED) tutTilled();      /* 新手引导：完成"锄地"这一步 */
  return true;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { useTool });
export { useTool };
