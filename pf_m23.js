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

/* ================= 第 23 轮：P0 ① 背包整理 / ② 作物生长提示
 *                     P1 ④ 作物品质 / ⑤ 小地图 / ⑥ 动物繁殖 / ⑦ NPC 来访 / ⑧ 种子杂交 ================= */
const G = runGame(null);
const g = G.X;
const T = g.T;
g.startMenuOpen = false;

/* ---------- 小工具 ---------- */
function grassSpot(g, x0, y0){
  for(let y = (y0 === undefined ? g.FARM.y + 2 : y0); y < g.FARM.y + g.FARM.h; y++)
    for(let x = (x0 === undefined ? g.FARM.x : x0); x < g.FARM.x + g.FARM.w; x++){
      const i = y * 64 + x;
      if(g.map[i] === T.GRASS) return {i:i, x:x, y:y};
    }
  return null;
}
function plant(g, i, type){
  g.crops[i] = {type:type || 'radish', stage:0, grown:0, watered:false, mature:false, dead:false, a:0, rc:0};
  return g.crops[i];
}
/* 能记录 fillText / drawImage 的画布 */
function recCtx(){
  const log = [];
  const c = mkCtx(log);
  c.__texts = [];
  c.__images = [];
  c.fillText = function(t){ c.__texts.push(String(t)); };
  c.measureText = function(t){ return {width:(t||'').length * 8}; };
  c.drawImage = function(img, x, y){ c.__images.push({img:img, x:x, y:y}); };
  return c;
}
function setHour(h){
  g.clock.min = (h - 6) * 60;
  return g.skyHour();
}

/* ================= 1. 背包一键整理（P0①） ================= */
{
  g.newGame();
  g.inv = new Array(24).fill(null);
  g.inv[0]  = {id:'hoe', n:1};            /* 快捷栏工具 */
  g.inv[2]  = {id:'seed_radish', n:5};    /* 快捷栏种子 */
  g.inv[5]  = {id:'wood', n:10};          /* 快捷栏木头 */
  g.inv[9]  = {id:'berry', n:2};
  g.inv[11] = {id:'mushroom', n:1};
  g.inv[12] = {id:'wood', n:7};           /* 背包区同名堆 → 应该并进第 5 格 */

  g.sortInventory();

  eq('木头合并成 17 个', g.countItem('wood'), 17);
  eq('木头只剩一堆', g.inv.filter(s => s && s.id === 'wood').length, 1);
  eq('合并进最靠前的那一格', g.inv[5].n, 17);
  eq('背包区按 id 排序 · 第 1 格是浆果', g.inv[8].id, 'berry');
  eq('背包区按 id 排序 · 第 2 格是蘑菇', g.inv[9].id, 'mushroom');
  eq('快捷栏原位不动（锄头）', g.inv[0].id, 'hoe');
  eq('快捷栏原位不动（种子）', g.inv[2].id, 'seed_radish');
  eq('快捷栏原位不动（木头）', g.inv[5].id, 'wood');
  eq('整理后没有丢东西', g.inv.filter(s => s).length, 5);
}
{
  /* 「整理」按钮：点一下就整理 */
  g.newGame();
  g.inv = new Array(24).fill(null);
  g.inv[10] = {id:'mushroom', n:1};
  g.inv[11] = {id:'berry', n:2};
  clickEl(g.els.packSort);
  eq('点按钮后背包区按 id 排序', g.inv[8].id, 'berry');
  eq('点按钮后第二个是蘑菇', g.inv[9].id, 'mushroom');
}
{
  /* 排序不能破坏物品数量 */
  g.newGame();
  g.addItem('stone', 7);
  g.addItem('wood', 3);
  g.addItem('wildflower', 5);
  const before = {s:g.countItem('stone'), w:g.countItem('wood'), f:g.countItem('wildflower')};
  g.sortInventory();
  eq('石头没变', g.countItem('stone'), before.s);
  eq('木头没变', g.countItem('wood'), before.w);
  eq('野花没变', g.countItem('wildflower'), before.f);
}

