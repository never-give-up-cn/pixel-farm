"""生成 wiki 全站文件名清单。

数据来源（两份，互相补充）：
  1. _uiicons/allfiles.json      —— Special:AllPages 逐页爬出来的 7219 个 File: 名（含引号原名）
  2. _cmp/out/wiki-allfiles.json —— Special:PrefixIndex 逐前缀爬的（每前缀只给 345 条，会漏）

输出：
  _cmp/out/wiki-files-all.json     —— 全部文件名（保留原样，含单引号）
  _cmp/out/wiki-files-nq.json      —— 去掉首尾单引号的版本（便于按名字查找）
"""
import json
from pathlib import Path

OUT = Path('_cmp/out')
names = set()

for p in [Path('_uiicons/allfiles.json'), OUT / 'wiki-allfiles.json']:
    if p.exists():
        d = json.loads(p.read_text('utf-8'))
        for n in d:
            if n.startswith('File:'):
                n = n[5:]
            if n.lower().endswith(('.png', '.gif', '.jpg', '.jpeg')):
                names.add(n.replace('_', ' '))

names = {n for n in names if not n.startswith('File:')}
print(f'合并后 {len(names)} 个图片文件')

(OUT / 'wiki-files-all.json').write_text(
    json.dumps(sorted(names), ensure_ascii=False, indent=1), 'utf-8')

nq = set()
for n in names:
    nq.add(n)
    if n.startswith("'") and "'.png" in n:
        nq.add(n[1:-5] + '.png')
(OUT / 'wiki-files-nq.json').write_text(
    json.dumps(sorted(nq), ensure_ascii=False, indent=1), 'utf-8')
print(f'去引号版 {len(nq)} 个')
