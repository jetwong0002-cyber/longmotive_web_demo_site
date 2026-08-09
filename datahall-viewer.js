/* <lm-datahall-viewer> — Longmotive data-hall inspector, rack level.
   The camera lands the visitor IN the cold aisle between two rack rows. The rows are
   filled with non-interactive filler cabinets for depth; ONE hero cabinet is modelled at
   U level and every component in it is hoverable / clickable — compute nodes, ToR switch,
   patch panel, blanking plates, dual rPDUs, cable manager, busway drop, earth bond.
   Spec cards state whether each item was Longmotive's scope or client equipment.
   Built to uploads/datahall photography (yellow lever handles, LED arrays, white
   aluminium containment, black basket tray, orange columns, glossy epoxy slab). */
(function(){
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
// component library — key: {name, color, lm, spec[], blurb}
const COMP={
  frame:{name:'Cabinet Frame',color:0x0f52a0,lm:true,
    spec:['47U \u00b7 600 \u00d7 1200 MM','LEVELLED, BAYED & PLINTH-FIXED','12 kW DESIGN DENSITY'],
    blurb:'The cabinet itself \u2014 set out, levelled, bayed to its neighbours and fixed down.'},
  compute:{name:'Compute Node',color:0x5f7a94,lm:false,
    spec:['1U / 2U DUAL-FED CHASSIS','A + B SUPPLIES FROM SEPARATE rPDU','CLIENT-SUPPLIED EQUIPMENT'],
    blurb:'Client IT equipment. We deliver the cabinet, power and pathway it plugs into.'},
  sw:{name:'Top-of-Rack Switch',color:0x00b0f0,lm:false,
    spec:['48 \u00d7 10/25G + UPLINKS','FRONT-TO-REAR AIRFLOW','CLIENT-SUPPLIED EQUIPMENT'],
    blurb:'Switching hardware supplied by the client; we bring the fibre to its ports.'},
  patch:{name:'Patch Panel',color:0x00b0f0,lm:true,
    spec:['24-PORT LC \u00b7 OM4','TERMINATED & 100% CHANNEL TESTED','SEGREGATED FROM POWER'],
    blurb:'Structured cabling terminated and tested \u2014 our scope, on our containment.'},
  pdu:{name:'Metered rPDU',color:0xf2a33c,lm:true,
    spec:['2 \u00d7 32 A \u00b7 A AND B FEEDS','FED FROM SEPARATE BUSWAY TAP-OFFS','N+1 \u00b7 METERED PER OUTLET'],
    blurb:'Dual vertical rPDUs, each on its own tap-off, so no single feed drops the rack.'},
  blank:{name:'Blanking Plate',color:0x8fa3b8,lm:true,
    spec:['1U TOOL-LESS BLANK','NO UNMANAGED BYPASS AIR','FITTED TO EVERY VACANT U'],
    blurb:'Unglamorous and essential \u2014 every empty U blanked so cold air cannot bypass.'},
  mgr:{name:'Cable Manager',color:0x3fae5a,lm:true,
    spec:['VERTICAL FINGER MANAGER','POWER AND DATA SEPARATED','BEND RADIUS MAINTAINED'],
    blurb:'Vertical management keeping A/B power and data apart, radius respected.'},
  drop:{name:'Busway Drop',color:0xf2a33c,lm:true,
    spec:['TAP-OFF BOX \u00b7 OVERHEAD BUSWAY','FLEXIBLE DROP TO rPDU INLET','DISCRIMINATION VERIFIED'],
    blurb:'The tap-off and flexible drop bringing power down from the overhead busway.'},
  bond:{name:'Earth Bond',color:0x3fae5a,lm:true,
    spec:['70 MM\u00b2 TO COMMON BONDING NETWORK','CABINET + DOOR + RAILS BONDED','CONTINUITY TESTED'],
    blurb:'Every cabinet bonded back to the common bonding network and tested.'},
  door:{name:'Front Door',color:0x0f52a0,lm:true,
    spec:['PERFORATED \u00b7 80% FREE AREA','SWING-HANDLE, KEYED ALIKE','LED STATUS ARRAY'],
    blurb:'The perforated front door \u2014 press D to open or close it.'}
};
const ORDER=['frame','door','compute','sw','patch','pdu','blank','mgr','drop','bond'];
const IDS=ORDER;
const SEC={};ORDER.forEach(k=>{SEC[k]={name:COMP[k].name,type:COMP[k].lm?'Longmotive scope':'Client equipment',
  devices:COMP[k].spec.join(' \u00b7 '),note:COMP[k].blurb};});
const HUDCFG={views:[{id:'aisle',label:'Aisle',key:'a'},{id:'rack',label:'Rack',key:'k'}],
  walls:false,colour:false,explode:true,loadingLabel:'Building the cabinet',
  extras:[{id:'door',label:'Door open',key:'d',title:'Open or close the front door'}],
  hint:'Drag to look &#183; Scroll zoom<br>R reset &#183; A aisle &#183; K rack &#183; D door'};
const ARIA='Interactive 3D data-hall cabinet seen from the cold aisle. Drag or use arrow keys to look, scroll to zoom. Click a component to inspect it. Press R to reset, A for the aisle view, K for the rack view, D to open or close the door.';
class LMDataHallViewer extends HTMLElement{
  connectedCallback(){
    if(this._wired)return;this._wired=true;
    const sh=this.attachShadow({mode:'open'});
    sh.innerHTML=LMHUD.markup(HUDCFG);
    this._reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._doorOpen=true;this._view='aisle';this._sections={};
    this.tabIndex=0;
    this.setAttribute('role','application');
    this.setAttribute('aria-label',ARIA);
    this.addEventListener('keydown',this._onKey);
    this._hud=LMHUD.attach(this,sh,HUDCFG,{
      sections:this._sections,order:IDS,SEC,
      onView:(v)=>this._setView(v),
      onReset:()=>{if(this._select)this._select(null);this._setView('aisle');},
      onSelect:(id)=>{if(this._select)this._select(id);},
      onHover:(id)=>{if(this._applyHover)this._applyHover(id);},
      onVisibility:(fn)=>{if(this._applyVis)this._applyVis(fn);},
      onWalls:()=>{},onColour:()=>{},
      onExplode:(t)=>{if(this._applyExplode)this._applyExplode(t);},
      onExtra:(id)=>{if(id==='door'&&this._toggleDoor)this._toggleDoor();}
    });
    this._hud.setExtra('door',false,'Door open');
    const start=()=>{
      if(this._started)return;this._started=true;
      import(THREE_URL).then(T=>{try{this._init(T);}catch(e){this._fallback(e);}}).catch(e=>this._fallback(e));
    };
    this._vis=new IntersectionObserver(es=>es.forEach(e=>{this._onScreen=e.isIntersecting;if(e.isIntersecting)start();}),{rootMargin:'200px'});
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
    if(k==='a'||k==='A'){this._setView('aisle');e.preventDefault();return;}
    if(k==='k'||k==='K'){this._setView('rack');e.preventDefault();return;}
    if(this._hud&&this._hud.key(k)){e.preventDefault();return;}
    if(k==='d'||k==='D'){if(this._toggleDoor)this._toggleDoor();e.preventDefault();return;}
    if(k==='0'||k==='Escape'){if(this._select)this._select(null);this._setView('aisle');e.preventDefault();return;}
    if(this._lookKey&&this._lookKey(k))e.preventDefault();
  };
  _fallback(e){
    console.error('lm-datahall-viewer failed:',e);
    if(this._hud)this._hud.fail();
  }
  _sync(){ if(!this._hud)return; const h=this._hud; h.sel=this._sel; h.hover=this._hover; h.view=this._view; h.sync();
    h.setExtra('door',!this._doorOpen,this._doorOpen?'Door open':'Door closed'); }
  _panel(c){ if(!this._hud)return; this._hud.setProps(c); this._hud.setTip(c?SEC[c].name:''); }
  _setView(v){
    this._view=v;this._sync();
    if(this._goView)this._goView(v);
  }
  // perforated door face with LED array
  _doorTex(THREE){
    const c=document.createElement('canvas');c.width=160;c.height=448;
    const g=c.getContext('2d');
    g.fillStyle='#15181c';g.fillRect(0,0,160,448);
    g.fillStyle='#090b0d';
    for(let y=26;y<424;y+=6)for(let x=18;x<142;x+=6){g.beginPath();g.arc(x,y,1.8,0,7);g.fill();}
    g.strokeStyle='#24282e';g.lineWidth=3;g.strokeRect(7,7,146,434);
    g.fillStyle='#1c2025';g.fillRect(12,12,136,14);g.fillRect(12,422,136,14);
    g.fillStyle='#dfe4e8';g.font='600 8px monospace';g.fillText('LONGMOTIVE',18,22);
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  // server front: drive bays + status LEDs + vents
  _serverTex(THREE,u){
    const h=u===2?96:48;
    const c=document.createElement('canvas');c.width=384;c.height=h;
    const g=c.getContext('2d');
    g.fillStyle='#1c2024';g.fillRect(0,0,384,h);
    g.fillStyle='#0d0f12';g.fillRect(6,5,372,h-10);
    // drive bays
    const bays=u===2?8:6,bw=(300/bays);
    for(let i=0;i<bays;i++){
      g.fillStyle='#22272c';g.fillRect(14+i*bw,9,bw-4,h-18);
      g.fillStyle='#101316';g.fillRect(16+i*bw,12,bw-8,h-24);
      g.fillStyle=i%3===0?'#37d07a':'#1c9bd8';g.fillRect(18+i*bw,h-16,4,4);
    }
    // right-hand control cluster
    g.fillStyle='#2a3036';g.fillRect(322,9,54,h-18);
    g.fillStyle='#37d07a';g.fillRect(328,14,5,5);
    g.fillStyle='#e8b13c';g.fillRect(338,14,5,5);
    g.fillStyle='#8b949c';g.fillRect(328,h-20,40,7);
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  // switch front: dense port rows
  _switchTex(THREE){
    const c=document.createElement('canvas');c.width=384;c.height=48;
    const g=c.getContext('2d');
    g.fillStyle='#181c20';g.fillRect(0,0,384,48);
    for(let i=0;i<24;i++){
      const x=12+i*13;
      g.fillStyle='#0a0c0e';g.fillRect(x,10,10,12);g.fillRect(x,26,10,12);
      if(i%2===0){g.fillStyle='#37d07a';g.fillRect(x+3,20,4,2);}
      if(i%3===0){g.fillStyle='#1c9bd8';g.fillRect(x+3,36,4,2);}
    }
    g.fillStyle='#2a3036';g.fillRect(330,8,46,32);
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  // patch panel front: LC duplex ports + numbering strip
  _patchTex(THREE){
    const c=document.createElement('canvas');c.width=384;c.height=48;
    const g=c.getContext('2d');
    g.fillStyle='#e8ebee';g.fillRect(0,0,384,48);
    g.fillStyle='#c9ced3';g.fillRect(0,0,384,9);
    for(let i=0;i<24;i++){
      const x=10+i*15.4;
      g.fillStyle='#2a3036';g.fillRect(x,14,12,22);
      g.fillStyle='#0b7fb5';g.fillRect(x+2,17,8,7);
      g.fillStyle='#0b7fb5';g.fillRect(x+2,27,8,7);
      g.fillStyle='#6b737a';g.font='600 6px monospace';g.fillText(String(i+1),x+2,45);
    }
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  // rPDU strip: outlets down its length
  _pduTex(THREE){
    const c=document.createElement('canvas');c.width=48;c.height=512;
    const g=c.getContext('2d');
    g.fillStyle='#1f242a';g.fillRect(0,0,48,512);
    g.fillStyle='#0e1114';g.fillRect(4,4,40,504);
    for(let i=0;i<20;i++){
      const y=26+i*24;
      g.fillStyle='#2f3640';g.fillRect(11,y,26,18);
      g.fillStyle='#0a0c0e';g.fillRect(15,y+3,18,12);
      g.fillStyle=i%4===0?'#37d07a':'#232a31';g.fillRect(38,y+6,4,6);
    }
    g.fillStyle='#0b3b52';g.fillRect(9,6,30,14);
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  _init(THREE){
    const sh=this.shadowRoot;
    const renderer=new THREE.WebGLRenderer({canvas:sh.querySelector('canvas'),antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    const scene=new THREE.Scene();
    scene.background=null;renderer.setClearColor(0x000000,0); // CSS navy gradient shows through
    scene.fog=new THREE.Fog(0x0a1c31,18,48);
    const camera=new THREE.PerspectiveCamera(50,1,.05,120);
    { // env map — black doors and the epoxy floor need something to reflect
      const env=new THREE.Scene();env.background=new THREE.Color(0x0d1014);
      const em=(c,i)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
      const put=(w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);env.add(b);};
      put(1.4,.4,24,0,7.6,0,em(0xffffff,4.4));
      put(.4,6,20,-8,3,0,em(0xe8f0fa,1.7));put(.4,6,20,8,3,0,em(0xf8fafc,1.7));
      put(18,5,.4,0,2.6,-11,em(0xccd7e3,.8));
      const pm=new THREE.PMREMGenerator(renderer);
      scene.environment=pm.fromScene(env,.03).texture;pm.dispose();
    }
    scene.add(new THREE.HemisphereLight(0xffffff,0x6e7883,.62));
    const key=new THREE.DirectionalLight(0xffffff,1.3);
    key.position.set(4,9,6);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);key.shadow.bias=-0.0004;
    const sc=key.shadow.camera;sc.left=-9;sc.right=9;sc.top=9;sc.bottom=-9;sc.far=28;
    scene.add(key);
    scene.add(new THREE.DirectionalLight(0xdfeaf6,.35).translateX(-6));
    const M=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.6,metalness:m??.15});
    const pick=[],hero=new THREE.Group();scene.add(hero);
    const groups={};
    const reg=(comp,mesh)=>{mesh.userData.comp=comp;(groups[comp]=groups[comp]||[]).push(mesh);pick.push(mesh);return mesh;};
    /* ---------------- room ---------------- */
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x9aa2a8,roughness:.16,metalness:.14}));
    floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
    const wallM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,metalness:0});
    // skirting where the epoxy turns up the wall — separates the two planes visually
    const skirtM=new THREE.MeshStandardMaterial({color:0x7f878d,roughness:.35,metalness:.1});
    [[0,-12.94],[0,12.94]].forEach(([x,z])=>{
      const k=new THREE.Mesh(new THREE.BoxGeometry(20,.13,.09),skirtM);
      k.position.set(x,.065,z);scene.add(k);
    });
    [[0,3,-13,20,6,0],[0,3,13,20,6,Math.PI]].forEach(([x,y,z,w,h,ry])=>{
      const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),wallM);p.position.set(x,y,z);p.rotation.y=ry;p.receiveShadow=true;scene.add(p);
    });
    const ceil=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x1b1e22,roughness:.9}));
    ceil.rotation.x=Math.PI/2;ceil.position.y=4.4;scene.add(ceil);
    const stripM=new THREE.MeshBasicMaterial({color:0xf8fbff});
    [-.5,.5].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(.13,.05,26),stripM);s.rotation.y=Math.PI/2;s.position.set(0,4.3,x*2.4);scene.add(s);});
    [-1.6,1.6].forEach(z=>{const s=new THREE.Mesh(new THREE.BoxGeometry(26,.05,.13),stripM);s.position.set(0,4.3,z);scene.add(s);});
    // orange columns, seen down the aisle
    const orange=new THREE.MeshStandardMaterial({color:0xd4622a,roughness:.65});
    [[-9.4,-4.6],[9.4,-4.6],[-9.4,4.6],[9.4,4.6]].forEach(([x,z])=>{
      const c=new THREE.Mesh(new THREE.BoxGeometry(.75,4.4,.75),orange);c.position.set(x,2.2,z);c.castShadow=true;scene.add(c);
    });
    /* ---------------- rack rows: filler cabinets (non-interactive) ---------------- */
    const doorTex=this._doorTex(THREE);
    const bodyM=M(0x1a1d21,.55,.3);
    const doorM=new THREE.MeshStandardMaterial({color:0xffffff,map:doorTex,roughness:.45,metalness:.35});
    const handleM=new THREE.MeshStandardMaterial({color:0xe8b62c,roughness:.4,metalness:.2});
    const gBody=new THREE.BoxGeometry(.6,2.1,1.2);
    const gDoor=new THREE.PlaneGeometry(.56,1.94);
    const gHandle=new THREE.BoxGeometry(.045,.22,.045);
    const gLed=new THREE.BoxGeometry(.03,.05,.018);
    const ledMat=new THREE.MeshBasicMaterial({color:0x37d07a});
    const leds=[];
    const ROWZ=[1.55,-1.55];      // fronts face the aisle at z = ±0.95
    const PITCH=.62,SPAN=11;      // cabinets each side of the hero
    ROWZ.forEach((rz,ri)=>{
      const faceDir=rz>0?-1:1;
      for(let i=-SPAN;i<=SPAN;i++){
        if(i===0&&ri===0)continue;               // hero cabinet slot
        const x=i*PITCH;
        const b=new THREE.Mesh(gBody,bodyM);b.position.set(x,1.05,rz);b.castShadow=true;b.receiveShadow=true;scene.add(b);
        const d=new THREE.Mesh(gDoor,doorM);d.position.set(x,1.07,rz+faceDir*.605);d.rotation.y=faceDir<0?Math.PI:0;scene.add(d);
        const h=new THREE.Mesh(gHandle,handleM);h.position.set(x+.19*faceDir,1.14,rz+faceDir*.64);scene.add(h);
        for(let k=0;k<3;k++){
          const l=new THREE.Mesh(gLed,ledMat);
          l.position.set(x-.19*faceDir,1.52-k*.15,rz+faceDir*.63);
          l.userData.ph=Math.random()*6.28;leds.push(l);scene.add(l);
        }
        const rail=new THREE.Mesh(new THREE.BoxGeometry(.56,.06,.9),M(0x0e1013,.6,.3));
        rail.position.set(x,2.14,rz);rail.castShadow=true;scene.add(rail);
      }
    });
    /* ---------------- containment + overhead services (context) ---------------- */
    const alu=new THREE.MeshStandardMaterial({color:0xdfe3e7,roughness:.35,metalness:.55});
    const poly=new THREE.MeshStandardMaterial({color:0xeaf2f8,roughness:.12,metalness:.05,transparent:true,opacity:.24,side:THREE.DoubleSide});
    const L=(SPAN*2+1)*PITCH;
    [-.95,.95].forEach(dz=>{
      for(let i=-SPAN;i<=SPAN;i+=3){const p=new THREE.Mesh(new THREE.BoxGeometry(.08,1.1,.08),alu);p.position.set(i*PITCH,2.65,dz);p.castShadow=true;scene.add(p);}
      [2.2,3.2].forEach(y=>{const r=new THREE.Mesh(new THREE.BoxGeometry(L,.1,.1),alu);r.position.set(0,y,dz);scene.add(r);});
      const pn=new THREE.Mesh(new THREE.BoxGeometry(L,.95,.02),poly);pn.position.set(0,2.68,dz);scene.add(pn);
    });
    for(let i=-SPAN;i<=SPAN;i+=2){
      const rp=new THREE.Mesh(new THREE.BoxGeometry(PITCH*2-.05,.02,1.86),poly);rp.position.set(i*PITCH,3.2,0);scene.add(rp);
      const rb=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,1.9),alu);rb.position.set((i-1)*PITCH,3.22,0);scene.add(rb);
    }
    const trayM=M(0x14171a,.6,.25);
    [-2.45,2.45].forEach(dz=>{
      const t=new THREE.Mesh(new THREE.BoxGeometry(L+1,.05,.55),trayM);t.position.set(0,3.85,dz);t.castShadow=true;scene.add(t);
      for(let i=-SPAN;i<=SPAN;i+=2){const h=new THREE.Mesh(new THREE.BoxGeometry(.03,.14,.55),trayM);h.position.set(i*PITCH,3.92,dz);scene.add(h);}
    });
    const bwM=M(0xd8952c,.5,.35);
    [-1.75,1.75].forEach(dz=>{
      const b=new THREE.Mesh(new THREE.BoxGeometry(L+1,.24,.32),bwM);b.position.set(0,3.4,dz);b.castShadow=true;scene.add(b);
      for(let i=-SPAN;i<=SPAN;i+=4){const tb=new THREE.Mesh(new THREE.BoxGeometry(.3,.36,.4),bwM);tb.position.set(i*PITCH,3.15,dz);scene.add(tb);}
    });
    const fireM=M(0xb0342f,.5,.25);
    const fp=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,L+2,12),fireM);fp.rotation.z=Math.PI/2;fp.position.set(0,4.15,0);scene.add(fp);
    for(let i=-SPAN;i<=SPAN;i+=4){
      const hd=new THREE.Mesh(new THREE.ConeGeometry(.07,.1,10),fireM);hd.position.set(i*PITCH,4.02,0);scene.add(hd);
    }
    /* ---------------- HERO cabinet, at U level, fully interactive ---------------- */
    const HX=0,HZ=1.55,FZ=HZ-.6;         // front face plane
    const U=.0445;                        // one rack unit
    const uy=(u)=>.14+(u-1)*U+ .0;        // bottom of unit u
    // frame: plinth, side panels, top, vertical rails with U marks
    const frameM=M(0x1e2227,.5,.35);
    const mk=(comp,geo,mat,x,y,z,ry)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;hero.add(m);return reg(comp,m);};
    mk('frame',new THREE.BoxGeometry(.62,.12,1.22),M(0x14171a,.6,.2),HX,.06,HZ);          // plinth
    mk('frame',new THREE.BoxGeometry(.03,2.0,1.2),frameM,HX-.295,1.12,HZ);                 // side panels
    mk('frame',new THREE.BoxGeometry(.03,2.0,1.2),frameM,HX+.295,1.12,HZ);
    mk('frame',new THREE.BoxGeometry(.62,.06,1.22),frameM,HX,2.14,HZ);                     // top cap
    mk('frame',new THREE.BoxGeometry(.6,2.0,.03),M(0x101316,.7,.2),HX,1.12,HZ+.6);         // rear panel
    [-.24,.24].forEach(dx=>mk('frame',new THREE.BoxGeometry(.035,1.92,.06),M(0x2a3036,.5,.4),HX+dx,1.12,FZ+.06)); // 19" rails
    // equipment stack (bottom → top)
    const sTex1=this._serverTex(THREE,1),sTex2=this._serverTex(THREE,2);
    const swTex=this._switchTex(THREE),paTex=this._patchTex(THREE),pduTex=this._pduTex(THREE);
    const faceMat=(tex)=>new THREE.MeshStandardMaterial({color:0xffffff,map:tex,roughness:.5,metalness:.3});
    const sM1=faceMat(sTex1),sM2=faceMat(sTex2),swM=faceMat(swTex),paM=faceMat(paTex);
    const blankM=M(0x23282e,.65,.2);
    const stack=[
      ['compute',2],['compute',2],['blank',1],['compute',1],['compute',1],['compute',1],
      ['compute',1],['blank',1],['compute',2],['mgr',1],['patch',1],['patch',1],['sw',1],
      ['blank',1],['compute',1],['compute',1],['blank',1],['compute',2],['blank',1]
    ];
    let u=2;
    stack.forEach(([kind,h])=>{
      const y=.16+(u-1)*U+(h*U)/2;
      const hh=h*U-.004;
      if(kind==='compute'){
        const m=mk('compute',new THREE.BoxGeometry(.5,hh,.72),h===2?sM2:sM1,HX,y,FZ+.37);
        m.userData.u=u;
      }else if(kind==='sw'){
        mk('sw',new THREE.BoxGeometry(.5,hh,.5),swM,HX,y,FZ+.26);
      }else if(kind==='patch'){
        mk('patch',new THREE.BoxGeometry(.5,hh,.16),paM,HX,y,FZ+.09);
      }else if(kind==='mgr'){
        mk('mgr',new THREE.BoxGeometry(.5,hh,.12),M(0x2b3138,.6,.2),HX,y,FZ+.07);
      }else{
        mk('blank',new THREE.BoxGeometry(.5,hh,.03),blankM,HX,y,FZ+.02);
      }
      u+=h;
    });
    // dual rPDUs down the rear corners
    const pduM=new THREE.MeshStandardMaterial({color:0xffffff,map:pduTex,roughness:.5,metalness:.3});
    [[-.24,'A'],[.24,'B']].forEach(([dx,tag])=>{
      const p=mk('pdu',new THREE.BoxGeometry(.08,1.7,.08),pduM,HX+dx,1.12,HZ+.5);
      p.userData.tag=tag;
    });
    // vertical cable manager on the front edge
    mk('mgr',new THREE.BoxGeometry(.06,1.9,.09),M(0x2b3138,.6,.2),HX-.265,1.12,FZ+.05);
    // busway tap-off + flexible drop into the cabinet top
    mk('drop',new THREE.BoxGeometry(.28,.34,.38),bwM,HX,3.15,HZ+.2);
    const dropM=M(0x1e2126,.65,.15);
    mk('drop',new THREE.CylinderGeometry(.028,.028,.9,10),dropM,HX-.08,2.62,HZ+.2);
    mk('drop',new THREE.CylinderGeometry(.028,.028,.9,10),dropM,HX+.08,2.62,HZ+.2);
    // earth bond: green tail from the frame down to the floor ring
    const earthM=M(0x2f9350,.55,.2);
    mk('bond',new THREE.CylinderGeometry(.018,.018,.55,10),earthM,HX+.27,.34,HZ+.45);
    mk('bond',new THREE.BoxGeometry(.1,.05,.05),earthM,HX+.24,.6,HZ+.45);
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,L,10),earthM);
    ring.rotation.z=Math.PI/2;ring.position.set(0,.07,HZ+.5);scene.add(ring);
    // the hero door — swings open on a hinge group
    const doorPivot=new THREE.Group();doorPivot.position.set(HX-.3,1.07,FZ);hero.add(doorPivot);
    const heroDoor=new THREE.Mesh(new THREE.BoxGeometry(.56,1.94,.025),doorM);
    heroDoor.position.set(.28,0,0);heroDoor.castShadow=true;doorPivot.add(heroDoor);
    reg('door',heroDoor);
    const hHandle=new THREE.Mesh(new THREE.BoxGeometry(.05,.24,.05),handleM);
    hHandle.position.set(.5,.06,-.04);doorPivot.add(hHandle);reg('door',hHandle);
    for(let k=0;k<4;k++){
      const l=new THREE.Mesh(gLed,ledMat);
      l.position.set(.06,.45-k*.14,-.02);l.userData.ph=Math.random()*6.28;
      doorPivot.add(l);leds.push(l);
    }
    // cabinet ID plate
    const idc=document.createElement('canvas');idc.width=128;idc.height=48;
    {const g=idc.getContext('2d');g.fillStyle='#eef1f4';g.fillRect(0,0,128,48);
     g.fillStyle='#0f52a0';g.fillRect(0,0,128,7);
     g.fillStyle='#14181c';g.font='700 22px monospace';g.textAlign='center';g.fillText('ROW A',64,34);}
    const idT=new THREE.CanvasTexture(idc);
    const idp=new THREE.Mesh(new THREE.PlaneGeometry(.26,.1),new THREE.MeshBasicMaterial({map:idT}));
    idp.position.set(HX,2.05,FZ-.005);idp.rotation.y=Math.PI;hero.add(idp);
    /* ---------------- interaction ---------------- */
    const setEmissive=(comp,i)=>{(groups[comp]||[]).forEach(m=>{
      if(!m.material.emissive)return;
      m.material.emissive=new THREE.Color(COMP[comp].color);m.material.emissiveIntensity=i;});};
    const visFn={f:null};
    this._applyVis=(fn)=>{visFn.f=fn;ORDER.forEach(k=>{(groups[k]||[]).forEach(m=>{m.visible=fn(k);});});
      if(this._sel&&!fn(this._sel))this._select(null);};
    this._applyExplode=(t)=>{
      ORDER.forEach(k=>{const g=groups[k]||[];if(!g.length)return;
        const sc=this._sections[k];
        if(!sc.c){const bb=new THREE.Box3();g.forEach(m=>bb.expandByObject(m));sc.c=bb.getCenter(new THREE.Vector3());}
        const d=sc.c.clone().sub(new THREE.Vector3(HX,1.2,FZ-.6));d.y*=.4;
        if(d.lengthSq()<1e-6)d.set(0,0,-1);
        d.normalize().multiplyScalar(t*1.1);
        g.forEach(m=>{if(!m.userData.p0)m.userData.p0=m.position.clone();m.position.copy(m.userData.p0).add(d);});
      });
    };
    // camera: aisle stance and rack framing
    // Stances are defined on the hero cabinet's FRONT FACE (z = FZ) and the eye is
    // constrained every frame to stay inside the 1.9 m cold aisle (z ∈ [-0.86, 0.55]).
    const AISLE={t:new THREE.Vector3(HX,1.15,FZ),r:1.6,th:0,ph:1.27};
    const RACK={t:new THREE.Vector3(HX,1.12,FZ),r:1.1,th:0,ph:1.5};
    let target=AISLE.t.clone(),radius=AISLE.r,theta=AISLE.th,phi=AISLE.ph;
    let tGoal=target.clone(),rGoal=radius,focus=false;
    let dragging=false,px=0,py=0;
    this._goView=(v)=>{
      const V=v==='rack'?RACK:AISLE;
      tGoal=V.t.clone();rGoal=V.r;theta=V.th;phi=V.ph;focus=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;focus=false;}
    };
    this._select=(comp)=>{
      if(this._sel)setEmissive(this._sel,0);
      this._sel=comp;this._panel(comp||this._hover);
      if(comp)setEmissive(comp,.6);
      if(comp&&groups[comp]&&groups[comp].length){
        const bb=new THREE.Box3();groups[comp].forEach(m=>bb.expandByObject(m));
        const c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
        tGoal=c;rGoal=Math.min(2.4,Math.max(.6,Math.max(sz.x,sz.y,sz.z)*2.1));
        this._view='rack';this._sync();focus=true;
      }
    };
    this._toggleDoor=()=>{this._doorOpen=!this._doorOpen;this._sync();};
    ORDER.forEach(k=>{this._sections[k]={meshes:groups[k]||[]};});
    this._sync();
    this._hud.ready();
    const cv=renderer.domElement;
    this._lookKey=(k)=>{
      const st=.07;
      if(k==='ArrowLeft'){theta-=st;return true;}
      if(k==='ArrowRight'){theta+=st;return true;}
      if(k==='ArrowUp'){phi=Math.max(.75,phi-st*.7);return true;}
      if(k==='ArrowDown'){phi=Math.min(1.95,phi+st*.7);return true;}
      if(k==='+'||k==='='){radius=Math.max(.5,radius*.9);focus=false;return true;}
      if(k==='-'||k==='_'){radius=Math.min(3.2,radius*1.1);focus=false;return true;}
      return false;
    };
    cv.addEventListener('pointerdown',e=>{dragging=true;focus=false;px=e.clientX;py=e.clientY;cv.classList.add('drag');cv.setPointerCapture(e.pointerId);this._downAt=Date.now();});
    cv.addEventListener('pointerup',()=>{dragging=false;cv.classList.remove('drag');});
    cv.addEventListener('pointermove',e=>{
      if(dragging){theta=Math.max(-1.15,Math.min(1.15,theta-(e.clientX-px)*.004));phi=Math.min(1.9,Math.max(.85,phi-(e.clientY-py)*.0035));px=e.clientX;py=e.clientY;}
      else{const r=cv.getBoundingClientRect();this._mx=((e.clientX-r.left)/r.width)*2-1;this._my=-((e.clientY-r.top)/r.height)*2+1;this._hoverDirty=true;}
    });
    cv.addEventListener('wheel',e=>{e.preventDefault();focus=false;radius=Math.min(3.2,Math.max(.5,radius*(1+e.deltaY*.0012)));},{passive:false});
    const ray=new THREE.Raycaster();const mv=new THREE.Vector2();
    this._applyHover=(comp)=>{
      if(this._hover===comp)return;
      if(this._hover&&this._hover!==this._sel)setEmissive(this._hover,0);
      this._hover=comp;if(comp&&comp!==this._sel)setEmissive(comp,.4);
      cv.style.cursor=comp?'pointer':(dragging?'grabbing':'grab');
      if(!this._sel)this._panel(comp);
    };
    cv.addEventListener('click',()=>{
      if(Date.now()-(this._downAt||0)>260)return;
      this._select(this._hover&&this._sel!==this._hover?this._hover:null);
    });
    const resize=()=>{const w=this.clientWidth||900,h=this.clientHeight||560;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    new ResizeObserver(resize).observe(this);resize();
    this._dispose=()=>{
      scene.traverse(o=>{
        if(o.geometry)o.geometry.dispose();
        const mm=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
        mm.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)v.dispose();});m.dispose();});
      });
      renderer.dispose();
    };
    const t0=performance.now();
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      if(this._onScreen===false||document.hidden)return;
      // intro: ease the camera in from a step further back down the aisle
      const k=this._reduce?1:Math.min(1,(performance.now()-t0)/2000),e=1-Math.pow(1-k,3);
      if(focus){
        target.lerp(tGoal,.06);radius+=(rGoal-radius)*.06;
        if(target.distanceTo(tGoal)<.01&&Math.abs(rGoal-radius)<.02)focus=false;
      }
      // intro: start looking along the aisle, then turn to face the hero cabinet
      const th=theta+(1-e)*.95;
      let rr=radius+(1-e)*.4;
      // hard constraint — keep the eye between the rows, never inside a cabinet
      const along=Math.sin(phi)*Math.cos(th);
      if(along>.001){
        const rMin=(target.z-.55)/along,rMax=(target.z+.86)/along;
        if(rr<rMin)rr=rMin;
        if(rr>rMax)rr=rMax;
      }
      camera.position.set(target.x+rr*Math.sin(phi)*Math.sin(th),target.y+rr*Math.cos(phi)+.3*(1-e),target.z-rr*along);
      camera.lookAt(target);
      // door swing
      const want=this._doorOpen?-1.15:0;
      doorPivot.rotation.y+=(want-doorPivot.rotation.y)*(this._reduce?1:.12);
      // activity lights
      const tt=performance.now()*.004;
      leds.forEach(l=>{
        if(this._sel&&this._sel!=='door'&&this._sel!=='frame'&&l.parent===doorPivot){l.visible=false;return;}
        l.visible=true;
        const v=.4+.6*Math.abs(Math.sin(tt+l.userData.ph));
        l.scale.set(1,v,1);
      });
      if(this._hoverDirty&&!dragging){
        this._hoverDirty=false;mv.set(this._mx,this._my);ray.setFromCamera(mv,camera);
        const hit=ray.intersectObjects(pick,false)[0];
        this._applyHover(hit?hit.object.userData.comp:null);
      }
      renderer.render(scene,camera);
    };
    this._goView('aisle');
    tick();
  }
}
if(!customElements.get('lm-datahall-viewer'))customElements.define('lm-datahall-viewer',LMDataHallViewer);
})();
