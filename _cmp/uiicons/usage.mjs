/* 从 File: 页面提取：原始尺寸、File usage（使用该图的 wiki 页面）、Summary、分类。 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const DIR = path.join(ROOT, '_uiicons', 'files');
const out = {};
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.html'))) {
  const h = fs.readFileSync(path.join(DIR, f), 'utf8');
  const name = f.replace(/\.html$/, '');
  const dim = /<a href="\/mediawiki\/images\/[^"]+?\/([0-9a-f])\/([0-9a-f]{2})\/([^"]+?)"><img alt="File:[^"]*" src="\/mediawiki\/images\/[^"]+?" decoding="async" width="(\d+)" height="(\d+)"/.exec(h);
  const info = /<div class="fullMedia"[^>]*>\s*<p><bdi[^>]*><a href="\/mediawiki\/images\/[^"]+?"[^>]*>[^<]*<\/a><\/bdi>\s*<span class="fileInfo">\(([^)]*)\)/.exec(h);
  // File usage
  const usage = [];
  const um = /<div id="mw-imagepage-section-linkstoimage">([\s\S]*?)<\/div>/.exec(h);
  if (um) for (const m of um[1].matchAll(/<a href="\/([^"]+)"[^>]*>([^<]*)<\/a>/g)) usage.push(decodeURIComponent(m[1]));
  // Summary
  let summary = '';
  const sm = /id="Summary"<\/h2>([\s\S]{0,1200}?)(?:<div class="mw-heading|<h2)/.exec(h);
  if (sm) summary = sm[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 260);
  // 分类
  const cats = [...new Set([...h.matchAll(/title="Category:([^"]+)"/g)].map(x => x[1]))].filter(c => !/^(Images|Menu images|Game mechanics)$/.test(c));
  const exists = !/does not have a file named|No file by this name exists/i.test(h) && /fullImageLink|fullMedia/.test(h);
  out[name] = {
    exists,
    dims: dim ? [+dim[4], +dim[5]] : (info ? info[1] : null),
    usage, summary, cats,
  };
}
fs.writeFileSync(path.join(ROOT, '_uiicons', 'fileusage.json'), JSON.stringify(out, null, 1));
const arg = process.argv[3];
if (arg) {
  const keys = Object.keys(out).filter(k => new RegExp(arg, 'i').test(k));
  for (const k of keys) {
    const v = out[k];
    console.log(`${k}\n   exists=${v.exists} dims=${v.dims ? (Array.isArray(v.dims) ? v.dims.join('x') : v.dims) : '?'}`);
    console.log(`   usage: ${v.usage.length ? v.usage.join(', ') : '(none)'}`);
    if (v.summary) console.log(`   summary: ${v.summary}`);
    if (v.cats.length) console.log(`   cats: ${v.cats.join(', ')}`);
  }
} else {
  console.log(`parsed ${Object.keys(out).length} file pages`);
}
