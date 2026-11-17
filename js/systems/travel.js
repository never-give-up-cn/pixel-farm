/* js/systems/travel.js —— 巴士站 / 沙漠旅行。
 *
 * 小镇东街走到头 → 巴士站地图；巴士修好后按 E 在「巴士站 ⇄ 卡利科沙漠」之间往返。
 * 沙漠里有沙漠商人和骷髅洞穴入口。修理费用 40000g，Joja 会员 25000g。
 */

'use strict';

const travelState = { busFixed: false, quote: false };
window.travelState = travelState;

function busIsFixed(){ return !!travelState.busFixed; }
/* Joja 社区发展买断：直接修好巴士，不重复扣钱 */
function busRepairNow(){
  if(travelState.busFixed) return false;
  travelState.busFixed = true;
  travelState.quote = false;
  return true;
}
function busRepairCost(){
  return (typeof isJojaMember === 'function' && isJojaMember())
    ? CONFIG.DESERT.REPAIR_COST_JOJA
    : CONFIG.DESERT.REPAIR_COST;
}

/* 巴士交互：未修好 → 两次 E 确认修理；修好后 → 往返沙漠 */
function busInteract(){
  if(!travelState.busFixed){
    const cost = busRepairCost();
    if(!travelState.quote){
      travelState.quote = true;
      if(typeof toast === 'function') toast('巴士抛锚了：修理需要 ' + cost + ' 金币（再按一次 E 确认）');
      if(typeof playSfx === 'function') playSfx(660, 'triangle', 0.08, 0.5);
      return true;
    }
    if(gold < cost){
      if(typeof toast === 'function') toast('金币不够（还差 ' + (cost - gold) + '）');
      if(typeof playSfx === 'function') playSfx(120, 'sawtooth', 0.10, 0.4);
      return false;
    }
    if(typeof changeGold === 'function') changeGold(-cost);
    travelState.busFixed = true;
    travelState.quote = false;
    if(typeof toast === 'function') toast('🔧 巴士修好了！再按一次 E 就能去沙漠');
    if(typeof playSfx === 'function') playSfx(1046, 'triangle', 0.18, CONFIG.AUDIO.VOLUME);
    return true;
  }

  if(typeof currentMap !== 'undefined' && currentMap === 'desert'){
    if(typeof worldActivate === 'function'){
      worldActivate('busstop', 58, 52, false);
      if(typeof toast === 'function') toast('坐巴士回到小镇巴士站');
    }
  }else{
    if(typeof worldActivate === 'function'){
      worldActivate('desert', 34, 91, false);
      if(typeof toast === 'function') toast('巴士驶入卡利科沙漠 · 北边是沙漠商人，东边是骷髅洞穴');
    }
  }
  if(typeof playSfx === 'function') playSfx(300, 'sawtooth', 0.12, 0.4);
  return true;
}

/* 沙漠商人 */
function desertShopInteract(){
  if(typeof openDesertShop === 'function') return openDesertShop();
  return false;
}

/* 沙漠里的骷髅洞穴入口：和矿井 B40 的入口共用解锁条件 */
function desertSkullInteract(){
  let best = 1;
  if(typeof mineSave === 'function') best = mineSave() | 0;
  else if(window.mineState) best = (mineState.best | 0);
  if(best < 40){
    if(typeof toast === 'function') toast('洞穴深处传来风声……先在矿井到达 B40 找到骷髅钥匙');
    return false;
  }
  if(typeof enterMine === 'function'){
    enterMine(1, 'skull');
    return true;
  }
  return false;
}

/* HUD 提示 */
function busPromptText(){
  if(!travelState.busFixed) return '按 E 修理巴士（' + busRepairCost() + 'g）';
  if(typeof currentMap !== 'undefined' && currentMap === 'desert') return '按 E 坐巴士回小镇';
  return '按 E 坐巴士去沙漠';
}

/* 存档 */
function travelSerialize(){
  return { b: travelState.busFixed ? 1 : 0 };
}
function travelDeserialize(v){
  travelState.busFixed = !!(v && v.b);
  travelState.quote = false;
}
function travelReset(){
  travelState.busFixed = false;
  travelState.quote = false;
}

Object.assign(window, {
  travelState, busIsFixed, busRepairNow, busRepairCost, busInteract,
  desertShopInteract, desertSkullInteract, busPromptText,
  travelSerialize, travelDeserialize, travelReset
});
export {
  travelState, busIsFixed, busRepairNow, busRepairCost, busInteract,
  desertShopInteract, desertSkullInteract, busPromptText,
  travelSerialize, travelDeserialize, travelReset
};
