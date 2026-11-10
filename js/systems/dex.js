/* js/systems/dex.js —— 图鉴：鱼 / 采集物 / 矿物 / 作物 / 动物。
 * 鱼、矿物、作物、动物用 id 数组（条目超过 32），采集物用位掩码。 */

'use strict';

import { MINERALS } from '../anim/minerals.js';
import { MONSTERS } from '../anim/monsters.js';

const dexState = { f: [], g: 0, m: [], c: [], a: [], mo: [] };
function dexTotal(){
  return CONFIG.FISHING.LIST.length + CONFIG.GATHER.TYPES.length + MINERALS.length
    + CONFIG.CROPS.length + CONFIG.ANIMALS.TYPES.length + MONSTERS.length;
}
function dexPopcount(n){
  n = n | 0; let c = 0;
  while(n){ n &= n - 1; c++; }
  return c;
}
function dexCollected(){
  return dexState.f.length + dexPopcount(dexState.g) + dexState.m.length
    + dexState.c.length + dexState.a.length + dexState.mo.length;
}
function dexResetState(){ dexState.f = []; dexState.g = 0; dexState.m = []; dexState.c = []; dexState.a = []; dexState.mo = []; }
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
  for(let i=0;i<CONFIG.CROPS.length;i++){
    const c = CONFIG.CROPS[i];
    out.push({kind:'crop', idx:i, id:c.id, name:c.name, icon:c.icon});
  }
  for(let i=0;i<CONFIG.ANIMALS.TYPES.length;i++){
    const a = CONFIG.ANIMALS.TYPES[i];
    out.push({kind:'animal', idx:i, id:a.id, name:a.name, icon:a.icon});
  }
  for(let i=0;i<MONSTERS.length;i++){
    const m = MONSTERS[i];
    out.push({kind:'monster', idx:i, id:m.id, name:m.name, icon:'👾'});
  }
  return out;
}
function arrFor(kind){
  if(kind === 'fish') return dexState.f;
  if(kind === 'mineral') return dexState.m;
  if(kind === 'crop') return dexState.c;
  if(kind === 'animal') return dexState.a;
  if(kind === 'monster') return dexState.mo;
  return null;
}
function dexHas(kind, idx){
  if(kind === 'gather'){
    if(idx < 0 || idx > 31) return false;
    return !!(dexState.g & (1 << idx));
  }
  const arr = arrFor(kind);
  if(!arr) return false;
  if(kind === 'fish'){ const f = CONFIG.FISHING.LIST[idx]; return !!(f && arr.indexOf(f.id) >= 0); }
  if(kind === 'mineral'){ const m = MINERALS[idx]; return !!(m && arr.indexOf(m.id) >= 0); }
  if(kind === 'crop'){ const c = CONFIG.CROPS[idx]; return !!(c && arr.indexOf(c.id) >= 0); }
  if(kind === 'animal'){ const a = CONFIG.ANIMALS.TYPES[idx]; return !!(a && arr.indexOf(a.id) >= 0); }
  if(kind === 'monster'){ const m = MONSTERS[idx]; return !!(m && arr.indexOf(m.id) >= 0); }
  return false;
}
function dexUnlock(kind, idx){
  const e = dexAllEntries().find(x => x.kind === kind && x.idx === idx);

  if(kind === 'gather'){
    if(idx < 0 || idx > 31) return false;
    const bit = 1 << idx;
    if(dexState.g & bit) return false;
    dexState.g = (dexState.g | bit) >>> 0;
  }else{
    const arr = arrFor(kind);
    if(!arr) return false;
    let id = null;
    if(kind === 'fish'){ const f = CONFIG.FISHING.LIST[idx]; id = f && f.id; }
    else if(kind === 'mineral'){ const m = MINERALS[idx]; id = m && m.id; }
    else if(kind === 'crop'){ const c = CONFIG.CROPS[idx]; id = c && c.id; }
    else if(kind === 'animal'){ const a = CONFIG.ANIMALS.TYPES[idx]; id = a && a.id; }
    else if(kind === 'monster'){ const m = MONSTERS[idx]; id = m && m.id; }
    if(!id || arr.indexOf(id) >= 0) return false;
    arr.push(id);
  }

  toast('📖 图鉴新增：' + (e ? e.name : '？'));
  playSfx(1174, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  achCheck();
  return true;
}

Object.assign(window, { dexState, dexTotal, dexPopcount, dexCollected, dexResetState, dexAllEntries, dexHas, dexUnlock });
export { dexState, dexTotal, dexPopcount, dexCollected, dexResetState, dexAllEntries, dexHas, dexUnlock };
