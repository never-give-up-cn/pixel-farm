/* js/ui/pause-menu.js —— 由 index.html 拆分，原行 7015–7160 */
'use strict';

/* ========== 第 29 轮：暂停菜单 / 返回标题 / 存档导出导入 ========== */
const pauseEl      = document.getElementById('pause');
const pauseMaskEl  = document.getElementById('pauseMask');
const pauseInfoEl  = document.getElementById('pauseInfo');
const btnResume    = document.getElementById('btnResume');
const btnPauseSave = document.getElementById('btnPauseSave');
const btnPauseSet  = document.getElementById('btnPauseSettings');
const btnPauseTitle= document.getElementById('btnPauseTitle');
const btnExport    = document.getElementById('btnExport');
const btnImport    = document.getElementById('btnImport');
const btnTitle     = document.getElementById('btnTitle');
const importFile   = document.getElementById('importFile');
window.pauseMenuOpen = false;

function pauseInfoText(){
  return '槽' + (curSlot + 1) + ' · 第 ' + clock.day + ' 天 · ' + clockHM().s + ' · ' + seasonName() + '季\n' +
         '金币 ' + gold + ' · 体力 ' + Math.ceil(stamina) + '/' + staminaMax;
}
/* P 键 / 暂停按钮：世界冻结 + 中央暂停菜单（与调试用的 setPaused 分开，不互相抢状态） */
function togglePauseMenu(on){
  const want = (on === undefined) ? !pauseMenuOpen : !!on;
  if(want === pauseMenuOpen) return want;
  pauseMenuOpen = want;
  setPaused(want);
  if(want){
    if(pauseInfoEl) pauseInfoEl.textContent = pauseInfoText();
    setPanelOpen(pauseEl, true);
  }else{
    setPanelOpen(pauseEl, false);
  }
  return want;
}
/* 返回标题前把现有的世界面板全部收起来（世界状态本身保留在存档里） */
function closeAllPanelsForTitle(){
  if(pauseMenuOpen) togglePauseMenu(false);
  if(sysOpen) toggleSys(false);
  if(packOpen) togglePack(false);
  if(shopOpen) toggleShop(false);
  if(chestOpen) toggleChest(false);
  if(makerOpen) makerClosePanel();
  if(animalOpen) animalClosePanel();
  if(questOpen) questClosePanel();
  if(calOpen) calClosePanel();
  if(frendOpen) frendClosePanel();
  if(bigmapOpen) toggleBigmap(false);
  if(achOpen) achClosePanel();
  if(annualOpen) annualClosePanel();
  if(ratingOpen) ratingClosePanel();
  if(endingOpen) endingClosePanel();
  if(npcOpen) npcCloseDialog();
  if(buildMode) toggleBuild(false);
}
/* 返回标题：先自动存档（不弹「已保存」），再回到槽位选择界面 */
function returnToTitle(silent){
  if(!sessionActive) return false;
  closeAllPanelsForTitle();
  if(!saveGame(null, true)){ toast('保存失败，已取消返回标题'); return false; }
  sessionActive = false;              /* 标题界面不再自动存档，避免写脏用户刚点选的其它槽 */
  pendingSave = readSave();
  renderStartSlots();
  updateStartInfo();
  startMenuOpen = true;
  setPanelOpen(startEl, true);
  if(!silent) toast('已自动保存 · 回到标题');
  return true;
}
function exportSaveText(slot){
  const d = readSave(slot);
  if(!d) return '';
  try{ return JSON.stringify(d); }catch(e){ return ''; }
}
function exportSave(){
  const txt = exportSaveText();
  if(!txt){ toast('当前槽没有可导出的存档'); return false; }
  try{
    if(typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL){
      const blob = new Blob([txt], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = CONFIG.SAVE.KEY + '_slot' + (curSlot + 1) + '.json';
      if(document.body && document.body.appendChild) document.body.appendChild(a);
      if(a.click) a.click();
      if(document.body && document.body.removeChild) document.body.removeChild(a);
      setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); }catch(e){} }, 0);
      toast('已导出槽' + (curSlot + 1) + ' 存档');
      return true;
    }
  }catch(e){}
  toast('导出失败：当前浏览器不支持下载');
  return false;
}
/* 导入：解析 → 迁移 → 覆盖当前槽（旧档先备份到 _bak）→ 直接读入 */
function importSaveText(text){
  let d;
  try{ d = JSON.parse(String(text)); }catch(e){ toast('导入失败：不是合法的存档文件'); return false; }
  if(!d || typeof d !== 'object' || typeof d.v !== 'number'){ toast('导入失败：不是像素农场存档'); return false; }
  const r = migrateSave(d);
  if(!r || !r.save){ toast('导入失败：存档迁移出错'); return false; }
  try{
    const oldRaw = window.localStorage.getItem(slotKey(curSlot));
    if(oldRaw) window.localStorage.setItem(slotKey(curSlot) + '_bak', oldRaw);
  }catch(e){}
  const okWrite = writeSave(r.save);
  const okLoad = deserializeState(r.save);
  if(okWrite && okLoad){
    toast('已导入槽' + (curSlot + 1) + ' · 第 ' + clock.day + ' 天');
    return true;
  }
  toast('导入失败：存档写入被拒绝');
  return false;
}
if(btnResume)     btnResume    .addEventListener('click', ()=>{ togglePauseMenu(false); });
if(btnPauseSave)  btnPauseSave .addEventListener('click', ()=>{ saveGame('暂停菜单'); });
if(btnPauseSet)   btnPauseSet  .addEventListener('click', ()=>{ togglePauseMenu(false); toggleSys(true); });
if(btnPauseTitle) btnPauseTitle.addEventListener('click', ()=>{ returnToTitle(); });
if(pauseMaskEl)   pauseMaskEl  .addEventListener('mousedown', e=>{ e.preventDefault(); togglePauseMenu(false); });
if(btnExport)     btnExport    .addEventListener('click', ()=>{ exportSave(); });
if(btnImport)     btnImport    .addEventListener('click', ()=>{ if(importFile && importFile.click) importFile.click(); });
if(btnTitle)      btnTitle     .addEventListener('click', ()=>{ returnToTitle(); });
if(importFile)    importFile   .addEventListener('change', ()=>{
  const f = importFile.files && importFile.files[0];
  if(!f) return;
  if(typeof FileReader === 'undefined'){ toast('导入失败：当前浏览器不支持读取文件'); return; }
  const rd = new FileReader();
  rd.onload = ()=>{ importSaveText(String(rd.result || '')); };
  rd.readAsText(f);
  try{ importFile.value = ''; }catch(e){}
});
/* 多标签页：另一个标签页写了当前槽 → 只更新「已见时间戳」并提示，不抢写 */
window.addEventListener('storage', e=>{
  try{
    if(!e || !e.key) return;
    for(let i = 0; i < CONFIG.SAVE.SLOTS; i++){
      if(e.key === slotKey(i)){
        if(e.newValue){
          const d = JSON.parse(e.newValue);
          if(d && typeof d.at === 'number') lastSeenAt[i] = d.at;
        }
        if(sessionActive && !startMenuOpen && i === curSlot)
          toast('槽' + (i + 1) + ' 已被另一个标签页更新（本页未覆盖）');
        break;
      }
    }
  }catch(err){}
});



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { pauseEl, pauseMaskEl, pauseInfoEl, btnResume, btnPauseSave, btnPauseSet, btnPauseTitle, btnExport, btnImport, btnTitle, importFile, pauseInfoText, togglePauseMenu, closeAllPanelsForTitle, returnToTitle, exportSaveText, exportSave, importSaveText });
export { pauseEl, pauseMaskEl, pauseInfoEl, btnResume, btnPauseSave, btnPauseSet, btnPauseTitle, btnExport, btnImport, btnTitle, importFile, pauseInfoText, togglePauseMenu, closeAllPanelsForTitle, returnToTitle, exportSaveText, exportSave, importSaveText };
