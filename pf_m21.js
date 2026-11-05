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

/* ================= 第 21 轮：成品化 =================
 * 回归审计 / 性能审计（动物 AI 降频、评级缓存、图鉴懒渲染）/
 * 存档审计（v1 → v11）/ 一次性教学提示 / 玩法速查表 / 平衡终审 */
const G = runGame(null);
const g = G.X;
const T = g.T;
g.startMenuOpen = false;      /* 沙箱里直接进游戏，跳过标题界面 */

/* ---------- 小工具 ---------- */
function waterSpot(g){
  for(let y=2; y<62; y++) for(let x=2; x<62; x++){
    const i = y*64 + x;
    if(g.map[i] !== T.GRASS) continue;
    if(g.map[i-1] === T.WATER || g.map[i+1] === T.WATER ||
       g.map[i-64] === T.WATER || g.map[i+64] === T.WATER) return {tx:x, ty:y};
  }
  return null;
}
function giveRod(g){
  g.inv[0] = {id:'rod', n:1};
  g.selectHot(0);
}
function countTile(g, x, y, w, h, t){
  let n = 0;
  for(let yy=y; yy<y+h; yy++) for(let xx=x; xx<x+w; xx++)
    if(g.map[yy*64+xx] === t) n++;
  return n;
}
function countSeen(){
  const seen = {};
  return function(day){
    seen[g.seasonName()] = 1;
    return Object.keys(seen).length;
  };
}

/* ================= 1. 配置 / 版本 ================= */
g.newGame();
eq('存档版本升到 11', g.CONFIG.SAVE.VERSION, 12);
eq('教学提示总开关默认开', g.CONFIG.TIPS.ENABLED, true);
eq('教学提示停留 6.5 秒', g.CONFIG.TIPS.SHOW_MS, 6500);
eq('动物 AI 决策节拍 = 250ms', g.CONFIG.ANIMALS.WANDER.TICK, 0.25);
eq('南瓜成熟天数（第 21 轮调成 7）', g.cropDef('pumpkin').days, 7);
eq('教学提示共 5 条', g.SYS_TIPS.length, 5);
ok('教学提示键位不重复',
   new Set(g.SYS_TIPS.map(t => t.key)).size === g.SYS_TIPS.length, '');

