/* Match-only progression. Accounts and cosmetic rewards are independent. */
window.GFMatch={
 maxLevel:30,needed:level=>80+(level-1)*40,
 create:()=>({level:1,xp:0,points:0,ranks:{power:0,vitality:0,guard:0,haste:0}}),
 gain(p,amount){if(!Number.isFinite(amount)||amount<=0||p.level>=30)return 0;p.xp+=amount;let gained=0;while(p.level<30&&p.xp>=this.needed(p.level)){p.xp-=this.needed(p.level);p.level++;p.points++;gained++;}if(p.level===30)p.xp=0;return gained;},
 spend(p,key){if(!Object.hasOwn(p.ranks,key)||p.points<1||p.ranks[key]>=10)return false;p.points--;p.ranks[key]++;return true;},
 branches:{power:['Might','+3 attack and spell power per rank'],vitality:['Vitality','+25 maximum health per rank'],guard:['Resolve','2% incoming damage reduction per rank'],haste:['Mastery','1.5% shorter power cooldowns per rank']},
 items:[
 {name:'Imperial Blade',icon:'⚔',desc:'+12 power each tier',bonus:'spell',costs:[200,400,700]},
 {name:'Oracle Focus',icon:'✦',desc:'5% shorter power cooldowns each tier',bonus:'haste',costs:[200,400,700]},
 {name:'Legion Plate',icon:'⬡',desc:'5% incoming damage reduction each tier',bonus:'armor',costs:[200,400,700]},
 {name:'Titan Heart',icon:'♥',desc:'+75 maximum health each tier',bonus:'health',costs:[200,400,700]},
 {name:'Swiftstep Boots',icon:'➜',desc:'+8% movement each tier',bonus:'speed',costs:[200,400,700]},
 {name:'Laurel Talisman',icon:'❧',desc:'+1.5 health regeneration per second each tier',bonus:'regen',costs:[200,400,700]}
 ]
};
