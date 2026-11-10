/* 解析分类页，列出成员文件 + 每个文件的尺寸。 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const DIR = path.join(ROOT, '_uiicons', 'cats');
const out = {};
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html'))) {
  const h = fs.readFileSync(path.join(DIR, f), 'utf8');
  const cat = f.replace(/\.html$/, '').replace(/^Category_/, '').replace(/_/g, ' ');
  const gm = /<div class="mw-category-generated"[\s\S]*?<\/div>\s*<\/div>/.exec(h);
  const scope = gm ? gm[0] : h;
  const files = new Map();
  // gallery: <a href="/File:X" class="mw-file-description"><img ... width="120" height="120"> ... <a ... title="File:X">X</a> ... 100 × 100; 4 KB
  const re = /<a href="\/File:([^"]+)" class="mw-file-description"><img alt="" src="\/mediawiki\/images\/[^"]+?" decoding="async" loading="lazy" width="(\d+)" height="(\d+)">[\s\S]{0,400}?title="File:([^"]+)"/g;
  for (const m of h.matchAll(re)) files.set(m[4], [+m[2], +m[3]]);
  if (!files.size) {
    for (const m of scope.matchAll(/class="galleryfilename[^"]*" title="File:([^"]+)"/g)) files.set(m[1], null);
  }
  const subcats = [...new Set([...h.matchAll(/title="Category:([^"]+)"/g)].map(x => x[1]))];
  out[cat] = { files: [...files].map(([n, d]) => ({ name: n, disp: d })), subcats };
  console.log(`## ${cat}  (${files.size} files)`);
  for (const [n, d] of files) console.log(`   ${n}   ${d ? d.join('x') : ''}`);
  if (subcats.length) console.log('   [subcats] ' + subcats.join(', '));
}
fs.writeFileSync(path.join(ROOT, '_uiicons', 'catmembers.json'), JSON.stringify(out, null, 1));
