/* 农夫身体：关节基础姿势 + 站立/睡觉的像素绘制。
 * 所有坐标都在 32×40 的精灵格内，脚底大约在 y=36。 */

import {
  PALETTE, R, line, ellipse, lerp
} from './pixel.js';

/* 视图：front / back / side。side 默认朝右，朝左由画布水平翻转实现。 */
export function basePose(view, bob = 0, lean = 0) {
  const side = view === 'side';
  const cx = 16 + lean;
  const hipY = 25 + bob;
  const shY = 18 + bob;
  const p = {
    view, bob, lean, cx,
    head: { cx: side ? cx + 1 : cx, top: 10 + bob },
    shL: side ? { x: cx - 1, y: shY } : { x: cx - 5, y: shY },
    shR: side ? { x: cx + 1, y: shY } : { x: cx + 5, y: shY },
    hipL: side ? { x: cx - 1, y: hipY } : { x: cx - 3, y: hipY },
    hipR: side ? { x: cx + 1, y: hipY } : { x: cx + 3, y: hipY },
    footL: side ? { x: cx - 4, y: 35 } : { x: cx - 3, y: 35 },
    footR: side ? { x: cx + 4, y: 35 } : { x: cx + 3, y: 35 },
    handL: side ? { x: cx - 5, y: 24 + bob } : { x: cx - 6, y: 24 + bob },
    handR: side ? { x: cx + 5, y: 24 + bob } : { x: cx + 6, y: 24 + bob },
    eyesClosed: false,
    hurt: false,
    tint: null,
    shake: 0,
    tool: null,
    effects: [],
    hold: null,
    asleep: false,
    noHat: false,
    outfit: null
  };
  return p;
}

function drawShadow(g, cx, cy, rx, ry) {
  ellipse(g, cx, cy, rx, ry, PALETTE.shadow);
}

function drawArm(g, p, key, back) {
  const sh = key === 'L' ? p.shL : p.shR;
  const hand = key === 'L' ? p.handL : p.handR;
  const o = p.outfit;
  const sleeve = o ? (back ? o.shirtShade : o.shirt) : (back ? PALETTE.shirtShade : PALETTE.shirt);
  const skin = back ? PALETTE.skinShade : PALETTE.skin;
  const mx = lerp(sh.x, hand.x, 0.55);
  const my = lerp(sh.y, hand.y, 0.55);
  line(g, sh.x, sh.y, mx, my, o && o.sleeveless ? skin : sleeve, 2);
  line(g, mx, my, hand.x, hand.y, skin, 2);
  R(g, hand.x - 1, hand.y - 1, 3, 2, skin);
  if (!back) pxHighlight(g, hand.x, hand.y);
}

function pxHighlight(g, x, y) {
  R(g, Math.round(x) - 1, Math.round(y) - 1, 1, 1, PALETTE.skinLight);
}

function drawLeg(g, p, hip, foot, back) {
  const o = p.outfit;
  if (!o) {
    const pants = back ? PALETTE.overallsShade : PALETTE.overalls;
    line(g, hip.x, hip.y, foot.x, foot.y - 2, pants, 3);
    R(g, foot.x - 2, foot.y - 2, 4, 2, PALETTE.boot);
    R(g, foot.x - 2, foot.y, 4, 1, PALETTE.bootShade);
    return;
  }

  const pants = back ? o.pantsShade : o.pants;
  const skin = back ? PALETTE.skinShade : PALETTE.skin;
  const style = o.legStyle || 'pants';
  const mx = lerp(hip.x, foot.x, 0.55);
  const my = lerp(hip.y, foot.y, 0.55);

  if (style === 'shorts') {
    line(g, hip.x, hip.y, mx, my, pants, 3);
    line(g, mx, my, foot.x, foot.y - 2, skin, 2);
  } else if (style === 'skirt' || style === 'dress') {
    line(g, hip.x, hip.y + 2, foot.x, foot.y - 2, skin, 2);
  } else if (style === 'genie') {
    line(g, hip.x, hip.y, mx, my, pants, 4);
    line(g, mx, my, foot.x, foot.y - 2, o.pantsShade, 2);
    R(g, foot.x - 2, foot.y - 4, 4, 2, o.pantsLight);
  } else if (style === 'baggy') {
    line(g, hip.x, hip.y, mx, my, pants, 4);
    line(g, mx, my, foot.x, foot.y - 2, pants, 2);
  } else {
    line(g, hip.x, hip.y, foot.x, foot.y - 2, pants, 3);
  }

  R(g, foot.x - 2, foot.y - 2, 4, 2, PALETTE.boot);
  R(g, foot.x - 2, foot.y, 4, 1, PALETTE.bootShade);
}

