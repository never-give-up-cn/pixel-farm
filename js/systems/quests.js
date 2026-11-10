/* js/systems/quests.js —— 由 index.html 拆分，原行 9931–10290 */
'use strict';

/* === 17.委托板 / 信誉（第 16 轮） ===
 * 可扩展的事件总线：旧系统（收获 / 钓鱼 / 砍树 / 对话）只在产物处 emit 一次，
 * 所有委托判定都集中在这里，旧代码里没有散落的 if。 */
const questBus = {
  map: {},
  on(evt, fn){ (this.map[evt] = this.map[evt] || []).push(fn); },
  emit(evt, data){
    const list = this.map[evt];
    if(!list) return;
    for(const fn of list){
      try{ fn(data); }
      catch(err){ console.warn('[quest] 事件处理失败：', evt, err); }
    }
  }
};
function questEmit(evt, data){ questBus.emit(evt, data); }

window.questOpen = false;
window.quests = { rep:0, day:0, qid:0, offers:[], active:[] };

const questEl        = document.getElementById('quest');
const questMaskEl    = document.getElementById('questMask');
const questListEl    = document.getElementById('questList');
const questRepEl     = document.getElementById('questRep');
const questIconEl    = document.getElementById('questIcon');
const questTitleEl   = document.getElementById('questTitle');

/* --- 数据辅助 --- */
const QUEST_KINDS = { c:'crop', f:'fish', m:'material', t:'talk' };
function questKindName(kind){
  return ({crop:'交付作物', fish:'交付鱼', material:'交付材料', talk:'和居民聊聊'})[kind] || '委托';
}
function questIcon(q){
  if(q.kind === 'talk'){
    const d = CONFIG.NPC.LIST.find(n => n.id === q.target);
    return d ? d.icon : '💬';
  }
  const d = itemDef(q.target);
  return d ? d.icon : '📋';
}
function questTitle(q){
  if(q.kind === 'talk'){
    const n = CONFIG.NPC.LIST.find(x => x.id === q.target);
    return '和 ' + (n ? n.name : '居民') + ' 聊聊';
  }
  const d = itemDef(q.target);
  return '交付 ' + (d ? d.name : q.target) + ' ×' + q.need;
}
/* 信誉加成：每 REP_STEP 点信誉 +5%，封顶 REP_BONUS_MAX */
function questRepBonus(){
  const A = CONFIG.QUEST;
  const steps = Math.floor((quests.rep | 0) / Math.max(1, A.REP_STEP));
  return Math.min(A.REP_BONUS_MAX, steps * A.REP_BONUS);
}
function questFinalGold(q){ return Math.max(1, Math.round((q.gold | 0) * (1 + questRepBonus()))); }

/* --- 每日生成：同一天的结果固定（重开也能复现），换天才变 --- */
function questRng(){
  const seed = ((CONFIG.SEED >>> 0) ^ Math.imul((clock.day | 0) + 1, 2654435761)) >>> 0;
  return mulberry32(seed);
}
function questPick(rng, arr){ return arr[(rng() * arr.length) | 0]; }
function questRandInt(rng, a, b){ return a + ((rng() * (b - a + 1)) | 0); }
function questMake(rng, kind){
  const A = CONFIG.QUEST, season = seasonName();
  /* 第 22 轮：先把种类定下来，再统一生成目标（原来 crop 分支里改 kind 再走 else if 链，容易绕晕） */
  if(kind === 'crop'){
    const pool = CONFIG.CROPS.filter(c => cropSeasons(c).indexOf(season) >= 0);
    /* 冬天没有当季作物 → 换成材料委托，避免刷出做不完的委托 */
    if(!pool.length) kind = 'material';
  }
  let target = null;
  if(kind === 'crop'){
    const pool = CONFIG.CROPS.filter(c => cropSeasons(c).indexOf(season) >= 0);
    target = questPick(rng, pool).id;
  }else if(kind === 'fish'){
    const pool = A.FISH_POOL.filter(id => { const f = fishDef(id); return f && f.seasons.indexOf(season) >= 0; });
    target = questPick(rng, pool.length ? pool : A.FISH_POOL);
  }else if(kind === 'material'){
    target = questPick(rng, A.MATERIAL_POOL);
  }else if(kind === 'talk'){
    target = questPick(rng, A.TALK_POOL);
  }
  const range = A.NEED[kind] || [1, 1];
  const need = questRandInt(rng, range[0], range[1]);
  const gold = (A.GOLD_BASE[kind] || 40) + need * (A.GOLD_PER_UNIT[kind] || 0);
  let extra = null;
  if(rng() < A.EXTRA_CHANCE){
    extra = {id: questPick(rng, A.EXTRA_POOL), n: 1};
  }
  return {id: ++quests.qid, kind: kind, target: target, need: need, got: 0,
          days: questRandInt(rng, A.DAYS_MIN, A.DAYS_MAX), gold: gold, extra: extra};
}
function questRefresh(){
  const A = CONFIG.QUEST;
  quests.day = clock.day;
  quests.offers = [];
  const rng = questRng();
  /* 每天按天旋转种类，3 天一轮把四种委托都覆盖到 */
  const kinds = ['crop', 'fish', 'material', 'talk'];
  const rot = ((clock.day | 0) - 1) % kinds.length;
  for(let i=0; i<A.DAILY; i++) quests.offers.push(questMake(rng, kinds[(rot + i) % kinds.length]));
  return quests.offers;
}
function questEnsureBoard(){
  if(!quests.offers.length || quests.day !== clock.day) questRefresh();
}

