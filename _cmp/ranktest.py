"""配对识别力测试：把"我们画的第 i 个"和"官方全部 N 个"逐个比对，
看**正确的那个**官方图排第几。

如果我们的图确实画的是官方那件东西，正确配对应当稳定排第 1；
如果只是"同一类都长得像"，正确配对的名次会随机散开。

用法: python _cmp/ranktest.py <分类> [更多分类...]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

cats = sys.argv[1].split(',') if len(sys.argv) > 1 else []
sys.argv = [sys.argv[0], '.']          # analyze.py 导入时会把 argv[1] 当成根目录
sys.path.insert(0, str(Path(__file__).resolve().parent))
from analyze import (OUT, REPORT, compare, crop_content, detect_block_scale, downscale)  # noqa: E402

built = json.loads((OUT / 'index.json').read_text('utf-8'))
results = {}

for cat in cats:
    if cat not in built:
        print(f'{cat}: 未构建')
        continue
    meta = json.loads((OUT / f'{cat}.meta.json').read_text('utf-8'))
    A = np.array(Image.open(OUT / f'{cat}.grid.png').convert('RGBA'))
    cell, per, gridH = meta['cell'], meta['perRow'], meta['gridH']
    items = meta['items']

    ours, wikis = [], []
    for i, it in enumerate(items):
        c, r = i % per, i // per
        x0, y0 = c * cell, r * cell
        o = crop_content(A[y0:y0 + cell, x0:x0 + cell, :])
        ww, wh = it['wikiSize']
        w = A[gridH + y0:gridH + y0 + wh, x0:x0 + ww, :]
        k = detect_block_scale(w[:, :, :3])
        w = downscale(w, k)
        w = crop_content(w)
        ours.append(o)
        wikis.append(w)

    n = len(items)
    M = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if ours[i] is None or wikis[j] is None:
                continue
            M[i, j] = compare(ours[i], wikis[j])['score']

    ranks = []
    correct_scores, best_scores = [], []
    for i in range(n):
        row = M[i].copy()
        best_j = int(np.argmax(row))
        rank = int((row > row[i]).sum()) + 1
        ranks.append(rank)
        correct_scores.append(row[i])
        best_scores.append(row[best_j])

    rank1 = sum(1 for r in ranks if r == 1)
    print(f'\n=== {cat}（{n} 项）')
    print(f'  正确配对排第 1 的：{rank1}/{n}（{rank1 / n * 100:.0f}%）  '
          f'随机猜中的期望只有 {100 / n:.0f}%')
    print(f'  名次中位数 {int(np.median(ranks))}，平均 {np.mean(ranks):.1f}')
    print(f'  正确配对均分 {np.mean(correct_scores):.1f}  vs  '
          f'每一项"配错时的最高分"均分 {np.mean(best_scores):.1f}')
    print(f'  => 挑最高分能挑对的比例 {rank1 / n * 100:.0f}%')
    worst = sorted(range(n), key=lambda i: -ranks[i])[:6]
    for i in worst:
        print(f'    {items[i]["id"]:16s} {items[i]["en"]:16s} '
              f'正确={M[i, i]:.1f}(第{ranks[i]}名) 最高={best_scores[i]:.1f} '
              f'(第1名其实是 {items[int(np.argmax(M[i]))]["en"]})')

    results[cat] = {
        'n': n, 'rank1': rank1, 'rank1_pct': round(rank1 / n * 100, 1),
        'median_rank': int(np.median(ranks)), 'mean_rank': round(float(np.mean(ranks)), 1),
        'correct_mean': round(float(np.mean(correct_scores)), 1),
        'best_wrong_mean': round(float(np.mean(best_scores)), 1),
        'random_expect_pct': round(100 / n, 1),
        'ranks': {items[i]['id']: int(ranks[i]) for i in range(n)},
    }

Path(REPORT / 'ranktest.json').write_text(json.dumps(results, ensure_ascii=False, indent=1), 'utf-8')
print('\n-> _cmp/report/ranktest.json')
