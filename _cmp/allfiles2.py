"""从 Special:AllPages 抓下来的分页里提取全部 File: 名，和 PrefixIndex 的清单做对比。"""
import json
import re
from pathlib import Path
from urllib.parse import unquote

OUT = Path('_cmp/out')
ALL = Path('_uiicons/crawl')
files = {}
for p in sorted(ALL.glob('ns6-*.html')):
    h = p.read_text('utf-8', errors='ignore')
    n = 0
    for m in re.finditer(r'href="/File:([^"#]+)"', h):
        name = unquote(m.group(1)).replace('_', ' ')
        files.setdefault(name, p.stem)
        n += 1
    print(f'  {p.name}: {n} 个链接')
print(f'\nAllPages 抓到 {len(files)} 个文件名')
Path(OUT / 'wiki-allfiles2.json').write_text(json.dumps(sorted(files), ensure_ascii=False, indent=1), 'utf-8')

prefix = {f for f in json.loads((OUT / 'wiki-allfiles.json').read_text('utf-8')) if not f.startswith('File:')}
allp = set(files)
print(f'PrefixIndex 清单 {len(prefix)} 个')
print(f'只有 AllPages 有的（PrefixIndex 漏了）：{len(allp - prefix)} 个')
for f in sorted(allp - prefix)[:40]:
    print('   +', f)
print(f'\n只有 PrefixIndex 有的：{len(prefix - allp)} 个')
for f in sorted(prefix - allp)[:20]:
    print('   -', f)
