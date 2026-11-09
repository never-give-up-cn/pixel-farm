/* js/npc/shop-hours.js —— 由 index.html 拆分，原行 8259–8350 */
'use strict';

/* ================= 第 25 轮：商店营业 + 门口挂牌三态 =================
 * 营业中（绿）/ 休息中（灰，10:00 开门）/ 外出中（黄，大概几点回来） */
function shopOpenNow(h){
  const b = townShopBuilding();
  if(!b) return false;
  const hh = (h === undefined || h === null) ? skyHour() : h;
  if(!townOpenNow(b, hh)) return false;      /* 不在营业时间 */
  return townOwnerPresent(hh);               /* 还得老板娘真的在柜台 */
}
/* 想开商店：先说清楚为什么开不了 */
function tryOpenShop(){
  const b = townShopBuilding();
  if(!b){ toast('镇上还没有商店'); return false; }
  const hh = skyHour();
  if(!townOpenNow(b, hh)){
    toast('打烊了 —— 营业时间 ' + hourText(b.hours.from) + '~' + hourText(b.hours.to));
    return false;
  }
  if(!townOwnerPresent(hh)){
    toast('老板娘现在不在柜台（营业时间 ' + hourText(b.hours.from) + '~' + hourText(b.hours.to) + '）');
    return false;
  }
  return true;
}
/* 门口挂牌的三种状态 */
function townDoorState(b){
  const K = CONFIG.TOWN.COLORS;
  const npc = npcDef(b.npc);
  const st = npc ? npcCurrentState(npc, clock.day) : null;
  if(b.kind === 'shop'){
    const S = npcSched(npc) || {open:{from:b.hours.from, to:b.hours.to}};
    const h = skyHour();
    if(st && st.type === 'work' && st.at === 'shop') return {key:'open', color:K.signOpen, text:'营业中'};
    if(h >= S.open.from && h < S.open.to){
      const back = npcNextSlotFrom(npc, h);
      return {key:'away', color:K.signAway, text:'外出中（约 ' + hourText(back) + ' 回来）'};
    }
    if(h < S.open.from) return {key:'rest', color:K.signRest, text:'休息中 · ' + hourText(S.open.from) + ' 开门'};
    return {key:'rest', color:K.signRest, text:'休息中 · 今天关店了'};
  }
  if(!st) return {key:'rest', color:K.signRest, text:'空房子'};
  if(st.type === 'sleep') return {key:'rest', color:K.signRest, text:b.npc === 'aunt' ? '老板娘在睡觉' : '主人在睡觉'};
  if(st.type === 'work')  return {key:'open', color:K.signOpen, text:'主人在忙'};
  if(st.at === 'home')    return {key:'open', color:K.signOpen, text:'主人在家'};
  return {key:'away', color:K.signAway, text:'主人出去了'};
}
/* 家具（床 / 柜台 / 桌子 / 货架…）：坐标由配置算出来，只算一次 */
window._townProps = null;
function townProps(){
  if(!_townProps){
    const C = CONFIG.TOWN;
    _townProps = [];
    for(const b of C.LIST){
      if(!b.props) continue;
      for(const p of b.props)
        _townProps.push({b:b, x:b.x + p.dx, y:C.ROOM_ROW + p.dy,
                         type:p.type, solid:!!p.solid, flat:!!p.flat,
                         interact:p.interact || '', preset:true});
    }
  }
  return _townProps;
}
function townPropAt(tx,ty){
  const C = CONFIG.TOWN;
  if(ty <= C.ROOM_ROW || ty >= C.ROOM_ROW + C.ROOM_H) return null;
  for(const p of townProps()) if(p.x === tx && p.y === ty) return p;
  return null;
}
/* 进门的那一下闪一下（遮住瞬移）
 * 第 26 轮：进门只挪 1 格（32px），不需要遮瞬移 → dur = 0 = 永远不闪
 * （原来 dur=0.32 时，游戏一开局那 0.32 秒整屏都是黑的） */
const warpFx = {t:0, dur:0};
/* 商店柜台（老板娘上班的位置） */
function townCounterSpot(){
  const b = townShopBuilding();
  if(!b) return null;
  return {x:b.x + CONFIG.TOWN.DOOR_DX, y:CONFIG.TOWN.ROOM_ROW + 4};
}
/* 自己的卧室（床边那块地） */
function townHomeSpot(npcId){
  const b = townHomeBuilding(npcId);
  if(!b) return null;
  return {x:b.x + 3, y:CONFIG.TOWN.ROOM_ROW + 8};
}
/* 开门时间（to > 24 表示跨午夜，例如 19 → 30 是 19:00~次日 6:00） */
function townOpenNow(b, h){
  if(!b || !b.hours) return false;
  if(h === undefined) h = skyHour();
  const H = b.hours;
  if(H.to <= 24) return h >= H.from && h < H.to;
  return h >= H.from || h < (H.to - 24);
}


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { warpFx, shopOpenNow, tryOpenShop, townDoorState, townProps, townPropAt, townCounterSpot, townHomeSpot, townOpenNow });
export { warpFx, shopOpenNow, tryOpenShop, townDoorState, townProps, townPropAt, townCounterSpot, townHomeSpot, townOpenNow };
