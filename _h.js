const fs=require('fs'), vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const listeners={};
const canvasMock={width:0,height:0,style:{},
  getContext(){return ctxMock;},
  addEventListener(t,f){ (listeners['canvas:'+t]=listeners['canvas:'+t]||[]).push(f); },
  getBoundingClientRect(){return {left:RECT.left, top:RECT.top, width:RECT.width, height:RECT.height};}};
const ctxMock={imageSmoothingEnabled:true,fillStyle:'',lineWidth:1,strokeStyle:'',
  fillRect(){},strokeRect(){},clearRect(){},save(){},restore(){},beginPath(){},arc(){},fill(){},drawImage(){}};
const RECT={left:100,top:50,width:1920,height:1080};
const sb={console:{log(...a){sb.__logs.push(a.join(' '));}},performance:{now:()=>0},requestAnimationFrame(){return 1;},
  document:{getElementById:id=>id==='game'?canvasMock:{innerHTML:'',textContent:''},addEventListener(){},
            createElement:()=>({getContext:()=>ctxMock,style:{}})},
  window:{innerWidth:2000,innerHeight:1200,addEventListener(t,f){(listeners['win:'+t]=listeners['win:'+t]||[]).push(f);}},
  Math:Math,Date:Date,JSON:JSON,String:String,Number:Number,Array:Array,Object:Object,parseInt:parseInt,parseFloat:parseFloat,isNaN:isNaN};
sb.__logs=[]; sb.globalThis=sb; vm.createContext(sb);
vm.runInContext(code+';globalThis.__x={player,cam,keys,hover,update,map,isSolid,boxHitsSolid,FARM,SPAWN,T,BOX_OFF_Y,FRAMES};', sb);
const X=sb.__x,P=X.player,CAM=X.cam,K=X.keys,DT=1/60,TILE=32,MW=64,MH=64;
let pass=0,fail=0;
const chk=(n,c,e)=>{ c?(pass++,console.log('  PASS  '+n+(e?'  ['+e+']':''))):(fail++,console.log('  FAIL  '+n+(e?'  ['+e+']':''))); };
const reset=(x,y)=>{P.x=x;P.y=y;P.vx=P.vy=0;P.frame=0;P.animT=0;for(const k in K)K[k]=false;};
const hold=(ks,n)=>{for(const k in K)K[k]=false;for(const k of ks)K[k]=true;for(let i=0;i<n;i++)X.update(DT);};
const tileAt=(x,y)=>X.map[y*MW+x];
function findTile(type,pred){for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++)if(tileAt(tx,ty)===type&&(!pred||pred(tx,ty)))return{tx,ty};return null;}

console.log('\n== 1. 斜向移动不加速 ==');
const sx=X.FARM.x+6, sy=X.FARM.y+8;
reset(sx*TILE+16, sy*TILE+16); hold(['d'],60);
const straight=Math.abs(P.x-(sx*TILE+16));
reset(sx*TILE+16, sy*TILE+16); hold(['d','s'],60);
const dx=P.x-(sx*TILE+16), dy=P.y-(sy*TILE+16), diag=Math.hypot(dx,dy);
chk('斜向位移 == 直行位移',Math.abs(diag-straight)<0.6,'straight='+straight.toFixed(2)+' diag='+diag.toFixed(2));
chk('斜向分量 = 速度/√2',Math.abs(Math.abs(dx)-straight/Math.SQRT2)<0.6&&Math.abs(Math.abs(dy)-straight/Math.SQRT2)<0.6,'dx='+dx.toFixed(2)+' dy='+dy.toFixed(2));

