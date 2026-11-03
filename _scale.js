const fs=require('fs'), vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
function run(W,H){
  const ctxMock={imageSmoothingEnabled:true,fillStyle:'',fillRect(){}};
  const canvasMock={width:0,height:0,style:{},getContext(){return ctxMock;},addEventListener(){}};
  const sb={console:{log(){}},performance:{now:()=>0},requestAnimationFrame(){},
    document:{getElementById:id=>id==='game'?canvasMock:null,addEventListener(){},createElement:()=>({getContext:()=>ctxMock,style:{}})},
    window:{innerWidth:W,innerHeight:H,addEventListener(){}},Math,Date,JSON,String,Number,Array,Object,parseInt,parseFloat,isNaN};
  sb.globalThis=sb; vm.createContext(sb);
  vm.runInContext(code, sb);
  const w=parseFloat(canvasMock.style.width), h=parseFloat(canvasMock.style.height);
  const ratio=w/h, target=960/540;
  return {win:W+'x'+H, css:w+'x'+h, ratio:ratio.toFixed(6), ok:Math.abs(ratio-target)<1e-6,
          fits:(w<=W+0.5&&h<=H+0.5), px:ratio===target?'integer':'fractional'};
}
[[1920,1080],[2560,1440],[1366,768],[1280,720],[1024,768],[800,600],[640,480],[3840,2160]].forEach(([w,h])=>{
  const r=run(w,h); console.log(String(r.win).padEnd(10), 'css='+r.css.padEnd(12), 'ratio='+r.ratio, '比例正确='+r.ok, '不溢出='+r.fits, r.px);
});
