const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf('  _railTick=(now)=>{'),html.indexOf('  _railEnter='));
const C=vm.runInNewContext('class Rail{'+code+'};Rail',{requestAnimationFrame:()=>1});
for(const fps of [60,120,144]){
 const c=new C();let x=1000;
 c._rail={get scrollLeft(){return x},set scrollLeft(v){x=Math.round(v)}};
 c._railSeed=()=>2000;c._railBlocked=()=>false;c._railLast=0;
 for(let i=0;i<=fps;i++)c._railTick(100+i*1000/fps);
 assert.ok(Math.abs(x-982)<=1,'Rounded scrollLeft must travel 18px/sec at '+fps+'Hz: '+x);
 c._railLast=0;x=1400;c._railTick(2000);c._railTick(2032);assert.equal(x,1399,'Resume starts from manual position');
}
console.log('PASS: auto-scroll survives integer rounding at 60/120/144Hz and rebases after manual movement');
