/* js/ui/feedback.js —— 由 index.html 拆分，原行 4447–4595 */
'use strict';

/* --- UI 点击音：菜单按钮 / 页签按下时"哒"一声（商店的买卖用金币声，不重复） --- */
const UI_CLICK_SEL = ['.mbtn', '.tab', '#sndBtn'];
document.addEventListener('click', e=>{
  if(!e || !e.target) return;
  const t = e.target;
  for(let i=0;i<UI_CLICK_SEL.length;i++){
    const sel = UI_CLICK_SEL[i];
    if((t.matches && t.matches(sel)) || (t.closest && t.closest(sel))){ playClick(); return; }
  }
});

/* --- 新手引导：第 1 天早晨依次弹出 3 条提示（移动 / 锄地播种 / 睡觉），完成即消失 --- */
const tutEl = document.getElementById('tut');
const sysTutEl = document.getElementById('sysTut');   /* 主画面不再显示，改在 Esc 菜单里看 */
const tut = {step:0, moved:0, tilled:0, sown:0, slept:false};   /* 进度（会存进存档） */
/* 三步提示：done() 判断这一步是否完成 */
const TUT_STEPS = [
  {key:'move',  text:'① 用 W A S D 或方向键走动（按住 Shift 跑得更快）',
   done:()=> tut.moved >= CONFIG.TUTORIAL.MOVE_PX},
  {key:'till',  text:'② 左键用锄头开垦草地 → 再选中种子播下去 → 用水壶浇水',
   done:()=> tut.tilled >= CONFIG.TUTORIAL.TILL_COUNT && tut.sown >= CONFIG.TUTORIAL.SOW_COUNT},
  {key:'sleep', text:'③ 天黑前回到小屋按 E 睡觉，体力会回满、作物会生长',
   done:()=> tut.slept}
];
/* 当前这一步要不要显示（配置关掉 / 不是第 1 天 / 已全部完成 → 不显示） */
function tutActive(){
  if(!CONFIG.TUTORIAL.ENABLED) return false;
  if(tut.step >= TUT_STEPS.length) return false;
  if(clock.day > CONFIG.TUTORIAL.DAY) return false;
  return true;
}
/* 把当前提示写进 DOM（画面上的 #tut 已由 CSS 隐藏，只在菜单里显示同一句） */
function updateTut(){
  if(!tutEl) return;
  if(!tutActive()){
    if(tutEl.classList) tutEl.classList.remove('show');
    tutEl.textContent = '';
    syncSysTut();
    return;
  }
  const s = TUT_STEPS[tut.step];
  if(tutEl.textContent !== s.text) tutEl.textContent = s.text;
  if(tutEl.classList) tutEl.classList.add('show');
  syncSysTut();
}
/* 菜单顶部的「新手引导」当前步骤：采完第 1 天 / 三步完成后自动隐藏 */
function syncSysTut(){
  if(!sysTutEl) return;
  if(!tutActive()){
    sysTutEl.style.display = 'none';
    sysTutEl.textContent = '';
    return;
  }
  sysTutEl.style.display = 'block';
  const s = TUT_STEPS[tut.step];
  const txt = '🎓 新手引导　' + s.text;
  if(sysTutEl.textContent !== txt) sysTutEl.textContent = txt;
}
/* 触发一次检查：当前这一步完成了就往下走一步（全部完成 → 提示消失，之后不再出现） */
function tutCheck(){
  if(!tutActive()){ updateTut(); return; }
  if(TUT_STEPS[tut.step].done()){
    tut.step++;
    updateTut();
  }
}
/* 教程相关的计数（由各动作调用） */
function tutMoved(d){ tut.moved += d; tutCheck(); }
function tutTilled(){ tut.tilled++; tutCheck(); }
function tutSown(){ tut.sown++; tutCheck(); }
function tutSlept(){ tut.slept = true; tutCheck(); }

/* --- 系统教学提示（第 21 轮）：钓鱼 / 送礼 / 委托 / 加工台 / 扩建，
 * 每套系统第一次接触时弹一次；位掩码进存档，读档后不再重复。
 * 提示条悬浮在快捷栏上方，不接收点击，也不会挡住 HUD / 面板。 --- */
