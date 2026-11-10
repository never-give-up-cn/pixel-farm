"""检查项目的配方卡配料能不能通过项目自己的中英词表对上 wiki 的官方配料。"""
import json
import re
from pathlib import Path

# 1) 项目里所有 {name: en} 对（只收英文值，防止把 [['防风草','青豆',...]] 这类中文数组当成词条）
def ascii_only(s):
    return not any('\u4e00' <= ch <= '\u9fff' for ch in s)


dic = {}
for f in Path('js/anim').glob('*.js'):
    txt = f.read_text('utf-8', errors='ignore')
    for m in re.finditer(r"name:\s*'([^']+)'\s*,\s*en:\s*'([^']+)'", txt):
        if ascii_only(m.group(2)):
            dic.setdefault(m.group(1), m.group(2))
    for m in re.finditer(r"\[\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'([^']+)'", txt):
        if ascii_only(m.group(2)):
            dic.setdefault(m.group(1), m.group(2))

print(f'项目词表条目：{len(dic)}')

# 2) 配方里的配料
raw = Path('js/anim/recipes.js').read_text('utf-8')
ings = []
for m in re.finditer(r"\[\s*'([a-z_]+)'\s*,\s*\[([^\]]*)\]", raw):
    items = re.findall(r"'([^']+)'", m.group(2))
    clean = []
    for it in items:
        m2 = re.match(r'^(.*?)\s*\u00d7\s*(\d+)$', it)
        clean.append((m2.group(1), int(m2.group(2))) if m2 else (it, 1))
    ings.append((m.group(1), clean))
print(f'配方：{len(ings)} 道，共 {sum(len(i) for _, i in ings)} 个配料')

# 3) 能解析的比例
allnames = sorted({n for _, its in ings for n, _ in its})
hit = [n for n in allnames if n in dic]
miss = [n for n in allnames if n not in dic]
print(f'不同配料 {len(allnames)} 个，项目词表能直接对上 {len(hit)} 个')
print('对不上的：', '、'.join(miss))
Path('_cmp/out/ing-dict.json').write_text(
    json.dumps(dic, ensure_ascii=False, indent=1), 'utf-8')
