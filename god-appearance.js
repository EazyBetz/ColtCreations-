// One shared appearance builder for in-match gods and the character creator.
(function(){
function sharedAppearance(root,T,mesh,material){window.GF22Style?.(root,window.gfGetConfig?.()||{},T);
  // Original godlike armor set layered over the character GLB: gold filigree,
  // illuminated crest, sculpted shoulders, ceremonial cape and divine aura.
  const cfg=window.gfGetConfig?.()||{},cold=cfg.weapon==='Staff'||cfg.weapon==='Spear';
  const gold=new T.MeshStandardMaterial({color:cfg.trimColor|| (cold?'#b5d9e9':'#d8b36c'),metalness:.86,roughness:.23});
  const obsidian=new T.MeshStandardMaterial({color:cfg.armorColor||'#263143',metalness:.7,roughness:.3});
  const divine=new T.MeshStandardMaterial({color:cfg.glowColor|| (cold?'#78cfff':'#f8b75e'),emissive:cold?'#278ce9':'#ce7425',emissiveIntensity:1.6,metalness:.4,roughness:.25});
  // Rounded, layered armor silhouette rather than a floating rectangular plate.
  const chest=mesh(new T.SphereGeometry(.83,32,20),obsidian,0,2.12,.23,root);chest.scale.set(1.14,.63,.54);
  const chestPlate=mesh(new T.SphereGeometry(.74,32,16),gold,0,2.21,.55,root);chestPlate.scale.set(.94,.43,.24);
  for(const side of [-1,1]){const rib=mesh(new T.TorusGeometry(.56,.07,8,32,Math.PI*.72),gold,side*.33,1.94,.48,root);rib.rotation.z=side*.62}
  const waist=mesh(new T.CylinderGeometry(.58,.48,.24,18),gold,0,1.45,0,root);
  for(const side of [-1,1]){const hip=mesh(new T.SphereGeometry(.35,18,12),obsidian,side*.46,1.17,0,root);hip.scale.set(.85,1.2,.7);
   const greave=mesh(new T.CylinderGeometry(.29,.24,.65,14),gold,side*.4,.53,.19,root);greave.rotation.z=side*.08;
   const boot=mesh(new T.SphereGeometry(.33,16,10),obsidian,side*.4,.2,.28,root);boot.scale.set(1,.5,1.4);
  }
  // Sculpted face overlay: visible brows, eyes, nose, mouth and layered hair.
  // High-detail, textured head rather than an untextured primitive face.
  const skinCanvas=document.createElement('canvas');skinCanvas.width=256;skinCanvas.height=256;
  const skinCtx=skinCanvas.getContext('2d'),skinImage=skinCtx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const i=(y*256+x)*4;
   const noise=Math.sin(x*11.27+y*19.19)*Math.sin(x*3.1-y*7.13)*5+Math.sin(x*.21+y*.38)*3;
   skinImage.data[i]=Math.max(0,Math.min(255,181+noise));
   skinImage.data[i+1]=Math.max(0,Math.min(255,135+noise*.85));
   skinImage.data[i+2]=Math.max(0,Math.min(255,113+noise*.8));
   skinImage.data[i+3]=255;
  }
  skinCtx.putImageData(skinImage,0,0);
  const skinMap=new T.CanvasTexture(skinCanvas);skinMap.colorSpace=T.SRGBColorSpace;
  const skin=new T.MeshStandardMaterial({map:skinMap,color:cfg.skin||'#ffffff',roughness:.87,metalness:0});
  const head=mesh(new T.SphereGeometry(.43,48,32),skin,0,2.91,.16,root);head.scale.set(.83,1.08,.8);
  const jaw=mesh(new T.SphereGeometry(.29,28,20),skin,0,2.68,.22,root);jaw.scale.set(.95,.55,.87);
  for(const side of [-1,1]){
   const ear=mesh(new T.SphereGeometry(.115,18,12),skin,side*.36,2.88,.16,root);ear.scale.set(.55,1,.6);
   const nostril=mesh(new T.SphereGeometry(.034,10,8),material('#68483f'),side*.075,2.77,.592,root);nostril.scale.set(.8,.45,.35);
  }
  const hair=new T.MeshStandardMaterial({color:cfg.hairColor||'#241a1b',roughness:.95});
  mesh(new T.SphereGeometry(.43,24,14),hair,0,3.19,.08,root).scale.set(.91,.48,.82);
  for(const side of [-1,1]){
   mesh(new T.SphereGeometry(.095,12,8),material('#f2e8d7'),side*.16,2.96,.465,root).scale.set(1.2,.6,.36);
   mesh(new T.SphereGeometry(.045,10,8),divine,side*.16,2.96,.51,root);
   const brow=mesh(new T.BoxGeometry(.25,.055,.09),hair,side*.16,3.075,.465,root);brow.rotation.z=side*.11;
   const cheek=mesh(new T.SphereGeometry(.16,14,10),material('#946e5e'),side*.26,2.8,.42,root);cheek.scale.set(.8,.5,.3);
  }
  const nose=mesh(new T.ConeGeometry(.085,.26,10),material('#b58a75'),0,2.87,.54,root);nose.rotation.x=Math.PI/2;
  mesh(new T.BoxGeometry(.21,.035,.04),material('#65483f'),0,2.72,.48,root);
  // Flowing locks make the silhouette distinct at third-person camera distance.
  for(let i=0;i<9;i++){const angle=(i/8)*Math.PI;const lock=mesh(new T.CylinderGeometry(.065,.018,.65+(i%3)*.16,8),hair,Math.cos(angle)*.4,2.82,-.05-Math.sin(angle)*.3,root);lock.rotation.z=Math.cos(angle)*.18}

  mesh(new T.OctahedronGeometry(.28,0),divine,0,2.24,.62,root);
  for(const side of [-1,1]){
   const shoulder=mesh(new T.SphereGeometry(.55,12,8),gold,side*.9,2.55,0,root);shoulder.scale.set(1.18,.63,.88);
   mesh(new T.ConeGeometry(.23,.8,6),gold,side*.99,3.04,-.04,root).rotation.z=side*.4;
   mesh(new T.BoxGeometry(.38,.65,.34),obsidian,side*.93,1.64,.06,root);
   mesh(new T.TorusGeometry(.25,.055,5,12),divine,side*.94,1.26,.26,root);
  }
  mesh(new T.TorusGeometry(.55,.09,7,28),gold,0,2.99,0,root).rotation.x=Math.PI/2;
  for(let k=0;k<5;k++){const a=(k-2)*.32;mesh(new T.ConeGeometry(.14,.5,5),gold,Math.sin(a)*.46,3.29,Math.cos(a)*.15,root)}
  // Cloth folds, metal scale-mail, engraved chest ornaments.
  for(let row=0;row<4;row++)for(let col=-3;col<=3;col++){
   const scale=mesh(new T.SphereGeometry(.125,10,8),row%2?gold:obsidian,col*.21,1.68-row*.15,.49,root);
   scale.scale.set(.95,.58,.35);
  }
  for(let i=0;i<5;i++){
   const a=(i-2)*.26;
   const rune=mesh(new T.TorusGeometry(.19+i*.045,.018,5,24),divine,Math.sin(a)*.5,2.21,Math.cos(a)*.13+.69,root);
   rune.rotation.y=a;
  }
  const cape=new T.Mesh(new T.PlaneGeometry(1.75,2.45,8,12),new T.MeshStandardMaterial({color:cfg.clothColor||'#34223d',roughness:.94,side:T.DoubleSide}));
  cape.position.set(0,1.58,-.57);cape.rotation.x=.16;cape.visible=cfg.cape!=='None';root.add(cape);
  const halo=mesh(new T.TorusGeometry(1.12,.055,7,42),divine,0,3.45,0,root);halo.rotation.x=Math.PI/2;
  halo.visible=cfg.helm!=='None';root.userData.godHalo=halo;

  // Preserve authored GLB character proportions while improving material response.
  root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial){m.roughness=Math.max(.3,Math.min(.82,m.roughness??.68));m.metalness=Math.max(0,Math.min(.65,m.metalness??.1));m.envMapIntensity=.65;m.needsUpdate=true}}}
  });
 }
window.GFGodAppearance=sharedAppearance;
})();
