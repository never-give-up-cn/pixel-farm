/* js/systems/endgame.js —— 由 index.html 拆分，原行 11448–11888 */
'use strict';

/* ================= 第 20 轮：终局自动化 / 经营优化 =================
 * 铱质洒水器（额外生长）/ 稻草人（防乌鸦）/ 自动采集箱 / 雇工 / 农场 5 星评级 */
const ratingEl       = document.getElementById('rating');
const ratingMaskEl   = document.getElementById('ratingMask');
const ratingStarsEl  = document.getElementById('ratingStars');
const ratingTotalEl  = document.getElementById('ratingTotal');
const ratingSummaryEl= document.getElementById('ratingSummary');
const ratingListEl   = document.getElementById('ratingList');
const ratingToggleEl = document.getElementById('ratingToggle');
const ratingWorkerEl = document.getElementById('ratingWorker');
const ratingWorkerBtn= document.getElementById('ratingWorkerBtn');
const ratingCloseBtn = document.getElementById('ratingClose');
const endingEl       = document.getElementById('ending');
const endingMaskEl   = document.getElementById('endingMask');
const endingBodyEl   = document.getElementById('endingBody');
const endingCloseBtn = document.getElementById('endingClose');

/* 状态：雇工 / 采集箱累计 / 乌鸦事件记录 / 结算是否播放过 */
window.endgameState = {
  worker: {hired:false, strike:false, paidDay:0, missed:0},
  boxed: 0,
  crow: [],
  ending: false
};
window.ratingOpen = false;             /* 评级面板是否打开（打开时 update() 冻结） */
window.ratingExpanded = false;         /* 评分明细是否展开 */
window.endingOpen = false;             /* 结算画面是否打开（打开时 update() 冻结） */
window.endingPending = false;          /* 达成 5 星 → 下一帧弹结算 */
window.hudRatingRect = {x:0, y:0, w:0, h:0};

/* --- 雇工 --- */
function workerHired(){ return !!endgameState.worker.hired; }
function workerStrike(){ return !!endgameState.worker.strike; }
/* 浇所有耕地（枯萎作物不浇） */
function workerWaterAll(){
  let n = 0;
  for(let i=0;i<map.length;i++){
    if(map[i] !== T.TILLED) continue;
    const c = crops[i];
    if(c && c.dead) continue;
    setTile(i, T.WATERED);
    if(c) c.watered = true;
    n++;
  }
  return n;
}
/* 雇佣（终局目标的一次性花费） */
function workerHire(){
  const W = CONFIG.ENDGAME.WORKER;
  if(workerHired()){ toast('已经雇了雇工'); return false; }
  if(gold < W.COST){
    toast('金币不够（还差 ' + (W.COST - gold) + '）');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6 * 0.6);
    return false;
  }
  changeGold(-W.COST);
  const w = endgameState.worker;
  w.hired = true; w.strike = false; w.paidDay = clock.day; w.missed = 0;
  toast('雇了一位雇工（一次性 ' + W.COST + ' 金，每天 ' + W.WAGE + ' 金，早上自动浇所有耕地）');
  playSfx(1174, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
  ratingRenderPanel();
  return true;
}
/* 补发工资 / 恢复工作 */
function workerPay(){
  const W = CONFIG.ENDGAME.WORKER, w = endgameState.worker;
  if(!w.hired){ toast('还没有雇工'); return false; }
  if(gold < W.WAGE){
    toast('金币不够付工资（还差 ' + (W.WAGE - gold) + '）');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6 * 0.6);
    return false;
  }
  changeGold(-W.WAGE);
  const wasStrike = w.strike;
  w.strike = false; w.paidDay = clock.day; w.missed = 0;
  const n = workerWaterAll();
  toast('付给雇工 ' + W.WAGE + ' 金' + (wasStrike ? '，罢工结束' : '') +
        (n ? '（浇了 ' + n + ' 格地）' : ''));
  playSfx(880, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  ratingRenderPanel();
  return true;
}
/* 每天 6:00：扣日薪 → 浇所有耕地；付不起 → 罢工（次日仍会再尝试自动付） */
function workerDayStart(){
  const W = CONFIG.ENDGAME.WORKER, w = endgameState.worker;
  if(!w.hired) return {watered:0, paid:false, strike:false};
  if(gold >= W.WAGE){
    changeGold(-W.WAGE);
    const wasStrike = w.strike;
    w.paidDay = clock.day; w.strike = false; w.missed = 0;
    const n = workerWaterAll();
    toast('雇工上工了（日薪 ' + W.WAGE + ' 金，浇了 ' + n + ' 格地）' +
          (wasStrike ? '，罢工结束' : ''));
    return {watered:n, paid:true, strike:false};
  }
  w.strike = true; w.missed++;
  toast('⚠ 雇工罢工了：付不起今天 ' + W.WAGE + ' 金的工资（欠 ' + w.missed +
        ' 天）· 按 G → 农场评级 里补发工资');
  playSfx(140, 'sawtooth', 0.14, CONFIG.AUDIO.VOLUME * 0.6);
  return {watered:0, paid:false, strike:true};
}

