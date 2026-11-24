/* js/ui/start-menu.js —— 由 index.html 拆分，原行 6755–6881
 * 第 42 轮：存档不再固定 3 个；标题界面「读取存档」会列出本地全部存档，
 * 可以任意读取 / 删除；新建游戏会自动占用下一个空存档号，不覆盖旧档。 */
'use strict';

const startEl      = document.getElementById('start');
const startInfo    = document.getElementById('startInfo');
const startWarn    = document.getElementById('startWarn');
const startBtns    = document.getElementById('startBtns');
const startConfirm = document.getElementById('startConfirm');
const confirmText  = document.getElementById('confirmText');
const btnContinue  = document.getElementById('btnContinue');
const btnNew       = document.getElementById('btnNew');
const btnNewYes    = document.getElementById('btnNewYes');
const btnNewNo     = document.getElementById('btnNewNo');
const startLoadEl  = document.getElementById('startLoad');
const startLoadListEl = document.getElementById('startLoadList');
const startLoadCountEl = document.getElementById('startLoadCount');
const btnLoadBack  = document.getElementById('btnLoadBack');
const farmPickListEl = document.getElementById('farmPickList');
const farmPickDescEl = document.getElementById('farmPickDesc');
window.pendingFarmType = CONFIG.GEN.FARM_DEFAULT || 'standard';
window.startMenuOpen = false;    /* 标题界面开着时游戏完全冻结（时间不走） */
window.pendingSave = null;       /* 启动时读到的存档 */

