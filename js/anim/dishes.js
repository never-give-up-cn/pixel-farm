/* 星露谷料理图鉴：81 道菜（1.6）。
 * 图标画在 32×32 格子里，按盘/碗/派/蛋糕/曲奇/面包/披萨/卷饼/杯/寿司/鱼/蛋等形态绘制。 */

import { R, line, ellipse } from './pixel.js';

export const DISH_W = 32;
export const DISH_H = 32;

export const DISH_CATS = [
  { id: 'all', name: '全部' },
  { id: 'soup', name: '汤' },
  { id: 'salad', name: '沙拉' },
  { id: 'fish', name: '鱼' },
  { id: 'breakfast', name: '早餐' },
  { id: 'dessert', name: '甜点' },
  { id: 'main', name: '主食' },
  { id: 'drink', name: '饮料' }
];

const PALETTES = {
  red:    ['#d04a3a', '#8a2a1a', '#f08a70'],
  orange: ['#e08a3a', '#a05a1a', '#f0c080'],
  yellow: ['#e0c040', '#a08020', '#fff0a0'],
  green:  ['#5aa04a', '#3a6a2a', '#a0d080'],
  teal:   ['#4ac0a0', '#2a8060', '#a0f0d0'],
  blue:   ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  purple: ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  pink:   ['#d06a9a', '#8a3a6a', '#f0a0c0'],
  brown:  ['#8a5a3a', '#5a3418', '#c09060'],
  cream:  ['#e0d0a0', '#b09a60', '#fff0c0'],
  white:  ['#e0e0e0', '#a0a0a0', '#ffffff'],
  gray:   ['#6a6a6a', '#3a3a3a', '#a0a0a0']
};

