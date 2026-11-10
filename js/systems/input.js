/* js/systems/input.js —— 由 index.html 拆分，原行 5429–5641 */
'use strict';

/* --- 暂停：所有系统（时间/天气/角色/摄像机）一起冻结 --- */
window.paused = false;
function setPaused(v){ paused = !!v; }

/* --- 输入 --- */
const keys = {};
window.lastAxis = 'x';
window.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if(['arrowleft','arrowright','arrowup','arrowdown',' ','tab'].includes(k)) e.preventDefault();
  keys[k] = true;
  if(k==='a'||k==='arrowleft'||k==='d'||k==='arrowright') lastAxis = 'x';
  else if(k==='w'||k==='arrowup'||k==='s'||k==='arrowdown') lastAxis = 'y';
  /* 第 30 轮：矿井模式接管所有按键（移动由 mine.js 自己的监听处理） */
  if(window.mineActive){
    if(k === 'escape'){ if(!e.repeat) exitMine(); return; }
    if(k === ' '){ if(!e.repeat) mineAttack(); return; }
    return;
  }
  /* M：总音量开关（任何面板开着时都能按） */
  if(k === CONFIG.AUDIO.MUTE_KEY){
    if(!e.repeat) toggleMute();
    return;
  }
  /* 第 29 轮：暂停菜单开着时只有 Esc / P 能动 */
  if(pauseMenuOpen && k !== 'escape' && k !== CONFIG.PAUSE_KEY) return;
  /* NPC 对话中：E / 空格推进对话，其余键一律忽略（Esc 交给下面的分支统一处理） */
  if(npcOpen && !packOpen && k !== 'escape'){
    if(k === 'e' || k === ' '){ if(!e.repeat) npcAdvance(); ensureAudio(); }
    return;
  }
  /* 动物面板：E / 空格 / Esc 关闭，其它键一律忽略（打开时世界冻结） */
  if(animalOpen && k !== 'escape'){
    if((k === 'e' || k === ' ') && !e.repeat){ animalClosePanel(); ensureAudio(); }
    return;
  }
  /* 委托板：E / 空格 / Esc 关闭，其它键一律忽略（打开时世界冻结） */
  if(questOpen && k !== 'escape'){
    if((k === 'e' || k === ' ') && !e.repeat){ questClosePanel(); ensureAudio(); }
    return;
  }
  /* 日历：E / 空格 / Esc 关闭，其它键一律忽略（打开时世界冻结） */
  if(calOpen && k !== 'escape'){
    if((k === 'e' || k === ' ') && !e.repeat){ calClosePanel(); ensureAudio(); }
    return;
  }
  /* 加工台：E / 空格 / Esc 关闭，其它键一律忽略（打开时世界冻结） */
  if(makerOpen && k !== 'escape'){
    if((k === 'e' || k === ' ') && !e.repeat){ makerClosePanel(); ensureAudio(); }
    return;
  }
  /* 第 20 轮：终局结算只有 Esc 能动；农场评级只有 Esc / G 能动（打开时世界冻结） */
  if(endingOpen && k !== 'escape') return;
  if(ratingOpen && k !== 'escape' && k !== 'g') return;
  /* 成就墙 / 年度总结 / 好感总览 / 全屏地图：只有 Esc 能动，其它键一律忽略（打开时世界冻结） */
  if((achOpen || annualOpen || frendOpen || bigmapOpen) && k !== 'escape') return;
  /* 第 30 轮：J 进入 / 离开矿井（有面板或建造 / 钓鱼时忽略） */
  if(k === 'j' && !e.repeat && !startMenuOpen && !sysOpen && !packOpen && !shopOpen && !chestOpen && !makerOpen && !npcOpen && !buildMode && !fishingActive() && sleepFx.phase === 'none'){
    toggleMine(); ensureAudio(); return;
  }
  /* 背包：Tab / I 打开，Esc 关闭 */
  if(k === 'tab' || k === 'i'){ if(!e.repeat) togglePack(); ensureAudio(); return; }
  if(k === 'escape'){
    if(pauseMenuOpen){ togglePauseMenu(false); return; }   /* 第 29 轮：先关暂停菜单 */
    if(endingOpen){ endingClosePanel(); return; }
    if(ratingOpen){ ratingClosePanel(); return; }
    if(annualOpen){ annualClosePanel(); return; }
    if(achOpen){ achClosePanel(); return; }
    if(frendOpen){ frendClosePanel(); return; }      /* 第 28 轮 */
    if(bigmapOpen){ toggleBigmap(false); return; }   /* 第 28 轮 */
    if(calOpen){ calClosePanel(); return; }
    if(questOpen){ questClosePanel(); return; }
    if(animalOpen){ animalClosePanel(); return; }
    if(chestOpen){ toggleChest(false); return; }
    if(makerOpen){ makerClosePanel(); return; }
    if(shopOpen){ toggleShop(false); return; }
    if(packOpen){ togglePack(false); if(packMode === 'gift'){ packMode = 'normal'; giftTarget = null; refreshPackGrid(); } return; }
    if(npcOpen){ npcCloseDialog(); return; }
    if(sysOpen){ toggleSys(false); return; }
    if(startMenuOpen) return;                 /* 标题界面必须选一个才能进游戏 */
    if(buildMode){ toggleBuild(false); return; }
    if(fishingActive()){ cancelFishing(false); return; }   /* 钓鱼中 Esc = 收竿 */
    toggleSys(true);                          /* 其它情况：打开系统菜单（保存/读档） */
    return;
  }
  if(startMenuOpen) return;         /* 标题界面：其它按键一律忽略 */
  if(sysOpen) return;               /* 系统菜单：其它按键一律忽略 */
  if(shopOpen) return;              /* 商店打开时其它按键一律忽略 */
  if(packOpen) return;              /* 背包打开时其它按键一律忽略 */
  if(chestOpen) return;             /* 木箱打开时其它按键一律忽略 */
  if(makerOpen) return;             /* 加工台打开时其它按键一律忽略 */
  if(sleepFx.phase !== 'none') return;   /* 睡觉/昏睡中：其它按键一律忽略 */
  /* 钓鱼中：左键 / 空格 = 收杆，其它键一律忽略（Tab 已在上面打开背包 → 钓鱼随之冻结） */
  if(fishingActive()){
    if((k === ' ' || k === 'enter') && !e.repeat) fishingPress();
    return;
  }
  /* B：进出建造模式 */
  if(k === 'b'){ if(!e.repeat) toggleBuild(); ensureAudio(); return; }
  /* G：农场评级 / 雇工（第 20 轮） */
  if(k === 'g'){ if(!e.repeat) toggleRatingPanel(); ensureAudio(); return; }
  /* 建造模式：E / Q 换配方（E 优先级最高，会顶掉「按 E 睡觉/交易」） */
  if(buildMode && (k === 'e' || k === 'q')){
    if(!e.repeat) cycleBuild(k === 'e' ? 1 : -1);
    ensureAudio(); return;
  }
  /* E：上下文交互 —— 小屋旁睡觉，木箱旁开箱，商店摊旁交易，NPC 旁说话 */
  if(k === 'e'){
    if(!e.repeat){
      const c = chestNear();
      const n = npcNear();
      const mk = makerNear();
      if(n){                                     /* 人在旁边 → 先跟人说话 */
        if(npcAsleepHere(n)) toast(n.name + '睡得正香，别吵醒他');   /* 第 25 轮：睡着的叫不醒 */
        else npcOpenDialog(n);
      }
      else if(nearHouse()) startSleep(false);
      else if(nearShop()) toggleShop();
      else if(c){
        if(c.preset) openNpcChest(c.npc);        /* 第 25 轮：NPC 家的箱子（一周一次） */
        else { openChest = c; toggleChest(true); }
      }
      else if(mk) makerOpenPanel(mk);            /* 第 19 轮：加工台 */
      else if(fixtureNear()) interactFixture(fixtureNear());   /* 第 25 轮：看装饰 / 睡 bed */
      else if(questBoardNear()) toggleQuestPanel();          /* 第 16 轮：委托板 */
      else if(animalNear()) animalOpenPanel(animalNear());   /* 第 15 轮：脚边动物 → 摸头 / 喂食 */
      else if(typeof petBowlNear === 'function' && petBowlNear()) petCycle();   /* 第 32 轮：宠物碗换品种 */
      else if(typeof petNear === 'function' && petNear()) petInteract();        /* 第 32 轮：摸宠物 */
      else{
        const tr = (typeof fruitTreeNear === 'function') ? fruitTreeNear() : null;
        const g = gatherNear();
        if(tr){ harvestFruit(tr.tx, tr.ty); }    /* 第 32 轮：果树结果 → E 采摘 */
        else if(g){ pickGather(g.tx, g.ty); }    /* 第 14 轮：脚边有野花/蘑菇/浆果 → 采走 */
        else{
          /* 都不是 → 提示靠近最近的那个（小屋 / 商店 / 居民） */
          const dh = houseDist(), ds = shopDist();
          toast(dh <= ds ? '走近小屋才能睡觉' : '走进镇上的杂货店，站在柜台前才能交易');
        }
      }
    }
    ensureAudio(); return;
  }
  /* 数字键 1~8 选中快捷栏（= 背包前 8 格） */
  if(k >= '1' && k <= String(CONFIG.INVENTORY.HOTBAR)){
    selectHot(Number(k) - 1);
    ensureAudio();                   /* 键盘也算一次用户交互，解锁音频 */
  }
  if(k === CONFIG.PAUSE_KEY) togglePauseMenu();   /* 第 29 轮：P 打开 / 关闭暂停菜单 */
});
window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', ()=>{ for(const k in keys) keys[k] = false; mouseHeld = false; });

