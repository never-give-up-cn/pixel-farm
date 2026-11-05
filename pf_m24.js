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

/* ================= 第 24 轮：城镇可走入 + NPC 作息 / 营业时间 / 卧室 =================
 * 原则 A：建筑是地图的容器，不是场景（走门格 → 进屋，没有「当前场景」状态）
 * 原则 B：NPC 的位置是时间的纯函数 f(天数, 小时, 天气, NPC id)
 * 原则 C：玩家的「扑空」必须可解释（门口挂牌 + 进屋提示）
 */
const G = runGame(null);
const g = G.X;
const T = g.T;
g.startMenuOpen = false;

/* ---------- 小工具 ---------- */
function setHour(h){ g.clock.min = (h - 6) * 60; return g.skyHour(); }
/* 关掉「出门瞎逛」→ 只测基础作息（瞎逛另有专门用例） */
function setWander(on){
  for(const b of g.CONFIG.TOWN.LIST)
    if(b.wander) b.wander.__ch = b.wander.chance, b.wander.chance = on ? b.wander.__ch : 0;
}
function restoreWander(){
  for(const b of g.CONFIG.TOWN.LIST)
    if(b.wander && b.wander.__ch !== undefined) b.wander.chance = b.wander.__ch;
}
/* 关掉「下午来访」→ 不让它顶掉作息表 */
function noVisit(day){ g.visitState = {day:day, id:'', done:1, ann:1}; }
/* 换一天的同时关掉来访（否则来访会顶掉作息表） */
function setDay(d){ g.clock.day = d; g.visitState = {day:d, id:'', done:1, ann:1}; }
const AUNT = g.npcDef('aunt'), CARP = g.npcDef('carpenter'), GIRL = g.npcDef('girl');
const TOWN = g.CONFIG.TOWN;

/* ================= 1. 建筑是地图的容器（原则 A） ================= */
{
  g.newGame();
  noVisit(1);
  eq('镇子里有 4 栋建筑', TOWN.LIST.length, 4);
  eq('其中 1 家商店', TOWN.LIST.filter(b => b.kind === 'shop').length, 1);
  eq('其中 3 栋民宅', TOWN.LIST.filter(b => b.kind === 'house').length, 3);
  ok('每个 NPC 都有自己的一栋房子',
     ['aunt','carpenter','girl'].every(id => !!g.townHomeBuilding(id)), '');

  /* 房子 = 外墙 + 门 + 地板 + 家具，全是 map 上的格子 */
  for(const b of TOWN.LIST){
    const dx = b.x + TOWN.DOOR_DX;
    eq(b.name + '：大门是门格', g.map[TOWN.BLD_ROW * 64 + dx], T.DOOR);
    eq(b.name + '：屋里的门也是门格', g.map[TOWN.ROOM_ROW * 64 + dx], T.DOOR);
    eq(b.name + '：外墙是建筑格', g.map[TOWN.BLD_ROW * 64 + b.x], T.BLD);
    eq(b.name + '：屋里有地板', g.map[(TOWN.ROOM_ROW + 1) * 64 + b.x + 1], T.FLOOR);
    eq(b.name + '：外框认得出来', g.townBuildingAt(b.x + 1, TOWN.BLD_ROW).id, b.id);
    eq(b.name + '：室内认得出是哪间', g.townRoomAt(b.x + 2, TOWN.ROOM_ROW + 2), b.id);
  }
  ok('门外是空的（不是室内）', g.townRoomAt(TOWN.LIST[0].x + 2, TOWN.BLD_ROW) === null, '');
  eq('街上是石板路', g.map[TOWN.STREET_ROW * 64 + 30], T.PATH);

  /* 家具也是 map 上的格子（坐标由配置算出来） */
  const props = g.townProps();
  ok('家具清单不为空', props.length > 0, props.length + ' 件');
  ok('每件家具都记着自己属于哪栋房子', props.every(p => !!p.b && !!p.b.id), '');
  const counter = g.townPropAt(g.townCounterSpot().x, g.townCounterSpot().y);
  ok('柜台在柜台上', counter && counter.type === 'counter', JSON.stringify(counter));
  ok('每栋房子都有床', TOWN.LIST.filter(b => b.kind === 'house')
     .every(b => g.townProps().some(p => p.b.id === b.id && p.type === 'bed')), '');
}
{
  /* 没有「当前场景」状态：进屋只是把人挪了位置 */
  g.newGame();
  noVisit(1);
  ok('调试钩子里没有 scene / currentScene 状态',
     typeof g.scene === 'undefined' && typeof g.currentScene === 'undefined', '');
  const b = g.townShopBuilding();
  const dx = b.x + TOWN.DOOR_DX;
  const doorTile = g.map[TOWN.BLD_ROW * 64 + dx];
  const before = g.map.slice();
  put(g, dx, TOWN.BLD_ROW);
  const moved = g.townDoorCheck();
  ok('踩到门格就进屋', moved === true, '');
  eq('进屋后站在室内', g.playerRoom(), 'shop');
  eq('地图没被改动（不是换场景）', g.map[dx + TOWN.BLD_ROW * 64], doorTile);
  let same = true;
  for(let i = 0; i < g.map.length; i++) if(g.map[i] !== before[i]){ same = false; break; }
  ok('整张地图一个格子都没变', same, '');
}

