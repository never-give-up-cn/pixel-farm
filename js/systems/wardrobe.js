/* js/systems/wardrobe.js — 衣柜换装：帽子 / 上衣 / 下装。
 * 状态直接作用在玩家动画上；衣柜建筑按 E 打开换装面板。
 */

'use strict';

import { HAT_MAP } from '../anim/hats.js';
import { CLOTH_MAP, makeOutfit } from '../anim/clothes.js';

const outfitState = {
  hat: null,
  shirt: null,
  pants: null
};

function wardrobeNear() {
  if (typeof buildings === 'undefined' || typeof player === 'undefined') return null;
  let best = null, bd = Infinity;
  for (const b of buildings) {
    if (b.type !== 'wardrobe') continue;
    const cx = (b.tx + 0.5) * TILE, cy = (b.ty + 0.5) * TILE;
    const d = Math.hypot(player.x - cx, player.y - cy);
    if (d <= 2 * TILE && d < bd) { bd = d; best = b; }
  }
  return best;
}

function outfitOf() {
  return {
    hat: outfitState.hat && HAT_MAP[outfitState.hat] ? outfitState.hat : null,
    shirt: outfitState.shirt && CLOTH_MAP[outfitState.shirt] ? outfitState.shirt : null,
    pants: outfitState.pants && CLOTH_MAP[outfitState.pants] ? outfitState.pants : null
  };
}

/** 给 drawFarmer 的参数；帽子在 player-anim 里单独叠加。 */
function playerOutfitOpts() {
  const o = outfitOf();
  const out = { noHat: !!o.hat, outfit: null, hat: o.hat };
  if (o.shirt || o.pants) {
    const shirt = o.shirt || null;
    const pants = o.pants || null;
    out.outfit = makeOutfit(shirt, pants);
  }
  return out;
}

function equipHat(id) {
  outfitState.hat = outfitState.hat === id ? null : id;
}
function equipShirt(id) {
  outfitState.shirt = outfitState.shirt === id ? null : id;
}
function equipPants(id) {
  outfitState.pants = outfitState.pants === id ? null : id;
}

function wardrobeSerialize() {
  return { h: outfitState.hat, s: outfitState.shirt, p: outfitState.pants };
}

function wardrobeDeserialize(o) {
  outfitState.hat = null;
  outfitState.shirt = null;
  outfitState.pants = null;
  if (!o || typeof o !== 'object') return;
  if (o.h && HAT_MAP[o.h]) outfitState.hat = o.h;
  if (o.s && CLOTH_MAP[o.s]) outfitState.shirt = o.s;
  if (o.p && CLOTH_MAP[o.p]) outfitState.pants = o.p;
}

function wardrobeResetState() {
  outfitState.hat = null;
  outfitState.shirt = null;
  outfitState.pants = null;
}

Object.assign(window, {
  outfitState, wardrobeNear, outfitOf, playerOutfitOpts,
  equipHat, equipShirt, equipPants,
  wardrobeSerialize, wardrobeDeserialize, wardrobeResetState
});
export {
  outfitState, wardrobeNear, outfitOf, playerOutfitOpts,
  equipHat, equipShirt, equipPants,
  wardrobeSerialize, wardrobeDeserialize, wardrobeResetState
};
