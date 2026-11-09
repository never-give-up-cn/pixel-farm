/* js/npc/state.js —— 由 index.html 拆分，原行 7818–7845 */
'use strict';

/* === 9.NPC系统 === */
/* 小镇上有三位居民：白天按各自的时刻表出现在固定点（到点就换地方，夜里回家消失）。
 * 走近 1.5 格按 E 说话：打字机逐字显示，E / 空格推进（没打完就整句显示，打完了就下一句）。
 * 好感度 0~100 分 4 档，升到「朋友」档立刻解锁各自的小福利；每人每天最多送一次礼。
 * 本轮新增的存档字段 npc（紧凑结构）；存档版本 v1 → v2 由 migrate() 负责无损升级。 */

/* --- 运行时状态（会被写进存档） --- */
const npcState = {
  aff:    {},   /* id → 好感度 0~100 */
  gift:   {},   /* id → 上次送礼时的天数（跨天自动失效 → 实现"每天一次"） */
  unlock: {},   /* id → 1 = 已经发过「朋友」档的解锁福利 */
  lootDay:{},   /* 第 25 轮：id → 上次开他箱子时的「周序号」（一周只能开一次） */
  bonusDay: -1, /* 老板娘加购计数所属的天 */
  bonusUsed: 0  /* 老板娘当天已加购的件数 */
};
/* 把 NPC 状态复位（新游戏 / 读档前） */
function npcResetState(){
  npcState.aff = {}; npcState.gift = {}; npcState.unlock = {}; npcState.lootDay = {};
  npcState.bonusDay = -1; npcState.bonusUsed = 0;
  for(const d of CONFIG.NPC.LIST){
    npcState.aff[d.id] = 0;
    npcState.gift[d.id] = -1;
    npcState.unlock[d.id] = 0;
    npcState.lootDay[d.id] = 0;
  }
}
npcResetState();



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcState, npcResetState });
export { npcState, npcResetState };
