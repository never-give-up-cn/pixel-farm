/* js/systems/camera.js —— 由 index.html 拆分，原行 4117–4131 */
'use strict';

/* --- 摄像机：跟随玩家（轻微缓动）+ 边界钳制 --- */
const cam = {x:0, y:0};
function updateCamera(dt){
  const tx = player.x - VIEW_W/2, ty = player.y - VIEW_H/2;
  const k = 1 - Math.exp(-CONFIG.CAMERA.SMOOTH * dt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  const maxX = MAP_W*TILE - VIEW_W, maxY = MAP_H*TILE - VIEW_H;
  cam.x = clamp(cam.x, 0, maxX);
  cam.y = clamp(cam.y, 0, maxY);
  /* 像素对齐：离屏地面贴图和实体都要落在整数像素上，否则会糊 */
  cam.x = Math.round(cam.x);
  cam.y = Math.round(cam.y);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { cam, updateCamera });
export { cam, updateCamera };
