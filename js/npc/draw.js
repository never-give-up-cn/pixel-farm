/* js/npc/draw.js —— 由 index.html 拆分，原行 9050–9100 */
'use strict';

import { NPC_MAP as ANIM_NPC_MAP, drawNpcWalk, drawNpcPortrait } from '../anim/npcs.js';

/* --- 画 NPC（anim 立绘 + 名字 + 靠近时的 E 提示） --- */
function drawNpc(g, d, px, py){
  const rt = npcRuntime[d.id];
  const ox = Math.round(px - cam.x - 8);
  let oy = Math.round(py - cam.y - 12);     /* 身体顶端（和玩家同一套脚点约定） */
  /* 第 27 轮：走着的时候上下轻轻浮动 */
  if(rt && rt.moving) oy += Math.round(Math.sin(rt.animT * 15) * 1.5);
  const oldFont = g.font, oldAlign = g.textAlign, oldBase = g.textBaseline;

  const sprite = d.sprite ? ANIM_NPC_MAP[d.sprite] : null;
  if(sprite){
    const frame = (rt && rt.moving) ? Math.floor((rt.animT || 0) * 6) % 4 : 0;
    g.save();
    g.imageSmoothingEnabled = false;
    g.translate(Math.round(px - cam.x - 12), Math.round(py - cam.y - 18));
    drawNpcWalk(g, sprite, rt ? (rt.dir | 0) : 0, frame);
    g.restore();
  }else{
    /* 影子 */
    g.fillStyle = CONFIG.COLORS.shadow;
    g.fillRect(ox + 2, oy + 22, 12, 2);
    /* 身体 */
    g.fillStyle = d.color;
    g.fillRect(ox + 3, oy + 12, 10, 12);
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(ox + 3, oy + 12, 10, 3);
    /* 头（emoji 兜底） */
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '16px ' + FONT_EMOJI;
    g.fillText(d.icon, ox + 8, oy + 12);
  }
  /* 名字 */
  g.font = '11px ' + FONT_CJK;
  const nw = g.measureText(d.name).width;
  g.fillStyle = 'rgba(8,10,16,.72)';
  g.fillRect(ox + 8 - nw/2 - 3, oy + 25, nw + 6, 13);
  g.fillStyle = '#ffe9b0';
  g.fillText(d.name, ox + 8, oy + 35);
  /* 靠近了 → 头顶冒一个 E */
  const near = npcNear();
  if(near === d){
    g.fillStyle = 'rgba(8,10,16,.85)';
    g.fillRect(ox + 2, oy - 15, 12, 13);
    g.strokeStyle = CONFIG.COLORS.hudAccent;
    g.strokeRect(ox + 2.5, oy - 14.5, 11, 12);
    g.fillStyle = CONFIG.COLORS.hudAccent;
    g.font = '11px ' + FONT_CJK;
    g.fillText('E', ox + 8, oy - 5);
  }
  /* 第 27 轮：睡着了 → 冒两个 Z（用游戏自己的计时器 → 暂停时也一起停住） */
  const st = npcCurrentState(d);
  if(st && st.type === 'sleep' && rt && !rt.moving){
    const bob = Math.sin(animTime * 6) * 2;
    g.textAlign = 'left';
    g.font = '12px ' + FONT_CJK;
    g.fillStyle = '#8fa3bd';
    g.fillText('Z', ox + 15, oy - 2 + bob);
    g.fillText('z', ox + 21, oy - 9 - bob);
  }
  g.font = oldFont; g.textAlign = oldAlign; g.textBaseline = oldBase;
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { drawNpc });
export { drawNpc };
