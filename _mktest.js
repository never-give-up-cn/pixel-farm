const fs=require('fs');
let src=fs.readFileSync('E:/IdeaProjects/物理模拟/index.html','utf8');

// 1) error capture
src = src.replace('<body>', '<body>\n<script>\n'+
 'window.__errs=[];\n'+
 "window.addEventListener('error',e=>window.__errs.push('ERROR: '+e.message+' @line '+e.lineno+':'+e.colno));\n"+
 "window.addEventListener('unhandledrejection',e=>window.__errs.push('REJECT: '+e.reason));\n"+
 'const _ce=console.error,_cw=console.warn;\n'+
 "console.error=function(){window.__errs.push('CONSOLE.ERROR: '+Array.from(arguments).map(String).join(' '));_ce.apply(console,arguments)};\n"+
 "console.warn=function(){window.__errs.push('CONSOLE.WARN: '+Array.from(arguments).map(String).join(' '));_cw.apply(console,arguments)};\n"+
 '</script>');

// 2) expose internals (separate classic script -> sees top-level let/const of the game script)
const expose = `
<script>
window.__G={
  get state(){return state}, get player(){return player}, get ground(){return ground},
  get obj(){return obj}, get objHp(){return objHp},
  get cropType(){return cropType}, get cropGrowth(){return cropGrowth},
  get cropWater(){return cropWater}, get cropDead(){return cropDead},
  get chests(){return chests}, get cam(){return cam},
  CONFIG:CONFIG, T:T, OB:OB, CROPS:CROPS, ITEMS:ITEMS,
  leftClick:leftClick, rightClick:rightClick, giveItem:giveItem, takeItem:takeItem,
  sleep:sleep, nextDay:nextDay, openShop:openShop, openInventory:openInventory,
  closeOverlay:closeOverlay, saveGame:saveGame, loadGame:loadGame,
  invCount:invCount, priceOf:priceOf, buyItem:buyItem, sellItem:sellItem, craftItem:craftItem,
  toast:toast, refHot:refreshHotbar
};
</script>`;

const test = fs.readFileSync('E:/IdeaProjects/物理模拟/_testbody.js','utf8');
src = src.replace('</body>', expose + test + '</body>');
fs.writeFileSync('E:/IdeaProjects/物理模拟/_pf_test.html', src);
console.log('written _pf_test.html');
