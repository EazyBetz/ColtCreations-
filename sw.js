// Godforged Phase 36: offline-first installable game; updates when connected.
const CACHE='godforged-v46-abilities-sanctuary-bridges';
const CORE=['./heritage.js','./heritage-software.js','./heritage.css','./heritage-viewer.js','./','./index.html','./godforged-home-screen.jpg','./lobby.png','./battle-before-dawn.svg','./combat-overhaul.js','./phase21.js','./god-appearance.js','./regional-abilities.js','./phase22-style.js','./inline0.js','./inline1.js','./inline3.js','./assets/bark.jpg','./assets/foliage.jpg','./assets/iron.jpg','./assets/masonry.jpg','./assets/plaster.jpg','./assets/slate.jpg','./assets/timber.jpg','./models/god_athletic.glb','./models/god_heavy.glb','./models/god_muscular.glb','./models/goddess_athletic.glb','./models/goddess_heavy.glb','./models/goddess_muscular.glb'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(CORE.map(async u=>{const response=await fetch(u,{cache:'reload'});if(response.ok)await cache.put(u,response)}));self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(k=>k.startsWith('godforged-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(!/^https?:$/.test(url.protocol))return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(e.request);
  const isPage=e.request.mode==='navigate';
  if(isPage||url.origin===self.location.origin&&/\.(?:js|css|webmanifest)$/.test(url.pathname)){try{const fresh=await fetch(e.request);if(fresh.ok)await cache.put(e.request,fresh.clone());return fresh}catch{return cached||await cache.match('./index.html')||Response.error()}}
  if(cached){e.waitUntil(fetch(e.request).then(r=>{if(r.ok||r.type==='opaque')return cache.put(e.request,r.clone())}).catch(()=>{}));return cached}
  try{const fresh=await fetch(e.request);if(fresh.ok||fresh.type==='opaque')await cache.put(e.request,fresh.clone());return fresh}catch{return Response.error()}
 })())
});