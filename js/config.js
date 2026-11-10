/* js/config.js —— 由 index.html 拆分，原行 1122–2293 */
'use strict';

import { CROPS as ANIM_CROPS } from './anim/sdv-crops.js';
import { FRUIT_TREES } from './anim/trees.js';
import { MINERALS } from './anim/minerals.js';
import { FISH as ANIM_FISH } from './anim/fish.js';
import { ARTISANS } from './anim/artisan.js';
import { DISHES, DISH_MAP } from './anim/dishes.js';
import { RECIPES as ANIM_RECIPES } from './anim/recipes.js';
import { ACHIEVEMENTS as ANIM_ACHIEVEMENTS } from './anim/achievements.js';
import { BUNDLES as ANIM_BUNDLES, BUNDLE_ROOMS, bundleRoomName } from './anim/bundles.js';
import { NPCS as ANIM_NPCS } from './anim/npcs.js';
import { SPECIAL_NPCS as ANIM_SPECIAL_NPCS } from './anim/special-npcs.js';
import { WEAPONS, RINGS, BOOTS } from './anim/equipment.js';

/* === 1.CONFIG === */
/* 所有可调数字都来自这里 —— 改这一个对象即可调整个游戏 */

/* 地块类型（放在 CONFIG 之前：工具表要引用它们） */
const T = {GRASS:0, DIRT:1, WATER:2, TREE:3, ROCK:4, FLOWER:5, HOUSE:6, SHOP:7,
           TILLED:8, WATERED:9, BARE:10,
           /* 第 14 轮：可采集物（长在草地上，走上去不挡路，按 E 采集） */
           WILDFLOWER:11, MUSHROOM:12, BERRY:13,
           /* 第 17 轮：节日装饰（只出现在广场，跨天自动还原成 baseMap） */
           FEST_BANNER:14, FEST_STALL:15, FEST_LANTERN:16,
           /* 第 24 轮：镇上的房子是地图上的格子（外墙 / 门 / 室内墙 / 木地板 / 石板路） */
           BLD:17, DOOR:18, WALL:19, FLOOR:20, PATH:21,
           /* 第 25 轮：墙分前后 —— 前墙（玩家在屋里时半透明，免得挡视线）/ 后墙（永远不透明） */
           WALL_FRONT:22, WALL_BACK:23};

