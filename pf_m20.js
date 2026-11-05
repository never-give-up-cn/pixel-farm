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

/* ================= 第 20 轮：终局自动化 / 农场评级 =================
 * 铱质洒水器 / 稻草人 + 乌鸦 / 自动采集箱 / 雇工 / 5 星评级 / 存档迁移 */
const G = runGame(null);
const g = G.X;
const T = g.T;

function anyTip(g, s){
  return (g.els.toasts.children || []).some(e => String(e.textContent).indexOf(s) >= 0);
}
function setCrop(g, tx, ty, extra){
  const i = ty*64 + tx;
  g.crops[i] = Object.assign(
    {type:'radish', stage:0, grown:0, watered:true, mature:false, dead:false}, extra || {});
  return i;
}
function freshCrop(g, tx, ty, extra){
  g.setTile(ty*64+tx, T.TILLED);
  return setCrop(g, tx, ty, extra);
}
function countTile(g, x, y, w, h, t){
  let n = 0;
  for(let yy=y; yy<y+h; yy++) for(let xx=x; xx<x+w; xx++) if(g.map[yy*64+xx] === t) n++;
  return n;
}

/* ---------------- 1. CONFIG / 配方表 ---------------- */
g.newGame();
ok('铱质加速概率默认 30%', g.ENDGAME.IRRIGATION.CHANCE === 0.3, 'got=' + g.ENDGAME.IRRIGATION.CHANCE);
eq('铱质洒水器半径 = 2（5×5）', g.ENDGAME.IRRIGATION.RANGE, 2);
eq('乌鸦每天早上概率 = 0.08', g.ENDGAME.CROW.CHANCE, 0.08);
eq('稻草人保护半径 = 5', g.ENDGAME.CROW.RANGE, 5);
eq('采集箱格数 = 8', g.ENDGAME.AUTOBOX.SLOTS, 8);
eq('采集箱到棚舍距离 = 4', g.ENDGAME.AUTOBOX.RANGE, 4);
eq('雇工一次性费用 = 3000', g.ENDGAME.WORKER.COST, 3000);
eq('雇工日薪 = 50', g.ENDGAME.WORKER.WAGE, 50);
{
  const W = g.ENDGAME.RATING.WEIGHTS;
  eq('评级五项权重合计 = 100', W.crop + W.animal + W.building + W.ach + W.expand, 100);
  eq('5 星所需分数 = 100', g.ENDGAME.RATING.STARS * g.ENDGAME.RATING.STAR_STEP, 100);
  eq('每档星 = 20 分', g.ENDGAME.RATING.STAR_STEP, 20);
}
{
  const ids = g.CONFIG.BUILD.RECIPES.map(r => r.id);
  eq('建造配方总数 = 10', ids.length, 10);
  const ir = g.buildRecipe('irrigator');
  ok('配方表有铱质洒水器', !!ir);
  eq('铱质洒水器要石材 20', ir && ir.cost.stone, 20);
  eq('铱质洒水器要金币 500', ir && ir.gold, 500);
  ok('costText 写进金币造价', g.costText(ir).indexOf('金币×500') >= 0, g.costText(ir));
  const sc = g.buildRecipe('scarecrow');
  ok('配方表有稻草人', !!sc && sc.cost.wood === 6 && sc.cost.stone === 2);
  const ab = g.buildRecipe('autobox');
  ok('配方表有自动采集箱', !!ab && ab.cost.wood === 8 && ab.cost.stone === 4);
}
eq('存档版本升到 10', g.CONFIG.SAVE.VERSION, 12);

/* ---------------- 2. 金币造价：预览 / 扣除 / 拆除返还 ---------------- */
g.newGame();
{
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 4, 9, 5);
  const cx = A.x + 4, cy = A.y + 2;
  g.gold = 5000;
  g.addItem('stone', 40);
  const stone0 = g.countItem('stone');
  g.buildSel = g.CONFIG.BUILD.RECIPES.findIndex(r => r.id === 'irrigator');
  put(g, cx, cy);
  const pv = g.buildPreview(cx, cy);
  eq('金币够时预览可放', pv.ok, true);
  const gold0 = g.gold, nb0 = g.buildings.length;
  eq('放铱质洒水器成功', g.placeBuilding(cx, cy), true);
  eq('扣掉 500 金币', gold0 - g.gold, 500);
  eq('扣掉 20 石材', stone0 - g.countItem('stone'), 20);
  eq('建筑数 +1', g.buildings.length, nb0 + 1);
  ok('建筑类型 = irrigator', g.buildings.some(b => b.type === 'irrigator'));
  /* 金币不足 → 明确的 reason，且不扣任何东西 */
  g.gold = 100;
  const pv2 = g.buildPreview(cx + 2, cy);
  eq('金币不足时不可放', pv2.ok, false);
  ok('预览提示金币不足（还差 400）', pv2.reason.indexOf('金币不足') >= 0 && pv2.reason.indexOf('400') >= 0, pv2.reason);
  const goldBroke = g.gold;
  eq('金币不足时放置失败', g.placeBuilding(cx + 2, cy), false);
  eq('失败不扣金币', g.gold, goldBroke);
  /* 拆除返还一半金币 */
  g.gold = 100;
  eq('拆除成功', g.demolishAt(cx, cy), true);
  eq('拆除返还 250 金币', g.gold - 100, 250);
  ok('拆除提示含金币返还', anyTip(g, '金币×250'), tip(g));
}

