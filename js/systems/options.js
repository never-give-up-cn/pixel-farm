/* js/systems/options.js —— 由 index.html 拆分，原行 4328–4446 */
'use strict';

/* --- 第 29 轮：设置项（界面缩放 / 减少动画 / FPS·网格 / 调试日志） ---
 * 全部随存档的 opt 字段持久化；这里同时维护运行时开关，渲染与日志统一读这些变量。 */
window.optState = {
  scale: CONFIG.SETTINGS.UI_SCALE,
  motion: !!CONFIG.SETTINGS.REDUCE_MOTION,
  fps: !!CONFIG.SETTINGS.SHOW_FPS,
  grid: !!CONFIG.GRID_OVERLAY,
  log: !!CONFIG.SETTINGS.DEBUG_LOG
};
window.showFps = optState.fps;
window.showGrid = optState.grid;
window.logOn = optState.log;
/* 调试日志闸门：默认关闭，设置里打开后才往控制台写（console.warn / error 不受影响） */
function dlog(){ if(logOn){ try{ console.log.apply(console, arguments); }catch(e){} } }
const UI_SCALES = [90, 100, 110];
function applyOptions(){
  /* 浏览器里才有 body / dataset；vm 沙箱里跳过 DOM 部分，开关变量照样生效 */
  const body = (typeof document !== 'undefined') ? document.body : null;
  if(body && body.dataset) body.dataset.uiscale = String(optState.scale);
  if(body && body.classList){
    if(optState.motion) body.classList.add('reduce-motion');
    else body.classList.remove('reduce-motion');
  }
  showFps = !!optState.fps;
  showGrid = !!optState.grid;
  logOn = !!optState.log;
  const scaleBox = document.getElementById('scaleBtns');
  if(scaleBox && scaleBox.children)
    for(let i = 0; i < scaleBox.children.length; i++){
      const el = scaleBox.children[i];
      if(el && el.classList) el.classList.toggle('on', UI_SCALES[i] === optState.scale);
    }
  const m = document.getElementById('optMotion');
  if(m){ m.textContent = '✨ 减少动画：' + (optState.motion ? '开' : '关'); if(m.classList) m.classList.toggle('off', !optState.motion); }
  const f = document.getElementById('optFps');
  if(f){ f.textContent = '📈 显示 FPS：' + (optState.fps ? '开' : '关'); if(f.classList) f.classList.toggle('off', !optState.fps); }
  const gr = document.getElementById('optGrid');
  if(gr){ gr.textContent = '▦ 显示网格：' + (optState.grid ? '开' : '关'); if(gr.classList) gr.classList.toggle('off', !optState.grid); }
  const lg = document.getElementById('optLog');
  if(lg){ lg.textContent = '🐞 调试日志：' + (optState.log ? '开' : '关'); if(lg.classList) lg.classList.toggle('off', !optState.log); }
  return optState;
}
function optionsToSave(){
  return {s:optState.scale, m:optState.motion ? 1 : 0, f:optState.fps ? 1 : 0,
          g:optState.grid ? 1 : 0, l:optState.log ? 1 : 0};
}
function optionsFromSave(o){
  o = (o && typeof o === 'object') ? o : {};
  optState.scale = UI_SCALES.indexOf(Number(o.s)) >= 0 ? Number(o.s) : CONFIG.SETTINGS.UI_SCALE;
  optState.motion = !!o.m;
  optState.fps = !!o.f;
  optState.grid = (typeof o.g === 'number') ? !!o.g : !!CONFIG.GRID_OVERLAY;
  optState.log = !!o.l;
  return applyOptions();
}
function setUiScale(v, silent){
  v = Number(v) | 0;
  if(UI_SCALES.indexOf(v) < 0) v = 100;
  optState.scale = v;
  applyOptions();
  if(!silent) toast('界面缩放 ' + v + '%');
  return v;
}
function setReduceMotion(on, silent){
  optState.motion = !!on;
  applyOptions();
  if(!silent) toast(optState.motion ? '✨ 已减少动画' : '✨ 动画已恢复');
  return optState.motion;
}
function setShowFps(on, silent){
  optState.fps = !!on;
  applyOptions();
  if(!silent) toast(optState.fps ? '📈 已显示 FPS' : '📈 已隐藏 FPS');
  return optState.fps;
}
function setShowGrid(on, silent){
  optState.grid = !!on;
  applyOptions();
  if(!silent) toast(optState.grid ? '▦ 已显示网格' : '▦ 已隐藏网格');
  return optState.grid;
}
function setDebugLog(on, silent){
  optState.log = !!on;
  applyOptions();
  if(!silent) toast(optState.log ? '🐞 调试日志已打开' : '🐞 调试日志已关闭');
  return optState.log;
}
function toggleFullscreen(){
  try{
    if(typeof document === 'undefined') return false;
    if(!document.fullscreenElement && document.documentElement && document.documentElement.requestFullscreen){
      document.documentElement.requestFullscreen();
      return true;
    }
    if(document.exitFullscreen){ document.exitFullscreen(); return false; }
  }catch(e){}
  return false;
}
{
  const scaleBox = document.getElementById('scaleBtns');
  if(scaleBox) scaleBox.addEventListener('click', e=>{
    const t = e && e.target;
    if(!t || !t.getAttribute) return;
    const v = parseInt(t.getAttribute('data-scale'), 10);
    if(v) setUiScale(v);
  });
  const m = document.getElementById('optMotion');
  if(m) m.addEventListener('click', ()=> setReduceMotion(!optState.motion));
  const f = document.getElementById('optFps');
  if(f) f.addEventListener('click', ()=> setShowFps(!optState.fps));
  const gr = document.getElementById('optGrid');
  if(gr) gr.addEventListener('click', ()=> setShowGrid(!optState.grid));
  const lg = document.getElementById('optLog');
  if(lg) lg.addEventListener('click', ()=> setDebugLog(!optState.log));
  const fu = document.getElementById('optFull');
  if(fu) fu.addEventListener('click', ()=>{ toggleFullscreen(); });
}
applyOptions();



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { UI_SCALES, dlog, applyOptions, optionsToSave, optionsFromSave, setUiScale, setReduceMotion, setShowFps, setShowGrid, setDebugLog, toggleFullscreen });
export { UI_SCALES, dlog, applyOptions, optionsToSave, optionsFromSave, setUiScale, setReduceMotion, setShowFps, setShowGrid, setDebugLog, toggleFullscreen };
