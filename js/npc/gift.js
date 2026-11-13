/* js/npc/gift.js —— 由 index.html 拆分，原行 8717–8820 */
'use strict';

/* --- 送礼 --- */
function npcStartGift(){
  const d = npcDef(giftTarget || npcDlg.id);
  if(!d) return false;
  if(npcGiftedToday(d.id)){ toast(d.name + '：今天已经收过礼物啦，明天再来吧'); return false; }
  giftTarget = d.id;
  packMode = 'gift';
  togglePack(true);
  if(packEl) packEl.classList.add('gift');
  refreshPackGrid();
  toast('给 ' + d.name + ' 挑一件礼物（点一下格子就送出去）');
  sysTipShow('gift');                        /* 第 21 轮：第一次送礼 → 教学提示 */
  return true;
}
/* 在背包里点一格 = 把这件东西送出去 */
function npcGiftPick(i){
  const s = inv[i];
  const d = npcDef(giftTarget);
  if(!d || !s) return false;
  if(npcGiftedToday(d.id)){ toast('今天已经送过礼了'); return false; }
  const id = s.id;
  const idef = itemDef(id);
  if(idef && idef.kind === 'tool'){        /* 工具是吃饭的家伙，别送出去 */
    toast(idef.name + '还是自己留着用吧（工具不能送）');
    return false;
  }
  if(idef && idef.romance){                /* 花束 / 吊坠要在对话里用恋爱按钮 */
    toast(idef.name + '要在对话里用「交往 / 求婚」按钮使用，不能当普通礼物');
    return false;
  }
  let delta = CONFIG.NPC.GIFT.NORMAL, word = '收了';
  if(d.dislike.indexOf(id) >= 0){ delta = CONFIG.NPC.GIFT.DISLIKE; word = '不太喜欢'; }
  else if(d.like.indexOf(id) >= 0){ delta = CONFIG.NPC.GIFT.LIKE; word = '很喜欢'; }
  const bday = npcIsBirthday(d);
  const eff = festivalGiftAff(bday ? delta * CONFIG.NPC.GIFT.BIRTHDAY_MULT : delta);   /* 第 17 轮：冬夜灯会 ×3 */
  const festGift = festivalIs('winter');
  if(!removeItem(id, 1)){                  /* 第 22 轮：先确认真的拿得走，再送礼 */
    toast('这件东西拿不走了，礼物没送出去');
    return false;
  }
  npcState.gift[d.id] = clock.day;          /* 记下"今天送过" → 跨天自动重置 */
  /* 收起背包，回到对话 */
  packMode = 'normal';
  if(packEl) packEl.classList.remove('gift');
  togglePack(false);
  giftTarget = null;
  const it = itemDef(id);
  toast('把 ' + (it ? it.name : id) + ' 送给了 ' + d.name + '（' + word + '，好感 ' +
        (eff >= 0 ? '+' : '') + eff + (bday ? '，生日 ×' + CONFIG.NPC.GIFT.BIRTHDAY_MULT : '') +
        (festGift ? '，灯会 ×' + CONFIG.FESTIVAL.GIFT_MULT : '') + '）');
  npcAddAff(d.id, eff);
  statsGift();                              /* 第 18 轮：送礼次数统计 + 成就 */
  renderNpcDialog();
  return true;
}
/* 好感度变化 + 跨档提示 + 解锁 */
function npcAddAff(id, delta){
  const d = npcDef(id);
  if(!d) return;
  const aff0 = npcAff(id);
  const before = npcTierIdx(npcAff(id));
  npcState.aff[id] = clamp(npcAff(id) + delta, 0, CONFIG.NPC.AFF_MAX);
  statsAff(npcAff(id) - aff0);          /* 第 18 轮：好感总和增量统计 + 成就 */
  const after = npcTierIdx(npcAff(id));
  if(after > before){
    const t = CONFIG.NPC.TIERS[after];
    toast(d.name + ' 对你的好感升到「' + t.name + '」！');
    playSfx(988, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
    if(after >= npcUnlockTierIdx()) npcUnlock(d);
  }
}
/* 「朋友」档的解锁福利 */
function npcUnlock(d){
  if(!d || npcState.unlock[d.id]) return false;
  if(d.id === 'carpenter'){
    npcState.unlock[d.id] = 1;
    toast('老木匠答应给你打折的建造配方（材料 ' + Math.round(CONFIG.NPC.CARPENTER_DISCOUNT*100) + '%）');
  }else if(d.id === 'aunt'){
    npcState.unlock[d.id] = 1;
    toast('老板娘答应每天多收购 ' + CONFIG.NPC.SHOP_BONUS.COUNT + ' 件作物（' +
          CONFIG.NPC.SHOP_BONUS.PRICE_MULT + ' 倍价）');
  }else if(d.id === 'girl'){
    const sid = CONFIG.NPC.GIFT_SEED, n = CONFIG.NPC.GIFT_SEED_N;
    if(!canFit(sid, n)){
      toast('邻家女孩想送你稀有种子，可背包满了……先卖点东西再来');
      return false;                            /* 背包没位就不算解锁，等有空再来 */
    }
    addItem(sid, n);
    npcState.unlock[d.id] = 1;
    const it = itemDef(sid);
    toast('邻家女孩送了你 ' + n + ' 颗' + (it ? it.name : sid) + '！');
  }else{
    npcState.unlock[d.id] = 1;
  }
  return true;
}
/* 读档后补发解锁（老档里好感度够但没发过福利的） */
function npcSyncUnlocks(){
  for(const d of CONFIG.NPC.LIST){
    if(npcTierIdx(npcAff(d.id)) >= npcUnlockTierIdx() && !npcState.unlock[d.id]) npcUnlock(d);
  }
}
/* 新的一天：生日提示 */
function npcDayStart(){
  const b = npcBirthdayToday();
  if(b) toast('🎂 今天是 ' + b.name + ' 的生日！送礼物好感翻倍');
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcStartGift, npcGiftPick, npcAddAff, npcUnlock, npcSyncUnlocks, npcDayStart });
export { npcStartGift, npcGiftPick, npcAddAff, npcUnlock, npcSyncUnlocks, npcDayStart };