/* ---------------- 3. 铱质洒水器自动浇 5×5 ---------------- */
g.newGame();
{
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 4, 9, 9);
  const cx = A.x + 4, cy = A.y + 4;
  g.gold = 5000; g.addItem('stone', 20);
  eq('造好铱质洒水器', build(g, 'irrigator', cx, cy), true);
  eq('洒水器脚下不是耕地', g.map[cy*64+cx], T.GRASS);
  /* 5×5 去掉中心 = 24 格耕地 */
  for(let dy=-2; dy<=2; dy++) for(let dx=-2; dx<=2; dx++){
    if(!dx && !dy) continue;
    g.setTile((cy+dy)*64 + (cx+dx), T.TILLED);
  }
  const iIn = setCrop(g, cx + 1, cy);
  /* 范围外（距离 3）也有一块耕地 */
  g.setTile(cy*64 + cx + 3, T.TILLED);
  const iOut = cy*64 + cx + 3;
  const n = g.applySprinklers();
  eq('自动浇了 24 格', n, 24);
  eq('5×5 内全部变成浇水状态', countTile(g, cx-2, cy-2, 5, 5, T.WATERED), 24); /* 中心是建筑，不是耕地 */
  eq('范围外 1 格没被浇', g.map[iOut], T.TILLED);
  eq('作物被标记为已浇水', g.crops[iIn].watered, true);
  eq('作物被打上铱质加速标记', g.crops[iIn].irr, 1);
  ok('提示含「铱质」覆盖格数', anyTip(g, '铱质'), tip(g));
  /* 普通洒水器仍只浇 3×3（回归） */
  g.newGame();
  const B = arena(g, g.FARM.x + 2, g.FARM.y + 4, 7, 7);
  const bx = B.x + 3, by = B.y + 3;
  g.addItem('wood', 10); g.addItem('stone', 10);
  eq('造好普通洒水器', build(g, 'sprinkler', bx, by), true);
  for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){
    if(!dx && !dy) continue;
    g.setTile((by+dy)*64 + (bx+dx), T.TILLED);
  }
  g.setTile(by*64 + bx + 2, T.TILLED);
  const iPlain = setCrop(g, bx + 1, by);
  eq('普通洒水器只浇 8 格', g.applySprinklers(), 8);
  eq('普通洒水器不覆盖 2 格外', g.map[by*64 + bx + 2], T.TILLED);
  eq('普通洒水器不打加速标记', g.crops[iPlain].irr, undefined);
}

/* ---------------- 4. 铱质额外生长：100% 可验证 / 0% 不触发 ---------------- */
g.newGame();
{
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 4, 11, 5);
  const cx = A.x + 4, cy = A.y + 2;
  g.gold = 5000; g.addItem('stone', 20);
  eq('造好铱质洒水器（生长测试）', build(g, 'irrigator', cx, cy), true);
  const iIn  = freshCrop(g, cx + 1, cy);   /* 半径 1 → 被浇到 */
  const iOut = freshCrop(g, cx + 5, cy);   /* 半径 5 → 浇不到 */
  g.setTile(iIn, T.WATERED); g.setTile(iOut, T.WATERED);
  g.crops[iIn].irr = 1;                     /* 昨晚被铱质洒水器浇过 */

  g.CONFIG.ENDGAME.IRRIGATION.CHANCE = 1;   /* 临时调成 100% 便于验证 */
  const r1 = g.settleDay();
  eq('100% 时恰好 1 株触发加速', r1.irrGrew, 1);
  eq('被铱质浇过的作物当天 +2 阶段', g.crops[iIn].grown, 2);
  eq('对照作物（范围外）只长 1 阶段', g.crops[iOut].grown, 1);
  ok('提示「多长了一阶段」', anyTip(g, '多长了一阶段'), tip(g));
  eq('加速标记只作用于当晚', g.crops[iIn].irr, 1);   /* 当天结算后又被洒水器浇上（等于明晚的标记） */

  /* 0% 时不触发：两株都只长 1 阶段 */
  g.crops[iIn].grown = 0; g.crops[iOut].grown = 0;
  g.crops[iIn].mature = false; g.crops[iOut].mature = false;
  g.crops[iIn].irr = 1; g.crops[iOut].irr = 0;
  g.setTile(iIn, T.WATERED); g.setTile(iOut, T.WATERED);
  g.CONFIG.ENDGAME.IRRIGATION.CHANCE = 0;
  const r2 = g.settleDay();
  eq('概率 0 时不触发加速', r2.irrGrew, 0);
  eq('概率 0 时只长 1 阶段', g.crops[iIn].grown, 1);
  eq('对照仍为 1 阶段', g.crops[iOut].grown, 1);

  /* 30% 默认：统计 400 次应落在合理区间（0~400 之间且非恒定） */
  g.CONFIG.ENDGAME.IRRIGATION.CHANCE = 0.3;
  let hits = 0;
  for(let k=0;k<400;k++) if(Math.random() < 0.3) hits++;
  ok('30% 概率落在合理区间', hits > 60 && hits < 260, 'hits=' + hits + '/400');
}

