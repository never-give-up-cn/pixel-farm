/* js/systems/maker.js —— 由 index.html 拆分，原行 11086–11447 */
'use strict';

/* === 21.加工台（第 19 轮） ===
 * 建造配方 maker（木 10 + 石 5）→ 走近按 E 打开面板 → 选配方投入原料
 * → 加工按游戏时间推进（睡觉跨夜也推进）→ 成品进加工台产出槽 → 点「取走」回背包。
 * 每台加工台各自独立（job / out 挂在自己的 building 上），可以同时开工互不影响。 */
const makerEl      = document.getElementById('maker');
const makerMaskEl  = document.getElementById('makerMask');
const makerStatusEl= document.getElementById('makerStatus');
const makerOutEl   = document.getElementById('makerOut');
const makerListEl  = document.getElementById('makerList');
const makerTitleEl = document.getElementById('makerTitle');
const makerIconEl  = document.getElementById('makerIcon');
window.makerOpen = false;            /* 面板是否打开（打开时 update() 整体冻结） */
window.openMaker = null;             /* 当前打开的加工台（buildings 里的那一条） */
const makerEat = {day:-1, n:0};   /* 成品食用：哪一天 + 今天吃了几次 */

function recipeDef(id){
  if(typeof id === 'number') return CONFIG.RECIPE.LIST[id] || null;
  if(typeof id === 'string') return CONFIG.RECIPE.LIST.find(r => r.id === id) || null;
  return null;
}
function recipeInputText(r){
  const parts = [];
  for(const id in r.inputs) parts.push(itemDef(id).name + '×' + r.inputs[id]);
  return parts.join(' + ');
}
function recipeOutText(r){
  const d = itemDef(r.out.id);
  return (d ? d.name : r.out.id) + '×' + r.out.n;
}
/* 利润率：(成品基础价 × 数量 − 原料基础价总和) / 原料基础价总和 */
function recipeProfit(r){
  let cost = 0;
  for(const id in r.inputs) cost += basePrice(id) * r.inputs[id];
  const out = basePrice(r.out.id) * r.out.n;
  return cost > 0 ? (out - cost) / cost : 0;
}
function recipeProfitText(r){ return Math.round(recipeProfit(r) * 100) + '%'; }
/* 解锁条件：null = 已解锁；好感 / 成就两类 */
function recipeUnlockInfo(r){
  if(!r || !r.unlock) return {ok:true, text:''};
  const u = r.unlock;
  if(u.type === 'aff'){
    const d = npcDef(u.npc);
    const aff = npcAff(u.npc);
    return {ok: aff >= u.min, text:(d ? d.name : u.npc) + ' 好感 ' + u.min + '（当前 ' + aff + '）'};
  }
  if(u.type === 'ach'){
    const i = CONFIG.ACHIEVEMENT.LIST.findIndex(a => a.id === u.id);
    const a = CONFIG.ACHIEVEMENT.LIST[i];
    return {ok: achHasUnlocked(i), text:'成就「' + (a ? a.name : u.id) + '」'};
  }
  return {ok:true, text:''};
}
function recipeUnlocked(r){ return recipeUnlockInfo(r).ok; }
/* 缺哪些原料 */
function recipeMissing(r){
  const out = [];
  for(const id in r.inputs){
    const need = r.inputs[id], have = countItem(id);
    if(have < need) out.push({id:id, need:need, have:have, lack:need - have});
  }
  return out;
}
function recipeMissingText(r){
  return recipeMissing(r).map(m => '缺 ' + itemDef(m.id).name + '×' + m.lack).join('，');
}
/* 离玩家最近的加工台（在交互距离内） */
function makerNear(){
  let best = null, bd = Infinity;
  for(const b of buildings){
    if(b.type !== 'maker' && b.type !== 'stove') continue;
    const d = tileCenterDist(b.tx, b.ty);
    if(d < bd){ bd = d; best = b; }
  }
  return (best && bd <= CONFIG.RECIPE.RANGE) ? best : null;
}
/* 产出槽还能不能放下 n 个 id（同种先并堆，再占空格） */
function makerCanStore(b, id, n){
  if(!b) return false;
  if(!b.out) b.out = [];
  const lim = CONFIG.RECIPE.STACK_MAX;
  let room = 0;
  for(const s of b.out) if(s.id === id) room += Math.max(0, lim - s.n);   /* 同种先并堆 */
  const free = CONFIG.RECIPE.OUT_SLOTS - b.out.length;
  if(free > 0) room += free * lim;                                      /* 再用空槽 */
  return room >= n;
}
function makerStore(b, id, n){
  if(!b.out) b.out = [];
  const lim = CONFIG.RECIPE.STACK_MAX;
  for(const s of b.out){
    if(s.id !== id || s.n >= lim) continue;
    const take = Math.min(lim - s.n, n);
    s.n += take; n -= take;
    if(n <= 0) return true;
  }
  while(n > 0 && b.out.length < CONFIG.RECIPE.OUT_SLOTS){
    const take = Math.min(lim, n);
    b.out.push({id:id, n:take});
    n -= take;
  }
  return n <= 0;
}
/* 一台完成：把成品放进产出槽 */
function makerFinish(b, silent){
  const job = b.job;
  b.job = null;
  const r = recipeDef(job && job.rid);
  if(!r) return false;
  if(!makerStore(b, r.out.id, r.out.n)){
    /* 产出槽满：把活儿挂回原位（left=0），等玩家取走后再结算，不会凭空消失 */
    b.job = {rid:r.id, left:0, total:r.hours * 60};
    if(!silent) toast('加工台的产出槽满了，先取走成品');
    return false;
  }
  if(!silent){
    toast('加工完成：' + r.name + '（在加工台里，记得取走）');
    playSfx(1046, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  }
  return true;
}
/* 按游戏分钟推进所有加工台（sleep 跨夜时由 rollToNextMorning 调用） */
function makerAdvance(minutes, silent){
  const m = Math.max(0, Number(minutes) || 0);
  if(m <= 0) return 0;
  let done = 0;
  const list = (window.roomStove && buildings.indexOf(window.roomStove) < 0)
    ? buildings.concat([window.roomStove]) : buildings;
  for(const b of list){
    if((b.type !== 'maker' && b.type !== 'stove') || !b.job) continue;
    if(b.job.left <= 0){
      /* 上次因为产出槽满而挂起：腾出空位后静默完成，不重复弹提示 */
      if(makerFinish(b, true)) done++;
      continue;
    }
    b.job.left -= m;
    if(b.job.left <= 0 && makerFinish(b, silent)) done++;
  }
  if(done && makerOpen && openMaker) makerRenderPanel();
  return done;
}
/* 开始加工（rid = 配方 id） */
function makerStart(rid){
  const b = openMaker;
  if(!b || (b.type !== 'maker' && b.type !== 'stove')) return false;
  const r = recipeDef(rid);
  if(!r){ toast('没有这个配方'); return false; }
  if(b.job){ toast('这台加工台还在忙，先等它做完'); return false; }
  const u = recipeUnlockInfo(r);
  if(!u.ok){
    toast('还没解锁：需要 ' + u.text);
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  const miss = recipeMissing(r);
  if(miss.length){
    toast('材料不足（' + recipeMissingText(r) + '）');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  if(!makerCanStore(b, r.out.id, r.out.n)){
    toast('产出槽满了，先取走成品');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  for(const id in r.inputs) removeItem(id, r.inputs[id]);
  b.job = {rid:r.id, left:r.hours * 60, total:r.hours * 60};
  toast('开始加工：' + r.name + '（' + r.hours + ' 游戏小时）');
  playSfx(523, 'sine', 0.10, CONFIG.AUDIO.VOLUME);
  refreshPackGrid();
  updateStats();
  makerRenderPanel();
  return true;
}
/* 取走产出槽第 i 格 */
function makerTake(i){
  const b = openMaker;
  if(!b || !b.out) return false;
  const s = b.out[i];
  if(!s) return false;
  const d = itemDef(s.id);
  if(!canFit(s.id, s.n)){ toast('背包放不下' + (d ? d.name : s.id)); return false; }
  addItem(s.id, s.n);
  b.out.splice(i, 1);
  toast('取走 ' + (d ? d.name : s.id) + ' ×' + s.n);
  playSfx(660, 'square', 0.08, CONFIG.AUDIO.VOLUME);
  refreshPackGrid();
  updateStats();
  makerRenderPanel();
  return true;
}
function makerTakeAll(){
  const b = openMaker;
  if(!b || !b.out) return 0;
  let n = 0;
  for(let i = b.out.length - 1; i >= 0; i--){ if(makerTake(i)) n++; else break; }
  return n;
}
/* 加工台面板渲染 */
function makerFormatLeft(min){
  min = Math.max(0, Math.ceil(min || 0));
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? (h + ' 小时 ' + m + ' 分') : (m + ' 分钟');
}
function makerRenderPanel(){
  if(!openMaker) return;
  const b = openMaker;
  const isStove = b.type === 'stove';
  if(makerTitleEl) makerTitleEl.textContent = isStove ? '灶台' : '加工台';
  if(makerIconEl) makerIconEl.textContent = isStove ? '🍳' : '🛠️';
  if(makerStatusEl){
    if(b.job){
      const r = recipeDef(b.job.rid);
      makerStatusEl.textContent = '⏳ ' + (r ? r.name : '加工') + ' · 剩 ' + makerFormatLeft(b.job.left);
    }else if(b.out && b.out.length){
      makerStatusEl.textContent = '✅ 有 ' + b.out.length + ' 种成品待取';
    }else{
      makerStatusEl.textContent = '空闲';
    }
  }
  /* 产出区 */
  if(makerOutEl && makerOutEl.appendChild){
    makerOutEl.innerHTML = '';
    (b.out || []).forEach((s, i) => {
      const d = itemDef(s.id);
      const row = document.createElement('div');
      row.className = 'mout';
      const ic = document.createElement('div'); ic.className = 'mico';
      if(!(typeof paintItemIcon === 'function' && paintItemIcon(ic, s.id, 20))) ic.textContent = d ? d.icon : '❔';
      const info = document.createElement('div'); info.className = 'minfo';
      const nm = document.createElement('div'); nm.className = 'mname';
      nm.textContent = (d ? d.name : s.id) + ' ×' + s.n;
      const meta = document.createElement('div'); meta.className = 'mmeta';
      meta.textContent = '售价 ' + basePrice(s.id) + ' 金币/个';
      info.appendChild(nm); info.appendChild(meta);
      const btn = document.createElement('button');
      btn.className = 'mbtn'; btn.textContent = '取走';
      btn.addEventListener('click', ()=>makerTake(i));
      row.appendChild(ic); row.appendChild(info); row.appendChild(btn);
      makerOutEl.appendChild(row);
    });
  }
  /* 配方列表 */
  if(makerListEl && makerListEl.appendChild){
    makerListEl.innerHTML = '';
    const list = CONFIG.RECIPE.LIST.filter(r => isStove ? !!r.cook : !r.cook);
    for(const r of list){
      const u = recipeUnlockInfo(r);
      const miss = recipeMissing(r);
      const busy = !!b.job;
      const can = u.ok && !miss.length && !busy && makerCanStore(b, r.out.id, r.out.n);
      const row = document.createElement('div');
      row.className = 'mrow' + (u.ok ? '' : ' locked');
      const ic = document.createElement('div'); ic.className = 'mico';
      if(!(r.out && typeof paintItemIcon === 'function' && paintItemIcon(ic, r.out.id, 20))) ic.textContent = r.icon;
      const info = document.createElement('div'); info.className = 'minfo';
      const nm = document.createElement('div'); nm.className = 'mname'; nm.textContent = r.name;
      const meta = document.createElement('div'); meta.className = 'mmeta';
      let mt = recipeInputText(r) + ' → ' + recipeOutText(r) + ' · ' + r.hours + ' 小时 · 利润 +' + recipeProfitText(r);
      if(!u.ok) mt = '🔒 需要 ' + u.text;
      else if(miss.length) mt += '　' + recipeMissingText(r);
      meta.textContent = mt;
      info.appendChild(nm); info.appendChild(meta);
      const btn = document.createElement('button');
      btn.className = 'mbtn' + (can ? '' : ' off');
      btn.textContent = !u.ok ? '未解锁' : (busy ? (isStove ? '烹饪中' : '加工中')
        : (miss.length ? '材料不足' : (can ? '投入' : '产出槽满')));
      btn.addEventListener('click', ()=>{ if(can) makerStart(r.id); });
      row.appendChild(ic); row.appendChild(info); row.appendChild(btn);
      makerListEl.appendChild(row);
    }
  }
}
/* 开关面板 */
function makerOpenPanel(b){
  if(!b || (b.type !== 'maker' && b.type !== 'stove')) return false;
  if(packOpen) togglePack(false);
  if(shopOpen) toggleShop(false);
  if(chestOpen) toggleChest(false);
  openMaker = b;
  makerOpen = true;
  makerRenderPanel();
  setPanelOpen(makerEl, true);
  playSfx(520, 'square', 0.08, CONFIG.AUDIO.VOLUME);
  sysTipShow('maker');                       /* 第 21 轮：第一次打开加工台 → 教学提示 */
  return true;
}
function makerClosePanel(){
  if(!makerOpen) return;
  makerOpen = false;
  openMaker = null;
  setPanelOpen(makerEl, false);
}
function toggleMakerPanel(b){
  if(makerOpen) makerClosePanel();
  else makerOpenPanel(b || makerNear());
}
/* HUD 提醒：正在加工 / 有成品待取 */
function makerHudInfo(){
  let busy = 0, ready = 0;
  for(const b of buildings){
    if(b.type !== 'maker' && b.type !== 'stove') continue;
    if(b.job) busy++;
    if(b.out && b.out.length) ready++;
  }
  return {busy:busy, ready:ready};
}
function makerHudText(info){
  if(!info) info = makerHudInfo();
  const a = [];
  if(info.ready) a.push('待取 ' + info.ready);
  if(info.busy)  a.push('加工 ' + info.busy);
  return a.join(' · ');
}
function drawMakerHud(g){
  const info = makerHudInfo();
  if(!info.busy && !info.ready) return;
  const txt = makerHudText(info);
  g.font = '12px ' + FONT_CJK;
  const tw = g.measureText(txt).width;
  const w = tw + 34, h = 24, x = VIEW_W - w - 10, y = 38;   /* 第 20 轮：让出最上面给农场评分 HUD */
  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(x, y, w, h);
  g.strokeStyle = info.ready ? '#ffd76a' : CONFIG.COLORS.hudBorder;
  g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.font = '14px ' + FONT_EMOJI; g.fillStyle = CONFIG.COLORS.hudAccent;
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('🏭', x + 7, y + h/2 + 1);
  g.font = '12px ' + FONT_CJK;
  g.fillStyle = info.ready ? '#ffe9b0' : CONFIG.COLORS.hudText;
  g.fillText(txt, x + 25, y + h/2 + 1);
  g.textBaseline = 'top';
}
/* 成品食用（可选加分项：右键吃，回体力，每天 3 次） */
function makerEatsToday(){ return makerEat.day === clock.day ? makerEat.n : 0; }
function eatFood(id){
  const d = itemDef(id);
  if(!d || d.kind !== 'food') return false;
  if(countItem(id) <= 0){ toast('背包里没有' + d.name); return false; }
  if(makerEatsToday() >= CONFIG.RECIPE.EAT_PER_DAY){
    toast('今天已经吃了 ' + CONFIG.RECIPE.EAT_PER_DAY + ' 次，明天再吃吧');
    return false;
  }
  if(stamina >= staminaMax){ toast('体力是满的，先省着吧'); return false; }
  removeItem(id, 1);
  stamina = Math.min(staminaMax, stamina + CONFIG.RECIPE.EAT_STAMINA);
  if(makerEat.day !== clock.day){ makerEat.day = clock.day; makerEat.n = 0; }
  makerEat.n++;
  toast('吃了' + d.name + '（体力 +' + CONFIG.RECIPE.EAT_STAMINA +
        '，今天还能吃 ' + (CONFIG.RECIPE.EAT_PER_DAY - makerEat.n) + ' 次）');
  playSfx(660, 'sine', 0.10, CONFIG.AUDIO.VOLUME);
  refreshPackGrid();
  updateStats();
  return true;
}
/* 存档辅助 */
function makerEatSerialize(){ return {d:makerEat.day | 0, n:Math.max(0, makerEat.n | 0)}; }
function makerEatDeserialize(o){
  makerEat.day = -1; makerEat.n = 0;
  if(o && typeof o === 'object'){
    if(typeof o.d === 'number') makerEat.day = o.d | 0;
    if(typeof o.n === 'number') makerEat.n = Math.max(0, o.n | 0);
  }
}
/* 新游戏 / 复位 */
function makerResetState(){
  makerOpen = false;
  openMaker = null;
  makerEat.day = -1; makerEat.n = 0;
  if(makerEl) setPanelOpen(makerEl, false);
}
/* 面板事件 */
if(makerMaskEl) makerMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); makerClosePanel(); });



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { makerEl, makerMaskEl, makerStatusEl, makerOutEl, makerListEl, makerEat, recipeDef, recipeInputText, recipeOutText, recipeProfit, recipeProfitText, recipeUnlockInfo, recipeUnlocked, recipeMissing, recipeMissingText, makerNear, makerCanStore, makerStore, makerFinish, makerAdvance, makerStart, makerTake, makerTakeAll, makerFormatLeft, makerRenderPanel, makerOpenPanel, makerClosePanel, toggleMakerPanel, makerHudInfo, makerHudText, drawMakerHud, makerEatsToday, eatFood, makerEatSerialize, makerEatDeserialize, makerResetState });
export { makerEl, makerMaskEl, makerStatusEl, makerOutEl, makerListEl, makerEat, recipeDef, recipeInputText, recipeOutText, recipeProfit, recipeProfitText, recipeUnlockInfo, recipeUnlocked, recipeMissing, recipeMissingText, makerNear, makerCanStore, makerStore, makerFinish, makerAdvance, makerStart, makerTake, makerTakeAll, makerFormatLeft, makerRenderPanel, makerOpenPanel, makerClosePanel, toggleMakerPanel, makerHudInfo, makerHudText, drawMakerHud, makerEatsToday, eatFood, makerEatSerialize, makerEatDeserialize, makerResetState };
