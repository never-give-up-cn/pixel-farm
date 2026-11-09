/* js/systems/festival.js —— 由 index.html 拆分，原行 10291–10722 */
'use strict';

/* === 18.节日 / 日历（第 17 轮） ===
 * 四个节日按「春夏秋冬」每季第 5 天举办；效果全部由 festivalToday() 派生，
 * 跨天自动复原。广场装饰写进 map（随 mapDiff 存档），次日用 baseMap 还原。 */
window.festivalState = {points:0, day:0, claimed:0, banner:0};
window.calOpen = false;
window.hudDateRect = {x:8, y:0, w:0, h:24};

const calEl       = document.getElementById('cal');
const calMaskEl   = document.getElementById('calMask');
const calListEl   = document.getElementById('calList');
const calSubEl    = document.getElementById('calSub');
const festBannerEl = document.getElementById('festBanner');
window.festBannerTimer = null;

/* --- 日期辅助 --- */
function festSeasonIdx(day){
  return Math.floor(((day | 0) - 1) / CONFIG.DAYS_PER_SEASON) % CONFIG.SEASONS.length;
}
function festDayInSeason(day){
  return (((day | 0) - 1) % CONFIG.DAYS_PER_SEASON) + 1;
}
function festivalToday(day){
  const abs = (day === undefined) ? clock.day : (day | 0);
  if(festDayInSeason(abs) !== CONFIG.FESTIVAL.DAY) return null;
  return CONFIG.FESTIVAL.LIST[festSeasonIdx(abs)] || null;
}
function festivalIs(id){ const f = festivalToday(); return !!f && f.id === id; }
function festivalNight(){
  const h = skyHour();
  return h >= 18 || h < 5;
}

/* --- 广场装饰：只占「没被玩家改动过」的原始地面，恢复时直接回 baseMap --- */
function festivalDecorList(f){
  const P = CONFIG.FESTIVAL.PLAZA, out = [];
  for(let i=0;i<4;i++) out.push({x:P.x + i*2, y:P.y, t:T.FEST_BANNER});
  if(f.id === 'autumn'){
    for(let i=0;i<3;i++) out.push({x:P.x + 1 + i*2, y:P.y + 1, t:T.FEST_STALL});
  }else if(f.id === 'winter'){
    for(let i=0;i<3;i++) out.push({x:P.x + 1 + i*2, y:P.y + 1, t:T.FEST_LANTERN});
  }else if(f.id === 'summer'){
    out.push({x:P.x + 1, y:P.y + 2, t:T.FEST_LANTERN});
    out.push({x:P.x + 5, y:P.y + 2, t:T.FEST_LANTERN});
  }
  return out;
}
function festivalDecorFits(i){
  const t = map[i];
  if(t === T.FEST_BANNER || t === T.FEST_STALL || t === T.FEST_LANTERN) return true;
  if(crops[i]) return false;
  if(roads && roads[i]) return false;
  if(typeof buildIndex !== 'undefined' && buildIndex[i] >= 0) return false;
  if(t !== T.GRASS && t !== T.BARE && t !== T.FLOWER) return false;
  return map[i] === baseMap[i];          /* 玩家锄过 / 铺过路的地不抢 */
}
function festivalPlaceDecor(f){
  const list = festivalDecorList(f);
  let placed = 0;
  for(const d of list){
    if(d.x < 0 || d.y < 0 || d.x >= MAP_W || d.y >= MAP_H) continue;
    const i = d.y*MAP_W + d.x;
    if(!festivalDecorFits(i)) continue;
    if(map[i] !== d.t) setTile(i, d.t);
    placed++;
  }
  return placed;
}
function festivalClearDecor(){
  let cleared = 0;
  for(let i=0;i<map.length;i++){
    const t = map[i];
    if(t === T.FEST_BANNER || t === T.FEST_STALL || t === T.FEST_LANTERN){
      setTile(i, baseMap[i]);            /* 还原成原始地面（不残留） */
      cleared++;
    }
  }
  return cleared;
}
function festivalDecorCount(){
  let n = 0;
  for(let i=0;i<map.length;i++){
    const t = map[i];
    if(t === T.FEST_BANNER || t === T.FEST_STALL || t === T.FEST_LANTERN) n++;
  }
  return n;
}

