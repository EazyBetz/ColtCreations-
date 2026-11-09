// Godforged Phase 21: shared Z-up GLB character pipeline and rebuilt 3D Witchwood.
const GF21 = (() => {
 let T, Loader, renderer, scene, camera, hero, modelRoot, animationFrame, prev=0, yaw=0, pitch=.16;
 let weaponRig=null,weaponGrip=null,weaponAttackAge=0,weaponAttackStep=1,activeWeapon='',active=false, loading=false, initialized=false, combatForge=null, speedBuffUntil=0, position={x:0,z:24}, mobs=[], buffs=[], demonDogs=[], effects=[], strike=0, attackTime=0, look=null;
 let matchStartedAt=0,matchElapsed=0,matchEnded=false,baseStructures=[],sanctuaries=[],bots=[],hp=350,maxHp=350,gold=500,xp=0,level=1,kills=0,lastWave=0,recallUntil=0,respawnAt=0,shopOpen=false,baseFountain=null,baseHud=null,gameTime=0,shopPanel=null,utilityCooldown=0,shieldUntil=0,stunUntil=0,ownedItems={},powerBonus=0,armorBonus=0;
 const canvas=document.createElement('canvas');canvas.id='gf21Battle';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:none';
 document.getElementById('battle').insertBefore(canvas,document.getElementById('battle').firstChild);
 document.getElementById('world').style.display='none';
 const $=id=>document.getElementById(id);
 const color=(hex,fallback)=>{try{return new T.Color(hex||fallback)}catch{return new T.Color(fallback)}};
 function material(hex,rough=.85){return new T.MeshStandardMaterial({color:hex,roughness:rough,metalness:.08})}
 // Phase 31: authored surface maps. These affect only environment/actor visuals.
 const gf31Materials={};
 function surface(name,tint='#ffffff',repeat=1){
  let key=name+'|'+tint+'|'+repeat;
  if(gf31Materials[key])return gf31Materials[key];
  const texture=new T.TextureLoader().load('assets/'+name+'.jpg');
  texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.repeat.set(repeat,repeat);texture.anisotropy=4;
  return gf31Materials[key]=new T.MeshStandardMaterial({map:texture,color:tint,roughness:name==='iron'?.58:.91,metalness:name==='iron'?.55:.02});
 }

 function mesh(geometry,mat,x,y,z,parent=scene){let m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;parent.add(m);return m}
 function block(x,y,z,w,h,d,mat){return mesh(new T.BoxGeometry(w,h,d),mat,x,y,z)}
 const bark=()=>surface('bark','#c1b0a1'), darkLeaves=()=>surface('foliage','#9cba9c');
 function trunk(x,z,height=10,seed=1){const g=new T.Group();g.position.set(x,0,z);scene.add(g);let b=bark(),leaf=darkLeaves();let stem=mesh(new T.CylinderGeometry(.4,.8,height,8),b,0,height/2,0,g);stem.rotation.z=Math.sin(seed*8)*.08;for(let j=0;j<4;j++){let ang=seed*3+j*2.4;let branch=mesh(new T.CylinderGeometry(.12,.26,4.5+j*.6,6),b,Math.cos(ang)*(1.4+j*.2),height*.68+j*.35,Math.sin(ang)*(1.4+j*.2),g);branch.rotation.z=Math.PI/2.7;branch.rotation.y=ang;let canopy=mesh(new T.IcosahedronGeometry(2.2+j*.35,1),leaf,Math.cos(ang)*(2.8+j*.3),height*.7+j*.4,Math.sin(ang)*(2.8+j*.3),g);canopy.scale.set(1.15,.72,1.0)}mesh(new T.IcosahedronGeometry(3.1,1),leaf,0,height+1.5,0,g).scale.set(1,.9,1);return g}
 function grave(x,z){let stone=material('#64635c');block(x,.45,z,.75,.9,.23,stone);mesh(new T.SphereGeometry(.38,8,6),stone,x,.9,z);if((Math.abs(x*13+z*7)%3)<1)block(x,1.2,z,.13,.52,.13,stone)}
 function cottage(x,z,seed=1){let g=new T.Group();g.position.set(x,0,z);g.rotation.y=Math.sin(seed*3)*.35;scene.add(g);let w=4.5+(seed%3),d=4.2+((seed*3)%3),h=3.6+(seed%2);let wall=surface('plaster'),roof=surface('slate');mesh(new T.BoxGeometry(w,h,d),wall,0,h/2,0,g);let top=mesh(new T.ConeGeometry(Math.max(w,d)*.77,2.8,4),roof,0,h+1.2,0,g);top.rotation.y=Math.PI/4;mesh(new T.BoxGeometry(.95,2,.16),material('#191917'),0,1,d/2+.08,g);for(let side of [-1,1]){mesh(new T.BoxGeometry(.7,.8,.13),material('#b89052'),side*w*.3,2.3,d/2+.1,g);mesh(new T.BoxGeometry(.09,.85,.16),material('#2b2522'),side*w*.3,2.3,d/2+.2,g)}if(seed%2<1)mesh(new T.BoxGeometry(.75,2.4,.8),wall,w*.28,h+1.1,-d*.2,g);if(seed%3<1){mesh(new T.CylinderGeometry(.09,.09,2.8,6),material('#393328'),-w*.6,1.4,0,g);mesh(new T.IcosahedronGeometry(.75,0),material('#ac6b35'),-w*.6,2.9,0,g)}return g}
 function chapel(x,z,seed){let g=new T.Group();g.position.set(x,0,z);scene.add(g);let stone=surface('masonry'),slate=surface('slate');mesh(new T.BoxGeometry(8,7,12),stone,0,3.5,0,g);let roof=mesh(new T.ConeGeometry(7.6,4.5,4),slate,0,9.1,0,g);roof.rotation.y=Math.PI/4;mesh(new T.BoxGeometry(2.6,12,3),stone,0,6,-4.5,g);mesh(new T.ConeGeometry(2.4,5,4),slate,0,14.5,-4.5,g).rotation.y=Math.PI/4;mesh(new T.BoxGeometry(.35,3,.35),material('#a69c8a'),0,18,-4.5,g);mesh(new T.BoxGeometry(2,2.2,.16),material('#9b6d4c'),0,2.4,6.08,g);return g}
 // Phase 23: village district grammar. Stable seeded variety, all buildings remain off lanes.
 const townMats={wood:null,beam:null,roof:null,iron:null,glass:null,plank:null,stone:null,lantern:null};
 function townMaterials(){if(townMats.wood)return;Object.assign(townMats,{wood:surface('timber'),beam:surface('bark','#8b7c69'),roof:surface('slate'),iron:surface('iron'),glass:new T.MeshStandardMaterial({color:'#efb86d',emissive:'#b45e25',emissiveIntensity:.7}),plank:surface('timber','#d2b59b'),stone:surface('masonry'),lantern:new T.MeshStandardMaterial({color:'#ffd18a',emissive:'#ed9a40',emissiveIntensity:1.3})})}
 function hut(x,z,seed,kind='house'){
  townMaterials();const g=new T.Group();g.position.set(x,0,z);g.rotation.y=Math.sin(seed*2.7)*.27;scene.add(g);
  const r=seed-Math.floor(seed),w=kind==='shed'?3.6:4.7+r*2.9,d=kind==='shed'?3.5:4.5+(Math.sin(seed*3)+1)*1.1,h=kind==='shed'?2.9:3.8+(Math.sin(seed*7)+1)*.65;
  const wall=surface('plaster',['#cbb8a3','#d6c9b5','#b7b8a6','#c4a997','#9aaea5'][Math.abs(Math.floor(seed*7))%5]);
  const roof=surface('slate',['#58626a','#775f63','#5c706a','#665b6b'][Math.abs(Math.floor(seed*3))%4]);
  mesh(new T.BoxGeometry(w,h,d),wall,0,h/2,0,g);
  // Actual pitched roof: two angled wooden roof panels and a ridge, not a cone.
  const roofRise=kind==='shed'?1.25:2.1,half=w/2+.42,slope=Math.atan2(roofRise,half);
  for(let side of [-1,1]){const panel=mesh(new T.BoxGeometry(Math.hypot(half,roofRise)+.45,.22,d+.85),roof,side*half/2,h+roofRise/2,0,g);panel.rotation.z=side*slope;}
  mesh(new T.BoxGeometry(.32,.3,d+.95),townMats.beam,0,h+roofRise,0,g);
  // Exposed timber frame and deliberately asymmetric windows.
  for(let side of [-1,1]){mesh(new T.BoxGeometry(.23,h,.26),townMats.beam,side*(w/2-.15),h/2,d/2+.04,g);mesh(new T.BoxGeometry(.22,h,.24),townMats.beam,side*(w/2-.15),h/2,-d/2-.04,g)}
  mesh(new T.BoxGeometry(w,.22,.3),townMats.beam,0,h*.73,d/2+.05,g);
  mesh(new T.BoxGeometry(w+.15,.35,d+.15),townMats.stone,0,.18,0,g);
  for(const side of [-1,1]){mesh(new T.BoxGeometry(.24,.8,.38),townMats.plank,side*(w/2-.3),h-.3,d/2+.18,g);mesh(new T.BoxGeometry(.24,.8,.38),townMats.plank,side*(w/2-.3),h-.3,-d/2-.18,g)}
  mesh(new T.BoxGeometry(.2,.14,d+.9),townMats.iron,0,h+roofRise+.2,0,g);
  const doorX=(Math.sin(seed*5)>.2?w*.18:-w*.18);mesh(new T.BoxGeometry(1.08,2.25,.13),townMats.beam,doorX,1.13,d/2+.11,g);mesh(new T.BoxGeometry(.1,.1,.14),townMats.iron,doorX+.35,1.12,d/2+.23,g);
  if(kind!=='shed'){for(let i=0;i<(kind==='inn'?3:2);i++){let wx=-w*.33+i*w*.32;if(Math.abs(wx-doorX)<.8)continue;mesh(new T.BoxGeometry(.74,.83,.13),townMats.glass,wx,h*.56,d/2+.15,g);mesh(new T.BoxGeometry(.11,.9,.16),townMats.beam,wx,h*.56,d/2+.25,g);mesh(new T.BoxGeometry(.8,.12,.16),townMats.beam,wx,h*.56,d/2+.25,g);mesh(new T.BoxGeometry(.94,.12,.36),townMats.stone,wx,h*.56-.48,d/2+.33,g)} }
  if(seed%3<1.7){mesh(new T.BoxGeometry(.9,2.3,.9),wall,w*.28,h+1,-d*.2,g);mesh(new T.BoxGeometry(1.13,.2,1.13),townMats.stone,w*.28,h+2.2,-d*.2,g)}
  if(kind==='inn'){const sign=mesh(new T.BoxGeometry(1.9,.75,.18),townMats.plank,-w*.2,2.8,d/2+.38,g);sign.rotation.z=-.08;mesh(new T.BoxGeometry(.1,.9,.12),townMats.iron,-w*.2,3.4,d/2+.35,g)}
  if(kind==='shed'){mesh(new T.BoxGeometry(1.7,1.7,.15),townMats.plank,0,.85,d/2+.2,g);mesh(new T.BoxGeometry(.14,1.9,.18),townMats.beam,0,.85,d/2+.3,g)}
  return g;
 }
 function fence(x,z,angle,len=8){townMaterials();const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);for(let i=-len/2;i<=len/2;i+=2){mesh(new T.BoxGeometry(.23,1.45,.23),townMats.beam,i,.73,0,g);mesh(new T.ConeGeometry(.19,.42,4),townMats.plank,i,1.63,0,g)}for(let y of [.52,1.13])mesh(new T.BoxGeometry(len+.3,.14,.17),townMats.plank,0,y,0,g)}
 function lamppost(x,z){townMaterials();const g=new T.Group();g.position.set(x,0,z);scene.add(g);mesh(new T.CylinderGeometry(.12,.19,3.4,6),townMats.iron,0,1.7,0,g);mesh(new T.BoxGeometry(.85,.85,.85),townMats.glass,0,3.6,0,g);mesh(new T.ConeGeometry(.72,.55,4),townMats.roof,0,4.32,0,g)}
 function bridge(x,z,wide=11){townMaterials();const g=new T.Group();g.position.set(x,0,z);scene.add(g);for(let j=-3;j<=3;j++){const plank=mesh(new T.BoxGeometry(wide,.23,1.1),townMats.plank,0,.22+(.7-Math.abs(j)*.18),j*1.08,g);plank.rotation.z=Math.sin(j*3)*.013}for(let side of [-1,1]){for(let j=-3;j<=3;j+=2)mesh(new T.BoxGeometry(.24,1.35,.24),townMats.beam,side*(wide/2-.3),1.15,j*1.08,g);mesh(new T.BoxGeometry(.22,.22,7.8),townMats.beam,side*(wide/2-.3),1.76,0,g)}}
 function market(x,z,seed){townMaterials();const g=new T.Group();g.position.set(x,0,z);g.rotation.y=Math.sin(seed)*.4;scene.add(g);for(let side of [-1,1])for(let front of [-1,1])mesh(new T.CylinderGeometry(.1,.13,2.8,6),townMats.beam,side*2,1.4,front*1.6,g);const awning=mesh(new T.BoxGeometry(4.7,.14,3.9),material(['#57443e','#49445d','#55513d'][Math.floor(seed)%3]),0,2.85,0,g);awning.rotation.z=.07;for(let j=-1;j<=1;j++)mesh(new T.BoxGeometry(1,.7,.8),townMats.plank,j*1.25,.45,.5,g)}
 function wagon(x,z,seed){townMaterials();const g=new T.Group();g.position.set(x,0,z);g.rotation.y=seed*.37;scene.add(g);mesh(new T.BoxGeometry(2.8,.65,1.8),townMats.plank,0,1.15,0,g);for(let side of [-1,1])for(let front of [-1,1]){const wheel=mesh(new T.TorusGeometry(.56,.13,6,10),townMats.beam,front*.9,.68,side*1.03,g);wheel.rotation.y=Math.PI/2}mesh(new T.BoxGeometry(.13,.15,2.7),townMats.beam,0,1.1,2,g)}
 function village(){
  townMaterials();
  // Authored districts: buildings belong to streets, squares, workshops and churchyards.
  // Keep the lane corridor and existing jungle routes free for gameplay.
  const road=material('#514b3d'),courtyard=material('#615c4d'),water=new T.MeshStandardMaterial({color:'#183d42',roughness:.24,metalness:.23,transparent:true,opacity:.9}),reed=material('#35482d');
  function street(x,z,w,d,mat=road){const q=mesh(new T.PlaneGeometry(w,d),mat,x,.065,z);q.rotation.x=-Math.PI/2;return q}
  function well(x,z){let g=new T.Group();g.position.set(x,0,z);scene.add(g);let rock=townMats.stone;mesh(new T.CylinderGeometry(1.5,1.6,1.15,10),rock,0,.6,0,g);mesh(new T.CylinderGeometry(1.05,1.05,.08,12),water,0,1.18,0,g);for(let a of [-1,1])mesh(new T.BoxGeometry(.19,3.1,.2),townMats.beam,a*1.25,2.1,0,g);let roof=mesh(new T.BoxGeometry(3.7,.23,2.4),townMats.roof,0,3.65,0,g);roof.rotation.z=.1}
  function logs(x,z){for(let i=0;i<4;i++){let t=mesh(new T.CylinderGeometry(.24,.29,3.2,7),townMats.wood,x+i*.55,.35,z);t.rotation.z=Math.PI/2}}
  function churchyard(x,z,side){chapel(x,z,41);street(x,z+19,8,24,courtyard);for(let j=0;j<9;j++){let r=j%3,c=Math.floor(j/3);grave(x+side*(8+r*2.5),z+5+c*4)}fence(x+side*13,z+8,Math.PI/2,21);for(let j=0;j<4;j++)trunk(x+side*(18+j*3),z+7+j*7,13+j*2,12+j);lamppost(x,z+15)}
  function marketSquare(x,z,side){street(x,z,34,32,courtyard);well(x,z);for(let k=0;k<5;k++){let a=k*Math.PI*2/5;market(x+Math.cos(a)*11,z+Math.sin(a)*10,22+k)}hut(x+side*21,z-8,8,'inn');hut(x+side*21,z+9,19,'house');wagon(x-5,z+16,12);lamppost(x-13,z-12);lamppost(x+12,z+12)}
  function workshops(x,z,side){street(x,z,19,49);for(let j=0;j<4;j++){hut(x+side*8,z-17+j*11,11+j,'shed');logs(x-side*5,z-16+j*12)}wagon(x-side*4,z+20,12);fence(x+side*16,z,Math.PI/2,47);lamppost(x,z-20)}
  function riverside(x,z,side){
   // Waterway follows a single continuous corridor. Bridges actually cross it.
   for(let j=-8;j<=8;j++){let zz=z+j*5;let xx=x+Math.sin(zz*.035)*3;street(xx,zz,12,5.4,water);for(let edge of [-1,1]){let bank=mesh(new T.BoxGeometry(1.6,.35,5.6),townMats.stone,xx+edge*6.5,.15,zz);bank.rotation.y=Math.sin(zz*.035)*.06;if(j%3===0)for(let r=0;r<3;r++)mesh(new T.ConeGeometry(.14,.7,4),reed,xx+edge*(7.4+r*.3),.35,zz+r*1.2)}}
   bridge(x+Math.sin(z*.035)*3,z,16);for(let j=0;j<5;j++){hut(x+side*(17+(j%2)*8),z-34+j*16,28+j,j%2?'shed':'house')}lamppost(x+side*11,z+6)
  }
  // Distinct, intentionally located landmarks. The surrounding settlement follows
  // each district rather than randomizing every object's position.
  for(let side of [-1,1]){
   let x=side*149;
   street(x,333,12,575);
   marketSquare(x,105,side);
   workshops(x,228,side);
   churchyard(x+side*3,380,side);
   riverside(x+side*2,510,side);
   for(let z of [43,65,159,182,287,313,438,460,584,608]){
    let row=Math.round(z/20),seed=row*7+(side+1)*13;
    hut(x+side*14,z,seed,row%5===0?'inn':row%3===0?'shed':'house');
    if(row%2===0)hut(x-side*13,z+4,seed+3,'house');
    if(row%3===0){fence(x+side*19,z+10,Math.PI/2,9);lamppost(x-side*4,z+8)}
   }
   // Dense woodland beyond the town boundary, preserving the skyline.
   for(let z=26;z<637;z+=17){let seed=z*.23+(side+1)*9;for(let j=0;j<3;j++)trunk(side*(179+j*7+Math.sin(seed+j)*3),z+j*4,14+(j%3)*4,seed+j)}
  }
  // Buff entrances and jungle crossings are recognizable rather than random props.
  for(let z of [125,310,510])for(let side of [-1,1]){
    const x=side*47;fence(x+side*11,z-11,Math.PI/2,15);fence(x+side*11,z+11,Math.PI/2,15);
    lamppost(x+side*13,z-8);for(let j=0;j<5;j++)trunk(x+side*(15+j*3),z-19+j*9,12+j,17+j+z)
  }
 }

 // Phase 25: continuous sculpted routes and legible, hand-positioned settlements.
 function phase25Landscape(){
  townMaterials();
  const soil=material('#66523d'),ruts=material('#3d322a'),cobble=material('#777267'),moss=material('#435340'),wood=townMats.plank;
  const reed=material('#455b3e'),water=new T.MeshStandardMaterial({color:'#274a4c',roughness:.31,metalness:.12,transparent:true,opacity:.94});
  const dark=material('#242d27'),amber=new T.MeshStandardMaterial({color:'#f4b96b',emissive:'#b66b2c',emissiveIntensity:.65});
  // Continuous road mesh follows lane centerline, rather than disjointed rectangular tiles.
  function ribbon(path,width,mat,y=.10){let v=[],uv=[],ids=[];for(let i=0;i<path.length;i++){
    const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz)||1;
    let nx=dz/d,nz=-dx/d;let w=typeof width==='function'?width(i):width;
    for(let side of [-1,1]){v.push(path[i][0]+nx*side*w/2,y,path[i][1]+nz*side*w/2);uv.push(side===-1?0:2,i*.115)}
    if(i){let k=i*2;ids.push(k-2,k-1,k,k-1,k+1,k)}
  }let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();return mesh(geo,mat,0,0,0)}
  // Tileable, hand-drawn cobblestone texture: individual irregular stones, joints, and moss.
  function cobbleTexture(){
    const c=document.createElement('canvas');c.width=512;c.height=512;
    const g=c.getContext('2d');g.fillStyle='#343c35';g.fillRect(0,0,512,512);
    let seed=48371;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    for(let row=-1;row<17;row++){
      const offset=(row%2)*17;for(let col=-1;col<17;col++){
        let x=col*34+offset+(rnd()-.5)*7,y=row*34+(rnd()-.5)*7;
        const w=28+rnd()*8,h=25+rnd()*8,tone=Math.floor(90+rnd()*43);
        g.beginPath();g.moveTo(x+4,y);g.lineTo(x+w-5,y+1);g.lineTo(x+w,y+5);g.lineTo(x+w-1,y+h-4);g.lineTo(x+w-6,y+h);g.lineTo(x+3,y+h-1);g.lineTo(x,y+h-6);g.lineTo(x+1,y+4);g.closePath();
        g.fillStyle=`rgb(${tone},${tone-1},${tone-5})`;g.fill();
        g.strokeStyle='rgba(17,21,17,.85)';g.lineWidth=2.4;g.stroke();
        g.beginPath();g.moveTo(x+4,y+5);g.lineTo(x+w-7,y+4);g.strokeStyle='rgba(219,217,195,.19)';g.lineWidth=2;g.stroke();
        if(rnd()>.65){g.fillStyle='rgba(36,67,39,.4)';g.fillRect(x+1,y+h-5,8,3)}
      }
    }
    const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
  const paved=new T.MeshStandardMaterial({map:cobbleTexture(),roughness:.94,metalness:0});
  const roads=[];
  for(let l=-1;l<=1;l++){
    let path=[];for(let z=3;z<=649;z+=3)path.push([laneX(l,z),z]);
    ribbon(path,i=>16.5+Math.sin(i*.17+l)*.45,paved,.155);
    // Road crown and mossy shoulders give the cobbled lanes a raised profile.
    for(let side of [-1,1])ribbon(path.map(([x,z])=>[x+side*8.25,z]),1.3,moss,.14);
    for(let z=17;z<645;z+=24){let x=laneX(l,z);for(let side of [-1,1]){
      let edge=x+side*(9.8+Math.sin(z*.08)*.6);
      // Mossy, irregular stone shoulders with occasional gaps at jungle entrances.
      if(![125,310,510].some(c=>Math.abs(c-z)<18)){
        let stone=mesh(new T.DodecahedronGeometry(1.0,0),cobble,edge,.38,z);stone.scale.set(.9,.42,2.1);stone.rotation.y=Math.sin(z)*.21;
        if(z%72<24)mesh(new T.IcosahedronGeometry(.8,0),moss,edge+side*.5,.15,z+3).scale.set(1,.35,1.8);
      }
    }}
  }
  // Winding cross paths are visible and lead to the actual buff clearings.
  for(let z of [125,310,510]){
    const route=[];for(let x=-103;x<=103;x+=3)route.push([x,z+Math.sin(x*.045+z)*2.3]);
    ribbon(route,7.8,soil,.16);
    for(let side of [-1,1]){let x=side*47;
      // Each camp has a stony entry arch, a central altar, and a readable approach.
      for(let a of [-1,1]){let post=mesh(new T.CylinderGeometry(.65,.83,3.4,7),cobble,x+a*6,1.7,z+9);post.rotation.z=a*.05}
      let beam=mesh(new T.BoxGeometry(14,.65,1.1),wood,x,3.5,z+9);beam.rotation.z=.02;
      for(let i=0;i<5;i++){let t=i*1.256;let bx=x+Math.cos(t)*8,bz=z+Math.sin(t)*8;mesh(new T.IcosahedronGeometry(.45+(i%2)*.23,0),cobble,bx,.22,bz)}
    }
  }
  function pond(x,z,rx,rz){let g=mesh(new T.CircleGeometry(1,28),water,x,.115,z);g.rotation.x=-Math.PI/2;g.scale.set(rx,rz,1);
    for(let i=0;i<16;i++){let a=i*Math.PI/8;let px=x+Math.cos(a)*rx,pz=z+Math.sin(a)*rz;
      let rock=mesh(new T.DodecahedronGeometry(.35+(i%3)*.15,0),cobble,px,.23,pz);rock.scale.y=.45;
      if(i%2===0)for(let j=0;j<3;j++){let q=mesh(new T.ConeGeometry(.12,.9+j*.16,4),reed,px+(j-1)*.3,.42,pz+.3);q.rotation.z=(j-1)*.12}
    }
  }
  function footbridge(x,z,angle=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);
    for(let j=-4;j<=4;j++){let plank=mesh(new T.BoxGeometry(1.35,.18,1.1),wood,0,.42+Math.cos(j*.3)*.25,j*1.08,g);plank.rotation.x=-j*.025}
    for(let side of [-1,1]){for(let j=-4;j<=4;j+=2)mesh(new T.CylinderGeometry(.09,.12,1.5,6),townMats.beam,side*.67,1.1,j*1.08,g);mesh(new T.BoxGeometry(.16,.16,10),wood,side*.67,1.8,0,g)}
  }
  function garden(x,z,seed){fence(x,z-7,0,14);fence(x,z+7,0,14);for(let k=0;k<3;k++)for(let j=0;j<4;j++){
    let plant=mesh(new T.IcosahedronGeometry(.48,0),moss,x-4+k*4,.35,z-4+j*2.6);plant.scale.set(.8,.5,1.1)}
    mesh(new T.BoxGeometry(2.6,.65,1.3),wood,x+7,.38,z-5)
  }
  function watchtower(x,z){let g=new T.Group();g.position.set(x,0,z);scene.add(g);
    for(let a of [-1,1])for(let b of [-1,1])mesh(new T.CylinderGeometry(.22,.29,9,7),townMats.beam,a*2,4.5,b*2,g);
    mesh(new T.BoxGeometry(5.7,.5,5.7),wood,0,8.5,0,g);
    for(let a of [-1,1])for(let b of [-1,1])mesh(new T.BoxGeometry(5.7,1,.22),wood,0,9.3,b*2.7,g);
    let roof=mesh(new T.ConeGeometry(4.4,3.2,4),townMats.roof,0,11.6,0,g);roof.rotation.y=Math.PI/4;
    mesh(new T.BoxGeometry(.65,.65,.65),amber,0,8.9,0,g)
  }
  // Settlement additions are grouped into believable places with clear approaches.
  for(let side of [-1,1]){
    let x=side*151;
    garden(x+side*22,158,1);garden(x+side*24,292,2);
    hut(x-side*23,183,71,'shed');hut(x-side*23,303,76,'shed');
    watchtower(side*188,60);watchtower(side*189,602);
    pond(side*185,486,8,16);footbridge(side*185,486,Math.PI/2);
    for(let j=0;j<7;j++){
      let z=73+j*80,tx=side*(192+(j%3)*4);
      trunk(tx,z,17+(j%3)*3,side*10+j);
      if(j%2===0){let stump=mesh(new T.CylinderGeometry(.7,.92,1.1,8),townMats.wood,side*173,.55,z+12);stump.rotation.z=.06}
    }
  }
  // Phase 26: real street frontage on BOTH sides of each lane. Buildings form
  // neighborhoods and block sightlines, but leave deliberate jungle openings.
  const villageStone=material('#575b51'),frontDirt=material('#5c4a36');
  const crossings=[125,310,510];
  const isCrossing=z=>crossings.some(c=>Math.abs(z-c)<22);
  const fronts=[43,69,95,159,186,213,243,270,344,371,397,424,451,478,548,575,602];
  for(let l=-1;l<=1;l++)for(let side of [-1,1]){
    for(let i=0;i<fronts.length;i++){
      const z=fronts[i]+((i+l+4)%3-1)*2.5;
      if(isCrossing(z))continue;
      const center=laneX(l,z),offset=side*(19+(i%4)*2.3),x=center+offset;
      // Narrow front garden and a doorway facing the actual cobbled street.
      const stoop=mesh(new T.BoxGeometry(3,.14,4.2),frontDirt,center+side*12.7,.12,z);
      const seed=101+i*17+(l+1)*59+(side+1)*137;
      const kind=i%7===0?'inn':i%5===0?'shed':'house';
      const home=hut(x,z,seed,kind);
      // The original house door faces local +Z; rotate to face the lane.
      home.rotation.y=side===1?-Math.PI/2:Math.PI/2;
      if(i%3===0){fence(center+side*17,z+11,Math.PI/2,8);lamppost(center+side*13,z-10)}
      if(i%4===1){const sideShed=hut(center+side*33,z+5,seed+5,'shed');sideShed.rotation.y=side===1?-Math.PI/2:Math.PI/2}
      // Tall trunks with layered canopy behind houses create a believable visual wall.
      for(let k=0;k<2;k++){
        const tz=z+(k?9:-9),tx=center+side*(32+k*5);
        trunk(tx,tz,18+(seed%5)+k*3,seed+k);
      }
    }
    // Outer woodland between lanes, with breaks at the jungle crossroads.
    for(let z=35;z<626;z+=13){if(isCrossing(z))continue;
      const x=laneX(l,z)+side*(43+Math.sin(z*.19+l)*3);
      trunk(x,z,20+(Math.floor(z/13)%4)*2,z*.17+l*7+side);
    }
  }
  // Side-to-side passages are packed earth, not cobblestone. Keep the camp
  // access points unobstructed and mark their transitions with broken stone.
  for(let z of crossings){
    for(let l=-1;l<=1;l++)for(let side of [-1,1]){
      const x=laneX(l,z)+side*11;
      for(let j=0;j<3;j++){
        const slab=mesh(new T.BoxGeometry(1.1,.14,1.3),villageStone,x+side*j*1.5,.19,z+Math.sin(j*2+z)*1.6);
        slab.rotation.y=j*.27;
      }
    }
  }
  // Additional forests screen the outskirts without blocking lane and jungle corridors.
  for(let side of [-1,1])for(let z=35;z<620;z+=36){
    let x=side*(196+Math.sin(z*.08)*4);trunk(x,z,18+Math.sin(z)*3,z*.37);
  }
 }

 function laneX(l,z){return l*95+Math.sin(z*.013+l*2.3)*4+Math.sin(z*.031+l)*1.7}
 // Phase 27: physically continuous cobblestone streets. Curved ribbon follows the same lane centerline as combat.
 function cobbleTexture(){const c=document.createElement('canvas');c.width=512;c.height=512;const q=c.getContext('2d');q.fillStyle='#383b3b';q.fillRect(0,0,512,512);let seed=7143;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let y=-18;y<530;y+=28){let offset=(Math.floor(y/28)%2)*27;for(let x=-58+offset;x<550;x+=54){let r=75+rand()*35;q.fillStyle=`rgb(${r|0},${(r*.98)|0},${(r*.89)|0})`;q.beginPath();q.roundRect(x+2+rand()*3,y+2,46+rand()*5,22+rand()*3,4);q.fill();q.strokeStyle='#292d2b';q.lineWidth=2;q.stroke();q.fillStyle='rgba(180,177,149,.10)';q.fillRect(x+6,y+5,29,2)}}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;return t}
 function ribbon(l,width,mat,y=.08){const verts=[],uv=[],idx=[],segments=210;for(let i=0;i<=segments;i++){let z=4+i*636/segments,x=laneX(l,z);for(let side of [-1,1]){verts.push(x+side*width/2,y,z);uv.push(side<0?0:1,z/9)}}for(let i=0;i<segments;i++){let a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=mesh(g,mat,0,0,0);m.receiveShadow=true;return m}
 function cobblestoneLanes(){let edge=material('#514f49');const cobble=new T.MeshStandardMaterial({map:cobbleTexture(),roughness:1});for(let l=-1;l<=1;l++){ribbon(l,15,edge,.045);ribbon(l,12.8,cobble,.105);for(let z=25;z<625;z+=14){for(let side of [-1,1]){let x=laneX(l,z)+side*7.65;let curb=mesh(new T.BoxGeometry(.85,.36,3.5),material((Math.floor(z/14)%3)?'#6a685f':'#77736a'),x,.20,z);curb.rotation.y=Math.sin(z*.013+l*2.3)*.05}}}}
 function fountain(x,z,friendly){
  // Flat, irregular enchanted water sanctuary with lethal enemy protection.
  const g=new T.Group();g.position.set(x,0,z);scene.add(g);
  const stone=material(friendly?'#435963':'#593c4e'),trim=material('#aa9978');
  const water=new T.MeshStandardMaterial({color:friendly?'#329eaf':'#b54170',emissive:friendly?'#14667a':'#6b153d',emissiveIntensity:.75,transparent:true,opacity:.86,metalness:.45,roughness:.18,side:T.DoubleSide});
  const light=new T.MeshStandardMaterial({color:friendly?'#7deeff':'#ff8cac',emissive:friendly?'#26b7da':'#da3864',emissiveIntensity:1.65});
  const outline=[],segments=32;
  for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,r=14.5+Math.sin(a*3+.4)*2.1+Math.cos(a*5)*1.25;outline.push([Math.cos(a)*r,Math.sin(a)*r])}
  const verts=[0,.11,0],idx=[];
  for(const [px,pz] of outline)verts.push(px,.11,pz);
  for(let i=0;i<segments;i++)idx.push(0,i+1,(i+1)%segments+1);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();
  mesh(geo,water,0,0,0,g);
  for(let i=0;i<segments;i++){const [ax,az]=outline[i],[bx,bz]=outline[(i+1)%segments];const dx=bx-ax,dz=bz-az;
   const edge=mesh(new T.BoxGeometry(Math.hypot(dx,dz),.34,.55),stone,(ax+bx)/2,.12,(az+bz)/2,g);edge.rotation.y=-Math.atan2(dz,dx);
  }
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=6.2+(i%2)*2.8;
   const slab=mesh(new T.BoxGeometry(2.1,.18,1.2),trim,Math.sin(a)*r,.15,Math.cos(a)*r,g);slab.rotation.y=a;
   const rune=mesh(new T.TorusGeometry(.72,.06,5,18),light,Math.sin(a)*r,.28,Math.cos(a)*r,g);rune.rotation.x=Math.PI/2;
  }
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;
   mesh(new T.CylinderGeometry(.6,.9,4.2,7),stone,Math.sin(a)*12.5,2.1,Math.cos(a)*12.5,g);
   mesh(new T.OctahedronGeometry(.6,0),light,Math.sin(a)*12.5,4.7,Math.cos(a)*12.5,g);
  }
  const core=mesh(new T.OctahedronGeometry(1.15,0),light,0,1.55,0,g);
  const ring=mesh(new T.TorusGeometry(18,.18,6,72),light,0,.21,0,g);ring.rotation.x=Math.PI/2;
  g.userData.heart=core;g.userData.aura=ring;
  return g;
 }
 function buildBases(){for(let l=-1;l<=1;l++){let x=laneX(l,16);const platform=mesh(new T.CylinderGeometry(17,18,.35,18),material('#55565a'),x,.12,16);platform.receiveShadow=true;let enemyX=laneX(l,628);mesh(new T.CylinderGeometry(17,18,.35,18),material('#52474a'),enemyX,.12,628)}baseFountain=fountain(laneX(0,16),16,true);fountain(laneX(0,628),628,false)}
 const itemTrees=[
  {name:'Stormbrand',icon:'⚡',desc:'Lightning power · +12 spell damage',cost:250,up:'Thunderlord',upgrade:450,bonus:'spell'},
  {name:'Emberfang',icon:'🔥',desc:'Fire power · +15 spell damage',cost:250,up:'Wildfire',upgrade:450,bonus:'spell'},
  {name:'Wintergrasp',icon:'❄',desc:'Frost power · +12 spell damage',cost:250,up:'Permafrost',upgrade:450,bonus:'spell'},
  {name:'Nightpiercer',icon:'☾',desc:'Shadow power · +12 spell damage',cost:250,up:'Eclipse',upgrade:450,bonus:'spell'},
  {name:'Guardian Sigil',icon:'⬡',desc:'Defense · +75 maximum HP',cost:250,up:'Aegis',upgrade:450,bonus:'health'},
  {name:'Swiftstep Boots',icon:'➜',desc:'Mobility · +8% movement',cost:250,up:'Windrunner',upgrade:450,bonus:'speed'}
 ];
 function updateShop(){if(!shopPanel)return;const atBase=inSanctuary(position.x,position.z,true);shopPanel.querySelector('#gf29ShopInfo').textContent=`${gold} GOLD · ${atBase?'SANCTUARY SHOP':'Return to sanctuary to purchase'}`;shopPanel.querySelector('.gf29-grid').innerHTML=itemTrees.map((it,i)=>{let rank=ownedItems[i]||0;return `<div class="gf29-item"><b>${it.icon} ${it.name}</b><small>${it.desc}</small><div style="font-size:11px;color:#b9c5ce">${rank?'✓ Tier '+rank:'Tier 1'} → ${it.up}</div><button data-buy="${i}" ${rank===2||!atBase||gold<(rank?it.upgrade:it.cost)?'disabled':''}>${rank===2?'MAXED':rank?'Upgrade '+it.upgrade+'g':'Buy '+it.cost+'g'}</button></div>`}).join('');shopPanel.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const i=+b.dataset.buy,it=itemTrees[i],rank=ownedItems[i]||0,cost=rank?it.upgrade:it.cost;if(rank>=2||gold<cost||!inSanctuary(position.x,position.z,true))return;gold-=cost;ownedItems[i]=rank+1;if(it.bonus==='health'){maxHp+=rank?125:75;hp+=rank?125:75}else if(it.bonus==='speed'){speedBuffUntil=Math.max(speedBuffUntil,performance.now()+60000)}else powerBonus+=rank?22:12;$('status').textContent='Purchased '+(rank?it.up:it.name);updateShop()})}
 function setupHud(){if(baseHud)return;baseHud=document.createElement('div');baseHud.id='gf27Hud';baseHud.style.cssText='position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:6px;justify-content:center;font:700 12px system-ui;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none';baseHud.innerHTML='<span id="gf35Timer" style="background:#171b29e8;padding:7px 10px;border:1px solid #8e8bb7;border-radius:8px">WAVE 0:30</span><span id="gf27HP" style="background:#1c322dcc;padding:7px 10px;border:1px solid #68c4a2;border-radius:8px">HP 350/350</span><span id="gf27Gold" style="background:#2c251bcc;padding:7px 10px;border:1px solid #d5b86d;border-radius:8px">500 GOLD</span><span id="gf27Level" style="background:#1a2034cc;padding:7px 10px;border:1px solid #7d8dce;border-radius:8px">LV 1</span>';document.getElementById('battle').appendChild(baseHud);
 const controls=document.createElement('div');controls.id='gf27Controls';controls.style.cssText='position:absolute;top:27%;right:8px;z-index:85;display:flex;flex-direction:column;gap:8px;pointer-events:auto';controls.innerHTML='<button id="gf27Recall" style="background:#293b55ed;color:white;border:1px solid #88baff;border-radius:9px;padding:7px;font-size:11px;font-weight:700">↩ RECALL</button><button id="gf27Shop" style="background:#534020ed;color:white;border:1px solid #efc87a;border-radius:9px;padding:7px;font-size:11px;font-weight:700">⚒ SHOP</button>';document.getElementById('battle').appendChild(controls);
 shopPanel=document.createElement('div');shopPanel.id='gf29ShopPanel';shopPanel.hidden=true;shopPanel.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px"><div><h2>DIVINE ITEM FORGE</h2><div id="gf29ShopInfo"></div></div><button id="gf29Close">✕ CLOSE</button></div><p style="font-size:12px;color:#bac5cf">Six item trees · each has two tiers · purchases available at your sanctuary.</p><div class="gf29-grid"></div>';document.getElementById('battle').appendChild(shopPanel);shopPanel.querySelector('#gf29Close').onclick=()=>shopPanel.hidden=true;
 $('gf27Recall').onclick=()=>{if(hp<=0)return;recallUntil=performance.now()+4500;$('status').textContent='Recalling to sanctuary · 4.5 seconds · movement or damage cancels'};
 $('gf27Shop').onclick=()=>{shopPanel.hidden=!shopPanel.hidden;if(!shopPanel.hidden)updateShop()};
 }
 function utility(){if(!active||hp<=0)return;let now=performance.now();if(now<utilityCooldown){$('status').textContent='Utility cooling down · '+Math.ceil((utilityCooldown-now)/1000)+'s';return}const choice=window.gfGetConfig?.().ability4||'Dash';utilityCooldown=now+12000;recallUntil=0;
 if(choice==='Veilwalk'){window.gfStealthUntil=now+4500;$('status').textContent='VEILWALK · hidden for 4.5 seconds'}
 else if(choice==='Sky Leap'){let landed=false;for(let d=16;d>=2;d--){const nx=position.x+Math.sin(yaw)*d,nz=Math.max(4,Math.min(640,position.z+Math.cos(yaw)*d));if(!collision(nx,nz)){position.x=nx;position.z=nz;landed=true;break}}shieldUntil=now+700;$('status').textContent=landed?'SKY LEAP · landed':'SKY LEAP · blocked'}
 else if(choice==='Wind Dash'||choice==='Dash'){let landed=false;for(let d=11;d>=1;d--){const nx=position.x+Math.sin(yaw)*d,nz=Math.max(4,Math.min(640,position.z+Math.cos(yaw)*d));if(!collision(nx,nz)){position.x=nx;position.z=nz;landed=true;break}}$('status').textContent=landed?'WIND DASH · repositioned':'WIND DASH · blocked'}
 else if(choice==='Heal'){hp=Math.min(maxHp,hp+95+level*7);$('status').textContent='DIVINE MEND · health restored'}
 else if(choice==='Shield'){shieldUntil=now+4500;$('status').textContent='AEGIS SHIELD · 4.5 seconds of protection'}
 else if(choice==='Stun'){for(const m of mobs)if(m.alive&&!m.friendly&&m.kind!=='tower'&&Math.hypot(m.x-position.x,m.z-position.z)<9)m.stunnedUntil=now+2400;$('status').textContent='SHOCKWAVE STUN · nearby enemies halted'}
 combatForge?.utility(choice,position.x,position.z,yaw);
 }
 window.GF29Utility=utility;
 function gainGold(n){gold+=n;xp+=n*.65;let needed=level*250;if(xp>=needed){xp-=needed;level++;maxHp+=35;hp=Math.min(maxHp,hp+35);$('status').textContent='LEVEL UP! '+level+' · +35 HP'}}

 function equipTroop(m,role,lane){
  m.role=role;m.lane=lane;m.attackClock=.3+Math.random()*.4;m.attackPose=0;
  m.speed=role==='vanguard'?4.7:role==='archer'?5.5:6.2;
  m.hp=m.max=role==='vanguard'?170:role==='archer'?65:78;
  m.damage=role==='vanguard'?8:role==='archer'?3:4;
  m.xpReward=role==='vanguard'?75:25;m.goldReward=role==='vanguard'?45:14;
  m.root.scale.setScalar(role==='vanguard'?1.12:.72);
  m.weaponPivot=new T.Group();m.weaponPivot.position.set(.95,2.5,.5);m.root.add(m.weaponPivot);
  if(role==='archer'){
   const bow=mesh(new T.TorusGeometry(.58,.06,6,16,Math.PI),material('#a27643'),0,0,0,m.weaponPivot);bow.rotation.y=Math.PI/2;
   m.arrow=mesh(new T.CylinderGeometry(.024,.024,1.3,5),material('#d9b78a'),0,0,.2,m.weaponPivot);m.arrow.rotation.x=Math.PI/2;
  }else{
   mesh(new T.BoxGeometry(role==='vanguard'?.28:.15,role==='vanguard'?2:1.35,.25),material(role==='vanguard'?'#f0c77d':'#d9dee1'),0,.65,0,m.weaponPivot);
   if(role==='vanguard'){mesh(new T.BoxGeometry(.85,.35,.35),material('#9c6d42'),0,1.5,0,m.weaponPivot);mesh(new T.ConeGeometry(.6,.9,7),material('#bb9a64'),0,4.1,0,m.root)}
  }
 }
 function spawnWave(){
  if(matchEnded)return;
  // Keep mobile frame rate stable as waves accumulate.
  mobs=mobs.filter(m=>{if(m.alive||m.kind==='tower'||m.kind==='guard')return true;scene.remove(m.root);return false});
  for(let lane=-1;lane<=1;lane++)for(const friendly of [true,false])for(let i=0;i<6;i++){
   const z=friendly?16-i*.2:628+i*.2;
   const m=createMob(laneX(0,z)+(i-2.5)*.8,z,friendly?'ally':'minion');m.friendly=friendly;
   equipTroop(m,i===5?'vanguard':i===2||i===4?'archer':'swordsman',lane);m.spawnSpinUntil=performance.now()+1000;mobs.push(m);
  }
 }
 function awardMinion(m){
  if(m.rewarded)return;m.rewarded=true;gold+=m.goldReward||14;xp+=m.xpReward||25;
  while(xp>=level*150){xp-=level*150;level++;maxHp+=25;hp=Math.min(maxHp,hp+25);powerBonus+=2;$('status').textContent='LEVEL '+level+' · MINION XP'}
 }
 function finishMob(m,credit){
  if(!m.alive)return;m.alive=false;m.root.visible=false;
  if(credit){if(m.kind==='minion')awardMinion(m);else gainGold(m.kind==='tower'?160:35);kills++}
 }
 function spawnGods(){
  const specs=[['Aegis',true,-1,'#73c7e8'],['Ember',true,1,'#f8a869'],['Riven',false,-1,'#e87c79'],['Nyx',false,0,'#b58af0'],['Thorn',false,1,'#d6ae6a']];
  for(const [name,friendly,lane,tint] of specs){
   const z=friendly?16:628,x=laneX(0,z),root=new T.Group();root.position.set(x,0,z);scene.add(root);
   const armor=material(friendly?'#405d74':'#75424e'),accent=material(tint);
   mesh(new T.CylinderGeometry(.54,.68,1.5,8),armor,0,1.7,0,root);
   mesh(new T.BoxGeometry(1.35,.92,.8),accent,0,2.55,0,root);
   mesh(new T.SphereGeometry(.46,10,8),accent,0,3.3,0,root);
   for(const side of [-1,1]){mesh(new T.CylinderGeometry(.22,.26,1.3,7),armor,side*.9,2.1,0,root);mesh(new T.CylinderGeometry(.23,.28,1.35,7),armor,side*.36,.67,0,root)}
   const pivot=new T.Group();pivot.position.set(.94,2.55,.3);root.add(pivot);
   mesh(new T.BoxGeometry(.17,1.5,.25),material('#e0d8d1'),0,.72,0,pivot);
   bots.push({name,friendly,lane,x,z,root,pivot,hp:310,max:310,alive:true,attackClock:1,attackPose:0,spellClock:4+Math.random()*4,respawnAt:0,spawnSpinUntil:performance.now()+1600});
  }
 }
 function updateGods(dt,now){
  for(const b of bots){
   if(!b.alive){if(now<b.respawnAt)continue;b.alive=true;b.hp=b.max;b.root.visible=true;b.z=b.friendly?16:628;b.x=laneX(0,b.z);b.spawnSpinUntil=now+1100}
   const candidates=mobs.filter(m=>m.alive&&m.friendly!==b.friendly&&m.kind!=='guard'&&(m.kind!=='tower'||Math.abs(m.x-laneX(b.lane,m.z))<15)).map(m=>({x:m.x,z:m.z,obj:m,type:'mob'}));
   for(const titan of baseStructures)if(titan.alive&&titan.friendly!==b.friendly&&!mobs.some(m=>m.alive&&m.kind==='tower'&&m.friendly===titan.friendly&&m.lane===b.lane))candidates.push({x:titan.x,z:titan.z,obj:titan,type:'titan'});
   for(const o of bots)if(o!==b&&o.alive&&o.friendly!==b.friendly)candidates.push({x:o.x,z:o.z,obj:o,type:'bot'});
   if(!b.friendly&&hp>0&&now>(window.gfStealthUntil||0))candidates.push({x:position.x,z:position.z,type:'player'});
   candidates.sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z));
   let target=candidates[0],d=target?Math.hypot(target.x-b.x,target.z-b.z):999;
   if(d>17){target=null;const z=b.friendly?605:25;b.z+=Math.sign(z-b.z)*Math.min(Math.abs(z-b.z),dt*6.4);b.x+=(laneApproach(b.lane,b.z,b.friendly)-b.x)*Math.min(1,dt*3);b.root.rotation.y=b.friendly?0:Math.PI}
   else {
    b.root.rotation.y=Math.atan2(target.x-b.x,target.z-b.z);
    if(d>4){const step=Math.min(d-3.5,dt*6.4);b.x+=(target.x-b.x)/d*step;b.z+=(target.z-b.z)/d*step}
    b.attackClock-=dt;b.spellClock-=dt;
    if(d<=5&&b.attackClock<=0){
     b.attackClock=1.2;b.attackPose=.42;let dmg=11;
     if(target.type==='player')hp=Math.max(0,hp-(now<shieldUntil?dmg*.25:dmg));
     else {target.obj.hp-=dmg;if(target.obj.hp<=0){if(target.type==='mob')finishMob(target.obj,false);else if(target.type==='bot'){target.obj.alive=false;target.obj.root.visible=false;target.obj.respawnAt=now+11000}else if(target.type==='titan')endIfTitanDestroyed(target.obj)}}
    }
    if(d<13&&b.spellClock<=0){
     b.spellClock=8+Math.random()*3;
     combatForge?.ability(['Cinder Fan','Storm Lance','Rift Spear'][Math.floor(Math.random()*3)],b.x,b.z,b.root.rotation.y,target.x,target.z);
     const dmg=17;
     if(target.type==='player')hp=Math.max(0,hp-(now<shieldUntil?dmg*.25:dmg));
     else {target.obj.hp-=dmg;if(target.obj.hp<=0){if(target.type==='mob')finishMob(target.obj,false);else if(target.type==='bot'){target.obj.alive=false;target.obj.root.visible=false;target.obj.respawnAt=now+11000}else if(target.type==='titan')endIfTitanDestroyed(target.obj)}}
    }
   }
   b.root.position.set(b.x,0,b.z);
   if(now<(b.spawnSpinUntil||0))b.root.rotation.y+=dt*11;
   b.attackPose=Math.max(0,b.attackPose-dt);
   b.pivot.rotation.z=b.attackPose?Math.sin((1-b.attackPose/.42)*Math.PI)*-1.3:0;
  }
 }
 // Phase 30: visible danger stonework, animated melee and actual flying arrows.
 const towerRange=19;
 let combatProjectiles=[];
 function towerZone(x,z,range=towerRange,friendly=false,tier=0){
  const g=new T.Group();g.position.set(x,.23,z);scene.add(g);
  const dark=material('#383b43'),inlay=material('#8b7257'),warning=new T.MeshStandardMaterial({color:'#bc6945',emissive:'#5b2416',emissiveIntensity:.38,roughness:.8});
  // Wide, wedge-cut flagstones form a recognizable circular tower courtyard.
  for(let ring=0;ring<3;ring++){let radius=ring===0?5:ring===1?11:17, count=ring===0?12:ring===1?22:34;
   for(let i=0;i<count;i++){let a=(i+.5*(ring%2))*Math.PI*2/count;
    let stone=mesh(new T.BoxGeometry(ring===2?2.4:3.2,.26,ring===2?2.7:3.6),ring===2?warning:ring===1?dark:inlay,Math.cos(a)*radius,0,Math.sin(a)*radius,g);
    stone.rotation.y=-a;stone.scale.x=.8+(i%4)*.06;
   }
  }
  const border=mesh(new T.TorusGeometry(range,.19,5,90),warning,0,.12,0,g);border.rotation.x=-Math.PI/2;
 }
 function fireProjectile(from,to,damage,kind,owner){
  const start=new T.Vector3(from.x,from.y,from.z),end=new T.Vector3(to.x,to.y,to.z);
  const dir=end.clone().sub(start);let length=dir.length();if(length<.01)return;
  const group=new T.Group();group.position.copy(start);scene.add(group);
  let color=kind==='tower'?'#ff974e':'#dfc38a';
  const shaft=mesh(new T.CylinderGeometry(kind==='tower'?.16:.065,kind==='tower'?.18:.065,kind==='tower'?1.25:1.15,6),material(color),0,0,0,group);
  shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.clone().normalize());
  if(kind!=='tower'){const tip=mesh(new T.ConeGeometry(.17,.4,6),material('#e6e8dd'),0,0,0,group);tip.position.copy(dir.clone().normalize().multiplyScalar(.7));tip.quaternion.copy(shaft.quaternion)}
  combatProjectiles.push({group,start,end,elapsed:0,duration:Math.max(.17,length/(kind==='tower'?42:32)),damage,owner,target:to.target||null,hero:to.hero||false});
 }
 function tickProjectiles(dt){for(let i=combatProjectiles.length-1;i>=0;i--){let p=combatProjectiles[i];p.elapsed+=dt;let t=Math.min(1,p.elapsed/p.duration);p.group.position.lerpVectors(p.start,p.end,t);p.group.position.y+=Math.sin(t*Math.PI)*.7;
   if(t>=1){if(p.hero&&hp>0&&Math.hypot(position.x-p.end.x,position.z-p.end.z)<4){let dmg=p.damage;if(performance.now()<shieldUntil)dmg*=.25;hp=Math.max(0,hp-dmg);recallUntil=0}
    else if(p.target?.alive){p.target.hp-=p.damage;if(p.target.hp<=0){p.target.alive=false;p.target.root.visible=false;if(p.owner?.friendly&&p.target.kind==='minion')awardMinion(p.target)}}
    scene.remove(p.group);combatProjectiles.splice(i,1)}
  }}
 function updateBattleSystems(dt,time){gameTime+=dt;matchElapsed+=dt;if(!matchEnded&&matchElapsed>=30&&(lastWave===0||matchElapsed-lastWave>=27)){lastWave=matchElapsed;spawnWave();$('status').textContent='3 lanes · 5 troops and 1 Vanguard per wave'}
 if(!matchEnded)updateGods(dt,time);
 updateDefenses(dt,time);
 updateDemonDogs(dt,time);
 const takeDamage=(n)=>{if(hp<=0)return;if(time<shieldUntil)n*=.25;hp=Math.max(0,hp-n);if(n>0)recallUntil=0};
 if(hp>0){if(inSanctuary(position.x,position.z,true))hp=Math.min(maxHp,hp+dt*90);else hp=Math.min(maxHp,hp+dt*.65);if(recallUntil&&time>=recallUntil){position.x=laneX(0,16);position.z=16;recallUntil=0;$('status').textContent='Returned to sanctuary · healing'}}else if(time>respawnAt){hp=maxHp;respawnAt=0;position.x=laneX(0,16);position.z=16;$('status').textContent='Respawned at sanctuary'}
 for(let m of mobs){if(!m.alive)continue;if(m.kind==='ally'||m.kind==='minion'){if(time<(m.stunnedUntil||0))continue;const dir=m.friendly?1:-1,range=m.role==='archer'?11:m.role==='vanguard'?4.4:3.8;let target=mobs.find(o=>o.alive&&o.friendly!==m.friendly&&o.kind!=='tower'&&Math.hypot(o.x-m.x,o.z-m.z)<range);let heroTarget=!m.friendly&&hp>0&&Math.hypot(position.x-m.x,position.z-m.z)<range;
 if(!target&&!heroTarget){m.z+=dir*dt*m.speed;m.x=laneApproach(m.lane??0,m.z,m.friendly);m.root.position.set(m.x,0,m.z);if(time<(m.spawnSpinUntil||0))m.root.rotation.y+=dt*12}else{m.attackClock=(m.attackClock||0)-dt;if(m.attackClock<=0){m.attackClock=m.role==='archer'?2.1:m.role==='vanguard'?1.7:1.35;let damage=m.damage||4;m.attackPose=.42;if(m.role==='archer'){
  let aim=target?{x:target.x,y:2.3,z:target.z,target}:{x:position.x,y:2.2,z:position.z,hero:true};
  fireProjectile({x:m.x,y:2.8,z:m.z},aim,damage,'arrow',m);
 }else if(target){target.hp-=damage;if(target.hp<=0){target.alive=false;target.root.visible=false;if(m.friendly&&target.kind==='minion')awardMinion(target)}}else if(heroTarget)takeDamage(damage)}}
 if(m.z<3||m.z>641){m.alive=false;m.root.visible=false;continue}}
 }
 tickProjectiles(dt);
 for(const m of mobs){if(m.alive&&m.attackPose>0){m.attackPose=Math.max(0,m.attackPose-dt);if(m.weaponPivot){const t=1-m.attackPose/.42;m.weaponPivot.rotation.z=m.role==='archer'?Math.sin(t*Math.PI)*.5:-Math.sin(t*Math.PI)*(m.role==='vanguard'?1.6:1.25);if(m.arrow)m.arrow.position.z=.2-Math.sin(t*Math.PI)*.35;}m.root.rotation.y=Math.sin((1-m.attackPose/.42)*Math.PI)*.22*(m.friendly?1:-1)}}
 if(hp<=0&&!respawnAt){respawnAt=time+7000;$('status').textContent='Defeated · respawning in 7 seconds'}
 if(baseHud){$('gf35Timer').textContent=matchEnded?'MATCH OVER':matchElapsed<30?'WAVE 0:'+String(Math.ceil(30-matchElapsed)).padStart(2,'0'):'NEXT '+Math.max(0,Math.ceil(27-(matchElapsed-lastWave)))+'s';$('gf27HP').textContent=`HP ${Math.ceil(hp)}/${maxHp}`;$('gf27Gold').textContent=`${gold} GOLD`;$('gf27Level').textContent=`LV ${level} · ${kills} KILLS`}
 }

 // Neutral jungle guardians: stay inside visible grass borders, chase nearby gods,
 // deal more damage than lane minions, and respawn after defeat.
 function makeDemonDogs(){
  const dark=material('#24252c'),hide=material('#43343a'),fang=material('#e8d6c4'),glow=new T.MeshStandardMaterial({color:'#f05e55',emissive:'#d51e23',emissiveIntensity:2});
  for(const side of [-1,1])for(const z of [215,405]){
   const x=side*46,radius=18;
   const zone=mesh(new T.CircleGeometry(radius,40),new T.MeshStandardMaterial({color:'#23432b',transparent:true,opacity:.76,side:T.DoubleSide}),x,.06,z);zone.rotation.x=-Math.PI/2;
   const rim=mesh(new T.TorusGeometry(radius,.32,6,64),material('#8e6b48'),x,.15,z);rim.rotation.x=Math.PI/2;
   for(let i=0;i<28;i++){const a=i*Math.PI*2/28,rr=radius-2.3;const grass=mesh(new T.ConeGeometry(.4,1.7,4),material(i%2?'#385e39':'#4b7744'),x+Math.cos(a)*rr,.8,z+Math.sin(a)*rr);grass.rotation.z=Math.sin(a)*.24}
   for(let i=0;i<2;i++){
    const root=new T.Group();scene.add(root);
    const body=mesh(new T.SphereGeometry(1.05,10,8),hide,0,1.1,0,root);body.scale.set(.72,.75,1.5);
    mesh(new T.SphereGeometry(.64,10,8),dark,0,1.35,1.23,root);
    for(const sx of [-1,1]){const ear=mesh(new T.ConeGeometry(.23,.7,5),dark,sx*.42,1.99,1.2,root);ear.rotation.z=sx*.2;mesh(new T.SphereGeometry(.13,7,6),glow,sx*.28,1.52,1.77,root);
     for(const fz of [-.85,.85])mesh(new T.CylinderGeometry(.2,.24,.9,6),dark,sx*.49,.46,fz,root);
    }
    for(const sx of [-1,1])mesh(new T.ConeGeometry(.13,.43,5),fang,sx*.25,1.03,1.8,root).rotation.x=Math.PI;
    for(let k=0;k<4;k++)mesh(new T.ConeGeometry(.29,.55,5),dark,0,1.95,-.6+k*.36,root);
    const dx=(i===0?-4:4),dz=(i===0?-3:3);
    demonDogs.push({root,homeX:x,homeZ:z,x:x+dx,z:z+dz,radius:radius-2.6,hp:145,max:145,damage:10,alive:true,respawnAt:0,attackClock:.6,attackPose:0});
   }
  }
 }
 function updateDemonDogs(dt,now){
  for(const dog of demonDogs){
   if(!dog.alive){if(now<dog.respawnAt)continue;dog.alive=true;dog.hp=dog.max;dog.x=dog.homeX;dog.z=dog.homeZ;dog.root.visible=true}
   let target=null,dist=999;
   if(hp>0){const d=Math.hypot(position.x-dog.x,position.z-dog.z);if(d<dist&&Math.hypot(position.x-dog.homeX,position.z-dog.homeZ)<dog.radius+3){target={x:position.x,z:position.z,player:true};dist=d}}
   for(const b of bots)if(b.alive&&Math.hypot(b.x-dog.homeX,b.z-dog.homeZ)<dog.radius+2){const d=Math.hypot(b.x-dog.x,b.z-dog.z);if(d<dist){target=b;dist=d}}
   let tx=target?target.x:dog.homeX+Math.sin(now*.0007+dog.homeZ)*5,tz=target?target.z:dog.homeZ+Math.cos(now*.0007+dog.homeX)*5;
   const distance=Math.hypot(tx-dog.x,tz-dog.z);
   if(distance>2.8){const move=Math.min(distance-2.5,dt*(target?5.7:2));dog.x+=(tx-dog.x)/distance*move;dog.z+=(tz-dog.z)/distance*move}
   const homeDistance=Math.hypot(dog.x-dog.homeX,dog.z-dog.homeZ);
   if(homeDistance>dog.radius){dog.x=dog.homeX+(dog.x-dog.homeX)/homeDistance*dog.radius;dog.z=dog.homeZ+(dog.z-dog.homeZ)/homeDistance*dog.radius}
   dog.attackClock-=dt;
   if(target&&dist<3.5&&dog.attackClock<=0){dog.attackClock=1.45;dog.attackPose=.35;
    if(target.player)hp=Math.max(0,hp-(now<shieldUntil?dog.damage*.25:dog.damage));
    else{target.hp=Math.max(0,target.hp-dog.damage);if(!target.hp){target.alive=false;target.root.visible=false;target.respawnAt=now+11000}}
   }
   dog.attackPose=Math.max(0,dog.attackPose-dt);
   dog.root.position.set(dog.x,Math.sin(now*.009+dog.homeZ)*.07+(dog.attackPose?Math.sin(dog.attackPose*9)*.35:0),dog.z);
   if(distance>.01)dog.root.rotation.y=Math.atan2(tx-dog.x,tz-dog.z);
  }
 }
 function damageDemonDog(x,z,damage,reach=5){
  let closest=null,dist=reach;
  for(const dog of demonDogs)if(dog.alive){const d=Math.hypot(dog.x-x,dog.z-z);if(d<dist){closest=dog;dist=d}}
  if(!closest)return false;
  closest.hp-=damage;
  if(closest.hp<=0){closest.alive=false;closest.root.visible=false;closest.respawnAt=performance.now()+30000;gold+=35;xp+=40;$('status').textContent='DEMON HOUND SLAIN · +40 XP · +35 GOLD'}
  return true;
 }
 function groundHeight(x,z){return Math.sin(x*.07)*.12+Math.sin(z*.045)*.11}
 function makeTerrain(){
 const texCanvas=document.createElement('canvas');texCanvas.width=256;texCanvas.height=256;
 const ctx=texCanvas.getContext('2d');let im=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  let v=Math.sin(x*.17+y*.11)*.5+Math.sin(x*.41-y*.33)*.25+Math.sin(x*.05+y*.06)*.5;
  let q=(y*256+x)*4;im.data[q]=Math.max(18,39+v*13);im.data[q+1]=Math.max(24,53+v*17);im.data[q+2]=Math.max(14,35+v*12);im.data[q+3]=255;
 }ctx.putImageData(im,0,0);
 const groundTex=new T.CanvasTexture(texCanvas);groundTex.wrapS=groundTex.wrapT=T.RepeatWrapping;groundTex.repeat.set(8,15);groundTex.colorSpace=T.SRGBColorSpace;
 const geo=new T.PlaneGeometry(400,680,80,120);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,groundHeight(p.getX(i),p.getZ(i)+330));geo.computeVertexNormals();const m=mesh(geo,new T.MeshStandardMaterial({map:groundTex,roughness:1}),0,-.23,330);m.receiveShadow=true;
 const dirt=material('#716a5c'),pebbles=material('#8b8070'),walls=material('#55544d'),moss=material('#394737');
 // Old repeated road tiles, scattered lane cottages and stones removed.
 // Phase 25 lays continuous roads and authored landmarks after the gameplay clearings.
 // Jungle corridors and camp clearings between lanes, accessible via three cross-paths.
 for(let z of [125,310,510]){block(0,.015,z,205,.08,10,dirt);for(let x=-84;x<=84;x+=12){let v=Math.sin(x*.3+z);if(Math.abs(v)>.4){let r=mesh(new T.DodecahedronGeometry(.6+Math.abs(v)*.4,0),pebbles,x,.45,z+7);r.rotation.y=v}}}
 for(let side of [-1,1])for(let z of [125,310,510]){let x=side*47;const ring=mesh(new T.TorusGeometry(5,.55,8,20),material('#5b594c'),x,.1,z);ring.rotation.x=-Math.PI/2;for(let a=0;a<8;a++){let theta=a*Math.PI/4;let rock=mesh(new T.DodecahedronGeometry(.9,0),walls,x+Math.sin(theta)*5,.5,z+Math.cos(theta)*5);rock.rotation.y=theta}buffs.push({x,z,kind:z===125?'SPEED':z===310?'POWER':'DEFENSE',alive:true,respawn:0,orb:null})}
 for(let x=-150;x<=150;x+=26)for(let z=0;z<650;z+=42){if(Math.abs(x-laneX(-1,z))<22||Math.abs(x-laneX(0,z))<22||Math.abs(x-laneX(1,z))<22)continue;if([125,310,510].some(a=>Math.abs(z-a)<13))continue;if(Math.sin(x*2.13+z*.73)>.0)trunk(x+Math.sin(z)*3,z,8+Math.abs(Math.sin(x))*7,x+z)}
  village();
  phase25Landscape();
  cobblestoneLanes();
  buildBases();
  makeDemonDogs();
 }
 function fitGLB(root){root.rotation.x=-Math.PI/2;root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root);const h=Math.max(.001,box.max.y-box.min.y);const scale=3.15/h;root.scale.setScalar(scale);root.position.y=-box.min.y*scale;return root}
 function applyStyle(root){window.GF22Style?.(root,window.gfGetConfig?.()||{},T);
  // Original godlike armor set layered over the character GLB: gold filigree,
  // illuminated crest, sculpted shoulders, ceremonial cape and divine aura.
  const cfg=window.gfGetConfig?.()||{},cold=cfg.weapon==='Staff'||cfg.weapon==='Spear';
  const gold=new T.MeshStandardMaterial({color:cold?'#b5d9e9':'#d8b36c',metalness:.86,roughness:.23});
  const obsidian=new T.MeshStandardMaterial({color:'#263143',metalness:.7,roughness:.3});
  const divine=new T.MeshStandardMaterial({color:cold?'#78cfff':'#f8b75e',emissive:cold?'#278ce9':'#ce7425',emissiveIntensity:1.6,metalness:.4,roughness:.25});
  const chest=mesh(new T.BoxGeometry(1.35,.67,.26),obsidian,0,2.18,.43,root);chest.rotation.x=-.14;
  mesh(new T.OctahedronGeometry(.28,0),divine,0,2.24,.62,root);
  for(const side of [-1,1]){
   const shoulder=mesh(new T.SphereGeometry(.55,12,8),gold,side*.9,2.55,0,root);shoulder.scale.set(1.18,.63,.88);
   mesh(new T.ConeGeometry(.23,.8,6),gold,side*.99,3.04,-.04,root).rotation.z=side*.4;
   mesh(new T.BoxGeometry(.38,.65,.34),obsidian,side*.93,1.64,.06,root);
   mesh(new T.TorusGeometry(.25,.055,5,12),divine,side*.94,1.26,.26,root);
  }
  mesh(new T.TorusGeometry(.55,.09,7,28),gold,0,2.99,0,root).rotation.x=Math.PI/2;
  for(let k=0;k<5;k++){const a=(k-2)*.32;mesh(new T.ConeGeometry(.14,.5,5),gold,Math.sin(a)*.46,3.29,Math.cos(a)*.15,root)}
  const cape=new T.Mesh(new T.PlaneGeometry(1.75,2.45,8,12),new T.MeshStandardMaterial({color:'#442c51',roughness:.87,side:T.DoubleSide}));
  cape.position.set(0,1.58,-.57);cape.rotation.x=.16;root.add(cape);
  const halo=mesh(new T.TorusGeometry(1.12,.055,7,42),divine,0,3.45,0,root);halo.rotation.x=Math.PI/2;
  root.userData.godHalo=halo;

  // Preserve authored GLB character proportions while improving material response.
  root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial){m.roughness=Math.max(.28,Math.min(.88,m.roughness??.68));m.metalness=Math.max(0,Math.min(.62,m.metalness??.1));m.needsUpdate=true}}}
  });
 }
 async function getGod(){let selected=localStorage.getItem('gf19_model')||'goddess_muscular';let g=await new Promise((resolve,reject)=>new Loader().load('models/'+selected+'.glb',resolve,undefined,reject));const root=new T.Group();root.add(fitGLB(g.scene));applyStyle(root);return root}
 function createMob(x,z,kind){
  const root=new T.Group();root.position.set(x,0,z);scene.add(root);
  const tower=kind==='tower',friendly=kind==='ally';
  const stone=surface('masonry','#c2c4c8'),stone2=surface('masonry','#e0ded7'),iron=surface('iron',friendly?'#b6d8e2':'#d3aeb2'),
        cloth=material(friendly?'#2e7382':'#7b384a'),wood=surface('timber','#746356');
  const glow=new T.MeshStandardMaterial({color:friendly?'#72e9ff':'#f9a75e',emissive:friendly?'#1599c1':'#cf4c23',emissiveIntensity:1.4,roughness:.35});
  if(tower){
   mesh(new T.CylinderGeometry(3.1,4.3,1.2,8),stone2,0,.6,0,root);
   mesh(new T.CylinderGeometry(2.5,3.2,10.5,8),stone,0,6.3,0,root);
   for(let level=0;level<8;level++){let radius=3.16-level*.072;for(let k=0;k<8;k++){let a=k*Math.PI/4+(level%2)*Math.PI/8;let joint=mesh(new T.BoxGeometry(.095,.095,1.0),stone2,Math.sin(a)*radius,1.55+level*1.25,Math.cos(a)*radius,root);joint.rotation.y=a}}
   for(let i=0;i<8;i++){let a=i*Math.PI/4,x=Math.sin(a)*2.7,z=Math.cos(a)*2.7;
    mesh(new T.BoxGeometry(1.2,1.8,1.2),stone2,x,12.5,z,root).rotation.y=a;
    mesh(new T.BoxGeometry(.3,8,.38),stone2,x*.85,6.4,z*.85,root).rotation.y=a;
   }
   mesh(new T.CylinderGeometry(3.2,3.2,1,8),stone2,0,11.7,0,root);
   for(let i=0;i<4;i++){let a=i*Math.PI/2;mesh(new T.ConeGeometry(.9,3.5,4),wood,Math.sin(a)*1.7,14,Math.cos(a)*1.7,root)}
   const crystal=mesh(new T.OctahedronGeometry(1.45,1),glow,0,14.2,0,root);
   mesh(new T.TorusGeometry(2,.14,6,32),glow,0,14,0,root).rotation.x=Math.PI/2;
   root.userData.pulse=crystal;
  }else{
   // Armored humanoid minion: helmet, torso, legs, arms, shield and spear.
   mesh(new T.CylinderGeometry(.5,.65,1.45,8),cloth,0,1.8,0,root);
   mesh(new T.BoxGeometry(1.35,.9,.78),iron,0,2.35,0,root);
   mesh(new T.BoxGeometry(.84,.65,.11),surface('iron','#c1b8aa'),0,2.34,.46,root);
   mesh(new T.BoxGeometry(.18,.68,.15),stone2,0,2.34,.54,root);
   mesh(new T.SphereGeometry(.47,10,8),stone2,0,3.2,0,root);
   mesh(new T.BoxGeometry(.53,.22,.12),material('#1b1c20'),0,3.18,.43,root);
   mesh(new T.ConeGeometry(.55,.65,8),iron,0,3.7,0,root);
   mesh(new T.BoxGeometry(.84,.16,.2),iron,0,3.27,.42,root);
   for(let side of [-1,1]){
    mesh(new T.CylinderGeometry(.22,.28,1.4,7),iron,side*.43,.83,0,root);
    mesh(new T.CylinderGeometry(.22,.25,1.3,7),cloth,side*.88,2.05,0,root).rotation.z=side*.2;
    mesh(new T.SphereGeometry(.35,8,6),iron,side*.8,2.65,0,root);
   }
   mesh(new T.BoxGeometry(.75,1.1,.2),iron,-1.05,1.85,.35,root);
   mesh(new T.CylinderGeometry(.07,.07,3.4,6),wood,1.04,2.35,.55,root);
   mesh(new T.ConeGeometry(.24,.8,5),glow,1.04,4.35,.55,root);
   mesh(new T.BoxGeometry(.8,.18,.22),glow,0,2.45,.48,root);
  }
  let hp=tower?220:65;return {root,x,z,hp,max:hp,kind,alive:true,friendly,speed:0};
 }
 function spawn(){for(let side of [true,false])for(let lane=-1;lane<=1;lane++)for(let tier=0;tier<3;tier++){const z=side?[210,123,57][tier]:[434,521,587][tier];const x=laneX(lane,z),m=createMob(x,z,'tower');m.friendly=side;m.lane=lane;m.tier=tier;m.max=m.hp=[320,510,780][tier];m.root.scale.setScalar([.85,1.1,1.35][tier]);m.root.traverse(o=>{if(o.isMesh&&o.material?.emissive)o.material.emissiveIntensity=1+tier*.45});mobs.push(m);towerZone(x,z,19+tier*2,side,tier)}buildFinalTitans();for(let b of buffs){let c=b.kind==='POWER'?'#e94849':b.kind==='SPEED'?'#40bbf5':'#70e29c';b.orb=mesh(new T.IcosahedronGeometry(1.6,1),material(c,.2),b.x,2.4,b.z);b.orb.userData.kind=b.kind}}

 function laneApproach(lane,z,friendly){
  const t=friendly?Math.min(1,Math.max(0,(z-18)/75)):Math.min(1,Math.max(0,(628-z)/75));
  const eased=t*t*(3-2*t);
  return laneX(0,z)*(1-eased)+laneX(lane,z)*eased;
 }
 function inSanctuary(x,z,friendly){
  return Math.hypot(x-laneX(0,friendly?16:628),z-(friendly?16:628))<20;
 }
 function buildFinalTitans(){
  for(const friendly of [true,false]){
   const x=laneX(0,friendly?35:609),z=friendly?35:609;
   const root=new T.Group();root.position.set(x,0,z);scene.add(root);
   const armor=material(friendly?'#456d77':'#6b3549'),glow=new T.MeshStandardMaterial({color:friendly?'#7deaff':'#ff8c9b',emissive:friendly?'#27b8e3':'#d43857',emissiveIntensity:1.6,metalness:.35});
   mesh(new T.CylinderGeometry(2.3,3.6,6,9),armor,0,3.2,0,root);
   mesh(new T.BoxGeometry(6.2,3.2,3.8),armor,0,7.1,0,root);
   mesh(new T.SphereGeometry(1.75,12,9),glow,0,10,0,root);
   for(const side of [-1,1]){mesh(new T.ConeGeometry(1.3,4.5,6),armor,side*2.6,10.4,0,root).rotation.z=side*.42;mesh(new T.CylinderGeometry(.75,1.05,5.5,8),armor,side*4,5.3,0,root)}
   const weapon=mesh(new T.BoxGeometry(.7,7,.9),glow,5,4.2,1.3,root);
   const circle=mesh(new T.TorusGeometry(23,.23,7,80),glow,0,.15,0,root);circle.rotation.x=Math.PI/2;
   const titan={friendly,x,z,root,weapon,alive:true,hp:1900,max:1900,attackClock:1.4,range:23,tier:3,kind:'titan'};
   baseStructures.push(titan);
  }
 }
 function endIfTitanDestroyed(titan){if(titan.hp>0||!titan.alive)return;titan.alive=false;titan.root.visible=false;matchEnded=true;$('status').textContent=titan.friendly?'DEFEAT · YOUR TITAN HAS FALLEN':'VICTORY · ENEMY TITAN DEFEATED'}
 function updateDefenses(dt,now){
  if(matchEnded)return;
  const targets=[...mobs.filter(m=>m.alive&&(m.kind==='ally'||m.kind==='minion')),...bots.filter(b=>b.alive)];
  for(const tower of mobs.filter(m=>m.alive&&m.kind==='tower')){
   tower.attackClock=(tower.attackClock||0)-dt;
   if(tower.attackClock>0)continue;
   const range=19+(tower.tier||0)*2;
   const enemy=targets.find(o=>o.friendly!==tower.friendly&&Math.hypot(o.x-tower.x,o.z-tower.z)<range);
   const player=!tower.friendly&&hp>0&&Math.hypot(position.x-tower.x,position.z-tower.z)<range;
   if(!enemy&&!player)continue;
   tower.attackClock=[1.75,1.55,1.35][tower.tier||0];
   const dmg=[13,19,26][tower.tier||0];
   const dest=enemy?{x:enemy.x,y:2.3,z:enemy.z,target:enemy}:{x:position.x,y:2.2,z:position.z,hero:true};
   fireProjectile({x:tower.x,y:13,z:tower.z},dest,dmg,'tower',tower);
  }
  for(const titan of baseStructures){
   if(!titan.alive)continue;
   titan.attackClock-=dt;
   const target=targets.find(o=>o.friendly!==titan.friendly&&Math.hypot(o.x-titan.x,o.z-titan.z)<titan.range);
   const player=!titan.friendly&&hp>0&&Math.hypot(position.x-titan.x,position.z-titan.z)<titan.range;
   if(titan.attackClock<=0&&(target||player)){
    titan.attackClock=2.1;titan.weapon.rotation.z=-1.15;
    const dmg=38;
    if(target){target.hp-=dmg;if(target.hp<=0){if(target.kind==='ally'||target.kind==='minion')finishMob(target,false);else{target.alive=false;target.root.visible=false;target.respawnAt=now+11000}}}
    else hp=Math.max(0,hp-(now<shieldUntil?dmg*.25:dmg));
   }else titan.weapon.rotation.z+=(0-titan.weapon.rotation.z)*Math.min(1,dt*5);
   endIfTitanDestroyed(titan)
  }
  // Sanctuary water is lethal to enemies, but safe for allied upgrades.
  for(const b of bots)if(b.alive&&inSanctuary(b.x,b.z,!b.friendly)){b.hp=0;b.alive=false;b.root.visible=false;b.respawnAt=now+11000}
  if(hp>0&&inSanctuary(position.x,position.z,false)){hp=0;$('status').textContent='ENEMY SANCTUARY · LETHAL WATERS'}
 }
 function collision(x,z){if(z<55||z>589)return false;let nearest=[-1,0,1].some(l=>Math.abs(x-laneX(l,z))<11);let crossing=[125,310,510].some(a=>Math.abs(z-a)<8&&Math.abs(x)<105);let camp=buffs.some(b=>Math.hypot(x-b.x,z-b.z)<10);let grass=demonDogs.some(d=>Math.hypot(x-d.homeX,z-d.homeZ)<d.radius+2);return !(nearest||crossing||camp||grass)}

 // Animated physical weapon, attached to the character's hand position, not the VFX.
 function buildPhysicalWeapon(type){
  if(!T||!modelRoot)return;
  if(weaponRig){modelRoot.remove(weaponRig);weaponRig.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}})}
  activeWeapon=type;weaponRig=new T.Group();weaponRig.position.set(.9,2.12,.3);modelRoot.add(weaponRig);
  weaponGrip=new T.Group();weaponRig.add(weaponGrip);
  const steel=new T.MeshStandardMaterial({color:'#c9d4df',metalness:.85,roughness:.22});
  const trim=new T.MeshStandardMaterial({color:'#b78b48',metalness:.68,roughness:.28});
  const grip=new T.MeshStandardMaterial({color:'#352b29',roughness:.85});
  const box=(w,h,d,mat,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,weaponGrip);
  const shaft=(h,r,mat)=>mesh(new T.CylinderGeometry(r,r,h,9),mat,0,h/2,0,weaponGrip);
  if(type==='War Axe'){shaft(2.8,.095,grip);box(1.35,.83,.25,steel,.48,2.35,0);box(.6,.14,.4,trim,0,1.8,0)}
  else if(type==='Spear'){shaft(3.5,.065,grip);mesh(new T.ConeGeometry(.27,.85,7),steel,0,3.87,0,weaponGrip);box(.28,.12,.32,trim,0,3.38,0)}
  else if(type==='Staff'){shaft(3.4,.13,grip);mesh(new T.OctahedronGeometry(.42,1),new T.MeshStandardMaterial({color:'#83baff',emissive:'#306bcd',emissiveIntensity:1.1}),0,3.7,0,weaponGrip);box(.5,.12,.5,trim,0,3.1,0)}
  else if(type==='Dual Blades'){for(const side of [-1,1]){box(.1,1.45,.19,steel,side*.42,1.05,0);box(.38,.1,.25,trim,side*.42,.3,0)}}
  else {shaft(.95,.11,grip);box(.75,.13,.34,trim,0,.9,0);box(type==='Greatsword'?.23:.18,type==='Greatsword'?2.75:2.15,.22,steel,0,type==='Greatsword'?2.33:2.05,0);mesh(new T.ConeGeometry(.2,.55,4),steel,0,type==='Greatsword'?3.95:3.42,0,weaponGrip)}
  weaponGrip.rotation.set(0,0,-.15);
 }
 function animatePhysicalWeapon(dt){
  const selected=window.gfGetConfig?.().weapon||'Greatsword';
  if(selected!==activeWeapon)buildPhysicalWeapon(selected);
  if(!weaponGrip)return;
  weaponAttackAge+=dt;
  const duration=selected==='War Axe'?.63:selected==='Spear'?.43:.48;
  const t=Math.min(1,weaponAttackAge/duration);
  if(t>=1){weaponGrip.rotation.set(0,0,-.15);weaponRig.rotation.set(0,0,0);weaponRig.position.z=.3;return}
  const swing=Math.sin(t*Math.PI);
  // Left, right, then overhead. Spear uses a forward thrust on the third hit.
  if(weaponAttackStep===3&&selected==='Spear'){
   weaponGrip.rotation.set(-.25-swing*.7,0,-.12);
   weaponRig.position.z=.3+swing*2.1;
  }else{
   weaponRig.position.z=.3;
   const direction=weaponAttackStep===2?-1:1;
   weaponGrip.rotation.set(-.3-swing*.75,0,(weaponAttackStep===3?0:direction*(1.25-2.6*t)));
   weaponRig.rotation.y=direction*swing*.48;
   if(weaponAttackStep===3)weaponGrip.rotation.x=-1.4+2.6*t;
  }
 }
  async function init(){if(loading||initialized)return;loading=true;try{T=await import('https://esm.sh/three@0.170.0');const mod=await import('https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js');Loader=mod.GLTFLoader;scene=new T.Scene();scene.background=new T.Color('#101c1b');scene.fog=new T.FogExp2('#142321',.0065);camera=new T.PerspectiveCamera(68,1,.1,250);renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;scene.add(new T.HemisphereLight(0xc6d9f3,0x251b20,2.2));let sun=new T.DirectionalLight(0xf1d3a1,2.5);sun.position.set(-15,40,25);scene.add(sun);makeTerrain();hero=await getGod();modelRoot=new T.Group();modelRoot.add(hero);scene.add(modelRoot);buildPhysicalWeapon(window.gfGetConfig?.().weapon||'Greatsword');combatForge=window.GFCombatForge?.(T,scene,modelRoot)||null;spawn();spawnGods();setupHud();matchStartedAt=performance.now();matchElapsed=0;lastWave=0;loading=false;initialized=true;requestAnimationFrame(frame)}catch(e){loading=false;$('status').textContent='3D scene failed: '+e.message;console.error(e)}}
 // Phase 33: distinct weapon reach, forward hit arcs and three-stage directional combos.
 function hit(){if(!active||hp<=0)return;
  recallUntil=0;strike=(strike%3)+1;attackTime=.46;weaponAttackStep=strike;weaponAttackAge=0;
  const weapon=window.gfGetConfig?.().weapon||'Greatsword';
  const reaches={Greatsword:6.1,'War Axe':5.5,Spear:7.2,Staff:6.8,'Dual Blades':4.9};
  let best=null,dist=reaches[weapon]||5.8;
  const fX=Math.sin(yaw),fZ=Math.cos(yaw);
  for(const m of mobs){
   if(!m.alive||m.friendly)continue;
   const dx=m.x-position.x,dz=m.z-position.z,d=Math.hypot(dx,dz);
   if(d>=dist||d<.001)continue;
   const facing=(dx*fX+dz*fZ)/d;
   if(facing<(weapon==='War Axe'?.12:weapon==='Spear'?.45:.24))continue;
   best=m;dist=d;
  }
  // Gods and final Titan can be targeted by the same basic attacks.
  let special=null;
  for(const bot of bots)if(bot.alive&&!bot.friendly){const d=Math.hypot(bot.x-position.x,bot.z-position.z);if(d<dist){const facing=((bot.x-position.x)*fX+(bot.z-position.z)*fZ)/Math.max(.001,d);if(facing>.24){special=bot;best=null;dist=d}}}
  for(const titan of baseStructures)if(titan.alive&&!titan.friendly&&!mobs.some(m=>m.alive&&m.kind==='tower'&&!m.friendly&&m.lane===Math.round(position.x/95))){const d=Math.hypot(titan.x-position.x,titan.z-position.z);if(d<dist){special=titan;best=null;dist=d}}
  if(!best&&!special)damageDemonDog(position.x+fX*3,position.z+fZ*3,(strike===3?44:25)+powerBonus,5);
  combatForge?.attack(weapon,strike,best?{x:best.x,z:best.z}:special?{x:special.x,z:special.z}:null);
  if(special){special.hp-=(strike===3?55:30)+powerBonus*.4;if(special.kind==='titan')endIfTitanDestroyed(special);else if(special.hp<=0){special.alive=false;special.root.visible=false;special.respawnAt=performance.now()+11000;gainGold(85);kills++}
   $('status').textContent=(special.name||'TITAN')+' '+Math.max(0,Math.ceil(special.hp))+' HP';
  }
  if(best){best.hp-=(strike===3?55:30)+powerBonus*.4;
   if(best.hp<=0)finishMob(best,true)
   $('status').textContent=best.kind.toUpperCase()+' '+Math.max(0,best.hp)+'/'+best.max+' HP · '+strike+'/3 COMBO';
  }
 }
 function spellPart(geometry,mat,x,y,z,group){return mesh(geometry,mat,x,y,z,group)}
 let abilityReady=[0,0,0],summons=[];
 function cast(which){
  if(!active||hp<=0)return;const now=performance.now();if(now<abilityReady[which]){$('status').textContent='Power cooling down · '+Math.ceil((abilityReady[which]-now)/1000)+'s';return}
  const cfg=window.gfGetConfig?.()||{},name=cfg['ability'+(which+1)]||'Cinder Fan';const pool={Cone:['Cinder Fan','Glacier Breath','Dread Howl'],Line:['Storm Lance','Rift Spear','Solar Rail'],Placement:['Grave Circle','Forge Turret','Verdant Snare']};let type=Object.keys(pool).find(k=>pool[k].includes(name))||'Cone';abilityReady[which]=now+(type==='Placement'?11500:7000);recallUntil=0;
  const dirX=Math.sin(yaw),dirZ=Math.cos(yaw),originX=position.x,originZ=position.z;
  const distance=type==='Line'?19:type==='Cone'?11:13;
  const tx=originX+dirX*distance,tz=originZ+dirZ*distance;
  if(combatForge)combatForge.ability(name,originX,originZ,yaw,tx,tz);
  else {
   const fx=new T.Group();scene.add(fx);fx.position.set(originX,0,originZ);
   const mat=new T.MeshBasicMaterial({color:'#b5a2ff',transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide});
   const indicator=mesh(new T.RingGeometry(1,3.4,32),mat,dirX*7,.12,dirZ*7,fx);
   indicator.rotation.x=-Math.PI/2;
   effects.push({mesh:fx,ttl:.7,max:.7,spell:which});
  }
  // A Forge Turret remains a persistent damaging summon, not just an effect.
  if(name==='Forge Turret'){
   const turret=mesh(new T.CylinderGeometry(.6,1.1,3,8),material('#997345'),tx,1.5,tz);
   summons.push({mesh:turret,x:tx,z:tz,until:now+8000,next:0});
  }
 for(const m of mobs){if(!m.alive||m.friendly)continue;const dx=m.x-originX,dz=m.z-originZ,forward=dx*dirX+dz*dirZ,side=Math.abs(dx*dirZ-dz*dirX),range=Math.hypot(dx, dz);let hit=type==='Cone'?forward>0&&forward<12&&side<forward*.65+1:type==='Line'?forward>0&&forward<20&&side<1.8:Math.hypot(m.x-tx,m.z-tz)<6;if(!hit)continue;
   let dmg=type==='Line'?65:type==='Cone'?43:35; if(name==='Solar Rail')dmg=90;if(name==='Dread Howl')m.stunnedUntil=now+1100;if(name==='Glacier Breath'||name==='Verdant Snare')m.stunnedUntil=now+1700;
   m.hp-=dmg+powerBonus;if(m.hp<=0)finishMob(m,true)
  }
  for(const enemy of [...bots.filter(b=>b.alive&&!b.friendly),...baseStructures.filter(t=>t.alive&&!t.friendly&&!mobs.some(m=>m.alive&&m.kind==='tower'&&!m.friendly))]){
   const dx=enemy.x-originX,dz=enemy.z-originZ,forward=dx*dirX+dz*dirZ,side=Math.abs(dx*dirZ-dz*dirX);
   const struck=type==='Cone'?forward>0&&forward<12&&side<forward*.65+1:type==='Line'?forward>0&&forward<20&&side<1.8:Math.hypot(enemy.x-tx,enemy.z-tz)<6;
   if(!struck)continue;
   enemy.hp-=(type==='Line'?65:type==='Cone'?43:35)+powerBonus;
   if(enemy.kind==='titan')endIfTitanDestroyed(enemy);
   else if(enemy.hp<=0){enemy.alive=false;enemy.root.visible=false;enemy.respawnAt=now+11000;gold+=85;kills++}
  }
  damageDemonDog(tx,tz,42+powerBonus,7);
  $('status').textContent=name.toUpperCase()+' · '+type+' power';
 }
 function frame(time){requestAnimationFrame(frame);for(const t of summons){if(time>t.until){scene.remove(t.mesh);continue}if(time<t.next)continue;t.next=time+800;let target=mobs.find(m=>m.alive&&!m.friendly&&Math.hypot(m.x-t.x,m.z-t.z)<14);if(target){target.hp-=18+powerBonus*.3;if(target.hp<=0){target.alive=false;target.root.visible=false;gainGold(45)}}}summons=summons.filter(t=>time<t.until);if(!active||!renderer)return;let dt=Math.min(.04,(time-(prev||time))/1000);prev=time;const v=window.gfGetConfig?.();let j=window.joystick||null; // legacy joystick is lexical; bridge below supplies it.
 const input=window.gf21Joy?.()||{x:0,y:0};let forward=input.y,strafe=-input.x; // Phase 22: horizontal stick reversed; vertical unchanged
 let speed=dt*15*(time<speedBuffUntil?1.25:1)*(ownedItems[5]?1+ownedItems[5]*.08:1);let dx=(Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*speed,dz=(Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*speed;
 if(Math.hypot(dx,dz)>.025)recallUntil=0;if(hp<=0){dx=0;dz=0}let nx=position.x+dx,nz=Math.max(4,Math.min(640,position.z+dz));if(!collision(nx,position.z))position.x=nx;if(!collision(position.x,nz))position.z=nz;
 modelRoot.position.set(position.x,Math.sin(time*.009)*.045,position.z);modelRoot.rotation.y=yaw;hero.rotation.z=0;animatePhysicalWeapon(dt);attackTime=Math.max(0,attackTime-dt);hero.rotation.y=attackTime?Math.sin(attackTime*13)*.26:0;
 let back=7,dirX=Math.sin(yaw),dirZ=Math.cos(yaw);camera.position.set(position.x-dirX*back,4.7+pitch*5,position.z-dirZ*back);camera.lookAt(position.x+dirX*4,2.2+pitch*3,position.z+dirZ*4);
 updateBattleSystems(dt,time);
 combatForge?.tick(dt);
 if(baseFountain?.userData.heart){baseFountain.userData.heart.rotation.y+=dt*.6;baseFountain.userData.heart.position.y=1.55+Math.sin(time*.0017)*.35;}
 for(let b of buffs){if(b.alive){b.orb.visible=true;b.orb.rotation.y+=dt;b.orb.position.y=2.3+Math.sin(time*.003+b.x)*.25;if(Math.hypot(position.x-b.x,position.z-b.z)<3){b.alive=false;b.respawn=time+45000;b.orb.visible=false;if(b.kind==='SPEED')speedBuffUntil=time+20000;$('status').textContent=b.kind+' JUNGLE BUFF ACQUIRED · +25% movement for 20s'}}else if(time>b.respawn)b.alive=true}
 for(let e of effects){e.ttl-=dt;let progress=1-e.ttl/e.max;e.mesh.scale.setScalar(.72+progress*.38);if(e.spell===0)e.mesh.rotation.y+=dt*1.8;if(e.spell===2)e.mesh.rotation.y+=dt*.4;e.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.transparent){o.material.opacity=Math.max(0,1-progress)*(.7)}});if(e.ttl<=0){scene.remove(e.mesh);e.mesh.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.dispose)o.material.dispose()}})}}effects=effects.filter(e=>e.ttl>0);
 let w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h){if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}renderer.render(scene,camera)} }
 canvas.addEventListener('pointerdown',e=>{look={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!look||look.id!==e.pointerId)return;let dx=e.clientX-look.x,dy=e.clientY-look.y;yaw+=dx*.006;pitch=Math.max(-.5,Math.min(.5,pitch-dy*.003));look.x=e.clientX;look.y=e.clientY});canvas.addEventListener('pointerup',()=>look=null);canvas.addEventListener('pointercancel',()=>look=null);
 for(let [id,fn] of [['attack',hit],['s1',()=>cast(0)],['s2',()=>cast(1)],['s3',()=>cast(2)],['s4',utility]])$(id).addEventListener('pointerdown',e=>{if(!active)return;e.stopImmediatePropagation();e.preventDefault();fn()},true);
 const observer=new MutationObserver(()=>{let show=$('battle').classList.contains('active');if(show){canvas.style.display='block';active=true;window.gf21Active=true;window.playing=false;init()}else{active=false;canvas.style.display='none'}});observer.observe($('battle'),{attributes:true,attributeFilter:['class']});
 return {getGod,fitGLB,applyStyle};
})();
