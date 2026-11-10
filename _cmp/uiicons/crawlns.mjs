/* 顺着 Special:AllPages 翻完某个命名空间（namespace=6 文件 / namespace=14 分类）。
 * Cloudflare WAF 会拦下查询串里出现字面量 "from" 的请求，所以用 "fr%6Fm" 绕过。
 * 用法: node _uiicons/crawlns.mjs <ROOT> <ns> <outfile>
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const NS = process.argv[3] || '6';
const OUTFILE = process.argv[4] || path.join(ROOT, '_uiicons', `allns${NS}.json`);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(ROOT, '_uiicons', 'crawl');
fs.mkdirSync(OUT, { recursive: true });
const PROFILE = path.join(ROOT, '_uiicons', 'profiles', 'crawl' + NS);
fs.mkdirSync(PROFILE, { recursive: true });

const sleep = (ms) => { const t = Date.now(); while (Date.now() - t < ms) { } };
const isBlocked = (html) => !html || /请稍候|Just a moment|Attention Required|cf-browser-verification/i.test(html);

function fetchPage(url, file) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const r = spawnSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--disable-extensions', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${PROFILE}`,
      '--virtual-time-budget=45000',
      '--dump-dom', url,
    ], { maxBuffer: 256 * 1024 * 1024, timeout: 180000 });
    const html = r.stdout ? r.stdout.toString('utf8') : '';
    if (!isBlocked(html)) { if (file) fs.writeFileSync(file, html, 'utf8'); return html; }
    console.log(`  blocked (try ${attempt}), sleep 12s`);
    sleep(12000);
  }
  return '';
}

const all = new Set();
let from = null;
let page = 0;
const t0 = Date.now();
for (;;) {
  const url = 'https://stardewvalleywiki.com/Special:AllPages?namespace=' + NS + '&limit=500'
    + (from ? '&fr%6Fm=' + encodeURIComponent(from) : '');
  const html = fetchPage(url, path.join(OUT, `ns${NS}-${String(page).padStart(3, '0')}.html`));
  if (!html) { console.log('FAIL at page', page, from); break; }
  const m = /mw-allpages-body"[^>]*>([\s\S]*?)<\/div>/.exec(html);
  const body = m ? m[1] : html;
  const items = [...body.matchAll(/title="(?:File|Category):([^"]+)"/g)].map(x => x[1]);
  items.forEach(x => all.add(x.replace(/_/g, ' ')));
  const nextM = /Next page \(([^)]+)\)/.exec(html);
  console.log(`page ${page}: +${items.length} (total ${all.size}) next=${nextM ? nextM[1] : 'END'}`);
  if (!nextM || !items.length) break;
  from = items[items.length - 1];
  page++;
  if (page > 500) break;
  sleep(1000);
}
const list = [...all].sort((a, b) => a.localeCompare(b));
fs.writeFileSync(OUTFILE, JSON.stringify(list, null, 0));
console.log(`TOTAL ${list.length} entries, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