/* --- 自动采集箱：每天早上把附近棚舍的动物产出收进箱子 --- */
/* 动物所属棚舍旁边（切比雪夫距离内）最近的采集箱 */
function autoboxForAnimal(a){
  if(!a || !a.home) return null;
  const R = CONFIG.ENDGAME.AUTOBOX.RANGE;
  let best = null, bd = Infinity;
  for(const b of buildings){
    if(b.type !== 'autobox' || !b.slots) continue;
    const d = Math.max(Math.abs(b.tx - a.home[0]), Math.abs(b.ty - a.home[1]));
    if(d <= R && d < bd){ bd = d; best = b; }
  }
  return best;
}
/* 采集箱还能不能放下 n 个某物品（先算容量，避免只放一半） */
function autoboxRoom(b, id, n){
  if(!b || !b.slots) return false;
  const d = itemDef(id);
  if(!d) return false;
  const lim = stackLimit(id);
  let room = 0;
  for(const s of b.slots){
    if(!s) room += d.stack ? lim : 1;
    else if(s.id === id) room += Math.max(0, lim - (s.n | 0));
  }
  return room >= n;
}
function autoboxStore(b, id, n){
  if(!autoboxRoom(b, id, n)) return false;
  const d = itemDef(id), lim = stackLimit(id);
  let left = n;
  for(let k=0;k<b.slots.length && left>0;k++){
    const s = b.slots[k];
    if(s && s.id === id){ const t = Math.min(lim - s.n, left); s.n += t; left -= t; }
  }
  for(let k=0;k<b.slots.length && left>0;k++){
    if(b.slots[k]) continue;
    const t = d.stack ? Math.min(lim, left) : 1;
    b.slots[k] = {id:id, n:t}; left -= t;
  }
  if(left > 0) return false;
  endgameState.boxed += n;
  if(chestOpen && openChest === b) refreshChestGrid();
  return true;
}
function autoboxCount(){ let n = 0; for(const b of buildings) if(b.type === 'autobox') n++; return n; }
function autoboxUsed(){
  let n = 0;
  for(const b of buildings) if(b.type === 'autobox' && b.slots) n += b.slots.filter(s => s).length;
  return n;
}

