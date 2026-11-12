/* Shared terrain heights keep bridges, actors and camera on the same surface. */
window.GFWorldRules={
 bridges:[{x:-48,z:24,axis:'x'},{x:48,z:24,axis:'x'},{x:-48,z:620,axis:'x'},{x:48,z:620,axis:'x'},{x:-98,z:330,axis:'z'},{x:92,z:330,axis:'z'},{x:Math.sin(330*.013)*4+Math.sin(330*.031)*1.7,z:330,axis:'z'}],
 bridgeHeight(t){return .32+1.45*Math.sin(Math.PI*Math.max(0,Math.min(1,t)))**2},
 surfaceHeight(x,z){for(const b of this.bridges){const along=b.axis==='x'?x-b.x:z-b.z,across=b.axis==='x'?z-b.z:x-b.x;if(Math.abs(along)<=16&&Math.abs(across)<=6)return this.bridgeHeight((along+16)/32)}return z<95||z>549?.32:.11},
 leapPoint(from,to,t){t=Math.max(0,Math.min(1,t));return {x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t,y:4*4.4*t*(1-t)}},
 dogs:{campZ:[215,405,555],perCamp:4,health:420,alphaHealth:720,damage:28,alphaDamage:45,respawn:45000}
};
window.GFBuildWitchwood=function(T,scene,{mesh,material,surface,laneX}){
 const wood=surface('masonry','#c6c0a5',2),brick=surface('masonry','#b8b59d',3),slate=surface('slate','#ded5ba',2);
 const active=[];
 const water=new T.MeshPhysicalMaterial({color:'#22b8bd',metalness:.22,roughness:.19,clearcoat:1,clearcoatRoughness:.12,transparent:true,opacity:.87,side:T.DoubleSide});
 const rippleData=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,v=128+45*Math.sin(x*.6+y*.3)+25*Math.sin(y*.9-x*.2);rippleData[i]=rippleData[i+1]=rippleData[i+2]=v;rippleData[i+3]=255;}
 const ripples=new T.DataTexture(rippleData,64,64);ripples.wrapS=ripples.wrapT=T.RepeatWrapping;ripples.repeat.set(3,55);ripples.needsUpdate=true;water.bumpMap=ripples;water.bumpScale=.14;
 function stream(points,width){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],.07,p[1]))),verts=[],uv=[],indices=[];
  for(let i=0;i<=320;i++){const t=i/320,p=curve.getPoint(t),tangent=curve.getTangent(t),nx=-tangent.z,nz=tangent.x,w=width*(1+.12*Math.sin(t*51));for(const side of [-1,1]){verts.push(p.x+nx*w*side,.07,p.z+nz*w*side);uv.push((side+1)/2,t);}}
  for(let i=0;i<320;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const river=mesh(geo,water,0,0,0);river.userData.dynamic=true;river.name='continuous-stream';river.castShadow=false;
  // Organic gravel banks, with gaps at crossings and clear paths.
  for(let i=0;i<=90;i++){const t=i/90,p=curve.getPoint(t),v=curve.getTangent(t);if([24,125,310,330,510,620].some(z=>Math.abs(z-p.z)<18))continue;for(const side of [-1,1]){const rock=mesh(new T.DodecahedronGeometry(.45+(i%3)*.15,0),brick,p.x-v.z*width*side,.13,p.z+v.x*width*side);rock.scale.set(1.6,.6,1);}}
 }
 for(const side of [-1,1])stream([[-48*side,-90],[-48*side,24],[-52*side,110],[-40*side,215],[-48*side,330],[-55*side,445],[-43*side,540],[-48*side,620],[-48*side,730]],6);
 stream([[-210,330],[-98,330],[-48,330],[-5,330],[48,330],[92,330],[210,330]],6);

 for(const b of GFWorldRules.bridges){
  const g=new T.Group();g.position.set(b.x,0,b.z);g.rotation.y=b.axis==='x'?0:Math.PI/2;scene.add(g);

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
 return {tick(time){ripples.offset.y=-time*.000018;ripples.offset.x=Math.sin(time*.0001)*.12;}};
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