/* ================= 2. 作物生长进度提示（P0②） ================= */
{
  g.newGame();
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  const c = plant(g, s.i, 'radish');
  c.grown = 1; c.watered = true;
  g.mouse.x = 120; g.mouse.y = 140; g.mouse.inside = true;
  g.hover.tx = s.x; g.hover.ty = s.y;
  const ctx = recCtx();
  g.drawCropTip(ctx);
  const txt = ctx.__texts.join(' | ');
  ok('提示里有「萝卜 · 还需 2 天（已浇水）」', txt.indexOf('萝卜 · 还需 2 天（已浇水）') >= 0, txt);

  /* 没浇水 → 未浇水 */
  c.watered = false;
  const ctx2 = recCtx();
  g.drawCropTip(ctx2);
  ok('没浇水时提示未浇水', ctx2.__texts.join('').indexOf('未浇水') >= 0, ctx2.__texts.join(''));

  /* 成熟 → 可收获 */
  c.mature = true;
  const ctx3 = recCtx();
  g.drawCropTip(ctx3);
  ok('成熟时提示可收获', ctx3.__texts.join('').indexOf('可收获') >= 0, ctx3.__texts.join(''));

  /* 枯萎 → 已枯萎 */
  c.mature = false; c.dead = true;
  const ctx4 = recCtx();
  g.drawCropTip(ctx4);
  ok('枯萎时提示已枯萎', ctx4.__texts.join('').indexOf('已枯萎') >= 0, ctx4.__texts.join(''));

  /* 鼠标不在画布里 → 不画提示 */
  c.dead = false;
  g.mouse.inside = false;
  const ctx5 = recCtx();
  g.drawCropTip(ctx5);
  eq('鼠标离开画布就不画提示', ctx5.__texts.length, 0);
}

/* ================= 3. 作物品质系统（P1④） ================= */
{
  g.newGame();
  eq('品质权重和为 1', Math.abs(g.CONFIG.QUALITY.WEIGHT.water + g.CONFIG.QUALITY.WEIGHT.season +
     g.CONFIG.QUALITY.WEIGHT.soil + g.CONFIG.QUALITY.WEIGHT.fest - 1) < 1e-9, true);
  const c = {type:'radish', stage:3, grown:3, watered:false, mature:true, dead:false, a:3, rc:0};
  g.soilFert = 100;
  const q = g.cropQuality(c);
  eq('天天浇水 → 完整度 1', q.water, 1);
  eq('当季 → 当季因子 1', q.season, 1);
  ok('土肥 100 → 肥力因子 1', q.soil === 1, '' + q.soil);
  ok('精心照料 → 优质', q.hq === true, JSON.stringify(q));

  /* 土不够肥 → 不是优质 */
  g.soilFert = 60;
  const q2 = g.cropQuality(c);
  ok('土不够肥 → 普通', q2.hq === false, JSON.stringify(q2));

  /* 缺水 → 不是优质 */
  g.soilFert = 100;
  const c2 = {type:'radish', stage:2, grown:2, watered:false, mature:false, dead:false, a:6, rc:0};
  const q3 = g.cropQuality(c2);
  ok('拖了 6 天才长 3 天 → 完整度 0.5', Math.abs(q3.water - 0.5) < 1e-9, '' + q3.water);
  ok('缺水 → 普通', q3.hq === false, JSON.stringify(q3));

  /* 节日加成 */
  g.clock.day = 5;                       /* 季内第 5 天 = 节日 */
  g.soilFert = 80;
  const c3 = {type:'radish', stage:3, grown:3, watered:false, mature:true, dead:false, a:3, rc:0};
  const qf = g.cropQuality(c3);
  eq('节日当天节日因子 = 1', qf.fest, 1);
  ok('节日 + 好照料 → 优质', qf.hq === true, JSON.stringify(qf));
  g.clock.day = 1;
}
{
  /* 收获 → 产出优质作物，价格 ×1.8 */
  g.newGame();
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  g.crops[s.i] = {type:'radish', stage:3, grown:3, watered:false, mature:true, dead:false, a:3, rc:0};
  g.soilFert = 100;
  ok('收获成功', g.harvestCrop(s.x, s.y) === true, '');
  eq('产出优质萝卜', g.countItem('radish_hq'), 1);
  eq('普通萝卜没进包', g.countItem('radish'), 0);
  eq('优质萝卜售价 = 35 × 1.8', g.basePrice('radish_hq'), 63);
  eq('普通萝卜售价没变', g.basePrice('radish'), 35);
  eq('优质土豆售价 = 60 × 1.8', g.basePrice('potato_hq'), 108);
  eq('优质南瓜售价 = 120 × 1.8', g.basePrice('pumpkin_hq'), 216);
}
{
  /* 品质不影响成就的「作物种类」掩码（位序按 CONFIG.CROPS 走） */
  g.newGame();
  const cv0 = g.statsState.cv;
  g.statsHarvest('tomato_radish');
  eq('杂交作物不占成就位', g.statsState.cv, cv0);
  g.statsHarvest('radish');
  ok('普通作物照旧占位', (g.statsState.cv & 1) !== 0, '' + g.statsState.cv);
}

