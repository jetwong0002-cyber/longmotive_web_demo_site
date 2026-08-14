/* rooftop-ac-model.js — high-detail procedural reconstruction of LONGMOTIVE's
   rooftop air-conditioning outdoor-unit installation.

   屋面空调外机.jpg controls the FRONT composition and visible equipment counts.
   屋面空调外机2.jpg controls the REAR service zone, stair, towers and steelwork.
   Occluded roof extents are conservative. All visible identity features are
   geometry: cabinet bevels, coil fins, fan grilles, louvers, hoses and grating.
*/
(function(){
'use strict';

const FRONT_LOW_COUNT=8;
const FRONT_TALL_COUNT=9;
const COIL_FIN_COUNT=28;
const C={cream:0xe1dfd4,creamHi:0xf1f0e9,creamShade:0xc7c5bb,blue:0x137f9f,blueDark:0x07506f,dark:0x242a2c,galv:0xaeb7b8,galvHi:0xd5dad8,roof:0x747d80,warning:0xd6bb35,green:0x54a57c};

function canvasTex(THREE,w,h,draw,rx=1,ry=1){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function makeCoilTexture(THREE){return canvasTex(THREE,256,256,(g,w,h)=>{g.fillStyle='#087797';g.fillRect(0,0,w,h);const q=g.createLinearGradient(0,0,w,0);q.addColorStop(0,'rgba(0,38,61,.48)');q.addColorStop(.25,'rgba(65,180,201,.25)');q.addColorStop(.55,'rgba(0,69,95,.28)');q.addColorStop(1,'rgba(42,164,188,.2)');g.fillStyle=q;g.fillRect(0,0,w,h);g.strokeStyle='rgba(1,32,49,.48)';g.lineWidth=1;for(let x=1;x<w;x+=5){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}g.strokeStyle='rgba(205,236,236,.22)';for(let y=2;y<h;y+=6){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}},1,1);}
function makeMetalTexture(THREE){return canvasTex(THREE,256,256,(g,w,h)=>{g.fillStyle='#aeb7b8';g.fillRect(0,0,w,h);let s=47811;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};for(let i=0;i<900;i++){const v=125+Math.floor(rnd()*90);g.fillStyle=`rgba(${v},${v+2},${v+3},${.025+rnd()*.07})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*3,.5+rnd()*1.5);}for(let i=0;i<18;i++){g.strokeStyle='rgba(255,255,255,.035)';g.beginPath();g.moveTo(0,rnd()*h);g.lineTo(w,rnd()*h);g.stroke();}},3,3);}
function makeRoofTexture(THREE){return canvasTex(THREE,256,256,(g,w,h)=>{g.fillStyle='#747d80';g.fillRect(0,0,w,h);let s=7821;const rnd=()=>{s=(s*1103515245+12345)>>>0;return s/4294967296;};for(let i=0;i<900;i++){const v=80+Math.floor(rnd()*70);g.fillStyle=`rgba(${v},${v+3},${v+5},${.03+rnd()*.08})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2);}},5,4);}
function makeCabinetTexture(THREE){return canvasTex(THREE,384,384,(g,w,h)=>{const grd=g.createLinearGradient(0,0,w,0);grd.addColorStop(0,'#c9c8bf');grd.addColorStop(.18,'#e4e2d8');grd.addColorStop(.55,'#eceae0');grd.addColorStop(.86,'#d8d6cc');grd.addColorStop(1,'#c2c1b8');g.fillStyle=grd;g.fillRect(0,0,w,h);let s=62391;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};for(let i=0;i<470;i++){const v=90+Math.floor(rnd()*95);g.fillStyle=`rgba(${v},${v},${v-3},${.012+rnd()*.032})`;g.fillRect(rnd()*w,rnd()*h,.5+rnd()*2,2+rnd()*16);}for(let x=42;x<w;x+=96){const lg=g.createLinearGradient(x,0,x+10,0);lg.addColorStop(0,'rgba(70,72,69,.045)');lg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=lg;g.fillRect(x,0,12,h);}},1,1);}
function makeCabinetRoughness(THREE){return canvasTex(THREE,256,256,(g,w,h)=>{g.fillStyle='#9e9e9e';g.fillRect(0,0,w,h);let s=7119;const rnd=()=>{s=(s*1103515245+12345)>>>0;return s/4294967296;};for(let i=0;i<900;i++){const v=110+Math.floor(rnd()*85);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*5);}},2,2);}

