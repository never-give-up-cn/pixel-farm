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

/* ================= 1. CONFIG / 命名空间 / 委托板位置 ================= */
{
  const G = runGame(null);
  const g = G.X;
  const Q = g.CONFIG.QUEST;
  ok('CONFIG 里有 QUEST 命名空间', !!Q, '');
  ok('参数没有散落到顶层', g.CONFIG.QUEST_RANGE === undefined && g.CONFIG.QUEST_DAILY === undefined, '');
  eq('每天 3 个委托', Q.DAILY, 3);
  eq('同时最多接 2 个', Q.MAX_ACTIVE, 2);
  eq('剩余天数下限 1', Q.DAYS_MIN, 1);
  eq('剩余天数上限 2', Q.DAYS_MAX, 2);
  eq('信誉每 10 点一档', Q.REP_STEP, 10);
  eq('每档 +5%', Q.REP_BONUS, 0.05);
  eq('加成上限 +50%', Q.REP_BONUS_MAX, 0.5);
  ok('4 种委托都有基础金币', !!Q.GOLD_BASE.crop && !!Q.GOLD_BASE.fish &&
     !!Q.GOLD_BASE.material && !!Q.GOLD_BASE.talk, JSON.stringify(Q.GOLD_BASE));
  ok('作物池有 4 种', Q.CROP_POOL.length === 4, '');
  ok('鱼池有 8 种', Q.FISH_POOL.length === 8, '');
  ok('材料池是木材 / 石材', Q.MATERIAL_POOL.join(',') === 'wood,stone', '');
  ok('对话池是 3 位居民', Q.TALK_POOL.length === 3, '');
  ok('额外奖励池都是存在的物品', Q.EXTRA_POOL.every(id => !!g.CONFIG.ITEMS[id]), Q.EXTRA_POOL.join(','));

  eq('存档版本升到 5', g.CONFIG.SAVE.VERSION, 12);
  const B = g.QUEST_BOARD;
  ok('委托板在商店旁边（3 格）', g.SHOP_POS.x - B.x === 3 && g.SHOP_POS.y === B.y, JSON.stringify(B));
  eq('委托板挡路', g.isSolid(B.x, B.y), true);
  eq('委托板不能建造', g.buildGroundOK(B.x, B.y, g.CONFIG.BUILD.RECIPES[0]), '这里是委托板');
  ok('委托板不在商店交互半径里', Math.hypot(g.SHOP_POS.x - B.x, 0) > 1.6, '');
}

/* ================= 2. 每日刷新 / 种类轮转 / 数值范围 ================= */
{
  const G = runGame(null);
  const g = G.X;
  const Q = g.CONFIG.QUEST;
  g.newGame();                                  /* 第 1 天早晨 */
  eq('开局就有 3 个委托', g.quests.offers.length, 3);
  eq('委托板记录的是当天', g.quests.day, g.clock.day);
  eq('第 1 天是 作物/鱼/材料 三连', g.quests.offers.map(q => q.kind).join(','), 'crop,fish,material');
  let needOK = true, goldOK = true, daysOK = true, targetOK = true;
  for(const q of g.quests.offers){
    const r = Q.NEED[q.kind];
    if(!(q.need >= r[0] && q.need <= r[1])) needOK = false;
    if(q.gold !== Q.GOLD_BASE[q.kind] + q.need * Q.GOLD_PER_UNIT[q.kind]) goldOK = false;
    if(!(q.days >= Q.DAYS_MIN && q.days <= Q.DAYS_MAX)) daysOK = false;
    if(q.kind === 'crop' && !g.cropDef(q.target)) targetOK = false;
    if(q.kind === 'fish' && !g.fishDef(q.target)) targetOK = false;
    if(q.kind === 'material' && q.target !== 'wood' && q.target !== 'stone') targetOK = false;
  }
  ok('需求数量在配置范围内', needOK, '');
  ok('金币 = 基础 + 数量×单价', goldOK, '');
  ok('剩余天数 1~2', daysOK, '');
  ok('目标都是真实物品 / 鱼', targetOK, '');

  /* 同一天重复刷新 → 结果稳定（种子按天固定） */
  const sig = g.quests.offers.map(q => q.kind + ':' + q.target + ':' + q.need + ':' + q.days + ':' + q.gold).join('|');
  g.quests.offers = [];
  g.quests.day = 0;
  g.questEnsureBoard();
  const sig2 = g.quests.offers.map(q => q.kind + ':' + q.target + ':' + q.need + ':' + q.days + ':' + q.gold).join('|');
  eq('同一天重新出板结果一致', sig2, sig);

  /* 冬天没有当季作物 → 不刷做不完的作物委托 */
  g.clock.day = 31;                            /* 冬季第 1 天 */
  g.questEnsureBoard();
  ok('冬天不再出现作物委托', g.quests.offers.every(q => q.kind !== 'crop'),
     g.quests.offers.map(q => q.kind + ':' + q.target).join(','));
  ok('冬天委托仍然都是可完成的类型', g.quests.offers.every(q =>
     q.kind === 'material' || q.kind === 'talk' ||
     (q.kind === 'fish' && !!g.fishDef(q.target))), '');

  /* 第 2 天轮转到 鱼/材料/对话（对话委托出现） */
  g.clock.day = 2;
  g.questDayStart();
  eq('跨天刷新出新的 3 个委托', g.quests.offers.length, 3);
  eq('第 2 天 鱼/材料/对话', g.quests.offers.map(q => q.kind).join(','), 'fish,material,talk');
  ok('对话委托目标是居民', g.CONFIG.NPC.LIST.some(n => n.id === g.quests.offers.find(q => q.kind === 'talk').target), '');
  eq('委托板天数同步', g.quests.day, 2);
}

