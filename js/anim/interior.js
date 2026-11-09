/* 星露谷室内图鉴：96 件家具 + 32 种墙纸 + 24 种地板。
 * 家具画在 40×40 格子里，墙纸/地板为 32×32 可平铺贴图。
 * 家具、墙纸、地板可以组合成房间预览。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const FURN_W = 40;
export const FURN_H = 40;
export const TILE_W = 32;
export const TILE_H = 32;

export const INTERIOR_CATS = [
  { id: 'all', name: '全部' },
  { id: 'furniture', name: '家具' },
  { id: 'wallpaper', name: '墙纸' },
  { id: 'floor', name: '地板' }
];

const C = {
  wood:     ['#b07a3a', '#6a4a2a', '#e0b070'],
  birch:    ['#d8c090', '#a08050', '#f0e0b0'],
  walnut:   ['#8a5a3a', '#5a3418', '#c09060'],
  darkwood: ['#5a3a2a', '#3a2418', '#8a5a3a'],
  red:      ['#c04a3a', '#8a2a1a', '#f08a70'],
  blue:     ['#4a7ac0', '#2a5a8a', '#a0c0f0'],
  green:    ['#5aa04a', '#3a6a2a', '#a0d080'],
  gold:     ['#e0c060', '#a08020', '#fff0a0'],
  silver:   ['#c8d0d8', '#7a8490', '#f0f4f8'],
  white:    ['#f0f0e8', '#b0b0a8', '#ffffff'],
  black:    ['#2a2a32', '#121218', '#5a5a68'],
  pink:     ['#e08ab0', '#a04a70', '#ffc0d8'],
  purple:   ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  gray:     ['#8a8a9a', '#5a5a6a', '#c8c8d8'],
  brown:    ['#8a5a3a', '#5a3418', '#c09060'],
  teal:     ['#4ac0b0', '#2a8070', '#a0f0e0'],
  orange:   ['#e08a3a', '#a05a1a', '#f0c080'],
  iridium:  ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  rainbow:  ['#d04a6a', '#4a8ac0', '#f0e060'],
  straw:    ['#d8b050', '#9a7020', '#f0d890'],
  stone:    ['#8a8a7a', '#5a5a4a', '#c0c0a0'],
  aqua:     ['#4ac0c0', '#2a7a7a', '#a0f0f0'],
  yellow:   ['#e8d050', '#b09020', '#fff8b0'],
  night:    ['#2a3a6a', '#1a2a4a', '#6a8ac0'],
  cyan:     ['#4ac0c0', '#2a7a7a', '#a0f0f0']
};

const TRIMS = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0', '#e08a3a', '#4ac0c0'];

/* [id, 中文名, 英文名, 分组, 造型, 配色] */
const FURN_RAW = [
  ['oak_chair','橡木椅','Oak Chair','chair','wood'],
  ['birch_chair','桦木椅','Birch Chair','chair','birch'],
  ['walnut_chair','胡桃木椅','Walnut Chair','chair','walnut'],
  ['red_stool','红凳子','Red Stool','stool','red'],
  ['blue_stool','蓝凳子','Blue Stool','stool','blue'],
  ['green_stool','绿凳子','Green Stool','stool','green'],
  ['armchair','扶手椅','Armchair','armchair','darkwood'],
  ['wood_couch','木沙发','Wood Couch','couch','wood'],
  ['blue_couch','蓝沙发','Blue Couch','couch','blue'],
  ['green_couch','绿沙发','Green Couch','couch','green'],
  ['fancy_chair','华丽椅','Fancy Chair','chair','gold'],
  ['bench','长凳','Bench','couch','walnut'],

  ['oak_table','橡木桌','Oak Table','table','wood'],
  ['birch_table','桦木桌','Birch Table','table','birch'],
  ['walnut_table','胡桃木桌','Walnut Table','table','walnut'],
  ['coffee_table','咖啡桌','Coffee Table','table','darkwood'],
  ['dining_table','餐桌','Dining Table','table','wood'],
  ['end_table','边桌','End Table','table','birch'],
  ['kitchen_table','厨房桌','Kitchen Table','table','white'],
  ['modern_table','现代桌','Modern Table','table','gray'],
  ['patio_table','露台桌','Patio Table','table','teal'],
  ['tea_table','茶几','Tea Table','table','red'],

  ['single_bed','单人床','Single Bed','bed','white'],
  ['double_bed','双人床','Double Bed','bed','blue'],
  ['birch_bed','桦木床','Birch Bed','bed','birch'],
  ['fancy_bed','华丽床','Fancy Bed','bed','gold'],
  ['kid_bed','儿童床','Kid Bed','bed','pink'],

  ['dresser','梳妆台','Dresser','dresser','wood'],
  ['birch_dresser','桦木梳妆台','Birch Dresser','dresser','birch'],
  ['walnut_dresser','胡桃木梳妆台','Walnut Dresser','dresser','walnut'],
  ['bookcase','书架','Bookcase','shelf','wood'],
  ['cabinet','橱柜','Cabinet','cabinet','wood'],
  ['chest','箱子','Chest','chest','wood'],
  ['fridge','冰箱','Fridge','fridge','white'],
  ['mini_fridge','小冰箱','Mini Fridge','fridge','silver'],

  ['table_lamp','台灯','Table Lamp','lamp','yellow'],
  ['floor_lamp','落地灯','Floor Lamp','lamp','gold'],
  ['ceiling_lamp','吊灯','Ceiling Lamp','ceiling_lamp','white'],
  ['candle','蜡烛','Candle','candle','yellow'],
  ['lantern','灯笼','Lantern','candle','orange'],
  ['paper_lantern','纸灯笼','Paper Lantern','candle','pink'],
  ['jack_o_lantern','南瓜灯','Jack-O-Lantern','candle','orange'],
  ['fireplace','壁炉','Fireplace','fireplace','red'],

  ['potted_plant','盆栽','Potted Plant','plant','green'],
  ['cactus','仙人掌','Cactus','plant','teal'],
  ['house_plant','室内植物','House Plant','plant','green'],
  ['painting','画','Painting','painting','blue'],
  ['landscape_painting','风景画','Landscape Painting','painting','green'],
  ['portrait','肖像画','Portrait','painting','brown'],
  ['mirror','镜子','Mirror','mirror','silver'],
  ['clock','时钟','Clock','clock','wood'],
  ['globe','地球仪','Globe','globe','blue'],
  ['telescope','望远镜','Telescope','telescope','silver'],
  ['statue','雕像','Statue','statue','stone'],
  ['fish_tank','鱼缸','Fish Tank','tank','aqua'],

  ['stove','炉灶','Stove','stove','silver'],
  ['sink','水槽','Sink','sink','silver'],
  ['counter','柜台','Counter','counter','wood'],
  ['kitchen_island','厨房岛台','Kitchen Island','counter','white'],
  ['coffee_maker','咖啡机','Coffee Maker','stove','darkwood'],
  ['microwave','微波炉','Microwave','stove','gray'],
  ['dishwasher','洗碗机','Dishwasher','sink','white'],
  ['blender','搅拌机','Blender','stove','gray'],

  ['red_rug','红地毯','Red Rug','rug','red'],
  ['blue_rug','蓝地毯','Blue Rug','rug','blue'],
  ['green_rug','绿地毯','Green Rug','rug','green'],
  ['round_rug','圆地毯','Round Rug','rug','gold'],
  ['fancy_rug','华丽地毯','Fancy Rug','rug','purple'],
  ['runner_rug','长条地毯','Runner Rug','rug','teal'],

  ['garden_bench','花园长椅','Garden Bench','couch','green'],
  ['bird_bath','鸟浴盆','Bird Bath','birdbath','stone'],
  ['fountain','喷泉','Fountain','fountain','aqua'],
  ['scarecrow','稻草人','Scarecrow','scarecrow','straw'],
  ['torch','火把','Torch','torch','orange'],
  ['sign','木牌','Sign','sign','wood'],
  ['mailbox','邮箱','Mailbox','sign','red'],
  ['picnic_table','野餐桌','Picnic Table','table','green'],

  ['tv','电视','TV','tv','darkwood'],
  ['computer','电脑','Computer','computer','gray'],
  ['sewing_machine','缝纫机','Sewing Machine','sewing','black'],
  ['piano','钢琴','Piano','piano','black'],
  ['jukebox','点唱机','Jukebox','jukebox','red'],
  ['arcade_machine','街机','Arcade Machine','arcade','purple'],
  ['bear_statue','熊雕像','Bear Statue','statue','brown'],
  ['junimo_plush','祝尼魔玩偶','Junimo Plush','plush','green'],
  ['crystal_ball','水晶球','Crystal Ball','orb','purple'],
  ['model_ship','船模型','Model Ship','model','brown'],
  ['model_plane','飞机模型','Model Plane','model','silver'],
  ['anchor','船锚','Anchor','anchor','gray'],
  ['treasure_chest','宝箱','Treasure Chest','chest','gold'],
  ['bookshelf','书柜','Bookshelf','shelf','darkwood'],
  ['wardrobe','衣柜','Wardrobe','cabinet','wood'],
  ['vanity','梳妆镜','Vanity','dresser','white'],
  ['crib','婴儿床','Crib','bed','white'],
  ['toy_chest','玩具箱','Toy Chest','chest','pink'],
  ['standing_mirror','落地镜','Standing Mirror','mirror','gold']
];

