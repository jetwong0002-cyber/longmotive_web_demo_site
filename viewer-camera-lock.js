/* Longmotive fixed-camera policy for every BIM viewer.
   The procedural viewers keep their own render loops and selection logic; this
   layer owns only the final camera pose. Pointer/wheel/key input therefore
   cannot move the camera, while HUD presets remain smooth and deterministic. */
(function(){
  const VIEW_DEFS=[
    {id:'primary',label:'Primary',title:'Primary reference angle'},
    {id:'upper',label:'Upper',title:'Upper inspection angle'},
    {id:'rear',label:'Rear',title:'Rear inspection angle'}
  ];
  const CAMERA_KEYS=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','1','2','3','4','5','a','b','d','f','g','i','k','l','m','p','r']);

  function debugOf(host){
    const d=host.debugScene||host._dbg||{};
    return {
      camera:d.camera||host._camera,
      renderer:d.renderer||host._renderer,
      scene:d.scene||host._scene,
      root:d.root||(typeof d.getRoot==='function'?d.getRoot():null),
      render:typeof d.render==='function'?d.render:null
    };
  }

  function includePoint(ext,p){
    ext.min.x=Math.min(ext.min.x,p.x);ext.min.y=Math.min(ext.min.y,p.y);ext.min.z=Math.min(ext.min.z,p.z);
    ext.max.x=Math.max(ext.max.x,p.x);ext.max.y=Math.max(ext.max.y,p.y);ext.max.z=Math.max(ext.max.z,p.z);
    ext.count++;
  }

  function sectionBounds(host,ext){
    const sections=host._sections||{};
    Object.values(sections).forEach(section=>{
      const box=section?.box;
      if(box?.min&&box?.max){includePoint(ext,box.min);includePoint(ext,box.max);}
    });
  }

  function meshBounds(root,ext,skipContext){
    if(!root?.traverse)return;
    root.updateMatrixWorld?.(true);
    root.traverse(object=>{
      if(!object.isMesh||!object.geometry)return;
      const name=String(object.name||'');
      if(skipContext&&/(ground|floor|roof|wall|ceiling|sky|context|background|slab|parapet)/i.test(name))return;
      const geometry=object.geometry;
      if(!geometry.boundingBox)geometry.computeBoundingBox?.();
      const box=geometry.boundingBox;if(!box)return;
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const point=box.min.clone().set(x,y,z).applyMatrix4(object.matrixWorld);
        includePoint(ext,point);
      }
    });
  }

  function modelCentre(host,debug,camera){
    const fresh=()=>({min:{x:Infinity,y:Infinity,z:Infinity},max:{x:-Infinity,y:-Infinity,z:-Infinity},count:0});
    let ext=fresh();sectionBounds(host,ext);
    if(!ext.count){meshBounds(debug.root||debug.scene,ext,true);}
    if(!ext.count){ext=fresh();meshBounds(debug.root||debug.scene,ext,false);}
    const centre=camera.position.clone();
    if(ext.count){
      centre.set((ext.min.x+ext.max.x)/2,(ext.min.y+ext.max.y)/2,(ext.min.z+ext.max.z)/2);
      return centre;
    }
    const forward=camera.position.clone().set(0,0,-1).applyQuaternion(camera.quaternion);
    return centre.addScaledVector(forward,Math.max(4,camera.position.length()*.35));
  }

  function poseLookingAt(camera,position,target){
    const oldPosition=camera.position.clone(),oldQuaternion=camera.quaternion.clone();
    camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld(true);
    const pose={position:position.clone(),quaternion:camera.quaternion.clone()};
    camera.position.copy(oldPosition);camera.quaternion.copy(oldQuaternion);camera.updateMatrixWorld(true);
    return pose;
  }

  function buildPoses(host,debug){
    const camera=debug.camera,centre=modelCentre(host,debug,camera);
    const primary={position:camera.position.clone(),quaternion:camera.quaternion.clone()};
    const offset=primary.position.clone().sub(centre);
    let distance=Math.max(offset.length(),1);
    let horizontal=Math.hypot(offset.x,offset.z);
    if(horizontal<.001){offset.x=distance*.7;offset.z=distance*.7;horizontal=Math.hypot(offset.x,offset.z);}
    const ux=offset.x/horizontal,uz=offset.z/horizontal;
    const upperPosition=centre.clone().add(camera.position.clone().set(ux*distance*.70,distance*.72,uz*distance*.70));
    const rearPosition=centre.clone().add(camera.position.clone().set(-ux*distance,offset.y,-uz*distance));
    return {
      primary,
      upper:poseLookingAt(camera,upperPosition,centre),
      rear:poseLookingAt(camera,rearPosition,centre)
    };
  }

  function installButtons(host,select){
    const sh=host.shadowRoot;if(!sh)return [];
    sh.querySelectorAll('.explode').forEach(node=>node.remove());
    sh.querySelectorAll('.vplan,.viso,[class*="v-"]').forEach(node=>node.remove());
    if(host._vChips)Object.values(host._vChips).forEach(node=>node?.remove());
    const bar=sh.querySelector('.topbar')||sh.querySelector('.bar');
    if(!bar)return [];
    const anchor=bar.querySelector('.spacer');
    const rooftop=bar.classList.contains('bar');
    const buttons=VIEW_DEFS.map(view=>{
      const button=document.createElement('button');
      button.type='button';button.className=rooftop?'chip':'btn';
      button.textContent=view.label;button.title=view.title;
      button.dataset.cameraView=view.id;
      button.addEventListener('click',event=>{event.stopImmediatePropagation();select(view.id);});
      bar.insertBefore(button,anchor||null);
      return button;
    });
    return buttons;
  }

  function installInputGuard(host,select){
    const sh=host.shadowRoot;if(!sh)return;
    let pointerDown=false;
    sh.addEventListener('pointerdown',event=>{if(event.composedPath().some(node=>node?.tagName==='CANVAS'))pointerDown=true;},{capture:true});
    sh.addEventListener('pointerup',()=>{pointerDown=false;},{capture:true});
    sh.addEventListener('pointercancel',()=>{pointerDown=false;},{capture:true});
    sh.addEventListener('pointermove',event=>{if(pointerDown)event.stopImmediatePropagation();},{capture:true});
    sh.addEventListener('wheel',event=>{
      if(event.composedPath().some(node=>node?.tagName==='CANVAS')){event.preventDefault();event.stopImmediatePropagation();}
    },{capture:true,passive:false});
    sh.addEventListener('keydown',event=>{
      if(CAMERA_KEYS.has(event.key)||CAMERA_KEYS.has(event.key.toLowerCase())){event.preventDefault();event.stopImmediatePropagation();}
    },{capture:true});
    const reset=sh.querySelector('.reset');
    reset?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();select('primary');},{capture:true});
  }

  function install(host,debug){
    if(host.dataset.cameraPolicy==='locked')return;
    const poses=buildPoses(host,debug),camera=debug.camera;
    let active='primary',desired=poses.primary;
    let shownPosition=camera.position.clone(),shownQuaternion=camera.quaternion.clone();
    let last=performance.now();
    const select=id=>{
      active=poses[id]?id:'primary';desired=poses[active];
      buttons.forEach(button=>button.classList.toggle('on',button.dataset.cameraView===active));
      host.dataset.cameraView=active;
    };
    const buttons=installButtons(host,select);
    if(buttons.length!==VIEW_DEFS.length)return;
    installInputGuard(host,select);
    host.dataset.cameraPolicy='locked';
    host.dataset.cameraView='primary';
    Object.defineProperty(host,'cameraPolicy',{value:{camera,select,get active(){return active;}},configurable:true});
    buttons[0].classList.add('on');
    const hint=host.shadowRoot.querySelector('.hint');
    if(hint)hint.innerHTML='Fixed camera · Choose Primary, Upper or Rear in the HUD<br>Component inspection remains available';
    host.shadowRoot.querySelectorAll('canvas').forEach(canvas=>{canvas.style.cursor='default';});

    const frame=now=>{
      if(!host.isConnected)return;
      const dt=Math.min(64,Math.max(0,now-last));last=now;
      const blend=1-Math.exp(-dt/105);
      shownPosition.lerp(desired.position,blend);
      shownQuaternion.slerp(desired.quaternion,blend);
      if(shownPosition.distanceToSquared(desired.position)<1e-8)shownPosition.copy(desired.position);
      if(1-Math.abs(shownQuaternion.dot(desired.quaternion))<1e-8)shownQuaternion.copy(desired.quaternion);
      camera.position.copy(shownPosition);camera.quaternion.copy(shownQuaternion);camera.updateMatrixWorld(true);
      if(debug.render)debug.render();else if(debug.renderer&&debug.scene)debug.renderer.render(debug.scene,camera);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function settleThenInstall(host,debug){
    host.dataset.cameraPolicy='settling';
    const camera=debug.camera,start=performance.now();
    let previousPosition=camera.position.clone(),previousQuaternion=camera.quaternion.clone();
    let stableSamples=0;
    const sample=()=>{
      if(!host.isConnected)return;
      if(document.hidden){setTimeout(sample,120);return;}
      const positionDelta=camera.position.distanceToSquared(previousPosition);
      const rotationDelta=1-Math.abs(camera.quaternion.dot(previousQuaternion));
      const elapsed=performance.now()-start;
      stableSamples=(positionDelta<1e-8&&rotationDelta<1e-10)?stableSamples+1:0;
      previousPosition.copy(camera.position);previousQuaternion.copy(camera.quaternion);
      // Five unchanged samples prove the viewer's own intro/glide has reached
      // its calibrated reference pose. The minimum window prevents a camera
      // that has not rendered its first frame yet from being mistaken as stable.
      if((elapsed>=900&&stableSamples>=5)||elapsed>=6000){
        host.dataset.cameraPolicy='';
        install(host,debug);
        return;
      }
      setTimeout(sample,120);
    };
    setTimeout(sample,120);
  }

  function scan(){
    document.querySelectorAll('*').forEach(host=>{
      if(!host.shadowRoot||host.dataset.cameraPolicy==='locked'||host.dataset.cameraPolicy==='settling')return;
      const debug=debugOf(host);
      const ready=debug.camera&&debug.renderer&&debug.scene;
      const hudReady=host.shadowRoot.querySelector('.wrap.ready,.load.gone')||host._loaded||host._parts;
      if(ready&&hudReady)settleThenInstall(host,debug);
    });
  }
  const observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(scan,250);scan();
})();