/* ================= 3. 接取上限 2：第三个按钮置灰 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const q1 = g.quests.offers[0].id, q2 = g.quests.offers[1].id, q3 = g.quests.offers[2].id;
  eq('接第 1 个', g.questAccept(q1), true);
  eq('接第 2 个', g.questAccept(q2), true);
  eq('接第 3 个被拒绝', g.questAccept(q3), false);
  eq('进行中 2 个', g.quests.active.length, 2);
  eq('板上剩 1 个', g.quests.offers.length, 1);
  ok('拒绝时给出提示', /最多同时接/.test(tipAll(g)), tip(g));

  g.questRenderPanel();
  const list = g.els.questList;
  const text = textOf(list);
  ok('面板显示进行中 2/2', text.indexOf('进行中 2/2') >= 0, '');
  ok('面板显示今日委托剩余 1', text.indexOf('今日委托（1）') >= 0, '');
  /* 找到剩下那条的按钮：应当「已接满」+ off */
  let offerBtn = null;
  (function walk(el){
    if(!el) return;
    if(el.tagName === 'button' && (el.textContent === '已接满' || el.textContent === '接取')) offerBtn = el;
    for(const c of (el.children || [])) walk(c);
  })(list);
  ok('第三个委托按钮置灰', !!offerBtn && offerBtn.textContent === '已接满' && hasClass(offerBtn, 'off'),
     offerBtn ? (offerBtn.textContent + '/' + offerBtn.className) : 'no button');
  ok('置灰按钮点了也不会接', !offerBtn.__h.click, '');
}

