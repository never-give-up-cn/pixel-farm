const {execFileSync}=require('child_process');
const fs=require('fs'),os=require('os'),path=require('path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pfshot'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const fake=`
(function(){
  var t=0;
  window.requestAnimationFrame=function(cb){ return setTimeout(function(){ t+=1000/60; cb(t); }, 0); };
  window.__errors=[];
  window.addEventListener('error',function(e){window.__errors.push(String(e.message));});
})();
`;
let html=fs.readFileSync('index.html','utf8');
html=html.replace('<script>', '<script>'+fake+'\n</script>\n<script>');
fs.writeFileSync('_shot.html',html);
for(const [w,h,name] of [[1920,1080,'_s_1920.png'],[1366,768,'_s_1366.png'],[800,600,'_s_800.png']]){
  execFileSync(chrome,['--headless=new','--disable-gpu','--window-size='+w+','+h,'--user-data-dir='+dir,
    '--virtual-time-budget=6000','--screenshot='+name,'file:///E:/IdeaProjects/%E7%89%A9%E7%90%86%E6%A8%A1%E6%8B%9F/_shot.html']);
  const st=fs.statSync(name);
  console.log(name, w+'x'+h, st.size+' bytes');
}
fs.rmSync('_shot.html',{force:true}); fs.rmSync('_shot.js',{force:true});
fs.rmSync(dir,{recursive:true,force:true});
