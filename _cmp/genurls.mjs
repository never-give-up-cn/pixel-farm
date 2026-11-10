/* 生成 wiki 官方像素图的候选 URL 清单。
 *
 * MediaWiki 的文件存放规则是确定性的：
 *   /mediawiki/images/en/{md5[0]}/{md5[0..1]}/{文件名}.png
 * 文件名一般是官方英文名（空格换下划线）。已人工核对过 wiki 页面里的真实链接：
 *   Carrot.png            -> /mediawiki/images/en/c/c3/Carrot.png
 *   Blueberry.png         -> /mediawiki/images/en/9/9e/Blueberry.png
 *   Carrot_Stage_1.png    -> /mediawiki/images/en/0/09/Carrot_Stage_1.png
 *   Blue_Jazz.png         -> /mediawiki/images/en/2/2f/Blue_Jazz.png
 *
 * 这里为每个条目生成若干候选文件名，逐个算出 URL，随后用 Chrome 实际加载验证哪些存在。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(process.argv[2] || '.');
const ANIM = path.join(ROOT, '_cmp', 'nm', 'anim');

/* ---- 把 js/anim 复制到 _cmp/nm/anim（Node 需要 ESM 上下文，不污染项目本体） ---- */
function syncAnim() {
  fs.mkdirSync(ANIM, { recursive: true });
  const src = path.join(ROOT, 'js', 'anim');
  for (const f of fs.readdirSync(src)) {
    if (!f.endsWith('.js')) continue;
    fs.copyFileSync(path.join(src, f), path.join(ANIM, f));
  }
  fs.writeFileSync(path.join(ROOT, '_cmp', 'nm', 'package.json'), JSON.stringify({ type: 'module' }, null, 1));
}
syncAnim();

const md5path = (name) => {
  const n = name.trim().replace(/\s+/g, '_');
  const h = createHash('md5').update(n, 'utf8').digest('hex');
  const enc = n.replace(/\(/g, '%28').replace(/\)/g, '%29');
  return `/mediawiki/images/en/${h[0]}/${h.slice(0, 2)}/${enc}`;
};
const enc = (s) => s.trim().replace(/\s+/g, '_');

