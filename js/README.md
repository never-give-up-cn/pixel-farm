# js/ 目录说明

`index.html` 现在只加载一个入口：

```html
<script type="module" src="js/main.js"></script>
```

其余代码全部在 `js/` 下，按功能拆成独立模块。**改某个功能时，只需要找对应的文件。**

## 运行

ES Modules 在 `file://` 下会被浏览器的 CORS 策略拦住，必须用 HTTP 打开。

```bash
node serve.js
# 打开 http://127.0.0.1:8123/index.html
```

也可以用自己的静态服务器：

```bash
python -m http.server 8123 --bind 127.0.0.1
```

`serve.js` 是零依赖的 Node 静态服务器，默认监听 `127.0.0.1:8123`，并给 `.js` 返回正确的 `text/javascript`。

## 入口与加载顺序

`js/main.js` 只做一件事：按**原单文件脚本的执行顺序** import 所有模块。

```js
import './config.js';
import './world/buildings.js';
// ...
```

这个顺序不能随便改：模块顶层会立即执行初始化代码、读取前面的常量。新增文件时，把 `import` 放到它依赖的模块之后。

## 目录结构

| 目录 | 负责 |
| --- | --- |
| `js/config.js` | `CONFIG` 全部可调参数、地块类型 `T`、物品/作物/商店/NPC 日程等配置 |
| `js/world/` | 地图生成、建筑定义 |
| `js/render/` | 瓦片、建筑、作物、实体、建造预览的 Canvas 绘制 |
| `js/systems/` | 玩法系统：背包、建造、碰撞、体力、商店、时间、天气、睡觉、钓鱼、动物、委托、节日、统计、加工台、矿井、终局等 |
| `js/ui/` | DOM 面板：背包/商店/系统菜单/暂停菜单/开始菜单/提示 |
| `js/npc/` | NPC：状态、日程、连续移动、对话、送礼、来访、好感、存档、绘制 |
| `js/anim/` | 可复用的像素动画：农夫 / 作物 / 树木 / 矿物 / 鱼 / 建筑 / 工匠品 / 料理 / 村民 / 动物 / 怪物 / 装备 / 帽子 / 衣物 / 室内 / 资源 / 宠物 / 产品 / 特殊 NPC / 成就 / 收集包 / UI / 食谱 / 种子 / 杂项、像素绘制、帧缓存、播放器与图集导出 |
| `js/anim-demo-catalog.js` | 通用图鉴面板：列表 / 筛选 / 计数 / 图鉴网格 / 单图导出 |
| `js/anim-demo.js` | 动画测试页入口与标签切换（不进 `main.js`） |
| `js/anim-demo-plants.js` | 植物图鉴测试面板 |
| `js/anim-demo-animals.js` | 动物图鉴测试面板 |
| `js/anim-demo-trees.js` | 树木图鉴测试面板 |
| `js/anim-demo-minerals.js` | 矿物 / 宝石图鉴测试面板 |
| `js/anim-demo-fish.js` | 鱼类图鉴测试面板 |
| `js/anim-demo-buildings.js` | 农场建筑图鉴测试面板 |
| `js/anim-demo-npcs.js` | NPC 头像与行走测试面板 |
| `js/anim-demo-artisan.js` | 工匠品图鉴测试面板 |
| `js/anim-demo-dishes.js` | 料理图鉴测试面板 |
| `js/anim-demo-monsters.js` | 怪物图鉴测试面板 |
| `js/anim-demo-equipment.js` | 武器 / 戒指 / 靴子图鉴测试面板 |
| `js/anim-demo-hats.js` | 帽子图鉴与农夫试戴测试面板 |
| `js/anim-demo-clothes.js` | 衬衫 / 裤子纸娃娃测试面板 |
| `js/anim-demo-interior.js` | 家具 / 墙纸 / 地板房间预览面板 |
| `js/anim-demo-resources.js` | 工具 / 矿石 / 材料 / 采集 / 古物面板 |
| `js/anim-demo-pets.js` | 猫 / 狗 / 乌龟 / 马宠物面板 |
| `js/anim-demo-products.js` | 蛋 / 奶 / 动物产品面板 |
| `js/anim-demo-special-npcs.js` | 特殊 NPC 头像与行走面板 |
| `js/anim-demo-achievements.js` | 49 个成就徽章面板 |
| `js/anim-demo-bundles.js` | 社区中心收集包面板 |
| `js/anim-demo-ui.js` | UI 图标设计稿面板 |
| `js/anim-demo-recipes.js` | 81 张食谱卡面板 |
| `js/anim-demo-crop-items.js` | 种子包 / 农产品面板 |
| `js/anim-demo-misc.js` | 邮件 / 书籍 / 饰品 / 电影面板 |
| `js/anim-demo-battle.js` | 实时战斗演示面板 |
| `js/anim-demo-mine.js` | 可操作矿井探索面板 |
| `js/anim-demo-town.js` | 鹈鹕镇村民日程面板 |
| `js/player.js` | 玩家精灵与朝向 |
| `js/town.js` | 小镇建筑、房间、街道的查询 |
| `js/audio.js` | 音效与音量 |
| `js/save.js` | 存档序列化/反序列化 |
| `js/main-loop.js` | 固定步长主循环、更新与渲染调度 |
| `js/boot.js` | 启动初始化、读档判断、`requestAnimationFrame(loop)` |
| `js/debug.js` | `window.__game` 调试钩子（需开启 `CONFIG.DEBUG_HOOK`） |

