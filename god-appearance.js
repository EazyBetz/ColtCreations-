/* Shared region-aware body, armor and weapon geometry. Y is up; +Z is forward. */
(function(){
 const dispose=root=>{const mats=new Set(),geos=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m))});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())};
 window.GFDisposeFigure=dispose;
 const surfaceMaps=new Map();
 function material(T,color,kind){
  const m=new T.MeshPhysicalMaterial({color,metalness:kind==='metal'?.68:0,roughness:kind==='metal'?.38:kind==='skin'?.6:.88,clearcoat:kind==='metal'?.16:0,clearcoatRoughness:.45,sheen:kind==='cloth'?.35:0,sheenColor:new T.Color(color),sheenRoughness:.9});
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
   else{for(let i=0;i<4;i++)mesh(new T.CylinderGeometry(.23+i*.02,.26+i*.02,.06,24,1,true,Math.PI*.3,Math.PI*1.4),body,0,2.88-i*.065,-.02);ell(0,3.02,.18,.27,.025,.14,body);visor(id==='oni');
    if(id==='oni'){for(const s of [-1,1]){line([[s*.12,3.13,0],[s*.3,3.33,-.06],[s*.28,3.54,-.12]],.035,crest);mesh(new T.ConeGeometry(.028,.12,8),face,s*.09,2.72,.32).rotation.z=s*.5;}}
    else for(const s of [-1,1])line([[s*.02,3.14,.17],[s*.2,3.27,.15],[s*.28,3.5,.08]],.026,crest);
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
  const skin=material(T,c.skin||'#bd8565','skin'),hair=material(T,c.hairColor||'#30241f','cloth'),metal=material(T,c.armorColor||h.metal,'metal'),trim=material(T,c.trimColor||h.color,'metal'),fabric=material(T,c.clothColor||h.cloth,'cloth'),leather=material(T,'#302a25','cloth'),dark=material(T,'#141a1d','cloth'),white=material(T,'#dad5c8','skin');
  const armorMat=type==='cloth'||type==='brigandine'?fabric:metal;
  // Human proportions: 3.15 units, approximately seven and a half heads tall.
  const torsoPoints=[[.28,1.44],[.32,1.58],[heavy?.43:.32,1.85],[female?.41:.44,2.13],[female?.4:.46,2.35],[.3,2.45]].map(([r,y])=>new T.Vector2(r,y));
  const torso=mesh(new T.LatheGeometry(torsoPoints,36),fabric);torso.scale.z=.63;
  cyl(0,2.5,0,.105,.13,.16,skin);
  const head=ell(0,2.86,-.014,.192,.266,.18,skin);ell(0,2.715,.035,.143,.125,.131,skin);ell(0,2.66,.09,.093,.055,.072,skin);for(const side of [-1,1])ell(side*.112,2.79,.127,.071,.065,.041,skin);
  for(const s of [-1,1]){
   ell(s*.203,2.83,-.005,.038,.071,.031,skin);
   ell(s*.073,2.89,.175,.034,.011,.01,white);ell(s*.073,2.89,.188,.01,.01,.004,dark);
   line([[s*.03,2.936,.181],[s*.08,2.946,.177],[s*.121,2.934,.16]],.009,hair);
  }
  ell(0,2.85,.17,.021,.061,.035,skin);ell(0,2.812,.197,.028,.022,.027,skin);for(const side of [-1,1])ell(side*.025,2.805,.188,.017,.012,.015,skin);line([[-.045,2.752,.158],[0,2.747,.171],[.045,2.752,.158]],.006,material(T,'#68473b','skin'));
  shell(0,2.92,-.018,.213,.21,.196,hair);
  // Anatomical limbs, fitted sleeves and gloves; no oversized floating pauldrons.
  for(const s of [-1,1]){
   const thigh=ell(s*.18,1.13,0,.17,.43,.175,fabric);thigh.rotation.z=s*.035;
   ell(s*.195,.76,.035,.127,.13,.13,leather);ell(s*.2,.43,0,.115,.31,.12,type==='plate'?metal:leather);
   ell(s*.2,.095,.075,.13,.1,.23,leather);
   const shoulder=ell(s*.43,2.3,0,.16,.18,.165,fabric);
   const upper=ell(s*.51,2.06,0,.12,.28,.125,fabric);upper.rotation.z=s*.13;
   ell(s*.555,1.82,0,.105,.1,.115,leather);
   ell(s*.58,1.6,.025,.095,.22,.105,type==='plate'?metal:fabric);
   ell(s*.6,1.36,.045,.062,.077,.045,skin);for(let f=0;f<4;f++)ell(s*.6+(f-1.5)*.023,1.275-Math.sin(f/3*Math.PI)*.012,.055,.013,.055,.018,skin);ell(s*.66,1.34,.075,.025,.045,.025,skin);
   for(let k=0;k<3;k++)cyl(s*.58,1.45+k*.08,.025,.105,.105,.025,trim);
  }
  // Cuirass: curved strips wrap the body, with a slim edge at every seam.
  const bands=(rows,top,bottom,mat)=>{for(let i=0;i<rows;i++){const y=bottom+(top-bottom)*i/(rows-1);const radius=y>2.1?.42:y>1.8?.36:.33;const o=cyl(0,y,0,radius,radius*.98,(top-bottom)/rows*.88,mat);o.scale.z=.66;const edge=cyl(0,y+.024,0,radius+.006,radius+.006,.012,trim);edge.scale.z=.66;}};
  if(type==='lamellar'||type==='scale'){
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
  const belt=cyl(0,1.5,0,.34,.34,.09,leather);belt.scale.z=.7;box(0,1.5,.249,.105,.075,.025,trim);
  // Region-specific skirts and shoulder construction.
  const skirtRows=region==='japan'?5:region==='china'?3:1;
  for(let j=0;j<10;j++){const a=j*Math.PI/5;for(let row=0;row<skirtRows;row++){const r=.36+row*.02,y=1.35-row*.095;const o=box(Math.sin(a)*r,y,Math.cos(a)*r*.71,.2,skirtRows===1?.35:.1,.045,region==='greece'||region==='egypt'?fabric:armorMat);o.rotation.y=a;o.rotation.x=Math.cos(a)*-.1;}}
  for(const s of [-1,1]){
   if(region==='japan'||region==='china'){const broad=id==='oyoroi';for(let i=0;i<(broad?5:3);i++){const p=box(s*(.45+i*.012),2.4-i*.085,0,broad?.29:.22,.085,.35,metal);p.rotation.z=s*.12;for(let z=-.12;z<=.12;z+=.12)box(s*(.45+i*.012),2.42-i*.085,z,.04,.045,.025,fabric)}}
   else if(type==='plate'){for(let i=0;i<3;i++){const o=ell(s*(.42+i*.035),2.36-i*.07,0,.19,.1,.2,metal);o.rotation.z=s*-.18}}
   else if(region==='norse'&&id==='chieftain'){for(let j=0;j<13;j++)ell(s*(.25+j*.019),2.35+Math.sin(j)*.015,-.03,.1,.085,.12,material(T,j%2?'#716251':'#8a7b65','cloth'))}
   if(['japan','greece','europe'].includes(region)){const o=ell(s*.2,.43,.075,.119,.26,.086,metal);line([[s*.2,.2,.15],[s*.2,.67,.15]],.01,trim)}
  }
  if(id==='hoplite'){const shield=cyl(-.64,1.65,.14,.41,.41,.055,metal);shield.rotation.x=Math.PI/2;ell(-.64,1.65,.18,.34,.34,.07,trim);for(let i=0;i<12;i++){const a=i*Math.PI/6;ell(-.64+Math.sin(a)*.37,1.65+Math.cos(a)*.37,.18,.017,.017,.012,trim)}}
  if(region==='egypt'){for(let i=0;i<4;i++){const o=mesh(new T.TorusGeometry(.15+i*.039,.025,6,32,Math.PI*1.65),trim,0,2.4-i*.026,.03);o.rotation.x=Math.PI/2;}if(id==='pharaoh')box(0,2.1,.31,.07,.25,.025,trim)}
  if(region==='greece'||region==='norse'||(region==='europe'&&id==='hauberk')){
   const g=new T.PlaneGeometry(.65,1.55,10,14),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*36)*.035+(0.8-y)*.045)}g.computeVertexNormals();const m=fabric.clone();m.side=T.DoubleSide;const cape=mesh(g,m,-.08,1.47,-.26);cape.rotation.x=.08;
  }
  if(c.heritageHelmet!==false)figure.add(GFBuildHeritageHelmet(T,c));
  // Preview weapon and combat weapon are constructed by this same function.
  if(options.weapon!==false){const w=GFBuildHeritageWeapon(T,c);w.position.set(.6,1.36,.06);w.rotation.z=-.13;figure.add(w)}
  if(options.batch!==false)batchStatic(T,figure);root.userData.handX=.6*breadth;root.userData.heritageKey=GFLoadoutKey(c);root.userData.heritage=c.heritage;root.userData.armor=c.heritageArmor;root.userData.weapon=c.heritageWeapon;
  return root;
 };
})();