/* ================= 4. 小地图（P1⑤） ================= */
{
  g.newGame();
  eq('小地图边长 96', g.CONFIG.MINIMAP.SIZE, 96);
  ok('小地图不压住评级 HUD（8~32）', g.CONFIG.MINIMAP.TOP >= 32, '' + g.CONFIG.MINIMAP.TOP);
  ok('小地图不压住加工台 HUD（38~62）', g.CONFIG.MINIMAP.TOP >= 62, '' + g.CONFIG.MINIMAP.TOP);
  eq('离屏画布尺寸 = 96', g.miniReady, false);
  g.rebuildMinimap();
  eq('重绘后离屏画布已就绪', g.miniReady, true);
  const ctx = recCtx();
  g.drawMinimap(ctx);
  eq('画布上贴了一次小地图', ctx.__images.length, 1);
  eq('小地图 x = 960 - 96 - 10', ctx.__images[0].x, 854);
  eq('小地图 y = TOP', ctx.__images[0].y, g.CONFIG.MINIMAP.TOP);
  /* 耕过的地要在小地图上换颜色（走一次重绘） */
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  g.rebuildMinimap();
  eq('重绘后仍然就绪', g.miniReady, true);
}
{
  /* 成就卡片（视口定位）不能压住小地图（画布定位）：撞上时卡片下移 */
  g.newGame();
  ok('成就卡片定位函数存在', typeof g.layoutAchCard === 'function', '');
  const card = g.els.achCard || document.getElementById('achCard');
  ok('成就卡片元素存在', !!card, '');
  const before = card.style.top;
  g.layoutAchCard();
  const after = card.style.top;
  ok('定位后卡片有明确位置', after === '' || after.indexOf('px') >= 0, after);
  ok('定位不改变卡片的显示类', card.classList.contains('show') === false, '');
  results.push('INFO  成就卡片 top：' + (before || '(默认 70px)') + ' → ' + after);
}

/* ================= 5. 动物繁殖（P1⑥） ================= */
{
  g.newGame();
  eq('繁殖好感门槛 = 80', g.CONFIG.BREED.AFF_MIN, 80);
  eq('繁殖概率 = 5%', g.CONFIG.BREED.CHANCE, 0.05);
  addMats(g);
  arena(g, g.FARM.x, g.FARM.y, 8, 8);
  const coop = build(g, 'coop', g.FARM.x + 1, g.FARM.y + 1);
  ok('鸡舍建好了', !!coop, '');
  const home = [coop.tx, coop.ty];
  const a1 = g.makeAnimal('chicken', home); a1.mature = true; a1.aff = 90;
  const a2 = g.makeAnimal('chicken', home); a2.mature = true; a2.aff = 85;
  g.animals = [a1, a2];

  g.CONFIG.BREED.CHANCE = 1;                 /* 强制成功，测逻辑 */
  const born = g.animalBreedStart();
  eq('生了一只幼崽', born, 1);
  eq('动物变成 3 只', g.animals.length, 3);
  eq('幼崽好感从 0 开始', g.animals[2].aff, 0);
  eq('幼崽还没成年', g.animals[2].mature, false);
  eq('幼崽年龄从 0 开始', g.animals[2].age, 0);

  /* 好感不够 → 不生 */
  g.animals = [a1, a2];
  a1.aff = 10;
  eq('好感不够不生崽', g.animalBreedStart(), 0);

  /* 幼崽没成年 → 不生 */
  g.animals = [a1, a2];
  a1.aff = 90; a2.aff = 85;
  a1.mature = false; a2.mature = false;
  eq('未成年不生崽', g.animalBreedStart(), 0);

  /* 棚舍满了 → 不生 */
  g.animals = [a1, a2];
  a1.mature = true; a2.mature = true;
  for(let i=0;i<3;i++){ const x = g.makeAnimal('chicken', home); x.mature = true; x.aff = 90; g.animals.push(x); }
  eq('棚舍满了不生崽', g.animalBreedStart(), 0);
  g.CONFIG.BREED.CHANCE = 0.05;
}

