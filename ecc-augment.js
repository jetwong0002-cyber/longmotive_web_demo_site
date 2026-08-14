/* Reference-derived procedural augmentation for the ECC monitoring-room GLB. */
(function(){
'use strict';

function canvasTexture(THREE,w,h,paint){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');paint(g,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=8;t.needsUpdate=true;return t;
}

function seeded(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296);}

function makeDashboardTexture(THREE,seed=812){
  const rnd=seeded(seed);
  return canvasTexture(THREE,1024,512,(g,w,h)=>{
    const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#06131a');bg.addColorStop(1,'#0c2630');g.fillStyle=bg;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(47,195,215,.22)';g.lineWidth=1;
    for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
    for(let y=0;y<h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
    for(let panel=0;panel<8;panel++){
      const px=20+(panel%4)*248,py=18+Math.floor(panel/4)*244;
      g.fillStyle='rgba(4,18,25,.84)';g.fillRect(px,py,224,218);g.strokeStyle='#2c6d77';g.strokeRect(px+.5,py+.5,223,217);
      g.strokeStyle=panel%3===0?'#79d7e8':panel%3===1?'#64c77b':'#d7b453';g.lineWidth=2;g.beginPath();
      for(let i=0;i<18;i++){const x=px+10+i*12,y=py+120+Math.sin(i*.72+panel)*28+(rnd()-.5)*12;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
      for(let i=0;i<5;i++){g.fillStyle=`rgba(${60+i*18},${150+i*8},${170+i*5},.72)`;g.fillRect(px+12,py+18+i*17,55+rnd()*110,6);}
      g.strokeStyle='rgba(132,226,233,.48)';for(let i=0;i<5;i++){g.beginPath();g.moveTo(px+18+i*38,py+168);g.lineTo(px+30+i*38,py+148-rnd()*45);g.lineTo(px+48+i*38,py+181-rnd()*35);g.stroke();}
    }
  });
}

function makeCctvTexture(THREE,seed=421){
  const rnd=seeded(seed);
  return canvasTexture(THREE,768,512,(g,w,h)=>{
    g.fillStyle='#071015';g.fillRect(0,0,w,h);
    const cols=3,rows=2,pad=8,cw=(w-pad*(cols+1))/cols,ch=(h-pad*(rows+1))/rows;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const x=pad+c*(cw+pad),y=pad+r*(ch+pad);
      const sky=g.createLinearGradient(x,y,x,y+ch);sky.addColorStop(0,c%2?'#25485a':'#473d3a');sky.addColorStop(1,'#142027');g.fillStyle=sky;g.fillRect(x,y,cw,ch);
      g.fillStyle='rgba(215,225,220,.55)';g.fillRect(x+cw*.06,y+ch*.58,cw*.88,ch*.08);
      g.fillStyle=c===1?'#b82720':'#657984';g.fillRect(x+cw*(.15+r*.12),y+ch*.24,cw*.14,ch*.38);
      g.strokeStyle='rgba(238,248,248,.5)';g.lineWidth=2;for(let i=0;i<4;i++){g.beginPath();g.moveTo(x+cw*(.05+i*.22),y+ch);g.lineTo(x+cw*(.38+i*.13),y+ch*.12);g.stroke();}
      g.fillStyle='rgba(4,10,13,.62)';g.fillRect(x,y+ch-18,cw,18);
      g.fillStyle=rnd()>.5?'#e14c3c':'#54bdd2';g.beginPath();g.arc(x+12,y+ch-9,3,0,Math.PI*2);g.fill();
    }
  });
}

function makeFoilTexture(THREE){
  const rnd=seeded(1907);
  const t=canvasTexture(THREE,768,768,(g,w,h)=>{
    g.fillStyle='#73787b';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=192)for(let x=0;x<w;x+=192){
      const v=100+Math.floor(rnd()*30);g.fillStyle=`rgb(${v},${v+3},${v+5})`;g.fillRect(x+4,y+4,184,184);
      g.strokeStyle='rgba(31,35,36,.75)';g.lineWidth=5;g.strokeRect(x+2,y+2,188,188);
      g.strokeStyle='rgba(211,216,215,.35)';g.lineWidth=2;for(let k=0;k<9;k++){g.beginPath();g.moveTo(x+12,y+20+k*18);g.lineTo(x+180,y+14+k*19);g.stroke();}
      g.fillStyle='rgba(95,28,24,.48)';g.fillRect(x+24,y+30,114,7);g.fillRect(x+38,y+61,82,5);
    }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2.7,1.45);return t;
}

function makePerforationTexture(THREE){
  const t=canvasTexture(THREE,512,128,(g,w,h)=>{
    g.fillStyle='#15191c';g.fillRect(0,0,w,h);g.fillStyle='#70777b';
    for(let y=13;y<h;y+=18)for(let x=14+(y%36?9:0);x<w;x+=22){g.beginPath();g.arc(x,y,3.3,0,Math.PI*2);g.fill();}
  });t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.8,1);return t;
}

function roundedTop(THREE,w,d,r,material,name){
  const s=new THREE.Shape();const x=-w/2,z=-d/2;
  s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);
  const geo=new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:2,curveSegments:6});
  const m=new THREE.Mesh(geo,material);m.name=name;m.rotation.x=Math.PI/2;return m;
}

