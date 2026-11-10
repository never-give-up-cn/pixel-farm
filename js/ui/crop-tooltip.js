/* js/ui/crop-tooltip.js —— 由 index.html 拆分，原行 6656–6754 */
'use strict';

/* --- 第 23 轮：作物生长进度提示（跟着鼠标的小浮层） --- */
function drawCropTip(g){
  if(!mouse.inside) return;
  const tx = hover.tx, ty = hover.ty;
  if(tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return;
  const c = crops[ty*MAP_W + tx];
  if(!c) return;
  const def = cropDef(c.type);
  if(!def) return;
  let txt;
  if(c.dead)       txt = def.name + ' · 已枯萎（用镰刀清理）';
  else if(c.mature) txt = def.name + ' · 可收获';
  else{
    const left = Math.max(0, def.days - c.grown);
    txt = def.name + ' · 还需 ' + left + ' 天（' + (c.watered ? '已浇水' : '未浇水') + '）';
  }
  g.font = '12px ' + FONT_CJK;
  g.textAlign = 'left'; g.textBaseline = 'top';
  const w = g.measureText(txt).width;
  let x = mouse.x + 14, y = mouse.y + 14;
  if(x + w + 8 > VIEW_W) x = mouse.x - w - 14;
  if(y + 22 > VIEW_H)  y = mouse.y - 24;
  if(x < 2) x = 2;
  if(y < 2) y = 2;
  g.fillStyle = 'rgba(8,10,16,0.82)';   g.fillRect(x - 5, y - 3, w + 10, 20);
  g.strokeStyle = CONFIG.COLORS.hudBorder; g.strokeRect(x - 5, y - 3, w + 10, 20);
  g.fillStyle = CONFIG.COLORS.hudAccent;
  g.fillText(txt, x, y);
}

/* 睡觉淡入淡出 + 「第 N 天」标题（画在最上层，连网格线一起盖住） */
function drawSleepFx(g){
  const a = sleepAlpha();
  if(a > 0){
    g.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if(sleepFx.phase === 'title'){
    const S = CONFIG.SLEEP;
    const k = Math.min(sleepFx.t / (S.TITLE * 0.30), (S.TITLE - sleepFx.t) / (S.TITLE * 0.35), 1);
    const al = clamp(k, 0, 1);
    g.textAlign = 'center'; g.textBaseline = 'top';
    g.font = '30px ' + FONT_CJK;
    g.fillStyle = 'rgba(255,215,106,' + al.toFixed(2) + ')';
    g.fillText('第 ' + clock.day + ' 天', VIEW_W/2, VIEW_H/2 - 34);
    g.font = '14px ' + FONT_CJK;
    g.fillStyle = 'rgba(207,227,255,' + al.toFixed(2) + ')';
    g.fillText(seasonName() + '季 · ' + weather.name + ' · ' + clockHM().s, VIEW_W/2, VIEW_H/2 + 6);
    g.textAlign = 'left'; g.textBaseline = 'top';
  }
}

/* 快捷栏在画布上的位置（绘制与点击判定共用一份） */
function hotbarRect(){
  const HOT = CONFIG.INVENTORY.HOTBAR, CELL = 44, GAP = 4;
  const w = HOT*CELL + (HOT-1)*GAP;
  return {x: Math.round((VIEW_W - w)/2), y: VIEW_H - CELL - 12, w: w, h: CELL, cell: CELL, gap: GAP};
}
const statsEl = document.getElementById('stats');
function updateStats(force){
  /* 第 22 轮：状态面板只在 Esc 菜单展开时用得上，菜单没开就不拼那两大串 */
  if(!sysStatsOpen && !force) return;
  const inMap = (hover.tx>=0 && hover.ty>=0 && hover.tx<MAP_W && hover.ty<MAP_H);
  const t = inMap ? TILE_NAMES[map[hover.ty*MAP_W+hover.tx]] : '-';
  const hc = inMap ? crops[hover.ty*MAP_W+hover.tx] : null;
  let cropInfo = '';
  if(hc){
    const d = cropDef(hc.type);
    cropInfo = '　' + d.icon + d.name + ' 阶段' + hc.stage + ' 生长' + hc.grown + '/' + d.days +
               (hc.dead ? ' <b>已枯萎</b>' : (hc.mature ? ' <b>已成熟</b>' : '')) +
               (!hc.dead && hc.watered ? ' <b>今天浇过水</b>' : '');   /* 第 22 轮：浇水状态上屏 */
  }
  const spd = Math.round(Math.hypot(player.vx, player.vy));
  statsEl.innerHTML =
    '玩家 <b>' + player.x.toFixed(1) + ', ' + player.y.toFixed(1) + '</b>  格 ' +
    Math.floor(player.x/TILE) + ',' + Math.floor(player.y/TILE) + '\n' +
    '朝向 <b>' + DIR_NAMES[player.dir] + '</b>　速度 <b>' + spd + '</b> px/s　帧 ' + player.frame + '\n' +
    '光标 <b>' + hover.tx + ',' + hover.ty + '</b> ' + t + cropInfo + '\n' +
    '绘制瓦片 <b>' + visibleCount + '</b> / ' + (MAP_W*MAP_H) +
    ' (' + (visibleCount/(MAP_W*MAP_H)*100).toFixed(1) + '%)\n' +
    '帧率 <b>' + fps.toFixed(0) + '</b> fps　渲染 <b>' + renderMs.toFixed(2) + '</b> ms　' +
    '地面烘焙 <b>' + groundBakedCount + '</b>/' + (MAP_W*MAP_H) +
    (groundDirty.size ? '（待重画 ' + groundDirty.size + '）' : '') + '\n' +
    '快捷栏 ' + CONFIG.INVENTORY.HOTBAR + ' 格（= 背包前 ' + CONFIG.INVENTORY.HOTBAR + ' 格）选中 <b>' +
        (hotSel + 1) + '</b>：' + (selectedItem() ? selectedItem().icon + selectedItem().name : '空') + '\n' +
    '背包 <b>' + invUsed() + '</b>/' + CONFIG.INVENTORY.SLOTS + ' 格　金币 <b>' + gold + '</b>\n' +
    '体力 <b>' + Math.ceil(stamina) + '</b>/' + staminaMax + '（上限 ' + CONFIG.STAMINA.MAX + '）\n' +
    '水壶 <b>' + canWater + '</b>/' + canCapacity() + '（Lv' + canLevel + '）　右键站在水边补水\n' +
    '作物 <b>' + CONFIG.CROPS.length + '</b> 种（当季 ' +
        CONFIG.CROPS.filter(c => cropSeasons(c).indexOf(seasonName()) >= 0).length + ' 种）\n' +
    '背包物品 ' + Object.keys(CONFIG.ITEMS).filter(id => countItem(id) > 0).map(id =>
        CONFIG.ITEMS[id].icon + ' ' + CONFIG.ITEMS[id].name + ' <b>' + countItem(id) + '</b>').join('　') + '\n' +
    '时间 <b>' + seasonName() + ' · 第 ' + clock.day + ' 天 · ' + clockHM().s + '</b>　' +
        CONFIG.WEATHER.map(w=>w.icon+w.name).join(' ') + '\n' +
    '种子 <b>' + CONFIG.SEED + '</b>';   /* 操作提示统一收进 Esc → 玩法速查表 */
  if(sysStats) sysStats.innerHTML = statsEl.innerHTML;   /* 菜单展开时同步一份 */
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { statsEl, drawCropTip, drawSleepFx, hotbarRect, updateStats });
export { statsEl, drawCropTip, drawSleepFx, hotbarRect, updateStats };
