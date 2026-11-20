/* Shared region-aware body, armor and weapon geometry. Y is up; +Z is forward. */
(function(){
 const dispose=root=>{const mats=new Set(),geos=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m))});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())};
 window.GFDisposeFigure=dispose;
 const surfaceMaps=new Map();
 function material(T,color,kind){
  const m=new T.MeshPhysicalMaterial({color,metalness:kind==='metal'?.68:0,roughness:kind==='metal'?.31:kind==='skin'?.48:.86,clearcoat:kind==='metal'?.16:0,clearcoatRoughness:.45,sheen:kind==='cloth'?.35:kind==='skin'?.12:0,sheenColor:new T.Color(color),sheenRoughness:.9});
  if(!surfaceMaps.has(kind)){const size=128,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const raw=Math.sin(x*91.7+y*17.31)*43758.5,noise=raw-Math.floor(raw);const value=kind==='cloth'?135+((x%4<2)===(y%4<2)?34:-24)+noise*9:kind==='metal'?165+Math.sin(y*1.8)*7+noise*15:160+noise*25;const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255}const texture=new T.DataTexture(data,size,size);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,3);texture.needsUpdate=true;surfaceMaps.set(kind,texture)}
  m.roughnessMap=surfaceMaps.get(kind);m.bumpMap=surfaceMaps.get(kind);m.bumpScale=kind==='cloth'?.012:kind==='skin'?.002:.004;return m;
 }

 function helpers(T,root){
  const mesh=(g,m,x=0,y=0,z=0,p=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o};
  const ell=(x,y,z,sx,sy,sz,m,p=root)=>{const o=mesh(new T.SphereGeometry(1,24,16),m,x,y,z,p);o.scale.set(sx,sy,sz);return o};
  const box=(x,y,z,w,h,d,m,p=root)=>{
   if(Math.min(w,h,d)<.03)return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
   const r=Math.min(w,h,d)*.16,shape=new T.Shape();shape.moveTo(-w/2+r,-h/2+r);shape.lineTo(w/2-r,-h/2+r);shape.lineTo(w/2-r,h/2-r);shape.lineTo(-w/2+r,h/2-r);shape.closePath();
   const geo=new T.ExtrudeGeometry(shape,{depth:Math.max(.005,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:1,steps:1});geo.translate(0,0,-d/2+r);return mesh(geo,m,x,y,z,p);
  };
  const cyl=(x,y,z,r1,r2,h,m,p=root)=>mesh(new T.CylinderGeometry(r1,r2,h,20),m,x,y,z,p);
  const line=(pts,r,m,p=root)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a=>new T.Vector3(...a))),Math.max(8,pts.length*5),r,6,false),m,0,0,0,p);
  const shell=(x,y,z,rx,ry,rz,m,start=0,length=Math.PI*2,p=root)=>{const o=mesh(new T.SphereGeometry(1,32,20,start,length,0,Math.PI*.62),m,x,y,z,p);o.scale.set(rx,ry,rz);return o};
  return {mesh,ell,box,cyl,line,shell};
 }
 // Sode built across the shoulder, with depth shaped independently at both rims.
 function buildOyoroiGuard(T, side, tools, materials) {
  const {mesh, line} = tools;
  const {metal, fabric, trim} = materials;
  const sections = 10;
  function surface(row, u, down, offset = 0) {
   const angle = u * 1.34;
   const flare = .016 * row + .030 * down;
   return new T.Vector3(
    side * (.406 + (.236 + flare + offset) * Math.cos(angle)),
    2.436 - .084 * row - .104 * down - .055 * u * u,
    (.226 + row * .010) * Math.sin(angle)
   );
  }
  for (let row = 0; row < 5; row++) {
   // The folded lower lip casts a narrow shadow over the following plate.
   const profile = [[0,-.018],[0,0],[.72,.007],[.93,.015],[1,.006],[1,-.018]];
   const verts = [], uv = [], indices = [];
   const stride = profile.length;
   function triangle(a,b,c) { indices.push(...(side === 1 ? [a,b,c] : [a,c,b])); }
   for (let i = 0; i <= sections; i++) {
    const u = 2 * i / sections - 1;
    for (const [down,offset] of profile) {
     verts.push(...surface(row,u,down,offset).toArray());
     uv.push(i / sections, down);
    }
   }
   for (let i = 0; i < sections; i++) {
    for (let k = 0; k < stride; k++) {
     const a = i * stride + k, b = i * stride + (k + 1) % stride;
     triangle(a,a+stride,b); triangle(a+stride,b+stride,b);
    }
   }
   for (let k = 1; k < stride-1; k++) {
    triangle(0,k,k+1);
    const end = sections * stride;
    triangle(end,end+k+1,end+k);
   }
   const g = new T.BufferGeometry();
   g.setAttribute('position',new T.Float32BufferAttribute(verts,3));
   g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
   g.setIndex(indices);
   g.computeVertexNormals();
   mesh(g,metal).name = 'sode-plate-'+row;
   // Short pairs of cord disappear back through the lacquer on either end.
   for (const u of [-.83,-.32,.32,.83]) {
    const points = [[u-.06,.05,-.007],[u-.015,.34,.017],[u+.04,.72,.020],[u+.07,.94,0]];
    const path = new T.CatmullRomCurve3(points.map(([x,y,d])=>surface(row,x,y,d)));
    mesh(new T.TubeGeometry(path,4,.012,4,false),fabric);
   }
  }
  for (const z of [-.118,.118]) {
   line([[side*.285,2.406,z],[side*.395,2.476,z],[side*.505,2.472,z],[side*.606,2.421,z]],.026,fabric);
  }
  const binding = [];
  for(let i=0;i<=8;i++)binding.push(surface(0,i/4-1,.06,.006).toArray());
  line(binding,.011,trim);
 }
 window.GFBuildHeritageWeapon=function(T,c){
  const group=new T.Group(),{weapon}=GFResolveHeritage(c),id=weapon[0];group.name='heritage-weapon-'+id;
  const {mesh,cyl,box,ell,line}=helpers(T,group),steel=material(T,c.heritage==='egypt'?'#bda064':'#c0c9ce','metal'),edge=material(T,'#e0e4df','metal'),trim=material(T,c.trimColor||'#a99160','metal'),leather=material(T,'#302821','cloth'),wood=material(T,'#62503b','cloth'),cloth=material(T,c.clothColor||'#762c25','cloth');
  function blade(points,offset){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const o=mesh(new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1,steps:1}),steel,0,offset,-.0175);return o}
  const pole=['yari','naginata','qiang','norsespear','dory','egyptspear','halberd'].includes(id);
  if(pole){cyl(0,.75,0,.032,.04,2.7,wood);cyl(0,1.95,0,.047,.047,.22,trim);cyl(0,-.6,0,.04,0,.22,steel);
   if(id==='naginata'){blade([[-.045,0],[.06,0],[.18,.35],[.25,.68],[.12,.94],[.12,.6],[.02,.24]],2.02)}
   else{blade([[-.08,0],[-.13,.2],[0,.62],[.13,.2],[.08,0]],2.04)}
   if(id==='halberd'){blade([[0,0],[.3,.1],[.44,.25],[.38,.61],[.19,.39],[0,.35]],1.52);blade([[0,.2],[-.34,.35],[0,.43]],1.52)}
   if(id==='qiang')for(let i=0;i<12;i++)line([[Math.cos(i)*.05,1.94,Math.sin(i)*.05],[Math.cos(i)*.12,1.75,Math.sin(i)*.12],[Math.cos(i)*.18,1.55,Math.sin(i)*.12]],.009,cloth);
  }else if(['daneaxe','warhammer','mace'].includes(id)){
   cyl(0,.45,0,.04,.05,1.55,wood);for(let i=0;i<11;i++)cyl(0,-.17+i*.045,0,.055,.055,.021,leather);
   if(id==='daneaxe')blade([[-.03,0],[.22,-.22],[.49,-.15],[.6,.23],[.51,.53],[.25,.38],[-.03,.31]],1.04);
   if(id==='warhammer'){box(0,1.15,0,.52,.19,.21,steel);blade([[-.21,0],[-.52,-.17],[-.38,.18],[-.21,.18]],1.12)}
   if(id==='mace'){ell(0,1.2,0,.13,.25,.13,steel);for(let i=0;i<6;i++){const o=box(0,1.2,0,.4,.35,.035,steel);o.rotation.y=i*Math.PI/6;}}
  }else{
   cyl(0,-.13,0,.038,.048,.4,leather);ell(0,-.35,0,.065,.05,.052,trim);
   for(let i=0;i<8;i++){const o=mesh(new T.TorusGeometry(.045,.006,4,12),trim,0,-.3+i*.045,0);o.rotation.x=Math.PI/2;}
   if(['katana','dao'].includes(id)){cyl(0,.08,0,.12,.12,.025,trim);blade([[-.04,0],[.05,0],[.08,.45],[.16,1.02],[.24,1.37],[.12,1.25],[.055,.9],[-.015,.4]],.1)}
   else if(id==='khopesh'){box(0,.08,0,.2,.04,.07,trim);blade([[-.04,0],[.05,0],[.06,.38],[.35,.63],[.4,.9],[.29,1.12],[.09,1.18],[.25,1],[.26,.85],[.14,.72],[-.05,.55]],.1)}
   else if(id==='kopis'){box(0,.08,0,.24,.035,.07,trim);blade([[-.04,0],[.06,0],[.16,.42],[.24,.75],[.14,1.12],[-.02,.81],[-.02,.43]],.1)}
   else {box(0,.08,0,id==='longsword'?.46:.3,.045,.07,trim);const length=id==='xiphos'?.86:id==='longsword'?1.55:1.23;blade([[-.07,0],[-.065,length*.7],[0,length],[.065,length*.7],[.07,0]],.1);box(0,.1+length*.36,.025,.012,length*.65,.009,edge);}
  }
  return group;
 };
 function batchStatic(T,group){
  group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),batches=new Map(),old=[];
  group.traverse(o=>{if(!o.isMesh)return;old.push(o);const m=o.material;if(Array.isArray(m))return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));let b=batches.get(m);if(!b){b={p:[],n:[],uv:[]};batches.set(m,b)}b.p.push(g.attributes.position.array);b.n.push(g.attributes.normal.array);b.uv.push(g.attributes.uv?.array||new Float32Array(g.attributes.position.count*2));g.dispose();});
  const join=arrays=>{const dst=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){dst.set(a,offset);offset+=a.length}return dst};
  for(const o of old){o.parent.remove(o);o.geometry.dispose()}
  for(const [m,b] of batches){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(join(b.p),3));g.setAttribute('normal',new T.BufferAttribute(join(b.n),3));g.setAttribute('uv',new T.BufferAttribute(join(b.uv),2));const mesh=new T.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}
 }
 window.GFBuildHeritageHelmet=function(T,c){
  const {h,helmet}=GFResolveHeritage(c),id=helmet[0],region=c.heritage,g=new T.Group();g.name='helmet-'+id;g.userData.helmetId=id;
  const {mesh,ell,box,cyl,line,shell}=helpers(T,g),body=material(T,c.helmetColor||h.metal,'metal'),face=material(T,c.helmetFaceColor||h.color,'metal'),crest=material(T,c.helmetCrestColor||h.cloth,'cloth'),dark=material(T,'#10151a','cloth');
  body.name='helmet-shell';face.name='helmet-face';crest.name='helmet-crest';
  shell(0,2.99,-.015,.24,.23,.23,body);
  const cheek=()=>{for(const s of [-1,1]){const o=box(s*.18,2.77,.13,.075,.28,.085,face);o.rotation.z=s*.12;}};
  const visor=(full=false)=>{ell(0,2.81,.14,.229,full?.22:.15,.17,face);box(0,2.91,.305,.34,.026,.012,dark);for(let i=-3;i<=3;i++)box(i*.036,2.76,.297,.013,.04,.017,dark);};
  const fan=(count=9,sideways=false)=>{for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*1.7;const plume=ell(sideways?Math.sin(a)*.26:0,3.25+Math.cos(a)*.12,sideways?-.04:Math.sin(a)*.22,.028,.19,.028,crest);plume.rotation.z=sideways?-a*.55:0;plume.rotation.x=sideways?0:a*.6;}};
  const tuft=()=>{for(let i=0;i<9;i++)line([[0,3.2,0],[Math.sin(i)*.04,3.45,-.08],[Math.sin(i)*.06,3.24,-.32]],.014,crest);};
  if(region==='japan'){
   if(id==='jingasa'){mesh(new T.ConeGeometry(.42,.22,32),body,0,3.16,-.02);cheek();tuft();}
   else{
    for(let row=0;row<4;row++){
     const openFace=id==='kabuto';
     const radius=openFace?.234+row*.023:.23+row*.02;
     const geometry=new T.CylinderGeometry(radius,radius+(openFace?.029:.03),openFace?.077:.06,24,1,true,Math.PI*(openFace?.26:.3),Math.PI*(openFace?1.48:1.4));
     mesh(geometry,body,0,openFace?2.915-row*.062:2.88-row*.065,-.02);
    }
    ell(0,3.02,.18,.27,.025,.14,body);
    if(id==='oni'){
     visor(true);
     for(const s of [-1,1]){line([[s*.12,3.13,0],[s*.3,3.33,-.06],[s*.28,3.54,-.12]],.035,crest);mesh(new T.ConeGeometry(.028,.12,8),face,s*.09,2.72,.32).rotation.z=s*.5;}
    }else{
     // A swept sheet seats in the brow mount. Its broad root tapers to two tips.
     const crescent=new T.Shape();
     crescent.moveTo(-.355,.295);
     crescent.quadraticCurveTo(-.18,-.015,0,-.018);
     crescent.quadraticCurveTo(.18,-.015,.355,.295);
     crescent.quadraticCurveTo(.25,-.095,0,-.099);
     crescent.quadraticCurveTo(-.25,-.095,-.355,.295);
     const crestGeo=new T.ExtrudeGeometry(crescent,{depth:.018,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1,curveSegments:10});
     mesh(crestGeo,crest,0,3.16,.211).rotation.x=-.18;
     box(0,3.072,.21,.078,.096,.055,face);
     for(const side of [-1,1]){
      const flap=box(side*.192,2.84,.075,.057,.198,.112,body);
      flap.rotation.z=-side*.14;
      line([[side*.19,2.81,.128],[side*.134,2.714,.135],[side*.034,2.652,.075]],.016,face);
     }
    }
   }
  }else if(region==='china'){
   cheek();if(id==='ming'){cyl(0,3.23,0,.018,.07,.18,body);tuft();}
   if(id==='tiger'){visor(true);for(const s of [-1,1]){ell(s*.17,3.12,.17,.08,.06,.04,face);line([[s*.05,3.18,0],[s*.2,3.6,-.1],[s*.32,3.42,-.35]],.03,crest);}}
   if(id==='jade'){for(let i=-2;i<=2;i++)box(i*.07,3.16,-.04,.025,.19,.3,body);fan(11);box(0,2.92,.245,.04,.17,.035,face);}
  }else if(region==='norse'){
   for(let i=0;i<4;i++){const band=mesh(new T.TorusGeometry(.24,.013,5,24,Math.PI),face,0,2.99,-.01);band.rotation.y=i*Math.PI/2;}
   if(id==='gjermundbu'){for(const s of [-1,1]){const eye=mesh(new T.TorusGeometry(.07,.018,5,18),face,s*.08,2.91,.21);eye.scale.y=.7;}box(0,2.84,.232,.032,.2,.035,face);tuft();}
   if(id==='vendel'){visor(true);ell(0,3.25,0,.07,.09,.18,crest);mesh(new T.ConeGeometry(.05,.15,7),crest,0,3.29,.19).rotation.x=Math.PI/2;}
   if(id==='raven'){cheek();box(0,2.9,.235,.035,.19,.03,face);fan(9,true);}
  }else if(region==='greece'){
   cheek();if(id==='corinthian'){box(0,2.86,.24,.035,.2,.045,face);for(const s of [-1,1])line([[s*.21,2.97,.13],[s*.08,2.99,.22]],.023,face);fan(17);}
   if(id==='attic'){ell(0,3.02,.16,.24,.04,.1,face);fan(13,true);}
   if(id==='phrygian'){line([[0,3.13,0],[0,3.36,.03],[0,3.4,.19],[0,3.29,.24]],.09,body);fan(7);}
  }else if(region==='egypt'){
   for(const s of [-1,1]){const flap=box(s*.23,2.78,-.03,.1,.45,.2,body);flap.rotation.z=s*.14;for(let j=0;j<7;j++)box(s*.23,2.98-j*.05,.08,.1,.014,.012,face);}
   if(id==='nemes'){line([[0,3.1,.2],[0,3.3,.23],[0,3.34,.16]],.034,crest);box(0,2.75,.21,.065,.15,.04,face);}
   if(id==='horus'){ell(0,2.88,.2,.17,.15,.12,face);const beak=mesh(new T.ConeGeometry(.08,.29,12),face,0,2.86,.37);beak.rotation.x=Math.PI/2;fan(11,true);}
   if(id==='anubis'){ell(0,2.82,.22,.13,.13,.19,face);for(const side of [-1,1]){const ear=mesh(new T.ConeGeometry(.085,.45,9),crest,side*.14,3.36,0);ear.rotation.z=side*.15;}}
  }else{
   if(id==='greathelm'){cyl(0,2.94,0,.23,.25,.49,body);box(0,2.96,.25,.36,.026,.02,dark);box(0,2.88,.265,.04,.3,.025,face);box(0,2.99,.26,.4,.035,.025,face);tuft();}
   if(id==='sallet'){ell(0,3,-.13,.25,.16,.34,body);visor();fan(7);}
   if(id==='armet'){visor(true);for(const s of [-1,1])ell(s*.225,2.88,.03,.028,.055,.055,face);fan(9,true);}
  }
  return g;
 };
 window.GFGodAppearance=function(root,T,_mesh,_material,options={}){
  const c=GFNormalizeHeritage(options.config||window.gfGetConfig()),{h,armor}=GFResolveHeritage(c),region=c.heritage,type=armor[3],id=armor[0];
  while(root.children.length){const old=root.children[0];root.remove(old);dispose(old)}
  const figure=new T.Group();figure.name='heritage-body';root.add(figure);
  const female=c.sex==='Female',heavy=c.body==='Heavyset',muscle=c.body==='Muscular';const breadth=heavy?1.16:muscle?1.08:female?.94:1;figure.scale.x=breadth;
  const {mesh,ell,box,cyl,line,shell}=helpers(T,figure);
  const joints=[];const rigs={};
  function joint(name,x,y,z,parent=figure){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);joints.push(g);return g}
  for(const side of [-1,1]){const leg=joint('hip-'+side,side*.18,1.46,0),knee=joint('knee-'+side,side*.015,-.70,.025,leg),arm=joint('shoulder-'+side,side*.43,2.3,0),elbow=joint('elbow-'+side,side*.125,-.48,0,arm),hand=joint('hand-'+side,side*.045,-.46,.045,elbow);rigs[side]={leg,knee,arm,elbow,hand};}
  // Move geometry into its anatomical pivot without changing the bind pose.
  function attachParts(parts,target){figure.updateMatrixWorld(true);for(const o of parts)target.attach(o);}

  const skin=material(T,c.skin||'#bd8565','skin'),hair=material(T,c.hairColor||'#30241f','cloth'),metal=material(T,c.armorColor||h.metal,'metal'),trim=material(T,c.trimColor||h.color,'metal'),fabric=material(T,c.clothColor||h.cloth,'cloth'),leather=material(T,'#302a25','cloth'),dark=material(T,'#141a1d','cloth'),white=material(T,'#dad5c8','skin');
  const armorMat=type==='cloth'||type==='brigandine'?fabric:metal;
  // Human proportions: 3.15 units, approximately seven and a half heads tall.
  // Cross sections specify height, lateral center, forward center and the two radii.
  // Off-center sections carry muscle mass behind the calf and ahead of the thigh.
  function form(name, sections, mat, side=1, target=null) {
   const positions=[], uv=[], indices=[], segments=20;
   for(const [row,[y,x,z,w,d]] of sections.entries()){
    for(let i=0;i<segments;i++){
     const a=i*Math.PI*2/segments;
     positions.push(side*x+w*Math.sin(a),y,z+d*Math.cos(a));
     uv.push(i/segments,row/(sections.length-1));
    }
   }
   for(let row=0;row<sections.length-1;row++)for(let i=0;i<segments;i++){
    const a=row*segments+i,b=row*segments+(i+1)%segments;
    indices.push(a,b,a+segments,b,b+segments,a+segments);
   }
   const last=(sections.length-1)*segments;
   for(let i=1;i<segments-1;i++)indices.push(0,i+1,i,last,last+i,last+i+1);
   const geo=new T.BufferGeometry();
   geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
   geo.setIndex(indices);geo.computeVertexNormals();
   const part=mesh(geo,mat);part.name=name;
   if(target)attachParts([part],target);
   return part;
  }
  form('padded-doublet',[
   [1.31,0,-.02,.26,.19],[1.44,0,-.025,.33,.228],[1.59,0,-.014,.32,.215],
   [1.78,0,0,heavy?.37:.30,.215],[1.98,0,-.007,.365,.24],
   [2.17,0,.004,female?.396:.423,.255],[2.30,0,-.012,.44,.238],
   [2.37,0,-.02,.41,.205],[2.43,0,-.026,.31,.16],[2.49,0,-.023,.175,.12]
  ],fabric);
  form('fitted-collar',[[2.39,0,-.022,.256,.164],[2.46,0,-.021,.205,.15],
   [2.51,0,-.015,.157,.13],[2.535,0,-.01,.148,.124]],leather);
  form('nape',[[2.48,0,-.018,.136,.115],[2.54,0,-.016,.116,.098],
   [2.615,0,-.01,.104,.096],[2.69,0,-.016,.119,.109]],skin);
  // Continuous head topology: shaped jaw, cheekbones, eye sockets and cranial dome.
  const rings=[[2.61,.055,.065],[2.66,.112,.105],[2.72,.148,.132],[2.79,.177,.16],[2.86,.19,.172],[2.94,.188,.172],[3.01,.173,.159],[3.08,.125,.117],[3.12,.02,.02]],positions=[],uvs=[],indices=[];
  const rows=40,segs=64;
  for(let j=0;j<=rows;j++){const y=2.61+j/rows*.51;let k=0;while(k<rings.length-2&&rings[k+1][0]<y)k++;const t=Math.max(0,Math.min(1,(y-rings[k][0])/(rings[k+1][0]-rings[k][0]))),w=rings[k][1]*(1-t)+rings[k+1][1]*t,d=rings[k][2]*(1-t)+rings[k+1][2]*t;
   for(let i=0;i<=segs;i++){const a=i/segs*Math.PI*2,x=Math.sin(a)*w;let z=Math.cos(a)*d-.005;if(z>0){const front=Math.max(0,Math.cos(a));z+=Math.exp(-1*((y-2.8)/.05)**2)*Math.exp(-1*((Math.abs(x)-.115)/.045)**2)*.021;z-=Math.exp(-1*((y-2.89)/.027)**2)*Math.exp(-1*((Math.abs(x)-.073)/.033)**2)*.022;z+=Math.exp(-1*((y-2.68)/.035)**2)*front*.022;}positions.push(x,y,z);uvs.push(i/segs,j/rows);}
  }
  for(let j=0;j<rows;j++)for(let i=0;i<segs;i++){const a=j*(segs+1)+i;indices.push(a,a+1,a+segs+1,a+1,a+segs+2,a+segs+1);}
  const headGeo=new T.BufferGeometry();headGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));headGeo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));headGeo.setIndex(indices);headGeo.computeVertexNormals();const head=mesh(headGeo,skin);head.name='sculpted-human-head';
  const iris=material(T,c.eyeColor||'#647e85','skin'),lip=material(T,'#8e5b4c','skin');
  for(const side of [-1,1]){
   ell(side*.191,2.83,-.01,.025,.056,.023,skin);line([[side*.198,2.87,.006],[side*.208,2.84,.016],[side*.2,2.8,.008]],.006,lip);
   ell(side*.073,2.889,.154,.032,.014,.012,white);ell(side*.073,2.889,.165,.012,.012,.003,iris);ell(side*.073,2.889,.168,.006,.008,.002,dark);ell(side*.069,2.894,.17,.002,.002,.001,white);
   line([[side*.04,2.889,.156],[side*.073,2.905,.165],[side*.106,2.89,.151]],.005,skin);line([[side*.04,2.885,.156],[side*.073,2.877,.165],[side*.106,2.887,.151]],.004,skin);
   line([[side*.033,2.926,.17],[side*.073,2.934,.179],[side*.117,2.924,.153]],.007,hair);
   line([[side*.08,2.83,.16],[side*.13,2.81,.152],[side*.15,2.76,.124]],.003,skin);
  }
  ell(0,2.862,.171,.018,.057,.029,skin);ell(0,2.817,.198,.024,.018,.023,skin);for(const side of [-1,1]){ell(side*.024,2.812,.181,.014,.014,.018,skin);ell(side*.02,2.804,.193,.007,.004,.004,lip);}
  line([[-.044,2.754,.143],[-.014,2.758,.155],[0,2.754,.159],[.014,2.758,.155],[.044,2.754,.143]],.0045,lip);line([[-.038,2.747,.145],[0,2.742,.163],[.038,2.747,.145]],.006,lip);
  shell(0,2.98,-.025,.198,.158,.184,hair);
  for(let i=0;i<21;i++){const x=(i-10)*.014;line([[x,3.025,.14-Math.abs(x)*.2],[x*.8-.025,3.125,.035],[x*.7-.035,3.085,-.115]],.006,hair);}
  for(const side of [-1,1]){const tendon=ell(side*.078,2.5,.035,.028,.12,.035,skin);tendon.rotation.z=side*-.28;}
  // Anatomical limbs, fitted sleeves and gloves; no oversized floating pauldrons.
  for(const s of [-1,1]){
   const {leg,knee,arm,elbow,hand}=rigs[s];
   const bare=region==='greece'||region==='egypt',sleeve=bare?skin:fabric;
   const width=muscle?1.10:heavy?1.08:1;
   form('thigh',[[.716,.195,.021,.097,.105],[.79,.195,.028,.119,.134],
    [.89,.19,.021,.128,.15],[1.05,.184,.013,.149*width,.173],
    [1.23,.18,-.012,.172*width,.185],[1.39,.171,-.027,.17,.177],[1.51,.168,-.022,.141,.142]],fabric,s,leg);
   form('calf-and-ankle',[[.108,.202,-.016,.079,.085],[.22,.202,-.025,.078,.09],
    [.35,.205,-.034,.091,.111],[.50,.208,-.044,.125,.142],[.60,.201,-.032,.133,.137],
    [.69,.197,.005,.112,.114],[.765,.195,.031,.112,.127],[.812,.195,.022,.096,.093]],leather,s,knee);
   form('heeled-boot',[[.006,.201,.075,.119,.214],[.034,.201,.077,.124,.22],
    [.065,.201,.071,.123,.218],[.094,.201,.053,.118,.202],[.127,.201,.016,.105,.154],
    [.17,.201,-.018,.091,.112],[.213,.201,-.026,.082,.095]],leather,s,knee);
   form('deltoid-to-elbow',[[1.774,.556,0,.075,.079],[1.854,.552,-.014,.088,.10],
    [1.97,.53,-.012,.103*width,.121],[2.09,.51,.005,.127*width,.138],
    [2.18,.481,-.003,.134*width,.141],[2.295,.443,-.008,.15*width,.156],
    [2.372,.416,-.012,.128,.134],[2.425,.395,-.013,.055,.074]],sleeve,s,arm);
   form('forearm',[[1.32,.60,.045,.056,.049],[1.397,.599,.041,.058,.058],
    [1.50,.59,.034,.072,.083],[1.64,.576,.019,.097*width,.105],
    [1.731,.561,.004,.097,.099],[1.818,.555,-.006,.084,.084],[1.86,.554,-.004,.064,.069]],type==='plate'?metal:sleeve,s,elbow);
   form('bracer',[[1.415,.595,.04,.068,.069],[1.435,.594,.039,.071,.074],
    [1.546,.586,.031,.088,.096],[1.578,.583,.027,.094,.10]],leather,s,elbow);
   form('palm',[[1.265,.60,.056,.052,.038],[1.30,.60,.051,.069,.047],
    [1.358,.599,.047,.064,.046],[1.402,.599,.042,.052,.045]],skin,s,hand);
   const fingers=figure.children.length;
   for(let f=0;f<4;f++){const x=s*(.554+f*.029),y=1.276+Math.abs(f-1)*.008;
    line([[x,y,.053],[x,y-.04,.068],[x+s*.004,y-.049,.096],[x+s*.005,y-.029,.11]],.016,skin);}
   line([[s*.548,1.345,.054],[s*.533,1.317,.087],[s*.548,1.295,.113]],.021,skin);
   attachParts(figure.children.slice(fingers),hand);

  }
  // Cuirass: curved strips wrap the body, with a slim edge at every seam.
  const bands=(rows,top,bottom,mat)=>{for(let i=0;i<rows;i++){const y=bottom+(top-bottom)*i/(rows-1);const radius=y>2.1?.42:y>1.8?.36:.33;const o=cyl(0,y,0,radius,radius*.98,(top-bottom)/rows*.88,mat);o.scale.z=.66;const edge=cyl(0,y+.024,0,radius+.006,radius+.006,.012,trim);edge.scale.z=.66;}};
  if(id==='oyoroi'){
   // Overlapping courses follow the same rib cage and waist as the padded body.
   for(let row=0;row<8;row++){
    const y=1.62+row*.098;
    const radius=[.331,.326,.324,.349,.383,.416,.438,.446][row];
    const depth=[.233,.234,.235,.245,.257,.271,.279,.275][row];
    form('lacquer-course',[[y-.055,0,0,radius+.010,depth+.012],
     [y-.043,0,0,radius+.016,depth+.015],[y+.034,0,0,radius+.006,depth+.006],
     [y+.055,0,0,radius-.005,depth-.004]],metal);
    for(let i=0;i<16;i++){
     const angle=(i+.5)*Math.PI/8;
     const pts=[[-.045,-.024],[0,.008],[.041,.043]].map(([a,h])=>new T.Vector3(
      Math.sin(angle+a)*(radius+.015),y+h,Math.cos(angle+a)*(depth+.013)));
     mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),3,.011,4,false),fabric);
    }
   }
  }else if(type==='lamellar'||type==='scale'){
   for(let row=0;row<7;row++)for(let j=0;j<14;j++){const a=j/14*Math.PI*2+(row%2)*.11,y=1.65+row*.105,r=y>2.05?.424:.35;const o=box(Math.sin(a)*r,y,Math.cos(a)*r*.68,.13,.12,.035,metal);o.rotation.y=a;if(type==='scale'){o.geometry.dispose();o.geometry=new T.SphereGeometry(1,10,8);o.scale.set(.065,.076,.025)}if(j%2===0)ell(Math.sin(a)*(r+.022),y+.028,Math.cos(a)*(r*.68+.018),.012,.012,.01,trim)}
  }else if(type==='mail'){
   bands(10,2.32,1.5,metal);for(let row=0;row<15;row++)for(let j=0;j<13;j++){const a=-1.45+j*.24,r=row>9?.34:.42;const o=mesh(new T.TorusGeometry(.023,.005,3,7),metal,Math.sin(a)*r,2.3-row*.05,Math.cos(a)*r*.69);o.rotation.y=a}
  }else if(type==='plate'){
   const plate=mesh(new T.LatheGeometry([[.345,1.73],[.375,1.88],[.445,2.13],[.458,2.32],[.32,2.43]].map(p=>new T.Vector2(...p)),36),metal,0,0,.008);plate.scale.z=.68;bands(3,1.74,1.5,metal);
   line([[0,1.74,.25],[0,2,.316],[0,2.32,.21]],.012,trim);
   for(const s of [-1,1])line([[s*.31,1.83,.22],[s*.34,2.1,.22],[s*.25,2.31,.21]],.014,trim);
   if(id==='gothic')for(const s of [-1,1])for(let i=0;i<3;i++)line([[s*(.08+i*.06),1.82,.285],[s*(.11+i*.07),2.02,.29],[s*(.13+i*.06),2.24,.25]],.008,trim);
  }else{
   bands(6,2.31,1.62,fabric);
   for(let j=-3;j<=3;j++)line([[j*.09,1.61,.24],[j*.11,2,.28],[j*.1,2.3,.22]],.007,type==='brigandine'?trim:leather);
   if(type==='brigandine')for(let y=1.65;y<2.3;y+=.11)for(let x=-.3;x<=.3;x+=.1)ell(x,y,.27,.014,.014,.012,trim);
  }
  for(const side of [-1,1])for(let i=0;i<6;i++)ell(side*(.30+i*.004),1.7+i*.1,.21,.012,.012,.012,trim);
  const belt=cyl(0,1.5,0,.34,.34,.09,leather);belt.scale.z=.7;box(0,1.5,.249,.105,.075,.025,trim);
  // Region-specific skirts and shoulder construction.
  const skirtRows=region==='japan'?5:region==='china'?3:1;
  for(let j=0;j<10;j++){const a=j*Math.PI/5;for(let row=0;row<skirtRows;row++){const r=.36+row*.02,y=1.35-row*.095;const o=box(Math.sin(a)*r,y,Math.cos(a)*r*.71,.2,skirtRows===1?.35:.1,.045,region==='greece'||region==='egypt'?fabric:armorMat);o.rotation.y=a;o.rotation.x=Math.cos(a)*-.1;}}
  for(const s of [-1,1]){
   const shoulderStart=figure.children.length;
   if(region==='japan' && id==='oyoroi'){
    const guard=joint('suspended-sode-'+s,0,.11,0,rigs[s].arm);
    rigs[s].guard=guard;
    buildOyoroiGuard(T,s,{mesh,line},{metal,fabric,trim});
    attachParts(figure.children.slice(shoulderStart),guard);
   }else if(region==='japan'||region==='china'){for(let i=0;i<3;i++){const p=box(s*(.45+i*.012),2.4-i*.085,0,.22,.085,.35,metal);p.rotation.z=s*.12;for(let z=-.12;z<=.12;z+=.12)box(s*(.45+i*.012),2.42-i*.085,z,.04,.045,.025,fabric)}}
   else if(type==='plate'){for(let i=0;i<3;i++){const o=ell(s*(.42+i*.035),2.36-i*.07,0,.19,.1,.2,metal);o.rotation.z=s*-.18}}
   else if(region==='norse'&&id==='chieftain'){for(let j=0;j<13;j++)ell(s*(.25+j*.019),2.35+Math.sin(j)*.015,-.03,.1,.085,.12,material(T,j%2?'#716251':'#8a7b65','cloth'))}
   attachParts(figure.children.slice(shoulderStart),rigs[s].arm);
   const greaveStart=figure.children.length;
   if(['japan','greece','europe'].includes(region)){
    // Fold the greave around the shin, leaving the calf and ankle free to bend.
    const verts=[],uv=[],idx=[];
    const rows=[[.194,.077,.071],[.27,.091,.08],[.48,.124,.104],[.61,.138,.112],[.69,.122,.132]];
    for(const [r,[y,w,d]] of rows.entries())for(let i=0;i<=10;i++){
     const u=(i-5)/5,a=u*1.46;
     const tip=r===4?.067*(1-Math.abs(u)):0;
     verts.push(s*.2+w*Math.sin(a),y+tip,-.006+d*Math.cos(a)+.016*(1-Math.abs(u)));
     uv.push(i/10,r/4);
     if(r&&i){const n=r*11+i;idx.push(n-12,n-11,n-1,n-11,n,n-1);}
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(verts,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    mesh(g,metal);
   }
   attachParts(figure.children.slice(greaveStart),rigs[s].knee);
  }
  const shieldStart=figure.children.length;
  if(id==='hoplite'){const shield=cyl(-.64,1.65,.14,.41,.41,.055,metal);shield.rotation.x=Math.PI/2;ell(-.64,1.65,.18,.34,.34,.07,trim);for(let i=0;i<12;i++){const a=i*Math.PI/6;ell(-.64+Math.sin(a)*.37,1.65+Math.cos(a)*.37,.18,.017,.017,.012,trim)}}
  attachParts(figure.children.slice(shieldStart),rigs[-1].elbow);
  if(region==='egypt'){for(let i=0;i<4;i++){const o=mesh(new T.TorusGeometry(.15+i*.039,.025,6,32,Math.PI*1.65),trim,0,2.4-i*.026,.03);o.rotation.x=Math.PI/2;}if(id==='pharaoh')box(0,2.1,.31,.07,.25,.025,trim)}
  if(region==='greece'||region==='norse'||(region==='europe'&&id==='hauberk')){
   const g=new T.PlaneGeometry(.65,1.55,10,14),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*36)*.035+(0.8-y)*.045)}g.computeVertexNormals();const m=fabric.clone();m.side=T.DoubleSide;const cape=mesh(g,m,-.08,1.47,-.26);cape.rotation.x=.08;
  }
  if(c.heritageHelmet!==false)figure.add(GFBuildHeritageHelmet(T,c));
  // Preview weapon and combat weapon are constructed by this same function.
  if(options.weapon!==false){const w=GFBuildHeritageWeapon(T,c);w.position.set(.6,1.36,.06);w.rotation.z=-.13;figure.add(w);attachParts([w],rigs[1].hand)}
  if(options.batch!==false){
   // Batch each rigid segment independently; never flatten the joint hierarchy.
   for(const group of [...joints].reverse().concat(figure)){const children=group.children.filter(o=>!o.isMesh);children.forEach(o=>group.remove(o));batchStatic(T,group);children.forEach(o=>group.add(o));}
  }
  root.userData.rig=rigs;root.userData.gait=0;
