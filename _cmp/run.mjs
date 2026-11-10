/* 一键跑完整个比对流水线：
 *   1. 合并队友补交的额外候选文件名
 *   2. 生成候选 URL 的存在性验证页（无头 Chrome 实测）
 *   3. 截图 + 解析 -> verified.json
 *   4. 生成各分类清单
 *   5. 生成并截图比对网格
 *   6. 像素相似度分析 + 并排对比大图
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const PY = 'C:\\Users\\Administrator\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe';
const only = process.argv[3];

function run(cmd, args, label) {
  console.log(`\n>>> ${label}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, timeout: 3600000 });
  if (r.status !== 0) {
    console.log(`!!! ${label} 退出码 ${r.status}`);
    return false;
  }
  return true;
}

const step = (script, label) => run('node', [path.join('_cmp', script), '.'], label);

if (!step('mergeextras.mjs', '合并额外候选')) process.exit(1);
if (!run('node', [path.join('_cmp', 'verifyloop.mjs'), '.', '5'], '候选 URL 多轮验证')) process.exit(1);
if (!step('mkmanifest.mjs', '生成分类清单')) process.exit(1);
if (!step('build.mjs', '生成比对网格页')) process.exit(1);
if (!run('node', [path.join('_cmp', 'shoot.mjs'), '.', 'cmp'], '截图比对网格')) process.exit(1);
if (!run(PY, [path.join('_cmp', 'analyze.py'), '.'], '像素相似度分析')) process.exit(1);
console.log('\n全部完成');
