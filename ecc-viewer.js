/* <lm-ecc-viewer> — fixed-eye, multi-angle ECC monitoring-room BIM viewer. */
(function(){
'use strict';
const ESM='https://cdn.jsdelivr.net/npm/three@0.160.0';
const GLB='uploads/3d/ecc-monitoring-room-90e0ba50.glb';
const SEC={
  VW:{name:'VIDEO WALL',type:'Campus monitoring display',devices:'Dashboard array · CCTV tiles · illuminated frame'},
  D1:{name:'OPERATOR DESK 1',type:'Operator workstation',devices:'Rounded console · monitors · PCs & peripherals'},
  D2:{name:'OPERATOR DESK 2',type:'Operator workstation',devices:'Rounded console · monitors · PCs & peripherals'},
  FC:{name:'FIRE COMMAND',type:'Fire-alarm command elevation',devices:'Red command console · wall display · control equipment'}
};
const IDS=Object.keys(SEC);
const MAP=[[/^ECC_VW_/,'VW'],[/^ECC_(Desk1_|Chair_O|D1_)/,'D1'],[/^ECC_(Desk2_|Chair_B|D2_)/,'D2'],[/^ECC_FC_/,'FC']];
const secOf=n=>{for(const [re,id] of MAP)if(re.test(n||''))return id;return null;};
const secOfNode=o=>{for(let n=o;n;n=n.parent){const id=secOf(n.name);if(id)return id;}return null;};
const HUDCFG={
  views:[{id:'left',label:'Left',key:'l'},{id:'centre',label:'Centre',key:'m'},{id:'right',label:'Right',key:'g'}],
  walls:true,colour:true,explode:false,poster:'',loadingLabel:'Reconstructing ECC room',
  hint:'Fixed position · Drag to turn · Scroll zoom in<br>L/M/G views · R reset · W walls · C colour'
};
const ARIA='Fixed-position 3D BIM viewer of the ECC monitoring room. Use Left, Centre and Right views or drag horizontally to turn between the two photographed elevations.';

class LMEccViewer extends HTMLElement{
  connectedCallback(){
    if(this._built)return;this._built=true;
    const sh=this.attachShadow({mode:'open'});sh.innerHTML=LMHUD.markup(HUDCFG);
    this._sections={};this._sel=null;this._hover=null;this._view='left';
    this.setAttribute('tabindex','0');this.setAttribute('role','application');this.setAttribute('aria-label',ARIA);
    this._hud=LMHUD.attach(this,sh,HUDCFG,{
      sections:this._sections,order:IDS,SEC,
      onView:v=>this._setView(v),onReset:()=>{this._select?.(null);this._setView('left');},
      onSelect:id=>this._select?.(id),onHover:id=>this._applyHover?.(id),onVisibility:fn=>this._applyVis?.(fn),
      onWalls:off=>this._applyWalls?.(off),onColour:on=>this._applyColour?.(on)
    });
    this.addEventListener('keydown',this._onKey);
    const start=()=>{if(this._started)return;this._started=true;Promise.all([
      import(ESM+'/+esm'),import(ESM+'/examples/jsm/loaders/GLTFLoader.js/+esm'),import(ESM+'/examples/jsm/environments/RoomEnvironment.js/+esm')
    ]).then(([T,GL,RE])=>this._init(T,GL.GLTFLoader,RE.RoomEnvironment)).catch(e=>this._fallback(e));};
    setTimeout(start,50);
    this._observer=new IntersectionObserver(es=>es.forEach(e=>{this._onScreen=e.isIntersecting;if(e.isIntersecting){start();this._resume();}}),{rootMargin:'240px'});this._observer.observe(this);
  }
  disconnectedCallback(){this._observer?.disconnect();if(this._raf)cancelAnimationFrame(this._raf);this._dispose?.();}
  _fallback(e){console.error('ECC viewer:',e);this._hud?.fail();}
  _resume(){if(this._tick&&!this._raf)this._tick();}
  _sync(){if(!this._hud)return;this._hud.sel=this._sel;this._hud.hover=this._hover;this._hud.view=this._view;this._hud.sync();}
  _panel(id){this._hud?.setProps(id);this._hud?.setTip(id?SEC[id].name:'');}
  _setView(v){this._view=v;this._goView?.(v);this._sync();}
  _onKey=e=>{const k=e.key;if(k==='Escape'||k==='0')this._select?.(null);else if(this._lookKey?.(k)){}else if(this._hud?.key(k)){}else return;e.preventDefault();};

  _init(THREE,GLTFLoader,RoomEnvironment){
    if(!window.LMEccAugment)throw new Error('LMEccAugment is required before ecc-viewer.js');
    const cv=this.shadowRoot.querySelector('canvas');
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x111619);
    const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.03).texture;pm.dispose();
    const camera=new THREE.PerspectiveCamera(42,1,.05,50);
    scene.add(new THREE.HemisphereLight(0xe8eef0,0x24282a,1.02));
    const key=new THREE.DirectionalLight(0xf1f4f3,1.45);key.position.set(4,8,-3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00035;key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=6;key.shadow.camera.bottom=-3;key.shadow.camera.far=30;scene.add(key,key.target);key.target.position.set(3,1.2,-1.5);
    const practicals=[];for(const x of [.8,2.2,3.8,5.5,7.1]){const l=new THREE.PointLight(0xe7f1f5,1.05,5.5,2);l.position.set(x,2.85,-2.5);scene.add(l);practicals.push(l);}

    const sections=this._sections,pick=[],walls=[],catMat={};let dirty=true,root=null,augment=null;
    new GLTFLoader().load(GLB,gltf=>{
      root=gltf.scene;root.name='ECC_GLBRichSource';
      // Preserve semantically rich source parts while retiring geometry replaced by higher-fidelity augmentation.
      root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;if(/^ECC_(Desk1|Desk2)_Frame$/.test(o.name))o.visible=false;});
      augment=LMEccAugment.create(THREE,{glbRoot:root});scene.add(root,augment);
      const ingest=o=>{
        if(!o.isMesh)return;const id=secOfNode(o);
        if(id){(sections[id]=sections[id]||{meshes:[]}).meshes.push(o);o.userData.sec=id;pick.push(o);}
        if(/^ECC_(Wall|Floor|Ceil|Baffles|Skirt|ARCH_)/.test(o.name||''))walls.push(o);
      };
      root.traverse(ingest);augment.traverse(ingest);
      IDS.forEach(id=>{const s=sections[id];if(!s)return;const bb=new THREE.Box3();s.meshes.forEach(o=>bb.expandByObject(o));s.box=bb;s.centre=bb.getCenter(new THREE.Vector3());s.size=bb.getSize(new THREE.Vector3()).length();});
      this.dataset.sculptReady=String(!!augment.userData.sculptRuntime);this.dataset.sculptComponents=String(augment.userData.sculptRuntime?.components?.length||0);this.dataset.fixedEye='true';
      this._applyVis=fn=>{IDS.forEach(id=>sections[id]?.meshes.forEach(o=>o.visible=fn(id)));if(this._sel&&!fn(this._sel))this._select(null);dirty=true;};
      this._applyWalls=off=>{walls.forEach(o=>o.visible=!off);dirty=true;};
      this._applyColour=on=>{IDS.forEach(id=>{const s=sections[id];if(!s)return;if(!catMat[id])catMat[id]=new THREE.MeshStandardMaterial({color:this._hud.colourOf(id),roughness:.55,metalness:.12});s.meshes.forEach(o=>{if(!o.userData.m0)o.userData.m0=o.material;o.material=on?catMat[id]:o.userData.m0;});});dirty=true;};
      this._loaded=true;this._setView('left');this._hud.ready();dirty=true;
    },e=>{if(e.total)this._hud?.progress(e.loaded/e.total*100);},e=>this._fallback(e));

    /* Fixed photographer eye; only look direction and FOV change. */
    const EYE=new THREE.Vector3(5.25,1.56,-5.38);
    const VIEWS={
      LEFT:{yaw:THREE.MathUtils.degToRad(-9.3),pitch:THREE.MathUtils.degToRad(.2)},
      CENTRE:{yaw:THREE.MathUtils.degToRad(-34.5),pitch:THREE.MathUtils.degToRad(.1)},
      RIGHT:{yaw:THREE.MathUtils.degToRad(-69.5),pitch:THREE.MathUtils.degToRad(-.4)}
    };
    const PITCH_LIMIT=THREE.MathUtils.degToRad(2),YAW_PAD=THREE.MathUtils.degToRad(2.5),REFERENCE_RADIUS=1,R_MAX=REFERENCE_RADIUS;
    const YAW_MIN=VIEWS.RIGHT.yaw-YAW_PAD,YAW_MAX=VIEWS.LEFT.yaw+YAW_PAD,HFOV_MAX=THREE.MathUtils.degToRad(82),ZOOM_MIN=.56;
    let yaw=VIEWS.LEFT.yaw,pitch=VIEWS.LEFT.pitch,yawGoal=yaw,pitchGoal=pitch,zoom=1,glide=false;
    const clamp=()=>{yaw=THREE.MathUtils.clamp(yaw,YAW_MIN,YAW_MAX);pitch=THREE.MathUtils.clamp(pitch,-PITCH_LIMIT,PITCH_LIMIT);zoom=THREE.MathUtils.clamp(zoom,ZOOM_MIN,R_MAX);};
    const publish=()=>{this.dataset.cameraMode='fixed-eye-reference-sweep';this.dataset.view=this._view;this.dataset.yawDeg=THREE.MathUtils.radToDeg(yaw).toFixed(3);this.dataset.pitchDeg=THREE.MathUtils.radToDeg(pitch).toFixed(3);this.dataset.radius=zoom.toFixed(4);this.dataset.radiusMax=R_MAX.toFixed(4);this.dataset.eye=`${EYE.x.toFixed(3)},${EYE.y.toFixed(3)},${EYE.z.toFixed(3)}`;};
    this._goView=v=>{const w=VIEWS[String(v).toUpperCase()]||VIEWS.LEFT;yawGoal=w.yaw;pitchGoal=w.pitch;zoom=1;glide=true;dirty=true;};
    this._lookKey=k=>{if(k==='ArrowLeft'||k==='ArrowRight'){yaw+=THREE.MathUtils.degToRad(k==='ArrowLeft'?-1:1);glide=false;clamp();dirty=true;return true;}if(k==='ArrowUp'||k==='+'||k==='='){zoom*=.9;clamp();dirty=true;return true;}if(k==='ArrowDown'||k==='-'||k==='_'){zoom*=1.1;clamp();dirty=true;return true;}return false;};

    let dragging=false,lastX=0,lastY=0,moved=false;cv.style.touchAction='none';
    cv.addEventListener('pointerdown',e=>{dragging=true;moved=false;glide=false;lastX=e.clientX;lastY=e.clientY;cv.setPointerCapture(e.pointerId);this._downAt=Date.now();});
    cv.addEventListener('pointerup',e=>{dragging=false;if(cv.hasPointerCapture(e.pointerId))cv.releasePointerCapture(e.pointerId);});
    cv.addEventListener('pointerleave',()=>{if(!dragging)this._applyHover?.(null);});
    cv.addEventListener('pointermove',e=>{if(dragging){const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(Math.abs(dx)+Math.abs(dy)>1)moved=true;yaw-=dx*.0032;pitch-=dy*.0015;clamp();dirty=true;return;}const r=cv.getBoundingClientRect();this._mx=(e.clientX-r.left)/r.width*2-1;this._my=-(e.clientY-r.top)/r.height*2+1;this._hoverDirty=true;});
    cv.addEventListener('wheel',e=>{e.preventDefault();zoom*=1+e.deltaY*.001;clamp();dirty=true;},{passive:false});

    const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
    const tint=(id,n)=>{const s=sections[id],done=new Set();s?.meshes.forEach(o=>{const m=o.material;if(!m?.emissive||done.has(m.uuid))return;done.add(m.uuid);if(m.userData.e0===undefined){m.userData.e0=m.emissive.getHex();m.userData.ei0=m.emissiveIntensity;}if(n){m.emissive.setHex(0x00b0f0);m.emissiveIntensity=n;}else{m.emissive.setHex(m.userData.e0);m.emissiveIntensity=m.userData.ei0;}});dirty=true;};
    this._applyHover=id=>{if(this._hover===id)return;if(this._hover&&this._hover!==this._sel)tint(this._hover,0);this._hover=id;if(id&&id!==this._sel)tint(id,.15);cv.style.cursor=id?'pointer':(dragging?'grabbing':'grab');if(!this._sel)this._panel(id);this._sync();};
    this._select=id=>{if(this._sel)tint(this._sel,0);this._sel=id;if(id){tint(id,.28);this._panel(id);}else this._panel(this._hover);this._sync();};
    cv.addEventListener('click',()=>{if(moved||Date.now()-(this._downAt||0)>260)return;this._select(this._hover&&this._sel!==this._hover?this._hover:null);});

    const resize=()=>{const w=this.clientWidth||900,h=this.clientHeight||560;renderer.setSize(w,h,false);camera.aspect=w/h;dirty=true;};const ro=new ResizeObserver(resize);ro.observe(this);resize();
    this._dispose=()=>{ro.disconnect();scene.traverse(o=>{o.geometry?.dispose();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{Object.values(m).forEach(v=>v?.isTexture&&v.dispose());m.dispose();});});renderer.dispose();};
    this.debugScene={scene,camera,renderer,getRoot:()=>root,getAugment:()=>augment,eye:EYE,views:VIEWS,render:()=>renderer.render(scene,camera)};
    const tick=()=>{this._raf=requestAnimationFrame(tick);if(this._onScreen===false||document.hidden){cancelAnimationFrame(this._raf);this._raf=null;return;}if(glide){yaw+=(yawGoal-yaw)*.1;pitch+=(pitchGoal-pitch)*.1;dirty=true;if(Math.abs(yawGoal-yaw)<.0004&&Math.abs(pitchGoal-pitch)<.0004){yaw=yawGoal;pitch=pitchGoal;glide=false;}}if(this._hoverDirty&&!dragging&&pick.length){this._hoverDirty=false;mv.set(this._mx,this._my);ray.setFromCamera(mv,camera);const hit=ray.intersectObjects(pick,false)[0];this._applyHover(hit?hit.object.userData.sec:null);}if(dirty){dirty=false;const hfov=HFOV_MAX*zoom;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(hfov/2)/Math.max(.01,camera.aspect)));camera.updateProjectionMatrix();const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));camera.position.copy(EYE);camera.up.set(0,1,0);camera.lookAt(EYE.clone().add(dir));renderer.render(scene,camera);publish();}};
    this._tick=tick;this._sync();tick();
  }
}
if(!customElements.get('lm-ecc-viewer'))customElements.define('lm-ecc-viewer',LMEccViewer);
})();
