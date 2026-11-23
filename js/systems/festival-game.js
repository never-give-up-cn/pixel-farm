/* js/systems/festival-game.js — 节日广场小游戏摊位
 *
 * 每季第 5 天，广场上会多出一个游戏摊位；站到广场中央附近按 E 打开。
 * 四个节日各有一套玩法：
 *   春 · 抢种大赛（点嫩芽）
 *   夏 · 甩竿大赛（停浮标，成绩计入渔获赛）
 *   秋 · 接南瓜（移动篮子接落下的南瓜）
 *   冬 · 点灯记忆（记住灯序再复现）
 *
 * 面板打开时世界冻结；Esc 关闭。每天第一次达到领奖线可领金币 + 物品，
 * 之后仍可继续挑战，只刷新最高分。最高分和领奖日期随节日存档一起保存。
 */

'use strict';

window.festGameOpen = false;

const festGameState = {
  mode: '',
  phase: 'idle',            // idle | intro | playing | done
  score: 0,
  stars: 0,
  best: {spring:0, summer:0, autumn:0, winter:0},
  claimedDay: 0,
  runId: 0,
  sequence: []              // 冬季记忆灯序（测试 / 调试用）
};
window.festGameState = festGameState;

let fgEl = null;
let fgMaskEl = null;
let fgTitleEl = null;
let fgScoreEl = null;
let fgHintEl = null;
let fgBodyEl = null;
let fgFootEl = null;

let fgInterval = null;
let fgTimeouts = [];
let fgData = {};

function festGameCfg(){ return (CONFIG.FESTIVAL && CONFIG.FESTIVAL.GAME) || null; }
function festGameModeCfg(mode){
  const g = festGameCfg();
  return g && g.MODES ? (g.MODES[mode] || null) : null;
}
function festGameEl(tag, cls, text){
  const el = document.createElement(tag);
  if(cls) el.className = cls;
  if(text !== undefined) el.textContent = text;
  return el;
}
function festGameEnsure(){
  if(fgEl) return true;
  fgEl = document.getElementById('festGame');
  if(!fgEl) return false;
  fgMaskEl = document.getElementById('festGameMask');
  fgTitleEl = document.getElementById('festGameTitle');
  fgScoreEl = document.getElementById('festGameScore');
  fgHintEl = document.getElementById('festGameHint');
  fgBodyEl = document.getElementById('festGameBody');
  fgFootEl = document.getElementById('festGameFoot');
  if(fgMaskEl) fgMaskEl.addEventListener('mousedown', e=>{
    e.preventDefault();
    festGameClosePanel();
  });
  return true;
}

/* --- 摊位定位 / 交互入口 --- */
function festivalGameNear(){
  if(typeof festivalToday !== 'function' || !festivalToday()) return false;
  if(typeof currentMap !== 'undefined' && !(typeof isTownMap === 'function' ? isTownMap(currentMap) : currentMap === 'valley')) return false;
  const P = CONFIG.FESTIVAL.PLAZA;
  const g = festGameCfg();
  const px = player.x / TILE, py = player.y / TILE;
  const cx = P.x + (P.w - 1) / 2, cy = P.y + (P.h - 1) / 2;
  const reach = (g && g.RANGE) || 2.2;
  const dx = px - cx, dy = py - cy;
  return (dx*dx + dy*dy) <= reach*reach;
}

function festivalGameInteract(){
  const f = (typeof festivalToday === 'function') ? festivalToday() : null;
  if(!f) { if(typeof toast === 'function') toast('今天不是节日，广场上没有小游戏摊位'); return false; }
  if(!festGameModeCfg(f.id)) { if(typeof toast === 'function') toast('摊位还没准备好'); return false; }
  return festGameOpenPanel();
}

/* --- 计时器 --- */
function festGameClearTimers(){
  if(fgInterval){ clearInterval(fgInterval); fgInterval = null; }
  for(const id of fgTimeouts){ clearTimeout(id); }
  fgTimeouts = [];
  fgData = {};
}
function fgLater(fn, ms, runId){
  const id = setTimeout(()=>{
    fgTimeouts = fgTimeouts.filter(x => x !== id);
    if(runId !== undefined && runId !== festGameState.runId) return;
    fn();
  }, ms);
  fgTimeouts.push(id);
  return id;
}
function fgAlive(runId){
  return runId === festGameState.runId && festGameState.phase === 'playing' && !!fgData;
}