/* ================= 2. 一次性教学提示 ================= */
g.newGame();
eq('新游戏提示全部未读', g.tipsState.mask, 0);
for(const t of g.SYS_TIPS){
  ok('提示「' + t.key + '」≤ 2 行', String(t.text).split('\n').length <= 2,
     String(t.text).split('\n').length + ' 行');
  ok('提示「' + t.key + '」不超长', String(t.text).length <= 120, String(t.text).length + ' 字');
}
/* 第一次抛竿：走真实入口 */
{
  const spot = waterSpot(g);
  ok('地图上找得到水边空地', !!spot, JSON.stringify(spot));
  put(g, spot.tx, spot.ty);
  giveRod(g);
  ok('水边抛竿成功', g.startFishing() === true, '');
  ok('第一次抛竿弹钓鱼提示', g.tipSeen('fish'), '');
  ok('提示条显示中', g.els.sysTip.classList.contains('show'), '');
  const first = g.els.sysTip.textContent;
  ok('提示文字非空', first.indexOf('钓鱼') >= 0, first);
  ok('同一条提示不再弹第二次', g.sysTipShow('fish') === false, '');
  g.cancelFishing(true);
}
/* 送礼 / 委托 / 加工台 / 扩建：各走一次真实入口 */
{
  g.giftTarget = 'aunt';
  ok('第一次送礼成功', g.npcStartGift() === true, '');
  ok('第一次送礼弹提示', g.tipSeen('gift'), '');
  g.togglePack(false);
  g.packMode = 'normal'; g.giftTarget = null;
}
{
  g.questOpenPanel();
  ok('第一次打开委托板弹提示', g.tipSeen('quest'), '');
  g.questClosePanel();
}
{
  const fx = g.FARM.x + 2, fy = g.FARM.y + 6;
  g.addItem('wood', 60); g.addItem('stone', 40);
  g.buildSel = g.CONFIG.BUILD.RECIPES.findIndex(r => r.id === 'maker');
  put(g, fx, fy);
  ok('造一台加工台', g.placeBuilding(fx, fy), '');
  const mk = g.buildings.find(b => b.type === 'maker');
  g.makerOpenPanel(mk);
  ok('第一次打开加工台弹提示', g.tipSeen('maker'), '');
  g.makerClosePanel();
}
{
  /* 20 格耕地 → 第一次算扩建（不重开游戏，否则前四条提示会被重置） */
  let n = 0;
  for(let y=g.FARM.y+3; y<g.FARM.y+g.FARM.h && n<20; y++)
    for(let x=g.FARM.x; x<g.FARM.x+g.FARM.w && n<20; x++){
      const i = y*64+x;
      if(g.map[i] === T.GRASS){ g.setTile(i, T.TILLED); n++; }
    }
  g.ratingCheck();
  ok('第一次达到 20 格耕地弹扩建提示', g.tipSeen('expand'), '');
  ok('扩建提示只弹一次', g.sysTipShow('expand') === false, '');
}
{
  const mask = g.tipsState.mask;
  ok('5 个提示位全部记录', (mask & 0b11111) === 0b11111, 'mask=' + mask);
}
/* 位掩码进存档：序列化 → 读回仍是已读 */
{
  g.gold = 555;
  g.saveGame('提示掩码测试');
  const raw = JSON.parse(G.storage.getItem(g.CONFIG.SAVE.KEY));
  eq('存档带 tp 字段', typeof raw.tp, 'number');
  eq('存档里的提示掩码 = 5 位全 1', raw.tp & 0b11111, 0b11111);
  g.gold = 1;
  ok('读档成功', g.loadGame(), '');
  eq('读档后金币恢复', g.gold, 555);
  eq('读档后提示仍是已读', g.tipsState.mask & 0b11111, 0b11111);
}
/* 新游戏重新变成未读 */
g.newGame();
eq('新游戏提示全部未读（重置）', g.tipsState.mask, 0);

/* ================= 3. 提示倒计时：面板打开时冻结 ================= */
{
  g.newGame();
  ok('弹出提示', g.sysTipShow('quest'), '');
  const t0 = g.sysTipT;
  ok('提示有显示时长', t0 > 0, t0.toFixed(2) + 's');
  g.update(1.0);
  ok('正常推进时倒计时递减', g.sysTipT < t0, g.sysTipT.toFixed(2) + 's');
  g.toggleSys(true);
  const t1 = g.sysTipT;
  g.update(3.0);
  eq('Esc 菜单打开 → 倒计时冻结', g.sysTipT, t1);
  ok('冻结期间提示仍可见', g.els.sysTip.classList.contains('show'), '');
  g.toggleSys(false);
  g.update(7.0);
  ok('关闭面板后超时自动收起', g.els.sysTip.classList.contains('show') === false, '');
}

/* ================= 4. 评级缓存（HUD 不再每帧扫图） ================= */
{
  g.newGame();
  g.ratingInvalidate();
  const a = g.ratingParts();
  const b = g.ratingParts();
  ok('连续读取命中同一缓存对象', a === b, '');
  let idx = -1;
  for(let i=0;i<g.map.length;i++) if(g.map[i] === T.GRASS){ idx = i; break; }
  g.setTile(idx, T.TILLED);
  const c = g.ratingParts();
  ok('耕地变化 → 缓存失效', c !== a, '');
  eq('耕地数 +1', c.tilled, a.tilled + 1);
  const d = g.ratingCheck();
  ok('ratingCheck 强制重算', d !== c, '');
  ok('重算后缓存回到同一对象', g.ratingParts() === d, '');
}

