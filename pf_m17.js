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

/* 把广场还原成原始地面：采集物是随机刷的，会挡住装饰 → 测试前先清干净 */
function resetPlaza(g){
  const P = g.CONFIG.FESTIVAL.PLAZA;
  for(let y=P.y; y<P.y+P.h; y++)
    for(let x=P.x; x<P.x+P.w; x++){
      const i = y*64 + x;
      g.crops[i] = null;
      g.setTile(i, g.baseMap[i]);
    }
}

/* ================= 1. CONFIG / 命名空间 / 广场 ================= */
{
  const G = runGame(null);
  const g = G.X;
  const F = g.CONFIG.FESTIVAL;
  ok('CONFIG 里有 FESTIVAL 命名空间', !!F, '');
  ok('节日参数没有散落到顶层', g.CONFIG.FESTIVAL_DAY === undefined &&
     g.CONFIG.SELL_MULT === undefined && g.CONFIG.PLAZA === undefined, '');
  eq('每季第 5 天举办', F.DAY, 5);
  eq('丰收节售价 ×1.5', F.SELL_MULT, 1.5);
  eq('灯会送礼 ×3', F.GIFT_MULT, 3);
  eq('渔获赛 3 位对手', F.RIVALS, 3);
  eq('渔获赛奖励是稀有种子 ×3', F.SUMMER_PRIZE.id + ':' + F.SUMMER_PRIZE.n, 'seed_pumpkin:3');
  ok('奖励物品真实存在', !!g.CONFIG.ITEMS[F.SUMMER_PRIZE.id], '');
  eq('四个节日', F.LIST.length, 4);
  ok('四个节日按 春夏秋冬 排列', F.LIST.map(f => f.id).join(',') === 'spring,summer,autumn,winter', '');
  ok('每个节日都有名字 / 图标 / 效果 / 环境音',
     F.LIST.every(f => f.name && f.icon && f.effect && Array.isArray(f.amb) && f.amb.length >= 2), '');
  ok('横幅会停留一会儿', F.BANNER_MS > 1000, F.BANNER_MS + 'ms');
  ok('广场在农场下方 / 在地图内', F.PLAZA.x >= 0 && F.PLAZA.y > g.FARM.y &&
     F.PLAZA.x + F.PLAZA.w <= 64 && F.PLAZA.y + F.PLAZA.h <= 64, JSON.stringify(F.PLAZA));
  eq('存档版本升到 9', g.CONFIG.SAVE.VERSION, 12);
}

/* ================= 2. 日期 → 节日（四季第 5 天，跨年循环） ================= */
{
  const G = runGame(null);
  const g = G.X;
  eq('第 5 天 · 春 · 播种祭', g.festivalToday(5).id, 'spring');
  eq('第 15 天 · 夏 · 渔获赛', g.festivalToday(15).id, 'summer');
  eq('第 25 天 · 秋 · 丰收节', g.festivalToday(25).id, 'autumn');
  eq('第 35 天 · 冬 · 雪夜灯会', g.festivalToday(35).id, 'winter');
  eq('第 45 天回到春季', g.festivalToday(45).id, 'spring');
  eq('第 55 天又是夏季', g.festivalToday(55).id, 'summer');
  eq('非节日（第 4 天）没有', g.festivalToday(4), null);
  eq('非节日（第 6 天）没有', g.festivalToday(6), null);
  eq('第 1 天不是节日', g.festivalToday(1), null);
  eq('季节内第 5 天判定', g.festDayInSeason(15), 5);
  eq('季节索引 春=0', g.festSeasonIdx(5), 0);
  eq('季节索引 冬=3', g.festSeasonIdx(35), 3);
  /* festivalIs 跟着 clock.day 走 */
  g.clock.day = 25;
  eq('clock.day=25 时 festivalIs(autumn)', g.festivalIs('autumn'), true);
  eq('clock.day=25 时不是 summer', g.festivalIs('summer'), false);

  g.newGame();
  eq('新游戏第 1 天没有装饰', g.festivalDecorCount(), 0);
}

