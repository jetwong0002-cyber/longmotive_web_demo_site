/* <lm-rooftop-viewer> — Longmotive rooftop plant deck inspector.
   Authored from the supplied rooftop coordination renders:
   · TWO roof levels — a lower deck at the low end and a raised upper deck carrying the
     cooling plant, with a steel stair and landing at the step, beside the power modules.
   · Cooling towers standing ON TOP of the prefabricated power-module containers, two
     towers per module, reached by catwalks at module-roof level.
   · Insulated pipework covering the whole roof: header bundles the full length of both
     decks, U-bend risers up to every tower row, elbows dropping at the level change.
   · Plant huts, pump / heat-exchanger skids with tan vessels, a remote-condenser field
     on the lower deck, and the roof MCC kiosk.
   Hover a unit to highlight it, click to read its data. */
(function(){
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const CATS={
  tower:{name:'Cooling Tower',color:0x0f52a0,
    spec:['CROSS-FLOW \u00b7 2 \u00d7 INDUCED-DRAUGHT FAN','MOUNTED ON THE POWER-MODULE ROOF','BASIN LEVELLED \u00b7 MAKE-UP & BLEED PIPED'],
    blurb:'Cooling towers sitting on the roof of each power module. Craned in pairs, levelled on the module frame, then piped and wired from the catwalk.'},
  module:{name:'Power Module Container',color:0x00b0f0,
    spec:['PREFABRICATED CONTAINERISED MODULE','12.5 \u00d7 5.2 M \u00b7 SWITCHGEAR & PUMPS INSIDE','SET OUT AND BOLTED TO ROOF STEEL'],
    blurb:'Factory-built power modules landed on the upper deck. They carry the tower load above and house the switchgear and pump sets inside.'},
  chillerMod:{name:'Chiller Module',color:0x3fae5a,
    spec:['PACKAGED CHILLER MODULE \u00b7 RED BAND','1,200 kW NOMINAL','AV-MOUNTED ON STEEL SKID'],
    blurb:'The packaged chiller modules in the middle run, delivered complete and connected into the header on site.'},
  pipe:{name:'Insulated Pipe Run',color:0xf2a33c,
    spec:['DN300\u2013DN500 FLOW & RETURN','30 MM PHENOLIC + ALUMINIUM CLADDING','PREFABRICATED SPOOLS \u00b7 WELD-MAPPED'],
    blurb:'The pipework that covers the roof: header bundles both ways, U-bend risers into every tower, elbows stepping down to the lower deck.'},
  support:{name:'Pipe Support & Trestle',color:0x8fa3b8,
    spec:['GALVANISED TRESTLE \u00b7 3 M CENTRES','SLIDING & ANCHOR SHOES','THERMAL MOVEMENT ALLOWED AT BENDS'],
    blurb:'Galvanised trestles and sleepers carrying every run clear of the roof membrane.'},
  stair:{name:'Stair, Landing & Catwalk',color:0xc4763a,
    spec:['LOWER DECK \u2192 UPPER DECK \u00b7 2 FLIGHTS','CATWALK AT MODULE-ROOF LEVEL','GRATING \u00b7 1.1 M HANDRAIL \u00b7 5 kN/M\u00b2'],
    blurb:'The access route: stair and landing at the level change beside the power modules, then catwalks along the module roofs to every tower.'},
  condenser:{name:'Remote Condenser',color:0x51709a,
    spec:['CRAC REMOTE CONDENSER FIELD','2 \u00d7 EC FAN \u00b7 SPEED-CONTROLLED','REFRIGERANT LINES BRAZED & TESTED'],
    blurb:'The condenser field on the lower deck, serving the precision cooling units below. Every line brazed, purged, pressure-tested and logged.'},
  skid:{name:'Pump & Heat Exchanger Skid',color:0xb0342f,
    spec:['PLATE EXCHANGERS & BUFFER VESSELS','END-SUCTION PUMPS ON INERTIA BASE','FLUSHED, DOSED & BALANCED'],
    blurb:'Skid-mounted exchangers, buffer vessels and pumps on the lower deck, delivered as assemblies and commissioned in place.'},
  hut:{name:'Plant Hut',color:0x0f52a0,
    spec:['WEATHER-SEALED PLANT HUT','CONTROL PANELS & VALVE SETS','ACCESS STAIR TO DOOR'],
    blurb:'Small pitched-roof huts over the valve sets and control panels, each with its own access stair.'},
  elec:{name:'Electrical Kiosk',color:0xf2a33c,
    spec:['ROOF MCC \u00b7 400 V TP&N','GALVANISED LADDER CONTAINMENT','EARTHED & CONTINUITY TESTED'],
    blurb:'The roof motor-control centre and the containment feeding every fan, pump and actuator.'},
  roof:{name:'Upper & Lower Roof Deck',color:0x28425e,
    spec:['TWO LEVELS \u00b7 5.5 M STEP','PERFORATED ACOUSTIC SCREEN WALL','FALLS & OUTLETS COORDINATED'],
    blurb:'Both plant decks and the acoustic screen wall — set out so the plant, the level change, the falls and the outlets all coordinate.'}
};
const ORDER=['tower','module','chillerMod','pipe','support','stair','condenser','skid','hut','elec','roof'];

class LMRooftopViewer extends HTMLElement{
  connectedCallback(){
    if(this._wired){this._observe();this._resume();return;}
    this._wired=true;
    const sh=this.attachShadow({mode:'open'});
    sh.innerHTML=`<style>
      :host{display:block;position:relative;width:100%;height:100%;background:#f7f8f9;overflow:hidden;font-family:'IBM Plex Sans',sans-serif}
      canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
      canvas.drag{cursor:grabbing}
      .rail{position:absolute;top:14px;left:14px;z-index:3;display:flex;flex-direction:column;gap:0;max-height:calc(100% - 28px);overflow:auto;border:1px solid rgba(15,43,77,.16);border-radius:3px;background:rgba(255,255,255,.94);backdrop-filter:blur(6px);box-shadow:0 2px 10px rgba(13,27,42,.08)}
      .rail .hd{display:flex;align-items:center;gap:8px;width:100%;padding:7px 11px;border:none;background:transparent;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#51709a;cursor:pointer;appearance:none;transition:color .15s}
      .rail .hd:hover{color:#0f52a0}
      .rail .hd:focus-visible{outline:2px solid #00b0f0;outline-offset:-2px}
      .rail .hd .cv{margin-left:auto;font-size:10px;line-height:1;color:#0f52a0;transition:transform .18s}
      .rail.collapsed .chip{display:none}
      .rail.collapsed .hd .cv{transform:rotate(-90deg)}
      .rail .chip{display:flex;align-items:center;gap:8px;width:100%;padding:6px 11px;border:none;border-top:1px solid rgba(15,43,77,.1);border-radius:0;background:transparent;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#28425e;cursor:pointer;transition:background .15s,color .15s,opacity .15s;user-select:none;appearance:none;line-height:1.4;text-align:left}
      .rail .chip:hover{background:rgba(15,82,160,.07)}
      .rail .chip:focus-visible{outline:2px solid #00b0f0;outline-offset:-2px}
      .bar .chip{display:inline-flex;align-items:center;gap:8px;padding:6px 11px;border-radius:3px;border:1px solid rgba(15,43,77,.16);background:rgba(255,255,255,.92);backdrop-filter:blur(6px);font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#28425e;cursor:pointer;transition:background .15s,color .15s,border-color .15s,opacity .15s;user-select:none;appearance:none;line-height:1.4;text-align:left}
      .bar .chip:hover{border-color:#0f52a0}
      .bar .chip:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
      .chip.off{opacity:.42}
      .chip .sw{width:10px;height:10px;border-radius:2px;flex:none}
      .chip .n{margin-left:auto;color:#7b8ba0;font-size:9px}
      .chip.on{background:#0f52a0;color:#fff;border-color:#0f52a0}
      .chip.on .n{color:#a8c8ea}
      .bar{position:absolute;top:14px;right:14px;z-index:3;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:min(58%,540px)}
      .panel{position:absolute;left:14px;bottom:14px;z-index:4;max-width:360px;background:rgba(7,36,72,.94);backdrop-filter:blur(8px);border-left:3px solid #00b0f0;border-radius:3px;padding:14px 18px 15px;color:#fff;opacity:0;transform:translateY(6px);transition:opacity .2s,transform .2s;pointer-events:none}
      .panel.show{opacity:1;transform:none}
      .panel .top{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
      .panel h3{margin:0;font-family:'Barlow Semi Condensed',sans-serif;font-weight:700;font-size:20px;letter-spacing:.03em;text-transform:uppercase}
      .panel .tag{font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:3px 7px;border-radius:2px;background:#00b0f0;color:#072448}
      .panel .blurb{margin:8px 0 9px;font-size:12.5px;line-height:1.5;color:#c9dcf2}
      .panel .spec{display:flex;flex-direction:column;gap:4px}
      .panel .spec span{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.06em;color:#7fd4ff}
      .hint{position:absolute;right:14px;bottom:14px;z-index:3;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:9.5px;line-height:1.75;letter-spacing:.09em;text-transform:uppercase;color:#5d789c}
      .load{position:absolute;inset:0;display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#51709a;background:#f7f8f9;transition:opacity .4s;z-index:5}
      .load.gone{opacity:0;pointer-events:none}
      .stage{position:absolute;inset:0;z-index:1;outline:none;pointer-events:none}
      .stage:focus-visible{box-shadow:inset 0 0 0 2px #00b0f0}
      @media (max-width:640px){.rail{display:none}.bar{max-width:calc(100% - 28px)}}
    </style>
    <div class="stage" tabindex="0" role="application"></div>
    <div class="rail"></div>
    <div class="bar"></div>
    <div class="panel"><div class="top"><h3></h3><span class="tag"></span></div><div class="blurb"></div><div class="spec"></div></div>
    <div class="hint">Drag to orbit \u00b7 Scroll to zoom<br>Hover a unit \u00b7 Click to inspect</div>
    <div class="load">Building roof model\u2026</div>`;
    this._els={rail:sh.querySelector('.rail'),bar:sh.querySelector('.bar'),panel:sh.querySelector('.panel'),load:sh.querySelector('.load')};
    this._stage=sh.querySelector('.stage');
    this._stage.setAttribute('aria-label','Interactive 3D model of a data-centre rooftop plant deck with cooling towers mounted on power-module containers over two roof levels. Hover or click a unit to inspect it. Press 1 for the aerial view, 2 for the tower row, 3 for the plan view, 4 for the stair at the level change, B to show or hide the building, S for the screen wall, F for the fans, C for colour by system, A to show all, R to reset.');
    this._stage.addEventListener('keydown',this._onKey);
    this._reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._hidden={};this._fans=!this._reduce;this._colour=this.getAttribute('color-by')==='true';
    this._view='aerial';
    // the host runtime strips attributes off this element, so focus + shortcuts live on
    // the shadow-root stage instead, with a window-level fallback while the pointer is over it
    this._winKey=(e)=>{if(this._pointerIn&&this._onScreen!==false)this._onKey(e);};
    addEventListener('keydown',this._winKey);
    this.addEventListener('pointerenter',()=>{this._pointerIn=true;});
    this.addEventListener('pointerleave',()=>{this._pointerIn=false;});
    this._observe();
  }
  _observe(){
    const start=()=>{if(this._started)return;this._started=true;
      import(THREE_URL).then(T=>{try{this._init(T);}catch(e){this._fail(e);}}).catch(e=>this._fail(e));};
    // start as soon as we are in the document (timers fire even while the tab is throttled)
    setTimeout(start,60);
    if(this._vis)return;
    this._vis=new IntersectionObserver(es=>es.forEach(e=>{this._onScreen=e.isIntersecting;if(e.isIntersecting)start();}),{rootMargin:'240px'});
    this._vis.observe(this);
  }
  _resume(){if(this._tick&&!this._raf)this._tick();}
  disconnectedCallback(){
    if(this._vis){this._vis.disconnect();this._vis=null;}
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}
    clearTimeout(this._bin);
    this._bin=setTimeout(()=>{
      if(this.isConnected)return;
      removeEventListener('keydown',this._winKey);
      if(this._dispose)this._dispose();
    },1200);
  }
  _fail(e){console.error('lm-rooftop-viewer failed:',e);this._els.load.textContent='3D view unavailable in this browser';}
  _onKey=(e)=>{
    const k=e.key;
    if(k==='1'){this._setView('aerial');}
    else if(k==='2'){this._setView('towers');}
    else if(k==='3'){this._setView('plan');}
    else if(k==='4'){this._setView('stair');}
    else if(k==='5'){this._setView('sign');}
    else if(k==='s'||k==='S'){this._toggle('roof');}
    else if(k==='f'||k==='F'){this._fans=!this._fans;this._sync();}
    else if(k==='c'||k==='C'){this._colour=!this._colour;if(this._applyColour)this._applyColour();this._sync();}
    else if(k==='a'||k==='A'){this._hidden={};if(this._applyVis)this._applyVis();this._sync();}
    else if(k==='r'||k==='R'){this._select&&this._select(null);this._setView('aerial');}
    else if(k==='Escape'){this._select&&this._select(null);}
    else if(k==='h'||k==='H'){this._toggleRail&&this._toggleRail();}
    else return;
    e.preventDefault();
  };
  _buildUI(counts){
    const hd=document.createElement('button');hd.type='button';hd.className='hd';
    hd.innerHTML='<span class="lb">Categories</span><span class="cv">\u25BE</span>';
    hd.setAttribute('aria-expanded','true');
    hd.addEventListener('click',()=>this._toggleRail());
    this._els.rail.appendChild(hd);this._railHd=hd;
    this._toggleRail=(force)=>{
      const collapsed=force!==undefined?force:!this._els.rail.classList.contains('collapsed');
      this._els.rail.classList.toggle('collapsed',collapsed);
      hd.querySelector('.lb').textContent=collapsed?'Filters':'Categories';
      hd.setAttribute('aria-expanded',String(!collapsed));
    };
    this._catChips={};
    ORDER.forEach(cat=>{
      const C=CATS[cat];
      const b=document.createElement('button');b.type='button';b.className='chip';
      b.innerHTML=`<span class="sw" style="background:#${C.color.toString(16).padStart(6,'0')}"></span>${C.name}<span class="n">${counts[cat]||0}</span>`;
      b.addEventListener('click',()=>this._toggle(cat));
      this._els.rail.appendChild(b);this._catChips[cat]=b;
    });
    const mk=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=label;
      b.addEventListener('click',fn);this._els.bar.appendChild(b);return b;};
    this._vChips={
      aerial:mk('Aerial',()=>this._setView('aerial')),
      towers:mk('Tower row',()=>this._setView('towers')),
      stair:mk('Level change',()=>this._setView('stair')),
      plan:mk('Plan',()=>this._setView('plan')),
      sign:mk('Signage',()=>this._setView('sign'))
    };
    this._fanChip=mk('Fans',()=>{this._fans=!this._fans;this._sync();});
    this._colChip=mk('Colour by system',()=>{this._colour=!this._colour;if(this._applyColour)this._applyColour();this._sync();});
    mk('Show all',()=>{this._hidden={};if(this._applyVis)this._applyVis();this._sync();});
    this._sync();
  }
  _toggle(cat){this._hidden[cat]=!this._hidden[cat];if(this._applyVis)this._applyVis();this._sync();}
  _setView(v){this._view=v;this._sync();if(this._goView)this._goView(v);}
  _sync(){
    if(this._catChips)ORDER.forEach(c=>this._catChips[c].classList.toggle('off',!!this._hidden[c]));
    if(this._vChips)Object.keys(this._vChips).forEach(v=>this._vChips[v].classList.toggle('on',this._view===v));
    if(this._fanChip)this._fanChip.classList.toggle('on',this._fans);
    if(this._colChip)this._colChip.classList.toggle('on',this._colour);
  }
  /* ---------- canvas art ---------- */
  _tex(THREE,w,h,draw,rx,ry){
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);t.anisotropy=6;
    if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace;
    if(rx||ry){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);}
    return t;
  }
  _finTex(THREE){ // finned coil face of a cooling tower
    return this._tex(THREE,64,64,(g,w,h)=>{
      g.fillStyle='#8e959c';g.fillRect(0,0,w,h);
      for(let y=0;y<h;y+=4){g.fillStyle=y%8?'#a4abb2':'#767d85';g.fillRect(0,y,w,2);}
      g.strokeStyle='rgba(50,58,66,.45)';g.lineWidth=3;g.strokeRect(1.5,1.5,w-3,h-3);
    },1,8);
  }
  _ribTex(THREE,base,rib,joint){ // ribbed metal cladding, with faint horizontal panel joints
    return this._tex(THREE,64,64,(g,w,h)=>{
      g.fillStyle=base;g.fillRect(0,0,w,h);
      for(let x=0;x<w;x+=8){g.fillStyle=rib;g.fillRect(x,0,2.4,h);}
      if(joint){g.fillStyle=joint;g.fillRect(0,0,w,1.4);}
    },18,1);
  }
  _glassTex(THREE){ // dark mullioned curtain wall, as in the reference
    return this._tex(THREE,64,64,(g,w,h)=>{
      g.fillStyle='#41474c';g.fillRect(0,0,w,h);
      g.fillStyle='#4e565c';g.fillRect(0,0,w,h*.4);
      g.strokeStyle='#9aa2a8';g.lineWidth=2.4;
      for(let x=0;x<=w;x+=8){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
      g.strokeStyle='#7d858b';g.lineWidth=2;
      for(let y=0;y<=h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
    },34,1);
  }
  _skyTex(THREE){ // soft studio gradient behind the model
    return this._tex(THREE,8,256,(g,w,h)=>{
      const grd=g.createLinearGradient(0,0,0,h);
      grd.addColorStop(0,'#ffffff');grd.addColorStop(.55,'#f2f4f6');grd.addColorStop(1,'#dfe3e7');
      g.fillStyle=grd;g.fillRect(0,0,w,h);
    });
  }
  _groundTex(THREE){ // plain site slab — neutral, no context clutter
    return this._tex(THREE,8,8,(g,w,h)=>{g.fillStyle='#c6cbcf';g.fillRect(0,0,w,h);});
  }
  _signTex(THREE){
    return this._tex(THREE,512,128,(g,w,h)=>{
      g.fillStyle='#3d444b';g.fillRect(0,0,w,h);
      g.font='800 64px "Barlow Semi Condensed",sans-serif';g.textBaseline='middle';
      const a='LONG',b='MOTIVE',wa=g.measureText(a).width,wb=g.measureText(b).width,x0=(w-wa-wb)/2;
      g.fillStyle='#ffffff';g.fillText(a,x0,h/2+2);
      g.fillStyle='#00b0f0';g.fillText(b,x0+wa,h/2+2);
    });
  }
  _init(THREE){
    const sh=this.shadowRoot;
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    sh.insertBefore(renderer.domElement,this._els.rail);
    const scene=new THREE.Scene();
    scene.background=this._skyTex(THREE);
    scene.fog=new THREE.Fog(0xeef1f4,280,640);
    const camera=new THREE.PerspectiveCamera(37,1,.5,900);
    { // soft studio environment so the metal and cladding pick up direction
      const env=new THREE.Scene();env.background=new THREE.Color(0xdde3e8);
      const em=(c,i)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
      const eb=(w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);env.add(b);};
      eb(400,20,400,0,220,0,em(0xffffff,1.05));
      eb(20,300,400,-260,90,0,em(0xfff1dd,.6));
      eb(20,300,400,260,90,0,em(0xdae6f2,.4));
      const pm=new THREE.PMREMGenerator(renderer);
      scene.environment=pm.fromScene(env,.04).texture;pm.dispose();
    }
    scene.add(new THREE.HemisphereLight(0xffffff,0xb9c1c8,.4));
    const key=new THREE.DirectionalLight(0xfff1da,2.35);
    key.position.set(-165,120,120);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);key.shadow.bias=-0.0009;key.shadow.radius=2.2;
    const sc=key.shadow.camera;sc.left=-125;sc.right=125;sc.top=125;sc.bottom=-125;sc.near=20;sc.far=460;
    scene.add(key);
    const fill=new THREE.DirectionalLight(0xe4edf5,.26);fill.position.set(110,50,-125);scene.add(fill);

    const M=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.62,metalness:m??.12});
    const MAT={
      deck:M(0x9aa1a8,.95,.03), deckUp:M(0xa8afb5,.95,.03),
      screen:new THREE.MeshStandardMaterial({map:this._ribTex(THREE,'#4c4845','#3a3734','#5a5652'),roughness:.66,metalness:.22}),
      coping:M(0xb4b0aa,.55,.35), edge:M(0x8f969d,.85,.06),
      galv:M(0xd7dcdf,.45,.55), steel:M(0xbcc3c8,.5,.5), dark:M(0x4a5259,.6,.3),
      towerBody:new THREE.MeshStandardMaterial({map:this._ribTex(THREE,'#f2f4f5','#dde2e5','#c7ced3'),roughness:.5,metalness:.3}),
      fin:new THREE.MeshStandardMaterial({map:this._finTex(THREE),roughness:.5,metalness:.5}),
      towerTop:M(0xe4e8ea,.5,.35), shroud:M(0xaeb6bd,.55,.4), blade:M(0x565e66,.6,.3),
      plate:M(0x2f6fb5,.4,.3), band:M(0xc0392b,.5,.2),
      mod:new THREE.MeshStandardMaterial({map:this._ribTex(THREE,'#f0f2f3','#dfe3e6'),roughness:.5,metalness:.14}),
      modTop:M(0xdfe3e6,.6,.2), red:M(0xbf3a30,.5,.2),
      white:M(0xf1f3f4,.5,.14), hutRoof:M(0xc6ccd1,.5,.3),
      pipe:M(0xeceff1,.32,.5), pipeBand:M(0xd2d9de,.4,.5),
      grate:M(0xcdd3d7,.55,.5), tan:M(0xd9cfa6,.6,.12),
      glass:new THREE.MeshStandardMaterial({map:this._glassTex(THREE),roughness:.16,metalness:.5}),
      base:M(0xcfc9be,.8,.06), ground:new THREE.MeshStandardMaterial({map:this._groundTex(THREE),roughness:1})
    };
    const catMat={};ORDER.forEach(c=>catMat[c]=new THREE.MeshStandardMaterial({color:CATS[c].color,roughness:.55,metalness:.18}));

    const pick=[],byCat={},units=[],fans=[],G={};
    const box=(w,h,d)=>{const k='b'+w+'_'+h+'_'+d;return G[k]||(G[k]=new THREE.BoxGeometry(w,h,d));};
    const cyl=(r,hh,s)=>{const k='c'+r+'_'+hh+'_'+(s||14);return G[k]||(G[k]=new THREE.CylinderGeometry(r,r,hh,s||14));};
    const elb=(r,br)=>{const k='e'+r+'_'+br;return G[k]||(G[k]=new THREE.TorusGeometry(br,r,10,12,Math.PI/2));};
    let unit=null;
    const open=(cat,tag)=>{unit={cat:cat,tag:tag,meshes:[]};units.push(unit);return unit;};
    const add=(geo,mat,x,y,z,o)=>{
      const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);
      if(o){if(o.ry)m.rotation.y=o.ry;if(o.rx)m.rotation.x=o.rx;if(o.rz)m.rotation.z=o.rz;}
      const light=o&&o.light;
      m.castShadow=!light;m.receiveShadow=true;
      ((o&&o.parent)||scene).add(m);
      const cat=(o&&o.cat)||(unit&&unit.cat);
      if(cat){
        m.userData.cat=cat;m.userData.m0=mat;
        if(unit&&(!o||!o.cat)){m.userData.unit=unit;unit.meshes.push(m);}
        (byCat[cat]=byCat[cat]||[]).push(m);
        if(!o||!o.noPick)pick.push(m);
      }
      return m;
    };
    const grp=(x,y,z,ry)=>{const g=new THREE.Group();g.position.set(x,y,z);if(ry)g.rotation.y=ry;scene.add(g);return g;};

    /* ================= building shell ================= */
    const BW=130,BD=64,BH=22,SCR=4.6;
    const UP=5.5;                       // upper deck height above the lower deck
    const STEP=-18;                     // x of the level change
    const SCR_HI=UP+4.2;                // screen wall along the upper deck — taller than the plant base
    const IN_X=BW/2-1.4, IN_Z=BD/2-1.4; // inside face of the screen wall: nothing may cross this
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(760,760),MAT.ground);
    ground.rotation.x=-Math.PI/2;ground.position.y=-3;ground.receiveShadow=true;scene.add(ground);

    /* ================= two roof decks + screen wall ================= */
    open('roof','ROOF-LOWER');
    add(box(BW,.5,BD),MAT.deck,0,-.25,0);
    open('roof','ROOF-UPPER');
    const UW=BW/2-STEP-1.2;                          // upper deck runs from STEP to the far end
    add(box(UW,UP,BD-2.4),MAT.deckUp,STEP+UW/2,UP/2,0);
    add(box(.5,UP+.3,BD-2.4),MAT.edge,STEP-.2,UP/2,0);   // the riser face at the step
    open('roof','SCREEN-WALL');
    const wallSeg=(w,d,x,z,h)=>{add(box(w,h,d),MAT.screen,x,h/2,z);add(box(w+.36,.38,d+.36),MAT.coping,x,h+.19,z);};
    const loLen=STEP+BW/2, upLen=BW/2-STEP;
    [-1,1].forEach(s=>{
      const z=s*(BD/2-.6);
      wallSeg(loLen,1.2,-BW/2+loLen/2,z,SCR);        // low end
      wallSeg(upLen,1.2,STEP+upLen/2,z,SCR_HI);     // taller along the raised deck
    });
    wallSeg(1.2,BD-2.4,-BW/2+.6,0,SCR);
    wallSeg(1.2,BD-2.4,BW/2-.6,0,SCR_HI);
    // client wordmark: individually raised letters, so the artwork keeps its transparency.
    // The supplied PNG is cropped and recoloured for dark cladding in a live canvas (white
    // "DAY" + brand green "ONE"), each pixel keeping its own alpha — no backing panel.
    const signW=22,signH=signW/5;
    const signMat=new THREE.MeshStandardMaterial({transparent:true,alphaTest:.35,roughness:.4,metalness:.12,side:THREE.DoubleSide,color:0xffffff});
    const logo=new Image();
    logo.onload=()=>{
      const iw=logo.naturalWidth,ih=logo.naturalHeight;
      const c1=document.createElement('canvas');c1.width=iw;c1.height=ih;
      const g1=c1.getContext('2d');g1.clearRect(0,0,iw,ih);g1.drawImage(logo,0,0);
      const src=g1.getImageData(0,0,iw,ih).data;
      let x0=iw,y0=ih,x1=0,y1=0;
      for(let y=0;y<ih;y++)for(let x=0;x<iw;x++){
        const a=src[((y*iw+x)<<2)+3];
        if(a>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
      }
      const bw=Math.max(1,x1-x0+1),bh=Math.max(1,y1-y0+1);
      // 1:1 crop only — any scaled canvas draw smears the alpha and fills the cutout
      const c2=document.createElement('canvas');c2.width=bw;c2.height=bh;
      const g2=c2.getContext('2d');g2.clearRect(0,0,bw,bh);
      g2.drawImage(logo,x0,y0,bw,bh,0,0,bw,bh);
      const im=g2.getImageData(0,0,bw,bh),p=im.data;
      // the supplied artwork has an opaque white plate behind the letters: key the plate
      // out and keep only the glyphs — dark ink becomes white, the green half stays green
      for(let k=0;k<p.length;k+=4){
        const a0=p[k+3];
        if(!a0){p[k+3]=0;continue;}
        const r=p[k],gg=p[k+1],b=p[k+2],lum=(r+gg+b)/3;
        if(gg-r>50&&gg-b>25){p[k]=26;p[k+1]=219;p[k+2]=127;p[k+3]=a0;}
        else{p[k]=246;p[k+1]=248;p[k+2]=249;p[k+3]=Math.max(0,Math.min(a0,Math.round(255-lum*1.2)));}
      }
      g2.putImageData(im,0,0);
      const t=new THREE.CanvasTexture(c2);
      if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace;
      t.anisotropy=8;t.generateMipmaps=true;
      signMat.map=t;signMat.needsUpdate=true;
      sign.scale.set(1,(bh/bw)*5,1);   // keep the wordmark's own proportions
    };
    logo.onerror=()=>{sign.visible=false;};
    logo.src='assets/dayone-logo.png';
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(signW,signH),signMat);
    sign.position.set(38,SCR_HI*.64,BD/2+.42);sign.castShadow=true;scene.add(sign);
    sign.userData.cat='roof';sign.userData.m0=signMat;byCat.roof.push(sign);
    this._signMesh=sign;
    [-1,1].forEach(s=>{ // standoff brackets behind the letters
      const b=new THREE.Mesh(box(.16,.16,.5),MAT.galv);
      b.position.set(38+s*signW*.34,SCR_HI*.64,BD/2+.18);b.castShadow=true;scene.add(b);
    });

    /* ================= builders ================= */
    // cooling tower — sits on whatever deck y it is given
    const tower=(x,y,z,tag)=>{
      open('tower',tag);
      const g=grp(x,y,z);const P={parent:g};
      add(box(5.6,.35,5.0),MAT.steel,0,.18,0,P);                       // frame under the casing
      add(box(5.4,4.2,4.8),MAT.towerBody,0,2.45,0,P);                  // casing
      add(box(5.44,.28,4.84),MAT.band,0,4.32,0,P);                     // red trim band, as photographed
      add(box(5.46,3.4,.06),MAT.fin,0,2.4,2.42,P);                     // louvred coil faces
      add(box(5.46,3.4,.06),MAT.fin,0,2.4,-2.42,P);
      add(box(.06,3.4,4.84),MAT.fin,2.71,2.4,0,P);
      add(box(5.5,.3,4.9),MAT.towerTop,0,4.7,0,P);                     // fan deck
      add(box(.9,.5,.06),MAT.plate,-1.4,3.4,2.46,{parent:g,light:true}); // maker plate
      for(let i=0;i<2;i++){
        const fz=-1.15+i*2.3;
        add(cyl(1.02,.5,18),MAT.shroud,0,5.05,fz,{parent:g,light:true});
        const fg=new THREE.Group();fg.position.set(0,5.2,fz);g.add(fg);fans.push(fg);
        for(let b=0;b<4;b++){const bl=add(box(1.7,.06,.42),MAT.blade,0,0,0,{parent:fg,light:true,ry:b*Math.PI/4+.2});bl.userData.unit=unit;}
        add(cyl(.22,.26,10),MAT.dark,0,5.26,fz,{parent:g,light:true});
      }
      add(box(.12,4.4,.7),MAT.galv,-2.78,2.4,-1.5,P);                   // ladder to the fan deck
      return g;
    };
    // prefabricated power-module container — carries two towers on its roof
    const powerModule=(x,y,z,tag)=>{
      open('module',tag);
      const g=grp(x,y,z);const P={parent:g};
      add(box(12.5,.4,5.2),MAT.steel,0,.2,0,P);
      add(box(12.4,3.3,5.1),MAT.mod,0,2.05,0,P);
      add(box(12.48,.34,5.16),MAT.red,0,1.5,0,P);                      // red band, as photographed
      add(box(12.6,.36,5.3),MAT.modTop,0,3.85,0,P);                    // module roof (tower plinth)
      [-3.4,3.4].forEach(dx=>add(box(1.5,2.2,.08),MAT.white,dx,1.9,2.58,P));   // door leaves
      add(box(.5,1.1,1.1),MAT.dark,6.3,2.2,-1.3,P);                    // control box
      return g;
    };
    // chiller module — the red-banded packaged units in the middle run
    const chillerModule=(x,y,z,tag)=>{
      open('chillerMod',tag);
      const g=grp(x,y,z);const P={parent:g};
      add(box(9.4,.4,4.6),MAT.steel,0,.2,0,P);
      add(box(9.2,3.0,4.5),MAT.white,0,1.9,0,P);
      add(box(9.26,.3,4.56),MAT.red,0,1.35,0,P);
      add(box(9.3,.3,4.7),MAT.modTop,0,3.5,0,P);
      add(box(.4,1.2,1.0),MAT.dark,4.7,2.0,1.1,P);
      return g;
    };
    // small remote condenser (lower deck field)
    const condenser=(x,z,tag)=>{
      open('condenser',tag);
      const g=grp(x,0,z);const P={parent:g};
      [-1.5,1.5].forEach(dx=>add(box(.3,.55,2.0),MAT.steel,dx,.3,0,P));
      add(box(3.4,1.15,1.9),MAT.towerBody,0,1.2,0,P);
      add(box(3.44,.95,.05),MAT.fin,0,1.2,.97,P);
      add(box(3.44,.95,.05),MAT.fin,0,1.2,-.97,P);
      add(box(3.4,.14,2.0),MAT.towerTop,0,1.85,0,P);
      for(let i=0;i<2;i++){
        const fx=-.82+i*1.64;
        add(cyl(.55,.22,14),MAT.shroud,fx,1.97,0,{parent:g,light:true});
        const fg=new THREE.Group();fg.position.set(fx,2.08,0);g.add(fg);fans.push(fg);
        for(let b=0;b<4;b++){const bl=add(box(.9,.04,.22),MAT.blade,0,0,0,{parent:fg,light:true,ry:b*Math.PI/4});bl.userData.unit=unit;}
      }
      return g;
    };
    // pipe bundle along X, with flanges and sleeper supports
    const bundleX=(x0,x1,y,z,radii,tag,spread)=>{
      open('pipe',tag);
      const len=x1-x0,cx=(x0+x1)/2,sp=spread||1.25;
      radii.forEach((r,i)=>{
        const dz=z+(i-(radii.length-1)/2)*sp;
        const p=add(cyl(r,len,14),MAT.pipe,cx,y,dz,{rz:Math.PI/2});p.userData.unit=unit;
        for(let x=x0+6;x<x1-2;x+=12)add(cyl(r+.07,.34,14),MAT.pipeBand,x,y,dz,{rz:Math.PI/2,light:true,noPick:true});
      });
    };
    // pipe bundle along Z
    const bundleZ=(z0,z1,y,x,radii,tag,spread)=>{
      open('pipe',tag);
      const len=Math.abs(z1-z0),cz=(z0+z1)/2,sp=spread||1.25;
      radii.forEach((r,i)=>{
        const dx=x+(i-(radii.length-1)/2)*sp;
        const p=add(cyl(r,len,14),MAT.pipe,dx,y,cz,{rx:Math.PI/2});p.userData.unit=unit;
      });
    };
    // U-bend riser: up from a header, across, and down into a unit connection
    const riser=(x,z0,z1,y0,y1,r,tag)=>{
      open('pipe',tag);
      const br=Math.max(.5,r*2.2);
      add(cyl(r,y1-y0-br,12),MAT.pipe,x,(y0+y1-br)/2,z0);
      add(elb(r,br),MAT.pipe,x,y1-br,z0+(z1>z0?br:-br),{rx:Math.PI/2,ry:z1>z0?0:Math.PI/2,rz:0});
      add(cyl(r,Math.abs(z1-z0)-br*2,12),MAT.pipe,x,y1,(z0+z1)/2,{rx:Math.PI/2});
      add(cyl(r,1.4,12),MAT.pipe,x,y1-.7,z1);
      add(cyl(r+.09,.3,12),MAT.pipeBand,x,y1-1.3,z1,{light:true,noPick:true});
    };
    // trestle / sleeper support
    const trestle=(x,y,z,w,tag)=>{
      open('support',tag);
      const g=grp(x,y,z);const P={parent:g};
      const h=1.5;
      [-w/2+.3,w/2-.3].forEach(dz=>add(box(.3,h,.3),MAT.galv,0,h/2,dz,P));
      add(box(.34,.26,w),MAT.galv,0,h+.1,0,P);
      return g;
    };
    // catwalk at module-roof level, with handrails
    const catwalk=(x0,x1,y,z,tag)=>{
      open('stair',tag);
      const g=grp((x0+x1)/2,y,z);const P={parent:g},len=x1-x0;
      add(box(len,.14,2.2),MAT.grate,0,0,0,P);
      [-1.05,1.05].forEach(dz=>{
        add(box(len,.09,.09),MAT.galv,0,1.1,dz,P);
        add(box(len,.09,.09),MAT.galv,0,.6,dz,P);
        for(let x=-len/2+1.1;x<len/2;x+=2.4)add(box(.09,1.15,.09),MAT.galv,x,.55,dz,{parent:g,light:true});
      });
      for(let x=-len/2+2;x<len/2;x+=6)add(box(.26,y>0?2.2:1.2,.26),MAT.galv,x,-1.1,0,{parent:g,light:true});
      return g;
    };
    // stair flight from y0 up to y1 running along +x, with a landing at the top
    const stair=(x0,z,y0,y1,tag,dir)=>{
      open('stair',tag);
      const d=dir||1,n=Math.max(4,Math.round((y1-y0)/.26)),run=.38,rise=(y1-y0)/n;
      const g=grp(x0,y0,z);const P={parent:g};
      for(let i=0;i<n;i++)add(box(run,.1,2.2),MAT.grate,d*(i*run),rise*(i+1),0,{parent:g,light:true});
      const L=n*run,ang=d*Math.atan2(y1-y0,L),hyp=Math.hypot(L,y1-y0);
      [-1.15,1.15].forEach(dz=>{
        const str=add(box(hyp,.3,.12),MAT.galv,d*L/2,(y1-y0)/2-.12,dz,P);str.rotation.z=ang;   // stringer
        const rail=add(box(hyp,.09,.09),MAT.galv,d*L/2,(y1-y0)/2+1.05,dz,P);rail.rotation.z=ang;
        const mid=add(box(hyp,.07,.07),MAT.galv,d*L/2,(y1-y0)/2+.6,dz,P);mid.rotation.z=ang;
        for(let i=1;i<n;i+=3)add(box(.09,1.1,.09),MAT.galv,d*(i*run),rise*i+.55,dz,{parent:g,light:true});
      });
      add(box(2.6,.14,2.6),MAT.grate,d*(L+1.3),y1-y0,0,P);              // landing
      [-1.25,1.25].forEach(dz=>{
        add(box(2.6,.09,.09),MAT.galv,d*(L+1.3),y1-y0+1.1,dz,P);
        add(box(.26,y1-y0,.26),MAT.galv,d*(L+1.3),(y1-y0)/2,dz,{parent:g,light:true});
      });
      return g;
    };
    // plant hut with a pitched roof and its own stair
    const hut=(x,y,z,w,d,tag)=>{
      open('hut',tag);
      const g=grp(x,y,z);const P={parent:g};
      add(box(w,3.4,d),MAT.white,0,1.7,0,P);
      add(box(w+.5,.3,d+.5),MAT.hutRoof,0,3.55,0,P);
      add(box(w*.55,.5,d+.5),MAT.hutRoof,0,3.85,0,P);
      add(box(.08,2.2,1.3),MAT.hutRoof,w/2+.05,1.2,d*.2,P);
      for(let i=0;i<4;i++)add(box(.34,.09,1.5),MAT.grate,w/2+.5+i*.34,.85-i*.22,d*.2,{parent:g,light:true});
      return g;
    };

    /* ================= layout ================= */
    // --- upper deck: two rows of power modules, each carrying two cooling towers ---
    const rowZ=[-19,-6.5];
    rowZ.forEach((z,ri)=>{
      for(let i=0;i<5;i++){
        const x=STEP+11+i*13.2;
        powerModule(x,UP,z,'PM-'+(ri+1)+String(i+1).padStart(2,'0'));
        tower(x-3.3,UP+4.03,z,'CT-'+(ri+1)+String(i*2+1).padStart(2,'0'));
        tower(x+3.3,UP+4.03,z,'CT-'+(ri+1)+String(i*2+2).padStart(2,'0'));
      }
      // catwalk along the module roofs, tucked against the row
      catwalk(STEP+4,STEP+70,UP+4.03,z+3.6,'CW-'+(ri+1));
    });
    // stairs from the upper deck up to the catwalks
    stair(STEP+6,-15.4,UP,UP+4.03,'ST-CW-1');
    stair(STEP+6,-2.9,UP,UP+4.03,'ST-CW-2');
    stair(STEP+46,-15.4,UP,UP+4.03,'ST-CW-3',-1);
    // --- upper deck: chiller module run + kiosk ---
    for(let i=0;i<4;i++)chillerModule(STEP+16+i*11,UP,7.5,'CM-'+String(i+1).padStart(2,'0'));
    open('elec','MCC-ROOF-01');
    add(box(14,4.4,6.4),MAT.white,46,UP+2.7,20);
    add(box(14.4,.4,6.8),MAT.coping,46,UP+5.1,20);
    [0,1,2,3].forEach(i=>add(box(.12,2.2,1.1),MAT.dark,38.9,UP+2.3,17.4+i*1.6));
    open('elec','CONT-01');
    add(box(80,.14,.9),MAT.galv,14,UP+3.4,IN_Z-2.5);
    for(let x=-12;x<=52;x+=8)add(box(.26,3.3,.26),MAT.galv,x,UP+1.7,IN_Z-2.5,{light:true});
    hut(20,UP,24,7,5.5,'HUT-01');
    hut(-6,UP,15,6,5,'HUT-02');

    // --- pipework: bundles the full length of the upper deck (kept inside the screen wall) ---
    bundleX(STEP+1,IN_X-1,UP+2.2,13.5,[.42,.42,.32,.32,.24,.24],'CHW-UPPER-A',1.3);
    bundleX(STEP+1,IN_X-1,UP+2.2,-26,[.4,.4,.3,.3],'CHW-UPPER-B',1.3);
    bundleX(STEP+1,IN_X-1,UP+1.5,-12.6,[.3,.3,.22],'CWR-UPPER-C',1.1);
    for(let x=STEP+5;x<IN_X-4;x+=9){
      trestle(x,UP,13.5,7.0,'PS-U'+String(Math.round((x-STEP)/9)).padStart(2,'0'));
      if(x<IN_X-14)trestle(x,UP,-26,5.0,'PS-N'+String(Math.round((x-STEP)/9)).padStart(2,'0'));
    }
    // U-bend risers from the header bundles up into each tower row
    for(let i=0;i<5;i++){
      const x=STEP+11+i*13.2;
      riser(x-4.6,13.5,-2.6,UP+2.2,UP+6.4,.3,'RS-A'+String(i+1).padStart(2,'0'));
      riser(x+4.6,-12.6,-16.4,UP+1.5,UP+5.6,.26,'RS-B'+String(i+1).padStart(2,'0'));
    }
    // cross-roof bundles tying the two decks together, stepping down at the level change
    bundleZ(-IN_Z+2,IN_Z-2,UP+2.2,STEP+3.5,[.34,.34,.26],'CHW-CROSS-01',1.15);
    bundleZ(-IN_Z+2,IN_Z-2,UP+2.2,44,[.3,.3],'CHW-CROSS-02',1.15);
    open('pipe','CHW-STEP-DOWN');
    [-6.4,-5.0,-3.6].forEach((dz,i)=>{
      const r=.34-i*.03, yU=UP+2.2, yL=2.4, xd=STEP-13.6, xEnd=-IN_X+2, run=xd-xEnd;
      add(cyl(r,15,12),MAT.pipe,STEP-5.6,yU,dz,{rz:Math.PI/2});          // along the upper deck
      add(cyl(r+.08,.32,12),MAT.pipeBand,STEP-12.4,yU,dz,{rz:Math.PI/2,light:true,noPick:true});
      add(cyl(r,yU-yL,12),MAT.pipe,xd,(yU+yL)/2,dz);                     // drop leg at the step
      add(cyl(r+.09,.34,12),MAT.pipeBand,xd,yL+.6,dz,{light:true,noPick:true});
      add(cyl(r,run,12),MAT.pipe,xd-run/2,yL,dz,{rz:Math.PI/2});         // across the lower deck
      add(box(.5,.9,.5),MAT.galv,xd,yL-1.3,dz,{light:true,noPick:true}); // anchor block
    });
    // --- the stair at the level change, beside the power modules ---
    stair(STEP-10.6,-22,0,UP,'ST-LEVEL-01');
    stair(STEP-10.6,2,0,UP,'ST-LEVEL-02');

    // --- lower deck: condenser field, skids, huts, pipe runs ---
    for(let r=0;r<4;r++)for(let c=0;c<5;c++)
      condenser(-58+c*5.6,-22+r*5.6,'RC-'+String(r*5+c+1).padStart(2,'0'));
    open('skid','HX-SKID-01');
    add(box(17,.5,9.5),MAT.steel,-44,.5,10);
    [0,1,2].forEach(i=>add(cyl(1.2,7.6,16),MAT.tan,-49+i*4.8,2.4,10,{rz:Math.PI/2}));
    open('skid','PUMP-SET-01');
    [0,1,2].forEach(i=>{add(box(2.6,1.5,1.9),MAT.dark,-30,1.4,3+i*3.4);add(cyl(.5,1.8,12),MAT.pipe,-28.2,1.5,3+i*3.4,{rz:Math.PI/2});});
    open('skid','BUFFER-VESSEL-01');
    [0,1].forEach(i=>add(cyl(1.5,6.4,18),MAT.white,-24+i*4,3.4,-4,{}));
    hut(-38,0,22,8,6,'HUT-03');
    bundleX(-IN_X+2,STEP-2,2.4,17,[.38,.38,.28,.28],'CHW-LOWER-A',1.25);
    bundleX(-IN_X+2,STEP-2,1.9,-27,[.3,.3],'CHW-LOWER-B',1.15);
    for(let x=-58;x<STEP-4;x+=9)trestle(x,0,17,5.0,'PS-L'+String(Math.round((x+58)/9)+1).padStart(2,'0'));
    bundleZ(-27,17,2.4,-20,[.28,.28],'CHW-LOWER-C',1.1);

    /* ================= unit boxes + highlight ================= */
    units.forEach(u=>{
      const bb=new THREE.Box3();u.meshes.forEach(m=>bb.expandByObject(m));
      u.box=bb;u.centre=bb.getCenter(new THREE.Vector3());u.size=bb.getSize(new THREE.Vector3());
    });
    const hlMat=new THREE.LineBasicMaterial({color:0x00b0f0});
    const hl=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),hlMat);
    hl.visible=false;scene.add(hl);
    const showHl=(u,strong)=>{
      if(!u||!u.size){hl.visible=false;return;}
      hl.visible=true;hlMat.color.setHex(strong?0x00b0f0:0x0f52a0);
      hl.scale.set(Math.max(u.size.x,.4)+.55,Math.max(u.size.y,.4)+.55,Math.max(u.size.z,.4)+.55);
      hl.position.copy(u.centre);
    };
    const counts={};ORDER.forEach(c=>counts[c]=units.filter(u=>u.cat===c).length);
    this._buildUI(counts);

    this._applyVis=()=>{
      ORDER.forEach(c=>{const v=!this._hidden[c];(byCat[c]||[]).forEach(m=>{m.visible=v;});});
      if(this._sel&&this._hidden[this._sel.cat]){this._sel=null;this._panel(null);hl.visible=false;}
    };
    this._applyColour=()=>{
      const on=this._colour;
      ORDER.forEach(c=>(byCat[c]||[]).forEach(m=>{m.material=on?catMat[c]:m.userData.m0;}));
    };
    if(this._colour)this._applyColour();
    this._panel=(u)=>{
      const p=this._els.panel;
      if(!u){p.classList.remove('show');return;}
      const C=CATS[u.cat];
      p.querySelector('h3').textContent=C.name;
      p.querySelector('.tag').textContent=u.tag;
      p.querySelector('.blurb').textContent=C.blurb;
      p.querySelector('.spec').innerHTML=C.spec.map(s=>'<span>'+s+'</span>').join('');
      p.classList.add('show');
    };

    /* ================= camera ================= */
    const VIEWS={
      aerial:{t:new THREE.Vector3(4,8,0),r:152,th:-2.36,ph:.94},
      towers:{t:new THREE.Vector3(14,12,-12),r:58,th:-2.08,ph:1.16},
      stair:{t:new THREE.Vector3(STEP-6,6,-14),r:44,th:-2.5,ph:1.15},
      plan:{t:new THREE.Vector3(2,4,0),r:178,th:-Math.PI/2,ph:.2},
      sign:{t:new THREE.Vector3(38,SCR_HI*.55,BD/2-2),r:46,th:.34,ph:1.27}
    };
    let V=VIEWS.aerial;
    let target=V.t.clone(),radius=V.r,theta=V.th,phi=V.ph;
    let tGoal=target.clone(),rGoal=radius,thGoal=theta,phGoal=phi,glide=false;
    let dragging=false,px=0,py=0;
    this._goView=(v)=>{
      const W=VIEWS[v]||VIEWS.aerial;
      tGoal=W.t.clone();rGoal=W.r;thGoal=W.th;phGoal=W.ph;glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;theta=thGoal;phi=phGoal;glide=false;}
    };
    this._select=(u)=>{
      this._sel=u||null;this._panel(u||this._hoverU);showHl(u||this._hoverU,!!u);
      if(u&&u.centre){
        tGoal=u.centre.clone();
        rGoal=Math.min(200,Math.max(20,Math.max(u.size.x,u.size.y,u.size.z)*3.2));
        thGoal=theta;phGoal=Math.min(1.3,Math.max(.55,phi));glide=true;
      }
    };
    const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{this._stage.focus({preventScroll:true});dragging=true;glide=false;px=e.clientX;py=e.clientY;cv.classList.add('drag');cv.setPointerCapture(e.pointerId);this._downAt=Date.now();});
    cv.addEventListener('pointerup',()=>{dragging=false;cv.classList.remove('drag');});
    cv.addEventListener('pointermove',e=>{
      if(dragging){theta-=(e.clientX-px)*.005;phi=Math.min(1.52,Math.max(.09,phi-(e.clientY-py)*.004));px=e.clientX;py=e.clientY;}
      else{const r=cv.getBoundingClientRect();this._mx=((e.clientX-r.left)/r.width)*2-1;this._my=-((e.clientY-r.top)/r.height)*2+1;this._hoverDirty=true;}
    });
    cv.addEventListener('wheel',e=>{e.preventDefault();glide=false;radius=Math.min(420,Math.max(18,radius*(1+e.deltaY*.0014)));},{passive:false});
    const ray=new THREE.Raycaster();const mv=new THREE.Vector2();
    cv.addEventListener('click',()=>{
      if(Date.now()-(this._downAt||0)>260)return;
      this._select(this._hoverU&&this._sel!==this._hoverU?this._hoverU:null);
    });
    const resize=()=>{const w=this.clientWidth||960,h=this.clientHeight||600;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    new ResizeObserver(resize).observe(this);resize();
    this.debugScene={scene,camera,renderer,root:scene,render:()=>renderer.render(scene,camera)};
    this._dispose=()=>{
      scene.traverse(o=>{if(o.geometry)o.geometry.dispose();
        const mm=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
        mm.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)v.dispose();});m.dispose();});});
      renderer.dispose();
    };
    const t0=performance.now();let last=t0;
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      if(this._onScreen===false||document.hidden)return;
      const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
      const k=this._reduce?1:Math.min(1,(now-t0)/2200),e=1-Math.pow(1-k,3);
      if(glide){
        target.lerp(tGoal,.055);radius+=(rGoal-radius)*.055;
        theta+=(thGoal-theta)*.055;phi+=(phGoal-phi)*.055;
        if(target.distanceTo(tGoal)<.4&&Math.abs(rGoal-radius)<.6)glide=false;
      }
      const rr=radius+(1-e)*80;
      camera.position.set(
        target.x+rr*Math.sin(phi)*Math.sin(theta),
        target.y+rr*Math.cos(phi)+(1-e)*22,
        target.z+rr*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(target);
      if(this._fans)fans.forEach((f,i)=>{f.rotation.y+=dt*(4.2+(i%5)*.32);});
      if(this._hoverDirty&&!dragging){
        this._hoverDirty=false;mv.set(this._mx,this._my);ray.setFromCamera(mv,camera);
        const hit=ray.intersectObjects(pick.filter(m=>m.visible),false)[0];
        const u=hit?(hit.object.userData.unit||null):null;
        if(u!==this._hoverU){
          this._hoverU=u;
          cv.style.cursor=u?'pointer':(dragging?'grabbing':'grab');
          if(!this._sel){this._panel(u);showHl(u,false);}
        }
      }
      if(this._els.load&&!this._loaded&&now-t0>240){this._loaded=true;this._els.load.classList.add('gone');}
      renderer.render(scene,camera);
    };
    this._goView('aerial');
    this._tick=tick;
    // dismiss the loading overlay on a timer too — rAF is throttled in hidden tabs
    setTimeout(()=>{if(this._els.load){this._loaded=true;this._els.load.classList.add('gone');}},400);
    tick();
  }
}
if(!customElements.get('lm-rooftop-viewer'))customElements.define('lm-rooftop-viewer',LMRooftopViewer);
})();