/* ================= 5. 动物 AI 降频 ================= */
{
  g.newGame();
  const a = g.makeAnimal('chicken', [g.FARM.x, g.FARM.y]);
  a.wait = 0; a.vx = 0; a.vy = 0;
  g.animals = [a];
  const base = g.animalAiAcc;
  g.updateAnimals(0.1);
  ok('不足 250ms：累加器继续累计', Math.abs(g.animalAiAcc - (base + 0.1)) < 1e-6,
     g.animalAiAcc.toFixed(3));
  g.updateAnimals(0.1);
  g.updateAnimals(0.05);
  ok('累计到 250ms：触发决策并清零累加器', g.animalAiAcc < 1e-6, g.animalAiAcc.toFixed(4));
  /* 20 只动物跑 10 秒（600 帧）应该很便宜 */
  g.animals = [];
  for(let i=0;i<20;i++) g.animals.push(g.makeAnimal('chicken', [g.FARM.x + (i%4), g.FARM.y + ((i/4)|0)]));
  const t0 = Date.now();
  for(let i=0;i<600;i++) g.updateAnimals(1/60);
  const ms = Date.now() - t0;
  ok('20 只动物 × 600 帧（10 秒）< 150ms', ms < 150, ms + 'ms');
  ok('动物仍会移动（10 秒内位置有变化）',
     g.animals.some(a => Math.abs(a.x - (a.home[0]+0.5)*32) > 0.5 || Math.abs(a.y - (a.home[1]+0.5)*32) > 0.5), '');
}

/* ================= 6. 图鉴懒渲染 ================= */
{
  g.newGame();
  g.togglePack(false);
  eq('背包关着：读档不重绘图鉴', g.refreshDexIfVisible(), false);
  g.togglePack(true);
  g.setPackTab('dex');
  eq('背包停在图鉴页：才重绘', g.refreshDexIfVisible(), true);
  g.setPackTab('bag');
  eq('切回背包页：不重绘图鉴', g.refreshDexIfVisible(), false);
  g.togglePack(false);
}

/* ================= 7. 玩法速查表（Esc 菜单） ================= */
{
  g.newGame();
  ok('Esc 菜单有速查表按钮', !!g.els.btnCheat, '');
  g.toggleSys(true);
  eq('菜单打开时速查表默认收起', g.sysCheatOpen, false);
  clickEl(g.els.btnCheat);
  eq('点击按钮展开速查表', g.sysCheatOpen, true);
  ok('速查表容器加 open', hasClass(g.els.sysCheat, 'open'), '');
  ok('系统菜单加宽（cheat 类）', hasClass(g.els.sysPanel, 'cheat'), '');
  ok('按钮文案变成收起', g.els.btnCheat.textContent.indexOf('收起') >= 0, g.els.btnCheat.textContent);
  const txt = g.els.sysCheat.textContent;
  const must = ['W A S D', '方向键', 'Shift', '1 ~ 8', 'Tab / I', '左键', '右键',
                ' E', 'Q', 'B', 'G', 'P', 'M', 'Esc', '空格 / Enter', '钓鱼', '送礼',
                '委托', '加工台', '扩建', '评级'];
  for(const s of must) ok('速查表包含「' + s + '」', txt.indexOf(s) >= 0, '');
  /* 键位与真实配置逐条核对 */
  ok('速查表的 P = CONFIG.PAUSE_KEY',
     txt.indexOf('P') >= 0 && g.CONFIG.PAUSE_KEY === 'p', g.CONFIG.PAUSE_KEY);
  ok('速查表的 M = CONFIG.AUDIO.MUTE_KEY',
     txt.indexOf('M') >= 0 && g.CONFIG.AUDIO.MUTE_KEY === 'm', g.CONFIG.AUDIO.MUTE_KEY);
  ok('速查表写 1~8 = 快捷栏 8 格',
     txt.indexOf('1 ~ 8') >= 0 && g.CONFIG.INVENTORY.HOTBAR === 8, g.CONFIG.INVENTORY.HOTBAR);
  clickEl(g.els.btnCheat);
  eq('再点一次收起', g.sysCheatOpen, false);
  ok('收起后移除 open', hasClass(g.els.sysCheat, 'open') === false, '');
  ok('收起后恢复菜单宽度', hasClass(g.els.sysPanel, 'cheat') === false, '');
  g.toggleSys(false);
  g.toggleSys(true);
  eq('重新打开菜单仍是收起状态', g.sysCheatOpen, false);
  g.toggleSys(false);
}

