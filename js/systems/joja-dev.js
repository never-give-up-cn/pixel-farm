/* js/systems/joja-dev.js — Joja 社区发展买断线 + 矿车快速移动。
 *
 * Joja 超市墙上挂着一张「社区发展表单」：会员可以出钱让 Joja 替小镇修巴士、
 * 修矿车、扩建采石场、翻新温室、打一口社区水井。项目一次买断，随存档保存。
 * 修好矿车后，山地矿井 / 巴士站 / 采石场三处的矿车可以互相直达。
 */

'use strict';

const jojaDevState = { projects: {}, quote: null };
window.jojaDevState = jojaDevState;
window.jojaDevOpen = false;
window.minecartOpen = false;

let jojaDevEl = null;
let jojaDevMask = null;
let jojaDevGoldEl = null;
let jojaDevBody = null;
let minecartEl = null;
let minecartMask = null;
let minecartWhereEl = null;
let minecartBody = null;

const MINECART_DESTS = [
  { id:'mountain', name:'⛰ 山地 · 矿井', x:56, y:87 },
  { id:'busstop',  name:'🚌 巴士站',      x:56, y:52 },
  { id:'quarry',   name:'🪨 采石场',      x:64, y:98 }
];

function jojaDevHas(id){
  return !!(jojaDevState.projects && jojaDevState.projects[id]);
}

function jojaDevMember(){
  return typeof isJojaMember === 'function' && isJojaMember();
}

function jojaDevProject(id){
  return (CONFIG.JOJA.DEV || []).find(p => p.id === id) || null;
}

/* 巴士沿用巴士站自己的会员价；其它项目会员 9 折 */
function jojaDevPrice(p){
  if(!p) return 0;
  if(p.id === 'bus' && typeof busRepairCost === 'function') return busRepairCost();
  const base = p.price | 0;
  return jojaDevMember() ? Math.max(1, Math.round(base * 0.9)) : base;
}

function jojaDevDone(p){
  if(!p) return false;
  if(jojaDevHas(p.id)) return true;
  return p.id === 'bus' && typeof busIsFixed === 'function' && busIsFixed();
}

function jojaDevEnsure(){
  if(jojaDevEl) return true;
  jojaDevEl = document.getElementById('jojaDev');
  jojaDevMask = document.getElementById('jojaDevMask');
  jojaDevGoldEl = document.getElementById('jojaDevGold');
  jojaDevBody = document.getElementById('jojaDevBody');
  minecartEl = document.getElementById('minecart');
  minecartMask = document.getElementById('minecartMask');
  minecartWhereEl = document.getElementById('minecartWhere');
  minecartBody = document.getElementById('minecartBody');
  if(jojaDevMask) jojaDevMask.addEventListener('mousedown', e => {
    e.preventDefault();
    jojaDevClosePanel();
  });
  if(minecartMask) minecartMask.addEventListener('mousedown', e => {
    e.preventDefault();
    minecartClosePanel();
  });
  return !!(jojaDevEl && minecartEl);
}

/* ---------- 社区发展表单 ---------- */
function jojaFormInteract(){
  if(!jojaDevMember()){
    if(typeof toast === 'function') toast('莫里斯：社区发展项目只对 Joja 会员开放。先在货箱旁加入会员。');
    return false;
  }
  return openJojaDevPanel();
}