const WALL_RAW = [
  ['forest_wallpaper','森林墙纸','Forest Wallpaper','leaves','green'],
  ['star_wallpaper','星星墙纸','Star Wallpaper','stars','night'],
  ['rose_wallpaper','玫瑰墙纸','Rose Wallpaper','floral','pink'],
  ['ocean_wallpaper','海洋墙纸','Ocean Wallpaper','waves','blue'],
  ['brick_wallpaper','红砖墙','Brick Wallpaper','brick','red'],
  ['wood_wallpaper','木板墙','Wood Wallpaper','wood','brown'],
  ['tile_wallpaper','瓷砖墙','Tile Wallpaper','tile','white'],
  ['dot_wallpaper','波点墙','Dot Wallpaper','dots','red'],
  ['diamond_wallpaper','菱形墙','Diamond Wallpaper','diamond','purple'],
  ['checker_wallpaper','棋盘墙','Checker Wallpaper','checker','black'],
  ['panel_wallpaper','护墙板','Panel Wallpaper','panel','wood'],
  ['vine_wallpaper','藤蔓墙','Vine Wallpaper','vines','green'],
  ['cloud_wallpaper','云朵墙','Cloud Wallpaper','clouds','white'],
  ['mosaic_wallpaper','马赛克墙','Mosaic Wallpaper','mosaic','teal'],
  ['plaid_wallpaper','格纹墙','Plaid Wallpaper','plaid','red'],
  ['heart_wallpaper','心形墙','Heart Wallpaper','hearts','pink'],
  ['moon_wallpaper','月亮墙','Moon Wallpaper','moon','night'],
  ['leaf_wallpaper','树叶墙','Leaf Wallpaper','leaves','green'],
  ['fish_wallpaper','鱼群墙','Fish Wallpaper','fish','blue'],
  ['geometric_wallpaper','几何墙','Geometric Wallpaper','geometric','gold'],
  ['stripe_wallpaper','竖条纹墙','Stripe Wallpaper','stripes','gray'],
  ['sunset_wallpaper','日落墙','Sunset Wallpaper','gradient','orange'],
  ['night_wallpaper','夜空墙','Night Wallpaper','stars','night'],
  ['garden_wallpaper','花园墙','Garden Wallpaper','floral','green'],
  ['candy_wallpaper','糖果墙','Candy Wallpaper','dots','pink'],
  ['neon_wallpaper','霓虹墙','Neon Wallpaper','geometric','purple'],
  ['rustic_wallpaper','乡村墙','Rustic Wallpaper','wood','brown'],
  ['ice_wallpaper','冰霜墙','Ice Wallpaper','diamond','aqua'],
  ['lava_wallpaper','熔岩墙','Lava Wallpaper','waves','red'],
  ['junimo_wallpaper','祝尼魔墙','Junimo Wallpaper','stars','green'],
  ['royal_wallpaper','皇家墙','Royal Wallpaper','diamond','gold'],
  ['prismatic_wallpaper','彩虹墙','Prismatic Wallpaper','rainbow','rainbow']
];

const FLOOR_RAW = [
  ['oak_floor','橡木地板','Oak Floor','wood','wood'],
  ['birch_floor','桦木地板','Birch Floor','wood','birch'],
  ['walnut_floor','胡桃木地板','Walnut Floor','wood','walnut'],
  ['parquet_floor','拼花地板','Parquet Floor','parquet','gold'],
  ['stone_floor','石板地板','Stone Floor','stone','gray'],
  ['brick_floor','红砖地板','Brick Floor','brick','red'],
  ['tile_floor','瓷砖地板','Tile Floor','tile','white'],
  ['checker_floor','棋盘地板','Checker Floor','checker','black'],
  ['red_carpet','红色地毯','Red Carpet','carpet','red'],
  ['blue_carpet','蓝色地毯','Blue Carpet','carpet','blue'],
  ['green_carpet','绿色地毯','Green Carpet','carpet','green'],
  ['grass_floor','草地地板','Grass Floor','grass','green'],
  ['sand_floor','沙地地板','Sand Floor','sand','straw'],
  ['marble_floor','大理石地板','Marble Floor','marble','white'],
  ['metal_floor','金属地板','Metal Floor','metal','silver'],
  ['hex_floor','六角地板','Hex Floor','hex','teal'],
  ['mosaic_floor','马赛克地板','Mosaic Floor','mosaic','purple'],
  ['prismatic_floor','彩虹地板','Prismatic Floor','prismatic','rainbow'],
  ['wood_plank','木板地板','Wood Plank','plank','brown'],
  ['dark_wood','深色木地板','Dark Wood Floor','wood','darkwood'],
  ['snowy_floor','雪地地板','Snowy Floor','snow','white'],
  ['lava_floor','熔岩地板','Lava Floor','lava','orange'],
  ['water_floor','水面地板','Water Floor','water','blue'],
  ['junimo_floor','祝尼魔地板','Junimo Floor','stars','green']
];