## 改功能去哪找

| 想改什么 | 文件 |
| --- | --- |
| 数值、价格、作物生长天数、NPC 日程数据 | `js/config.js` |
| 地图生成、地形 | `js/world/map.js` |
| 建筑外观/布局 | `js/world/buildings.js` + `js/render/buildings.js` |
| 地面/作物/实体怎么画 | `js/render/` 下对应文件 |
| 玩家移动、碰撞、体力 | `js/systems/collision.js`、`js/systems/stamina.js` |
| 锄地、浇水、播种、收获 | `js/systems/crops.js`、`js/systems/soil.js` |
| 工具切换与使用 | `js/systems/tools.js` |
| 背包、物品增删、快捷栏 | `js/systems/inventory.js` |
| 商店买卖、价格浮动 | `js/systems/shop.js` + `js/ui/shop-panel.js` |
| 时间、季节、天气 | `js/systems/time.js`、`js/systems/weather.js` |
| 睡觉/跨天 | `js/systems/sleep.js` |
| 钓鱼 | `js/systems/fishing.js` |
| 矿井 / 战斗 | `js/systems/mine.js` + `js/anim/monsters.js` + `js/anim/farmer.js` |
| 动物/鸡舍/牛棚 | `js/systems/animals.js` |
| 建造模式 | `js/systems/build.js` + `js/ui/panels.js` |
| 委托 | `js/systems/quests.js` |
| 节日/日历/好感总览面板 | `js/systems/festival.js` |
| 成就/统计 | `js/systems/stats.js` |
| 加工台 | `js/systems/maker.js` |
| 评级/终局结算 | `js/systems/endgame.js` |
| 输入、按键、暂停 | `js/systems/input.js` |
| NPC 日程/站位 | `js/npc/schedule.js` |
| NPC 连续移动/寻路 | `js/npc/runtime.js` |
| NPC 对话/送礼/好感 | `js/npc/dialog.js`、`js/npc/gift.js`、`js/npc/perks.js` |
| NPC 来访农场 | `js/npc/visit.js` |
| 存档 | `js/save.js`、`js/npc/save.js` |
| 启动流程 | `js/boot.js` |
| 主循环 | `js/main-loop.js` |

## 动画模块（js/anim/）