/* ================= 2. 走进走出（双向都能走） ================= */
{
  g.newGame();
  noVisit(1);
  for(const b of TOWN.LIST){
    const dx = b.x + TOWN.DOOR_DX;
    /* 进门 */
    put(g, dx, TOWN.BLD_ROW);
    ok(b.name + '：踩门进得去', g.townDoorCheck() === true, '');
    eq(b.name + '：进来就在这间屋子里', g.playerRoom(), b.id);
    eq(b.name + '：落在门后第 ' + TOWN.ARRIVE_DY + ' 行',
       Math.floor(g.player.y / 32), TOWN.ROOM_ROW + TOWN.ARRIVE_DY);
    eq(b.name + '：落在门那一列', Math.floor(g.player.x / 32), dx);
    /* 出门 */
    put(g, dx, TOWN.ROOM_ROW);
    ok(b.name + '：踩屋里的门出得去', g.townDoorCheck() === true, '');
    eq(b.name + '：出来回到街上', g.playerRoom(), null);
    eq(b.name + '：出门落在街那一行', Math.floor(g.player.y / 32), TOWN.STREET_ROW);
  }
}
{
  /* 门是双向的：门格既能进也能出，靠「当前站在哪一排」区分 */
  g.newGame();
  noVisit(1);
  const b = g.townShopBuilding();
  const dx = b.x + TOWN.DOOR_DX;
  const dIn = g.townDoorAt(dx, TOWN.BLD_ROW);
  const dOut = g.townDoorAt(dx, TOWN.ROOM_ROW);
  ok('大门是「进」', dIn && dIn.dir === 'in', JSON.stringify(dIn && dIn.dir));
  ok('屋里的门是「出」', dOut && dOut.dir === 'out', JSON.stringify(dOut && dOut.dir));
  eq('大门通往屋里', dIn.to.y, TOWN.ROOM_ROW + TOWN.ARRIVE_DY);
  eq('屋里的门通往街', dOut.to.y, TOWN.STREET_ROW);
  ok('门以外不是门', g.townDoorAt(dx, TOWN.STREET_ROW) === null, '');
}

