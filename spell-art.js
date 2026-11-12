/* Authored silhouettes and animation for every regional spell. */
window.GFSpellDesigns={
'Crimson Sakura':['petal','#ed648e'], 'Petal Cyclone':['cyclone','#efb8dd'], "Oni's Roar":['mask','#d9544d'], 'Raijin Bolt':['lightning','#8cdfff'], 'Moonlit Draw':['crescent','#c6c3ff'], 'Yari Tempest':['spear','#ded9f2'], 'Shrine Seal':['gate','#f1c487'], 'Foxfire Ward':['fox','#7cd4eb'], "Shogun's Standard":['banner','#bd4550'],
'Dragon Breath':['dragon','#f76c30'], 'Jade Fan':['fan','#75dba9'], "Lion's Cry":['mask','#e3b14e'], 'Heavenly Jian':['sword','#b1f7d4'], 'Thunder Qiang':['spear','#9bddff'], 'Phoenix Flight':['bird','#ff8840'], 'Imperial Ward':['gate','#64c59c'], 'Lotus Inferno':['lotus','#f48b9b'], 'Stone Sentinel':['statue','#aebca7'],
'Frost Jarl':['ice','#a5e9fa'], 'Berserker Howl':['mask','#d48b6b'], 'Raven Swarm':['bird','#8f87ce'], 'Thunder Hammer':['hammer','#91ccff'], 'Runic Spear':['spear','#83dfd5'], 'World Serpent':['serpent','#79b793'], 'Frost Rune':['ice','#d0f7ff'], 'Valkyrie Circle':['spear','#e5c8f3'], 'Storm Totem':['totem','#8eb5ff'],
'Aegis Burst':['shield','#f6ca69'], 'Gorgon Gaze':['mask','#82c499'], 'Olympian Flame':['flame','#ffd47c'], "Zeus's Lance":['lightning','#d1e7ff'], 'Apollo Ray':['beam','#fff3ab'], "Athena's Spear":['spear','#eeddaa'], 'Oracle Sigil':['eye','#bcb3f1'], 'Hades Rift':['rift','#be6aeb'], 'Temple Guardian':['statue','#e8dbb6'],
'Sandstorm':['sand','#d9b06e'], "Anubis's Judgment":['jackal','#9c86c1'], 'Scarab Tide':['scarab','#6fd5bd'], "Ra's Sunbeam":['sun','#fff29e'], 'Horus Talon':['bird','#a0e2ef'], 'Serpent Fang':['serpent','#add46a'], 'Tomb Trap':['tomb','#c3a76c'], 'Solar Obelisk':['obelisk','#ffdc8d'], "Nile's Grasp":['water','#56cde3'],
'Dragonfire':['dragon','#e94d27'], "Knight's Challenge":['shield','#b2d2ef'], 'Griffin Gale':['bird','#d8e3f3'], 'Excalibur Wave':['sword','#a2c3ff'], 'Lance of Dawn':['spear','#f7c993'], 'Crossbow Volley':['bolt','#d2ba8d'], 'Castle Ward':['castle','#b9bfd3'], 'Witchfire Circle':['flame','#9be6a0'], 'Royal Standard':['banner','#8d9ce7']};
window.GFUltimates={japan:{name:'Wrath of Raijin',motif:'lightning',color:'#c3eaff'},china:{name:'Celestial Dragon',motif:'dragon',color:'#ffb75b'},norse:{name:'Ragnarok',motif:'ice',color:'#a8e5ff'},greece:{name:'Olympian Judgment',motif:'lightning',color:'#ffe8a2'},egypt:{name:'Eclipse of Ra',motif:'sun',color:'#ffce75'},europe:{name:'Excalibur Ascendant',motif:'sword',color:'#bfd9ff'}};
for(const [region,u] of Object.entries(window.GFUltimates)){u.damage=185;u.cooldown=90000;u.radius=12;window.GFSpellDesigns[u.name]=[u.motif,u.color];window.GFRegionalAbilityMeta[u.name]={region,category:'Placement',ultimate:true,damage:u.damage,cooldown:u.cooldown};}
window.GFSpellArt=function(T,scene,name,meta,x,z,yaw,tx,tz){
 const design=window.GFSpellDesigns[name];if(!design)return null;const [motif,color]=design;
 const g=new T.Group();g.name='spell-'+name;g.position.set(meta.category==='Placement'?tx:x,window.GFWorldRules?.surfaceHeight(meta.category==='Placement'?tx:x,meta.category==='Placement'?tz:z)||0,meta.category==='Placement'?tz:z);g.rotation.y=meta.category==='Placement'?0:yaw;scene.add(g);
 const moving=[],flaps=[];let seed=[...name].reduce((a,c)=>a+c.charCodeAt(0),0);
 const mesh=(geo,c=color,px=0,py=0,pz=0,parent=g)=>{const m=new T.Mesh(geo,new T.MeshBasicMaterial({color:c,transparent:true,opacity:.82,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));m.position.set(px,py,pz);parent.add(m);return m;};
 const orb=(px,py,pz,sx,sy,sz,p=g,c=color)=>{const m=mesh(new T.SphereGeometry(1,10,7),c,px,py,pz,p);m.scale.set(sx,sy,sz);return m;};
 const box=(px,py,pz,w,h,d,p=g)=>mesh(new T.BoxGeometry(w,h,d),color,px,py,pz,p);
 const ring=(r,px,py,pz,p=g)=>{const m=mesh(new T.TorusGeometry(r,.045,5,36),color,px,py,pz,p);m.rotation.x=Math.PI/2;return m;};
 function model(kind,px,py,pz,scale=1){const p=new T.Group();p.position.set(px,py,pz);p.scale.setScalar(scale);g.add(p);
  if(['bird','scarab','fox','dragon','jackal','mask'].includes(kind)){
   orb(0,0,0,.3,.34,.65,p);orb(0,.2,.65,.27,.28,.29,p);
   if(kind==='fox'||kind==='jackal')for(const s of [-1,1])mesh(new T.ConeGeometry(.13,.52,6),color,s*.2,.65,.55,p);
   if(kind==='dragon'){for(let j=0;j<7;j++){const flame=orb(Math.sin(j*2)*.2,.1,1+j*.4,.18+j*.025,.25,.6,p,'#ffd18b');flame.rotation.x=.2;}for(let i=0;i<8;i++)orb(Math.sin(i*.7)*.4,-i*.06,-i*.43,.32-i*.025,.28,.33,p);for(const s of [-1,1])mesh(new T.ConeGeometry(.12,.6,6),color,s*.2,.55,.6,p);}
   if(kind==='mask'||kind==='jackal')orb(0,.1,.88,.18,.18,.3,p);
   if(kind==='bird'||kind==='scarab'||kind==='dragon'){for(const side of [-1,1]){const wing=mesh(new T.ConeGeometry(.6,1.5,3),color,side*.7,.12,-.1,p);wing.rotation.z=side*Math.PI/2;wing.scale.z=.1;flaps.push({wing,side});}}
   if(kind==='fox'){const tail=orb(0,0,-1,.25,.35,.7,p);tail.rotation.x=.6;}
  }else if(['spear','sword','bolt','hammer'].includes(kind)){
   const shaft=box(0,0,0,.1,.1,2,p);mesh(new T.ConeGeometry(.25,.7,4),color,0,0,1.25,p).rotation.x=Math.PI/2;
   if(kind==='sword')box(0,0,-.55,.8,.12,.12,p);if(kind==='hammer')box(0,0,1,.95,.65,.45,p);if(kind==='bolt')for(const s of [-1,1])box(s*.18,0,-.8,.28,.04,.4,p);
  }else if(kind==='lightning'){
   const points=[];for(let i=0;i<14;i++)points.push(new T.Vector3(Math.sin(i*7+seed)*.35,0,i*.7));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.08,5,false),color,0,0,0,p);
  }else if(kind==='serpent'){
   const points=[];for(let i=0;i<16;i++)points.push(new T.Vector3(Math.sin(i*.6)*.8,Math.cos(i*.5)*.2,i*.45));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),40,.2,8,false),color,0,0,0,p);orb(Math.sin(9)*.8,0,7,.35,.28,.5,p);
  }else if(['statue','totem','obelisk','tomb','castle','gate','banner'].includes(kind)){
   box(0,-.5,0,2,.5,1.8,p);
   if(kind==='banner'){box(0,1,0,.12,4,.12,p);const flag=box(.7,1.8,0,1.4,1.5,.06,p);flaps.push({wing:flag,side:1});}
   else if(kind==='statue'){box(0,1,0,1,2,.6,p);orb(0,2.5,0,.45,.5,.4,p);for(const s of [-1,1])box(s*.8,1,0,.25,1.7,.3,p);}
   else if(kind==='gate'){for(const s of [-1,1])box(s*1.4,1,0,.3,3,.3,p);box(0,2.5,0,3.4,.4,.5,p);}
   else if(kind==='castle'){for(const s of [-1,0,1]){box(s*.8,.7,0,.6,2,.8,p);box(s*.8,1.8,0,.75,.35,1,p);}}
   else{box(0,1,0,kind==='tomb'?2:.7,kind==='tomb'?1:3,1,p);mesh(new T.ConeGeometry(.6,.9,4),color,0,2.9,0,p);}
  }else if(kind==='shield'){const m=mesh(new T.CylinderGeometry(1,1,.12,24),color,0,0,0,p);m.rotation.x=Math.PI/2;ring(.8,0,0,.1,p).rotation.x=0;}
  else if(kind==='sun'||kind==='eye'){const m=mesh(new T.TorusGeometry(.8,.12,6,36),color,0,0,0,p);if(kind==='eye')m.scale.y=.5;orb(0,0,0,.22,.22,.22,p);for(let i=0;i<12;i++){const a=i*Math.PI/6;const ray=box(Math.sin(a)*1.1,Math.cos(a)*1.1,0,.09,.35,.05,p);ray.rotation.z=-a;}}
  else if(kind==='lotus'||kind==='petal'){for(let i=0;i<(kind==='petal'?1:9);i++){const a=i*Math.PI*2/9;const petal=orb(Math.sin(a)*.5,0,Math.cos(a)*.5,.22,.04,.7,p);petal.rotation.y=a;petal.rotation.x=.35;}}
  else if(kind==='crescent'||kind==='fan'){const arc=mesh(new T.TorusGeometry(1,.12,5,30,kind==='fan'?2.5:Math.PI),color,0,0,0,p);if(kind==='fan')for(let i=0;i<7;i++){const a=i/6*2.5;const spoke=box(Math.sin(a)*.5,Math.cos(a)*.5,0,.03,1,.03,p);spoke.rotation.z=-a;}}
  else if(kind==='ice'){const m=mesh(new T.ConeGeometry(.4,2,5),color,0,.5,0,p);m.rotation.z=.2;}
  else if(kind==='beam'){mesh(new T.CylinderGeometry(.12,.3,18,12),color,0,0,8,p).rotation.x=Math.PI/2;}
  else if(kind==='water'||kind==='cyclone'||kind==='rift'){for(let i=0;i<5;i++){const h=ring(1+i*.25,0,i*.3,0,p);h.rotation.z=kind==='rift'?.7:0;}}
  else {const m=orb(0,0,0,.3,kind==='sand'?.25:1,.3,p);m.rotation.z=.25;}
  return p;
 }
 if(meta.category==='Placement'){
  ring(5.85,0,.2,0);ring(4.7,0,.23,0);const count=['spear','ice','flame','fox','water'].includes(motif)?8:1;
  for(let i=0;i<count;i++){const a=i*Math.PI*2/count;const p=model(motif,count===1?0:Math.sin(a)*4,1,count===1?0:Math.cos(a)*4,count===1?1.6:1);moving.push({p,base:p.position.clone(),kind:'rise',phase:i});}
 }else if(meta.category==='Line'){
  const count=['bolt','bird'].includes(motif)?3:1;for(let i=0;i<count;i++){const p=model(motif,(i-(count-1)/2)*.65,2,1,1);moving.push({p,base:p.position.clone(),kind:'fly',phase:i});}
 }else{
  const count=['petal','sand','flame','ice','bird','scarab'].includes(motif)?18:motif==='cyclone'?5:3;
  for(let i=0;i<count;i++){const d=2+(i%6)*1.5,px=Math.sin(i*2.4+seed)*d*.55;const p=model(motif,px,.8+(i%3)*.55,d,count>6?.5:1.3);moving.push({p,base:p.position.clone(),kind:'cone',phase:i});}
 }
 if(/thunder|runic/i.test(name)&&motif==='spear')model('lightning',0,2,1,.6);
 if(meta.ultimate){g.scale.setScalar(2);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const strike=model(motif,Math.sin(a)*4,motif==='lightning'?12:3,Math.cos(a)*4,1.2);if(motif==='lightning')strike.rotation.x=Math.PI/2;moving.push({p:strike,base:strike.position.clone(),kind:'ultimate',phase:i});}}
 const finish=window.gfGetConfig?.().spellFinish||'original';const accents=[];
 if(finish!=='original'){const accent=finish==='gilded'?'#ffe096':'#c6b2ff';for(let i=0;i<12;i++){const a=i*Math.PI/6,r=meta.category==='Placement'?5:2;const m=mesh(finish==='gilded'?new T.OctahedronGeometry(.13):new T.SphereGeometry(.1,6,5),accent,Math.sin(a)*r,.6,Math.cos(a)*r+(meta.category==='Placement'?0:5));accents.push({m,a,r});}}
 const duration=meta.ultimate?3:meta.category==='Placement'?2.4:1.1;
 return {group:g,duration,animate(p,dt){for(const {m,a,r} of accents){m.position.x=Math.sin(a+p*4)*r;m.position.y=.6+Math.sin(p*5+a)*.4;m.rotation.y+=dt*4;}for(const o of moving){if(o.kind==='ultimate'){o.p.position.y=o.base.y+Math.max(0,1-p*4)*5;o.p.rotation.y+=dt*.5;}else if(o.kind==='fly')o.p.position.z=o.base.z+p*15;else if(o.kind==='rise'){o.p.position.y=o.base.y+Math.sin(Math.min(1,p*4)*Math.PI/2)*.8;o.p.rotation.y+=dt*.35;}else{o.p.position.z=o.base.z+p*2;o.p.position.y=o.base.y+Math.sin(p*6+o.phase)*.3;o.p.rotation.y+=dt*(motif==='cyclone'?7:1.2);}}for(const f of flaps)f.wing.rotation.x=Math.sin(p*22)*.6*f.side;}};
};
