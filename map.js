
const COUNTRY_LAYER='https://gisserver.habitat.org/arcgis/rest/services/World_Countries/FeatureServer/0';
const ADMIN1_LAYER='https://gisserver.habitat.org/arcgis/rest/services/WorldStatesAndProvinces/MapServer/0';

const DETAILED_COUNTRIES=new Set([
 'United States of America','United States','Canada','Mexico','Brazil','Argentina',
 'Russian Federation','Russia','China','India','Australia','Indonesia',
 'Germany','France','Spain','Italy','United Kingdom','Türkiye','Turkey',
 'Iran (Islamic Republic of)','Iran','Saudi Arabia','South Africa','Nigeria',
 'Democratic Republic of the Congo','Ethiopia','Pakistan','Japan'
]);

const STATUS_COLORS={national:'#315f94',allie:'#287a55',neutre:'#6e7681',revendique:'#b6903f',hostile:'#9f3030'};
const map=L.map('leaflet-map',{worldCopyJump:true,minZoom:2,maxZoom:10,zoomControl:true}).setView([22,5],2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
  attribution:'&copy; OpenStreetMap &copy; CARTO | Limites : Natural Earth',
  subdomains:'abcd',maxZoom:10
}).addTo(map);

const polygonGroup=L.featureGroup().addTo(map);
const features=[];
const featureLayers=new Map();
const statusEl=document.getElementById('map-status');

