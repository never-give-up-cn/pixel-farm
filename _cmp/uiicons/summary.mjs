import fs from 'node:fs';
const u = JSON.parse(fs.readFileSync('./_uiicons/fileusage.json', 'utf8'));
const cats = JSON.parse(fs.readFileSync('./_uiicons/catmembers.json', 'utf8'));
const menu = cats['Menu icons'].files.map(f => f.name);
const rows = [];
for (const n of menu) {
  const v = u[n];
  rows.push({
    name: n,
    dims: v ? (Array.isArray(v.dims) ? v.dims.join('x') : v.dims) : '?',
    usage: v ? v.usage.filter(x => !/^(Special:|User:|Template:|Talk:)/.test(x)) : [],
  });
}
console.log('=== Menu icons category (120) ===');
for (const r of rows) console.log(`${r.name.padEnd(40)} ${String(r.dims).padEnd(10)} ${r.usage.join(', ')}`);