独立的像素动画层，包含农夫、星露谷 50 种作物、18 棵树、53 种矿物、72 种鱼、25 种建筑、28 种工匠品、81 道料理、34 位村民、6 种动物、49 种怪物、110 件装备、90 顶帽子、80 件衣物、152 件室内物品、100 种资源、15 只宠物、24 种动物产品、12 位特殊 NPC、49 个成就、30 个收集包、60 个 UI 图标、81 张食谱卡、100 个种子/农产品与 44 项杂项二十五套精灵，以及实时战斗、可操作矿井和小镇日程演示，不读写任何游戏全局状态，也不依赖 `CONFIG` / `player`，可以直接被游戏复用。

| 文件 | 负责 |
| --- | --- |
| `js/anim/pixel.js` | 32×40 精灵格常量、调色板、`R/px/line/ellipse`、缓动与关键帧插值 |
| `js/anim/farmer-body.js` | 关节基础姿势、站立/睡觉绘制、草帽与手臂 |
| `js/anim/farmer-tools.js` | 锄头/斧头/镐/镰刀/水壶/鱼竿，土屑与水滴粒子 |
| `js/anim/farmer.js` | 15 个动作姿势（含挥剑 / 吃东西 / 倒地）；`drawFarmer(ctx, action, dir, phase)` |
| `js/anim/sdv-crops.js` | 星露谷 50 种作物 × 逐日生长；`drawCrop(ctx, type, day, phase)`，一帧 = 一天；`drawWithered(ctx)` 为所有作物共用的枯萎帧 |
| `js/anim/animals.js` | 6 种动物 × 4 个动作、帧缓存；`drawAnimal` / `AnimalAnimator` |
| `js/anim/trees.js` | 10 种野生树 + 8 种果树；`drawTree(ctx, tree, stage, season, phase)`，48×56 |
| `js/anim/minerals.js` | 53 种矿物/宝石图标；`drawMineral(ctx, mineral, phase)`，32×32 |
| `js/anim/fish.js` | 72 种鱼类/水生生物图标；`drawFishIcon(ctx, fish, phase)`，40×32 |
| `js/anim/buildings.js` | 25 种农场建筑；`drawBuilding(ctx, building, phase)`，72×64 |
| `js/anim/npcs.js` | 34 位村民头像与四方向行走；外观参考官方 Wiki 村民肖像，程序化重绘 |
| `js/anim/artisan.js` | 28 种工匠品图标；`drawArtisan(ctx, item, phase)`，32×32 |
| `js/anim/dishes.js` | 81 道料理图标；`drawDish(ctx, dish, phase)`，32×32 |
| `js/anim/monsters.js` | 49 种怪物图标；`drawMonster(ctx, monster, phase, { state, t })`，支持 idle / attack / hurt / die，40×32 |
| `js/anim/equipment.js` | 110 件装备图标（62 武器 / 30 戒指 / 18 靴子）；`drawEquipment(ctx, item, phase)`，32×32 |
| `js/anim/hats.js` | 90 顶帽子图标；`drawHatIcon(ctx, hat, phase)`（32×32）与 `drawHatOnFarmer(ctx, hat, dir, phase)` 试戴叠加 |
| `js/anim/clothes.js` | 80 件衣物图标（64 衬衫 / 16 裤子）；`drawClothingIcon` 与 `makeOutfit(shirt, pants)` 纸娃娃参数 |
| `js/anim/interior.js` | 152 件室内物品（96 家具 / 32 墙纸 / 24 地板）；`drawFurnitureIcon`、`drawWallpaperTile`、`drawFloorTile` |
| `js/anim/resources.js` | 100 种资源图标（11 工具 / 17 矿石 / 24 材料 / 24 采集 / 24 古物）；`drawResourceIcon(ctx, item, phase)`，32×32 |
| `js/anim/pets.js` | 15 只宠物；`drawPet(ctx, pet, action, dir, phase)`，40×32，含猫 / 狗 / 乌龟 / 马 |
| `js/anim/products.js` | 24 种动物产品；`drawProductIcon(ctx, item, phase)`，32×32 |
| `js/anim/special-npcs.js` | 12 位特殊 NPC；复用村民头像/行走绘制，新增眼罩支持 |
| `js/anim/achievements.js` | 49 个成就徽章；`drawAchievementIcon(ctx, achievement, phase)`，32×32 |
| `js/anim/bundles.js` | 30 个社区中心收集包；`drawBundleIcon(ctx, bundle, phase)`，32×32 |
| `js/anim/ui-icons.js` | 60 个 UI 图标；`drawUiIcon(ctx, icon, phase)`，32×32 |
| `js/anim/recipes.js` | 81 张食谱卡数据，含配料、增益与菜系 |
| `js/anim/crop-items.js` | 100 个种子包 / 农产品图标；复用 `CROPS` 的 produce 造型 |
| `js/anim/misc.js` | 44 项杂项图标（12 邮件 / 16 书籍 / 8 饰品 / 8 电影） |
| `js/anim-demo-battle.js` | 实时战斗演示：农夫攻击、怪物反击、伤害数字、血条与连击 |
| `js/anim-demo-mine.js` | 可操作矿井：13×9 房间、移动、攻击、矿石、怪物与下一层 |
| `js/anim-demo-town.js` | 小镇日程：12 位村民按时间移动、头像与职业查看 |
| `js/anim/animator.js` | 农夫动作元数据、帧缓存、`Animator` 播放器 |
| `js/anim/atlas.js` | 图集导出：`buildAtlas` / `buildFarmerAtlas` / `buildCatalogAtlas` / `downloadAtlas`（PNG + JSON） |
| `js/systems/mine.js` | 游戏本体的矿井模式：按 `J` 进入，移动 / 攻击 / 矿石 / 怪物 / 下一层，接管更新与渲染 |

