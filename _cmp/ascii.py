"""把两边的精灵渲染成 ASCII 图案，人工核对配对是否正确。"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
OUT = ROOT / '_cmp' / 'out'


def classify(rgb):
    r, g, b = rgb
    mx, mn = max(rgb), min(rgb)
    if mx < 55:
        return '#'
    if g > r and g > b:
        return 'G' if mx > 110 else 'g'
    if r > g > b:
        return 'Y' if g > 120 else 'O'
    if r > 120 and g < 90 and b < 90:
        return 'R'
    if b > r and b > g:
        return 'B'
    if mx - mn < 28:
        return 'W' if mx > 150 else 'w'
    return '.'


def art(arr, maxw=44):
    a = arr[:, :, 3] > 100
    if not a.any():
        return ['(空)']
    ys, xs = np.where(a)
    sub = arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    step = max(1, sub.shape[1] // maxw)
    lines = []
    for y in range(0, sub.shape[0], step):
        row = ''
        for x in range(0, sub.shape[1], step):
            px = sub[y, x]
            row += ' ' if px[3] <= 100 else classify(px[:3])
        lines.append(row.rstrip())
    return lines


cats = json.loads((OUT / 'index.json').read_text('utf-8'))
want = sys.argv[2].split(',') if len(sys.argv) > 2 else ['crops']
pick = sys.argv[3].split(',') if len(sys.argv) > 3 else []

for cat in cats:
    if cat not in want:
        continue
    meta = json.loads((OUT / f'{cat}.meta.json').read_text('utf-8'))
    A = np.array(Image.open(OUT / f'{cat}.grid.png').convert('RGBA'))
    cell, per, gridH = meta['cell'], meta['perRow'], meta['gridH']
    for i, it in enumerate(meta['items']):
        if pick and it['id'] not in pick:
            continue
        c, r = i % per, i // per
        x0, y0 = c * cell, r * cell
        o = A[y0:y0 + cell, x0:x0 + cell, :]
        ww, wh = it['wikiSize']
        w = A[gridH + y0:gridH + y0 + wh, x0:x0 + ww, :]
        # 内容裁剪
        def crop(arr):
            a = arr[:, :, 3] > 8
            if not a.any():
                return None
            ys, xs = np.where(a)
            return arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        oc, wc = crop(o), crop(w)
        print(f"\n=== {cat} / {it['name']} ({it['en']})  wiki={it['wikiFile']} "
              f"{wc.shape[1]}x{wc.shape[0] if wc is not None else 0}  ours={oc.shape[1]}x{oc.shape[0] if oc is not None else 0}")
        la, lb = art(oc) if oc is not None else ['(空)'], art(wc) if wc is not None else ['(空)']
        print('  本项目 ' + ' ' * 8 + '   官方原图')
        for i2 in range(max(len(la), len(lb))):
            left = la[i2] if i2 < len(la) else ''
            right = lb[i2] if i2 < len(lb) else ''
            print(f'  {left:<46}| {right}')