/* --- 节日环境音（低音量和弦，四个节日各不同） --- */
window.festAmbience = null;
function festivalStartAmbience(f){
  if(!CONFIG.FESTIVAL.AMBIENT || festAmbience || audioMuted) return false;
  const ac = audioCtx();
  if(!ac) return false;
  try{
    const gain = ac.createGain();
    gain.gain.value = CONFIG.AUDIO.VOLUME * CONFIG.FESTIVAL.AMBIENT_VOL * (volLevel / 100);
    gain.connect(ac.destination);
    const oscs = [];
    for(const fr of (f.amb || [392, 523])){
      const o = ac.createOscillator(), g2 = ac.createGain();
      o.type = 'sine'; o.frequency.value = fr; g2.gain.value = 0.5;
      o.connect(g2); g2.connect(gain); o.start();
      oscs.push(o);
    }
    festAmbience = {oscs:oscs, gain:gain};
    return true;
  }catch(err){ festAmbience = null; return false; }
}
function festivalStopAmbience(){
  if(!festAmbience) return false;
  try{ for(const o of festAmbience.oscs) o.stop(); }catch(err){}
  try{ festAmbience.gain.disconnect(); }catch(err){}
  festAmbience = null;
  return true;
}

/* --- 横幅（进入节日当天弹一次） --- */
function showFestivalBanner(f){
  if(!festBannerEl || !f) return false;
  const icon = document.getElementById('festBannerIcon');
  const name = document.getElementById('festBannerName');
  const desc = document.getElementById('festBannerDesc');
  if(icon) icon.textContent = f.icon;
  if(name) name.textContent = f.name;
  if(desc) desc.textContent = f.effect;
  festBannerEl.classList.add('show');
  if(festBannerTimer) clearTimeout(festBannerTimer);
  festBannerTimer = setTimeout(()=>{
    if(festBannerEl) festBannerEl.classList.remove('show');
    festBannerTimer = null;
  }, CONFIG.FESTIVAL.BANNER_MS);
  playNotes([523, 659, 784], 'triangle', 0.16, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}
function hideFestivalBanner(){
  if(festBannerEl) festBannerEl.classList.remove('show');
  if(festBannerTimer){ clearTimeout(festBannerTimer); festBannerTimer = null; }
}

/* --- 每日开始 / 结束 --- */
function festivalDayStart(){
  const f = festivalToday();
  festivalClearDecor();                  /* 先清掉昨天的（防止读档残留） */
  if(!f){ festivalStopAmbience(); return null; }
  festivalPlaceDecor(f);
  festivalStartAmbience(f);
  if(festivalIs('summer') && festivalState.day !== clock.day){
    festivalState.day = clock.day;
    festivalState.points = 0;            /* 新一届渔获赛，积分清零 */
  }
  if(festivalState.banner !== clock.day){
    festivalState.banner = clock.day;
    showFestivalBanner(f);
  }
  return f;
}
function festivalRivalScores(day){
  const rng = mulberry32(((CONFIG.SEED >>> 0) ^ Math.imul(day | 0, 2246822519)) >>> 0);
  const out = [];
  for(let i=0;i<CONFIG.FESTIVAL.RIVALS;i++) out.push(60 + ((rng() * 220) | 0));
  return out;
}
function festivalDayEnd(endedDay){
  const f = festivalToday(endedDay);
  if(f && f.id === 'summer' && festivalState.day === endedDay){
    const rivals = festivalRivalScores(endedDay);
    const best = Math.max.apply(null, rivals.concat([-1]));
    const mine = festivalState.points | 0;
    const first = mine > best;
    if(first && festivalState.claimed !== endedDay){
      const prize = CONFIG.FESTIVAL.SUMMER_PRIZE;
      if(canFit(prize.id, prize.n)){
        addItem(prize.id, prize.n);
        const pd = itemDef(prize.id);
        toast('🎣 渔获赛第一名！' + mine + ' 分（对手最高 ' + best + '）→ ' +
              (pd ? pd.name : prize.id) + ' ×' + prize.n);
      }else{
        toast('🎣 渔获赛第一名！但背包满了，奖励没装下');
      }
      festivalState.claimed = endedDay;   /* 已领奖状态入档 */
      playSfx(1319, 'triangle', 0.2, CONFIG.AUDIO.VOLUME);
    }else if(!first){
      const rank = 1 + rivals.filter(s => s >= mine).length;
      toast('渔获赛结束：你 ' + mine + ' 分，排第 ' + rank + ' 名');
    }
  }
  festivalClearDecor();
  festivalStopAmbience();
}

/* --- 效果钩子（旧系统各只调一行） --- */
function festivalOnSow(c){
  if(c && festivalIs('spring')) c.fastDay = clock.day;
}
function festivalGrowInc(c){
  return (c && c.fastDay === clock.day - 1) ? 2 : 1;
}
function festivalSellMult(id){
  if(!festivalIs('autumn')) return 1;
  const d = itemDef(id);
  return (d && d.kind === 'crop') ? CONFIG.FESTIVAL.SELL_MULT : 1;
}
function festivalGiftAff(eff){
  return festivalIs('winter') ? Math.round(eff * CONFIG.FESTIVAL.GIFT_MULT) : eff;
}
function festivalAddFish(f){
  if(!festivalIs('summer') || !f) return 0;
  if(festivalState.day !== clock.day){ festivalState.day = clock.day; festivalState.points = 0; }
  const v = basePrice(f.id) | 0;
  festivalState.points = (festivalState.points | 0) + v;
  return v;
}
function festivalNpcSpot(d){
  if(!festivalIs('autumn')) return null;
  const idx = Math.max(0, CONFIG.NPC.LIST.indexOf(d));
  const P = CONFIG.FESTIVAL.PLAZA;
  return {x:P.x + 1 + (idx % 3) * 2, y:P.y, from:0, to:24};   /* 站在摊位后面当摊主 */
}
function festivalDialogLines(d, lines){
  if(!festivalIs('winter')) return lines;
  const tpl = CONFIG.FESTIVAL.WINTER_TALK || '';
  const line = tpl.replace('{name}', d ? d.name : '居民');
  if(line && lines.indexOf(line) < 0) lines.unshift(line);
  return lines;
}

/* --- 存档 --- */
function festivalSerialize(){
  return {p: festivalState.points | 0, d: festivalState.day | 0,
          c: festivalState.claimed | 0, b: festivalState.banner | 0};
}
function festivalDeserialize(o){
  festivalState = {points:0, day:0, claimed:0, banner:0};
  if(o && typeof o === 'object'){
    festivalState.points  = Math.max(0, o.p | 0);
    festivalState.day     = Math.max(0, o.d | 0);
    festivalState.claimed = Math.max(0, o.c | 0);
    festivalState.banner  = Math.max(0, o.b | 0);
  }
  /* 读档时若正在节日当天：装饰 / 环境音 / 余下效果直接续上 */
  festivalDayStart();
  return true;
}
function festivalResetState(){
  festivalState = {points:0, day:0, claimed:0, banner:0};
  hideFestivalBanner();
  festivalStopAmbience();
}

/* --- 日历面板 --- */
function calDayInfo(absDay){
  const si = festSeasonIdx(absDay);
  const season = CONFIG.SEASONS[si];
  const din = festDayInSeason(absDay);
  const f = (din === CONFIG.FESTIVAL.DAY) ? CONFIG.FESTIVAL.LIST[si] : null;
  const yearLen = CONFIG.SEASONS.length * CONFIG.DAYS_PER_SEASON;
  const dayInYear = ((absDay - 1) % yearLen) + 1;
  const bdays = CONFIG.NPC.LIST.filter(n => npcBdayAbs(n) === dayInYear);
  return {season:season, din:din, fest:f, bdays:bdays, dayInYear:dayInYear};
}
function renderCalendar(){
  if(!calListEl) return;
  if(calSubEl){
    calSubEl.textContent = seasonName() + ' · 第 ' + clock.day + ' 天 · ' +
                           ((clock.day - 1) % CONFIG.DAYS_PER_SEASON + 1) + '/' + CONFIG.DAYS_PER_SEASON;
  }
  calListEl.innerHTML = '';
  for(let off=0; off<7; off++){
    const abs = clock.day + off;
    const info = calDayInfo(abs);
    const row = document.createElement('div');
    row.className = 'crow' + (off === 0 ? ' today' : '') + (info.fest ? ' fest' : '');
    const day = document.createElement('div'); day.className = 'cday';
    day.textContent = '第 ' + abs + ' 天';
    const meta = document.createElement('div'); meta.className = 'cmeta';
    /* 第 28 轮：今天显示实时天气，未来 6 天显示预报队列（日历上写什么，翻天就发生什么） */
    const fw = fcOf(off);
    meta.textContent = info.season + ' · 第 ' + info.din + ' 天' +
      (fw ? (' · ' + fw.icon + ' ' + fw.name) : '') +
      (info.fest ? (' · ' + info.fest.name) : '');
    const badges = document.createElement('div'); badges.className = 'cbadges';
    if(info.fest){
      const b = document.createElement('span'); b.className = 'cbadge fest';
      b.textContent = info.fest.icon + ' ' + info.fest.name;
      badges.appendChild(b);
    }
    for(const n of info.bdays){
      const b = document.createElement('span'); b.className = 'cbadge bday';
      b.textContent = '🎂 ' + n.name;
      badges.appendChild(b);
    }
    /* 第 25 轮：谁在营业（拿 npcCurrentState 跑一遍这一天） */
    const biz = document.createElement('div'); biz.className = 'cbiz';
    const names = npcBusinessList(abs);
    biz.textContent = names.length ? ('营业中：' + names.join('、')) : '这天没人营业';
    if(!names.length) biz.classList.add('none');
    row.appendChild(day); row.appendChild(meta); row.appendChild(biz); row.appendChild(badges);
    calListEl.appendChild(row);
  }
}
function calOpenPanel(){
  if(calOpen) return false;
  calOpen = true;
  renderCalendar();
  setPanelOpen(calEl, true);
  playSfx(700, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  return true;
}
function calClosePanel(){
  if(!calOpen) return false;
  calOpen = false;
  setPanelOpen(calEl, false);
  return true;
}
function toggleCalendar(v){
  if(v === undefined) v = !calOpen;
  return v ? calOpenPanel() : calClosePanel();
}
if(calMaskEl) calMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); calClosePanel(); });
function hitHudDate(p){
  if(!hudDateRect || hudDateRect.w <= 0) return false;
  return p.x >= hudDateRect.x - 2 && p.x <= hudDateRect.x + hudDateRect.w + 2 &&
         p.y >= hudDateRect.y - 2 && p.y <= hudDateRect.y + hudDateRect.h + 2;
}

