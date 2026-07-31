document.querySelectorAll('.admin-nav button').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 document.querySelectorAll('.tab').forEach(t=>t.hidden=true);document.getElementById('tab-'+btn.dataset.tab).hidden=false;
}));
function renderAdminEconomy(){
 const el=document.getElementById('admin-economy-list'); const items=getData().economy;
 el.innerHTML=items.length?items.map((x,i)=>`<div class="article-item"><strong>${flagHTML(x.flag,x.name)}${esc(x.name)}</strong><p>${esc(x.relation)} • Import ${x.importTax}% • Export ${x.exportTax}%</p><button class="btn secondary delete-eco" data-i="${i}">Supprimer</button></div>`).join(''):'<div class="empty">Aucun partenaire.</div>';
 document.querySelectorAll('.delete-eco').forEach(b=>b.onclick=()=>{const d=getData();d.economy.splice(+b.dataset.i,1);setData(d);renderAdminEconomy()});
}
document.getElementById('save-economy').onclick=()=>{
 const name=document.getElementById('eco-name').value.trim(); if(!name)return alert('Indique le nom du pays.');
 const d=getData();d.economy.push({name,flag:document.getElementById('eco-flag').value.trim(),relation:document.getElementById('eco-relation').value,importTax:+document.getElementById('eco-import').value||0,exportTax:+document.getElementById('eco-export').value||0,notes:document.getElementById('eco-notes').value.trim()});setData(d);renderAdminEconomy();clearEco();
};
function clearEco(){['eco-name','eco-flag','eco-import','eco-export','eco-notes'].forEach(id=>document.getElementById(id).value='')}
document.getElementById('clear-economy').onclick=clearEco;
function renderAdminPublications(){
 const el=document.getElementById('admin-publication-list'); const items=getData().publications;
 el.innerHTML=items.length?items.map((x,i)=>`<div class="article-item"><strong>${esc(x.type)} — ${esc(x.title)}</strong><p>${esc(x.summary)}</p><button class="btn secondary delete-pub" data-i="${i}">Supprimer</button></div>`).join(''):'<div class="empty">Aucune publication.</div>';
 document.querySelectorAll('.delete-pub').forEach(b=>b.onclick=()=>{const d=getData();d.publications.splice(+b.dataset.i,1);setData(d);renderAdminPublications()});
}
document.getElementById('save-publication').onclick=()=>{
 const title=document.getElementById('pub-title').value.trim();if(!title)return alert('Indique un titre.');
 const d=getData();d.publications.push({type:document.getElementById('pub-type').value,date:document.getElementById('pub-date').value,title,summary:document.getElementById('pub-summary').value.trim()});setData(d);renderAdminPublications();document.getElementById('pub-title').value='';document.getElementById('pub-summary').value='';
};
document.getElementById('export-data').onclick=()=>{
 const blob=new Blob([JSON.stringify(getData(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='royaume-uni-2308-donnees.json';a.click();URL.revokeObjectURL(a.href);
};
document.getElementById('import-data').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setData(JSON.parse(r.result));location.reload()}catch{alert('Fichier invalide')}};r.readAsText(f)};
document.getElementById('reset-data').onclick=()=>{if(confirm('Effacer toutes les données locales ?')){localStorage.removeItem('uk2308_data');location.reload()}};
renderAdminEconomy();renderAdminPublications();
