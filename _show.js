let d='';
process.stdin.on('data',c=>d+=c).on('end',()=>{
  const m=d.match(/<title>([\s\S]*?)<\/title>/);
  if(m) console.log(m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
  else console.log('NO TITLE\n'+d.slice(0,1200));
});
