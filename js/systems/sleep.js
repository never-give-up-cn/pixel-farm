/* js/systems/sleep.js —— 由 index.html 拆分，原行 5175–5269 */
'use strict';

/* --- 睡觉 / 昏睡：淡出 → 推进一天 → 淡入 → 「第 N 天」 --- */
const sleepFx = {phase:'none', t:0, faint:false, day:0};
/* 这一次 2:00 有没有已经翻过天（时钟自己翻 / 睡觉流程翻，二选一，别翻两次） */
window.dayRolled = false;

/* 到小屋的距离（格） */
function houseDist(){
  let best = Infinity;
  for(let ty=HOUSE_POS.y; ty<HOUSE_POS.y + HOUSE_POS.h; ty++)
    for(let tx=HOUSE_POS.x; tx<HOUSE_POS.x + HOUSE_POS.w; tx++){
      const dx = (tx + 0.5)*TILE - player.x, dy = (ty + 0.5)*TILE - player.y;
      best = Math.min(best, Math.hypot(dx, dy) / TILE);
    }
  return best;
}
function nearHouse(){ return houseDist() <= CONFIG.SLEEP.RANGE; }

/* 开始睡觉（faint = true 是强制昏睡） */
function startSleep(faint){
  if(sleepFx.phase !== 'none') return false;
  cancelFishing(true);               /* 钓鱼中跑去睡觉 → 静默收竿 */
  sleepFx.phase = 'out'; sleepFx.t = 0; sleepFx.faint = !!faint;
  dayRolled = false;                 /* 本次睡觉要自己翻天（上一轮的标记不能继承） */
  statsSleep();                      /* 第 18 轮：睡觉次数统计 + 成就 */
  toast(faint ? '你撑不住了，眼前一黑…' : '晚安…');
  tutSlept();                        /* 新手引导：完成"睡觉"这一步 */
  playSleepSfx('in');                /* 入睡转场音 */
  return true;
}
/* 2:00 强制昏睡 */
function triggerFaint(){
  if(sleepFx.phase !== 'none') return;
  startSleep(true);
}
/* 翻到第二天早上：结算作物生长 → 重置浇水 → 恢复体力 */
function rollToNextMorning(faint){
  const endedDay = clock.day;  /* 第 17 轮：先记下「刚过完的那一天」 */
  const nightMin = Math.max(0, 24*60 - clock.min);   /* 第 19 轮：睡到次日 6:00 经过的游戏分钟 */
  clock.day++; clock.min = 0; clock.hold = 0;
  makerAdvance(nightMin, true);  /* 第 19 轮：睡觉时加工照常推进（跨夜直接完成） */
  statsDayTick();              /* 第 18 轮：游玩天数 +1 / 年度总结基线 / 成就检查 */
  festivalDayEnd(endedDay);    /* 第 17 轮：渔获赛排名结算 / 清掉昨天的广场装饰 */
  settleDay();                 /* 每天 6:00 结算：生长 / 枯萎 / 浇水状态重置 */
  soilDayStart();              /* 第 23 轮：土壤肥力每天自然恢复一点 */
  animalDayStart();            /* 第 15 轮：动物成长 / 好感 / 每日产出 */
  animalBreedStart();          /* 第 23 轮：好感够 + 棚舍有空 → 有概率生一只幼崽 */
  crowDayStart();              /* 第 20 轮：乌鸦可能来啄掉一株成熟作物（稻草人范围内免疫） */
  workerDayStart();            /* 第 20 轮：雇工自动浇水 + 日薪结算 / 罢工判定 */
  questDayStart();             /* 第 16 轮：委托过期 / 刷新新一天的委托 */
  rollWeather();
  festivalDayStart();          /* 第 17 轮：今天要是节日 → 立装饰 / 环境音 / 横幅 */
  if(faint){
    /* 惩罚方式选「体力」：次日体力上限扣 20%（不扣金币，避免误伤玩家资产） */
    staminaMax = Math.round((CONFIG.STAMINA.MAX + staminaBonus) * (1 - CONFIG.SLEEP.FAINT_PENALTY));
    toast('你昏睡过去了…… 次日体力上限 ' + staminaMax + '（-' +
          Math.round(CONFIG.SLEEP.FAINT_PENALTY * 100) + '%）');
  }else{
    staminaMax = CONFIG.STAMINA.MAX + staminaBonus;
  }
  stamina = staminaMax;
  dayRolled = true;
  sleepFx.day = clock.day;
  dlog('[sleep] 第 ' + clock.day + ' 天 06:00 · 体力 ' + stamina + '/' + staminaMax +
              (faint ? '（强制昏睡）' : '（正常睡觉）'));
  /* 新的一天开始 → 自动存档（玩家睡着时保存最安全） */
  gatherDayStart();                    /* 第 14 轮：每 3 天刷新草地采集物（季内 1/4/7/…/28 天，写进 map diff） */
  if(CONFIG.SAVE.AUTO_NEW_DAY && sessionActive) saveGame('新的一天');
  updateTut();                         /* 过了第 1 天就把新手引导收起来 */
  npcDayStart();                       /* 居民：新的天 → 今天谁过生日 */
  if(typeof marriageDayStart === 'function') marriageDayStart();   /* 婚礼到期 → 配偶入住 */
  if(typeof foodBuffClear === 'function') foodBuffClear();         /* 料理增益只持续一天 */
  ratingCheck();                       /* 第 20 轮：每天早上重新评估农场星级 */
}
/* 睡觉流程推进（接管整个 update） */
function updateSleepFx(dt){
  const S = CONFIG.SLEEP;
  sleepFx.t += dt;
  if(sleepFx.phase === 'out'){
    if(sleepFx.t >= S.FADE_OUT){ sleepFx.phase = 'hold'; sleepFx.t = 0; }
  }else if(sleepFx.phase === 'hold'){
    if(!dayRolled) rollToNextMorning(sleepFx.faint);   /* 全黑时翻到次日 6:00 */
    if(sleepFx.t >= S.HOLD){ sleepFx.phase = 'in'; sleepFx.t = 0; playSleepSfx('out'); }
  }else if(sleepFx.phase === 'in'){
    if(sleepFx.t >= S.FADE_IN){ sleepFx.phase = 'title'; sleepFx.t = 0; }
  }else if(sleepFx.phase === 'title'){
    if(sleepFx.t >= S.TITLE){ sleepFx.phase = 'none'; sleepFx.t = 0; }
  }
}
/* 睡觉时的全黑程度（0~1） */
function sleepAlpha(){
  const S = CONFIG.SLEEP;
  if(sleepFx.phase === 'out')  return Math.min(1, sleepFx.t / S.FADE_OUT);
  if(sleepFx.phase === 'hold') return 1;
  if(sleepFx.phase === 'in')   return Math.max(0, 1 - sleepFx.t / S.FADE_IN);
  return 0;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { sleepFx, houseDist, nearHouse, startSleep, triggerFaint, rollToNextMorning, updateSleepFx, sleepAlpha });
export { sleepFx, houseDist, nearHouse, startSleep, triggerFaint, rollToNextMorning, updateSleepFx, sleepAlpha };
