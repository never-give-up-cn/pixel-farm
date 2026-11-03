const fs=require('fs');
const src=fs.readFileSync('E:/IdeaProjects/物理模拟/index.html','utf8');

const variants = {
  morning: `state.time=60; player.x=(CX-3)*TS+TS/2; player.y=(CY-6)*TS+TS/2;`,
  noon:    `state.time=360; player.x=(CX-3)*TS+TS/2; player.y=(CY-6)*TS+TS/2;`,
  dusk:    `state.time=690; player.x=(CX-3)*TS+TS/2; player.y=(CY-6)*TS+TS/2;`,
  night:   `state.time=900; player.x=(CX-3)*TS+TS/2; player.y=(CY-6)*TS+TS/2;`,
  farm:    `state.time=420;
             // 造一片农田
             for(let ty=CY-1;ty<CY+6;ty++) for(let tx=CX-6;tx<CX+6;tx++){
               const i=ty*MW+tx;
               if(Math.abs(tx-CX)<5 && ty<CY+5){
                 ground[i]=T.TILLED;
                 const k=(tx+ty)%4;
                 if(k===0){cropType[i]=1;cropGrowth[i]=30;cropWater[i]=1;}
                 else if(k===1){cropType[i]=3;cropGrowth[i]=25;cropWater[i]=1;}
                 else if(k===2){cropType[i]=1;cropGrowth[i]=5;}
                 else if(k===3){cropType[i]=4;cropGrowth[i]=80;cropWater[i]=1;}
               }
             }
             player.x=(CX-3)*TS+TS/2; player.y=(CY-4)*TS+TS/2;`,
  shop:    `state.time=300; openShop();`,
  bag:     `state.time=300;
             giveItem('wood',12);giveItem('stone',7);giveItem('seed_radish',9);giveItem('seed_tomato',4);
             giveItem('radish',5);giveItem('tomato',3);giveItem('fence',6);giveItem('chest',1);
             openInventory();`,
  snow:    `state.time=300; state.weather='snow';`
};

for(const k in variants){
  const out = src.replace('</body>', '<script>setTimeout(function(){'+variants[k]+'},60);</script></body>');
  fs.writeFileSync('E:/IdeaProjects/物理模拟/_shot_'+k+'.html', out);
}
console.log('ok');