/* [id, 中文名, 英文名, 分类, 形态, 配色] */
const RAW = [
  ['algae_soup','海藻汤','Algae Soup','soup','bowl','green'],
  ['artichoke_dip','洋蓟蘸酱','Artichoke Dip','main','plate','green'],
  ['autumn_bounty','秋日恩赐','Autumn\'s Bounty','main','plate','orange'],
  ['baked_fish','烤鱼','Baked Fish','fish','fish','orange'],
  ['banana_pudding','香蕉布丁','Banana Pudding','dessert','bowl','yellow'],
  ['bean_hotpot','豆类火锅','Bean Hotpot','soup','bowl','brown'],
  ['blackberry_cobbler','黑莓馅饼','Blackberry Cobbler','dessert','pie','purple'],
  ['blueberry_tart','蓝莓挞','Blueberry Tart','dessert','pie','blue'],
  ['bread','面包','Bread','main','bread','brown'],
  ['bruschetta','意式烤面包','Bruschetta','main','bread','red'],
  ['carp_surprise','鲤鱼惊喜','Carp Surprise','fish','plate','orange'],
  ['cheese_cauliflower','奶酪花椰菜','Cheese Cauliflower','main','plate','cream'],
  ['chocolate_cake','巧克力蛋糕','Chocolate Cake','dessert','cake','brown'],
  ['chowder','海鲜杂烩汤','Chowder','soup','bowl','cream'],
  ['coleslaw','凉拌卷心菜','Coleslaw','salad','plate','green'],
  ['complete_breakfast','完整早餐','Complete Breakfast','breakfast','plate','yellow'],
  ['cookies','曲奇','Cookies','dessert','cookie','brown'],
  ['crab_cakes','蟹黄糕','Crab Cakes','fish','plate','orange'],
  ['cranberry_sauce','蔓越莓酱','Cranberry Sauce','main','plate','red'],
  ['cranberry_candy','蔓越莓糖果','Cranberry Candy','dessert','cookie','red'],
  ['crispy_bass','香脆鲈鱼','Crispy Bass','fish','fish','orange'],
  ['dish_o_the_sea','海之菜肴','Dish O\' The Sea','fish','plate','blue'],
  ['eggplant_parmesan','茄子帕尔马','Eggplant Parmesan','main','plate','purple'],
  ['escargot','法式蜗牛','Escargot','main','plate','brown'],
  ['farmers_lunch','农夫午餐','Farmer\'s Lunch','main','plate','yellow'],
  ['fiddlehead_risotto','蕨菜烩饭','Fiddlehead Risotto','soup','bowl','green'],
  ['fish_stew','鱼汤','Fish Stew','soup','bowl','orange'],
  ['fish_taco','鱼肉卷','Fish Taco','fish','taco','yellow'],
  ['fried_calamari','炸鱿鱼','Fried Calamari','fish','plate','cream'],
  ['fried_eel','炸鳗鱼','Fried Eel','fish','plate','brown'],
  ['fried_egg','煎蛋','Fried Egg','breakfast','egg','yellow'],
  ['fried_mushroom','炸蘑菇','Fried Mushroom','main','plate','brown'],
  ['fruit_salad','水果沙拉','Fruit Salad','salad','plate','red'],
  ['ginger_ale','姜汁汽水','Ginger Ale','drink','glass','orange'],
  ['glazed_yams','蜜汁山药','Glazed Yams','main','plate','orange'],
  ['hashbrowns','薯饼','Hashbrowns','breakfast','plate','yellow'],
  ['ice_cream','冰淇淋','Ice Cream','dessert','glass','white'],
  ['lobster_bisque','龙虾浓汤','Lobster Bisque','soup','bowl','orange'],
  ['lucky_lunch','幸运午餐','Lucky Lunch','main','plate','green'],
  ['maki_roll','寿司卷','Maki Roll','fish','roll','white'],
  ['mango_sticky_rice','芒果糯米饭','Mango Sticky Rice','dessert','plate','yellow'],
  ['maple_bar','枫糖棒','Maple Bar','dessert','bread','brown'],
  ['miners_treat','矿工特供','Miner\'s Treat','dessert','cookie','brown'],
  ['moss_soup','苔藓汤','Moss Soup','soup','bowl','green'],
  ['omelet','煎蛋卷','Omelet','breakfast','egg','yellow'],
  ['pale_broth','清汤','Pale Broth','soup','bowl','cream'],
  ['pancakes','煎饼','Pancakes','breakfast','plate','yellow'],
  ['parsnip_soup','防风草汤','Parsnip Soup','soup','bowl','cream'],
  ['pepper_poppers','辣椒爆浆','Pepper Poppers','main','plate','red'],
  ['pink_cake','粉色蛋糕','Pink Cake','dessert','cake','pink'],
  ['pizza','披萨','Pizza','main','pizza','red'],
  ['plum_pudding','李子布丁','Plum Pudding','dessert','cake','purple'],
  ['poi','芋泥','Poi','main','bowl','purple'],
  ['poppyseed_muffin','罂粟籽松饼','Poppyseed Muffin','dessert','cake','brown'],
  ['pumpkin_pie','南瓜派','Pumpkin Pie','dessert','pie','orange'],
  ['pumpkin_soup','南瓜汤','Pumpkin Soup','soup','bowl','orange'],
  ['radish_salad','萝卜沙拉','Radish Salad','salad','plate','red'],
  ['red_plate','红色拼盘','Red Plate','main','plate','red'],
  ['rhubarb_pie','大黄派','Rhubarb Pie','dessert','pie','red'],
  ['rice_pudding','大米布丁','Rice Pudding','dessert','bowl','cream'],
  ['roasted_hazelnuts','烤榛子','Roasted Hazelnuts','main','plate','brown'],
  ['roots_platter','根菜拼盘','Roots Platter','main','plate','brown'],
  ['salad','沙拉','Salad','salad','plate','green'],
  ['salmon_dinner','鲑鱼晚餐','Salmon Dinner','fish','plate','pink'],
  ['sashimi','刺身','Sashimi','fish','roll','pink'],
  ['seafoam_pudding','海沫布丁','Seafoam Pudding','fish','bowl','teal'],
  ['shrimp_cocktail','虾鸡尾酒','Shrimp Cocktail','fish','glass','red'],
  ['spaghetti','意大利面','Spaghetti','main','plate','red'],
  ['spicy_eel','香辣鳗鱼','Spicy Eel','fish','plate','red'],
  ['squid_ink_ravioli','墨汁饺','Squid Ink Ravioli','fish','plate','gray'],
  ['stir_fry','炒菜','Stir Fry','main','plate','green'],
  ['strange_bun','奇怪小包','Strange Bun','main','bread','purple'],
  ['stuffing','填料','Stuffing','main','plate','brown'],
  ['super_meal','超级大餐','Super Meal','main','plate','orange'],
  ['survival_burger','生存汉堡','Survival Burger','main','bread','brown'],
  ['tom_kha_soup','冬阴功汤','Tom Kha Soup','soup','bowl','orange'],
  ['tortilla','玉米饼','Tortilla','main','taco','yellow'],
  ['triple_shot_espresso','三倍浓缩咖啡','Triple Shot Espresso','drink','glass','brown'],
  ['tropical_curry','热带咖喱','Tropical Curry','fish','bowl','yellow'],
  ['trout_soup','鳟鱼汤','Trout Soup','soup','bowl','cream'],
  ['vegetable_stew','蔬菜炖汤','Vegetable Stew','soup','bowl','brown']
];

