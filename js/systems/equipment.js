/* js/systems/equipment.js —— 戒指 / 靴子装备槽。
 * 背包里右键戒指或靴子即可装备；最多 2 枚戒指 + 1 双靴子。
 * 装备属性在矿井、钓鱼、移动、作物品质里生效。 */

'use strict';

const equipState = { rings: [null, null], boots: null, appliedEnergy: 0 };
window.equipState = equipState;
window.equipmentOpen = false;

function equipItemDef(id){ return id ? itemDef(id) : null; }
function equipKind(id){ const d = equipItemDef(id); return d ? d.kind : ''; }

function equipRingIds(){ return equipState.rings.filter(Boolean); }
function equipBootsId(){ return equipState.boots || ''; }

/* 从 effect 文本里抓数值：攻击 +5 / 防御 +3 / 幸运 +1 ... */
function equipParseEffect(text){
  const s = String(text || '');
  const num = (re) => { const m = s.match(re); return m ? parseInt(m[1], 10) || 0 : 0; };
  const atkPct = num(/攻击\s*\+?\s*(\d+)\s*%/);
  return {
    atk: atkPct ? 0 : num(/攻击\s*\+?\s*(\d+)(?!\s*%)/),
    atkPct,
    def: num(/防御\s*\+?\s*(\d+)/),
    luck: num(/幸运\s*\+?\s*(\d+)/),
    speed: /速度/.test(s) ? 1 : 0,
    fishing: /钓鱼/.test(s) ? 1 : 0,
    mining: /采矿/.test(s) ? 1 : 0,
    energy: /最大能量|体力/.test(s) ? 1 : 0,
    immunity: num(/免疫\s*\+?\s*(\d+)/)
  };
}

function equipTotals(){
  const out = { atk:0, atkPct:0, def:0, luck:0, speed:0, fishing:0, mining:0, energy:0, immunity:0 };
  const add = (st) => { for (const k in out) out[k] += (st[k] | 0); };
  for (const id of equipRingIds()) {
    const d = equipItemDef(id);
    if (d) add(equipParseEffect(d.effect));
  }
  const b = equipItemDef(equipBootsId());
  if (b) {
    out.def += b.defense | 0;
    out.immunity += b.immunity | 0;
  }
  return out;
}

function equipAttackBonus(){ return equipTotals().atk; }
function equipAttackPct(){ return equipTotals().atkPct; }
function equipDefenseBonus(){ return equipTotals().def; }
function equipImmunityBonus(){ return equipTotals().immunity; }
function equipSpeedMult(){ return 1 + equipTotals().speed * 0.08; }
function equipFishZoneMult(){ return 1 + equipTotals().fishing * 0.15; }
function equipMiningChance(){ return equipTotals().mining * 0.10; }
function equipLuckBonus(){ return equipTotals().luck * 0.01; }
function equipStaminaBonus(){ return equipTotals().energy * 20; }

function equipRefreshStamina(){
  const bonus = equipStaminaBonus();
  const prev = equipState.appliedEnergy | 0;
  if (typeof staminaMax !== 'undefined') {
    staminaMax = Math.max(1, staminaMax + (bonus - prev));
    if (typeof stamina !== 'undefined') stamina = Math.min(stamina, staminaMax);
  }
  equipState.appliedEnergy = bonus;
}

function equipFromInventory(id){
  const d = equipItemDef(id);
  if (!d) return false;
  if (d.kind === 'ring') {
    let slot = equipState.rings.indexOf(null);
    if (slot < 0) slot = 0;                      /* 两枚都满 → 替换第一枚 */
    const old = equipState.rings[slot];
    equipState.rings[slot] = id;
    if (typeof removeItem === 'function') removeItem(id, 1);
    if (old && typeof addItem === 'function') addItem(old, 1);
    toast('装备戒指：' + d.name + (old ? '（换下' + equipItemDef(old).name + '）' : ''));
  } else if (d.kind === 'boots') {
    const old = equipState.boots;
    equipState.boots = id;
    if (typeof removeItem === 'function') removeItem(id, 1);
    if (old && typeof addItem === 'function') addItem(old, 1);
    toast('装备靴子：' + d.name + (old ? '（换下' + equipItemDef(old).name + '）' : ''));
  } else {
    toast('只有戒指和靴子可以装备');
    return false;
  }
  equipRefreshStamina();
  if (typeof playSfx === 'function') playSfx(880, 'triangle', 0.10, 0.5);
  equipRefresh();
  return true;
}

function equipUnequip(kind, slot){
  let id = null;
  if (kind === 'ring') {
    id = equipState.rings[slot | 0];
    equipState.rings[slot | 0] = null;
  } else if (kind === 'boots') {
    id = equipState.boots;
    equipState.boots = null;
  }
  if (!id) return false;
  if (typeof canFit === 'function' && !canFit(id, 1)) { toast('背包满了，卸不下来'); return false; }
  if (typeof addItem === 'function') addItem(id, 1);
  toast('卸下：' + (equipItemDef(id) || {}).name);
  equipRefreshStamina();
  equipRefresh();
  return true;
}