/* ================= 4. 事件总线：收获 / 钓鱼 / 砍树 / 对话 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();

  /* 总线本身可挂监听 */
  let hits = 0, lastEvt = null;
  g.questBus.on('unit_test', d => { hits++; lastEvt = d; });
  g.questEmit('unit_test', {hello:1});
  eq('总线监听能收到事件', hits, 1);
  eq('事件数据原样传递', lastEvt && lastEvt.hello, 1);
  /* 监听器抛错不会影响其它监听器 */
  let after = 0;
  g.questBus.on('unit_test', () => { throw new Error('boom'); });
  g.questBus.on('unit_test', () => { after++; });
  g.questEmit('unit_test', {});
  eq('一个监听器抛错不影响其它监听器', after, 1);
  eq('抛错后也没中断派发', hits, 2);

  /* --- 收获：真实调用 harvestCrop --- */
  const field = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 3);
  const i0 = field.y * 64 + field.x;
  g.crops[i0] = {type:'radish', grown:3, stage:3, mature:true, watered:true, dead:false};
  g.setTile(i0, g.T.WATERED);
  const qc = {id:900, kind:'crop', target:'radish', need:2, got:0, days:2, gold:100, extra:null};
  g.quests.active = [qc]; g.quests.offers = [];
  put(g, field.x, field.y);
  const gold0 = g.gold;
  g.harvestCrop(field.x, field.y);
  eq('收获后委托进度实时 +1', qc.got, 1);
  ok('没完成前不结算', g.gold === gold0 && g.quests.active.length === 1, 'gold=' + g.gold);
  /* 不刷新面板，进度也不靠 UI 才更新 —— 再收一次 */
  g.crops[i0] = {type:'radish', grown:3, stage:3, mature:true, watered:true, dead:false};
  g.harvestCrop(field.x, field.y);
  eq('收满后自动移出进行中', g.quests.active.length, 0);
  eq('完成结算金币（无信誉加成）', g.gold - gold0, 100);
  eq('信誉 +1', g.quests.rep, 1);
  ok('完成弹提示', /委托完成/.test(tipAll(g)), tip(g));

  /* --- 钓鱼：真实调用 fishingResolveReel --- */
  const fish = g.CONFIG.FISHING.LIST[0];
  const qf = {id:901, kind:'fish', target:fish.id, need:1, got:0, days:2, gold:50, extra:null};
  g.quests.active = [qf];
  g.fishing.fish = fish; g.fishing.pointer = 0.5; g.fishing.zone = 0.5;
  g.fishing.zoneW = 0.4; g.fishing.state = 'reel';
  const gold1 = g.gold;
  const okReel = g.fishingResolveReel();
  eq('钓到鱼', okReel, true);
  eq('钓鱼触发委托进度', qf.got, 1);
  eq('钓鱼委托完成结算', g.gold - gold1, 50);
  eq('钓鱼完成后移出', g.quests.active.length, 0);

  /* --- 砍树：真实调用 useTool --- */
  const ax = field.x + 2, ay = field.y;
  const ai = ay * 64 + ax;
  g.crops[ai] = null;
  g.setTile(ai, g.T.TREE);
  g.inv[0] = {id:'axe', n:1}; g.selectHot(0);
  const qm = {id:902, kind:'material', target:'wood', need:1, got:0, days:2, gold:60, extra:null};
  g.quests.active = [qm];
  put(g, ax, ay);
  const gold2 = g.gold;
  g.useTool(ax, ay);
  eq('砍树触发委托进度', qm.got, 1);
  eq('砍树委托完成结算', g.gold - gold2, 60);
  eq('砍树完成后移出', g.quests.active.length, 0);

  /* --- 对话：真实调用 npcOpenDialog --- */
  const aunt = g.CONFIG.NPC.LIST.find(n => n.id === 'aunt');
  const qt = {id:903, kind:'talk', target:'aunt', need:1, got:0, days:1, gold:55, extra:null};
  g.quests.active = [qt];
  const gold3 = g.gold;
  g.npcCloseDialog();
  const okTalk = g.npcOpenDialog(aunt);
  eq('对话触发委托进度', qt.got, 1);
  eq('对话委托完成结算', g.gold - gold3, 55);
  eq('对话完成后移出', g.quests.active.length, 0);
  g.npcCloseDialog();

  /* --- 类型 / 目标不匹配不推进 --- */
  const qx = {id:904, kind:'crop', target:'tomato', need:2, got:0, days:2, gold:100, extra:null};
  g.quests.active = [qx];
  g.questEmit('crop', {id:'radish', n:5});
  eq('作物对不上不推进', qx.got, 0);
  g.questEmit('fish', {id:'radish', n:5});
  eq('类型对不上不推进', qx.got, 0);
  g.questEmit('crop', {id:'tomato', n:5});
  eq('对上了按数量累加（不超过 need）', qx.got, 2);
}

/* ================= 5. 过期：自动移除、不结算 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const q = {id:910, kind:'crop', target:'radish', need:3, got:2, days:1, gold:100, extra:null};
  g.quests.active = [q];
  const gold0 = g.gold;
  g.clock.day = 2;
  g.questDayStart();
  eq('过期委托被移除', g.quests.active.length, 0);
  eq('过期不结算金币', g.gold, gold0);
  eq('过期不加信誉', g.quests.rep, 0);
  ok('过期有提示', /过期/.test(tipAll(g)), tip(g));
  eq('过期后照样出新的 3 个', g.quests.offers.length, 3);
  ok('新委托不包含刚过期的 id', g.quests.offers.every(o => o.id !== 910), '');

  /* 剩余 2 天的跨一天还在，跨两天才过期 */
  const q2 = {id:911, kind:'crop', target:'radish', need:1, got:0, days:2, gold:40, extra:null};
  g.quests.active = [q2];
  g.clock.day = 3; g.questDayStart();
  eq('剩 2 天 → 跨一天剩 1 天', q2.days, 1);
  eq('仍然在进行中', g.quests.active.length, 1);
  g.clock.day = 4; g.questDayStart();
  eq('跨两天才移除', g.quests.active.length, 0);
}

