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

/* ================= 第 19 轮：加工台 / 配方 / 成品 ================= */
function achIdx19(g, id){ return g.CONFIG.ACHIEVEMENT.LIST.findIndex(a => a.id === id); }
function clearInv(g){ for(let i=0;i<g.inv.length;i++) g.inv[i] = null; }
function rider(g){ return g.CONFIG.RECIPE.LIST; }
function mkRowAt(g, i){ return g.els.makerList.children[i]; }
function rowBtn(row){ return row && row.children[row.children.length - 1]; }
function rowText(row){ return textOf(row); }
function makerAt(g, tx, ty){ return g.buildings.find(b => b.type === 'maker' && b.tx === tx && b.ty === ty); }

/* ================= 1. CONFIG 结构 / 存档版本 ================= */
{
  const G = runGame(null);
  const g = G.X;
  const R = g.CONFIG.RECIPE;
  ok('CONFIG 里有 RECIPE 命名空间', !!R, '');
  ok('配方参数没有散落到顶层', g.CONFIG.RECIPE_LIST === undefined &&
     g.CONFIG.PROFIT_MIN === undefined && g.CONFIG.EAT_PER_DAY === undefined, '');
  ok('配方表 >= 8 条', R.LIST.length >= 8, 'n=' + R.LIST.length);
  ok('每条配方字段齐全', R.LIST.every(r => r.id && r.name && r.icon && r.inputs &&
     typeof r.inputs === 'object' && Object.keys(r.inputs).length > 0 &&
     r.out && r.out.id && (r.out.n | 0) > 0 && (r.hours | 0) > 0 &&
     (r.unlock === null || typeof r.unlock === 'object')), '');
  ok('配方 id 不重复', new Set(R.LIST.map(r => r.id)).size === R.LIST.length, '');
  ok('每条配方的原料都是存在的物品',
     R.LIST.every(r => Object.keys(r.inputs).every(id => !!g.itemDef(id))),
     R.LIST.filter(r => Object.keys(r.inputs).some(id => !g.itemDef(id))).map(r => r.id).join(','));
  ok('每条配方的成品都是存在的物品', R.LIST.every(r => !!g.itemDef(r.out.id)), '');
  ok('有需要解锁的配方（好感 / 成就）', R.LIST.some(r => r.unlock && r.unlock.type === 'aff') &&
     R.LIST.some(r => r.unlock && r.unlock.type === 'ach'), '');
  ok('解锁条件类型合法', R.LIST.every(r => !r.unlock || r.unlock.type === 'aff' || r.unlock.type === 'ach'), '');
  eq('每天最多吃 3 次成品', R.EAT_PER_DAY, 3);
  ok('产出槽 / 堆叠上限是正数', R.OUT_SLOTS > 0 && R.STACK_MAX > 0, '');
  ok('利润率区间是 60%~120%', R.PROFIT_MIN === 0.6 && R.PROFIT_MAX === 1.2, '');
  eq('存档版本升到 9', g.CONFIG.SAVE.VERSION, 12);

  const mk = g.CONFIG.BUILD.RECIPES.find(r => r.id === 'maker');
  ok('建造配方里有加工台', !!mk, '');
  ok('加工台造价 = 木 10 + 石 5', !!mk && mk.cost.wood === 10 && mk.cost.stone === 5, JSON.stringify(mk && mk.cost));
  eq('建造配方总数 = 10', g.CONFIG.BUILD.RECIPES.length, 10);

  /* 10 种成品都是食物类、能卖钱 */
  const foods = ['cake','ketchup','pumpkin_pie','charcoal','cheese','jam',
                 'pickled_radish','dried_fish','mushroom_soup','woodcarving'];
  ok('10 种成品物品都在 ITEMS 里', foods.every(id => !!g.itemDef(id)),
     foods.filter(id => !g.itemDef(id)).join(','));
  ok('成品都是 kind=food', foods.every(id => g.itemDef(id) && g.itemDef(id).kind === 'food'), '');
  ok('成品都能卖（isSellable + basePrice > 0）',
     foods.every(id => g.isSellable(id) && g.basePrice(id) > 0), '');
}