const CONFIG = {
  VERSION: 'v0.1',          // 版本号（显示在左上角）

  /* 逻辑分辨率（画布内部像素，与屏幕缩放无关） */
  VIEW_W: 960,                // 逻辑宽度（画布内部像素，16:9）
  VIEW_H: 540,                // 逻辑高度（画布内部像素）

  /* 初始金币 */
  INIT_GOLD: 100,

  /* 体力：干活掉体力，睡觉回满；为 0 时干不了活（只能走路） */
  STAMINA: {
    MAX: 100,               // 体力上限
    LOW: 20,                // 低于这个值体力条变红闪烁
    RUN_PER_SEC: 2,         // 奔跑：每秒消耗
    TOOL_COST: {            // 各动作消耗（简报给的：锄地3 浇水1 砍树4 敲石4 收获1 奔跑2/秒）
      hoe: 3,               // 锄地
      can: 1,               // 浇水
      axe: 4,               // 砍树
      pick: 4,              // 敲石
      sickle: 2,            // 清理枯萎作物（简报未列，取 2）
      harvest: 1            // 收获
    }
  },

  /* 睡觉：走到小屋 CONFIG.SLEEP.RANGE 格内按 E */
  SLEEP: {
    RANGE: 1.5,             // 交互距离（格）
    FADE_OUT: 0.8,          // 淡出（秒）
    HOLD: 0.8,              // 全黑停留（秒）
    FADE_IN: 0.8,           // 淡入（秒）
    TITLE: 2.2,             // 「第 N 天」标题停留（秒）
    FAINT_PENALTY: 0.2      // 强制昏睡惩罚：次日体力上限 -20%
  },

  /* 世界 */
  TILE: 32,                 // 每格像素
  MAP_W: 64,                // 地图宽（格）
  MAP_H: 64,                // 地图高（格）
  SEED: 20240613,           // 随机种子（同种子 → 同一张地图）

  /* 地图生成 */
  GEN: {
    FARM_W: 12,             // 中央空地宽（格）
    FARM_H: 12,             // 中央空地高（格）
    HOUSE_W: 3, HOUSE_H: 2, // 小屋尺寸（格）
    SHOP_W: 2,  SHOP_H: 2,  // 商店摊尺寸（格）
    WATER_LEVEL: 0.66,      // 噪声高于此值 → 水
    NOISE_FREQ: 0.11,       // 水体噪声频率（大团块）
    NOISE_FREQ2: 0.045,     // 水体噪声频率（大尺度）
    DIRT_PATCHES: 7,        // 泥土斑块数量
    TREE_CHANCE: 0.075,     // 草地长树概率
    ROCK_CHANCE: 0.05,      // 草地出石概率
    FLOWER_CHANCE: 0.06     // 草地开花概率
  },

  /* 玩家 */
  PLAYER: {
    SPEED: 78,              // 步行速度（像素/秒）
    RUN_MULT: 1.6,          // 奔跑倍率（Shift）
    BODY_W: 16,             // 体型宽
    BODY_H: 24,             // 体型高
    BOX_W: 12,              // 碰撞盒宽（脚部）
    BOX_H: 16,              // 碰撞盒高（脚部）
    ANIM_FPS: 8             // 走路摆腿帧率
  },

  /* 摄像机 */
  CAMERA: { SMOOTH: 7 },    // 跟随缓动（越大越跟手）

  /* 时间：1 游戏日 = 现实 DAY_MINUTES 分钟；6:00 天亮 → 20:00 入夜 → 2:00 强制结束一天 */
  DAY_MINUTES: 6,           // 1 游戏日 = 现实 6 分钟
  DAY_START_HOUR: 6,        // 天亮
  DAY_END_HOUR: 2,          // 强制结束（次日）
  DAY_END_HOLD: 1.2,        // 停在 2:00 多久再翻到次日 6:00（现实秒）
  SKY_SMOOTH: 3,            // 昼夜色平滑系数（越大越快，越小越柔）

  /* 季节 */
  SEASONS: ['春','夏','秋','冬'],
  DAYS_PER_SEASON: 10,      // 每季几天（第 6 轮由 7 调成 10：南瓜 7 天 / 番茄 6+2 天要能在当季走完）
  SEASON_TINT: {            // 地面色调（覆盖在地面上，越大越明显）；c=颜色 a=不透明度
    '春': {c:'#7fd05a', a:0.10},   // 春：淡绿
    '夏': {c:'#2f8f22', a:0.18},   // 夏：深绿
    '秋': {c:'#c8862f', a:0.22},   // 秋：土黄
    '冬': {c:'#e8f1fb', a:0.40}    // 冬：冷白
  },

  /* 昼夜染色关键帧：h=一天中的小时，c=叠加色，a=透明度，v=暗角强度 */
  SKY: [
    {h:0.0,  c:'#081432', a:0.55, v:1.00},   /* 深夜 */
    {h:4.5,  c:'#0d1c40', a:0.52, v:0.92},
    {h:6.0,  c:'#ff9a4d', a:0.30, v:0.45},   /* 清晨暖橙 */
    {h:8.0,  c:'#ffc98a', a:0.10, v:0.12},
    {h:11.0, c:'#ffffff', a:0.00, v:0.00},   /* 白天透明 */
    {h:16.0, c:'#ffffff', a:0.00, v:0.00},
    {h:17.5, c:'#ff9a4d', a:0.22, v:0.25},   /* 黄昏橙 */
    {h:19.0, c:'#e0503a', a:0.40, v:0.60},   /* 黄昏橙红 */
    {h:20.5, c:'#101f4a', a:0.55, v:0.95},   /* 入夜深蓝 */
    {h:24.0, c:'#081432', a:0.55, v:1.00}
  ],

  /* 夜间暗角（以玩家为中心的径向渐变）：DAY_R 白天半径 / NIGHT_R 夜晚半径 / NIGHT_A 夜晚浓度 */
  VIGNETTE: { DAY_R: 760, NIGHT_R: 240, NIGHT_A: 0.55 },

  /* 天气：每天早晨随机（带权重）；影响画面、音效，也影响玩法（雨天自动浇水 / 雪天减速）
   * 字段：id 内部 id / name 显示名 / icon 图标 / w 随机权重（越大越常见） */
  WEATHER: [
    { id:'sun',  name:'晴', icon:'☀', w:6 },   // 晴天（权重最高）
    { id:'rain', name:'雨', icon:'🌧', w:3 },   // 雨天（下雨声 + 雨滴 + 自动浇水）
    { id:'snow', name:'雪', icon:'❄', w:1 }    // 雪天（最少见；移动变慢）
  ],
  /* 第 28 轮：天气预报（日历显示未来 N 天 + HUD 明日天气，队列随翻天推进） */
  FORECAST: {
    DAYS: 7                   // 预报队列长度（日历用其中 6 天：明天 ~ 第 7 天）
  },
  /* 天气粒子：数量 / 速度（像素每秒）+ 天气对玩法的影响 */
  WEATHER_FX: {
    RAIN_COUNT: 130,        // 同屏雨滴数量
    SNOW_COUNT: 90,         // 同屏雪花数量
    RAIN_SPEED: 560,        // 雨滴下落速度
    SNOW_SPEED: 42,         // 雪花下落速度
    RAIN_AUTO_WATER: true,  // 雨天：夜里结算时把所有耕地自动浇一遍（当天照常生长）
    SNOW_SLOW: 0.75         // 雪天：移动速度倍率（0.75 = 慢 25%）
  },

  /* 暂停（为 true 时时间/天气/角色全部冻结） */
  PAUSE_KEY: 'p',

  /* 背包 / 快捷栏 */
  INVENTORY: {
    SLOTS: 24,            // 背包格数
    HOTBAR: 8,            // 快捷栏格数（= 背包前 8 格，联动方案）
    STACK_MAX: 99,        // 默认最大堆叠数
    /* 初始物品（按顺序填入背包前几格；前 8 格即快捷栏）
     * 第 31 轮：参考星露谷官方开局，六件工具直接给齐（锄头 / 水壶 / 斧头 / 镐 / 镰刀 / 鱼竿） */
    START_LOADOUT: [
      { id:'hoe', n:1 }, { id:'can', n:1 }, { id:'axe', n:1 },
      { id:'pick', n:1 }, { id:'sickle', n:1 }, { id:'rod', n:1 },
      { id:'steel_smallsword', n:1 },
      { id:'seed_parsnip', n:10 }, { id:'seed_potato', n:5 },
      { id:'seed_cauliflower', n:3 }, { id:'seed_tulip', n:3 }
    ]
  },

  /* 商店：站在商店摊 CONFIG.SHOP.RANGE 格内按 E 打开 */
  SHOP: {
    RANGE: 1.5,             // 交互距离（格）
    PRICE_FLUCT: 0.15,      // 价格浮动 ±15%
    SEASON_COEF: {          // 季节系数（乘在基础价上）
      '春':1.00, '夏':1.05, '秋':1.10, '冬':0.90
    },
    GOLD_PULSE_MS: 450,     // 金币跳动动画时长（毫秒）
    CAN_MAX_LEVEL: 2,       // 水壶最多扩容几次（20 → 30 → 40）
    /* 可购买清单：种子随时可买；工具一次性（已拥有则置灰）；水壶扩容是升级项
     * price = 基础价（实际成交价还会乘季节系数、再按 ±PRICE_FLUCT 浮动） */
    BUY: [
      { id:'seed_radish',  price:10 },   // 萝卜种子
      { id:'seed_potato',  price:20 },   // 土豆种子
      { id:'seed_tomato',  price:30 },   // 番茄种子
      { id:'seed_pumpkin', price:40 },   // 南瓜种子
      { id:'axe',          price:60 },   // 斧头（一次性）
      { id:'pick',         price:50 },   // 镐（一次性）
      { id:'sickle',       price:40 },   // 镰刀（一次性）
      { id:'rod',          price:60 },   // 鱼竿（一次性，第 14 轮）
      { id:'can_upgrade',  price:80 },   // 水壶扩容（+10 容量）
      { id:'feed',         price:8  },   // 饲料（第 15 轮，喂动物）
      { id:'chicken',      price:120, animal:'chicken' },  // 鸡（第 15 轮，需要先建鸡舍）
      { id:'cow',          price:260, animal:'cow' }       // 牛（第 15 轮，需要先建牛棚）
    ]
  },

  /* 建造：按 B 进入建造模式；左键放置（扣材料），右键拆除（返还 50% 材料）
   * 配方：木栅栏(木3，挡路) / 木箱(木8，8 格储物) / 石板路(石2，叠加层，走上去更快) /
   *       洒水器(木5+石5，每天早上自动浇周围 3×3) */
  BUILD: {
    RANGE: 5,                 // 建造交互距离（格）
    REFUND: 0.5,              // 拆除返还比例
    ROAD_MULT: 1.3,           // 石板路上的移动速度倍率
    CHEST_SLOTS: 8,           // 木箱储物格数
    SPRINKLER_RANGE: 1,       // 洒水器覆盖半径（格）→ 3×3
    RECIPES: [                 // 建造配方表（建造面板按这个顺序显示）
      { id:'fence',     name:'木栅栏', cost:{wood:3},           solid:true  },  // 挡住去路
      { id:'chest',     name:'木箱',   cost:{wood:8},           solid:true  },  // 8 格储物
      { id:'path',      name:'石板路', cost:{stone:2},          overlay:true },  // 叠加层，走得更快
      { id:'sprinkler', name:'洒水器', cost:{wood:5, stone:5} },               // 每天早上浇 3×3
      /* 第 15 轮：动物棚舍（实体，挡路；里面还有动物时拆除会被拦下） */
      { id:'coop',      name:'鸡舍',   cost:{wood:12},          solid:true  },  // 住 4 只鸡
      { id:'barn',      name:'牛棚',   cost:{wood:20, stone:6}, solid:true  },  // 住 3 头牛
      /* 第 19 轮：加工台（把原料做成高价成品；可以放多台，各自独立工作） */
      { id:'maker',     name:'加工台', cost:{wood:10, stone:5}, solid:true  },
      /* 第 20 轮：终局自动化 —— 铱质洒水器 / 稻草人 / 自动采集箱 */
      { id:'irrigator', name:'铱质洒水器', cost:{stone:20}, gold:500 },       // 5×5 自动浇水；30% 概率额外长一阶段
      { id:'scarecrow', name:'稻草人', cost:{wood:6, stone:2}, solid:true },   // 保护周围作物不被乌鸦破坏
      { id:'autobox',   name:'自动采集箱', cost:{wood:8, stone:4}, solid:true } // 每天早上把附近棚舍的动物产出收进来
    ]
  },

  /* 存档（第 11 轮）：localStorage 单档位，刷新页面不丢进度
   * KEY      localStorage 键名
   * VERSION  存档版本号；与存档里的 v 对不上时，标题界面会提示并可选择重置
   * AUTO_*   自动存档的时机 */
  SAVE: {
    KEY: 'farm_save_v1',      // localStorage 键名（多槽位时槽 1 仍用这个键，不能改名）
    VERSION: 15,              // 存档版本号（第 29 轮 +1：opt 设置项）
    SLOTS: 3,                 // 存档槽位数量（槽 1 = KEY，槽 2/3 = KEY + '_s2' / '_s3'）
    AUTO_NEW_DAY: true,       /* 每天开始时自动存档 */
    AUTO_UNLOAD: true,        /* 关闭 / 刷新页面前自动存档 */
    MAX_BYTES: 100 * 1024     /* 存档体积上限（超出会在提示里说明） */
  },

  /* 设置（第 29 轮）：界面缩放 / 减少动画 / 调试显示；全部可持久化到存档 opt */
  SETTINGS: {               /* 第 29 轮设置项 */
    UI_SCALE: 100,          // 界面缩放（90 / 100 / 110）
    REDUCE_MOTION: false,   // 减少动画（关掉面板开合与过渡）
    SHOW_FPS: false,        // 左上角 FPS / 版本面板（默认隐藏）
    DEBUG_LOG: false        // 控制台调试日志（默认关闭）
  },

  /* 物品定义表（背包 / 快捷栏的唯一数据源）
   * stack=true 可堆叠；max 单格最大数量（默认 STACK_MAX=99）
   * kind 决定左键行为：
   *   'tool'     工具（tool = TOOLS 表里的 id）
   *   'seed'     种子（crop = 作物 id）
   *   'material' 材料（木材/石材）
   *   'crop'     收获的作物（crop = 作物 id）
   *   'currency' 金币：单独存数字，不占格
   * 显示名与图标在这里，TOOLS 表只管行为，避免两处各写一份 */
  ITEMS: {
    wood:  { id:'wood',  name:'木材', icon:'🌲', stack:true,  max:99, kind:'material', price:8 },
    // 木材：砍树得到，建造材料
    stone: { id:'stone', name:'石材', icon:'⛰️', stack:true,  max:99, kind:'material', price:12 },
    // 石材：敲石头得到，铺路 / 洒水器材料
    gold:  { id:'gold',  name:'金币', icon:'💰', stack:false, max:1,  kind:'currency' },
    // 金币：不占格子，只是个数字
    hoe:   { id:'hoe',   name:'锄头', icon:'🔨', stack:false, max:1,  kind:'tool', tool:'hoe' },
    // 锄头：开垦草地
    can:   { id:'can',   name:'水壶', icon:'💧', stack:false, max:1,  kind:'tool', tool:'can' },
    // 水壶：给耕地浇水
    axe:   { id:'axe',   name:'斧头', icon:'🪓', stack:false, max:1,  kind:'tool', tool:'axe' },
    // 斧头：砍树
    pick:  { id:'pick',  name:'镐',   icon:'⛏️', stack:false, max:1,  kind:'tool', tool:'pick' },
    // 镐：敲碎岩石
    sickle:{ id:'sickle',name:'镰刀', icon:'🌾', stack:false, max:1,  kind:'tool', tool:'sickle' },
    // 镰刀：清理枯萎作物 / 野花
    rod:   { id:'rod',   name:'鱼竿', icon:'🎣', stack:false, max:1,  kind:'tool', tool:'rod' },
    // 鱼竿（第 14 轮）：站在水边选中后左键抛竿
    seed_radish:  { id:'seed_radish',  name:'萝卜种子', icon:'🥕', stack:true, max:99, kind:'seed', crop:'radish' },
    // 萝卜种子（春）
    seed_potato:  { id:'seed_potato',  name:'土豆种子', icon:'🥔', stack:true, max:99, kind:'seed', crop:'potato' },
    // 土豆种子（春）
    seed_tomato:  { id:'seed_tomato',  name:'番茄种子', icon:'🍅', stack:true, max:99, kind:'seed', crop:'tomato' },
    // 番茄种子（夏）
    seed_pumpkin: { id:'seed_pumpkin', name:'南瓜种子', icon:'🎃', stack:true, max:99, kind:'seed', crop:'pumpkin' },
    // 南瓜种子（秋）
    radish:  { id:'radish',  name:'萝卜', icon:'🥕', stack:true, max:99, kind:'crop', crop:'radish' },
    // 萝卜：3 天成熟，一次收完
    potato:  { id:'potato',  name:'土豆', icon:'🥔', stack:true, max:99, kind:'crop', crop:'potato' },
    // 土豆：5 天成熟，一次收完
    tomato:  { id:'tomato',  name:'番茄', icon:'🍅', stack:true, max:99, kind:'crop', crop:'tomato' },
    // 番茄：6 天成熟，之后每 2 天可再收
    pumpkin: { id:'pumpkin', name:'南瓜', icon:'🎃', stack:true, max:99, kind:'crop', crop:'pumpkin' },
    // 南瓜：7 天成熟，一次收完
    /* 第 23 轮：优质作物（品质评分 ≥ CONFIG.QUALITY.HQ_SCORE 时产出；price = 普通 ×1.8） */
    radish_hq:  { id:'radish_hq',  name:'优质萝卜', icon:'🥕', stack:true, max:99, kind:'crop', crop:'radish',  price:63 },
    potato_hq:  { id:'potato_hq',  name:'优质土豆', icon:'🥔', stack:true, max:99, kind:'crop', crop:'potato',  price:108 },
    tomato_hq:  { id:'tomato_hq',  name:'优质番茄', icon:'🍅', stack:true, max:99, kind:'crop', crop:'tomato',  price:81 },
    pumpkin_hq: { id:'pumpkin_hq', name:'优质南瓜', icon:'🎃', stack:true, max:99, kind:'crop', crop:'pumpkin', price:216 },
    /* 第 23 轮：杂交作物（相邻种两种不同作物 → 有概率结出杂交种子） */
    seed_tomato_radish:  { id:'seed_tomato_radish',  name:'樱桃萝卜种子', icon:'🍒', stack:true, max:99, kind:'seed', crop:'tomato_radish' },
    tomato_radish:       { id:'tomato_radish',       name:'樱桃萝卜',     icon:'🍒', stack:true, max:99, kind:'crop',  crop:'tomato_radish',  price:80 },
    tomato_radish_hq:    { id:'tomato_radish_hq',    name:'优质樱桃萝卜', icon:'🍒', stack:true, max:99, kind:'crop',  crop:'tomato_radish',  price:144 },
    seed_potato_pumpkin: { id:'seed_potato_pumpkin', name:'黄金薯种子',   icon:'🍠', stack:true, max:99, kind:'seed', crop:'potato_pumpkin' },
    potato_pumpkin:      { id:'potato_pumpkin',      name:'黄金薯',       icon:'🍠', stack:true, max:99, kind:'crop',  crop:'potato_pumpkin', price:180 },
    potato_pumpkin_hq:   { id:'potato_pumpkin_hq',   name:'优质黄金薯',   icon:'🍠', stack:true, max:99, kind:'crop',  crop:'potato_pumpkin', price:324 },
    seed_tomato_pumpkin: { id:'seed_tomato_pumpkin', name:'小南瓜种子',   icon:'🧡', stack:true, max:99, kind:'seed', crop:'tomato_pumpkin' },
    tomato_pumpkin:      { id:'tomato_pumpkin',      name:'小南瓜',       icon:'🧡', stack:true, max:99, kind:'crop',  crop:'tomato_pumpkin', price:165 },
    tomato_pumpkin_hq:   { id:'tomato_pumpkin_hq',   name:'优质小南瓜',   icon:'🧡', stack:true, max:99, kind:'crop',  crop:'tomato_pumpkin', price:297 },
    /* 第 14 轮：鱼类（kind='fish'）与采集物（kind='gather'），都能卖钱、也能当礼物 */
    fish_crucian:  { id:'fish_crucian',  name:'鲫鱼',   icon:'🐟', stack:true, max:99, kind:'fish',   price:30 },
    // 鲫鱼：最常见的入门鱼
    fish_carp:     { id:'fish_carp',     name:'鲤鱼',   icon:'🐠', stack:true, max:99, kind:'fish',   price:55 },
    // 鲤鱼：春季和夏季的白天
    fish_puffer:   { id:'fish_puffer',   name:'河豚',   icon:'🐡', stack:true, max:99, kind:'fish',   price:95 },
    // 河豚：夏季正午到傍晚，晴天限定
    fish_saury:    { id:'fish_saury',    name:'秋刀鱼', icon:'🦈', stack:true, max:99, kind:'fish',   price:65 },
    // 秋刀鱼：秋天的夜里
    fish_moon:     { id:'fish_moon',     name:'月影鱼', icon:'🌙', stack:true, max:99, kind:'fish',   price:180 },
    // 月影鱼：雨天夜里才现身，稀有度最高
    fish_koi:      { id:'fish_koi',      name:'锦鲤',   icon:'🎏', stack:true, max:99, kind:'fish',   price:160 },
    // 锦鲤：春夏季的雨天白天
    fish_ice:      { id:'fish_ice',      name:'冰鲈',   icon:'🧊', stack:true, max:99, kind:'fish',   price:70 },
    // 冰鲈：冬天的白天
    fish_wintercarp:{id:'fish_wintercarp',name:'冬鲫',  icon:'❄️', stack:true, max:99, kind:'fish',   price:110 },
    // 冬鲫：冬天的夜里
    wildflower:{ id:'wildflower', name:'野花', icon:'🌸', stack:true, max:99, kind:'gather', price:18 },
    // 野花：春夏草地上刷新
    mushroom:  { id:'mushroom',   name:'蘑菇', icon:'🍄', stack:true, max:99, kind:'gather', price:26 },
    // 蘑菇：秋季草地上刷新
    berry:     { id:'berry',      name:'浆果', icon:'🍓', stack:true, max:99, kind:'gather', price:22 },
    // 浆果：夏秋草地上刷新
    /* 第 15 轮：饲料 + 动物产物（kind='animal'，能卖、能当礼物） */
    feed:      { id:'feed',      name:'饲料',   icon:'🌾', stack:true, max:99, kind:'material', price:8 },
    // 饲料：商店买 / 镰刀割草地获得，喂动物用
    egg:       { id:'egg',       name:'鸡蛋',   icon:'🥚', stack:true, max:99, kind:'animal', price:30 },
    // 鸡蛋：鸡每天产
    egg_hq:    { id:'egg_hq',    name:'优质蛋', icon:'🥚', stack:true, max:99, kind:'animal', price:54 },
    // 优质蛋：好感越高越容易出（售价 = 鸡蛋 ×1.8）
    milk:      { id:'milk',      name:'牛奶',   icon:'🥛', stack:true, max:99, kind:'animal', price:60 },
    // 牛奶：牛每天产
    milk_hq:   { id:'milk_hq',   name:'优质奶', icon:'🥛', stack:true, max:99, kind:'animal', price:108 },
    // 优质奶：好感越高越容易出（售价 = 牛奶 ×1.8）
    /* 第 19 轮：加工成品（kind='food'：能卖、能送人；右键吃一份可回体力，每天限 3 次）
     * price 经过平衡：成品售价比原料总价高 60%~120% */
    cake:          { id:'cake',          name:'蛋糕',     icon:'🍰', stack:true, max:99, kind:'food', price:150 },
    // 蛋糕：鸡蛋 + 牛奶
    ketchup:       { id:'ketchup',       name:'番茄酱',   icon:'🥫', stack:true, max:99, kind:'food', price:230 },
    // 番茄酱：番茄 ×3
    pumpkin_pie:   { id:'pumpkin_pie',   name:'南瓜派',   icon:'🥧', stack:true, max:99, kind:'food', price:450 },
    // 南瓜派：南瓜 ×2 + 鸡蛋
    charcoal:      { id:'charcoal',      name:'木炭',     icon:'⚫', stack:true, max:99, kind:'food', price:34 },
    // 木炭：木材 ×5（一次出 2 个）
    cheese:        { id:'cheese',        name:'奶酪',     icon:'🧀', stack:true, max:99, kind:'food', price:200 },
    // 奶酪：牛奶 ×2
    jam:           { id:'jam',           name:'果酱',     icon:'🍯', stack:true, max:99, kind:'food', price:150 },
    // 果酱：浆果 ×4
    pickled_radish:{ id:'pickled_radish',name:'腌萝卜',   icon:'🥬', stack:true, max:99, kind:'food', price:180 },
    // 腌萝卜：萝卜 ×3
    dried_fish:    { id:'dried_fish',    name:'鱼干',     icon:'🐟', stack:true, max:99, kind:'food', price:100 },
    // 鱼干：鲫鱼 ×2
    mushroom_soup: { id:'mushroom_soup', name:'蘑菇浓汤', icon:'🍲', stack:true, max:99, kind:'food', price:240 },
    // 蘑菇浓汤：蘑菇 ×3 + 牛奶
    woodcarving:   { id:'woodcarving',   name:'木雕',     icon:'🗿', stack:true, max:99, kind:'food', price:110 }
  },

  /* 工具行为表：名字/图标在 ITEMS 表，这里只管「作用在什么地块、产出什么」
   * accepts  可作用的地块类型；to  作用后变成的地块；out  产出物品 {item,n}
   * cost     体力消耗（本轮不做体力，先留 0）；sfx  音效频率（每个工具音高不同）
   * crop     种子对应的作物 id */
  TOOLS: [
    { id:'hoe',    accepts:[T.GRASS, T.DIRT],     to:T.TILLED,  out:null,               cost:0, msg:'开垦了一块地',   sfx:196 },
    // 锄头：草/土 → 耕地
    { id:'can',    accepts:[T.TILLED, T.WATERED], to:T.WATERED, out:null,               cost:0, msg:'浇好了水',       sfx:784 },
    // 水壶：耕地 → 湿土
    { id:'axe',    accepts:[T.TREE],              to:T.GRASS,   out:{item:'wood', n:2}, cost:0, msg:'砍倒了一棵树',   sfx:294 },
    // 斧头：树 → 草地，出 2 木材
    { id:'pick',   accepts:[T.ROCK],              to:T.DIRT,    out:{item:'stone',n:2}, cost:0, msg:'敲碎了一块岩石', sfx:147 },
    // 镐：岩石 → 泥土，出 2 石材
    { id:'sickle', accepts:[T.FLOWER, T.GRASS],   to:T.BARE,    out:null,               cost:0, msg:'清理了地面',     sfx:988 },
    // 镰刀：野花/草地 → 空地
    { id:'seed_radish',  crop:'radish',  accepts:[T.TILLED], to:T.TILLED, out:null, cost:0, msg:'播下了萝卜', sfx:523 },
    // 萝卜种子：只能种在耕地上
    { id:'seed_potato',  crop:'potato',  accepts:[T.TILLED], to:T.TILLED, out:null, cost:0, msg:'播下了土豆', sfx:494 },
    // 土豆种子
    { id:'seed_tomato',  crop:'tomato',  accepts:[T.TILLED], to:T.TILLED, out:null, cost:0, msg:'播下了番茄', sfx:587 },
    // 番茄种子
    { id:'seed_pumpkin', crop:'pumpkin', accepts:[T.TILLED], to:T.TILLED, out:null, cost:0, msg:'播下了南瓜', sfx:392 },
    // 南瓜种子
    /* 第 23 轮：杂交种子（种出来的是杂交作物） */
    { id:'seed_tomato_radish',  crop:'tomato_radish',  accepts:[T.TILLED], to:T.TILLED, out:null, cost:0, msg:'播下了樱桃萝卜', sfx:561 },
    { id:'seed_potato_pumpkin', crop:'potato_pumpkin', accepts:[T.TILLED], to:T.TILLED, out:null, cost:0, msg:'播下了黄金薯',   sfx:470 },
    { id:'seed_tomato_pumpkin', crop:'tomato_pumpkin',  accepts:[T.TILLED], to:T.TILLED, out:null, cost:0, msg:'播下了小南瓜',   sfx:520 }
  ],

  /* 作物表：每季一种；days=需要浇水的生长天数；regrow=收获后再次成熟需要的天数（0=不再结果）
   * seedCost/sell 供第 10 轮商店用（seedCost 也已写进作物/种子的物品定义里） */
  CROPS: [
    { id:'radish',  name:'萝卜', icon:'🥕', season:'春', days:3, seedCost:10, sell:35,  regrow:0, ripe:'#e0556b', unripe:'#d8b0a8', leaf:'#4aa03c' },
    // 萝卜：3 天成熟，一次收完
    { id:'potato',  name:'土豆', icon:'🥔', season:'春', days:5, seedCost:20, sell:60,  regrow:0, ripe:'#b98a4b', unripe:'#c9b58c', leaf:'#3f9440' },
    // 土豆：5 天成熟，一次收完
    { id:'tomato',  name:'番茄', icon:'🍅', season:'夏', days:6, seedCost:30, sell:45,  regrow:2, ripe:'#e03a24', unripe:'#c9d17a', leaf:'#2f8f34' },
    // 番茄：6 天成熟，之后每 2 天可再收
    { id:'pumpkin', name:'南瓜', icon:'🎃', season:'秋', days:7, seedCost:40, sell:120, regrow:0, ripe:'#e07a1f', unripe:'#b8bf72', leaf:'#3a8c32' }
    // 南瓜：7 天成熟（第 21 轮由 8 调成 7：缩短秋季「只剩等南瓜」的空窗），一次收完
  ],

  /* 作物视觉：4 个阶段的株高（像素）与叶片大小 */
  CROP_ART: {
    STAGE_H:  [5, 10, 15, 20],      /* 阶段 0~3 的株高 */
    LEAF_W:  [3, 6, 9, 12],         /* 叶片宽度 */
    DEAD_COLOR:'#9c8340', DEAD_LEAF:'#a8913f', DEAD_STEM:'#7a6234'  // 枯萎：枯黄配色
  },

  /* ---------- 第 23 轮 · 背包一键整理 ---------- */
  SORT: {
    ORDER: 'id',        // 排序依据：按物品 id 字典序（稳定）
    MERGE: true,        // 先把同 id 的堆叠合并（并进最靠前的那一格）
    KEEP_HOTBAR: true   // 快捷栏（前 HOTBAR 格）保持原位，只整理背包区
  },

  /* ---------- 第 23 轮 · 作物品质（浇水完整度 + 当季 + 节日 + 土壤肥力） ---------- */
  QUALITY: {
    WEIGHT: {water:0.35, season:0.25, soil:0.25, fest:0.15},  // 四个因子加权
    HQ_SCORE: 0.90,     // 评分 ≥ 这个值 → 优质（售价 ×1.8；要土肥 + 天天浇水 + 当季）
    HQ_MULT: 1.8,       // 优质作物售价倍率
    SEASON_SECONDARY: 0.7,  // 次季播种（只有杂交作物有次季）的当季折扣
    FEST_NORMAL: 0.35,  // 非节日当天的「节日」因子
    SOIL: {START:70, MAX:100, MIN:0, HARVEST:-6, ROTATE:8, DAILY:3}
    // 土壤肥力：收获消耗 / 和邻居种不同作物（轮作）恢复 / 每天自然恢复
  },

  /* ---------- 第 23 轮 · 小地图（右上角，评级 HUD 下方） ---------- */
  MINIMAP: {
    SIZE: 96,           // 边长（像素）：农场区 12×12 格 × 8 像素
    SCALE: 8,           // 每格占多少像素
    REFRESH: 0.5,       // 离屏画布重绘间隔（秒）
    MARGIN: 10,         // 距画布右边缘
    TOP: 66,            // 顶部 y（避开评级 HUD 的 8~32 和制作台 HUD 的 38~62）
    PLAYER:'#ffffff', NPC:'#ffd76a', HOUSE:'#e8a45c', SHOP:'#7fd4ff',
    /* 第 25 轮：NPC 点按当前状态着色 */
    NPC_OPEN:'#ffd76a',    // 营业中（黄点）
    NPC_WANDER:'#ff9d5c',  // 瞎逛（橙点）
    NPC_HOME:'#7fb4ff',    // 在家（蓝点）
    NPC_ASLEEP:'#8a8a8a'   // 睡觉 / 外出（不显示）
  },

  /* ---------- 第 23 轮 · 动物繁殖 ---------- */
  BREED: {
    AFF_MIN: 80,        // 两只同物种的好感都要 ≥ 这个值
    CHANCE: 0.05,       // 每天早晨 5% 概率
    MAX_PER_DAY: 1,     // 一天最多生几只
    NEED_MATURE: true   // 必须都是成年个体
  },

  /* ---------- 第 23 轮 · NPC 来访农场 ---------- */
  VISIT: {
    HOUR_FROM: 12, HOUR_TO: 18,   // 下午来访时段
    SPOT: {dx:3, dy:5},           // 来访站位（相对农场左上角）
    PLOT: 8,                      // 每块耕地的分值
    BUILD: 25,                    // 每座建造物的分值
    DECOR: 15,                    // 每份装饰（稻草人 / 石板路）的分值
    GOLD_BASE: 60,                // 基础金币
    GOLD_PER_POINT: 2,            // 每分折算多少金币
    SEED_CHANCE: 0.7              // 附赠种子的概率
  },

  /* ---------- 第 23 轮 · 种子杂交（相邻种两种不同作物 → 有概率结出杂交种子） ---------- */
  HYBRID: {
    CHANCE: 0.18,       // 每次杂交判定成功的概率
    RECIPES: [         // 配方表：两个亲本（顺序无所谓）→ 杂交作物
      {id:'tomato_radish',   parents:['radish','tomato']},
      {id:'potato_pumpkin', parents:['potato','pumpkin']},
      {id:'tomato_pumpkin',  parents:['tomato','pumpkin']}
    ],
    /* 杂交作物定义：seasons 有两个 → 主季 + 次季（次季种品质打折） */
    CROPS: [
      {id:'tomato_radish',   name:'樱桃萝卜', icon:'🍒', season:'春', seasons:['春','夏'],
       days:4, seedCost:60, sell:80,  regrow:0, ripe:'#e0556b', unripe:'#d8b0a8', leaf:'#4aa03c'},
      // 萝卜 + 番茄：售价 = 双亲均价 ×2
      {id:'potato_pumpkin',  name:'黄金薯',   icon:'🍠', season:'春', seasons:['春','秋'],
       days:6, seedCost:90, sell:180, regrow:0, ripe:'#d8a24b', unripe:'#c9b58c', leaf:'#3f9440'},
      // 土豆 + 南瓜
      {id:'tomato_pumpkin',  name:'小南瓜',   icon:'🧡', season:'夏', seasons:['夏','秋'],
       days:5, seedCost:80, sell:165, regrow:0, ripe:'#e07a1f', unripe:'#b8bf72', leaf:'#2f8f34'}
      // 番茄 + 南瓜
    ]
  },

  /* 水壶：容量有限，站在水边右键补满（商店可以扩容） */
  WATER_CAN: {
    CAPACITY:20,       // 初始容量（壶里能装几次水）
    MAX_CAPACITY:40,   // 扩容后的上限
    UPGRADE_STEP:10,   // 每次扩容 +10
    REFILL_RANGE:1.8   // 站在多远的河边能补水（格）
  },

  /* 工具交互 */
  INTERACT: {
    RANGE_TILES: 1.8,       // 作用距离上限（玩家中心 → 目标格中心，格）
    TOAST_TIME: 1.5,        // 提示条停留时间（秒）
    TOAST_MAX: 6            // 同时最多显示几条（超出淘汰最旧的）
  },

  /* 音效（Web Audio 实时合成，零音频文件）
   * VOLUME   基础音量（所有音效以此为基准）
   * TYPE     默认波形
   * DUR      默认单音时长（秒）
   * MUTE_KEY 静音快捷键（M）
   * MUTE_START 首次进入游戏时是否默认静音 */
  AUDIO: {
    VOLUME: 0.16,           // 基础音量（0~1）
    TYPE: 'square',         // 默认波形
    DUR: 0.12,              // 默认单音时长（秒）
    MUTE_KEY: 'm',          // 静音 / 取消静音的快捷键
    MUTE_START: false,      // 首次进入游戏时是否静音
    /* 各音效参数：FREQ 基准频率 / JITTER 随机音高偏移 / DUR 时长 / VOL 相对基础音量的倍率 */
    STEP:  { FREQ:190, JITTER:70, DUR:0.05, VOL:0.45, INTERVAL:0.32 }, // 走路脚步声（每次音高随机）
    CLICK: { FREQ:660, DUR:0.05, VOL:0.55 },                              // UI 点击
    COIN:  { BUY:[880,1320], SELL:[1046,1568], DUR:0.09, VOL:0.55 },     // 买卖金币声（两个连音）
    SLEEP: { IN:520, OUT:300, DUR:0.5, VOL:0.60 },                       // 睡觉转场音（入睡 / 醒来）
    RAIN:  { TICK_MIN:0.30, TICK_MAX:0.85, VOL:0.30,                     // 雨滴滴答
             AMBIENT:true, AMBIENT_VOL:0.05 }                             // 雨声环境底噪开关
  },

  /* UI 打磨：统一面板样式 + 开合动画 */
  UI: {
    PANEL_ANIM_MS: 200,     // 面板开合动画时长（毫秒）
    PANEL_RADIUS: 10,       // 面板圆角（像素）
    SOUND_ON_CLICK: true    // 点击按钮是否播放 UI 音
  },

  /* 新手引导：第 1 天早晨依次弹出 3 条提示（移动 / 锄地播种 / 睡觉），完成即消失 */
  TUTORIAL: {
    ENABLED: true,          // 总开关
    DAY: 1,                 // 只在这一天显示
    MOVE_PX: 48,            // 累计走够多少像素算「学会移动」
    TILL_COUNT: 1,          // 开垦几块地算「学会锄地」
    SOW_COUNT: 1,           // 播下几株算「学会播种」
    SHOW_MS: 0              // 提示条停留时间（毫秒；0 = 不自动消失）
  },

  /* 系统教学提示（第 21 轮）：第一次接触某个新系统时弹一次，用位掩码记进存档，
   * 之后（含读档、重开页面）都不再出现。*/
  TIPS: {
    ENABLED: true,          // 总开关
    SHOW_MS: 6500           // 单条停留时间（毫秒，按游戏内时间冻结：开面板时暂停倒计时）
  },

  /* 交互按键提示（第 22 轮）：靠近居民 / 商店 / 委托板 / 加工台 / 动物 / 采集物时
   * 头顶的「按 E ...」浮字。可在 Esc 菜单随时关闭，关闭后不再绘制。*/
  INTERACT_HINT: {
    ENABLED: true           // 默认开启；玩家在系统菜单里可切换，状态存进存档
  },

  /* 性能：静态地面预渲染到离屏 canvas + Y 排序 */
  PERF: {
    BAKE_GROUND: true,      // 把静态地面预渲染到离屏 canvas（只有改动的格子才重绘）
    BAKE_MAX_SIDE: 2048,    // 离屏画布边长上限（像素）
    Y_SORT: true,           // 作物 / 建造物 / 玩家按脚底 Y 排序
    SHOW_MS: true           // HUD 上显示每帧渲染耗时
  },

  /* ---------- NPC 系统（第 13 轮）：小镇居民 / 对话 / 送礼 / 好感度 ----------
   * 第 25 轮起真实作息看 CONFIG.NPC_SCHED.LIST；LIST[].sched 仅作备用站位。
   * 第 27 轮新增 SPEED：NPC 改为连续移动，不再到点瞬移。 */
  NPC: {
    RANGE: 1.5,             // 交互距离（格）：走近按 E 说话
    SPEED: 100,             // 第 27 轮：NPC 走动速度（像素/秒）—— 1 格 32px ≈ 0.32 秒一格
    AFF_MAX: 100,           // 好感度上限
    /* 好感度分档（按顺序取第一个 min <= 当前好感度的档；升到新档立刻触发解锁） */
    TIERS: [
      {key:'stranger', name:'陌生', min:0},     // 刚认识
      {key:'known',    name:'熟悉', min:25},    // 聊得来
      {key:'friend',   name:'朋友', min:60},    // 解锁特权
      {key:'best',     name:'挚友', min:85}     // 最好的朋友
    ],
    UNLOCK_TIER: 'friend',  // 「朋友」这一档触发解锁效果
    GIFT: {                    // 送礼参数：好感增量 / 每天上限 / 生日倍率
      LIKE: 30,             // 喜好物品的好感增量
      NORMAL: 10,           // 普通物品的好感增量
      DISLIKE: -15,         // 厌恶物品的好感增量（负数）
      DAILY_MAX: 1,         // 每人每天最多送几次
      BIRTHDAY_MULT: 2      // 生日当天送礼好感翻倍
    },
    TYPE_MS: 26,            // 打字机效果：每个字多少毫秒
    GIFT_SEED: 'seed_pumpkin',   // 邻家女孩成为「朋友」时赠的稀有种子
    GIFT_SEED_N: 2,             // 一次赠几颗
    CARPENTER_DISCOUNT: 0.8,    // 老木匠成为「朋友」后建造材料打几折（向下取整，最少 1）
    SHOP_BONUS: {                // 老板娘成为「朋友」后的每日加购
      COUNT: 2,              // 每天额外收购几件作物
      PRICE_MULT: 1.5        // 加购部分的收购价倍率
    },
    /* 三位居民：名字 / emoji 立绘 / 备用站位 / 喜好 / 厌恶 / 生日 / 台词池 */
    LIST: [
      {
        id:'aunt', name:'杂货店老板娘', icon:'👩‍🍳', color:'#e8a45c',
        like:['radish','potato','seed_radish','seed_potato'],   // 喜欢的收成和种子
        dislike:['stone','pick'],                               // 不喜欢的硬通货
        bday:{season:'春', day:3},                              // 生日：春 3 日
        /* 户外备用站位：真实作息（在家 / 工作 / 睡觉 / 外出）看 CONFIG.NPC_SCHED.LIST */
        sched:[   // 第 24 轮：杂货店搬进镇上了，备用站位也搬到街边
          {from:0, to:24, x:9,  y:42},   // 店门口
          {from:0, to:24, x:14, y:42},   // 广场
          {from:0, to:24, x:25, y:42}    // 自家门口
        ],
        lines:{                                                  // 台词池：按好感档位分池
          stranger:['今天的萝卜刚到的，水灵得很。','要买点什么？自己挑。','嗯？你是新来的 farm 主吧。'],   // 陌生
          known:   ['又来啦？今天的天气不错。','你那块地收拾得挺像样的。','刚进了一批好种子，挑挑看。'],   // 熟悉
          friend:  ['老主顾啦！我给你留了好的。','以后你来，我给你算便宜点。','生意做久了，就图个熟。'],   // 朋友
          best:    ['你来啦？我把最好的都给你留着。','这镇上的人，我就看你顺眼。','慢慢挑，不着急。']      // 挚友
        }
      },
      {
        id:'carpenter', name:'老木匠', icon:'🧑‍🔧', color:'#c98f5a',
        like:['wood','pumpkin','seed_pumpkin','mushroom'],    // 喜欢的木料和南瓜（还有林子里的蘑菇）
        dislike:['tomato','seed_tomato'],                      // 不喜欢的番茄
        bday:{season:'夏', day:3},                              // 生日：夏 3 日
        sched:[   // 户外备用站位（真实作息见 CONFIG.NPC_SCHED.LIST）
          {from:0, to:24, x:41, y:42},   // 工棚门口
          {from:0, to:24, x:29, y:34},   // 农场西边
          {from:0, to:24, x:26, y:32}    // 田的另一头
        ],
        lines:{                                                  // 台词池：按好感档位分池
          stranger:['要木头？自己砍。','我这手艺，一榔头下去就知道好坏。','……嗯？'],                            // 陌生
          known:   ['你这木头堆得不错。','会做栅栏吗？照着图纸砍就行。','年轻人，手艺要练。'],                   // 熟悉
          friend:  ['你的活儿我包了，材料算你便宜点。','给你个忠告：木头要顺着纹路砍。','我这把老锯，还能再干二十年。'],  // 朋友
          best:    ['你想要什么，我给你打。','别人找我得排队，你不用。','木头这东西啊，认准了就别换。']           // 挚友
        }
      },
      {
        id:'girl', name:'邻家女孩', icon:'👧', color:'#e58fae',
        like:['tomato','seed_tomato','radish','wildflower','berry'],  // 喜欢的番茄、萝卜，和送她的野花 / 浆果
        dislike:['sickle','stone'],                            // 不喜欢的工具
        bday:{season:'秋', day:3},                              // 生日：秋 3 日
        sched:[   // 户外备用站位（真实作息见 CONFIG.NPC_SCHED.LIST）
          {from:0, to:24, x:31, y:30},   // 小屋东边
          {from:0, to:24, x:37, y:33},   // 田边玩
          {from:0, to:24, x:33, y:30}    // 门口
        ],
        lines:{                                                  // 台词池：按好感档位分池
          stranger:['你是新搬来的吗？','我家在那边，有空来玩。','……'],                                   // 陌生
          known:   ['你的地里的东西长得比我快。','要不要我帮你？……啊，我在浇水。','我妈说不能白吃别人家的东西。'],  // 熟悉
          friend:  ['我偷偷藏了些好种子给你！','你种的南瓜，我看着它长大的。','你人真好，下次我还来找你。'],      // 朋友
          best:    ['我把最喜欢的种子都给你了！','你以后还会一直住在镇上吧？','有你在，乡下也不闷。']            // 挚友
        }
      }
    ]
  },

  /* ---------- 城镇（第 24 轮）：建筑是地图的容器，不是场景 ----------
   * 原则 A：房子 = 外墙 + 门 + 地板 + 家具，全是 map 上的格子；踩上门格就进去
   *           不需要任何「当前场景」状态 —— 相机跟着人走就行了
   * 原则 B：NPC 的位置是时间的纯函数（天数, 小时, 天气, NPC id）→ 他在哪、在干嘛
   *           存档里不写「NPC 现在在哪」，所以读档不会错位，存档也不会变大
   * 原则 C：玩家的「扑空」必须可解释 → 门口的牌子写清楚他去哪了
   */
  TOWN: {
    ROW: 38, END_ROW: 62,     // 城镇带（38~62 行；63 行是南边的水岸）
    STREET_ROW: 42,           // 街（石板路）在第 42 行
    /* 第 26 轮：墙只有 1 格厚 —— 房子直接贴着街，屋顶不再是地图上的实体格
     *   43 行 = 后墙（中间那一格是门）/ 44~51 行 = 木地板 / 52 行 = 前墙 */
    ROOM_ROW: 43,             // 室内第一行 = 后墙
    ROOM_H: 10,               // 室内共 10 行（后墙 1 + 地板 8 + 前墙 1）
    DOOR_DX: 5,               // 门在房子里的横向偏移
    ARRIVE_DY: 1,             // 从大门进屋后落在室内第几行（门正下方）
    SIGN_DX: 8, SIGN_ROW: 41, // 门牌在大门东边两格
    /* 第 26 轮：屋顶 —— 纯渲染层（地图上没有屋顶格，只在渲染时盖一层） */
    ROOF: {
      TILE_H: 9,              // 瓦片横纹的间距（像素）
      ALPHA_INSIDE: 0,        // 玩家在屋里时屋顶的不透明度（0 = 完全掀开）
      CHIMNEY: true           // 商店屋顶带烟囱
    },
    WANDER: {                 // 营业时间也可能出门瞎逛（扑空的惊喜感）
      CHANCE: 0.22,           // 出门概率（按 天 × 时段 哈希 → 同一时段内固定）
      BLOCK: 3,               // 每 3 小时换一个判定
      HOUR_FROM: 7,           // 只在白天到夜里这段时间会出门瞎逛
      HOUR_TO: 22
    },
    /* 四栋建筑：外框 + 室内 + 营业时间 + 门牌 + 家具
     * hours = 「开门时间」：商店是营业时段，房子是主人在家的时段（to > 24 表示跨午夜） */
    LIST: [
      { id:'shop', name:'杂货店', kind:'shop', npc:'aunt', x:4, w:12,
        hours:{from:10, to:19}, sign:'杂货店',
        wander:{chance:0.26, spots:[{x:13,y:42,label:'街角'},{x:18,y:41,label:'广场'}]},
        props:[{dx:5,dy:4,type:'counter',solid:1,interact:'work'},{dx:2,dy:2,type:'shelf'},
               {dx:9,dy:2,type:'shelf'},{dx:10,dy:7,type:'barrel'},{dx:5,dy:7,type:'rug',flat:1}] },
      { id:'home_aunt', name:'老板娘的家', kind:'house', npc:'aunt', x:20, w:12,
        hours:{from:19, to:30}, sign:'老板娘家',
        wander:{chance:0.15, spots:[{x:27,y:42,label:'自家门口'},{x:13,y:42,label:'街角'}]},
        props:[{dx:2,dy:8,type:'bed',solid:1,interact:'bed'},{dx:9,dy:7,type:'table',solid:1,interact:'home'},
               {dx:10,dy:2,type:'stove',solid:1,interact:'cook'},{dx:7,dy:2,type:'chest',solid:1,interact:'chest'},
               {dx:5,dy:5,type:'rug',flat:1}] },
      { id:'home_carpenter', name:'老木匠家', kind:'house', npc:'carpenter', x:36, w:12,
        hours:{from:17, to:29}, sign:'木匠家',
        wander:{chance:0.15, spots:[{x:43,y:42,label:'自家门口'},{x:29,y:34,label:'农场西边'}]},
        props:[{dx:2,dy:8,type:'bed',solid:1,interact:'bed'},{dx:9,dy:7,type:'table',solid:1,interact:'home'},
               {dx:10,dy:2,type:'bench',solid:1,interact:'work'},{dx:6,dy:2,type:'chest',solid:1,interact:'chest'},
               {dx:3,dy:2,type:'shelf'},{dx:5,dy:5,type:'rug',flat:1}] },
      { id:'home_girl', name:'女孩家', kind:'house', npc:'girl', x:51, w:12,
        hours:{from:20, to:32}, sign:'女孩家',
        wander:{chance:0.15, spots:[{x:58,y:42,label:'自家门口'},{x:31,y:30,label:'小屋东边'}]},
        props:[{dx:2,dy:8,type:'bed',solid:1,interact:'bed'},{dx:9,dy:7,type:'desk',solid:1,interact:'home'},
               {dx:9,dy:4,type:'flowerstand',solid:1,interact:'work'},{dx:6,dy:2,type:'chest',solid:1,interact:'chest'},
               {dx:2,dy:2,type:'shelf'},{dx:5,dy:5,type:'rug',flat:1}] }
    ],
    /* 第 25 轮：作息表挪到 CONFIG.NPC_SCHED.LIST（5 种 slot 类型：
     * work / home / sleep / wander / away），这里不再重复维护一份 */
    COLORS: {
      roofHouse:'#c8703f', roofHouseLine:'#a4552c',
      roofShop:'#5b86ad', roofShopLine:'#44678a',
      roofRidge:'#e0a06a', roofEave:'#4a3018',
      wall:'#8a6242', wallLine:'#6d4a31',
      floor:'#b5844f', floorLine:'#9a6c3d',
      path:'#b9b3a6', pathLine:'#8d8779',
      door:'#7d4a22', doorDark:'#5b3a1d', doorFrame:'#e2c14a',
      sign:'#7d5426', signText:'#f4e6bc', signPost:'#5b3a1d',
      counter:'#a97a3f', counterDark:'#6d4522', counterGoods:'#e08a2a',
      bed:'#e6ddc8', bedFrame:'#7d5426', blanket:'#c05a72',
      table:'#a9713a', tableDark:'#7d4f24',
      shelf:'#8a5a2b', shelfGoods:'#8fd06a',
      plant:'#3f8f3a', pot:'#b5651d',
      rug:'#a85a4a', rugLine:'#8a4638',
      stove:'#8a8f96', stoveDark:'#5f646b', stoveFire:'#e07a2a',
      bench:'#9a6b3c', benchDark:'#6d4a27', benchTool:'#b9c3cf',
      desk:'#a9713a', deskDark:'#7d4f24',
      flowerstand:'#6f9b4a', flowerStandWood:'#7d5426',
      /* 第 25 轮：门口挂牌三态（营业中 / 休息中 / 外出中） */
      signOpen:'#5fd07a', signRest:'#8a8a8a', signAway:'#ffd76a',
      chestBox:'#8a5a2b', chestBoxDark:'#5b3a1d', chestLock:'#e2c14a'
    }
  },

  /* ---------- 第 25 轮：NPC 日程（slot 类型）/ 室内互动 / 箱子战利品 ----------
   * 日程条目 = 一个时间段的安排：
   *   type 'work'   在工作点（柜台 / 工作台 / 花摊）→ 营业中
   *   type 'home'   在家（可以聊天）
   *   type 'sleep'  睡觉（不聊天）
   *   type 'wander' 在指定区域里瞎逛
   *   type 'away'   不在镇上
   * at   = 家里那件家具的 type（bed 床 / table 桌子 / desk 书桌 / counter 柜台 / bench 工作台 / flowerstand 花摊）
   * area = 瞎逛的范围（格）
   * 跨午夜：from > to 表示跨午夜（22 → 6 点） */
  NPC_SCHED: {
    WANDER_ON_WORK: 0.20,    /* 营业时间摸鱼的概率（确定性哈希：同一天同一人同一时段固定） */
    BAD_WEATHER_OUT: true,   /* 雨雪天不出门瞎逛 */
    TICK_MIN: 4,             /* 瞎逛每隔几分钟换一次目标点 */
    LIST: {
      /* 老板娘：白班 10:00~19:00（营业时间整段都在柜台，摸鱼走哈希概率），
       * 晚上回家做饭，21 点就睡（睡得早 → 早上起得早） */
      aunt: { open:{from:10, to:19}, house:'home_aunt', work:'shop', sched:[
        {from:6,  to:10,  type:'home',   at:'table'},
        {from:10, to:14,  type:'work',   at:'counter'},
        {from:14, to:19,  type:'work',   at:'counter'},
        {from:19, to:21,  type:'home',   at:'stove'},
        {from:21, to:30,  type:'sleep',  at:'bed'}          /* 跨午夜到早上 6 点 */
      ]},
      /* 老木匠：早班 7:00~14:00（在自己家的工作台上），下午回家收拾工具，23 点睡 */
      carpenter: { open:{from:7, to:14}, house:'home_carpenter', work:'home_carpenter', sched:[
        {from:6,  to:7,   type:'home',   at:'bench'},
        {from:7,  to:11,  type:'work',   at:'bench'},
        {from:11, to:14,  type:'work',   at:'bench'},
        {from:14, to:17,  type:'home',   at:'bench'},   /* 收拾工具 */
        {from:17, to:26,  type:'home',   at:'table'},   /* 23:00~2:00 也在家（睡不着就坐一会儿） */
        {from:26, to:30,  type:'sleep',  at:'bed'}      /* 2:00~6:00 */
      ]},
      /* 邻家女孩：下午班 14:00~22:00（自己家的花摊），上午在家看书 / 上午出门，
       * 晚上在家看书看到很晚（2 点才睡）→ 夜里也总有人找得到 */
      girl: { open:{from:14, to:22}, house:'home_girl', work:'home_girl', sched:[
        {from:6,  to:10,  type:'home',   at:'desk'},
        {from:10, to:13,  type:'wander', area:{x:40, y:42, w:16, h:1}, label:'街上'},
        {from:13, to:14,  type:'home',   at:'desk'},
        {from:14, to:18,  type:'work',   at:'flowerstand'},
        {from:18, to:22,  type:'work',   at:'flowerstand'},
        {from:22, to:24,  type:'home',   at:'desk'},
        {from:0,  to:2,   type:'away',   label:'不在镇上'},   /* 深夜去亲戚家过夜 */
        {from:26, to:30,  type:'sleep',  at:'bed'}          /* 2:00~6:00 */
      ]}
    }
  },

  /* 第 25 轮：走进 NPC 家能做什么 —— 装饰文案 / 箱子战利品 */
  NPC_HOME: {
    LOOT_TIER: 'friend',     /* 要到这一档好感才能开箱子 */
    LOOT_WEEK: 7,            /* 箱子一周只能开一次（按「周序号」记） */
    /* 每种家具按 E 看一句描述（同一件家具，不同的人家文案不同） */
    DECOR: {
      shelf:       ['架子上摆着几本旧杂志，封面还印着去年的天气预报。'],
      stove:       ['灶上的汤还在咕嘟，飘出一股玉米的甜味。'],
      counter:     ['柜台的木面被磨得发亮，旁边压着一本记着赊账的小本子。'],
      table:       ['桌上摊着一张没画完的图纸，边角写着「给农场主的栅栏」。'],
      bench:       ['工作台上摆着半截还没刨完的木头，旁边是一堆卷起来的刨花。'],
      desk:        ['桌上摊着一本没看完的书，书页间夹着一片压干的野花。'],
      flowerstand: ['花架上的野花扎成一束一束，标签上写着「送给会种田的人」。'],
      chest:       ['木箱上了锁，铜锁上有一圈细细的划痕。'],
      barrel:      ['酒桶塞得很紧，桶壁上还留着几道旧年号的刻痕。'],
      rug:         ['地毯边角磨得起了毛，踩上去有点软。'],
      plant:       ['窗台上的绿萝长得很旺，垂下来几乎碰到地板。'],
      bed:         ['被子叠得很整齐，枕头上还留着压出来的凹痕。']
    },
    /* 同一个人的专属文案（覆盖 DECOR） */
    DECOR_BY_NPC: {
      aunt: { table:'桌上一只粗瓷碗还温着，碗底沉着两粒晒干的野花。',
              stove:'灶上炖着她自己种的萝卜汤，锅盖一掀就是一股甜味。' },
      carpenter: { bench:'工作台上是给农场主量好的栅栏木料，尺寸刚刚好。',
                   table:'桌上摊着一张镇子的草图，杂货店的位置被人用笔圈了起来。' },
      girl: { desk:'书摊开在写满铅笔字的那一页，题目是「南瓜要浇几次水」。',
              flowerstand:'花架上最漂亮的一束野花单独扎着，缎带系得整整齐齐。' }
    },
    /* 箱子里的东西（每周一次） */
    LOOT: {
      aunt:      [{id:'jam', n:2}, {id:'cake', n:1}, {id:'mushroom_soup', n:1}],
      carpenter: [{id:'woodcarving', n:1}, {id:'wood', n:8}, {id:'charcoal', n:3}],
      girl:      [{id:'seed_tomato', n:2}, {id:'wildflower', n:3}, {id:'seed_pumpkin', n:1}]
    }
  },

  /* ---------- 钓鱼系统（第 14 轮）：水边持竿左键 → 等待 → 咬钩 → 拉杆 ---------- */
  FISHING: {
    ROD_ID: 'rod',            // 鱼竿物品 id（商店一次性购买）
    WATER_RANGE: 1.6,         // 离水多近才能抛竿（格）
    WAIT_MIN_MS: 1000,        // 抛竿后最短等待（毫秒）
    WAIT_MAX_MS: 4000,        // 抛竿后最长等待（毫秒）
    BITE_WINDOW_MS: 800,      // 咬钩后按左键的窗口（毫秒）；错过就跑鱼
    FAIL_STAMINA_COST: 1,     // 跑鱼惩罚：体力 -1（体力为 0 时不再扣成负数）
    TYPE_CHANCE: 0.55,        // 咬钩时稀有鱼的出现权重衰减（越大越容易出稀有鱼）
    REEL: {                   // 拉杆小游戏参数：指针速度 / 绿区宽度
      SPEED: 0.85,            // 指针移动速度（占整条横条的百分比 / 秒）
      ZONE_BASE: 0.34,        // 稀有度 1 的绿色区间宽度（占整条的百分比）
      ZONE_STEP: 0.05,        // 每高一级稀有度，绿区收窄多少
      ZONE_MIN: 0.14,         // 绿区最窄不低于此值
      BAR_W: 360,             // 拉杆横条宽度（逻辑像素）
      BAR_H: 22               // 拉杆横条高度（逻辑像素）
    },
    /* 8 种鱼：季节 / 天气 / 时段三重限制；rarity 同时决定售价与绿区宽度
     * from/to 用 24 小时制，允许跨午夜（如 18 → 2） */
    LIST: [
      { id:'fish_crucian', name:'鲫鱼',   icon:'🐟', rarity:1,
        seasons:['春','夏','秋'], weather:['sun','rain','snow'], from:6,  to:18, price:30 },
      // 鲫鱼：春夏秋的白天，晴雨雪都咬钩（最常见的保底鱼）
      { id:'fish_carp',    name:'鲤鱼',   icon:'🐠', rarity:2,
        seasons:['春','夏'],      weather:['sun','rain'],         from:6,  to:18, price:55 },
      // 鲤鱼：春夏白天的晴天 / 雨天
      { id:'fish_puffer',  name:'河豚',   icon:'🐡', rarity:3,
        seasons:['夏'],           weather:['sun'],                from:12, to:18, price:95 },
      // 河豚：夏季正午到傍晚，只认晴天
      { id:'fish_saury',   name:'秋刀鱼', icon:'🦈', rarity:2,
        seasons:['秋'],           weather:['sun','rain'],         from:18, to:2,  price:65 },
      // 秋刀鱼：秋季夜里（18:00 → 次日 2:00）
      { id:'fish_moon',    name:'月影鱼', icon:'🌙', rarity:4,
        seasons:['春','夏','秋'], weather:['rain'],                from:19, to:2,  price:180 },
      // 月影鱼：雨天夜晚才出现（验收示例鱼）
      { id:'fish_koi',     name:'锦鲤',   icon:'🎏', rarity:4,
        seasons:['春','夏'],      weather:['rain'],                from:6,  to:18, price:160 },
      // 锦鲤：春夏雨天的白天
      { id:'fish_ice',     name:'冰鲈',   icon:'🧊', rarity:2,
        seasons:['冬'],           weather:['sun','snow'],         from:6,  to:18, price:70 },
      // 冰鲈：冬季白天（晴 / 雪）
      { id:'fish_wintercarp', name:'冬鲫', icon:'❄️', rarity:3,
        seasons:['冬'],           weather:['snow','rain'],        from:18, to:2,  price:110 }
      // 冬鲫：冬季夜里（雪 / 雨）；冬天总共只有冰鲈 + 冬鲫两种
    ]
  },

  /* ---------- 野外采集（第 14 轮）：野花 / 蘑菇 / 浆果按季节刷在草地上 ---------- */
  GATHER: {
    ENABLED: true,            // 总开关（关掉就不刷新采集物）
    RANGE: 1.5,               // 按 E 采集的距离（格）
    EVERY_DAYS: 3,            // 每季每隔几天刷新一次（季内第 1/4/7/10 天）
    COUNT: 6,                 // 每次刷新在草地上放几株
    RADIUS: 20,               // 刷新范围：以农田中心为圆心的半径（格）
    TYPES: [                  // 各种采集物：对应的物品 / 地块 / 出现的季节
      { item:'wildflower', tile:T.WILDFLOWER, seasons:['春','夏'] },
      // 野花：春夏
      { item:'mushroom',   tile:T.MUSHROOM,   seasons:['秋'] },
      // 蘑菇：秋季
      { item:'berry',      tile:T.BERRY,      seasons:['夏','秋'] }
      // 浆果：夏秋
    ]
  },

  /* ---------- 动物系统（第 15 轮）：鸡 / 牛 + 棚舍 + 每日产出 ---------- */
  ANIMALS: {
    RANGE: 1.6,               // 走近多少格内按 E 能互动
    AFF_MAX: 100,             // 好感度上限
    FEED_AFF: 5,              // 每天已喂食 → 次日结算好感 +5
    HUNGRY_AFF: -5,           // 每天没喂食 → 次日结算好感 -5（且当天不产出）
    PET_AFF: 2,               // 摸头 +2（每天一次）
    FEED_ITEM: 'feed',        // 饲料物品 id（商店买 / 镰刀割草）
    FEED_PER: 1,              // 喂一次消耗几个饲料
    PRODUCE_MIN_AFF: 50,      // 好感 ≥ 这个值才有产出
    HQ_CHANCE_MIN: 0.10,      // 好感刚够格（50）时出高品质的概率
    HQ_CHANCE_MAX: 0.45,      // 好感满（100）时出高品质的概率
    HQ_PRICE_MULT: 1.8,       // 高品质版本售价倍率（价格表里已按此折算，改这里只影响显示文案）
    WANDER: {                 // 围栏内简单游走 AI
      SPEED: 0.55,            // 走动速度（格 / 秒）
      RANGE: 3,               // 离棚舍最远几格（超出就往回走）
      PAUSE_MIN: 0.6,         // 停下发呆的最短时间（秒）
      PAUSE_MAX: 2.2,         // 停下发呆的最长时间（秒）
      TICK: 0.25              // AI 决策节拍（秒）：每 250ms 才重新选方向 / 判障碍（第 21 轮降频）
    },
    /* 两种动物：成熟天数 / 每天产出 / 高品质版本 / 住的棚舍 */
    TYPES: [
      // 鸡：2 天成熟、每天一个蛋（好感够时出优质蛋）
      { id:'chicken', name:'鸡', icon:'🐔', price:120, matureDays:2, produce:'egg',  hqProduce:'egg_hq',  shelter:'coop' },
      // 牛：4 天成熟、每天一份奶（好感够时出优质奶）
      { id:'cow',     name:'牛', icon:'🐄', price:260, matureDays:4, produce:'milk', hqProduce:'milk_hq', shelter:'barn' }
    ],
    /* 棚舍：对应的建造配方 id + 最多住几只（总容量 = 已建该类棚舍数量 × cap） */
    SHELTERS: {
      // 每座鸡舍住 4 只、每座牛棚住 3 头
      coop: { id:'coop', name:'鸡舍', recipe:'coop', cap:4 }, barn: { id:'barn', name:'牛棚', recipe:'barn', cap:3 }
    }
  },

  /* ---------- 委托板（第 16 轮）：商店旁的每日小目标 + 信誉 ----------
   * 每天 6:00 刷新 DAILY 条；同时最多接 MAX_ACTIVE 条；完成 +信誉，信誉每 REP_STEP 点给奖励加成 */
  QUEST: {
    RANGE: 1.6,                // 离委托板多近能按 E 打开（格）
    DAILY: 3,                  // 每天刷新几条委托
    MAX_ACTIVE: 2,             // 同时最多接几单
    DAYS_MIN: 1,               // 委托最短存活天数
    DAYS_MAX: 2,               // 委托最长存活天数
    REP_PER_DONE: 1,           // 每完成一单加几点信誉
    REP_STEP: 10,              // 每多少点信誉算一档
    REP_BONUS: 0.05,           // 每档奖励加成（+5%）
    REP_BONUS_MAX: 0.5,        // 奖励加成上限（+50%）
    GOLD_BASE: {               // 各类委托的基础金币
      crop: 45,                // 交付作物
      fish: 90,                // 交付鱼
      material: 40,            // 交付木材 / 石材
      talk: 55                 // 和居民对话
    },
    GOLD_PER_UNIT: {           // 需求每多一个，多加多少金币
      crop: 10, fish: 20, material: 6, talk: 0          // 作物 / 鱼 / 材料 / 对话 的单价
    },
    EXTRA_CHANCE: 0.45,        // 完成时额外奖励的掉落概率
    NEED: {                    // 需求数量范围 [最少, 最多]
      crop: [2, 4], fish: [1, 2], material: [4, 8], talk: [1, 1]   // 作物 / 鱼 / 材料 / 对话
    },
    CROP_POOL: ['radish','potato','tomato','pumpkin'],   // 作物委托候选（生成时按当季过滤）
    FISH_POOL: ['fish_crucian','fish_carp','fish_puffer','fish_saury', // 鱼委托候选（按当季过滤）
                'fish_moon','fish_koi','fish_ice','fish_wintercarp'],
    MATERIAL_POOL: ['wood','stone'],                    // 材料委托候选
    TALK_POOL: ['aunt','carpenter','girl'],             // 对话委托候选（NPC id）
    EXTRA_POOL: ['seed_radish','seed_potato','seed_tomato', // 额外奖励池（种子 / 材料 / 饲料）
                 'seed_pumpkin','wood','stone','feed']
  },

  /* 节日（第 17 轮）：每季第 5 天举办，效果只在当天生效 */
  FESTIVAL: {
    DAY: 5,                    // 每季第几天举办节日
    SELL_MULT: 1.5,            // 秋 · 丰收节：作物售价倍率
    GIFT_MULT: 3,              // 冬 · 雪夜灯会：送礼好感倍率
    RIVALS: 3,                 // 夏 · 渔获赛：同场竞技的 NPC 数量
    SUMMER_PRIZE: {id:'seed_pumpkin', n:3},   // 渔获赛第一名奖励（稀有种子）
    BANNER_MS: 4500,           // 节日横幅停留多少毫秒
    AMBIENT: true,             // 节日环境音总开关
    AMBIENT_VOL: 0.035,        // 节日环境音音量（相对 CONFIG.AUDIO.VOLUME）
    /* 广场：代码绘制的装饰区（7×3 格，农场正下方），只占未被玩家改动的原始地面 */
    PLAZA: {x:29, y:39, w:7, h:3},
    /* 四个节日：按春夏秋冬排序，id / 名字 / 图标 / 效果说明 / 环境音和弦 */
    LIST: [
      // 春 · 播种祭：当天播下的种子，当夜生长 +2 天
      {id:'spring', name:'播种祭', icon:'🌱', effect:'当天播种的作物生长速度 ×2', amb:[392, 523]},
      // 夏 · 渔获赛：当天钓到的鱼按总价值与 NPC 排名，第一名奖励稀有种子
      {id:'summer', name:'渔获赛', icon:'🎣', effect:'当天钓到的鱼总价值排名第一 → 稀有种子', amb:[440, 554]},
      // 秋 · 丰收节：当天卖作物 +50%，村民到广场摆集市
      {id:'autumn', name:'丰收节', icon:'🌾', effect:'当天出售作物价格 ×1.5，广场出现集市', amb:[349, 466]},
      // 冬 · 雪夜灯会：夜里广场亮灯，对话有特殊台词，送礼好感 ×3
      {id:'winter', name:'雪夜灯会', icon:'🏮', effect:'夜里广场亮灯 · 送礼好感 ×3', amb:[330, 440]}
    ],
    /* 冬夜灯会 NPC 特殊台词（{name} 会替换成居民名字） */
    WINTER_TALK: '{name}：灯会把雪地都照亮了，今晚别急着走呀。'
  },

  /* 成就（第 18 轮）：>=20 个，分 种植 / 经济 / 社交 / 探索 四类
   * kind 说明：stat=累计统计达到 need；gold=当前存款；dailyGold=单日收入；
   *           crops=收过的作物种类数；fishKinds=钓到的鱼的种类数；
   *           gatherKinds=采到的采集物种类数；friends=达到「朋友」档的居民数；
   *           year=活过一整年（第 41 天早晨） */
  ACHIEVEMENT: {
    CARD_MS: 2800,             // 右上角解锁卡片停留多久（毫秒）
    CATS: [                     // 成就四分类（成就墙的页签）
      {key:'farm',    name:'种植', icon:'🌱'},
      {key:'gold',    name:'经济', icon:'💰'},
      {key:'social',  name:'社交', icon:'💬'},
      {key:'explore', name:'探索', icon:'🧭'}
    ],
    LIST: [
      /* ---- 种植类 ---- */
      {id:'harvest_first', cat:'farm',    icon:'🌾', name:'初次丰收', desc:'收获第 1 个作物',        kind:'stat', key:'hv', need:1},
      {id:'harvest_10',    cat:'farm',    icon:'🌱', name:'小有收成', desc:'累计收获 10 个作物',     kind:'stat', key:'hv', need:10},
      {id:'harvest_50',    cat:'farm',    icon:'🧺', name:'熟练农夫', desc:'累计收获 50 个作物',     kind:'stat', key:'hv', need:50},
      {id:'harvest_100',   cat:'farm',    icon:'🏅', name:'百果归仓', desc:'累计收获 100 个作物',    kind:'stat', key:'hv', need:100},
      {id:'crops_all',     cat:'farm',    icon:'🌈', name:'四季农人', desc:'萝卜 / 土豆 / 番茄 / 南瓜都收过', kind:'crops', need:4},
      /* ---- 经济类 ---- */
      {id:'sell_first',    cat:'gold',    icon:'💰', name:'第一桶金', desc:'第一次卖出东西',         kind:'stat', key:'gs', need:1},
      {id:'gold_1000',     cat:'gold',    icon:'🏦', name:'千元户',   desc:'存款达到 1000 金币',     kind:'gold', need:1000},
      {id:'day_income_500',cat:'gold',    icon:'📈', name:'日进斗金', desc:'单日收入达到 500 金币',  kind:'dailyGold', need:500},
      {id:'income_5000',   cat:'gold',    icon:'💎', name:'家底殷实', desc:'累计收入达到 5000 金币', kind:'stat', key:'inc', need:5000},
      {id:'build_10',      cat:'gold',    icon:'🔨', name:'建设者',   desc:'累计建造 10 次',         kind:'stat', key:'bd', need:10},
      {id:'build_30',      cat:'gold',    icon:'🏗', name:'基建狂魔', desc:'累计建造 30 次',         kind:'stat', key:'bd', need:30},
      /* ---- 社交类 ---- */
      {id:'gift_first',    cat:'social',  icon:'🎁', name:'初次送礼', desc:'第一次给居民送礼',       kind:'stat', key:'gc', need:1},
      {id:'gift_10',       cat:'social',  icon:'💝', name:'礼尚往来', desc:'累计送出 10 份礼物',     kind:'stat', key:'gc', need:10},
      {id:'friend_first',  cat:'social',  icon:'🤝', name:'交个朋友', desc:'让 1 位居民的好感到「朋友」', kind:'friends', need:1},
      {id:'friends_3',     cat:'social',  icon:'👫', name:'三人成友', desc:'3 位居民都成为朋友',     kind:'friends', need:3},
      {id:'aff_150',       cat:'social',  icon:'⭐', name:'人气王',   desc:'好感度总和达到 150',     kind:'stat', key:'af', need:150},
      /* ---- 探索类 ---- */
      {id:'fish_first',    cat:'explore', icon:'🎣', name:'初次垂钓', desc:'钓到第 1 条鱼',          kind:'stat', key:'fs', need:1},
      {id:'fish_8',        cat:'explore', icon:'🐟', name:'鱼类图鉴', desc:'钓到全部 8 种鱼',        kind:'fishKinds', need:8},
      {id:'gather_all',    cat:'explore', icon:'🌼', name:'采集达人', desc:'集齐所有季节采集物',     kind:'gatherKinds', need:3},
      {id:'sleep_10',      cat:'explore', icon:'😴', name:'安眠',     desc:'累计睡觉 10 次',         kind:'stat', key:'sl', need:10},
      {id:'play_30',       cat:'explore', icon:'📅', name:'农场主',   desc:'游玩 30 天',             kind:'stat', key:'dy', need:30},
      {id:'year_one',      cat:'explore', icon:'🎊', name:'活过一整年', desc:'度过完整的 40 天',     kind:'year', need:1}
    ]
  },

  /* ---------- 加工台（第 19 轮）：把低价原料变成高价成品 ----------
   * 加工时间按游戏时间推进（睡觉跨夜也照算）；每台加工台各自独立工作。
   * 利润率的验收口径：(成品基础价 × 数量 − 原料基础价总和) / 原料基础价总和 */
  RECIPE: {
    RANGE: 1.6,                // 离加工台多近能按 E 打开（格）
    OUT_SLOTS: 4,              // 加工台产出槽能放几种成品
    STACK_MAX: 99,             // 产出槽里单种成品最多堆多少
    EAT_PER_DAY: 3,            // 成品每天最多吃几次（回体力）
    EAT_STAMINA: 25,           // 每吃一份成品恢复多少体力
    PROFIT_MIN: 0.6,           // 成品利润率下限（验收自检用，60%）
    PROFIT_MAX: 1.2,           // 成品利润率上限（验收自检用，120%）
    /* 配方表：inputs = 原料 / out = 成品 / hours = 游戏小时
     * unlock：null = 一开始就会；{type:'aff',npc,min} = 好感解锁；{type:'ach',id} = 成就解锁 */
    LIST: [
      {id:'cake',           name:'蛋糕',     icon:'🍰', inputs:{egg:1, milk:1},           out:{id:'cake', n:1},           hours:3, unlock:null},
      // 蛋糕：鸡蛋 + 牛奶（新手就会）
      {id:'ketchup',        name:'番茄酱',   icon:'🥫', inputs:{tomato:3},                out:{id:'ketchup', n:1},        hours:2, unlock:null},
      // 番茄酱：番茄 ×3
      {id:'pumpkin_pie',    name:'南瓜派',   icon:'🥧', inputs:{pumpkin:2, egg:1},        out:{id:'pumpkin_pie', n:1},    hours:4, unlock:null},
      // 南瓜派：南瓜 ×2 + 鸡蛋
      {id:'charcoal',       name:'木炭',     icon:'⚫', inputs:{wood:5},                  out:{id:'charcoal', n:2},       hours:2, unlock:null},
      // 木炭：木材 ×5 → 木炭 ×2
      {id:'cheese',         name:'奶酪',     icon:'🧀', inputs:{milk:2},                  out:{id:'cheese', n:1},         hours:3, unlock:null},
      // 奶酪：牛奶 ×2
      {id:'pickled_radish', name:'腌萝卜',   icon:'🥬', inputs:{radish:3},                out:{id:'pickled_radish', n:1}, hours:2, unlock:null},
      // 腌萝卜：萝卜 ×3
      {id:'jam',            name:'果酱',     icon:'🍯', inputs:{berry:4},                 out:{id:'jam', n:1},            hours:3, unlock:{type:'aff', npc:'aunt',      min:60}},
      // 果酱：浆果 ×4（老板娘成为朋友后解锁）
      {id:'dried_fish',     name:'鱼干',     icon:'🐟', inputs:{fish_crucian:2},          out:{id:'dried_fish', n:1},     hours:3, unlock:{type:'ach', id:'fish_first'}},
      // 鱼干：鲫鱼 ×2（钓到第一条鱼后解锁）
      {id:'mushroom_soup',  name:'蘑菇浓汤', icon:'🍲', inputs:{mushroom:3, milk:1},      out:{id:'mushroom_soup', n:1},  hours:4, unlock:{type:'ach', id:'gather_all'}},
      // 蘑菇浓汤：蘑菇 ×3 + 牛奶（集齐采集物后解锁）
      {id:'woodcarving',    name:'木雕',     icon:'🗿', inputs:{wood:8},                  out:{id:'woodcarving', n:1},    hours:4, unlock:{type:'aff', npc:'carpenter', min:60}}
      // 木雕：木材 ×8（老木匠成为朋友后解锁）
    ]
  },

  /* ---------- 终局自动化 + 农场评级（第 20 轮）----------
   * 后期把「每天重复劳动」交给设备与雇工；5 星评级给一条明确的收尾目标。
   * 所有概率 / 数值都集中在这里，方便平衡调整与验收时临时改成 100%。 */
  ENDGAME: {                          // 终局自动化 + 农场评级的总配置
    IRRIGATION: {                     // 铱质洒水器
      RANGE: 2,              // 铱质洒水器覆盖半径（格）→ 5×5
      CHANCE: 0.3            // 被铱质洒水器浇过的作物，当天多长 1 个阶段的概率
    },
    CROW: {                           // 乌鸦事件
      CHANCE: 0.08,          // 每天早上乌鸦事件出现的概率
      RANGE: 5               // 稻草人保护半径（切比雪夫距离，格）
    },
    AUTOBOX: {                        // 自动采集箱
      RANGE: 4,              // 采集箱到棚舍的最大距离（切比雪夫，格）
      SLOTS: 8               // 采集箱格数（复用木箱面板的 8 格）
    },
    WORKER: {                         // 雇工
      COST: 3000,            // 一次性雇佣费（金币）
      WAGE: 50               // 每天早上自动扣除的日薪
    },
    RATING: {                         // 农场 5 星评级
      STARS: 5,              // 满星数
      STAR_STEP: 20,         // 每 20 分升一星
      EXPAND_PLOTS: 20,      // 每 20 格耕地折算 1 期扩建
      CROP_TARGET: 4,        // 作物种类满分目标
      ANIMAL_TARGET: 6,      // 动物数量满分目标
      BUILD_TARGET: 12,      // 建筑数量满分目标
      ACH_TARGET: 12,        // 成就数量满分目标
      EXPAND_TARGET: 3,      // 扩建期数满分目标
      WEIGHTS: { crop:25, animal:20, building:15, ach:30, expand:10 }   // 各项权重（合计 100）
    }
  },

  /* 平衡自检（第 12 轮）：新手从 100 金币攒到「扩建地 500 金币」要几天 */
  BALANCE: {
    EXPANSION_GOLD: 500,    // 扩建地标价（自检参照目标）
    TARGET_DAYS: 7          // 预期天数上限：超过就要调高作物售价或压低种子价
  },

  /* 主循环 */
  TARGET_FPS: 60,           // 逻辑帧率（固定步长）
  MAX_FRAME_TIME: 0.25,     // 单帧最大时间（防止切后台后补帧爆炸）
  MAX_STEPS: 5,             // 单帧最多追几步
  FPS_INTERVAL: 0.25,       // FPS / 面板刷新间隔（秒）

  /* 调试 */
  GRID_OVERLAY: false,      // 叠加网格线（第 29 轮默认关闭，设置里可开）
  GRID_COLOR: 'rgba(255,255,255,0.09)',   // 网格线颜色（GRID_OVERLAY 打开时用）
  LOG_EVERY: 60,            // 每 N 帧在控制台打印一次瓦片统计
  DEBUG_HOOK: false,        // true = 暴露 window.__game（仅调试用）

  /* 缩放 */
  INTEGER_SCALE: true,      // true = 放大时只用整数倍（像素最锐利）
  MIN_SCALE: 0.25,          // 最小缩放比（窗口小于逻辑分辨率时按比例缩小，不裁切）

  /* HUD / 精灵配色 */
  COLORS: {
    bg:        '#141922',           // 画布外的底色
    hudBg:     'rgba(8,10,16,0.72)',// HUD 面板半透明底色
    hudBorder: '#3d4a63',           // HUD 描边
    hudText:   '#cfe3ff',           // HUD 正文
    hudAccent: '#ffd76a',           // HUD 强调色（金币 / 标题）
    shadow:    'rgba(0,0,0,0.40)',  // 投影
    hair:      '#4a3222',           // 头发
    skin:      '#f0c090',           // 皮肤
    eye:       '#20202a',           // 眼睛
    shirt:     '#3f7fd0',           // 上衣
    shirtDark: '#2f63a8',           // 上衣暗部
    pants:     '#3a4a5a',           // 裤子
    shoe:      '#26262e'            // 鞋子
  },

  /* 瓦片配色（按用途分组：草地 / 泥土 / 耕地 / 水 / 空地 / 树石花 / 房屋 / 建造物） */
  TILE_COLORS: {
    grass:       '#6fb04c', grassDot: '#5d9c42', grassDot2: '#82c05a',
    // 草地底色 + 两层草点
    dirt:        '#7d4d2b', dirtLine: '#6a4023', dirtLine2: '#8a5a33',
    // 泥土底色 + 犁痕 + 亮线
    tilled:      '#6a4023', tilledLine: '#54331a', tilledRidge: '#7a4d2c',
    // 耕地：土色 + 沟线 + 垄脊
    watered:     '#4b3118', wateredLine: '#3d2712', wateredSheen: '#4f8fc4',
    // 浇过水的湿土 + 反光
    bare:        '#a89a70', bareDot: '#8d8158', bareStone: '#7e7450',
    // 清理过的空地 + 碎石
    water:       '#3f7fc4', waterLight: '#4f95da', waterDark: '#2f6ba8',
    // 水面 + 波光 + 暗部
    treeTrunk:   '#5b3a1d', treeTrunkDark: '#7d5426',
    // 树干 + 树干暗部
    treeLeaf:    '#2f8234', treeLeafLight: '#3d9a3f', treeLeafTop: '#54b34f',
    // 树叶三层
    rock:        '#9aa1a9', rockLight: '#c6ccd2', rockDark: '#63696f',
    // 石头三面
    flowerStem:  '#3f8f3a', flowerCenter: '#fff8d0',
    // 花茎 + 花心
    flowers:     ['#ffe066', '#ff9ec7', '#b39dff'],
    // 三种野花颜色（按格哈希选）
    houseWall:   '#d9b382', houseWallDark: '#c39a67', houseWallLine: '#b78d5c',
    // 墙 + 暗部 + 墙线
    houseRoof:   '#c05a32', houseRoofLight: '#d9713f', houseRoofDark: '#8a4a2a',
    // 屋顶三色
    houseDoor:   '#7d4a22', houseDoorDark: '#5b3a1d', houseKnob: '#e2c14a',
    // 门 + 门缝 + 门把
    houseWindow: '#8fd0f0', houseWindowFrame: '#5b3a1d',
    // 窗玻璃 + 窗框
    houseChimney:'#7d4a22',
    // 烟囱
    shopPost:    '#7d5426', shopCounter: '#a97a3f', shopCounterDark: '#6d4522',
    // 立柱 + 柜台
    shopCanopyA: '#d94f3d', shopCanopyB: '#f0f0f0', shopCanopyDark: '#b03a2c',
    // 遮阳篷条纹
    shopSign:    '#7d5426', shopSignText: '#e2c14a',
    // 招牌底 + 招牌字
    shopGoods1:  '#e04430', shopGoods2: '#e08a2a', shopGoods3: '#c8a05c', shopGoods4: '#8fd06a',
    // 摊上的货
    fencePost:   '#8a5a2b', fencePostDark:'#63401f', fenceRail:'#a9713a', fenceRailDark:'#7d4f24',
    // 栅栏立柱 + 横栏
    chestBody:   '#a9763f', chestBodyDark:'#7d5527', chestLid:'#c08b4e', chestLidDark:'#8a5f2c',
    // 木箱箱体 + 箱盖
    chestLock:   '#e2c14a',
    // 箱锁
    sprinkPost:  '#7d8a99', sprinkHead:'#9fb0c0', sprinkHeadDark:'#6b7887', sprinkBase:'#5b6674',
    // 洒水器支柱 + 喷头 + 底座
    dropWater:   '#7ec8ff', dropWaterLight:'#c8ecff',
    // 水滴 + 高光
    roadStone:   '#b9b3a6', roadStoneDark:'#8d8779', roadStoneLight:'#d2ccbe',
    // 石板路三色
    coopWall:    '#d6b072', coopWallDark:'#a9854c', coopRoof:'#c0503a', coopRoofLight:'#dd6a4c',
    // 鸡舍木墙 + 红屋顶
    barnWall:    '#b3443c', barnWallDark:'#8a2f2a', barnRoof:'#5c6b78', barnRoofLight:'#7a8b99',
    barnTrim:    '#e8dcc0'
    // 牛棚红墙 + 灰屋顶 + 白边
  }
};



