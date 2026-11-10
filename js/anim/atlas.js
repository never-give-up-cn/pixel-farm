/* 图集导出：把程序化像素帧打包成 sprite sheet + JSON 元数据。
 * 不依赖游戏全局，Demo 和游戏本体都能直接用。
 *
 * 用法：
 *   const { canvas, meta } = buildFarmerAtlas({ scale: 2 });
 *   downloadAtlas(canvas, meta, 'farmer');
 */

import { CELL_W, CELL_H, DIRECTIONS, ACTIONS, getFrame } from './animator.js';

function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, ctx: g };
}

/**
 * 把一组帧画进一张横向/网格排列的图集。
 * frames: [{ id, w, h, draw(ctx) }]
 */
export function buildAtlas(frames, opts = {}) {
  const scale = Math.max(1, Math.round(opts.scale || 1));
  const pad = Math.max(0, opts.padding ?? 0);
  const cellW = Math.max(...frames.map(f => f.w));
  const cellH = Math.max(...frames.map(f => f.h));
  const cols = Math.max(1, opts.columns || Math.ceil(Math.sqrt(frames.length)));
  const rows = Math.ceil(frames.length / cols);
  const w = cols * (cellW + pad) + pad;
  const h = rows * (cellH + pad) + pad;

  const { canvas, ctx } = createCanvas(w * scale, h * scale);
  const out = [];
  const cell = createCanvas(cellW, cellH);

  frames.forEach((f, i) => {
    const cx = pad + (i % cols) * (cellW + pad);
    const cy = pad + Math.floor(i / cols) * (cellH + pad);

    cell.ctx.clearRect(0, 0, cellW, cellH);
    f.draw(cell.ctx);
    ctx.drawImage(cell.canvas, cx * scale, cy * scale, f.w * scale, f.h * scale);

    out.push({
      id: f.id,
      x: cx * scale,
      y: cy * scale,
      w: f.w * scale,
      h: f.h * scale
    });
  });

  return {
    canvas,
    meta: {
      image: `${opts.name || 'atlas'}.png`,
      scale,
      padding: pad,
      columns: cols,
      rows,
      cell: { w: cellW * scale, h: cellH * scale },
      frames: out
    }
  };
}

/** 农夫全部动作 × 四方向，按「动作一行」排列。 */
export function buildFarmerAtlas(opts = {}) {
  const scale = Math.max(1, Math.round(opts.scale || 1));
  const actions = (opts.actions || ACTIONS.map(a => a.id));
  const dirs = opts.directions || DIRECTIONS.map(d => d.id);
  const frames = [];
  let maxFrames = 1;

  for (const action of actions) {
    const meta = ACTIONS.find(a => a.id === action);
    if (meta) maxFrames = Math.max(maxFrames, meta.frames);
  }

  for (const action of actions) {
    for (const dir of dirs) {
      const meta = ACTIONS.find(a => a.id === action) || ACTIONS[0];
      for (let f = 0; f < meta.frames; f++) {
        frames.push({
          id: `${action}_${dir}_${f}`,
          w: CELL_W,
          h: CELL_H,
          action,
          dir,
          frame: f,
          draw: g => {
            g.drawImage(getFrame(action, dir, f).canvas, 0, 0);
          }
        });
      }
      /* 补齐行宽，便于按「动作 × 方向」切片 */
      for (let f = meta.frames; f < maxFrames; f++) {
        frames.push({
          id: `${action}_${dir}_${f}`,
          w: CELL_W,
          h: CELL_H,
          action,
          dir,
          frame: f,
          empty: true,
          draw: () => {}
        });
      }
    }
  }

  const atlas = buildAtlas(frames, {
    scale,
    columns: maxFrames,
    padding: opts.padding ?? 0,
    name: opts.name || 'farmer'
  });

  atlas.meta.layout = 'action-direction-row';
  atlas.meta.actions = actions;
  atlas.meta.directions = dirs;
  atlas.meta.framesPerRow = maxFrames;
  atlas.meta.frames = atlas.meta.frames.map((m, i) => {
    const f = frames[i];
    return { ...m, action: f.action, dir: f.dir, frame: f.frame, empty: !!f.empty };
  });
  return atlas;
}

/** 任意图鉴条目：items + draw(ctx,item,w,h) → 统一图集。 */
export function buildCatalogAtlas(items, draw, opts = {}) {
  const w = opts.w || 32;
  const h = opts.h || 32;
  const frames = items.map(it => ({
    id: it.id,
    w,
    h,
    draw: g => draw(g, it, w, h)
  }));
  return buildAtlas(frames, {
    scale: opts.scale || 1,
    columns: opts.columns || opts.cols || 10,
    padding: opts.padding ?? 0,
    name: opts.name || 'catalog'
  });
}

/** 触发浏览器下载：PNG + JSON 一起（JSON 里带 image 文件名）。 */
export function downloadAtlas(atlas, name) {
  const base = name || 'atlas';
  const meta = { ...atlas.meta, image: `${base}.png` };
  const png = atlas.canvas.toDataURL('image/png');
  const json = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(meta, null, 2))}`;
  trigger(png, `${base}.png`);
  trigger(json, `${base}.json`);
  return meta;
}

function trigger(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}