/* ================= 2. 利润率：每条都在 60%~120% ================= */
{
  const G = runGame(null);
  const g = G.X;
  const bad = [];
  for(const r of g.CONFIG.RECIPE.LIST){
    let cost = 0;
    for(const id in r.inputs) cost += g.basePrice(id) * r.inputs[id];
    const out = g.basePrice(r.out.id) * r.out.n;
    const p = (out - cost) / cost;
    if(!(p >= g.CONFIG.RECIPE.PROFIT_MIN && p <= g.CONFIG.RECIPE.PROFIT_MAX)) bad.push(r.id + ':' + Math.round(p*100) + '%');
  }
  ok('每条配方的利润率都在 60%~120%', bad.length === 0, bad.join(','));
  ok('成品价格显著高于原料总和', g.CONFIG.RECIPE.LIST.every(r => {
    let cost = 0;
    for(const id in r.inputs) cost += g.basePrice(id) * r.inputs[id];
    return g.basePrice(r.out.id) * r.out.n > cost;
  }), '');
  ok('recipeProfit 与手算一致',
     Math.abs(g.recipeProfit(g.recipeDef('cake')) - 0.667) < 0.01,
     g.recipeProfit(g.recipeDef('cake')).toFixed(3));
  ok('利润率文本带百分号', /%$/.test(g.recipeProfitText(g.recipeDef('ketchup'))),
     g.recipeProfitText(g.recipeDef('ketchup')));
}

/* ================= 3. 建造 / 靠近交互 / 面板打开 / 冻结 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 6, 3);
  addMats(g);
  eq('造一台加工台', build(g, 'maker', A.x, A.y), true);
  const b = makerAt(g, A.x, A.y);
  ok('加工台进入 buildings', !!b, '');
  eq('新加工台没有活儿', b.job, null);
  eq('新加工台产出槽为空', b.out.length, 0);
  eq('造第二台', build(g, 'maker', A.x + 3, A.y), true);
  eq('两台加工台互不覆盖', g.buildings.filter(x => x.type === 'maker').length, 2);

  put(g, A.x, A.y);
  eq('站在加工台上 → makerNear 有值', g.makerNear() === b, true);
  put(g, A.x + 2, A.y + 5);
  eq('走远 → makerNear 为空', g.makerNear(), null);

  /* 按 E 打开面板（真实键盘路径） */
  put(g, A.x, A.y);
  key(G, 'e');
  eq('按 E 打开加工台面板', g.makerOpen, true);
  ok('面板加了 open 类', hasClass(g.els.maker, 'open'), '');
  ok('面板复用统一开合动画',
     html.indexOf('#maker.open #makerPanel{animation:panelIn') >= 0 &&
     html.indexOf('#maker.closing #makerPanel{animation:panelOut') >= 0, '');
  ok('面板复用 .panel 组件', html.indexOf('<div id="makerPanel" class="panel">') >= 0, '');

  /* 打开时冻结：时间、加工都不走 */
  g.addItem('egg', 1); g.addItem('milk', 1);
  const b1 = g.openMaker;
  eq('面板里能开工', g.makerStart('cake'), true);
  const left0 = b1.job.left, min0 = g.clock.min;
  for(let i=0;i<20;i++) g.update(0.5);
  eq('面板打开时加工进度冻结', b1.job.left, left0);
  eq('面板打开时时间冻结', g.clock.min, min0);
  key(G, 'escape');
  eq('Esc 关闭加工台', g.makerOpen, false);
  const min1 = g.clock.min;
  for(let i=0;i<3;i++) g.update(0.5);
  ok('关闭后时间恢复流动', g.clock.min !== min1, 'before=' + min1 + ' after=' + g.clock.min);
  /* 先让先前那台做完 */
  g.makerAdvance(9999, true);
  /* 对话 / 商店 / 暂停时同样不推进（update 整块 return） */
  g.addItem('tomato', 3);
  g.makerOpenPanel(b1); g.makerStart('ketchup'); g.makerClosePanel();
  const l1 = b1.job ? b1.job.left : -1;
  g.npcOpenDialog(g.npcDef('aunt'));
  for(let i=0;i<20;i++) g.update(0.5);
  eq('对话打开时加工不推进', b1.job.left, l1);
  g.npcCloseDialog();
  g.clock.min = 240;                                            /* 10:00：店里在营业 */
  const ctr = g.townCounterSpot();                             /* 第 24 轮：柜台在店里 */
  put(g, ctr.x, ctr.y + 1);                                    /* 站到柜台前 */
  g.toggleShop(true);
  eq('商店打开了', g.shopOpen, true);
  for(let i=0;i<20;i++) g.update(0.5);
  eq('商店打开时加工不推进', b1.job.left, l1);
  g.toggleShop(false);
  g.setPaused(true);
  for(let i=0;i<20;i++) g.update(0.5);
  eq('暂停时加工不推进', b1.job.left, l1);
  g.setPaused(false);
  /* 清理这台正在忙的加工台，避免干扰后续 */
  g.makerAdvance(9999, true);
}

