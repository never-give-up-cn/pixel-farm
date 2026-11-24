/* js/systems/sleep.js —— 由 index.html 拆分，原行 5175–5269 */
'use strict';

/* --- 睡觉 / 昏睡：淡出 → 当日总结 → 确认 → 推进一天 → 淡入 → 「第 N 天」 --- */
const sleepFx = {phase:'none', t:0, faint:false, day:0, summaryShown:false};
/* 这一次 2:00 有没有已经翻过天（时钟自己翻 / 睡觉流程翻，二选一，别翻两次） */
window.dayRolled = false;

/* --- 跨夜总结页 --- */
const daySumEl    = document.getElementById('daySum');
const daySumMask  = document.getElementById('daySumMask');
const daySumTitle = document.getElementById('daySumTitle');
const daySumSub   = document.getElementById('daySumSub');
const daySumBody  = document.getElementById('daySumBody');
const daySumFoot  = document.getElementById('daySumFoot');
const btnDaySumOk = document.getElementById('daySumOk');
window.daySumOpen = false;
window.dayBase = null;        /* 当天开始时的金币 / 统计基线，用来算“今天赚了多少” */

/* 记录当天基线。新游戏 / 读档 / 每天早上各记一次。 */
function dayBaseCapture(){
  const st = (typeof statsState !== 'undefined' && statsState) ? statsState : null;
  window.dayBase = {
    day: clock.day,
    gold: (typeof gold === 'number' ? gold : 0),
    hv: st ? st.hv : 0,
    fs: st ? st.fs : 0,
    gc: st ? st.gc : 0,
    ach: (typeof achCount === 'function' ? achCount() : 0)
  };
  return window.dayBase;
}
function dayBaseGet(){
  return window.dayBase || dayBaseCapture();
}
/* 汇总刚过完的这一天 */
function buildDaySummary(){
  const base = dayBaseGet();
  const st = (typeof statsState !== 'undefined' && statsState) ? statsState : null;
  const info = (typeof ratingParts === 'function') ? ratingParts(true) : null;
  const w = weather || null;
  return {
    day: clock.day,
    season: (typeof seasonName === 'function' ? seasonName() : '春'),
    date: ((clock.day - 1) % CONFIG.DAYS_PER_SEASON) + 1,
    weather: (w && w.name) ? w.name : '晴',
    gold: (typeof gold === 'number' ? gold : 0),
    goldDelta: (typeof gold === 'number' ? gold : 0) - (base.gold | 0),
    income: (typeof statsDailyIncome === 'function' ? statsDailyIncome() : 0),
    harvest: st ? Math.max(0, st.hv - base.hv) : 0,
    fish: st ? Math.max(0, st.fs - base.fs) : 0,
    gifts: st ? Math.max(0, st.gc - base.gc) : 0,
    ach: Math.max(0, (typeof achCount === 'function' ? achCount() : 0) - base.ach),
    stamina: Math.ceil(typeof stamina === 'number' ? stamina : 0),
    staminaMax: typeof staminaMax === 'number' ? staminaMax : 0,
    stars: info ? info.stars : 0,
    starsMax: info ? info.starsMax : (CONFIG.ENDGAME.RATING.STARS | 0)
  };
}
function daySumRender(d){
  if(daySumTitle) daySumTitle.textContent = '第 ' + d.day + ' 天 · ' + d.season + ' ' + d.date + ' 日';
  if(daySumSub) daySumSub.textContent = d.weather + ' · 金币 ' + d.gold + ' · 明天进入第 ' + (d.day + 1) + ' 天';
  if(daySumBody){
    daySumBody.innerHTML = '';
    const sd = (d.goldDelta >= 0 ? '+' : '') + d.goldDelta;
    const rows = [
      ['💰 今日收入', '+' + d.income + ' 金'],
      ['💵 金币变化', sd + ' 金（现有 ' + d.gold + '）'],
      ['🌾 收获 · 🎣 钓鱼', d.harvest + ' 个 · ' + d.fish + ' 条'],
      ['🎁 送礼 · 🏆 新成就', d.gifts + ' 次 · ' + d.ach + ' 个'],
      ['⭐ 农场评级', (typeof ratingStarsText === 'function' ? ratingStarsText(d.stars) : String(d.stars))],
      ['⚡ 体力', d.stamina + '/' + d.staminaMax + ' → 明天回满']
    ];
    for(const r of rows){
      const line = document.createElement('div');
      line.className = 'arline';
      const k = document.createElement('span'); k.textContent = r[0];
      const v = document.createElement('span'); v.className = 'arv'; v.textContent = r[1];
      line.appendChild(k); line.appendChild(v);
      daySumBody.appendChild(line);
    }
  }
  if(daySumFoot) daySumFoot.textContent =
    (sleepFx.faint ? '你昏睡过去了：明天体力上限 -20% · ' : '') +
    '确认后自动存档，进入第 ' + (d.day + 1) + ' 天';
}
function daySumOpenPanel(data){
  if(daySumOpen || !daySumEl) return false;
  daySumOpen = true;
  daySumRender(data || buildDaySummary());
  if(typeof setPanelOpen === 'function') setPanelOpen(daySumEl, true);
  else daySumEl.classList.add('open');
  if(typeof playSfx === 'function') playSfx(660, 'triangle', 0.12, 0.5);
  return true;
}
function daySumClosePanel(){
  if(!daySumOpen) return false;
  daySumOpen = false;
  if(typeof setPanelOpen === 'function') setPanelOpen(daySumEl, false);
  else daySumEl.classList.remove('open');
  return true;
}
/* 玩家点「确认」：关掉总结 → 真正翻到第二天 → 淡入 */
function daySummaryConfirm(){
  if(!daySumOpen) return false;
  daySumClosePanel();
  if(!dayRolled) rollToNextMorning(sleepFx.faint);
  sleepFx.phase = 'in';
  sleepFx.t = 0;
  sleepFx.summaryShown = true;
  if(typeof playSleepSfx === 'function') playSleepSfx('out');
  if(typeof playClick === 'function') playClick();
  return true;
}
if(btnDaySumOk) btnDaySumOk.addEventListener('click', ()=>daySummaryConfirm());
/* Enter / 空格 / Esc 都能确认（睡眠期间 input.js 会忽略其它按键） */
window.addEventListener('keydown', e=>{
  if(!daySumOpen) return;
  if(e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape' || e.code === 'NumpadEnter'){
    e.preventDefault();
    daySummaryConfirm();
  }
});

