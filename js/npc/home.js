/* js/npc/home.js —— 由 index.html 拆分，原行 8140–8258 */
'use strict';

/* ================= 第 25 轮：走进 NPC 家的四层价值 =================
 * ① 找人：在家能聊能送礼；睡着了按 E 只会被赶走
 * ② 看装饰：按 E 看一句描述
 * ③ 拿东西：开箱子（要到「朋友」档，一周一次）
 * ④ 床：床空着就能当自己的床睡一晚 */
/* 附近最近的那件家具（只在玩家所在的屋子里找） */
function fixtureNear(){
  const room = playerRoom();
  const interior = (typeof currentMap !== 'undefined' && String(currentMap).indexOf('in_') === 0);
  if(!room && !interior) return null;
  let best = null, bd = CONFIG.INTERACT.RANGE_TILES;
  for(const b of buildings){
    if(!b.preset) continue;
    if(!interior && b.bid !== room) continue;
    const d = tileCenterDist(b.tx, b.ty);
    if(d < bd){ bd = d; best = b; }
  }
  return best;
}
/* 家具的一句描述（同一个人的家里有专属文案） */
function decorText(npcId, type){
  const H = CONFIG.NPC_HOME;
  const own = H.DECOR_BY_NPC[npcId];
  if(own && own[type]) return own[type];
  const list = H.DECOR[type];
  if(!list || !list.length) return '';
  return list[0];
}
/* 按 E 看家具 / 睡 bed */
function interactFixture(f){
  if(!f) return false;
  const npc = npcDef(f.npc);
  if(f.type === 'bed') return bedInteract(f);
  if(f.type === 'stove'){
    const st = window.MAP_WORLD && MAP_WORLD[currentMap];
    if(st && st.stove && typeof makerOpenPanel === 'function'){
      makerOpenPanel(st.stove);
      return true;
    }
  }
  if(f.type === 'chest'){
    window.openChest = f;
    if(typeof toggleChest === 'function'){ toggleChest(true); return true; }
  }
  const txt = decorText(f.npc, f.type);
  toast(txt || '看起来没什么特别的');
  return true;
}
/* 床：主人睡着就别吵醒他；空着就能当自己的床睡 */
function bedInteract(f){
  const npc = npcDef(f.npc);
  const st = npc ? npcCurrentState(npc) : null;
  if(st && st.type === 'sleep' && st.x === f.tx && st.y === f.ty){
    toast(npc.name + '睡得正香，别吵醒他');
    return false;
  }
  if(npc && st && st.type === 'sleep'){
    toast(npc.name + '睡得正香，别吵醒他');
    return false;
  }
  /* 床空着 → 在别人家也能睡一晚（跟睡自己的床一样）
   * 先睡再提示：这样最后一条提示是「你在谁的床上睡着了」，
   * 不会被 startSleep 里的「晚安…」盖掉 */
  const ok = startSleep(false);
  if(ok) toast('你在' + (npc ? npc.name + '的' : '') + '床上睡着了…');
  return ok;
}
/* 周序号（箱子一周只能开一次） */
function currentWeek(){
  const w = Math.max(1, CONFIG.NPC_HOME.LOOT_WEEK);
  return Math.floor((clock.day - 1) / w) + 1;
}
/* 打开 NPC 家的箱子：要到「朋友」档，一周一次 */
function openNpcChest(npcId){
  const npc = npcDef(npcId);
  if(!npc) return false;
  const needKey = CONFIG.NPC_HOME.LOOT_TIER;
  const need = CONFIG.NPC.TIERS.find(t => t.key === needKey);
  const aff = npcAff(npcId);
  if(need && aff < need.min){
    toast(npc.name + '的箱子还锁着 —— 好感到「' + (need ? need.name : needKey) + '」档才拿得到');
    return false;
  }
  const week = currentWeek();
  if(npcState.lootDay[npcId] === week){
    toast('这周已经来过了 —— ' + npc.name + '的箱子一周只能开一次');
    return false;
  }
  const loot = CONFIG.NPC_HOME.LOOT[npcId] || [];
  const got = [];
  for(const it of loot){
    if(!it || !CONFIG.ITEMS[it.id]) continue;
    if(!addItem(it.id, it.n)){ toast('背包装不下了'); break; }
    got.push(itemDef(it.id).name + '×' + it.n);
  }
  npcState.lootDay[npcId] = week;
  if(got.length) toast('从' + npc.name + '的箱子里拿到：' + got.join('、'));
  else toast(npc.name + '的箱子是空的');
  return true;
}
/* 谁在这天营业（日历上写「营业中：老木匠、老板娘」） */
function npcBusinessList(day){
  const out = [];
  const dy = (day === undefined || day === null) ? clock.day : day;
  for(const d of CONFIG.NPC.LIST){
    const S = npcSched(d);
    if(!S) continue;
    for(const s of S.sched){
      if(s.type !== 'work') continue;
      if(npcWandersOnWork(d, dy, s)) continue;      /* 那天她摸鱼去了 → 不算营业 */
      out.push(d.name);
      break;
    }
  }
  return out;
}
/* 对话面板上的状态提示行：「营业中（19:00 关店）」 */
function npcStatusLine(d){
  const st = npcCurrentState(d);
  if(!st) return '';
  const S = npcSched(d) || {};
  if(st.type === 'sleep') return '睡着了';
  if(st.type === 'away') return '不在镇上';
  if(st.type === 'wander') return '外出中';
  if(st.type === 'work'){
    if(st.at === 'shop' && S.open) return '营业中（' + hourText(S.open.to) + ' 关店）';
    return '在工作';
  }
  if(S.open && skyHour() < S.open.from) return '休息中（' + hourText(S.open.from) + ' 开门）';
  return '在家';
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { fixtureNear, decorText, interactFixture, bedInteract, currentWeek, openNpcChest, npcBusinessList, npcStatusLine });
export { fixtureNear, decorText, interactFixture, bedInteract, currentWeek, openNpcChest, npcBusinessList, npcStatusLine };