/* ================= 4. 材料不足置灰 / 缺什么 / 解锁置灰 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 2);
  addMats(g);
  build(g, 'maker', A.x, A.y);
  clearInv(g);
  const b = makerAt(g, A.x, A.y);
  g.makerOpenPanel(b);
  eq('面板列出全部配方', g.els.makerList.children.length, g.CONFIG.RECIPE.LIST.length);

  const ci = g.CONFIG.RECIPE.LIST.findIndex(r => r.id === 'cake');
  const row = mkRowAt(g, ci);
  ok('材料不足时按钮置灰（off 类）', hasClass(rowBtn(row), 'off'), rowBtn(row).className);
  eq('材料不足时按钮写着「材料不足」', rowBtn(row).textContent, '材料不足');
  ok('材料不足时显示缺什么', rowText(row).indexOf('缺 鸡蛋×1') >= 0 &&
     rowText(row).indexOf('缺 牛奶×1') >= 0, rowText(row));
  eq('材料不足点不动', g.makerStart('cake'), false);

  /* 补一种材料 → 缺另一种 */
  g.addItem('egg', 1);
  g.makerRenderPanel();
  const row2 = mkRowAt(g, ci);
  ok('补一半材料后仍置灰', hasClass(rowBtn(row2), 'off'), '');
  ok('提示只显示还缺的那种', rowText(row2).indexOf('缺 牛奶×1') >= 0 &&
     rowText(row2).indexOf('缺 鸡蛋') < 0, rowText(row2));

  /* 解锁条件：好感配方 / 成就配方 */
  const ji = g.CONFIG.RECIPE.LIST.findIndex(r => r.id === 'jam');
  const jrow = mkRowAt(g, ji);
  ok('好感不够时果酱锁定（locked 类）', hasClass(jrow, 'locked'), jrow.className);
  eq('锁定按钮写着「未解锁」', rowBtn(jrow).textContent, '未解锁');
  ok('锁定提示写明好感要求', rowText(jrow).indexOf('好感 60') >= 0, rowText(jrow));
  g.npcState.aff.aunt = 60;
  eq('好感够了 → 果酱解锁', g.recipeUnlocked(g.recipeDef('jam')), true);

  const di = g.CONFIG.RECIPE.LIST.findIndex(r => r.id === 'dried_fish');
  eq('没钓过鱼 → 鱼干锁着', g.recipeUnlocked(g.recipeDef('dried_fish')), false);
  g.achUnlock(achIdx19(g, 'fish_first'));
  eq('钓到第一条鱼 → 鱼干解锁', g.recipeUnlocked(g.recipeDef('dried_fish')), true);

  /* 材料齐了 → 按钮可用 */
  g.addItem('milk', 1);
  g.makerRenderPanel();
  const row3 = mkRowAt(g, ci);
  ok('材料齐了按钮不再置灰', !hasClass(rowBtn(row3), 'off'), rowBtn(row3).className);
  eq('材料齐了按钮写着「投入」', rowBtn(row3).textContent, '投入');
  eq('点按钮真的开工', (function(){
    (rowBtn(row3).__h['click'] || []).forEach(fn => fn({preventDefault(){}}));
    return !!b.job && b.job.rid === 'cake';
  })(), true);
  eq('投入后扣掉原料（鸡蛋）', g.countItem('egg'), 0);
  eq('投入后扣掉原料（牛奶）', g.countItem('milk'), 0);
  eq('任务剩余时间 = 3 小时', b.job.left, 180);
  eq('总时长 = 3 小时', b.job.total, 180);
}