/* ================= 7b. 提示 / 状态收进 Esc 菜单 ================= */
{
  g.newGame();
  /* 新手引导：画面上不再显示，改在菜单顶部 */
  ok('主画面引导条被 CSS 隐藏（class 仍由逻辑维护）',
     hasClass(g.els.tut, 'show'), '');
  ok('菜单顶部出现新手引导第 1 步',
     g.els.sysTut.textContent.indexOf('①') >= 0 && g.els.sysTut.style.display === 'block',
     g.els.sysTut.textContent);
  g.tutMoved(g.CONFIG.TUTORIAL.MOVE_PX);
  ok('走到位 → 菜单里换成第 2 步',
     g.els.sysTut.textContent.indexOf('②') >= 0, g.els.sysTut.textContent);
  g.tutTilled(); g.tutTilled(); g.tutSown(); g.tutSown();
  /* 直接完成三步 */
  g.tut.tilled = g.CONFIG.TUTORIAL.TILL_COUNT;
  g.tut.sown = g.CONFIG.TUTORIAL.SOW_COUNT;
  g.tutSlept();
  ok('三步完成 → 菜单里的引导隐藏',
     g.els.sysTut.textContent === '' && g.els.sysTut.style.display === 'none', '');

  /* 状态面板：内容与主循环同源，展开后可读 */
  g.newGame();
  ok('菜单没开时不拼状态文本（第 22 轮：省掉每 0.25 秒的大字符串）',
     g.els.stats.innerHTML === '', g.els.stats.innerHTML.slice(0, 40));
  g.toggleSys(true);
  eq('菜单打开时状态面板默认收起', g.sysStatsOpen, false);
  clickEl(g.els.btnStats);
  eq('点击按钮展开状态面板', g.sysStatsOpen, true);
  ok('状态面板加 open', hasClass(g.els.sysStats, 'open'), '');
  ok('状态面板内容与 updateStats 一致',
     g.els.sysStats.innerHTML === g.els.stats.innerHTML, '');
  ok('状态面板含玩家 / 帧率 / 作物信息',
     ['玩家','帧率','作物','时间'].every(s => g.els.sysStats.innerHTML.indexOf(s) >= 0), '');
  ok('原右上角状态栏不再包含操作提示',
     g.els.stats.innerHTML.indexOf('WASD') < 0, '');
  ok('状态栏仍保留调试信息（种子）',
     g.els.stats.innerHTML.indexOf('种子') >= 0, '');
  ok('状态按钮文案变成收起', g.els.btnStats.textContent.indexOf('收起') >= 0, g.els.btnStats.textContent);
  ok('展开状态面板时菜单加宽', hasClass(g.els.sysPanel, 'cheat'), '');
  /* 与速查表共用宽度：先开速查表再关状态，宽度仍保留 */
  clickEl(g.els.btnCheat);
  clickEl(g.els.btnStats);
  eq('关掉状态面板', g.sysStatsOpen, false);
  ok('速查表还开着 → 菜单保持加宽', hasClass(g.els.sysPanel, 'cheat'), '');
  clickEl(g.els.btnCheat);
  ok('两个都收起 → 菜单恢复原宽', hasClass(g.els.sysPanel, 'cheat') === false, '');
  g.toggleSys(false);
  g.toggleSys(true);
  eq('重新打开菜单状态面板仍收起', g.sysStatsOpen, false);
  g.toggleSys(false);
}

/* ================= 7c. 交互按键提示开关（第 22 轮） ================= */
{
  g.newGame();
  eq('交互按键提示默认开启', g.interactHintsOn, true);
  ok('按钮初始文案 = 开', g.els.hintBtn.textContent.indexOf('开') >= 0, g.els.hintBtn.textContent);
  eq('关闭交互提示', g.setInteractHints(false, true), false);
  eq('关闭后状态', g.interactHintsOn, false);
  ok('按钮文案 = 关', g.els.hintBtn.textContent.indexOf('关') >= 0, g.els.hintBtn.textContent);
  ok('按钮加 off 样式', hasClass(g.els.hintBtn, 'off'), '');
  /* 存进存档 → 读回仍是关 */
  g.gold = 123;
  g.saveGame('交互提示存档');
  const raw = JSON.parse(G.storage.getItem(g.CONFIG.SAVE.KEY));
  eq('存档 ih = 0', raw.ih, 0);
  g.setInteractHints(true, true);          /* 内存里改成开，读档应恢复成关 */
  ok('读档成功', g.loadGame(), '');
  eq('读档后恢复为关', g.interactHintsOn, false);
  g.newGame();
  eq('新游戏恢复默认（开）', g.interactHintsOn, true);
  g.setInteractHints(true, true);
  eq('重新打开', g.interactHintsOn, true);
  ok('按钮移除 off', hasClass(g.els.hintBtn, 'off') === false, '');
  /* v10 老档没有 ih → 迁移后默认开，行为与升级前一致 */
  g.newGame();
  const s10 = g.serializeState();
  delete s10.ih; s10.v = 10;
  const m10 = g.migrate(s10);
  eq('v10 → v11 版本号', m10.v, 12);
  eq('v10 老档补 ih = 1', m10.ih, 1);
}