async function fetchJson(url){
 const response=await fetch(url);
 if(!response.ok)throw new Error('HTTP '+response.status);
 return response.json();
}
function featureId(f){
 const p=f.properties||{};
 return String(p.hybrid_id||p.FID||p.OBJECTID||f.id);
}
function displayName(f){
 const p=f.properties||{};
 return p.display_name||p.name_fr||p.name||p.NAME||p.ADMIN||p.COUNTRY||`Territoire ${featureId(f)}`;
}
function parentCountry(f){
 const p=f.properties||{};
 return p.parent_country||p.admin||p.COUNTRY||p.ADMIN||displayName(f);
}
function featureType(f){return f.properties?.hybrid_type||'country'}
function linkedTerritory(f){return territoryByRegionId(featureId(f))}
function styleFor(f){
 const t=linkedTerritory(f);
 return {
   color:'#aab2bd',
   weight:featureType(f)==='country'?0.8:0.55,
   fillColor:t?(t.color||STATUS_COLORS[t.status]||STATUS_COLORS.neutre):'#263548',
   fillOpacity:t?.status==='neutre'?.62:.78
 };
}
function addFeature(f){
 features.push(f);
 const wrapper=L.geoJSON(f,{
   style:styleFor,
   onEachFeature:(feature,layer)=>{
     const suffix=featureType(feature)==='admin1'?` — ${parentCountry(feature)}`:'';
     layer.bindTooltip(`${displayName(feature)}${suffix}`,{className:'region-tooltip',sticky:true});
     layer.on('click',()=>showFeature(feature,layer));
   }
 }).addTo(polygonGroup);
 const layer=wrapper.getLayers()[0];
 if(layer)featureLayers.set(featureId(f),layer);
}
async function queryAll(layerUrl,outFields,where='1=1',chunkSize=400){
 const ids=await fetchJson(`${layerUrl}/query?where=${encodeURIComponent(where)}&returnIdsOnly=true&f=json`);
 const result=[];
 const objectIds=ids.objectIds||[];
 for(let i=0;i<objectIds.length;i+=chunkSize){
   const params=new URLSearchParams({
     objectIds:objectIds.slice(i,i+chunkSize).join(','),
     outFields,
     returnGeometry:'true',
     outSR:'4326',
     maxAllowableOffset:'0.035',
     f:'geojson'
   });
   const data=await fetchJson(`${layerUrl}/query?${params}`);
   result.push(...(data.features||[]));
 }
 return result;
}
async function loadHybridMap(){
 statusEl.textContent='Chargement des frontières nationales…';

 // National polygons
 const countries=await queryAll(COUNTRY_LAYER,'*');
 const countryNames=new Set();
 countries.forEach((f,index)=>{
   const p=f.properties||{};
   const name=p.COUNTRY||p.CNTRY_NAME||p.NAME||p.ADMIN||`Pays ${index}`;
   countryNames.add(name);
   if(DETAILED_COUNTRIES.has(name))return;
   p.hybrid_id=`country:${name}`;
   p.hybrid_type='country';
   p.display_name=name;
   p.parent_country=name;
   addFeature(f);
 });

 statusEl.textContent='Chargement des régions stratégiques…';
 // Admin-1 polygons; keep only selected countries
 const admin1=await queryAll(ADMIN1_LAYER,'FID,adm1_code,iso_3166_2,name,name_fr,name_en,admin,type_en');
 admin1.forEach(f=>{
   const p=f.properties||{};
   const country=p.admin||'';
   if(!DETAILED_COUNTRIES.has(country))return;
   p.hybrid_id=`admin1:${p.FID}`;
   p.hybrid_type='admin1';
   p.display_name=p.name_fr||p.name||p.name_en||`Région ${p.FID}`;
   p.parent_country=country;
   addFeature(f);
 });

 statusEl.textContent=`Carte chargée • ${features.length.toLocaleString('fr-FR')} territoires cliquables`;
 openFromQuery();
}
function showFeature(feature,layer){
 if(layer?.getBounds)map.fitBounds(layer.getBounds(),{padding:[35,35],maxZoom:7});
 const t=linkedTerritory(feature);
 const info=document.getElementById('map-info');
 if(!t){
   info.innerHTML=`<p class="kicker">${featureType(feature)==='admin1'?'Région':'Pays'} non configuré</p>
   <h2>${esc(displayName(feature))}</h2>
   <div class="detail-list">
    <div class="detail-row"><strong>Pays de rattachement</strong>${esc(parentCountry(feature))}</div>
    <div class="detail-row"><strong>Niveau cartographique</strong>${featureType(feature)==='admin1'?'Subdivision régionale':'État entier'}</div>
   </div><p>Ce territoire ne possède pas encore de fiche RP dans l’administration.</p>`;
   return;
 }
 const list=(label,arr)=>arr?.length?`<div class="detail-row"><strong>${label}</strong>${arr.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`:'';
 const grouped=(t.regionIds||[]).map(id=>{
   const f=features.find(x=>featureId(x)===String(id));return f?displayName(f):null;
 }).filter(Boolean);
 info.innerHTML=`<div class="map-flag">${flagHTML(t.flag,t.name)}</div><p class="kicker">${esc(t.status||'neutre')}</p><h2>${esc(t.name)}</h2>
 <div class="detail-list">
  <div class="detail-row"><strong>Territoire sélectionné</strong>${esc(displayName(feature))}</div>
  <div class="detail-row"><strong>Propriétaire ou gouvernement</strong>${esc(t.owner||'Non renseigné')}</div>
  <div class="detail-row"><strong>Relation</strong><span class="status ${esc((t.relation||'normale').toLowerCase())}">${esc(t.relation||'Normale')}</span></div>
  <div class="detail-row"><strong>Taxe d’importation</strong>${Number(t.importTax||0).toFixed(1)} %</div>
  <div class="detail-row"><strong>Taxe d’exportation</strong>${Number(t.exportTax||0).toFixed(1)} %</div>
  ${list('Territoires regroupés',grouped)}
  ${list('Traités et accords',t.treaties)}${list('Organisations',t.organizations)}
  ${t.claims?`<div class="detail-row"><strong>Revendications</strong>${esc(t.claims)}</div>`:''}
  ${t.notes?`<div class="detail-row"><strong>Notes RP</strong>${esc(t.notes)}</div>`:''}
 </div>`;
}
function searchFeature(){
 const q=document.getElementById('map-search').value.trim().toLowerCase();
 if(!q)return;
 const f=features.find(x=>
  displayName(x).toLowerCase().includes(q)||
  parentCountry(x).toLowerCase().includes(q)||
  (linkedTerritory(x)?.name||'').toLowerCase().includes(q)
 );
 if(!f)return alert('Aucun territoire correspondant.');
 showFeature(f,featureLayers.get(featureId(f)));
}
function openFromQuery(){
 const wanted=new URLSearchParams(location.search).get('territory');
 if(!wanted)return;
 const t=(getData().territories||[]).find(x=>String(x.id||x.name)===String(wanted)||String(x.name)===String(wanted));
 const id=t?.regionIds?.[0];
 const f=features.find(x=>featureId(x)===String(id));
 if(f)showFeature(f,featureLayers.get(String(id)));
}
document.getElementById('map-search-btn').addEventListener('click',searchFeature);
document.getElementById('map-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchFeature()});
document.getElementById('map-reset').addEventListener('click',()=>map.setView([22,5],2));
loadHybridMap().catch(e=>{
 console.error(e);
 statusEl.textContent='Impossible de charger la carte hybride. Vérifiez la connexion Internet.';
});
