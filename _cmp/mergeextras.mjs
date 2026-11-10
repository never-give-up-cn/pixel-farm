/* 把队友补交的额外候选文件名合并进 candidates.json（幂等）。 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(process.argv[2] || '.');
const MAN = path.join(ROOT, '_cmp', 'manifest');
/* MediaWiki 存文件名：空格 -> 下划线；MD5 走"下划线版"文件名；
 * URL 路径里括号要转义成 %28 / %29。 */
const norm = (n) => n.trim().replace(/\s+/g, '_');
const md5path = (name) => {
  const n = norm(name);
  const h = createHash('md5').update(n, 'utf8').digest('hex');
  const enc = n.replace(/\(/g, '%28').replace(/\)/g, '%29');
  return `/mediawiki/images/en/${h[0]}/${h.slice(0, 2)}/${enc}`;
};

const candPath = path.join(ROOT, '_cmp', 'candidates.json');
const cand = JSON.parse(fs.readFileSync(candPath, 'utf8'));

let added = 0;
const seen = new Set();

/* 明确排除：wiki 上只有大插画、不是同尺寸小精灵图的条目 */
const SKIP = {
  'monsters/shadow_guy': 'wiki 上只有 Shadowguy.png（925x537 的 Secret Notes 立绘），不是小精灵图，不具可比性',
};

for (const f of fs.readdirSync(MAN)) {
  if (!f.startsWith('_extra-')) continue;
  const j = JSON.parse(fs.readFileSync(path.join(MAN, f), 'utf8'));
  /* 兼容两种结构：{cat:'x', items:{...}} 或 {分类:{id:[...]}} */
  let groups = {};
  if (typeof j.cat === 'string' && j.items && typeof j.items === 'object') {
    groups[j.cat] = j.items;
  } else {
    for (const [k, v] of Object.entries(j)) {
      if (k.startsWith('_')) continue;
      if (v && typeof v === 'object' && !Array.isArray(v)) groups[k] = v;
    }
  }
  for (const [cat, items] of Object.entries(groups)) {
    if (!cand[cat]) { console.log(`  ! 分类 ${cat} 不在候选集中，跳过`); continue; }
    for (const it of cand[cat].items) {
      const skipKey = `${cat}/${it.id}`;
      if (SKIP[skipKey]) { console.log(`  - 跳过 ${skipKey}: ${SKIP[skipKey]}`); continue; }
      const list = Array.isArray(items[it.id]) ? items[it.id] : [];
      for (const raw of list) {
        if (typeof raw !== 'string') continue;
        const name = norm(raw);
        const key = `${cat}/${it.id}/${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (it.cands.some(c => c.file === name)) continue;
        it.cands.push({ file: name, role: 'extra', path: md5path(name) });
        added++;
      }
    }
  }
}
if (added) {
  fs.writeFileSync(candPath, JSON.stringify(cand, null, 1));
}
console.log(`merged extra candidates: +${added}`);