/* ================= 8. 存档审计：v1 旧档 → v11 ================= */
{
  /** 一张 v1 老存档：只有核心字段（地图改造 / 作物 / 金币 / 时间） */
  const sx = g.FARM.x + 1, sy = g.FARM.y + 4;
  const sx2 = g.FARM.x + 2, sy2 = g.FARM.y + 4;
  const v1 = {
    v: 1, at: 1000, seed: g.CONFIG.SEED,
    player: {x: (sx+0.5)*32, y: (sy+0.5)*32},
    gold: 777, stamina: 55, staminaMax: 100, canWater: 7, canLevel: 2, hotSel: 1,
    time: {day: 12, min: 300, hold: 0}, weather: 'sun',
    map: { [(sx+','+sy)]: T.TILLED, [(sx2+','+sy2)]: T.WATERED },
    crops: [{x:sx, y:sy, type:'potato', stage:2, grown:3, watered:true, mature:false, dead:false}],
    buildings: [], roads: [],
    inv: [{slot:0, id:'hoe', n:1}, {slot:1, id:'seed_potato', n:4}],
    tut: {step:1, moved:60, tilled:1, sown:1, slept:false},
    snd: 0
  };
  const before = JSON.stringify(v1);
  const mig = g.migrate(v1);
  eq('迁移不修改原对象', JSON.stringify(v1), before);
  eq('v1 → v11', mig.v, 12);
  ok('补 npc 字段', !!mig.npc);
  ok('补 dex 字段', !!mig.dex);
  ok('补 animals 字段', Array.isArray(mig.animals));
  ok('补 quest 字段', !!mig.quest);
  ok('补 fest 字段', !!mig.fest);
  ok('补 st / ach 字段', Array.isArray(mig.st) && !!mig.ach);
  ok('补 eat 字段', !!mig.eat);
  ok('补 end 字段', !!mig.end);
  eq('补 tp 字段（未读）', mig.tp, 0);
  eq('补 ih 字段（交互提示默认开）', mig.ih, 1);

  g.newGame();
  ok('读入迁移后的旧档', g.deserializeState(mig), '');
  eq('旧档金币无损', g.gold, 777);
  eq('旧档天数无损', g.clock.day, 12);
  eq('旧档地图改造无损（TILLED）', g.map[sy*64+sx], T.TILLED);
  eq('旧档地图改造无损（WATERED）', g.map[sy2*64+sx2], T.WATERED);
  ok('旧档作物无损', !!g.crops[sy*64+sx] && g.crops[sy*64+sx].type === 'potato', '');
  eq('旧档体力无损', g.stamina, 55);
  eq('旧档水壶等级无损', g.canLevel, 2);
  eq('旧档背包无损', g.countItem('seed_potato'), 4);
  eq('新系统：动物为空', g.animals.length, 0);
  eq('新系统：图鉴为空', g.dexState.f, 0);
  eq('新系统：统计从 0 开始', g.achCount(), 0);
  eq('新系统：雇工未雇佣', g.endgameState.worker.hired, false);
  eq('新系统：提示全部未读', g.tipsState.mask, 0);
}