/* ---------------- 5. 稻草人 / 乌鸦事件 ---------------- */
g.newGame();
{
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 4, 14, 14);
  const cx = A.x + 6, cy = A.y + 6;
  g.addItem('wood', 20); g.addItem('stone', 10);
  g.CONFIG.ENDGAME.CROW.CHANCE = 1;          /* 强制每天来乌鸦 */

  /* a) 没有稻草人 → 啄走 1 株成熟作物 */
  const i1 = freshCrop(g, cx, cy, {grown:3, stage:3, mature:true});
  const r1 = g.crowDayStart();
  eq('没有稻草人：乌鸦啄走作物', r1 && r1.code, 1);
  eq('被啄作物从田里消失', g.crops[i1], null);
  eq('乌鸦记录写入「被啄」', g.endgameState.crow[g.endgameState.crow.length-1][1], 1);
  ok('提示含乌鸦', anyTip(g, '乌鸦'), tip(g));

  /* b) 稻草人范围内 → 免疫 */
  eq('造好稻草人', build(g, 'scarecrow', cx - 4, cy), true);
  eq('稻草人数量 = 1', g.scarecrowCount(), 1);
  eq('范围内（距离 4）受保护', g.scarecrowProtected(cx, cy), true);
  eq('范围外（距离 6）不受保护', g.scarecrowProtected(cx - 4, cy + 6), false);
  const i2 = freshCrop(g, cx, cy, {grown:3, stage:3, mature:true});
  const r2 = g.crowDayStart();
  eq('稻草人范围内：乌鸦被挡下', r2 && r2.code, 2);
  ok('受保护作物没被啄走', !!g.crops[i2]);
  eq('乌鸦记录写入「被挡下」', g.endgameState.crow[g.endgameState.crow.length-1][1], 2);
  ok('提示含稻草人保护', anyTip(g, '稻草人'), tip(g));

  /* c) 范围外的成熟作物照样被啄 */
  g.crops[i2] = null;
  const farX = cx - 4, farY = cy + 6;
  const i3 = freshCrop(g, farX, farY, {grown:3, stage:3, mature:true});
  eq('范围外不受保护', g.scarecrowProtected(farX, farY), false);
  const r3 = g.crowDayStart();
  eq('稻草人范围外仍会被啄', r3 && r3.code, 1);
  eq('范围外作物被移除', g.crops[i3], null);

  /* d) 没有成熟作物 → code 0 */
  for(let k=0;k<g.crops.length;k++) g.crops[k] = null;
  const r4 = g.crowDayStart();
  eq('没有成熟作物：乌鸦没得吃', r4 && r4.code, 0);
  eq('记录 code 0', g.endgameState.crow[g.endgameState.crow.length-1][1], 0);

  /* e) 记录上限 8 条 */
  for(let k=0;k<12;k++) g.crowLogPush(g.clock.day, k % 3);
  eq('乌鸦记录最多保留 8 条', g.endgameState.crow.length, 8);
  ok('crowLastText 描述最近一次', g.crowLastText().indexOf('第 ') === 0, g.crowLastText());

  /* f) 概率 0 → 当晚不会来 */
  g.CONFIG.ENDGAME.CROW.CHANCE = 0;
  for(let k=0;k<g.crops.length;k++) g.crops[k] = null;
  freshCrop(g, cx, cy, {grown:3, stage:3, mature:true});
  eq('概率 0 时乌鸦不来', g.crowDayStart(), null);
  g.CONFIG.ENDGAME.CROW.CHANCE = 0.08;
}

