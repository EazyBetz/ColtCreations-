/* Real account identity over the legacy illustrated interface. */
(()=>{
 const $=id=>document.getElementById(id),stage=document.querySelector('.gf43-stage');
 const profile=document.createElement('button');profile.className='live-profile';profile.type='button';profile.innerHTML='<b id="live-profile-name">Sign in</b><span>ACCOUNT LEVEL 0 · XP 0</span><small>VIEW PROFILE</small>';profile.onclick=()=>$('account-profile-button').click();stage.append(profile);
 const balances=document.createElement('div');balances.className='live-balances';balances.innerHTML='<span>GOLD <b>0</b></span><span>GEMS <b>0</b></span><small>Account rewards not enabled</small>';stage.append(balances);
 function sync(){const name=window.GFAccountProfile?.name||'Sign in';$('live-profile-name').textContent=name;$('gf41-name').textContent=name;$('match-profile-name').textContent='Playing as '+name;}
 window.addEventListener('gf-profile-change',sync);sync();
 function label(id,title,detail){const b=$(id);b.classList.add('live-tile');b.replaceChildren();const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=title;small.textContent=detail;b.append(strong,small);b.setAttribute('aria-label',title+' · '+detail);}
 $('gf41-settings').disabled=true;$('gf41-settings').tabIndex=-1;
 label('gf41-pass','BATTLE PASS','NOT AVAILABLE');label('gf41-store','MATCH SHOP','Purchase gear in your sanctuary');label('gf36-friends-open','FRIENDS','Requests · messages · parties');label('gf43-settings','INSTALL GAME','Add to your home screen');label('gf43-exit','EXIT','Close your browser tab');label('gf43-daily','DAILY REWARDS','Not available yet');label('gf43-rewards','ACCOUNT PROGRESSION','Level 0 · XP 0 / Rewards not enabled');label('gf43-invite','INVITE FRIEND','Private two-player co-op');
 document.querySelectorAll('[data-choose-mode]').forEach(b=>{const name=b.dataset.chooseMode;b.classList.add('live-tile');b.textContent=name==='Conquest Training'?'CONQUEST TRAINING':name==='Combat Arena'?'ARENA · UNAVAILABLE':'CUSTOM · UNAVAILABLE';if(name!=='Conquest Training'){b.disabled=true;b.removeAttribute('data-go');}});
 $('gf43-settings').onclick=()=>$('gf36-install').click();
 $('gf43-daily').onclick=()=>$('gf41-pass').click();
})();