function outfitPattern(g, o, x, y, w, h) {
  const ptn = o.pattern;
  if (!ptn) return;
  const c2 = o.shirtShade;
  const c3 = o.shirtLight;
  if (ptn === 'stripes') {
    for (let i = 1; i < h; i += 2) R(g, x, y + i, w, 1, c2);
  } else if (ptn === 'dots') {
    for (let i = 0; i < 4; i++) R(g, x + 1 + (i * 3) % Math.max(1, w - 1), y + 1 + (i * 2) % Math.max(1, h - 1), 1, 1, c3);
  } else if (ptn === 'skull') {
    R(g, x + 3, y + 2, 4, 4, c3);
    R(g, x + 3, y + 3, 1, 1, c2);
    R(g, x + 5, y + 3, 1, 1, c2);
    R(g, x + 4, y + 5, 1, 1, c2);
  } else if (ptn === 'skeleton') {
    R(g, x + 2, y + 3, w - 3, 1, c3);
    R(g, x + 2, y + 5, w - 3, 1, c3);
    R(g, x + 4, y + 2, 1, 4, c3);
  } else if (ptn === 'heart') {
    R(g, x + 3, y + 3, 2, 1, c3);
    R(g, x + 6, y + 3, 2, 1, c3);
    R(g, x + 3, y + 4, 5, 2, c3);
    R(g, x + 4, y + 6, 3, 1, c3);
    R(g, x + 5, y + 7, 1, 1, c3);
  } else if (ptn === 'star') {
    R(g, x + 4, y + 2, 1, 5, c3);
    R(g, x + 2, y + 4, 5, 1, c3);
    R(g, x + 3, y + 3, 3, 3, c3);
  } else if (ptn === 'rainbow') {
    const cols = [o.shirt, o.shirtShade, o.shirtLight, '#e0c060', '#d04a3a'];
    for (let i = 0; i < w; i++) R(g, x + i, y + 1, 1, h - 2, cols[i % cols.length]);
  } else if (ptn === 'tie') {
    R(g, x + 4, y + 2, 2, 5, c3);
    R(g, x + 3, y + 7, 4, 1, c3);
  } else if (ptn === 'bow') {
    R(g, x + 3, y + 2, 2, 2, c3);
    R(g, x + 6, y + 2, 2, 2, c3);
    R(g, x + 5, y + 3, 1, 1, c2);
  } else if (ptn === 'slime') {
    R(g, x + 3, y + 3, 4, 3, c3);
    R(g, x + 2, y + 5, 6, 2, c3);
    R(g, x + 3, y + 3, 1, 1, c2);
    R(g, x + 6, y + 3, 1, 1, c2);
  } else if (ptn === 'muscle') {
    R(g, x + 2, y + 3, 2, 3, c3);
    R(g, x + 7, y + 3, 2, 3, c3);
    R(g, x + 5, y + 5, 1, 3, c2);
  } else if (ptn === 'fish') {
    R(g, x + 3, y + 4, 4, 2, c3);
    R(g, x + 2, y + 3, 1, 2, c3);
    R(g, x + 2, y + 5, 1, 2, c3);
    R(g, x + 7, y + 3, 2, 2, c3);
    R(g, x + 4, y + 4, 1, 1, c2);
  } else if (ptn === 'leaf') {
    R(g, x + 4, y + 3, 1, 4, c3);
    R(g, x + 5, y + 3, 2, 1, c3);
    R(g, x + 3, y + 5, 2, 1, c3);
  } else if (ptn === 'belt') {
    R(g, x, y + 7, w, 1, c2);
    R(g, x + 4, y + 7, 2, 1, c3);
  } else if (ptn === 'camo') {
    R(g, x + 1, y + 1, 3, 2, c2);
    R(g, x + 6, y + 4, 3, 2, c3);
    R(g, x + 2, y + 6, 2, 1, c2);
  }
}