/* --- 分数 / 星星 / 奖励 --- */
function festGameStars(mode, score){
  const cfg = festGameModeCfg(mode);
  const st = (cfg && cfg.stars) || [60,120,200];
  const s = Math.max(0, score | 0);
  if(s >= st[2]) return 3;
  if(s >= st[1]) return 2;
  if(s >= st[0]) return 1;
  return 0;
}
function festGameUpdateScore(){
  if(fgScoreEl) fgScoreEl.textContent = (festGameState.score | 0) + ' 分';
}
function festGameDailyText(){
  if(festGameState.claimedDay === clock.day) return '今日奖励已领取';
  const mode = festGameState.mode || ((festivalToday() || {}).id);
  const cfg = festGameModeCfg(mode);
  return cfg ? ('今日首胜奖励：' + cfg.reward.gold + ' 金币起 + ' +
    (itemDef(cfg.reward.id) ? itemDef(cfg.reward.id).name : cfg.reward.id) + '×' + cfg.reward.n)
    : '今日首胜可领奖励';
}
function festGameGrant(mode, score, stars){
  const cfg = festGameModeCfg(mode);
  if(!cfg) return '';
  if(stars < 1) return '未达到领奖线（' + cfg.stars[0] + ' 分）';
  if(festGameState.claimedDay === clock.day) return '今日奖励已领取，本次只刷新最高分';
  const rw = cfg.reward || {};
  const goldAmt = (rw.gold | 0) + Math.max(0, (stars | 0) - 1) * 100;
  let text = '获得 ' + goldAmt + ' 金币';
  if(typeof changeGold === 'function') changeGold(goldAmt);
  else gold += goldAmt;
  if(rw.id){
    const def = (typeof itemDef === 'function') ? itemDef(rw.id) : null;
    const okBag = (typeof canFit !== 'function') || canFit(rw.id, rw.n);
    if(!okBag){
      text += ' · 背包满了，' + (def ? def.name : rw.id) + ' 没装下';
    }else if(typeof addItem === 'function' && addItem(rw.id, rw.n)){
      text += ' · ' + (def ? def.name : rw.id) + '×' + rw.n;
    }
  }
  if(mode === 'summer' && cfg.contest && typeof festivalState !== 'undefined'){
    if(festivalState.day !== clock.day){ festivalState.day = clock.day; festivalState.points = 0; }
    const add = Math.round((score | 0) * cfg.contest);
    festivalState.points = (festivalState.points | 0) + add;
    text += ' · 渔获赛 +' + add + ' 分';
  }
  festGameState.claimedDay = clock.day;
  return text;
}

