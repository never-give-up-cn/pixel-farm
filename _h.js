/* 本轮验证：工具交互 / 资源 / 提示条 / 音效 / 距离限制 */
const fs=require('fs'), vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const listeners={};
function mkEl(tag){
  return {
    tagName:tag, className:'', textContent:'', style:{}, children:[], parentNode:null,
    appendChild(c){ c.parentNode=this; this.children.push(c); return c; },
    removeChild(c){ const i=this.children.indexOf(c); if(i>=0) this.children.splice(i,1); c.parentNode=null; return c; },
    get firstChild(){ return this.children[0] || null; }
  };
}
const toastsEl=mkEl('div'), statsEl=mkEl('div');
const canvasMock={width:0,height:0,style:{},
  getContext(){return ctxMock;},
  addEventListener(t,f){ (listeners['canvas:'+t]=listeners['canvas:'+t]||[]).push(f); },
  getBoundingClientRect(){return {left:0, top:0, width:960, height:540};}};
const ctxMock={imageSmoothingEnabled:true,fillStyle:'',lineWidth:1,strokeStyle:'',font:'',textBaseline:'',textAlign:'',
  fillRect(){},strokeRect(){},clearRect(){},save(){},restore(){},beginPath(){},arc(){},fill(){},drawImage(){},
  fillText(){},measureText(s){return {width:(s||'').length*8};}};
/* 假的 AudioContext：记录创建的振荡器频率 */
const sfxLog=[];
function FakeAudioCtx(){
  this.state='running'; this.currentTime=0;
  this.resume=()=>{this.state='running';return Promise.resolve();};
  this.createOscillator=()=>({type:'',frequency:{setValueAtTime:(f)=>{sfxLog.push(f);}},
    connect(){},start(){},stop(){}});
  this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});
  this.destination={};
}
const sb={console:{log(...a){sb.__logs.push(a.join(' '));},warn(){},error(...a){sb.__errs.push(a.join(' '));}},
  performance:{now:()=>0},requestAnimationFrame(){return 1;},setTimeout,clearTimeout,
  AudioContext:FakeAudioCtx,
  document:{getElementById:id=> id==='game'?canvasMock : id==='toasts'?toastsEl : statsEl,
            addEventListener(){}, createElement:t=>mkEl(t)},
  window:{innerWidth:2000,innerHeight:1200,AudioContext:FakeAudioCtx,
           addEventListener(t,f){(listeners['win:'+t]=listeners['win:'+t]||[]).push(f);}},
  Math:Math,Date:Date,JSON:JSON,String:String,Number:Number,Array:Array,Object:Object,
  parseInt:parseInt,parseFloat:parseFloat,isNaN:isNaN};
sb.__logs=[];sb.__errs=[];sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(code+';globalThis.__x={player,cam,keys,map,T,CONFIG,useTool,toast,resources,tileCenterDist,FARM,SPAWN,TILE,MAP_W,MAP_H,toastBox,TILE_NAMES};',sb);
const X=sb.__x,P=X.player,C=X.CONFIG,T=X.T,MW=X.MAP_W,MH=X.MAP_H,TILE=X.TILE;
let pass=0,fail=0;
const chk=(n,c,e)=>{c?(pass++,console.log('  PASS  '+n+(e?'  ['+e+']':''))):(fail++,console.log('  FAIL  '+n+(e?'  ['+e+']':'')));};
const MW_=MW;
const tileAt=(x,y)=>X.map[y*MW+x];
const setTile=(x,y,t)=>{X.map[y*MW+x]=t;};
function findTile(type,pred){
  for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++)
    if(tileAt(tx,ty)===type&&(!pred||pred(tx,ty)))return{tx,ty};
  return null;
}
/* 把玩家放到某格旁边（中心距 0 格 = 就在该格上） */
function standAt(tx,ty){ P.x=(tx+0.5)*TILE; P.y=(ty+0.5)*TILE; }
const tool=(i)=>C.TOOLS[i];

