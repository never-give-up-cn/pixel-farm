/* js/systems/bundles.js — 社区中心收集包。
 * 每个收集包有若干物品需求；在社区中心面板里逐件交付，交满后领取金币奖励。
 */

'use strict';

const bundleState = {
  delivered: {},   /* bundleId -> { itemId: count } */
  done: {}         /* bundleId -> true */
};

function bundleDef(id) {
  return CONFIG.BUNDLE_MAP[id] || null;
}

function bundleDelivered(bid, itemId) {
  const d = bundleState.delivered[bid];
  return (d && d[itemId]) || 0;
}

function bundleNeed(b, itemId) {
  const it = b.items.find(x => x.id === itemId);
  return it ? it.n : 0;
}

function bundleIsComplete(b) {
  return b.items.every(it => bundleDelivered(b.id, it.id) >= it.n);
}

function bundleProgress(b) {
  let got = 0, total = 0;
  for (const it of b.items) {
    got += Math.min(it.n, bundleDelivered(b.id, it.id));
    total += it.n;
  }
  return { got, total };
}

function bundleDoneCount() {
  return CONFIG.BUNDLES.filter(b => bundleState.done[b.id]).length;
}

function bundleCenterNear() {
  if (typeof buildings === 'undefined' || typeof player === 'undefined') return null;
  let best = null, bd = Infinity;
  for (const b of buildings) {
    if (b.type !== 'community_center') continue;
    const cx = (b.tx + 0.5) * TILE, cy = (b.ty + 0.5) * TILE;
    const d = Math.hypot(player.x - cx, player.y - cy);
    if (d <= 2.5 * TILE && d < bd) { bd = d; best = b; }
  }
  return best;
}

function bundleDeliver(bid, itemId, n) {
  const b = bundleDef(bid);
  if (!b || bundleState.done[bid]) return false;
  const need = bundleNeed(b, itemId);
  if (need <= 0) return false;

  const cur = bundleDelivered(bid, itemId);
  const remain = need - cur;
  const have = countItem(itemId);
  const take = Math.min(remain, have, Math.max(1, n || 1));
  if (take <= 0) return false;

  removeItem(itemId, take);
  if (!bundleState.delivered[bid]) bundleState.delivered[bid] = {};
  bundleState.delivered[bid][itemId] = cur + take;

  if (bundleIsComplete(b)) {
    bundleState.done[bid] = true;
    if (typeof addGold === 'function') addGold(b.gold);
    toast('🎁 完成收集包「' + b.name + '」，获得 ' + b.gold + ' 金币');
    playSfx(1318, 'triangle', 0.2, CONFIG.AUDIO.VOLUME);
  } else {
    toast('交付 ' + itemDef(itemId).name + ' ×' + take + '（' + (cur + take) + '/' + need + '）');
    playSfx(880, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.7);
  }
  return true;
}

function bundleSerialize() {
  return {
    d: bundleState.delivered,
    k: Object.keys(bundleState.done).filter(id => bundleState.done[id])
  };
}

function bundleDeserialize(o) {
  bundleState.delivered = {};
  bundleState.done = {};
  if (!o || typeof o !== 'object') return;
  if (o.d && typeof o.d === 'object') {
    for (const bid in o.d) {
      if (!CONFIG.BUNDLE_MAP[bid]) continue;
      const src = o.d[bid] || {};
      const dst = {};
      for (const itemId in src) {
        if (CONFIG.ITEMS[itemId] && src[itemId] > 0) dst[itemId] = src[itemId] | 0;
      }
      bundleState.delivered[bid] = dst;
    }
  }
  if (Array.isArray(o.k)) {
    for (const bid of o.k) if (CONFIG.BUNDLE_MAP[bid]) bundleState.done[bid] = true;
  }
}

function bundleResetState() {
  bundleState.delivered = {};
  bundleState.done = {};
}

Object.assign(window, {
  bundleState, bundleDef, bundleDelivered, bundleNeed, bundleIsComplete,
  bundleProgress, bundleDoneCount, bundleCenterNear, bundleDeliver,
  bundleSerialize, bundleDeserialize, bundleResetState
});
export {
  bundleState, bundleDef, bundleDelivered, bundleNeed, bundleIsComplete,
  bundleProgress, bundleDoneCount, bundleCenterNear, bundleDeliver,
  bundleSerialize, bundleDeserialize, bundleResetState
};
