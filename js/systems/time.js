/* js/systems/time.js —— 由 index.html 拆分，原行 5140–5174 */
'use strict';

/* --- 时间系统：每 tick 推进；6:00 天亮 → 20:00 入夜 → 2:00 强制结束一天 --- */
const clock = {day:1, min:0, hold:0};          /* min = 从 6:00 起经过的游戏分钟 */
const DAY_SPAN_MIN = (24 - CONFIG.DAY_START_HOUR + CONFIG.DAY_END_HOUR) * 60;  /* 6:00→次日2:00 = 1200 分 */
const GAME_MIN_PER_SEC = DAY_SPAN_MIN / (CONFIG.DAY_MINUTES * 60);             /* 每现实秒推进多少游戏分钟 */
function clockHM(){
  const total = CONFIG.DAY_START_HOUR * 60 + clock.min;
  const h = Math.floor(total / 60) % 24, m = Math.floor(total % 60);
  return {h:h, m:m, s:String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0')};
}
function skyHour(){ return (CONFIG.DAY_START_HOUR + clock.min / 60) % 24; }
function seasonName(){
  const i = Math.floor((clock.day - 1) / CONFIG.DAYS_PER_SEASON) % CONFIG.SEASONS.length;
  return CONFIG.SEASONS[i];
}
function updateClock(dt){
  if(clock.hold > 0){                          /* 停在 2:00，等 hold 结束再翻到次日 6:00 */
    clock.hold -= dt;
    if(clock.hold <= 0){
      clock.hold = 0;
      if(!dayRolled) rollToNextMorning(sleepFx.faint);
      dlog('[time] 第 ' + clock.day + ' 天 ' + clockHM().s + ' · ' + seasonName() + ' · ' + weather.name);
    }
    return;
  }
  clock.min += dt * GAME_MIN_PER_SEC;
  makerAdvance(dt * GAME_MIN_PER_SEC, false);   /* 第 19 轮：加工台按游戏时间推进 */
  if(clock.min >= DAY_SPAN_MIN){
    clock.min = DAY_SPAN_MIN;                  /* 停在 02:00 */
    clock.hold = CONFIG.DAY_END_HOLD;
    dayRolled = false;
    triggerFaint();                            /* 2:00 还没睡 → 强制昏睡 */
    dlog('[time] 第 ' + clock.day + ' 天结束（' + clockHM().s + '）→ 昏睡');
  }
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { clock, DAY_SPAN_MIN, GAME_MIN_PER_SEC, clockHM, skyHour, seasonName, updateClock });
export { clock, DAY_SPAN_MIN, GAME_MIN_PER_SEC, clockHM, skyHour, seasonName, updateClock };
