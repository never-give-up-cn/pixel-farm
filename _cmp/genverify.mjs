/* 生成"候选 URL 存在性验证"页面。
 *
 * 每格左上角放一个 12x12 的纯色标记：
 *   加载成功 -> RGB = (naturalWidth, naturalHeight, 128)（宽高编码进 R/G 通道）
 *   加载失败 -> RGB = (255, 0, 255)（洋红）
 *
 * 待验证的候选来自 _cmp/pending.json（不存在时用 candidates.json 全量）。
 * 配合 verifyloop.mjs 做多轮重试：wiki 对短时间大量请求会限流，失败的要重试。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const OUT = path.join(ROOT, '_cmp', 'out');
const BATCH = Number(process.argv[4] || 16);

let flat;
const pendingPath = path.join(ROOT, '_cmp', 'pending.json');
if (fs.existsSync(pendingPath)) {
  flat = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'));
} else {
  const cand = JSON.parse(fs.readFileSync(path.join(ROOT, '_cmp', 'candidates.json'), 'utf-8'));
  flat = [];
  for (const [cat, c] of Object.entries(cand)) {
    for (const it of c.items) {
      it.cands.forEach((cd, ci) => {
        flat.push({ cat, id: it.id, name: it.name, en: it.en, ci, role: cd.role, file: cd.file, path: cd.path });
      });
    }
  }
  fs.writeFileSync(pendingPath, JSON.stringify(flat));
}

const CELL = 48, PERROW = 16, CHUNK = 256;
const chunks = Math.ceil(flat.length / CHUNK);
for (let k = 0; k < chunks; k++) {
  const part = flat.slice(k * CHUNK, (k + 1) * CHUNK);
  const rows = Math.ceil(part.length / PERROW);
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:transparent}
.grid{display:grid;grid-template-columns:repeat(${PERROW}, ${CELL}px);width:${PERROW * CELL}px}
.cell{width:${CELL}px;height:${CELL}px;position:relative;overflow:hidden}
.mk{position:absolute;left:0;top:0;width:12px;height:12px}
img{position:absolute;left:14px;top:14px;width:30px;height:30px;object-fit:contain;image-rendering:pixelated}
</style></head><body><div id="g" class="grid"></div>
<script type="module">
const LIST = ${JSON.stringify(part)};
const BATCH = ${BATCH};
const g = document.getElementById('g');
const entries = LIST.map(c => {
  const cell = document.createElement('div'); cell.className='cell';
  const mk = document.createElement('div'); mk.className='mk'; mk.style.background='rgb(255,0,255)';
  const img = document.createElement('img');
  cell.append(mk, img); g.appendChild(cell);
  return { c, img, mk };
});
for (let i = 0; i < entries.length; i += BATCH) {
  const batch = entries.slice(i, i + BATCH);
  await Promise.all(batch.map(e => new Promise(resolve => {
    e.img.onload = () => { const w=Math.min(e.img.naturalWidth,255), h=Math.min(e.img.naturalHeight,255);
      e.mk.style.background='rgb('+w+','+h+',128)'; resolve(); };
    e.img.onerror = () => { e.mk.style.background='rgb(255,0,255)'; resolve(); };
    e.img.src = 'https://stardewvalleywiki.com' + e.c.path;
  })));
}
document.title='READY';
</script></body></html>`;
  fs.writeFileSync(path.join(OUT, `verify-${k}.html`), html);
  fs.writeFileSync(path.join(OUT, `verify-${k}.meta.json`), JSON.stringify({
    chunk: k, count: part.length, cell: CELL, perRow: PERROW, rows,
    w: PERROW * CELL, h: rows * CELL,
    items: part
  }, null, 1));
}
fs.writeFileSync(path.join(OUT, 'verify.index.json'), JSON.stringify({ chunks, total: flat.length, cell: CELL, perRow: PERROW }));
console.log(`verify pages: ${chunks} chunks, ${flat.length} candidates, batch=${BATCH}`);
