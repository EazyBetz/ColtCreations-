// Run with a local Three.js r170 module: node tests/gameplay.test.mjs /path/to/three.mjs
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import crypto from 'node:crypto';
const Three=await import(pathToFileURL(process.argv[2]).href),root=new URL('../',import.meta.url),read=n=>fs.readFileSync(new URL(n,root),'utf8');
let now=1000;
async function peer(){
const elements=new Map(),noop=()=>{};
const drawing=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
class Element{constructor(){this.style={};this.dataset={};this.children=[];this.hidden=true;this.classList={add:noop,remove:noop,contains:()=>false};this.width=105;this.height=105;this.clientWidth=900;this.clientHeight=600;}append(...e){this.children.push(...e)}appendChild(e){this.append(e)}insertBefore(e){this.append(e)}addEventListener(k,f){(this.listeners??={})[k]=f}setPointerCapture(){}setAttribute(){}querySelector(s){return get(s)}querySelectorAll(){return []}getContext(){return drawing}remove(){} }
function get(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id)}
class Renderer{setPixelRatio(r){this.r=r}getPixelRatio(){return this.r}setSize(){}render(){} }
const T={...Three,WebGLRenderer:Renderer,TextureLoader:class{load(){return new Three.Texture()}}};
const ctx={console,TEST_THREE:T,performance:{now:()=>now},document:{hidden:false,createElement:()=>new Element(),getElementById:get,querySelectorAll:()=>[]},MutationObserver:class{observe(){}},requestAnimationFrame:noop,devicePixelRatio:1,Event:class{},setTimeout,clearTimeout};ctx.window=ctx;ctx.addEventListener=noop;vm.createContext(ctx);
vm.runInContext(read('heritage.js').split('(function(){')[0],ctx);vm.runInContext(read('god-appearance.js'),ctx);vm.runInContext(read('world-enhancements.js'),ctx);vm.runInContext(read('regional-abilities.js').split('(function(){')[0],ctx);vm.runInContext(read('combat-overhaul.js'),ctx);
let config=ctx.GFNormalizeHeritage({heritage:'japan',sex:'Male',body:'Athletic',ability4:'Sky Leap'});ctx.gfGetConfig=()=>config;ctx.gf21Joy=()=>({x:0,y:0});

const source=read('phase21.js').replace("await import('https://esm.sh/three@0.170.0')",'TEST_THREE').replace(' return {getGod,fitGLB,applyStyle};','return {init,frame,setPosition(x,z){position={x,z}},get state(){return {position,hp,mobs,bots,baseStructures}}};');
vm.runInContext(source+'\nthis.qa=GF21;',ctx);await ctx.qa.init();return ctx;
}
const host=await peer(),guest=await peer();
const packets=[];host.GFOnline={host:true,send:p=>{packets.push(p);guest.GFCoop.receive(p)}};guest.GFOnline={host:false,send:p=>host.GFCoop.receive(p)};
await host.GFCoop.start(true);await guest.GFCoop.start(false);
const remote=host.qa.state.bots.find(b=>b.human);assert(remote);const initial=remote.z;
guest.gf21Joy=()=>({x:0,y:1});
for(let i=0;i<45;i++){now+=16;guest.qa.frame(now);host.qa.frame(now)}
assert(remote.z>initial+4,'guest input must move the host-authoritative player');assert(Math.abs(guest.qa.state.position.z-remote.z)<2,'guest must receive shared positions');
assert(packets.some(p=>p.type==='world'));
const tower=host.qa.state.mobs.find(m=>!m.friendly);remote.x=tower.x;remote.z=tower.z-4;
host.GFCoop.receive({type:'input',forward:0,strafe:0,yaw:0});const before=tower.hp;
host.GFCoop.receive({type:'action',action:'attack'});assert(tower.hp<before,'guest attack damages the shared tower');const after=tower.hp;host.GFCoop.receive({type:'action',action:'attack'});assert.equal(tower.hp,after,'host enforces guest attack cooldown');
for(let i=0;i<10;i++){now+=16;host.qa.frame(now)}
const copy=guest.qa.state.mobs.find(m=>m.netId===tower.netId);assert.equal(copy.hp,tower.hp,'tower HP is replicated');
assert.equal(guest.qa.state.mobs.length,host.qa.state.mobs.length,'guest must not independently spawn waves');
guest.GFCoop.stop();host.GFCoop.stop();assert(!remote.human);
console.log('PASS: two isolated game peers, guest movement, shared tower damage, server-side cooldown, replicated HP, and disconnect.');
