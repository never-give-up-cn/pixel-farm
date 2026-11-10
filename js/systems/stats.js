/* js/systems/stats.js —— 由 index.html 拆分，原行 10723–11085 */
'use strict';

/* === 19.统计 / 成就 / 年度总结（第 18 轮） ===
 * 统计字段全部是数字（存档里是一个 16 长度的数字数组），增量更新、不重算全量。
 * 成就用一个 32 位掩码存（最多 32 个），解锁时右上角滑入卡片 + 音效，Esc 菜单里看成就墙。
 * 年度总结由「游玩天数 / 日期」派生，只在这一年结束时弹一次（面板打开时世界冻结）。 */
const YEAR_DAYS = CONFIG.DAYS_PER_SEASON * CONFIG.SEASONS.length;   /* 4 季 × 10 天 = 40 天 */

/* st 数组布局（16 个数字）：
 * 0 dy 游玩天数   1 hv 累计收获   2 fs 累计钓鱼   3 inc 累计收入   4 bd 建造次数
 * 5 af 好感总和   6 sl 睡觉次数   7 gs 卖出次数   8 gc 送礼次数   9 cv 收过的作物（位掩码）
 * 10 di 今日收入  11 dd 今日收入归属日
 * 12 yh 本年基线-收获  13 yi 基线-收入  14 ya 基线-好感  15 yu 基线-已解锁成就数 */
const STATS_KEYS = ['dy','hv','fs','inc','bd','af','sl','gs','gc','cv','di','dd','yh','yi','ya','yu'];
function statsZeroArray(){ return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; }
function statsZero(){
  return {dy:0, hv:0, fs:0, inc:0, bd:0, af:0, sl:0, gs:0, gc:0, cv:0,
          di:0, dd:0, yh:0, yi:0, ya:0, yu:0};
}
window.statsState = statsZero();
statsState.dy = 1;                    /* 第 1 天算 1 天（老档迁移 / 读老档时仍从 0 开始） */

window.achState = {unl:0};               /* 成就位掩码：第 i 位 = LIST[i] 已解锁 */
window.achQueue = [];                    /* 待播放的解锁卡片（同时解锁多个时排队） */
window.achCardT = 0, window.achCardGap = 0;     /* 卡片剩余停留时间 / 两张卡片之间的空隙 */
window.achOpen = false, window.achTab = 'all';
window.annualOpen = false, window.annualInfo = null, window.annualPending = null;

const achEl        = document.getElementById('ach');
const achMaskEl    = document.getElementById('achMask');
const achListEl    = document.getElementById('achList');
const achStatsEl   = document.getElementById('achStats');
const achTabsEl    = document.getElementById('achTabs');
const achProgEl    = document.getElementById('achProg');
const achCard      = document.getElementById('achCard');
const achCardIcon  = document.getElementById('achCardIcon');
const achCardName  = document.getElementById('achCardName');
const achCardDesc  = document.getElementById('achCardDesc');
const annualEl     = document.getElementById('annual');
const annualMaskEl = document.getElementById('annualMask');
const annualTitleEl= document.getElementById('annualTitle');
const annualSubEl  = document.getElementById('annualSub');
const annualBodyEl = document.getElementById('annualBody');
const annualCloseBtn = document.getElementById('annualClose');

/* --- 统计：存档 / 读档 / 重置 --- */
function statsSerialize(){
  const out = [];
  for(const k of STATS_KEYS) out.push(statsState[k] | 0);
  return out;
}
function statsDeserialize(a){
  const s = statsZero();
  if(Array.isArray(a)){
    for(let i=0;i<STATS_KEYS.length && i<a.length;i++){
      const n = a[i];
      s[STATS_KEYS[i]] = (typeof n === 'number' && isFinite(n) && n > 0) ? Math.floor(n) : 0;
    }
  }
  statsState = s;
  return statsState;
}
function statsResetState(){
  statsState = statsZero();
  statsState.dy = 1;                  /* 新游戏从第 1 天开始 */
  annualPending = null;
}
function statsDailyIncome(){ return (statsState.dd === clock.day) ? (statsState.di | 0) : 0; }

