/* 通用图鉴面板组件：列表 / 筛选 / 计数 / 图鉴网格 / 下载。
 * 各分类只提供数据与「怎么画」，不再各写一遍 DOM 循环。
 *
 * const catalog = createCatalog({
 *   prefix: 'hat',
 *   items: HATS,
 *   map: HAT_MAP,
 *   filterGroups: HAT_GROUPS,
 *   groupOf: h => h.group,
 *   gallery: { w: HAT_W, h: HAT_H, draw: (g, h) => drawHatIcon(g, h, 0.25) },
 *   onSelect: id => { state.hat = id; sync(); render(); }
 * });
 */

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export function downloadCanvas(canvas, name) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/** 把 draw(条目) 放大若干倍后导出单张 PNG（所有分类共用）。 */
export function exportItemPng(item, w, h, draw, name, scale = 8) {
  const { canvas } = makeCanvas(w * scale, h * scale);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.scale(scale, scale);
  draw(g, item);
  downloadCanvas(canvas, name);
}

/**
 * 图鉴面板底座。
 * 只负责列表、筛选、选中态、计数与底部图鉴网格；
 * 主画面与状态栏仍由各分类自己绘制。
 */
export function createCatalog(opts) {
  const {
    prefix,
    items,
    map,
    key = 'item',
    filterGroups = null,
    groupOf = null,
    nameOf = it => it.name,
    titleOf = it => it.en || it.name,
    gallery = null,
    onSelect,
    onFilter
  } = opts;

  const listHost = document.getElementById(`${prefix}-list`);
  const filterHost = document.getElementById(`${prefix}-filters`);
  const countEl = document.getElementById(`${prefix}-count`);

  let filter = 'all';
  let current = items[0] ? items[0].id : null;

  if (filterHost && filterGroups) {
    for (const group of filterGroups) {
      const b = document.createElement('button');
      b.textContent = group.name;
      b.dataset.filter = group.id;
      b.addEventListener('click', () => {
        filter = group.id;
        applyFilter();
        sync(current);
        if (onFilter) onFilter(group.id);
      });
      filterHost.appendChild(b);
    }
  }

  if (listHost) {
    for (const it of items) {
      const b = document.createElement('button');
      b.textContent = nameOf(it);
      b.dataset[key] = it.id;
      b.title = titleOf(it);
      b.addEventListener('click', () => select(it.id));
      listHost.appendChild(b);
    }
  }

  function applyFilter() {
    let n = 0;
    if (listHost) {
      for (const b of listHost.children) {
        const it = map[b.dataset[key]];
        const show = filter === 'all' || !groupOf || groupOf(it) === filter;
        b.style.display = show ? '' : 'none';
        if (show) n++;
      }
    }
    if (countEl) countEl.textContent = `（${n}）`;
    if (filterHost) {
      for (const b of filterHost.children) {
        b.classList.toggle('active', b.dataset.filter === filter);
      }
    }
    return n;
  }

  function sync(id) {
    if (id !== undefined) current = id;
    if (listHost) {
      for (const b of listHost.children) b.classList.toggle('active', b.dataset[key] === current);
    }
    return current;
  }

  function select(id) {
    if (!map[id] && !items.some(it => it.id === id)) return;
    current = id;
    if (onSelect) onSelect(id);
  }

  function buildGallery() {
    if (!gallery) return;
    const host = document.getElementById(`${prefix}-gallery`);
    if (!host) return;
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = gallery.gridClass || 'hgrid';

    for (const it of items) {
      const cell = document.createElement('div');
      cell.className = gallery.cellClass || 'hcell';
      cell.title = titleOf(it) + (gallery.metaOf ? ` · ${gallery.metaOf(it)}` : '');

      const { canvas, ctx } = makeCanvas(gallery.w, gallery.h);
      gallery.draw(ctx, it);
      const name = document.createElement('b');
      name.textContent = gallery.labelOf ? gallery.labelOf(it) : nameOf(it);
      const meta = document.createElement('span');
      meta.textContent = gallery.metaOf ? gallery.metaOf(it) : '';

      cell.appendChild(canvas);
      cell.appendChild(name);
      if (gallery.metaOf) cell.appendChild(meta);
      cell.addEventListener('click', () => {
        select(it.id);
        const stage = document.getElementById(`${prefix}-stage`);
        if (stage) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      grid.appendChild(cell);
    }

    host.appendChild(grid);
  }

  return {
    listHost,
    filterHost,
    countEl,
    applyFilter,
    sync,
    select,
    buildGallery,
    get filter() { return filter; },
    get current() { return current; }
  };
}

/** 状态栏统一渲染：rows = [[标签, 值], ...] */
export function renderStatus(el, rows) {
  if (!el) return;
  el.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}
