/* js/npc/visit.js —— 由 index.html 拆分，原行 8821–8908 */
'use strict';

/* --- 第 23 轮：NPC 来访农场 ---
 * 每天随机一位居民下午来农场转转，按「耕地数 + 建造物数 + 装饰物数」评分给金币和种子。 */
window.visitState = {day:-1, id:'', done:0, ann:0};
/* 按天数挑一位来访居民（同一天永远是同一位） */
function visitPick(){
  const list = CONFIG.NPC.LIST;
  if(!list || !list.length) return '';
  const h = (Math.imul(clock.day, 2654435761) >>> 0);
  return list[h % list.length].id;
}
/* 换天就换人：状态懒同步（读档 / 新游戏都不用额外挂钩） */
function visitEnsure(){
  if(visitState.day !== clock.day){
    visitState = {day:clock.day, id:visitPick(), done:0, ann:0};
  }
  return visitState;
}
function visitNpc(){
  visitEnsure();
  return visitState.id ? (CONFIG.NPC.LIST.find(d => d.id === visitState.id) || null) : null;
}
/* 来访进行中：当天 + 还没评过分 + 到了下午 */
function visitActive(){
  visitEnsure();
  if(!visitState.id || visitState.done) return false;
  return skyHour() >= CONFIG.VISIT.HOUR_FROM;
}
/* 来访站位：下午期间顶掉原来的时刻表位置 */
function visitSpot(d){
  if(!d || d.id !== visitState.id) return null;
  if(!visitActive()) return null;
  if(skyHour() >= CONFIG.VISIT.HOUR_TO) return null;
  return {x:FARM.x + CONFIG.VISIT.SPOT.dx, y:FARM.y + CONFIG.VISIT.SPOT.dy,
          from:CONFIG.VISIT.HOUR_FROM, to:CONFIG.VISIT.HOUR_TO};
}
/* 农场评分：耕地数 + 建造物数 + 装饰物（稻草人 / 石板路） */
function visitScore(){
  const V = CONFIG.VISIT;
  const plots = tilledPlots();
  const builds = buildings.filter(b => !b.preset).length;   /* 第 25 轮：镇上的家具不算农场的建筑 */
  let decor = 0;
  for(const b of buildings) if(!b.preset && b.type === 'scarecrow') decor++;
  for(let i=0;i<roads.length;i++) if(roads[i]) decor++;
  const score = plots*V.PLOT + builds*V.BUILD + decor*V.DECOR;
  return {plots:plots, builds:builds, decor:decor, score:score};
}
/* 和来访居民说话 → 结算评分、发奖励（一天只发一次） */
function visitReward(d){
  if(!d || d.id !== visitState.id) return null;
  if(!visitActive()) return null;
  const V = CONFIG.VISIT;
  const sc = visitScore();
  const gold = V.GOLD_BASE + Math.round(sc.score * V.GOLD_PER_POINT);
  changeGold(gold);
  let seed = null;
  if(Math.random() < V.SEED_CHANCE){
    const pool = CONFIG.SHOP.BUY.filter(b => b.id.indexOf('seed_') === 0);
    if(pool.length){
      const pick = pool[(Math.random()*pool.length)|0];
      if(pick && canFit(pick.id, 1)){ addItem(pick.id, 1); seed = itemDef(pick.id); }
    }
  }
  visitState.done = 1;
  return {score:sc, gold:gold, seed:seed};
}
/* 到场提示：下午第一次触发时弹一次 */
function visitTick(){
  visitEnsure();
  if(visitState.ann) return;
  if(skyHour() < CONFIG.VISIT.HOUR_FROM) return;
  visitState.ann = 1;
  const d = visitNpc();
  if(d) toast('👋 ' + d.name + '来农场看看了');
}
/* 存档 */
function visitSerialize(){
  return {d:visitState.day|0, i:visitState.id||'', g:visitState.done?1:0, a:visitState.ann?1:0};
}
function visitDeserialize(o){
  visitState = {day:-1, id:'', done:0, ann:0};
  if(!o || typeof o !== 'object') return false;
  if(typeof o.d === 'number') visitState.day = o.d|0;
  if(typeof o.i === 'string') visitState.id = o.i;
  if(o.g) visitState.done = 1;
  if(o.a) visitState.ann = 1;
  return true;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { visitPick, visitEnsure, visitNpc, visitActive, visitSpot, visitScore, visitReward, visitTick, visitSerialize, visitDeserialize });
export { visitPick, visitEnsure, visitNpc, visitActive, visitSpot, visitScore, visitReward, visitTick, visitSerialize, visitDeserialize };
