/* 像素农场 · 第 15 轮（动物 / 棚舍 / 每日产出 / 存档迁移）node vm 断言 */
const fs = require('fs');
const vm = require('vm');

const path = 'E:/IdeaProjects/物理模拟/index.html';
const html = fs.readFileSync(path, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if(!m) throw new Error('no script');
let src = m[1];
src = src.replace('DEBUG_HOOK: false', 'DEBUG_HOOK: true');

/* ---------- mock ---------- */
function mkCtx(log){
  const g = {
    canvas:{width:960,height:540},
    imageSmoothingEnabled:true, globalAlpha:1, fillStyle:'#000', strokeStyle:'#000',
    lineWidth:1, font:'10px sans-serif', textAlign:'left', textBaseline:'top',
    fillRect(a,b,c,d){ log.push({op:'fillRect', a,b,c,d}); },
    strokeRect(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){},
    stroke(){}, fill(){}, arc(){}, save(){}, restore(){}, translate(){}, scale(){}, fillText(){},
    measureText(t){ return {width:(t||'').length * 7}; },
    drawImage(){}, drawImage2(){}, setTransform(){},
    createRadialGradient(){ const grd={}; grd.addColorStop=()=>{}; return grd; }
  };
  g.drawImage = function(){ log.push({op:'drawImage'}); };
  return g;
}
function mkEl(tag){
  const el = {
    tagName:tag||'div', style:{}, children:[], className:'', textContent:'', innerHTML:'', parentNode:null,
    __h:{}, __classes:new Set(),
    classList:{
      add(c){ el.__classes.add(c); },
      remove(c){ el.__classes.delete(c); },
      toggle(c,v){ if(v === undefined){ if(el.__classes.has(c)) el.__classes.delete(c); else el.__classes.add(c); } else if(v) el.__classes.add(c); else el.__classes.delete(c); },
      contains(c){ return el.__classes.has(c); }
    },
    get firstChild(){ return this.children[0]; },
    getAttribute(){ return null; },
    matches(){ return false; },
    closest(){ return null; },
    appendChild(c){ this.children.push(c); c.parentNode = this; return c; },
    removeChild(c){ const i=this.children.indexOf(c); if(i>=0) this.children.splice(i,1); c.parentNode=null; return c; },
    addEventListener(type, fn){ (this.__h[type] = this.__h[type] || []).push(fn); }
  };
  /* innerHTML = '' 在真实 DOM 里会清空子节点；mock 也要模拟，否则多次 render 会累加 */
  let _html = '';
  Object.defineProperty(el, 'innerHTML', {
    configurable:true, enumerable:true,
    get(){ return _html; },
    set(v){ _html = String(v); if(_html === '') el.children.length = 0; }
  });
  return el;
}
function mkCanvas(log){
  const c = mkEl('canvas');
  c.width = 960; c.height = 540;
  c.getContext = function(){ return mkCtx(log); };
  c.getBoundingClientRect = function(){ return {left:0, top:0, width:960, height:540}; };
  return c;
}
function mkStorage(initial){
  const data = Object.assign({}, initial || {});
  return {
    getItem(k){ return (k in data) ? data[k] : null; },
    setItem(k,v){ data[k] = String(v); },
    removeItem(k){ delete data[k]; },
    __data: data
  };
}
function mkTimers(){
  const q = [];
  let now = 0, seq = 0;
  return {
    setTimeout(fn, ms){ q.push({id:++seq, at: now + (ms||0), fn}); return seq; },
    clearTimeout(id){ const i=q.findIndex(t=>t.id===id); if(i>=0) q.splice(i,1); },
    flush(ms){ now += (ms===undefined?1000:ms); const due = q.filter(t=>t.at<=now); q.length=0; due.forEach(t=>t.fn()); },
    pending(){ return q.length; }
  };
}
function runGame(initialStore){
  const log = [];
  const ctxMock = mkCtx(log);
  const canvasMock = mkCanvas(log);
  const els = { game: canvasMock };
  const winListeners = {};
  const storage = mkStorage(initialStore);
  const timers = mkTimers();
  const sandbox = {
    __freqs: [],
    console: {log(){}, warn(){}, error(){}},
    Math, JSON, Date, parseInt, parseFloat, isNaN, String, Number, Object, Array, Set, Map,
    performance: {now: (()=>{ let t=1000; return ()=> (t += 0.5); })()},
    requestAnimationFrame(cb){ sandbox.__rafCb = cb; return 1; },
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    localStorage: storage,
    document: {
      getElementById(id){
        if(id === 'game') return canvasMock;
        if(!els[id]) els[id] = mkEl(id.indexOf('btn') === 0 || id === 'sndBtn' ? 'button' : 'div');
        return els[id];
      },
      createElement(tag){ return (tag === 'canvas') ? mkCanvas(log) : mkEl(tag); },
      addEventListener(){}
    }
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = (type, fn)=>{ (winListeners[type] = winListeners[type] || []).push(fn); };
  sandbox.globalThis = sandbox;
  sandbox.window.innerWidth = 1920;
  sandbox.window.innerHeight = 1080;
  sandbox.AudioContext = function(){
    return { state:'running', currentTime:0, destination:{},
      createOscillator(){ return {type:'sine', frequency:{value:440,setValueAtTime(f){ sandbox.__freqs.push(f); },linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}, connect(){}, start(){}, stop(){}}; },
      createGain(){ return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}}, connect(){}, disconnect(){}}; },
      createBufferSource(){ return {buffer:null, loop:false, connect(){}, start(){}, stop(){}}; },
      createBuffer(ch,len){ return {getChannelData(){ return new Float32Array(len); }}; },
      createBiquadFilter(){ return {type:'', frequency:{value:0}, connect(){}, disconnect(){}}; },
      resume(){ return Promise.resolve(); }, close(){} };
  };
  const ctxv = vm.createContext(sandbox);
  vm.runInContext(src, ctxv, {filename:'game.js'});
  const X = sandbox.window.__game;
  if(X) X.els = els;                       /* 方便断言读 mock DOM */
  return {X, sandbox, els, storage, winListeners, store: storage.__data,
          timers, log, canvasMock, freqs: sandbox.__freqs,
          get __rafCb(){ return sandbox.__rafCb; }};
}

