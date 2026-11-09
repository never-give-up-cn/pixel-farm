/* js/systems/animals.js —— 由 index.html 拆分，原行 9471–9930 */
'use strict';

/* === 13.动物系统（第 15 轮）：鸡 / 牛 + 棚舍 + 每日好感与产出 ===
 * 每只动物：{type, home:[tx,ty], aff, fed, petDay, produced, age, mature,
 *            x, y, vx, vy, t, walkFor, wait}
 *   home   所属棚舍的格子（鸡舍 / 牛棚，都是第 10 轮建造系统的实体）
 *   fed    今天有没有喂过（每天早上结算完置回 false）
 *   petDay 最后一次摸头是第几天（跨天自然失效，同第 13 轮送礼的写法）
 *   age    已经活了几天；mature 成年后才会产出
 *   x,y    脚点世界坐标（走动 AI 用；不参与玩家碰撞） */
window.animals = [];
window.animalOpen = false;
window.animalTarget = null;

/* --- DOM（复用 .panel 的视觉和 panelIn/panelOut 动画） --- */
const animalEl        = document.getElementById('animal');
const animalMask      = document.getElementById('animalMask');
const animalIcon      = document.getElementById('animalIcon');
const animalName      = document.getElementById('animalName');
const animalShelterEl = document.getElementById('animalShelter');
const animalAffEl     = document.getElementById('animalAff');
const animalBarFill   = document.getElementById('animalBarFill');
const animalInfo      = document.getElementById('animalInfo');
const animalPetBtn    = document.getElementById('animalPetBtn');
const animalFeedBtn   = document.getElementById('animalFeedBtn');
const animalReleaseBtn= document.getElementById('animalReleaseBtn');
const animalByeBtn    = document.getElementById('animalBye');