/* --- 打开 / 关闭 --- */
function festGameOpenPanel(){
  const f = (typeof festivalToday === 'function') ? festivalToday() : null;
  if(!f || !festGameModeCfg(f.id)){
    if(typeof toast === 'function') toast('今天广场上没有小游戏摊位');
    return false;
  }
  if(!festGameEnsure()) return false;
  if(typeof packOpen !== 'undefined' && packOpen && typeof togglePack === 'function') togglePack(false);
  if(typeof shopOpen !== 'undefined' && shopOpen && typeof toggleShop === 'function') toggleShop(false);
  if(typeof npcOpen !== 'undefined' && npcOpen && typeof npcCloseDialog === 'function') npcCloseDialog();
  if(typeof sysOpen !== 'undefined' && sysOpen && typeof toggleSys === 'function') toggleSys(false);

  festGameClearTimers();
  festGameState.runId++;
  festGameState.mode = f.id;
  festGameState.phase = 'intro';
  festGameState.score = 0;
  festGameState.stars = 0;
  festGameState.sequence = [];
  window.festGameOpen = true;
  festGameRenderIntro();
  if(fgEl.classList) fgEl.classList.add('open');
  if(typeof playSfx === 'function') playSfx(660, 'triangle', 0.10, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

function festGameClosePanel(){
  if(!window.festGameOpen && !(fgEl && fgEl.classList.contains('open'))) return false;
  window.festGameOpen = false;
  festGameState.phase = 'idle';
  festGameState.runId++;
  festGameClearTimers();
  if(fgEl && fgEl.classList) fgEl.classList.remove('open');
  return true;
}

/* --- 开始 / 结果 --- */
function festGameStart(){
  const mode = festGameState.mode;
  const cfg = festGameModeCfg(mode);
  if(!cfg || !fgBodyEl) return false;
  festGameClearTimers();
  festGameState.runId++;
  const runId = festGameState.runId;
  festGameState.phase = 'playing';
  festGameState.score = 0;
  festGameState.stars = 0;
  festGameState.sequence = [];
  festGameUpdateScore();
  if(fgTitleEl) fgTitleEl.textContent = cfg.icon + ' ' + cfg.name;
  if(fgHintEl) fgHintEl.textContent = cfg.rule;
  if(fgFootEl) fgFootEl.textContent = 'Esc 关闭 · ' + festGameDailyText();
  fgBodyEl.innerHTML = '';
  if(mode === 'spring') fgStartSpring(runId);
  else if(mode === 'summer') fgStartSummer(runId);
  else if(mode === 'autumn') fgStartAutumn(runId);
  else if(mode === 'winter') fgStartWinter(runId);
  return true;
}

function festGameFinish(){
  if(festGameState.phase !== 'playing') return false;
  const mode = festGameState.mode;
  const cfg = festGameModeCfg(mode);
  if(!cfg) return false;
  const score = festGameState.score | 0;
  const stars = festGameStars(mode, score);
  festGameState.phase = 'done';
  festGameState.stars = stars;
  if(score > (festGameState.best[mode] | 0)) festGameState.best[mode] = score;
  const rewardText = festGameGrant(mode, score, stars);
  festGameClearTimers();
  festGameRenderResult(mode, cfg, score, stars, rewardText);
  if(stars > 0 && typeof playSfx === 'function') playSfx(1046, 'triangle', 0.18, CONFIG.AUDIO.VOLUME);
  else if(typeof playSfx === 'function') playSfx(240, 'sawtooth', 0.12, 0.35);
  return true;
}

function festGameRenderIntro(){
  const mode = festGameState.mode;
  const cfg = festGameModeCfg(mode);
  if(!cfg || !fgBodyEl) return;
  if(fgTitleEl) fgTitleEl.textContent = cfg.icon + ' ' + cfg.name;
  if(fgHintEl) fgHintEl.textContent = cfg.rule;
  if(fgFootEl) fgFootEl.textContent = 'Esc 关闭 · 走近广场摊位按 E 可再次打开';
  festGameUpdateScore();
  fgScoreEl.textContent = '最高 ' + (festGameState.best[mode] | 0) + ' 分';
  fgBodyEl.innerHTML = '';

  const hero = festGameEl('div', 'fg-hero');
  hero.appendChild(festGameEl('div', 'fg-hero-icon', cfg.icon));
  const main = festGameEl('div', 'fg-hero-main');
  main.appendChild(festGameEl('b', '', cfg.name));
  main.appendChild(festGameEl('span', '', cfg.rule));
  hero.appendChild(main);
  fgBodyEl.appendChild(hero);

  const info = festGameEl('div', 'fg-info');
  info.appendChild(festGameEl('span', '', '历史最高 ' + (festGameState.best[mode] | 0) + ' 分'));
  info.appendChild(festGameEl('span', '', festGameDailyText()));
  fgBodyEl.appendChild(info);

  const row = festGameEl('div', 'fg-btnrow');
  const start = festGameEl('button', 'mbtn entry', '开始挑战');
  start.addEventListener('click', e=>{ e.preventDefault(); festGameStart(); });
  const close = festGameEl('button', 'mbtn', '先逛逛');
  close.addEventListener('click', e=>{ e.preventDefault(); festGameClosePanel(); });
  row.appendChild(start); row.appendChild(close);
  fgBodyEl.appendChild(row);
}

function festGameRenderResult(mode, cfg, score, stars, rewardText){
  if(!fgBodyEl) return;
  festGameUpdateScore();
  fgScoreEl.textContent = score + ' 分';
  if(fgHintEl) fgHintEl.textContent = cfg.rule;
  if(fgFootEl) fgFootEl.textContent = 'Esc 关闭 · ' + festGameDailyText();
  fgBodyEl.innerHTML = '';

  const box = festGameEl('div', 'fg-result');
  const starLine = festGameEl('div', 'fg-stars', '★★★☆☆☆'.slice(3 - stars, 6 - stars));
  box.appendChild(starLine);
  box.appendChild(festGameEl('div', 'fg-big', score + ' 分'));
  box.appendChild(festGameEl('div', 'fg-best', '历史最高 ' + (festGameState.best[mode] | 0) + ' 分'));
  box.appendChild(festGameEl('div', 'fg-reward', rewardText || ''));
  fgBodyEl.appendChild(box);

  const row = festGameEl('div', 'fg-btnrow');
  const again = festGameEl('button', 'mbtn entry', '再玩一次');
  again.addEventListener('click', e=>{ e.preventDefault(); festGameStart(); });
  const close = festGameEl('button', 'mbtn', '收下奖励 · 关闭');
  close.addEventListener('click', e=>{ e.preventDefault(); festGameClosePanel(); });
  row.appendChild(again); row.appendChild(close);
  fgBodyEl.appendChild(row);
}

/* =====================================================================
 * 春 · 抢种大赛
 * ===================================================================*/
function fgStartSpring(runId){
  const cfg = festGameModeCfg('spring');
  const wrap = festGameEl('div', 'fg-spring');
  const timeEl = festGameEl('div', 'fg-time', '');
  wrap.appendChild(timeEl);

  const grid = festGameEl('div', 'fg-grid');
  const cells = [];
  for(let i=0;i<12;i++){
    const b = festGameEl('button', 'fg-cell', '');
    b.type = 'button';
    b.dataset.i = String(i);
    grid.appendChild(b);
    cells.push(b);
  }
  wrap.appendChild(grid);
  const status = festGameEl('div', 'fg-status', '嫩芽冒头就点它！点空地 -5 分');
  wrap.appendChild(status);
  fgBodyEl.appendChild(wrap);

  const now = performance.now();
  fgData = {
    kind:'spring', runId:runId, cells:cells, sprouts:new Array(12).fill(null),
    timeEl:timeEl, status:status,
    startAt:now, endAt:now + (cfg.duration || 25) * 1000,
    nextSpawn:now + 250
  };

  grid.addEventListener('click', e=>{
    if(!fgAlive(runId)) return;
    const b = e.target.closest ? e.target.closest('.fg-cell') : null;
    if(!b) return;
    const i = Number(b.dataset.i);
    const s = fgData.sprouts[i];
    const t = performance.now();
    if(s && s.until > t){
      fgData.sprouts[i] = null;
      b.classList.remove('sprout');
      b.textContent = '';
      festGameState.score += 10;
      b.classList.add('good');
      fgLater(()=>b.classList.remove('good'), 180, runId);
      if(typeof playSfx === 'function') playSfx(880, 'triangle', 0.05, CONFIG.AUDIO.VOLUME * 0.7);
    }else{
      festGameState.score = Math.max(0, festGameState.score - 5);
      b.classList.add('miss');
      fgLater(()=>b.classList.remove('miss'), 220, runId);
      if(typeof playSfx === 'function') playSfx(160, 'sawtooth', 0.05, 0.25);
    }
    festGameUpdateScore();
    if(fgData) fgData.status.textContent = '抢收 ' + Math.floor(festGameState.score / 10) + ' 株 · 点空会扣分';
  });

  fgInterval = setInterval(()=>fgTickSpring(runId), 80);
}

function fgTickSpring(runId){
  if(!fgAlive(runId) || fgData.kind !== 'spring') return;
  const now = performance.now();
  for(let i=0;i<12;i++){
    const s = fgData.sprouts[i];
    if(s && now >= s.until){
      fgData.sprouts[i] = null;
      fgData.cells[i].classList.remove('sprout');
      fgData.cells[i].textContent = '';
    }
  }
  if(now >= fgData.nextSpawn){
    const free = [];
    for(let i=0;i<12;i++) if(!fgData.sprouts[i]) free.push(i);
    if(free.length){
      const i = free[(Math.random() * free.length) | 0];
      fgData.sprouts[i] = {until: now + 900};
      fgData.cells[i].classList.add('sprout');
      fgData.cells[i].textContent = '🌱';
    }
    fgData.nextSpawn = now + 330 + Math.random() * 260;
  }
  const left = Math.max(0, fgData.endAt - now);
  fgData.timeEl.textContent = '剩余 ' + Math.ceil(left / 1000) + ' 秒';
  if(left <= 0) festGameFinish();
}

/* =====================================================================
 * 夏 · 甩竿大赛
 * ===================================================================*/
function fgStartSummer(runId){
  const cfg = festGameModeCfg('summer');
  const wrap = festGameEl('div', 'fg-summer');
  const timeEl = festGameEl('div', 'fg-time', '');
  wrap.appendChild(timeEl);

  const track = festGameEl('div', 'fg-track');
  const zone = festGameEl('div', 'fg-zone');
  const marker = festGameEl('div', 'fg-marker');
  track.appendChild(zone); track.appendChild(marker);
  wrap.appendChild(track);

  const status = festGameEl('div', 'fg-status', '浮标进入亮色区时点「收线」');
  wrap.appendChild(status);

  const castBtn = festGameEl('button', 'mbtn entry fg-cast', '🎣 收线');
  castBtn.type = 'button';
  wrap.appendChild(castBtn);
  fgBodyEl.appendChild(wrap);

  const now = performance.now();
  const zoneHalf = 0.11;
  fgData = {
    kind:'summer', runId:runId, timeEl:timeEl, status:status, zone:zone, marker:marker,
    pos:0, dir:1, speed:0.72, zoneHalf:zoneHalf,
    castsLeft:(cfg.casts || 5), totalCasts:(cfg.casts || 5), last:0,
    startAt:now, endAt:now + (cfg.duration || 45) * 1000
  };
  fgSummerPaintZone();

  castBtn.addEventListener('click', e=>{ e.preventDefault(); fgSummerCast(runId); });
  fgInterval = setInterval(()=>fgTickSummer(runId), 30);
}

function fgSummerPaintZone(){
  if(!fgData || !fgData.zone) return;
  const half = fgData.zoneHalf;
  fgData.zone.style.left = ((0.5 - half) * 100).toFixed(2) + '%';
  fgData.zone.style.width = (half * 200).toFixed(2) + '%';
}

function fgTickSummer(runId){
  if(!fgAlive(runId) || fgData.kind !== 'summer') return;
  const now = performance.now();
  const dt = 0.03;
  fgData.pos += fgData.dir * fgData.speed * dt;
  if(fgData.pos >= 1){ fgData.pos = 1; fgData.dir = -1; }
  else if(fgData.pos <= 0){ fgData.pos = 0; fgData.dir = 1; }
  fgData.marker.style.left = (fgData.pos * 100).toFixed(2) + '%';
  const left = Math.max(0, fgData.endAt - now);
  fgData.timeEl.textContent = '剩余 ' + Math.ceil(left / 1000) + ' 秒 · 还剩 ' + fgData.castsLeft + ' 竿';
  if(left <= 0) festGameFinish();
}

function fgSummerCast(runId){
  if(!fgAlive(runId) || fgData.kind !== 'summer') return;
  if(fgData.castsLeft <= 0) return;
  const dist = Math.abs(fgData.pos - 0.5);
  let add = 8, label = '偏得有点远 +8';
  if(dist <= fgData.zoneHalf){ add = 40; label = '正中亮区 +40！'; }
  else if(dist <= fgData.zoneHalf * 1.8){ add = 22; label = '擦到边缘 +22'; }
  festGameState.score += add;
  fgData.castsLeft--;
  fgData.last = add;
  festGameUpdateScore();
  fgData.status.textContent = '第 ' + (fgData.totalCasts - fgData.castsLeft) + ' 竿：' + label;
  if(typeof playSfx === 'function') playSfx(add >= 40 ? 1180 : (add >= 20 ? 880 : 320),
    'triangle', 0.09, CONFIG.AUDIO.VOLUME * 0.8);
  if(fgData.castsLeft <= 0){ festGameFinish(); return; }
  fgData.pos = 0;
  fgData.dir = 1;
  fgData.zoneHalf = Math.max(0.065, fgData.zoneHalf - 0.012);
  fgSummerPaintZone();
}

/* =====================================================================
 * 秋 · 接南瓜
 * ===================================================================*/
function fgStartAutumn(runId){
  const cfg = festGameModeCfg('autumn');
  const wrap = festGameEl('div', 'fg-autumn');
  const timeEl = festGameEl('div', 'fg-time', '');
  wrap.appendChild(timeEl);

  const board = festGameEl('div', 'fg-catch');
  const cart = festGameEl('div', 'fg-cart', '🧺');
  board.appendChild(cart);
  wrap.appendChild(board);

  const status = festGameEl('div', 'fg-status', '← → / A D 移动篮子，接住南瓜');
  wrap.appendChild(status);

  const controls = festGameEl('div', 'fg-controls');
  const left = festGameEl('button', 'mbtn', '← 左移');
  const right = festGameEl('button', 'mbtn', '右移 →');
  left.type = right.type = 'button';
  left.addEventListener('click', e=>{ e.preventDefault(); fgAutumnMove(-1); });
  right.addEventListener('click', e=>{ e.preventDefault(); fgAutumnMove(1); });
  controls.appendChild(left); controls.appendChild(right);
  wrap.appendChild(controls);
  fgBodyEl.appendChild(wrap);

  const now = performance.now();
  fgData = {
    kind:'autumn', runId:runId, timeEl:timeEl, status:status, board:board,
    cartEl:cart, lane:2, lanes:5, items:[],
    startAt:now, endAt:now + (cfg.duration || 30) * 1000,
    nextSpawn:now + 300, caught:0
  };
  fgAutumnPaintCart();

  board.addEventListener('click', e=>{
    if(!fgAlive(runId) || fgData.kind !== 'autumn') return;
    const r = board.getBoundingClientRect();
    const lane = Math.max(0, Math.min(4, Math.floor((e.clientX - r.left) / Math.max(1, r.width) * 5)));
    fgData.lane = lane;
    fgAutumnPaintCart();
  });

  fgInterval = setInterval(()=>fgTickAutumn(runId), 60);
}

function fgAutumnPaintCart(){
  if(!fgData || !fgData.cartEl) return;
  fgData.cartEl.style.left = (((fgData.lane + 0.5) / fgData.lanes) * 100).toFixed(2) + '%';
}
function fgAutumnMove(dir){
  if(!fgData || fgData.kind !== 'autumn' || festGameState.phase !== 'playing') return false;
  fgData.lane = Math.max(0, Math.min(fgData.lanes - 1, fgData.lane + dir));
  fgAutumnPaintCart();
  if(typeof playSfx === 'function') playSfx(520, 'square', 0.02, CONFIG.AUDIO.VOLUME * 0.3);
  return true;
}
function fgAutumnSpawn(){
  const gold = Math.random() < 0.14;
  const lane = (Math.random() * fgData.lanes) | 0;
  const el = festGameEl('div', 'fg-drop' + (gold ? ' gold' : ''), gold ? '🌟' : '🎃');
  el.style.left = (((lane + 0.5) / fgData.lanes) * 100).toFixed(2) + '%';
  el.style.top = '-10%';
  fgData.board.appendChild(el);
  fgData.items.push({lane:lane, y:-0.1, vy:0.42 + Math.random() * 0.18, gold:gold, el:el});
}
function fgTickAutumn(runId){
  if(!fgAlive(runId) || fgData.kind !== 'autumn') return;
  const now = performance.now();
  if(now >= fgData.nextSpawn){
    fgAutumnSpawn();
    fgData.nextSpawn = now + 480 + Math.random() * 240;
  }
  const keep = [];
  for(const it of fgData.items){
    it.y += it.vy * 0.06;
    it.el.style.top = (it.y * 100).toFixed(2) + '%';
    if(it.y >= 0.80){
      if(it.lane === fgData.lane){
        festGameState.score += it.gold ? 30 : 10;
        fgData.caught++;
        fgData.status.textContent = '接住 ' + fgData.caught + ' 个' +
          (it.gold ? '（金南瓜 +30！）' : '（+10）');
        festGameUpdateScore();
        if(typeof playSfx === 'function') playSfx(it.gold ? 1319 : 740, 'triangle', 0.05, CONFIG.AUDIO.VOLUME * 0.7);
      }
      it.el.remove();
      continue;
    }
    if(it.y > 1.08){ it.el.remove(); continue; }
    keep.push(it);
  }
  fgData.items = keep;
  const left = Math.max(0, fgData.endAt - now);
  fgData.timeEl.textContent = '剩余 ' + Math.ceil(left / 1000) + ' 秒';
  if(left <= 0) festGameFinish();
}

/* =====================================================================
 * 冬 · 点灯记忆
 * ===================================================================*/
function fgStartWinter(runId){
  const cfg = festGameModeCfg('winter');
  const wrap = festGameEl('div', 'fg-winter');
  const top = festGameEl('div', 'fg-wrow');
  const lives = festGameEl('div', 'fg-lives', '❤❤❤');
  const round = festGameEl('div', 'fg-round', '第 3 盏');
  top.appendChild(lives); top.appendChild(round);
  wrap.appendChild(top);

  const lamps = [];
  const lampRow = festGameEl('div', 'fg-lamps');
  const icons = ['🏮', '⭐', '🕯️', '❄️'];
  for(let i=0;i<4;i++){
    const b = festGameEl('button', 'fg-lamp lamp' + i, icons[i]);
    b.type = 'button';
    b.dataset.i = String(i);
    lampRow.appendChild(b);
    lamps.push(b);
  }
  wrap.appendChild(lampRow);

  const status = festGameEl('div', 'fg-status', '看灯序…');
  wrap.appendChild(status);
  fgBodyEl.appendChild(wrap);

  fgData = {
    kind:'winter', runId:runId, lamps:lamps, livesEl:lives, roundEl:round, statusEl:status,
    lives:(cfg.lives || 3), round:3, seq:[], index:0, accepting:false
  };
  for(let i=0;i<4;i++){
    lamps[i].addEventListener('click', e=>{
      e.preventDefault();
      fgWinterPress(i, runId);
    });
  }
  fgWinterNextRound(runId);
}

function fgWinterHearts(){
  if(!fgData || !fgData.livesEl) return;
  let s = '';
  for(let i=0;i<(festGameModeCfg('winter').lives || 3);i++) s += (i < fgData.lives ? '❤' : '🖤');
  fgData.livesEl.textContent = s;
}
function fgWinterNextRound(runId){
  if(!fgAlive(runId) || fgData.kind !== 'winter') return;
  const cfg = festGameModeCfg('winter');
  if(fgData.round > (cfg.maxRound || 6)){ festGameFinish(); return; }
  while(fgData.seq.length < fgData.round) fgData.seq.push((Math.random() * 4) | 0);
  festGameState.sequence = fgData.seq.slice();
  fgData.roundEl.textContent = '第 ' + fgData.round + ' 盏';
  fgWinterHearts();
  fgWinterPlaySequence(runId);
}
function fgWinterPlaySequence(runId){
  if(!fgAlive(runId) || fgData.kind !== 'winter') return;
  const d = fgData;
  d.accepting = false;
  d.index = 0;
  d.statusEl.textContent = '看灯序…';
  const step = 620;
  for(let i=0;i<d.seq.length;i++){
    fgLater(()=>{
      if(!fgAlive(runId) || !fgData) return;
      const el = fgData.lamps[d.seq[i]];
      el.classList.add('lit');
      if(typeof playSfx === 'function') playSfx([660, 784, 880, 988][d.seq[i]], 'sine', 0.10, CONFIG.AUDIO.VOLUME * 0.7);
      fgLater(()=>el.classList.remove('lit'), 380, runId);
    }, 250 + i * step, runId);
  }
  fgLater(()=>{
    if(!fgAlive(runId) || !fgData) return;
    fgData.accepting = true;
    fgData.statusEl.textContent = '轮到你了：按顺序点亮';
  }, 250 + d.seq.length * step + 200, runId);
}
function fgWinterPress(i, runId){
  if(!fgAlive(runId) || fgData.kind !== 'winter' || !fgData.accepting) return;
  const d = fgData;
  const el = d.lamps[i];
  el.classList.add('lit');
  fgLater(()=>el.classList.remove('lit'), 240, runId);
  if(i === d.seq[d.index]){
    if(typeof playSfx === 'function') playSfx([660, 784, 880, 988][i], 'sine', 0.08, CONFIG.AUDIO.VOLUME * 0.7);
    d.index++;
    if(d.index >= d.seq.length){
      d.accepting = false;
      const gain = d.seq.length * 30;
      festGameState.score += gain;
      festGameUpdateScore();
      d.round++;
      d.statusEl.textContent = '正确！+' + gain + ' 分';
      if(typeof playSfx === 'function') playSfx(1180, 'triangle', 0.12, CONFIG.AUDIO.VOLUME * 0.7);
      const cfg = festGameModeCfg('winter');
      if(d.round > (cfg.maxRound || 6)) fgLater(()=>festGameFinish(), 700, runId);
      else fgLater(()=>fgWinterNextRound(runId), 900, runId);
    }
  }else{
    d.accepting = false;
    d.lives--;
    fgWinterHearts();
    d.statusEl.textContent = '顺序错了…还剩 ' + d.lives + ' 次机会';
    if(typeof playSfx === 'function') playSfx(150, 'sawtooth', 0.12, 0.35);
    if(d.lives <= 0) fgLater(()=>festGameFinish(), 800, runId);
    else fgLater(()=>fgWinterPlaySequence(runId), 900, runId);
  }
}

/* --- 键盘：秋冬需要方向键 / 提示 --- */
function festGameKey(k){
  if(!window.festGameOpen) return false;
  if(festGameState.phase === 'playing' && festGameState.mode === 'autumn'){
    if(k === 'arrowleft' || k === 'a') return fgAutumnMove(-1);
    if(k === 'arrowright' || k === 'd') return fgAutumnMove(1);
  }
  return false;
}

/* --- 存档：最高分 + 今日领奖日期 --- */
function festGameSerialize(){
  return {
    b: [
      festGameState.best.spring | 0,
      festGameState.best.summer | 0,
      festGameState.best.autumn | 0,
      festGameState.best.winter | 0
    ],
    c: festGameState.claimedDay | 0
  };
}
function festGameDeserialize(o){
  const seasons = ['spring','summer','autumn','winter'];
  for(const s of seasons) festGameState.best[s] = 0;
  festGameState.claimedDay = 0;
  if(o && typeof o === 'object'){
    const b = Array.isArray(o.b) ? o.b : [];
    for(let i=0;i<seasons.length;i++) festGameState.best[seasons[i]] = Math.max(0, b[i] | 0);
    festGameState.claimedDay = Math.max(0, o.c | 0);
  }
}
function festGameResetState(){
  festGameState.best = {spring:0, summer:0, autumn:0, winter:0};
  festGameState.claimedDay = 0;
  festGameState.sequence = [];
  festGameState.phase = 'idle';
  festGameState.runId++;
  festGameClearTimers();
}

Object.assign(window, {
  festGameOpen: false, festGameState,
  festivalGameNear, festivalGameInteract,
  festGameOpenPanel, festGameClosePanel,
  festGameStart, festGameFinish, festGameKey,
  festGameStars, festGameSerialize, festGameDeserialize, festGameResetState
});
export {
  festGameState,
  festivalGameNear, festivalGameInteract,
  festGameOpenPanel, festGameClosePanel,
  festGameStart, festGameFinish, festGameKey,
  festGameStars, festGameSerialize, festGameDeserialize, festGameResetState
};
