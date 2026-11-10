"""解析 probe 截图的标记像素，判断每个候选 wiki 文件是否存在及其原始尺寸。"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
meta = json.loads((ROOT / '_uiicons' / 'probe.meta.json').read_text('utf-8'))
CELL, PERROW = meta['cell'], meta['perRow']
png = ROOT / '_uiicons' / 'probe.png'
A = np.array(Image.open(png).convert('RGBA'))
res = []
for i, it in enumerate(meta['items']):
    c, r = i % PERROW, i // PERROW
    x, y = c * CELL + 6, r * CELL + 6
    if y >= A.shape[0] or x >= A.shape[1]:
        res.append({**it, 'exists': False, 'w': None, 'h': None}); continue
    px = A[y, x]
    R, G, B = int(px[0]), int(px[1]), int(px[2])
    ok = (B == 128 and not (R == 255 and G == 0))
    res.append({**it, 'exists': ok, 'w': R if ok else None, 'h': G if ok else None})
(ROOT / '_uiicons' / 'probe.result.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), 'utf-8')
for x in res:
    print(f"{'OK ' if x['exists'] else 'MISS'}  {x['file']:36s} {x['w']}x{x['h']}  {x['path']}")
print(f"\ntotal {len(res)}  exists {sum(1 for x in res if x['exists'])}")
