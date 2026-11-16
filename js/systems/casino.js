/* js/systems/casino.js — 赌场：老虎机 / 轮盘 / 齐先生任务 / 齐币兑换。
 *
 * 小镇的「赌场」建筑里摆着两台老虎机、一张轮盘桌和一个兑换柜。
 * 齐先生任务线第 1 环给「俱乐部卡」，之后才能玩赌桌；任务奖励和兑换都用齐币。
 * 打开面板时世界时间冻结（和商店 / 木箱同一套规则）。
 */

'use strict';

const casinoState = {
  card: false,          // 俱乐部卡（任务 1 奖励）
  coins: 0,             // 齐币余额
  done: {},             // 一次性任务完成标记
  repeat: 0,            // 重复任务完成次数
  wager: 0,             // 累计下注（任务 4 用）
  played: 0,            // 玩了几局
  won: 0,               // 累计赢到多少齐币
  bet: 10,              // 当前下注档位
  tab: 'slots',         // 当前页签
  spinning: false
};
window.casinoState = casinoState;
window.casinoOpen = false;

let casinoEl = null;
let casinoMaskEl = null;
let casinoBodyEl = null;
let casinoTabsEl = null;
let casinoCoinsEl = null;
let casinoFootEl = null;
let casinoTabEls = [];
let slotTimer = null;
let slotRefs = null;

function casinoEnsure(){
  if (casinoEl) return true;
  casinoEl = document.getElementById('casino');
  casinoMaskEl = document.getElementById('casinoMask');
  casinoBodyEl = document.getElementById('casinoBody');
  casinoTabsEl = document.getElementById('casinoTabs');
  casinoCoinsEl = document.getElementById('casinoCoins');
  casinoFootEl = document.getElementById('casinoFoot');
  if (!casinoEl) return false;
  if (casinoMaskEl) casinoMaskEl.addEventListener('mousedown', e => {
    e.preventDefault();
    casinoClosePanel();
  });
  if (casinoTabsEl) {
    casinoTabEls = Array.from(casinoTabsEl.querySelectorAll('[data-tab]'));
    for (const b of casinoTabEls) {
      b.addEventListener('click', e => {
        e.preventDefault();
        casinoSetTab(b.getAttribute('data-tab'));
        if (typeof ensureAudio === 'function') ensureAudio();
      });
    }
  }
  return true;
}

function casinoHasCard(){ return !!casinoState.card; }

function casinoUpdateCoins(){
  if (casinoCoinsEl) casinoCoinsEl.textContent = '齐币 ' + casinoState.coins;
}

function casinoLockedHtml(){
  return '<div class="clocked">🔒 保镖拦住了你：<b>需要俱乐部卡</b>。<br>' +
         '先和齐先生说话，完成「第一课 · 耐心」。</div>';
}

/* ---------- 页签 ---------- */
function casinoSetTab(tab){
  casinoState.tab = tab;
  casinoRender();
}

function casinoRender(){
  if (!casinoEnsure()) return;
  casinoUpdateCoins();
  for (const b of casinoTabEls) b.classList.toggle('on', b.getAttribute('data-tab') === casinoState.tab);
  casinoBodyEl.innerHTML = '';
  slotRefs = null;
  if (casinoState.tab === 'qi') casinoRenderQi();
  else if (!casinoState.card) casinoBodyEl.innerHTML = casinoLockedHtml();
  else if (casinoState.tab === 'slots') casinoRenderSlots();
  else if (casinoState.tab === 'roulette') casinoRenderRoulette();
  else if (casinoState.tab === 'shop') casinoRenderShop();
  if (casinoFootEl) {
    casinoFootEl.textContent = casinoState.card
      ? 'Esc 关闭 · 每次下注扣除齐币 · 齐币只能在赌场里花'
      : 'Esc 关闭 · 找齐先生完成第一课，拿到俱乐部卡';
  }
}

/* ---------- 老虎机 ---------- */
function casinoPickSymbol(){
  const list = CONFIG.CASINO.SLOT.SYMBOLS;
  let total = 0;
  for (const s of list) total += s.weight;
  let r = Math.random() * total;
  for (const s of list) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return list[0];
}