/* ═══════════════════════════════════════════════════════════════════════
 * 第 32 轮：把 anim 图鉴的 50 种作物接进玩法。
 *  - 基础 4 种（萝卜/土豆/番茄/南瓜）保留原有数值，不重复生成；
 *  - 其余 46 种按「生长天数 + 是否再收 + 果实大小」推算种子价与售价；
 *  - 同步生成作物物品、优质物品、种子物品、种子工具条目与商店货架。
 * ═══════════════════════════════════════════════════════════════════════ */
(function mergeAnimCrops(){
  const ICON_BY_ID = {
    blue_jazz:'🌷', carrot:'🥕', cauliflower:'🥦', coffee_bean:'☕', garlic:'🧄',
    green_bean:'🫛', kale:'🥬', parsnip:'🥕', strawberry:'🍓', tulip:'🌷',
    unmilled_rice:'🌾', wild_horseradish:'🌿',
    blueberry:'🫐', hops:'🌿', hot_pepper:'🌶️', melon:'🍈', pineapple:'🍍',
    poppy:'🌺', red_cabbage:'🥬', spice_berry:'🫐', starfruit:'⭐',
    summer_spangle:'🌼', summer_squash:'🎃', taro_root:'🍠', corn:'🌽',
    sunflower:'🌻', wheat:'🌾',
    amaranth:'🌺', artichoke:'🥬', beet:'🍠', bok_choy:'🥬', broccoli:'🥦',
    common_mushroom:'🍄', cranberries:'🍒', eggplant:'🍆', fairy_rose:'🌹',
    grape:'🍇', sweet_gem_berry:'💎', yam:'🍠',
    powdermelon:'🍈', winter_root:'🥔',
    ancient_fruit:'🫐', cactus_fruit:'🌵', fiber:'🌿', qi_fruit:'🟦'
  };
  const ICON_BY_KIND = {
    flower:'🌷', root:'🥕', leafy:'🥬', bush:'🫐', pod:'🫛', vine:'🍇',
    gourd:'🎃', tree:'🍎', grain:'🌾', tuber:'🥔', mushroom:'🍄', fiber:'🌿'
  };

  /* 「全季」需要展开成四个季节，否则 seasonName() 永远匹配不上 */
  const allSeasons = ['春', '夏', '秋', '冬'];
  function seasonsOf(ac){
    if (ac.season === '全季' || ac.season === '全年') return allSeasons.slice();
    return ac.season.split('').filter(ch => allSeasons.indexOf(ch) >= 0);
  }

  for (const ac of ANIM_CROPS) {
    const seasons = seasonsOf(ac);
    if (!seasons.length) seasons.push('春');

    /* 已有作物也按 demo 数据同步生长天数、再收间隔与季节 */
    const def = CONFIG.CROPS.find(c => c.id === ac.id);
    if (def) {
      def.season = seasons[0];
      def.seasons = seasons.length > 1 ? seasons : undefined;
      def.days = ac.days;
      def.regrow = ac.regrow || 0;
      def.ripe = ac.produce ? ac.produce.c1 : def.ripe;
      def.unripe = ac.produce ? (ac.produce.c2 || ac.produce.c1) : def.unripe;
      def.leaf = ac.leaf || def.leaf;
      continue;
    }

    const icon = ICON_BY_ID[ac.id] || ICON_BY_KIND[ac.kind] || '🌱';
    const size = (ac.produce && ac.produce.size) || 2;
    const sell = Math.round(ac.days * 6 + (ac.regrow ? 24 : 0) + size * 8);
    const seedCost = Math.max(8, Math.round(sell * 0.35));

    CONFIG.CROPS.push({
      id: ac.id,
      name: ac.name,
      icon,
      season: seasons[0],
      seasons,
      days: ac.days,
      seedCost,
      sell,
      regrow: ac.regrow || 0,
      ripe: ac.produce ? ac.produce.c1 : '#e0a040',
      unripe: ac.produce ? (ac.produce.c2 || ac.produce.c1) : '#c8c090',
      leaf: ac.leaf || '#4aa03c'
    });

    CONFIG.ITEMS[ac.id] = {
      id: ac.id, name: ac.name, icon, stack: true, max: 99,
      kind: 'crop', crop: ac.id, price: sell
    };
    CONFIG.ITEMS[ac.id + '_hq'] = {
      id: ac.id + '_hq', name: '优质' + ac.name, icon, stack: true, max: 99,
      kind: 'crop', crop: ac.id, price: Math.round(sell * 1.8)
    };
    CONFIG.ITEMS['seed_' + ac.id] = {
      id: 'seed_' + ac.id, name: ac.name + '种子', icon: '🌱', stack: true, max: 99,
      kind: 'seed', crop: ac.id
    };

    /* 播种工具条目：useTool 通过 CONFIG.TOOLS 找到 crop */
    CONFIG.TOOLS.push({
      id: 'seed_' + ac.id, crop: ac.id,
      accepts: [T.TILLED], to: T.TILLED, out: null, cost: 0,
      msg: '播下了' + ac.name, sfx: 420 + (CONFIG.TOOLS.length * 37) % 560
    });

    /* 商店只上架当季种子（渲染时再按季节筛） */
    CONFIG.SHOP.BUY.push({ id: 'seed_' + ac.id, price: seedCost });
  }
})();


