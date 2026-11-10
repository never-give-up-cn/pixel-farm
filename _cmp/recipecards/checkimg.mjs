// Verify a MediaWiki direct image URL loads (via headless Chrome).
// Usage: node _cmp/recipecards/checkimg.mjs <root> <url> [<url> ...]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (const url of process.argv.slice(3)) {
  const profile = path.join(ROOT, '_cmp', 'recipecards', '.chrome-img-' + process.pid + '-' + Date.now());
  const r = spawnSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--disable-extensions', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--virtual-time-budget=20000', '--dump-dom', url,
  ], { maxBuffer: 32 * 1024 * 1024, timeout: 90000 });
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  const html = r.stdout ? r.stdout.toString('utf8') : '';
  const m = html.match(/<img[^>]*src="([^"]+)"[^>]*>/);
  const dims = html.match(/width="(\d+)"\s+height="(\d+)"/);
  const title = html.match(/<title>([^<]*)<\/title>/);
  console.log(`${url}\n   ok=${html.length > 0} img=${m ? m[1].slice(0, 90) : 'NONE'} dims=${dims ? dims[1] + 'x' + dims[2] : '?'} title=${title ? title[1] : '?'}`);
}
