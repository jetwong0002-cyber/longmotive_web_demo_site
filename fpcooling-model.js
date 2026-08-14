/* fpcooling-model.js — code-only procedural replica of the Longmotive rooftop
   fluorine-pump cooling tower array.

   Primary reference : 屋顶氟泵冷塔.jpg — governs geometry, materials, camera.
   Secondary         : 屋顶氟泵系统.jpg — the opposite side of the same array;
                       source for the risers, base header and rear casing that
                       the primary photo cannot see.

   Replaces uploads/3d/fpcooling-towers.glb. No binary assets — every map is
   drawn into a canvas here at build time. Mesh names keep the FC_* families
   that fpcooling-viewer.js raycasts and groups the HUD sections by.

   Scene frame: deck top is y=0, the row runs along +X, the walkway and the
   camera sit on the +Z side, the left-of-frame parapet is at -Z.

   window.LMFPCoolingModel.create(THREE) -> THREE.Group
*/
(function(){

/* ---------------- dimensions (metres, read off the reference) ---------------- */
const P={
  n:9,          // units in the row — counted off the receding row in the photo
  pitch:3.78,   // centre-to-centre; the ~0.5m slot between casings reads in the photo
  // Band heights measured off the reference as fractions of the unit's total
  // height (casing .46, intake .25, basin .10, legs .19). Getting this wrong is
  // what made an earlier pass read as narrow fins rather than chunky boxes:
  // the casing was too tall, so the face came out narrower than it should be.
  w:3.30,       // across the row (x)
  d:3.30,       // depth (z)
  legH:0.91,    // braced leg frame standing on the grating deck
  basinH:0.50,
  screenH:1.21, // expanded-metal intake band
  casH:2.27,    // casing, three bands
  cowlD:1.52,
  cowlH:0.46
};
// y levels, stacked from the deck
const Y={
  legTop : P.legH,
  basin  : P.legH,
  screen : P.legH+P.basinH,
  casing : P.legH+P.basinH+P.screenH,
  top    : P.legH+P.basinH+P.screenH+P.casH,
};
Y.cowl=Y.top+0.10;

/* ---------------- palette ----------------
   Everything on the unit is galvanised steel, so the whole family sits in one
   cool grey range and is separated by roughness, not by hue. Only the parapets
   and plant enclosures are painted (non-metal). */
const C={
  casing : 0xc2c8cb, // rolled galvanised sheet — the large casing panels
  galv   : 0xb8bec2, // brighter steel — frames, mullions, cowl, handrail
  galvDk : 0x8f969a, // seam channels and shadowed trim
  screen : 0x3a332c, // expanded-metal intake, reads near-black in the photo
  basin  : 0xa9b0b3,
  grate  : 0x92979b,
  pipe   : 0x9ba2a6,
  white  : 0xe4e6e3, // painted parapet
  ground : 0xd2cac2, // concrete roof screed the stair lands on
  badge  : 0x2f9e63
};

/* ---------------- canvas texture helpers ---------------- */
function tex(THREE,w,h,draw,repX,repY,srgb){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(repX||1,repY||1);
  t.anisotropy=16; // the deck grating is seen at a hard grazing angle
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

/* Casing panels: rolled galvanised sheet. Deliberately almost flat — an earlier
   pass drew dense vertical rain streaks here and the result read as woodgrain,
   which is exactly wrong for a metal panel. Detail is horizontal mill-brush plus
   a few fastener heads; the sheen comes from the material, not the map. */
function casingMap(THREE){
  return tex(THREE,256,256,(g,w,h)=>{
    g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=2){ // faint horizontal mill brush
      g.fillStyle='rgba(196,200,202,'+(0.05+Math.random()*0.07)+')';
      g.fillRect(0,y,w,1);
    }
    for(let i=0;i<9;i++){ // sparse weathering, kept off the vertical
      g.fillStyle='rgba(140,142,138,0.05)';
      g.fillRect(Math.random()*w,Math.random()*h,18+Math.random()*40,3+Math.random()*7);
    }
    for(let i=0;i<22;i++){ // fastener heads
      g.fillStyle='rgba(126,130,132,0.34)';
      g.beginPath();g.arc(10+Math.random()*(w-20),8+Math.random()*(h-16),1.3,0,7);g.fill();
    }
  },1,1,true);
}

/* intake face: four expanded-metal panels split by galvanised mullions */
function screenMaps(THREE){
  const bars=4,mul=0.026; // mullion width as a fraction of the face
  const paint=(g,w,h,meshFill,barFill,holes)=>{
    g.fillStyle=barFill;g.fillRect(0,0,w,h);
    const cell=w/bars, pad=w*mul*0.5;
    for(let i=0;i<bars;i++){
      const x0=i*cell+pad, pw=cell-pad*2;
      g.fillStyle=meshFill;g.fillRect(x0,h*0.03,pw,h*0.94);
      if(holes){ // diamond perforations — small, so the band still reads as a dark solid
        g.save();g.beginPath();g.rect(x0,h*0.03,pw,h*0.94);g.clip();
        g.fillStyle='#000';
        const s=9,k=2.6; // k = strand thickness; larger k -> smaller opening
        for(let y=0;y<h;y+=s)for(let x=x0-s;x<x0+pw+s;x+=s){
          const ox=((y/s)|0)%2?s/2:0;
          g.beginPath();
          g.moveTo(x+ox+s/2,y+k);g.lineTo(x+ox+s-k,y+s/2);
          g.lineTo(x+ox+s/2,y+s-k);g.lineTo(x+ox+k,y+s/2);
          g.closePath();g.fill();
        }
        g.restore();
      }
    }
  };
  return {
    map  : tex(THREE,512,192,(g,w,h)=>paint(g,w,h,'#3a332c','#b6bcc0',false),1,1,true),
    alpha: tex(THREE,512,192,(g,w,h)=>paint(g,w,h,'#ffffff','#ffffff',true),1,1,false)
  };
}

/* steel bar grating — bearing bars plus cross rods, drawn opaque to keep the
   foreground deck free of alpha-test shimmer */
function grateMap(THREE,rx,ry){
  return tex(THREE,128,128,(g,w,h)=>{
    g.fillStyle='#15181b';g.fillRect(0,0,w,h);        // the dark void below
    g.fillStyle='#c2c7cb';
    for(let x=0;x<w;x+=8)g.fillRect(x,0,3,h);          // bearing bars
    g.fillStyle='#9aa0a4';
    for(let y=0;y<h;y+=32)g.fillRect(0,y,w,3);         // cross rods
  },rx,ry,true);
}

/* roof screed for the level the stair lands on — mottled concrete with
   expansion joints along the tile edges, matte so it never mirrors the sky */
function concreteMap(THREE,rx,ry){
  return tex(THREE,256,256,(g,w,h)=>{
    g.fillStyle='#d2cac2';g.fillRect(0,0,w,h);
    for(let i=0;i<170;i++){ // patchy wear
      g.fillStyle='rgba(150,144,137,'+(0.02+Math.random()*0.05)+')';
      g.beginPath();g.arc(Math.random()*w,Math.random()*h,4+Math.random()*24,0,7);g.fill();
    }
    g.strokeStyle='rgba(116,110,104,0.5)';g.lineWidth=2; // joints on two tile edges
    g.beginPath();g.moveTo(0,1);g.lineTo(w,1);g.moveTo(1,0);g.lineTo(1,h);g.stroke();
  },rx,ry,true);
}

/* the SNOW COIL badge — green oval, white swoosh ring, stacked wordmark */
function badgeMap(THREE){
  return tex(THREE,400,320,(g,w,h)=>{
    g.clearRect(0,0,w,h);
    const cx=w/2,cy=h/2,R=Math.min(w,h)*0.47;
    g.fillStyle='#2f9e63';
    g.beginPath();g.arc(cx,cy,R,0,7);g.fill();
    // the white swoosh ring sits OUTSIDE the wordmark, near the rim — drawn
    // through the middle it cut across the letters and read as a smear
    g.strokeStyle='#ffffff';g.lineWidth=R*0.15;g.lineCap='round';
    g.beginPath();g.arc(cx,cy,R*0.76,-0.45,2.25);g.stroke();
    g.beginPath();g.arc(cx,cy,R*0.76,2.90,5.60);g.stroke();
    g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';
    g.font='bold '+Math.round(R*0.42)+'px Helvetica, Arial, sans-serif';
    g.fillText('SNOW',cx,cy-R*0.22);
    g.fillText('COIL' ,cx,cy+R*0.24);
  },1,1,true);
}

/* ---------------- build ---------------- */
function create(THREE){
  const root=new THREE.Group();root.name='FC_Root';
  const S=screenMaps(THREE);

  const M={
    // metalness ~.9 across the unit: this is bare galvanised steel, and it has
    // to take a real specular off the sky dome, not read as painted board
    casing: new THREE.MeshStandardMaterial({color:C.casing,roughness:.33,metalness:.90,map:casingMap(THREE)}),
    galv  : new THREE.MeshStandardMaterial({color:C.galv,roughness:.27,metalness:.95}),
    galvDk: new THREE.MeshStandardMaterial({color:C.galvDk,roughness:.38,metalness:.85}),
    basin : new THREE.MeshStandardMaterial({color:C.basin,roughness:.35,metalness:.88}),
    screen: new THREE.MeshStandardMaterial({color:0xffffff,map:S.map,alphaMap:S.alpha,
              alphaTest:.5,side:THREE.DoubleSide,roughness:.62,metalness:.70}),
    badge : new THREE.MeshStandardMaterial({map:badgeMap(THREE),transparent:true,
              roughness:.42,metalness:.10,polygonOffset:true,polygonOffsetFactor:-2}),
    plate : new THREE.MeshStandardMaterial({color:0xf2f2ee,roughness:.45,metalness:.30}),
    pipe  : new THREE.MeshStandardMaterial({color:C.pipe,roughness:.30,metalness:.92}),
    // Bar grating is mostly void, so it must NOT take a full metal specular —
    // at .85 metalness the sky reflection swallowed the bar pattern and the
    // foreground deck read as a blank pale plane.
    grate : new THREE.MeshStandardMaterial({color:0xffffff,map:grateMap(THREE,62,20),roughness:.74,metalness:.38}),
    tread : new THREE.MeshStandardMaterial({color:0xffffff,map:grateMap(THREE,3,1),roughness:.74,metalness:.38}),
    white : new THREE.MeshStandardMaterial({color:C.white,roughness:.72,metalness:.04}),
    ground: new THREE.MeshStandardMaterial({color:C.ground,roughness:.96,metalness:.02,
              map:concreteMap(THREE,15,15)}),
    dark  : new THREE.MeshStandardMaterial({color:0x3c4247,roughness:.8,metalness:.2}),
    core  : new THREE.MeshStandardMaterial({color:0x24201c,roughness:.95,metalness:.0})
  };

  /* geometries are built once and shared across all seven units */
  const G={
    casing : new THREE.BoxGeometry(P.w,P.casH,P.d),
    // seams sit nearly flush — proud bands caught the key light and turned into
    // bright horizontal bars the reference does not have
    seam   : new THREE.BoxGeometry(P.w+.03,.09,P.d+.03),
    cap    : new THREE.BoxGeometry(P.w+.07,.12,P.d+.07),
    topPl  : new THREE.BoxGeometry(P.w-.10,.06,P.d-.10),
    screen : new THREE.BoxGeometry(P.w-.05,P.screenH,P.d-.05),
    core   : new THREE.BoxGeometry(P.w-.42,P.screenH*.98,P.d-.42), // dark fill behind the mesh
    basin  : new THREE.BoxGeometry(P.w+.03,P.basinH,P.d+.03),
    frame  : new THREE.BoxGeometry(P.w+.06,.16,P.d+.06),
    leg    : new THREE.BoxGeometry(.16,P.legH,.16),
    cowl   : new THREE.CylinderGeometry(P.cowlD/2,P.cowlD/2*.94,P.cowlH,28,1,true),
    rim    : new THREE.TorusGeometry(P.cowlD/2,.045,8,30),
    fan    : new THREE.CircleGeometry(P.cowlD/2*.90,26),
    badge  : new THREE.PlaneGeometry(.82,.66),
    brace  : new THREE.BoxGeometry(.075,Math.hypot(P.w-.60,P.legH),.075),
    plate  : new THREE.PlaneGeometry(.30,.20),
    riser  : new THREE.CylinderGeometry(.11,.11,Y.casing+.55,14),
    elbow  : new THREE.CylinderGeometry(.11,.11,.85,14)
  };

  /* ---- tower units ---- */
  const add=(g,m,name,parent,x,y,z)=>{
    const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x||0,y||0,z||0);
    parent.add(o);return o;
  };

  for(let i=0;i<P.n;i++){
    const tag='FC_Tower'+(i+1)+'_';
    const u=new THREE.Group();u.name=tag+'Grp';
    u.position.x=i*P.pitch;
    root.add(u);

    add(G.basin ,M.basin ,tag+'Basin' ,u,0,Y.basin+P.basinH/2,0);
    add(G.core  ,M.core  ,tag+'Core'  ,u,0,Y.screen+P.screenH/2,0);
    add(G.screen,M.screen,tag+'Screen',u,0,Y.screen+P.screenH/2,0);
    add(G.seam  ,M.galvDk,tag+'RailB' ,u,0,Y.casing-.02,0);        // band under the casing
    add(G.casing,M.casing,tag+'Casing',u,0,Y.casing+P.casH/2,0);
    add(G.seam  ,M.galvDk,tag+'Seam1' ,u,0,Y.casing+P.casH/3,0);   // the two panel joints
    add(G.seam  ,M.galvDk,tag+'Seam2' ,u,0,Y.casing+P.casH*2/3,0);
    add(G.cap   ,M.galv  ,tag+'Cap'   ,u,0,Y.top-.02,0);
    add(G.topPl ,M.casing,tag+'Top'   ,u,0,Y.top+.03,0);

    // fan cowl, sat forward-of-centre on the roof as in the reference
    const cw=add(G.cowl,M.galv,tag+'Cowl',u,-.30,Y.cowl+P.cowlH/2,0);
    cw.material=M.galv;
    add(G.rim ,M.galv,tag+'CowlRim',u,-.30,Y.cowl+P.cowlH,0).rotation.x=Math.PI/2;
    add(G.fan ,M.dark,tag+'Fan'    ,u,-.30,Y.cowl+P.cowlH*.35,0).rotation.x=-Math.PI/2;

    // badge on the -X end face (the bright face that reads across the row)
    add(G.badge,M.badge,tag+'Badge',u,-(P.w/2)-.02,Y.casing+P.casH*.32,0).rotation.y=-Math.PI/2;
    // maker's plate high on the walkway-side face
    add(G.plate,M.plate,tag+'Plate',u,P.w*.30,Y.casing+P.casH*.86,(P.d/2)+.02);

    // structural frame ring + six legs standing on the grating
    add(G.frame,M.galvDk,tag+'Frame',u,0,Y.legTop-.08,0);
    const legs=new THREE.InstancedMesh(G.leg,M.galv,6);
    legs.name=tag+'Legs';
    const mx=new THREE.Matrix4();let k=0;
    for(const lx of [-1,0,1])for(const lz of [-1,1])
      mx.makeTranslation(lx*(P.w/2-.30),P.legH/2,lz*(P.d/2-.30)),legs.setMatrixAt(k++,mx);
    legs.instanceMatrix.needsUpdate=true;
    u.add(legs);

    // Cross-bracing between the legs. The reference shows a proper braced
    // trestle under every unit, not bare posts — it is one of the strongest
    // shapes in the foreground, so it cannot be left out.
    const br=new THREE.InstancedMesh(G.brace,M.galv,8);
    br.name=tag+'Brace';
    // ang is measured from vertical: the box's long axis is +Y, so tilting it
    // by ang about Z (long faces) or X (end faces) lays it on the diagonal.
    const ang=Math.atan2(P.w-.60,P.legH), off=new THREE.Matrix4(), q=new THREE.Quaternion(),
          pos=new THREE.Vector3(), one=new THREE.Vector3(1,1,1), e=new THREE.Euler();
    let b=0;
    [-1,1].forEach(s=>{                       // braces on the two long faces
      [-1,1].forEach(dir=>{
        q.setFromEuler(e.set(0,0,-dir*ang));
        pos.set(0,P.legH/2,s*(P.d/2-.30));
        off.compose(pos,q,one);br.setMatrixAt(b++,off);
      });
    });
    [-1,1].forEach(s=>{                       // and on the two end faces
      [-1,1].forEach(dir=>{
        q.setFromEuler(e.set(dir*ang,0,0));
        pos.set(s*(P.w/2-.30),P.legH/2,0);
        off.compose(pos,q,one);br.setMatrixAt(b++,off);
      });
    });
    br.instanceMatrix.needsUpdate=true;
    u.add(br);

    // riser off the far corner, elbowing into the casing (from the second photo)
    const rz=-(P.d/2)-.22;
    add(G.riser,M.pipe,'FC_Pipe_Riser'+(i+1),root,i*P.pitch+P.w*.34,(Y.casing+.55)/2,rz);
    add(G.elbow,M.pipe,'FC_Pipe_Elbow'+(i+1),root,i*P.pitch+P.w*.34,Y.casing+.55,rz+.42)
      .rotation.x=Math.PI/2;
  }

  /* ---- base header running the length of the row ---- */
  const hl=(P.n-1)*P.pitch+P.w+1.6;
  const hdr=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,hl,16),M.pipe);
  hdr.name='FC_Pipe_Header';
  hdr.rotation.z=Math.PI/2;
  hdr.position.set((P.n-1)*P.pitch/2,.52,-(P.d/2)-.62);
  root.add(hdr);

  /* ---- grating deck ---- */
  // the walkway is only ~3.3m clear of the tower faces in the reference — a
  // deeper deck reads as an empty grey plane and kills the sense of a tight roof
  const DX0=-5.4,DX1=(P.n-1)*P.pitch+4.2,DZ0=-2.6,DZ1=5.0;
  const dw=DX1-DX0,dd=DZ1-DZ0;
  M.grate.map.repeat.set(dw*2,dd*2);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(dw,.14,dd),M.grate);
  deck.name='FC_Deck_Grating';
  deck.position.set((DX0+DX1)/2,-.07,(DZ0+DZ1)/2);
  root.add(deck);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(dw+.06,.16,dd+.06),M.galvDk);
  edge.name='FC_Deck_Edge';edge.position.copy(deck.position);edge.position.y=-.20;
  root.add(edge);

  /* ---- handrail along the open (+Z) edge, and the stair down to the low roof ---- */
  const RZ=DZ1-.30, RX0=DX0+1.0, RX1=DX0+15.0;   // rail stops at the stair opening
  const rl=RX1-RX0, rcx=(RX0+RX1)/2;
  const railGeo=new THREE.CylinderGeometry(.028,.028,rl,10);
  [1.06,.56].forEach((hy,j)=>{
    const r=new THREE.Mesh(railGeo,M.galv);
    r.name='FC_Rail_Top'+j;r.rotation.z=Math.PI/2;r.position.set(rcx,hy,RZ);
    root.add(r);
  });
  const posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.05,1.06,.05),M.galv,9);
  posts.name='FC_Rail_Posts';
  {const mx=new THREE.Matrix4();for(let j=0;j<9;j++){mx.makeTranslation(RX0+j*(rl/8),.53,RZ);posts.setMatrixAt(j,mx);}
   posts.instanceMatrix.needsUpdate=true;}
  root.add(posts);
  const toe=new THREE.Mesh(new THREE.BoxGeometry(rl,.14,.03),M.galvDk);
  toe.name='FC_Rail_Toe';toe.position.set(rcx,.09,RZ);root.add(toe);

  // stair descending to the lower roof, off the right of frame
  const SX=DX0+16.6,SY=-1.70,steps=7;
  const stair=new THREE.Group();stair.name='FC_Plat_Stair';
  stair.position.set(SX,0,RZ+.2);
  root.add(stair);
  const tg=new THREE.BoxGeometry(1.30,.05,.30);
  const tr=new THREE.InstancedMesh(tg,M.tread,steps);
  tr.name='FC_Plat_Treads';
  {const mx=new THREE.Matrix4();
   for(let j=0;j<steps;j++)mx.makeTranslation(0,-(j+1)*(Math.abs(SY)/steps),(j+1)*.30),tr.setMatrixAt(j,mx);
   tr.instanceMatrix.needsUpdate=true;}
  stair.add(tr);
  const strLen=Math.hypot(Math.abs(SY),steps*.30);
  [-1,1].forEach((s,j)=>{
    const st=new THREE.Mesh(new THREE.BoxGeometry(.06,.26,strLen),M.galvDk);
    st.name='FC_Plat_Stringer'+j;
    st.position.set(s*.68,SY/2,steps*.15);
    st.rotation.x=Math.atan2(Math.abs(SY),steps*.30);
    stair.add(st);
  });

  /* ---- rooftop surrounds ----
     The plant that used to sit below the stair — enclosure, louvre bank, fan
     housing and grilles, far and right parapets — was removed on request. What
     remains is the bare screed the stair lands on plus the walkway-level
     parapet, so the run terminates on something instead of ending in mid-air. */
  const bg=new THREE.Group();bg.name='FC_Bg_Grp';root.add(bg);

  // Roof screed at the foot of the stair. Its top is set to the underside of
  // the bottom tread so the run actually meets it — a gap here is exactly what
  // made the stair read as floating. Wide enough to carry past the framing and
  // haze out into the fog rather than showing a cut edge.
  const GT=SY-.025;                      // tread is .05 thick, centred on SY
  const grd=new THREE.Mesh(new THREE.BoxGeometry(96,.5,96),M.ground);
  grd.name='FC_Bg_Ground';
  grd.position.set(10,GT-.25,14);
  bg.add(grd);

  // white parapet closing the left of frame (-Z), hideable via 'Hide walls'.
  // Kept low and set well back — pulled forward it reads as a blank panel
  // behind the row rather than the far roof edge it is in the photo.
  const wl=new THREE.Mesh(new THREE.BoxGeometry(dw+10,1.65,.28),M.white);
  wl.name='FC_Bg_WallL';
  wl.position.set((DX0+DX1)/2,.80,DZ0-4.6);
  bg.add(wl);

  return root;
}

window.LMFPCoolingModel={create:create,dims:P};
})();