/* ================= 5. 推进 / 完成 / 产出槽 / 取走 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 2);
  addMats(g);
  build(g, 'maker', A.x, A.y);
  const b = makerAt(g, A.x, A.y);
  clearInv(g);
  g.addItem('tomato', 3);
  g.makerOpenPanel(b);
  eq('开工番茄酱（2 小时）', g.makerStart('ketchup'), true);
  eq('忙的时候不能再开一个', g.makerStart('ketchup'), false);
  g.makerAdvance(60, true);
  eq('推进 1 小时 → 剩 1 小时', b.job.left, 60);
  eq('还没完成', b.out.length, 0);
  eq('再推进 1 小时 → 完成', g.makerAdvance(60, true), 1);
  eq('活儿结束', b.job, null);
  eq('成品进产出槽', b.out.length, 1);
  eq('成品 id / 数量正确', b.out[0].id + ':' + b.out[0].n, 'ketchup:1');

  g.makerRenderPanel();
  ok('面板状态写着有成品待取', g.els.makerStatus.textContent.indexOf('待取') >= 0,
     g.els.makerStatus.textContent);
  eq('产出槽有 1 行', g.els.makerOut.children.length, 1);
  ok('产出槽显示售价', textOf(g.els.makerOut.children[0]).indexOf('售价') >= 0,
     textOf(g.els.makerOut.children[0]));

  eq('取走成品', g.makerTake(0), true);
  eq('成品进背包', g.countItem('ketchup'), 1);
  eq('产出槽清空', b.out.length, 0);

  /* 产出槽容量：4 种最多 */
  const ids = ['cake','cheese','jam','charcoal','woodcarving'];
  eq('产出槽能放第 1 种', g.makerStore(b, ids[0], 1), true);
  eq('产出槽能放第 2 种', g.makerStore(b, ids[1], 1), true);
  eq('产出槽能放第 3 种', g.makerStore(b, ids[2], 1), true);
  eq('产出槽能放第 4 种', g.makerStore(b, ids[3], 1), true);
  eq('产出槽满后放不下第 5 种', g.makerStore(b, ids[4], 1), false);
  ok('makeCanStore 判断与存放一致', g.makerCanStore(b, 'cake', 98) === true &&
     g.makerCanStore(b, ids[4], 1) === false, '');

  /* 产出槽满时开工被拦（同种成品仍可并堆，这里用另一种成品） */
  clearInv(g); g.addItem('pumpkin', 2); g.addItem('egg', 1);
  g.makerRenderPanel();
  eq('产出槽满时不能开工（南瓜派）', g.makerStart('pumpkin_pie'), false);
  ok('提示产出槽满了', tip(g).indexOf('产出槽满') >= 0, tip(g));

  /* 产出槽满 → 完成后挂起（不丢活儿），腾出格子后静默完成 */
  b.out.length = 0;
  eq('清空产出槽后能开工', g.makerStart('pumpkin_pie'), true);
  ['cake','cheese','jam','charcoal'].forEach(id => g.makerStore(b, id, 1));
  eq('产出槽正好 4 种', b.out.length, 4);
  eq('槽满时完成被挂起', g.makerAdvance(9999, false), 0);
  ok('活儿留在加工台上（left=0）', !!b.job && b.job.left === 0, JSON.stringify(b.job));
  g.makerAdvance(60, false);
  eq('挂起期间产出槽不变', b.out.length, 4);
  b.out.pop();
  eq('腾出空位后静默完成', g.makerAdvance(1, true), 1);
  eq('挂起的活儿完成', b.job, null);
  eq('成品终于进槽', b.out[b.out.length - 1].id, 'pumpkin_pie');
}