console.log('\n== 1b. Shift 奔跑 ×1.6 ==');
{
  /* 找一条连续 6 格空草地 */
  let ax=0,ay=0;
  for(let ty=2;ty<MH-2&&!ax;ty++)for(let tx=2;tx<MW-9;tx++){
    let ok=true;
    for(let k=0;k<6;k++) if(tileAt(tx+k,ty)!==X.T.GRASS) {ok=false;break;}
    if(ok){ax=tx;ay=ty;break;}
  }
  const X0=ax*TILE+16, Y0=ay*TILE+16;
  reset(X0,Y0); hold(['d'],60); const walk=Math.abs(P.x-X0);
  reset(X0,Y0); hold(['shift','d'],60); const run=Math.abs(P.x-X0);
  const ratio=run/walk;
  chk('奔跑速度 = 步行 × 1.6',Math.abs(ratio-1.6)<0.05,'walk='+walk.toFixed(1)+' run='+run.toFixed(1)+' ratio='+ratio.toFixed(3));
}

console.log('\n== 2. 碰撞：树/岩石/水/小屋 阻挡 + 沿墙滑动 ==');
for(const [nm,ty] of [['树',X.T.TREE],['岩石',X.T.ROCK],['水',X.T.WATER]]){
  const c=findTile(ty,(tx,y)=>tileAt(tx-1,y)===X.T.GRASS&&tileAt(tx-1,y-1)===X.T.GRASS&&tileAt(tx,y-1)===X.T.GRASS);
  if(!c){chk('找到'+nm,false);continue;}
  reset((c.tx-1)*TILE+16, c.ty*TILE+16);
  hold(['d'],60);
  const limit=c.tx*TILE-6;
  chk('撞'+nm+'无法穿过',P.x<=limit+0.01,'player.x='+P.x.toFixed(2)+' limit='+limit);
  const yB=P.y; hold(['w'],30);
  chk('贴着'+nm+'可沿墙滑动',P.y<yB-30&&P.x<=limit+0.01,'dy='+(P.y-yB).toFixed(2));
}
const hz=findTile(X.T.HOUSE);
reset((hz.tx-1)*TILE+16, hz.ty*TILE+16); hold(['d'],60);
chk('撞小屋无法穿过',P.x<=hz.tx*TILE-6+0.01,'player.x='+P.x.toFixed(2));
const sp=findTile(X.T.SHOP);
reset((sp.tx-1)*TILE+16, sp.ty*TILE+16); hold(['d'],60);
chk('撞商店无法穿过',P.x<=sp.tx*TILE-6+0.01,'player.x='+P.x.toFixed(2));

console.log('\n== 3. 边缘不越界 / 不卡死（随机浸泡） ==');
let viol=0, outside=0, nan=0, trials=0;
for(let trial=0;trial<60;trial++){
  /* 只在空地格上出生 */
  let tx,ty;
  do{ tx=1+((Math.random()*62)|0); ty=1+((Math.random()*62)|0); }while(tileAt(tx,ty)!==X.T.GRASS);
  reset(tx*TILE+16, ty*TILE+16);
  for(let i=0;i<200;i++){
    K['w']=Math.random()<0.25;K['s']=Math.random()<0.25;K['a']=Math.random()<0.25;K['d']=Math.random()<0.25;
    X.update(DT);
    if(X.boxHitsSolid(P.x,P.y+X.BOX_OFF_Y)) viol++;
    if(P.x<0||P.y<0||P.x>MW*TILE||P.y>MH*TILE) outside++;
    if(!isFinite(P.x)||!isFinite(P.y)) nan++;
  }
  trials++;
}
chk('12000 步内碰撞盒从未进入实心格',viol===0,'violations='+viol+' trials='+trials);
chk('位置从不越出地图范围',outside===0,'outside='+outside);
chk('位置始终有限（无 NaN / 卡死）',nan===0);

console.log('\n== 3b. 强制出生在障碍内 → 能自动脱困 ==');
const t2=findTile(X.T.TREE,(tx,ty)=>tileAt(tx+1,ty)===X.T.GRASS||tileAt(tx-1,ty)===X.T.GRASS||tileAt(tx,ty+1)===X.T.GRASS);
reset(t2.tx*TILE+16, t2.ty*TILE+16);
hold([],1);
chk('落在障碍内时自动脱困',!X.boxHitsSolid(P.x,P.y+X.BOX_OFF_Y),'pos='+P.x.toFixed(1)+','+P.y.toFixed(1));
hold([],10);
chk('脱困后保持稳定（不再抖动/卡死）',!X.boxHitsSolid(P.x,P.y+X.BOX_OFF_Y)&&isFinite(P.x),'pos='+P.x.toFixed(1)+','+P.y.toFixed(1));