/* --- 鼠标 → 指向的瓦片（换算与 CSS 缩放无关） --- */
const mouse = {x:0, y:0, inside:false};
const hover = {tx:-1, ty:-1};
/* 第 31 轮：长按左键连续使用工具（砍树 / 锄地 / 浇水…） */
let mouseHeld = false;
let holdCd = 0;
const HOLD_INTERVAL = 0.32;
function toLogical(e){
  const r = canvas.getBoundingClientRect();
  return {x:(e.clientX - r.left) * (VIEW_W / r.width),
          y:(e.clientY - r.top)  * (VIEW_H / r.height)};
}
canvas.addEventListener('mousemove', e=>{
  const p = toLogical(e);
  mouse.x = p.x; mouse.y = p.y; mouse.inside = true;
  hover.tx = Math.floor((cam.x + p.x) / TILE);
  hover.ty = Math.floor((cam.y + p.y) / TILE);
  /* 第 28 轮：悬停 HUD 可点区域（日期 / 评分 / 小地图）时变手型 */
  canvas.style.cursor = (hitHudDate(p) || hitHudRating(p) || hitHudMini(p)) ? 'pointer' : '';
});
canvas.addEventListener('mouseleave', ()=>{ mouse.inside = false; hover.tx = -1; hover.ty = -1; mouseHeld = false; });
/* 松开左键：停止连续使用 */
window.addEventListener('mouseup', e=>{ if(e.button === 0){ mouseHeld = false; holdCd = 0; } });
/* 左键 = 使用当前选中物品（这次点击同时作为音频解锁的用户交互）；右键 = 站在水边给水壶补水 */
canvas.addEventListener('mousedown', e=>{
  if(pauseMenuOpen || packOpen || shopOpen || chestOpen || npcOpen || animalOpen || questOpen || calOpen ||
     achOpen || annualOpen || makerOpen || ratingOpen || endingOpen || frendOpen || bigmapOpen) return;
  if(e.button === 0) mouseHeld = false;
  const p = toLogical(e);
  /* 点 HUD 上的日期 → 打开日历（第 17 轮），不要穿到世界里去锄地/放置 */
  if(e.button === 0 && hitHudDate(p)){ ensureAudio(); toggleCalendar(); return; }
  /* 第 20 轮：点右上角评分 → 打开农场评级 */
  if(e.button === 0 && hitHudRating(p)){ ensureAudio(); toggleRatingPanel(); return; }
  /* 第 28 轮：点右上角小地图 → 打开全屏地图 */
  if(e.button === 0 && hitHudMini(p)){ ensureAudio(); toggleBigmap(true); return; }
  const tx = Math.floor((cam.x + p.x) / TILE);
  const ty = Math.floor((cam.y + p.y) / TILE);
  hover.tx = tx; hover.ty = ty;    /* 长按连续使用时以最后指向的格子为准 */
  /* 钓鱼中：左键 = 收杆/拉杆，右键 = 收竿 */
  if(fishingActive()){
    ensureAudio();
    if(e.button === 0) fishingPress();
    else if(e.button === 2) cancelFishing(false);
    return;
  }
  /* 建造模式：左键放置 / 右键拆除 */
  if(buildMode){
    ensureAudio();
    if(e.button === 2){ demolishAt(tx,ty); return; }
    if(e.button !== 0) return;
    placeBuilding(tx,ty);
    return;
  }
  if(e.button === 2){
    ensureAudio();
    /* 第 19 轮：手持成品 → 右键吃一份回体力（每天限 3 次）；否则还是给水壶补水 */
    const selFood = selectedSlot();
    const fd = selFood ? itemDef(selFood.id) : null;
    if(fd && fd.kind === 'food'){ eatFood(selFood.id); if(typeof playerPlayAction === 'function') playerPlayAction('eat'); return; }
    refillCan(); return;
  }
  if(e.button !== 0) return;
  ensureAudio();
  /* 点在快捷栏上 → 选中那一格，不算使用工具 */
  const hb = hotbarRect();
  if(p.x >= hb.x - 6 && p.x <= hb.x + hb.w + 5 && p.y >= hb.y - 6 && p.y <= hb.y + hb.h + 5){
    const idx = Math.floor((p.x - hb.x) / (hb.cell + hb.gap));
    if(idx >= 0 && idx < CONFIG.INVENTORY.HOTBAR) selectHot(idx);
    return;
  }
  /* 手持鱼竿 → 抛竿（钓到鱼才进背包，不再走 useTool） */
  const selNow = selectedSlot();
  if(selNow && selNow.id === CONFIG.FISHING.ROD_ID){ startFishing(); return; }
  /* 第 30 轮：面向点击的格子并播放对应工具 / 收获动作 */
  if(typeof playerFaceTile === 'function') playerFaceTile(tx, ty);
  if(typeof playerActionFromItem === 'function') playerActionFromItem();
  mouseHeld = true;               /* 按住不放 → 连续使用 */
  holdCd = HOLD_INTERVAL;
  useTool(tx, ty);
});
canvas.addEventListener('contextmenu', e=> e.preventDefault());

