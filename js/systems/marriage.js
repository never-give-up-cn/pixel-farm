/* js/systems/marriage.js —— 恋爱 / 求婚 / 婚礼 / 配偶入住。
 * 规则：好感 80 + 花束 → 交往；交往 + 好感 100 + 美人鱼吊坠 → 求婚；
 * 求婚 3 天后举行婚礼，配偶住进农舍，每天可以亲吻回体力。 */

'use strict';

import { NPC_MAP } from '../anim/npcs.js';

const DATING_AFF = 80;
const WEDDING_AFF = 100;
const WEDDING_DAYS = 3;
const KISS_STAMINA = 20;

const marriageState = {
  dating: [],       /* 正在交往的候选人 id */
  engaged: '',      /* 已求婚对象 */
  weddingDay: 0,    /* 婚礼日期（clock.day） */
  married: '',      /* 配偶 id */
  kissedDay: 0      /* 最后一次亲吻的日期 */
};
window.marriageState = marriageState;

function marriageCandidate(id){
  const anim = NPC_MAP[id];
  return !!(anim && anim.marry);
}
function marriageHasItem(id){ return typeof countItem === 'function' && countItem(id) > 0; }
function marriageDating(id){ return marriageState.dating.indexOf(id) >= 0; }
function marriageSpouseId(){ return marriageState.married || ''; }
function marriageSpousePos(){ return { x: 11.5 * 32, y: 7.2 * 32 }; }

/* 商店是否应该显示花束 / 吊坠 */
function marriageShopAvailable(id){
  if (marriageState.married || marriageState.engaged) return false;
  if (id === 'bouquet') {
    return CONFIG.NPC.LIST.some(d => marriageCandidate(d.id) && !marriageDating(d.id) && npcAff(d.id) >= DATING_AFF);
  }
  if (id === 'pendant') {
    return marriageState.dating.some(cid => npcAff(cid) >= WEDDING_AFF);
  }
  return true;
}

/* 对话面板上的恋爱按钮信息：null = 不显示 */
function marriageActionInfo(id){
  if (!marriageCandidate(id)) return null;
  if (marriageState.married && marriageState.married !== id) return null;
  if (marriageState.engaged && marriageState.engaged !== id) return null;
  const aff = npcAff(id);
  if (marriageState.married === id) {
    const kissed = marriageState.kissedDay === clock.day;
    return { kind:'kiss', label: kissed ? '💕 今天已经亲过了' : '💕 亲吻（+体力）', ok: !kissed };
  }
  if (marriageState.engaged === id) {
    const days = Math.max(1, marriageState.weddingDay - clock.day);
    return { kind:'wedding', label:'💒 婚礼还有 ' + days + ' 天', ok:false };
  }
  if (marriageDating(id)) {
    if (aff < WEDDING_AFF) return { kind:'propose', label:'💍 好感 ' + aff + '/' + WEDDING_AFF + ' 后可求婚', ok:false };
    if (!marriageHasItem('pendant')) return { kind:'propose', label:'💍 需要美人鱼吊坠', ok:false };
    return { kind:'propose', label:'💍 求婚', ok:true };
  }
  if (aff < DATING_AFF) return null;
  if (!marriageHasItem('bouquet')) return { kind:'date', label:'💐 需要花束才能交往', ok:false };
  return { kind:'date', label:'💐 送花束 · 开始交往', ok:true };
}

function marriageDialogLine(id){
  if (marriageState.married === id) {
    return marriageState.kissedDay === clock.day
      ? '今天也很努力呢，晚上我等你回来。'
      : '回来啦？过来让我抱一下。';
  }
  if (marriageState.engaged === id) return '婚礼的事我都准备好了，就等那天了。';
  if (marriageDating(id)) return '和你在一起的时间总是过得很快。';
  return '';
}

function marriageSay(text){
  if (typeof npcDlg !== 'undefined' && window.npcOpen && npcDlg) {
    npcDlg.lines.unshift(text);
    npcDlg.idx = 0;
    npcDlg.shown = 0;
    npcDlg.typing = true;
    if (typeof renderNpcDialog === 'function') renderNpcDialog();
  } else if (typeof toast === 'function') {
    toast(text);
  }
}