console.log('\n== 4. 摄像机跟随 + 钳制 ==');
reset(X.SPAWN.x*TILE+16, X.SPAWN.y*TILE+16); hold(['d'],120);
chk('摄像机跟随玩家',Math.abs((CAM.x+480)-P.x)<40,'camCx='+(CAM.x+480).toFixed(1)+' px='+P.x.toFixed(1));
hold(['w'],900);
chk('摄像机钳制在地图内',CAM.x>=0&&CAM.y>=0&&CAM.x<=MW*TILE-960&&CAM.y<=MH*TILE-540,'cam=('+CAM.x.toFixed(1)+','+CAM.y.toFixed(1)+')');

console.log('\n== 5. 鼠标 → 瓦片换算（2 倍 CSS 缩放） ==');
(function(){
  const mms=listeners['canvas:mousemove']||[];
  const check=(lx,ly)=>{ mms.forEach(f=>f({clientX:RECT.left+lx*(RECT.width/960), clientY:RECT.top+ly*(RECT.height/540)}));
    return X.hover.tx===Math.floor((CAM.x+lx)/32)&&X.hover.ty===Math.floor((CAM.y+ly)/32); };
  chk('逻辑坐标(300,200)换算正确',check(300,200));
  chk('逻辑坐标(777,411)换算正确',check(777,411));
  chk('逻辑坐标(0,0)换算正确',check(0,0));
  chk('逻辑坐标(959,539)换算正确',check(959,539));
})();

console.log('\n== 6. 动画：4 方向 × 2 帧 / 静止回站立 ==');
chk('帧表 4 方向 × 2 帧',X.FRAMES.length===4&&X.FRAMES.every(f=>f.length===2));
reset(X.SPAWN.x*TILE+16, X.SPAWN.y*TILE+16);
hold(['d'],1); const f0=P.frame;
hold(['d'],7); const f1=P.frame;    // 累计 8 帧 = 0.133s > 1/8s → 应切换
hold(['d'],8); const f2=P.frame;    // 再 8 帧 → 再切一次
chk('行走时帧随时间切换',f0!==f1&&f1!==f2,'frames='+f0+','+f1+','+f2);
hold([],5);
chk('静止回到站立帧 0',P.frame===0);
const dirs=[];
for(const k of ['s','a','w','d']){reset(X.SPAWN.x*TILE+16,X.SPAWN.y*TILE+16);hold([k],2);dirs.push(P.dir);}
chk('四方向朝向不同',new Set(dirs).size===4,'dirs='+dirs.join(','));
chk('方向对应关系正确 (s,a,w,d)→(下,左,上,右)',dirs.join(',')==='0,1,3,2','dirs='+dirs.join(','));

console.log('\n== 7. 地图一致性 ==');
(function(){
  const a=Array.from(X.map);
  const sb2={console:{log(){}},performance:{now:()=>0},requestAnimationFrame(){return 1;},
    document:{getElementById:()=>canvasMock,addEventListener(){},createElement:()=>({getContext:()=>ctxMock,style:{}})},
    window:{innerWidth:2000,innerHeight:1200,addEventListener(){}},Math:Math,Date:Date,JSON:JSON,String:String,Number:Number,Array:Array,Object:Object,parseInt:parseInt,parseFloat:parseFloat,isNaN:isNaN};
  sb2.globalThis=sb2; vm.createContext(sb2);
  vm.runInContext(code+';globalThis.__m=map;', sb2);
  const b=Array.from(sb2.__m);
  let same=true; for(let i=0;i<a.length;i++) if(a[i]!==b[i]){same=false;break;}
  chk('同种子两次生成完全一致',same);
})();

console.log('\n结果: PASS='+pass+'  FAIL='+fail);
