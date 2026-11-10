/* js/systems/room.js — 房间装修：墙纸 / 地板 / 室内家具 / 室内灶台。 */

'use strict';

const roomState = {
  wall: null,
  floor: null,
  furn: [],                       /* [{id, tx, ty}] 室内家具 */
  stove: { type: 'stove', tx: -1, ty: -1, job: null, out: [] }
};

window.roomStove = roomState.stove;

function roomPlannerNear() {
  if (typeof buildings === 'undefined' || typeof player === 'undefined') return null;
  let best = null, bd = Infinity;
  for (const b of buildings) {
    if (b.type !== 'room_planner') continue;
    const cx = (b.tx + 0.5) * TILE, cy = (b.ty + 0.5) * TILE;
    const d = Math.hypot(player.x - cx, player.y - cy);
    if (d <= 2 * TILE && d < bd) { bd = d; best = b; }
  }
  return best;
}

function setRoomWall(id) { roomState.wall = id; }
function setRoomFloor(id) { roomState.floor = id; }

function roomFurnitureAt(tx, ty) {
  return roomState.furn.find(f => f.tx === tx && f.ty === ty) || null;
}

function roomPlaceFurniture(id, tx, ty) {
  if (!id || roomFurnitureAt(tx, ty)) return false;
  roomState.furn.push({ id, tx, ty });
  return true;
}

function roomRemoveFurniture(tx, ty) {
  const f = roomFurnitureAt(tx, ty);
  if (!f) return false;
  roomState.furn = roomState.furn.filter(x => x !== f);
  return f.id;
}

function roomSerialize() {
  return {
    w: roomState.wall,
    f: roomState.floor,
    furn: roomState.furn.map(x => ({ id: x.id, x: x.tx, y: x.ty })),
    stove: {
      j: roomState.stove.job ? { r: roomState.stove.job.rid, t: Math.max(0, Math.round(roomState.stove.job.left)) } : null,
      o: (roomState.stove.out || []).map(s => ({ id: s.id, n: s.n }))
    }
  };
}

function roomDeserialize(o) {
  roomState.wall = o && o.w ? o.w : null;
  roomState.floor = o && o.f ? o.f : null;
  roomState.furn = [];
  if (o && Array.isArray(o.furn)) {
    for (const f of o.furn) {
      if (f && CONFIG.ITEMS[f.id] && Number.isFinite(f.x) && Number.isFinite(f.y)) {
        roomState.furn.push({ id: f.id, tx: f.x | 0, ty: f.y | 0 });
      }
    }
  }
  const st = roomState.stove;
  st.job = null;
  st.out = [];
  if (o && o.stove && typeof o.stove === 'object') {
    if (o.stove.j && typeof recipeDef === 'function') {
      const rd = recipeDef(o.stove.j.r);
      if (rd) st.job = { rid: rd.id, left: Math.max(0, Number(o.stove.j.t) || 0), total: rd.hours * 60 };
    }
    if (Array.isArray(o.stove.o)) {
      for (const s of o.stove.o) {
        if (!s || !CONFIG.ITEMS[s.id]) continue;
        const n = s.n | 0;
        if (n > 0) st.out.push({ id: s.id, n });
      }
    }
  }
}

function roomResetState() {
  roomState.wall = null;
  roomState.floor = null;
  roomState.furn = [];
  roomState.stove.job = null;
  roomState.stove.out = [];
}

Object.assign(window, {
  roomState, roomPlannerNear, setRoomWall, setRoomFloor,
  roomFurnitureAt, roomPlaceFurniture, roomRemoveFurniture,
  roomSerialize, roomDeserialize, roomResetState
});
export {
  roomState, roomPlannerNear, setRoomWall, setRoomFloor,
  roomFurnitureAt, roomPlaceFurniture, roomRemoveFurniture,
  roomSerialize, roomDeserialize, roomResetState
};