/* ================= 3. 日历面板：未来 7 天的节日 / 生日 / 天气 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 1;
  ok('日历默认关闭', g.calOpen === false, '');
  ok('开局看不到日历面板', !hasClass(g.els.cal, 'open'), '');

  /* HUD 日期区域点击打开（模拟真实 mousedown） */
  Object.assign(g.hudDateRect, {x:8, y:60, w:160, h:24});
  const handlers = g.els.game.__h['mousedown'] || [];
  eq('画布挂了 mousedown', handlers.length > 0, true);
  handlers.forEach(fn => fn({button:0, clientX:20, clientY:70, preventDefault(){}}));
  eq('点 HUD 日期打开日历', g.calOpen, true);
  ok('面板加了 open 类', hasClass(g.els.cal, 'open'), '');

  const rows = g.els.calList.children;
  eq('日历显示 7 天', rows.length, 7);
  const t = rows.map(textOf);
  ok('第 1 行是今天且带天气', t[0].indexOf('第 1 天') >= 0 && t[0].indexOf(g.weather.icon) >= 0, t[0]);
  ok('第 5 天能看到「播种祭」（未来的节日）', t[4].indexOf('播种祭') >= 0, t[4]);
  ok('第 3 天能看到老板娘生日（未来的生日）', t[2].indexOf('🎂') >= 0 &&
     t[2].indexOf('杂货店老板娘') >= 0, t[2]);
  ok('未来 7 天里没有节日时不会乱标', t[1].indexOf('播种祭') < 0 && t[4].indexOf('播种祭') >= 0, t[1]);
  ok('副标题写出季节与第几天', textOf(g.els.calSub).indexOf('春') >= 0 &&
     textOf(g.els.calSub).indexOf('/10') >= 0, textOf(g.els.calSub));

  /* 打开时冻结：时间 / 作物 / 动物都停 */
  const m0 = g.clock.min;
  for(let i=0;i<30;i++) g.update(0.5);
  eq('日历打开时时间冻结', g.clock.min, m0);
  const hs = g.hotSel;
  key(G, '3');
  eq('日历打开时其它按键被忽略', g.hotSel, hs);
  key(G, 'escape');
  eq('Esc 关闭日历', g.calOpen, false);
  for(let i=0;i<4;i++) g.update(0.5);
  ok('关闭后时间恢复流动', g.clock.min !== m0, 'before=' + m0 + ' after=' + g.clock.min);

  /* 跨到夏季：日历能看到夏天的渔获赛 */
  g.clock.day = 12;
  g.renderCalendar();
  const t2 = g.els.calList.children.map(textOf);
  ok('第 12 天起的 7 天里能看到「渔获赛」', t2[3].indexOf('渔获赛') >= 0, t2.join(' | '));
  ok('日历里能看到老木匠生日（第 13 天）', t2[1].indexOf('老木匠') >= 0, t2[1]);
  /* 点遮罩关闭 */
  (g.els.calMask.__h['mousedown'] || []).forEach(fn => fn({preventDefault(){}}));
  eq('点遮罩也能关闭', g.calOpen, false);
}