/* ---------- 断言 ---------- */
let pass = 0, fail = 0;
const results = [];
function ok(name, cond, info){
  if(cond){ pass++; results.push('PASS  ' + name + (info?'  ('+info+')':'')); }
  else { fail++; results.push('FAIL  ' + name + (info?'  ('+info+')':'')); }
}
function eq(name, a, b){ ok(name, a === b, 'got=' + JSON.stringify(a) + ' want=' + JSON.stringify(b)); }
function key(g, k){
  (g.winListeners['keydown'] || []).forEach(fn => fn({key:k, repeat:false, preventDefault(){}}));
}
function clickEl(el){ (el.__h['click'] || []).forEach(fn => fn({preventDefault(){}})); }
function tip(g){
  const c = g.els.toasts.children;
  return c.length ? c[c.length-1].textContent : '-';
}
function tipAll(g){ return g.els.toasts.children.map(e=>e.textContent).join(' | '); }
const TILE = 32;
function put(X, tx, ty){ X.player.x = (tx+0.5)*TILE; X.player.y = (ty+0.5)*TILE; }
function hasClass(el, c){
  if(!el) return false;
  if(el.classList && el.classList.contains(c)) return true;
  return (' ' + (el.className || '') + ' ').indexOf(' ' + c + ' ') >= 0;
}
/* mock DOM 的 textContent 不会自动聚合子节点，这里手动摊平 */
function textOf(el){
  if(!el) return '';
  let s = el.textContent || '';
  for(const c of (el.children || [])) s += ' ' + textOf(c);
  return s;
}

/* ---------- 动物测试辅助 ---------- */
/* 把一块地清成纯草地（避开地图生成物带来的随机性），返回左上角 */
function arena(g, x, y, w, h){
  for(let yy=y; yy<y+h; yy++){
    for(let xx=x; xx<x+w; xx++){
      g.crops[yy*64+xx] = null;
      g.setTile(yy*64+xx, g.T.GRASS);
    }
  }
  return {x:x, y:y, w:w, h:h};
}
function addMats(g){
  g.addItem('wood', 300);
  g.addItem('stone', 200);
}
function selRecipe(g, id){
  g.buildSel = g.CONFIG.BUILD.RECIPES.findIndex(r => r.id === id);
  return g.buildSel;
}
/* 在 (tx,ty) 造一个棚舍 / 栅栏 */
function build(g, id, tx, ty){
  selRecipe(g, id);
  put(g, tx, ty);
  return g.placeBuilding(tx, ty);
}
function toolSlot(g, id){
  g.inv[0] = {id:id, n:1};
  g.selectHot(0);
}

/* ================= 第 18 轮：统计 / 成就 / 年度总结 ================= */
function achIdx(g, id){ return g.CONFIG.ACHIEVEMENT.LIST.findIndex(a => a.id === id); }
function arowText(g){ return g.els.achList.children.map(textOf); }

