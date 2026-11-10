"""像素相似度分析：本项目程序化绘制的精灵  vs  stardewvalleywiki.com 官方原图。

流程
  1. Chrome 截图出原生分辨率网格（上半=我们画的，下半=官方原图），这里按几何切片。
  2. 官方图在 wiki 上是游戏 16x16 原图的 3 倍放大版，用"整块同色"检测还原回原始像素网格。
  3. 两边都裁到内容包围盒，计算：
       - 轮廓 IoU：alpha 掩码缩放到 64x64 后的交并比
       - dHash 相似度：9x8 灰度差分哈希的汉明距离
       - 调色板覆盖率：两图颜色集合在容差内的互相覆盖
       - 主色接近度 / 长宽比接近度 / 相对面积接近度
  4. 随机对照：拿同分类里"别的"官方图当参照算基准分。
     若匹配分并不显著高于随机分，说明这一项并没有复现官方轮廓。
  5. 输出 JSON 明细 + 并排对比大图（PNG）+ 汇总。
"""
import json
import math
import os
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
OUT = ROOT / '_cmp' / 'out'
REPORT = ROOT / '_cmp' / 'report'
REPORT.mkdir(parents=True, exist_ok=True)
NORM = 64


# ---------------- 基础工具 ----------------
def crop_content(arr, thr=8):
    a = arr[:, :, 3]
    ys, xs = np.where(a > thr)
    if len(xs) == 0:
        return None
    return arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1, :]


def detect_block_scale(rgb):
    """检测图是否被整数倍放大（wiki 上是 3x 放大的 16x16 原图）。
    若整个图可被 k*k 同色块整除且每块同色，则说明是 k 倍放大。"""
    h, w = rgb.shape[:2]
    for k in (4, 3, 2):
        if w % k or h % k:
            continue
        b = rgb[:h // k * k, :w // k * k, :].reshape(h // k, k, w // k, k, rgb.shape[2])
        if np.all(b == b[:, :1, :, :1, :]):
            return k
    return 1


def downscale(arr, k):
    if k <= 1:
        return arr
    return arr[::k, ::k, :]


def mask_of(arr):
    return (arr[:, :, 3] > 128).astype(np.float32)


def norm_mask(m):
    im = Image.fromarray((m * 255).astype(np.uint8), 'L').resize((NORM, NORM), Image.BOX)
    return np.array(im) > 127


def dhash(arr):
    a = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3] / 255.0
    lum = (0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]) * alpha
    d = np.array(Image.fromarray(lum.astype(np.uint8), 'L').resize((9, 8), Image.BOX))
    return (d[:, 1:] > d[:, :-1]).flatten()


def colors(arr, tol=40):
    a = arr[:, :, 3] > 200
    if a.sum() == 0:
        return np.zeros((0, 3), np.float32)
    return arr[:, :, :3][a].astype(np.float32)