function roundedRectShape(THREE,w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w*.25,h*.25);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function roundedCabinetGeometry(THREE,w,h,d,r=.08,bevel=.025){const geo=new THREE.ExtrudeGeometry(roundedRectShape(THREE,w,h,r),{depth:d,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel,curveSegments:3});geo.translate(0,0,-d/2);geo.computeVertexNormals();return geo;}
function box(THREE,w,h,d,m){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);}
function cyl(THREE,r,h,m,seg=16){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m);}
function add(parent,obj,name,x=0,y=0,z=0){obj.name=name;obj.position.set(x,y,z);parent.add(obj);return obj;}
function beamBetween(THREE,parent,a,b,r,m,name,seg=10){const d=new THREE.Vector3().subVectors(b,a),o=cyl(THREE,r,d.length(),m,seg);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());return add(parent,o,name,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);}
function tube(THREE,parent,pts,r,m,name){const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');return add(parent,new THREE.Mesh(new THREE.TubeGeometry(curve,32,r,8,false),m),name);}

function create(THREE){
 const root=new THREE.Group();root.name='RA_Root';
 const metalMap=makeMetalTexture(THREE),roofMap=makeRoofTexture(THREE),coilMap=makeCoilTexture(THREE),cabinetMap=makeCabinetTexture(THREE),cabinetRoughness=makeCabinetRoughness(THREE);
 const M={
  cream:new THREE.MeshPhysicalMaterial({color:0xffffff,map:cabinetMap,roughness:.45,roughnessMap:cabinetRoughness,metalness:.16,clearcoat:.10,clearcoatRoughness:.55}),
  creamHi:new THREE.MeshPhysicalMaterial({color:C.creamHi,map:cabinetMap,roughness:.38,roughnessMap:cabinetRoughness,metalness:.12,clearcoat:.15,clearcoatRoughness:.48}),
  creamShade:new THREE.MeshStandardMaterial({color:C.creamShade,roughness:.58,metalness:.24}),
  coilBack:new THREE.MeshStandardMaterial({map:coilMap,color:0xffffff,roughness:.38,metalness:.46}),
  coilFin:new THREE.MeshPhysicalMaterial({color:C.blue,roughness:.32,metalness:.72,clearcoat:.1,clearcoatRoughness:.36}),
  coilDark:new THREE.MeshStandardMaterial({color:C.blueDark,roughness:.54,metalness:.52}),
  dark:new THREE.MeshPhysicalMaterial({color:C.dark,roughness:.46,metalness:.5,clearcoat:.18,clearcoatRoughness:.36}),
  galv:new THREE.MeshStandardMaterial({map:metalMap,color:0xffffff,roughness:.42,metalness:.78}),
  galvHi:new THREE.MeshStandardMaterial({color:C.galvHi,roughness:.38,metalness:.7}),
  roof:new THREE.MeshStandardMaterial({map:roofMap,color:0xffffff,roughness:.92,metalness:.03}),
  warning:new THREE.MeshStandardMaterial({color:C.warning,roughness:.56,metalness:.14}),
  green:new THREE.MeshStandardMaterial({color:C.green,roughness:.54,metalness:.08}),
  glass:new THREE.MeshPhysicalMaterial({color:0xc4d9dc,roughness:.15,metalness:.08,transmission:.2,transparent:true,opacity:.78})
 };
 const families={low:new THREE.Group(),tall:new THREE.Group(),elevated:new THREE.Group(),steel:new THREE.Group(),access:new THREE.Group(),services:new THREE.Group(),safety:new THREE.Group(),context:new THREE.Group()};
 families.low.name='RA_LowUnit_Grp';families.tall.name='RA_TallUnit_Grp';families.elevated.name='RA_Elevated_Grp';families.steel.name='RA_SupportSteel_Grp';families.access.name='RA_Grating_Access_Grp';families.services.name='RA_Services_Grp';families.safety.name='RA_Safety_Grp';families.context.name='RA_Context_Grp';Object.values(families).forEach(g=>root.add(g));

 function fanAssembly(parent,prefix,x,y,z,r=.48){const g=new THREE.Group();g.name=prefix+'_FanAssembly';g.position.set(x,y,z);parent.add(g);const well=add(g,cyl(THREE,r*.92,.055,M.dark,40),prefix+'_FanWell');const outer=add(g,new THREE.Mesh(new THREE.TorusGeometry(r,.045,9,48),M.galvHi),prefix+'_FanOuter',0,.075,0);outer.rotation.x=Math.PI/2;for(let i=0;i<7;i++){const blade=add(g,new THREE.Mesh(roundedCabinetGeometry(THREE,r*.72,r*.16,.025,.05,.008),M.dark),prefix+'_FanBlade'+i,0,.105,0);blade.geometry.translate(r*.27,0,0);blade.rotation.set(-Math.PI/2,0,i*Math.PI*2/7+.18);}add(g,cyl(THREE,.105,.10,M.dark,20),prefix+'_FanHub',0,.11,0);for(const rr of [.18,.29,.40]){const ring=add(g,new THREE.Mesh(new THREE.TorusGeometry(rr,.011,6,42),M.galvHi),prefix+'_FanGuardRing',0,.15,0);ring.rotation.x=Math.PI/2;}for(let i=0;i<8;i++){const bar=add(g,box(THREE,r*1.92,.018,.018,M.galvHi),prefix+'_FanGuardBar'+i,0,.15,0);bar.rotation.y=i*Math.PI/8;}return well;}
 function buildDualFanDeck(parent,prefix,w,y,z){const deck=add(parent,new THREE.Mesh(roundedCabinetGeometry(THREE,w,.13,1.55,.06,.02),M.creamHi),prefix+'_DualFanDeck',0,y,z);deck.rotation.x=Math.PI/2;fanAssembly(parent,prefix+'_A',-w*.23,y+.10,z,.46);fanAssembly(parent,prefix+'_B',w*.23,y+.10,z,.46);}
 function buildLouverBank(parent,prefix,x,y,z,w,h,side='front'){const g=new THREE.Group();g.name=prefix+'_LouverBank';g.position.set(x,y,z);parent.add(g);const count=Math.max(5,Math.round(h/.13));for(let i=0;i<count;i++){const yy=-h/2+(i+.5)*h/count;const slat=add(g,box(THREE,w,h/count*.22,.05,M.dark),prefix+'_Louver'+i,0,yy,0);slat.rotation.x=.38;}if(side==='side')g.rotation.y=Math.PI/2;return g;}
 function buildCoilPanel(parent,prefix,x,y,z,w,h,rotY=0){const g=new THREE.Group();g.name=prefix+'_CoilPanel';g.position.set(x,y,z);g.rotation.y=rotY;parent.add(g);add(g,box(THREE,w,h,.045,M.coilBack),prefix+'_CoilCore');const finGeo=new THREE.BoxGeometry(.025,h*.965,.035),fins=new THREE.InstancedMesh(finGeo,M.coilFin,COIL_FIN_COUNT);fins.name=prefix+'_CoilFins';const mx=new THREE.Matrix4();for(let i=0;i<COIL_FIN_COUNT;i++){const px=-w*.48+i*w*.96/(COIL_FIN_COUNT-1);mx.makeTranslation(px,0,.035);fins.setMatrixAt(i,mx);}fins.instanceMatrix.needsUpdate=true;g.add(fins);const hCount=Math.round(h/.16),hGeo=new THREE.BoxGeometry(w*.97,.012,.045),rows=new THREE.InstancedMesh(hGeo,M.galvHi,hCount);rows.name=prefix+'_CoilCrossFins';for(let i=0;i<hCount;i++){mx.makeTranslation(0,-h*.47+i*h*.94/(hCount-1),.06);rows.setMatrixAt(i,mx);}rows.instanceMatrix.needsUpdate=true;g.add(rows);for(const sx of [-1,1])add(g,box(THREE,.09,h+.16,.12,M.creamHi),prefix+'_CoilJamb',sx*(w/2+.02),0,.055);for(const sy of [-1,1])add(g,box(THREE,w+.18,.09,.12,M.creamHi),prefix+'_CoilRail',0,sy*(h/2+.02),.055);return g;}
 function buildHoseLoop(parent,prefix,x,y,z,span=.42,drop=.55){const pts=[new THREE.Vector3(x-span/2,y,z),new THREE.Vector3(x-span*.55,y-drop*.55,z+.05),new THREE.Vector3(x,y-drop,z+.08),new THREE.Vector3(x+span*.55,y-drop*.55,z+.05),new THREE.Vector3(x+span/2,y,z)];tube(THREE,parent,pts,.055,M.dark,prefix+'_InsulatedHose');for(const sx of [-1,1])add(parent,cyl(THREE,.075,.13,M.galvHi,14),prefix+'_HoseCoupling',x+sx*span/2,y+.02,z).rotation.z=Math.PI/2;}

 function lowUnit(x,z,i,rot=0,parent=families.low){const tag='RA_LowUnit_'+String(i).padStart(2,'0'),g=new THREE.Group();g.name=tag;g.position.set(x,.25,z);g.rotation.y=rot;parent.add(g);add(g,new THREE.Mesh(roundedCabinetGeometry(THREE,2.32,1.18,1.52,.09,.035),M.cream),tag+'_Cabinet',0,.68,0);add(g,new THREE.Mesh(roundedCabinetGeometry(THREE,2.08,.84,.04,.045,.014),M.creamShade),tag+'_ServicePanel',0,.67,.78);add(g,box(THREE,.26,.045,.035,M.dark),tag+'_Handle',.72,.67,.815);add(g,box(THREE,.42,.17,.025,M.creamHi),tag+'_NamePlate',-.46,.72,.814);add(g,box(THREE,.07,.07,.03,M.green),tag+'_StatusBadge',-.19,.72,.83);for(const sx of [-.87,.87])add(g,box(THREE,.31,.19,1.63,M.dark),tag+'_AntivibrationFoot',sx,-.02,0);fanAssembly(g,tag+'_Left',-.55,1.31,0,.44);fanAssembly(g,tag+'_Right',.55,1.31,0,.44);buildLouverBank(g,tag+'_Side',-1.175,.68,0,1.16,.68,'side');buildHoseLoop(g,tag,0,.50,.88,.44,.60);for(const sx of [-1.04,1.04])for(const sy of [.18,1.10])add(g,cyl(THREE,.025,.04,M.galvHi,10),tag+'_PanelFastener',sx,sy,.82).rotation.x=Math.PI/2;return g;}
 function tallUnit(x,z,i,rot=0,parent=families.tall,scale=1,baseY=.18){const tag=(parent===families.elevated?'RA_Elevated_':'RA_TallUnit_')+String(i).padStart(2,'0'),g=new THREE.Group();g.name=tag;g.position.set(x,baseY,z);g.rotation.y=rot;g.scale.setScalar(scale);parent.add(g);add(g,new THREE.Mesh(roundedCabinetGeometry(THREE,2.08,3.15,1.5,.08,.035),M.cream),tag+'_Cabinet',0,1.65,0);buildCoilPanel(g,tag+'_Front',0,1.76,.78,1.68,2.42,0);buildCoilPanel(g,tag+'_Side',1.065,1.76,0,1.14,2.42,Math.PI/2);buildLouverBank(g,tag+'_RearService',0,1.63,-.78,1.45,.72);add(g,box(THREE,2.20,.16,1.60,M.creamHi),tag+'_TopCap',0,3.28,0);for(const sx of [-.86,.86])add(g,box(THREE,.24,.20,1.58,M.dark),tag+'_BaseRail',sx,.02,0);fanAssembly(g,tag+'_Top',0,3.40,0,.49);add(g,box(THREE,.32,.16,.03,M.warning),tag+'_WarningPlate',.67,.55,.815);return g;}
 function horizontalCoilUnit(x,z,i,rot=0){const tag='RA_TallUnit_RearHorizontal_'+i,g=new THREE.Group();g.name=tag;g.position.set(x,.20,z);g.rotation.y=rot;families.tall.add(g);add(g,new THREE.Mesh(roundedCabinetGeometry(THREE,3.25,2.28,1.55,.08,.035),M.cream),tag+'_Cabinet',0,1.22,0);buildCoilPanel(g,tag+'_Front',0,1.28,.81,2.86,1.62);buildCoilPanel(g,tag+'_Side',1.65,1.28,0,1.12,1.62,Math.PI/2);buildDualFanDeck(g,tag,2.84,2.42,0);for(const sx of [-1.38,1.38])add(g,box(THREE,.28,.20,1.62,M.dark),tag+'_BaseRail',sx,.01,0);return g;}

 function buildPhysicalGrating(){const g=families.access;g.name='RA_Grating_Access_Grp';const rects=[[-15,7.35,-10,9],[13.15,15,-10,9],[7.35,13.15,-10,-7.7],[7.35,13.15,-3.2,9]],spacing=.24,transforms=[];for(const [x0,x1,z0,z1] of rects){for(let x=x0;x<=x1+.001;x+=spacing)transforms.push([x,.08,(z0+z1)/2,.035,.07,z1-z0]);for(let z=z0;z<=z1+.001;z+=spacing)transforms.push([(x0+x1)/2,.095,z,x1-x0,.045,.032]);}const geo=new THREE.BoxGeometry(1,1,1),bars=new THREE.InstancedMesh(geo,M.galv,transforms.length);bars.name='RA_Grating_PhysicalBars';const mx=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();transforms.forEach((v,i)=>{p.set(v[0],v[1],v[2]);s.set(v[3],v[4],v[5]);mx.compose(p,q,s);bars.setMatrixAt(i,mx);});bars.instanceMatrix.needsUpdate=true;g.add(bars);return bars;}

 // Bounded roof and actual open steel grating.
 add(families.context,box(THREE,31,.42,20,M.roof),'RA_Context_RoofSlab',0,-.40,-.5);
 buildPhysicalGrating();
 for(let x=-14.5;x<=14.5;x+=2.6)add(families.steel,box(THREE,.18,.55,19.2,M.galv),'RA_SupportSteel_MainLong'+x,x,-.26,-.5);
 for(let z=-9.5;z<=8.5;z+=2.5)add(families.steel,box(THREE,29.5,.20,.18,M.galvHi),'RA_SupportSteel_MainCross'+z,0,-.05,z);

 // Primary photo: one foreground line of eight low condensers and one tall bank of nine.
 for(let i=0;i<FRONT_LOW_COUNT;i++)lowUnit(-9.5+i*2.72,3.25+(i%2)*.10,i+1).userData.viewLayer='front';
 for(let i=0;i<FRONT_TALL_COUNT;i++)tallUnit(-10.7+i*2.68,-.15+(i%3)*-.10,i+1).userData.viewLayer='front';

 // Distant skyline equipment seen behind the main banks.
 for(let i=0;i<6;i++){const tag='RA_DistantTower_'+(i+1),g=new THREE.Group();g.name=tag;g.position.set(-11.4+i*4.3,.10,-6.8-(i%2)*.45);families.tall.add(g);add(g,new THREE.Mesh(roundedCabinetGeometry(THREE,3.15,2.25,2.1,.08,.03),M.creamShade),tag+'_Body',0,1.18,0);buildLouverBank(g,tag+'_Face',0,1.18,1.08,2.65,1.10);buildDualFanDeck(g,tag,2.36,2.34,0);for(const sx of [-1.28,1.28])add(g,box(THREE,.22,.18,2.15,M.dark),tag+'_Base',sx,.02,0);}

 // Foreground utility rail, cable tray and the visible black service loops.
 for(let x=-14;x<=14;x+=2.8)add(families.safety,box(THREE,.09,1.15,.09,M.creamHi),'RA_Safety_FrontPost'+x,x,.60,6.28);
 add(families.safety,box(THREE,28.5,.28,.28,M.creamHi),'RA_Safety_FrontTopBeam',0,1.07,6.28);
 add(families.services,box(THREE,28.3,.14,.42,M.galv),'RA_Services_MainCableTray',0,.63,5.72);
 for(let i=0;i<FRONT_LOW_COUNT;i++)buildHoseLoop(families.services,'RA_Services_FrontLoop'+i,-9.5+i*2.72,1.02,4.16,.52,.64);

 // Rear photo: horizontal coil units, stair opening, CCTV and raised towers.
 horizontalCoilUnit(-3.3,-6.3,1).userData.viewLayer='rear';horizontalCoilUnit(.15,-6.3,2).userData.viewLayer='rear';
 const landing=add(families.access,box(THREE,5.8,.15,1.0,M.galv),'RA_Stair_Landing',10.25,.12,-7.15);landing.receiveShadow=true;
 add(families.context,box(THREE,5.8,.12,4.45,M.dark),'RA_Context_StairVoid',10.25,-.12,-5.42);
 add(families.context,box(THREE,5.9,2.1,.18,M.roof),'RA_Context_StairShaftRear',10.25,-1.05,-3.15);
 add(families.context,box(THREE,.18,2.1,4.45,M.roof),'RA_Context_StairShaftEast',13.15,-1.05,-5.42);
 for(let i=0;i<10;i++){const y=.02-i*.24,z=-6.75+i*.39;add(families.access,box(THREE,3.05,.10,.44,M.galv),'RA_Stair_Tread'+i,9.2,y,z);}
 for(const side of [-1,1]){beamBetween(THREE,families.access,new THREE.Vector3(9.2+side*1.54,.02,-6.86),new THREE.Vector3(9.2+side*1.54,-2.28,-3.20),.06,M.galv,'RA_Stair_Stringer'+side);beamBetween(THREE,families.safety,new THREE.Vector3(9.2+side*1.58,1.12,-6.86),new THREE.Vector3(9.2+side*1.58,-1.16,-3.20),.045,M.galvHi,'RA_Safety_StairHandrail'+side);for(let i=0;i<6;i++){const t=i/5;beamBetween(THREE,families.safety,new THREE.Vector3(9.2+side*1.58,.10-i*.45,-6.75+i*.72),new THREE.Vector3(9.2+side*1.58,1.10-i*.45,-6.75+i*.72),.035,M.galvHi,'RA_Safety_StairPost'+side+'_'+i);}}
 for(const [i,x] of [[1,10.9],[2,14.0]]){const baseY=2.65;tallUnit(x,-7.8,i,Math.PI,families.elevated,.96,baseY);const ex=x;for(const sx of [-.88,.88])for(const sz of [-.58,.58])add(families.steel,box(THREE,.18,2.70,.18,M.galv),'RA_SupportSteel_ElevLeg'+i+'_'+sx+'_'+sz,ex+sx,1.42,-7.8+sz);for(const zz of [-8.38,-7.22]){beamBetween(THREE,families.steel,new THREE.Vector3(ex-.90,.12,zz),new THREE.Vector3(ex+.90,2.70,zz),.055,M.galv,'RA_SupportSteel_ElevBrace'+i+'A'+zz);beamBetween(THREE,families.steel,new THREE.Vector3(ex+.90,.12,zz),new THREE.Vector3(ex-.90,2.70,zz),.055,M.galv,'RA_SupportSteel_ElevBrace'+i+'B'+zz);}}
 for(const [i,x,z,h] of [[1,-11.4,-4.8,4.6],[2,5.2,-7.1,4.15]]){add(families.safety,cyl(THREE,.055,h,M.galvHi,10),'RA_Safety_CameraPole'+i,x,h/2,z);const arm=beamBetween(THREE,families.safety,new THREE.Vector3(x,h-.15,z),new THREE.Vector3(x+.55,h-.12,z),.045,M.galvHi,'RA_Safety_CameraArm'+i);const head=add(families.safety,new THREE.Mesh(roundedCabinetGeometry(THREE,.46,.25,.62,.035,.015),M.dark),'RA_Safety_CameraHead'+i,x+.70,h-.14,z);head.rotation.y=Math.PI/2-.16;add(families.safety,box(THREE,.35,.22,.04,M.glass),'RA_Safety_CameraLens'+i,x+.705,h-.14,z-.32);}
 // Guardrail around the rear opening and elevated service zone.
 for(const [x,z] of [[7.25,-7.55],[7.25,-3.15],[13.2,-3.15],[15,-6.9]])add(families.safety,box(THREE,.08,1.25,.08,M.galvHi),'RA_Safety_OpenPost'+x+'_'+z,x,.67,z);
 beamBetween(THREE,families.safety,new THREE.Vector3(7.25,1.24,-7.55),new THREE.Vector3(7.25,1.24,-3.15),.045,M.galvHi,'RA_Safety_OpenRailWest');beamBetween(THREE,families.safety,new THREE.Vector3(7.25,1.24,-3.15),new THREE.Vector3(13.2,1.24,-3.15),.045,M.galvHi,'RA_Safety_OpenRailNorth');

 root.userData.sculptRuntime={schemaVersion:2,model:'rooftop-ac-outdoor-unit-reference-rebuild',fixedReferenceViews:true,explodeAvailable:false,clickable:true,components:[
  {systemId:'low-units',nodePattern:'^RA_LowUnit_',pivot:[0,1,3.25],sockets:['service-front','fan-deck'],collider:{type:'box',size:[22,2,2]}},
  {systemId:'tall-units',nodePattern:'^RA_(TallUnit|DistantTower)_',pivot:[0,2,-2],sockets:['coil-face','fan-deck'],collider:{type:'box',size:[29,5,9]}},
  {systemId:'elevated',nodePattern:'^RA_Elevated_',pivot:[12.5,4.2,-7.8],sockets:['support-frame'],collider:{type:'box',size:[6,7,3]}},
  {systemId:'support-steel',nodePattern:'^RA_SupportSteel_',pivot:[0,0,0],sockets:['equipment-feet'],collider:{type:'box',size:[31,4,20]}},
  {systemId:'grating-access',nodePattern:'^RA_(Grating|Stair_)',pivot:[0,0,0],sockets:['stair-opening'],collider:{type:'box',size:[31,3,20]}},
  {systemId:'services',nodePattern:'^RA_Services_',pivot:[0,.6,5],sockets:['hose-couplings'],collider:{type:'box',size:[29,2,3]}},
  {systemId:'safety',nodePattern:'^RA_Safety_',pivot:[0,1,0],sockets:['rail-posts','camera-poles'],collider:{type:'box',size:[31,5,20]}}
 ]};
 return root;
}
window.LMRooftopAcModel={create,makeCoilTexture,roundedCabinetGeometry};
})();
