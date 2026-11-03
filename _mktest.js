const fs=require('fs');
const src=fs.readFileSync('E:/IdeaProjects/物理模拟/index.html','utf8');

// 1) capture errors
let out = src.replace('<body>', `<body>
<script>
window.__errs=[];
window.addEventListener('error',e=>window.__errs.push('ERROR: '+e.message+' @line '+e.lineno+':'+e.colno));
window.addEventListener('unhandledrejection',e=>window.__errs.push('REJECT: '+e.reason));
const _ce=console.error, _cw=console.warn;
console.error=function(){window.__errs.push('CONSOLE.ERROR: '+Array.from(arguments).map(String).join(' '));_ce.apply(console,arguments)};
console.warn=function(){window.__errs.push('CONSOLE.WARN: '+Array.from(arguments).map(String).join(' '));_cw.apply(console,arguments)};
</script>`);

// 2) expose internals for testing
out = out.replace('</script>\n</body>', `
window.__G={get state(){return state},get player(){return player},get ground(){return ground},get obj(){return obj},get objHp(){return objHp},
 get cropType(){return cropType},get cropGrowth(){return cropGrowth},get cropWater(){return cropWater},get cropDead(){return cropDead},
 get chests(){return chests},get cam(){return cam},CONFIG:CONFIG,T:T,OB:OB,CROPS:CROPS,ITEMS:ITEMS,
 leftClick:leftClick,rightClick:rightClick,giveItem:giveItem,takeItem:takeItem,sleep:sleep,nextDay:nextDay,
 openShop:openShop,openInventory:openInventory,closeOverlay:closeOverlay,saveGame:saveGame,loadGame:loadGame,
 invCount:invCount,priceOf:priceOf,buyItem:buyItem,sellItem:sellItem,craftItem:craftItem,
 toast:toast,refHot:refreshHotbar};
</script>
</body>`);

