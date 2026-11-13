/* js/systems/shop.js —— 由 index.html 拆分，原行 4985–5139 */
'use strict';

/* --- 商店系统：价格 / 买卖 / 水壶扩容 ---
 * 价格 = 基础价 × 季节系数 × (1 ± PRICE_FLUCT)
 *   基础价：种子/工具查 CONFIG.SHOP.BUY；作物查 CONFIG.CROPS.sell；材料查 CONFIG.ITEMS.price
 *   季节系数：春 1.00 / 夏 1.05 / 秋 1.10 / 冬 0.90
 *   浮动量：由「物品 id + 天数」哈希出来 → 同一天同一物品价格固定，隔天才变
 * 卖出与买入共用同一个 priceOf()，面板上用 ↑ ↓ 标出当前价相对「基础价 × 季节系数」的涨跌 */
function strHash(s){
  let h = 2166136261 >>> 0;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  /* 雪崩混淆：不然短字符串（只差一天）会挤在一堆，价格浮动就成不了「每天不同」 */
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;                 /* 0~1 */
}
/* 当前季节的价格系数 */
function seasonCoef(){ return CONFIG.SHOP.SEASON_COEF[seasonName()] || 1; }
/* 基础价（不含季节系数与浮动） */
function basePrice(id){
  const buy = CONFIG.SHOP.BUY.find(b => b.id === id);
  if(buy) return buy.price;
  const d = itemDef(id);
  if(!d) return 0;
  if(d.kind === 'crop'){
    /* 第 23 轮：优质作物自带定价（普通 ×1.8）；普通作物没有 price → 走作物表的 sell */
    if(typeof d.price === 'number') return d.price;
    const c = cropDef(d.crop); return c ? c.sell : 0;
  }
  if(d.kind === 'material' || d.kind === 'fish' || d.kind === 'gather' ||
     d.kind === 'animal' || d.kind === 'food' || d.kind === 'mineral' ||
     d.kind === 'weapon' || d.kind === 'ring' || d.kind === 'boots' ||
     d.kind === 'furniture' || d.kind === 'wallpaper' || d.kind === 'flooring' ||
     d.kind === 'misc' || d.kind === 'artifact') return d.price || 0;
  return 0;
}
/* 当前价格（含季节系数与 ±15% 浮动） */
function priceOf(id){
  const b = basePrice(id);
  if(b <= 0) return 0;
  const f = (strHash(id + '@' + clock.day) * 2 - 1) * CONFIG.SHOP.PRICE_FLUCT;
  return Math.max(1, Math.round(b * seasonCoef() * (1 + f)));
}
/* 浮动标记：当前价 vs 基础价 × 季节系数 */
function priceTrend(id){
  const b = basePrice(id);
  if(b <= 0) return '=';
  const mid = b * seasonCoef();
  const p = priceOf(id);
  if(p > mid) return '↑';
  if(p < mid) return '↓';
  return '=';
}
/* 能不能卖：收获的作物、材料、鱼和采集物能卖（种子/工具不回收） */
function isSellable(id){
  const d = itemDef(id);
  if(!d) return false;
  return d.kind === 'crop' || d.kind === 'material' || d.kind === 'fish' ||
         d.kind === 'gather' || d.kind === 'animal' || d.kind === 'food' || d.kind === 'mineral' ||
         d.kind === 'weapon' || d.kind === 'ring' || d.kind === 'boots' ||
         d.kind === 'furniture' || d.kind === 'wallpaper' || d.kind === 'flooring' ||
         d.kind === 'misc' || d.kind === 'artifact';
}
/* 工具是否已经拥有（一次性商品） */
function toolOwned(id){
  const d = itemDef(id);
  if(!d || d.kind !== 'tool') return false;
  return countItem(id) > 0;
}
/* 金币变动 + 跳动动画（动画用 performance.now()，商店打开、时间冻结时照样跳） */
function changeGold(v){
  gold += v;
  if(v > 0) statsIncome(v);          /* 第 18 轮：累计 / 单日收入统计 + 成就检查 */
  goldDelta = v;
  goldPulseAt = performance.now();
  pulseShopGold();
  return gold;
}
/* 买：扣钱 → 给东西（工具优先进快捷栏空位，买完就能用）
 * priceOverride：旅行货车等特殊摊位按自己的价格结算，不传则用当日浮动价 */
