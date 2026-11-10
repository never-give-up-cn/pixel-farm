// Check existence of many File: pages on the wiki using headless Chrome in parallel.
// Usage: node _cmp/checkfiles.mjs <root> <listfile> <outjson> [concurrency]
// listfile: one file name per line (e.g. "Algae Soup.png")
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const listFile = process.argv[3];
const outFile = process.argv[4];
const CONC = parseInt(process.argv[5] || '6', 10);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const names = fs.readFileSync(listFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

function check(name, idx) {
  const url = `https://stardewvalleywiki.com/File:${encodeURIComponent(name)}`;
  const profile = path.join(ROOT, '_cmp', 'out', `.chrome-chk-${process.pid}-${idx}-${Date.now()}`);
  const r = spawnSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--disable-extensions', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    '--virtual-time-budget=30000',
    '--dump-dom', url,
  ], { maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  const html = r.stdout ? r.stdout.toString('utf8') : '';
  if (!html.length) return { exists: null, error: `exit ${r.status}` };
  const compact = html.replace(/\s/g, '');
  const missing = compact.includes('wgArticleId":0');
  const m = html.match(/(\d+)\s*[x×]\s*(\d+)\s*pixels/);
  // find the actual full-size image link on the file page
  const imgs = [...html.matchAll(/\/mediawiki\/images\/en\/[^"]*\/([^/"']+\.(?:png|jpg|jpeg|gif))/g)].map(x => x[1]);
  const exact = imgs.filter(f => decodeURIComponent(f).toLowerCase() === name.toLowerCase());
  return {
    exists: !missing,
    exactMatch: exact.length > 0,
    dims: m ? `${m[1]}x${m[2]}` : null,
    images: [...new Set(imgs)].slice(0, 6),
  };
}

const results = {};
let i = 0;
async function worker(w) {
  while (true) {
    const idx = i++;
    if (idx >= names.length) return;
    const name = names[idx];
    const res = check(name, idx);
    results[name] = res;
    console.log(`${res.exists === null ? 'ERR ' : res.exists ? 'YES' : 'NO '} ${name} ${res.dims || ''} ${res.error || ''}`);
  }
}
await Promise.all(Array.from({ length: CONC }, (_, w) => worker(w)));
fs.writeFileSync(outFile, JSON.stringify(results, null, 1), 'utf8');
console.log('->', outFile);
