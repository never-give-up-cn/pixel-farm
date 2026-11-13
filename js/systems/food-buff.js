/* js/systems/food-buff.js —— 料理增益：吃带 buff 的菜，当天获得临时加成。
 * 增益在次日 6:00 自动清除；不写入存档。 */

'use strict';

const foodBuff = {
  id: '',
  name: '',
  day: 0,
  speed: 0,
  attack: 0,
  defense: 0,
  fishing: 0,
  mining: 0
};
window.foodBuff = foodBuff;

function foodBuffApply(item){
  if (!item || !item.buff) return false;
  const text = String(item.buff);
  foodBuff.id = item.id;
  foodBuff.name = item.name || item.id;
  foodBuff.day = (typeof clock !== 'undefined') ? clock.day : 0;
  foodBuff.speed = /速度/.test(text) ? 0.20 : 0;
  foodBuff.attack = /攻击/.test(text) ? 0.15 : 0;
  foodBuff.defense = /防御/.test(text) ? 0.20 : 0;
  foodBuff.fishing = /钓鱼/.test(text) ? 0.20 : 0;
  foodBuff.mining = /采矿/.test(text) ? 0.15 : 0;
  if (/最大能量|体力上限/.test(text) && typeof staminaMax !== 'undefined') {
    staminaMax += 20;
    if (typeof stamina !== 'undefined') stamina = Math.min(staminaMax, stamina + 20);
  }
  if (typeof toast === 'function') toast('料理增益：' + text + '（持续到今天结束）');
  return true;
}
function foodBuffClear(){
  foodBuff.id = '';
  foodBuff.name = '';
  foodBuff.day = 0;
  foodBuff.speed = 0;
  foodBuff.attack = 0;
  foodBuff.defense = 0;
  foodBuff.fishing = 0;
  foodBuff.mining = 0;
}
function foodBuffActive(){ return !!foodBuff.id; }
function foodBuffSpeedMult(){ return 1 + foodBuff.speed; }
function foodBuffAttackMult(){ return 1 + foodBuff.attack; }
function foodBuffDamageTakenMult(){ return 1 - foodBuff.defense; }
function foodBuffFishZoneMult(){ return 1 + foodBuff.fishing; }
function foodBuffMiningChance(){ return foodBuff.mining; }

Object.assign(window, {
  foodBuff, foodBuffApply, foodBuffClear, foodBuffActive,
  foodBuffSpeedMult, foodBuffAttackMult, foodBuffDamageTakenMult,
  foodBuffFishZoneMult, foodBuffMiningChance
});
export {
  foodBuff, foodBuffApply, foodBuffClear, foodBuffActive,
  foodBuffSpeedMult, foodBuffAttackMult, foodBuffDamageTakenMult,
  foodBuffFishZoneMult, foodBuffMiningChance
};
