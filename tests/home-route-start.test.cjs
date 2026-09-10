const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('else { const fromPath=SCREEN_AT(location.pathname);');
const end=html.indexOf("window.addEventListener('popstate'",start);
assert.ok(start>0&&end>start);
const initialize=html.slice(start,end).replace(/^else\s*/, '');
for(const [pathname,screen] of [['/','Home'],['/about','About'],['/projects','Projects'],['/contact','Contact']]){
 const calls=[],urls=[];
 vm.runInNewContext(initialize,{location:{pathname},SCREEN_AT:()=>screen,SYNC_URL:(...args)=>urls.push(args),go:(...args)=>calls.push(args)});
 if(screen==='Home') {assert.deepEqual(calls,[],'Fresh homepage must not enter navigation that skips the intro');assert.deepEqual(urls,[['Home',false]]);}
 else assert.deepEqual(calls,[[screen,undefined,true]],pathname+' must still select its own screen');
}
console.log('PASS: fresh Home retains intro; About/Projects/Contact deep links select screens without pushing history');
