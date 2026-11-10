/* 截图：比对网格页 / 对比页 / 候选验证页。 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const OUT = path.join(ROOT, '_cmp', 'out');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://127.0.0.1:8123/_cmp/out';
const mode = process.argv[3] || 'all';
let done = 0, fail = 0;

function shoot(url, file, w, h, transparent) {
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--disable-extensions', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${path.join(OUT, '.chrome')}`,
    `--window-size=${w},${h}`,
    '--virtual-time-budget=60000',
    `--screenshot=${file}`,
  ];
  if (transparent) args.push('--default-background-color=00000000');
  args.push(url);
  const r = spawnSync(CHROME, args, { stdio: 'ignore', timeout: 240000 });
  if (!fs.existsSync(file)) { console.log(`  FAIL ${path.basename(file)} exit=${r.status}`); fail++; return false; }
  console.log(`  ok ${path.basename(file)} ${w}x${h} ${fs.statSync(file).size}B`);
  done++;
  return true;
}

/* ---- 1) 候选验证页 ---- */
if (mode === 'all' || mode === 'verify') {
  const idx = JSON.parse(fs.readFileSync(path.join(OUT, 'verify.index.json'), 'utf-8'));
  for (let k = 0; k < idx.chunks; k++) {
    const m = JSON.parse(fs.readFileSync(path.join(OUT, `verify-${k}.meta.json`), 'utf-8'));
    shoot(`${BASE}/verify-${k}.html`, path.join(OUT, `verify-${k}.png`), m.w, m.h, true);
  }
}

/* ---- 2) 比对网格页（对比大图由 Python 侧合成） ---- */
if (mode === 'all' || mode === 'cmp') {
  const cats = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf-8'));
  for (const cat of cats) {
    const meta = JSON.parse(fs.readFileSync(path.join(OUT, `${cat}.meta.json`), 'utf-8'));
    console.log(cat);
    shoot(`${BASE}/${cat}.grid.html`, path.join(OUT, `${cat}.grid.png`), meta.gridW, meta.gridH * 2, true);
  }
}
console.log(`done ${done} ok, ${fail} fail`);