/* ================= 4. 春 · 播种祭：当天播种 → 当晚 ×2 生长 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 5;                             /* 春 · 第 5 天 */
  resetPlaza(g);
  const f = g.festivalDayStart();
  eq('当天是播种祭', f && f.id, 'spring');
  eq('广场立起 4 面彩旗', g.festivalDecorCount(), 4);

  const field = arena(g, g.FARM.x + 2, g.FARM.y + 5, 4, 3);
  const tx = field.x, ty = field.y, idx = ty*64 + tx;
  g.setTile(idx, g.T.TILLED);
  g.inv[0] = {id:'seed_potato', n:5};          /* 土豆：春作物 5 天成熟 */
  g.selectHot(0);
  eq('播种祭当天能播种', g.sowCrop(tx, ty, 'potato'), true);
  const c = g.crops[idx];
  eq('作物记下「播种祭当天」', c.fastDay, 5);
  g.canWater = 20;
  eq('浇水', g.waterTile(tx, ty), true);
  g.rollToNextMorning(false);                  /* 当天夜里结算 */
  eq('跨到第 6 天', g.clock.day, 6);
  eq('播种祭当晚生长 +2（而不是 +1）', c.grown, 2);
  eq('加速标记用掉后清 0', c.fastDay, 0);
  eq('第 6 天不再是节日', g.festivalIs('spring'), false);
  eq('次日装饰自动消失', g.festivalDecorCount(), 0);

  /* 次日再浇水 → 只 +1（节日效果不跨天） */
  g.canWater = 20;
  g.waterTile(tx, ty);
  g.rollToNextMorning(false);
  eq('第 3 天只长 1（×2 只作用于当天播种的作物）', c.grown, 3);

  /* 非节日播种：也是一晚 +1 */
  const i2 = (field.y + 1)*64 + (field.x + 1);
  g.setTile(i2, g.T.TILLED);
  g.clock.day = 7;
  g.inv[0] = {id:'seed_potato', n:5}; g.selectHot(0);
  eq('普通日子播种', g.sowCrop(field.x + 1, field.y + 1, 'potato'), true);
  ok('普通日子不记加速', !g.crops[i2].fastDay, String(g.crops[i2].fastDay));
  g.canWater = 20; g.waterTile(field.x + 1, field.y + 1);
  g.rollToNextMorning(false);
  eq('普通日子一晚只长 1', g.crops[i2].grown, 1);
}

/* ================= 5. 广场装饰：只占干净地面 / 不毁作物 / 还原底图 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 5;
  resetPlaza(g);
  const P = g.CONFIG.FESTIVAL.PLAZA;
  /* 广场里有一格已经耕过 → 不许抢 */
  const ti = P.y*64 + P.x;
  g.setTile(ti, g.T.TILLED);
  /* 另一格铺了石板路 → 也不许抢 */
  const ri = (P.y + 1)*64 + (P.x + 2);
  g.setTile(ri, g.T.GRASS);
  g.roads[ri] = 1;
  g.CONFIG.FESTIVAL.PLAZA.w = P.w;
  g.festivalDayStart();
  ok('耕过的地不会被装饰覆盖', g.map[ti] === g.T.TILLED, 't=' + g.map[ti]);
  ok('铺过路的地不会被装饰覆盖', g.map[ri] !== g.T.FEST_BANNER &&
     g.map[ri] !== g.T.FEST_STALL && g.map[ri] !== g.T.FEST_LANTERN, 't=' + g.map[ri]);
  ok('其余位置照常立彩旗', g.festivalDecorCount() >= 2, 'n=' + g.festivalDecorCount());
  /* 跨天清理：装饰消失但耕地 / 石板路保留 */
  g.clock.day = 5;
  g.rollToNextMorning(false);
  eq('次日装饰清空', g.festivalDecorCount(), 0);
  eq('耕地原样保留', g.map[ti], g.T.TILLED);
  eq('石板路叠加层保留', g.roads[ri], 1);
  /* 被还原的格子等于底图 */
  let restored = true;
  for(let y=P.y; y<P.y+P.h; y++)
    for(let x=P.x; x<P.x+P.w; x++){
      const i = y*64 + x;
      if(g.map[i] === g.T.FEST_BANNER || g.map[i] === g.T.FEST_STALL || g.map[i] === g.T.FEST_LANTERN) restored = false;
    }
  ok('广场没有残留任何装饰图块', restored, '');

  /* 节日装饰格不让建造 */
  g.clock.day = 25; g.festivalDayStart();
  const list = g.festivalDecorList(g.festivalToday());
  const stall = list.find(d => d.t === g.T.FEST_STALL);
  ok('丰收节有集市摊位', !!stall, '');
  eq('装饰格不能建造', g.buildGroundOK(stall.x, stall.y, g.CONFIG.BUILD.RECIPES[0]), '节日装饰先别动');
}

