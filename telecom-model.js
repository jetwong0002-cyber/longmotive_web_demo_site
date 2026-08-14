/* telecom-model.js — code-only procedural replica of the Longmotive telecom
   operator access room (运营商接入间).

   Primary reference : 运营商接入间1.jpg — governs geometry, materials, camera.
   Secondary         : 运营商接入间2.jpg, 运营商接入间3.jpg — the same Canatal
                       precision-AC units seen square on and from the far end;
                       source for the cabinet face and the beige control panel.

   No binary assets — every map is drawn into a canvas here at build time, the
   same way fpcooling-model.js and opencooling-model.js do it. Mesh names keep
   the TA_* families that telecom-viewer.js raycasts and groups the HUD by.

   THE LAYOUT BELOW IS SOLVED, NOT EYEBALLED. Both cabinets' front/flank corner
   columns, their cabinet-top row and the foot of their beige transit wrap were
   thresholded out of the photo, and the camera was fitted to all of it:

     - the cabinet top is a known height over a known eye level, so
       k(x) = (333 - y_top(x)) / (Htop - eye) is px-per-metre at each column,
       and it comes out LINEAR in image x. Its intercept and slope collapse the
       camera to a one-parameter family in focal length.
     - scanning that family against the six measured plan corners bottoms out
       at f = 400 px on a 1000 px wide frame — hfov 102.7 deg — with a corner
       residual of 2.4 px and cabinet-top rows correct to 1 px.
     - unit A shows its RIGHT flank and unit B its LEFT, which is only possible
       if the camera's foot on the wall normal falls between them. Earlier fits
       that ignored that landed on mirrored nonsense.

   Two things fell out of the fit rather than being assumed, and both correct a
   guess that had been wrong: the cabinets are 1.40 m wide, not the 2.20 m a
   first pass assumed (that single guess is what made the plan and the height
   solves disagree by a factor of 1.5), and the slab soffit is only 2.85 m,
   which is why the ceiling reads so busy and so close in the photo.

   RE-SOLVE IF THE CABINET DIMENSIONS CHANGE. Do not nudge the camera numbers
   in telecom-viewer.js on their own — they are tied to this geometry.

   Scene frame: floor y=0, the equipment wall is z=0 and the room runs to +z,
   +x is right as you face that wall, and the reference standpoint is at
   x=0 by construction.

   window.LMTelecomModel.create(THREE) -> THREE.Group
*/
(function(){

/* ---------------- dimensions (metres, solved off the reference) ---------------- */
const P={
  xL     : -3.98,  // left wall — unit A stands almost in this corner
  xR     :  2.30,  // right wall — the thin lit sliver at the frame edge
  zF     :  6.60,  // far wall, behind the standpoint
  ceilH  :  2.85,  // slab soffit
  skirt  :  0.10,

  unitW  : 1.398,  // Canatal cabinet — both units are the same product
  unitD  : 1.187,
  unitTop: 2.00,   // over the floor, base frame included: this sets the metre
  baseH  : 0.18,
  wrapTop: 1.33,   // beige transit wrap band
  wrapBot: 0.30,

  aX     : -3.490, // unit A, left edge
  bX     :  0.238, // unit B (CANATAL), left edge

  colX   :  0.09,  // boxed pilaster between the pipe bank and unit B
  colW   :  0.34,
  colD   :  0.26,

  panelZ :  2.64,  // beige control panel, on the left wall
  panelW :  0.72,
  panelD :  0.28,
  panelY0:  0.06,
  panelH :  1.66,

  pipeZ  :  0.55,  // riser bank standoff from the equipment wall
  trayY  :  2.78
};
/* riser centres, straight off the measured column positions */
P.pipes=[{x:-1.62,r:0.078},{x:-1.41,r:0.058},{x:-0.76,r:0.062},{x:-0.54,r:0.055}];

/* ---------------- palette ----------------
   Two families only: painted board (walls, pilaster, panel) in a warm off-white
   and equipment in cool charcoal/galvanised. The beige wrap and the yellow tray
   are the sole accents, and they are the two things the eye lands on first in
   the photo — keep them the only saturated surfaces. */
/* Values were set by measuring mean grey in four horizontal bands of the
   reference and of a test render at matched size, then closing the gap:
   ceiling 105/170, upper wall 151/171, lower wall 86/109, floor 96/63. The
   soffit is much darker than it looks and the screed much lighter — get those
   two the wrong way round and the room reads as a bright studio box. */
const C={
  wall    : 0xc0bdb5,
  wallDk  : 0x9d9a93,
  ceil    : 0x5f5d59,
  beam    : 0x8a8883,
  floor   : 0x8a8f93,   // grey epoxy, polished
  deep    : 0x64696d,   // sub-floor the reflection reads against
  skirt   : 0x222528,
  cabinet : 0x33373c,   // Canatal charcoal
  cabTop  : 0x43474d,
  wrap    : 0xc9bb9c,   // beige transit wrap
  galv    : 0xa6acb0,
  galvDk  : 0x7b8185,
  panel   : 0xc7bea0,
  pipe    : 0x1d2023,   // black insulated chilled water
  tray    : 0xcfbd2c,
  fire    : 0xb0302a,
  lamp    : 0xf4f7ff
};

/* ---------------- canvas texture helpers ---------------- */
function tex(THREE,w,h,draw,repX,repY,srgb){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(repX||1,repY||1);
  t.anisotropy=16;                       // the floor is read at a hard grazing angle
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

/* painted board: a faint roller mottle only. Any real grain here reads as bare
   concrete and the room stops looking like a finished fit-out. */
function wallMap(THREE){
  return tex(THREE,256,256,(g,w,h)=>{
    g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
    for(let i=0;i<140;i++){
      g.fillStyle='rgba(198,195,188,'+(0.02+Math.random()*0.028)+')';
      g.beginPath();g.arc(Math.random()*w,Math.random()*h,8+Math.random()*24,0,7);g.fill();
    }
  },3,3,true);
}

/* polished epoxy: broad soft cloud so the specular has something to break on,
   plus a few scuffs. Very low contrast — the sheen comes from roughness. */
function floorMap(THREE){
  return tex(THREE,512,512,(g,w,h)=>{
    g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
    for(let i=0;i<70;i++){
      g.fillStyle='rgba(150,158,164,'+(0.05+Math.random()*0.09)+')';
      g.beginPath();g.arc(Math.random()*w,Math.random()*h,40+Math.random()*120,0,7);g.fill();
    }
    for(let i=0;i<44;i++){
      g.strokeStyle='rgba(198,204,208,0.10)';g.lineWidth=1+Math.random()*2;
      const x=Math.random()*w,y=Math.random()*h,a=Math.random()*6.28,l=20+Math.random()*90;
      g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();
    }
  },2,2,true);
}
function floorRough(THREE){
  return tex(THREE,512,512,(g,w,h)=>{
    g.fillStyle='#2e2e2e';g.fillRect(0,0,w,h);
    for(let i=0;i<90;i++){
      g.fillStyle='rgba(255,255,255,'+(0.05+Math.random()*0.10)+')';
      g.beginPath();g.arc(Math.random()*w,Math.random()*h,30+Math.random()*110,0,7);g.fill();
    }
  },2,2,false);
}

/* the beige transit wrap: quilted board taped over the coil face. Detail is
   horizontal creases and one vertical tape seam, both soft — it is paper, so
   no hard edges and no sheen. */
function wrapMap(THREE){
  return tex(THREE,256,256,(g,w,h)=>{
    g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
    for(let y=6;y<h;y+=11){
      g.fillStyle='rgba(176,164,138,'+(0.13+Math.random()*0.10)+')';
      g.fillRect(0,y+Math.random()*2,w,1.4);
      g.fillStyle='rgba(255,255,255,0.28)';g.fillRect(0,y+2,w,1);
    }
    g.fillStyle='rgba(246,242,232,0.55)';g.fillRect(w*0.47,0,w*0.06,h);
    g.fillStyle='rgba(168,156,130,0.16)';
    g.fillRect(w*0.47,0,1.5,h);g.fillRect(w*0.53,0,1.5,h);
    for(let i=0;i<15;i++){
      g.strokeStyle='rgba(158,146,122,0.15)';g.lineWidth=1;
      const y=Math.random()*h;g.beginPath();g.moveTo(0,y);
      g.bezierCurveTo(w*.3,y+6,w*.7,y-6,w,y+2);g.stroke();
    }
  },1,1,true);
}

/* cabinet face: fine hairline sheet, nothing more */
function cabMap(THREE){
  return tex(THREE,256,256,(g,w,h)=>{
    g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=2){
      g.fillStyle='rgba(208,212,216,'+(0.04+Math.random()*0.05)+')';
      g.fillRect(0,y,w,1);
    }
  },1,1,true);
}

function badgeMap(THREE){
  return tex(THREE,512,128,(g,w,h)=>{
    g.clearRect(0,0,w,h);
    g.fillStyle='#b0322c';
    g.beginPath();g.moveTo(16,h*.28);g.lineTo(54,h*.28);g.lineTo(34,h*.74);g.closePath();g.fill();
    g.fillStyle='#e6e9ec';g.font='bold 60px Arial, Helvetica, sans-serif';
    g.fillText('CANATAL',68,h*.68);
  },1,1,true);
}
function labelMap(THREE){
  return tex(THREE,256,128,(g,w,h)=>{
    g.fillStyle='#f2f0ea';g.fillRect(0,0,w,h);
    g.strokeStyle='#b7b3a9';g.lineWidth=3;g.strokeRect(2,2,w-4,h-4);
    g.fillStyle='#b0322c';g.fillRect(12,14,w-24,9);
    g.fillStyle='#5a5f66';
    for(let i=0;i<5;i++)g.fillRect(12,36+i*15,(w-24)*(0.45+Math.random()*0.5),5);
  },1,1,true);
}

/* yellow basket tray as an alphaMap grid, so the mesh reads through instead of
   a solid yellow slab. Cell size is tuned to the locked distance — finer and it
   aliases straight back into a flat wash. */
function meshAlpha(THREE,rx,ry){
  return tex(THREE,128,128,(g,w,h)=>{
    g.fillStyle='#000000';g.fillRect(0,0,w,h);
    g.strokeStyle='#ffffff';g.lineWidth=3.2;
    for(let i=0;i<=w;i+=16){
      g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();
      g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();
    }
  },rx||1,ry||1,false);
}

/* ---------------- mesh helpers ---------------- */
let T,G,M;
const box=(name,cx,cy,cz,sx,sy,sz,mat)=>{
  const m=new T.Mesh(new T.BoxGeometry(sx,sy,sz),mat);
  m.name=name;m.position.set(cx,cy,cz);m.castShadow=true;m.receiveShadow=true;
  G.add(m);return m;
};
const tube=(name,cx,cy,cz,r,len,mat,axis,seg)=>{
  const m=new T.Mesh(new T.CylinderGeometry(r,r,len,seg||14),mat);
  m.name=name;m.position.set(cx,cy,cz);
  if(axis==='x')m.rotation.z=Math.PI/2;
  if(axis==='z')m.rotation.x=Math.PI/2;
  m.castShadow=true;m.receiveShadow=true;G.add(m);return m;
};
const quad=(name,cx,cy,cz,sx,sy,mat,rx,ry)=>{
  const m=new T.Mesh(new T.PlaneGeometry(sx,sy),mat);
  m.name=name;m.position.set(cx,cy,cz);m.rotation.set(rx||0,ry||0,0);
  m.receiveShadow=true;G.add(m);return m;
};

function materials(){
  const wm=wallMap(T);
  return {
    wall  : new T.MeshStandardMaterial({color:C.wall,map:wm,roughness:.94,metalness:.02}),
    wallDk: new T.MeshStandardMaterial({color:C.wallDk,map:wm,roughness:.94,metalness:.02}),
    ceil  : new T.MeshStandardMaterial({color:C.ceil,roughness:.96,metalness:.02}),
    beam  : new T.MeshStandardMaterial({color:C.beam,roughness:.90,metalness:.04}),
    floor : new T.MeshStandardMaterial({color:C.floor,map:floorMap(T),
              roughnessMap:floorRough(T),roughness:.42,metalness:.24,
              transparent:true,opacity:.90}),
    deep  : new T.MeshStandardMaterial({color:C.deep,roughness:.98,metalness:0}),
    skirt : new T.MeshStandardMaterial({color:C.skirt,roughness:.78,metalness:.06}),
    cab   : new T.MeshStandardMaterial({color:C.cabinet,map:cabMap(T),roughness:.56,metalness:.30}),
    cabTop: new T.MeshStandardMaterial({color:C.cabTop,roughness:.52,metalness:.34}),
    wrap  : new T.MeshStandardMaterial({color:C.wrap,map:wrapMap(T),roughness:.95,metalness:0}),
    galv  : new T.MeshStandardMaterial({color:C.galv,roughness:.44,metalness:.70}),
    galvDk: new T.MeshStandardMaterial({color:C.galvDk,roughness:.52,metalness:.64}),
    panel : new T.MeshStandardMaterial({color:C.panel,roughness:.60,metalness:.10}),
    pipe  : new T.MeshStandardMaterial({color:C.pipe,roughness:.70,metalness:.18}),
    fire  : new T.MeshStandardMaterial({color:C.fire,roughness:.46,metalness:.20}),
    white : new T.MeshStandardMaterial({color:0xe6e4dd,roughness:.66,metalness:.05}),
    dark  : new T.MeshStandardMaterial({color:0x1a1d20,roughness:.70,metalness:.20}),
    lamp  : new T.MeshStandardMaterial({color:C.lamp,emissive:0xffffff,emissiveIntensity:2.2,
              roughness:.30,metalness:0,toneMapped:false}),
    badge : new T.MeshBasicMaterial({map:badgeMap(T),transparent:true,toneMapped:false}),
    label : new T.MeshBasicMaterial({map:labelMap(T),toneMapped:false}),
    tray  : new T.MeshStandardMaterial({color:C.tray,roughness:.58,metalness:.34,
              alphaMap:meshAlpha(T),transparent:true,alphaTest:.40,side:T.DoubleSide})
  };
}

/* ---------------- room shell ---------------- */
function shell(){
  const L=P.xL,R=P.xR,D=P.zF,Hh=P.ceilH,W=R-L;
  quad('TA_Floor',(L+R)/2,0,D/2,W+0.4,D+0.4,M.floor,-Math.PI/2);
  // an opaque plate well below the slab: the floor is deliberately 12%
  // transparent so the mirrored plant reads through it, and without this the
  // page background would show through with it
  quad('TA_Deep',(L+R)/2,-2.60,D/2,W+8,D+8,M.deep,-Math.PI/2);
  box('TA_WallBack',(L+R)/2,Hh/2,-0.07,W+0.3,Hh,0.14,M.wall);
  box('TA_WallLeft',L-0.07,Hh/2,D/2,0.14,Hh,D+0.3,M.wall);
  box('TA_WallRight',R+0.07,Hh/2,D/2,0.14,Hh,D+0.3,M.wall);
  box('TA_WallFront',(L+R)/2,Hh/2,D+0.07,W+0.3,Hh,0.14,M.wall);
  box('TA_Ceil',(L+R)/2,Hh+0.08,D/2,W+0.3,0.16,D+0.3,M.ceil);
  box('TA_SkirtBack',(L+R)/2,P.skirt/2,0.04,W,P.skirt,0.07,M.skirt);
  box('TA_SkirtLeft',L+0.04,P.skirt/2,D/2,0.07,P.skirt,D,M.skirt);
  box('TA_SkirtRight',R-0.04,P.skirt/2,D/2,0.07,P.skirt,D,M.skirt);
  // boxed pilaster standing proud of the equipment wall between the plant
  box('TA_ColBody',P.colX,Hh/2,P.colD/2,P.colW,Hh,P.colD,M.wallDk);
  box('TA_ColHead',P.colX,Hh-0.10,P.colD/2+0.01,P.colW+0.05,0.20,P.colD+0.02,M.wallDk);
  // ONE downstand beam — the broad grey band the trays and battens hang under.
  // A second at z=4.10 was only 0.5 m from the standpoint and cut a black slab
  // across the whole top of the locked frame.
  box('TA_Beam1',(L+R)/2,Hh-0.16,1.95,W+0.3,0.30,0.28,M.beam);
}

/* ---------------- Canatal precision-AC unit ----------------
   Band proportions matter more than absolute size: base frame .18, cabinet to
   2.00, and the beige wrap covering .30 to 1.33 — the lower 57% of the cabinet.
   Get the wrap band wrong and the unit reads as a plain black box. */
function crac(fam){
  const x0=fam==='TA_CracA'?P.aX:P.bX;
  const cx=x0+P.unitW/2, cz=P.unitD/2, zf=P.unitD;
  const yc=P.baseH+(P.unitTop-P.baseH)/2, hh=P.unitTop-P.baseH;
  box(fam+'_Body',cx,yc,cz,P.unitW,hh,P.unitD,M.cab);
  box(fam+'_TopCap',cx,P.unitTop-0.04,cz,P.unitW+0.025,0.08,P.unitD+0.025,M.cabTop);
  box(fam+'_TopRecess',cx,P.unitTop-0.01,cz,P.unitW-0.26,0.05,P.unitD-0.24,M.dark);
  box(fam+'_Base',cx,P.baseH-0.035,cz,P.unitW-0.05,0.07,P.unitD-0.09,M.galv);
  for(let i=0;i<4;i++)
    box(fam+'_Foot'+i,cx+(i%2?1:-1)*(P.unitW/2-0.14),P.baseH/2-0.03,
        cz+(i<2?-1:1)*(P.unitD/2-0.15),0.055,P.baseH,0.055,M.galvDk);
  box(fam+'_Rail',cx,P.baseH-0.01,zf-0.03,P.unitW-0.02,0.045,0.05,M.galvDk);
  // two door leaves with a latch button each
  box(fam+'_Split',cx,yc+0.14,zf+0.004,0.010,hh-0.26,0.008,M.galvDk);
  for(let i=0;i<2;i++)
    tube(fam+'_Latch'+i,cx+(i?0.24:-0.24),1.52,zf+0.010,0.018,0.018,M.galv,'z',10);
  // beige transit wrap across the coil face — two taped panels
  for(let i=0;i<2;i++){
    const w=(P.unitW-0.05)/2;
    box(fam+'_Wrap'+i,cx+(i?0.5:-0.5)*w+(i?0.012:-0.012),
        (P.wrapTop+P.wrapBot)/2,zf+0.020,w,P.wrapTop-P.wrapBot,0.040,M.wrap);
  }
  box(fam+'_WrapLip',cx,P.wrapTop+0.012,zf+0.022,P.unitW-0.03,0.025,0.045,M.wrap);
  const bg=new T.Mesh(new T.PlaneGeometry(0.44,0.11),M.badge);
  bg.name=fam+'_Badge';bg.position.set(cx+0.30,P.unitTop-0.15,zf+0.026);G.add(bg);
  const lb=new T.Mesh(new T.PlaneGeometry(0.22,0.11),M.label);
  lb.name=fam+'_Label';lb.position.set(cx+0.24,P.wrapTop+0.15,zf+0.026);G.add(lb);
  const lb2=new T.Mesh(new T.PlaneGeometry(0.15,0.08),M.label);
  lb2.name=fam+'_Plate';lb2.position.set(cx+0.58,P.unitTop-0.14,zf+0.026);G.add(lb2);
  box(fam+'_Head',cx+0.06,P.wrapTop+0.06,zf+0.05,0.26,0.12,0.10,M.dark);
}

/* ---------------- beige control panel on the left wall ---------------- */
function controlPanel(){
  const x=P.xL+P.panelD/2, z=P.panelZ, F=x+P.panelD/2;   // face looks +x
  const cy=P.panelY0+P.panelH/2;
  box('TA_Panel_Body',x,cy,z,P.panelD,P.panelH,P.panelW,M.panel);
  box('TA_Panel_Plinth',x,P.panelY0/2,z,P.panelD-0.03,P.panelY0,P.panelW-0.04,M.dark);
  box('TA_Panel_Door',F+0.008,cy,z,0.016,P.panelH-0.09,P.panelW-0.07,M.panel);
  box('TA_Panel_Handle',F+0.028,cy-0.10,z-P.panelW/2+0.09,0.028,0.22,0.028,M.dark);
  box('TA_Panel_Meter',F+0.018,cy+0.54,z+0.07,0.018,0.08,0.11,M.dark);
  const pip=[0xc0392b,0xe08a1e,0x2f9ed0];
  for(let i=0;i<3;i++)
    tube('TA_Panel_Lamp'+i,F+0.018,cy+0.38,z+0.12-i*0.065,0.019,0.022,
      new T.MeshStandardMaterial({color:pip[i],emissive:pip[i],emissiveIntensity:.6,
        roughness:.35,metalness:.10}),'x',10);
  [[cy+0.62,0.07],[P.panelY0+0.22,0.0]].forEach((d,i)=>{
    const nm=new T.Mesh(new T.PlaneGeometry(0.13,0.045),M.label);
    nm.name='TA_Panel_Tag'+i;nm.position.set(F+0.012,d[0],z+d[1]);
    nm.rotation.y=Math.PI/2;G.add(nm);
  });
}

/* ---------------- chilled-water riser bank ----------------
   Two flow/return pairs standing off the equipment wall in the gap between the
   units — the riser x positions are the measured dark columns, not a guess.
   Each carries a paper commissioning label, a gauge on a stub and a low valve,
   and drops into a header that runs along the wall into unit A. */
function risers(){
  const zR=P.pipeZ, top=P.ceilH-0.13;   // the risers run right up into the ceiling zone
  P.pipes.forEach((p,i)=>{
    tube('TA_Pipe_Riser'+i,p.x,(0.30+top)/2,zR,p.r,top-0.30,M.pipe,'y',14);
    tube('TA_Pipe_Tag'+i,p.x,2.06,zR,p.r+0.010,0.17,M.white,'y',14);
    tube('TA_Pipe_Stub'+i,p.x,1.62,zR+0.09,0.014,0.14,M.galv,'z',10);
    tube('TA_Pipe_Gauge'+i,p.x,1.62,zR+0.18,0.048,0.030,M.galv,'z',16);
    tube('TA_Pipe_Valve'+i,p.x,0.95,zR,p.r+0.026,0.14,M.dark,'y',14);
    box('TA_Pipe_Lever'+i,p.x+0.09,0.95,zR,0.18,0.026,0.045,M.galvDk);
  });
  // bottom header running left into unit A, on short galvanised stands
  tube('TA_Pipe_Header',-2.10,0.32,zR,0.098,3.00,M.pipe,'x',18);
  tube('TA_Pipe_Flange',-0.62,0.32,zR,0.118,0.05,M.galvDk,'x',18);
  box('TA_Pipe_HeadBox',-1.35,0.36,zR,0.30,0.20,0.22,M.dark);
  for(let i=0;i<3;i++)
    box('TA_Pipe_Stand'+i,-3.10+i*0.95,0.11,zR,0.045,0.22,0.045,M.galvDk);
  tube('TA_Pipe_Spur',-3.30,0.32,zR-0.26,0.078,0.52,M.pipe,'z',14);
  // top gathering steel with the dark valve cluster slung under it
  box('TA_Pipe_Hanger',-1.08,top+0.07,zR,1.42,0.09,0.11,M.galvDk);
  box('TA_Pipe_Cluster',-1.08,top-0.06,zR,0.72,0.18,0.22,M.dark);
  for(let i=0;i<2;i++)
    box('TA_Pipe_Brace'+i,-1.72+i*1.30,P.ceilH*0.5,zR-0.12,0.045,P.ceilH,0.045,M.galvDk);
}

/* ---------------- yellow basket cable containment ---------------- */
function trays(){
  const run=(nm,x0,x1,z,w,yy)=>{
    const len=x1-x0, cx=(x0+x1)/2;
    const bed=new T.Mesh(new T.PlaneGeometry(len,w),M.tray);
    bed.name=nm+'_Bed';bed.position.set(cx,yy,z);bed.rotation.x=-Math.PI/2;G.add(bed);
    for(let s=0;s<2;s++){
      const r=new T.Mesh(new T.PlaneGeometry(len,0.09),M.tray);
      r.name=nm+'_Rail'+s;r.position.set(cx,yy+0.045,z+(s?1:-1)*w/2);G.add(r);
    }
    const n=Math.max(2,Math.round(len/1.4));
    for(let i=0;i<=n;i++){
      const x=x0+len*i/n;
      box(nm+'_Chan'+i,x,yy-0.03,z,0.045,0.045,w+0.10,M.galvDk);
      for(let s=0;s<2;s++)
        tube(nm+'_Rod'+i+'_'+s,x,(yy+P.ceilH)/2,z+(s?1:-1)*(w/2+0.03),0.007,
             P.ceilH-yy,M.galv,'y',6);
    }
  };
  // the trays hang TIGHT under the slab in the reference — a first pass had
  // them 0.25 m lower and the yellow read as a floating raft in mid-air
  // three runs, all well back of the standpoint: a fourth at z=3.42 sat 1.2 m
  // from the camera and filled the top-left quarter of the locked frame
  run('TA_Tray_A',P.xL,0.60,1.16,0.66,P.trayY);
  run('TA_Tray_B',P.xL,0.20,1.86,0.60,P.trayY-0.06);
  run('TA_Tray_C',-3.30,-0.50,2.42,0.44,P.trayY-0.12);
  const sp=new T.Mesh(new T.PlaneGeometry(0.38,1.10),M.tray);
  sp.name='TA_Tray_Spur';sp.position.set(-1.95,P.trayY-0.03,0.62);
  sp.rotation.x=-Math.PI/2;G.add(sp);
}

/* ---------------- twin-tube batten lighting ----------------
   Five fittings at the angles they sit at in the photo. They are the room's
   only real light source in the reference, so three of them carry a point
   light as well as the emissive tube. */
function lights(out){
  const mk=(nm,x,y,z,len,rot,lit)=>{
    const g0=new T.Group();g0.name=nm;g0.position.set(x,y,z);g0.rotation.y=rot;G.add(g0);
    const hs=new T.Mesh(new T.BoxGeometry(len,0.055,0.10),M.galv);
    hs.name=nm+'_Housing';hs.castShadow=true;g0.add(hs);
    for(let i=0;i<2;i++){
      const tb=new T.Mesh(new T.CylinderGeometry(0.022,0.022,len-0.12,10),M.lamp);
      tb.name=nm+'_Tube'+i;tb.rotation.z=Math.PI/2;tb.position.set(0,-0.042,i?0.030:-0.030);
      g0.add(tb);
    }
    for(let i=0;i<2;i++){
      const r=new T.Mesh(new T.CylinderGeometry(0.005,0.005,Math.max(0.02,P.ceilH-y),6),M.galv);
      r.name=nm+'_Rod'+i;r.position.set((i?1:-1)*len*0.34,(P.ceilH-y)/2,0);g0.add(r);
    }
    if(lit)out.push({x:x,y:y-0.14,z:z});
  };
  // KEEP THEM BACK. A first pass put a batten at z=3.15 and another at 4.35,
  // i.e. 1.5 m and 0.25 m from the standpoint, and each filled a quarter of the
  // frame. In the reference the nearest fitting only clips the top corner.
  mk('TA_Light_1',-3.30,2.70,3.30,1.30,Math.PI/2,true);
  mk('TA_Light_2',-2.30,2.66,1.85,1.30,0.10,true);
  mk('TA_Light_3',-0.35,2.72,2.60,1.30,0.20,false);
  mk('TA_Light_4', 1.70,2.70,1.45,1.30,Math.PI/2,true);
  mk('TA_Light_5', 1.05,2.66,3.45,1.30,Math.PI/2-0.14,false);
}

/* ---------------- sprinkler main, drops and heads ---------------- */
function fire(){
  const y=2.36;
  tube('TA_Fire_Main',-1.30,y,0.38,0.026,5.00,M.fire,'x',12);
  // the main turns down to a capped stub just clear of the pilaster, the way
  // it does in 运营商接入间1.jpg — an earlier pass looped it up over the ceiling
  tube('TA_Fire_Stub',0.55,y-0.20,0.38,0.024,0.40,M.fire,'y',12);
  tube('TA_Fire_Cap',0.55,y-0.42,0.38,0.030,0.05,M.fire,'y',12);
  [-2.95,-1.70].forEach((x,i)=>{
    tube('TA_Fire_Drop'+i,x,y-0.30,0.38,0.015,0.60,M.fire,'y',10);
    tube('TA_Fire_Head'+i,x,y-0.62,0.38,0.021,0.055,M.galv,'y',10);
    box('TA_Fire_Defl'+i,x,y-0.66,0.38,0.06,0.007,0.06,M.galv);
  });
  for(let i=0;i<4;i++)
    box('TA_Fire_Clip'+i,-3.50+i*1.25,y+0.045,0.38,0.026,0.09,0.026,M.galvDk);
}

/* ---------------- CCTV, wall duct and conduit ---------------- */
function elv(){
  // dome camera bracketed off the right-hand return, high in the corner
  box('TA_Elv_CamArm',P.xR-0.22,2.48,0.62,0.30,0.05,0.10,M.white);
  box('TA_Elv_CamBody',P.xR-0.40,2.40,0.62,0.18,0.11,0.16,M.white);
  const dm=new T.Mesh(new T.SphereGeometry(0.065,14,9,0,6.3,Math.PI/2,Math.PI/2),M.dark);
  dm.name='TA_Elv_CamDome';dm.position.set(P.xR-0.40,2.35,0.62);G.add(dm);
  // galvanised riser duct up the left wall behind the panel
  box('TA_Elv_Duct',P.xL+0.09,2.24,P.panelZ-0.02,0.14,1.10,0.30,M.galv);
  box('TA_Elv_DuctCap',P.xL+0.09,2.82,P.panelZ-0.02,0.16,0.11,0.32,M.galvDk);
  [-0.55,0.42].forEach((d,i)=>{
    tube('TA_Elv_Cond'+i,P.xL+0.04,1.90,P.panelZ+d,0.012,1.80,M.white,'y',8);
    box('TA_Elv_Jbox'+i,P.xL+0.06,1.55+i*0.30,P.panelZ+d,0.06,0.09,0.06,M.white);
  });
  box('TA_Elv_Iso',P.xL+0.09,1.30,P.panelZ+1.15,0.10,0.20,0.15,M.white);
  // pendant dome out in the room on its own drop
  tube('TA_Elv_Pend',-1.95,2.16,2.30,0.009,0.38,M.galv,'y',8);
  const d2=new T.Mesh(new T.SphereGeometry(0.060,14,9,0,6.3,Math.PI/2,Math.PI/2),M.dark);
  d2.name='TA_Elv_PendDome';d2.position.set(-1.95,1.94,2.30);G.add(d2);
  box('TA_Elv_PendBody',-1.95,1.99,2.30,0.13,0.09,0.13,M.white);
}

/* ---------------- floor reflection ----------------
   The polished screed mirrors the whole room, and that is most of what makes
   the photo read as a real plant room. An env map cannot do it — it reflects
   the environment, not the plant. So the plant is mirrored under the slab and
   the slab is 12% transparent over it.

   The mirror is a PARENT GROUP with scale.y = -1, not per-mesh flipping: the
   cylinders carry rotations, so negating a mesh's own scale.y flips it along
   its local axis and produces garbage rather than a mirror.

   Ghosts keep their family names with an _Rf suffix, so hiding a section takes
   its reflection with it; telecom-viewer.js excludes /_Rf/ from raycasting,
   from section bounds and from the colour-by-system swap. */
function reflect(match){
  const mirror=new T.Group();mirror.name='TA_Mirror';mirror.scale.y=-1;
  let n=0;
  G.children.slice().forEach(o=>{
    if(!match.test(o.name||''))return;
    const c=o.clone(true);
    c.traverse(m=>{
      if(!m.isMesh)return;
      m.name=(m.name||'')+'_Rf';
      const dim=(x)=>{const q=x.clone();q.transparent=true;q.opacity=.15;
        q.depthWrite=false;q.side=T.DoubleSide;return q;};
      m.material=Array.isArray(m.material)?m.material.map(dim):dim(m.material);
      m.castShadow=false;m.receiveShadow=false;n++;
    });
    c.name=(o.name||'')+'_Rf';
    mirror.add(c);
  });
  G.add(mirror);
  return n;
}

/* ---------------- build ---------------- */
function create(THREE){
  T=THREE;G=new T.Group();G.name='TA_Root';M=materials();
  shell();
  crac('TA_CracA');
  crac('TA_CracB');
  controlPanel();
  risers();
  trays();
  const lamps=[];lights(lamps);
  fire();
  elv();
  reflect(/^TA_(CracA|CracB|Pipe|Panel|Col)/);
  // the floor is re-added last so it draws after the ghosts it sits over
  const f=G.getObjectByName('TA_Floor');
  if(f){G.remove(f);G.add(f);}
  G.userData.lamps=lamps;
  return G;
}

window.LMTelecomModel={create:create,P:P};
})();