/* ================= 1. CONFIG / 命名空间 / 成就表结构 ================= */
{
  const G = runGame(null);
  const g = G.X;
  const A = g.CONFIG.ACHIEVEMENT;
  ok('CONFIG 里有 ACHIEVEMENT 命名空间', !!A, '');
  ok('成就参数没有散落到顶层', g.CONFIG.ACHIEVEMENT_LIST === undefined &&
     g.CONFIG.CARD_MS === undefined, '');
  ok('成就表 >= 20 个', A.LIST.length >= 20, 'n=' + A.LIST.length);
  eq('四个分类', A.CATS.length, 4);
  ok('分类是 种植 / 经济 / 社交 / 探索',
     A.CATS.map(c => c.name).join(',') === '种植,经济,社交,探索', A.CATS.map(c => c.name).join(','));
  ok('每条成就字段齐全', A.LIST.every(a => a.id && a.cat && a.icon && a.name && a.desc &&
     a.kind && typeof a.need === 'number' && a.need > 0), '');
  ok('成就 id 不重复', new Set(A.LIST.map(a => a.id)).size === A.LIST.length, '');
  ok('每个成就都属于四类之一', A.LIST.every(a => A.CATS.some(c => c.key === a.cat)), '');
  ok('每类都有 >= 4 条', A.CATS.every(c => A.LIST.filter(a => a.cat === c.key).length >= 4),
     A.CATS.map(c => c.key + ':' + A.LIST.filter(a => a.cat === c.key).length).join(','));
  ok('卡片停留时间合理', A.CARD_MS >= 1500, A.CARD_MS + 'ms');

  /* 验收点名的成就必须都在 */
  const need = ['harvest_first','harvest_100','crops_all',
                'sell_first','gold_1000','day_income_500',
                'gift_first','friends_3',
                'fish_8','gather_all','year_one'];
  ok('验收点名的 11 个成就都在', need.every(id => A.LIST.some(a => a.id === id)),
     need.filter(id => !A.LIST.some(a => a.id === id)).join(','));

  eq('存档版本升到 9', g.CONFIG.SAVE.VERSION, 12);
  /* 统计初始值 */
  eq('新游戏游玩天数从 1 开始', g.statsState.dy, 1);
  eq('其余统计从 0 开始', g.statsState.hv + g.statsState.fs + g.statsState.inc +
     g.statsState.bd + g.statsState.af + g.statsState.sl, 0);
  eq('成就初始全部未解锁', g.achState.unl, 0);
}