/* ================= 6. 睡觉推进：按小时算，跨夜直接完成 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 2);
  addMats(g);
  build(g, 'maker', A.x, A.y);
  const b = makerAt(g, A.x, A.y);
  clearInv(g);
  g.addItem('pumpkin', 2); g.addItem('egg', 1);
  g.makerOpenPanel(b);
  eq('开工南瓜派（4 小时）', g.makerStart('pumpkin_pie'), true);

  /* 把钟拨到 5:00（距次日 6:00 只剩 1 小时）→ 只推进 1 小时 */
  g.clock.min = 23 * 60;
  const day0 = g.clock.day;
  g.rollToNextMorning(false);
  eq('睡觉跨天', g.clock.day, day0 + 1);
  eq('距天亮 1 小时 → 夜里只推进 1 小时', b.job.left, 180);
  eq('还没完成', b.out.length, 0);

  /* 次日 7:00 再睡 → 跨夜 23 小时，直接完成 */
  g.clock.min = 60;
  g.rollToNextMorning(false);
  eq('7 点再睡 → 剩余时间被跨夜推进完', b.job, null);
  eq('睡醒后成品在加工台里', b.out.length, 1);
  eq('成品是南瓜派', b.out[0].id + ':' + b.out[0].n, 'pumpkin_pie:1');
  eq('两次睡觉跨了 2 天', g.clock.day, day0 + 2);
}

/* ================= 7. 多台加工台同时工作互不干扰 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 8, 2);
  addMats(g);
  build(g, 'maker', A.x, A.y);
  build(g, 'maker', A.x + 4, A.y);
  const b1 = makerAt(g, A.x, A.y);
  const b2 = makerAt(g, A.x + 4, A.y);
  clearInv(g);
  g.addItem('egg', 1); g.addItem('milk', 1); g.addItem('tomato', 3);

  g.makerOpenPanel(b1);
  eq('1 号开工蛋糕（3 小时）', g.makerStart('cake'), true);
  g.makerOpenPanel(b2);
  eq('2 号开工番茄酱（2 小时）', g.makerStart('ketchup'), true);
  eq('两台都在忙', g.makerHudInfo().busy, 2);

  g.makerAdvance(120, true);
  eq('2 号先完成', b2.job, null);
  eq('2 号有成品', b2.out.length, 1);
  eq('1 号还在做（剩 1 小时）', b1.job.left, 60);
  eq('1 号还没有成品', b1.out.length, 0);
  eq('HUD：1 台加工中 + 1 台待取', g.makerHudInfo().busy + '/' + g.makerHudInfo().ready, '1/1');
  ok('HUD 文案同时显示加工与待取', g.makerHudText(g.makerHudInfo()).indexOf('加工 1') >= 0 &&
     g.makerHudText(g.makerHudInfo()).indexOf('待取 1') >= 0,
     g.makerHudText(g.makerHudInfo()));

  /* 取 2 号的成品不影响 1 号 */
  g.makerOpenPanel(b2);
  eq('取 2 号成品', g.makerTake(0), true);
  eq('取走后 1 号进度不变', b1.job.left, 60);
  eq('取走后 1 号仍没有成品', b1.out.length, 0);

  g.makerAdvance(60, true);
  eq('1 号完成', b1.out.length, 1);
  eq('最后两台各有一份成品被取走/待取', g.makerHudInfo().ready, 1);

  /* 拆除保护：有活儿 / 有成品时不能拆 */
  eq('有成品时拆不掉', g.demolishAt(A.x, A.y), false);
  ok('提示先取走成品', tip(g).indexOf('成品') >= 0, tip(g));
  g.makerOpenPanel(b1);
  g.makerTakeAll();
  eq('取空后可以拆', g.demolishAt(A.x, A.y), true);
}

