/* js/npc/ui.js —— 由 index.html 拆分，原行 7954–7974 */
'use strict';

/* --- DOM（对话面板复用 .panel 样式） --- */
const npcEl      = document.getElementById('npc');
const npcMask    = document.getElementById('npcMask');
const npcIcon    = document.getElementById('npcIcon');
const npcName    = document.getElementById('npcName');
const npcTierEl  = document.getElementById('npcTier');
const npcAffEl   = document.getElementById('npcAff');
const npcBdayEl  = document.getElementById('npcBirthday');
const npcStatEl  = document.getElementById('npcStatus');      /* 第 25 轮：状态提示行 */
const npcBarFill = document.getElementById('npcBarFill');
const npcTextEl  = document.getElementById('npcText');
const npcNextBtn = document.getElementById('npcNext');
const npcGiftBtn = document.getElementById('npcGift');
const npcRomanceBtn = document.getElementById('npcRomance');
const npcByeBtn  = document.getElementById('npcBye');
const npcFootEl  = document.getElementById('npcFoot');
window.npcOpen = false;              /* 对话是否打开（打开时世界时间冻结） */
window.packMode = 'normal';          /* 背包模式：normal 正常 / gift 送礼选择 */
window.giftTarget = null;            /* 送礼模式的目标 NPC id */
const npcDlg = {id:null, lines:[], idx:0, shown:0, typing:false};
window.npcLastText = '';             /* 打字机：上一次写进 DOM 的文本（避免每帧重写） */



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcEl, npcMask, npcIcon, npcName, npcTierEl, npcAffEl, npcBdayEl, npcStatEl, npcBarFill, npcTextEl, npcNextBtn, npcGiftBtn, npcRomanceBtn, npcByeBtn, npcFootEl, npcDlg });
export { npcEl, npcMask, npcIcon, npcName, npcTierEl, npcAffEl, npcBdayEl, npcStatEl, npcBarFill, npcTextEl, npcNextBtn, npcGiftBtn, npcRomanceBtn, npcByeBtn, npcFootEl, npcDlg };