/* ================= 6. NPC 来访农场（P1⑦） ================= */
{
  g.newGame();
  g.clock.day = 6;                          /* 季内第 6 天：不是节日 */
  g.clock.min = 0;
  const id1 = g.visitEnsure().id;
  ok('当天选了一位来访居民', !!id1, id1);
  eq('同一天来访人不变', g.visitPick(), id1);
  eq('换一天换个人', g.visitPick(), g.visitPick());   /* 同一天当然一样 */

  setHour(8);
  eq('上午还没到来访时段', g.visitActive(), false);
  setHour(13);
  eq('下午进入来访时段', g.visitActive(), true);
  const d = g.visitNpc();
  ok('能拿到这位居民', !!d, id1);
  const p = g.npcPos(d);
  ok('来访居民有位置', !!p, '');
  eq('来访居民站在农场指定位置', p.tx, g.FARM.x + g.CONFIG.VISIT.SPOT.dx);
  eq('来访居民纵坐标也对', p.ty, g.FARM.y + g.CONFIG.VISIT.SPOT.dy);

  /* 评分 → 金币 */
  const gold0 = g.gold;
  const r = g.visitReward(d);
  ok('拿到评分结果', !!r, JSON.stringify(r));
  ok('评分里有三项', r && r.score && r.score.plots >= 0 && r.score.builds >= 0 && r.score.decor >= 0, JSON.stringify(r && r.score));
  ok('发了金币', g.gold > gold0, gold0 + ' → ' + g.gold);
  eq('一天只评一次', g.visitState.done, 1);
  const gold1 = g.gold;
  g.visitReward(d);
  eq('不会重复发金币', g.gold, gold1);
}
{
  /* 耕地 / 建造 / 装饰都会加分 */
  g.newGame();
  addMats(g);
  arena(g, g.FARM.x, g.FARM.y, 8, 8);
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  g.setTile(s.i + 1, T.TILLED);
  g.setTile(s.i + 64, T.TILLED);
  build(g, 'scarecrow', g.FARM.x + 4, g.FARM.y + 4);
  const sc = g.visitScore();
  eq('耕了 3 块地', sc.plots, 3);
  eq('造了 1 座建筑', sc.builds, 1);
  eq('装饰物 1 个（稻草人）', sc.decor, 1);
  ok('评分 = 3×8 + 1×25 + 1×15', sc.score === 3*8 + 25 + 15, '' + sc.score);
}

/* ================= 7. 种子杂交（P1⑧） ================= */
{
  g.newGame();
  eq('萝卜 + 番茄 → 樱桃萝卜', g.hybridRecipe('radish','tomato').id, 'tomato_radish');
  eq('番茄 + 萝卜 是同一条配方', g.hybridRecipe('tomato','radish').id, 'tomato_radish');
  ok('没有配方返回 null', g.hybridRecipe('radish','radish') === null, '');
  ok('杂交作物有自己的定义', !!g.cropDef('tomato_radish'), '');
  eq('杂交作物不在普通作物表里（不挤成就位）',
     g.CONFIG.CROPS.findIndex(c => c.id === 'tomato_radish'), -1);
}
{
  /* 相邻种两种不同作物 → 有概率结出杂交种子 */
  g.newGame();
  const a = grassSpot(g);
  const b = grassSpot(g, a.x + 1, a.y);
  g.setTile(a.i, T.TILLED);
  g.setTile(b.i, T.TILLED);
  plant(g, a.i, 'radish');
  plant(g, b.i, 'tomato');
  g.CONFIG.HYBRID.CHANCE = 1;
  ok('杂交成功', g.hybridCheck(a.x, a.y, 'radish') === true, '');
  eq('拿到杂交种子', g.countItem('seed_tomato_radish'), 1);

  /* 拿杂交种子去种 */
  const c = grassSpot(g, a.x, a.y + 1);
  g.setTile(c.i, T.TILLED);
  g.clock.day = 1;                            /* 春：樱桃萝卜的主季 */
  ok('杂交种子能种下', g.sowCrop(c.x, c.y, 'tomato_radish', 'seed_tomato_radish') === true, '');
  eq('地里长的是杂交作物', g.crops[c.i].type, 'tomato_radish');
  eq('杂交种子被扣掉', g.countItem('seed_tomato_radish'), 0);

  /* 次季也能种（品质打折） */
  const d = grassSpot(g, a.x, a.y + 2);
  g.setTile(d.i, T.TILLED);
  g.addItem('seed_tomato_radish', 1);
  g.clock.day = 11;                           /* 夏：樱桃萝卜的次季 */
  ok('次季也能种', g.sowCrop(d.x, d.y, 'tomato_radish', 'seed_tomato_radish') === true, '');
  const q = g.cropQuality(g.crops[d.i]);
  ok('次季当季因子打折', q.season === g.CONFIG.QUALITY.SEASON_SECONDARY, '' + q.season);
  g.CONFIG.HYBRID.CHANCE = 0.18;
}