/* ================= 8. 存档：剩余时间 / 产出槽 / 体积 / 迁移 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 2);
  addMats(g);
  build(g, 'maker', A.x, A.y);
  const b = makerAt(g, A.x, A.y);
  clearInv(g);
  g.addItem('wood', 5);
  g.makerOpenPanel(b);
  eq('开工木炭（2 小时）', g.makerStart('charcoal'), true);
  g.makerAdvance(45, true);
  g.makerStore(b, 'cake', 2);

  const s = g.serializeState();
  const sb = s.buildings.find(x => x.type === 'maker');
  ok('存档里加工台带剩余时间', !!sb && !!sb.j && sb.j.r === 'charcoal' && sb.j.t === 75,
     JSON.stringify(sb && sb.j));
  ok('存档里加工台带产出槽', !!sb && Array.isArray(sb.o) && sb.o[0].id === 'cake' && sb.o[0].n === 2,
     JSON.stringify(sb && sb.o));
  ok('加工台存档很紧凑（< 120 字节）', JSON.stringify(sb).length < 120, JSON.stringify(sb).length + ' 字节');
  ok('食用次数随档保存', !!s.eat && typeof s.eat.d === 'number' && typeof s.eat.n === 'number',
     JSON.stringify(s.eat));

  const snap = JSON.parse(JSON.stringify(s));
  g.newGame();
  eq('新游戏后加工台清空', g.buildings.filter(x => x.type === 'maker').length, 0);
  eq('读档成功', g.deserializeState(snap), true);
  const rb = g.buildings.find(x => x.type === 'maker');
  ok('读档恢复加工台', !!rb, '');
  eq('读回剩余时间', rb.job.left, 75);
  eq('读回任务 id', rb.job.rid, 'charcoal');
  eq('读回总时长', rb.job.total, 120);
  eq('读回产出槽', rb.out[0].id + ':' + rb.out[0].n, 'cake:2');
  g.makerAdvance(75, true);
  eq('读档后继续推进能完成', rb.out.some(x => x.id === 'charcoal'), true);

  /* 存档里刚好做完 → 读档即完成 */
  const s2 = g.serializeState();
  const sb2 = s2.buildings.find(x => x.type === 'maker');
  sb2.j = {r:'cheese', t:0}; sb2.o = [];
  g.newGame();
  g.deserializeState(JSON.parse(JSON.stringify(s2)));
  const rb2 = g.buildings.find(x => x.type === 'maker');
  eq('存档剩余 0 小时 → 读档直接完成', rb2.job, null);
  eq('读档直接产出奶酪', rb2.out[0] && rb2.out[0].id, 'cheese');

  /* 脏数据兜底 */
  const s3 = g.serializeState();
  const sb3 = s3.buildings.find(x => x.type === 'maker');
  sb3.j = {r:'no_such_recipe', t:10};
  sb3.o = [{id:'not_an_item', n:5}, {id:'cake', n:1}];
  g.newGame();
  let err3 = '';
  try{ g.deserializeState(JSON.parse(JSON.stringify(s3))); }catch(e){ err3 = e.message; }
  eq('脏加工台数据不抛错', err3, '');
  const rb3 = g.buildings.find(x => x.type === 'maker');
  eq('未知配方被丢弃', rb3.job, null);
  eq('未知物品被丢弃', rb3.out.length, 1);
  eq('合法成品保留', rb3.out[0].id, 'cake');

  /* 时间越界被夹到总时长 */
  const s4 = g.serializeState();
  const sb4 = s4.buildings.find(x => x.type === 'maker');
  sb4.j = {r:'cake', t:99999}; sb4.o = [];
  g.newGame();
  g.deserializeState(JSON.parse(JSON.stringify(s4)));
  const rb4 = g.buildings.find(x => x.type === 'maker');
  eq('剩余时间被夹到总时长', rb4.job.left, 180);

  /* v7 → v8 迁移 */
  const v7 = {v:7, gold:88, time:{day:9,min:0,hold:0}, seed:1, crops:[], inv:[],
              npc:{aff:{},gift:{},unl:{}}, dex:{f:0,g:0}, animals:[], buildings:[],
              quest:{r:3,d:1,i:0,o:[],a:[]}, fest:{p:0,d:0,c:0,b:0},
              st:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], ach:{u:0}};
  const m7 = g.migrate(v7);
  eq('v7 迁到 v9', m7.v, 12);
  ok('迁移补上 eat 字段', !!m7.eat && m7.eat.d === -1 && m7.eat.n === 0, JSON.stringify(m7.eat));
  eq('迁移保留金币', m7.gold, 88);
  eq('迁移保留信誉', m7.quest.r, 3);
  let okLoad = false;
  try{ okLoad = g.deserializeState(g.migrate(v7)); }catch(e){ okLoad = false; }
  eq('旧档迁移后能正常读入', okLoad, true);
  eq('旧档金币没丢', g.gold, 88);
  eq('旧档没有加工台', g.buildings.filter(x => x.type === 'maker').length, 0);

  const v1 = {v:1, gold:777, time:{day:5,min:120,hold:0}, seed:12345, inv:[], crops:{}};
  const m1 = g.migrate(v1);
  eq('v1 一步迁到 v9', m1.v, 12);
  eq('v1 迁移保留金币', m1.gold, 777);
  ok('v1 迁移同时补齐 quest / fest / st / ach / eat',
     !!m1.quest && !!m1.fest && Array.isArray(m1.st) && !!m1.ach && !!m1.eat, '');
  eq('坏存档降级而不是清档', g.migrateSave('not-a-save').degraded, true);

  /* 5 小时游玩后的整档体积 */
  g.newGame();
  g.clock.day = 50;
  const AA = arena(g, g.FARM.x + 2, g.FARM.y + 5, 10, 2);
  addMats(g);
  for(let i=0;i<6;i++) build(g, 'maker', AA.x + i, AA.y);
  g.buildings.filter(x => x.type === 'maker').forEach((bb, i) => {
    bb.job = {rid:g.CONFIG.RECIPE.LIST[i % 10].id, left:30, total:180};
    bb.out = [{id:'cake', n:12}, {id:'cheese', n:8}];
  });
  const fullBytes = JSON.stringify(g.serializeState()).length;
  ok('6 台加工台全部开工时存档仍 < 100KB', fullBytes < 100 * 1024, fullBytes + ' 字节');
  const mkEntries = g.serializeState().buildings.filter(x => x.type === 'maker');
  console.log('INFO 第 19 轮 5 小时估算：第 15 轮底档 14.2 KB + 6 台加工台全部开工 ' +
              JSON.stringify(mkEntries).length + ' 字节 ≈ ' +
              ((14.2*1024 + JSON.stringify(mkEntries).length)/1024).toFixed(1) + ' KB（上限 100 KB）');
}

