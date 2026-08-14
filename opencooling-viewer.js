/* <lm-opencooling-viewer> — Longmotive open cooling tower bank.
   The model is code-only and procedural: opencooling-model.js rebuilds the bank
   from the site photo open-updated-1.jpg (louvered cells with X tie-rods and
   guardrail crowns standing on the white corrugated plant band; walkway rail,
   ladder, spiral duct elbows and a wall-hung condenser in the foreground).
   No GLB; every map is drawn into a canvas at build time. Raycast hits group
   by OC_* mesh-name families. Locked to the reference-photo standpoint:
   on the lower roof, looking up past the plant band at the cells. */
(function(){
const ESM='https://cdn.jsdelivr.net/npm/three@0.160.0';
const POSTER='assets/img/projects/open-cooling-tower.jpg'; // the reference photo itself — it dissolves into the replica
const SKY='uploads/sky-overcast-equirect.jpg'; // 2:1 equirect, 46KB — skybox + reflections
const UNIT='Open cell · louvre banks · X tie-rods · guardrail crown · fan-deck hump';
const SEC={
  CT1:{name:'TOWER CELL 1',type:'Cooling tower',devices:UNIT+' · gooseneck vent'},
  CT2:{name:'TOWER CELL 2',type:'Cooling tower',devices:UNIT+' · gooseneck vent'},
  CT3:{name:'TOWER CELL 3',type:'Cooling tower',devices:UNIT},
  CT4:{name:'TOWER CELL 4',type:'Cooling tower',devices:UNIT},
  DU:{name:'SPIRAL DUCTWORK',type:'Ductwork',devices:'Spiral-seam barrels · elbows breaking the frame'},
  CD:{name:'CONDENSER UNIT',type:'HVAC',devices:'Wall-hung mini-split · discharge grille · bracket'},
  RL:{name:'WALKWAY & ACCESS',type:'Steel access',devices:'Platform lip · handrail run · toe plate · ladder & standpipe'},
  BS:{name:'PLANT ROOM BAND',type:'Enclosure',devices:'White corrugated band the cells stand on'},
  BG:{name:'ROOF SURROUNDS',type:'Rooftop context',devices:'Lower roof · parapet'}
};
const IDS=Object.keys(SEC);
const MAP=[
  [/^OC_Cell1_/,'CT1'],
  [/^OC_Cell2_/,'CT2'],
  [/^OC_Cell3_/,'CT3'],
  [/^OC_Cell4_/,'CT4'],
  [/^OC_Duct_/,'DU'],
  [/^OC_Cond_/,'CD'],
  [/^OC_(Rail|Ladder)_/,'RL'],
  [/^OC_Base_/,'BS'],
  [/^OC_Bg_/,'BG']
];
const HUDCFG={views:[], // locked to the reference-photo view — Reset re-frames it, no other views offered
  walls:false,colour:true,explode:false,poster:POSTER,loadingLabel:'Loading cooling towers',
  hint:'Drag orbit &#183; Scroll zoom<br>R reset &#183; C colour &#183; Esc deselect'};
const ARIA='Interactive 3D model of the open cooling tower bank. Drag or use arrow keys to look around, scroll to zoom in. Click a cell or the walkway to inspect it. Press R to reset the view, Escape to deselect.';
const secOf=(n)=>{for(const[m,id]of MAP)if(m.test(n))return id;return null;};
const secOfNode=(o)=>{for(let n=o;n;n=n.parent){const id=secOf(n.name||'');if(id)return id;}return null;};
const isWallNode=(o)=>{for(let n=o;n;n=n.parent){if(/Wall|Skirt/.test(n.name||''))return true;}return false;};

class LMOpenCoolingViewer extends HTMLElement{
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
      import(ESM+'/+esm')
        .then((T)=>{try{this._init(T);}catch(e){this._fallback(e);}})
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
    console.error('Open cooling viewer:',e);
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
  _init(THREE){
    const cv=this.shadowRoot.querySelector('canvas');
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.95; // bright rooftop daylight
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();
    scene.background=null;renderer.setClearColor(0x000000,0); // CSS navy gradient shows through
    scene.fog=new THREE.Fog(0x0a1c31,34,88); // far units + surrounds haze off, as in the photo
    // Overcast sky dome for reflections. The array is bare galvanised steel and
    // a metal surface is almost entirely its environment — RoomEnvironment (a
    // dim indoor box) made it read as charcoal. This is a bright equirect
    // gradient: white-grey zenith, luminous haze at the horizon, dull roof
    // below. It only lights and reflects; the navy CSS backdrop still shows
    // through, because scene.background stays null.
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

    // ...then upgrade to the real overcast plate once it arrives. The gradient
    // above is the fallback, so a failed or slow load never leaves bare steel
    // reflecting nothing.
    new THREE.TextureLoader().load(SKY,(t)=>{
      t.mapping=THREE.EquirectangularReflectionMapping;
      t.colorSpace=THREE.SRGBColorSpace;
      const env=pm.fromEquirectangular(t).texture;
      if(scene.environment)scene.environment.dispose();
      scene.environment=env;
      scene.background=t;          // proper skybox: it parallaxes as you orbit
      scene.fog.color.setHex(0xc3c8ca); // haze to the horizon, not to navy
      pm.dispose();dirty=true;
    },undefined,()=>{pm.dispose();/* keep the gradient fallback */});
    const camera=new THREE.PerspectiveCamera(46,1,.05,120);
    // the reference is shot under flat overcast: a weak key, a strong sky dome
    // and soft shadows — not the hard sun the enclosed room viewers use
    // Now that the sky plate carries most of the illumination, the key exists
    // mainly to separate the end faces from the side faces — flat ambient made
    // every face the same value and the row read as one slab.
    const sun=new THREE.DirectionalLight(0xfff8ee,1.15);
    sun.position.set(-16,17,13);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.radius=3;
    scene.add(sun,sun.target);
    scene.add(new THREE.HemisphereLight(0xdfe9f4,0x8f9294,.26));

    /* ---------------- model ---------------- */
    const sections=this._sections;
    const walls=[],catMat={};
    const pick=[];
    let dirty=true;
    const buildModel=()=>{
      const root=LMOpenCoolingModel.create(THREE);
      root.traverse(o=>{
        if(!o.isMesh)return;
        o.castShadow=true;o.receiveShadow=true;
        if(isWallNode(o))walls.push(o); // 'Hide walls' clears the white plant wall
        // the array is bare galvanised steel — it needs a real environment
        // contribution to read as metal, so this runs well above the .5 the
        // enclosed room viewers use
        if(o.material&&o.material.envMapIntensity!==undefined){o.material.envMapIntensity=.85;}
        const id=secOfNode(o);
        if(id&&SEC[id]){
          (sections[id]=sections[id]||{meshes:[]}).meshes.push(o);
          o.userData.sec=id;pick.push(o);
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
        sections[id].meshes.forEach(o=>bb.expandByObject(o));
        sections[id].box=bb;sections[id].centre=bb.getCenter(new THREE.Vector3());
        sections[id].size=bb.getSize(new THREE.Vector3()).length();
      });
      scene.add(root);
      // frame on the TOWER ROW, not the model bounds — the rooftop surrounds run
      // far past the row and would pull the centre and the shadow box off target
      const bb=new THREE.Box3();
      IDS.forEach(id=>{if(/^CT/.test(id)&&sections[id])bb.union(sections[id].box);});
      const c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
      C.copy(c);
      const span=Math.max(sz.x,sz.z);
      R_MIN=2.5;
      // Locked standpoint solved from open-updated-1.jpg: the photographer
      // stands on the LOWER roof (eye ~1.5m, which is ~3m under the cell
      // louvres), close in, looking up ~17 deg past the plant band. Aim point
      // is mid-louvre on the gap between cells 1 and 2; heading ~44 deg off
      // the row so cell 1 shows its end face, as in the frame.
      VIEWS.overview.t.set(2.2,4.6,0.4);VIEWS.overview.r=10.8;
      VIEWS.plan.t.copy(c);VIEWS.plan.r=span*1.3;
      R_MAX=VIEWS.overview.r; // zoom-out stops at the photo framing — users can only go closer
      sun.target.position.copy(c);
      sun.shadow.camera.left=-span*.9;sun.shadow.camera.right=span*.9;
      sun.shadow.camera.top=span*.7;sun.shadow.camera.bottom=-span*.4;
      sun.shadow.camera.far=90;
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
      this._applyExplode=(t)=>{
        IDS.forEach(id=>{const sc=sections[id];if(!sc)return;
          const d=sc.centre.clone().sub(C);d.y=0;
          if(d.lengthSq()<1e-6)d.set(0,0,1);
          d.normalize().multiplyScalar(t*span*.4);
          sc.meshes.forEach(o=>{if(!o.userData.p0)o.userData.p0=o.position.clone();o.position.copy(o.userData.p0).add(d);});
        });dirty=true;
      };
      this._loaded=true;dirty=true;
      this._goView(this._view);
      this._sync();
      this._hud.ready();
    };

    /* ---------------- camera rig: free orbit around the room ---------------- */
    const C=new THREE.Vector3(0,1.5,0);
    const VIEWS={
      overview:{t:C.clone(),r:16,th:-0.717,ph:1.862}, // solved from the photo standpoint (below the aim point, looking up)
      row:{t:C.clone(),r:10,th:2.9,ph:1.18},
      plan:{t:C.clone(),r:19,th:2.36,ph:.28}
    };
    let V=VIEWS.overview;
    let target=V.t.clone(),radius=V.r,theta=V.th,phi=V.ph;
    let tGoal=target.clone(),rGoal=radius,thGoal=theta,phGoal=phi,glide=false;
    let R_MIN=3,R_MAX=34;
    const PH_MIN=1.15,PH_MAX=1.95; // lower-roof band: always looking up at the cells, never bird's-eye
    const TH_MIN=-1.15,TH_MAX=-0.15; // orbit window swings around the photo heading along the open +Z side
    this._goView=(v)=>{
      const W=VIEWS[v]||VIEWS.overview;
      tGoal=W.t.clone();rGoal=W.r;thGoal=W.th;phGoal=W.ph;glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;theta=thGoal;phi=phGoal;glide=false;dirty=true;}
    };
    this._goSection=(id)=>{
      const s=sections[id];if(!s)return;
      tGoal=s.centre.clone();
      rGoal=Math.min(R_MAX,Math.max(R_MIN,s.size*1.6));
      thGoal=theta;phGoal=Math.min(1.32,Math.max(.7,phi));glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;phi=phGoal;glide=false;dirty=true;}
    };
    this._lookKey=(k)=>{
      const st=.12;
      if(k==='ArrowLeft'){theta=Math.min(TH_MAX,theta+st);glide=false;dirty=true;return true;}
      if(k==='ArrowRight'){theta=Math.max(TH_MIN,theta-st);glide=false;dirty=true;return true;}
      if(k==='ArrowUp'){phi=Math.max(PH_MIN,phi-st);glide=false;dirty=true;return true;}
      if(k==='ArrowDown'){phi=Math.min(PH_MAX,phi+st);glide=false;dirty=true;return true;}
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
        theta=Math.min(TH_MAX,Math.max(TH_MIN,theta-(e.clientX-px)*.0052));
        phi=Math.min(PH_MAX,Math.max(PH_MIN,phi-(e.clientY-py)*.0042));
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

    const resize=()=>{const w=this.clientWidth||900,h=this.clientHeight||560;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;};
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
        const rr=radius+(1-e)*4;
        camera.position.set(
          target.x+rr*Math.sin(phi)*Math.sin(theta),
          target.y+rr*Math.cos(phi)+.6*(1-e),
          target.z+rr*Math.sin(phi)*Math.cos(theta));
        camera.lookAt(target);
        renderer.render(scene,camera);
      }
    };
    this._tick=tick;
    buildModel(); // synchronous — the camera rig above must exist first
    this._goView('overview');
    tick();
  }
}
if(!customElements.get('lm-opencooling-viewer'))customElements.define('lm-opencooling-viewer',LMOpenCoolingViewer);
})();