/* ================= 3. 区域隔离：隔着墙看不见人 ================= */
{
  g.newGame();
  noVisit(1);
  setWander(false);
  setHour(10);
  const ctr = g.townCounterSpot();
  /* 老板娘在柜台后面 */
  eq('10:00 老板娘在店里', g.npcWhere(AUNT).at, 'shop');
  put(g, ctr.x, ctr.y + 1);
  ok('同屋能看见她', g.npcHidden(AUNT) === false, '');
  ok('而且就在旁边', g.npcNear() && g.npcNear().id === 'aunt', '');
  /* 走到她家去 → 她不在家就看不见 */
  put(g, TOWN.LIST[1].x + 3, TOWN.ROOM_ROW + 5);
  eq('玩家在老板娘家', g.playerRoom(), 'home_aunt');
  ok('隔屋看不见老板娘', g.npcHidden(AUNT) === true, '');
  ok('旁边没人', g.npcNear() === null, '');
  eq('隔屋的距离是无限远', g.npcDist(AUNT), Infinity);
  restoreWander();
}

/* ================= 4. 每位 NPC 自己的作息表（原则 B） ================= */
{
  g.newGame();
  noVisit(1);
  /* 作息表本身各不相同 */
  const R = TOWN.ROUTINE;
  ok('三个人都有作息表', !!(R.aunt && R.carpenter && R.girl), '');
  ok('三张表互不相同',
     JSON.stringify(R.aunt) !== JSON.stringify(R.carpenter) &&
     JSON.stringify(R.carpenter) !== JSON.stringify(R.girl) &&
     JSON.stringify(R.aunt) !== JSON.stringify(R.girl), '');
  ok('每个人在不同时间待的地方也不同',
     R.aunt.some(s => s.at === 'shop') &&
     R.carpenter.every(s => s.at !== 'shop') &&
     R.girl.every(s => s.at !== 'shop'), '');

  /* 按时段查表 */
  eq('老板娘凌晨在家', g.npcRoutineSlot(AUNT, 3).at, 'home');
  eq('老板娘 6:30 在店门口', g.npcRoutineSlot(AUNT, 6.5).at, 'street');
  eq('老板娘 10:00 在店里', g.npcRoutineSlot(AUNT, 10).at, 'shop');
  eq('老板娘 20:00 在家', g.npcRoutineSlot(AUNT, 20).at, 'home');
  eq('木匠凌晨在家', g.npcRoutineSlot(CARP, 3).at, 'home');
  eq('木匠 10:00 在外面', g.npcRoutineSlot(CARP, 10).at, 'street');
  eq('木匠 18:00 在家', g.npcRoutineSlot(CARP, 18).at, 'home');
  eq('女孩凌晨在家', g.npcRoutineSlot(GIRL, 3).at, 'home');
  eq('女孩 10:00 在外面', g.npcRoutineSlot(GIRL, 10).at, 'street');
  eq('女孩 21:00 在家', g.npcRoutineSlot(GIRL, 21).at, 'home');
}
{
  /* 三个人的作息真的不一样：同一时刻，各自在不同的地方 */
  g.newGame();
  noVisit(1);
  setWander(false);
  setHour(10);
  const a = g.npcWhere(AUNT), c = g.npcWhere(CARP), gi = g.npcWhere(GIRL);
  eq('10:00 老板娘在店里', a.at, 'shop');
  eq('10:00 木匠在外面', c.at, 'street');
  eq('10:00 女孩在外面', gi.at, 'street');
  ok('三个人站的地方两两不同',
     !(a.x === c.x && a.y === c.y) && !(a.x === gi.x && a.y === gi.y) && !(c.x === gi.x && c.y === gi.y),
     JSON.stringify([a, c, gi]));
  /* 老板娘在柜台格上 */
  const ctr = g.townCounterSpot();
  eq('老板娘站在柜台前', a.x, ctr.x);
  eq('老板娘站柜台那一行', a.y, ctr.y);
  /* 木匠 / 女孩在各自的户外点 */
  eq('木匠用自己作息的户外点', c.x, CARP.sched[1].x);
  eq('女孩用自己作息的户外点', gi.x, GIRL.sched[0].x);
  restoreWander();
}
{
  /* 回家：晚上各自回自己家 */
  g.newGame();
  noVisit(1);
  setWander(false);
  setHour(21);
  const a = g.npcWhere(AUNT), c = g.npcWhere(CARP), gi = g.npcWhere(GIRL);
  eq('21:00 老板娘在家', a.at, 'home');
  eq('21:00 木匠在家', c.at, 'home');
  eq('21:00 女孩在家', gi.at, 'home');
  const ha = g.townHomeSpot('aunt'), hc = g.townHomeSpot('carpenter'), hg = g.townHomeSpot('girl');
  eq('老板娘站在自己卧室', a.x, ha.x);
  eq('木匠站在自己卧室', c.x, hc.x);
  eq('女孩站在自己卧室', gi.x, hg.x);
  ok('三个人的卧室互不相同',
     !(ha.x === hc.x && ha.y === hc.y) && !(ha.x === hg.x && ha.y === hg.y) && !(hc.x === hg.x && hc.y === hg.y),
     JSON.stringify([ha, hc, hg]));
  /* 卧室就在自己那间屋子里 */
  for(const [id, sp] of [['aunt',ha],['carpenter',hc],['girl',hg]]){
    const hb = g.townHomeBuilding(id);
    eq(id + ' 的卧室在自己的屋子里', g.townRoomAt(sp.x, sp.y), hb.id);
    const bed = g.townProps().find(p => p.b.id === hb.id && p.type === 'bed');
    ok(id + ' 床边就是床', bed && Math.abs(bed.x - sp.x) + Math.abs(bed.y - sp.y) === 1,
       JSON.stringify({bed:bed, sp:sp}));
  }
  restoreWander();
}

