
document.querySelectorAll('.admin-nav button').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));
 btn.classList.add('active');
 document.querySelectorAll('.tab').forEach(t=>t.hidden=true);
 document.getElementById('tab-'+btn.dataset.tab).hidden=false;
}));


let allRegions=[];
let selectedRegionIds=new Set();
let activeCountry='';

async function loadRegionMetadata(){
  const results=document.getElementById('region-results');
  try{
    const response=await fetch('regions.geojson');
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    allRegions=(data.features||[]).map(feature=>{
      const p=feature.properties||{};
      return {
        id:`region:${p.region_id}`,
        name:p.name||`Région ${p.region_id}`,
        country:p.country_name||'Pays non renseigné',
        type:p.geographical_area||'Région',
        code:String(p.region_id),
        originalColor:p.region_color_hex||p.country_color||'#6e7681'
      };
    }).sort((a,b)=>a.country.localeCompare(b.country,'fr')||a.name.localeCompare(b.name,'fr'));
    renderCountries();renderRegionResults();
  }catch(error){
    console.error(error);results.innerHTML='<div class="empty">Impossible de charger regions.geojson.</div>';
  }
}
function renderCountries(){
  const countries=[...new Set(allRegions.map(r=>r.country))];
  document.getElementById('region-country-list').innerHTML=
    `<button class="region-country-button ${activeCountry===''?'active':''}" data-country="">Tous les pays</button>`+
    countries.map(c=>`<button class="region-country-button ${activeCountry===c?'active':''}" data-country="${esc(c)}">${esc(c)}</button>`).join('');
  document.querySelectorAll('.region-country-button').forEach(button=>button.onclick=()=>{
    activeCountry=button.dataset.country;renderCountries();renderRegionResults();
  });
}
function renderRegionResults(){
  const q=(document.getElementById('region-search').value||'').trim().toLowerCase();
  const filtered=allRegions.filter(r=>(!activeCountry||r.country===activeCountry)&&(!q||`${r.name} ${r.country} ${r.type} ${r.code}`.toLowerCase().includes(q))).slice(0,700);
  document.getElementById('region-results').innerHTML=filtered.length?filtered.map(r=>`
    <label class="region-row"><input type="checkbox" value="${esc(r.id)}" ${selectedRegionIds.has(r.id)?'checked':''}>
    <span class="region-row-main"><strong>${esc(r.name)}</strong><small>${esc(r.country)} • ${esc(r.type)}</small></span>
    <span class="region-badge">#${esc(r.code)}</span></label>`).join(''):'<div class="empty">Aucune région trouvée.</div>';
  document.querySelectorAll('#region-results input[type=checkbox]').forEach(ch=>ch.onchange=()=>{
    ch.checked?selectedRegionIds.add(ch.value):selectedRegionIds.delete(ch.value);updateSelectedCount();
  });
  updateSelectedCount();
}
function updateSelectedCount(){
  const count=selectedRegionIds.size;
  document.getElementById('selected-region-count').textContent=`${count} sélection${count>1?'s':''}`;
}
document.getElementById('region-search').addEventListener('input',renderRegionResults);

