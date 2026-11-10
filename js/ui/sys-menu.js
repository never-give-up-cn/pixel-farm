/* js/ui/sys-menu.js —— 由 index.html 拆分，原行 6882–7014 */
'use strict';

/* --- 系统菜单（Esc）：保存 / 读档 / 删档 --- */
const sysEl    = document.getElementById('sys');
const sysMask  = document.getElementById('sysMask');
const sysInfo  = document.getElementById('sysInfo');
const btnSave  = document.getElementById('btnSave');
const btnLoad  = document.getElementById('btnLoad');
const btnWipe  = document.getElementById('btnWipe');
const btnAch   = document.getElementById('btnAch');   /* 第 18 轮：成就墙入口 */
const btnClose = document.getElementById('btnClose');
window.sysOpen = false;          /* 系统菜单开着时游戏冻结 */
window.sysWipeArmed = false;     /* 删除存档要连点两次，防误触 */

function toggleSys(on){
  const want = (on === undefined) ? !sysOpen : !!on;
  if(want === sysOpen) return;
  sysOpen = want;
  if(sysOpen){
    if(packOpen) togglePack(false);
    if(shopOpen) toggleShop(false);
    if(chestOpen) toggleChest(false);
    if(buildMode) toggleBuild(false);
    sysWipeArmed = false;
    if(sysInfo){
      let raw = '';
      try{ raw = window.localStorage.getItem(slotKey(curSlot)) || ''; }catch(e){ raw = ''; }
      const d = readSave();
      sysInfo.textContent = d
        ? ('槽' + (curSlot + 1) + ' · 上次保存 ' + (raw.length/1024).toFixed(1) + ' KB · 第 ' + saveDay(d) + ' 天')
        : ('槽' + (curSlot + 1) + '：本地还没有存档');
    }
    renderSysSlots();                   /* 第 28 轮：槽位切换行 */
    if(btnWipe) btnWipe.textContent = '删除存档（再点一次确认）';
    if(sysCheatOpen) sysCheatToggle(false);   /* 每次打开菜单都从收起状态开始 */
    if(sysStatsOpen) sysStatsToggle(false);
    setPanelOpen(sysEl, true);
  }else{
    setPanelOpen(sysEl, false);
  }
}
/* --- 第 21 轮：玩法速查表（Esc 菜单内展开；键位与 keydown / mousedown 逐条对齐） --- */
const btnCheat = document.getElementById('btnCheat');
const sysCheat = document.getElementById('sysCheat');
window.sysCheatOpen = false;
const CHEAT_TEXT =
'【键位】\n' +
'W A S D / 方向键　移动（按住 Shift 奔跑，消耗体力）\n' +
'1 ~ 8　　　　　　　选中快捷栏（= 背包前 8 格）\n' +
'左键　　　　　　　使用手中工具 / 种子 / 鱼竿；建造模式下放置\n' +
'右键　　　　　　　水边给水壶补水；手持成品时吃一份；建造模式下拆除\n' +
'Tab / I　　　　　 打开 / 关闭背包（含「图鉴」页签）\n' +
'E　　　　　　　　 交互：居民对话 / 小屋睡觉 / 木箱 / 加工台 / 商店 /\n' +
'　　　　　　　　　委托板 / 动物 / 采集；建造模式下换下一个配方\n' +
'Q　　　　　　　　 建造模式：换上一个配方（滚轮也可以）\n' +
'B　　　　　　　　 进入 / 退出建造模式\n' +
'G　　　　　　　　 农场评级 + 雇工面板（也可点右上角评分）\n' +
'J　　　　　　　　 进入 / 离开矿井（WASD 移动，空格挥剑，走到梯子下一层）\n' +
'P　　　　　　　　 暂停菜单（再按继续）\n' +
'M　　　　　　　　 静音开关（任何面板开着时也能按）\n' +
'Esc　　　　　　　 关闭当前面板；没有面板时打开本菜单；钓鱼中 = 收竿\n' +
'空格 / Enter　　　对话推进 / 钓鱼咬钩时拉杆\n' +
'\n【系统】\n' +
'🌱 种植：锄头开垦 → 播种 → 每天浇水才会生长；成熟后左键收获。\n' +
'💧 水壶：站在水边右键补水；商店可升级容量，减少跑动。\n' +
'🐔 动物：先造鸡舍 / 牛棚，再在商店买动物；好感 ≥50 每天早上产出。\n' +
'🏆 成就：Esc 菜单 → 成就墙；' + CONFIG.ACHIEVEMENT.LIST.length + ' 项成就分四类。\n' +
'📋 委托：委托板每天 3 条，最多同时接 2 条；完成加信誉、提高奖励。\n' +
'⚙ 加工台：原料 → 成品，按游戏时间加工；成品可卖钱或右键吃回体力。\n' +
'🎁 送礼：每人每天 1 次；喜欢 +30 / 普通 +10 / 讨厌 -15，生日翻倍。\n' +
'🌾 评级：作物种类 / 动物 / 建筑 / 成就 / 扩建五项加权，20 分一星，5 星通关。\n' +
'📏 扩建：耕地每满 20 格算 1 期（上限 3 期），计入评级。\n' +
'📅 日历：点左上角日期，查看未来 7 天的节日与居民生日。\n' +
'⛏ 矿井：按 J 进入；打碎矿石掉石材 / 木炭，击杀怪物掉石材与金币，走到梯子下一层。\n' +
'💬 交互提示：本菜单可关闭头顶的「按 E …」按键提示（关掉后交互照常可用）。\n' +
'💾 存档：每天开始自动保存；本菜单可手动保存 / 读档。';
function sysCheatToggle(v){
  const want = (v === undefined) ? !sysCheatOpen : !!v;
  if(want === sysCheatOpen) return false;
  sysCheatOpen = want;
  if(btnCheat) btnCheat.textContent = sysCheatOpen ? '📖 收起速查表' : '📖 玩法速查表';
  if(sysCheat){
    if(sysCheat.textContent !== CHEAT_TEXT) sysCheat.textContent = CHEAT_TEXT;
    if(sysCheat.classList) sysCheat.classList.toggle('open', sysCheatOpen);
    if(sysCheatOpen) sysCheat.scrollTop = 0;
  }
  sysPanelWide();
  return true;
}
/* 速查表 / 游戏状态共用加宽面板：任一展开就保持 500px */
function sysPanelWide(){
  const sp = document.getElementById('sysPanel');
  if(sp && sp.classList) sp.classList.toggle('cheat', !!(sysCheatOpen || sysStatsOpen));
}
if(btnCheat) btnCheat.addEventListener('click', ()=>{ sysCheatToggle(); playClick(); });