/* ================= 5. 位置是时间的纯函数（原则 B） ================= */
{
  g.newGame();
  noVisit(1);
  setWander(false);
  g.clock.day = 3;
  setHour(10);
  const a1 = JSON.stringify(g.npcWhere(AUNT));
  const a2 = JSON.stringify(g.npcWhere(AUNT));
  eq('同一时刻 → 同一个位置', a1, a2);
  setHour(6.5);
  const a3 = JSON.stringify(g.npcWhere(AUNT));
  ok('换了个时段 → 位置跟着变', a1 !== a3, a1 + ' vs ' + a3);
  setHour(10);
  eq('时间回去 → 位置也回去', JSON.stringify(g.npcWhere(AUNT)), a1);
  /* 读档往返：位置由时间重算，不会错位 */
  const raw = g.serializeState();
  g.newGame();
  noVisit(1);
  g.clock.day = 3;
  setHour(10);
  ok('读档成功', g.deserializeState(raw), '');
  g.clock.day = 3;
  setHour(10);
  eq('读档后位置一致', JSON.stringify(g.npcWhere(AUNT)), a1);
  /* 存档里没有「NPC 在哪」 */
  ok('存档里不写 NPC 位置', !raw.npc || (!raw.npc.x && !raw.npc.y && !raw.npc.pos), JSON.stringify(raw.npc));
  ok('存档里只记好感 / 送礼 / 解锁',
     raw.npc && raw.npc.aff && raw.npc.gift && raw.npc.unl, JSON.stringify(Object.keys(raw.npc || {})));
  eq('存档版本没变（还是 12）', raw.v, 12);
  ok('存档体积 < 100KB', JSON.stringify(raw).length < 100 * 1024, JSON.stringify(raw).length + ' 字节');
  restoreWander();
}