/* 第 32 轮：8 种果树的果实物品（果树可 E 采摘） */
(function addFruitItems(){
  const META = {
    apple:       ['苹果',   '🍎', 100],
    apricot:     ['杏',     '🍑', 90],
    cherry:      ['樱桃',   '🍒', 120],
    orange:      ['橙子',   '🍊', 110],
    peach:       ['桃子',   '🍑', 130],
    banana:      ['香蕉',   '🍌', 140],
    mango:       ['芒果',   '🥭', 150],
    pomegranate: ['石榴',   '🍎', 160]
  };
  for (const ft of FRUIT_TREES) {
    if (CONFIG.ITEMS[ft.id]) continue;
    const m = META[ft.id] || [ft.name, '🍎', 100];
    CONFIG.ITEMS[ft.id] = {
      id: ft.id, name: m[0], icon: m[1], stack: true, max: 99,
      kind: 'gather', price: m[2]
    };
  }
})();


/* 第 32 轮：补齐鸭子 / 羊 / 猪 / 兔，与 anim 图鉴的 6 种动物对齐 */
(function addMoreAnimals(){
  const EXTRA = [
    { id:'duck',   name:'鸭', icon:'🦆', price:200,  matureDays:4, produce:'duck_egg',   hqProduce:'duck_egg_hq',   shelter:'coop' },
    { id:'sheep',  name:'羊', icon:'🐑', price:800,  matureDays:3, produce:'wool',       hqProduce:'wool_hq',       shelter:'barn' },
    { id:'pig',    name:'猪', icon:'🐖', price:1600, matureDays:5, produce:'truffle',    hqProduce:'truffle_hq',    shelter:'barn' },
    { id:'rabbit', name:'兔', icon:'🐇', price:400,  matureDays:6, produce:'rabbit_foot',hqProduce:'rabbit_foot_hq',shelter:'coop' }
  ];
  const PRODUCTS = [
    ['duck_egg',    '鸭蛋',       '🥚', 95,  190],
    ['wool',        '羊毛',       '🧶', 340, 612],
    ['truffle',     '松露',       '🍄', 625, 1125],
    ['rabbit_foot', '兔脚',       '🐇', 565, 1017]
  ];
  for (const t of EXTRA) {
    if (!CONFIG.ANIMALS.TYPES.some(x => x.id === t.id)) CONFIG.ANIMALS.TYPES.push(t);
    CONFIG.SHOP.BUY.push({ id: t.id, price: t.price, animal: t.id });
  }
  for (const [id, name, icon, price, hq] of PRODUCTS) {
    CONFIG.ITEMS[id] = { id, name, icon, stack: true, max: 99, kind: 'animal', price };
    CONFIG.ITEMS[id + '_hq'] = { id: id + '_hq', name: '优质' + name, icon, stack: true, max: 99, kind: 'animal', price: hq };
  }
})();