/* --- 查询 --- */
function animalType(id){
  for(const t of CONFIG.ANIMALS.TYPES) if(t.id === id) return t;
  return null;
}
function animalShelterDef(typeId){
  const t = animalType(typeId);
  return t ? (CONFIG.ANIMALS.SHELTERS[t.shelter] || null) : null;
}
/* 场上造了几个这种棚舍 */
function shelterList(shelterId){
  const sh = CONFIG.ANIMALS.SHELTERS[shelterId];
  if(!sh) return [];
  return buildings.filter(b => b.type === sh.recipe);
}
/* 某种动物现在有几只 / 最多能养几只（按棚舍数量 × 每棚容量） */
function animalCount(typeId){
  let n = 0;
  for(const a of animals) if(a.type === typeId) n++;
  return n;
}
function animalCapacity(typeId){
  const sh = animalShelterDef(typeId);
  if(!sh) return 0;
  return shelterList(sh.id).length * sh.cap;
}
function animalsInShelter(tx, ty){
  let n = 0;
  for(const a of animals) if(a.home[0] === tx && a.home[1] === ty) n++;
  return n;
}
/* 找一个还有空位的棚舍（没有 → null） */
function freeShelter(typeId){
  const sh = animalShelterDef(typeId);
  if(!sh) return null;
  for(const b of shelterList(sh.id)){
    if(animalsInShelter(b.tx, b.ty) < sh.cap) return b;
  }
  return null;
}
/* 高品质概率：好感 50 → HQ_CHANCE_MIN，好感 100 → HQ_CHANCE_MAX（线性） */
function animalHqChance(aff){
  const A = CONFIG.ANIMALS;
  if(aff <= A.PRODUCE_MIN_AFF) return A.HQ_CHANCE_MIN;
  const k = (aff - A.PRODUCE_MIN_AFF) / Math.max(1, A.AFF_MAX - A.PRODUCE_MIN_AFF);
  return A.HQ_CHANCE_MIN + (A.HQ_CHANCE_MAX - A.HQ_CHANCE_MIN) * clamp(k, 0, 1);
}
/* 新动物站哪儿：棚舍四周第一个能站的格子（由近到远找 3 圈；棚舍本身是实心的） */
function animalSpotNear(tx, ty){
  for(let r=1; r<=3; r++){
    for(let dy=-r; dy<=r; dy++){
      for(let dx=-r; dx<=r; dx++){
        if(Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = tx + dx, ny = ty + dy;
        if(nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
        if(isSolid(nx, ny)) continue;
        return {x:(nx + 0.5)*TILE, y:(ny + 0.5)*TILE + 8};
      }
    }
  }
  return {x:(tx + 0.5)*TILE, y:(ty + 0.5)*TILE + 8};
}
function makeAnimal(typeId, home){
  const t = animalType(typeId);
  const spot = animalSpotNear(home[0], home[1]);
  return {type:typeId, home:[home[0], home[1]], aff:0, fed:false, petDay:0,
          produced:false, age:0, mature:false,
          x:spot.x, y:spot.y, vx:0, vy:0, t:0, walkFor:0,
          wait:Math.random() * 2};
}

/* --- 购买（商店按钮） --- */
function buyAnimal(typeId){
  const t = animalType(typeId);
  if(!t) return false;
  const sh = CONFIG.ANIMALS.SHELTERS[t.shelter];
  const cap = animalCapacity(typeId), have = animalCount(typeId);
  if(cap <= 0){
    toast('先造一座' + sh.name + '（按 B 进入建造模式）');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  if(have >= cap){
    toast(sh.name + '住满了（' + have + '/' + cap + '），再造一座才能多养');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  const home = freeShelter(typeId);
  if(!home) return false;
  const price = priceOf(typeId);
  if(gold < price){
    toast('金币不够（还差 ' + (price - gold) + '）');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  changeGold(-price);
  animals.push(makeAnimal(typeId, [home.tx, home.ty]));
  ratingInvalidate();                          /* 第 21 轮：动物数变化 → 评级缓存失效 */
  toast('买下了一只' + t.name + '（住进' + sh.name + '，' + t.matureDays + ' 天长成）');
  playSfx(1174, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
  renderShop();
  return true;
}

/* --- 每天 6:00 结算：成长 / 好感 / 产出 --- */
function animalDayStart(){
  const A = CONFIG.ANIMALS;
  let produced = 0, hq = 0, hungry = 0, grew = 0, full = 0, boxed = 0;
  for(const a of animals){
    const t = animalType(a.type);
    if(!t) continue;
    /* 成长：先长一天，再看是否成年 */
    a.age = Math.min(999, (a.age | 0) + 1);
    if(!a.mature && a.age >= t.matureDays){ a.mature = true; grew++; }
    /* 好感结算：喂过 +5，没喂 -5（并且当天不产出） */
    if(a.fed) a.aff = Math.min(A.AFF_MAX, (a.aff | 0) + A.FEED_AFF);
    else { a.aff = Math.max(0, (a.aff | 0) + A.HUNGRY_AFF); hungry++; }
    /* 产出：成年 + 昨天喂过 + 好感 ≥ PRODUCE_MIN_AFF */
    let got = false;
    if(a.mature && a.fed && a.aff >= A.PRODUCE_MIN_AFF){
      const high = Math.random() < animalHqChance(a.aff);
      const id = high ? t.hqProduce : t.produce;
      /* 第 20 轮：棚舍旁有自动采集箱 → 产出直接进箱子（箱子满了再退回背包） */
      const box = autoboxForAnimal(a);
      if(box && autoboxStore(box, id, 1)){
        got = true; produced++; if(high) hq++; boxed++;
      }else if(canFit(id, 1)){
        addItem(id, 1);
        got = true; produced++; if(high) hq++;
      }else full++;
    }
    a.produced = got;
    a.fed = false;                 /* 新的一天：重新喂 */
  }
  if(grew)     toast(grew + ' 只动物长大了');
  if(produced) toast('动物产出：' + produced + ' 份' + (hq ? '（优质 ' + hq + ' 份）' : '') +
                     (boxed ? '，其中 ' + boxed + ' 份进了采集箱' : ''));
  if(hungry)   toast(hungry + ' 只动物昨天没吃东西，好感下降了');
  if(full)     toast('背包满了，有 ' + full + ' 份产出没拿到');
  return {produced:produced, hq:hq, hungry:hungry, grew:grew, full:full, boxed:boxed};
}

/* --- 第 23 轮：动物繁殖（两只同物种好感 ≥ 80 且棚舍有空位 → 每天早晨 5% 概率生一只幼崽） --- */
function animalBreedStart(){
  const B = CONFIG.BREED;
  let born = 0;
  for(const t of CONFIG.ANIMALS.TYPES){
    if(born >= B.MAX_PER_DAY) break;
    if(animalCount(t.id) >= animalCapacity(t.id)) continue;   /* 棚舍满了就生不了 */
    const parents = animals.filter(a => a.type === t.id && (!B.NEED_MATURE || a.mature) &&
                                       (a.aff | 0) >= B.AFF_MIN);
    if(parents.length < 2) continue;                            /* 至少要一公一母… 这里按「两只」算 */
    if(Math.random() >= B.CHANCE) continue;
    const home = freeShelter(t.id);
    if(!home) continue;
    const baby = makeAnimal(t.id, [home.tx, home.ty]);
    baby.aff = 0; baby.age = 0; baby.mature = false;           /* 幼崽：好感从 0 开始 */
    animals.push(baby);
    born++;
    toast('🐣 ' + t.name + '生了一只幼崽！');
    playSfx(1046, 'triangle', 0.14, CONFIG.AUDIO.VOLUME);
  }
  return born;
}

/* --- 走动 AI：随机方向走，撞到栅栏 / 建筑 / 超出棚舍范围就停下换方向 --- */
function animalPickDir(a){
  const W = CONFIG.ANIMALS.WANDER;
  const d = [[1,0],[-1,0],[0,1],[0,-1]][(Math.random() * 4) | 0];
  a.vx = d[0] * W.SPEED * TILE;
  a.vy = d[1] * W.SPEED * TILE;
  a.t = 0;
  a.walkFor = W.PAUSE_MIN + Math.random() * (W.PAUSE_MAX - W.PAUSE_MIN);
}
/* --- 第 21 轮：动物 AI 降频 ---
 * 决策（发呆计时 / 选方向 / 判障碍 / 到点换向）每 TICK=250ms 跑一次；
 * 位移仍每帧插值，避免 4Hz 跳格。20 只动物的决策开销降到原来的 1/15。 */
function animalThink(a, elapsed){
  const W = CONFIG.ANIMALS.WANDER;
  if(a.wait > 0){
    a.wait -= elapsed;
    if(a.wait > 0) return;
    a.wait = 0;
  }
  if(!a.vx && !a.vy) animalPickDir(a);
  const homeX = (a.home[0] + 0.5) * TILE, homeY = (a.home[1] + 0.5) * TILE;
  let vx = a.vx, vy = a.vy;
  /* 离棚舍太远 → 往回调头（围栏没围死也不会跑丢） */
  if(Math.hypot(a.x - homeX, a.y - homeY) > W.RANGE * TILE){
    const dx = homeX - a.x, dy = homeY - a.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    vx = dx / len * W.SPEED * TILE;
    vy = dy / len * W.SPEED * TILE;
  }
  /* 预判下一个节拍会不会撞墙：撞了就停下发呆，下次换方向 */
  const nx = a.x + vx * W.TICK, ny = a.y + vy * W.TICK;
  if(isSolid(Math.floor(nx / TILE), Math.floor(ny / TILE))){
    a.vx = a.vy = 0;
    a.wait = W.PAUSE_MIN + Math.random() * (W.PAUSE_MAX - W.PAUSE_MIN);
    return;
  }
  a.vx = vx; a.vy = vy;
  a.t += elapsed;
  if(a.t >= a.walkFor){
    a.vx = a.vy = 0;
    a.wait = W.PAUSE_MIN + Math.random() * (W.PAUSE_MAX - W.PAUSE_MIN);
    a.t = 0;
  }
}
/* 每帧位移（不跑 AI；撞墙兜底 + 折返） */
function animalMove(a, dt){
  if(a.wait > 0 || (!a.vx && !a.vy)) return;
  const W = CONFIG.ANIMALS.WANDER;
  const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
  if(isSolid(Math.floor(nx / TILE), Math.floor(ny / TILE))){
    a.vx = a.vy = 0;
    a.wait = W.PAUSE_MIN + Math.random() * (W.PAUSE_MAX - W.PAUSE_MIN);
    return;
  }
  a.x = nx; a.y = ny;
}
window.animalAiAcc = 0;
function updateAnimals(dt){
  const W = CONFIG.ANIMALS.WANDER;
  animalAiAcc += dt;
  let elapsed = 0;
  if(animalAiAcc >= W.TICK){ elapsed = animalAiAcc; animalAiAcc = 0; }
  for(const a of animals){
    if(elapsed) animalThink(a, elapsed);
    animalMove(a, dt);
  }
}
/* 兼容旧调用：单只动物「决策 + 位移」一步到位 */
function animalStep(a, dt){ animalThink(a, dt); animalMove(a, dt); }
/* 玩家脚边最近的动物 */
function animalDist(a){ return Math.hypot(a.x - player.x, a.y - player.y) / TILE; }
function animalNear(){
  let best = null, bd = CONFIG.ANIMALS.RANGE;
  for(const a of animals){
    const d = animalDist(a);
    if(d <= bd){ bd = d; best = a; }
  }
  return best;
}

/* --- 互动面板 --- */
function animalRenderPanel(){
  if(!animalTarget) return;
  const a = animalTarget, t = animalType(a.type);
  if(!t) return;
  const A = CONFIG.ANIMALS, sh = A.SHELTERS[t.shelter];
  const petted = (a.petDay | 0) === clock.day;
  const feedN = countItem(A.FEED_ITEM);
  if(animalIcon)        animalIcon.textContent = t.icon;
  if(animalName)        animalName.textContent = t.name + (a.mature ? '' : '（幼崽）');
  if(animalShelterEl)   animalShelterEl.textContent = sh ? sh.name : '棚舍';
  if(animalAffEl)       animalAffEl.textContent = '好感 ' + (a.aff | 0);
  if(animalBarFill)     animalBarFill.style.width = Math.round(clamp(a.aff, 0, A.AFF_MAX) / A.AFF_MAX * 100) + '%';
  if(animalInfo){
    animalInfo.textContent = [
      a.mature ? '已成年，每天都能产出' : ('成长中：第 ' + a.age + ' / ' + t.matureDays + ' 天'),
      '今天：' + (a.fed ? '已喂食 ✅' : '还没喂食') + ' · ' + (petted ? '已摸头' : '还没摸头'),
      '今天产出：' + (a.produced ? ('已产出一份' + itemDef(t.produce).name) : '还没有产出') +
        '（好感 ≥ ' + A.PRODUCE_MIN_AFF + ' 且昨天喂过食才会产）',
      '饲料：背包里有 ' + feedN + ' 个' + (feedN < A.FEED_PER ? '（商店可买，镰刀割草地也能得到）' : '')
    ].join('\n');
  }
  if(animalPetBtn){
    const off = petted || a.aff >= A.AFF_MAX;
    animalPetBtn.textContent = petted ? '今天已摸过' : ('摸头（+' + A.PET_AFF + '）');
    animalPetBtn.classList.toggle('off', off);
    animalPetBtn.disabled = off;
  }
  if(animalFeedBtn){
    animalFeedBtn.textContent = a.fed ? '今天已喂过' : ('喂食（饲料×' + A.FEED_PER + '）');
    animalFeedBtn.classList.toggle('off', a.fed);
    animalFeedBtn.disabled = a.fed;
  }
}
function animalOpenPanel(a){
  if(!a) return false;
  animalTarget = a;
  animalOpen = true;
  animalRenderPanel();
  setPanelOpen(animalEl, true);
  playSfx(620, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  return true;
}
function animalClosePanel(silent){
  if(!animalOpen && !silent) return false;
  const wasOpen = animalOpen || !!(animalEl && animalEl.classList && animalEl.classList.contains('open'));
  animalOpen = false;
  animalTarget = null;
  /* 没开过就别播关闭动画（否则会在读档瞬间闪一下遮罩） */
  if(wasOpen && animalEl) setPanelOpen(animalEl, false);
  return true;
}
/* 摸头：+2，每天一次 */
function animalPet(){
  const a = animalTarget;
  if(!a) return false;
  const A = CONFIG.ANIMALS;
  if((a.petDay | 0) === clock.day){
    toast('今天已经摸过这只' + animalType(a.type).name + '了，明天再来吧');
    return false;
  }
  a.petDay = clock.day;
  a.aff = Math.min(A.AFF_MAX, (a.aff | 0) + A.PET_AFF);
  toast(animalType(a.type).name + '看起来很开心（好感 +' + A.PET_AFF + '）');
  playSfx(988, 'triangle', 0.08, CONFIG.AUDIO.VOLUME * 0.8);
  animalRenderPanel();
  return true;
}
/* 喂食：消耗饲料，明天早上结算时才有产出 */
function animalFeed(){
  const a = animalTarget;
  if(!a) return false;
  const A = CONFIG.ANIMALS;
  if(a.fed){ toast('今天已经喂过了'); return false; }
  if(countItem(A.FEED_ITEM) < A.FEED_PER){
    toast('没有饲料了（商店能买，镰刀割草地也能得到）');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  removeItem(A.FEED_ITEM, A.FEED_PER);
  a.fed = true;
  toast('喂饱了' + animalType(a.type).name + '（明天早上好感 +' + A.FEED_AFF + '）');
  playSfx(660, 'square', 0.08, CONFIG.AUDIO.VOLUME);
  refreshPackGrid();
  animalRenderPanel();
  return true;
}
/* 放生：腾出棚舍空位（拆棚舍前必须先放生） */
function animalRelease(){
  const a = animalTarget;
  if(!a) return false;
  const i = animals.indexOf(a);
  if(i < 0) return false;
  animals.splice(i, 1);
  ratingInvalidate();                          /* 第 21 轮：动物数变化 → 评级缓存失效 */
  const name = animalType(a.type).name;
  animalClosePanel();
  toast('放生了' + name + '（棚舍空出了一个位置）');
  playSfx(300, 'sine', 0.10, CONFIG.AUDIO.VOLUME * 0.7);
  return true;
}
if(animalPetBtn)     animalPetBtn.addEventListener('click',     ()=>{ animalPet(); ensureAudio(); });
if(animalFeedBtn)    animalFeedBtn.addEventListener('click',    ()=>{ animalFeed(); ensureAudio(); });
if(animalReleaseBtn) animalReleaseBtn.addEventListener('click', ()=>{ animalRelease(); ensureAudio(); });
if(animalByeBtn)     animalByeBtn.addEventListener('click',     ()=>{ animalClosePanel(); ensureAudio(); });
if(animalMask)       animalMask.addEventListener('mousedown', e=>{ e.preventDefault(); animalClosePanel(); });

/* --- 绘制（进 Y 排序表；动物不挡玩家） --- */
function drawAnimal(g, a, near){
  const t = animalType(a.type);
  if(!t) return;
  const px = a.x - cam.x, py = a.y - cam.y;
  if(px < -TILE || px > VIEW_W + TILE || py < -TILE || py > VIEW_H + TILE) return;
  const oldFont = g.font, oldAlign = g.textAlign, oldBase = g.textBaseline;
  /* 影子 */
  g.fillStyle = 'rgba(0,0,0,.22)';
  g.fillRect(px - 7, py - 2, 14, 3);
  /* 立绘（动物用 emoji，和 NPC 同一套约定） */
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = (a.type === 'cow' ? '20px ' : '16px ') + FONT_EMOJI;
  g.fillText(t.icon, px, py - 2);
  /* 靠近 → 头顶冒 E（near 由 drawEntities 每帧算一次传进来） */
  if(near === undefined ? (animalNear() === a) : (near === a)){
    g.fillStyle = 'rgba(8,10,16,.85)';
    g.fillRect(px - 6, py - 32, 12, 13);
    g.strokeStyle = CONFIG.COLORS.hudAccent;
    g.strokeRect(px - 5.5, py - 31.5, 11, 12);
    g.fillStyle = CONFIG.COLORS.hudAccent;
    g.font = '11px ' + FONT_CJK;
    g.fillText('E', px, py - 22);
  }
  g.font = oldFont; g.textAlign = oldAlign; g.textBaseline = oldBase;
}

/* --- 存档：紧凑结构（每只约 80 字节） --- */
function animalSerialize(){
  return animals.map(a => ({
    t: a.type,
    h: a.home,
    aff: a.aff | 0,
    f: a.fed ? 1 : 0,
    p: a.produced ? 1 : 0,
    age: a.age | 0,
    m: a.mature ? 1 : 0,
    x: Math.round(a.x),
    y: Math.round(a.y)
  }));
}
function animalDeserialize(arr){
  animals = [];
  animalClosePanel(true);
  if(!Array.isArray(arr)) return false;
  const A = CONFIG.ANIMALS;
  for(const o of arr){
    if(!o || typeof o !== 'object') continue;
    const t = animalType(o.t);
    if(!t) continue;                                  /* 不认识的动物类型 → 丢弃 */
    const home = Array.isArray(o.h) ? [o.h[0] | 0, o.h[1] | 0] : [0, 0];
    const homeB = buildingAt(home[0], home[1]);
    /* 所属棚舍必须还在（防止拆掉棚舍后留下悬空动物） */
    if(!homeB || homeB.type !== A.SHELTERS[t.shelter].recipe) continue;
    const a = {
      type:o.t, home:home,
      aff: clamp(o.aff | 0, 0, A.AFF_MAX),
      fed: !!o.f, produced: !!o.p,
      petDay: 0,
      age: Math.max(0, o.age | 0),
      mature: !!o.m,
      x: (typeof o.x === 'number') ? o.x : (home[0] + 0.5) * TILE,
      y: (typeof o.y === 'number') ? o.y : (home[1] + 0.5) * TILE + 8,
      vx:0, vy:0, t:0, walkFor:0, wait: Math.random() * 2
    };
    if(!a.mature && a.age >= t.matureDays) a.mature = true;
    /* 地图变了 / 有东西挡着 → 挪回棚舍旁边 */
    if(isSolid(Math.floor(a.x / TILE), Math.floor(a.y / TILE))){
      const s = animalSpotNear(home[0], home[1]);
      a.x = s.x; a.y = s.y;
    }
    animals.push(a);
  }
  ratingInvalidate();                          /* 第 21 轮：重灌动物列表 → 评级缓存失效 */
  return true;
}
function animalResetState(){
  animals = [];
  animalClosePanel(true);
  ratingInvalidate();                          /* 第 21 轮：清空动物 → 评级缓存失效 */
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { animalEl, animalMask, animalIcon, animalName, animalShelterEl, animalAffEl, animalBarFill, animalInfo, animalPetBtn, animalFeedBtn, animalReleaseBtn, animalByeBtn, animalType, animalShelterDef, shelterList, animalCount, animalCapacity, animalsInShelter, freeShelter, animalHqChance, animalSpotNear, makeAnimal, buyAnimal, animalDayStart, animalBreedStart, animalPickDir, animalThink, animalMove, updateAnimals, animalStep, animalDist, animalNear, animalRenderPanel, animalOpenPanel, animalClosePanel, animalPet, animalFeed, animalRelease, drawAnimal, animalSerialize, animalDeserialize, animalResetState });
export { animalEl, animalMask, animalIcon, animalName, animalShelterEl, animalAffEl, animalBarFill, animalInfo, animalPetBtn, animalFeedBtn, animalReleaseBtn, animalByeBtn, animalType, animalShelterDef, shelterList, animalCount, animalCapacity, animalsInShelter, freeShelter, animalHqChance, animalSpotNear, makeAnimal, buyAnimal, animalDayStart, animalBreedStart, animalPickDir, animalThink, animalMove, updateAnimals, animalStep, animalDist, animalNear, animalRenderPanel, animalOpenPanel, animalClosePanel, animalPet, animalFeed, animalRelease, drawAnimal, animalSerialize, animalDeserialize, animalResetState };