function drawOutfitTorso(g, p) {
  const o = p.outfit;
  const cx = p.cx;
  const y = 17 + p.bob;
  const side = p.view === 'side';
  const x = side ? cx - 4 : cx - 5;
  const w = side ? 8 : 10;
  const style = o.torso || 'tshirt';
  const c1 = o.shirt, c2 = o.shirtShade, c3 = o.shirtLight;

  R(g, x, y, w, 3, c1);
  R(g, x + 1, y + 3, w - 2, 7, c1);
  R(g, x + 1, y + 9, w - 2, 2, c2);
  R(g, x + 2, y, w - 4, 1, c3);
  R(g, cx - 1, y + 1, 2, 2, PALETTE.skinShade);

  outfitPattern(g, o, x + 1, y + 1, w - 2, 8);

  if (style === 'overalls') {
    R(g, x + 1, y + 3, w - 2, 7, o.pants);
    R(g, x + 1, y, 2, 4, o.pants);
    R(g, x + w - 3, y, 2, 4, o.pants);
    R(g, cx - 1, y + 4, 2, 2, c1);
    R(g, cx - 2, y + 7, 4, 1, o.pantsShade);
  } else if (style === 'jacket') {
    R(g, x, y + 1, 2, 9, c2);
    R(g, x + w - 2, y + 1, 2, 9, c2);
    R(g, cx - 2, y + 2, 4, 8, c1);
    R(g, cx - 1, y + 2, 2, 1, c3);
    R(g, cx - 1, y + 5, 1, 3, c2);
  } else if (style === 'vest') {
    R(g, x + 1, y + 2, 2, 8, c2);
    R(g, x + w - 3, y + 2, 2, 8, c2);
    R(g, cx - 1, y + 4, 2, 5, c3);
  } else if (style === 'suit') {
    R(g, x + 1, y + 2, 2, 8, c2);
    R(g, x + w - 3, y + 2, 2, 8, c2);
    R(g, cx - 2, y + 2, 4, 1, c3);
    if (o.pattern !== 'tie' && o.pattern !== 'bow') {
      R(g, cx - 1, y + 3, 2, 5, c3);
    }
  } else if (style === 'tunic') {
    R(g, x + 1, y + 7, w - 2, 2, o.pantsShade);
    R(g, cx - 1, y + 7, 2, 2, o.pants);
  } else if (style === 'poncho') {
    R(g, x - 1, y + 2, w + 2, 6, c1);
    R(g, x, y + 8, w, 2, c2);
  } else if (style === 'armor') {
    R(g, x + 1, y + 2, w - 2, 6, c2);
    R(g, x + 2, y + 3, w - 4, 4, c1);
    R(g, cx - 1, y + 4, 2, 2, c3);
    R(g, x + 1, y + 8, w - 2, 2, c2);
  } else if (style === 'hoodie') {
    R(g, cx - 3, y - 1, 6, 3, c2);
    R(g, cx - 2, y, 4, 2, c1);
    R(g, cx - 2, y + 7, 4, 2, c2);
    R(g, cx - 1, y + 4, 2, 2, c3);
  } else if (style === 'flannel') {
    for (let i = 0; i < w; i += 3) R(g, x + i, y, 1, 10, c2);
    for (let i = 0; i < 8; i += 3) R(g, x, y + i, w, 1, c3);
  } else if (style === 'sailor') {
    R(g, x + 2, y, w - 4, 2, '#3a5a8a');
    R(g, cx - 1, y + 2, 2, 3, '#d04a3a');
    R(g, x + 2, y + 7, w - 4, 1, '#3a5a8a');
  } else if (style === 'apron') {
    R(g, x + 2, y + 3, w - 4, 6, c2);
    R(g, x + 3, y + 4, w - 6, 4, c1);
    R(g, x + 4, y + 1, 2, 2, c3);
  } else if (style === 'sweater') {
    R(g, x + 1, y + 8, w - 2, 2, c2);
    for (let i = 0; i < w - 2; i += 2) R(g, x + 1 + i, y + 9, 1, 1, c1);
  } else if (style === 'jersey') {
    R(g, cx - 2, y + 3, 4, 4, c2);
    R(g, cx - 1, y + 4, 2, 2, c3);
  } else if (style === 'raincoat') {
    R(g, cx - 1, y + 2, 1, 8, c2);
    for (let i = 0; i < 3; i++) R(g, cx + 1, y + 3 + i * 2, 1, 1, c3);
  } else if (style === 'toga') {
    line(g, x + 1, y + 1, x + w - 2, y + 8, c3, 1);
    R(g, x + 1, y + 7, w - 2, 2, c2);
  } else if (style === 'jester') {
    const cols = [c1, c2, c3];
    for (let i = 0; i < w; i += 2) R(g, x + i, y + 3 + (i % 4), 2, 2, cols[(i >> 1) % 3]);
  }

  if (o.legStyle === 'skirt' || o.legStyle === 'dress') {
    const sk = o.skirt || o.pants || c1;
    const long = o.legStyle === 'dress';
    R(g, x - 1, y + 9, w + 2, 2, c2);
    R(g, x - 2, y + 11, w + 4, 2, sk);
    if (long) {
      R(g, x - 3, y + 13, w + 6, 2, sk);
      R(g, x - 4, y + 15, w + 8, 2, c2);
      R(g, x - 4, y + 17, w + 8, 1, c2);
    } else {
      R(g, x - 3, y + 13, w + 6, 2, c2);
    }
  }
}