function pal(key) {
  const c = C[key] || C.wood;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const FURNITURE = FURN_RAW.map(([id, name, en, style, p]) => ({
  id, name, en, group: 'furniture', style, ...pal(p)
}));
export const WALLPAPERS = WALL_RAW.map(([id, name, en, style, p]) => ({
  id, name, en, group: 'wallpaper', style, ...pal(p)
}));
export const FLOORINGS = FLOOR_RAW.map(([id, name, en, style, p]) => ({
  id, name, en, group: 'floor', style, ...pal(p)
}));

export const INTERIOR = [...FURNITURE, ...WALLPAPERS, ...FLOORINGS];
export const INTERIOR_MAP = Object.fromEntries(INTERIOR.map(i => [i.id, i]));

export function interiorCatName(cat) {
  const c = INTERIOR_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------------- 家具 ---------------- */

function cab(g, it, x, y, w, h, drawers) {
  R(g, x, y, w, h, it.c2);
  R(g, x + 1, y + 1, w - 2, h - 2, it.c1);
  R(g, x + 2, y + 2, 1, h - 4, it.c3);
  if (drawers) {
    for (let i = 1; i < 3; i++) R(g, x + 2, y + i * (h / 3), w - 4, 1, it.c2);
    R(g, x + w / 2 - 1, y + 4, 2, 2, it.c3);
  }
}

function drawChair(g, it) {
  R(g, 12, 12, 16, 4, it.c2);
  R(g, 13, 13, 14, 2, it.c1);
  R(g, 12, 16, 16, 7, it.c2);
  R(g, 13, 17, 14, 5, it.c1);
  R(g, 14, 18, 12, 1, it.c3);
  R(g, 11, 23, 3, 10, it.c2);
  R(g, 26, 23, 3, 10, it.c2);
  R(g, 11, 23, 1, 10, it.c3);
  R(g, 28, 23, 1, 10, it.c3);
  R(g, 9, 33, 6, 2, it.c2);
  R(g, 25, 33, 6, 2, it.c2);
}

function drawArmchair(g, it) {
  drawChair(g, it);
  R(g, 8, 18, 4, 8, it.c2);
  R(g, 28, 18, 4, 8, it.c2);
  R(g, 9, 19, 2, 6, it.c1);
  R(g, 29, 19, 2, 6, it.c1);
}

function drawStool(g, it) {
  R(g, 12, 20, 16, 5, it.c2);
  R(g, 13, 21, 14, 3, it.c1);
  R(g, 14, 22, 12, 1, it.c3);
  R(g, 14, 25, 3, 10, it.c2);
  R(g, 23, 25, 3, 10, it.c2);
  R(g, 19, 26, 2, 8, it.c2);
  R(g, 12, 34, 5, 2, it.c2);
  R(g, 23, 34, 5, 2, it.c2);
}

function drawCouch(g, it) {
  R(g, 5, 17, 30, 13, it.c2);
  R(g, 6, 18, 28, 10, it.c1);
  R(g, 7, 19, 26, 4, it.c3);
  R(g, 4, 22, 5, 8, it.c2);
  R(g, 31, 22, 5, 8, it.c2);
  R(g, 8, 28, 24, 2, it.c2);
  R(g, 7, 30, 4, 5, it.c2);
  R(g, 29, 30, 4, 5, it.c2);
  R(g, 13, 24, 2, 3, it.c3);
  R(g, 25, 24, 2, 3, it.c3);
}

function drawTable(g, it) {
  R(g, 5, 18, 30, 5, it.c2);
  R(g, 6, 19, 28, 3, it.c1);
  R(g, 8, 19, 22, 1, it.c3);
  R(g, 9, 23, 4, 12, it.c2);
  R(g, 27, 23, 4, 12, it.c2);
  R(g, 9, 23, 1, 12, it.c3);
  R(g, 30, 23, 1, 12, it.c3);
}

function drawBed(g, it) {
  R(g, 5, 14, 30, 20, it.c2);
  R(g, 6, 15, 28, 18, it.c1);
  R(g, 7, 16, 11, 7, it.c3);
  R(g, 8, 17, 9, 5, '#fff8e8');
  R(g, 19, 16, 14, 8, it.c2);
  R(g, 19, 16, 14, 2, it.c1);
  R(g, 6, 26, 28, 5, it.c2);
  R(g, 7, 27, 26, 3, it.c1);
  R(g, 6, 31, 3, 5, it.c2);
  R(g, 31, 31, 3, 5, it.c2);
  R(g, 13, 28, 14, 1, it.c3);
}

function drawDresser(g, it) {
  cab(g, it, 7, 12, 26, 24, true);
  R(g, 8, 36, 5, 2, it.c2);
  R(g, 27, 36, 5, 2, it.c2);
  R(g, 16, 10, 8, 2, it.c1);
}

function drawShelf(g, it) {
  R(g, 7, 8, 26, 28, it.c2);
  R(g, 8, 9, 24, 26, it.c1);
  for (let i = 0; i < 3; i++) R(g, 8, 17 + i * 7, 24, 2, it.c2);
  for (let i = 0; i < 8; i++) {
    R(g, 10 + (i % 4) * 6, 10 + Math.floor(i / 4) * 7, 3, 6, i % 2 ? it.c3 : it.c2);
  }
  for (let i = 0; i < 7; i++) {
    R(g, 9 + i * 3, 25 + (i % 2) * 2, 2, 5, i % 3 ? it.c2 : it.c3);
  }
}

function drawCabinet(g, it) {
  R(g, 8, 6, 24, 30, it.c2);
  R(g, 9, 7, 22, 28, it.c1);
  R(g, 19, 7, 2, 28, it.c2);
  R(g, 16, 20, 2, 4, it.c3);
  R(g, 22, 20, 2, 4, it.c3);
  R(g, 10, 8, 1, 26, it.c3);
  R(g, 8, 35, 4, 2, it.c2);
  R(g, 28, 35, 4, 2, it.c2);
}

function drawChest(g, it) {
  R(g, 7, 17, 26, 15, it.c2);
  R(g, 8, 18, 24, 13, it.c1);
  R(g, 7, 13, 26, 6, it.c2);
  R(g, 8, 14, 24, 4, it.c1);
  R(g, 9, 15, 20, 1, it.c3);
  R(g, 18, 19, 4, 6, it.c3);
  R(g, 19, 20, 2, 3, it.c2);
  R(g, 9, 30, 22, 2, it.c2);
}

function drawFridge(g, it) {
  R(g, 10, 5, 20, 31, it.c2);
  R(g, 11, 6, 18, 29, it.c1);
  R(g, 11, 18, 18, 1, it.c2);
  R(g, 25, 9, 2, 6, it.c3);
  R(g, 25, 21, 2, 7, it.c3);
  R(g, 12, 7, 1, 28, it.c3);
  R(g, 10, 34, 5, 2, it.c2);
  R(g, 25, 34, 5, 2, it.c2);
}

function drawLamp(g, it, ceiling) {
  if (ceiling) {
    line(g, 20, 0, 20, 12, it.c2, 2);
    for (let i = 0; i < 4; i++) R(g, 12 + i * 2, 12 + i, 16 - i * 4, 2, it.c1);
    R(g, 14, 18, 12, 3, it.c1);
    R(g, 17, 21, 6, 2, it.c3);
    return;
  }
  R(g, 12, 31, 16, 3, it.c2);
  R(g, 13, 32, 14, 2, it.c1);
  line(g, 20, 31, 20, 15, it.c2, 2);
  for (let i = 0; i < 4; i++) R(g, 12 + i * 2, 7 + i * 2, 16 - i * 4, 2, it.c1);
  R(g, 13, 15, 14, 2, it.c1);
  R(g, 17, 17, 6, 1, it.c3);
}

function drawCandle(g, it) {
  R(g, 14, 22, 12, 12, it.c2);
  R(g, 15, 23, 10, 10, it.c1);
  R(g, 17, 13, 6, 9, '#f0f0e0');
  R(g, 18, 14, 4, 7, '#ffffff');
  R(g, 19, 8, 2, 5, '#e08a3a');
  R(g, 20, 6, 1, 3, '#f0c050');
  R(g, 18, 7, 1, 3, '#f0c050');
  R(g, 14, 32, 12, 2, it.c2);
}

function drawFireplace(g, it) {
  R(g, 5, 8, 30, 28, it.c2);
  R(g, 6, 9, 28, 26, it.c1);
  for (let y = 12; y < 32; y += 6) {
    for (let x = 6; x < 34; x += 8) R(g, x, y, 6, 4, (x + y) % 3 ? it.c2 : it.c1);
  }
  R(g, 11, 19, 18, 13, '#2a1a14');
  R(g, 13, 24, 14, 8, '#5a2a1a');
  R(g, 15, 21, 4, 8, '#e08a3a');
  R(g, 20, 20, 4, 9, '#f0c050');
  R(g, 23, 23, 3, 6, '#d04a3a');
  R(g, 17, 26, 3, 4, '#fff0a0');
}

function drawPlant(g, it) {
  R(g, 13, 27, 14, 8, it.c2);
  R(g, 14, 28, 12, 6, it.c1);
  R(g, 15, 29, 10, 1, it.c3);
  if (it.id === 'cactus') {
    R(g, 18, 10, 4, 18, it.c1);
    R(g, 14, 16, 4, 8, it.c1);
    R(g, 22, 13, 4, 9, it.c1);
    R(g, 18, 10, 1, 18, it.c3);
    R(g, 14, 16, 1, 8, it.c3);
    R(g, 22, 13, 1, 9, it.c3);
    return;
  }
  line(g, 20, 28, 20, 12, it.c2, 2);
  ellipse(g, 13, 15, 6, 5, it.c1);
  ellipse(g, 27, 14, 6, 5, it.c1);
  ellipse(g, 19, 9, 7, 5, it.c1);
  ellipse(g, 13, 15, 4, 3, it.c3);
  ellipse(g, 27, 14, 4, 3, it.c3);
  ellipse(g, 19, 9, 5, 3, it.c3);
}

function drawPainting(g, it) {
  R(g, 6, 8, 28, 24, it.c2);
  R(g, 7, 9, 26, 22, it.c1);
  R(g, 9, 11, 22, 18, it.c3);
  R(g, 10, 12, 20, 16, it.c1);
  for (let i = 0; i < 6; i++) {
    R(g, 11 + i * 3, 22 - (i % 3) * 2, 2, 6, i % 2 ? it.c2 : it.c3);
  }
  R(g, 9, 26, 22, 3, it.c2);
}

function drawMirror(g, it) {
  R(g, 9, 5, 22, 30, it.c2);
  R(g, 10, 6, 20, 28, it.c1);
  R(g, 12, 8, 16, 24, '#5a7a88');
  R(g, 13, 9, 14, 22, '#8ab8c8');
  R(g, 14, 10, 4, 20, 'rgba(255,255,255,0.28)');
  R(g, 11, 34, 18, 2, it.c2);
}

function drawClock(g, it) {
  R(g, 16, 27, 8, 9, it.c2);
  R(g, 17, 28, 6, 7, it.c1);
  for (let i = 0; i < 3; i++) R(g, 8, 8 + i * 3, 24, 1, it.c2);
  R(g, 9, 5, 22, 3, it.c1);
  R(g, 10, 6, 20, 2, it.c3);
  ellipse(g, 20, 18, 9, 9, it.c2);
  ellipse(g, 20, 18, 8, 8, '#f0e8d0');
  R(g, 19, 12, 2, 5, it.c1);
  R(g, 20, 17, 4, 2, it.c1);
  R(g, 19, 17, 2, 2, it.c3);
}

function drawGlobe(g, it) {
  R(g, 14, 30, 12, 4, it.c2);
  R(g, 18, 24, 4, 7, it.c2);
  ellipse(g, 20, 16, 10, 10, it.c2);
  ellipse(g, 20, 16, 8, 8, it.c1);
  R(g, 14, 12, 5, 3, it.c3);
  R(g, 20, 14, 6, 3, it.c3);
  R(g, 16, 20, 7, 2, it.c3);
  R(g, 19, 6, 2, 20, it.c2);
}

function drawTelescope(g, it) {
  line(g, 20, 30, 12, 37, it.c2, 2);
  line(g, 20, 30, 28, 37, it.c2, 2);
  line(g, 20, 30, 20, 37, it.c2, 2);
  line(g, 13, 22, 29, 12, it.c2, 7);
  line(g, 14, 21, 28, 13, it.c1, 5);
  R(g, 28, 10, 5, 4, it.c3);
  R(g, 14, 21, 4, 2, it.c3);
  R(g, 19, 24, 4, 4, it.c2);
}

function drawStatue(g, it) {
  R(g, 10, 31, 20, 5, it.c2);
  R(g, 12, 27, 16, 4, it.c1);
  if (it.id === 'bear_statue') {
    ellipse(g, 20, 18, 8, 8, it.c1);
    ellipse(g, 13, 12, 4, 4, it.c1);
    ellipse(g, 27, 12, 4, 4, it.c1);
    R(g, 16, 16, 2, 2, it.c2);
    R(g, 23, 16, 2, 2, it.c2);
    ellipse(g, 20, 22, 3, 3, it.c2);
    return;
  }
  ellipse(g, 20, 13, 5, 5, it.c1);
  R(g, 15, 18, 10, 10, it.c1);
  R(g, 13, 20, 3, 6, it.c1);
  R(g, 24, 20, 3, 6, it.c1);
  R(g, 16, 18, 8, 1, it.c3);
  R(g, 19, 12, 2, 2, it.c3);
}

function drawTank(g, it) {
  R(g, 5, 8, 30, 26, it.c2);
  R(g, 6, 9, 28, 24, it.c1);
  R(g, 7, 13, 26, 19, '#3a8aa0');
  R(g, 7, 13, 26, 5, '#8ad0e0');
  R(g, 9, 21, 5, 3, '#e08a3a');
  R(g, 14, 17, 4, 2, '#f0c050');
  R(g, 20, 23, 4, 2, '#d04a6a');
  R(g, 26, 18, 3, 2, '#a0f0d0');
  R(g, 7, 28, 26, 3, '#6a5a3a');
  R(g, 9, 31, 3, 3, it.c2);
  R(g, 28, 31, 3, 3, it.c2);
  R(g, 6, 9, 28, 1, it.c3);
}

function drawStove(g, it) {
  R(g, 8, 14, 24, 23, it.c2);
  R(g, 9, 15, 22, 21, it.c1);
  ellipse(g, 15, 20, 4, 3, '#2a2a2a');
  ellipse(g, 25, 20, 4, 3, '#2a2a2a');
  R(g, 12, 19, 6, 2, '#5a5a5a');
  R(g, 22, 19, 6, 2, '#5a5a5a');
  R(g, 10, 26, 20, 8, it.c2);
  R(g, 11, 27, 18, 2, it.c3);
  R(g, 14, 30, 4, 2, it.c3);
  R(g, 22, 30, 4, 2, it.c3);
}

function drawSink(g, it) {
  R(g, 6, 16, 28, 8, it.c2);
  R(g, 7, 17, 26, 6, it.c1);
  R(g, 10, 18, 12, 4, '#6a7a88');
  R(g, 11, 19, 10, 2, '#9ab0c0');
  line(g, 26, 16, 26, 9, it.c2, 2);
  line(g, 26, 9, 31, 9, it.c2, 2);
  R(g, 30, 9, 2, 3, it.c3);
  R(g, 8, 24, 24, 11, it.c2);
  R(g, 9, 25, 22, 9, it.c1);
  R(g, 12, 27, 16, 1, it.c3);
}

function drawCounter(g, it) {
  R(g, 4, 14, 32, 5, it.c2);
  R(g, 5, 15, 30, 3, it.c1);
  R(g, 6, 19, 28, 16, it.c2);
  R(g, 7, 20, 26, 14, it.c1);
  R(g, 12, 19, 2, 16, it.c2);
  R(g, 22, 19, 2, 16, it.c2);
  R(g, 9, 22, 3, 5, it.c3);
  R(g, 25, 22, 3, 5, it.c3);
}

function drawRug(g, it) {
  R(g, 4, 16, 32, 18, it.c2);
  R(g, 5, 17, 30, 16, it.c1);
  R(g, 7, 19, 26, 12, it.c2);
  R(g, 8, 20, 24, 10, it.c1);
  if (it.id === 'round_rug') {
    ellipse(g, 20, 25, 15, 9, it.c2);
    ellipse(g, 20, 25, 13, 7, it.c1);
    ellipse(g, 20, 25, 7, 4, it.c3);
  } else if (it.id === 'runner_rug') {
    R(g, 11, 14, 18, 22, it.c2);
    R(g, 12, 15, 16, 20, it.c1);
    R(g, 14, 17, 12, 3, it.c3);
  } else {
    for (let i = 0; i < 4; i++) R(g, 9 + i * 6, 21, 3, 8, i % 2 ? it.c3 : it.c2);
    R(g, 5, 17, 30, 1, it.c3);
    R(g, 5, 32, 30, 1, it.c2);
  }
  R(g, 4, 33, 32, 2, it.c2);
}

function drawFountain(g, it) {
  ellipse(g, 20, 32, 15, 5, it.c2);
  R(g, 6, 27, 28, 6, it.c1);
  ellipse(g, 20, 27, 11, 4, '#3a8aa0');
  R(g, 18, 12, 4, 15, it.c2);
  ellipse(g, 20, 10, 6, 3, it.c1);
  line(g, 20, 10, 13, 18, '#a0e0f0', 1);
  line(g, 20, 10, 27, 18, '#a0e0f0', 1);
  R(g, 19, 8, 2, 4, '#d0f8ff');
  R(g, 9, 27, 22, 1, it.c3);
}

function drawScarecrow(g, it) {
  R(g, 19, 10, 3, 27, it.c2);
  R(g, 8, 18, 24, 3, it.c2);
  ellipse(g, 20, 9, 6, 6, it.c1);
  R(g, 17, 8, 2, 2, '#2a1a14');
  R(g, 22, 8, 2, 2, '#2a1a14');
  R(g, 18, 12, 5, 1, it.c2);
  for (let i = 0; i < 6; i++) R(g, 9 + i * 4, 21, 2, 5, it.c3);
  R(g, 8, 20, 22, 1, it.c3);
}

function drawTorch(g, it) {
  R(g, 18, 16, 4, 21, it.c2);
  R(g, 19, 17, 2, 19, it.c1);
  ellipse(g, 20, 12, 6, 6, '#e08a3a');
  ellipse(g, 20, 10, 4, 5, '#f0c050');
  R(g, 19, 6, 2, 6, '#fff0a0');
  R(g, 17, 14, 3, 2, it.c3);
  R(g, 17, 36, 6, 2, it.c2);
}

function drawTV(g, it) {
  R(g, 6, 11, 28, 19, it.c2);
  R(g, 7, 12, 26, 17, it.c1);
  R(g, 9, 14, 22, 12, '#1a1a22');
  R(g, 10, 15, 20, 10, '#3a5a7a');
  R(g, 12, 17, 8, 3, '#8ac0e0');
  R(g, 14, 29, 12, 3, it.c2);
  R(g, 18, 32, 4, 4, it.c2);
}

function drawComputer(g, it) {
  R(g, 8, 9, 24, 18, it.c2);
  R(g, 9, 10, 22, 16, it.c1);
  R(g, 11, 12, 18, 12, '#1a2a3a');
  R(g, 12, 13, 16, 10, '#4a8ac0');
  R(g, 13, 14, 6, 2, '#a0d0f0');
  R(g, 15, 26, 10, 2, it.c2);
  R(g, 10, 28, 20, 2, it.c2);
  R(g, 8, 30, 24, 6, it.c2);
  R(g, 9, 31, 22, 4, it.c1);
  R(g, 14, 32, 12, 1, it.c3);
}

function drawSewing(g, it) {
  R(g, 6, 18, 28, 12, it.c2);
  R(g, 7, 19, 26, 10, it.c1);
  R(g, 10, 11, 3, 10, it.c2);
  R(g, 20, 11, 3, 10, it.c2);
  R(g, 9, 8, 15, 4, it.c2);
  R(g, 10, 9, 13, 2, it.c1);
  ellipse(g, 28, 16, 3, 3, it.c2);
  R(g, 27, 15, 2, 2, it.c3);
  R(g, 12, 20, 10, 1, it.c3);
  R(g, 8, 32, 24, 2, it.c2);
}

function drawPiano(g, it) {
  R(g, 5, 12, 30, 18, it.c2);
  R(g, 6, 13, 28, 14, it.c1);
  R(g, 8, 15, 24, 4, it.c2);
  R(g, 8, 21, 24, 6, '#f0f0e8');
  for (let i = 0; i < 8; i++) {
    R(g, 8 + i * 3, 21, 1, 4, '#2a2a2a');
    if (i % 2 === 0) R(g, 9 + i * 3, 21, 1, 3, '#2a2a2a');
  }
  R(g, 9, 8, 22, 5, it.c2);
  R(g, 10, 9, 20, 3, it.c1);
  R(g, 8, 30, 3, 6, it.c2);
  R(g, 29, 30, 3, 6, it.c2);
}

function drawJukebox(g, it) {
  R(g, 8, 10, 24, 27, it.c2);
  R(g, 9, 11, 22, 25, it.c1);
  ellipse(g, 20, 13, 10, 7, it.c2);
  ellipse(g, 20, 13, 8, 5, '#e0c060');
  R(g, 10, 20, 20, 10, '#2a1a1a');
  R(g, 12, 22, 16, 6, '#5a3a2a');
  R(g, 13, 23, 14, 1, it.c3);
  R(g, 13, 26, 14, 1, it.c3);
  for (let i = 0; i < 4; i++) R(g, 11 + i * 5, 31, 2, 2, i % 2 ? '#f0c050' : '#d04a3a');
}

function drawArcade(g, it) {
  R(g, 8, 5, 24, 32, it.c2);
  R(g, 9, 6, 22, 30, it.c1);
  R(g, 11, 8, 18, 13, '#1a1a2a');
  R(g, 12, 9, 16, 11, '#4a8ac0');
  R(g, 14, 11, 5, 3, '#a0f0d0');
  R(g, 20, 12, 4, 2, '#f0c050');
  R(g, 11, 23, 18, 6, '#3a2a2a');
  R(g, 13, 25, 3, 2, '#d04a3a');
  R(g, 19, 25, 3, 2, '#4ac0c0');
  R(g, 24, 24, 2, 3, it.c3);
  R(g, 9, 35, 22, 2, it.c2);
}

function drawPlush(g, it) {
  ellipse(g, 20, 22, 10, 9, it.c1);
  ellipse(g, 20, 20, 8, 7, it.c3);
  R(g, 16, 18, 2, 2, '#1a1a1a');
  R(g, 22, 18, 2, 2, '#1a1a1a');
  R(g, 18, 24, 4, 1, it.c2);
  line(g, 20, 13, 23, 8, it.c2, 1);
  R(g, 22, 6, 3, 2, '#5aa04a');
  R(g, 11, 28, 3, 6, it.c2);
  R(g, 26, 28, 3, 6, it.c2);
}

function drawOrb(g, it) {
  R(g, 15, 31, 10, 3, it.c2);
  R(g, 17, 28, 6, 4, it.c2);
  ellipse(g, 20, 19, 10, 10, it.c2);
  ellipse(g, 20, 18, 8, 8, it.c1);
  ellipse(g, 17, 16, 3, 3, it.c3);
  R(g, 23, 22, 2, 2, '#ffffff');
  R(g, 14, 28, 12, 2, it.c3);
}

function drawModel(g, it) {
  R(g, 11, 30, 18, 3, it.c2);
  if (it.id === 'model_plane') {
    R(g, 18, 16, 4, 14, it.c1);
    R(g, 8, 20, 24, 3, it.c1);
    R(g, 16, 14, 8, 3, it.c1);
    R(g, 18, 10, 4, 4, it.c2);
    R(g, 19, 9, 2, 3, it.c3);
  } else {
    R(g, 10, 24, 20, 6, it.c1);
    R(g, 13, 18, 14, 6, it.c1);
    R(g, 19, 10, 2, 12, it.c2);
    R(g, 15, 13, 10, 2, it.c3);
    R(g, 12, 22, 16, 1, it.c2);
  }
}

function drawAnchor(g, it) {
  R(g, 18, 7, 4, 19, it.c2);
  R(g, 19, 8, 2, 17, it.c1);
  line(g, 10, 18, 30, 18, it.c2, 3);
  line(g, 11, 18, 29, 18, it.c1, 1);
  line(g, 20, 26, 11, 33, it.c2, 3);
  line(g, 20, 26, 29, 33, it.c2, 3);
  R(g, 8, 32, 5, 3, it.c1);
  R(g, 27, 32, 5, 3, it.c1);
  ellipse(g, 20, 8, 5, 3, it.c1);
}

function drawSign(g, it) {
  R(g, 18, 20, 4, 18, it.c2);
  R(g, 19, 21, 2, 16, it.c1);
  R(g, 7, 8, 26, 15, it.c2);
  R(g, 8, 9, 24, 13, it.c1);
  for (let i = 0; i < 3; i++) R(g, 11, 12 + i * 3, 18, 1, it.c3);
  if (it.id === 'mailbox') {
    R(g, 10, 8, 15, 12, it.c2);
    R(g, 11, 9, 13, 10, it.c1);
    R(g, 24, 10, 5, 3, it.c3);
    R(g, 11, 20, 2, 8, it.c2);
  }
}

function drawBirdbath(g, it) {
  R(g, 17, 20, 6, 14, it.c2);
  R(g, 15, 33, 10, 3, it.c2);
  ellipse(g, 20, 17, 12, 5, it.c2);
  ellipse(g, 20, 16, 10, 4, it.c1);
  ellipse(g, 20, 16, 7, 2, '#6ac0e0');
  R(g, 12, 12, 3, 3, '#a0e0f0');
}

/* ---------------- 墙纸 / 地板贴图 ---------------- */

function wallPattern(g, it) {
  const { c1, c2, c3, style } = it;
  R(g, 0, 0, 32, 32, c2);
  if (style === 'stripes') {
    for (let x = 0; x < 32; x += 6) R(g, x, 0, 3, 32, c1);
    for (let x = 3; x < 32; x += 6) R(g, x, 0, 1, 32, c3);
  } else if (style === 'stars') {
    for (let i = 0; i < 6; i++) {
      const x = 4 + (i * 11) % 24, y = 4 + (i * 7) % 24;
      R(g, x, y, 1, 3, c3);
      R(g, x - 1, y + 1, 3, 1, c3);
    }
  } else if (style === 'floral') {
    for (let i = 0; i < 5; i++) {
      const x = 5 + (i * 9) % 22, y = 5 + (i * 11) % 22;
      R(g, x, y, 2, 2, c1);
      R(g, x - 1, y + 1, 1, 1, c3);
      R(g, x + 2, y + 1, 1, 1, c3);
      R(g, x + 1, y - 1, 1, 1, c3);
    }
  } else if (style === 'brick') {
    for (let y = 0; y < 32; y += 8) {
      R(g, 0, y, 32, 1, c3);
      const off = (y / 8) % 2 ? 8 : 0;
      for (let x = off; x < 32; x += 16) R(g, x, y, 1, 8, c3);
    }
  } else if (style === 'wood') {
    for (let y = 0; y < 32; y += 8) {
      R(g, 0, y, 32, 1, c3);
      R(g, 4 + (y % 16), y + 2, 1, 5, c1);
      R(g, 20 - (y % 12), y + 3, 1, 4, c1);
    }
  } else if (style === 'tile') {
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) {
        R(g, x, y, 7, 7, (x + y) % 16 ? c1 : c3);
        R(g, x, y, 7, 1, c3);
      }
    }
  } else if (style === 'dots') {
    for (let y = 4; y < 32; y += 8) {
      for (let x = 4; x < 32; x += 8) R(g, x, y, 2, 2, c3);
    }
  } else if (style === 'diamond') {
    for (let i = -32; i < 64; i += 12) {
      line(g, i, 0, i + 32, 32, c1, 1);
      line(g, i, 32, i + 32, 0, c1, 1);
    }
    for (let i = 0; i < 4; i++) R(g, 6 + i * 7, 6 + (i % 2) * 8, 2, 2, c3);
  } else if (style === 'checker') {
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) {
        if ((x / 8 + y / 8) % 2) R(g, x, y, 8, 8, c1);
      }
    }
  } else if (style === 'panel') {
    for (let x = 0; x < 32; x += 10) {
      R(g, x, 0, 1, 32, c3);
      R(g, x + 4, 0, 1, 32, c1);
    }
  } else if (style === 'vines') {
    for (let i = 0; i < 3; i++) {
      line(g, 4 + i * 10, 0, 10 + i * 8, 12, c1, 1);
      line(g, 10 + i * 8, 12, 5 + i * 9, 24, c1, 1);
      R(g, 7 + i * 8, 8, 3, 2, c3);
      R(g, 8 + i * 8, 18, 3, 2, c3);
    }
  } else if (style === 'clouds') {
    for (let i = 0; i < 4; i++) {
      const x = 4 + (i * 9) % 22, y = 6 + (i * 9) % 20;
      ellipse(g, x, y, 4, 2, c3);
      ellipse(g, x + 3, y + 1, 3, 2, c1);
    }
  } else if (style === 'mosaic') {
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) {
        R(g, x, y, 7, 7, (x * 3 + y * 5) % 3 ? c1 : c3);
      }
    }
  } else if (style === 'plaid') {
    for (let i = 0; i < 32; i += 8) {
      R(g, i, 0, 3, 32, c1);
      R(g, 0, i, 32, 3, c1);
    }
    for (let i = 4; i < 32; i += 8) R(g, i, 0, 1, 32, c3);
  } else if (style === 'hearts') {
    for (let i = 0; i < 4; i++) {
      const x = 5 + (i * 7) % 22, y = 6 + (i * 9) % 20;
      R(g, x, y, 2, 1, c3);
      R(g, x + 3, y, 2, 1, c3);
      R(g, x, y + 1, 5, 2, c3);
      R(g, x + 1, y + 3, 3, 1, c3);
      R(g, x + 2, y + 4, 1, 1, c3);
    }
  } else if (style === 'moon') {
    for (let i = 0; i < 3; i++) {
      const x = 6 + i * 9, y = 5 + (i % 2) * 10;
      ellipse(g, x, y, 4, 4, c3);
      ellipse(g, x + 2, y - 1, 4, 4, c2);
    }
  } else if (style === 'leaves') {
    for (let i = 0; i < 6; i++) {
      const x = 4 + (i * 7) % 24, y = 4 + (i * 9) % 24;
      R(g, x, y, 1, 4, c3);
      R(g, x + 1, y, 3, 1, c3);
      R(g, x - 1, y + 2, 2, 1, c3);
    }
  } else if (style === 'fish') {
    for (let i = 0; i < 3; i++) {
      const x = 6 + i * 9, y = 8 + (i % 2) * 10;
      R(g, x, y, 5, 2, c3);
      R(g, x - 2, y - 1, 2, 2, c3);
      R(g, x + 5, y, 2, 2, c3);
      R(g, x + 2, y, 1, 1, c2);
    }
  } else if (style === 'geometric') {
    for (let i = 0; i < 4; i++) {
      const x = (i * 8) % 24, y = (i * 11) % 24;
      for (let j = 0; j < 5; j++) R(g, x + j, y + 5 - j, 1, j + 1, c1);
      for (let j = 0; j < 5; j++) R(g, x + j, y + j, 1, 6 - j, c3);
    }
  } else if (style === 'gradient') {
    for (let y = 0; y < 32; y++) {
      const t = y / 32;
      const col = t < 0.33 ? c1 : (t < 0.66 ? c2 : c3);
      R(g, 0, y, 32, 1, col);
    }
  } else if (style === 'rainbow') {
    const cols = [c1, c2, c3, '#e0c060', '#d04a3a', '#5aa04a'];
    for (let x = 0; x < 32; x++) R(g, x, 0, 1, 32, cols[Math.floor(x / 6) % cols.length]);
  } else {
    R(g, 0, 0, 32, 32, c1);
  }
  const hh = hashOf(it.id);
  R(g, 4 + hh % 22, 4 + Math.floor(hh / 22) % 22, 2, 2, TRIMS[hh % TRIMS.length]);
}

