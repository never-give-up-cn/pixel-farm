/* 为每个分类生成"原生分辨率网格"页面，供 Python 切片做逐像素比对。
 *
 * 网格结构：
 *   上半部分 = 本项目程序化绘制的精灵（1:1，无缩放，居中）
 *   下半部分 = stardewvalleywiki.com 官方原图（1:1，自然尺寸，左上角对齐）
 * 格子边长按该分类需要的最大尺寸动态取值，避免裁掉大图。
 *
 * wiki 图片按 16 张一批加载，避免一次发上百个请求被限流。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const OUT = path.join(ROOT, '_cmp', 'out');
const MAN = path.join(ROOT, '_cmp', 'manifest');
fs.mkdirSync(OUT, { recursive: true });

const PERROW = 8;
const BATCH = 16;

/* 每个分类：项目模块 + 数据数组 + 画法 + 画布尺寸常量 */
const CATS = {
  crops: {
    mod: '../../js/anim/sdv-crops.js', list: 'CROPS', w: 'CROP_W', h: 'CROP_H',
    draw: 'drawCrop', drawExpr: 'mod.drawCrop(g, item, item.days, 0.25)'
  },
  trees: {
    mod: '../../js/anim/trees.js', list: 'TREES', w: 'TREE_W', h: 'TREE_H',
    draw: 'drawTree', drawExpr: "mod.drawTree(g, item, 4, '春', 0.25)"
  },
  fish: {
    mod: '../../js/anim/fish.js', list: 'FISH', w: 'FISH_W', h: 'FISH_H',
    draw: 'drawFishIcon', drawExpr: 'mod.drawFishIcon(g, item, 0.25)'
  },
  minerals: {
    mod: '../../js/anim/minerals.js', list: 'MINERALS', w: 'MINERAL_W', h: 'MINERAL_H',
    draw: 'drawMineral', drawExpr: 'mod.drawMineral(g, item, 0.25)'
  },
  monsters: {
    mod: '../../js/anim/monsters.js', list: 'MONSTERS', w: 'MONSTER_W', h: 'MONSTER_H',
    draw: 'drawMonster', drawExpr: 'mod.drawMonster(g, item, 0.25)'
  },
  equipment: {
    mod: '../../js/anim/equipment.js', list: 'EQUIPMENT', w: 'EQUIP_W', h: 'EQUIP_H',
    draw: 'drawEquipment', drawExpr: 'mod.drawEquipment(g, item, 0.25)'
  },
  hats: {
    mod: '../../js/anim/hats.js', list: 'HATS', w: 'HAT_W', h: 'HAT_H',
    draw: 'drawHatIcon', drawExpr: 'mod.drawHatIcon(g, item, 0.25)'
  },
  artisan: {
    mod: '../../js/anim/artisan.js', list: 'ARTISANS', w: 'ARTISAN_W', h: 'ARTISAN_H',
    draw: 'drawArtisan', drawExpr: 'mod.drawArtisan(g, item, 0.25)'
  },
  dishes: {
    mod: '../../js/anim/dishes.js', list: 'DISHES', w: 'DISH_W', h: 'DISH_H',
    draw: 'drawDish', drawExpr: 'mod.drawDish(g, item, 0.25)'
  },
  buildings: {
    mod: '../../js/anim/buildings.js', list: 'BUILDINGS', w: 'BUILDING_W', h: 'BUILDING_H',
    draw: 'drawBuilding', drawExpr: 'mod.drawBuilding(g, item, 0.25)'
  },
  npcs: {
    mod: '../../js/anim/npcs.js', list: 'NPCS', w: 'PORTRAIT_W', h: 'PORTRAIT_H',
    draw: 'drawNpcPortrait', drawExpr: 'mod.drawNpcPortrait(g, item)'
  },
  animals: {
    mod: '../../js/anim/animals.js', list: 'ANIMALS', w: 'ANIMAL_W', h: 'ANIMAL_H',
    draw: 'drawAnimal', drawExpr: "mod.drawAnimal(g, item.id, 'idle', 0, 1)"
  },
  bundles: {
    mod: '../../js/anim/bundles.js', list: 'BUNDLES', w: 'BUNDLE_W', h: 'BUNDLE_H',
    draw: 'drawBundleIcon', drawExpr: 'mod.drawBundleIcon(g, item, 0.25)'
  },
  ui: {
    mod: '../../js/anim/ui-icons.js', list: 'UI_ICONS', w: 'UI_W', h: 'UI_H',
    draw: 'drawUiIcon', drawExpr: 'mod.drawUiIcon(g, item, 0.25)'
  },
  cropitems: {
    mod: '../../js/anim/crop-items.js', list: 'CROP_ITEMS', w: 'ITEM_W', h: 'ITEM_H',
    draw: 'drawProduceIcon',
    drawExpr: "item.group === 'seed' ? mod.drawSeedPacket(g, item.crop, 0.25) : mod.drawProduceIcon(g, item.crop, 0.25)"
  }
};

