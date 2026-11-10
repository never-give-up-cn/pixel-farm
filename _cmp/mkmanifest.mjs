/* 由验证结果生成各分类的对比清单（_cmp/manifest/<cat>.json）。
 *
 * 选择主图的原则：要和"本项目画的是什么"对齐。
 *   - 作物：项目画的是地里的植株 -> 用最后一阶段生长图（*_Stage_N）
 *   - 树木：项目画的是成熟大树 -> 用 Stage_5（若有）否则用 portrait
 *   - 其余：用物品图标
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const MAN = path.join(ROOT, '_cmp', 'manifest');
fs.mkdirSync(MAN, { recursive: true });

const verified = JSON.parse(fs.readFileSync(path.join(ROOT, '_cmp', 'verified.json'), 'utf8'));

/* 作物专用：队友核过 wiki 作物页的 Stages 表，
 * 最后一列是 After-Harvest（采摘后的空植株），倒数第二列才是 Harvest（挂着果的成熟植株）。
 * 本项目画的是成熟植株，所以主图必须取 harvest_sprite。 */
const cropHarvest = (() => {
  const f = path.join(MAN, '_extra-crops.json');
  if (!fs.existsSync(f)) return {};
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  return j.harvest_sprite || {};
})();

/* 队友核过的"主图覆盖表"：某些条目在 wiki 上有多个同名文件，
 * 需要指定到底该用哪一个（如 Golden Mask (hat).png 才是帽子本体，
 * Golden Mask.png 是沙漠神器图标）。格式 {id: "文件名.png"}（条目 id 全局唯一）。 */
const primaryOverride = (() => {
  const map = {};
  for (const f of fs.readdirSync(MAN)) {
    if (!f.startsWith('_extra-')) continue;
    const j = JSON.parse(fs.readFileSync(path.join(MAN, f), 'utf8'));
    if (j._primary && typeof j._primary === 'object') {
      for (const [id, file] of Object.entries(j._primary)) map[id] = file;
    }
  }
  return map;
})();

/* 选主图 */
function pick(cat, it, id) {
  const good = it.cands.filter(c => c.exists);
  const byRole = r => good.filter(c => c.role === r);
  let best = null, extras = [];

  const stageOf = c => {
    const m = /_Stage_(\d+)/.exec(c.file);
    return m ? parseInt(m[1], 10) : 0;
  };
  const portrait = good.find(c => /portrait/i.test(c.file));

  if (cat === 'crops') {
    const stages = good.filter(c => stageOf(c) > 0).sort((a, b) => stageOf(b) - stageOf(a));
    const icon = good.find(c => c.role === 'icon');
    const want = cropHarvest[id];
    const harvest = want ? good.find(c => c.file === want) : null;
    best = harvest || stages[0] || icon || null;
    extras = stages.filter(c => c !== best).map(c => ({ label: 'Stage ' + stageOf(c), path: c.path }));
    if (icon && icon !== best) extras.push({ label: 'Item', path: icon.path });
  } else if (cat === 'trees') {
    const stages = good.filter(c => stageOf(c) > 0).sort((a, b) => stageOf(b) - stageOf(a));
    if (stages.length) best = stages[0];
    else if (portrait) best = portrait;
    else best = good[0];
    extras = stages.slice(1).map(c => ({ label: 'Stage ' + stageOf(c), path: c.path }));
    if (portrait) extras.push({ label: 'Portrait', path: portrait.path });
  } else {
    best = byRole('icon')[0] || good[0] || null;
    extras = good.filter(c => c !== best).map(c => ({ label: c.role, path: c.path }));
  }
  /* 覆盖表优先：wiki 上同名文件有多个时，用队友核对过的那一个 */
  const forced = primaryOverride[id];
  if (forced) {
    const key = forced.replace(/\s+/g, '_');
    const f = good.find(c => c.file.replace(/\s+/g, '_') === key);
    if (f) {
      extras = [{ label: 'Auto', path: best ? best.path : f.path },
                ...extras.filter(e => e.path !== f.path)]
      best = f;
    }
  }
  return { best, extras };
}

const out = {};
for (const [cat, items] of Object.entries(verified)) {
  const list = [];
  const missing = [];
  for (const [id, it] of Object.entries(items)) {
    const { best, extras } = pick(cat, it, id);
    if (!best) { missing.push({ id, en: it.en, reason: 'wiki 上未找到对应像素图' }); continue; }
    list.push({
      id, name: it.name, en: it.en,
      wikiIcon: best.path,
      wikiSize: [best.w, best.h],
      wikiFile: best.file,
      wikiExtra: extras,
    });
  }
  out[cat] = { category: cat, items: list, missing };
  fs.writeFileSync(path.join(MAN, `${cat}.json`), JSON.stringify(out[cat], null, 1), 'utf8');
  console.log(`${cat.padEnd(11)} 条目 ${String(list.length).padStart(3)}  缺失 ${String(missing.length).padStart(3)}`);
}
