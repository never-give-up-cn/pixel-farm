/* js/npc/dialog.js —— 由 index.html 拆分，原行 8582–8716 */
'use strict';

import { NPC_MAP as ANIM_NPC_MAP, drawNpcPortrait } from '../anim/npcs.js';
import { SPECIAL_MAP as ANIM_SPECIAL_MAP, drawSpecialPortrait } from '../anim/special-npcs.js';

/* --- 对话 --- */
/* 按当前好感档位随机挑 2~3 句（不重复） */
function npcPickLines(d){
  const tier = npcTierOf(npcAff(d.id));
  const pool = (d.lines && d.lines[tier.key]) || (d.lines && d.lines.stranger) || ['……'];
  const n = Math.min(pool.length, 2 + ((Math.random()*2) | 0));
  const out = [], used = [];
  for(let i=0;i<n;i++){
    let k = (Math.random()*pool.length) | 0, guard = 0;
    while(used.indexOf(k) >= 0 && guard++ < 8) k = (Math.random()*pool.length) | 0;
    used.push(k);
    out.push(pool[k]);
  }
  return festivalDialogLines(d, out);    /* 第 17 轮：冬夜灯会特殊台词 */
}
function npcOpenDialog(d){
  if(!d || npcOpen) return false;
  /* 第 25 轮：睡着的叫不醒（站在他床边按 E 只会吃闭门羹） */
  if(npcAsleepHere(d)){ toast(d.name + '睡得正香，别吵醒他'); return false; }
  /* 上次跨档时背包满了、福利没发出去的，再见面时补发（尤其是邻家女孩的稀有种子） */
  npcSyncUnlocks();
  npcDlg.id = d.id;
  let lines = npcPickLines(d);
  if (typeof marriageDialogLine === 'function') {
    const ml = marriageDialogLine(d.id);
    if (ml) lines.unshift(ml);
  }
  /* 第 23 轮：来访居民 → 评农场、发金币和种子（一天只发一次） */
  const vis = visitReward(d);
  if(vis){
    const s = vis.score;
    let txt = '来看看你的农场！' + s.plots + ' 块耕地、' + s.builds + ' 座建筑、' + s.decor +
              ' 份装饰，评分 ' + s.score + ' 分 —— 给你 ' + vis.gold + ' 金币！';
    if(vis.seed) txt += ' 再捎上' + vis.seed.name + '。';
    lines.unshift(txt);
  }
  npcDlg.lines = lines;
  npcDlg.idx = 0; npcDlg.shown = 0; npcDlg.typing = true;
  npcOpen = true;
  npcLastText = '';
  renderNpcDialog();
  setPanelOpen(npcEl, true);
  playSfx(560, 'triangle', 0.10, CONFIG.AUDIO.VOLUME);
  questEmit('talk', {id:d.id, n:1});      /* 第 16 轮：委托总线（对话） */
  return true;
}
function npcCloseDialog(){
  if(!npcOpen) return false;
  npcOpen = false;
  npcDlg.id = null; npcDlg.lines = []; npcDlg.typing = false;
  if(packMode === 'gift'){ packMode = 'normal'; giftTarget = null; }
  if(packEl) packEl.classList.remove('gift');
  setPanelOpen(npcEl, false);
  return true;
}
/* E / 空格：没打完 → 整句显示；打完了 → 下一句；说完了 → 结束对话 */
function npcAdvance(){
  if(!npcOpen) return false;
  const t = npcDlg.lines[npcDlg.idx] || '';
  if(npcDlg.typing){
    npcDlg.shown = t.length; npcDlg.typing = false;
    renderNpcDialog();
    return true;
  }
  if(npcDlg.idx < npcDlg.lines.length - 1){
    npcDlg.idx++; npcDlg.shown = 0; npcDlg.typing = true;
    renderNpcDialog();
    return true;
  }
  npcCloseDialog();                 /* 说完了再按 E → 结束对话 */
  return true;
}
/* 打字机推进（UI 动画：对话打开时世界时间冻结，但字还在一个个蹦出来） */
function updateNpcDialog(dt){
  if(!npcOpen || !npcDlg.typing) return;
  const t = npcDlg.lines[npcDlg.idx] || '';
  npcDlg.shown += dt * 1000 / Math.max(1, CONFIG.NPC.TYPE_MS);
  if(npcDlg.shown >= t.length){
    npcDlg.shown = t.length;
    npcDlg.typing = false;
    renderNpcDialog();
  }else{
    npcUpdateText();
  }
}
/* 只更新正文（打字过程中每帧调用，避免整块 DOM 重刷） */
function npcUpdateText(){
  if(!npcTextEl) return;
  const t = npcDlg.lines[npcDlg.idx] || '';
  const s = npcDlg.typing ? t.slice(0, Math.floor(npcDlg.shown)) : t;
  if(s !== npcLastText){ npcTextEl.textContent = s; npcLastText = s; }
}
/* 刷新整个对话面板 */
function renderNpcDialog(){
  const d = npcDef(npcDlg.id);
  if(!d) return;
  const aff = npcAff(d.id);
  const tier = npcTierOf(aff);
  if(npcIcon){
  npcIcon.textContent = '';
  const portrait = d.sprite ? (d.special ? ANIM_SPECIAL_MAP[d.sprite] : ANIM_NPC_MAP[d.sprite]) : null;
  if(portrait){
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    cv.style.width = '48px'; cv.style.height = '48px';
    cv.style.imageRendering = 'pixelated';
    if(d.special) drawSpecialPortrait(cv.getContext('2d'), portrait);
    else drawNpcPortrait(cv.getContext('2d'), portrait);
    npcIcon.appendChild(cv);
  }else{
    npcIcon.textContent = d.icon;
  }
}
  if(npcName)   npcName.textContent   = d.name + (d.job ? ' · ' + d.job : '');
  let tierName = tier.name;
  if(typeof marriageState !== 'undefined'){
    if(marriageState.married === d.id) tierName = '配偶';
    else if(marriageState.engaged === d.id) tierName = '未婚伴侣';
    else if(marriageState.dating.indexOf(d.id) >= 0) tierName = '恋人';
  }
  if(npcTierEl) npcTierEl.textContent = tierName;
  if(npcAffEl)  npcAffEl.textContent  = '好感 ' + aff + '/' + CONFIG.NPC.AFF_MAX;
  if(npcBarFill) npcBarFill.style.width = (aff / CONFIG.NPC.AFF_MAX * 100).toFixed(1) + '%';
  /* 第 25 轮：状态提示行（「老板娘 · 好感 62 · 营业中（19:00 关店）」） */
  let stat = npcStatusLine(d);
  if(typeof marriageSpouseId === 'function' && marriageSpouseId() === d.id && window.farmhouseActive) stat = '在家';
  if(npcStatEl){
    npcStatEl.textContent = stat;
    npcStatEl.classList.toggle('show', !!stat);
  }
  const isB = npcIsBirthday(d);
  if(npcBdayEl){
    npcBdayEl.textContent = '🎂 生日 · 送礼 ×' + CONFIG.NPC.GIFT.BIRTHDAY_MULT;
    npcBdayEl.classList.toggle('show', isB);
  }
  npcUpdateText();
  const more = npcDlg.idx < npcDlg.lines.length - 1;
  const done = !npcDlg.typing && !more;
  if(npcNextBtn){
    npcNextBtn.textContent = npcDlg.typing ? '跳过（E）' : (more ? '继续（E）' : '结束（E）');
    npcNextBtn.classList.remove('off');
    npcNextBtn.disabled = false;
  }
  const gifted = npcGiftedToday(d.id);
  if(npcGiftBtn){
    npcGiftBtn.textContent = gifted ? '今天已送过礼' : '送礼物';
    npcGiftBtn.classList.toggle('off', !done || gifted);
    npcGiftBtn.disabled = !done || gifted;      /* 说完了才能送 */
  }
  const rom = (typeof marriageActionInfo === 'function') ? marriageActionInfo(d.id) : null;
  if(npcRomanceBtn){
    npcRomanceBtn.style.display = rom ? '' : 'none';
    if(rom){
      npcRomanceBtn.textContent = rom.label;
      npcRomanceBtn.classList.toggle('off', !rom.ok || !done);
      npcRomanceBtn.disabled = !rom.ok || !done;
    }
  }
  if(npcFootEl){
    npcFootEl.textContent = done
      ? '说完了 · E / 空格 结束对话　·　可以送礼物提升好感（每人每天一次）'
      : 'E / 空格：没打完就整句显示，打完了就下一句 · Esc 结束对话';
  }
}
if(npcNextBtn) npcNextBtn.addEventListener('click', ()=>{ npcAdvance(); ensureAudio(); });
if(npcByeBtn)  npcByeBtn .addEventListener('click', ()=>{ npcCloseDialog(); ensureAudio(); });
if(npcGiftBtn) npcGiftBtn.addEventListener('click', ()=>{ npcStartGift(); ensureAudio(); });
if(npcRomanceBtn) npcRomanceBtn.addEventListener('click', ()=>{ if(typeof marriageAction === 'function') marriageAction(npcDlg.id); renderNpcDialog(); ensureAudio(); });
if(npcMask)   npcMask  .addEventListener('mousedown', e=>{ e.preventDefault(); npcCloseDialog(); });



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { npcPickLines, npcOpenDialog, npcCloseDialog, npcAdvance, updateNpcDialog, npcUpdateText, renderNpcDialog });
export { npcPickLines, npcOpenDialog, npcCloseDialog, npcAdvance, updateNpcDialog, npcUpdateText, renderNpcDialog };
