
const ARC_LAYER='https://gisserver.habitat.org/arcgis/rest/services/WorldStatesAndProvinces/MapServer/0';
const STATUS_COLORS={national:'#315f94',allie:'#287a55',neutre:'#6e7681',revendique:'#b6903f',hostile:'#9f3030'};
const map=L.map('leaflet-map',{worldCopyJump:true,minZoom:2,maxZoom:10,zoomControl:true}).setView([22,5],2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
  attribution:'&copy; OpenStreetMap &copy; CARTO | Frontières administratives : Natural Earth',
  subdomains:'abcd',maxZoom:10
}).addTo(map);

let regionLayer=L.featureGroup().addTo(map);
let regions=[];
let regionLayers=new Map();
const statusEl=document.getElementById('map-status');

async function fetchJson(url){
 const response=await fetch(url);
 if(!response.ok)throw new Error('HTTP '+response.status);
 return response.json();
}
async function loadAdmin1(){
 statusEl.textContent='Récupération de la liste des subdivisions…';
 const idsData=await fetchJson(`${ARC_LAYER}/query?where=1%3D1&returnIdsOnly=true&f=json`);
 const ids=idsData.objectIds||[];
 if(!ids.length)throw new Error('Aucune subdivision reçue');
 statusEl.textContent=`Chargement de ${ids.length.toLocaleString('fr-FR')} subdivisions…`;

 const chunks=[];
 for(let i=0;i<ids.length;i+=350)chunks.push(ids.slice(i,i+350));
 let loaded=0;
 for(const chunk of chunks){
   const params=new URLSearchParams({
     objectIds:chunk.join(','),
     outFields:'FID,adm1_code,iso_3166_2,name,name_fr,name_en,admin,type_en,latitude,longitude',
     returnGeometry:'true',
     outSR:'4326',
     maxAllowableOffset:'0.025',
     f:'geojson'
   });
   const geo=await fetchJson(`${ARC_LAYER}/query?${params.toString()}`);
   (geo.features||[]).forEach(addRegion);
   loaded+=(geo.features||[]).length;
   statusEl.textContent=`${loaded.toLocaleString('fr-FR')} / ${ids.length.toLocaleString('fr-FR')} subdivisions chargées`;
 }
 statusEl.textContent=`${regions.length.toLocaleString('fr-FR')} subdivisions • Cliquez sur une région`;
 applyStoredStyles();
 openFromQuery();
}
function regionName(feature){
 const p=feature.properties||{};
 return p.name_fr||p.name||p.name_en||`Région ${p.FID}`;
}
function regionCountry(feature){return feature.properties?.admin||'Pays non renseigné'}
function regionId(feature){return String(feature.properties?.FID ?? feature.id)}
function styleFor(feature){
 const t=territoryByRegionId(regionId(feature));
 const fill=t?(t.color||STATUS_COLORS[t.status]||STATUS_COLORS.neutre):'#263548';
 return {color:'#aab2bd',weight:.55,fillColor:fill,fillOpacity:t?.status==='neutre'?.62:.78};
}
function addRegion(feature){
 const id=regionId(feature);
 regions.push(feature);
 const layer=L.geoJSON(feature,{
   style:styleFor,
   onEachFeature:(f,l)=>{
     l.bindTooltip(`${regionName(f)} — ${regionCountry(f)}`,{className:'region-tooltip',sticky:true});
     l.on('click',()=>showRegion(f,l));
   }
 }).addTo(regionLayer);
 const actual=layer.getLayers()[0];
 if(actual)regionLayers.set(id,actual);
}
function showRegion(feature,layer){
 const id=regionId(feature),t=territoryByRegionId(id);
 if(layer&&layer.getBounds)map.fitBounds(layer.getBounds(),{padding:[35,35],maxZoom:7});
 const info=document.getElementById('map-info');
 if(!t){
   info.innerHTML=`<p class="kicker">Subdivision non configurée</p><h2>${esc(regionName(feature))}</h2>
   <div class="detail-list"><div class="detail-row"><strong>Pays</strong>${esc(regionCountry(feature))}</div>
   <div class="detail-row"><strong>Type administratif</strong>${esc(feature.properties?.type_en||'Subdivision')}</div></div>
   <p>Cette région n’est encore rattachée à aucune fiche RP dans l’administration.</p>`;
   return;
 }
 const list=(label,arr)=>arr?.length?`<div class="detail-row"><strong>${label}</strong>${arr.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`:'';
 const controlled=(t.regionIds||[]).map(rid=>{
   const f=regions.find(x=>regionId(x)===String(rid));
   return f?regionName(f):null;
 }).filter(Boolean);
 info.innerHTML=`<div class="map-flag">${flagHTML(t.flag,t.name)}</div><p class="kicker">${esc(t.status||'neutre')}</p><h2>${esc(t.name)}</h2>
 <div class="detail-list">
 <div class="detail-row"><strong>Subdivision sélectionnée</strong>${esc(regionName(feature))}</div>
 <div class="detail-row"><strong>Propriétaire ou gouvernement</strong>${esc(t.owner||'Non renseigné')}</div>
 <div class="detail-row"><strong>Relation</strong><span class="status ${esc((t.relation||'normale').toLowerCase())}">${esc(t.relation||'Normale')}</span></div>
 <div class="detail-row"><strong>Taxe d’importation</strong>${Number(t.importTax||0).toFixed(1)} %</div>
 <div class="detail-row"><strong>Taxe d’exportation</strong>${Number(t.exportTax||0).toFixed(1)} %</div>
 ${list('Territoires regroupés',controlled)}
 ${list('Traités et accords',t.treaties)}${list('Organisations',t.organizations)}
 ${t.claims?`<div class="detail-row"><strong>Revendications</strong>${esc(t.claims)}</div>`:''}
 ${t.notes?`<div class="detail-row"><strong>Notes RP</strong>${esc(t.notes)}</div>`:''}
 </div>`;
}
function applyStoredStyles(){
 regionLayers.forEach((layer,id)=>{
   const f=regions.find(x=>regionId(x)===id);
   if(f)layer.setStyle(styleFor(f));
 });
}
function searchRegion(){
 const q=document.getElementById('map-search').value.trim().toLowerCase();
 if(!q)return;
 const f=regions.find(x=>
   regionName(x).toLowerCase().includes(q)||
   regionCountry(x).toLowerCase().includes(q)||
   (territoryByRegionId(regionId(x))?.name||'').toLowerCase().includes(q)
 );
 if(!f)return alert('Aucune subdivision correspondante.');
 const layer=regionLayers.get(regionId(f));
 showRegion(f,layer);
}
function openFromQuery(){
 const wanted=new URLSearchParams(location.search).get('territory');
 if(!wanted)return;
 const t=(getData().territories||[]).find(x=>String(x.id||x.name)===String(wanted)||String(x.name)===String(wanted));
 const rid=t?.regionIds?.[0];
 if(rid){
   const f=regions.find(x=>regionId(x)===String(rid));
   if(f)showRegion(f,regionLayers.get(String(rid)));
 }
}
document.getElementById('map-search-btn').addEventListener('click',searchRegion);
document.getElementById('map-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchRegion()});
document.getElementById('map-reset').addEventListener('click',()=>map.setView([22,5],2));
loadAdmin1().catch(err=>{
 console.error(err);
 statusEl.textContent='Impossible de charger la carte détaillée. Vérifiez la connexion Internet.';
});
