"""解析候选 URL 验证截图：读取每个格子左上角的颜色标记，
判定该 wiki 文件是否存在、原始像素尺寸是多少。

结果按"只要有一次成功就算存在"合并进 verified.json（多轮重试友好），
并把本轮仍未成功的候选写入 _cmp/failed.json，供下一轮重试。
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '_cmp' / 'out'

idx = json.loads((OUT / 'verify.index.json').read_text('utf-8'))
CELL, PERROW = idx['cell'], idx['perRow']

verified = {}
vpath = ROOT / '_cmp' / 'verified.json'
if vpath.exists():
    verified = json.loads(vpath.read_text('utf-8'))

this_round = []
for k in range(idx['chunks']):
    mp = OUT / f'verify-{k}.meta.json'
    pp = OUT / f'verify-{k}.png'
    if not mp.exists() or not pp.exists():
        continue
    meta = json.loads(mp.read_text('utf-8'))
    A = np.array(Image.open(pp).convert('RGBA'))
    for i, it in enumerate(meta['items']):
        c, r = i % PERROW, i // PERROW
        x, y = c * CELL + 6, r * CELL + 6
        if y >= A.shape[0] or x >= A.shape[1]:
            continue
        px = A[y, x]
        R, G, B = int(px[0]), int(px[1]), int(px[2])
        ok = (B == 128 and not (R == 255 and G == 0))
        rec = verified.setdefault(it['cat'], {}).setdefault(it['id'], {
            'name': it['name'], 'en': it['en'], 'cands': []
        })
        prev = next((c for c in rec['cands'] if c['file'] == it['file']), None)
        if prev is None:
            prev = {'role': it['role'], 'file': it['file'], 'path': it['path'],
                    'exists': False, 'w': None, 'h': None}
            rec['cands'].append(prev)
        if ok:
            prev['exists'] = True
            prev['w'], prev['h'] = R, G
        this_round.append((it['cat'], it['id'], it['file'], it['path'], it['role'], it['name'], it['en'], ok))

vpath.write_text(json.dumps(verified, ensure_ascii=False, indent=1), 'utf-8')

# 本轮失败的候选 -> failed.json（下一轮重试）
failed = [{'cat': c, 'id': i, 'name': n, 'en': e, 'file': f, 'path': p, 'role': ro, 'ci': 0}
          for (c, i, f, p, ro, n, e, ok) in this_round if not ok]
(ROOT / '_cmp' / 'failed.json').write_text(json.dumps(failed, ensure_ascii=False), 'utf-8')

print(f'本轮 {len(this_round)} 个候选，成功 {len(this_round) - len(failed)}，失败 {len(failed)}')
tot = hit = 0
for cat, items in verified.items():
    n = len(items)
    good = sum(1 for it in items.values() if any(c['exists'] for c in it['cands']))
    tot += n
    hit += good
    miss = n - good
    print(f'{cat:11s} 条目 {n:3d}  命中 {good:3d}  未命中 {miss:3d}')
print(f'合计 {tot} 条，命中 {hit} ({hit / tot * 100:.1f}%)')