/* --- 游戏状态：右上角常驻面板收进菜单（内容与 updateStats 同源） --- */
const btnStats = document.getElementById('btnStats');
const sysStats = document.getElementById('sysStats');
window.sysStatsOpen = false;
function sysStatsRender(){
  if(!sysStats) return;
  updateStats(true);          /* 重新拼一次；updateStats 末尾会写进菜单里的这块 */
}
function sysStatsToggle(v){
  const want = (v === undefined) ? !sysStatsOpen : !!v;
  if(want === sysStatsOpen) return false;
  sysStatsOpen = want;
  if(btnStats) btnStats.textContent = sysStatsOpen ? '📊 收起状态' : '📊 游戏状态';
  if(sysStats && sysStats.classList){
    sysStats.classList.toggle('open', sysStatsOpen);
    if(sysStatsOpen){ sysStatsRender(); sysStats.scrollTop = 0; }
  }
  sysPanelWide();
  return true;
}
if(btnStats) btnStats.addEventListener('click', ()=>{ sysStatsToggle(); playClick(); });

/* 系统菜单里的"删除存档"：第一次只是警告，第二次才真删 */
function sysWipe(){
  if(!sysWipeArmed){
    sysWipeArmed = true;
    if(btnWipe) btnWipe.textContent = '真的要删？再点一次';
    return false;
  }
  sysWipeArmed = false;
  wipeSave();
  if(btnWipe) btnWipe.textContent = '删除存档（再点一次确认）';
  if(sysInfo) sysInfo.textContent = '本地还没有存档';
  return true;
}
if(btnSave)  btnSave .addEventListener('click', ()=>{ saveGame('手动保存'); });
if(btnLoad)  btnLoad .addEventListener('click', ()=>{ loadGame(); });
if(btnWipe)  btnWipe .addEventListener('click', ()=>{ sysWipe(); });
if(btnAch)   btnAch  .addEventListener('click', ()=>{ achOpenPanel(); });
if(btnClose) btnClose.addEventListener('click', ()=>{ toggleSys(false); });
if(sysMask)  sysMask .addEventListener('mousedown', e=>{ e.preventDefault(); toggleSys(false); });



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { sysEl, sysMask, sysInfo, btnSave, btnLoad, btnWipe, btnAch, btnClose, btnCheat, sysCheat, CHEAT_TEXT, btnStats, sysStats, toggleSys, sysCheatToggle, sysPanelWide, sysStatsRender, sysStatsToggle, sysWipe });
export { sysEl, sysMask, sysInfo, btnSave, btnLoad, btnWipe, btnAch, btnClose, btnCheat, sysCheat, CHEAT_TEXT, btnStats, sysStats, toggleSys, sysCheatToggle, sysPanelWide, sysStatsRender, sysStatsToggle, sysWipe };
