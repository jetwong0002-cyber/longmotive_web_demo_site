const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let time=0,id=0;const timers=new Map();
const C=vm.runInNewContext('class C {'+html.slice(html.indexOf('  _railTouchMode='),html.indexOf('  _railVisibility='))+'};C',{window:{matchMedia:()=>({matches:true})},setTimeout:(f,ms)=>{timers.set(++id,{f,at:time+ms});return id},clearTimeout:i=>timers.delete(i)});
function advance(ms){time+=ms;for(const [i,t] of [...timers])if(t.at<=time){timers.delete(i);t.f();}}
const c=new C();c.state={railPaused:false};c.setState=(s,cb)=>{Object.assign(c.state,typeof s==='function'?s(c.state):s);cb?.()};let starts=0;c._railStart=()=>starts++;c._railStop=()=>{};
c._railPointerDown({pointerType:'touch'});assert.equal(c.state.railPaused,true);advance(6000);assert.equal(starts,0,'Never resume while finger is down');
c._railPointerUp();advance(4000);c._railScroll();advance(4999);assert.equal(starts,0,'Momentum resets the five-second delay');advance(1);assert.equal(c.state.railPaused,false);assert.equal(starts,1);
c._railPointerDown({pointerType:'touch'});c._railPointerUp();c._railToggle();assert.equal(c.state.railPaused,false,'Resume button works immediately');advance(6000);assert.equal(starts,2,'Cancelled timer must not restart again');
c._railToggle();assert.equal(c.state.railPaused,true);c._railPointerDown({pointerType:'touch'});c._railPointerUp();advance(6000);assert.equal(c.state.railPaused,true,'Explicit Pause is persistent');
assert.match(html,/onPointerCancel="\{\{ railPointerUp \}\}"/);assert.match(html,/onScroll="\{\{ railScroll \}\}"/);
console.log('PASS: interaction pause, five-second idle resume, momentum delay, immediate Resume, manual Pause and cancel wiring');
