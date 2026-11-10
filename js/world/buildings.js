/* js/world/buildings.js —— 由 index.html 拆分，原行 2294–2332 */
'use strict';

/* === 2.世界 === */
const TILE_NAMES = ['草地','泥土','水','树','岩石','野花','小屋','商店','耕地','已浇水','空地',
                    '野花丛','蘑菇','浆果','节日彩旗','集市摊位','节日灯笼',
                    '镇屋','门','室内墙','木地板','石板路','前墙','后墙'];

/* ================= 第 25 轮：BUILDING_DEFS（静态建筑定义，不存档） =================
 * 建筑 = 外墙 + 门 + 地板 + 家具，全部是 map 上的格子。
 * 每条 fixture 的结构和玩家盖的房子一模一样（{type, tx, ty}），
 * 区别是 preset:true —— 玩家拆不了、也不写进存档（读档时重新盖一遍）。
 * 好处：isSolid / chestNear / buildingAt 这些逻辑一行都不用改，
 *       照样查 buildIndex 就能认出「柜台」「箱子」「床」。 */
const BUILDING_DEFS = (function(){
  const C = CONFIG.TOWN;
  const out = [];
  for(const b of C.LIST){
    const row = b.row || C.ROOM_ROW;
    const fixtures = [];
    for(const p of (b.props || []))
      fixtures.push({
        type:p.type, tx:b.x + p.dx, ty:row + p.dy,
        solid:!!p.solid, flat:!!p.flat, interact:p.interact || '',
        preset:true, npc:b.npc, bid:b.id
      });
    out.push({id:b.id, name:b.name, kind:b.kind, npc:b.npc,
              residents:(b.residents || [b.npc]).slice(),
              x:b.x, w:b.w, row:row,
              hours:b.hours, wander:b.wander || null, fixtures:fixtures});
  }
  return out;
})();

const MAP_W = CONFIG.MAP_W, MAP_H = CONFIG.MAP_H, TILE = CONFIG.TILE;
const VIEW_W = CONFIG.VIEW_W, VIEW_H = CONFIG.VIEW_H;
window.map = new Uint8Array(MAP_W * MAP_H);
/* 耕地格数（第 22 轮）：增量维护，setTile 时 +1/-1，评级扩建期数直接读它
 * （原来每次重算都要扫 4096 格，连续锄地时白扫几十万格） */
window.tilledCount = 0;
/* 作物层：每格最多一株作物；null = 空地
 * 记录字段：type 作物 id / stage 视觉阶段 0~3 / grown 累计生长天数（浇过水的天数）
 *           watered 当天是否浇过水 / mature 是否成熟 / dead 是否枯萎 */
window.crops = new Array(MAP_W * MAP_H).fill(null);



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { TILE_NAMES, BUILDING_DEFS, MAP_W, MAP_H, TILE, VIEW_W, VIEW_H });
export { TILE_NAMES, BUILDING_DEFS, MAP_W, MAP_H, TILE, VIEW_W, VIEW_H };
