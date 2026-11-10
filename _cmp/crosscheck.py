"""用 wiki 页面自带的名称->图片映射校验我们的清单。

用法: python crosscheck.py <分类> <manifest.json> <pagemap.json>
"""
import json
import re
import sys
from pathlib import Path

cat = sys.argv[1]
man = json.loads(Path(sys.argv[2]).read_text('utf-8'))
page = json.loads(Path(sys.argv[3]).read_text('utf-8'))


def norm(s):
    s = s.strip().lower()
    s = re.sub(r'\s*\([^)]*\)\s*$', '', s)
    return s


page_norm = {}
for k, v in page.items():
    page_norm.setdefault(norm(k), v)

ok = miss = bad = 0
for it in man['items']:
    want = it['wikiFile']
    got = page.get(it['en'].strip().lower()) or page_norm.get(norm(it['en']))
    if not got:
        miss += 1
        print(f'  ? {it["id"]:18s} {it["en"]:26s} 页面无同名项   我们用 {want}')
        continue
    if got.replace(' ', '_') == want.replace(' ', '_'):
        ok += 1
    else:
        bad += 1
        print(f'  X {it["id"]:18s} {it["en"]:26s} 页面用 {got:32s} 我们用 {want}')
print(f'{cat}: 一致 {ok}  不一致 {bad}  页面无同名项 {miss}  合计 {len(man["items"])}')