/* ================= 6. 夏 · 渔获赛：积分 / 排名 / 奖励 / 只发一次 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 15;
  resetPlaza(g);
  g.festivalDayStart();
  eq('渔获赛装饰（4 彩旗 + 2 灯笼）', g.festivalDecorCount(), 6);
  eq('开赛积分归零', g.festivalState.points, 0);

  /* 真实钓鱼路径：fishingResolveReel 加分 */
  const fish = g.CONFIG.FISHING.LIST[0];
  g.fishing.fish = fish; g.fishing.pointer = 0.5; g.fishing.zone = 0.5;
  g.fishing.zoneW = 0.4; g.fishing.state = 'reel';
  eq('钓上一条鱼', g.fishingResolveReel(), true);
  eq('积分 = 这条鱼的基础价', g.festivalState.points, g.basePrice(fish.id) | 0);

  /* 对手分数：每天固定、3 个、范围合理 */
  const r1 = g.festivalRivalScores(15), r2 = g.festivalRivalScores(15);
  eq('对手分数按天固定（可复现）', JSON.stringify(r1), JSON.stringify(r2));
  eq('对手 3 个', r1.length, 3);
  ok('对手分数在 60~279', r1.every(s => s >= 60 && s <= 279), r1.join(','));
  const r3 = g.festivalRivalScores(16);
  ok('不同天对手分数不同', JSON.stringify(r1) !== JSON.stringify(r3), '');

  /* 积分超过对手 → 次日领奖 */
  const best = Math.max.apply(null, r1);
  g.festivalState.points = best + 50;
  const prize0 = g.countItem('seed_pumpkin');
  g.rollToNextMorning(false);
  eq('跨到第 16 天', g.clock.day, 16);
  eq('第一名拿到稀有种子 ×3', g.countItem('seed_pumpkin') - prize0, 3);
  eq('领奖状态入档', g.festivalState.claimed, 15);
  ok('领奖有提示', /渔获赛第一名/.test(tipAll(g)), tip(g));
  eq('节日结束装饰清掉', g.festivalDecorCount(), 0);
  /* 再结算一次不会重复发 */
  const prize1 = g.countItem('seed_pumpkin');
  g.festivalDayEnd(15);
  eq('同一届不会重复发奖', g.countItem('seed_pumpkin'), prize1);
}
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 15;
  resetPlaza(g);
  g.festivalDayStart();
  g.festivalState.points = 0;
  const prize0 = g.countItem('seed_pumpkin');
  g.rollToNextMorning(false);
  eq('没拿第一不发种子', g.countItem('seed_pumpkin'), prize0);
  eq('没拿第一不标记领奖', g.festivalState.claimed, 0);
  ok('会播报名次', /排第/.test(tipAll(g)), tip(g));
}

