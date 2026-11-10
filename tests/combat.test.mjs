import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const T=await import(pathToFileURL(process.argv[2]).href),root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('phase21.js',root),'utf8');
const catalog=fs.readFileSync(new URL('regional-abilities.js',root),'utf8').split('(function(){')[0];
const ctx={window:{},performance:{now:()=>1000},console};vm.createContext(ctx);vm.runInContext(catalog,ctx);
const W=ctx.window;assert.equal(Object.keys(W.GFRegionalAbilityMeta).length,54);
vm.runInContext(fs.readFileSync(new URL('combat-overhaul.js',root),'utf8'),ctx);
let total=0;
for(const [region,groups] of Object.entries(W.GFRegionalAbilities))for(let slot=0;slot<3;slot++)for(const [name,description] of groups[slot]){
 assert(name.length>3&&description.length>10);const meta=W.GFRegionalAbilityMeta[name];assert.equal(meta.category,['Cone','Line','Placement'][slot]);
 const scene=new T.Scene(),forge=W.GFCombatForge(T,scene,new T.Group());forge.ability(name,0,0,0,0,13);assert(scene.children.length>0);let n=0;scene.traverse(o=>{if(o.geometry){n++;for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));}});assert(n>5);forge.tick(2);assert.equal(scene.children.length,0);
 const victim=()=>({alive:true,friendly:false,x:0,z:8,hp:500,root:{visible:true}}),enemy=victim(),ally={...victim(),friendly:true},miss={...victim(),x:30};
 const config={heritage:region,['ability'+(slot+1)]:name};Object.assign(ctx,{active:true,matchEnded:false,leap:null,hp:350,shopPanel:null,position:{x:0,z:0},yaw:0,powerBonus:0,recallUntil:0,attackTime:0,weaponAttackAge:0,mobs:[enemy,ally,miss],bots:[],baseStructures:[],demonDogs:[],combatForge:forge,finishMob:()=>{},$:()=>({}),gold:0,kills:0,damageDemonDog:()=>{}});W.gfGetConfig=()=>config;
 vm.runInContext('{'+source.slice(source.indexOf(' let abilityReady='),source.indexOf(' function frame(time)'))+'cast('+slot+');cast('+slot+');}',ctx);
 assert.equal(enemy.hp,500-meta.damage,name+' must damage once and respect cooldown');assert.equal(ally.hp,500);assert.equal(miss.hp,500);total++;
}
// Verify each end-road joins all lane centers without movement collision, including bridge edges.
const lane=source.slice(source.indexOf(' function laneX('),source.indexOf(' // Phase 27:'));
const collision=source.slice(source.indexOf(' function collision('),source.indexOf('\n',source.indexOf(' function collision(')));
Object.assign(ctx,{buffs:[],demonDogs:[]});vm.runInContext(lane+collision,ctx);
for(const z of [24,620])for(let x=-105;x<=105;x+=.5)assert.equal(ctx.collision(x,z),false);
console.log('PASS: '+total+' abilities, finite effect geometry and cleanup, correct damage, cooldowns, friendly-fire exclusion, misses, and both connected base paths.');
