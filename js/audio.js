/* js/audio.js —— 由 index.html 拆分，原行 4132–4327 */
'use strict';

/* --- 音效：Web Audio 实时合成（浏览器要求先有用户交互才允许播放） --- */
window.actx = null;
window.audioMuted = CONFIG.AUDIO.MUTE_START;   /* 总音量开关：true = 全部静音 */
window.volLevel = 100;                         /* 第 28 轮：音量档位 0~100（进存档 vol） */
const sndBtn = document.getElementById('sndBtn');   /* 系统菜单里的总音量开关按钮 */
function ensureAudio(){
  try{
    if(!actx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      actx = new AC();
    }
    if(actx.state === 'suspended') actx.resume();
    return actx;
  }catch(err){ return null; }
}
/* 只用「已经解锁」的 AudioContext（用户交互过才建），
 * 这样播放音效不会触发浏览器的自动播放策略告警 */
function audioCtx(){
  if(!actx) return null;
  if(actx.state === 'suspended'){ try{ actx.resume(); }catch(e){} }
  return actx;
}
/* 基础单音 */
function playSfx(freq, type, dur, vol){
  if(audioMuted) return false;
  if(volLevel <= 0) return false;          /* 第 28 轮：音量档 0 = 静音（不走 WebAudio） */
  const ac = audioCtx();
  if(!ac) return false;
  const v = vol * (volLevel / 100);        /* 第 28 轮：音量档位缩放 */
  try{
    const t0 = ac.currentTime;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = type || CONFIG.AUDIO.TYPE;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
    return true;
  }catch(err){ return false; }
}
/* 连音（金币声：两个音先后响） */
function playNotes(notes, type, dur, vol){
  if(audioMuted || !notes || !notes.length) return false;
  if(volLevel <= 0) return false;
  const ac = audioCtx();
  if(!ac) return false;
  const v = vol * (volLevel / 100);
  try{
    notes.forEach((f,i)=>{
      const t0 = ac.currentTime + i*dur;
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(f, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    });
    return true;
  }catch(err){ return false; }
}
/* UI 点击音 */
function playClick(){
  if(!CONFIG.UI.SOUND_ON_CLICK) return false;
  const C = CONFIG.AUDIO.CLICK;
  return playSfx(C.FREQ, 'square', C.DUR, CONFIG.AUDIO.VOLUME * C.VOL);
}
/* 买卖金币声 */
function playCoin(isBuy){
  const C = CONFIG.AUDIO.COIN;
  return playNotes(isBuy ? C.BUY : C.SELL, 'triangle', C.DUR, CONFIG.AUDIO.VOLUME * C.VOL);
}
/* 走路脚步声（每次音高随机） */
function playStep(running){
  const S = CONFIG.AUDIO.STEP;
  const f = S.FREQ + (Math.random()*2 - 1) * S.JITTER;
  const iv = S.INTERVAL / (running ? CONFIG.PLAYER.RUN_MULT : 1);
  return playSfx(f, 'triangle', S.DUR, CONFIG.AUDIO.VOLUME * S.VOL * (running ? 1.25 : 1));
}
/* 睡觉转场音：dir 'in' = 入睡（下滑），'out' = 醒来（上扬） */
function playSleepSfx(dir){
  const S = CONFIG.AUDIO.SLEEP;
  if(audioMuted || volLevel <= 0) return false;
  const ac = audioCtx();
  if(!ac) return false;
  try{
    const t0 = ac.currentTime;
    const f0 = dir === 'in' ? S.IN : S.OUT;
    const f1 = dir === 'in' ? S.OUT * 0.55 : S.IN * 1.7;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40,f1), t0 + S.DUR);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(CONFIG.AUDIO.VOLUME * S.VOL * (volLevel / 100), t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + S.DUR);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t0); osc.stop(t0 + S.DUR + 0.02);
    return true;
  }catch(err){ return false; }
}
/* --- 雨声环境底噪：白噪声 → 低通 → 音量；可在 CONFIG.AUDIO.RAIN.AMBIENT 关闭 --- */
window.rainAmbience = null;
function makeNoiseBuffer(ac, seconds){
  const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2 - 1) * 0.5;
  return buf;
}
function startRainAmbience(){
  if(!CONFIG.AUDIO.RAIN.AMBIENT || rainAmbience || audioMuted) return false;
  const ac = audioCtx();
  if(!ac) return false;
  try{
    const src = ac.createBufferSource();
    src.buffer = makeNoiseBuffer(ac, 2);
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1500;
    const gain = ac.createGain();
    gain.gain.value = CONFIG.AUDIO.VOLUME * CONFIG.AUDIO.RAIN.AMBIENT_VOL * (volLevel / 100);
    src.connect(filter); filter.connect(gain); gain.connect(ac.destination);
    src.start();
    rainAmbience = {src:src, gain:gain, filter:filter};
    return true;
  }catch(err){ rainAmbience = null; return false; }
}
function stopRainAmbience(){
  if(!rainAmbience) return false;
  try{ rainAmbience.src.stop(); }catch(err){}
  try{ rainAmbience.gain.disconnect(); }catch(err){}
  rainAmbience = null;
  return true;
}
/* 静音开关（silent=true 时不弹提示条，读档恢复状态用） */
function setMuted(m, silent){
  audioMuted = !!m;
  if(sndBtn){
    sndBtn.textContent = audioMuted ? '🔇 声音：关（M）' : '🔊 声音：开（M）';
    if(sndBtn.classList) sndBtn.classList.toggle('off', audioMuted);
  }
  if(audioMuted) stopRainAmbience();
  else if(weather && weather.id === 'rain') startRainAmbience();
  if(!silent) toast(audioMuted ? '🔇 已静音' : '🔊 声音已打开');
  return audioMuted;
}
function toggleMute(){ return setMuted(!audioMuted); }
/* 第 28 轮：音量档位（0~100）。滑块在系统菜单；读档恢复时 silent=true 不弹提示。
 * 正在播放的雨声 / 节日环境底噪立刻跟着变（gain 是直读的 value，不用重启源）。 */