function casinoRenderSlots(){
  const wrap = document.createElement('div');
  wrap.className = 'cgame';

  const table = document.createElement('div');
  table.className = 'cslot';
  const reels = [];
  for (let i = 0; i < 3; i++) {
    const r = document.createElement('div');
    r.className = 'creel';
    r.textContent = ['🍒', '🔔', '💎'][i];
    table.appendChild(r);
    reels.push(r);
  }
  wrap.appendChild(table);

  const result = document.createElement('div');
  result.className = 'cresult';
  result.textContent = '三个相同符号即可中奖 · 两个樱桃退回本金';
  wrap.appendChild(result);

  const betRow = document.createElement('div');
  betRow.className = 'cbetrow';
  const betLabel = document.createElement('span');
  betLabel.className = 'clabel';
  betLabel.textContent = '下注';
  betRow.appendChild(betLabel);
  for (const step of CONFIG.CASINO.BET_STEPS) {
    const b = document.createElement('button');
    b.className = 'mbtn' + (casinoState.bet === step ? ' on' : '');
    b.textContent = step;
    b.addEventListener('click', e => {
      e.preventDefault();
      casinoState.bet = step;
      casinoRender();
    });
    betRow.appendChild(b);
  }
  wrap.appendChild(betRow);

  const spin = document.createElement('button');
  spin.className = 'mbtn entry';
  spin.textContent = '🎰 拉杆（' + casinoState.bet + ' 齐币）';
  spin.addEventListener('click', e => { e.preventDefault(); casinoSpin(); });
  wrap.appendChild(spin);

  casinoBodyEl.appendChild(wrap);
  slotRefs = { reels, result };
}

function casinoSpin(){
  if (!casinoState.card) { if (typeof toast === 'function') toast('保镖：没有俱乐部卡不能玩'); return; }
  if (casinoState.spinning) return;
  const bet = casinoState.bet | 0;
  if (casinoState.coins < bet) {
    if (typeof toast === 'function') toast('齐币不够（还差 ' + (bet - casinoState.coins) + '）');
    return;
  }
  casinoState.coins -= bet;
  casinoState.wager += bet;
  casinoState.played++;
  casinoState.spinning = true;
  casinoUpdateCoins();
  if (slotRefs) slotRefs.result.textContent = '转盘转动中…';

  const results = [casinoPickSymbol(), casinoPickSymbol(), casinoPickSymbol()];
  let frames = 0;
  if (slotTimer) { clearInterval(slotTimer); slotTimer = null; }
  slotTimer = setInterval(() => {
    frames++;
    if (slotRefs) {
      for (const r of slotRefs.reels) r.textContent = casinoPickSymbol().icon;
    }
    if (frames >= 11) {
      clearInterval(slotTimer);
      slotTimer = null;
      casinoSettleSlot(results, bet);
    }
  }, 75);
}

