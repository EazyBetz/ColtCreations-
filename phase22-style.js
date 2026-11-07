// Shared customization for editor and battlefield. Original GLB meshes remain intact.
window.GF22Style = function(root,cfg,T){
 const col=(value,fallback)=>{try{return new T.Color(value||fallback)}catch{return new T.Color(fallback)}};
 const skin=col(cfg.skin,'#bd8565'),hair=col(cfg.hairColor,'#e2c68b'),armor=col(cfg.armorColor,'#7e608e'),trim=col(cfg.trimColor,'#d9ad55'),cloth=col(cfg.clothColor,'#342245'),eyes=col(cfg.eyeColor,'#b3e7ff'),weapon=col(cfg.weaponColor,'#cbb8ff'),mark=col(cfg.markColor,'#d8c4f4');
 root.traverse(n=>{if(!n.isMesh)return;const name=(n.name||'').toLowerCase();if(!n.userData.gf22base){n.userData.gf22base=n.scale.clone();n.userData.gf22material=n.material.clone()}n.scale.copy(n.userData.gf22base);n.material=n.userData.gf22material.clone();let c=skin;
 if(/hair|brow/.test(name))c=hair;else if(/iris|eye/.test(name))c=eyes;else if(/gem/.test(name))c=mark;else if(/crown|belt|bracer|pauldron/.test(name))c=trim;else if(/armor|plate|boot|greave|weapon_shaft/.test(name))c=armor;else if(/blade/.test(name))c=weapon;else if(/pelvis/.test(name))c=cloth;
 if(n.material.color)n.material.color.copy(c);n.castShadow=true;
 const face=cfg.face||'Regal';if(/jaw/.test(name))n.scale.x*=/Square Jaw|Heroic|Warrior/.test(face)?1.28:/Heart|Sharp/.test(face)?.82:1;if(/nose/.test(name))n.scale.z*=/Sharp|Gothic/.test(face)?1.3:1;
 if(/hair_crest/.test(name))n.visible=cfg.hair!=='Bald'&&cfg.hair!=='Short';else if(/hair_cap/.test(name))n.visible=cfg.hair!=='Bald';else if(/crown/.test(name))n.visible=cfg.helm!=='None'&&cfg.helm!=='Bare';else if(/weapon_blade/.test(name))n.visible=cfg.weapon!=='Staff';else n.visible=true;
 if(/torso|chest_armor|abdomen/.test(name))n.scale.x*=cfg.body==='Bodybuilder'?1.19:cfg.body==='Muscular'?1.1:cfg.body==='Slender'?.85:1;
 if(/bicep|upper_arm/.test(name))n.scale.x*=cfg.body==='Bodybuilder'?1.3:cfg.body==='Muscular'?1.16:cfg.body==='Slender'?.8:1;
 if(/abdomen|pelvis/.test(name))n.scale.x*=cfg.body==='Heavyset'||cfg.body==='Big Belly'?1.3:1;
 });
};
