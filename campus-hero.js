/* <lm-campus-hero> — real-time low-poly data-centre campus, scroll-scrubbed.
   API: el.setProgress(p) with p in 0..1 (the Longmotive hero track drives it).
   Phases: piling → foundations → structure → envelope/fit-out → live campus.
   Objects carry {t0,t1} reveal windows and rise from the ground as p advances;
   camera flies a keyframed path; at the end the campus "goes live" (dusk + lit). */
(function(){
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
class LMCampusHero extends HTMLElement{
  connectedCallback(){
    if(this._wired)return;this._wired=true;
    this.style.display='block';
    this._p=0;this._cur=0;
    this._reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.setAttribute('role','img');
    this.setAttribute('aria-label','Animated 3D view of a data-centre campus being built, from piling through to a live, energised campus. Driven by page scroll.');
    const start=()=>{
      if(this._started)return;this._started=true;
      import(THREE_URL).then(T=>{try{this._init(T);}catch(e){console.error('lm-campus-hero failed:',e);}}).catch(e=>console.error('lm-campus-hero load failed:',e));
    };
    this._vis=new IntersectionObserver((es)=>{
      es.forEach(e=>{this._onScreen=e.isIntersecting;if(e.isIntersecting)start();});
    },{rootMargin:'300px'});
    this._vis.observe(this);
  }
  disconnectedCallback(){
    if(this._vis){this._vis.disconnect();this._vis=null;}
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}
    if(this._dispose)this._dispose();
  }
  setProgress(p){this._p=Math.min(1,Math.max(0,p));}
  _init(THREE){
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.domElement.style.cssText='width:100%;height:100%;display:block';
    this.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const dayBg=new THREE.Color(0xd6e2ec),duskBg=new THREE.Color(0x072448); // DS navy --lm-blue-900
    scene.background=dayBg.clone();
    scene.fog=new THREE.Fog(scene.background,90,220);
    const camera=new THREE.PerspectiveCamera(44,1,.1,400);
    const hemi=new THREE.HemisphereLight(0xf4f8fc,0x76829a,.9);scene.add(hemi);
    const key=new THREE.DirectionalLight(0xfff4e4,1.5);
    key.position.set(40,60,25);key.castShadow=true;
    key.shadow.mapSize.set(1536,1536);key.shadow.bias=-0.0006;
    const sc=key.shadow.camera;sc.left=-70;sc.right=70;sc.top=70;sc.bottom=-70;sc.far=180;
    scene.add(key);
    // ---- ground + roads ----
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:0x9aa78f,roughness:1}));
    ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    const site=new THREE.Mesh(new THREE.PlaneGeometry(150,110),new THREE.MeshStandardMaterial({color:0xb9bfc4,roughness:.95}));
    site.rotation.x=-Math.PI/2;site.position.y=.02;site.receiveShadow=true;scene.add(site);
    const roadM=new THREE.MeshStandardMaterial({color:0x565c62,roughness:.9});
    [[160,10,0,-62],[160,10,0,62],[10,110,-78,0],[10,110,78,0],[10,104,0,0]].forEach(([w,d,x,z])=>{
      const r=new THREE.Mesh(new THREE.PlaneGeometry(w,d),roadM);r.rotation.x=-Math.PI/2;r.position.set(x,.04,z);r.receiveShadow=true;scene.add(r);
    });
    // ---- phased objects ----
    const objs=[];const winMats=[];
    const reveal=(mesh,t0,t1)=>{mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.rv=[t0,t1];mesh.userData.sy=mesh.scale.y;objs.push(mesh);scene.add(mesh);return mesh;};
    const boxM=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.7,metalness:m??.1});
    const B=(w,h,d,x,z,c,t0,t1,r,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),boxM(c,r,m));b.position.set(x,h/2,z);return reveal(b,t0,t1);};
    // piling rigs + piles (phase 1: 0–.18)
    for(let i=0;i<14;i++){
      const x=-45+(i%7)*15,z=i<7?-25:25;
      const p=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,2.4,10),boxM(0x8d949b,.8));
      p.position.set(x,1.2,z);reveal(p,.01+i*.008,.06+i*.008);
    }
    B(3,10,3,-58,-38,0xc9a23a,.02,.12,.6,.3); // piling rig mast
    // hall pads (phase 2: .1–.3)
    const HX=[-34,-11.5,11.5,34];
    HX.forEach((x,i)=>B(20,1.2,44,x,-8,0xb4bac0,.1+i*.03,.2+i*.03,.9));
    B(30,1,24,22,42,0xb4bac0,.14,.26,.9);     // substation pad
    B(24,1,16,-30,42,0xb4bac0,.16,.28,.9);    // admin pad
    // structure frames (phase 3: .25–.5) — slender columns + roof beams
    HX.forEach((x,i)=>{
      const t0=.25+i*.035;
      for(let k=0;k<4;k++){B(.8,12,.8,x-8+k*5.4,-28,0x8d959d,t0,t0+.08,.5,.4);B(.8,12,.8,x-8+k*5.4,12,0x8d959d,t0+.02,t0+.1,.5,.4);}
      B(19,1,42,x,-8,0x9aa2aa,t0+.08,t0+.16,.5,.4).position.y=12.2;
    });
    // envelope: hall bodies (phase 4: .45–.72)
    const hallM=()=>boxM(0x2e3540,.55,.25);
    this._halls=[];
    HX.forEach((x,i)=>{
      const t0=.45+i*.05;
      const h=new THREE.Mesh(new THREE.BoxGeometry(20,13,44),hallM());h.position.set(x,6.5,-8);reveal(h,t0,t0+.12);this._halls.push(h);
      B(20.4,2,45,x,-8,0xe8ecef,t0+.09,t0+.16,.6).position.y=13.9;   // white roof cap
      // window strip (lit at the end)
      const wm=new THREE.MeshStandardMaterial({color:0x1a222d,roughness:.4,metalness:.2,emissive:0x00b0f0,emissiveIntensity:0}); // DS --lm-cyan-500
      const strip=new THREE.Mesh(new THREE.BoxGeometry(20.2,1.4,1),wm);strip.position.set(x,3.4,14.6);reveal(strip,t0+.1,t0+.16);winMats.push(wm);
    });
    // rooftop plant + cooling (phase 5: .68–.88)
    HX.forEach((x,i)=>{
      const t0=.68+i*.03;
      for(let k=0;k<3;k++)B(4.5,2.4,5,x-6+k*6,-24+0,0xaab3ba,t0+k*.02,t0+.08+k*.02,.4,.5).position.set(x-6+k*6,15.2,-18);
      B(3,2.2,4,x,15.1,0x7f8890,t0+.04,t0+.12,.4,.5).position.set(x+4,15.1,4);
    });
    B(26,7,20,22,42,0x333a44,.7,.82,.55,.3);   // substation hall
    B(20,9,12,-30,42,0x3a4250,.74,.86,.55,.3); // admin block
    for(let k=0;k<6;k++)B(2.6,3.2,2.6,10+k*4.6,58,0x9fb6c4,.72+k*.015,.8+k*.015,.35,.6); // cooling yard
    // tower cranes (visible mid-build, gone at the end)
    const crane=(x,z,t0,t1)=>{
      const g=new THREE.Group();
      const mast=new THREE.Mesh(new THREE.BoxGeometry(1.4,26,1.4),boxM(0xd8b62c,.55,.3));mast.position.y=13;g.add(mast);
      const jib=new THREE.Mesh(new THREE.BoxGeometry(22,1,1),boxM(0xd8b62c,.55,.3));jib.position.set(7,26,0);g.add(jib);
      const cw=new THREE.Mesh(new THREE.BoxGeometry(4,1.6,1.6),boxM(0x565c62,.6));cw.position.set(-6,25.6,0);g.add(cw);
      g.position.set(x,0,z);g.traverse(m=>{m.castShadow=true;});
      g.userData.rv=[t0,t1];g.userData.sy=1;g.userData.spin=true;objs.push(g);scene.add(g);
    };
    crane(-24,10,.2,.72);crane(24,-22,.26,.78);
    // ---- scrub state ----
    const camKeys=[ // [pos..., lookAt...]
      [120,64,150, 0,4,0],
      [70,42,95,  0,6,-4],
      [-6,30,78,  -6,8,-8],
      [-40,22,40, 0,9,-8],
      [-14,12,52, 6,10,-6],
      [30,26,70,  0,8,-8]
    ].map(k=>({p:new THREE.Vector3(k[0],k[1],k[2]),t:new THREE.Vector3(k[3],k[4],k[5])}));
    const vP=new THREE.Vector3(),vT=new THREE.Vector3();
    const smooth=x=>x*x*(3-2*x);
    const apply=(p)=>{
      // reveals: rise from ground within [t0,t1]
      objs.forEach(o=>{
        const [a,b]=o.userData.rv;let k=(p-a)/(b-a);k=Math.min(1,Math.max(0,k));
        if(o.userData.spin&&p>0){ // cranes: also slew, and leave at the end
          k=p<.5?k:Math.min(k,Math.max(0,(o.userData.rv[1]-p)/.06));
          o.rotation.y=p*9;
        }
        const e=smooth(k);
        o.visible=e>.001;
        o.scale.y=Math.max(.001,e*o.userData.sy);
      });
      // camera along keyframes
      const seg=Math.min(camKeys.length-2,Math.floor(p*(camKeys.length-1)));
      const f=smooth(p*(camKeys.length-1)-seg);
      vP.lerpVectors(camKeys[seg].p,camKeys[seg+1].p,f);
      vT.lerpVectors(camKeys[seg].t,camKeys[seg+1].t,f);
      camera.position.copy(vP);camera.lookAt(vT);
      // go-live: dusk + lit windows + cooling glow
      const live=Math.min(1,Math.max(0,(p-.84)/.14));
      scene.background.copy(dayBg).lerp(duskBg,live);scene.fog.color.copy(scene.background);
      hemi.intensity=.9-.55*live;key.intensity=1.5-1.1*live;
      winMats.forEach(m=>m.emissiveIntensity=live*1.5);
    };
    const resize=()=>{const w=this.clientWidth||800,h=this.clientHeight||500;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    new ResizeObserver(resize).observe(this);resize();
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      if(this._onScreen===false||document.hidden)return;   // hero is offscreen: stop rendering
      this._cur+=(this._p-this._cur)*(this._reduce?1:.09);
      apply(this._cur);
      renderer.render(scene,camera);
    };
    this._dispose=()=>{
      scene.traverse(o=>{
        if(o.geometry)o.geometry.dispose();
        const mm=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
        mm.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)v.dispose();});m.dispose();});
      });
      renderer.dispose();
    };
    apply(0);tick();
  }
}
if(!customElements.get('lm-campus-hero'))customElements.define('lm-campus-hero',LMCampusHero);
})();
