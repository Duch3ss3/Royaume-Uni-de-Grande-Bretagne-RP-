function renderGovernment(){
 const data=getData().government||[];const leadership=document.getElementById('leadership');const ministers=document.getElementById('minister-list');if(!leadership||!ministers)return;
 const leaders=data.filter(p=>p.role==='roi'||p.role==='premiere-ministre');
 leadership.innerHTML=leaders.length?leaders.map(p=>`<article class="leader-card">${personImage(p,'leader-photo')}<div class="leader-content"><div class="leader-role">${p.role==='roi'?'Sa Majesté le Roi':'Première ministre'}</div><div class="leader-name">${esc(p.name)}</div><h3>${esc(p.title||'')}</h3><p>${esc(p.bio||'')}</p>${p.party?`<p><strong>Appartenance :</strong> ${esc(p.party)}</p>`:''}</div></article>`).join(''):'<div class="empty" style="grid-column:1/-1">Le Roi et la Première ministre n’ont pas encore été renseignés.</div>';
 const cabinet=data.filter(p=>p.role==='ministre');
 ministers.innerHTML=cabinet.length?cabinet.map(p=>`<article class="minister-card">${personImage(p,'minister-photo')}<div class="minister-body"><div class="minister-title">${esc(p.title||'Ministre')}</div><h3>${esc(p.name)}</h3>${p.party?`<p><strong>${esc(p.party)}</strong></p>`:''}<p>${esc(p.bio||'')}</p></div></article>`).join(''):'<div class="empty" style="grid-column:1/-1">Aucun ministre n’a encore été ajouté.</div>';
}
renderGovernment();