/* --- 统计增量钩子（由各系统在自己成功时调用一行） --- */
function statsIncome(v){
  if(!(v > 0)) return;
  const n = Math.round(v);
  if(statsState.dd !== clock.day){ statsState.dd = clock.day; statsState.di = 0; }
  statsState.inc += n;
  statsState.di += n;
  achCheck();
}
function statsHarvest(type){
  statsState.hv += 1;
  const i = CONFIG.CROPS.findIndex(c => c.id === type);
  if(i >= 0 && i < 31) statsState.cv = (statsState.cv | (1 << i)) >>> 0;
  achCheck();
}
function statsFish(){ statsState.fs += 1; achCheck(); }
function statsBuild(){ statsState.bd += 1; achCheck(); }
function statsAff(delta){
  if(!delta) return;
  statsState.af = Math.max(0, statsState.af + (delta | 0));
  achCheck();
}
function statsGift(){ statsState.gc += 1; achCheck(); }
function statsSell(){ statsState.gs += 1; achCheck(); }
function statsSleep(){ statsState.sl += 1; achCheck(); }
function statsDayTick(){
  statsState.dy += 1;
  statsYearCheck();                   /* 跨年 → 记下年度总结、更新本年基线 */
  achCheck();                         /* 「活过一整年」等按天数解锁的成就 */
}