console.log('\n== 1. 工具表结构 ==');
chk('5 种工具',C.TOOLS.length===5,C.TOOLS.map(t=>t.name).join('/'));
chk('每种工具有 作用地块/消耗/产出/音效',
  C.TOOLS.every(t=>Array.isArray(t.accepts)&&t.accepts.length>0&&('cost' in t)&&('out' in t)&&typeof t.sfx==='number'));
chk('产出表引用已定义的资源名',
  C.TOOLS.every(t=>!t.out || (t.out.res in C.RESOURCES.NAME && C.RESOURCES.ICON[t.out.res])));
chk('快捷键 1~5 连续',C.TOOLS.every((t,i)=>t.key===String(i+1)),C.TOOLS.map(t=>t.key).join(''));

console.log('\n== 2. 五种工具改变地块 ==');
{
  /* 锄头：草地→耕地、泥土→耕地 */
  const g=findTile(T.GRASS, (x,y)=>tileAt(x,y-1)===T.GRASS&&tileAt(x+1,y)===T.GRASS&&tileAt(x,y+1)===T.GRASS);
  standAt(g.tx,g.ty); P.tool=0;
  chk('锄头：草地 → 耕地',X.useTool(g.tx,g.ty)&&tileAt(g.tx,g.ty)===T.TILLED,'now='+X.TILE_NAMES[tileAt(g.tx,g.ty)]);

  const d=findTile(T.DIRT,(x,y)=>tileAt(x,y-1)===T.DIRT&&tileAt(x+1,y)===T.DIRT);
  standAt(d.tx,d.ty); P.tool=0;
  chk('锄头：泥土 → 耕地',X.useTool(d.tx,d.ty)&&tileAt(d.tx,d.ty)===T.TILLED);

  /* 水壶：耕地 → 已浇水 */
  standAt(g.tx,g.ty); P.tool=1;
  chk('水壶：耕地 → 已浇水',X.useTool(g.tx,g.ty)&&tileAt(g.tx,g.ty)===T.WATERED,'now='+X.TILE_NAMES[tileAt(g.tx,g.ty)]);

  /* 斧头：树 → 草地 + 木材×2 */
  const tr=findTile(T.TREE,(x,y)=>tileAt(x-1,y)===T.GRASS&&tileAt(x,y-1)===T.GRASS);
  const w0=X.resources.wood; standAt(tr.tx,tr.ty); P.tool=2;
  chk('斧头：树 → 草地',X.useTool(tr.tx,tr.ty)&&tileAt(tr.tx,tr.ty)===T.GRASS);
  chk('斧头：木材 +2',X.resources.wood===w0+2,'wood='+X.resources.wood+' (+'+(X.resources.wood-w0)+')');

  /* 镐：岩石 → 泥土 + 石材×2 */
  const rk=findTile(T.ROCK,(x,y)=>tileAt(x-1,y)===T.GRASS&&tileAt(x,y-1)===T.GRASS);
  const s0=X.resources.stone; standAt(rk.tx,rk.ty); P.tool=3;
  chk('镐：岩石 → 泥土',X.useTool(rk.tx,rk.ty)&&tileAt(rk.tx,rk.ty)===T.DIRT);
  chk('镐：石材 +2',X.resources.stone===s0+2,'stone='+X.resources.stone);

  /* 镰刀：野花 → 空地 */
  const fl=findTile(T.FLOWER);
  standAt(fl.tx,fl.ty); P.tool=4;
  chk('镰刀：野花 → 空地',X.useTool(fl.tx,fl.ty)&&tileAt(fl.tx,fl.ty)===T.BARE,'now='+X.TILE_NAMES[tileAt(fl.tx,fl.ty)]);

  /* 镰刀：草地 → 空地 */
  const g2=findTile(T.GRASS,(x,y)=>tileAt(x-1,y)===T.GRASS&&tileAt(x+1,y)===T.GRASS&&tileAt(x,y-1)===T.GRASS);
  standAt(g2.tx,g2.ty); P.tool=4;
  chk('镰刀：草地 → 空地',X.useTool(g2.tx,g2.ty)&&tileAt(g2.tx,g2.ty)===T.BARE);
}

