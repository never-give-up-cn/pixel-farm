/* 星露谷食谱卡：81 道料理的配料与增益。
 * 复用 dishes.js 的料理图标，加上配方卡数据。 */

import { DISHES, DISH_MAP, drawDish } from './dishes.js';

/* [料理 id, 配料数组, 增益] */
const RAW = [
  ['algae_soup',['绿藻 ×4'],'无'],
  ['artichoke_dip',['洋蓟 ×1','牛奶 ×1'],'最大能量 +30'],
  ['autumn_bounty',['山药 ×1','南瓜 ×1'],'耕种 +2'],
  ['baked_fish',['太阳鱼 ×1','小麦粉 ×1'],'钓鱼 +3'],
  ['banana_pudding',['香蕉 ×1','牛奶 ×1','糖 ×1'],'防御 +2'],
  ['bean_hotpot',['青豆 ×2'],'最大能量 +30'],
  ['blackberry_cobbler',['黑莓 ×2','小麦粉 ×1','糖 ×1'],'耕种 +2'],
  ['blueberry_tart',['蓝莓 ×1','小麦粉 ×1','糖 ×1'],'耕种 +2'],
  ['bread',['小麦粉 ×1'],'无'],
  ['bruschetta',['面包 ×1','油 ×1','番茄 ×1'],'耕种 +2'],
  ['carp_surprise',['鲤鱼 ×4'],'钓鱼 +2'],
  ['cheese_cauliflower',['花椰菜 ×1','奶酪 ×1'],'耕种 +2'],
  ['chocolate_cake',['小麦粉 ×1','糖 ×1','鸡蛋 ×1','榛子 ×1'],'无'],
  ['chowder',['蛤蜊 ×1','牛奶 ×1'],'钓鱼 +1'],
  ['coleslaw',['红甘蓝 ×1','醋 ×1','蛋黄酱 ×1'],'防御 +1'],
  ['complete_breakfast',['煎蛋 ×1','牛奶 ×1','薯饼 ×1','面包 ×1'],'耕种 +2'],
  ['cookies',['小麦粉 ×1','糖 ×1','鸡蛋 ×1'],'无'],
  ['crab_cakes',['螃蟹 ×1','小麦粉 ×1','鸡蛋 ×1','油 ×1'],'速度 +1'],
  ['cranberry_sauce',['蔓越莓 ×1','糖 ×1'],'最大能量 +40'],
  ['cranberry_candy',['蔓越莓 ×1','糖 ×1'],'最大能量 +50'],
  ['crispy_bass',['大口黑鲈 ×1','小麦粉 ×1','油 ×1'],'钓鱼 +2'],
  ['dish_o_the_sea',['沙丁鱼 ×2','玉米 ×1'],'钓鱼 +3'],
  ['eggplant_parmesan',['茄子 ×2','番茄 ×1'],'耕种 +2'],
  ['escargot',['蜗牛 ×1','大蒜 ×1','黄油 ×1'],'钓鱼 +2'],
  ['farmers_lunch',['煎蛋 ×1','防风草 ×1','奶酪 ×1'],'耕种 +2'],
  ['fiddlehead_risotto',['蕨菜 ×1','油 ×1','大蒜 ×1'],'最大能量 +60'],
  ['fish_stew',['鱼 ×1','番茄 ×1','洋葱 ×1'],'钓鱼 +2'],
  ['fish_taco',['鱼 ×1','玉米饼 ×1','红甘蓝 ×1','蛋黄酱 ×1'],'钓鱼 +2'],
  ['fried_calamari',['鱿鱼 ×1','小麦粉 ×1','油 ×1'],'钓鱼 +1'],
  ['fried_eel',['鳗鱼 ×1','油 ×1'],'钓鱼 +1'],
  ['fried_egg',['鸡蛋 ×1'],'无'],
  ['fried_mushroom',['普通蘑菇 ×1','小麦粉 ×1','油 ×1'],'攻击 +2'],
  ['fruit_salad',['蓝莓 ×1','甜瓜 ×1','杏子 ×1'],'最大能量 +40'],
  ['ginger_ale',['姜 ×1','糖 ×1'],'速度 +1'],
  ['glazed_yams',['山药 ×1','糖 ×1'],'耕种 +2'],
  ['hashbrowns',['土豆 ×1','油 ×1'],'耕种 +2'],
  ['ice_cream',['牛奶 ×1','糖 ×1'],'无'],
  ['lobster_bisque',['龙虾 ×1','牛奶 ×1'],'钓鱼 +2'],
  ['lucky_lunch',['海参 ×1','玉米饼 ×1','蓝莓 ×1'],'幸运 +3'],
  ['maki_roll',['鱼 ×1','海草 ×1','大米 ×1'],'钓鱼 +1'],
  ['mango_sticky_rice',['芒果 ×1','大米 ×1','椰子 ×1'],'防御 +2'],
  ['maple_bar',['枫糖浆 ×1','小麦粉 ×1','糖 ×1'],'耕种 +2'],
  ['miners_treat',['胡萝卜 ×1','糖 ×1','牛奶 ×1'],'采矿 +2'],
  ['moss_soup',['苔藓 ×1','绿藻 ×1'],'最大能量 +40'],
  ['omelet',['鸡蛋 ×2','牛奶 ×1'],'最大能量 +40'],
  ['pale_broth',['白藻 ×1','大蒜 ×1'],'最大能量 +30'],
  ['pancakes',['小麦粉 ×1','鸡蛋 ×1','牛奶 ×1'],'耕种 +2'],
  ['parsnip_soup',['防风草 ×1','牛奶 ×1','醋 ×1'],'耕种 +2'],
  ['pepper_poppers',['辣椒 ×1','奶酪 ×1'],'速度 +1'],
  ['pink_cake',['小麦粉 ×1','糖 ×1','鸡蛋 ×1','甜瓜 ×1'],'最大能量 +50'],
  ['pizza',['小麦粉 ×1','番茄 ×1','奶酪 ×1'],'耕种 +2'],
  ['plum_pudding',['李子 ×1','小麦粉 ×1','糖 ×1'],'最大能量 +40'],
  ['poi',['芋头 ×1'],'最大能量 +30'],
  ['poppyseed_muffin',['罂粟籽 ×1','小麦粉 ×1','糖 ×1'],'耕种 +2'],
  ['pumpkin_pie',['南瓜 ×1','小麦粉 ×1','糖 ×1'],'耕种 +2'],
  ['pumpkin_soup',['南瓜 ×1','牛奶 ×1'],'耕种 +2'],
  ['radish_salad',['萝卜 ×1','醋 ×1','油 ×1'],'防御 +2'],
  ['red_plate',['萝卜 ×1','红甘蓝 ×1'],'最大能量 +40'],
  ['rhubarb_pie',['大黄 ×1','小麦粉 ×1','糖 ×1'],'耕种 +2'],
  ['rice_pudding',['大米 ×1','牛奶 ×1','糖 ×1'],'最大能量 +40'],
  ['roasted_hazelnuts',['榛子 ×3'],'攻击 +2'],
  ['roots_platter',['洞穴萝卜 ×1','冬根 ×1'],'攻击 +2'],
  ['salad',['韭葱 ×1','蒲公英 ×1','醋 ×1'],'防御 +1'],
  ['salmon_dinner',['鲑鱼 ×1','花椰菜 ×1','土豆 ×1'],'钓鱼 +2'],
  ['sashimi',['鱼 ×1'],'钓鱼 +1'],
  ['seafoam_pudding',['蛤蜊 ×1','海草 ×1','糖 ×1'],'钓鱼 +3'],
  ['shrimp_cocktail',['虾 ×1','番茄 ×1'],'钓鱼 +1'],
  ['spaghetti',['小麦粉 ×1','番茄 ×1'],'耕种 +2'],
  ['spicy_eel',['鳗鱼 ×1','辣椒 ×1'],'幸运 +1 / 速度 +1'],
  ['squid_ink_ravioli',['鱿鱼墨汁 ×1','小麦粉 ×1','番茄 ×1'],'防御 +3'],
  ['stir_fry',['花椰菜 ×1','胡萝卜 ×1'],'耕种 +2'],
  ['strange_bun',['小麦粉 ×1','虚空蛋 ×1'],'速度 +1'],
  ['stuffing',['面包 ×1','蔓越莓 ×1'],'防御 +2'],
  ['super_meal',['花椰菜 ×1','蔓越莓 ×1','榛子 ×1'],'最大能量 +60'],
  ['survival_burger',['面包 ×1','洞穴萝卜 ×1','茄子 ×1'],'耕种 +2'],
  ['tom_kha_soup',['椰子 ×1','虾 ×1','蘑菇 ×1'],'钓鱼 +2'],
  ['tortilla',['玉米 ×1'],'耕种 +1'],
  ['triple_shot_espresso',['咖啡 ×3'],'速度 +1'],
  ['tropical_curry',['椰子 ×1','菠萝 ×1','辣椒 ×1'],'钓鱼 +2'],
  ['trout_soup',['鳟鱼 ×1','绿藻 ×1'],'钓鱼 +1'],
  ['vegetable_stew',['番茄 ×1','胡萝卜 ×1','土豆 ×1'],'耕种 +2']
];

export const RECIPES = RAW.map(([dish, ingredients, buff]) => {
  const d = DISH_MAP[dish];
  return {
    id: dish,
    dish,
    name: d ? d.name : dish,
    en: d ? d.en : dish,
    cat: d ? d.cat : 'main',
    ingredients,
    buff
  };
});
export const RECIPE_MAP = Object.fromEntries(RECIPES.map(r => [r.id, r]));

export const RECIPE_CATS = [
  { id: 'all', name: '全部' },
  { id: 'soup', name: '汤' },
  { id: 'salad', name: '沙拉' },
  { id: 'fish', name: '鱼' },
  { id: 'breakfast', name: '早餐' },
  { id: 'dessert', name: '甜点' },
  { id: 'main', name: '主食' },
  { id: 'drink', name: '饮料' }
];

export function recipeCatName(cat) {
  const c = RECIPE_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

export { DISHES, DISH_MAP, drawDish };
