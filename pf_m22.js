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

/* ================= 第 22 轮：审计整改 =================
 * 1) 雨天自动浇水 / 雪天减速（天气终于有玩法影响）
 * 2) drawAnimal 每帧 O(n²) → 每帧只算一次 nearest
 * 3) updateStats 不再每 0.25 秒拼大字符串
 * 4) tilledPlots 改增量维护（不再扫 4096 格）
 * 5) 小问题：送礼 removeItem 检查 / 委托 kind 生成顺序 / 浇水状态上屏 */
const G = runGame(null);
const g = G.X;
const T = g.T;
g.startMenuOpen = false;

/* ---------- 小工具 ---------- */
function grassSpot(g){
  for(let y = g.FARM.y + 2; y < g.FARM.y + g.FARM.h; y++)
    for(let x = g.FARM.x; x < g.FARM.x + g.FARM.w; x++){
      const i = y * 64 + x;
      if(g.map[i] === T.GRASS) return {i:i, x:x, y:y};
    }
  return null;
}
function plant(g, i, type){
  g.crops[i] = {type:type || 'radish', stage:0, grown:0, watered:false, mature:false, dead:false};
  return g.crops[i];
}
function setWeather(id){
  const w = g.CONFIG.WEATHER.find(x => x.id === id);
  g.weather = {id:w.id, name:w.name, icon:w.icon};
  return g.weather;
}

/* ================= 1. 配置 ================= */
g.newGame();
eq('雨天自动浇水默认开', g.CONFIG.WEATHER_FX.RAIN_AUTO_WATER, true);
eq('雪天减速倍率 = 0.75', g.CONFIG.WEATHER_FX.SNOW_SLOW, 0.75);

/* ================= 2. 雨天自动浇水 ================= */
{
  g.newGame();
  const s = grassSpot(g);
  ok('找得到空地', !!s, JSON.stringify(s));
  g.setTile(s.i, T.TILLED);
  plant(g, s.i);

  setWeather('sun');
  eq('晴天不浇水', g.applyRain(), 0);
  eq('晴天地块保持耕地', g.map[s.i], T.TILLED);

  setWeather('rain');
  const n = g.applyRain();
  eq('雨天浇了 1 格', n, 1);
  eq('雨天地块变成已浇水', g.map[s.i], T.WATERED);
  ok('雨天作物标记已浇水', g.crops[s.i].watered === true, '');
  /* 再浇一次仍是 1 格（不重复计数） */
  eq('重复调用不重复计数', g.applyRain(), 1);
}
{
  /* 结算：雨天作物当晚照常生长 */
  g.newGame();
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  plant(g, s.i);
  setWeather('rain');
  g.settleDay();
  eq('雨天作物当晚生长 1 天', g.crops[s.i].grown, 1);
  eq('雨后地块重置为耕地', g.map[s.i], T.TILLED);
}
{
  /* 结算：晴天没浇水就不长 */
  g.newGame();
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  plant(g, s.i);
  setWeather('sun');
  g.settleDay();
  eq('晴天没浇水不生长', g.crops[s.i].grown, 0);
}
{
  /* 雨天 + 枯萎作物：不浇枯萎的那格 */
  g.newGame();
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  const c = plant(g, s.i);
  c.dead = true;
  setWeather('rain');
  eq('枯萎作物不计入雨浇格数', g.applyRain(), 0);
  eq('枯萎作物地块不变', g.map[s.i], T.TILLED);
}

/* ================= 3. 雪天减速 ================= */
{
  g.newGame();
  setWeather('sun');
  g.keys['d'] = true;
  g.updatePlayer(1 / 60);
  const sunSp = Math.abs(g.player.vx);
  eq('晴天速度 = CONFIG.PLAYER.SPEED', Math.round(sunSp), Math.round(g.CONFIG.PLAYER.SPEED));
  g.keys['d'] = false;
  g.player.vx = 0;

  setWeather('snow');
  g.keys['d'] = true;
  g.updatePlayer(1 / 60);
  const snowSp = Math.abs(g.player.vx);
  eq('雪天速度 = 晴天 × 0.75', Math.round(snowSp), Math.round(sunSp * 0.75));
  ok('雪天确实更慢', snowSp < sunSp, snowSp + ' < ' + sunSp);
  g.keys['d'] = false;
}

