/* 用无头 Chrome 把 wiki 页面的 DOM 抓下来（web_fetch 会截断长页面）。
 * 用法: node _cmp/dumpdom.mjs <页面名> <输出文件>
 * 例:   node _cmp/dumpdom.mjs Hats _cmp/out/wiki-Hats.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const page = process.argv[3];
const out = path.resolve(process.argv[4] || path.join(ROOT, '_cmp', 'out', `wiki-${page}.html`));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = `https://stardewvalleywiki.com/${encodeURIComponent(page)}`;

const r = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${path.join(ROOT, '_cmp', 'out', '.chrome')}`,
  '--virtual-time-budget=60000',
  '--dump-dom', url,
], { maxBuffer: 256 * 1024 * 1024, timeout: 240000 });

const html = r.stdout ? r.stdout.toString('utf8') : '';
if (!html.length) {
  console.error('dump failed, exit=', r.status, r.stderr?.toString('utf8')?.slice(0, 400));
  process.exit(1);
}
fs.writeFileSync(out, html, 'utf8');
console.log(`${url} -> ${out}  ${(html.length / 1024).toFixed(0)} KB`);
