/* 抓 wiki 的 Special:PrefixIndex，得到"全部 File: 文件名"清单。
 *
 * 用法: node _cmp/filelist.mjs <root> [前缀个数]
 * 产出: _cmp/out/prefix-<X>.html（每个前缀一页）+ wiki-allfiles.json（汇总）
 *
 * 为什么要这个：wiki 没有开放 api.php，普通 HTTP 客户端又被 Cloudflare 拦，
 * 只有无头 Chrome 能把页面整页 dump 下来。逐前缀抓一遍能拿到全站文件名，
 * 用来回答"官方到底有没有这张图"这种问题。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const OUT = path.join(ROOT, '_cmp', 'out');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = process.env.CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PREFIXES = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const dump = (url, outFile) => {
  const r = spawnSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=30000',
    '--user-data-dir=' + path.join(OUT, '.chrome-fl'),
    '--dump-dom', url,
  ], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const html = r.stdout || '';
  if (!html || html.length < 2000) return false;
  fs.writeFileSync(outFile, html, 'utf8');
  return true;
};

let ok = 0;
for (const p of PREFIXES) {
  const url = `https://stardewvalleywiki.com/Special:PrefixIndex/File:${p}?namespace=6&prefix=${p}`;
  const f = path.join(OUT, `prefix-${p}.html`);
  if (dump(url, f)) { ok++; console.log(`  ${p} ok`); }
  else console.log(`  ${p} 失败`);
}
console.log(`前缀页 ${ok}/${PREFIXES.length}`);

const py = spawnSync('python', [path.join(ROOT, '_cmp', 'collectfiles.py'),
  path.join(OUT, 'wiki-allfiles.json'), OUT], { encoding: 'utf8', cwd: ROOT });
console.log(py.stdout || py.stderr);
