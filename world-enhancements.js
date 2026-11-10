/* Shared terrain heights keep bridges, actors and camera on the same surface. */
window.GFWorldRules={
 bridges:[{x:-48,z:24,axis:'x'},{x:48,z:24,axis:'x'},{x:-48,z:620,axis:'x'},{x:48,z:620,axis:'x'},{x:Math.sin(330*.013)*4+Math.sin(330*.031)*1.7,z:330,axis:'z'}],
 bridgeHeight(t){return .32+1.45*Math.sin(Math.PI*Math.max(0,Math.min(1,t)))**2},
 surfaceHeight(x,z){for(const b of this.bridges){const along=b.axis==='x'?x-b.x:z-b.z,across=b.axis==='x'?z-b.z:x-b.x;if(Math.abs(along)<=16&&Math.abs(across)<=6)return this.bridgeHeight((along+16)/32)}return z<55||z>589?.32:.11},
 leapPoint(from,to,t){t=Math.max(0,Math.min(1,t));return {x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t,y:4*4.4*t*(1-t)}},
 dogs:{campZ:[215,405,555],perCamp:4,health:420,alphaHealth:720,damage:28,alphaDamage:45,respawn:45000}
};
window.GFBuildWitchwood=function(T,scene,{mesh,material,surface,laneX}){
 const water=new T.MeshStandardMaterial({color:'#102721',metalness:.55,roughness:.18}),wood=surface('timber','#766957',2),brick=surface('masonry','#65554a',3),slate=surface('slate','#353943',2);
 const active=[];
 for(const b of GFWorldRules.bridges){
  const g=new T.Group();g.position.set(b.x,0,b.z);g.rotation.y=b.axis==='x'?0:Math.PI/2;scene.add(g);
  const pool=mesh(new T.PlaneGeometry(32,38),water,0,.23,0,g);pool.rotation.x=-Math.PI/2;
  // Each plank and railing follows the same arch used by movement.
  for(let j=0;j<32;j++){const u=j/32,v=(j+1)/32,h1=GFWorldRules.bridgeHeight(u),h2=GFWorldRules.bridgeHeight(v),x=-15.5+j;
   const plank=mesh(new T.BoxGeometry(1.02,.24,11.6),wood,x,(h1+h2)/2-.12,0,g);plank.rotation.z=Math.atan2(h2-h1,1);
   for(const side of [-1,1]){const rail=mesh(new T.BoxGeometry(1.05,.18,.23),wood,x,(h1+h2)/2+1.45,side*5.75,g);rail.rotation.z=plank.rotation.z;}
  }
  for(let j=0;j<=8;j++)for(const side of [-1,1]){const x=-16+j*4,h=GFWorldRules.bridgeHeight(j/8);mesh(new T.BoxGeometry(.34,1.65,.34),wood,x,h+.72,side*5.75,g);mesh(new T.BoxGeometry(.65,.16,.65),brick,x,h+1.6,side*5.75,g);}
  for(let j=0;j<28;j++){const side=j%2?1:-1;mesh(new T.ConeGeometry(.1,1.2,4),material('#59633a'),-15+(j*7%30),.68,side*(8+j%8),g);}
 }
 // Segmented outer masonry: gaps at crossroads; nothing blocks the three lanes.
 for(const side of [-1,1])for(const z of [72,168,265,365,455,570]){
  const g=new T.Group();g.position.set(side*135,0,z);scene.add(g);
  mesh(new T.BoxGeometry(1.8,4.2,36),brick,0,2.1,0,g);mesh(new T.BoxGeometry(2.2,.35,36.8),slate,0,4.3,0,g);
  for(let dz=-18;dz<=18;dz+=6){mesh(new T.BoxGeometry(2.4,5,2),brick,0,2.5,dz,g);mesh(new T.BoxGeometry(2.7,.3,2.3),slate,0,5.12,dz,g);}
 }
 const green=new T.MeshStandardMaterial({color:'#b8ed87',emissive:'#58963c',emissiveIntensity:1.6}),coal=material('#191b1a'),robe=material('#282136'),skin=material('#869373');
 for(const side of [-1,1])for(const z of [165,275,465]){
  const g=new T.Group();g.position.set(side*53,0,z);g.rotation.y=side>0?-Math.PI/2:Math.PI/2;scene.add(g);
  const walls=surface('plaster','#5e6154',2);mesh(new T.BoxGeometry(8,6,7),walls,0,3,0,g);
  for(const x of [-4,0,4])mesh(new T.BoxGeometry(.35,6.4,.35),wood,x,3.2,3.6,g);
  for(const sign of [-1,1]){const roof=mesh(new T.BoxGeometry(5.6,.4,9),slate,sign*2,7,0,g);roof.rotation.z=-sign*.6;}
  mesh(new T.BoxGeometry(1.2,4,1.2),brick,-2.2,7.8,-1.5,g);
  mesh(new T.BoxGeometry(2.1,3.8,.15),wood,0,1.9,3.6,g);
  for(const x of [-2.7,2.7]){mesh(new T.BoxGeometry(1.2,1.5,.12),green,x,3.4,3.6,g);mesh(new T.BoxGeometry(.11,1.55,.2),wood,x,3.4,3.7,g);mesh(new T.BoxGeometry(1.3,.1,.2),wood,x,3.4,3.7,g);}
  // Iron cauldron with bubbling liquid, smoke, firewood, and a stirring witch.
  const pot=mesh(new T.SphereGeometry(1.2,16,10,0,Math.PI*2,.65,Math.PI-.65),coal,2.8,1.2,7,g);pot.rotation.x=Math.PI;
  const rim=mesh(new T.TorusGeometry(1.02,.13,8,24),coal,2.8,1.85,7,g);rim.rotation.x=Math.PI/2;
  const brew=mesh(new T.CircleGeometry(.92,24),green,2.8,1.8,7,g);brew.rotation.x=-Math.PI/2;
  for(let i=0;i<5;i++){const log=mesh(new T.CylinderGeometry(.15,.2,2.5,7),wood,2.8,.2,7,g);log.rotation.z=Math.PI/2;log.rotation.y=i*Math.PI/5;}
  const witch=new T.Group();witch.position.set(0,0,7.3);g.add(witch);
  mesh(new T.ConeGeometry(.7,2.5,12),robe,0,1.25,0,witch);mesh(new T.SphereGeometry(.36,12,8),skin,0,2.7,0,witch);
  const hat=mesh(new T.ConeGeometry(.59,1.4,12),robe,0,3.6,0,witch);hat.rotation.z=-.2;
  mesh(new T.CylinderGeometry(.82,.82,.07,24),robe,0,3.02,0,witch);
  const arm=mesh(new T.CylinderGeometry(.12,.16,1.1,8),robe,.6,2,.2,witch);arm.rotation.z=1.1;
  const spoon=mesh(new T.CylinderGeometry(.045,.055,2.2,6),wood,1.9,2.5,7,g);spoon.rotation.z=.5;
  const smokeMat=new T.MeshBasicMaterial({color:'#a9c8b5',transparent:true,opacity:.16,depthWrite:false});const vapors=[];
  for(let i=0;i<7;i++){const puff=mesh(new T.SphereGeometry(.3,7,6),smokeMat,2.8,2+i*.4,7,g);vapors.push(puff);}
  for(let i=0;i<6;i++){const a=i*2.4;const stem=mesh(new T.CylinderGeometry(.07,.1,.5,6),material('#b7b5a0'),Math.sin(a)*5,.3,Math.cos(a)*5+8,g);mesh(new T.SphereGeometry(.32,8,6,0,Math.PI*2,0,Math.PI/2),material(i%2?'#86504c':'#c0a28a'),stem.position.x,.58,stem.position.z,g);}
  for(let i=0;i<3;i++){const grave=mesh(new T.BoxGeometry(.9,1.6,.3),brick,-5-i*1.5,.75,4+i*1.3,g);grave.rotation.z=(i-1)*.15;mesh(new T.BoxGeometry(.5,.07,.08),slate,-5-i*1.5,1,4+i*1.3+.2,g);}
  witch.userData.dynamic=true;spoon.userData.dynamic=true;for(const puff of vapors)puff.userData.dynamic=true;
  active.push({witch,spoon,vapors,brew});
 }
 return {tick(time){for(const a of active){a.witch.rotation.z=Math.sin(time*.0012)*.035;a.spoon.rotation.x=Math.sin(time*.0018)*.22;for(let i=0;i<a.vapors.length;i++){const p=(time*.00018+i/7)%1;a.vapors[i].position.set(2.8+Math.sin(p*7)*.3,2+p*3.2,7+Math.cos(p*5)*.2);a.vapors[i].scale.setScalar(.35+p*1.7);}}}};
};
// Batch repeated static props per area; animated actors and water remain independent.
window.GFOptimizeScenery=function(T,scene){
 scene.updateMatrixWorld(true);const batches=new Map();
 scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent||!o.geometry.parameters)return;for(let p=o;p;p=p.parent)if(p.userData.dynamic)return;
  const m=o.material,g=o.geometry,pos=new T.Vector3().setFromMatrixPosition(o.matrixWorld),key=JSON.stringify([Math.floor(pos.x/65),Math.floor(pos.z/65),g.type,g.parameters,m.type,m.color?.getHex(),m.map?.uuid,m.bumpMap?.uuid,m.roughness,m.metalness,m.emissive?.getHex(),m.emissiveIntensity,m.side]);
  if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);
 });
 let removed=0,draws=0;for(const list of batches.values()){if(list.length<3)continue;const first=list[0],batch=new T.InstancedMesh(first.geometry,first.material,list.length);batch.castShadow=true;batch.receiveShadow=true;batch.name='scenery-batch';const discarded=new Set();for(let i=0;i<list.length;i++){const o=list[i];batch.setMatrixAt(i,o.matrixWorld);o.parent.remove(o);if(o.geometry!==first.geometry)discarded.add(o.geometry);}discarded.forEach(g=>g.dispose());batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();scene.add(batch);removed+=list.length;draws++;}
 return {props:removed,draws};
};