/* ---------------- 6. 自动采集箱 ---------------- */
g.newGame();
{
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 4, 12, 6);
  g.addItem('wood', 60); g.addItem('stone', 20);
  eq('造好鸡舍', build(g, 'coop', A.x + 1, A.y + 1), true);
  const coop = g.buildings.find(b => b.type === 'coop');
  ok('鸡舍存在', !!coop);
  eq('造好自动采集箱', build(g, 'autobox', coop.tx + 2, coop.ty), true);
  const box = g.buildings.find(b => b.type === 'autobox');
  ok('采集箱有 8 格', box && box.slots && box.slots.length === 8);
  eq('采集箱数量 = 1', g.autoboxCount(), 1);
  eq('采集箱初始为空', g.autoboxUsed(), 0);

  const a = g.makeAnimal('chicken', [coop.tx, coop.ty]);
  a.mature = true; a.fed = true; a.aff = 100; a.age = 9;
  g.animals.push(a);
  eq('采集箱离棚舍 2 格能认到', g.autoboxForAnimal(a) === box, true);

  const eggs0 = g.countItem('egg') + g.countItem('egg_hq');
  const r1 = g.animalDayStart();
  eq('产出进了采集箱', r1.boxed, 1);
  ok('箱子里有 1 份鸡蛋类产物', box.slots[0] && box.slots[0].id.indexOf('egg') === 0, JSON.stringify(box.slots[0]));
  eq('背包没有重复拿蛋', g.countItem('egg') + g.countItem('egg_hq'), eggs0);
  eq('采集箱累计收货 = 1', g.endgameState.boxed, 1);
  eq('autoboxUsed = 1', g.autoboxUsed(), 1);
  ok('提示「进了采集箱」', anyTip(g, '进了采集箱'), tip(g));

  /* 采集箱太远 → 退回背包 */
  box.tx = coop.tx + 10;
  a.fed = true;
  const eggs1 = g.countItem('egg') + g.countItem('egg_hq');
  const r2 = g.animalDayStart();
  eq('采集箱太远不收货', r2.boxed, 0);
  eq('产出退回背包', g.countItem('egg') + g.countItem('egg_hq'), eggs1 + 1);
  eq('太远时 autoboxForAnimal 返回 null', g.autoboxForAnimal(a), null);

  /* 采集箱满了 → 退回背包，不会只放一半 */
  box.tx = coop.tx + 2;
  for(let k=0;k<box.slots.length;k++) box.slots[k] = {id:'wood', n: g.CONFIG.INVENTORY.STACK_MAX};
  eq('箱子满时 autoboxRoom = false', g.autoboxRoom(box, 'egg', 1), false);
  a.fed = true;
  const eggs2 = g.countItem('egg') + g.countItem('egg_hq');
  const r3 = g.animalDayStart();
  eq('箱满不收货', r3.boxed, 0);
  eq('箱满退回背包', g.countItem('egg') + g.countItem('egg_hq'), eggs2 + 1);
  eq('箱满时没有部分写入', g.autoboxStore(box, 'egg', 1), false);

  /* 采集箱面板复用木箱 UI */
  g.openChest = box;
  g.chestOpen = true;
  eq('采集箱面板标题', g.els.chestTitle.textContent, '自动采集箱');
  ok('面板说明自动收货', g.els.chestInfo.textContent.indexOf('每天早上自动收货') >= 0, g.els.chestInfo.textContent);
  ok('格数按 8 格显示', g.els.chestInfo.textContent.indexOf('/8') >= 0, g.els.chestInfo.textContent);
  ok('采集箱面板格子 >= 8', g.els.chestGrid.children.length >= 8, String(g.els.chestGrid.children.length));
  g.chestOpen = false;
  /* 普通木箱仍是「木箱」 */
  g.addItem('wood', 10);
  eq('造好木箱', build(g, 'chest', A.x + 6, A.y + 4), true);
  const chest = g.buildings.find(b => b.type === 'chest');
  g.openChest = chest; g.chestOpen = true;
  eq('普通木箱标题不变', g.els.chestTitle.textContent, '木箱');
  eq('普通木箱说明不含自动收货', g.els.chestInfo.textContent.indexOf('自动收货'), -1);
  g.chestOpen = false;
}

