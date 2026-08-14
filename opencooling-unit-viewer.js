/* <lm-opencooling-unit-viewer> — BAC Series 3000 open cooling tower, single
   unit, detailed and explodable.

   This is the UNIT viewer. It is deliberately separate from
   `opencooling-viewer.js`, which is the photo-matched view of the whole rooftop
   bank; this one is one machine, cut down to its named assemblies so the
   construction can be read.

   Model: uploads/3d/open-cooling-tower.glb, built in Blender from BAC's own
   literature (see uploads/3d/ref/open-cooling-tower/NOTES.md). Assumed model
   3648C — 6.566 x 3.600 x 3.712 m.

   NO EXPLODE. The GLB still carries the authored explode animation (one clip
   per object, frame 1 assembled to frame 60 apart) but this viewer deliberately
   never instantiates a mixer, so the clips are inert and the model always reads
   assembled. Do not wire the HUD slider back up, and do not reach for the radial
   `_applyExplode` the room viewers use — it pushes parts off the centroid, which
   is meaningless for a crossflow tower's fill / louvre / drive layout.

   THE ROW IS SCENERY. 冷塔.jpg shows the cells in a near-touching line on a
   raised plant plinth, with a stair climbing out of a well at the near left.
   Cells 2-4 are CLONES of the loaded unit taken before the per-section material
   clone below, so they cost no download, can never drift from the hero, and are
   untouched by tint / colour mode / hide-walls. Nothing in the row or the
   rooftop goes into `pick` or `sections`: only cell 1 answers to the cursor,
   and the orbit is fenced so the camera can never leave it. */
