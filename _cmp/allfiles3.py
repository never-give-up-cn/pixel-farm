"""把两份清单合并成一份完整清单（AllPages 更全，PrefixIndex 作补充），再查 UI 图标 / 种子包。"""
import json
import re
from pathlib import Path
from urllib.parse import unquote

OUT = Path('_cmp/out')
a = json.loads((OUT / 'wiki-allfiles.json').read_text('utf-8'))
b = json.loads((OUT / 'wiki-allfiles2.json').read_text('utf-8'))

names = set()
for f in a:
    if not f.startswith('File:'):
        names.add(f.replace('_', ' '))
for f in b:
    names.add(f.replace('_', ' '))
names = {n for n in names if n.lower().endswith(('.png', '.gif', '.jpg'))}
print(f'合并后 {len(names)} 个图片文件')

# 清掉文件名里残留的首尾单引号（wiki 上带引号的标题会显示成 'X'.png）
norm = {}
for n in names:
    m = re.match(r"^'(.*)'\.(png|gif|jpg)$", n)
    norm[m.group(1) + '.' + m.group(2) if m else n] = n
names = set(norm)
Path(OUT / 'wiki-files-all.json').write_text(
    json.dumps(sorted(names), ensure_ascii=False, indent=1), 'utf-8')
print('已写入 _cmp/out/wiki-files-all.json')

low = {n.lower(): n for n in names}

def find(kw, limit=30):
    return [n for n in sorted(names) if kw.lower() in n.lower() and len(n) < 45][:limit]

for kw in ['stardrop', 'icon', 'buff', 'skill icon', 'weather', 'sun', 'fog', 'wind',
           'snow', 'seed', 'menu', 'journal', 'options', 'pause', 'level', 'friendship',
           'stamina', 'energy', 'health', 'gold', 'luck', 'quality']:
    hits = find(kw)
    print(f'\n== {kw} ({len(hits)})')
    for h in hits[:26]:
        print('   ', h)
