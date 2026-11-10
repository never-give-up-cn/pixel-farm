/* js/ui/room-panel.js — 装修样板：墙纸 / 地板预览与选择。 */

'use strict';

import {
  WALLPAPERS, FLOORINGS, INTERIOR_MAP,
  drawWallpaperTile, drawFloorTile
} from '../anim/interior.js';

window.roomOpen = false;

let roomEl, roomMask, roomGrid, roomPreview, roomInfo;
let roomTab = 'wall';

function drawRoomPreview() {
  if (!roomPreview) return;
  const g = roomPreview.getContext('2d');
  g.imageSmoothingEnabled = false;
  const W = roomPreview.width, H = roomPreview.height;
  g.fillStyle = '#141b16';
  g.fillRect(0, 0, W, H);

  const wall = roomState.wall ? INTERIOR_MAP[roomState.wall] : null;
  const floor = roomState.floor ? INTERIOR_MAP[roomState.floor] : null;

  /* 墙 3 行 */
  for (let y = 0; y < 96; y += 32) {
    for (let x = 0; x < W; x += 32) {
      if (!wall) {
        g.fillStyle = '#34343e'; g.fillRect(x, y, 32, 32);
        g.fillStyle = '#3e3e48'; g.fillRect(x + 4, y + 4, 24, 24);
      } else {
        g.save();
        g.translate(x, y);
        drawWallpaperTile(g, wall, 0.25);
        g.restore();
      }
    }
  }

  /* 地板 5 行 */
  for (let y = 96; y < H; y += 32) {
    for (let x = 0; x < W; x += 32) {
      g.save();
      g.translate(x, y);
      if (floor) drawFloorTile(g, floor, 0.25);
      else { g.fillStyle = ((x / 32 + y / 32) % 2) ? '#3a3026' : '#443a2e'; g.fillRect(0, 0, 32, 32); }
      g.restore();
    }
  }

  /* 踢脚线 */
  g.fillStyle = 'rgba(20,16,12,.55)';
  g.fillRect(0, 94, W, 4);
}

function roomRender() {
  if (!roomGrid) return;
  roomGrid.innerHTML = '';
  const list = roomTab === 'wall' ? WALLPAPERS : FLOORINGS;
  const current = roomTab === 'wall' ? roomState.wall : roomState.floor;

  for (const it of list) {
    const cell = document.createElement('div');
    cell.className = 'wcell' + (current === it.id ? ' on' : '');
    cell.title = it.name;
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    cv.style.width = '30px'; cv.style.height = '30px';
    cv.style.imageRendering = 'pixelated';
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (roomTab === 'wall') drawWallpaperTile(g, it, 0.25);
    else drawFloorTile(g, it, 0.25);
    const nm = document.createElement('b');
    nm.textContent = it.name;
    cell.appendChild(cv);
    cell.appendChild(nm);
    cell.addEventListener('click', () => {
      if (countItem(it.id) <= 0) { toast('先在商店购买「' + it.name + '」'); return; }
      if (roomTab === 'wall') setRoomWall(it.id); else setRoomFloor(it.id);
      roomRender();
    });
    roomGrid.appendChild(cell);
  }

  if (roomInfo) {
    const w = roomState.wall ? INTERIOR_MAP[roomState.wall] : null;
    const f = roomState.floor ? INTERIOR_MAP[roomState.floor] : null;
    roomInfo.textContent = '墙纸：' + (w ? w.name : '默认') + ' · 地板：' + (f ? f.name : '默认');
  }
  drawRoomPreview();
}

function roomRenderTabs() {
  for (const b of document.querySelectorAll('#roomTabs button')) {
    b.classList.toggle('on', b.dataset.rtab === roomTab);
  }
}

function roomOpenPanel() {
  if (!roomEl) roomEl = document.getElementById('room');
  if (!roomEl) return false;
  if (!roomGrid) {
    roomMask = document.getElementById('roomMask');
    roomGrid = document.getElementById('roomGrid');
    roomPreview = document.getElementById('roomPreview');
    roomInfo = document.getElementById('roomInfo');
    if (roomMask) roomMask.addEventListener('mousedown', e => { e.preventDefault(); roomClosePanel(); });
    for (const b of document.querySelectorAll('#roomTabs button')) {
      b.addEventListener('click', () => { roomTab = b.dataset.rtab; roomRenderTabs(); roomRender(); });
    }
  }
  window.roomOpen = true;
  roomEl.classList.add('open');
  roomRenderTabs();
  roomRender();
  return true;
}

function roomClosePanel() {
  if (!roomEl) roomEl = document.getElementById('room');
  window.roomOpen = false;
  if (roomEl) roomEl.classList.remove('open');
}

function toggleRoom(v) {
  const want = (v === undefined) ? !window.roomOpen : !!v;
  return want ? roomOpenPanel() : roomClosePanel();
}

Object.assign(window, { roomOpenPanel, roomClosePanel, toggleRoom, roomRender });
export { roomOpenPanel, roomClosePanel, toggleRoom, roomRender };