/* ================= 7. 秋 · 丰收节：售价 ×1.5 + 集市 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 25;
  resetPlaza(g);
  g.festivalDayStart();
  eq('丰收节装饰（4 彩旗 + 3 摊位）', g.festivalDecorCount(), 7);
  let stalls = 0;
  for(let i=0;i<g.map.length;i++) if(g.map[i] === g.T.FEST_STALL) stalls++;
  eq('广场出现 3 个集市摊位', stalls, 3);

  /* 作物卖出 ×1.5（真实 sellItem） */
  g.inv[10] = {id:'pumpkin', n:4};
  const unit = g.priceOf('pumpkin');
  const gold0 = g.gold;
  eq('卖南瓜', g.sellItem('pumpkin', 1), true);
  eq('丰收节作物按 1.5 倍收', g.gold - gold0, Math.round(unit * 1.5));
  ok('提示里写出丰收节', /丰收节/.test(tipAll(g)), tip(g));
  eq('售价倍率函数对作物生效', g.festivalSellMult('pumpkin'), 1.5);

  /* 非作物不涨价 */
  g.inv[11] = {id:'wood', n:4};
  eq('木材不受影响', g.festivalSellMult('wood'), 1);

  /* 商店「出售」页的价格显示也跟着 ×1.5 */
  g.shopTab = 'sell';
  const prices = [];
  (function walk(el){
    for(const c of (el.children || [])){
      if((' ' + (c.className || '') + ' ').indexOf(' pr ') >= 0) prices.push(c.innerHTML);
      walk(c);
    }
  })(g.els.shopBody);
  ok('商店出售页显示丰收节 ×1.5', prices.some(h => h.indexOf('×1.5') >= 0), prices.join(' | '));
  ok('商店出售页列出了南瓜', textOf(g.els.shopBody).indexOf('南瓜') >= 0, textOf(g.els.shopBody).slice(0, 80));

  /* NPC 都去广场赶集 */
  const P = g.CONFIG.FESTIVAL.PLAZA;
  const a = g.CONFIG.NPC.LIST[0], b = g.CONFIG.NPC.LIST[1], c = g.CONFIG.NPC.LIST[2];
  const sa = g.npcSpot(a), sb = g.npcSpot(b), sc = g.npcSpot(c);
  eq('老板娘在广场', sa && (sa.x + ',' + sa.y), (P.x + 1) + ',' + P.y);
  eq('老木匠在广场', sb && (sb.x + ',' + sb.y), (P.x + 3) + ',' + P.y);
  eq('邻家女孩在广场', sc && (sc.x + ',' + sc.y), (P.x + 5) + ',' + P.y);
  ok('集市摊位全天都在', sa.from === 0 && sa.to === 24, JSON.stringify(sa));
}
{
  /* 非丰收日：原价、居民按原时刻表 */
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 26;
  g.inv[10] = {id:'pumpkin', n:4};
  const unit = g.priceOf('pumpkin');
  const gold0 = g.gold;
  g.sellItem('pumpkin', 1);
  eq('非节日按原价收', g.gold - gold0, unit);
  const aunt = g.CONFIG.NPC.LIST[0];
  g.clock.min = 0;                            /* 6:00 早市 */
  const spot = g.npcSpot(aunt);
  ok('非节日居民回原时刻表', !spot || spot.x !== g.CONFIG.FESTIVAL.PLAZA.x + 1, JSON.stringify(spot));
}

/* ================= 8. 冬 · 雪夜灯会：夜晚灯光 / 特殊台词 / 送礼 ×3 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 35;
  resetPlaza(g);
  g.festivalDayStart();
  eq('灯会装饰（4 彩旗 + 3 灯笼）', g.festivalDecorCount(), 7);
  let lanterns = 0;
  for(let i=0;i<g.map.length;i++) if(g.map[i] === g.T.FEST_LANTERN) lanterns++;
  eq('广场挂起 3 盏灯笼', lanterns, 3);

  /* 夜晚判定（18:00 ~ 次日 5:00） */
  g.clock.min = 0;    eq('6:00 不算夜晚', g.festivalNight(), false);
  g.clock.min = 720;  eq('18:00 入夜', g.festivalNight(), true);
  g.clock.min = 780;  eq('19:00 是夜晚', g.festivalNight(), true);

  /* 特殊台词 */
  const aunt = g.npcDef('aunt');
  const lines = g.npcPickLines(aunt);
  ok('灯会台词出现在最前面', lines[0].indexOf('灯会') >= 0 && lines[0].indexOf('杂货店老板娘') >= 0, lines[0]);
  ok('原有台词仍然保留', lines.length >= 2, 'n=' + lines.length);
  /* 非冬季节日不加这句 */
  g.clock.day = 5;
  const lines2 = g.npcPickLines(aunt);
  ok('春天没有灯会台词', !lines2.some(l => l.indexOf('灯会') >= 0), '');

  /* 送礼 ×3（真实 npcGiftPick） */
  g.clock.day = 35;
  resetPlaza(g);
  g.festivalDayStart();
  g.inv[0] = {id:'wood', n:5};
  g.giftTarget = 'aunt';
  const aff0 = g.npcAff('aunt');
  eq('送出木材', g.npcGiftPick(0), true);
  eq('灯会送礼好感 ×3（普通 +10 → +30）',
     g.npcAff('aunt') - aff0, g.CONFIG.NPC.GIFT.NORMAL * 3);
  ok('提示里写出灯会加成', /灯会 ×3/.test(tipAll(g)), tip(g));
}
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 36;                            /* 灯会次日 */
  g.inv[0] = {id:'wood', n:5};
  g.giftTarget = 'aunt';
  const aff0 = g.npcAff('aunt');
  g.npcGiftPick(0);
  eq('非灯会送礼恢复 +10', g.npcAff('aunt') - aff0, g.CONFIG.NPC.GIFT.NORMAL);
}