const built = [];
for (const [cat, cfg] of Object.entries(CATS)) {
  const mf = path.join(MAN, `${cat}.json`);
  if (!fs.existsSync(mf)) { console.log(`skip ${cat} (no manifest)`); continue; }
  let man;
  try { man = JSON.parse(fs.readFileSync(mf, 'utf8')); }
  catch (e) { console.log(`skip ${cat} (bad json: ${e.message})`); continue; }

  const items = (man.items || [])
    .filter(m => m.wikiIcon && m.wikiSize && m.wikiSize[0] > 0)
    .map(m => ({
      id: m.id, name: m.name, en: m.en,
      wikiPath: m.wikiIcon, wikiSize: m.wikiSize, wikiFile: m.wikiFile || '',
    }));

  if (!items.length) { console.log(`skip ${cat} (no usable items)`); continue; }

  const maxW = Math.max(...items.map(i => i.wikiSize[0]));
  const maxH = Math.max(...items.map(i => i.wikiSize[1]));
  const CELL = Math.max(96, maxW + 4, maxH + 4);
  const rows = Math.ceil(items.length / PERROW);

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:transparent}
.grid{display:grid;grid-template-columns:repeat(${PERROW}, ${CELL}px);width:${PERROW * CELL}px}
.cell{width:${CELL}px;height:${CELL}px;position:relative;overflow:hidden}
canvas{position:absolute;image-rendering:pixelated}
img{position:absolute;left:0;top:0;image-rendering:pixelated}
</style></head><body>
<div id="ours" class="grid"></div>
<div id="wiki" class="grid"></div>
<script type="module">
const MANIFEST = ${JSON.stringify(items)};
const CFG = ${JSON.stringify({ mod: cfg.mod, list: cfg.list, w: cfg.w, h: cfg.h, draw: cfg.draw, drawExpr: cfg.drawExpr })};
const CELL = ${CELL}, PERROW = ${PERROW}, BATCH = ${BATCH};
const mod = await import(CFG.mod);
const list = CFG.list ? mod[CFG.list] : [];
const map = Object.fromEntries(list.map(x => [x.id, x]));
const W = mod[CFG.w], H = mod[CFG.h];
const gOurs = document.getElementById('ours'), gWiki = document.getElementById('wiki');
const OX = Math.floor((CELL - W) / 2), OY = Math.floor((CELL - H) / 2);

const ours = MANIFEST.map(m => {
  const item = map[m.id];
  const c1 = document.createElement('div'); c1.className = 'cell';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  if (item && CFG.draw) { try { eval(CFG.drawExpr); } catch (e) { console.error('draw', m.id, e); } }
  cv.style.left = OX + 'px'; cv.style.top = OY + 'px';
  c1.appendChild(cv); gOurs.appendChild(c1);
  return c1;
});

const wiki = [];
for (let i = 0; i < MANIFEST.length; i += BATCH) {
  const batch = [];
  for (let j = i; j < Math.min(i + BATCH, MANIFEST.length); j++) {
    const m = MANIFEST[j];
    const c2 = document.createElement('div'); c2.className = 'cell';
    const img = document.createElement('img');
    c2.appendChild(img); gWiki.appendChild(c2);
    batch.push(new Promise(resolve => {
      img.onload = resolve; img.onerror = resolve;
      img.src = 'https://stardewvalleywiki.com' + m.wikiPath;
    }));
  }
  await Promise.all(batch);
}
document.title = 'READY';
</script></body></html>`;

  fs.writeFileSync(path.join(OUT, `${cat}.grid.html`), html);
  fs.writeFileSync(path.join(OUT, `${cat}.meta.json`), JSON.stringify({
    cat, count: items.length, cell: CELL, perRow: PERROW, rows,
    gridW: PERROW * CELL, gridH: rows * CELL,
    oursW: cfg.w, oursH: cfg.h,
    items
  }, null, 1));
  built.push(cat);
  console.log(`built ${cat}: ${items.length} items, cell=${CELL}`);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(built, null, 1));
console.log('done:', built.join(', '));