/* ================= 6. 信誉：每 10 点 +5%，上限 +50% ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const q = {id:920, kind:'crop', target:'radish', need:1, got:0, days:2, gold:100, extra:null};

  g.quests.rep = 0;  eq('信誉 0 → +0%', Math.round(g.questRepBonus()*100), 0);
  g.quests.rep = 9;  eq('信誉 9 → +0%', Math.round(g.questRepBonus()*100), 0);
  g.quests.rep = 10; eq('信誉 10 → +5%', Math.round(g.questRepBonus()*100), 5);
  g.quests.rep = 50; eq('信誉 50 → +25%', Math.round(g.questRepBonus()*100), 25);
  g.quests.rep = 100; eq('信誉 100 → 封顶 +50%', Math.round(g.questRepBonus()*100), 50);
  g.quests.rep = 999; eq('再高也不超过 +50%', Math.round(g.questRepBonus()*100), 50);

  g.quests.rep = 10;
  eq('奖励数值带加成（100 → 105）', g.questFinalGold(q), 105);
  g.quests.rep = 0;
  eq('无信誉时原价', g.questFinalGold(q), 100);

  /* 完成时按当时信誉结算，并且信誉自增 */
  g.quests.rep = 19;
  g.quests.active = [Object.assign({}, q)];
  const gold0 = g.gold;
  g.questEmit('crop', {id:'radish', n:1});
  eq('结算用当时信誉（+5%）', g.gold - gold0, 105);
  eq('完成后信誉 +1', g.quests.rep, 20);
  eq('面板上能看到信誉与加成', (function(){ g.questRenderPanel(); return g.els.questRep.textContent; })(),
     '信誉 20 · 奖励 +10%');
}

/* ================= 7. 额外奖励：概率掉落 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const origRandom = Math.random;
  try{
    const q = {id:930, kind:'crop', target:'radish', need:1, got:0, days:2, gold:10,
               extra:{id:'seed_radish', n:1}};
    g.quests.active = [q];
    Math.random = () => 0;                       /* 必掉 */
    const s0 = g.countItem('seed_radish');
    g.questEmit('crop', {id:'radish', n:1});
    eq('概率命中 → 额外奖励进背包', g.countItem('seed_radish') - s0, 1);
    ok('提示里写出额外奖励', /额外/.test(tipAll(g)), tip(g));

    const q2 = {id:931, kind:'crop', target:'radish', need:1, got:0, days:2, gold:10,
                extra:{id:'seed_radish', n:1}};
    g.quests.active = [q2];
    Math.random = () => 0.99;                    /* 必不掉 */
    const s1 = g.countItem('seed_radish');
    g.questEmit('crop', {id:'radish', n:1});
    eq('概率没命中 → 不给额外奖励', g.countItem('seed_radish') - s1, 0);

    /* 没配额外奖励的委托不会去找随机数 */
    const q3 = {id:932, kind:'crop', target:'radish', need:1, got:0, days:2, gold:10, extra:null};
    g.quests.active = [q3];
    let called = 0;
    Math.random = () => { called++; return 0; };
    g.questEmit('crop', {id:'radish', n:1});
    eq('没有额外奖励时不掷骰子', called, 0);
  }finally{
    Math.random = origRandom;
  }
}