/* ---- 分类定义：模块、数据数组、候选文件名生成 ---- */
const CATS = {
  crops: {
    mod: 'sdv-crops.js', list: 'CROPS',
    cands: (it) => {
      const base = enc(it.en);
      const out = [{ file: `${base}.png`, role: 'icon' }];
      for (let n = 1; n <= 6; n++) out.push({ file: `${base}_Stage_${n}.png`, role: `stage${n}` });
      return out;
    }
  },
  trees: {
    mod: 'trees.js', list: 'TREES',
    cands: (it) => {
      const base = enc(it.en);                                   // "Oak Tree"
      const short = enc(it.en.replace(/\s*Tree$/i, ''));         // "Oak"
      const out = [
        { file: `${base}.png`, role: 'icon' },
        { file: `${short}_tree_portrait.png`, role: 'portrait' },
      ];
      for (let n = 1; n <= 5; n++) out.push({ file: `${short}_Stage_${n}.png`, role: `stage${n}` });
      out.push({ file: `${short}.png`, role: 'fruit' });          // 果树时其实是"果实"图标
      return out;
    }
  },
  fish: {
    mod: 'fish.js', list: 'FISH',
    cands: (it) => {
      const base = enc(it.en);
      return [
        { file: `${base}.png`, role: 'icon' },
        { file: `${base}_Fish.png`, role: 'icon2' },
        { file: `${enc(it.name)}.png`, role: 'icon3' },
      ];
    }
  },
  minerals: {
    mod: 'minerals.js', list: 'MINERALS',
    cands: (it) => {
      const base = enc(it.en);
      return [{ file: `${base}.png`, role: 'icon' }, { file: `${enc(it.name)}.png`, role: 'icon2' }];
    }
  },
  monsters: {
    mod: 'monsters.js', list: 'MONSTERS',
    cands: (it) => {
      const base = enc(it.en);
      return [{ file: `${base}.png`, role: 'icon' }, { file: `${enc(it.name)}.png`, role: 'icon2' }];
    }
  },
  equipment: {
    mod: 'equipment.js', list: 'EQUIPMENT',
    cands: (it) => {
      const base = enc(it.en);
      const out = [{ file: `${base}.png`, role: 'icon' }];
      if (/ring/i.test(it.cat || '') || /ring/i.test(it.en)) {
        out.push({ file: `${base}_Ring.png`, role: 'icon2' }, { file: `Ring_${base}.png`, role: 'icon3' });
      } else if (/boot|shoe/i.test(it.cat || '') || /boot|shoe/i.test(it.en)) {
        out.push({ file: `${base}_Boots.png`, role: 'icon2' });
      }
      return out;
    }
  },
  hats: {
    mod: 'hats.js', list: 'HATS',
    cands: (it) => {
      const base = enc(it.en);
      return [
        { file: `${base}.png`, role: 'icon' },
        { file: `Hat_${base}.png`, role: 'icon2' },
        // wiki 上帽子还有第三种命名：括号后缀，用来和同名道具区分
        // （Golden Mask (hat).png 是帽子本体，Golden Mask.png 是沙漠神器图标）
        { file: `${base} (hat).png`, role: 'hatvar' },
      ];
    }
  },
  artisan: {
    mod: 'artisan.js', list: 'ARTISANS',
    cands: (it) => {
      const base = enc(it.en);
      return [{ file: `${base}.png`, role: 'icon' }, { file: `${enc(it.name)}.png`, role: 'icon2' }];
    }
  },
  dishes: {
    mod: 'dishes.js', list: 'DISHES',
    cands: (it) => {
      const base = enc(it.en);
      return [{ file: `${base}.png`, role: 'icon' }, { file: `${enc(it.name)}.png`, role: 'icon2' }];
    }
  },
  buildings: {
    mod: 'buildings.js', list: 'BUILDINGS',
    cands: (it) => {
      const base = enc(it.en);
      return [{ file: `${base}.png`, role: 'icon' }, { file: `${enc(it.name)}.png`, role: 'icon2' }];
    }
  },
  npcs: {
    mod: 'npcs.js', list: 'NPCS',
    cands: (it) => {
      const base = enc(it.en);
      return [
        { file: `${base}.png`, role: 'icon' },
        { file: `Portrait_${base}.png`, role: 'icon2' },
        { file: `${base}_Portrait.png`, role: 'icon3' },
      ];
    }
  },
  animals: {
    mod: 'animals.js', list: 'ANIMALS',
    // 项目里动物没有 en 字段，这里给出官方英文名
    enMap: { chicken: 'Chicken', duck: 'Duck', cow: 'Cow', sheep: 'Sheep', pig: 'Pig', rabbit: 'Rabbit' },
    cands: (it) => {
      const base = enc(it.en);
      return [{ file: `${base}.png`, role: 'icon' }, { file: `${base}_Animal.png`, role: 'icon2' }];
    }
  }
};

const out = {};
for (const [cat, cfg] of Object.entries(CATS)) {
  const mod = await import(pathToFileURL(path.join(ANIM, cfg.mod)).href);
  const list = mod[cfg.list];
  if (!list) { console.log(`skip ${cat}: no list ${cfg.list}`); continue; }
  const items = list.map((it, i) => {
    const en = cfg.enMap ? (cfg.enMap[it.id] || it.id) : it.en;
    const cands = cfg.cands({ ...it, en }).map(c => ({ ...c, path: md5path(c.file) }));
    return { i, id: it.id, name: it.name, en, cat: it.cat || it.type || it.loc || '', cands };
  });
  out[cat] = { items, total: items.reduce((s, it) => s + it.cands.length, 0) };
  console.log(`${cat.padEnd(11)} ${String(items.length).padStart(3)} 条, ${out[cat].total} 个候选 URL`);
}

fs.writeFileSync(path.join(ROOT, '_cmp', 'candidates.json'), JSON.stringify(out, null, 1));
console.log('total candidate urls:', Object.values(out).reduce((s, c) => s + c.total, 0));
