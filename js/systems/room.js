/* js/systems/room.js — 房间装修：墙纸 / 地板选择。
 * 通过「装修样板」建筑打开面板，选择结果存档。
 */

'use strict';

const roomState = { wall: null, floor: null };

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

function roomSerialize() { return { w: roomState.wall, f: roomState.floor }; }
function roomDeserialize(o) {
  roomState.wall = o && o.w ? o.w : null;
  roomState.floor = o && o.f ? o.f : null;
}
function roomResetState() { roomState.wall = null; roomState.floor = null; }

Object.assign(window, {
  roomState, roomPlannerNear, setRoomWall, setRoomFloor,
  roomSerialize, roomDeserialize, roomResetState
});
export {
  roomState, roomPlannerNear, setRoomWall, setRoomFloor,
  roomSerialize, roomDeserialize, roomResetState
};
