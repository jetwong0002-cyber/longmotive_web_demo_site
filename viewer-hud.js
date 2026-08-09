/* LMHUD — shared Longmotive BIM-viewer HUD, standardised on the AHU room viewer.
   Owns the whole chrome: topbar buttons, collapsible filter rail (system chips,
   item tags, per-category visibility + "only"), props panel, hover tip, explode
   slider, colour-by-system, walls toggle, loading status and narrow-screen layout.
   A viewer supplies its sections and a few callbacks; the HUD owns all DOM. */
(function(){
const PALETTE=[0x00b0f0,0x0f52a0,0x3fb984,0xf2a63b,0xd7524a,0x8a6fd4,0x2ec4c6,0xc9d24a,0xe07ab8,0x6f8fb0];

const CSS=`
  :host{display:block;position:relative;width:100%;height:100%;overflow:hidden;
    font-family:'IBM Plex Sans',system-ui,sans-serif;color:#e8f1fa;outline:none}
  :host(:focus-visible){outline:2px solid #00b0f0;outline-offset:-2px}
  *{box-sizing:border-box}
  .wrap{position:absolute;inset:0;
    background:radial-gradient(120% 100% at 50% 0%,#12304f 0%,#0a1c31 48%,#061424 100%)}
  canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;cursor:grab}
  canvas.drag{cursor:grabbing !important}

  .topbar{position:absolute;top:12px;left:12px;right:12px;z-index:4;display:flex;gap:8px;align-items:center;flex-wrap:wrap;pointer-events:none}
  .topbar>*{pointer-events:auto}
  .spacer{flex:1}
  .meta{display:flex;gap:10px;align-items:center;font-family:'IBM Plex Mono',monospace;font-size:10px;
    letter-spacing:.1em;text-transform:uppercase;color:#6f93bb;padding:0 2px}
  .meta b{color:#9dc4e6;font-weight:600}

  button{font:inherit;color:inherit;background:none;border:none;cursor:pointer}
  .btn{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:3px;
    border:1px solid rgba(126,170,214,.28);background:rgba(9,26,45,.82);backdrop-filter:blur(8px);
    font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.1em;
    text-transform:uppercase;color:#bcd8f0;transition:border-color .15s,background .15s,color .15s}
  .btn:hover{border-color:#00b0f0;color:#fff}
  .btn:active{transform:translateY(1px)}
  .btn.on{background:#0f52a0;border-color:#0f52a0;color:#fff}
  .btn:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .filtoggle{display:none}

  .rail{position:absolute;top:54px;left:12px;bottom:12px;z-index:5;width:258px;display:flex;flex-direction:column;
    background:rgba(7,26,46,.9);backdrop-filter:blur(12px);border:1px solid rgba(126,170,214,.2);
    border-top:3px solid #00b0f0;border-radius:4px;overflow:hidden;opacity:0;transform:translateX(-8px);
    transition:opacity .25s,transform .25s;pointer-events:none}
  .wrap.ready .rail{opacity:1;transform:none;pointer-events:auto}
  .wrap.ready.railhid .rail{opacity:0;transform:translateX(-14px);pointer-events:none}
  .railtab{position:absolute;top:96px;left:270px;z-index:6;width:19px;height:46px;display:flex;
    align-items:center;justify-content:center;padding:0;
    border:1px solid rgba(126,170,214,.2);border-left:none;border-radius:0 3px 3px 0;
    background:rgba(7,26,46,.9);backdrop-filter:blur(12px);color:#7fd4ff;font-size:11px;line-height:1;
    opacity:0;transition:left .25s,opacity .2s,border-color .15s,color .15s}
  .wrap.ready .railtab{opacity:1}
  .railtab:hover{border-color:#00b0f0;color:#fff}
  .railtab:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .wrap.railhid .railtab{left:12px;border-left:1px solid rgba(126,170,214,.2);border-radius:3px}
  .rail h4{margin:0;padding:13px 14px 8px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;
    letter-spacing:.14em;text-transform:uppercase;color:#5f86ae;display:flex;align-items:center;gap:8px}
  .rail h4:before{content:'';width:14px;height:2px;background:#00b0f0;flex:none}
  .railclose{display:none}
  .systems,.unitrow{display:flex;flex-wrap:wrap;gap:5px;padding:0 12px 12px}
  .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:2px;
    border:1px solid rgba(126,170,214,.22);background:rgba(255,255,255,.03);
    font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.07em;color:#7f9cbb;
    transition:all .15s}
  .chip em{font-style:normal;opacity:.6;font-size:9px}
  .chip:hover{border-color:#00b0f0;color:#e8f1fa}
  .chip.on{background:rgba(0,176,240,.14);border-color:rgba(0,176,240,.55);color:#e8f1fa}
  .chip:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .chip.sm{padding:4px 8px}
  .chip .sw{width:9px;height:9px;border-radius:1px;flex:none;opacity:.85}
  .unitsec{border-top:1px solid rgba(126,170,214,.13)}

  .catsec{border-top:1px solid rgba(126,170,214,.13);flex:1;min-height:0;display:flex;flex-direction:column}
  .cats{flex:1;min-height:0;overflow:auto;padding:0 6px 8px;scrollbar-width:thin;scrollbar-color:#2a4767 transparent}
  .cats::-webkit-scrollbar{width:7px}
  .cats::-webkit-scrollbar-thumb{background:#2a4767;border-radius:4px}
  .row{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:2px;transition:background .12s}
  .row:hover,.row.hv{background:rgba(255,255,255,.045)}
  .row.sel{background:rgba(0,176,240,.14)}
  .row .tog{width:13px;height:13px;flex:none;border:1px solid rgba(126,170,214,.5);border-radius:2px;
    display:flex;align-items:center;justify-content:center;padding:0}
  .row .tog i{width:7px;height:7px;background:#00b0f0;border-radius:1px;transition:opacity .12s}
  .row.off .tog i{opacity:0}
  .row .tog:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .row .nm{flex:1;font-size:11.5px;line-height:1.35;color:#cfe1f2;cursor:pointer;overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap;text-align:left}
  .row.off .nm,.row.off .n{color:#587ba0;opacity:.6}
  .row .n{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#5f86ae;min-width:22px;text-align:right}
  .row .only{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;
    padding:2px 5px;border-radius:2px;opacity:0;transition:opacity .12s;color:#5f86ae}
  .row:hover .only,.row .only:focus-visible{opacity:1}
  .row .only:hover{background:#0f52a0;color:#fff}
  .railfoot{padding:9px 12px;border-top:1px solid rgba(126,170,214,.13);display:flex;gap:8px;align-items:center}
  .visible{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#5f86ae;flex:1}

  .props{position:absolute;top:54px;right:12px;z-index:5;width:288px;max-width:calc(100% - 24px);
    background:rgba(7,26,46,.92);backdrop-filter:blur(12px);border:1px solid rgba(126,170,214,.2);
    border-left:3px solid #00b0f0;border-radius:4px;padding:14px 16px 15px;
    opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .2s;pointer-events:none}
  .props.on{opacity:1;transform:none;pointer-events:auto}
  .props .ph{display:flex;align-items:flex-start;gap:10px;margin-bottom:11px}
  .props h3{margin:0;flex:1;font-family:'Barlow Semi Condensed',sans-serif;font-weight:700;font-size:19px;
    line-height:1.12;letter-spacing:.02em;text-transform:uppercase;color:#fff;word-break:break-word}
  .propclose{font-size:16px;line-height:1;color:#5f86ae;padding:2px 4px}
  .propclose:hover{color:#fff}
  .props dl{margin:0;display:grid;grid-template-columns:74px 1fr;gap:7px 12px;align-items:baseline}
  .props dt{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.12em;
    text-transform:uppercase;color:#5f86ae}
  .props dd{margin:0;font-size:12.5px;line-height:1.4;color:#dcebf8;display:flex;align-items:center;gap:7px}
  .props dd.mono{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.05em;color:#7fd4ff}
  .props .sw{width:9px;height:9px;border-radius:1px;flex:none}

  .explode{position:absolute;left:50%;transform:translateX(-50%);bottom:14px;z-index:5;
    display:flex;align-items:center;gap:12px;padding:9px 15px;border-radius:4px;
    background:rgba(7,26,46,.9);backdrop-filter:blur(12px);border:1px solid rgba(126,170,214,.2);
    opacity:0;transition:opacity .25s;pointer-events:none;max-width:calc(100% - 24px)}
  .wrap.ready .explode{opacity:1;pointer-events:auto}
  .explode label{font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.13em;
    text-transform:uppercase;color:#5f86ae;white-space:nowrap}
  .slider{-webkit-appearance:none;appearance:none;width:min(240px,38vw);height:3px;border-radius:2px;
    background:linear-gradient(90deg,#00b0f0,#2a4767);outline:none;cursor:pointer}
  .slider::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;
    background:#fff;border:3px solid #00b0f0;cursor:grab}
  .slider::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #00b0f0}
  .slider:focus-visible{outline:2px solid #00b0f0;outline-offset:4px}
  .expval{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#7fd4ff;min-width:38px;text-align:right}
  .expreset{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;
    color:#5f86ae;padding:3px 6px;border-radius:2px}
  .expreset:hover{color:#fff;background:rgba(255,255,255,.07)}

  .tip{position:absolute;left:50%;transform:translateX(-50%);bottom:62px;z-index:4;
    padding:5px 10px;border-radius:2px;background:rgba(6,20,36,.9);border:1px solid rgba(0,176,240,.35);
    font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;color:#7fd4ff;
    opacity:0;transition:opacity .15s;pointer-events:none;white-space:nowrap;max-width:calc(100% - 24px);
    overflow:hidden;text-overflow:ellipsis}
  .tip.on{opacity:1}

  .hint{position:absolute;right:14px;bottom:14px;z-index:3;text-align:right;
    font-family:'IBM Plex Mono',monospace;font-size:9px;line-height:1.8;letter-spacing:.1em;
    text-transform:uppercase;color:#3f628a;pointer-events:none}

  .status{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;align-items:center;
    justify-content:center;gap:9px;text-align:center;padding:32px;background:rgba(6,20,36,.86)}
  .status.on{display:flex}
  .status img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.16;z-index:-1}
  .s-title{font-family:'Barlow Semi Condensed',sans-serif;font-weight:700;font-size:22px;letter-spacing:.03em;
    text-transform:uppercase;color:#fff}
  .s-line{font-size:13px;line-height:1.6;color:#9dc4e6;max-width:46ch}
  .s-line code{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#7fd4ff;
    background:rgba(0,176,240,.1);padding:1px 5px;border-radius:2px}
  .s-pct{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;color:#00b0f0}
  .status.spin .s-line:first-of-type:before{content:'';display:inline-block;width:9px;height:9px;margin-right:9px;
    border:2px solid rgba(0,176,240,.3);border-top-color:#00b0f0;border-radius:50%;animation:lmspin .8s linear infinite}
  @keyframes lmspin{to{transform:rotate(360deg)}}

  .wrap.narrow .rail{top:12px;bottom:12px;left:12px;width:min(272px,calc(100% - 24px));
    transform:translateX(-108%);opacity:1;pointer-events:none;box-shadow:0 18px 46px rgba(0,0,0,.5)}
  .wrap.narrow .rail.open{transform:none;pointer-events:auto}
  .wrap.narrow .railclose{display:block;position:absolute;top:8px;right:8px;font-size:16px;color:#5f86ae;padding:4px 7px;z-index:2}
  .wrap.narrow .filtoggle{display:inline-flex}
  .wrap.narrow .railtab{display:none}
  .wrap.narrow .props{top:auto;bottom:64px;right:12px;left:12px;width:auto;max-width:none}
  .wrap.narrow .hint{display:none}
  .wrap.narrow .meta{display:none}
  .wrap.narrow .explode{left:12px;right:12px;transform:none;bottom:12px;justify-content:space-between}
  .wrap.narrow .slider{flex:1;width:auto}
  .wrap.narrow .tip{display:none}
  @media (prefers-reduced-motion: reduce){*{transition:none !important;animation:none !important}}
`;

/* cfg: {views:[{id,label,key}], walls:bool, explode:bool, colour:bool, poster, loadingLabel, hint} */
function markup(cfg){
  const views=(cfg.views||[]).map(v=>`<button class="btn v-${v.id}" title="${v.label} view (${v.key.toUpperCase()})">${v.label}</button>`).join('');
  return `<style>${CSS}</style>
<div class="wrap">
  <canvas></canvas>
  <div class="topbar">
    <button class="btn filtoggle">Filters</button>
    <button class="btn reset" title="Reset view (R)">Reset view</button>
    ${views}
    ${cfg.walls?'<button class="btn walls" title="Show or hide the room walls (W)">Hide walls</button>':''}
    ${cfg.colour?'<button class="btn colorby" title="Colour by system (C)">Colour by system</button>':''}
    ${(cfg.extras||[]).map(x=>'<button class="btn x-'+x.id+'" title="'+(x.title||x.label)+(x.key?' ('+x.key.toUpperCase()+')':'')+'">'+x.label+'</button>').join('')}
    <span class="spacer"></span>
    <span class="meta"><b class="count"></b></span>
  </div>
  <aside class="rail">
    <button class="railclose" aria-label="Close filters">&#10005;</button>
    <h4>System</h4>
    <div class="systems"></div>
    <div class="unitsec"><h4>Item tag</h4><div class="unitrow"></div></div>
    <div class="catsec"><h4>Equipment</h4><div class="cats"></div></div>
    <div class="railfoot"><span class="visible"></span><button class="btn showall">Show all</button></div>
  </aside>
  <button class="railtab" aria-label="Hide filter panel" aria-expanded="true" title="Hide filter panel">&#10094;</button>
  <aside class="props">
    <div class="ph"><h3 class="p-el"></h3><button class="propclose" aria-label="Close">&#10005;</button></div>
    <dl>
      <dt>Type</dt><dd class="p-cat"></dd>
      <dt>Tag</dt><dd class="p-sys mono"></dd>
      <dt>Contains</dt><dd class="p-dev mono"></dd>
      <dt class="p-noterow">Notes</dt><dd class="p-note"></dd>
    </dl>
  </aside>
  <div class="tip"></div>
  ${cfg.explode?`<div class="explode">
    <label for="ex">Explode</label>
    <input id="ex" class="slider" type="range" min="0" max="100" value="0" step="1" aria-label="Explode assembly">
    <span class="expval">0%</span>
    <button class="expreset">Reset</button>
  </div>`:''}
  <div class="hint">${cfg.hint||'Drag orbit &#183; Scroll zoom<br>W walls &#183; C colour &#183; R reset'}</div>
  <div class="status on spin">${cfg.poster?`<img src="${cfg.poster}" alt="">`:''}
    <div class="s-title">${cfg.loadingLabel||'Loading model'}</div>
    <div class="s-line">Reading the coordination model&hellip;</div>
    <div class="s-pct">0%</div>
  </div>
</div>`;
}

/* api the viewer supplies: {sections,order,SEC,onView,onReset,onSelect,onHover,onVisibility,onExplode,onColour,onWalls} */
function attach(host,sh,cfg,api){
  const $=(s)=>sh.querySelector(s);
  const wrap=$('.wrap'),hud={el:{wrap,status:$('.status'),pct:$('.s-pct'),tip:$('.tip'),props:$('.props'),
    count:$('.count'),visible:$('.visible'),cats:$('.cats'),systems:$('.systems'),unitrow:$('.unitrow'),
    rail:$('.rail'),railtab:$('.railtab')}};
  const order=api.order,SEC=api.SEC;
  const sysOf=(id)=>SEC[id].type;
  const systems=[...new Set(order.map(sysOf))];
  hud.colourOf=(id)=>PALETTE[systems.indexOf(sysOf(id))%PALETTE.length];
  hud.hidden={};hud.sys=null;hud.tag=null;hud.sel=null;hud.hover=null;hud.colour=false;hud.wallsOff=false;

  /* rail: system chips */
  systems.forEach(s=>{
    const b=document.createElement('button');b.type='button';b.className='chip';
    const n=order.filter(id=>sysOf(id)===s).length;
    b.innerHTML=`<span class="sw" style="background:#${PALETTE[systems.indexOf(s)%PALETTE.length].toString(16).padStart(6,'0')}"></span>${s}<em>${n}</em>`;
    b.addEventListener('click',()=>{hud.sys=hud.sys===s?null:s;applyFilter();});
    hud.el.systems.appendChild(b);b._sys=s;
  });
  /* rail: item tags */
  order.forEach(id=>{
    const b=document.createElement('button');b.type='button';b.className='chip sm';b.textContent=id;
    b.addEventListener('click',()=>{hud.tag=hud.tag===id?null:id;applyFilter();});
    hud.el.unitrow.appendChild(b);b._tag=id;
  });
  /* rail: equipment rows */
  const rows={};
  order.forEach(id=>{
    const r=document.createElement('div');r.className='row';
    r.innerHTML=`<button class="tog" aria-label="Toggle ${SEC[id].name}"><i></i></button>
      <button class="nm">${SEC[id].name}</button><span class="only">only</span><span class="n"></span>`;
    r.querySelector('.tog').addEventListener('click',()=>{hud.hidden[id]=!hud.hidden[id];applyFilter();});
    r.querySelector('.nm').addEventListener('click',()=>api.onSelect(hud.sel===id?null:id));
    r.querySelector('.nm').addEventListener('mouseenter',()=>api.onHover(id));
    r.querySelector('.nm').addEventListener('mouseleave',()=>api.onHover(null));
    r.querySelector('.only').addEventListener('click',()=>{
      const alone=order.every(o=>o===id?!hud.hidden[o]:hud.hidden[o]);
      order.forEach(o=>hud.hidden[o]=alone?false:o!==id);applyFilter();
    });
    hud.el.cats.appendChild(r);rows[id]=r;
  });
  if(!order.length)hud.el.unitrow.parentElement.style.display='none';

  function applyFilter(){
    order.forEach(id=>{
      const byS=!hud.sys||sysOf(id)===hud.sys, byT=!hud.tag||hud.tag===id;
      hud.visibleOf=null;
      rows[id]._vis=!hud.hidden[id]&&byS&&byT;
    });
    api.onVisibility(id=>rows[id]._vis);
    hud.sync();
  }
  hud.isVisible=(id)=>rows[id]?rows[id]._vis!==false:true;

  hud.sync=()=>{
    let vis=0,tot=0;
    order.forEach(id=>{
      const r=rows[id],on=r._vis!==false;
      r.classList.toggle('off',!on);
      r.classList.toggle('sel',hud.sel===id);
      r.classList.toggle('hv',hud.hover===id&&hud.sel!==id);
      const n=(api.sections[id]&&api.sections[id].meshes.length)||0;
      r.querySelector('.n').textContent=n||'';
      tot+=n;if(on)vis+=n;
    });
    hud.el.systems.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',hud.sys===b._sys));
    hud.el.unitrow.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',hud.tag===b._tag));
    hud.el.count.textContent=vis+' / '+tot+' parts';
    hud.el.visible.textContent=order.filter(id=>rows[id]._vis!==false).length+' of '+order.length+' shown';
    (cfg.views||[]).forEach(v=>{const b=$('.v-'+v.id);if(b)b.classList.toggle('on',hud.view===v.id);});
    const wb=$('.walls');if(wb){wb.textContent=hud.wallsOff?'Show walls':'Hide walls';wb.classList.toggle('on',hud.wallsOff);}
    const cb=$('.colorby');if(cb)cb.classList.toggle('on',hud.colour);
  };

  hud.setView=(v)=>{hud.view=v;hud.sync();};
  hud.setProps=(id)=>{
    const p=hud.el.props;
    if(!id||!SEC[id]){p.classList.remove('on');return;}
    $('.p-el').textContent=SEC[id].name;
    $('.p-cat').innerHTML=`<span class="sw" style="background:#${hud.colourOf(id).toString(16).padStart(6,'0')}"></span>${SEC[id].type}`;
    $('.p-sys').textContent=id;
    $('.p-dev').textContent=SEC[id].devices||'';
    const note=SEC[id].note||'';
    $('.p-note').textContent=note;
    $('.p-noterow').style.display=note?'':'none';
    $('.p-note').style.display=note?'':'none';
    p.classList.add('on');
  };
  hud.setTip=(txt)=>{const t=hud.el.tip;t.textContent=txt||'';t.classList.toggle('on',!!txt);};
  hud.progress=(pct)=>{hud.el.pct.textContent=Math.round(pct)+'%';};
  hud.ready=()=>{hud.el.status.classList.remove('on');wrap.classList.add('ready');};
  hud.fail=(msg)=>{
    hud.el.status.classList.remove('spin');
    hud.el.status.querySelector('.s-title').textContent='3D unavailable';
    hud.el.status.querySelector('.s-line').textContent=msg||'The model could not be loaded — showing the render instead.';
    hud.el.pct.textContent='';
    const img=hud.el.status.querySelector('img');if(img)img.style.opacity='1';
  };

  /* topbar + rail wiring */
  (cfg.views||[]).forEach(v=>{const b=$('.v-'+v.id);if(b)b.addEventListener('click',()=>api.onView(v.id));});
  $('.reset').addEventListener('click',()=>api.onReset());
  $('.showall').addEventListener('click',()=>{order.forEach(id=>hud.hidden[id]=false);hud.sys=null;hud.tag=null;applyFilter();});
  $('.propclose').addEventListener('click',()=>api.onSelect(null));
  const wb=$('.walls');if(wb)wb.addEventListener('click',()=>{hud.wallsOff=!hud.wallsOff;api.onWalls(hud.wallsOff);hud.sync();});
  hud.extraOn={};
  hud.setExtra=(id,on,label)=>{const b=$('.x-'+id);if(!b)return;b.classList.toggle('on',!!on);hud.extraOn[id]=!!on;if(label)b.textContent=label;};
  (cfg.extras||[]).forEach(x=>{const b=$('.x-'+x.id);if(b)b.addEventListener('click',()=>api.onExtra&&api.onExtra(x.id));});
  const cb=$('.colorby');if(cb)cb.addEventListener('click',()=>{hud.colour=!hud.colour;api.onColour(hud.colour);hud.sync();});
  const ex=$('.slider');
  if(ex){
    ex.addEventListener('input',()=>{$('.expval').textContent=ex.value+'%';api.onExplode(+ex.value/100);});
    $('.expreset').addEventListener('click',()=>{ex.value=0;$('.expval').textContent='0%';api.onExplode(0);});
  }
  hud.el.railtab.addEventListener('click',()=>{
    const hid=wrap.classList.toggle('railhid');
    hud.el.railtab.innerHTML=hid?'&#10095;':'&#10094;';
    hud.el.railtab.setAttribute('aria-expanded',String(!hid));
  });
  $('.filtoggle').addEventListener('click',()=>hud.el.rail.classList.toggle('open'));
  $('.railclose').addEventListener('click',()=>hud.el.rail.classList.remove('open'));
  new ResizeObserver(()=>wrap.classList.toggle('narrow',host.clientWidth<720)).observe(host);

  hud.key=(k)=>{
    const kl=k.toLowerCase();
    const v=(cfg.views||[]).find(v=>v.key===kl);
    if(v){api.onView(v.id);return true;}
    if(kl==='r'){api.onReset();return true;}
    if(kl==='w'&&wb){wb.click();return true;}
    if(kl==='c'&&cb){cb.click();return true;}
    const x=(cfg.extras||[]).find(x=>x.key===kl);
    if(x&&api.onExtra){api.onExtra(x.id);return true;}
    return false;
  };
  applyFilter();
  return hud;
}

window.LMHUD={markup,attach,CSS,PALETTE};
})();
