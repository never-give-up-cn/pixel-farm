/* js/player.js —— 由 index.html 拆分，原行 3565–3658 */
'use strict';

/* --- 4.玩家 --- */
/* 站立帧（正面朝下）；第 18~22 行是腿部，走路帧替换为 LEGS_* */
const SPRITE_BASE = [
  '.....hhhhhh.....','....hhhhhhhh....','...hhhhhhhhhh...',
  '...hh......hh...','...hh......hh...','...ssssssssss...',
  '...ssssssssss...','...ss.ee..ee.ss.','...ssssssssss...',
  '....ssssssss....','.....ssssss.....','....bbbbbbbb....',
  '...bbbbbbbbbb...','..bbbbbbbbbbbb..','..bbbbbbbbbbbb..',
  '..sbbbbbbbbbbs..','..sbbbbbbbbbbs..','...bbbbbbbbbb...',
  '....pppppppp....','....pp....pp....','....pp....pp....',
  '....ss....ss....','....ss....ss....','................'
];
/* 正面走路：一腿迈出 */
const LEGS_FRONT = [
  '....pppppppp....','...ppp.....pp...','...pp...........',
  '...ss...........','................'
];
/* 侧面走路：一腿在前、一腿在后 */
const LEGS_SIDE = [
  '....pppppppp....','..ppp......pp...','..pp........pp..',
  '..ss........ss..','................'
];
const SPRITE_PALETTE = {
  h:CONFIG.COLORS.hair, s:CONFIG.COLORS.skin, e:CONFIG.COLORS.eye,
  b:CONFIG.COLORS.shirt, p:CONFIG.COLORS.pants, d:CONFIG.COLORS.shoe
};
/* 朝向：0=下 1=左 2=右 3=上 */
const DIR_NAMES = ['下','左','右','上'];
function eyeRow(dir){
  const r = new Array(CONFIG.PLAYER.BODY_W).fill('.');
  for(let c=3;c<=12;c++) r[c] = 's';
  if(dir === 0){ r[6]='e'; r[7]='e'; r[10]='e'; r[11]='e'; }
  else if(dir === 1){ r[5]='e'; r[6]='e'; }
  else if(dir === 2){ r[9]='e'; r[10]='e'; }
  return r;
}
/* 程序化生成 4 方向 × 2 帧 */
function buildFrames(){
  const frames = [];
  for(let dir=0; dir<4; dir++){
    frames[dir] = [];
    for(let step=0; step<2; step++){
      const rows = SPRITE_BASE.map(r=>r.split(''));
      if(step === 1){
        const legs = (dir===1 || dir===2) ? LEGS_SIDE : LEGS_FRONT;
        for(let i=0;i<legs.length;i++) rows[18+i] = legs[i].split('');
      }
      if(dir === 3){                       /* 背面：后脑勺，无五官 */
        rows[5] = '...hhhhhhhhhh...'.split('');
        rows[6] = '...hhhhhhhhhh...'.split('');
        rows[7] = '...hhhhhhhhhh...'.split('');
        rows[8] = '...hhhhhhhhhh...'.split('');
      } else {
        rows[7] = eyeRow(dir);
      }
      frames[dir][step] = rows;
    }
  }
  return frames;
}
const FRAMES = buildFrames();

const player = {
  x: SPAWN.x*TILE + TILE/2, y: SPAWN.y*TILE + TILE/2,   /* 精灵中心（浮点） */
  vx: 0, vy: 0,                                          /* 速度 */
  dir: 0,                                                /* 朝向 0=下 1=左 2=右 3=上 */
  animT: 0, frame: 0,                                    /* 动画：帧号 + 计时 */
  moving: false,
  stepT: 0                                               /* 脚步声计时（秒） */
};
function drawPlayer(g){
  const s = CONFIG.PLAYER.BODY_W, h = CONFIG.PLAYER.BODY_H;
  const rows = FRAMES[player.dir][player.frame];
  const ox = Math.round(player.x - cam.x - s/2);
  const oy = Math.round(player.y - cam.y - h/2);
  /* 影子 */
  g.fillStyle = CONFIG.COLORS.shadow;
  g.fillRect(ox + 2, oy + h - 2, s - 4, 2);
  /* 逐行合并同色段后 fillRect */
  for(let r=0;r<h;r++){
    const row = rows[r] || [];
    let c = 0;
    while(c < s){
      const ch = row[c];
      if(!ch || ch === '.'){ c++; continue; }
      let run = 1;
      while(c + run < s && row[c+run] === ch) run++;
      g.fillStyle = SPRITE_PALETTE[ch] || CONFIG.COLORS.skin;
      g.fillRect(ox + c, oy + r, run, 1);
      c += run;
    }
  }
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { SPRITE_BASE, LEGS_FRONT, LEGS_SIDE, SPRITE_PALETTE, DIR_NAMES, FRAMES, player, eyeRow, buildFrames, drawPlayer });
export { SPRITE_BASE, LEGS_FRONT, LEGS_SIDE, SPRITE_PALETTE, DIR_NAMES, FRAMES, player, eyeRow, buildFrames, drawPlayer };
