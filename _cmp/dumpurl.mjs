/* Dump DOM for an arbitrary URL (no encoding of the path).
 * Usage: node _cmp/dumpurl.mjs <root> <url> <outfile>
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const url = process.argv[3];
const out = path.resolve(process.argv[4]);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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