function floorPattern(g, it) {
  const { c1, c2, c3, style } = it;
  R(g, 0, 0, 32, 32, c2);
  if (style === 'wood' || style === 'plank') {
    const step = style === 'plank' ? 8 : 10;
    for (let y = 0; y < 32; y += step) {
      R(g, 0, y, 32, 1, c3);
      R(g, 0, y + 1, 32, step - 2, c1);
      R(g, 6 + (y % 12), y + 2, 1, step - 3, c2);
      R(g, 20 - (y % 10), y + 3, 1, step - 4, c2);
    }
  } else if (style === 'parquet') {
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) {
        R(g, x, y, 7, 7, (x + y) % 16 ? c1 : c3);
        R(g, x, y, 7, 1, c3);
      }
    }
    for (let i = 0; i < 4; i++) line(g, 0, 4 + i * 8, 32, 4 + i * 8, c2, 1);
  } else if (style === 'stone') {
    for (let i = 0; i < 8; i++) {
      const x = (i * 5) % 26, y = (i * 9) % 26;
      R(g, x, y, 7 + (i % 3) * 2, 5 + (i % 2) * 2, i % 2 ? c1 : c3);
    }
  } else if (style === 'brick') {
    for (let y = 0; y < 32; y += 8) {
      const off = (y / 8) % 2 ? 8 : 0;
      for (let x = off; x < 32; x += 16) R(g, x, y, 15, 7, c1);
      R(g, 0, y, 32, 1, c3);
    }
  } else if (style === 'tile' || style === 'hex') {
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) {
        R(g, x, y, 7, 7, (x + y) % 16 ? c1 : c3);
        R(g, x, y, 7, 1, c3);
      }
    }
  } else if (style === 'checker') {
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) if ((x / 8 + y / 8) % 2) R(g, x, y, 8, 8, c1);
    }
  } else if (style === 'carpet') {
    R(g, 0, 0, 32, 32, c1);
    R(g, 2, 2, 28, 28, c2);
    R(g, 4, 4, 24, 24, c1);
    for (let i = 0; i < 3; i++) R(g, 7 + i * 7, 8, 2, 16, c3);
  } else if (style === 'grass') {
    for (let i = 0; i < 14; i++) {
      const x = 2 + (i * 7) % 28, y = 4 + (i * 9) % 24;
      R(g, x, y, 1, 3, c3);
      R(g, x + 1, y + 1, 1, 2, c1);
    }
  } else if (style === 'sand') {
    for (let i = 0; i < 18; i++) R(g, (i * 7) % 30, (i * 11) % 30, 2, 1, c3);
  } else if (style === 'marble') {
    for (let i = 0; i < 4; i++) {
      line(g, 0, 5 + i * 7, 32, 2 + i * 8, c3, 1);
      line(g, 5 + i * 6, 0, 10 + i * 5, 32, c1, 1);
    }
  } else if (style === 'metal') {
    R(g, 0, 0, 32, 32, c1);
    for (let y = 0; y < 32; y += 8) {
      R(g, 0, y, 32, 1, c2);
      for (let x = 4; x < 32; x += 8) R(g, x, y + 3, 2, 2, c3);
    }
  } else if (style === 'mosaic') {
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) R(g, x, y, 7, 7, (x * 3 + y * 5) % 3 ? c1 : c3);
    }
  } else if (style === 'prismatic') {
    const cols = [c1, c2, c3, '#e0c060', '#d04a3a', '#5aa04a'];
    for (let x = 0; x < 32; x++) R(g, x, 0, 1, 32, cols[Math.floor(x / 6) % cols.length]);
    for (let i = 0; i < 4; i++) R(g, 4 + i * 8, 6 + (i % 2) * 14, 2, 2, '#ffffff');
  } else if (style === 'snow') {
    R(g, 0, 0, 32, 32, '#f0f8ff');
    for (let i = 0; i < 16; i++) R(g, (i * 7) % 30, (i * 11) % 30, 2, 2, c3);
  } else if (style === 'lava') {
    R(g, 0, 0, 32, 32, c2);
    for (let i = 0; i < 6; i++) {
      line(g, (i * 7) % 32, 0, 10 + (i * 5) % 20, 32, c1, 1);
      R(g, 6 + i * 4, 8 + (i % 3) * 7, 3, 2, c3);
    }
  } else if (style === 'water') {
    for (let y = 0; y < 32; y += 4) {
      for (let x = 0; x < 32; x += 8) line(g, x, y + (x % 8 ? 1 : 0), x + 6, y, c3, 1);
    }
  } else if (style === 'stars') {
    for (let i = 0; i < 6; i++) {
      const x = 5 + (i * 7) % 22, y = 5 + (i * 9) % 22;
      R(g, x, y, 1, 3, c3);
      R(g, x - 1, y + 1, 3, 1, c3);
    }
  } else {
    R(g, 0, 0, 32, 32, c1);
  }
  const hh = hashOf(it.id);
  R(g, 5 + hh % 20, 5 + Math.floor(hh / 20) % 20, 1, 2, TRIMS[hh % TRIMS.length]);
}

