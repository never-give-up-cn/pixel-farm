const {execFileSync}=require('child_process');const fs=require('fs'),os=require('os'),path=require('path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pf'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const base='E:/IdeaProjects/物理模拟';
const pre='(function(){var t=0;window.requestAnimationFrame=function(cb){return setTimeout(function(){t+=1000/60;cb(t);},0);};window.__errs=[];window.addEventListener("error",function(e){window.__errs.push(String(e.message));});})();';
const post=`(function(){
 setTimeout(function(){var c=document.getElementById('game');c.style.position='fixed';c.style.left='0px';c.style.top='0px';c.style.width='960px';c.style.height='540px';},50);
 function mouse(lx,ly){var c=document.getElementById('game');c.dispatchEvent(new MouseEvent('mousemove',{clientX:lx,clientY:ly}));}
 setTimeout(function(){mouse(470,270);},400);
 setTimeout(function(){window.dispatchEvent(new KeyboardEvent('keydown',{key:'d'}));},700);
 setTimeout(function(){window.dispatchEvent(new KeyboardEvent('keyup',{key:'d'}));},1400);
 setTimeout(function(){mouse(500,320);},1600);
 setTimeout(function(){var o=document.createElement('div');o.id='__OUT';o.textContent=JSON.stringify({errs:window.__errs,stats:document.getElementById('stats').textContent});document.body.appendChild(o);},2400);
})();`;
let html=fs.readFileSync(base+'/index.html','utf8').replace('<script>','<script>'+pre+'</script>\n<script>').replace('</body>','<script>'+post+'</script></body>');
fs.writeFileSync(base+'/_pf.html',html);
execFileSync(chrome,['--headless=new','--disable-gpu','--window-size=1000,620','--force-device-scale-factor=1','--user-data-dir='+dir,'--virtual-time-budget=3500','--screenshot='+base+'/_shot5.png','file:///E:/IdeaProjects/%E7%89%A9%E7%90%86%E6%A8%A1%E6%8B%9F/_pf.html']);
const out=execFileSync(chrome,['--headless=new','--disable-gpu','--window-size=1000,620','--force-device-scale-factor=1','--user-data-dir='+dir,'--virtual-time-budget=3500','--dump-dom','file:///E:/IdeaProjects/%E7%89%A9%E7%90%86%E6%A8%A1%E6%8B%9F/_pf.html'],{encoding:'utf8',maxBuffer:1<<26});
const m=out.match(/id="__OUT">([\s\S]*?)<\/div>/);console.log(m?m[1]:'NO');
const zdir=fs.mkdtempSync(path.join(os.tmpdir(),'pz'));
fs.writeFileSync(zdir+'/z.html','<body style="margin:0;background:#111"><img src="file:///E:/IdeaProjects/%E7%89%A9%E7%90%86%E6%A8%A1%E6%8B%9F/_shot5.png" style="position:absolute;left:0;top:0;width:6000px;image-rendering:pixelated"></body>');
execFileSync(chrome,['--headless=new','--disable-gpu','--window-size=620,220','--force-device-scale-factor=1','--user-data-dir='+zdir,'--virtual-time-budget=2500','--screenshot='+base+'/_zoom.png','file:///'+zdir.split(path.sep).join('/')+'/z.html']);
fs.rmSync(base+'/_pf.html',{force:true});fs.rmSync(base+'/_final2.js',{force:true});
fs.rmSync(dir,{recursive:true,force:true});fs.rmSync(zdir,{recursive:true,force:true});