/* ================= 2. 统计：每类行为都增量 +1 / 加正确数值 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const field = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 3);
  const hi = field.y*64 + field.x;
  function harvestN(n, type){
    for(let k=0;k<n;k++){
      g.crops[hi] = {type:type, grown:5, stage:3, mature:true, watered:true, dead:false};
      g.setTile(hi, g.T.WATERED);
      put(g, field.x, field.y);
      g.harvestCrop(field.x, field.y);
    }
  }

  /* 收获 10 次 → 计数 10 */
  harvestN(10, 'potato');
  eq('收获 10 次后统计为 10', g.statsState.hv, 10);
  ok('作物种类掩码记下土豆（第 2 种）', (g.statsState.cv & 2) !== 0, 'cv=' + g.statsState.cv);
  ok('收获 10 个 → 解锁「小有收成」', g.achHasUnlocked(achIdx(g, 'harvest_10')), '');
  ok('收获 1 个 → 解锁「初次丰收」', g.achHasUnlocked(achIdx(g, 'harvest_first')), '');

  /* 集齐 4 种作物 */
  for(const t of ['radish','tomato','pumpkin']) harvestN(1, t);
  eq('收齐 4 种作物 → 种类数 4', g.achPopcount(g.statsState.cv), 4);
  ok('集齐 4 种作物 → 解锁「四季农人」', g.achHasUnlocked(achIdx(g, 'crops_all')), '');

  /* 卖出：次数 + 累计收入；买入不算收入 */
  g.inv[10] = {id:'pumpkin', n:3};
  const unit = g.priceOf('pumpkin');
  const inc0 = g.statsState.inc;
  g.sellItem('pumpkin', 1);
  eq('卖出记 1 次', g.statsState.gs, 1);
  eq('累计收入 = 卖价', g.statsState.inc - inc0, unit);
  eq('单日收入 = 卖价', g.statsDailyIncome(), unit);
  ok('首次卖出 → 解锁「第一桶金」', g.achHasUnlocked(achIdx(g, 'sell_first')), '');
  const inc1 = g.statsState.inc;
  g.shopBuyClick('seed_radish');
  eq('买东西不算收入', g.statsState.inc, inc1);

  /* 单日收入 500 */
  g.changeGold(500);
  eq('单日收入累加', g.statsState.di >= 500, true);
  ok('单日收入 500 → 解锁「日进斗金」', g.achHasUnlocked(achIdx(g, 'day_income_500')), '');

  /* 建造 */
  addMats(g);
  const bd0 = g.statsState.bd;
  eq('建造成功', build(g, 'fence', field.x + 1, field.y + 1), true);
  eq('建造次数 +1', g.statsState.bd, bd0 + 1);

  /* 钓鱼 */
  const fs0 = g.statsState.fs;
  const F = g.CONFIG.FISHING.LIST[0];
  g.fishing.fish = F; g.fishing.pointer = 0.5; g.fishing.zone = 0.5;
  g.fishing.zoneW = 0.4; g.fishing.state = 'reel';
  eq('钓上一条鱼', g.fishingResolveReel(), true);
  eq('钓鱼次数 +1', g.statsState.fs, fs0 + 1);
  ok('首次钓鱼 → 解锁「初次垂钓」', g.achHasUnlocked(achIdx(g, 'fish_first')), '');

  /* 好感总和 / 送礼 */
  const af0 = g.statsState.af;
  g.inv[0] = {id:'wood', n:3};
  g.giftTarget = 'aunt';
  const affBefore = g.npcAff('aunt');
  eq('送出礼物', g.npcGiftPick(0), true);
  eq('好感总和按实际增量累加', g.statsState.af - af0, g.npcAff('aunt') - affBefore);
  eq('送礼次数 +1', g.statsState.gc, 1);
  ok('首次送礼 → 解锁「初次送礼」', g.achHasUnlocked(achIdx(g, 'gift_first')), '');

  /* 好感总和 150（直接加满 3 位居民） */
  g.npcState.aff = {aunt:100, carpenter:100, girl:100};
  g.statsState.af = 300;
  g.achCheck();
  eq('与 3 位居民成为朋友', g.achFriends(), 3);
  ok('3 位朋友 → 解锁「三人成友」', g.achHasUnlocked(achIdx(g, 'friends_3')), '');
  ok('好感 150 → 解锁「人气王」', g.achHasUnlocked(achIdx(g, 'aff_150')), '');

  /* 睡觉 / 游玩天数 */
  const sl0 = g.statsState.sl;
  eq('开始睡觉', g.startSleep(false), true);
  eq('睡觉次数 +1', g.statsState.sl, sl0 + 1);
  g.sleepFx.phase = 'none';
  const dy0 = g.statsState.dy;
  g.rollToNextMorning(false);
  eq('跨天游玩天数 +1', g.statsState.dy, dy0 + 1);
  eq('新的一天单日收入归零', g.statsDailyIncome(), 0);
}

/* ================= 3. 成就只解锁一次 / 重复触发不重复弹卡 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.achResetState();
  g.statsState.hv = 0;

  g.statsState.hv = 1;
  eq('第一次检查解锁 1 个', g.achCheck(), 1);
  const unl1 = g.achState.unl;
  eq('「初次丰收」解锁', g.achHasUnlocked(achIdx(g, 'harvest_first')), true);
  eq('解锁后卡片在队列外（已弹出）', g.achQueue.length, 0);
  ok('卡片正在显示', hasClass(g.els.achCard, 'show'), '');

  g.achCheck(); g.achCheck(); g.achCheck();
  eq('重复触发不改变掩码', g.achState.unl, unl1);
  eq('重复触发不重复弹卡（队列仍空）', g.achQueue.length, 0);
  eq('第二次直接 achUnlock 返回 false', g.achUnlock(achIdx(g, 'harvest_first')), false);

  /* 同时解锁多个：排队，逐张播放 */
  g.achResetState();
  g.statsState.hv = 0; g.statsState.inc = 0; g.statsState.gs = 0;
  g.statsState.hv = 100; g.statsState.inc = 5000; g.statsState.gs = 1;
  const n = g.achCheck();
  ok('一次性解锁多个', n >= 3, 'n=' + n);
  eq('第一张已弹出', g.achQueue.length, n - 1);
  ok('第一张正在显示', hasClass(g.els.achCard, 'show'), '');
}

