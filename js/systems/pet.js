/* js/systems/pet.js — 农场宠物：15 种 anim 宠物，可在院子里走动、抚摸。
 * 用「宠物碗」建筑切换品种；每天可以摸一次。
 */

'use strict';

import {
  PETS, PET_MAP, PET_W, drawPet as drawAnimPet
} from '../anim/pets.js';

const PET_BASE = 28;

const WANDER_SPEED = 20;
const HOME_RADIUS = 5;          /* 离农舍最多 5 格 */

let pet = null;

function petHome() {
  if (typeof HOUSE_POS !== 'undefined' && HOUSE_POS) {
    return {
      x: (HOUSE_POS.x + HOUSE_POS.w / 2) * TILE,
      y: (HOUSE_POS.y + HOUSE_POS.h + 1) * TILE
    };
  }
  return { x: player.x, y: player.y };
}

function makePet(type, x, y) {
  return {
    type, x, y,
    dir: 2, vx: 0, vy: 0,
    t: 0, wait: 1 + Math.random() * 2,
    hearts: 0,
    pettedDay: -1
  };
}

/** 没有存宠物时，新游戏自动领养第一只（橘猫）。 */
function ensurePet() {
  if (pet) return pet;
  const home = petHome();
  pet = makePet(PETS[0].id, home.x + TILE, home.y + TILE);
  return pet;
}

function petResetState() {
  pet = null;
}

function petTypeName(id) {
  const d = PET_MAP[id];
  return d ? d.name : id;
}

function updatePet(dt) {
  const p = ensurePet();
  p.t += dt;

  /* 夜里在院子里待着不动 */
  if (typeof skyHour === 'function' && (skyHour() >= 20 || skyHour() < 6)) {
    p.vx = p.vy = 0;
    return;
  }

  p.wait -= dt;
  if (p.wait <= 0) {
    if (Math.random() < 0.45) {
      p.vx = p.vy = 0;
      p.wait = 1.2 + Math.random() * 2.2;
    } else {
      const a = Math.random() * Math.PI * 2;
      p.vx = Math.cos(a) * WANDER_SPEED;
      p.vy = Math.sin(a) * WANDER_SPEED * 0.65;
      p.wait = 0.8 + Math.random() * 1.6;
    }
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  const home = petHome();
  const dx = p.x - home.x, dy = p.y - home.y;
  const dist = Math.hypot(dx, dy);
  if (dist > HOME_RADIUS * TILE) {
    p.x = home.x + dx / dist * HOME_RADIUS * TILE;
    p.y = home.y + dy / dist * HOME_RADIUS * TILE;
    p.vx = p.vy = 0;
    p.wait = 1 + Math.random() * 2;
  }

  if (p.vx < 0) p.dir = 1;
  else if (p.vx > 0) p.dir = 2;
}

function petNear() {
  if (!pet) return null;
  if (typeof player === 'undefined') return null;
  const d = Math.hypot(player.x - pet.x, player.y - pet.y);
  return d <= (CONFIG.NPC.RANGE + 0.6) * TILE ? pet : null;
}

function petInteract() {
  const p = ensurePet();
  if (p.pettedDay === clock.day) {
    toast(petTypeName(p.type) + '今天已经摸过了，它正懒洋洋地趴着');
    return true;
  }
  p.pettedDay = clock.day;
  p.hearts = Math.min(10, (p.hearts | 0) + 1);
  toast('摸了摸' + petTypeName(p.type) + '，它很开心 ❤ ' + p.hearts + '/10');
  playSfx(1046, 'triangle', 0.1, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

/* ---------- 宠物碗：切换品种 ---------- */

function petBowlNear() {
  if (typeof buildings === 'undefined') return null;
  if (typeof player === 'undefined') return null;
  let best = null, bd = Infinity;
  for (const b of buildings) {
    if (b.type !== 'pet_bowl') continue;
    const cx = (b.tx + 0.5) * TILE, cy = (b.ty + 0.5) * TILE;
    const d = Math.hypot(player.x - cx, player.y - cy);
    if (d <= 2 * TILE && d < bd) { bd = d; best = b; }
  }
  return best;
}

function petCycle() {
  const p = ensurePet();
  const idx = PETS.findIndex(x => x.id === p.type);
  const next = PETS[(idx + 1) % PETS.length];
  p.type = next.id;
  toast('宠物碗：换成了' + next.name);
  playSfx(784, 'triangle', 0.1, CONFIG.AUDIO.VOLUME * 0.8);
  return true;
}

/* ---------- 绘制 ---------- */

function drawPetEntity(g) {
  const p = ensurePet();
  const px = p.x - cam.x;
  const py = p.y - cam.y;
  if (px < -TILE || px > VIEW_W + TILE || py < -TILE || py > VIEW_H + TILE) return;

  const walking = !!(p.vx || p.vy);
  const action = walking ? 'walk' : 'idle';
  const def = PET_MAP[p.type];

  g.fillStyle = 'rgba(0,0,0,.20)';
  g.fillRect(Math.round(px - 9), Math.round(py - 2), 18, 3);

  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(Math.round(px - PET_W / 2), Math.round(py - PET_BASE));
  drawAnimPet(g, def, action, p.dir || 2, (p.t * (walking ? 2.4 : 0.8)) % 1);
  g.restore();
}

/* ---------- 存档 ---------- */

function petSerialize() {
  if (!pet) return null;
  return {
    t: pet.type,
    x: Math.round(pet.x), y: Math.round(pet.y),
    d: pet.dir | 0, h: pet.hearts | 0, p: pet.pettedDay | 0
  };
}

function petDeserialize(o) {
  pet = null;
  if (!o || typeof o !== 'object' || !PET_MAP[o.t]) return;
  pet = makePet(o.t, Number(o.x) || 0, Number(o.y) || 0);
  pet.dir = o.d === 1 ? 1 : 2;
  pet.hearts = Math.max(0, Math.min(10, o.h | 0));
  pet.pettedDay = typeof o.p === 'number' ? o.p : -1;
}

Object.assign(window, {
  petResetState, ensurePet, updatePet, petNear, petInteract,
  petBowlNear, petCycle, drawPetEntity, petSerialize, petDeserialize, petTypeName
});
export {
  petResetState, ensurePet, updatePet, petNear, petInteract,
  petBowlNear, petCycle, drawPetEntity, petSerialize, petDeserialize, petTypeName
};