def palette_coverage(c1, c2, tol=40):
    """两图颜色集合互相覆盖的比例（容差内的算命中）"""
    if len(c1) == 0 or len(c2) == 0:
        return 0.0
    u1 = np.unique((c1 // 16).astype(np.int32), axis=0)
    u2 = np.unique((c2 // 16).astype(np.int32), axis=0)
    d = np.linalg.norm(u1[:, None, :] - u2[None, :, :], axis=2)
    cov1 = float((d.min(axis=1) <= tol).mean())
    cov2 = float((d.min(axis=0) <= tol).mean())
    return (cov1 + cov2) / 2


def compare(ours, wiki):
    mo, mw = mask_of(ours), mask_of(wiki)
    no, nw = norm_mask(mo), norm_mask(mw)
    inter = np.logical_and(no, nw).sum()
    union = np.logical_or(no, nw).sum()
    iou = inter / union if union else 0.0

    ho, hw = dhash(ours), dhash(wiki)
    dhash_sim = 1.0 - float(np.count_nonzero(ho != hw)) / len(ho)

    co, cw = colors(ours), colors(wiki)
    pal = palette_coverage(co, cw)
    dc = float(np.linalg.norm(co.mean(axis=0) - cw.mean(axis=0))) if len(co) and len(cw) else 200.0
    col_sim = max(0.0, 1.0 - dc / 200.0)

    ao = ours.shape[0] * ours.shape[1]
    aw = wiki.shape[0] * wiki.shape[1]
    asp_o = ours.shape[1] / max(1, ours.shape[0])
    asp_w = wiki.shape[1] / max(1, wiki.shape[0])
    aspect_sim = max(0.0, 1.0 - abs(asp_o - asp_w) / max(asp_o, asp_w))
    size_sim = max(0.0, 1.0 - abs(math.log((ao + 1) / (aw + 1))))

    score = (0.30 * iou + 0.20 * dhash_sim + 0.20 * pal +
             0.15 * col_sim + 0.10 * aspect_sim + 0.05 * size_sim)
    return {
        'iou': round(iou, 4), 'dhash_sim': round(dhash_sim, 4),
        'palette_cov': round(pal, 4), 'color_sim': round(col_sim, 4),
        'aspect_sim': round(aspect_sim, 4), 'size_sim': round(size_sim, 4),
        'ours_box': [int(ours.shape[1]), int(ours.shape[0])],
        'wiki_box': [int(wiki.shape[1]), int(wiki.shape[0])],
        'score': round(score * 100, 2)
    }


def load_font(px):
    for f in [r'C:\Windows\Fonts\msyh.ttc', r'C:\Windows\Fonts\simhei.ttf', r'C:\Windows\Fonts\arial.ttf']:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, px)
            except Exception:
                continue
    return ImageFont.load_default()


def fit_nearest(arr, target=64):
    h, w = arr.shape[:2]
    s = max(1, int(round(target / max(h, w))))
    return Image.fromarray(arr, 'RGBA').resize((w * s, h * s), Image.NEAREST)


def split_variants(arr):
    """官方树木阶段图往往把 2~3 个季节变体并排放在一张图里
    （如 Oak_Stage_5.png = 春/夏/秋 三个 85px 宽的格子拼在一起）。
    直接拿整张图去比会低估相似度，这里先拆出单棵树的图块。

    规则：先找整列全透明的缝隙；找不到就试三等分，
    若三块彼此高度相似（确实是重复的变体）就取第一块。"""
    if arr is None:
        return []
    a = arr[:, :, 3] > 8
    h, w = a.shape
    colsum = a.sum(axis=0)

    # 1) 全透明列分隔
    gaps, run = [], 0
    for x in range(w):
        if colsum[x] == 0:
            run += 1
        else:
            if run >= 2:
                gaps.append((x - run, x - 1))
            run = 0
    if run >= 2:
        gaps.append((w - run, w - 1))
    if gaps:
        edges = [0] + [g[1] + 1 for g in gaps] + [w]
        panels = [arr[:, edges[i]:edges[i + 1]] for i in range(len(edges) - 1)]
        panels = [crop_content(p) for p in panels]
        panels = [p for p in panels if p is not None and p.shape[1] > 8]
        if len(panels) >= 2:
            return panels

    # 2) 三等分是否是真变体
    if w >= 90:
        third = w // 3
        parts = [crop_content(arr[:, j * third:(j + 1) * third]) for j in range(3)]
        if all(p is not None for p in parts):
            s1 = compare(parts[0], parts[1])['iou']
            s2 = compare(parts[1], parts[2])['iou']
            if s1 > 0.5 and s2 > 0.5:
                return parts
    return [arr]


def main():
    idx = OUT / 'index.json'
    if not idx.exists():
        print('no built categories')
        return
    cats = json.loads(idx.read_text('utf-8'))
    font = load_font(12)
    font_b = load_font(16)
    font_s = load_font(11)
    summary = {}

    for cat in cats:
        meta = json.loads((OUT / f'{cat}.meta.json').read_text('utf-8'))
        gp = OUT / f'{cat}.grid.png'
        if not gp.exists():
            print(f'{cat}: missing screenshot')
            continue
        A = np.array(Image.open(gp).convert('RGBA'))
        cell, per, gridH = meta['cell'], meta['perRow'], meta['gridH']
        items = meta['items']

        ours_list, wiki_list, scales, panels_list = [], [], [], []
        for i, it in enumerate(items):
            c, r = i % per, i // per
            x0, y0 = c * cell, r * cell
            o = A[y0:y0 + cell, x0:x0 + cell, :]
            ww, wh = it['wikiSize']
            w = A[gridH + y0:gridH + y0 + wh, x0:x0 + ww, :]
            k = detect_block_scale(w[:, :, :3])
            w = downscale(w, k)
            oc, wc = crop_content(o), crop_content(w)
            ours_list.append(oc)
            wiki_list.append(wc)
            scales.append(k)
            # 官方树木图是"多季节变体并排"，拆开后再比才公平
            panels = split_variants(w) if cat == 'trees' else ([wc] if wc is not None else [])
            panels_list.append([p for p in panels if p is not None] or [wc])

        rows = []
        for i, it in enumerate(items):
            o = ours_list[i]
            if o is None or not panels_list[i]:
                rows.append({'id': it['id'], 'name': it['name'], 'en': it['en'],
                             'status': 'missing_sprite', 'score': 0.0,
                             'wiki_scale': scales[i]})
                continue
            # 与所有变体分别比，取平均（不挑最像的那个，避免偏乐观）
            per_panel = [compare(o, p) for p in panels_list[i]]
            keys = ['iou', 'dhash_sim', 'palette_cov', 'color_sim', 'aspect_sim',
                    'size_sim', 'score']
            res = {k: round(sum(p[k] for p in per_panel) / len(per_panel), 4) for k in keys}
            res['ours_box'] = per_panel[0]['ours_box']
            res['wiki_box'] = per_panel[0]['wiki_box']
            res.update({'id': it['id'], 'name': it['name'], 'en': it['en'],
                        'status': 'ok', 'wiki_scale': scales[i],
                        'variants': len(per_panel),
                        'wikiFile': it.get('wikiFile', '')})
            rows.append(res)

        ok_idx = [i for i, r in enumerate(rows) if r['status'] == 'ok']
        rnd = []
        if len(ok_idx) > 1:
            rng = random.Random(20261109)
            for i in ok_idx:
                others = [j for j in ok_idx if j != i]
                for _ in range(3):
                    j = rng.choice(others)
                    ps = panels_list[j]
                    rnd.append(sum(compare(ours_list[i], p)['score'] for p in ps) / len(ps))
        rnd_mean = sum(rnd) / len(rnd) if rnd else 0.0
        own = [r['score'] for r in rows if r['status'] == 'ok']
        own_mean = sum(own) / len(own) if own else 0.0
        srt = sorted(own)

        def pct(p):
            return srt[min(len(srt) - 1, int(p / 100 * len(srt)))] if srt else 0

        summary[cat] = {
            'items': len(rows), 'ok': len(own),
            'own_mean': round(own_mean, 2), 'random_mean': round(rnd_mean, 2),
            'margin': round(own_mean - rnd_mean, 2),
            'p10': pct(10), 'p50': pct(50), 'p90': pct(90),
            'wiki_scale_hist': {str(s): scales.count(s) for s in sorted(set(scales))},
        }

        # ---------- 并排对比大图 ----------
        COLS = 4
        PAD, TILE, LBL = 12, 88, 150
        bw = PAD + COLS * (LBL + TILE + TILE + 66)
        bh = 78 + math.ceil(len(items) / COLS) * (TILE + 26)
        sheet = Image.new('RGBA', (bw, bh), (18, 22, 28, 255))
        d = ImageDraw.Draw(sheet)
        d.text((PAD, 12), f'{cat} — 本项目程序化绘制   vs   stardewvalleywiki.com 官方原图',
               fill=(233, 201, 111, 255), font=font_b)
        d.text((PAD, 36), f'条目 {len(items)}   匹配均分 {own_mean:.1f}   随机对照 {rnd_mean:.1f}   差距 {own_mean - rnd_mean:+.1f}',
               fill=(139, 154, 171, 255), font=font)
        d.text((PAD + LBL, 60), '← 本项目绘制', fill=(108, 196, 242, 255), font=font_s)
        d.text((PAD + LBL + TILE + 8, 60), '← 官方原图', fill=(233, 201, 111, 255), font=font_s)

        for i, r in enumerate(rows):
            cx = PAD + (i % COLS) * (LBL + TILE + TILE + 66)
            cy = 78 + (i // COLS) * (TILE + 26)
            d.text((cx, cy), (r.get('name') or '')[:11], fill=(244, 230, 198, 255), font=font)
            d.text((cx, cy + 15), f"{r.get('en','')[:22]}  [{r.get('score',0):.0f}]",
                   fill=(139, 154, 171, 255), font=font_s)
            for j, arr in enumerate((ours_list[i], panels_list[i][0] if panels_list[i] else None)):
                x = cx + LBL + j * (TILE + 8)
                d.rectangle([x, cy - 4, x + TILE, cy - 4 + TILE], fill=(26, 32, 41, 255),
                            outline=(35, 42, 51, 255))
                if arr is not None:
                    im2 = fit_nearest(arr, TILE - 8)
                    sheet.alpha_composite(im2, (x + (TILE - im2.width) // 2,
                                                cy - 4 + (TILE - im2.height) // 2))
        sheet.convert('RGB').save(REPORT / f'sheet-{cat}.png')
        (REPORT / f'{cat}.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), 'utf-8')
        print(f"{cat}: n={len(rows)} ok={len(own)} own={own_mean:.1f} rnd={rnd_mean:.1f} "
              f"margin={own_mean - rnd_mean:+.1f} scales={summary[cat]['wiki_scale_hist']}")

    (REPORT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1), 'utf-8')
    print('\n== 汇总 ==')
    for c, s in summary.items():
        print(f"{c:11s} n={s['items']:3d} 匹配={s['own_mean']:5.1f} 随机={s['random_mean']:5.1f} "
              f"差距={s['margin']:+5.1f} p10={s['p10']:5.1f} p50={s['p50']:5.1f} p90={s['p90']:5.1f}")


if __name__ == '__main__':
    main()
