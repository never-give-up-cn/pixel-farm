/* js/npc/birthday.js —— 由 index.html 拆分，原行 8564–8581 */
'use strict';

/* 生日：每季一次（season + 季内第几天 → 一年里的第几天） */
function npcBdayAbs(d){
  const si = Math.max(0, CONFIG.SEASONS.indexOf(d.bday.season));
  return si * CONFIG.DAYS_PER_SEASON + (d.bday.day | 0);
}
function npcIsBirthday(d){
  const yearLen = CONFIG.SEASONS.length * CONFIG.DAYS_PER_SEASON;
  const dayInYear = ((clock.day - 1) % yearLen) + 1;
  return dayInYear === npcBdayAbs(d);
}
/* 今天是谁的生日（没有就 null） */
function npcBirthdayToday(){
  for(const d of CONFIG.NPC.LIST) if(npcIsBirthday(d)) return d;
  return null;
}
/* 每天的送礼上限：记录的是"送出去那天是第几天"，跨天自然失效 */
function npcGiftedToday(id){ return (npcState.gift[id] | 0) === clock.day; }



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcBdayAbs, npcIsBirthday, npcBirthdayToday, npcGiftedToday });
export { npcBdayAbs, npcIsBirthday, npcBirthdayToday, npcGiftedToday };