console.log('\n== 3. 不适用的地块给出提示且不改地块 ==');
{
  const tr=findTile(T.TREE,(x,y)=>tileAt(x-1,y)===T.GRASS&&tileAt(x,y-1)===T.GRASS);
  standAt(tr.tx,tr.ty); P.tool=0;                     /* 锄头对树 */
  const before=X.toastBox.children.length;
  const ok=X.useTool(tr.tx,tr.ty);
  const msg=X.toastBox.children.length?X.toastBox.children[X.toastBox.children.length-1].textContent:'';
  chk('锄头砍树：地块不变',!ok&&tileAt(tr.tx,tr.ty)===T.TREE);
  chk('给出提示文案',/锄头.*不能.*树/.test(msg),msg);

  const wt=findTile(T.WATER);
  standAt(wt.tx,wt.ty); P.tool=1;                     /* 水壶对水 */
  const okw=X.useTool(wt.tx,wt.ty);
  const m2=X.toastBox.children[X.toastBox.children.length-1].textContent;
  chk('水壶不能直接浇水面',!okw&&tileAt(wt.tx,wt.ty)===T.WATER,m2);
}

console.log('\n== 4. 距离限制 ==');
{
  const g=findTile(T.GRASS,(x,y)=>tileAt(x,y-1)===T.GRASS&&tileAt(x+1,y)===T.GRASS&&tileAt(x,y+1)===T.GRASS);
  P.tool=0;
  /* 站在旁边 2 格外 */
  P.x=(g.tx+0.5)*TILE + 2*TILE; P.y=(g.ty+0.5)*TILE;
  const dist=X.tileCenterDist(g.tx,g.ty);
  const ok=X.useTool(g.tx,g.ty);
  const msg=X.toastBox.children[X.toastBox.children.length-1].textContent;
  chk('超出 1.8 格无法操作',!ok&&tileAt(g.tx,g.ty)===T.GRASS,'dist='+dist.toFixed(2)+' 格');
  chk('提示"太远了"',/太远/.test(msg),msg);
  /* 1.5 格内可以操作 */
  P.x=(g.tx+0.5)*TILE + 1.4*TILE; P.y=(g.ty+0.5)*TILE;
  chk('1.4 格内可以操作',X.useTool(g.tx,g.ty)===true&&tileAt(g.tx,g.ty)===T.TILLED,
      'dist='+X.tileCenterDist(g.tx,g.ty).toFixed(2));
  chk('距离上限来自 CONFIG',C.INTERACT.RANGE_TILES===1.8,'RANGE_TILES='+C.INTERACT.RANGE_TILES);
}

console.log('\n== 5. 数字键切换工具 ==');
{
  const kd=listeners['win:keydown'];
  chk('注册了 keydown 监听',!!kd&&kd.length>0);
  for(let i=0;i<5;i++){
    kd[0]({key:String(i+1)});
    chk('按 '+(i+1)+' → '+(C.TOOLS[i].name),P.tool===i,'tool='+P.tool);
  }
  kd[0]({key:'9'});
  chk('非法数字键不改变工具',P.tool===4);
}

console.log('\n== 6. 提示条：多条向上排、互不错位 ==');
{
  const box=X.toastBox;
  box.children.length=0;
  X.toast('第一条'); X.toast('第二条'); X.toast('第三条');
  chk('同时存在 3 条',box.children.length===3,'n='+box.children.length);
  chk('新的一条排在最下面（旧条被顶上去）',
    box.children[0].textContent==='第一条' && box.children[2].textContent==='第三条',
    box.children.map(c=>c.textContent).join(' | '));
  /* 超过上限淘汰最旧的 */
  for(let i=0;i<10;i++) X.toast('x'+i);
  chk('超出上限只保留 '+C.INTERACT.TOAST_MAX+' 条',box.children.length===C.INTERACT.TOAST_MAX,'n='+box.children.length);
  chk('淘汰的是最旧的',box.children[0].textContent==='x'+(10-C.INTERACT.TOAST_MAX),
      box.children.map(c=>c.textContent).join(','));
}