/* ================= 4. 右上角卡片：内容 / 音效 / 自动收起 / 排队 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.achResetState();
  g.ensureAudio();
  g.els.achCard.classList.remove('show');
  g.statsState.hv = 0;

  g.statsState.hv = 1;
  g.achCheck();
  eq('卡片图标', textOf(g.els.achCardIcon), '🌾');
  eq('卡片标题是成就名', textOf(g.els.achCardName), '初次丰收');
  ok('卡片写着描述', textOf(g.els.achCardDesc).indexOf('第 1 个作物') >= 0, textOf(g.els.achCardDesc));
  eq('卡片固定右上角（CSS 里 right/top）',
     html.indexOf('#achCard{') >= 0 && html.indexOf('right:14px;top:70px') >= 0, true);
  ok('解锁时播了音效', G.freqs.length > 0, 'freqs=' + G.freqs);

  /* 到时间自动收起 */
  for(let i=0;i<6;i++) g.update(0.5);
  ok('CARD_MS 后自动收起', !hasClass(g.els.achCard, 'show'), '');

  /* 队列里的第二张会自动接上 */
  g.statsState.hv = 10;
  g.achCheck();                         /* 解锁「小有收成」→ 立刻显示 */
  ok('第二张立刻显示', hasClass(g.els.achCard, 'show'), '');
  eq('第二张内容是「小有收成」', textOf(g.els.achCardName), '小有收成');
}

/* ================= 5. 成就墙：页签 / 滚动 / 20+ 条目 / 冻结 / 关闭 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.achResetState();
  ok('成就墙默认关闭', g.achOpen === false, '');
  ok('开局看不到成就墙', !hasClass(g.els.ach, 'open'), '');

  /* 从系统菜单打开 */
  g.toggleSys(true);
  eq('系统菜单打开', g.sysOpen, true);
  g.achOpenPanel();
  eq('成就墙打开', g.achOpen, true);
  eq('打开成就墙时系统菜单收起', g.sysOpen, false);
  ok('面板加了 open 类', hasClass(g.els.ach, 'open'), '');
  ok('成就墙复用统一开合动画', html.indexOf('#ach.open #achPanel{animation:panelIn') >= 0, '');
  ok('列表可滚动（max-height + overflow）',
     html.indexOf('#achList{max-height:300px;overflow-y:auto') >= 0, '');

  eq('页签 5 个（全部 + 四类）', g.els.achTabs.children.length, 5);
  eq('全部页显示 22 条', g.els.achList.children.length, g.CONFIG.ACHIEVEMENT.LIST.length);
  ok('20+ 条目一条不少', g.els.achList.children.length >= 20, 'n=' + g.els.achList.children.length);
  eq('统计行有 8 项', g.els.achStats.children.length, 8);
  ok('进度写着 0/22', textOf(g.els.achProg).indexOf('0/22') >= 0, textOf(g.els.achProg));
  ok('未解锁条目是灰色（off 类）', g.els.achList.children.every(r => hasClass(r, 'off')), '');
  ok('未解锁条目显示进度', arowText(g).every(t => t.indexOf('进度 ') >= 0), arowText(g)[0]);

  /* 已解锁用彩色（on 类） */
  g.statsState.hv = 100; g.achCheck();
  g.achRenderWall();
  const onRows = g.els.achList.children.filter(r => hasClass(r, 'on'));
  ok('已解锁条目用 on 类（彩色）', onRows.length >= 2, 'n=' + onRows.length);
  ok('已解锁写着已解锁', onRows.length && textOf(onRows[0]).indexOf('已解锁') >= 0, textOf(onRows[0] || {}));
  ok('灰色样式存在', html.indexOf('.arow.off .aico{filter:grayscale(1)') >= 0, '');

  /* 分类页签切换 */
  const goldTab = g.els.achTabs.children.find(b => b._atab === 'gold');
  ok('找到经济页签', !!goldTab, '');
  clickEl(goldTab);
  eq('点经济页签 → 当前页签 gold', g.achTab, 'gold');
  eq('经济类 6 条', g.els.achList.children.length,
     g.CONFIG.ACHIEVEMENT.LIST.filter(a => a.cat === 'gold').length);
  ok('经济页签高亮', hasClass(goldTab, 'on'), '');
  const farmTab = g.els.achTabs.children.find(b => b._atab === 'farm');
  clickEl(farmTab);
  eq('切到种植类 5 条', g.els.achList.children.length,
     g.CONFIG.ACHIEVEMENT.LIST.filter(a => a.cat === 'farm').length);
  clickEl(g.els.achTabs.children.find(b => b._atab === 'all'));
  eq('切回全部 22 条', g.els.achList.children.length, g.CONFIG.ACHIEVEMENT.LIST.length);

  /* 打开时冻结 */
  const m0 = g.clock.min;
  for(let i=0;i<20;i++) g.update(0.5);
  eq('成就墙打开时时间冻结', g.clock.min, m0);
  const hs = g.hotSel;
  key(G, '3');
  eq('成就墙打开时其它按键被忽略', g.hotSel, hs);
  key(G, 'escape');
  eq('Esc 关闭成就墙', g.achOpen, false);
  const m1 = g.clock.min;
  for(let i=0;i<4;i++) g.update(0.5);
  ok('关闭后时间恢复流动', g.clock.min !== m1, 'before=' + m1 + ' after=' + g.clock.min);

  /* 点遮罩关闭 */
  g.achOpenPanel();
  (g.els.achMask.__h['mousedown'] || []).forEach(fn => fn({preventDefault(){}}));
  eq('点遮罩也能关闭', g.achOpen, false);

  /* 系统菜单按钮也能打开 */
  g.toggleSys(true);
  clickEl(g.els.btnAch);
  eq('系统菜单里的「成就墙」按钮能打开', g.achOpen, true);
  g.achClosePanel();
}