function setVolLevel(v, silent){
  v = clamp(Math.round(Number(v)), 0, 100);
  if(isNaN(v)) v = 100;
  volLevel = v;
  const r = document.getElementById('volRange');
  const val = document.getElementById('volVal');
  const ic = document.getElementById('volIcon');
  if(r) r.value = String(v);
  if(val) val.textContent = v + '%';
  if(ic) ic.textContent = (v === 0 ? '🔇' : (v < 50 ? '🔉' : '🔊'));
  const s = volLevel / 100;
  if(rainAmbience && rainAmbience.gain)
    rainAmbience.gain.gain.value = CONFIG.AUDIO.VOLUME * CONFIG.AUDIO.RAIN.AMBIENT_VOL * s;
  if(festAmbience && festAmbience.gain)
    festAmbience.gain.gain.value = CONFIG.AUDIO.VOLUME * CONFIG.FESTIVAL.AMBIENT_VOL * s;
  if(!silent) toast('🔉 音量 ' + volLevel + '%');
  return volLevel;
}
/* 系统菜单里的音量滑块 */
const volRange = document.getElementById('volRange');
if(volRange) volRange.addEventListener('input', ()=>{
  setVolLevel(parseInt(volRange.value, 10));
  ensureAudio();
});
/* 声音开关按钮 */
if(sndBtn) sndBtn.addEventListener('click', ()=>{ toggleMute(); });

/* 交互按键提示开关（第 22 轮）：关掉后靠近居民 / 场景时不再绘制「按 E ...」浮字。
 * 只影响提示绘制，交互本身照常可用；开关状态进存档（ih）。*/
const hintBtn = document.getElementById('hintBtn');
window.interactHintsOn = CONFIG.INTERACT_HINT.ENABLED !== false;
function setInteractHints(on, silent){
  interactHintsOn = !!on;
  if(hintBtn){
    hintBtn.textContent = interactHintsOn ? '💬 交互提示：开' : '💬 交互提示：关';
    if(hintBtn.classList) hintBtn.classList.toggle('off', !interactHintsOn);
  }
  if(!silent) toast(interactHintsOn ? '💬 交互按键提示已打开' : '💬 交互按键提示已关闭');
  return interactHintsOn;
}
function toggleInteractHints(){ return setInteractHints(!interactHintsOn); }
if(hintBtn) hintBtn.addEventListener('click', ()=>{ toggleInteractHints(); });


/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { sndBtn, volRange, hintBtn, ensureAudio, audioCtx, playSfx, playNotes, playClick, playCoin, playStep, playSleepSfx, makeNoiseBuffer, startRainAmbience, stopRainAmbience, setMuted, toggleMute, setVolLevel, setInteractHints, toggleInteractHints });
export { sndBtn, volRange, hintBtn, ensureAudio, audioCtx, playSfx, playNotes, playClick, playCoin, playStep, playSleepSfx, makeNoiseBuffer, startRainAmbience, stopRainAmbience, setMuted, toggleMute, setVolLevel, setInteractHints, toggleInteractHints };
