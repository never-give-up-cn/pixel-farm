/* js/npc/perks.js —— 由 index.html 拆分，原行 8909–8926 */
'use strict';

/* --- 解锁特权：老木匠的建造折扣 --- */
function npcBuildDiscount(){ return npcState.unlock['carpenter'] ? CONFIG.NPC.CARPENTER_DISCOUNT : 1; }
/* 当前生效的建造材料价（老木匠打折后） */
function buildCost(r){
  const k = npcBuildDiscount();
  if(!r || k >= 1) return (r ? r.cost : {});
  const out = {};
  for(const id in r.cost) out[id] = Math.max(1, Math.floor(r.cost[id] * k));
  return out;
}
/* --- 解锁特权：老板娘的每日加购 --- */
function npcShopBonusLeft(){
  if(!npcState.unlock['aunt']) return 0;
  if(npcState.bonusDay !== clock.day){ npcState.bonusDay = clock.day; npcState.bonusUsed = 0; }
  if(!townOwnerPresent()) return 0;    /* 第 24 轮：老板娘不在柜台 → 今天没有加购 */
  return Math.max(0, CONFIG.NPC.SHOP_BONUS.COUNT - npcState.bonusUsed);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcBuildDiscount, buildCost, npcShopBonusLeft });
export { npcBuildDiscount, buildCost, npcShopBonusLeft };
