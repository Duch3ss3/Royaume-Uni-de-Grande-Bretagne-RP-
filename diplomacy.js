function renderDiplomacy(){
 const el=document.getElementById('diplomacy-list');if(!el)return;const q=(document.getElementById('diplo-search')?.value||'').toLowerCase();const f=document.getElementById('diplo-filter')?.value||'all';
 const items=(getData().territories||[]).filter(t=>(t.name||'').toLowerCase().includes(q)&&(f==='all'||t.status===f));
 el.innerHTML=items.length?items.map(t=>`<article class="card"><p class="kicker">${esc(t.status||'neutre')}</p><h3>${flagHTML(t.flag,t.name)}${esc(t.name)}</h3><p><strong>Relation :</strong> ${esc(t.relation||'Normale')}</p><p><strong>Propriétaire :</strong> ${esc(t.owner||'Non renseigné')}</p><p>${esc(t.notes||'')}</p><a class="btn secondary" href="carte.html?territory=${encodeURIComponent(t.id||t.name)}">Voir sur la carte</a></article>`).join(''):'<div class="empty" style="grid-column:1/-1">Aucune relation diplomatique enregistrée.</div>';
}
document.getElementById('diplo-search')?.addEventListener('input',renderDiplomacy);document.getElementById('diplo-filter')?.addEventListener('change',renderDiplomacy);renderDiplomacy();