export const DISHES = RAW.map(([id, name, en, cat, shape, pal]) => ({
  id, name, en, cat, shape,
  c1: PALETTES[pal][0], c2: PALETTES[pal][1], c3: PALETTES[pal][2]
}));

export const DISH_MAP = Object.fromEntries(DISHES.map(d => [d.id, d]));

export function dishCatName(cat) {
  const c = DISH_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

/* ---------------- 绘制 ---------------- */

function variantOf(d, n) {
  let h = 0;
  for (let i = 0; i < d.id.length; i++) h = (h * 31 + d.id.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

function plate(g, d, x, y) {
  const v = variantOf(d, 3);
  ellipse(g, x, y + 5, 10, 3, '#e8e0d0');
  ellipse(g, x, y + 5, 8, 2, '#c0b8a8');
  if (v === 1) {
    /* 两块主菜 + 配菜 */
    ellipse(g, x - 3, y, 4, 3, d.c1);
    ellipse(g, x + 3, y + 1, 4, 2, d.c1);
    R(g, x - 3, y - 2, 3, 1, d.c3);
    R(g, x + 2, y - 1, 2, 1, d.c3);
    R(g, x - 1, y + 3, 2, 1, '#5aa04a');
    R(g, x + 4, y + 3, 1, 1, '#5aa04a');
    line(g, x - 8, y - 2, x - 8, y + 4, '#d8d0c0', 1);
    line(g, x + 8, y - 2, x + 8, y + 4, '#d8d0c0', 1);
  } else if (v === 2) {
    /* 长条主菜 */
    R(g, x - 6, y - 2, 12, 4, d.c1);
    R(g, x - 5, y - 2, 10, 1, d.c3);
    R(g, x - 4, y + 1, 8, 1, d.c2);
    R(g, x - 2, y - 4, 4, 2, d.c2);
    R(g, x + 4, y - 3, 2, 1, '#5aa04a');
    R(g, x - 6, y - 3, 2, 1, '#5aa04a');
  } else {
    ellipse(g, x, y, 7, 4, d.c1);
    ellipse(g, x - 1, y - 1, 5, 2, d.c2);
    R(g, x - 2, y - 2, 2, 1, d.c3);
    R(g, x + 2, y + 1, 2, 1, d.c3);
    R(g, x - 5, y - 5, 1, 2, '#f0f0e0');
    R(g, x + 3, y - 6, 1, 2, '#f0f0e0');
  }
}

function bowl(g, d, x, y) {
  const v = variantOf(d, 3);
  ellipse(g, x, y + 5, 9, 3, '#c0b8a8');
  R(g, x - 8, y - 2, 16, 7, '#a09080');
  ellipse(g, x, y - 2, 8, 4, d.c1);
  if (v === 1) {
    /* 面条 */
    for (let i = -3; i <= 3; i++) {
      line(g, x + i * 2, y - 3, x + i * 2 + 1, y + 1, d.c3, 1);
    }
    R(g, x - 2, y - 3, 4, 1, d.c2);
  } else if (v === 2) {
    /* 块状炖菜 */
    R(g, x - 4, y - 3, 3, 3, d.c2);
    R(g, x + 1, y - 2, 3, 2, d.c3);
    R(g, x - 1, y + 1, 2, 1, d.c2);
    R(g, x + 4, y - 1, 1, 1, d.c3);
    R(g, x - 5, y, 1, 1, d.c3);
  } else {
    ellipse(g, x - 1, y - 3, 6, 2, d.c3);
    R(g, x - 3, y - 2, 2, 2, d.c2);
    R(g, x + 2, y - 1, 1, 1, d.c2);
  }
  R(g, x - 8, y - 2, 16, 1, '#e0d8c8');
  R(g, x - 5, y + 5, 10, 1, '#6a5a4a');
  line(g, x + 8, y - 5, x + 11, y + 2, '#d8d0c0', 1);
  ellipse(g, x + 8, y - 6, 1, 1, '#d8d0c0');
}

function pie(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 整个小馅饼 */
    ellipse(g, x, y + 2, 9, 4, '#d8b070');
    ellipse(g, x, y, 8, 3, d.c1);
    for (let i = -1; i <= 1; i++) line(g, x + i * 4, y - 2, x + i * 4 + 3, y + 2, d.c3, 1);
    R(g, x - 2, y - 3, 2, 1, d.c3);
    return;
  }
  for (let i = 0; i < 8; i++) {
    R(g, x - 8 + i, y + 2 - i, 16 - i * 2, 1, i < 2 ? '#d8b070' : d.c1);
  }
  R(g, x - 8, y + 2, 16, 2, '#a07030');
  R(g, x - 6, y, 2, 1, d.c3);
  R(g, x + 3, y - 2, 2, 2, d.c2);
  R(g, x - 2, y - 1, 1, 1, d.c3);
  R(g, x - 1, y + 4, 3, 1, '#6a4a20');
  if (v === 2) {
    R(g, x + 5, y - 7, 1, 2, '#f0f0e0');
    R(g, x + 2, y - 9, 1, 2, '#f0f0e0');
  }
}

function cake(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 纸杯蛋糕 */
    R(g, x - 5, y, 10, 7, '#c08050');
    R(g, x - 5, y, 10, 1, '#e0a870');
    ellipse(g, x, y - 2, 6, 3, d.c1);
    ellipse(g, x, y - 4, 4, 2, d.c3);
    R(g, x - 1, y - 6, 2, 2, '#d04a3a');
    return;
  }
  if (v === 2) {
    /* 方形千层 */
    R(g, x - 7, y - 1, 14, 3, '#f0e0c0');
    R(g, x - 7, y - 4, 14, 3, d.c1);
    R(g, x - 7, y + 2, 14, 2, d.c2);
    R(g, x - 6, y - 3, 12, 1, d.c3);
    R(g, x - 1, y - 6, 2, 2, '#d04a3a');
    return;
  }
  R(g, x - 7, y + 1, 14, 4, '#f0e0c0');
  R(g, x - 7, y - 2, 14, 3, d.c1);
  R(g, x - 7, y - 4, 14, 2, d.c3);
  R(g, x - 7, y + 5, 14, 2, '#d8c0a0');
  R(g, x - 6, y - 1, 12, 1, d.c2);
  R(g, x - 1, y - 6, 2, 2, '#d04a3a');
  R(g, x - 5, y + 4, 2, 1, d.c2);
}

function cookie(g, d, x, y) {
  const v = variantOf(d, 3);
  ellipse(g, x, y, 6, 5, d.c2);
  ellipse(g, x, y, 5, 4, d.c1);
  if (v === 1) {
    for (let i = 0; i < 6; i++) R(g, x - 4 + (i % 3) * 4, y - 2 + Math.floor(i / 3) * 4, 1, 1, d.c3);
  } else if (v === 2) {
    R(g, x - 5, y, 10, 2, '#f0e0c0');
    R(g, x - 3, y - 1, 1, 1, d.c3);
    R(g, x + 2, y + 1, 1, 1, d.c3);
  } else {
    R(g, x - 3, y - 2, 2, 1, d.c3);
    R(g, x + 2, y + 1, 1, 1, d.c3);
    R(g, x - 1, y + 2, 1, 1, d.c3);
    R(g, x + 3, y - 2, 1, 1, d.c3);
  }
}

function bread(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 汉堡 */
    ellipse(g, x, y - 3, 8, 3, '#d8a050');
    R(g, x - 7, y - 1, 14, 2, '#5aa04a');
    R(g, x - 7, y + 1, 14, 2, '#7a4a2a');
    ellipse(g, x, y + 4, 8, 2, '#d8a050');
    R(g, x - 4, y - 5, 1, 1, '#fff0c0');
    R(g, x + 2, y - 4, 1, 1, '#fff0c0');
    return;
  }
  if (v === 2) {
    /* 长条糖棒 */
    R(g, x - 8, y - 2, 16, 5, d.c2);
    R(g, x - 7, y - 1, 14, 3, d.c1);
    for (let i = 0; i < 3; i++) line(g, x - 5 + i * 5, y - 1, x - 3 + i * 5, y + 1, d.c3, 1);
    return;
  }
  ellipse(g, x, y, 8, 5, d.c2);
  ellipse(g, x, y - 1, 7, 4, d.c1);
  for (let i = 0; i < 3; i++) R(g, x - 4 + i * 4, y - 4, 2, 1, d.c3);
  R(g, x - 5, y + 3, 10, 1, d.c2);
  R(g, x - 2, y - 2, 2, 1, d.c3);
}

