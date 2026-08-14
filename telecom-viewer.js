/* <lm-telecom-viewer> — Longmotive telecom operator access room inspector.

   The scene is code-only: telecom-model.js exposes window.LMTelecomModel.create
   (THREE) -> THREE.Group and must load BEFORE this file. There is no GLB and no
   poster, so nothing is fetched at runtime and buildModel() is synchronous.

   THE VIEW IS HARD-LOCKED to the reference photograph 运营商接入间1.jpg. The
   standpoint was solved photogrammetrically against the two Canatal cabinets
   (see the header of telecom-model.js for the derivation) and the numbers here
   are the same solve expressed in the rig's spherical form:

       camera (0, 1.441, 4.603), optical axis yawed 19.73 deg off the wall
       normal, horizontal field 102.7 deg

   Reset re-frames exactly that. Zoom only goes IN — R_MAX is the solved radius —
   and the orbit window is a few degrees either side so the room can be looked
   around without ever leaving the reference composition or passing through a
   wall. Re-solve rather than nudge if the cabinet dimensions change.

   fov is recomputed on resize instead of being fixed, which is a departure from
   the sibling viewers. It has to be: the reference is 3:2 and the viewer pane
   is nearer 16:9, so a fixed VERTICAL fov would widen the shot on a wide window
   and the framing would stop matching. Holding the HORIZONTAL field fixed keeps
   the left-to-right composition — control panel, unit A, riser bank, pilaster,
   CANATAL unit, corner — identical at any window size. */
