/* js/systems/dex.js —— 由 index.html 拆分，原行 9101–9146 */
'use strict';

/* === 10.图鉴（第 14 轮） === */
/* 图鉴只存两个位掩码：fish 8 位、gather 3 位（紧凑、不会随游玩时长膨胀）。
 *   bit = 1 → 已经钓到 / 采到过；未解锁的格子画成剪影。 */
const dexState = {f:0, g:0};
function dexTotal(){ return CONFIG.FISHING.LIST.length + CONFIG.GATHER.TYPES.length; }
function dexPopcount(n){
  n = n | 0; let c = 0;
  while(n){ n &= n - 1; c++; }
  return c;
}
function dexCollected(){ return dexPopcount(dexState.f) + dexPopcount(dexState.g); }
function dexResetState(){ dexState.f = 0; dexState.g = 0; }
function dexAllEntries(){
  const out = [];
  for(let i=0;i<CONFIG.FISHING.LIST.length;i++){
    const f = CONFIG.FISHING.LIST[i];
    out.push({kind:'fish', idx:i, id:f.id, name:f.name, icon:f.icon});
  }
  for(let i=0;i<CONFIG.GATHER.TYPES.length;i++){
    const t = CONFIG.GATHER.TYPES[i], d = itemDef(t.item);
    out.push({kind:'gather', idx:i, id:t.item, name:d ? d.name : t.item, icon:d ? d.icon : '？'});
  }
  return out;
}
function dexHas(kind, idx){
  if(idx < 0 || idx > 31) return false;
  const bit = 1 << idx;
  return kind === 'fish' ? !!(dexState.f & bit) : !!(dexState.g & bit);
}
function dexUnlock(kind, idx){
  if(idx < 0 || idx > 31) return false;
  const bit = 1 << idx;
  if(kind === 'fish'){
    if(dexState.f & bit) return false;
    dexState.f = (dexState.f | bit) >>> 0;
  }else if(kind === 'gather'){
    if(dexState.g & bit) return false;
    dexState.g = (dexState.g | bit) >>> 0;
  }else return false;
  const e = dexAllEntries().find(x => x.kind === kind && x.idx === idx);
  toast('📖 图鉴新增：' + (e ? e.name : '？'));
  playSfx(1174, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  achCheck();                               /* 第 18 轮：鱼种 / 采集物集齐 → 成就 */
  return true;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { dexState, dexTotal, dexPopcount, dexCollected, dexResetState, dexAllEntries, dexHas, dexUnlock });
export { dexState, dexTotal, dexPopcount, dexCollected, dexResetState, dexAllEntries, dexHas, dexUnlock };
