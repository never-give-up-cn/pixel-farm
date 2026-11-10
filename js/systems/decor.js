/* js/systems/decor.js — 户外家具摆放（装修模式）。
 * 快捷栏选中家具 → 按 H 进入装修模式 → 左键放置、右键拆回背包。
 */

'use strict';

window.decorMode = false;

function decorItem() {
  if (typeof selectedSlot !== 'function' || typeof itemDef !== 'function') return null;
  const s = selectedSlot();
  const d = s ? itemDef(s.id) : null;
  return d && d.kind === 'furniture' ? d : null;
}

function decorIdOf(b) {
  return b && b.type && b.type.indexOf('furn_') === 0 ? b.type.slice(5) : null;
}

function decorAt(tx, ty) {
  if (typeof buildings === 'undefined') return null;
  return buildings.find(b => b.tx === tx && b.ty === ty && decorIdOf(b)) || null;
}

function decorTileFree(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  if (typeof buildingAt === 'function' && buildingAt(tx, ty)) return false;
  const t = map[ty * MAP_W + tx];
  if (t !== T.GRASS && t !== T.DIRT && t !== T.BARE && t !== T.TILLED) return false;
  return !decorAt(tx, ty);
}

function toggleDecor(v) {
  const want = (v === undefined) ? !window.decorMode : !!v;
  if (want && typeof currentMap !== 'undefined' && currentMap !== 'valley') {
    toast('只能在农场 / 小镇摆放家具');
    return false;
  }
  if (want && !decorItem()) {
    toast('先在快捷栏选中一件家具');
    return false;
  }
  window.decorMode = want;
  toast(want ? '装修模式：左键放置家具 · 右键拆除 · H / Esc 退出' : '已退出装修模式');
  return want;
}

function placeDecor(tx, ty) {
  if (!window.decorMode) return false;
  const d = decorItem();
  if (!d) { toast('先在快捷栏选中一件家具'); return false; }
  if (!decorTileFree(tx, ty)) { toast('这里放不下家具'); return false; }
  if (countItem(d.id) <= 0) { toast('背包里没有这件家具'); return false; }
  if (!removeItem(d.id, 1)) return false;
  buildings.push({ type: 'furn_' + d.id, tx, ty });
  playSfx(520, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

function removeDecor(tx, ty) {
  if (!window.decorMode) return false;
  const b = decorAt(tx, ty);
  if (!b) return false;
  const id = decorIdOf(b);
  buildings = buildings.filter(x => x !== b);
  /* 重建建造索引，避免后面的建筑索引错位 */
  if (typeof buildIndex !== 'undefined') {
    buildIndex.fill(-1);
    for (let k = 0; k < buildings.length; k++) {
      const bb = buildings[k];
      if (bb.type.indexOf('furn_') === 0) continue;
      buildIndex[bb.ty * MAP_W + bb.tx] = k;
    }
  }
  if (id) addItem(id, 1);
  playSfx(320, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.7);
  toast('收起了家具');
  return true;
}

/* 鼠标悬停时的半透明预览 */
function drawDecorPreview(g) {
  if (!window.decorMode) return;
  if (typeof hover === 'undefined' || hover.tx < 0 || hover.ty < 0) return;
  const d = decorItem();
  if (!d || typeof itemIconCanvas !== 'function') return;
  const src = itemIconCanvas(d.id);
  if (!src) return;
  const x = hover.tx * TILE - cam.x;
  const y = hover.ty * TILE - cam.y;
  const ok = decorTileFree(hover.tx, hover.ty);
  g.save();
  g.globalAlpha = 0.65;
  g.drawImage(src, Math.round(x - 4), Math.round(y - 8), 40, 40);
  g.globalAlpha = 1;
  g.strokeStyle = ok ? 'rgba(120,255,150,0.95)' : 'rgba(255,110,100,0.95)';
  g.lineWidth = 2;
  g.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
  g.restore();
}

Object.assign(window, {
  decorItem, decorAt, decorTileFree, toggleDecor, placeDecor, removeDecor, drawDecorPreview
});
export { decorItem, decorAt, decorTileFree, toggleDecor, placeDecor, removeDecor, drawDecorPreview };
