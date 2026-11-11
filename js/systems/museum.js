/* js/systems/museum.js — 博物馆捐赠。
 * 手里拿着古物 / 遗物，在展柜前按 E 捐赠；每次奖励金币并记入收藏。
 */

'use strict';

const museumState = { donated: [] };
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
  return true;
}
function museumSerialize(){
  return museumState.donated.slice();
}
function museumDeserialize(a){
  museumState.donated = [];
  if(Array.isArray(a)){
    for(const id of a){
      if(typeof id === 'string' && CONFIG.ITEMS[id] && CONFIG.ITEMS[id].kind === 'artifact' &&
         museumState.donated.indexOf(id) < 0) museumState.donated.push(id);
    }
  }
}
function museumResetState(){ museumState.donated = []; }

Object.assign(window, {
  museumState, museumHas, museumTotal, museumDonate,
  museumSerialize, museumDeserialize, museumResetState
});
export {
  museumState, museumHas, museumTotal, museumDonate,
  museumSerialize, museumDeserialize, museumResetState
};