/* ---------- 面板 ---------- */

let equipEl = null, equipMaskEl = null, equipListEl = null;

function equipEnsure(){
  if (equipEl) return true;
  equipEl = document.getElementById('equipment');
  equipMaskEl = document.getElementById('equipmentMask');
  equipListEl = document.getElementById('equipmentList');
  if (equipMaskEl) equipMaskEl.addEventListener('mousedown', e => { e.preventDefault(); equipClosePanel(); });
  return !!equipEl;
}

function equipSlotHtml(kind, slot, id, label){
  const d = equipItemDef(id);
  return '<div class="eqrow"><span class="eqslot">' + label + '</span>' +
    '<span class="eqname">' + (d ? d.name : '空') + '</span>' +
    '<span class="eqdesc">' + (d ? (d.effect || ('防御 +' + (d.defense | 0) + ' · 免疫 +' + (d.immunity | 0))) : '在背包里右键戒指 / 靴子装备') + '</span>' +
    (d ? '<button class="mbtn" data-eqkind="' + kind + '" data-eqslot="' + slot + '">卸下</button>' : '') +
    '</div>';
}

function equipRefresh(){
  if (!window.equipmentOpen || !equipEnsure() || !equipListEl) return;
  const t = equipTotals();
  let html = '';
  html += '<div class="eqsum">攻击 +' + t.atk + (t.atkPct ? '（+' + t.atkPct + '%）' : '') + ' · 防御 +' + (t.def + t.immunity) +
          ' · 幸运 +' + t.luck + ' · 速度 ' + (t.speed ? '+' + t.speed : '0') +
          ' · 钓鱼 ' + (t.fishing ? '+' + t.fishing : '0') +
          ' · 采矿 ' + (t.mining ? '+' + t.mining : '0') + '</div>';
  html += equipSlotHtml('ring', 0, equipState.rings[0], '戒指 1');
  html += equipSlotHtml('ring', 1, equipState.rings[1], '戒指 2');
  html += equipSlotHtml('boots', 0, equipState.boots, '靴子');
  equipListEl.innerHTML = html;
  equipListEl.querySelectorAll('button[data-eqkind]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      equipUnequip(btn.dataset.eqkind, parseInt(btn.dataset.eqslot, 10));
    });
  });
}

function equipOpenPanel(){
  if (window.farmhouseActive || window.mineActive || window.mineGateOpen) return false;
  if (!equipEnsure()) return false;
  if (typeof togglePack === 'function') togglePack(false);
  window.equipmentOpen = true;
  equipEl.classList.add('open');
  equipRefresh();
  return true;
}
function equipClosePanel(){
  window.equipmentOpen = false;
  if (equipEl) equipEl.classList.remove('open');
  return true;
}
function toggleEquipmentPanel(v){
  const want = (v === undefined) ? !window.equipmentOpen : !!v;
  return want ? equipOpenPanel() : equipClosePanel();
}

/* ---------- 存档 ---------- */
function equipSerialize(){
  const ok = (id) => (id && equipItemDef(id)) ? id : null;
  return { r: [ok(equipState.rings[0]), ok(equipState.rings[1])], b: ok(equipState.boots) };
}
function equipDeserialize(v){
  equipState.rings = [null, null];
  equipState.boots = null;
  if (v && typeof v === 'object') {
    const r = Array.isArray(v.r) ? v.r : [];
    for (let i = 0; i < 2; i++) {
      const id = r[i];
      if (id && equipKind(id) === 'ring') equipState.rings[i] = id;
    }
    if (v.b && equipKind(v.b) === 'boots') equipState.boots = v.b;
  }
  equipState.appliedEnergy = equipStaminaBonus();   /* 读档时体力上限已包含装备加成 */
  if (typeof stamina !== 'undefined' && typeof staminaMax !== 'undefined') stamina = Math.min(stamina, staminaMax);
}
function equipReset(){
  equipState.rings = [null, null];
  equipState.boots = null;
  equipState.appliedEnergy = 0;
}

Object.assign(window, {
  equipState, equipFromInventory, equipUnequip, equipTotals,
  equipAttackBonus, equipAttackPct, equipDefenseBonus, equipImmunityBonus, equipSpeedMult,
  equipFishZoneMult, equipMiningChance, equipLuckBonus, equipStaminaBonus,
  equipRefreshStamina, equipOpenPanel, equipClosePanel, toggleEquipmentPanel,
  equipRefresh, equipSerialize, equipDeserialize, equipReset
});
export {
  equipState, equipFromInventory, equipUnequip, equipTotals,
  equipAttackBonus, equipAttackPct, equipDefenseBonus, equipImmunityBonus, equipSpeedMult,
  equipFishZoneMult, equipMiningChance, equipLuckBonus, equipStaminaBonus,
  equipRefreshStamina, equipOpenPanel, equipClosePanel, toggleEquipmentPanel,
  equipRefresh, equipSerialize, equipDeserialize, equipReset
};
