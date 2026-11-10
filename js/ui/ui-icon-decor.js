/* js/ui/ui-icon-decor.js — 把菜单按钮上的 emoji 换成 anim UI 像素图标。 */

'use strict';

import { UI_MAP, drawUiIcon } from '../anim/ui-icons.js';

const SIZE = 18;

function iconCanvas(id, size = SIZE) {
  const def = UI_MAP[id];
  if (!def) return null;
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 32;
  cv.style.width = size + 'px';
  cv.style.height = size + 'px';
  cv.style.imageRendering = 'pixelated';
  cv.style.verticalAlign = 'middle';
  cv.style.marginRight = '4px';
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  drawUiIcon(g, def, 0.25);
  return cv;
}

function prepend(btn, id) {
  if (!btn) return;
  if (btn.querySelector && btn.querySelector('canvas')) return;
  const cv = iconCanvas(id);
  if (!cv) return;
  /* 去掉文字开头的 emoji / 符号，保留中文与数字 */
  btn.textContent = btn.textContent.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/u, '').trim();
  btn.insertBefore(cv, btn.firstChild);
  if (btn.style) { btn.style.display = 'inline-flex'; btn.style.alignItems = 'center'; }
}

function decorate() {
  const map = {
    btnAch: 'skills',
    btnFrend: 'social',
    btnCheat: 'journal',
    btnStats: 'collections',
    sndBtn: 'settings',
    hintBtn: 'quest',
    optMotion: 'star',
    optFps: 'clock',
    optGrid: 'map',
    optLog: 'settings',
    optFull: 'map',
    btnExport: 'save',
    btnImport: 'save',
    btnSave: 'save',
    btnLoad: 'backpack',
    btnWipe: 'exit'
  };
  for (const id in map) prepend(document.getElementById(id), map[id]);

  for (const b of document.querySelectorAll('[data-ptab]')) {
    prepend(b, b.dataset.ptab === 'bag' ? 'backpack' : 'collections');
  }
  for (const b of document.querySelectorAll('#shopTabs [data-tab]')) {
    prepend(b, b.dataset.tab === 'buy' ? 'shop' : 'gold');
  }

  const vol = document.getElementById('volIcon');
  if (vol) {
    const cv = iconCanvas('settings', 16);
    if (cv) { vol.textContent = ''; vol.appendChild(cv); vol.style.display = 'inline-flex'; vol.style.alignItems = 'center'; }
  }
}

decorate();

/* 其他模块可能在之后改写按钮文字，等初始化完成再补一次 */
setTimeout(decorate, 0);
window.addEventListener('load', decorate);

Object.assign(window, { decorateUiIcons: decorate });
export { decorate, iconCanvas };