/* 长按左键：上一次工具动作结束后自动接下一次（砍树 / 锄地 / 浇水…） */
function updateHoldUse(dt){
  if(!mouseHeld) return;
  if(window.mineActive){ mouseHeld = false; return; }
  if(pauseMenuOpen || packOpen || shopOpen || chestOpen || npcOpen || animalOpen || questOpen || calOpen ||
     achOpen || annualOpen || makerOpen || ratingOpen || endingOpen || frendOpen || bigmapOpen ||
     buildMode || fishingActive()){ mouseHeld = false; return; }

  const slot = typeof selectedSlot === 'function' ? selectedSlot() : null;
  const item = slot && typeof itemDef === 'function' ? itemDef(slot.id) : null;
  /* 只有工具会连续触发；种子 / 食物 / 空手不连发，避免刷提示 */
  if(!item || !item.tool || item.tool === 'rod'){ mouseHeld = false; return; }
  if(typeof player !== 'undefined' && player.moving) return;   /* 走路时不隔空挥工具 */
  if(hover.tx < 0 || hover.ty < 0) return;

  if(holdCd > 0) holdCd = Math.max(0, holdCd - dt);
  if(typeof playerAnimBusy === 'function' && playerAnimBusy()) return;
  if(holdCd > 0) return;

  holdCd = HOLD_INTERVAL;
  if(typeof playerFaceTile === 'function') playerFaceTile(hover.tx, hover.ty);
  if(typeof playerActionFromItem === 'function') playerActionFromItem();
  const ok = useTool(hover.tx, hover.ty);
  if(ok === false) mouseHeld = false;      /* 用不了就停下，避免重复弹提示 */
}
/* 建造模式：滚轮换配方 */
canvas.addEventListener('wheel', e=>{
  if(!buildMode) return;
  e.preventDefault();
  cycleBuild(e.deltaY > 0 ? 1 : -1);
}, {passive:false});



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { keys, mouse, hover, setPaused, toLogical, updateHoldUse });
export { keys, mouse, hover, setPaused, toLogical, updateHoldUse };