/* 存档时间戳 → 可读文本 */
function fmtStamp(ts){
  try{
    const d = new Date(ts);
    const p = n => String(n).padStart(2,'0');
    return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + ' ' +
           p(d.getHours()) + ':' + p(d.getMinutes());
  }catch(e){ return '时间未知'; }
}
/* 存档摘要（标题界面显示） */
function saveSummary(d){
  if(!d) return '';
  const days = (d.time && d.time.day) ? d.time.day : 1;
  const season = CONFIG.SEASONS[Math.floor((days-1) / CONFIG.DAYS_PER_SEASON) % CONFIG.SEASONS.length];
  const w = CONFIG.WEATHER.find(x=>x.id===d.weather);
  const nc = Array.isArray(d.crops) ? d.crops.length : 0;
  const nb = Array.isArray(d.buildings) ? d.buildings.length : 0;
  const nd = (d.map && typeof d.map === 'object') ? Object.keys(d.map).length : 0;
  const dv = (typeof d.v === 'number') ? d.v : 1;
  const upg = dv < CONFIG.SAVE.VERSION ? ('　（存档 v' + dv + ' 会自动升级到 v' + CONFIG.SAVE.VERSION + '）') : '';
  const ftDef = CONFIG.GEN.FARM_TYPES.LIST[d.farm] || CONFIG.GEN.FARM_TYPES.LIST[CONFIG.GEN.FARM_DEFAULT];
  return '存档：第 ' + days + ' 天（' + season + '季）· ' + (w ? w.name : '晴') + '\n' +
         '农场：' + (ftDef ? ftDef.name : '标准农场') + ' · 金币 ' + (d.gold||0) + ' · 体力 ' + Math.ceil(d.stamina||0) + '/' + (d.staminaMax||0) +
         ' · 作物 ' + nc + ' 株 · 建造物 ' + nb + ' 个\n' +
         '地图改动 ' + nd + ' 格 · 保存于 ' + fmtStamp(d.at) + upg;
}
function latestSave(){
  const list = (typeof listSaves === 'function') ? listSaves() : [];
  return list.length ? list[0] : null;
}
function showStartMain(){
  if(startLoadEl) startLoadEl.classList.remove('open');
  if(startBtns) startBtns.style.display = 'flex';
  if(startConfirm) startConfirm.classList.remove('open');
}
/* 打开标题界面 */
function openStartMenu(d){
  const latest = latestSave();
  pendingSave = d || (latest ? latest.data : null);
  if(latest && d === undefined) curSlot = latest.slot;
  startMenuOpen = true;
  renderStartSlots();
  updateStartInfo();
  showStartMain();
  setPanelOpen(startEl, true);
}
/* 全部存档列表 */
function renderStartSlots(){
  if(!startLoadListEl) return;
  const list = (typeof listSaves === 'function') ? listSaves() : [];
  startLoadListEl.innerHTML = '';
  if(startLoadCountEl) startLoadCountEl.textContent = '（' + list.length + ' 个）';
  if(!list.length){
    const empty = document.createElement('div');
    empty.className = 'saveRow';
    empty.textContent = '还没有存档。点「新游戏」选择农场类型后创建。';
    startLoadListEl.appendChild(empty);
    return;
  }
  for(const rec of list){
    const row = document.createElement('div');
    row.className = 'saveRow';
    const meta = document.createElement('div');
    meta.className = 'saveMeta';
    const title = document.createElement('div');
    title.className = 'saveTitle';
    title.textContent = (typeof saveDisplayName === 'function') ? saveDisplayName(rec.slot, rec.data) : ('存档 ' + (rec.slot + 1));
    const sub = document.createElement('div');
    sub.className = 'saveSub';
    sub.textContent = (typeof saveRowSummary === 'function') ? saveRowSummary(rec.data) : saveSummary(rec.data);
    meta.appendChild(title); meta.appendChild(sub);
    const btns = document.createElement('div');
    btns.className = 'saveBtns';
    const load = document.createElement('button');
    load.type = 'button'; load.textContent = '读取';
    load.addEventListener('click', ()=>loadSaveFromSlot(rec.slot));
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'danger'; del.textContent = '删除';
    del.addEventListener('click', ()=>deleteSaveFromList(rec.slot));
    btns.appendChild(load); btns.appendChild(del);
    row.appendChild(meta); row.appendChild(btns);
    startLoadListEl.appendChild(row);
  }
}
function updateStartInfo(){
  const list = (typeof listSaves === 'function') ? listSaves() : [];
  if(startWarn) startWarn.textContent = '';
  if(!list.length){
    if(startInfo) startInfo.textContent = '本地还没有存档。\n点「新游戏」选择农场类型，创建第一个存档。';
    return;
  }
  const latest = list[0];
  const name = (typeof saveDisplayName === 'function') ? saveDisplayName(latest.slot, latest.data) : '存档';
  if(startInfo) startInfo.textContent =
    '本地共有 ' + list.length + ' 个存档，存档数量不限。\n' +
    '最近：' + name + ' · 第 ' + saveDay(latest.data) + ' 天\n' +
    '点「读取存档」打开完整列表，可任意读取或删除。';
}
function openSaveList(){
  renderStartSlots();
  updateStartInfo();
  if(startBtns) startBtns.style.display = 'none';
  if(startConfirm) startConfirm.classList.remove('open');
  if(startLoadEl) startLoadEl.classList.add('open');
  playClick();
}
function closeSaveList(){
  showStartMain();
  playClick();
}
/* 关闭标题界面 */
function closeStartMenu(){
  startMenuOpen = false;
  setPanelOpen(startEl, false);
}
/* 新游戏：只选择农场类型，不删除任何旧存档 */
function askNewGame(){
  if(confirmText) confirmText.textContent = '选择农场类型，创建新存档。\n（存档数量不限，旧存档不会被覆盖）';
  if(btnNewYes) btnNewYes.textContent = '创建新存档';
  if(startBtns) startBtns.style.display = 'none';
  if(startLoadEl) startLoadEl.classList.remove('open');
  if(startConfirm) startConfirm.classList.add('open');
  renderFarmPick();
}
function cancelNewGame(){
  showStartMain();
}
/* 第 37 轮：农场类型选项卡（开局前选择） */
function renderFarmPick(){
  if(!farmPickListEl) return;
  farmPickListEl.innerHTML = '';
  const F = CONFIG.GEN.FARM_TYPES;
  for(const id of F.ORDER){
    const def = F.LIST[id];
    if(!def) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'farmopt' + (id === pendingFarmType ? ' on' : '');
    b.dataset.farm = id;
    const ic = document.createElement('span');
    ic.className = 'fico';
    ic.textContent = def.icon || '🌾';
    const nm = document.createElement('span');
    nm.textContent = def.name || id;
    b.appendChild(ic); b.appendChild(nm);
    b.addEventListener('click', ()=>{
      pendingFarmType = id;
      renderFarmPick();
      if(typeof playClick === 'function') playClick();
    });
    farmPickListEl.appendChild(b);
  }
  if(farmPickDescEl){
    const d = F.LIST[pendingFarmType] || F.LIST[F.ORDER[0]];
    farmPickDescEl.textContent = d ? d.desc : '';
  }
}
/* 标题界面：创建新存档 */
function doNewGame(farmId){
  const id = (typeof farmId === 'string') ? farmId : pendingFarmType;
  const slot = (typeof nextSaveSlot === 'function') ? nextSaveSlot() : 0;
  if(slot < 0){ toast('存档数量已满，请先删除一些存档'); return; }
  curSlot = slot;
  pendingSave = null;
  newGame(id);
  closeStartMenu();
  sessionActive = true;
  /* 机器人只玩不写档；正常玩家创建后立刻落一份，列表里马上能看到 */
  if(!window.__farmBotLoaded) saveGame('新游戏', true);
  const def = farmTypeDef(id);
  toast('新存档：' + (def ? def.name : '标准农场') + ' · 存档 ' + (slot + 1));
}
/* 标题界面：读取指定存档 */
function loadSaveFromSlot(slot){
  const d = readSave(slot);
  if(!d){ toast('这个存档已经不存在了'); renderStartSlots(); return; }
  curSlot = slot;
  pendingSave = d;
  doContinue();
}
/* 删除存档（标题界面列表） */
function deleteSaveFromList(slot){
  const d = readSave(slot);
  if(!d) return;
  const name = (typeof saveDisplayName === 'function') ? saveDisplayName(slot, d) : ('存档 ' + (slot + 1));
  if(typeof window.confirm === 'function' &&
     !window.confirm('确定删除「' + name + ' · 第 ' + saveDay(d) + ' 天」吗？\n删掉就找不回来了。')) return;
  deleteSave(slot);
  if(curSlot === slot) pendingSave = null;
  renderStartSlots();
  updateStartInfo();
  toast(name + ' 已删除');
}
/* 标题界面：读取当前选中的存档 */
function doContinue(){
  const raw = pendingSave || readSave();
  if(!raw){ toast('没有可读取的存档'); openSaveList(); return; }
  closeStartMenu();
  sessionActive = true;
  const r = migrateSave(raw);           /* v1 旧档在这里升级（进度无损） */
  const ok = deserializeState(r.save);
  if(r.degraded){ toast('存档升级失败，已按旧版本读取（居民数据可能缺失）'); return; }
  if(ok) toast('欢迎回来 · ' + saveDisplayName(curSlot, readSave()) + ' · 第 ' + clock.day + ' 天');
  else { toast('存档读取失败，请选择其他存档'); openStartMenu(null); }
}
if(btnContinue) btnContinue.addEventListener('click', ()=>{ openSaveList(); });
if(btnNew) btnNew.addEventListener('click', ()=>{ askNewGame(); });
if(btnNewYes) btnNewYes.addEventListener('click', ()=>{ doNewGame(); });
if(btnNewNo)  btnNewNo .addEventListener('click', ()=>{ cancelNewGame(); });
if(btnLoadBack) btnLoadBack.addEventListener('click', ()=>{ closeSaveList(); });
renderFarmPick();



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { startEl, startInfo, startWarn, startBtns, startConfirm, confirmText, btnContinue, btnNew, btnNewYes, btnNewNo, fmtStamp, saveSummary, openStartMenu, renderStartSlots, updateStartInfo, closeStartMenu, askNewGame, cancelNewGame, doNewGame, doContinue, loadSaveFromSlot, deleteSaveFromList, openSaveList, closeSaveList, farmPickListEl, farmPickDescEl, renderFarmPick, startLoadEl, startLoadListEl, startLoadCountEl, btnLoadBack });
export { startEl, startInfo, startWarn, startBtns, startConfirm, confirmText, btnContinue, btnNew, btnNewYes, btnNewNo, fmtStamp, saveSummary, openStartMenu, renderStartSlots, updateStartInfo, closeStartMenu, askNewGame, cancelNewGame, doNewGame, doContinue, loadSaveFromSlot, deleteSaveFromList, openSaveList, closeSaveList, farmPickListEl, farmPickDescEl, renderFarmPick, startLoadEl, startLoadListEl, startLoadCountEl, btnLoadBack };
