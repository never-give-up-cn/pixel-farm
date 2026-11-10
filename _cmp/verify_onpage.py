"""检查我们选的官方图是否真的出现在对应 wiki 页面里（页面引用了这个文件名）。"""
import json
import re
import sys
from pathlib import Path

cat, man_path = sys.argv[1], sys.argv[2]
pages = [Path(p).read_text('utf-8', errors='ignore') for p in sys.argv[3:]]
blob = '\n'.join(pages)
def norm(s):
    s = s.replace('%27', "'").replace('%28', '(').replace('%29', ')')
    s = s.replace('_', ' ').replace('  ', ' ').strip().lower()
    return s


files = set()
for m in re.finditer(r'/mediawiki/images/[^"\'\s>]+', blob):
    u = m.group(0)
    f = u.split('/')[-1]
    f = re.sub(r'^\d+px-', '', f)
    mm = re.search(r'/thumb/[^/]+/[^/]+/([^/]+)/\d+px-', u)
    if mm:
        f = mm.group(1)
    files.add(f)
files = {norm(f) for f in files}

man = json.loads(Path(man_path).read_text('utf-8'))
ok = miss = 0
for it in man['items']:
    w = it['wikiFile']
    if norm(w) in files:
        ok += 1
    else:
        miss += 1
        print(f'  ? {it["id"]:18s} {it["en"]:24s} 页面上没出现 {w}')
print(f'{cat}: 页面引用了我们的图 {ok}   页面未引用 {miss}   合计 {len(man["items"])}')
