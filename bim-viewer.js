/* <lm-bim-viewer> — Longmotive plant-room viewer, composed to k4-chillerroom-built.png:
   symmetrical corridor perspective — HVAC chiller units filling BOTH sides to the end
   of the room, thick black overhead piping networks with red-handwheel valves bridging
   the aisle, riser pairs with arrow stickers (red up / blue down, no wording), a DB
   strapped to one riser, glossy light-grey floor reflecting linear LED strips, bright
   white walls, and an end wall with a steel door.
   Looks: Realistic / BIM colours. Hover = highlight, click = isolate. */
(function(){
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const DISC={
  chw:{name:'Chilled Water',color:0x1668c4,css:'#1668c4',spec:['DN400 CHWS / CHWR RISERS','SUPPLY 6\u00b0C \u00b7 RETURN 12\u00b0C','CLASS-O INSULATION \u00b7 GROOVED JOINTS'],blurb:'Chilled-water risers and overhead mains \u2014 west chiller row.'},
  cdw:{name:'Condenser Water',color:0x00b0f0,css:'#00b0f0',spec:['DN450 CWS / CWR RISERS','TO ROOFTOP COOLING TOWERS','EPOXY-LINED CS PIPE'],blurb:'Condenser-water risers and overhead mains \u2014 east chiller row.'},
  fire:{name:'Fire Protection',color:0xd64545,css:'#d64545',spec:['DN150 PRE-ACTION MAIN','NFPA 13 \u00b7 DOUBLE-INTERLOCK','UPRIGHT HEADS \u00b7 EXTINGUISHER STATION'],blurb:'Pre-action sprinkler main along the aisle and extinguisher station.'},
  elec:{name:'Electrical',color:0xf2a33c,css:'#f2a33c',spec:['PIPE-MOUNTED LOCAL DB','CABLE LADDER AT HIGH LEVEL','CHILLER STARTER PANELS'],blurb:'Local DB strapped to a riser, ladder rack and starter panels.'},
  plant:{name:'Plant & Equipment',color:0x2f4f68,css:'#2f4f68',spec:['2 \u00d7 WATER-COOLED CHILLERS \u00b7 FRONT BAY','STACKED EVAP / COND BARRELS','HOUSEKEEPING PADS + ISOLATORS'],blurb:'Water-cooled chillers at the front of each row.'},
  ahu:{name:'HVAC Units',color:0x5f7a94,css:'#5f7a94',spec:['FULL-HEIGHT CRAH CABINETS','CHW COILS \u00b7 EC FAN WALLS','N+1 REDUNDANCY PER ROW'],blurb:'Banks of full-height HVAC cabinets lining the corridor to the end wall.'}
};
const ORDER=['plant','ahu','chw','cdw','fire','elec'];
const IDS=ORDER;
const FAMILY={plant:'Plant equipment',ahu:'Air handling',chw:'Pipework',cdw:'Pipework',fire:'Fire protection',elec:'Electrical'};
const SEC={};ORDER.forEach(k=>{SEC[k]={name:DISC[k].name,type:FAMILY[k],devices:DISC[k].spec.join(' \u00b7 '),note:DISC[k].blurb};});
const HUDCFG={views:[],walls:false,colour:true,explode:false,loadingLabel:'Building the plant room',
  extras:[{id:'flow',label:'Flow',key:'f',title:'Animate flow direction'}],
  hint:'Drag orbit &#183; Scroll zoom<br>R reset &#183; C colours &#183; F flow &#183; Esc show all'};
const ARIA='Interactive 3D chiller plant room. Drag or use arrow keys to orbit, scroll to zoom. Click a system to isolate it. Press R to reset, C for BIM colours, F for flow animation, Escape to show all.';
const LOOK={
  chw:{bim:[0x1668c4,.5,.2],real:[0x23262c,.68,.06]},
  cdw:{bim:[0x00b0f0,.5,.2],real:[0x1e2126,.68,.06]},
  fire:{bim:[0xd64545,.5,.2],real:[0x22252a,.65,.1]},
  elec:{bim:[0xf2a33c,.5,.2],real:[0x1c1f24,.5,.3]},
  plant:{bim:[0x2f4f68,.5,.2],real:[0x17191d,.48,.28]},
  ahu:{bim:[0x5f7a94,.5,.2],real:[0x212429,.5,.3]}
};
class LMBimViewer extends HTMLElement{
  connectedCallback(){
    if(this._wired) return; this._wired=true;
    const sh=this.attachShadow({mode:'open'});
    sh.innerHTML=LMHUD.markup(HUDCFG);
    this._mode='real';
    this._reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._flowOn=!this._reduce;
    this._sections={};
    this.tabIndex=0;
    this.setAttribute('role','application');
    this.setAttribute('aria-label',ARIA);
    this.addEventListener('keydown',this._onKey);
    this._hud=LMHUD.attach(this,sh,HUDCFG,{
      sections:this._sections,order:IDS,SEC,
      onView:()=>{},
      onReset:()=>{if(this._select)this._select(null);},
      onSelect:(id)=>{if(this._select)this._select(id);},
      onHover:(id)=>{if(this._applyHover)this._applyHover(id);},
      onVisibility:(fn)=>{if(this._applyVis)this._applyVis(fn);},
      onWalls:()=>{},
      onColour:(on)=>{this._mode=on?'bim':'real';if(this._applyMode)this._applyMode();},
      onExplode:(t)=>{if(this._applyExplode)this._applyExplode(t);},
      onExtra:(id)=>{if(id==='flow'&&this._toggleFlow)this._toggleFlow();}
    });
    this._hud.setExtra('flow',this._flowOn);
    // Lazy WebGL: only build the scene when the viewer is actually on screen
    const start=()=>{
      if(this._started)return;this._started=true;
      import(THREE_URL).then(T=>{try{this._init(T);}catch(e){this._fallback(e);}}).catch(e=>this._fallback(e));
    };
    this._vis=new IntersectionObserver((es)=>{
      es.forEach(e=>{this._onScreen=e.isIntersecting;if(e.isIntersecting)start();});
    },{rootMargin:'200px'});
    this._vis.observe(this);
  }
  disconnectedCallback(){
    if(this._vis){this._vis.disconnect();this._vis=null;}
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}
    this.removeEventListener('keydown',this._onKey);
    if(this._dispose)this._dispose();
  }
  _onKey=(e)=>{
    const k=e.key;
    if(k>='1'&&k<='5'){const d=ORDER[+k-1];if(d&&this._select){this._select(this._sel===d?null:d);e.preventDefault();}return;}
    if(k==='0'||k==='Escape'){if(this._select)this._select(null);e.preventDefault();return;}
    if(this._hud&&this._hud.key(k)){e.preventDefault();return;}
    if(this._orbitKey&&this._orbitKey(k))e.preventDefault();
  };
  _fallback(e){
    console.error('lm-bim-viewer failed:',e);
    if(this._hud)this._hud.fail();
  }
  _sync(){ if(!this._hud)return; const h=this._hud; h.sel=this._sel; h.hover=this._hoverD||null; h.sync(); }
  _toggleFlow(){ this._flowOn=!this._flowOn; if(this._hud)this._hud.setExtra('flow',this._flowOn); }
  _panel(d){ if(!this._hud)return; this._hud.setProps(d); this._hud.setTip(d?SEC[d].name:''); }
  _arrowTex(THREE,up){
    const c=document.createElement('canvas');c.width=96;c.height=180;
    const g=c.getContext('2d');
    g.fillStyle='#f2f4f6';g.fillRect(0,0,96,180);
    g.strokeStyle='#c2cad2';g.lineWidth=5;g.strokeRect(2,2,92,176);
    g.fillStyle=up?'#c22a2a':'#1d5bd6';
    g.save();g.translate(48,90);if(!up)g.rotate(Math.PI);
    g.beginPath();g.moveTo(0,-58);g.lineTo(34,-2);g.lineTo(15,-2);g.lineTo(15,58);g.lineTo(-15,58);g.lineTo(-15,-2);g.lineTo(-34,-2);g.closePath();g.fill();
    g.restore();
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  _stickersTex(THREE){
    const c=document.createElement('canvas');c.width=192;c.height=256;
    const g=c.getContext('2d');
    g.fillStyle='#141619';g.fillRect(0,0,192,256);
    g.strokeStyle='#2b2f35';g.lineWidth=4;g.strokeRect(6,6,180,244);
    const st=(x,y,w,h,col)=>{g.fillStyle='#f0f2f4';g.fillRect(x-2,y-2,w+4,h+4);g.fillStyle=col;g.fillRect(x,y,w,h);};
    st(22,30,34,22,'#c22a2a');st(66,30,34,22,'#1d5bd6');st(110,30,44,22,'#e8b13c');
    st(22,66,52,16,'#3fae5a');st(84,66,60,16,'#c22a2a');
    g.fillStyle='#e8b13c';g.beginPath();g.moveTo(96,120);g.lineTo(118,156);g.lineTo(74,156);g.closePath();g.fill();
    g.fillStyle='#141619';g.font='700 26px sans-serif';g.textAlign='center';g.fillText('!',96,150);
    st(30,190,56,26,'#f0f2f4');st(104,190,56,26,'#1d5bd6');
    const t=new THREE.CanvasTexture(c);return t;
  }
  _init(THREE){
    const sh=this.shadowRoot;
    const renderer=new THREE.WebGLRenderer({canvas:sh.querySelector('canvas'),antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    const scene=new THREE.Scene();
    const world=new THREE.Group();scene.add(world); // everything rises in on load
    scene.background=null;renderer.setClearColor(0x000000,0); // CSS navy gradient shows through
    scene.fog=new THREE.Fog(0x0a1c31,32,80);
    const camera=new THREE.PerspectiveCamera(46,1,.1,140);
    { // procedural env map for reflections (black insulation + glossy floor)
      const env=new THREE.Scene();env.background=new THREE.Color(0x0a0c0f);
      const em=(c,i)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
      const put=(w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);env.add(b);};
      put(2.5,.4,26,-1.1,9,0,em(0xffffff,5));      // linear LED banks overhead
      put(2.5,.4,26,1.1,9,0,em(0xffffff,5));
      put(.4,6,20,-9,3,0,em(0xdfeaff,2));
      put(.4,6,20,9,3,0,em(0xf6f9fc,2));
      put(16,5,.4,0,2.5,-16,em(0xcfdae6,1));
      const pm=new THREE.PMREMGenerator(renderer);
      scene.environment=pm.fromScene(env,.05).texture;pm.dispose();
    }
    scene.add(new THREE.HemisphereLight(0xf2f7fc,0x6d7885,.55));
    const key=new THREE.DirectionalLight(0xffffff,1.6);
    key.position.set(7,15,9);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);key.shadow.bias=-0.0004;
    const sc=key.shadow.camera;sc.left=-16;sc.right=16;sc.top=20;sc.bottom=-20;sc.far=60;
    scene.add(key);
    const fill=new THREE.DirectionalLight(0xdce8f4,.45);fill.position.set(-8,9,-10);scene.add(fill);
    const groups={},pick=[],decals=[];
    const mat=(disc,opt)=>new THREE.MeshStandardMaterial(Object.assign({color:DISC[disc].color,roughness:.5,metalness:.2},opt||{}));
    const add=(disc,mesh,look)=>{
      mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.disc=disc;
      mesh.userData.look=look||LOOK[disc];
      (groups[disc]=groups[disc]||[]).push(mesh);pick.push(mesh);world.add(mesh);return mesh;
    };
    const box=(disc,w,h,d,x,y,z,m,look)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||mat(disc));b.position.set(x,y,z);return add(disc,b,look);};
    const cyl=(disc,axis,r,l,x,y,z,m,look)=>{
      const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,24),m||mat(disc));
      if(axis==='x')c.rotation.z=Math.PI/2;else if(axis==='z')c.rotation.x=Math.PI/2;
      c.position.set(x,y,z);return add(disc,c,look);
    };
    const sph=(disc,r,x,y,z)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),mat(disc));s.position.set(x,y,z);return add(disc,s);};
    const ring=(disc,axis,r,x,y,z)=>{
      const t=new THREE.Mesh(new THREE.TorusGeometry(r+.016,.022,10,28),mat(disc));
      if(axis==='x')t.rotation.y=Math.PI/2;else if(axis==='y')t.rotation.x=Math.PI/2;
      t.position.set(x,y,z);return add(disc,t);
    };
    const FIX=(c,r,m)=>({bim:[c,r,m],real:[c,r,m]});
    // ---- flow sleeves: shader pulses running along the water pipes (threejs-shaders) ----
    const flows=[];
    const flowU={uTime:{value:0},uOn:{value:0}};
    const flowMat=(sys,dir,len)=>new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,
      uniforms:{uTime:flowU.uTime,uOn:flowU.uOn,
        uColor:{value:new THREE.Color(sys==='chw'?0x00b0f0:0x6fe3ff)},
        uDir:{value:dir},uReps:{value:Math.max(2,Math.round(len*.8))}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:[
        'varying vec2 vUv; uniform float uTime,uDir,uReps,uOn; uniform vec3 uColor;',
        'void main(){',
        '  float t=fract(vUv.y*uReps - uDir*uTime*0.55);',
        '  float pulse=smoothstep(0.0,0.16,t)*(1.0-smoothstep(0.22,0.46,t));',
        '  float rim=0.35+0.65*pow(abs(sin(vUv.x*3.14159)),1.6);',
        '  float a=pulse*rim*0.85*uOn;',
        '  if(a<0.01) discard;',
        '  gl_FragColor=vec4(uColor,a);',
        '}'
      ].join('\n')
    });
    const flow=(sys,axis,r,l,x,y,z,dir)=>{
      const m=new THREE.Mesh(new THREE.CylinderGeometry(r*1.06,r*1.06,l*.98,20,1,true),flowMat(sys,dir||1,l));
      if(axis==='x')m.rotation.z=Math.PI/2;else if(axis==='z')m.rotation.x=Math.PI/2;
      m.position.set(x,y,z);m.userData.disc=sys;world.add(m);flows.push({m,disc:sys});decals.push({m,disc:sys});
      return m;
    };
    // ---- room: long corridor, floor z -15 (end wall + door) .. +13 ----
    const W=15,L=28,ZC=-1;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshStandardMaterial({color:0xa8adb1,roughness:.2,metalness:.08}));
    floor.rotation.x=-Math.PI/2;floor.position.z=ZC;floor.receiveShadow=true;world.add(floor);
    const wallM=new THREE.MeshStandardMaterial({color:0xf1f4f7,roughness:.95});
    // walls/ceiling raised to 6.3m so the signature camera (y≈5.44) sits INSIDE the room —
    // at the old 5.2m roof the default view floated above it and the frame showed gradient
    const sideL=new THREE.Mesh(new THREE.PlaneGeometry(L,6.3),wallM);sideL.rotation.y=Math.PI/2;sideL.position.set(-W/2,3.15,ZC);sideL.receiveShadow=true;world.add(sideL);
    const sideR=new THREE.Mesh(new THREE.PlaneGeometry(L,6.3),wallM);sideR.rotation.y=-Math.PI/2;sideR.position.set(W/2,3.15,ZC);sideR.receiveShadow=true;world.add(sideR);
    const endW=new THREE.Mesh(new THREE.PlaneGeometry(W,6.3),wallM);endW.position.set(0,3.15,-15);endW.receiveShadow=true;world.add(endW);
    const backW=new THREE.Mesh(new THREE.PlaneGeometry(W,6.3),wallM);backW.rotation.y=Math.PI;backW.position.set(0,3.15,13);world.add(backW);
    const ceil=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshStandardMaterial({color:0x1a1d21,roughness:.9}));
    ceil.rotation.x=Math.PI/2;ceil.position.set(0,6.25,ZC);world.add(ceil);
    // dark grey skirting at the wall base (reference photo)
    const skM=new THREE.MeshStandardMaterial({color:0x565c61,roughness:.7});
    [[-W/2+.03,ZC,0,.06,L],[W/2-.03,ZC,0,.06,L]].forEach(([x,z])=>{const k=new THREE.Mesh(new THREE.BoxGeometry(.06,.2,L),skM);k.position.set(x,.1,z);world.add(k);});
    {const k=new THREE.Mesh(new THREE.BoxGeometry(W,.2,.06),skM);k.position.set(0,.1,-14.97);world.add(k);}
    // continuous linear LED strips down the corridor (reflect in the glossy floor)
    const lightM=new THREE.MeshBasicMaterial({color:0xf6fbff});
    [-1.15,1.15].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(.18,.06,25),lightM);s.position.set(x,5.1,ZC);world.add(s);});
    // end wall: steel double door + frame + exit sign
    const doorM=new THREE.MeshStandardMaterial({color:0x8b949d,roughness:.5,metalness:.3});
    const frame=new THREE.Mesh(new THREE.BoxGeometry(2.3,2.55,.14),new THREE.MeshStandardMaterial({color:0x6b737b,roughness:.55,metalness:.3}));
    frame.position.set(0,1.27,-14.94);world.add(frame);
    [-0.56,0.56].forEach(x=>{const d=new THREE.Mesh(new THREE.BoxGeometry(1.04,2.4,.1),doorM);d.position.set(x,1.2,-14.88);d.castShadow=true;world.add(d);});
    [-0.18,0.18].forEach(x=>{const h=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,.05),new THREE.MeshStandardMaterial({color:0x2c3238,roughness:.4,metalness:.5}));h.position.set(x,1.15,-14.8);world.add(h);});
    const exit=new THREE.Mesh(new THREE.BoxGeometry(.7,.24,.08),new THREE.MeshBasicMaterial({color:0x37c46e}));
    exit.position.set(0,2.78,-14.88);world.add(exit);
    // white lane markings along the aisle
    const lineM=new THREE.MeshBasicMaterial({color:0xf2f5f7});
    const line=(w,d,x,z)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),lineM);p.rotation.x=-Math.PI/2;p.position.set(x,.012,z);world.add(p);};
    line(.09,26,-1.7,ZC);line(.09,26,1.7,ZC);line(3.4,.09,0,-13.6);
    const stickersTex=this._stickersTex(THREE);
    const plinthM=()=>new THREE.MeshStandardMaterial({color:0xb9c1c9,roughness:.65});
    const valve=(disc,x,y,z)=>{
      const red=()=>new THREE.MeshStandardMaterial({color:0xc4232b,roughness:.35,metalness:.3});
      const wheel=new THREE.Mesh(new THREE.TorusGeometry(.17,.032,10,24),red());
      wheel.rotation.x=Math.PI/2;wheel.position.set(x,y+.24,z);add(disc,wheel,FIX(0xc4232b,.35,.3));
      for(let i=0;i<3;i++){const sp=new THREE.Mesh(new THREE.BoxGeometry(.32,.026,.036),red());sp.rotation.y=i*Math.PI/3;sp.position.set(x,y+.24,z);add(disc,sp,FIX(0xc4232b,.35,.3));}
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.26,10),new THREE.MeshStandardMaterial({color:0x8a939c,roughness:.35,metalness:.6}));
      stem.position.set(x,y+.1,z);add(disc,stem,FIX(0x8a939c,.35,.6));
      const body=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),red());
      body.position.set(x,y-.02,z);add(disc,body,FIX(0xc4232b,.35,.3));
      const lev=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.3,8),red());
      lev.rotation.z=.5;lev.position.set(x+.12,y-.16,z);add(disc,lev,FIX(0xc4232b,.4,.3));
    };
    // ============ one chiller unit, long axis along the corridor ============
    // s = -1 west row / +1 east row; cz = unit centre; sys = its water system
    const unit=(s,cz,sys,dbHere)=>{
      const cx=s*4.3;
      const pad=new THREE.Mesh(new THREE.BoxGeometry(2.6,.16,5.5),plinthM());
      pad.position.set(cx,.08,cz);pad.receiveShadow=true;pad.castShadow=true;world.add(pad);decals.push({m:pad,disc:'plant'});
      cyl('plant','z',.62,4.0,cx+s*.15,.98,cz);            // lower barrel
      cyl('plant','z',.5,3.6,cx-s*.2,1.88,cz);             // upper barrel
      [[.66,.5,cz-2.15,.98,cx+s*.15],[.66,.5,cz+2.15,.98,cx+s*.15],[.54,.44,cz-1.95,1.88,cx-s*.2],[.54,.44,cz+1.95,1.88,cx-s*.2]]
        .forEach(([r,l,z,y,x])=>cyl('plant','z',r,l,x,y,z));
      [[-1.6],[1.6]].forEach(([dz])=>box('plant',1.9,.24,.5,cx,.28,cz+dz));
      box('plant',.9,.55,1.3,cx-s*.05,2.35,cz+.3);          // compressor hump
      const yel=new THREE.Mesh(new THREE.TorusGeometry(.3,.035,8,20,4.2),new THREE.MeshStandardMaterial({color:0xd8b62c,roughness:.5}));
      yel.rotation.y=.5+s;yel.position.set(cx-s*.2,2.3,cz+.9);add('plant',yel,FIX(0xd8b62c,.5,.1));
      // starter panel on the aisle-facing flank, sticker cluster facing the corridor
      box('plant',.34,.95,1.9,cx-s*1.0,2.0,cz-.5);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.8),new THREE.MeshBasicMaterial({map:stickersTex}));
      face.position.set(cx-s*1.18,2.0,cz-.5);face.rotation.y=-s*Math.PI/2;world.add(face);decals.push({m:face,disc:'plant'});
      // ---- riser pair at the near end: valves up top, arrow stickers below ----
      const zr=cz+2.6;
      [[-1,true],[1,false]].forEach(([dx,up])=>{
        const xr=cx+dx*.35;
        cyl(sys,'y',.17,3.55,xr,2.72,zr);
        flow(sys,'y',.17,3.55,xr,2.72,zr,up?1:-1);
        ring(sys,'y',.17,xr,1.7,zr);ring(sys,'y',.17,xr,3.7,zr);
        sph(sys,.19,xr,.95,zr);
        cyl(sys,'z',.17,.6,xr,.95,zr-.4);                  // stub into water box end
        sph(sys,.19,xr,4.5,zr);
        valve(sys,xr,3.2,zr);
        const st=new THREE.Mesh(new THREE.PlaneGeometry(.17,.32),new THREE.MeshBasicMaterial({map:this._arrowTex(THREE,up),transparent:true}));
        st.position.set(xr,2.42,zr+.176);world.add(st);decals.push({m:st,disc:sys});
      });
      // goalpost stand under the stubs
      const stM=new THREE.MeshStandardMaterial({color:0xaeb6bd,roughness:.5,metalness:.35});
      [[-.35],[.35]].forEach(([dx])=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.08,.72,.08),stM);p.position.set(cx+dx,.4,zr-.4);p.castShadow=true;world.add(p);decals.push({m:p,disc:sys});});
      const cross=new THREE.Mesh(new THREE.BoxGeometry(1.1,.08,.1),stM);cross.position.set(cx,.78,zr-.4);cross.castShadow=true;world.add(cross);decals.push({m:cross,disc:sys});
      // DB strapped to the aisle-side riser
      if(dbHere){
        const xr=cx-s*.35;
        box('elec',.26,.9,.6,xr-s*.33,2.62,zr);
        const dbFace=new THREE.Mesh(new THREE.PlaneGeometry(.52,.78),new THREE.MeshBasicMaterial({map:stickersTex}));
        dbFace.position.set(xr-s*.465,2.62,zr);dbFace.rotation.y=-s*Math.PI/2;world.add(dbFace);decals.push({m:dbFace,disc:'elec'});
        [2.28,2.96].forEach(y=>{const arm=new THREE.Mesh(new THREE.BoxGeometry(.34,.05,.07),new THREE.MeshStandardMaterial({color:0x8f99a2,roughness:.45,metalness:.4}));arm.position.set(xr-s*.14,y,zr);add('elec',arm,FIX(0x8f99a2,.45,.4));});
      }
    };
    // fill the corridor: chillers with pipe+panel in the FRONT bay only,
    // then banks of full-height HVAC cabinets to the end wall (reference photo)
    const bays=[-11.2,-5.6,0,5.6];
    unit(-1,5.6,'chw',false);unit(1,5.6,'cdw',true);
    const doorLook={bim:[0x6b869e,.5,.2],real:[0x2b2f35,.45,.3]};
    const bank=(s,cz)=>{
      const plinth=new THREE.Mesh(new THREE.BoxGeometry(1.2,.24,5.4),new THREE.MeshStandardMaterial({color:0x2a2e33,roughness:.6,metalness:.2}));
      plinth.position.set(s*4.5,.12,cz);plinth.castShadow=true;plinth.receiveShadow=true;world.add(plinth);decals.push({m:plinth,disc:'ahu'});
      const grilleM=new THREE.MeshBasicMaterial({color:0x0b0d10});
      const yl=new THREE.Mesh(new THREE.BoxGeometry(.035,.02,5.2),new THREE.MeshBasicMaterial({color:0xd8b62c}));
      yl.position.set(s*3.86,.03,cz);world.add(yl);decals.push({m:yl,disc:'ahu'});
      for(let i=0;i<4;i++){
        const zc=cz-1.95+i*1.3;
        box('ahu',1.0,3.7,1.24,s*4.5,2.09,zc);                     // cabinet body
        [[-.3],[.3]].forEach(([dz])=>{                              // door leaves
          box('ahu',.05,3.05,.56,s*3.97,2.35,zc+dz,null,doorLook);
          const h=new THREE.Mesh(new THREE.BoxGeometry(.035,.3,.045),new THREE.MeshStandardMaterial({color:0x9aa3ac,roughness:.4,metalness:.5}));
          h.position.set(s*3.93,2.35,zc+dz-Math.sign(dz)*.22);add('ahu',h,FIX(0x9aa3ac,.4,.5));
        });
        const gr=new THREE.Mesh(new THREE.BoxGeometry(.06,.56,1.16),grilleM);  // bottom intake grille
        gr.position.set(s*3.99,.55,zc);world.add(gr);decals.push({m:gr,disc:'ahu'});
        for(let k=1;k<5;k++){const slat=new THREE.Mesh(new THREE.BoxGeometry(.02,.02,1.12),new THREE.MeshStandardMaterial({color:0x3a4046,roughness:.5,metalness:.3}));slat.position.set(s*3.955,.3+k*.1,zc);world.add(slat);decals.push({m:slat,disc:'ahu'});}
        if(i%2===0)box('ahu',.8,1.0,.85,s*4.5,4.55,zc);             // duct stub to ceiling void
        if(i<3){const seam=new THREE.Mesh(new THREE.BoxGeometry(1.02,3.7,.03),new THREE.MeshBasicMaterial({color:0x0d0f12}));seam.position.set(s*4.49,2.09,zc+.65);world.add(seam);decals.push({m:seam,disc:'ahu'});}
      }
      // chilled/condenser water drops from the overhead mains into the bank
      const sys=s<0?'chw':'cdw';
      [[cz-1.3],[cz+1.3]].forEach(([z])=>{cyl(sys,'y',.09,.9,s*4.3,4.35,z);sph(sys,.11,s*4.3,3.95,z);});
    };
    [0,-5.6,-11.2].forEach(cz=>{bank(-1,cz);bank(1,cz);});
    // ---- overhead network: longitudinal mains per row + cross bridges over the aisle ----
    [[-1,'chw'],[1,'cdw']].forEach(([s,sys])=>{
      [-.35,.35].forEach(dx=>{
        const x=s*4.3+dx;
        cyl(sys,'z',.26,26,x,4.5,ZC);
        flow(sys,'z',.26,26,x,4.5,ZC,dx<0?1:-1);
        for(let z=-13;z<=11;z+=2.2)ring(sys,'z',.26,x,4.5,z);
      });
    });
    // cross bridges with elbows + a red valve drop at centre of each
    [[-8.4,'chw'],[-2.8,'cdw'],[2.8,'chw'],[8.4,'cdw']].forEach(([zb,sys])=>{
      cyl(sys,'x',.3,7.9,0,4.55,zb);
      flow(sys,'x',.3,7.9,0,4.55,zb,sys==='chw'?1:-1);
      sph(sys,.33,-3.95,4.55,zb);sph(sys,.33,3.95,4.55,zb);
      for(let x=-3;x<=3;x+=1.5)ring(sys,'x',.3,x,4.55,zb);
      cyl(sys,'y',.14,.7,0,4.05,zb);
      valve(sys,0,3.6,zb);
    });
    // ---- fire: sprinkler main down the aisle + heads + extinguisher by the door ----
    cyl('fire','z',.09,26,0,4.95,ZC);
    [-12,-8,-4,0,4,8].forEach(z=>{
      cyl('fire','y',.05,.3,0,4.78,z);
      const hd=new THREE.Mesh(new THREE.ConeGeometry(.11,.15,12),new THREE.MeshStandardMaterial({color:0xc22a2a,roughness:.4,metalness:.3}));
      hd.position.set(0,4.58,z);add('fire',hd,FIX(0xc22a2a,.4,.3));
      const df=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.02,10),new THREE.MeshStandardMaterial({color:0xe8b13c,roughness:.4,metalness:.4}));
      df.position.set(0,4.5,z);add('fire',df,FIX(0xe8b13c,.4,.4));
    });
    box('fire',.55,1.0,.32,2.6,.5,-14.75,mat('fire',{color:0xb32b2b}),FIX(0xb32b2b,.45,.15));
    // ---- electrical: ladder racks along both side walls ----
    [[-1],[1]].forEach(([s])=>{
      box('elec',.5,.06,25,s*7.05,4.25,ZC,mat('elec',{color:0xb8c4d0}),FIX(0x9aa4ad,.35,.55));
    });
    // soft contact-shadow blobs under the pads
    {
      const c=document.createElement('canvas');c.width=c.height=128;
      const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,8,64,64,64);
      gr.addColorStop(0,'rgba(10,16,24,.5)');gr.addColorStop(1,'rgba(10,16,24,0)');
      g.fillStyle=gr;g.fillRect(0,0,128,128);
      const aoT=new THREE.CanvasTexture(c);
      bays.forEach(cz=>{[-4.3,4.3].forEach(x=>{
        const p=new THREE.Mesh(new THREE.PlaneGeometry(3.6,7),new THREE.MeshBasicMaterial({map:aoT,transparent:true,depthWrite:false}));
        p.rotation.x=-Math.PI/2;p.position.set(x,.015,cz);world.add(p);
      });});
    }
    // ---- looks ----
    this._applyMode=()=>{
      const mode=this._mode;
      pick.forEach(m=>{
        const lk=(m.userData.look||LOOK[m.userData.disc])[mode];
        if(!lk)return;
        m.material.color.setHex(lk[0]);m.material.roughness=lk[1];m.material.metalness=lk[2];
      });
    };
    this._applyMode();
    // ---- camera: centered corridor perspective, gentle sway until first touch ----
    // locked corridor standpoint: phi >= 1.365 keeps the camera BELOW the 5.2m ceiling plane —
    // the old 1.32 default floated above it and the frame showed gradient past the roof
    const target=new THREE.Vector3(0,2.1,-4.5);
    let theta=0,phi=1.32,radius=13.5;
    const homeT=target.clone(),homeR=radius;
    let tGoal=target.clone(),rGoal=radius,focus=false;
    let auto=(this.getAttribute('auto-rotate')||'on')!=='off'&&!this._reduce,dragging=false,px=0,py=0;
    this._orbitKey=(k)=>{
      const step=.09;
      if(k==='ArrowLeft'){theta=Math.max(-.4,theta-step);auto=false;return true;}
      if(k==='ArrowRight'){theta=Math.min(.4,theta+step);auto=false;return true;}
      if(k==='ArrowUp'){phi=Math.max(1.28,phi-step*.7);auto=false;return true;}
      if(k==='ArrowDown'){phi=Math.min(1.46,phi+step*.7);auto=false;return true;}
      if(k==='+'||k==='='){radius=Math.max(5,radius*.9);auto=false;focus=false;return true;}
      if(k==='-'||k==='_'){radius=Math.min(13.5,radius*1.1);auto=false;focus=false;return true;} // zoom-out stops at the locked framing
      return false;
    };
    const applyCam=()=>{
      camera.position.set(target.x+radius*Math.sin(phi)*Math.sin(theta),target.y+radius*Math.cos(phi),target.z+radius*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(target);
    };
    const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{dragging=true;auto=false;focus=false;px=e.clientX;py=e.clientY;cv.classList.add('drag');cv.setPointerCapture(e.pointerId);});
    cv.addEventListener('pointerup',()=>{dragging=false;cv.classList.remove('drag');});
    cv.addEventListener('pointermove',e=>{
      if(dragging){theta=Math.min(.4,Math.max(-.4,theta-(e.clientX-px)*.0052));phi=Math.min(1.46,Math.max(1.28,phi-(e.clientY-py)*.0042));px=e.clientX;py=e.clientY;}
      else{const r=cv.getBoundingClientRect();this._mx=((e.clientX-r.left)/r.width)*2-1;this._my=-((e.clientY-r.top)/r.height)*2+1;this._hoverDirty=true;}
    });
    cv.addEventListener('wheel',e=>{e.preventDefault();auto=false;focus=false;radius=Math.min(13.5,Math.max(5,radius*(1+e.deltaY*.0011)));},{passive:false});
    // ---- raycast hover / click-isolate ----
    const ray=new THREE.Raycaster();const mv=new THREE.Vector2();
    let hover=null;
    const setEmissive=(disc,i)=>{(groups[disc]||[]).forEach(m=>{m.material.emissive=new THREE.Color(DISC[disc].color);m.material.emissiveIntensity=i;});};
    this._applyHover=(d)=>{if(hover===d)return;if(hover&&hover!==this._sel)setEmissive(hover,0);hover=d;this._hoverD=d;if(d&&d!==this._sel)setEmissive(d,.35);cv.style.cursor=d?'pointer':(dragging?'grabbing':'grab');if(!this._sel)this._panel(d);this._sync();};
    let downAt=0;
    cv.addEventListener('pointerdown',()=>{downAt=Date.now();});
    cv.addEventListener('click',()=>{if(Date.now()-downAt>260)return;this._select(hover&&this._sel!==hover?hover:null);});
    this._select=(d)=>{
      if(this._sel)setEmissive(this._sel,0);
      this._sel=d;this._panel(d||hover);
      if(d)setEmissive(d,.5);
      applyVisibility();
      this._sync();
      // zoom the camera onto the isolated system; ease home on deselect
      if(d&&groups[d]&&groups[d].length){
        const bb=new THREE.Box3();groups[d].forEach(m=>bb.expandByObject(m));
        const c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
        c.y=Math.max(1.2,c.y);tGoal=c;
        rGoal=Math.min(13.5,Math.max(5.5,Math.max(sz.x,sz.y,sz.z)*.85));
      }else{tGoal=homeT.clone();rGoal=homeR;}
      focus=true;
    };
    const visFn={f:null};
    const applyVisibility=()=>{
      const d=this._sel,fn=visFn.f;
      const on=(disc)=>(!d||disc===d)&&(!fn||fn(disc));
      pick.forEach(m=>{m.visible=on(m.userData.disc);});
      decals.forEach(o=>{o.m.visible=on(o.disc);});
    };
    this._applyVis=(fn)=>{visFn.f=fn;applyVisibility();};
    this._applyExplode=(t)=>{
      ORDER.forEach(k=>{const g=groups[k]||[];if(!g.length)return;
        if(!this._sections[k].c){const bb=new THREE.Box3();g.forEach(m=>bb.expandByObject(m));this._sections[k].c=bb.getCenter(new THREE.Vector3());}
        const d=this._sections[k].c.clone();d.y=0;
        if(d.lengthSq()<1e-6)d.set(0,0,1);
        d.normalize().multiplyScalar(t*6);
        g.forEach(m=>{if(!m.userData.p0)m.userData.p0=m.position.clone();m.position.copy(m.userData.p0).add(d);});
      });
    };
    ORDER.forEach(k=>{this._sections[k]={meshes:groups[k]||[]};});
    this._sync();
    this._hud.ready();
    const resize=()=>{const w=this.clientWidth||800,h=this.clientHeight||520;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    new ResizeObserver(resize).observe(this);resize();
    const t0=performance.now();
    this.debugScene={scene,camera,renderer,root:scene,render:()=>renderer.render(scene,camera)};
    this._dispose=()=>{
      scene.traverse(o=>{
        if(o.geometry)o.geometry.dispose();
        const mm=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
        mm.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)v.dispose();});m.dispose();});
      });
      renderer.dispose();
    };
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      if(this._onScreen===false||document.hidden)return;   // don't burn GPU offscreen
      flowU.uTime.value=performance.now()*.001;
      flowU.uOn.value+=((this._flowOn?1:0)-flowU.uOn.value)*.12;
      const k=this._reduce?1:Math.min(1,(performance.now()-t0)/2400),e=1-Math.pow(1-k,3);
      world.position.y=-4.5*(1-e); // slow eased rise instead of appearing built
      if(auto)theta=.16*Math.sin(performance.now()*.00022); // gentle centered sway
      if(focus){target.lerp(tGoal,.05);radius+=(rGoal-radius)*.05;if(target.distanceTo(tGoal)<.02&&Math.abs(rGoal-radius)<.05)focus=false;}
      applyCam();
      if(this._hoverDirty&&!dragging){this._hoverDirty=false;mv.set(this._mx,this._my);ray.setFromCamera(mv,camera);const hit=ray.intersectObjects(pick,false)[0];this._applyHover(hit?hit.object.userData.disc:null);}
      renderer.render(scene,camera);
    };
    tick();
  }
}
if(!customElements.get('lm-bim-viewer'))customElements.define('lm-bim-viewer',LMBimViewer);
})();
