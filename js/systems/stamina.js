/* js/systems/stamina.js —— 由 index.html 拆分，原行 3984–4006 */
'use strict';

/* --- 体力：干活消耗，睡觉恢复；为 0 时干不了活 --- */
window.stamina = CONFIG.STAMINA.MAX;      /* 当前体力（可为小数：奔跑按秒扣） */
window.staminaMax = CONFIG.STAMINA.MAX;   /* 当前体力上限（昏睡后会被扣 20%） */
/* 某个动作消耗多少体力 */
function staminaCost(id){ return CONFIG.STAMINA.TOOL_COST[id] || 0; }
/* 扣体力：体力为 0 时任何消耗体力的动作都做不了 */
function payStamina(cost){
  if(cost <= 0) return true;
  if(stamina <= 0){
    toast('体力不足');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  stamina = Math.max(0, stamina - cost);
  return true;
}
/* 体力耗尽时的视觉暗角强度（0~1，画暗角用） */
function exhaustedGlow(){
  if(stamina > 0) return 0;
  const t = performance.now() / 1000;
  return 0.55 + 0.45 * Math.sin(t * 3.2);      /* 缓慢呼吸感的红晕 */
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { staminaCost, payStamina, exhaustedGlow });
export { staminaCost, payStamina, exhaustedGlow };
