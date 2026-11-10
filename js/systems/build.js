/* js/systems/build.js —— 由 index.html 拆分，原行 3785–3983 */
'use strict';

/* === 5.系统 === */
/* --- 建造系统：栅栏 / 木箱 / 石板路 / 洒水器 ---
 * 建造物有两种存法：
 *   叠加层（石板路）→ roads[格] = 1，不动 map，下面的耕地照旧能用
 *   实体（栅栏/木箱/洒水器）→ buildings 数组 + buildIndex 索引（格 → 下标）
 * 建造模式：B 进入；Q/E 或滚轮换配方；左键放置（扣材料）；右键拆除（返还 50%） */
window.buildings = [];                                    /* {type, tx, ty, slots?} */
window.buildIndex = new Int32Array(MAP_W*MAP_H).fill(-1); /* 格 → buildings 下标（-1 = 没有） */
window.roads = new Uint8Array(MAP_W*MAP_H);              /* 石板路叠加层 */
window.buildMode = false;                                 /* 建造模式开关 */
window.buildSel = 0;                                     /* 当前选中的配方下标 */
window.dropFx = [];                                       /* 洒水器水滴粒子（世界坐标） */

/* 配方 */
function buildRecipes(){ return CONFIG.BUILD.RECIPES; }
function buildRecipe(id){ return CONFIG.BUILD.RECIPES.find(r => r.id === id) || null; }
function curRecipe(){ return CONFIG.BUILD.RECIPES[buildSel] || CONFIG.BUILD.RECIPES[0]; }
/* 材料够不够 */
function canAfford(r){
  if(!r) return false;
  const c = buildCost(r);                       /* 老木匠打折后要多少 */
  for(const id in c) if(countItem(id) < c[id]) return false;
  if(r.gold && gold < r.gold) return false;     /* 第 20 轮：配方可以额外要金币（铱质洒水器） */
  return true;
}
/* 第一个缺的材料 id（够则 null；金币不足返回 'gold'） */
function missingMat(r){
  if(!r) return null;
  const c = buildCost(r);
  for(const id in c) if(countItem(id) < c[id]) return id;
  if(r.gold && gold < r.gold) return 'gold';    /* 第 20 轮 */
  return null;
}
/* 这个格子能不能放这个建造物（返回空串 = 可以） */
function buildGroundOK(tx,ty,r){
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return '超出地图';
  if(tx === QUEST_BOARD.x && ty === QUEST_BOARD.y) return '这里是委托板';   /* 第 16 轮 */
  const i = ty*MAP_W + tx, t = map[i];
  if(t === T.WATER) return '水里不能建';
  if(t === T.TREE || t === T.ROCK || t === T.HOUSE || t === T.SHOP) return '这里已经有东西了';
  if(t === T.WILDFLOWER || t === T.MUSHROOM || t === T.BERRY) return '这里长着采集物，先采掉吧';
  /* 第 25 轮：门 / 地板 / 墙（前墙 / 后墙）上不能盖房子 */
  if(t === T.DOOR) return '门口不能建';
  if(t === T.FLOOR) return '地板上不能建';
  if(t === T.WALL || t === T.WALL_FRONT || t === T.WALL_BACK) return '墙上不能建';
  if(t === T.BLD) return '房子上不能建';
  if(t === T.FEST_BANNER || t === T.FEST_STALL || t === T.FEST_LANTERN) return '节日装饰先别动';   /* 第 17 轮 */
  if(r.overlay) return '';            /* 石板路是叠加层：耕地 / 作物上都铺 */
  if(t === T.TILLED || t === T.WATERED) return '耕地不能建';
  if(crops[i]) return '这里种着东西';
  if(buildIndex[i] >= 0) return '这里已经有东西了';
  return '';
}
/* 够不够得着（建造距离） */
function buildRangeOK(tx,ty){ return tileCenterDist(tx,ty) <= CONFIG.BUILD.RANGE; }
/* 预览：能不能放（ok=false 时 reason 说明原因） */
function buildPreview(tx,ty,r){
  r = r || curRecipe();
  if(!r) return {ok:false, reason:'没有可建造的东西'};
  if(!buildRangeOK(tx,ty)) return {ok:false, reason:'太远了，走近一点'};
  const g = buildGroundOK(tx,ty,r);
  if(g) return {ok:false, reason:g};
  const miss = missingMat(r);
  if(miss === 'gold') return {ok:false, reason:'金币不足（还差 ' + (r.gold - gold) + '）'};
  if(miss) return {ok:false, reason:'材料不足（还差' + itemDef(miss).name + '）'};
  return {ok:true, reason:''};
}
/* 放置 */
function placeBuilding(tx,ty){
  const r = curRecipe();
  const p = buildPreview(tx,ty,r);
  if(!p.ok){
    toast(p.reason);
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  const need = buildCost(r);                  /* 老木匠打折后的实际材料 */
  for(const id in need) removeItem(id, need[id]);
  if(r.gold) changeGold(-r.gold);             /* 第 20 轮：铱质洒水器的金币造价 */
  if(r.overlay){
    roads[ty*MAP_W+tx] = 1;
  }else{
    const b = {type:r.id, tx:tx, ty:ty};
    if(r.id === 'chest') b.slots = new Array(CONFIG.BUILD.CHEST_SLOTS).fill(null);
    if(r.id === 'autobox') b.slots = new Array(CONFIG.ENDGAME.AUTOBOX.SLOTS).fill(null);  /* 第 20 轮 */
    if(r.id === 'maker'){ b.job = null; b.out = []; }   /* 第 19 轮：加工台自己的活儿与产出槽 */
    buildings.push(b);
    buildIndex[ty*MAP_W+tx] = buildings.length - 1;
  }
  ratingCheck();                              /* 第 20 轮：建筑数变化 → 重新评估星级 */
  statsBuild();                               /* 第 18 轮：建造统计 + 成就 */
  toast('造好了' + r.name);
  playSfx(660, 'square', 0.12, CONFIG.AUDIO.VOLUME);
  return true;
}
/* 拆除（返还 50% 材料） */
function demolishAt(tx,ty){
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  const i = ty*MAP_W + tx;
  /* 石板路是叠加层，单独拆 */
  if(roads[i]){
    roads[i] = 0;
    const back = Math.floor(buildCost(buildRecipe('path')).stone * CONFIG.BUILD.REFUND);
    if(back > 0) addItem('stone', back);
    toast('拆掉了石板路（返还石材×' + back + '）');
    playSfx(220, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return true;
  }
  const bi = buildIndex[i];
  if(bi < 0){
    toast('这里没有可以拆的东西');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  const b = buildings[bi], r = buildRecipe(b.type);
  /* 装修家具：拆回背包 */
  if(b.type.indexOf('furn_') === 0){
    const id = b.type.slice(5);
    buildings.splice(bi, 1);
    buildIndex.fill(-1);
    for(let k=0;k<buildings.length;k++){
      const bb = buildings[k];
      buildIndex[bb.ty*MAP_W+bb.tx] = k;
    }
    if(id) addItem(id, 1);
    toast('收起了家具');
    playSfx(320, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.7);
    return true;
  }
  /* 第 25 轮：镇上的家具拆不了 */
  if(b.preset){
    toast('镇上的东西，拆不了');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  /* 第 15 轮：棚舍里还有动物 → 拦住（先把动物放生，再拆棚舍） */
  if((b.type === 'coop' || b.type === 'barn') && animalsInShelter(b.tx, b.ty) > 0){
    toast('棚舍里还有 ' + animalsInShelter(b.tx, b.ty) + ' 只动物，先在动物面板里放生再拆');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  if((b.type === 'chest' || b.type === 'autobox') && b.slots && b.slots.some(s => s)){
    toast((b.type === 'autobox' ? '采集箱' : '木箱') + '里有东西，先清空再拆');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  /* 第 19 轮：加工台正在加工 / 还有产出 → 先取走再拆，避免成品凭空消失 */
  if(b.type === 'maker' && (b.job || (b.out && b.out.length))){
    toast(b.job ? '加工台还在工作，先等它做完' : '加工台里还有成品，先取走再拆');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  let back = '';
  const rc = buildCost(r);                       /* 按实际付过的（打折后的）材料返还 */
  for(const id in rc){
    const n = Math.floor(rc[id] * CONFIG.BUILD.REFUND);
    if(n > 0){ addItem(id, n); back += itemDef(id).name + '×' + n + ' '; }
  }
  if(r.gold){                                    /* 第 20 轮：金币造价也返还一半 */
    const gy = Math.floor(r.gold * CONFIG.BUILD.REFUND);
    if(gy > 0){ changeGold(gy); back += '金币×' + gy + ' '; }
  }
  buildings.splice(bi, 1);
  buildIndex.fill(-1);                     /* 重建索引（下标会整体前移） */
  for(let k=0; k<buildings.length; k++) buildIndex[buildings[k].ty*MAP_W + buildings[k].tx] = k;
  ratingCheck();                           /* 第 20 轮：建筑数变化 → 重新评估星级 */
  toast('拆掉了' + r.name + (back ? '（返还 ' + back.trim() + '）' : ''));
  playSfx(220, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
  return true;
}
/* 这一格上有什么建造物 */
function buildingAt(tx,ty){
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return null;
  const bi = buildIndex[ty*MAP_W+tx];
  return bi >= 0 ? buildings[bi] : null;
}
/* 进入 / 退出建造模式 */
function toggleBuild(on){
  const want = (on === undefined) ? !buildMode : !!on;
  if(want === buildMode) return;
  buildMode = want;
  if(buildMode){
    if(packOpen) togglePack(false);
    if(shopOpen) toggleShop(false);
    if(chestOpen) toggleChest(false);
    toast('建造模式：Q/E 换配方 · 左键放置 · 右键拆除 · B 退出');
  }
  playSfx(520, 'square', 0.08, CONFIG.AUDIO.VOLUME);
}
/* 换配方（dir = +1 下一个 / -1 上一个） */
function cycleBuild(dir){
  const n = CONFIG.BUILD.RECIPES.length;
  if(!n) return;
  buildSel = (buildSel + (dir >= 0 ? 1 : -1) + n) % n;
  const r = curRecipe();
  toast('选中：' + r.name + '（' + costText(r) + '）');
}
/* 配方的材料文字：木材×3 石材×5（第 20 轮：金币造价也写进去） */
function costText(r){
  let s = '';
  const c = buildCost(r);
  for(const id in c) s += itemDef(id).name + '×' + c[id] + ' ';
  if(r.gold) s += '金币×' + r.gold + ' ';      /* 第 20 轮：铱质洒水器的金币造价 */
  return s.trim();
}
/* 石板路：脚下那一格是不是路 */
function roadUnderPlayer(){
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor((player.y + BOX_OFF_Y + CONFIG.PLAYER.BOX_H/2) / TILE);
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  return roads[ty*MAP_W+tx] === 1;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { buildRecipes, buildRecipe, curRecipe, canAfford, missingMat, buildGroundOK, buildRangeOK, buildPreview, placeBuilding, demolishAt, buildingAt, toggleBuild, cycleBuild, costText, roadUnderPlayer });
export { buildRecipes, buildRecipe, curRecipe, canAfford, missingMat, buildGroundOK, buildRangeOK, buildPreview, placeBuilding, demolishAt, buildingAt, toggleBuild, cycleBuild, costText, roadUnderPlayer };
