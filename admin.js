document.querySelectorAll('.admin-nav button').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 document.querySelectorAll('.tab').forEach(t=>t.hidden=true);document.getElementById('tab-'+btn.dataset.tab).hidden=false;
}));

let pendingImage='';
document.getElementById('person-image-file').addEventListener('change',e=>{
 const file=e.target.files[0]; if(!file)return;
 if(file.size>1500000){alert('Choisis une image de moins de 1,5 Mo.');e.target.value='';return;}
 const reader=new FileReader();reader.onload=()=>pendingImage=reader.result;reader.readAsDataURL(file);
});
function clearPerson(){
 ['person-index','person-name','person-title','person-party','person-bio','person-image-url'].forEach(id=>document.getElementById(id).value='');
 document.getElementById('person-role').value='roi';document.getElementById('person-image-file').value='';pendingImage='';
}
function renderAdminGovernment(){
 const el=document.getElementById('admin-government-list');const items=getData().government||[];
 el.innerHTML=items.length?items.map((p,i)=>`<div class="article-item admin-person">
 ${p.image?`<img src="${esc(p.image)}" alt="">`:'<div class="placeholder-photo" style="width:90px;height:110px">♛</div>'}
 <div><p class="kicker">${p.role==='roi'?'Roi':p.role==='premiere-ministre'?'Première ministre':'Ministre'}</p><h3>${esc(p.name)}</h3><p>${esc(p.title||'')}</p></div>
 <div class="actions"><button class="btn secondary edit-person" data-i="${i}">Modifier</button><button class="btn secondary delete-person" data-i="${i}">Supprimer</button></div></div>`).join(''):'<div class="empty">Aucune personnalité enregistrée.</div>';
 document.querySelectorAll('.delete-person').forEach(b=>b.onclick=()=>{const d=getData();d.government.splice(+b.dataset.i,1);setData(d);renderAdminGovernment()});
 document.querySelectorAll('.edit-person').forEach(b=>b.onclick=()=>{const p=getData().government[+b.dataset.i];document.getElementById('person-index').value=b.dataset.i;document.getElementById('person-role').value=p.role;document.getElementById('person-name').value=p.name||'';document.getElementById('person-title').value=p.title||'';document.getElementById('person-party').value=p.party||'';document.getElementById('person-bio').value=p.bio||'';document.getElementById('person-image-url').value=p.image&&p.image.startsWith('http')?p.image:'';pendingImage=p.image||'';window.scrollTo({top:0,behavior:'smooth'})});
}
document.getElementById('save-person').onclick=()=>{
 const name=document.getElementById('person-name').value.trim();if(!name)return alert('Indique le nom de la personnalité.');
 const d=getData();const idx=document.getElementById('person-index').value;
 const url=document.getElementById('person-image-url').value.trim();
 const person={role:document.getElementById('person-role').value,name,title:document.getElementById('person-title').value.trim(),party:document.getElementById('person-party').value.trim(),bio:document.getElementById('person-bio').value.trim(),image:url||pendingImage};
 if(idx==='')d.government.push(person);else d.government[+idx]=person;
 setData(d);clearPerson();renderAdminGovernment();
};
document.getElementById('clear-person').onclick=clearPerson;

function renderAdminEconomy(){
 const el=document.getElementById('admin-economy-list'); const items=getData().economy;
 el.innerHTML=items.length?items.map((x,i)=>`<div class="article-item"><strong>${flagHTML(x.flag,x.name)}${esc(x.name)}</strong><p>${esc(x.relation)} • Import ${x.importTax}% • Export ${x.exportTax}%</p><button class="btn secondary delete-eco" data-i="${i}">Supprimer</button></div>`).join(''):'<div class="empty">Aucun partenaire.</div>';
 document.querySelectorAll('.delete-eco').forEach(b=>b.onclick=()=>{const d=getData();d.economy.splice(+b.dataset.i,1);setData(d);renderAdminEconomy()});
}
document.getElementById('save-economy').onclick=()=>{
 const name=document.getElementById('eco-name').value.trim(); if(!name)return alert('Indique le nom du pays.');
 const d=getData();d.economy.push({name,flag:document.getElementById('eco-flag').value.trim(),relation:document.getElementById('eco-relation').value,importTax:+document.getElementById('eco-import').value||0,exportTax:+document.getElementById('eco-export').value||0,notes:document.getElementById('eco-notes').value.trim()});setData(d);renderAdminEconomy();
};
document.getElementById('clear-economy').onclick=()=>['eco-name','eco-flag','eco-import','eco-export','eco-notes'].forEach(id=>document.getElementById(id).value='');

function renderAdminPublications(){
 const el=document.getElementById('admin-publication-list'); const items=getData().publications;
 el.innerHTML=items.length?items.map((x,i)=>`<div class="article-item"><strong>${esc(x.type)} — ${esc(x.title)}</strong><p>${esc(x.summary)}</p><button class="btn secondary delete-pub" data-i="${i}">Supprimer</button></div>`).join(''):'<div class="empty">Aucune publication.</div>';
 document.querySelectorAll('.delete-pub').forEach(b=>b.onclick=()=>{const d=getData();d.publications.splice(+b.dataset.i,1);setData(d);renderAdminPublications()});
}
document.getElementById('save-publication').onclick=()=>{
 const title=document.getElementById('pub-title').value.trim();if(!title)return alert('Indique un titre.');
 const d=getData();d.publications.push({type:document.getElementById('pub-type').value,date:document.getElementById('pub-date').value,title,summary:document.getElementById('pub-summary').value.trim()});setData(d);renderAdminPublications();
};
document.getElementById('export-data').onclick=()=>{
 const blob=new Blob([JSON.stringify(getData(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='royaume-uni-2308-donnees.json';a.click();URL.revokeObjectURL(a.href);
};
document.getElementById('import-data').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setData(JSON.parse(r.result));location.reload()}catch{alert('Fichier invalide')}};r.readAsText(f)};
document.getElementById('reset-data').onclick=()=>{if(confirm('Effacer toutes les données locales ?')){localStorage.removeItem('uk2308_data');location.reload()}};
renderAdminGovernment();renderAdminEconomy();renderAdminPublications();
