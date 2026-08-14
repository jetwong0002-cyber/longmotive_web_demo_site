/* <lm-chilledtank-viewer> — photo-locked procedural outdoor chilled-water
   storage tank yard. Heading and target stay fixed; users may only dolly in
   from the source framing. There is deliberately no explode implementation. */
(function(){
'use strict';
const ESM='https://cdn.jsdelivr.net/npm/three@0.160.0';
const SEC={
  T1:{name:'STORAGE TANK 1',type:'Thermal storage',devices:'Ribbed shell · manway · ladder · safety cage · crown guardrail'},
  T2:{name:'STORAGE TANK 2',type:'Thermal storage',devices:'Ribbed shell · manway · ladder · safety cage · crown guardrail'},
  T3:{name:'STORAGE TANK 3',type:'Thermal storage',devices:'Ribbed shell · manway · ladder · safety cage · crown guardrail'},
  T4:{name:'STORAGE TANK 4',type:'Thermal storage',devices:'Ribbed shell · manway · ladder · safety cage · crown guardrail'},
  T5:{name:'STORAGE TANK 5',type:'Thermal storage',devices:'Ribbed shell · manway · ladder · safety cage · crown guardrail'},
  T6:{name:'STORAGE TANK 6',type:'Thermal storage',devices:'Ribbed shell · manway · ladder · safety cage · crown guardrail'},
  T7:{name:'STORAGE TANK 7',type:'Thermal storage',devices:'Ribbed shell · manway · ladder · safety cage · crown guardrail'},
  MF:{name:'VALVE MANIFOLD',type:'Mechanical distribution',devices:'Vessel bank · branch valves · gauges · supply and return headers'},
  FC:{name:'DATA-CENTRE FAÇADE',type:'Building envelope',devices:'Concrete panels · recessed bays · joints · service canopy'},
  YD:{name:'YARD & ACCESS',type:'External works',devices:'Paving · drainage · fence · lighting · bollards · bins'}
};
const IDS=Object.keys(SEC);
const MAP=[
  [/^CW_Tank1_/,'T1'],[/^CW_Tank2_/,'T2'],[/^CW_Tank3_/,'T3'],[/^CW_Tank4_/,'T4'],
  [/^CW_Tank5_/,'T5'],[/^CW_Tank6_/,'T6'],[/^CW_Tank7_/,'T7'],
  [/^CW_Manifold_/,'MF'],[/^CW_Facade_/,'FC'],[/^CW_Yard_/,'YD']
];
const HUDCFG={
  views:[],walls:true,colour:true,explode:false,poster:'',loadingLabel:'Building chilled-water tank yard',
  hint:'Reference view &#183; Drag for a small look-around &#183; Scroll zoom<br>R reset &#183; W walls &#183; C colour &#183; Esc deselect'
};
const ARIA='Procedural 3D replica of seven outdoor chilled-water storage tanks beside a data-centre façade. The photographed angle is locked to a small four-degree look-around. Drag to look slightly, scroll or use Arrow Up and Arrow Down to zoom in, and click an assembly to inspect it.';
const secOf=(n)=>{for(const [re,id] of MAP)if(re.test(n))return id;return null;};
const secOfNode=(o)=>{for(let n=o;n;n=n.parent){const id=secOf(n.name||'');if(id)return id;}return null;};
const isWallNode=(o)=>{for(let n=o;n;n=n.parent)if(/^CW_Facade_/.test(n.name||''))return true;return false;};

class LMChilledTankViewer extends HTMLElement{
  connectedCallback(){
    if(this._built)return;this._built=true;
    const sh=this.attachShadow({mode:'open'});sh.innerHTML=LMHUD.markup(HUDCFG);
    this._reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._view='overview';this._hover=null;this._sel=null;this._sections={};
    this.setAttribute('tabindex','0');this.setAttribute('role','application');this.setAttribute('aria-label',ARIA);
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
      import(ESM+'/+esm').then(T=>{try{this._init(T);}catch(e){this._fallback(e);}}).catch(e=>this._fallback(e));
    };
    setTimeout(start,50);
    this._visOb=new IntersectionObserver(es=>es.forEach(e=>{this._onScreen=e.isIntersecting;if(e.isIntersecting){start();this._resume();}}),{rootMargin:'240px'});
    this._visOb.observe(this);
  }
  _resume(){if(this._tick&&!this._raf)this._tick();}
  disconnectedCallback(){
    if(this._visOb){this._visOb.disconnect();this._visOb=null;}
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}
    if(this._dispose)this._dispose();this._built=false;this._started=false;
  }
  _fallback(e){console.error('Chilled tank viewer:',e);if(this._hud)this._hud.fail();}
  _onKey=(e)=>{
    const k=e.key;
    if(k==='Escape'||k==='0'){if(this._select)this._select(null);}
    else if(this._lookKey&&this._lookKey(k)){}
    else if(this._hud&&this._hud.key(k)){}
    else return;e.preventDefault();
  };
  _sync(){if(!this._hud)return;const h=this._hud;h.sel=this._sel;h.hover=this._hover;h.view=this._view;h.sync();}
  _setView(v){this._view=v;this._sync();if(this._goView)this._goView(v);}
  _panel(id){if(!this._hud)return;this._hud.setProps(id);this._hud.setTip(id?SEC[id].name:'');}

  _init(THREE){
    const cv=this.shadowRoot.querySelector('canvas');
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:false,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.outputColorSpace=THREE.SRGBColorSpace;

    const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xd5d9dc,33,82);
    // Bright overcast equirectangular sky doubles as background and PBR environment.
    const sky=document.createElement('canvas');sky.width=128;sky.height=512;
    const sg=sky.getContext('2d'),gr=sg.createLinearGradient(0,0,0,512);
    gr.addColorStop(0,'#edf1f5');gr.addColorStop(.28,'#f7f8f9');gr.addColorStop(.50,'#d9dee1');
    gr.addColorStop(.58,'#d7dbda');gr.addColorStop(.76,'#b8bcba');gr.addColorStop(1,'#8c918e');
    sg.fillStyle=gr;sg.fillRect(0,0,128,512);
    const skyTex=new THREE.CanvasTexture(sky);skyTex.mapping=THREE.EquirectangularReflectionMapping;skyTex.colorSpace=THREE.SRGBColorSpace;
    scene.background=skyTex;
    const pm=new THREE.PMREMGenerator(renderer);pm.compileEquirectangularShader();scene.environment=pm.fromEquirectangular(skyTex).texture;pm.dispose();

    const camera=new THREE.PerspectiveCamera(42,1,.08,150);
    const key=new THREE.DirectionalLight(0xfffbf3,1.55);key.position.set(10,20,17);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00025;key.shadow.radius=4;
    key.shadow.camera.left=-27;key.shadow.camera.right=27;key.shadow.camera.top=24;key.shadow.camera.bottom=-13;key.shadow.camera.far=80;
    scene.add(key,key.target);key.target.position.set(-7,5,0);
    scene.add(new THREE.HemisphereLight(0xe9f2fb,0x7a7d78,.82));
    const fill=new THREE.DirectionalLight(0xcbd8e0,.34);fill.position.set(-20,10,10);scene.add(fill);

    const sections=this._sections,walls=[],pick=[],catMat={};let dirty=true;
    // The supplied cloudy-sky photograph is a visual background only. Keep
    // the procedural equirectangular texture as the PBR environment so the
    // BIM materials and lighting remain stable.
    let photoSky=null;
    const fitPhotoSky=()=>{
      if(!photoSky?.image)return;
      const imageAspect=photoSky.image.width/photoSky.image.height;
      const viewAspect=(this.clientWidth||900)/(this.clientHeight||600);
      let repeatX=1,repeatY=1;
      if(viewAspect>imageAspect)repeatY=imageAspect/viewAspect;
      else repeatX=viewAspect/imageAspect;
      photoSky.matrixAutoUpdate=false;
      photoSky.matrix.setUvTransform((1-repeatX)/2,(1-repeatY)/2,repeatX,repeatY,0,.5,.5);
    };
    new THREE.TextureLoader().load(
      'assets/chilled-tank-sky-web/chilled-tank-cloudy-sky-2560w.webp',
      texture=>{
        photoSky=texture;
        photoSky.colorSpace=THREE.SRGBColorSpace;
        photoSky.wrapS=photoSky.wrapT=THREE.ClampToEdgeWrapping;
        fitPhotoSky();
        scene.background=photoSky;
        dirty=true;
      },
      undefined,
      error=>console.warn('Cloudy sky background could not be loaded:',error)
    );
    const root=LMChilledTankModel.create(THREE);
    root.traverse(o=>{
      if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
      if(o.material&&o.material.envMapIntensity!==undefined)o.material.envMapIntensity=.68;
      if(isWallNode(o))walls.push(o);
      const id=secOfNode(o);if(!id||!SEC[id])return;
      (sections[id]=sections[id]||{meshes:[]}).meshes.push(o);o.userData.sec=id;pick.push(o);
    });
    const seen=new Map();
    IDS.forEach(id=>{const s=sections[id];if(!s)return;
      s.meshes.forEach(o=>{const key=id+'|'+o.material.uuid;if(!seen.has(key))seen.set(key,o.material.clone());o.material=seen.get(key);});
      const bb=new THREE.Box3();s.meshes.forEach(o=>bb.expandByObject(o));s.box=bb;s.centre=bb.getCenter(new THREE.Vector3());s.size=bb.getSize(new THREE.Vector3()).length();
    });
    scene.add(root);
    const runtimeMeta=root.userData.sculptRuntime;
    this.dataset.sculptReady=String(!!runtimeMeta);
    this.dataset.sculptComponents=String(runtimeMeta?.components?.length||0);

    this._applyVis=(fn)=>{IDS.forEach(id=>{const s=sections[id];if(s)s.meshes.forEach(o=>{o.visible=fn(id);});});if(this._sel&&!fn(this._sel))this._select(null);dirty=true;};
    this._applyWalls=(off)=>{walls.forEach(o=>{o.visible=!off;});dirty=true;};
    this._applyColour=(on)=>{IDS.forEach(id=>{const s=sections[id];if(!s)return;
      if(!catMat[id])catMat[id]=new THREE.MeshStandardMaterial({color:this._hud.colourOf(id),roughness:.58,metalness:.10});
      s.meshes.forEach(o=>{if(!o.userData.m0)o.userData.m0=o.material;o.material=on?catMat[id]:o.userData.m0;});
    });dirty=true;};

    // Camera values are calibrated for the reference's 500:333 aspect. The
    // target lies between tanks 2–3 so the near shell owns the right-centre and
    // the row converges into the left-middle of the frame.
    const VIEWS={overview:{t:new THREE.Vector3(-6.25,5.05,.36),r:25.65,th:.90,ph:1.665}};
    let V=VIEWS.overview,target=V.t.clone(),radius=V.r,theta=V.th,phi=V.ph;
    let tGoal=target.clone(),rGoal=radius,glide=false;
    const R_MIN=5.2,R_MAX=VIEWS.overview.r;
    const THETA_LIMIT=THREE.MathUtils.degToRad(4),PHI_LIMIT=THREE.MathUtils.degToRad(2);
    const thetaMin=V.th-THETA_LIMIT,thetaMax=V.th+THETA_LIMIT;
    const phiMin=V.ph-PHI_LIMIT,phiMax=V.ph+PHI_LIMIT;
    const clampLook=()=>{theta=THREE.MathUtils.clamp(theta,thetaMin,thetaMax);phi=THREE.MathUtils.clamp(phi,phiMin,phiMax);};
    this._goView=()=>{tGoal=VIEWS.overview.t.clone();rGoal=VIEWS.overview.r;theta=V.th;phi=V.ph;glide=true;
      if(this._reduce){target.copy(tGoal);radius=rGoal;glide=false;dirty=true;}};
    this._lookKey=(k)=>{
      if(k==='ArrowUp'||k==='+'||k==='='){radius=Math.max(R_MIN,radius*.90);glide=false;dirty=true;return true;}
      if(k==='ArrowDown'||k==='-'||k==='_'){radius=Math.min(R_MAX,radius*1.10);glide=false;dirty=true;return true;}
      if(k==='ArrowLeft'||k==='ArrowRight'){theta+=THREE.MathUtils.degToRad(k==='ArrowLeft'?-.6:.6);clampLook();glide=false;dirty=true;return true;}return false;
    };
    let dragging=false,lastX=0,lastY=0,dragMoved=false;
    cv.style.touchAction='none';
    cv.addEventListener('pointerdown',e=>{dragging=true;dragMoved=false;lastX=e.clientX;lastY=e.clientY;glide=false;cv.setPointerCapture(e.pointerId);this._downAt=Date.now();});
    cv.addEventListener('pointerup',e=>{dragging=false;if(cv.hasPointerCapture(e.pointerId))cv.releasePointerCapture(e.pointerId);});
    cv.addEventListener('pointerleave',()=>{this._hoverDirty=false;this._applyHover(null);});
    cv.addEventListener('pointermove',e=>{if(dragging){const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(Math.abs(dx)+Math.abs(dy)>1)dragMoved=true;theta-=dx*.0017;phi+=dy*.00135;clampLook();dirty=true;return;}const r=cv.getBoundingClientRect();this._mx=((e.clientX-r.left)/r.width)*2-1;this._my=-((e.clientY-r.top)/r.height)*2+1;this._hoverDirty=true;});
    cv.addEventListener('wheel',e=>{e.preventDefault();glide=false;radius=Math.min(R_MAX,Math.max(R_MIN,radius*(1+e.deltaY*.0012)));dirty=true;},{passive:false});

    const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
    const tint=(id,intensity)=>{const s=sections[id];if(!s)return;const done=new Set();s.meshes.forEach(o=>{const m=o.material;if(!m.emissive||done.has(m.uuid))return;done.add(m.uuid);
      if(m.userData.e0===undefined){m.userData.e0=m.emissive.getHex();m.userData.ei0=m.emissiveIntensity;}
      if(intensity>0){m.emissive.setHex(0x00b0f0);m.emissiveIntensity=intensity;}else{m.emissive.setHex(m.userData.e0);m.emissiveIntensity=m.userData.ei0;}
    });dirty=true;};
    this._applyHover=(id)=>{if(this._hover===id)return;if(this._hover&&this._hover!==this._sel)tint(this._hover,0);this._hover=id;if(id&&id!==this._sel)tint(id,.17);cv.style.cursor=id?'pointer':'default';if(!this._sel)this._panel(id);this._sync();};
    this._select=(id)=>{if(this._sel)tint(this._sel,0);this._sel=id;if(id){tint(id,.30);this._panel(id);}else{this._panel(this._hover);this._goView('overview');}this._sync();};
    cv.addEventListener('click',()=>{if(dragMoved||Date.now()-(this._downAt||0)>260)return;this._select(this._hover&&this._sel!==this._hover?this._hover:null);});

    const resize=()=>{const w=this.clientWidth||900,h=this.clientHeight||600;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fitPhotoSky();dirty=true;};
    const ro=new ResizeObserver(resize);ro.observe(this);resize();
    this._dispose=()=>{ro.disconnect();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();const mm=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];mm.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)v.dispose();});m.dispose();});});if(scene.environment)scene.environment.dispose();if(photoSky)photoSky.dispose();skyTex.dispose();renderer.dispose();};

    // Read-only QA hook: allows screenshot diagnostics without changing the
    // shipped interaction contract.
    const cameraContract=Object.freeze({
      mode:'reference-locked-orbit',pan:false,zoomOut:false,
      reference:Object.freeze({radius:V.r,theta:V.th,phi:V.ph,target:Object.freeze(V.t.toArray())}),
      orbitLimits:Object.freeze({horizontalDeg:4,verticalDeg:2}),
      radius:Object.freeze({min:R_MIN,max:R_MAX})
    });
    const getCameraState=()=>Object.freeze({
      radius,theta,phi,target:Object.freeze(target.toArray()),
      horizontalOffsetDeg:THREE.MathUtils.radToDeg(theta-V.th),
      verticalOffsetDeg:THREE.MathUtils.radToDeg(phi-V.ph)
    });
    const publishCameraState=()=>{
      const s=getCameraState();
      this.dataset.cameraMode=cameraContract.mode;
      this.dataset.cameraRadius=s.radius.toFixed(4);
      this.dataset.cameraHorizontalDeg=s.horizontalOffsetDeg.toFixed(3);
      this.dataset.cameraVerticalDeg=s.verticalOffsetDeg.toFixed(3);
      this.dataset.cameraMaxRadius=R_MAX.toFixed(4);
    };
    this.debugScene={scene,camera,renderer,root,cameraContract,getCameraState,render:()=>{renderer.render(scene,camera);}};
    publishCameraState();
    const t0=performance.now();
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      if(this._onScreen===false||document.hidden){cancelAnimationFrame(this._raf);this._raf=null;return;}
      const k=this._reduce?1:Math.min(1,(performance.now()-t0)/1400),ease=1-Math.pow(1-k,3);if(k<1)dirty=true;
      if(glide){target.lerp(tGoal,.075);radius+=(rGoal-radius)*.075;dirty=true;if(target.distanceTo(tGoal)<.004&&Math.abs(rGoal-radius)<.008)glide=false;}
      if(this._hoverDirty&&!dragging){this._hoverDirty=false;mv.set(this._mx,this._my);ray.setFromCamera(mv,camera);const hit=ray.intersectObjects(pick,false)[0];this._applyHover(hit?hit.object.userData.sec:null);}
      if(dirty){dirty=false;const rr=radius+(1-ease)*3.0;camera.position.set(target.x+rr*Math.sin(phi)*Math.sin(theta),target.y+rr*Math.cos(phi)+.45*(1-ease),target.z+rr*Math.sin(phi)*Math.cos(theta));camera.lookAt(target);renderer.render(scene,camera);publishCameraState();}
    };
    this._tick=tick;this._loaded=true;this._sync();this._hud.ready();tick();
  }
}

if(!customElements.get('lm-chilledtank-viewer'))customElements.define('lm-chilledtank-viewer',LMChilledTankViewer);
})();