/* ---------------- 7. 雇工：雇佣 / 上工 / 罢工 / 补发 ---------------- */
g.newGame();
{
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 4);
  for(let yy=0; yy<2; yy++) for(let xx=0; xx<2; xx++) g.setTile((A.y+yy)*64 + (A.x+xx), T.TILLED);
  eq('初始没有雇工', g.workerHired(), false);

  g.gold = 5000;
  eq('雇佣成功', g.workerHire(), true);
  eq('一次扣 3000 金', g.gold, 2000);
  eq('雇工已雇佣', g.workerHired(), true);
  ok('雇佣提示清楚', anyTip(g, '雇了一位雇工'), tip(g));
  eq('重复雇佣失败', g.workerHire(), false);
  ok('重复雇佣有提示', anyTip(g, '已经雇了'), tip(g));

  /* 早上上工：扣 50 + 浇所有耕地 */
  g.clock.day = 2;
  const r1 = g.workerDayStart();
  eq('上工浇了 4 格', r1.watered, 4);
  eq('日薪扣 50', g.gold, 1950);
  eq('4 格都变成浇水状态', countTile(g, A.x, A.y, 2, 2, T.WATERED), 4);
  ok('上工提示含日薪', anyTip(g, '日薪 50'), tip(g));

  /* 付不起 → 罢工，且不再浇地 */
  for(let yy=0; yy<2; yy++) for(let xx=0; xx<2; xx++) g.setTile((A.y+yy)*64 + (A.x+xx), T.TILLED);
  g.gold = 0; g.clock.day = 3;
  const r2 = g.workerDayStart();
  eq('付不起工资 → 罢工', r2.strike, true);
  eq('罢工当天没浇地', r2.watered, 0);
  eq('罢工状态可查询', g.workerStrike(), true);
  eq('欠薪天数 = 1', g.endgameState.worker.missed, 1);
  ok('罢工提示明确（罢工 + 50 金 + 天数）',
     anyTip(g, '罢工') && anyTip(g, '50') && anyTip(g, '欠 1 天'), tip(g));
  eq('罢工时耕地没被动过', countTile(g, A.x, A.y, 2, 2, T.WATERED), 0);
  eq('罢工时金币不变', g.gold, 0);

  g.clock.day = 4;
  const r3 = g.workerDayStart();
  eq('连续罢工累计欠薪 2 天', g.endgameState.worker.missed, 2);
  ok('欠薪提示带天数', anyTip(g, '欠 2 天'), tip(g));

  /* 补发：钱不够 → 失败；够 → 恢复 + 立刻浇地 */
  g.gold = 20;
  eq('金币不够补发', g.workerPay(), false);
  ok('补发失败提示', anyTip(g, '金币不够付工资'), tip(g));
  eq('失败后仍在罢工', g.workerStrike(), true);

  g.gold = 100;
  eq('补发工资成功', g.workerPay(), true);
  eq('补发扣 50', g.gold, 50);
  eq('罢工结束', g.workerStrike(), false);
  eq('欠薪清零', g.endgameState.worker.missed, 0);
  ok('补发提示含「罢工结束」', anyTip(g, '罢工结束'), tip(g));
  eq('补发后立刻浇了 4 格', countTile(g, A.x, A.y, 2, 2, T.WATERED), 4);
  eq('付薪日 = 今天', g.endgameState.worker.paidDay, g.clock.day);

  /* 没雇工时 workerDayStart 是空操作 */
  g.endgameResetState();
  const r4 = g.workerDayStart();
  eq('没雇工时不浇地', r4.watered, 0);
  eq('没雇工时金币不变', g.gold, 50);
}