/* --- 成就判定 --- */
function achPopcount(x){
  x = x >>> 0;
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}
function achCount(){ return achPopcount(achState.unl); }
function achHasUnlocked(i){ return i >= 0 && i < 32 && !!(achState.unl & (1 << i)); }
function achFriends(){
  let fi = CONFIG.NPC.TIERS.findIndex(t => t.key === 'friend');
  if(fi < 0) fi = 2;
  let n = 0;
  for(const d of CONFIG.NPC.LIST) if(npcTierIdx(npcAff(d.id)) >= fi) n++;
  return n;
}
function achValue(a){
  switch(a.kind){
    case 'stat':        return statsState[a.key] | 0;
    case 'gold':        return gold | 0;
    case 'dailyGold':   return statsDailyIncome();
    case 'crops':       return achPopcount(statsState.cv);
    case 'fishKinds':   return dexState.f.length;
    case 'gatherKinds': return achPopcount(dexState.g);
    case 'friends':     return achFriends();
    case 'year':        return clock.day > YEAR_DAYS ? 1 : 0;
  }
  return 0;
}
function achCheck(){
  const L = CONFIG.ACHIEVEMENT.LIST;
  let n = 0;
  for(let i=0;i<L.length;i++){
    if(achHasUnlocked(i)) continue;
    const a = L[i];
    if(achValue(a) >= (a.need | 0) && achUnlock(i)) n++;
  }
  if(sessionActive) ratingCheck();    /* 第 20 轮：成就/收获等变化后重新评估农场星级 */
  return n;
}
function achUnlock(i){
  const a = CONFIG.ACHIEVEMENT.LIST[i];
  if(!a || achHasUnlocked(i)) return false;
  achState.unl = (achState.unl | (1 << i)) >>> 0;   /* 只解锁一次：位测试挡掉重复触发 */
  ratingInvalidate();                          /* 第 21 轮：成就数变化 → 评级缓存失效 */
  achQueue.push(a);
  achShowNextCard();
  toast('🏆 成就解锁：' + a.name);
  playSfx(1568, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
  setTimeout(()=>playSfx(2093, 'triangle', 0.14, CONFIG.AUDIO.VOLUME * 0.8), 110);
  if(achOpen) achRenderWall();
  return true;
}

/* --- 右上角解锁卡片（跟着世界一起冻结，不阻塞操作） --- */
/* 第 23 轮：小地图画在画布右上角（随缩放移动），卡片是视口定位（固定）——
   窗口一窄两者就可能撞上。撞上时把卡片挪到小地图下面，不改动卡片本身。 */
function layoutAchCard(){
  if(!achCard) return;
  const r = canvas.getBoundingClientRect();
  const M = CONFIG.MINIMAP;
  const sc = r.width / VIEW_W;
  const mini = {
    left: r.left + (VIEW_W - M.SIZE - M.MARGIN) * sc,
    right: r.left + (VIEW_W - M.MARGIN) * sc,
    top: r.top + M.TOP * sc,
    bottom: r.top + (M.TOP + M.SIZE) * sc
  };
  const cw = achCard.offsetWidth || 111;
  const cardLeft = window.innerWidth - 14 - cw;
  const cardRight = window.innerWidth - 14;
  const hit = (cardLeft < mini.right && cardRight > mini.left &&
               70 < mini.bottom && 110 > mini.top);
  achCard.style.top = hit ? Math.round(mini.bottom + 8) + 'px' : '70px';
}
window.addEventListener('resize', layoutAchCard);
function achWorldFrozen(){
  return !!(startMenuOpen || sysOpen || paused || npcOpen || packOpen || shopOpen || chestOpen ||
            animalOpen || questOpen || calOpen || achOpen || annualOpen || ratingOpen ||
            endingOpen || sleepFx.phase !== 'none');
}
function achShowNextCard(){
  if(!achCard || achCard.classList.contains('show')) return false;
  if(achWorldFrozen()) return false;          /* 面板打开时先排队，世界恢复后再弹 */
  const a = achQueue.shift();
  if(!a) return false;
  achCardT = 0;
  if(achCardIcon) achCardIcon.textContent = a.icon;
  if(achCardName) achCardName.textContent = a.name;
  if(achCardDesc) achCardDesc.textContent = a.desc;
  layoutAchCard();
  achCard.classList.add('show');
  return true;
}
function achTickCard(dt){
  if(achCard && achCard.classList.contains('show')){
    achCardT += dt;
    if(achCardT >= CONFIG.ACHIEVEMENT.CARD_MS / 1000){
      achCard.classList.remove('show');
      achCardT = 0;
      achCardGap = 0.35;                      /* 两张卡片之间留一点空隙 */
    }
  }else if(achCardGap > 0){
    achCardGap -= dt;
    if(achCardGap <= 0) achShowNextCard();
  }else if(achQueue.length && !achWorldFrozen()){
    achShowNextCard();
  }
}

/* --- 成就墙：5 个分类页签 + 可滚动列表 + 统计数据行 --- */
function achBuildTabs(){
  if(!achTabsEl || achTabsEl.__built) return;
  achTabsEl.__built = true;
  const list = [{key:'all', name:'全部', icon:'🏆'}].concat(CONFIG.ACHIEVEMENT.CATS);
  for(const c of list){
    const b = document.createElement('button');
    b.className = 'tab';
    b._atab = c.key;
    b.textContent = c.icon + ' ' + c.name;
    b.addEventListener('click', ()=>{ achTab = c.key; achRenderWall(); });
    achTabsEl.appendChild(b);
  }
}
function achRenderWall(){
  const L = CONFIG.ACHIEVEMENT.LIST;
  if(achProgEl) achProgEl.textContent = '已解锁 ' + achCount() + '/' + L.length;
  if(achStatsEl){
    achStatsEl.innerHTML = '';
    const s = statsState;
    const items = [['🌾 收获', s.hv], ['🎣 钓鱼', s.fs], ['💰 收入', s.inc], ['🔨 建造', s.bd],
                   ['💬 好感', s.af], ['📅 天数', s.dy], ['😴 睡觉', s.sl], ['🏆 成就', achCount()]];
    for(const it of items){
      const d = document.createElement('div');
      d.textContent = it[0] + ' ' + it[1];
      achStatsEl.appendChild(d);
    }
  }
  if(achTabsEl){
    for(const b of achTabsEl.children) b.className = 'tab' + (b._atab === achTab ? ' on' : '');
  }
  if(achListEl){
    achListEl.innerHTML = '';
    for(let i=0;i<L.length;i++){
      const a = L[i];
      if(achTab !== 'all' && a.cat !== achTab) continue;
      const on = achHasUnlocked(i);
      const row = document.createElement('div');
      row.className = 'arow ' + (on ? 'on' : 'off');
      const ico = document.createElement('div'); ico.className = 'aico'; ico.textContent = a.icon;
      const info = document.createElement('div'); info.className = 'ainfo';
      const nm = document.createElement('div'); nm.className = 'aname'; nm.textContent = a.name;
      const ds = document.createElement('div'); ds.className = 'adesc'; ds.textContent = a.desc;
      info.appendChild(nm); info.appendChild(ds);
      const st = document.createElement('div'); st.className = 'astat';
      const v = achValue(a);
      st.textContent = on ? '✓ 已解锁' : ('进度 ' + Math.min(v, a.need) + '/' + a.need);
      row.appendChild(ico); row.appendChild(info); row.appendChild(st);
      achListEl.appendChild(row);
    }
  }
}
function achOpenPanel(){
  achBuildTabs();
  if(achOpen) return true;
  achOpen = true;
  if(sysOpen) toggleSys(false);              /* 从系统菜单进来：先收起菜单 */
  if(packOpen) togglePack(false);
  if(shopOpen) toggleShop(false);
  if(chestOpen) toggleChest(false);
  achRenderWall();
  setPanelOpen(achEl, true);
  playSfx(700, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  return true;
}
function achClosePanel(){
  if(!achOpen) return false;
  achOpen = false;
  setPanelOpen(achEl, false);
  return true;
}
function toggleAchPanel(v){
  if(v === undefined) v = !achOpen;
  return v ? achOpenPanel() : achClosePanel();
}

/* --- 年度总结：活过一整年（第 41 / 81 / … 天早晨）弹一次 --- */
function statsYearCheck(){
  if(clock.day <= 1 || (clock.day - 1) % YEAR_DAYS !== 0) return false;
  const year = Math.floor((clock.day - 1) / YEAR_DAYS);
  annualPending = {
    year: year,
    hv: Math.max(0, statsState.hv - statsState.yh),
    inc: Math.max(0, statsState.inc - statsState.yi),
    af: statsState.af - statsState.ya,
    ach: Math.max(0, achCount() - statsState.yu)
  };
  statsState.yh = statsState.hv;
  statsState.yi = statsState.inc;
  statsState.ya = statsState.af;
  statsState.yu = achCount();
  return true;
}
function annualOpenPanel(info){
  if(annualOpen || !info) return false;
  annualOpen = true;
  annualInfo = info;
  if(annualTitleEl) annualTitleEl.textContent = '第 ' + info.year + ' 年 · 年度总结';
  if(annualSubEl) annualSubEl.textContent = '你已经在这个农场生活了 ' + (info.year * YEAR_DAYS) + ' 天';
  if(annualBodyEl){
    annualBodyEl.innerHTML = '';
    const rows = [
      ['🌾 本年收成', String(info.hv) + ' 个'],
      ['💰 本年收入', String(info.inc) + ' 金币'],
      ['💬 本年好感', (info.af >= 0 ? '+' : '') + info.af],
      ['🏆 本年成就', info.ach + ' 个（共 ' + achCount() + '/' + CONFIG.ACHIEVEMENT.LIST.length + '）']
    ];
    for(const r of rows){
      const line = document.createElement('div'); line.className = 'arline';
      const k = document.createElement('span'); k.textContent = r[0];
      const v = document.createElement('span'); v.className = 'arv'; v.textContent = r[1];
      line.appendChild(k); line.appendChild(v);
      annualBodyEl.appendChild(line);
    }
  }
  setPanelOpen(annualEl, true);
  playSfx(784, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  setTimeout(()=>playSfx(1046, 'triangle', 0.16, CONFIG.AUDIO.VOLUME), 140);
  return true;
}
function annualClosePanel(){
  if(!annualOpen) return false;
  annualOpen = false;
  setPanelOpen(annualEl, false);
  return true;
}

/* --- 成就：存档 / 读档 / 重置 --- */
function achSerialize(){ return {u: achState.unl >>> 0}; }
function achDeserialize(d){
  const max = (1 << CONFIG.ACHIEVEMENT.LIST.length) - 1;
  const u = (d && typeof d === 'object' && typeof d.u === 'number') ? d.u : 0;
  achState = {unl: (u & max) >>> 0};
  achQueue = [];
  achCardT = 0; achCardGap = 0;
  if(achCard) achCard.classList.remove('show');
  return achState;
}
function achResetState(){
  achState = {unl:0};
  achQueue = [];
  achCardT = 0; achCardGap = 0;
  achTab = 'all';
  annualPending = null;
  if(achCard) achCard.classList.remove('show');
  if(achOpen) achClosePanel();
  if(annualOpen) annualClosePanel();
}

/* --- 面板事件 --- */
if(achMaskEl) achMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); achClosePanel(); });
if(annualMaskEl) annualMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); annualClosePanel(); });
if(annualCloseBtn) annualCloseBtn.addEventListener('click', ()=>annualClosePanel());
achBuildTabs();



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { YEAR_DAYS, STATS_KEYS, achEl, achMaskEl, achListEl, achStatsEl, achTabsEl, achProgEl, achCard, achCardIcon, achCardName, achCardDesc, annualEl, annualMaskEl, annualTitleEl, annualSubEl, annualBodyEl, annualCloseBtn, statsZeroArray, statsZero, statsSerialize, statsDeserialize, statsResetState, statsDailyIncome, statsIncome, statsHarvest, statsFish, statsBuild, statsAff, statsGift, statsSell, statsSleep, statsDayTick, achPopcount, achCount, achHasUnlocked, achFriends, achValue, achCheck, achUnlock, layoutAchCard, achWorldFrozen, achShowNextCard, achTickCard, achBuildTabs, achRenderWall, achOpenPanel, achClosePanel, toggleAchPanel, statsYearCheck, annualOpenPanel, annualClosePanel, achSerialize, achDeserialize, achResetState });
export { YEAR_DAYS, STATS_KEYS, achEl, achMaskEl, achListEl, achStatsEl, achTabsEl, achProgEl, achCard, achCardIcon, achCardName, achCardDesc, annualEl, annualMaskEl, annualTitleEl, annualSubEl, annualBodyEl, annualCloseBtn, statsZeroArray, statsZero, statsSerialize, statsDeserialize, statsResetState, statsDailyIncome, statsIncome, statsHarvest, statsFish, statsBuild, statsAff, statsGift, statsSell, statsSleep, statsDayTick, achPopcount, achCount, achHasUnlocked, achFriends, achValue, achCheck, achUnlock, layoutAchCard, achWorldFrozen, achShowNextCard, achTickCard, achBuildTabs, achRenderWall, achOpenPanel, achClosePanel, toggleAchPanel, statsYearCheck, annualOpenPanel, annualClosePanel, achSerialize, achDeserialize, achResetState };