function openJojaDevPanel(){
  if(!jojaDevEnsure()) return false;
  if(typeof togglePack === 'function') togglePack(false);
  if(typeof npcOpen !== 'undefined' && npcOpen && typeof npcCloseDialog === 'function') npcCloseDialog();
  window.jojaDevOpen = true;
  jojaDevState.quote = null;
  jojaDevRender();
  if(jojaDevEl.classList) jojaDevEl.classList.add('open');
  if(typeof playSfx === 'function') playSfx(620, 'triangle', 0.10, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

function jojaDevClosePanel(){
  if(!jojaDevEnsure()) return false;
  window.jojaDevOpen = false;
  jojaDevState.quote = null;
  if(jojaDevEl.classList) jojaDevEl.classList.remove('open');
  return true;
}

function jojaDevRender(){
  if(!jojaDevEnsure()) return;
  if(jojaDevGoldEl) jojaDevGoldEl.textContent = '金币 ' + (gold | 0);
  jojaDevBody.innerHTML = '';
  for(const p of (CONFIG.JOJA.DEV || [])){
    const done = jojaDevDone(p);
    const price = jojaDevPrice(p);
    const row = document.createElement('div');
    row.className = 'jdrow' + (done ? ' done' : '');

    const icon = document.createElement('span');
    icon.className = 'jdicon';
    icon.textContent = p.icon || '🏢';
    row.appendChild(icon);

    const main = document.createElement('div');
    main.className = 'jdmain';
    const nm = document.createElement('b');
    nm.textContent = p.name;
    main.appendChild(nm);
    const desc = document.createElement('span');
    desc.textContent = p.desc;
    main.appendChild(desc);
    row.appendChild(main);

    const pr = document.createElement('span');
    pr.className = 'jdprice';
    pr.textContent = done ? '已完成' : (price + ' g');
    row.appendChild(pr);

    const btn = document.createElement('button');
    btn.className = 'mbtn' + (done ? ' off' : ' entry');
    const quoted = jojaDevState.quote === p.id;
    btn.textContent = done ? '已完成' : (quoted ? '再点一次确认' : '购买');
    btn.disabled = done;
    if(!done) btn.addEventListener('click', e => {
      e.preventDefault();
      jojaDevBuy(p.id);
    });
    row.appendChild(btn);
    jojaDevBody.appendChild(row);
  }
}

function jojaDevBuy(id){
  const p = jojaDevProject(id);
  if(!p || jojaDevDone(p)) return false;
  if(!jojaDevMember()){
    if(typeof toast === 'function') toast('需要先加入 Joja 会员');
    return false;
  }
  const price = jojaDevPrice(p);
  if(jojaDevState.quote !== id){
    jojaDevState.quote = id;
    jojaDevRender();
    if(typeof toast === 'function') toast(p.name + '：' + price + ' 金币 · 再点一次确认');
    if(typeof playSfx === 'function') playSfx(660, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  if((gold | 0) < price){
    if(typeof toast === 'function') toast('金币不够（还差 ' + (price - gold) + '）');
    return false;
  }
  if(typeof changeGold === 'function') changeGold(-price);
  jojaDevState.quote = null;
  jojaDevState.projects[id] = true;
  jojaDevApply(id);
  if(typeof toast === 'function') toast('🏢 Joja 完成了项目：' + p.name);
  if(typeof playSfx === 'function') playSfx(1046, 'triangle', 0.18, CONFIG.AUDIO.VOLUME);
  jojaDevRender();
  return true;
}

/* 项目落地效果（矿车与温室在各自系统里实时读取标记） */
function jojaDevApply(id){
  if(id === 'bus' && typeof busRepairNow === 'function') busRepairNow();
  if(id === 'well' && typeof canCapacity === 'function') canWater = canCapacity();
}

/* ---------- 矿车 ---------- */
function minecartInteract(){
  if(!jojaDevHas('minecart')){
    if(typeof toast === 'function') toast('矿车锈死了…… 去 Joja 超市的社区发展表单买「矿车修复」');
    return false;
  }
  return openMinecartPanel();
}

function openMinecartPanel(){
  if(!jojaDevEnsure()) return false;
  window.minecartOpen = true;
  if(typeof currentMap !== 'undefined' && minecartWhereEl){
    const here = MINECART_DESTS.find(d => d.id === currentMap);
    minecartWhereEl.textContent = here ? here.name.replace(/^[^ ]+ /, '') : '矿车';
  }
  minecartBody.innerHTML = '';
  for(const d of MINECART_DESTS){
    const b = document.createElement('button');
    const here = (typeof currentMap !== 'undefined' && d.id === currentMap);
    b.className = 'mbtn' + (here ? ' here' : ' entry');
    b.textContent = d.name + (here ? '（当前）' : '');
    b.disabled = here;
    if(!here) b.addEventListener('click', e => {
      e.preventDefault();
      minecartClosePanel();
      if(typeof worldActivate === 'function'){
        worldActivate(d.id, d.x, d.y, false);
        if(typeof toast === 'function') toast('矿车驶向' + d.name.replace(/^[^ ]+ /, ''));
      }
    });
    minecartBody.appendChild(b);
  }
  if(minecartEl.classList) minecartEl.classList.add('open');
  if(typeof playSfx === 'function') playSfx(420, 'square', 0.10, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

function minecartClosePanel(){
  if(!jojaDevEnsure()) return false;
  window.minecartOpen = false;
  if(minecartEl.classList) minecartEl.classList.remove('open');
  return true;
}

/* ---------- 存档 ---------- */
function jojaDevSerialize(){
  const ids = [];
  for(const k in jojaDevState.projects) if(jojaDevState.projects[k]) ids.push(k);
  return { p: ids };
}
function jojaDevDeserialize(v){
  jojaDevState.projects = {};
  jojaDevState.quote = null;
  for(const id of ((v && v.p) || [])) jojaDevState.projects[id] = true;
}
function jojaDevReset(){
  jojaDevState.projects = {};
  jojaDevState.quote = null;
  window.jojaDevOpen = false;
  window.minecartOpen = false;
  if(jojaDevEl && jojaDevEl.classList) jojaDevEl.classList.remove('open');
  if(minecartEl && minecartEl.classList) minecartEl.classList.remove('open');
}

Object.assign(window, {
  jojaDevState, jojaDevOpen: false, minecartOpen: false,
  jojaDevHas, jojaDevMember, jojaDevPrice, jojaDevDone, jojaDevProject,
  jojaFormInteract, openJojaDevPanel, jojaDevClosePanel, jojaDevRender, jojaDevBuy,
  minecartInteract, openMinecartPanel, minecartClosePanel,
  jojaDevSerialize, jojaDevDeserialize, jojaDevReset
});
export {
  jojaDevState, jojaDevHas, jojaDevMember, jojaDevPrice, jojaDevDone, jojaDevProject,
  jojaFormInteract, openJojaDevPanel, jojaDevClosePanel, jojaDevRender, jojaDevBuy,
  minecartInteract, openMinecartPanel, minecartClosePanel,
  jojaDevSerialize, jojaDevDeserialize, jojaDevReset
};