function pizza(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 整个小披萨 */
    ellipse(g, x, y, 8, 6, '#d8a050');
    ellipse(g, x, y, 7, 5, d.c1);
    R(g, x - 3, y - 2, 2, 2, '#d04a3a');
    R(g, x + 2, y, 2, 2, '#d04a3a');
    R(g, x - 1, y + 2, 2, 1, '#d04a3a');
    R(g, x - 4, y + 2, 1, 1, '#5aa04a');
    return;
  }
  if (v === 2) {
    /* 方形深盘 */
    R(g, x - 7, y - 4, 14, 9, '#d8a050');
    R(g, x - 6, y - 3, 12, 7, d.c1);
    for (let i = 0; i < 3; i++) R(g, x - 4 + i * 4, y - 1, 2, 2, '#d04a3a');
    return;
  }
  for (let i = 0; i < 8; i++) {
    R(g, x - 8 + i, y - 5 + i, 16 - i * 2, 1, i < 2 ? '#e8c080' : d.c1);
  }
  R(g, x - 8, y + 3, 16, 2, '#a06030');
  R(g, x - 5, y - 2, 2, 2, '#d04a3a');
  R(g, x + 2, y, 2, 2, '#d04a3a');
  R(g, x - 1, y + 2, 1, 1, '#e0c040');
}