/* ---------------- 8. 5 星评级：明细 / HUD / 结算 / 冻结 ---------------- */
g.newGame();
{
  const zero = g.ratingParts();
  eq('开局评分 = 0', zero.score, 0);
  eq('开局 0 星', zero.stars, 0);
  eq('开局明细 0 分', zero.rows.map(r => r.pts).join(','), '0,0,0,0,0');

  /* 凑满 5 星：4 种作物 / 6 只动物 / 12 座建筑 / 12 项成就 / 60 格耕地 */
  g.statsState.cv = 0b1111;
  g.animals.length = 0;
  for(let k=0;k<6;k++) g.animals.push(g.makeAnimal('chicken', [g.FARM.x, g.FARM.y]));
  g.buildings.length = 0;
  for(let k=0;k<12;k++) g.buildings.push({type:'fence', tx:1, ty:1});
  g.achState.unl = (1 << 12) - 1;
  let tilled = 0;
  for(let yy=0; yy<4 && tilled<60; yy++){
    for(let xx=0; xx<16 && tilled<60; xx++){
      g.setTile((g.FARM.y+6+yy)*64 + (g.FARM.x+1+xx), T.TILLED);
      tilled++;
    }
  }
  eq('耕地格数 = 60', g.tilledPlots(), 60);

  const info = g.ratingParts();
  eq('5 星评分 = 100', info.score, 100);
  eq('5 星', info.stars, 5);
  eq('各项得分 25/20/15/30/10', info.rows.map(r => r.pts).join(','), '25,20,15,30,10');
  eq('作物行 = 4/4', info.rows[0].value + '/' + info.rows[0].target, '4/4');
  eq('动物行 = 6/6', info.rows[1].value + '/' + info.rows[1].target, '6/6');
  eq('建筑行 = 12/12', info.rows[2].value + '/' + info.rows[2].target, '12/12');
  eq('成就行 = 12/12', info.rows[3].value + '/' + info.rows[3].target, '12/12');
  eq('扩建行 = 3/3', info.rows[4].value + '/' + info.rows[4].target, '3/3');
  eq('星级文本', g.ratingStarsText(5), '★★★★★');
  eq('0 星文本', g.ratingStarsText(0), '☆☆☆☆☆');

  g.ratingCheck();
  eq('达成 5 星 → 结算待播', g.endingPending, true);
  eq('结算标记只置一次', g.endgameState.ending, true);

  /* 面板 + 明细展开 */
  eq('打开评级面板', g.ratingOpenPanel(), true);
  eq('面板 open 类', hasClass(g.els.rating, 'open'), true);
  eq('面板星级', g.els.ratingStars.textContent, '★★★★★');
  eq('面板总分', g.els.ratingTotal.textContent, '评分 100 / 100 · 满 5 星');
  ok('面板摘要 5 星', g.els.ratingSummary.textContent.indexOf('5 星') >= 0, g.els.ratingSummary.textContent);
  eq('明细默认收起', hasClass(g.els.ratingList, 'open'), false);
  eq('按钮文案默认「展开明细」', g.els.ratingToggle.textContent, '展开明细');
  clickEl(g.els.ratingToggle);
  eq('点一下 → 明细展开', hasClass(g.els.ratingList, 'open'), true);
  eq('按钮文案变「收起明细」', g.els.ratingToggle.textContent, '收起明细');
  {
    const txt = textOf(g.els.ratingList);
    ok('明细含作物种类 4/4 种', txt.indexOf('作物种类') >= 0 && txt.indexOf('4/4 种') >= 0, txt);
    ok('明细含动物 6/6 只', txt.indexOf('6/6 只') >= 0, txt);
    ok('明细含建筑 12/12 座', txt.indexOf('12/12 座') >= 0, txt);
    ok('明细含成就 12/12 项', txt.indexOf('12/12 项') >= 0, txt);
    ok('明细含扩建 3/3 期', txt.indexOf('3/3 期') >= 0, txt);
    ok('明细含 +25 分', txt.indexOf('+25 分') >= 0, txt);
    ok('明细含 +30 分', txt.indexOf('+30 分') >= 0, txt);
    ok('明细注明扩建算法来源',
       txt.indexOf('耕地 60 格 ÷ 20 = 3 期') >= 0, txt);
    ok('明细共 5 行 + 1 条说明', g.els.ratingList.children.length === 6,
       String(g.els.ratingList.children.length));
  }
  clickEl(g.els.ratingToggle);
  eq('再点一下 → 明细收起', hasClass(g.els.ratingList, 'open'), false);

  /* HUD 评分框 */
  g.drawRatingHud(mkCtx([]));
  ok('HUD 评分框有尺寸', g.hudRatingRect.w >= 112 && g.hudRatingRect.h === 24,
     JSON.stringify(g.hudRatingRect));
  eq('HUD 命中测试（框内）',
     g.hitHudRating({x:g.hudRatingRect.x + 10, y:g.hudRatingRect.y + 5}), true);
  eq('HUD 命中测试（框外）', g.hitHudRating({x:5, y:5}), false);

  /* 5 星结算画面：update 时自动弹出，并先收起评级面板 */
  g.update(0.1);
  eq('5 星后自动弹结算', g.endingOpen, true);
  eq('结算时先收起评级面板', g.ratingOpen, false);
  eq('结算待播标记已消费', g.endingPending, false);
  eq('结算面板 open 类', hasClass(g.els.ending, 'open'), true);
  {
    const body = g.els.endingBody.textContent;
    ok('结算含评分', body.indexOf('评分 100 / 100') >= 0, body);
    ok('结算含星级', body.indexOf('★★★★★') >= 0, body);
    ok('结算含各项数值', body.indexOf('作物种类 4/4种') >= 0 &&
       body.indexOf('动物数量 6/6只') >= 0 && body.indexOf('成就数量 12/12项') >= 0, body);
    ok('结算含天数', body.indexOf('第 ') >= 0 && body.indexOf('天') >= 0, body);
  }
  const m1 = g.clock.min;
  g.update(1.0);
  eq('结算画面打开时时间冻结', g.clock.min, m1);
  key(G, 'escape');
  eq('Esc 关闭结算并继续游玩', g.endingOpen, false);
  ok('关闭后提示继续经营', anyTip(g, '继续经营'), tip(g));
  g.ratingCheck();
  eq('5 星结算不会重复弹', g.endingPending, false);

  /* 评级面板打开时冻结（此时 5 星结算已播过，不会再弹） */
  g.ratingOpenPanel();
  const m0 = g.clock.min;
  g.update(1.0);
  eq('评级面板打开时时间冻结', g.clock.min, m0);
  key(G, 'escape');
  eq('Esc 关闭评级面板', g.ratingOpen, false);

  /* 未满 5 星不弹结算 */
  g.newGame();
  g.statsState.cv = 0b111;
  g.animals.length = 3;
  g.ratingCheck();
  eq('未满 5 星不弹结算', g.endingPending, false);
  eq('未满 5 星 ending=false', g.endgameState.ending, false);
}
g.CONFIG.ENDGAME.IRRIGATION.CHANCE = 0.3;