const sysTipEl = document.getElementById('sysTip');
const SYS_TIPS = [
  {key:'fish',   bit:1 << 0, text:'🎣 钓鱼：水边选中鱼竿后左键抛竿；鱼漂下沉时左键 / 空格拉杆，右键收竿。\n不同的鱼有季节 / 时段 / 天气限制，钓到会记进图鉴（Tab → 图鉴）。'},
  {key:'gift',   bit:1 << 1, text:'🎁 送礼：靠近居民按 E 说话，选「送礼物」，再点背包里的一件物品。\n每人每天 1 次；送对方喜欢的东西好感更多，生日当天翻倍。'},
  {key:'quest',  bit:1 << 2, text:'📋 委托：靠近商店旁的委托板按 E。每天刷新 3 条，最多同时接 2 条。\n收获 / 钓鱼 / 采集会自动累计进度，完成后给金币与信誉。'},
  {key:'maker',  bit:1 << 3, text:'⚙ 加工台：靠近按 E 打开，把低价原料变成高价成品。\n加工按游戏时间推进（睡觉也照算），做好后按 E 取走成品。'},
  {key:'expand', bit:1 << 4, text:'🧱 扩建：每开垦 20 格耕地算 1 期扩建（上限 3 期），计入农场评级。\n按 G 打开评级面板，随时查看离 5 星还差多少。'}
];
const tipsState = {mask:0};
window.sysTipT = 0;                    /* 剩余显示时间（游戏内秒） */
function tipSeen(key){
  const t = SYS_TIPS.find(x => x.key === key);
  return !!(t && (tipsState.mask & t.bit));
}
/* 第一次接触 → 弹一次并记位；已看过 / 总开关关闭 → 静默返回 false */
function sysTipShow(key){
  if(!CONFIG.TIPS.ENABLED) return false;
  const t = SYS_TIPS.find(x => x.key === key);
  if(!t || (tipsState.mask & t.bit)) return false;
  tipsState.mask = (tipsState.mask | t.bit) >>> 0;
  if(!sysTipEl) return false;
  sysTipEl.textContent = t.text;
  if(sysTipEl.classList) sysTipEl.classList.add('show');
  sysTipT = CONFIG.TIPS.SHOW_MS / 1000;
  layoutSysTip();
  playSfx(880, 'sine', 0.06, CONFIG.AUDIO.VOLUME * 0.5);
  return true;
}
function sysTipHide(){
  sysTipT = 0;
  if(sysTipEl && sysTipEl.classList) sysTipEl.classList.remove('show');
}
/* 让提示条贴着画布下沿、快捷栏上方（和 toast 同一套换算） */
function layoutSysTip(){
  if(!sysTipEl) return;
  const r = canvas.getBoundingClientRect();
  sysTipEl.style.left = (r.left + r.width / 2) + 'px';
  sysTipEl.style.bottom = Math.max(12, window.innerHeight - (r.top + r.height) + 92) + 'px';
}
/* 倒计时只在世界运行时推进（面板打开 → 冻结，不会读完自己消失） */
function updateSysTip(dt){
  if(sysTipT <= 0) return;
  sysTipT -= dt;
  if(sysTipT <= 0) sysTipHide();
}
function tipsSerialize(){ return tipsState.mask >>> 0; }
function tipsDeserialize(v){
  tipsState.mask = (Number(v) | 0) >>> 0;      /* 越界的位不影响：只按已知 key 查询 */
  sysTipHide();
}
function tipsResetState(){ tipsState.mask = 0; sysTipHide(); }

/* --- 提示条：屏幕底部，1.5 秒淡出，多条向上排 --- */
const toastBox = document.getElementById('toasts');
/* 把提示条锚定到画布下沿（而不是视口底部，避免掉进黑边） */
function layoutToasts(){
  if(!toastBox) return;
  const r = canvas.getBoundingClientRect();
  toastBox.style.left = (r.left + r.width / 2) + 'px';
  toastBox.style.bottom = Math.max(12, window.innerHeight - (r.top + r.height) + 16) + 'px';
}
function toast(msg){
  if(!toastBox) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  el.style.animationDuration = CONFIG.INTERACT.TOAST_TIME + 's';
  toastBox.appendChild(el);                       /* 新的一条排在最下面，旧的被顶上去 */
  while(toastBox.children.length > CONFIG.INTERACT.TOAST_MAX)
    toastBox.removeChild(toastBox.firstChild);
  setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); },
             CONFIG.INTERACT.TOAST_TIME * 1000);
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { UI_CLICK_SEL, tutEl, sysTutEl, tut, TUT_STEPS, sysTipEl, SYS_TIPS, tipsState, toastBox, tutActive, updateTut, syncSysTut, tutCheck, tutMoved, tutTilled, tutSown, tutSlept, tipSeen, sysTipShow, sysTipHide, layoutSysTip, updateSysTip, tipsSerialize, tipsDeserialize, tipsResetState, layoutToasts, toast });
export { UI_CLICK_SEL, tutEl, sysTutEl, tut, TUT_STEPS, sysTipEl, SYS_TIPS, tipsState, toastBox, tutActive, updateTut, syncSysTut, tutCheck, tutMoved, tutTilled, tutSown, tutSlept, tipSeen, sysTipShow, sysTipHide, layoutSysTip, updateSysTip, tipsSerialize, tipsDeserialize, tipsResetState, layoutToasts, toast };