/* --- 稻草人 / 乌鸦事件 --- */
function scarecrowCount(){ let n = 0; for(const b of buildings) if(b.type === 'scarecrow') n++; return n; }
/* 该格是否在任意稻草人的保护半径内（切比雪夫距离） */
function scarecrowProtected(tx, ty){
  const R = CONFIG.ENDGAME.CROW.RANGE;
  for(const b of buildings){
    if(b.type !== 'scarecrow') continue;
    if(Math.max(Math.abs(b.tx - tx), Math.abs(b.ty - ty)) <= R) return true;
  }
  return false;
}
function crowLogPush(day, code){
  endgameState.crow.push([day | 0, code | 0]);
  while(endgameState.crow.length > 8) endgameState.crow.shift();
}
/* 每天早上：8% 概率来乌鸦，随机啄掉 1 株成熟作物（稻草人范围内免疫） */
function crowDayStart(){
  const C = CONFIG.ENDGAME.CROW;
  if(Math.random() >= C.CHANCE) return null;
  const list = [];
  for(let i=0;i<crops.length;i++){
    const c = crops[i];
    if(c && c.mature && !c.dead) list.push(i);
  }
  if(!list.length){ crowLogPush(clock.day, 0); return {code:0, day:clock.day}; }   /* 来了但没得吃 */
  const i = list[(Math.random() * list.length) | 0];
  const tx = i % MAP_W, ty = (i / MAP_W) | 0;
  if(scarecrowProtected(tx, ty)){
    crowLogPush(clock.day, 2);                       /* 2 = 被稻草人挡下 */
    toast('乌鸦来了，但稻草人把地里的作物护住了');
    return {code:2, tx:tx, ty:ty, day:clock.day};
  }
  const c = crops[i];
  const d = cropDef(c.type);
  crops[i] = null;                                   /* 1 = 叼走了一株 */
  crowLogPush(clock.day, 1);
  toast('🐦 乌鸦啄掉了一株' + (d ? d.name : '作物') + '（稻草人的保护范围内可免疫）');
  playSfx(160, 'sawtooth', 0.12, CONFIG.AUDIO.VOLUME * 0.6);
  return {code:1, tx:tx, ty:ty, type:c.type, day:clock.day};
}
function crowLastText(){
  const a = endgameState.crow;
  if(!a.length) return '最近没有乌鸦来过';
  const e = a[a.length - 1];
  return '第 ' + e[0] + ' 天：' + (e[1] === 1 ? '啄走 1 株成熟作物' : e[1] === 2 ? '被稻草人挡下' : '来了但没得吃');
}

/* --- 农场评级：作物种类 / 动物 / 建筑 / 成就 / 扩建期数加权；每 20 分一星 --- */
/* 第 21 轮：评级只在这些数据变化时重算（HUD 每帧读缓存），避免每帧扫 4096 格。 */
window.ratingCache = null;
function ratingInvalidate(){ ratingCache = null; }
function tilledPlots(){
  return tilledCount;                     /* 第 22 轮：增量维护的耕地格数（不再每次扫 4096 格） */
}
/* 兜底：重新数一遍（读档 / 调试用；正常流程由 setTile 增量维护） */
function recountTilled(){
  let n = 0;
  for(let i=0;i<map.length;i++) if(map[i] === T.TILLED || map[i] === T.WATERED) n++;
  tilledCount = n;
  return n;
}
function ratingParts(force){
  if(!force && ratingCache) return ratingCache;   /* 第 21 轮：默认走缓存 */
  const R = CONFIG.ENDGAME.RATING;
  const tilled = tilledPlots();
  const rows = [
    {key:'crop',     name:'作物种类', value:achPopcount(statsState.cv | 0), target:R.CROP_TARGET,   weight:R.WEIGHTS.crop,     unit:'种'},
    {key:'animal',   name:'动物数量', value:animals.length,                  target:R.ANIMAL_TARGET, weight:R.WEIGHTS.animal,   unit:'只'},
    {key:'building', name:'建筑数量', value:buildings.filter(b=>!b.preset).length, target:R.BUILD_TARGET, weight:R.WEIGHTS.building, unit:'座'},
    {key:'ach',      name:'成就数量', value:achCount(),                      target:R.ACH_TARGET,    weight:R.WEIGHTS.ach,      unit:'项'},
    {key:'expand',   name:'扩建期数', value:Math.floor(tilled / R.EXPAND_PLOTS), target:R.EXPAND_TARGET, weight:R.WEIGHTS.expand, unit:'期'}
  ];
  let score = 0;
  for(const r of rows){
    r.pts = Math.round(r.weight * Math.min(1, r.value / r.target));
    score += r.pts;
  }
  const stars = Math.min(R.STARS, Math.floor(score / R.STAR_STEP));
  ratingCache = {score:score, stars:stars, rows:rows, tilled:tilled, starsMax:R.STARS};
  return ratingCache;
}
function ratingStarsText(n){
  const max = CONFIG.ENDGAME.RATING.STARS;
  let s = '';
  for(let i=0;i<max;i++) s += (i < n ? '★' : '☆');
  return s;
}
/* 重新评估（建筑 / 成就 / 收获等变化后调用）；首次凑满 5 星 → 下一帧弹结算 */
function ratingCheck(){
  const info = ratingParts(true);             /* 变化入口：强制重算并刷新缓存 */
  if(info.tilled >= CONFIG.ENDGAME.RATING.EXPAND_PLOTS) sysTipShow('expand');   /* 第 21 轮 */
  if(info.stars >= CONFIG.ENDGAME.RATING.STARS && !endgameState.ending){
    endgameState.ending = true;
    endingPending = true;
    dlog('[rating] 达成农场 5 星：' + info.score + ' 分');
  }
  if(ratingOpen) ratingRenderPanel();
  return info;
}