function marriageAction(id){
  const info = marriageActionInfo(id);
  if (!info) return false;
  const d = npcDef(id);
  const name = d ? d.name : '对方';
  if (!info.ok) {
    if (info.kind === 'wedding') marriageSay(info.label);
    else if (typeof toast === 'function') toast(info.label);
    return false;
  }

  if (info.kind === 'date') {
    if (!removeItem('bouquet', 1)) { toast('背包里没有花束'); return false; }
    if (!marriageDating(id)) marriageState.dating.push(id);
    toast('💐 ' + name + '收下了花束，你们开始交往了！');
    marriageSay('这束花……谢谢。那我们从今天开始，就是恋人了吧？');
    playSfx(880, 'triangle', 0.16, CONFIG.AUDIO.VOLUME);
    return true;
  }

  if (info.kind === 'propose') {
    if (!removeItem('pendant', 1)) { toast('背包里没有美人鱼吊坠'); return false; }
    marriageState.engaged = id;
    marriageState.weddingDay = clock.day + WEDDING_DAYS;
    toast('💍 ' + name + '答应了求婚！' + WEDDING_DAYS + ' 天后举行婚礼');
    marriageSay('我愿意。' + WEDDING_DAYS + ' 天后，我们在农场举行婚礼吧。');
    playSfx(1046, 'triangle', 0.2, CONFIG.AUDIO.VOLUME);
    return true;
  }

  if (info.kind === 'kiss') {
    marriageState.kissedDay = clock.day;
    if (typeof stamina !== 'undefined' && typeof staminaMax !== 'undefined') {
      stamina = Math.min(staminaMax, stamina + KISS_STAMINA);
    }
    toast('💕 你和' + name + '拥抱了一下（体力 +' + KISS_STAMINA + '）');
    marriageSay('嗯……今天也要加油哦。');
    playSfx(784, 'sine', 0.12, CONFIG.AUDIO.VOLUME);
    return true;
  }
  return false;
}

/* 每天早上：婚礼到期 → 配偶入住 */
function marriageDayStart(){
  if (!marriageState.engaged) return;
  if (clock.day < marriageState.weddingDay) return;
  const id = marriageState.engaged;
  const d = npcDef(id);
  marriageState.married = id;
  marriageState.engaged = '';
  marriageState.weddingDay = 0;
  marriageState.kissedDay = 0;
  const name = d ? d.name : '伴侣';
  if (typeof toast === 'function') toast('💒 你和' + name + '举行了婚礼！' + name + '搬进了农舍。');
  if (typeof playSfx === 'function') playSfx(1319, 'triangle', 0.24, 0.6);
}

/* 农舍里和配偶说话 */
function spouseInteract(){
  const id = marriageSpouseId();
  if (!id) return false;
  const d = npcDef(id);
  if (!d) return false;
  if (typeof npcOpenDialog === 'function') return npcOpenDialog(d);
  return false;
}

/* ---------- 存档 ---------- */
function marriageSerialize(){
  return {
    d: marriageState.dating.slice(),
    e: marriageState.engaged || '',
    w: marriageState.weddingDay | 0,
    m: marriageState.married || '',
    k: marriageState.kissedDay | 0
  };
}
function marriageDeserialize(v){
  marriageReset();
  if (!v || typeof v !== 'object') return;
  const list = Array.isArray(v.d) ? v.d : [];
  for (const id of list) {
    if (marriageCandidate(id) && marriageState.dating.indexOf(id) < 0) marriageState.dating.push(id);
  }
  if (marriageCandidate(v.e)) marriageState.engaged = v.e;
  if (typeof v.w === 'number') marriageState.weddingDay = Math.max(0, v.w | 0);
  if (marriageCandidate(v.m)) marriageState.married = v.m;
  if (typeof v.k === 'number') marriageState.kissedDay = Math.max(0, v.k | 0);
}
function marriageReset(){
  marriageState.dating = [];
  marriageState.engaged = '';
  marriageState.weddingDay = 0;
  marriageState.married = '';
  marriageState.kissedDay = 0;
}

Object.assign(window, {
  marriageState, marriageCandidate, marriageDating, marriageShopAvailable,
  marriageActionInfo, marriageDialogLine, marriageAction, marriageDayStart,
  marriageSpouseId, marriageSpousePos, spouseInteract,
  marriageSerialize, marriageDeserialize, marriageReset
});
export {
  marriageState, marriageCandidate, marriageDating, marriageShopAvailable,
  marriageActionInfo, marriageDialogLine, marriageAction, marriageDayStart,
  marriageSpouseId, marriageSpousePos, spouseInteract,
  marriageSerialize, marriageDeserialize, marriageReset
};