/* ================= 6. 年度总结：第 41 天触发 / 内容 / 冻结 / 可关闭 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.achResetState();
  g.statsState = g.statsZero();
  g.statsState.dy = 40;
  g.statsState.hv = 12;
  g.statsState.inc = 800;
  g.statsState.af = 40;
  g.clock.day = 40;
  const yIdx = achIdx(g, 'year_one');
  eq('第 40 天还没解锁「活过一整年」', g.achHasUnlocked(yIdx), false);

  g.rollToNextMorning(false);
  eq('跨到第 41 天（第二年 1 月 1 日）', g.clock.day, 41);
  ok('触发年度总结（待弹出）', !!g.annualPending, JSON.stringify(g.annualPending));
  eq('总结是第 1 年', g.annualPending && g.annualPending.year, 1);
  eq('本年收成 = 12', g.annualPending && g.annualPending.hv, 12);
  eq('本年收入 = 800', g.annualPending && g.annualPending.inc, 800);
  eq('本年好感 = 40', g.annualPending && g.annualPending.af, 40);
  ok('「活过一整年」解锁', g.achHasUnlocked(yIdx), '');
  eq('本年基线更新', g.statsState.yh, 12);

  /* 睡醒后弹面板 */
  g.update(0.5);
  eq('年度总结面板打开', g.annualOpen, true);
  ok('面板加了 open 类', hasClass(g.els.annual, 'open'), '');
  ok('标题是第 1 年年度总结', textOf(g.els.annualTitle).indexOf('第 1 年') >= 0, textOf(g.els.annualTitle));
  const body = textOf(g.els.annualBody);
  ok('写着本年收成', body.indexOf('本年收成') >= 0 && body.indexOf('12') >= 0, body);
  ok('写着本年收入', body.indexOf('本年收入') >= 0 && body.indexOf('800') >= 0, body);
  ok('写着本年好感', body.indexOf('本年好感') >= 0 && body.indexOf('40') >= 0, body);
  ok('写着成就数', body.indexOf('本年成就') >= 0, body);
  ok('年度总结复用统一开合动画', html.indexOf('#annual.open #annualPanel{animation:panelIn') >= 0, '');

  /* 打开时冻结 */
  const m0 = g.clock.min;
  for(let i=0;i<20;i++) g.update(0.5);
  eq('年度总结打开时时间冻结', g.clock.min, m0);

  /* Esc 关闭 */
  key(G, 'escape');
  eq('Esc 关闭年度总结', g.annualOpen, false);
  const m1 = g.clock.min;
  for(let i=0;i<4;i++) g.update(0.5);
  ok('关闭后时间恢复流动', g.clock.min !== m1, 'before=' + m1 + ' after=' + g.clock.min);

  /* 同一年不会重复弹 */
  g.rollToNextMorning(false);
  eq('第 42 天不再弹', g.annualOpen, false);
  eq('也没有待弹总结', g.annualPending, null);
  g.update(0.5);
  eq('第 42 天 update 后也不弹', g.annualOpen, false);

  /* 第二年结束时再次触发 */
  g.clock.day = 80;
  g.rollToNextMorning(false);
  eq('第 81 天触发第 2 年', g.annualPending && g.annualPending.year, 2);
  g.update(0.5);
  eq('第 2 年总结弹出', g.annualOpen, true);
  /* 关闭按钮 */
  clickEl(g.els.annualClose);
  eq('按钮关闭年度总结', g.annualOpen, false);

  /* 点遮罩关闭 */
  g.annualOpen = true;
  (g.els.annualMask.__h['mousedown'] || []).forEach(fn => fn({preventDefault(){}}));
  eq('年度总结点遮罩关闭', g.annualOpen, false);

  /* 第 40 天之前不触发 */
  g.clock.day = 39;
  g.rollToNextMorning(false);
  eq('第 40 天不触发', g.annualPending, null);
}