/* --- 评级面板 --- */
function ratingWorkerText(){
  const W = CONFIG.ENDGAME.WORKER, w = endgameState.worker;
  if(!w.hired) return '雇工：未雇佣（一次性 ' + W.COST + ' 金 · 日薪 ' + W.WAGE + ' 金 · 每天早上自动浇所有耕地）';
  if(w.strike) return '雇工：罢工中！（已欠 ' + w.missed + ' 天工资）· 补发 ' + W.WAGE + ' 金即可恢复工作';
  return '雇工：在职 · 第 ' + w.paidDay + ' 天的工资已付 · 每天早上自动浇所有耕地';
}
function ratingRenderPanel(){
  const info = ratingParts(true);             /* 面板打开次数很少，强制取最新值 */
  const R = CONFIG.ENDGAME.RATING;
  if(ratingStarsEl) ratingStarsEl.textContent = ratingStarsText(info.stars);
  if(ratingTotalEl) ratingTotalEl.textContent = '评分 ' + info.score + ' / 100 · 满 ' + R.STARS + ' 星';
  if(ratingSummaryEl){
    ratingSummaryEl.textContent = info.stars >= R.STARS
      ? '🏆 农场已达 5 星 —— 终局目标达成，可继续经营'
      : ('距离 5 星还差 ' + Math.max(0, 100 - info.score) + ' 分');
  }
  if(ratingListEl && ratingListEl.appendChild){
    ratingListEl.innerHTML = '';
    for(const r of info.rows){
      const row = document.createElement('div'); row.className = 'rrow';
      const nm = document.createElement('span'); nm.className = 'rname'; nm.textContent = r.name;
      const val = document.createElement('span'); val.className = 'rval';
      val.textContent = Math.min(r.value, r.target) + '/' + r.target + ' ' + r.unit;
      const pt = document.createElement('span'); pt.className = 'rpts'; pt.textContent = '+' + r.pts + ' 分';
      row.appendChild(nm); row.appendChild(val); row.appendChild(pt);
      ratingListEl.appendChild(row);
    }
    const note = document.createElement('div'); note.className = 'rnote';
    note.textContent = '扩建期数 = 耕地 ' + info.tilled + ' 格 ÷ ' + R.EXPAND_PLOTS +
                       ' = ' + Math.floor(info.tilled / R.EXPAND_PLOTS) + ' 期（上限 ' + R.EXPAND_TARGET + ' 期）';
    ratingListEl.appendChild(note);
    if(ratingExpanded) ratingListEl.classList.add('open'); else ratingListEl.classList.remove('open');
  }
  if(ratingToggleEl) ratingToggleEl.textContent = ratingExpanded ? '收起明细' : '展开明细';
  if(ratingWorkerEl) ratingWorkerEl.textContent = ratingWorkerText() + '\n' + crowLastText();
  if(ratingWorkerBtn){
    const W = CONFIG.ENDGAME.WORKER, w = endgameState.worker;
    let label = '', off = false;
    if(!w.hired){ label = '雇佣雇工（' + W.COST + ' 金）'; off = gold < W.COST; }
    else if(w.strike || w.paidDay < clock.day){ label = '补发工资（' + W.WAGE + ' 金）'; off = gold < W.WAGE; }
    else { label = '雇工在职（今日已付）'; off = true; }
    ratingWorkerBtn.textContent = label;
    if(ratingWorkerBtn.classList){
      if(off) ratingWorkerBtn.classList.add('off'); else ratingWorkerBtn.classList.remove('off');
    }
  }
}
function ratingOpenPanel(){
  if(ratingOpen) return false;
  if(packOpen) togglePack(false);
  if(shopOpen) toggleShop(false);
  if(chestOpen) toggleChest(false);
  if(makerOpen) makerClosePanel();
  if(animalOpen) animalClosePanel();
  if(questOpen) questClosePanel();
  if(calOpen) calClosePanel();
  if(achOpen) achClosePanel();
  if(annualOpen) annualClosePanel();
  ratingOpen = true;
  ratingExpanded = false;
  ratingRenderPanel();
  setPanelOpen(ratingEl, true);
  playSfx(520, 'square', 0.08, CONFIG.AUDIO.VOLUME);
  return true;
}
function ratingClosePanel(){
  if(!ratingOpen) return;
  ratingOpen = false;
  setPanelOpen(ratingEl, false);
}
function toggleRatingPanel(v){
  const want = (v === undefined) ? !ratingOpen : !!v;
  if(want === ratingOpen) return;
  if(want) ratingOpenPanel(); else ratingClosePanel();
}