(function(){
const ESM='https://cdn.jsdelivr.net/npm/three@0.160.0';
const GLB='uploads/3d/open-cooling-tower.glb';
const SKY='uploads/sky-overcast-equirect.jpg';
const POSTER='';
// Rooftop layout, read off 冷塔.jpg. The cells are near-touching — only a slim
// frame strip between casings — so the row reads as one long louvred wall.
const ROW={n:4,pitch:6.75};
const PLAT_Y=-0.32;   // plinth top: where the GLB's support beams land
// The roof the stair climbs from. Shallow on purpose. A point h below the eye
// needs depth >= h/tan(fov/2) to stay in frame, so every extra metre of well
// depth pushes the flight further from the lens to stay visible — and further
// from cell 1. At the original 2.28 m the flight sat entirely below the frame
// and read as a bare handrail. 0.96 m is still a real 5-riser stair.
// Widening the lens does NOT help: the fit pulls the camera in to keep the unit
// the same size, so the eye-height-to-distance ratio barely moves.
const LOW_Y=-1.28;
const EYE_Y=PLAT_Y+1.68;  // standing lens height — the whole rig hangs off this
const SEC={
  FG:{name:'FAN GUARD',type:'Guard',devices:'Radial + concentric guard over the fan discharge'},
  FN:{name:'AXIAL FAN',type:'Fan',devices:'Low-HP axial fan · hub · 6 blades'},
  DR:{name:'BALTIDRIVE POWER TRAIN',type:'Drive',devices:'TEAO motor · cast aluminium sheaves · belt · bearings · fan shaft · support beam'},
  FD:{name:'FAN DECK',type:'Deck',devices:'Fan deck plate · fan cylinder'},
  WD:{name:'WATER DISTRIBUTION',type:'Water system',devices:'Gravity hot water basins · removable covers · 360° non-clog nozzles · dual top inlets'},
  FL:{name:'BACross FILL',type:'Heat transfer',devices:'PVC film fill with INTEGRAL drift eliminators · two banks'},
  LV:{name:'AIR INLET LOUVERS',type:'Louvres',devices:'FRP louvre banks, both long faces'},
  CS:{name:'CASING PANELS',type:'Casing',devices:'FRP end walls and upper side panels'},
  AD:{name:'ACCESS DOORS',type:'Access',devices:'Inward-swinging door on each end wall'},
  FR:{name:'STRUCTURAL FRAME',type:'Structure',devices:'G-235 galvanised steel frame · tensioned X cross-bracing'},
  CB:{name:'COLD WATER BASIN',type:'Water system',devices:'Sloped basin · suction strainer · anti-vortex hood · make-up float · outlet, overflow, drain'},
  HR:{name:'HANDRAIL & LADDER',type:'Steel access',devices:'Perimeter handrail · access ladder'},
  RD:{name:'SUPPORT STEEL',type:'Rooftop context',devices:'Parallel steel support beams under the basin'}
};
const IDS=Object.keys(SEC);
const MAP=IDS.map(id=>[new RegExp('^OCU_'+id+'_'),id]);
const HUDCFG={views:[],
  walls:true,colour:true,explode:false,poster:POSTER,loadingLabel:'Loading cooling tower',
  hint:'Drag look &#183; Scroll zoom<br>R reset &#183; W casing &#183; C colour &#183; Esc deselect'};
const ARIA='Interactive 3D model of a BAC Series 3000 open cooling tower, seen from standing height on the plant plinth. The first cell in the row is interactive; the cells behind it are scenery. Drag or use arrow keys to look around within the fixed viewpoint, scroll to zoom. Click a part to inspect it. Press R to reset, W to hide the casing, Escape to deselect.';
const secOf=(n)=>{for(const[m,id]of MAP)if(m.test(n))return id;return null;};
const secOfNode=(o)=>{for(let n=o;n;n=n.parent){const id=secOf(n.name||'');if(id)return id;}return null;};
// 'Hide walls' strips the shell so the internals read — casing plus doors
const isWallNode=(o)=>{for(let n=o;n;n=n.parent){if(/^OCU_(CS|AD)_/.test(n.name||''))return true;}return false;};

class LMOpenCoolingUnitViewer extends HTMLElement{
  connectedCallback(){
    if(this._built)return;this._built=true;
    const sh=this.attachShadow({mode:'open'});
    sh.innerHTML=LMHUD.markup(HUDCFG);
    this._reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._view='overview';this._hover=null;this._sel=null;this._sections={};
    this.setAttribute('tabindex','0');this.setAttribute('role','application');
    this.setAttribute('aria-label',ARIA);
    this.addEventListener('keydown',this._onKey);
    this.addEventListener('pointerenter',()=>this.focus({preventScroll:true}));
    this._hud=LMHUD.attach(this,sh,HUDCFG,{
      sections:this._sections,order:IDS,SEC,
      onView:(v)=>this._setView(v),
      onReset:()=>{if(this._select)this._select(null);this._setView('overview');},
      onSelect:(id)=>{if(this._select)this._select(id);},
      onHover:(id)=>{if(this._applyHover)this._applyHover(id);},
      onVisibility:(fn)=>{if(this._applyVis)this._applyVis(fn);},
      onWalls:(off)=>{if(this._applyWalls)this._applyWalls(off);},
      onColour:(on)=>{if(this._applyColour)this._applyColour(on);}
    });
    const start=()=>{
      if(this._started)return;this._started=true;
      Promise.all([import(ESM+'/+esm'),import(ESM+'/examples/jsm/loaders/GLTFLoader.js/+esm')])
        .then(([T,GL])=>{try{this._init(T,GL.GLTFLoader);}catch(e){this._fallback(e);}})
        .catch(e=>this._fallback(e));
    };
    setTimeout(start,60);
    this._visOb=new IntersectionObserver(es=>es.forEach(e=>{this._onScreen=e.isIntersecting;if(e.isIntersecting){start();this._resume();}}),{rootMargin:'240px'});
    this._visOb.observe(this);
  }
  _resume(){if(this._tick&&!this._raf)this._tick();}
  disconnectedCallback(){
    if(this._visOb){this._visOb.disconnect();this._visOb=null;}
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}
    if(this._dispose)this._dispose();
    this._built=false;this._started=false;
  }
  _fallback(e){console.error('Open cooling unit viewer:',e);if(this._hud)this._hud.fail();}
  _onKey=(e)=>{
    const k=e.key;
    if(k==='Escape'||k==='0'){if(this._select)this._select(null);}
    else if(this._lookKey&&this._lookKey(k)){}
    else if(this._hud&&this._hud.key(k)){}
    else return;
    e.preventDefault();
  };
  _sync(){ if(!this._hud)return; const h=this._hud; h.sel=this._sel; h.hover=this._hover; h.view=this._view; h.sync(); }
  _setView(v){this._view=v;this._sync();if(this._goView)this._goView(v);}
  _panel(id){ if(!this._hud)return; this._hud.setProps(id); this._hud.setTip(id?SEC[id].name:''); }

  _init(THREE,GLTFLoader){
    const cv=this.shadowRoot.querySelector('canvas');
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();
    scene.background=null;renderer.setClearColor(0x000000,0);
    scene.fog=new THREE.Fog(0xc9ced0,60,200);   // softens the far plinth edge into the plate
    const camera=new THREE.PerspectiveCamera(44,1,.05,300);

    // same overcast plate the FP tower viewer uses — this is outdoor plant and
    // the galvanised steel needs a bright environment to read as metal
    const sky=document.createElement('canvas');sky.width=64;sky.height=256;
    {const g=sky.getContext('2d'),grd=g.createLinearGradient(0,0,0,256);
     grd.addColorStop(0,'#dfe6ec');grd.addColorStop(.42,'#f2f5f7');
     grd.addColorStop(.52,'#e8eaea');grd.addColorStop(.62,'#9fa3a3');
     grd.addColorStop(1,'#6d7170');
     g.fillStyle=grd;g.fillRect(0,0,64,256);}
    const skyTex=new THREE.CanvasTexture(sky);
    skyTex.mapping=THREE.EquirectangularReflectionMapping;
    skyTex.colorSpace=THREE.SRGBColorSpace;
    const pm=new THREE.PMREMGenerator(renderer);
    pm.compileEquirectangularShader();
    scene.environment=pm.fromEquirectangular(skyTex).texture;
    skyTex.dispose();
    new THREE.TextureLoader().load(SKY,(t)=>{
      t.mapping=THREE.EquirectangularReflectionMapping;
      t.colorSpace=THREE.SRGBColorSpace;
      const env=pm.fromEquirectangular(t).texture;
      if(scene.environment)scene.environment.dispose();
      scene.environment=env;scene.background=t;
      pm.dispose();dirty=true;
    },undefined,()=>{pm.dispose();});

    // Same balance as the FP tower viewer: the sky plate carries most of the
    // illumination, so the key exists mainly to separate faces. A strong
    // hemisphere fill lit every face equally and the unit read as one slab.
    const sun=new THREE.DirectionalLight(0xfff8ee,1.30);
    sun.position.set(-16,17,13);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.radius=3;
    scene.add(sun,sun.target);
    scene.add(new THREE.HemisphereLight(0xdfe9f4,0x8f9294,.24));

    /* ---------------- rooftop scene ----------------
       Built here, not in the GLB, so the download stays one machine. Geometry
       only — no binary assets; every map is drawn into a canvas.

       Plan (metres, cell 1 centred on the origin, row running +X, camera side
       +Z): a solid plinth from LOW_Y up to PLAT_Y carries the row, with a stair
       well cut out of it just west of cell 1. A straight flight climbs -Z out
       of the well onto the plinth.

       The well is where it is because of the fit below, not by eye. From a
       standing lens 1.68 m above the plinth the deck only comes into frame
       beyond about 5.5 m, so a stair any nearer falls out of the bottom of the
       picture; and the frame-left at that depth is a narrow wedge running along
       cell 1's end wall. x -5.95..-4.10 by z 0.30..2.50 is inside that wedge at
       every aspect the viewer is used at, and leaves 0.7 m of deck between the
       well and the cell to walk to its ladder.

       THE FLIGHT'S HEAD IS AT THE EAST EDGE, hard against that 0.7 m walkway.
       That, not the well's x, is what closes the gap to cell 1: the camera sits
       off to the west, so sliding the whole well east moves it mostly along the
       view axis and barely shifts it across the frame — 0.6 m of world travel
       bought 0.09 of NDC. Putting the head on the near corner instead moved it
       from 0.54 to 0.20 NDC off cell 1.

       The well floor still sits below the frame — what reads is the rail line
       1.02 m above the deck and the flight climbing out of the hole, which is
       what standing beside a stair well actually looks like. */
    const cvTex=(w,h,draw,rx,ry)=>{
      const cn=document.createElement('canvas');cn.width=w;cn.height=h;
      draw(cn.getContext('2d'),w,h);
      const t=new THREE.CanvasTexture(cn);
      t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);
      t.anisotropy=8;t.colorSpace=THREE.SRGBColorSpace;return t;
    };
    const SITE=new THREE.Group();SITE.name='OCU_Site';scene.add(SITE);
    {
      const X0=-16,X1=26,Z0=-9,Z1=24;              // plinth extents
      const VW=-5.95,VE=-4.10,ZN=0.30,ZS=2.50;     // stair well
      const PH=PLAT_Y-LOW_Y, PY=(PLAT_Y+LOW_Y)/2;  // plinth height / centre

      const roofMap=cvTex(128,128,(g,w,h)=>{       // screed with bay joints
        g.fillStyle='#b4b3ad';g.fillRect(0,0,w,h);
        g.strokeStyle='rgba(146,145,139,.9)';g.lineWidth=2;
        g.strokeRect(0,0,w,h);
      },1,1);
      const gratMap=cvTex(128,128,(g,w,h)=>{       // bar grating treads
        g.fillStyle='#15181b';g.fillRect(0,0,w,h);
        g.fillStyle='#c2c7cb';for(let x=0;x<w;x+=8)g.fillRect(x,0,3,h);
        g.fillStyle='#9aa0a4';for(let y=0;y<h;y+=32)g.fillRect(0,y,w,3);
      },1,6);
      const Mside=new THREE.MeshStandardMaterial({color:0xd7d8d3,roughness:.78,metalness:.04});
      const Mlow =new THREE.MeshStandardMaterial({color:0xa9a8a2,roughness:.95,metalness:.02});
      const Mgalv=new THREE.MeshStandardMaterial({color:0xb9bfc3,roughness:.32,metalness:.90});
      const Mgrat=new THREE.MeshStandardMaterial({color:0xffffff,map:gratMap,roughness:.72,metalness:.40});
      const box=(w,h,d,m,x,y,z,name,cast)=>{
        const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
        o.name=name;o.position.set(x,y,z);
        o.castShadow=cast!==false;o.receiveShadow=true;
        SITE.add(o);return o;};
      // Box UVs run 0..1 per face, so one shared map would stretch the bay
      // joints differently on every slab. Each slab gets the repeat its own
      // footprint asks for, which keeps the bays square across the whole roof.
      const plinthMat=(w,d)=>{
        const t=roofMap.clone();t.needsUpdate=true;t.repeat.set(w/2.6,d/2.6);
        const top=new THREE.MeshStandardMaterial({color:0xffffff,map:t,roughness:.94,metalness:.02});
        return [Mside,Mside,top,Mlow,Mside,Mside];   // [+x,-x,+y,-y,+z,-z]
      };

      // plinth in four slabs so the well is a real hole, not a decal
      const plinth=(w,d,x,z,n)=>box(w,PH,d,plinthMat(w,d),x,PY,z,n,false);
      plinth(X1-X0,ZN-Z0,(X0+X1)/2,(Z0+ZN)/2,'OCU_Site_PlinthN');
      plinth(X1-X0,Z1-ZS,(X0+X1)/2,(ZS+Z1)/2,'OCU_Site_PlinthS');
      plinth(VW-X0,ZS-ZN,(X0+VW)/2,(ZN+ZS)/2,'OCU_Site_PlinthW');
      plinth(X1-VE,ZS-ZN,(VE+X1)/2,(ZN+ZS)/2,'OCU_Site_PlinthE');

      // roof the well opens onto, and the parapets closing the far sides
      box(84,.40,66,Mlow,2,LOW_Y-.20,7,'OCU_Site_LowerRoof',false);
      box(.24,.95,66,Mside,-38,LOW_Y+.48,7,'OCU_Site_ParapetW',false);
      box(84,.95,.24,Mside,2,LOW_Y+.48,-24,'OCU_Site_ParapetN',false);

      /* ---- stair out of the well, climbing +X onto the plinth ----
         Along X, not Z. The lens sits west-south of the well, so a flight
         running in Z points almost straight down the view axis and foreshortens
         to a bare pair of handrails — no treads at all. Running it in X puts it
         broadside to the lens, and since the eye is above the treads the tread
         tops read as a staircase. Its head is at the EAST end, the corner
         nearest cell 1. */
      // riser derived from the count, not fixed, so the top step always lands
      // flush with the plinth whatever LOW_Y is set to
      const NR=Math.max(4,Math.round(PH/.19)),RIS=PH/NR,GO=.26,SW=1.20;
      const SZc=(ZN+ZS)/2, RUN=(NR-1)*GO, XF=VE-RUN;    // foot of the flight
      const ang=Math.atan2(PH,RUN), SL=Math.hypot(RUN,PH);
      const xc=(XF+VE)/2, scy=PY;
      for(let i=0;i<NR-1;i++)
        box(GO,.05,SW,Mgrat,XF+GO*(i+.5),LOW_Y+RIS*(i+1),SZc,'OCU_Site_Tread'+i);
      for(const s of[-1,1]){
        const sz=SZc+s*(SW/2+.03);
        // Rotating about +Z lifts the box's +x end, which is the head. The
        // nosing line passes exactly through (xc, scy), so the stringer has to
        // drop or it stands proud of the treads.
        const st=box(SL,.28,.05,Mgalv,xc,scy-.17,sz,'OCU_Site_Stringer'+s);
        st.rotation.z=ang;
        [1.02,.57].forEach((hy,j)=>{
          const r=box(SL,.05,.05,Mgalv,xc,scy+hy,sz,'OCU_Site_StairRail'+s+j);
          r.rotation.z=ang;});
        box(.05,1.10,.05,Mgalv,XF-.10,LOW_Y+.55,sz,'OCU_Site_Newel'+s+'B');
        box(.05,1.10,.05,Mgalv,VE+.10,PLAT_Y+.55,sz,'OCU_Site_Newel'+s+'T');
      }

      /* ---- guardrail round the well; the east edge IS the stair head ---- */
      const railRun=(ax,az,bx,bz,tag)=>{
        const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),a=Math.atan2(dx,dz);
        const cx=(ax+bx)/2,cz=(az+bz)/2;
        [1.02,.55].forEach((hy,j)=>{
          box(.05,.05,len,Mgalv,cx,PLAT_Y+hy,cz,tag+'R'+j).rotation.y=a;});
        box(.03,.14,len,Mgalv,cx,PLAT_Y+.08,cz,tag+'T').rotation.y=a;
        const n=Math.max(2,Math.round(len/1.9)+1);
        for(let i=0;i<n;i++){const t=i/(n-1);
          box(.05,1.06,.05,Mgalv,ax+dx*t,PLAT_Y+.53,az+dz*t,tag+'P'+i);}
      };
      railRun(VW,ZN,VW,ZS,'OCU_Site_WellW');
      railRun(VW,ZN,VE,ZN,'OCU_Site_WellN');
      railRun(VW,ZS,VE,ZS,'OCU_Site_WellS');
    }

    /* ---------------- model ---------------- */
    const sections=this._sections;
    const walls=[],catMat={};
    const pick=[];
    let dirty=true;

    new GLTFLoader().load(GLB,(gltf)=>{
      const root=gltf.scene;
      root.traverse(o=>{
        if(!o.isMesh)return;
        // The GLB carries a 46 m slab as its ground. The plinth above replaces
        // it — it has the stair well cut out — so drop the slab entirely rather
        // than just hiding it, or the RD visibility toggle would bring it back
        // to z-fight with the plinth.
        if(/^OCU_RD_Roof_Deck/.test(o.name||'')){o.visible=false;return;}
        o.castShadow=true;o.receiveShadow=true;
        if(isWallNode(o))walls.push(o);
        if(o.material&&o.material.envMapIntensity!==undefined)o.material.envMapIntensity=.85;
        const id=secOfNode(o);
        if(id&&SEC[id]){
          (sections[id]=sections[id]||{meshes:[]}).meshes.push(o);
          o.userData.sec=id;pick.push(o);
        }
      });
      // The rest of the row, BEFORE the per-section material clone below: the
      // clones keep the loader's materials, so hover tint, colour mode and
      // hide-walls all stay on cell 1. They are not in `pick`, so the cursor
      // ignores them either.
      for(let i=1;i<ROW.n;i++){
        const cell=root.clone(true);
        cell.name='OCU_Row_Cell'+(i+1);
        cell.position.x=i*ROW.pitch;
        scene.add(cell);
      }

      const seen=new Map();
      Object.keys(sections).forEach(id=>{
        sections[id].meshes.forEach(o=>{
          const key=id+'|'+o.material.uuid;
          if(!seen.has(key))seen.set(key,o.material.clone());
          o.material=seen.get(key);
        });
        const bb=new THREE.Box3();
        sections[id].meshes.forEach(o=>bb.expandByObject(o));
        sections[id].box=bb;sections[id].centre=bb.getCenter(new THREE.Vector3());
        sections[id].size=bb.getSize(new THREE.Vector3()).length();
      });
      scene.add(root);

      // gltf.animations is left alone on purpose — no mixer, no actions, so the
      // clips never move anything and the unit always reads assembled.

      // Frame on the MACHINE, not the model bounds — the roof slab is 46m
      // across and would drive the span (and therefore the camera distance)
      // to nonsense.
      const bb=new THREE.Box3();
      IDS.forEach(id=>{if(id!=='RD'&&sections[id])bb.union(sections[id].box);});
      const c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
      C.copy(c);
      const span=Math.max(sz.x,sz.z,sz.y*1.25);
      R_MIN=1.8;R_MAX=span*3.4;
      // STANDING EYE LEVEL, solved not guessed: the lens sits 1.68 m above the
      // PLINTH — someone standing on the deck beside the machine — and the
      // elevation follows from that. Fitted to CELL 1 only, so the row behind
      // fills the frame the way it does in the photo without ever driving the
      // framing.
      // The distance is fitted to the ACTUAL canvas aspect: a fixed radius that
      // frames well at 2.3:1 overflows badly at 1.3:1.
      // Solved numerically, not analytically: from a low lens the near-bottom
      // corners project far wider than a half-extent estimate predicts, so the
      // closed-form fit overflowed. Push r until all eight corners of the
      // machine sit inside the window below.
      // Cell 1 is framed RIGHT of centre, leaving the left of frame for the
      // stair well — the 冷塔.jpg composition. The aim shifts along the camera's
      // right vector, which for a Y-up rig depends only on theta, so it is a
      // constant direction here.
      const EYE=EYE_Y, TY=1.95, FITY=.90;
      const TANH=Math.tan(44*Math.PI/360);
      const SX=Math.cos(VIEWS.overview.th), SZ=-Math.sin(VIEWS.overview.th);
      const corners=[];
      for(const X of[bb.min.x,bb.max.x])for(const Y of[bb.min.y,bb.max.y])
        for(const Z of[bb.min.z,bb.max.z])corners.push(new THREE.Vector3(X,Y,Z));
      const probe=new THREE.PerspectiveCamera(44,1,.05,300);
      this._fitOverview=()=>{
        const t=new THREE.Vector3(), th=VIEWS.overview.th, asp=camera.aspect||1;
        // A narrow canvas has no room for a side composition, so the off-centre
        // framing relaxes towards centred as the aspect narrows — held at 0.20
        // it pushed the lens 26 m back on a phone and the unit went tiny.
        const k=Math.max(0,Math.min(1,(asp-.9)/.4));
        const aimx=.20*k, fitx=.92-.22*k;
        let r=Math.max(sz.x,sz.y)*.8, ph=Math.PI/2;
        for(let i=0;i<60;i++){
          ph=Math.acos(Math.max(-1,Math.min(1,(EYE-TY)/r)));
          const lat=-aimx*TANH*asp*r;
          t.set(c.x+SX*lat,TY,c.z+SZ*lat);
          probe.aspect=asp;
          probe.position.set(t.x+r*Math.sin(ph)*Math.sin(th),
                             t.y+r*Math.cos(ph),
                             t.z+r*Math.sin(ph)*Math.cos(th));
          probe.lookAt(t);probe.updateMatrixWorld(true);probe.updateProjectionMatrix();
          let m=0;
          for(const p of corners){const q=p.clone().project(probe);
            m=Math.max(m,Math.abs(q.x-aimx)/fitx,Math.abs(q.y)/FITY);}
          // Converge from EITHER side. The earlier loop could only grow r, so
          // it stopped at the first radius that fitted and left the unit at
          // 0.73 of the frame height on a wide canvas.
          if(Math.abs(m-1)<.006)break;
          r*=Math.min(1.35,Math.max(.80,m));
        }
        VIEWS.overview.t.copy(t);VIEWS.overview.r=r;
        // Fence the swing around the solved view: the camera can never come
        // round onto the scenery cells behind cell 1.
        theta=Math.min(TH_MAX,Math.max(TH_MIN,theta));
      };
      this._fitOverview();
      sun.target.position.copy(c);
      // wide enough to cover the whole row, or the neighbours cast nothing
      const shSpan=span+ROW.pitch*(ROW.n-1)*.6;
      sun.shadow.camera.left=-shSpan;sun.shadow.camera.right=shSpan;
      sun.shadow.camera.top=shSpan;sun.shadow.camera.bottom=-shSpan;
      sun.shadow.camera.far=180;
      sun.shadow.camera.updateProjectionMatrix();

      this._applyVis=(fn)=>{
        IDS.forEach(id=>{const sc=sections[id];if(sc)sc.meshes.forEach(o=>{o.visible=fn(id);});});
        if(this._sel&&!fn(this._sel))this._select(null);
        dirty=true;
      };
      this._applyWalls=(off)=>{walls.forEach(o=>{o.visible=!off;});dirty=true;};
      this._applyColour=(on)=>{
        IDS.forEach(id=>{const sc=sections[id];if(!sc)return;
          if(!catMat[id])catMat[id]=new THREE.MeshStandardMaterial({color:this._hud.colourOf(id),roughness:.55,metalness:.08});
          sc.meshes.forEach(o=>{if(!o.userData.m0)o.userData.m0=o.material;o.material=on?catMat[id]:o.userData.m0;});
        });dirty=true;
      };
      this._loaded=true;dirty=true;
      this._goView(this._view);
      this._sync();
      this._hud.ready();
    },(e)=>{
      if(e.total&&this._hud)this._hud.progress(e.loaded/e.total*100);
    },(err)=>this._fallback(err));

    /* ---------------- camera rig ---------------- */
    const C=new THREE.Vector3(0,1.8,0);
    // TH0 puts the camera front-left of cell 1 with the row receding to the
    // right, which is the 冷塔.jpg framing; it also lands the lens on the
    // plinth south of the stair well rather than over the hole.
    const TH0=-0.62;
    const VIEWS={overview:{t:C.clone(),r:16,th:TH0}};
    let V=VIEWS.overview;
    let target=V.t.clone(),radius=V.r,theta=V.th;
    let tGoal=target.clone(),rGoal=radius,thGoal=theta,glide=false;
    let R_MIN=2,R_MAX=60;
    const TH_MIN=TH0-.42,TH_MAX=TH0+.42;
    // There is no phi. Elevation is DERIVED from the pinned eye height in the
    // tick, and the vertical drag moves the TARGET instead — a person standing
    // on the plinth tilting their head. An orbiting phi let the lens climb to
    // 4.6 m, which reads as a drone shot however tightly it is clamped.
    const TY_MIN=.55,TY_MAX=4.05;
    this._goView=(v)=>{
      const W=VIEWS[v]||VIEWS.overview;
      tGoal=W.t.clone();rGoal=W.r;thGoal=W.th;glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;theta=thGoal;glide=false;dirty=true;}
    };
    this._goSection=(id)=>{
      const s=sections[id];if(!s)return;
      tGoal=s.centre.clone();
      tGoal.y=Math.min(TY_MAX,Math.max(TY_MIN,tGoal.y));
      rGoal=Math.min(R_MAX,Math.max(R_MIN,s.size*1.7));
      thGoal=theta;glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;glide=false;dirty=true;}
    };
    this._lookKey=(k)=>{
      const st=.12;
      if(k==='ArrowLeft'){theta=Math.min(TH_MAX,theta+st);glide=false;dirty=true;return true;}
      if(k==='ArrowRight'){theta=Math.max(TH_MIN,theta-st);glide=false;dirty=true;return true;}
      if(k==='ArrowUp'){target.y=Math.min(TY_MAX,target.y+st*3);tGoal.y=target.y;glide=false;dirty=true;return true;}
      if(k==='ArrowDown'){target.y=Math.max(TY_MIN,target.y-st*3);tGoal.y=target.y;glide=false;dirty=true;return true;}
      if(k==='+'||k==='='){radius=Math.max(R_MIN,radius*.9);glide=false;dirty=true;return true;}
      if(k==='-'||k==='_'){radius=Math.min(R_MAX,radius*1.1);glide=false;dirty=true;return true;}
      return false;
    };
    let dragging=false,px=0,py=0;
    cv.addEventListener('pointerdown',e=>{dragging=true;glide=false;px=e.clientX;py=e.clientY;cv.classList.add('drag');cv.setPointerCapture(e.pointerId);this._downAt=Date.now();});
    cv.addEventListener('pointerup',()=>{dragging=false;cv.classList.remove('drag');});
    cv.addEventListener('pointerleave',()=>{this._hoverDirty=false;this._applyHover&&this._applyHover(null);});
    cv.addEventListener('pointermove',e=>{
      if(dragging){
        theta=Math.min(TH_MAX,Math.max(TH_MIN,theta-(e.clientX-px)*.0052));
        // drag up to look up: the head tilts, the eye stays at standing height
        target.y=Math.min(TY_MAX,Math.max(TY_MIN,target.y-(e.clientY-py)*.011));
        tGoal.y=target.y;
        px=e.clientX;py=e.clientY;dirty=true;
      }else{
        const r=cv.getBoundingClientRect();
        this._mx=((e.clientX-r.left)/r.width)*2-1;this._my=-((e.clientY-r.top)/r.height)*2+1;this._hoverDirty=true;
      }
    });
    cv.addEventListener('wheel',e=>{e.preventDefault();glide=false;radius=Math.min(R_MAX,Math.max(R_MIN,radius*(1+e.deltaY*.0012)));dirty=true;},{passive:false});

    /* ---------------- hover + select ---------------- */
    const ray=new THREE.Raycaster();const mv=new THREE.Vector2();
    const tint=(id,i)=>{ if(!sections[id])return;
      const done=new Set();
      sections[id].meshes.forEach(o=>{ const m=o.material; if(!m.emissive||done.has(m.uuid))return; done.add(m.uuid);
        if(m.userData.e0===undefined){m.userData.e0=m.emissive.getHex();m.userData.ei0=m.emissiveIntensity;}
        if(i>0){m.emissive.setHex(0x00b0f0);m.emissiveIntensity=i;}
        else{m.emissive.setHex(m.userData.e0);m.emissiveIntensity=m.userData.ei0;}
      });dirty=true;};
    this._applyHover=(id)=>{
      if(this._hover===id)return;
      if(this._hover&&this._hover!==this._sel)tint(this._hover,0);
      this._hover=id;
      if(id&&id!==this._sel)tint(id,.18);
      cv.style.cursor=id?'pointer':(dragging?'grabbing':'grab');
      if(!this._sel)this._panel(id);
      this._sync();
    };
    this._select=(id)=>{
      if(this._sel)tint(this._sel,0);
      this._sel=id;
      if(id){tint(id,.3);this._panel(id);this._goSection(id);}
      else{this._panel(this._hover);this._setView(this._view);}
      this._sync();
    };
    cv.addEventListener('click',()=>{
      if(Date.now()-(this._downAt||0)>260)return;
      this._select(this._hover&&this._sel!==this._hover?this._hover:null);
    });

    const resize=()=>{
      const w=this.clientWidth||900,h=this.clientHeight||560;
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      // keep Reset correct for the new aspect, but never yank a camera the
      // user has already moved
      if(this._fitOverview)this._fitOverview();
      dirty=true;
    };
    new ResizeObserver(resize).observe(this);resize();
    this.debugScene={scene,camera,renderer,root:scene,render:()=>renderer.render(scene,camera)};
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
      if(this._onScreen===false||document.hidden){this._raf&&cancelAnimationFrame(this._raf);this._raf=null;return;}
      const k=this._reduce?1:Math.min(1,(performance.now()-t0)/1800),e=1-Math.pow(1-k,3);
      if(k<1)dirty=true;
      if(glide){
        target.lerp(tGoal,.07);radius+=(rGoal-radius)*.07;theta+=(thGoal-theta)*.07;dirty=true;
        if(target.distanceTo(tGoal)<.008&&Math.abs(rGoal-radius)<.01&&Math.abs(thGoal-theta)<.005)glide=false;
      }
      if(this._hoverDirty&&!dragging){
        this._hoverDirty=false;mv.set(this._mx,this._my);ray.setFromCamera(mv,camera);
        const hit=ray.intersectObjects(pick,false)[0];
        this._applyHover(hit?hit.object.userData.sec:null);
      }
      if(dirty){
        dirty=false;
        const rr=radius+(1-e)*4;
        // The lens is PINNED to standing height on the plinth. dy is only
        // clamped for the degenerate close-up where the target is further above
        // the eye than the radius is long; at every normal distance the eye
        // sits exactly EYE_Y and the tilt comes from the target alone.
        const dy=Math.max(-.85*rr,Math.min(.85*rr,EYE_Y-target.y));
        const hor=Math.sqrt(Math.max(0,rr*rr-dy*dy));
        camera.position.set(
          target.x+hor*Math.sin(theta),
          target.y+dy+.6*(1-e),
          target.z+hor*Math.cos(theta));
        camera.lookAt(target);
        renderer.render(scene,camera);
      }
    };
    this._tick=tick;
    this._goView('overview');
    tick();
  }
}
if(!customElements.get('lm-opencooling-unit-viewer'))customElements.define('lm-opencooling-unit-viewer',LMOpenCoolingUnitViewer);
})();