/* --- 接取 / 进度 / 结算 --- */
function questAccept(id){
  const A = CONFIG.QUEST;
  if(quests.active.length >= A.MAX_ACTIVE){
    toast('最多同时接 ' + A.MAX_ACTIVE + ' 单，先完成手上的');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  const i = quests.offers.findIndex(q => q.id === id);
  if(i < 0) return false;
  const q = quests.offers.splice(i, 1)[0];
  quests.active.push(q);
  toast('接下了委托：' + questTitle(q));
  playSfx(660, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  if(questOpen) questRenderPanel();
  return true;
}
function questProgress(kind, target, n){
  n = n | 0;
  if(n <= 0 || !target) return 0;
  let done = 0;
  for(const q of quests.active.slice()){
    if(q.kind !== kind || q.target !== target) continue;
    q.got = Math.min(q.need, (q.got | 0) + n);
    if(q.got >= q.need){ questComplete(q); done++; }
  }
  if(done && questOpen) questRenderPanel();
  return done;
}
function questComplete(q){
  const i = quests.active.indexOf(q);
  if(i >= 0) quests.active.splice(i, 1);
  const A = CONFIG.QUEST;
  const pay = questFinalGold(q);
  changeGold(pay);
  quests.rep = (quests.rep | 0) + A.REP_PER_DONE;
  let extraTxt = '';
  if(q.extra && Math.random() < A.EXTRA_CHANCE){
    if(canFit(q.extra.id, q.extra.n)){
      addItem(q.extra.id, q.extra.n);
      const ed = itemDef(q.extra.id);
      extraTxt = '，额外奖励 ' + (ed ? ed.name : q.extra.id) + ' ×' + q.extra.n;
    }else{
      extraTxt = '，背包满了没拿到额外奖励';
    }
  }
  toast('委托完成：' + questTitle(q) + ' → +' + pay + ' 金币' + extraTxt);
  playSfx(1319, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  return {pay:pay, rep:quests.rep};
}
/* 每天 6:00：先扣存活天数 → 过期的移除（不结算），再刷新委托板 */
function questDayStart(){
  const expired = [];
  for(const q of quests.active){
    q.days = (q.days | 0) - 1;
    if(q.days <= 0) expired.push(q);
  }
  if(expired.length){
    quests.active = quests.active.filter(q => q.days > 0);
    for(const q of expired) toast('委托过期了：' + questTitle(q));
  }
  if(quests.day !== clock.day) questRefresh();
}

/* --- 存档：紧凑数组 [id, kind, target, need, got, days, gold, extra] --- */
function questPack(q){
  let kind = 'c';
  for(const k in QUEST_KINDS) if(QUEST_KINDS[k] === q.kind) kind = k;
  return [q.id | 0, kind, q.target, q.need | 0, q.got | 0, q.days | 0, q.gold | 0,
          q.extra ? (q.extra.id + ':' + (q.extra.n | 0)) : 0];
}
function questUnpack(a){
  if(!Array.isArray(a) || a.length < 7) return null;
  const kind = QUEST_KINDS[a[1]];
  if(!kind) return null;
  const target = String(a[2]);
  if(kind === 'crop' && !cropDef(target)) return null;
  if(kind === 'fish' && !fishDef(target)) return null;
  if(kind === 'material' && target !== 'wood' && target !== 'stone') return null;
  if(kind === 'talk' && !CONFIG.NPC.LIST.some(n => n.id === target)) return null;
  const need = clamp(a[3] | 0, 1, 99);
  const q = {id: Math.max(0, a[0] | 0), kind: kind, target: target, need: need,
             got: clamp(a[4] | 0, 0, need), days: clamp(a[5] | 0, 1, CONFIG.QUEST.DAYS_MAX),
             gold: Math.max(1, a[6] | 0), extra: null};
  if(typeof a[7] === 'string' && a[7]){
    const p = a[7].split(':');
    if(CONFIG.ITEMS[p[0]]) q.extra = {id: p[0], n: clamp(parseInt(p[1], 10) || 1, 1, 99)};
  }
  return q;
}
function questSerialize(){
  return {r: quests.rep | 0, d: quests.day | 0, i: quests.qid | 0,
          o: quests.offers.map(questPack), a: quests.active.map(questPack)};
}
function questDeserialize(o){
  quests = {rep:0, day:0, qid:0, offers:[], active:[]};
  if(o && typeof o === 'object'){
    quests.rep = Math.max(0, o.r | 0);
    quests.day = Math.max(0, o.d | 0);
    quests.qid = Math.max(0, o.i | 0);
    if(Array.isArray(o.o)) for(const e of o.o){ const q = questUnpack(e); if(q) quests.offers.push(q); }
    if(Array.isArray(o.a)) for(const e of o.a){ const q = questUnpack(e); if(q) quests.active.push(q); }
    if(quests.active.length > CONFIG.QUEST.MAX_ACTIVE) quests.active.length = CONFIG.QUEST.MAX_ACTIVE;
  }
  questEnsureBoard();                 /* 老存档没这个字段 → 当天重新出板 */
  return true;
}
function questResetState(refresh){
  quests = {rep:0, day:0, qid:0, offers:[], active:[]};
  if(refresh !== false) questRefresh();
}

/* --- 面板（复用 .panel / panelIn / panelOut） --- */
function questRowEl(q, mode){
  const row = document.createElement('div'); row.className = 'qrow';
  const ico = document.createElement('span'); ico.className = 'qico'; ico.textContent = questIcon(q);
  const info = document.createElement('div'); info.className = 'qinfo';
  const nm = document.createElement('div'); nm.className = 'qname'; nm.textContent = questTitle(q);
  const meta = document.createElement('div'); meta.className = 'qmeta';
  let line = '剩余 ' + q.days + ' 天 · ' + (mode === 'active' ? ('进度 ' + q.got + '/' + q.need) : questKindName(q.kind));
  if(mode === 'active' && q.extra){
    const ed = itemDef(q.extra.id);
    line += ' · 额外 ' + (ed ? ed.name : q.extra.id) + '×' + q.extra.n +
            '（' + Math.round(CONFIG.QUEST.EXTRA_CHANCE * 100) + '%）';
  }
  meta.textContent = line;
  info.appendChild(nm); info.appendChild(meta);
  if(mode === 'active'){
    const bar = document.createElement('div'); bar.className = 'qbar';
    const fill = document.createElement('i');
    fill.style.width = Math.round(q.got / q.need * 100) + '%';
    bar.appendChild(fill); info.appendChild(bar);
  }
  const gold = document.createElement('span'); gold.className = 'qgold';
  gold.textContent = questFinalGold(q) + ' 💰';
  const btn = document.createElement('button');
  btn.className = 'mbtn';
  if(mode === 'active'){
    btn.textContent = '进行中';
    btn.className = 'mbtn off';
  }else if(quests.active.length >= CONFIG.QUEST.MAX_ACTIVE){
    btn.textContent = '已接满';
    btn.className = 'mbtn off';
  }else{
    btn.textContent = '接取';
    btn.addEventListener('click', ()=>{ questAccept(q.id); });
  }
  row.appendChild(ico); row.appendChild(info); row.appendChild(gold); row.appendChild(btn);
  return row;
}
function questRenderPanel(){
  if(!questListEl) return;
  if(questRepEl){
    questRepEl.textContent = '信誉 ' + (quests.rep | 0) + ' · 奖励 +' +
                             Math.round(questRepBonus() * 100) + '%';
  }
  questListEl.innerHTML = '';
  if(quests.active.length){
    const h = document.createElement('div'); h.className = 'qsec';
    h.textContent = '进行中 ' + quests.active.length + '/' + CONFIG.QUEST.MAX_ACTIVE;
    questListEl.appendChild(h);
    for(const q of quests.active) questListEl.appendChild(questRowEl(q, 'active'));
  }
  const h2 = document.createElement('div'); h2.className = 'qsec';
  h2.textContent = '今日委托（' + quests.offers.length + '）';
  questListEl.appendChild(h2);
  if(!quests.offers.length){
    const e = document.createElement('div'); e.className = 'qrow';
    e.textContent = '今天的委托都接完了，明天 6:00 再来';
    questListEl.appendChild(e);
  }
  for(const q of quests.offers) questListEl.appendChild(questRowEl(q, 'offer'));
}
function questOpenPanel(){
  if(questOpen) return false;
  questOpen = true;
  questRenderPanel();
  setPanelOpen(questEl, true);
  playSfx(620, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  sysTipShow('quest');                       /* 第 21 轮：第一次打开委托板 → 教学提示 */
  return true;
}
function questClosePanel(){
  if(!questOpen) return false;
  questOpen = false;
  setPanelOpen(questEl, false);
  return true;
}
function toggleQuestPanel(v){
  if(v === undefined) v = !questOpen;
  return v ? questOpenPanel() : questClosePanel();
}
if(questMaskEl) questMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); questClosePanel(); });

/* --- 互动距离 / 世界绘制 --- */
function questBoardDist(){
  const dx = (QUEST_BOARD.x + 0.5) * TILE - player.x;
  const dy = (QUEST_BOARD.y + 0.5) * TILE - player.y;
  return Math.hypot(dx, dy) / TILE;
}
function questBoardNear(){ return questBoardDist() <= CONFIG.QUEST.RANGE; }
function drawQuestBoard(g, x, y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.fencePostDark; g.fillRect(x + 7, y + 17, 4, 15);
  g.fillRect(x + 22, y + 17, 4, 15);
  g.fillStyle = C.shopCounterDark; g.fillRect(x + 2, y + 8, 28, 15);
  g.fillStyle = C.shopCounter;     g.fillRect(x + 3, y + 9, 26, 12);
  g.fillStyle = '#efe6cf'; g.fillRect(x + 6, y + 11, 6, 7);
  g.fillRect(x + 14, y + 12, 5, 5);
  g.fillRect(x + 21, y + 11, 5, 6);
  g.fillStyle = C.shopSign;     g.fillRect(x + 8, y + 2, 16, 5);
  g.fillStyle = C.shopSignText; g.fillRect(x + 10, y + 3, 12, 2);
  /* 头顶飘一个「委托」小旗子 */
  g.fillStyle = '#ffd76a'; g.fillRect(x + 14, y - 5, 4, 6);
}

/* --- HUD 左侧追踪（进行中的委托：进度 x/N + 剩余天数） --- */
function drawQuestTracker(g, startY){
  if(!quests.active.length) return;
  let cy = startY;
  g.textBaseline = 'top'; g.textAlign = 'left';
  for(const q of quests.active){
    const title = questTitle(q);
    g.font = '12px ' + FONT_CJK;
    const tw = g.measureText(title).width;
    const prog = ' ' + q.got + '/' + q.need;
    const pw = g.measureText(prog).width;
    const days = ' 剩' + q.days + '天';
    g.font = '11px ' + FONT_CJK;
    const dw = g.measureText(days).width;
    const w = Math.ceil(18 + tw + pw + dw);
    g.fillStyle = 'rgba(8,10,16,.72)'; g.fillRect(8, cy, w, 20);
    g.fillStyle = CONFIG.COLORS.hudBorder;
    g.fillRect(8, cy, w, 1); g.fillRect(8, cy + 19, w, 1);
    g.fillRect(8, cy, 1, 20); g.fillRect(8 + w - 1, cy, 1, 20);
    g.font = '12px ' + FONT_CJK; g.fillStyle = CONFIG.COLORS.hudText;
    g.fillText(title, 13, cy + 4);
    g.fillStyle = '#7fd05a';
    g.fillText(prog, 13 + tw, cy + 4);
    g.font = '11px ' + FONT_CJK; g.fillStyle = '#8fa3bd';
    g.fillText(days, 13 + tw + pw, cy + 5);
    cy += 24;
  }
  g.textAlign = 'left';
}

/* --- 事件总线：旧系统只用 questEmit() 报告产物，这里统一处理 --- */
questBus.on('crop',     d => questProgress('crop',     d && d.id, d && d.n));
questBus.on('fish',     d => questProgress('fish',     d && d.id, d && d.n));
questBus.on('material', d => questProgress('material', d && d.id, d && d.n));
questBus.on('talk',     d => questProgress('talk',     d && d.id, d && d.n));



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { questBus, questEl, questMaskEl, questListEl, questRepEl, questIconEl, questTitleEl, QUEST_KINDS, questEmit, questKindName, questIcon, questTitle, questRepBonus, questFinalGold, questRng, questPick, questRandInt, questMake, questRefresh, questEnsureBoard, questAccept, questProgress, questComplete, questDayStart, questPack, questUnpack, questSerialize, questDeserialize, questResetState, questRowEl, questRenderPanel, questOpenPanel, questClosePanel, toggleQuestPanel, questBoardDist, questBoardNear, drawQuestBoard, drawQuestTracker });
export { questBus, questEl, questMaskEl, questListEl, questRepEl, questIconEl, questTitleEl, QUEST_KINDS, questEmit, questKindName, questIcon, questTitle, questRepBonus, questFinalGold, questRng, questPick, questRandInt, questMake, questRefresh, questEnsureBoard, questAccept, questProgress, questComplete, questDayStart, questPack, questUnpack, questSerialize, questDeserialize, questResetState, questRowEl, questRenderPanel, questOpenPanel, questClosePanel, toggleQuestPanel, questBoardDist, questBoardNear, drawQuestBoard, drawQuestTracker };