root.userData.handX=.6*breadth;root.userData.heritageKey=GFLoadoutKey(c);root.userData.heritage=c.heritage;root.userData.armor=c.heritageArmor;root.userData.weapon=c.heritageWeapon;
  return root;
 };
window.GFAnimateFigure=function(root,dt,{moving=0,backward=false,attack=0,airborne=false}={}){
  const rig=root?.userData.rig;if(!rig)return;
  root.userData.gait=(root.userData.gait||0)+dt*10*Math.min(1,Math.abs(moving));
  const phase=root.userData.gait,blend=1-Math.exp(-dt*18),amount=Math.min(1,Math.abs(moving));
  for(const side of [-1,1]){const j=rig[side],stride=Math.sin(phase+(side===1?Math.PI:0))*amount*(backward?-1:1);
   const hip=airborne?-.55:stride*.64,knee=airborne?1.05:Math.max(0,-Math.sin(phase+(side===1?Math.PI:0)-.35))*amount*1.05;
   j.leg.rotation.x+=(hip-j.leg.rotation.x)*blend;j.knee.rotation.x+=(knee-j.knee.rotation.x)*blend;
   let arm=-stride*.38,elbow=-.22-Math.max(0,Math.sin(phase+(side===1?Math.PI:0)+.8))*amount*.5;
   if(airborne){arm=-.6;elbow=-.5;}
   if(attack>0&&side===1){arm=-Math.sin(attack*Math.PI)*1.45;elbow=-.15-Math.sin(Math.min(1,attack*1.6)*Math.PI)*1.15;}
   j.arm.rotation.x+=(arm-j.arm.rotation.x)*blend;j.elbow.rotation.x+=(elbow-j.elbow.rotation.x)*blend;
   if(j.guard){
    // Lacing allows a little delayed travel while the shoulder carries the load.
    const restAngle=-.22*j.arm.rotation.x;
    j.guard.rotation.x+=(restAngle-j.guard.rotation.x)*(1-Math.exp(-dt*9));
   }
   j.arm.rotation.z=side===1&&attack>0?-Math.sin(attack*Math.PI)*.35:0;
  }
 };
})();
