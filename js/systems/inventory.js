/* js/systems/inventory.js —— 由 index.html 拆分，原行 3659–3784 */
'use strict';

/* === 4.背包系统 === */
/* 背包 24 格：inv[i] = null 或 {id, n}
 *   id = CONFIG.ITEMS 的键，n = 数量
 * 快捷栏 = 背包前 CONFIG.INVENTORY.HOTBAR 格（联动方案，不另开数组）
 *   → 快捷栏第 i 格永远就是背包第 i 格，拖动物品会立刻反映到快捷栏
 * 金币（currency）单独存数字 gold，不占格
 * 三个核心 API：addItem / removeItem / countItem（+ canFit 预判能否放下） */
window.inv = new Array(CONFIG.INVENTORY.SLOTS).fill(null);
window.gold = CONFIG.INIT_GOLD;
window.hotSel = 0;                       /* 快捷栏当前选中格（0~7） */
window.canLevel = 0;                     /* 水壶扩容等级：容量 = 20 + 等级×10 */
window.goldPulseAt = 0;                  /* 金币跳动动画起点（performance.now()） */
window.goldDelta = 0;                    /* 最近一次金币变动（用于飘字） */

/* 当前水壶容量（商店扩容 / 铁匠铺升级都会变大） */
function canCapacity(){
  const tl = (typeof toolLevel === 'function') ? toolLevel('can') : 0;
  return Math.min(CONFIG.WATER_CAN.MAX_CAPACITY,
                  CONFIG.WATER_CAN.CAPACITY + (canLevel + tl) * CONFIG.WATER_CAN.UPGRADE_STEP);
}

function itemDef(id){ return CONFIG.ITEMS[id] || null; }
function stackLimit(id){
  const d = itemDef(id);
  return d ? (d.max || CONFIG.INVENTORY.STACK_MAX) : 1;
}
function invUsed(){ let n = 0; for(const s of inv) if(s) n++; return n; }
function invFree(){ return CONFIG.INVENTORY.SLOTS - invUsed(); }

/* 统计背包里某物品的数量（金币走数字） */
function countItem(id){
  if(id === 'gold') return gold;
  let n = 0;
  for(const s of inv) if(s && s.id === id) n += s.n;
  return n;
}
/* 背包里某物品占了几格 */
function countSlots(id){
  let n = 0;
  for(const s of inv) if(s && s.id === id) n++;
  return n;
}
/* 能不能放下 n 个（只判断，不改动背包） */
function canFit(id, n){
  if(n <= 0) return true;
  if(id === 'gold') return true;              /* 金币不占格 */
  const d = itemDef(id);
  if(!d) return false;
  if(!d.stack) return invFree() >= n;         /* 不可堆叠 → 每件独占一格 */
  const lim = stackLimit(id);
  let room = 0;
  for(const s of inv){
    if(!s) room += lim;                       /* 空格子 */
    else if(s.id === id) room += Math.max(0, lim - s.n);   /* 还能往这堆里塞多少 */
  }
  return room >= n;
}
/* 放入 n 个：先并进已有的堆，再填空位；返回实际放入的数量 */
function addItem(id, n){
  if(n <= 0) return 0;
  if(id === 'gold'){ gold += n; return n; }
  const d = itemDef(id);
  if(!d) return 0;
  const lim = stackLimit(id);
  let left = n;
  if(d.stack){
    for(let i=0;i<inv.length && left>0;i++){
      const s = inv[i];
      if(s && s.id === id && s.n < lim){
        const take = Math.min(lim - s.n, left);
        s.n += take; left -= take;
      }
    }
  }
  for(let i=0;i<inv.length && left>0;i++){
    if(inv[i]) continue;
    const take = d.stack ? Math.min(lim, left) : 1;
    inv[i] = {id:id, n:take};
    left -= take;
  }
  return n - left;
}
/* 取出 n 个：数量不够就一个都不动（返回 false） */
function removeItem(id, n){
  if(n <= 0) return true;
  if(id === 'gold'){ if(gold < n) return false; gold -= n; return true; }
  if(countItem(id) < n) return false;
  let left = n;
  for(let i=0;i<inv.length && left>0;i++){
    const s = inv[i];
    if(!s || s.id !== id) continue;
    const take = Math.min(s.n, left);
    s.n -= take; left -= take;
    if(s.n <= 0) inv[i] = null;
  }
  return true;
}
/* 金币：单独存数字 */
function addGold(n){ gold += n; return gold; }
function spendGold(n){ if(gold < n) return false; gold -= n; return true; }

/* --- 快捷栏（= 背包前 8 格） --- */
function selectHot(i){
  if(i >= 0 && i < CONFIG.INVENTORY.HOTBAR){ hotSel = i; return true; }
  return false;
}
function selectedSlot(){ return inv[hotSel] || null; }
function selectedItem(){ const s = selectedSlot(); return s ? itemDef(s.id) : null; }

/* 初始物品 */
function initInventory(){
  inv = new Array(CONFIG.INVENTORY.SLOTS).fill(null);
  gold = CONFIG.INIT_GOLD;
  hotSel = 0;
  canLevel = 0;
  for(const e of CONFIG.INVENTORY.START_LOADOUT) addItem(e.id, e.n);
}
/* 商店给的东西：可堆叠的先并堆；工具（不可堆叠）优先塞进快捷栏的空位并自动选中，买完就能用 */
function giveItem(id, n){
  const d = itemDef(id);
  if(d && d.stack) return addItem(id, n);
  for(let i=0;i<CONFIG.INVENTORY.HOTBAR;i++){
    if(!inv[i]){ inv[i] = {id:id, n:1}; hotSel = i; refreshPackGrid(); return 1; }
  }
  return addItem(id, n);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { canCapacity, itemDef, stackLimit, invUsed, invFree, countItem, countSlots, canFit, addItem, removeItem, addGold, spendGold, selectHot, selectedSlot, selectedItem, initInventory, giveItem });
export { canCapacity, itemDef, stackLimit, invUsed, invFree, countItem, countSlots, canFit, addItem, removeItem, addGold, spendGold, selectHot, selectedSlot, selectedItem, initInventory, giveItem };