const test = `
<script>
(function(){
  const R=[]; const ok=(n,c,extra)=>R.push((c?'PASS':'FAIL')+' | '+n+(extra!==undefined?(' | '+extra):''));
  function log(){ document.title = R.join('\\n')+'\\n---ERRORS---\\n'+window.__errs.join('\\n'); }
  setTimeout(function(){
    try{
      const G=window.__G; if(!G){ R.push('FAIL | no __G'); return log(); }
      const T=G.T, OB=G.OB, TS=G.CONFIG.TILE, MW=G.CONFIG.MAP_W, MH=G.CONFIG.MAP_H;

      // --- boot ---
      ok('boot: no errors', window.__errs.length===0, window.__errs.join(' ; '));
      ok('boot: day=1', G.state.day===1, G.state.day);
      ok('boot: gold', G.state.gold===G.CONFIG.START_GOLD, G.state.gold);
      ok('boot: hoe+can in inv', G.invCount('hoe')===1 && G.invCount('can')===1);
      ok('boot: stamina full', G.player.stamina===G.CONFIG.STAMINA_MAX, G.player.stamina);
      ok('boot: water full', G.player.water===G.CONFIG.CAN_CAP);

      // --- map generation ---
      let grass=0,tree=0,rock=0,water=0,house=0,shop=0,flower=0,bush=0,path=0;
      for(let i=0;i<MW*MH;i++){
        if(G.ground[i]===T.GRASS)grass++;
        if(G.ground[i]===T.WATER)water++;
        if(G.ground[i]===T.PATH)path++;
        if(G.obj[i]===OB.TREE)tree++;
        if(G.obj[i]===OB.ROCK)rock++;
        if(G.obj[i]===OB.HOUSE)house++;
        if(G.obj[i]===OB.SHOP)shop++;
        if(G.obj[i]===OB.FLOWER)flower++;
        if(G.obj[i]===OB.BUSH)bush++;
      }
      ok('map: trees', tree>50, tree);
      ok('map: rocks', rock>20, rock);
      ok('map: water', water>30, water);
      ok('map: flowers+bush', flower>10&&bush>10, flower+'/'+bush);
      ok('map: house tiles', house===6, house);
      ok('map: shop tiles', shop===4, shop);
      ok('map: path', path>5, path);
      // central 12x12 clear of trees/rocks/water
      let bad=0;
      const CX=Math.floor(MW/2), CY=Math.floor(MH/2);
      for(let ty=CY-1;ty<CY+11;ty++)for(let tx=CX-6;tx<CX+6;tx++){
        const i=ty*MW+tx;
        if(G.obj[i]===OB.TREE||G.obj[i]===OB.ROCK||G.ground[i]===T.WATER)bad++;
      }
      ok('map: central 12x12 tillable', bad===0, 'blocked='+bad);

      // --- find a free farm tile ---
      let ft=null;
      for(let ty=CY;ty<CY+10&&!ft;ty++)for(let tx=CX-5;tx<CX+5;tx++){
        const i=ty*MW+tx;
        if(G.ground[i]===T.GRASS&&G.obj[i]===OB.NONE){ ft={tx:tx,ty:ty,i:i}; break; }
      }
      ok('farm: found tillable tile', !!ft);

      // --- till with hoe ---
      G.player.sel=0; // hoe
      G.player.x=ft.tx*TS+TS/2; G.player.y=ft.ty*TS+TS/2;
      G.leftClick(ft.tx,ft.ty);
      ok('hoe: tilled', G.ground[ft.i]===T.TILLED, G.ground[ft.i]);
      ok('hoe: stamina -3', G.player.stamina===G.CONFIG.STAMINA_MAX-3, G.player.stamina);

      // --- plant radish (season check) ---
      G.giveItem('seed_radish',3);
      let seedSlot=G.player.inv.findIndex(s=>s&&s.id==='seed_radish');
      G.player.sel=seedSlot;
      G.leftClick(ft.tx,ft.ty);
      ok('seed: planted', G.cropType[ft.i]===1, G.cropType[ft.i]);
      ok('seed: consumed', G.invCount('seed_radish')===2, G.invCount('seed_radish'));

      // --- water ---
      const canSlot=G.player.inv.findIndex(s=>s&&s.id==='can');
      G.player.sel=canSlot;
      G.leftClick(ft.tx,ft.ty);
      ok('can: watered', G.cropWater[ft.i]===1);
      ok('can: consumed 1', G.player.water===G.CONFIG.CAN_CAP-1, G.player.water);
      ok('can: stamina -1', G.player.stamina===G.CONFIG.STAMINA_MAX-4, G.player.stamina);

      // --- grow over days ---
      const before=G.cropGrowth[ft.i];
      G.nextDay();
      ok('growth: +1 day after watering', G.cropGrowth[ft.i]===before+10, G.cropGrowth[ft.i]);
      ok('nextDay: day=2', G.state.day===2);
      ok('nextDay: stamina restored', G.player.stamina===G.CONFIG.STAMINA_MAX);
      ok('nextDay: watered flag cleared', G.cropWater[ft.i]===0 || G.state.weather==='rain', G.state.weather);

      // no water -> no growth
      const g2=G.cropGrowth[ft.i];
      G.cropWater[ft.i]=0;   // 该天没浇水
      G.nextDay();
      ok('growth: paused without water', G.cropGrowth[ft.i]===g2, G.cropGrowth[ft.i]);

      // --- harvest (mature radish = 3 days) ---
      G.player.x=ft.tx*TS+TS/2; G.player.y=ft.ty*TS+TS/2;
      G.cropGrowth[ft.i]=30;
      G.giveItem('sickle',1);
      const sickSlot=G.player.inv.findIndex(s=>s&&s.id==='sickle');
      G.player.sel=sickSlot;
      G.leftClick(ft.tx,ft.ty);
      ok('harvest: got radish', G.invCount('radish')===1, G.invCount('radish'));
      ok('harvest: tile cleared', G.cropType[ft.i]===0);

      // --- chop tree ---
      let ti=-1;
      for(let i=0;i<MW*MH;i++) if(G.obj[i]===OB.TREE){ ti=i; break; }
      G.player.x=(ti%MW)*TS+TS/2; G.player.y=Math.floor(ti/MW)*TS+TS/2;
      G.giveItem('axe',1);
      G.player.sel=G.player.inv.findIndex(s=>s&&s.id==='axe');
      G.leftClick(ti%MW, Math.floor(ti/MW));
      G.leftClick(ti%MW, Math.floor(ti/MW));
      G.leftClick(ti%MW, Math.floor(ti/MW));
      ok('axe: tree felled', G.obj[ti]===OB.NONE, G.objHp[ti]);
      ok('axe: got wood', G.invCount('wood')>=1, G.invCount('wood'));
      ok('axe: stamina -12', G.player.stamina===G.CONFIG.STAMINA_MAX-13, G.player.stamina);

      // --- mining ---
      let ri=-1;
      for(let i=0;i<MW*MH;i++) if(G.obj[i]===OB.ROCK){ ri=i; break; }
      G.player.x=(ri%MW)*TS+TS/2; G.player.y=Math.floor(ri/MW)*TS+TS/2;
      G.giveItem('pick',1);
      G.player.sel=G.player.inv.findIndex(s=>s&&s.id==='pick');
      G.leftClick(ri%MW, Math.floor(ri/MW));
      G.leftClick(ri%MW, Math.floor(ri/MW));
      G.leftClick(ri%MW, Math.floor(ri/MW));
      ok('pick: rock broken', G.obj[ri]===OB.NONE, G.objHp[ri]);
      ok('pick: got stone', G.invCount('stone')>=1, G.invCount('stone'));

      // --- shop: buy seed, sell crop ---
      G.state.gold=1000;
      const gold0=G.state.gold;
      G.buyItem('seed_tomato',30,5);
      ok('shop: buy seed', G.invCount('seed_tomato')===5, G.invCount('seed_tomato'));
      ok('shop: gold deducted', G.state.gold===gold0-150, G.state.gold);
      G.giveItem('radish',2);
      const g1=G.state.gold; G.sellItem('radish',2);
      ok('shop: sell crop', G.state.gold>g1, G.state.gold);
      ok('shop: price calc', G.priceOf('radish')>0, G.priceOf('radish'));

      // --- crafting ---
      G.giveItem('wood',10); G.giveItem('stone',10);
      const fc=G.state.gold;
      G.craftItem({id:'fence',cost:{wood:2}});
      ok('craft: fence', G.invCount('fence')===1 && G.invCount('wood')===9, G.invCount('wood'));

      // --- place / remove ---
      G.player.x=ft.tx*TS+TS/2; G.player.y=ft.ty*TS+TS/2;
      G.player.sel=G.player.inv.findIndex(s=>s&&s.id==='fence');
      G.leftClick(ft.tx,ft.ty);
      ok('place: fence on tilled', G.obj[ft.i]===OB.FENCE, G.obj[ft.i]);
      G.rightClick(ft.tx,ft.ty);
      ok('remove: fence back', G.obj[ft.i]===OB.NONE && G.invCount('fence')===1, G.invCount('fence'));

      // --- chest ---
      G.giveItem('chest',1);
      G.player.x=ft.tx*TS+TS/2; G.player.y=ft.ty*TS+TS/2;
      G.player.sel=G.player.inv.findIndex(s=>s&&s.id==='chest');
      G.leftClick(ft.tx,ft.ty);
      ok('place: chest', G.obj[ft.i]===OB.CHEST, G.obj[ft.i]);
      ok('chest: storage created', !!G.chests[ft.i] && G.chests[ft.i].length===24);

      // --- right click cancels tilling ---
      G.obj[ft.i]=OB.NONE; delete G.chests[ft.i];
      G.ground[ft.i]=T.TILLED;
      G.rightClick(ft.tx,ft.ty);
      ok('rightclick: cancel tilling', G.ground[ft.i]===T.GRASS, G.ground[ft.i]);

      // --- seasons / weather ---
      const s0=(G.state.day-1)%G.CONFIG.SEASON_DAYS;
      G.state.day=25; // deep winter
      const winter=G.state.day;
      G.nextDay();
      ok('season: winter reached', (G.state.day-1)%28>=21, 'day'+G.state.day);
      ok('season: winter weather can be snow', ['sunny','rain','snow'].indexOf(G.state.weather)>=0, G.state.weather);

      // planting blocked in winter
      G.ground[ft.i]=T.TILLED; G.giveItem('seed_radish',1);
      G.player.sel=G.player.inv.findIndex(s=>s&&s.id==='seed_radish');
      G.leftClick(ft.tx,ft.ty);
      ok('winter: planting blocked', G.cropType[ft.i]===0, G.cropType[ft.i]);

      // --- crop withers on season change ---
      G.state.day=1; // spring
      G.ground[ft.i]=T.TILLED; G.cropType[ft.i]=1; G.cropGrowth[ft.i]=10; G.cropDead[ft.i]=0; G.cropWater[ft.i]=1;
      G.nextDay(); // still spring
      ok('season: crop survives in season', G.cropDead[ft.i]===0);
      G.state.day=7; // last spring day
      G.nextDay(); // -> day 8 = summer starts
      ok('season: radish withers in summer', G.cropDead[ft.i]===1, G.cropDead[ft.i]);
      ok('season: dead crop not harvestable', (function(){ G.player.sel=G.player.inv.findIndex(x=>x&&x.id==='sickle'); const c0=G.invCount('radish'); G.leftClick(ft.tx,ft.ty); return G.invCount('radish')===c0; })(), 'no radish gained');

      // --- tomato regrow ---
      G.cropType[ft.i]=3; G.cropDead[ft.i]=0; G.cropGrowth[ft.i]=60; // tomato mature
      G.giveItem('sickle',1);
      G.player.x=ft.tx*TS+TS/2; G.player.y=ft.ty*TS+TS/2;
      G.player.sel=G.player.inv.findIndex(s=>s&&s.id==='sickle');
      const tr0=G.invCount('tomato');
      G.leftClick(ft.tx,ft.ty);
      ok('tomato: harvested', G.invCount('tomato')===tr0+1, G.invCount('tomato'));
      ok('tomato: regrows (still planted, half grown)', G.cropType[ft.i]===3 && G.cropGrowth[ft.i]===30, G.cropGrowth[ft.i]);

      // --- eat crop restores stamina ---
      G.player.stamina=40; G.giveItem('radish',1);
      G.player.sel=G.player.inv.findIndex(s=>s&&s.id==='radish');
      const st0=G.player.stamina;
      G.leftClick(ft.tx,ft.ty);
      ok('eat: stamina restored', G.player.stamina===st0+15, G.player.stamina);

      // --- save / load ---
      G.state.gold=777; G.state.day=5; G.state.time=123;
      G.saveGame(true);
      G.state.gold=0; G.state.day=99;
      const loaded=G.loadGame();
      ok('save: load ok', loaded===true);
      ok('save: gold restored', G.state.gold===777, G.state.gold);
      ok('save: day restored', G.state.day===5, G.state.day);
      ok('save: time restored', G.state.time===123, G.state.time);
      ok('save: inv restored', G.invCount('wood')>=1, G.invCount('wood'));
      ok('save: map restored', G.ground[ft.i]===T.TILLED, G.ground[ft.i]);

      // --- final error sweep ---
      ok('final: no console errors', window.__errs.length===0, window.__errs.join(' ; '));
    }catch(err){ R.push('FAIL | EXCEPTION: '+err.message+' | '+(err.stack||'').split('\\n')[1]); }
    log();
  }, 900);
})();
</script>
`;
out = out.replace('</body>', test+'</body>');
fs.writeFileSync('E:/IdeaProjects/物理模拟/_pf_test.html', out);
console.log('written E:/IdeaProjects/物理模拟/_pf_test.html');