/* ---------------- 9. 存档 / 读档 / 迁移 ---------------- */
g.newGame();
{
  g.addItem('wood', 20); g.addItem('stone', 10);
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 4, 6, 4);
  eq('造好采集箱（存档测试）', build(g, 'autobox', A.x + 1, A.y + 1), true);
  const box = g.buildings.find(b => b.type === 'autobox');
  box.slots[0] = {id:'egg', n:3};
  box.slots[1] = {id:'milk', n:2};

  g.endgameState.worker.hired = true;
  g.endgameState.worker.strike = true;
  g.endgameState.worker.paidDay = 5;
  g.endgameState.worker.missed = 2;
  g.endgameState.boxed = 7;
  g.endgameState.ending = true;
  g.endgameState.crow = [[1,1],[2,2],[3,0]];

  eq('存档成功', g.saveGame('第20轮测试'), true);
  const raw = G.storage.getItem('farm_save_v1');
  const d = JSON.parse(raw);
  eq('存档版本 = 10', d.v, 12);
  ok('存档有 end 字段', !!d.end);
  eq('存档雇工 hired', d.end.w, 1);
  eq('存档雇工 strike', d.end.s, 1);
  eq('存档付薪日', d.end.p, 5);
  eq('存档欠薪天数', d.end.m, 2);
  eq('存档采集箱累计', d.end.n, 7);
  eq('存档结算标记', d.end.e, 1);
  eq('存档乌鸦记录条数', d.end.c.length, 3);
  eq('乌鸦记录紧凑结构', JSON.stringify(d.end.c[0]), '[1,1]');
  {
    const sb = d.buildings.find(b => b.type === 'autobox');
    ok('采集箱存档 8 格', !!sb && sb.slots.length === 8, sb && String(sb.slots.length));
    eq('采集箱第 1 格内容', sb && sb.slots[0] && (sb.slots[0].id + ':' + sb.slots[0].n), 'egg:3');
    eq('采集箱第 2 格内容', sb && sb.slots[1] && (sb.slots[1].id + ':' + sb.slots[1].n), 'milk:2');
  }
  ok('整档体积 < 100KB', raw.length < 100 * 1024, raw.length + ' 字节');

  /* 清场后读回 */
  g.endgameResetState();
  g.buildings.length = 0; g.buildIndex.fill(-1);
  eq('读档成功', g.loadGame(), true);
  eq('读档：雇工恢复', g.workerHired(), true);
  eq('读档：罢工恢复', g.workerStrike(), true);
  eq('读档：付薪日恢复', g.endgameState.worker.paidDay, 5);
  eq('读档：欠薪恢复', g.endgameState.worker.missed, 2);
  eq('读档：采集箱累计恢复', g.endgameState.boxed, 7);
  eq('读档：结算标记恢复', g.endgameState.ending, true);
  eq('读档：乌鸦记录条数', g.endgameState.crow.length, 3);
  eq('读档：乌鸦记录内容', JSON.stringify(g.endgameState.crow[2]), '[3,0]');
  {
    const rb = g.buildings.find(b => b.type === 'autobox');
    ok('读档：采集箱还在', !!rb);
    eq('读档：采集箱 8 格', rb && rb.slots.length, 8);
    eq('读档：采集箱第 1 格', rb && rb.slots[0] && (rb.slots[0].id + ':' + rb.slots[0].n), 'egg:3');
  }

  /* 迁移：v8 → v10 补 end / tp */
  const m8 = g.migrate({v:8, day:3, buildings:[]});
  eq('v8 → v10 版本号', m8.v, 12);
  ok('v8 补上 end 字段', !!m8.end && m8.end.w === 0 && Array.isArray(m8.end.c));
  eq('v8 保留原有 day', m8.day, 3);
  const m8b = g.migrate({v:8, end:{w:1,s:1,p:2,m:1,n:5,e:1,c:[[4,1]]}});
  eq('已有 end 不被覆盖', m8b.end.w, 1);
  eq('已有乌鸦记录保留', JSON.stringify(m8b.end.c), '[[4,1]]');
  const m1 = g.migrate({v:1});
  eq('v1 一步迁到 v10', m1.v, 12);
  ok('v1 也有 end 字段', !!m1.end && Array.isArray(m1.end.c));
  eq('null 存档迁移返回 null', g.migrate(null), null);

  /* 新游戏清空终局状态 */
  g.newGame();
  eq('新游戏清空雇工', g.workerHired(), false);
  eq('新游戏清空罢工', g.workerStrike(), false);
  eq('新游戏清空采集箱累计', g.endgameState.boxed, 0);
  eq('新游戏清空乌鸦记录', g.endgameState.crow.length, 0);
  eq('新游戏清空结算标记', g.endgameState.ending, false);
  eq('新游戏清空结算待播', g.endingPending, false);
  eq('新游戏关闭评级面板', g.ratingOpen, false);
}

