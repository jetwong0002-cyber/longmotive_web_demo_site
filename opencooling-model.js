/* opencooling-model.js — code-only procedural replica of the Longmotive open
   cooling tower bank.

   Primary reference : open-updated-1.jpg — governs geometry, materials, camera:
                       shot from the lower roof, looking up past the white
                       corrugated plant band at the louvered cells.
   Secondary         : 冷塔.jpg — the wider rooftop view; source for cell count,
                       the platform walkway and the guardrail crowns.

   No binary assets — every map is drawn into a canvas here at build time.
   Mesh names use OC_* families that opencooling-viewer.js raycasts and groups
   the HUD sections by.

   Scene frame: lower-roof top is y=0 (the camera stands here), the cell row
   runs along +X on top of the plant band, the camera side is +Z.

   window.LMOpenCoolingModel.create(THREE) -> THREE.Group
*/
(function(){

/* ---------------- dimensions (metres, read off the reference) ---------------- */
const P={
  n:4,           // cells in the row — three fill the primary frame, the wide shot shows a fourth
  pitch:4.45,    // near-touching casings; only a slim frame strip between cells
  w:4.30,        // cell width across the row (x)
  d:4.00,        // cell depth (z)
  baseH:2.70,    // white corrugated plant band the cells stand on
  basinH:0.52,   // bolted basin band under the louvres
  louvH:2.62,    // the louvre bank IS the cell face — it dominates the photo
  fasciaH:0.34,  // shallow galvanised fascia above the louvres
  railH:1.02     // guardrail crown around every cell's top deck
};
const Y={
  base   : P.baseH,
  basin  : P.baseH,
  louv   : P.baseH+P.basinH,
  fascia : P.baseH+P.basinH+P.louvH,
  top    : P.baseH+P.basinH+P.louvH+P.fasciaH
};

/* ---------------- palette ----------------
   The cells are galvanised frame + grey-green louvre banks; the pedestal is a
   painted white corrugated enclosure. Overcast light: separation comes from
   value and roughness, not hue. */
const C={
  louvre : 0x767d72, // grey-green slat stock
  louvDk : 0x41463e, // slot shadow between slats
  galv   : 0xb9bfc3, // frames, mullions, rails, fascia
  galvDk : 0x8d9498,
  basin  : 0xa7adb1,
  white  : 0xeceeea, // corrugated plant band + condenser
  roof   : 0xb2b0a8,
  duct   : 0xb4babd, // spiral duct galvanised
  badge  : 0x1f6fb5  // the blue roundel on the basin band
};

/* ---------------- canvas texture helpers ---------------- */
function tex(THREE,w,h,draw,repX,repY,srgb){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(repX||1,repY||1);
  t.anisotropy=16;
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

/* Louvre bank: dense horizontal slats, two tall panels split by a galvanised
   mullion. Each slat gets a lit top edge and a deep slot shadow beneath — that
   alternation is what the whole photo reads as. Drawn as a solid (no alpha):
   from every real standpoint the bank reads opaque. */
function louvreMap(THREE){
  return tex(THREE,512,512,(g,w,h)=>{
    g.fillStyle='#41463e';g.fillRect(0,0,w,h);                 // slot shadow base
    const panels=2, mull=w*0.024, cell=w/panels;
    const rows=19, pitch=h/rows;
    for(let p=0;p<panels;p++){
      const x0=p*cell+ (p?mull/2:0), pw=cell-(p?mull/2:mull/2)-(p===panels-1?0:mull/2);
      for(let r=0;r<rows;r++){
        const y=r*pitch;
        g.fillStyle='#767d72';                                  // slat body
        g.fillRect(x0,y+pitch*0.18,pw,pitch*0.62);
        g.fillStyle='rgba(214,219,211,0.55)';                   // lit top edge
        g.fillRect(x0,y+pitch*0.18,pw,2);
        g.fillStyle='rgba(24,27,22,0.65)';                      // slot under the slat
        g.fillRect(x0,y+pitch*0.80,pw,pitch*0.20);
      }
    }
    g.fillStyle='#b9bfc3';                                      // centre mullion
    g.fillRect(cell-mull/2,0,mull,h);
    g.fillStyle='#8d9498';
    g.fillRect(cell-mull/2,0,2,h);g.fillRect(cell+mull/2-2,0,2,h);
  },1,1,true);
}

/* white corrugated plant band — vertical trapezoid ribs, container-style */
function corrMap(THREE,rx,ry){
  return tex(THREE,128,128,(g,w,h)=>{
    g.fillStyle='#eceeea';g.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=16){
      g.fillStyle='rgba(158,160,155,0.55)';g.fillRect(x,0,3,h);   // rib shadow
      g.fillStyle='rgba(255,255,255,0.8)';g.fillRect(x+5,0,3,h);  // rib highlight
    }
  },rx,ry,true);
}

/* steel bar grating (platform lip seen edge-on above the plant band) */
function grateMap(THREE,rx,ry){
  return tex(THREE,128,128,(g,w,h)=>{
    g.fillStyle='#15181b';g.fillRect(0,0,w,h);
    g.fillStyle='#c2c7cb';
    for(let x=0;x<w;x+=8)g.fillRect(x,0,3,h);
    g.fillStyle='#9aa0a4';
    for(let y=0;y<h;y+=32)g.fillRect(0,y,w,3);
  },rx,ry,true);
}

/* the blue roundel on the basin band — kept as an abstract mark, no wordmark */
function badgeMap(THREE){
  return tex(THREE,256,256,(g,w,h)=>{
    g.clearRect(0,0,w,h);
    const cx=w/2,cy=h/2,R=w*0.46;
    g.fillStyle='#1f6fb5';
    g.beginPath();g.arc(cx,cy,R,0,7);g.fill();
    g.strokeStyle='#ffffff';g.lineWidth=R*0.13;g.lineCap='round';
    g.beginPath();g.arc(cx,cy,R*0.58,2.6,5.9);g.stroke();       // open swoosh
    g.fillStyle='#ffffff';
    g.beginPath();g.arc(cx+R*0.30,cy-R*0.22,R*0.13,0,7);g.fill();
  },1,1,true);
}

/* spiral duct: helical seam wrapped around the barrel */
function spiralMap(THREE){
  return tex(THREE,128,128,(g,w,h)=>{
    g.fillStyle='#b4babd';g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(120,126,130,0.9)';g.lineWidth=4;
    for(let k=-1;k<5;k++){
      g.beginPath();g.moveTo(0,k*32);g.lineTo(w,k*32+32);g.stroke();
    }
    g.strokeStyle='rgba(238,241,243,0.5)';g.lineWidth=1.6;
    for(let k=-1;k<5;k++){
      g.beginPath();g.moveTo(0,k*32+3);g.lineTo(w,k*32+35);g.stroke();
    }
  },2,1,true);
}

/* condenser face: side discharge grille — concentric fan rings in a dark well */
function condMap(THREE){
  return tex(THREE,256,256,(g,w,h)=>{
    g.fillStyle='#f2f3f0';g.fillRect(0,0,w,h);
    const cx=w/2,cy=h/2;
    g.fillStyle='#2c2f31';
    g.beginPath();g.arc(cx,cy,w*0.40,0,7);g.fill();
    g.strokeStyle='#dfe1de';g.lineWidth=3;
    for(let r=w*0.09;r<w*0.40;r+=w*0.062){
      g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();
    }
    g.fillStyle='#4a4e50';
    g.beginPath();g.arc(cx,cy,w*0.07,0,7);g.fill();
  },1,1,true);
}

/* ---------------- build ---------------- */
function create(THREE){
  const root=new THREE.Group();root.name='OC_Root';

  const M={
    louvre: new THREE.MeshStandardMaterial({color:0xffffff,map:louvreMap(THREE),roughness:.58,metalness:.55}),
    galv  : new THREE.MeshStandardMaterial({color:C.galv,roughness:.30,metalness:.92}),
    galvDk: new THREE.MeshStandardMaterial({color:C.galvDk,roughness:.40,metalness:.85}),
    basin : new THREE.MeshStandardMaterial({color:C.basin,roughness:.36,metalness:.88}),
    white : new THREE.MeshStandardMaterial({color:0xffffff,map:corrMap(THREE,14,1),roughness:.62,metalness:.08}),
    flat  : new THREE.MeshStandardMaterial({color:C.white,roughness:.6,metalness:.08}),
    grate : new THREE.MeshStandardMaterial({color:0xffffff,map:grateMap(THREE,40,3),roughness:.74,metalness:.38}),
    roof  : new THREE.MeshStandardMaterial({color:C.roof,roughness:.92,metalness:.02}),
    duct  : new THREE.MeshStandardMaterial({color:0xffffff,map:spiralMap(THREE),roughness:.34,metalness:.9}),
    badge : new THREE.MeshStandardMaterial({map:badgeMap(THREE),transparent:true,
              roughness:.42,metalness:.10,polygonOffset:true,polygonOffsetFactor:-2}),
    cond  : new THREE.MeshStandardMaterial({color:0xffffff,map:condMap(THREE),roughness:.5,metalness:.12}),
    dark  : new THREE.MeshStandardMaterial({color:0x35393c,roughness:.8,metalness:.2}),
    hump  : new THREE.MeshStandardMaterial({color:0xd9dcd8,roughness:.45,metalness:.5})
  };

  const add=(g,m,name,parent,x,y,z)=>{
    const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x||0,y||0,z||0);
    parent.add(o);return o;
  };

  /* shared geometries */
  const rodLen=Math.hypot(P.w/2-.22,P.louvH-.24);
  const G={
    basin  : new THREE.BoxGeometry(P.w+.04,P.basinH,P.d+.04),
    louvX  : new THREE.BoxGeometry(P.w-.16,P.louvH,.10),          // front/back bank
    louvZ  : new THREE.BoxGeometry(.10,P.louvH,P.d-.16),          // end banks
    core   : new THREE.BoxGeometry(P.w-.5,P.louvH,P.d-.5),
    fascia : new THREE.BoxGeometry(P.w+.06,P.fasciaH,P.d+.06),
    post   : new THREE.BoxGeometry(.14,P.basinH+P.louvH+P.fasciaH,.14),
    topPl  : new THREE.BoxGeometry(P.w-.08,.07,P.d-.08),
    rod    : new THREE.CylinderGeometry(.016,.016,rodLen,6),
    railP  : new THREE.BoxGeometry(.045,P.railH,.045),
    hump   : new THREE.CylinderGeometry(.36,.36,1.25,16),
    humpEnd: new THREE.SphereGeometry(.36,14,10),
    neckV  : new THREE.CylinderGeometry(.085,.085,1.15,12),
    neckB  : new THREE.TorusGeometry(.24,.085,10,14,Math.PI),
    neckD  : new THREE.CylinderGeometry(.085,.085,.4,12),
    badge  : new THREE.PlaneGeometry(.62,.62),
    seam   : new THREE.BoxGeometry(P.w+.05,.07,P.d+.05)
  };

  /* ---- the cells ---- */
  for(let i=0;i<P.n;i++){
    const tag='OC_Cell'+(i+1)+'_';
    const u=new THREE.Group();u.name=tag+'Grp';
    u.position.x=i*P.pitch;
    root.add(u);

    add(G.basin,M.basin,tag+'Basin',u,0,Y.basin+P.basinH/2,0);
    add(G.seam ,M.galvDk,tag+'BasinSeam',u,0,Y.louv-.02,0);
    add(G.core ,M.dark ,tag+'Core' ,u,0,Y.louv+P.louvH/2,0);

    // louvre banks on the front and both ends (the back face of the row is
    // never seen from the walkable side; it gets a plain casing panel)
    add(G.louvX,M.louvre,tag+'LouvF',u,0,Y.louv+P.louvH/2, (P.d/2)-.04);
    add(G.louvX,M.galvDk,tag+'Back' ,u,0,Y.louv+P.louvH/2,-(P.d/2)+.04);
    add(G.louvZ,M.louvre,tag+'LouvL',u,-(P.w/2)+.04,Y.louv+P.louvH/2,0);
    add(G.louvZ,M.louvre,tag+'LouvR',u, (P.w/2)-.04,Y.louv+P.louvH/2,0);

    // corner posts + fascia
    for(const sx of [-1,1])for(const sz of [-1,1])
      add(G.post,M.galv,tag+'Post'+sx+sz,u,sx*(P.w/2-.05),Y.basin+(P.basinH+P.louvH+P.fasciaH)/2,sz*(P.d/2-.05));
    add(G.fascia,M.galv,tag+'Fascia',u,0,Y.fascia+P.fasciaH/2,0);
    add(G.topPl ,M.galvDk,tag+'Top' ,u,0,Y.top+.02,0);

    // X tie-rods across the front bank — one of the photo's strongest reads
    const ang=Math.atan2(P.w/2-.22,P.louvH-.24);
    [[-1,1],[1,1]].forEach(([dir],j)=>{
      const r=add(G.rod,M.galv,tag+'RodF'+j,u,0,Y.louv+P.louvH/2,(P.d/2)+.03);
      r.rotation.z=dir*ang;
    });
    [[-1],[1]].forEach(([dir],j)=>{  // and across the visible left end of cell 1
      if(i!==0)return;
      const r=add(G.rod,M.galv,tag+'RodL'+j,u,-(P.w/2)-.03,Y.louv+P.louvH/2,0);
      r.rotation.x=dir*Math.atan2(P.d/2-.22,P.louvH-.24);
    });

    // guardrail crown around the top deck
    const rp=new THREE.InstancedMesh(G.railP,M.galv,14);
    rp.name=tag+'RailPosts';
    {const mx=new THREE.Matrix4();let k=0;
     for(let j=0;j<5;j++)for(const sz of [-1,1])
       mx.makeTranslation(-P.w/2+.10+j*(P.w-.20)/4,Y.top+P.railH/2,sz*(P.d/2-.10)),rp.setMatrixAt(k++,mx);
     for(let j=1;j<3;j++)for(const sx of [-1,1])
       mx.makeTranslation(sx*(P.w/2-.10),Y.top+P.railH/2,-P.d/2+.10+j*(P.d-.20)/3),rp.setMatrixAt(k++,mx);
     rp.instanceMatrix.needsUpdate=true;}
    u.add(rp);
    [1.0,.55].forEach((hy,j)=>{
      add(new THREE.BoxGeometry(P.w-.06,.05,.05),M.galv,tag+'RailF'+j,u,0,Y.top+hy, (P.d/2-.10));
      add(new THREE.BoxGeometry(P.w-.06,.05,.05),M.galv,tag+'RailB'+j,u,0,Y.top+hy,-(P.d/2-.10));
      add(new THREE.BoxGeometry(.05,.05,P.d-.06),M.galv,tag+'RailL'+j,u,-(P.w/2-.10),Y.top+hy,0);
      add(new THREE.BoxGeometry(.05,.05,P.d-.06),M.galv,tag+'RailR'+j,u, (P.w/2-.10),Y.top+hy,0);
    });

    // motor hump on the fan deck + gooseneck vent on the first two cells
    const hp=add(G.hump,M.hump,tag+'Hump',u,-.55,Y.top+.42,-.35);
    hp.rotation.z=Math.PI/2;
    add(G.humpEnd,M.hump,tag+'HumpL',u,-1.17,Y.top+.42,-.35);
    add(G.humpEnd,M.hump,tag+'HumpR',u, .07,Y.top+.42,-.35);
    if(i<2){
      add(G.neckV,M.galv,tag+'NeckV',u,1.25,Y.top+.72,.55);
      const b=add(G.neckB,M.galv,tag+'NeckBend',u,1.25+.24,Y.top+1.29,.55);
      b.rotation.z=Math.PI;b.rotation.y=Math.PI/2;
      add(G.neckD,M.galv,tag+'NeckDown',u,1.25+.48,Y.top+1.12,.55);
    }
    // blue roundel low on the basin band (front face)
    if(i<3)
      add(G.badge,M.badge,tag+'Badge',u,P.w*0.26,Y.basin+P.basinH*.55,(P.d/2)+.05);
  }

  /* ---- platform lip + walkway guardrail in front of the cells ---- */
  const rowL=(P.n-1)*P.pitch;
  const lipW=rowL+P.w+3.0;
  const lip=add(new THREE.BoxGeometry(lipW,.16,1.15),M.grate,'OC_Rail_PlatformLip',root,rowL/2, P.baseH-.08, P.d/2+.65);
  M.grate.map.repeat.set(lipW*1.4,2);
  const RZ=P.d/2+1.10, RX0=-P.w/2-1.3, RX1=rowL+P.w/2+1.6;
  const rl=RX1-RX0, rcx=(RX0+RX1)/2;
  [1.02,.55].forEach((hy,j)=>{
    const r=add(new THREE.CylinderGeometry(.028,.028,rl,10),M.galv,'OC_Rail_Run'+j,root,rcx,P.baseH+hy,RZ);
    r.rotation.z=Math.PI/2;
  });
  const posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.05,1.02,.05),M.galv,12);
  posts.name='OC_Rail_Posts';
  {const mx=new THREE.Matrix4();
   for(let j=0;j<12;j++){mx.makeTranslation(RX0+j*(rl/11),P.baseH+.51,RZ);posts.setMatrixAt(j,mx);}
   posts.instanceMatrix.needsUpdate=true;}
  root.add(posts);
  add(new THREE.BoxGeometry(rl,.13,.03),M.galvDk,'OC_Rail_Toe',root,rcx,P.baseH+.08,RZ);

  // access ladder + standpipe closing the left of frame, as in the photo
  const LX=RX0-.9;
  [-.22,.22].forEach((o,j)=>
    add(new THREE.CylinderGeometry(.03,.03,P.baseH+1.6,8),M.galv,'OC_Ladder_Stile'+j,root,LX+o,(P.baseH+1.6)/2,RZ-.2));
  const rungs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.018,.018,.44,8),M.galv,8);
  rungs.name='OC_Ladder_Rungs';
  {const mx=new THREE.Matrix4(),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,Math.PI/2)),
   v=new THREE.Vector3(),one=new THREE.Vector3(1,1,1);
   for(let j=0;j<8;j++){v.set(LX,.65+j*.42,RZ-.2);mx.compose(v,q,one);rungs.setMatrixAt(j,mx);}
   rungs.instanceMatrix.needsUpdate=true;}
  root.add(rungs);
  add(new THREE.CylinderGeometry(.045,.045,P.baseH+2.4,10),M.galvDk,'OC_Ladder_Pole',root,LX-.75,(P.baseH+2.4)/2,RZ-.35);

  /* ---- white corrugated plant band the cells stand on ---- */
  const base=add(new THREE.BoxGeometry(lipW+2.5,P.baseH,P.d+3.4),M.white,'OC_Base_Band',root,rowL/2,P.baseH/2,P.d/2-0.4);
  add(new THREE.BoxGeometry(lipW+2.56,.14,P.d+3.46),M.flat,'OC_Base_Cap',root,rowL/2,P.baseH-.05,P.d/2-0.4);

  // wall-hung mini-split condenser on the band, right of frame
  const cu=new THREE.Group();cu.name='OC_Cond_Grp';
  cu.position.set(rowL*0.62,1.75,P.d/2+1.32);
  root.add(cu);
  add(new THREE.BoxGeometry(1.0,.78,.34),M.flat,'OC_Cond_Body',cu,0,0,0);
  const cf=add(new THREE.PlaneGeometry(.72,.72),M.cond,'OC_Cond_Face',cu,-.13,0,.18);
  cf.rotation.y=0;
  add(new THREE.BoxGeometry(1.04,.06,.38),M.galvDk,'OC_Cond_Bracket',cu,0,-.44,0);

  /* ---- spiral duct elbows breaking the bottom of frame ---- */
  [[1.3,1.05,.55],[3.15,.8,.62]].forEach(([dx,dh,dr],j)=>{
    const d=new THREE.Group();d.name='OC_Duct_Grp'+j;
    d.position.set(dx,0,P.d/2+3.1);
    root.add(d);
    add(new THREE.CylinderGeometry(dr,dr,dh,20),M.duct,'OC_Duct_Barrel'+j,d,0,dh/2,0);
    const el=add(new THREE.TorusGeometry(dr*1.05,dr,14,20,Math.PI/2),M.duct,'OC_Duct_Elbow'+j,d,dr*1.05,dh,0);
    el.rotation.z=Math.PI/2;el.rotation.y=Math.PI/2;
    add(new THREE.CylinderGeometry(dr,dr,.5,20),M.duct,'OC_Duct_Stub'+j,d,dr*1.05,dh+dr*1.05,-.25).rotation.x=Math.PI/2;
  });

  /* ---- surrounds ---- */
  const bg=new THREE.Group();bg.name='OC_Bg_Grp';root.add(bg);
  add(new THREE.BoxGeometry(60,.3,26),M.roof,'OC_Bg_LowerRoof',bg,rowL/2,-.15,P.d/2+8.5);
  add(new THREE.BoxGeometry(60,.9,.24),M.flat,'OC_Bg_Parapet',bg,rowL/2,.45,P.d/2+15.5);

  return root;
}

window.LMOpenCoolingModel={create:create,dims:P};
})();