function clearTerritory(){
 ['territory-index','territory-name','territory-flag','territory-owner','territory-import','territory-export','territory-treaties','territory-organizations','territory-claims','territory-notes'].forEach(id=>document.getElementById(id).value='');
 document.getElementById('territory-relation').value='Normale';
 document.getElementById('territory-color').value='#315f94';
 ['territory-my-country','territory-claim','territory-economy','territory-ally','territory-commerce'].forEach(id=>document.getElementById(id).checked=false);
 selectedRegionIds.clear();activeCountry='';renderCountries();renderRegionResults();
}
function renderAdminTerritories(){
 const el=document.getElementById('admin-territory-list');const items=getData().territories||[];
 el.innerHTML=items.length?items.map((t,i)=>`<div class="article-item">
   <p class="kicker">${[t.myCountry?'Mon pays':'',t.claim?'Revendication':'',t.ally?'Allié':'',t.commerce?'Commerce':''].filter(Boolean).join(' • ')||'Carte vierge'} • ${(t.regionIds||[]).length} subdivision(s)</p>
   <h3>${flagHTML(t.flag,t.name)}${esc(t.name)}</h3>
   <p>${esc(t.relation)} • Import ${Number(t.importTax||0)} % • Export ${Number(t.exportTax||0)} %</p>
   <div class="actions"><button class="btn secondary edit-territory" data-i="${i}">Modifier</button><button class="btn secondary delete-territory" data-i="${i}">Supprimer</button></div>
 </div>`).join(''):'<div class="empty">Aucune fiche territoriale configurée.</div>';
 document.querySelectorAll('.delete-territory').forEach(b=>b.onclick=()=>{
   const d=getData();d.territories.splice(+b.dataset.i,1);setData(d);renderAdminTerritories();
 });
 document.querySelectorAll('.edit-territory').forEach(b=>b.onclick=()=>{
   const t=getData().territories[+b.dataset.i];
   document.getElementById('territory-index').value=b.dataset.i;
   document.getElementById('territory-name').value=t.name||'';
   document.getElementById('territory-flag').value=t.flag||'';
   document.getElementById('territory-owner').value=t.owner||'';
   document.getElementById('territory-relation').value=t.relation||'Normale';
   document.getElementById('territory-color').value=t.color||'#315f94';
   document.getElementById('territory-my-country').checked=Boolean(t.myCountry);
   document.getElementById('territory-claim').checked=Boolean(t.claim);
   document.getElementById('territory-economy').checked=Boolean(t.economyEnabled);
   document.getElementById('territory-ally').checked=Boolean(t.ally);
   document.getElementById('territory-commerce').checked=Boolean(t.commerce);
   document.getElementById('territory-import').value=t.importTax||0;
   document.getElementById('territory-export').value=t.exportTax||0;
   document.getElementById('territory-treaties').value=(t.treaties||[]).join('\n');
   document.getElementById('territory-organizations').value=(t.organizations||[]).join('\n');
   document.getElementById('territory-claims').value=t.claims||'';
   document.getElementById('territory-notes').value=t.notes||'';
   selectedRegionIds=new Set((t.regionIds||[]).map(String));
   renderRegionResults();updateSelectedCount();window.scrollTo({top:0,behavior:'smooth'});
 });
}
document.getElementById('save-territory').onclick=()=>{
 const name=document.getElementById('territory-name').value.trim();
 if(!name)return alert('Indique un nom.');
 if(!selectedRegionIds.size)return alert('Sélectionne au moins une subdivision.');
 const d=getData();const idx=document.getElementById('territory-index').value;
 const claimed=new Set();
 d.territories.forEach((t,i)=>{if(String(i)!==String(idx))(t.regionIds||[]).forEach(id=>claimed.add(String(id)))});
 const overlap=[...selectedRegionIds].find(id=>claimed.has(String(id)));
 if(overlap){
   const r=allRegions.find(x=>x.id===String(overlap));
   return alert(`La subdivision « ${r?.name||overlap} » appartient déjà à une autre fiche.`);
 }
 const record={
   id:idx===''?`territory-${Date.now()}`:(d.territories[+idx].id||`territory-${Date.now()}`),
   name,flag:document.getElementById('territory-flag').value.trim(),
   owner:document.getElementById('territory-owner').value.trim(),
   relation:document.getElementById('territory-relation').value,
   color:document.getElementById('territory-color').value,
   myCountry:document.getElementById('territory-my-country').checked,
   claim:document.getElementById('territory-claim').checked,
   economyEnabled:document.getElementById('territory-economy').checked||document.getElementById('territory-ally').checked||document.getElementById('territory-commerce').checked,
   ally:document.getElementById('territory-ally').checked,
   commerce:document.getElementById('territory-commerce').checked,
   importTax:+document.getElementById('territory-import').value||0,
   exportTax:+document.getElementById('territory-export').value||0,
   regionIds:[...selectedRegionIds],
   treaties:lines(document.getElementById('territory-treaties').value),
   organizations:lines(document.getElementById('territory-organizations').value),
   claims:document.getElementById('territory-claims').value.trim(),
   notes:document.getElementById('territory-notes').value.trim()
 };
 if(idx==='')d.territories.push(record);else d.territories[+idx]=record;
 setData(d);clearTerritory();renderAdminTerritories();
};
document.getElementById('clear-territory').onclick=clearTerritory;