/* --- 终局结算画面 --- */
function endingOpenPanel(){
  if(!endingEl || endingOpen) return false;
  endingOpen = true;
  const info = ratingParts(true);
  if(endingBodyEl){
    const lines = [];
    lines.push('评分 ' + info.score + ' / 100 · ' + ratingStarsText(info.stars));
    lines.push(info.rows.map(r => r.name + ' ' + Math.min(r.value, r.target) + '/' + r.target + r.unit).join(' · '));
    lines.push('总资产 ' + gold + ' 金币 · 第 ' + clock.day + ' 天');
    endingBodyEl.textContent = lines.join('\n');
  }
  setPanelOpen(endingEl, true);
  playSfx(784, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  setTimeout(()=>playSfx(988, 'triangle', 0.16, CONFIG.AUDIO.VOLUME * 0.9), 120);
  setTimeout(()=>playSfx(1319, 'triangle', 0.20, CONFIG.AUDIO.VOLUME * 0.9), 240);
  return true;
}
function endingClosePanel(){
  if(!endingOpen) return;
  endingOpen = false;
  setPanelOpen(endingEl, false);
  toast('继续经营吧，农场随时欢迎你回来');
}
/* 右上角 HUD：星级 / 评分（点开评级面板） */
function drawRatingHud(g){
  const info = ratingParts();
  const txt = ratingStarsText(info.stars) + ' ' + info.score;
  g.font = '12px ' + FONT_CJK;
  const tw = g.measureText(txt).width;
  const w = Math.max(112, tw + 38), h = 24, x = VIEW_W - w - 10, y = 8;
  hudRatingRect = {x:x, y:y, w:w, h:h};
  g.fillStyle = CONFIG.COLORS.hudBg; g.fillRect(x, y, w, h);
  g.strokeStyle = (info.stars >= CONFIG.ENDGAME.RATING.STARS) ? '#ffd76a' : CONFIG.COLORS.hudBorder;
  g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.font = '14px ' + FONT_EMOJI; g.fillStyle = CONFIG.COLORS.hudAccent;
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('🌾', x + 7, y + h/2 + 1);
  g.font = '12px ' + FONT_CJK;
  g.fillStyle = (info.stars >= CONFIG.ENDGAME.RATING.STARS) ? '#ffe9b0' : CONFIG.COLORS.hudText;
  g.fillText(txt, x + 27, y + h/2 + 1);
  g.textBaseline = 'top';
}
function hitHudRating(p){
  if(!hudRatingRect || hudRatingRect.w <= 0) return false;
  return p.x >= hudRatingRect.x - 2 && p.x <= hudRatingRect.x + hudRatingRect.w + 2 &&
         p.y >= hudRatingRect.y - 2 && p.y <= hudRatingRect.y + hudRatingRect.h + 2;
}

/* --- 存档 / 读档 / 复位 --- */
function endgameSerialize(){
  const w = endgameState.worker;
  return {
    w: w.hired ? 1 : 0,                 // 是否雇佣
    s: w.strike ? 1 : 0,                // 是否罢工
    p: w.paidDay | 0,                   // 最后一次付工资的天数
    m: w.missed | 0,                    // 欠薪天数
    n: endgameState.boxed | 0,          // 采集箱累计收货（统计展示）
    e: endgameState.ending ? 1 : 0,     // 结算画面是否播放过
    c: endgameState.crow.map(e => ([e[0] | 0, e[1] | 0]))   // 乌鸦事件记录（最多 8 条）
  };
}
function endgameDeserialize(o){
  endgameResetState(true);
  if(!o || typeof o !== 'object') return;
  const w = endgameState.worker;
  w.hired  = !!o.w;
  w.strike = !!o.s;
  w.paidDay = Math.max(0, o.p | 0);
  w.missed  = Math.max(0, o.m | 0);
  endgameState.boxed = Math.max(0, o.n | 0);
  endgameState.ending = !!o.e;
  if(Array.isArray(o.c)){
    for(const e of o.c){
      if(!Array.isArray(e)) continue;
      endgameState.crow.push([e[0] | 0, e[1] | 0]);
    }
    while(endgameState.crow.length > 8) endgameState.crow.shift();
  }
}
function endgameResetState(keepPanels){
  const w = endgameState.worker;
  w.hired = false; w.strike = false; w.paidDay = 0; w.missed = 0;
  endgameState.boxed = 0;
  endgameState.crow.length = 0;
  endgameState.ending = false;
  endingPending = false;
  ratingExpanded = false;
  if(!keepPanels){
    ratingOpen = false;
    endingOpen = false;
    if(ratingEl) setPanelOpen(ratingEl, false);
    if(endingEl) setPanelOpen(endingEl, false);
  }
}
/* 面板事件 */
if(ratingMaskEl) ratingMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); ratingClosePanel(); });
if(ratingCloseBtn) ratingCloseBtn.addEventListener('click', e=>{ e.preventDefault(); ratingClosePanel(); });
if(ratingToggleEl) ratingToggleEl.addEventListener('click', e=>{
  e.preventDefault(); ratingExpanded = !ratingExpanded; ratingRenderPanel();
});
if(ratingWorkerBtn) ratingWorkerBtn.addEventListener('click', e=>{
  e.preventDefault();
  const w = endgameState.worker;
  if(!w.hired) workerHire();
  else if(w.strike || w.paidDay < clock.day) workerPay();
  else toast('今天的工资已经付过了');
});
if(endingMaskEl) endingMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); endingClosePanel(); });
if(endingCloseBtn) endingCloseBtn.addEventListener('click', e=>{ e.preventDefault(); endingClosePanel(); });



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { ratingEl, ratingMaskEl, ratingStarsEl, ratingTotalEl, ratingSummaryEl, ratingListEl, ratingToggleEl, ratingWorkerEl, ratingWorkerBtn, ratingCloseBtn, endingEl, endingMaskEl, endingBodyEl, endingCloseBtn, workerHired, workerStrike, workerWaterAll, workerHire, workerPay, workerDayStart, autoboxForAnimal, autoboxRoom, autoboxStore, autoboxCount, autoboxUsed, scarecrowCount, scarecrowProtected, crowLogPush, crowDayStart, crowLastText, ratingInvalidate, tilledPlots, recountTilled, ratingParts, ratingStarsText, ratingCheck, ratingWorkerText, ratingRenderPanel, ratingOpenPanel, ratingClosePanel, toggleRatingPanel, endingOpenPanel, endingClosePanel, drawRatingHud, hitHudRating, endgameSerialize, endgameDeserialize, endgameResetState });
export { ratingEl, ratingMaskEl, ratingStarsEl, ratingTotalEl, ratingSummaryEl, ratingListEl, ratingToggleEl, ratingWorkerEl, ratingWorkerBtn, ratingCloseBtn, endingEl, endingMaskEl, endingBodyEl, endingCloseBtn, workerHired, workerStrike, workerWaterAll, workerHire, workerPay, workerDayStart, autoboxForAnimal, autoboxRoom, autoboxStore, autoboxCount, autoboxUsed, scarecrowCount, scarecrowProtected, crowLogPush, crowDayStart, crowLastText, ratingInvalidate, tilledPlots, recountTilled, ratingParts, ratingStarsText, ratingCheck, ratingWorkerText, ratingRenderPanel, ratingOpenPanel, ratingClosePanel, toggleRatingPanel, endingOpenPanel, endingClosePanel, drawRatingHud, hitHudRating, endgameSerialize, endgameDeserialize, endgameResetState };