/* 到小屋的距离（格） */
function houseDist(){
  if(typeof currentMap !== 'undefined' && !(typeof isFarmMap === 'function' ? isFarmMap(currentMap) : currentMap === 'farm'))
    return Infinity;
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
  if(daySumOpen) daySumClosePanel();
  sleepFx.phase = 'out'; sleepFx.t = 0; sleepFx.faint = !!faint;
  sleepFx.summaryShown = false;
  dayRolled = false;                 /* 本次睡觉要自己翻天（上一轮的标记不能继承） */
  dayBaseGet();                      /* 确保有当日基线，总结才有“今天变化” */
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
    staminaMax = Math.round((CONFIG.STAMINA.MAX + staminaBonus) * (1 - CONFIG.SLEEP.FAINT_PENALTY)) +
                 (typeof equipStaminaBonus === 'function' ? equipStaminaBonus() : 0);
    toast('你昏睡过去了…… 次日体力上限 ' + staminaMax + '（-' +
          Math.round(CONFIG.SLEEP.FAINT_PENALTY * 100) + '%）');
  }else{
    staminaMax = CONFIG.STAMINA.MAX + staminaBonus +
                 (typeof equipStaminaBonus === 'function' ? equipStaminaBonus() : 0);
  }
  stamina = staminaMax;
  /* Joja 社区水井：每天早上自动把水壶补满 */
  if(typeof jojaDevHas === 'function' && jojaDevHas('well') &&
     typeof canCapacity === 'function'){
    canWater = canCapacity();
  }
  dayRolled = true;
  sleepFx.day = clock.day;
  dlog('[sleep] 第 ' + clock.day + ' 天 06:00 · 体力 ' + stamina + '/' + staminaMax +
              (faint ? '（强制昏睡）' : '（正常睡觉）'));
  /* 新的一天开始 → 自动存档（玩家睡着时保存最安全） */
  gatherDayStart();                    /* 第 14 轮：每 3 天刷新草地采集物（季内 1/4/7/…/28 天，写进 map diff） */
  dayBaseCapture();                    /* 新的一天：重置“今天赚了多少”的基线 */
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
    if(sleepFx.t >= S.FADE_OUT){
      sleepFx.phase = 'hold';
      sleepFx.t = 0;
      if(!sleepFx.summaryShown){
        sleepFx.summaryShown = true;
        daySumOpenPanel(buildDaySummary());   /* 黑屏里弹出当日总结，等玩家确认 */
      }
    }
  }else if(sleepFx.phase === 'hold'){
    if(daySumOpen){ sleepFx.t = 0; return; }  /* 总结页没确认前不翻日 */
    if(!dayRolled) rollToNextMorning(sleepFx.faint);   /* 面板被意外关掉时的兜底 */
    if(sleepFx.t >= 0.12){ sleepFx.phase = 'in'; sleepFx.t = 0; playSleepSfx('out'); }
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
Object.assign(window, { sleepFx, houseDist, nearHouse, startSleep, triggerFaint, rollToNextMorning, updateSleepFx, sleepAlpha, dayBaseCapture, dayBaseGet, buildDaySummary, daySumOpenPanel, daySumClosePanel, daySummaryConfirm });
export { sleepFx, houseDist, nearHouse, startSleep, triggerFaint, rollToNextMorning, updateSleepFx, sleepAlpha, dayBaseCapture, dayBaseGet, buildDaySummary, daySumOpenPanel, daySumClosePanel, daySummaryConfirm };