let pendingImage='';
document.getElementById('person-image-file').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(file.size>1500000){alert('Choisis une image de moins de 1,5 Mo.');e.target.value='';return}const r=new FileReader();r.onload=()=>pendingImage=r.result;r.readAsDataURL(file)});
function clearPerson(){['person-index','person-name','person-title','person-party','person-bio','person-image-url'].forEach(id=>document.getElementById(id).value='');document.getElementById('person-role').value='roi';document.getElementById('person-image-file').value='';pendingImage=''}
function renderAdminGovernment(){
 const el=document.getElementById('admin-government-list');const items=getData().government||[];
 el.innerHTML=items.length?items.map((p,i)=>`<div class="article-item admin-person">${p.image?`<img src="${esc(p.image)}" alt="">`:'<div class="placeholder-photo" style="width:90px;height:110px">♛</div>'}<div><p class="kicker">${p.role==='roi'?'Roi':p.role==='premiere-ministre'?'Première ministre':'Ministre'}</p><h3>${esc(p.name)}</h3><p>${esc(p.title||'')}</p></div><div class="actions"><button class="btn secondary edit-person" data-i="${i}">Modifier</button><button class="btn secondary delete-person" data-i="${i}">Supprimer</button></div></div>`).join(''):'<div class="empty">Aucune personnalité enregistrée.</div>';
 document.querySelectorAll('.delete-person').forEach(b=>b.onclick=()=>{const d=getData();d.government.splice(+b.dataset.i,1);setData(d);renderAdminGovernment()});
 document.querySelectorAll('.edit-person').forEach(b=>b.onclick=()=>{const p=getData().government[+b.dataset.i];document.getElementById('person-index').value=b.dataset.i;document.getElementById('person-role').value=p.role;document.getElementById('person-name').value=p.name||'';document.getElementById('person-title').value=p.title||'';document.getElementById('person-party').value=p.party||'';document.getElementById('person-bio').value=p.bio||'';document.getElementById('person-image-url').value=p.image&&p.image.startsWith('http')?p.image:'';pendingImage=p.image||''});
}
document.getElementById('save-person').onclick=()=>{const name=document.getElementById('person-name').value.trim();if(!name)return alert('Indique le nom.');const d=getData();const idx=document.getElementById('person-index').value;const url=document.getElementById('person-image-url').value.trim();const p={role:document.getElementById('person-role').value,name,title:document.getElementById('person-title').value.trim(),party:document.getElementById('person-party').value.trim(),bio:document.getElementById('person-bio').value.trim(),image:url||pendingImage};if(idx==='')d.government.push(p);else d.government[+idx]=p;setData(d);clearPerson();renderAdminGovernment()};
document.getElementById('clear-person').onclick=clearPerson;

function renderAdminPublications(){const el=document.getElementById('admin-publication-list');const items=getData().publications;el.innerHTML=items.length?items.map((x,i)=>`<div class="article-item"><strong>${esc(x.type)} — ${esc(x.title)}</strong><p>${esc(x.summary)}</p><button class="btn secondary delete-pub" data-i="${i}">Supprimer</button></div>`).join(''):'<div class="empty">Aucune publication.</div>';document.querySelectorAll('.delete-pub').forEach(b=>b.onclick=()=>{const d=getData();d.publications.splice(+b.dataset.i,1);setData(d);renderAdminPublications()})}
document.getElementById('save-publication').onclick=()=>{const title=document.getElementById('pub-title').value.trim();if(!title)return alert('Indique un titre.');const d=getData();d.publications.push({type:document.getElementById('pub-type').value,date:document.getElementById('pub-date').value,title,summary:document.getElementById('pub-summary').value.trim()});setData(d);renderAdminPublications()};

document.getElementById('export-data').onclick=()=>{const blob=new Blob([JSON.stringify(getData(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='royaume-uni-2308-donnees.json';a.click();URL.revokeObjectURL(a.href)};
document.getElementById('import-data').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setData(JSON.parse(r.result));location.reload()}catch{alert('Fichier invalide')}};r.readAsText(f)};
document.getElementById('reset-data').onclick=()=>{if(confirm('Effacer toutes les données locales ?')){localStorage.removeItem('uk2308_data');location.reload()}};

loadRegionMetadata();renderAdminTerritories();renderAdminGovernment();renderAdminPublications();
