"""把各分类的"页面引用校验"结果汇总成 _cmp/report/crosscheck.json。

校验方式：把我们选的官方文件名，和 wiki 对应页面 HTML 里实际引用的图片文件名做比对
（忽略 %27 / %28 %29 / 空格 vs 下划线 / 缩略图尺寸前缀 等写法差异）。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '_cmp' / 'out'

# 分类 -> (清单, 用于校验的页面)
CASES = {
    'hats':      (['hats'],      ['wiki-Hats.html']),
    'equipment': (['equipment'], ['wiki-Weapons.html', 'wiki-Rings.html', 'wiki-Footwear.html']),
    'minerals':  (['minerals'],  ['wiki-Minerals.html']),
    'fish':      (['fish'],      ['wiki-Fish.html']),
    'dishes':    (['dishes'],    ['wiki-Cooking.html']),
    'artisan':   (['artisan'],   ['wiki-Artisan_Goods.html']),
    'monsters':  (['monsters'],  ['wiki-Monsters.html']),
    'animals':   (['animals'],   ['wiki-Animals.html', 'wiki-Coop.html']),
    'npcs':      (['npcs'],      ['wiki-NPC.html']),
    'trees':     (['trees'],     ['wiki-Trees.html', 'wiki-FruitTrees.html']),
    'crops':     (['crops'],     ['wiki-Crops.html', 'wiki-FruitTrees.html']),
    'buildings': (['buildings'], ['wiki-CarpentersShop.html', 'wiki-Buildings.html']),
    'bundles':   (['bundles'],   ['wiki-Bundles.html']),
    'ui':        (['ui'],        []),      # 用 wiki 完整文件清单验证
}

# UI 图标散落在很多页面上，改用"文件是否在 wiki 完整文件清单里"来验证
ALLFILES = ROOT / '_cmp' / 'out' / 'wiki-allfiles.json'
if ALLFILES.exists():
    allf = {f.replace('_', ' ').lower() for f in json.loads(ALLFILES.read_text('utf-8'))
            if not f.startswith('File:')}
else:
    allf = None


def norm(s):
    s = s.replace('%27', "'").replace('%28', '(').replace('%29', ')')
    s = s.replace('_', ' ').strip().lower()
    return s


res = {}
tot_ok = tot_all = 0
for cat, (mans, pages) in CASES.items():
    mp = ROOT / '_cmp' / 'manifest' / f'{mans[0]}.json'
    if not mp.exists():
        continue
    man = json.loads(mp.read_text('utf-8'))
    if cat == 'ui' and allf:
        ok = [it['id'] for it in man['items']
              if it['wikiFile'].replace('_', ' ').lower() in allf]
        miss = [it['id'] for it in man['items']
                if it['wikiFile'].replace('_', ' ').lower() not in allf]
        res[cat] = {'ok': len(ok), 'total': len(man['items']), 'not_on_page': miss,
                    'pages': ['wiki 完整文件清单']}
        tot_ok += len(ok)
        tot_all += len(man['items'])
        print(f'{cat:11s} 文件清单里有 {len(ok):3d} / {len(man["items"]):3d}   未找到 {miss}')
        continue
    blob = '\n'.join((OUT / p).read_text('utf-8', errors='ignore') for p in pages if (OUT / p).exists())
    files = set()
    for m in re.finditer(r'/mediawiki/images/[^"\'\s>]+', blob):
        u = m.group(0)
        f = re.sub(r'^\d+px-', '', u.split('/')[-1])
        mm = re.search(r'/thumb/[^/]+/[^/]+/([^/]+)/\d+px-', u)
        if mm:
            f = mm.group(1)
        files.add(norm(f))
    ok = [it['id'] for it in man['items'] if norm(it['wikiFile']) in files]
    miss = [it['id'] for it in man['items'] if norm(it['wikiFile']) not in files]
    res[cat] = {'ok': len(ok), 'total': len(man['items']), 'not_on_page': miss,
                'pages': pages}
    tot_ok += len(ok)
    tot_all += len(man['items'])
    print(f'{cat:11s} 页面引用了 {len(ok):3d} / {len(man["items"]):3d}   未引用 {miss}')

(ROOT / '_cmp' / 'report' / 'crosscheck.json').write_text(
    json.dumps(res, ensure_ascii=False, indent=1), 'utf-8')
print(f'\n合计 {tot_ok} / {tot_all} 的官方图在对应 wiki 页面里被实际引用')
