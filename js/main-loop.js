/* js/main-loop.js —— 由 index.html 拆分，原行 7671–7817 */
'use strict';

/* === 8.主循环 === */
const FIXED_DT = 1 / CONFIG.TARGET_FPS;
window.accumulator = 0;
window.lastTime = performance.now();
window.firstRenderDone = false;
const renderLog = {ground:false, objects:false, player:false, ui:false};
window.animTime = 0, window.fps = 0, window.frameCount = 0, window.fpsTimer = 0, window.frameNo = 0, window.visibleCount = 0;
window.renderMs = 0;                  /* 最近一帧的渲染耗时（毫秒，滑动平均） */

function update(dt){
  if(window.mineActive){ updateMine(dt); return; }   /* 矿井模式：接管更新，农场世界冻结 */
  if(window.farmhouseActive && sleepFx.phase === 'none'){
    animTime += dt;
    updateClock(dt);                 /* 室内时间照常走，灶台会推进 */
    updateFarmhouse(dt);
    return;
  }
  if(npcOpen) updateNpcDialog(dt);   /* 打字机属于 UI：对话打开时字照常一个个蹦出来 */
  if(warpFx.t < warpFx.dur) warpFx.t += dt;   /* 第 26 轮：进门只挪 1 格 → 闪屏不再用（留作以后别的转场） */
  if(sleepFx.phase !== 'none'){ updateSleepFx(dt); return; }  /* 睡觉/昏睡：接管整个更新 */
  /* 第 18 轮：年度总结在睡醒后弹（睡觉转场结束时再开面板，免得被黑屏盖住） */
  if(annualPending && !startMenuOpen && !sysOpen){ const p = annualPending; annualPending = null; annualOpenPanel(p); }
  /* 第 20 轮：达成 5 星 → 弹结算画面（若评级面板开着，先收起） */
  if(endingPending && !startMenuOpen && !sysOpen){
    endingPending = false;
    if(ratingOpen) ratingClosePanel();
    endingOpenPanel();
  }
  if(startMenuOpen) return;           /* 标题界面：整个游戏冻结 */
  if(sysOpen) return;                 /* 系统菜单：整个游戏冻结 */
  if(window.mineGateOpen) return;     /* 矿井入口电梯：整体冻结 */
  if(paused) return;                 /* 暂停：时间/天气/角色/摄像机全部冻结 */
  if(npcOpen) return;                 /* NPC 对话：整个游戏冻结（时间停住） */
  if(packOpen) return;               /* 背包打开：同样整体冻结（时间停住） */
  if(bundleOpen) return;             /* 收集包面板：整体冻结 */
  if(wardrobeOpen) return;           /* 衣柜面板：整体冻结 */
  if(roomOpen) return;               /* 装修样板：整体冻结 */
  if(shopOpen) return;               /* 商店打开：同样整体冻结（时间停住） */
  if(chestOpen) return;              /* 木箱打开：同样整体冻结（时间停住） */
  if(makerOpen) return;              /* 加工台打开：同样整体冻结（时间停住，加工也不走） */
  if(animalOpen) return;             /* 动物面板打开：同样整体冻结（时间停住，动物也不走） */
  if(questOpen) return;              /* 委托板打开：同样整体冻结（时间停住） */
  if(calOpen) return;                /* 日历打开：同样整体冻结（时间停住） */
  if(frendOpen) return;              /* 第 28 轮：好感总览打开：整体冻结（时间停住） */
  if(bigmapOpen) return;             /* 第 28 轮：全屏地图打开：整体冻结（时间停住） */
  if(achOpen) return;                /* 成就墙打开：同样整体冻结（时间停住） */
  if(annualOpen) return;             /* 年度总结打开：同样整体冻结（时间停住） */
  if(ratingOpen) return;             /* 第 20 轮：农场评级打开：整体冻结 */
  if(endingOpen) return;             /* 第 20 轮：终局结算打开：整体冻结 */
  achTickCard(dt);                   /* 第 18 轮：解锁卡片计时（世界冻结时一并停住） */
  updateSysTip(dt);                  /* 第 21 轮：教学提示倒计时（面板打开时同样停住） */
  animTime += dt;
  updateClock(dt);                   /* 时间推进 */
  updateWeather(dt);                 /* 天气粒子 + 雨声 */
  /* 第 23 轮：小地图每 CONFIG.MINIMAP.REFRESH 秒重绘一次（面板打开时上面已返回 → 一并冻结） */
  miniTimer -= dt;
  if(miniTimer <= 0){ rebuildMinimap(); miniTimer = CONFIG.MINIMAP.REFRESH; }
  visitTick();                       /* 第 23 轮：来访居民的到场提示 */
  updateNpcs(dt);                    /* 第 27 轮：NPC 连续移动（按日程寻路进出屋子） */
  if(fishingActive()){
    /* 钓鱼：人站定不动，只推进抛竿/咬钩/拉杆的状态机（面板打开时上面的分支已经提前返回 → 冻结） */
    updateFishing(dt);
    updatePlayerAnim(dt);            /* 第 30 轮：农夫钓鱼 / 抛竿动画 */
    updateForest(dt);
    updateHarvestFx(dt);
    updateDrops(dt);
    updateAnimals(dt);               /* 动物照常走动（第 15 轮） */
    updatePet(dt);                   /* 第 32 轮：宠物在院子里走动 */
    updateCamera(dt);
    updateSky(dt);
    updateDropFx(dt);
    return;
  }
  updatePlayer(dt);
  updatePlayerAnim(dt);              /* 第 30 轮：农夫动作状态机 */
  updateHoldUse(dt);                 /* 第 31 轮：长按左键连续使用工具 */
  updateForest(dt);                  /* 第 31 轮：树木摇晃 / 倒下 / 木屑 */
  updateHarvestFx(dt);               /* 第 31 轮：岩石 / 野花 / 水土粒子 */
  updateDrops(dt);                   /* 第 31 轮：地面掉落物与自动吸附 */
  updateAnimals(dt);                 /* 第 15 轮：动物在围栏里随便走走 */
  updatePet(dt);                     /* 第 32 轮：宠物在农舍附近走动 */
  updateCamera(dt);
  updateSky(dt);                     /* 昼夜色平滑过渡 */
  updateDropFx(dt);                  /* 洒水器水滴 */
}
function render(){
  const _t0 = performance.now();
  ctx.imageSmoothingEnabled = false;
  if(window.mineActive){ drawMine(ctx); renderMs = renderMs * 0.9 + (performance.now() - _t0) * 0.1; return; }
  if(window.farmhouseActive){ drawFarmhouse(ctx); drawSleepFx(ctx); renderMs = renderMs * 0.9 + (performance.now() - _t0) * 0.1; return; }
  /* 视锥裁剪：只绘制可见范围内的瓦片 */
  const x0 = Math.max(0, Math.floor(cam.x / TILE));
  const x1 = Math.min(MAP_W-1, Math.floor((cam.x + VIEW_W - 1) / TILE));
  const y0 = Math.max(0, Math.floor(cam.y / TILE));
  const y1 = Math.min(MAP_H-1, Math.floor((cam.y + VIEW_H - 1) / TILE));
  visibleCount = (x1-x0+1) * (y1-y0+1);

  if(!renderLog.ground){ renderLog.ground = true; dlog('[render] 1/4 drawGround'); }
  if(!renderLog.objects){ renderLog.objects = true; dlog('[render] 2/4 drawObjects'); }
  if(!renderLog.player){ renderLog.player = true; dlog('[render] 3/4 drawPlayer'); }
  if(!renderLog.ui){ renderLog.ui = true; dlog('[render] 4/4 drawUI'); }

  drawGround(ctx, x0, y0, x1, y1);
  drawRoads(ctx, x0, y0, x1, y1);          /* 石板路（叠加层，在地面之上、季节染色之下） */
  drawSeasonOverlay(ctx, x0, y0, x1, y1);
  drawGathers(ctx, x0, y0, x1, y1);        /* 野花 / 蘑菇 / 浆果（第 14 轮，长在草地上） */
  if(!CONFIG.PERF.Y_SORT){                 /* 关掉 Y 排序时走老路子：作物 / 物件各自一层 */
    drawCrops(ctx, x0, y0, x1, y1);
    drawObjects(ctx, x0, y0, x1, y1);
  }
  drawBuildPreview(ctx);                   /* 建造预览（半透明幽灵） */
  drawEntities(ctx, x0, y0, x1, y1);       /* 按 Y 排序：小屋 / 商店 / 作物 / 物件 / 建造物 / 玩家 */
  if(typeof drawDecorPreview === 'function') drawDecorPreview(ctx);   /* 装修模式：家具预览 */
  drawRoofs(ctx);                           /* 第 26 轮：屋顶（纯渲染层 —— 盖住屋里的东西） */
  drawDropFx(ctx);                         /* 洒水器的小水滴 */
  drawWeather(ctx);
  drawAtmosphere(ctx);
  drawUI(ctx);
  drawFishing(ctx);              /* 钓鱼气泡 / 咬钩提示 / 拉杆横条（第 14 轮） */

  /* 网格线叠加（第 29 轮：默认关闭，设置里可开） */
  if(showGrid){
    ctx.fillStyle = CONFIG.GRID_COLOR;
    for(let tx=x0;tx<=x1+1;tx++) ctx.fillRect(Math.round(tx*TILE - cam.x), 0, 1, VIEW_H);
    for(let ty=y0;ty<=y1+1;ty++) ctx.fillRect(0, Math.round(ty*TILE - cam.y), VIEW_W, 1);
  }
  if(!firstRenderDone){
    firstRenderDone = true;
    dlog('[render] 顺序确认: drawGround -> drawObjects -> drawPlayer -> drawUI');
  }
  drawSleepFx(ctx);              /* 睡觉淡入淡出（盖住网格线） */
  /* 转场闪屏（dur = 0 时不触发 —— 第 26 轮进门只挪 1 格，已经不需要它了） */
  if(warpFx.t < warpFx.dur){
    const a = 1 - warpFx.t / warpFx.dur;
    ctx.fillStyle = 'rgba(6,8,12,' + (a * 0.55).toFixed(3) + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  /* 渲染耗时（滑动平均，看优化效果） */
  renderMs = renderMs * 0.9 + (performance.now() - _t0) * 0.1;
}
function loop(now){
  let frameTime = (now - lastTime) / 1000;
  lastTime = now;
  if(frameTime < 0) frameTime = 0;
  if(frameTime > CONFIG.MAX_FRAME_TIME) frameTime = CONFIG.MAX_FRAME_TIME;

  accumulator += frameTime;
  let steps = 0;
  while(accumulator >= FIXED_DT && steps < CONFIG.MAX_STEPS){
    update(FIXED_DT);
    accumulator -= FIXED_DT;
    steps++;
  }
  if(steps === CONFIG.MAX_STEPS) accumulator = 0;

  /* 渲染异常不能把 rAF 循环带停：记录一次并继续跑，避免整页假死 */
  try {
    render();
  } catch(err) {
    if(!window.__renderErrorLogged){
      window.__renderErrorLogged = true;
      if(typeof console !== 'undefined') console.error('[render] 渲染异常，已跳过该帧：', err);
      if(typeof toast === 'function') toast('渲染出错：' + ((err && err.message) || err));
    }
  }

  frameCount++; frameNo++;
  fpsTimer += frameTime;
  if(fpsTimer >= CONFIG.FPS_INTERVAL){
    fps = frameCount / fpsTimer;
    frameCount = 0; fpsTimer = 0;
    updateStats();
  }
  if(CONFIG.LOG_EVERY > 0 && frameNo % CONFIG.LOG_EVERY === 0){
    dlog('[map] tiles drawn ' + visibleCount + ' / ' + (MAP_W*MAP_H) +
      ' (' + (visibleCount/(MAP_W*MAP_H)*100).toFixed(1) + '%)  player(' +
      player.x.toFixed(0) + ',' + player.y.toFixed(0) + ')  seed ' + CONFIG.SEED);
  }
  requestAnimationFrame(loop);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { FIXED_DT, renderLog, update, render, loop });
export { FIXED_DT, renderLog, update, render, loop };