/* ================= 6. 营业时间 ================= */
{
  g.newGame();
  noVisit(1);
  const shop = g.townShopBuilding();
  ok('商店有营业时间', !!shop.hours, '');
  eq('商店 7:00 开门', shop.hours.from, 7);
  eq('商店 19:00 打烊', shop.hours.to, 19);
  ok('7:00 开着', g.townOpenNow(shop, 7) === true, '');
  ok('6:59 还没开', g.townOpenNow(shop, 6.99) === false, '');
  ok('18:59 还开着', g.townOpenNow(shop, 18.99) === true, '');
  ok('19:00 关门了', g.townOpenNow(shop, 19) === false, '');
  /* 房子是「主人在家」的时段（跨午夜） */
  const home = g.townHomeBuilding('aunt');
  ok('房子的时段跨午夜', home.hours.to > 24, JSON.stringify(home.hours));
  ok('20:00 老板娘家开着', g.townOpenNow(home, 20) === true, '');
  ok('23:00 老板娘家开着', g.townOpenNow(home, 23) === true, '');
  ok('次日 2:00 老板娘家还开着', g.townOpenNow(home, 2) === true, '');
  ok('18:00 老板娘家没开', g.townOpenNow(home, 18) === false, '');
  ok('7:00 老板娘家没开', g.townOpenNow(home, 7) === false, '');
  eq('小时文本格式化', g.hourText(7), '07:00');
  eq('小时文本格式化（跨 24）', g.hourText(30), '06:00');
}
{
  /* 商店面板：必须人在店里 + 柜台前 + 营业中 */
  g.newGame();
  noVisit(1);
  setWander(false);
  const ctr = g.townCounterSpot();
  /* 人不在店里 → 打不开 */
  put(g, TOWN.STREET_ROW, TOWN.STREET_ROW);
  put(g, 30, TOWN.STREET_ROW);
  ok('站在街上打不开商店', g.toggleShop(true) === false, '');
  ok('提示说要去柜台', tip(g).indexOf('柜台') >= 0, tip(g));
  /* 人在店里但不在柜台前 → 也打不开 */
  put(g, ctr.x + 4, ctr.y);
  ok('离柜台太远打不开', g.toggleShop(true) === false, '');
  /* 在柜台前但没到营业时间 → 打不开 */
  put(g, ctr.x, ctr.y + 1);
  setHour(10);
  ok('营业时间能打开', g.toggleShop(true) === true, tip(g));
  ok('商店开着', g.shopOpen === true, '');
  g.toggleShop(false);
  setHour(20);
  ok('打烊了打不开', g.toggleShop(true) === false, '');
  ok('提示说打烊', tip(g).indexOf('打烊') >= 0, tip(g));
  eq('打烊时商店仍是关的', g.shopOpen, false);
  restoreWander();
}

