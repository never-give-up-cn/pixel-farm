const fs=require('fs'), vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const rects=[];
const ctxMock={ imageSmoothingEnabled:true, fillStyle:'',
  fillRect(x,y,w,h){ rects.push({x,y,w,h,c:this.fillStyle}); } };
const canvasMock={width:0,height:0,style:{},getContext(){return ctxMock;},addEventListener(){}};
const sandbox={ console:{log(){}}, performance:{now:()=>0}, requestAnimationFrame(){},
  document:{getElementById:id=>id==='game'?canvasMock:null, addEventListener(){}, createElement:()=>({getContext:()=>ctxMock,style:{}})},
  window:{innerWidth:1920,innerHeight:1080,addEventListener(){}}, Math,Date,JSON,String,Number,Array,Object,parseInt,parseFloat,isNaN };
sandbox.globalThis=sandbox; vm.createContext(sandbox);
vm.runInContext(code+'; globalThis.__dp=drawPlayer; globalThis.__ctx=ctx;', sandbox);
sandbox.__dp(ctxMock);
// 只看角色区域（CHAR_SCALE=2，中心 480,270 → 区域 464..496 x 246..294）
const S=2, X0=480-16, Y0=270-24;
const grid=[];
for(let r=0;r<24;r++){ let line=''; for(let c=0;c<16;c++) line+='.'; grid.push(line); }
const chars={};
for(const rc of rects){
  if(rc.c===sandbox.CONFIG_COLORS_SHADOW||rc.c==='rgba(0,0,0,0.40)') continue;
  const chx=Math.floor((rc.x-X0)/S), chy=Math.floor((rc.y-Y0)/S);
  const w=Math.max(1,Math.round(rc.w/S)), h=Math.max(1,Math.round(rc.h/S));
  let key=Object.keys(chars).find(k=>chars[k]===rc.c)||null;
  if(!key){ key=String.fromCharCode(97+Object.keys(chars).length); chars[key]=rc.c; }
  for(let r=0;r<h;r++) for(let c=0;c<w;c++){
    const y=chy+r, x=chx+c;
    if(y>=0&&y<24&&x>=0&&x<16) grid[y]=grid[y].slice(0,x)+key+grid[y].slice(x+1);
  }
}
console.log('图例:', JSON.stringify(chars));
console.log(grid.map((l,i)=>String(i).padStart(2)+' '+l).join('\n'));