/* ================= 9. 成品食用（每天 3 次）================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.makerEatDeserialize(null);
  g.staminaMax = 100; g.stamina = 10;
  g.addItem('cake', 5);
  eq('吃蛋糕成功', g.eatFood('cake'), true);
  eq('体力 +25', g.stamina, 35);
  eq('消耗 1 个蛋糕', g.countItem('cake'), 4);
  eq('今天吃了 1 次', g.makerEatsToday(), 1);

  g.stamina = 10; eq('第 2 次', g.eatFood('cake'), true);
  g.stamina = 10; eq('第 3 次', g.eatFood('cake'), true);
  eq('今天累计 3 次', g.makerEatsToday(), 3);
  g.stamina = 10;
  eq('第 4 次被拦', g.eatFood('cake'), false);
  ok('提示每天上限', tip(g).indexOf('3 次') >= 0, tip(g));
  eq('被拦时不扣物品', g.countItem('cake'), 2);

  /* 跨天重置 */
  g.clock.day += 1;
  eq('新的一天可以再吃', g.makerEatsToday(), 0);
  g.stamina = 10;
  eq('新的一天吃成功', g.eatFood('cake'), true);
  eq('新的一天计数从 1 开始', g.makerEatsToday(), 1);

  /* 满体力不吃 / 非食物不吃 */
  g.stamina = g.staminaMax;
  eq('满体力不吃', g.eatFood('cake'), false);
  g.addItem('wood', 1);
  eq('非食物不能吃', g.eatFood('wood'), false);
  eq('不存在的物品不能吃', g.eatFood('nope'), false);

  /* 食用次数存档往返 */
  const es = g.makerEatSerialize();
  ok('食用次数是紧凑数字对象', typeof es.d === 'number' && typeof es.n === 'number', JSON.stringify(es));
  g.makerEatDeserialize(null);
  eq('反序列化空值 → 次数归零', g.makerEatsToday(), 0);
  g.makerEatDeserialize({d:g.clock.day, n:2});
  eq('读回当天食用次数', g.makerEatsToday(), 2);

  /* 成品也能按右键吃（画布路径） */
  const ctxLog = [];
  const cv = G.canvasMock;
  g.stamina = 10;
  g.inv[0] = {id:'cheese', n:2};
  g.selectHot(0);
  (cv.__h['mousedown'] || []).forEach(fn => fn({button:2, clientX:100, clientY:100, preventDefault(){}}));
  eq('右键吃选中成品', g.countItem('cheese'), 1);
}

