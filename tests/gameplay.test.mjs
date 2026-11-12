// Run with a local Three.js r170 module: node tests/gameplay.test.mjs /path/to/three.mjs
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import crypto from 'node:crypto';
const Three=await import(pathToFileURL(process.argv[2]).href),root=new URL('../',import.meta.url),read=n=>fs.readFileSync(new URL(n,root),'utf8');
let now=1000;const elements=new Map(),noop=()=>{};
const drawing=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
class Element{constructor(){this.style={};this.dataset={};this.children=[];this.hidden=true;this.classList={add:noop,remove:noop,contains:()=>false};this.width=105;this.height=105;this.clientWidth=900;this.clientHeight=600;}append(...e){this.children.push(...e)}appendChild(e){this.append(e)}insertBefore(e){this.append(e)}addEventListener(k,f){(this.listeners??={})[k]=f}setPointerCapture(){}setAttribute(){}querySelector(s){return get(s)}querySelectorAll(){return []}getContext(){return drawing}remove(){} }
function get(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id)}
class Renderer{setPixelRatio(r){this.r=r}getPixelRatio(){return this.r}setSize(){}render(){} }
const T={...Three,WebGLRenderer:Renderer,TextureLoader:class{load(){return new Three.Texture()}}};
const ctx={console,TEST_THREE:T,performance:{now:()=>now},document:{hidden:false,createElement:()=>new Element(),getElementById:get,querySelectorAll:()=>[]},MutationObserver:class{observe(){}},requestAnimationFrame:noop,devicePixelRatio:1,Event:class{},setTimeout,clearTimeout};ctx.window=ctx;ctx.addEventListener=noop;vm.createContext(ctx);
vm.runInContext(read('heritage.js').split('(function(){')[0],ctx);vm.runInContext(read('god-appearance.js'),ctx);vm.runInContext(read('world-enhancements.js'),ctx);vm.runInContext(read('regional-abilities.js').split('(function(){')[0],ctx);vm.runInContext(read('combat-overhaul.js'),ctx);
let config=ctx.GFNormalizeHeritage({heritage:'japan',sex:'Male',body:'Athletic',ability4:'Sky Leap'});ctx.gfGetConfig=()=>config;ctx.gf21Joy=()=>({x:0,y:0});
const signatures=new Set();let variants=0;
for(const [region,h] of Object.entries(ctx.GFHeritages))for(const helmet of h.helmets){
 const c=ctx.GFNormalizeHeritage({heritage:region,heritageHeadgear:helmet[0],helmetColor:'#123456',helmetFaceColor:'#654321',helmetCrestColor:'#dabcfe'}),g=ctx.GFBuildHeritageHelmet(T,c),colors=new Set(),hash=crypto.createHash('sha256');
 g.traverse(o=>{if(o.geometry){for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));hash.update(JSON.stringify(o.position));colors.add(o.material.color.getHexString());}});
 for(const color of ['123456','654321','dabcfe'])assert(colors.has(color),helmet[0]+' missing recolorable part');signatures.add(hash.digest('hex'));ctx.GFDisposeFigure(g);variants++;
}
assert.equal(variants,18);assert.equal(signatures.size,18);
// Every heritage keeps independently articulated limbs after mesh batching.
for(const heritage of Object.keys(ctx.GFHeritages)){
 const figure=new T.Group();ctx.GFGodAppearance(figure,T,null,null,{config:ctx.GFNormalizeHeritage({heritage}),weapon:true});
 const rig=figure.userData.rig;assert(rig[-1].leg!==rig[1].leg);assert.equal(rig[1].hand.parent,rig[1].elbow);
 const before=new T.Vector3();figure.updateMatrixWorld(true);rig[1].hand.getWorldPosition(before);
 for(let i=0;i<12;i++)ctx.GFAnimateFigure(figure,.016,{moving:1});
 assert(rig[-1].leg.rotation.x*rig[1].leg.rotation.x<0,'legs must alternate');
 assert(rig[-1].arm.rotation.x*rig[-1].leg.rotation.x<0,'arm counters its leg');
 for(let i=0;i<12;i++)ctx.GFAnimateFigure(figure,.016,{attack:.5});
 figure.updateMatrixWorld(true);assert(before.distanceTo(rig[1].hand.getWorldPosition(new T.Vector3()))>.2,'attack must move hand');
 assert(rig[1].hand.children.some(o=>o.name.startsWith('heritage-weapon')),'weapon follows hand');
 for(let i=0;i<80;i++)ctx.GFAnimateFigure(figure,.016,{});
 assert(Math.abs(rig[1].leg.rotation.x)<.001,'idle restores legs');ctx.GFDisposeFigure(figure);
}
const rules=ctx.GFWorldRules;assert.equal(rules.bridges.length,7);for(const b of rules.bridges){assert.equal(rules.bridgeHeight(0),rules.bridgeHeight(1));assert(rules.surfaceHeight(b.x,b.z)>1.7);}
assert.equal(rules.surfaceHeight(0,-48),4.32);assert.equal(rules.surfaceHeight(0,692),4.32);for(let z=-34;z<-18;z++)assert(rules.surfaceHeight(0,z)>=rules.surfaceHeight(0,z+1));
const from={x:0,z:10},to={x:0,z:26};assert.equal(rules.leapPoint(from,to,0).y,0);assert.equal(rules.leapPoint(from,to,1).y,0);assert.equal(rules.leapPoint(from,to,.5).y,4.4);
let source=read('phase21.js').replace("await import('https://esm.sh/three@0.170.0')",'TEST_THREE');
source=source.replace(' return {getGod,fitGLB,applyStyle};',`return {laneApproach,inSanctuary,init,resetMatch,hit,cast,utility,frame,receiveDamage,updateBattleSystems,tickLeap,collision,updateDemonDogs,endIfTitanDestroyed,spawnWave,get state(){return {hp,maxHp,respawnAt,position,yaw,camera,jumpHeight,leap,mobs,bots,demonDogs,baseStructures,scene,matchEnded,active,matchElapsed}},setPosition(x,z){position={x,z}},setActive(){active=true},clearCooldown(){abilityReady=[0,0,0];utilityCooldown=0;attackReadyAt=0},setRecall(){recallUntil=now+4500},get recall(){return recallUntil}};`);
// No exported test hooks in shipped source: this instrumentation exists only in this VM.
vm.runInContext(source+'\nthis.qa=GF21;',ctx);await ctx.qa.init();let state=ctx.qa.state;
assert(state.scene&&state.mobs.length===18,'full scene must initialize');assert.equal(state.demonDogs.length,24);assert(state.demonDogs.every(d=>d.hp>=540&&d.damage<=20));
// Base zoning and every lane's final approach must agree with gameplay coordinates.
assert.equal(state.position.z,-48);assert(ctx.qa.inSanctuary(state.position.x,state.position.z,true));
for(const boss of state.baseStructures){
 const towers=state.mobs.filter(m=>m.kind==='tower'&&m.friendly===boss.friendly);
 assert(Math.min(...towers.map(t=>Math.abs(t.z-boss.z)))>=77);
 for(let lane=-1;lane<=1;lane++)assert(Math.abs(ctx.qa.laneApproach(lane,boss.z,!boss.friendly)-boss.x)<.01);
 for(const t of towers)assert(!ctx.qa.collision(t.x,t.z));
 const spawnZ=boss.friendly?-48:692;assert.equal(Math.abs(spawnZ-boss.z),46);
 assert(!ctx.qa.collision(boss.x,boss.z));assert(!ctx.qa.collision(0,spawnZ));
}
ctx.qa.spawnWave();const spawned=ctx.qa.state.mobs.filter(m=>m.kind!=='tower');assert.equal(spawned.length,36);assert(spawned.every(m=>m.root.scale.x<=.52),'minions must be much smaller than gods');assert.equal(new Set(spawned.map(m=>`${m.x},${m.z}`)).size,36);ctx.qa.resetMatch();
ctx.qa.setActive();ctx.qa.setPosition(0,24);ctx.qa.utility();assert(ctx.qa.state.leap);ctx.qa.tickLeap(.475);assert(ctx.qa.state.jumpHeight>4);ctx.qa.tickLeap(.475);assert.equal(ctx.qa.state.jumpHeight,0);assert.equal(ctx.qa.state.position.z,40);
ctx.qa.receiveDamage(1000,now);assert.equal(ctx.qa.state.hp,0);assert.equal(ctx.qa.state.respawnAt,8000);now=2000;ctx.qa.updateBattleSystems(.016,now);assert.equal(ctx.qa.state.hp,0,'death must not instantly respawn');now=8100;ctx.qa.updateBattleSystems(.016,now);assert(ctx.qa.state.hp>0);assert.equal(ctx.qa.state.position.z,-48);
// Basic attack spam must not multiply damage within the swing interval.
const tower=ctx.qa.state.mobs.find(m=>!m.friendly);ctx.qa.setPosition(tower.x,tower.z-4);ctx.qa.clearCooldown();ctx.qa.hit();const hpAfter=tower.hp;ctx.qa.hit();assert.equal(tower.hp,hpAfter);assert(hpAfter<tower.max);
ctx.qa.resetMatch();assert.equal(ctx.qa.state.hp,350);assert.equal(ctx.qa.state.mobs.length,18);assert(ctx.qa.state.mobs.every(m=>m.hp===m.max));
for(const z of [24,54,74,570,590,620])for(let x=-105;x<=105;x+=1)assert(!ctx.qa.collision(x,z));assert(ctx.qa.collision(120,24));
// Both win and lose states must stop combat; a new match restores the core and controls.
const core=ctx.qa.state.baseStructures.find(t=>!t.friendly);core.hp=0;ctx.qa.endIfTitanDestroyed(core);assert(ctx.qa.state.matchEnded);assert(!ctx.qa.state.active);ctx.qa.resetMatch();assert(!ctx.qa.state.matchEnded);assert(ctx.qa.state.active);assert(ctx.qa.state.baseStructures.every(t=>t.alive&&t.hp===2600));
// Verify actual movement projected through the battle camera, then pointer dragging.
ctx.qa.setPosition(0,24);now+=16;ctx.qa.frame(now);
for(const direction of [-1,1]){
 const before=ctx.qa.state.position.x;ctx.gf21Joy=()=>({x:direction,y:0});now+=16;ctx.qa.frame(now);
 const {camera,position}=ctx.qa.state;camera.updateMatrixWorld();
 const oldPoint=new Three.Vector3(before,0,position.z).project(camera),newPoint=new Three.Vector3(position.x,0,position.z).project(camera);
 assert.equal(Math.sign(newPoint.x-oldPoint.x),direction,'stick must move in its screen direction');
}
ctx.gf21Joy=()=>({x:0,y:0});
const battleCanvas=get('battle').children.find(e=>e.id==='gf21Battle');
for(const direction of [-1,1]){const before=ctx.qa.state.yaw;battleCanvas.listeners.pointerdown({pointerId:7,clientX:100,clientY:100});battleCanvas.listeners.pointermove({pointerId:7,clientX:100+direction*30,clientY:100});assert.equal(Math.sign(ctx.qa.state.yaw-before),-direction);battleCanvas.listeners.lostpointercapture();const stopped=ctx.qa.state.yaw;battleCanvas.listeners.pointermove({pointerId:7,clientX:300,clientY:100});assert.equal(ctx.qa.state.yaw,stopped);}

// Exercise actual simulation and render pipeline with all terrain/actors present.
for(let i=0;i<80;i++){now+=16;ctx.qa.frame(now)}ctx.qa.spawnWave();for(let i=0;i<80;i++){now+=16;ctx.qa.frame(now)}
let meshes=0;ctx.qa.state.scene.traverse(o=>{if(o.isMesh){meshes++;assert(Number.isFinite(o.position.y));}});
console.log(`PASS: ${variants} unique three-color helmets; full scene (${meshes} meshes), 24 stronger dogs, arched surface heights, leap trajectory, death timer, attack cooldown, win/restart screen-relative controls, pointer release, spaced base zones and converging lanes, and simulation frames.`);