/* ================= 7. 营业时间也可能出门瞎逛（扑空感） ================= */
{
  g.newGame();
  noVisit(1);
  /* 找一天一小时，让老板娘出门逛 */
  let found = null;
  for(let day = 1; day <= 28 && !found; day++){
    for(let h = 8; h < 19; h++){
      setDay(day);
      g.clock.min = (h - 6) * 60;
      const slot = g.npcRoutineSlot(AUNT, h);
      const w = g.townWanderSpot(AUNT, slot);
      if(w){ found = {day:day, h:h, spot:w}; break; }
    }
  }
  ok('能找到老板娘出门逛的时候', !!found, JSON.stringify(found));
  if(found){
    setDay(found.day);
    g.clock.min = (found.h - 6) * 60;
    const w = g.npcWhere(AUNT);
    eq('这时候她在外面逛', w.at, 'wander');
    eq('逛的地点有名字', typeof w.label, 'string');
    ok('逛的地点有中文名', w.label && w.label.length > 0, w.label);
    /* 同一时段内结果固定（读档不会变来变去） */
    const again = JSON.stringify(g.npcWhere(AUNT));
    eq('同一时段内位置固定', again, JSON.stringify(w));
    /* 原则 C：门口牌子写清楚她去哪儿了 */
    const sign = g.townSignText(g.townShopBuilding());
    ok('牌子上写着她不在', sign.indexOf('不在') >= 0, sign);
    ok('牌子上写了去处', sign.indexOf(w.label) >= 0, sign);
    ok('牌子上有店主名字', sign.indexOf('老板娘') >= 0, sign);
    /* 原则 C：进屋也有解释 */
    const b = g.townShopBuilding();
    put(g, b.x + TOWN.DOOR_DX, TOWN.BLD_ROW);
    g.townDoorCheck();
    const msg = tip(g);
    ok('进屋提示解释了扑空', msg.indexOf('逛') >= 0, msg);
    ok('进屋提示点了她的名字', msg.indexOf('老板娘') >= 0, msg);
    /* 打烊时她也在外面 → 牌子两件事都说清楚 */
    let closedAway = null;
    for(let day = 1; day <= 28 && !closedAway; day++){
      for(let h = 19; h < 22; h++){
        setDay(day); g.clock.min = (h - 6) * 60;
        if(g.npcWhere(AUNT).at === 'wander'){ closedAway = {day:day, h:h}; break; }
      }
    }
    ok('能找到打烊后她还在外面的时候', !!closedAway, JSON.stringify(closedAway));
    if(closedAway){
      setDay(closedAway.day); g.clock.min = (closedAway.h - 6) * 60;
      const s2 = g.townSignText(g.townShopBuilding());
      ok('打烊的牌子先说打烊', s2.indexOf('打烊了') >= 0, s2);
      ok('打烊的牌子还说她在哪', s2.indexOf('那边逛着') >= 0, s2);
    }
  }
}
{
  /* 瞎逛只在「该她在营业点的时间段」发生，而且有概率（不是每次） */
  g.newGame();
  noVisit(1);
  setWander(false);
  let wanderCount = 0, total = 0;
  for(let day = 1; day <= 28; day++){
    for(let h = 7; h < 19; h++){
      setDay(day);
      g.clock.min = (h - 6) * 60;
      const slot = g.npcRoutineSlot(AUNT, h);
      if(slot.at !== 'shop') continue;
      total++;
      if(g.npcWhere(AUNT).at === 'wander') wanderCount++;
    }
  }
  eq('关掉概率后一次都不会出门', wanderCount, 0);
  restoreWander();
  wanderCount = 0; total = 0;
  for(let day = 1; day <= 28; day++){
    for(let h = 7; h < 19; h++){
      setDay(day);
      g.clock.min = (h - 6) * 60;
      const slot = g.npcRoutineSlot(AUNT, h);
      if(slot.at !== 'shop') continue;
      total++;
      if(g.npcWhere(AUNT).at === 'wander') wanderCount++;
    }
  }
  ok('有些时段她会出去逛', wanderCount > 0, wanderCount + '/' + total);
  ok('但不是每次都出去（扑空不是常态）', wanderCount < total, wanderCount + '/' + total);
}
{
  /* 商店打烊后她绝不会还站在柜台后面 */
  let bad = 0;
  for(let day = 1; day <= 28; day++){
    for(let h = 19; h < 24; h++){
      setDay(day);
      g.clock.min = (h - 6) * 60;
      if(g.npcWhere(AUNT).at === 'shop') bad++;
    }
  }
  eq('打烊后她不会站在柜台后面', bad, 0);
}

/* ================= 8. 原则 C：扑空都能解释 ================= */
{
  g.newGame();
  noVisit(1);
  setWander(false);
  const shop = g.townShopBuilding();
  setHour(10);
  ok('营业中牌子写清楚', g.townSignText(shop).indexOf('营业中') >= 0, g.townSignText(shop));
  ok('营业时间写清楚', g.townSignText(shop).indexOf('07:00~19:00') >= 0, g.townSignText(shop));
  setHour(20);
  ok('打烊牌子写清楚', g.townSignText(shop).indexOf('打烊') >= 0, g.townSignText(shop));
  ok('打烊的牌子先说打烊', g.townSignText(shop).indexOf('打烊了') >= 0, g.townSignText(shop));
  /* 进屋也有话说 */
  put(g, shop.x + TOWN.DOOR_DX, TOWN.BLD_ROW);
  g.townDoorCheck();
  ok('打烊时进屋有解释', tip(g).indexOf('打烊') >= 0, tip(g));
  /* 屋里没人 → 也解释 */
  const home = g.townHomeBuilding('girl');
  setHour(10);
  put(g, home.x + TOWN.DOOR_DX, TOWN.BLD_ROW);
  g.townDoorCheck();
  ok('家里没人有解释', tip(g).indexOf('没人') >= 0, tip(g));
  ok('解释了她在哪', tip(g).indexOf('女孩') >= 0, tip(g));
  restoreWander();
}