```js
import { Animator, DIR_DOWN } from './anim/animator.js';

const animator = new Animator({ action: 'walk', dir: DIR_DOWN });
// 每个逻辑帧调用
animator.update(dt);
// 绘制到任意画布，scale 为整数倍
animator.draw(ctx, x, y, 4);
```

```js
import { drawCrop } from './anim/sdv-crops.js';
import { AnimalAnimator } from './anim/animals.js';

drawCrop(ctx, 'tomato', 6, phase);               // 第 6 天，32×40 格
const cow = new AnimalAnimator({ type: 'cow', action: 'eat', facing: -1 });
cow.update(dt);
cow.draw(ctx, x, y, 4);                          // 40×32 格
```

- `phase` 范围 0~1；循环动作最后一帧用 `frame / frames`，单次动作用 `frame / (frames - 1)`。
- 农夫每帧先画进 32×40 的离屏 canvas 并缓存；动物用 40×32 的格子，同样走帧缓存。
- 朝左复用朝右的侧视图，在 `drawFarmer` / `drawAnimal` 内水平翻转。
- 新增农夫动作时，在 `farmer.js` 里加姿势分支，并在 `animator.js` 的 `ACTIONS` 里登记帧数/FPS/是否循环。
- 新增作物时，在 `sdv-crops.js` 的 `CROPS` 里加数据；`day` 直接对应生长天数，一帧 = 一天。
- 换季规则：新季节不在作物的 `season` 里时，用 `drawWithered` 画通用枯萎帧；官方多季作物为上古水果、咖啡豆、玉米、向日葵、小麦。
- 新增动物时，在 `animals.js` 的 `ANIMALS` 里登记，并补一个 `drawXxx` 绘制函数。
- 给农夫叠加帽子时用 `drawFarmer(ctx, action, dir, phase, { noHat: true })` 先隐藏默认草帽，再调用 `drawHatOnFarmer`。
- 换装时把 `makeOutfit(shirt, pants)` 的结果传给 `drawFarmer` 的 `{ outfit }`，即可替换上衣、裤子、裙子和袖子。
- 室内墙纸/地板用 `drawWallpaperTile` / `drawFloorTile` 生成 32×32 贴图，再通过 `createPattern` 平铺。
- 战斗演示使用 `drawFarmer(ctx, 'attack', dir, phase)` 的挥剑姿势，武器按 `drawEquipment` 叠加显示。
- 矿井演示使用 `drawFarmer` 的行走 / 攻击动作，配合 `drawMonster` 与 `drawResourceIcon` 组合场景。
- 小镇演示用 `drawNpcWalk` 按时间在多个地点之间移动，并用 `drawNpcPortrait` 显示选中村民头像。

