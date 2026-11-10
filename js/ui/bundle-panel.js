/* js/ui/bundle-panel.js — 社区中心收集包面板。
 * 点击需求即可交付（一次交到上限），交满后自动领取金币奖励。
 */

'use strict';

window.bundleOpen = false;

let bundleEl, bundleMask, bundleList, bundleProg;

function bundleRender() {
  if (!bundleList) return;
  bundleList.innerHTML = '';
  const total = CONFIG.BUNDLES.length;
  if (bundleProg) bundleProg.textContent = bundleDoneCount() + '/' + total + ' 已收集';

  for (const b of CONFIG.BUNDLES) {
    const done = !!bundleState.done[b.id];
    const row = document.createElement('div');
    row.className = 'brow' + (done ? ' done' : '');

    const title = document.createElement('div');
    title.className = 'bt';
    title.textContent = b.icon + ' ' + b.name;
    const em = document.createElement('em');
    em.textContent = b.roomName + ' · 奖励 ' + b.gold + ' 💰';
    title.appendChild(em);
    if (done) {
      const ok = document.createElement('em');
      ok.textContent = '✓ 已完成';
      title.appendChild(ok);
    }
    row.appendChild(title);

    const req = document.createElement('div');
    req.className = 'breq';
    for (const it of b.items) {
      const got = bundleDelivered(b.id, it.id);
      const have = countItem(it.id);
      const full = got >= it.n;
      const btn = document.createElement('button');
      const name = itemDef(it.id) ? itemDef(it.id).name : it.id;
      btn.textContent = name + ' ' + Math.min(got, it.n) + '/' + it.n;
      btn.title = full ? '已交满' : ('背包里有 ' + have + ' 个，点击交付');
      btn.className = done || full ? 'full' : (have > 0 ? 'ok' : 'off');
      btn.disabled = done || full;
      if (!done && !full) {
        btn.addEventListener('click', () => {
          if (countItem(it.id) <= 0) {
            toast('背包里没有' + name);
            return;
          }
          bundleDeliver(b.id, it.id, 9999);
          bundleRender();
        });
      }
      req.appendChild(btn);
    }
    row.appendChild(req);
    bundleList.appendChild(row);
  }
}

function bundleOpenPanel() {
  if (!bundleEl) bundleEl = document.getElementById('bundle');
  if (!bundleList) {
    bundleMask = document.getElementById('bundleMask');
    bundleList = document.getElementById('bundleList');
    bundleProg = document.getElementById('bundleProg');
    if (bundleMask) bundleMask.addEventListener('mousedown', e => { e.preventDefault(); bundleClosePanel(); });
  }
  if (!bundleEl) return false;
  if (typeof togglePack === 'function') togglePack(false);
  if (typeof toggleShop === 'function') toggleShop(false);
  window.bundleOpen = true;
  bundleEl.classList.add('open');
  bundleRender();
  return true;
}

function bundleClosePanel() {
  if (!bundleEl) bundleEl = document.getElementById('bundle');
  window.bundleOpen = false;
  if (bundleEl) bundleEl.classList.remove('open');
}

function toggleBundlePanel(v) {
  const want = (v === undefined) ? !window.bundleOpen : !!v;
  return want ? bundleOpenPanel() : bundleClosePanel();
}

Object.assign(window, {
  bundleOpenPanel, bundleClosePanel, toggleBundlePanel, bundleRender
});
export { bundleOpenPanel, bundleClosePanel, toggleBundlePanel, bundleRender };