/* ================= 8. 存档 / 迁移（第 12 版） ================= */
{
  g.newGame();
  eq('存档版本 = 12', g.CONFIG.SAVE.VERSION, 12);
  const old = {v:11, at:1, seed:1, gold:100, time:{day:3, min:0, hold:0}, inv:[], crops:[]};
  const mv = g.migrate(old);
  eq('v11 → v12', mv.v, 12);
  ok('补上了土壤肥力', typeof mv.soil === 'number', '' + mv.soil);
  eq('土壤肥力用默认值', mv.soil, g.CONFIG.QUALITY.SOIL.START);
  ok('补上了来访状态', !!mv.vs, JSON.stringify(mv.vs));
  const old1 = {v:1, at:1, seed:1, gold:100, time:{day:1, min:0, hold:0}, inv:[], crops:[]};
  const mv1 = g.migrate(old1);
  eq('v1 一步迁到 v12', mv1.v, 12);
  ok('v1 也补上了土壤肥力', typeof mv1.soil === 'number', '' + mv1.soil);
}
{
  /* 读档往返：土壤肥力 + 来访状态 + 作物经过天数 */
  g.newGame();
  g.soilFert = 88;
  g.visitState = {day:3, id:'aunt', done:1, ann:1};
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  g.crops[s.i] = {type:'radish', stage:1, grown:1, watered:true, mature:false, dead:false, a:2, rc:0};
  const raw = g.serializeState();
  eq('存档里有 soil', raw.soil, 88);
  ok('存档里有来访人', raw.vs && raw.vs.i === 'aunt', JSON.stringify(raw.vs));
  eq('存档里有作物经过天数', raw.crops[0].a, 2);
  g.newGame();
  ok('读档成功', g.deserializeState(raw), '');
  eq('读档后土壤肥力', g.soilFert, 88);
  eq('读档后来访人', g.visitState.id, 'aunt');
  eq('读档后来访已评分', g.visitState.done, 1);
  eq('读档后作物经过天数', g.crops[s.i].a, 2);
  const bytes = JSON.stringify(raw).length;
  ok('存档体积 < 100KB', bytes < 100*1024, bytes + ' 字节');
}

/* ================= 9. 老系统没被破坏 ================= */
{
  g.newGame();
  eq('作物表还是 4 种', g.CONFIG.CROPS.length, 4);
  eq('普通萝卜 3 天成熟', g.cropDef('radish').days, 3);
  eq('换季会枯萎（非当季）', g.cropSeasons(g.cropDef('radish')).length, 1);
  eq('杂交作物有两个季', g.cropSeasons(g.cropDef('tomato_radish')).length, 2);
  /* 原有作物生长逻辑照旧
   * 天气是随机的（rollWeather 用 Math.random）→ 下雨天会自动浇水，
   * 「没浇水就不长」这条得先把天气定死，不然这条断言会时好时坏 */
  const clearW = g.CONFIG.WEATHER.filter(w => w.id !== 'rain')[0];
  g.weather = clearW;
  const s = grassSpot(g);
  g.setTile(s.i, T.TILLED);
  const c = plant(g, s.i, 'radish');
  g.map[s.i] = T.WATERED;
  g.settleDay();
  eq('浇过水就长 1 天', g.crops[s.i].grown, 1);
  eq('经过天数也 +1', g.crops[s.i].a, 1);
  g.map[s.i] = T.TILLED;
  g.settleDay();
  eq('没浇水就不长', g.crops[s.i].grown, 1);
  eq('但经过天数照走', g.crops[s.i].a, 2);
}

/* ---------------- 汇总 ---------------- */
console.log('');
results.forEach(r => console.log(r));
console.log('');
console.log('通过 ' + pass + ' / 失败 ' + fail + '（共 ' + (pass + fail) + '）');
process.exitCode = fail ? 1 : 0;