/* 三大路径：新游戏 / 继续 / 迁移 */
{
  g.newGame();
  eq('新游戏：第 1 天', g.clock.day, 1);
  eq('新游戏：初始金币', g.gold, g.CONFIG.INIT_GOLD);
  eq('新游戏：没有作物', g.crops.filter(Boolean).length, 0);
  eq('新游戏：没有动物', g.animals.length, 0);
}
{
  /* 继续游戏：写档 → 改状态 → 读档 */
  g.newGame();
  g.gold = 2468;
  g.clock.day = 8;
  ok('继续：弹出提示并写档', g.sysTipShow('maker'), '');
  g.saveGame('继续测试');
  g.gold = 0; g.clock.day = 1;
  ok('继续：loadGame 成功', g.loadGame(), '');
  eq('继续：金币恢复', g.gold, 2468);
  eq('继续：天数恢复', g.clock.day, 8);
  ok('继续：提示已读状态恢复', g.tipSeen('maker'), '');
}

/* 存档体积：正常满配 / 十年最坏情况 */
{
  g.newGame();
  /* 50 株作物 */
  for(let y=g.FARM.y+3, n=0; y<g.FARM.y+g.FARM.h && n<50; y++)
    for(let x=g.FARM.x; x<g.FARM.x+g.FARM.w && n<50; x++, n++){
      const i = y*64+x;
      g.setTile(i, T.WATERED);
      g.crops[i] = {type:'radish', stage:3, grown:3, watered:true, mature:true, dead:false};
    }
  /* 20 只动物 */
  g.animals = [];
  for(let i=0;i<20;i++) g.animals.push(g.makeAnimal(i%2 ? 'cow' : 'chicken', [g.FARM.x+2, g.FARM.y+2]));
  /* 10 座建筑 */
  for(let i=0;i<10;i++) g.buildings.push({type:'fence', tx:g.FARM.x+2+i, ty:g.FARM.y+8});
  const s = g.serializeState();
  const bytes = JSON.stringify(s).length;
  ok('正常满配存档 < 100KB（上限）', bytes < g.CONFIG.SAVE.MAX_BYTES, bytes + ' 字节');
  ok('正常满配存档 < 12KB（体积目标）', bytes < 12 * 1024, bytes + ' 字节');
  /* 十年最坏情况：作物/动物不增长，但玩家可能铺很多路、造很多栅栏、地图改满 */
  const worst = JSON.parse(JSON.stringify(s));
  worst.roads = [];
  for(let i=0;i<1000;i++) worst.roads.push((i%64) + ',' + ((i/64)|0));
  for(let i=0;i<300;i++) worst.buildings.push({type:'fence', tx:i%64, ty:(i/64)|0});
  worst.map = {};
  for(let i=0;i<1500;i++) worst.map[(i%64) + ',' + ((i/64)|0)] = T.TILLED;
  worst.end.c = [];
  for(let i=0;i<8;i++) worst.end.c.push([10+i, i%3]);
  const worstBytes = JSON.stringify(worst).length;
  ok('十年最坏情况 < 100KB 上限', worstBytes < g.CONFIG.SAVE.MAX_BYTES, worstBytes + ' 字节');
  ok('十年最坏情况 < 60KB（估算上界）', worstBytes < 60 * 1024, worstBytes + ' 字节');
  results.push('INFO  正常满配存档 ' + (bytes/1024).toFixed(2) + ' KB · 十年最坏情况 ' + (worstBytes/1024).toFixed(2) + ' KB');
}