function screenMaterial(THREE,map,intensity=1){return new THREE.MeshBasicMaterial({map,color:0xffffff,toneMapped:false,side:THREE.DoubleSide,transparent:false,opacity:Math.min(1,intensity)});}

function create(THREE,options={}){
  const root=new THREE.Group();root.name='ECC_Augment_Root';
  const glb=options.glbRoot||null;
  const mats={
    panel:new THREE.MeshStandardMaterial({color:0x171b1e,roughness:.82,metalness:.08}),
    seam:new THREE.MeshStandardMaterial({color:0x090b0c,roughness:.9,metalness:.05}),
    floor:new THREE.MeshStandardMaterial({color:0xc9c6bd,roughness:.72,metalness:.02}),
    ceiling:new THREE.MeshStandardMaterial({color:0x080a0b,roughness:.92,metalness:.04}),
    white:new THREE.MeshStandardMaterial({color:0xe8e7e1,roughness:.45,metalness:.02}),
    black:new THREE.MeshStandardMaterial({color:0x171b1e,roughness:.7,metalness:.18}),
    red:new THREE.MeshStandardMaterial({color:0xa20d14,roughness:.4,metalness:.25}),
    foil:new THREE.MeshStandardMaterial({map:makeFoilTexture(THREE),color:0xffffff,roughness:.55,metalness:.55,side:THREE.DoubleSide})
  };
  if(glb){
    const materialFor=(name)=>{if(name==='ECC_WallF')return mats.panel;if(name==='ECC_Floor')return mats.floor;if(name==='ECC_CeilSlab'||name==='ECC_Baffles')return mats.ceiling;return null;};
    glb.traverse(o=>{if(!o.isMesh)return;const m=materialFor(o.name);if(m)o.material=m;});
  }

  const architecture=new THREE.Group();architecture.name='ECC_ARCH_Augment';root.add(architecture);
  // Finished video-wall elevation seam grid.
  for(let x=.22;x<8;x+=.5){const m=new THREE.Mesh(new THREE.BoxGeometry(.012,3.18,.025),mats.seam);m.name='ECC_ARCH_PanelSeamV';m.position.set(x,1.59,-.126);architecture.add(m);}
  for(let y=.18;y<3.2;y+=.55){const m=new THREE.Mesh(new THREE.BoxGeometry(7.95,.012,.025),mats.seam);m.name='ECC_ARCH_PanelSeamH';m.position.set(4,y,-.127);architecture.add(m);}

  // Adjacent exposed construction-phase wall, only visible during the right sweep.
  const foilWall=new THREE.Mesh(new THREE.PlaneGeometry(5.9,3.24),mats.foil);foilWall.name='ECC_ARCH_FoilWall';foilWall.rotation.y=Math.PI/2;foilWall.position.set(-.135,1.62,-3.0);architecture.add(foilWall);
  const floorClosure=new THREE.Mesh(new THREE.PlaneGeometry(8,6),mats.floor);floorClosure.name='ECC_ARCH_FloorClosure';floorClosure.rotation.x=-Math.PI/2;floorClosure.position.set(4,-.005,-3);floorClosure.receiveShadow=true;architecture.add(floorClosure);

  const vw=new THREE.Group();vw.name='ECC_VW_Augment';root.add(vw);
  const dash=makeDashboardTexture(THREE),cctv=makeCctvTexture(THREE);
  const vwDash=new THREE.Mesh(new THREE.PlaneGeometry(4.45,1.33),screenMaterial(THREE,dash));vwDash.name='ECC_VW_Dashboard';vwDash.position.set(3.18,1.664,-.103);vw.add(vwDash);
  const vwCctv=new THREE.Mesh(new THREE.PlaneGeometry(1.58,1.33),screenMaterial(THREE,cctv));vwCctv.name='ECC_VW_CCTV';vwCctv.position.set(6.205,1.664,-.104);vw.add(vwCctv);

  const desktopTex=makeDashboardTexture(THREE,1441);
  const deskCenters=[2.6,6.1];
  deskCenters.forEach((cx,di)=>{
    const id=di?'D2':'D1',grp=new THREE.Group();grp.name=`ECC_${id}_Augment`;root.add(grp);
    const top=roundedTop(THREE,3.16,.84,.15,mats.white,`ECC_${id}_RoundedTop`);top.position.set(cx,.807,-3.12);grp.add(top);
    const perf=new THREE.Mesh(new THREE.PlaneGeometry(2.78,.47),new THREE.MeshStandardMaterial({map:makePerforationTexture(THREE),color:0xffffff,roughness:.7,metalness:.18,side:THREE.DoubleSide}));perf.name=`ECC_${id}_PerforatedModesty`;perf.position.set(cx,.42,-3.145);grp.add(perf);
    for(const mx of [cx-.8,cx+.8]){const p=new THREE.Mesh(new THREE.PlaneGeometry(.57,.32),screenMaterial(THREE,desktopTex));p.name=`ECC_${id}_ScreenOverlay`;p.rotation.y=Math.PI;p.position.set(mx,1.225,-2.604);grp.add(p);}
  });

  const fc=new THREE.Group();fc.name='ECC_FC_Augment';root.add(fc);
  const fcScreen=new THREE.Mesh(new THREE.PlaneGeometry(.48,.27),screenMaterial(THREE,makeDashboardTexture(THREE,292)));fcScreen.name='ECC_FC_CommandDisplay';fcScreen.rotation.y=Math.PI/2;fcScreen.position.set(.661,1.235,-2.505);fc.add(fcScreen);
  for(const z of [-2.25,-1.78])for(const y of [.3,.56]){const h=new THREE.Mesh(new THREE.BoxGeometry(.035,.025,.22),mats.black);h.name='ECC_FC_CabinetHandle';h.position.set(.82,y,z);fc.add(h);}
  // Right-side wall display evidenced in the second photograph.
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.11,1.05,2.05),mats.black);frame.name='ECC_FC_WallDisplayFrame';frame.position.set(-.055,1.72,-4.42);fc.add(frame);
  const sideScreen=new THREE.Mesh(new THREE.PlaneGeometry(1.84,.85),screenMaterial(THREE,makeCctvTexture(THREE,991)));sideScreen.name='ECC_FC_WallDisplayScreen';sideScreen.rotation.y=Math.PI/2;sideScreen.position.set(.006,1.72,-4.42);fc.add(sideScreen);

  root.userData.sculptRuntime={schemaVersion:1,model:'ecc-monitoring-room-refinement',fixedEye:true,explodeAvailable:false,clickable:true,components:[
    {systemId:'VW',nodePattern:'^ECC_VW_',pivot:[4,1.65,0],sockets:['wall-frame'],collider:{type:'box',size:[6.4,1.8,.2]}},
    {systemId:'D1',nodePattern:'^ECC_D1_|^ECC_Desk1_|^ECC_Chair_O',pivot:[2.6,.6,-2.7],sockets:['worktop'],collider:{type:'box',size:[3.2,1.3,1.2]}},
    {systemId:'D2',nodePattern:'^ECC_D2_|^ECC_Desk2_|^ECC_Chair_B',pivot:[6.1,.6,-2.7],sockets:['worktop'],collider:{type:'box',size:[3.2,1.3,1.2]}},
    {systemId:'FC',nodePattern:'^ECC_FC_',pivot:[0,1.2,-2.6],sockets:['console-face','wall-display'],collider:{type:'box',size:[1.4,2.4,3.4]}}
  ]};
  return root;
}

window.LMEccAugment={create,makeDashboardTexture,makeCctvTexture,makeFoilTexture};
})();
