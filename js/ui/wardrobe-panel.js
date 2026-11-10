/* js/ui/wardrobe-panel.js — 衣柜换装面板：帽子 / 上衣 / 下装。
 * 点击图标试穿，再点一次脱下；左侧实时预览农夫。
 */

'use strict';

import { HATS, HAT_MAP, drawHatIcon, drawHatOnFarmer } from '../anim/hats.js';
import { SHIRTS, PANTS, CLOTH_MAP, drawClothingIcon } from '../anim/clothes.js';
import { drawFarmer } from '../anim/farmer.js';

window.wardrobeOpen = false;

let wardrobeEl, wardrobeMask, wardrobeGrid, wardrobePreview, wardrobeInfo;
let wardrobeTab = 'hat';

function previewDraw() {
  if (!wardrobePreview) return;
  const g = wardrobePreview.getContext('2d');
  g.clearRect(0, 0, 96, 120);
  g.imageSmoothingEnabled = false;
  const fit = playerOutfitOpts();
  g.save();
  g.scale(3, 3);
  drawFarmer(g, 'idle', 0, 0.25, { noHat: fit.noHat, outfit: fit.outfit });
  if (fit.hat && HAT_MAP[fit.hat]) drawHatOnFarmer(g, HAT_MAP[fit.hat], 0, 0.25);
  g.restore();
}

function wardrobeRender() {
  if (!wardrobeGrid) return;
  wardrobeGrid.innerHTML = '';
  const o = outfitOf();
  const list = wardrobeTab === 'hat' ? HATS
    : wardrobeTab === 'shirt' ? SHIRTS
    : PANTS;
  const current = wardrobeTab === 'hat' ? o.hat
    : wardrobeTab === 'shirt' ? o.shirt : o.pants;

  for (const it of list) {
    const cell = document.createElement('div');
    cell.className = 'wcell' + (current === it.id ? ' on' : '');
    cell.title = it.name + (current === it.id ? '（点击脱下）' : '');
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    cv.style.width = '32px'; cv.style.height = '32px';
    cv.style.imageRendering = 'pixelated';
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (wardrobeTab === 'hat') drawHatIcon(g, HAT_MAP[it.id], 0.25);
    else drawClothingIcon(g, it, 0.25);
    const nm = document.createElement('b');
    nm.textContent = it.name;
    cell.appendChild(cv);
    cell.appendChild(nm);
    cell.addEventListener('click', () => {
      if (wardrobeTab === 'hat') equipHat(it.id);
      else if (wardrobeTab === 'shirt') equipShirt(it.id);
      else equipPants(it.id);
      wardrobeRender();
    });
    wardrobeGrid.appendChild(cell);
  }

  if (wardrobeInfo) {
    const parts = [];
    parts.push('帽子：' + (o.hat ? HAT_MAP[o.hat].name : '无'));
    parts.push('上衣：' + (o.shirt ? CLOTH_MAP[o.shirt].name : '默认'));
    parts.push('下装：' + (o.pants ? CLOTH_MAP[o.pants].name : '默认'));
    wardrobeInfo.textContent = parts.join(' · ');
  }
  previewDraw();
}

function wardrobeRenderTabs() {
  for (const b of document.querySelectorAll('#wardrobeTabs button')) {
    b.classList.toggle('on', b.dataset.wtab === wardrobeTab);
  }
}

function wardrobeOpenPanel() {
  if (!wardrobeEl) wardrobeEl = document.getElementById('wardrobe');
  if (!wardrobeEl) return false;
  if (!wardrobeGrid) {
    wardrobeMask = document.getElementById('wardrobeMask');
    wardrobeGrid = document.getElementById('wardrobeGrid');
    wardrobePreview = document.getElementById('wardrobePreview');
    wardrobeInfo = document.getElementById('wardrobeInfo');
    if (wardrobeMask) wardrobeMask.addEventListener('mousedown', e => { e.preventDefault(); wardrobeClosePanel(); });
    for (const b of document.querySelectorAll('#wardrobeTabs button')) {
      b.addEventListener('click', () => { wardrobeTab = b.dataset.wtab; wardrobeRenderTabs(); wardrobeRender(); });
    }
  }
  window.wardrobeOpen = true;
  wardrobeEl.classList.add('open');
  wardrobeRenderTabs();
  wardrobeRender();
  return true;
}

function wardrobeClosePanel() {
  if (!wardrobeEl) wardrobeEl = document.getElementById('wardrobe');
  window.wardrobeOpen = false;
  if (wardrobeEl) wardrobeEl.classList.remove('open');
}

function toggleWardrobe(v) {
  const want = (v === undefined) ? !window.wardrobeOpen : !!v;
  return want ? wardrobeOpenPanel() : wardrobeClosePanel();
}

Object.assign(window, { wardrobeOpenPanel, wardrobeClosePanel, toggleWardrobe, wardrobeRender });
export { wardrobeOpenPanel, wardrobeClosePanel, toggleWardrobe, wardrobeRender };