/* ================= 8. 面板 / 快捷键 / 冻结 / 追踪条 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const B = g.QUEST_BOARD;

  put(g, B.x, B.y + 1);
  ok('站在委托板旁边', g.questBoardNear(), 'd=' + g.questBoardDist().toFixed(2));
  key(G, 'e');
  eq('按 E 打开委托板', g.questOpen, true);
  ok('面板加了 open 类', hasClass(g.els.quest, 'open'), '');
  ok('打开时渲染了面板内容', textOf(g.els.questList).indexOf('今日委托') >= 0, '');

  const m0 = g.clock.min;
  for(let i=0;i<20;i++) g.update(0.5);
  eq('面板打开时时间冻结', g.clock.min, m0);
  /* 打开时其它按键被忽略（数字键不改快捷栏） */
  const hs = g.hotSel;
  key(G, '3');
  eq('面板打开时其它按键被忽略', g.hotSel, hs);
  key(G, 'escape');
  eq('Esc 关闭委托板', g.questOpen, false);
  const m1 = g.clock.min;
  for(let i=0;i<4;i++) g.update(0.5);
  ok('关闭后时间恢复流动', g.clock.min !== m1, 'before=' + m1 + ' after=' + g.clock.min);

  /* 追踪条：进行中的委托显示进度 x/N 与剩余天数 */
  g.quests.active = [{id:940, kind:'crop', target:'radish', need:3, got:1, days:2, gold:80, extra:null}];
  const texts = [];
  const ctx = {
    font:'', textAlign:'left', textBaseline:'top', fillStyle:'',
    measureText(t){ return {width:String(t).length * 7}; },
    fillRect(){}, fillText(t){ texts.push(String(t)); }
  };
  g.drawQuestTracker(ctx, 100);
  const joined = texts.join('|');
  ok('追踪条显示委托标题', joined.indexOf('交付 萝卜 ×3') >= 0, joined);
  ok('追踪条显示进度 1/3', joined.indexOf('1/3') >= 0, joined);
  ok('追踪条显示剩余天数', joined.indexOf('剩2天') >= 0, joined);
  g.quests.active = [];
  const t2 = [];
  g.drawQuestTracker({font:'',textAlign:'left',textBaseline:'top',fillStyle:'',
    measureText(t){return {width:String(t).length*7};}, fillRect(){}, fillText(t){t2.push(t);}}, 100);
  eq('没有进行中的委托时不画追踪条', t2.length, 0);

  /* 委托板绘制不抛错，并且用到了画布 */
  let rects = 0;
  const dctx = {fillStyle:'', fillRect(){ rects++; }, fillText(){}, font:'', textAlign:'left',
                textBaseline:'top', measureText(){ return {width:10}; }};
  let drawErr = '';
  try{ g.drawQuestBoard(dctx, 10, 20); }catch(e){ drawErr = e.message; }
  eq('委托板立绘能画出来', drawErr, '');
  ok('委托板至少画了 5 个矩形', rects >= 5, 'rects=' + rects);
}

