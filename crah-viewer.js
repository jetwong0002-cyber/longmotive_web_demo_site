/* <lm-crah-viewer> — Longmotive CRAH-room inspector.
   Loads the real BIM export uploads/3d/crah-room.glb (CRAH gallery: 4 computer-room
   air handlers, 3 CHW riser pairs with labels, ceiling mains, cable tray & conduits).
   Raycast hits group by CRAH_* mesh-name families, so a click selects the whole
   item. Free-orbit room viewer. */
(function(){
const ESM='https://cdn.jsdelivr.net/npm/three@0.160.0';
const GLB='uploads/3d/crah-room.glb';
const POSTER='uploads/3d/crah-room-hero.png';
const SEC={
  U1:{name:'CRAH UNIT 1',type:'Computer-room air handler',devices:'Fan-wall unit · control screen'},
  U2:{name:'CRAH UNIT 2',type:'Computer-room air handler',devices:'Fan-wall unit · control screen'},
  U3:{name:'CRAH UNIT 3',type:'Computer-room air handler',devices:'Fan-wall unit · control screen'},
  U4:{name:'CRAH UNIT 4',type:'Computer-room air handler',devices:'Fan-wall unit · control screen'},
  R1:{name:'RISER PAIR 1',type:'CHW supply & return risers',devices:'Insulated CHWS / CHWR drops'},
  R2:{name:'RISER PAIR 2',type:'CHW supply & return risers',devices:'Insulated CHWS / CHWR drops'},
  R3:{name:'RISER PAIR 3',type:'CHW supply & return risers',devices:'Insulated CHWS / CHWR drops'},
  PM:{name:'CEILING MAINS',type:'Overhead CHW distribution',devices:'Insulated supply & return mains'},
  CT:{name:'CABLE TRAY',type:'Containment & wiring',devices:'Tray run with conduit drops'}
};
const IDS=Object.keys(SEC);
const MAP=[
  [/^CRAH_Unit1_/,'U1'],
  [/^CRAH_Unit2_/,'U2'],
  [/^CRAH_Unit3_/,'U3'],
  [/^CRAH_Unit4_/,'U4'],
  [/^CRAH_(Riser1|Txt0)/,'R1'],
  [/^CRAH_(Riser2|Txt1)/,'R2'],
  [/^CRAH_(Riser3|Txt2)/,'R3'],
  [/^CRAH_CeilingMains/,'PM'],
  [/^CRAH_(CableTray|Conduits)/,'CT']
];
const HUDCFG={views:[], // locked to the poster standpoint — Reset re-frames it, no other views offered
  walls:true,colour:true,explode:false,poster:POSTER,loadingLabel:'Loading CRAH room',
  hint:'Drag orbit &#183; Scroll zoom<br>R reset &#183; W walls &#183; C colour &#183; Esc deselect'};
const ARIA='Interactive 3D model of the CRAH room. Drag or use arrow keys to look around, scroll to zoom in. Click equipment to inspect it. Press R to reset the view, Escape to deselect.';
const secOf=(n)=>{for(const[m,id]of MAP)if(m.test(n))return id;return null;};
const secOfNode=(o)=>{for(let n=o;n;n=n.parent){const id=secOf(n.name||'');if(id)return id;}return null;};
const isWallNode=(o)=>{for(let n=o;n;n=n.parent){if(/Wall|Skirt/.test(n.name||''))return true;}return false;};

class LMCrahViewer extends HTMLElement{
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
    console.error('CRAH viewer:',e);
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
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();
    scene.background=null;renderer.setClearColor(0x000000,0); // CSS navy gradient shows through
    scene.fog=new THREE.Fog(0x0a1c31,30,70);
    const pm=new THREE.PMREMGenerator(renderer);
    scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();
    const camera=new THREE.PerspectiveCamera(42,1,.05,120);
    const sun=new THREE.DirectionalLight(0xffffff,.95);
    sun.position.set(-6,12,8);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;
    scene.add(sun,sun.target);
    scene.add(new THREE.AmbientLight(0xdfe6ec,.25));

    /* ---------------- model ---------------- */
    const sections=this._sections;
    const walls=[],catMat={};
    const pick=[];
    let dirty=true;
    new GLTFLoader().load(GLB,(gltf)=>{
      const root=gltf.scene;
      root.traverse(o=>{
        if(!o.isMesh)return;
        o.castShadow=true;o.receiveShadow=true;
        // CRAH_Ceil stays VISIBLE here — the locked poster view looks down the aisle and the ceiling is in frame
        if(isWallNode(o))walls.push(o);
        if(o.material&&o.material.envMapIntensity!==undefined){o.material.envMapIntensity=.5;}
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
      // lit light strips: make the tubes glow + drop real light pools beneath them
      const lm=root.getObjectByName('CRAH_Lights');
      if(lm){
        let found=false;
        lm.traverse(o=>{ if(o.isMesh&&o.material&&o.material.emissive&&/LightTube/.test(o.material.name||'')){o.material.emissive.setHex(0xffffff);o.material.emissiveIntensity=2.2;o.material.toneMapped=false;found=true;} });
        if(!found)lm.traverse(o=>{ if(o.isMesh&&o.material&&o.material.emissive){o.material.emissive.setHex(0xffffff);o.material.emissiveIntensity=1.6;} });
        const lb=new THREE.Box3().setFromObject(lm),lc=lb.getCenter(new THREE.Vector3()),ls=lb.getSize(new THREE.Vector3());
        const ax=ls.x>=ls.z?'x':'z',n=3;
        for(let i=0;i<n;i++){
          const p=new THREE.PointLight(0xf2f6ff,22,0,2);
          p.position.copy(lc);p.position[ax]=lb.min[ax]+ls[ax]*(i+.5)/n;p.position.y=lc.y-.12;
          scene.add(p);
        }
      }
      const bb=new THREE.Box3().setFromObject(root);
      const c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
      C.copy(c);
      const span=Math.max(sz.x,sz.z);
      // fill enclosure: the GLB has only the back wall — close the open -z side, both aisle ends,
      // and cap floor/ceiling strips so the locked frame never shows the navy gradient
      {
        const wallMat=new THREE.MeshStandardMaterial({color:0x6b6f73,roughness:.94,metalness:.02});
        const endMat =new THREE.MeshStandardMaterial({color:0x64686c,roughness:.94,metalness:.02});
        const mk=(w,h,mat,name)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.name=name;m.receiveShadow=true;walls.push(m);scene.add(m);return m;};
        const fw=mk(sz.x+16,sz.y+3,wallMat,'CRAH_FillWallF');
        fw.position.set(c.x,bb.min.y+sz.y/2,bb.min.z-.8);
        const nw=mk(sz.z+16,sz.y+3,endMat,'CRAH_FillWallN');
        nw.position.set(bb.min.x-.8,bb.min.y+sz.y/2,c.z);nw.rotation.y=Math.PI/2;
        const ew=mk(sz.z+16,sz.y+3,endMat,'CRAH_FillWallE');
        ew.position.set(bb.max.x+2.5,bb.min.y+sz.y/2,c.z);ew.rotation.y=-Math.PI/2; // 2.5m out — the locked camera stands in this bay
        const fx=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:0xcfd4d8,roughness:.85,metalness:.02}));
        fx.name='CRAH_FillFloor';fx.rotation.x=-Math.PI/2;fx.position.set(c.x,bb.min.y-.01,c.z);fx.receiveShadow=true;scene.add(fx);
        const cx=new THREE.Mesh(new THREE.PlaneGeometry(sz.x+16,sz.z+16),new THREE.MeshStandardMaterial({color:0x0a0c0e,roughness:.95,metalness:0}));
        cx.name='CRAH_FillCeil';cx.rotation.x=Math.PI/2;cx.position.set(c.x,bb.max.y+.02,c.z);cx.receiveShadow=true;scene.add(cx);
      }
      R_MIN=span*.18;
      // locked standpoint = the poster render (uploads/3d/crah-room-hero.png): eye level at the aisle's
      // far end looking back down the riser row; solved via _room-lock.html harness
      VIEWS.overview.t.set(4,1.55,-1.9);VIEWS.overview.r=9.8;
      R_MAX=VIEWS.overview.r; // zoom-out stops at the poster framing — users can only go closer
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

    /* ---------------- camera rig: locked to the poster standpoint ---------------- */
    const C=new THREE.Vector3(0,1.5,0);
    const VIEWS={
      overview:{t:new THREE.Vector3(4,1.55,-1.9),r:9.8,th:1.724,ph:1.53}
    };
    let V=VIEWS.overview;
    let target=V.t.clone(),radius=V.r,theta=V.th,phi=V.ph;
    let tGoal=target.clone(),rGoal=radius,thGoal=theta,phGoal=phi,glide=false;
    let R_MIN=3,R_MAX=9.8;
    const PH_MIN=1.40,PH_MAX=1.58; // stay at eye level — no rising above the poster horizon
    const TH_MIN=1.60,TH_MAX=1.90; // small look-around window down the riser aisle
    this._goView=(v)=>{
      const W=VIEWS[v]||VIEWS.overview;
      tGoal=W.t.clone();rGoal=W.r;thGoal=W.th;phGoal=W.ph;glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;theta=thGoal;phi=phGoal;glide=false;dirty=true;}
    };
    this._goSection=(id)=>{
      const s=sections[id];if(!s)return;
      tGoal=s.centre.clone();
      rGoal=Math.min(R_MAX,Math.max(R_MIN,s.size*1.6));
      thGoal=theta;phGoal=Math.min(PH_MAX,Math.max(PH_MIN,phi));glide=true; // keep phi inside the locked window — never swing off the poster tilt
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
    this._goView('overview');
    tick();
  }
}
if(!customElements.get('lm-crah-viewer'))customElements.define('lm-crah-viewer',LMCrahViewer);
})();
