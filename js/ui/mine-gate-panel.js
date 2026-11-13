/* js/ui/mine-gate-panel.js — 矿井入口：最深层纪录 + 电梯楼层选择。
 * 电梯每 5 层解锁一层；选择后直接以该层作为起点下矿。 */

'use strict';

let mineGateEl = null;
let mineGateMask = null;
let mineGateBest = null;
let mineGateHint = null;
let mineGateFloors = null;

window.mineGateOpen = false;

function mineGateEnsure() {
  if (mineGateEl) return true;
  mineGateEl = document.getElementById('minegate');
  mineGateMask = document.getElementById('minegateMask');
  mineGateBest = document.getElementById('minegateBest');
  mineGateHint = document.getElementById('minegateHint');
  mineGateFloors = document.getElementById('minegateFloors');
  if (mineGateMask) mineGateMask.addEventListener('mousedown', e => {
    e.preventDefault();
    mineGateClosePanel();
  });
  return !!mineGateEl;
}

function mineGateBestDepth() {
  if (typeof mineSave === 'function') return Math.max(1, mineSave() | 0);
  return 1;
}

function mineGateAddFloor(label, depth, entry) {
  if (!mineGateFloors) return;
  const b = document.createElement('button');
  b.className = 'mbtn' + (entry ? ' entry' : '');
  b.textContent = label;
  b.addEventListener('click', e => {
    e.preventDefault();
    mineGateEnter(depth);
  });
  mineGateFloors.appendChild(b);
}

function mineGateRender() {
  if (!mineGateEnsure()) return;
  const best = mineGateBestDepth();
  const floors = (typeof mineElevatorFloors === 'function') ? mineElevatorFloors() : [];
  if (mineGateBest) mineGateBest.textContent = '最深 B' + best;
  if (mineGateHint) {
    mineGateHint.textContent = floors.length
      ? '电梯已解锁：选择要从哪一层开始。往下走梯子可以继续刷新最深纪录。'
      : '电梯还没解锁。先下到 B' + Math.max(1, CONFIG.MINE.ELEVATOR_STEP) + '，之后就能从这里直达。';
  }
  if (mineGateFloors) {
    mineGateFloors.innerHTML = '';
    mineGateAddFloor('B1 入口', 1, true);
    for (const f of floors) mineGateAddFloor('B' + f, f, false);
  }
}

function mineGateOpenPanel() {
  if (window.mineActive) return false;
  if (!mineGateEnsure()) return false;
  if (typeof togglePack === 'function') togglePack(false);
  if (typeof shopOpen !== 'undefined' && shopOpen && typeof toggleShop === 'function') toggleShop(false);
  window.mineGateOpen = true;
  mineGateRender();
  mineGateEl.classList.add('open');
  if (typeof playSfx === 'function') playSfx(520, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.7);
  return true;
}

function mineGateClosePanel() {
  if (!mineGateEnsure()) return false;
  window.mineGateOpen = false;
  mineGateEl.classList.remove('open');
  return true;
}

function mineGateEnter(depth) {
  mineGateClosePanel();
  if (typeof enterMine === 'function') enterMine(depth);
}

function toggleMineGate() {
  return window.mineGateOpen ? mineGateClosePanel() : mineGateOpenPanel();
}

/* 矿井入口的 E 交互：没有捷径时直接下 B1，有电梯时先让玩家选楼层 */
function mineEntranceInteract() {
  const floors = (typeof mineElevatorFloors === 'function') ? mineElevatorFloors() : [];
  if (!floors.length) {
    if (typeof enterMine === 'function') enterMine(1);
    return true;
  }
  return mineGateOpenPanel();
}

Object.assign(window, {
  mineGateOpenPanel, mineGateClosePanel, mineGateEnter, toggleMineGate,
  mineEntranceInteract, mineGateRender
});
export {
  mineGateOpenPanel, mineGateClosePanel, mineGateEnter, toggleMineGate,
  mineEntranceInteract, mineGateRender
};
