/* js/boot.js —— 由 index.html 拆分，原行 11889–11936 */
'use strict';

genMap(CONFIG.SEED);
snapshotBaseMap();                    /* 记下"底图"，存档时只存与它不同的格子 */
initInventory();                       /* 初始背包 / 快捷栏 */
buildPackGrid();                       /* 造出背包面板的 24 个格子 */
buildDexGrid();                        /* 第 14 轮：图鉴格子（鱼 + 采集物） */
buildChestGrid();                      /* 造出木箱面板的格子（8 + 24） */
player.x = SPAWN.x*TILE + TILE/2;
player.y = SPAWN.y*TILE + TILE/2;
cam.x = clamp(player.x - VIEW_W/2, 0, MAP_W*TILE - VIEW_W);
cam.y = clamp(player.y - VIEW_H/2, 0, MAP_W*TILE - VIEW_H);
rollWeather();                         /* 第 1 天早晨的天气 */
questResetState();                     /* 第 16 轮：第 1 天的 3 个委托 */
festivalResetState();                  /* 第 17 轮：节日状态归零 */
festivalDayStart();                    /* 第 17 轮：开局若正撞上节日，装饰 / 横幅直接生效 */
const sky0 = skyAt(skyHour());
sky.cur = {r:sky0.r, g:sky0.g, b:sky0.b, a:sky0.a, v:sky0.v};
updateStats();
layoutToasts();
layoutSysTip();

/* 离开页面 / 刷新前自动存档（标题界面还开着时不动旧档） */
window.addEventListener('beforeunload', ()=>{
  if(CONFIG.SAVE.AUTO_UNLOAD && sessionActive) saveGame('离开前自动保存');
});

/* 本地有存档 → 标题界面（继续 / 新游戏）；没有 → 直接开新游戏
 * 第 28 轮：三个槽位里挑「保存时间最近」的那个作为默认槽 */
window.bootSave = null;
{
  let best = -1, bestAt = -1;
  for(let i = 0; i < CONFIG.SAVE.SLOTS; i++){
    const d = readSave(i);
    /* 时间戳是毫秒级大数，不能用 |0（会折成负数导致永远选不中） */
    const at = (d && typeof d.at === 'number' && isFinite(d.at)) ? d.at : 0;
    if(d && at >= bestAt){ bestAt = at; best = i; }
  }
  if(best >= 0){ curSlot = best; bootSave = readSave(best); }
}
if(bootSave){
  openStartMenu(bootSave);
  dlog('[save] 发现存档 v' + bootSave.v + '（槽' + (curSlot + 1) + '），等待玩家选择');
}else{
  sessionActive = true;
  spawnGather(true);             /* 第 14 轮：新开局先刷一季的采集物（第一天就有花可采） */
  updateTut();                   /* 新玩家：第 1 天早晨弹出新手引导 */
}
requestAnimationFrame(loop);



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { sky0 });
export { sky0 };
