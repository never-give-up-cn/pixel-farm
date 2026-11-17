/* js/ui/start-menu.js —— 由 index.html 拆分，原行 6755–6881 */
'use strict';

/* --- 启动菜单（本地有存档时：继续 / 新游戏） --- */
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
/* 第 37 轮：农场类型选择 */
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
/* 打开标题界面 */
function openStartMenu(d){
  pendingSave = d;
  startMenuOpen = true;
  renderStartSlots();
  updateStartInfo();
  if(startBtns && startBtns.style) startBtns.style.display = 'flex';
  if(startConfirm && startConfirm.classList) startConfirm.classList.remove('open');
  setPanelOpen(startEl, true);
}
/* 第 28 轮：标题界面槽位行 + 存档摘要（点槽位切换后复用） */
function renderStartSlots(){
  const box = document.getElementById('startSlots');
  if(!box) return;
  box.innerHTML = '';
  for(let i = 0; i < CONFIG.SAVE.SLOTS; i++){
    const b = document.createElement('button');
    b.className = 'mbtn slot' + (i === curSlot ? ' on' : '');
    const d = readSave(i);
    b.textContent = '槽' + (i + 1) + (d ? (' · 第' + saveDay(d) + '天') : ' · 空');
    b.addEventListener('click', ()=>{
      curSlot = i;
      pendingSave = readSave(i);
      renderStartSlots();
      updateStartInfo();
      playClick();
    });
    box.appendChild(b);
  }
}
function updateStartInfo(){
  const d = pendingSave;
  const tag = '槽' + (curSlot + 1) + ' · ';
  if(startInfo) startInfo.textContent = d ? (tag + saveSummary(d)) : (tag + '空槽位 —— 点「新游戏」在这里开局');
  if(!d){
    if(startWarn) startWarn.textContent = '';
    if(btnContinue) btnContinue.textContent = '继续游戏';
    if(btnNew) btnNew.textContent = '新游戏';
    return;
  }
  const vOK = saveVersionOK(d);
  if(startWarn) startWarn.textContent = vOK ? '' :
    ('存档版本 v' + (d.v === undefined ? '?' : d.v) + ' 比当前版本 v' + CONFIG.SAVE.VERSION +
     ' 还新，读取可能不完整。仍要继续吗？');
  if(btnContinue) btnContinue.textContent = vOK ? '继续游戏' : '仍然尝试读取';
  if(btnNew) btnNew.textContent = vOK ? '新游戏' : '删除旧存档并重开';
}
/* 关闭标题界面 */
function closeStartMenu(){
  startMenuOpen = false;
  setPanelOpen(startEl, false);
}
/* 标题界面：二次确认（防误删存档） */
function askNewGame(empty){
  if(confirmText) confirmText.textContent = empty
    ? ('槽' + (curSlot + 1) + ' 是空槽位 —— 选好农场类型就开局。')
    : ('确定要删除槽' + (curSlot + 1) + ' 的存档，从头开始吗？\n（删掉就找不回来了）');
  if(btnNewYes) btnNewYes.textContent = empty ? '开始新游戏' : '确定删除并重开';
  if(startBtns && startBtns.style) startBtns.style.display = 'none';
  if(startConfirm && startConfirm.classList) startConfirm.classList.add('open');
  renderFarmPick();
}
function cancelNewGame(){
  if(startBtns && startBtns.style) startBtns.style.display = 'flex';
  if(startConfirm && startConfirm.classList) startConfirm.classList.remove('open');
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
/* 标题界面：真的重开一局 */
function doNewGame(farmId){
  const id = (typeof farmId === 'string') ? farmId : pendingFarmType;
  newGame(id);
  closeStartMenu();
  sessionActive = true;
  const def = farmTypeDef(id);
  toast('新的一局开始了 · ' + (def ? def.name : '标准农场'));
}
/* 标题界面：继续读档 */
function doContinue(){
  const raw = pendingSave;
  /* 第 37 轮：空槽位 → 打开农场类型选择，而不是直接进一个标准农场 */
  if(!raw){ askNewGame(true); return; }
  closeStartMenu();
  sessionActive = true;
  const r = migrateSave(raw);           /* v1 旧档在这里升级（进度无损） */
  const ok = deserializeState(r.save);
  if(r.degraded){ toast('存档升级失败，已按旧版本读取（居民数据可能缺失）'); return; }
  if(ok) toast('欢迎回来 · 槽' + (curSlot + 1) + ' · 第 ' + clock.day + ' 天');
  else{ newGame(); toast('存档读取失败，开了一局新的'); }
}
if(btnContinue) btnContinue.addEventListener('click', ()=>{ doContinue(); });
if(btnNew) btnNew.addEventListener('click', ()=>{ askNewGame(!pendingSave); });
if(btnNewYes) btnNewYes.addEventListener('click', ()=>{ doNewGame(); });
if(btnNewNo)  btnNewNo .addEventListener('click', ()=>{ cancelNewGame(); });
renderFarmPick();



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { startEl, startInfo, startWarn, startBtns, startConfirm, confirmText, btnContinue, btnNew, btnNewYes, btnNewNo, fmtStamp, saveSummary, openStartMenu, renderStartSlots, updateStartInfo, closeStartMenu, askNewGame, cancelNewGame, doNewGame, doContinue, farmPickListEl, farmPickDescEl, renderFarmPick });
export { startEl, startInfo, startWarn, startBtns, startConfirm, confirmText, btnContinue, btnNew, btnNewYes, btnNewNo, fmtStamp, saveSummary, openStartMenu, renderStartSlots, updateStartInfo, closeStartMenu, askNewGame, cancelNewGame, doNewGame, doContinue, farmPickListEl, farmPickDescEl, renderFarmPick };