/* ================= 7. 存档：数字数组 / 掩码 / 往返 / 体积 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.statsState.hv = 7; g.statsState.fs = 3; g.statsState.inc = 1234;
  g.statsState.bd = 2; g.statsState.af = 55; g.statsState.sl = 4;
  g.statsState.gs = 6; g.statsState.gc = 2; g.statsState.cv = 0b0101;
  g.statsState.dy = 9; g.statsState.di = 77; g.statsState.dd = g.clock.day;
  g.achState = {unl: 0b1001};

  const s = g.serializeState();
  ok('存档里有 st 字段', Array.isArray(s.st), typeof s.st);
  eq('统计是 16 个数字', s.st.length, 16);
  ok('统计每一项都是数字（不是对象）', s.st.every(n => typeof n === 'number'), JSON.stringify(s.st));
  ok('成就只存一个掩码', !!s.ach && typeof s.ach.u === 'number' && Object.keys(s.ach).length === 1,
     JSON.stringify(s.ach));
  ok('统计部分 < 120 字节', JSON.stringify(s.st).length < 120,
     JSON.stringify(s.st).length + ' 字节');
  ok('成就部分 < 20 字节', JSON.stringify(s.ach).length < 20, JSON.stringify(s.ach).length + ' 字节');

  const snap = JSON.parse(JSON.stringify(s));
  g.newGame();
  eq('新游戏统计清零', g.statsState.hv, 0);
  eq('新游戏成就清零', g.achState.unl, 0);
  eq('读档成功', g.deserializeState(snap), true);
  eq('读回收获数', g.statsState.hv, 7);
  eq('读回钓鱼数', g.statsState.fs, 3);
  eq('读回累计收入', g.statsState.inc, 1234);
  eq('读回好感总和', g.statsState.af, 55);
  eq('读回游玩天数', g.statsState.dy, 9);
  eq('读回睡觉次数', g.statsState.sl, 4);
  eq('读回作物掩码', g.statsState.cv, 0b0101);
  eq('读回今日收入', g.statsDailyIncome(), 77);
  eq('读回成就掩码', g.achState.unl, 0b1001);
  eq('读回后成就是否解锁一致', g.achHasUnlocked(0) && g.achHasUnlocked(3), true);

  /* 5 小时（~50 天）游玩后整档体积 */
  g.clock.day = 50;
  g.statsState.hv = 600; g.statsState.fs = 120; g.statsState.inc = 30000;
  g.statsState.gs = 300; g.statsState.gc = 40; g.statsState.sl = 50;
  g.achState = {unl: (1 << 22) - 1};
  const full = g.serializeState();
  const bytes = JSON.stringify(full).length;
  ok('5 小时游玩后存档仍 < 100KB', bytes < 100 * 1024, bytes + ' 字节');
  ok('统计 + 成就合起来只占几十字节',
     JSON.stringify(full.st).length + JSON.stringify(full.ach).length < 160,
     (JSON.stringify(full.st).length + JSON.stringify(full.ach).length) + ' 字节');

  /* 脏数据兜底 */
  let err = '';
  try{
    g.statsDeserialize(undefined);
    g.achDeserialize(null);
    g.statsDeserialize(['x', -5, NaN]);
    g.achDeserialize({u:'bad'});
  }catch(e){ err = e.message; }
  eq('脏统计 / 脏成就不抛错', err, '');
  eq('脏统计落到 0', g.statsState.hv, 0);
  eq('脏成就落到 0', g.achState.unl, 0);
}

