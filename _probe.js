const {execFileSync}=require('child_process');const fs=require('fs'),os=require('os'),path=require('path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pf'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const base='E:/IdeaProjects/物理模拟';
const pre=`(function(){var t=0;window.requestAnimationFrame=function(cb){return setTimeout(function(){t+=1000/60;cb(t);},0);};
window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message));});
var RealAC=window.AudioContext;if(RealAC){window.AudioContext=function(){var ac=new RealAC();window.__ac=ac;return ac;};window.AudioContext.prototype=RealAC.prototype;}})();`;
const post=`(function(){
 function fix(){var c=document.getElementById('game');c.style.position='fixed';c.style.left='0px';c.style.top='0px';c.style.width='960px';c.style.height='540px';}
 setTimeout(fix,50);
 var c=document.getElementById('game');
 function move(lx,ly){c.dispatchEvent(new MouseEvent('mousemove',{clientX:lx,clientY:ly}));}
 function click(lx,ly){c.dispatchEvent(new MouseEvent('mousedown',{button:0,clientX:lx,clientY:ly,bubbles:true}));}
 function key(k){window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));}
 function findType(g,t){for(var ty=1;ty<63;ty++)for(var tx=1;tx<63;tx++){var i=ty*64+tx;
   if(g.map[i]!==t)continue; var n=[[1,0],[-1,0],[0,1],[0,-1]];
   for(var k2=0;k2<4;k2++){var j=(ty+n[k2][1])*64+(tx+n[k2][0]);if(g.map[j]===0)return{tx:tx,ty:ty,px:tx+n[k2][0],py:ty+n[k2][1]};}}
   return null;}
 function tp(g,f){ g.player.x=(f.px+0.5)*32; g.player.y=(f.py+0.5)*32; }
 function clickWorld(g,tx,ty){ var sx=(tx+0.5)*32-g.cam.x, sy=(ty+0.5)*32-g.cam.y; move(sx,sy); click(sx,sy); }

 setTimeout(function(){ var g=window.__game;
   window.__f1=findType(g,3); window.__f2=findType(g,4); tp(g,window.__f1); },300);
 setTimeout(function(){ var g=window.__game; key('3'); clickWorld(g,window.__f1.tx,window.__f1.ty); },1100);
 setTimeout(function(){ var g=window.__game; tp(g,window.__f2); },1400);
 setTimeout(function(){ var g=window.__game; key('4'); clickWorld(g,window.__f2.tx,window.__f2.ty); },2200);
 setTimeout(function(){ var g=window.__game; var f=window.__f2; key('1'); clickWorld(g,f.px,f.py); },2500);
 setTimeout(function(){
   var ts=[].map.call(document.getElementById('toasts').children,function(e){return e.textContent;});
   var g=window.__game;
   var o=document.createElement('div');o.id='__OUT';
   o.textContent=JSON.stringify({errs:window.__errs,toasts:ts,
     wood:g.resources.wood,stone:g.resources.stone,
     audio:window.__ac?window.__ac.state:'none',
     stats:document.getElementById('stats').textContent});
   document.body.appendChild(o);
 },2900);
})();`;
let html=fs.readFileSync(base+'/index.html','utf8');
html=html.replace('DEBUG_HOOK: false','DEBUG_HOOK: true');
html=html.replace('<script>','<script>'+pre+'</script>\n<script>').replace('</body>','<script>'+post+'</script></body>');
fs.writeFileSync(base+'/_p.html',html);
execFileSync(chrome,['--headless=new','--disable-gpu','--window-size=1000,620','--force-device-scale-factor=1','--user-data-dir='+dir,'--virtual-time-budget=2900','--screenshot='+base+'/_shot.png','file:///E:/IdeaProjects/%E7%89%A9%E7%90%86%E6%A8%A1%E6%8B%9F/_p.html']);
const out=execFileSync(chrome,['--headless=new','--disable-gpu','--window-size=1000,620','--force-device-scale-factor=1','--user-data-dir='+dir,'--virtual-time-budget=4200','--dump-dom','file:///E:/IdeaProjects/%E7%89%A9%E7%90%86%E6%A8%A1%E6%8B%9F/_p.html'],{encoding:'utf8',maxBuffer:1<<26});
const m=out.match(/id="__OUT">([\s\S]*?)<\/div>/);
if(m){const o=JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
 console.log('errs:',JSON.stringify(o.errs));
 console.log('提示条:',JSON.stringify(o.toasts));
 console.log('木材',o.wood,'石材',o.stone,'| 音频状态:',o.audio);
 console.log('--- 面板 ---\n'+o.stats.replace(/\\n/g,'\n'));}
else console.log('NO OUTPUT');
fs.rmSync(base+'/_p.html',{force:true});fs.rmSync(dir,{recursive:true,force:true});
