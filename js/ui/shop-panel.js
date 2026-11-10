/* js/ui/shop-panel.js —— 由 index.html 拆分，原行 6091–6655 */
'use strict';

/* --- 商店面板（DOM 覆盖层；打开时游戏时间冻结） --- */
const shopEl   = document.getElementById('shop');
const shopMask = document.getElementById('shopMask');
const shopTabs = document.getElementById('shopTabs');
const shopBody = document.getElementById('shopBody');
const shopGold = document.getElementById('shopGold');
const shopSeason = document.getElementById('shopSeason');
window.shopOpen = false;          /* 商店是否打开（打开时 update() 整体冻结 → 时间停住） */
window.shopTab = 'buy';          /* 当前页签：'buy' 购买 / 'sell' 出售 */

/* 金币跳动：商店面板里的金币数字也弹一下 */
function pulseShopGold(){
  if(!shopGold || !shopGold.style) return;
  shopGold.style.animation = 'none';
  setTimeout(()=>{ if(shopGold && shopGold.style) shopGold.style.animation = ''; }, 20);
  shopGold.style.animation = 'goldBump ' + CONFIG.SHOP.GOLD_PULSE_MS + 'ms ease-out';
}
/* 画一条商品行 */
function shopRow(icon, name, sub, priceHtml, buttons, iconId){
  const row = document.createElement('div');
  row.className = 'srow';
  const ic = document.createElement('span'); ic.className = 'ic';
  if(!(iconId && typeof paintItemIcon === 'function' && paintItemIcon(ic, iconId, 24))) ic.textContent = icon;
  const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = name;
  if(sub){
    const em = document.createElement('em'); em.textContent = sub; nm.appendChild(em);
  }
  const pr = document.createElement('span'); pr.className = 'pr'; pr.innerHTML = priceHtml;
  row.appendChild(ic); row.appendChild(nm); row.appendChild(pr);
  for(const b of buttons){
    const btn = document.createElement('button');
    btn.className = 'btn' + (b.off ? ' off' : '');
    btn.textContent = b.label;
    btn.addEventListener('click', e=>{ e.preventDefault(); b.fn(); });
    row.appendChild(btn);
  }
  return row;
}
/* 价格文字 + 浮动标记 */
function priceHtml(id){
  const t = priceTrend(id);
  const cls = (t === '↑') ? 'up' : (t === '↓' ? 'dn' : '');
  return priceOf(id) + ' 💰<span class="' + cls + '">' + t + '</span>';
}
/* 购买页签 */
function renderShopBuy(){
  if(!shopBody) return;
  for(const entry of CONFIG.SHOP.BUY){
    const id = entry.id;
    /* 第 15 轮：动物（不是背包物品，按棚舍空位购买） */
    if(entry.animal){
      const t = animalType(entry.animal);
      if(!t) continue;
      const sh = CONFIG.ANIMALS.SHELTERS[t.shelter];
      const have = animalCount(t.id), cap = animalCapacity(t.id);
      const price = priceOf(id);
      const noShelter = cap <= 0, full = have >= cap;
      let label, off;
      if(noShelter){ label = '先建' + sh.name; off = true; }
      else if(full){ label = sh.name + '已满'; off = true; }
      else if(gold < price){ label = '金币不够'; off = true; }
      else { label = '购买'; off = false; }
      const prodName = itemDef(t.produce) ? itemDef(t.produce).name : '产品';
      const sub = sh.name + ' ' + have + '/' + cap + ' · ' + t.matureDays + ' 天成熟 · 每日产' + prodName;
      shopBody.appendChild(shopRow(t.icon, t.name, sub, priceHtml(id),
        [{label:label, off:off, fn:()=>{ shopBuyClick(id); }}]));
      continue;
    }
    const up = (id === 'can_upgrade');
    const d = up ? null : itemDef(id);
    if(!up && !d) continue;
    /* 第 32 轮：种子只显示当季可种的，避免 50 种一起挤满货架 */
    if(d && d.kind === 'seed'){
      const cd = cropDef(d.crop);
      if(!cd || cropSeasons(cd).indexOf(seasonName()) < 0) continue;
    }
    const price = priceOf(id);
    let name, sub, off = false, label = '购买', fn;
    if(up){
      const maxed = canLevel >= CONFIG.SHOP.CAN_MAX_LEVEL;
      const next = Math.min(CONFIG.WATER_CAN.MAX_CAPACITY, canCapacity() + CONFIG.WATER_CAN.UPGRADE_STEP);
      name = '水壶扩容 Lv' + canLevel + ' → Lv' + (canLevel + 1);
      sub  = maxed ? '已满级' : ('容量 ' + canCapacity() + ' → ' + next);
      off = maxed || (gold < price);
      label = maxed ? '已满级' : (gold < price ? '金币不够' : '升级');
      fn = ()=>{ shopBuyClick(id); };
    }else{
      const owned = toolOwned(id);
      name = d.name;
      if(d.kind === 'tool')      sub = '工具 · 一次性';
      else if(d.kind === 'seed'){ const cd = cropDef(d.crop); sub = cropSeasons(cd).join('、') + '季 · ' + cd.days + '天'; }
      else sub = '';
      off = owned || (gold < price);
      label = owned ? '已拥有' : (gold < price ? '金币不够' : '购买');
      fn = ()=>{ shopBuyClick(id); };
    }
    shopBody.appendChild(shopRow(d ? d.icon : '💧', name, sub, priceHtml(id),
      [{label:label, off:off, fn:fn}], id));
  }
}
/* 出售页签：列出背包里所有可卖的物品 */
function renderShopSell(){
  if(!shopBody) return;
  const ids = Object.keys(CONFIG.ITEMS).filter(id => isSellable(id) && countItem(id) > 0);
  if(!ids.length){
    const e = document.createElement('div');
    e.className = 'sempty';
    e.textContent = '背包里没有可以卖的东西（作物和材料才能卖）';
    shopBody.appendChild(e);
    return;
  }
  for(const id of ids){
    const d = itemDef(id);
    const festMult = festivalSellMult(id);   /* 第 17 轮：丰收节面板价格也要跟着涨 */
    const n = countItem(id), unit = Math.round(priceOf(id) * festMult);
    const total = unit * n;
    const priceTxt = festMult > 1
      ? (unit + ' 💰<span class="up">×' + festMult + '</span>')
      : priceHtml(id);
    const row = shopRow(d.icon, d.name + ' ×' + n, '', priceTxt + '　共 ' + total + ' 💰', [
      {label:'卖 1', off:false, fn:()=>{ sellItem(id, 1); }},
      {label:'全卖', off:false, fn:()=>{ sellItem(id, n); }}
    ], id);
    shopBody.appendChild(row);
  }
}
/* 刷新商店面板 */
function renderShop(){
  if(shopGold) shopGold.textContent = '💰 ' + gold + ' 金币';
  if(shopSeason){
    const bonus = npcShopBonusLeft();
    const sb = townShopBuilding();
    const owner = sb ? npcDef(sb.npc) : null;
    const w = owner ? npcWhere(owner) : null;
    const away = (owner && (!w || w.at !== 'shop'))
      ? ('　' + owner.name + (w && w.at === 'wander' ? ('去' + w.label + '逛了') : '不在店里') + '，今日无加购')
      : '';
    shopSeason.textContent = seasonName() + '季 价格 ×' + seasonCoef().toFixed(2) + '　' +
      (bonus > 0 ? ('老板娘加购 ×' + CONFIG.NPC.SHOP_BONUS.PRICE_MULT + '（还剩 ' + bonus + ' 件）　') : '') + away;
  }
  if(shopTabs && shopTabs.children){
    for(const t of shopTabs.children){
      const on = (t.getAttribute && t.getAttribute('data-tab') === shopTab);
      t.className = 'tab' + (on ? ' on' : '');
    }
  }
  if(!shopBody) return;
  shopBody.innerHTML = '';
  if(shopTab === 'buy') renderShopBuy();
  else renderShopSell();
}
/* 点「购买」按钮：先挡掉买不了的情况（按钮虽然置灰，点一下也给提示） */
function shopBuyClick(id){
  /* 第 15 轮：动物走独立购买流程（棚舍容量 / 金币校验） */
  const animalEntry = CONFIG.SHOP.BUY.find(b => b.id === id && b.animal);
  if(animalEntry) return buyAnimal(animalEntry.animal);
  if(id === 'can_upgrade'){
    if(canLevel >= CONFIG.SHOP.CAN_MAX_LEVEL){ toast('水壶已经是最大容量了'); return false; }
    const p = priceOf(id);
    if(gold < p){ toast('金币不够（还差 ' + (p - gold) + '）'); return false; }
    return upgradeCan();
  }
  const d = itemDef(id);
  if(!d) return false;
  if(toolOwned(id)){ toast('已经有' + d.name + '了'); return false; }
  const p = priceOf(id);
  if(gold < p){ toast('金币不够（还差 ' + (p - gold) + '）'); return false; }
  if(!canFit(id, 1)){ toast('背包满了，装不下' + d.name); return false; }
  return buyItem(id);
}
/* 开关商店 */
function toggleShop(open){
  const want = (open === undefined) ? !shopOpen : !!open;
  if(want === shopOpen) return false;
  if(want && !nearShop()){ toast('走到店里的柜台前才能交易'); return false; }
  if(want){
    if(!tryOpenShop()) return false;      /* 第 25 轮：打烊 / 店主不在柜台，都说清楚 */
  }
  shopOpen = want;
  if(shopOpen){
    if(packOpen) togglePack(false);            /* 背包与商店互斥 */
    renderShop();
    setPanelOpen(shopEl, true);
  }else{
    setPanelOpen(shopEl, false);
  }
  return true;
}
if(shopMask) shopMask.addEventListener('mousedown', e=>{ e.preventDefault(); toggleShop(false); });
if(shopTabs) shopTabs.addEventListener('click', e=>{
  const t = e.target;
  if(!t || !t.getAttribute) return;
  const tab = t.getAttribute('data-tab');
  if(!tab || tab === shopTab) return;
  shopTab = tab;
  renderShop();
});

