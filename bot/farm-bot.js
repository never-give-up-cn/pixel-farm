/* bot/farm-bot.js — 可视化自动农场机器人（规则策略 + 每日参数进化）
 *
 * 只在 index.html?bot=1 时加载；不参与正常游戏。
 * 机器人按正常游戏速度行动：走到地块旁边 → 播工具动画 → 命中帧结算 → 下一件事。
 * 每天结束时把「资产变化」作为奖励，对 5 个策略参数做爬山式进化，结果存在
 * localStorage（farm_bot_v1），不写游戏存档。
 */
(function () {
  'use strict';
  if (window.__farmBotLoaded) return;
  window.__farmBotLoaded = true;

  const VERSION = '1.1';
  const LS_KEY = 'farm_bot_v1';
  const PLOT_COLS = 8, PLOT_ROWS = 6;

  const BOUNDS = {
    targetTiles:     [12, 48, 6],
    cropMode:        [0, 2, 1],
    canUpgrade:      [0, 1, 1],
    staminaReserve:  [0, 80, 10],
    seedSpend:       [0.30, 0.90, 0.10]
  };
  const DEFAULT_POLICY = {
    targetTiles: 24, cropMode: 0, canUpgrade: 1,
    staminaReserve: 30, seedSpend: 0.6
  };
  const CROP_MODE_NAMES = ['利润/天', '最快成熟', '单株最贵'];

  const S = {
    ready: false, running: false, paused: false, errors: 0,
    best: Object.assign({}, DEFAULT_POLICY),
    candidate: Object.assign({}, DEFAULT_POLICY),
    bestReward: 0,
    history: [],
    dayStartEquity: 0,
    logLines: [],
    task: '等待游戏加载',
    log: '启动',
    botSlot: -1,
    target: null,
    lastTick: 0,
    sleepDay: 0,
    shopTrips: 0
  };

  /* ---------------- 工具函数 ---------------- */
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (n) => Math.floor(Math.random() * n);
  const pickRnd = (arr) => arr[rnd(arr.length)];
  const tileOf = () => ({ x: Math.floor(player.x / TILE), y: Math.floor(player.y / TILE) });
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clockText = () => {
    const m = 6 * 60 + (clock.min | 0);
    return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  };
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  /* clock.min 是从 6:00 起经过的分钟：6:00=0，10:00=240，16:20=620 */
  const minAt = (h, m) => (h * 60 + m) - 6 * 60;

  function log(msg) {
    const line = '[' + clockText() + '] ' + msg;
    S.log = msg;
    S.logLines.push(line);
    if (S.logLines.length > 7) S.logLines.shift();
    renderPanel();
  }
  function setTask(msg) { S.task = msg; renderPanel(); }

  function keyOff() {
    if (typeof keys === 'undefined') return;
    for (const k of ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']) keys[k] = false;
  }
  async function waitIfPaused() {
    while (S.running && S.paused) {
      keyOff();
      await sleep(120);
    }
  }
  async function waitIdle(limitMs = 4000) {
    const t0 = now();
    while (typeof playerAnimBusy === 'function' && playerAnimBusy() && now() - t0 < limitMs) {
      await waitIfPaused();
      await sleep(40);
    }
  }

  /* ---------------- 学习：策略存取 / 变异 ---------------- */
  function sanitizePolicy(p) {
    const q = Object.assign({}, DEFAULT_POLICY);
    if (!p || typeof p !== 'object') return q;
    for (const k in BOUNDS) {
      const [a, b] = BOUNDS[k];
      const v = Number(p[k]);
      if (Number.isFinite(v)) q[k] = clamp(v, a, b);
    }
    return q;
  }
  function loadLearning() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || typeof d !== 'object') return;
      S.best = sanitizePolicy(d.best);
      S.candidate = sanitizePolicy(d.candidate || d.best);
      S.bestReward = Number(d.bestReward) || 0;
      S.history = Array.isArray(d.history) ? d.history.slice(-60) : [];
    } catch (e) {}
  }
  function saveLearning() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        v: 1, best: S.best, candidate: S.candidate, bestReward: S.bestReward,
        history: S.history.slice(-60), at: Date.now()
      }));
    } catch (e) {}
  }
  function clonePolicy(p) { return Object.assign({}, p); }
  function mutate(policy) {
    const q = clonePolicy(policy);
    const keysArr = Object.keys(BOUNDS);
    let k = pickRnd(keysArr);
    for (let i = 0; i < 6; i++) {
      const [a, b, step] = BOUNDS[k];
      let v = q[k] + (Math.random() < 0.5 ? -step : step);
      v = Math.round(v * 100) / 100;
      if (v < a || v > b) v = q[k];
      if (v !== q[k]) { q[k] = clamp(v, a, b); break; }
      k = pickRnd(keysArr);
    }
    return q;
  }

  function equity() {
    let v = gold;
    for (const s of inv) {
      if (!s) continue;
      const d = itemDef(s.id);
      if (!d) continue;
      const bp = (typeof basePrice === 'function') ? basePrice(s.id) : 0;
      v += (bp || 0) * 0.9 * (s.n || 1);
    }
    for (const c of crops) {
      if (!c || c.dead) continue;
      const d = cropDef(c.type);
      if (!d) continue;
      const prog = c.mature ? 1 : clamp(0.3 + 0.7 * ((c.grown || 0) / Math.max(1, d.days || 1)), 0.3, 0.95);
      v += (d.sell || 0) * prog;
    }
    v += (typeof tilledCount === 'number' ? tilledCount : 0) * 1.5;
    return v;
  }

  function learn(reward) {
    const day = clock.day - 1;
    S.history.push({ day, reward: Math.round(reward), p: clonePolicy(S.candidate) });
    if (S.history.length > 60) S.history.shift();
    let improved = false;
    if (reward > S.bestReward + 1) {
      S.best = clonePolicy(S.candidate);
      S.bestReward = Math.round(reward);
      improved = true;
    } else {
      S.candidate = clonePolicy(S.best);
    }
    S.candidate = mutate(S.best);
    saveLearning();
    log(improved
      ? '学习：新策略更优 +' + Math.round(reward) + 'g，已保留'
      : '学习：今日 +' + Math.round(reward) + 'g，回到最佳策略并继续尝试');
    renderPanel();
  }

  /* ---------------- 路径 / 移动 ---------------- */
  function findPath(sx, sy, tx, ty) {
    if (!inBounds(sx, sy) || !inBounds(tx, ty)) return null;
    if (isSolid(tx, ty)) return null;
    const N = MAP_W * MAP_H;
    const prev = new Int32Array(N).fill(-2);
    const q = new Int32Array(N);
    let head = 0, tail = 0;
    const start = sy * MAP_W + sx, goal = ty * MAP_W + tx;
    if (start === goal) return [{ x: sx, y: sy }];
    prev[start] = -1; q[tail++] = start;
    const dxs = [1, -1, 0, 0], dys = [0, 0, 1, -1];
    while (head < tail) {
      const cur = q[head++];
      const cx = cur % MAP_W, cy = (cur / MAP_W) | 0;
      for (let k = 0; k < 4; k++) {
        const nx = cx + dxs[k], ny = cy + dys[k];
        if (!inBounds(nx, ny)) continue;
        const ni = ny * MAP_W + nx;
        if (prev[ni] !== -2) continue;
        if (isSolid(nx, ny)) continue;
        prev[ni] = cur;
        if (ni === goal) {
          const out = [];
          let n = ni;
          while (n !== -1) { out.push({ x: n % MAP_W, y: (n / MAP_W) | 0 }); n = prev[n]; }
          out.reverse();
          return out;
        }
        q[tail++] = ni;
      }
    }
    return null;
  }

  async function moveToPoint(px, py, maxMs = 4200) {
    const t0 = now();
    const startMap = currentMap;
    let lastX = player.x, lastY = player.y, still = 0;
    while (S.running && now() - t0 < maxMs) {
      await waitIfPaused();
      if (currentMap !== startMap) { keyOff(); return true; }
      if (Math.hypot(px - player.x, py - player.y) < 5) break;
      keyOff();
      const dx = px - player.x, dy = py - player.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 3) keys['d'] = true; else if (dx < -3) keys['a'] = true;
      } else {
        if (dy > 3) keys['s'] = true; else if (dy < -3) keys['w'] = true;
      }
      await sleep(38);
      if (Math.hypot(player.x - lastX, player.y - lastY) < 0.4) still++; else still = 0;
      lastX = player.x; lastY = player.y;
      if (still > 30) break;
    }
    keyOff();
    return Math.hypot(px - player.x, py - player.y) < 10;
  }

  async function walkToTile(tx, ty) {
    const startMap = currentMap;
    for (let attempt = 0; attempt < 4 && S.running; attempt++) {
      const t = tileOf();
      if (t.x === tx && t.y === ty) return true;
      const path = findPath(t.x, t.y, tx, ty);
      if (!path) return false;
      let moved = false;
      for (let i = 1; i < path.length; i++) {
        await waitIfPaused();
        if (!S.running) return false;
        const p = path[i];
        const ok = await moveToPoint((p.x + 0.5) * TILE, (p.y + 0.5) * TILE);
        if (!ok) break;
        moved = true;
        if (currentMap !== startMap) return true;   /* 踩到出口换图了 */
      }
      const nt = tileOf();
      if (nt.x === tx && nt.y === ty) return true;
      if (!moved) return false;
    }
    return false;
  }

  /* 第 40 轮：农场 / 小镇拆图后，机器人需要先走到地图出口再换图 */
  async function goToMap(target) {
    let guard = 0;
    while (S.running && currentMap !== target && guard++ < 6) {
      const st = (typeof MAP_WORLD !== 'undefined') ? MAP_WORLD[currentMap] : null;
      const ex = st && st.exits && st.exits.find(e => e.to === target);
      if (!ex) break;
      setTask('前往 ' + ((typeof MAP_DEFS !== 'undefined' && MAP_DEFS[target]) ? MAP_DEFS[target].name : target));
      const startMap = currentMap;
      const exX = ex.x + Math.floor((ex.w || 1) / 2);
      const exY = ex.y;
      await walkToTile(exX, exY);
      const t0 = now();
      while (S.running && currentMap === startMap && now() - t0 < 3000) {
        keyOff();
        await sleep(80);
      }
      await waitIfPaused();
    }
    if (currentMap === target) {
      keyOff();
      await sleep(120);
      return true;
    }
    return false;
  }

  function standCandidates(tx, ty) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const x = tx + dx, y = ty + dy;
        if (!inBounds(x, y) || isSolid(x, y)) continue;
        out.push({ x, y, d: Math.hypot((x + 0.5) * TILE - player.x, (y + 0.5) * TILE - player.y) });
      }
    out.sort((a, b) => a.d - b.d);
    return out;
  }

  async function standNear(tx, ty) {
    if (tileCenterDist(tx, ty) <= 1.55) return true;
    const cands = standCandidates(tx, ty);
    for (const c of cands) {
      if (await walkToTile(c.x, c.y)) {
        if (tileCenterDist(tx, ty) <= 1.75) return true;
      }
      await waitIfPaused();
    }
    return false;
  }

  /* ---------------- 动作 ---------------- */
  function ensureHot(id) {
    let i = inv.findIndex(s => s && s.id === id);
    if (i < 0) return false;
    const HOT = CONFIG.INVENTORY.HOTBAR;
    if (i >= HOT) {
      let h = -1;
      for (let k = 0; k < HOT; k++) if (!inv[k]) { h = k; break; }
      if (h < 0) h = hotSel;
      const tmp = inv[h]; inv[h] = inv[i]; inv[i] = tmp;
      i = h;
      if (typeof refreshPackGrid === 'function') refreshPackGrid();
    }
    if (typeof selectHot === 'function') selectHot(i);
    return true;
  }

  async function perform(action, tx, ty, fn, label) {
    S.target = { x: tx, y: ty, label: label || action };
    await waitIdle();
    if (!S.running) return false;
    await waitIfPaused();
    if (typeof playerFaceTile === 'function') playerFaceTile(tx, ty);
    if (typeof hover !== 'undefined') { hover.tx = tx; hover.ty = ty; }
    let done = false, result;
    const t0 = now();
    const started = (typeof playerPerformAction === 'function') &&
      playerPerformAction(action, () => {
        try { result = fn ? fn() : true; } catch (e) { console.warn('[bot] action failed', e); result = false; }
        done = true;
      }, { hitAt: 0.5 });
    if (!started) {
      await waitIdle();
      S.target = null;
      return false;
    }
    while (!done && now() - t0 < 4500 && S.running) {
      await waitIfPaused();
      await sleep(35);
    }
    await waitIdle(2500);
    S.target = null;
    return !!result;
  }

  /* ---------------- 作物选择 ---------------- */
  function purchasableSeed(id) {
    return (CONFIG.SHOP.BUY || []).some(b => b.id === id);
  }
  function cropCandidates() {
    if (typeof allCropDefs !== 'function') return [];
    const season = seasonName();
    return allCropDefs().filter(c => {
      if (!c || !c.id) return false;
      if (cropSeasons(c).indexOf(season) < 0) return false;
      const sid = 'seed_' + c.id;
      if (!itemDef(sid)) return false;
      return countItem(sid) > 0 || purchasableSeed(sid);
    });
  }
  function cropScore(c, mode) {
    const days = Math.max(1, c.days || 1);
    if (mode === 1) return -days * 100 + (c.sell || 0);
    if (mode === 2) return (c.sell || 0);
    return ((c.sell || 0) - (c.seedCost || 0)) / days;
  }
  function chooseCrop() {
    const list = cropCandidates();
    if (!list.length) return null;
    const mode = S.candidate.cropMode | 0;
    list.sort((a, b) => cropScore(b, mode) - cropScore(a, mode));
    /* 优先把已经有的种子种掉，避免开局赠送的种子烂在背包里 */
    const owned = list.filter(c => countItem('seed_' + c.id) > 0);
    return owned.length ? owned[0] : list[0];
  }
  function targetSeed() {
    const c = chooseCrop();
    return c ? { crop: c, seedId: 'seed_' + c.id } : null;
  }

  function plotOrigin() {
    return { x0: FARM.x + 4, y0: FARM.y + 3 };
  }
  function plotCells(limit) {
    const { x0, y0 } = plotOrigin();
    const out = [];
    for (let r = 0; r < PLOT_ROWS; r++) {
      const y = y0 + r;
      for (let c = 0; c < PLOT_COLS; c++) {
        const x = x0 + (r % 2 ? PLOT_COLS - 1 - c : c);
        if (inBounds(x, y)) out.push({ x, y });
      }
    }
    return out.slice(0, limit);
  }
  function farmCropArray(){
    const st = (typeof MAP_WORLD !== 'undefined') ? MAP_WORLD.farm : null;
    return (st && st.crops) ? st.crops : crops;
  }
  function plantedInPlot() {
    let n = 0;
    const arr = farmCropArray();
    for (const p of plotCells(BOUNDS.targetTiles[1])) {
      if (arr[p.y * MAP_W + p.x]) n++;
    }
    return n;
  }
  function maturePlanInPlot() {
    let n = 0;
    const arr = farmCropArray();
    for (const p of plotCells(BOUNDS.targetTiles[1])) {
      const c = arr[p.y * MAP_W + p.x];
      if (!c || c.dead) continue;
      const d = cropDef(c.type);
      if (c.mature && d && !(d.regrow > 0)) n++;
    }
    return n;
  }

  /* ---------------- 农场工作 ---------------- */
  async function refillWater() {
    let best = null, bd = Infinity;
    for (let i = 0; i < map.length; i++) {
      if (map[i] !== T.WATER) continue;
      const x = i % MAP_W, y = (i / MAP_W) | 0;
      const d = Math.hypot((x + 0.5) * TILE - player.x, (y + 0.5) * TILE - player.y);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    if (!best) return false;
    setTask('去水边补满水壶');
    if (!(await standNear(best.x, best.y))) return false;
    return await perform('water', best.x, best.y, () => refillCan(), '补水');
  }

  async function waterAt(tx, ty) {
    const i = ty * MAP_W + tx;
    if (map[i] === T.WATERED) return true;
    if (canWater <= 0 && !(await refillWater())) return false;
    ensureHot('can');
    setTask('浇水');
    return await perform('water', tx, ty, () => waterTile(tx, ty), '浇水');
  }

  async function farmWork() {
    if (currentMap !== 'farm') { if (!(await goToMap('farm'))) return; }
    let plan = targetSeed();
    if (!plan) { log('没有当季种子，先去商店看看'); return; }
    const target = S.candidate.targetTiles | 0;
    /* 策略可能把目标地块调小；已经种下的作物仍然要浇水 / 收获，不能丢下不管 */
    const cells = plotCells(BOUNDS.targetTiles[1]).filter((p, idx) =>
      idx < target || crops[p.y * MAP_W + p.x]);
    ensureHot('hoe'); ensureHot('can');
    setTask('农场工作');
    for (const p of cells) {
      await waitIfPaused();
      if (!S.running) return;
      if (clock.min >= minAt(16, 20)) { log('天色不早，准备去商店'); break; }
      if (stamina <= S.candidate.staminaReserve + 2) { log('体力见底，收工'); break; }
      const i = p.y * MAP_W + p.x;
      const c = crops[i], t = map[i];
      /* 当前作物的种子用完了 → 换成背包里还有的当季种子；一颗都没有就先跳过空地，
       * 但已经种下的作物仍然继续浇水 / 收获。 */
      if (!c && (!plan || countItem(plan.seedId) <= 0)) {
        const alt = targetSeed();
        if (!alt || countItem(alt.seedId) <= 0) {
          if (plan) log('种子用完了，准备去商店');
          plan = null;
        } else {
          plan.crop = alt.crop; plan.seedId = alt.seedId;
          log('换种 ' + plan.crop.name);
        }
      }
      if (c && c.dead) {
        if (countItem('sickle') > 0) {
          ensureHot('sickle');
          if (await standNear(p.x, p.y)) await perform('sickle', p.x, p.y, () => clearDeadCrop(p.x, p.y), '清理枯株');
        }
        continue;
      }
      if (c && c.mature) {
        setTask('收获 ' + (cropDef(c.type) || {}).name);
        if (await standNear(p.x, p.y)) await perform('harvest', p.x, p.y, () => useTool(p.x, p.y), '收获');
        continue;
      }
      if (c && !c.watered && t === T.TILLED) {
        setTask('浇水 ' + ((cropDef(c.type) || {}).name || ''));
        if (await standNear(p.x, p.y)) await waterAt(p.x, p.y);
        continue;
      }
      if (!c && t === T.TILLED && plan) {
        setTask('播种 ' + plan.crop.name);
        if (await standNear(p.x, p.y)) {
          const ok = await perform('harvest', p.x, p.y,
            () => sowCrop(p.x, p.y, plan.crop.id, plan.seedId), '播种');
          if (ok) await waterAt(p.x, p.y);
        }
        continue;
      }
      if (!c && t === T.GRASS && plan) {
        setTask('开垦');
        ensureHot('hoe');
        if (!(await standNear(p.x, p.y))) continue;
        const ok = await perform('hoe', p.x, p.y, () => useTool(p.x, p.y), '开垦');
        if (!ok) continue;
        setTask('播种 ' + plan.crop.name);
        const sown = await perform('harvest', p.x, p.y,
          () => sowCrop(p.x, p.y, plan.crop.id, plan.seedId), '播种');
        if (sown) await waterAt(p.x, p.y);
      }
    }
  }

  /* ---------------- 商店 ---------------- */
  async function sellAll() {
    let sold = 0;
    const SELL_KINDS = { crop: 1, gather: 1, material: 1, fish: 1, animal: 1, food: 1 };
    const snapshot = inv.map(s => s ? Object.assign({}, s) : null);
    for (const s of snapshot) {
      if (!s || !s.id) continue;
      const d = itemDef(s.id);
      if (!d || !SELL_KINDS[d.kind]) continue;   /* 不卖工具 / 武器 / 戒指 / 家具 */
      if (!isSellable(s.id)) continue;
      if (s.id === 'feed') continue;       // 先留着，万一以后养动物
      if (sellItem(s.id, s.n)) sold++;
      await sleep(25);
    }
    if (sold) log('卖掉了 ' + sold + ' 组东西');
    return sold;
  }

  async function buyForNextDay() {
    const plan = targetSeed();
    if (!plan) return;
    const seedId = plan.seedId;
    const have = countItem(seedId);
    const standing = plantedInPlot();
    const mature = maturePlanInPlot();
    let need = Math.max(0, S.candidate.targetTiles - standing + mature + 2);
    need -= have;
    if (need <= 0) return;
    const item = CONFIG.SHOP.BUY.find(b => b.id === seedId);
    if (!item) return;
    const budget = gold * S.candidate.seedSpend;
    let spent = 0;
    setTask('买种子：' + plan.crop.name);
    while (need > 0 && spent < budget && gold > 25 && S.running) {
      await waitIfPaused();
      const price = priceOf(seedId);
      if (price <= 0 || gold < price + 10) break;
      if (!buyItem(seedId)) break;
      spent += price; need--;
      await sleep(20);
    }
    if (spent > 0) log('买了 ' + plan.crop.name + '种子，花了 ' + Math.round(spent) + 'g');
    if (S.candidate.canUpgrade && canLevel < CONFIG.SHOP.CAN_MAX_LEVEL) {
      const cp = priceOf('can_upgrade');
      if (gold > cp + 180) {
        if (buyItem('can_upgrade')) log('水壶扩容 → ' + canCapacity());
      }
    }
  }

  async function shopTrip() {
    if (!S.running) return false;
    const c = (typeof townCounterSpot === 'function') ? townCounterSpot() : null;
    if (!c) return false;
    if (clock.min < minAt(10, 0)) {
      setTask('等商店 10:00 开门');
      log('时间还早，先休息到商店开门');
      while (S.running && clock.min < minAt(10, 0)) {
        await waitIfPaused();
        await sleep(400);
      }
    }
    if (!S.running) return false;
    setTask('去镇上商店');
    log('出发去商店');
    if (!(await goToMap('valley'))) { log('没能走到镇上'); return false; }
    const ok = await standNear(c.x, c.y);
    if (!ok || !nearShop()) {
      log('没能走到商店柜台');
      return false;
    }
    await sellAll();
    await buyForNextDay();
    S.shopTrips++;
    return true;
  }

  /* ---------------- 回家睡觉 / 日循环 ---------------- */
  async function goHomeAndSleep() {
    setTask('回家睡觉');
    if (currentMap !== 'farm' && !(await goToMap('farm'))) { log('找不到回农场的路'); }
    const doorX = HOUSE_POS.x + 1;
    const doorY = HOUSE_POS.y + HOUSE_POS.h;
    let ok = false;
    /* 站在门口下面一格，避免走进农舍后又被困在室内 */
    for (let i = 0; i < 3 && S.running; i++) {
      if (await walkToTile(doorX, doorY + 1)) { ok = true; break; }
    }
    if (window.farmhouseActive && typeof exitFarmhouse === 'function') exitFarmhouse();
    if (!ok && typeof nearHouse === 'function' && !nearHouse()) {
      log('找不到回家的路，仍在门口强行休息');
    }
    if (!S.running) return;
    const before = clock.day;
    startSleep(false);
    S.task = '睡觉中…';
    renderPanel();
    const t0 = now();
    while (S.running && now() - t0 < 20000) {
      if (sleepFx && sleepFx.phase === 'none' && clock.day !== before) break;
      await sleep(120);
    }
    if (clock.day === before) {
      log('睡觉没有推进到第二天（可能被面板挡住）');
      await sleep(800);
    }
  }

  async function runDay() {
    await waitIdle(3000);
    while (sleepFx && sleepFx.phase !== 'none' && S.running) await sleep(200);
    if (window.farmhouseActive && typeof exitFarmhouse === 'function') exitFarmhouse();
    log('第 ' + clock.day + ' 天开始');
    const start = equity();
    S.dayStartEquity = start;
    S.shopTrips = 0;

    await farmWork();

    /* 如果上午就把手上的种子种完了：先去商店补种，再回农场干下半场 */
    if (S.running && clock.min < minAt(16, 20) && S.shopTrips < 1) {
      await shopTrip();
      if (S.running) await farmWork();
    }

    /* 收工前再去一次商店：卖掉今天的收获 + 买明天的种子 */
    if (S.running && S.shopTrips < 2) {
      await shopTrip();
    }

    if (!S.running) return;
    await goHomeAndSleep();

    const end = equity();
    const reward = end - S.dayStartEquity;
    S.dayStartEquity = equity();
    learn(reward);
    S.errors = 0;
  }

  async function mainLoop() {
    S.running = true;
    S.paused = false;
    while (S.running) {
      await waitIfPaused();
      try {
        await runDay();
      } catch (e) {
        S.errors++;
        console.error('[bot]', e);
        log('出错：' + (e && e.message ? e.message : e));
        keyOff();
        await sleep(1200);
        if (S.errors > 5) {
          log('连续出错，机器人停止');
          S.running = false;
        }
      }
    }
    keyOff();
    renderPanel();
  }

  /* ---------------- 启动 ---------------- */
  function startBot() {
    if (S.ready) return;
    S.ready = true;
    loadLearning();
    S.candidate = mutate(S.best);

    /* 找一个空存档号，绝不覆盖已有存档 */
    let slot = (typeof nextSaveSlot === 'function') ? nextSaveSlot() : -1;
    if (slot < 0) {
      S.task = '没有空存档位';
      S.logLines.push('本地存档位已满。请先在标题界面删除一些存档，再刷新页面。');
      renderPanel();
      return;
    }
    S.botSlot = slot;
    curSlot = slot;
    if (typeof closeStartMenu === 'function') closeStartMenu();
    doNewGame('standard');
    /* 机器人不写游戏存档，避免误碰玩家进度 */
    CONFIG.SAVE.AUTO_NEW_DAY = false;
    CONFIG.SAVE.AUTO_UNLOAD = false;
    sessionActive = true;
    S.dayStartEquity = equity();
    log('机器人启动 · 槽' + (slot + 1) + ' · 标准农场');
    log('学习策略：' + policyText());
    mainLoop();
  }

  function whenReady() {
    if (window.__farmBotReadyTimer) return;
    window.__farmBotReadyTimer = setInterval(() => {
      if (typeof CONFIG === 'undefined' || typeof player === 'undefined' ||
          typeof useTool !== 'function' || typeof playerPerformAction !== 'function' ||
          typeof startSleep !== 'function' || typeof sowCrop !== 'function') return;
      clearInterval(window.__farmBotReadyTimer);
      window.__farmBotReadyTimer = null;
      buildUI();
      setTimeout(() => { try { startBot(); } catch (e) { console.error(e); log('启动失败：' + e.message); } }, 600);
    }, 200);
  }

  /* ---------------- UI ---------------- */
  function policyText() {
    const p = S.candidate;
    return '地块 ' + p.targetTiles + ' · 作物 ' + CROP_MODE_NAMES[p.cropMode | 0] +
      ' · 水壶' + (p.canUpgrade ? '升级' : '不升级') +
      ' · 留力 ' + p.staminaReserve;
  }

  function ensureStyles() {
    if (document.getElementById('botStyle')) return;
    const st = document.createElement('style');
    st.id = 'botStyle';
    st.textContent = `
#botMarker{position:fixed;pointer-events:none;z-index:12}
#botPanel{position:fixed;right:10px;bottom:10px;width:274px;z-index:14;
  background:rgba(8,12,20,.90);border:2px solid #ffd76a;color:#cfe3ff;
  font:12px/1.55 Consolas,"Microsoft YaHei",monospace;padding:8px 10px 9px;
  box-shadow:0 8px 30px rgba(0,0,0,.55);pointer-events:auto}
#botPanel h3{margin:0 0 4px;font-size:13px;color:#ffd76a;letter-spacing:1px}
#botPanel .row{display:flex;justify-content:space-between;gap:6px}
#botPanel .dim{color:#8fa3bd}
#botPanel .good{color:#7ee08a}
#botPanel .warn{color:#ffb08a}
#botPanel .task{color:#9fe3ff;margin:3px 0 4px;min-height:18px}
#botPanel .policy{color:#d8c8ff;font-size:11.5px;margin-bottom:3px}
#botPanel .log{color:#8fa3bd;font-size:11px;white-space:pre-line;min-height:70px;
  border-top:1px solid #2c3a4e;margin-top:5px;padding-top:4px}
#botPanel canvas{display:block;width:100%;height:44px;margin-top:4px;background:#101827;
  border:1px solid #2c3a4e;image-rendering:pixelated}
#botPanel .btns{display:flex;gap:6px;margin-top:6px}
#botPanel button{flex:1;background:#243050;border:1px solid #3d4a63;color:#cfe3ff;
  font:11px/1 Consolas,"Microsoft YaHei",monospace;padding:5px 4px;cursor:pointer}
#botPanel button:hover{border-color:#ffd76a;color:#ffd76a}
`;
    document.head.appendChild(st);
  }

  function buildUI() {
    ensureStyles();
    if (!document.getElementById('botMarker')) {
      const m = document.createElement('canvas');
      m.id = 'botMarker';
      document.body.appendChild(m);
      requestAnimationFrame(drawMarker);
    }
    if (document.getElementById('botPanel')) return;
    const p = document.createElement('div');
    p.id = 'botPanel';
    p.innerHTML = `
      <h3>🤖 自动农场 · 学习模式</h3>
      <div class="row"><span id="botDay">第 1 天 06:00</span><span id="botGold">💰 0</span></div>
      <div class="row"><span id="botStamina">体力 0/0</span><span id="botReward" class="dim">今日 +0</span></div>
      <div class="task" id="botTask">等待中</div>
      <div class="policy" id="botPolicy"></div>
      <div class="row dim"><span id="botBest">最佳 +0g</span><span id="botIter">第 1 次策略</span></div>
      <canvas id="botChart" width="250" height="44"></canvas>
      <div class="log" id="botLog"></div>
      <div class="btns">
        <button id="botPause">暂停</button>
        <button id="botReset">重置学习</button>
        <button id="botStop">停止</button>
      </div>`;
    document.body.appendChild(p);
    document.getElementById('botPause').addEventListener('click', () => {
      S.paused = !S.paused;
      keyOff();
      document.getElementById('botPause').textContent = S.paused ? '继续' : '暂停';
      renderPanel();
    });
    document.getElementById('botReset').addEventListener('click', () => {
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      S.best = Object.assign({}, DEFAULT_POLICY);
      S.candidate = mutate(S.best);
      S.bestReward = 0;
      S.history = [];
      saveLearning();
      log('学习数据已重置');
      renderPanel();
    });
    document.getElementById('botStop').addEventListener('click', () => {
      S.running = false;
      keyOff();
      setTask('已停止');
      log('机器人已停止');
    });
    renderPanel();
    setInterval(() => { if (S.ready) renderPanel(); }, 500);
  }

  function renderPanel() {
    const set = (id, text, cls) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      if (cls !== undefined) el.className = cls;
    };
    if (!document.getElementById('botPanel')) return;
    set('botDay', '第 ' + clock.day + ' 天 ' + clockText());
    set('botGold', '💰 ' + Math.floor(gold));
    set('botStamina', '体力 ' + Math.floor(stamina) + '/' + Math.floor(staminaMax));
    set('botTask', S.paused ? '⏸ 已暂停' : ('▶ ' + S.task));
    set('botPolicy', '策略：' + policyText());
    set('botBest', '最佳 +' + Math.round(S.bestReward) + 'g');
    set('botIter', '第 ' + (S.history.length + 1) + ' 次策略');
    set('botLog', S.logLines.join('\n'));
    const p = document.getElementById('botPause');
    if (p) p.textContent = S.paused ? '继续' : '暂停';
    drawChart();
  }

  function drawChart() {
    const cv = document.getElementById('botChart');
    if (!cv) return;
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    const h = S.history.slice(-30);
    if (h.length < 2) {
      g.fillStyle = '#5d6b80'; g.font = '10px Consolas'; g.fillText('每日收益曲线', 8, 18);
      return;
    }
    let mn = Math.min(...h.map(x => x.reward), 0), mx = Math.max(...h.map(x => x.reward), 1);
    const pad = 4;
    const sx = (W - pad * 2) / (h.length - 1);
    const sy = (H - pad * 2) / Math.max(1, mx - mn);
    g.strokeStyle = '#2c3a4e'; g.beginPath();
    const y0 = pad + (mx - 0) * sy;
    if (y0 > 0 && y0 < H) { g.moveTo(0, y0); g.lineTo(W, y0); }
    g.stroke();
    g.strokeStyle = '#ffd76a'; g.lineWidth = 1.5; g.beginPath();
    h.forEach((it, i) => {
      const x = pad + i * sx;
      const y = pad + (mx - it.reward) * sy;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    });
    g.stroke();
    g.fillStyle = '#7ee08a';
    const last = h[h.length - 1];
    const lx = pad + (h.length - 1) * sx, ly = pad + (mx - last.reward) * sy;
    g.fillRect(lx - 2, ly - 2, 4, 4);
  }

  function drawMarker() {
    requestAnimationFrame(drawMarker);
    const cv = document.getElementById('botMarker');
    const game = document.getElementById('game');
    if (!cv || !game) return;
    const r = game.getBoundingClientRect();
    if (cv.width !== Math.round(r.width) || cv.height !== Math.round(r.height)) {
      cv.width = Math.round(r.width); cv.height = Math.round(r.height);
    }
    cv.style.left = r.left + 'px';
    cv.style.top = r.top + 'px';
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    if (!S.target || !S.running || S.paused) return;
    const scale = r.width / VIEW_W;
    const x = (S.target.x * TILE - cam.x) * scale;
    const y = (S.target.y * TILE - cam.y) * scale;
    const w = TILE * scale, h = TILE * scale;
    if (x < -w || y < -h || x > cv.width || y > cv.height) return;
    const pulse = 0.55 + 0.45 * Math.sin(now() / 220);
    g.strokeStyle = 'rgba(255,215,106,' + pulse.toFixed(2) + ')';
    g.lineWidth = 2;
    g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = 'rgba(255,215,106,0.12)';
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    if (S.target.label) {
      g.font = '11px Consolas';
      g.fillStyle = 'rgba(8,12,20,0.75)';
      const tw = g.measureText(S.target.label).width + 8;
      g.fillRect(x, y - 17, tw, 16);
      g.fillStyle = '#ffd76a';
      g.fillText(S.target.label, x + 4, y - 5);
    }
  }

  window.FarmBot = {
    get state() { return S; },
    get policy() { return clonePolicy(S.candidate); },
    start: startBot,
    stop() { S.running = false; keyOff(); },
    resetLearning() { try { localStorage.removeItem(LS_KEY); } catch (e) {} },
    version: VERSION
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whenReady);
  else whenReady();
})();