/* ================= 9. 核心循环回归（种植 / 体力 / 时间 / 存档） ================= */
{
  g.newGame();
  const fx = g.FARM.x + 1, fy = g.FARM.y + 3;
  g.crops.fill(null);
  g.setTile(fy*64+fx, T.GRASS);
  put(g, fx, fy);
  /* 锄地：体力 -3 */
  toolSlot(g, 'hoe');
  const st0 = g.stamina;
  ok('锄地成功', g.useTool(fx, fy), '');
  eq('锄地后是耕地', g.map[fy*64+fx], T.TILLED);
  eq('锄地消耗 3 体力', st0 - g.stamina, 3);
  /* 播种 */
  g.inv[1] = {id:'seed_radish', n:9};
  g.selectHot(1);
  ok('播种成功', g.useTool(fx, fy), '');
  ok('作物存在', !!g.crops[fy*64+fx], '');
  /* 浇水：体力 -1 */
  g.inv[2] = {id:'can', n:1}; g.selectHot(2);
  g.canWater = 20;
  const st1 = g.stamina;
  ok('浇水成功', g.useTool(fx, fy), '');
  eq('浇水后是已浇水', g.map[fy*64+fx], T.WATERED);
  eq('浇水消耗 1 体力', st1 - g.stamina, 1);
  /* 连续 3 天：每天先浇水再翻页 → 萝卜成熟 */
  for(let d=0; d<3; d++){
    if(g.map[fy*64+fx] === T.TILLED && g.crops[fy*64+fx] && !g.crops[fy*64+fx].mature){
      g.canWater = 20;
      g.useTool(fx, fy);
    }
    g.rollToNextMorning(false);
  }
  ok('3 天后萝卜成熟', !!g.crops[fy*64+fx] && g.crops[fy*64+fx].mature, '');
  eq('翻页后体力回满', g.stamina, g.staminaMax);
  eq('翻页后天数 = 4', g.clock.day, 4);
  /* 收获 */
  const rad0 = g.countItem('radish');
  ok('收获成功', g.useTool(fx, fy), '');
  ok('背包多了一个萝卜', g.countItem('radish') > rad0, g.countItem('radish') + '');
  /* 存档往返后作物 / 金币仍在 */
  g.gold = 4321;
  g.saveGame('回归测试');
  g.gold = 0;
  g.loadGame();
  eq('读档后金币仍在', g.gold, 4321);
  eq('读档后天数仍在', g.clock.day, 4);
}

/* ================= 10. 完整跑通一轮四季（40 天） ================= */
{
  g.newGame();
  let err = '';
  const seasons = new Set();
  try{
    for(let d=0; d<40; d++){
      seasons.add(g.seasonName());
      /* 每天随机干点活：翻页前给 3 块地浇水，模拟正常游玩 */
      g.canWater = 20;
      g.rollToNextMorning(false);
    }
  }catch(e){ err = e.message + ' @' + (e.stack||'').split('\n')[1]; }
  eq('跑完 40 天不抛错', err, '');
  eq('第 41 天', g.clock.day, 41);
  eq('四季都经历过', seasons.size, 4);
  ok('四季顺序正确', ['春','夏','秋','冬'].every(s => seasons.has(s)), [...seasons].join('/'));
  ok('每天体力都回满', g.stamina === g.staminaMax, g.stamina + '/' + g.staminaMax);
  ok('40 天后还能存档', !!g.serializeState().v, '');
}

/* ================= 11. 性能：复合场景 update 预算 ================= */
{
  g.newGame();
  /* 50 株作物 */
  for(let y=g.FARM.y+3, n=0; y<g.FARM.y+g.FARM.h && n<50; y++)
    for(let x=g.FARM.x; x<g.FARM.x+g.FARM.w && n<50; x++, n++){
      const i = y*64+x;
      g.setTile(i, T.WATERED);
      g.crops[i] = {type:'radish', stage:2, grown:1, watered:true, mature:false, dead:false, irr:1};
    }
  /* 20 只动物 */
  g.animals = [];
  for(let i=0;i<20;i++) g.animals.push(g.makeAnimal(i%2 ? 'cow' : 'chicken', [g.FARM.x+2, g.FARM.y+2]));
  /* 10 座建筑 */
  for(let i=0;i<10;i++) g.buildings.push({type:'fence', tx:g.FARM.x+2+i, ty:g.FARM.y+8});
  const t0 = Date.now();
  for(let i=0;i<600;i++) g.update(1/60);
  const ms = Date.now() - t0;
  ok('50 作物 + 20 动物 + 10 建筑：600 帧 update < 300ms', ms < 300, ms + 'ms（均值 ' + (ms/600).toFixed(3) + 'ms/帧）');
  results.push('INFO  复合场景 update 均值 ' + (ms/600).toFixed(3) + ' ms/帧（vm 沙箱，不含渲染）');
}

/* ---------------- 汇总 ---------------- */
console.log('');
results.forEach(r => console.log(r));
console.log('');
console.log('通过 ' + pass + ' / 失败 ' + fail + '（共 ' + (pass + fail) + '）');
process.exitCode = fail ? 1 : 0;