/* 第 32 轮：53 种矿物（宝石 / 采集矿物 / 晶洞矿物）作为可掉落、可出售的收集品 */
(function addMineralItems(){
  const ICON = { gem: '💎', foraged: '🔮', geode: '🪨' };
  for (const m of MINERALS) {
    if (CONFIG.ITEMS[m.id]) continue;
    CONFIG.ITEMS[m.id] = {
      id: m.id, name: m.name, icon: ICON[m.type] || '💎',
      stack: true, max: 99, kind: 'mineral', price: m.price,
      mineralType: m.type
    };
  }
})();


/* 第 32 轮：把 anim 图鉴的 72 种鱼接进钓鱼池。
 * 已有 8 种保留；同名鱼（鲤鱼 / 河豚）与已有条目重合时跳过。 */
(function addMoreFish(){
  const ICON_BY_TYPE = {
    ocean:'🐟', river:'🐠', lake:'🐡', mines:'👻',
    legend:'🐋', crab:'🦀', special:'🐙'
  };
  const allSeasons = ['春','夏','秋','冬'];
  const seasonsOf = s => s === '全年' ? allSeasons.slice()
    : s.split('').filter(ch => allSeasons.indexOf(ch) >= 0);
  function strHash(s){
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  const existingNames = new Set(CONFIG.FISHING.LIST.map(f => f.name));
  for (const f of ANIM_FISH) {
    if (existingNames.has(f.name)) continue;
    const id = 'fish_' + f.id;
    if (CONFIG.FISHING.LIST.some(x => x.id === id)) continue;

    let seasons = seasonsOf(f.seasons);
    if (!seasons.length) seasons = allSeasons.slice();

    /* 价格越高越稀有；稀有度同时决定售价与拉杆绿区宽度 */
    const rarity = f.price >= 1000 ? 5 : f.price >= 500 ? 4 : f.price >= 200 ? 3 : f.price >= 80 ? 2 : 1;

    /* 没有原始时段数据：按 id 哈希分昼夜，蟹笼 / 矿井 / 特殊全天 */
    let from = 6, to = 18;
    if (f.type === 'crab' || f.type === 'mines' || f.type === 'special') { from = 6; to = 2; }
    else if (strHash(f.id) % 2) { from = 18; to = 2; }

    const icon = ICON_BY_TYPE[f.type] || '🐟';
    CONFIG.FISHING.LIST.push({
      id, name: f.name, icon, rarity, seasons,
      weather: ['sun', 'rain', 'snow'], from, to, price: f.price
    });
    CONFIG.ITEMS[id] = {
      id, name: f.name, icon, stack: true, max: 99,
      kind: 'fish', price: f.price
    };
    existingNames.add(f.name);
  }
})();


/* 第 32 轮：把 anim 建筑图鉴的其余建筑接进建造配方。
 * 建筑本体仍占 1 格；鸡舍 / 牛棚继续使用原有功能，只替换外观。 */
(function addAnimBuildingRecipes(){
  const EXTRA = [
    ['greenhouse',      '温室',     { wood:30, stone:20 }, 800],
    ['silo',            '筒仓',     { wood:12, stone:4  }, 0],
    ['cabin',           '小屋',     { wood:15, stone:5  }, 0],
    ['shipping_bin',    '发货箱',   { wood:12 },            0],
    ['well',            '水井',     { wood:10, stone:10 }, 0],
    ['mill',            '磨坊',     { wood:20, stone:15 }, 250],
    ['fish_pond',       '鱼塘',     { wood:10, stone:20 }, 0],
    ['pet_bowl',        '宠物碗',   { wood:5,  stone:2  }, 0],
    ['stable',          '马厩',     { wood:25, stone:10 }, 300],
    ['slime_hutch',     '史莱姆屋', { wood:20, stone:30 }, 500],
    ['shed',            '棚屋',     { wood:20, stone:10 }, 0],
    ['junimo_hut',      '祝尼魔屋', { wood:20, stone:20 }, 500],
    ['earth_obelisk',   '大地图腾', { stone:40 },           1500],
    ['water_obelisk',   '水之图腾', { stone:40 },           1500],
    ['desert_obelisk',  '沙漠图腾', { stone:40 },           3000],
    ['island_obelisk',  '岛屿图腾', { stone:40 },           3000],
    ['gold_clock',      '黄金时钟', { stone:50 },           5000],
    ['community_center','社区中心', { wood:50, stone:50 },   1000],
    ['stove',           '灶台',     { wood:15, stone:10 },   0],
    ['wardrobe',        '衣柜',     { wood:20 },            0]
  ];
  for (const [id, name, cost, gold] of EXTRA) {
    if (CONFIG.BUILD.RECIPES.some(r => r.id === id)) continue;
    CONFIG.BUILD.RECIPES.push({ id, name, cost, gold, solid: true });
  }
})();


/* 第 32 轮：28 种工匠品接入物品表与加工台配方 */
(function addArtisanGoods(){
  const META = {
    wine:            ['🍷', 300, 'food'],
    juice:           ['🧃', 250, 'food'],
    beer:            ['🍺', 200, 'food'],
    pale_ale:        ['🍺', 250, 'food'],
    mead:            ['🍯', 300, 'food'],
    coffee:          ['☕', 150, 'food'],
    green_tea:       ['🍵', 150, 'food'],
    jelly:           ['🍯', 220, 'food'],
    pickles:         ['🫙', 200, 'food'],
    honey:           ['🍯', 100, 'food'],
    vinegar:         ['🫙', 120, 'food'],
    goat_cheese:     ['🧀', 250, 'food'],
    mayonnaise:      ['🫙', 190, 'food'],
    duck_mayonnaise: ['🫙', 220, 'food'],
    cloth:           ['🧵', 700, 'material'],
    oil:             ['🫙', 200, 'food'],
    truffle_oil:     ['🫙', 1100, 'food'],
    rice:            ['🍚', 100, 'material'],
    sugar:           ['🧂', 100, 'material'],
    flour:           ['🌾', 100, 'material'],
    dried_fruit:     ['🍇', 150, 'food'],
    dried_mushrooms: ['🍄', 130, 'food'],
    raisins:         ['🍇', 180, 'food'],
    roe:             ['🐟', 120, 'food'],
    aged_roe:        ['🐟', 200, 'food'],
    caviar:          ['🫙', 500, 'food'],
    smoked_fish:     ['🐟', 200, 'food']
  };
  for (const a of ARTISANS) {
    if (CONFIG.ITEMS[a.id]) continue;             /* 奶酪等已有物品保留原数值 */
    const m = META[a.id] || ['🫙', 150, 'food'];
    CONFIG.ITEMS[a.id] = {
      id: a.id, name: a.name, icon: m[0], stack: true, max: 99,
      kind: m[2], price: m[1], artisan: a.cat, desc: a.desc
    };
  }

  const RECIPES = [
    ['wine',            '葡萄酒',   { grape:3 },                 4],
    ['juice',           '果汁',     { tomato:3 },                3],
    ['beer',            '啤酒',     { wheat:3 },                 4],
    ['pale_ale',        '淡啤酒',   { hops:3 },                  4],
    ['mead',            '蜂蜜酒',   { honey:2 },                 6],
    ['coffee',          '咖啡',     { coffee_bean:3 },           1],
    ['green_tea',       '绿茶',     { kale:2 },                  1],
    ['jelly',           '果酱',     { strawberry:3 },            3],
    ['pickles',         '腌菜',     { potato:3 },                3],
    ['honey',           '蜂蜜',     { wildflower:5 },            4],
    ['vinegar',         '醋',       { unmilled_rice:2 },         3],
    ['goat_cheese',     '山羊奶酪', { milk:3 },                  3],
    ['mayonnaise',      '蛋黄酱',   { egg:1 },                   2],
    ['duck_mayonnaise', '鸭蛋黄酱', { duck_egg:1 },              2],
    ['cloth',           '布',       { wool:1 },                  4],
    ['oil',             '油',       { corn:3 },                   3],
    ['truffle_oil',     '松露油',   { truffle:1 },               4],
    ['rice',            '大米',     { unmilled_rice:3 },         2],
    ['sugar',           '糖',       { beet:2 },                  2],
    ['flour',           '面粉',     { wheat:2 },                 2],
    ['dried_fruit',     '水果干',   { apple:2 },                 3],
    ['dried_mushrooms', '蘑菇干',   { common_mushroom:3 },       3],
    ['raisins',         '葡萄干',   { grape:3 },                 3],
    ['roe',             '鱼籽',     { fish_crucian:2 },          2],
    ['aged_roe',        '陈年鱼籽', { roe:1 },                   6],
    ['caviar',          '鱼子酱',   { roe:2 },                   6],
    ['smoked_fish',     '熏鱼',     { fish_carp:2 },             3]
  ];
  for (const [id, name, inputs, hours] of RECIPES) {
    if (CONFIG.RECIPE.LIST.some(r => r.id === id)) continue;
    const d = CONFIG.ITEMS[id];
    CONFIG.RECIPE.LIST.push({
      id, name, icon: d ? d.icon : '🫙', inputs,
      out: { id, n: 1 }, hours, unlock: null
    });
  }

  /* 成品价至少是原料总价的 1.6 倍，避免倒贴钱。
   * 多跑几轮，让「蜂蜜 → 蜂蜜酒」这类链式配方也能吃到上游涨价。 */
  const itemPrice = id => {
    const d = CONFIG.ITEMS[id];
    if (!d) return 0;
    if (typeof d.price === 'number') return d.price;
    if (d.kind === 'crop') {
      const c = CONFIG.CROPS.find(x => x.id === d.crop);
      return c ? c.sell : 0;
    }
    return 0;
  };
  for (let pass = 0; pass < 3; pass++) {
    for (const [id, , inputs] of RECIPES) {
      let cost = 0;
      for (const k in inputs) cost += itemPrice(k) * inputs[k];
      if (cost > 0 && CONFIG.ITEMS[id]) {
        CONFIG.ITEMS[id].price = Math.max(CONFIG.ITEMS[id].price || 0, Math.round(cost * 1.6));
      }
    }
  }
})();


/* 第 32 轮：81 道料理 + 食谱接入烹饪（复用加工台面板）。
 * anim 食谱里的配料是中文名；这里先建「名称 → 游戏物品 id」索引，
 * 再对游戏没有的配料做近似替换（黄油→牛奶、小麦粉→面粉…）。 */
(function addDishes(){
  const ICON_BY_CAT = {
    soup:'🍲', salad:'🥗', fish:'🐟', breakfast:'🍳',
    dessert:'🍰', main:'🍛', drink:'🥤'
  };
  const FALLBACK = {
    '小麦粉':'flour', '面粉':'flour', '糖':'sugar', '黄油':'milk', '奶油':'milk',
    '煎蛋':'egg', '薯饼':'potato', '面包':'bread', '大米':'rice', '醋':'vinegar',
    '蛋黄酱':'mayonnaise', '奶酪':'cheese', '枫糖浆':'honey', '墨汁':'charcoal',
    '榛子':'berry', '蜗牛':'crayfish', '沙丁鱼':'fish_crucian', '鱼籽':'roe'
  };
  const KEYWORD = [
    ['鱼', 'fish_crucian'], ['奶', 'milk'], ['蛋', 'egg'], ['油', 'oil'],
    ['蘑菇', 'common_mushroom'], ['莓', 'strawberry'], ['果', 'apple'],
    ['甘蓝', 'kale'], ['土豆', 'potato'], ['番茄', 'tomato'], ['玉米', 'corn'],
    ['南瓜', 'pumpkin'], ['小麦', 'wheat'], ['糖', 'sugar']
  ];

  /* 1) 先生成 81 道菜的物品，价格稍后按配料计算 */
  for (const d of DISHES) {
    if (CONFIG.ITEMS[d.id]) continue;
    CONFIG.ITEMS[d.id] = {
      id: d.id, name: d.name, icon: ICON_BY_CAT[d.cat] || '🍽️',
      stack: true, max: 99, kind: 'food', price: 0, dishCat: d.cat
    };
  }

  /* 2) 名称索引（菜名 / 作物 / 鱼 / 工匠品 / 畜牧品都在 CONFIG.ITEMS 里） */
  const byName = new Map();
  for (const id in CONFIG.ITEMS) {
    const it = CONFIG.ITEMS[id];
    if (it && it.name) byName.set(it.name, id);
  }

  function resolve(name) {
    if (byName.has(name)) return byName.get(name);
    if (FALLBACK[name]) return FALLBACK[name];
    for (const [kw, id] of KEYWORD) {
      if (name.indexOf(kw) >= 0 && CONFIG.ITEMS[id]) return id;
    }
    return 'wildflower';
  }

  /* 3) 食谱 → 加工台条目 */
  let added = 0;
  for (const r of ANIM_RECIPES) {
    if (CONFIG.RECIPE.LIST.some(x => x.id === r.id)) continue;
    const def = DISH_MAP[r.id];
    if (!def) continue;

    const inputs = {};
    for (const line of r.ingredients) {
      const m = String(line).match(/^(.*?)\s*[×x]\s*(\d+)\s*$/);
      const name = m ? m[1].trim() : String(line).trim();
      const n = m ? Math.max(1, parseInt(m[2], 10) || 1) : 1;
      const id = resolve(name);
      inputs[id] = (inputs[id] || 0) + n;
    }

    CONFIG.RECIPE.LIST.push({
      id: r.id,
      name: def.name,
      icon: ICON_BY_CAT[def.cat] || '🍽️',
      inputs,
      out: { id: r.id, n: 1 },
      hours: Math.min(4, 1 + Object.keys(inputs).length),
      unlock: null,
      cook: true
    });
    added++;
  }

  /* 4) 菜品价格：配料总价 × 1.5，多轮让「面包 → 三明治」这类链式配方也吃到涨价 */
  const itemPrice = id => {
    const d = CONFIG.ITEMS[id];
    if (!d) return 0;
    if (typeof d.price === 'number' && d.price > 0) return d.price;
    if (d.kind === 'crop') {
      const c = CONFIG.CROPS.find(x => x.id === d.crop);
      return c ? c.sell : 0;
    }
    return 0;
  };
  const dishRecipes = CONFIG.RECIPE.LIST.filter(r => r.cook);
  for (let pass = 0; pass < 3; pass++) {
    for (const r of dishRecipes) {
      let cost = 0;
      for (const k in r.inputs) cost += itemPrice(k) * r.inputs[k];
      if (cost > 0) {
        CONFIG.ITEMS[r.id].price = Math.max(CONFIG.ITEMS[r.id].price || 0, Math.round(cost * 1.5));
      }
    }
  }

  CONFIG.DISH_DEBUG = { added, total: ANIM_RECIPES.length };
})();


/* 第 32 轮：成就补到 32 个（刚好填满位掩码），并给全部成就分配 anim 徽章 */
(function addMoreAchievements(){
  const EXTRA = [
    {id:'mineral_first', cat:'explore', icon:'💎', name:'矿物入门', desc:'收集 1 种矿物',       kind:'mineralKinds', need:1},
    {id:'mineral_10',    cat:'explore', icon:'💎', name:'矿物收藏', desc:'收集 10 种矿物',      kind:'mineralKinds', need:10},
    {id:'mineral_25',    cat:'explore', icon:'💎', name:'矿物学家', desc:'收集 25 种矿物',      kind:'mineralKinds', need:25},
    {id:'mineral_all',   cat:'explore', icon:'🏅', name:'矿物全鉴', desc:'集齐 53 种矿物',      kind:'mineralKinds', need:53},
    {id:'fish_25',       cat:'explore', icon:'🐟', name:'鱼类行家', desc:'钓到 25 种鱼',        kind:'fishKinds',    need:25},
    {id:'fish_50',       cat:'explore', icon:'🐟', name:'鱼类大师', desc:'钓到 50 种鱼',        kind:'fishKinds',    need:50},
    {id:'crops_10',      cat:'farm',    icon:'🌱', name:'十全十美', desc:'收获 10 种作物',      kind:'cropKinds',    need:10},
    {id:'crops_20',      cat:'farm',    icon:'🌾', name:'作物百科', desc:'收获 20 种作物',      kind:'cropKinds',    need:20},
    {id:'build_50',      cat:'gold',    icon:'🏗', name:'建筑巨匠', desc:'累计建造 50 次',      kind:'stat', key:'bd', need:50},
    {id:'income_20000',  cat:'gold',    icon:'💎', name:'富甲一方', desc:'累计收入达到 20000 金币', kind:'stat', key:'inc', need:20000}
  ];
  for (const a of EXTRA) {
    if (!CONFIG.ACHIEVEMENT.LIST.some(x => x.id === a.id)) CONFIG.ACHIEVEMENT.LIST.push(a);
  }
  /* 按分类挑徽章：农业用 farming 徽章、经济用 wealth/building、探索用 museum/fishing… */
  const pools = {};
  for (const a of ANIM_ACHIEVEMENTS) {
    (pools[a.group] || (pools[a.group] = [])).push(a.id);
  }
  const catPool = {
    farm:    [].concat(pools.farming || [], pools.cooking || []),
    gold:    [].concat(pools.wealth || [], pools.building || []),
    social:  [].concat(pools.social || []),
    explore: [].concat(pools.museum || [], pools.fishing || [], pools.adventure || [], pools.quest || [], pools.island || [])
  };
  const used = {};
  CONFIG.ACHIEVEMENT.LIST.forEach(a => {
    if (a.badge) return;
    const pool = catPool[a.cat] || [];
    if (!pool.length) return;
    const k = used[a.cat] = (used[a.cat] || 0);
    a.badge = pool[k % pool.length];
    used[a.cat] = k + 1;
  });
})();


/* 第 32 轮：30 个社区中心收集包，物品名映射到游戏物品，奖励简化为金币。 */
(function addBundles(){
  const ROOM_ICON = { pantry:'🥫', crafts:'🧺', fish:'🎣', boiler:'🔥', bulletin:'📌', vault:'💰' };
  const ROOM_GOLD  = { pantry:800, crafts:900, fish:1000, boiler:1200, bulletin:1200, vault:1500 };
  const SYN = {
    '布料':'cloth', '西红柿':'tomato', '大牛奶':'milk', '大鸡蛋':'egg', '大羊奶':'milk',
    '大棕色鸡蛋':'egg', '大鸭蛋':'duck_egg', '硬木':'wood', '煤炭':'charcoal',
    '椰子':'apple', '山洞萝卜':'carrot', '红蘑菇':'common_mushroom', '紫蘑菇':'common_mushroom',
    '雪山药':'winter_root', '番红花':'tulip', '榛子':'berry', '黑莓':'berry', '野梅':'berry',
    '贝壳':'clam', '牡蛎':'clam', '贻贝':'clam', '水晶果':'frozen_tear',
    '太阳鱼':'fish_crucian', '西鲱':'fish_anchovy', '虎鳟':'fish_bream',
    '大头鱼':'fish_carp', '鲟鱼':'fish_sturgeon', '沙丁鱼':'fish_anchovy',
    '金枪鱼':'fish_tuna', '红鲷鱼':'fish_bream', '罗非鱼':'fish_bream',
    '鲑鱼':'fish_salmon', '大眼鱼':'fish_bream', '龙虾':'crab', '螃蟹':'crab'
  };

  const byName = new Map();
  for (const id in CONFIG.ITEMS) {
    const it = CONFIG.ITEMS[id];
    if (it && it.name && !byName.has(it.name)) byName.set(it.name, id);
  }
  const firstFish = Object.keys(CONFIG.ITEMS).find(id => CONFIG.ITEMS[id].kind === 'fish') || 'fish_crucian';

  function resolve(rawName) {
    const pick = (id, fb) => CONFIG.ITEMS[id] ? id : fb;
    let name = rawName;
    /* 金星 / 铱星品质 → 优质物品 */
    if (name.indexOf('金星') === 0 || name.indexOf('铱星') === 0) {
      const base = name.slice(2);
      if (byName.has(base + '_hq')) return byName.get(base + '_hq');
      name = base;
    }
    if (byName.has(name)) return byName.get(name);
    if (SYN[name]) return pick(SYN[name], firstFish);
    if (SYN[name.replace(/^大/, '')]) return pick(SYN[name.replace(/^大/, '')], firstFish);
    if (name.indexOf('鱼') >= 0) return firstFish;
    if (name.indexOf('牛奶') >= 0 || name.indexOf('羊奶') >= 0) return 'milk';
    if (name.indexOf('蛋') >= 0) return 'egg';
    if (name.indexOf('奶酪') >= 0) return 'cheese';
    if (name.indexOf('果酱') >= 0) return 'jelly';
    if (name.indexOf('蜂蜜') >= 0) return 'honey';
    if (name.indexOf('松露') >= 0) return 'truffle';
    if (name.indexOf('木材') >= 0) return 'wood';
    if (name.indexOf('石头') >= 0) return 'stone';
    if (name.indexOf('蘑菇') >= 0) return 'common_mushroom';
    return 'wildflower';
  }

  CONFIG.BUNDLES = [];
  ANIM_BUNDLES.forEach((b, idx) => {
    const reqMap = {};
    for (const line of b.items) {
      const m = String(line).match(/^(.*?)\s*[×x]\s*(\d+)\s*$/);
      const name = m ? m[1].trim() : String(line).trim();
      const n = m ? Math.max(1, parseInt(m[2], 10) || 1) : 1;
      const id = resolve(name);
      reqMap[id] = (reqMap[id] || 0) + n;
    }
    const items = Object.keys(reqMap).map(id => ({ id, n: reqMap[id] }));
    CONFIG.BUNDLES.push({
      id: b.id, name: b.name, room: b.room,
      roomName: bundleRoomName(b.room),
      icon: ROOM_ICON[b.room] || '🎁',
      items,
      gold: (ROOM_GOLD[b.room] || 800) + idx * 30
    });
  });
  CONFIG.BUNDLE_MAP = Object.fromEntries(CONFIG.BUNDLES.map(b => [b.id, b]));
  CONFIG.BUNDLE_ROOMS = BUNDLE_ROOMS;
})();


/* 第 32 轮：按 demo 补齐 34 位村民，并给原有 3 位也分配 anim 立绘。
 * 所有村民共用镇上的 3 个住宅 + 街道日程；台词按职业生成。 */
(function addDemoVillagers(){
  const SPRITE_OVERRIDE = { aunt:'sandy', carpenter:'robin', girl:'abigail' };
  for (const d of CONFIG.NPC.LIST) {
    if (!d.sprite) d.sprite = SPRITE_OVERRIDE[d.id] || null;
  }

  const byName = new Map();
  for (const id in CONFIG.ITEMS) {
    const it = CONFIG.ITEMS[id];
    if (it && it.name && !byName.has(it.name)) byName.set(it.name, id);
  }

  function parseBday(s) {
    const m = String(s || '').match(/([春夏秋冬])\s*(\d+)/);
    if (!m) return { season:'春', day:1 };
    return { season:m[1], day:Math.max(1, Math.min(28, parseInt(m[2], 10) || 1)) };
  }

  function linesOf(n) {
    const job = n.job || '居民';
    return {
      stranger: [
        '你好，我是' + n.name + '。',
        '我平时做' + job + '。',
        '镇上今天挺热闹的。'
      ],
      known: [
        '又见面了。',
        job + '这活儿，做久了也就顺手了。',
        '有空来家里坐坐。'
      ],
      friend: [
        '你来啦！',
        '最近' + job + '还算顺利。',
        '需要帮忙就说一声。'
      ],
      best: [
        '跟你聊天总是很轻松。',
        '下次我带你看看' + job + '的门道。',
        '别客气，咱们谁跟谁。'
      ]
    };
  }

  const HOMES = ['home_aunt', 'home_carpenter', 'home_girl'];
  let k = 0;
  for (const n of ANIM_NPCS) {
    if (CONFIG.NPC.LIST.some(x => x.id === n.id)) continue;
    const loved = byName.get(n.loved);
    const x = 34 + (k * 3) % 22;
    CONFIG.NPC.LIST.push({
      id: n.id,
      name: n.name,
      icon: '🧑',
      color: n.shirt,
      sprite: n.id,
      like: [loved || 'wildflower', 'wildflower', 'berry'],
      dislike: ['stone', 'pick'],
      bday: parseBday(n.birthday),
      sched: [
        { from:0, to:24, x, y:42 },
        { from:0, to:24, x:36 + (k * 5) % 18, y:42 },
        { from:0, to:24, x:40 + (k * 7) % 14, y:42 }
      ],
      lines: linesOf(n)
    });

    CONFIG.NPC_SCHED.LIST[n.id] = {
      open: { from:9, to:17 },
      house: HOMES[k % HOMES.length],
      work: HOMES[k % HOMES.length],
      sched: [
        { from:6,  to:9,  type:'home',   at:'table' },
        { from:9,  to:12, type:'wander', area:{ x:34, y:41, w:20, h:2 }, label:'镇上' },
        { from:12, to:13, type:'wander', area:{ x:38, y:41, w:14, h:2 }, label:'广场' },
        { from:13, to:18, type:'wander', area:{ x:34, y:41, w:20, h:2 }, label:'街上' },
        { from:18, to:21, type:'wander', area:{ x:40, y:41, w:14, h:2 }, label:'广场' },
        { from:21, to:30, type:'away',   label:'回家了' }
      ]
    };
    k++;
  }
  CONFIG.DEMO_VILLAGERS = k;
})();

/* 第 32 轮：12 位特殊 NPC（博物馆 / 公会 / Joja / 岛屿 / 神秘访客） */
(function addSpecialNpcs(){
  const SEASONS = ['春', '夏', '秋', '冬'];
  const HOMES = ['home_aunt', 'home_carpenter', 'home_girl'];
  let k = 0;
  for (const n of ANIM_SPECIAL_NPCS) {
    if (CONFIG.NPC.LIST.some(x => x.id === n.id)) continue;
    const job = n.job || '访客';
    CONFIG.NPC.LIST.push({
      id: n.id,
      name: n.name,
      icon: '🧑',
      color: n.shirt,
      sprite: n.id,
      special: true,
      like: ['wildflower', 'berry', 'mushroom'],
      dislike: ['stone', 'pick'],
      bday: { season: SEASONS[k % 4], day: 2 + (k * 3) % 27 },
      sched: [
        { from:0, to:24, x: 36 + (k * 3) % 16, y:42 },
        { from:0, to:24, x: 42 + (k * 2) % 12, y:42 }
      ],
      lines: {
        stranger: ['我是' + n.name + '。', '我负责' + job + '。', '这里的人大多不认识我。'],
        known: ['又见面了。', job + '的事，说简单也简单。', '有空再来。'],
        friend: ['你来了。', '最近' + job + '还算顺利。', '有需要可以找我。'],
        best: ['跟你说话很省心。', job + '的门道，我可以慢慢讲给你。', '别拘束。']
      }
    });

    CONFIG.NPC_SCHED.LIST[n.id] = {
      open: { from:10, to:16 },
      house: HOMES[k % HOMES.length],
      work: HOMES[k % HOMES.length],
      sched: [
        { from:6,  to:10, type:'home',   at:'table' },
        { from:10, to:14, type:'wander', area:{ x:36, y:41, w:18, h:2 }, label:'镇上' },
        { from:14, to:18, type:'wander', area:{ x:42, y:41, w:12, h:2 }, label:'广场' },
        { from:18, to:22, type:'wander', area:{ x:36, y:41, w:18, h:2 }, label:'街上' },
        { from:22, to:30, type:'away',   label:'离开了' }
      ]
    };
    k++;
  }
  CONFIG.SPECIAL_VILLAGERS = k;
})();


/* 第 32 轮：110 件装备（62 武器 / 30 戒指 / 18 靴子）作为游戏物品。
 * 武器可在矿井里使用，按 dmg / crit 计算伤害；戒指与靴子目前作为可收集/出售品。 */
(function addEquipmentItems(){
  for (const w of WEAPONS) {
    if (CONFIG.ITEMS[w.id]) continue;
    CONFIG.ITEMS[w.id] = {
      id: w.id, name: w.name, icon: '⚔️', stack: false, max: 1,
      kind: 'weapon', price: 100 + (w.level | 0) * 400,
      dmg: w.dmg, crit: w.crit, weaponCat: w.cat, stat: w.stat
    };
  }
  RINGS.forEach((r, i) => {
    if (CONFIG.ITEMS[r.id]) return;
    CONFIG.ITEMS[r.id] = {
      id: r.id, name: r.name, icon: '💍', stack: false, max: 1,
      kind: 'ring', price: 600 + i * 50, effect: r.effect
    };
  });
  for (const b of BOOTS) {
    if (CONFIG.ITEMS[b.id]) continue;
    CONFIG.ITEMS[b.id] = {
      id: b.id, name: b.name, icon: '🥾', stack: false, max: 1,
      kind: 'boots', price: 400 + (b.def | 0) * 120, defense: b.def, immunity: b.imm
    };
  }
})();


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { T, CONFIG });
export { T, CONFIG };
