/* js/ui/panels.js —— 由 index.html 拆分，原行 5642–6090 */
'use strict';

/* === 6.UI === */
/* --- 面板开合动画：开 = 200ms 缩放淡入；关 = 先播淡出，动画结束才真正隐藏 --- */
const panelTimers = new Map();       /* 面板 id → 关闭动画定时器 */
function setPanelOpen(el, open){
  if(!el || !el.classList) return;
  const key = el.id || el;
  if(panelTimers.has(key)){ clearTimeout(panelTimers.get(key)); panelTimers.delete(key); }
  if(open){
    el.classList.remove('closing');
    el.classList.add('open');
  }else{
    /* 已经在关闭动画中就别重复触发 */
    if(el.classList.contains('closing')) return;
    el.classList.add('closing');
    panelTimers.set(key, setTimeout(()=>{
      el.classList.remove('closing');
      el.classList.remove('open');
      panelTimers.delete(key);
    }, CONFIG.UI.PANEL_ANIM_MS));
  }
}
/* --- 背包面板（DOM 覆盖层；打开时游戏时间冻结） --- */
const packEl   = document.getElementById('pack');
const packMask = document.getElementById('packMask');
const packGrid = document.getElementById('packGrid');
const packTip  = document.getElementById('packTip');
const packHeld = document.getElementById('packHeld');
const packInfo = document.getElementById('packInfo');
const packFoot = document.getElementById('packFoot');
const packTabs = document.getElementById('packTabs');
const dexGrid  = document.getElementById('dexGrid');
/* 第 23 轮：背包「整理」按钮 */
const packSortBtn = document.getElementById('packSort');
if(packSortBtn && packSortBtn.addEventListener){
  packSortBtn.addEventListener('click', ()=>{ sortInventory(); toast('背包整理好了'); });
}
window.packOpen = false;          /* 背包是否打开（打开时 update() 整体冻结 → 时间停住） */
window.held = null;               /* 手上拿着的物品：{id, n, from}（from = 拿起时的格号） */
window.packTab = 'bag';           /* 背包页签：bag 背包 / dex 图鉴（第 14 轮） */