function taco(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 平铺玉米饼 */
    ellipse(g, x, y, 8, 6, '#e8c060');
    ellipse(g, x, y, 6, 4, d.c1);
    R(g, x - 3, y - 1, 2, 2, d.c3);
    R(g, x + 2, y, 2, 1, d.c3);
    R(g, x - 1, y + 2, 2, 1, '#5aa04a');
    return;
  }
  if (v === 2) {
    /* 卷饼 */
    R(g, x - 3, y - 5, 7, 11, '#e8c060');
    R(g, x - 2, y - 4, 4, 8, d.c1);
    R(g, x - 2, y - 4, 3, 1, d.c3);
    R(g, x + 2, y + 2, 3, 2, '#5aa04a');
    return;
  }
  for (let i = 0; i < 7; i++) {
    R(g, x - 8 + i, y - 4 + i, 16 - i * 2, 1, i < 2 ? '#e8c060' : d.c1);
  }
  R(g, x - 7, y + 3, 14, 2, '#a06a30');
  R(g, x - 5, y - 1, 2, 2, d.c3);
  R(g, x + 2, y, 2, 2, d.c3);
  R(g, x - 2, y + 2, 3, 1, '#5a9a3a');
}

function glass(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 马克杯 */
    R(g, x - 5, y - 5, 10, 11, '#e8f0f0');
    R(g, x - 4, y - 4, 8, 8, d.c1);
    R(g, x - 4, y - 4, 8, 2, d.c3);
    R(g, x + 5, y - 3, 2, 5, '#d0d8d8');
    R(g, x - 5, y - 6, 10, 1, '#ffffff');
    return;
  }
  if (v === 2) {
    /* 鸡尾酒杯 */
    line(g, x, y + 6, x, y + 2, '#d8e0e0', 1);
    for (let i = 0; i < 5; i++) R(g, x - 5 + i, y - 5 + i, 10 - i * 2, 1, '#e8f0f0');
    R(g, x - 4, y - 3, 8, 2, d.c1);
    R(g, x - 2, y - 4, 2, 1, d.c3);
    line(g, x + 1, y - 8, x + 3, y - 3, '#e0c060', 1);
    return;
  }
  R(g, x - 4, y - 6, 8, 12, '#e8f0f0');
  R(g, x - 3, y - 4, 6, 8, d.c1);
  R(g, x - 3, y - 4, 6, 2, d.c3);
  R(g, x + 4, y - 3, 2, 5, '#d0d8d8');
  R(g, x - 4, y - 7, 8, 1, '#ffffff');
  R(g, x - 4, y + 6, 8, 1, '#a0a8a8');
  line(g, x + 1, y - 10, x + 3, y - 5, '#e0c060', 1);
}

