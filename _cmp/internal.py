"""集合内部相似度对比：把"我们这一套"内部两两互比，再把"官方那一套"内部两两互比。

如果我们的图是照着官方逐个画的，那么
    我们内部的相似度 ≈ 官方内部的相似度 ≈ 匹配分
如果我们的图是套模板生成的，那么我们内部会高度雷同，
而官方每一件都是独立美术画出来的，内部差异更大。
"""
import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from analyze import compare, crop_content, detect_block_scale, downscale, split_variants

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
OUT = ROOT / '_cmp' / 'out'
random.seed(7)

idx = json.loads((OUT / 'index.json').read_text('utf-8'))
res = {}
for cat in idx:
    meta = json.loads((OUT / f'{cat}.meta.json').read_text('utf-8'))
    A = np.array(Image.open(OUT / f'{cat}.grid.png').convert('RGBA'))
    cell, per, gridH = meta['cell'], meta['perRow'], meta['gridH']
    ours, wikis = [], []
    for i, it in enumerate(meta['items']):
        c, r = i % per, i // per
        x0, y0 = c * cell, r * cell
        o = crop_content(A[y0:y0 + cell, x0:x0 + cell, :])
        ww, wh = it['wikiSize']
        w = A[gridH + y0:gridH + y0 + wh, x0:x0 + ww, :]
        if o is None or w is None:
            continue
        k = detect_block_scale(w[:, :, :3])
        w = downscale(w, k)
        if cat == 'trees':
            ps = split_variants(w)
            w = ps[0] if ps else crop_content(w)
        else:
            w = crop_content(w)
        if w is None:
            continue
        ours.append(o)
        wikis.append(w)

    def internal(set_):
        n = len(set_)
        if n < 2:
            return None
        pairs = [(a, b) for a in range(n) for b in range(a + 1, n)]
        if len(pairs) > 400:
            pairs = random.sample(pairs, 400)
        s = [compare(set_[a], set_[b])['score'] for a, b in pairs]
        return sum(s) / len(s)

    io_, iw = internal(ours), internal(wikis)
    if io_ is None:
        continue
    res[cat] = {'n': len(ours), 'ours_internal': round(io_, 1), 'wiki_internal': round(iw, 1),
                'gap': round(io_ - iw, 1)}
    print(f'{cat:11s} n={len(ours):3d}  我们内部={io_:6.1f}  官方内部={iw:6.1f}  '
          f'雷同度差={io_ - iw:+6.1f}')

(ROOT / '_cmp' / 'report' / 'internal.json').write_text(
    json.dumps(res, ensure_ascii=False, indent=1), 'utf-8')
print('\nwritten _cmp/report/internal.json')