/* 3×5 点阵字库（像素风 HUD 文字，缩放后依然锐利） */
const FONT = {
  '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],
  '2':['111','001','111','100','111'],'3':['111','001','111','001','111'],
  '4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
  '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],
  '8':['111','101','111','101','111'],'9':['111','101','111','001','111'],
  'F':['111','100','111','100','100'],'P':['110','101','110','100','100'],
  'S':['111','100','111','001','111'],'V':['101','101','101','101','010'],
  'v':['101','101','101','101','010'],
  'H':['101','101','111','101','101'],
  'Z':['111','001','010','100','111'],'.':['000','000','000','000','010'],
  '-':['000','000','111','000','000'],' ':['000','000','000','000','000']
};
const GLYPH_W = 3, GLYPH_H = 5;
/* HUD 用到的系统字体（emoji / 中文；不引入任何外部字体文件） */
const FONT_EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const FONT_CJK   = '"Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif';
function drawText(g, text, x, y, scale, color){
  g.fillStyle = color;
  let cx = x;
  for(const raw of String(text)){
    const glyph = FONT[raw.toUpperCase()] || FONT[raw] || FONT[' '];
    for(let r=0;r<GLYPH_H;r++){
      const row = glyph[r];
      for(let c=0;c<GLYPH_W;c++)
        if(row[c] === '1') g.fillRect(cx + c*scale, y + r*scale, scale, scale);
    }
    cx += (GLYPH_W + 1) * scale;
  }
  return cx;
}
function drawUI(g){
  /* 鼠标指向的瓦片高亮（半透明白框） */
  if(hover.tx >= 0 && hover.ty >= 0 && hover.tx < MAP_W && hover.ty < MAP_H){
    const hx = hover.tx*TILE - cam.x, hy = hover.ty*TILE - cam.y;
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 2;
    g.strokeRect(hx + 1, hy + 1, TILE - 2, TILE - 2);
  }
  /* FPS + 版本（第 29 轮：默认隐藏，设置里可开） */
  let boxH = 0;                       /* 隐藏时高度为 0，下面的金币行自动上移 */
  if(showFps){
    const scale = 2, pad = 6;
    const l1 = 'FPS ' + String(Math.round(fps)).padStart(2,' ');
    const l2 = CONFIG.VERSION + ' ' + CONFIG.TARGET_FPS + 'HZ';
    const charW = (GLYPH_W + 1) * scale;                 /* 每个字形占位（含 1px 字距） */
    const lineW = Math.max(l1.length, l2.length) * charW;
    const boxW = lineW + pad*2;
    boxH = GLYPH_H*scale*2 + pad*2 + 4;
    g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(8, 8, boxW, boxH);
    g.fillStyle = CONFIG.COLORS.hudBorder;
    g.fillRect(8, 8, boxW, 1); g.fillRect(8, 8+boxH-1, boxW, 1);
    g.fillRect(8, 8, 1, boxH);   g.fillRect(8+boxW-1, 8, 1, boxH);
    drawText(g, l1, 8+pad, 8+pad, scale, CONFIG.COLORS.hudAccent);
    drawText(g, l2, 8+pad, 8+pad + GLYPH_H*scale + 4, scale, CONFIG.COLORS.hudText);
  }

  /* 左上角：金币 + 背包提示（资源计数已全部移入背包） */
  g.textBaseline = 'top'; g.textAlign = 'left';
  g.font = '15px ' + FONT_EMOJI;  const goldIconW = g.measureText('💰').width;
  /* 金币跳动：买卖后数字弹一下，并飘出 ±N（用 performance.now()，商店打开时照样动） */
  const gp = performance.now() - goldPulseAt;
  const pulse = (gp >= 0 && gp < CONFIG.SHOP.GOLD_PULSE_MS) ? gp / CONFIG.SHOP.GOLD_PULSE_MS : -1;
  const goldPre = '金币 ', goldPost = '　[Tab] 背包 ' + invUsed() + '/' + CONFIG.INVENTORY.SLOTS;
  const DELTA_W = 34;                       /* 右侧预留飘字位 */
  g.font = '13px ' + FONT_CJK;
  const preW = g.measureText(goldPre).width;
  const numW = g.measureText(String(gold)).width;
  const postW = g.measureText(goldPost).width;
  const goldTxtW = preW + numW + postW + DELTA_W;
  const rowW = Math.ceil(goldIconW + 4 + goldTxtW) + 16, rowH = 24, rowY = 8 + boxH + 6;
  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(8, rowY, rowW, rowH);
  g.fillStyle = CONFIG.COLORS.hudBorder;
  g.fillRect(8, rowY, rowW, 1); g.fillRect(8, rowY+rowH-1, rowW, 1);
  g.fillRect(8, rowY, 1, rowH); g.fillRect(8+rowW-1, rowY, 1, rowH);
  g.font = '15px ' + FONT_EMOJI; g.fillStyle = CONFIG.COLORS.hudAccent;
  g.fillText('💰', 16, rowY + 4);
  const goldNumX = 16 + goldIconW + 4 + preW;
  g.font = '13px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudText;
  g.fillText(goldPre, 16 + goldIconW + 4, rowY + 5);
  /* 数字本体：跳动时放大并变色 */
  g.save();
  g.translate(goldNumX, rowY + 5);
  if(pulse >= 0){
    const s = 1 + 0.45 * Math.sin(Math.PI * pulse);
    g.scale(s, s);
    g.fillStyle = goldDelta >= 0 ? '#7ee08a' : '#ff9a8a';
  }
  g.fillText(String(gold), 0, 0);
  g.restore();
  g.fillStyle = CONFIG.COLORS.hudText;
  g.fillText(goldPost, goldNumX + numW, rowY + 5);
  /* 飘字：+N / -N 在右侧往上飘 */
  if(pulse >= 0){
    g.font = '12px ' + FONT_CJK;
    g.globalAlpha = Math.max(0, 1 - pulse * 0.8);
    g.fillStyle = goldDelta >= 0 ? '#7ee08a' : '#ff9a8a';
    g.textAlign = 'right';
    g.fillText((goldDelta >= 0 ? '+' : '') + goldDelta, 8 + rowW - 8, rowY + 5 - 10 * pulse);
    g.globalAlpha = 1;
    g.textAlign = 'left';
  }

  /* 左上角：季节 · 第几天 · 时刻 · 天气（今天有人过生日就带个 🎂；第 28 轮 + 明日预报） */
  const bdNpc = npcBirthdayToday();
  const dA = seasonName() + ' · 第 ' + clock.day + ' 天 · ' + clockHM().s + ' · ';
  const dB = ' ' + weather.name;
  const dC = bdNpc ? (bdNpc.name + ' 生日') : '';
  const fcT = fcTomorrow();                       /* 第 28 轮：明天的天气（预报队列头） */
  const dF1 = fcT ? ' · 明' : '';
  const dF2 = fcT ? fcT.icon : '';
  g.font = '13px ' + FONT_CJK;   const wA = g.measureText(dA).width;
  g.font = '15px ' + FONT_EMOJI; const wI = g.measureText(weather.icon).width;
  g.font = '13px ' + FONT_CJK;   const wB = g.measureText(dB).width;
  g.font = '15px ' + FONT_EMOJI; const wE = bdNpc ? g.measureText('🎂').width : 0;
  g.font = '13px ' + FONT_CJK;   const wC = dC ? g.measureText(dC).width : 0;
  g.font = '13px ' + FONT_CJK;   const wF1 = fcT ? g.measureText(dF1).width : 0;
  g.font = '15px ' + FONT_EMOJI; const wF2 = fcT ? g.measureText(dF2).width : 0;
  const dW = Math.ceil(wA + wI + wB + wE + wC + wF1 + wF2) + 16 + 20, dH = 24, dY = rowY + rowH + 6;
  hudDateRect = {x:8, y:dY, w:dW, h:dH};   /* 第 17 轮：这个区域可以点开日历 */  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(8, dY, dW, dH);
  g.fillStyle = CONFIG.COLORS.hudBorder;
  g.fillRect(8, dY, dW, 1); g.fillRect(8, dY+dH-1, dW, 1);
  g.fillRect(8, dY, 1, dH); g.fillRect(8+dW-1, dY, 1, dH);
  g.textBaseline = 'top';
  g.font = '13px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudText;
  g.fillText(dA, 16, dY + 5);
  g.font = '15px ' + FONT_EMOJI; g.fillStyle = CONFIG.COLORS.hudAccent;
  g.fillText(weather.icon, 16 + wA, dY + 4);
  g.font = '13px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudText;
  g.fillText(dB, 16 + wA + wI, dY + 5);
  let fx0 = 16 + wA + wI + wB;
  if(bdNpc){
    g.font = '15px ' + FONT_EMOJI; g.fillStyle = '#ffb08a';
    g.fillText('🎂', fx0, dY + 4);
    g.font = '13px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudText;
    g.fillText(dC, fx0 + wE, dY + 5);
    fx0 += wE + wC;
  }
  /* 第 28 轮：日期条尾部显示明天的天气预报 */
  if(fcT){
    g.font = '13px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudText;
    g.fillText(dF1, fx0, dY + 5);
    g.font = '15px ' + FONT_EMOJI; g.fillStyle = CONFIG.COLORS.hudAccent;
    g.fillText(dF2, fx0 + wF1, dY + 4);
  }
  /* 第 17 轮：日历入口（点这块区域打开） */
  g.font = '14px ' + FONT_EMOJI; g.fillStyle = CONFIG.COLORS.hudAccent;
  g.fillText('📅', 8 + dW - 22, dY + 4);
  /* 第 20 轮：右上角农场评分（点开评级面板） */
  drawRatingHud(g);
  /* 第 19 轮：加工台提醒（有成品待取 / 正在加工） */
  drawMakerHud(g);
  /* 第 23 轮：小地图（右上角，评级 / 加工台 HUD 下方） */
  drawMinimap(g);

  /* 建造模式：左侧配方面板 */
  if(buildMode) drawBuildPanel(g, dY + dH + 6);
  /* 第 16 轮：进行中的委托追踪条（建造模式时让位给配方面板） */
  if(!buildMode) drawQuestTracker(g, dY + dH + 6);

  /* 底部中央：快捷栏 8 格（= 背包前 8 格），选中格高亮描边 */
  const hb = hotbarRect();
  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(hb.x - 6, hb.y - 6, hb.w + 12, hb.h + 12);
  g.fillStyle = CONFIG.COLORS.hudBorder;
  g.fillRect(hb.x - 6, hb.y - 6, hb.w + 12, 1); g.fillRect(hb.x - 6, hb.y + hb.h + 5, hb.w + 12, 1);
  g.fillRect(hb.x - 6, hb.y - 6, 1, hb.h + 12); g.fillRect(hb.x + hb.w + 5, hb.y - 6, 1, hb.h + 12);
  for(let i=0;i<CONFIG.INVENTORY.HOTBAR;i++){
    const x = hb.x + i*(hb.cell + hb.gap);
    const on = (i === hotSel);
    const s = inv[i];
    g.fillStyle = on ? 'rgba(255,215,106,0.18)' : 'rgba(12,16,24,0.85)';
    g.fillRect(x, hb.y, hb.cell, hb.h);
    g.fillStyle = on ? CONFIG.COLORS.hudAccent : CONFIG.COLORS.hudBorder;
    g.fillRect(x, hb.y, hb.cell, 1); g.fillRect(x, hb.y + hb.h - 1, hb.cell, 1);
    g.fillRect(x, hb.y, 1, hb.h); g.fillRect(x + hb.cell - 1, hb.y, 1, hb.h);
    /* 快捷键编号 */
    drawText(g, String(i + 1), x + 3, hb.y + 3, 1, on ? CONFIG.COLORS.hudAccent : '#63758f');
    if(s){
      const d = itemDef(s.id);
      const drew = typeof drawItemIconTo === 'function' && drawItemIconTo(g, s.id, x + (hb.cell - 32) / 2, hb.y + 6, 32);
      if(!drew){
        g.textBaseline = 'middle'; g.textAlign = 'center';
        g.font = '24px ' + FONT_EMOJI;
        g.fillText(d ? d.icon : '', x + hb.cell/2, hb.y + hb.h/2 - 1);
        g.textBaseline = 'top'; g.textAlign = 'left';
      }
      if(d && d.id === 'can'){                    /* 水壶显示余量 */
        g.font = '11px ' + FONT_EMOJI;
        g.fillStyle = canWater > 0 ? CONFIG.COLORS.hudText : '#ff8a7a';
        g.fillText(canWater + '/' + canCapacity(), x + 3, hb.y + hb.h - 14);
      }else if(s.n > 1){                          /* 数量 */
        drawText(g, String(s.n), x + hb.cell - 6 - String(s.n).length*(GLYPH_W+1)*2, hb.y + hb.h - 13, 2, CONFIG.COLORS.hudAccent);
      }
    }
  }
  /* 快捷栏上方：当前选中物品 */
  const selItem = selectedItem();
  if(selItem){
    let cap = selItem.name;
    if(selItem.kind === 'seed'){ const cd = cropDef(selItem.crop); cap += '（' + cd.season + '季 · ' + cd.days + '天）'; }
    g.font = '13px ' + FONT_CJK; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = CONFIG.COLORS.hudText;
    g.fillText(cap, VIEW_W/2, hb.y - 22);
    g.textAlign = 'left';
  }

  /* ===== 交互按键提示（可在 Esc 菜单关闭；关闭后整块不绘制） ===== */
  if(interactHintsOn){
  /* 走到小屋附近 → 提示按 E 睡觉 */
  if(!shopOpen && sleepFx.phase === 'none' && nearHouse()){
    const hx = HOUSE_POS.x*TILE - cam.x, hy = HOUSE_POS.y*TILE - cam.y;
    const hint = '按 E 睡觉';
    g.font = '13px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    const px2 = hx + HOUSE_POS.w*TILE/2 - hw/2, py2 = hy + HOUSE_POS.h*TILE + 6;
    g.fillStyle = 'rgba(8,10,16,0.80)'; g.fillRect(px2 - 6, py2 - 3, hw + 12, 20);
    g.strokeStyle = CONFIG.COLORS.hudBorder;
    g.strokeRect(px2 - 6, py2 - 3, hw + 12, 20);
    g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
    g.fillText(hint, px2, py2);
  }
  /* 走到柜台附近 → 提示按 E 交易（第 24 轮：商店在镇上的杂货店里） */
  if(!shopOpen && nearShop()){
    const hint = '按 E 交易';
    g.font = '13px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    const hx = player.x - cam.x - hw/2, hy = player.y - cam.y - 44;
    g.fillStyle = 'rgba(8,10,16,0.80)'; g.fillRect(hx - 6, hy - 3, hw + 12, 20);
    g.strokeStyle = CONFIG.COLORS.hudBorder;
    g.strokeRect(hx - 6, hy - 3, hw + 12, 20);
    g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
    g.fillText(hint, hx, hy);
  }
  /* 走到委托板附近 → 提示按 E 看委托（第 16 轮） */
  if(!shopOpen && questBoardNear()){
    const bx = QUEST_BOARD.x*TILE - cam.x, by = QUEST_BOARD.y*TILE - cam.y;
    const hint = '按 E 看委托';
    g.font = '13px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    const hx = bx + QUEST_BOARD.w*TILE/2 - hw/2, hy = by + QUEST_BOARD.h*TILE + 6;
    g.fillStyle = 'rgba(8,10,16,0.80)'; g.fillRect(hx - 6, hy - 3, hw + 12, 20);
    g.strokeStyle = CONFIG.COLORS.hudBorder;
    g.strokeRect(hx - 6, hy - 3, hw + 12, 20);
    g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
    g.fillText(hint, hx, hy);
  }
  /* 走到居民身边 → 提示按 E 交谈（对话打开时不再提示） */
  const nn = npcNear();
  if(nn && !npcOpen && !shopOpen){
    const np = npcPos(nn);
    const hint = '按 E 和 ' + nn.name + ' 说话';
    g.font = '13px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    const hx = np.x - cam.x - hw/2, hy = np.y - cam.y - 40;
    g.fillStyle = 'rgba(8,10,16,0.80)'; g.fillRect(hx - 6, hy - 3, hw + 12, 20);
    g.strokeStyle = CONFIG.COLORS.hudBorder;
    g.strokeRect(hx - 6, hy - 3, hw + 12, 20);
    g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
    g.fillText(hint, hx, hy);
  }

  /* 走到动物旁边 → 提示按 E 互动（第 15 轮） */
  const na = (!nn && !shopOpen && !npcOpen && !animalOpen && !chestOpen && !fishingActive() && !questBoardNear())
    ? animalNear() : null;
  if(na){
    const nt = animalType(na.type);
    const hint = '按 E 和' + (nt ? nt.name : '动物') + '互动';
    g.font = '13px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    const hx = na.x - cam.x - hw/2, hy = na.y - cam.y - 34;
    g.fillStyle = 'rgba(8,10,16,0.80)'; g.fillRect(hx - 6, hy - 3, hw + 12, 20);
    g.strokeStyle = CONFIG.COLORS.hudBorder;
    g.strokeRect(hx - 6, hy - 3, hw + 12, 20);
    g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
    g.fillText(hint, hx, hy);
  }

  /* 脚边有采集物 → 提示按 E 采走（有人 / 动物在场时让位给它们的提示） */
  const gg = (!nn && !na && !shopOpen && !npcOpen && !animalOpen && !fishingActive()) ? gatherNear() : null;
  if(gg){
    const gx = gg.tx*TILE - cam.x + TILE/2, gy = gg.ty*TILE - cam.y - 12;
    const hint = '按 E 采集' + (gg.def ? gg.def.name : '');
    g.font = '13px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    const hx = gx - hw/2, hy = gy;
    g.fillStyle = 'rgba(8,10,16,0.80)'; g.fillRect(hx - 6, hy - 3, hw + 12, 20);
    g.strokeStyle = CONFIG.COLORS.hudBorder;
    g.strokeRect(hx - 6, hy - 3, hw + 12, 20);
    g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
    g.fillText(hint, hx, hy);
  }

  /* 走到加工台旁边 → 提示按 E 加工（第 19 轮） */
  const mkHint = (!makerOpen && !shopOpen && !npcOpen && !animalOpen && !chestOpen) ? makerNear() : null;
  if(mkHint){
    const mx = mkHint.tx*TILE - cam.x + TILE/2, my = mkHint.ty*TILE - cam.y - 16;
    const hint = mkHint.job ? '按 E 看加工进度' : (mkHint.out && mkHint.out.length ? '按 E 取成品' : '按 E 加工');
    g.font = '13px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    const hx = mx - hw/2;
    g.fillStyle = 'rgba(8,10,16,0.80)'; g.fillRect(hx - 6, my - 3, hw + 12, 20);
    g.strokeStyle = CONFIG.COLORS.hudBorder;
    g.strokeRect(hx - 6, my - 3, hw + 12, 20);
    g.fillStyle = CONFIG.COLORS.hudAccent; g.textAlign = 'left';
    g.fillText(hint, hx, my);
  }
  }   /* ← interactHintsOn 结束 */

  /* 左下角：体力条（低于 20 变红闪烁） */
  const sbW = 116, sbH = 11, sbX = 14, sbY = VIEW_H - 26;
  const low = stamina < CONFIG.STAMINA.LOW;
  const blink = low ? (0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 130))) : 1;
  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(sbX - 6, sbY - 19, sbW + 62, sbH + 25);
  g.fillStyle = CONFIG.COLORS.hudBorder;
  g.fillRect(sbX - 6, sbY - 19, sbW + 62, 1); g.fillRect(sbX - 6, sbY + sbH + 5, sbW + 62, 1);
  g.fillRect(sbX - 6, sbY - 19, 1, sbH + 25); g.fillRect(sbX + sbW + 55, sbY - 19, 1, sbH + 25);
  g.font = '13px ' + FONT_CJK; g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillStyle = low ? 'rgba(255,120,100,' + blink.toFixed(2) + ')' : CONFIG.COLORS.hudText;
  g.fillText('体力', sbX, sbY - 16);
  g.fillStyle = 'rgba(8,11,18,0.90)'; g.fillRect(sbX, sbY, sbW, sbH);
  const ratio = staminaMax > 0 ? clamp(stamina / staminaMax, 0, 1) : 0;
  g.fillStyle = low ? 'rgba(255,86,70,' + blink.toFixed(2) + ')' : '#7ee08a';
  g.fillRect(sbX, sbY, Math.round(sbW * ratio), sbH);
  g.fillStyle = CONFIG.COLORS.hudBorder;
  g.fillRect(sbX, sbY, sbW, 1); g.fillRect(sbX, sbY + sbH - 1, sbW, 1);
  g.fillRect(sbX, sbY, 1, sbH); g.fillRect(sbX + sbW - 1, sbY, 1, sbH);
  g.fillStyle = low ? 'rgba(255,120,100,' + blink.toFixed(2) + ')' : CONFIG.COLORS.hudText;
  g.fillText(Math.ceil(stamina) + '/' + staminaMax, sbX + sbW + 6, sbY - 1);

  /* 第 28 轮：状态效果图标行（体力条上方；昏睡后遗症 / 今日还能吃几份） */
  {
    const chips = [];
    if(staminaMax < CONFIG.STAMINA.MAX)
      chips.push({ic:'😵', tx:'体力上限-' + Math.round((1 - staminaMax / CONFIG.STAMINA.MAX) * 100) + '%'});
    const eatsUsed = makerEatsToday();
    if(eatsUsed > 0)
      chips.push({ic:'🍱', tx:'今日还可吃 ' + (CONFIG.RECIPE.EAT_PER_DAY - eatsUsed) + ' 份'});
    let cx = sbX - 6;
    const cy = sbY - 19 - 20;
    for(const c of chips){
      g.font = '13px ' + FONT_CJK;
      const tw = g.measureText(c.tx).width;
      const w = 24 + tw + 10;
      g.fillStyle = 'rgba(8,10,16,0.80)';
      g.fillRect(cx, cy, w, 18);
      g.strokeStyle = CONFIG.COLORS.hudBorder;
      g.strokeRect(cx + 0.5, cy + 0.5, w - 1, 17);
      g.font = '14px ' + FONT_EMOJI; g.fillStyle = CONFIG.COLORS.hudAccent;
      g.fillText(c.ic, cx + 5, cy + 1);
      g.font = '13px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudText;
      g.fillText(c.tx, cx + 24, cy + 2);
      cx += w + 6;
    }
  }

  /* 体力耗尽：顶部提示该回家了 */
  if(stamina <= 0){
    const a = 0.55 + 0.45 * Math.sin(performance.now() / 220);
    const hint = '体力耗尽 · 回小屋按 E 睡觉';
    g.font = '14px ' + FONT_CJK;
    const hw = g.measureText(hint).width;
    g.fillStyle = 'rgba(8,10,16,0.75)';
    g.fillRect(VIEW_W/2 - hw/2 - 8, 12, hw + 16, 24);
    g.strokeStyle = 'rgba(255,110,90,0.8)';
    g.strokeRect(VIEW_W/2 - hw/2 - 8, 12, hw + 16, 24);
    g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(255,130,110,' + clamp(a, 0.25, 1).toFixed(2) + ')';
    g.fillText(hint, VIEW_W/2, 16);
    g.textAlign = 'left';
  }

  /* 第 23 轮：悬停作物 → 显示生长进度（萝卜 · 还需 2 天（已浇水）） */
  drawCropTip(g);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { shopEl, shopMask, shopTabs, shopBody, shopGold, shopSeason, FONT, GLYPH_W, GLYPH_H, FONT_EMOJI, FONT_CJK, pulseShopGold, shopRow, priceHtml, renderShopBuy, renderShopSell, renderShop, shopBuyClick, toggleShop, drawText, drawUI });
export { shopEl, shopMask, shopTabs, shopBody, shopGold, shopSeason, FONT, GLYPH_W, GLYPH_H, FONT_EMOJI, FONT_CJK, pulseShopGold, shopRow, priceHtml, renderShopBuy, renderShopSell, renderShop, shopBuyClick, toggleShop, drawText, drawUI };
