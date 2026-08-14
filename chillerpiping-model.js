/* Procedural img2threejs reconstruction of the LONGMOTIVE chiller-piping corridor. */
(function(){
'use strict';
const P={width:6.4,height:4.75,depth:29,pipeY:3.78,pipeR:.42,pipeLength:31,supportPitch:3.15};
const C={pipe:0x292d33,steel:0xa7adb0,steelDark:0x70777c,wall:0xe3e3de,door:0xd5d7d4,floor:0xa4a6a2,void:0x202832,red:'#cf3434',blue:'#2876bd'};
const ARROW_Z=-3.1;
const PIPE_LAYOUT=[{x:-1.6,color:C.red,dir:'up'},{x:-.55,color:C.blue,dir:'down'},{x:.55,color:C.blue,dir:'down'},{x:1.6,color:C.red,dir:'up'}];
function mat(THREE){return{
 pipe:new THREE.MeshStandardMaterial({color:C.pipe,roughness:.76,metalness:.02}),
 seam:new THREE.MeshStandardMaterial({color:0x44494e,roughness:.68,metalness:.04}),
 steel:new THREE.MeshStandardMaterial({color:C.steel,roughness:.36,metalness:.66}),
 steelDark:new THREE.MeshStandardMaterial({color:C.steelDark,roughness:.46,metalness:.58}),
 wall:new THREE.MeshStandardMaterial({color:C.wall,roughness:.9,metalness:0}),
 door:new THREE.MeshStandardMaterial({color:C.door,roughness:.62,metalness:.16}),
 floor:new THREE.MeshStandardMaterial({color:C.floor,roughness:.88,metalness:.02}),
 void:new THREE.MeshStandardMaterial({color:C.void,roughness:.95,metalness:0}),
 light:new THREE.MeshStandardMaterial({color:0xf6f2df,emissive:0xfff1c6,emissiveIntensity:3.2,roughness:.32}),
 white:new THREE.MeshStandardMaterial({color:0xf3f2ec,roughness:.74,metalness:0})
};}
function add(THREE,p,g,m,n,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.name=n;o.position.set(x,y,z);p.add(o);return o;}
function beam(THREE,p,a,b,r,m,n,segments=8){const d=new THREE.Vector3().subVectors(b,a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),segments),m);o.name=n;o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());p.add(o);return o;}
function arrowTexture(THREE,color,direction){
 const c=document.createElement('canvas');c.width=128;c.height=192;const g=c.getContext('2d');
 g.fillStyle='#f4f3ee';g.fillRect(0,0,128,192);g.strokeStyle='#d5d4cf';g.lineWidth=5;g.strokeRect(3,3,122,186);
 g.fillStyle=color;g.beginPath();
 if(direction==='up'){g.moveTo(64,20);g.lineTo(108,74);g.lineTo(84,74);g.lineTo(84,166);g.lineTo(44,166);g.lineTo(44,74);g.lineTo(20,74);}
 else if(direction==='down'){g.moveTo(44,26);g.lineTo(84,26);g.lineTo(84,118);g.lineTo(108,118);g.lineTo(64,172);g.lineTo(20,118);g.lineTo(44,118);}
 g.closePath();g.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function buildArchitecture(THREE,M,root){const g=new THREE.Group();g.name='CP_Architecture_Grp';root.add(g);
 add(THREE,g,new THREE.BoxGeometry(P.width,.16,P.depth),M.floor,'CP_Architecture_Floor',0,-.08,-9.5);
 add(THREE,g,new THREE.BoxGeometry(.18,P.height,P.depth),M.wall,'CP_Architecture_WallL',-P.width/2,P.height/2,-9.5);
 add(THREE,g,new THREE.BoxGeometry(.18,P.height,P.depth),M.wall,'CP_Architecture_WallR',P.width/2,P.height/2,-9.5);
 add(THREE,g,new THREE.BoxGeometry(P.width,.18,P.depth),M.void,'CP_Architecture_Ceiling',0,P.height,-9.5);
 add(THREE,g,new THREE.BoxGeometry(P.width,P.height,.18),M.wall,'CP_Architecture_End',0,P.height/2,-24);
 for(const x of [-2.85,2.85])for(const z of [1,-5,-11,-17])add(THREE,g,new THREE.BoxGeometry(.5,P.height,.7),M.wall,'CP_Architecture_Pier',x,P.height/2,z);
 return g;}
function buildDoors(THREE,M,root){const g=new THREE.Group();g.name='CP_Doors_Grp';root.add(g);
 for(const side of [-1,1])for(const [i,z] of [[0,.4],[1,-7.2]]){const pre=side<0?'CP_DoorL_':'CP_DoorR_';
  add(THREE,g,new THREE.BoxGeometry(.09,2.35,1.65),M.door,pre+'Leaf'+i,side*3.08,1.18,z);
  for(const dz of [-.87,.87])add(THREE,g,new THREE.BoxGeometry(.13,2.48,.08),M.steel,pre+'Frame'+i,side*3.02,1.24,z+dz);
  add(THREE,g,new THREE.BoxGeometry(.13,.08,1.82),M.steel,pre+'Head'+i,side*3.02,2.47,z);
  add(THREE,g,new THREE.BoxGeometry(.13,.11,.28),M.steelDark,pre+'Handle'+i,side*2.95,1.16,z+(side<0?.5:-.5));
  add(THREE,g,new THREE.BoxGeometry(.06,.34,.26),M.white,pre+'SafetyPlate'+i,side*2.93,1.72,z);
 }return g;}
function buildPipes(THREE,M,root){const groups={};
 for(const type of ['red','blue']){const pre=type==='red'?'CP_PipeRed_':'CP_PipeBlue_',g=new THREE.Group();g.name=pre+'Grp';g.userData.systemId='pipe-'+type;root.add(g);groups[type]={g,pre,count:0};}
 for(const cfg of PIPE_LAYOUT){const type=cfg.color===C.red?'red':'blue',entry=groups[type],k=entry.count++,tex=arrowTexture(THREE,cfg.color,cfg.dir),plateMat=new THREE.MeshStandardMaterial({map:tex,roughness:.62,metalness:0});
  const p=add(THREE,entry.g,new THREE.CylinderGeometry(P.pipeR,P.pipeR,P.pipeLength,32),M.pipe,entry.pre+'Barrel'+k,cfg.x,P.pipeY,-10);p.rotation.x=Math.PI/2;
  for(let z=3;z>-24;z-=2.15)add(THREE,entry.g,new THREE.TorusGeometry(P.pipeR+.015,.026,6,32),M.seam,entry.pre+'InsulationSeam',cfg.x,P.pipeY,z);
  add(THREE,entry.g,new THREE.BoxGeometry(.68,.04,1.12),plateMat,entry.pre+'ArrowPlate'+k,cfg.x,P.pipeY-P.pipeR-.06,ARROW_Z);
 } }
function buildSupports(THREE,M,root){const g=new THREE.Group();g.name='CP_Supports_Grp';root.add(g);let idx=0;
 for(let z=2.2;z>-23;z-=P.supportPitch){add(THREE,g,new THREE.BoxGeometry(5.65,.12,.16),M.steelDark,'CP_Supports_CrossChannel'+idx,0,3.18,z);
  for(const x of [-2.68,-1.08,0,1.08,2.68])beam(THREE,g,new THREE.Vector3(x,3.18,z),new THREE.Vector3(x,4.67,z),.026,M.steel,'CP_Supports_Hanger'+idx,8);
  for(const x of [-1.6,-.55,.55,1.6]){const c=add(THREE,g,new THREE.TorusGeometry(P.pipeR+.06,.035,7,30,Math.PI),M.steel,'CP_Supports_Clamp'+idx,x,P.pipeY,z);c.rotation.z=Math.PI;}
  idx++;}return g;}
function tray(THREE,M,p,name,x,y,w,z0,z1){const g=new THREE.Group();g.name=name+'Grp';p.add(g);for(const sx of [-w/2,w/2])beam(THREE,g,new THREE.Vector3(x+sx,y,z0),new THREE.Vector3(x+sx,y,z1),.045,M.steel,name+'Rail',8);let i=0;for(let z=z0;z>z1;z-=.48)beam(THREE,g,new THREE.Vector3(x-w/2,y,z),new THREE.Vector3(x+w/2,y,z),.027,M.steel,name+'Rung'+i++,7);return g;}
function buildTrays(THREE,M,root){const g=new THREE.Group();g.name='CP_CableTray_Grp';root.add(g);tray(THREE,M,g,'CP_CableTray_Left',-2.55,4.22,.72,4,-24);tray(THREE,M,g,'CP_CableTray_Right',2.55,4.22,.72,4,-24);tray(THREE,M,g,'CP_CableTray_Centre',0,4.5,.48,4,-24);return g;}
function buildLights(THREE,M,root){const g=new THREE.Group();g.name='CP_Lighting_Grp';root.add(g);let i=0;for(let z=2;z>-22;z-=5.1){add(THREE,g,new THREE.BoxGeometry(.34,.14,2.5),M.steelDark,'CP_Lighting_Housing'+i,0,3.12,z);add(THREE,g,new THREE.BoxGeometry(.27,.035,2.32),M.light,'CP_Lighting_Diffuser'+i,0,3.035,z);beam(THREE,g,new THREE.Vector3(0,3.18,z),new THREE.Vector3(0,4.62,z),.02,M.steel,'CP_Lighting_Stem'+i,7);i++;}return g;}
function create(THREE){const root=new THREE.Group();root.name='CP_Root';const M=mat(THREE);buildArchitecture(THREE,M,root);buildDoors(THREE,M,root);buildPipes(THREE,M,root);buildSupports(THREE,M,root);buildTrays(THREE,M,root);buildLights(THREE,M,root);
 root.userData.sculptRuntime={schemaVersion:1,model:'chiller-piping-corridor',fixedReferenceView:true,explodeAvailable:false,clickable:true,components:[
  {systemId:'pipe-blue',nodePattern:'CP_PipeBlue_',pivot:[-1.08,P.pipeY,-10],sockets:['support-clamps'],collider:{type:'box',size:[2.1,1,P.pipeLength]}},
  {systemId:'pipe-red',nodePattern:'CP_PipeRed_',pivot:[1.08,P.pipeY,-10],sockets:['support-clamps'],collider:{type:'box',size:[2.1,1,P.pipeLength]}},
  {systemId:'supports',nodePattern:'CP_Supports_',pivot:[0,3.7,-10],sockets:['ceiling','pipe-clamps'],collider:{type:'box',size:[5.7,1.6,27]}},
  {systemId:'cable-tray',nodePattern:'CP_CableTray_',pivot:[0,4.25,-10],sockets:['hanger-grid'],collider:{type:'box',size:[6,.8,28]}},
  {systemId:'lighting',nodePattern:'CP_Lighting_',pivot:[0,3.1,-10],sockets:['centre-hangers'],collider:{type:'box',size:[.5,.4,26]}},
  {systemId:'architecture',nodePattern:'CP_Architecture_',pivot:[0,P.height/2,-9.5],sockets:['door-openings','ceiling-grid'],collider:{type:'box',size:[P.width,P.height,P.depth]}},
  {systemId:'doors',nodePattern:'CP_Door',pivot:[0,1.2,-3],sockets:['wall-openings'],collider:{type:'box',size:[P.width,2.5,10]}}
 ]};return root;}
window.LMChillerPipingModel={create,dims:P};
})();
