/* js/systems/town-interactions.js — 小镇室内的功能家具：
 * Joja 货箱购买 / 诊所治疗 / 酒馆点唱机。
 */

'use strict';

let jojaOfferDay = -1;
let jojaOfferId = null;

function jojaTodayOffer(){
  if(jojaOfferDay === clock.day && jojaOfferId) return jojaOfferId;
  const pool = (CONFIG.JOJA.STOCK || []).filter(id => CONFIG.ITEMS[id]);
  const id = pool.length ? pool[clock.day % pool.length] : null;
  jojaOfferId = id;
  jojaOfferDay = clock.day;
  return id;
}

function jojaInteract(){
  const id = jojaTodayOffer();
  const item = id && itemDef(id);
  if(!item){ toast('Joja 货箱今天没有补货'); return false; }
  const price = priceOf(id);
  if(jojaOfferDay === clock.day && jojaOfferId && jojaInteract._quoted === id){
    if(gold < price){ toast('金币不够（还差 ' + (price - gold) + '）'); return false; }
    if(!canFit(id, 1)){ toast('背包满了'); return false; }
    if(buyItem(id)){
      jojaInteract._quoted = null;
      jojaOfferId = null;
    }
    return true;
  }
  jojaInteract._quoted = id;
  toast('Joja 今日特价：' + item.name + '（' + price + ' 金币）· 再按一次 E 购买');
  playSfx(660, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.6);
  return true;
}

function clinicTreat(){
  const cost = CONFIG.CLINIC.COST;
  if(stamina >= staminaMax){
    toast('你的体力是满的，哈维说不用治疗');
    return false;
  }
  if(gold < cost){
    toast('治疗需要 ' + cost + ' 金币（还差 ' + (cost - gold) + '）');
    return false;
  }
  changeGold(-cost);
  stamina = staminaMax;
  toast('🏥 哈维给你做了检查，体力回满了（-' + cost + ' 金币）');
  playSfx(784, 'sine', 0.12, CONFIG.AUDIO.VOLUME);
  updateStats();
  return true;
}

const JUKEBOX_TRACKS = [
  { name:'山谷的早晨', notes:[523, 659, 784, 659, 523, 440] },
  { name:'矿洞回声',   notes:[392, 440, 523, 440, 392, 330] },
  { name:'星之果实',   notes:[659, 784, 880, 784, 659, 523] },
  { name:'雨夜',       notes:[440, 523, 494, 392, 349, 330] }
];
let jukeboxTrack = 0;

function jukeboxPlay(){
  const track = JUKEBOX_TRACKS[jukeboxTrack % JUKEBOX_TRACKS.length];
  jukeboxTrack++;
  track.notes.forEach((f, i) => {
    setTimeout(() => {
      if(typeof playSfx === 'function') playSfx(f, 'triangle', 0.18, CONFIG.AUDIO.VOLUME * 0.7);
    }, i * 170);
  });
  toast('🎵 点唱机：' + track.name);
  return true;
}

/* ---------- 旅行货车 ---------- */
function cartCycle(){
  const C = CONFIG.CART;
  return Math.floor((clock.day - 1) / Math.max(1, C.CYCLE));
}
function cartNextDay(){
  const C = CONFIG.CART;
  return (cartCycle() + 1) * Math.max(1, C.CYCLE) + 1;
}
function cartStock(){
  const C = CONFIG.CART;
  const pool = (C.STOCK || []).filter(id => CONFIG.ITEMS[id]);
  if(!pool.length) return [];
  const rng = mulberry32((0x9e3779b9 ^ (cartCycle() * 2654435761)) >>> 0);
  const arr = pool.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(rng() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr.slice(0, Math.max(1, C.COUNT));
}
function cartPrice(id){
  const base = priceOf(id);
  if(base <= 0) return 0;
  return Math.max(1, Math.round(base * CONFIG.CART.MARKUP));
}

Object.assign(window, { jojaInteract, clinicTreat, jukeboxPlay, jojaTodayOffer,
                       cartCycle, cartNextDay, cartStock, cartPrice });
export { jojaInteract, clinicTreat, jukeboxPlay, jojaTodayOffer,
         cartCycle, cartNextDay, cartStock, cartPrice };