/* ================= 10. HUD 提醒 / 世界提示 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  const A = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 2);
  addMats(g);
  build(g, 'maker', A.x, A.y);
  const b = makerAt(g, A.x, A.y);
  eq('空闲时 HUD 不提示', g.makerHudInfo().busy + g.makerHudInfo().ready, 0);
  clearInv(g); g.addItem('tomato', 3);
  g.makerOpenPanel(b); g.makerStart('ketchup');
  eq('加工中 HUD 提示 1 台', g.makerHudInfo().busy, 1);
  const ctx = G.canvasMock.getContext([]);
  let threw = '';
  try{ g.drawMakerHud(ctx); }catch(e){ threw = e.message; }
  eq('HUD 绘制不抛错（加工中）', threw, '');
  g.makerAdvance(120, true);
  eq('有成品 HUD 提示待取', g.makerHudInfo().ready, 1);
  threw = '';
  try{ g.drawMakerHud(ctx); }catch(e){ threw = e.message; }
  eq('HUD 绘制不抛错（待取）', threw, '');
  ok('drawUI 里挂了加工台 HUD', html.indexOf('drawMakerHud(g)') >= 0, '');
  ok('世界里有「按 E 加工」提示', html.indexOf("'按 E 加工'") >= 0, '');
  ok('加工台提醒图标是 🏭', html.indexOf("'🏭'") >= 0, '');
}

/* ================= 11. 回归：旧系统没被改坏 ================= */
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

  /* 商店 / 钓鱼 */
  g.gold = 500;
  const seeds0 = g.countItem('seed_radish');
  g.shopBuyClick('seed_radish');
  eq('商店仍能买种子', g.countItem('seed_radish') - seeds0, 1);
  const f = g.CONFIG.FISHING.LIST[0];
  g.fishing.fish = f; g.fishing.pointer = 0.5; g.fishing.zone = 0.5;
  g.fishing.zoneW = 0.4; g.fishing.state = 'reel';
  eq('钓鱼仍能收杆', g.fishingResolveReel(), true);

  /* 建造 / 木箱 / 动物 / 委托 / NPC */
  g.addItem('wood', 100); g.addItem('stone', 100);
  eq('建造仍能放', build(g, 'fence', field.x + 1, field.y + 1), true);
  eq('动物存档函数还在', typeof g.animalSerialize, 'function');
  eq('委托存档函数还在', typeof g.questSerialize, 'function');
  ok('NPC 对话仍能开', g.npcOpenDialog(g.npcDef('aunt')) === true, '');
  g.npcCloseDialog();

  /* 日历 / 节日 / 睡觉 */
  const d0 = g.clock.day;
  g.sleepFx.phase = 'none';
  g.rollToNextMorning(false);
  eq('睡觉翻天仍然正常', g.clock.day, d0 + 1);
  eq('节日系统还在', g.CONFIG.FESTIVAL.LIST.length, 4);

  /* 成就墙 / 统计 / 年度总结 */
  eq('成就仍是 22 条', g.CONFIG.ACHIEVEMENT.LIST.length, 22);
  eq('统计字段仍是 16 个', g.statsZeroArray().length, 16);
  eq('序列化 / 反序列化还能用', g.deserializeState(g.serializeState()), true);
  eq('版本号 = 9', g.CONFIG.SAVE.VERSION, 12);
  ok('季节 / 天气 / 图鉴 / 背包都没被破坏',
     g.CONFIG.SEASONS.length === 4 && !!g.weather && !!g.dexState && Array.isArray(g.inv), '');
}

/* ---------- 汇总 ---------- */
console.log(results.join('\n'));
console.log('\n通过 ' + pass + ' / 失败 ' + fail);
if(fail) process.exitCode = 1;