/* ---------------- 导出 ---------------- */

export function drawFurnitureIcon(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? INTERIOR_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  switch (it.style) {
    case 'chair': drawChair(g, it); break;
    case 'armchair': drawArmchair(g, it); break;
    case 'stool': drawStool(g, it); break;
    case 'couch': drawCouch(g, it); break;
    case 'table': drawTable(g, it); break;
    case 'bed': drawBed(g, it); break;
    case 'dresser': drawDresser(g, it); break;
    case 'shelf': drawShelf(g, it); break;
    case 'cabinet': drawCabinet(g, it); break;
    case 'chest': drawChest(g, it); break;
    case 'fridge': drawFridge(g, it); break;
    case 'lamp': drawLamp(g, it, false); break;
    case 'ceiling_lamp': drawLamp(g, it, true); break;
    case 'candle': drawCandle(g, it); break;
    case 'fireplace': drawFireplace(g, it); break;
    case 'plant': drawPlant(g, it); break;
    case 'painting': drawPainting(g, it); break;
    case 'mirror': drawMirror(g, it); break;
    case 'clock': drawClock(g, it); break;
    case 'globe': drawGlobe(g, it); break;
    case 'telescope': drawTelescope(g, it); break;
    case 'statue': drawStatue(g, it); break;
    case 'tank': drawTank(g, it); break;
    case 'stove': drawStove(g, it); break;
    case 'sink': drawSink(g, it); break;
    case 'counter': drawCounter(g, it); break;
    case 'rug': drawRug(g, it); break;
    case 'fountain': drawFountain(g, it); break;
    case 'scarecrow': drawScarecrow(g, it); break;
    case 'torch': drawTorch(g, it); break;
    case 'tv': drawTV(g, it); break;
    case 'computer': drawComputer(g, it); break;
    case 'sewing': drawSewing(g, it); break;
    case 'piano': drawPiano(g, it); break;
    case 'jukebox': drawJukebox(g, it); break;
    case 'arcade': drawArcade(g, it); break;
    case 'plush': drawPlush(g, it); break;
    case 'orb': drawOrb(g, it); break;
    case 'model': drawModel(g, it); break;
    case 'anchor': drawAnchor(g, it); break;
    case 'sign': drawSign(g, it); break;
    case 'birdbath': drawBirdbath(g, it); break;
    default: drawTable(g, it); break;
  }
  /* 家具上的小雕花，避免同版型同配色完全一样 */
  const hh = hashOf(it.id);
  const trim = TRIMS[hh % TRIMS.length];
  R(g, 8 + hh % 22, 8 + Math.floor(hh / 22) % 20, 1, 1, trim);
  g.restore();
}

export function drawWallpaperTile(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? INTERIOR_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  wallPattern(g, it);
  g.restore();
}

export function drawFloorTile(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? INTERIOR_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  floorPattern(g, it);
  g.restore();
}

export function drawInteriorIcon(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? INTERIOR_MAP[item] : item;
  if (!it) return;
  if (it.group === 'wallpaper') drawWallpaperTile(g, it, phase);
  else if (it.group === 'floor') drawFloorTile(g, it, phase);
  else drawFurnitureIcon(g, it, phase);
}
