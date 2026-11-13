/* js/systems/farm-buildings.js —— 让农场建筑真正生效。
 * 温室：范围内作物无视季节并自动浇水；
 * 筒仓：每天早上自动喂所有动物；
 * 水井：按 E 补满水壶；
 * 发货箱：把手里的可卖物品整栈卖掉；
 * 鱼塘：投入鱼，3 天后收鱼籽；
 * 磨坊：投入小麦 / 未碾米，1 天后取面粉 / 大米。 */

'use strict';

const GREENHOUSE_RADIUS = 8;
const POND_DAYS = 3;
const MILL_DAYS = 1;

const FUNCTIONAL = {
  greenhouse: 1, silo: 1, well: 1, shipping_bin: 1,
  fish_pond: 1, mill: 1
};

function farmBuildingList(type){
  if (typeof buildings === 'undefined' || !Array.isArray(buildings)) return [];
  return buildings.filter(b => b && b.type === type);
}
function farmBuildingCount(type){ return farmBuildingList(type).length; }

/* 温室范围：以温室所在格为中心的一个方形区域 */
function cropInGreenhouse(tx, ty){
  if (typeof buildings === 'undefined' || !Array.isArray(buildings)) return false;
  for (const b of buildings) {
    if (!b || b.type !== 'greenhouse') continue;
    if (Math.abs(tx - b.tx) <= GREENHOUSE_RADIUS && Math.abs(ty - b.ty) <= GREENHOUSE_RADIUS) return true;
  }
  return false;
}
function greenhouseCropCount(){
  let n = 0;
  if (typeof crops === 'undefined') return 0;
  for (let i = 0; i < crops.length; i++) {
    if (!crops[i] || crops[i].dead) continue;
    const tx = i % MAP_W, ty = (i / MAP_W) | 0;
    if (cropInGreenhouse(tx, ty)) n++;
  }
  return n;
}

/* 最近的可交互农场建筑（2 格内） */
function farmBuildingNear(){
  if (typeof buildings === 'undefined' || !Array.isArray(buildings) || typeof player === 'undefined') return null;
  let best = null, bd = 2.2;
  for (const b of buildings) {
    if (!b || !FUNCTIONAL[b.type]) continue;
    const cx = (b.tx + 0.5) * TILE, cy = (b.ty + 0.5) * TILE;
    const d = Math.hypot(player.x - cx, player.y - cy) / TILE;
    if (d <= bd) { bd = d; best = b; }
  }
  return best;
}

function farmBuildingInteract(b){
  if (!b) return false;
  if (b.type === 'well') {
    if (typeof canWater === 'undefined' || typeof canCapacity !== 'function') return false;
    if (canWater >= canCapacity()) { toast('水井 · 水壶已经是满的'); return true; }
    canWater = canCapacity();
    toast('从水井打水，水壶补满了（' + canWater + '）');
    if (typeof playSfx === 'function') playSfx(880, 'sine', 0.12, CONFIG.AUDIO.VOLUME);
    return true;
  }

  if (b.type === 'shipping_bin') {
    const slot = (typeof selectedSlot === 'function') ? selectedSlot() : null;
    if (!slot) { toast('发货箱：先把要卖的东西拿在手里，再按 E'); return true; }
    if (typeof isSellable !== 'function' || !isSellable(slot.id)) {
      toast('发货箱：' + ((itemDef(slot.id) || {}).name || slot.id) + ' 不能卖');
      return true;
    }
    if (typeof sellItem === 'function') sellItem(slot.id, slot.n);
    return true;
  }

  if (b.type === 'greenhouse') {
    toast('温室 · 范围内 ' + greenhouseCropCount() + ' 株作物全年生长，并且每天自动浇水');
    return true;
  }

  if (b.type === 'silo') {
    const n = (typeof animals !== 'undefined' && Array.isArray(animals)) ? animals.length : 0;
    toast('筒仓 · 每天早上自动喂食 ' + n + ' 只动物');
    return true;
  }

  if (b.type === 'fish_pond') {
    if (b.pond && b.pond.fish) {
      const left = Math.max(0, (b.pond.day | 0) + POND_DAYS - clock.day);
      if (left > 0) { toast('鱼塘 · 还要 ' + left + ' 天才能收鱼籽'); return true; }
      b.pond = null;
      if (typeof addItem === 'function') addItem('roe', 2);
      toast('鱼塘收获了鱼籽 ×2');
      if (typeof playSfx === 'function') playSfx(880, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
      return true;
    }
    const slot = (typeof selectedSlot === 'function') ? selectedSlot() : null;
    const d = slot ? itemDef(slot.id) : null;
    if (!slot || !d || d.kind !== 'fish') { toast('鱼塘 · 手里拿着一条鱼再按 E 放进去'); return true; }
    if (typeof removeItem !== 'function' || !removeItem(slot.id, 1)) { toast('鱼塘 · 这条鱼拿不出来'); return true; }
    b.pond = { fish: slot.id, day: clock.day | 0 };
    toast('把' + d.name + '放进了鱼塘（' + POND_DAYS + ' 天后收鱼籽）');
    if (typeof playSfx === 'function') playSfx(660, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
    return true;
  }

  if (b.type === 'mill') {
    if (b.mill && b.mill.out) {
      const left = Math.max(0, (b.mill.ready | 0) - clock.day);
      if (left > 0) { toast('磨坊 · 还要 ' + left + ' 天才能磨好'); return true; }
      const out = b.mill.out;
      b.mill = null;
      if (typeof addItem === 'function') addItem(out, 1);
      toast('磨坊产出了' + ((itemDef(out) || {}).name || out));
      if (typeof playSfx === 'function') playSfx(880, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
      return true;
    }
    const slot = (typeof selectedSlot === 'function') ? selectedSlot() : null;
    const id = slot && slot.id;
    if (id !== 'wheat' && id !== 'unmilled_rice') {
      toast('磨坊 · 手里拿着小麦或未碾米再按 E');
      return true;
    }
    if (typeof removeItem !== 'function' || !removeItem(id, 1)) { toast('磨坊 · 材料拿不出来'); return true; }
    b.mill = { ready: (clock.day | 0) + MILL_DAYS, out: id === 'wheat' ? 'flour' : 'rice' };
    toast('磨坊开始工作（' + MILL_DAYS + ' 天后取货）');
    if (typeof playSfx === 'function') playSfx(520, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
    return true;
  }

  return false;
}

/* 筒仓：每天早上自动喂食（在动物每日结算前调用） */
function siloAutoFeed(){
  if (farmBuildingCount('silo') <= 0) return 0;
  if (typeof animals === 'undefined' || !Array.isArray(animals)) return 0;
  let n = 0;
  for (const a of animals) if (a && !a.fed) { a.fed = true; n++; }
  if (n && typeof toast === 'function') toast('筒仓自动喂食了 ' + n + ' 只动物');
  return n;
}

Object.assign(window, {
  farmBuildingList, farmBuildingCount, farmBuildingNear, farmBuildingInteract,
  cropInGreenhouse, greenhouseCropCount, siloAutoFeed,
  GREENHOUSE_RADIUS, POND_DAYS, MILL_DAYS
});
export {
  farmBuildingList, farmBuildingCount, farmBuildingNear, farmBuildingInteract,
  cropInGreenhouse, greenhouseCropCount, siloAutoFeed,
  GREENHOUSE_RADIUS, POND_DAYS, MILL_DAYS
};
