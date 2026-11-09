/* 像素绘制基础：调色板、像素矩形 / 直线 / 椭圆、缓动与关键帧插值。
 * 这一层只关心 1x 像素坐标，不做缩放；缩放交给 Animator 的整数倍放大。 */

export const CELL_W = 32;
export const CELL_H = 40;

export const DIR_DOWN = 0;
export const DIR_LEFT = 1;
export const DIR_RIGHT = 2;
export const DIR_UP = 3;
export const DIR_NAMES = ['下', '左', '右', '上'];
export const DIR_IDS = ['down', 'left', 'right', 'up'];

export const PALETTE = {
  skin:      '#f2c48d',
  skinShade: '#d99a63',
  skinLight: '#ffd9a8',
  hair:      '#6b4226',
  hairLight: '#8a5a35',
  hat:       '#e9c96f',
  hatShade:  '#c9a548',
  hatLight:  '#f5df9a',
  hatBand:   '#8a5a2b',
  shirt:     '#f2ead2',
  shirtShade:'#cfc3a0',
  overalls:  '#3f6fb5',
  overallsShade:'#2f5590',
  boot:      '#5a3a22',
  bootShade: '#3f2817',
  eye:       '#2a1e16',
  wood:      '#8a5a2b',
  woodShade: '#6b421f',
  metal:     '#c8d0d8',
  metalShade:'#8a949e',
  water:     '#6cc4f2',
  waterLight:'#b8e8ff',
  leaf:      '#5fae4a',
  leafShade: '#3f7f32',
  crop:      '#e08a3c',
  white:     '#fff6e0',
  red:       '#e05a4a',
  dirt:      '#8a6a42',
  dirtLight: '#b08a55',
  shadow:    'rgba(20, 26, 18, 0.28)'
};

export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

/* 取整后的 fillRect，避免半像素造成的模糊 */
export function R(g, x, y, w, h, color) {
  if (w <= 0 || h <= 0) return;
  if (color) g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function px(g, x, y, color) {
  R(g, x, y, 1, 1, color);
}

/* Bresenham 直线，thick 为方块边长（像素风不抗锯齿） */
export function line(g, x0, y0, x1, y1, color, thick = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  const o = Math.floor((thick - 1) / 2);
  for (;;) {
    R(g, x0 - o, y0 - o, thick, thick, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/* 像素椭圆（实心），用于影子和水波 */
export function ellipse(g, cx, cy, rx, ry, color) {
  g.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const t = y / ry;
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

/* 关键帧：keys = [[time, {x,y}], ...]，时间 0~1，平滑插值 */
export function sampleKeys(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      const u = smooth((t - t0) / (t1 - t0 || 1));
      return { x: lerp(v0.x, v1.x, u), y: lerp(v0.y, v1.y, u) };
    }
  }
  return keys[keys.length - 1][1];
}

/* 小工具：确定性随机数，给背景装饰用 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
