/* js/systems/fishing.js —— 由 index.html 拆分，原行 9147–9362 */
'use strict';

/* === 11.钓鱼（第 14 轮） === */
/* 状态机：idle → wait（抛竿 1~4s）→ bite（0.8s 窗口）→ reel（拉杆）→ idle
 * 世界时间在钓鱼时照常走；打开背包/商店/对话时 update() 提前返回，钓鱼计时同步冻结。 */
const fishing = {
  state: 'idle',   /* idle / wait / bite / reel */
  t: 0,            /* 当前状态已经过的毫秒 */
  need: 0,         /* 本次抛竿要等多久（毫秒） */
  fish: null,      /* 咬钩的鱼定义（CONFIG.FISHING.LIST 元素） */
  zone: 0.5,       /* 绿区中心（0~1） */
  zoneW: 0.3,      /* 绿区宽度（0~1） */
  pointer: 0,      /* 指针位置（0~1） */
  dir: 1           /* 指针方向：1 向右 / -1 向左 */
};
function fishingActive(){ return fishing.state !== 'idle'; }
function fishDef(id){ return CONFIG.FISHING.LIST.find(f => f.id === id) || null; }
/* 站在水边（抛竿距离内有没有水格） */
function waterNearFishing(){
  const px = Math.floor(player.x/TILE), py = Math.floor(player.y/TILE);
  const R = Math.ceil(CONFIG.FISHING.WATER_RANGE);
  for(let ty=py-R; ty<=py+R; ty++) for(let tx=px-R; tx<=px+R; tx++){
    if(tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) continue;
    if(map[ty*MAP_W+tx] !== T.WATER) continue;
    if(tileCenterDist(tx,ty) <= CONFIG.FISHING.WATER_RANGE) return true;
  }
  return false;
}
/* 24 小时制时段判定：from > to 表示跨午夜（18 → 2） */
function fishHourOK(f, h){
  return (f.from <= f.to) ? (h >= f.from && h < f.to) : (h >= f.from || h < f.to);
}
/* 当前季节 / 天气 / 时段下这条鱼咬不咬钩 */
function fishEligible(f){
  return f.seasons.indexOf(seasonName()) >= 0 &&
         f.weather.indexOf(weather.id) >= 0 &&
         fishHourOK(f, skyHour());
}
function fishCandidates(){ return CONFIG.FISHING.LIST.filter(fishEligible); }
/* 按稀有度加权：稀有度越高越难咬钩（TYPE_CHANCE^(rarity-1)） */
function fishPickWeighted(list){
  let total = 0;
  for(const f of list) total += Math.pow(CONFIG.FISHING.TYPE_CHANCE, f.rarity - 1);
  let r = Math.random() * total;
  for(const f of list){
    r -= Math.pow(CONFIG.FISHING.TYPE_CHANCE, f.rarity - 1);
    if(r <= 0) return f;
  }
  return list[list.length - 1];
}
/* 抛竿 */
function startFishing(){
  if(fishingActive()) return false;
  const slot = selectedSlot();
  if(!slot || slot.id !== CONFIG.FISHING.ROD_ID){ toast('先选中鱼竿再抛竿'); return false; }
  if(!waterNearFishing()){
    toast('要站在水边才能抛竿');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  if(!CONFIG.FISHING.LIST.some(f => canFit(f.id, 1))){
    toast('背包满了，装不下鱼');
    playSfx(120, 'sawtooth', 0.10, CONFIG.AUDIO.VOLUME * 0.6);
    return false;
  }
  fishing.state = 'wait'; fishing.t = 0; fishing.fish = null;
  const F = CONFIG.FISHING;
  fishing.need = F.WAIT_MIN_MS + Math.random() * Math.max(0, F.WAIT_MAX_MS - F.WAIT_MIN_MS);
  if(typeof skillFishWaitMult === 'function') fishing.need *= skillFishWaitMult();
  toast('抛竿了，等鱼儿上钩…');
  playSfx(440, 'sine', 0.12, CONFIG.AUDIO.VOLUME);
  sysTipShow('fish');                        /* 第 21 轮：第一次抛竿 → 教学提示 */
  return true;
}
/* 收竿（silent=true 不弹提示，用于睡觉 / 读档等被动打断） */
function cancelFishing(silent){
  if(!fishingActive()) return false;
  fishing.state = 'idle'; fishing.fish = null; fishing.t = 0;
  if(!silent) toast('收竿了');
  return true;
}
/* 跑鱼：扣 1 体力（体力为 0 时不会变负） */
function fishingEscape(reason){
  const cost = Math.max(0, CONFIG.FISHING.FAIL_STAMINA_COST | 0);
  const lost = Math.min(cost, Math.max(0, stamina));
  if(lost > 0) stamina -= lost;
  fishing.state = 'idle'; fishing.fish = null; fishing.t = 0;
  toast(reason + (lost > 0 ? '（体力 -' + lost + '）' : ''));
  playSfx(140, 'sawtooth', 0.12, CONFIG.AUDIO.VOLUME * 0.7);
  return false;
}
/* 咬钩窗口内按下 → 进入拉杆 */
function fishingStartReel(){
  const f = fishing.fish;
  if(!f) return false;
  const R = CONFIG.FISHING.REEL;
  fishing.zoneW = Math.max(R.ZONE_MIN, R.ZONE_BASE - (f.rarity - 1) * R.ZONE_STEP);
  if(typeof skillFishZoneMult === 'function') fishing.zoneW = Math.min(0.92, fishing.zoneW * skillFishZoneMult());
  if(typeof foodBuffFishZoneMult === 'function') fishing.zoneW = Math.min(0.92, fishing.zoneW * foodBuffFishZoneMult());
  if(typeof equipFishZoneMult === 'function') fishing.zoneW = Math.min(0.92, fishing.zoneW * equipFishZoneMult());
  const half = fishing.zoneW / 2;
  fishing.zone = half + Math.random() * Math.max(0, 1 - fishing.zoneW);
  fishing.pointer = Math.random() < 0.5 ? 0 : 1;
  fishing.dir = fishing.pointer <= 0 ? 1 : -1;
  fishing.state = 'reel'; fishing.t = 0;
  toast('拉杆！左键 / 空格 让指针停在绿区');
  playSfx(659, 'square', 0.08, CONFIG.AUDIO.VOLUME);
  return true;
}
/* 拉杆判定：指针落在绿区 → 得鱼 */
function fishingResolveReel(){
  const f = fishing.fish;
  if(!f) { fishing.state = 'idle'; return false; }
  const ok = Math.abs(fishing.pointer - fishing.zone) <= fishing.zoneW / 2;
  if(!ok) return fishingEscape('鱼挣脱了，跑掉了');
  if(!canFit(f.id, 1)){
    fishing.state = 'idle'; fishing.fish = null;
    toast('背包满了，鱼滑回了水里');
    return false;
  }
  addItem(f.id, 1);
  if(typeof skillAdd === 'function') skillAdd('fishing', 8 + (f.rarity - 1) * 2);
  questEmit('fish', {id:f.id, n:1});      /* 第 16 轮：委托总线（钓鱼产出） */
  festivalAddFish(f);                     /* 第 17 轮：夏·渔获赛积分 */
  const idx = CONFIG.FISHING.LIST.indexOf(f);
  dexUnlock('fish', idx);
  statsFish();                            /* 第 18 轮：钓鱼统计 + 鱼种成就 */
  toast('🎣 钓到了 ' + f.name + '！（稀有度 ' + f.rarity + '）');
  playSfx(1046, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  fishing.state = 'idle'; fishing.fish = null; fishing.t = 0;
  return true;
}
/* 钓鱼中按左键 / 空格 */
function fishingPress(){
  if(fishing.state === 'wait'){ return cancelFishing(false); }
  if(fishing.state === 'bite'){ return fishingStartReel(); }
  if(fishing.state === 'reel'){ return fishingResolveReel(); }
  return false;
}
/* 每帧推进（只在没有面板/睡觉/暂停时调用 → 面板打开时自动冻结） */
function updateFishing(dt){
  if(fishing.state === 'wait'){
    fishing.t += dt * 1000;
    if(fishing.t >= fishing.need){
      const list = fishCandidates();
      if(!list.length){
        fishing.state = 'idle'; fishing.t = 0;
        toast('水面很安静，这个时节没有鱼咬钩');
        return;
      }
      fishing.fish = fishPickWeighted(list);
      fishing.state = 'bite'; fishing.t = 0;
      toast('咬钩了！左键收杆');
      playSfx(988, 'square', 0.10, CONFIG.AUDIO.VOLUME);
      setTimeout(()=>playSfx(1319, 'square', 0.10, CONFIG.AUDIO.VOLUME), 90);
    }
  }else if(fishing.state === 'bite'){
    fishing.t += dt * 1000;
    if(fishing.t >= CONFIG.FISHING.BITE_WINDOW_MS) fishingEscape('没来得及收杆，鱼跑掉了');
  }else if(fishing.state === 'reel'){
    const sp = CONFIG.FISHING.REEL.SPEED;
    fishing.pointer += fishing.dir * sp * dt;
    if(fishing.pointer >= 1){ fishing.pointer = 2 - fishing.pointer; fishing.dir = -1; }
    else if(fishing.pointer <= 0){ fishing.pointer = -fishing.pointer; fishing.dir = 1; }
  }
}
/* 钓鱼 UI：等待气泡 / 咬钩提示 / 拉杆横条 */
function drawFishing(g){
  if(!fishingActive()) return;
  const px = Math.round(player.x - cam.x), py = Math.round(player.y - cam.y);
  if(fishing.state === 'wait' || fishing.state === 'bite'){
    const isBite = fishing.state === 'bite';
    const text = isBite ? '❗ 咬钩了！左键收杆' : '🎣 等待咬钩…';
    g.font = '13px ' + FONT_CJK;
    const w = g.measureText(text).width;
    const bx = Math.round(px - w/2 - 8), by = py - 58;
    g.fillStyle = isBite ? 'rgba(60,12,12,.90)' : 'rgba(8,10,16,.82)';
    g.fillRect(bx, by, w + 16, 22);
    g.strokeStyle = isBite ? '#ff9a6a' : CONFIG.COLORS.hudBorder;
    g.strokeRect(bx + 0.5, by + 0.5, w + 15, 21);
    g.fillStyle = isBite ? '#ffd76a' : CONFIG.COLORS.hudText;
    g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(text, bx + 8, by + 4);
    if(isBite){
      /* 剩余窗口条：越短越紧 */
      const k = clamp(1 - fishing.t / CONFIG.FISHING.BITE_WINDOW_MS, 0, 1);
      g.fillStyle = '#3a1a12'; g.fillRect(bx, by + 24, w + 16, 4);
      g.fillStyle = '#ff6a4a'; g.fillRect(bx, by + 24, (w + 16) * k, 4);
    }
    return;
  }
  if(fishing.state !== 'reel') return;
  const R = CONFIG.FISHING.REEL;
  const W = R.BAR_W, H = R.BAR_H;
  const x = Math.round((VIEW_W - W) / 2), y = Math.round(VIEW_H * 0.60);
  /* 横条：深色底 + 绿色区 + 指针 */
  g.fillStyle = 'rgba(8,10,16,.90)';
  g.fillRect(x - 4, y - 4, W + 8, H + 8);
  g.fillStyle = '#1a2130'; g.fillRect(x, y, W, H);
  const zx = x + (fishing.zone - fishing.zoneW / 2) * W;
  g.fillStyle = 'rgba(80,190,90,.85)';
  g.fillRect(Math.round(zx), y + 1, Math.round(fishing.zoneW * W), H - 2);
  g.fillStyle = '#7fe08a';
  g.fillRect(Math.round(zx), y + 1, Math.round(fishing.zoneW * W), 2);
  const pxp = Math.round(x + fishing.pointer * W);
  g.fillStyle = '#ffd76a';
  g.fillRect(pxp - 2, y - 3, 4, H + 6);
  g.fillStyle = '#fff2c0';
  g.fillRect(pxp - 1, y - 3, 2, H + 6);
  g.strokeStyle = CONFIG.COLORS.hudBorder;
  g.strokeRect(x - 4.5, y - 4.5, W + 9, H + 9);
  /* 文案：鱼名 / 稀有度 / 操作 */
  const f = fishing.fish;
  g.textAlign = 'center'; g.textBaseline = 'top';
  g.font = '14px ' + FONT_CJK;
  g.fillStyle = '#ffd76a';
  g.fillText((f ? f.icon + ' ' + f.name : '') + '　稀有度 ' + (f ? f.rarity : '?'), VIEW_W/2, y - 30);
  g.font = '12px ' + FONT_CJK;
  g.fillStyle = CONFIG.COLORS.hudText;
  g.fillText('左键 / 空格：让指针停在绿色区间内', VIEW_W/2, y + H + 10);
  g.textAlign = 'left';
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { fishing, fishingActive, fishDef, waterNearFishing, fishHourOK, fishEligible, fishCandidates, fishPickWeighted, startFishing, cancelFishing, fishingEscape, fishingStartReel, fishingResolveReel, fishingPress, updateFishing, drawFishing });
export { fishing, fishingActive, fishDef, waterNearFishing, fishHourOK, fishEligible, fishCandidates, fishPickWeighted, startFishing, cancelFishing, fishingEscape, fishingStartReel, fishingResolveReel, fishingPress, updateFishing, drawFishing };