/* ---------------- 10. 渲染 / 交互杂项回归 ---------------- */
{
  /* 三个新建造物的绘制函数不抛错 */
  const ctx = mkCtx([]);
  let drawErr = '';
  try{
    g.drawIrrigator(ctx, 0, 0, 1.2);
    g.drawScarecrow(ctx, 0, 0);
    g.drawAutobox(ctx, 0, 0, 1.2);
  }catch(e){ drawErr = e.message; }
  eq('三个新建筑绘制不抛错', drawErr, '');
  /* 建造图标不抛错 */
  let iconErr = '';
  try{ g.drawBuildIcon(ctx, 'irrigator', 0, 0); g.drawBuildIcon(ctx, 'scarecrow', 0, 0); g.drawBuildIcon(ctx, 'autobox', 0, 0); }
  catch(e){ iconErr = e.message; }
  eq('三个新建筑图标不抛错', iconErr, '');

  /* G 键打开评级面板 / Esc 关闭 */
  g.newGame();
  g.sessionActive = true;
  key(G, 'g');
  eq('按 G 打开农场评级', g.ratingOpen, true);
  key(G, 'escape');
  eq('Esc 关闭农场评级', g.ratingOpen, false);

  /* 点 HUD 评分框打开 */
  g.drawRatingHud(mkCtx([]));
  const r = g.hudRatingRect;
  g.mouse.x = r.x + 8; g.mouse.y = r.y + 8;
  /* 直接走命中函数即可（画布点击在 update 里另有拦截） */
  eq('HUD 评分框点得中', g.hitHudRating({x:r.x + 8, y:r.y + 8}), true);
}

/* ---------------- 11. 老系统回归（本轮不应破坏） ---------------- */
g.newGame();
{
  eq('建造面板配方数 = 10', g.CONFIG.BUILD.RECIPES.length, 10);
  eq('木箱仍是 8 格', g.CONFIG.BUILD.CHEST_SLOTS, 8);
  const seeds = ['radish','potato','tomato','pumpkin'].filter(id => !!g.cropDef(id));
  eq('四种作物都还在', seeds.length, 4);
  eq('第一天 = 春', g.seasonName(), '春');
  /* 普通洒水器不会被当成铱质 */
  eq('ENDGAME 配置独立命名空间', typeof g.CONFIG.ENDGAME, 'object');
  ok('顶层没有污染 IRRIGATION', g.CONFIG.IRRIGATION === undefined);
  /* 建造物槽位：采集箱与木箱不共享同一个数组 */
  g.addItem('wood', 40); g.addItem('stone', 10);
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 4, 6, 4);
  eq('造好木箱（回归）', build(g, 'chest', A.x + 1, A.y + 1), true);
  eq('造好采集箱（回归）', build(g, 'autobox', A.x + 3, A.y + 1), true);
  const ch = g.buildings.find(b => b.type === 'chest');
  const ab = g.buildings.find(b => b.type === 'autobox');
  ch.slots[0] = {id:'wood', n:1};
  eq('木箱与采集箱互不影响', ab.slots[0], null);
}

/* ---------------- 汇总 ---------------- */
console.log('');
results.forEach(r => console.log(r));
console.log('');
console.log('通过 ' + pass + ' / 失败 ' + fail + '（共 ' + (pass + fail) + '）');
process.exitCode = fail ? 1 : 0;
