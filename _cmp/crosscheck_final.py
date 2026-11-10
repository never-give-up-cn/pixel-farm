"""Cross-check the parent agent's full wiki file list against the 81 dishes + card-like art.
"""
import json
import re
from pathlib import Path

files = json.load(open('_cmp/out/wiki-allfiles.json', encoding='utf-8'))
low = {f.lower(): f for f in files}
print('total files:', len(files))

dishes = []
for ln in Path('_cmp/dishes.txt').read_text('utf-8').splitlines():
    ln = ln.strip()
    if ln:
        i, n = ln.split('|', 1)
        dishes.append((i, n))

print('\n--- 81 dish icons ---')
missing = []
for i, n in dishes:
    cand = n + '.png'
    hit = low.get(cand.lower())
    if not hit:
        missing.append((i, n, cand))
    print(f'{i:24} | {n:24} | {hit or "无"}')
print('\nMISSING (no exact "<Name>.png"):')
for m in missing:
    print('   ', m)

print('\n--- keyword scan ---')
for pat in ['recipe', 'cook', 'card', 'buff', 'queen', 'tv', 'television', 'flour', 'ingredient',
            'overlay', 'channel', 'unlock', 'journal', 'menu', 'dish', 'food']:
    hits = sorted(f for f in files if pat in f.lower())
    print(f'\n== {pat} ({len(hits)}):')
    for h in hits[:70]:
        print('   ', h)