测试页入口是根目录的 `anim-demo.html`，由 `js/anim-demo.js` 驱动，不加入 `js/main.js`。作物数据按 Stardew Valley 1.6.15 作物表整理，`day` 从 1 到 `days`，一帧对应一天。

## 模块桥（过渡方案）

原代码是一个全局作用域，跨文件大量读写同一批变量。ES Module 的 import 绑定是只读的，不能 `export let gold` 之后在另一个文件里 `gold += 1`。所以当前采用过渡写法：

- 每个文件是真正的 ES Module；
- 顶层 `const` / `function` / `class` 留在模块内，文件末尾统一：

  ```js
  Object.assign(window, { foo, bar });
  export { foo, bar };
  ```

- 顶层 `let` / `var` 改写成 `window.X = ...`，这样其他文件里的 `X = ...` 仍然能赋值；
- 其他文件通过全局名访问这些符号（等价于原来的跨 `<script>` 访问）。

这意味着：

1. **新增函数/常量**时，记得把它加进文件末尾的 `Object.assign(window, {...})` 和 `export { ... }`，否则别的文件看不到。
2. **新增可变全局状态**用 `window.X = ...`，不要用裸 `let X`。
3. 后续可以逐步把 `window.X` 收进 `state.js`，再把跨文件调用改成显式 `import`。

## NPC 日程约定

`CONFIG.NPC_SCHED.LIST[npcId]` 是每个 NPC 的日程表：

```js
aunt: {
  house: 'farmhouse',
  work: 'shop',
  sched: [
    { from: 6,  to: 10, x: 29, y: 50 },          // 6:00–10:00 在 (29,50)
    { from: 10, to: 14, x: 9,  y: 47 },          // 10:00–14:00 在 (9,47)
    { from: 21, to: 30, x: 22, y: 51, type: 'sleep' } // 跨午夜
  ]
}
```

规则：

- 每条 `sched` 是 `{ from, to, x, y }`，`from <= h < to` 时 NPC 出现在 `(x, y)`；
- `to > 24` 表示跨到次日（`{from:21, to:30}` = 21:00 ~ 次日 6:00）；
- 不在任何区间 = 回家/看不见；
- 可选字段：`type`（`work` / `home` / `sleep` / `wander` / `away`）、`label`、`at`；
- 写了 `x` / `y` 时直接使用字面坐标，不再从家具或瞎逛范围推导；
- 不写 `x` / `y` 时保留旧的推导方式（`type: 'work'` 找柜台、`home` 找家具、`wander` 找街上空位）。

相关函数都在 `js/npc/schedule.js`：

| 函数 | 返回 |
| --- | --- |
| `inHours(h, from, to)` | 小时是否落在区间内（支持跨午夜） |
| `npcCurrentState(d, day, hour)` | 当前完整状态（含 `type/at/x/y/label/from/to`） |
| `npcSpot(d)` | 当前时段 `{x, y, from, to, at, label, type}` |
| `npcWhere(d)` | 当前逻辑位置 `{x, y, at, label, from, to, type}`，含节日/来访覆盖 |
| `npcPos(d)` | 运行时像素坐标 `{x, y, tx, ty}`（连续移动中的实际位置） |
| `npcHidden(d)` | 不在玩家所在区域时返回 `true`，`drawEntities` 会跳过 |

> 当前 `npcPos` 仍是第 27 轮的连续移动版本：NPC 会朝目标慢慢走。若要改成“换时段瞬移”，把 `npcPos` 改为直接返回 `(x + 0.5) * TILE` 即可，`js/npc/runtime.js` 可以保留给以后使用。
