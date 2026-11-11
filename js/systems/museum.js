/* js/systems/museum.js — 博物馆捐赠。
 * 手里拿着古物 / 遗物，在展柜前按 E 捐赠；每次奖励金币并记入收藏。
 */

'use strict';

const museumState = { donated: [], rewarded: false };
window.museumState = museumState;

function museumHas(id){
  return museumState.donated.indexOf(id) >= 0;
}
function museumTotal(){
  return Object.keys(CONFIG.ITEMS).filter(id => CONFIG.ITEMS[id].kind === 'artifact').length;
}
function museumDonate(){
  const slot = selectedSlot();
  const item = slot && itemDef(slot.id);
  if(!item){
    toast('手里拿一件古物，再按 E 放进博物馆展柜');
    return false;
  }
  if(item.kind !== 'artifact'){
    toast(item.name + '不是博物馆收藏品（需要古物 / 遗物）');
    return false;
  }
  if(museumHas(item.id)){
    toast('博物馆已经有' + item.name + '了');
    return false;
  }
  if(countItem(item.id) <= 0){ toast('背包里没有' + item.name); return false; }
  if(!removeItem(item.id, 1)){ toast('这件古物拿不出来'); return false; }
  museumState.donated.push(item.id);
  changeGold(120);
  toast('🏛 博物馆收藏：' + item.name + '（' + museumState.donated.length + '/' + museumTotal() + '，+120 金币）');
  playSfx(880, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
  if(!museumState.rewarded && museumState.donated.length >= museumTotal()){
    museumState.rewarded = true;
    changeGold(5000);
    addItem('diamond', 1);
    toast('🏛 博物馆全收集！奖励 5000 金币 + 钻石 ×1');
    playSfx(1568, 'triangle', 0.2, CONFIG.AUDIO.VOLUME);
  }
  return true;
}
function museumSerialize(){
  return { d: museumState.donated.slice(), r: museumState.rewarded ? 1 : 0 };
}
function museumDeserialize(a){
  museumState.donated = [];
  museumState.rewarded = false;
  const list = Array.isArray(a) ? a : (a && Array.isArray(a.d) ? a.d : []);
  for(const id of list){
    if(typeof id === 'string' && CONFIG.ITEMS[id] && CONFIG.ITEMS[id].kind === 'artifact' &&
       museumState.donated.indexOf(id) < 0) museumState.donated.push(id);
  }
  if(a && !Array.isArray(a) && a.r) museumState.rewarded = true;
}
function museumResetState(){ museumState.donated = []; museumState.rewarded = false; }

Object.assign(window, {
  museumState, museumHas, museumTotal, museumDonate,
  museumSerialize, museumDeserialize, museumResetState
});
export {
  museumState, museumHas, museumTotal, museumDonate,
  museumSerialize, museumDeserialize, museumResetState
};
