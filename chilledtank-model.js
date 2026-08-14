/* chilledtank-model.js — procedural img2threejs reconstruction of the
   Longmotive outdoor chilled-water storage tank yard.

   Source of truth: 室外蓄冷罐.jpg.  The fixed camera in chilledtank-viewer.js
   governs the visible match; concealed rear connections are conservative
   symmetric completions.  No GLB or generated image is used at runtime.

   Scene frame: +Y up, tank row runs toward -X, façades sit at -Z, and the
   photographed yard/camera are on +Z. Mesh families use CW_* prefixes so the
   shared BIM HUD can group and raycast them.

   window.LMChilledTankModel.create(THREE) -> THREE.Group
*/
(function(){
'use strict';

const P={
  n:7,
  tankR:1.48,
  tankH:10.35,
  baseY:.22,
  pitch:3.22,
  rowX:0,
  rowZ:0,
  ribCount:58,
  ladderW:.58,
  buildingZ:-3.0
};

const C={
  tank:0xe8ebea,
  tankShade:0xcfd5d5,
  steel:0x7b8488,
  steelDark:0x4f585d,
  concrete:0x9a9a98,
  concreteDark:0x676a69,
  joint:0xe8eceb,
  pipe:0x8c979c,
  asphalt:0xa6a8a5,
  curb:0xd2d0ca,
  fence:0x899392,
  foliage:0x5b7849,
  foliageDark:0x36543a,
  blue:0x1b5f94,
  yellow:0xf1b827
};

function tex(THREE,w,h,draw,rx,ry,srgb){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);
  t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

function concreteMap(THREE){
  return tex(THREE,384,384,(g,w,h)=>{
    g.fillStyle='#9a9a98';g.fillRect(0,0,w,h);
    let s=184731;
    const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
    for(let i=0;i<680;i++){
      const v=108+Math.floor(rnd()*72),a=.025+rnd()*.075;
      g.fillStyle=`rgba(${v},${v},${v},${a})`;
      g.beginPath();g.arc(rnd()*w,rnd()*h,1+rnd()*15,0,Math.PI*2);g.fill();
    }
    g.strokeStyle='rgba(55,58,58,.14)';g.lineWidth=1;
    for(let i=0;i<12;i++){
      g.beginPath();const x=rnd()*w;g.moveTo(x,0);g.lineTo(x+(rnd()-.5)*22,h);g.stroke();
    }
  },2.2,1.4,true);
}

function asphaltMap(THREE){
  return tex(THREE,512,512,(g,w,h)=>{
    g.fillStyle='#a6a8a5';g.fillRect(0,0,w,h);
    let s=92417;
    const rnd=()=>{s=(s*1103515245+12345)>>>0;return s/4294967296;};
    for(let i=0;i<2600;i++){
      const v=125+Math.floor(rnd()*55);g.fillStyle=`rgba(${v},${v+2},${v},${.10+rnd()*.15})`;
      const r=.4+rnd()*1.8;g.fillRect(rnd()*w,rnd()*h,r,r);
    }
    for(let i=0;i<18;i++){
      g.fillStyle='rgba(72,74,73,.07)';
      g.beginPath();g.ellipse(rnd()*w,rnd()*h,12+rnd()*60,4+rnd()*22,rnd()*Math.PI,0,Math.PI*2);g.fill();
    }
  },8,4,true);
}

function tankMap(THREE){
  return tex(THREE,512,256,(g,w,h)=>{
    const grd=g.createLinearGradient(0,0,w,0);
    grd.addColorStop(0,'#cfd4d4');grd.addColorStop(.32,'#f2f4f3');
    grd.addColorStop(.70,'#dfe3e2');grd.addColorStop(1,'#c9cece');
    g.fillStyle=grd;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(117,125,126,.18)';g.lineWidth=1;
    for(let y=34;y<h;y+=46){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
    let s=3119;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
    for(let i=0;i<95;i++){
      g.fillStyle=`rgba(96,101,100,${.012+rnd()*.025})`;
      g.fillRect(rnd()*w,rnd()*h,1+rnd()*4,8+rnd()*45);
    }
  },1,1,true);
}

function makeMaterials(THREE){
  return {
    tank:new THREE.MeshStandardMaterial({color:C.tank,map:tankMap(THREE),roughness:.54,metalness:.06}),
    tankShade:new THREE.MeshStandardMaterial({color:C.tankShade,roughness:.62,metalness:.05}),
    steel:new THREE.MeshStandardMaterial({color:C.steel,roughness:.36,metalness:.82}),
    steelDark:new THREE.MeshStandardMaterial({color:C.steelDark,roughness:.48,metalness:.72}),
    concrete:new THREE.MeshStandardMaterial({color:C.concrete,map:concreteMap(THREE),roughness:.92,metalness:.01}),
    dark:new THREE.MeshStandardMaterial({color:C.concreteDark,roughness:.83,metalness:.05}),
    joint:new THREE.MeshStandardMaterial({color:C.joint,roughness:.72,metalness:.02}),
    pipe:new THREE.MeshStandardMaterial({color:C.pipe,roughness:.34,metalness:.88}),
    asphalt:new THREE.MeshStandardMaterial({color:C.asphalt,map:asphaltMap(THREE),roughness:.97,metalness:0}),
    curb:new THREE.MeshStandardMaterial({color:C.curb,roughness:.88,metalness:.01}),
    fence:new THREE.MeshStandardMaterial({color:C.fence,roughness:.5,metalness:.72,side:THREE.DoubleSide}),
    foliage:new THREE.MeshStandardMaterial({color:C.foliage,roughness:.96,metalness:0}),
    foliageDark:new THREE.MeshStandardMaterial({color:C.foliageDark,roughness:.98,metalness:0}),
    blue:new THREE.MeshStandardMaterial({color:C.blue,roughness:.62,metalness:.04}),
    yellow:new THREE.MeshStandardMaterial({color:C.yellow,roughness:.58,metalness:.02}),
    glass:new THREE.MeshStandardMaterial({color:0xd5e5e8,roughness:.18,metalness:.15})
  };
}

function add(THREE,parent,geometry,material,name,x,y,z){
  const o=new THREE.Mesh(geometry,material);o.name=name;o.position.set(x||0,y||0,z||0);parent.add(o);return o;
}

function pipeBetween(THREE,parent,a,b,r,material,name,segments){
  const d=new THREE.Vector3().subVectors(b,a),len=d.length();
  const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,segments||12),material);
  o.name=name;o.position.copy(a).add(b).multiplyScalar(.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(o);return o;
}

function torus(parent,THREE,r,tube,material,name,x,y,z,rx,ry,rz,arc){
  const o=add(THREE,parent,new THREE.TorusGeometry(r,tube,7,40,arc||Math.PI*2),material,name,x,y,z);
  o.rotation.set(rx||0,ry||0,rz||0);return o;
}

function buildTank(THREE,M,index){
  const tag='CW_Tank'+(index+1)+'_';
  const u=new THREE.Group();u.name=tag+'Grp';
  u.position.set(P.rowX-index*P.pitch,0,P.rowZ);

  const h=P.tankH,cy=P.baseY+h/2;
  add(THREE,u,new THREE.CylinderGeometry(P.tankR,P.tankR,h,64,1,false),M.tank,tag+'Shell',0,cy,0);
  add(THREE,u,new THREE.CylinderGeometry(P.tankR+.07,P.tankR+.07,.25,64),M.tankShade,tag+'BaseRing',0,P.baseY+.12,0);
  add(THREE,u,new THREE.SphereGeometry(P.tankR,64,18,0,Math.PI*2,0,Math.PI/2),M.tank,tag+'Roof',0,P.baseY+h,0);
  torus(u,THREE,P.tankR+.015,.045,M.tankShade,tag+'RoofSeam',0,P.baseY+h,0,Math.PI/2);

  // Real silhouette relief: 58 full-height vertical cladding ribs per tank.
  const ribGeo=new THREE.BoxGeometry(.045,h-.20,.075);
  const ribs=new THREE.InstancedMesh(ribGeo,M.tankShade,P.ribCount);ribs.name=tag+'TankShellRibs';
  const mx=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),sc=new THREE.Vector3(1,1,1);
  for(let j=0;j<P.ribCount;j++){
    const a=j/P.ribCount*Math.PI*2;
    pos.set(Math.sin(a)*(P.tankR+.025),cy,Math.cos(a)*(P.tankR+.025));
    q.setFromAxisAngle(new THREE.Vector3(0,1,0),a);mx.compose(pos,q,sc);ribs.setMatrixAt(j,mx);
  }
  ribs.instanceMatrix.needsUpdate=true;u.add(ribs);

  // Horizontal shell seams visible through the corrugation.
  for(const sy of [P.baseY+3.42,P.baseY+6.84,P.baseY+h-.12])
    torus(u,THREE,P.tankR+.055,.028,M.tankShade,tag+'ShellSeam',0,sy,0,Math.PI/2);

  // Circular manway and lower inspection cover face the photographed yard.
  const man=add(THREE,u,new THREE.CylinderGeometry(.40,.40,.18,36),M.tank,tag+'Manway',0,P.baseY+1.18,P.tankR+.08);
  man.rotation.x=Math.PI/2;
  torus(u,THREE,.40,.035,M.steel,tag+'ManwayBolts',0,P.baseY+1.18,P.tankR+.19,0,0,0);
  const low=add(THREE,u,new THREE.CylinderGeometry(.22,.22,.15,28),M.tankShade,tag+'LowerCover',-.64,P.baseY+.40,P.tankR+.07);
  low.rotation.x=Math.PI/2;

  // Ladder rails and rungs are attached with a small stand-off from the shell.
  const ladder=new THREE.Group();ladder.name=tag+'TankAccess';u.add(ladder);
  const z=P.tankR+.34,ly=P.baseY+h*.54,ladderH=h*1.03;
  for(const sx of [-P.ladderW/2,P.ladderW/2])
    add(THREE,ladder,new THREE.CylinderGeometry(.027,.027,ladderH,9),M.steel,tag+'LadderRail',sx,ly,z);
  const rungGeo=new THREE.CylinderGeometry(.024,.024,P.ladderW+.04,8);
  const rungCount=28,rungs=new THREE.InstancedMesh(rungGeo,M.steel,rungCount);rungs.name=tag+'LadderRungs';
  for(let j=0;j<rungCount;j++){
    q.setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
    pos.set(0,P.baseY+.35+j*(ladderH-.55)/(rungCount-1),z);
    mx.compose(pos,q,sc);rungs.setMatrixAt(j,mx);
  }
  rungs.instanceMatrix.needsUpdate=true;ladder.add(rungs);

  // Safety cage: hoops around the climber plus three longitudinal rails.
  const hoopCount=12;
  for(let j=0;j<hoopCount;j++){
    const yy=P.baseY+2.15+j*(h-1.55)/(hoopCount-1);
    torus(ladder,THREE,.49,.024,M.steel,tag+'SafetyHoops',0,yy,z+.32,Math.PI/2);
  }
  for(const sx of [-.47,0,.47])
    add(THREE,ladder,new THREE.CylinderGeometry(.022,.022,h-1.35,8),M.steel,tag+'CageRail',sx,P.baseY+(h+1.35)/2,z+.63);
  const platform=add(THREE,ladder,new THREE.BoxGeometry(1.18,.09,.72),M.steelDark,tag+'LadderPlatform',0,P.baseY+h*.48,z+.32);
  platform.castShadow=true;
  pipeBetween(THREE,ladder,new THREE.Vector3(-.55,platform.position.y-.06,z+.30),new THREE.Vector3(-.17,platform.position.y-.58,z),.035,M.steelDark,tag+'PlatformBrace');
  pipeBetween(THREE,ladder,new THREE.Vector3(.55,platform.position.y-.06,z+.30),new THREE.Vector3(.17,platform.position.y-.58,z),.035,M.steelDark,tag+'PlatformBrace');

  // Crown guardrail has three horizontal rings and regular upright posts.
  const gy=P.baseY+h+1.10;
  for(const yy of [gy-.55,gy-.15,gy+.25])torus(u,THREE,P.tankR-.15,.035,M.steel,tag+'TopGuardrail',0,yy,0,Math.PI/2);
  for(let j=0;j<12;j++){
    const a=j/12*Math.PI*2;
    add(THREE,u,new THREE.CylinderGeometry(.025,.025,.90,8),M.steel,tag+'TopRailPost',Math.sin(a)*(P.tankR-.15),gy-.15,Math.cos(a)*(P.tankR-.15));
  }
  add(THREE,u,new THREE.CylinderGeometry(.10,.10,.42,14),M.pipe,tag+'RoofVent',-.48,P.baseY+h+.43,-.25);
  return u;
}

function buildFacade(THREE,M,root){
  const g=new THREE.Group();g.name='CW_Facade_Grp';root.add(g);
  const wall=add(THREE,g,new THREE.BoxGeometry(38,17,1.15),M.concrete,'CW_Facade_Wall',-8.3,8.5,P.buildingZ);
  wall.receiveShadow=true;
  // Tall dark recesses and pale panel joints define the building rhythm.
  for(let i=0;i<7;i++){
    const x=3.6-i*5.05;
    add(THREE,g,new THREE.BoxGeometry(2.28,10.8,.16),M.dark,'CW_Facade_Recess'+i,x,8.05,P.buildingZ+.61);
    add(THREE,g,new THREE.BoxGeometry(.16,16.4,.18),M.joint,'CW_Facade_PanelJoint'+i,x+2.42,8.4,P.buildingZ+.63);
  }
  add(THREE,g,new THREE.BoxGeometry(38,.16,.18),M.joint,'CW_Facade_HJoint',-8.3,5.18,P.buildingZ+.63);
  add(THREE,g,new THREE.BoxGeometry(38,.25,1.32),M.concrete,'CW_Facade_Parapet',-8.3,17.05,P.buildingZ);
  // Right service canopy and large curved duct seen at the crop edge.
  add(THREE,g,new THREE.BoxGeometry(4.1,.22,2.0),M.steel,'CW_Facade_Canopy',5.0,8.3,-1.68);
  const duct=torus(g,THREE,1.0,.24,M.pipe,'CW_Facade_DuctElbow',4.5,9.05,-2.0,0,Math.PI/2,0,Math.PI);
  duct.rotation.z=Math.PI/2;
  return g;
}

function buildManifold(THREE,M,root){
  const g=new THREE.Group();g.name='CW_Manifold_Grp';g.position.set(5.0,0,-.55);root.add(g);
  // Support skid and two long headers.
  add(THREE,g,new THREE.BoxGeometry(6.2,.12,1.55),M.steelDark,'CW_Manifold_Skid',0,.22,0);
  for(const z of [-.38,.42]){
    const hdr=add(THREE,g,new THREE.CylinderGeometry(.115,.115,6.15,14),M.pipe,'CW_Manifold_Header',0,1.04,z);
    hdr.rotation.z=Math.PI/2;
  }
  const vesselGeo=new THREE.CylinderGeometry(.18,.18,1.65,18);
  const capGeo=new THREE.SphereGeometry(.18,18,8);
  for(let i=0;i<8;i++){
    const x=-2.65+i*.76;
    const v=add(THREE,g,vesselGeo,M.pipe,'CW_Manifold_Vessel'+(i+1),x,1.85,0);
    add(THREE,g,capGeo,M.pipe,'CW_Manifold_VesselCap'+(i+1),x,2.67,0);
    add(THREE,g,new THREE.BoxGeometry(.34,.10,.50),M.steelDark,'CW_Manifold_Base'+(i+1),x,.50,0);
    pipeBetween(THREE,g,new THREE.Vector3(x,.66,-.38),new THREE.Vector3(x,1.02,-.38),.055,M.pipe,'CW_Manifold_Branch');
    pipeBetween(THREE,g,new THREE.Vector3(x,2.69,0),new THREE.Vector3(x,3.10,.42),.055,M.pipe,'CW_Manifold_Branch');
    // Valve body, handwheel and pressure gauge.
    add(THREE,g,new THREE.SphereGeometry(.12,14,10),M.steel,'CW_Manifold_Valve'+(i+1),x,1.05,-.38);
    torus(g,THREE,.16,.023,M.steelDark,'CW_Manifold_Handwheel'+(i+1),x,1.30,-.38,Math.PI/2);
    torus(g,THREE,.13,.020,M.steelDark,'CW_Manifold_UpperHandwheel'+(i+1),x,2.92,.42,Math.PI/2);
    add(THREE,g,new THREE.SphereGeometry(.075,12,8),M.yellow,'CW_Manifold_ValveCap'+(i+1),x,2.70,.42);
    const gauge=add(THREE,g,new THREE.CylinderGeometry(.10,.10,.05,20),M.glass,'CW_Manifold_Gauge'+(i+1),x+.18,2.88,.27);
    gauge.rotation.z=Math.PI/2;
  }
  // Uprights and overhead return pipe make the bank read as a complete skid.
  for(const x of [-3.05,3.05])add(THREE,g,new THREE.BoxGeometry(.10,3.25,.10),M.steelDark,'CW_Manifold_Frame',x,1.82,0);
  const top=add(THREE,g,new THREE.CylinderGeometry(.13,.13,6.4,14),M.pipe,'CW_Manifold_TopHeader',0,3.28,.42);top.rotation.z=Math.PI/2;
  for(let i=0;i<7;i++)pipeBetween(THREE,g,new THREE.Vector3(-2.65+i*.76,1.04,-.38),new THREE.Vector3(-1.89+i*.76,1.04,.42),.035,M.pipe,'CW_Manifold_CrossLink',8);
  return g;
}

function buildYard(THREE,M,root){
  const g=new THREE.Group();g.name='CW_Yard_Grp';root.add(g);
  const yard=add(THREE,g,new THREE.BoxGeometry(58,.28,34),M.asphalt,'CW_Yard_Paving',-7,-.14,10);yard.receiveShadow=true;
  // The curb belongs to the fence-side verge in the source photograph. It
  // must not cut diagonally across the open foreground road.
  const fenceCurb=pipeBetween(THREE,g,new THREE.Vector3(-28,.12,4.75),new THREE.Vector3(-4.6,.12,11.55),.16,M.curb,'CW_Yard_FenceCurb',8);
  fenceCurb.scale.y=.72;
  // Small rectangular drain in the near foreground.
  const drain=add(THREE,g,new THREE.BoxGeometry(1.15,.04,.48),M.steelDark,'CW_Yard_Drain',4.7,.03,8.2);
  for(let i=0;i<9;i++)add(THREE,g,new THREE.BoxGeometry(.035,.04,.44),M.steel,'CW_Yard_DrainBar',4.22+i*.12,.06,8.2);

  // Fence follows the left edge of the drive toward the vanishing point.
  const fence=new THREE.Group();fence.name='CW_Yard_Fence';g.add(fence);
  const a=new THREE.Vector3(-27,.12,5.2),b=new THREE.Vector3(-5,.12,11.8),len=a.distanceTo(b);
  const dir=new THREE.Vector3().subVectors(b,a).normalize();
  const count=15;
  for(let i=0;i<count;i++){
    const p=a.clone().lerp(b,i/(count-1));
    add(THREE,fence,new THREE.CylinderGeometry(.055,.065,2.7,8),M.fence,'CW_Yard_FencePost',p.x,1.47,p.z);
  }
  for(const yy of [.48,1.35,2.25])pipeBetween(THREE,fence,new THREE.Vector3(a.x,yy,a.z),new THREE.Vector3(b.x,yy,b.z),.025,M.fence,'CW_Yard_FenceWire');
  // Fine mesh as crossed diagonal wires.
  for(let i=0;i<48;i++){
    const t=i/47,p=a.clone().lerp(b,t),p2=p.clone().addScaledVector(dir,1.05);p.y=.30;p2.y=2.55;
    pipeBetween(THREE,fence,p,p2,.009,M.fence,'CW_Yard_FenceMesh',6);
  }

  // Vegetation masses behind the fence, deliberately irregular but low-cost.
  for(let i=0;i<32;i++){
    const t=i/31,p=a.clone().lerp(b,t),r=.65+(i%5)*.16;
    add(THREE,g,new THREE.IcosahedronGeometry(r,1),i%3?M.foliage:M.foliageDark,'CW_Yard_Vegetation',p.x-.4-(i%3)*.25,1.2+(i%4)*.25,p.z-.9-(i%2)*.35);
  }

  // Slender street lights along the drive.
  for(const [x,z,h] of [[-22,5.7,5.2],[-13,8.3,5.6],[-5,11.0,6.0]]){
    add(THREE,g,new THREE.CylinderGeometry(.045,.065,h,8),M.steelDark,'CW_Yard_Streetlight',x,h/2,z);
    pipeBetween(THREE,g,new THREE.Vector3(x,h,z),new THREE.Vector3(x+.65,h+.08,z),.04,M.steelDark,'CW_Yard_LightArm');
    add(THREE,g,new THREE.BoxGeometry(.72,.10,.24),M.steelDark,'CW_Yard_LightHead',x+.68,h+.07,z);
  }

  // Two blue wheel bins and yellow bollards at the far end of the row.
  for(let i=0;i<2;i++){
    const bin=new THREE.Group();bin.name='CW_Yard_Bin'+(i+1);bin.position.set(-18.8+i*.62,.05,2.45);g.add(bin);
    add(THREE,bin,new THREE.BoxGeometry(.48,.82,.47),M.blue,'CW_Yard_BinBody',0,.44,0).rotation.x=-.035;
    add(THREE,bin,new THREE.BoxGeometry(.54,.08,.52),M.blue,'CW_Yard_BinLid',0,.89,-.02).rotation.x=-.10;
    for(const x of [-.18,.18]){const w=add(THREE,bin,new THREE.CylinderGeometry(.08,.08,.06,14),M.steelDark,'CW_Yard_BinWheel',x,.10,.24);w.rotation.z=Math.PI/2;}
  }
  for(const x of [-15.9,-14.9,-13.9])add(THREE,g,new THREE.CylinderGeometry(.055,.07,.72,10),M.yellow,'CW_Yard_Bollard',x,.36,1.75);
  return g;
}

function create(THREE){
  const root=new THREE.Group();root.name='CW_Root';
  const M=makeMaterials(THREE);
  for(let i=0;i<P.n;i++)root.add(buildTank(THREE,M,i));
  buildFacade(THREE,M,root);
  buildManifold(THREE,M,root);
  buildYard(THREE,M,root);
  const components=[
    {componentId:'tank-row',nodePattern:'CW_Tank',pivot:[-9.66,5.4,0],sockets:['tank-base','tank-crown'],collider:{type:'box',size:[22.3,12.1,3.1]}},
    {componentId:'tank-shell',nodePattern:'_Shell',pivot:[0,5.4,0],sockets:['shell-front','shell-roof'],collider:{type:'cylinder',radius:P.tankR,height:P.tankH}},
    {componentId:'tank-access',nodePattern:'_TankAccess',pivot:[0,5.4,P.tankR+.34],sockets:['ladder-foot','ladder-platform'],collider:{type:'box',size:[1.2,10.7,1.1]}},
    {componentId:'tank-crown',nodePattern:'_TopGuardrail',pivot:[0,P.baseY+P.tankH,0],sockets:['roof-ring'],collider:{type:'cylinder',radius:P.tankR,height:1.7}},
    {componentId:'facade',nodePattern:'CW_Facade_',pivot:[-8.3,8.5,P.buildingZ],sockets:['service-bay','yard-slab'],collider:{type:'box',size:[38,17,1.32]}},
    {componentId:'facade-service',nodePattern:'CW_Facade_Canopy',pivot:[5,8.3,-1.68],sockets:['duct-penetration'],collider:{type:'box',size:[4.1,2.4,2]}},
    {componentId:'manifold',nodePattern:'CW_Manifold_',pivot:[5,1.7,-.55],sockets:['supply-header','return-header'],collider:{type:'box',size:[6.4,3.6,1.7]}},
    {componentId:'yard-paving',nodePattern:'CW_Yard_Paving',pivot:[-7,-.14,10],sockets:['yard-slab'],collider:{type:'box',size:[58,.28,34]}},
    {componentId:'yard-fence',nodePattern:'CW_Yard_Fence',pivot:[-16,1.4,8.5],sockets:['fence-start','fence-end'],collider:{type:'box',size:[23,2.7,.25]}},
    {componentId:'yard-vegetation',nodePattern:'CW_Yard_Vegetation',pivot:[-16,1.4,8.5],sockets:['verge'],collider:{type:'box',size:[23,3,2.2]}},
    {componentId:'yard-props',nodePattern:'CW_Yard_',pivot:[-8,1,6],sockets:['drive-edge'],collider:{type:'box',size:[28,6,12]}}
  ];
  root.userData.sculptRuntime={schemaVersion:1,model:'outdoor-chilled-water-tank-yard',fixedReferenceView:true,explodeAvailable:false,clickable:true,components};
  return root;
}

window.LMChilledTankModel={create:create,dims:P};
})();