/* --- 第 28 轮：居民好感总览面板（系统菜单打开；打开时世界冻结） --- */
window.frendOpen = false;
const frendEl = document.getElementById('frend');
const frendMaskEl = document.getElementById('frendMask');
const frendListEl = document.getElementById('frendList');
const frendSubEl = document.getElementById('frendSub');
function renderFrend(){
  if(!frendListEl) return;
  frendListEl.innerHTML = '';
  const bd = npcBirthdayToday();
  let bestN = 0;
  for(const d of CONFIG.NPC.LIST){
    const aff = npcAff(d.id);
    const tier = npcTierOf(aff);
    const unlocked = !!(npcState.unlock && npcState.unlock[d.id]);
    const gifted = npcGiftedToday(d.id);
    const isBd = !!(bd && bd.id === d.id);
    const row = document.createElement('div');
    row.className = 'frow';
    const ic = document.createElement('span'); ic.className = 'ficon'; ic.textContent = d.icon;
    const main = document.createElement('div'); main.className = 'fmain';
    const l1 = document.createElement('div'); l1.className = 'fl1';
    l1.textContent = d.name + ' · ' + tier.name + ' · 好感 ' + aff + '/' + CONFIG.NPC.AFF_MAX +
      (unlocked ? ' · 特权已解锁' : '');
    const bar = document.createElement('div'); bar.className = 'fbar';
    const fill = document.createElement('i');
    fill.style.width = (aff / CONFIG.NPC.AFF_MAX * 100).toFixed(0) + '%';
    bar.appendChild(fill);
    const l2 = document.createElement('div'); l2.className = 'fl2';
    const bday = npcBdayAbs(d);
    l2.textContent = (isBd ? '🎂 今天生日！' : ('生日：第 ' + bday + ' 天')) +
      ' · ' + npcStatusLine(d) +
      ' · ' + (gifted ? '今日已送礼' : '今日可送礼');
    main.appendChild(l1); main.appendChild(bar); main.appendChild(l2);
    row.appendChild(ic); row.appendChild(main);
    frendListEl.appendChild(row);
    if(aff > bestN) bestN = aff;
  }
  if(frendSubEl) frendSubEl.textContent = '最高好感 ' + bestN + '/' + CONFIG.NPC.AFF_MAX;
}
function frendOpenPanel(){
  if(frendOpen) return false;
  frendOpen = true;
  if(sysOpen) toggleSys(false);              /* 从系统菜单进来：先收起菜单 */
  if(packOpen) togglePack(false);
  renderFrend();
  setPanelOpen(frendEl, true);
  playSfx(700, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  return true;
}
function frendClosePanel(){
  if(!frendOpen) return false;
  frendOpen = false;
  setPanelOpen(frendEl, false);
  return true;
}
function toggleFrend(v){
  if(v === undefined) v = !frendOpen;
  return v ? frendOpenPanel() : frendClosePanel();
}
if(frendMaskEl) frendMaskEl.addEventListener('mousedown', e=>{ e.preventDefault(); frendClosePanel(); });
const btnFrend = document.getElementById('btnFrend');
if(btnFrend) btnFrend.addEventListener('click', ()=>{ frendOpenPanel(); });

/* --- 世界绘制：节日装饰（按脚点 Y 混进 drawEntities） --- */
function drawFestBanner(g, x, y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.fencePostDark; g.fillRect(x + 4, y + 6, 2, 25); g.fillRect(x + 26, y + 6, 2, 25);
  const cols = ['#e0556b', '#ffd76a', '#5ab0e0', '#7fd05a'];
  for(let i=0;i<4;i++){
    g.fillStyle = cols[i % cols.length];
    g.beginPath();
    g.moveTo(x + 6 + i*6, y + 7);
    g.lineTo(x + 12 + i*6, y + 7);
    g.lineTo(x + 9 + i*6, y + 16);
    g.fill();
  }
  g.fillStyle = C.shopSign; g.fillRect(x + 9, y + 2, 14, 4);
}
function drawFestStall(g, x, y){
  const C = CONFIG.TILE_COLORS;
  g.fillStyle = C.shopCounterDark; g.fillRect(x + 3, y + 14, 26, 15);
  g.fillStyle = C.shopCounter;     g.fillRect(x + 4, y + 15, 24, 12);
  const cols = ['#d8503f', '#f0cf7a'];
  for(let i=0;i<4;i++){
    g.fillStyle = cols[i % 2];
    g.fillRect(x + 3 + i*7, y + 8, 7, 7);
  }
  g.fillStyle = C.shopSign; g.fillRect(x + 7, y + 2, 18, 5);
  g.fillStyle = '#efe6cf'; g.fillRect(x + 8, y + 17, 6, 4); g.fillRect(x + 18, y + 18, 5, 3);
}
function drawFestLantern(g, x, y){
  const night = festivalNight();
  const C = CONFIG.TILE_COLORS;
  if(night){
    g.fillStyle = 'rgba(255,196,92,0.18)';
    g.beginPath(); g.arc(x + 16, y + 12, 17, 0, Math.PI*2); g.fill();
  }
  g.fillStyle = C.fencePostDark; g.fillRect(x + 15, y + 14, 2, 17);
  g.fillStyle = night ? '#ffcf6a' : '#d8a84e'; g.fillRect(x + 10, y + 4, 12, 11);
  g.fillStyle = night ? '#fff2c8' : '#efd9a2'; g.fillRect(x + 12, y + 6, 8, 7);
  g.fillStyle = '#7a4a22'; g.fillRect(x + 10, y + 3, 12, 2); g.fillRect(x + 10, y + 15, 12, 2);
  if(night){
    g.fillStyle = 'rgba(255,230,170,0.85)';
    g.fillRect(x + 15, y + 9, 2, 4);
  }
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { calEl, calMaskEl, calListEl, calSubEl, festBannerEl, frendEl, frendMaskEl, frendListEl, frendSubEl, btnFrend, festSeasonIdx, festDayInSeason, festivalToday, festivalIs, festivalNight, festivalDecorList, festivalDecorFits, festivalPlaceDecor, festivalClearDecor, festivalDecorCount, festivalStartAmbience, festivalStopAmbience, showFestivalBanner, hideFestivalBanner, festivalDayStart, festivalRivalScores, festivalDayEnd, festivalOnSow, festivalGrowInc, festivalSellMult, festivalGiftAff, festivalAddFish, festivalNpcSpot, festivalDialogLines, festivalSerialize, festivalDeserialize, festivalResetState, calDayInfo, renderCalendar, calOpenPanel, calClosePanel, toggleCalendar, hitHudDate, renderFrend, frendOpenPanel, frendClosePanel, toggleFrend, drawFestBanner, drawFestStall, drawFestLantern });
export { calEl, calMaskEl, calListEl, calSubEl, festBannerEl, frendEl, frendMaskEl, frendListEl, frendSubEl, btnFrend, festSeasonIdx, festDayInSeason, festivalToday, festivalIs, festivalNight, festivalDecorList, festivalDecorFits, festivalPlaceDecor, festivalClearDecor, festivalDecorCount, festivalStartAmbience, festivalStopAmbience, showFestivalBanner, hideFestivalBanner, festivalDayStart, festivalRivalScores, festivalDayEnd, festivalOnSow, festivalGrowInc, festivalSellMult, festivalGiftAff, festivalAddFish, festivalNpcSpot, festivalDialogLines, festivalSerialize, festivalDeserialize, festivalResetState, calDayInfo, renderCalendar, calOpenPanel, calClosePanel, toggleCalendar, hitHudDate, renderFrend, frendOpenPanel, frendClosePanel, toggleFrend, drawFestBanner, drawFestStall, drawFestLantern };