function roll(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 刺身 */
    for (let i = 0; i < 3; i++) {
      ellipse(g, x - 5 + i * 5, y + 1, 3, 2, d.c1);
      R(g, x - 6 + i * 5, y, 3, 1, d.c3);
    }
    R(g, x - 4, y + 4, 8, 1, '#e0e0e0');
    return;
  }
  if (v === 2) {
    for (let i = 0; i < 2; i++) {
      const px = x - 5 + i * 10;
      R(g, px - 4, y - 4, 8, 8, '#f0f0e0');
      R(g, px - 4, y - 4, 8, 1, '#2a2a2a');
      R(g, px - 3, y - 2, 6, 3, d.c1);
      R(g, px - 2, y - 1, 3, 1, d.c2);
    }
    return;
  }
  for (let i = 0; i < 3; i++) {
    const px = x - 7 + i * 7;
    R(g, px - 3, y - 3, 6, 6, '#f0f0e0');
    R(g, px - 3, y - 3, 6, 1, '#2a2a2a');
    R(g, px - 2, y - 1, 4, 2, d.c1);
    R(g, px - 1, y - 2, 2, 1, d.c2);
  }
}

function fish(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 鱼排 */
    ellipse(g, x, y + 4, 10, 2, '#d8d0c0');
    ellipse(g, x, y, 8, 4, d.c1);
    R(g, x - 5, y - 2, 8, 1, d.c3);
    R(g, x + 3, y - 2, 2, 2, '#f0d060');
    R(g, x - 3, y + 2, 2, 1, d.c2);
    return;
  }
  if (v === 2) {
    /* 烤鱼串 */
    line(g, x - 8, y + 5, x + 8, y - 5, '#a06a3a', 1);
    for (let i = 0; i < 3; i++) {
      ellipse(g, x - 5 + i * 5, y + 2 - i * 2, 3, 2, d.c1);
      R(g, x - 6 + i * 5, y + 1 - i * 2, 2, 1, d.c3);
    }
    return;
  }
  ellipse(g, x, y + 4, 10, 2, '#d8d0c0');
  ellipse(g, x, y, 7, 4, d.c1);
  line(g, x - 7, y, x - 10, y - 3, d.c2, 2);
  line(g, x - 7, y, x - 10, y + 3, d.c2, 2);
  R(g, x + 3, y - 2, 2, 2, '#ffffff');
  R(g, x + 4, y - 2, 1, 1, '#1a1a1a');
  R(g, x - 3, y - 1, 2, 1, d.c3);
  R(g, x + 1, y + 1, 2, 1, d.c2);
}

