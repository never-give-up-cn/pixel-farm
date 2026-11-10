/* 候选 URL 验证的多轮重试循环。
 * wiki 对短时间大量请求会限流，个别图会假失败，所以失败的要再试几轮。
 * 首轮只测"还没被确认存在"的候选（沿用 verified.json 里已有的成功结果）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const OUT = path.join(ROOT, '_cmp', 'out');
const PY = 'C:\\Users\\Administrator\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe';
const MAX_ROUNDS = Number(process.argv[3] || 5);

const sleep = (ms) => { const t = Date.now(); while (Date.now() - t < ms) { } };

function sh(cmd, args, label) {
  console.log(`\n>>> ${label}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, timeout: 3600000 });
  if (r.status !== 0) { console.log(`!!! ${label} 退出码 ${r.status}`); return false; }
  return true;
}

/* 组装首轮待测清单：所有候选里，还没被确认存在的那些 */
const cand = JSON.parse(fs.readFileSync(path.join(ROOT, '_cmp', 'candidates.json'), 'utf8'));
const vpath = path.join(ROOT, '_cmp', 'verified.json');
const verified = fs.existsSync(vpath) ? JSON.parse(fs.readFileSync(vpath, 'utf8')) : {};
const pending = [];
for (const [cat, c] of Object.entries(cand)) {
  for (const it of c.items) {
    const rec = verified[cat]?.[it.id];
    for (const cd of it.cands) {
      const known = rec?.cands?.find(x => x.file === cd.file);
      if (known?.exists) continue;           // 之前已确认存在
      pending.push({ cat, id: it.id, name: it.name, en: it.en, ci: 0,
                     role: cd.role, file: cd.file, path: cd.path });
    }
  }
}
fs.writeFileSync(path.join(ROOT, '_cmp', 'pending.json'), JSON.stringify(pending));
console.log(`待验证候选 ${pending.length} 个（已确认存在的结果沿用）`);

for (let round = 1; round <= MAX_ROUNDS; round++) {
  console.log(`\n========== 验证第 ${round} 轮 ==========`);
  if (!sh('node', [path.join('_cmp', 'genverify.mjs'), '.', '12'], '生成验证页')) break;
  if (!sh('node', [path.join('_cmp', 'shoot.mjs'), '.', 'verify'], '截图验证页')) break;
  if (!sh(PY, [path.join('_cmp', 'parseverify.py'), '.'], '解析验证结果')) break;

  const failed = JSON.parse(fs.readFileSync(path.join(ROOT, '_cmp', 'failed.json'), 'utf8'));
  console.log(`\n本轮仍有 ${failed.length} 个候选未确认存在`);
  if (!failed.length) { console.log('全部候选已确认'); break; }

  /* 连续失败 3 次的候选就认为是"wiki 上确实没有这个文件"，不再重试 */
  const fcPath = path.join(ROOT, '_cmp', 'failcount.json');
  const fc = fs.existsSync(fcPath) ? JSON.parse(fs.readFileSync(fcPath, 'utf8')) : {};
  const next = [];
  for (const c of failed) {
    const key = `${c.cat}/${c.id}/${c.file}`;
    fc[key] = (fc[key] || 0) + 1;
    if (fc[key] < 3) next.push(c);
  }
  fs.writeFileSync(fcPath, JSON.stringify(fc, null, 1));

  if (!next.length) {
    console.log(`剩下 ${failed.length} 个都连续失败 3 次，判定 wiki 上不存在，停止重试`);
    break;
  }
  if (round < MAX_ROUNDS) {
    fs.writeFileSync(path.join(ROOT, '_cmp', 'pending.json'), JSON.stringify(next));
    console.log(`下一轮只重试这 ${next.length} 个（等 8 秒让限流窗口过去）`);
    sleep(8000);
  }
}
