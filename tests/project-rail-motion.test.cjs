const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf('  _railTick=(now)=>{'),html.indexOf('  _railEnter='));
const C=vm.runInNewContext('class Rail{'+code+'};Rail',{requestAnimationFrame:()=>1});
for(const step of [313,408])for(const fps of [60,120,144]){
 const c=new C();let x=1000;
 c._rail={get scrollLeft(){return x},set scrollLeft(v){x=Math.round(v)},querySelectorAll:()=>[0,step].map(left=>({getBoundingClientRect:()=>({left})}))};
 c._railSeed=()=>2000;c._railBlocked=()=>false;c._railLast=0;
 for(let i=0;i<=fps;i++)c._railTick(100+i*1000/fps);
 assert.ok(Math.abs(x-(1000+step/12))<=1,'Each screen must travel 1/12 card per second at '+fps+'Hz: '+x);
 c._railLast=0;x=1400;c._railTick(2000);c._railTick(2032);assert.ok(Math.abs(x-(1400+step*32/12000))<=1,'Resume starts from manual position');
}
console.log('PASS: auto-scroll survives integer rounding at 60/120/144Hz and rebases after manual movement');
