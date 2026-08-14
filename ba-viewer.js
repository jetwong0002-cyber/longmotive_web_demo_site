/* <lm-ba-viewer> — Longmotive BA control room inspector.
   Loads uploads/3d/ba-control-room.glb (Blender-built from site photos: corridor
   between five beige BA/MCC panels + three LV switchgear sections and a facing
   row of five monitoring cabinets, under cable ladders, an orange fire-rated
   tray and a galvanized duct). Raycast hits group by BA_* mesh-name families,
   so a click selects the whole cabinet. Free-orbit room viewer. */
(function(){
const ESM='https://cdn.jsdelivr.net/npm/three@0.160.0';
const GLB='uploads/3d/ba-control-room.glb';
const POSTER='uploads/3d/ba-control-room-hero.png';
const SEC={
  A1:{name:'BA PANEL 1',type:'BA control panel',devices:'Pilot-light grid · meter display · pushbuttons'},
  A2:{name:'BA PANEL 2',type:'BA control panel',devices:'Pilot-light grid · meter display · pushbuttons'},
  S1:{name:'SWITCHGEAR 1',type:'LV switchgear',devices:'Four breaker modules · handle bars · warning labels'},
  S2:{name:'SWITCHGEAR 2',type:'LV switchgear',devices:'Four breaker modules · handle bars · warning labels'},
  S3:{name:'SWITCHGEAR 3',type:'LV switchgear',devices:'Four breaker modules · handle bars · warning labels'},
  S4:{name:'SWITCHGEAR 4',type:'LV switchgear',devices:'Four breaker modules · handle bars · warning labels'},
  S5:{name:'SWITCHGEAR 5',type:'LV switchgear',devices:'Four breaker modules · handle bars · warning labels'},
  S6:{name:'SWITCHGEAR 6',type:'LV switchgear',devices:'Four breaker modules · handle bars · warning labels'},
  U1:{name:'MONITOR CAB 1',type:'Monitoring cabinet',devices:'Blue label · status stickers'},
  U2:{name:'MONITOR CAB 2',type:'Monitoring cabinet',devices:'Blue label · status stickers'},
  U3:{name:'MONITOR CAB 3',type:'Monitoring cabinet',devices:'Blue label · status stickers'},
  U4:{name:'MONITOR CAB 4',type:'Monitoring cabinet',devices:'Blue label · status stickers'},
  U5:{name:'MONITOR CAB 5',type:'Monitoring cabinet',devices:'Blue label · cable bundle entry'},
  U6:{name:'MONITOR CAB 6',type:'Monitoring cabinet',devices:'Blue label · cable bundle entry'},
  U7:{name:'MONITOR CAB 7',type:'Monitoring cabinet',devices:'Blue label · cable bundle entry'},
  U8:{name:'MONITOR CAB 8',type:'Monitoring cabinet',devices:'Blue label · status stickers'},
  U9:{name:'MONITOR CAB 9',type:'Monitoring cabinet',devices:'Blue label · status stickers'},
  U10:{name:'MONITOR CAB 10',type:'Monitoring cabinet',devices:'Ventilation grille · orange status display'},
  TR:{name:'CABLE CONTAINMENT',type:'Ceiling containment',devices:'Galvanized ladders · orange fire-rated tray · conduits · cable drops'},
  DU:{name:'SUPPLY DUCT',type:'Ventilation',devices:'Galvanized duct crossing with joints'}
};
const IDS=Object.keys(SEC);
const MAP=[
  [/^BA_CabA1_/,'A1'],[/^BA_CabA2_/,'A2'],
  [/^BA_CabS1_/,'S1'],[/^BA_CabS2_/,'S2'],[/^BA_CabS3_/,'S3'],[/^BA_CabS4_/,'S4'],[/^BA_CabS5_/,'S5'],[/^BA_CabS6_/,'S6'],
  [/^BA_CabU10_/,'U10'],
  [/^BA_CabU1_/,'U1'],[/^BA_CabU2_/,'U2'],[/^BA_CabU3_/,'U3'],[/^BA_CabU4_/,'U4'],[/^BA_CabU5_/,'U5'],
  [/^BA_CabU6_/,'U6'],[/^BA_CabU7_/,'U7'],[/^BA_CabU8_/,'U8'],[/^BA_CabU9_/,'U9'],
  [/^BA_Tray_/,'TR'],
  [/^BA_Duct_/,'DU']
];
const HUDCFG={views:[], // locked to the corridor view — Reset re-frames it, no other views offered
  walls:true,colour:true,explode:false,poster:POSTER,loadingLabel:'Loading BA control room',
  hint:'Drag orbit &#183; Scroll zoom<br>R reset &#183; W walls &#183; C colour &#183; Esc deselect'};
const ARIA='Interactive 3D model of the BA control room corridor. Drag or use arrow keys to look around, scroll to zoom in. Click a cabinet to inspect it. Press R to reset the view, Escape to deselect.';
const secOf=(n)=>{for(const[m,id]of MAP)if(m.test(n))return id;return null;};
const secOfNode=(o)=>{for(let n=o;n;n=n.parent){const id=secOf(n.name||'');if(id)return id;}return null;};
const isWallNode=(o)=>{for(let n=o;n;n=n.parent){if(/Wall|Skirt/.test(n.name||''))return true;}return false;};

class LMBaViewer extends HTMLElement{
  connectedCallback(){
    if(this._built)return;this._built=true;
    const sh=this.attachShadow({mode:'open'});
    sh.innerHTML=LMHUD.markup(HUDCFG);
    this._reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._view='corridor';this._hover=null;this._sel=null;this._sections={}; // the corridor perspective is this room's signature view
    this.setAttribute('tabindex','0');this.setAttribute('role','application');
    this.setAttribute('aria-label',ARIA);
    this.addEventListener('keydown',this._onKey);
    this.addEventListener('pointerenter',()=>this.focus({preventScroll:true}));
    this._hud=LMHUD.attach(this,sh,HUDCFG,{
      sections:this._sections,order:IDS,SEC,
      onView:(v)=>this._setView(v),
      onReset:()=>{if(this._select)this._select(null);this._setView('corridor');},
      onSelect:(id)=>{if(this._select)this._select(id);},
      onHover:(id)=>{if(this._applyHover)this._applyHover(id);},
      onVisibility:(fn)=>{if(this._applyVis)this._applyVis(fn);},
      onWalls:(off)=>{if(this._applyWalls)this._applyWalls(off);},
      onColour:(on)=>{if(this._applyColour)this._applyColour(on);},
      onExplode:(t)=>{if(this._applyExplode)this._applyExplode(t);}
    });
    const start=()=>{
      if(this._started)return;this._started=true;
      Promise.all([import(ESM+'/+esm'),import(ESM+'/examples/jsm/loaders/GLTFLoader.js/+esm'),import(ESM+'/examples/jsm/environments/RoomEnvironment.js/+esm')])
        .then(([T,GL,RE])=>{try{this._init(T,GL.GLTFLoader,RE.RoomEnvironment);}catch(e){this._fallback(e);}})
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
    console.error('BA viewer:',e);
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
  _init(THREE,GLTFLoader,RoomEnvironment){
    const cv=this.shadowRoot.querySelector('canvas');
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.7; // graded darker to match the room's photo mood
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();
    scene.background=null;renderer.setClearColor(0x000000,0); // CSS navy gradient shows through
    scene.fog=new THREE.Fog(0x0a1c31,30,70);
    const pm=new THREE.PMREMGenerator(renderer);
    scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();
    const camera=new THREE.PerspectiveCamera(46,1,.05,120); // wider lens — the corridor needs it
    const sun=new THREE.DirectionalLight(0xffffff,.35); // battens carry this room, not the sun
    sun.position.set(-6,12,8);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;
    scene.add(sun,sun.target);
    scene.add(new THREE.AmbientLight(0xdfe6ec,.12));

    /* ---------------- model ---------------- */
    const sections=this._sections;
    const walls=[],shell=[],catMat={};
    const pick=[];
    let dirty=true;
    new GLTFLoader().load(GLB,(gltf)=>{
      const root=gltf.scene;
      const strips=[];
      root.traverse(o=>{
        if(!o.isMesh)return;
        o.castShadow=true;o.receiveShadow=true;
        // ceiling + far wall stay up in the corridor view (the photo's black ceiling is
        // part of the room's look) and drop away for the dollhouse overview/plan
        if(o.name==='BA_Ceil'||o.name==='BA_Wall_Far'){shell.push(o);return;}
        if(/^BA_LightStrip/.test(o.name))strips.push(o);
        if(isWallNode(o))walls.push(o);
        if(o.material&&o.material.envMapIntensity!==undefined){o.material.envMapIntensity=o.name==='BA_Floor'?.8:.3;} // glossy epoxy floor, everything else muted
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
      // lit light strips: glow + real light pools beneath them
      strips.forEach(o=>{
        if(o.material&&o.material.emissive){o.material.emissive.setHex(0xffffff);o.material.emissiveIntensity=2.2;o.material.toneMapped=false;}
        const lb=new THREE.Box3().setFromObject(o),lc=lb.getCenter(new THREE.Vector3());
        const p=new THREE.PointLight(0xeef4ff,10,0,2);
        p.position.copy(lc);p.position.y-=.55; // well below the tubes so the ceiling stays dark and the pools land on the floor
        scene.add(p);
      });
      // frame the WHOLE room from its real bounds — never trust hardcoded dims
      const bb=new THREE.Box3().setFromObject(root);
      const c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
      C.copy(c);
      const span=Math.max(sz.x,sz.z);
      R_MIN=span*.18;R_MAX=span*1.9;
      VIEWS.overview.t.copy(c);VIEWS.overview.r=span*1.55;
      VIEWS.plan.t.copy(c);VIEWS.plan.r=span*1.3;
      // corridor view: aim between the two cabinet rows at eye height
      const ra=new THREE.Box3(),ru=new THREE.Box3();
      ['A1','A2','S1','S2','S3','S4','S5','S6'].forEach(id=>{if(sections[id])ra.union(sections[id].box);});
      ['U1','U2','U3','U4','U5','U6','U7','U8','U9','U10'].forEach(id=>{if(sections[id])ru.union(sections[id].box);});
      if(!ra.isEmpty()&&!ru.isEmpty()){
        const ca=ra.getCenter(new THREE.Vector3()),cu=ru.getCenter(new THREE.Vector3());
        // aim at the far end of the aisle at eye height, camera pulled back to the
        // open end, almost axial — matches the reference-photo perspective
        VIEWS.corridor.t.set(Math.min(ra.min.x,ru.min.x)+.9,1.3,(ca.z+cu.z)/2);
        VIEWS.corridor.r=span*.88;
      }
      R_MAX=VIEWS.corridor.r; // zoom-out stops at the corridor framing — users can only go closer
      // Interior volume the lens is confined to while the room still has its
      // shell on. Inset off the real bounds so the camera stops just short of
      // the wall face, and kept above waist height so it never dips under the
      // floor slab.
      ROOM=bb.clone().expandByScalar(-.45);
      ROOM.min.y=bb.min.y+1.0;ROOM.max.y=bb.max.y-.35;
      sun.target.position.copy(c);
      sun.shadow.camera.left=-span*.8;sun.shadow.camera.right=span*.8;
      sun.shadow.camera.top=span*.8;sun.shadow.camera.bottom=-span*.5;
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
    },(e)=>{
      if(e.total&&this._hud)this._hud.progress(e.loaded/e.total*100);
    },(err)=>this._fallback(err));

    /* ---------------- camera rig: free orbit around the room ---------------- */
    const C=new THREE.Vector3(0,1.5,0);
    const VIEWS={
      overview:{t:C.clone(),r:16,th:2.36,ph:1.08},
      corridor:{t:C.clone(),r:10,th:1.55,ph:1.52},
      plan:{t:C.clone(),r:19,th:2.36,ph:.28}
    };
    let V=VIEWS.corridor;
    let target=V.t.clone(),radius=V.r,theta=V.th,phi=V.ph;
    let tGoal=target.clone(),rGoal=radius,thGoal=theta,phGoal=phi,glide=false;
    let R_MIN=3,R_MAX=34;
    const PH_MIN=.88,PH_MAX=1.53; // near-horizontal allowed — the corridor reads best at eye height (Plan button still works)
    /* The room is LONG in x (11.3 m) and SHALLOW in z (4.5 m), so the usable
       orbit is narrow: swing towards z and the lens runs out of room in under
       2 m and ends up pressed against the wall staring at it. Solved against the
       real bounds (target ~(0.75,-2.1), interior x to 10.70, z -3.90..-0.30):
       usable depth is min(9.95/sin th, 1.80/|cos th|), so 1.52..1.95 holds
       4.9-10.0 m at every angle. Wider is still inside the room but not worth
       having — at 2.10 the lens is pinned to the back wall.
       The OLD window was 1.52..3.25, 99 deg, and put the lens 7 m OUTSIDE the
       far wall at its top end. Only that end was wrong; the bottom is unchanged.
       Wider window once the shell is hidden: `overview` and `plan` are meant to
       be read from outside, and their own theta (2.36) sits beyond the corridor
       window, so clamping them to it would jerk the camera on the first drag. */
    // 1.52 is the original lower bound and stays: below it the lens swings past
    // the open side of the model and half the frame is empty background.
    const TH_IN=[1.52,1.95],TH_OUT=[1.20,3.40];
    const thR=()=>(shell.length&&shell[0].visible)?TH_IN:TH_OUT;
    const clampTh=(v)=>{const r=thR();return Math.min(r[1],Math.max(r[0],v));};

    /* The theta window alone did NOT keep the lens inside — orbiting carried it
       straight through a wall and looked back in from outside, because the
       radius is free and _goSection moves the target as well. So the room is
       enforced geometrically instead: shorten the orbit radius to whatever
       distance the ray from the target can run before it leaves ROOM. Confining
       rather than fencing theta harder keeps the whole corridor sweep intact.

       Only while the shell is up. `overview` and `plan` hide it on purpose and
       are meant to be read from outside — there is no wall to be behind. */
    let ROOM=null;
    const confine=(pos)=>{
      if(!ROOM||!shell.length||!shell[0].visible)return pos;
      const d=pos.clone().sub(target),len=d.length();
      if(len<1e-4)return pos;
      d.divideScalar(len);
      let t=len;
      for(const ax of ['x','y','z']){
        if(Math.abs(d[ax])<1e-6)continue;
        const hit=((d[ax]>0?ROOM.max[ax]:ROOM.min[ax])-target[ax])/d[ax];
        if(hit>0)t=Math.min(t,hit);       // hit<=0 means the target is already
      }                                    // outside on this axis: nothing to clamp
      return pos.copy(target).addScaledVector(d,Math.max(.6,t));
    };
    this._goView=(v)=>{
      const W=VIEWS[v]||VIEWS.corridor;
      shell.forEach(o=>{o.visible=v==='corridor';});
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
      if(k==='ArrowLeft'){theta=clampTh(theta+st);glide=false;dirty=true;return true;}
      if(k==='ArrowRight'){theta=clampTh(theta-st);glide=false;dirty=true;return true;}
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
        theta=clampTh(theta-(e.clientX-px)*.0052);
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
        confine(camera.position);
        camera.lookAt(target);
        renderer.render(scene,camera);
      }
    };
    this._tick=tick;
    this._goView('corridor');
    tick();
  }
}
if(!customElements.get('lm-ba-viewer'))customElements.define('lm-ba-viewer',LMBaViewer);
})();
