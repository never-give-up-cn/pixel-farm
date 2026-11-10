/* js/systems/collision.js —— 由 index.html 拆分，原行 4007–4116 */
'use strict';

/* --- 碰撞 --- */
function isSolid(tx,ty){
  if(tx<0 || ty<0 || tx>=MAP_W || ty>=MAP_H) return true;   /* 地图外 = 实心 */
  const i = ty*MAP_W+tx;
  const t = map[i];
  if(t===T.TREE || t===T.ROCK || t===T.WATER || t===T.HOUSE || t===T.SHOP) return true;
  if(t===T.BLD || t===T.WALL || t===T.WALL_FRONT || t===T.WALL_BACK) return true;   /* 镇屋外墙 / 室内墙（前墙 + 后墙） */
  if(currentMap === 'valley' && tx===QUEST_BOARD.x && ty===QUEST_BOARD.y) return true;   /* 委托板挡路 */
  if(typeof worldLandmarkSolid === 'function' && worldLandmarkSolid(tx,ty)) return true;
  /* 建造物：栅栏和木箱挡路，洒水器可以踩过去 */
  const bi = buildIndex[i];
  if(bi >= 0){
    const b = buildings[bi];
    if(b.preset){ if(b.solid) return true; }        /* 第 25 轮：镇上的家具（柜台 / 床 / 箱子…）挡路 */
    else{
      const r = buildRecipe(b.type);
      if(r && r.solid) return true;
    }
  }
  return false;
}
/* 碰撞盒（脚部）：相对精灵中心下移 (BODY_H - BOX_H)/2 */
const BOX_OFF_Y = (CONFIG.PLAYER.BODY_H - CONFIG.PLAYER.BOX_H) / 2;
function boxHitsSolid(cx, cy){
  const hw = CONFIG.PLAYER.BOX_W/2, hh = CONFIG.PLAYER.BOX_H/2;
  const x0 = Math.floor((cx - hw) / TILE);
  const x1 = Math.floor((cx + hw - 0.001) / TILE);
  const y0 = Math.floor((cy - hh) / TILE);
  const y1 = Math.floor((cy + hh - 0.001) / TILE);
  for(let ty=y0;ty<=y1;ty++)
    for(let tx=x0;tx<=x1;tx++)
      if(isSolid(tx,ty)) return true;
  return false;
}
/* 分轴移动：先 X 再 Y；某轴被挡则该轴位移作废 → 天然沿墙滑动 */
function movePlayer(dx, dy){
  const by = player.y + BOX_OFF_Y;
  if(!boxHitsSolid(player.x + dx, by)) player.x += dx;
  if(!boxHitsSolid(player.x, by + dy)) player.y += dy;
}
/* 脱困：若当前位置与实心格重叠（例如存档落在障碍里）则向 8 个方向逐像素找最近的空位 */
function unstickPlayer(){
  const by = player.y + BOX_OFF_Y;
  for(let r=1;r<=TILE;r++){
    const offs=[[-r,0],[r,0],[0,-r],[0,r],[-r,-r],[r,-r],[-r,r],[r,r]];
    for(let i=0;i<offs.length;i++){
      if(!boxHitsSolid(player.x + offs[i][0], by + offs[i][1])){
        player.x += offs[i][0]; player.y += offs[i][1];
        return true;
      }
    }
  }
  return false;
}
function updatePlayer(dt){
  /* 工具 / 收获 / 吃东西的动画期间锁住脚步：动画播完再恢复移动 */
  if(typeof playerAnimBusy === 'function' && playerAnimBusy()){
    player.moving = false;
    player.vx = 0; player.vy = 0;
    player.running = false;
    player.frame = 0; player.animT = 0;
    return;
  }
  /* 兜底：位置与实心格重叠时先脱困（静止时也要处理，否则会被永久卡住） */
  if(boxHitsSolid(player.x, player.y + BOX_OFF_Y)) unstickPlayer();

  let ix = 0, iy = 0;
  if(keys['a'] || keys['arrowleft'])  ix -= 1;
  if(keys['d'] || keys['arrowright']) ix += 1;
  if(keys['w'] || keys['arrowup'])    iy -= 1;
  if(keys['s'] || keys['arrowdown'])  iy += 1;

  const moving = (ix !== 0 || iy !== 0);
  player.moving = moving;
  let prevTy = undefined;                  /* 第 26 轮：移动前站在哪一格（进门 / 出门靠它分方向） */
  if(moving){
    /* 对角线归一化：斜向速度与直线一致，不加速 */
    const len = Math.hypot(ix, iy) || 1;
    ix /= len; iy /= len;
    /* 体力为 0 时跑不动（自动禁用奔跑） */
    const running = !!keys['shift'] && stamina > 0;
    player.running = running;
    if(running) stamina = Math.max(0, stamina - CONFIG.STAMINA.RUN_PER_SEC * dt);
    /* 石板路：踩上去速度 ×1.3 */
    const road = roadUnderPlayer();
    /* 雪天：地面湿滑，走路慢一截（第 22 轮：天气终于有玩法影响） */
    const wm = (weather && weather.id === 'snow') ? CONFIG.WEATHER_FX.SNOW_SLOW : 1;
    const sp = CONFIG.PLAYER.SPEED * (road ? CONFIG.BUILD.ROAD_MULT : 1) *
               (running ? CONFIG.PLAYER.RUN_MULT : 1) * wm;
    player.vx = ix * sp; player.vy = iy * sp;
    /* 朝向：两轴同按时以最后按下的轴为准 */
    if(ix !== 0 && iy !== 0) player.dir = lastAxis === 'x' ? (ix<0?1:2) : (iy<0?3:0);
    else if(ix !== 0) player.dir = ix<0 ? 1 : 2;
    else player.dir = iy<0 ? 3 : 0;
    /* 第 26 轮：记下移动前站在哪一格 —— 进门 / 出门靠它分方向 */
    prevTy = Math.floor(player.y/TILE);
    movePlayer(player.vx * dt, player.vy * dt);
    /* 脚步声：按固定间隔触发，每次音高随机；跑动时更快更响 */
    player.stepT += dt;
    const stepIv = CONFIG.AUDIO.STEP.INTERVAL / (running ? CONFIG.PLAYER.RUN_MULT : 1);
    if(player.stepT >= stepIv){
      player.stepT = 0;
      playStep(running);
    }
    /* 新手引导：累计移动距离 */
    tutMoved(Math.abs(player.vx*dt) + Math.abs(player.vy*dt));
    /* 摆腿动画：时间驱动帧切换 */
    player.animT += dt;
    const interval = 1 / CONFIG.PLAYER.ANIM_FPS;
    if(player.animT >= interval){ player.animT -= interval; player.frame ^= 1; }
  } else {
    player.vx = 0; player.vy = 0;
    player.running = false;
    player.frame = 0;         /* 静止回到站立帧 */
    player.animT = 0;
  }
  if(player.warpCd > 0) player.warpCd = Math.max(0, player.warpCd - dt);
  /* 地图出口：农场北 → 山地，小镇西 → 森林，小镇南 → 海滩 */
  if(typeof worldExitCheck === 'function' && worldExitCheck()) return;
  /* 第 24 轮：踩到门就进去（建筑是地图的容器，不是场景 → 没有「当前场景」状态）
   * 第 26 轮：墙只有 1 格厚 → 进门 / 出门靠「上一格在哪」分方向 */
  townDoorCheck(typeof prevTy === 'number' ? prevTy : undefined);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { BOX_OFF_Y, isSolid, boxHitsSolid, movePlayer, unstickPlayer, updatePlayer });
export { BOX_OFF_Y, isSolid, boxHitsSolid, movePlayer, unstickPlayer, updatePlayer };
