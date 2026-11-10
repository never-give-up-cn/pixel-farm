"""把 wiki /Cooking 页面里的"配料 + 增益"抠出来，和项目 recipes.js 的配方数据对一遍。"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '_cmp' / 'out'

h = (OUT / 'wiki-Cooking.html').read_text('utf-8', errors='ignore')
rows = re.findall(r'<tr\b.*?</tr>', h, re.S)
official = {}
for tr in rows:
    cells = re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', tr, re.S)
    if len(cells) < 4:
        continue
    # 第 2 格：菜名链接
    m = re.search(r'<a href="/[^"]*" title="([^"]+)"', cells[1])
    if not m:
        continue
    name = m.group(1).strip()
    # 第 4 格：配料
    ing = cells[3]
    ings = []
    for mm in re.finditer(r'<a[^>]*\btitle="([^"]+)"[^>]*>[^<]*</a>\s*(?:&nbsp;|\s)*\((\d+)\)', ing):
        ings.append((mm.group(1), int(mm.group(2))))
    if not ings:
        for mm in re.finditer(r'<a[^>]*\btitle="([^"]+)"', ing):
            ings.append((mm.group(1), 1))
    # 第 5 格：增益图标
    buffs = []
    if len(cells) > 4:
        for mm in re.finditer(r'/mediawiki/images/[^"\']*/([^/"\']+\.png)', cells[4]):
            f = re.sub(r'^\d+px-', '', mm.group(1))
            if f not in buffs:
                buffs.append(f)
    if ings:
        official[name] = {'ingredients': ings, 'buffs': buffs}

print(f'wiki /Cooking 解析出 {len(official)} 道菜的配料')
Path(OUT / 'cook-official.json').write_text(
    json.dumps(official, ensure_ascii=False, indent=1), 'utf-8')

# --- 项目侧 ---
dic = json.loads((OUT / 'ing-dict.json').read_text('utf-8'))
raw = (ROOT / 'js' / 'anim' / 'recipes.js').read_text('utf-8')
dishes = {}
t = (ROOT / 'js' / 'anim' / 'dishes.js').read_text('utf-8')
for mm in re.finditer(r"\[\s*'([a-z_]+)'\s*,\s*'[^']*'\s*,\s*'((?:[^'\\]|\\.)*)'", t):
    dishes[mm.group(1)] = mm.group(2).replace("\\'", "'")

proj = {}
for mm in re.finditer(r"\[\s*'([a-z_]+)'\s*,\s*\[([^\]]*)\]\s*,\s*'([^']*)'\]", raw):
    items = re.findall(r"'([^']+)'", mm.group(2))
    clean = []
    for it in items:
        m2 = re.match(r'^(.*?)\s*\u00d7\s*(\d+)$', it)
        clean.append((m2.group(1), int(m2.group(2))) if m2 else (it, 1))
    proj[mm.group(1)] = {'ingredients': clean, 'buff': mm.group(3),
                         'en': dishes.get(mm.group(1), mm.group(1))}

# 项目名和官方名不一致的两道菜
ALIAS = {'cookies': 'Cookie', 'vegetable_stew': 'Vegetable Medley'}
for k, v in ALIAS.items():
    if k in proj:
        proj[k]['en'] = v

SUPP = {
    '姜': ['Ginger'], '小麦粉': ['Wheat Flour'], '李子': ['Plum'],
    '杏子': ['Apricot'], '洋葱': ['Onion', 'Red Onion'], '洞穴萝卜': ['Cave Carrot'],
    '罂粟籽': ['Poppy Seeds', 'Poppy Seed'], '芒果': ['Mango'], '蘑菇': ['Mushroom'],
    '香蕉': ['Banana'], '鱼': ['Fish'], '鳟鱼': ['Trout'], '黄油': ['Butter'],
}
unresolved = set()
res = {'match': [], 'diff': [], 'missing': []}
for did, p in proj.items():
    en = p['en']
    if en not in official:
        res['missing'].append({'id': did, 'en': en})
        continue
    mine = []
    for cn, qty in p['ingredients']:
        if cn in dic:
            e = dic[cn]
        elif cn in SUPP:
            e = SUPP[cn][0]
        else:
            unresolved.add(cn)
            e = cn
        mine.append((e, qty))
    theirs = official[en]['ingredients']
    # 官方写 "Onion" 而项目写 "Red Onion" 这类别名，逐个对齐
    their_names = {a for a, _ in theirs}
    for i, (e, q) in enumerate(mine):
        if e not in their_names and cn in SUPP:
            for alt in SUPP[cn]:
                if alt in their_names:
                    mine[i] = (alt, q)
                    break
    mine_s = sorted(mine)
    their_s = sorted(theirs)
    if mine_s == their_s:
        res['match'].append({'id': did, 'en': en})
    else:
        res['diff'].append({'id': did, 'en': en, 'ours': mine_s, 'wiki': their_s})

print(f'配料完全一致：{len(res["match"])}')
print(f'配料不一致：{len(res["diff"])}')
print(f'wiki 上没找到同名菜：{len(res["missing"])}')
if unresolved:
    print('未解析的中文配料：', '、'.join(sorted(unresolved)))
Path(OUT / 'cook-compare.json').write_text(
    json.dumps(res, ensure_ascii=False, indent=1), 'utf-8')
