/* js/systems/weather.js —— 由 index.html 拆分，原行 5270–5428 */
'use strict';

/* --- 天气：每天早晨随机（带权重）--- 第 28 轮改为「预报队列优先」 --- */
window.weather = CONFIG.WEATHER[0];
window.fcQueue = [];                 /* 未来天气 id 队列（fcQueue[0] = 明天），进存档 */
/* 按权重随机抽一种天气 */
function pickWeatherWeighted(){
  let total = 0;
  for(const w of CONFIG.WEATHER) total += w.w;
  let r = Math.random() * total;
  let picked = CONFIG.WEATHER[CONFIG.WEATHER.length-1];
  for(const w of CONFIG.WEATHER){ r -= w.w; if(r < 0){ picked = w; break; } }
  return picked;
}
/* 把预报队列补到 CONFIG.FORECAST.DAYS 天 */
function fillForecast(){
  const N = CONFIG.FORECAST.DAYS;
  while(fcQueue.length < N) fcQueue.push(pickWeatherWeighted().id);
}
/* 明天的天气定义（HUD 日期条用） */
function fcTomorrow(){
  if(!fcQueue.length) return null;
  return CONFIG.WEATHER.find(w => w.id === fcQueue[0]) || null;
}
/* 日历第 off 天（0=今天，1=明天…）的天气定义；今天用实时 weather */
function fcOf(off){
  if(off <= 0) return weather;
  const id = fcQueue[off - 1];
  return id ? (CONFIG.WEATHER.find(w => w.id === id) || null) : null;
}
function rollWeather(){
  /* 第 28 轮：优先从预报队列取今天的天气 —— 日历上写什么，第二天就发生什么 */
  let picked = null;
  if(fcQueue.length){
    const id = fcQueue.shift();
    picked = CONFIG.WEATHER.find(w => w.id === id) || null;
  }
  if(!picked) picked = pickWeatherWeighted();
  weather = picked;
  fillForecast();
  spawnParticles();
  dlog('[weather] 第 ' + clock.day + ' 天天气：' + weather.name);
}

/* --- 天气粒子（画在画布坐标系里，随画布缩放自动对齐） --- */
window.fxParticles = [];
window.rainTimer = 0;
function newParticle(init){
  const rain = weather.id === 'rain';
  return {
    x: Math.random() * VIEW_W,
    y: init ? Math.random() * VIEW_H : -8 - Math.random() * (VIEW_H * 0.4),
    vx: rain ? -CONFIG.WEATHER_FX.RAIN_SPEED * 0.30 : (Math.random() * 26 - 13),
    vy: rain ? CONFIG.WEATHER_FX.RAIN_SPEED : CONFIG.WEATHER_FX.SNOW_SPEED * (0.6 + Math.random() * 0.8),
    len: rain ? 9 + Math.random() * 8 : 0,
    r: 1 + Math.random() * 1.7,
    a: 0.45 + Math.random() * 0.5
  };
}
function spawnParticles(){
  fxParticles = [];
  const n = weather.id === 'rain'  ? CONFIG.WEATHER_FX.RAIN_COUNT
          : weather.id === 'snow'  ? CONFIG.WEATHER_FX.SNOW_COUNT : 0;
  for(let i=0;i<n;i++) fxParticles.push(newParticle(true));
}
function updateWeather(dt){
  /* 雨声环境音：跟着天气开 / 关 */
  if(weather.id === 'rain'){ if(!rainAmbience && !audioMuted) startRainAmbience(); }
  else if(rainAmbience) stopRainAmbience();
  if(weather.id === 'rain'){                   /* 滴答声 */
    const R = CONFIG.AUDIO.RAIN;
    rainTimer -= dt;
    if(rainTimer <= 0){
      rainTimer = R.TICK_MIN + Math.random() * (R.TICK_MAX - R.TICK_MIN);
      playSfx(2200 + Math.random() * 1500, 'square', 0.035, CONFIG.AUDIO.VOLUME * R.VOL);
    }
  }
  for(const p of fxParticles){
    p.x += p.vx * dt; p.y += p.vy * dt;
    if(p.y > VIEW_H + 12){ p.y = -12; p.x = Math.random() * VIEW_W; }
    if(p.x < -14) p.x = VIEW_W + 12;
    if(p.x > VIEW_W + 14) p.x = -12;
  }
}
function drawWeather(g){
  if(typeof currentMap !== 'undefined' && String(currentMap).indexOf('in_') === 0) return;
  if(!fxParticles.length) return;
  if(weather.id === 'rain'){
    g.strokeStyle = 'rgba(175,210,255,0.55)';
    g.lineWidth = 1;
    for(const p of fxParticles){
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x + p.vx * 0.024, p.y + p.len);
      g.stroke();
    }
  }else if(weather.id === 'snow'){
    for(const p of fxParticles){
      g.fillStyle = 'rgba(255,255,255,' + p.a.toFixed(2) + ')';
      g.fillRect(p.x | 0, p.y | 0, (p.r * 2) | 0, (p.r * 2) | 0);
    }
  }
}