function egg(g, d, x, y) {
  const v = variantOf(d, 3);
  if (v === 1) {
    /* 煎蛋卷 */
    ellipse(g, x, y, 8, 4, d.c1);
    R(g, x - 6, y, 12, 2, d.c2);
    R(g, x - 4, y - 2, 2, 1, d.c3);
    R(g, x + 2, y + 1, 1, 1, d.c3);
    return;
  }
  if (v === 2) {
    /* 炒蛋 */
    ellipse(g, x, y, 9, 5, d.c2);
    R(g, x - 6, y - 2, 4, 3, d.c1);
    R(g, x, y - 3, 5, 3, d.c1);
    R(g, x - 3, y + 1, 6, 2, d.c3);
    return;
  }
  ellipse(g, x, y + 1, 9, 6, '#f0ead8');
  ellipse(g, x + 1, y, 9, 5, '#fff8e8');
  ellipse(g, x, y, 4, 3, d.c1);
  R(g, x - 1, y - 1, 2, 1, d.c3);
  R(g, x - 6, y + 4, 2, 1, '#d0c8a8');
}

export function drawDish(g, dish, phase = 0.25) {
  const d = typeof dish === 'string' ? DISH_MAP[dish] : dish;
  if (!d) return;
  g.save();
  g.imageSmoothingEnabled = false;
  const x = 16, y = 17;
  if (d.shape === 'bowl') bowl(g, d, x, y);
  else if (d.shape === 'pie') pie(g, d, x, y);
  else if (d.shape === 'cake') cake(g, d, x, y);
  else if (d.shape === 'cookie') cookie(g, d, x, y);
  else if (d.shape === 'bread') bread(g, d, x, y);
  else if (d.shape === 'pizza') pizza(g, d, x, y);
  else if (d.shape === 'taco') taco(g, d, x, y);
  else if (d.shape === 'glass') glass(g, d, x, y);
  else if (d.shape === 'roll') roll(g, d, x, y);
  else if (d.shape === 'fish') fish(g, d, x, y);
  else if (d.shape === 'egg') egg(g, d, x, y);
  else plate(g, d, x, y);

  /* 按菜名哈希加一点配菜/装饰，避免同形态同配色的菜完全一样 */
  let h = 0;
  for (let i = 0; i < d.id.length; i++) h = (h * 31 + d.id.charCodeAt(i)) | 0;
  h = Math.abs(h);
  const garnish = ['#5aa04a', '#d04a3a', '#e0c040', '#f0f0e0', '#8a5a3a', '#6ac0f0', '#d06a9a', '#a0e060'][h % 8];
  const gx = 21 + (h % 4);
  const gy = 20 + (Math.floor(h / 4) % 4);
  R(g, gx, gy, 2, 1, garnish);
  R(g, gx + 1, gy - 1, 1, 1, '#fff8e0');

  g.restore();
}
