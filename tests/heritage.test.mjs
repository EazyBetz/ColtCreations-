// Run: node tests/heritage.test.mjs /absolute/path/to/three.module.mjs
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const T=await import(pathToFileURL(process.argv[2]).href);const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');globalThis.window=globalThis;
const catalog=fs.readFileSync(path.join(root,'heritage.js'),'utf8');vm.runInThisContext(catalog.slice(0,catalog.indexOf('(function(){')));vm.runInThisContext(fs.readFileSync(path.join(root,'god-appearance.js'),'utf8'));
let count=0;const signatures=new Set();
for(const [heritage,h] of Object.entries(GFHeritages)){
 assert.equal(h.armor.length,3);assert.equal(h.weapons.length,3);
 for(const armor of h.armor)for(const weapon of h.weapons){const c=GFNormalizeHeritage({heritage,heritageArmor:armor[0],heritageWeapon:weapon[0],sex:'Male',body:'Athletic',heritageHelmet:true,armorColor:h.metal,trimColor:h.color,clothColor:h.cloth});globalThis.gfGetConfig=()=>c;const preview=new T.Group(),battle=new T.Group();GFGodAppearance(preview,T,null,null,{config:c});GFGodAppearance(battle,T,null,null,{config:c,weapon:false});
 assert.equal(preview.userData.heritageKey,battle.userData.heritageKey);assert.equal(c.weapon,weapon[3]);const bounds=new T.Box3().setFromObject(preview);assert(Number.isFinite(bounds.max.y)&&bounds.max.y>3&&bounds.max.y<5);let vertices=0;
 preview.traverse(o=>{if(!o.isMesh)return;vertices+=o.geometry.attributes.position.count;for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v),'Non-finite geometry')});assert(vertices>1000);signatures.add(heritage+'/'+armor[0]+'/'+weapon[0]);GFDisposeFigure(preview);GFDisposeFigure(battle);count++;
 }
}
const invalid=GFNormalizeHeritage({heritage:'missing',heritageArmor:'missing',heritageWeapon:'missing'});assert.equal(invalid.heritage,'japan');assert.equal(invalid.heritageArmor,'oyoroi');assert.equal(invalid.heritageWeapon,'katana');assert.equal(signatures.size,54);console.log(`PASS: ${count} regional armor/weapon combinations, shared preview/battle config, finite geometry, 3+3 choices, legacy migration.`);