function drawTorso(g, p) {
  if (p.outfit) {
    drawOutfitTorso(g, p);
    return;
  }
  const cx = p.cx;
  const y = 17 + p.bob;
  const side = p.view === 'side';
  const x = side ? cx - 4 : cx - 5;
  const w = side ? 8 : 10;

  R(g, x, y, w, 3, PALETTE.shirt);
  R(g, x + 1, y + 3, w - 2, 7, PALETTE.overalls);
  R(g, x + 1, y, 2, 4, PALETTE.overalls);
  R(g, x + w - 3, y, 2, 4, PALETTE.overalls);
  R(g, x + 1, y + 9, w - 2, 2, PALETTE.overallsShade);
  R(g, cx - 1, y + 4, 2, 2, PALETTE.shirt);
  R(g, cx - 2, y + 6, 4, 1, PALETTE.overallsShade);

  if (p.view === 'back') {
    /* 背带裤的背带交叉 */
    line(g, x + 1, y + 1, x + w - 2, y + 4, PALETTE.overallsShade, 1);
    line(g, x + w - 2, y + 1, x + 1, y + 4, PALETTE.overallsShade, 1);
  }
}

function drawHead(g, p) {
  const { cx, top } = p.head;
  const view = p.view;
  const eye = PALETTE.eye;

  R(g, cx - 2, top + 8, 4, 3, PALETTE.skinShade);   /* 脖子 */

  if (view === 'back') {
    R(g, cx - 5, top - 1, 10, 10, PALETTE.hair);
    R(g, cx - 4, top + 2, 8, 4, PALETTE.hairLight);
    R(g, cx - 5, top + 7, 10, 2, PALETTE.hair);
  } else if (view === 'side') {
    R(g, cx - 4, top + 1, 8, 9, PALETTE.skin);
    R(g, cx + 4, top + 4, 2, 4, PALETTE.skin);
    R(g, cx + 4, top + 7, 2, 1, PALETTE.skinShade);
    R(g, cx - 5, top - 1, 10, 3, PALETTE.hair);
    R(g, cx - 5, top + 1, 3, 7, PALETTE.hair);
    R(g, cx - 3, top + 1, 2, 5, PALETTE.hair);

    if (p.hurt) {
      line(g, cx + 1, top + 4, cx + 3, top + 6, eye, 1);
      line(g, cx + 3, top + 4, cx + 1, top + 6, eye, 1);
    } else if (p.eyesClosed) {
      R(g, cx + 1, top + 5, 2, 1, eye);
    } else {
      R(g, cx + 1, top + 4, 2, 2, eye);
    }
    R(g, cx + 3, top + 7, 2, 1, PALETTE.skinShade);
  } else {
    R(g, cx - 4, top + 1, 8, 9, PALETTE.skin);
    R(g, cx - 5, top - 1, 10, 3, PALETTE.hair);
    R(g, cx - 5, top + 1, 2, 4, PALETTE.hair);
    R(g, cx + 3, top + 1, 2, 4, PALETTE.hair);

    if (p.hurt) {
      line(g, cx - 4, top + 4, cx - 2, top + 6, eye, 1);
      line(g, cx - 2, top + 4, cx - 4, top + 6, eye, 1);
      line(g, cx + 1, top + 4, cx + 3, top + 6, eye, 1);
      line(g, cx + 3, top + 4, cx + 1, top + 6, eye, 1);
    } else if (p.eyesClosed) {
      R(g, cx - 4, top + 5, 2, 1, eye);
      R(g, cx + 1, top + 5, 2, 1, eye);
    } else {
      R(g, cx - 4, top + 4, 2, 2, eye);
      R(g, cx + 1, top + 4, 2, 2, eye);
    }
    R(g, cx - 1, top + 7, 2, 1, PALETTE.skinShade);
    /* 下巴阴影，避免头和肩膀糊成一块 */
    R(g, cx - 3, top + 9, 6, 1, PALETTE.skinShade);
  }

  /* 草帽（noHat 时留给外部帽子覆盖） */
  if (!p.noHat) {
    R(g, cx - 9, top - 3, 18, 2, PALETTE.hat);
    R(g, cx - 8, top - 4, 16, 1, PALETTE.hatShade);
    R(g, cx - 5, top - 8, 10, 5, PALETTE.hat);
    R(g, cx - 5, top - 4, 10, 2, PALETTE.hatBand);
    R(g, cx - 4, top - 8, 6, 1, PALETTE.hatLight);
  }
}

