/* 列出没找到官方图的条目，方便补候选文件名。 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const v = JSON.parse(fs.readFileSync(path.join(ROOT, '_cmp', 'verified.json'), 'utf8'));
const lines = [];
for (const [cat, items] of Object.entries(v)) {
  const miss = [];
  for (const [id, it] of Object.entries(items)) {
    const good = it.cands.filter(c => c.exists);
    if (!good.length) {
      miss.push(`${it.name} | ${it.en} | 试过: ${it.cands.map(c => c.file).join(', ')}`);
    } else if (good.length < it.cands.length) {
      miss.push(`(部分) ${it.name} | ${it.en} | 命中: ${good.map(c => `${c.file}(${c.w}x${c.h})`).join(', ')}`);
    }
  }
  lines.push(`\n===== ${cat}  缺失 ${miss.filter(m => !m.startsWith('(部分)')).length} =====`);
  lines.push(...miss);
}
fs.writeFileSync(path.join(ROOT, '_cmp', 'misses.txt'), lines.join('\n'), 'utf8');
console.log('written _cmp/misses.txt');