/* ================= 9. 存档 / 迁移 / 读档后节日继续 ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 15;
  resetPlaza(g);
  g.festivalDayStart();
  g.festivalState.points = 123;
  /* 留一株「播种祭加速」的作物，验证 fast 字段 */
  const i = (g.FARM.y + 6)*64 + (g.FARM.x + 3);
  g.crops[i] = {type:'radish', stage:1, grown:1, watered:true, mature:false, dead:false, fastDay:5};
  g.setTile(i, g.T.WATERED);
  const i2 = (g.FARM.y + 6)*64 + (g.FARM.x + 4);
  g.crops[i2] = {type:'radish', stage:0, grown:0, watered:false, mature:false, dead:false};
  g.setTile(i2, g.T.TILLED);
  const s = g.serializeState();
  ok('存档里有 fest 字段', !!s.fest && typeof s.fest === 'object', '');
  ok('fest 是紧凑结构（p/d/c/b 四个数字）',
     ['p','d','c','b'].every(k => typeof s.fest[k] === 'number') && Object.keys(s.fest).length === 4,
     JSON.stringify(s.fest));
  eq('存下当天积分', s.fest.p, 123);
  eq('存下节日日期', s.fest.d, 15);
  ok('作物的加速标记只在非 0 时写入', s.crops.some(c => c.fast === 5), JSON.stringify(s.crops[0]));
  ok('普通作物不写 fast 字段', s.crops.some(c => c.fast === undefined), JSON.stringify(s.crops));

  /* 读回来：仍停留在节日当天 → 装饰 / 积分 / 加速都在 */
  const snap = JSON.parse(JSON.stringify(s));
  g.festivalResetState();
  g.festivalClearDecor();
  eq('清空后没有装饰', g.festivalDecorCount(), 0);
  eq('读档成功', g.deserializeState(snap), true);
  eq('读档后回到第 15 天', g.clock.day, 15);
  eq('读档后仍是渔获赛', g.festivalToday() && g.festivalToday().id, 'summer');
  eq('读档后积分还在', g.festivalState.points, 123);
  eq('读档后装饰重新立起来', g.festivalDecorCount(), 6);
  eq('读档后作物加速标记还在', g.crops[i] && g.crops[i].fastDay, 5);
  /* 读档后当天钓的鱼继续加分 */
  const f2 = g.CONFIG.FISHING.LIST[1];
  const p0 = g.festivalState.points;
  g.festivalAddFish(f2);
  eq('读档后节日效果继续生效', g.festivalState.points, p0 + (g.basePrice(f2.id) | 0));

  /* 读一个"节日已经过去"的档：装饰不许残留 */
  const s2 = JSON.stringify(snap);
  g.clock.day = 16;
  g.festivalResetState();
  g.festivalClearDecor();
  g.deserializeState(JSON.parse(s2));           /* 存档里是第 15 天，读回来仍是 15 */
  eq('读档当天就是节日 → 效果照常', g.festivalIs('summer'), true);

  /* 老档迁移：v5 → v6 / v1 → v6 */
  const v5 = {v:5, gold:88, time:{day:9,min:0,hold:0}, seed:1, crops:[], inv:[],
              npc:{aff:{},gift:{},unl:{}}, dex:{f:0,g:0}, animals:[],
              quest:{r:3,d:1,i:2,o:[],a:[]}};
  const mv5 = g.migrate(v5);
  eq('v5 迁到 v9', mv5.v, 12);
  ok('v5 迁移补上 fest 字段', !!mv5.fest && typeof mv5.fest === 'object', JSON.stringify(mv5.fest));
  eq('迁移后积分从 0 开始', mv5.fest.p, 0);
  eq('迁移保留金币', mv5.gold, 88);
  eq('迁移保留委托信誉', mv5.quest.r, 3);

  const v1 = {v:1, gold:777, time:{day:5,min:120,hold:0}, seed:12345, inv:[], crops:{}};
  const mv1 = g.migrate(v1);
  eq('v1 一步迁到 v9', mv1.v, 12);
  eq('迁移保留金币', mv1.gold, 777);
  ok('v1 迁移同时补齐 quest 与 fest', !!mv1.quest && !!mv1.fest, '');
  eq('迁移失败仍降级而不是清档', g.migrateSave('not-a-save').degraded, true);

  /* 存档体积：5 小时（约 50 天）游玩后 */
  g.newGame();
  g.clock.day = 50;
  g.festivalState = {points: 187, day: 45, claimed: 45, banner: 45};
  const full = g.serializeState();
  const bytes = JSON.stringify(full).length;
  ok('5 小时游玩后存档仍 < 100KB', bytes < 100 * 1024, bytes + ' 字节');
  ok('节日部分只占几十字节', JSON.stringify(full.fest).length < 80,
     JSON.stringify(full.fest).length + ' 字节');
}

