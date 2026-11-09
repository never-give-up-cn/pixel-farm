/* js/npc/query.js —— 由 index.html 拆分，原行 7975–7988 */
'use strict';

/* --- 基础查询 --- */
function npcDef(id){ for(const d of CONFIG.NPC.LIST) if(d.id === id) return d; return null; }
function npcAff(id){ return clamp(npcState.aff[id] | 0, 0, CONFIG.NPC.AFF_MAX); }
function npcTierOf(aff){
  let t = CONFIG.NPC.TIERS[0];
  for(const x of CONFIG.NPC.TIERS) if(aff >= x.min) t = x;
  return t;
}
function npcTierIdx(aff){ return CONFIG.NPC.TIERS.indexOf(npcTierOf(aff)); }
function npcTierName(id){ return npcTierOf(npcAff(id)).name; }
function npcUnlockTierIdx(){
  const i = CONFIG.NPC.TIERS.findIndex(t => t.key === CONFIG.NPC.UNLOCK_TIER);
  return i < 0 ? CONFIG.NPC.TIERS.length - 1 : i;
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcDef, npcAff, npcTierOf, npcTierIdx, npcTierName, npcUnlockTierIdx });
export { npcDef, npcAff, npcTierOf, npcTierIdx, npcTierName, npcUnlockTierIdx };
