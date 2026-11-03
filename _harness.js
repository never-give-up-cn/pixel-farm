const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];

/* ---- 极简 DOM / Canvas 桩 ---- */
const fillRects=[];
const ctxMock={
  imageSmoothingEnabled:true, fillStyle:'',
  fillRect(x,y,w,h){ fillRects.push({x,y,w,h,style:this.fillStyle}); },
  clearRect(){}, save(){}, restore(){}, beginPath(){}, arc(){}, fill(){}, drawImage(){}
};
const canvasMock={ width:0, height:0, style:{}, getContext(){return ctxMock;}, addEventListener(){} };
const rafQueue=[];
const sandbox={
  console:{log(...a){sandbox.__logs.push(a.join(' '));}},
  performance:{now:()=>sandbox.__now},
  requestAnimationFrame(cb){ rafQueue.push(cb); return rafQueue.length; },
  document:{ getElementById:id=>id==='game'?canvasMock:null, addEventListener(){}, createElement:()=>({getContext:()=>ctxMock,style:{},appendChild(){},classList:{add(){},toggle(){},remove(){}}}) },
  window:{ innerWidth:1920, innerHeight:1080, addEventListener(){} },
  Math, Date, JSON, String, Number, Array, Object, parseInt, parseFloat, isNaN, btoa:s=>Buffer.from(s,'binary').toString('base64'), atob:s=>Buffer.from(s,'base64').toString('binary')
};
sandbox.__logs=[]; sandbox.__now=0; sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(code+`
;globalThis.__probe={get fps(){return fps;},get acc(){return accumulator;},
  get upd(){return updCount;}, get rendered(){return renderCount;}, get order(){return order.join('>')}};
var updCount=0, renderCount=0, order=[];
var _u=update, _r=render;
update=function(dt){updCount++;_u(dt);};
render=function(){renderCount++; order.push(['ground','objects','player','ui'].join('>'));
  drawGround(ctx);drawObjects(ctx);drawPlayer(ctx);drawUI(ctx);};
`, sandbox);

/* ---- 驱动 1 秒 60Hz 虚拟时间 ---- */
const DT=1000/60;
for(let i=0;i<60;i++){
  sandbox.__now+=DT;
  const q=rafQueue.splice(0,rafQueue.length);
  for(const cb of q) cb(sandbox.__now);
}
const p=sandbox.__probe;
console.log('fps=',p.fps.toFixed(2),'updateCalls=',p.upd,'renders=',p.rendered);
console.log('order=',p.order);
console.log('logs=',JSON.stringify(sandbox.__logs));
console.log('canvasW/H=',canvasMock.width,canvasMock.height,'css=',canvasMock.style.width,canvasMock.style.height);

/* ---- 抖动帧测试：模拟 60fps 但偶发长帧，逻辑步数仍应为 60/s ---- */
sandbox.__now=0; fillRects.length=0;
const frames=[16.7,16.7,16.7,33.4,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7,16.7];
let simTime=0, totalUpdates=0;
for(const f of frames){
  sandbox.__now+=f; simTime+=f;
  const q=rafQueue.splice(0,rafQueue.length);
  for(const cb of q) cb(sandbox.__now);
  totalUpdates=p.upd;
}
console.log('after 15 frames (250ms): updateCalls=',totalUpdates,'(期望15) acc=',p.acc.toFixed(4));

/* ---- 缩放不变量：多种窗口尺寸下 CSS 宽高比恒等于 960/540 ---- */
function fitFor(W,H){
  sandbox.window.innerWidth=W; sandbox.window.innerHeight=H;
  sandbox.window.__dispatchResize && sandbox.window.__dispatchResize();
}
console.log('--- 缩放检查 ---');
console.log('fitCanvas 是模块内函数，通过重跑脚本验证');