(function(){
const ESM='https://cdn.jsdelivr.net/npm/three@0.160.0';
const SEC={
  A1:{name:'CRAC 1',type:'Canatal precision AC unit',devices:'Downflow room cooler · coil face still wrapped for transit'},
  A2:{name:'CRAC 2',type:'Canatal precision AC unit',devices:'Second downflow cooler, N+1 pair · CANATAL nameplate'},
  CP:{name:'CONTROL PANEL',type:'Local control cabinet',devices:'Unit control & isolation · indicator lamps and meter'},
  CH:{name:'CHILLED WATER',type:'Riser bank',devices:'Two flow/return pairs · gauges, isolation valves, floor header'},
  CT:{name:'CABLE CONTAINMENT',type:'Basket tray',devices:'Yellow mesh basket runs on threaded drop rods'},
  LT:{name:'LIGHTING',type:'Twin-tube battens',devices:'Five surface/pendant fittings under the downstand beams'},
  FS:{name:'FIRE PROTECTION',type:'Wet sprinkler',devices:'High-level main with pendent drops and heads'},
  EL:{name:'SECURITY & CONDUIT',type:'ELV containment',devices:'Dome cameras · galvanised riser duct · small-bore conduit'}
};
const IDS=Object.keys(SEC);
const MAP=[
  [/^TA_CracA/,'A1'],
  [/^TA_CracB/,'A2'],
  [/^TA_Panel/,'CP'],
  [/^TA_Pipe/,'CH'],
  [/^TA_Tray/,'CT'],
  [/^TA_Light/,'LT'],
  [/^TA_Fire/,'FS'],
  [/^TA_Elv/,'EL']
];
const HUDCFG={views:[], // locked to the reference standpoint — Reset re-frames it, no other views offered
  walls:true,colour:true,explode:false,poster:'',loadingLabel:'Loading telecom access room',
  hint:'Drag to look &#183; Scroll zoom in<br>R reset &#183; W walls &#183; C colour &#183; Esc deselect'};
const ARIA='Interactive 3D model of the telecom operator access room, locked to the reference photograph. Drag or use arrow keys to look around, scroll to zoom in. Click equipment to inspect it. Press R to reset the view, Escape to deselect.';

/* the mirrored floor reflection carries the same family names with an _Rf tail:
   it must follow its section for visibility and tint, but never be clicked,
   never widen a section's bounds and never take the colour-by-system swap */
const isGhost=(o)=>/_Rf$/.test(o.name||'');
const secOf=(n)=>{for(const[m,id]of MAP)if(m.test(n))return id;return null;};
const secOfNode=(o)=>{for(let n=o;n;n=n.parent){const id=secOf(n.name||'');if(id)return id;}return null;};
const isWallNode=(o)=>{for(let n=o;n;n=n.parent){if(/Wall|Skirt|Ceil|Col|Beam/.test(n.name||''))return true;}return false;};

/* horizontal half-field of the reference frame: tan(102.68 deg / 2) */
const HFOV_TAN=1.2494;

class LMTelecomViewer extends HTMLElement{
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
      onColour:(on)=>{if(this._applyColour)this._applyColour(on);},
      onExplode:(t)=>{if(this._applyExplode)this._applyExplode(t);}
    });
    const start=()=>{
      if(this._started)return;this._started=true;
      Promise.all([import(ESM+'/+esm'),import(ESM+'/examples/jsm/environments/RoomEnvironment.js/+esm')])
        .then(([T,RE])=>{try{this._init(T,RE.RoomEnvironment);}catch(e){this._fallback(e);}})
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
  _fallback(e){
    console.error('Telecom viewer:',e);
    if(this._hud)this._hud.fail();
  }
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
  _init(THREE,RoomEnvironment){
    const cv=this.shadowRoot.querySelector('canvas');
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();
    scene.background=null;renderer.setClearColor(0x000000,0);
    scene.fog=null;                       // a 6x7m room — fog only greys the far wall
    const pm=new THREE.PMREMGenerator(renderer);
    scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();
    const camera=new THREE.PerspectiveCamera(70,1.5,.05,60);
    /* The reference is lit only by its own battens: bright board walls, a soft
       cool key and no hard sun anywhere in frame. A directional light strong
       enough to cast readable shadows under the cabinets, and no more. */
    scene.add(new THREE.HemisphereLight(0xe4eaf0,0x55595d,.52));
    scene.add(new THREE.AmbientLight(0xffffff,.16));
    // angled so unit B throws the shadow the reference has across the right
    // return — that dark band is what makes the corner read as a corner
    const sun=new THREE.DirectionalLight(0xf2f6ff,.78);
    sun.position.set(-4.5,6.5,7.5);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.radius=2.5;
    scene.add(sun,sun.target);

    /* ---------------- model ---------------- */
    const sections=this._sections;
    const walls=[],catMat={};
    const pick=[];
    let dirty=true;
    const buildModel=()=>{
      const root=LMTelecomModel.create(THREE);
      root.traverse(o=>{
        if(!o.isMesh)return;
        if(o.material&&o.material.envMapIntensity!==undefined)o.material.envMapIntensity=.45;
        if(isWallNode(o)){walls.push(o);return;}
        const id=secOfNode(o);
        if(id&&SEC[id]){
          (sections[id]=sections[id]||{meshes:[]}).meshes.push(o);
          o.userData.sec=id;
          if(!isGhost(o))pick.push(o);
        }
      });
      // clone materials per section so the hover tint never leaks through shared materials
      const seen=new Map();
      Object.keys(sections).forEach(id=>{
        sections[id].meshes.forEach(o=>{
          const key=id+'|'+o.material.uuid;
          if(!seen.has(key))seen.set(key,o.material.clone());
          o.material=seen.get(key);
        });
        const bb=new THREE.Box3();
        sections[id].meshes.forEach(o=>{if(!isGhost(o))bb.expandByObject(o);});
        sections[id].box=bb;sections[id].centre=bb.getCenter(new THREE.Vector3());
        sections[id].size=bb.getSize(new THREE.Vector3()).length();
      });
      scene.add(root);
      // the battens are the room's light: one point light under each of the
      // three that fall inside the locked frame
      (root.userData.lamps||[]).forEach(p=>{
        const l=new THREE.PointLight(0xf4f7ff,4.6,8,2);
        l.position.set(p.x,p.y,p.z);scene.add(l);
      });
      sun.target.position.set(-1.2,1.0,1.2);
      sun.shadow.camera.left=-7;sun.shadow.camera.right=7;
      sun.shadow.camera.top=7;sun.shadow.camera.bottom=-4;
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
          sc.meshes.forEach(o=>{
            if(isGhost(o))return;   // a flat opaque colour would make the reflection a solid slab
            if(!o.userData.m0)o.userData.m0=o.material;
            o.material=on?catMat[id]:o.userData.m0;
          });
        });dirty=true;
      };
      this._loaded=true;dirty=true;
      this._goView(this._view);
      this._sync();
      this._hud.ready();
    };

    /* ---------------- camera rig: locked to the reference standpoint ----------------
       Solved: camera (0, 1.441, 4.603) looking 19.73 deg off the equipment
       wall's normal. Expressed here about a target on the wall between the two
       cabinets, so radius is a straight dolly along the reference sight line. */
    const C=new THREE.Vector3(-1.486,1.441,0.462);
    const VIEWS={
      overview:{t:C.clone(),r:4.40,th:0.3444,ph:1.5708}
    };
    let V=VIEWS.overview;
    let target=V.t.clone(),radius=V.r,theta=V.th,phi=V.ph;
    let tGoal=target.clone(),rGoal=radius,thGoal=theta,phGoal=phi,glide=false;
    const R_MIN=1.30,R_MAX=VIEWS.overview.r;  // ZOOM IN ONLY — R_MAX is the reference framing
    const PH_MIN=1.53,PH_MAX=1.61;            // a couple of degrees of tilt either side of level
    const TH_MIN=0.20,TH_MAX=0.50;            // pans between unit A and the corner, never past a wall
    this._goView=(v)=>{
      const W=VIEWS[v]||VIEWS.overview;
      tGoal=W.t.clone();rGoal=W.r;thGoal=W.th;phGoal=W.ph;glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;theta=thGoal;phi=phGoal;glide=false;dirty=true;}
    };
    this._goSection=(id)=>{
      const s=sections[id];if(!s)return;
      tGoal=s.centre.clone();
      rGoal=Math.min(R_MAX,Math.max(R_MIN,s.size*1.5));
      thGoal=theta;phGoal=Math.min(PH_MAX,Math.max(PH_MIN,phi)); // stay inside the locked tilt window
      glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;phi=phGoal;glide=false;dirty=true;}
    };
    this._lookKey=(k)=>{
      const st=.05;
      if(k==='ArrowLeft'){theta=Math.min(TH_MAX,theta+st);glide=false;dirty=true;return true;}
      if(k==='ArrowRight'){theta=Math.max(TH_MIN,theta-st);glide=false;dirty=true;return true;}
      if(k==='ArrowUp'){phi=Math.max(PH_MIN,phi-.02);glide=false;dirty=true;return true;}
      if(k==='ArrowDown'){phi=Math.min(PH_MAX,phi+.02);glide=false;dirty=true;return true;}
      if(k==='+'||k==='='){radius=Math.max(R_MIN,radius*.9);glide=false;dirty=true;return true;}
      if(k==='-'||k==='_'){radius=Math.min(R_MAX,radius*1.1);glide=false;dirty=true;return true;}
      return false;
    };
    let dragging=false,px=0,py=0;
    cv.addEventListener('pointerdown',e=>{dragging=true;glide=false;px=e.clientX;py=e.clientY;cv.classList.add('drag');cv.setPointerCapture(e.pointerId);this._downAt=Date.now();});
    cv.addEventListener('pointerup',()=>{dragging=false;cv.classList.remove('drag');});
    cv.addEventListener('pointerleave',()=>{this._hoverDirty=false;this._applyHover(null);});
    cv.addEventListener('pointermove',e=>{
      if(dragging){
        theta=Math.min(TH_MAX,Math.max(TH_MIN,theta-(e.clientX-px)*.0030));
        phi=Math.min(PH_MAX,Math.max(PH_MIN,phi-(e.clientY-py)*.0016));
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

    /* HORIZONTAL field is what is locked, so the vertical fov is derived from
       the pane's aspect on every resize. Clamped so a freak window shape cannot
       drive it to a fisheye or a keyhole. */
    const resize=()=>{
      const w=this.clientWidth||900,h=this.clientHeight||560;
      renderer.setSize(w,h,false);camera.aspect=w/h;
      const v=2*Math.atan(HFOV_TAN/camera.aspect)*180/Math.PI;
      camera.fov=Math.min(88,Math.max(38,v));
      camera.updateProjectionMatrix();dirty=true;
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
        target.lerp(tGoal,.07);radius+=(rGoal-radius)*.07;theta+=(thGoal-theta)*.07;phi+=(phGoal-phi)*.07;dirty=true;
        if(target.distanceTo(tGoal)<.008&&Math.abs(rGoal-radius)<.01&&Math.abs(thGoal-theta)<.005&&Math.abs(phGoal-phi)<.005)glide=false;
      }
      if(this._hoverDirty&&!dragging){
        this._hoverDirty=false;mv.set(this._mx,this._my);ray.setFromCamera(mv,camera);
        const hit=ray.intersectObjects(pick,false)[0];
        this._applyHover(hit?hit.object.userData.sec:null);
      }
      if(dirty){
        dirty=false;
        // the intro pull-back is a dolly along the locked sight line, so the
        // frame settles onto the reference rather than swinging onto it
        const rr=radius+(1-e)*1.5;
        camera.position.set(
          target.x+rr*Math.sin(phi)*Math.sin(theta),
          target.y+rr*Math.cos(phi),
          target.z+rr*Math.sin(phi)*Math.cos(theta));
        camera.lookAt(target);
        renderer.render(scene,camera);
      }
    };
    this._tick=tick;
    // Read-only handle on the rig. It exists because the locked view has to be
    // CHECKED, not trusted: with the browser pane hidden, requestAnimationFrame
    // stalls and the canvas can sit on a stale pre-settle frame that looks like
    // a wrong camera. Reading camera.position back is the only way to tell the
    // two apart. Keep it — the standpoint is solved, so anyone re-solving it
    // needs the same handle.
    // read-only handle on the rig, for re-solving the lock against the reference
    // photo without having to re-instrument the file. Nothing in the page uses it.
    this._dbg={camera:camera,get r(){return radius},get th(){return theta},get ph(){return phi},get t(){return target}};
    buildModel(); // synchronous — the camera rig above must exist first
    this._goView('overview');
    tick();
  }
}
if(!customElements.get('lm-telecom-viewer'))customElements.define('lm-telecom-viewer',LMTelecomViewer);
})();