/* 建 24 个格子（前 8 格 = 快捷栏，标 1~8） */
function buildPackGrid(){
  if(!packGrid || !packGrid.appendChild) return;
  packGrid.innerHTML = '';
  for(let i=0;i<CONFIG.INVENTORY.SLOTS;i++){
    const cell = document.createElement('div');
    cell.className = 'cell' + (i < CONFIG.INVENTORY.HOTBAR ? ' hot' : '');
    cell.slotIndex = i;
    cell.innerHTML = '<span class="k">' + (i < CONFIG.INVENTORY.HOTBAR ? (i+1) : '') + '</span>' +
                     '<span class="ic"></span><span class="n"></span>';
    cell.addEventListener('mousedown', e=>{ e.preventDefault(); packClick(i); });
    cell.addEventListener('mouseenter', e=>{ showPackTip(i, e); });
    cell.addEventListener('mousemove', e=>{ movePackTip(e); });
    cell.addEventListener('mouseleave', ()=>{ hidePackTip(); });
    packGrid.appendChild(cell);
  }
  /* 第 14 轮：背包 / 图鉴页签 */
  if(packTabs && packTabs.children){
    for(let i=0;i<packTabs.children.length;i++){
      const b = packTabs.children[i];
      if(b && b.addEventListener) b.addEventListener('click', ()=>setPackTab(b.getAttribute('data-ptab')));
    }
  }
}
/* 页签外观（背包 / 图鉴） */
function applyPackTabView(){
  if(packEl) packEl.classList.toggle('dex', packTab === 'dex');
  if(packTabs && packTabs.children){
    for(let i=0;i<packTabs.children.length;i++){
      const b = packTabs.children[i];
      if(b && b.classList) b.classList.toggle('on', b.getAttribute('data-ptab') === packTab);
    }
  }
}
function setPackTab(tab){
  packTab = (tab === 'dex') ? 'dex' : 'bag';
  if(packTab === 'dex' && packMode === 'gift') packTab = 'bag';   /* 送礼时必须看背包 */
  applyPackTabView();
  refreshPackGrid();
}
/* 建图鉴格子（8 种鱼 + 3 种采集物） */
function buildDexGrid(){
  if(!dexGrid || !dexGrid.appendChild) return;
  dexGrid.innerHTML = '';
  const entries = dexAllEntries();
  for(const e of entries){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = '<span class="ic"></span><span class="dn"></span>';
    cell.title = e.name;
    dexGrid.appendChild(cell);
  }
  refreshDexGrid();
}
/* 把图鉴解锁状态刷到格子上（未获得 = 剪影 + ？？？） */
/* 第 21 轮：图鉴懒渲染 —— 只有背包打开且停在图鉴页时才重建 8 个格子 */
function refreshDexIfVisible(){
  if(packOpen && packTab === 'dex'){ refreshDexGrid(); return true; }
  return false;
}
function refreshDexGrid(){
  if(!dexGrid || !dexGrid.children) return;
  const entries = dexAllEntries();
  for(let i=0;i<entries.length;i++){
    const c = dexGrid.children[i];
    if(!c || typeof c.querySelector !== 'function') continue;
    const e = entries[i], got = dexHas(e.kind, e.idx);
    if(c.classList){
      c.classList.toggle('got', got);
      c.classList.toggle('unknown', !got);
    }
    const ic = c.querySelector('.ic'), dn = c.querySelector('.dn');
    if(ic) ic.textContent = e.icon;
    if(dn) dn.textContent = got ? e.name : '？？？';
    c.title = got ? e.name : '未发现';
  }
}
/* --- 第 23 轮：背包一键整理（按物品 id 排序 + 合并堆叠） --- */
function sortInventory(){
  const S = CONFIG.SORT;
  const n = CONFIG.INVENTORY.SLOTS;
  const hot = S.KEEP_HOTBAR ? CONFIG.INVENTORY.HOTBAR : 0;
  if(S.MERGE){
    /* 同 id 的堆叠并进最靠前的那一格（工具这类不可堆叠的不动） */
    const first = {};
    for(let i=0;i<n;i++){
      const s = inv[i];
      if(!s) continue;
      const lim = stackLimit(s.id);
      if(lim <= 1) continue;
      if(first[s.id] === undefined){ first[s.id] = i; continue; }
      const dst = inv[first[s.id]];
      const take = Math.min(lim - dst.n, s.n);
      if(take <= 0) continue;
      dst.n += take;
      s.n -= take;
      if(s.n <= 0) inv[i] = null;
    }
  }
  /* 收集要排序的格子（快捷栏保持原位时只收背包区） */
  const list = [];
  for(let i=hot;i<n;i++) if(inv[i]) list.push(inv[i]);
  list.sort((a,b)=> a.id < b.id ? -1 : (a.id > b.id ? 1 : 0));
  for(let i=hot;i<n;i++) inv[i] = list[i - hot] || null;
  refreshPackGrid();
  return true;
}
/* 把背包状态刷到格子上 */
function refreshPackGrid(){
  /* 图鉴页签：只刷图鉴，不碰背包格子 */
  if(packTab === 'dex' && packMode !== 'gift'){
    if(packInfo) packInfo.textContent = '已收集 ' + dexCollected() + '/' + dexTotal() + '　（鱼 + 采集物）';
    if(packFoot) packFoot.textContent = '点亮 = 已钓到 / 已采集 · 剪影 = 还没见过 · Esc 关闭';
    refreshDexGrid();
    return;
  }
  if(packInfo){
    if(packMode === 'gift'){
      const gd = npcDef(giftTarget);
      packInfo.textContent = '给' + (gd ? gd.name : '对方') + '挑一件礼物（点一下就送出去）';
    }else{
      packInfo.textContent = '已用 ' + invUsed() + '/' + CONFIG.INVENTORY.SLOTS + ' 格　💰 ' + gold;
    }
  }
  if(packFoot){
    packFoot.textContent = (packMode === 'gift')
      ? '点一格 = 把这件东西送出去 · Esc 取消（今天只能送一次）'
      : '点击拾起 · 再点放下（两格之间可交换）· 拖到面板外自动放回 · 「整理」按 id 排序并合并堆叠 · Esc 关闭';
  }
  if(!packGrid || !packGrid.children) return;
  const cells = packGrid.children;
  for(let i=0;i<cells.length;i++){
    const c = cells[i];
    if(!c || typeof c.querySelector !== 'function') continue;
    const s = inv[i], d = s ? itemDef(s.id) : null;
    const ic = c.querySelector('.ic'), n = c.querySelector('.n');
    if(ic) ic.textContent = d ? d.icon : '';
    if(n)  n.textContent  = (s && s.n > 1) ? String(s.n) : '';
  }
}
/* 把一件东西塞进背包：先并进同 id 的堆，再找空位；放不下返回 false（不吞） */
function storeItem(entry){
  const d = itemDef(entry.id);
  if(!d) return false;
  const lim = stackLimit(entry.id);
  let left = entry.n;
  if(d.stack){
    for(let i=0;i<inv.length && left>0;i++){
      const s = inv[i];
      if(s && s.id === entry.id && s.n < lim){
        const take = Math.min(lim - s.n, left);
        s.n += take; left -= take;
      }
    }
  }
  for(let i=0;i<inv.length && left>0;i++){
    if(inv[i]) continue;
    const take = d.stack ? Math.min(lim, left) : 1;
    inv[i] = {id:entry.id, n:take};
    left -= take;
  }
  return left <= 0;
}
/* 点格子：空手 → 拾起；手里有东西 → 放下（目标格有东西就交换） */
function packClick(i){
  if(packMode === 'gift'){ npcGiftPick(i); return; }   /* 送礼模式：点一下 = 送出去 */
  const s = inv[i];
  if(held){
    const back = s ? {id:s.id, n:s.n} : null;   /* 目标格原来那件，先存着 */
    const from = held.from;
    inv[i] = {id:held.id, n:held.n};             /* 手里的东西落到目标格 */
    held = null;
    if(back){
      if(from !== i && !inv[from]){
        inv[from] = back;                       /* 交换：原格放回原来那件 */
      }else if(!storeItem(back)){
        held = {id:back.id, n:back.n, from:i};  /* 实在没地方放 → 拿回手里，绝不丢 */
      }
    }
  }else{
    if(!s) return;
    held = {id:s.id, n:s.n, from:i};
    inv[i] = null;
  }
  refreshPackGrid();
  updatePackHeld();
}
/* 面板外松手 / 关面板：手里的东西放回背包（绝不凭空消失） */
function packDropHeld(){
  if(!held) return;
  if(!inv[held.from]){
    inv[held.from] = {id:held.id, n:held.n};   /* 放回拿起时的原格 */
    held = null;
  }else if(storeItem({id:held.id, n:held.n})){
    held = null;                               /* 原格被占 → 并到别的堆/空位 */
  }
  /* 实在没地方放 → 继续拿在手里（不丢） */
  refreshPackGrid();
  updatePackHeld();
}
/* 物品名提示（第 28 轮：多行 —— 名称 / 类别·价格·趋势 / 用途） */
function showPackTip(i, e){
  const s = inv[i];
  const d = s ? itemDef(s.id) : null;
  if(!d){ hidePackTip(); return; }
  const lines = [];
  lines.push(d.name + ' ×' + s.n);
  const kindName = {seed:'种子', crop:'作物', material:'材料', tool:'工具', currency:'货币',
                    fish:'鱼获', gather:'采集', animal:'畜产', food:'加工食品'}[d.kind] || d.kind;
  if(isSellable(d.id)){
    lines.push(kindName + ' · 售价 ' + priceOf(d.id) + ' 💰 ' + priceTrend(d.id));
  }else if(d.kind === 'seed'){
    const cd = cropDef(d.crop);
    lines.push('种子 · ' + cropSeasons(cd).join('、') + '季 · ' + cd.days + '天');
  }else if(d.kind === 'tool'){
    lines.push('工具 · 左键使用');
  }else if(d.kind === 'currency'){
    lines.push('货币 · 通用金币');
  }else{
    lines.push(kindName);
  }
  /* 第三行：用途 / 怎么用 */
  if(d.kind === 'seed') lines.push('锄地后左键播种 · 每天浇水才长');
  else if(d.kind === 'food') lines.push('手持后在世界里右键吃 · 体力 +' + CONFIG.RECIPE.EAT_STAMINA +
    ' · 今日还可吃 ' + Math.max(0, CONFIG.RECIPE.EAT_PER_DAY - makerEatsToday()) + ' 份');
  else if(d.kind === 'tool') lines.push('拿在手上，对着目标按左键');
  else if(isSellable(d.id)) lines.push('去杂货店卖给老板娘');
  if(packTip){
    packTip.textContent = lines.join('\n');
    packTip.style.display = 'block';
    movePackTip(e);
  }
}
function movePackTip(e){
  if(!packTip || !packTip.style || packTip.style.display === 'none') return;
  packTip.style.left = (e.clientX + 14) + 'px';
  packTip.style.top  = (e.clientY + 16) + 'px';
}
function hidePackTip(){ if(packTip) packTip.style.display = 'none'; }
/* 手上的物品跟随鼠标 */
function updatePackHeld(){
  if(!packHeld) return;
  if(!held){ packHeld.style.display = 'none'; packHeld.textContent = ''; return; }
  const d = itemDef(held.id);
  packHeld.textContent = d ? d.icon + (held.n > 1 ? '×' + held.n : '') : '';
  packHeld.style.display = 'block';
}
/* 开关背包 */
function togglePack(open){
  const want = (open === undefined) ? !packOpen : !!open;
  if(want === packOpen) return;
  packOpen = want;
  if(packMode === 'gift' && !packOpen){          /* 退出送礼模式 → 恢复正常背包 */
    packMode = 'normal'; giftTarget = null;
  }
  if(!packOpen){
    if(packEl) packEl.classList.remove('gift');
    if(packFoot) packFoot.textContent = '点击拾起 · 再点放下（两格之间可交换）· 拖到面板外自动放回 · Esc 关闭';
  }
  if(packOpen){
    if(shopOpen) toggleShop(false);            /* 背包与商店互斥 */
    if(packMode === 'gift') packTab = 'bag';   /* 送礼时必须看背包 */
    applyPackTabView();
    refreshPackGrid();
    setPanelOpen(packEl, true);
  }else{
    setPanelOpen(packEl, false);
    packDropHeld();                 /* 关面板时手上的东西放回背包 */
    hidePackTip();
  }
}
if(packMask) packMask.addEventListener('mousedown', e=>{ e.preventDefault(); packDropHeld(); });
document.addEventListener('mousemove', e=>{
  if(!held || !packHeld) return;
  packHeld.style.left = e.clientX + 'px';
  packHeld.style.top  = e.clientY + 'px';
});

