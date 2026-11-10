/* js/systems/dex.js —— 由 index.html 拆分，原行 9101–9146
 * 图鉴：鱼 / 采集物用位掩码，矿物用 id 数组（50+ 种，超过 32 位）。 */

'use strict';

import { MINERALS } from '../anim/minerals.js';

const dexState = { f: 0, g: 0, m: [] };
function dexTotal(){ return CONFIG.FISHING.LIST.length + CONFIG.GATHER.TYPES.length + MINERALS.length; }
function dexPopcount(n){
  n = n | 0; let c = 0;
  while(n){ n &= n - 1; c++; }
  return c;
}
function dexCollected(){ return dexPopcount(dexState.f) + dexPopcount(dexState.g) + dexState.m.length; }
function dexResetState(){ dexState.f = 0; dexState.g = 0; dexState.m = []; }
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
  for(let i=0;i<MINERALS.length;i++){
    const m = MINERALS[i];
    out.push({kind:'mineral', idx:i, id:m.id, name:m.name, icon:m.type === 'gem' ? '💎' : (m.type === 'foraged' ? '🔮' : '🪨')});
  }
  return out;
}
function dexHas(kind, idx){
  if(kind === 'mineral'){
    const m = MINERALS[idx];
    return !!(m && dexState.m.indexOf(m.id) >= 0);
  }
  if(idx < 0 || idx > 31) return false;
  const bit = 1 << idx;
  return kind === 'fish' ? !!(dexState.f & bit) : !!(dexState.g & bit);
}
function dexUnlock(kind, idx){
  const e = dexAllEntries().find(x => x.kind === kind && x.idx === idx);

  if(kind === 'mineral'){
    const m = MINERALS[idx];
    if(!m || dexState.m.indexOf(m.id) >= 0) return false;
    dexState.m.push(m.id);
  }else if(idx >= 0 && idx <= 31){
    const bit = 1 << idx;
    if(kind === 'fish'){
      if(dexState.f & bit) return false;
      dexState.f = (dexState.f | bit) >>> 0;
    }else if(kind === 'gather'){
      if(dexState.g & bit) return false;
      dexState.g = (dexState.g | bit) >>> 0;
    }else return false;
  }else return false;

  toast('📖 图鉴新增：' + (e ? e.name : '？'));
  playSfx(1174, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  achCheck();
  return true;
}

Object.assign(window, { dexState, dexTotal, dexPopcount, dexCollected, dexResetState, dexAllEntries, dexHas, dexUnlock });
export { dexState, dexTotal, dexPopcount, dexCollected, dexResetState, dexAllEntries, dexHas, dexUnlock };