/* ================= 10. 环境音 / 横幅（不抛错、能关掉） ================= */
{
  const G = runGame(null);
  const g = G.X;
  g.newGame();
  g.clock.day = 5;
  g.ensureAudio();                             /* 解锁音频（mock AudioContext） */
  let err = '';
  try{ g.festivalDayStart(); }catch(e){ err = e.message; }
  eq('节日环境音不抛错', err, '');
  ok('节日环境音建立起来了', !!g.festAmbience, String(g.festAmbience));
  ok('横幅弹出一次', hasClass(g.els.festBanner, 'show'), g.els.festBanner.className);
  eq('横幅写的就是播种祭', textOf(g.els.festBannerName), '播种祭');
  ok('横幅带上节日图标', textOf(g.els.festBannerIcon).indexOf('🌱') >= 0, textOf(g.els.festBannerIcon));
  /* 同一天再调用不会重复弹 */
  g.els.festBanner.classList.remove('show');
  g.festivalDayStart();
  ok('同一天不会重复弹横幅', !hasClass(g.els.festBanner, 'show'), '');
  /* 跨天停掉环境音 */
  g.clock.day = 6;
  g.rollToNextMorning(false);
  eq('跨天环境音停了', g.festAmbience, null);
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

  /* 商店 */
  g.gold = 500;
  const seeds0 = g.countItem('seed_radish');
  g.shopBuyClick('seed_radish');
  eq('商店仍能买种子', g.countItem('seed_radish') - seeds0, 1);

  /* 钓鱼（非节日不加积分） */
  g.clock.day = 3;
  const f = g.CONFIG.FISHING.LIST[0];
  g.fishing.fish = f; g.fishing.pointer = 0.5; g.fishing.zone = 0.5;
  g.fishing.zoneW = 0.4; g.fishing.state = 'reel';
  eq('非渔获赛照常钓鱼', g.fishingResolveReel(), true);
  eq('非渔获赛不加积分', g.festivalState.points, 0);

  /* 委托 / 动物 / NPC */
  ok('委托板仍有 3 个委托', g.quests.offers.length === 3, '');
  ok('动物存档函数还在', typeof g.animalSerialize === 'function', '');
  ok('NPC 对话仍能开', g.npcOpenDialog(g.npcDef('aunt')) === true, '');
  g.npcCloseDialog();

  /* 建造 / 睡觉 / 序列化 */
  g.addItem('wood', 100); g.addItem('stone', 100);
  const okBuild = build(g, 'fence', field.x + 1, field.y + 1);
  eq('非节日照常建造', okBuild, true);
  eq('序列化 / 反序列化还能用', g.deserializeState(g.serializeState()), true);
  eq('版本号 = 9', g.CONFIG.SAVE.VERSION, 12);
}

/* ---------- 汇总 ---------- */
console.log(results.join('\n'));
console.log('\n通过 ' + pass + ' / 失败 ' + fail);
if(fail) process.exitCode = 1;