/* --- 木箱面板（复用背包格子样式；打开时游戏时间冻结） --- */
const chestEl   = document.getElementById('chest');
const chestMask = document.getElementById('chestMask');
const chestGrid = document.getElementById('chestGrid');
const chestInv  = document.getElementById('chestInv');
const chestInfo = document.getElementById('chestInfo');
const chestTitle= document.getElementById('chestTitle');   /* 第 20 轮：木箱 / 自动采集箱共用 */
window.chestOpen = false;          /* 木箱面板是否打开 */
window.openChest = null;           /* 当前打开的木箱（buildings 里的那一条） */
/* 造木箱格子 + 背包格子 */
function buildChestGrid(){
  if(chestGrid && chestGrid.appendChild){
    chestGrid.innerHTML = '';
    const n = Math.max(CONFIG.BUILD.CHEST_SLOTS, CONFIG.ENDGAME.AUTOBOX.SLOTS);   /* 第 20 轮 */
    for(let i=0; i<n; i++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.innerHTML = '<span class="k"></span><span class="ic"></span><span class="n"></span>';
      cell.addEventListener('mousedown', e=>{ e.preventDefault(); chestClick(i); });
      chestGrid.appendChild(cell);
    }
  }
  if(chestInv && chestInv.appendChild){
    chestInv.innerHTML = '';
    for(let i=0; i<CONFIG.INVENTORY.SLOTS; i++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.innerHTML = '<span class="k"></span><span class="ic"></span><span class="n"></span>';
      cell.addEventListener('mousedown', e=>{ e.preventDefault(); chestInvClick(i); });
      chestInv.appendChild(cell);
    }
  }
}
/* 把木箱和背包的内容刷到格子上 */
function refreshChestGrid(){
  const isBox = !!(openChest && openChest.type === 'autobox');
  if(chestTitle) chestTitle.textContent = isBox ? '自动采集箱' : '木箱';   /* 第 20 轮 */
  const cap = (openChest && openChest.slots) ? openChest.slots.length : CONFIG.BUILD.CHEST_SLOTS;
  if(chestInfo) chestInfo.textContent = openChest
    ? ('已用 ' + chestUsed() + '/' + cap + ' 格' + (isBox ? ' · 每天早上自动收货' : ''))
    : '';
  const fill = (grid, arr) => {
    if(!grid || !grid.children) return;
    const cells = grid.children;
    for(let i=0; i<cells.length; i++){
      const c = cells[i];
      if(!c || typeof c.querySelector !== 'function') continue;
      const s = arr ? arr[i] : null;
      const d = s ? itemDef(s.id) : null;
      const ic = c.querySelector('.ic'), n = c.querySelector('.n');
      if(ic) ic.textContent = d ? d.icon : '';
      if(n)  n.textContent  = (s && s.n > 1) ? String(s.n) : '';
    }
  };
  fill(chestGrid, openChest ? openChest.slots : null);
  fill(chestInv, inv);
}
function chestUsed(){
  if(!openChest || !openChest.slots) return 0;
  return openChest.slots.filter(s => s).length;
}
/* 附近最近的那个木箱 / 自动采集箱（第 20 轮：采集箱复用同一套面板） */
function chestNear(){
  let best = null, bd = Infinity;
  for(const b of buildings){
    if(b.type !== 'chest' && b.type !== 'autobox') continue;
    const d = tileCenterDist(b.tx, b.ty);
    if(d < bd){ bd = d; best = b; }
  }
  if(best && bd <= CONFIG.INTERACT.RANGE_TILES) return best;
  return null;
}
/* 开关木箱面板 */
function toggleChest(open){
  const want = (open === undefined) ? !chestOpen : !!open;
  if(want === chestOpen) return;
  if(want && openChest && openChest.preset){     /* 第 25 轮：镇上的箱子走 openNpcChest */
    toast('这是镇上的箱子');
    return;
  }
  chestOpen = want;
  if(chestOpen){
    if(packOpen) togglePack(false);
    if(shopOpen) toggleShop(false);
    refreshChestGrid();
    setPanelOpen(chestEl, true);
  }else{
    openChest = null;
    setPanelOpen(chestEl, false);
  }
}
/* 点木箱格：把这堆东西取回背包（背包放不下就放不进去，东西不会消失） */
function chestClick(i){
  if(!openChest || !openChest.slots) return;
  const s = openChest.slots[i];
  if(!s) return;
  if(!canFit(s.id, s.n)){ toast('背包放不下' + itemDef(s.id).name); return; }
  addItem(s.id, s.n);
  openChest.slots[i] = null;
  refreshChestGrid();
  updateStats();
}
/* 点背包格：把这堆东西存进木箱（木箱满了就只存一部分，剩下的留在背包，东西不会消失） */
function chestInvClick(i){
  if(!openChest || !openChest.slots) return;
  const s = inv[i];
  if(!s) return;
  const d = itemDef(s.id);
  const lim = stackLimit(s.id);
  let left = s.n;
  /* 先并进已有的同类堆 */
  for(let k=0; k<openChest.slots.length && left>0; k++){
    const c = openChest.slots[k];
    if(c && c.id === s.id && c.n < lim){
      const take = Math.min(lim - c.n, left);
      c.n += take; left -= take;
    }
  }
  /* 再放进空格 */
  for(let k=0; k<openChest.slots.length && left>0; k++){
    if(openChest.slots[k]) continue;
    const take = d && d.stack ? Math.min(lim, left) : 1;
    openChest.slots[k] = {id:s.id, n:take};
    left -= take;
  }
  if(left <= 0) inv[i] = null;         /* 全部存进去了 */
  else s.n = left;                      /* 木箱装不下，剩下的留在背包 */
  refreshChestGrid();
  updateStats();
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { panelTimers, packEl, packMask, packGrid, packTip, packHeld, packInfo, packFoot, packTabs, dexGrid, packSortBtn, chestEl, chestMask, chestGrid, chestInv, chestInfo, chestTitle, setPanelOpen, buildPackGrid, applyPackTabView, setPackTab, buildDexGrid, refreshDexIfVisible, refreshDexGrid, sortInventory, refreshPackGrid, storeItem, packClick, packDropHeld, showPackTip, movePackTip, hidePackTip, updatePackHeld, togglePack, buildChestGrid, refreshChestGrid, chestUsed, chestNear, toggleChest, chestClick, chestInvClick });
export { panelTimers, packEl, packMask, packGrid, packTip, packHeld, packInfo, packFoot, packTabs, dexGrid, packSortBtn, chestEl, chestMask, chestGrid, chestInv, chestInfo, chestTitle, setPanelOpen, buildPackGrid, applyPackTabView, setPackTab, buildDexGrid, refreshDexIfVisible, refreshDexGrid, sortInventory, refreshPackGrid, storeItem, packClick, packDropHeld, showPackTip, movePackTip, hidePackTip, updatePackHeld, togglePack, buildChestGrid, refreshChestGrid, chestUsed, chestNear, toggleChest, chestClick, chestInvClick };