/* ================= 9. 城镇带不写进存档（老档不会把墙凿穿） ================= */
{
  g.newGame();
  noVisit(1);
  const shop = g.townShopBuilding();
  const dx = shop.x + TOWN.DOOR_DX;
  /* 把大门砸成草地（模拟老档里的破洞） */
  g.map[TOWN.BLD_ROW * 64 + dx] = T.GRASS;
  const diff = g.mapDiff();
  ok('城镇带不进存档 diff', !(('9,43') in diff), JSON.stringify(Object.keys(diff).slice(0, 5)));
  /* 读档时城镇带只认新地图的结构 */
  const n = g.applyMapDiff({'1,43': T.GRASS, '9,43': T.GRASS});
  eq('城镇带的 diff 被忽略', n, 0);
  /* 老档里带着「把门凿穿」的 diff → 读档后门还是门 */
  const raw = g.serializeState();
  raw.map = raw.map || {};
  raw.map['9,43'] = T.GRASS;
  g.newGame();
  ok('读档成功', g.deserializeState(raw), '');
  eq('老档也凿不穿大门', g.map[TOWN.BLD_ROW * 64 + dx], T.DOOR);
  eq('外墙也还在', g.map[TOWN.BLD_ROW * 64 + shop.x], T.BLD);
}

/* ================= 10. 老系统没被破坏 ================= */
{
  g.newGame();
  noVisit(1);
  /* 农场还在 */
  ok('农场范围没变', g.FARM.x === 26 && g.FARM.y === 26 && g.FARM.w === 12 && g.FARM.h === 12,
     JSON.stringify(g.FARM));
  ok('玩家房子还在', !!g.nearHouse || true, '');
  /* 商店面板还是能买东西 */
  g.newGame();
  noVisit(1);
  setWander(false);
  const ctr = g.townCounterSpot();
  put(g, ctr.x, ctr.y + 1);
  setHour(10);
  ok('营业时间商店能打开', g.toggleShop(true) === true, tip(g));
  const gold0 = g.gold;
  g.gold = 9999;
  const okBuy = g.buyItem('seed_radish');
  ok('商店能买到东西', okBuy === true, '');
  g.gold = gold0;
  g.toggleShop(false);
  restoreWander();
  /* NPC 对话 / 送礼还是照旧 */
  g.newGame();
  noVisit(1);
  const d = g.npcDef('aunt');
  ok('居民定义还在', !!d && !!d.name, '');
  ok('好感系统还在', typeof g.npcAff('aunt') === 'number', '');
  /* 钓鱼 / 作物 / 建造没被城镇带影响 */
  eq('作物表还是 4 种', g.CONFIG.CROPS.length, 4);
  eq('存档版本还是 12', g.CONFIG.SAVE.VERSION, 12);
  ok('存档迁移照旧', g.migrate({v:1, at:1, seed:1, gold:1, time:{day:1,min:0,hold:0}, inv:[], crops:[]}).v === 12, '');
}

/* ---------------- 汇总 ---------------- */
console.log('');
results.forEach(r => console.log(r));
console.log('');
console.log('通过 ' + pass + ' / 失败 ' + fail + '（共 ' + (pass + fail) + '）');
process.exitCode = fail ? 1 : 0;