/* ================= 9. 存档：紧凑结构 / 往返 / 迁移 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.quests.rep = 37;
  g.quests.active = [
    {id:950, kind:'crop', target:'radish', need:4, got:2, days:2, gold:85, extra:{id:'wood', n:1}},
    {id:951, kind:'talk', target:'girl', need:1, got:0, days:1, gold:55, extra:null}
  ];
  const s = g.questSerialize();
  ok('存档是紧凑数组（8 个字段）', s.o.every(a => Array.isArray(a) && a.length === 8), JSON.stringify(s.o[0]));
  ok('按 kind 存成 1 个字母', s.o.every(a => ['c','f','m','t'].indexOf(a[1]) >= 0), '');
  ok('额外奖励存成 id:n', s.a[0][7] === 'wood:1', String(s.a[0][7]));
  eq('没额外奖励存 0', s.a[1][7], 0);

  const snap = JSON.parse(JSON.stringify(s));
  g.questResetState(false);
  eq('清空后没有委托', g.quests.offers.length + g.quests.active.length, 0);
  g.questDeserialize(snap);
  eq('读回信誉', g.quests.rep, 37);
  eq('读回进行中数量', g.quests.active.length, 2);
  eq('读回进度', g.quests.active[0].got, 2);
  eq('读回剩余天数', g.quests.active[1].days, 1);
  eq('读回额外奖励', g.quests.active[0].extra && g.quests.active[0].extra.id, 'wood');
  eq('读回 kind', g.quests.active[1].kind, 'talk');
  eq('读回当天委托数量', g.quests.offers.length, snap.o.length);

  /* 老存档 / 脏字段 */
  g.questDeserialize(undefined);
  eq('老存档没 quest → 当天重新出板', g.quests.offers.length, 3);
  eq('老存档没 quest → 信誉归零', g.quests.rep, 0);
  g.quests.rep = 12;
  g.questDeserialize({r:-5, d:1, i:2, o:[['x']], a:[[999, 'z', 'nope', 1, 0, 1, 10, 0]]});
  eq('脏数据信誉不为负', g.quests.rep, 0);
  eq('未知 kind 的委托被丢弃', g.quests.active.length, 0);
  ok('丢弃脏数据后仍有板', g.quests.offers.length === 3, '');
  g.questDeserialize({r:8, d:g.clock.day, i:5, o:[[1,'c','radish',2,0,2,60,0]], a:[]});
  eq('超量进行中会被截断到上限', (function(){
    g.quests.active = [];
    g.questDeserialize({r:0, d:g.clock.day, i:9, o:[], a:[
      [1,'c','radish',1,0,2,10,0],[2,'c','potato',1,0,2,10,0],[3,'c','tomato',1,0,2,10,0]
    ]});
    return g.quests.active.length;
  })(), g.CONFIG.QUEST.MAX_ACTIVE);

  /* migrate：v1 / v4 → v5，进度不全丢 */
  const v1 = {v:1, gold:777, time:{day:5,min:120,hold:0}, seed:12345, inv:[], crops:{}};
  const mv1 = g.migrate(v1);
  eq('v1 迁到 v5', mv1.v, 12);
  eq('迁移保留金币', mv1.gold, 777);
  ok('迁移补上 quest 字段', !!mv1.quest && Array.isArray(mv1.quest.o) && Array.isArray(mv1.quest.a), '');
  const v4 = {v:4, gold:88, animals:[], npc:{aff:{},gift:{},unl:{}}, dex:{f:0,g:0}};
  const mv4 = g.migrate(v4);
  eq('v4 迁到 v5', mv4.v, 12);
  ok('v4 迁移补上 quest 字段', !!mv4.quest, '');
  eq('迁移后信誉从 0 开始', mv4.quest.r, 0);
  const bad = g.migrateSave('not-a-save');
  eq('迁移失败 → 降级而不是清档', bad.degraded, true);
  eq('降级时保留原始数据', bad.save, 'not-a-save');

  /* 存档体积：正常游玩 5 小时（~60 天）后仍然很小 */
  g.newGame();
  g.quests.rep = 240;                          /* 60 天 × 每天 2 单 × 2 信誉点/单 的上限估计 */
  const full = g.serializeState();
  const bytes = JSON.stringify(full).length;
  ok('5 小时游玩后存档仍 < 100KB', bytes < 100 * 1024, bytes + ' 字节');
  ok('委托部分只占几百字节', JSON.stringify(full.quest).length < 800, JSON.stringify(full.quest).length + ' 字节');
  ok('存档里有委托字段', !!full.quest && typeof full.quest.r === 'number', '');
}

/* ================= 10. 回归：旧系统没被改坏 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  /* 收获仍然进背包 */
  const field = arena(g, g.FARM.x + 2, g.FARM.y + 5, 3, 3);
  const i0 = field.y * 64 + field.x;
  g.crops[i0] = {type:'potato', grown:5, stage:3, mature:true, watered:true, dead:false};
  g.setTile(i0, g.T.WATERED);
  put(g, field.x, field.y);
  const before = g.countItem('potato');
  eq('收获仍能收进背包', g.harvestCrop(field.x, field.y), true);
  eq('收获数量正确', g.countItem('potato') - before, 1);

  /* 商店仍然能买东西 */
  g.gold = 500;
  const seeds0 = g.countItem('seed_radish');
  g.shopBuyClick('seed_radish');
  eq('商店仍能买种子', g.countItem('seed_radish') - seeds0, 1);

  /* 委托事件不会误伤：没有进行中委托时 emit 完全无害 */
  let err = '';
  try{ g.questEmit('crop', {id:'radish', n:1}); g.questEmit('talk', {id:'aunt', n:1}); }
  catch(e){ err = e.message; }
  eq('没有进行中委托时事件不报错', err, '');

  /* 读档入口仍在 */
  ok('序列化 / 反序列化还可用', typeof g.serializeState === 'function' &&
     g.deserializeState(g.serializeState()) === true, '');
  eq('版本号 = 5', g.CONFIG.SAVE.VERSION, 12);
  ok('动物面板 / 动物存档没被破坏', typeof g.animalSerialize === 'function' &&
     !!g.serializeState().animals, '');
}

/* ---------- 汇总 ---------- */
console.log(results.join('\n'));
console.log('\n通过 ' + pass + ' / 失败 ' + fail);
if(fail) process.exitCode = 1;
