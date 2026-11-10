/* 生成候选图验证网格页（每格左上角 12x12 标记像素：加载成功=rgb(w,h,128)，失败=rgb(255,0,255)）。 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(process.argv[2] || '.');
const names = fs.readFileSync(path.resolve(ROOT, process.argv[3]), 'utf8').split('\n').map(s => s.trim()).filter(Boolean);

function mwPath(file) {
  const base = file.replace(/ /g, '_');
  const h = crypto.createHash('md5').update(base).digest('hex');
  return `/mediawiki/images/en/${h[0]}/${h.slice(0, 2)}/${base}`;
}

const items = names.map(n => ({ file: n, path: mwPath(n) }));
fs.writeFileSync(path.join(ROOT, '_uiicons', 'probe.items.json'), JSON.stringify(items, null, 1));

const CELL = 48, PERROW = 12;
const rows = Math.ceil(items.length / PERROW);
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff}
.grid{display:grid;grid-template-columns:repeat(${PERROW},${CELL}px);width:${PERROW * CELL}px}
.cell{width:${CELL}px;height:${CELL}px;position:relative;overflow:hidden}
.mk{position:absolute;left:0;top:0;width:12px;height:12px}
img{position:absolute;left:14px;top:14px;width:30px;height:30px;object-fit:contain;image-rendering:pixelated}
</style></head><body><div id="g" class="grid"></div>
<script type="module">
const LIST=${JSON.stringify(items)};
const g=document.getElementById('g');
const E=LIST.map(c=>{const cell=document.createElement('div');cell.className='cell';
const mk=document.createElement('div');mk.className='mk';mk.style.background='rgb(255,0,255)';
const im=document.createElement('img');cell.append(mk,im);g.append(cell);return{c,im,mk};});
for(let i=0;i<E.length;i+=8){const b=E.slice(i,i+8);
await Promise.all(b.map(e=>new Promise(r=>{e.im.onload=()=>{const w=Math.min(e.im.naturalWidth,255),h=Math.min(e.im.naturalHeight,255);e.mk.style.background='rgb('+w+','+h+',128)';r();};
e.im.onerror=()=>{e.mk.style.background='rgb(255,0,255)';r();};
e.im.src='https://stardewvalleywiki.com'+e.c.path;})));
}
document.title='READY';
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, '_uiicons', 'probe.html'), html, 'utf8');
fs.writeFileSync(path.join(ROOT, '_uiicons', 'probe.meta.json'), JSON.stringify({ cell: CELL, perRow: PERROW, rows, w: PERROW * CELL, h: rows * CELL, items }, null, 1));
console.log(`probe.html: ${items.length} items, ${PERROW * CELL}x${rows * CELL}`);
