/* GODFORGED Phase 33 — procedural weapon-bound combat effects.
 * Pure Three.js visuals. Existing attacks, damage, abilities, controls and map remain authoritative.
 * Designed for touch/mobile: short-lived geometry, limited effects, no new external dependencies.
 */
(function () {
  'use strict';
  window.GFCombatForge = function (T, scene, heroRoot) {
    const active = [];
    const TAU = Math.PI * 2;
    const profiles = {
      Greatsword: {kind:'blade',span:2.15,width:.48,color:'#b7d7ff',speed:.35},
      'War Axe': {kind:'axe',span:1.85,width:.74,color:'#ffb86b',speed:.44},
      Spear: {kind:'spear',span:1.70,width:.28,color:'#8ceada',speed:.31},
      Staff: {kind:'staff',span:1.3,width:.29,color:'#e4aaff',speed:.37},
      'Dual Blades': {kind:'daggers',span:1.55,width:.27,color:'#ba90ff',speed:.25}
    };
    function mat(color, opacity, additive) {
      return new T.MeshBasicMaterial({color:color,transparent:true,opacity:opacity,
        side:T.DoubleSide,depthWrite:false,blending:additive===false?T.NormalBlending:T.AdditiveBlending});
    }
    function addMesh(parent,geometry,color,opacity,x,y,z) {
      const m=new T.Mesh(geometry,mat(color,opacity)); m.position.set(x||0,y||0,z||0);parent.add(m);return m;
    }
    function segment(parent,a,b,r,color,opacity) {
      const v=new T.Vector3().subVectors(b,a),len=v.length();
      if(len<.001)return null;
      const o=addMesh(parent,new T.CylinderGeometry(r,r,len,6),color,opacity,
        (a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);
      o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
      return o;
    }
    function register(group,duration,opts) {
      const obj={group,duration,life:duration,opts:opts||{},materials:[]};
      group.traverse(function (node) {
        if(node.material){const mats=Array.isArray(node.material)?node.material:[node.material];
          for(const m of mats)if(m.transparent)obj.materials.push({m,opacity:m.opacity});}
      });
      active.push(obj);
      while(active.length>32)remove(active.shift());
      return obj;
    }
    function remove(entry) {
      if(!entry)return;
      entry.group.parent?.remove(entry.group);
      entry.group.traverse(function (o) {
        if(o.geometry)o.geometry.dispose();
        if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m.dispose();}
      });
    }
    function pointFor(profile,step,t) {
      const s=profile.span,dir=step===1?-1:1,k=profile.kind;
      if((k==='blade'||k==='axe')&&step===2)
        return new T.Vector3(.12+Math.sin(t*Math.PI)*.16,3.75-t*2.6,1.45+Math.sin(t*Math.PI)*.95);
      if(k==='spear'&&step===2)
        return new T.Vector3(.46+Math.sin(t*Math.PI)*.12,2.35, .72+t*4.25);
      if(k==='staff'&&step===2)
        return new T.Vector3(.6,2.2+Math.sin(t*Math.PI)*.22,.85+t*4.3);
      if(k==='daggers'&&step===2)
        return new T.Vector3(-1.4+2.8*t,3.25-1.65*t,1.75+Math.sin(t*Math.PI)*.75);
      const swing=dir===1?t:1-t;
      const steep=(k==='spear'?.36:k==='daggers'?.85:.66);
      return new T.Vector3((swing*2-1)*s,2.4+(t-.5)*steep*(step===1?-1:1),
        1.48+Math.sin(t*Math.PI)*(k==='axe'?1.20:.72));
    }
    function ribbon(parent,profile,step,color,widthScale,opacity) {
      const n=28,vertices=[],indices=[],isThrust=(profile.kind==='spear'||profile.kind==='staff')&&step===2;
      const isVertical=step===2&&!isThrust;
      for(let i=0;i<=n;i++){
        const t=i/n,p=pointFor(profile,step,t),fade=.08+.92*Math.pow(Math.sin(Math.PI*t),.6);
        const width=profile.width*widthScale*fade;
        for(const side of [-1,1]){
          vertices.push(p.x+(isVertical||isThrust?side*width:0),
            p.y+(!isVertical&&!isThrust?side*width:0),p.z+(isVertical?side*width*.16:0));
        }
        if(i<n){const q=2*i;indices.push(q,q+1,q+2,q+1,q+3,q+2);}
      }
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const blade=addMesh(parent,geometry,color,opacity,0,0,0);
      blade.userData.combatReveal=true;
      blade.userData.combatTriangles=n*6;
      geometry.setDrawRange(0,0);
    }
    function flashAt(x,z,color,scale) {
      const g=new T.Group();g.position.set(x,2.15,z);scene.add(g);
      addMesh(g,new T.OctahedronGeometry(.24*scale,0),'#ffffff',.95,0,0,0);
      const ring=addMesh(g,new T.TorusGeometry(.48*scale,.07*scale,5,18),color,.84,0,0,0);
      ring.rotation.y=Math.PI/2;
      for(let i=0;i<7;i++){
        const a=TAU*i/7;
        segment(g,new T.Vector3(0,0,0),new T.Vector3(Math.cos(a)*.75*scale,Math.sin(a)*.75*scale,(i%2-.5)*.55),.025,color,.9);
      }
      register(g,.26,{expand:.55});
    }
    function attack(weapon,step,target) {
      const p=profiles[weapon]||profiles.Greatsword, cfg=window.gfGetConfig?.()||{};
      const c=cfg.weaponColor||p.color,g=new T.Group();
      heroRoot.add(g);
      const combo=Math.max(0,Math.min(2,step-1));
      ribbon(g,p,combo,c,1,.83);
      ribbon(g,p,combo,'#fff8ec',.18,.85);
      if(p.kind==='daggers'&&combo!==2){
        const second=new T.Group();second.position.x=-.25;second.position.z=-.18;g.add(second);
        ribbon(second,{...p,span:p.span*.75},1-combo,c,.7,.58);
      }
      if(p.kind==='axe'&&combo===2){
        const dust=addMesh(g,new T.TorusGeometry(1.35,.19,6,26),'#cfa574',.42,.1,.23,2.3);dust.rotation.x=Math.PI/2;
      }
      const first=pointFor(p,combo,0);
      segment(g,new T.Vector3(.8,2.15,.25),first,.035,c,.55);
      if(combo===2){
        const halo=addMesh(g,new T.TorusGeometry(.73,.085,6,28),c,.68,0,2.05,3.3);
        halo.rotation.x=Math.PI/2;
      }
      register(g,p.speed,{reveal:true});
      if(target)flashAt(target.x,target.z,c,combo===2?1.55:1.0);
    }
    function shard(parent,x,y,z,color,size) {
      const obj=addMesh(parent,new T.OctahedronGeometry(size,0),color,.82,x,y,z);
      obj.scale.set(.55,1.55,.55);return obj;
    }
    function ring(parent,r,color,y,z,opacity) {
      const o=addMesh(parent,new T.TorusGeometry(r,.10,6,44),color,opacity||.7,0,y,z);
      o.rotation.x=Math.PI/2;return o;
    }
    function ability(name,worldX,worldZ,yaw,targetX,targetZ) {
      const meta=window.GFRegionalAbilityMeta?.[name];
      if(meta){regionalAbility(name,meta,worldX,worldZ,yaw,targetX,targetZ);return;}
      const g=new T.Group();g.position.set(worldX,0,worldZ);g.rotation.y=yaw;scene.add(g);
      const colors={'Cinder Fan':'#ff6b28','Glacier Breath':'#97e7ff','Dread Howl':'#bd6bff',
        'Storm Lance':'#80cfff','Rift Spear':'#ae79fa','Solar Rail':'#ffe4a2',
        'Grave Circle':'#bb75f5','Forge Turret':'#ffac4c','Verdant Snare':'#85e88d'};
      const color=colors[name]||'#e4c5ff';
      if(name==='Cinder Fan'){
        for(let i=0;i<17;i++){
          const z=2+(i%5)*1.8,x=((i*7)%17-8)*.32*(.35+z/12);
          const f=addMesh(g,new T.ConeGeometry(.19+z*.025,.8+z*.07,6),
            i%3===0?'#ffd077':color,.75,x,.65+((i*3)%4)*.23,z);
          f.rotation.z=(i%2?1:-1)*.27;
        }
        ring(g,3.6,color,.16,5,.45);
      }else if(name==='Glacier Breath'){
        for(let i=0;i<16;i++){
          const z=2+(i%5)*1.9,x=((i*11)%17-8)*.28*(.3+z/12);
          shard(g,x,.8+((i*3)%5)*.25,z,i%3?'#7cdbff':'#ffffff',.23+(i%4)*.085);
        }
        ring(g,4.3,'#b5efff',.14,7,.54);
      }else if(name==='Dread Howl'){
        for(let i=0;i<4;i++){
          const w=addMesh(g,new T.TorusGeometry(1.5+i*.66,.10,6,42),color,.75,0,2.2,2.4+i*2.3);
          w.scale.y=1.25;
        }
        for(let i=0;i<7;i++)shard(g,Math.sin(i*2.4)*3.3,1.4,3+i*.85,'#6d399c',.30);
      }else if(name==='Storm Lance'){
        for(let branch=0;branch<3;branch++){
          let prev=new T.Vector3(branch*.13,2.25,.6);
          for(let i=1;i<=16;i++){
            const z=.6+i*1.15,x=Math.sin(i*3.8+branch*2.7)*(.14+branch*.18);
            const next=new T.Vector3(x,2.25+Math.sin(i*5.1+branch)*(.08+branch*.17),z);
            segment(g,prev,next,branch===0?.13:.055,branch===0?'#e6faff':color,.92);
            prev=next;
          }
        }
      }else if(name==='Rift Spear'){
        const shaft=addMesh(g,new T.CylinderGeometry(.17,.08,15,10),color,.84,0,2.1,9.2);
        shaft.rotation.x=Math.PI/2;
        const tip=addMesh(g,new T.ConeGeometry(.52,2.8,7),'#efd7ff',.85,0,2.1,17.8);
        tip.rotation.x=Math.PI/2;
        for(let i=0;i<12;i++)shard(g,Math.sin(i*2.7)*.7,2.1+Math.cos(i*2.7)*.55,2+i*1.3,color,.14);
      }else if(name==='Solar Rail'){
        const core=addMesh(g,new T.CylinderGeometry(.15,.15,19,9),'#fffaf0',.96,0,2.25,9.5);
        core.rotation.x=Math.PI/2;
        const halo=addMesh(g,new T.CylinderGeometry(.55,.55,19,12),color,.20,0,2.25,9.5);
        halo.rotation.x=Math.PI/2;
        for(let i=1;i<=4;i++){const h=addMesh(g,new T.TorusGeometry(.55,.09,6,24),color,.72,0,2.25,i*4);h.rotation.y=Math.PI/2;}
      }else if(name==='Grave Circle'){
        g.position.set(targetX,0,targetZ);g.rotation.y=0;
        ring(g,5.6,color,.15,0,.85);
        ring(g,4.2,'#7b419b',.18,0,.72);
        for(let i=0;i<14;i++){
          const a=TAU*i/14;
          const s=addMesh(g,new T.ConeGeometry(.35,1.8,5),i%2?'#643684':color,.72,Math.cos(a)*5.15,.95,Math.sin(a)*5.15);
          s.rotation.z=Math.sin(a)*.25;
        }
      }else if(name==='Forge Turret'){
        g.position.set(targetX,0,targetZ);g.rotation.y=0;
        ring(g,2.1,color,.18,0,.9);
        for(let i=0;i<4;i++){
          const a=TAU*i/4;
          const beam=addMesh(g,new T.CylinderGeometry(.10,.23,2,6),'#ffc26d',.75,Math.cos(a)*1.8,1.2,Math.sin(a)*1.8);
          beam.rotation.z=Math.cos(a)*.24;
        }
        shard(g,0,3.2,0,'#fff5c5',.65);
      }else if(name==='Verdant Snare'){
        g.position.set(targetX,0,targetZ);g.rotation.y=0;
        ring(g,5.5,color,.16,0,.75);
        for(let i=0;i<15;i++){
          const a=i*2.4,r=1+(i%5)*.94,x=Math.cos(a)*r,z=Math.sin(a)*r;
          const vine=addMesh(g,new T.ConeGeometry(.16+(i%3)*.08,1.5+(i%4)*.6,5),
            i%3?'#55bd71':'#b7f1a3',.82,x,.8,z);
          vine.rotation.z=Math.sin(a)*.33;
        }
      }else{
        ring(g,3,color,.2,6,.8);
      }
      register(g,name==='Forge Turret'?.95:.78,{expand:name==='Dread Howl'?.35:.13});
    }
    function regionalAbility(name,meta,x,z,yaw,tx,tz){
      const g=new T.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=yaw;
      const palettes={japan:'#f2a1ac',china:'#f5b24d',norse:'#a5deef',greece:'#f9d48c',egypt:'#e6c06a',europe:'#9ebdde'};
      const fire=/fire|flame|inferno|dragon|phoenix|solar|sunbeam/i.test(name),ice=/frost/i.test(name),lightning=/bolt|thunder|zeus|raijin|storm/i.test(name);
      const c=fire?'#ff8b32':ice?'#b4edff':lightning?'#98dfff':palettes[meta.region];
      const flecks=[];
      if(meta.category==='Line'){
        // A readable, full-length strike: bright core, forked electricity or a steel spear.
        if(lightning){for(let b=0;b<3;b++){let prev=new T.Vector3(0,2,.5);for(let i=1;i<=20;i++){const next=new T.Vector3(Math.sin(i*5+b)*(.12+b*.18),2+Math.cos(i*3+b)*.22,i);segment(g,prev,next,b===0?.085:.035,b===0?'#f5fcff':c,.9);prev=next;}}}
        else{const core=addMesh(g,new T.CylinderGeometry(.09,.18,19,10),'#fff6dc',.95,0,2,10);core.rotation.x=Math.PI/2;const tip=addMesh(g,new T.ConeGeometry(.45,1.7,8),c,.95,0,2,19);tip.rotation.x=Math.PI/2;}
        for(let i=0;i<20;i++){const m=shard(g,Math.sin(i*7)*.65,2+Math.cos(i*4)*.4,i,c,.1);flecks.push(m);}
      }else if(meta.category==='Cone'){
        // Layered forward sweeps and airborne embers/crystals occupy the actual damage cone.
        for(let i=0;i<3;i++){const arc=addMesh(g,new T.TorusGeometry(4+i*3,.08+i*.025,6,36,1.2),c,.7,0,.6+i*.5,0);arc.rotation.set(Math.PI/2,0,Math.PI/2-.6);}
        for(let i=0;i<48;i++){const d=1+(i%12)*.85,side=Math.sin(i*9)*d*.58;const m=ice?shard(g,side,.4+(i%4)*.45,d,c,.17):addMesh(g,new T.SphereGeometry(.09+(i%3)*.06,6,5),i%3?c:'#fff3ce',.85,side,.3+(i%5)*.38,d);if(fire)m.scale.y=3;flecks.push(m);}
      }else{
        g.position.set(tx,0,tz);g.rotation.y=0;
        ring(g,5.85,c,.18,0,.7);ring(g,5.3,c,.2,0,.35);
        for(let i=0;i<12;i++){const a=i*TAU/12;const m=shard(g,Math.cos(a)*5,.7,Math.sin(a)*5,c,.3);flecks.push(m);}
        const core=addMesh(g,new T.OctahedronGeometry(.65,1),c,.9,0,2.4,0);flecks.push(core);
        for(let i=0;i<24;i++){const a=i*2.4,r=1+i%5;flecks.push(addMesh(g,new T.SphereGeometry(.07,5,4),c,.8,Math.sin(a)*r,.3+(i%6)*.35,Math.cos(a)*r));}
      }
      const e=register(g,meta.category==='Placement'?1.6:.65,{expand:0});e.opts.flecks=flecks;
    }
    function utility(name,x,z,yaw) {
      const g=new T.Group();g.position.set(x,0,z);g.rotation.y=yaw;scene.add(g);
      let c='#a8c8ff';
      if(name==='Heal'){c='#88ffc2';for(let i=0;i<9;i++)shard(g,Math.cos(i*2.4)*1.3,1+(i%4)*.55,Math.sin(i*2.4)*1.3,c,.22);}
      else if(name==='Shield'){c='#78c9ff';for(let i=0;i<3;i++){const halo=addMesh(g,new T.TorusGeometry(1.6+i*.22,.075,6,40),c,.68,0,1.3+i*.55,0);halo.rotation.x=Math.PI/2;}}
      else if(name==='Stun'){c='#e5c4ff';ring(g,5.4,c,.16,0,.8);}
      else if(name==='Veilwalk'){c='#a36dea';for(let i=0;i<11;i++)shard(g,Math.sin(i*2.4)*1.1,1.2+(i%4)*.7,Math.cos(i*2.4)*1.1,c,.26);}
      else if(name==='Sky Leap'){c='#d9edff';ring(g,3.8,c,.18,0,.86);for(let i=0;i<6;i++)shard(g,Math.cos(i)*2,.8,Math.sin(i)*2,c,.26);}
      else {c='#b3eaff';for(let i=0;i<5;i++){const t=i/4;shard(g,Math.sin(i*2.3)*.3,1.4, -t*4.5,c,.24);}}
      register(g,.55,{expand:name==='Stun'?.75:.16});
    }
    function tick(dt) {
      for(let i=active.length-1;i>=0;i--){
        const e=active[i];e.life-=dt;
        const p=Math.min(1,Math.max(0,1-e.life/e.duration));
        const opacity=p<.58?1:Math.max(0,(1-p)/.42);
        for(const m of e.materials)m.m.opacity=m.opacity*opacity;
        if(e.opts.flecks)for(const n of e.opts.flecks){n.position.y+=dt*.7;n.rotation.y+=dt*2;}
        if(e.opts.reveal){
          e.group.traverse(function (n) {
            if(n.userData.combatReveal)n.geometry.setDrawRange(0,Math.min(n.userData.combatTriangles,
              Math.max(6,Math.floor(Math.min(1,p*1.9)*28)*6)));
          });
        }
        if(e.opts.expand)e.group.scale.setScalar(1+p*e.opts.expand);
        if(e.life<=0){remove(e);active.splice(i,1);}
      }
    }
    return {attack,ability,utility,tick};
  };
})();