export function drawStanding(g, p) {
  drawShadow(g, 16, 37, 8, 2);

  if (p.view === 'side') {
    drawArm(g, p, 'L', true);
    drawLeg(g, p, p.hipL, p.footL, true);
    drawLeg(g, p, p.hipR, p.footR, false);
  } else {
    drawArm(g, p, 'L', true);
    drawLeg(g, p, p.hipL, p.footL, false);
    drawLeg(g, p, p.hipR, p.footR, false);
  }

  drawTorso(g, p);
  drawHead(g, p);

  if (p.hold === 'crop') drawHeldCrop(g, p.handR);

  drawArm(g, p, 'R', false);
}

export function drawHeldCrop(g, hand) {
  R(g, hand.x - 1, hand.y - 1, 3, 3, PALETTE.crop);
  R(g, hand.x - 1, hand.y - 4, 2, 3, PALETTE.leaf);
  R(g, hand.x - 3, hand.y - 5, 2, 2, PALETTE.leaf);
  R(g, hand.x + 1, hand.y - 5, 2, 2, PALETTE.leafShade);
}

function drawZ(g, x, y, alpha) {
  g.globalAlpha = alpha;
  line(g, x, y, x + 3, y, PALETTE.white, 1);
  line(g, x + 3, y, x, y + 3, PALETTE.white, 1);
  line(g, x, y + 3, x + 3, y + 3, PALETTE.white, 1);
  g.globalAlpha = 1;
}

/* 睡觉：横躺 + 被子 + 草帽 + Zzz，忽略朝向 */
export function drawSleeping(g, phase) {
  ellipse(g, 16, 36, 12, 3, PALETTE.shadow);

  /* 枕头 */
  R(g, 20, 29, 10, 4, PALETTE.shirtShade);
  R(g, 20, 29, 10, 1, PALETTE.shirt);

  /* 被子 */
  R(g, 3, 28, 19, 7, PALETTE.overalls);
  R(g, 3, 28, 19, 2, PALETTE.overallsShade);
  R(g, 4, 33, 17, 1, PALETTE.overallsShade);
  R(g, 3, 27, 19, 1, '#4d7fc7');

  /* 露出的衬衫 */
  R(g, 19, 26, 6, 4, PALETTE.shirt);
  R(g, 19, 30, 6, 1, PALETTE.shirtShade);

  /* 头 */
  R(g, 24, 23, 6, 6, PALETTE.skin);
  R(g, 23, 22, 7, 2, PALETTE.hair);
  R(g, 23, 23, 1, 5, PALETTE.hair);
  R(g, 29, 25, 2, 3, PALETTE.skinShade);
  R(g, 27, 26, 2, 1, PALETTE.eye);
  R(g, 24, 28, 1, 1, PALETTE.skinShade);

  /* 草帽搁在头上 */
  R(g, 21, 20, 11, 2, PALETTE.hat);
  R(g, 21, 21, 11, 1, PALETTE.hatShade);
  R(g, 23, 15, 7, 5, PALETTE.hat);
  R(g, 23, 19, 7, 1, PALETTE.hatBand);
  R(g, 24, 15, 4, 1, PALETTE.hatLight);

  const a = 0.45 + 0.55 * Math.abs(Math.sin(phase * Math.PI * 2));
  drawZ(g, 19, 13, a);
  drawZ(g, 25, 7, a * 0.8);
  drawZ(g, 19, 2, a * 0.6);
}