/* ================= 4. 耕地增量计数 ================= */
{
  g.newGame();
  eq('新地图耕地数 = 0', g.tilledPlots(), 0);
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  eq('锄一格 → 耕地数 1', g.tilledPlots(), 1);
  g.setTile(s.i, T.WATERED);
  eq('浇水不改变耕地数', g.tilledPlots(), 1);
  g.setTile(s.i, T.GRASS);
  eq('还原成草地 → 耕地数 0', g.tilledPlots(), 0);
  /* 连续锄 25 格 → 扩建 1 期 */
  let n = 0;
  for(let y = g.FARM.y; y < g.FARM.y + g.FARM.h && n < 25; y++)
    for(let x = g.FARM.x; x < g.FARM.x + g.FARM.w && n < 25; x++){
      const i = y * 64 + x;
      if(g.map[i] === T.GRASS){ g.setTile(i, T.TILLED); n++; }
    }
  eq('锄了 25 格', g.tilledPlots(), 25);
  const parts = g.ratingParts(true);
  const ex = parts.rows.find(r => r.key === 'expand');
  eq('扩建期数 = 25 ÷ 20 = 1', ex.value, 1);
  eq('全量重算和增量一致', g.recountTilled(), g.tilledPlots());
  /* 存读档后仍然一致 */
  g.saveGame('耕地计数');
  const rawSave = JSON.parse(G.storage.getItem(g.CONFIG.SAVE.KEY));
  g.newGame();
  eq('新游戏耕地数归零', g.tilledPlots(), 0);
  ok('读档成功', g.deserializeState(rawSave), '');
  eq('读档后耕地数恢复', g.tilledPlots(), 25);
}

/* ================= 5. drawAnimal：每帧只算一次最近的动物 ================= */
{
  g.newGame();
  g.animals = [];
  for(let i = 0; i < 20; i++) g.animals.push(g.makeAnimal('chicken', [g.FARM.x + 2, g.FARM.y + 2]));
  /* animalNear() 每调用一次就读一次 CONFIG.ANIMALS.RANGE → 用 getter 计数 */
  const A = g.CONFIG.ANIMALS;
  const realRange = A.RANGE;
  let reads = 0;
  Object.defineProperty(A, 'RANGE', {configurable:true, get(){ reads++; return realRange; }});
  const ctx = mkCtx([]);
  reads = 0;
  g.drawEntities(ctx, g.FARM.x, g.FARM.y, g.FARM.x + 12, g.FARM.y + 12);
  const n1 = reads;
  ok('20 只动物一帧只算一次最近动物（不是每只一次）', n1 <= 2, '读取次数 ' + n1);
  delete A.RANGE;
  A.RANGE = realRange;
}

/* ================= 6. updateStats 守卫 ================= */
{
  g.newGame();
  g.updateStats();
  eq('菜单没开时不拼状态文本', g.els.stats.innerHTML, '');
  g.toggleSys(true);
  g.sysStatsToggle(true);
  ok('展开后有状态文本', g.els.stats.innerHTML.indexOf('玩家') >= 0, '');
  ok('展开后菜单里同步一份', g.els.sysStats.innerHTML === g.els.stats.innerHTML, '');
  g.sysStatsToggle(false);
  g.toggleSys(false);
}

/* ================= 7. 送礼：removeItem 必须成功 ================= */
{
  g.newGame();
  g.addItem('potato', 2);
  g.giftTarget = 'aunt';
  ok('能进入送礼状态', g.npcStartGift() === true, '');
  const slot = g.inv.findIndex(s => s && s.id === 'potato');
  ok('背包里有土豆', slot >= 0, '' + slot);
  const before = g.countItem('potato');
  ok('送礼成功', g.npcGiftPick(slot) === true, '');
  eq('背包少一个', g.countItem('potato'), before - 1);
}

/* ================= 8. 委托：冬天没有当季作物 → 材料委托 ================= */
{
  g.newGame();
  /* 直接问 questMake：把季节改成冬 */
  const oldName = g.seasonName;
  let made = null;
  const orig = g.CONFIG.QUEST.CROP_POOL;
  g.CONFIG.QUEST.CROP_POOL = ['radish'];      /* 只放春作物 */
  g.clock.day = 21;                             /* 冬 */
  try{
    made = g.questMake ? g.questMake(function(){ return 0.5; }, 'crop') : null;
  }catch(e){ made = null; }
  g.CONFIG.QUEST.CROP_POOL = orig;
  ok('能生成委托', !!made, JSON.stringify(made));
  if(made){
    eq('冬天作物委托降级成材料委托', made.kind, 'material');
    ok('材料委托有目标', !!made.target, made.target);
  }
}

/* ================= 9. 浇水状态上屏 ================= */
{
  g.newGame();
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  const c = plant(g, s.i);
  g.hover.tx = s.x; g.hover.ty = s.y;
  g.updateStats(true);
  ok('未浇水时不显示浇过水', g.els.stats.innerHTML.indexOf('今天浇过水') < 0, '');
  c.watered = true;
  g.updateStats(true);
  ok('浇水后状态里显示「今天浇过水」', g.els.stats.innerHTML.indexOf('今天浇过水') >= 0, '');
}

/* ---------------- 汇总 ---------------- */
console.log('');
results.forEach(r => console.log(r));
console.log('');
console.log('通过 ' + pass + ' / 失败 ' + fail + '（共 ' + (pass + fail) + '）');
process.exitCode = fail ? 1 : 0;