function buyItem(id, priceOverride){
  if(id === 'can_upgrade') return upgradeCan();
  const d = itemDef(id);
  if(!d){ toast('商店不卖这个'); return false; }
  if(toolOwned(id)){ toast('已经有' + d.name + '了'); return false; }
  const price = (typeof priceOverride === 'number' && priceOverride > 0) ? priceOverride : priceOf(id);
  if(gold < price){ toast('金币不够（还差 ' + (price - gold) + '）'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  if(!canFit(id, 1)){ toast('背包满了，装不下' + d.name); return false; }
  changeGold(-price);
  giveItem(id, 1);
  const inHot = inv.findIndex(s => s && s.id === id) < CONFIG.INVENTORY.HOTBAR;
  toast('买下了' + d.name + '（-' + price + ' 💰）' +
        (inHot ? '' : '　快捷栏满了，放在背包里，拖到快捷栏就能用'));
  playSfx(880, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  refreshPackGrid();
  renderShop();
  return true;
}
/* 卖 n 个：先确认数量够，再从背包扣掉 → 加钱 */
function sellItem(id, n){
  const d = itemDef(id);
  if(!d || !isSellable(id)){ toast('这个不能卖'); return false; }
  if(n <= 0) return false;
  if(countItem(id) < n){ toast('数量不够'); return false; }
  const unit = priceOf(id);
  /* 老板娘「朋友」特权：每天额外收购 N 件作物（按 PRICE_MULT 计价） */
  let bonusN = 0;
  if(d.kind === 'crop'){
    const left = npcShopBonusLeft();
    if(left > 0){ bonusN = Math.min(n, left); npcState.bonusUsed += bonusN; }
  }
  const mult = bonusN > 0 ? CONFIG.NPC.SHOP_BONUS.PRICE_MULT : 1;
  const festMult = festivalSellMult(id);   /* 第 17 轮：秋·丰收节作物 ×1.5 */
  const total = Math.round((unit * (n - bonusN) + unit * bonusN * mult) * festMult);
  removeItem(id, n);
  changeGold(total);
  statsSell();                              /* 第 18 轮：卖出次数统计 + 成就 */
  toast('卖出 ' + d.name + ' ×' + n + '（+' + total + ' 💰' +
        (bonusN > 0 ? '，老板娘加购 ' + bonusN + ' 件 ×' + mult : '') +
        (festMult > 1 ? '，丰收节 ×' + festMult : '') + '）');
  playSfx(1046, 'triangle', 0.12, CONFIG.AUDIO.VOLUME);
  refreshPackGrid();
  renderShop();
  return true;
}
/* 水壶扩容：20 → 30 → 40 */
function upgradeCan(){
  if(canLevel >= CONFIG.SHOP.CAN_MAX_LEVEL){ toast('水壶已经是最大容量了'); return false; }
  const price = priceOf('can_upgrade');
  if(gold < price){ toast('金币不够（还差 ' + (price - gold) + '）'); playSfx(120,'sawtooth',0.10,CONFIG.AUDIO.VOLUME*0.6); return false; }
  changeGold(-price);
  canLevel++;
  canWater = canCapacity();
  toast('水壶升级了！容量 ' + canCapacity());
  playSfx(1174, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
  refreshPackGrid();
  renderShop();
  return true;
}
/* 玩家到商店摊的最近距离（格） */
/* 商店的距离：第 24 轮起，交易发生在店里的柜台上 */
function shopDist(){
  const c = townCounterSpot();
  if(!c) return Infinity;
  const dx = (c.x + 0.5)*TILE - player.x, dy = (c.y + 0.5)*TILE - player.y;
  return Math.hypot(dx, dy) / TILE;
}
/* 是否站在柜台的交互范围内（必须人在店里） */
function nearShop(){
  const b = townShopBuilding();
  if(!b || playerRoom() !== b.id) return false;
  return shopDist() <= CONFIG.SHOP.RANGE;
}
/* 店主在不在柜台前（不在 → 没有加购，牌子也会写清楚） */
function townOwnerPresent(h){
  const b = townShopBuilding();
  if(!b) return false;
  const d = npcDef(b.npc);
  if(!d) return false;
  const st = npcCurrentState(d, clock.day, h);     /* 第 25 轮：店主必须在「上班」状态 */
  return !!(st && st.type === 'work' && st.at === 'shop');
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { strHash, seasonCoef, basePrice, priceOf, priceTrend, isSellable, toolOwned, changeGold, buyItem, sellItem, upgradeCan, shopDist, nearShop, townOwnerPresent });
export { strHash, seasonCoef, basePrice, priceOf, priceTrend, isSellable, toolOwned, changeGold, buyItem, sellItem, upgradeCan, shopDist, nearShop, townOwnerPresent };