/* --- 昼夜染色 + 夜间暗角 --- */
function hexToRgb(h){
  let s = String(h).replace('#','');
  if(s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function skyAt(h){
  const K = CONFIG.SKY;
  let i = 0;
  while(i < K.length - 2 && K[i+1].h <= h) i++;
  const a = K[i], b = K[i+1];
  const t = Math.min(1, Math.max(0, (h - a.h) / Math.max(1e-6, b.h - a.h)));
  const ca = hexToRgb(a.c), cb = hexToRgb(b.c);
  return {
    r: ca[0] + (cb[0]-ca[0])*t,  g: ca[1] + (cb[1]-ca[1])*t,  b: ca[2] + (cb[2]-ca[2])*t,
    a: a.a + (b.a - a.a) * t,   v: a.v + (b.v - a.v) * t
  };
}
const sky = {cur:{r:8,g:20,b:50,a:0.55,v:1}};
function updateSky(dt){
  const t = skyAt(skyHour());
  const k = 1 - Math.exp(-CONFIG.SKY_SMOOTH * dt);   /* 平滑过渡，杜绝闪变 */
  const c = sky.cur;
  c.r += (t.r - c.r) * k; c.g += (t.g - c.g) * k; c.b += (t.b - c.b) * k;
  c.a += (t.a - c.a) * k; c.v += (t.v - c.v) * k;
}
function drawAtmosphere(g){
  const c = sky.cur;
  if(c.a > 0.002){                                /* 整体染色 */
    g.fillStyle = 'rgb(' + (c.r|0) + ',' + (c.g|0) + ',' + (c.b|0) + ')';
    g.globalAlpha = c.a;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    g.globalAlpha = 1;
  }
  if(c.v > 0.002){                                /* 夜间暗角：以玩家为中心 */
    const px = player.x - cam.x, py = player.y - cam.y;
    const R = CONFIG.VIGNETTE.DAY_R + (CONFIG.VIGNETTE.NIGHT_R - CONFIG.VIGNETTE.DAY_R) * c.v;
    const A = CONFIG.VIGNETTE.NIGHT_A * c.v;
    const grd = g.createRadialGradient(px, py, R * 0.32, px, py, R);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,' + A.toFixed(3) + ')');
    g.fillStyle = grd;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  /* 体力耗尽：再加一层淡红暗角（画在 UI 之前，不会盖住体力条） */
  const eg = exhaustedGlow();
  if(eg > 0){
    const px = player.x - cam.x, py = player.y - cam.y;
    const R = 520;
    const grd = g.createRadialGradient(px, py, R * 0.34, px, py, R);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(40,0,0,' + (0.16 + 0.22 * eg).toFixed(3) + ')');
    g.fillStyle = grd;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}



/* --- 过渡期模块桥：其他文件仍可用这些全局名；以后可逐步改成 import --- */
Object.assign(window, { sky, pickWeatherWeighted, fillForecast, fcTomorrow, fcOf, rollWeather, newParticle, spawnParticles, updateWeather, drawWeather, hexToRgb, skyAt, updateSky, drawAtmosphere });
export { sky, pickWeatherWeighted, fillForecast, fcTomorrow, fcOf, rollWeather, newParticle, spawnParticles, updateWeather, drawWeather, hexToRgb, skyAt, updateSky, drawAtmosphere };