function casinoSettleSlot(results, bet){
  casinoState.spinning = false;
  if (slotRefs) {
    for (let i = 0; i < 3; i++) slotRefs.reels[i].textContent = results[i].icon;
  }
  const a = results[0], b = results[1], c = results[2];
  let pay = 0, msg = '没有中奖…';
  if (a.icon === b.icon && b.icon === c.icon) {
    pay = bet * a.pay;
    msg = '🎉 三个 ' + a.icon + '！赢得 ' + pay + ' 齐币';
  } else {
    const cherries = results.filter(s => s.icon === '🍒').length;
    if (cherries === 2) {
      pay = bet * CONFIG.CASINO.SLOT.TWO_CHERRY;
      msg = '🍒 两个樱桃，退回 ' + pay + ' 齐币';
    }
  }
  if (pay > 0) {
    casinoState.coins += pay;
    casinoState.won += pay;
    casinoUpdateCoins();
    if (typeof playSfx === 'function') playSfx(pay > bet ? 1180 : 880, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  } else if (typeof playSfx === 'function') {
    playSfx(180, 'sawtooth', 0.10, 0.35);
  }
  if (slotRefs) slotRefs.result.textContent = msg + '　·　余额 ' + casinoState.coins;
}

/* ---------- 轮盘 ---------- */
function casinoRenderRoulette(){
  const wrap = document.createElement('div');
  wrap.className = 'cgame';

  const wheel = document.createElement('div');
  wheel.className = 'cwheel';
  wheel.innerHTML = '<span>🎡</span>';
  wrap.appendChild(wheel);

  const result = document.createElement('div');
  result.className = 'cresult';
  result.textContent = '红 / 黑猜中 ×2，绿（0）猜中 ×14';
  wrap.appendChild(result);

  const betRow = document.createElement('div');
  betRow.className = 'cbetrow';
  const betLabel = document.createElement('span');
  betLabel.className = 'clabel';
  betLabel.textContent = '下注';
  betRow.appendChild(betLabel);
  for (const step of CONFIG.CASINO.BET_STEPS) {
    const b = document.createElement('button');
    b.className = 'mbtn' + (casinoState.bet === step ? ' on' : '');
    b.textContent = step;
    b.addEventListener('click', e => {
      e.preventDefault();
      casinoState.bet = step;
      casinoRender();
    });
    betRow.appendChild(b);
  }
  wrap.appendChild(betRow);

  const colors = document.createElement('div');
  colors.className = 'ccolors';
  for (const [key, label, cls] of [['red', '红', 'red'], ['black', '黑', 'black'], ['green', '绿 0', 'green']]) {
    const b = document.createElement('button');
    b.className = 'mbtn ' + cls;
    b.textContent = label + '（' + casinoState.bet + '）';
    b.addEventListener('click', e => { e.preventDefault(); casinoRoulette(key, result, wheel); });
    colors.appendChild(b);
  }
  wrap.appendChild(colors);

  casinoBodyEl.appendChild(wrap);
}

const ROULETTE_RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function casinoRoulette(color, resultEl, wheelEl){
  if (!casinoState.card) { if (typeof toast === 'function') toast('保镖：没有俱乐部卡不能玩'); return; }
  const bet = casinoState.bet | 0;
  if (casinoState.coins < bet) {
    if (typeof toast === 'function') toast('齐币不够（还差 ' + (bet - casinoState.coins) + '）');
    return;
  }
  casinoState.coins -= bet;
  casinoState.wager += bet;
  casinoState.played++;
  casinoUpdateCoins();

  const n = Math.floor(Math.random() * 37);             /* 0 ~ 36 */
  const isRed = ROULETTE_RED.indexOf(n) >= 0;
  const isBlack = n !== 0 && !isRed;
  let pay = 0;
  if (n === 0 && color === 'green') pay = bet * CONFIG.CASINO.ROULETTE.GREEN_PAY;
  else if (n !== 0 && isRed && color === 'red') pay = bet * CONFIG.CASINO.ROULETTE.RED_PAY;
  else if (n !== 0 && isBlack && color === 'black') pay = bet * CONFIG.CASINO.ROULETTE.BLACK_PAY;

  if (pay > 0) {
    casinoState.coins += pay;
    casinoState.won += pay;
    casinoUpdateCoins();
    if (typeof playSfx === 'function') playSfx(1046, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  } else if (typeof playSfx === 'function') playSfx(180, 'sawtooth', 0.10, 0.35);

  const colorName = n === 0 ? '绿 0' : (isRed ? '红' : '黑');
  if (wheelEl) wheelEl.classList.toggle('win', pay > 0);
  if (resultEl) {
    resultEl.textContent = '开出 ' + n + ' · ' + colorName +
      (pay > 0 ? ' · 赢得 ' + pay + ' 齐币' : ' · 没有猜中') +
      '　余额 ' + casinoState.coins;
  }
}

/* ---------- 齐先生任务 ---------- */
function casinoNeedText(need){
  const parts = [];
  for (const it of need) {
    const d = (typeof itemDef === 'function') ? itemDef(it.id) : null;
    const have = (typeof countItem === 'function') ? countItem(it.id) : 0;
    parts.push((d ? d.name : it.id) + ' ' + Math.min(have, it.n) + '/' + it.n);
  }
  return parts.join(' · ');
}

function casinoNeedOk(need){
  if (typeof countItem !== 'function') return false;
  for (const it of need) if (countItem(it.id) < it.n) return false;
  return true;
}

function casinoQuestDone(q){
  return (q.repeat) ? false : !!casinoState.done[q.id];
}

function casinoQuestAvailable(q){
  if (!q) return false;
  if (casinoState.done[q.id] && !q.repeat) return false;
  if (q.wager) return casinoState.wager >= q.wager;
  return casinoNeedOk(q.need || []);
}

function casinoQuestClaim(q){
  if (!casinoQuestAvailable(q)) return false;
  if (!q.wager) {
    for (const it of (q.need || [])) {
      if (!removeItem(it.id, it.n)) {
        if (typeof toast === 'function') toast('材料不足');
        return false;
      }
    }
  }
  casinoState.coins += (q.coins | 0);
  if (q.card) casinoState.card = true;
  if (q.reward) {
    if (!addItem(q.reward.id, q.reward.n)) {
      if (typeof toast === 'function') toast('背包满了，奖励先欠着');
    }
  }
  if (q.repeat) casinoState.repeat++;
  else casinoState.done[q.id] = true;
  const extra = (q.card ? ' + 俱乐部卡' : '') + (q.reward ? ' + ' + itemDef(q.reward.id).name + '×' + q.reward.n : '');
  if (typeof toast === 'function') toast('齐先生：不错。' + q.name + ' 完成，获得 ' + q.coins + ' 齐币' + extra);
  if (typeof playSfx === 'function') playSfx(1320, 'triangle', 0.18, CONFIG.AUDIO.VOLUME);
  casinoRender();
  return true;
}

function casinoRenderQi(){
  const head = document.createElement('div');
  head.className = 'cqhead';
  head.textContent = casinoState.card
    ? '齐先生：你已经拿到俱乐部卡。任务完成得越多，赌场里的门就开得越大。'
    : '齐先生：想进赌场？先替我办件事。完成第一课，这张俱乐部卡就是你的。';
  casinoBodyEl.appendChild(head);

  const list = document.createElement('div');
  list.className = 'cqlist';
  for (const q of CONFIG.CASINO.QUEST) {
    const done = casinoQuestDone(q);
    const ok = casinoQuestAvailable(q);
    const row = document.createElement('div');
    row.className = 'cqrow' + (done ? ' done' : '');

    const top = document.createElement('div');
    top.className = 'cqtop';
    const nm = document.createElement('b');
    nm.textContent = q.name + (q.repeat ? '（可重复）' : '');
    top.appendChild(nm);
    const rw = document.createElement('span');
    rw.textContent = '+' + q.coins + ' 齐币' + (q.card ? ' · 俱乐部卡' : '') +
      (q.reward ? ' · ' + itemDef(q.reward.id).name + '×' + q.reward.n : '');
    top.appendChild(rw);
    row.appendChild(top);

    const desc = document.createElement('div');
    desc.className = 'cqdesc';
    desc.textContent = q.desc;
    row.appendChild(desc);

    const prog = document.createElement('div');
    prog.className = 'cqprog';
    if (q.wager) prog.textContent = '累计下注 ' + Math.min(casinoState.wager, q.wager) + '/' + q.wager + ' 齐币';
    else prog.textContent = casinoNeedText(q.need || []);
    row.appendChild(prog);

    const btn = document.createElement('button');
    btn.className = 'mbtn' + (ok ? ' entry' : ' off');
    btn.textContent = done ? '已完成' : (ok ? '交付 / 领取' : (q.wager ? '继续下注' : '材料不足'));
    btn.disabled = !ok || done;
    btn.addEventListener('click', e => { e.preventDefault(); casinoQuestClaim(q); });
    row.appendChild(btn);

    list.appendChild(row);
  }
  casinoBodyEl.appendChild(list);

  if (casinoState.card) {
    const stat = document.createElement('div');
    stat.className = 'cqstat';
    stat.textContent = '已下注 ' + casinoState.wager + ' 齐币 · 已玩 ' + casinoState.played +
      ' 局 · 累计赢 ' + casinoState.won + ' 齐币' + (casinoState.repeat ? ' · 无尽试炼 ×' + casinoState.repeat : '');
    casinoBodyEl.appendChild(stat);
  }
}

/* ---------- 齐币兑换 ---------- */
function casinoRenderShop(){
  const hint = document.createElement('div');
  hint.className = 'cqhead';
  hint.textContent = '用齐币兑换稀有物资。齐币不能换回金币。';
  casinoBodyEl.appendChild(hint);

  const list = document.createElement('div');
  list.className = 'cqlist';
  for (const it of CONFIG.CASINO.SHOP) {
    const d = itemDef(it.id);
    if (!d) continue;
    const ok = casinoState.coins >= it.coins;
    const row = document.createElement('div');
    row.className = 'csrow';

    const icon = document.createElement('span');
    icon.className = 'csicon';
    if (!(typeof paintItemIcon === 'function' && paintItemIcon(icon, it.id, 24))) icon.textContent = d.icon || '🎁';
    row.appendChild(icon);

    const main = document.createElement('div');
    main.className = 'cqmain';
    const nm = document.createElement('b');
    nm.textContent = d.name + ' ×' + it.n;
    main.appendChild(nm);
    const sub = document.createElement('span');
    sub.textContent = '齐币 ' + it.coins;
    main.appendChild(sub);
    row.appendChild(main);

    const btn = document.createElement('button');
    btn.className = 'mbtn' + (ok ? ' entry' : ' off');
    btn.textContent = ok ? '兑换' : '齐币不够';
    btn.disabled = !ok;
    btn.addEventListener('click', e => { e.preventDefault(); casinoBuy(it); });
    row.appendChild(btn);

    list.appendChild(row);
  }
  casinoBodyEl.appendChild(list);
}

function casinoBuy(it){
  if (casinoState.coins < it.coins) {
    if (typeof toast === 'function') toast('齐币不够');
    return false;
  }
  if (typeof canFit === 'function' && !canFit(it.id, it.n)) {
    if (typeof toast === 'function') toast('背包放不下');
    return false;
  }
  if (typeof addItem === 'function' && !addItem(it.id, it.n)) {
    if (typeof toast === 'function') toast('背包放不下');
    return false;
  }
  casinoState.coins -= it.coins;
  casinoUpdateCoins();
  if (typeof playSfx === 'function') playSfx(980, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  if (typeof toast === 'function') toast('兑换：' + itemDef(it.id).name + ' ×' + it.n + '（-' + it.coins + ' 齐币）');
  casinoRender();
  return true;
}

/* ---------- 打开 / 关闭 ---------- */
function openCasinoPanel(tab){
  if (!casinoEnsure()) return false;
  if (typeof togglePack === 'function') togglePack(false);
  if (typeof shopOpen !== 'undefined' && shopOpen && typeof toggleShop === 'function') toggleShop(false);
  if (typeof npcOpen !== 'undefined' && npcOpen && typeof npcCloseDialog === 'function') npcCloseDialog();
  window.casinoOpen = true;
  casinoState.spinning = false;
  if (slotTimer) { clearInterval(slotTimer); slotTimer = null; }
  if (tab) casinoState.tab = tab;
  else if (!casinoState.card) casinoState.tab = 'qi';
  casinoRender();
  if (casinoEl.classList) casinoEl.classList.add('open');
  if (typeof playSfx === 'function') playSfx(620, 'triangle', 0.10, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

function casinoClosePanel(){
  if (!casinoEnsure()) return false;
  window.casinoOpen = false;
  casinoState.spinning = false;
  if (slotTimer) { clearInterval(slotTimer); slotTimer = null; }
  if (casinoEl.classList) casinoEl.classList.remove('open');
  slotRefs = null;
  return true;
}

/* 家具交互入口：老虎机 / 轮盘 / 兑换柜 */
function casinoFixtureInteract(kind){
  if (!casinoState.card) {
    if (typeof toast === 'function') toast('保镖拦住了你：先找齐先生完成「第一课 · 耐心」');
    return false;
  }
  if (kind === 'slots') return openCasinoPanel('slots');
  if (kind === 'roulette') return openCasinoPanel('roulette');
  return openCasinoPanel('shop');
}

function casinoQiTalk(){
  return openCasinoPanel('qi');
}

/* ---------- 存档 ---------- */
function casinoSerialize(){
  const done = [];
  for (const k in casinoState.done) if (casinoState.done[k]) done.push(k);
  return { k: casinoState.card ? 1 : 0, c: casinoState.coins, d: done,
           r: casinoState.repeat, w: casinoState.wager, p: casinoState.played, g: casinoState.won };
}
function casinoDeserialize(v){
  const d = v || {};
  casinoState.card = !!d.k;
  casinoState.coins = Math.max(0, d.c | 0);
  casinoState.done = {};
  for (const id of (d.d || [])) casinoState.done[id] = true;
  casinoState.repeat = Math.max(0, d.r | 0);
  casinoState.wager = Math.max(0, d.w | 0);
  casinoState.played = Math.max(0, d.p | 0);
  casinoState.won = Math.max(0, d.g | 0);
  casinoState.bet = 10;
  casinoState.tab = 'slots';
  casinoState.spinning = false;
}
function casinoReset(){
  casinoState.card = false;
  casinoState.coins = 0;
  casinoState.done = {};
  casinoState.repeat = 0;
  casinoState.wager = 0;
  casinoState.played = 0;
  casinoState.won = 0;
  casinoState.bet = 10;
  casinoState.tab = 'slots';
  casinoState.spinning = false;
}

Object.assign(window, {
  casinoState, casinoOpen: false,
  casinoHasCard, casinoUpdateCoins, casinoRender, casinoSetTab,
  casinoSpin, casinoRoulette, casinoQuestClaim, casinoBuy,
  casinoFixtureInteract, casinoQiTalk,
  openCasinoPanel, casinoClosePanel,
  casinoSerialize, casinoDeserialize, casinoReset
});
export {
  casinoState, casinoHasCard, casinoRender, casinoSetTab,
  casinoSpin, casinoRoulette, casinoQuestClaim, casinoBuy,
  casinoFixtureInteract, casinoQiTalk,
  openCasinoPanel, casinoClosePanel,
  casinoSerialize, casinoDeserialize, casinoReset
};