/* ================= 8. 存档迁移：v6 → v7（旧档统计从 0 开始，不报错） ================= */
{
  const G = runGame(null);
  const g = G.X;
  const v6 = {v:6, gold:88, time:{day:9,min:0,hold:0}, seed:1, crops:[], inv:[],
              npc:{aff:{},gift:{},unl:{}}, dex:{f:0,g:0}, animals:[],
              quest:{r:3,d:1,i:2,o:[],a:[]}, fest:{p:0,d:0,c:0,b:0}};
  const m6 = g.migrate(v6);
  eq('v6 迁到 v9', m6.v, 12);
  ok('迁移补上 st 字段（16 个 0）',
     Array.isArray(m6.st) && m6.st.length === 16 && m6.st.every(n => n === 0), JSON.stringify(m6.st));
  ok('迁移补上 ach 字段（掩码 0）', !!m6.ach && m6.ach.u === 0, JSON.stringify(m6.ach));
  eq('迁移保留金币', m6.gold, 88);
  eq('迁移保留委托信誉', m6.quest.r, 3);
  eq('迁移保留节日积分', m6.fest.p, 0);

  const v1 = {v:1, gold:777, time:{day:5,min:120,hold:0}, seed:12345, inv:[], crops:{}};
  const m1 = g.migrate(v1);
  eq('v1 一步迁到 v9', m1.v, 12);
  eq('v1 迁移保留金币', m1.gold, 777);
  ok('v1 迁移同时补齐 quest / fest / st / ach',
     !!m1.quest && !!m1.fest && Array.isArray(m1.st) && !!m1.ach, '');
  eq('迁移失败仍降级而不是清档', g.migrateSave('not-a-save').degraded, true);

  /* 旧档读入：统计从 0 开始，不报错 */
  let okLoad = false;
  try{ okLoad = g.deserializeState(g.migrate(v6)); }catch(e){ okLoad = false; }
  eq('旧档迁移后能正常读入', okLoad, true);
  eq('旧档统计从 0 开始（收获）', g.statsState.hv, 0);
  eq('旧档统计从 0 开始（收入）', g.statsState.inc, 0);
  eq('旧档统计从 0 开始（天数）', g.statsState.dy, 0);
  eq('旧档成就是空的', g.achState.unl, 0);
  eq('旧档金币没有丢', g.gold, 88);
  /* 读入后行为照常累计 */
  g.statsState.hv = 0;
  const field = arena(g, g.FARM.x + 2, g.FARM.y + 5, 2, 2);
  const hi = field.y*64 + field.x;
  g.crops[hi] = {type:'radish', grown:3, stage:3, mature:true, watered:true, dead:false};
  g.setTile(hi, g.T.WATERED);
  put(g, field.x, field.y);
  g.harvestCrop(field.x, field.y);
  eq('旧档读入后统计正常开始累计', g.statsState.hv, 1);
  ok('旧档读入后成就也能解锁', g.achHasUnlocked(achIdx(g, 'harvest_first')), '');
}

/* ================= 9. 回归：旧系统没被改坏 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();

  /* 收获 */
  const field = arena(g, g.FARM.x + 2, g.FARM.y + 5, 3, 3);
  const i0 = field.y*64 + field.x;
  g.crops[i0] = {type:'potato', grown:5, stage:3, mature:true, watered:true, dead:false};
  g.setTile(i0, g.T.WATERED);
  put(g, field.x, field.y);
  const before = g.countItem('potato');
  eq('收获仍能收进背包', g.harvestCrop(field.x, field.y), true);
  eq('收获数量正确', g.countItem('potato') - before, 1);

  /* 商店 */
  g.gold = 500;
  const seeds0 = g.countItem('seed_radish');
  g.shopBuyClick('seed_radish');
  eq('商店仍能买种子', g.countItem('seed_radish') - seeds0, 1);

  /* 钓鱼 */
  const f = g.CONFIG.FISHING.LIST[0];
  g.fishing.fish = f; g.fishing.pointer = 0.5; g.fishing.zone = 0.5;
  g.fishing.zoneW = 0.4; g.fishing.state = 'reel';
  eq('钓鱼仍能收杆', g.fishingResolveReel(), true);

  /* 建造 / 委托 / NPC / 动物 */
  g.addItem('wood', 100); g.addItem('stone', 100);
  eq('建造仍能放', build(g, 'fence', field.x + 1, field.y + 1), true);
  ok('委托板仍有 3 个委托', g.quests.offers.length === 3, '');
  ok('NPC 对话仍能开', g.npcOpenDialog(g.npcDef('aunt')) === true, '');
  g.npcCloseDialog();
  ok('动物存档函数还在', typeof g.animalSerialize === 'function', '');
  ok('委托存档函数还在', typeof g.questSerialize === 'function', '');

  /* 日历 / 节日 / 睡觉 */
  const d0 = g.clock.day;
  g.sleepFx.phase = 'none';
  g.rollToNextMorning(false);
  eq('睡觉翻天仍然正常', g.clock.day, d0 + 1);
  eq('节日系统还在', g.CONFIG.FESTIVAL.LIST.length, 4);

  /* 序列化往返 / 版本 */
  eq('序列化 / 反序列化还能用', g.deserializeState(g.serializeState()), true);
  eq('版本号 = 9', g.CONFIG.SAVE.VERSION, 12);
  ok('季节 / 天气 / 图鉴 / 背包都没被破坏',
     g.CONFIG.SEASONS.length === 4 && !!g.weather && !!g.dexState &&
     Array.isArray(g.inv), '');
}

/* ---------- 汇总 ---------- */
console.log(results.join('\n'));
console.log('\n通过 ' + pass + ' / 失败 ' + fail);
if(fail) process.exitCode = 1;