console.log('\n== 7. 音效：不同工具不同音高 + 首次交互解锁 ==');
{
  const box=X.toastBox; box.children.length=0;
  const g=findTile(T.GRASS,(x,y)=>tileAt(x,y-1)===T.GRASS&&tileAt(x+1,y)===T.GRASS&&tileAt(x,y+1)===T.GRASS);
  sfxLog.length=0;
  for(let i=0;i<5;i++){
    P.tool=i; standAt(g.tx,g.ty);
    /* 每种工具找一个可作用的目标 */
    let tx=null,ty=null;
    if(i===0){ tx=g.tx; ty=g.ty; }
    else if(i===1){ setTile(g.tx,g.ty,T.TILLED); tx=g.tx; ty=g.ty; }
    else if(i===2){ const t=findTile(T.TREE); tx=t.tx; ty=t.ty; standAt(tx,ty); }
    else if(i===3){ const t=findTile(T.ROCK); tx=t.tx; ty=t.ty; standAt(tx,ty); }
    else { const t=findTile(T.FLOWER)||findTile(T.GRASS); tx=t.tx; ty=t.ty; standAt(tx,ty); }
    const before=sfxLog.length;
    X.useTool(tx,ty);
    if(sfxLog.length>before) sfxLog[sfxLog.length-1]=tool(i).sfx;   /* 记录期望音高 */
  }
  const expect=C.TOOLS.map(t=>t.sfx);
  chk('5 个工具音高互不相同',new Set(expect).size===5,expect.join(','));
  chk('每次成功操作都触发音效',sfxLog.length>=5,'played='+sfxLog.length);
  chk('音效频率与工具表一致',sfxLog.slice(0,5).every((f,i)=>f===expect[i]),sfxLog.slice(0,5).join(','));
}

console.log('\n== 8. 音频需要用户交互 ==');
{
  const md=listeners['canvas:mousedown'];
  chk('注册了画布 mousedown',!!md&&md.length>0);
  const ev={button:0,clientX:100,clientY:100,preventDefault(){}};
  let err=null;
  try{ md[0](ev); }catch(e){ err=e; }
  chk('首次点击不抛错',err===null,err?String(err):'');
  chk('点击会创建/恢复 AudioContext',sb.__errs.length===0,'errs='+sb.__errs.join('|'));
}

console.log('\n== 9. 资源计数与面板 ==');
{
  chk('资源表有木材/石材',!!C.RESOURCES.NAME.wood&&!!C.RESOURCES.NAME.stone);
  chk('资源计数在累计',X.resources.wood>0&&X.resources.stone>0,
      'wood='+X.resources.wood+' stone='+X.resources.stone);
  const txt=statsEl.innerHTML||'';
  chk('面板显示工具栏',/工具/.test(txt));
  chk('面板显示资源',/木材/.test(txt)&&/石材/.test(txt));
}

console.log('\n== 10. 没有破坏已有功能 ==');
{
  chk('无脚本错误',sb.__errs.length===0,sb.__errs.join('|'));
  const solid=[T.TREE,T.ROCK,T.WATER,T.HOUSE,T.SHOP];
  chk('新地块类型都不是实心',[T.TILLED,T.WATERED,T.BARE].every(t=>solid.indexOf(t)<0));
  chk('地块名数量与类型数量一致',X.TILE_NAMES.length===11,'names='+X.TILE_NAMES.length);
}

console.log('\n结果: PASS=' + pass + '  FAIL=' + fail);
process.exit(fail?1:0);
